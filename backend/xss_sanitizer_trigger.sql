-- =========================================================================
-- TRIGGER DE SANITIZACIÓN PARA PREVENIR STORED XSS (DEFENSA EN PROFUNDIDAD)
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

-- 1. Función auxiliar para remover cualquier etiqueta HTML/Script
CREATE OR REPLACE FUNCTION public.sanitize_html_tags(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    -- Remueve recursivamente todas las etiquetas HTML de la forma <...>
    RETURN regexp_replace(input_text, '<[^>]*>', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Trigger y función para la tabla candidatos
CREATE OR REPLACE FUNCTION public.trig_sanitize_candidatos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nombre_completo := public.sanitize_html_tags(NEW.nombre_completo);
    NEW.titulo_profesional := public.sanitize_html_tags(NEW.titulo_profesional);
    NEW.sobre_mi := public.sanitize_html_tags(NEW.sobre_mi);
    IF NEW.ubicacion IS NOT NULL THEN
        NEW.ubicacion := public.sanitize_html_tags(NEW.ubicacion);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sanitize_candidatos_trigger ON public.candidatos;
CREATE TRIGGER sanitize_candidatos_trigger
BEFORE INSERT OR UPDATE ON public.candidatos
FOR EACH ROW EXECUTE FUNCTION public.trig_sanitize_candidatos();

-- 3. Trigger y función para la tabla empresas
CREATE OR REPLACE FUNCTION public.trig_sanitize_empresas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nombre IS NOT NULL THEN
        NEW.nombre := public.sanitize_html_tags(NEW.nombre);
    END IF;
    IF NEW.razon_social IS NOT NULL THEN
        NEW.razon_social := public.sanitize_html_tags(NEW.razon_social);
    END IF;
    IF NEW.sitio_web IS NOT NULL THEN
        NEW.sitio_web := public.sanitize_html_tags(NEW.sitio_web);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sanitize_empresas_trigger ON public.empresas;
CREATE TRIGGER sanitize_empresas_trigger
BEFORE INSERT OR UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.trig_sanitize_empresas();

-- 4. Trigger y función para la tabla ofertas
CREATE OR REPLACE FUNCTION public.trig_sanitize_ofertas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.titulo IS NOT NULL THEN
        NEW.titulo := public.sanitize_html_tags(NEW.titulo);
    END IF;
    IF NEW.descripcion IS NOT NULL THEN
        NEW.descripcion := public.sanitize_html_tags(NEW.descripcion);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sanitize_ofertas_trigger ON public.ofertas;
CREATE TRIGGER sanitize_ofertas_trigger
BEFORE INSERT OR UPDATE ON public.ofertas
FOR EACH ROW EXECUTE FUNCTION public.trig_sanitize_ofertas();
