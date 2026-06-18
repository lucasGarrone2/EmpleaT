-- =================================================================================
-- MIGRACIÓN DE VERIFICACIÓN CORPORATIVA (CUIT / RAZÓN SOCIAL / SITIO WEB) Y GRANTS
-- =================================================================================

-- 1. Añadimos columnas para recolectar información fiscal y de cumplimiento
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cuit TEXT UNIQUE;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS sitio_web TEXT;

-- 2. Restricción de seguridad: El CUIT debe consistir de exactamente 11 dígitos numéricos
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS chk_cuit_format;
ALTER TABLE empresas ADD CONSTRAINT chk_cuit_format CHECK (cuit ~ '^\d{11}$');

-- 3. Otorgamos privilegios explícitos a todos los roles para resolver fallos 42501 (Permission Denied)
GRANT ALL ON TABLE empresas TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ofertas TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE oferta_skills TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE postulaciones TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE motivos_rechazo TO postgres, service_role, anon, authenticated;

-- 4. Nos aseguramos de que las secuencias si existen también tengan permisos
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
