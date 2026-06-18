-- =========================================================================
-- PARCHE DE MOTIVOS DE RECHAZO (TABLA, SEED DATA Y PRIVILEGIOS)
-- Ejecutar este script en el SQL Editor de Supabase
-- =========================================================================

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.motivos_rechazo (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL
);

-- 2. Insertar valores semilla (seed data)
INSERT INTO public.motivos_rechazo (id, descripcion) VALUES
(1, 'No cumple con los requisitos técnicos'),
(2, 'Pretensión salarial fuera de rango'),
(3, 'Ubicación o modalidad incompatible'),
(4, 'No superó la entrevista técnica / IA'),
(5, 'Otro motivo')
ON CONFLICT (id) DO UPDATE 
SET descripcion = EXCLUDED.descripcion;

-- 3. Habilitar seguridad a nivel de filas (opcional, pero con política de lectura pública)
ALTER TABLE public.motivos_rechazo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de motivos_rechazo" ON public.motivos_rechazo;
CREATE POLICY "Lectura pública de motivos_rechazo" 
    ON public.motivos_rechazo FOR SELECT 
    TO authenticated, anon
    USING (true);

-- 4. Otorgar permisos explícitos para resolver fallos 42501 (Permission Denied)
GRANT ALL ON TABLE public.motivos_rechazo TO postgres, service_role, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.motivos_rechazo_id_seq TO postgres, service_role, anon, authenticated;
