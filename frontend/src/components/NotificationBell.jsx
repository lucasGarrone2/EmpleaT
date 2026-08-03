import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, BellOff, Loader2 } from 'lucide-react';

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    // Cerrar el panel al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cargar notificaciones iniciales
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('notificaciones')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;
                setNotifications(data || []);
            } catch (err) {
                console.error("Error al cargar notificaciones:", err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `usuario_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev =>
                            prev.map(n => n.id === payload.new.id ? payload.new : n)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Recalcular contador de no leídas
    useEffect(() => {
        const unread = notifications.filter(n => !n.leido).length;
        setUnreadCount(unread);
    }, [notifications]);

    // Marcar una como leída
    const handleMarkAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notificaciones')
                .update({ leido: true })
                .eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Error al marcar como leída:", err.message);
        }
    };

    // Marcar todas como leídas
    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
        try {
            const { error } = await supabase
                .from('notificaciones')
                .update({ leido: true })
                .eq('usuario_id', user.id)
                .eq('leido', false);
            if (error) throw error;
        } catch (err) {
            console.error("Error al marcar todas como leídas:", err.message);
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + 
               date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null;

    return (
        <div className="notification-bell-container" ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Botón Campana */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    color: isOpen ? 'var(--primary)' : 'var(--text-gray)',
                    outline: 'none'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 214, 107, 0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#e53e3e',
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(229,62,62,0.4)',
                        animation: 'pulse 2s infinite'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Panel Desplegable */}
            {isOpen && (
                <div className="notification-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '12px',
                    width: '350px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '20px',
                    boxShadow: '0 15px 50px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,214,107,0.15)',
                    overflow: 'hidden',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '450px',
                    animation: 'fadeInUp 0.2s ease'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0, 214, 107, 0.04)'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-dark)', fontWeight: '700' }}>Notificaciones</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,214,107,0.08)'}
                                onMouseOut={e => e.currentTarget.style.background = 'none'}
                            >
                                <Check size={14} /> Leer todas
                            </button>
                        )}
                    </div>

                    {/* Lista de Notificaciones */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px', color: 'var(--text-gray)' }}>
                                <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-gray)' }}>
                                <BellOff size={36} style={{ margin: '0 auto 12px auto', color: '#BBB' }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>No tienes notificaciones por el momento.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    style={{
                                        padding: '14px 20px',
                                        borderBottom: '1px solid rgba(0,0,0,0.03)',
                                        background: notif.leido ? 'transparent' : 'rgba(0, 214, 107, 0.03)',
                                        position: 'relative',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{
                                            fontWeight: notif.leido ? '600' : '800',
                                            fontSize: '0.9rem',
                                            color: notif.leido ? '#555' : 'var(--text-dark)'
                                        }}>
                                            {notif.titulo}
                                        </div>
                                        {!notif.leido && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                title="Marcar como leída"
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    borderRadius: '4px',
                                                    color: 'var(--text-gray)',
                                                    transition: 'all 0.2s',
                                                    display: 'flex'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-gray)'}
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: '#666',
                                        lineHeight: '1.4',
                                        paddingRight: '15px'
                                    }}>
                                        {notif.mensaje}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#999',
                                        marginTop: '4px'
                                    }}>
                                        {formatTime(notif.created_at)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
