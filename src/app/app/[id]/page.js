'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import FeedCard from '@/src/components/FeedCard';

export default function AppDetailPage() {
  const params = useParams();
  const [app, setApp] = useState(null);
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/apps/${params.id}`);
      const j = await res.json();
      setApp({ ...j.app, creator: j.creator });
    })();
  }, [params.id]);
  if (!app) return <div>Loading…</div>;
  return (
    <div>
      <h1>{app.name}</h1>
      <p className="small">Creator: {app?.creator?.name} • App ID: {app.id}</p>
      <div style={{marginTop:16}}>
        <FeedCard app={app} />
      </div>
    </div>
  );
}
