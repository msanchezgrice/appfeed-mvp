'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import VideoPreview from './VideoPreview';
import AppForm from './AppForm';
import AppOutput from './AppOutput';
import SignInModal from './SignInModal';
import dynamic from 'next/dynamic';

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

export default function TikTokFeedCard({ app }) {
  const { user, isLoaded } = useUser();
  const [showTry, setShowTry] = useState(false);
  const [showUse, setShowUse] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [remixTab, setRemixTab] = useState('quick'); // 'quick' or 'advanced'
  const [remixPrompt, setRemixPrompt] = useState('');
  const [remixing, setRemixing] = useState(false);
  
  // Advanced editor state
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState([]);
  const [containerColor, setContainerColor] = useState('');
  const [fontColor, setFontColor] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [run, setRun] = useState(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [providers, setProviders] = useState({ openai: 'unknown' });
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInAction, setSignInAction] = useState('');
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);

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

  const onRun = async (inputs, mode='try') => {
    const r = await api('/api/runs', 'POST', { appId: app.id, inputs, mode });
    setRun(r);
  };

  const save = async (add=true) => {
    if (!user) {
      setSignInAction('save apps to your library');
      setShowSignInModal(true);
      return;
    }
    await api('/api/library', 'POST', { action: add?'add':'remove', appId: app.id });
    setSaved(add);
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

      alert('App remixed successfully! Check your profile to see it.');
      setShowRemix(false);
      setRemixPrompt('');
    } catch (error) {
      alert('Error remixing app: ' + error.message);
    } finally {
      setRemixing(false);
    }
  };

  return (
    <div style={{
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
      <VideoPreview app={app} autoplay={true} onClick={() => setShowTry(true)} />

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
            const appUrl = `${window.location.origin}/app/${app.id}`;
            
            // For native share (mobile), include title and description
            if (navigator.share) {
              const cleanDescription = app.description?.split('\n\nRemixed with:')[0] || app.description;
              try {
                await navigator.share({ 
                  title: app.name, 
                  text: cleanDescription,
                  url: appUrl 
                });
              } catch (err) {
                if (err.name !== 'AbortError') {
                  console.error('Share failed:', err);
                }
              }
            } else {
              // For clipboard (desktop), only copy URL
              navigator.clipboard.writeText(appUrl);
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
            Share
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
            onClick={() => setShowTry(true)}
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
            <AppForm app={app} onSubmit={(vals) => onRun(vals, 'try')} defaults={app.demo?.sampleInputs||{}} />
            {run && <><hr /><AppOutput run={run} app={app} /></>}
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
            <AppForm app={app} onSubmit={(vals) => onRun(vals, 'use')} defaults={app.demo?.sampleInputs||{}} />
            {run && <><hr /><AppOutput run={run} app={app} /></>}
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

            {/* Advanced Tab Content - Inline */}
            {remixTab === 'advanced' && (
              <AdvancedRemixEditor
                app={app}
                onSave={handleSaveRemix}
                onCancel={() => setRemixTab('quick')}
                inline={true}
              />
            )}
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
    </div>
  );
}
