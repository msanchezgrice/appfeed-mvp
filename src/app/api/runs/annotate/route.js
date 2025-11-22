import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { runId, patch } = body || {};
    if (!runId || !patch || typeof patch !== 'object') {
      return NextResponse.json({ error: 'runId and patch required' }, { status: 400 });
    }
    // Ensure user owns the run
    const { data: run } = await supabase
      .from('runs')
      .select('id, user_id, outputs')
      .eq('id', runId)
      .single();
    if (!run || (run.user_id !== userId && run.user_id !== 'anonymous')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const existing = (run.outputs && typeof run.outputs === 'object') ? run.outputs : {};
    const merged = { ...existing, ...patch };
    const { error } = await supabase
      .from('runs')
      .update({ outputs: merged })
      .eq('id', runId);
    if (error) {
      console.error('[annotate] update error:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, outputs: merged });
  } catch (e) {
    console.error('[annotate] exception:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}



