import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { 
  getCreatorPortfolioAnalytics,
  getCreatorTimeSeries,
  getTrafficSources,
  getConversionFunnel
} from '@/src/lib/posthog-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // PostHog queries can take a few seconds

export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    console.log('[Analytics API] Fetching analytics for creator:', userId);

    // Get user's profile for follower count
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, total_followers')
      .eq('id', userId)
      .single();

    // Get user's apps from Supabase for quick stats
    const { data: apps } = await supabase
      .from('apps')
      .select('id, name, view_count, try_count, save_count, remix_count, share_count, created_at')
      .eq('creator_id', userId)
      .eq('is_published', true);

    // Fetch PostHog analytics data
    const [
      posthogData,
      timeSeries,
      trafficSources,
      funnel
    ] = await Promise.all([
      getCreatorPortfolioAnalytics(userId, days),
      getCreatorTimeSeries(userId, days),
      getTrafficSources(userId, days),
      getConversionFunnel(userId, days)
    ]);

    // Calculate portfolio metrics from PostHog data (for selected time period)
    let totalViews = 0;
    let totalTries = 0;
    let totalSaves = 0;
    let totalShares = 0;
    let totalRemixes = 0;
    let appViewsMap = {};
    let appTriesMap = {};
    let appSavesMap = {};

    if (posthogData) {
      totalViews = posthogData.views.length;
      totalTries = posthogData.tries.length;
      totalSaves = posthogData.saves.length;
      totalShares = posthogData.shares.length;
      totalRemixes = posthogData.remixes.length;

      // Count per app (PostHog data is already parsed in posthog-server.js)
      posthogData.views.forEach(event => {
        const appId = event.app_id;
        if (appId) appViewsMap[appId] = (appViewsMap[appId] || 0) + 1;
      });

      posthogData.tries.forEach(event => {
        const appId = event.app_id;
        if (appId) appTriesMap[appId] = (appTriesMap[appId] || 0) + 1;
      });

      posthogData.saves.forEach(event => {
        const appId = event.app_id;
        if (appId) appSavesMap[appId] = (appSavesMap[appId] || 0) + 1;
      });
    }

    // Calculate engagement rates
    const viewToTryRate = totalViews > 0 
      ? ((totalTries / totalViews) * 100).toFixed(1) 
      : 0;
    
    const tryToSaveRate = totalTries > 0 
      ? ((totalSaves / totalTries) * 100).toFixed(1) 
      : 0;

    const viewToSaveRate = totalViews > 0
      ? ((totalSaves / totalViews) * 100).toFixed(1)
      : 0;

    // Build top apps with engagement metrics
    // Show ALL creator's apps, not just top 10
    const topApps = (apps || [])
      .map(app => {
        // PostHog data for selected period
        const views = appViewsMap[app.id] || 0;
        const tries = appTriesMap[app.id] || 0;
        const saves = appSavesMap[app.id] || 0;
        
        return {
          id: app.id,
          name: app.name,
          // Selected period (from PostHog)
          views,
          tries,
          saves,
          shares: app.share_count || 0,
          remixes: app.remix_count || 0,
          viewToTryRate: views > 0 ? ((tries / views) * 100).toFixed(1) : 0,
          tryToSaveRate: tries > 0 ? ((saves / tries) * 100).toFixed(1) : 0,
          // All-time stats from Supabase (always shown as fallback)
          allTimeViews: app.view_count || 0,
          allTimeTries: app.try_count || 0,
          allTimeSaves: app.save_count || 0
        };
      })
      // Sort by period views if available, otherwise all-time views
      .sort((a, b) => (b.views || b.allTimeViews) - (a.views || a.allTimeViews));

    // Format time series data for charts
    let formattedTimeSeries = [];
    if (timeSeries && Array.isArray(timeSeries)) {
      // PostHog returns data in a specific format, we need to transform it
      const dates = timeSeries[0]?.days || [];
      const viewsData = timeSeries.find(s => s.label === 'Views')?.data || [];
      const triesData = timeSeries.find(s => s.label === 'Tries')?.data || [];
      const savesData = timeSeries.find(s => s.label === 'Saves')?.data || [];

      formattedTimeSeries = dates.map((date, index) => ({
        date,
        views: viewsData[index] || 0,
        tries: triesData[index] || 0,
        saves: savesData[index] || 0
      }));
    }

    // Format traffic sources
    let formattedSources = [];
    if (trafficSources && Array.isArray(trafficSources)) {
      formattedSources = trafficSources.map(source => ({
        source: source.breakdown_value || 'unknown',
        views: source.count || 0
      })).sort((a, b) => b.views - a.views);
    }

    // Format funnel data
    let formattedFunnel = null;
    if (funnel && Array.isArray(funnel) && funnel.length > 0) {
      const funnelData = funnel[0];
      formattedFunnel = [
        { step: 'Viewed', count: funnelData[0]?.count || 0, dropoff: 0 },
        { 
          step: 'Tried', 
          count: funnelData[1]?.count || 0,
          dropoff: funnelData[1]?.count && funnelData[0]?.count
            ? (100 - (funnelData[1].count / funnelData[0].count * 100)).toFixed(1)
            : 0
        },
        { 
          step: 'Saved', 
          count: funnelData[2]?.count || 0,
          dropoff: funnelData[2]?.count && funnelData[1]?.count
            ? (100 - (funnelData[2].count / funnelData[1].count * 100)).toFixed(1)
            : 0
        }
      ];
    }

    const response = {
      period: `last_${days}_days`,
      overview: {
        totalApps: apps?.length || 0,
        totalViews,
        totalTries,
        totalSaves,
        totalShares,
        totalRemixes,
        viewToTryRate: parseFloat(viewToTryRate),
        tryToSaveRate: parseFloat(tryToSaveRate),
        viewToSaveRate: parseFloat(viewToSaveRate),
        followerCount: profile?.total_followers || 0,
        // All-time stats from Supabase
        allTimeViews: apps?.reduce((sum, app) => sum + (app.view_count || 0), 0) || 0,
        allTimeTries: apps?.reduce((sum, app) => sum + (app.try_count || 0), 0) || 0,
        allTimeSaves: apps?.reduce((sum, app) => sum + (app.save_count || 0), 0) || 0
      },
      topApps,
      timeSeries: formattedTimeSeries,
      trafficSources: formattedSources,
      funnel: formattedFunnel,
      dataSource: posthogData ? 'posthog' : 'supabase_only'
    };

    console.log('[Analytics API] Returning data:', {
      views: totalViews,
      tries: totalTries,
      saves: totalSaves,
      topAppsCount: topApps.length,
      timeSeriesPoints: formattedTimeSeries.length,
      sourcesCount: formattedSources.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

