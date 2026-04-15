import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const ADMISSION_INDIA_CONTEXT = `
You are an intelligent assistant for "Admission Now" (admissionnow.net), a premium education consultancy in India.
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

        const result = await streamText({
            model: google('gemini-2.0-flash-exp'),
            messages,
            system: `${ADMISSION_INDIA_CONTEXT}
      
      STRICT PROTOCOL:
      1. You are a helpful AI assistant for Admission Now.
      2. Keep answers SHORT and friendly (max 2-3 sentences).
      3. Help students with college admissions, course selection, and guidance.
      4. Be warm, professional, and encouraging.
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

