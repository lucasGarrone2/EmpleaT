-- =========================================================================
-- PARCHE DE SEGURIDAD DE BASE DE DATOS V8 - CONSOLIDACIÓN RLS Y DEDUPLICACIÓN
-- Ejecutar este script completo en el SQL Editor de Supabase.
-- =========================================================================

-- =========================================================================
-- SECCIÓN 1: CONSOLIDACIÓN DE POLÍTICAS RLS EN empresa_miembros
-- Eliminar TODAS las políticas duplicadas y recrear un set limpio.
-- =========================================================================

-- Eliminar las políticas del reset original (database_rls_reset.sql)
DROP POLICY IF EXISTS "empresa_miembros_select" ON public.empresa_miembros;
DROP POLICY IF EXISTS "empresa_miembros_insert" ON public.empresa_miembros;
DROP POLICY IF EXISTS "empresa_miembros_update" ON public.empresa_miembros;
DROP POLICY IF EXISTS "empresa_miembros_delete" ON public.empresa_miembros;

-- Eliminar las políticas del multi_user_company.sql
DROP POLICY IF EXISTS "Miembros pueden ver miembros de su empresa" ON public.empresa_miembros;
DROP POLICY IF EXISTS "Admins pueden agregar miembros" ON public.empresa_miembros;
DROP POLICY IF EXISTS "Admins pueden actualizar miembros" ON public.empresa_miembros;
DROP POLICY IF EXISTS "Admins pueden eliminar miembros" ON public.empresa_miembros;

-- Recrear políticas consolidadas (una sola versión canónica)
CREATE POLICY "empresa_miembros_select" ON public.empresa_miembros
    FOR SELECT TO authenticated
    USING (
        public.check_user_is_member_of_company(auth.uid(), empresa_id)
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );

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


-- =========================================================================
-- SECCIÓN 2: RESOLVER CONFLICTO DE POLÍTICAS UPDATE EN postulaciones
-- Eliminar la política permisiva antigua y dejar solo la restrictiva.
-- =========================================================================

-- Eliminar la política permisiva original (database_rls_reset.sql) que permite a CUALQUIER miembro
DROP POLICY IF EXISTS "postulaciones_update" ON public.postulaciones;

-- Eliminar la política del multi_user_company.sql (nombre alternativo)
DROP POLICY IF EXISTS "Miembros pueden actualizar estado de postulaciones" ON public.postulaciones;

-- Eliminar y recrear la política restrictiva que solo permite a admin/reclutador
DROP POLICY IF EXISTS "Miembros con permiso actualizan postulaciones" ON public.postulaciones;

CREATE POLICY "Miembros con permiso actualizan postulaciones"
    ON public.postulaciones FOR UPDATE
    TO authenticated
    USING (
        -- El candidato dueño de la postulación puede actualizar (su perfil_visto, etc.)
        candidato_id IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid())
        -- Miembros de empresa con rol admin o reclutador pueden actualizar estados
        OR EXISTS (
            SELECT 1 FROM public.ofertas o
            JOIN public.empresa_miembros em ON o.empresa_id = em.empresa_id
            WHERE o.id = postulaciones.oferta_id
              AND em.auth_id = auth.uid()
              AND em.rol IN ('administrador', 'reclutador')
        )
        -- Administradores del sistema
        OR EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid())
    );


-- =========================================================================
-- SECCIÓN 3: PRIVACIDAD DE INSIGNIAS (candidato_insignias)
-- Eliminar las múltiples políticas USING (true) y crear una restrictiva.
-- =========================================================================

DROP POLICY IF EXISTS "candidato_insignias_select" ON public.candidato_insignias;
DROP POLICY IF EXISTS "Las insignias de los candidatos son públicas" ON public.candidato_insignias;
DROP POLICY IF EXISTS "Cualquier usuario autenticado puede ver las insignias de los candidatos" ON public.candidato_insignias;

CREATE POLICY "candidato_insignias_select" ON public.candidato_insignias
    FOR SELECT TO authenticated
    USING (
        -- El propio candidato puede ver sus insignias
        -- O una empresa que tenga una postulación activa de este candidato
        public.check_user_can_view_candidate(auth.uid(), candidato_id)
    );


-- =========================================================================
-- SECCIÓN 4: DEDUPLICACIÓN DE VISTAS DE OFERTAS
-- Crear tabla de tracking y reescribir la función RPC.
-- =========================================================================

-- Crear tabla de tracking de vistas únicas
CREATE TABLE IF NOT EXISTS public.oferta_vistas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    oferta_id UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (oferta_id, usuario_id, fecha)
);

-- Habilitar RLS en la tabla
ALTER TABLE public.oferta_vistas ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden insertar su propia vista
CREATE POLICY "oferta_vistas_insert" ON public.oferta_vistas
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

-- Reescribir la función para deduplicar vistas por usuario por día
CREATE OR REPLACE FUNCTION public.increment_vista_oferta(p_oferta_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Intentar insertar la vista; si ya existe para hoy, no hacer nada
    INSERT INTO public.oferta_vistas (oferta_id, usuario_id, fecha)
    VALUES (p_oferta_id, auth.uid(), CURRENT_DATE)
    ON CONFLICT (oferta_id, usuario_id, fecha) DO NOTHING;

    -- Actualizar el contador de vistas basado en el total real
    UPDATE public.ofertas
    SET vistas = (SELECT COUNT(*) FROM public.oferta_vistas WHERE oferta_id = p_oferta_id)
    WHERE id = p_oferta_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_vista_oferta(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_vista_oferta(UUID) TO authenticated;


-- =========================================================================
-- SECCIÓN 5: CONSOLIDACIÓN DE POLÍTICAS DE MENSAJES
-- Eliminar duplicados y dejar un set canónico limpio.
-- =========================================================================

-- Eliminar todas las versiones de las políticas de mensajes
DROP POLICY IF EXISTS "candidato_select_mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "candidato_insert_mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "empresa_select_mensajes" ON public.mensajes;
DROP POLICY IF EXISTS "empresa_insert_mensajes" ON public.mensajes;

-- Recrear políticas canónicas de mensajes

-- Candidato puede ver mensajes de sus postulaciones
CREATE POLICY "candidato_select_mensajes"
    ON public.mensajes FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.postulaciones p
            JOIN public.candidatos c ON c.id = p.candidato_id
            WHERE p.id = mensajes.postulacion_id
              AND c.auth_id = auth.uid()
        )
    );

-- Candidato puede enviar mensajes en sus postulaciones
CREATE POLICY "candidato_insert_mensajes"
    ON public.mensajes FOR INSERT TO authenticated
    WITH CHECK (
        remitente_tipo = 'candidato'
        AND remitente_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.postulaciones p
            JOIN public.candidatos c ON c.id = p.candidato_id
            WHERE p.id = mensajes.postulacion_id
              AND c.auth_id = auth.uid()
        )
    );

-- Empresa puede ver mensajes de postulaciones a sus ofertas
CREATE POLICY "empresa_select_mensajes"
    ON public.mensajes FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.postulaciones p
            JOIN public.ofertas o ON o.id = p.oferta_id
            JOIN public.empresa_miembros em ON em.empresa_id = o.empresa_id
            WHERE p.id = mensajes.postulacion_id
              AND em.auth_id = auth.uid()
        )
    );

-- Solo admin/reclutador de empresa puede enviar mensajes (versión restrictiva del premium)
CREATE POLICY "empresa_insert_mensajes"
    ON public.mensajes FOR INSERT TO authenticated
    WITH CHECK (
        remitente_tipo = 'empresa'
        AND remitente_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.postulaciones p
            JOIN public.ofertas o ON o.id = p.oferta_id
            JOIN public.empresa_miembros em ON em.empresa_id = o.empresa_id
            WHERE p.id = mensajes.postulacion_id
              AND em.auth_id = auth.uid()
              AND em.rol IN ('administrador', 'reclutador')
        )
    );

-- =========================================================================
-- FIN DEL SCRIPT V8
-- =========================================================================
