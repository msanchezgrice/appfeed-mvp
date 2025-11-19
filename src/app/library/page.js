'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AssetThumbnail from '@/src/components/AssetThumbnail';

export default function LibraryPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState('input'); // 'input' or 'output'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'favorites'
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({ uploads: 0, generated: 0 });
  const [viewAsset, setViewAsset] = useState(null);

  const LIMIT = 24;

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in?redirect_url=/library');
    }
  }, [isLoaded, user, router]);

  // Fetch assets and stats
  useEffect(() => {
    if (!isLoaded || !user) return;

    loadAssets(true);
    loadStats();
  }, [user, isLoaded, tab, sortBy]);

  const loadStats = async () => {
    try {
      const [uploadsRes, generatedRes] = await Promise.all([
        fetch('/api/user-assets?type=input&limit=1'),
        fetch('/api/user-assets?type=output&limit=1')
      ]);
      
      const uploadsData = await uploadsRes.json();
      const generatedData = await generatedRes.json();
      
      setStats({
        uploads: uploadsData.total || 0,
        generated: generatedData.total || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadAssets = async (reset = false) => {
    setLoading(true);
    try {
      const offset = reset ? 0 : page * LIMIT;
      const favFilter = sortBy === 'favorites' ? '&favorites=true' : '';
      const res = await fetch(`/api/user-assets?type=${tab}&limit=${LIMIT}&offset=${offset}${favFilter}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      const data = await res.json();
      
      if (reset) {
        setAssets(data.assets || []);
        setPage(0);
      } else {
        setAssets(prev => [...prev, ...(data.assets || [])]);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 0) {
      loadAssets(false);
    }
  }, [page]);

  const handleDelete = async (assetId, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this asset? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/user-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', assetId })
      });

      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== assetId));
        loadStats(); // Refresh stats
      } else {
        alert('Failed to delete asset');
      }
    } catch (err) {
      console.error('Error deleting asset:', err);
      alert('Failed to delete asset');
    }
  };

  const handleFavorite = async (assetId, currentState, e) => {
    e.stopPropagation();

    try {
      const res = await fetch('/api/user-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: currentState ? 'unfavorite' : 'favorite', 
          assetId 
        })
      });

      if (res.ok) {
        // Update local state
        setAssets(prev => prev.map(a => 
          a.id === assetId ? { ...a, is_favorite: !currentState } : a
        ));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDownload = (asset, e) => {
    e.stopPropagation();
    
    const url = asset.url_1080 || asset.url;
    const link = document.createElement('a');
    link.href = url;
    link.download = asset.original_filename || 'asset.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <Link href="/feed" className="btn ghost" style={{ marginBottom: 16, display: 'inline-block' }}>
          ← Back to Feed
        </Link>
        
        <h1 style={{ margin: '0 0 8px 0', fontSize: 36 }}>My Asset Library</h1>
        <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
          Manage your uploaded images and generated outputs
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <div style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>📤 Uploads</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.uploads}</div>
        </div>
        <div style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>🎨 Generated</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.generated}</div>
        </div>
        <div style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>📊 Total Assets</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.uploads + stats.generated}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setTab('input')}
            className="btn"
            style={{
              background: tab === 'input' ? '#fe2c55' : 'transparent',
              border: tab === 'input' ? 'none' : '1px solid #333'
            }}
          >
            📤 Uploads
          </button>
          <button
            onClick={() => setTab('output')}
            className="btn"
            style={{
              background: tab === 'output' ? '#fe2c55' : 'transparent',
              border: tab === 'output' ? 'none' : '1px solid #333'
            }}
          >
            🎨 Generated
          </button>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#888' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="recent">Most Recent</option>
            <option value="favorites">Favorites</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {loading && page === 0 ? (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                background: '#1a1a1a',
                borderRadius: 8,
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {tab === 'input' ? '📤' : '🎨'}
          </div>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>No {tab === 'input' ? 'uploads' : 'generated images'} yet</h3>
          <p style={{ color: '#888', marginBottom: 24 }}>
            {tab === 'input'
              ? 'Upload an image when using an app to start building your library'
              : 'Use image generation apps to create AI-powered content'}
          </p>
          <Link href="/feed" className="btn primary">
            Browse Apps →
          </Link>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16
          }}>
            {assets.map((asset) => (
              <div
                key={asset.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1'
                }}
              >
                <AssetThumbnail
                  asset={asset}
                  size="100%"
                  showMetadata={true}
                  onClick={() => setViewAsset(asset)}
                />
                
                {/* Action buttons */}
                <div
                  className="asset-actions"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 4,
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <button
                    onClick={(e) => handleFavorite(asset.id, asset.is_favorite, e)}
                    style={{
                      background: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 10px',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                    title={asset.is_favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    {asset.is_favorite ? '⭐' : '☆'}
                  </button>
                  <button
                    onClick={(e) => handleDownload(asset, e)}
                    style={{
                      background: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 10px',
                      color: 'white',
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                    title="Download"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={(e) => handleDelete(asset.id, e)}
                    style={{
                      background: 'rgba(220,38,38,0.9)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 10px',
                      color: 'white',
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={loadMore}
                className="btn"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Full-screen image view */}
      {viewAsset && (
        <div
          onClick={() => setViewAsset(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20
          }}
        >
          <img
            src={viewAsset.url_1080 || viewAsset.url}
            alt={viewAsset.original_filename}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8
            }}
          />
          <button
            onClick={() => setViewAsset(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(0,0,0,0.8)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              color: 'white',
              fontSize: 20,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .asset-actions {
          pointer-events: none;
        }
        .asset-actions button {
          pointer-events: all;
        }
        div:hover .asset-actions {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
