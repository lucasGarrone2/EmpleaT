// Utility module for handling runtime Feature Flags and Limits in the Frontend

let cachedFlags = null;
let cachedLimits = null;
let fetchPromise = null;

export async function fetchFeatureFlags() {
  if (cachedFlags && cachedLimits) {
    return { flags: cachedFlags, limits: cachedLimits };
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${backendUrl}/api/feature-flags`);
      if (!res.ok) throw new Error('Error al obtener flags');
      const data = await res.json();
      cachedFlags = data.flags || {};
      cachedLimits = data.limits || {};
      return { flags: cachedFlags, limits: cachedLimits };
    } catch (err) {
      console.warn('Falló obtención de feature flags, usando valores por defecto:', err);
      cachedFlags = {
        extraccion_cv: true,
        quiz_skill: true,
        simulacion_entrevista: true,
        adaptacion_cv: false,
        generacion_bio: false,
        boost_oferta: false
      };
      cachedLimits = {
        simulacion_max_input_chars: 600,
        simulacion_max_output_tokens: 350,
        extraccion_cv_mensual: 5,
        quiz_skill_mensual: 5,
        simulacion_entrevista_por_oferta: 1
      };
      return { flags: cachedFlags, limits: cachedLimits };
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function isFeatureActive(flags, featureName, defaultValue = false) {
  if (!flags) return defaultValue;
  return Boolean(flags[featureName]);
}
