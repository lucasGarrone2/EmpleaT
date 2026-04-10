import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  console.log("Modelos disponibles:");
  data.models.forEach(m => {
    if (m.supportedGenerationMethods.includes("generateContent")) {
      console.log(`- ${m.name}`);
    }
  });
}
checkModels();
