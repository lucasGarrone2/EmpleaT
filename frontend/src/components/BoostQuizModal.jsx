import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Zap, Sparkles, X, CheckCircle2, XCircle, BrainCircuit, Loader2 } from 'lucide-react';
import { getQuestionsForSkills } from '../utils/questionsBank';

export default function BoostQuizModal({ candidatoId, oferta, onClose, onSuccess }) {
    // 1. Obtener preguntas basadas en las skills de la oferta (se ejecuta una sola vez al montar el componente)
    const [qData] = useState(() => getQuestionsForSkills(oferta.oferta_skills || []));
    const preguntas = qData.questions;
    const skillLabel = qData.skillLabel;

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [respuestasUsuario, setRespuestasUsuario] = useState(new Array(preguntas.length).fill(null));
    const [submitting, setSubmitting] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState(null);

    const currentQ = preguntas[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === preguntas.length - 1;
    const hasAnsweredCurrent = respuestasUsuario[currentQuestionIndex] !== null;

    const handleSelectOption = (optionIndex) => {
        const nuevasRespuestas = [...respuestasUsuario];
        nuevasRespuestas[currentQuestionIndex] = optionIndex;
        setRespuestasUsuario(nuevasRespuestas);
    };

    const handleNext = () => {
        if (currentQuestionIndex < preguntas.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);

        // Calcular aciertos
        let aciertos = 0;
        preguntas.forEach((p, idx) => {
            if (respuestasUsuario[idx] === p.correcta) {
                aciertos++;
            }
        });

        const aprobado = aciertos >= 2; // Pasa con 2 de 3 correctas
        const estadoFinal = aprobado ? 'aprobado' : 'desaprobado';

        try {
            // Actualizar fila de postulación en Supabase
            const { data: updateData, error: dbError } = await supabase
                .from('postulaciones')
                .update({ match_boost_estado: estadoFinal })
                .eq('candidato_id', candidatoId)
                .eq('oferta_id', oferta.id)
                .select();

            if (dbError) throw dbError;

            // Si el RLS bloquea la actualización, PostgREST no tira error pero devuelve array vacío
            if (!updateData || updateData.length === 0) {
                throw new Error("No se pudo actualizar la postulación. Verifica las políticas RLS.");
            }

            // Guardar resultado local para pantalla de éxito/fallo
            setResultado({
                aprobado,
                aciertos,
                total: preguntas.length
            });

            // Disparar callback para refrescar estado en ListaOfertas sin recargar página
            if (onSuccess) {
                onSuccess(estadoFinal);
            }

        } catch (err) {
            console.error("Error al registrar match boost:", err);
            setError("No pudimos conectar con el servidor para guardar tu resultado. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                width: '100%',
                maxWidth: '600px',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                position: 'relative',
                animation: 'scaleUp 0.3s ease-out'
            }}>
                {/* Cabecera */}
                <div style={{
                    padding: '1.5rem 2rem',
                    background: 'linear-gradient(90deg, #102C21 0%, #1A4635 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BrainCircuit size={24} color="#FFD700" />
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', fontFamily: "'Outfit', sans-serif", color: 'white' }}>
                            Desafío de Match: {skillLabel}
                        </h2>
                    </div>
                    {!resultado && !submitting && (
                        <button 
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Contenido Principal */}
                <div style={{ padding: '2rem' }}>
                    {error && (
                        <div style={{ background: '#FFF0F0', color: '#D32F2F', padding: '12px', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                            {error}
                        </div>
                    )}

                    {submitting ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                            <Loader2 size={40} className="spin-animation" color="var(--primary)" />
                            <span style={{ color: '#555', fontWeight: '600' }}>Evaluando respuestas y guardando resultado...</span>
                        </div>
                    ) : resultado ? (
                        /* PANTALLA DE RESULTADOS */
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            {resultado.aprobado ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(0, 214, 107, 0.1)', padding: '1.5rem', borderRadius: '50%', color: 'var(--primary)' }}>
                                        <Sparkles size={60} fill="var(--primary)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.75rem', color: '#102C21', margin: 0, fontWeight: 'bold' }}>¡Felicitaciones!</h3>
                                    <p style={{ fontSize: '1.1rem', color: '#444', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                                        Aprobaste el cuestionario con <strong>{resultado.aciertos} de {resultado.total} aciertos</strong>.
                                    </p>
                                    <div style={{
                                        background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                                        color: 'white',
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 12px rgba(255,165,0,0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Zap size={18} fill="white" /> ¡Match Potenciado +5%!
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
                                        Tu postulación ahora cuenta con mayor relevancia en el panel del reclutador.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(211, 47, 47, 0.1)', padding: '1.5rem', borderRadius: '50%', color: '#D32F2F' }}>
                                        <XCircle size={60} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', color: '#D32F2F', margin: 0, fontWeight: 'bold' }}>Desafío Completado</h3>
                                    <p style={{ fontSize: '1.05rem', color: '#444', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                                        Lograste <strong>{resultado.aciertos} de {resultado.total} aciertos</strong>. Para recibir el boost necesitas al menos 2 respuestas correctas.
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: '#666', maxWidth: '400px' }}>
                                        Tu postulación sigue estando activa y disponible para el reclutador con tu porcentaje de match original.
                                    </p>
                                </div>
                            )}

                            <button 
                                onClick={onClose}
                                style={{
                                    marginTop: '2rem',
                                    background: resultado.aprobado ? 'var(--primary)' : '#444',
                                    color: 'white',
                                    padding: '12px 32px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                            >
                                Entendido
                            </button>
                        </div>
                    ) : (
                        /* PANTALLA DE PREGUNTAS */
                        <div>
                            {/* Barra de Progreso */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.85rem', marginBottom: '6px' }}>
                                    <span>Pregunta {currentQuestionIndex + 1} de {preguntas.length}</span>
                                    <span>{Math.round((currentQuestionIndex / preguntas.length) * 100)}% completado</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${((currentQuestionIndex) / preguntas.length) * 100}%`,
                                        height: '100%',
                                        background: 'var(--primary)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>

                            {/* Enunciado de Pregunta */}
                            <h3 style={{
                                fontSize: '1.25rem',
                                color: '#102C21',
                                lineHeight: '1.5',
                                marginBottom: '1.5rem',
                                fontWeight: '600'
                            }}>
                                {currentQ.pregunta}
                            </h3>

                            {/* Opciones */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
                                {currentQ.opciones.map((opcion, index) => {
                                    const isSelected = respuestasUsuario[currentQuestionIndex] === index;
                                    return (
                                        <div 
                                            key={index}
                                            onClick={() => handleSelectOption(index)}
                                            style={{
                                                padding: '12px 18px',
                                                borderRadius: '12px',
                                                border: `2px solid ${isSelected ? 'var(--primary)' : '#EAEAEA'}`,
                                                background: isSelected ? 'rgba(0, 214, 107, 0.04)' : 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                boxShadow: isSelected ? '0 4px 12px rgba(0,214,107,0.05)' : 'none'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? 'var(--primary)' : '#B5B5B5'}`,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                flexShrink: 0
                                            }}>
                                                {isSelected && (
                                                    <div style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        background: 'var(--primary)'
                                                    }} />
                                                )}
                                            </div>
                                            <span style={{
                                                fontSize: '0.95rem',
                                                color: isSelected ? '#102C21' : '#444',
                                                fontWeight: isSelected ? '600' : 'normal',
                                                lineHeight: '1.4'
                                            }}>
                                                {opcion}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Botón Siguiente */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                    onClick={handleNext}
                                    disabled={!hasAnsweredCurrent}
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '12px 30px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem',
                                        cursor: hasAnsweredCurrent ? 'pointer' : 'not-allowed',
                                        opacity: hasAnsweredCurrent ? 1 : 0.5,
                                        boxShadow: hasAnsweredCurrent ? '0 4px 12px rgba(0,214,107,0.2)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isLastQuestion ? 'Finalizar Desafío' : 'Siguiente Pregunta'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Estilos locales para las animaciones del modal */}
                <style>{`
                    @keyframes scaleUp {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .spin-animation {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
