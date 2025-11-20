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
  const usernameOrId = params.id; // Can be username or clerk user ID

  const [profileUser, setProfileUser] = useState(null);
  const [apps, setApps] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('apps');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [actualUserId, setActualUserId] = useState(null);

  useEffect(() => {
    (async () => {
      // First, fetch profile to get actual user ID (supports username lookup)
      try {
        const profileRes = await fetch(`/api/profile?identifier=${encodeURIComponent(usernameOrId)}`);
        if (!profileRes.ok) {
          console.error('Profile not found');
          return;
        }
        
        const { profile } = await profileRes.json();
        setActualUserId(profile.id);
        setProfileUser({
          name: profile.display_name || profile.username,
          avatar: profile.avatar_url,
          bio: profile.bio,
          username: profile.username
        });

        // Fetch apps for this creator
        const appsRes = await api('/api/apps');
        const allApps = appsRes.apps;
        const creatorApps = allApps.filter(app => app.creator_id === profile.id);
        setApps(creatorApps);

        // Check if following
        const followRes = await api('/api/follow');
        const following = followRes.following || [];
        setIsFollowing(following.some(f => f.following_id === profile.id));

        // Track profile view
        analytics.profileViewed(profile.id);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    })();
  }, [usernameOrId]);

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
        <h2 style={{ margin: '0 0 4px 0' }}>{profileUser?.name || usernameOrId}</h2>
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>@{profileUser?.username || usernameOrId}</p>
        {profileUser?.bio && (
          <p style={{ margin: '12px 0 0 0', color: '#ccc', fontSize: 14 }}>{profileUser.bio}</p>
        )}

        {actualUserId !== uid() ? (
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
