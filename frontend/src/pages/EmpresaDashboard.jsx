import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Building2, PlusCircle, Briefcase, MapPin, Users, Settings } from 'lucide-react';
import './Register.css'; // Reusing established styles for consistency

export default function EmpresaDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [empresa, setEmpresa] = useState(null);
    const [ofertas, setOfertas] = useState([]);
    const [error, setError] = useState(null);

    // Profile completion state
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [onboardData, setOnboardData] = useState({
        nombre: '',
        sector: '',
        ubicacion: ''
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
                // Check if company profile exists
                const { data: empData, error: empError } = await supabase
                    .from('empresas')
                    .select('*')
                    .eq('auth_id', user.id)
                    .maybeSingle();

                if (empError) throw empError;

                if (!empData) {
                    setIsOnboarding(true);
                } else {
                    setEmpresa(empData);
                    // Fetch offers for this company
                    const { data: ofertasData, error: ofertasError } = await supabase
                        .from('ofertas')
                        .select(`
                            id, titulo, modalidad, estado, creada_en,
                            postulaciones (count)
                        `)
                        .eq('empresa_id', empData.id)
                        .order('creada_en', { ascending: false });
                    
                    if (ofertasError) throw ofertasError;
                    setOfertas(ofertasData || []);
                }
            } catch (err) {
                console.error("Error al obtener datos:", err);
                setError(err.message || "Ocurrió un error al cargar el panel.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, navigate]);

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

        try {
            let finalLogoUrl = null;

            if (logoFile) {
                const formData = new FormData();
                formData.append('image', logoFile);
                formData.append('auth_id', user.id);
                formData.append('role', 'empresa');

                const { data: { session } } = await supabase.auth.getSession();
                
                const upRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/upload-image`, {
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
                ubicacion: onboardData.ubicacion
            };
            if (finalLogoUrl) insertPayload.logo_url = finalLogoUrl;

            const { data, error: insertError } = await supabase
                .from('empresas')
                .insert(insertPayload)
                .select()
                .single();

            if (insertError) throw insertError;
            
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
                
                <div style={{ position: 'relative', width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-white)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '3.5rem', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1rem' }}>
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo Prev" style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover', border: '1px solid rgba(0,214,107,0.3)' }} />
                        ) : (
                            <div style={{ background: 'rgba(0,214,107,0.1)', padding: '15px', borderRadius: '18px' }}>
                                <Building2 size={32} color="var(--primary)" />
                            </div>
                        )}
                        <h2 className="brand-title" style={{ fontSize: '2.2rem', margin: 0 }}>Perfil Corporativo</h2>
                    </div>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                        Para comenzar a publicar búsquedas, necesitamos unos datos básicos sobre tu empresa.
                    </p>

                    {error && <div className="message error" style={{marginBottom: '2rem'}}>{error}</div>}

                    <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
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

                        <div>
                            <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nombre de la Empresa</label>
                            <input 
                                type="text" 
                                required
                                value={onboardData.nombre}
                                onChange={e => setOnboardData({...onboardData, nombre: e.target.value})}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                placeholder="Ej: TechCorp S.A."
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rubro o Sector</label>
                            <input 
                                type="text" 
                                value={onboardData.sector}
                                onChange={e => setOnboardData({...onboardData, sector: e.target.value})}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                placeholder="Ej: Software, Finanzas, Salud..."
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Ubicación Sede Central</label>
                            <input 
                                type="text" 
                                value={onboardData.ubicacion}
                                onChange={e => setOnboardData({...onboardData, ubicacion: e.target.value})}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                                placeholder="Ej: Buenos Aires, Argentina"
                            />
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
            {/* Header Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--text-dark)', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                        Mis Búsquedas Activas
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', fontSize: '1.1rem' }}>
                        <Building2 size={18} /> <span style={{fontWeight: '600', color: 'var(--primary)'}}>{empresa.nombre}</span>
                        {empresa.ubicacion && <><span style={{margin: '0 5px'}}>•</span><MapPin size={18} /> {empresa.ubicacion}</>}
                    </div>
                </div>
                
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
            </div>

            {error && <div className="message error" style={{marginBottom: '2rem'}}>{error}</div>}

            {/* Listado de Ofertas */}
            {ofertas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '24px', border: '2px dashed rgba(0,0,0,0.1)' }}>
                    <Briefcase size={64} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>Aún no tienes búsquedas publicadas</h3>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                        Crea tu primera oferta laboral definiendo el rol, rango salarial y las habilidades exactas que requieres de los candidatos.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {ofertas.map((oferta) => {
                        const postulantesCount = oferta.postulaciones[0]?.count || 0;
                        return (
                            <div 
                                key={oferta.id}
                                onClick={() => navigate(`/oferta-empresa/${oferta.id}`)}
                                style={{ 
                                    background: 'var(--bg-white)',
                                    borderRadius: '16px',
                                    padding: '2rem',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out'
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
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-dark)' }}>{oferta.titulo}</h3>
                                        <span style={{ 
                                            background: oferta.estado === 'Publicada' ? 'rgba(0,214,107,0.1)' : 'rgba(0,0,0,0.05)',
                                            color: oferta.estado === 'Publicada' ? 'var(--primary)' : 'var(--text-gray)',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {oferta.estado}
                                        </span>
                                    </div>
                                    <div style={{ color: 'var(--text-gray)', fontSize: '1rem', display: 'flex', gap: '20px' }}>
                                        <span><Briefcase size={14} style={{verticalAlign: 'middle', marginRight: '5px'}}/> {oferta.modalidad}</span>
                                        <span title="Fecha de publicación">📅 {new Date(oferta.creada_en).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <div style={{ 
                                        display: 'flex', alignItems: 'center', gap: '8px', 
                                        background: postulantesCount > 0 ? 'rgba(0,214,107,0.08)' : 'transparent', 
                                        padding: '8px 16px', borderRadius: '12px',
                                        color: postulantesCount > 0 ? 'var(--primary)' : 'var(--text-gray)',
                                        fontWeight: 'bold'
                                    }}>
                                        <Users size={20} />
                                        <span>{postulantesCount} Postulantes</span>
                                    </div>
                                    <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Ver detalle &rarr;</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
