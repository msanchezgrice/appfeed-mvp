'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AssetThumbnail from './AssetThumbnail';

/**
 * AssetPicker - Inline asset selector for reusing previously uploaded images
 * 
 * Shows 4 most recently used input assets with "View All" button
 * Clicking an asset populates the parent form field
 */
export default function AssetPicker({ onSelect, onViewAll }) {
  const { user, isLoaded } = useUser();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch recent input assets
    (async () => {
      try {
        const res = await fetch('/api/user-assets?type=input&limit=4');
        if (!res.ok) {
          if (res.status === 401) {
            // User not authenticated
            setAssets([]);
            return;
          }
          throw new Error('Failed to fetch assets');
        }
        const data = await res.json();
        setAssets(data.assets || []);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isLoaded]);

  // Mark asset as used when selected
  const handleAssetClick = async (asset) => {
    if (onSelect) {
      onSelect(asset);
    }

    // Update last_used_at in background
    try {
      await fetch('/api/user-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'use',
          assetUrl: asset.url
        })
      });
    } catch (err) {
      console.error('Error updating asset usage:', err);
    }
  };

  // Don't show if not loaded or no user
  if (!isLoaded || !user) return null;

  // Don't show if loading failed
  if (error) {
    console.error('AssetPicker error:', error);
    return null;
  }

  // Don't show if no assets yet
  if (!loading && assets.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        background: '#111',
        borderRadius: 8,
        border: '1px solid #333'
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#888',
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>📸 Or pick from your library:</span>
        {onViewAll && assets.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fe2c55',
              fontSize: 12,
              cursor: 'pointer',
              padding: 0
            }}
          >
            View All →
          </button>
        )}
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            height: 80
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 80,
                height: 80,
                background: '#1a1a1a',
                borderRadius: 8,
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          {assets.map((asset) => (
            <AssetThumbnail
              key={asset.id}
              asset={asset}
              size={80}
              showMetadata={true}
              onClick={handleAssetClick}
            />
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

