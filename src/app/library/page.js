'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

export default function LibraryPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/library');
      return;
    }

    if (!user) return;

    (async () => {
      try {
        const res = await fetch('/api/library');
        if (res.ok) {
          const data = await res.json();
          console.log('[Library] Data received:', data);
          setItems(data.items || []);
        } else {
          console.error('[Library] API error:', res.status);
          setItems([]);
        }
      } catch (err) {
        console.error('[Library] Error fetching library:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isLoaded, isSignedIn, router]);

  if (!isLoaded || loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Redirect happens in useEffect
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 0', paddingBottom: '100px', minHeight: 'calc(100vh - 60px)' }}>
      <h1 style={{ marginBottom: 8 }}>My Library</h1>
      <p className="small" style={{ marginBottom: 24, color: '#888' }}>Apps you've saved</p>
      
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p>No saved apps yet</p>
          <p className="small">Save apps from the feed to see them here!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(app => (
            <TikTokFeedCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
