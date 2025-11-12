export const metadata = { title: 'Security — Clipcade Docs' };

export default function SecurityDocs() {
  return (
    <div>
      <h1>Security Model</h1>
      <ul>
        <li><b>BYOK secrets</b> stored encrypted (AES‑256‑GCM). No raw keys are delivered to inline apps.</li>
        <li><b>Scoped capability tokens</b> minted per run with least privilege and short TTLs.</li>
        <li><b>Sandboxed execution</b> for inline apps (isolate/WASM); network allowlist; CPU/memory/time caps.</li>
        <li><b>Action confirmations</b> for side‑effects (e.g., “Send Slack message?”).</li>
        <li><b>Auditability</b>: traces summarize steps with secret redaction.</li>
      </ul>
    </div>
  );
}
