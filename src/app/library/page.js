'use client';
import { useEffect, useState } from 'react';
import FeedCard from '@/src/components/FeedCard';

function uid() { return (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'u_jamie'; }
async function api(path) {
  const res = await fetch(path, { headers: { 'x-user-id': uid() } });
  return await res.json();
}

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { (async () => setItems((await api('/api/library')).items))(); }, []);
  return (
    <div>
      <h1>My Library</h1>
      <p className="small">Saved apps and remixes</p>
      <div className="grid" style={{marginTop:16}}>
        {items.map(app => <FeedCard key={app.id} app={app} />)}
      </div>
    </div>
  );
}
