# Creator Analytics with PostHog - Fastest Path to Launch

## TL;DR - Use What You Already Have ⚡

You've already implemented PostHog with comprehensive event tracking. Instead of building a custom analytics dashboard from scratch, **embed PostHog insights directly** or use their API to power your creator dashboard. This is **10x faster** to ship.

---

## Current PostHog Integration ✅

### Events You're Already Tracking

From `src/lib/analytics.js`:

1. **App Lifecycle**
   - `app_viewed` (with source, creator_id, app_id)
   - `app_tried` (with source, is_authenticated)
   - `app_saved`
   - `app_shared` (with share_method)
   - `app_remixed`
   - `app_clicked`
   - `app_published`

2. **User Events**
   - `user_signed_up` (with attribution: utm_source, utm_campaign)
   - `user_signed_in`
   - `user_followed`

3. **Funnel Tracking**
   - `conversion_funnel` (steps: landed → viewed_app → tried_app → saved_app)
   - `anonymous_user_blocked` (when hitting signup wall)

4. **Context Data**
   - Attribution (UTM params, referrer, landing page)
   - User properties (signup source, campaign)
   - Super properties ($current_app_id, $current_app_name, $current_creator_id)

### What This Means

You have **rich event data flowing into PostHog right now**. Instead of:
- Building SQL queries
- Creating charts from scratch  
- Managing materialized views
- Writing aggregation logic

You can use **PostHog's built-in analytics features** that already exist.

---

## 🚀 Option 1: PostHog Embedded Dashboards (Fastest)

### Implementation: 1-2 Days

PostHog allows you to **embed pre-built dashboards** directly in your app.

#### Step 1: Create Creator Dashboard in PostHog

In PostHog UI, create a dashboard template with:

**Panels:**
1. **Total Views** - Count of `app_viewed` events (filtered by creator_id)
2. **View → Try Rate** - Funnel: `app_viewed` → `app_tried`
3. **Try → Save Rate** - Funnel: `app_tried` → `app_saved`
4. **Views Over Time** - Time series of `app_viewed` events
5. **Top Apps** - Table grouped by app_id, sorted by view count
6. **Traffic Sources** - Breakdown by `view_source` property
7. **Device Split** - Mobile vs desktop from user agent

#### Step 2: Share Dashboard with Public Link

PostHog allows sharing dashboards with a **secret URL**:
```
https://app.posthog.com/shared/DASHBOARD_ID?secret=SECRET_TOKEN
```

#### Step 3: Embed in Your App

```javascript
// src/app/me/analytics/page.js
'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const { user } = useUser();
  const [dashboardUrl, setDashboardUrl] = useState(null);

  useEffect(() => {
    // Fetch personalized dashboard URL for this creator
    fetch('/api/me/analytics/dashboard-url')
      .then(res => res.json())
      .then(data => setDashboardUrl(data.url));
  }, []);

  if (!dashboardUrl) return <div>Loading analytics...</div>;

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <iframe
        src={dashboardUrl}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          borderRadius: '8px'
        }}
        title="Creator Analytics"
      />
    </div>
  );
}
```

**API Endpoint:** Generate filtered dashboard URL per creator

```javascript
// src/app/api/me/analytics/dashboard-url/route.js
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

const POSTHOG_DASHBOARD_TEMPLATE = process.env.POSTHOG_CREATOR_DASHBOARD_ID;
const POSTHOG_PROJECT_API_KEY = process.env.POSTHOG_PROJECT_API_KEY;

export async function GET(req) {
  const { userId } = await createServerSupabaseClient();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create a dashboard URL filtered to this creator's data
  // PostHog will filter events where properties.creator_id = userId
  const dashboardUrl = `https://app.posthog.com/shared/${POSTHOG_DASHBOARD_TEMPLATE}?` +
    `secret=${process.env.POSTHOG_DASHBOARD_SECRET}&` +
    `filters=${encodeURIComponent(JSON.stringify({
      properties: [
        { key: 'creator_id', value: userId, type: 'event' }
      ]
    }))}`;

  return NextResponse.json({ url: dashboardUrl });
}
```

### Pros
- ✅ **Instant setup** (1-2 days max)
- ✅ No custom charting code
- ✅ PostHog handles all aggregations
- ✅ Built-in insights (funnels, retention, paths)
- ✅ Auto-updates in real-time

### Cons
- ⚠️ Less customization (PostHog's design)
- ⚠️ Requires PostHog paid plan for shared dashboards
- ⚠️ Users see PostHog branding

---

## 🎨 Option 2: PostHog API + Custom UI (Recommended)

### Implementation: 1 Week

Use **PostHog's API** to fetch data, but build your own beautiful UI.

#### Architecture

```
┌─────────────┐
│  Your App   │
│  /me/       │
│  analytics  │
└──────┬──────┘
       │
       │ Fetch data
       ↓
┌─────────────┐       ┌──────────────┐
│ Next.js API │──────→│  PostHog API │
│   Route     │       │              │
└─────────────┘       └──────────────┘
       │
       │ Return processed data
       ↓
┌─────────────┐
│  Custom UI  │
│  Charts.js  │
│  Tables     │
└─────────────┘
```

#### Step 1: Install PostHog API Client

```bash
npm install posthog-node
```

#### Step 2: Create API Wrapper

```javascript
// src/lib/posthog-api.js
import { PostHog } from 'posthog-node';

const posthogAPI = new PostHog(
  process.env.POSTHOG_PROJECT_API_KEY,
  { 
    host: 'https://app.posthog.com',
    personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY // For API access
  }
);

export async function getCreatorAnalytics(creatorId, days = 30) {
  // Fetch app views for this creator
  const views = await posthogAPI.query({
    kind: 'EventsQuery',
    select: ['timestamp', 'properties.app_id', 'properties.app_name'],
    event: 'app_viewed',
    where: [`properties.creator_id = '${creatorId}'`],
    after: `-${days}d`
  });

  // Fetch app tries
  const tries = await posthogAPI.query({
    kind: 'EventsQuery',
    select: ['timestamp', 'properties.app_id'],
    event: 'app_tried',
    where: [`properties.$current_creator_id = '${creatorId}'`],
    after: `-${days}d`
  });

  // Fetch app saves
  const saves = await posthogAPI.query({
    kind: 'EventsQuery',
    select: ['timestamp', 'properties.app_id'],
    event: 'app_saved',
    where: [`properties.creator_id = '${creatorId}'`],
    after: `-${days}d`
  });

  return {
    views: views.results,
    tries: tries.results,
    saves: saves.results
  };
}

export async function getConversionFunnel(creatorId, days = 30) {
  const funnel = await posthogAPI.query({
    kind: 'FunnelsQuery',
    series: [
      { event: 'app_viewed', name: 'Viewed' },
      { event: 'app_tried', name: 'Tried' },
      { event: 'app_saved', name: 'Saved' }
    ],
    filterTestAccounts: true,
    funnelWindowInterval: 1,
    funnelWindowIntervalUnit: 'day',
    dateRange: {
      date_from: `-${days}d`,
      date_to: 'now'
    },
    properties: {
      type: 'AND',
      values: [
        {
          type: 'event',
          key: 'creator_id',
          value: creatorId
        }
      ]
    }
  });

  return funnel;
}

export async function getTrafficSources(creatorId, days = 30) {
  const breakdown = await posthogAPI.query({
    kind: 'TrendsQuery',
    series: [
      { event: 'app_viewed', name: 'Views' }
    ],
    breakdownFilter: {
      breakdown: 'view_source',
      breakdown_type: 'event'
    },
    dateRange: {
      date_from: `-${days}d`,
      date_to: 'now'
    },
    properties: {
      type: 'AND',
      values: [
        {
          type: 'event',
          key: 'creator_id',
          value: creatorId
        }
      ]
    }
  });

  return breakdown;
}

export async function getTopApps(creatorId, days = 30) {
  const topApps = await posthogAPI.query({
    kind: 'TrendsQuery',
    series: [
      { event: 'app_viewed', name: 'Views', math: 'total' }
    ],
    breakdownFilter: {
      breakdown: 'app_id',
      breakdown_type: 'event'
    },
    dateRange: {
      date_from: `-${days}d`,
      date_to: 'now'
    },
    properties: {
      type: 'AND',
      values: [
        {
          type: 'event',
          key: 'creator_id',
          value: creatorId
        }
      ]
    }
  });

  return topApps.results;
}

export async function getTimeSeries(creatorId, days = 30) {
  const timeSeries = await posthogAPI.query({
    kind: 'TrendsQuery',
    series: [
      { event: 'app_viewed', name: 'Views' },
      { event: 'app_tried', name: 'Tries' },
      { event: 'app_saved', name: 'Saves' }
    ],
    interval: 'day',
    dateRange: {
      date_from: `-${days}d`,
      date_to: 'now'
    },
    properties: {
      type: 'AND',
      values: [
        {
          type: 'event',
          key: 'creator_id',
          value: creatorId
        }
      ]
    }
  });

  return timeSeries;
}
```

#### Step 3: Create Analytics API Route

```javascript
// src/app/api/me/analytics/route.js
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { 
  getCreatorAnalytics, 
  getConversionFunnel, 
  getTrafficSources,
  getTopApps,
  getTimeSeries
} from '@/src/lib/posthog-api';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { userId } = await createServerSupabaseClient();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30');

  // Fetch all analytics data in parallel
  const [
    rawData,
    funnel,
    sources,
    topApps,
    timeSeries
  ] = await Promise.all([
    getCreatorAnalytics(userId, days),
    getConversionFunnel(userId, days),
    getTrafficSources(userId, days),
    getTopApps(userId, days),
    getTimeSeries(userId, days)
  ]);

  // Process and aggregate data
  const totalViews = rawData.views.length;
  const totalTries = rawData.tries.length;
  const totalSaves = rawData.saves.length;

  const viewToTryRate = totalViews > 0 
    ? ((totalTries / totalViews) * 100).toFixed(1) 
    : 0;
  
  const tryToSaveRate = totalTries > 0 
    ? ((totalSaves / totalTries) * 100).toFixed(1) 
    : 0;

  return NextResponse.json({
    overview: {
      totalViews,
      totalTries,
      totalSaves,
      viewToTryRate: parseFloat(viewToTryRate),
      tryToSaveRate: parseFloat(tryToSaveRate)
    },
    funnel: funnel.results,
    trafficSources: sources.results,
    topApps: topApps,
    timeSeries: timeSeries.results
  });
}
```

#### Step 4: Build Custom Dashboard UI

Use the same UI from `QUICK_WINS_ANALYTICS.md`, but fetch from PostHog API instead of Supabase.

### Pros
- ✅ **Rich analytics** (PostHog does heavy lifting)
- ✅ **Your branding** (custom UI)
- ✅ Advanced features (funnels, cohorts, paths)
- ✅ Real-time updates
- ✅ No SQL to write
- ✅ Session replay (see how users interact)

### Cons
- ⚠️ Requires PostHog paid plan ($0 for 1M events/mo, then paid)
- ⚠️ API rate limits (cache responses)
- ⚠️ Slight delay vs direct DB queries

---

## 🏆 Option 3: Hybrid Approach (Best of Both)

### Use PostHog for Event Tracking, Supabase for Display

**Why?**
- PostHog excels at **event collection** and **funnel analysis**
- Supabase excels at **fast queries** and **denormalized counts**

**How?**

1. **Keep PostHog for:**
   - Client-side event tracking (already done!)
   - Funnel analysis (conversion rates)
   - User behavior paths
   - Session replay for debugging
   - A/B testing (future)

2. **Keep Supabase for:**
   - Fast aggregated counts (view_count, try_count, save_count)
   - Creator dashboard queries (top apps table)
   - Real-time leaderboards
   - Public stats (don't expose PostHog)

3. **Sync Strategy:**
   - Events go to **both** systems (PostHog client-side, Supabase server-side)
   - Use PostHog for **deep dives** (creator wants detailed insights)
   - Use Supabase for **quick stats** (profile pages, public leaderboards)

### Implementation

```javascript
// Enhanced tracking: send to both PostHog and Supabase
export const analytics = {
  appViewed: async (appId, appName, creatorId, source = 'unknown') => {
    // PostHog (client-side, rich context)
    const posthog = getPostHog();
    if (posthog) {
      posthog.capture('app_viewed', {
        app_id: appId,
        app_name: appName,
        creator_id: creatorId,
        view_source: source,
        // PostHog auto-captures: device, browser, location, etc.
      });
    }
    
    // Supabase (server-side, fast aggregation)
    fetch(`/api/apps/${appId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
      keepalive: true
    }).catch(() => {});
  }
};
```

### Dashboard Strategy

```javascript
// /me/analytics - Show both PostHog and Supabase data
export default function AnalyticsPage() {
  const [supabaseStats, setSupabaseStats] = useState(null); // Fast, simple stats
  const [posthogInsights, setPosthogInsights] = useState(null); // Deep analytics

  useEffect(() => {
    // Fetch fast stats from Supabase (< 100ms)
    fetch('/api/me/analytics/quick-stats')
      .then(res => res.json())
      .then(setSupabaseStats);

    // Fetch detailed insights from PostHog (1-2s)
    fetch('/api/me/analytics/posthog-insights')
      .then(res => res.json())
      .then(setPosthogInsights);
  }, []);

  return (
    <div className="analytics-dashboard">
      {/* Quick Stats from Supabase (loads instantly) */}
      {supabaseStats && (
        <div className="overview-cards">
          <MetricCard label="Total Views" value={supabaseStats.totalViews} />
          <MetricCard label="Total Tries" value={supabaseStats.totalTries} />
        </div>
      )}

      {/* Detailed Insights from PostHog (loads after) */}
      {posthogInsights ? (
        <>
          <ConversionFunnel data={posthogInsights.funnel} />
          <TrafficSources data={posthogInsights.sources} />
          <TimeSeriesChart data={posthogInsights.timeSeries} />
        </>
      ) : (
        <div>Loading detailed insights...</div>
      )}
    </div>
  );
}
```

---

## 🚀 Recommended Path: Start with PostHog API

### Phase 1: MVP (Week 1)
1. ✅ Use PostHog API to fetch creator's event data
2. ✅ Build simple dashboard with overview cards
3. ✅ Show top apps from PostHog breakdown
4. ✅ Display time-series chart from PostHog trends

### Phase 2: Enhance (Week 2)
5. ✅ Add funnel visualization (PostHog funnels)
6. ✅ Add traffic sources chart
7. ✅ Cache PostHog responses (Redis/Vercel KV)
8. ✅ Add real-time updates via PostHog webhooks

### Phase 3: Optimize (Week 3-4)
9. ✅ Migrate hot queries to Supabase for speed
10. ✅ Keep deep analytics in PostHog
11. ✅ Add session replay links for high-value creators
12. ✅ Build advanced features (cohorts, paths, retention)

---

## 💰 Cost Comparison

### PostHog Pricing
- **Free**: 1M events/month + 5K session replays
- **Paid**: $0.000225 per event after 1M ($225 per additional 1M)
- **Benefits**: Built-in analytics, no infrastructure

### Self-Built (Supabase)
- **Free Tier**: Up to 500MB database
- **Pro**: $25/month for 8GB
- **Benefits**: Full control, no per-event costs

### Recommendation
Start with **PostHog** (likely free tier), migrate high-volume queries to **Supabase** if needed.

---

## 🎯 Quick Implementation Code

### Minimal Working Example

```javascript
// Install
npm install posthog-node

// .env.local
POSTHOG_PROJECT_API_KEY=phc_...
POSTHOG_PERSONAL_API_KEY=phx_... # Get from PostHog settings

// src/app/api/me/analytics/route.js
import { PostHogAPI } from 'posthog-node';

const posthog = new PostHogAPI(
  process.env.POSTHOG_PROJECT_API_KEY,
  { personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY }
);

export async function GET(req) {
  const { userId } = await getAuthUser(req);
  
  // Get last 30 days of app views
  const views = await posthog.query({
    kind: 'EventsQuery',
    select: ['timestamp', 'properties.app_id', 'distinct_id'],
    event: 'app_viewed',
    where: [`properties.creator_id = '${userId}'`],
    after: '-30d'
  });

  // Count unique views per app
  const appViews = views.results.reduce((acc, event) => {
    const appId = event.properties.app_id;
    acc[appId] = (acc[appId] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    totalViews: views.results.length,
    topApps: Object.entries(appViews)
      .map(([id, views]) => ({ id, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
  });
}
```

That's literally it. 50 lines of code → full creator analytics.

---

## 🔥 Bonus: PostHog Features You Get for Free

### 1. Session Replay
See exactly how users interact with your apps:
```javascript
// Link from analytics dashboard
<a href={`https://app.posthog.com/recordings?user=${distinctId}`}>
  Watch user sessions →
</a>
```

### 2. Funnel Analysis
Already built-in - just query it:
```javascript
const funnel = await posthog.query({
  kind: 'FunnelsQuery',
  series: [
    { event: 'app_viewed' },
    { event: 'app_tried' },
    { event: 'app_saved' }
  ]
});
// Returns: [100%, 15%, 3.5%] (automatic conversion rates)
```

### 3. User Paths
See the journey users take:
```javascript
const paths = await posthog.query({
  kind: 'PathsQuery',
  pathsFilter: {
    includeEventTypes: ['$pageview', 'app_viewed', 'app_tried']
  }
});
// Shows: home → feed → app_detail → try → save (visual flow)
```

### 4. Cohort Analysis
Track creator performance over time:
```javascript
// Create cohort of "Active Creators" (published >3 apps)
// PostHog auto-calculates retention, engagement trends
```

### 5. Feature Flags
A/B test different creator dashboard layouts:
```javascript
if (posthog.isFeatureEnabled('new_analytics_layout', userId)) {
  return <NewDashboard />;
}
```

---

## 🎯 Final Recommendation

### Start Here (This Week):
1. **Use PostHog API** for creator analytics
2. **Build simple UI** with overview + top apps
3. **Ship fast** (1 week vs 4 weeks custom)

### Optimize Later (Month 2+):
4. **Cache** PostHog queries (Redis)
5. **Migrate** hot paths to Supabase
6. **Add advanced** PostHog features (funnels, cohorts)

### Why This Works:
- ✅ Fastest time to market
- ✅ Rich analytics out of the box
- ✅ Can always optimize later
- ✅ No vendor lock-in (events in both systems)

---

## 📚 Resources

- **PostHog API Docs**: https://posthog.com/docs/api
- **PostHog Node SDK**: https://posthog.com/docs/libraries/node
- **Query Types**: https://posthog.com/docs/product-analytics/query-types
- **Funnels Guide**: https://posthog.com/docs/product-analytics/funnels
- **Example Queries**: https://posthog.com/docs/api/query

---

## Next Steps

1. **Enable PostHog API access** in your project settings
2. **Get personal API key** (Settings → Personal API Keys)
3. **Test API calls** in Postman/curl
4. **Implement analytics route** with PostHog queries
5. **Build simple UI** to display data
6. **Ship to creators** and gather feedback

**You can have creator analytics live THIS WEEK using PostHog!** 🚀


