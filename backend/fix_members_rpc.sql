-- ==============================================================================
-- CORRECCIÓN: Evitar ambigüedad de columna auth_id en get_company_members_details
-- Ejecutar en Supabase SQL Editor
-- ==============================================================================

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
#variable_conflict use_column
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
