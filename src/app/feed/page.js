'use client';
import { useEffect, useState } from 'react';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

export default function FeedPage() {
  const [apps, setApps] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/apps');
      const j = await res.json();
      setApps(j.apps);
      setTags(j.tags);
    })();
  }, []);

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '0'
    }}>
      <div className="feed-scroll" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {apps.map(app => <TikTokFeedCard key={app.id} app={app} />)}
      </div>
    </div>
  );
}
