import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];

async function testModels() {
  for (const modelName of MODELS) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Devuelve este JSON: {"status": "ok"}');
      console.log(`✅ ${modelName} OK`);
    } catch (e) {
      console.log(`❌ ${modelName} FALLÓ: ${e.message}`);
    }
  }
}
testModels();
