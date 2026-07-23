-- =========================================================================
-- OPTIMIZACIÓN DE CHATS: Reemplazar N+1 queries por RPCs de una sola query
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

-- 1. RPC para candidatos: obtener todos los chats con mensajes de empresa
CREATE OR REPLACE FUNCTION public.get_chats_candidato(p_candidato_id UUID)
RETURNS TABLE (
    postulacion_id UUID,
    oferta_titulo TEXT,
    oferta_id UUID,
    interlocutor_nombre TEXT,
    interlocutor_logo TEXT,
    estado TEXT,
    ultimo_mensaje_contenido TEXT,
    ultimo_mensaje_remitente_tipo TEXT,
    ultimo_mensaje_created_at TIMESTAMPTZ,
    no_leidos BIGINT,
    total_mensajes BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        p.id AS postulacion_id,
        o.titulo AS oferta_titulo,
        o.id AS oferta_id,
        COALESCE(e.nombre, 'Empresa') AS interlocutor_nombre,
        e.logo_url AS interlocutor_logo,
        p.estado,
        ultimo.contenido AS ultimo_mensaje_contenido,
        ultimo.remitente_tipo AS ultimo_mensaje_remitente_tipo,
        ultimo.created_at AS ultimo_mensaje_created_at,
        (SELECT COUNT(*) FROM public.mensajes m2
         WHERE m2.postulacion_id = p.id
           AND m2.remitente_tipo = 'empresa'
           AND m2.leido_en IS NULL) AS no_leidos,
        (SELECT COUNT(*) FROM public.mensajes m3
         WHERE m3.postulacion_id = p.id) AS total_mensajes
    FROM public.postulaciones p
    JOIN public.ofertas o ON o.id = p.oferta_id
    LEFT JOIN public.empresas e ON e.id = o.empresa_id
    -- LATERAL join para obtener el último mensaje de cada postulación
    LEFT JOIN LATERAL (
        SELECT m.contenido, m.remitente_tipo, m.created_at
        FROM public.mensajes m
        WHERE m.postulacion_id = p.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) ultimo ON TRUE
    WHERE p.candidato_id = p_candidato_id
      -- Solo incluir postulaciones que tengan al menos un mensaje de empresa
      AND EXISTS (
          SELECT 1 FROM public.mensajes me
          WHERE me.postulacion_id = p.id
            AND me.remitente_tipo = 'empresa'
      )
    ORDER BY ultimo.created_at DESC NULLS LAST;
$$;

-- 2. RPC para empresas: obtener todos los chats con candidatos
CREATE OR REPLACE FUNCTION public.get_chats_empresa(p_empresa_id UUID)
RETURNS TABLE (
    postulacion_id UUID,
    oferta_titulo TEXT,
    oferta_id UUID,
    candidato_id UUID,
    interlocutor_nombre TEXT,
    interlocutor_foto TEXT,
    estado TEXT,
    ultimo_mensaje_contenido TEXT,
    ultimo_mensaje_remitente_tipo TEXT,
    ultimo_mensaje_created_at TIMESTAMPTZ,
    no_leidos BIGINT,
    total_mensajes BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        p.id AS postulacion_id,
        o.titulo AS oferta_titulo,
        o.id AS oferta_id,
        p.candidato_id,
        COALESCE(c.nombre_completo, 'Candidato') AS interlocutor_nombre,
        c.foto_url AS interlocutor_foto,
        p.estado,
        ultimo.contenido AS ultimo_mensaje_contenido,
        ultimo.remitente_tipo AS ultimo_mensaje_remitente_tipo,
        ultimo.created_at AS ultimo_mensaje_created_at,
        (SELECT COUNT(*) FROM public.mensajes m2
         WHERE m2.postulacion_id = p.id
           AND m2.remitente_tipo = 'candidato'
           AND m2.leido_en IS NULL) AS no_leidos,
        (SELECT COUNT(*) FROM public.mensajes m3
         WHERE m3.postulacion_id = p.id) AS total_mensajes
    FROM public.postulaciones p
    JOIN public.ofertas o ON o.id = p.oferta_id
    LEFT JOIN public.candidatos c ON c.id = p.candidato_id
    LEFT JOIN LATERAL (
        SELECT m.contenido, m.remitente_tipo, m.created_at
        FROM public.mensajes m
        WHERE m.postulacion_id = p.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) ultimo ON TRUE
    WHERE o.empresa_id = p_empresa_id
      -- Solo incluir postulaciones que tengan al menos un mensaje
      AND EXISTS (
          SELECT 1 FROM public.mensajes me
          WHERE me.postulacion_id = p.id
      )
    ORDER BY ultimo.created_at DESC NULLS LAST;
$$;

-- 3. Permisos: solo service_role puede ejecutarlas (el backend las llama con supabaseAdmin)
REVOKE EXECUTE ON FUNCTION public.get_chats_candidato(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_chats_candidato(UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_chats_empresa(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_chats_empresa(UUID) TO service_role;
