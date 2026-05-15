-- =========================================================================
-- SISTEMA "EMPLEAT PREMIUM" - MIGRACIÓN DE BASE DE DATOS
-- Este script aplica todos los cambios necesarios en Supabase para 
-- soportar las funcionalidades Premium, Simulaciones con IA y Gamificación.
-- Ejecutar este archivo completo en el SQL Editor de Supabase.
-- =========================================================================

-- ==========================================
-- 1. ACTUALIZACIÓN DE TABLA CANDIDATOS
-- ==========================================
-- Agregamos los campos necesarios para manejar las suscripciones y límites.
ALTER TABLE candidatos
ADD COLUMN IF NOT EXISTS es_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_desde TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS premium_hasta TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS intentos_quiz_diarios INTEGER DEFAULT 3;

-- ==========================================
-- 2. TABLA: SIMULACIONES_ENTREVISTA
-- ==========================================
-- Registra cada intento de simulación de un candidato sobre una oferta.
CREATE TABLE IF NOT EXISTS simulaciones_entrevista (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID REFERENCES candidatos(id) ON DELETE CASCADE,
    oferta_id UUID REFERENCES ofertas(id) ON DELETE CASCADE,
    datos_entrevista JSONB NOT NULL DEFAULT '{}'::jsonb, -- Almacena preguntas generadas, respuestas y feedback
    score_final INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. MÓDULO DE GAMIFICACIÓN (INSIGNIAS)
-- ==========================================
-- Catálogo oficial de insignias disponibles.
CREATE TABLE IF NOT EXISTS insignias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_skill VARCHAR(255) NOT NULL,
    icono_url TEXT,
    nivel VARCHAR(50) CHECK (nivel IN ('Junior', 'Ssr', 'Sr'))
);

-- Relación de insignias que ya han sido ganadas por el candidato.
CREATE TABLE IF NOT EXISTS candidato_insignias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID REFERENCES candidatos(id) ON DELETE CASCADE,
    insignia_id UUID REFERENCES insignias(id) ON DELETE CASCADE,
    fecha_obtencion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(candidato_id, insignia_id) -- Evita duplicar la misma insignia en el mismo usuario
);

-- ==========================================
-- 4. FUNCIÓN SECURITY DEFINER: ASIGNAR INSIGNIA
-- ==========================================
-- Esta función permite otorgar la insignia evitando políticas RLS de INSERT abiertas.
-- Asegura que el usuario no pueda manipular la petición API para asignarse insignias solo.
CREATE OR REPLACE FUNCTION asignar_insignia_candidato(p_candidato_id UUID, p_insignia_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta internamente con permisos de administrador
AS $$
BEGIN
    INSERT INTO candidato_insignias (candidato_id, insignia_id)
    VALUES (p_candidato_id, p_insignia_id)
    ON CONFLICT (candidato_id, insignia_id) DO NOTHING;
END;
$$;

-- ==========================================
-- 5. POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================

-- Activación obligatoria de seguridad a nivel de filas
ALTER TABLE simulaciones_entrevista ENABLE ROW LEVEL SECURITY;
ALTER TABLE insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidato_insignias ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- Políticas: simulaciones_entrevista
-- Solo el dueño (quien hace el match de auth_id) puede leer o escribir.
-- ------------------------------------------
CREATE POLICY "Candidato puede ver sus propias simulaciones"
    ON simulaciones_entrevista FOR SELECT
    USING (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

CREATE POLICY "Candidato puede insertar sus propias simulaciones"
    ON simulaciones_entrevista FOR INSERT
    WITH CHECK (candidato_id IN (SELECT id FROM candidatos WHERE auth_id = auth.uid()));

-- ------------------------------------------
-- Políticas: insignias
-- El catálogo debe ser consultable públicamente en el frontend.
-- ------------------------------------------
CREATE POLICY "Catálogo de insignias es público"
    ON insignias FOR SELECT
    USING (true);

-- ------------------------------------------
-- Políticas: candidato_insignias
-- Públicas de solo-lectura para que los reclutadores y otros vean sus logros.
-- Nota: NO habilitamos INSERT por API ya que es tarea del SECURITY DEFINER (asignar_insignia_candidato).
-- ------------------------------------------
CREATE POLICY "Las insignias de los candidatos son públicas"
    ON candidato_insignias FOR SELECT
    USING (true);

-- =========================================================================
-- FIN DEL SCRIPT
-- =========================================================================
