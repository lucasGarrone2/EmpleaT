-- ==============================================================================
-- MIGRACIÓN: MULTI-USUARIOS POR EMPRESA (ASOCIACIÓN, ROLES Y RLS)
-- ==============================================================================

-- 1. Crear tabla de miembros si no existe
CREATE TABLE IF NOT EXISTS public.empresa_miembros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'reclutador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (auth_id, empresa_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.empresa_miembros ENABLE ROW LEVEL SECURITY;

-- 3. Otorgar permisos
GRANT ALL ON TABLE public.empresa_miembros TO postgres, service_role, anon, authenticated;

-- 4. Funciones helper sin recursión (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_user_is_member_of_company(user_uid UUID, company_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.empresa_miembros 
    WHERE auth_id = user_uid AND empresa_id = company_uuid
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_user_is_admin_of_company(user_uid UUID, company_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.empresa_miembros 
    WHERE auth_id = user_uid AND empresa_id = company_uuid AND rol = 'administrador'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_user_can_view_candidate(user_uid UUID, candidate_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check if user is the candidate themselves
  IF EXISTS (SELECT 1 FROM public.candidatos WHERE id = candidate_uuid AND auth_id = user_uid) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if the user is a member of a company that has an offer the candidate applied to
  RETURN EXISTS (
    SELECT 1 
    FROM public.postulaciones p
    JOIN public.ofertas o ON p.oferta_id = o.id
    JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
    WHERE p.candidato_id = candidate_uuid AND em.auth_id = user_uid
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_user_can_view_postulation(user_uid UUID, postulation_oferta_id UUID, postulation_candidato_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check if the user is the candidate who made the postulation
  IF EXISTS (SELECT 1 FROM public.candidatos WHERE id = postulation_candidato_id AND auth_id = user_uid) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if the user is a member of the company that owns the offer
  RETURN EXISTS (
    SELECT 1 
    FROM public.ofertas o
    JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
    WHERE o.id = postulation_oferta_id AND em.auth_id = user_uid
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_user_is_member_of_offer_company(user_uid UUID, offer_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.ofertas o
    JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
    WHERE o.id = offer_uuid AND em.auth_id = user_uid
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Disparador para asociar al dueño creador automáticamente
CREATE OR REPLACE FUNCTION public.add_new_empresa_owner_to_members()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.empresa_miembros (auth_id, empresa_id, rol)
  VALUES (NEW.auth_id, NEW.id, 'administrador')
  ON CONFLICT (auth_id, empresa_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_empresa_inserted ON public.empresas;
CREATE TRIGGER on_empresa_inserted
AFTER INSERT ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.add_new_empresa_owner_to_members();

-- 6. Poblar miembros existentes basados en las empresas activas
INSERT INTO public.empresa_miembros (auth_id, empresa_id, rol)
SELECT auth_id, id, 'administrador'
FROM public.empresas
ON CONFLICT (auth_id, empresa_id) DO NOTHING;

-- 7. RLS para la tabla 'empresa_miembros'
DROP POLICY IF EXISTS "Miembros pueden ver miembros de su empresa" ON public.empresa_miembros;
CREATE POLICY "Miembros pueden ver miembros de su empresa"
  ON public.empresa_miembros FOR SELECT
  TO authenticated
  USING (public.check_user_is_member_of_company(auth.uid(), empresa_id));

DROP POLICY IF EXISTS "Admins pueden agregar miembros" ON public.empresa_miembros;
CREATE POLICY "Admins pueden agregar miembros"
  ON public.empresa_miembros FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_is_admin_of_company(auth.uid(), empresa_id));

DROP POLICY IF EXISTS "Admins pueden actualizar miembros" ON public.empresa_miembros;
CREATE POLICY "Admins pueden actualizar miembros"
  ON public.empresa_miembros FOR UPDATE
  TO authenticated
  USING (public.check_user_is_admin_of_company(auth.uid(), empresa_id))
  WITH CHECK (public.check_user_is_admin_of_company(auth.uid(), empresa_id));

DROP POLICY IF EXISTS "Admins pueden eliminar miembros" ON public.empresa_miembros;
CREATE POLICY "Admins pueden eliminar miembros"
  ON public.empresa_miembros FOR DELETE
  TO authenticated
  USING (public.check_user_is_admin_of_company(auth.uid(), empresa_id));

-- 8. Actualizar políticas de 'empresas'
DROP POLICY IF EXISTS "La empresa solo puede editarse por su dueño legal" ON public.empresas;
DROP POLICY IF EXISTS "La empresa solo puede editarse por sus administradores" ON public.empresas;
CREATE POLICY "La empresa solo puede editarse por sus administradores"
  ON public.empresas FOR UPDATE
  TO authenticated
  USING (public.check_user_is_admin_of_company(auth.uid(), id));

-- 9. Actualizar políticas de 'ofertas'
DROP POLICY IF EXISTS "Solo dueños de la empresa pueden subir ofertas" ON public.ofertas;
DROP POLICY IF EXISTS "Miembros de la empresa pueden subir ofertas" ON public.ofertas;
CREATE POLICY "Miembros de la empresa pueden subir ofertas"
  ON public.ofertas FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_is_member_of_company(auth.uid(), empresa_id));

DROP POLICY IF EXISTS "Solo dueños de la empresa pueden editar sus ofertas" ON public.ofertas;
DROP POLICY IF EXISTS "Miembros de la empresa pueden editar sus ofertas" ON public.ofertas;
CREATE POLICY "Miembros de la empresa pueden editar sus ofertas"
  ON public.ofertas FOR UPDATE
  TO authenticated
  USING (public.check_user_is_member_of_company(auth.uid(), empresa_id));

DROP POLICY IF EXISTS "Solo dueños de la empresa pueden eliminar sus ofertas" ON public.ofertas;
DROP POLICY IF EXISTS "Solo admins pueden eliminar sus ofertas" ON public.ofertas;
CREATE POLICY "Solo admins pueden eliminar sus ofertas"
  ON public.ofertas FOR DELETE
  TO authenticated
  USING (public.check_user_is_admin_of_company(auth.uid(), empresa_id));

-- 10. Actualizar políticas de 'oferta_skills'
DROP POLICY IF EXISTS "Solo dueños de la empresa administran las skills (Insert)" ON public.oferta_skills;
DROP POLICY IF EXISTS "Solo dueños de la empresa administran las skills (Update)" ON public.oferta_skills;
DROP POLICY IF EXISTS "Solo dueños de la empresa administran las skills (Delete)" ON public.oferta_skills;
DROP POLICY IF EXISTS "Miembros administran skills (Insert)" ON public.oferta_skills;
DROP POLICY IF EXISTS "Miembros administran skills (Update)" ON public.oferta_skills;
DROP POLICY IF EXISTS "Miembros administran skills (Delete)" ON public.oferta_skills;

CREATE POLICY "Miembros administran skills (Insert)"
  ON public.oferta_skills FOR INSERT
  TO authenticated
  WITH CHECK (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id));

CREATE POLICY "Miembros administran skills (Update)"
  ON public.oferta_skills FOR UPDATE
  TO authenticated
  USING (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id));

CREATE POLICY "Miembros administran skills (Delete)"
  ON public.oferta_skills FOR DELETE
  TO authenticated
  USING (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id));

-- 11. Actualizar políticas de 'postulaciones'
DROP POLICY IF EXISTS "Candidatos y miembros pueden ver postulaciones" ON public.postulaciones;
CREATE POLICY "Candidatos y miembros pueden ver postulaciones"
  ON public.postulaciones FOR SELECT
  TO authenticated
  USING (public.check_user_can_view_postulation(auth.uid(), oferta_id, candidato_id));

DROP POLICY IF EXISTS "Miembros pueden actualizar estado de postulaciones" ON public.postulaciones;
CREATE POLICY "Miembros pueden actualizar estado de postulaciones"
  ON public.postulaciones FOR UPDATE
  TO authenticated
  USING (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id));

-- 12. Actualizar políticas de 'candidatos' y 'candidato_skills' para habilitar acceso de lectura a reclutadores autorizados sin recursión
DROP POLICY IF EXISTS "Empresas pueden ver candidatos que se postularon" ON public.candidatos;
CREATE POLICY "Empresas pueden ver candidatos que se postularon"
  ON public.candidatos FOR SELECT
  TO authenticated
  USING (public.check_user_can_view_candidate(auth.uid(), id));

DROP POLICY IF EXISTS "Empresas pueden ver skills de candidatos que se postularon" ON public.candidato_skills;
CREATE POLICY "Empresas pueden ver skills de candidatos que se postularon"
  ON public.candidato_skills FOR SELECT
  TO authenticated
  USING (public.check_user_can_view_candidate(auth.uid(), candidato_id));

-- 13. RPC segura para resolver email a ID de usuario auth.users (revelando rol)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_address TEXT)
RETURNS TABLE (auth_id UUID, email TEXT, rol TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, u.email, (raw_user_meta_data->>'rol')::text
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;

-- 14. RPC para obtener los detalles de los miembros de una empresa (incluyendo emails desde auth.users)
CREATE OR REPLACE FUNCTION public.get_company_members_details(company_uuid UUID)
RETURNS TABLE (
    miembro_id UUID,
    auth_id UUID,
    rol VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    email TEXT,
    nombre_completo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario que ejecuta la función pertenece a la empresa consultada
  IF NOT EXISTS (
    SELECT 1 FROM public.empresa_miembros 
    WHERE auth_id = auth.uid() AND empresa_id = company_uuid
  ) THEN
    RAISE EXCEPTION 'Acceso Denegado: No eres miembro de esta empresa';
  END IF;

  RETURN QUERY
  SELECT 
    em.id AS miembro_id,
    em.auth_id,
    em.rol,
    em.created_at,
    u.email::text,
    COALESCE(c.nombre_completo, em.rol::text) AS nombre_completo
  FROM public.empresa_miembros em
  JOIN auth.users u ON em.auth_id = u.id
  LEFT JOIN public.candidatos c ON em.auth_id = c.auth_id
  WHERE em.empresa_id = company_uuid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_company_members_details(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_company_members_details(UUID) TO authenticated;
