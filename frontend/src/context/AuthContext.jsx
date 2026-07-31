import {createContext, useContext, useEffect, useState} from 'react'
import {supabase} from '../supabase'
import { AlertTriangle } from 'lucide-react'

// Helper global para gatillar el modal de sesión expirada desde cualquier petición API
export function triggerSessionExpired() {
    window.dispatchEvent(new Event('empleat-session-expired'));
}

//creamos el espacio en la memoria(contexto)
const AuthContext= createContext();

//Creamos el proveedor que va a envolver la app
export function AuthProvider({children}){
    const [user, setUser]= useState(null);
    const [loading, setLoading]= useState(true);
    const [sessionExpiredModal, setSessionExpiredModal]= useState(false);

    useEffect(()=>{
        const handleSessionExpired = () => {
            setSessionExpiredModal(true);
        };

        window.addEventListener('empleat-session-expired', handleSessionExpired);

        //Cuando la pagina carga, pregunta a supabase si hay alguien logeado
        supabase.auth.getSession().then(({data: {session}  })=>{
            setUser(session?.user ?? null);
            setLoading(false);
        });

        //Queda escuchando si el usuario hace login o logout en tiempo real
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session)=>{
            if (event === 'PASSWORD_RECOVERY') {
                sessionStorage.setItem('is_recovering_password', 'true');
            }
            // Detectar si el usuario viene de un link de invitación
            if (event === 'SIGNED_IN' && window.location.pathname === '/aceptar-invitacion') {
                sessionStorage.setItem('is_accepting_invitation', 'true');
            }
            // Si el token de sesion expiro o es invalido, limpiar y forzar login
            if (event === 'TOKEN_REFRESH_FAILED') {
                setUser(null);
                setLoading(false);
                setSessionExpiredModal(true);
                sessionStorage.removeItem('is_recovering_password');
                sessionStorage.removeItem('is_accepting_invitation');
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-')) localStorage.removeItem(key);
                });
                return;
            }
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                sessionStorage.removeItem('is_recovering_password');
                sessionStorage.removeItem('is_accepting_invitation');
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-')) localStorage.removeItem(key);
                });
                return;
            }
            setUser(session?.user ?? null);
            setLoading(false);
        });

        //Limpiamos el escuchador si el componente se destruye
        return () => {
            window.removeEventListener('empleat-session-expired', handleSessionExpired);
            subscription.unsubscribe();
        };
    }, []);

        const value={
            user,
            loading,
            triggerSessionExpired
        };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}

            {/* Modal de Sesión Expirada */}
            {sessionExpiredModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999999,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        maxWidth: '420px',
                        width: '100%',
                        padding: '32px 24px 24px',
                        textAlign: 'center',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: 'rgba(244, 67, 54, 0.12)', color: '#F44336',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <AlertTriangle size={34} />
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.35rem', fontWeight: 700, color: '#1a1a1a' }}>
                            Sesión Expirada
                        </h3>
                        <p style={{ margin: '0 0 24px 0', color: '#555', fontSize: '0.96rem', lineHeight: '1.5' }}>
                            Tu sesión ha expirado por motivos de seguridad o inactividad. Por favor, volvé a iniciar sesión.
                        </p>
                        <button
                            onClick={async () => {
                                setSessionExpiredModal(false);
                                await supabase.auth.signOut();
                                window.location.href = '/login';
                            }}
                            style={{
                                width: '100%',
                                padding: '12px 24px',
                                background: '#F44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(244, 67, 54, 0.3)',
                                transition: 'all 0.15s'
                            }}
                        >
                            Entendido, Iniciar Sesión
                        </button>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};

//EXPLICACIONES DEL CODIGO
/**
 * Lineas 8 y 9: Memoria a corto plazo  (usestate)
 * En react las variables normales se borran solas, para guardarlas necesitamos usestate
 * user y set user: user es la caja donde guardamos los datos del usuario, id, mail
 * arranca en null por que cuando inicias no sabes quien es
 * set user es el control remoto, unica forma permitida de meter o sacar cosas de esa caja
 * 
 * Loading y set loading es una bandera para mostrar un mensaje de cargando, arranca en true
 * 
 * UseEffect: es como decirle a react que ni bien termine de hacer lo que hace en esta pantalla, vaya a hacer otro trabajo en segundo plano
 * los corchetes vacios del final le dicen que lo haga una sola vez cuando empiece la app, no simepre
 * Adentro del UE hay 2 trabajos, getsession, le pregunta a supabase si quedo alguien logeado, y apaga la bandera del loading
 * onauthsetchange: se queda escuchando en tiempo real por si queres cerrar sesion, detecta el cambio al instante y cambia a null el setuser
 * 
 * children: representa toda la app, dice que si el loading es false no cargue toda app y cuando la cargue que la abrace con el proveedor para que cualquier pagina
 * pueda usar la variable user cuando quiera(osea este logeado siempre)
 * 
 * Es basicamente un sistema de estados, va preguntando
 * Cargue?, No, Quien sos? Nadie, Te pido datos entonces, Ah sos Lucas, Guardo a Lucas, dejo de cargar, te muestro la app
 */