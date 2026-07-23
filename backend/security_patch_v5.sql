-- =========================================================================
-- PARCHE DE SEGURIDAD V5 — SEC-17 y SEC-23
-- SEC-17: get_user_id_by_email valida membresía real en lugar de user_metadata.rol
-- SEC-23: Restringir lectura de tabla administradores al propio usuario
-- Ejecutar en: Supabase SQL Editor
-- =========================================================================

-- -----------------------------------------------------------------------
-- SEC-17: Reparar get_user_id_by_email para no confiar en user_metadata
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_address TEXT)
RETURNS TABLE (auth_id UUID, email TEXT, rol TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- SEC-17: Verificar membresía real en empresa_miembros, NO el JWT metadata
  -- (user_metadata.rol es manipulable por cualquier usuario desde el cliente)
  IF NOT EXISTS (
    SELECT 1 FROM public.empresa_miembros WHERE auth_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acceso denegado. Solo miembros de empresa pueden usar esta función.';
  END IF;

  RETURN QUERY
  SELECT id, u.email, (raw_user_meta_data->>'rol')::text
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;


-- -----------------------------------------------------------------------
-- SEC-23: Restringir acceso a tabla administradores
-- Antes: cualquier autenticado podía listar todos los admins
-- Ahora: cada usuario solo ve su propia fila (o ninguna)
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS "administradores_select" ON public.administradores;

CREATE POLICY "administradores_select" ON public.administradores
    FOR SELECT TO authenticated
    USING (auth_id = auth.uid());
-- Nota: Esto no rompe ninguna funcionalidad del frontend, ya que las
-- verificaciones de "¿soy admin?" consultan si existe una fila con
-- auth_id = auth.uid(), lo que sigue funcionando correctamente.

-- =========================================================================
-- FIN DEL SCRIPT V5
-- =========================================================================
