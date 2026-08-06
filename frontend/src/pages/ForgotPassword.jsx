import { useState, useEffect, useRef } from "react";
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import './Register.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TURNSTILE_SITEKEY = '0x4AAAAAAEINkBbJLCv7nSq7';

export default function ForgotPassword() {   
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [turnstileToken, setTurnstileToken] = useState(null);
    const turnstileRef = useRef(null);

    useEffect(() => {
        const renderWidget = () => {
            if (turnstileRef.current && window.turnstile) {
                turnstileRef.current.innerHTML = '';
                window.turnstile.render(turnstileRef.current, {
                    sitekey: TURNSTILE_SITEKEY,
                    action: 'turnstile-spin-v2',
                    callback: (token) => setTurnstileToken(token),
                    'expired-callback': () => setTurnstileToken(null),
                    'error-callback': () => setTurnstileToken(null),
                });
            }
        };

        const interval = setInterval(() => {
            if (window.turnstile) {
                clearInterval(interval);
                renderWidget();
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const handleResetRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        // Verify Turnstile token server-side
        if (!turnstileToken) {
            setError('Por favor, completa la verificación de seguridad.');
            setLoading(false);
            return;
        }

        try {
            const verifyRes = await fetch(`${API_URL}/api/verify-turnstile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 'cf-turnstile-response': turnstileToken }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                setError('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
                setTurnstileToken(null);
                window.turnstile?.reset();
                setLoading(false);
                return;
            }
        } catch (err) {
            setError('Error al verificar la seguridad. Por favor, intenta de nuevo.');
            setTurnstileToken(null);
            window.turnstile?.reset();
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });

        if (error) {
            const lower = String(error.message).toLowerCase();
            if (lower.includes('rate limit') || lower.includes('too many requests')) {
                setError("Demasiados intentos. Por favor aguarda unos minutos antes de solicitar otro enlace.");
            } else if (lower.includes('user not found')) {
                setError("No existe una cuenta registrada con este correo electrónico.");
            } else {
                setError("Ocurrió un error al enviar el enlace. Por favor, intenta de nuevo.");
            }
        } else {
            setMessage("¡Enlace enviado! Revisa tu bandeja de entrada.");
        }
        setLoading(false);
        // Reset Turnstile for next attempt
        setTurnstileToken(null);
        window.turnstile?.reset();
    }

    return (
        <div className="register-page">
            <Link to="/login" className="back-link">
                <ArrowLeft size={18} /> Volver al ingreso
            </Link>

            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            
            <div className="flip-card-container" style={{ height: 'auto', minHeight: '450px', display: 'flex', justifyContent: 'center' }}>
                <div className="flip-card-inner" style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
                    <div className="flip-card-front" style={{ position: 'relative', height: 'auto', padding: '3.5rem 2.5rem' }}>
                        <div style={{ 
                            width: '60px', height: '60px', borderRadius: '15px', 
                            background: 'rgba(0, 214, 107, 0.1)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                            color: 'var(--primary)'
                        }}>
                            <Mail size={32} />
                        </div>

                        <h2 className="brand-title" style={{ fontSize: '1.8rem' }}>¿Olvidaste tu contraseña?</h2>
                        <p className="form-subtitle" style={{ marginBottom: '2.5rem' }}>
                            No te preocupes, dinos tu correo y te enviaremos un enlace para recuperarla.
                        </p>

                        {error && <div className="message error">{error}</div>}
                        {message && <div className="message success">{message}</div>}

                        <form onSubmit={handleResetRequest} className="register-form">
                            <div className="input-group">
                                <label>Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    placeholder="tu@correo.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div ref={turnstileRef} className="cf-turnstile" data-sitekey={TURNSTILE_SITEKEY} data-action="turnstile-spin-v2" style={{ marginBottom: '1rem' }}></div>
                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={loading || message || !turnstileToken}
                                style={{ marginTop: '2rem' }}
                            >
                                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-gray)' }}>
                            ¿Recordaste tu contraseña?{' '}
                            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                                Ingresa aquí
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
