import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { MessageSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const POLL_INTERVAL = 30000; // 30 segundos

/**
 * ChatBadge — Icono de mensajes con badge de no leídos.
 * Hace polling liviano cada 30s al endpoint /api/chats para contar mensajes sin leer.
 * Al hacer click navega a /mis-chats.
 */
export default function ChatBadge() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const pollingRef = useRef(null);

    const fetchUnread = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch(`${API_URL}/api/chats/no-leidos`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setUnreadCount(data.total || 0);
        } catch (_) {
            // Silenciar: no es crítico
        }
    };

    useEffect(() => {
        if (!user) return;

        // Carga inicial
        fetchUnread();

        // Polling cada 30s
        pollingRef.current = setInterval(fetchUnread, POLL_INTERVAL);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [user]);

    if (!user) return null;

    return (
        <button
            onClick={() => navigate('/mis-chats')}
            title="Mis Chats"
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
                color: 'var(--text-gray)',
                outline: 'none'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 214, 107, 0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
        >
            <MessageSquare size={21} />
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '3px',
                    right: '2px',
                    background: '#e53e3e',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    width: '17px',
                    height: '17px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(229,62,62,0.4)',
                    animation: 'chatBadgePulse 2s infinite'
                }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
            <style>{`
                @keyframes chatBadgePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.12); }
                }
            `}</style>
        </button>
    );
}
