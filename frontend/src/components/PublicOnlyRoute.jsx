import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

export default function PublicOnlyRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (user) {
        // Excepción: Si está en recuperación de contraseña, permitimos acceder a /reset-password
        const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';
        if (isRecovering && window.location.pathname === '/reset-password') {
            return <Outlet />;
        }

        // De lo contrario, redirigir a su panel correspondiente
        const userRole = user.user_metadata?.rol;
        const targetPath = userRole === 'admin' ? '/admin'
                         : userRole === 'empresa' ? '/dashboard-empresa'
                         : userRole === 'candidato' ? '/ofertas'
                         : '/';
        return <Navigate to={targetPath} replace />;
    }

    return <Outlet />;
}
