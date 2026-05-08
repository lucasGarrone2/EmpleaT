-- Eliminar las politicas fallidas
DROP POLICY IF EXISTS "admin_all_ofertas" ON ofertas;
DROP POLICY IF EXISTS "admin_all_candidatos" ON candidatos;
DROP POLICY IF EXISTS "admin_all_empresas" ON empresas;

-- Permisos para la tabla ofertas
CREATE POLICY "admin_all_ofertas" ON ofertas
FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin' );

-- Permisos para la tabla candidatos
CREATE POLICY "admin_all_candidatos" ON candidatos
FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin' );

-- Permisos para la tabla empresas
CREATE POLICY "admin_all_empresas" ON empresas
FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin' );
