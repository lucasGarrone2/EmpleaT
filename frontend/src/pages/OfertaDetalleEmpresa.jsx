import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Briefcase, ArrowLeft, Users, Zap, MapPin, Trash2, PauseCircle, PlayCircle, Edit, Kanban, List } from 'lucide-react';

export default function OfertaDetalleEmpresa() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [empresaId, setEmpresaId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [oferta, setOferta] = useState(null);
    const [postulantes, setPostulantes] = useState([]);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [modalActionLoading, setModalActionLoading] = useState(false);

    // Estados para el Tablero Kanban (ATS)
    const [viewMode, setViewMode] = useState('kanban');
    const [draggingOverColumn, setDraggingOverColumn] = useState(null);
    const [sortBy, setSortBy] = useState('match'); // 'match' | 'date_desc' | 'date_asc'

    // Estados para el Modal de Motivo de Rechazo (ATS)
    const [rejectionReasons, setRejectionReasons] = useState([]);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [selectedPostulacionId, setSelectedPostulacionId] = useState(null);
    const [selectedReasonId, setSelectedReasonId] = useState('');
    const [revertState, setRevertState] = useState(null);
    const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

    // Candidatos ordenados dinámicamente según el criterio seleccionado
    const sortedPostulantes = [...postulantes].sort((a, b) => {
        if (sortBy === 'date_desc') {
            return new Date(b.fecha_postulacion) - new Date(a.fecha_postulacion);
        }
        if (sortBy === 'date_asc') {
            return new Date(a.fecha_postulacion) - new Date(b.fecha_postulacion);
        }
        
        // Predeterminado: 'match' (Mayor afinidad, priorizando candidatos Premium en el top)
        const matchA = a.recalculatedMatch;
        const matchB = b.recalculatedMatch;
        const premiumA = !!a.candidatos?.es_premium;
        const premiumB = !!b.candidatos?.es_premium;

        const isHighMatchA = matchA >= 80;
        const isHighMatchB = matchB >= 80;

        if (isHighMatchA && isHighMatchB) {
            if (premiumA && !premiumB) return -1;
            if (!premiumA && premiumB) return 1;
            return matchB - matchA;
        }

        if (isHighMatchA && !isHighMatchB) return -1;
        if (!isHighMatchA && isHighMatchB) return 1;

        return matchB - matchA;
    });

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
                const { data: miembroData } = await supabase
                    .from('empresa_miembros')
                    .select('empresa_id, rol')
                    .eq('auth_id', user.id)
                    .maybeSingle();
                
                if (!miembroData) throw new Error("Perfil de empresa no encontrado");
                setEmpresaId(miembroData.empresa_id);
                setUserRole(miembroData.rol);

                // Obtener datos de la oferta
                const { data: ofData, error: ofError } = await supabase
                    .from('ofertas')
                    .select(`
                        id, empresa_id, titulo, modalidad, descripcion, estado, creada_en, seniority,
                        oferta_skills (
                            skill_id,
                            nombre_original,
                            nivel_requerido,
                            diccionario_skills (nombre_skill)
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (ofError || !ofData) throw new Error("Oferta no encontrada");
                
                // Seguridad adicional
                if (ofData.empresa_id !== miembroData.empresa_id) {
                    throw new Error("No tienes permiso para ver esta oferta");
                }

                setOferta(ofData);

                // Obtener los postulantes ordenados por match
                const { data: postData, error: postError } = await supabase
                    .from('postulaciones')
                    .select(`
                        id, estado, fecha_postulacion, porcentaje_match_calculado, match_boost_estado,
                        candidatos (
                            id, nombre_completo, ubicacion, modalidad_preferida, score_proactividad, titulo_profesional, anios_experiencia, foto_url, es_premium,
                            candidato_skills(
                                skill_id,
                                nombre_original,
                                nivel_estimado,
                                diccionario_skills(nombre_skill)
                            )
                        )
                    `)
                    .eq('oferta_id', id);

                if (postError) throw postError;

                // Precalcular afinidades en memoria para poder ordenar por Tiers Premium
                const reqSkills = ofData.oferta_skills || [];
                const synonymMap = {
                    'sql': ['mysql', 'postgresql', 'sql server', 'oracle', 'pl/sql'],
                    'mysql': ['sql', 'base de datos', 'mariadb'],
                    'postgresql': ['sql', 'base de datos'],
                    'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'nube'],
                    'aws': ['cloud', 'nube', 'amazon web services'],
                    'azure': ['cloud', 'nube', 'microsoft azure'],
                    'gcp': ['cloud', 'nube', 'google cloud'],
                    'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'js'],
                    'backend': ['node', 'java', 'python', 'c#', 'php', 'ruby', 'go', 'express', 'desarrollo web'],
                    'javascript': ['js', 'typescript', 'react', 'node', 'vue', 'angular', 'frontend'],
                    'js': ['javascript', 'typescript', 'frontend'],
                    'react': ['javascript', 'frontend', 'reactjs', 'react.js'],
                    'java': ['spring', 'backend', 'java ee', 'springboot'],
                    'python': ['django', 'flask', 'backend', 'machine learning', 'data science', 'fastapi'],
                    'desarrollo web': ['html', 'css', 'javascript', 'frontend', 'backend', 'web', 'php'],
                    'html': ['html5', 'frontend', 'desarrollo web', 'css'],
                    'css': ['css3', 'frontend', 'desarrollo web', 'html']
                };

                const processedPostulantes = (postData || []).map(post => {
                    const cant = post.candidatos;
                    let totalScore = 0;
                    const matchTags = [];
                    const candSkills = cant?.candidato_skills || [];

                    if (reqSkills.length > 0) {
                        reqSkills.forEach(req => {
                            const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
                            const reqStr = normalize(req.nombre_original) || normalize(req.diccionario_skills?.nombre_skill);
                            const nivelReq = req.nivel_requerido ?? null;
                            
                            const matchTarget = candSkills.find(cs => {
                                if (cs.skill_id && cs.skill_id === req.skill_id) return true;
                                const csStr = normalize(cs.nombre_original) || normalize(cs.diccionario_skills?.nombre_skill);
                                if (!csStr || !reqStr) return false;
                                if (csStr === reqStr) return true;
                                const minLen = Math.min(csStr.length, reqStr.length);
                                if (minLen >= 3 && (csStr.includes(reqStr) || reqStr.includes(csStr))) return true;
                                const reqSynonyms = synonymMap[reqStr] || [];
                                const csSynonyms = synonymMap[csStr] || [];
                                if (reqSynonyms.some(syn => csStr.includes(syn) || syn.includes(csStr))) return true;
                                if (csSynonyms.some(syn => reqStr.includes(syn) || syn.includes(reqStr))) return true;
                                return false;
                            });
                            
                            if (matchTarget) {
                                matchTags.push(req.nombre_original || req.diccionario_skills?.nombre_skill || reqStr);
                                if (!nivelReq) {
                                    totalScore += 1.0;
                                } else {
                                    const nivelCand = matchTarget.nivel_estimado || 3;
                                    const diff = nivelReq - nivelCand;
                                    if (diff <= 0) totalScore += 1.0;
                                    else if (diff === 1) totalScore += 0.75;
                                    else if (diff === 2) totalScore += 0.50;
                                    else totalScore += 0.10;
                                }
                            }
                        });
                    }

                    let recalculatedMatch = reqSkills.length > 0
                        ? Math.round((totalScore / reqSkills.length) * 100)
                        : (post.porcentaje_match_calculado ?? 0);

                    if (post.match_boost_estado === 'aprobado') {
                        recalculatedMatch = Math.min(100, recalculatedMatch + 5);
                    }

                    return {
                        ...post,
                        recalculatedMatch,
                        matchTags
                    };
                });

                // Ordenar: >= 80% Premium van primero, luego >= 80% No Premium, luego < 80%
                processedPostulantes.sort((a, b) => {
                    const matchA = a.recalculatedMatch;
                    const matchB = b.recalculatedMatch;
                    const premiumA = !!a.candidatos?.es_premium;
                    const premiumB = !!b.candidatos?.es_premium;

                    const isHighMatchA = matchA >= 80;
                    const isHighMatchB = matchB >= 80;

                    if (isHighMatchA && isHighMatchB) {
                        if (premiumA && !premiumB) return -1;
                        if (!premiumA && premiumB) return 1;
                        return matchB - matchA;
                    }

                    if (isHighMatchA && !isHighMatchB) return -1;
                    if (!isHighMatchA && isHighMatchB) return 1;

                    return matchB - matchA;
                });

                setPostulantes(processedPostulantes);

            } catch (err) {
                console.error("Error al cargar detalle", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [id, user, navigate]);

    const getNormalizedStatus = (status) => {
        const s = status?.toLowerCase() || 'postulado';
        if (s === 'en_revision' || s === 'en revisión' || s === 'en revision') return 'En revisión';
        if (s === 'entrevista') return 'Entrevista';
        if (s === 'seleccionado' || s === 'contratado') return 'Seleccionado';
        if (s === 'rechazado') return 'Rechazado';
        return 'postulado';
    };

    const handleMoveCandidate = async (postulacionId, targetStatus, currentStatus) => {
        if (targetStatus === currentStatus) return;

        if (targetStatus === 'Rechazado') {
            setSelectedPostulacionId(postulacionId);
            setRevertState(currentStatus);
            setSelectedReasonId('');
            setShowRejectionModal(true);
            return;
        }

        // Actualización optimista en el frontend
        setPostulantes(prev => prev.map(p => p.id === postulacionId ? { ...p, estado: targetStatus } : p));

        try {
            const { error: updateErr } = await supabase
                .from('postulaciones')
                .update({ estado: targetStatus })
                .eq('id', postulacionId);

            if (updateErr) throw updateErr;
        } catch (err) {
            console.error("Error al actualizar estado de postulación:", err);
            // Revertir estado local en caso de error
            setPostulantes(prev => prev.map(p => p.id === postulacionId ? { ...p, estado: currentStatus } : p));
            setError("No se pudo actualizar el estado: " + err.message);
        }
    };

    const handleConfirmRejection = async () => {
        if (!selectedReasonId || !selectedPostulacionId) return;
        setIsSubmittingRejection(true);

        // Actualización optimista en el frontend
        setPostulantes(prev => prev.map(p => p.id === selectedPostulacionId ? { ...p, estado: 'Rechazado' } : p));

        try {
            const { error: updateErr } = await supabase
                .from('postulaciones')
                .update({ 
                    estado: 'Rechazado',
                    motivo_rechazo_id: parseInt(selectedReasonId)
                })
                .eq('id', selectedPostulacionId);

            if (updateErr) throw updateErr;

            setShowRejectionModal(false);
            setSelectedPostulacionId(null);
            setSelectedReasonId('');
        } catch (err) {
            console.error("Error al actualizar estado de rechazo:", err);
            // Revertir estado local en caso de error
            setPostulantes(prev => prev.map(p => p.id === selectedPostulacionId ? { ...p, estado: revertState } : p));
            setError("No se pudo rechazar al postulante: " + err.message);
            setShowRejectionModal(false);
        } finally {
            setIsSubmittingRejection(false);
        }
    };

    const handleCancelRejection = () => {
        setShowRejectionModal(false);
        setSelectedPostulacionId(null);
        setSelectedReasonId('');
    };

    const togglePause = async () => {
        setModalActionLoading(true);
        const nuevoEstado = oferta.estado === 'Publicada' ? 'Cerrada' : 'Publicada';
        
        try {
            const { error: updErr } = await supabase
                .from('ofertas')
                .update({ estado: nuevoEstado })
                .eq('id', id)
                .eq('empresa_id', empresaId);

            if (updErr) throw updErr;
            setOferta({ ...oferta, estado: nuevoEstado });
            setShowPauseModal(false);
        } catch (err) {
            setError("Error al actualizar la oferta: " + err.message);
        } finally {
            setModalActionLoading(false);
        }
    };

    const confirmEliminar = async () => {
        setModalActionLoading(true);
        try {
            const { error: delErr } = await supabase
                .from('ofertas')
                .delete()
                .eq('id', id)
                .eq('empresa_id', empresaId);

            if (delErr) throw delErr;
            navigate('/dashboard-empresa');
        } catch (err) {
            setError("Error al eliminar la oferta: " + err.message);
            setShowDeleteModal(false);
        } finally {
            setModalActionLoading(false);
        }
    };

    if (error && !loading) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-dark)' }}>{error}</h2>
                <Link to="/dashboard-empresa" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Volver al inicio</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
            <button 
                onClick={() => navigate('/dashboard-empresa')}
                style={{ 
                    background: 'none', border: 'none', color: 'var(--text-gray)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 'bold', padding: 0, marginBottom: '2rem', fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} /> Volver a mis búsquedas
            </button>

            {/* Cabecera de la Oferta */}
            <div style={{ 
                background: 'var(--bg-white)',
                padding: '2.5rem',
                borderRadius: '24px',
                border: '1px solid rgba(0,0,0,0.05)',
                marginBottom: '3rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    {loading ? (
                        <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-title" style={{ width: '50%', height: '32px', marginBottom: '16px' }} />
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '15px' }} />
                                <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '15px' }} />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 style={{ fontSize: '2.2rem', color: 'var(--text-dark)', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                                {oferta.titulo}
                            </h1>
                            <div style={{ display: 'flex', gap: '15px', color: 'var(--text-gray)', fontSize: '1.05rem', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={18}/> {oferta.modalidad}</span>
                                {(oferta.seniority && oferta.seniority !== 'Indistinto') && (
                                    <>
                                        <span>•</span>
                                        <span style={{ 
                                            background: '#FFF4E5', color: '#E68A00', padding: '4px 12px', 
                                            borderRadius: '15px', fontSize: '0.85rem', fontWeight: 'bold' 
                                        }}>
                                            {oferta.seniority}
                                        </span>
                                    </>
                                )}
                                <span>•</span>
                                <span style={{ 
                                    background: oferta.estado === 'Publicada' ? 'rgba(0,214,107,0.1)' : 'rgba(0,0,0,0.05)',
                                    color: oferta.estado === 'Publicada' ? 'var(--primary)' : 'var(--text-gray)',
                                    padding: '4px 12px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 'bold'
                                }}>
                                    {oferta.estado}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Botones de Acción */}
                    {!loading && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => navigate(`/editar-oferta/${id}`)}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)',
                                background: 'white', color: 'var(--primary)', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,214,107,0.05)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'white'; }}
                        >
                            <Edit size={18} /> Editar
                        </button>
                        
                        <button 
                            onClick={() => setShowPauseModal(true)}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)',
                                background: 'white', color: 'var(--text-gray)', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'white'; }}
                        >
                            {oferta.estado === 'Publicada' ? 
                                <><PauseCircle size={18} /> Pausar</> : 
                                <><PlayCircle size={18} color="var(--primary)" /> {oferta.estado === 'Borrador' ? 'Publicar' : 'Reanudar'}</>
                            }
                        </button>
                        
                        {userRole === 'administrador' && (
                            <button 
                                onClick={() => setShowDeleteModal(true)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 18px', borderRadius: '12px', border: 'none',
                                    background: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f', fontWeight: 'bold',
                                    cursor: 'pointer', transition: 'background 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(211, 47, 47, 0.15)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(211, 47, 47, 0.1)'; }}
                            >
                                <Trash2 size={18} /> Eliminar
                            </button>
                        )}
                    </div>
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="skeleton skeleton-text" style={{ width: '100%', height: '14px' }} />
                            <div className="skeleton skeleton-text" style={{ width: '95%', height: '14px' }} />
                            <div className="skeleton skeleton-text" style={{ width: '70%', height: '14px' }} />
                        </div>
                    ) : (
                        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '1.05rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                            {oferta.descripcion || "Sin descripción proporcionada para esta posición."}
                        </p>
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Skills Buscadas:</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="skeleton" style={{ width: '100px', height: '34px', borderRadius: '8px' }} />
                            ))
                        ) : (
                            <>
                                {oferta.oferta_skills?.map((sk, idx) => (
                                    <span key={idx} style={{
                                        padding: '6px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px',
                                        fontSize: '0.95rem', color: 'var(--text-dark)', border: '1px solid rgba(0,0,0,0.05)',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        {sk.nombre_original || sk.diccionario_skills?.nombre_skill}
                                        {sk.nivel_requerido && (
                                            <span style={{ background: 'var(--secondary)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                Lvl {sk.nivel_requerido}
                                            </span>
                                        )}
                                    </span>
                                ))}
                                {(!oferta.oferta_skills || oferta.oferta_skills.length === 0) && (
                                    <span style={{ color: '#999', fontStyle: 'italic' }}>No se especificaron skills técnicas</span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Listado de Candidatos Ranking */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={28} color="var(--primary)" />
                    {loading ? (
                        <div className="skeleton" style={{ width: '250px', height: '28px', borderRadius: '6px' }} />
                    ) : (
                        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', margin: 0 }}>
                            Postulantes ({postulantes.length})
                        </h2>
                    )}
                </div>
                
                {/* Selector de modo de vista y ordenamiento */}
                {!loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                        {/* Selector de Ordenamiento */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Ordenar por:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(0, 214, 107, 0.15)',
                                    background: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: 'var(--text-dark, #1e293b)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(0, 214, 107, 0.15)'}
                            >
                                <option value="match">Mayor afinidad</option>
                                <option value="date_desc">Fecha (más reciente)</option>
                                <option value="date_asc">Fecha (más antiguo)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <button 
                                onClick={() => setViewMode('kanban')}
                                style={{ 
                                    padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: viewMode === 'kanban' ? 'white' : 'transparent',
                                    color: viewMode === 'kanban' ? 'var(--primary)' : '#64748b',
                                    boxShadow: viewMode === 'kanban' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                <Kanban size={16} /> Tablero ATS
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                style={{ 
                                    padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: viewMode === 'list' ? 'white' : 'transparent',
                                    color: viewMode === 'list' ? 'var(--primary)' : '#64748b',
                                    boxShadow: viewMode === 'list' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                <List size={16} /> Lista (Match)
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div 
                            key={idx}
                            style={{ 
                                background: 'white', 
                                padding: '1.5rem 2rem', 
                                borderRadius: '16px', 
                                border: '1px solid rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
                                <div className="skeleton skeleton-circle" style={{ width: '60px', height: '60px', flexShrink: 0 }}></div>
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-title" style={{ width: '180px', height: '18px', marginBottom: '8px' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '120px', height: '12px' }} />
                                </div>
                            </div>
                            <div className="skeleton" style={{ width: '75px', height: '40px', borderRadius: '12px' }}></div>
                        </div>
                    ))}
                </div>
            ) : postulantes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-white)', borderRadius: '24px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem' }}>Aún no hay postulaciones para esta búsqueda.</p>
                </div>
            ) : viewMode === 'kanban' ? (
                /* VISTA TABLERO KANBAN */
                <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    width: '100%',
                    overflowX: 'auto',
                    padding: '0.5rem 0.2rem 1.5rem 0.2rem',
                    boxSizing: 'border-box'
                }}>
                    {[
                        { id: 'postulado', title: 'Postulados', color: '#0284c7', bg: '#f0f9ff', border: 'rgba(2,132,199,0.2)' },
                        { id: 'En revisión', title: 'En Revisión', color: '#d97706', bg: '#fffbeb', border: 'rgba(217,119,6,0.2)' },
                        { id: 'Entrevista', title: 'Entrevista', color: '#7c3aed', bg: '#faf5ff', border: 'rgba(124,58,237,0.2)' },
                        { id: 'Seleccionado', title: 'Contratados', color: '#16a34a', bg: '#f0fdf4', border: 'rgba(22,163,74,0.2)' },
                        { id: 'Rechazado', title: 'Descartados', color: '#dc2626', bg: '#fef2f2', border: 'rgba(220,38,38,0.2)' }
                    ].map(col => {
                        const colCandidates = sortedPostulantes.filter(p => getNormalizedStatus(p.estado) === col.id);
                        return (
                            <div 
                                key={col.id}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDraggingOverColumn(col.id);
                                }}
                                onDragLeave={() => {
                                    setDraggingOverColumn(null);
                                }}
                                onDrop={(e) => {
                                    const postulacionId = e.dataTransfer.getData("postulacionId");
                                    const fromStatus = e.dataTransfer.getData("currentStatus");
                                    setDraggingOverColumn(null);
                                    if (postulacionId) {
                                        handleMoveCandidate(postulacionId, col.id, fromStatus);
                                    }
                                }}
                                style={{
                                    flex: '1 0 240px',
                                    maxWidth: '280px',
                                    background: draggingOverColumn === col.id ? `${col.bg}95` : '#f8fafc',
                                    border: draggingOverColumn === col.id ? `2px dashed ${col.color}` : '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    padding: '1rem',
                                    minHeight: '500px',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.8rem',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {/* Cabecera de Columna */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    borderBottom: `2px solid ${col.color}`, 
                                    paddingBottom: '0.8rem',
                                    marginBottom: '0.4rem'
                                }}>
                                    <h3 style={{ 
                                        fontSize: '0.95rem', 
                                        fontWeight: 'bold', 
                                        color: 'var(--text-dark)', 
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                                        {col.title}
                                    </h3>
                                    <span style={{ 
                                        background: col.bg, 
                                        color: col.color, 
                                        padding: '2px 8px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.8rem', 
                                        fontWeight: 'bold',
                                        border: `1px solid ${col.border}`
                                    }}>
                                        {colCandidates.length}
                                    </span>
                                </div>

                                {/* Contenedor de Tarjetas */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.8rem',
                                    flex: 1,
                                    overflowY: 'auto'
                                }}>
                                    {colCandidates.length === 0 ? (
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center', 
                                            flex: 1, 
                                            color: '#cbd5e1', 
                                            fontSize: '0.85rem',
                                            fontStyle: 'italic',
                                            textAlign: 'center',
                                            border: '2px dashed #f1f5f9',
                                            borderRadius: '12px',
                                            padding: '1.5rem'
                                        }}>
                                            Arrastra candidatos aquí
                                        </div>
                                    ) : (
                                        colCandidates.map(post => {
                                            const cant = post.candidatos;
                                            const recalculatedMatch = post.recalculatedMatch;
                                            return (
                                                <div
                                                    key={post.id}
                                                    draggable="true"
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData("postulacionId", post.id);
                                                        e.dataTransfer.setData("currentStatus", post.estado);
                                                        e.currentTarget.style.opacity = '0.5';
                                                    }}
                                                    onDragEnd={(e) => {
                                                        e.currentTarget.style.opacity = '1';
                                                    }}
                                                    onClick={() => navigate(`/oferta-empresa/${id}/candidato/${cant.id}`)}
                                                    style={{
                                                        background: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px',
                                                        padding: '0.8rem',
                                                        cursor: 'grab',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                                                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.5rem',
                                                        boxSizing: 'border-box'
                                                    }}
                                                    onMouseOver={e => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.05)';
                                                        e.currentTarget.style.borderColor = 'rgba(0,214,107,0.3)';
                                                    }}
                                                    onMouseOut={e => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)';
                                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                                    }}
                                                >
                                                    {/* Cabecera Tarjeta */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                                                        <span style={{ 
                                                            fontWeight: 'bold', 
                                                            color: 'var(--text-dark)', 
                                                            fontSize: '0.88rem', 
                                                            overflow: 'hidden', 
                                                            textOverflow: 'ellipsis', 
                                                            whiteSpace: 'nowrap', 
                                                            maxWidth: '140px' 
                                                        }}>
                                                            {cant.nombre_completo}
                                                        </span>
                                                        <span style={{ 
                                                            background: 'rgba(0,214,107,0.08)', 
                                                            color: 'var(--primary)', 
                                                            padding: '1px 5px', 
                                                            borderRadius: '6px', 
                                                            fontSize: '0.72rem', 
                                                            fontWeight: '900',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '1px',
                                                            flexShrink: 0
                                                        }}>
                                                            <Zap size={10} fill="currentColor" /> {recalculatedMatch}%
                                                        </span>
                                                    </div>

                                                    {/* Cargo y exp */}
                                                    <div style={{ 
                                                        color: 'var(--text-gray)', 
                                                        fontSize: '0.78rem', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        marginTop: '-2px'
                                                    }}>
                                                        {cant.titulo_profesional || 'Profesional'} {cant.anios_experiencia ? `• ${cant.anios_experiencia}a exp.` : ''}
                                                    </div>

                                                    {/* Insignias Premium/Boost */}
                                                    {(cant.es_premium || post.match_boost_estado === 'aprobado') && (
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                                                            {cant.es_premium && (
                                                                <span style={{ padding: '1px 4px', background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', color: 'white', borderRadius: '4px', fontSize: '0.58rem', fontWeight: 'bold' }}>
                                                                    PREMIUM
                                                                </span>
                                                            )}
                                                            {post.match_boost_estado === 'aprobado' && (
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px', padding: '1px 4px', background: 'linear-gradient(90deg, #00d66b 0%, #00994d 100%)', color: 'white', borderRadius: '4px', fontSize: '0.58rem', fontWeight: 'bold' }}>
                                                                    <Zap size={8} fill="white" /> BOOSTED
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Footer Tarjeta */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center', 
                                                        marginTop: '4px', 
                                                        borderTop: '1px solid #f1f5f9', 
                                                        paddingTop: '6px' 
                                                    }}>
                                                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                                            {new Date(post.fecha_postulacion).toLocaleDateString()}
                                                        </span>
                                                        <select
                                                            value={getNormalizedStatus(post.estado)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => handleMoveCandidate(post.id, e.target.value, post.estado)}
                                                            style={{
                                                                padding: '2px 4px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #cbd5e1',
                                                                fontSize: '0.72rem',
                                                                fontWeight: 'bold',
                                                                color: '#475569',
                                                                background: '#f8fafc',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                maxWidth: '95px'
                                                            }}
                                                        >
                                                            <option value="postulado">Postulado</option>
                                                            <option value="En revisión">Revisión</option>
                                                            <option value="Entrevista">Entrevista</option>
                                                            <option value="Seleccionado">Contratado</option>
                                                            <option value="Rechazado">Descartado</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* VISTA LISTA ORIGINAL */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sortedPostulantes.map((post, index) => {
                        const cant = post.candidatos;
                        const recalculatedMatch = post.recalculatedMatch;
                        const matchTags = post.matchTags || [];
                        const isTop = sortBy === 'match' && index === 0;

                        return (
                            <div 
                                key={post.id} 
                                onClick={() => navigate(`/oferta-empresa/${id}/candidato/${cant.id}`)}
                                style={{ 
                                    background: 'white', 
                                    padding: '1.5rem 2rem', 
                                    borderRadius: '16px', 
                                    border: isTop ? '2px solid rgba(0,214,107,0.4)' : '1px solid rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: isTop ? '0 8px 25px rgba(0,214,107,0.1)' : '0 2px 10px rgba(0,0,0,0.02)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = isTop ? '0 8px 25px rgba(0,214,107,0.1)' : '0 2px 10px rgba(0,0,0,0.02)';
                                }}
                            >
                                {isTop && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: 'var(--primary)' }}></div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '60px', height: '60px', borderRadius: '50%', 
                                        background: 'linear-gradient(135deg, rgba(0,214,107,0.1) 0%, rgba(0,153,77,0.1) 100%)',
                                        color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: '1.5rem', fontWeight: 'bold', overflow: 'hidden'
                                    }}>
                                        {cant.foto_url ? (
                                            <img src={cant.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            cant.nombre_completo.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-dark)' }}>{cant.nombre_completo}</h3>
                                            {cant.es_premium && (
                                                <span title="Candidato Premium" style={{ display: 'inline-flex', padding: '2px 8px', background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', color: 'white', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(255,165,0,0.3)', letterSpacing: '0.5px' }}>
                                                    PREMIUM
                                                </span>
                                            )}
                                            {post.match_boost_estado === 'aprobado' && (
                                                <span title="Match potenciado (+5%). El candidato aprobó con éxito el cuestionario de la oferta." style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', background: 'linear-gradient(90deg, #00d66b 0%, #00994d 100%)', color: 'white', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,214,107,0.3)', letterSpacing: '0.5px' }}>
                                                    <Zap size={10} fill="white" /> BOOSTED
                                                </span>
                                            )}
                                            {isTop && <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>MEJOR MATCH</span>}
                                            {(() => {
                                                const normalized = post.estado?.toLowerCase();
                                                if (normalized === 'en_revision' || normalized === 'en revisión' || normalized === 'en revision') return <span style={{ display: 'inline-flex', padding: '2px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>CV VISTO</span>;
                                                if (normalized === 'entrevista') return <span style={{ display: 'inline-flex', padding: '2px 8px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>ENTREVISTA</span>;
                                                if (normalized === 'seleccionado' || normalized === 'contratado') return <span style={{ display: 'inline-flex', padding: '2px 8px', background: '#dcfce7', color: '#15803d', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>SELECCIONADO</span>;
                                                if (normalized === 'rechazado') return <span style={{ display: 'inline-flex', padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>RECHAZADO</span>;
                                                return <span style={{ display: 'inline-flex', padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>NUEVO</span>;
                                            })()}
                                        </div>
                                        <div style={{ color: 'var(--text-gray)', fontSize: '0.95rem', display: 'flex', gap: '15px' }}>
                                            <span>{cant.titulo_profesional || 'Profesional'} {cant.anios_experiencia ? `· ${cant.anios_experiencia} años exp.` : ''}</span>
                                            {cant.ubicacion && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/> {cant.ubicacion}</span>}
                                        </div>
                                        {matchTags.length > 0 && (
                                            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {matchTags.map((tag, tIdx) => (
                                                    <span key={tIdx} style={{ 
                                                        background: 'rgba(0,214,107,0.1)', color: 'var(--primary)', 
                                                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' 
                                                    }}>
                                                        ✓ {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '8px' }}>
                                            Postulación: {new Date(post.fecha_postulacion).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,214,107,0.05)', padding: '15px 25px', borderRadius: '16px' }}>
                                        <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Afinidad</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '900', fontSize: '1.8rem' }}>
                                            <Zap size={24} fill="currentColor" /> {recalculatedMatch}%
                                        </div>
                                    </div>
                                    <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        Ver Perfil →
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL DE PAUSA / REANUDAR */}
            {showPauseModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: oferta.estado === 'Publicada' ? '#fb8c00' : 'var(--primary)' }}>
                            {oferta.estado === 'Publicada' ? <PauseCircle size={48} /> : <PlayCircle size={48} />}
                        </div>
                        <h3 style={{ textAlign: 'center', fontSize: '1.5rem', margin: '0 0 1rem 0', color: 'var(--text-dark)' }}>
                            {oferta.estado === 'Publicada' ? '¿Pausar Oferta?' : (oferta.estado === 'Borrador' ? '¿Publicar Oferta?' : '¿Reanudar Oferta?')}
                        </h3>
                        <p style={{ textAlign: 'center', color: 'var(--text-gray)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            {oferta.estado === 'Publicada' 
                                ? 'La oferta ya no será visible para nuevos candidatos. Podrás reactivarla más tarde.' 
                                : (oferta.estado === 'Borrador' ? 'La oferta finalmente será publicada en el buscador público para recibir nuevas postulaciones.' : 'La oferta volverá a ser visible en el buscador público para recibir nuevas postulaciones.')}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => setShowPauseModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={togglePause}
                                disabled={modalActionLoading}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: oferta.estado === 'Publicada' ? '#fb8c00' : 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {modalActionLoading ? 'Cargando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ELIMINAR */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#d32f2f' }}>
                            <Trash2 size={48} />
                        </div>
                        <h3 style={{ textAlign: 'center', fontSize: '1.5rem', margin: '0 0 1rem 0', color: 'var(--text-dark)' }}>¿Eliminar permanentemente?</h3>
                        <p style={{ textAlign: 'center', color: 'var(--text-gray)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            Esta acción borrará la oferta del sistema <b>para siempre</b>, incluyendo a todos los candidatos que ya se hayan postulado.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmEliminar}
                                disabled={modalActionLoading}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#d32f2f', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {modalActionLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
