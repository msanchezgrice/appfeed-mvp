import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:20}}>
          <div>
            <h1>Build once. Get discovered.<br/>Let anyone <span style={{color:'var(--brand)'}}>run</span> and <span style={{color:'var(--brand2)'}}>remix</span> your mini‑apps.</h1>
            <p className="small">
              AppFeed is a TikTok‑style feed for software. Creators publish tiny, focused apps. People watch a short demo, try it in a safe sandbox, then use it with their own API keys—or remix and publish a variant.
            </p>
            <div style={{display:'flex',gap:10,marginTop:10}}>
              <Link className="btn primary" href="/feed">Open Feed</Link>
              <Link className="btn" href="/how-it-works">Explore how it works</Link>
            </div>
            <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
              <span className="badge">BYOK secrets</span>
              <span className="badge">Remix graph</span>
              <span className="badge">Mobile‑ready</span>
              <span className="badge">Provenance</span>
              <span className="badge">Embeds</span>
            </div>
          </div>
          <div>
            <div className="card">
              <b>Why creators use AppFeed</b>
              <ul>
                <li>Get users and followers without fighting distribution.</li>
                <li>Publish in minutes via a JSON manifest or a remote adapter.</li>
                <li>People can run your app instantly, safely, and remix it.</li>
                <li>Attribution & lineage are automatic.</li>
              </ul>
              <hr/>
              <b>Why viewers love it</b>
              <ul>
                <li>Watch a 10s demo. One‑tap Try. Use with your own keys.</li>
                <li>Save to your library and schedule or connect integrations.</li>
                <li>Remix defaults or fork logic to make it your own.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section style={{marginTop:24}}>
        <h2>How it works at a glance</h2>
        <div className="grid three" style={{marginTop:12}}>
          <div className="card"><b>1) Publish</b><p className="small">Upload a <code>manifest.json</code> or point to a <code>/manifest</code> endpoint. Add tags, mobile flag, and a short demo clip.</p></div>
          <div className="card"><b>2) Discover</b><p className="small">Your card shows in the feed. People can watch a micro‑demo first. Ranking learns from watch→try→save signals.</p></div>
          <div className="card"><b>3) Try & Use</b><p className="small">Runs in a sandbox. If the viewer stored keys (BYOK), the app gets scoped tokens for just this run. Side‑effects require consent.</p></div>
        </div>
      </section>

      <section style={{marginTop:24}}>
        <h2>For creators</h2>
        <div className="grid two" style={{marginTop:12}}>
          <div className="card"><b>Ship faster</b><p className="small">No storefront boilerplate. The feed, player, and runner are provided. Focus on your app's value.</p></div>
          <div className="card"><b>Grow reputation</b><p className="small">Followers, saves, and remix lineage compound across apps. Your profile becomes a living portfolio.</p></div>
        </div>
      </section>

      <section style={{marginTop:24}}>
        <h2>For viewers</h2>
        <div className="grid two" style={{marginTop:12}}>
          <div className="card"><b>Safer trials</b><p className="small">Default to watch. Try runs are read‑only with tight caps. Use runs respect your provider limits.</p></div>
          <div className="card"><b>Make it yours</b><p className="small">Remix parameters or fork logic. Save to your library and run on a schedule or through Slack/Notion.</p></div>
        </div>
        <div style={{marginTop:16}}>
          <Link className="btn primary" href="/feed">Try the Feed</Link>
        </div>
      </section>
    </div>
  );
}
