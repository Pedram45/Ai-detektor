// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Konfiguration
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'mistral'; 

// DIN LISTA MED BUZZWORDS
// Vi lägger dem i en array för att enkelt kunna hantera dem
const aiBuzzwords = [
    "along with", "amidst", "arduous", "cannot be overstated", "conversely",
    "delve", "ecommerce", "entails", "entrenched", "essential", "foster",
    "foray", "furthermore", "glean", "grasp", "hinder",
    "i hope this email finds you well", "in conclusion", 
    "in today’s rapidly evolving market", "integral", "intricate", 
    "kaleidoscope", "linchpin", "manifold", "moreover", "multifaceted", 
    "nuanced", "on the contrary", "pivotal", "plethora", "preemptively", 
    "pronged", "realm", "robust", "strive", "tailor", "tapestry", 
    "underpins", "unparalleled", "vast", "underscore", "arguably", 
    "bolster", "differentiate"
];

app.post('/analyze', async (req, res) => {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Ingen text angiven.' });

    // Vi konverterar listan till en kommaseparerad sträng för prompten
    const buzzwordString = aiBuzzwords.join(', ');

    // Uppdaterad prompt som inkluderar din lista
    const systemPrompt = `You are a ruthless linguistic forensic expert. Your job is to expose AI-generated text. 
        
    CRITICAL: You must scan the text for the following "AI-Giveaway" buzzwords. 
    If the text contains several of these, it is almost certainly AI-generated:
    [${buzzwordString}]

    AI text is also characterized by:
    1. Lack of specific details (names, dates, sensory details).
    2. Perfect grammar but boring sentence structure (no very short or very long sentences).
    3. Overly polite or neutral tone.

    INSTRUCTIONS:
    1. CHECK FOR BUZZWORDS: List any of the specific buzzwords found from the list above. if found, treat them as strong evidence of AI.
    2. Analyze sentence structure (Burstiness). Is it too uniform?
    3. Analyze the tone.
    
    You must output your analysis FIRST. 
    At the very END of your response, you must write exactly:
    FINAL_DECISION: [Human-written] or [LLM-generated]`;

    const fullPrompt = `${systemPrompt}\n\nTEXT TO ANALYZE:\n"${text}"`;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: 0.0, 
                    seed: 42,          
                    top_k: 1,          
                    top_p: 1.0         
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