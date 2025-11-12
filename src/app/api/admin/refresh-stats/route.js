import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
  try {
    // TEMPORARILY DISABLED - causing database overload
    return NextResponse.json({ 
      error: 'Refresh temporarily disabled while database is under load. Stats will auto-refresh nightly.',
      disabled: true
    }, { status: 503 });
    
    /* DISABLED CODE - Re-enable when database is stable
    const { supabase, userId } = await createServerSupabaseClient();
    
    // Allow cron job (no userId) OR admin users
    const isCronJob = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
    
    if (!isCronJob && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isCronJob) {
      // Check admin for manual refresh
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('clerk_user_id', userId)
        .single();
      
      const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    console.log('[Admin] Refreshing stats...');
    
    // Get all data
    const { data: apps } = await supabase
      .from('apps')
      .select('*, creator:profiles!creator_id(display_name, email, clerk_user_id)')
      .eq('is_published', true);

    const { data: users } = await supabase
      .from('profiles')
      .select('*');

    const { data: follows } = await supabase
      .from('follows')
      .select('following_id');

    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalViews = apps.reduce((sum, app) => sum + (app.view_count || 0), 0);
    const totalTries = apps.reduce((sum, app) => sum + (app.try_count || 0), 0);
    const totalSaves = apps.reduce((sum, app) => sum + (app.save_count || 0), 0);

    // Top apps all time
    const topAppsAll = apps
      .map(app => ({
        ...app,
        remixes: apps.filter(a => a.fork_of === app.id).length,
        k_factor: app.view_count > 0 ? (((app.share_count || 0) + apps.filter(a => a.fork_of === app.id).length) / app.view_count).toFixed(2) : 0
      }))
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10);

    // Viral apps
    const viralApps = apps
      .map(app => {
        const views = app.view_count || 0;
        const tries = app.try_count || 0;
        const shares = app.share_count || 0;
        const remixes = apps.filter(a => a.fork_of === app.id).length;
        
        return {
          id: app.id,
          name: app.name,
          view_count: views,
          try_count: tries,
          share_count: shares,
          remix_count: remixes,
          k_factor: views > 0 ? ((shares + remixes) / views).toFixed(2) : 0,
          share_rate_views: views > 0 ? Math.round((shares / views) * 100) : 0,
          share_rate_tries: tries > 0 ? Math.round((shares / tries) * 100) : 0,
          remix_rate_views: views > 0 ? Math.round((remixes / views) * 100) : 0,
          remix_rate_tries: tries > 0 ? Math.round((remixes / tries) * 100) : 0
        };
      })
      .filter(a => a.view_count > 10)
      .sort((a, b) => parseFloat(b.k_factor) - parseFloat(a.k_factor))
      .slice(0, 10);

    // Creator leaderboard
    const followerCounts = {};
    follows.forEach(f => {
      followerCounts[f.following_id] = (followerCounts[f.following_id] || 0) + 1;
    });

    const topCreators = Object.entries(followerCounts)
      .map(([userId, count]) => {
        const creator = users.find(u => u.clerk_user_id === userId);
        return {
          userId,
          display_name: creator?.display_name || 'Unknown',
          follower_count: count,
          app_count: apps.filter(a => a.creator_id === userId).length
        };
      })
      .sort((a, b) => b.follower_count - a.follower_count)
      .slice(0, 10);

    // Growth by day (last 7 days)
    const growthByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = users.filter(u => {
        const uDate = new Date(u.created_at).toISOString().split('T')[0];
        return uDate === dateStr;
      }).length;
      growthByDay.push({ date: dateStr, signups: count });
    }

    // Growth by week (last 4 weeks)
    const growthByWeek = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const count = users.filter(u => {
        const uDate = new Date(u.created_at);
        return uDate >= weekStart && uDate < weekEnd;
      }).length;
      growthByWeek.push({ week: `Week ${4 - i}`, signups: count });
    }

    // Upsert into cache table
    const { error } = await supabase
      .from('admin_stats_cache')
      .upsert({
        id: 'current',
        last_updated: new Date().toISOString(),
        stats_data: {
          overview: {
            totalApps: apps.length,
            appsToday: apps.filter(a => new Date(a.created_at) >= today).length,
            appsWeek: apps.filter(a => new Date(a.created_at) >= weekAgo).length,
            totalUsers: users.length,
            signupsToday: users.filter(u => new Date(u.created_at) >= today).length,
            signupsWeek: users.filter(u => new Date(u.created_at) >= weekAgo).length,
            signupsMonth: users.filter(u => new Date(u.created_at) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)).length,
            totalViews,
            totalTries,
            totalSaves,
            avgViews: apps.length > 0 ? Math.round(totalViews / apps.length) : 0,
            conversionRate: totalViews > 0 ? Math.round((totalTries / totalViews) * 100) : 0
          },
          topApps: topAppsAll,
          viralApps: viralApps,
          topCreators: topCreators,
          growthByDay: growthByDay,
          growthByWeek: growthByWeek
        }
      });

    if (error) {
      console.error('[Admin] Error saving stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Admin] Stats refreshed successfully!');

    return NextResponse.json({ 
      success: true,
      message: 'Stats refreshed',
      timestamp: new Date().toISOString()
    });
    */ // END DISABLED CODE

  } catch (error) {
    console.error('[Admin] Refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh stats' },
      { status: 500 }
    );
  }
}

