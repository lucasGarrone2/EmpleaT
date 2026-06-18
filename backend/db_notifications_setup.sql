-- 1. Crear la tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Acceso Seguro para candidatos
CREATE POLICY "Permitir select a los propietarios" 
ON notificaciones FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Permitir update de lectura a los propietarios" 
ON notificaciones FOR UPDATE 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 4. Crear la función del trigger para notificar cambios de estado
CREATE OR REPLACE FUNCTION notify_candidato_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_auth_id UUID;
    v_titulo_oferta VARCHAR(255);
    v_nombre_empresa VARCHAR(255);
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

    -- Solo notificar si el estado realmente cambió y el candidato existe
    IF (OLD.estado IS DISTINCT FROM NEW.estado) AND v_auth_id IS NOT NULL THEN
        INSERT INTO notificaciones (usuario_id, titulo, mensaje)
        VALUES (
            v_auth_id,
            'Actualización de tu postulación',
            'Tu postulación para la búsqueda "' || v_titulo_oferta || '" en la empresa ' || COALESCE(v_nombre_empresa, 'Reclutadora') || ' ha cambiado al estado: ' || NEW.estado || '.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear el disparador (Trigger) asociado a la tabla postulaciones
DROP TRIGGER IF EXISTS trigger_notify_status_change ON postulaciones;
CREATE TRIGGER trigger_notify_status_change
AFTER UPDATE ON postulaciones
FOR EACH ROW
EXECUTE FUNCTION notify_candidato_on_status_change();
