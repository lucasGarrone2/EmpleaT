import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import './Register.css';

/**
 * Pantalla intermedia para usuarios nuevos que vienen de Google OAuth.
 * Si el usuario ya tiene un 'rol' en sus metadatos, los redirigimos directo.
 * Si es nuevo o no tiene rol, mostramos el selector de rol antes de continuar.
 */
export default function GoogleCallback() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [needsRole, setNeedsRole] = useState(false);
    const [selectedRol, setSelectedRol] = useState('candidato');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Detectar si la URL trae un error de OAuth (ej: User not found por huérfano de auth.identities)
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const oauthError = searchParams.get('error') || hashParams.get('error');
        const oauthErrorDesc = searchParams.get('error_description') || hashParams.get('error_description');

        if (oauthError || oauthErrorDesc) {
            setError(oauthErrorDesc || oauthError || 'Error al autenticar con Google. Por favor reintenta.');
            return;
        }

        if (authLoading) return; // Esperar a que AuthContext termine de restaurar la sesión

        if (!user) {
            // Si ya terminó de cargar AuthContext y realmente no hay usuario, redirigir a /login
            const safetyTimeout = setTimeout(() => {
                navigate('/login', { replace: true });
            }, 1500);
            return () => clearTimeout(safetyTimeout);
        }

        const rol = user.user_metadata?.rol;

        if (rol === 'empresa') {
            navigate('/dashboard-empresa', { replace: true });
        } else if (rol === 'candidato') {
            // Verificar si el candidato ya existe en la base de datos
            supabase
                .from('candidatos')
                .select('id')
                .eq('auth_id', user.id)
                .maybeSingle()
                .then(({ data: candidatoData }) => {
                    if (candidatoData?.id) {
                        // Usuario recurrente con perfil cargado -> ir directo a ofertas
                        navigate('/ofertas', { replace: true });
                    } else {
                        // Usuario nuevo -> ir a cargar su perfil
                        navigate('/perfil', { replace: true });
                    }
                })
                .catch(() => {
                    navigate('/ofertas', { replace: true });
                });
        } else {
            // Usuario nuevo que ingresó por Google sin rol previo: mostrar selector
            setNeedsRole(true);
        }
    }, [user, authLoading, navigate]);

    const handleRolSubmit = async () => {
        setSaving(true);
        setError(null);

        try {
            // Actualizar los metadatos del usuario en Supabase
            const { error: updateError } = await supabase.auth.updateUser({
                data: { rol: selectedRol }
            });

            if (updateError) throw updateError;

            // Redirigir según el rol elegido
            if (selectedRol === 'empresa') {
                navigate('/dashboard-empresa', { replace: true });
            } else {
                navigate('/perfil', { replace: true });
            }
        } catch (err) {
            setError('No pudimos guardar tu rol. Intentá de nuevo.');
            setSaving(false);
        }
    };

    if (error && !needsRole) {
        return (
            <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
                <div style={{
                    position: 'relative', zIndex: 1, background: 'white',
                    borderRadius: '24px', padding: '3rem', maxWidth: '480px', width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)', textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 className="brand-title" style={{ fontSize: '1.5rem', margin: '0 0 1rem 0', color: '#d32f2f' }}>Error de Autenticación</h2>
                    <p style={{ color: 'var(--text-gray)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => navigate('/register', { replace: true })}
                        className="submit-btn"
                        style={{ padding: '12px 24px', fontSize: '1rem' }}
                    >
                        Volver a Intentar
                    </button>
                </div>
            </div>
        );
    }

    if (authLoading || (!user && !needsRole)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 'bold' }}>
                    Iniciando sesión con Google...
                </div>
            </div>
        );
    }

    if (!needsRole) return null;

    return (
        <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>

            <div style={{
                position: 'relative', zIndex: 1, background: 'white',
                borderRadius: '24px', padding: '3rem', maxWidth: '480px', width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
            }}>
                {/* Logo Google */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <svg width="40" height="40" viewBox="0 0 48 48" style={{ margin: '0 auto 1rem' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <h2 className="brand-title" style={{ fontSize: '1.8rem', margin: 0 }}>¡Un último paso!</h2>
                    <p style={{ color: 'var(--text-gray)', marginTop: '0.5rem' }}>
                        Ingresaste con Google. ¿Cómo vas a usar EmpleaT?
                    </p>
                </div>

                {error && <div className="message error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { value: 'candidato', label: '🦸 Soy Candidato', desc: 'Busco trabajo y quiero subir mi CV' },
                        { value: 'empresa', label: '🏢 Soy Empresa', desc: 'Quiero publicar ofertas y reclutar talento' }
                    ].map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => setSelectedRol(opt.value)}
                            style={{
                                padding: '1.2rem 1.5rem',
                                borderRadius: '14px',
                                border: `2px solid ${selectedRol === opt.value ? 'var(--primary)' : '#E0E0E0'}`,
                                background: selectedRol === opt.value ? 'rgba(0,214,107,0.05)' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-dark)' }}>{opt.label}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginTop: '3px' }}>{opt.desc}</div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleRolSubmit}
                    disabled={saving}
                    className="submit-btn"
                    style={{ padding: '14px', fontSize: '1.05rem' }}
                >
                    {saving ? 'Guardando...' : 'Confirmar y Continuar →'}
                </button>
            </div>
        </div>
    );
}
