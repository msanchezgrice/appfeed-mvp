import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <section style={{
        padding: '80px 20px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: '700',
          lineHeight: '1.1',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Build once.<br/>Get discovered.
        </h1>
        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
          color: '#6b7280',
          maxWidth: '700px',
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          Let anyone <strong style={{color:'#667eea'}}>run</strong> and <strong style={{color:'#f093fb'}}>remix</strong> your mini‑apps on a TikTok‑style feed.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '32px'
        }}>
          <Link href="/feed" style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}>
            Open Feed →
          </Link>
          <Link href="/how-it-works" style={{
            padding: '16px 32px',
            background: 'white',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            transition: 'border-color 0.2s'
          }}>
            Learn More
          </Link>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {['BYOK', 'Remix', 'Mobile', 'Secure'].map(tag => (
            <span key={tag} style={{
              padding: '8px 16px',
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '60px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '48px',
          color: '#111827'
        }}>
          How it works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {[
            { num: '1', title: 'Publish', desc: 'Upload a manifest.json or point to an endpoint. Add tags and a demo.' },
            { num: '2', title: 'Discover', desc: 'Your card shows in the feed. Watch→Try→Save signals power ranking.' },
            { num: '3', title: 'Run & Remix', desc: 'Sandbox execution with BYOK. Remix parameters or fork the logic.' }
          ].map(item => (
            <div key={item.num} style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #e5e7eb',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}>
                {item.num}
              </div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#111827'
              }}>
                {item.title}
              </h3>
              <p style={{
                color: '#6b7280',
                lineHeight: '1.6',
                fontSize: '1rem'
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: '700',
          marginBottom: '24px'
        }}>
          Ready to ship?
        </h2>
        <p style={{
          fontSize: '1.2rem',
          opacity: 0.95,
          marginBottom: '32px',
          maxWidth: '600px',
          margin: '0 auto 32px'
        }}>
          Join creators building the future of app discovery.
        </p>
        <Link href="/feed" style={{
          padding: '16px 40px',
          background: 'white',
          color: '#667eea',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '1.1rem',
          display: 'inline-block',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          Start Now →
        </Link>
      </section>
    </div>
  );
}
