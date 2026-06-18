-- =========================================================================
-- PARCHE DE SEGURIDAD DE BASE DE DATOS V3 - INTEGRIDAD DE SUSCRIPCIONES Y TOCTOU
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

-- Crear la función RPC para procesar pagos de manera atómica, prevenir Replay Attacks y acumular vigencia premium.
CREATE OR REPLACE FUNCTION public.procesar_pago_premium(
    p_payment_id VARCHAR(100),
    p_auth_id UUID,
    p_monto NUMERIC,
    p_meses INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_hasta TIMESTAMP WITH TIME ZONE;
    v_new_hasta TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Verificar si el pago ya fue procesado
    IF EXISTS (SELECT 1 FROM public.pagos_procesados WHERE id = p_payment_id) THEN
        RETURN FALSE; -- Pago ya procesado previamente
    END IF;

    -- 2. Insertar el pago en pagos_procesados
    INSERT INTO public.pagos_procesados (id, auth_id, monto)
    VALUES (p_payment_id, p_auth_id, p_monto);

    -- 3. Obtener la fecha de expiración premium actual del candidato
    SELECT premium_hasta INTO v_current_hasta
    FROM public.candidatos
    WHERE auth_id = p_auth_id;

    -- 4. Calcular la nueva fecha de expiración (acumulativa si el premium actual está vigente)
    IF v_current_hasta IS NOT NULL AND v_current_hasta > NOW() THEN
        v_new_hasta := v_current_hasta + (p_meses * INTERVAL '30 days');
    ELSE
        v_new_hasta := NOW() + (p_meses * INTERVAL '30 days');
    END IF;

    -- 5. Actualizar el estado premium del candidato
    UPDATE public.candidatos
    SET es_premium = TRUE,
        premium_desde = COALESCE(premium_desde, NOW()),
        premium_hasta = v_new_hasta
    WHERE auth_id = p_auth_id;

    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        -- Si hay colisión de clave única por ejecución concurrente, retornar falso de manera segura
        RETURN FALSE;
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Otorgar permisos de ejecución sobre la RPC a usuarios autenticados y al service_role
GRANT EXECUTE ON FUNCTION public.procesar_pago_premium(VARCHAR, UUID, NUMERIC, INTEGER) TO service_role, authenticated;
