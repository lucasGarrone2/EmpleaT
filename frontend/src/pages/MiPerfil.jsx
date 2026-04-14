import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { User, Briefcase, Clock, FileText, Edit2, Save, X, BrainCircuit, Trash2 } from 'lucide-react';
import './Register.css'; // Reusing established styles

export default function MiPerfil() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [candidato, setCandidato] = useState(null);
    const [skills, setSkills] = useState([]);
    
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        titulo_profesional: '',
        anios_experiencia: 0,
        sobre_mi: ''
    });
    
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillLevel, setNewSkillLevel] = useState(3);
    const [addingSkill, setAddingSkill] = useState(false);

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2000000) {
                setError("La foto no puede pesar más de 2MB.");
                return;
            }
            setFotoFile(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        const fetchPerfil = async () => {
            try {
                // Fetch basic info
                const { data: candData, error: candError } = await supabase
                    .from('candidatos')
                    .select('*')
                    .eq('auth_id', user.id)
                    .maybeSingle();
                
                if (candError) throw candError;
                
                if (candData) {
                    setCandidato(candData);
                    setFormData({
                        nombre_completo: candData.nombre_completo || '',
                        titulo_profesional: candData.titulo_profesional || '',
                        anios_experiencia: candData.anios_experiencia || 0,
                        sobre_mi: candData.sobre_mi || ''
                    });
                    
                    // Fetch skills
                    // Try to fetch from candidato_skills with inner join on diccionario_skills
                    const { data: skillsData, error: skillsError } = await supabase
                        .from('candidato_skills')
                        .select(`
                            skill_id,
                            nivel_estimado,
                            nombre_original,
                            diccionario_skills ( concept_uri, nombre_skill )
                        `)
                        .eq('candidato_id', candData.id);
                        
                    if (!skillsError && skillsData) {
                        setSkills(skillsData);
                    } else {
                        console.warn("Error buscando skills con relaciones ESCO:", skillsError);
                        // Fallback absoluto por si falla la relación de FK con diccionario
                        const { data: altSkillsData } = await supabase
                            .from('candidato_skills')
                            .select(`
                                skill_id,
                                nivel_estimado,
                                nombre_original
                            `)
                            .eq('candidato_id', candData.id);
                        if (altSkillsData) setSkills(altSkillsData);
                    }
                }
            } catch (err) {
                console.error("Error al obtener perfil", err);
                setError("No se pudo cargar la información del perfil.");
            } finally {
                setLoading(false);
            }
        };

        fetchPerfil();
    }, [user, navigate]);

    const handleDeleteSkill = async (skillId) => {
        if (!candidato) return;
        try {
            const { error } = await supabase
                .from('candidato_skills')
                .delete()
                .eq('candidato_id', candidato.id)
                .eq('skill_id', skillId);
            
            if (error) throw error;
            
            setSkills(skills.filter(s => s.skill_id !== skillId));
            setSuccessMessage("Habilidad eliminada correctamente");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error eliminando skill", err);
            setError("No se pudo eliminar la habilidad.");
        }
    };

    const handleDeleteAccount = async () => {
        const confirmar = window.confirm("¿Estás seguro/a de que quieres borrar tu perfil permanentemente? Perderás todos tus datos, postulaciones y habilidades al instante. Esta acción NO se puede deshacer.");
        if (!confirmar) return;
        
        try {
            setGuardando(true);
            const { error } = await supabase.rpc('delete_user_account');
            if (error) throw error;
            
            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (err) {
            console.error("Error borrando cuenta", err);
            setError("No se pudo borrar la cuenta. Asegúrate de haber ejecutado el script SQL en Supabase.");
            setGuardando(false);
        }
    };

    const handleAddSkill = async () => {
        if (!newSkillName.trim() || !candidato) return;
        setAddingSkill(true);
        setError(null);
        
        try {
            const val = newSkillName.trim();
            const { data: matchedSkills, error: rpcError } = await supabase
                .rpc('match_skills', { skill_names: [val] });
                
            if (rpcError) throw new Error("Error consultando la base de habilidades");
            
            let skillId;
            let finalName = val;
            
            const validMatch = (matchedSkills || []).find(m => m.similitud > 0.65);
            
            if (validMatch) {
                skillId = validMatch.esco_id;
                finalName = validMatch.original_skill; // Usar el nombre encontrado como base
            } else {
                // Agregar al diccionario si no existe
                const { data: nuevaSkill, error: insertError } = await supabase
                    .from('diccionario_skills')
                    .insert({ nombre_skill: val, tipo: 'Personalizado' })
                    .select('id, nombre_skill')
                    .single();
                    
                if (insertError) throw new Error("Error agregando nueva habilidad al diccionario");
                skillId = nuevaSkill.id;
            }

            // Chequeo de duplicados local
            if (skills.some(s => s.skill_id === skillId)) {
                setError("Ya tienes agregada esta habilidad técnica en tu perfil.");
                setAddingSkill(false);
                return;
            }

            // Insertar relación con el candidato
            const { error: relError } = await supabase
                .from('candidato_skills')
                .upsert({
                    candidato_id: candidato.id,
                    skill_id: skillId,
                    nivel_estimado: newSkillLevel,
                    nombre_original: val
                });
                
            if (relError) throw new Error("Error guardando la habilidad en tu perfil");

            // Actualizar estado local UI
            setSkills([...skills, {
                skill_id: skillId,
                nivel_estimado: newSkillLevel,
                nombre_original: val,
                diccionario_skills: { nombre_skill: val } // visual mock prevent reload
            }]);

            setNewSkillName('');
            setNewSkillLevel(3);
            setSuccessMessage("Habilidad agregada a tu perfil.");
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (err) {
            console.error("Error agregando skill", err);
            setError(err.message);
        } finally {
            setAddingSkill(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSave = async () => {
        setGuardando(true);
        setError(null);
        setSuccessMessage('');
        
        try {
            let finalFotoUrl = candidato?.foto_url;

            if (fotoFile) {
                const formData = new FormData();
                formData.append('image', fotoFile);
                formData.append('auth_id', user.id);
                formData.append('role', 'candidato');

                const { data: { session } } = await supabase.auth.getSession();
                
                const upRes = await fetch("http://localhost:3000/api/upload-image", {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                    body: formData
                });
                
                if (!upRes.ok) {
                    const err = await upRes.json().catch(()=>({}));
                    throw new Error(err.error || "Error al subir foto de perfil");
                }
                const upData = await upRes.json();
                finalFotoUrl = upData.publicUrl;
            }

            const { error: updateError } = await supabase
                .from('candidatos')
                .update({
                    nombre_completo: formData.nombre_completo,
                    titulo_profesional: formData.titulo_profesional,
                    anios_experiencia: formData.anios_experiencia,
                    sobre_mi: formData.sobre_mi,
                    foto_url: finalFotoUrl
                })
                .eq('auth_id', user.id);
                
            if (updateError) throw updateError;
            
            setCandidato({
                ...candidato,
                ...formData,
                foto_url: finalFotoUrl
            });
            setEditMode(false);
            setSuccessMessage("¡Perfil actualizado con éxito!");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error al guardar:", err);
            setError(err.message || "Error al guardar los cambios.");
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return (
            <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Cargando tu perfil mágico...</div>
            </div>
        );
    }

    return (
        <div className="register-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Link to="/" className="back-link" style={{ top: '2rem', left: '2rem' }}>
                &larr; Volver al inicio
            </Link>

            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '1000px', 
                backgroundColor: 'var(--bg-white)', 
                borderRadius: '24px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                padding: '4rem',
                border: '1px solid rgba(0,214,107,0.1)',
                zIndex: 1,
                marginTop: '4rem',
                marginBottom: '4rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '2px solid rgba(0,214,107,0.1)', paddingBottom: '1.5rem' }}>
                    <h2 className="brand-title" style={{ fontSize: '2.5rem', margin: 0 }}>Mi Perfil</h2>
                    {candidato && (
                        !editMode ? (
                            <button 
                                onClick={() => setEditMode(true)}
                                className="submit-btn"
                                style={{ padding: '10px 20px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', boxShadow: 'none' }}
                            >
                                <Edit2 size={18} /> Editar Perfil
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => setEditMode(false)}
                                    style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--text-gray)', color: 'var(--text-gray)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}
                                >
                                    <X size={18} /> Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={guardando}
                                    className="submit-btn"
                                    style={{ padding: '10px 20px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', boxShadow: '0 5px 15px rgba(0,214,107,0.2)' }}
                                >
                                    <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        )
                    )}
                </div>

                {successMessage && (
                    <div style={{ background: 'rgba(0,214,107,0.1)', color: 'var(--primary)', padding: '15px', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
                        {successMessage}
                    </div>
                )}
                
                {error && (
                    <div className="message error" style={{ borderRadius: '12px', marginBottom: '2rem' }}>
                        {error}
                    </div>
                )}

                {!candidato ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3 style={{ color: 'var(--text-dark)', marginBottom: '1rem' }}>¡Aún no has completado tu perfil mágico!</h3>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem', fontSize: '1.1rem' }}>Sube tu CV para que nuestra IA extraiga todos tus datos y te conecte con las mejores empresas.</p>
                        <button 
                            onClick={() => navigate('/perfil')}
                            className="submit-btn"
                            style={{ display: 'inline-flex', width: 'auto', padding: '15px 30px', fontSize: '1.2rem', boxShadow: '0 8px 25px rgba(0,214,107,0.25)' }}
                        >
                            Cargar mi CV ahora
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        
                        <div style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#b28900', padding: '15px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                            <BrainCircuit size={20} />
                            <strong>Aviso Importante:</strong> Tu perfil fue completado y estructurado con asistencia de Inteligencia Artificial. Por favor, verifica tus datos regularmente para evitar errores técnicos de interpretación o inferencia.
                        </div>

                        {/* Fila Principal: Datos Generales */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            {/* Información Básica */}
                            <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', margin: 0, fontSize: '1.3rem' }}>
                                        <User size={24} /> Datos Personales
                                    </h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0', border: '3px solid var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                                        }}>
                                            {fotoPreview ? (
                                                <img src={fotoPreview} alt="Foto Prev" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : candidato.foto_url ? (
                                                <img src={candidato.foto_url} alt="Mi Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={40} color="#999" />
                                            )}
                                        </div>
                                        {editMode && (
                                            <div style={{ marginTop: '8px', textAlign: 'center' }}>
                                                <label style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    Cambiar Foto
                                                    <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFotoChange} style={{ display: 'none' }} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Nombre Completo</label>
                                        {editMode ? (
                                            <input 
                                                type="text" maxLength={200}
                                                name="nombre_completo" 
                                                value={formData.nombre_completo} 
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            <div style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '1.1rem' }}>{candidato.nombre_completo || 'No especificado'}</div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Profesión</label>
                                        {editMode ? (
                                            <input 
                                                type="text" maxLength={200}
                                                name="titulo_profesional" 
                                                value={formData.titulo_profesional} 
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            <div style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Briefcase size={18} color="var(--primary)" /> {candidato.titulo_profesional || 'No especificado'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Experiencia y CV */}
                            <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                                    <Clock size={24} /> Experiencia y CV
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Años de Experiencia</label>
                                        {editMode ? (
                                            <input 
                                                type="number" 
                                                name="anios_experiencia" 
                                                value={formData.anios_experiencia} 
                                                onChange={handleInputChange}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            <div style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '1.1rem' }}>{candidato.anios_experiencia} años</div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Currículum Vitae</label>
                                        {candidato.cv_url ? (
                                            <div 
                                                onClick={async () => {
                                                    try {
                                                        const { data, error } = await supabase.storage.from('cv_files').download(candidato.cv_url);
                                                        if (error) throw error;
                                                        const url = URL.createObjectURL(data);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = candidato.cv_url.split('/').pop() || 'curriculum.pdf';
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error('Error al descargar CV:', err);
                                                        alert("No se pudo descargar el archivo.");
                                                    }
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,214,107,0.05)', padding: '12px 15px', borderRadius: '10px', border: '1px dashed var(--primary)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,214,107,0.1)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'rgba(0,214,107,0.05)'}
                                                title="Descargar mi CV"
                                            >
                                                <FileText size={20} color="var(--primary)" />
                                                <span style={{ fontWeight: '500', color: 'var(--text-dark)' }}>
                                                    {(() => {
                                                        const filename = candidato.cv_url.split('/').pop();
                                                        const parts = filename.split('_');
                                                        return (parts.length >= 3 && parts[0] === 'cv') ? parts.slice(2).join('_') : filename;
                                                    })()}
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f5f5f5', padding: '12px 15px', borderRadius: '10px', border: '1px dashed #ccc' }}>
                                                <FileText size={20} color="#999" />
                                                <span style={{ fontWeight: '500', color: '#999' }}>Ningún CV cargado</span>
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '8px' }}>
                                            <Link to="/perfil" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>{candidato.cv_url ? '¿Quieres re-analizar un nuevo CV?' : 'Subir y analizar tu CV ahora'}</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fila Secundaria: Sobre Mí */}
                        <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                                <User size={24} /> Sobre Mí
                            </h3>
                            
                            {editMode ? (
                                <textarea 
                                    name="sobre_mi" maxLength={3000}
                                    value={formData.sobre_mi} 
                                    onChange={handleInputChange}
                                    placeholder="Cuenta un poco más sobre ti, tu historia y lo que buscas..."
                                    style={{ width: '100%', padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(0,214,107,0.3)', resize: 'vertical', fontFamily: 'inherit', fontSize: '1.05rem', boxSizing: 'border-box', minHeight: '120px', outline: 'none' }}
                                ></textarea>
                            ) : (
                                <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', lineHeight: '1.7', margin: 0 }}>
                                    {candidato.sobre_mi ? candidato.sobre_mi : <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No has añadido una descripción personal aún...</span>}
                                </p>
                            )}
                        </div>

                        {/* Fila Terciaria: Skills */}
                        <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', margin: 0, fontSize: '1.3rem' }}>
                                    <BrainCircuit size={24} /> Mis Habilidades (ESCO)
                                </h3>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)', background: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                                    Extraídas o Agregadas Manualmente
                                </span>
                            </div>
                            
                            {editMode && (
                                <div style={{ marginBottom: '2rem', background: '#F0F9F4', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0,214,107,0.2)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-dark)' }}>Agregar Nueva Habilidad</h4>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div style={{ flex: '2 1 200px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Ej. MongoDB, Docker, Inglés Bilingüe..." 
                                                value={newSkillName}
                                                onChange={e => setNewSkillName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                                maxLength={100}
                                                style={{ width: '100%', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '1rem', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label style={{ color: 'var(--text-gray)', fontSize: '0.9rem', fontWeight: 'bold' }}>Nivel (1-5)</label>
                                            <select 
                                                value={newSkillLevel}
                                                onChange={e => setNewSkillLevel(parseInt(e.target.value))}
                                                style={{ padding: '12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '1rem', outline: 'none', background: 'white' }}
                                            >
                                                <option value={1}>1 - Básico</option>
                                                <option value={2}>2 - Junior</option>
                                                <option value={3}>3 - Intermedio</option>
                                                <option value={4}>4 - Avanzado</option>
                                                <option value={5}>5 - Experto</option>
                                            </select>
                                        </div>
                                        <div>
                                            <button 
                                                onClick={handleAddSkill}
                                                disabled={addingSkill || !newSkillName.trim()}
                                                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,214,107,0.2)' }}
                                            >
                                                {addingSkill ? 'Agregando...' : 'Añadir'}
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#666' }}>Las habilidades ingresadas son pasadas por el escáner universal para buscar sinónimos o crear nuevas categorías de ser necesario.</p>
                                </div>
                            )}

                            {skills.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {skills.map((skillItem, index) => {
                                        // Handle different possible dictionary formats
                                        const skillName = skillItem.nombre_original 
                                                         || skillItem.diccionario_skills?.preferred_label 
                                                         || skillItem.diccionario_skills?.nombre_skill 
                                                         || skillItem.diccionario_skills?.nombre
                                                         || "Habilidad Desconocida";
                                        
                                        return (
                                            <span key={index} style={{
                                                backgroundColor: 'white',
                                                padding: editMode ? '10px 10px 10px 18px' : '10px 18px',
                                                borderRadius: '30px',
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                color: 'var(--primary)',
                                                border: '1px solid rgba(0,214,107,0.3)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                transition: 'transform 0.2s',
                                                cursor: 'default'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                {skillName}
                                                <span style={{
                                                    backgroundColor: 'var(--primary)', 
                                                    color: 'white', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Lvl {skillItem.nivel_estimado}
                                                </span>
                                                {editMode && (
                                                    <button 
                                                        onClick={() => handleDeleteSkill(skillItem.skill_id)}
                                                        title="Descartar Habilidad"
                                                        style={{ background: 'rgba(255,0,0,0.1)', color: 'red', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginLeft: '5px' }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-gray)', fontSize: '1.05rem', fontStyle: 'italic' }}>
                                    No se encontraron habilidades en tu perfil. Agrega habilidades activando el Modo Edición.
                                </p>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div style={{ marginTop: '2rem', background: '#fff0f0', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,0,0,0.2)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d32f2f', margin: '0 0 1rem 0', fontSize: '1.3rem' }}>
                                <Trash2 size={24} /> Zona de Peligro
                            </h3>
                            <p style={{ color: '#5f2120', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Tienes derecho a eliminar permanentemente tus datos de nuestros sistemas en cualquier momento. Al hacer click en el botón inferior perderás inmediatamente tu cuenta, y todo el progreso y postulaciones que hayas conseguido.
                            </p>
                            <button 
                                onClick={handleDeleteAccount}
                                disabled={guardando}
                                style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '15px 25px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(211,47,47,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Trash2 size={20} /> Cerrar y Borrar Cuenta Permanentemente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
