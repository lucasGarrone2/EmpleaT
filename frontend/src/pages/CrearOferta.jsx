import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Briefcase, ArrowLeft, CheckCircle2, X, FileSearch } from 'lucide-react';
import { COMMON_SKILLS } from '../utils/commonSkills';

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
        ciudad: '',
        nombre_empresa_custom: '',
        salario_min_usd: '',
        salario_max_usd: '',
        limite_postulaciones: '',
        porcentaje_match_minimo: '',
        seniority: 'Indistinto',
        estado: 'Publicada'
    });

    const [skillsList, setSkillsList] = useState([]); // [{nombre, nivel}]
    const [skillInput, setSkillInput] = useState('');
    const [skillNivel, setSkillNivel] = useState(3);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchEmpresa = async () => {
            const { data, error } = await supabase
                .from('empresa_miembros')
                .select('empresa_id')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (error || !data) {
                navigate('/dashboard-empresa');
            } else {
                setEmpresaId(data.empresa_id);
                setLoading(false);
            }
        };

        fetchEmpresa();
    }, [user, navigate]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = skillInput.trim();
            if (val && !skillsList.map(s => s.nombre.toLowerCase()).includes(val.toLowerCase())) {
                setSkillsList([...skillsList, { nombre: val, nivel: skillNivel }]);
            }
            setSkillInput('');
        }
    };

    const removeSkill = (nombreToRemove) => {
        setSkillsList(skillsList.filter(s => s.nombre !== nombreToRemove));
    };

    const updateSkillNivel = (nombre, nuevoNivel) => {
        setSkillsList(skillsList.map(s => s.nombre === nombre ? { ...s, nivel: nuevoNivel } : s));
    };

    const sugerirSkills = () => {
        if (!formData.descripcion.trim()) {
            setError('Escribe una descripción primero para poder extraer las habilidades.');
            setTimeout(() => setError(null), 4000);
            return;
        }

        const extracted = [];
        const descLower = formData.descripcion.toLowerCase();
        
        COMMON_SKILLS.forEach(skill => {
            const skillLower = skill.toLowerCase();
            const safeSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
            const regex = new RegExp(`(?:^|\\s|_|[.,;!/?()])${safeSkill}(?:$|\\s|_|[.,;!/?()])`, 'i');
            
            if (regex.test(descLower)) {
                if (!skillsList.some(s => s.nombre.toLowerCase() === skillLower)) {
                    extracted.push(skill);
                }
            }
        });

        if (extracted.length > 0) {
            setSkillsList(prev => [...prev, ...extracted
                .filter(e => !prev.some(p => p.nombre.toLowerCase() === e.toLowerCase()))
                .map(e => ({ nombre: e, nivel: skillNivel }))
            ]);
        } else {
            setError('No se detectaron habilidades técnicas estándar en tu descripción.');
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // Bug 007: Validar que el salario máximo no sea inferior al mínimo
        if (formData.salario_max_usd && parseInt(formData.salario_max_usd) < parseInt(formData.salario_min_usd)) {
            setError('El salario máximo no puede ser menor al salario mínimo.');
            setSaving(false);
            return;
        }

        try {
            // 1. Crear la Oferta
            const { data: ofertaData, error: ofertaError } = await supabase
                .from('ofertas')
                .insert({
                    empresa_id: empresaId,
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    modalidad: formData.modalidad,
                    ciudad: formData.ciudad?.trim() || null,
                    nombre_empresa_custom: formData.nombre_empresa_custom?.trim() || null,
                    salario_min_usd: parseInt(formData.salario_min_usd),
                    salario_max_usd: formData.salario_max_usd ? parseInt(formData.salario_max_usd) : null,
                    seniority: formData.seniority,
                    estado: formData.estado,
                    limite_postulaciones: formData.limite_postulaciones ? parseInt(formData.limite_postulaciones) : null,
                    porcentaje_match_minimo: formData.porcentaje_match_minimo ? parseInt(formData.porcentaje_match_minimo) : 0,
                })
                .select()
                .single();

            if (ofertaError) throw new Error("Error creando oferta base: " + ofertaError.message);

            // 2. Procesar las Skills
            if (skillsList.length > 0) {
                const { data: matchedSkills, error: rpcError } = await supabase
                    .rpc('match_skills', { skill_names: skillsList.map(s => s.nombre) });

                if (rpcError) throw new Error("Error consultando ESCO: " + rpcError.message);

                const bestMatchPerSkill = new Map();
                if (matchedSkills) {
                    const validSkills = matchedSkills.filter(m => m.similitud > 0.65);
                    validSkills.forEach(match => {
                        const currentBest = bestMatchPerSkill.get(match.original_skill);
                        if (!currentBest || currentBest.similitud < match.similitud) {
                            bestMatchPerSkill.set(match.original_skill, match);
                        }
                    });
                }

                const uniqueSkillsMap = new Map();
                Array.from(bestMatchPerSkill.values()).forEach(match => {
                    if (!uniqueSkillsMap.has(match.esco_id)) {
                        const skillObj = skillsList.find(s => s.nombre.toLowerCase() === match.original_skill.toLowerCase());
                        uniqueSkillsMap.set(match.esco_id, {
                            oferta_id: ofertaData.id,
                            skill_id: match.esco_id,
                            nivel_requerido: skillObj?.nivel ?? 3,
                            nombre_original: match.original_skill
                        });
                    }
                });

                // Rescatar las palabras que ESCO no reconoció
                const matchedNamesLower = new Set(Array.from(bestMatchPerSkill.keys()).map(k => k.toLowerCase()));
                const unmatchedWords = skillsList.filter(s => !matchedNamesLower.has(s.nombre.toLowerCase()));

                if (unmatchedWords.length > 0) {
                    const skillsAInsertar = unmatchedWords.map(s => ({
                        nombre_skill: s.nombre,
                        tipo: 'Personalizado'
                    }));

                    const { data: nuevasSkills, error: insertError } = await supabase
                        .from('diccionario_skills')
                        .insert(skillsAInsertar)
                        .select('id, nombre_skill');

                    if (!insertError && nuevasSkills) {
                        nuevasSkills.forEach(newSkill => {
                            const skillObj = unmatchedWords.find(s => s.nombre.toLowerCase() === newSkill.nombre_skill.toLowerCase());
                            uniqueSkillsMap.set(newSkill.id, {
                                oferta_id: ofertaData.id,
                                skill_id: newSkill.id,
                                nivel_requerido: skillObj?.nivel ?? 3,
                                nombre_original: newSkill.nombre_skill
                            });
                        });
                    }
                }

                // Insert final list of skills to the offer
                const ofertaSkillsArray = Array.from(uniqueSkillsMap.values());
                if (ofertaSkillsArray.length > 0) {
                    const { error: skillsInsertError } = await supabase
                        .from('oferta_skills')
                        .insert(ofertaSkillsArray);

                    if (skillsInsertError) {
                        throw new Error("Error insertando en oferta_skills: " + skillsInsertError.message + " | " + skillsInsertError.details);
                    }
                }
            }

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

            {error && <div className="message error" style={{marginBottom: '2rem', backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '12px', border: '1px solid #ef9a9a'}}>{error}</div>}

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
                
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2 1 300px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Título del Puesto *</label>
                        <input 
                            type="text" required maxLength={200}
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
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Seniority *</label>
                        <select 
                            value={formData.seniority}
                            onChange={e => setFormData({...formData, seniority: e.target.value})}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        >
                            <option value="Trainee">Trainee</option>
                            <option value="Junior">Junior</option>
                            <option value="Semi Senior">Semi Senior</option>
                            <option value="Senior">Senior</option>
                            <option value="Indistinto">Indistinto</option>
                        </select>
                    </div>
                    {(formData.modalidad === 'Presencial' || formData.modalidad === 'Híbrido') && (
                        <div style={{ flex: '1 1 180px' }}>
                            <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Ciudad de Referencia</label>
                            <input 
                                type="text" maxLength={100}
                                value={formData.ciudad}
                                onChange={e => setFormData({...formData, ciudad: e.target.value})}
                                placeholder="Ej: Buenos Aires"
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Nombre de la Empresa o Cliente a Mostrar <span style={{fontWeight:'400', fontSize:'0.9rem'}}>(opcional — ideal si reclutás para un tercero o de forma confidencial)</span></label>
                    <input 
                        type="text" maxLength={150}
                        value={formData.nombre_empresa_custom}
                        onChange={e => setFormData({...formData, nombre_empresa_custom: e.target.value})}
                        placeholder="Ej: Startup XYZ, Cliente Confidencial... (dejalo vacío para usar tu nombre registrado)"
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>

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

                <div>
                    <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Descripción del Puesto *</label>
                    <textarea required
                        value={formData.descripcion} maxLength={3000}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Escribe todo el detalle del anuncio..."
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', minHeight: '150px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                </div>

                {/* TAG INPUT COMPONENT */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', margin: '0' }}>Habilidades Requeridas (Skills) *</label>
                        <button 
                            type="button" 
                            onClick={sugerirSkills}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                                background: '#EAF9F1', color: 'var(--primary)', border: '1px solid #c2e8d4', 
                                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' 
                            }}
                        >
                            <FileSearch size={16} /> Extraer de la Descripción
                        </button>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 0, marginBottom: '12px' }}>
                        ¡Escribe tu anuncio arriba y usa el botón para extraer las tecnologías requeridas, o escríbelas y presiona <strong>ENTER</strong>!
                    </p>
                    
                    <div style={{ 
                        border: '1px solid rgba(0,0,0,0.1)', 
                        borderRadius: '12px', 
                        padding: '10px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        minHeight: '52px',
                        boxSizing: 'border-box',
                        transition: 'border 0.2s',
                        background: 'white'
                    }}>
                        {skillsList.map((skill, index) => (
                            <div key={index} style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(0,214,107,0.08)', color: 'var(--primary)',
                                padding: '5px 8px 5px 14px', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 'bold',
                                border: '1px solid rgba(0,214,107,0.2)'
                            }}>
                                <span>{skill.nombre}</span>
                                <select
                                    value={skill.nivel}
                                    onChange={e => updateSkillNivel(skill.nombre, Number(e.target.value))}
                                    title="Nivel requerido"
                                    style={{ 
                                        border: 'none', background: 'rgba(0,214,107,0.15)', color: 'var(--secondary)',
                                        borderRadius: '10px', padding: '2px 6px', fontSize: '0.8rem', fontWeight: 'bold',
                                        cursor: 'pointer', outline: 'none'
                                    }}
                                >
                                    <option value={1}>Lvl 1</option>
                                    <option value={2}>Lvl 2</option>
                                    <option value={3}>Lvl 3</option>
                                    <option value={4}>Lvl 4</option>
                                    <option value={5}>Lvl 5</option>
                                </select>
                                <X 
                                    size={14} 
                                    style={{ cursor: 'pointer', opacity: 0.6 }} 
                                    onClick={() => removeSkill(skill.nombre)}
                                    title="Quitar"
                                />
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1', minWidth: '200px' }}>
                            <input 
                                type="text" maxLength={200}
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={skillsList.length === 0 ? "Ej: React, Node, SQL..." : "Agregar otra..."}
                                style={{ 
                                    flex: '1', border: 'none', outline: 'none', 
                                    padding: '6px', fontSize: '1.05rem', background: 'transparent'
                                }}
                            />
                            <select
                                value={skillNivel}
                                onChange={e => setSkillNivel(Number(e.target.value))}
                                title="Nivel para la próxima skill"
                                style={{ 
                                    border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: 'var(--text-gray)',
                                    borderRadius: '8px', padding: '4px 8px', fontSize: '0.85rem',
                                    cursor: 'pointer', outline: 'none'
                                }}
                            >
                                <option value={1}>Lvl 1</option>
                                <option value={2}>Lvl 2</option>
                                <option value={3}>Lvl 3</option>
                                <option value={4}>Lvl 4</option>
                                <option value={5}>Lvl 5</option>
                            </select>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#888', margin: '6px 0 0 0' }}>Seleccioná el nivel requerido antes de presionar Enter. Podés cambiarlo en cada tag.</p>
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
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Match Mínimo Requerido (%)</label>
                        <input 
                            type="number" min="0" max="100"
                            value={formData.porcentaje_match_minimo}
                            onChange={e => setFormData({...formData, porcentaje_match_minimo: e.target.value})}
                            placeholder="Ej: 60 (Oculta perfiles < 60%)"
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
                        type="button" 
                        onClick={handleSubmit}
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
                        {saving ? 'Publicando...' : <><CheckCircle2 size={22} /> Publicar Oferta</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
