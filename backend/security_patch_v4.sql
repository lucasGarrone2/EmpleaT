-- =========================================================================
-- PARCHE DE SEGURIDAD V4 — SEC-09: Refuerzo de trigger de postulaciones
-- Previene que un candidato se auto-asigne match_boost_estado = 'aprobado'
-- sin haber aprobado un quiz real.
-- Ejecutar en: Supabase SQL Editor
-- =========================================================================

CREATE OR REPLACE FUNCTION public.protect_postulaciones_columns()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN := EXISTS (SELECT 1 FROM public.administradores WHERE auth_id = auth.uid());
    is_recruiter BOOLEAN := public.check_user_is_member_of_offer_company(auth.uid(), COALESCE(NEW.oferta_id, OLD.oferta_id));
    is_candidate BOOLEAN := EXISTS (SELECT 1 FROM public.candidatos WHERE auth_id = auth.uid());
BEGIN
    -- Si es service_role, postgres o supabase_admin, permitir todo (backend)
    IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
        RETURN NEW;
    END IF;

    -- Si el role no es authenticated ni anon, denegar (SEC-09: antes pasaba todo)
    IF current_setting('role', true) NOT IN ('authenticated', 'anon') THEN
        RAISE EXCEPTION 'Rol no reconocido: acceso denegado.';
    END IF;

    -- Permitir todo si es un administrador del sistema
    IF is_admin THEN
        RETURN NEW;
    END IF;

    -- Validaciones en INSERT
    IF TG_OP = 'INSERT' THEN
        IF is_candidate THEN
            NEW.estado := 'Postulado';
            NEW.match_boost_estado := 'pendiente';
            NEW.motivo_rechazo_id := NULL;
            IF NEW.candidato_id NOT IN (SELECT id FROM public.candidatos WHERE auth_id = auth.uid()) THEN
                RAISE EXCEPTION 'No autorizado para crear una postulación para otro usuario.';
            END IF;
        END IF;
        IF is_recruiter AND NOT is_candidate THEN
            RAISE EXCEPTION 'Operación no soportada.';
        END IF;
    END IF;

    -- Validaciones en UPDATE
    IF TG_OP = 'UPDATE' THEN
        IF is_candidate THEN
            -- Proteger campos de reclutamiento
            IF NEW.estado IS DISTINCT FROM OLD.estado OR
               NEW.porcentaje_match_calculado IS DISTINCT FROM OLD.porcentaje_match_calculado OR
               NEW.motivo_rechazo_id IS DISTINCT FROM OLD.motivo_rechazo_id OR
               NEW.candidato_id IS DISTINCT FROM OLD.candidato_id OR
               NEW.oferta_id IS DISTINCT FROM OLD.oferta_id OR
               NEW.fecha_postulacion IS DISTINCT FROM OLD.fecha_postulacion THEN

                NEW.estado := OLD.estado;
                NEW.porcentaje_match_calculado := OLD.porcentaje_match_calculado;
                NEW.motivo_rechazo_id := OLD.motivo_rechazo_id;
                NEW.candidato_id := OLD.candidato_id;
                NEW.oferta_id := OLD.oferta_id;
                NEW.fecha_postulacion := OLD.fecha_postulacion;
            END IF;

            -- SEC-09: Validar match_boost_estado
            IF NEW.match_boost_estado IS DISTINCT FROM OLD.match_boost_estado THEN
                IF NEW.match_boost_estado NOT IN ('pendiente', 'aprobado', 'desaprobado') THEN
                    RAISE EXCEPTION 'Estado de boost inválido.';
                END IF;
                -- SEC-09 NUEVO: Un candidato NO puede auto-asignarse 'aprobado'
                -- Solo el backend (service_role) puede hacerlo tras verificar el quiz
                IF NEW.match_boost_estado = 'aprobado' AND OLD.match_boost_estado != 'aprobado' THEN
                    -- Verificar que existe al menos un quiz aprobado para este candidato
                    IF NOT EXISTS (
                        SELECT 1 FROM public.quiz_intentos
                        WHERE candidato_id = NEW.candidato_id
                        AND aprobado = TRUE
                    ) THEN
                        RAISE EXCEPTION 'No se puede aprobar boost sin un quiz aprobado. Operación denegada.';
                    END IF;
                END IF;
            END IF;

        ELSIF is_recruiter THEN
            -- Un reclutador NO puede cambiar datos del candidato ni el boost
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
            RAISE EXCEPTION 'No autorizado.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS protect_postulaciones_cols_trigger ON public.postulaciones;
CREATE TRIGGER protect_postulaciones_cols_trigger
BEFORE INSERT OR UPDATE ON public.postulaciones
FOR EACH ROW EXECUTE FUNCTION public.protect_postulaciones_columns();
