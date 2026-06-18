-- =========================================================================
-- CORRECCIÓN DE SEGURIDAD: CONTROL DE ASIGNACIÓN DE INSIGNIAS (BADGES)
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

-- 1. Eliminar la política RLS insegura que permite inserción directa desde el cliente API
DROP POLICY IF EXISTS "Candidatos pueden insertar sus propias insignias" ON public.candidato_insignias;

-- 2. Restringir la ejecución de la función SECURITY DEFINER asignar_insignia_candidato
-- Evitamos que cualquier usuario logueado pueda invocar la RPC directamente para ganar insignias sin hacer el quiz.
REVOKE EXECUTE ON FUNCTION public.asignar_insignia_candidato(UUID, UUID) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.asignar_insignia_candidato(UUID, UUID) TO service_role;
