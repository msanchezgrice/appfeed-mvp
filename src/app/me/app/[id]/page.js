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
    </div>
  );
}


