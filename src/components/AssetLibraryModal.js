'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AssetThumbnail from './AssetThumbnail';

/**
 * AssetLibraryModal - Full asset gallery modal with tabs and management
 * 
 * Features:
 * - Two tabs: Uploads (input) vs Generated (output)
 * - Infinite scroll pagination
 * - Select for reuse or view full screen
 * - Delete functionality
 */
export default function AssetLibraryModal({ show, onClose, onSelect }) {
  const { user, isLoaded } = useUser();
  const [tab, setTab] = useState('input'); // 'input' or 'output'
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [viewAsset, setViewAsset] = useState(null);

  const LIMIT = 20;

  // Fetch assets when tab changes or page changes
  useEffect(() => {
    if (!isLoaded || !user || !show) return;

    loadAssets(page === 0);
  }, [user, isLoaded, show, tab, page]);

  const loadAssets = async (reset = false) => {
    setLoading(true);
    try {
      const offset = reset ? 0 : page * LIMIT;
      const res = await fetch(`/api/user-assets?type=${tab}&limit=${LIMIT}&offset=${offset}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      const data = await res.json();
      
      if (reset) {
        setAssets(data.assets || []);
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

  const switchTab = (newTab) => {
    setTab(newTab);
    setPage(0);
    setAssets([]);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleAssetClick = (asset) => {
    if (tab === 'input' && onSelect) {
      // Select for reuse
      onSelect(asset);
      onClose();
    } else {
      // View full screen
      setViewAsset(asset);
    }
  };

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
        // Remove from local state
        setAssets(prev => prev.filter(a => a.id !== assetId));
      } else {
        alert('Failed to delete asset');
      }
    } catch (err) {
      console.error('Error deleting asset:', err);
      alert('Failed to delete asset');
    }
  };

  const handleDownload = (asset, e) => {
    e.stopPropagation();
    
    // Use highest quality available
    const url = asset.url_1080 || asset.url;
    const link = document.createElement('a');
    link.href = url;
    link.download = asset.original_filename || 'asset.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!show) return null;

  return (
    <div
      className="modal"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16
      }}
    >
      <div
        className="dialog"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          borderRadius: 16,
          padding: 0,
          maxWidth: 800,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #333',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 20,
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24 }}>My Asset Library</h2>
          <button
            onClick={onClose}
            className="btn ghost"
            style={{ fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid #333',
            padding: '0 20px'
          }}
        >
          <button
            onClick={() => switchTab('input')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 20px',
              color: tab === 'input' ? '#fe2c55' : '#888',
              borderBottom: tab === 'input' ? '2px solid #fe2c55' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: tab === 'input' ? 'bold' : 'normal'
            }}
          >
            📤 Uploads
          </button>
          <button
            onClick={() => switchTab('output')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 20px',
              color: tab === 'output' ? '#fe2c55' : '#888',
              borderBottom: tab === 'output' ? '2px solid #fe2c55' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: tab === 'output' ? 'bold' : 'normal'
            }}
          >
            🎨 Generated
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 20
          }}
        >
          {loading && page === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              Loading assets...
            </div>
          ) : assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {tab === 'input' ? '📤' : '🎨'}
              </div>
              <p>No {tab === 'input' ? 'uploaded' : 'generated'} assets yet</p>
              <p style={{ fontSize: 14 }}>
                {tab === 'input'
                  ? 'Upload an image when using an app to start your library'
                  : 'Generate images with apps to build your collection'}
              </p>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 16
                }}
              >
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    style={{
                      position: 'relative',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}
                  >
                    <AssetThumbnail
                      asset={asset}
                      size={140}
                      showMetadata={true}
                      onClick={handleAssetClick}
                    />
                    
                    {/* Action buttons */}
                    <div
                      className="asset-actions"
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        display: 'flex',
                        gap: 4,
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <button
                        onClick={(e) => handleDownload(asset, e)}
                        style={{
                          background: 'rgba(0,0,0,0.8)',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 8px',
                          color: 'white',
                          fontSize: 12,
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
                          padding: '4px 8px',
                          color: 'white',
                          fontSize: 12,
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
                <div style={{ textAlign: 'center', marginTop: 24 }}>
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
        </div>
      </div>

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

