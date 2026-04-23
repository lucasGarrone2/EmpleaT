import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Info, FileText, BrainCircuit, Target, X, Edit3 } from 'lucide-react';
import './Register.css';

export default function PerfilCandidato() {
    const [archivoPDF, setArchivoPDF] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [datosExtraidos, setDatosExtraidos] = useState(null);
    const [pdfPath, setPdfPath] = useState(null);
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [guardadoExito, setGuardadoExito] = useState(false);

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

            // 1. Subir a Supabase Storage
            setLoadingText("⏳ Subiendo PDF a la nube...");
            const resUpload = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/upload-cv`, {
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
            setPdfPath(uploadJSON.path);

            // 2. Analizar con Gemini
            setLoadingText("⏳ Analizando con IA... puede tardar hasta 90 segundos");
            const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/analyze-cv`, {
                method: 'POST',
                body: formData
            });

            if (!respuesta.ok) {
                const errData = await respuesta.json().catch(() => ({}));
                throw new Error(errData.error || "Error al analizar el CV");
            }
            const data = await respuesta.json();
            setDatosExtraidos(data);
        }
        catch (err) {
            console.error(err);
            setError(err.message || "Hubo un problema al extraer la informacion");
        }
        finally {
            setLoading(false);
            setLoadingText("");
        }
    };

    const handleGuardarPerfil = async () => {
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
                    nombre_completo: datosExtraidos.nombre,
                    titulo_profesional: datosExtraidos.profesion,
                    anios_experiencia: datosExtraidos.experiencia_anios,
                    sobre_mi: bio, // Este campo se carga desde el textarea manual
                    ...(pdfPath ? { cv_url: pdfPath } : {})
                }, { onConflict: 'auth_id' })
                .select('id')
                .single();

            if (candidatoError) throw new Error("Error al actualizar candidato: " + candidatoError.message);

            const candidatoId = candidatoData.id;

            // Paso B: Procesar Skills (Migrado a ESCO con Fuzzy Match) - PROCESO POR LOTES (BATCHING)
            const nombresSkillsGemini = datosExtraidos.skills.map(s => s.nombre);
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
            setGuardadoExito(true);
            setTimeout(() => {
                navigate('/ofertas');
            }, 1800);
        } catch (err) {
            console.error("Error guardando perfil:", err);
            setError(err.message);
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

            <div style={{
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
                                {loading ? (loadingText || '⏳ Cargando...') : 'Extraer Perfil Mágico'}
                            </button>
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

                            {/* Bloque Izquierdo: Lo que extrajo Gemini */}
                            <div style={{ flex: '1 1 450px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ color: 'var(--secondary)', margin: 0, fontSize: '1.5rem' }}>Información Extraída</h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', background: 'rgba(0,214,107,0.1)', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Edit3 size={14} /> Verifica y Edita
                                    </span>
                                </div>
                                <div style={{ background: 'rgba(0,214,107,0.03)', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(0,214,107,0.1)' }}>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'var(--text-gray)', fontSize: '1.15rem', marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <strong style={{ color: 'var(--text-dark)', width: '120px' }}>Nombre:</strong> 
                                            <input type="text" value={datosExtraidos.nombre} onChange={(e) => handleExtraidoChange('nombre', e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1rem', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <strong style={{ color: 'var(--text-dark)', width: '120px' }}>Profesión:</strong> 
                                            <input type="text" value={datosExtraidos.profesion} onChange={(e) => handleExtraidoChange('profesion', e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1rem', outline: 'none' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <strong style={{ color: 'var(--text-dark)', width: '120px' }}>Experiencia:</strong> 
                                            <input type="number" min="0" value={datosExtraidos.experiencia_anios} onChange={(e) => handleExtraidoChange('experiencia_anios', parseInt(e.target.value) || 0)} style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1rem', outline: 'none' }} />
                                            <span style={{ fontSize: '0.95rem' }}>años</span>
                                        </div>
                                    </div>

                                    <h4 style={{ marginTop: '0', marginBottom: '20px', color: 'var(--text-dark)', fontSize: '1.2rem' }}>Skills Detectadas (Elimina posibles errores):</h4>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap',
                                        gap: '10px' 
                                    }}>
                                        {datosExtraidos.skills.map((skill, index) => (
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
                                    {datosExtraidos.skills.length === 0 && <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 }}>Sin habilidades cargadas.</p>}
                                </div>
                            </div>

                            {/* Bloque Derecho: Toque personal y Guardado */}
                            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '1.5rem' }}>Tu Toque Personal <span style={{ fontWeight: 'normal', color: 'var(--text-gray)' }}>(Opcional)</span></h3>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-gray)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                    La IA ya hizo el trabajo pesado descifrando tu trayectoria, pero nadie habla tan bien de ti como tú mismo. Escribe algo extra para destacarte ante los reclutadores.
                                </p>

                                <div style={{ width: '100%', maxWidth: '700px' }}>
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
                                            minHeight: '200px',
                                            display: 'block'
                                        }}
                                    ></textarea>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGuardarPerfil}
                                    disabled={guardando || guardadoExito}
                                    className="submit-btn"
                                    style={{ marginTop: '2.5rem', width: '100%', padding: '20px', fontSize: '1.3rem', boxShadow: '0 10px 35px rgba(0,214,107,0.3)' }}
                                >
                                    {guardadoExito ? '¡Perfil Guardado Exitosamente!' : (guardando ? 'Guardando Perfil Definitivo...' : 'Confirmar y Guardar Perfil')}
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}