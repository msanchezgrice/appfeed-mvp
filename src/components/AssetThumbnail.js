'use client';
import { useState } from 'react';

/**
 * AssetThumbnail - Optimized image thumbnail with blur-up loading
 * 
 * Features:
 * - Blur placeholder for instant perceived loading
 * - Progressive enhancement (360px -> full resolution)
 * - Lazy loading
 * - Click handler
 */
export default function AssetThumbnail({ 
  asset, 
  onClick, 
  size = 120,
  showMetadata = false,
  className = ''
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!asset) return null;

  // Use 360px thumbnail for previews, full URL for larger displays
  const thumbnailUrl = asset.url_360 || asset.url;
  const blurUrl = asset.blur_data_url;

  const handleClick = () => {
    if (onClick) {
      onClick(asset);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div 
      className={`asset-thumbnail ${className}`}
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#1a1a1a'
      }}
    >
      {/* Blur placeholder - shows immediately */}
      {blurUrl && !loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${blurUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Actual thumbnail */}
      {!error ? (
        <img
          src={thumbnailUrl}
          alt={asset.original_filename || 'Asset'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            position: 'relative',
            zIndex: 1
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: 12
          }}
        >
          Failed to load
        </div>
      )}

      {/* Metadata overlay */}
      {showMetadata && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '4px 6px',
            fontSize: 10,
            color: 'white',
            zIndex: 2
          }}
        >
          {asset.asset_type === 'input' ? '📤' : '🎨'} {formatDate(asset.last_used_at || asset.created_at)}
        </div>
      )}

      {/* Favorite indicator */}
      {asset.is_favorite && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 16,
            zIndex: 2,
            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
          }}
        >
          ⭐
        </div>
      )}

      {/* Hover overlay (if clickable) */}
      {onClick && (
        <div
          className="hover-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            opacity: 0,
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 14,
            fontWeight: 'bold',
            zIndex: 3
          }}
        >
          Use
        </div>
      )}

      <style jsx>{`
        .asset-thumbnail:hover .hover-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

