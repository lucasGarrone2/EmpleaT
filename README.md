# 🚀 EmpleaT
EmpleaT es una plataforma moderna de búsqueda de empleo que utiliza Inteligencia Artificial (Google Gemini) para revolucionar el proceso de selección y reclutamiento. Conecta a candidatos y empresas a través de un sistema de emparejamiento inteligente basado en el marco europeo ESCO (European Skills, Competences, Qualifications and Occupations).

## ✨ Características Principales
### Para Candidatos 🦸‍♂️
* **Carga de perfil impulsada por IA:** Olvídate de llenar formularios manuales. El candidato sube su CV en formato PDF, y la IA de Gemini extrae automáticamente sus datos, experiencia y habilidades.
* **Estandarización de Skills:** Las habilidades extraídas se mapean automáticamente al diccionario estandarizado ESCO, normalizando los perfiles.
* **Explorador de Ofertas:** Listado de ofertas de trabajo con interfaz amigable y fácil postulación.
* **Dashboard Personal:** Gestión de perfil y postulaciones activas.

### Para Empresas 🏢
* **Gestión de Ofertas:** Creación dinámica de ofertas de empleo definiendo los requisitos clave.
* **Ranking Inteligente (Smart Match):** Las empresas no tienen que leer cientos de CVs vacíos. El sistema ordena automáticamente a los candidatos postulados calculando un porcentaje de compatibilidad basado en la coincidencia de skills estandarizadas (trigramas).
* **Dashboard de Reclutador:** Panel centralizado para analizar rápidamente el talento e invitar a entrevistas.

## 🛠️ Stack Tecnológico
El proyecto está dividido en dos partes independientes:

**Frontend (Cliente)**
* **Framework:** React + Vite
* **Navegación:** React Router DOM
* **Estilos:** CSS Modules / Vanilla CSS moderno
* **Base de Datos & Autenticación:** Supabase Client (@supabase/supabase-js)
* **Iconos:** Lucide React

**Backend (Microservicio IA)**
* **Entorno:** Node.js + Express
* **Procesamiento de Archivos:** Multer (Memory Storage) + PDF-Parse
* **Inteligencia Artificial:** @google/generative-ai (Gemini 2.5 Flash)

**Base de Datos**
* **Proveedor:** Supabase (PostgreSQL)
* **Búsqueda Difusa:** Extensión pg_trgm para cálculo de similitud entre texto y skills.
* **Seguridad:** Implementación estricta de Row Level Security (RLS).

## 📄 Licencia
Este proyecto es privado y todos los derechos están reservados.
