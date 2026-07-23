import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';
import { Sparkles, Check, Zap, BarChart3, Search, Star, Users, Shield, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PLANES = [
    {
        meses: 1,
        precio: 5000,
        label: '1 Mes',
        ahorro: null,
        popular: false
    },
    {
        meses: 6,
        precio: 25000,
        label: '6 Meses',
        ahorro: '17%',
        popular: true
    },
    {
        meses: 12,
        precio: 45000,
        label: '12 Meses',
        ahorro: '25%',
        popular: false
    }
];

const FEATURES = [
    { icon: <BarChart3 size={20} />, title: 'Analytics de Embudo', desc: 'Vistas, conversiones y tiempo de respuesta por oferta.' },
    { icon: <Zap size={20} />, title: 'Ofertas Destacadas', desc: 'Tus ofertas aparecen primero durante 7 días.' },
    { icon: <Search size={20} />, title: 'Búsqueda Avanzada', desc: 'Encontrá candidatos por skills y experiencia.' },
    { icon: <Users size={20} />, title: 'Equipo Ilimitado', desc: 'Sin límite de miembros (free: máx 2).' },
    { icon: <Shield size={20} />, title: 'Roles Granulares', desc: 'Admin, reclutador y solo lectura.' },
    { icon: <Star size={20} />, title: 'Soporte Prioritario', desc: 'Atención preferencial vía mail.' }
];

export default function EmpresaPricing() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const showAlert = useAlert();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [empresa, setEmpresa] = useState(null);
    const [miembroRol, setMiembroRol] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const { data: miembro } = await supabase
                    .from('empresa_miembros')
                    .select('empresa_id, rol, empresas(id, nombre, plan, premium_hasta)')
                    .eq('auth_id', user.id)
                    .maybeSingle();

                if (miembro?.empresas) {
                    setEmpresa(miembro.empresas);
                    setMiembroRol(miembro.rol);
                }

                // Handle payment callback
                const paymentId = queryParams.get('payment_id');
                const paymentStatus = queryParams.get('status');
                if (paymentId && paymentStatus === 'approved') {
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch(`${API_URL}/api/empresa/confirm-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ payment_id: paymentId })
                        });

                        const data = await res.json();
                        if (data.success) {
                            showAlert("¡Plan Premium activado para tu empresa!", "¡Éxito!", "success");
                            window.history.replaceState({}, document.title, window.location.pathname);
                            // Refresh empresa data
                            const { data: refreshedMiembro } = await supabase
                                .from('empresa_miembros')
                                .select('empresas(id, nombre, plan, premium_hasta)')
                                .eq('auth_id', user.id)
                                .maybeSingle();
                            if (refreshedMiembro?.empresas) {
                                setEmpresa(refreshedMiembro.empresas);
                            }
                        }
                    } catch (e) {
                        console.error("Error confirming empresa payment:", e);
                    }
                }
            } catch (err) {
                console.error("Error loading empresa data:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [user, navigate]);

    const handleSubscribe = async (plan) => {
        if (miembroRol !== 'administrador') {
            showAlert("Solo los administradores pueden gestionar la suscripción.", "Permisos", "warning");
            return;
        }

        setSelectedPlan(plan.meses);
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API_URL}/api/empresa/create-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ plan: { meses: plan.meses } })
            });

            const data = await res.json();
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error(data.error || "No se pudo crear el enlace de pago.");
            }
        } catch (err) {
            showAlert(err.message, "Error", "error");
        } finally {
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    if (initialLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 'bold' }}>Cargando...</div>
            </div>
        );
    }

    const isPremiumActive = empresa?.plan === 'premium' && empresa?.premium_hasta && new Date(empresa.premium_hasta) > new Date();

    return (
        <div style={{ background: 'linear-gradient(180deg, #FAFAFB 0%, #F0FDF4 100%)', minHeight: 'calc(100vh - 70px)' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>
                {/* Back */}
                <button onClick={() => navigate('/dashboard-empresa')} style={{
                    background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold',
                    marginBottom: '2rem', fontSize: '1rem'
                }}>
                    <ArrowLeft size={18} /> Volver al panel
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(90deg, #FFB020, #FF9800)', color: 'white', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        <Sparkles size={16} /> PREMIUM PARA EMPRESAS
                    </div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--text-dark)', margin: '0 0 0.5rem', fontWeight: '800' }}>
                        Potenciá tu reclutamiento
                    </h1>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
                        Accedé a herramientas avanzadas de analytics, búsqueda de talento y destacar ofertas para atraer más candidatos.
                    </p>
                </div>

                {/* Active Status */}
                {isPremiumActive && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0,214,107,0.08) 0%, rgba(52,211,153,0.08) 100%)',
                        borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem',
                        border: '1px solid rgba(0,214,107,0.2)', textAlign: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Check size={20} color="var(--primary)" />
                            <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>Tu empresa tiene Premium activo</strong>
                        </div>
                        <p style={{ margin: 0, color: '#64748b' }}>
                            Vigente hasta: <strong>{new Date(empresa.premium_hasta).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                            Podés extender tu suscripción eligiendo un plan debajo — el tiempo se acumula.
                        </p>
                    </div>
                )}

                {/* Plans */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {PLANES.map(plan => (
                        <div key={plan.meses} style={{
                            background: 'white', borderRadius: '20px', padding: '2rem',
                            border: plan.popular ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: plan.popular ? '0 12px 35px rgba(0,214,107,0.12)' : '0 4px 20px rgba(0,0,0,0.03)',
                            position: 'relative', overflow: 'hidden', textAlign: 'center',
                            transition: 'all 0.2s', transform: plan.popular ? 'scale(1.03)' : 'none'
                        }}>
                            {plan.popular && (
                                <div style={{
                                    position: 'absolute', top: '14px', right: '-32px',
                                    background: 'var(--primary)', color: 'white',
                                    padding: '4px 40px', fontSize: '0.7rem', fontWeight: 'bold',
                                    transform: 'rotate(45deg)', letterSpacing: '1px'
                                }}>
                                    POPULAR
                                </div>
                            )}

                            <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', color: 'var(--text-dark)' }}>{plan.label}</h3>

                            {plan.ahorro && (
                                <div style={{ display: 'inline-block', background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '12px' }}>
                                    Ahorrás {plan.ahorro}
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                                    ${plan.precio.toLocaleString()}
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '1rem' }}> ARS</span>
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: plan.popular ? 'var(--primary)' : 'white',
                                    color: plan.popular ? 'white' : 'var(--primary)',
                                    border: plan.popular ? 'none' : '2px solid var(--primary)',
                                    borderRadius: '14px', fontWeight: 'bold', fontSize: '1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading && selectedPlan === plan.meses ? 0.6 : 1,
                                    transition: 'all 0.2s', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {loading && selectedPlan === plan.meses ? (
                                    'Redirigiendo...'
                                ) : (
                                    <>
                                        <Zap size={16} fill={plan.popular ? 'white' : 'var(--primary)'} />
                                        {isPremiumActive ? 'Extender' : 'Activar Premium'}
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Features Grid */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--text-dark)', fontSize: '1.8rem', margin: '0 0 0.5rem' }}>
                        ¿Qué incluye Premium?
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                        Todo lo que necesitás para reclutar mejor y más rápido.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem' }}>
                    {FEATURES.map((feat, i) => (
                        <div key={i} style={{
                            background: 'white', borderRadius: '16px', padding: '1.5rem',
                            border: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '14px',
                            alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ background: 'rgba(0,214,107,0.08)', borderRadius: '12px', padding: '10px', flexShrink: 0, color: 'var(--primary)' }}>
                                {feat.icon}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px', color: 'var(--text-dark)', fontSize: '1.05rem' }}>{feat.title}</h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.4' }}>{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
