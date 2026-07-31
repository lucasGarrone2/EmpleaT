import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';
import { User, Briefcase, Clock, FileText, ArrowLeft, BrainCircuit, MapPin, CheckCircle, XCircle, Rocket, PartyPopper, MessageSquare, Send, CalendarCheck } from 'lucide-react';
import ChatPostulacion from '../components/ChatPostulacion';
import './Register.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PerfilCandidatoParaEmpresa() {
    const { ofertaId, candidatoId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const showAlert = useAlert();

    const [loading, setLoading] = useState(true);
    const [candidato, setCandidato] = useState(null);
    const [candidatoSkills, setCandidatoSkills] = useState([]);
    const [ofertaSkills, setOfertaSkills] = useState([]);
    const [error, setError] = useState(null);

    // ATS Pipeline states
    const [estadoPostulacion, setEstadoPostulacion] = useState('postulado');
    const [postulacionId, setPostulacionId] = useState(null);
    const [candidatoNombre, setCandidatoNombre] = useState('');

    // Chat
    const [mostrarChat, setMostrarChat] = useState(false);
    const [ofertaInfo, setOfertaInfo] = useState(null);

    // ActionModal: modal unificado para todas las acciones ATS
    const [actionModal, setActionModal] = useState(null); // null | { tipo, titulo, mensajePre, mostrarMotivo }
    const [actionMensaje, setActionMensaje] = useState('');
    const [actionMotivoId, setActionMotivoId] = useState('');
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [rejectionReasons, setRejectionReasons] = useState([]);

    useEffect(() => {
        const fetchRejectionReasons = async () => {
            try {
                const { data, error } = await supabase
                    .from('motivos_rechazo')
                    .select('*')
                    .order('id', { ascending: true });
                if (!error && data && data.length > 0) {
                    setRejectionReasons(data);
                } else {
                    setRejectionReasons([
                        { id: 1, descripcion: 'No cumple con los requisitos técnicos' },
                        { id: 2, descripcion: 'Pretensión salarial fuera de rango' },
                        { id: 3, descripcion: 'Ubicación o modalidad incompatible' },
                        { id: 4, descripcion: 'No superó la entrevista técnica / IA' },
                        { id: 5, descripcion: 'Otro motivo' }
                    ]);
                }
            } catch (err) {
                console.error("Error al cargar motivos de rechazo:", err);
                setRejectionReasons([
                    { id: 1, descripcion: 'No cumple con los requisitos técnicos' },
                    { id: 2, descripcion: 'Pretensión salarial fuera de rango' },
                    { id: 3, descripcion: 'Ubicación o modalidad incompatible' },
                    { id: 4, descripcion: 'No superó la entrevista técnica / IA' },
                    { id: 5, descripcion: 'Otro motivo' }
                ]);
            }
        };
        fetchRejectionReasons();
    }, []);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchDetalle = async () => {
            try {
                // 1. Obtener la oferta para ver las skills deseadas 
                const { data: ofData, error: ofError } = await supabase
                    .from('ofertas')
                    .select(`
                        id, empresa_id, titulo, seniority,
                        oferta_skills (
                            skill_id,
                            nombre_original,
                            nivel_requerido,
                            diccionario_skills (nombre_skill)
                        )
                    `)
                    .eq('id', ofertaId)
                    .single();

                if (ofError || !ofData) throw new Error("Oferta no encontrada");
                setOfertaInfo(ofData);

                // Verificar que el usuario pertenece a la empresa de esta oferta
                const { data: miembroData } = await supabase
                    .from('empresa_miembros')
                    .select('empresa_id')
                    .eq('auth_id', user.id)
                    .maybeSingle();
 
                if (!miembroData || miembroData.empresa_id !== ofData.empresa_id) {
                    throw new Error("No tienes permiso para ver esta información");
                }

                // VALIDACIÓN IDOR: ¿El candidato realmente se postuló a esta oferta?
                const { data: postulacionValida, error: postErr } = await supabase
                    .from('postulaciones')
                    .select('id, estado')
                    .eq('oferta_id', ofertaId)
                    .eq('candidato_id', candidatoId)
                    .maybeSingle();

                if (postErr || !postulacionValida) {
                    throw new Error("Acceso Denegado: Este perfil es privado porque el candidato no aplicó a tu oferta.");
                }

                setPostulacionId(postulacionValida.id);
                setEstadoPostulacion(postulacionValida.estado || 'postulado');

                setOfertaSkills(ofData.oferta_skills || []);

                // 2. Obtener la info general del candidato
                const { data: candData, error: candError } = await supabase
                    .from('candidatos')
                    .select('*')
                    .eq('id', candidatoId)
                    .single();

                if (candError || !candData) throw new Error("Candidato no encontrado");
                setCandidato(candData);
                setCandidatoNombre(candData.nombre_completo || 'el candidato');

                // 3. Obtener las skills del candidato
                const { data: skillsData, error: skillsError } = await supabase
                    .from('candidato_skills')
                    .select(`
                        skill_id,
                        nivel_estimado,
                        nombre_original,
                        diccionario_skills ( nombre_skill )
                    `)
                    .eq('candidato_id', candidatoId);

                if (!skillsError && skillsData) {
                    setCandidatoSkills(skillsData);
                } else if (skillsError) {
                    console.error("Error fetching skills", skillsError);
                }
                
            } catch (err) {
                console.error("Error al obtener perfil del candidato", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [ofertaId, candidatoId, user, navigate]);


    // Abre el ActionModal con la config correcta según el tipo de acción
    const abrirActionModal = (tipo) => {
        const nombre = candidatoNombre || 'el candidato';
        const configs = {
            invitar_entrevista: {
                tipo: 'invitar_entrevista',
                titulo: '📅 Invitar a entrevista',
                mensajePre: `Hola ${nombre}, tu perfil nos interesó y queremos coordinar una entrevista. ¿Qué disponibilidad tenés esta semana?`,
                mostrarMotivo: false
            },
            rechazar: {
                tipo: 'rechazar',
                titulo: '❌ Descartar candidato',
                mensajePre: `Hola ${nombre}, gracias por tu interés en la posición. En esta oportunidad decidimos avanzar con otro perfil.`,
                mostrarMotivo: true
            },
            mensaje: {
                tipo: 'mensaje',
                titulo: '💬 Enviar mensaje',
                mensajePre: '',
                mostrarMotivo: false
            }
        };
        setActionModal(configs[tipo]);
        setActionMensaje(configs[tipo].mensajePre);
        setActionMotivoId('');
    };

    // Ejecuta la acción contra el backend (atómica: estado + mensaje)
    const handleConfirmAction = async () => {
        if (!actionModal || !postulacionId) return;
        if (!actionMensaje.trim()) {
            showAlert('El mensaje no puede estar vacío.', 'Atención', 'warning');
            return;
        }
        if (actionModal.mostrarMotivo && !actionMotivoId) {
            showAlert('Por favor seleccioná el motivo de rechazo.', 'Atención', 'warning');
            return;
        }

        setIsSubmittingAction(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API_URL}/api/postulaciones/${postulacionId}/accion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    tipo_accion: actionModal.tipo,
                    mensaje: actionMensaje.trim(),
                    ...(actionMotivoId && { motivo_rechazo_id: actionMotivoId })
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al ejecutar la acción.');

            setEstadoPostulacion(data.nuevo_estado);
            setActionModal(null);
            setActionMensaje('');
            setActionMotivoId('');
            // Mostrar chat automáticamente tras la primera acción
            setMostrarChat(true);
            showAlert('Acción realizada con éxito.', '¡Listo!', 'success');
        } catch (err) {
            console.error('Error en acción ATS:', err);
            showAlert(err.message, 'Error', 'error');
        } finally {
            setIsSubmittingAction(false);
        }
    };

    const handleCancelAction = () => {
        setActionModal(null);
        setActionMensaje('');
        setActionMotivoId('');
    };


    if (loading) {
        return (
            <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Cargando perfil del postulante...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-dark)' }}>{error}</h2>
                <Link to={`/oferta-empresa/${ofertaId}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Volver a la oferta</Link>
            </div>
        );
    }

    // Calcular match de skills
    const synonymMap = {
        'sql': ['mysql', 'postgresql', 'sql server', 'oracle', 'pl/sql'],
        'mysql': ['sql', 'base de datos', 'mariadb'],
        'postgresql': ['sql', 'base de datos'],
        'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'nube'],
        'aws': ['cloud', 'nube', 'amazon web services'],
        'azure': ['cloud', 'nube', 'microsoft azure'],
        'gcp': ['cloud', 'nube', 'google cloud'],
        'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'js'],
        'backend': ['node', 'java', 'python', 'c#', 'php', 'ruby', 'go', 'express', 'spring boot'],
        'javascript': ['js', 'typescript', 'react', 'node', 'vue', 'angular', 'frontend'],
        'js': ['javascript', 'typescript', 'frontend'],
        'react': ['javascript', 'frontend', 'reactjs', 'react.js'],
        'java': ['spring', 'backend', 'java ee', 'springboot', 'spring boot'],
        'python': ['django', 'flask', 'backend', 'machine learning', 'data science', 'fastapi'],
        'arquitectura': ['backend', 'microservicios', 'cloud', 'aws', 'java', 'spring boot', 'spring', 'node', 'nodejs', 'express', 'c#', '.net', 'python', 'docker', 'system design', 'desarrollo de software'],
        'software': ['desarrollo de software', 'programacion', 'aplicaciones', 'coding', 'backend', 'frontend', 'full stack', 'java', 'python', 'c#', 'javascript', 'js', 'node'],
        'microservicios': ['microservices', 'backend', 'spring boot', 'springboot', 'spring', 'node', 'nodejs', 'express', 'docker', 'kubernetes', 'api', 'rest', 'java', 'c#'],
        'ci/cd': ['devops', 'docker', 'kubernetes', 'github', 'gitlab', 'jenkins', 'aws', 'cloud', 'git', 'github actions', 'terraform', 'ansible'],
        'clean code': ['buenas practicas', 'testing', 'refactoring', 'solid', 'patrones de diseño', 'code review', 'backend', 'frontend', 'desarrollo de software'],
        'buenas practicas': ['clean code', 'solid', 'patrones de diseño', 'testing', 'code review'],
        'patrones de diseño': ['clean code', 'solid', 'design patterns', 'java', 'c#', 'typescript', 'backend', 'arquitectura'],
        'design patterns': ['patrones de diseño', 'clean code', 'solid', 'arquitectura'],
        'solid': ['clean code', 'patrones de diseño', 'java', 'c#', 'typescript', 'backend'],
        'rest api': ['api', 'api rest', 'restful', 'express', 'spring boot', 'fastapi', 'node', 'backend', 'endpoints', 'web services'],
        'api rest': ['rest api', 'api', 'express', 'spring boot', 'fastapi', 'node', 'backend'],
        'liderazgo tecnico': ['tech lead', 'scrum', 'agile', 'senior', 'arquitectura', 'code review'],
        'tech lead': ['liderazgo tecnico', 'scrum', 'agile', 'senior', 'arquitectura'],
        'base de datos relacional': ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'sql server', 'base de datos'],
        'base de datos no relacional': ['nosql', 'mongodb', 'redis', 'cassandra', 'dynamodb', 'firebase', 'base de datos'],
        'infraestructura': ['devops', 'cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'linux', 'sysadmin', 'terraform']
    };

    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

    const clasificarSkills = () => {
        return candidatoSkills.map(cs => {
            const csStr = normalize(cs.nombre_original) || normalize(cs.diccionario_skills?.nombre_skill);
            const csNameDisplay = cs.nombre_original || cs.diccionario_skills?.nombre_skill || 'Habilidad Desconocida';
            const nivelCand = cs.nivel_estimado || 3;

            if (ofertaSkills.length === 0) return { ...cs, isMatch: false, contribution: 0, displayName: csNameDisplay, levelInfo: null };

            let isMatch = false;
            let contribution = 0;
            let levelInfo = null;

            for (const req of ofertaSkills) {
                let found = false;
                if (cs.skill_id && cs.skill_id === req.skill_id) found = true;
                if (!found) {
                    const reqStr = normalize(req.nombre_original) || normalize(req.diccionario_skills?.nombre_skill);
                    if (!csStr || !reqStr) continue;
                    if (csStr === reqStr) found = true;
                    if (!found) {
                        const minLen = Math.min(csStr.length, reqStr.length);
                        if (minLen >= 3 && (csStr.includes(reqStr) || reqStr.includes(csStr))) found = true;
                    }
                    if (!found) {
                        const reqSynonyms = synonymMap[reqStr] || [];
                        const csSynonyms = synonymMap[csStr] || [];
                        if (reqSynonyms.some(syn => csStr.includes(syn) || syn.includes(csStr))) found = true;
                        if (!found && csSynonyms.some(syn => reqStr.includes(syn) || syn.includes(reqStr))) found = true;
                    }
                }

                if (found) {
                    const nivelReq = req.nivel_requerido || null;
                    const isJuniorOffer = (ofertaInfo?.seniority || '').toLowerCase().includes('junior') || 
                                          (ofertaInfo?.seniority || '').toLowerCase().includes('trainee') || 
                                          (ofertaInfo?.titulo || '').toLowerCase().includes('junior') || 
                                          (ofertaInfo?.titulo || '').toLowerCase().includes('trainee');
                    let pct;
                    if (!nivelReq || isJuniorOffer) {
                        pct = 100;
                    } else {
                        const diff = nivelReq - nivelCand;
                        if (diff <= 0) pct = 100;
                        else if (diff === 1) pct = 85;
                        else if (diff === 2) pct = 60;
                        else pct = 30;
                    }
                    contribution = pct;
                    isMatch = true;
                    levelInfo = nivelReq ? { candLvl: nivelCand, reqLvl: nivelReq, pct } : null;
                    break;
                }
            }

            return { ...cs, isMatch, contribution, displayName: csNameDisplay, levelInfo };
        });
    };

    const skillsClasificadas = clasificarSkills();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
            <button 
                onClick={() => navigate(`/oferta-empresa/${ofertaId}`)}
                style={{ 
                    background: 'none', border: 'none', color: 'var(--text-gray)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 'bold', padding: 0, marginBottom: '2rem', fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} /> Volver a postulantes
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Cabecera del Candidato */}
                <div style={{ 
                    background: 'var(--bg-white)', 
                    padding: '2.5rem', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(0,0,0,0.05)', 
                    boxShadow: '0 5px 15px rgba(0,0,0,0.02)', 
                    display: 'flex', 
                    gap: '2.5rem', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                }}>
                    {/* Columna Izquierda: Avatar, Nombre e Info + CV */}
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 500px' }}>
                        <div style={{ 
                            width: '90px', 
                            height: '90px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, rgba(0,214,107,0.1) 0%, rgba(0,153,77,0.1) 100%)',
                            color: 'var(--primary)', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            fontSize: '2.5rem', 
                            fontWeight: 'bold', 
                            overflow: 'hidden',
                            flexShrink: 0
                        }}>
                            {candidato.foto_url ? (
                                <img src={candidato.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                candidato.nombre_completo.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div style={{ flex: '1 1 300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-dark)' }}>{candidato.nombre_completo}</h1>
                                {candidato.es_premium && (
                                    <span style={{ padding: '2px 8px', background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', color: 'white', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                        PREMIUM
                                    </span>
                                )}
                            </div>
                            <div style={{ color: 'var(--text-gray)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={18}/> {candidato.titulo_profesional || 'Profesional'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18}/> {candidato.anios_experiencia} años exp.</span>
                                {candidato.ubicacion && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={18}/> {candidato.ubicacion}</span>}
                            </div>

                            {/* Widget de Descarga de CV */}
                            <div style={{ maxWidth: '350px' }}>
                                {candidato.cv_url ? (
                                    <div 
                                        onClick={async () => {
                                            try {
                                                const { data, error } = await supabase.storage.from('cv_files').download(candidato.cv_url);
                                                if (error) throw error;
                                                const url = URL.createObjectURL(data);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = candidato.cv_url.split('/').pop() || 'curriculum.pdf';
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            } catch (err) {
                                                console.error('Error al descargar CV:', err);
                                                showAlert("No se pudo descargar el archivo.", "Error", "error");
                                            }
                                        }}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px', 
                                            background: 'rgba(0,214,107,0.03)', 
                                            padding: '10px 14px', 
                                            borderRadius: '12px', 
                                            border: '1px dashed rgba(0,214,107,0.3)', 
                                            cursor: 'pointer', 
                                            transition: 'all 0.2s' 
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.background = 'rgba(0,214,107,0.08)';
                                            e.currentTarget.style.borderStyle = 'solid';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.background = 'rgba(0,214,107,0.03)';
                                            e.currentTarget.style.borderStyle = 'dashed';
                                        }}
                                        title="Descargar CV del candidato"
                                    >
                                        <FileText size={18} color="var(--primary)" />
                                        <span style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                                            Descargar CV (PDF)
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f5f5f5', padding: '10px 14px', borderRadius: '12px', border: '1px dashed #ccc' }}>
                                        <FileText size={18} color="#999" />
                                        <span style={{ fontWeight: '500', color: '#999', fontSize: '0.9rem' }}>Ningún CV cargado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Panel de ATS y Contacto Seguro */}
                    <div style={{
                        flex: '1 1 320px',
                        background: 'rgba(0,214,107,0.02)',
                        border: '1px solid rgba(0,214,107,0.12)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                    }}>
                        {/* Header con estado */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,214,107,0.08)', paddingBottom: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Proceso de Selección
                            </span>
                            {(() => {
                                const normalized = estadoPostulacion?.toLowerCase();
                                if (normalized === 'postulado') return <span style={{ padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Postulado</span>;
                                if (normalized === 'en revisión' || normalized === 'en_revision' || normalized === 'en revision') return <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#b45309', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>CV Visto</span>;
                                if (normalized === 'entrevista') return <span style={{ padding: '4px 10px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>En Entrevista</span>;
                                if (normalized === 'seleccionado' || normalized === 'contratado') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>¡Seleccionado! <PartyPopper size={12} /></span>;
                                if (normalized === 'rechazado') return <span style={{ padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Finalizado</span>;
                                return <span style={{ padding: '4px 10px', background: '#f3f4f6', color: '#374151', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>{estadoPostulacion}</span>;
                            })()}
                        </div>

                        {/* Email: visible SOLO desde Entrevista en adelante */}
                        {(() => {
                            const normalized = estadoPostulacion?.toLowerCase();
                            const emailVisible = ['entrevista', 'seleccionado', 'contratado'].includes(normalized);
                            if (emailVisible && candidato.email) {
                                return (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'rgba(0,214,107,0.04)', padding: '10px 14px',
                                        borderRadius: '10px', border: '1px solid rgba(0,214,107,0.15)'
                                    }}>
                                        <a href={`mailto:${candidato.email}`}
                                            style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}
                                            title="Enviar correo electrónico directo">
                                            📧 {candidato.email}
                                        </a>
                                        <button onClick={() => { navigator.clipboard.writeText(candidato.email); showAlert('¡Email copiado!', 'Copiado', 'success'); }}
                                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'underline' }}>
                                            Copiar
                                        </button>
                                    </div>
                                );
                            }
                            if (!emailVisible) {
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.85rem' }}>
                                        🔒 Email disponible al invitar a entrevista
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Botones de acción ATS */}
                        {['rechazado', 'seleccionado', 'contratado'].includes(estadoPostulacion?.toLowerCase()) ? (
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-gray)', textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>
                                El proceso de selección ha concluido.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {estadoPostulacion?.toLowerCase() !== 'entrevista' && (
                                    <button
                                        id="btn-invitar-entrevista"
                                        onClick={() => abrirActionModal('invitar_entrevista')}
                                        style={{
                                            background: 'var(--primary)', color: 'white', border: 'none',
                                            borderRadius: '12px', padding: '11px 14px', fontSize: '0.9rem',
                                            fontWeight: 'bold', cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', gap: '7px',
                                            transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,214,107,0.2)'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,214,107,0.3)'; }}
                                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,214,107,0.2)'; }}
                                    >
                                        <CalendarCheck size={16} /> Invitar a entrevista
                                    </button>
                                )}
                                <button
                                    id="btn-enviar-mensaje"
                                    onClick={() => { abrirActionModal('mensaje'); }}
                                    style={{
                                        background: 'rgba(0,214,107,0.08)', color: 'var(--primary)', border: '1px solid rgba(0,214,107,0.25)',
                                        borderRadius: '12px', padding: '11px 14px', fontSize: '0.9rem',
                                        fontWeight: 'bold', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(0,214,107,0.14)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(0,214,107,0.08)'}
                                >
                                    <MessageSquare size={16} /> Enviar mensaje
                                </button>
                                <button
                                    id="btn-rechazar-candidato"
                                    onClick={() => abrirActionModal('rechazar')}
                                    style={{
                                        background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)',
                                        borderRadius: '12px', padding: '11px 14px', fontSize: '0.9rem',
                                        fontWeight: 'bold', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(220,38,38,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                                >
                                    <XCircle size={16} /> Descartar candidato
                                </button>
                            </div>
                        )}

                        {/* Toggle del chat */}
                        <button
                            onClick={() => setMostrarChat(v => !v)}
                            style={{
                                background: 'none', border: '1px dashed rgba(0,0,0,0.15)', borderRadius: '10px',
                                padding: '8px 12px', fontSize: '0.82rem', color: 'var(--text-gray)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                justifyContent: 'center', transition: 'all 0.2s', marginTop: '4px'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'}
                        >
                            <MessageSquare size={14} />
                            {mostrarChat ? 'Ocultar conversación' : 'Ver conversación'}
                        </button>
                    </div>
                </div>

                {/* Sobre Mí */}
                <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.3rem', margin: '0 0 1rem 0' }}>
                        <User size={24} /> Sobre el Candidato
                    </h3>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {candidato.sobre_mi ? candidato.sobre_mi : <span style={{ fontStyle: 'italic', opacity: 0.6 }}>El candidato no ha añadido una descripción personal.</span>}
                    </p>
                </div>

                {/* Skills Match */}
                <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', margin: 0, fontSize: '1.3rem' }}>
                            <BrainCircuit size={24} /> Habilidades Detectadas
                        </h3>
                    </div>
                    
                    {skillsClasificadas.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {skillsClasificadas.map((sk, index) => {
                                const isMatch = sk.isMatch;
                                const li = sk.levelInfo;
                                return (
                                    <span key={index} style={{
                                        backgroundColor: isMatch ? (sk.contribution >= 75 ? 'rgba(0,214,107,0.05)' : sk.contribution >= 50 ? 'rgba(255,193,7,0.08)' : 'rgba(255,152,0,0.08)') : 'rgba(0,0,0,0.02)',
                                        padding: '10px 18px',
                                        borderRadius: '30px',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        color: isMatch ? (sk.contribution >= 75 ? 'var(--primary)' : sk.contribution >= 50 ? '#b28900' : '#e65100') : 'var(--text-gray)',
                                        border: isMatch ? (sk.contribution >= 75 ? '1px solid rgba(0,214,107,0.3)' : sk.contribution >= 50 ? '1px solid rgba(255,193,7,0.4)' : '1px solid rgba(255,152,0,0.4)') : '1px solid rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        flexWrap: 'wrap'
                                    }}>
                                        {isMatch ? <CheckCircle size={16} /> : <XCircle size={16} opacity={0.4} />}
                                        <span>{sk.displayName}</span>
                                        {li ? (
                                            <span style={{ fontSize: '0.8rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                Lvl {li.candLvl} / Req {li.reqLvl}
                                                <span style={{ background: isMatch ? (sk.contribution >= 75 ? 'var(--primary)' : sk.contribution >= 50 ? '#f0a500' : '#e65100') : '#aaa', color: 'white', padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                                    {li.pct}%
                                                </span>
                                            </span>
                                        ) : isMatch ? (
                                            <span style={{ background: 'var(--primary)', color: 'white', padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem' }}>✓</span>
                                        ) : null}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-gray)', fontSize: '1.05rem', fontStyle: 'italic' }}>
                            No se encontraron habilidades registradas para este candidato.
                        </p>
                    )}
                </div>

                {/* Conversación (Chat) */}
                {postulacionId && mostrarChat && (
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', margin: '0 0 1.2rem 0', fontSize: '1.2rem' }}>
                            <MessageSquare size={22} /> Conversación
                        </h3>
                        <ChatPostulacion
                            postulacionId={postulacionId}
                            miTipo="empresa"
                            nombreOtro={candidatoNombre}
                        />
                    </div>
                )}

            </div>

            {/* ACTION MODAL UNIFICADO */}
            {actionModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '2.5rem',
                        width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                            {actionModal.titulo}
                        </h3>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
                            {actionModal.tipo === 'rechazar'
                                ? 'Descartá al candidato con un mensaje personalizado. El candidato recibirá una notificación.'
                                : actionModal.tipo === 'invitar_entrevista'
                                    ? 'Al confirmar, el candidato será invitado a una entrevista y recibirá este mensaje.'
                                    : 'Enviá un mensaje al candidato. Podrá responderte desde su panel.'}
                        </p>

                        {/* Motivo de rechazo (solo si tipo === rechazar) */}
                        {actionModal.mostrarMotivo && (
                            <div style={{ marginBottom: '1.2rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Motivo de rechazo *
                                </label>
                                <select
                                    value={actionMotivoId}
                                    onChange={e => setActionMotivoId(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box' }}
                                >
                                    <option value="">Seleccioná un motivo...</option>
                                    {rejectionReasons.map(r => (
                                        <option key={r.id} value={r.id}>{r.descripcion}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Mensaje personalizable */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                {actionModal.tipo === 'mensaje' ? 'Mensaje *' : 'Mensaje para el candidato *'}
                            </label>
                            <textarea
                                value={actionMensaje}
                                onChange={e => setActionMensaje(e.target.value)}
                                maxLength={2000}
                                rows={5}
                                placeholder="Escribí tu mensaje aquí..."
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical',
                                    outline: 'none', fontFamily: 'inherit', lineHeight: '1.5',
                                    color: 'var(--text-dark)', boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', float: 'right' }}>
                                {actionMensaje.length}/2000
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleCancelAction}
                                disabled={isSubmittingAction}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                disabled={isSubmittingAction || !actionMensaje.trim() || (actionModal.mostrarMotivo && !actionMotivoId)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                    background: isSubmittingAction || !actionMensaje.trim() || (actionModal.mostrarMotivo && !actionMotivoId)
                                        ? '#94a3b8'
                                        : actionModal.tipo === 'rechazar' ? '#dc2626' : 'var(--primary)',
                                    color: 'white', fontWeight: 'bold',
                                    cursor: isSubmittingAction ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                {isSubmittingAction
                                    ? 'Enviando...'
                                    : actionModal.tipo === 'rechazar' ? 'Descartar y notificar'
                                    : actionModal.tipo === 'invitar_entrevista' ? 'Invitar y notificar'
                                    : 'Enviar mensaje'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
