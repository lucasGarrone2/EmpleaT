import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Briefcase, ArrowLeft, Users, Zap, MapPin, Trash2, PauseCircle, PlayCircle, Edit } from 'lucide-react';

export default function OfertaDetalleEmpresa() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [empresaId, setEmpresaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [oferta, setOferta] = useState(null);
    const [postulantes, setPostulantes] = useState([]);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [modalActionLoading, setModalActionLoading] = useState(false);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchDetalle = async () => {
            try {
                // Verificar que la empresa es dueña de esta oferta
                const { data: empData } = await supabase
                    .from('empresas')
                    .select('id')
                    .eq('auth_id', user.id)
                    .single();
                
                if (!empData) throw new Error("Perfil de empresa no encontrado");
                setEmpresaId(empData.id);

                // Obtener datos de la oferta
                const { data: ofData, error: ofError } = await supabase
                    .from('ofertas')
                    .select(`
                        id, empresa_id, titulo, modalidad, descripcion, estado, creada_en,
                        oferta_skills (
                            nombre_original,
                            diccionario_skills (nombre_skill)
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (ofError || !ofData) throw new Error("Oferta no encontrada");
                
                // Seguridad adicional
                if (ofData.empresa_id !== empData.id) {
                    throw new Error("No tienes permiso para ver esta oferta");
                }

                setOferta(ofData);

                // Obtener los postulantes ordenados por match
                const { data: postData, error: postError } = await supabase
                    .from('postulaciones')
                    .select(`
                        id, estado, fecha_postulacion, porcentaje_match_calculado,
                        candidatos (
                            id, nombre_completo, ubicacion, modalidad_preferida, score_proactividad, titulo_profesional, anios_experiencia,
                            candidato_skills(
                                skill_id,
                                nombre_original,
                                diccionario_skills(nombre_skill)
                            )
                        )
                    `)
                    .eq('oferta_id', id)
                    .order('porcentaje_match_calculado', { ascending: false });

                if (postError) throw postError;
                setPostulantes(postData || []);

            } catch (err) {
                console.error("Error al cargar detalle", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [id, user, navigate]);

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

    if (loading) return null;

    if (error) {
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
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: 'var(--text-dark)', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                            {oferta.titulo}
                        </h1>
                        <div style={{ display: 'flex', gap: '15px', color: 'var(--text-gray)', fontSize: '1.05rem', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={18}/> {oferta.modalidad}</span>
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
                    
                    {/* Botones de Acción */}
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
                                <><PlayCircle size={18} color="var(--primary)" /> Reanudar</>
                            }
                        </button>
                        
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
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <p style={{ color: '#555', lineHeight: '1.6', fontSize: '1.05rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {oferta.descripcion || "Sin descripción proporcionada para esta posición."}
                    </p>
                </div>

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Skills Buscadas:</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {oferta.oferta_skills?.map((sk, idx) => (
                            <span key={idx} style={{
                                padding: '6px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px',
                                fontSize: '0.95rem', color: 'var(--text-dark)', border: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                {sk.nombre_original || sk.diccionario_skills?.nombre_skill}
                            </span>
                        ))}
                        {(!oferta.oferta_skills || oferta.oferta_skills.length === 0) && (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>No se especificaron skills técnicas</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Listado de Candidatos Ranking */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <Users size={28} color="var(--primary)" />
                <h2 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', margin: 0 }}>
                    Candidatos Postulados ({postulantes.length})
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {postulantes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-white)', borderRadius: '24px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                        <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem' }}>Aún no hay postulaciones para esta búsqueda.</p>
                    </div>
                ) : (
                    postulantes.map((post, index) => {
                        const cant = post.candidatos;
                        
                        // Recalcular match en vivo con logica indulgente
                        let confidenciasReales = 0;
                        const matchTags = [];
                        
                        const reqSkills = oferta.oferta_skills || [];
                        const candSkills = cant.candidato_skills || [];
                        
                        if (reqSkills.length > 0) {
                            reqSkills.forEach(req => {
                                const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
                                const reqStr = normalize(req.nombre_original) || normalize(req.diccionario_skills?.nombre_skill);
                                
                                const matchTarget = candSkills.find(cs => {
                                    if (cs.skill_id === req.skill_id) return true;
                                    const csStr = normalize(cs.nombre_original) || normalize(cs.diccionario_skills?.nombre_skill);
                                    
                                    if (!csStr || !reqStr) return false;
                                    if (csStr === reqStr) return true;
                                    
                                    const minLen = Math.min(csStr.length, reqStr.length);
                                    if (minLen >= 4 && (csStr.includes(reqStr) || reqStr.includes(csStr))) return true;
                                    return false;
                                });
                                
                                if (matchTarget) {
                                    confidenciasReales++;
                                    matchTags.push(req.nombre_original || req.diccionario_skills?.nombre_skill || reqStr);
                                }
                            });
                        }
                        
                        const recalculatedMatch = reqSkills.length > 0 
                            ? Math.round((confidenciasReales / reqSkills.length) * 100) 
                            : 100;

                        const isTop = index === 0;

                        return (
                            <div key={post.id} style={{ 
                                background: 'white', 
                                padding: '1.5rem 2rem', 
                                borderRadius: '16px', 
                                border: isTop ? '2px solid rgba(0,214,107,0.4)' : '1px solid rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: isTop ? '0 8px 25px rgba(0,214,107,0.1)' : '0 2px 10px rgba(0,0,0,0.02)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {isTop && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: 'var(--primary)' }}></div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '60px', height: '60px', borderRadius: '50%', 
                                        background: 'linear-gradient(135deg, rgba(0,214,107,0.1) 0%, rgba(0,153,77,0.1) 100%)',
                                        color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: '1.5rem', fontWeight: 'bold'
                                    }}>
                                        {cant.nombre_completo.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-dark)' }}>{cant.nombre_completo}</h3>
                                            {isTop && <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>MEJOR MATCH</span>}
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

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,214,107,0.05)', padding: '15px 25px', borderRadius: '16px' }}>
                                    <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Afinidad</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '900', fontSize: '1.8rem' }}>
                                        <Zap size={24} fill="currentColor" /> {recalculatedMatch}%
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* MODAL DE PAUSA / REANUDAR */}
            {showPauseModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: oferta.estado === 'Publicada' ? '#fb8c00' : 'var(--primary)' }}>
                            {oferta.estado === 'Publicada' ? <PauseCircle size={48} /> : <PlayCircle size={48} />}
                        </div>
                        <h3 style={{ textAlign: 'center', fontSize: '1.5rem', margin: '0 0 1rem 0', color: 'var(--text-dark)' }}>
                            {oferta.estado === 'Publicada' ? '¿Pausar Oferta?' : '¿Reanudar Oferta?'}
                        </h3>
                        <p style={{ textAlign: 'center', color: 'var(--text-gray)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            {oferta.estado === 'Publicada' 
                                ? 'La oferta ya no será visible para nuevos candidatos. Podrás reactivarla más tarde.' 
                                : 'La oferta volverá a ser visible en el buscador público para recibir nuevas postulaciones.'}
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
        </div>
    );
}
