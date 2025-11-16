'use client';
import Image from 'next/image';

export default function VideoPreview({ app, autoplay = false, onClick }) {
  // Generate elevated, descriptive image URL based on app description
  const getImageUrl = () => {
    const seed = app.id ? parseInt(app.id.slice(-4), 36) : Math.floor(Math.random() * 1000);
    
    // Create descriptive search terms from app description and name
    // Extract key concepts for elevated, Apple-like aesthetic
    let searchTerms = '';
    
    const desc = (app.description || app.name || '').toLowerCase();
    
    // Map concepts to elevated visual themes
    if (desc.includes('summarize') || desc.includes('text') || desc.includes('document')) {
      searchTerms = 'minimal,workspace,clean,desk,paper,professional';
    } else if (desc.includes('email') || desc.includes('communication') || desc.includes('reply')) {
      searchTerms = 'communication,office,workspace,minimal,professional,letter';
    } else if (desc.includes('code') || desc.includes('programming') || desc.includes('developer')) {
      searchTerms = 'technology,coding,screen,minimal,workspace,developer';
    } else if (desc.includes('social') || desc.includes('post') || desc.includes('media')) {
      searchTerms = 'social,connection,people,minimal,lifestyle,modern';
    } else if (desc.includes('affirmation') || desc.includes('wellbeing') || desc.includes('mood')) {
      searchTerms = 'nature,calm,peaceful,minimal,wellness,zen';
    } else if (desc.includes('wish') || desc.includes('vision') || desc.includes('aspiration')) {
      searchTerms = 'inspiration,dream,vision,minimal,aesthetic,lifestyle';
    } else {
      // Fallback to tags
      const tag = app.tags?.[0] || 'abstract';
      searchTerms = `${tag},minimal,clean,professional,elevated`;
    }
    
    return `https://source.unsplash.com/800x600/?${searchTerms}&sig=${seed}`;
  };

  const hasVideo = app.preview_type === 'video' && app.preview_url;
  const hasImage = app.preview_type === 'image' && app.preview_url;
  const imageUrl = hasImage ? app.preview_url : getImageUrl();

  return (
    <div
      onClick={onClick}
      style={{
        background: app.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {hasVideo ? (
        <video
          src={app.preview_url}
          autoPlay={autoplay}
          loop
          muted
          playsInline
          preload="none"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <>
          {/* Dynamic generated image */}
          {hasImage ? (
            <Image
              src={app.preview_url}
              alt={app.name}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              priority={false}
            />
          ) : (
            <img
              src={imageUrl}
              alt={app.name}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // Fallback to gradient if image fails to load
                e.target.style.display = 'none';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}
          
          {/* Subtle gradient overlay for text contrast */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none'
          }} />
          
          {/* Play button overlay */}
          {onClick && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              paddingLeft: 6,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
            >
              ▶
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .preview-animation {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .preview-icon {
          transition: transform 0.3s ease;
        }

        .playing .pulse .preview-icon {
          animation: pulseAnim 2s ease-in-out infinite;
        }

        .playing .float .preview-icon {
          animation: floatAnim 3s ease-in-out infinite;
        }

        .playing .check .preview-icon {
          animation: checkAnim 1.5s ease-in-out infinite;
        }

        @keyframes pulseAnim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        @keyframes floatAnim {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(-5deg); }
          75% { transform: translateY(-10px) rotate(5deg); }
        }

        @keyframes checkAnim {
          0% { transform: scale(0.8) rotate(-5deg); opacity: 0.7; }
          50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(0.8) rotate(-5deg); opacity: 0.7; }
        }

        .play-button {
          transition: transform 0.2s ease;
        }

        .play-button:hover {
          transform: scale(1.1);
        }

        .video-preview:hover .preview-icon {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
