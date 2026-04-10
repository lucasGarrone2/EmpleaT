import {createContext, useContext, useEffect, useState} from 'react'
import {supabase} from '../supabase'
//creamos el espacio en la memoria(contexto)
const AuthContext= createContext();

//Creamos el proveedor que va a envolver la app
export function AuthProvider({children}){
    const [user, setUser]= useState(null);
    const [loading, setLoading]= useState(true);

    useEffect(()=>{
        //Cuando la pagina carga, pregunta a supabase si hay alguien logeado
        supabase.auth.getSession().then(({data: {session}  })=>{
            setUser(session?.user ?? null);
            setLoading(false);
        });

        //Queda escuchando si el usuario hace login o logout en tiempo real
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session)=>{
            // Si el token de sesion expiro o es invalido, limpiar y forzar login
            if (event === 'TOKEN_REFRESH_FAILED' || event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                // Limpiar tokens viejos del localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-')) localStorage.removeItem(key);
                });
                return;
            }
            setUser(session?.user ?? null);
            setLoading(false);
        });

        //Limpiamos el escuchador si el componente se destruye
        return () => subscription.unsubscribe();
    }, []);

        //Todo lo que pongamos en el value podra ser usado en cualquier pantalla

        const value={
            user,
            loading, // Necesario para que ProtectedRoute muestre spinner durante validación
        };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
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