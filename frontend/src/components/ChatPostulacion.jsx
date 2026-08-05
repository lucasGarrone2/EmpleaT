import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Lock, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import { triggerSessionExpired } from '../context/AuthContext';
import posthog from '../posthog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const POLL_INTERVAL_MS = 15000; // 15 segundos

/**
 * ChatPostulacion — Componente de mensajería para una postulación.
 *
 * Props:
 *   postulacionId  (string)  — UUID de la postulación
 *   miTipo         (string)  — 'candidato' | 'empresa'
 *   nombreOtro     (string)  — Nombre del otro interlocutor (para UI)
 */
export default function ChatPostulacion({ postulacionId, miTipo, nombreOtro }) {
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [puedeResponder, setPuedeResponder] = useState(false);

    const pollingRef = useRef(null);
    const lastTimestampRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Obtener el token de Supabase
    const getToken = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            triggerSessionExpired();
            return null;
        }
        return session.access_token;
    }, []);

    // Cargar todos los mensajes (carga inicial)
    const cargarMensajes = useCallback(async () => {
        const token = await getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/postulaciones/${postulacionId}/mensajes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al cargar mensajes.');
            const data = await res.json();

            setMensajes(data.mensajes || []);
            setPuedeResponder(miTipo === 'empresa' || data.candidato_puede_responder);

            if (data.mensajes?.length > 0) {
                lastTimestampRef.current = data.mensajes[data.mensajes.length - 1].created_at;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, [postulacionId, miTipo, getToken]);

    // Polling incremental: solo trae mensajes nuevos desde el último timestamp
    const pollNuevosMensajes = useCallback(async () => {
        const token = await getToken();
        if (!token) return;

        const since = lastTimestampRef.current;
        const url = since
            ? `${API_URL}/api/postulaciones/${postulacionId}/mensajes?since=${encodeURIComponent(since)}`
            : `${API_URL}/api/postulaciones/${postulacionId}/mensajes`;

        try {
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return; // Silenciar errores de polling
            const data = await res.json();

            if (data.mensajes?.length > 0) {
                setMensajes(prev => {
                    // Evitar duplicados
                    const idsExistentes = new Set(prev.map(m => m.id));
                    const nuevos = data.mensajes.filter(m => !idsExistentes.has(m.id));
                    if (nuevos.length === 0) return prev;
                    lastTimestampRef.current = data.mensajes[data.mensajes.length - 1].created_at;
                    return [...prev, ...nuevos];
                });
            }

            // Actualizar si el candidato puede responder (puede cambiar tras primer mensaje de empresa)
            if (miTipo === 'candidato') {
                setPuedeResponder(data.candidato_puede_responder);
            }
        } catch (_err) {
            // No mostrar errores de polling al usuario — se reintenta en 15s
        }
    }, [postulacionId, miTipo, getToken]);

    // Montar: cargar inicial + iniciar polling
    useEffect(() => {
        if (!postulacionId) return;

        cargarMensajes();

        // Solo iniciar polling si la vista está activa
        pollingRef.current = setInterval(pollNuevosMensajes, POLL_INTERVAL_MS);

        return () => {
            // CRÍTICO: limpiar el interval al desmontar para no dejar polling huérfano
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [postulacionId, cargarMensajes, pollNuevosMensajes]);

    // Scroll al último mensaje cuando llegan nuevos
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mensajes]);

    // Enviar mensaje
    const handleEnviar = async (e) => {
        e?.preventDefault();
        const texto = nuevoMensaje.trim();
        if (!texto || enviando) return;

        setEnviando(true);
        setError(null);

        const token = await getToken();
        if (!token) {
            setError('Tu sesión expiró. Por favor, volvé a iniciar sesión.');
            setEnviando(false);
            return;
        }

        try {
            const endpoint = miTipo === 'empresa'
                ? `${API_URL}/api/postulaciones/${postulacionId}/accion`
                : `${API_URL}/api/postulaciones/${postulacionId}/mensaje-candidato`;

            const body = miTipo === 'empresa'
                ? { tipo_accion: 'mensaje', mensaje: texto }
                : { mensaje: texto };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar el mensaje.');

            // Agregar el mensaje local inmediatamente (optimistic update)
            const { data: { session } } = await supabase.auth.getSession();
            const mensajeOptimista = {
                id: data.mensaje_id,
                remitente_id: session?.user?.id,
                remitente_tipo: miTipo,
                contenido: texto,
                leido_en: null,
                created_at: data.created_at || new Date().toISOString()
            };

            setMensajes(prev => [...prev, mensajeOptimista]);
            posthog.capture('application_message_sent', {
                sender_type: miTipo
            });
            lastTimestampRef.current = mensajeOptimista.created_at;
            setNuevoMensaje('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';

        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    // Auto-resize del textarea
    const handleTextareaChange = (e) => {
        setNuevoMensaje(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    // Enviar con Ctrl+Enter o Cmd+Enter
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleEnviar();
        }
    };

    // Formatear hora
    const formatHora = (isoStr) => {
        try {
            return new Date(isoStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    const formatFecha = (isoStr) => {
        try {
            return new Date(isoStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        } catch { return ''; }
    };

    // Agrupar mensajes por fecha para mostrar separadores
    const mensajesAgrupados = mensajes.reduce((acc, msg) => {
        const fecha = new Date(msg.created_at).toDateString();
        if (!acc.length || acc[acc.length - 1].fecha !== fecha) {
            acc.push({ fecha, mensajes: [msg] });
        } else {
            acc[acc.length - 1].mensajes.push(msg);
        }
        return acc;
    }, []);

    if (cargando) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '18px', height: '18px', border: '2px solid var(--primary)',
                        borderTopColor: 'transparent', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite'
                    }} />
                    Cargando conversación...
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '420px',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.07)',
            overflow: 'hidden'
        }}>
            {/* Header del chat */}
            <div style={{
                padding: '14px 20px',
                background: 'white',
                borderBottom: '1px solid rgba(0,0,0,0.07)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0
            }}>
                <MessageCircle size={18} color="var(--primary)" />
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                    Conversación
                    {nombreOtro && <span style={{ color: 'var(--text-gray)', fontWeight: '400' }}> con {nombreOtro}</span>}
                </span>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <Clock size={12} />
                    Actualiza cada 15s
                </span>
            </div>

            {/* Área de mensajes */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                {mensajes.length === 0 ? (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-gray)', gap: '12px', textAlign: 'center'
                    }}>
                        <MessageCircle size={40} opacity={0.2} />
                        <div>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>
                                {miTipo === 'empresa'
                                    ? 'Aún no hay mensajes en esta conversación'
                                    : 'Esperando mensaje del reclutador'}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
                                {miTipo === 'empresa'
                                    ? 'Iniciá la conversación con el candidato.'
                                    : 'Cuando el reclutador te escriba, podrás responder.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {mensajesAgrupados.map((grupo, gi) => (
                            <div key={gi}>
                                {/* Separador de fecha */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    margin: '12px 0 8px'
                                }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                        {formatFecha(grupo.mensajes[0].created_at)}
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                                </div>

                                {grupo.mensajes.map((msg) => {
                                    const esMio = msg.remitente_tipo === miTipo;
                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: esMio ? 'flex-end' : 'flex-start',
                                                marginBottom: '6px'
                                            }}
                                        >
                                            <div style={{
                                                maxWidth: '75%',
                                                background: esMio
                                                    ? 'linear-gradient(135deg, var(--primary), #00b359)'
                                                    : 'white',
                                                color: esMio ? 'white' : 'var(--text-dark)',
                                                padding: '10px 14px',
                                                borderRadius: esMio
                                                    ? '18px 18px 4px 18px'
                                                    : '18px 18px 18px 4px',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                border: esMio ? 'none' : '1px solid rgba(0,0,0,0.07)'
                                            }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '0.9rem',
                                                    lineHeight: '1.5',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {msg.contenido}
                                                </p>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    justifyContent: esMio ? 'flex-end' : 'flex-start',
                                                    marginTop: '4px'
                                                }}>
                                                    <span style={{
                                                        fontSize: '0.72rem',
                                                        opacity: 0.6,
                                                        color: esMio ? 'rgba(255,255,255,0.85)' : '#94a3b8'
                                                    }}>
                                                        {formatHora(msg.created_at)}
                                                    </span>
                                                    {esMio && msg.leido_en && (
                                                        <span style={{ fontSize: '0.72rem', opacity: 0.7 }} title="Leído">✓✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '8px 16px',
                    background: '#fef2f2',
                    borderTop: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 'bold' }}
                    >✕</button>
                </div>
            )}

            {/* Input de mensaje */}
            {puedeResponder ? (
                <form
                    onSubmit={handleEnviar}
                    style={{
                        padding: '12px 16px',
                        background: 'white',
                        borderTop: '1px solid rgba(0,0,0,0.07)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '10px',
                        flexShrink: 0
                    }}
                >
                    <textarea
                        ref={textareaRef}
                        value={nuevoMensaje}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribí un mensaje... (Ctrl+Enter para enviar)"
                        disabled={enviando}
                        maxLength={2000}
                        rows={1}
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            border: '1px solid rgba(0,0,0,0.12)',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            color: 'var(--text-dark)',
                            background: '#f8fafc',
                            lineHeight: '1.5',
                            transition: 'border-color 0.2s',
                            overflowY: 'hidden',
                            minHeight: '40px'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
                    />
                    <button
                        type="submit"
                        disabled={!nuevoMensaje.trim() || enviando}
                        style={{
                            background: nuevoMensaje.trim() ? 'var(--primary)' : '#e2e8f0',
                            color: nuevoMensaje.trim() ? 'white' : '#94a3b8',
                            border: 'none',
                            borderRadius: '12px',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: nuevoMensaje.trim() ? 'pointer' : 'not-allowed',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                        title="Enviar (Ctrl+Enter)"
                    >
                        {enviando
                            ? <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                            : <Send size={18} />
                        }
                    </button>
                </form>
            ) : (
                <div style={{
                    padding: '14px 20px',
                    background: '#f8fafc',
                    borderTop: '1px solid rgba(0,0,0,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    flexShrink: 0
                }}>
                    <Lock size={14} />
                    <span>
                        {miTipo === 'candidato'
                            ? 'Podrás responder cuando el reclutador te envíe un mensaje.'
                            : 'No tenés permisos para enviar mensajes en esta conversación.'}
                    </span>
                </div>
            )}
        </div>
    );
}
