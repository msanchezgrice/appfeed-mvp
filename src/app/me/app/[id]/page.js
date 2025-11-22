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

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(`/me/app/${appId}`));
      return;
    }
    (async () => {
      try {
        // 1) Load app via existing apps endpoint (stable, used by /app/[id])
        const appRes = await fetch(`/api/apps/${encodeURIComponent(appId)}`, { cache: 'no-store' });
        const appData = await appRes.json();
        if (appRes.ok && (appData.app || appData)) {
          setApp(appData.app || appData);
        } else {
          console.error('[Personal App] app load error:', appData.error || appRes.status);
        }

        // 2) Load user-specific state (may fall back to last run on server)
        try {
          const stateRes = await fetch(`/api/user-state?appId=${encodeURIComponent(appId)}`, { cache: 'no-store' });
          const stateData = await stateRes.json();
          if (stateRes.ok) {
            setUserState(stateData.state || null);
          } else {
            console.error('[Personal App] user-state error:', stateData.error || stateRes.status);
          }
        } catch {
          // ignore state errors
        }

        // 3) Load recent runs for this app/user
        try {
          const runsRes = await fetch(`/api/runs?appId=${encodeURIComponent(appId)}`, { cache: 'no-store' });
          const runsData = await runsRes.json();
          if (runsRes.ok) {
            setRuns(runsData.runs || []);
          } else {
          console.error('[Personal App] runs error:', runsData.error || runsRes.status);
        }
      } catch {
        // ignore runs errors
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

  const ftueSummary = app?.ftue_summary || app?.description || 'Your first run will be guided with the defaults below.';
  const ftueBullets = Array.isArray(app?.ftue_bullets)
    ? app.ftue_bullets
    : [
        'Review the suggested inputs below',
        'Tap Start to generate your first result',
        'We’ll save it so you can tweak and rerun quickly'
      ];

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
                  <button
                    className="btn ghost"
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      const el = document.getElementById('personal-try');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      // Force reset by scrolling and relying on TikTokFeedCard defaults
                    }}
                  >
                    Reset to defaults
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
              {ftueSummary}
            </p>
            <ul style={{ margin: '12px 0 0 16px', padding: 0, color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>
              {ftueBullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
          <div id="personal-try" style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Start your first run</h3>
            <TikTokFeedCard app={app} presetDefaults={lastInputs} />
          </div>
        </>
      )}

    </div>
  );
}
