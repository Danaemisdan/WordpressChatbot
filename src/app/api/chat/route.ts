import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const ADMISSION_INDIA_CONTEXT = `
You are an intelligent assistant for "Admission Now" (admissionnow.net), a premium education consultancy in India.
Your goal is to help students with Medical, Engineering, and Management college admissions.
Key Services:
- Medical: MBBS, BDS, PG Medical (India & Abroad)  
- Engineering: IITs, NITs, Top Private Colleges
- Management: MBA, PGDM, Executive MBA
- Study Abroad: USA, UK, Canada, Australia, Europe

Tone: Professional, warm, encouraging, and trustworthy. Keep replies concise (2-3 sentences max).
`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Using Groq - 100% free tier, no credits needed, extremely fast
        const groq = createOpenAI({
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY!,
        });

        const result = await streamText({
            model: groq('llama-3.1-8b-instant'),
            messages,
            system: ADMISSION_INDIA_CONTEXT,
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

