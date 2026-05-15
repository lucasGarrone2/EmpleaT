import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-2-9b-it" });

async function test() {
    try {
        console.log("Calling gemma-3-12b...");
        const result = await model.generateContent("Hola, di tu nombre y versión.");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Error testing gemma-3-12b:", e.message);
    }
}
test();
