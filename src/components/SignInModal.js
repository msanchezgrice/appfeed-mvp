'use client';
import { useRouter } from 'next/navigation';

export default function SignInModal({ show, onClose, message, action }) {
  if (!show) return null;

  const router = useRouter();

  const handleSignIn = () => {
    const currentPath = window.location.pathname;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`);
  };

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
        background: 'rgba(0,0,0,0.8)',
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
          padding: 32,
          maxWidth: 400,
          width: '100%',
          border: '1px solid #333'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 24 }}>Sign In Required</h2>
          <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
            {message || `Sign in to ${action || 'continue'}`}
          </p>
        </div>

        <button
          onClick={handleSignIn}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: 12
          }}
        >
          Sign In to Continue
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: 12,
            color: '#888',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

