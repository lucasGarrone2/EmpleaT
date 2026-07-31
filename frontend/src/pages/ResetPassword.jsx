 import { useState, useEffect } from "react";
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import './Register.css'; 

export default function ResetPassword() {   
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const translateAuthError = (msg) => {
        if (!msg) return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
        const lower = String(msg).toLowerCase();
        if (lower.includes('auth session missing') || lower.includes('session missing') || lower.includes('no session')) {
            return 'Tu enlace de recuperación no es válido o ha expirado. Por favor, solicita un nuevo enlace.';
        }
        if (lower.includes('same password') || lower.includes('should be different')) {
            return 'La nueva contraseña debe ser diferente a la anterior.';
        }
        if (lower.includes('rate limit') || lower.includes('too many requests')) {
            return 'Demasiados intentos. Por favor aguarda unos minutos e intenta de nuevo.';
        }
        return msg;
    };

    useEffect(() => {
        const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';
        if (!isRecovering) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session) {
                    setError("Tu enlace de recuperación no es válido o ha expirado. Por favor, solicita uno nuevo.");
                }
            });
        }
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(translateAuthError(error.message));
        } else {
            sessionStorage.removeItem('is_recovering_password');
            await supabase.auth.signOut();
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        }
        setLoading(false);
    }

    return (
        <div className="register-page">
            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            
            <div className="flip-card-container" style={{ height: 'auto', minHeight: '450px', display: 'flex', justifyContent: 'center' }}>
                <div className="flip-card-inner" style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
                    <div className="flip-card-front" style={{ position: 'relative', height: 'auto', padding: '3.5rem 2.5rem' }}>
                        
                        <div style={{ 
                            width: '60px', height: '60px', borderRadius: '15px', 
                            background: success ? 'rgba(0, 214, 107, 0.1)' : 'rgba(82, 129, 103, 0.1)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            margin: '0 auto 1.5rem', color: success ? 'var(--primary)' : 'var(--secondary)'
                        }}>
                            {success ? <CheckCircle size={32} /> : <Lock size={32} />}
                        </div>

                        <h2 className="brand-title" style={{ fontSize: '1.8rem' }}>
                            {success ? '¡Listo!' : 'Nueva Contraseña'}
                        </h2>
                        <p className="form-subtitle" style={{ marginBottom: '2.5rem' }}>
                            {success 
                                ? 'Tu contraseña ha sido actualizada. Serás redirigido al login en unos segundos.' 
                                : 'Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.'}
                        </p>

                        {!success && (
                            <>
                                {error && (
                                    <div className="message error" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                        <div>{error}</div>
                                        <button 
                                            onClick={() => navigate('/forgot-password')} 
                                            style={{ marginTop: '10px', background: 'none', border: 'none', color: '#d32f2f', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
                                        >
                                            Solicitar nuevo enlace de recuperación →
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleUpdatePassword} className="register-form">
                                    <div className="input-group">
                                        <label>Nueva Contraseña</label>
                                        <input 
                                            type="password" 
                                            placeholder="Mínimo 8 caracteres" 
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Confirmar Contraseña</label>
                                        <input 
                                            type="password" 
                                            placeholder="Repite tu contraseña" 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="submit-btn"
                                        disabled={loading}
                                        style={{ marginTop: '2rem' }}
                                    >
                                        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
