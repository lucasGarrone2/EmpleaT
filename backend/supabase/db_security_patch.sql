-- =========================================================================
-- PARCHE DE SEGURIDAD DE BASE DE DATOS - MITIGACIONES
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

-- 1. Crear tabla de pagos procesados para mitigar Replay Attacks (Doble Gasto)
CREATE TABLE IF NOT EXISTS public.pagos_procesados (
    id VARCHAR(100) PRIMARY KEY,
    auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monto NUMERIC,
    fecha_procesado TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en la tabla pagos_procesados
ALTER TABLE public.pagos_procesados ENABLE ROW LEVEL SECURITY;

-- Otorgar privilegios base
GRANT ALL ON TABLE public.pagos_procesados TO postgres, service_role, anon, authenticated;

-- Políticas de lectura: los candidatos solo pueden ver sus propios pagos procesados
CREATE POLICY "Usuarios pueden ver sus propios pagos"
    ON public.pagos_procesados FOR SELECT
    TO authenticated
    USING (auth_id = auth.uid());

-- 2. Hardening de exámenes: Eliminar política de actualización directa de intentos por parte del candidato
-- De ahora en adelante, solo el backend (usando Service Role) podrá actualizar el estado del examen.
DROP POLICY IF EXISTS "Candidatos pueden actualizar sus intentos" ON public.quiz_intentos;
