-- Añadir restricción UNIQUE compuesta para evitar múltiples postulaciones de una misma persona a un mismo empleo
-- Esto solucionará a nivel de base de datos el problema de Race Conditions generado por clicks rápidos o bots.

ALTER TABLE postulaciones
ADD CONSTRAINT unique_candidato_oferta UNIQUE (candidato_id, oferta_id);
