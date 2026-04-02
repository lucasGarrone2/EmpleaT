import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { LogOut, Menu, User, Briefcase, PlusCircle, Search, Home } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [userName, setUserName] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-menu-container')) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const dropdownItemStyle = {
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        color: 'var(--text-dark)',
        fontWeight: '500',
        borderRadius: '8px',
        transition: 'background 0.2s',
        textDecoration: 'none'
    };

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
                
                {/* Navigation Links (Public) */}
                <nav className="nav-links" style={{ display: 'flex', gap: '2.5rem' }}>
                    <a href="/" style={navItemStyle('/')}>Inicio</a>
                    {!user && (
                        <>
                            <a href="/ofertas" style={navItemStyle('/ofertas')}>Encontrar Trabajo</a>
                            <a href="#proximamente" style={navItemStyle('/para-empresas')}>Para Empresas</a>
                        </>
                    )}
                </nav>
                
                {/* Auth & Profile Actions */}
                <div className="auth-buttons user-menu-container">
                    {user ? (
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => setMenuOpen(!menuOpen)} 
                                style={{ 
                                    fontWeight: '600', 
                                    color: 'var(--text-dark)', 
                                    cursor: 'pointer', 
                                    padding: '8px 16px', 
                                    borderRadius: '12px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    background: menuOpen ? '#f9f9f9' : 'white',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#f9f9f9'}
                                onMouseOut={e => {
                                    if(!menuOpen) e.currentTarget.style.background = 'white';
                                }}
                            >
                                <Menu size={20} color="var(--text-gray)" />
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

                            {/* DROPDOWN MENU HAMBURGUESA */}
                            {menuOpen && (
                                <div style={{ 
                                    position: 'absolute', top: '100%', right: 0, marginTop: '12px', 
                                    background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
                                    padding: '10px', width: '240px', border: '1px solid rgba(0,0,0,0.05)',
                                    display: 'flex', flexDirection: 'column', gap: '4px'
                                }}>
                                    {user.user_metadata?.rol === 'empresa' ? (
                                        <>
                                            <div 
                                                onClick={() => { navigate('/dashboard-empresa'); setMenuOpen(false); }}
                                                style={dropdownItemStyle}
                                                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Briefcase size={18} color="var(--primary)"/> Mis Búsquedas
                                            </div>
                                            <div 
                                                onClick={() => { navigate('/crear-oferta'); setMenuOpen(false); }}
                                                style={dropdownItemStyle}
                                                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <PlusCircle size={18} color="var(--primary)"/> Crear Oferta
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div 
                                                onClick={() => { navigate('/mi-perfil'); setMenuOpen(false); }}
                                                style={dropdownItemStyle}
                                                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <User size={18} color="var(--primary)"/> Mi Perfil Profesional
                                            </div>
                                            <div 
                                                onClick={() => { navigate('/ofertas'); setMenuOpen(false); }}
                                                style={dropdownItemStyle}
                                                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Search size={18} color="var(--primary)"/> Encontrar Trabajo
                                            </div>
                                        </>
                                    )}

                                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '8px 0' }}></div>
                                    
                                    <div 
                                        onClick={() => { handleLogout(); setMenuOpen(false); }}
                                        style={{...dropdownItemStyle, color: '#d32f2f'}}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(211,47,47,0.05)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <LogOut size={18} /> Cerrar Sesión
                                    </div>
                                </div>
                            )}
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
