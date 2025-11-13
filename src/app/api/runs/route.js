import { runApp } from '@/src/lib/runner';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Get userId from Clerk auth (try authenticated first, fallback to anonymous)
    let supabase, userId;
    // Check device cookie to allow a single platform-fallback try
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader
        .split(';')
        .map(p => {
          const [k, ...rest] = p.trim().split('=');
          return [k, rest.join('=')];
        })
        .filter(([k]) => k)
    );
    const fallbackCookieUsed = cookies['cc_fallback_try_used'] === '1';
    const fallbackAllowed = !fallbackCookieUsed;
    
    try {
      const authResult = await createServerSupabaseClient();
      supabase = authResult.supabase;
      userId = authResult.userId;
      console.log('[API /runs] Auth result:', { userId: userId || 'NULL', hasSupabase: !!supabase });
    } catch (err) {
      console.log('[API /runs] Auth failed, using anonymous:', err.message);
      const anonResult = await createServerSupabaseClient({ allowAnonymous: true });
      supabase = anonResult.supabase;
      userId = null;
    }
    
    const body = await req.json();
    
    console.log('[API /runs] POST request:', {
      appId: body.appId,
      mode: body.mode,
      userId: userId || 'ANONYMOUS',
      hasInputs: !!body.inputs,
      clerkAuth: userId ? 'SUCCESS' : 'FAILED'
    });
    
    // Get app from database
    const { data: app, error } = await supabase
      .from('apps')
      .select('*')
      .eq('id', body.appId)
      .single();
    
    if (error || !app) {
      console.error('[API /runs] App not found:', body.appId, error);
      return new Response(JSON.stringify({ error: 'App not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[API /runs] App loaded:', {
      id: app.id,
      name: app.name,
      hasRuntime: !!app.runtime,
      steps: app.runtime?.steps?.length || 0
    });
    
    const inputs = body.inputs || {};
    const mode = body.mode === 'use' ? 'use' : 'try';
    
    console.log('[API /runs] Starting execution with inputs:', Object.keys(inputs));
    
    // Run the app
    const run = await runApp({ app, inputs, userId, mode, supabase, fallbackAllowed });
    
    console.log('[API /runs] Execution complete:', {
      runId: run.id,
      status: run.status,
      usedStub: run.trace?.[0]?.usedStub,
      hasOutput: !!run.outputs
    });
    
    // Save run to database
    const { error: saveError } = await supabase
      .from('runs')
      .insert({
        id: run.id,
        app_id: app.id,
        user_id: userId || 'anonymous',
        mode,
        status: run.status,
        inputs: run.inputs,
        outputs: run.outputs,
        trace: run.trace,
        duration_ms: run.durationMs
      });
    
    if (saveError) {
      console.error('Error saving run:', saveError);
    }
    
    // Increment try/use counters on apps table
    try {
      if (mode === 'try') {
        await supabase
          .from('apps')
          .update({ try_count: app.try_count + 1 })
          .eq('id', app.id);
      } else if (mode === 'use') {
        await supabase
          .from('apps')
          .update({ use_count: app.use_count + 1 })
          .eq('id', app.id);
      }
    } catch (err) {
      console.error('Error incrementing count:', err);
    }
    
    // Track analytics event
    if (userId) {
      try {
        await supabase.rpc('track_app_event', {
          p_app_id: app.id,
          p_user_id: userId,
          p_event_type: mode
        });
      } catch (err) {
        console.error('Analytics error:', err);
      }
    }
    
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (fallbackAllowed && !userId && mode === 'try') {
      headers.append('Set-Cookie', 'cc_fallback_try_used=1; Path=/; Max-Age=31536000; SameSite=Lax');
    }
    return new Response(JSON.stringify(run), { headers });
  } catch (e) {
    console.error('Run error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(req) {
  try {
    const { supabase } = await createServerSupabaseClient({ allowAnonymous: true });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('run');
    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const { data: run, error } = await supabase
      .from('runs')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !run) {
      return new Response(JSON.stringify({ error: 'Run not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ run }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Run GET error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
