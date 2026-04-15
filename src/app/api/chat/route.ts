import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

const SYSTEM_PROMPT = `
You are an "Admission Now" (admissionnow.net) assistant.

## AVAILABLE COLLEGES & SLUGS:
- Graphic Era University → slug: graphic-era
- COER University → slug: coer-university
- Uttaranchal University → slug: uttaranchal-university
- Sandip University → slug: sandip-university
- Noida International University → slug: noida-international

## RULES FOR CONVERSATION:
You are highly polite, conversational, and helpful. 
If the user isn't sure where to apply, tell them about the options and ask them which program they need. 
Help them decide which university is best for them.

## TRIGGERING THE APPLICATION FORM:
Once the user has explicitly decided on a university and says they want to apply (e.g., "Take me to Sandip", "I want to apply to Graphic Era now"), you must say something nice and then INSTANTLY REDIRECT THEM.

To redirect, you MUST output this exact marker on a new line:
[[NAVIGATE_AND_FILL:<slug>]]

Example:
User: "I want to apply to Sandip"
You: "Excellent choice! Taking you to the Sandip University application form now..."
[[NAVIGATE_AND_FILL:sandip-university]]
`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const groq = createOpenAI({
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY!,
        });

        const result = await streamText({
            model: groq('llama-3.1-8b-instant'),
            messages,
            system: SYSTEM_PROMPT,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

