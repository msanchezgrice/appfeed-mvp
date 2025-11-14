import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { logEventServer } from '@/src/lib/metrics';

export const dynamic = 'force-dynamic';

// Log a view for an app (id in path). Allows anonymous; very lightweight.
export async function POST(req, { params }) {
  try {
    const { supabase, userId } = await createServerSupabaseClient({ allowAnonymous: true });
    const { id } = params || {};
    const src = (() => {
      try {
        const url = new URL(req.url);
        return url.searchParams.get('src') || 'unknown';
      } catch {
        return 'unknown';
      }
    })();
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
    // Vercel WA custom event
    logEventServer('app_view', { appId: id, source: src });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[View] Error:', e);
    return NextResponse.json({ error: 'Failed to log view' }, { status: 500 });
  }
}


