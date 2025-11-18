'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import VideoPreview from './VideoPreview';
import AppForm from './AppForm';
import AppOutput from './AppOutput';
import SignInModal from './SignInModal';
import SuccessModal from './SuccessModal';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { analytics } from '@/src/lib/analytics';

// Dynamically import to avoid SSR issues
const AdvancedRemixEditor = dynamic(() => import('./AdvancedRemixEditor'), { ssr: false });

async function api(path, method='GET', body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type':'application/json' },
    credentials: 'include', // Use Clerk session
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

export default function TikTokFeedCard({ app, presetDefaults }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasLoggedImpression, setHasLoggedImpression] = useState(false);
  const [showTry, setShowTry] = useState(false);
  const [showUse, setShowUse] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [remixTab, setRemixTab] = useState('quick'); // 'quick' or 'advanced'
  const [remixPrompt, setRemixPrompt] = useState('');
  const [remixing, setRemixing] = useState(false);
  
  // Advanced editor state (JSON) - full app manifest
  const [advancedJSON, setAdvancedJSON] = useState('');
  const [run, setRun] = useState(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [providers, setProviders] = useState({ openai: 'unknown' });
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInAction, setSignInAction] = useState('');
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resultSaved, setResultSaved] = useState(false);

  // Ensure Try/Use modals can open even if a previous ?run= is in the URL
  const openTry = () => {
    try {
      if (typeof window !== 'undefined' && searchParams.get('run')) {
        router.replace(window.location.pathname);
      }
    } catch {}
    setShowTry(true);
    // Track app tried event
    analytics.appTried(app.id, app.name, 'feed');
  };
  const openUse = () => {
    try {
      if (typeof window !== 'undefined' && searchParams.get('run')) {
        router.replace(window.location.pathname);
      }
    } catch {}
    setShowUse(true);
  };

  useEffect(() => {
    (async () => {
      const secrets = await api('/api/secrets');
      if (secrets?.providers) {
        setProviders(secrets.providers);
      }
    })();
    (async () => {
      const lib = await api('/api/library', 'GET');
      if (lib?.items && Array.isArray(lib.items)) {
        setSaved(!!lib.items.find(x => x.id === app.id));
      }
    })();
  }, [app.id]);

  // Log a feed impression once per session when at least 50% visible
  useEffect(() => {
    try {
      const key = `viewed_feed_card:${app.id}`;
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key) === '1') {
        setHasLoggedImpression(true);
        return;
      }
      const rootEl = document.getElementById(`card-${app.id}`) || null;
      if (!rootEl) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasLoggedImpression) {
            fetch(`/api/apps/${app.id}/view?src=feed`, { method: 'POST', keepalive: true }).catch(() => {});
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, '1');
            setHasLoggedImpression(true);
            // Track app viewed in PostHog
            analytics.appViewed(app.id, app.name, app.creator_id, 'feed');
            observer.disconnect();
          }
        });
      }, { threshold: [0.5] });
      observer.observe(rootEl);
      return () => observer.disconnect();
    } catch {
      // ignore
    }
  }, [app.id, hasLoggedImpression]);

  const onRun = async (inputs, mode='try') => {
    const r = await api('/api/runs', 'POST', { appId: app.id, inputs, mode });
    setRun(r);
    setResultSaved(false);
    try {
      if (typeof window !== 'undefined' && r?.id) {
        // Always open the full-screen result overlay via URL, on all screen sizes.
        // The Try/Use modal remains open behind it; closing overlay returns to inputs.
        const basePath = window.location.pathname;
        const nextUrl = `${basePath}?run=${encodeURIComponent(r.id)}`;
        router.push(nextUrl);
      }
    } catch {}
  };

  // Clear run state when ?run= is removed from URL
  useEffect(() => {
    if (!searchParams.get('run')) {
      setRun(null);
      setResultSaved(false);
    }
  }, [searchParams]);

  const save = async (add=true) => {
    if (!user) {
      setSignInAction('save apps to your library');
      setShowSignInModal(true);
      return;
    }
    await api('/api/library', 'POST', { action: add?'add':'remove', appId: app.id });
    setSaved(add);
    // Track app saved event
    if (add) {
      analytics.appSaved(app.id, app.name);
    }
  };

  const handleRemix = async () => {
    if (!user) {
      setSignInAction('remix apps and build your own versions');
      setShowSignInModal(true);
      return;
    }
    
    if (!remixPrompt.trim()) {
      alert('Please enter a description of how you want to remix this app');
      return;
    }

    setRemixing(true);

    try {
      const response = await fetch('/api/apps/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appId: app.id,
          remixPrompt: remixPrompt.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remix app');
      }

      setShowRemix(false);
      setRemixPrompt('');
      setSuccessMessage('Your remixed app is ready! Check your profile to see it.');
      setShowSuccessModal(true);
    } catch (error) {
      alert('Error remixing app: ' + error.message);
    } finally {
      setRemixing(false);
    }
  };
  
  // Handle save from Advanced JSON Editor
  const handleSaveRemix = async () => {
    if (!user) {
      alert('Please sign in to create a remix');
      return;
    }
    
    try {
      // Parse the JSON
      const remixData = JSON.parse(advancedJSON);
      console.log('[Remix] Saving JSON remix:', remixData);
      
      // Send directly to remix API with the parsed JSON
      setRemixing(true);
      
      const response = await fetch('/api/apps/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appId: app.id,
          remixData: remixData, // Send parsed JSON directly!
          remixPrompt: `Advanced edit: ${remixData.name || 'Updated'}`
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remix app');
      }

      setShowRemix(false);
      setSuccessMessage('Your remixed app is ready! Check your profile to see it.');
      setShowSuccessModal(true);
    } catch (error) {
      alert('Error with JSON: ' + error.message);
    } finally {
      setRemixing(false);
    }
  };

  return (
    <div id={`card-${app.id}`} style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 140px)',
      maxHeight: 800,
      background: '#000',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16
    }}>
      {/* Video Preview - Clickable to open Try modal */}
      <VideoPreview app={app} autoplay={true} onClick={openTry} />

      {/* Right-side Action Buttons (TikTok style) */}
      <div style={{
        position: 'absolute',
        right: 12,
        bottom: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        zIndex: 10
      }}>
        {/* Creator Avatar */}
        <Link href={`/profile/${app.creator?.id || app.creator_id}`} style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid white',
          cursor: 'pointer'
        }}>
          <img
            src={app?.creator?.avatar_url || '/avatars/1.svg'}
            alt={app?.creator?.display_name || app?.creator?.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Link>

        {/* Like Button */}
        {/* Save Button */}
        <button
          onClick={() => save(!saved)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4
          }}
        >
          <div style={{
            fontSize: 32,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}>
            {saved ? '✅' : '🔖'}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: 'white', 
            fontWeight: 'bold', 
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            background: saved ? 'rgba(16, 185, 129, 0.9)' : 'transparent',
            padding: saved ? '2px 8px' : '0',
            borderRadius: saved ? '10px' : '0',
            transition: 'all 0.2s'
          }}>
            {saved ? 'Saved' : 'Save'}
          </div>
        </button>

        {/* Share Button */}
        <button
          onClick={async () => {
            const appUrl = `${window.location.origin}/app/${app.id}${run?.id ? `?run=${run.id}` : ''}`;
            
            // Track share event
            analytics.appShared(app.id, app.name, navigator.share ? 'native_share' : 'copy_link');
            
            // For native share (mobile), include title and description
            if (navigator.share) {
              const cleanDescription = app.description?.split('\n\nRemixed with:')[0] || app.description;
              try {
                // Prefer sharing with image file if available and supported
                if (run?.asset_url) {
                  const res = await fetch(run.asset_url);
                  const blob = await res.blob();
                  const file = new File([blob], `${app.id}-${run.id}.jpg`, { type: blob.type || 'image/jpeg' });
                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                      title: app.name,
                      text: cleanDescription,
                      url: appUrl,
                      files: [file]
                    });
                    return;
                  }
                }
                await navigator.share({ 
                  title: app.name, 
                  text: cleanDescription + (run?.asset_url ? `\n${run.asset_url}` : ''),
                  url: appUrl 
                });
              } catch (err) {
                if (err.name !== 'AbortError') {
                  console.error('Share failed:', err);
                }
              }
            } else {
              // For clipboard (desktop), only copy URL
              const toCopy = run?.asset_url ? `${appUrl}\n${run.asset_url}` : appUrl;
              navigator.clipboard.writeText(toCopy);
              alert('App link copied to clipboard!');
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4
          }}
        >
          <div style={{
            fontSize: 32,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}>
            🔗
          </div>
          <div style={{ fontSize: 12, color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {run?.id ? 'Share' : 'Share app'}
          </div>
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 80,
        padding: 16,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        color: 'white',
        zIndex: 5
      }}>
        <Link href={`/profile/${app.creator?.id || app.creator_id}`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          textDecoration: 'none',
          color: 'white'
        }}>
          <div style={{ fontSize: 14, fontWeight: 'bold' }}>@{app?.creator?.username || app?.creator?.display_name || 'user'}</div>
        </Link>

        <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 'bold' }}>
          {app.name}
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: 14, opacity: 0.9 }}>
          {app.description}
        </p>

        {/* Hashtags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {app.tags?.map(tag => (
            <Link
              key={tag}
              href={`/search?tag=${tag}`}
              style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              #{tag}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={openTry}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: 20,
              fontWeight: 'bold',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Try
          </button>
          <button
            onClick={() => setShowRemix(true)}
            style={{
              padding: '8px 16px',
              background: '#fe2c55',
              color: 'white',
              border: 'none',
              borderRadius: 20,
              fontWeight: 'bold',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Remix
          </button>
        </div>
      </div>

      {/* Try Modal */}
      {showTry && (
        <div className="modal" onClick={() => setShowTry(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <b>Try: {app.name}</b>
              <button className="btn ghost" onClick={() => setShowTry(false)}>Close</button>
            </div>
            <p className="small">Runs in a read-only sandbox with sample inputs.</p>
            <AppForm app={app} onSubmit={(vals) => onRun(vals, 'try')} defaults={presetDefaults || app.demo?.sampleInputs||{}} />
            {run && !searchParams.get('run') && (
              <>
                <hr />
                <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
                  <div style={{ filter: (!user && (run?.trace?.[run.trace.length-1]?.output?.image)) ? 'blur(8px)' : 'none', transition: 'filter 0.2s' }}>
                    <AppOutput run={run} app={app} />
                  </div>
                  {!user && (run?.trace?.[run.trace.length-1]?.output?.image) && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.45)',
                      borderRadius: 12
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Create a free account to reveal and save</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            className="btn primary"
                            onClick={() => {
                              setSignInAction('save this result to your Home');
                              setShowSignInModal(true);
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="btn"
                            onClick={async () => {
                              const appUrl = `${window.location.origin}/app/${app.id}?run=${run.id}`;
                              if (navigator.share) {
                                const cleanDescription = app.description?.split('\\n\\nRemixed with:')[0] || app.description;
                                try {
                                  if (run?.asset_url) {
                                    const res = await fetch(run.asset_url);
                                    const blob = await res.blob();
                                    const file = new File([blob], `${app.id}-${run.id}.jpg`, { type: blob.type || 'image/jpeg' });
                                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                      await navigator.share({ title: app.name, text: cleanDescription, url: appUrl, files: [file] });
                                      return;
                                    }
                                  }
                                  await navigator.share({ title: app.name, text: cleanDescription + (run?.asset_url ? `\\n${run.asset_url}` : ''), url: appUrl });
                                } catch (err) {
                                  if (err.name !== 'AbortError') console.error('Share failed:', err);
                                }
                              } else {
                                const toCopy = run?.asset_url ? `${appUrl}\\n${run.asset_url}` : appUrl;
                                navigator.clipboard.writeText(toCopy);
                                alert('Link copied to clipboard!');
                              }
                            }}
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {run && !searchParams.get('run') && (
              <div className="row result-actions" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={async () => {
                    if (!user) {
                      setSignInAction('save this result to your Library');
                      setShowSignInModal(true);
                      return;
                    }
                    try {
                      const res = await fetch('/api/assets', {
                        method: 'POST',
                        headers: { 'Content-Type':'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ action: 'save', runId: run.id })
                      });
                      if (res.ok) setResultSaved(true);
                    } catch {}
                  }}
                  disabled={resultSaved}
                >
                  {resultSaved ? 'Saved' : 'Save Result'}
                </button>
                <button
                  className="btn"
                  onClick={async () => {
                    const appUrl = `${window.location.origin}/app/${app.id}?run=${run.id}`;
                    if (navigator.share) {
                      const cleanDescription = app.description?.split('\n\nRemixed with:')[0] || app.description;
                      try {
                        if (run?.asset_url) {
                          const res = await fetch(run.asset_url);
                          const blob = await res.blob();
                          const file = new File([blob], `${app.id}-${run.id}.jpg`, { type: blob.type || 'image/jpeg' });
                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              title: app.name,
                              text: cleanDescription,
                              url: appUrl,
                              files: [file]
                            });
                            return;
                          }
                        }
                        await navigator.share({
                          title: app.name,
                          text: cleanDescription + (run?.asset_url ? `\n${run.asset_url}` : ''),
                          url: appUrl
                        });
                      } catch (err) {
                        if (err.name !== 'AbortError') {
                          console.error('Share failed:', err);
                        }
                      }
                    } else {
                      const toCopy = run?.asset_url ? `${appUrl}\n${run.asset_url}` : appUrl;
                      navigator.clipboard.writeText(toCopy);
                      alert('Link copied to clipboard!');
                    }
                  }}
                >
                  Share
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Use Modal */}
      {showUse && (
        <div className="modal" onClick={() => setShowUse(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <b>Use: {app.name}</b>
              <button className="btn ghost" onClick={() => setShowUse(false)}>Close</button>
            </div>
            {providers.openai === 'missing' && app.runtime?.steps?.some(s => s.tool.startsWith('llm.')) ? (
              <div className="card" style={{margin:'8px 0 12px 0'}}>
                <div className="row" style={{justifyContent:'space-between'}}>
                  <div><b>OpenAI key required</b><div className="small">Add on <a href="/secrets">/secrets</a></div></div>
                  <a className="btn" href="/secrets">Open Secrets</a>
                </div>
              </div>
            ) : null}
            <AppForm app={app} onSubmit={(vals) => onRun(vals, 'use')} defaults={presetDefaults || app.demo?.sampleInputs||{}} />
            {run && !searchParams.get('run') && (
              <>
                <hr />
                <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
                  <div style={{ filter: (!user && (run?.trace?.[run.trace.length-1]?.output?.image)) ? 'blur(8px)' : 'none', transition: 'filter 0.2s' }}>
                    <AppOutput run={run} app={app} />
                  </div>
                  {!user && (run?.trace?.[run.trace.length-1]?.output?.image) && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.45)',
                      borderRadius: 12
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Create a free account to reveal and save</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            className="btn primary"
                            onClick={() => {
                              setSignInAction('save this result to your Home');
                              setShowSignInModal(true);
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="btn"
                            onClick={async () => {
                              const appUrl = `${window.location.origin}/app/${app.id}?run=${run.id}`;
                              if (navigator.share) {
                                const cleanDescription = app.description?.split('\\n\\nRemixed with:')[0] || app.description;
                                try {
                                  if (run?.asset_url) {
                                    const res = await fetch(run.asset_url);
                                    const blob = await res.blob();
                                    const file = new File([blob], `${app.id}-${run.id}.jpg`, { type: blob.type || 'image/jpeg' });
                                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                      await navigator.share({ title: app.name, text: cleanDescription, url: appUrl, files: [file] });
                                      return;
                                    }
                                  }
                                  await navigator.share({ title: app.name, text: cleanDescription + (run?.asset_url ? `\\n${run.asset_url}` : ''), url: appUrl });
                                } catch (err) {
                                  if (err.name !== 'AbortError') console.error('Share failed:', err);
                                }
                              } else {
                                const toCopy = run?.asset_url ? `${appUrl}\\n${run.asset_url}` : appUrl;
                                navigator.clipboard.writeText(toCopy);
                                alert('Link copied to clipboard!');
                              }
                            }}
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {run && !searchParams.get('run') && (
              <div className="row result-actions" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={async () => {
                    if (!user) {
                      setSignInAction('save this result to your Library');
                      setShowSignInModal(true);
                      return;
                    }
                    try {
                      const res = await fetch('/api/assets', {
                        method: 'POST',
                        headers: { 'Content-Type':'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ action: 'save', runId: run.id })
                      });
                      if (res.ok) setResultSaved(true);
                    } catch {}
                  }}
                  disabled={resultSaved}
                >
                  {resultSaved ? 'Saved' : 'Save Result'}
                </button>
                <button
                  className="btn"
                  onClick={async () => {
                    const appUrl = `${window.location.origin}/app/${app.id}?run=${run.id}`;
                    if (navigator.share) {
                      const cleanDescription = app.description?.split('\n\nRemixed with:')[0] || app.description;
                      try {
                        if (run?.asset_url) {
                          const res = await fetch(run.asset_url);
                          const blob = await res.blob();
                          const file = new File([blob], `${app.id}-${run.id}.jpg`, { type: blob.type || 'image/jpeg' });
                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              title: app.name,
                              text: cleanDescription,
                              url: appUrl,
                              files: [file]
                            });
                            return;
                          }
                        }
                        await navigator.share({
                          title: app.name,
                          text: cleanDescription + (run?.asset_url ? `\n${run.asset_url}` : ''),
                          url: appUrl
                        });
                      } catch (err) {
                        if (err.name !== 'AbortError') {
                          console.error('Share failed:', err);
                        }
                      }
                    } else {
                      const toCopy = run?.asset_url ? `${appUrl}\n${run.asset_url}` : appUrl;
                      navigator.clipboard.writeText(toCopy);
                      alert('Link copied to clipboard!');
                    }
                  }}
                >
                  Share
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remix Modal with Tabs */}
      {showRemix && (
        <div className="modal" onClick={() => setShowRemix(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            {/* Header */}
            <div className="row" style={{justifyContent:'space-between', alignItems: 'center', marginBottom: 16}}>
              <b>Remix: {app.name}</b>
              <button className="btn ghost" onClick={() => setShowRemix(false)}>Close</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #333' }}>
              <button
                onClick={() => setRemixTab('quick')}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: remixTab === 'quick' ? '3px solid var(--brand)' : '3px solid transparent',
                  color: remixTab === 'quick' ? 'white' : '#888',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: '-2px'
                }}
              >
                💬 Quick Remix
              </button>
              <button
                onClick={() => {
                  setRemixTab('advanced');
                  // Initialize advanced state
                  if (!editedName) {
                    setEditedName(app.name);
                    setEditedDescription(app.description || '');
                    setEditedTags(app.tags || []);
                    setContainerColor(app.design?.containerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
                    setFontColor(app.design?.fontColor || 'white');
                    setFontFamily(app.design?.fontFamily || 'inherit');
                  }
                }}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: remixTab === 'advanced' ? '3px solid var(--brand)' : '3px solid transparent',
                  color: remixTab === 'advanced' ? 'white' : '#888',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: '-2px'
                }}
              >
                ⚙️ Advanced Editor
              </button>
            </div>

            {/* Quick Tab Content */}
            {remixTab === 'quick' && (
              <div>
                <p className="small" style={{marginBottom: 16, color: '#888'}}>
                  Describe how you want to modify this app. AI will remix it for you.
                </p>

                <textarea
                  className="input"
                  placeholder="E.g., 'Make it pink' or 'Add neon style' or 'Change to dark theme'"
                  value={remixPrompt}
                  onChange={(e) => setRemixPrompt(e.target.value)}
                  rows={4}
                  style={{
                    marginBottom: 16,
                    width: '100%',
                    padding: 12,
                    fontSize: 14,
                    borderRadius: 8
                  }}
                />

                <button
                  onClick={handleRemix}
                  className="btn primary"
                  disabled={remixing}
                  style={{ width: '100%' }}
                >
                  {remixing ? 'Remixing...' : '✨ AI Remix →'}
                </button>
              </div>
            )}

            {/* Advanced Tab Content - JSON Editor */}
            {remixTab === 'advanced' && (
              <div>
                <p className="small" style={{marginBottom: 16, color: '#888'}}>
                  Edit the full app manifest JSON. You can modify inputs, outputs, runtime steps, design, themes, and more.
                </p>
                
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>✅ Editable Variables:</div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#888', columns: 2 }}>
                    <li>name, description, icon, tags</li>
                    <li>inputs (form fields)</li>
                    <li>outputs (what app produces)</li>
                    <li>runtime.steps (tool calls)</li>
                    <li>design.* (container, fonts, colors)</li>
                    <li>modal_theme.* (try modal styling)</li>
                    <li>input_theme.* (input styling)</li>
                    <li>preview_gradient</li>
                    <li>demo.sampleInputs</li>
                  </ul>
                </div>

                <textarea
                  className="input"
                  value={advancedJSON || JSON.stringify({
                    name: app.name,
                    description: app.description,
                    icon: app.icon || '🎨',
                    tags: app.tags || [],
                    inputs: app.inputs || {},
                    outputs: app.outputs || {},
                    runtime: app.runtime || { engine: 'local', steps: [] },
                    design: app.design || {
                      containerColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontColor: 'white',
                      fontFamily: 'inherit',
                      inputLayout: 'vertical'
                    },
                    modal_theme: app.modal_theme || {},
                    input_theme: app.input_theme || {},
                    preview_gradient: app.preview_gradient || '',
                    demo: app.demo || { sampleInputs: {} }
                  }, null, 2)}
                  onChange={(e) => setAdvancedJSON(e.target.value)}
                  rows={20}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 12,
                    borderRadius: 8,
                    fontFamily: 'monospace',
                    marginBottom: 16,
                    background: '#1a1a1a',
                    color: '#f0f0f0'
                  }}
                  placeholder="Edit JSON..."
                />

                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>🔒 Locked (Cannot Change):</div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#888' }}>
                    <li>Container size (padding, border radius)</li>
                    <li>Runtime logic (steps, tools)</li>
                    <li>Core functionality</li>
                  </ul>
                </div>

                <button
                  onClick={handleSaveRemix}
                  className="btn primary"
                  disabled={remixing}
                  style={{ width: '100%' }}
                >
                  {remixing ? 'Saving...' : '💾 Save JSON Remix'}
                </button>
                <p className="small" style={{ marginTop: 8, color: '#888', textAlign: 'center' }}>
                  JSON will be used directly (no AI parsing)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Play Overlay - Full-screen result display */}
      {searchParams.get('run') && run?.id === searchParams.get('run') && (
        <div className="modal" onClick={() => router.replace(window.location.pathname)} style={{ zIndex: 9999 }}>
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
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                paddingTop: 'calc(12px + env(safe-area-inset-top))',
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'var(--panel)',
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <b>Play: {app.name}</b>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn"
                    disabled={resultSaved}
                    onClick={async () => {
                      if (!user) {
                        setSignInAction('save this result to your Library');
                        setShowSignInModal(true);
                        return;
                      }
                      try {
                        const res = await fetch('/api/assets', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ action: 'save', runId: run.id })
                        });
                        if (res.ok) setResultSaved(true);
                      } catch {}
                    }}
                  >
                    {resultSaved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      const appUrl = `${window.location.origin}/app/${app.id}?run=${run.id}`;
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
              <button className="btn ghost" onClick={() => router.replace(window.location.pathname)}>
                ✕
              </button>
            </div>

            {/* Result Content with max-width on desktop */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px',
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div style={{ width: '100%', maxWidth: '800px' }}>
                <AppOutput run={run} app={app} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      <SignInModal
        show={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        message={`Sign in to ${signInAction}`}
        action={signInAction}
      />
      
      {showAdvancedEditor && (
        <AdvancedRemixEditor
          app={app}
          onSave={handleSaveRemix}
          onCancel={() => setShowAdvancedEditor(false)}
        />
      )}
      
      <SuccessModal
        show={showSuccessModal}
        title="🎉 Remix Created!"
        message={successMessage}
        actionText="View on Profile"
        onAction={() => window.location.href = '/profile'}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
