import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user to check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    
    // Check if admin (hardcoded for now)
    const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get platform stats
    const { data: apps } = await supabase
      .from('apps')
      .select('*, creator:profiles!creator_id(display_name, email)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: runs } = await supabase
      .from('runs')
      .select('*, app:apps(name), user:profiles!user_id(display_name)')
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate overview stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalApps = apps?.length || 0;
    const appsToday = apps?.filter(a => new Date(a.created_at) >= today).length || 0;
    const totalUsers = users?.length || 0;
    const signupsToday = users?.filter(u => new Date(u.created_at) >= today).length || 0;
    
    const totalViews = apps?.reduce((sum, app) => sum + (app.view_count || 0), 0) || 0;
    const totalTries = apps?.reduce((sum, app) => sum + (app.try_count || 0), 0) || 0;
    const avgViews = totalApps > 0 ? Math.round(totalViews / totalApps) : 0;
    const conversionRate = totalViews > 0 ? Math.round((totalTries / totalViews) * 100) : 0;

    // Top apps
    const topApps = [...(apps || [])]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10);

    // Recent activity
    const recentActivity = (runs || []).slice(0, 20).map(run => {
      const timestamp = new Date(run.created_at);
      const minutesAgo = Math.floor((now - timestamp) / 1000 / 60);
      const timeStr = minutesAgo < 1 ? 'Just now' :
                      minutesAgo < 60 ? `${minutesAgo}m ago` :
                      `${Math.floor(minutesAgo / 60)}h ago`;
      
      return {
        time: timeStr,
        description: `${run.user?.display_name || 'User'} tried "${run.app?.name || 'Unknown App'}"`
      };
    });

    return NextResponse.json({
      overview: {
        totalApps,
        appsToday,
        totalUsers,
        signupsToday,
        totalViews,
        totalTries,
        avgViews,
        conversionRate
      },
      topApps,
      recentActivity
    });

  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

