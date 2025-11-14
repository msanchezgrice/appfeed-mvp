'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

export default function LibraryPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [savedApps, setSavedApps] = useState([]);
  const [createdApps, setCreatedApps] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/library');
      return;
    }

    if (!user) return;

    (async () => {
      try {
        const res = await fetch('/api/library');
        if (res.ok) {
          const data = await res.json();
          console.log('[Library] Data received:', data);
          setSavedApps(data.items || []);
        } else {
          console.error('[Library] API error:', res.status);
          setSavedApps([]);
        }
        // Fetch created apps (published + unpublished) for this user
        const appsRes = await fetch(`/api/apps?includeUnpublished=true&userId=${encodeURIComponent(user.id)}`);
        const appsData = await appsRes.json();
        const created = (appsData.apps || []).filter(a => a.creator_id === user.id);
        setCreatedApps(created);
        // Fetch user's latest assets (runs)
        const assetsRes = await fetch('/api/assets?mine=1', { cache: 'no-store' });
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          setAssets(assetsData.assets || []);
        } else {
          // fallback to recent runs if saved-assets table is not available
          const runsRes = await fetch('/api/runs?mine=1', { cache: 'no-store' });
          const runsData = await runsRes.json();
          setAssets(runsData.runs || []);
        }
      } catch (err) {
        console.error('[Library] Error fetching library:', err);
        setSavedApps([]);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isLoaded, isSignedIn, router]);

  if (!isLoaded || loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Redirect happens in useEffect
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 0', paddingBottom: '100px', minHeight: 'calc(100vh - 60px)' }}>
      <h1 style={{ marginBottom: 8 }}>Home</h1>
      <p className="small" style={{ marginBottom: 24, color: '#888' }}>Quick launch your apps</p>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Saved</h3>
        {savedApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>No saved apps yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {savedApps.map(app => (
              <a
                key={app.id}
                href={`/me/app/${app.id}`}
                style={{
                  aspectRatio: '1',
                  background: app.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                  textDecoration: 'none'
                }}
              >
                {app.preview_url && (
                  <img src={app.preview_url} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{
                  position: 'absolute',
                  left: 6,
                  right: 6,
                  top: 6,
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>{app.name}</div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 style={{ margin: '0 0 12px 0' }}>Created</h3>
        {createdApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>No created apps yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {createdApps.map(app => (
              <a
                key={app.id}
                href={`/me/app/${app.id}`}
                style={{
                  aspectRatio: '1',
                  background: app.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                  textDecoration: 'none'
                }}
              >
                {app.preview_url && (
                  <img src={app.preview_url} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{
                  position: 'absolute',
                  left: 6,
                  right: 6,
                  top: 6,
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>{app.name}</div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Library</h3>
        {assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>No assets yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {assets.map(r => {
              const href = `/app/${r.app_id}?run=${r.id}`;
              const isImage = !!r.asset_url;
              let preview = null;
              if (isImage) {
                preview = <img src={r.asset_url} alt={r.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
              } else {
                // Try to pull short text from outputs
                const text = typeof r.outputs === 'string'
                  ? r.outputs
                  : (r.outputs?.markdown || r.outputs?.text || JSON.stringify(r.outputs || {}).slice(0, 80));
                preview = (
                  <div style={{
                    padding: 8,
                    fontSize: 11,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {String(text || '').slice(0, 120)}
                  </div>
                );
              }
              return (
                <a
                  key={r.id}
                  href={href}
                  style={{
                    aspectRatio: '1',
                    background: '#111',
                    borderRadius: 6,
                    overflow: 'hidden',
                    position: 'relative',
                    textDecoration: 'none'
                  }}
                >
                  {preview}
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
