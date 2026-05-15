import React, { useState } from 'react';
import { Check, Sparkles, Zap, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

export default function Pricing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleUpgrade = async (plan) => {
        if (!user) return;
        setLoadingPlan(plan.meses);
        try {
            // Obtenemos token para el backend
            const { data: session } = await supabase.auth.getSession();
            const token = session.session.access_token;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/create-preference`, {
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
            
            // Redirigir al usuario al Checkout Pro de Mercado Pago
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error("Falta el link de pago");
            }
        } catch (error) {
            console.error("Error al iniciar el pago:", error);
            alert("Hubo un error al procesar la redirección a Mercado Pago.");
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
        "Simulador de Entrevistas Técnicas con Inteligencia Artificial.",
        "Feedback personalizado y detallado de cada respuesta.",
        "Posicionamiento destacado en búsquedas de empresas.",
        "Quizzes ilimitados para validar tus habilidades técnicas.",
        "Insignias Premium exclusivas para destacar tu perfil."
    ];

    return (
        <div style={{ padding: '4rem 1rem', background: '#FAFAFB', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1100px', width: '100%' }}>
                {planes.map((plan, index) => (
                    <div key={index} style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        width: '320px',
                        position: 'relative',
                        boxShadow: plan.popular ? '0 20px 40px rgba(255,176,32,0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
                        border: plan.popular ? '2px solid #FFB020' : '1px solid #EAEAEA',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {plan.popular && (
                            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255,176,32,0.3)', letterSpacing: '1px' }}>
                                MÁS ELEGIDO
                            </div>
                        )}
                        
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
                                marginBottom: '2rem',
                                boxShadow: plan.popular ? '0 4px 15px rgba(255,176,32,0.3)' : 'none',
                                opacity: (loadingPlan !== null || success) ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {loadingPlan === plan.meses ? <Loader2 size={20} className="spin" /> : 'Elegir Plan'}
                        </button>

                        <div style={{ borderTop: '1px solid #EAEAEA', paddingTop: '1.5rem', flex: 1 }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#333', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Incluye:</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {beneficios.map((ben, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <div style={{ background: 'rgba(0, 214, 107, 0.1)', borderRadius: '50%', padding: '2px', color: 'var(--primary)', marginTop: '2px' }}>
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>{ben}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <button 
                    onClick={() => navigate('/ofertas')}
                    style={{ background: 'none', border: 'none', color: '#666', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}>
                    Volver a las ofertas <ChevronRight size={18} />
                </button>
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
