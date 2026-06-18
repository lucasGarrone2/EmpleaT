-- =========================================================================
-- PARCHE DE SEGURIDAD DE BASE DE DATOS (CORREGIDO - SIN TRIGGER EN SCHEMA auth)
-- Ejecutar este script en el SQL Editor de Supabase
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABLA DE ADMINISTRADORES (Esquema Público)
-- Reemplaza el uso inseguro de metadatos de usuario (raw_user_meta_data -> 'rol')
-- por una tabla de control estricta en el esquema público.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.administradores (
    auth_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS en la tabla administradores
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

-- Conceder permisos de selección a los roles authenticated y anon
GRANT SELECT ON public.administradores TO authenticated, anon;

-- Permitir lectura a usuarios autenticados para que puedan comprobar si son admin
CREATE POLICY "Lectura pública de administradores" 
    ON public.administradores FOR SELECT 
    TO authenticated 
    USING (true);

-- Asignar al administrador actual del sistema
INSERT INTO public.administradores (auth_id)
SELECT id FROM auth.users WHERE email = 'tohovos641@nazisat.com'
ON CONFLICT DO NOTHING;


-- -------------------------------------------------------------------------
-- 2. REFACTORIZACIÓN DE POLÍTICAS DE ADMINISTRADOR (RLS)
-- Actualiza las políticas para usar la tabla de administradores
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_all_ofertas" ON public.ofertas;
CREATE POLICY "admin_all_ofertas" ON public.ofertas
FOR ALL USING ( EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid()) );

DROP POLICY IF EXISTS "admin_all_candidatos" ON public.candidatos;
CREATE POLICY "admin_all_candidatos" ON public.candidatos
FOR ALL USING ( EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid()) );

DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas;
CREATE POLICY "admin_all_empresas" ON public.empresas
FOR ALL USING ( EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid()) );


-- -------------------------------------------------------------------------
-- 3. REFACTORIZACIÓN DE RPC DE BUSQUEDA DE CORREOS
-- Verifica membresía en empresa_miembros en lugar de metadatos del JWT
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_address TEXT)
RETURNS TABLE (auth_id UUID, email TEXT, rol TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que el usuario que ejecuta la función pertenezca a alguna empresa activa
  IF NOT EXISTS (
    SELECT 1 FROM public.empresa_miembros 
    WHERE auth_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acceso denegado. Esta función solo puede ser ejecutada por cuentas corporativas.';
  END IF;

  RETURN QUERY
  SELECT id, u.email, COALESCE((raw_user_meta_data->>'rol')::text, 'candidato')
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;


-- -------------------------------------------------------------------------
-- 4. PROTECCIÓN DE COLUMNAS SENSIBLES EN CANDIDATOS, EMPRESAS Y OFERTAS
-- Impide que los usuarios comunes modifiquen campos críticos.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la petición viene de un rol de cliente y NO es un administrador registrado
    IF current_setting('role', true) IN ('authenticated', 'anon') AND NOT EXISTS (
        SELECT 1 FROM public.administradores WHERE auth_id = auth.uid()
    ) THEN
        
        -- Tabla: candidatos (Previene activar premium por su cuenta o desbanearse)
        IF TG_TABLE_NAME = 'candidatos' THEN
            NEW.es_premium := OLD.es_premium;
            NEW.premium_desde := OLD.premium_desde;
            NEW.premium_hasta := OLD.premium_hasta;
            NEW.intentos_quiz_diarios := OLD.intentos_quiz_diarios;
            NEW.baneado := OLD.baneado;
        END IF;

        -- Tabla: empresas (Previene desbanear la empresa)
        IF TG_TABLE_NAME = 'empresas' THEN
            NEW.baneada := OLD.baneada;
        END IF;

        -- Tabla: ofertas (Previene restaurar ofertas ocultadas por moderación)
        IF TG_TABLE_NAME = 'ofertas' THEN
            NEW.oculta_admin := OLD.oculta_admin;
        END IF;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registrar los triggers en las tablas del esquema público
DROP TRIGGER IF EXISTS protect_candidatos_cols_trigger ON public.candidatos;
CREATE TRIGGER protect_candidatos_cols_trigger
BEFORE UPDATE ON public.candidatos
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_columns();

DROP TRIGGER IF EXISTS protect_empresas_cols_trigger ON public.empresas;
CREATE TRIGGER protect_empresas_cols_trigger
BEFORE UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_columns();

DROP TRIGGER IF EXISTS protect_ofertas_cols_trigger ON public.ofertas;
CREATE TRIGGER protect_ofertas_cols_trigger
BEFORE UPDATE ON public.ofertas
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_columns();
