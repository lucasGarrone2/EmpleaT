-- =========================================================================
-- EMPLEAT - CORRECCIÓN DE GRANTS Y POLÍTICAS DE SEGURIDAD (PERFILES Y SKILLS)
-- Ejecutar este script completo en el SQL Editor de Supabase.
-- =========================================================================

-- 1. Otorgar privilegios explícitos de SQL en todas las tablas a los roles del sistema y clientes.
-- Esto resuelve de manera definitiva los errores 42501 (Permission Denied) para la API y el Service Role.
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, anon, authenticated;

-- 2. Asegurarse de que RLS esté activo en las tablas correspondientes
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diccionario_skills ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para la tabla diccionario_skills (Catálogo de habilidades)
-- Permite lectura pública para que todos los usuarios autenticados o anónimos puedan consultar y emparejar habilidades.
DROP POLICY IF EXISTS "diccionario_skills_select" ON public.diccionario_skills;
CREATE POLICY "diccionario_skills_select" ON public.diccionario_skills
    FOR SELECT TO authenticated, anon
    USING (true);

-- Permite la inserción de nuevas habilidades (ej. habilidades "Personalizado" no estándar)
-- requerida al subir CVs o al agregar habilidades manuales que no existen en el diccionario.
DROP POLICY IF EXISTS "diccionario_skills_insert" ON public.diccionario_skills;
CREATE POLICY "diccionario_skills_insert" ON public.diccionario_skills
    FOR INSERT TO authenticated
    WITH CHECK (true);
