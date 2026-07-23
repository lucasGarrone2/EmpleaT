import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';
import { User, Briefcase, Clock, FileText, Edit2, Save, X, BrainCircuit, Trash2, PlusCircle, Award, Calendar, ExternalLink, Lock, Sparkles, PartyPopper, Check, Crown } from 'lucide-react';
import './Register.css'; // Reusing established styles

export default function MiPerfil() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const showAlert = useAlert();

    const [loading, setLoading] = useState(true);
    const [candidato, setCandidato] = useState(null);
    const [skills, setSkills] = useState([]);
    const [insignias, setInsignias] = useState([]);
    const [postulaciones, setPostulaciones] = useState([]);
    const [quizIntentos, setQuizIntentos] = useState([]);

    const getSkillCooldown = (skillName) => {
        if (!quizIntentos || quizIntentos.length === 0) return null;
        const skillAttempts = quizIntentos.filter(i => i.skill_nombre && i.skill_nombre.toLowerCase() === skillName.toLowerCase());
        if (skillAttempts.length === 0) return null;

        // Get the latest attempt
        const latestAttempt = skillAttempts[0];
        const msSinceAttempt = Date.now() - new Date(latestAttempt.fecha_intento).getTime();
        const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

        if (msSinceAttempt < COOLDOWN_MS) {
            const remainingHours = Math.ceil((COOLDOWN_MS - msSinceAttempt) / (1000 * 60 * 60));
            return remainingHours;
        }
        return null;
    };

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        titulo_profesional: '',
        anios_experiencia: 0,
        sobre_mi: '',
        disponible_busqueda: false
    });

    const [guardando, setGuardando] = useState(false);
    const [generatingBio, setGeneratingBio] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

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
                        sobre_mi: candData.sobre_mi || '',
                        disponible_busqueda: candData.disponible_busqueda || false
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
                        const validInsignias = insigniasData
                            .map(i => i.insignias?.nombre)
                            .filter(Boolean);
                        setInsignias(validInsignias);
                    }

                    // Fetch applications (postulaciones) with ATS stages in real time
                    const { data: postData, error: postError } = await supabase
                        .from('postulaciones')
                        .select(`
                            id,
                            estado,
                            fecha_postulacion,
                            ofertas (
                                id,
                                titulo,
                                empresas (
                                    razon_social,
                                    sitio_web
                                )
                            )
                        `)
                        .eq('candidato_id', candData.id)
                        .order('fecha_postulacion', { ascending: false });

                    if (!postError && postData) {
                        setPostulaciones(postData);
                    } else if (postError) {
                        console.error("Error fetching postulaciones", postError);
                    }

                    // Fetch quiz attempts to verify cooldowns
                    const { data: intentosData } = await supabase
                        .from('quiz_intentos')
                        .select('skill_nombre, fecha_intento, finalizado, aprobado')
                        .eq('candidato_id', candData.id)
                        .order('fecha_intento', { ascending: false });

                    if (intentosData) {
                        setQuizIntentos(intentosData);
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
            const trimmedSkillName = newSkillInput.trim();

            // 1. Buscar si la habilidad ya existe en el diccionario_skills (insensible a mayúsculas/minúsculas)
            const { data: existingSkill, error: findError } = await supabase
                .from('diccionario_skills')
                .select('id, nombre_skill')
                .ilike('nombre_skill', trimmedSkillName)
                .maybeSingle();

            if (findError) throw findError;

            let skillId;

            if (!existingSkill) {
                // 2. Si no existe en el diccionario, la registramos como una habilidad personalizada
                const { data: newSkill, error: insertError } = await supabase
                    .from('diccionario_skills')
                    .insert([{
                        nombre_skill: trimmedSkillName,
                        tipo: 'Personalizado'
                    }])
                    .select('id')
                    .single();

                if (insertError) throw insertError;
                skillId = newSkill.id;
            } else {
                skillId = existingSkill.id;
            }

            // 3. Relacionar la habilidad con el candidato en candidato_skills usando upsert
            const { data, error } = await supabase
                .from('candidato_skills')
                .upsert([{
                    candidato_id: candidato.id,
                    skill_id: skillId,
                    nombre_original: trimmedSkillName,
                    nivel_estimado: newSkillNivel
                }], { onConflict: 'candidato_id, skill_id' })
                .select()
                .single();

            if (error) throw error;

            // Reemplazar o agregar la skill en el estado local de React
            const updatedSkills = skills.filter(s => s.skill_id !== skillId);
            setSkills([...updatedSkills, data]);
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

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const ejecutarEliminacionCuenta = async () => {
        setShowDeleteModal(false);
        try {
            setGuardando(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa");

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/account/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "No se pudo borrar la cuenta.");
            }

            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (err) {
            console.error("Error borrando cuenta", err);
            setError(err.message || "No se pudo borrar la cuenta.");
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

    const handleGenerateBio = async () => {
        if (!candidato) return;
        setGeneratingBio(true);
        setError(null);
        setSuccessMessage('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa");

            const skillsText = skills.map(s => s.nombre_original || s.diccionario_skills?.nombre_skill || '').filter(Boolean).join(', ');

            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/generate-bio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ skillsText })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Error al generar biografía con IA.");
            }

            const data = await response.json();
            if (data.success && data.bio) {
                setFormData(prev => ({
                    ...prev,
                    sobre_mi: data.bio
                }));
                setSuccessMessage("¡Biografía generada con IA! Recuerda guardar los cambios.");
                setTimeout(() => setSuccessMessage(''), 4000);
            }
        } catch (err) {
            console.error("Error al generar bio con IA:", err);
            setError(err.message || "No se pudo generar la biografía con IA.");
        } finally {
            setGeneratingBio(false);
        }
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

                const upRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/upload-image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                    body: formData
                });

                if (!upRes.ok) {
                    const err = await upRes.json().catch(() => ({}));
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
                    foto_url: finalFotoUrl,
                    disponible_busqueda: formData.disponible_busqueda
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

    const handleToggleBusqueda = async () => {
        if (!candidato) return;
        const nuevoValor = !candidato.disponible_busqueda;
        // Optimistic update
        setCandidato(prev => ({ ...prev, disponible_busqueda: nuevoValor }));
        setFormData(prev => ({ ...prev, disponible_busqueda: nuevoValor }));
        try {
            const { error: updateError } = await supabase
                .from('candidatos')
                .update({ disponible_busqueda: nuevoValor })
                .eq('auth_id', user.id);
            if (updateError) throw updateError;
        } catch (err) {
            // Revert on error
            setCandidato(prev => ({ ...prev, disponible_busqueda: !nuevoValor }));
            setFormData(prev => ({ ...prev, disponible_busqueda: !nuevoValor }));
            console.error('Error al cambiar visibilidad:', err);
            showAlert('No se pudo actualizar tu visibilidad. Intentá de nuevo.', 'Error', 'error');
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

            <div className="profile-card-container" style={{
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

                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '0.6rem' }}>Búsqueda de Talento (Opt-in)</label>
                                        <button
                                            onClick={handleToggleBusqueda}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                padding: 0
                                            }}
                                            title={candidato.disponible_busqueda ? 'Haz clic para desactivar la visibilidad' : 'Haz clic para activar la visibilidad'}
                                        >
                                            {/* Toggle track */}
                                            <span style={{
                                                position: 'relative',
                                                display: 'inline-flex',
                                                width: '46px', height: '26px',
                                                borderRadius: '13px',
                                                background: candidato.disponible_busqueda ? 'var(--primary)' : '#cbd5e1',
                                                transition: 'background 0.2s',
                                                flexShrink: 0
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '3px',
                                                    left: candidato.disponible_busqueda ? '23px' : '3px',
                                                    width: '20px', height: '20px',
                                                    borderRadius: '50%',
                                                    background: 'white',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                                    transition: 'left 0.2s'
                                                }} />
                                            </span>
                                            <span style={{
                                                fontWeight: '600',
                                                color: candidato.disponible_busqueda ? 'var(--primary)' : '#94a3b8',
                                                fontSize: '0.95rem',
                                                transition: 'color 0.2s'
                                            }}>
                                                {candidato.disponible_busqueda
                                                    ? 'Visible para empresas'
                                                    : 'No visible en búsquedas'}
                                            </span>
                                        </button>
                                        <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                                            Permití que empresas premium te encuentren en búsquedas avanzadas.
                                        </p>
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
                                                        showAlert("No se pudo descargar el archivo.", "Error", "error");
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', margin: 0, fontSize: '1.3rem' }}>
                                    <User size={24} /> Sobre Mí
                                </h3>
                                {editMode && (
                                    candidato?.es_premium ? (
                                        <button
                                            type="button"
                                            onClick={handleGenerateBio}
                                            disabled={generatingBio}
                                            style={{
                                                background: 'linear-gradient(135deg, #00d66b 0%, #00b359 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 10px rgba(0,214,107,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            {generatingBio ? 'Generando...' : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    Generar Bio con IA <Sparkles size={16} />
                                                </span>
                                            )}
                                        </button>
                                    ) : (
                                        <Link
                                            to="/pricing"
                                            style={{
                                                background: '#f1f5f9',
                                                color: '#64748b',
                                                border: '1px solid #cbd5e1',
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            Generar Bio con IA (Premium 👑)
                                        </Link>
                                    )
                                )}
                            </div>

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

                        {/* Fila Terciaria: Habilidades */}
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
                                                {insignias.some(ins => 
                                                    ins.toLowerCase() === skillName.toLowerCase() ||
                                                    ins.toLowerCase() === (skillItem.nombre_original || '').toLowerCase() ||
                                                    ins.toLowerCase() === (skillItem.diccionario_skills?.nombre_skill || '').toLowerCase()
                                                ) ? (
                                                    <Award size={18} color="#FFD700" title="Habilidad Validada" style={{ filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))' }} />
                                                ) : (
                                                    !editMode && (() => {
                                                        const cooldownHours = getSkillCooldown(skillName);
                                                        if (cooldownHours !== null) {
                                                            return (
                                                                <span style={{
                                                                    fontSize: '0.85rem',
                                                                    color: '#d32f2f',
                                                                    marginLeft: '4px',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'not-allowed',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '2px'
                                                                }} title={`Debes esperar ${cooldownHours}h para reintentar`}>
                                                                    <Lock size={12} /> Bloqueado ({cooldownHours}h)
                                                                </span>
                                                            );
                                                        }
                                                        return <Link to={`/quiz/${encodeURIComponent(skillName)}`} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline', marginLeft: '4px' }}>Validar</Link>;
                                                    })()
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

                        {/* SECCIÓN NUEVA Y PREMIUM: Mis Postulaciones (Tablero ATS y Progreso) */}
                        <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                                <Briefcase size={24} /> Mis Postulaciones
                            </h3>

                            {postulaciones.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {postulaciones.map((post) => {
                                        const oferta = post.ofertas;
                                        const empresa = oferta?.empresas;
                                        const normalized = post.estado?.toLowerCase() || 'postulado';

                                        const isEnRevisionOrHigher = ['en_revision', 'en revisión', 'en revision', 'entrevista', 'seleccionado', 'contratado'].includes(normalized);
                                        const isEntrevistaOrHigher = ['entrevista', 'seleccionado', 'contratado'].includes(normalized);

                                        return (
                                            <div key={post.id} style={{
                                                background: 'rgba(0,214,107,0.01)',
                                                border: '1px solid rgba(0,214,107,0.1)',
                                                borderRadius: '16px',
                                                padding: '1.8rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1.5rem',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                                            }}>
                                                {/* Encabezado de la postulación */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'var(--text-dark)' }}>{oferta?.titulo}</h4>
                                                        <div style={{ color: 'var(--text-gray)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ fontWeight: '600' }}>{empresa?.razon_social || 'Empresa Privada'}</span>
                                                            {empresa?.sitio_web && (
                                                                <a href={empresa.sitio_web.startsWith('http') ? empresa.sitio_web : `https://${empresa.sitio_web}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--primary)', textDecoration: 'none' }}>
                                                                    Sitio Web <ExternalLink size={12} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                                        {(() => {
                                                            if (normalized === 'en_revision' || normalized === 'en revisión' || normalized === 'en revision') return <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#b45309', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>CV Visto / En Revisión</span>;
                                                            if (normalized === 'entrevista') return <span style={{ padding: '4px 12px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>En Entrevista</span>;
                                                            if (normalized === 'seleccionado' || normalized === 'contratado') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>¡Seleccionado! <PartyPopper size={12} /></span>;
                                                            if (normalized === 'rechazado') return <span style={{ padding: '4px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Proceso Finalizado</span>;
                                                            return <span style={{ padding: '4px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Enviado</span>;
                                                        })()}
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={12} /> Postulado el {new Date(post.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* ATS Horizontal Timeline (Stepper) */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.2rem', position: 'relative', padding: '0 1rem' }}>
                                                    {/* Connecting Line */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '15px',
                                                        left: '8%',
                                                        right: '8%',
                                                        height: '4px',
                                                        background: '#e2e8f0',
                                                        zIndex: 0
                                                    }}></div>
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '15px',
                                                        left: '8%',
                                                        width: (normalized === 'seleccionado' || normalized === 'contratado') ? '84%' : normalized === 'entrevista' ? '56%' : isEnRevisionOrHigher ? '28%' : '0%',
                                                        height: '4px',
                                                        background: normalized === 'rechazado' ? '#ef4444' : 'var(--primary)',
                                                        zIndex: 0,
                                                        transition: 'width 0.4s ease'
                                                    }}></div>

                                                    {/* Step 1: Postulado */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: normalized === 'rechazado' ? '#fee2e2' : 'var(--primary)',
                                                            color: normalized === 'rechazado' ? '#b91c1c' : 'white',
                                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                            fontWeight: 'bold', fontSize: '0.85rem', border: '3px solid white',
                                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                        }}><Check size={14} /></div>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px' }}>Enviado</span>
                                                    </div>

                                                    {/* Step 2: CV Visto */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: normalized === 'rechazado' ? '#fee2e2' : isEnRevisionOrHigher ? 'var(--primary)' : '#e2e8f0',
                                                            color: normalized === 'rechazado' ? '#b91c1c' : isEnRevisionOrHigher ? 'white' : '#64748b',
                                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                            fontWeight: 'bold', fontSize: '0.85rem', border: '3px solid white',
                                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                        }}>{normalized === 'rechazado' ? <X size={14} /> : isEnRevisionOrHigher ? <Check size={14} /> : '2'}</div>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: isEnRevisionOrHigher ? 'bold' : '500', color: isEnRevisionOrHigher ? 'var(--text-dark)' : 'var(--text-gray)', marginTop: '6px' }}>
                                                            {normalized === 'rechazado' ? 'Finalizado' : 'CV Visto'}
                                                        </span>
                                                    </div>

                                                    {/* Step 3: Entrevista */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: normalized === 'rechazado' ? '#fee2e2' : isEntrevistaOrHigher ? 'var(--primary)' : '#e2e8f0',
                                                            color: normalized === 'rechazado' ? '#b91c1c' : isEntrevistaOrHigher ? 'white' : '#64748b',
                                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                            fontWeight: 'bold', fontSize: '0.85rem', border: '3px solid white',
                                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                        }}>{normalized === 'rechazado' ? <X size={14} /> : isEntrevistaOrHigher ? <Check size={14} /> : '3'}</div>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: isEntrevistaOrHigher ? 'bold' : '500', color: isEntrevistaOrHigher ? 'var(--text-dark)' : 'var(--text-gray)', marginTop: '6px' }}>Entrevista</span>
                                                    </div>

                                                    {/* Step 4: Seleccionado */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: (normalized === 'seleccionado' || normalized === 'contratado') ? '#22c55e' : normalized === 'rechazado' ? '#fee2e2' : '#e2e8f0',
                                                            color: (normalized === 'seleccionado' || normalized === 'contratado') ? 'white' : normalized === 'rechazado' ? '#b91c1c' : '#64748b',
                                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                            fontWeight: 'bold', fontSize: '0.85rem', border: '3px solid white',
                                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                        }}>{(normalized === 'seleccionado' || normalized === 'contratado') ? <PartyPopper size={14} /> : normalized === 'rechazado' ? <X size={14} /> : '4'}</div>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: (normalized === 'seleccionado' || normalized === 'contratado') ? 'bold' : '500', color: (normalized === 'seleccionado' || normalized === 'contratado') ? '#166534' : 'var(--text-gray)', marginTop: '6px' }}>Seleccionado</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(0,0,0,0.01)', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                                    <p style={{ color: 'var(--text-gray)', margin: '0 0 1rem 0', fontSize: '1rem', fontStyle: 'italic' }}>
                                        Aún no te has postulado a ninguna oferta de empleo.
                                    </p>
                                    <Link to="/" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                                        🔍 Explorar Ofertas de Empleo y Postularse
                                    </Link>
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

            {/* Modal de Confirmación de Eliminación de Cuenta */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        textAlign: 'center',
                        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <div style={{
                            background: '#FEE2E2',
                            color: '#EF4444',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', color: '#111827', fontWeight: '800', marginBottom: '1rem' }}>
                            ¿Confirmas eliminar tu cuenta?
                        </h3>
                        <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Esta acción eliminará de forma permanente tu perfil, postulaciones, exámenes y **todos tus archivos físicos (CV y fotos)**. Esta operación es irreversible y no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid #D1D5DB',
                                    background: 'white',
                                    color: '#374151',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarEliminacionCuenta}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(239,68,68,0.25)',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                Borrar Todo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
