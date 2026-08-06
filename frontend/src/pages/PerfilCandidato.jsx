import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';
import { Info, FileText, BrainCircuit, Target, X, Edit3, Sparkles, Brain, Cpu, Database, RefreshCw } from 'lucide-react';
import posthog from '../posthog';
import './Register.css';

const loadingIcons = [
    { Icon: FileText },
    { Icon: Brain },
    { Icon: Cpu },
    { Icon: Database },
    { Icon: Sparkles }
];

export default function PerfilCandidato() {
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const [archivoPDF, setArchivoPDF] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [loadingIconIndex, setLoadingIconIndex] = useState(0);

    useEffect(() => {
        let intervalId;
        if (loading) {
            intervalId = setInterval(() => {
                setLoadingIconIndex(prev => (prev + 1) % loadingIcons.length);
            }, 1200);
        } else {
            setLoadingIconIndex(0);
        }
        return () => clearInterval(intervalId);
    }, [loading]);
    const [datosExtraidos, setDatosExtraidos] = useState(null);
    const [pdfPath, setPdfPath] = useState(null);
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [guardadoExito, setGuardadoExito] = useState(false);
    const showAlert = useAlert();

    const handleExtraidoChange = (campo, valor) => {
        setDatosExtraidos({ ...datosExtraidos, [campo]: valor });
    };

    const handleEliminarSkill = (index) => {
        const nuevasSkills = [...datosExtraidos.skills];
        nuevasSkills.splice(index, 1);
        setDatosExtraidos({ ...datosExtraidos, skills: nuevasSkills });
    };

    // Nuevo estado opcional escrito por el usuario
    const [bio, setBio] = useState("");
    const [aceptoTerminos, setAceptoTerminos] = useState(false);
    const [disponibleBusqueda, setDisponibleBusqueda] = useState(true);

    const { user } = useAuth();
    const navigate = useNavigate();

    //Agarrar el archivo cuando lo selecciona el usuario

    const handleArchivoChange = (e) => {
        setArchivoPDF(e.target.files[0]);
        setError(null);
    }

    //Enviar el paquete al back

    const handleSubirCV = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!archivoPDF) {
            setError("Por favor, selecciona un archivo PDF primero");
            return;
        }
        if (!user) {
            setError("Debes iniciar sesión para subir tu CV");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('cv', archivoPDF);
        formData.append('auth_id', user.id);

        try {
            // Obtener token
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("Sesión expirada. Por favor, vuelve a iniciar sesión.");

            // 1. Subir a Supabase Storage y comenzar procesamiento
            setLoadingText("Subiendo PDF...");
            const resUpload = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/upload-cv`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!resUpload.ok) {
                const errData = await resUpload.json().catch(() => ({}));
                throw new Error(errData.error || "Error al subir el CV al servidor");
            }
            
            const uploadJSON = await resUpload.json();
            const jobId = uploadJSON.job_id;

            // 2. Realizar Polling sobre el job para seguir el estado de la extracción con IA
            let jobCompleted = false;
            let jobDetails = null;
            let pollingAttempts = 0;
            const maxAttempts = 40; // 40 * 2.5s = 100s de timeout máximo

            while (!jobCompleted && pollingAttempts < maxAttempts) {
                if (!isMountedRef.current) return;
                pollingAttempts++;
                setLoadingText("Analizando tu CV con Inteligencia Artificial...");
                
                await new Promise(resolve => setTimeout(resolve, 2500));

                if (!isMountedRef.current) return;

                const { data, error: pollError } = await supabase
                    .from('cv_processing_jobs')
                    .select('*')
                    .eq('id', jobId)
                    .single();

                if (!isMountedRef.current) return;

                if (pollError) {
                    console.warn("Error consultando el estado del job (reintentando):", pollError);
                    continue;
                }

                if (data) {
                    if (data.status === 'completado') {
                        jobCompleted = true;
                        jobDetails = data;
                    } else if (data.status === 'fallido') {
                        throw new Error(data.error_message || "La extracción de datos del CV con IA ha fallado.");
                    }
                }
            }

            if (!isMountedRef.current) return;

            if (!jobCompleted) {
                throw new Error("El procesamiento de tu CV está tardando más de lo esperado. Por favor, intenta de nuevo.");
            }

            // Guardar resultados extraídos
            setPdfPath(jobDetails.cv_url);
            setDatosExtraidos(jobDetails.resultado);
            showAlert("¡Tu currículum ha sido procesado con éxito por la IA! Revisa la información extraída abajo antes de guardar.", "¡Procesado!", "success");
        }
        catch (err) {
            if (isMountedRef.current) {
                console.error(err);
                setError(err.message || "Hubo un problema al extraer la informacion");
                showAlert(err.message || "Hubo un problema al extraer la informacion", "Error de Procesamiento", "error");
            }
        }
        finally {
            if (isMountedRef.current) {
                setLoading(false);
                setLoadingText("");
            }
        }
    };

    const sanitizeText = (str) => {
        if (!str) return '';
        return str.replace(/<[^>]*>/g, '');
    };

    const handleGuardarPerfil = async () => {
        if (guardando) return;
        if (!user) {
            setError("Debes iniciar sesión para guardar tu perfil");
            return;
        }

        setGuardando(true);
        setError(null);

        try {
            // Paso A: Crear o Actualizar Candidato (UPSERT)
            const { data: candidatoData, error: candidatoError } = await supabase
                .from('candidatos')
                .upsert({
                    auth_id: user.id,
                    nombre_completo: sanitizeText(datosExtraidos.nombre),
                    titulo_profesional: sanitizeText(datosExtraidos.profesion),
                    anios_experiencia: datosExtraidos.experiencia_anios,
                    sobre_mi: sanitizeText(bio), // Este campo se carga desde el textarea manual
                    email: user.email, // Guardamos el email para contacto del reclutador
                    disponible_busqueda: disponibleBusqueda,
                    ...(pdfPath ? { cv_url: pdfPath } : {})
                }, { onConflict: 'auth_id' })
                .select('id')
                .single();

            if (candidatoError) throw new Error("Error al actualizar candidato: " + candidatoError.message);

            const candidatoId = candidatoData.id;

            // Paso B: Procesar Skills (Migrado a ESCO con Fuzzy Match) - PROCESO POR LOTES (BATCHING)
            const nombresSkillsGemini = Array.isArray(datosExtraidos?.skills) 
                ? datosExtraidos.skills.map(s => s.nombre || '').filter(Boolean) 
                : [];
            let matchedSkills = [];
            const BATCH_SIZE = 5;

            // Procesamos las habilidades en grupos pequeños para evitar el Error 500 / Timeout de Supabase
            for (let i = 0; i < nombresSkillsGemini.length; i += BATCH_SIZE) {
                const batch = nombresSkillsGemini.slice(i, i + BATCH_SIZE);
                const { data: batchResult, error: rpcError } = await supabase
                    .rpc('match_skills', { skill_names: batch });

                if (rpcError) throw new Error(`Error en el emparejamiento ESCO (Lote ${i/BATCH_SIZE + 1}): ` + rpcError.message);
                if (batchResult) matchedSkills = [...matchedSkills, ...batchResult];
            }

            // Siempre eliminamos las skills anteriores del candidato para reflejar el nuevo CV y evitar duplicados
            const { error: deleteError } = await supabase
                .from('candidato_skills')
                .delete()
                .eq('candidato_id', candidatoId);

            if (deleteError) throw new Error("Error limpiando skills anteriores: " + deleteError.message);

            // Filtrar skills válidas (similitud estricta > 0.65 para evitar "versiones" -> "infecciones")
            const validSkills = (matchedSkills || []).filter(m => m.similitud > 0.65);

            const skillsMap = new Map();

            if (validSkills.length > 0) {
                validSkills.forEach(match => {
                    if (!skillsMap.has(match.esco_id)) {
                        const skillExtraida = datosExtraidos.skills.find(s => s.nombre === match.original_skill);
                        skillsMap.set(match.esco_id, {
                            candidato_id: candidatoId,
                            skill_id: match.esco_id,
                            nivel_estimado: skillExtraida ? skillExtraida.nivel : 3,
                            nombre_original: skillExtraida ? skillExtraida.nombre : match.original_skill
                        });
                    }
                });
            }

            // Rescatar las palabras que ESCO no reconoció (ej. frameworks nuevos o "desarrollo web")
            const matchedNamesLower = new Set(validSkills.map(m => m.original_skill.toLowerCase()));
            const unmatchedWords = datosExtraidos.skills.filter(s => !matchedNamesLower.has(s.nombre.toLowerCase()));

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
                        const skillExtraida = unmatchedWords.find(s => s.nombre.toLowerCase() === newSkill.nombre_skill.toLowerCase());
                        skillsMap.set(newSkill.id, {
                            candidato_id: candidatoId,
                            skill_id: newSkill.id,
                            nivel_estimado: skillExtraida ? skillExtraida.nivel : 3,
                            nombre_original: newSkill.nombre_skill
                        });
                    });
                }
            }

            if (skillsMap.size > 0) {
                const candidatoSkillsInsert = Array.from(skillsMap.values());

                // Relacionar candidato con las skills en lote utilizando upsert
                // UPSERT ignora el conflicto de la llave duplicada y en su lugar actualiza la fila existente, previniendo el error fatal.
                const { error: relacionError } = await supabase
                    .from('candidato_skills')
                    .upsert(candidatoSkillsInsert, { onConflict: 'candidato_id, skill_id' });

                if (relacionError) throw new Error("Error guardando relaciones ESCO: " + relacionError.message);
            }

            // Paso C: Exito y redirección
            posthog.capture('candidate_profile_saved', {
                skills_count: datosExtraidos.skills.length,
                available_for_search: disponibleBusqueda,
                cv_attached: Boolean(pdfPath)
            });
            setGuardadoExito(true);
            showAlert("Tu perfil ha sido procesado y guardado correctamente.", "¡Éxito!", "success");
            setTimeout(() => {
                navigate('/ofertas');
            }, 2000);
        } catch (err) {
            console.error("Error guardando perfil:", err);
            setError(err.message);
            showAlert(err.message, "Error al guardar", "error");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="register-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Link to="/" className="back-link" style={{ top: '2rem', left: '2rem' }}>
                &larr; Volver al inicio
            </Link>

            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>

            <div className="profile-card-container" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1200px',
                backgroundColor: 'var(--bg-white)',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                padding: '4rem',
                border: '1px solid rgba(0,214,107,0.1)',
                zIndex: 1,
                marginTop: '4rem',
                marginBottom: '4rem'
            }}>

                {/* 🌟 SECCIÓN SUPERIOR: Info y Subida */}
                <div style={{ display: 'flex', gap: '5rem', alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Columna Izquierda: Explicación */}
                    <div style={{ flex: '1 1 400px' }}>
                        <h2 className="brand-title" style={{ fontSize: '2.8rem', textAlign: 'left', marginBottom: '1.5rem' }}>Tu Perfil Mágico</h2>
                        <p className="form-subtitle" style={{ textAlign: 'left', marginBottom: '3rem', fontSize: '1.2rem', lineHeight: '1.6' }}>
                            Olvídate de los formularios interminables. En <strong>EmpleaT</strong>, nuestra <strong>Inteligencia Artificial</strong> analiza tu currículum en segundos para conectarte con las mejores empresas.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(0,214,107,0.1)', padding: '15px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={38} color="var(--primary)" />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)', fontSize: '1.3rem', display: 'flex', alignItems: 'center' }}>
                                        1. Sube tu Currículum
                                        <span title="Importante: Solo aceptamos formato PDF. Tamaño máximo recomendado: 5MB." style={{ cursor: 'help', display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                                            <Info size={20} color="var(--primary)" />
                                        </span>
                                    </h4>
                                    <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '1.05rem', lineHeight: '1.5' }}>Tu archivo PDF original servirá de fuente. El diseño no importa, buscaremos el contenido de valor.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(0,214,107,0.1)', padding: '15px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BrainCircuit size={38} color="var(--primary)" />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)', fontSize: '1.3rem' }}>2. Extracción IA</h4>
                                    <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '1.05rem', lineHeight: '1.5' }}>Gemini leerá tu historia, detectará tus habilidades comprobables y les asignará automáticamente un nivel de seniority.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(0,214,107,0.1)', padding: '15px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={38} color="var(--primary)" />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)', fontSize: '1.3rem' }}>3. Match Perfecto</h4>
                                    <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '1.05rem', lineHeight: '1.5' }}>Tu perfil quedará estandarizado en la base de datos para que tu talento único resalte frente a las empresas correctas.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Formulario de Carga */}
                    <div style={{ flex: '1 1 400px', background: 'var(--bg-white)', padding: '3.5rem', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', border: '2px dashed rgba(0,214,107,0.4)', textAlign: 'center' }}>
                        <form onSubmit={handleSubirCV}>

                            <h3 style={{ color: 'var(--text-dark)', marginBottom: '1rem', fontSize: '1.8rem' }}>Cargar Currículum</h3>
                            <p style={{ color: 'var(--text-gray)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>Sube tu archivo PDF actualizado para empezar la magia.</p>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleArchivoChange}
                                    style={{ padding: '20px', background: '#f9fdfa', borderRadius: '16px', cursor: 'pointer', width: '100%', boxSizing: 'border-box', color: 'var(--text-dark)', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.1rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="terminos"
                                    checked={aceptoTerminos}
                                    onChange={(e) => setAceptoTerminos(e.target.checked)}
                                    style={{ marginTop: '5px', width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="terminos" style={{ fontSize: '0.9rem', color: 'var(--text-gray)', lineHeight: '1.4', cursor: 'pointer' }}>
                                    Acepto que mi currículum sea procesado usando inteligencia artificial de terceros (Google Gemini) para la extracción de mis habilidades, y reconozco el flujo de datos fuera de mi jurisdicción con fines exclusivos de contratación laboral.
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading || !archivoPDF || !aceptoTerminos}
                                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '18px', fontSize: '1.2rem', boxShadow: '0 8px 25px rgba(0,214,107,0.25)', opacity: (!archivoPDF || !aceptoTerminos) ? 0.6 : 1, cursor: (!archivoPDF || !aceptoTerminos) ? 'not-allowed' : 'pointer' }}
                            >
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {(() => {
                                            const CurrentIcon = loadingIcons[loadingIconIndex].Icon;
                                            return <CurrentIcon size={22} style={{ animation: 'pulse-slow-icon 1.2s ease-in-out infinite' }} />;
                                        })()}
                                        <span>{loadingText || 'Cargando...'}</span>
                                    </div>
                                ) : 'Extraer Perfil Mágico'}
                            </button>
                            {loading && (
                                <style>{`
                                    @keyframes pulse-slow-icon {
                                        0%, 100% { transform: scale(1); opacity: 0.8; }
                                        50% { transform: scale(1.22); opacity: 1; }
                                    }
                                `}</style>
                            )}
                        </form>

                        {error && (
                            <div className="message error" style={{ marginTop: '25px', borderRadius: '12px', fontSize: '1.05rem', lineHeight: '1.5' }}>
                                {error}
                            </div>
                        )}
                    </div>

                </div>

                {/* 🌟 SECCIÓN INFERIOR: Resultados y Toque Personal (Opcional) */}
                {datosExtraidos && (
                    <div style={{ marginTop: '5rem', paddingTop: '4rem', borderTop: '2px solid rgba(0,214,107,0.15)', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                        <h2 className="brand-title" style={{ fontSize: '2.4rem', textAlign: 'center', marginBottom: '3.5rem' }}>¡Análisis Completado con Éxito!</h2>

                        <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>

                            {/* Bloque Izquierdo: Información Básica */}
                            <div style={{ flex: '1 1 450px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ color: 'var(--secondary)', margin: 0, fontSize: '1.5rem' }}>Información Básica</h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', background: 'rgba(0,214,107,0.1)', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Edit3 size={14} /> Verifica y Edita
                                    </span>
                                </div>
                                <div style={{ background: 'rgba(0,214,107,0.03)', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(0,214,107,0.1)', height: '100%', boxSizing: 'border-box' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-gray)', fontSize: '1.15rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                                            <strong style={{ color: 'var(--text-dark)', minWidth: '100px' }}>Nombre:</strong> 
                                            <input type="text" value={datosExtraidos.nombre} onChange={(e) => handleExtraidoChange('nombre', e.target.value)} style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1rem', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                                            <strong style={{ color: 'var(--text-dark)', minWidth: '100px' }}>Profesión:</strong> 
                                            <input type="text" value={datosExtraidos.profesion} onChange={(e) => handleExtraidoChange('profesion', e.target.value)} style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1rem', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                                            <strong style={{ color: 'var(--text-dark)', minWidth: '100px' }}>Experiencia:</strong> 
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 200px' }}>
                                                <input type="number" min="0" value={datosExtraidos.experiencia_anios} onChange={(e) => handleExtraidoChange('experiencia_anios', parseInt(e.target.value) || 0)} style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1rem', outline: 'none' }} />
                                                <span style={{ fontSize: '0.95rem' }}>años</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bloque Derecho: Biografía */}
                            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Tu Toque Personal <span style={{ fontWeight: 'normal', color: 'var(--text-gray)' }}>(Opcional)</span></h3>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-gray)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                    Introduce tu biografía o resumen profesional para destacar tu perfil único ante los reclutadores.
                                </p>
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <textarea maxLength="2500"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Ej: Hola! Soy un desarrollador backend apasionado por construir arquitecturas escalables. Disfruto trabajar en equipo y enfrentar proyectos desafiantes..."
                                        style={{ 
                                            width: '100%', 
                                            padding: '1.5rem', 
                                            borderRadius: '20px', 
                                            border: '1px solid rgba(0,0,0,0.1)', 
                                            resize: 'vertical', 
                                            fontFamily: 'inherit', 
                                            fontSize: '1.1rem', 
                                            boxSizing: 'border-box', 
                                            minHeight: '160px',
                                            flex: 1,
                                            display: 'block'
                                        }}
                                    ></textarea>
                                </div>
                            </div>

                        </div>

                        {/* Bloque Inferior: Habilidades Detectadas (Skills) */}
                        <div style={{ width: '100%', marginTop: '3.5rem' }}>
                            <h3 style={{ color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Skills Detectadas (Elimina posibles errores)</h3>
                            <div style={{ background: 'rgba(0,214,107,0.03)', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(0,214,107,0.1)' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap',
                                    gap: '10px' 
                                }}>
                                    {(Array.isArray(datosExtraidos?.skills) ? datosExtraidos.skills : []).map((skill, index) => (
                                        <div key={index} style={{
                                            backgroundColor: 'white',
                                            padding: '8px 10px 8px 16px',
                                            borderRadius: '30px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            color: 'var(--primary)',
                                            border: '1px solid rgba(0,214,107,0.25)',
                                            boxShadow: '0 3px 8px rgba(0,0,0,0.02)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <span>{skill.nombre}</span>
                                            <span style={{
                                                backgroundColor: 'var(--primary)',
                                                color: 'white',
                                                padding: '3px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                flexShrink: 0
                                            }}>
                                                Lvl {skill.nivel}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => handleEliminarSkill(index)}
                                                style={{ background: 'rgba(255,0,0,0.06)', color: '#d32f2f', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                title="Eliminar esta habilidad"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {(Array.isArray(datosExtraidos?.skills) ? datosExtraidos.skills : []).length === 0 && <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 }}>Sin habilidades cargadas.</p>}
                            </div>
                        </div>

                        {/* 🌟 Opt-in Toggle de Búsqueda de Talento */}
                        <div style={{ 
                            marginTop: '3.5rem', 
                            padding: '2.5rem', 
                            background: 'rgba(0,214,107,0.03)', 
                            borderRadius: '20px', 
                            border: '1px solid rgba(0,214,107,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '15px'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <label style={{ color: 'var(--secondary)', fontSize: '1.25rem', fontWeight: 'bold' }}>Búsqueda de Talento (Opt-in)</label>
                                <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.5' }}>
                                    Activá esta opción para que empresas premium puedan encontrarte en búsquedas avanzadas. Podrás cambiar esto en cualquier momento desde tu perfil.
                                </p>
                            </div>
                            
                            <button
                                type="button"
                                onClick={() => setDisponibleBusqueda(prev => !prev)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '15px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '10px 20px', borderRadius: '30px',
                                    backgroundColor: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                    border: '1px solid rgba(0,214,107,0.1)'
                                }}
                                title={disponibleBusqueda ? 'Haz clic para desactivar la visibilidad' : 'Haz clic para activar la visibilidad'}
                            >
                                {/* Toggle track */}
                                <span style={{
                                    position: 'relative',
                                    display: 'inline-flex',
                                    width: '46px', height: '26px',
                                    borderRadius: '13px',
                                    background: disponibleBusqueda ? 'var(--primary)' : '#cbd5e1',
                                    transition: 'background 0.2s',
                                    flexShrink: 0
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        top: '3px',
                                        left: disponibleBusqueda ? '23px' : '3px',
                                        width: '20px', height: '20px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                        transition: 'left 0.2s'
                                    }} />
                                </span>
                                <span style={{
                                    fontWeight: '600',
                                    color: disponibleBusqueda ? 'var(--primary)' : '#94a3b8',
                                    fontSize: '1.05rem',
                                    transition: 'color 0.2s'
                                }}>
                                    {disponibleBusqueda
                                        ? 'Visible para empresas (Recomendado)'
                                        : 'No visible en búsquedas'}
                                </span>
                            </button>
                        </div>

                        {/* Botón Guardar en la parte inferior */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem' }}>
                            <button
                                type="button"
                                onClick={handleGuardarPerfil}
                                disabled={guardando || guardadoExito}
                                className="submit-btn"
                                style={{ width: '100%', maxWidth: '500px', padding: '20px', fontSize: '1.3rem', boxShadow: '0 10px 35px rgba(0,214,107,0.3)' }}
                            >
                                {guardadoExito ? '¡Perfil Guardado Exitosamente!' : (guardando ? 'Guardando Perfil Definitivo...' : 'Confirmar y Guardar Perfil')}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}