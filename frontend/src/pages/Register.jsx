import { useState, useEffect, useRef } from "react";
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import './Register.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TURNSTILE_SITEKEY = '0x4AAAAAAEINkBbJLCv7nSq7';

export default function Register() {   
    // Candidate States
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidatePassword, setCandidatePassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Company States
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPassword, setCompanyPassword] = useState('');
    
    // Legal Checkboxes
    const [candidatoTerminos, setCandidatoTerminos] = useState(false);
    const [empresaTerminos, setEmpresaTerminos] = useState(false);

    const [rol, setRol] = useState('candidato'); // 'candidato' or 'empresa'
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [loading, setLoading] = useState(false);

    const [turnstileToken, setTurnstileToken] = useState(null);

    const candidateTurnstileRef = useRef(null);
    const empresaTurnstileRef = useRef(null);

    useEffect(() => {
        const renderWidget = (container) => {
            if (container && window.turnstile) {
                // Clear any existing widget
                container.innerHTML = '';
                window.turnstile.render(container, {
                    sitekey: TURNSTILE_SITEKEY,
                    action: 'turnstile-spin-v2',
                    callback: (token) => setTurnstileToken(token),
                    'expired-callback': () => setTurnstileToken(null),
                    'error-callback': () => setTurnstileToken(null),
                });
            }
        };

        // Wait for Turnstile script to load
        const interval = setInterval(() => {
            if (window.turnstile) {
                clearInterval(interval);
                renderWidget(candidateTurnstileRef.current);
                renderWidget(empresaTurnstileRef.current);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const toggleRole = (newRole) => {
        if (newRole !== rol) {
            setRol(newRole);
            setError(null);
            setMensaje(null);
        }
    };

    const handleRegistro = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMensaje(null);

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

        const email = rol === 'candidato' ? candidateEmail : companyEmail;
        const password = rol === 'candidato' ? candidatePassword : companyPassword;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    rol: rol,
                    terminos_aceptados: true,
                    consentimiento_ia_aceptado: rol === 'candidato' ? true : null
                }
            }
        });

        if (error) {
            let msg = error.message;
            if (msg.includes("User already registered")) {
                msg = "Este correo electrónico ya se encuentra registrado.";
            } else if (msg.toLowerCase().includes("password should contain at least one character of each")) {
                msg = "La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un símbolo.";
            } else if (msg.toLowerCase().includes("password should be at least")) {
                msg = "La contraseña debe tener al menos 6 caracteres.";
            } else if (msg.includes("security purposes")) {
                msg = "Por razones de seguridad, espera un momento antes de volver a intentarlo.";
            }
            setError(msg);
        } else if (data?.user?.identities && data.user.identities.length === 0) {
            // Truco de Supabase: Si la enumeración está prevenida pero el correo existe,
            // Supabase devuelve un usuario sin identidades (array vacío).
            setError("Este correo electrónico ya se encuentra registrado.");
        } else {
            setMensaje("¡Registro exitoso! Revisa tu correo para confirmar la cuenta (recuerda revisar también tu carpeta de Spam / Correo no deseado).");
            // Clear fields on success
            if (rol === 'candidato') {
                setCandidateEmail('');
                setCandidatePassword('');
            } else {
                setCompanyEmail('');
                setCompanyPassword('');
            }
        }
        setLoading(false);

        // Reset Turnstile for next attempt
        setTurnstileToken(null);
        window.turnstile?.reset();
    }

    const handleGoogleRegister = async () => {
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/auth/callback',
            }
        });
        if (error) setError('Error al continuar con Google. Intentá de nuevo.');
    };

    const isFlipped = rol === 'empresa';

    return (
        <div className="register-page">
            <Link to="/" className="back-link">
                &larr; Volver al inicio
            </Link>

            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            
            <div className="flip-card-container">
                <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
                    
                    {/* CANDIDATO FORM (FRONT) */}
                    <div className="flip-card-front">
                        <h2 className="brand-title">Emplea<span>T</span></h2>
                        <p className="form-subtitle">Encuentra tu próximo desafío profesional</p>

                        <div className={`role-switch ${isFlipped ? 'is-empresa' : ''}`}>
                            <div className="switch-indicator"></div>
                            <button 
                                type="button"
                                className={`switch-btn ${!isFlipped ? 'active' : ''}`}
                                onClick={() => toggleRole('candidato')}
                            >
                                Busco Empleo
                            </button>
                            <button 
                                type="button"
                                className={`switch-btn ${isFlipped ? 'active' : ''}`}
                                onClick={() => toggleRole('empresa')}
                            >
                                Soy Empresa
                            </button>
                        </div>

                        {error && !isFlipped && <div className="message error">{error}</div>}
                        {mensaje && !isFlipped && <div className="message success">{mensaje}</div>}

                        <form onSubmit={handleRegistro} className="register-form">
                            <div className="input-group">
                                <label>Email Profesional</label>
                                <input 
                                    type="email" 
                                    placeholder="ejemplo@correo.com" 
                                    value={candidateEmail} 
                                    onChange={(e) => setCandidateEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                            
                            <div className="input-group">
                                <label>Contraseña</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Mínimo 6 caracteres" 
                                        value={candidatePassword} 
                                        onChange={(e) => setCandidatePassword(e.target.value)} 
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

                            <div style={{ marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    id="candidatoTerminos" 
                                    checked={candidatoTerminos} 
                                    onChange={(e) => setCandidatoTerminos(e.target.checked)} 
                                    style={{ marginTop: '5px', width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="candidatoTerminos" style={{ fontSize: '0.85rem', color: 'var(--text-gray)', lineHeight: '1.4', cursor: 'pointer' }}>
                                    He leído y acepto los <a href="/terminos-legales" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)'}}>Términos y Condiciones</a> y la <a href="/terminos-legales" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)'}}>Política de Privacidad</a>, incluyendo el procesamiento automatizado por IA.
                                </label>
                            </div>

                            <div ref={candidateTurnstileRef} className="cf-turnstile" data-sitekey={TURNSTILE_SITEKEY} data-action="turnstile-spin-v2" style={{ marginBottom: '1rem' }}></div>
                            <button 
                                type="submit"  
                                className="submit-btn"
                                disabled={loading || !candidatoTerminos || !turnstileToken}
                                style={{ opacity: (!candidatoTerminos || !turnstileToken) ? 0.6 : 1, cursor: (!candidatoTerminos || !turnstileToken) ? 'not-allowed' : 'pointer' }}
                            >
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta de Candidato'}
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0.8rem 0 0.5rem' }}>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E0E0E0' }} />
                                <span style={{ color: '#999', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>o continuá con</span>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E0E0E0' }} />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleRegister}
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
                    </div>

                    {/* EMPRESA FORM (BACK) */}
                    <div className="flip-card-back">
                        <h2 className="brand-title" style={{color: 'var(--primary)'}}><span style={{color: 'var(--secondary)'}}>Emplea</span>T</h2>
                        <p className="form-subtitle">Encuentra el mejor talento para tu equipo</p>

                        <div className={`role-switch ${isFlipped ? 'is-empresa' : ''}`}>
                            <div className="switch-indicator"></div>
                            <button 
                                type="button"
                                className={`switch-btn ${!isFlipped ? 'active' : ''}`}
                                onClick={() => toggleRole('candidato')}
                            >
                                Busco Empleo
                            </button>
                            <button 
                                type="button"
                                className={`switch-btn ${isFlipped ? 'active' : ''}`}
                                onClick={() => toggleRole('empresa')}
                            >
                                Soy Empresa
                            </button>
                        </div>

                        {error && isFlipped && <div className="message error">{error}</div>}
                        {mensaje && isFlipped && <div className="message success">{mensaje}</div>}

                        <form onSubmit={handleRegistro} className="register-form">
                            <div className="input-group">
                                <label>Email Corporativo</label>
                                <input 
                                    type="email" 
                                    placeholder="rrhh@tuempresa.com" 
                                    value={companyEmail} 
                                    onChange={(e) => setCompanyEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                            
                            <div className="input-group">
                                <label>Contraseña</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Mínimo 6 caracteres" 
                                        value={companyPassword} 
                                        onChange={(e) => setCompanyPassword(e.target.value)} 
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

                            <div style={{ marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    id="empresaTerminos" 
                                    checked={empresaTerminos} 
                                    onChange={(e) => setEmpresaTerminos(e.target.checked)} 
                                    style={{ marginTop: '5px', width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="empresaTerminos" style={{ fontSize: '0.85rem', color: 'var(--text-gray)', lineHeight: '1.4', cursor: 'pointer' }}>
                                    Acepto los <a href="/terminos-legales" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)'}}>Términos para Empresas</a> y me comprometo al tratamiento legal y no discriminatorio de los datos de los candidatos.
                                </label>
                            </div>

                            <div ref={empresaTurnstileRef} className="cf-turnstile" data-sitekey={TURNSTILE_SITEKEY} data-action="turnstile-spin-v2" style={{ marginBottom: '1rem' }}></div>
                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={loading || !empresaTerminos || !turnstileToken}
                                style={{ opacity: (!empresaTerminos || !turnstileToken) ? 0.6 : 1, cursor: (!empresaTerminos || !turnstileToken) ? 'not-allowed' : 'pointer' }}
                            >
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta de Empresa'}
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0.5rem 0' }}>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E0E0E0' }} />
                                <span style={{ color: '#999', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>o continuá con</span>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E0E0E0' }} />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleRegister}
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
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
