import { upsertSecret, getSecret } from '@/src/lib/db';
import { encryptString, decryptString } from '@/src/lib/crypto';
import { getCurrentUserIdFromHeaders } from '@/src/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const userId = getCurrentUserIdFromHeaders(req.headers);
  const openai = getSecret({ userId, provider: 'openai' });
  let openaiStatus = 'missing';
  if (openai) {
    try {
      const parsed = JSON.parse(decryptString(openai.encPayload));
      openaiStatus = parsed.apiKey ? 'present' : 'invalid';
    } catch { openaiStatus = 'invalid'; }
  }
  return new Response(JSON.stringify({ providers: { openai: openaiStatus } }), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = getCurrentUserIdFromHeaders(req.headers);
    if (body.provider === 'openai') {
      const encPayload = encryptString(JSON.stringify({ apiKey: body.apiKey }));
      upsertSecret({ userId, provider: 'openai', encPayload });
      return new Response(JSON.stringify({ ok:true }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error:'Unsupported provider' }), { status:400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status:500 });
  }
}
