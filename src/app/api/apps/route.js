import { db } from '@/src/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  const state = db();
  const items = [...state.apps, ...state.variants].map(a => ({
    ...a,
    creator: state.creators.find(c => c.id === a.creatorId),
    stats: {
      saves: state.library.filter(r => r.appId === a.id).length,
      runs: state.runs.filter(r => r.appId === a.id).length
    }
  }));
  return new Response(JSON.stringify({ apps: items, tags: state.tags, creators: state.creators }), { headers: { 'Content-Type': 'application/json' } });
}
