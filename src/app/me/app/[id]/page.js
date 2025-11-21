'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

export default function PersonalAppView() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const appId = params.id;

  const [app, setApp] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(`/me/app/${appId}`));
      return;
    }
    (async () => {
      try {
        const appRes = await fetch(`/api/apps/${appId}`, { cache: 'no-store' });
        const appData = await appRes.json();
        setApp(appData.app || appData);
        const runsRes = await fetch(`/api/runs?appId=${encodeURIComponent(appId)}`, { cache: 'no-store' });
        const runsData = await runsRes.json();
        setRuns(runsData.runs || []);
        // Load marketing assets
        try {
          setAssetsLoading(true);
          const assetsRes = await fetch(`/api/asset-jobs?appId=${encodeURIComponent(appId)}`, { cache: 'no-store' });
          const assetsData = await assetsRes.json();
          if (assetsRes.ok) {
            setAssets(assetsData.assets || []);
            setAssetsError('');
          } else {
            setAssetsError(assetsData.error || 'Failed to load assets');
          }
        } catch (err) {
          setAssetsError(err?.message || 'Failed to load assets');
        } finally {
          setAssetsLoading(false);
        }
      } catch (e) {
        console.error('[Personal App] Load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, appId, router]);

  if (!isLoaded || loading) {
    return <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>Loading...</div>;
  }

  const lastRun = runs[0];
  const presetDefaults = lastRun?.inputs || app?.demo?.sampleInputs || {};

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px', paddingBottom: '100px' }}>
      <Link href="/home" className="btn ghost" style={{ marginBottom: 16, display: 'inline-block' }}>← Back to Home</Link>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{app?.name || 'App'}</h1>
        <p style={{ marginTop: 8, color: '#888' }}>Your personal view: last used settings and previous results</p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 12 }}>Quick Run (last preset)</h3>
        {app && (
          <TikTokFeedCard app={app} presetDefaults={presetDefaults} />
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: 12 }}>Previous Results</h3>
        {runs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No runs yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {runs.map(r => (
              <div key={r.id} style={{ background: '#111', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                {r.asset_url ? (
                  <img src={r.asset_url} alt={r.id} style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1' }} />
                ) : (
                  <div style={{ padding: 12, fontSize: 12, color: '#aaa' }}>No image output</div>
                )}
                <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <a
                    className="btn"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    href={`/app/${appId}?run=${r.id}`}
                  >
                    Open
                  </a>
                  {r.asset_url && (
                    <button
                      className="btn"
                      style={{ fontSize: 12, padding: '6px 10px' }}
                      onClick={async () => {
                        const appUrl = `${window.location.origin}/app/${appId}?run=${r.id}`;
                        if (navigator.share) {
                          try {
                            const res = await fetch(r.asset_url);
                            const blob = await res.blob();
                            const file = new File([blob], `${appId}-${r.id}.jpg`, { type: blob.type || 'image/jpeg' });
                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                              await navigator.share({ title: app?.name, text: '', url: appUrl, files: [file] });
                              return;
                            }
                            await navigator.share({ title: app?.name, text: r.asset_url, url: appUrl });
                          } catch (err) {
                            if (err.name !== 'AbortError') console.error('Share failed:', err);
                          }
                        } else {
                          navigator.clipboard.writeText(`${appUrl}\n${r.asset_url}`);
                          alert('Link copied');
                        }
                      }}
                    >
                      Share
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 12 }}>Marketing Assets</h3>
        <p className="small" style={{ color: '#888', marginBottom: 12 }}>
          Download your poster, OG, thumb, and demo/GIF assets. Regenerate in Publish → success screen using per-asset prompts.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Link className="btn" href="/publish">Open Publish</Link>
          <Link className="btn ghost" href={`/api/asset-jobs?appId=${encodeURIComponent(appId)}`} target="_blank" rel="noreferrer">Raw JSON</Link>
        </div>
        {assetsLoading && <div className="small" style={{ color: '#888' }}>Loading assets…</div>}
        {assetsError && <div className="small" style={{ color: '#ef4444' }}>{assetsError}</div>}
        {!assetsLoading && assets.length === 0 && <div className="small" style={{ color: '#888' }}>No assets yet. Generate from the publish success screen.</div>}
        {assets.length > 0 && (() => {
          const byKind = {};
          if (app?.preview_url) {
            byKind['message'] = {
              id: 'message-image',
              kind: 'message',
              mime_type: 'image/*',
              url: app.preview_url,
              blur_data_url: app.preview_blur || null
            };
          }
          assets.forEach((a) => {
            const key = a.kind || 'asset';
            if (!byKind[key]) byKind[key] = a;
          });
          const assetsToShow = Object.values(byKind);
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {assetsToShow.map((asset) => {
                const isImage = (asset.mime_type || '').startsWith('image/') || asset.kind === 'message';
                const label = asset.kind === 'poster'
                  ? 'Poster'
                  : asset.kind === 'og'
                  ? 'OG'
                  : asset.kind === 'thumb'
                  ? 'Thumb'
                  : asset.kind === 'message'
                  ? 'Message preview'
                  : asset.kind.toUpperCase();
                return (
                  <div
                    key={asset.id}
                    className="card"
                    style={{ padding: 12, textDecoration: 'none' }}
                  >
                    <div style={{ fontWeight: 700, textTransform: 'capitalize', marginBottom: 6 }}>{label}</div>
                    {isImage && (
                      <div
                        style={{
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: '1px solid #1f2937',
                          marginBottom: 8,
                          background: '#020617',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={asset.url}
                          alt={label}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            aspectRatio: asset.kind === 'thumb' ? '1 / 1' : '4 / 5',
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
                          <a className="btn" style={{ padding: '6px 10px', fontSize: 12 }} href={asset.url} download>
                            Download
                          </a>
                          <a className="btn ghost" style={{ padding: '6px 10px', fontSize: 12 }} href={asset.url} target="_blank" rel="noopener noreferrer">
                            Open
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="small" style={{ color: '#9ca3af', marginTop: 4 }}>
                      {asset.mime_type || 'asset'}
                    </div>
                    <div className="small" style={{ color: '#6b7280', marginTop: 6, wordBreak: 'break-all' }}>
                      {asset.url}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
