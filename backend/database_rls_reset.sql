-- =========================================================================
-- EMPLEAT - PLAN DE HARDENING DE SEGURIDAD (RESET Y RECONSTRUCCIÓN DE RLS)
-- Ejecutar este script completo en el SQL Editor de Supabase.
-- =========================================================================

-- -------------------------------------------------------------------------
-- PASO 1: ELIMINACIÓN DINÁMICA DE TODAS LAS POLÍTICAS DE RLS EXISTENTES
-- Esto elimina cualquier política residual, "Enable read access", o duplicada
-- creada desde la interfaz de Supabase o migraciones antiguas.
-- -------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;


-- -------------------------------------------------------------------------
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS DEL ESQUEMA PÚBLICO
-- Nos aseguramos de que no exista ninguna tabla sin RLS.
-- -------------------------------------------------------------------------
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oferta_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_procesados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_intentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulacion_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulaciones_entrevista ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivos_rechazo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------------------------
-- PASO 3: RECREACIÓN DE POLÍTICAS - TABLA: candidatos
-- -------------------------------------------------------------------------
-- 1. Los candidatos solo pueden ver su propio perfil.
-- 2. Los reclutadores de empresas a las que se postularon pueden ver su perfil.
-- 3. Los administradores del sistema pueden ver todos los perfiles.
CREATE POLICY "candidatos_select" ON public.candidatos
    FOR SELECT TO authenticated
    USING (
        auth.uid() = auth_id 
        OR public.check_user_can_view_candidate(auth.uid(), id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- 1. Un usuario solo puede insertar su propio perfil.
CREATE POLICY "candidatos_insert" ON public.candidatos
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = auth_id);

-- 1. Un usuario solo puede actualizar su propio perfil.
-- 2. Los administradores del sistema pueden actualizar cualquier perfil.
CREATE POLICY "candidatos_update" ON public.candidatos
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = auth_id 
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        auth.uid() = auth_id 
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- 1. Un usuario solo puede eliminar su propio perfil.
-- 2. Los administradores del sistema pueden eliminar cualquier perfil.
CREATE POLICY "candidatos_delete" ON public.candidatos
    FOR DELETE TO authenticated
    USING (
        auth.uid() = auth_id 
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 4: RECREACIÓN DE POLÍTICAS - TABLA: candidato_skills
-- -------------------------------------------------------------------------
-- 1. El candidato puede ver sus propias habilidades.
-- 2. El reclutador autorizado puede ver las habilidades de candidatos postulados.
-- 3. Los administradores del sistema pueden ver todas.
CREATE POLICY "candidato_skills_select" ON public.candidato_skills
    FOR SELECT TO authenticated
    USING (
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        OR public.check_user_can_view_candidate(auth.uid(), candidato_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- 1. El candidato solo puede añadir habilidades a su propio perfil.
CREATE POLICY "candidato_skills_insert" ON public.candidato_skills
    FOR INSERT TO authenticated
    WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

-- 1. El candidato solo puede actualizar sus propias habilidades.
CREATE POLICY "candidato_skills_update" ON public.candidato_skills
    FOR UPDATE TO authenticated
    USING (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()))
    WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

-- 1. El candidato solo puede eliminar sus propias habilidades.
CREATE POLICY "candidato_skills_delete" ON public.candidato_skills
    FOR DELETE TO authenticated
    USING (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));


-- -------------------------------------------------------------------------
-- PASO 5: RECREACIÓN DE POLÍTICAS - TABLA: postulaciones
-- -------------------------------------------------------------------------
-- 1. Los candidatos pueden ver sus propias postulaciones.
-- 2. Los miembros de la empresa dueña de la oferta pueden ver las postulaciones.
-- 3. Los administradores pueden ver todas.
CREATE POLICY "postulaciones_select" ON public.postulaciones
    FOR SELECT TO authenticated
    USING (
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        OR public.check_user_is_member_of_offer_company(auth.uid(), oferta_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- 1. Los candidatos pueden postularse.
CREATE POLICY "postulaciones_insert" ON public.postulaciones
    FOR INSERT TO authenticated
    WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));

-- 1. El candidato puede actualizar su postulación (ej. retirar candidatura).
-- 2. Los miembros de la empresa pueden actualizar el estado de la postulación.
-- 3. Los administradores del sistema pueden modificar todas.
CREATE POLICY "postulaciones_update" ON public.postulaciones
    FOR UPDATE TO authenticated
    USING (
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        OR public.check_user_is_member_of_offer_company(auth.uid(), oferta_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 6: RECREACIÓN DE POLÍTICAS - TABLA: empresas
-- -------------------------------------------------------------------------
-- Las empresas son públicas para lectura de candidatos y visitantes.
CREATE POLICY "empresas_select" ON public.empresas
    FOR SELECT USING (true);

-- Solo el creador (dueño legal) puede registrar su empresa.
CREATE POLICY "empresas_insert" ON public.empresas
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = auth_id);

-- Solo el dueño o miembros administradores corporativos pueden editar la empresa.
CREATE POLICY "empresas_update" ON public.empresas
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = auth_id 
        OR public.check_user_is_admin_of_company(auth.uid(), id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        auth.uid() = auth_id 
        OR public.check_user_is_admin_of_company(auth.uid(), id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- Solo el dueño o administradores del sistema pueden eliminar la empresa.
CREATE POLICY "empresas_delete" ON public.empresas
    FOR DELETE TO authenticated
    USING (
        auth.uid() = auth_id 
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 7: RECREACIÓN DE POLÍTICAS - TABLA: ofertas
-- -------------------------------------------------------------------------
-- Las ofertas de trabajo son públicas (lectura).
CREATE POLICY "ofertas_select" ON public.ofertas
    FOR SELECT USING (true);

-- Solo los miembros de la empresa pueden publicar ofertas.
CREATE POLICY "ofertas_insert" ON public.ofertas
    FOR INSERT TO authenticated
    WITH CHECK (
        empresa_id IN (SELECT id FROM public.empresas WHERE auth_id = auth.uid())
        OR public.check_user_is_member_of_company(auth.uid(), empresa_id)
    );

-- Solo los miembros de la empresa dueña pueden actualizar sus ofertas.
CREATE POLICY "ofertas_update" ON public.ofertas
    FOR UPDATE TO authenticated
    USING (
        empresa_id IN (SELECT id FROM public.empresas WHERE auth_id = auth.uid())
        OR public.check_user_is_member_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        empresa_id IN (SELECT id FROM public.empresas WHERE auth_id = auth.uid())
        OR public.check_user_is_member_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- Solo administradores de la empresa o administradores del sistema pueden eliminar ofertas.
CREATE POLICY "ofertas_delete" ON public.ofertas
    FOR DELETE TO authenticated
    USING (
        empresa_id IN (SELECT id FROM public.empresas WHERE auth_id = auth.uid())
        OR public.check_user_is_admin_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 8: RECREACIÓN DE POLÍTICAS - TABLA: oferta_skills
-- -------------------------------------------------------------------------
-- Las habilidades requeridas en ofertas de trabajo son de lectura pública.
CREATE POLICY "oferta_skills_select" ON public.oferta_skills
    FOR SELECT USING (true);

-- Solo miembros de la empresa asociada pueden administrar las habilidades de la oferta.
CREATE POLICY "oferta_skills_insert" ON public.oferta_skills
    FOR INSERT TO authenticated
    WITH CHECK (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id));

CREATE POLICY "oferta_skills_update" ON public.oferta_skills
    FOR UPDATE TO authenticated
    USING (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id))
    WITH CHECK (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id));

CREATE POLICY "oferta_skills_delete" ON public.oferta_skills
    FOR DELETE TO authenticated
    USING (public.check_user_is_member_of_offer_company(auth.uid(), oferta_id));


-- -------------------------------------------------------------------------
-- PASO 9: RECREACIÓN DE POLÍTICAS - TABLA: empresa_miembros
-- -------------------------------------------------------------------------
-- Los miembros solo pueden ver registros de su propia empresa.
CREATE POLICY "empresa_miembros_select" ON public.empresa_miembros
    FOR SELECT TO authenticated
    USING (
        public.check_user_is_member_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- Solo administradores corporativos o del sistema administran membresías.
CREATE POLICY "empresa_miembros_insert" ON public.empresa_miembros
    FOR INSERT TO authenticated
    WITH CHECK (
        public.check_user_is_admin_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

CREATE POLICY "empresa_miembros_update" ON public.empresa_miembros
    FOR UPDATE TO authenticated
    USING (
        public.check_user_is_admin_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        public.check_user_is_admin_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

CREATE POLICY "empresa_miembros_delete" ON public.empresa_miembros
    FOR DELETE TO authenticated
    USING (
        public.check_user_is_admin_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 10: RECREACIÓN DE POLÍTICAS - TABLA: pagos_procesados
-- -------------------------------------------------------------------------
-- 1. Los candidatos solo ven su historial de pagos.
-- 2. Administradores del sistema ven todo.
-- 3. CERO INSERT/UPDATE/DELETE desde el cliente (solo backend mediante Service Role).
CREATE POLICY "pagos_procesados_select" ON public.pagos_procesados
    FOR SELECT TO authenticated
    USING (
        auth_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 11: RECREACIÓN DE POLÍTICAS - TABLA: quiz_intentos
-- -------------------------------------------------------------------------
-- 1. Candidatos ven sus propios intentos de exámenes.
-- 2. Administradores del sistema ven todos.
-- 3. Solo inserción del intento por parte del candidato.
-- 4. CERO UPDATE directo desde cliente (controlado 100% por backend/Service Role).
CREATE POLICY "quiz_intentos_select" ON public.quiz_intentos
    FOR SELECT TO authenticated
    USING (
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

CREATE POLICY "quiz_intentos_insert" ON public.quiz_intentos
    FOR INSERT TO authenticated
    WITH CHECK (candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()));


-- -------------------------------------------------------------------------
-- PASO 12: RECREACIÓN DE POLÍTICAS - TABLA: simulacion_sesiones y simulaciones_entrevista
-- -------------------------------------------------------------------------
-- simulacion_sesiones: Lectura únicamente (Escritura exclusiva por backend vía Service Role)
CREATE POLICY "simulacion_sesiones_select" ON public.simulacion_sesiones
    FOR SELECT TO authenticated
    USING (
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

-- simulaciones_entrevista: Lectura únicamente (Escritura exclusiva por backend vía Service Role)
CREATE POLICY "simulaciones_entrevista_select" ON public.simulaciones_entrevista
    FOR SELECT TO authenticated
    USING (
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 13: RECREACIÓN DE POLÍTICAS - TABLA: insignias y candidato_insignias
-- -------------------------------------------------------------------------
-- Catálogo de insignias y distribución son de acceso público para lectura.
CREATE POLICY "insignias_select" ON public.insignias FOR SELECT USING (true);
CREATE POLICY "candidato_insignias_select" ON public.candidato_insignias FOR SELECT USING (true);

-- CERO ESCRITURA desde el cliente. Solo gestionado por backend/Service Role tras validar los quizzes.


-- -------------------------------------------------------------------------
-- PASO 14: RECREACIÓN DE POLÍTICAS - TABLA: motivos_rechazo
-- -------------------------------------------------------------------------
CREATE POLICY "motivos_rechazo_select" ON public.motivos_rechazo FOR SELECT USING (true);


-- -------------------------------------------------------------------------
-- PASO 15: RECREACIÓN DE POLÍTICAS - TABLA: administradores
-- -------------------------------------------------------------------------
-- Lectura pública para que los clientes identifiquen si el usuario es administrador.
CREATE POLICY "administradores_select" ON public.administradores
    FOR SELECT TO authenticated USING (true);


-- -------------------------------------------------------------------------
-- PASO 16: RECREACIÓN DE POLÍTICAS - TABLA: cv_processing_jobs
-- -------------------------------------------------------------------------
-- Los candidatos solo pueden consultar el estado de sus propios tickets
CREATE POLICY "cv_processing_jobs_select" ON public.cv_processing_jobs
    FOR SELECT TO authenticated
    USING (
        auth_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- -------------------------------------------------------------------------
-- PASO 17: RECREACIÓN DE POLÍTICAS - TABLA: notificaciones
-- -------------------------------------------------------------------------
-- Lectura y actualización (marcar como leído) restringido exclusivamente a su dueño.
CREATE POLICY "notificaciones_select" ON public.notificaciones
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());

CREATE POLICY "notificaciones_update" ON public.notificaciones
    FOR UPDATE TO authenticated
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());


-- -------------------------------------------------------------------------
-- PASO 18: ASEGURAR QUE EL ADMIN REAL TENGA ACCESO A LA TABLA ADMINISTRADORES
-- -------------------------------------------------------------------------
INSERT INTO public.administradores (auth_id)
SELECT id FROM auth.users WHERE email = 'tohovos641@nazisat.com'
ON CONFLICT DO NOTHING;


-- -------------------------------------------------------------------------
-- PASO 19: TRIGGER DE SEGURIDAD PARA LA TABLA POSTULACIONES
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_postulaciones_columns()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN := EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid());
    is_recruiter BOOLEAN := public.check_user_is_member_of_offer_company(auth.uid(), COALESCE(NEW.oferta_id, OLD.oferta_id));
    is_candidate BOOLEAN := EXISTS (SELECT 1 FROM public.candidatos WHERE auth_id = auth.uid());
BEGIN
    -- Si no es un rol de cliente (ej. es service_role, postgres, etc.), permitir todo
    IF current_setting('role', true) NOT IN ('authenticated', 'anon') THEN
        RETURN NEW;
    END IF;

    -- Permitir todo si es un administrador
    IF is_admin THEN
        RETURN NEW;
    END IF;

    -- Validaciones en INSERT
    IF TG_OP = 'INSERT' THEN
        -- Si es candidato, forzar estados iniciales seguros
        IF is_candidate THEN
            NEW.estado := 'Postulado';
            NEW.match_boost_estado := 'pendiente';
            NEW.motivo_rechazo_id := NULL;
            -- Validar que no intente postular a otro candidato
            IF NEW.candidato_id NOT IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()) THEN
                RAISE EXCEPTION 'No autorizado para crear una postulación para otro usuario.';
            END IF;
        END IF;
        
        -- Si es un reclutador intentando insertar (caso no soportado en flujo de negocio)
        IF is_recruiter AND NOT is_candidate THEN
            RAISE EXCEPTION 'Operación no soportada.';
        END IF;
    END IF;

    -- Validaciones en UPDATE
    IF TG_OP = 'UPDATE' THEN
        IF is_candidate THEN
            -- Un candidato NO puede cambiar el estado de reclutamiento, su match calculado o detalles de rechazo
            IF NEW.estado IS DISTINCT FROM OLD.estado OR 
               NEW.porcentaje_match_calculado IS DISTINCT FROM OLD.porcentaje_match_calculado OR
               NEW.motivo_rechazo_id IS DISTINCT FROM OLD.motivo_rechazo_id OR
               NEW.candidato_id IS DISTINCT FROM OLD.candidato_id OR
               NEW.oferta_id IS DISTINCT FROM OLD.oferta_id OR
               NEW.fecha_postulacion IS DISTINCT FROM OLD.fecha_postulacion THEN
                
                -- Revertir todos los campos protegidos a su valor original
                NEW.estado := OLD.estado;
                NEW.porcentaje_match_calculado := OLD.porcentaje_match_calculado;
                NEW.motivo_rechazo_id := OLD.motivo_rechazo_id;
                NEW.candidato_id := OLD.candidato_id;
                NEW.oferta_id := OLD.oferta_id;
                NEW.fecha_postulacion := OLD.fecha_postulacion;
            END IF;

            -- Solo puede actualizar match_boost_estado
            IF NEW.match_boost_estado IS DISTINCT FROM OLD.match_boost_estado THEN
                IF NEW.match_boost_estado NOT IN ('pendiente', 'aprobado', 'desaprobado') THEN
                    RAISE EXCEPTION 'Estado de boost inválido.';
                END IF;
            END IF;
        ELSIF is_recruiter THEN
            -- Un reclutador NO puede cambiar datos del candidato ni el boost de examen
            IF NEW.candidato_id IS DISTINCT FROM OLD.candidato_id OR
               NEW.oferta_id IS DISTINCT FROM OLD.oferta_id OR
               NEW.porcentaje_match_calculado IS DISTINCT FROM OLD.porcentaje_match_calculado OR
               NEW.match_boost_estado IS DISTINCT FROM OLD.match_boost_estado OR
               NEW.fecha_postulacion IS DISTINCT FROM OLD.fecha_postulacion THEN
                
                NEW.candidato_id := OLD.candidato_id;
                NEW.oferta_id := OLD.oferta_id;
                NEW.porcentaje_match_calculado := OLD.porcentaje_match_calculado;
                NEW.match_boost_estado := OLD.match_boost_estado;
                NEW.fecha_postulacion := OLD.fecha_postulacion;
            END IF;
        ELSE
            -- Cualquier otra persona sin rol no puede hacer update
            RAISE EXCEPTION 'No autorizado.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_postulaciones_cols_trigger ON public.postulaciones;
CREATE TRIGGER protect_postulaciones_cols_trigger
BEFORE INSERT OR UPDATE ON public.postulaciones
FOR EACH ROW EXECUTE FUNCTION public.protect_postulaciones_columns();
