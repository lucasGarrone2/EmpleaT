import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ShieldAlert, Trash2, Ban, EyeOff, User, Building2, Briefcase } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('ofertas');
    const [ofertas, setOfertas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Ofertas
            const { data: ofData } = await supabase
                .from('ofertas')
                .select('id, titulo, modalidad, estado, creada_en, oculta_admin, empresas(nombre)')
                .order('creada_en', { ascending: false });
            if (ofData) setOfertas(ofData);

            // Fetch Candidatos
            const { data: usData } = await supabase
                .from('candidatos')
                .select('id, nombre_completo, titulo_profesional, baneado');
            if (usData) setUsuarios(usData);

            // Fetch Empresas
            const { data: empData } = await supabase
                .from('empresas')
                .select('id, nombre, sector, baneada');
            if (empData) setEmpresas(empData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        }
        setLoading(false);
    };

    const toggleOcultarOferta = async (id, estadoActual) => {
        const { error } = await supabase.from('ofertas').update({ oculta_admin: !estadoActual }).eq('id', id);
        if (!error) setOfertas(ofertas.map(o => o.id === id ? { ...o, oculta_admin: !estadoActual } : o));
    };

    const toggleBanUsuario = async (id, estadoActual) => {
        const { error } = await supabase.from('candidatos').update({ baneado: !estadoActual }).eq('id', id);
        if (!error) setUsuarios(usuarios.map(u => u.id === id ? { ...u, baneado: !estadoActual } : u));
    };

    const toggleBanEmpresa = async (id, estadoActual) => {
        const { error } = await supabase.from('empresas').update({ baneada: !estadoActual }).eq('id', id);
        if (!error) setEmpresas(empresas.map(e => e.id === id ? { ...e, baneada: !estadoActual } : e));
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando panel de control...</div>;

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
                                style={{ background: oferta.oculta_admin ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                {oferta.oculta_admin ? <><ShieldAlert size={16}/> Restaurar</> : <><EyeOff size={16}/> Ocultar Oferta</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* USUARIOS TAB */}
            {activeTab === 'usuarios' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
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
                                style={{ background: usuario.baneado ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                {usuario.baneado ? <><ShieldAlert size={16}/> Desbanear</> : <><Ban size={16}/> Banear Candidato</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* EMPRESAS TAB */}
            {activeTab === 'empresas' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
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
                                style={{ background: empresa.baneada ? '#22c55e' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                {empresa.baneada ? <><ShieldAlert size={16}/> Desbanear</> : <><Ban size={16}/> Banear Empresa</>}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
