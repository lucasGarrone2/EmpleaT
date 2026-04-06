-- 1. Habilitamos Row Level Security (RLS) explícitamente para las 3 tablas.
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidato_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE postulaciones ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'candidatos'
-- Asumiendo que la id de la tabla candidatos sea el uuid del usuario (auth.uid)
CREATE POLICY "El usuario solo puede ver su propio perfil de candidato"
  ON candidatos FOR SELECT 
  USING (auth.uid() = auth_id);

CREATE POLICY "El usuario solo puede insertar su propio perfil" 
  ON candidatos FOR INSERT 
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "El usuario solo puede actualizar su propio perfil" 
  ON candidatos FOR UPDATE 
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "El usuario solo puede eliminar su propio perfil" 
  ON candidatos FOR DELETE 
  USING (auth.uid() = auth_id);

-- Si en tu sistema las empresas necesitan leer los candidatos, deberás crear una política adicional:
-- CREATE POLICY "Empresas pueden ver todos los candidatos" ON candidatos FOR SELECT USING (es_empresa(auth.uid()));


-- 3. Políticas para 'candidato_skills'
-- Los usuarios solo pueden manejar las skills atadas a su propio candidato_id
CREATE POLICY "El usuario solo puede ver sus propias skills" 
  ON candidato_skills FOR SELECT 
  USING (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "El usuario solo puede insertar sus propias skills" 
  ON candidato_skills FOR INSERT 
  WITH CHECK (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "El usuario solo puede editar sus propias skills" 
  ON candidato_skills FOR UPDATE 
  USING (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()))
  WITH CHECK (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "El usuario solo puede eliminar sus propias skills" 
  ON candidato_skills FOR DELETE 
  USING (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));


-- 4. Políticas para 'postulaciones'
-- Los usuarios solo pueden postularse y ver/eliminar sus postulaciones
CREATE POLICY "El usuario solo puede ver sus postulaciones" 
  ON postulaciones FOR SELECT 
  USING (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "El usuario solo puede crearse postulaciones" 
  ON postulaciones FOR INSERT 
  WITH CHECK (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "El usuario solo puede editar sus postulaciones" 
  ON postulaciones FOR UPDATE 
  USING (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()))
  WITH CHECK (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "El usuario solo puede eliminar sus postulaciones" 
  ON postulaciones FOR DELETE 
  USING (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

-- Importante: Aquel usuario/empresa dueña del empleo debería poder leer las postulaciones de su aviso.
-- Por ende requerirás de una política extra orientada a las Empresas (si es que existe esa funcionalidad).
