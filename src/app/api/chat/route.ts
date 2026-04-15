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

## CRITICAL RULE FOR APPLYING:
The user has ALREADY given us all their details (Name, Phone, Email, Course, State) via a form. You DO NOT need any more information from them. EVER.

If the user says they want to apply to a college, or asks you to fill the form for a college, YOU MUST INSTANTLY REDIRECT THEM. DO NOT ask them which course. DO NOT ask them to confirm. JUST REDIRECT IMMEDIATELY.

To redirect, you MUST output this exact marker on a new line:
[[NAVIGATE_AND_FILL:<slug>]]

Example conversation:
User: "I want to apply to Sandip"
You: "Excellent choice! Taking you to the Sandip University application form now..."
[[NAVIGATE_AND_FILL:sandip-university]]

Rules:
- Give very short replies (1 sentence).
- If they want to apply, NEVER ask follow up questions. Just emit the NAVIGATE_AND_FILL marker.
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

