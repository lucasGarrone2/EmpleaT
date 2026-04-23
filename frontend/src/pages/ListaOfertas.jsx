import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Filter, Star, MapPin, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';

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

    const locationRouter = useLocation();
    const queryParams = new URLSearchParams(locationRouter.search);

    // Filter states
    const [filtros, setFiltros] = useState({
        palabraClave: queryParams.get('q') || '',
        ubicacionTexto: queryParams.get('loc') || '',
        ubicacion: 'Todas',
        modalidad: { Remoto: false, Híbrido: false, Presencial: false },
        rubro: 'Todos'
    });

    const [ordenamiento, setOrdenamiento] = useState('Mejor Match');
    const [paginaActual, setPaginaActual] = useState(1);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.user_metadata?.rol === 'empresa') {
            navigate('/dashboard-empresa');
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
                    .select(`
                        skill_id,
                        nombre_original,
                        nivel_estimado,
                        diccionario_skills(nombre_skill)
                    `)
                    .eq('candidato_id', candData.id);
                
                if (skillsError) throw skillsError;
                const arraySkillsCandidato = candSkills || [];

                const { data: misPostulaciones } = await supabase
                    .from('postulaciones')
                    .select('oferta_id')
                    .eq('candidato_id', candData.id);
                
                const setPostuladas = new Set((misPostulaciones || []).map(p => p.oferta_id));
                setPostulacionesIds(setPostuladas);

                const { data: ofertasData, error: ofError } = await supabase
                    .from('ofertas')
                    .select(`
                        id, titulo, modalidad, descripcion, salario_min_usd, salario_max_usd, creada_en, porcentaje_match_minimo,
                        empresas (nombre, ubicacion, logo_url),
                        oferta_skills (
                            skill_id,
                            nombre_original,
                            nivel_requerido,
                            diccionario_skills (nombre_skill)
                        )
                    `)
                    .eq('estado', 'Publicada');
                
                if (ofError) throw ofError;

                const ofertasConMatch = (ofertasData || []).map(oferta => {
                    const skillsRequeridas = oferta.oferta_skills || [];
                    const totalRequeridas = skillsRequeridas.length;
                    let confidenciasReales = 0;

                    if (totalRequeridas > 0) {
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
                            'desarrollo web': ['html', 'css', 'javascript', 'frontend', 'backend', 'web', 'php', 'diseño web'],
                            'html': ['html5', 'frontend', 'desarrollo web', 'css', 'diseño web'],
                            'css': ['css3', 'frontend', 'desarrollo web', 'html', 'diseño web']
                        };

                        skillsRequeridas.forEach(req => {
                            const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
                            const reqStr = normalize(req.nombre_original) || normalize(req.diccionario_skills?.nombre_skill);
                            const nivelReq = req.nivel_requerido ?? null;

                            const matchTarget = arraySkillsCandidato.find(cs => {
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

                            req.isMatch = !!matchTarget;
                            if (matchTarget) {
                                if (!nivelReq) {
                                    confidenciasReales += 1.0;
                                } else {
                                    const nivelCand = matchTarget.nivel_estimado || 3;
                                    const diff = nivelReq - nivelCand;
                                    if (diff <= 0) confidenciasReales += 1.0;
                                    else if (diff === 1) confidenciasReales += 0.75;
                                    else if (diff === 2) confidenciasReales += 0.50;
                                    else confidenciasReales += 0.10;
                                }
                            }
                        });
                    }

                    const porcentajeMatch = totalRequeridas > 0 ? Math.round((confidenciasReales / totalRequeridas) * 100) : 0;
                    return { ...oferta, porcentajeMatch };
                });

                const ofertasConMatchFiltradas = ofertasConMatch.filter(oferta => {
                    if (!oferta.porcentaje_match_minimo || oferta.porcentaje_match_minimo === 0) return true;
                    return oferta.porcentajeMatch >= oferta.porcentaje_match_minimo;
                });

                ofertasConMatchFiltradas.sort((a, b) => b.porcentajeMatch - a.porcentajeMatch);
                setOfertas(ofertasConMatchFiltradas);

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
            // VERIFICACIÓN JUST-IN-TIME DE LÍMITE DE POSTULACIONES
            const { data: ofertaInfo } = await supabase
                .from('ofertas')
                .select('limite_postulaciones')
                .eq('id', ofertaId)
                .single();

            if (ofertaInfo?.limite_postulaciones) {
                const { count } = await supabase
                    .from('postulaciones')
                    .select('*', { count: 'exact', head: true })
                    .eq('oferta_id', ofertaId);
                    
                if (count >= ofertaInfo.limite_postulaciones) {
                    alert("Lo sentimos. Esta oferta ha alcanzado su cupo máximo de postulantes.");
                    setApplyingTo(null);
                    return;
                }
            }

            const { error: postError } = await supabase
                .from('postulaciones')
                .insert({
                    candidato_id: candidatoId,
                    oferta_id: ofertaId,
                    porcentaje_match_calculado: porcentajeMatch,
                    estado: 'Postulado'
                });

            if (postError) {
                if (postError.code === '23505') {
                   // Ignoramos silenciosamente si la UI envió un spam click doble
                   console.warn("Intento de postulacion duplicada bloqueada.");
                } else {
                   throw postError;
                }
            }

            setPostulacionesIds(prev => {
                const updated = new Set(prev);
                updated.add(ofertaId);
                return updated;
            });
        } catch (err) {
            alert("Error del servidor: No pudimos procesar tu solicitud.");
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
        // Keyword filter
        if (filtros.palabraClave) {
            const qw = filtros.palabraClave.toLowerCase().trim();
            const title = (o.titulo || '').toLowerCase();
            const desc = (o.descripcion || '').toLowerCase();
            const empName = (o.empresas?.nombre || '').toLowerCase();
            const mod = (o.modalidad || '').toLowerCase();
            const loc = (o.empresas?.ubicacion || '').toLowerCase();
            
            const hasSkillMatch = (o.oferta_skills || []).some(sk => {
                const skName = (sk.nombre_original || sk.diccionario_skills?.nombre_skill || '').toLowerCase();
                return skName.includes(qw);
            });

            if (!title.includes(qw) && !desc.includes(qw) && !empName.includes(qw) && !mod.includes(qw) && !loc.includes(qw) && !hasSkillMatch) {
                return false;
            }
        }

        // Location text filter from Landing Page
        if (filtros.ubicacionTexto) {
             const locText = filtros.ubicacionTexto.toLowerCase().trim();
             const empLoc = (o.empresas?.ubicacion || '').toLowerCase();
             const modalidad = (o.modalidad || '').toLowerCase();
             if (!empLoc.includes(locText) && !modalidad.includes(locText)) {
                 return false;
             }
        }

        if (filtros.ubicacion !== 'Todas' && o.empresas?.ubicacion !== filtros.ubicacion) return false;
        
        const isCualquierModalidadFalse = !filtros.modalidad.Remoto && !filtros.modalidad.Híbrido && !filtros.modalidad.Presencial;
        if (!isCualquierModalidadFalse) {
            if (!filtros.modalidad[o.modalidad]) return false;
        }

        return true;
    });

    // Paginación y Ordenamiento seguros
    const ofertasOrdenadas = [...ofertasZ].sort((a, b) => {
        if (ordenamiento === 'Mejor Match') return b.porcentajeMatch - a.porcentajeMatch;
        if (ordenamiento === 'Más recientes') return new Date(b.creada_en) - new Date(a.creada_en);
        if (ordenamiento === 'Más antiguas') return new Date(a.creada_en) - new Date(b.creada_en);
        return 0;
    });

    const ITEMS_PER_PAGE = 12;
    const totalPages = Math.ceil(ofertasOrdenadas.length / ITEMS_PER_PAGE) || 1;
    const paginaSegura = paginaActual > totalPages ? totalPages : paginaActual;
    const ofertasPaginadas = ofertasOrdenadas.slice((paginaSegura - 1) * ITEMS_PER_PAGE, paginaSegura * ITEMS_PER_PAGE);

    // Cuando cambia un filtro o el ordenamiento, volvemos a la pagina 1
    useEffect(() => {
        setPaginaActual(1);
    }, [filtros, ordenamiento]);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                        <Filter size={20} color="#555" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Filtros</h3>
                    </div>

                    {(filtros.palabraClave || filtros.ubicacionTexto) && (
                        <div style={{ marginBottom: '1.5rem', background: '#F0F9F4', padding: '10px', borderRadius: '8px', border: '1px solid #c2e8d4' }}>
                            <div style={{ fontSize: '0.85rem', color: '#00B159', fontWeight: 'bold', marginBottom: '5px' }}>Búsqueda Activa:</div>
                            {filtros.palabraClave && <div style={{ fontSize: '0.9rem', color: '#333' }}>Puesto: <strong>{filtros.palabraClave}</strong></div>}
                            {filtros.ubicacionTexto && <div style={{ fontSize: '0.9rem', color: '#333' }}>Lugar: <strong>{filtros.ubicacionTexto}</strong></div>}
                            <button 
                                onClick={() => setFiltros({...filtros, palabraClave: '', ubicacionTexto: ''})} 
                                style={{ marginTop: '8px', fontSize: '0.8rem', color: '#0084FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                                Limpiar Búsqueda
                            </button>
                        </div>
                    )}

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
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Ordenar por</label>
                        <select 
                            value={ordenamiento}
                            onChange={(e) => setOrdenamiento(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white' }}
                        >
                            <option>Mejor Match</option>
                            <option>Más recientes</option>
                            <option>Más antiguas</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Rating de empresa</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="#e0e0e0" color="#e0e0e0" />)}
                        </div>
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
                        {ofertasOrdenadas.length} empleos encontrados
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {ofertasPaginadas.map(oferta => {
                            const matchColor = oferta.porcentajeMatch >= 75 ? '#00d66b' : (oferta.porcentajeMatch >= 40 ? '#FFB020' : '#d32f2f');
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
                                            <div style={{ width: '56px', height: '56px', background: '#F0F9F4', color: '#00B159', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                                                {oferta.empresas?.logo_url ? (
                                                    <img src={oferta.empresas.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    empLetra
                                                )}
                                            </div>
                                            
                                            {/* Info Basica */}
                                            <div>
                                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.15rem', color: '#222' }}>{oferta.titulo}</h3>
                                                <div style={{ color: '#666', fontSize: '0.95rem', marginBottom: '8px' }}>{oferta.empresas?.nombre}</div>
                                                
                                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                    {(oferta.modalidad === 'Presencial' || oferta.modalidad === 'Híbrido') && (
                                                        <span style={{ background: '#F5F6F8', color: '#555', padding: '4px 10px', borderRadius: '6px' }}>
                                                            <MapPin size={12} style={{ display: 'inline', marginRight: '4px', position: 'relative', top: '1px' }} />
                                                            {oferta.empresas?.ubicacion || 'Ubicación a acordar'}
                                                        </span>
                                                    )}
                                                    <span style={{ background: '#EAF9F1', color: '#00B159', padding: '4px 10px', borderRadius: '6px' }}>{oferta.modalidad}</span>
                                                    {(oferta.salario_min_usd > 0) && (
                                                        <span style={{ background: '#E6F7FF', color: '#0084FF', padding: '4px 10px', borderRadius: '6px', fontWeight: '500' }}>
                                                            ${oferta.salario_min_usd.toLocaleString()} - {oferta.salario_max_usd ? `$${oferta.salario_max_usd.toLocaleString()} USD` : '+ USD'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Motivational Badge */}
                                                {oferta.porcentaje_match_minimo > 0 && (
                                                    <div style={{ display: 'inline-block', background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(255, 165, 0, 0.3)' }}>
                                                        🌟 ¡Tu perfil supera el {oferta.porcentaje_match_minimo}% exigido por la empresa!
                                                    </div>
                                                )}
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
                                                        const matched = sk.isMatch;
                                                        
                                                        return (
                                                            <span key={sk.skill_id} style={{ 
                                                                padding: '6px 14px', 
                                                                background: matched ? 'rgba(0,214,107,0.1)' : '#F8F9FA', 
                                                                borderRadius: '8px', 
                                                                fontSize: '0.9rem', 
                                                                color: matched ? 'var(--primary)' : '#888', 
                                                                border: `1px solid ${matched ? 'rgba(0,214,107,0.2)' : '#EAEAEA'}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontWeight: matched ? 'bold' : 'normal'
                                                            }}>
                                                                <span style={{ fontSize: '1.1rem' }}>{matched ? '✓' : '✗'}</span> {label}
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

                        {ofertasPaginadas.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#888', background: 'white', borderRadius: '12px', border: '1px dashed #ddd' }}>
                                No hay resultados con los filtros actuales.
                            </div>
                        )}
                        
                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '15px' }}>
                                <button 
                                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                    disabled={paginaSegura === 1}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '8px',
                                        background: paginaSegura === 1 ? '#f5f5f5' : 'white', 
                                        border: '1px solid #ddd', color: paginaSegura === 1 ? '#aaa' : '#333',
                                        cursor: paginaSegura === 1 ? 'not-allowed' : 'pointer', transition: '0.2s', fontWeight: 'bold'
                                    }}
                                >
                                    <ChevronLeft size={18} style={{ marginRight: '5px' }} /> Anterior
                                </button>
                                
                                <span style={{ fontWeight: 'bold', color: '#555' }}>
                                    Página {paginaSegura} de {totalPages}
                                </span>
                                
                                <button 
                                    onClick={() => setPaginaActual(p => Math.min(totalPages, p + 1))}
                                    disabled={paginaSegura === totalPages}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '8px',
                                        background: paginaSegura === totalPages ? '#f5f5f5' : 'white', 
                                        border: '1px solid #ddd', color: paginaSegura === totalPages ? '#aaa' : '#333',
                                        cursor: paginaSegura === totalPages ? 'not-allowed' : 'pointer', transition: '0.2s', fontWeight: 'bold'
                                    }}
                                >
                                    Siguiente <ChevronRight size={18} style={{ marginLeft: '5px' }} />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
