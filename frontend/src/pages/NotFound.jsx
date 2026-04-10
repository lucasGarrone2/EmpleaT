import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-light, #f4f7f5)',
            gap: '1rem',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{ fontSize: '6rem', fontWeight: '900', color: 'var(--primary, #00d66b)', lineHeight: 1 }}>
                404
            </div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', margin: 0 }}>
                Página no encontrada
            </h1>
            <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', maxWidth: '400px', margin: 0 }}>
                La ruta que buscás no existe o fue movida. Volvé al inicio para continuar.
            </p>
            <Link
                to="/"
                style={{
                    marginTop: '1rem',
                    background: 'var(--primary, #00d66b)',
                    color: 'white',
                    padding: '14px 32px',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '1.05rem',
                    boxShadow: '0 8px 20px rgba(0,214,107,0.3)',
                    transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                ← Volver al inicio
            </Link>
        </div>
    );
}
