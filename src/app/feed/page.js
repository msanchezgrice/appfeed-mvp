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
    <>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0',
        width: '100%'
      }}>
        <div className="feed-scroll" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '0 8px'
        }}>
          {apps.map(app => <TikTokFeedCard key={app.id} app={app} />)}
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .feed-scroll {
            padding: 0 16px !important;
          }
        }

        @media (max-width: 767px) {
          .feed-scroll {
            gap: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
