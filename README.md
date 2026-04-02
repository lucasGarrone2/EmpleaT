# 🚀 EmpleaT

**EmpleaT** es una plataforma moderna de búsqueda de empleo que utiliza **Inteligencia Artificial (Google Gemini)** para revolucionar el proceso de selección y reclutamiento. Conecta a candidatos y empresas a través de un sistema de emparejamiento inteligente basado en el marco europeo **ESCO** (European Skills, Competences, Qualifications and Occupations).

---

## ✨ Características Principales

### Para Candidatos 🦸‍♂️
- **Carga de perfil impulsada por IA:** Olvídate de llenar formularios manuales. El candidato sube su CV en formato PDF, y la IA de Gemini extrae automáticamente sus datos, experiencia y habilidades.
- **Estandarización de Skills:** Las habilidades extraídas se mapean automáticamente al diccionario estandarizado ESCO, normalizando los perfiles.
- **Explorador de Ofertas:** Listado de ofertas de trabajo con interfaz amigable y fácil postulación.
- **Dashboard Personal:** Gestión de perfil y postulaciones activas.

### Para Empresas 🏢
- **Gestión de Ofertas:** Creación dinámica de ofertas de empleo definiendo los requisitos clave.
- **Ranking Inteligente (Smart Match):** Las empresas no tienen que leer cientos de CVs vacíos. El sistema ordena automáticamente a los candidatos postulados calculando un porcentaje de compatibilidad basado en la coincidencia de skills estandarizadas (trigramas).
- **Dashboard de Reclutador:** Panel centralizado para analizar rápidamente el talento e invitar a entrevistas.

---

## 🛠️ Stack Tecnológico

El proyecto está dividido en dos partes independientes:

### **Frontend (Cliente)**
- **Framework:** React + Vite
- **Navegación:** React Router DOM
- **Estilos:** CSS Modules / Vanilla CSS moderno
- **Base de Datos & Autenticación:** Supabase Client (`@supabase/supabase-js`)
- **Iconos:** Lucide React

### **Backend (Microservicio IA)**
- **Entorno:** Node.js + Express
- **Procesamiento de Archivos:** Multer (Memory Storage) + PDF-Parse
- **Inteligencia Artificial:** `@google/generative-ai` (Gemini 2.5 Flash)

### **Base de Datos**
- **Proveedor:** Supabase (PostgreSQL)
- **Búsqueda Difusa:** Extensión `pg_trgm` para cálculo de similitud entre texto y skills.

---

## ⚙️ Requisitos Previos

Para ejecutar el proyecto en tu entorno local necesitas:
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- Git
- Una cuenta en [Supabase](https://supabase.com/)
- Una API Key de [Google Gemini / Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/EmpleaT.git
cd EmpleaT
```

### 2. Configurar la Base de Datos (Supabase)
1. Crea un proyecto en Supabase.
2. Ejecuta el script SQL incluido en `backend/migracion_esco.sql` dentro del SQL Editor de Supabase. Esto instalará las extensiones necesarias (`pg_trgm`) y configurará las funciones críticas para el *Fuzzy Match* de skills.
3. Asegúrate de tener habilitada la Autenticación mediante Email/Contraseña.

### 3. Configurar el Frontend
```bash
cd frontend
npm install
```
Renombra (o crea) un archivo llamado `.env.local` en la raíz de `frontend/` y añade tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui
```

Inicia el entorno de desarrollo:
```bash
npm run dev
```

### 4. Configurar el Backend
Abre otra terminal y navega al backend:
```bash
cd backend
npm install
```
Crea un archivo llamado `.env` en la raíz de `backend/` e incluye tu clave de Gemini:
```env
GEMINI_API_KEY=tu_api_key_de_gemini_aqui
PORT=3000
```

Inicia el servidor backend:
```bash
npm run dev
```

---

## 🤝 Contribuir
Las contribuciones o mejoras para iterar sobre el MVP son bienvenidas. Si deseas colaborar:
1. Haz un *Fork* del proyecto.
2. Crea tu rama de características (`git checkout -b feature/NuevaCaracteristica`).
3. Haz *Commit* de tus cambios (`git commit -m 'Añade una nueva característica'`).
4. Haz *Push* a tu rama (`git push origin feature/NuevaCaracteristica`).
5. Abre un *Pull Request*.

## 📄 Licencia
Este proyecto es privado y todos los derechos están reservados.
