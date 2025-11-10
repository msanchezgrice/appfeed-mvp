import Link from 'next/link';

export const metadata = { title: 'Publishing — AppFeed Docs' };

export default function Publishing() {
  return (
    <div>
      <h1>Publishing your first app</h1>
      <ol>
        <li><b>Create an account</b> and complete your profile (name, avatar, bio, links).</li>
        <li><b>Connect providers (optional)</b> for your own testing (OpenAI, Anthropic, Slack, Notion).</li>
        <li><b>Choose a mode</b>:
          <ul>
            <li><i>Inline (Manifest)</i> — fastest; no backend needed.</li>
            <li><i>Remote (Adapter)</i> — any stack on Vercel/Cloudflare/Render with <code>/manifest</code> + <code>/run</code>.</li>
          </ul>
        </li>
        <li><b>Add a demo clip</b> (5–15s showing the “aha” moment).</li>
        <li><b>Set tags & mobile flag</b> to reach the right viewers.</li>
        <li><b>Publish</b>. Your card is live in the feed.</li>
      </ol>

      <h2>Remix & provenance</h2>
      <p className="small">Others can fork your app (parameters or logic). Their variants link back to you, and attribution shows on your profile.</p>

      <div style={{marginTop:16,display:'flex',gap:10,flexWrap:'wrap'}}>
        <Link className="btn" href="/docs/manifest">Build an inline app</Link>
        <Link className="btn" href="/docs/remote-adapter">Integrate a remote app</Link>
      </div>
    </div>
  );
}
