import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { LogOut } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [userName, setUserName] = useState('');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (user) {
            const fetchName = async () => {
                const rol = user.user_metadata?.rol;

                if (rol === 'empresa') {
                    const { data } = await supabase
                        .from('empresas')
                        .select('nombre')
                        .eq('auth_id', user.id)
                        .maybeSingle();

                    if (data && data.nombre) {
                        setUserName(data.nombre.split(' ')[0]);
                    } else {
                        const emailName = user.email.split('@')[0];
                        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
                    }
                } else {
                    const { data } = await supabase
                        .from('candidatos')
                        .select('nombre_completo')
                        .eq('auth_id', user.id)
                        .maybeSingle();

                    if (data && data.nombre_completo) {
                        setUserName(data.nombre_completo.split(' ')[0]);
                    } else {
                        const emailName = user.email.split('@')[0];
                        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
                    }
                }
            };
            fetchName();
        }
    }, [user]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const navItemStyle = (path) => ({
        textDecoration: 'none',
        color: location.pathname === path ? 'var(--primary)' : 'var(--text-gray)',
        fontWeight: location.pathname === path ? '700' : '500',
        padding: '0.5rem',
        position: 'relative',
        transition: 'color 0.3s'
    });

    return (
        <header 
            className="navbar" 
            style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 1000, 
                background: scrolled ? 'rgba(255, 255, 255, 0.85)' : 'white',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
                boxShadow: scrolled ? '0 4px 30px rgba(0, 0, 0, 0.05)' : '0 1px 0px rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: scrolled ? '0.8rem 2rem' : '1.2rem 2rem'
            }}
        >
            <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Logo Section */}
                <div 
                    className="logo" 
                    onClick={() => navigate('/')}
                    style={{ 
                        cursor: 'pointer', 
                        fontSize: '1.8rem', 
                        fontWeight: '800', 
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        letterSpacing: '-0.5px'
                    }}
                >
                    <span style={{ 
                        background: 'linear-gradient(135deg, var(--primary) 0%, #00994d 100%)', 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent'
                    }}>
                        EmpleaT
                    </span>
                </div>
                
                {/* Navigation Links */}
                <nav className="nav-links" style={{ display: 'flex', gap: '2.5rem' }}>
                    <a href="/" style={navItemStyle('/')}>Inicio</a>
                    {user && user.user_metadata?.rol === 'empresa' ? (
                        <>
                            <a href="/dashboard-empresa" style={navItemStyle('/dashboard-empresa')}>Mis Búsquedas</a>
                            <a href="/crear-oferta" style={navItemStyle('/crear-oferta')}>Crear Oferta</a>
                        </>
                    ) : (
                        <>
                            <a href="/ofertas" style={navItemStyle('/ofertas')}>Encontrar Trabajo</a>
                            <a href="#proximamente" style={navItemStyle('/para-empresas')}>Para Empresas</a>
                        </>
                    )}
                </nav>
                
                {/* Auth & Profile Actions */}
                <div className="auth-buttons">
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div 
                                onClick={() => navigate(user.user_metadata?.rol === 'empresa' ? '/dashboard-empresa' : '/mi-perfil')} 
                                style={{ 
                                    fontWeight: '600', 
                                    color: 'var(--text-dark)', 
                                    cursor: 'pointer', 
                                    padding: '10px 18px', 
                                    borderRadius: '12px',
                                    border: (location.pathname === '/mi-perfil' || location.pathname === '/dashboard-empresa') ? '1px solid rgba(0,214,107,0.3)' : '1px solid transparent',
                                    background: (location.pathname === '/mi-perfil' || location.pathname === '/dashboard-empresa') ? 'rgba(0,214,107,0.05)' : 'transparent',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,214,107,0.1)'}
                                onMouseOut={e => {
                                    if(location.pathname !== '/mi-perfil') e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{ 
                                    width: '32px', height: '32px', borderRadius: '50%', 
                                    background: 'var(--primary)', color: 'white', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    fontSize: '0.9rem', fontWeight: 'bold' 
                                }}>
                                    {userName.charAt(0)}
                                </div>
                                <span>Hola, {userName}</span>
                            </div>
                            
                            <button 
                                onClick={handleLogout} 
                                title="Cerrar Sesión"
                                style={{ 
                                    color: '#d32f2f', 
                                    background: 'rgba(211, 47, 47, 0.05)', 
                                    border: 'none', 
                                    padding: '10px', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer', 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(211, 47, 47, 0.15)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(211, 47, 47, 0.05)'}
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => navigate('/login')}
                                style={{ 
                                    background: 'transparent', 
                                    border: '1px solid rgba(0,0,0,0.1)', 
                                    color: 'var(--text-dark)', 
                                    fontWeight: '600', 
                                    cursor: 'pointer', 
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--text-gray)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
                            >
                                Iniciar Sesión
                            </button>
                            <button 
                                onClick={() => navigate('/register')}
                                style={{ 
                                    background: 'var(--primary)', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    padding: '10px 24px', 
                                    fontWeight: '600', 
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 15px rgba(0, 214, 107, 0.3)',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 214, 107, 0.4)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 214, 107, 0.3)';
                                }}
                            >
                                Registrarse
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
