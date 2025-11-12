import Link from 'next/link';

export const metadata = { title: 'Remote Adapter — Clipcade Docs' };

export default function RemoteAdapterDocs() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>Remote Adapter (HTTP Runner)</h1>
      <p style={{ marginBottom: 32, fontSize: 16, color: 'var(--muted)' }}>
        Integrate any stack by exposing two endpoints. We pass a capability token so you never handle raw user secrets.
      </p>

      <div className="card" style={{ padding: 24, marginBottom: 32, background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)', border: '1px solid #667eea44' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          Quick Start
        </h3>
        <p style={{ marginBottom: 16 }}>
          Deploy your app to Vercel, Cloudflare, or any hosting provider, then connect it to Clipcade.
        </p>
        <Link href="/publish" className="btn primary" style={{ display: 'inline-block' }}>
          Connect Your App →
        </Link>
      </div>

      <h2>Contract</h2>
      <p style={{ marginBottom: 16 }}>
        Your adapter must implement two HTTP endpoints that Clipcade will call:
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>GET /manifest</h3>
        <p className="small" style={{ marginBottom: 12 }}>
          Returns app metadata, inputs schema, and permissions required.
        </p>
        <pre style={{
          background: 'var(--bg)',
          padding: 16,
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 13,
          fontFamily: 'monospace',
          border: '1px solid #1f2937',
          margin: 0
        }}>{`GET /manifest -> 200 OK
{
  "id": "cool-generator",
  "name": "Cool Generator",
  "version": "1.0.0",
  "inputs": {
    "topic": { "type": "string", "required": true }
  },
  "permissions": ["openai.chat"],
  "run": {
    "url": "https://creatorapp.example.com/run",
    "method": "POST"
  },
  "uiSchema": { "mobile": true }
}`}</pre>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>POST /run</h3>
        <p className="small" style={{ marginBottom: 12 }}>
          Executes your app with user inputs and scoped capability tokens.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Request:</div>
          <pre style={{
            background: 'var(--bg)',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            fontSize: 13,
            fontFamily: 'monospace',
            border: '1px solid #1f2937',
            margin: 0
          }}>{`POST /run
Content-Type: application/json

{
  "inputs": { "topic": "Austin tech" },
  "tokens": {
    "openai": "scoped.jwt.token"
  }
}`}</pre>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Response:</div>
          <pre style={{
            background: 'var(--bg)',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            fontSize: 13,
            fontFamily: 'monospace',
            border: '1px solid #1f2937',
            margin: 0
          }}>{`200 OK
Content-Type: application/json

{
  "outputs": {
    "markdown": "## Austin Tech Scene\\n\\n..."
  },
  "trace": [
    {
      "tool": "openai.chat",
      "tokens": 512,
      "latencyMs": 850
    }
  ]
}`}</pre>
        </div>
      </div>

      <h2>Security</h2>
      <div className="card" style={{ padding: 20, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🔒</span>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Token-Based Security</h3>
            <p style={{ margin: 0 }}>
              We sign <code>tokens.*</code> (JWT) with scopes and short TTLs. Always verify signature and scopes server-side.
              You never see raw user API keys — only scoped, time-limited capability tokens.
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
          <div className="small" style={{ fontWeight: 'bold', marginBottom: 8 }}>Example JWT Payload:</div>
          <pre className="small" style={{ margin: 0, fontFamily: 'monospace' }}>{`{
  "aud": "your-app-id",
  "scope": ["openai.chat"],
  "exp": 1640000000,
  "iat": 1639999400
}`}</pre>
        </div>
      </div>

      <h2>Example Implementation</h2>
      <div className="card" style={{ padding: 20, marginBottom: 32 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Next.js API Routes</h3>
        <pre style={{
          background: 'var(--bg)',
          padding: 16,
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 13,
          fontFamily: 'monospace',
          border: '1px solid #1f2937',
          margin: 0
        }}>{`// app/api/manifest/route.js
export async function GET() {
  return Response.json({
    id: "my-app",
    name: "My Cool App",
    version: "1.0.0",
    inputs: {
      topic: { type: "string", required: true }
    },
    permissions: ["openai.chat"],
    run: {
      url: process.env.BASE_URL + "/api/run",
      method: "POST"
    }
  });
}

// app/api/run/route.js
export async function POST(request) {
  const { inputs, tokens } = await request.json();

  // Use scoped token to call OpenAI
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      Authorization: \`Bearer \${tokens.openai}\`
    },
    // ... rest of request
  });

  return Response.json({
    outputs: { markdown: result },
    trace: [{ tool: "openai.chat", tokens: 512 }]
  });
}`}</pre>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/publish" className="btn primary">
          Connect Your App →
        </Link>
        <Link href="/docs/manifest" className="btn">
          View Manifest Docs
        </Link>
        <Link href="/docs/security" className="btn">
          Security Details
        </Link>
      </div>
    </div>
  );
}
