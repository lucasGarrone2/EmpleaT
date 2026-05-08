-- 1. Agregar las columnas de moderación (si no existen)
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS baneado BOOLEAN DEFAULT false;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS baneada BOOLEAN DEFAULT false;
ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS oculta_admin BOOLEAN DEFAULT false;

-- 2. Convertir al usuario en administrador
-- Actualizamos la tabla de perfiles de Supabase Auth (auth.users)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"rol": "admin"}'::jsonb
WHERE email = 'tohovos641@nazisat.com';
