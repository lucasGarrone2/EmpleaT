import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { BrainCircuit, Clock, CheckCircle, XCircle, AlertCircle, Award } from 'lucide-react';
import './Register.css'; // Reusing established styles

export default function SkillQuiz() {
    const { skill } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [candidatoId, setCandidatoId] = useState(null);
    const [quizSessionId, setQuizSessionId] = useState(null);
    const [preguntas, setPreguntas] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [respuestasUsuario, setRespuestasUsuario] = useState([]);
    
    // Timer state
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const timerRef = useRef(null);

    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);
    const [resultado, setResultado] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        if (!user) {
            navigate('/login');
            return;
        }

        const initQuiz = async () => {
            try {
                // 1. Get Candidato ID
                const { data: candData, error: candError } = await supabase
                    .from('candidatos')
                    .select('id')
                    .eq('auth_id', user.id)
                    .single();

                if (!isMounted) return;

                if (candError) throw candError;
                setCandidatoId(candData.id);

                // 2. Request Quiz Generation
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!isMounted) return;

                const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
                
                const res = await fetch(`${backendUrl}/api/generate-quiz`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}` 
                    },
                    body: JSON.stringify({
                        skill: decodeURIComponent(skill),
                        candidato_id: candData.id
                    }),
                    signal: abortController.signal
                });

                if (!isMounted) return;

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Error al generar el examen");
                }

                if (!isMounted) return;

                const pList = Array.isArray(data?.preguntas) ? data.preguntas : [];
                setQuizSessionId(data.quiz_session_id);
                setPreguntas(pList);
                setRespuestasUsuario(new Array(pList.length).fill(null));
                
                // Start Timer
                timerRef.current = setInterval(() => {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            handleAutoSubmit(); // Auto submit when time is up
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log('Examen cancelado (unmounted).');
                    return;
                }
                if (isMounted) {
                    console.error("Quiz Init Error:", err);
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initQuiz();

        return () => {
            isMounted = false;
            abortController.abort();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [user, navigate, skill]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (preguntas.length > 0 && !resultado) {
                const message = "Si sales de esta página, perderás tu intento de examen diario. ¿Estás seguro?";
                e.preventDefault();
                e.returnValue = message; // Standard
                return message;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [preguntas, resultado]);

    const handleAutoSubmit = async () => {
        // Enviar respuestas actuales cuando se acaba el tiempo
        if (submittingRef.current || resultado) return;
        await submitQuiz(respuestasUsuario);
    };

    const submitQuiz = async (respuestasParaEnviar) => {
        if (submittingRef.current || resultado) return;
        submittingRef.current = true;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
            
            // Reemplazar nulls con -1 para que cuente como incorrecta si no respondió
            const respuestasLimpias = respuestasParaEnviar.map(r => r === null ? -1 : r);

            const res = await fetch(`${backendUrl}/api/verify-quiz`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` 
                },
                body: JSON.stringify({
                    quiz_session_id: quizSessionId,
                    candidato_id: candidatoId,
                    respuestas_usuario: respuestasLimpias
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al verificar el examen");
            }

            setResultado(data);
        } catch (err) {
            console.error("Quiz Verify Error:", err);
            setError(err.message);
            submittingRef.current = false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectOption = (optionIndex) => {
        const nuevasRespuestas = [...respuestasUsuario];
        nuevasRespuestas[currentQuestionIndex] = optionIndex;
        setRespuestasUsuario(nuevasRespuestas);
    };

    const handleNext = () => {
        if (currentQuestionIndex < preguntas.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            submitQuiz(respuestasUsuario);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) {
        return (
            <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
                <BrainCircuit size={60} color="var(--primary)" className="spin-animation" />
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Generando examen de {decodeURIComponent(skill)}...</div>
            </div>
        );
    }

    if (error && !resultado) {
        return (
            <div className="register-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '500px' }}>
                    <AlertCircle size={60} color="#d32f2f" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>No se pudo iniciar el examen</h2>
                    <p style={{ color: 'var(--text-gray)', marginBottom: '2rem', fontSize: '1.1rem' }}>{error}</p>
                    <Link to="/mi-perfil" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        Volver a Mi Perfil
                    </Link>
                </div>
            </div>
        );
    }

    if (resultado) {
        return (
            <div className="register-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '800px', width: '100%' }}>
                    {resultado.aprobado ? (
                        <>
                            <div style={{ animation: 'bounce 1s ease infinite' }}>
                                <Award size={80} color="#FFD700" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }} />
                            </div>
                            <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '1rem' }}>¡Felicidades!</h2>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>Has superado el examen de <strong>{decodeURIComponent(skill)}</strong> con un puntaje perfecto ({resultado.aciertos}/{resultado.total}).</p>
                            <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>La insignia ha sido añadida a tu perfil público. Las empresas ahora verán que esta habilidad está validada.</p>
                        </>
                    ) : (
                        <>
                            <XCircle size={80} color="#d32f2f" style={{ marginBottom: '1rem' }} />
                            <h2 style={{ color: '#d32f2f', fontSize: '2.5rem', marginBottom: '1rem' }}>Examen No Aprobado</h2>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>Lograste {resultado.aciertos} de {resultado.total} aciertos. Para obtener la insignia necesitas el 100%.</p>
                            <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>Podrás volver a intentarlo en 24 horas.</p>
                        </>
                    )}

                    <div style={{ textAlign: 'left', background: 'var(--bg-light)', padding: '2rem', borderRadius: '15px', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Revisión de Preguntas</h3>
                        {preguntas.map((p, i) => {
                            const expl = resultado.explicaciones[i];
                            const miRespuesta = respuestasUsuario[i];
                            const esCorrecto = miRespuesta === expl.correcta;
                            
                            return (
                                <div key={i} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: i < preguntas.length - 1 ? '1px solid #eee' : 'none' }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        {esCorrecto ? <CheckCircle color="var(--primary)" size={20} style={{ flexShrink: 0, marginTop: '2px' }}/> : <XCircle color="#d32f2f" size={20} style={{ flexShrink: 0, marginTop: '2px' }}/>}
                                        {i + 1}. {p.pregunta}
                                    </p>
                                    <div style={{ marginLeft: '28px', color: 'var(--text-gray)', fontSize: '0.95rem' }}>
                                        <p><strong>Tu respuesta:</strong> {miRespuesta !== -1 && miRespuesta !== null ? p.opciones[miRespuesta] : 'No respondida'}</p>
                                        {!esCorrecto && <p style={{ color: 'var(--primary)' }}><strong>Respuesta correcta:</strong> {p.opciones[expl.correcta]}</p>}
                                        <p style={{ marginTop: '0.5rem', fontStyle: 'italic', background: 'white', padding: '10px', borderRadius: '8px' }}>{expl.explicacion}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Link to="/mi-perfil" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        Volver a Mi Perfil
                    </Link>
                </div>
            </div>
        );
    }

    const currentQ = preguntas[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === preguntas.length - 1;
    const hasAnsweredCurrent = respuestasUsuario[currentQuestionIndex] !== null;

    return (
        <div className="register-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', maxWidth: '700px', width: '100%', position: 'relative' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid rgba(0,214,107,0.1)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BrainCircuit size={28} color="var(--primary)" />
                        <h2 style={{ color: 'var(--secondary)', margin: 0 }}>Validación: {decodeURIComponent(skill)}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: timeLeft < 60 ? '#ffebee' : '#f0fdf4', color: timeLeft < 60 ? '#d32f2f' : 'var(--primary)', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span>Pregunta {currentQuestionIndex + 1} de {preguntas.length}</span>
                        <span>{Math.round(((currentQuestionIndex) / preguntas.length) * 100)}% completado</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${((currentQuestionIndex) / preguntas.length) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                    </div>
                </div>

                {/* Question */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        {currentQ.pregunta}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentQ.opciones.map((opcion, index) => {
                            const isSelected = respuestasUsuario[currentQuestionIndex] === index;
                            return (
                                <div 
                                    key={index}
                                    onClick={() => handleSelectOption(index)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        borderRadius: '12px',
                                        border: `2px solid ${isSelected ? 'var(--primary)' : '#e0e0e0'}`,
                                        background: isSelected ? 'rgba(0,214,107,0.05)' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--primary)' : '#ccc'}`, display: 'flex', justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        {isSelected && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                                    </div>
                                    <span style={{ fontSize: '1.1rem', color: isSelected ? 'var(--text-dark)' : 'var(--text-gray)', fontWeight: isSelected ? '600' : 'normal' }}>
                                        {opcion}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button 
                        onClick={handleNext}
                        disabled={!hasAnsweredCurrent || submitting}
                        className="submit-btn"
                        style={{
                            width: 'auto',
                            padding: '12px 30px',
                            opacity: (!hasAnsweredCurrent || submitting) ? 0.5 : 1,
                            cursor: (!hasAnsweredCurrent || submitting) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? 'Evaluando...' : (isLastQuestion ? 'Finalizar Examen' : 'Siguiente Pregunta')}
                    </button>
                </div>

            </div>
        </div>
    );
}
