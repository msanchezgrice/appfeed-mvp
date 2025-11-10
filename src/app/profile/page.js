'use client';
import { useEffect, useState } from 'react';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

function uid() {
  return (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'u_jamie';
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState([]);
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState('saved');

  useEffect(() => {
    (async () => {
      const userId = uid();
      const appsRes = await fetch('/api/apps');
      const appsData = await appsRes.json();
      setApps(appsData.apps);

      const libRes = await fetch('/api/library');
      const libData = await libRes.json();
      setLibrary(libData.items);

      // Get user info from creators
      const creator = appsData.apps[0]?.creator || { id: userId, name: userId, avatar: '/avatars/2.svg' };
      setUser(creator);
    })();
  }, []);

  const savedApps = library.map(item => apps.find(app => app.id === item.id)).filter(Boolean);
  const createdApps = apps.filter(app => app.creatorId === uid());

  const displayApps = activeTab === 'saved' ? savedApps : createdApps;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img
          src={user?.avatar || '/avatars/2.svg'}
          alt={user?.name}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            marginBottom: 12
          }}
        />
        <h2 style={{ margin: '0 0 4px 0' }}>{user?.name || 'User'}</h2>
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>@{user?.id || uid()}</p>
        {user?.bio && (
          <p style={{ margin: '12px 0 0 0', color: '#ccc', fontSize: 14 }}>{user.bio}</p>
        )}
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
        marginBottom: 24
      }}>
        <button
          onClick={() => setActiveTab('saved')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'saved' ? '2px solid #fe2c55' : '2px solid transparent',
            color: activeTab === 'saved' ? '#fff' : '#888',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Saved ({savedApps.length})
        </button>
        <button
          onClick={() => setActiveTab('created')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'created' ? '2px solid #fe2c55' : '2px solid transparent',
            color: activeTab === 'created' ? '#fff' : '#888',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Created ({createdApps.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayApps.length > 0 ? (
          displayApps.map(app => <TikTokFeedCard key={app.id} app={app} />)
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            {activeTab === 'saved' ? 'No saved apps yet' : 'No created apps yet'}
          </div>
        )}
      </div>
    </div>
  );
}
