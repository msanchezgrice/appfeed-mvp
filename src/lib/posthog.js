let posthog = null;
let isInitialized = false;

export async function initPostHog() {
  if (typeof window === 'undefined' || isInitialized) return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    console.warn('[PostHog] Missing API key. Analytics disabled.');
    return;
  }

  try {
    // Dynamically import posthog-js (Next.js friendly)
    const posthogModule = await import('posthog-js');
    posthog = posthogModule.default;

    posthog.init(apiKey, {
      api_host: '/ingest', // Use reverse proxy to avoid ad blockers
      ui_host: 'https://us.posthog.com', // PostHog UI for toolbar
      person_profiles: 'always', // Track ALL users (anonymous + logged in)
      capture_pageview: false, // We handle this manually in PostHogProvider
      capture_pageleave: true, // Track when users leave
      autocapture: true, // Auto-capture clicks
      session_recording: {
        enabled: true, // Enable session replay
        maskAllInputs: true, // Mask sensitive inputs
        maskTextSelector: '[data-private]', // Mask elements with this attribute
      },
      loaded: (posthog) => {
        console.log('[PostHog] Initialized successfully');
        // Expose on window for debugging
        window.posthog = posthog;
      },
    });

    isInitialized = true;
    window.posthog = posthog; // Expose immediately
  } catch (error) {
    console.error('[PostHog] Failed to load:', error);
  }
}

export { posthog };

// Getter function to safely access posthog
export function getPostHog() {
  return posthog || window.posthog;
}
