'use client';

export default function SuccessModal({ show, title, message, actionText, onAction, onClose }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)', // Darker for contrast
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(8px)' // Blur background
    }}>
      <div style={{
        background: '#1a1a1a', // Solid dark background
        borderRadius: 16,
        padding: 32,
        maxWidth: 400,
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
        border: '1px solid #333' // Border for definition
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 22 }}>
          {title || 'Success!'}
        </h2>
        <p style={{ marginBottom: 24, color: '#888', fontSize: 15 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {onAction && (
            <button
              onClick={onAction}
              className="btn primary"
              style={{ padding: '12px 24px', fontSize: 15 }}
            >
              {actionText || 'Continue'}
            </button>
          )}
          <button
            onClick={onClose}
            className="btn ghost"
            style={{ padding: '12px 24px', fontSize: 15 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

