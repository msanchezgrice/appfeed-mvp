import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div style={{
      background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <section style={{
        padding: '60px 20px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: '700',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          How AppFeed Works
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: '#6b7280',
          maxWidth: '700px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Two perspectives: creators and viewers. Both share the same runner and safety model.
        </p>
      </section>

      {/* Creators Section */}
      <section style={{
        padding: '40px 20px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: '700',
          marginBottom: '24px',
          color: '#111827'
        }}>
          For Creators
        </h2>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 'clamp(24px, 4vw, 40px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb'
        }}>
          {[
            { title: 'Make an app', desc: 'Either (A) Inline via a JSON manifest that describes inputs, steps, and permissions; or (B) Remote by hosting a simple /manifest + /run HTTP adapter on Vercel/Cloudflare/etc.' },
            { title: 'Add a demo clip', desc: '5–15 seconds showing the app\'s moment of value.' },
            { title: 'Tag it', desc: 'Topics, capabilities, mobile‑ready flag.' },
            { title: 'Publish', desc: 'It lands in the feed. People can watch, try, use, and remix it.' },
            { title: 'See signals', desc: 'watch→try→save→remix, plus followers, provenance, and comments.' }
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '16px',
              marginBottom: i < 4 ? '24px' : '0',
              alignItems: 'flex-start'
            }}>
              <div style={{
                minWidth: '32px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: '#111827'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#6b7280',
                  lineHeight: '1.6',
                  fontSize: '0.95rem',
                  margin: 0
                }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Viewers Section */}
      <section style={{
        padding: '40px 20px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: '700',
          marginBottom: '24px',
          color: '#111827'
        }}>
          For Viewers
        </h2>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 'clamp(24px, 4vw, 40px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb'
        }}>
          {[
            { title: 'Watch first', desc: 'Autoplay micro‑demo to understand the app.' },
            { title: 'Try safely', desc: 'One‑tap run with sample inputs and read‑only network. No keys needed.' },
            { title: 'Use with your keys', desc: 'Store keys once (BYOK). For a given run, the runtime issues scoped, short‑lived tokens to the app for only the capabilities it requested.' },
            { title: 'Make it yours', desc: 'Save to Library, edit defaults, schedule, or connect Slack/Notion.' },
            { title: 'Remix', desc: 'Fork parameters (fast) or fork logic (advanced). Your version credits the original.' }
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '16px',
              marginBottom: i < 4 ? '24px' : '0',
              alignItems: 'flex-start'
            }}>
              <div style={{
                minWidth: '32px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: '#111827'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#6b7280',
                  lineHeight: '1.6',
                  fontSize: '0.95rem',
                  margin: 0
                }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Start Creating Section */}
      <section id="start" style={{
        padding: '60px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '40px',
          color: '#111827'
        }}>
          Start as a Creator
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#111827'
            }}>
              Option A — Inline (Manifest)
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '0.95rem',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              No server required. The platform executes your steps in a sandbox.
            </p>
            <pre style={{
              background: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.85rem',
              marginBottom: '20px',
              color: '#374151',
              border: '1px solid #e5e7eb'
            }}>{`{
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
            <Link href="/docs/manifest" style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              Read manifest docs →
            </Link>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#111827'
            }}>
              Option B — Remote (Adapter)
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '0.95rem',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Use your own backend (Next/Express/Flask). We call your /run with a capability token.
            </p>
            <pre style={{
              background: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.85rem',
              marginBottom: '20px',
              color: '#374151',
              border: '1px solid #e5e7eb'
            }}>{`GET  /manifest -> { name, inputs, permissions, run:{url,method} }
POST /run      -> { inputs, tokens } => { outputs, trace? }`}</pre>
            <Link href="/docs/remote-adapter" style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              See adapter spec →
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/docs/publishing" style={{
            display: 'inline-block',
            padding: '16px 40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
          }}>
            Publish Your First App →
          </Link>
        </div>
      </section>
    </div>
  );
}
