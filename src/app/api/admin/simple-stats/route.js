import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Short timeout

export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Quick admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    
    if (profile?.email !== 'msanchezgrice@gmail.com') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    // LIGHTWEIGHT queries - only counts, no JOINs, no aggregations
    const { count: totalApps } = await supabase
      .from('apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get just top 5 apps by view_count (no creator join)
    const { data: topApps } = await supabase
      .from('apps')
      .select('id, name, view_count, try_count, save_count')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(5);

    // Simple sums - let Postgres do the work
    const { data: viewStats } = await supabase
      .rpc('get_total_stats')
      .single()
      .catch(() => ({ data: null }));

    return NextResponse.json({
      overview: {
        totalApps: totalApps || 0,
        totalUsers: totalUsers || 0,
        totalViews: viewStats?.total_views || 0,
        totalTries: viewStats?.total_tries || 0
      },
      topApps: topApps || [],
      lightweight: true
    });

  } catch (error) {
    console.error('[Simple Stats] Error:', error);
    return NextResponse.json({
      overview: { totalApps: 0, totalUsers: 0, totalViews: 0, totalTries: 0 },
      topApps: [],
      error: error.message
    }, { status: 200 }); // Return 200 with empty data, don't crash
  }
}

