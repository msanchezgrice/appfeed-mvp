import posthog from 'posthog-js';

let isInitialized = false;

export function initPostHog() {
  if (typeof window === 'undefined' || isInitialized) return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    console.warn('[PostHog] Missing API key. Analytics disabled.');
    return;
  }

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
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Initialized successfully');
      }
    },
  });

  isInitialized = true;
}

export { posthog };
