'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [savedApps, setSavedApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in?redirect_url=/home');
    }
  }, [isLoaded, user, router]);

  // Fetch saved apps
  useEffect(() => {
    if (!isLoaded || !user) return;

    (async () => {
      try {
        const res = await fetch('/api/library', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSavedApps(data?.items || []);
        }
      } catch (err) {
        console.error('Error loading saved apps:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isLoaded]);

  if (!isLoaded || !user) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 36 }}>My Saved Apps</h1>
        <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
          Quick access to your favorite apps
        </p>
      </div>

      {/* Saved Apps Grid */}
      {loading ? (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: '9/16',
                background: '#1a1a1a',
                borderRadius: 12,
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          ))}
        </div>
      ) : savedApps.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⭐</div>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>No saved apps yet</h3>
          <p style={{ color: '#888', marginBottom: 24 }}>
            Save apps from the feed to access them quickly here
          </p>
          <Link href="/feed" className="btn primary">
            Browse Apps →
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {savedApps.map((app) => (
            <Link
              key={app.id}
              href={`/app/${app.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div
                style={{
                  background: '#1a1a1a',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #333',
                  transition: 'border-color 0.2s, transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#fe2c55';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Preview Image */}
                <div
                  style={{
                    aspectRatio: '9/16',
                    background: app.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {app.preview_url && (
                    <img
                      src={app.preview_url}
                      alt={app.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                </div>

                {/* App Info */}
                <div style={{ padding: 16 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{app.name}</h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: 14, 
                    color: '#888',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {app.description}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 12,
                    fontSize: 12,
                    color: '#666'
                  }}>
                    <span>👁️ {app.view_count || 0}</span>
                    <span>🎯 {app.try_count || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

