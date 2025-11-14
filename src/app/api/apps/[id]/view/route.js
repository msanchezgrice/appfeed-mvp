import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Log a view for an app (id in path). Allows anonymous; very lightweight.
export async function POST(_req, { params }) {
  try {
    const { supabase, userId } = await createServerSupabaseClient({ allowAnonymous: true });
    const { id } = params || {};
    if (!id) {
      return NextResponse.json({ error: 'Missing app id' }, { status: 400 });
    }
    try {
      await supabase.rpc('track_app_event', {
        p_app_id: id,
        p_user_id: userId || null,
        p_event_type: 'view'
      });
    } catch (e) {
      // Non-fatal: if RPC missing or fails, do not break UI
      console.warn('[View] RPC error (non-fatal):', e?.message || e);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[View] Error:', e);
    return NextResponse.json({ error: 'Failed to log view' }, { status: 500 });
  }
}


