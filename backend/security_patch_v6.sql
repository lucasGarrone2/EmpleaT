-- =========================================================================
-- PARCHE DE SEGURIDAD DE BASE DE DATOS V6 - FIX DE BUGS CRÍTICOS Y ALTOS (SINTAXIS COMPATIBLE)
-- Ejecutar este script completo en el SQL Editor de Supabase.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. CAMBIOS EN TABLA pagos_procesados PARA IDEMPOTENCIA DE REEMBOLSOS
-- -------------------------------------------------------------------------
ALTER TABLE public.pagos_procesados 
    ADD COLUMN IF NOT EXISTS reembolsado BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.pagos_procesados 
    ADD COLUMN IF NOT EXISTS fecha_reembolso TIMESTAMP WITH TIME ZONE;

-- -------------------------------------------------------------------------
-- 2. RPC ATÓMICA PARA REGISTRAR ARREPENTIMIENTO Y EVITAR RACE CONDITIONS
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_arrepentimiento_pago(p_auth_id UUID)
RETURNS TABLE (pago_id VARCHAR(100), monto NUMERIC) AS $$
DECLARE
    v_pago_id VARCHAR(100);
    v_monto NUMERIC;
BEGIN
    SELECT id, public.pagos_procesados.monto INTO v_pago_id, v_monto
    FROM public.pagos_procesados
    WHERE auth_id = p_auth_id
      AND reembolsado = FALSE
      AND fecha_procesado >= NOW() - INTERVAL '10 days'
    ORDER BY fecha_procesado DESC
    LIMIT 1
    FOR UPDATE;

    IF v_pago_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.pagos_procesados
    SET reembolsado = TRUE,
        fecha_reembolso = NOW()
    WHERE id = v_pago_id;

    RETURN QUERY SELECT v_pago_id, v_monto;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.registrar_arrepentimiento_pago(UUID) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_arrepentimiento_pago(UUID) TO service_role;


-- -------------------------------------------------------------------------
-- 3. RPC revertir_arrepentimiento_pago (Por si la API de Mercado Pago falla)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revertir_arrepentimiento_pago(p_payment_id VARCHAR(100), p_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.pagos_procesados
    SET reembolsado = FALSE,
        fecha_reembolso = NULL
    WHERE id = p_payment_id
      AND auth_id = p_auth_id;
      
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.revertir_arrepentimiento_pago(VARCHAR, UUID) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revertir_arrepentimiento_pago(VARCHAR, UUID) TO service_role;


-- -------------------------------------------------------------------------
-- 4. REFACTORIZAR RPC marcar_mensajes_leidos PARA USAR auth.uid()
-- -------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.marcar_mensajes_leidos(UUID, UUID);
DROP FUNCTION IF EXISTS public.marcar_mensajes_leidos(UUID);

CREATE OR REPLACE FUNCTION public.marcar_mensajes_leidos(p_postulacion_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.mensajes
  SET leido_en = NOW()
  WHERE postulacion_id = p_postulacion_id
    AND leido_en IS NULL
    AND remitente_id != auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.marcar_mensajes_leidos(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.marcar_mensajes_leidos(UUID) TO authenticated;


-- -------------------------------------------------------------------------
-- 5. ELIMINAR RPC VULNERABLE Y CREAR RPC EXCLUSIVA PARA EL BACKEND (SERVICE ROLE)
-- -------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_user_id_by_email(TEXT);
DROP FUNCTION IF EXISTS public.get_user_id_by_email_internal(TEXT);

CREATE OR REPLACE FUNCTION public.get_user_id_by_email_internal(email_address TEXT)
RETURNS TABLE (auth_id UUID, email TEXT, rol TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT id, u.email, (raw_user_meta_data->>'rol')::text
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email_internal(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email_internal(TEXT) TO service_role;

-- =========================================================================
-- FIN DEL SCRIPT V6
-- =========================================================================
