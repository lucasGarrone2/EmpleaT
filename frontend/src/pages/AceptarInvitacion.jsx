import { useState, useEffect } from "react";
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import './Register.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AceptarInvitacion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          if (mounted) {
            setHasValidSession(true);
            setLoading(false);
          }
        } else {
          // Wait to see if onAuthStateChange handles a token in the URL hash
          timer = setTimeout(() => {
            if (mounted && !hasValidSession) {
              setLoading(false);
              setError('No se encontró una invitación válida o el enlace expiró. Verificá el enlace o contactá al administrador.');
            }
          }, 3000);
        }
      } catch (err) {
        if (mounted) {
          setLoading(false);
          setError('Ocurrió un error al verificar la invitación.');
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (mounted) {
          clearTimeout(timer);
          setHasValidSession(true);
          setLoading(false);
          setError(''); // clear timeout error if it was set
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [hasValidSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Update the password and metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { rol: 'empresa' }
      });
      
      if (updateError) {
        throw updateError;
      }

      // 2. Get current session to pass to the API
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No se pudo obtener la sesión activa.');
      }

      // 3. Confirm the team member in our database via API
      const response = await fetch(`${API_URL}/api/empresas/miembros/confirmar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al confirmar la cuenta en el sistema.');
      }

      // 4. Refresh session to get updated user_metadata and redirect
      await supabase.auth.refreshSession();
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard-empresa';
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al procesar tu invitación. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="flip-card-container">
        <div className="flip-card-inner">
          <div className="flip-card-front" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 size={48} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} />
                <h2 className="brand-title">Verificando invitación...</h2>
                <p className="form-subtitle">Por favor, esperá un momento.</p>
              </div>
            ) : success ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle size={64} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                <h2 className="brand-title">¡Cuenta configurada!</h2>
                <p className="form-subtitle">Te estamos redirigiendo a tu dashboard...</p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <UserPlus size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                  <h2 className="brand-title" style={{ fontSize: '1.75rem' }}>Aceptar Invitación</h2>
                  <p className="form-subtitle">
                    {hasValidSession ? 'Definí tu contraseña para unirte al equipo' : 'Invitación inválida'}
                  </p>
                </div>

                {error && (
                  <div className="message error" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                {hasValidSession ? (
                  <form className="register-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                      <Lock size={20} />
                      <input
                        type="password"
                        placeholder="Contraseña (mín. 8 caracteres)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="input-group">
                      <Lock size={20} />
                      <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={isSubmitting}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="submit-btn" 
                      disabled={isSubmitting}
                      style={{ marginTop: '1rem', opacity: isSubmitting ? 0.7 : 1 }}
                    >
                      {isSubmitting ? 'Guardando...' : 'Comenzar a trabajar'}
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Si creés que esto es un error, pedile al administrador que te envíe una nueva invitación.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
