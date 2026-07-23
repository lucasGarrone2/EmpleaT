import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Trash2, Ban, EyeOff, User, Building2, Briefcase, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * SEC-14: Todas las operaciones administrativas ahora pasan por el backend.
 * El backend verifica que el usuario existe en la tabla `administradores`
 * (no confía en user_metadata.rol, que es manipulable desde el cliente).
 */
export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('ofertas');
    const [ofertas, setOfertas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id de la acción en curso
    const [error, setError] = useState(null);

    // Helper: obtiene el token del usuario actual
    const getToken = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    }, []);

    // Helper: llama al backend con autenticación
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
            setOfertas(data.ofertas || []);
            setUsuarios(data.candidatos || []);
            setEmpresas(data.empresas || []);
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
        setActionLoading(id);
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
        setActionLoading(id);
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
        setActionLoading(id);
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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', gap: '12px' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Cargando panel de control...</span>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                <div style={{ background: '#fef08a', padding: '12px', borderRadius: '14px' }}>
                    <ShieldAlert size={28} color="#854d0e" />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--text-dark)', margin: 0 }}>Panel de Administrador</h1>
                    <p style={{ margin: 0, color: 'var(--text-gray)' }}>Modera ofertas, candidatos y empresas para mantener la calidad de EmpleaT.</p>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold' }}>✕</button>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setActiveTab('ofertas')}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeTab === 'ofertas' ? 'var(--primary)' : 'transparent', color: activeTab === 'ofertas' ? 'white' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={18}/> Ofertas ({ofertas.length})
                </button>
                <button
                    onClick={() => setActiveTab('usuarios')}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeTab === 'usuarios' ? 'var(--secondary)' : 'transparent', color: activeTab === 'usuarios' ? 'white' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18}/> Candidatos ({usuarios.length})
                </button>
                <button
                    onClick={() => setActiveTab('empresas')}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeTab === 'empresas' ? 'var(--text-dark)' : 'transparent', color: activeTab === 'empresas' ? 'white' : 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18}/> Empresas ({empresas.length})
                </button>
            </div>

            {/* OFERTAS TAB */}
            {activeTab === 'ofertas' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {ofertas.length === 0 && <p style={{ color: 'var(--text-gray)', textAlign: 'center' }}>No hay ofertas para mostrar.</p>}
                    {ofertas.map(oferta => (
                        <div key={oferta.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: oferta.oculta_admin ? '#fee2e2' : 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{oferta.titulo} {oferta.oculta_admin && <span style={{color: 'red', fontSize: '0.8rem', marginLeft: '10px'}}>(Oculta por Admin)</span>}</h3>
                                <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                    Empresa: <strong>{oferta.empresas?.nombre}</strong> • Modalidad: {oferta.modalidad} • Estado: {oferta.estado}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleOcultarOferta(oferta.id, oferta.oculta_admin)}
                                disabled={actionLoading === oferta.id}
                                style={{ background: oferta.oculta_admin ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: actionLoading === oferta.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', opacity: actionLoading === oferta.id ? 0.7 : 1 }}>
                                {actionLoading === oferta.id ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : oferta.oculta_admin ? <><ShieldAlert size={16}/> Restaurar</> : <><EyeOff size={16}/> Ocultar Oferta</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* USUARIOS TAB */}
            {activeTab === 'usuarios' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {usuarios.length === 0 && <p style={{ color: 'var(--text-gray)', textAlign: 'center' }}>No hay candidatos para mostrar.</p>}
                    {usuarios.map(usuario => (
                        <div key={usuario.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: usuario.baneado ? '#fee2e2' : 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{usuario.nombre_completo || 'Sin nombre'} {usuario.baneado && <span style={{color: 'red', fontSize: '0.8rem', marginLeft: '10px'}}>(Baneado)</span>}</h3>
                                <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                    ID: {usuario.id} • Título: {usuario.titulo_profesional || 'N/A'}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleBanUsuario(usuario.id, usuario.baneado)}
                                disabled={actionLoading === usuario.id}
                                style={{ background: usuario.baneado ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: actionLoading === usuario.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', opacity: actionLoading === usuario.id ? 0.7 : 1 }}>
                                {actionLoading === usuario.id ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : usuario.baneado ? <><ShieldAlert size={16}/> Desbanear</> : <><Ban size={16}/> Banear Candidato</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* EMPRESAS TAB */}
            {activeTab === 'empresas' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {empresas.length === 0 && <p style={{ color: 'var(--text-gray)', textAlign: 'center' }}>No hay empresas para mostrar.</p>}
                    {empresas.map(empresa => (
                        <div key={empresa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: empresa.baneada ? '#fee2e2' : 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{empresa.nombre || 'Sin nombre'} {empresa.baneada && <span style={{color: 'red', fontSize: '0.8rem', marginLeft: '10px'}}>(Baneada)</span>}</h3>
                                <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                    ID: {empresa.id} • Sector: {empresa.sector || 'N/A'}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleBanEmpresa(empresa.id, empresa.baneada)}
                                disabled={actionLoading === empresa.id}
                                style={{ background: empresa.baneada ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: actionLoading === empresa.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', opacity: actionLoading === empresa.id ? 0.7 : 1 }}>
                                {actionLoading === empresa.id ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : empresa.baneada ? <><ShieldAlert size={16}/> Desbanear</> : <><Ban size={16}/> Banear Empresa</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
