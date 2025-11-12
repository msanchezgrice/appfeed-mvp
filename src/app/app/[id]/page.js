'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id;
  
  const [app, setApp] = useState(null);
  const [remixes, setRemixes] = useState([]);
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch app details
        const appRes = await fetch(`/api/apps/${appId}`);
        if (appRes.ok) {
          const appData = await appRes.json();
          setApp(appData);
        }

        // Fetch all apps to find remixes
        const appsRes = await fetch('/api/apps');
        const appsData = await appsRes.json();
        const appRemixes = appsData.apps.filter(a => a.fork_of === appId);
        setRemixes(appRemixes);

        // TODO: Fetch saves/likes for this app
        // For now using placeholder
        setSaves([]);
      } catch (err) {
        console.error('Error loading app:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [appId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <h1>App Not Found</h1>
        <Link href="/feed" className="btn primary">← Back to Feed</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px', paddingBottom: '100px' }}>
      {/* Hero Section */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/feed" className="btn ghost" style={{ marginBottom: 16, display: 'inline-block' }}>
          ← Back to Feed
        </Link>
        
        <div style={{
          background: app.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          padding: 40,
          color: 'white',
          marginBottom: 24
        }}>
          <h1 style={{ margin: '0 0 12px 0', fontSize: 36 }}>{app.name}</h1>
          <p style={{ margin: '0 0 20px 0', fontSize: 18, opacity: 0.9 }}>{app.description}</p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {app.tags?.map(tag => (
              <Link
                key={tag}
                href={`/search?tag=${tag}`}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '6px 12px',
                  borderRadius: 16,
                  fontSize: 14,
                  color: 'white',
                  textDecoration: 'none'
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: 14, opacity: 0.9 }}>
            <div>👁️ {app.view_count || 0} views</div>
            <div>🎯 {app.try_count || 0} tries</div>
            <div>🔖 {app.save_count || 0} saves</div>
            <div>🔄 {app.remix_count || 0} remixes</div>
          </div>
        </div>

        {/* Creator Info */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24
        }}>
          <img
            src={app.creator?.avatar_url || '/avatars/1.svg'}
            alt={app.creator?.display_name}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>
              {app.creator?.display_name || app.creator?.username || 'User'}
            </div>
            <div style={{ fontSize: 14, color: '#888' }}>
              @{app.creator?.username}
            </div>
          </div>
          <Link
            href={`/profile/${app.creator_id}`}
            className="btn primary"
          >
            View Profile →
          </Link>
        </div>
      </div>

      {/* App Preview Card */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 16 }}>Try This App</h2>
        <TikTokFeedCard app={app} />
      </div>

      {/* Remixes Section */}
      {remixes.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 16 }}>Remixes ({remixes.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {remixes.map(remix => (
              <Link
                key={remix.id}
                href={`/app/${remix.id}`}
                style={{
                  background: '#1a1a1a',
                  borderRadius: 12,
                  padding: 20,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  border: '1px solid #333',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fe2c55'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    background: remix.preview_gradient,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{remix.name}</div>
                  <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
                    by @{remix.creator?.username}
                  </div>
                  {remix.remix_prompt && (
                    <div style={{ fontSize: 12, color: '#fe2c55' }}>
                      💡 "{remix.remix_prompt}"
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 24 }}>→</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share Section */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0 }}>Share This App</h3>
        <p className="small" style={{ marginBottom: 20, opacity: 0.8 }}>
          Let others discover {app.name}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }}
            className="btn primary"
          >
            📋 Copy Link
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: app.name,
                  text: app.description,
                  url: window.location.href
                });
              }
            }}
            className="btn"
          >
            🔗 Share
          </button>
        </div>
      </div>
    </div>
  );
}
