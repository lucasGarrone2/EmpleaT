import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Briefcase, ArrowLeft, Users, CheckCircle2, MapPin, Zap } from 'lucide-react';

export default function OfertaDetalleEmpresa() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [oferta, setOferta] = useState(null);
    const [postulantes, setPostulantes] = useState([]);
    const [error, setError] = useState(null);

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
                            id, nombre_completo, ubicacion, modalidad_preferida, score_proactividad, titulo_profesional, anios_experiencia
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
                </div>

                <div style={{ marginTop: '1.5rem' }}>
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
                        const match = post.porcentaje_match_calculado || 0;
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
                                        <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '6px' }}>
                                            Postulación: {new Date(post.fecha_postulacion).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,214,107,0.05)', padding: '15px 25px', borderRadius: '16px' }}>
                                    <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Afinidad</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '900', fontSize: '1.8rem' }}>
                                        <Zap size={24} fill="currentColor" /> {match}%
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
