export const metadata = { title: 'Remote Adapter — AppFeed Docs' };

export default function RemoteAdapterDocs() {
  return (
    <div>
      <h1>Remote Adapter (HTTP Runner)</h1>
      <p className="small">Integrate any stack by exposing two endpoints. We pass a capability token so you never handle raw user secrets.</p>
      <h2>Contract</h2>
      <pre>{`GET /manifest -> 200 OK
{
  "id": "cool-generator",
  "name": "Cool Generator",
  "version": "1.0.0",
  "inputs": { "topic": { "type":"string", "required": true } },
  "permissions": ["openai.chat"],
  "run": { "url": "https://creatorapp.example.com/run", "method":"POST" },
  "uiSchema": { "mobile": true }
}
`}</pre>
      <pre>{`POST /run -> 200 OK
Request body:
{
  "inputs": { "topic": "Austin tech" },
  "tokens": { "openai": "scoped.jwt.token" }
}

Response:
{
  "outputs": { "markdown": "..." },
  "trace": [
    {"tool":"openai.chat","tokens":512,"latencyMs":850}
  ]
}`}</pre>
      <h2>Security</h2>
      <p className="small">We sign <code>tokens.*</code> (JWT) with scopes and short TTLs. Verify signature and scopes server‑side.</p>
    </div>
  );
}
