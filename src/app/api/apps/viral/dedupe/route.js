import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

const VIRAL_NAMES = [
  'Tweet Roast or Toast',
  'Pet as CEO Poster',
  'Headline → Spicy Take',
  'Red Flag Scanner',
  'Alignment Chart Maker'
];

export async function POST() {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin gate
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all candidate apps for these names for the current admin user
    const { data: apps, error } = await supabase
      .from('apps')
      .select('id, name, created_at')
      .in('name', VIRAL_NAMES)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }

    const toDelete = [];
    const kept = [];
    const seen = new Set();

    for (const app of apps || []) {
      const key = app.name;
      if (seen.has(key)) {
        toDelete.push(app.id);
      } else {
        seen.add(key);
        kept.push({ id: app.id, name: app.name, created_at: app.created_at });
      }
    }

    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from('apps')
        .delete()
        .in('id', toDelete);
      if (delErr) {
        throw delErr;
      }
    }

    return NextResponse.json({
      success: true,
      kept,
      deleted_count: toDelete.length,
      deleted_ids: toDelete
    });
  } catch (e) {
    console.error('[Viral Dedupe] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed to dedupe' }, { status: 500 });
  }
}

export async function GET() {
  // Convenience for browser triggering
  return POST();
}


