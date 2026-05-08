import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Spinner de carga animado mientras se valida la sesión
function LoadingSpinner() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-light, #f4f7f5)',
            gap: '1.5rem'
        }}>
            <div style={{
                width: '52px',
                height: '52px',
                border: '5px solid rgba(0, 214, 107, 0.15)',
                borderTop: '5px solid var(--primary, #00d66b)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{
                color: 'var(--text-gray, #666)',
                fontWeight: '600',
                fontSize: '1.05rem',
                margin: 0
            }}>
                Verificando sesión...
            </p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

/**
 * Componente de Ruta Protegida.
 * Evita el "Ghosting" (renderizado visual momentáneo) de contenido confidencial
 * antes de que la sesión sea validada.
 * 
 * @param {string} requiredRole - Rol requerido: 'candidato' | 'empresa' | undefined (cualquier sesión)
 * @param {string} redirectTo   - Ruta de redirección si no hay autorización (default: '/login')
 */
export default function ProtectedRoute({ requiredRole, redirectTo = '/login' }) {
    const { user, loading } = useAuth();

    // Mientras Supabase todavía valida la sesión, mostramos un spinner
    // para evitar el parpadeo de contenido confidencial
    if (loading) {
        return <LoadingSpinner />;
    }

    // Si no hay sesión, redirigimos antes de renderizar nada
    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }

    // Si se requiere un rol específico, verificamos que el usuario lo tenga
    if (requiredRole && user.user_metadata?.rol !== requiredRole) {
        // Redirigir según el rol real del usuario
        const userRole = user.user_metadata?.rol;
        const fallback = userRole === 'admin' ? '/admin'
                       : userRole === 'empresa' ? '/dashboard-empresa'
                       : userRole === 'candidato' ? '/mi-perfil'
                       : '/login';
        return <Navigate to={fallback} replace />;
    }

    // Sesión válida: renderizar el contenido hijo
    return <Outlet />;
}
