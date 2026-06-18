-- =========================================================================
-- CORRECCIÓN DE SEGURIDAD: PROTEGER RPC CONTRA ENUMERACIÓN DE USUARIOS
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_address TEXT)
RETURNS TABLE (auth_id UUID, email TEXT, rol TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que el usuario que ejecuta la función tenga rol corporativo ('empresa') en su JWT
  IF (auth.jwt()->'user_metadata'->>'rol') IS DISTINCT FROM 'empresa' THEN
    RAISE EXCEPTION 'Acceso denegado. Esta función solo puede ser ejecutada por cuentas corporativas.';
  END IF;

  RETURN QUERY
  SELECT id, u.email, (raw_user_meta_data->>'rol')::text
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;
