'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const USERS = [
  { id: 'u_alex', name: 'Alex' },
  { id: 'u_jamie', name: 'Jamie' }
];

export default function Navbar() {
  const [uid, setUid] = useState('u_jamie');

  useEffect(() => {
    const existing = localStorage.getItem('uid') || 'u_jamie';
    setUid(existing);
  }, []);

  useEffect(() => {
    if (uid) localStorage.setItem('uid', uid);
  }, [uid]);

  return (
    <div className="nav">
      <Link href="/" className="row" style={{gap:8}}>
        <img src="/logo.svg" width={28} height={28} alt="logo" />
        <strong>AppFeed</strong>
      </Link>
      <div className="row" style={{gap:6}}>
        <Link className="btn ghost" href="/">Feed</Link>
        <Link className="btn ghost" href="/library">Library</Link>
        <Link className="btn ghost" href="/secrets">Secrets</Link>
      </div>
      <div className="spacer" />
      <div className="row">
        <span className="small">User</span>
        <select className="input" value={uid} onChange={e => setUid(e.target.value)} style={{width:160}}>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
        </select>
      </div>
    </div>
  );
}
