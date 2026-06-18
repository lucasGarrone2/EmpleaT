-- =========================================================================
-- PARCHE DE NOTIFICACIONES: INCLUSIÓN DE MOTIVO DE RECHAZO
-- Ejecutar este script en el SQL Editor de Supabase
-- =========================================================================

CREATE OR REPLACE FUNCTION notify_candidato_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_auth_id UUID;
    v_titulo_oferta VARCHAR(255);
    v_nombre_empresa VARCHAR(255);
    v_motivo_rechazo VARCHAR(255);
    v_mensaje TEXT;
BEGIN
    -- Obtener el auth_id del candidato
    SELECT auth_id INTO v_auth_id 
    FROM candidatos 
    WHERE id = NEW.candidato_id;

    -- Obtener el título de la oferta y el nombre de la empresa
    SELECT o.titulo, e.nombre INTO v_titulo_oferta, v_nombre_empresa
    FROM ofertas o
    LEFT JOIN empresas e ON e.id = o.empresa_id
    WHERE o.id = NEW.oferta_id;

    -- Solo notificar si el estado realmente cambió o si se asignó/cambió un motivo de rechazo
    IF ((OLD.estado IS DISTINCT FROM NEW.estado) OR (OLD.motivo_rechazo_id IS DISTINCT FROM NEW.motivo_rechazo_id)) AND v_auth_id IS NOT NULL THEN
        
        IF LOWER(NEW.estado) = 'rechazado' THEN
            -- Obtener el texto del motivo de rechazo si existe
            IF NEW.motivo_rechazo_id IS NOT NULL THEN
                SELECT descripcion INTO v_motivo_rechazo FROM motivos_rechazo WHERE id = NEW.motivo_rechazo_id;
            END IF;
            
            IF v_motivo_rechazo IS NOT NULL THEN
                v_mensaje := 'Tu postulación para la búsqueda "' || v_titulo_oferta || '" en la empresa ' || COALESCE(v_nombre_empresa, 'Reclutadora') || ' ha finalizado. Motivo: ' || v_motivo_rechazo || '.';
            ELSE
                v_mensaje := 'Tu postulación para la búsqueda "' || v_titulo_oferta || '" en la empresa ' || COALESCE(v_nombre_empresa, 'Reclutadora') || ' ha finalizado.';
            END IF;
        ELSE
            v_mensaje := 'Tu postulación para la búsqueda "' || v_titulo_oferta || '" en la empresa ' || COALESCE(v_nombre_empresa, 'Reclutadora') || ' ha cambiado al estado: ' || NEW.estado || '.';
        END IF;

        INSERT INTO notificaciones (usuario_id, titulo, mensaje)
        VALUES (
            v_auth_id,
            'Actualización de tu postulación',
            v_mensaje
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
