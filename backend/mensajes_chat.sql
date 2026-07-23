-- =============================================================================
-- EmpleaT: Sistema de Mensajería Candidato-Reclutador
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- 1. Crear tabla de mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postulacion_id uuid NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,
  remitente_id uuid NOT NULL,       -- auth.uid() de quien envía
  remitente_tipo text NOT NULL CHECK (remitente_tipo IN ('candidato', 'empresa')),
  contenido text NOT NULL CHECK (char_length(contenido) >= 1 AND char_length(contenido) <= 2000),
  leido_en timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_postulacion ON mensajes(postulacion_id, created_at);

-- 2. Habilitar RLS
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS ─ Candidato
-- El candidato solo puede leer mensajes de sus propias postulaciones
CREATE POLICY "candidato_select_mensajes"
ON mensajes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM postulaciones p
    JOIN candidatos c ON c.id = p.candidato_id
    WHERE p.id = mensajes.postulacion_id
      AND c.auth_id = auth.uid()
  )
);

-- El candidato solo puede insertar mensajes como 'candidato' en sus propias postulaciones
CREATE POLICY "candidato_insert_mensajes"
ON mensajes FOR INSERT
WITH CHECK (
  remitente_tipo = 'candidato'
  AND remitente_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM postulaciones p
    JOIN candidatos c ON c.id = p.candidato_id
    WHERE p.id = mensajes.postulacion_id
      AND c.auth_id = auth.uid()
  )
);

-- 4. Políticas RLS ─ Empresa (miembros)
-- Un miembro de empresa puede leer mensajes de postulaciones a sus ofertas
CREATE POLICY "empresa_select_mensajes"
ON mensajes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM postulaciones p
    JOIN ofertas o ON o.id = p.oferta_id
    JOIN empresa_miembros em ON em.empresa_id = o.empresa_id
    WHERE p.id = mensajes.postulacion_id
      AND em.auth_id = auth.uid()
  )
);

-- Un miembro de empresa puede insertar mensajes como 'empresa' en esas postulaciones
CREATE POLICY "empresa_insert_mensajes"
ON mensajes FOR INSERT
WITH CHECK (
  remitente_tipo = 'empresa'
  AND remitente_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM postulaciones p
    JOIN ofertas o ON o.id = p.oferta_id
    JOIN empresa_miembros em ON em.empresa_id = o.empresa_id
    WHERE p.id = mensajes.postulacion_id
      AND em.auth_id = auth.uid()
  )
);

-- NOTA: No se crean políticas de UPDATE ni DELETE.
-- Marcar como leído se hace exclusivamente vía RPC con SECURITY DEFINER.

-- 5. RPC: marcar mensajes como leídos (SECURITY DEFINER para bypassear RLS de UPDATE)
CREATE OR REPLACE FUNCTION marcar_mensajes_leidos(
  p_postulacion_id uuid,
  p_reader_auth_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE mensajes
  SET leido_en = now()
  WHERE postulacion_id = p_postulacion_id
    AND leido_en IS NULL
    AND remitente_id != p_reader_auth_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verificar que el setup fue exitoso
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'mensajes';
