'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';
import Image from 'next/image';

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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 0', paddingBottom: '100px', minHeight: 'calc(100vh - 60px)' }}>
        {/* Header skeleton */}
        <div className="skeleton" style={{ width: 140, height: 20, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 220, height: 14, borderRadius: 8, marginBottom: 24 }} />

        {/* Saved section */}
        <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 8, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 28 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-saved-${i}`} className="skeleton" style={{ aspectRatio: '1', borderRadius: 6 }} />
          ))}
        </div>

        {/* Created section */}
        <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 8, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 28 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-created-${i}`} className="skeleton" style={{ aspectRatio: '1', borderRadius: 6 }} />
          ))}
        </div>

        {/* Library section */}
        <div className="skeleton" style={{ width: 110, height: 16, borderRadius: 8, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-assets-${i}`} className="skeleton" style={{ aspectRatio: '1', borderRadius: 6 }} />
          ))}
        </div>
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
                  <Image
                    src={app.preview_url}
                    alt={app.name}
                    fill
                    sizes="33vw"
                    style={{ objectFit: 'cover' }}
                    placeholder={app.preview_blur ? 'blur' : 'empty'}
                    blurDataURL={app.preview_blur || undefined}
                  />
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
                  <Image
                    src={app.preview_url}
                    alt={app.name}
                    fill
                    sizes="33vw"
                    style={{ objectFit: 'cover' }}
                    placeholder={app.preview_blur ? 'blur' : 'empty'}
                    blurDataURL={app.preview_blur || undefined}
                  />
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
                preview = (
                  <Image src={r.asset_url} alt={r.id} fill sizes="33vw" style={{ objectFit: 'cover' }} />
                );
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
