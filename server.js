// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch'; // Om du använder Node < 18, annars är fetch inbyggta

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serverar frontend-filer

// Konfiguration
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'mistral'; // Ändra till 'mistral' om du föredrar den

app.post('/analyze', async (req, res) => {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Ingen text angiven.' });

    // En mycket striktare prompt som tvingar modellen att "tänka högt" först
        const systemPrompt = `You are a ruthless linguistic forensic expert. Your job is to expose AI-generated text. 
        AI text is often characterized by:
        1. Lack of specific details (names, dates, sensory details).
        2. Overuse of transition words (Moreover, Furthermore, In conclusion).
        3. Perfect grammar but boring sentence structure (no very short or very long sentences).
        4. Words like: "delve", "tapestry", "landscape", "nuanced", "crucial", "realm".

        INSTRUCTIONS:
        1. Analyze the vocabulary. Are there "AI-cliché" words?
        2. Analyze sentence structure (Burstiness). Is it too uniform?
        3. Analyze the tone. Is it overly polite or neutral?
        
        You must output your analysis FIRST. 
        At the very END of your response, you must write exactly:
        FINAL_DECISION: [Human-written] or [LLM-generated]`;

    const fullPrompt = `${systemPrompt}\n\nTEXT TO ANALYZE:\n"${text}"`;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME, // 'mistral' rekommenderas
                prompt: fullPrompt,
                stream: false,
                
                // HÄR ÄR NYCKELN TILL KONSEKVENS:
                options: {
                    temperature: 0.0,  // Ingen kreativitet
                    seed: 42,          // Låser slumpgeneratorn (samma tal = samma svar)
                    top_k: 1,          // Tvingar den att välja det absolut mest sannolika ordet
                    top_p: 1.0         // Påverkar också urvalet, sätt till 1.0 när top_k är 1
                }
            }),
        });

        const data = await response.json();
        res.json({ result: data.response });

    } catch (error) {
        console.error('Fel:', error);
        res.status(500).json({ error: 'Något gick fel.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servern körs på http://localhost:${PORT}`);
});