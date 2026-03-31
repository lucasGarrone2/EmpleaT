EmpleaT - Conectando Talento IT con IA 🚀
EmpleaT es una plataforma moderna de búsqueda de empleo diseñada para el sector tecnológico. El núcleo del proyecto es la automatización del perfil del candidato mediante Inteligencia Artificial, permitiendo que un usuario suba su CV en PDF y el sistema extraiga automáticamente sus habilidades, nivel de experiencia y cargo profesional.

✨ Características Principales
Autenticación Segura: Registro e inicio de sesión de usuarios gestionado por Supabase Auth.

Análisis de CV con IA: Integración con la API de Google Gemini para procesar archivos PDF en tiempo real.

Extracción de Skills: Identificación de Hard y Soft Skills con asignación de niveles (1-5) basada en el contexto del currículum.

Base de Datos Relacional: Estructura de datos optimizada en PostgreSQL para manejar perfiles de candidatos, empresas, ofertas y un diccionario maestro de habilidades.

Estandarización ESCO: Mapeo de habilidades detectadas contra el estándar europeo de competencias para mejorar el matching.

🛠️ Stack Tecnológico
Frontend:

React.js (Vite)

React Router DOM

Context API para gestión de estado global (Auth)

Backend:

Node.js & Express

Multer (Procesamiento de archivos en memoria)

Pdf-parse (Extracción de texto de PDF)

Google Generative AI SDK (Gemini API)

Base de Datos y Servicios:

Supabase (PostgreSQL)

Supabase Storage (Opcional para almacenamiento de archivos)
