'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';
import SignInModal from '@/src/components/SignInModal';
import { analytics } from '@/src/lib/analytics';

function uid() {
  return (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'u_jamie';
}

async function api(path, method = 'GET', body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-user-id': uid() },
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

export default function UserProfilePage() {
  const { user } = useUser();
  const params = useParams();
  const userId = params.id;

  const [profileUser, setProfileUser] = useState(null);
  const [apps, setApps] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('apps');
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    (async () => {
      const appsRes = await api('/api/apps');
      const allApps = appsRes.apps;

      // Fix: Use creator_id instead of creatorId
      const creatorApps = allApps.filter(app => app.creator_id === userId);
      setApps(creatorApps);

      // Get creator info from first app's creator object
      if (creatorApps.length > 0 && creatorApps[0].creator) {
        setProfileUser({
          name: creatorApps[0].creator.display_name || creatorApps[0].creator.username,
          avatar: creatorApps[0].creator.avatar_url,
          bio: creatorApps[0].creator.bio
        });
      } else {
        // Fetch user info from profiles if no apps
        try {
          const userRes = await fetch(`/api/profile/${userId}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setProfileUser({
              name: userData.display_name || userData.username,
              avatar: userData.avatar_url,
              bio: userData.bio
            });
          }
        } catch (err) {
          console.error('Error loading user:', err);
        }
      }

      // Check if following
      const followRes = await api('/api/follow');
      const following = followRes.following || [];
      setIsFollowing(following.some(f => f.following_id === userId));
    })();
  }, [userId]);

  const handleFollow = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    const action = isFollowing ? 'unfollow' : 'follow';
    await api('/api/follow', 'POST', { creatorId: userId, action });

    // Track follow/unfollow event
    if (action === 'follow') {
      analytics.userFollowed(userId, profileUser?.name || userId);
    } else {
      analytics.userUnfollowed(userId);
    }

    setIsFollowing(!isFollowing);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img
          src={profileUser?.avatar || '/avatars/1.svg'}
          alt={profileUser?.name}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            marginBottom: 12
          }}
        />
        <h2 style={{ margin: '0 0 4px 0' }}>{profileUser?.name || userId}</h2>
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>@{userId}</p>
        {profileUser?.bio && (
          <p style={{ margin: '12px 0 0 0', color: '#ccc', fontSize: 14 }}>{profileUser.bio}</p>
        )}

        {userId !== uid() ? (
          <button
            onClick={handleFollow}
            style={{
              marginTop: 16,
              padding: '10px 32px',
              background: isFollowing ? '#333' : '#fe2c55',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        ) : (
          <Link
            href="/me/analytics"
            style={{
              marginTop: 16,
              padding: '10px 32px',
              background: '#fe2c55',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 16,
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
              textAlign: 'center'
            }}
          >
            📊 View Analytics
          </Link>
        )}
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
        marginBottom: 24
      }}>
        <button
          onClick={() => setActiveTab('apps')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'apps' ? '2px solid #fe2c55' : '2px solid transparent',
            color: activeTab === 'apps' ? '#fff' : '#888',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Apps ({apps.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {apps.length > 0 ? (
          apps.map(app => <TikTokFeedCard key={app.id} app={app} />)
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            No apps yet
          </div>
        )}
      </div>

      <SignInModal
        show={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        message="Sign in to follow creators"
      />
    </div >
  );
}
