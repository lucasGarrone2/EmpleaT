-- =========================================================================
-- CREAR TABLA PARA SESIONES DE SIMULACIÓN DE ENTREVISTA (GRACE TIME PREMIUM)
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.simulacion_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
    oferta_id UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
    preguntas JSONB NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalizado BOOLEAN DEFAULT FALSE
);

-- Habilitar RLS
ALTER TABLE public.simulacion_sesiones ENABLE ROW LEVEL SECURITY;

-- Política de lectura para candidatos
CREATE POLICY "Candidatos pueden ver sus propias sesiones"
    ON public.simulacion_sesiones FOR SELECT
    TO authenticated
    USING (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

-- Política de inserción para candidatos
CREATE POLICY "Candidatos pueden insertar sus propias sesiones"
    ON public.simulacion_sesiones FOR INSERT
    TO authenticated
    WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

-- Política de actualización para candidatos
CREATE POLICY "Candidatos pueden actualizar sus propias sesiones"
    ON public.simulacion_sesiones FOR UPDATE
    TO authenticated
    USING (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()))
    WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));
