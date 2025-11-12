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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#000'
    }}>
      <p style={{ color: '#888' }}>Redirecting to feed...</p>
    </div>
  );
}
