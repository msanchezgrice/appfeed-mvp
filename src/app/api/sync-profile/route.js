import { syncProfileFromClerk } from '@/src/lib/sync-profile';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, username, email, displayName, avatarUrl } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await syncProfileFromClerk(userId, {
      username,
      email,
      displayName,
      avatarUrl
    });
    
    return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' } 
      });
  } catch (e) {
    console.error('Sync profile error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
