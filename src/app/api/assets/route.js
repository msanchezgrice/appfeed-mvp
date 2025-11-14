import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET /api/assets?mine=1 → list saved run assets for current user
export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine');
    if (!mine) {
      return new Response(JSON.stringify({ error: 'Unsupported query' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Try to read saved assets; if table doesn't exist, return empty list gracefully
    const { data, error } = await supabase
      .from('run_saves')
      .select(`created_at, run:runs ( id, app_id, created_at, asset_url, asset_type, input_asset_url, outputs )`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[assets] GET error:', error);
      // If relation or table missing, degrade gracefully
      if (error.code === '42P01' || (error.message || '').includes('does not exist')) {
        return new Response(JSON.stringify({ assets: [] }), { headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'Failed to fetch assets' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const assets = (data || []).map(r => r.run).filter(Boolean);
    return new Response(JSON.stringify({ assets }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[assets] GET exception:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/assets { action: 'save'|'unsave', runId }
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
    const { action, runId } = body || {};
    if (!runId || !action) {
      return new Response(JSON.stringify({ error: 'runId and action required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (action === 'save') {
      const { error } = await supabase.from('run_saves').insert({ user_id: userId, run_id: runId });
      if (error && error.code !== '23505') { // ignore unique violation
        console.error('[assets] save error:', error);
        return new Response(JSON.stringify({ error: 'Failed to save asset' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    } else if (action === 'unsave') {
      const { error } = await supabase.from('run_saves').delete().eq('user_id', userId).eq('run_id', runId);
      if (error) {
        console.error('[assets] unsave error:', error);
        return new Response(JSON.stringify({ error: 'Failed to unsave asset' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('[assets] POST exception:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


