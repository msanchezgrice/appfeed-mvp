import { runApp } from '@/src/lib/runner';
import { getAppById } from '@/src/lib/db';
import { getCurrentUserIdFromHeaders } from '@/src/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const app = getAppById(body.appId);
    if (!app) return new Response(JSON.stringify({ error:'App not found' }), { status:404 });
    const inputs = body.inputs || {};
    const mode = body.mode === 'use' ? 'use' : 'try';
    const userId = getCurrentUserIdFromHeaders(req.headers);
    const run = await runApp({ app, inputs, userId, mode });
    return new Response(JSON.stringify(run), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status:500 });
  }
}
