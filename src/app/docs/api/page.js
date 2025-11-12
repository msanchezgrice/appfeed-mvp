export const metadata = { title: 'Platform API — Clipcade Docs' };

export default function APIDocs() {
  return (
    <div>
      <h1>Platform API (preview)</h1>
      <p className="small">Minimal endpoints used by the client. Subject to change.</p>
      <pre>{`POST /api/runs
Body: { "appId":"...", "inputs":{...}, "mode":"try"|"use" }
Resp: { "runId":"...", "trace":[...], "outputs":{...} }

GET  /api/apps
GET  /api/apps/:id

POST /api/library { action:"add"|"remove", appId }
GET  /api/library

GET  /api/secrets
POST /api/secrets { provider, ... }  # BYOK vault
`}</pre>
    </div>
  );
}
