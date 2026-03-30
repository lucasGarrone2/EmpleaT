import { useState } from "react";
import { supabase } from '../supabase';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css'; // Reusing the same styles for visual consistency

export default function Login() {   
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
            setError(error.message);
        } else {
            navigate('/');
        }
        setLoading(false);
    }

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
                                <input 
                                    type="password" 
                                    placeholder="Tu contraseña" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={loading}
                                style={{ marginTop: '1.5rem' }}
                            >
                                {loading ? 'Iniciando sesión...' : 'Ingresar'}
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
