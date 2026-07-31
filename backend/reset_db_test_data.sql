-- =========================================================================
-- EMPLEAT - SCRIPT DINÁMICO DE LIMPIEZA TOTAL (RESET A CERO)
-- Copiar y ejecutar en el SQL Editor de Supabase (SQL Editor -> New Query)
-- Detecta automáticamente todas las tablas existentes en 'public' sin errores.
-- =========================================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Desactivar temporalmente restricción de claves foráneas/triggers para borrado masivo
    SET session_replication_role = 'replica';
    
    -- 2. Vaciar dinámicamente todas las tablas existentes en el esquema public
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE;';
    END LOOP;

    -- 3. Eliminar todos los usuarios creados en Supabase Auth
    DELETE FROM auth.users;

    -- 4. Restablecer el modo de triggers a su comportamiento normal
    SET session_replication_role = 'origin';
END $$;
