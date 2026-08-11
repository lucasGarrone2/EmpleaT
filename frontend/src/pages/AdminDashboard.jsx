import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { 
    ShieldAlert, Trash2, Ban, EyeOff, User, Building2, Briefcase, Loader2, AlertCircle, 
    FileText, ChevronDown, ChevronUp, Search, Crown, Award, Send, Users, Sparkles, CheckCircle2,
    DollarSign, TrendingUp, Filter, Calendar, CreditCard, Gift
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * SEC-14: Todas las operaciones administrativas pasan por el backend.
 * El backend verifica que el usuario existe en la tabla `administradores`.
 */
export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('ofertas');
    const [stats, setStats] = useState({
        totalPostulaciones: 0,
        totalInsignias: 0,
        candidatosPremium: 0,
        candidatosPremiumPagados: 0,
        candidatosPremiumManuales: 0,
        candidatosFree: 0,
        empresasPremium: 0,
        empresasPremiumPagadas: 0,
        empresasPremiumManuales: 0,
        empresasFree: 0,
        totalUsuarios: 0,
        finanzas: {
            ingresoTotalBruto: 0,
            ingresoCandidatos: 0,
            ingresoEmpresas: 0,
            candidatosPagadosCount: 0,
            candidatosManualesCount: 0,
            empresasPagadasCount: 0,
            empresasManualesCount: 0,
            precioBaseCandidato: 5000,
            precioBaseEmpresa: 25000
        }
    });
    const [ofertas, setOfertas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [insignias, setInsignias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);
    const [expandedOfertaId, setExpandedOfertaId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filtros específicos por tipo
    const [candidatoFilter, setCandidatoFilter] = useState('todos'); // todos, pagados, manuales, free, baneados
    const [empresaFilter, setEmpresaFilter] = useState('todas');     // todas, pagadas, manuales, free, baneadas

    const getToken = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    }, []);

    const adminFetch = useCallback(async (path, options = {}) => {
        const token = await getToken();
        if (!token) throw new Error('Sin sesión activa.');

        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        return data;
    }, [getToken]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminFetch('/api/admin/data');
            if (data.stats) setStats(data.stats);
            setOfertas(data.ofertas || []);
            setUsuarios(data.candidatos || []);
            setEmpresas(data.empresas || []);
            setInsignias(data.insignias || []);
        } catch (err) {
            console.error('[AdminDashboard] Error al cargar datos:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [adminFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleOcultarOferta = async (id, estadoActual) => {
        setActionLoading(`oferta-${id}`);
        try {
            await adminFetch('/api/admin/toggle-oferta', {
                method: 'POST',
                body: JSON.stringify({ oferta_id: id, oculta_admin: !estadoActual })
            });
            setOfertas(prev => prev.map(o => o.id === id ? { ...o, oculta_admin: !estadoActual } : o));
        } catch (err) {
            console.error('[AdminDashboard] Error al togglear oferta:', err.message);
            setError(`Error al actualizar oferta: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleBanUsuario = async (id, estadoActual) => {
        setActionLoading(`ban-user-${id}`);
        try {
            await adminFetch('/api/admin/ban-candidato', {
                method: 'POST',
                body: JSON.stringify({ candidato_id: id, baneado: !estadoActual })
            });
            setUsuarios(prev => prev.map(u => u.id === id ? { ...u, baneado: !estadoActual } : u));
        } catch (err) {
            console.error('[AdminDashboard] Error al banear usuario:', err.message);
            setError(`Error al actualizar candidato: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleBanEmpresa = async (id, estadoActual) => {
        setActionLoading(`ban-emp-${id}`);
        try {
            await adminFetch('/api/admin/ban-empresa', {
                method: 'POST',
                body: JSON.stringify({ empresa_id: id, baneada: !estadoActual })
            });
            setEmpresas(prev => prev.map(e => e.id === id ? { ...e, baneada: !estadoActual } : e));
        } catch (err) {
            console.error('[AdminDashboard] Error al banear empresa:', err.message);
            setError(`Error al actualizar empresa: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const togglePremiumCandidato = async (id, esPremiumActual) => {
        setActionLoading(`prem-user-${id}`);
        try {
            await adminFetch('/api/admin/toggle-premium-candidato', {
                method: 'POST',
                body: JSON.stringify({ candidato_id: id, es_premium: !esPremiumActual, dias: 30 })
            });
            fetchData();
        } catch (err) {
            console.error('[AdminDashboard] Error al togglear premium candidato:', err.message);
            setError(`Error al actualizar premium: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const togglePremiumEmpresa = async (id, esPremiumActual) => {
        setActionLoading(`prem-emp-${id}`);
        try {
            await adminFetch('/api/admin/toggle-premium-empresa', {
                method: 'POST',
                body: JSON.stringify({ empresa_id: id, es_premium: !esPremiumActual, dias: 30 })
            });
            fetchData();
        } catch (err) {
            console.error('[AdminDashboard] Error al togglear premium empresa:', err.message);
            setError(`Error al actualizar premium: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    // Filtros de búsqueda y categoría
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();

    const ofertasFiltradas = ofertas.filter(o => 
        !q || o.titulo?.toLowerCase().includes(q) || o.empresas?.nombre?.toLowerCase().includes(q) || o.modalidad?.toLowerCase().includes(q)
    );

    const usuariosFiltrados = usuarios.filter(u => {
        const matchesQ = !q || u.nombre_completo?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.titulo_profesional?.toLowerCase().includes(q);
        const isPrem = u.es_premium && u.premium_hasta && new Date(u.premium_hasta) > now;
        const isManual = u.es_manual_premium;
        
        if (candidatoFilter === 'pagados') return matchesQ && isPrem && !isManual;
        if (candidatoFilter === 'manuales') return matchesQ && isPrem && isManual;
        if (candidatoFilter === 'free') return matchesQ && !isPrem;
        if (candidatoFilter === 'baneados') return matchesQ && u.baneado;
        return matchesQ;
    });

    const empresasFiltradas = empresas.filter(e => {
        const matchesQ = !q || e.nombre?.toLowerCase().includes(q) || e.sector?.toLowerCase().includes(q);
        const isPrem = e.plan === 'premium' && e.premium_hasta && new Date(e.premium_hasta) > now;
        const isManual = e.es_manual_premium;
        
        if (empresaFilter === 'pagadas') return matchesQ && isPrem && !isManual;
        if (empresaFilter === 'manuales') return matchesQ && isPrem && isManual;
        if (empresaFilter === 'free') return matchesQ && !isPrem;
        if (empresaFilter === 'baneadas') return matchesQ && e.baneada;
        return matchesQ;
    });

    const insigniasFiltradas = insignias.filter(i => 
        !q || i.insignias?.nombre?.toLowerCase().includes(q) || i.candidatos?.nombre_completo?.toLowerCase().includes(q) || i.candidatos?.email?.toLowerCase().includes(q)
    );

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '12px' }}>
            <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '1.1rem', color: 'var(--text-gray)', fontWeight: '600' }}>Cargando panel de control...</span>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>
            {/* Header del Panel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)', padding: '14px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(253,224,71,0.3)' }}>
                        <ShieldAlert size={30} color="#854d0e" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: 'var(--text-dark)', margin: 0, fontWeight: '800' }}>Panel de Administrador</h1>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-gray)', fontSize: '0.95rem' }}>Gestión centralizada de usuarios, ofertas, insignias e ingresos de EmpleaT.</p>
                    </div>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold', fontSize: '1.1rem' }}>✕</button>
                </div>
            )}

            {/* KPI STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
                {/* 1. Postulaciones */}
                <div style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(0,214,107,0.1)', padding: '12px', borderRadius: '14px', color: 'var(--primary)' }}>
                        <Send size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{stats.totalPostulaciones}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px', fontWeight: '500' }}>Postulaciones Totales</div>
                    </div>
                </div>

                {/* 2. Suscripciones Premium */}
                <div 
                    onClick={() => setActiveTab('finanzas')}
                    style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                    <div style={{ background: 'rgba(255,176,32,0.1)', padding: '12px', borderRadius: '14px', color: '#D48800' }}>
                        <Crown size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{stats.candidatosPremium + stats.empresasPremium}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-gray)', marginTop: '4px', fontWeight: '500' }}>
                            {stats.finanzas?.candidatosPagadosCount + stats.finanzas?.empresasPagadasCount} Pagados • {stats.finanzas?.candidatosManualesCount + stats.finanzas?.empresasManualesCount} Cortesía
                        </div>
                    </div>
                </div>

                {/* 3. Insignias */}
                <div 
                    onClick={() => setActiveTab('insignias')}
                    style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px', borderRadius: '14px', color: '#6366f1' }}>
                        <Award size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{stats.totalInsignias}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px', fontWeight: '500' }}>Insignias Otorgadas</div>
                    </div>
                </div>

                {/* 4. Ingreso Estimado Real (Pagados) */}
                <div 
                    onClick={() => setActiveTab('finanzas')}
                    style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                    <div style={{ background: 'rgba(34,197,94,0.1)', padding: '12px', borderRadius: '14px', color: '#16a34a' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#15803d', lineHeight: '1' }}>{formatCurrency(stats.finanzas?.ingresoTotalBruto)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px', fontWeight: '500' }}>Ingresos Reales Pagados</div>
                    </div>
                </div>
            </div>

            {/* SEARCH AND TABS BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {/* TABS */}
                <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '14px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setActiveTab('ofertas')}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: activeTab === 'ofertas' ? 'white' : 'transparent', color: activeTab === 'ofertas' ? 'var(--text-dark)' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: activeTab === 'ofertas' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                        <Briefcase size={16}/> Ofertas ({ofertas.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: activeTab === 'usuarios' ? 'white' : 'transparent', color: activeTab === 'usuarios' ? 'var(--text-dark)' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: activeTab === 'usuarios' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                        <User size={16}/> Candidatos ({usuarios.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('empresas')}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: activeTab === 'empresas' ? 'white' : 'transparent', color: activeTab === 'empresas' ? 'var(--text-dark)' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: activeTab === 'empresas' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                        <Building2 size={16}/> Empresas ({empresas.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('insignias')}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: activeTab === 'insignias' ? 'white' : 'transparent', color: activeTab === 'insignias' ? 'var(--text-dark)' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: activeTab === 'insignias' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                        <Award size={16}/> Insignias ({insignias.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('finanzas')}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: activeTab === 'finanzas' ? 'white' : 'transparent', color: activeTab === 'finanzas' ? '#15803d' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: activeTab === 'finanzas' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                        <DollarSign size={16}/> Finanzas
                    </button>
                </div>

                {/* BUSCADOR */}
                {activeTab !== 'finanzas' && (
                    <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
                        <Search size={18} color="var(--text-gray)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre, email..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '9px 14px 9px 40px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}>✕</button>
                        )}
                    </div>
                )}
            </div>

            {/* OFERTAS TAB */}
            {activeTab === 'ofertas' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {ofertasFiltradas.length === 0 && <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '2rem' }}>No se encontraron ofertas.</p>}
                    {ofertasFiltradas.map(oferta => {
                        const isExpanded = expandedOfertaId === oferta.id;
                        return (
                            <div key={oferta.id} style={{ background: oferta.oculta_admin ? '#fee2e2' : 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.15rem' }}>
                                            {oferta.titulo} {oferta.oculta_admin && <span style={{color: '#dc2626', fontSize: '0.8rem', marginLeft: '10px', fontWeight: 'bold'}}>(Oculta por Admin)</span>}
                                        </h3>
                                        <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                            Empresa: <strong>{oferta.empresas?.nombre || 'N/A'}</strong> • Modalidad: {oferta.modalidad || 'N/A'} • Estado: {oferta.estado || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => setExpandedOfertaId(isExpanded ? null : oferta.id)}
                                            style={{ background: isExpanded ? '#e2e8f0' : '#f1f5f9', color: '#334155', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                                            <FileText size={16} />
                                            {isExpanded ? 'Ocultar descripción' : 'Ver descripción'}
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        <button
                                            onClick={() => toggleOcultarOferta(oferta.id, oferta.oculta_admin)}
                                            disabled={actionLoading === `oferta-${oferta.id}`}
                                            style={{ background: oferta.oculta_admin ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: actionLoading === `oferta-${oferta.id}` ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', opacity: actionLoading === `oferta-${oferta.id}` ? 0.7 : 1 }}>
                                            {actionLoading === `oferta-${oferta.id}` ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : oferta.oculta_admin ? <><ShieldAlert size={16}/> Restaurar</> : <><EyeOff size={16}/> Ocultar Oferta</>}
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.92rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6', marginTop: '4px' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Descripción del puesto:
                                        </div>
                                        {oferta.descripcion || 'Sin descripción disponible para esta oferta.'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* USUARIOS TAB */}
            {activeTab === 'usuarios' && (
                <div>
                    {/* FILTROS USUARIO */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-gray)', fontWeight: '600' }}>Filtrar Candidatos:</span>
                        {[
                            { key: 'todos', label: `Todos (${usuarios.length})` },
                            { key: 'pagados', label: `Premium Pagados (${stats.candidatosPremiumPagados || 0})` },
                            { key: 'manuales', label: `Cortesía / Regalo (${stats.candidatosPremiumManuales || 0})` },
                            { key: 'free', label: `Gratuitos (${stats.candidatosFree})` },
                            { key: 'baneados', label: 'Baneados' }
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setCandidatoFilter(f.key)}
                                style={{
                                    padding: '5px 12px', borderRadius: '20px', border: '1px solid #cbd5e1',
                                    background: candidatoFilter === f.key ? 'var(--text-dark)' : 'white',
                                    color: candidatoFilter === f.key ? 'white' : 'var(--text-gray)',
                                    fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer'
                                }}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {usuariosFiltrados.length === 0 && <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '2rem' }}>No se encontraron candidatos con el filtro actual.</p>}
                        {usuariosFiltrados.map(usuario => {
                            const isPrem = usuario.es_premium && usuario.premium_hasta && new Date(usuario.premium_hasta) > now;
                            const isManual = usuario.es_manual_premium;
                            const isPremLoading = actionLoading === `prem-user-${usuario.id}`;
                            const isBanLoading = actionLoading === `ban-user-${usuario.id}`;

                            return (
                                <div key={usuario.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: usuario.baneado ? '#fee2e2' : 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{usuario.nombre_completo || 'Sin nombre'}</h3>
                                            {isPrem && (
                                                <span style={{ 
                                                    background: isManual ? '#64748b' : 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', 
                                                    color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' 
                                                }}>
                                                    {isManual ? <><Gift size={12}/> PREMIUM (CORTESÍA / PRUEBA)</> : <><Crown size={12}/> PREMIUM (PAGADO)</>}
                                                </span>
                                            )}
                                            {usuario.baneado && <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 'bold' }}>(Baneado)</span>}
                                        </div>
                                        <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginTop: '4px' }}>
                                            Email: <strong>{usuario.email || 'N/A'}</strong> • Título: {usuario.titulo_profesional || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => togglePremiumCandidato(usuario.id, isPrem)}
                                            disabled={isPremLoading}
                                            style={{ background: isPrem ? '#f1f5f9' : 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)', color: isPrem ? '#475569' : 'white', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: isPremLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                            {isPremLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : isPrem ? <><Crown size={15}/> Quitar Premium</> : <><Crown size={15}/> Dar Premium Cortesía</>}
                                        </button>
                                        <button
                                            onClick={() => toggleBanUsuario(usuario.id, usuario.baneado)}
                                            disabled={isBanLoading}
                                            style={{ background: usuario.baneado ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: isBanLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', opacity: isBanLoading ? 0.7 : 1 }}>
                                            {isBanLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : usuario.baneado ? <><ShieldAlert size={16}/> Desbanear</> : <><Ban size={16}/> Banear</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* EMPRESAS TAB */}
            {activeTab === 'empresas' && (
                <div>
                    {/* FILTROS EMPRESA */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-gray)', fontWeight: '600' }}>Filtrar Empresas:</span>
                        {[
                            { key: 'todas', label: `Todas (${empresas.length})` },
                            { key: 'pagadas', label: `Premium Pagadas (${stats.empresasPremiumPagadas || 0})` },
                            { key: 'manuales', label: `Cortesía / Regalo (${stats.empresasPremiumManuales || 0})` },
                            { key: 'free', label: `Gratuitas (${stats.empresasFree})` },
                            { key: 'baneadas', label: 'Baneadas' }
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setEmpresaFilter(f.key)}
                                style={{
                                    padding: '5px 12px', borderRadius: '20px', border: '1px solid #cbd5e1',
                                    background: empresaFilter === f.key ? 'var(--text-dark)' : 'white',
                                    color: empresaFilter === f.key ? 'white' : 'var(--text-gray)',
                                    fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer'
                                }}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {empresasFiltradas.length === 0 && <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '2rem' }}>No se encontraron empresas con el filtro actual.</p>}
                        {empresasFiltradas.map(empresa => {
                            const isPrem = empresa.plan === 'premium' && empresa.premium_hasta && new Date(empresa.premium_hasta) > now;
                            const isManual = empresa.es_manual_premium;
                            const isPremLoading = actionLoading === `prem-emp-${empresa.id}`;
                            const isBanLoading = actionLoading === `ban-emp-${empresa.id}`;

                            return (
                                <div key={empresa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: empresa.baneada ? '#fee2e2' : 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{empresa.nombre || 'Sin nombre'}</h3>
                                            {isPrem && (
                                                <span style={{ 
                                                    background: isManual ? '#64748b' : 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', 
                                                    color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' 
                                                }}>
                                                    {isManual ? <><Gift size={12}/> PLAN CORTESÍA / PRUEBA</> : <><Crown size={12}/> PLAN PREMIUM PAGADO</>}
                                                </span>
                                            )}
                                            {empresa.baneada && <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 'bold' }}>(Baneada)</span>}
                                        </div>
                                        <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginTop: '4px' }}>
                                            Sector: <strong>{empresa.sector || 'N/A'}</strong> • Registrada: {empresa.creada_en ? new Date(empresa.creada_en).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => togglePremiumEmpresa(empresa.id, isPrem)}
                                            disabled={isPremLoading}
                                            style={{ background: isPrem ? '#f1f5f9' : 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)', color: isPrem ? '#475569' : 'white', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: isPremLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                            {isPremLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : isPrem ? <><Crown size={15}/> Quitar Premium</> : <><Crown size={15}/> Dar Premium Cortesía</>}
                                        </button>
                                        <button
                                            onClick={() => toggleBanEmpresa(empresa.id, empresa.baneada)}
                                            disabled={isBanLoading}
                                            style={{ background: empresa.baneada ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: isBanLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', opacity: isBanLoading ? 0.7 : 1 }}>
                                            {isBanLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : empresa.baneada ? <><ShieldAlert size={16}/> Desbanear</> : <><Ban size={16}/> Banear</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* INSIGNIAS TAB */}
            {activeTab === 'insignias' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {insigniasFiltradas.length === 0 && <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '2rem' }}>No hay insignias registradas con el criterio de búsqueda.</p>}
                    {insigniasFiltradas.map(ins => (
                        <div key={ins.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Award size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{ins.insignias?.nombre || 'Insignia de Skill'}</h3>
                                    <div style={{ fontSize: '0.88rem', color: 'var(--text-gray)' }}>
                                        Otorgada a: <strong>{ins.candidatos?.nombre_completo || 'Candidato'}</strong> ({ins.candidatos?.email || 'N/A'})
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} /> {ins.fecha_obtenida ? new Date(ins.fecha_obtenida).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FINANZAS TAB */}
            {activeTab === 'finanzas' && (
                <div>
                    {/* RESUMEN MONETARIO REAL (EXCLUYENDO MANUALES) */}
                    <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', borderRadius: '20px', padding: '2rem', color: 'white', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(4,120,87,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: 'bold' }}>
                                Ingresos Reales Pagados (Sin contar cortesías/prueba)
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                🔒 Excluye asignaciones manuales de Admin
                            </div>
                        </div>
                        <div style={{ fontSize: '3.2rem', fontWeight: '800', margin: '8px 0 16px 0', letterSpacing: '-1px' }}>
                            {formatCurrency(stats.finanzas?.ingresoTotalBruto)} <span style={{ fontSize: '1.2rem', fontWeight: 'normal', opacity: 0.8 }}>ARS</span>
                        </div>
                        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Ingresos Candidatos Pagados:</span>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{formatCurrency(stats.finanzas?.ingresoCandidatos)}</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{stats.finanzas?.candidatosPagadosCount || 0} suscriptores con pago real</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Ingresos Empresas Pagados:</span>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{formatCurrency(stats.finanzas?.ingresoEmpresas)}</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{stats.finanzas?.empresasPagadasCount || 0} empresas con pago real</div>
                            </div>
                        </div>
                    </div>

                    {/* TABLA DESGLOSE DE SUSCRIPCIONES Y CORTESÍAS */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.15rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={20} color="var(--primary)" /> Auditoría de Suscripciones y Cortesías
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Card Candidatos Pagados */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px', color: '#d97706' }}>
                                        <Crown size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>Candidatos Premium (Pago Real)</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Tarifa: $5.000 ARS / mes por usuario</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{stats.finanzas?.candidatosPagadosCount || 0} pagados</div>
                                    <div style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 'bold' }}>Subtotal: {formatCurrency(stats.finanzas?.ingresoCandidatos)}</div>
                                </div>
                            </div>

                            {/* Card Empresas Pagadas */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '12px', color: '#0284c7' }}>
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>Empresas Premium (Pago Real)</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Tarifa: $25.000 ARS / mes por empresa</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{stats.finanzas?.empresasPagadasCount || 0} pagadas</div>
                                    <div style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 'bold' }}>Subtotal: {formatCurrency(stats.finanzas?.ingresoEmpresas)}</div>
                                </div>
                            </div>

                            {/* Card Asignaciones Manuales / Regalos (Ingreso $0 ARS) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', background: '#f1f5f9', borderRadius: '12px', border: '1px dashed #cbd5e1', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#e2e8f0', padding: '10px', borderRadius: '12px', color: '#475569' }}>
                                        <Gift size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#334155' }}>Asignaciones Cortesía / Pruebas de Admin</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Otorgados manualmente desde consola o panel (Sin cargo)</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#334155' }}>
                                        {(stats.finanzas?.candidatosManualesCount || 0) + (stats.finanzas?.empresasManualesCount || 0)} cuentas
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Subtotal: $0 ARS (No suma a finanzas)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
