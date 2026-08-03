import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { MessageSquare, Search, Building2, User, Clock, ChevronRight, Inbox, Filter, ArrowLeft, CheckCheck } from 'lucide-react';
import ChatPostulacion from '../components/ChatPostulacion';
import './Register.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function MisChats() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const selectPostulacionId = location.state?.selectPostulacionId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [conversaciones, setConversaciones] = useState([]);
    const [rol, setRol] = useState(null); // 'candidato' | 'empresa'
    const [chatActivo, setChatActivo] = useState(null); // { postulacion_id, nombre }
    const [busqueda, setBusqueda] = useState('');
    const [ofertaFilter, setOfertaFilter] = useState('todas'); // 'todas' | oferta_titulo
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        cargarChats();
    }, [user]);

    const cargarChats = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Sesión expirada.');

            const res = await fetch(`${API_URL}/api/chats`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cargar los chats.');

            setRol(data.rol);
            setConversaciones(data.conversaciones || []);

            // Auto-seleccionar: en desktop siempre seleccionar el primero (o selectPostulacionId); en mobile solo si viene selectPostulacionId
            if (data.conversaciones?.length > 0 && !chatActivo) {
                const shouldAutoSelect = window.innerWidth >= 768 || Boolean(selectPostulacionId);
                if (shouldAutoSelect) {
                    let target = data.conversaciones[0];
                    if (selectPostulacionId) {
                        const found = data.conversaciones.find(c => c.postulacion_id === selectPostulacionId);
                        if (found) target = found;
                    }
                    setChatActivo({
                        postulacion_id: target.postulacion_id,
                        nombre: target.interlocutor_nombre,
                        oferta: target.oferta_titulo,
                        candidato_id: target.candidato_id,
                        oferta_id: target.oferta_id
                    });
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarcarTodosLeidos = async () => {
        setMarkingAll(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch(`${API_URL}/api/chats/marcar-todos-leidos`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                setConversaciones(prev => prev.map(c => ({ ...c, no_leidos: 0 })));
            }
        } catch (err) {
            console.error('Error al marcar chats como leídos:', err);
        } finally {
            setMarkingAll(false);
        }
    };

    const formatTiempo = (isoStr) => {
        try {
            const fecha = new Date(isoStr);
            const ahora = new Date();
            const diffMs = ahora - fecha;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMin / 60);
            const diffDias = Math.floor(diffHrs / 24);

            if (diffMin < 1) return 'ahora';
            if (diffMin < 60) return `${diffMin}m`;
            if (diffHrs < 24) return `${diffHrs}h`;
            if (diffDias < 7) return `${diffDias}d`;
            return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        } catch { return ''; }
    };

    const estadoBadge = (estado) => {
        const normalized = estado?.toLowerCase() || '';
        const map = {
            'postulado': { bg: '#e0f2fe', color: '#0369a1', label: 'Postulado' },
            'en revisión': { bg: '#fef3c7', color: '#b45309', label: 'CV Visto' },
            'en_revision': { bg: '#fef3c7', color: '#b45309', label: 'CV Visto' },
            'entrevista': { bg: '#f3e8ff', color: '#6b21a8', label: 'Entrevista' },
            'seleccionado': { bg: '#dcfce7', color: '#15803d', label: 'Seleccionado' },
            'contratado': { bg: '#dcfce7', color: '#15803d', label: 'Contratado' },
            'rechazado': { bg: '#fee2e2', color: '#b91c1c', label: 'Finalizado' },
        };
        const style = map[normalized] || { bg: '#f3f4f6', color: '#374151', label: estado };
        return (
            <span style={{
                padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem',
                fontWeight: 'bold', background: style.bg, color: style.color,
                whiteSpace: 'nowrap'
            }}>
                {style.label}
            </span>
        );
    };

    const ofertasUnicas = [...new Set(conversaciones.map(c => c.oferta_titulo))].sort();

    const conversacionesFiltradas = conversaciones.filter(c => {
        const q = busqueda.toLowerCase();
        const matchBusqueda = !q || (
            c.interlocutor_nombre?.toLowerCase().includes(q) ||
            c.oferta_titulo?.toLowerCase().includes(q)
        );
        const matchOferta = ofertaFilter === 'todas' || c.oferta_titulo === ofertaFilter;
        return matchBusqueda && matchOferta;
    });

    const totalUnread = conversaciones.reduce((acc, curr) => acc + (curr.no_leidos || 0), 0);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-gray)' }}>
                    <MessageSquare size={40} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ fontWeight: '600' }}>Cargando conversaciones...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: '#b91c1c', fontWeight: '600' }}>{error}</p>
                <button onClick={cargarChats} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem 1.5rem', minHeight: '80vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', color: 'var(--text-dark)', margin: '0 0 6px 0', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        Mis Conversaciones
                    </h1>
                    <p style={{ color: 'var(--text-gray)', margin: 0, fontSize: '0.95rem' }}>
                        {rol === 'empresa'
                            ? 'Todos los chats con candidatos de tus búsquedas.'
                            : 'Tus conversaciones con los reclutadores.'}
                    </p>
                </div>
                {totalUnread > 0 && (
                    <button
                        onClick={handleMarcarTodosLeidos}
                        disabled={markingAll}
                        style={{
                            background: 'rgba(0, 214, 107, 0.1)',
                            border: '1px solid rgba(0, 214, 107, 0.3)',
                            color: 'var(--primary)',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <CheckCheck size={16} /> Marcar todas leídas
                    </button>
                )}
            </div>

            {conversaciones.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '5rem 2rem',
                    background: 'var(--bg-white)', borderRadius: '24px',
                    border: '2px dashed rgba(0,0,0,0.1)'
                }}>
                    <Inbox size={60} color="var(--primary)" style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                        Sin conversaciones aún
                    </h3>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                        {rol === 'empresa'
                            ? 'Cuando envíes un mensaje a un candidato, aparecerá aquí.'
                            : 'Cuando un reclutador te escriba, la conversación aparecerá aquí.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

                    {/* Sidebar: Lista de chats */}
                    {(!isMobile || !chatActivo) && (
                        <div style={{
                            width: isMobile ? '100%' : '340px', flexShrink: 0,
                            background: 'var(--bg-white)', borderRadius: '20px',
                            border: '1px solid rgba(0,0,0,0.06)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                            overflow: 'hidden', position: isMobile ? 'static' : 'sticky', top: '5rem'
                        }}>
                            {/* Buscador + Filtro por oferta */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                    borderRadius: '10px', padding: '8px 12px'
                                }}>
                                    <Search size={15} color="#94a3b8" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre u oferta..."
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                        style={{ border: 'none', outline: 'none', fontSize: '0.88rem', background: 'transparent', width: '100%', color: 'var(--text-dark)' }}
                                    />
                                </div>
                                {rol === 'empresa' && ofertasUnicas.length > 1 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Filter size={13} color="#94a3b8" />
                                        <select
                                            value={ofertaFilter}
                                            onChange={e => setOfertaFilter(e.target.value)}
                                            style={{
                                                flex: 1, padding: '6px 10px', borderRadius: '8px',
                                                border: '1px solid #e2e8f0', fontSize: '0.82rem',
                                                color: 'var(--text-dark)', outline: 'none', background: '#f8fafc',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="todas">Todas las ofertas ({conversaciones.length})</option>
                                            {ofertasUnicas.map(titulo => {
                                                const count = conversaciones.filter(c => c.oferta_titulo === titulo).length;
                                                return (
                                                    <option key={titulo} value={titulo}>
                                                        {titulo} ({count})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Lista */}
                            <div style={{ overflowY: 'auto', maxHeight: isMobile ? 'calc(100vh - 250px)' : '70vh' }}>
                                {conversacionesFiltradas.length === 0 ? (
                                    <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                        Sin resultados
                                    </p>
                                ) : (
                                    conversacionesFiltradas.map((conv) => {
                                        const isActivo = chatActivo?.postulacion_id === conv.postulacion_id;
                                        return (
                                            <div
                                                key={conv.postulacion_id}
                                                onClick={() => setChatActivo({
                                                    postulacion_id: conv.postulacion_id,
                                                    nombre: conv.interlocutor_nombre,
                                                    oferta: conv.oferta_titulo,
                                                    candidato_id: conv.candidato_id,
                                                    oferta_id: conv.oferta_id
                                                })}
                                                style={{
                                                    padding: '14px 16px',
                                                    cursor: 'pointer',
                                                    background: isActivo ? 'rgba(0,214,107,0.06)' : 'transparent',
                                                    borderLeft: isActivo ? '3px solid var(--primary)' : '3px solid transparent',
                                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseOver={e => { if (!isActivo) e.currentTarget.style.background = '#f8fafc'; }}
                                                onMouseOut={e => { if (!isActivo) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    {/* Avatar */}
                                                    <div style={{
                                                        width: '42px', height: '42px', borderRadius: '50%',
                                                        background: 'rgba(0,214,107,0.1)', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        overflow: 'hidden', border: '1px solid rgba(0,214,107,0.2)'
                                                    }}>
                                                        {(conv.interlocutor_logo || conv.interlocutor_foto) ? (
                                                            <img
                                                                src={conv.interlocutor_logo || conv.interlocutor_foto}
                                                                alt=""
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : rol === 'empresa' ? (
                                                            <User size={18} color="var(--primary)" />
                                                        ) : (
                                                            <Building2 size={18} color="var(--primary)" />
                                                        )}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                            <span style={{
                                                                fontWeight: conv.no_leidos > 0 ? '700' : '600',
                                                                fontSize: '0.9rem', color: 'var(--text-dark)',
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                            }}>
                                                                {conv.interlocutor_nombre}
                                                            </span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                                {conv.no_leidos > 0 && (
                                                                    <span style={{
                                                                        background: 'var(--primary)', color: 'white',
                                                                        borderRadius: '50%', width: '18px', height: '18px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '0.7rem', fontWeight: 'bold'
                                                                    }}>
                                                                        {conv.no_leidos}
                                                                    </span>
                                                                )}
                                                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                                    {formatTiempo(conv.ultimo_mensaje.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p style={{
                                                            margin: '0 0 4px 0', fontSize: '0.78rem',
                                                            color: 'var(--primary)', fontWeight: '600',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}>
                                                            {conv.oferta_titulo}
                                                        </p>

                                                        <p style={{
                                                            margin: 0, fontSize: '0.82rem',
                                                            color: conv.no_leidos > 0 ? 'var(--text-dark)' : '#94a3b8',
                                                            fontWeight: conv.no_leidos > 0 ? '500' : '400',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}>
                                                            {conv.ultimo_mensaje.remitente_tipo === (rol === 'empresa' ? 'empresa' : 'candidato')
                                                                ? 'Vos: '
                                                                : ''}
                                                            {conv.ultimo_mensaje.contenido}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '6px', paddingLeft: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    {estadoBadge(conv.estado)}
                                                    {rol === 'empresa' && conv.oferta_id && conv.candidato_id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/oferta-empresa/${conv.oferta_id}/candidato/${conv.candidato_id}`);
                                                            }}
                                                            style={{
                                                                background: 'none', border: 'none', cursor: 'pointer',
                                                                color: 'var(--primary)', fontSize: '0.72rem', fontWeight: '700',
                                                                display: 'flex', alignItems: 'center', gap: '2px',
                                                                padding: '2px 4px', borderRadius: '6px'
                                                            }}
                                                            title="Ver perfil del candidato"
                                                        >
                                                            Ver perfil <ChevronRight size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Panel derecho: Chat activo */}
                    {(!isMobile || chatActivo) && (
                        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : 'auto' }}>
                            {chatActivo ? (
                                <div style={{
                                    background: 'var(--bg-white)', borderRadius: '20px',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Header del chat activo */}
                                    <div style={{
                                        padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)',
                                        display: 'flex', alignItems: 'center', gap: '12px', background: '#fafffe'
                                    }}>
                                        {/* Botón Volver en Celular */}
                                        {isMobile && (
                                            <button
                                                onClick={() => setChatActivo(null)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    padding: '6px', borderRadius: '50%', color: 'var(--primary)'
                                                }}
                                                title="Volver a lista"
                                            >
                                                <ArrowLeft size={22} />
                                            </button>
                                        )}

                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: 'rgba(0,214,107,0.1)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid rgba(0,214,107,0.2)', flexShrink: 0
                                        }}>
                                            {rol === 'empresa'
                                                ? <User size={18} color="var(--primary)" />
                                                : <Building2 size={18} color="var(--primary)" />
                                            }
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-dark)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {chatActivo.nombre}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {chatActivo.oferta}
                                            </p>
                                        </div>
                                        {rol === 'empresa' && chatActivo.candidato_id && chatActivo.oferta_id && (
                                            <button
                                                onClick={() => navigate(`/oferta-empresa/${chatActivo.oferta_id}/candidato/${chatActivo.candidato_id}`)}
                                                style={{
                                                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
                                                    background: 'rgba(0,214,107,0.08)', border: '1px solid rgba(0,214,107,0.25)',
                                                    color: 'var(--primary)', borderRadius: '10px', padding: '6px 12px',
                                                    fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                                                }}
                                            >
                                                {isMobile ? 'Perfil' : 'Ver perfil'} <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Chat Body */}
                                    <div style={{ padding: isMobile ? '1rem 0.75rem' : '1.5rem' }}>
                                        <ChatPostulacion
                                            key={chatActivo.postulacion_id}
                                            postulacionId={chatActivo.postulacion_id}
                                            miTipo={rol}
                                            nombreOtro={chatActivo.nombre}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', height: '400px',
                                    background: 'var(--bg-white)', borderRadius: '20px',
                                    border: '1px solid rgba(0,0,0,0.06)', color: 'var(--text-gray)'
                                }}>
                                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p style={{ fontWeight: '600' }}>Seleccioná una conversación</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
