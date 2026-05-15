import React from 'react';
import { Sparkles, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PremiumActionZone({ matchScore, isPremium, onSimulateClick }) {
    const navigate = useNavigate();
    if (matchScore < 80) {
        return (
            <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: '#F8F9FA', 
                borderRadius: '12px',
                border: '1px dashed #DDD',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <Lock size={20} color="#888" />
                <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#555' }}>Simulación con IA Bloqueada</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>
                        ¡Estás cerca! Mejora tus skills para alcanzar el 80% de match y desbloquea simulaciones de entrevistas reales generadas por nuestra Inteligencia Artificial.
                    </p>
                </div>
            </div>
        );
    }

    if (!isPremium) {
        return (
            <div style={{ 
                marginTop: '1.5rem', 
                padding: '1.2rem', 
                background: 'linear-gradient(135deg, rgba(255,176,32,0.1) 0%, rgba(255,215,0,0.05) 100%)', 
                borderRadius: '12px',
                border: '1px solid rgba(255,176,32,0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#D48800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={18} /> ¡Tienes el Match para la Simulación IA!
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                        Con <b>EmpleaT Premium</b> puedes realizar entrevistas técnicas simuladas, obtener feedback experto instantáneo y prepararte para destacar frente a los reclutadores. 
                        No dejes pasar esta oportunidad de perfeccionar tus respuestas.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/pricing')}
                    style={{ 
                        background: 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)', 
                        color: 'white', 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        fontWeight: 'bold', 
                        fontSize: '0.95rem', 
                        cursor: 'pointer', 
                        boxShadow: '0 4px 12px rgba(255,176,32,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Lock size={16} /> Hacerse Premium
                </button>
            </div>
        );
    }

    return (
        <div style={{ 
            marginTop: '1.5rem', 
            padding: '1.2rem', 
            background: 'rgba(0, 214, 107, 0.05)', 
            borderRadius: '12px',
            border: '1px solid rgba(0, 214, 107, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
        }}>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={18} /> Simulación de Entrevista IA Habilitada
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                    Aprovecha tu beneficio Premium para prepararte. Te haremos 3 preguntas situacionales sobre esta posición.
                </p>
            </div>
            <button 
                onClick={onSimulateClick}
                style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    fontWeight: 'bold', 
                    fontSize: '0.95rem', 
                    cursor: 'pointer', 
                    boxShadow: '0 4px 12px rgba(0, 214, 107, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                <Sparkles size={16} /> Simular Entrevista
            </button>
        </div>
    );
}
