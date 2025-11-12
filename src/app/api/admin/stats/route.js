import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const startTime = Date.now();
  console.log('[Admin Stats] Request started');
  
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const timeFilter = searchParams.get('time') || 'all';
    const tab = searchParams.get('tab') || 'apps';
    
    console.log('[Admin Stats] Auth check...', { userId, tab });
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user to check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    
    console.log('[Admin Stats] Profile loaded:', profile?.email);
    
    const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
    
    if (!isAdmin) {
      console.log('[Admin Stats] Not admin, rejecting');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    console.log('[Admin Stats] Admin verified, checking cache...');

    // Try to get from cache first (much faster!)
    const { data: cachedStats, error: cacheError } = await supabase
      .from('admin_stats_cache')
      .select('*')
      .eq('id', 'current')
      .single();

    console.log('[Admin Stats] Cache check:', { 
      hasCached: !!cachedStats, 
      cacheError: cacheError?.message,
      elapsed: Date.now() - startTime 
    });

    if (cachedStats && cachedStats.stats_data) {
      console.log('[Admin Stats] Using cached data from:', cachedStats.last_updated);
      
      // Return cached data - super fast!
      const cached = cachedStats.stats_data;
      const response = {
        overview: cached.overview || {},
        timeFilter,
        cached: true,
        lastUpdated: cachedStats.last_updated
      };
      
      if (tab === 'apps') response.topApps = cached.topApps || [];
      else if (tab === 'viral') response.viralityLeaderboard = cached.viralApps || [];
      else if (tab === 'creators') response.followerLeaderboard = cached.topCreators || [];
      else if (tab === 'growth') {
        response.growthByDay = cached.growthByDay || [];
        response.growthByWeek = cached.growthByWeek || [];
      }
      
      console.log('[Admin Stats] Returning cached data, total time:', Date.now() - startTime, 'ms');
      return NextResponse.json(response);
    }

    // If no cache, return basic stats only (don't freeze!)
    console.log('[Admin Stats] No cache found, returning basic stats only');
    
    return NextResponse.json({
      overview: {
        totalApps: 0,
        totalUsers: 0,
        totalViews: 0,
        totalTries: 0,
        message: 'Click "Refresh Stats" button to generate dashboard data'
      },
      topApps: [],
      viralityLeaderboard: [],
      followerLeaderboard: [],
      growthByDay: [],
      growthByWeek: [],
      cached: false,
      needsRefresh: true
    });
    
    // Calculate time ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Always get overview stats (lightweight)
    const { count: totalApps } = await supabase
      .from('apps')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);
    
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    // Get detailed data based on active tab only
    let apps = null;
    let users = null;
    
    if (tab === 'apps' || tab === 'viral') {
      const { data } = await supabase
        .from('apps')
        .select('*, creator:profiles!creator_id(display_name, email, clerk_user_id)')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      apps = data;
    }
    
    if (tab === 'creators' || tab === 'growth') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      users = data;
    }
    
    // Get follow counts for leaderboard
    const { data: followCounts } = await supabase
      .from('follows')
      .select('following_id')
      .then(({ data }) => {
        if (!data) return { data: [] };
        const counts = {};
        data.forEach(f => {
          counts[f.following_id] = (counts[f.following_id] || 0) + 1;
        });
        return { data: Object.entries(counts).map(([userId, count]) => ({ userId, count })) };
      })
      .catch(() => ({ data: [] }));
    
    // Get growth data by day for last 30 days
    const { data: growthData } = await supabase
      .rpc('get_daily_signups', { days: 30 })
      .catch(() => ({ data: [] }));

    // Calculate overview stats
    const appsToday = apps?.filter(a => new Date(a.created_at) >= today).length || 0;
    const appsWeek = apps?.filter(a => new Date(a.created_at) >= weekAgo).length || 0;
    const signupsToday = users?.filter(u => new Date(u.created_at) >= today).length || 0;
    const signupsWeek = users?.filter(u => new Date(u.created_at) >= weekAgo).length || 0;
    const signupsMonth = users?.filter(u => new Date(u.created_at) >= monthAgo).length || 0;
    
    const totalViews = apps?.reduce((sum, app) => sum + (app.view_count || 0), 0) || 0;
    const totalTries = apps?.reduce((sum, app) => sum + (app.try_count || 0), 0) || 0;
    const totalSaves = apps?.reduce((sum, app) => sum + (app.save_count || 0), 0) || 0;
    const avgViews = totalApps > 0 ? Math.round(totalViews / totalApps) : 0;
    const conversionRate = totalViews > 0 ? Math.round((totalTries / totalViews) * 100) : 0;

    // Top apps by time filter
    let filteredApps = apps || [];
    if (timeFilter === 'day') {
      // For day, use apps created today (new apps don't have historical data)
      filteredApps = apps?.filter(a => new Date(a.created_at) >= today) || [];
    } else if (timeFilter === 'week') {
      filteredApps = apps?.filter(a => new Date(a.created_at) >= weekAgo) || [];
    }
    
    // Calculate virality metrics for each app
    const appsWithVirality = filteredApps.map(app => {
      const views = app.view_count || 0;
      const tries = app.try_count || 0;
      const shares = app.share_count || 0;
      const remixes = apps.filter(a => a.fork_of === app.id).length;
      
      return {
        ...app,
        remix_count: remixes,
        share_rate_views: views > 0 ? Math.round((shares / views) * 100) : 0,
        share_rate_tries: tries > 0 ? Math.round((shares / tries) * 100) : 0,
        remix_rate_views: views > 0 ? Math.round((remixes / views) * 100) : 0,
        remix_rate_tries: tries > 0 ? Math.round((remixes / tries) * 100) : 0,
        k_factor: views > 0 ? ((shares + remixes) / views).toFixed(2) : 0
      };
    });
    
    const topApps = [...appsWithVirality]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10);
    
    // Virality leaderboard - apps with highest K-factor
    const viralityLeaderboard = [...appsWithVirality]
      .filter(a => a.view_count > 10) // Min 10 views for statistical significance
      .sort((a, b) => parseFloat(b.k_factor) - parseFloat(a.k_factor))
      .slice(0, 10);
    
    // Follower leaderboard - top creators by followers
    const { data: allFollows } = await supabase
      .from('follows')
      .select('following_id');
    
    const followerCounts = {};
    (allFollows || []).forEach(f => {
      followerCounts[f.following_id] = (followerCounts[f.following_id] || 0) + 1;
    });
    
    const followerLeaderboard = Object.entries(followerCounts)
      .map(([userId, count]) => {
        const creator = users?.find(u => u.clerk_user_id === userId);
        return {
          userId,
          display_name: creator?.display_name || 'Unknown',
          email: creator?.email,
          follower_count: count,
          app_count: apps?.filter(a => a.creator_id === userId).length || 0
        };
      })
      .sort((a, b) => b.follower_count - a.follower_count)
      .slice(0, 10);
    
    // Growth data by day/week/month
    const growthByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = users?.filter(u => {
        const uDate = new Date(u.created_at).toISOString().split('T')[0];
        return uDate === dateStr;
      }).length || 0;
      growthByDay.push({ date: dateStr, signups: count });
    }
    
    const growthByWeek = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const count = users?.filter(u => {
        const uDate = new Date(u.created_at);
        return uDate >= weekStart && uDate < weekEnd;
      }).length || 0;
      growthByWeek.push({ 
        week: `Week ${4 - i}`, 
        signups: count 
      });
    }

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

    // Return only relevant data for the active tab
    const response = {
      overview: {
        totalApps: totalApps || 0,
        appsToday,
        appsWeek,
        totalUsers: totalUsers || 0,
        signupsToday,
        signupsWeek,
        signupsMonth,
        totalViews,
        totalTries,
        totalSaves,
        avgViews,
        conversionRate
      },
      timeFilter
    };
    
    if (tab === 'apps') {
      response.topApps = topApps;
    } else if (tab === 'viral') {
      response.viralityLeaderboard = viralityLeaderboard;
    } else if (tab === 'creators') {
      response.followerLeaderboard = followerLeaderboard;
    } else if (tab === 'growth') {
      response.growthByDay = growthByDay;
      response.growthByWeek = growthByWeek;
    }
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

