import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Building2, PlusCircle, Briefcase, MapPin, Users, Settings, ArrowUpDown, CalendarDays, TrendingUp, TrendingDown, Trash2, AlertCircle, Sparkles, Crown, Zap, Lock } from 'lucide-react';
import './Register.css'; // Reusing established styles for consistency

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function EmpresaDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [empresa, setEmpresa] = useState(null);
    const [ofertas, setOfertas] = useState([]);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [filterEstado, setFilterEstado] = useState('todas');

    // Retention widget: postulaciones sin acción > 3 días
    const [pendientes, setPendientes] = useState({ total: 0, postulaciones: [] });
 
    // Multi-user company states
    const [userRole, setUserRole] = useState(null);
    const [miembros, setMiembros] = useState([]);
    const [activeTab, setActiveTab] = useState('busquedas');
 
    // Invitation states
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('reclutador');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState(null);
    const [inviteSuccess, setInviteSuccess] = useState(null);
 
    // Profile completion state
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [onboardData, setOnboardData] = useState({
        nombre: '',
        sector: '',
        ubicacion: '',
        cuit: '',
        razon_social: '',
        sitio_web: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // Query company membership first
                const { data: miembroData, error: miembroError } = await supabase
                    .from('empresa_miembros')
                    .select('*, empresas(*)')
                    .eq('auth_id', user.id)
                    .maybeSingle();

                if (miembroError) throw miembroError;

                if (!miembroData) {
                    // Fallback to direct check in case the trigger didn't run or legacy data
                    const { data: empData, error: empError } = await supabase
                        .from('empresas')
                        .select('*')
                        .eq('auth_id', user.id)
                        .maybeSingle();

                    if (empError) throw empError;

                    if (!empData) {
                        setIsOnboarding(true);
                    } else {
                        // Auto-create membership to fix legacy account
                        const { data: newMiembro, error: insErr } = await supabase
                            .from('empresa_miembros')
                            .insert({
                                auth_id: user.id,
                                empresa_id: empData.id,
                                rol: 'administrador'
                            })
                            .select('*, empresas(*)')
                            .single();
                        
                        if (insErr) throw insErr;
                        setEmpresa(newMiembro.empresas);
                        setUserRole('administrador');
                        
                        // Load offers
                        const { data: ofertasData, error: ofertasError } = await supabase
                            .from('ofertas')
                            .select(`
                                id, titulo, modalidad, estado, creada_en, nombre_empresa_custom, ciudad,
                                postulaciones (count)
                            `)
                            .eq('empresa_id', newMiembro.empresa_id)
                            .order('creada_en', { ascending: false });
                        
                        if (ofertasError) throw ofertasError;
                        setOfertas(ofertasData || []);
                        await fetchMiembros(newMiembro.empresa_id);
                    }
                } else {
                    setEmpresa(miembroData.empresas);
                    setUserRole(miembroData.rol);
                    
                    // Load offers
                    const { data: ofertasData, error: ofertasError } = await supabase
                        .from('ofertas')
                        .select(`
                            id, titulo, modalidad, estado, creada_en, nombre_empresa_custom, ciudad,
                            postulaciones (count)
                        `)
                        .eq('empresa_id', miembroData.empresa_id)
                        .order('creada_en', { ascending: false });
                    
                    if (ofertasError) throw ofertasError;
                    setOfertas(ofertasData || []);
                    await fetchMiembros(miembroData.empresa_id);
                }
            } catch (err) {
                console.error("Error al obtener datos:", err);
                setError(err.message || "Ocurrió un error al cargar el panel.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Cargar widget de pendientes una sola vez (no polling)
        const fetchPendientes = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;
                const res = await fetch(`${API_URL}/api/empresa/pendientes`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPendientes(data);
                }
            } catch (_) { /* silenciar: no crítico */ }
        };
        fetchPendientes();
    }, [user, navigate]);

    const fetchMiembros = async (empId) => {
        try {
            const { data, error } = await supabase
                .rpc('get_company_members_details', { company_uuid: empId });
            
            if (error) throw error;
            setMiembros(data || []);
        } catch (err) {
            console.error("Error al obtener miembros del equipo:", err);
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteError(null);
        setInviteSuccess(null);

        const emailClean = inviteEmail.trim().toLowerCase();
        if (!emailClean) {
            setInviteError("Por favor ingresa un correo electrónico.");
            setInviteLoading(false);
            return;
        }

        try {
            // Obtener token JWT de Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error("No se pudo obtener la sesión activa.");
            }

            // Realizar llamada segura al backend
            const res = await fetch(`${API_URL}/api/empresa/miembros/invitar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ email: emailClean, rol: inviteRole })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Ocurrió un error al agregar al miembro.");
            }

            setInviteSuccess(`¡Usuario ${emailClean} agregado correctamente como ${inviteRole === 'administrador' ? 'Administrador' : (inviteRole === 'reclutador' ? 'Reclutador' : 'Solo Lectura')}!`);
            setInviteEmail('');
            // Refresh member list
            await fetchMiembros(empresa.id);
        } catch (err) {
            console.error("Error al invitar miembro:", err);
            setInviteError(err.message || "No se pudo agregar al miembro.");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleUpdateMemberRole = async (miembroId, newRole) => {
        try {
            const { error } = await supabase
                .from('empresa_miembros')
                .update({ rol: newRole })
                .eq('id', miembroId);
            
            if (error) throw error;
            
            // Refresh list
            await fetchMiembros(empresa.id);
        } catch (err) {
            console.error("Error al actualizar rol del miembro:", err);
            setError("No se pudo cambiar el rol: " + err.message);
        }
    };

    const handleRemoveMember = async (miembro) => {
        // Prevent deleting oneself
        if (miembro.auth_id === user.id) {
            setError("No puedes eliminarte a ti mismo del equipo.");
            return;
        }

        // Prevent leaving company without admin
        const adminsCount = miembros.filter(m => m.rol === 'administrador').length;
        if (miembro.rol === 'administrador' && adminsCount <= 1) {
            setError("No puedes eliminar al único administrador de la empresa. Promueve a otro miembro antes.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${miembro.email} del equipo?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('empresa_miembros')
                .delete()
                .eq('id', miembro.miembro_id);
            
            if (error) throw error;
            
            // Refresh list
            await fetchMiembros(empresa.id);
        } catch (err) {
            console.error("Error al remover miembro:", err);
            setError("No se pudo remover al miembro: " + err.message);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2000000) {
                setError("El logo no puede pesar más de 2MB.");
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleOnboardSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setError(null);

        // 1. CUIT check (exactly 11 digits)
        const cuitClean = onboardData.cuit.replace(/[^0-9]/g, '');
        if (!/^\d{11}$/.test(cuitClean)) {
            setError("El CUIT debe consistir de exactamente 11 dígitos numéricos.");
            setGuardando(false);
            return;
        }

        // 2. Website check
        let webUrl = onboardData.sitio_web.trim();
        if (webUrl && !/^https?:\/\//i.test(webUrl)) {
            webUrl = "https://" + webUrl;
        }

        try {
            let finalLogoUrl = null;

            if (logoFile) {
                const formData = new FormData();
                formData.append('image', logoFile);
                formData.append('auth_id', user.id);
                formData.append('role', 'empresa');

                const { data: { session } } = await supabase.auth.getSession();
                
                const upRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/upload-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                    body: formData
                });
                if (!upRes.ok) {
                    const err = await upRes.json().catch(()=>({}));
                    throw new Error(err.error || "Error al subir logo corporativo");
                }
                const upData = await upRes.json();
                finalLogoUrl = upData.publicUrl;
            }

            const insertPayload = {
                auth_id: user.id,
                nombre: onboardData.nombre,
                sector: onboardData.sector,
                ubicacion: onboardData.ubicacion,
                cuit: cuitClean,
                razon_social: onboardData.razon_social,
                sitio_web: webUrl
            };
            if (finalLogoUrl) insertPayload.logo_url = finalLogoUrl;

            const { data, error: insertError } = await supabase
                .from('empresas')
                .insert(insertPayload)
                .select()
                .single();

            if (insertError) {
                if (insertError.code === '23505' || insertError.message?.includes('unique_cuit') || insertError.message?.includes('cuit')) {
                    throw new Error("Este CUIT ya se encuentra registrado por otra empresa activa. Por favor, verifique el número.");
                }
                throw insertError;
            }
            
            setEmpresa(data);
            setIsOnboarding(false);
        } catch (err) {
            console.error("Error guardando empresa:", err);
            setError("No pudimos guardar tu perfil corporativo: " + err.message);
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return (
            <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Cargando panel corporativo...</div>
            </div>
        );
    }

    if (error && !empresa && !isOnboarding) {
        return (
            <div className="register-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '2rem' }}>
                <h2 style={{ color: '#d32f2f', fontSize: '2rem', marginBottom: '1rem' }}>Hubo un problema</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '600px' }}>{error}</p>
                <button 
                    onClick={() => {supabase.auth.signOut(); navigate('/');}}
                    className="submit-btn" style={{ maxWidth: '300px' }}
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    if (isOnboarding) {
        return (
            <div className="register-page" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
                
                <div style={{ position: 'relative', width: '100%', maxWidth: '650px', backgroundColor: 'var(--bg-white)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '3.5rem', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1rem' }}>
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo Prev" style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover', border: '1px solid rgba(0,214,107,0.3)' }} />
                        ) : (
                            <div style={{ background: 'rgba(0,214,107,0.1)', padding: '15px', borderRadius: '18px' }}>
                                <Building2 size={32} color="var(--primary)" />
                            </div>
                        )}
                        <h2 className="brand-title" style={{ fontSize: '2.2rem', margin: 0 }}>Registro de Empresa</h2>
                    </div>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                        Completa el formulario de verificación fiscal para activar tu cuenta de reclutamiento oficial en EmpleaT.
                    </p>

                    {error && <div className="message error" style={{marginBottom: '2rem', padding: '12px 18px', borderLeft: '4px solid #f44336'}}>{error}</div>}

                    <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>CUIT de la Organización *</label>
                                <input 
                                    type="text" 
                                    required
                                    pattern="\d{11}"
                                    title="El CUIT debe consistir de exactamente 11 dígitos numéricos sin guiones ni espacios."
                                    value={onboardData.cuit}
                                    onChange={e => setOnboardData({...onboardData, cuit: e.target.value.replace(/[^0-9]/g, '')})}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="Ej: 30715496328"
                                    maxLength="11"
                                />
                                <small style={{ color: 'var(--text-gray)', marginTop: '4px', display: 'block' }}>11 dígitos numéricos.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Razón Social *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={onboardData.razon_social}
                                    onChange={e => setOnboardData({...onboardData, razon_social: e.target.value})}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="Ej: TechCorp S.A."
                                />
                                <small style={{ color: 'var(--text-gray)', marginTop: '4px', display: 'block' }}>Nombre legal de la firma.</small>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nombre Comercial *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={onboardData.nombre}
                                    onChange={e => setOnboardData({...onboardData, nombre: e.target.value})}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="Ej: TechCorp"
                                />
                                <small style={{ color: 'var(--text-gray)', marginTop: '4px', display: 'block' }}>Cómo se mostrará a los candidatos.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Sitio Web Corporativo *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={onboardData.sitio_web}
                                    onChange={e => setOnboardData({...onboardData, sitio_web: e.target.value})}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="Ej: www.techcorp.com"
                                />
                                <small style={{ color: 'var(--text-gray)', marginTop: '4px', display: 'block' }}>URL oficial de la empresa.</small>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rubro o Sector Principal *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={onboardData.sector}
                                    onChange={e => setOnboardData({...onboardData, sector: e.target.value})}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="Ej: Tecnología, Salud, Finanzas..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Ubicación *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={onboardData.ubicacion}
                                    onChange={e => setOnboardData({...onboardData, ubicacion: e.target.value})}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="Ej: Buenos Aires, Argentina"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Logo de la Empresa (Opcional)</label>
                            <input 
                                type="file" 
                                accept="image/jpeg, image/png, image/webp"
                                onChange={handleLogoChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', background: '#f9fdfa', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                            />
                            <small style={{ color: 'var(--text-gray)', marginTop: '4px', display: 'block' }}>Formatos aceptados: JPG, PNG, WEBP. Max 2MB.</small>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={guardando}
                            className="submit-btn"
                            style={{ padding: '16px', fontSize: '1.2rem', marginTop: '1rem', boxShadow: '0 8px 25px rgba(0,214,107,0.25)', opacity: guardando ? 0.7 : 1 }}
                        >
                            {guardando ? 'Guardando Perfil...' : 'Comenzar a Reclutar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '3rem 2rem' }}>
            {/* Header Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--text-dark)', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                        Mis Búsquedas Activas
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', fontSize: '1.1rem' }}>
                        <Building2 size={18} /> 
                        <span style={{fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            {empresa.nombre}
                            {empresa.plan === 'premium' && empresa.premium_hasta && new Date(empresa.premium_hasta) > new Date() && (
                                <span style={{ background: 'linear-gradient(90deg, #FFB020, #FF9800)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Crown size={12} fill="white" /> Premium
                                </span>
                            )}
                        </span>
                        {empresa.ubicacion && <><span style={{margin: '0 5px'}}>•</span><MapPin size={18} /> {empresa.ubicacion}</>}
                    </div>
                </div>
                
                {userRole !== 'solo_lectura' && (
                    <button 
                        onClick={() => navigate('/crear-oferta')}
                        style={{ 
                            background: 'var(--primary)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            padding: '14px 24px', 
                            fontSize: '1.1rem',
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 8px 20px rgba(0,214,107,0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <PlusCircle size={22} /> Publicar Nueva Oferta
                    </button>
                )}
            </div>

            {error && <div className="message error" style={{marginBottom: '2rem'}}>{error}</div>}

            {/* Layout: sidebar izquierdo + lista */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

                {/* Sidebar de filtros */}
                <div style={{
                    width: '220px', flexShrink: 0,
                    background: 'var(--bg-white)', borderRadius: '16px',
                    padding: '1.5rem', border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    position: 'sticky', top: '2rem'
                }}>
                    {/* Secciones */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-gray)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                            <Settings size={14} /> Panel
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                                onClick={() => setActiveTab('busquedas')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', textAlign: 'left',
                                    background: activeTab === 'busquedas' ? 'var(--primary)' : 'rgba(0,0,0,0.04)',
                                    color: activeTab === 'busquedas' ? 'white' : 'var(--text-gray)',
                                }}
                            >
                                <Briefcase size={14} /> Mis Búsquedas
                            </button>
                            <button
                                onClick={() => setActiveTab('equipo')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', textAlign: 'left',
                                    background: activeTab === 'equipo' ? 'var(--primary)' : 'rgba(0,0,0,0.04)',
                                    color: activeTab === 'equipo' ? 'white' : 'var(--text-gray)',
                                }}
                            >
                                <Users size={14} /> Gestionar Equipo
                            </button>
                            <button
                                onClick={() => navigate('/buscar-candidatos')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', textAlign: 'left',
                                    background: 'rgba(0,0,0,0.04)',
                                    color: 'var(--text-gray)',
                                }}
                            >
                                <Sparkles size={14} color="#FFB020" /> Buscar Talentos
                            </button>
                            <button
                                onClick={() => navigate('/pricing-empresa')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', textAlign: 'left',
                                    background: 'rgba(0,0,0,0.04)',
                                    color: 'var(--text-gray)',
                                }}
                            >
                                <Crown size={14} color="#FFB020" /> Suscripción Premium
                            </button>
                        </div>
                    </div>

                    {/* Separador */}
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '1.5rem' }} />

                    {activeTab === 'busquedas' && (
                        <>
                            {/* Ordenar */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-gray)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                    <ArrowUpDown size={14} /> Ordenar
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {[
                                        { key: 'newest', icon: <CalendarDays size={14}/>, label: 'Más reciente' },
                                        { key: 'oldest', icon: <CalendarDays size={14}/>, label: 'Más antigua' },
                                        { key: 'most_posts', icon: <TrendingUp size={14}/>, label: 'Más postulaciones' },
                                        { key: 'least_posts', icon: <TrendingDown size={14}/>, label: 'Menos postulaciones' },
                                    ].map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => setSortBy(opt.key)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', textAlign: 'left',
                                                background: sortBy === opt.key ? 'var(--primary)' : 'rgba(0,0,0,0.04)',
                                                color: sortBy === opt.key ? 'white' : 'var(--text-gray)',
                                            }}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Separador */}
                            <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '1.5rem' }} />

                            {/* Filtrar por estado */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-gray)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                    <Briefcase size={14} /> Estado
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {[
                                        { key: 'todas', label: 'Todas' },
                                        { key: 'Publicada', label: 'Publicadas' },
                                        { key: 'Borrador', label: 'Borradores' },
                                        { key: 'Cerrada', label: 'Cerradas' },
                                    ].map(est => (
                                        <button
                                            key={est.key}
                                            onClick={() => setFilterEstado(est.key)}
                                            style={{
                                                padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', textAlign: 'left',
                                                background: filterEstado === est.key ? 'var(--secondary)' : 'rgba(0,0,0,0.04)',
                                                color: filterEstado === est.key ? 'white' : 'var(--text-gray)',
                                            }}
                                        >
                                            {est.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {activeTab === 'busquedas' ? (
                        (() => {
                            const filtered = ofertas.filter(o => filterEstado === 'todas' || o.estado === filterEstado);
                            const sorted = [...filtered].sort((a, b) => {
                                const pa = a.postulaciones[0]?.count || 0;
                                const pb = b.postulaciones[0]?.count || 0;
                                if (sortBy === 'newest') return new Date(b.creada_en) - new Date(a.creada_en);
                                if (sortBy === 'oldest') return new Date(a.creada_en) - new Date(b.creada_en);
                                if (sortBy === 'most_posts') return pb - pa;
                                if (sortBy === 'least_posts') return pa - pb;
                                return 0;
                            });

                            if (sorted.length === 0) return (
                                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '24px', border: '2px dashed rgba(0,0,0,0.1)' }}>
                                    <Briefcase size={64} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1.5rem' }} />
                                    <h3 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>
                                        {ofertas.length === 0 ? 'Aún no tienes búsquedas publicadas' : 'Sin resultados para este filtro'}
                                    </h3>
                                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                                        {ofertas.length === 0
                                            ? 'Crea tu primera oferta laboral definiendo el rol, rango salarial y las habilidades exactas que requieres de los candidatos.'
                                            : 'Probá cambiando el filtro de estado.'}
                                    </p>
                                </div>
                            );

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    {/* Widget de retención: candidatos esperando respuesta */}
                                    {pendientes.total > 0 && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
                                            border: '1px solid #fcd34d',
                                            borderRadius: '16px', padding: '1rem 1.4rem',
                                        }}>
                                            <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontWeight: 'bold', color: '#92400e', fontSize: '0.95rem' }}>
                                                    {pendientes.total} candidato{pendientes.total !== 1 ? 's' : ''} esperando respuesta hace más de 3 días
                                                </p>
                                                <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: '0.82rem' }}>
                                                    Respondé pronto para mantener el interés. Los candidatos sin respuesta suelen desactivarse o postularse a otros procesos.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate('/mis-chats')}
                                                style={{
                                                    flexShrink: 0,
                                                    background: '#d97706',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    padding: '8px 16px',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.82rem',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#b45309'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#d97706'}
                                            >
                                                Ir a Chats →
                                            </button>
                                        </div>
                                    )}
                                    {sorted.map((oferta) => {
                                        const postulantesCount = oferta.postulaciones[0]?.count || 0;
                                        return (
                                            <div 
                                                key={oferta.id}
                                                onClick={() => navigate(`/oferta-empresa/${oferta.id}`)}
                                                style={{ 
                                                    background: 'var(--bg-white)', borderRadius: '16px', padding: '1.8rem',
                                                    border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    cursor: 'pointer', transition: 'all 0.2s ease-in-out'
                                                }}
                                                onMouseOver={e => {
                                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,214,107,0.1)';
                                                    e.currentTarget.style.borderColor = 'rgba(0,214,107,0.3)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseOut={e => {
                                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                                                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-dark)' }}>{oferta.titulo}</h3>
                                                        <span style={{ 
                                                            background: oferta.estado === 'Publicada' ? 'rgba(0,214,107,0.1)' : oferta.estado === 'Borrador' ? 'rgba(255,193,7,0.12)' : 'rgba(0,0,0,0.05)',
                                                            color: oferta.estado === 'Publicada' ? 'var(--primary)' : oferta.estado === 'Borrador' ? '#d97706' : 'var(--text-gray)',
                                                            padding: '3px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold'
                                                        }}>
                                                            {oferta.estado}
                                                        </span>
                                                    </div>
                                                    <div style={{ color: 'var(--text-gray)', fontSize: '0.95rem', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Briefcase size={13}/> {oferta.modalidad}
                                                        </span>
                                                        {oferta.nombre_empresa_custom && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--secondary)', fontWeight: '600' }}>
                                                                <Building2 size={13}/> {oferta.nombre_empresa_custom}
                                                            </span>
                                                        )}
                                                        {oferta.ciudad && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <MapPin size={13}/> {oferta.ciudad}
                                                            </span>
                                                        )}
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <CalendarDays size={13}/> {new Date(oferta.creada_en).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0, marginLeft: '1rem' }}>
                                                    <div style={{ 
                                                        display: 'flex', alignItems: 'center', gap: '8px', 
                                                        background: postulantesCount > 0 ? 'rgba(0,214,107,0.08)' : 'rgba(0,0,0,0.03)', 
                                                        padding: '8px 16px', borderRadius: '12px',
                                                        color: postulantesCount > 0 ? 'var(--primary)' : 'var(--text-gray)',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        <Users size={18} />
                                                        <span>{postulantesCount} Postulantes</span>
                                                    </div>
                                                    <span style={{ color: 'var(--primary)', fontSize: '0.88rem', fontWeight: 'bold' }}>Ver detalle →</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()
                    ) : (
                        <div style={{ background: 'var(--bg-white)', borderRadius: '24px', padding: '2.5rem', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', margin: 0 }}>Miembros del Equipo</h2>
                                    <p style={{ color: 'var(--text-gray)', marginTop: '4px', fontSize: '0.95rem' }}>
                                        Gestiona quiénes tienen acceso al panel de selección de {empresa.nombre}.
                                    </p>
                                </div>
                                <span style={{ background: 'rgba(0,214,107,0.1)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    Tu Rol: {userRole === 'administrador' ? 'Administrador' : (userRole === 'solo_lectura' ? 'Solo Lectura' : 'Reclutador')}
                                </span>
                            </div>

                            {/* Invitation Form (Admins only) */}
                            {userRole === 'administrador' && (
                                <form onSubmit={handleInviteMember} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1.5rem', background: '#F9FBF9', borderRadius: '16px', border: '1px solid rgba(0,214,107,0.15)' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '5px', fontWeight: 'bold' }}>Invitar miembro por email</label>
                                        <input 
                                            type="email"
                                            required
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="ejemplo@empresa.com"
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ width: '180px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '5px', fontWeight: 'bold' }}>Rol</label>
                                        <select 
                                            value={inviteRole}
                                            onChange={e => setInviteRole(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                                        >
                                            <option value="reclutador">Reclutador</option>
                                            <option value="administrador">Administrador</option>
                                            <option value="solo_lectura">Solo Lectura</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button 
                                            type="submit" 
                                            disabled={inviteLoading}
                                            className="submit-btn" 
                                            style={{ padding: '10px 20px', width: 'auto', boxShadow: 'none', margin: 0 }}
                                        >
                                            {inviteLoading ? 'Invitando...' : 'Invitar'}
                                        </button>
                                    </div>
                                    {inviteError && <div style={{ color: '#d32f2f', fontSize: '0.88rem', width: '100%', marginTop: '5px', fontWeight: 'bold' }}>{inviteError}</div>}
                                    {inviteSuccess && <div style={{ color: 'var(--primary)', fontSize: '0.88rem', width: '100%', marginTop: '5px', fontWeight: 'bold' }}>{inviteSuccess}</div>}
                                    
                                    {!(empresa && empresa.plan === 'premium' && empresa.premium_hasta && new Date(empresa.premium_hasta) > new Date()) && (
                                        <div style={{ fontSize: '0.82rem', color: '#b45309', width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <AlertCircle size={14} /> Plan gratuito: limitado a 2 miembros máximo. Vinculados actualmente: {miembros.length}/2. <Link to="/pricing-empresa" style={{ color: '#b45309', fontWeight: 'bold', textDecoration: 'underline' }}>Hazte Premium para tener miembros ilimitados.</Link>
                                        </div>
                                    )}
                                </form>
                            )}



                            {/* Members list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {miembros.map((miembro) => {
                                    const isMe = miembro.auth_id === user.id;
                                    return (
                                        <div 
                                            key={miembro.miembro_id}
                                            style={{ 
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '1.2rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)',
                                                background: '#fcfdfd', flexWrap: 'wrap', gap: '1rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,214,107,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {miembro.nombre_completo.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {miembro.nombre_completo}
                                                        {isMe && <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.06)', color: 'var(--text-gray)', padding: '2px 6px', borderRadius: '10px' }}>Tú</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '2px' }}>
                                                        {miembro.email} • Vinculado el {new Date(miembro.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {/* Role Selector/Badge */}
                                                {userRole === 'administrador' && !isMe ? (
                                                    <select
                                                        value={miembro.rol}
                                                        onChange={e => handleUpdateMemberRole(miembro.miembro_id, e.target.value)}
                                                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-dark)', outline: 'none' }}
                                                    >
                                                        <option value="reclutador">Reclutador</option>
                                                        <option value="administrador">Administrador</option>
                                                        <option value="solo_lectura">Solo Lectura</option>
                                                    </select>
                                                ) : (
                                                    <span style={{ 
                                                        background: miembro.rol === 'administrador' ? '#EBFDF2' : '#F4F7F6',
                                                        color: miembro.rol === 'administrador' ? 'var(--primary)' : 'var(--text-gray)',
                                                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 'bold',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {miembro.rol}
                                                    </span>
                                                )}

                                                {/* Delete Button for Admins */}
                                                {userRole === 'administrador' && !isMe && (
                                                    <button 
                                                        onClick={() => handleRemoveMember(miembro)}
                                                        style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(211,47,47,0.05)'}
                                                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                                                        title="Eliminar del equipo"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

