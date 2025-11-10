import { addLibrary, removeLibrary, db } from '@/src/lib/db';
import { getCurrentUserIdFromHeaders } from '@/src/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const userId = getCurrentUserIdFromHeaders(req.headers);
  const state = db();
  const items = state.library.filter(x => x.userId === userId).map(x => {
    const app = [...state.apps, ...state.variants].find(a => a.id === x.appId);
    return app ? { ...app } : null;
  }).filter(Boolean);
  return new Response(JSON.stringify({ items }), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req) {
  const userId = getCurrentUserIdFromHeaders(req.headers);
  const body = await req.json();
  if (body.action === 'add') addLibrary(userId, body.appId);
  if (body.action === 'remove') removeLibrary(userId, body.appId);
  return new Response(JSON.stringify({ ok:true }), { headers: { 'Content-Type': 'application/json' } });
}
