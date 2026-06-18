 import { useState } from "react";
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

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
        } else {
            sessionStorage.removeItem('is_recovering_password');
            await supabase.auth.signOut(); // Sign out to force fresh login with new password
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
                                {error && <div className="message error">{error}</div>}

                                <form onSubmit={handleUpdatePassword} className="register-form">
                                    <div className="input-group">
                                        <label>Nueva Contraseña</label>
                                        <input 
                                            type="password" 
                                            placeholder="Mínimo 6 caracteres" 
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
