// Server-side PostHog API client for fetching analytics data
// Uses direct API calls instead of posthog-node SDK (which doesn't support query API)

const POSTHOG_API_URL = 'https://app.posthog.com/api';
const POSTHOG_PROJECT_ID = '251302'; // Your PostHog project ID

/**
 * Make authenticated request to PostHog API
 */
async function posthogAPI(endpoint, body) {
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  
  if (!personalApiKey) {
    console.warn('[PostHog] Personal API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${POSTHOG_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${personalApiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PostHog] API error: ${response.status} - ${errorText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[PostHog] Request failed:', error.message);
    return null;
  }
}

/**
 * Get portfolio analytics for a creator
 * @param {string} creatorId - The creator's user ID
 * @param {number} days - Number of days to look back
 */
export async function getCreatorPortfolioAnalytics(creatorId, days = 30) {
  try {
    // Get all events for this creator in parallel
    const [viewsData, triesData, savesData, sharesData, remixesData] = await Promise.all([
      // Views
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'properties.app_name', 'distinct_id'],
          event: 'app_viewed',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }),
      
      // Tries
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_tried',
          where: [`properties.$current_creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }),
      
      // Saves
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_saved',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }),
      
      // Shares
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_shared',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }),
      
      // Remixes
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.original_app_id', 'distinct_id'],
          event: 'app_remixed',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      })
    ]);

    return {
      views: viewsData?.results || [],
      tries: triesData?.results || [],
      saves: savesData?.results || [],
      shares: sharesData?.results || [],
      remixes: remixesData?.results || []
    };
  } catch (error) {
    console.error('[PostHog] Error fetching portfolio analytics:', error);
    return null;
  }
}

/**
 * Get time-series data for a creator (daily breakdown)
 */
export async function getCreatorTimeSeries(creatorId, days = 30) {
  try {
    const timeSeries = await posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
      query: {
        kind: 'TrendsQuery',
        series: [
          { event: 'app_viewed', name: 'Views', math: 'total' },
          { event: 'app_tried', name: 'Tries', math: 'total' },
          { event: 'app_saved', name: 'Saves', math: 'total' }
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
      }
    });

    return timeSeries?.results || null;
  } catch (error) {
    console.error('[PostHog] Error fetching time series:', error);
    return null;
  }
}

/**
 * Get traffic source breakdown for a creator
 */
export async function getTrafficSources(creatorId, days = 30) {
  try {
    const breakdown = await posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
      query: {
        kind: 'TrendsQuery',
        series: [
          { event: 'app_viewed', name: 'Views', math: 'total' }
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
      }
    });

    return breakdown?.results || null;
  } catch (error) {
    console.error('[PostHog] Error fetching traffic sources:', error);
    return null;
  }
}

/**
 * Get conversion funnel for a creator
 */
export async function getConversionFunnel(creatorId, days = 30) {
  try {
    const funnel = await posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
      query: {
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
      }
    });

    return funnel?.results || null;
  } catch (error) {
    console.error('[PostHog] Error fetching funnel:', error);
    return null;
  }
}

