import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log("Fetching models...");
        // Use fetch directly to call the REST API for models
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        
        if (data.models) {
            const gemmaModels = data.models.filter(m => m.name.toLowerCase().includes('gemma'));
            console.log("All Gemma models:", gemmaModels.map(m => m.name));
            
            // Log all models to see if there's any gemma-3
            const allNames = data.models.map(m => m.name);
            console.log("All Models:", allNames.filter(n => n.includes('gemma-3')));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Error fetching models:", e.message);
    }
}
listModels();
