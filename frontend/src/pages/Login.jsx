import { useState } from "react";
import { supabase } from '../supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import posthog from '../posthog';
import './Register.css'; // Reusing the same styles for visual consistency

export default function Login() {   
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            let msg = error.message;
            if (msg.includes("Invalid login credentials") || msg.includes("Invalid credentials")) {
                msg = "Correo electrónico o contraseña incorrectos.";
            } else if (msg.includes("Email not confirmed")) {
                msg = "Debes confirmar tu correo electrónico antes de iniciar sesión.";
            }
            setError(msg);
        } else {
            posthog.capture('login_completed', {
                authentication_method: 'password'
            });
            navigate('/');
        }
        setLoading(false);
    }

    const handleGoogleLogin = async () => {
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/auth/callback'
            }
        });
        if (error) setError('Error al iniciar sesión con Google. Intentá de nuevo.');
    };

    return (
        <div className="register-page">
            <Link to="/" className="back-link">
                &larr; Volver al menú
            </Link>

            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            
            <div className="flip-card-container" style={{ height: 'auto', minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
                <div className="flip-card-inner" style={{ position: 'relative', width: '100%', maxWidth: '440px', transformStyle: 'flat', transition: 'none' }}>
                    <div className="flip-card-front" style={{ position: 'relative', height: 'auto', padding: '3rem 2.5rem' }}>
                        <h2 className="brand-title">Bienvenido a Emplea<span>T</span></h2>
                        <p className="form-subtitle">Ingresa tus credenciales para continuar</p>

                        {error && <div className="message error">{error}</div>}

                        <form onSubmit={handleLogin} className="register-form" style={{ marginTop: '1rem' }}>
                            <div className="input-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    placeholder="tu@correo.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                            
                            <div className="input-group">
                                <label>Contraseña</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Tu contraseña" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                        style={{ width: '100%', paddingRight: '40px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '10px', background: 'none', border: 'none',
                                            cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center'
                                        }}
                                        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={loading}
                                style={{ marginTop: '1.5rem' }}
                            >
                                {loading ? 'Iniciando sesión...' : 'Ingresar'}
                            </button>

                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <Link to="/forgot-password" style={{ color: 'var(--text-gray)', fontSize: '0.9rem', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = 'var(--primary)'} onMouseOut={e => e.target.style.color = 'var(--text-gray)'}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0.5rem 0' }}>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E0E0E0' }} />
                                <span style={{ color: '#999', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>o continuá con</span>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E0E0E0' }} />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    width: '100%', padding: '12px', borderRadius: '10px',
                                    border: '1px solid #E0E0E0', background: 'white',
                                    cursor: 'pointer', fontSize: '1rem', fontWeight: '600', color: '#333',
                                    transition: 'box-shadow 0.2s, border-color 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#ccc'; }}
                                onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E0E0E0'; }}
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                </svg>
                                Continuar con Google
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-gray)' }}>
                            ¿No tienes cuenta?{' '}
                            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                                Regístrate aquí
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
