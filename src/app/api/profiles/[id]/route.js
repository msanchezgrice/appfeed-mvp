import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/profiles/:id - Get a user's profile
export async function GET(req, { params }) {
  try {
    const supabase = await createServerSupabaseClient().then(r => r.supabase);
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Fetch profile from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[API /profiles] Error fetching profile:', error);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (e) {
    console.error('[API /profiles] Exception:', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

