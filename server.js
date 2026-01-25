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
const MODEL_NAME = 'llama3'; // Ändra till 'mistral' om du föredrar den

app.post('/analyze', async (req, res) => {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Ingen text angiven.' });

    // "THE SCORECARD PROMPT" - Tvingar AI:n att betygsätta texten matematiskt
    // server.js (ersätt den gamla prompt-delen med detta)

// En neutral prompt som analyserar mönster istället för att jaga fel
const systemPrompt = `You are an expert linguistic analyst specialized in distinguishing between Human-written text and AI-generated text.

    Your analysis must be based on the following concrete indicators:

    ### HUMAN TEXT INDICATORS:
    1. **Specifics & Grounding:** Names, real-world locations, specific dates, or personal anecdotes.
    2. **Imperfection & Nuance:** Typo-like phrasing, slang, sentence fragments, or starting sentences with conjunctions like "But" or "And".
    3. **High Burstiness:** A mix of extremely short sentences (2-3 words) followed by very long, complex ones to create flow.
    4. **Uniqueness:** Text feels personal, unique, and clearly distinct from a formulaic template.

    ### AI TEXT INDICATORS (Look closely for these):
    1. **The "Tapestry" Vocabulary:** Overuse of words like: *delve, tapestry, landscape, realm, crucial, nuanced, multifaceted*.
    2. **Contextual Blindness:** The text seems unable to grasp the larger context, misses the point entirely, or references specific details without appropriate background context.
    3. **Empty Jargon:** Excessive use of buzzwords and jargon, often used to fill gaps in knowledge with generic vocabulary.
    4. **Incoherence & Abrupt Shifts:** Look for nonsensical or odd sentences. Watch for abrupt shifts in tone, style, or topic that suggest a struggle to maintain coherent ideas.
    5. **Repetitive Patterns:** Whereas humans vary structure for flow, AI often relies on repeated phrases, sentence structures, or memorized patterns.
    6. **Formulaic & False:** The text feels basic and formulaic. It may contain blatant falsehoods or unverifiable facts.

    ### EXAMPLES FOR CALIBRATION:

    [Example 1 - AI Generated]
    Text: "In the rapidly evolving landscape of technology, it is crucial to understand the multifaceted implications. Moreover, this digital realm offers a tapestry of opportunities. The blockchain synergizes with the cloud."
    Analysis: Uses "landscape", "crucial", "tapestry". Fills gaps with jargon ("synergizes"). Structure is repetitive and formulaic.
    Label: LLM-generated

    [Example 2 - Human Written]
    Text: "Honestly, I hate it when my phone dies. It's just... ugh. But anyway, yesterday I walked down to the corner store—the one by Mike's place—and bought a charger."
    Analysis: Contains conversational fillers ("ugh"), specific details ("Mike's place"), and varies sentence length drastically. Emotional and subjective.
    Label: Human-written

    ### YOUR TASK:
    Analyze the user's text. 
    1. First, list the signs of AI vs Human found in the text based on the indicators above.
    2. Then, make a final decision based on which side has stronger evidence.

    FINAL OUTPUT FORMAT (You must follow this):
    Analysis: [Your detailed thoughts here]
    FINAL_DECISION: [Human-written] or [LLM-generated]`;

// OBS: Se till att resten av koden (fullPrompt, fetch etc.) är kvar som innan.

    const fullPrompt = `${systemPrompt}\n\nTEXT TO ANALYZE:\n"${text}"`;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME, // Använd 'mistral' eller 'mistral-nemo'
                prompt: fullPrompt,
                stream: false,
                // I options-objektet i server.js
                    options: {
                        temperature: 0.0,  // Behåll 0.0 för konsekventa svar (viktigt för en detektor)
                        seed: 42,          // Bra, behåll detta
                        top_k: 20,         // Ändra från 1 till ca 40. Detta låter modellen överväga fler koncept innan den väljer ord.
                        top_p: 0.5         // Standardvärde som ger bra balans.
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