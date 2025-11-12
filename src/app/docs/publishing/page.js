import Link from 'next/link';

export const metadata = { title: 'Publishing — Clipcade Docs' };

export default function Publishing() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>Publishing your first app</h1>

      <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)', border: '1px solid #667eea44' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🚀</span>
          Ready to publish?
        </h3>
        <p style={{ marginBottom: 16 }}>
          Start publishing your app in minutes with our step-by-step guided flow.
        </p>
        <Link href="/publish" className="btn primary" style={{ display: 'inline-block' }}>
          Start Publishing →
        </Link>
      </div>

      <h2>Publishing Steps</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              minWidth: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18
            }}>1</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Create an account</h3>
              <p className="small" style={{ margin: 0 }}>
                Complete your profile with name, avatar, bio, and links. This helps viewers connect with you.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              minWidth: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18
            }}>2</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Connect providers (optional)</h3>
              <p className="small" style={{ margin: 0 }}>
                Add API keys for OpenAI, Anthropic, Slack, or Notion to test your app before publishing.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              minWidth: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18
            }}>3</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Choose a mode</h3>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Inline (Manifest)</div>
                <p className="small" style={{ margin: '0 0 12px 0' }}>
                  Fastest option — no backend needed. Define your app with JSON and we execute it in a sandbox.
                </p>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Remote (Adapter)</div>
                <p className="small" style={{ margin: 0 }}>
                  Use any stack on Vercel/Cloudflare/Render. Implement <code>/manifest</code> and <code>/run</code> endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              minWidth: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18
            }}>4</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Add a demo clip</h3>
              <p className="small" style={{ margin: 0 }}>
                Upload a 5–15 second video showing the "aha" moment of your app. This is what viewers see first.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              minWidth: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18
            }}>5</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Set tags & mobile flag</h3>
              <p className="small" style={{ margin: 0 }}>
                Add relevant tags to help viewers discover your app. Mark as mobile-ready if it works well on phones.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              minWidth: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--brand2)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18
            }}>6</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Publish!</h3>
              <p className="small" style={{ margin: 0 }}>
                Your card goes live in the feed immediately. Track views, tries, uses, saves, and remixes in your analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2>Remix & provenance</h2>
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <p style={{ margin: 0 }}>
          Others can fork your app (parameters or logic). Their variants link back to you, and attribution shows on your profile.
          Build your reputation through the remix graph.
        </p>
      </div>

      <div style={{marginTop:24,display:'flex',gap:10,flexWrap:'wrap'}}>
        <Link className="btn primary" href="/publish">Start Publishing →</Link>
        <Link className="btn" href="/docs/manifest">Manifest Docs</Link>
        <Link className="btn" href="/docs/remote-adapter">Adapter Docs</Link>
      </div>
    </div>
  );
}
