'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import VideoPreview from './VideoPreview';
import AppForm from './AppForm';
import AppOutput from './AppOutput';

function uid() { return (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'u_jamie'; }

async function api(path, method='GET', body) {
  const res = await fetch(path, {
    method, headers: { 'Content-Type':'application/json', 'x-user-id': uid() },
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

export default function TikTokFeedCard({ app }) {
  const [showTry, setShowTry] = useState(false);
  const [showUse, setShowUse] = useState(false);
  const [run, setRun] = useState(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [providers, setProviders] = useState({ openai: 'unknown' });

  useEffect(() => {
    (async () => setProviders((await api('/api/secrets')).providers))();
    (async () => {
      const lib = await api('/api/library', 'GET');
      setSaved(!!lib.items.find(x => x.id === app.id));
    })();
  }, [app.id]);

  const onRun = async (inputs, mode='try') => {
    const r = await api('/api/runs', 'POST', { appId: app.id, inputs, mode });
    setRun(r);
  };

  const save = async (add=true) => {
    await api('/api/library', 'POST', { action: add?'add':'remove', appId: app.id });
    setSaved(add);
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
      {/* Video Preview */}
      <VideoPreview app={app} autoplay={true} />

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
        <Link href={`/profile/${app.creatorId}`} style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid white',
          cursor: 'pointer'
        }}>
          <img
            src={app?.creator?.avatar || '/avatars/1.svg'}
            alt={app?.creator?.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Link>

        {/* Like Button */}
        <button
          onClick={() => setLiked(!liked)}
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
            {liked ? '❤️' : '🤍'}
          </div>
          <div style={{ fontSize: 12, color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            Like
          </div>
        </button>

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
            {saved ? '📥' : '🔖'}
          </div>
          <div style={{ fontSize: 12, color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            Save
          </div>
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: app.name, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
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
        <Link href={`/profile/${app.creatorId}`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          textDecoration: 'none',
          color: 'white'
        }}>
          <div style={{ fontSize: 14, fontWeight: 'bold' }}>@{app?.creator?.name || app.creatorId}</div>
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
            onClick={() => setShowUse(true)}
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
            Use
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
    </div>
  );
}
