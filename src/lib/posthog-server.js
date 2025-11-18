// Server-side PostHog API client for fetching analytics data
import { PostHog } from 'posthog-node';

// Initialize PostHog client (singleton)
let posthogClient = null;

function getPostHogClient() {
  if (!posthogClient && process.env.POSTHOG_PROJECT_API_KEY) {
    posthogClient = new PostHog(
      process.env.POSTHOG_PROJECT_API_KEY,
      {
        host: 'https://app.posthog.com',
        personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY
      }
    );
  }
  return posthogClient;
}

/**
 * Get portfolio analytics for a creator
 * @param {string} creatorId - The creator's user ID
 * @param {number} days - Number of days to look back
 */
export async function getCreatorPortfolioAnalytics(creatorId, days = 30) {
  const client = getPostHogClient();
  if (!client) {
    console.warn('[PostHog] Client not initialized - check API keys');
    return null;
  }

  try {
    // Get all events for this creator in parallel
    const [viewsData, triesData, savesData, sharesData, remixesData] = await Promise.all([
      // Views
      client.query({
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'properties.app_name', 'distinct_id'],
          event: 'app_viewed',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }).catch(() => ({ results: [] })),
      
      // Tries
      client.query({
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_tried',
          where: [`properties.$current_creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }).catch(() => ({ results: [] })),
      
      // Saves
      client.query({
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_saved',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }).catch(() => ({ results: [] })),
      
      // Shares
      client.query({
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.app_id', 'distinct_id'],
          event: 'app_shared',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }).catch(() => ({ results: [] })),
      
      // Remixes
      client.query({
        query: {
          kind: 'EventsQuery',
          select: ['timestamp', 'properties.original_app_id', 'distinct_id'],
          event: 'app_remixed',
          where: [`properties.creator_id = '${creatorId}'`],
          after: `-${days}d`
        }
      }).catch(() => ({ results: [] }))
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
  const client = getPostHogClient();
  if (!client) return null;

  try {
    const timeSeries = await client.query({
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
  const client = getPostHogClient();
  if (!client) return null;

  try {
    const breakdown = await client.query({
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
  const client = getPostHogClient();
  if (!client) return null;

  try {
    const funnel = await client.query({
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

