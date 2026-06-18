-- =========================================================================
-- AÑADIR COLUMNA finalizado A LA TABLA quiz_intentos
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

ALTER TABLE public.quiz_intentos ADD COLUMN IF NOT EXISTS finalizado BOOLEAN DEFAULT FALSE;
