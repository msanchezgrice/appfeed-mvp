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

    console.log('[Simple Stats] Fetching lightweight stats...');

    // SUPER LIGHTWEIGHT queries - just what we need
    
    // Get basic counts
    const { data: appStats } = await supabase
      .from('apps')
      .select('view_count, try_count, save_count, share_count')
      .eq('is_published', true);
    
    const { data: users } = await supabase
      .from('profiles')
      .select('id');

    // Calculate totals
    const totalApps = appStats?.length || 0;
    const totalUsers = users?.length || 0;
    const totalViews = appStats?.reduce((sum, app) => sum + (app.view_count || 0), 0) || 0;
    const totalTries = appStats?.reduce((sum, app) => sum + (app.try_count || 0), 0) || 0;
    const totalSaves = appStats?.reduce((sum, app) => sum + (app.save_count || 0), 0) || 0;

    console.log('[Simple Stats] Calculated:', { totalApps, totalUsers, totalViews, totalTries });

    // Get top 5 apps (simple, no JOIN)
    const { data: topApps } = await supabase
      .from('apps')
      .select('id, name, view_count, try_count, save_count, share_count')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(5);

    console.log('[Simple Stats] Top apps:', topApps?.length);

    return NextResponse.json({
      overview: {
        totalApps,
        totalUsers,
        totalViews,
        totalTries,
        totalSaves,
        avgViews: totalApps > 0 ? Math.round(totalViews / totalApps) : 0,
        conversionRate: totalViews > 0 ? Math.round((totalTries / totalViews) * 100) : 0
      },
      topApps: topApps || [],
      lightweight: true,
      timestamp: new Date().toISOString()
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

