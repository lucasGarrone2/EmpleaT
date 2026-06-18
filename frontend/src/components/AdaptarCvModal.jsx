import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '../supabase';

export default function AdaptarCvModal({ isOpen, onClose, candidatoId, ofertaId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (isOpen && candidatoId && ofertaId) {
            adaptarCV();
        }
    }, [isOpen, candidatoId, ofertaId]);

    const adaptarCV = async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        setData(null);
        setCopied(false);

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error("No has iniciado sesión.");
            }
            const token = session.access_token;

            const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/api/premium/adaptar-cv`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    candidato_id: candidatoId,
                    oferta_id: ofertaId
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Error al adaptar el CV con IA.");
            }

            const json = await response.json();
            setData(json);
        } catch (err) {
            console.error("Error adaptando CV:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (data?.extracto_adaptado) {
            navigator.clipboard.writeText(data.extracto_adaptado);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.8rem 2rem 1rem 2rem',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        color: 'var(--text-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '800'
                    }}>
                        <Sparkles size={22} color="var(--primary)" fill="var(--primary)" /> Adaptador de CV Premium
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#999',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem', flex: 1 }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                            <style>{`
                                @keyframes spin-slow {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                                @keyframes pulse-glow {
                                    0%, 100% { transform: scale(1); opacity: 0.85; }
                                    50% { transform: scale(1.15); opacity: 1; }
                                }
                            `}</style>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 1.5rem auto',
                                background: 'rgba(0, 214, 107, 0.08)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    border: '3px dashed var(--primary)',
                                    borderRadius: '50%',
                                    animation: 'spin-slow 8s linear infinite',
                                    boxSizing: 'border-box'
                                }} />
                                <Sparkles size={32} color="var(--primary)" fill="var(--primary)" style={{
                                    animation: 'pulse-glow 2s ease-in-out infinite'
                                }} />
                            </div>
                            <h4 style={{ color: 'var(--text-dark)', margin: '0 0 8px 0', fontSize: '1.1rem' }}>Adaptando tu currículum...</h4>
                            <p style={{ color: 'var(--text-gray)', margin: 0, fontSize: '0.9rem' }}>
                                Analizando requisitos del puesto y contrastando habilidades. Por favor, espera un momento.
                            </p>
                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="skeleton skeleton-text" style={{ width: '100%', height: '14px' }} />
                                <div className="skeleton skeleton-text" style={{ width: '90%', height: '14px' }} />
                                <div className="skeleton skeleton-text" style={{ width: '75%', height: '14px' }} />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div style={{ color: '#d32f2f', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                <AlertTriangle size={48} />
                            </div>
                            <h4 style={{ color: 'var(--text-dark)', margin: '0 0 10px 0', fontSize: '1.2rem' }}>Error al adaptar CV</h4>
                            <p style={{ color: 'var(--text-gray)', margin: '0 0 2rem 0', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                {error}
                            </p>
                            <button
                                onClick={adaptarCV}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,214,107,0.2)'
                                }}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {data && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                            <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Nuestra IA ha analizado el puesto y adaptado tu CV. Puedes usar estas recomendaciones para ajustar tu postulación y destacar ante los reclutadores.
                            </p>

                            {/* Extracto Adaptado */}
                            <div>
                                <h4 style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '1.05rem',
                                    color: 'var(--text-dark)',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    📝 Extracto Profesional Sugerido
                                </h4>
                                <div style={{
                                    background: '#F8F9FA',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    borderRadius: '16px',
                                    padding: '1.2rem',
                                    position: 'relative'
                                }}>
                                    <p style={{
                                        margin: 0,
                                        color: '#444',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.6',
                                        paddingRight: '40px',
                                        fontStyle: 'italic'
                                    }}>
                                        "{data.extracto_adaptado}"
                                    </p>
                                    <button
                                        onClick={handleCopy}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            background: copied ? 'rgba(0,214,107,0.1)' : 'white',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            borderRadius: '8px',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: copied ? 'var(--primary)' : '#666',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                        }}
                                        title="Copiar al portapapeles"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Consejos */}
                            <div>
                                <h4 style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '1.05rem',
                                    color: 'var(--text-dark)',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Lightbulb size={18} color="#E68A00" /> Consejos para adaptar tu CV
                                </h4>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: '1.2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}>
                                    {data.consejos?.map((consejo, idx) => (
                                        <li key={idx} style={{
                                            color: '#555',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5'
                                        }}>
                                            {consejo}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.2rem 2rem',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    background: '#F9FAFB',
                    borderBottomLeftRadius: '24px',
                    borderBottomRightRadius: '24px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#eee',
                            color: 'var(--text-dark)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#e0e0e0'}
                        onMouseOut={e => e.currentTarget.style.background = '#eee'}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
