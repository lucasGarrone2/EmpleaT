import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(null); // { message, title, type, isConfirm, confirmText, cancelText, onConfirm, onCancel, onClose }

    const showAlert = useCallback((message, title = 'Atención', type = 'info') => {
        return new Promise((resolve) => {
            setAlert({
                message,
                title,
                type,
                isConfirm: false,
                onClose: () => {
                    setAlert(null);
                    resolve(true);
                }
            });
        });
    }, []);

    const showConfirm = useCallback((message, title = 'Confirmar Acción', confirmText = 'Aceptar', cancelText = 'Cancelar') => {
        return new Promise((resolve) => {
            setAlert({
                message,
                title,
                type: 'warning',
                isConfirm: true,
                confirmText,
                cancelText,
                onConfirm: () => {
                    setAlert(null);
                    resolve(true);
                },
                onCancel: () => {
                    setAlert(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {alert && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 99999, // Asegurar que quede sobre cualquier otra vista
                    padding: '1rem',
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '440px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '24px',
                        position: 'relative',
                        boxSizing: 'border-box'
                    }}>
                        {/* Botón cerrar */}
                        <button 
                            onClick={alert.isConfirm ? alert.onCancel : alert.onClose}
                            style={{
                                position: 'absolute',
                                top: '16px', right: '16px',
                                background: 'rgba(0,0,0,0.04)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#666',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                        >
                            <X size={16} />
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '12px' }}>
                            {/* Icono de Alerta */}
                            <div style={{
                                width: '56px', height: '56px',
                                borderRadius: '18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '16px',
                                background: 
                                    alert.type === 'success' ? 'rgba(0, 214, 107, 0.12)' :
                                    alert.type === 'error' ? 'rgba(244, 67, 54, 0.12)' :
                                    alert.type === 'warning' ? 'rgba(255, 152, 0, 0.12)' :
                                    'rgba(33, 150, 243, 0.12)',
                                color: 
                                    alert.type === 'success' ? '#00B159' :
                                    alert.type === 'error' ? '#F44336' :
                                    alert.type === 'warning' ? '#FF9800' :
                                    '#2196F3'
                            }}>
                                {alert.type === 'success' && <CheckCircle2 size={28} />}
                                {alert.type === 'error' && <XCircle size={28} />}
                                {alert.type === 'warning' && <AlertTriangle size={28} />}
                                {alert.type === 'info' && <Info size={28} />}
                            </div>

                            {/* Título y Mensaje */}
                            <h3 style={{
                                margin: '0 0 10px 0',
                                fontSize: '1.3rem',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {alert.title}
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: '0.98rem',
                                lineHeight: '1.5',
                                color: '#555',
                                wordBreak: 'break-word'
                            }}>
                                {alert.message}
                            </p>
                        </div>

                        {/* Botones de Acción */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '12px',
                            marginTop: '24px',
                            width: '100%'
                        }}>
                            {alert.isConfirm ? (
                                <>
                                    <button
                                        onClick={alert.onCancel}
                                        style={{
                                            flex: 1,
                                            background: '#F0F0F0',
                                            color: '#444',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '12px 18px',
                                            fontWeight: '700',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            outline: 'none'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#E5E5E5'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#F0F0F0'}
                                    >
                                        {alert.cancelText || 'Cancelar'}
                                    </button>
                                    <button
                                        onClick={alert.onConfirm}
                                        style={{
                                            flex: 1,
                                            background: '#F44336',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '12px 18px',
                                            fontWeight: '700',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(244,67,54,0.25)',
                                            transition: 'all 0.15s',
                                            outline: 'none'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                    >
                                        {alert.confirmText || 'Aceptar'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={alert.onClose}
                                    style={{
                                        background: 
                                            alert.type === 'success' ? 'var(--primary)' :
                                            alert.type === 'error' ? '#F44336' :
                                            alert.type === 'warning' ? '#FF9800' :
                                            'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '10px 32px',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        transition: 'all 0.15s',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                >
                                    Aceptar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert debe usarse dentro de un AlertProvider');
    }
    if (typeof context === 'function') {
        return context;
    }
    return context.showAlert;
}

export function useConfirm() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useConfirm debe usarse dentro de un AlertProvider');
    }
    return context.showConfirm;
}
