import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// SEC-A01: window.supabase eliminado para no exponer credenciales ni cliente en el scope global.
