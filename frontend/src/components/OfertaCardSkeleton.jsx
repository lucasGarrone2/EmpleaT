import React from 'react';

export default function OfertaCardSkeleton() {
    return (
        <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Cabecera del Card: Logo y Títulos */}
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <div className="skeleton skeleton-circle" style={{ width: '50px', height: '50px', flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-title" style={{ width: '60%', height: '20px', marginBottom: '8px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px' }}></div>
                </div>
            </div>

            {/* Badges de Filtro / Tags */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <div className="skeleton" style={{ width: '70px', height: '26px', borderRadius: '20px' }}></div>
                <div className="skeleton" style={{ width: '90px', height: '26px', borderRadius: '20px' }}></div>
                <div className="skeleton" style={{ width: '80px', height: '26px', borderRadius: '20px' }}></div>
            </div>

            {/* Descripción corta */}
            <div style={{ marginTop: '0.2rem' }}>
                <div className="skeleton skeleton-text" style={{ width: '100%', height: '12px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '90%', height: '12px' }}></div>
            </div>

            {/* Footer de la tarjeta */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(0,0,0,0.03)',
                paddingTop: '1rem',
                marginTop: '0.4rem'
            }}>
                <div className="skeleton skeleton-text" style={{ width: '100px', height: '12px', marginBottom: 0 }}></div>
                <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: '12px' }}></div>
            </div>
        </div>
    );
}
