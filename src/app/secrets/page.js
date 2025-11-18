'use client';
import { useEffect, useState } from 'react';
import { analytics } from '@/src/lib/analytics';

function uid() { return (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'u_jamie'; }

async function api(path, method='GET', body) {
  const res = await fetch(path, {
    method, headers: { 'Content-Type':'application/json', 'x-user-id': uid() },
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

export default function SecretsPage() {
  const [providers, setProviders] = useState({ openai: 'unknown' });
  const [openaiKey, setOpenaiKey] = useState('');

  const refresh = async () => setProviders((await api('/api/secrets')).providers);

  useEffect(() => { refresh(); }, []);

  const saveOpenAI = async () => {
    if (!openaiKey) return;
    await api('/api/secrets', 'POST', { provider:'openai', apiKey: openaiKey });
    setOpenaiKey('');
    await refresh();
    
    // Track secrets configuration
    analytics.secretsConfigured('openai');
  };

  return (
    <div>
      <h1>Secrets</h1>
      <p className="small">Bring Your Own Keys (BYOK). Stored encrypted with AES-256-GCM using SECRET_ENCRYPTION_KEY.</p>

      <div className="card" style={{marginTop:16}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <div>
            <div><b>OpenAI</b></div>
            <div className="small">Status: <span className="badge">{providers.openai}</span></div>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <div className="label">API Key</div>
          <input className="input" placeholder="sk-..." value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} />
          <div className="row" style={{marginTop:10}}>
            <button className="btn primary" onClick={saveOpenAI}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
