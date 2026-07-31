-- =========================================================================
-- REPARAR BÚSQUEDA DE CANDIDATOS (buscar_candidatos_premium)
-- 1. Poblar nombre_completo en candidatos existentes desde auth.users si está NULL
-- 2. Retornar nombre_completo con fallback inteligente en la RPC
-- =========================================================================

-- 1. Poblar candidatos que tengan nombre_completo NULL o vacío
UPDATE public.candidatos c
SET nombre_completo = COALESCE(
    NULLIF(TRIM(c.nombre_completo), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'nombre_completo'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'nombre'), ''),
    INITCAP(REPLACE(split_part(u.email, '@', 1), '.', ' '))
)
FROM auth.users u
WHERE c.auth_id = u.id
  AND (c.nombre_completo IS NULL OR TRIM(c.nombre_completo) = '');


-- 2. Recrear la función RPC con soporte para OFFSET (paginación)
DROP FUNCTION IF EXISTS public.buscar_candidatos_premium(TEXT[], INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.buscar_candidatos_premium(TEXT[], INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.buscar_candidatos_premium(
    p_skills TEXT[],
    p_experiencia_min INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    candidato_id UUID,
    nombre_completo TEXT,
    titulo_profesional TEXT,
    anios_experiencia INTEGER,
    ubicacion TEXT,
    modalidad_preferida TEXT,
    skills_match JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_plan TEXT;
    v_premium_hasta TIMESTAMPTZ;
BEGIN
    -- Validar que el usuario que ejecuta pertenece a una empresa con plan premium activo
    SELECT e.id, e.plan, e.premium_hasta
    INTO v_empresa_id, v_plan, v_premium_hasta
    FROM public.empresa_miembros em
    JOIN public.empresas e ON e.id = em.empresa_id
    WHERE em.auth_id = auth.uid()
      AND em.estado = 'aceptado'
    LIMIT 1;

    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: no eres miembro de ninguna empresa.';
    END IF;

    IF v_plan != 'premium' OR v_premium_hasta IS NULL OR v_premium_hasta <= NOW() THEN
        RAISE EXCEPTION 'Acceso denegado: se requiere plan premium de empresa activo.';
    END IF;

    -- Ejecutar búsqueda
    RETURN QUERY
    SELECT DISTINCT ON (c.id)
        c.id AS candidato_id,
        COALESCE(
            NULLIF(TRIM(c.nombre_completo), ''),
            NULLIF(TRIM(u.raw_user_meta_data->>'nombre_completo'), ''),
            NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
            NULLIF(TRIM(u.raw_user_meta_data->>'nombre'), ''),
            INITCAP(REPLACE(split_part(u.email, '@', 1), '.', ' ')),
            'Candidato'
        )::TEXT AS nombre_completo,
        c.titulo_profesional,
        c.anios_experiencia,
        c.ubicacion,
        c.modalidad_preferida::TEXT AS modalidad_preferida,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'nombre', COALESCE(ds2.nombre_skill, cs2.nombre_original),
                'nivel', cs2.nivel_estimado
            ))
            FROM public.candidato_skills cs2
            LEFT JOIN public.diccionario_skills ds2 ON cs2.skill_id = ds2.id
            WHERE cs2.candidato_id = c.id
        ) AS skills_match
    FROM public.candidatos c
    LEFT JOIN auth.users u ON c.auth_id = u.id
    WHERE c.disponible_busqueda = TRUE
      AND c.anios_experiencia >= p_experiencia_min
      AND (
          -- Si no se pasan skills, devolver todos los candidatos visibles
          p_skills IS NULL OR array_length(p_skills, 1) IS NULL
          OR EXISTS (
              SELECT 1 
              FROM public.candidato_skills cs
              LEFT JOIN public.diccionario_skills ds ON cs.skill_id = ds.id
              WHERE cs.candidato_id = c.id
                AND EXISTS (
                    SELECT 1 FROM unnest(p_skills) AS skill_term
                    WHERE ds.nombre_skill % skill_term
                       OR ds.nombre_skill ILIKE '%' || skill_term || '%'
                       OR COALESCE(cs.nombre_original, '') % skill_term
                       OR COALESCE(cs.nombre_original, '') ILIKE '%' || skill_term || '%'
                )
          )
      )
    ORDER BY c.id, c.anios_experiencia DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.buscar_candidatos_premium(TEXT[], INTEGER, INTEGER, INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.buscar_candidatos_premium(TEXT[], INTEGER, INTEGER, INTEGER) TO authenticated;
