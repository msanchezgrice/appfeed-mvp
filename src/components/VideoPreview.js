'use client';
import { useRef, useState } from 'react';

export default function VideoPreview({ app, autoplay = false, onPlay }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const previewRef = useRef(null);

  const preview = app.preview || {
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  return (
    <div
      ref={previewRef}
      className={`video-preview ${isPlaying ? 'playing' : ''}`}
      onClick={() => setIsPlaying(!isPlaying)}
      style={{
        background: preview.gradient,
        position: 'relative',
        width: '100%',
        aspectRatio: '9/16',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
      }}
    >
      <img
        src={preview.url}
        alt={app.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* Dark overlay for better text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.3)'
      }} />

      <div className="preview-overlay" style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '100px 20px 20px 20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{app.name}</h2>
        <p style={{ margin: 0, opacity: 0.95, fontSize: 14, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{app.description}</p>
      </div>

      {!isPlaying && (
        <div className="play-button" style={{
          position: 'absolute',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          ▶
        </div>
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
