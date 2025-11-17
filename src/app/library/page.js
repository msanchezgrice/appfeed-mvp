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
  
  // Individual loading states for progressive loading
  const [savedLoading, setSavedLoading] = useState(true);
  const [createdLoading, setCreatedLoading] = useState(true);
  const [assetsLoading, setAssetsLoading] = useState(true);
  
  // Pagination state for each section
  const [savedVisible, setSavedVisible] = useState(9);
  const [createdVisible, setCreatedVisible] = useState(9);
  const [assetsVisible, setAssetsVisible] = useState(9);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/library');
      return;
    }

    if (!user) return;

    // Load saved apps first (highest priority)
    (async () => {
      try {
        const res = await fetch('/api/library');
        if (res.ok) {
          const data = await res.json();
          console.log('[Library] Saved data received:', data);
          setSavedApps(data.items || []);
        } else {
          console.error('[Library] API error:', res.status);
          setSavedApps([]);
        }
      } catch (err) {
        console.error('[Library] Error fetching saved apps:', err);
        setSavedApps([]);
      } finally {
        setSavedLoading(false);
      }
    })();

    // Load created apps (second priority)
    (async () => {
      try {
        const appsRes = await fetch(`/api/apps?includeUnpublished=true&userId=${encodeURIComponent(user.id)}`);
        const appsData = await appsRes.json();
        const created = (appsData.apps || []).filter(a => a.creator_id === user.id);
        setCreatedApps(created);
      } catch (err) {
        console.error('[Library] Error fetching created apps:', err);
        setCreatedApps([]);
      } finally {
        setCreatedLoading(false);
      }
    })();

    // Load library/assets last (third priority)
    (async () => {
      try {
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
        console.error('[Library] Error fetching assets:', err);
        setAssets([]);
      } finally {
        setAssetsLoading(false);
      }
    })();
  }, [user, isLoaded, isSignedIn, router]);

  if (!isLoaded) {
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

      {/* Saved Section - Loads first */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Saved</h3>
        {savedLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-saved-${i}`} className="skeleton" style={{ aspectRatio: '1', borderRadius: 6 }} />
            ))}
          </div>
        ) : savedApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>No saved apps yet</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {savedApps.slice(0, savedVisible).map(app => (
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
            {savedVisible < savedApps.length && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={() => setSavedVisible(prev => prev + 9)}
                  className="btn"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Show more ({savedApps.length - savedVisible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Created Section - Loads second */}
      <section>
        <h3 style={{ margin: '0 0 12px 0' }}>Created</h3>
        {createdLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-created-${i}`} className="skeleton" style={{ aspectRatio: '1', borderRadius: 6 }} />
            ))}
          </div>
        ) : createdApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>No created apps yet</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {createdApps.slice(0, createdVisible).map(app => (
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
            {createdVisible < createdApps.length && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={() => setCreatedVisible(prev => prev + 9)}
                  className="btn"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Show more ({createdApps.length - createdVisible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Library Section - Loads last */}
      <section style={{ marginTop: 28 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Library</h3>
        {assetsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-assets-${i}`} className="skeleton" style={{ aspectRatio: '1', borderRadius: 6 }} />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>No assets yet</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {assets.slice(0, assetsVisible).map(r => {
              const href = `/app/${r.app_id}?run=${r.id}`;
              const isImage = !!r.asset_url;
              let preview = null;
              if (isImage) {
                preview = (
                  <Image src={r.asset_url} alt={r.id} fill sizes="33vw" style={{ objectFit: 'cover' }} />
                );
              } else {
                // Custom summary for non-image outputs
                const out = (typeof r.outputs === 'object') ? r.outputs : {};
                if (out?.kind === 'flappy') {
                  preview = (
                    <div style={{
                      background: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 22,
                      textShadow: '0 2px 6px rgba(0,0,0,0.45)'
                    }}>
                      Score: {out.score ?? 0}
                    </div>
                  );
                } else if (out?.kind === 'wordle') {
                  const guesses = out.guesses || [];
                  const length = (guesses[0]?.word || out.target || '').length || 5;
                  const color = (p) => p==='g' ? '#16a34a' : p==='y' ? '#ca8a04' : '#374151';
                  preview = (
                    <div style={{
                      background: '#111',
                      color: '#fff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${length}, 16px)`, gap: 3 }}>
                        {Array.from({ length: 6 }).map((_, row) => (
                          <div key={row} style={{ display: 'contents' }}>
                            {Array.from({ length }).map((__, col) => {
                              const p = guesses[row]?.pattern?.[col] || null;
                              return <div key={col} style={{
                                width: 16, height: 16, borderRadius: 3,
                                background: p ? color(p) : 'rgba(255,255,255,0.12)'
                              }} />;
                            })}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>
                        {out.result === 'win' ? '✅' : '❌'} {guesses.length}/6
                      </div>
                    </div>
                  );
                } else if (out?.kind === 'chat') {
                  const msgs = out.messages || [];
                  const lastTwo = msgs.slice(-2).map(m => (m.role === 'user' ? 'You: ' : 'Agent: ') + String(m.content||'')).join('\\n');
                  preview = (
                    <div style={{
                      padding: 8,
                      fontSize: 11,
                      color: '#fff',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'pre-wrap',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      {lastTwo.slice(0, 140)}
                    </div>
                  );
                } else {
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
              }
              return (
                <div
                  key={r.id}
                  style={{
                    aspectRatio: '1',
                    position: 'relative'
                  }}
                >
                  <a
                    href={href}
                    style={{
                      aspectRatio: '1',
                      background: '#111',
                      borderRadius: 6,
                      overflow: 'hidden',
                      position: 'relative',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    {preview}
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Frontend-only deletion
                      setAssets(prev => prev.filter(asset => asset.id !== r.id));
                    }}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: 4,
                      color: 'white',
                      padding: '4px 8px',
                      fontSize: 11,
                      cursor: 'pointer',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove from library"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            </div>
            {assetsVisible < assets.length && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={() => setAssetsVisible(prev => prev + 9)}
                  className="btn"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Show more ({assets.length - assetsVisible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
