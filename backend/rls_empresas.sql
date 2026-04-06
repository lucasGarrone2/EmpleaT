-- =================================================================================
-- BLINDANDO EL ECOSISTEMA B2B (Empresas y Ofertas de Trabajo)
-- =================================================================================

-- 1. Habilitamos Row Level Security explícitamente para las 3 tablas corporativas.
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE oferta_skills ENABLE ROW LEVEL SECURITY;

-- =================================================================================
-- 2. POLÍTICAS PARA "empresas"
-- =================================================================================
-- Las empresas deben ser públicas y de sólo-lectura para cualquier candidato
CREATE POLICY "Los perfiles de empresa son públicos (Lectura)" 
  ON empresas FOR SELECT 
  USING (true);

-- Solo el UUID dueño de la empresa puede crearla, editarla o eliminarla
CREATE POLICY "La empresa solo puede insertarse por su dueño legal" 
  ON empresas FOR INSERT 
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "La empresa solo puede editarse por su dueño legal" 
  ON empresas FOR UPDATE 
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "La empresa solo puede eliminarse por su dueño legal" 
  ON empresas FOR DELETE 
  USING (auth.uid() = auth_id);


-- =================================================================================
-- 3. POLÍTICAS PARA "ofertas"
-- =================================================================================
-- Cualquiera puede ver las ofertas publicadas (Lectura Pública)
CREATE POLICY "Las ofertas de trabajo son públicas (Lectura)" 
  ON ofertas FOR SELECT 
  USING (true);

-- Mapeamos la oferta a la empresa, y la empresa al usuario autenticado
CREATE POLICY "Solo dueños de la empresa pueden subir ofertas" 
  ON ofertas FOR INSERT 
  WITH CHECK (empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid()));

CREATE POLICY "Solo dueños de la empresa pueden editar sus ofertas" 
  ON ofertas FOR UPDATE 
  USING (empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid()))
  WITH CHECK (empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid()));

CREATE POLICY "Solo dueños de la empresa pueden eliminar sus ofertas" 
  ON ofertas FOR DELETE 
  USING (empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid()));


-- =================================================================================
-- 4. POLÍTICAS PARA "oferta_skills"
-- =================================================================================
-- Las skills requeridas por la oferta son de vista pública
CREATE POLICY "Las skills de cada oferta son públicas (Lectura)" 
  ON oferta_skills FOR SELECT 
  USING (true);

-- Verificamos doble capa de herencia: Oferta -> Empresa -> Auth_User
CREATE POLICY "Solo dueños de la empresa administran las skills (Insert)" 
  ON oferta_skills FOR INSERT 
  WITH CHECK (oferta_id IN (
    SELECT id FROM ofertas WHERE empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid())
  ));

CREATE POLICY "Solo dueños de la empresa administran las skills (Update)" 
  ON oferta_skills FOR UPDATE 
  USING (oferta_id IN (
    SELECT id FROM ofertas WHERE empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid())
  ))
  WITH CHECK (oferta_id IN (
    SELECT id FROM ofertas WHERE empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid())
  ));

CREATE POLICY "Solo dueños de la empresa administran las skills (Delete)" 
  ON oferta_skills FOR DELETE 
  USING (oferta_id IN (
    SELECT id FROM ofertas WHERE empresa_id IN (SELECT id FROM empresas WHERE auth_id = auth.uid())
  ));
