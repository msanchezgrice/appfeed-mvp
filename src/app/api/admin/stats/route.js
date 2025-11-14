import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const startTime = Date.now();
  console.log('[Admin Stats] Request started');

  try {
    const { supabase, userId } = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'apps';
    // Default all heavy tabs to 1-day window unless otherwise requested
    const timeFilter = searchParams.get('time') || 'day'; // 'day' | 'week' | 'all'

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

    // Calculate time ranges (use midnight for "day" to keep numbers stable)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sinceIso = timeFilter === 'day'
      ? today.toISOString()
      : timeFilter === 'week'
        ? weekAgo.toISOString()
        : null;


    // Overview (lightweight; counts + sums only)
    const [{ count: totalApps }, { count: totalUsers }] = await Promise.all([
      supabase.from('apps').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    // Aggregate totals without pulling all rows into memory
    const { data: aggApps } = await supabase
      .from('apps')
      .select('view_count, try_count, save_count')
      .eq('is_published', true);
    const totalViews = (aggApps || []).reduce((s, a) => s + (a.view_count || 0), 0);
    const totalTries = (aggApps || []).reduce((s, a) => s + (a.try_count || 0), 0);
    const totalSaves = (aggApps || []).reduce((s, a) => s + (a.save_count || 0), 0);
    const avgViews = (totalApps || 0) > 0 ? Math.round(totalViews / totalApps) : 0;
    const conversionRate = totalViews > 0 ? Math.round((totalTries / totalViews) * 100) : 0;

    const [{ count: appsToday }, { count: signupsToday }, { count: appsWeek }, { count: signupsWeek }] = await Promise.all([
      supabase.from('apps').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('apps').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString())
    ]);

    // Response scaffold
    const response = {
      overview: {
        totalApps: totalApps || 0,
        appsToday: appsToday || 0,
        appsWeek: appsWeek || 0,
        totalUsers: totalUsers || 0,
        signupsToday: signupsToday || 0,
        signupsWeek: signupsWeek || 0,
        signupsMonth: 0, // optional below
        totalViews,
        totalTries,
        totalSaves,
        avgViews,
        conversionRate
      },
      timeFilter
    };

    // signupsMonth (optional; cheap)
    const { count: signupsMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());
    response.overview.signupsMonth = signupsMonth || 0;

    // Tab-specific data (computed on-demand, default 1-day)
    if (tab === 'apps') {
      // For lack of per-day event logs, show top apps by total views; allow simple recency filter for discovery views
      let query = supabase
        .from('apps')
        .select('id, name, view_count, try_count, save_count, share_count, creator:profiles!creator_id(display_name)')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(10);
      if (sinceIso) {
        query = query.gte('created_at', sinceIso);
      }
      const { data: topApps } = await query;
      response.topApps = topApps || [];
    } else if (tab === 'viral') {
      // Build virality metrics with minimal reads: take top 100 by views then compute remix counts for that set
      let baseQuery = supabase
        .from('apps')
        .select('id, name, view_count, try_count, share_count, created_at')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(100);
      if (sinceIso) {
        baseQuery = baseQuery.gte('created_at', sinceIso);
      }
      const { data: baseApps } = await baseQuery;
      const ids = (baseApps || []).map(a => a.id);
      let remixMap = {};
      if (ids.length > 0) {
        const { data: forks } = await supabase
          .from('apps')
          .select('fork_of')
          .in('fork_of', ids);
        remixMap = (forks || []).reduce((m, r) => {
          if (!r.fork_of) return m;
          m[r.fork_of] = (m[r.fork_of] || 0) + 1;
          return m;
        }, {});
      }
      const withMetrics = (baseApps || []).map(app => {
        const views = app.view_count || 0;
        const tries = app.try_count || 0;
        const shares = app.share_count || 0;
        const remixes = remixMap[app.id] || 0;
        return {
          ...app,
          remix_count: remixes,
          share_rate_views: views > 0 ? Math.round((shares / views) * 100) : 0,
          share_rate_tries: tries > 0 ? Math.round((shares / Math.max(tries, 1)) * 100) : 0,
          remix_rate_views: views > 0 ? Math.round((remixes / views) * 100) : 0,
          remix_rate_tries: tries > 0 ? Math.round((remixes / Math.max(tries, 1)) * 100) : 0,
          k_factor: views > 0 ? ((shares + remixes) / views).toFixed(2) : '0.00'
        };
      });
      response.viralityLeaderboard = withMetrics
        .filter(a => (a.view_count || 0) > 10)
        .sort((a, b) => parseFloat(b.k_factor) - parseFloat(a.k_factor))
        .slice(0, 10);
    } else if (tab === 'creators') {
      // Followers gained per creator within window (default: last 1 day)
      let followsQuery = supabase
        .from('follows')
        .select('following_id, created_at');
      if (sinceIso) {
        followsQuery = followsQuery.gte('created_at', sinceIso);
      }
      const { data: follows } = await followsQuery;
      const counts = {};
      (follows || []).forEach(f => {
        counts[f.following_id] = (counts[f.following_id] || 0) + 1;
      });
      const ids = Object.keys(counts);
      let profiles = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', ids);
        profiles = data || [];
      }
      let appCounts = {};
      if (ids.length > 0) {
        const { data } = await supabase
          .from('apps')
          .select('creator_id')
          .in('creator_id', ids);
        (data || []).forEach(a => {
          appCounts[a.creator_id] = (appCounts[a.creator_id] || 0) + 1;
        });
      }
      response.followerLeaderboard = ids
        .map(userId => {
          const p = profiles.find(x => x.id === userId);
          return {
            userId,
            display_name: p?.display_name || 'Unknown',
            email: p?.email,
            follower_count: counts[userId],
            app_count: appCounts[userId] || 0
          };
        })
        .sort((a, b) => b.follower_count - a.follower_count)
        .slice(0, 10);
    } else if (tab === 'growth') {
      // 7-day daily bars via RPC; 4-week bars derived from last 28 days
      let last7 = [];
      let last28 = [];
      try {
        const res7 = await supabase.rpc('get_daily_signups', { days: 7 });
        last7 = res7?.data || [];
      } catch (e) {
        last7 = [];
      }
      try {
        const res28 = await supabase.rpc('get_daily_signups', { days: 28 });
        last28 = res28?.data || [];
      } catch (e) {
        last28 = [];
      }
      response.growthByDay = (last7 || []).map(r => ({ date: r.date, signups: r.signups }));
      // Aggregate weekly from the last 28 days (4 buckets of 7 days)
      const daily28 = (last28 || []).map(r => ({ date: new Date(r.date), signups: r.signups }));
      const weeks = [0, 1, 2, 3].map(i => {
        const end = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        const signups = daily28
          .filter(d => d.date >= start && d.date < end)
          .reduce((s, d) => s + d.signups, 0);
        return { week: `Week ${4 - i}`, signups };
      }).reverse();
      response.growthByWeek = weeks;
    }

    // Return only relevant data for the active tab
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

