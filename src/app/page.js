'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to feed (homepage is now the feed)
    router.push('/feed');
  }, [router]);

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minHeight: '100vh',
        background: '#000',
        padding: 16
      }}>
        <div style={{ width: '90%', maxWidth: 480, height: 12, borderRadius: 999, background: '#0f0f0f', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: '70%', maxWidth: 360, height: 12, borderRadius: 999, background: '#0f0f0f', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <p style={{ color: '#888', marginTop: 8 }}>Redirecting to feed…</p>
      </div>
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
