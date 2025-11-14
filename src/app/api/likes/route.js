import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { logEventServer } from '@/src/lib/metrics';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { appId, action } = await req.json();
    
    if (!appId) {
      return new Response(JSON.stringify({ error: 'appId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'like') {
      // Insert like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          app_id: appId
        });
      
      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error liking app:', error);
        return new Response(JSON.stringify({ error: 'Failed to like app' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Track analytics
      try {
        await supabase.rpc('track_app_event', {
          p_app_id: appId,
          p_user_id: userId,
          p_event_type: 'like'
        });
      } catch (err) {
        console.error('Analytics error:', err);
      }
      // Vercel WA custom event
      logEventServer('app_like', { appId });
    } else if (action === 'unlike') {
      // Delete like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('app_id', appId);
      
      if (error) {
        console.error('Error unliking app:', error);
        return new Response(JSON.stringify({ error: 'Failed to unlike app' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Track analytics
      try {
        await supabase.rpc('track_app_event', {
          p_app_id: appId,
          p_user_id: userId,
          p_event_type: 'unlike'
        });
      } catch (err) {
        console.error('Analytics error:', err);
      }
      // Vercel WA custom event
      logEventServer('app_unlike', { appId });
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
    console.error('Likes POST error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user's likes
    const { data: likes, error } = await supabase
      .from('likes')
      .select('app_id')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching likes:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch likes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const appIds = likes?.map(l => l.app_id) || [];
    
    return new Response(JSON.stringify({ appIds }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Likes GET error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

