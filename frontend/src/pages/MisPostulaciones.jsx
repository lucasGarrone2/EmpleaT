import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Briefcase, Calendar, ExternalLink, Search, Filter, ArrowUpDown, ChevronRight, Check, X, Award, PartyPopper, MessageSquare } from 'lucide-react';
import ChatPostulacion from '../components/ChatPostulacion';
import './Register.css'; // Reusing established styling tokens

export default function MisPostulaciones() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [postulaciones, setPostulaciones] = useState([]);
    const [filteredPostulaciones, setFilteredPostulaciones] = useState([]);
    
    // Filtros, búsqueda y orden
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest

    // Chat: guardar qué postulación tiene el chat abierto
    const [chatAbiertoId, setChatAbiertoId] = useState(null);
    const [candidatoId, setCandidatoId] = useState(null); // auth_id del candidato
    const [miAuthId, setMiAuthId] = useState(null);
    
    // Estadísticas
    const [stats, setStats] = useState({
        total: 0,
        enRevision: 0,
        entrevista: 0,
        seleccionado: 0
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchPostulaciones = async () => {
            try {
                // Guardar auth_id propio para pasarlo al chat
                setMiAuthId(user.id);

                // 1. Obtener ID del candidato logueado
                const { data: candData, error: candError } = await supabase
                    .from('candidatos')
                    .select('id')
                    .eq('auth_id', user.id)
                    .maybeSingle();

                if (candError) throw candError;

                if (candData) {
                    // 2. Traer todas sus postulaciones con info de ofertas y empresas
                    const { data: postData, error: postError } = await supabase
                        .from('postulaciones')
                        .select(`
                            id,
                            estado,
                            fecha_postulacion,
                            motivo_rechazo_id,
                            motivos_rechazo (
                                descripcion
                            ),
                            ofertas (
                                id,
                                titulo,
                                empresas (
                                    razon_social,
                                    sitio_web
                                )
                            )
                        `)
                        .eq('candidato_id', candData.id)
                        .order('fecha_postulacion', { ascending: false });

                    if (postError) throw postError;

                    if (postData) {
                        setPostulaciones(postData);
                        setFilteredPostulaciones(postData);
                        
                        // Calcular estadísticas
                        const newStats = { total: postData.length, enRevision: 0, entrevista: 0, seleccionado: 0 };
                        postData.forEach(p => {
                            const est = p.estado?.toLowerCase() || '';
                            if (est === 'en revisión' || est === 'en_revision' || est === 'en revision') newStats.enRevision++;
                            if (est === 'entrevista') newStats.entrevista++;
                            if (est === 'seleccionado' || est === 'contratado') newStats.seleccionado++;
                        });
                        setStats(newStats);
                    }
                }
            } catch (err) {
                console.error("Error al cargar postulaciones", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPostulaciones();
    }, [user, navigate]);

    // Aplicar filtros, búsqueda y ordenamiento
    useEffect(() => {
        let result = [...postulaciones];

        // 1. Búsqueda por título de oferta o empresa
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(p => {
                const titulo = p.ofertas?.titulo?.toLowerCase() || '';
                const empresa = p.ofertas?.empresas?.razon_social?.toLowerCase() || '';
                return titulo.includes(query) || empresa.includes(query);
            });
        }

        // 2. Filtro por estado
        if (statusFilter !== 'todos') {
            result = result.filter(p => {
                const est = p.estado?.toLowerCase() || '';
                if (statusFilter === 'en_revision') return est === 'en revisión' || est === 'en_revision' || est === 'en revision';
                if (statusFilter === 'seleccionado') return est === 'seleccionado' || est === 'contratado';
                return est === statusFilter;
            });
        }

        // 3. Ordenamiento por fecha
        result.sort((a, b) => {
            const dateA = new Date(a.fecha_postulacion).getTime();
            const dateB = new Date(b.fecha_postulacion).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredPostulaciones(result);
    }, [searchQuery, statusFilter, sortBy, postulaciones]);

    if (loading) {
        return (
            <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Cargando tus postulaciones...</div>
            </div>
        );
    }

    return (
        <div className="register-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Link to="/" className="back-link" style={{ top: '2rem', left: '2rem' }}>
                &larr; Volver al inicio
            </Link>

            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '1050px', 
                backgroundColor: 'var(--bg-white)', 
                borderRadius: '24px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                padding: '3.5rem',
                border: '1px solid rgba(0,214,107,0.1)',
                zIndex: 1,
                marginTop: '4rem',
                marginBottom: '4rem'
            }}>
                {/* Encabezado Principal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '2px solid rgba(0,214,107,0.1)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h2 className="brand-title" style={{ fontSize: '2.6rem', margin: 0 }}>Mis Postulaciones</h2>
                        <p style={{ color: 'var(--text-gray)', margin: '5px 0 0 0', fontSize: '1.05rem' }}>Supervisa tus candidaturas activas y el avance de tu reclutamiento en tiempo real.</p>
                    </div>
                    <Link to="/ofertas" className="submit-btn" style={{ padding: '12px 24px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', textDecoration: 'none', boxShadow: 'none' }}>
                        Explorar Empleos &rarr;
                    </Link>
                </div>

                {/* Grid de Métricas / Estadísticas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--text-dark)', display: 'block', marginBottom: '5px' }}>{stats.total}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Enviadas</span>
                    </div>
                    <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#d97706', display: 'block', marginBottom: '5px' }}>{stats.enRevision}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase' }}>CVs Vistos</span>
                    </div>
                    <div style={{ background: '#f5f3ff', border: '1px solid #ede9fe', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#7c3aed', display: 'block', marginBottom: '5px' }}>{stats.entrevista}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#6d28d9', textTransform: 'uppercase' }}>En Entrevista</span>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '5px' }}>{stats.seleccionado}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase' }}>
                            Seleccionado <PartyPopper size={14} />
                        </span>
                    </div>
                </div>

                {/* Filtros e Inputs de Búsqueda */}
                <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: '2rem', 
                    flexWrap: 'wrap',
                    background: '#f8fafc',
                    padding: '1.2rem',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0'
                }}>
                    {/* Buscador */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px', flex: '1 1 300px', boxSizing: 'border-box' }}>
                        <Search size={18} color="#64748b" />
                        <input
                            type="text"
                            placeholder="Buscar por empleo o empresa..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.95rem', width: '100%', color: 'var(--text-dark)' }}
                        />
                    </div>

                    {/* Controles de Filtros */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Selector de Estado */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px' }}>
                            <Filter size={16} color="#64748b" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dark)', cursor: 'pointer', background: 'white' }}
                            >
                                <option value="todos">Todos los Estados</option>
                                <option value="postulado">Enviado</option>
                                <option value="en_revision">CV Visto</option>
                                <option value="entrevista">En Entrevista</option>
                                <option value="seleccionado">Seleccionado</option>
                                <option value="rechazado">Proceso Finalizado</option>
                            </select>
                        </div>

                        {/* Selector de Orden */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px' }}>
                            <ArrowUpDown size={16} color="#64748b" />
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dark)', cursor: 'pointer', background: 'white' }}
                            >
                                <option value="newest">Más recientes primero</option>
                                <option value="oldest">Más antiguos primero</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Listado de Candidaturas */}
                {filteredPostulaciones.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {filteredPostulaciones.map((post) => {
                            const oferta = post.ofertas;
                            const empresa = oferta?.empresas;
                            const normalized = post.estado?.toLowerCase() || 'postulado';
                            
                            const isEnRevisionOrHigher = ['en_revision', 'en revisión', 'en revision', 'entrevista', 'seleccionado', 'contratado'].includes(normalized);
                            const isEntrevistaOrHigher = ['entrevista', 'seleccionado', 'contratado'].includes(normalized);
                            
                            return (
                                <div key={post.id} style={{
                                    background: 'rgba(0,214,107,0.01)',
                                    border: '1px solid rgba(0,214,107,0.1)',
                                    borderRadius: '16px',
                                    padding: '2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                                    transition: 'transform 0.2s',
                                    cursor: 'default'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {/* Cabecera de la Tarjeta */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: 'var(--text-dark)', fontWeight: 'bold' }}>{oferta?.titulo}</h3>
                                            <div style={{ color: 'var(--text-gray)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{empresa?.razon_social || 'Empresa Privada'}</span>
                                                {empresa?.sitio_web && (
                                                    <a href={empresa.sitio_web.startsWith('http') ? empresa.sitio_web : `https://${empresa.sitio_web}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                                                        Sitio Web <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            {(() => {
                                                if (normalized === 'en_revision' || normalized === 'en revisión' || normalized === 'en revision') return <span style={{ padding: '6px 14px', background: '#fef3c7', color: '#b45309', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>CV Visto / En Revisión</span>;
                                                if (normalized === 'entrevista') return <span style={{ padding: '6px 14px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>En Entrevista</span>;
                                                if (normalized === 'seleccionado' || normalized === 'contratado') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>¡Seleccionado! <PartyPopper size={12} /></span>;
                                                if (normalized === 'rechazado') return <span style={{ padding: '6px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Proceso Finalizado</span>;
                                                return <span style={{ padding: '6px 14px', background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Enviado</span>;
                                            })()}
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={14} /> Postulado el {new Date(post.fecha_postulacion).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stepper del ATS Horizontal en Degradé */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', position: 'relative', padding: '0 1rem' }}>
                                        {/* Línea de fondo */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            left: '8%',
                                            right: '8%',
                                            height: '4px',
                                            background: '#e2e8f0',
                                            zIndex: 0
                                        }}></div>
                                        {/* Línea de progreso */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            left: '8%',
                                            width: (normalized === 'seleccionado' || normalized === 'contratado') ? '84%' : normalized === 'entrevista' ? '56%' : isEnRevisionOrHigher ? '28%' : '0%',
                                            height: '4px',
                                            background: normalized === 'rechazado' ? '#ef4444' : 'var(--primary)',
                                            zIndex: 0,
                                            transition: 'width 0.4s ease'
                                        }}></div>
                                        
                                        {/* Paso 1: Postulado */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%',
                                                background: normalized === 'rechazado' ? '#fee2e2' : 'var(--primary)',
                                                color: normalized === 'rechazado' ? '#b91c1c' : 'white',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                fontWeight: 'bold', fontSize: '0.9rem', border: '3px solid white',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                            }}><Check size={14} /></div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px' }}>Enviado</span>
                                        </div>

                                        {/* Paso 2: CV Visto */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%',
                                                background: normalized === 'rechazado' ? '#fee2e2' : isEnRevisionOrHigher ? 'var(--primary)' : '#e2e8f0',
                                                color: normalized === 'rechazado' ? '#b91c1c' : isEnRevisionOrHigher ? 'white' : '#64748b',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                fontWeight: 'bold', fontSize: '0.9rem', border: '3px solid white',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                            }}>{normalized === 'rechazado' ? <X size={14} /> : isEnRevisionOrHigher ? <Check size={14} /> : '2'}</div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: isEnRevisionOrHigher ? 'bold' : '500', color: isEnRevisionOrHigher ? 'var(--text-dark)' : 'var(--text-gray)', marginTop: '6px' }}>
                                                {normalized === 'rechazado' ? 'Finalizado' : 'CV Visto'}
                                            </span>
                                        </div>

                                        {/* Paso 3: Entrevista */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%',
                                                background: normalized === 'rechazado' ? '#fee2e2' : isEntrevistaOrHigher ? 'var(--primary)' : '#e2e8f0',
                                                color: normalized === 'rechazado' ? '#b91c1c' : isEntrevistaOrHigher ? 'white' : '#64748b',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                fontWeight: 'bold', fontSize: '0.9rem', border: '3px solid white',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                            }}>{normalized === 'rechazado' ? <X size={14} /> : isEntrevistaOrHigher ? <Check size={14} /> : '3'}</div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: isEntrevistaOrHigher ? 'bold' : '500', color: isEntrevistaOrHigher ? 'var(--text-dark)' : 'var(--text-gray)', marginTop: '6px' }}>Entrevista</span>
                                        </div>

                                        {/* Paso 4: Seleccionado */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%',
                                                background: (normalized === 'seleccionado' || normalized === 'contratado') ? '#22c55e' : normalized === 'rechazado' ? '#fee2e2' : '#e2e8f0',
                                                color: (normalized === 'seleccionado' || normalized === 'contratado') ? 'white' : normalized === 'rechazado' ? '#b91c1c' : '#64748b',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                fontWeight: 'bold', fontSize: '0.9rem', border: '3px solid white',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                            }}>{(normalized === 'seleccionado' || normalized === 'contratado') ? <PartyPopper size={14} /> : normalized === 'rechazado' ? <X size={14} /> : '4'}</div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: (normalized === 'seleccionado' || normalized === 'contratado') ? 'bold' : '500', color: (normalized === 'seleccionado' || normalized === 'contratado') ? '#166534' : 'var(--text-gray)', marginTop: '6px' }}>Seleccionado</span>
                                        </div>
                                    </div>
                                    {normalized === 'rechazado' && post.motivos_rechazo && (
                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1rem 1.2rem',
                                            backgroundColor: '#fef2f2',
                                            border: '1px solid #fee2e2',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px'
                                        }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retroalimentación del Proceso</span>
                                            <p style={{ margin: 0, fontSize: '0.92rem', color: '#b91c1c', fontWeight: '500' }}>
                                                Motivo de descarte: <span style={{ fontWeight: 'normal', color: '#7f1d1d' }}>{post.motivos_rechazo.descripcion}</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Botón para abrir el chat (solo si hay conversación iniciada por la empresa) */}
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setChatAbiertoId(chatAbiertoId === post.id ? null : post.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                background: chatAbiertoId === post.id ? 'rgba(0,214,107,0.1)' : 'rgba(0,0,0,0.04)',
                                                border: chatAbiertoId === post.id ? '1px solid rgba(0,214,107,0.3)' : '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '10px', padding: '8px 14px',
                                                fontSize: '0.85rem', fontWeight: '600',
                                                color: chatAbiertoId === post.id ? 'var(--primary)' : 'var(--text-gray)',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <MessageSquare size={15} />
                                            {chatAbiertoId === post.id ? 'Cerrar chat' : 'Ver chat'}
                                        </button>
                                    </div>

                                    {/* Chat expandible */}
                                    {chatAbiertoId === post.id && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <ChatPostulacion
                                                postulacionId={post.id}
                                                miTipo="candidato"
                                                nombreOtro={oferta?.empresas?.razon_social || 'el reclutador'}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '20px' }}>
                        <Briefcase size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'var(--text-dark)' }}>No se encontraron postulaciones</h4>
                        <p style={{ color: 'var(--text-gray)', margin: '0 0 1.5rem 0', fontSize: '1rem' }}>Prueba cambiando los términos de búsqueda o los filtros aplicados.</p>
                        <button 
                            onClick={() => { setSearchQuery(''); setStatusFilter('todos'); }}
                            style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
