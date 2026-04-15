import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const ADMISSION_INDIA_CONTEXT = `
You are an intelligent assistant for "Admission India", a premium education consultancy.
Your goal is to help students with Medical, Engineering, and Management admissions.
Key Services:
- Medical: MBBS, BDS, PG Medical (India & Abroad)
- Engineering: IITs, NITs, Top Private Colleges
- Management: MBA, PGDM, Executive MBA
- Study Abroad: USA, UK, Canada, Australia, Europe

Tone: Professional, encouraging, and trustworthy.
`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const openai = createOpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: "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",
        });

        const result = await streamText({
            model: openai('google/gemini-2.0-flash-exp:free') as any,
            messages,
            system: `${ADMISSION_INDIA_CONTEXT}
      
      STRICT PROTOCOL:
      1. You are a helpful AI for Admission India.
      2. Keep answers SHORT (max 1-2 sentences).
      3. If user asks to go to a page, YOU MUST say something like "Opening that page for you" AND include the [[NAVIGATE:/path]] tag.
         - Medical -> [[NAVIGATE:/medical]]
         - Engineering -> [[NAVIGATE:/engineering]]
         - Management -> [[NAVIGATE:/management]]
         - Study Abroad -> [[NAVIGATE:/study-abroad]]
         - Contact -> [[NAVIGATE:/contact]]
      4. Example: "Certainly! Here is the Medical Colleges page. [[NAVIGATE:/medical]]"
      5. Do NOT list services if you are navigating. Just navigate.
      `,
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
