-- ==========================================
-- SCRIPT DE MIGRACIÓN: DICCIONARIO ESCO
-- ==========================================

-- 1. Activar extensión para Fuzzy Search (Trigramas). 
--  Fundamental para encontrar "ReactJS" en el CV y emparejarlo con "desarrollo web con React" en ESCO.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Modificar la tabla diccionario_skills
-- Cambiamos el ENUM estricto por TEXT para que soporte los variados tipos de ESCO sin errores 
-- y añadimos columnas útiles para no perder metadata de ESCO.
ALTER TABLE diccionario_skills ALTER COLUMN tipo TYPE TEXT USING tipo::text;
DROP TYPE IF EXISTS tipo_skill_enum CASCADE;

ALTER TABLE diccionario_skills 
ADD COLUMN IF NOT EXISTS concept_uri TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 3. Crear índice para acelerar MUCHO la búsqueda de similitud (haz esto ANTES O DESPUÉS de importar el CSV)
CREATE INDEX IF NOT EXISTS trgm_idx_diccionario_skills_nombre 
ON diccionario_skills USING GIN (nombre_skill gin_trgm_ops);

-- 4. Crear la función RPC (Remote Procedure Call) para el Backend/React
-- Esta función recibe un ARRAY de strings extraídos por la IA y devuelve su match más parecido en ESCO.
CREATE OR REPLACE FUNCTION match_skills(skill_names TEXT[])
RETURNS TABLE(original_skill TEXT, esco_id INTEGER, esco_nombre TEXT, similitud REAL)
LANGUAGE plpgsql
AS $$
DECLARE
    sk TEXT;
BEGIN
    FOR sk IN SELECT unnest(skill_names)
    LOOP
        RETURN QUERY
        SELECT 
            sk AS original_skill,
            d.id AS esco_id,
            d.nombre_skill AS esco_nombre,
            similarity(d.nombre_skill, sk) AS similitud
        FROM diccionario_skills d
        ORDER BY d.nombre_skill <-> sk
        LIMIT 1;
    END LOOP;
END;
$$;

-- 5. Revocar permisos de inserción en diccionario_skills 
-- (El diccionario ESCO es oficial y estático, nadie debería agregar habilidades fuera del estándar)
DROP POLICY IF EXISTS "Usuarios logueados pueden insertar diccionario_skills" ON diccionario_skills;

-- 6. Otorgar permiso de ejecución de la nueva función a usuarios autenticados
GRANT EXECUTE ON FUNCTION match_skills(TEXT[]) TO authenticated;
