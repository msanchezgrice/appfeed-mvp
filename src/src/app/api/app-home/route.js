import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET /api/app-home?appId=...
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  }

  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load app with creator
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select(
        `
        *,
        creator:profiles!apps_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `.trim()
      )
      .eq('id', appId)
      .single();

    if (appError || !app) {
      console.error('[app-home] App load error', appError);
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // User state
    const { data: userState, error: stateError } = await supabase
      .from('user_app_state')
      .select('*')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .maybeSingle();

    if (stateError && stateError.code !== 'PGRST116') {
      console.error('[app-home] State load error', stateError);
    }

    // Last runs for this user + app
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('id, app_id, created_at, inputs, outputs, asset_url, asset_type, status')
      .eq('app_id', appId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (runsError) {
      console.error('[app-home] Runs load error', runsError);
    }

    return NextResponse.json({
      app,
      userState: userState || null,
      runs: runs || []
    });
  } catch (error) {
    console.error('[app-home] GET error', error);
    return NextResponse.json({ error: 'Failed to load app home' }, { status: 500 });
  }
}

