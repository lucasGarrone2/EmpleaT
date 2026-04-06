-- ==============================================================================
-- 1. SOLUCIÓN AL DERECHO AL OLVIDO: Función RPC para borrar cuenta permanentemente
-- ==============================================================================
-- Supabase por defecto impide a un usuario autenticado eliminarse a sí mismo desde
-- el cliente de JS por razones de seguridad. Para proveer el "Derecho al Olvido",
-- creamos esta función con privilegios de administrador (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Borra al usuario autenticado de la tabla auth.users
  -- Si las Foreign Keys están configuradas correctamente con ON DELETE CASCADE,
  -- esto borrará automáticamente sus datos de 'candidatos', 'candidato_skills' y 'postulaciones'.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- ==============================================================================
-- 2. ASEGURAR INTEGRIDAD REFERENCIAL (ON DELETE CASCADE)
-- ==============================================================================
-- Si al crear las tablas no especificaste ON DELETE CASCADE, el borrado de 
-- la cuenta fallará si el usuario tiene datos vinculados. 
-- *NOTA: Ejecuta estos comandos con precaución y revisa si el nombre de tu
-- restricción (constraint) coincide. Ajusta el nombre "candidatos_auth_id_fkey" si en tu DB se llama diferente.

ALTER TABLE candidatos
  DROP CONSTRAINT IF EXISTS candidatos_auth_id_fkey;

ALTER TABLE candidatos
  ADD CONSTRAINT candidatos_auth_id_fkey
  FOREIGN KEY (auth_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Mismo proceso preventivo para candidato_skills (si la FK se llama así)
ALTER TABLE candidato_skills
  DROP CONSTRAINT IF EXISTS candidato_skills_candidato_id_fkey;

ALTER TABLE candidato_skills
  ADD CONSTRAINT candidato_skills_candidato_id_fkey
  FOREIGN KEY (candidato_id)
  REFERENCES candidatos(id)
  ON DELETE CASCADE;

-- Mismo proceso preventivo para postulaciones (si la FK se llama así)
ALTER TABLE postulaciones
  DROP CONSTRAINT IF EXISTS postulaciones_candidato_id_fkey;

ALTER TABLE postulaciones
  ADD CONSTRAINT postulaciones_candidato_id_fkey
  FOREIGN KEY (candidato_id)
  REFERENCES candidatos(id)
  ON DELETE CASCADE;
