-- ==============================================================================
-- SCRIPT DE REPARACIÓN: REGISTRO DE EMPRESAS Y RESTRICCIÓN DE UNICIDAD
-- ==============================================================================

-- 1. Asegurar restricción UNIQUE en (auth_id, empresa_id) para la tabla empresa_miembros
ALTER TABLE public.empresa_miembros 
DROP CONSTRAINT IF EXISTS empresa_miembros_auth_empresa_key;

ALTER TABLE public.empresa_miembros 
ADD CONSTRAINT empresa_miembros_auth_empresa_key UNIQUE (auth_id, empresa_id);

-- 2. Asegurar que la función del trigger sea inmune a errores de ON CONFLICT
CREATE OR REPLACE FUNCTION public.add_new_empresa_owner_to_members()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.empresa_miembros 
    WHERE auth_id = NEW.auth_id AND empresa_id = NEW.id
  ) THEN
    INSERT INTO public.empresa_miembros (auth_id, empresa_id, rol)
    VALUES (NEW.auth_id, NEW.id, 'administrador');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear el trigger en la tabla empresas
DROP TRIGGER IF EXISTS on_empresa_inserted ON public.empresas;

CREATE TRIGGER on_empresa_inserted
AFTER INSERT ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.add_new_empresa_owner_to_members();
