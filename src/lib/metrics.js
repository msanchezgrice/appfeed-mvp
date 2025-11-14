// Minimal helper for Vercel Web Analytics server-side events
// Uses fire-and-forget to avoid adding latency on hot paths.
import { track } from '@vercel/analytics/server';

export function logEventServer(eventName, data = {}) {
  try {
    // Ensure only flat, serializable primitives are sent
    const safe = {};
    for (const [k, v] of Object.entries(data || {})) {
      const t = typeof v;
      if (v === null || t === 'string' || t === 'number' || t === 'boolean') {
        // Truncate long values defensively (Vercel limit ~255 chars)
        safe[k] = t === 'string' && v.length > 255 ? v.slice(0, 255) : v;
      }
    }
    // Do not await; let the platform batch and send
    Promise.resolve(track(eventName, safe)).catch(() => {});
  } catch {
    // Never throw from analytics
  }
}


