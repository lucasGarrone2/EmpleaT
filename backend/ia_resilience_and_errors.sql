-- ==============================================================================
-- MIGRACIÓN: RESILIENCIA DE IA Y ROBUSTEZ DE ERRORES (COLA DE JOBS Y SEGURIDAD)
-- ==============================================================================

-- 1. Crear tabla de estados de procesamiento si no existe
CREATE TABLE IF NOT EXISTS public.cv_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'procesando' CHECK (status IN ('procesando', 'completado', 'fallido')),
    resultado JSONB,
    error_message TEXT,
    cv_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.cv_processing_jobs ENABLE ROW LEVEL SECURITY;

-- 3. Otorgar permisos
GRANT ALL ON TABLE public.cv_processing_jobs TO postgres, service_role, anon, authenticated;

-- 4. Política de Selección para el candidato dueño del job
DROP POLICY IF EXISTS "Candidatos pueden ver sus propios procesos de CV" ON public.cv_processing_jobs;
CREATE POLICY "Candidatos pueden ver sus propios procesos de CV"
  ON public.cv_processing_jobs FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());
