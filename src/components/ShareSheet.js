'use client';
import { useState, useEffect } from 'react';
import { executeShare, getSharePlatforms, shareHandlers } from '@/src/lib/share-handlers';
import { analytics } from '@/src/lib/analytics';

export default function ShareSheet({ 
  show, 
  onClose, 
  app, 
  run = null, 
  assetUrl = null 
}) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const hasImage = !!assetUrl;
  const isResult = !!run;
  const platforms = getSharePlatforms(hasImage);
  
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [show, onClose]);
  
  // Lock body scroll when open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);
  
  const handleShare = async (platformId) => {
    if (sharing) return;
    
    setSharing(true);
    
    try {
      // Track analytics with creator_id
      analytics.appShared(app.id, app.name, app.creator_id, platformId);
      
      // Execute share
      const result = await executeShare(platformId, app, run, assetUrl);
      
      // Show feedback for copy action
      if (platformId === 'copyLink') {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          onClose();
        }, 1500);
      } else if (platformId === 'saveImage') {
        // Close after successful save
        setTimeout(onClose, 500);
      } else {
        // Close immediately for other platforms
        setTimeout(onClose, 300);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert(error.message || 'Failed to share');
    } finally {
      setSharing(false);
    }
  };
  
  const handleNativeShare = async () => {
    if (sharing) return;
    
    setSharing(true);
    
    try {
      analytics.appShared(app.id, app.name, app.creator_id, 'native_share');
      await shareHandlers.nativeShare(app, run, assetUrl);
      onClose();
    } catch (error) {
      console.error('Native share error:', error);
      if (error.message !== 'Native share not supported') {
        alert('Share was cancelled or failed');
      }
    } finally {
      setSharing(false);
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="share-sheet-overlay" onClick={onClose}>
      <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-sheet-header">
          <h3>Share {isResult ? 'result' : 'app'}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        
        {/* Preview */}
        <div className="share-preview">
          <div className="preview-card">
            {hasImage && (
              <div className="preview-image">
                <img src={assetUrl} alt={app.name} />
              </div>
            )}
            <div className="preview-content">
              <div className="preview-title">
                {isResult ? `My ${app.name} result` : app.name}
              </div>
              <div className="preview-description">
                {isResult ? `Created with ${app.name}` : app.description}
              </div>
            </div>
          </div>
        </div>
        
        {/* Platform buttons */}
        <div className="share-platforms">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              className="platform-btn"
              onClick={() => handleShare(platform.id)}
              disabled={sharing}
              style={{ '--platform-color': platform.color }}
            >
              <div className="platform-icon">{platform.icon}</div>
              <div className="platform-label">{platform.label}</div>
              {platform.id === 'copyLink' && copied && (
                <div className="copied-badge">✓</div>
              )}
            </button>
          ))}
        </div>
        
        {/* Native share button (like Twitter/X) */}
        {navigator.share && (
          <button 
            className="native-share-btn"
            onClick={handleNativeShare}
            disabled={sharing}
          >
            Share via...
          </button>
        )}
        
        {/* Cancel button */}
        <button className="cancel-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
      
      <style jsx>{`
        .share-sheet-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          z-index: 10000;
          display: flex;
          align-items: flex-end;
          animation: fadeIn 0.2s ease;
          padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .share-sheet {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          background: #1a1a1a;
          border-radius: 24px 24px 0 0;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .share-sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 20px 16px;
          border-bottom: 1px solid #333;
        }
        
        .share-sheet-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }
        
        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .close-btn:active {
          transform: scale(0.95);
        }
        
        .share-preview {
          padding: 16px 20px;
          background: #0f0f0f;
        }
        
        .preview-card {
          background: #222;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #333;
        }
        
        .preview-image {
          width: 100%;
          aspect-ratio: 16/9;
          background: #000;
          overflow: hidden;
        }
        
        .preview-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .preview-content {
          padding: 12px 16px;
        }
        
        .preview-title {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }
        
        .preview-description {
          font-size: 13px;
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .share-platforms {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 12px;
          padding: 20px;
        }
        
        .platform-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        
        .platform-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--platform-color);
          transform: translateY(-2px);
        }
        
        .platform-btn:active {
          transform: scale(0.95);
        }
        
        .platform-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .platform-icon {
          font-size: 32px;
          line-height: 1;
        }
        
        .platform-label {
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-align: center;
        }
        
        .copied-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #10b981;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          animation: pop 0.3s ease;
        }
        
        @keyframes pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .native-share-btn {
          width: calc(100% - 40px);
          margin: 0 20px 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .native-share-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .native-share-btn:active {
          transform: scale(0.98);
        }
        
        .native-share-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .cancel-btn {
          width: calc(100% - 40px);
          margin: 0 20px 20px;
          padding: 16px;
          background: transparent;
          border: 1px solid #333;
          border-radius: 16px;
          color: #888;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .cancel-btn:hover {
          border-color: #555;
          color: white;
        }
        
        .cancel-btn:active {
          transform: scale(0.98);
        }
        
        @media (max-width: 768px) {
          .share-sheet {
            border-radius: 24px 24px 0 0;
          }
          
          .share-platforms {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
