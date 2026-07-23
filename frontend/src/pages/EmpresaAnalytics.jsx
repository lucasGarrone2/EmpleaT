import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { BarChart3, Eye, Users, Clock, TrendingUp, ArrowLeft, Zap, Lock, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function EmpresaAnalytics() {
    const { ofertaId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [oferta, setOferta] = useState(null);
    const [empresa, setEmpresa] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Get empresa membership
                const { data: miembro, error: mErr } = await supabase
                    .from('empresa_miembros')
                    .select('empresa_id, rol, empresas(id, nombre, plan, premium_hasta)')
                    .eq('auth_id', user.id)
                    .maybeSingle();

                if (mErr || !miembro) {
                    setError("No se encontró tu empresa.");
                    return;
                }

                const emp = miembro.empresas;
                setEmpresa(emp);
                const premiumActive = emp.plan === 'premium' && emp.premium_hasta && new Date(emp.premium_hasta) > new Date();
                setIsPremium(premiumActive);

                // Get oferta info
                const { data: ofertaData, error: oErr } = await supabase
                    .from('ofertas')
                    .select('id, titulo, estado, creada_en, vistas, empresa_id')
                    .eq('id', ofertaId)
                    .eq('empresa_id', emp.id)
                    .single();

                if (oErr || !ofertaData) {
                    setError("Oferta no encontrada o no pertenece a tu empresa.");
                    return;
                }
                setOferta(ofertaData);

                if (!premiumActive) {
                    setLoading(false);
                    return;
                }

                // Fetch analytics from backend
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`${API_URL}/api/empresas/${emp.id}/ofertas/${ofertaId}/analytics`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Error al cargar analytics.");
                }

                const data = await res.json();
                setAnalytics(data);
            } catch (err) {
                console.error("Error en analytics:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, ofertaId, navigate]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 'bold' }}>
                    Cargando analytics...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#d32f2f' }}>Error</h2>
                <p style={{ color: '#666' }}>{error}</p>
                <button onClick={() => navigate('/dashboard-empresa')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Volver al panel
                </button>
            </div>
        );
    }

    // Premium Paywall
    if (!isPremium) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '2rem', fontSize: '1rem' }}>
                    <ArrowLeft size={18} /> Volver
                </button>

                <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '24px', padding: '3rem', textAlign: 'center', color: 'white',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0,214,107,0.1)', filter: 'blur(20px)' }} />
                    <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,176,32,0.1)', filter: 'blur(15px)' }} />

                    <Lock size={48} color="#FFB020" style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
                    <h2 style={{ fontSize: '2rem', margin: '0 0 1rem', fontWeight: '800' }}>
                        Analytics Premium
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 2rem' }}>
                        Accede a métricas avanzadas de embudo: vistas, conversión, tiempo de respuesta y más. Disponible exclusivamente con el plan Premium para empresas.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem', filter: 'blur(3px)', opacity: 0.4 }}>
                        {[
                            { icon: <Eye size={20} />, label: 'Vistas', value: '1,247' },
                            { icon: <Users size={20} />, label: 'Postulaciones', value: '86' },
                            { icon: <TrendingUp size={20} />, label: 'Conversión', value: '6.9%' },
                            { icon: <Clock size={20} />, label: 'Resp. Promedio', value: '4.2h' }
                        ].map((stat, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.2rem' }}>
                                <div style={{ color: '#FFB020', marginBottom: '8px' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => navigate('/pricing-empresa')} style={{
                        background: 'linear-gradient(90deg, #FFB020, #FF9800)', color: 'white',
                        border: 'none', padding: '14px 32px', borderRadius: '14px',
                        fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                        boxShadow: '0 8px 25px rgba(255,176,32,0.3)', display: 'inline-flex',
                        alignItems: 'center', gap: '8px', transition: 'transform 0.2s'
                    }}>
                        <Sparkles size={18} /> Activar Premium Empresa
                    </button>
                </div>
            </div>
        );
    }

    // Analytics Dashboard
    const formatHours = (hours) => {
        if (hours === null || hours === undefined) return 'Sin datos';
        if (hours < 1) return `${Math.round(hours * 60)} min`;
        if (hours < 24) return `${hours} hrs`;
        return `${Math.round(hours / 24 * 10) / 10} días`;
    };

    const conversionColor = analytics.conversionRate >= 10 ? '#00d66b' : analytics.conversionRate >= 5 ? '#FFB020' : '#ef4444';
    const responseColor = analytics.avgFirstResponseHours !== null
        ? (analytics.avgFirstResponseHours <= 4 ? '#00d66b' : analytics.avgFirstResponseHours <= 24 ? '#FFB020' : '#ef4444')
        : '#94a3b8';

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
            <button onClick={() => navigate(-1)} style={{
                background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold',
                marginBottom: '2rem', fontSize: '1rem'
            }}>
                <ArrowLeft size={18} /> Volver a la oferta
            </button>

            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <BarChart3 size={28} color="var(--primary)" />
                    <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-dark)' }}>
                        Analytics de Embudo
                    </h1>
                    <span style={{ background: 'linear-gradient(90deg, #FFB020, #FF9800)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        PREMIUM
                    </span>
                </div>
                <p style={{ color: 'var(--text-gray)', fontSize: '1.05rem', margin: 0 }}>
                    {oferta?.titulo}
                </p>
            </div>

            {/* Main KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Vistas */}
                <div style={{
                    background: 'white', borderRadius: '20px', padding: '1.8rem',
                    border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '0 0 0 80px', background: 'rgba(59,130,246,0.05)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: '10px', padding: '8px' }}>
                            <Eye size={20} color="#3b82f6" />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vistas</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: 1 }}>
                        {analytics.vistas.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                        Usuarios que vieron el detalle
                    </div>
                </div>

                {/* Postulaciones */}
                <div style={{
                    background: 'white', borderRadius: '20px', padding: '1.8rem',
                    border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '0 0 0 80px', background: 'rgba(0,214,107,0.05)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(0,214,107,0.1)', borderRadius: '10px', padding: '8px' }}>
                            <Users size={20} color="var(--primary)" />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Postulaciones</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: 1 }}>
                        {analytics.totalPostulaciones}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                        Candidatos que aplicaron
                    </div>
                </div>

                {/* Conversión */}
                <div style={{
                    background: 'white', borderRadius: '20px', padding: '1.8rem',
                    border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '0 0 0 80px', background: `${conversionColor}10` }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: `${conversionColor}15`, borderRadius: '10px', padding: '8px' }}>
                            <TrendingUp size={20} color={conversionColor} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversión</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: conversionColor, lineHeight: 1 }}>
                        {analytics.conversionRate}%
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                        Postulaciones / Vistas
                    </div>
                    {/* Visual bar */}
                    <div style={{ marginTop: '12px', height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(analytics.conversionRate * 2, 100)}%`, borderRadius: '3px', background: `linear-gradient(90deg, ${conversionColor}, ${conversionColor}aa)`, transition: 'width 0.8s ease' }} />
                    </div>
                </div>

                {/* Tiempo de Respuesta */}
                <div style={{
                    background: 'white', borderRadius: '20px', padding: '1.8rem',
                    border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '0 0 0 80px', background: `${responseColor}10` }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: `${responseColor}15`, borderRadius: '10px', padding: '8px' }}>
                            <Clock size={20} color={responseColor} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resp. Promedio</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: responseColor, lineHeight: 1 }}>
                        {formatHours(analytics.avgFirstResponseHours)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                        Primera respuesta del reclutador
                    </div>
                    {analytics.avgFirstResponseHours !== null && (
                        <div style={{ marginTop: '8px', fontSize: '0.78rem', color: analytics.avgFirstResponseHours <= 4 ? '#16a34a' : '#f59e0b', fontWeight: '600' }}>
                            {analytics.avgFirstResponseHours <= 4 ? '🚀 Excelente velocidad de respuesta' : analytics.avgFirstResponseHours <= 24 ? '⏱️ Respuesta dentro de las primeras 24h' : '⚠️ Considere responder más rápido'}
                        </div>
                    )}
                </div>
            </div>

            {/* Funnel Visualization */}
            <div style={{
                background: 'white', borderRadius: '20px', padding: '2rem',
                border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
                <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
                    <Zap size={20} color="var(--primary)" /> Embudo de Conversión
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Vistas bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Vistas del detalle</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{analytics.vistas}</span>
                        </div>
                        <div style={{ height: '32px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '100%', borderRadius: '8px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', display: 'flex', alignItems: 'center', paddingLeft: '12px', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                100%
                            </div>
                        </div>
                    </div>
                    {/* Postulaciones bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Postulaciones recibidas</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{analytics.totalPostulaciones}</span>
                        </div>
                        <div style={{ height: '32px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${analytics.vistas > 0 ? Math.max((analytics.totalPostulaciones / analytics.vistas) * 100, 2) : 2}%`,
                                borderRadius: '8px',
                                background: 'linear-gradient(90deg, var(--primary), #34d399)',
                                display: 'flex', alignItems: 'center', paddingLeft: '12px',
                                color: 'white', fontSize: '0.8rem', fontWeight: 'bold',
                                minWidth: '50px', transition: 'width 0.8s ease'
                            }}>
                                {analytics.conversionRate}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
