'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomeAppsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colCount, setColCount] = useState(3);

  useEffect(() => {
    const computeCols = () => {
      if (typeof window === 'undefined') return;
      // Always 3 columns on mobile (<640px), 4 on tablet/desktop
      setColCount(window.innerWidth < 640 ? 3 : 4);
    };
    computeCols();
    window.addEventListener('resize', computeCols);
    return () => window.removeEventListener('resize', computeCols);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/home');
      return;
    }
    (async () => {
      // Try to hydrate from session cache for instant UI
      if (typeof window !== 'undefined' && isSignedIn) {
        try {
          const cacheKey = `cc_home_apps:${isSignedIn ? 'user' : 'anon'}`;
          const cached = window.sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length) {
              setApps(parsed);
              setLoading(false);
            }
          }
        } catch {
          // ignore cache errors
        }
      }

      try {
        setLoading(true);
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
        if (typeof window !== 'undefined') {
          try {
            const cacheKey = `cc_home_apps:${isSignedIn ? 'user' : 'anon'}`;
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
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', paddingBottom: 80 }}>
        <div className="skeleton" style={{ width: 160, height: 24, borderRadius: 8, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 24 }} />
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
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          gap: 16
        }}
      >
        {apps.map((app) => (
          <Link
            key={app.id}
            href={`/me/app/${app.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div
              style={{
                width: colCount === 3 ? 100 : 84,
                height: colCount === 3 ? 100 : 84,
                borderRadius: 24,
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
                <span style={{ fontSize: colCount === 3 ? 36 : 28 }}>{app.icon || '📱'}</span>
              )}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                maxWidth: colCount === 3 ? 110 : 100,
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
                  fontSize: 11,
                  color: '#777',
                  maxWidth: colCount === 3 ? 110 : 100,
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
        ))}
      </div>
    </div>
  );
}
