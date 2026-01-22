// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch'; // Om du använder Node < 18, annars är fetch inbyggt

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

    // "THE SCORECARD PROMPT" - Tvingar AI:n att betygsätta texten matematiskt
    const systemPrompt = `You are a ruthless AI-detection algorithm. Your task is to audit the text below and calculate a "Humanity Score".

    Step 1: Scan for "The Forbidden Words" (AI fingerprints).
    Check for: "Delve, Tapestry, Landscape, Nuanced, Crucial, Underscore, Leverage, Spearhead, Foster, Demystify, In conclusion, Ultimately, Moreover".
    -> If found: High probability of AI.

    Step 2: Analyze Sentence Variance (Burstiness).
    - AI text: Sentences are often 15-25 words long, with a consistent rhythm.
    - Human text: Chaos. Some sentences are 2 words. Some are 50. Fragments. Run-on sentences.
    -> If uniform: High probability of AI.

    Step 3: Check for "Hallucinated Perfection".
    - AI text: Grammar is 100% perfect. No typos. No dangling modifiers.
    - Human text: Often contains slight stylistic errors, slang, or awkward phrasing.
    -> If perfect: High probability of AI.

    Step 4: Check for Specificity.
    - AI text: "It is important to consider various factors..." (Vague)
    - Human text: "I dropped my coffee on the rug yesterday..." (Specific, Anecdotal)

    REQUIRED RESPONSE FORMAT:
    SCORECARD:
    1. Vocabulary Analysis: [List any forbidden words found or note "Clean"]
    2. Burstiness Check: [Describe if sentences are robotically smooth or chaotic]
    3. Specificity Check: [Vague vs Concrete details]
    
    VERDICT REASONING: [Summarize the evidence above]

    FINAL_DECISION: [Human-written] or [LLM-generated]`;

    const fullPrompt = `${systemPrompt}\n\nTEXT TO ANALYZE:\n"${text}"`;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME, // Använd 'mistral' eller 'mistral-nemo'
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: 0.0, // Måste vara 0 för maximal logik
                    seed: 123,        // Låser resultatet
                    num_ctx: 4096     // Ger den mer minne att läsa texten
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