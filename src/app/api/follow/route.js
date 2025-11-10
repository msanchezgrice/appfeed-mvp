import { db, flush } from '@/src/lib/db';
import { getCurrentUserIdFromHeaders } from '@/src/lib/utils';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  const userId = getCurrentUserIdFromHeaders(req.headers);
  const { creatorId, action } = await req.json();
  const state = db();
  if (action === 'follow') {
    if (!state.follows.find(f => f.userId === userId && f.creatorId === creatorId)) {
      state.follows.push({ userId, creatorId });
    }
  } else if (action === 'unfollow') {
    state.follows = state.follows.filter(f => !(f.userId === userId && f.creatorId === creatorId));
  }
  flush();
  return new Response(JSON.stringify({ ok:true }), { headers: { 'Content-Type': 'application/json' } });
}
