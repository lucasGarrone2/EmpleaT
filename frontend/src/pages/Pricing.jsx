import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Shield, ChevronRight, Loader2, Crown, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

export default function Pricing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const showAlert = useAlert();
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [success, setSuccess] = useState(false);
    const [candidatoData, setCandidatoData] = useState(null);
    const [loadingCandidato, setLoadingCandidato] = useState(false);
    const [procesandoArrepentimiento, setProcesandoArrepentimiento] = useState(false);

    const formatPremiumHasta = (dateStr) => {
        if (!dateStr) return "tiempo ilimitado";
        const date = new Date(dateStr);
        if (isNaN(date.getTime()) || date.getFullYear() <= 1970) {
            return "tiempo ilimitado";
        }
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    useEffect(() => {
        if (user) {
            setLoadingCandidato(true);
            const fetchCandidato = async () => {
                try {
                    const { data, error } = await supabase
                        .from('candidatos')
                        .select('es_premium, premium_hasta')
                        .eq('auth_id', user.id)
                        .maybeSingle();
                    if (!error && data) {
                        setCandidatoData(data);
                    }
                } catch (err) {
                    console.error("Error fetching candidate premium status:", err);
                } finally {
                    setLoadingCandidato(false);
                }
            };
            fetchCandidato();
        } else {
            setCandidatoData(null);
        }
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment_status') === 'failure') {
            showAlert("Hubo un problema al procesar tu pago. Por favor, intenta de nuevo.", "Error de pago", "error");
            params.delete('payment_status');
            const newSearch = params.toString();
            const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
            window.history.replaceState(null, '', newUrl);
        } else if (params.get('payment_status') === 'success') {
            setSuccess(true);
            showAlert("¡Gracias por tu compra! Tu suscripción Premium ha sido activada.", "¡Suscripción Activada!", "success");
            params.delete('payment_status');
            const newSearch = params.toString();
            const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
            window.history.replaceState(null, '', newUrl);

            setTimeout(() => {
                navigate('/ofertas');
            }, 3000);
        }
    }, [showAlert, navigate]);

    const handleArrepentimiento = async () => {
        if (!window.confirm("¿Estás seguro de que deseas cancelar tu suscripción Premium? Esta acción solicitará el arrepentimiento y reembolso según la legislación vigente.")) {
            return;
        }

        setProcesandoArrepentimiento(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa");

            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/premium/arrepentimiento`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "No se pudo procesar la solicitud de arrepentimiento.");
            }

            if (data.success) {
                setCandidatoData(prev => ({ ...prev, es_premium: false, premium_hasta: null }));
                showAlert(`¡Suscripción Premium revocada con éxito! Código de trámite: ${data.codigo_tramite}. El reembolso de tu pago se procesará a través de Mercado Pago.`, "Arrepentimiento Ejercido", "success");
            }
        } catch (err) {
            console.error("Error al revocar suscripción:", err);
            showAlert(err.message || "Ocurrió un error al intentar cancelar la suscripción.", "Error", "error");
        } finally {
            setProcesandoArrepentimiento(false);
        }
    };

    const handleUpgrade = async (plan) => {
        if (!user) {
            navigate('/register');
            return;
        }
        setLoadingPlan(plan.meses);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session.access_token;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/create-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan, auth_id: user.id })
            });

            if (!response.ok) {
                throw new Error("No se pudo crear la preferencia de pago");
            }

            const data = await response.json();
            
            if (data.init_point) {
                const ALLOWED_MP_DOMAINS = ['mercadopago.com', 'mercadolibre.com', 'mercadopago.com.ar'];
                try {
                    const url = new URL(data.init_point);
                    const isAllowed = ALLOWED_MP_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith('.' + d));
                    if (!isAllowed) {
                        throw new Error('Dominio de pago no autorizado: ' + url.hostname);
                    }
                    window.location.href = data.init_point;
                } catch (urlErr) {
                    console.error('SEC-20: Link de pago inválido:', urlErr.message);
                    showAlert("Link de pago inválido. Por favor, contactá soporte.", "Error de seguridad", "error");
                    setLoadingPlan(null);
                }
            } else {
                throw new Error("Falta el link de pago");
            }
        } catch (error) {
            console.error("Error al iniciar el pago:", error);
            showAlert("Hubo un error al procesar la redirección a Mercado Pago.", "Error", "error");
            setLoadingPlan(null);
        }
    };

    const planes = [
        {
            meses: 1,
            precio: '5.000',
            popular: false,
            ahorro: null
        },
        {
            meses: 6,
            precio: '25.000',
            popular: true,
            ahorro: 'Ahorras 17%'
        },
        {
            meses: 12,
            precio: '45.000',
            popular: false,
            ahorro: 'Ahorras 25%'
        }
    ];

    const beneficios = [
        "Simulador de Entrevistas Técnicas con Inteligencia Artificial. (¡NUEVO!)",
        "Estadísticas competitivas en tiempo real: postulantes totales, tu posición en el ranking de afinidad y comparativa de sueldos. (¡NUEVO!)",
        "Feedback personalizado y detallado de cada respuesta en la entrevista simulada.",
        "Posicionamiento destacado en búsquedas de empresas.",
        "Quizzes ilimitados para validar tus habilidades técnicas.",
        "Insignias Premium exclusivas para destacar tu perfil."
    ];

    return (
        <div style={{ padding: '4rem 1rem', background: '#FAFAFB', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Banner de Suscripciones Deshabilitadas */}
            <div style={{
                background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                color: '#9a3412',
                padding: '10px 16px',
                textAlign: 'center',
                fontSize: '0.88rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.03)',
                marginBottom: '2rem',
                maxWidth: '850px',
                width: '100%',
                boxSizing: 'border-box'
            }} className="notranslate" translate="no">
                <AlertTriangle size={17} color="#c2410c" style={{ flexShrink: 0 }} />
                <span>
                    <strong>SUSCRIPCIONES TEMPORALMENTE DESHABILITADAS:</strong> Las suscripciones se encuentran temporalmente deshabilitadas por estar en fase de desarrollo.
                </span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '800px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,176,32,0.1)', color: '#D48800', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>
                    <Sparkles size={18} /> EmpleaT Premium
                </div>
                {success ? (
                    <>
                        <h1 style={{ fontSize: '2.5rem', color: '#00d66b', marginBottom: '1rem', lineHeight: '1.2' }}>¡Felicidades, ya eres Premium!</h1>
                        <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.6' }}>Tus beneficios han sido activados correctamente. Redirigiendo a las ofertas...</p>
                    </>
                ) : (
                    <>
                        <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '1rem', lineHeight: '1.2' }}>Invierte en tu Futuro Profesional</h1>
                        <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.6' }}>Desbloquea simulaciones de entrevistas con IA y destaca tu perfil ante los reclutadores. Elige el plan que mejor se adapte a tu búsqueda laboral.</p>
                    </>
                )}
            </div>

            {candidatoData && candidatoData.es_premium && (
                <div style={{
                    background: 'linear-gradient(135deg, #FFF9EB 0%, #FFF3D6 100%)',
                    border: '1px solid #FFE099',
                    borderRadius: '16px',
                    padding: '1.5rem 2rem',
                    marginBottom: '3rem',
                    boxShadow: '0 4px 15px rgba(255, 176, 32, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    maxWidth: '800px',
                    width: '100%',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#B27600', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        <Crown size={20} color="#B27600" fill="#B27600" /> ¡Tu Membresía Premium está Activa!
                    </div>
                    <p style={{ color: '#665022', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Tienes acceso completo a todas las herramientas exclusivas de Inteligencia Artificial hasta el{' '}
                        <strong>
                            {formatPremiumHasta(candidatoData.premium_hasta)}
                        </strong>.
                    </p>
                    <p style={{ color: '#8C6D30', margin: 0, fontSize: '0.85rem', fontStyle: 'italic', lineHeight: '1.5' }}>
                        ¿Quieres extender tu suscripción? Puedes elegir cualquiera de los planes de abajo y se sumará acumulativamente a tu tiempo restante.
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1100px', width: '100%' }}>
                {planes.map((plan, index) => (
                    <div key={index} style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        width: '100%',
                        maxWidth: '320px',
                        position: 'relative',
                        boxShadow: plan.popular ? '0 20px 40px rgba(255,176,32,0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
                        border: plan.popular ? '2px solid #FFB020' : '1px solid #EAEAEA',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '260px'
                    }}>
                        {plan.popular && (
                            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255,176,32,0.3)', letterSpacing: '1px' }}>
                                MÁS ELEGIDO
                            </div>
                        )}
                        
                        <div>
                            <h3 style={{ fontSize: '1.2rem', color: '#555', marginBottom: '10px' }}>
                                Suscripción {plan.meses} {plan.meses === 1 ? 'Mes' : 'Meses'}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#333' }}>${plan.precio}</span>
                                <span style={{ fontSize: '1rem', color: '#888' }}>ARS</span>
                            </div>
                            
                            <div style={{ height: '24px', marginBottom: '1.5rem' }}>
                                {plan.ahorro && (
                                    <span style={{ background: '#EAF9F1', color: '#00B159', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        {plan.ahorro}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => handleUpgrade(plan)}
                            disabled={loadingPlan !== null || success}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: 'none',
                                background: plan.popular ? 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)' : '#F5F5F5',
                                color: plan.popular ? 'white' : '#333',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: (loadingPlan !== null || success) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: plan.popular ? '0 4px 15px rgba(255,176,32,0.3)' : 'none',
                                opacity: (loadingPlan !== null || success) ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {loadingPlan === plan.meses ? (
                                <Loader2 size={20} className="spin" />
                            ) : candidatoData?.es_premium ? (
                                `Extender ${plan.meses} ${plan.meses === 1 ? 'Mes' : 'Meses'}`
                            ) : (
                                'Elegir Plan'
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Unified Benefits Section */}
            <div style={{
                marginTop: '4rem',
                maxWidth: '960px',
                width: '100%',
                background: 'white',
                borderRadius: '24px',
                padding: '3rem 2.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                border: '1px solid #EAEAEA',
                boxSizing: 'border-box'
            }}>
                <h3 style={{
                    fontSize: '1.4rem',
                    color: '#333',
                    fontWeight: '800',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <Sparkles size={20} color="#FFB020" fill="#FFB020" /> ¿Qué incluye tu Membresía Premium?
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {beneficios.map((ben, i) => {
                        const isNew = ben.includes("NUEVO");
                        return (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start',
                                padding: '1.2rem',
                                borderRadius: '16px',
                                background: isNew ? 'linear-gradient(135deg, rgba(255,176,32,0.08) 0%, rgba(255,176,32,0.02) 100%)' : '#FAFAFB',
                                border: isNew ? '1px solid rgba(255,176,32,0.2)' : '1px solid rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ 
                                    background: isNew ? '#FFB020' : 'var(--primary)', 
                                    borderRadius: '50%', 
                                    width: '24px',
                                    height: '24px',
                                    color: 'white', 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <div>
                                    <span style={{ 
                                        fontSize: '0.95rem', 
                                        color: '#333', 
                                        lineHeight: '1.5',
                                        fontWeight: isNew ? 'bold' : '500'
                                    }}>
                                        {ben}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Visual Preview Section */}
            <div style={{
                marginTop: '5rem',
                maxWidth: '900px',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(255,176,32,0.05) 0%, rgba(255,215,0,0.02) 100%)',
                border: '1px solid rgba(255,176,32,0.15)',
                borderRadius: '32px',
                padding: '3rem 2.5rem',
                boxSizing: 'border-box',
                boxShadow: '0 15px 35px rgba(0,0,0,0.02)'
            }}>
                <h2 style={{
                    fontSize: '1.8rem',
                    color: '#333',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    <Sparkles size={24} color="#FFB020" fill="#FFB020" /> Características Premium en Acción
                </h2>
                <p style={{
                    color: '#666',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: '0 auto 3rem auto',
                    fontSize: '1rem',
                    lineHeight: '1.6'
                }}>
                    Mira cómo las herramientas de Inteligencia Artificial de EmpleaT transforman tu postulación y te preparan para el éxito.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '2.5rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    {/* Feature 1: CV Adaptator Preview */}
                    <div style={{
                        flex: '1 1 380px',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '2rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                        border: '1px solid #eaeaea'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                            <span style={{
                                background: 'rgba(255,176,32,0.15)',
                                color: '#D48800',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                NUEVO
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#333', fontWeight: 'bold' }}>
                                Simulador de Entrevistas con IA
                            </h3>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Simulá entrevistas reales adaptadas a cada vacante laboral con la IA y recibí feedback constructivo inmediato para perfeccionar tus respuestas.
                        </p>

                        <div style={{
                            background: '#F8F9FA',
                            borderRadius: '12px',
                            padding: '1rem',
                            fontSize: '0.85rem',
                            border: '1px dashed #ddd',
                            lineHeight: '1.4'
                        }}>
                            <div style={{ color: '#888', fontWeight: 'bold', marginBottom: '4px' }}>Ejemplo de Extracto Sugerido:</div>
                            <span style={{ fontStyle: 'italic', color: '#444' }}>
                                "Desarrollador Full Stack con sólido dominio de React y Node.js. Experiencia optimizando bases de datos SQL y aplicando buenas prácticas de Scrum para acelerar el desarrollo del MVP solicitado por la empresa..."
                            </span>
                        </div>
                    </div>

                    {/* Feature 2: Interview Simulator Preview */}
                    <div style={{
                        flex: '1 1 380px',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '2rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                        border: '1px solid #eaeaea'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                            <span style={{
                                background: '#E6F7FF',
                                color: '#0084FF',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                IA EXCLUSIVA
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#333', fontWeight: 'bold' }}>
                                Simulador de Entrevista
                            </h3>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Realiza simulacros de entrevistas técnicas con preguntas personalizadas sobre el rol al que aspiras y recibe feedback profesional inmediato en cada respuesta.
                        </p>

                        <div style={{
                            background: '#F8F9FA',
                            borderRadius: '12px',
                            padding: '1rem',
                            fontSize: '0.85rem',
                            border: '1px dashed #ddd',
                            lineHeight: '1.4'
                        }}>
                            <div style={{ color: '#00B159', fontWeight: 'bold', marginBottom: '4px' }}>Feedback IA en Tiempo Real:</div>
                            <span style={{ color: '#444' }}>
                                "Excelente explicación del Virtual DOM. Para sonar aún más profesional, menciona cómo React gestiona el proceso de reconciliación utilizando el algoritmo Diff."
                            </span>
                        </div>
                    </div>

                    {/* Feature 3: Competitive Stats Preview */}
                    <div style={{
                        flex: '1 1 380px',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '2rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                        border: '1px solid #eaeaea'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                            <span style={{
                                background: '#E8F5E9',
                                color: '#2E7D32',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                NUEVO
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#333', fontWeight: 'bold' }}>
                                Estadísticas de Competencia
                            </h3>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Accede a información analítica de la vacante: cantidad de postulantes, tu posicionamiento estimado en el top de afinidad técnica y el salario promedio del mercado.
                        </p>

                        <div style={{
                            background: '#F0FDF4',
                            borderRadius: '12px',
                            padding: '1.2rem',
                            border: '1px dashed #A5D6A7',
                            fontSize: '0.85rem',
                            lineHeight: '1.4',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                        }}>
                            <div>
                                <span style={{ color: '#666', fontSize: '0.75rem', display: 'block', fontWeight: 'bold' }}>POSICIONAMIENTO</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: '#2E7D32', fontSize: '1.1rem' }}>
                                    Top 25% de afinidad <Sparkles size={14} />
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#666', fontSize: '0.75rem', display: 'block', fontWeight: 'bold' }}>SUELDO VS MERCADO</span>
                                <span style={{ fontWeight: 'bold', color: '#2E7D32', fontSize: '1.1rem' }}>+12% vs Promedio</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gestión de Suscripción y Botón de Arrepentimiento */}
            {candidatoData?.es_premium && (
                <div style={{ 
                    marginTop: '5rem', 
                    maxWidth: '900px', 
                    width: '100%', 
                    background: '#FFFbeb', 
                    border: '1px solid #Fef3c7', 
                    borderRadius: '24px', 
                    padding: '2.5rem', 
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(251,191,36,0.05)'
                }}>
                    <h3 style={{
                        fontSize: '1.4rem',
                        color: '#b45309',
                        fontWeight: '800',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <Crown size={20} color="#b45309" fill="#b45309" /> Gestión de Membresía Premium
                    </h3>
                    <p style={{
                        color: '#78350f',
                        maxWidth: '700px',
                        margin: '0 auto 2rem auto',
                        fontSize: '1rem',
                        lineHeight: '1.6'
                    }}>
                        De acuerdo a la legislación argentina (Ley N° 24.240), tienes derecho a revocar la contratación de tu plan Premium dentro de los 10 (diez) días corridos desde tu pago inicial si no has realizado un consumo sustancial del servicio (exámenes/simulaciones de entrevista).
                    </p>
                    <button
                        onClick={handleArrepentimiento}
                        disabled={procesandoArrepentimiento}
                        style={{
                            background: 'linear-gradient(90deg, #d97706 0%, #b45309 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '14px 28px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(217,119,6,0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {procesandoArrepentimiento ? 'Procesando Reembolso...' : 'Botón de Arrepentimiento (Revocar Suscripción)'}
                    </button>
                </div>
            )}

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <button 
                    onClick={() => navigate('/ofertas')}
                    style={{ background: 'none', border: 'none', color: '#666', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}>
                    Volver a las ofertas <ChevronRight size={18} />
                </button>
            </div>
            {/* Modal de Confirmación Estilizado */}
            {showConfirmModal && (
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
                            background: '#FEF3C7',
                            color: '#D97706',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <Shield size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', color: '#111827', fontWeight: '800', marginBottom: '1rem' }}>
                            ¿Confirmas ejercer el arrepentimiento?
                        </h3>
                        <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Esta acción cancelará tu membresía Premium y solicitará el reembolso de tu dinero en Mercado Pago. **Si pagaste con tarjeta de débito o crédito, el reintegro puede tardar unos días hábiles en verse reflejado en tu cuenta según los plazos de tu banco.** Esta acción es irreversible.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
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
                                onClick={ejecutarArrepentimiento}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(90deg, #D97706 0%, #B45309 100%)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(217,119,6,0.25)',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                Confirmar Reembolso
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}
