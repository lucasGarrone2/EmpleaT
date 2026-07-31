-- ==============================================================================
-- MIGRACIÓN: FLUJO DE INVITACIÓN DE MIEMBROS AL EQUIPO
-- Ejecutar este script COMPLETO en el SQL Editor de Supabase.
-- Fecha: 2026-07-28
-- ==============================================================================

-- =========================================================================
-- SECCIÓN 1: FIX BUG auth_id AMBIGUO + AUDITORÍA DE FUNCIONES
-- =========================================================================

-- 1.1 Reescribir get_company_members_details con alias explícitos
-- (Fix definitivo del bug "column reference auth_id is ambiguous")
DROP FUNCTION IF EXISTS public.get_company_members_details(UUID);

CREATE OR REPLACE FUNCTION public.get_company_members_details(company_uuid UUID)
RETURNS TABLE (
    miembro_id UUID,
    member_auth_id UUID,
    rol VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    email TEXT,
    nombre_completo TEXT,
    estado TEXT,
    invitado_en TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
BEGIN
  -- Verificar que el usuario que ejecuta la función pertenece a la empresa
  IF NOT EXISTS (
    SELECT 1 FROM public.empresa_miembros em_check
    WHERE em_check.auth_id = auth.uid() 
      AND em_check.empresa_id = company_uuid
      AND em_check.estado = 'aceptado'
  ) THEN
    RAISE EXCEPTION 'Acceso Denegado: No eres miembro de esta empresa';
  END IF;

  RETURN QUERY
  SELECT 
    em.id AS miembro_id,
    em.auth_id AS member_auth_id,
    em.rol,
    em.created_at,
    COALESCE(u.email, em.email)::text AS email,
    COALESCE(c.nombre_completo, COALESCE(u.email, em.email), em.rol::text) AS nombre_completo,
    em.estado,
    em.invitado_en
  FROM public.empresa_miembros em
  LEFT JOIN auth.users u ON em.auth_id = u.id
  LEFT JOIN public.candidatos c ON em.auth_id = c.auth_id
  WHERE em.empresa_id = company_uuid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_company_members_details(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_company_members_details(UUID) TO authenticated;


-- 1.2 Reescribir get_user_id_by_email_internal para evitar ambigüedad futura
-- Renombrar output column de auth_id a user_id para mayor claridad
DROP FUNCTION IF EXISTS public.get_user_id_by_email_internal(TEXT);

CREATE OR REPLACE FUNCTION public.get_user_id_by_email_internal(email_address TEXT)
RETURNS TABLE (user_id UUID, email TEXT, rol TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id AS user_id, u.email, (u.raw_user_meta_data->>'rol')::text AS rol
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email_internal(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email_internal(TEXT) TO service_role;


-- =========================================================================
-- SECCIÓN 2: CAMBIOS DE ESQUEMA EN empresa_miembros
-- =========================================================================

-- 2.1 Permitir auth_id NULL (para invitaciones pendientes)
ALTER TABLE public.empresa_miembros ALTER COLUMN auth_id DROP NOT NULL;

-- 2.2 Agregar columnas nuevas (idempotente con IF NOT EXISTS)
DO $$
BEGIN
  -- Columna email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'empresa_miembros' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.empresa_miembros ADD COLUMN email TEXT;
  END IF;

  -- Columna estado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'empresa_miembros' AND column_name = 'estado'
  ) THEN
    ALTER TABLE public.empresa_miembros ADD COLUMN estado TEXT NOT NULL DEFAULT 'aceptado';
    ALTER TABLE public.empresa_miembros ADD CONSTRAINT empresa_miembros_estado_check
      CHECK (estado IN ('pendiente', 'aceptado', 'rechazado'));
  END IF;

  -- Columna invitado_por
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'empresa_miembros' AND column_name = 'invitado_por'
  ) THEN
    ALTER TABLE public.empresa_miembros ADD COLUMN invitado_por UUID;
  END IF;

  -- Columna invitado_en
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'empresa_miembros' AND column_name = 'invitado_en'
  ) THEN
    ALTER TABLE public.empresa_miembros ADD COLUMN invitado_en TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2.3 Extender CHECK constraint de rol para incluir solo_lectura (si no lo tiene ya)
-- Primero eliminar constraints de rol existentes, luego recrear
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar y eliminar cualquier CHECK constraint sobre la columna rol
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'public.empresa_miembros'::regclass
      AND con.contype = 'c'
      AND att.attname = 'rol'
  LOOP
    EXECUTE format('ALTER TABLE public.empresa_miembros DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.empresa_miembros ADD CONSTRAINT empresa_miembros_rol_check
  CHECK (rol IN ('administrador', 'reclutador', 'solo_lectura'));

-- 2.4 Actualizar constraint UNIQUE(auth_id, empresa_id) para manejar NULLs
-- El UNIQUE original no funciona bien con auth_id NULL, crear índice parcial
ALTER TABLE public.empresa_miembros DROP CONSTRAINT IF EXISTS empresa_miembros_auth_id_empresa_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_empresa_miembros_active_member
  ON public.empresa_miembros(auth_id, empresa_id) WHERE auth_id IS NOT NULL;

-- 2.5 Índice único parcial para evitar invitaciones duplicadas pendientes
CREATE UNIQUE INDEX IF NOT EXISTS idx_empresa_miembros_pending_invite
  ON public.empresa_miembros(empresa_id, email) WHERE estado = 'pendiente';

-- 2.6 Poblar email en filas existentes (miembros legacy que ya tienen auth_id)
UPDATE public.empresa_miembros em
SET email = u.email
FROM auth.users u
WHERE em.auth_id = u.id AND em.email IS NULL;


-- =========================================================================
-- SECCIÓN 3: ACTUALIZAR FUNCIONES RLS CON FILTRO estado = 'aceptado'
-- Un miembro pendiente NO debe tener acceso a datos de la empresa
-- =========================================================================

-- 3.1 check_user_is_member_of_company
CREATE OR REPLACE FUNCTION public.check_user_is_member_of_company(user_uid UUID, company_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.empresa_miembros 
    WHERE auth_id = user_uid 
      AND empresa_id = company_uuid
      AND estado = 'aceptado'
  );
END;
$$ LANGUAGE plpgsql;

-- 3.2 check_user_is_admin_of_company
CREATE OR REPLACE FUNCTION public.check_user_is_admin_of_company(user_uid UUID, company_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.empresa_miembros 
    WHERE auth_id = user_uid 
      AND empresa_id = company_uuid 
      AND rol = 'administrador'
      AND estado = 'aceptado'
  );
END;
$$ LANGUAGE plpgsql;

-- 3.3 check_user_can_view_candidate
CREATE OR REPLACE FUNCTION public.check_user_can_view_candidate(user_uid UUID, candidate_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check if user is the candidate themselves
  IF EXISTS (SELECT 1 FROM public.candidatos WHERE id = candidate_uuid AND auth_id = user_uid) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if the user is an ACCEPTED member of a company that has an offer the candidate applied to
  RETURN EXISTS (
    SELECT 1 
    FROM public.postulaciones p
    JOIN public.ofertas o ON p.oferta_id = o.id
    JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
    WHERE p.candidato_id = candidate_uuid 
      AND em.auth_id = user_uid
      AND em.estado = 'aceptado'
  );
END;
$$ LANGUAGE plpgsql;

-- 3.4 check_user_can_view_postulation
CREATE OR REPLACE FUNCTION public.check_user_can_view_postulation(user_uid UUID, postulation_oferta_id UUID, postulation_candidato_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check if the user is the candidate who made the postulation
  IF EXISTS (SELECT 1 FROM public.candidatos WHERE id = postulation_candidato_id AND auth_id = user_uid) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if the user is an ACCEPTED member of the company that owns the offer
  RETURN EXISTS (
    SELECT 1 
    FROM public.ofertas o
    JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
    WHERE o.id = postulation_oferta_id 
      AND em.auth_id = user_uid
      AND em.estado = 'aceptado'
  );
END;
$$ LANGUAGE plpgsql;

-- 3.5 check_user_is_member_of_offer_company
CREATE OR REPLACE FUNCTION public.check_user_is_member_of_offer_company(user_uid UUID, offer_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.ofertas o
    JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
    WHERE o.id = offer_uuid 
      AND em.auth_id = user_uid
      AND em.estado = 'aceptado'
  );
END;
$$ LANGUAGE plpgsql;


-- =========================================================================
-- SECCIÓN 4: ACTUALIZAR POLICIES INLINE QUE REFERENCIAN empresa_miembros
-- Agregar filtro em.estado = 'aceptado' en subqueries de postulaciones y mensajes
-- =========================================================================

-- 4.1 Policy de UPDATE en postulaciones
DROP POLICY IF EXISTS "Miembros con permiso actualizan postulaciones" ON public.postulaciones;

CREATE POLICY "Miembros con permiso actualizan postulaciones"
    ON public.postulaciones FOR UPDATE
    TO authenticated
    USING (
        -- El candidato dueño de la postulación puede actualizar
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        -- Miembros ACEPTADOS de empresa con rol admin o reclutador
        OR EXISTS (
            SELECT 1 FROM public.ofertas o
            JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
            WHERE o.id = postulaciones.oferta_id
              AND em.auth_id = auth.uid()
              AND em.rol IN ('administrador', 'reclutador')
              AND em.estado = 'aceptado'
        )
        -- Administradores del sistema
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- 4.2 Policies de mensajes
DROP POLICY IF EXISTS "empresa_select_mensajes" ON public.mensajes;
CREATE POLICY "empresa_select_mensajes"
    ON public.mensajes FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.postulaciones p
            JOIN public.ofertas o ON o.id = p.oferta_id
            JOIN public.empresa_miembros em ON em.empresa_id = o.empresa_id
            WHERE p.id = mensajes.postulacion_id
              AND em.auth_id = auth.uid()
              AND em.estado = 'aceptado'
        )
    );

DROP POLICY IF EXISTS "empresa_insert_mensajes" ON public.mensajes;
CREATE POLICY "empresa_insert_mensajes"
    ON public.mensajes FOR INSERT TO authenticated
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
              AND em.estado = 'aceptado'
        )
    );

-- 4.3 Actualizar policies de empresa_miembros para permitir que el service_role
-- inserte invitaciones (el backend usa supabaseAdmin que bypasea RLS, pero por si acaso)
-- Las policies existentes ya están bien porque el backend usa service_role key.

-- =========================================================================
-- FIN DE LA MIGRACIÓN
-- =========================================================================
