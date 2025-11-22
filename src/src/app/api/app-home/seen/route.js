import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

// POST /api/app-home/seen { appId }
export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId } = await req.json();
    if (!appId) {
      return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_app_state')
      .upsert(
        {
          user_id: userId,
          app_id: appId,
          last_opened_at: nowIso
        },
        { onConflict: 'user_id,app_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[app-home/seen] Upsert error', error);
      return NextResponse.json({ error: 'Failed to mark opened' }, { status: 500 });
    }

    return NextResponse.json({ state: data });
  } catch (error) {
    console.error('[app-home/seen] POST error', error);
    return NextResponse.json({ error: 'Failed to mark opened' }, { status: 500 });
  }
}

