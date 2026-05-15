import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../supabase';

export default function InterviewModal({ candidatoId, ofertaId, porcentajeMatch, onClose }) {
    const [step, setStep] = useState('generating'); // generating | asking | evaluating | results
    const [preguntas, setPreguntas] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [respuestas, setRespuestas] = useState([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [evaluacion, setEvaluacion] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const generateQuestions = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("No hay sesión activa");

                const response = await fetch('http://localhost:3000/api/premium/simular-entrevista', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        oferta_id: ofertaId,
                        candidato_id: candidatoId,
                        porcentaje_match: porcentajeMatch
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al generar la entrevista');
                }

                const data = await response.json();
                if (isMounted) {
                    setPreguntas(data.preguntas);
                    setStep('asking');
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                    setStep('error');
                }
            }
        };

        generateQuestions();
        return () => { isMounted = false; };
    }, [candidatoId, ofertaId, porcentajeMatch]);

    const handleNextQuestion = () => {
        if (!currentAnswer.trim()) return;

        const newRespuestas = [...respuestas, currentAnswer];
        setRespuestas(newRespuestas);
        setCurrentAnswer('');

        if (currentIndex < preguntas.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            submitInterview(newRespuestas);
        }
    };

    const submitInterview = async (finalRespuestas) => {
        setStep('evaluating');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa");

            const q_a_pairs = preguntas.map((q, idx) => ({
                pregunta: q,
                respuesta: finalRespuestas[idx]
            }));

            const response = await fetch('http://localhost:3000/api/premium/evaluar-respuesta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    oferta_id: ofertaId,
                    candidato_id: candidatoId,
                    q_a_pairs
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al evaluar');
            }

            const data = await response.json();
            setEvaluacion(data);
            setStep('results');
        } catch (err) {
            setError(err.message);
            setStep('error');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
            <div style={{
                background: 'white', borderRadius: '24px', width: '100%', maxWidth: '650px',
                minHeight: '400px', display: 'flex', flexDirection: 'column', position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '20px 30px', borderBottom: '1px solid #EAEAEA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(0, 214, 107, 0.1)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                            <Sparkles size={20} color="var(--primary)" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>Simulador de Entrevista IA</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '5px' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    
                    {step === 'generating' && (
                        <div style={{ textAlign: 'center', color: '#666' }}>
                            <Loader2 size={48} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 20px auto' }} />
                            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Analizando tu perfil y la oferta...</h3>
                            <p style={{ margin: 0 }}>Nuestra IA está preparando 3 preguntas desafiantes exclusivas para ti.</p>
                            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {step === 'error' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#d32f2f', marginBottom: '15px' }}>
                                <X size={48} />
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Ocurrió un error</h3>
                            <p style={{ color: '#666' }}>{error}</p>
                            <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 24px', background: '#F5F5F5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cerrar
                            </button>
                        </div>
                    )}

                    {step === 'asking' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                                {[...Array(preguntas.length)].map((_, i) => (
                                    <div key={i} style={{ flex: 1, height: '4px', background: i <= currentIndex ? 'var(--primary)' : '#EAEAEA', borderRadius: '2px', transition: 'background 0.3s' }}></div>
                                ))}
                            </div>
                            
                            <div style={{ background: '#F8F9FA', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--primary)', marginBottom: '20px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Pregunta {currentIndex + 1} de {preguntas.length}
                                </div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333', lineHeight: '1.5' }}>
                                    {preguntas[currentIndex]}
                                </h4>
                            </div>

                            <textarea 
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="Escribe tu respuesta aquí. Sé detallado y utiliza ejemplos si es posible..."
                                style={{
                                    flex: 1, minHeight: '150px', padding: '15px', borderRadius: '12px',
                                    border: '1px solid #DDD', fontSize: '1rem', resize: 'none', outline: 'none',
                                    fontFamily: 'inherit', lineHeight: '1.5'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = '#DDD'}
                            ></textarea>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button 
                                    onClick={handleNextQuestion}
                                    disabled={!currentAnswer.trim()}
                                    style={{
                                        background: currentAnswer.trim() ? 'var(--primary)' : '#EAEAEA',
                                        color: currentAnswer.trim() ? 'white' : '#999',
                                        padding: '12px 24px', borderRadius: '8px', border: 'none',
                                        fontWeight: 'bold', fontSize: '1rem', cursor: currentAnswer.trim() ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                    }}
                                >
                                    {currentIndex === preguntas.length - 1 ? 'Finalizar' : 'Siguiente Pregunta'} <Send size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'evaluating' && (
                        <div style={{ textAlign: 'center', color: '#666' }}>
                            <Loader2 size={48} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 20px auto' }} />
                            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Evaluando tus respuestas...</h3>
                            <p style={{ margin: 0 }}>Nuestra IA está redactando feedback personalizado para ayudarte a mejorar.</p>
                        </div>
                    )}

                    {step === 'results' && evaluacion && (
                        <div style={{ animation: 'fadeIn 0.5s', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginBottom: '25px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: evaluacion.score >= 70 ? 'rgba(0, 214, 107, 0.1)' : 'rgba(255, 176, 32, 0.1)', color: evaluacion.score >= 70 ? 'var(--primary)' : '#FFB020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>
                                    {evaluacion.score}
                                </div>
                                <h3 style={{ margin: 0, color: '#333' }}>{evaluacion.score >= 70 ? '¡Buen trabajo!' : 'Hay margen de mejora'}</h3>
                            </div>

                            <div style={{ background: '#F8F9FA', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #EAEAEA' }}>
                                <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
                                    <Sparkles size={18} color="var(--primary)" /> Feedback General
                                </h4>
                                <p style={{ margin: 0, color: '#555', lineHeight: '1.6' }}>{evaluacion.feedback_general}</p>
                            </div>

                            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Análisis Detallado</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {evaluacion.evaluacion_detallada?.map((det, i) => (
                                    <div key={i} style={{ borderLeft: '3px solid #EAEAEA', paddingLeft: '15px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#444', marginBottom: '5px' }}>Pregunta {i+1}</div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#666', lineHeight: '1.5' }}>{det.observacion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer for Results */}
                {step === 'results' && (
                    <div style={{ padding: '20px 30px', borderTop: '1px solid #EAEAEA', background: '#FAFAFB', textAlign: 'right' }}>
                        <button onClick={onClose} style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={18} /> Entendido
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #DDD; border-radius: 3px; }
            `}</style>
        </div>
    );
}
