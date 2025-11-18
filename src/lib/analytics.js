import { getPostHog } from './posthog';

/**
 * Track custom events in PostHog
 * Usage: trackEvent('app_published', { app_id: '123', app_name: 'My App' })
 */
export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    const posthog = getPostHog();
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  } catch (error) {
    console.warn('[Analytics] Failed to track event:', eventName, error);
  }
}

/**
 * Update user properties in PostHog
 * Usage: updateUserProperties({ plan: 'pro', apps_created: 5 })
 */
export function updateUserProperties(properties = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    const posthog = getPostHog();
    if (posthog) {
      posthog.setPersonProperties(properties);
    }
  } catch (error) {
    console.warn('[Analytics] Failed to update user properties:', error);
  }
}

/**
 * Get attribution data from URL and session
 */
function getAttribution() {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer || 'direct';
  
  return {
    utm_source: urlParams.get('utm_source') || sessionStorage.getItem('utm_source') || 'direct',
    utm_medium: urlParams.get('utm_medium') || sessionStorage.getItem('utm_medium') || null,
    utm_campaign: urlParams.get('utm_campaign') || sessionStorage.getItem('utm_campaign') || null,
    referrer: referrer,
    landing_page: sessionStorage.getItem('landing_page') || window.location.pathname,
  };
}

/**
 * Store attribution data in session
 */
function storeAttribution() {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('utm_source')) {
    sessionStorage.setItem('utm_source', urlParams.get('utm_source'));
  }
  if (urlParams.get('utm_medium')) {
    sessionStorage.setItem('utm_medium', urlParams.get('utm_medium'));
  }
  if (urlParams.get('utm_campaign')) {
    sessionStorage.setItem('utm_campaign', urlParams.get('utm_campaign'));
  }
  if (!sessionStorage.getItem('landing_page')) {
    sessionStorage.setItem('landing_page', window.location.pathname);
  }
}

// Store attribution on page load
if (typeof window !== 'undefined') {
  storeAttribution();
}

/**
 * Track app lifecycle events
 */
export const analytics = {
  // User events
  userSignedUp: (userId, email) => {
    const attribution = getAttribution();
    trackEvent('user_signed_up', { 
      user_id: userId, 
      email,
      ...attribution 
    });
    // Also set user properties for attribution
    updateUserProperties({
      signup_source: attribution.utm_source,
      signup_campaign: attribution.utm_campaign,
      signup_referrer: attribution.referrer,
    });
  },

  userSignedIn: (userId) => {
    trackEvent('user_signed_in', { user_id: userId });
  },

  // App events
  appViewed: (appId, appName, creatorId, source = 'unknown') => {
    const attribution = getAttribution();
    
    // Set current app as super property (persists across events)
    const posthog = getPostHog();
    if (posthog) {
      posthog.register({
        $current_app_id: appId,
        $current_app_name: appName,
        $current_creator_id: creatorId,
      });
    }
    
    trackEvent('app_viewed', {
      app_id: appId,
      app_name: appName,
      creator_id: creatorId,
      view_source: source, // 'feed', 'detail', 'profile', 'search'
      ...attribution,
    });
  },

  appTried: (appId, appName, source = 'unknown', isAuthenticated = false) => {
    // Set current app context
    const posthog = getPostHog();
    if (posthog) {
      posthog.register({
        $current_app_id: appId,
        $current_app_name: appName,
      });
    }
    
    trackEvent('app_tried', {
      app_id: appId,
      app_name: appName,
      try_source: source, // 'feed', 'detail'
      is_authenticated: isAuthenticated,
      user_type: isAuthenticated ? 'signed_in' : 'anonymous',
    });
  },

  appClicked: (appId, appName, clickSource) => {
    // Track when user clicks to view app details
    trackEvent('app_clicked', {
      app_id: appId,
      app_name: appName,
      click_source: clickSource, // 'feed', 'search', 'profile'
    });
  },

  appPublished: (appId, appName, tags, isAiGenerated) => {
    trackEvent('app_published', {
      app_id: appId,
      app_name: appName,
      tags: tags,
      is_ai_generated: isAiGenerated,
    });
  },

  appRemixed: (originalAppId, newAppId, originalAppName) => {
    trackEvent('app_remixed', {
      original_app_id: originalAppId,
      new_app_id: newAppId,
      original_app_name: originalAppName,
    });
  },

  appSaved: (appId, appName) => {
    trackEvent('app_saved', {
      app_id: appId,
      app_name: appName,
    });
  },

  appShared: (appId, appName, shareMethod = 'link') => {
    trackEvent('app_shared', {
      app_id: appId,
      app_name: appName,
      share_method: shareMethod, // 'link', 'twitter', etc.
    });
  },

  appLiked: (appId, appName) => {
    trackEvent('app_liked', {
      app_id: appId,
      app_name: appName,
    });
  },

  appUnliked: (appId, appName) => {
    trackEvent('app_unliked', {
      app_id: appId,
      app_name: appName,
    });
  },

  // Social events
  userFollowed: (followingUserId, followingUserName) => {
    trackEvent('user_followed', {
      following_user_id: followingUserId,
      following_user_name: followingUserName,
    });
  },

  userUnfollowed: (unfollowedUserId) => {
    trackEvent('user_unfollowed', {
      unfollowed_user_id: unfollowedUserId,
    });
  },

  // Search & discovery
  searchPerformed: (query, resultsCount) => {
    trackEvent('search_performed', {
      query: query,
      results_count: resultsCount,
    });
  },

  // Creator actions
  creatorModeEnabled: () => {
    trackEvent('creator_mode_enabled');
  },

  secretsConfigured: (provider) => {
    trackEvent('secrets_configured', {
      provider: provider,
    });
  },

  // Engagement
  feedScrolled: (scrollDepth) => {
    trackEvent('feed_scrolled', {
      scroll_depth: scrollDepth,
    });
  },

  // Conversion funnel tracking
  conversionFunnel: (step, appId = null) => {
    // Track key steps in user journey
    // Steps: 'landed', 'viewed_app', 'tried_app', 'saved_app', 'published_app'
    trackEvent('conversion_funnel', {
      funnel_step: step,
      app_id: appId,
    });
  },

  // Anonymous user tracking
  anonymousUserBlocked: (action, appId, appName) => {
    // Track when anonymous users hit signup wall
    trackEvent('anonymous_user_blocked', {
      blocked_action: action, // 'save', 'remix', 'publish'
      app_id: appId,
      app_name: appName,
    });
  },

  signupPrompted: (trigger) => {
    // Track what prompted user to sign up
    trackEvent('signup_prompted', {
      trigger: trigger, // 'save_app', 'remix_app', 'publish', 'follow_user'
    });
  },

  // HTML Bundle specific events
  htmlBundleLoaded: (appId, appName, usageCount, usageLimit) => {
    trackEvent('html_bundle_loaded', {
      app_id: appId,
      app_name: appName,
      usage_count: usageCount,
      usage_limit: usageLimit,
      usage_percentage: Math.round((usageCount / usageLimit) * 100)
    });
  },

  htmlBundleLimitReached: (appId, appName) => {
    trackEvent('html_bundle_limit_reached', {
      app_id: appId,
      app_name: appName
    });
  },

  // Iframe/Remote URL events
  iframeAppLoaded: (appId, appName, externalUrl) => {
    trackEvent('iframe_app_loaded', {
      app_id: appId,
      app_name: appName,
      external_url: externalUrl
    });
  },

  // Publishing mode tracking
  publishModeSelected: (mode) => {
    // Track which publishing mode users choose
    trackEvent('publish_mode_selected', {
      mode: mode // 'ai', 'inline', 'remote', 'github', 'remote-url', 'html-bundle'
    });
  },
};

