import dotenv from 'dotenv';
dotenv.config();

async function testOpenAICompat() {
    try {
        console.log("Calling gemma-3-12b via OpenAI compatibility endpoint...");
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gemma-3-12b-it',
                messages: [{ role: 'user', content: 'Say hello in spanish' }]
            })
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
testOpenAICompat();
