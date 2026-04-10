-- ============================================================
-- EmpleaT - Parche de Seguridad de Base de Datos (Lote 2)
-- Bugs: 002 (Exceso de Carga) y 005 (Spoofing de Enumerables)
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- BUG 005: SPOOFING DE ENUMERABLES (modalidad y estado)
-- Previene que vía API se inserte texto arbitrario como
-- "En Plutón" en columnas que solo aceptan valores fijos.
-- -------------------------------------------------------

-- Restricción en modalidad de ofertas
ALTER TABLE ofertas
    ADD CONSTRAINT chk_modalidad
    CHECK (modalidad IN ('Remoto', 'Híbrido', 'Presencial'));

-- Restricción en estado de ofertas
ALTER TABLE ofertas
    ADD CONSTRAINT chk_estado
    CHECK (estado IN ('Publicada', 'Cerrada', 'Borrador'));

-- Bug 007: Integridad de rango salarial (max no puede ser menor que min)
ALTER TABLE ofertas
    ADD CONSTRAINT chk_salario_rango
    CHECK (salario_max_usd IS NULL OR salario_max_usd >= salario_min_usd);


-- -------------------------------------------------------
-- BUG 002: EXCESO DE CARGA (límites de longitud en DB)
-- Previene que un atacante bypasee el frontend e inserte
-- strings de millones de caracteres directamente via API.
-- Esta es la capa de defensa profunda a nivel base de datos.
-- -------------------------------------------------------

-- Tabla ofertas
ALTER TABLE ofertas
    ALTER COLUMN titulo TYPE VARCHAR(200),
    ALTER COLUMN descripcion TYPE VARCHAR(3000),
    ALTER COLUMN modalidad TYPE VARCHAR(50);

-- Tabla candidatos
ALTER TABLE candidatos
    ALTER COLUMN nombre_completo TYPE VARCHAR(200),
    ALTER COLUMN titulo_profesional TYPE VARCHAR(200),
    ALTER COLUMN sobre_mi TYPE VARCHAR(3000);

-- Tabla empresas (por coherencia con el modelo general)
ALTER TABLE empresas
    ALTER COLUMN nombre_empresa TYPE VARCHAR(200),
    ALTER COLUMN descripcion TYPE VARCHAR(3000);

-- Tabla oferta_skills (el nombre original de una skill no debería ser una novela)
ALTER TABLE oferta_skills
    ALTER COLUMN nombre_original TYPE VARCHAR(200);

-- Tabla candidato_skills
ALTER TABLE candidato_skills
    ALTER COLUMN nombre_original TYPE VARCHAR(200);

-- ============================================================
-- FIN DEL SCRIPT
-- Verificar ejecutando:
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name IN ('ofertas', 'candidatos', 'empresas');
-- ============================================================
