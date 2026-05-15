-- 1. Tabla de Insignias (Catálogo)
CREATE TABLE IF NOT EXISTS public.insignias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    icono_url TEXT,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de relación Candidato - Insignias
CREATE TABLE IF NOT EXISTS public.candidato_insignias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
    insignia_id UUID NOT NULL REFERENCES public.insignias(id) ON DELETE CASCADE,
    fecha_obtenida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(candidato_id, insignia_id) -- Un candidato solo puede tener una misma insignia una vez
);

-- 3. Tabla para controlar los intentos de Quiz (Rate limit 24h y validación)
CREATE TABLE IF NOT EXISTS public.quiz_intentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
    skill_nombre TEXT NOT NULL,
    respuestas_correctas JSONB, -- Guardamos las respuestas para validar en el verify-quiz
    fecha_intento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aprobado BOOLEAN DEFAULT FALSE
);

-- 4. Habilitar RLS y otorgar permisos base
ALTER TABLE public.insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_intentos ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.insignias TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.candidato_insignias TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.quiz_intentos TO authenticated, anon, service_role;


-- 5. Políticas
CREATE POLICY "Insignias son visibles para todos los usuarios autenticados" 
ON public.insignias FOR SELECT TO authenticated USING (true);

CREATE POLICY "Cualquier usuario autenticado puede ver las insignias de los candidatos"
ON public.candidato_insignias FOR SELECT TO authenticated USING (true);

CREATE POLICY "Candidatos pueden insertar sus propias insignias"
ON public.candidato_insignias FOR INSERT TO authenticated
WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "Candidatos pueden ver sus propios intentos"
ON public.quiz_intentos FOR SELECT TO authenticated
USING (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "Candidatos pueden insertar sus intentos"
ON public.quiz_intentos FOR INSERT TO authenticated
WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "Candidatos pueden actualizar sus intentos"
ON public.quiz_intentos FOR UPDATE TO authenticated
USING (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

