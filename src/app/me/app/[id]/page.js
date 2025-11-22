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
  const [userState, setUserState] = useState(null);
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
        const homeRes = await fetch(`/api/app-home?appId=${encodeURIComponent(appId)}`, { cache: 'no-store' });
        const homeData = await homeRes.json();
        if (!homeRes.ok) {
          console.error('[Personal App] app-home error:', homeData.error);
        } else {
          setApp(homeData.app || null);
          setUserState(homeData.userState || null);
          setRuns(homeData.runs || []);
          try {
            fetch('/api/app-home/seen', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appId })
            }).catch(() => {});
          } catch {
            // ignore
          }
        }

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

  if (!app) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <Link href="/home" className="btn ghost" style={{ marginBottom: 16, display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <p style={{ color: '#888' }}>App not found.</p>
      </div>
    );
  }

  const hasRuns = (runs && runs.length > 0) || !!userState?.last_run_id;
  const lastOutputs =
    userState?.state?.outputs ||
    userState?.state ||
    runs?.[0]?.outputs ||
    null;
  const lastInputs =
    userState?.inputs ||
    runs?.[0]?.inputs ||
    app?.demo?.sampleInputs ||
    {};

  const lastUpdate = userState?.last_update_at ? new Date(userState.last_update_at) : null;
  const lastOpened = userState?.last_opened_at ? new Date(userState.last_opened_at) : null;
  const hasNewUpdate = lastUpdate && (!lastOpened || lastUpdate > lastOpened);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px', paddingBottom: '100px' }}>
      <Link href="/home" className="btn ghost" style={{ marginBottom: 16, display: 'inline-block' }}>
        ← Back to Home
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>
          {app?.icon && <span style={{ marginRight: 8 }}>{app.icon}</span>}
          {app?.name || 'App'}
        </h1>
        <p style={{ marginTop: 8, color: '#888' }}>
          {app?.description || 'Your personal app view.'}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          {hasRuns ? (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>You’ve used this app before</span>
          ) : (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>First time with this app</span>
          )}
          {hasNewUpdate && (
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#22c55e',
                color: '#000',
                fontWeight: 600
              }}
            >
              Updated since last visit
            </span>
          )}
        </div>
      </div>

      {/* Repeat vs new user */}
      {hasRuns ? (
        <>
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Last result</h3>
            {lastOutputs ? (
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  background: '#111827',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #1f2937'
                }}
              >
                {lastOutputs.image || lastOutputs.asset_url ? (
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid #1f2937',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={lastOutputs.image || lastOutputs.asset_url}
                      alt="Last result"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 8 }}>
                    {typeof lastOutputs.text === 'string'
                      ? lastOutputs.text
                      : 'This is your last run. You can tweak it or try again with new inputs.'}
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => {
                      const el = document.getElementById('personal-try');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    ▶️ Try again
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#111827',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #1f2937',
                  fontSize: 13,
                  color: '#9ca3af'
                }}
              >
                We’ll show your last result here after you run the app.
              </div>
            )}
          </div>

          <div id="personal-try" style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Quick run (prefilled)</h3>
            <TikTokFeedCard app={app} presetDefaults={lastInputs} />
          </div>

          <div>
            <h3 style={{ marginBottom: 12 }}>Previous results</h3>
            {runs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No runs yet</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {runs.map((r) => (
                  <div
                    key={r.id}
                    style={{ background: '#111', borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                  >
                    {r.asset_url ? (
                      <img
                        src={r.asset_url}
                        alt={r.id}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1' }}
                      />
                    ) : (
                      <div style={{ padding: 12, fontSize: 12, color: '#aaa' }}>No image output</div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        right: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 6
                      }}
                    >
                      <a
                        className="btn"
                        style={{ fontSize: 12, padding: '6px 10px' }}
                        href={`/app/${appId}?run=${r.id}`}
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              marginBottom: 28,
              background: '#111827',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #1f2937'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>Your first run</h3>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: 13 }}>
              We’ll walk you through a quick first run. You can tweak inputs as you go, and your results will be saved
              here for next time.
            </p>
          </div>
          <div id="personal-try" style={{ marginBottom: 32 }}>
            <TikTokFeedCard app={app} presetDefaults={lastInputs} />
          </div>
        </>
      )}

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
