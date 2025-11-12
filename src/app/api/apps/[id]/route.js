import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { supabase } = await createServerSupabaseClient({ allowAnonymous: true });
    const { id } = params;
    
    console.log('[API /apps/[id]] GET request for app:', id);
    
    // Get app with creator info
    const { data: app, error } = await supabase
      .from('apps')
      .select(`
        *,
        creator:profiles!apps_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !app) {
      console.error('[API /apps/[id]] App not found:', id, error);
      return new Response(JSON.stringify({ error: 'App not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Increment view count
    try {
      await supabase
        .from('apps')
        .update({ view_count: (app.view_count || 0) + 1 })
        .eq('id', id);
    } catch (err) {
      console.error('[API /apps/[id]] Error incrementing view count:', err);
    }
    
    console.log('[API /apps/[id]] App loaded:', app.name);
    
    return new Response(JSON.stringify(app), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('[API /apps/[id]] Error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
