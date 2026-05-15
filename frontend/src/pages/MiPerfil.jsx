import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { User, Briefcase, Clock, FileText, Edit2, Save, X, BrainCircuit, Trash2, PlusCircle, Award } from 'lucide-react';
import './Register.css'; // Reusing established styles

export default function MiPerfil() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [candidato, setCandidato] = useState(null);
    const [skills, setSkills] = useState([]);
    const [insignias, setInsignias] = useState([]);
    
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

    // Agregar skill manualmente
    const [newSkillInput, setNewSkillInput] = useState('');
    const [newSkillNivel, setNewSkillNivel] = useState(3);
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

                    // Fetch insignias
                    const { data: insigniasData } = await supabase
                        .from('candidato_insignias')
                        .select('insignias(nombre)')
                        .eq('candidato_id', candData.id);
                    if (insigniasData) {
                        setInsignias(insigniasData.map(i => i.insignias.nombre));
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

    const handleAddSkill = async () => {
        if (!candidato || !newSkillInput.trim()) return;
        setAddingSkill(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('candidato_skills')
                .insert([{
                    candidato_id: candidato.id,
                    nombre_original: newSkillInput.trim(),
                    nivel_estimado: newSkillNivel
                }])
                .select()
                .single();
                
            if (error) throw error;
            
            setSkills([...skills, data]);
            setNewSkillInput('');
            setSuccessMessage("Habilidad agregada correctamente");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error agregando skill", err);
            setError("No se pudo agregar la habilidad.");
        } finally {
            setAddingSkill(false);
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
                
                const upRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/upload-image`, {
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
                            


                            {skills.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: editMode ? '1.5rem' : 0 }}>
                                    {skills.map((skillItem, index) => {
                                        const skillName = skillItem.nombre_original 
                                                         || skillItem.diccionario_skills?.nombre_skill 
                                                         || 'Habilidad Desconocida';
                                        return (
                                            <span key={index} style={{
                                                backgroundColor: 'white',
                                                padding: editMode ? '8px 10px 8px 16px' : '10px 18px',
                                                borderRadius: '30px',
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                color: 'var(--primary)',
                                                border: '1px solid rgba(0,214,107,0.3)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
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
                                                {insignias.includes(skillName) ? (
                                                    <Award size={18} color="#FFD700" title="Habilidad Validada" style={{ filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))' }} />
                                                ) : (
                                                    !editMode && <Link to={`/quiz/${encodeURIComponent(skillName)}`} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline', marginLeft: '4px' }}>Validar</Link>
                                                )}
                                                {editMode && (
                                                    <button 
                                                        onClick={() => handleDeleteSkill(skillItem.skill_id)}
                                                        title="Eliminar habilidad"
                                                        style={{ background: 'rgba(255,0,0,0.08)', color: '#d32f2f', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-gray)', fontSize: '1.05rem', fontStyle: 'italic', marginBottom: editMode ? '1.5rem' : 0 }}>
                                    No se encontraron habilidades. Asegúrate de haber completado la carga de CV o agrega una manualmente.
                                </p>
                            )}

                            {/* Formulario para agregar skill (solo en editMode) */}
                            {editMode && (
                                <div style={{ borderTop: skills.length > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none', paddingTop: skills.length > 0 ? '1.5rem' : 0 }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginBottom: '10px', fontWeight: '600' }}>Agregar habilidad manualmente:</p>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={newSkillInput}
                                            onChange={e => setNewSkillInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                            placeholder="Ej: React, SQL, Docker..."
                                            maxLength={100}
                                            style={{ flex: '1', minWidth: '180px', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                        <select
                                            value={newSkillNivel}
                                            onChange={e => setNewSkillNivel(Number(e.target.value))}
                                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem', outline: 'none', background: 'white', cursor: 'pointer' }}
                                        >
                                            <option value={1}>Nivel 1 — Básico</option>
                                            <option value={2}>Nivel 2 — Elemental</option>
                                            <option value={3}>Nivel 3 — Intermedio</option>
                                            <option value={4}>Nivel 4 — Avanzado</option>
                                            <option value={5}>Nivel 5 — Experto</option>
                                        </select>
                                        <button
                                            onClick={handleAddSkill}
                                            disabled={addingSkill || !newSkillInput.trim()}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '10px 18px', borderRadius: '10px', border: 'none',
                                                background: 'var(--primary)', color: 'white',
                                                fontWeight: 'bold', fontSize: '0.95rem',
                                                cursor: addingSkill || !newSkillInput.trim() ? 'not-allowed' : 'pointer',
                                                opacity: addingSkill || !newSkillInput.trim() ? 0.6 : 1,
                                                transition: 'opacity 0.2s'
                                            }}
                                        >
                                            <PlusCircle size={18} /> {addingSkill ? 'Agregando...' : 'Agregar'}
                                        </button>
                                    </div>
                                </div>
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
