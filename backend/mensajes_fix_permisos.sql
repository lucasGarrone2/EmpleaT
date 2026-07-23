-- =============================================================================
-- FIX: Otorgar permisos al service_role para bypassear RLS en mensajes
-- Ejecutar en Supabase SQL Editor si el INSERT falla con "permission denied"
-- =============================================================================

-- Opción 1 (recomendada): GRANT explícito al service_role
GRANT ALL ON TABLE mensajes TO service_role;
GRANT USAGE ON SEQUENCE mensajes_id_seq TO service_role;  -- solo si usás serial en vez de uuid

-- Opción 2 (alternativa): forzar bypass RLS para el service_role
ALTER TABLE mensajes FORCE ROW LEVEL SECURITY;

-- Verificación inmediata:
-- Si el GRANT funcionó, este SELECT debe retornar filas (o vacío sin error):
SELECT COUNT(*) FROM mensajes;
