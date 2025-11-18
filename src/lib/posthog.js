import posthog from 'posthog-js';

let isInitialized = false;

export function initPostHog() {
  if (typeof window === 'undefined' || isInitialized) return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) {
    console.warn('[PostHog] Missing API key or host. Analytics disabled.');
    return;
  }

  posthog.init(apiKey, {
    api_host: host,
    person_profiles: 'identified_only', // Only track identified users
    capture_pageview: true, // Auto-capture pageviews
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
