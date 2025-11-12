export const metadata = { title: 'Manifest — Clipcade Docs' };

export default function ManifestDocs() {
  return (
    <div>
      <h1>Manifest (Inline Apps)</h1>
      <p className="small">Describe inputs, permissions, and the steps your app runs. The platform executes it in a sandbox.</p>
      <pre>{`{
  "id": "@maker/affirmations-daily",
  "name": "Daily Affirmations",
  "version": "0.1.0",
  "inputs": {
    "mood": {"type":"string","required":false},
    "style": {"type":"string","enum":["short","poetic","coach"],"default":"short"}
  },
  "outputs": { "markdown": {"type":"string"} },
  "permissions": ["openai.chat"],
  "runtime": {
    "engine": "edge",
    "limits": { "timeoutMs": 10000, "tokens": 6000, "net": "allowlist" },
    "steps": [
      {"tool":"llm.complete","args":{
        "system":"You are supportive.",
        "prompt":"Write 3 affirmations. Mood: {{mood||neutral}} Style: {{style||short}}"
      }}
    ]
  },
  "demo": { "videoId": "mux_abc123", "sampleInputs": {"mood":"optimistic"} },
  "provenance": { "forkOf": null },
  "uiSchema": { "mobile": true }
}`}</pre>
      <h2>Fields</h2>
      <ul>
        <li><b>inputs</b> — JSON schema; drives the auto‑generated form.</li>
        <li><b>permissions</b> — capabilities required (e.g., <code>openai.chat</code>, <code>slack.chat.write</code>).</li>
        <li><b>runtime</b> — engine + sequential steps (use built‑in tools or your custom tools).</li>
        <li><b>demo</b> — sample inputs and optional video asset.</li>
        <li><b>uiSchema.mobile</b> — whether this renders well on mobile.</li>
      </ul>
    </div>
  );
}
