export const maxDuration = 10;

// Saves lead to Upstash Redis via REST (no SDK needed)
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in Vercel env vars

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, phone, email, course, state } = body;

        if (!name || !phone) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const lead = {
            name,
            phone,
            email: email || '',
            course: course || '',
            state: state || '',
            submittedAt: new Date().toISOString(),
        };

        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (url && token) {
            // Push lead to a Redis list called "leads"
            const res = await fetch(`${url}/lpush/leads/${encodeURIComponent(JSON.stringify(lead))}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                console.error('Upstash write failed:', await res.text());
            }
        } else {
            // No Redis configured — just log it (you'll see it in Vercel runtime logs)
            console.log('LEAD CAPTURED:', JSON.stringify(lead));
        }

        return Response.json({ ok: true });
    } catch (err) {
        console.error('Lead API error:', err);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}

// GET /api/leads — view all captured leads (password protected)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const pass = searchParams.get('key');

    if (pass !== process.env.LEADS_ADMIN_KEY) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return Response.json({ error: 'Redis not configured' }, { status: 500 });
    }

    // Get all leads from the list (max 500)
    const res = await fetch(`${url}/lrange/leads/0/499`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const leads = (data.result || []).map((item: string) => {
        try { return JSON.parse(item); } catch { return item; }
    });

    return Response.json({ total: leads.length, leads });
}
