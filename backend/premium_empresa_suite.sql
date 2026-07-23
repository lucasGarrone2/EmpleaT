-- ==============================================================================
-- MIGRACIÓN: SUITE PREMIUM PARA EMPRESAS
-- Ejecutar en Supabase SQL Editor (en orden)
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. CAMBIOS DE ESQUEMA                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 1.1 Agregar campos premium a la tabla empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS premium_hasta TIMESTAMPTZ;

-- Agregar constraint CHECK para el campo plan (solo si no existe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'empresas_plan_check'
  ) THEN
    ALTER TABLE public.empresas ADD CONSTRAINT empresas_plan_check
      CHECK (plan IN ('free', 'premium'));
  END IF;
END $$;

-- 1.2 Agregar contador de vistas a ofertas
ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS vistas INTEGER NOT NULL DEFAULT 0;

-- 1.3 Agregar campos de boost (destacada) a ofertas
ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS destacada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS destacada_hasta TIMESTAMPTZ;

-- 1.4 Agregar opt-in de búsqueda a candidatos
ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS disponible_busqueda BOOLEAN NOT NULL DEFAULT FALSE;

-- 1.5 Extender roles de empresa_miembros para incluir 'solo_lectura'
ALTER TABLE public.empresa_miembros DROP CONSTRAINT IF EXISTS empresa_miembros_rol_check;
ALTER TABLE public.empresa_miembros ADD CONSTRAINT empresa_miembros_rol_check
  CHECK (rol IN ('administrador', 'reclutador', 'solo_lectura'));


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. FUNCIONES RPC                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 2.1 Incremento atómico de vistas (SECURITY DEFINER)
-- Se llama UNA sola vez por sesión de usuario que ve el detalle de la oferta
CREATE OR REPLACE FUNCTION public.increment_vista_oferta(p_oferta_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ofertas
  SET vistas = vistas + 1
  WHERE id = p_oferta_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_vista_oferta(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_vista_oferta(UUID) TO authenticated;

-- 2.2 Procesamiento atómico de pago premium para empresas
CREATE OR REPLACE FUNCTION public.procesar_pago_empresa_premium(
    p_payment_id VARCHAR(100),
    p_auth_id UUID,
    p_monto NUMERIC,
    p_meses INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_current_hasta TIMESTAMPTZ;
    v_new_hasta TIMESTAMPTZ;
BEGIN
    -- 1. Buscar la empresa por auth_id del dueño
    SELECT id, premium_hasta INTO v_empresa_id, v_current_hasta
    FROM public.empresas
    WHERE auth_id = p_auth_id;

    IF v_empresa_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 2. Verificar replay (pago ya procesado)
    IF EXISTS (SELECT 1 FROM public.pagos_procesados WHERE id = p_payment_id) THEN
        RETURN FALSE;
    END IF;

    -- 3. Insertar registro de pago
    INSERT INTO public.pagos_procesados (id, auth_id, monto)
    VALUES (p_payment_id, p_auth_id, p_monto);

    -- 4. Calcular nueva fecha de expiración (acumulativa si premium vigente)
    IF v_current_hasta IS NOT NULL AND v_current_hasta > NOW() THEN
        v_new_hasta := v_current_hasta + (p_meses * INTERVAL '30 days');
    ELSE
        v_new_hasta := NOW() + (p_meses * INTERVAL '30 days');
    END IF;

    -- 5. Activar premium
    UPDATE public.empresas
    SET plan = 'premium',
        premium_hasta = v_new_hasta
    WHERE id = v_empresa_id;

    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        RETURN FALSE;
    WHEN OTHERS THEN
        RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.procesar_pago_empresa_premium(VARCHAR, UUID, NUMERIC, INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.procesar_pago_empresa_premium(VARCHAR, UUID, NUMERIC, INTEGER) TO service_role;

-- 2.3 Búsqueda avanzada de candidatos (SECURITY DEFINER)
-- Valida internamente que la empresa que ejecuta tenga plan premium activo.
-- Solo devuelve candidatos con disponible_busqueda = true.
-- Reutiliza el índice GIN de trigramas sobre diccionario_skills.nombre_skill.
CREATE OR REPLACE FUNCTION public.buscar_candidatos_premium(
    p_skills TEXT[],
    p_experiencia_min INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    candidato_id UUID,
    titulo_profesional TEXT,
    anios_experiencia INTEGER,
    ubicacion TEXT,
    modalidad_preferida TEXT,
    skills_match JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_plan TEXT;
    v_premium_hasta TIMESTAMPTZ;
BEGIN
    -- 1. Validar que el usuario que ejecuta pertenece a una empresa con plan premium activo
    SELECT e.id, e.plan, e.premium_hasta
    INTO v_empresa_id, v_plan, v_premium_hasta
    FROM public.empresa_miembros em
    JOIN public.empresas e ON e.id = em.empresa_id
    WHERE em.auth_id = auth.uid()
    LIMIT 1;

    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: no eres miembro de ninguna empresa.';
    END IF;

    IF v_plan != 'premium' OR v_premium_hasta IS NULL OR v_premium_hasta <= NOW() THEN
        RAISE EXCEPTION 'Acceso denegado: se requiere plan premium de empresa activo.';
    END IF;

    -- 2. Ejecutar búsqueda
    RETURN QUERY
    SELECT DISTINCT ON (c.id)
        c.id AS candidato_id,
        c.titulo_profesional,
        c.anios_experiencia,
        c.ubicacion,
        c.modalidad_preferida,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'nombre', COALESCE(ds2.nombre_skill, cs2.nombre_original),
                'nivel', cs2.nivel_estimado
            ))
            FROM public.candidato_skills cs2
            LEFT JOIN public.diccionario_skills ds2 ON cs2.skill_id = ds2.id
            WHERE cs2.candidato_id = c.id
        ) AS skills_match
    FROM public.candidatos c
    JOIN public.candidato_skills cs ON cs.candidato_id = c.id
    LEFT JOIN public.diccionario_skills ds ON cs.skill_id = ds.id
    WHERE c.disponible_busqueda = TRUE
      AND c.anios_experiencia >= p_experiencia_min
      AND (
          -- Si no se pasan skills, devolver todos los candidatos visibles
          array_length(p_skills, 1) IS NULL
          OR EXISTS (
              SELECT 1 FROM unnest(p_skills) AS skill_term
              WHERE ds.nombre_skill % skill_term
                 OR COALESCE(cs.nombre_original, '') % skill_term
          )
      )
    ORDER BY c.id, c.anios_experiencia DESC
    LIMIT LEAST(p_limit, 50);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.buscar_candidatos_premium(TEXT[], INTEGER, INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.buscar_candidatos_premium(TEXT[], INTEGER, INTEGER) TO authenticated;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. FUNCIONES HELPER PARA RLS                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 3.1 Check de rol con lista de roles permitidos
CREATE OR REPLACE FUNCTION public.check_user_role_in_company(
    user_uid UUID,
    company_uuid UUID,
    required_roles TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.empresa_miembros
    WHERE auth_id = user_uid
      AND empresa_id = company_uuid
      AND rol = ANY(required_roles)
  );
END;
$$;

-- 3.2 Check premium activo de empresa
CREATE OR REPLACE FUNCTION public.check_empresa_is_premium(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.empresas
    WHERE id = company_uuid
      AND plan = 'premium'
      AND premium_hasta > NOW()
  );
END;
$$;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. ACTUALIZACIÓN DE POLÍTICAS RLS PARA ROLES                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 4.1 Ofertas INSERT: solo admin + reclutador (no solo_lectura)
DROP POLICY IF EXISTS "Miembros de la empresa pueden subir ofertas" ON public.ofertas;
DROP POLICY IF EXISTS "Miembros con permiso pueden subir ofertas" ON public.ofertas;
CREATE POLICY "Miembros con permiso pueden subir ofertas"
  ON public.ofertas FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_role_in_company(auth.uid(), empresa_id, ARRAY['administrador', 'reclutador']));

-- 4.2 Ofertas UPDATE: solo admin + reclutador
DROP POLICY IF EXISTS "Miembros de la empresa pueden editar sus ofertas" ON public.ofertas;
DROP POLICY IF EXISTS "Miembros con permiso pueden editar ofertas" ON public.ofertas;
CREATE POLICY "Miembros con permiso pueden editar ofertas"
  ON public.ofertas FOR UPDATE
  TO authenticated
  USING (public.check_user_role_in_company(auth.uid(), empresa_id, ARRAY['administrador', 'reclutador']));

-- 4.3 Mensajes INSERT para empresa: solo admin + reclutador pueden enviar
DROP POLICY IF EXISTS "empresa_insert_mensajes" ON public.mensajes;
CREATE POLICY "empresa_insert_mensajes"
  ON public.mensajes FOR INSERT
  WITH CHECK (
    remitente_tipo = 'empresa'
    AND remitente_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.postulaciones p
      JOIN public.ofertas o ON o.id = p.oferta_id
      JOIN public.empresa_miembros em ON em.empresa_id = o.empresa_id
      WHERE p.id = mensajes.postulacion_id
        AND em.auth_id = auth.uid()
        AND em.rol IN ('administrador', 'reclutador')
    )
  );

-- 4.4 Postulaciones UPDATE: solo admin + reclutador
DROP POLICY IF EXISTS "Miembros pueden actualizar estado de postulaciones" ON public.postulaciones;
DROP POLICY IF EXISTS "Miembros con permiso actualizan postulaciones" ON public.postulaciones;
CREATE POLICY "Miembros con permiso actualizan postulaciones"
  ON public.postulaciones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ofertas o
      JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
      WHERE o.id = postulaciones.oferta_id
        AND em.auth_id = auth.uid()
        AND em.rol IN ('administrador', 'reclutador')
    )
  );

-- 4.5 Candidatos: permitir lectura a empresas premium para candidatos con disponible_busqueda
DROP POLICY IF EXISTS "Empresas premium ven candidatos visibles en busqueda" ON public.candidatos;
CREATE POLICY "Empresas premium ven candidatos visibles en busqueda"
  ON public.candidatos FOR SELECT
  TO authenticated
  USING (
    disponible_busqueda = TRUE
    AND EXISTS (
      SELECT 1 FROM public.empresa_miembros em
      JOIN public.empresas e ON e.id = em.empresa_id
      WHERE em.auth_id = auth.uid()
        AND e.plan = 'premium'
        AND e.premium_hasta > NOW()
    )
  );

-- 4.6 Candidato_skills: permitir lectura para candidatos con disponible_busqueda a empresas premium
DROP POLICY IF EXISTS "Empresas premium ven skills de candidatos visibles" ON public.candidato_skills;
CREATE POLICY "Empresas premium ven skills de candidatos visibles"
  ON public.candidato_skills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.candidatos c
      WHERE c.id = candidato_skills.candidato_id
        AND c.disponible_busqueda = TRUE
    )
    AND EXISTS (
      SELECT 1 FROM public.empresa_miembros em
      JOIN public.empresas e ON e.id = em.empresa_id
      WHERE em.auth_id = auth.uid()
        AND e.plan = 'premium'
        AND e.premium_hasta > NOW()
    )
  );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. VERIFICACIÓN                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Verificar que todas las columnas nuevas existen
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'empresas' AND column_name IN ('plan', 'premium_hasta'))
    OR (table_name = 'ofertas' AND column_name IN ('vistas', 'destacada', 'destacada_hasta'))
    OR (table_name = 'candidatos' AND column_name IN ('disponible_busqueda'))
  )
ORDER BY table_name, column_name;
