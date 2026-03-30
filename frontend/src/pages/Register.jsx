import { useState } from "react";
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import './Register.css';

export default function Register() {   
    // Candidate States
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidatePassword, setCandidatePassword] = useState('');

    // Company States
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPassword, setCompanyPassword] = useState('');
    // You could add more company-specific fields if needed, e.g. companyName

    const [rol, setRol] = useState('candidato'); // 'candidato' or 'empresa'
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [loading, setLoading] = useState(false);

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

        const email = rol === 'candidato' ? candidateEmail : companyEmail;
        const password = rol === 'candidato' ? candidatePassword : companyPassword;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    rol: rol 
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setMensaje("¡Registro exitoso! Revisa tu correo para confirmar la cuenta.");
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
    }

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
                                <input 
                                    type="password" 
                                    placeholder="Mínimo 6 caracteres" 
                                    value={candidatePassword} 
                                    onChange={(e) => setCandidatePassword(e.target.value)} 
                                    required 
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta de Candidato'}
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
                                <input 
                                    type="password" 
                                    placeholder="Mínimo 6 caracteres" 
                                    value={companyPassword} 
                                    onChange={(e) => setCompanyPassword(e.target.value)} 
                                    required 
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta de Empresa'}
                            </button>
                        </form>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
