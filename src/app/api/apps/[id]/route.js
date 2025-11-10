import { db, getAppById } from '@/src/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  const state = db();
  const app = getAppById(params.id);
  if (!app) return new Response(JSON.stringify({ error: 'Not found' }), { status:404 });
  const creator = state.creators.find(c => c.id === app.creatorId);
  return new Response(JSON.stringify({ app, creator }), { headers: { 'Content-Type': 'application/json' } });
}
