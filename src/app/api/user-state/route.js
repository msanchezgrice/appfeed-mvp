import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 262144; // ~256KB combined state + inputs

function computeSize(obj = {}) {
  try {
    return Buffer.byteLength(JSON.stringify(obj), 'utf8');
  } catch {
    return 0;
  }
}

// GET: /api/user-state?appId=optional
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');

  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch saved state
    let states = [];
    const baseQuery = supabase
      .from('user_app_state')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (appId) {
      const { data, error } = await baseQuery.eq('app_id', appId).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('[user-state] Select error', error);
        return NextResponse.json({ error: 'Failed to load state' }, { status: 500 });
      }
      states = data ? [data] : [];
    } else {
      const { data, error } = await baseQuery.limit(500);
      if (error) {
        console.error('[user-state] Select list error', error);
        return NextResponse.json({ error: 'Failed to load state' }, { status: 500 });
      }
      states = data || [];
    }

    // Fallback: derive last run for apps without saved state
    const missingAppIds = appId && states.length === 0 ? [appId] : null;

    let runFallback = {};
    // If specific appId missing, fetch last run for that app/user.
    // For list calls (no appId), we skip fallback to avoid heavy scans.
    if (appId && missingAppIds?.length) {
      const { data: runs, error: runsError } = await supabase
        .from('runs')
        .select('id, app_id, inputs, outputs, asset_url, asset_type, created_at')
        .eq('app_id', appId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!runsError && runs?.length) {
        runFallback[appId] = runs[0];
      }
    }

    const mapped = new Map(states.map(s => [s.app_id, s]));

    for (const [appIdKey, run] of Object.entries(runFallback)) {
      if (!mapped.has(appIdKey)) {
        mapped.set(appIdKey, {
          user_id: userId,
          app_id: appIdKey,
          state: {
            outputs: run.outputs || {},
            asset_url: run.asset_url,
            asset_type: run.asset_type
          },
          inputs: run.inputs || {},
          state_schema_version: 1,
          last_run_id: run.id,
          created_at: run.created_at,
          updated_at: run.created_at,
          updated_by: userId,
          last_update_at: run.created_at,
          last_opened_at: null
        });
      }
    }

    const result = appId ? (mapped.get(appId) || null) : Array.from(mapped.values());
    return NextResponse.json({ state: appId ? result : null, states: Array.isArray(result) ? result : result ? [result] : [] });
  } catch (error) {
    console.error('[user-state] GET error', error);
    return NextResponse.json({ error: 'Failed to load state' }, { status: 500 });
  }
}

// PUT: save/update state for an app
export async function PUT(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId, state = {}, inputs = {}, state_schema_version = 1, last_run_id = null } = await req.json();
    if (!appId) {
      return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
    }

    const size = computeSize(state) + computeSize(inputs);
    if (size > MAX_BYTES) {
      return NextResponse.json({ error: 'State too large' }, { status: 413 });
    }

    const nowIso = new Date().toISOString();
    const payload = {
      user_id: userId,
      app_id: appId,
      state,
      inputs,
      state_schema_version,
      last_run_id,
      updated_by: userId,
      updated_at: nowIso,
      last_update_at: nowIso
    };

    const { data, error } = await supabase
      .from('user_app_state')
      .upsert(payload, { onConflict: 'user_id,app_id' })
      .select('*')
      .single();

    if (error) {
      console.error('[user-state] Upsert error', error);
      return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
    }

    return NextResponse.json({ state: data });
  } catch (error) {
    console.error('[user-state] PUT error', error);
    return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
  }
}
