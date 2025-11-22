'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomeAppsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [states, setStates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/home');
      return;
    }
    (async () => {
      // Phase 1: try to hydrate from sessionStorage for instant UI
      let loadedFromCache = false;
      const cacheKey = user ? `cc_home_apps:${user.id}` : null;
      if (cacheKey && typeof window !== 'undefined') {
        try {
          const cached = window.sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length) {
              setApps(parsed);
              setLoading(false);
              loadedFromCache = true;
            }
          }
        } catch {
          // ignore cache errors
        }
      }

      try {
        if (!loadedFromCache) setLoading(true);
        const res = await fetch('/api/library', { cache: 'no-store' });
        if (!res.ok) {
          console.error('[Home] Failed to load library', res.status);
          setApps([]);
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        setApps(items);
         // update cache for this session
        if (cacheKey && typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(cacheKey, JSON.stringify(items));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('[Home] Error loading library', err);
        setApps([]);
      } finally {
        setLoading(false);
      }
    })();
    // Load user state for badges in the background so it never blocks icons
    (async () => {
      try {
        const stateRes = await fetch('/api/user-state', { cache: 'no-store' });
        if (!stateRes.ok) return;
        const stateData = await stateRes.json();
        const map = {};
        (stateData.states || []).forEach((s) => {
          if (s?.app_id) map[s.app_id] = s;
        });
        setStates(map);
      } catch {
        // ignore
      }
    })();
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', paddingBottom: 80 }}>
        <div className="skeleton" style={{ width: 160, height: 24, borderRadius: 8, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 24 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!apps.length) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', paddingBottom: 80, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>🏠 Home</h1>
        <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
          Save apps from the feed and they’ll show up here for quick access.
        </p>
        <Link href="/feed" className="btn primary">
          Browse Apps →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', paddingBottom: 80 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 4px 0' }}>🏠 Home</h1>
        <p style={{ color: '#888', margin: 0, fontSize: 14 }}>
          Your saved apps, iOS-style. Tap to open your personal app view.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12
        }}
      >
        {apps.map((app) => {
          const s = states[app.id];
          const lastUpdate = s?.last_update_at ? new Date(s.last_update_at) : null;
          const lastOpened = s?.last_opened_at ? new Date(s.last_opened_at) : null;
          const hasNew = lastUpdate && (!lastOpened || lastUpdate > lastOpened);
          return (
            <Link
              key={app.id}
              href={`/me/app/${app.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: app.preview_gradient || 'linear-gradient(135deg,#111,#222)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}
              >
                {app.preview_url ? (
                  <img
                    src={app.preview_url}
                    alt={app.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 28 }}>{app.icon || '📱'}</span>
                )}
                {hasNew && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 999,
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 0 0 2px rgba(0,0,0,0.7)'
                    }}
                  >
                    1
                  </span>
                )}
              </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                maxWidth: 72,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {app.name}
            </div>
            {app.description && (
              <div
                style={{
                  fontSize: 10,
                  color: '#777',
                  maxWidth: 72,
                  textAlign: 'center',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {app.description}
              </div>
            )}
          </Link>
          );
        })}
      </div>
    </div>
  );
}
