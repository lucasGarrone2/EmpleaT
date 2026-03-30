import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Briefcase, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CrearOferta() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [empresaId, setEmpresaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        modalidad: 'Remoto',
        salario_min_usd: '',
        salario_max_usd: '',
        limite_postulaciones: '',
        estado: 'Publicada',
        skills: ''
    });

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchEmpresa = async () => {
            const { data, error } = await supabase
                .from('empresas')
                .select('id')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (error || !data) {
                // Return them to dashboard to complete onboarding first
                navigate('/dashboard-empresa');
            } else {
                setEmpresaId(data.id);
                setLoading(false);
            }
        };

        fetchEmpresa();
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // 1. Crear la Oferta
            const { data: ofertaData, error: ofertaError } = await supabase
                .from('ofertas')
                .insert({
                    empresa_id: empresaId,
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    modalidad: formData.modalidad,
                    salario_min_usd: parseInt(formData.salario_min_usd),
                    salario_max_usd: formData.salario_max_usd ? parseInt(formData.salario_max_usd) : null,
                    estado: formData.estado,
                    limite_postulaciones: formData.limite_postulaciones ? parseInt(formData.limite_postulaciones) : null,
                })
                .select()
                .single();

            if (ofertaError) throw new Error("Error creando oferta: " + ofertaError.message);

            // 2. Procesar las Skills (Si ingreso alguna)
            if (formData.skills.trim().length > 0) {
                const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
                
                if (skillsArray.length > 0) {
                    // LLamar al RPC de emparejamiento con ESCO
                    const { data: matchedSkills, error: rpcError } = await supabase
                        .rpc('match_skills', { skill_names: skillsArray });

                    if (rpcError) throw new Error("Error emparejando skills: " + rpcError.message);

                    const validSkills = (matchedSkills || []).filter(m => m.similitud > 0.3);

                    if (validSkills.length > 0) {
                        // 1. Obtener la mejor coincidencia para cada palabra ingresada
                        const bestMatchPerSkill = new Map();
                        validSkills.forEach(match => {
                            const currentBest = bestMatchPerSkill.get(match.skill_name);
                            if (!currentBest || currentBest.similitud < match.similitud) {
                                bestMatchPerSkill.set(match.skill_name, match);
                            }
                        });

                        // 2. Asegurar unicidad por skill_id (ESCO ID) para evitar duplicados en la base de datos
                        const uniqueSkillsMap = new Map();
                        Array.from(bestMatchPerSkill.values()).forEach(match => {
                            if (!uniqueSkillsMap.has(match.esco_id)) {
                                uniqueSkillsMap.set(match.esco_id, {
                                    oferta_id: ofertaData.id,
                                    skill_id: match.esco_id,
                                    nivel_requerido: 3,
                                    nombre_original: match.skill_name // <- Guardamos la palabra literal
                                });
                            }
                        });

                        const ofertaSkillsArray = Array.from(uniqueSkillsMap.values());

                        const { error: skillsInsertError } = await supabase
                            .from('oferta_skills')
                            .insert(ofertaSkillsArray);

                        if (skillsInsertError) {
                            console.warn("Posible duplicado insertando skills (ignorar)", skillsInsertError);
                        }
                    }
                }
            }

            // Exito
            navigate('/dashboard-empresa');
            
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
            <button 
                onClick={() => navigate('/dashboard-empresa')}
                style={{ 
                    background: 'none', border: 'none', color: 'var(--text-gray)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 'bold', padding: 0, marginBottom: '2rem', fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} /> Volver a mis búsquedas
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(0,214,107,0.1)', padding: '12px', borderRadius: '14px' }}>
                    <Briefcase size={28} color="var(--primary)" />
                </div>
                <h1 style={{ fontSize: '2.2rem', color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>
                    Publicar Nueva Oferta
                </h1>
            </div>

            {error && <div className="message error" style={{marginBottom: '2rem'}}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ 
                background: 'var(--bg-white)',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.8rem'
            }}>
                
                {/* Título y Estado */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2 1 300px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Título del Puesto *</label>
                        <input 
                            type="text" required
                            value={formData.titulo}
                            onChange={e => setFormData({...formData, titulo: e.target.value})}
                            placeholder="Ej: Desarrollador Fullstack React/Node"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                        />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Modalidad *</label>
                        <select 
                            value={formData.modalidad}
                            onChange={e => setFormData({...formData, modalidad: e.target.value})}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        >
                            <option value="Remoto">Remoto</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Presencial">Presencial</option>
                        </select>
                    </div>
                </div>

                {/* Salarios */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Salario Mínimo (USD) *</label>
                        <input 
                            type="number" required min="1"
                            value={formData.salario_min_usd}
                            onChange={e => setFormData({...formData, salario_min_usd: e.target.value})}
                            placeholder="Ej: 1500"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Salario Máximo (USD)</label>
                        <input 
                            type="number" min={formData.salario_min_usd}
                            value={formData.salario_max_usd}
                            onChange={e => setFormData({...formData, salario_max_usd: e.target.value})}
                            placeholder="Opcional"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                {/* Habilidades */}
                <div>
                    <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Habilidades Requeridas (Skills) *</label>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 0, marginBottom: '8px' }}>
                        Ingresa los <strong>conceptos clave</strong> separados por comas. Nuestro motor de IA (ESCO) los interpretará automáticamente para encontrar a los mejores candidatos.
                    </p>
                    <input 
                        type="text" required
                        value={formData.skills}
                        onChange={e => setFormData({...formData, skills: e.target.value})}
                        placeholder="Ej: React, Python, Bases de Datos SQL, Trabajo en equipo"
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>

                {/* Descripción y otros */}
                <div>
                    <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Descripción del Puesto</label>
                    <textarea 
                        value={formData.descripcion}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Describe las responsabilidades, beneficios, la cultura de la empresa..."
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', minHeight: '150px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Límite de Postulaciones</label>
                        <input 
                            type="number" min="1"
                            value={formData.limite_postulaciones}
                            onChange={e => setFormData({...formData, limite_postulaciones: e.target.value})}
                            placeholder="Ej: 50 (Opcional)"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Publicar Inmediatamente</label>
                        <select 
                            value={formData.estado}
                            onChange={e => setFormData({...formData, estado: e.target.value})}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        >
                            <option value="Publicada">Sí, Publicar ahora</option>
                            <option value="Borrador">No, Guardar como Borrador</option>
                        </select>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '1rem 0' }} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button 
                        type="button"
                        onClick={() => navigate('/dashboard-empresa')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', padding: '14px 24px', borderRadius: '12px' }}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={saving}
                        style={{ 
                            background: 'var(--primary)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            padding: '14px 28px', 
                            fontSize: '1.1rem',
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 8px 20px rgba(0,214,107,0.3)',
                        }}
                    >
                        {saving ? 'Procesando con ESCO...' : <><CheckCircle2 size={22} /> Publicar Oferta</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
