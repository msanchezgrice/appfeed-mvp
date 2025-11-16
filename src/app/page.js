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
        background: 'var(--bg)',
        padding: 16
      }}>
        <div className="skeleton" style={{ width: '90%', maxWidth: 480, height: 12, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: '70%', maxWidth: 360, height: 12, borderRadius: 999 }} />
        <p style={{ color: '#888', marginTop: 8 }}>Redirecting to feed…</p>
      </div>
    </>
  );
}
