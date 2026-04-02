import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PDFParse as pdfParse } from 'pdf-parse';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express(); //Inicializa servidor y permisos
app.use(cors()); //Permite la comunicacion de react con el backend
app.use(express.json());

// 3. Configuramos al "cartero" (Multer) para que ataje el PDF.
// IMPORTANTE: Lo guardamos en "memoryStorage". Esto significa que el PDF vive en la memoria RAM 
// por 2 segundos mientras lo leemos, y luego se destruye solo. No te llena el disco duro de basura.
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
app.post('/api/analyze-cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No enviaste ningun Archivo PDF" });

    }
    console.log("PDF recibido, extrayendo informacion");

    const parser = new pdfParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    await parser.destroy();
    const cvText = pdfData.text;

    console.log("Texto extraido, analizando...");

   const prompt = `
Actúa como un reclutador experto en IT. Analiza el siguiente texto extraído de un currículum.
Extrae la información clave y devuélvela ESTRICTAMENTE en formato JSON válido, sin ningún texto adicional.

Estructura requerida:
{
    "nombre": "Nombre y apellido del candidato",
    "profesion": "Ej: Frontend Developer, Data Scientist",
    "skills": [
        { "nombre": "React", "nivel": 4 }, 
        { "nombre": "Trabajo en equipo", "nivel": 3 }
    ],
    "experiencia_anios": 2
}

REGLAS ESTRICTAS DE EXTRACCIÓN:

1. Regla de Años de Experiencia ('experiencia_anios'):
   - SUMA ÚNICAMENTE el tiempo de experiencia laboral real.
   - IGNORA por completo el tiempo de estudio o bootcamps.
   - Si la experiencia laboral es nula o menor a 4 meses, el valor OBLIGATORIO es 0.
   - Si la experiencia es entre 4 meses y 1.5 años, el valor es 1.
   - Mayor a 1.5 años, redondea al número entero más cercano.

2. Regla de Niveles de Skills (del 1 al 5):
   - Nivel 1 (Básico): Solo teórico o cursos.
   - Nivel 2 (Junior): Bootcamps o proyectos personales.
   - Nivel 3 (Intermedio): Entorno laboral real (hasta 2 años).
   - Nivel 4 (Avanzado): Uso sólido en trabajos (3 a 5 años).
   - Nivel 5 (Experto): Referente, más de 5 años.

3. Regla de Nomenclatura de Skills (Parámetro ESCO):
   - Utiliza el marco de referencia ESCO (European Skills, Competences, Qualifications and Occupations) como guía para nombrar las habilidades.
   - Estandariza los nombres: Usa "Desarrollo web frontend" en lugar de "Hacer páginas web", o "Trabajo en equipo" en lugar de "Me gusta trabajar con otros".
   - Extrae tanto "Hard Skills" (tecnologías, lenguajes, herramientas) como "Soft Skills" (competencias transversales).
   - Evita frases largas, jerga de empresas específicas o verbos conjugados. Limítate a conceptos concretos (ej: "Python", "Liderazgo", "Gestión de bases de datos").

4. Regla de Extracción Exhaustiva e Inferencia (¡MUY IMPORTANTE!):
   - NO te limites a lo mínimo. Extrae TODAS las skills mencionadas explícitamente.
   - DEDUCE e INFIERE habilidades fundamentales basadas en la profesión o en el conjunto de herramientas. (Ejemplo: Si el rol es "Cloud Engineer" o menciona AWS/Azure, DEBES agregar imperativamente la skill general "Cloud Computing" o similar, aunque no lo diga textual).
   - Apunta a extraer un perfil muy denso y robusto, garantizando que el candidato no pierda oportunidades por omitir obviedades de su rubro.

Texto del CV:
${cvText}
`;

    //Aca llamas a gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(prompt);
    let textResponse = result.response.text();

    console.log("Respuesta cruda de Gemini:", textResponse);

    // Limpiar cualquier residuo de markdown si Gemini no respeta el MimeType estrictamente
    const cleanJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const finalData = JSON.parse(cleanJson);

    console.log("Analisis completado");

    //Mandas la respuesta a react
    res.json(finalData);

  }
  catch (error) {
    console.log("Error en el servidor: ", error.message);
    res.status(500).json({ error: "Error del servidor: " + error.message });
  }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend de empleat corriendo en http://localhost:${PORT}`);
});