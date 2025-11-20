'use client';
import { useEffect, useState } from 'react';

const generatingPhrases = [
  '✨ Conjuring magic...',
  '🎨 Painting pixels...',
  '🚀 Launching creativity...',
  '⚡ Sparking ideas...',
  '🎪 Setting up the show...',
  '🎯 Aiming for awesome...',
  '🎬 Lights, camera, action...',
  '🎵 Composing masterpiece...',
  '🌟 Sprinkling stardust...',
  '🎲 Rolling the dice...',
  '🔮 Reading the future...',
  '🎭 Breaking a leg...',
  '🎨 Mixing colors...',
  '🌈 Chasing rainbows...',
  '🚂 All aboard...',
  '🎪 The show must go on...',
  '🎨 Crafting awesomeness...',
  '⚙️ Turning gears...',
  '🎯 Taking aim...',
  '🌟 Reaching for stars...'
];

export default function GeneratingAnimation({ show }) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Change phrase every 1.5 seconds
      const interval = setInterval(() => {
        setCurrentPhrase(prev => (prev + 1) % generatingPhrases.length);
      }, 1500);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div style={{
        textAlign: 'center',
        maxWidth: '90%',
        padding: 32
      }}>
        {/* Spinning gradient circle */}
        <div style={{
          width: 120,
          height: 120,
          margin: '0 auto 32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          animation: 'spin 2s linear infinite, pulse 1.5s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
        }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48
          }}>
            ⚡
          </div>
        </div>

        {/* Cycling phrases */}
        <h2 
          key={currentPhrase}
          style={{
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 16,
            animation: 'slideUp 0.5s ease-out',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          {generatingPhrases[currentPhrase]}
        </h2>

        {/* Subtitle */}
        <p style={{
          color: '#888',
          fontSize: 14,
          marginBottom: 32
        }}>
          Your creation is on its way
        </p>

        {/* Loading dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#667eea',
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
              }}
            />
          ))}
        </div>

        {/* Fun tip */}
        <div style={{
          marginTop: 48,
          padding: '16px 24px',
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: 12,
          fontSize: 13,
          color: '#aaa'
        }}>
          💡 <strong style={{ color: '#fff' }}>Tip:</strong> Try sharing your creations to inspire others!
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-12px);
          }
        }
      `}</style>
    </div>
  );
}
