import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { logEventServer } from '@/src/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user's saved apps
    const { data: saves, error } = await supabase
      .from('library_saves')
      .select(`
        created_at,
        app:apps (
          *,
          creator:profiles!apps_creator_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60);
    
    if (error) {
      console.error('Error fetching library:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch library' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Flatten the structure
    const items = saves?.map(s => s.app).filter(Boolean) || [];
    
    return new Response(JSON.stringify({ items }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Library GET error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.json();
    const { action, appId } = body;
    
    if (!appId) {
      return new Response(JSON.stringify({ error: 'appId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'add') {
      // Insert save
      const { error } = await supabase
        .from('library_saves')
        .insert({ user_id: userId, app_id: appId });
      
      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error saving app:', error);
        return new Response(JSON.stringify({ error: 'Failed to save app' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Track analytics
      await supabase.rpc('track_app_event', {
        p_app_id: appId,
        p_user_id: userId,
        p_event_type: 'save'
      });
      logEventServer('app_save', { appId });
    } else if (action === 'remove') {
      // Delete save
      const { error } = await supabase
        .from('library_saves')
        .delete()
        .eq('user_id', userId)
        .eq('app_id', appId);
      
      if (error) {
        console.error('Error removing save:', error);
        return new Response(JSON.stringify({ error: 'Failed to remove save' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Track analytics
      await supabase.rpc('track_app_event', {
        p_app_id: appId,
        p_user_id: userId,
        p_event_type: 'unsave'
      });
      logEventServer('app_unsave', { appId });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Library POST error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
