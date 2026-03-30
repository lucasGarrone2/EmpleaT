import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Filter, Star, MapPin, DollarSign, Briefcase } from 'lucide-react';

export default function ListaOfertas() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [candidatoId, setCandidatoId] = useState(null);
    const [ofertas, setOfertas] = useState([]);
    const [postulacionesIds, setPostulacionesIds] = useState(new Set());
    const [error, setError] = useState(null);
    const [applyingTo, setApplyingTo] = useState(null);
    const [expandedOferta, setExpandedOferta] = useState(null);

    // Filter states
    const [filtros, setFiltros] = useState({
        ubicacion: 'Todas',
        modalidad: { Remoto: false, Híbrido: false, Presencial: false },
        experiencia: 'Todos',
        rubro: 'Todos'
    });

    useEffect(() => {
        if (!user || user.user_metadata?.rol === 'empresa') {
            navigate('/login');
            return;
        }

        const fetchDatos = async () => {
            try {
                const { data: candData, error: candError } = await supabase
                    .from('candidatos')
                    .select('id')
                    .eq('auth_id', user.id)
                    .maybeSingle();
                
                if (candError) throw candError;
                if (!candData) {
                    navigate('/perfil');
                    return;
                }
                setCandidatoId(candData.id);

                const { data: candSkills, error: skillsError } = await supabase
                    .from('candidato_skills')
                    .select('skill_id')
                    .eq('candidato_id', candData.id);
                
                if (skillsError) throw skillsError;
                const setSkillsCandidato = new Set(candSkills.map(s => s.skill_id));

                const { data: misPostulaciones } = await supabase
                    .from('postulaciones')
                    .select('oferta_id')
                    .eq('candidato_id', candData.id);
                
                const setPostuladas = new Set((misPostulaciones || []).map(p => p.oferta_id));
                setPostulacionesIds(setPostuladas);

                const { data: ofertasData, error: ofError } = await supabase
                    .from('ofertas')
                    .select(`
                        id, titulo, modalidad, descripcion, salario_min_usd, salario_max_usd, creada_en,
                        empresas (nombre, ubicacion),
                        oferta_skills (
                            skill_id,
                            nombre_original,
                            diccionario_skills (nombre_skill)
                        )
                    `)
                    .eq('estado', 'Publicada');
                
                if (ofError) throw ofError;

                const ofertasConMatch = (ofertasData || []).map(oferta => {
                    const skillsRequeridas = oferta.oferta_skills || [];
                    const totalRequeridas = skillsRequeridas.length;
                    let coincidencias = 0;

                    if (totalRequeridas > 0) {
                        skillsRequeridas.forEach(req => {
                            if (setSkillsCandidato.has(req.skill_id)) {
                                coincidencias++;
                            }
                        });
                    }

                    const porcentajeMatch = totalRequeridas > 0 ? Math.round((coincidencias / totalRequeridas) * 100) : 100;
                    return { ...oferta, porcentajeMatch };
                });

                ofertasConMatch.sort((a, b) => b.porcentajeMatch - a.porcentajeMatch);
                setOfertas(ofertasConMatch);

            } catch (err) {
                console.error("Error obteniendo ofertas", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDatos();
    }, [user, navigate]);

    const handlePostularse = async (e, ofertaId, porcentajeMatch) => {
        e.stopPropagation();
        setApplyingTo(ofertaId);
        try {
            const { error: postError } = await supabase
                .from('postulaciones')
                .insert({
                    candidato_id: candidatoId,
                    oferta_id: ofertaId,
                    porcentaje_match_calculado: porcentajeMatch,
                    estado: 'Postulado'
                });

            if (postError) throw postError;

            setPostulacionesIds(prev => {
                const updated = new Set(prev);
                updated.add(ofertaId);
                return updated;
            });
        } catch (err) {
            alert("Error al postularse: " + err.message);
        } finally {
            setApplyingTo(null);
        }
    };

    const toggleFilter = (filterType, value) => {
        setFiltros(prev => ({
            ...prev,
            [filterType]: { ...prev[filterType], [value]: !prev[filterType][value] }
        }));
    };

    const getUbicacionesUnicas = () => ['Todas', ...new Set(ofertas.map(o => o.empresas?.ubicacion).filter(Boolean))];

    // Aplicar filtros
    const ofertasZ = ofertas.filter(o => {
        if (filtros.ubicacion !== 'Todas' && o.empresas?.ubicacion !== filtros.ubicacion) return false;
        
        const isCualquierModalidadFalse = !filtros.modalidad.Remoto && !filtros.modalidad.Híbrido && !filtros.modalidad.Presencial;
        if (!isCualquierModalidadFalse) {
            if (!filtros.modalidad[o.modalidad]) return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#FAFAFB' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Buscando empleos...</div>
            </div>
        );
    }

    return (
        <div style={{ background: '#FAFAFB', minHeight: 'calc(100vh - 70px)', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                {/* SIDEBAR FILTROS */}
                <aside style={{ flex: '0 0 280px', width: '280px', background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                        <Filter size={20} color="#555" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Filtros</h3>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Ubicación</label>
                        <select 
                            value={filtros.ubicacion} 
                            onChange={e => setFiltros({...filtros, ubicacion: e.target.value})}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white' }}
                        >
                            {getUbicacionesUnicas().map(ub => <option key={ub} value={ub}>{ub}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Modalidad</label>
                        {['Remoto', 'Híbrido', 'Presencial'].map(mod => (
                            <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.95rem', color: '#444', cursor: 'pointer' }}>
                                <input type="checkbox" checked={filtros.modalidad[mod]} onChange={() => toggleFilter('modalidad', mod)} style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                                {mod}
                            </label>
                        ))}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Rating de empresa</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="#e0e0e0" color="#e0e0e0" />)}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Años de experiencia</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white' }}>
                            <option>Todos</option>
                            <option>Sin experiencia</option>
                            <option>1-2 años</option>
                            <option>3-5 años</option>
                            <option>+5 años</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Rubro</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white' }}>
                            <option>Todos los rubros</option>
                            <option>Tecnología</option>
                            <option>Finanzas</option>
                        </select>
                    </div>
                </aside>

                {/* LISTA DE OFERTAS */}
                <main style={{ flex: 1, minWidth: '0' }}>
                    <div style={{ marginBottom: '1.5rem', color: '#888', fontSize: '0.95rem' }}>
                        {ofertasZ.length} empleos encontrados
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {ofertasZ.map(oferta => {
                            const matchColor = oferta.porcentajeMatch >= 75 ? '#00d66b' : (oferta.porcentajeMatch >= 40 ? '#FFB020' : '#888');
                            const isExpanded = expandedOferta === oferta.id;
                            const yaPostulado = postulacionesIds.has(oferta.id);
                            
                            // Extrae la primera letra de la empresa
                            const empLetra = (oferta.empresas?.nombre || 'E').charAt(0).toUpperCase();

                            return (
                                <div key={oferta.id} 
                                    onClick={() => setExpandedOferta(isExpanded ? null : oferta.id)}
                                    style={{ 
                                        background: 'white', 
                                        borderRadius: '12px', 
                                        border: `1px solid ${isExpanded ? 'var(--primary)' : '#EAEAEA'}`,
                                        padding: '1.5rem',
                                        boxShadow: isExpanded ? '0 8px 30px rgba(0,214,107,0.08)' : '0 2px 10px rgba(0,0,0,0.02)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flex: 1 }}>
                                            {/* Circulo Inicial de Empresa */}
                                            <div style={{ width: '56px', height: '56px', background: '#F0F9F4', color: '#00B159', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0 }}>
                                                {empLetra}
                                            </div>
                                            
                                            {/* Info Basica */}
                                            <div>
                                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.15rem', color: '#222' }}>{oferta.titulo}</h3>
                                                <div style={{ color: '#666', fontSize: '0.95rem', marginBottom: '8px' }}>{oferta.empresas?.nombre}</div>
                                                
                                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                                    {oferta.empresas?.ubicacion && <span style={{ background: '#F5F6F8', color: '#555', padding: '4px 10px', borderRadius: '6px' }}>{oferta.empresas.ubicacion}</span>}
                                                    <span style={{ background: '#EAF9F1', color: '#00B159', padding: '4px 10px', borderRadius: '6px' }}>{oferta.modalidad}</span>
                                                    {(oferta.salario_min_usd > 0) && (
                                                        <span style={{ background: '#E6F7FF', color: '#0084FF', padding: '4px 10px', borderRadius: '6px', fontWeight: '500' }}>
                                                            ${oferta.salario_min_usd.toLocaleString()} - {oferta.salario_max_usd ? `$${oferta.salario_max_usd.toLocaleString()} USD` : '+ USD'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Match y Boton */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            <div style={{ textAlign: 'center', color: matchColor }}>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{oferta.porcentajeMatch}%</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>MATCH</div>
                                            </div>
                                            
                                            <button 
                                                style={{ 
                                                    background: yaPostulado ? '#EAF9F1' : 'var(--primary)', 
                                                    color: yaPostulado ? '#00B159' : 'white', 
                                                    padding: '10px 24px', 
                                                    borderRadius: '8px', 
                                                    border: 'none', 
                                                    fontWeight: 'bold',
                                                    fontSize: '0.95rem',
                                                    cursor: 'pointer',
                                                    boxShadow: yaPostulado ? 'none' : '0 4px 12px rgba(0,214,107,0.2)'
                                                }}
                                            >
                                                {yaPostulado ? 'Postulado' : 'Ver Mas'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* EXPANDIDO: Muestra Descripción Completa y Skills (Estilo primer foto) */}
                                    {isExpanded && (
                                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #EAEAEA' }} onClick={e => e.stopPropagation()}>
                                            <p style={{ color: '#555', lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-line' }}>{oferta.descripcion}</p>
                                            
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.85rem', color: '#333', letterSpacing: '1px', marginBottom: '12px' }}>SKILLS REQUERIDAS:</h4>
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {oferta.oferta_skills?.map(sk => {
                                                        const label = sk.nombre_original || sk.diccionario_skills?.nombre_skill || 'Skill';
                                                        return (
                                                            <span key={sk.skill_id} style={{ padding: '6px 14px', background: '#F8F9FA', borderRadius: '8px', fontSize: '0.9rem', color: '#333', border: '1px solid #EAEAEA' }}>
                                                                {label}
                                                            </span>
                                                        );
                                                    })}
                                                    {(!oferta.oferta_skills || oferta.oferta_skills.length === 0) && (
                                                        <span style={{ color: '#999', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin requerimientos</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '2rem' }}>
                                                {!yaPostulado && (
                                                    <button 
                                                        onClick={(e) => handlePostularse(e, oferta.id, oferta.porcentajeMatch)}
                                                        disabled={applyingTo === oferta.id}
                                                        style={{ background: '#00d66b', color: 'white', padding: '14px 28px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,214,107,0.3)' }}
                                                    >
                                                        {applyingTo === oferta.id ? 'Cargando...' : 'Postularme Ahora'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}
