-- 1. Añadimos la columna email a la tabla candidatos si no existe
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Sincronizamos los emails existentes de auth.users a la tabla candidatos
UPDATE candidatos c
SET email = u.email
FROM auth.users u
WHERE c.auth_id = u.id;

-- 3. Crear disparador (Trigger) para mantener candidatos.email sincronizado en el futuro
CREATE OR REPLACE FUNCTION public.sync_candidato_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.candidatos
  SET email = NEW.email
  WHERE auth_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_candidato_email();

-- 4. Política RLS: Solo la empresa creadora de la oferta puede actualizar postulaciones
DROP POLICY IF EXISTS update_postulaciones_for_empresa ON postulaciones;
CREATE POLICY update_postulaciones_for_empresa ON postulaciones
FOR UPDATE
TO authenticated
USING (
  oferta_id IN (
    SELECT o.id 
    FROM ofertas o
    JOIN empresas e ON o.empresa_id = e.id
    WHERE e.auth_id = auth.uid()
  )
);
