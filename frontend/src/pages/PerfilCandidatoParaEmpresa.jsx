import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';
import { User, Briefcase, Clock, FileText, ArrowLeft, BrainCircuit, MapPin, CheckCircle, XCircle, Rocket, PartyPopper } from 'lucide-react';
import './Register.css'; // Mantenemos los estilos consistentes

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

    // Estados para el Modal de Motivo de Rechazo (ATS)
    const [rejectionReasons, setRejectionReasons] = useState([]);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [selectedReasonId, setSelectedReasonId] = useState('');
    const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

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
                        id, empresa_id,
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

    // Función para cambiar de fase del pipeline ATS
    const updateEstado = async (nuevoEstado) => {
        if (nuevoEstado === 'Rechazado') {
            setSelectedReasonId('');
            setShowRejectionModal(true);
            return;
        }

        try {
            const { error: updateErr } = await supabase
                .from('postulaciones')
                .update({ estado: nuevoEstado })
                .eq('id', postulacionId);

            if (updateErr) throw updateErr;
            setEstadoPostulacion(nuevoEstado);
        } catch (err) {
            console.error("Error al actualizar estado:", err);
            showAlert("No se pudo actualizar el estado de la postulación.", "Error", "error");
        }
    };

    const handleConfirmRejection = async () => {
        if (!selectedReasonId || !postulacionId) return;
        setIsSubmittingRejection(true);

        try {
            const { error: updateErr } = await supabase
                .from('postulaciones')
                .update({ 
                    estado: 'Rechazado',
                    motivo_rechazo_id: parseInt(selectedReasonId)
                })
                .eq('id', postulacionId);

            if (updateErr) throw updateErr;

            setEstadoPostulacion('Rechazado');
            setShowRejectionModal(false);
            setSelectedReasonId('');
        } catch (err) {
            console.error("Error al rechazar candidato:", err);
            showAlert("No se pudo rechazar al postulante: " + err.message, "Error", "error");
            setShowRejectionModal(false);
        } finally {
            setIsSubmittingRejection(false);
        }
    };

    const handleCancelRejection = () => {
        setShowRejectionModal(false);
        setSelectedReasonId('');
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
        'backend': ['node', 'java', 'python', 'c#', 'php', 'ruby', 'go', 'express'],
        'javascript': ['js', 'typescript', 'react', 'node', 'vue', 'angular', 'frontend'],
        'js': ['javascript', 'typescript', 'frontend'],
        'react': ['javascript', 'frontend', 'reactjs', 'react.js'],
        'java': ['spring', 'backend', 'java ee', 'springboot'],
        'python': ['django', 'flask', 'backend', 'machine learning', 'data science', 'fastapi']
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
                    let pct;
                    if (!nivelReq) {
                        pct = 100;
                    } else {
                        const diff = nivelReq - nivelCand;
                        if (diff <= 0) pct = 100;
                        else if (diff === 1) pct = 75;
                        else if (diff === 2) pct = 50;
                        else pct = 10;
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

                        {estadoPostulacion?.toLowerCase() === 'postulado' ? (
                            // Candidato "Postulado": Email Oculto/Enmascarado + Botón de Iniciar Proceso
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    background: '#f8fafc', 
                                    padding: '10px 14px', 
                                    borderRadius: '10px', 
                                    border: '1px solid #e2e8f0',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    color: '#94a3b8',
                                    userSelect: 'none'
                                }}>
                                    📧 {candidato.email ? (() => {
                                        const [local, domain] = candidato.email.split('@');
                                        if (!local || !domain) return "••••@••••.com";
                                        return `${local.charAt(0)}•••••@${domain}`;
                                    })() : "••••@••••.com"}
                                </div>
                                <button
                                    onClick={() => updateEstado('En revisión')}
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(0,214,107,0.2)',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,214,107,0.3)';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,214,107,0.2)';
                                    }}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <Rocket size={16} /> Iniciar Proceso (Revelar Email)
                                    </span>
                                </button>
                            </div>
                        ) : (
                            // Proceso iniciado: Email Real Revelado + Selector ATS de fase
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    background: 'rgba(0,214,107,0.04)', 
                                    padding: '10px 14px', 
                                    borderRadius: '10px', 
                                    border: '1px solid rgba(0,214,107,0.15)' 
                                }}>
                                    <a 
                                        href={`mailto:${candidato.email}`} 
                                        style={{ 
                                            fontSize: '0.9rem', 
                                            color: 'var(--primary)', 
                                            fontWeight: '700', 
                                            textDecoration: 'none',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '200px'
                                        }}
                                        title="Enviar correo electrónico directo"
                                    >
                                        📧 {candidato.email}
                                    </a>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(candidato.email);
                                            showAlert("¡Email copiado al portapapeles con éxito!", "Copiado", "success");
                                        }}
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            color: '#64748b', 
                                            cursor: 'pointer', 
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Copiar
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                                        Mover candidato a:
                                    </label>
                                    <select
                                        value={estadoPostulacion}
                                        onChange={(e) => updateEstado(e.target.value)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            color: 'var(--text-dark)',
                                            background: 'white',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <option value="En revisión">CV Visto / En Revisión</option>
                                        <option value="Entrevista">En Entrevista</option>
                                        <option value="Seleccionado">¡Contratado!</option>
                                        <option value="Rechazado">Rechazado</option>
                                    </select>
                                </div>
                            </div>
                        )}
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

            </div>

            {/* MODAL DE MOTIVO DE RECHAZO (ATS) */}
            {showRejectionModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: '1.4rem', margin: '0 0 1rem 0', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                            Motivo de Rechazo Requerido
                        </h3>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Para descartar a este candidato, por favor selecciona el motivo principal de rechazo.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
                            {rejectionReasons.map(reason => (
                                <label key={reason.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: `1px solid ${selectedReasonId === String(reason.id) ? 'var(--primary)' : '#e2e8f0'}`,
                                    background: selectedReasonId === String(reason.id) ? 'rgba(0,214,107,0.03)' : 'white',
                                    cursor: 'pointer',
                                    fontWeight: selectedReasonId === String(reason.id) ? 'bold' : 'normal',
                                    transition: 'all 0.2s'
                                }}>
                                    <input 
                                        type="radio" 
                                        name="rejectionReason" 
                                        value={reason.id} 
                                        checked={selectedReasonId === String(reason.id)}
                                        onChange={(e) => setSelectedReasonId(e.target.value)}
                                        style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)' }}>{reason.descripcion}</span>
                                </label>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={handleCancelRejection}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmRejection}
                                disabled={!selectedReasonId || isSubmittingRejection}
                                style={{ 
                                    flex: 1, 
                                    padding: '12px', 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    background: selectedReasonId ? '#dc2626' : '#94a3b8', 
                                    color: 'white', 
                                    fontWeight: 'bold', 
                                    cursor: selectedReasonId ? 'pointer' : 'not-allowed',
                                    opacity: isSubmittingRejection ? 0.7 : 1
                                }}
                            >
                                {isSubmittingRejection ? 'Guardando...' : 'Descartar Candidato'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
