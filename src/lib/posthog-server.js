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
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_viewed',
          properties: [
            {
              type: 'event',
              key: '$current_creator_id',
              operator: 'exact',
              value: [creatorId]
            }
          ],
          after: `-${days}d`,
          limit: 1000
        }
      }),
      
      // Tries
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_tried',
          properties: [
            {
              type: 'event',
              key: '$current_creator_id',
              operator: 'exact',
              value: [creatorId]
            }
          ],
          after: `-${days}d`
        }
      }),
      
      // Saves
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_saved',
          properties: [
            {
              type: 'event',
              key: '$current_creator_id',
              operator: 'exact',
              value: [creatorId]
            }
          ],
          after: `-${days}d`
        }
      }),
      
      // Shares
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_shared',
          properties: [
            {
              type: 'event',
              key: '$current_creator_id',
              operator: 'exact',
              value: [creatorId]
            }
          ],
          after: `-${days}d`
        }
      }),
      
      // Remixes
      posthogAPI(`/projects/${POSTHOG_PROJECT_ID}/query/`, {
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.original_app_id', 'distinct_id'],
          event: 'app_remixed',
          properties: [
            {
              type: 'event',
              key: '$current_creator_id',
              operator: 'exact',
              value: [creatorId]
            }
          ],
          after: `-${days}d`
        }
      })
    ]);

    // PostHog returns results as arrays: [[timestamp, app_id, distinct_id], ...]
    // We need to transform them into objects for easier access
    const parseResults = (data, columns) => {
      if (!data?.results || !data?.columns) return [];
      const appIdIndex = data.columns.indexOf('properties.app_id');
      if (appIdIndex === -1) return [];
      
      return data.results.map(row => ({
        app_id: row[appIdIndex]
      })).filter(r => r.app_id);
    };

    return {
      views: parseResults(viewsData, ['timestamp', 'properties.app_id', 'distinct_id']),
      tries: parseResults(triesData, ['timestamp', 'properties.app_id', 'distinct_id']),
      saves: parseResults(savesData, ['timestamp', 'properties.app_id', 'distinct_id']),
      shares: parseResults(sharesData, ['timestamp', 'properties.app_id', 'distinct_id']),
      remixes: parseResults(remixesData, ['timestamp', 'properties.original_app_id', 'distinct_id'])
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
        properties: [
          {
            type: 'event',
            key: '$current_creator_id',
            operator: 'exact',
            value: [creatorId]
          }
        ]
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
        properties: [
          {
            type: 'event',
            key: '$current_creator_id',
            operator: 'exact',
            value: [creatorId]
          }
        ]
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
        dateRange: {
          date_from: `-${days}d`,
          date_to: 'now'
        },
        properties: [
          {
            type: 'event',
            key: '$current_creator_id',
            operator: 'exact',
            value: [creatorId]
          }
        ]
      }
    });

    return funnel?.results || null;
  } catch (error) {
    console.error('[PostHog] Error fetching funnel:', error);
    return null;
  }
}

