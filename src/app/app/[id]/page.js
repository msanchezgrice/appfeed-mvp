'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';
import AppOutput from '@/src/components/AppOutput';
import { analytics } from '@/src/lib/analytics';

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [app, setApp] = useState(null);
  const [remixes, setRemixes] = useState([]);
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedApp, setSavedApp] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [overlayRun, setOverlayRun] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount (prevents hydration mismatch)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Fetch app details
        const appRes = await fetch(`/api/apps/${appId}`);
        if (appRes.ok) {
          const appData = await appRes.json();
          console.log('[App Detail] Fetched data:', appData);
          // API returns { app, creator } - extract the app
          const fetchedApp = appData.app || appData;
          setApp(fetchedApp);
          
          // Track app view in PostHog
          if (fetchedApp) {
            analytics.appViewed(
              fetchedApp.id,
              fetchedApp.name,
              fetchedApp.creator_id,
              'detail' // view source
            );
          }
        }

        // Fetch all apps to find remixes
        const appsRes = await fetch('/api/apps');
        const appsData = await appsRes.json();
        const appRemixes = appsData.apps.filter(a => a.fork_of === appId);
        setRemixes(appRemixes);

        // TODO: Fetch saves/likes for this app
        // For now using placeholder
        setSaves([]);
      } catch (err) {
        console.error('Error loading app:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [appId]);

  // Check if app is saved
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/library', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSavedApp(!!(data?.items || []).find(x => x.id === appId));
        }
      } catch {
        // ignore
      }
    })();
  }, [appId]);

  // Load overlay run when ?run= is present
  useEffect(() => {
    const runId = searchParams.get('run');
    if (!runId) {
      setOverlayOpen(false);
      setOverlayRun(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/runs?id=${encodeURIComponent(runId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && data?.run) {
          setOverlayRun(data.run);
          setOverlayOpen(true);
        } else {
          setOverlayOpen(false);
        }
      } catch (e) {
        setOverlayOpen(false);
      }
    })();
  }, [searchParams]);

  const saveResult = async () => {
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', runId: overlayRun?.id })
      });
      if (res.status === 401) {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(`/app/${appId}?run=${overlayRun?.id || ''}`)}`);
        return;
      }
      if (res.ok) setResultSaved(true);
    } catch {
      // ignore
    }
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    // Prefer back navigation so the hardware/browser back button semantics match closing the overlay.
    // Fallback to direct navigation in case history doesn't have a prior state.
    try {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.replace(`/app/${appId}`);
      }
    } catch {
      router.replace(`/app/${appId}`);
    }
  };

  // Log a view once per session when the detail page is opened
  useEffect(() => {
    if (!appId) return;
    try {
      const key = `viewed_app_detail:${appId}`;
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key) === '1') return;
      // Fire and forget; keepalive to avoid blocking navigation
      fetch(`/api/apps/${appId}/view?src=detail`, { method: 'POST', keepalive: true }).catch(() => {});
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, '1');
    } catch {
      // ignore
    }
  }, [appId]);

  // Lock background scroll when overlay is open (mobile full-screen UX)
  useEffect(() => {
    if (!overlayOpen) return;
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prev || '';
      }
    };
  }, [overlayOpen]);

  // ESC to close overlay
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeOverlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayOpen]);

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <h1>App Not Found</h1>
        <Link href="/feed" className="btn primary">← Back to Feed</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px', paddingBottom: '100px' }}>
      {/* Hero Section */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/feed" className="btn ghost" style={{ marginBottom: 16, display: 'inline-block' }}>
          ← Back to Feed
        </Link>
        
        <div style={{
          background: app.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          padding: 40,
          color: 'white',
          marginBottom: 24
        }}>
          <h1 style={{ margin: '0 0 12px 0', fontSize: 36 }}>{app.name}</h1>
          <p style={{ margin: '0 0 20px 0', fontSize: 18, opacity: 0.9 }}>{app.description}</p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {app.tags?.map(tag => (
              <Link
                key={tag}
                href={`/search?tag=${tag}`}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '6px 12px',
                  borderRadius: 16,
                  fontSize: 14,
                  color: 'white',
                  textDecoration: 'none'
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: 14, opacity: 0.9 }}>
            <div>👁️ {app.view_count || 0} views</div>
            <div>🎯 {app.try_count || 0} tries</div>
            <div>🔖 {app.save_count || 0} saves</div>
            <div>🔄 {app.remix_count || 0} remixes</div>
          </div>
        </div>

        {/* Creator Info */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24
        }}>
          <img
            src={app.creator?.avatar_url || '/avatars/1.svg'}
            alt={app.creator?.display_name}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>
              {app.creator?.display_name || app.creator?.username || 'User'}
            </div>
            <div style={{ fontSize: 14, color: '#888' }}>
              @{app.creator?.username}
            </div>
          </div>
          <Link
            href={`/profile/${app.creator_id}`}
            className="btn primary"
          >
            View Profile →
          </Link>
        </div>
      </div>

      {/* App Preview Card */}
      <div style={{ marginBottom: 40 }}>
        <h2 id="try" style={{ marginBottom: 16 }}>Try This App</h2>
        <TikTokFeedCard app={app} />
      </div>

      {/* Remixes Section */}
      {remixes.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 16 }}>Remixes ({remixes.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {remixes.map(remix => (
              <Link
                key={remix.id}
                href={`/app/${remix.id}`}
                style={{
                  background: '#1a1a1a',
                  borderRadius: 12,
                  padding: 20,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  border: '1px solid #333',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fe2c55'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    background: remix.preview_gradient,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{remix.name}</div>
                  <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
                    by @{remix.creator?.username}
                  </div>
                  {remix.remix_prompt && (
                    <div style={{ fontSize: 12, color: '#fe2c55' }}>
                      💡 "{remix.remix_prompt}"
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 24 }}>→</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share Section */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0 }}>Share This App</h3>
        <p className="small" style={{ marginBottom: 20, opacity: 0.8 }}>
          Let others discover {app.name}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
              analytics.appShared(app.id, app.name, app.creator_id, 'copy_link');
            }}
            className="btn primary"
          >
            📋 Copy Link
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: app.name,
                  text: app.description,
                  url: window.location.href
                });
                analytics.appShared(app.id, app.name, app.creator_id, 'native_share');
              }
            }}
            className="btn"
          >
            🔗 Share
          </button>
        </div>
      </div>
      
      {/* Result Overlay */}
      {overlayOpen && overlayRun && (
        <div className="modal" onClick={closeOverlay} style={{ zIndex: 9999 }}>
          <div
            className="dialog"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100vw',
              maxWidth: '100vw',
              height: '100dvh',
              maxHeight: '100dvh',
              borderRadius: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header - hide on mobile for iframe/html-bundle apps */}
            <div
              style={{
                padding: '12px 16px',
                paddingTop: 'calc(12px + env(safe-area-inset-top))',
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'var(--panel)',
                borderBottom: '1px solid #1f2937',
                display: (isMobile && (app?.runtime?.render_type === 'iframe' || app?.runtime?.render_type === 'html-bundle')) 
                  ? 'none' 
                  : 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <b>Play: {app.name}</b>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" disabled={resultSaved} onClick={saveResult}>
                    {resultSaved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      const appUrl = `${window.location.origin}/app/${appId}?run=${overlayRun.id}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: app.name, text: app.description, url: appUrl });
                        } catch (err) {
                          if (err.name !== 'AbortError') console.error('Share failed:', err);
                        }
                      } else {
                        navigator.clipboard.writeText(appUrl);
                        alert('Link copied to clipboard!');
                      }
                    }}
                  >
                    Share
                  </button>
                </div>
              </div>
              <button className="btn ghost" onClick={closeOverlay}>✕</button>
            </div>
            {/* Body with max-width on desktop */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: (isMobile && (app?.runtime?.render_type === 'iframe' || app?.runtime?.render_type === 'html-bundle')) 
                  ? '0'
                  : '16px',
                paddingBottom: (isMobile && (app?.runtime?.render_type === 'iframe' || app?.runtime?.render_type === 'html-bundle')) 
                  ? '0'
                  : 'calc(16px + env(safe-area-inset-bottom))',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div style={{ width: '100%', maxWidth: '800px' }}>
                <AppOutput run={overlayRun} app={app} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
