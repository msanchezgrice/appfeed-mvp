'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppForm from './AppForm';
import RunTrace from './RunTrace';
import VideoPreview from './VideoPreview';
import AppOutput from './AppOutput';

function uid() { return (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'u_jamie'; }

async function api(path, method='GET', body) {
  const res = await fetch(path, {
    method, headers: { 'Content-Type':'application/json', 'x-user-id': uid() },
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

export default function FeedCard({ app, mode='feed' }) {
  const [showWatch, setShowWatch] = useState(mode === 'feed');
  const [showTry, setShowTry] = useState(false);
  const [showUse, setShowUse] = useState(false);
  const [run, setRun] = useState(null);
  const [saved, setSaved] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
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
    setResultSaved(false);
  };

  const save = async (add=true) => {
    await api('/api/library', 'POST', { action: add?'add':'remove', appId: app.id });
    setSaved(add);
  };

  const remix = async () => {
    const defaults = app.demo?.sampleInputs || {};
    const name = prompt('Name this remix:', app.name + ' (remix)');
    if (!name) return;
    const resp = await api('/api/remix', 'POST', { appId: app.id, name, defaults });
    if (resp?.variant?.id) window.location.href = `/app/${resp.variant.id}`;
  };

  return (
    <div className="card">
      {showWatch && (
        <VideoPreview app={app} autoplay={mode === 'feed'} />
      )}

      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="row">
          <img src={app?.creator?.avatar||'/avatars/3.svg'} width={28} height={28} style={{borderRadius:8}} />
          <div>
            <div><b>{app.name}</b></div>
            <div className="small">{app.description}</div>
          </div>
        </div>
        <div className="row" style={{gap:8}}>
          {app.tags?.map(t => <span className="badge" key={t}>#{t}</span>)}
        </div>
      </div>
      <hr />
      <div className="row" style={{gap:8, flexWrap: 'wrap'}}>
        <button className="btn ghost" onClick={() => setShowWatch(!showWatch)}>
          {showWatch ? 'Hide Preview' : 'Watch'}
        </button>
        <button className="btn" onClick={() => setShowTry(true)}>Try</button>
        <button className="btn primary" onClick={() => setShowUse(true)}>Use</button>
        <button className="btn ghost" onClick={remix}>Remix</button>
        <Link className="btn ghost" href={`/app/${app.id}`}>Open</Link>
        <button className="btn ghost" onClick={() => save(!saved)}>{saved ? 'Saved ✓' : 'Save'}</button>
      </div>
      {showTry && (
        <div className="modal" onClick={() => setShowTry(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <b>Try: {app.name}</b>
              <button className="btn ghost" onClick={() => setShowTry(false)}>Close</button>
            </div>
            <p className="small">Runs in a read-only sandbox with sample inputs.</p>
            <AppForm app={app} onSubmit={(vals) => onRun(vals, 'try')} defaults={app.demo?.sampleInputs||{}} />
            {run && (
              <>
                <hr />
                <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
                  <AppOutput run={run} app={app} />
                </div>
                <div className="row result-actions" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/assets', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ action: 'save', runId: run?.id })
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
                      const appUrl = `${window.location.origin}/app/${app.id}${run?.id ? `?run=${run.id}` : ''}`;
                      if (navigator.share) {
                        const cleanDescription = app.description?.split('\\n\\nRemixed with:')[0] || app.description;
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
                        navigator.clipboard.writeText(appUrl);
                        alert('Link copied to clipboard!');
                      }
                    }}
                  >
                    Share
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
            {run && (
              <>
                <hr />
                <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
                  <AppOutput run={run} app={app} />
                </div>
                <div className="row result-actions" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/assets', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ action: 'save', runId: run?.id })
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
                      const appUrl = `${window.location.origin}/app/${app.id}${run?.id ? `?run=${run.id}` : ''}`;
                      if (navigator.share) {
                        const cleanDescription = app.description?.split('\\n\\nRemixed with:')[0] || app.description;
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
                        navigator.clipboard.writeText(appUrl);
                        alert('Link copied to clipboard!');
                      }
                    }}
                  >
                    Share
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
