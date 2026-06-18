-- Agregar la columna 'premium_hasta' a la tabla 'candidatos'
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS premium_hasta TIMESTAMP WITH TIME ZONE;
