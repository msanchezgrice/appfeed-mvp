import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div>
      <h1>How AppFeed Works</h1>
      <p className="small">Two perspectives: creators and viewers. Both share the same runner and safety model.</p>

      <h2 style={{marginTop:16}}>Creators</h2>
      <ol>
        <li><b>Make an app</b>: either (A) <i>Inline</i> via a JSON manifest that describes inputs, steps, and permissions; or (B) <i>Remote</i> by hosting a simple <code>/manifest</code> + <code>/run</code> HTTP adapter on Vercel/Cloudflare/etc.</li>
        <li><b>Add a demo clip</b>: 5–15 seconds showing the app’s moment of value.</li>
        <li><b>Tag it</b>: topics, capabilities, mobile‑ready flag.</li>
        <li><b>Publish</b>: it lands in the feed. People can watch, try, use, and remix it.</li>
        <li><b>See signals</b>: watch→try→save→remix, plus followers, provenance, and comments.</li>
      </ol>

      <h2 style={{marginTop:16}}>Viewers</h2>
      <ol>
        <li><b>Watch first</b>: autoplay micro‑demo to understand the app.</li>
        <li><b>Try safely</b>: one‑tap run with sample inputs and read‑only network. No keys needed.</li>
        <li><b>Use with your keys</b>: store keys once (BYOK). For a given run, the runtime issues <i>scoped, short‑lived tokens</i> to the app for only the capabilities it requested.</li>
        <li><b>Make it yours</b>: save to Library, edit defaults, schedule, or connect Slack/Notion.</li>
        <li><b>Remix</b>: fork parameters (fast) or fork logic (advanced). Your version credits the original.</li>
      </ol>

      <h2 id="start" style={{marginTop:16}}>Start as a creator</h2>
      <div className="grid two" style={{marginTop:12}}>
        <div className="card">
          <b>Option A — Inline (Manifest)</b>
          <p className="small">No server required. The platform executes your steps in a sandbox.</p>
          <pre>{`{
  "name": "Daily Affirmations",
  "inputs": {
    "mood": {"type":"string"},
    "style": {"type":"string","enum":["short","poetic","coach"],"default":"short"}
  },
  "permissions": ["openai.chat"],
  "runtime": {
    "engine": "edge",
    "steps": [
      {"tool":"llm.complete","args":{"system":"You are supportive","prompt":"Write 3 affirmations. Mood: {{mood||neutral}} Style: {{style||short}}"}}
    ]
  }
}`}</pre>
          <Link className="btn" href="/docs/manifest">Read manifest docs</Link>
        </div>
        <div className="card">
          <b>Option B — Remote (Adapter)</b>
          <p className="small">Use your own backend (Next/Express/Flask). We call your <code>/run</code> with a capability token.</p>
          <pre>{`GET  /manifest -> { name, inputs, permissions, run:{url,method} }
POST /run      -> { inputs, tokens } => { outputs, trace? }`}</pre>
          <Link className="btn" href="/docs/remote-adapter">See adapter spec</Link>
        </div>
      </div>

      <div style={{marginTop:16}}>
        <Link href="/docs/publishing" className="btn primary">Publish your first app</Link>
      </div>
    </div>
  );
}
