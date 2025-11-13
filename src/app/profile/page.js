'use client';
import { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

export default function ProfilePage() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState([]);
  const [apps, setApps] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('myapps'); // 'myapps', 'following', 'analytics', 'settings'
  const [myAppsView, setMyAppsView] = useState('saved'); // 'saved' or 'created' (within My Apps tab)
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalTries: 0,
    totalUses: 0,
    totalSaves: 0,
    totalRemixes: 0,
    followers: 0
  });

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (!clerkUser) return;

    (async () => {
      const userId = clerkUser.id;
      
      // Sync profile to Supabase if it doesn't exist (workaround for webhook delays)
      try {
        await fetch('/api/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: clerkUser.id,
            username: clerkUser.username,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            displayName: clerkUser.fullName || clerkUser.username,
            avatarUrl: clerkUser.imageUrl
          })
        });
      } catch (err) {
        console.error('[Profile] Error syncing profile:', err);
      }
      
      // Fetch all apps (including user's unpublished apps for the Created tab)
      const appsRes = await fetch(`/api/apps?includeUnpublished=true&userId=${userId}`);
      const appsData = await appsRes.json();
      console.log('[Profile] Apps data received:', { count: appsData.apps?.length, includesUnpublished: true });
      setApps(appsData.apps || []);

      const libRes = await fetch('/api/library');
      const libData = await libRes.json();
      console.log('[Profile] Library data received:', libData);
      setLibrary(libData.items || []);

      // Get user info from Clerk
      setUser({
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.username || 'User',
        avatar: clerkUser.imageUrl || '/avatars/2.svg',
        email: clerkUser.primaryEmailAddress?.emailAddress
      });

      // Load existing API keys - Note: API returns status, not actual keys for security
      // Keys are stored encrypted and not returned to client
      // We just show placeholder if keys exist
      const secretsRes = await fetch('/api/secrets');
      const secretsData = await secretsRes.json();
      if (secretsData.providers) {
        // Don't load actual keys - they're encrypted and stay server-side
        // Just show placeholder if present
        setOpenaiKey(secretsData.providers.openai === 'present' ? '••••••••' : '');
        setAnthropicKey(secretsData.providers.anthropic === 'present' ? '••••••••' : '');
        setGeminiKey(secretsData.providers.gemini === 'present' ? '••••••••' : '');
      }

      // Calculate analytics for created apps from real data
      const userApps = appsData.apps.filter(app => app.creator_id === userId);
      const totalViews = userApps.reduce((sum, app) => sum + (app.view_count || 0), 0);
      const totalTries = userApps.reduce((sum, app) => sum + (app.try_count || 0), 0);
      const totalUses = userApps.reduce((sum, app) => sum + (app.use_count || 0), 0);
      const totalSaves = userApps.reduce((sum, app) => sum + (app.save_count || 0), 0);
      const totalRemixes = userApps.reduce((sum, app) => sum + (app.remix_count || 0), 0);

      // Get real follower count and following list from database
      const followRes = await fetch('/api/follow');
      const followData = await followRes.json();
      const followers = followData.followers?.length || 0;
      setFollowing(followData.following || []);

      setAnalytics({
        totalViews,
        totalTries,
        totalUses,
        totalSaves,
        totalRemixes,
        followers
      });
    })();
  }, [clerkUser, isLoaded, isSignedIn, router]);

  const saveApiKeys = async () => {
    try {
      const updates = [];
      // Only send if user actually entered a key (not the placeholder)
      if (openaiKey && openaiKey !== '••••••••') {
        updates.push({ key: 'OPENAI_API_KEY', value: openaiKey });
      }
      if (anthropicKey && anthropicKey !== '••••••••') {
        updates.push({ key: 'ANTHROPIC_API_KEY', value: anthropicKey });
      }
      if (geminiKey && geminiKey !== '••••••••') {
        updates.push({ key: 'GEMINI_API_KEY', value: geminiKey });
      }

      if (updates.length === 0) {
        setSaveMessage('Please enter at least one API key to save.');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }

      for (const { key, value } of updates) {
        console.log('[Profile] Saving API key:', key);
        const response = await fetch('/api/secrets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[Profile] API error response:', errorData);
          throw new Error(errorData.details || errorData.error || 'Failed to save key');
        }
        
        const result = await response.json();
        console.log('[Profile] Save successful:', result);
      }

      setSaveMessage('✅ API keys saved successfully!');
      setTimeout(() => {
        setSaveMessage('');
        // Reload to show placeholder
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('[Profile] Error saving keys:', error);
      setSaveMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const savedApps = library.map(item => {
    // Handle both formats: item might be the app itself or {app_id: ...}
    const appId = item.app_id || item.id;
    const app = apps.find(app => app.id === appId) || item;
    console.log('[Profile] Mapping library item:', appId, '→ app found:', !!app);
    return app;
  }).filter(Boolean);
  
  // Show both published AND unpublished apps the user created
  const createdApps = apps.filter(app => {
    const isCreator = app.creator_id === clerkUser?.id;
    console.log('[Profile] Checking app:', app.id, 'creator_id:', app.creator_id, 'user:', clerkUser?.id, 'match:', isCreator);
    return isCreator;
  });

  console.log('[Profile] Display state:', {
    activeTab,
    savedAppsCount: savedApps.length,
    createdAppsCount: createdApps.length,
    libraryItemsCount: library.length,
    totalAppsCount: apps.length
  });

  const displayApps = activeTab === 'saved' ? savedApps : createdApps;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 0', paddingBottom: '100px', minHeight: 'calc(100vh - 60px)' }}>
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
        <p style={{ margin: 0, color: '#888', fontSize: 14 }}>{user?.email || user?.id}</p>
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
        <button
          onClick={() => setActiveTab('following')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'following' ? '2px solid #fe2c55' : '2px solid transparent',
            color: activeTab === 'following' ? '#fff' : '#888',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Following ({following.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid #fe2c55' : '2px solid transparent',
            color: activeTab === 'analytics' ? '#fff' : '#888',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #fe2c55' : '2px solid transparent',
            color: activeTab === 'settings' ? '#fff' : '#888',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Settings
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: 20 }}>Your Performance</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}>
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand)' }}>
                {analytics.totalViews.toLocaleString()}
              </div>
              <div className="small" style={{ marginTop: 4 }}>Total Views</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand)' }}>
                {analytics.totalTries.toLocaleString()}
              </div>
              <div className="small" style={{ marginTop: 4 }}>Total Tries</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand2)' }}>
                {analytics.totalUses.toLocaleString()}
              </div>
              <div className="small" style={{ marginTop: 4 }}>Total Uses</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand2)' }}>
                {analytics.totalSaves.toLocaleString()}
              </div>
              <div className="small" style={{ marginTop: 4 }}>Total Saves</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fe2c55' }}>
                {analytics.totalRemixes.toLocaleString()}
              </div>
              <div className="small" style={{ marginTop: 4 }}>Total Remixes</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fe2c55' }}>
                {analytics.followers.toLocaleString()}
              </div>
              <div className="small" style={{ marginTop: 4 }}>Followers</div>
            </div>
          </div>

          <h3 style={{ marginBottom: 16 }}>App Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {createdApps.map(app => (
              <div key={app.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0 }}>{app.name}</h4>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: 12
                }}>
                  <div>
                    <div className="small">Views</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {(app.view_count || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="small">Tries</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {(app.try_count || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="small">Uses</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {(app.use_count || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="small">Saves</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {(app.save_count || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="small">Remixes</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {(app.remix_count || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ marginTop: 0 }}>API Keys</h3>
          <p className="small" style={{ marginBottom: 20 }}>
            Your API keys are encrypted and stored securely. They're used to power apps that require AI capabilities.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              OpenAI API Key
            </label>
            <input
              type="password"
              className="input"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              style={{ width: '100%' }}
            />
            <p className="small" style={{ marginTop: 4 }}>
              Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>platform.openai.com</a>
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              Anthropic API Key
            </label>
            <input
              type="password"
              className="input"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              style={{ width: '100%' }}
            />
            <p className="small" style={{ marginTop: 4 }}>
              Get your key from <a href="https://console.anthropic.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>console.anthropic.com</a>
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>
              Google Gemini API Key
            </label>
            <input
              type="password"
              className="input"
              placeholder="AIza..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              style={{ width: '100%' }}
            />
            <p className="small" style={{ marginTop: 4 }}>
              Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>Google AI Studio</a>
            </p>
          </div>

          <button
            onClick={saveApiKeys}
            className="btn primary"
            style={{ width: '100%' }}
          >
            Save API Keys
          </button>

          {saveMessage && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: saveMessage.includes('success') ? '#10b981' : '#ef4444',
              borderRadius: 8,
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {saveMessage}
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={() => signOut(() => router.push('/'))}
            className="btn"
            style={{
              width: '100%',
              marginTop: 16,
              background: '#ef4444',
              color: 'white'
            }}
          >
            Sign Out
          </button>
        </div>
      ) : activeTab === 'following' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {following.length > 0 ? (
            following.map(follow => (
              <div
                key={follow.following_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 16,
                  background: '#1a1a1a',
                  borderRadius: 12,
                  gap: 12,
                  cursor: 'pointer'
                }}
                onClick={() => router.push(`/profile/${follow.following_id}`)}
              >
                <img
                  src={follow.avatar_url || '/avatars/1.svg'}
                  alt={follow.username}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {follow.display_name || follow.username}
                  </div>
                  <div style={{ fontSize: 14, color: '#888' }}>
                    @{follow.username}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              Not following anyone yet
            </div>
          )}
        </div>
      ) : (
        <div>
          {displayApps.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
              marginTop: 8
            }}>
              {displayApps.map(app => (
                  <div
                    key={app.id}
                    style={{
                      aspectRatio: '1',
                      background: app.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <a
                      href={`/app/${app.id}`}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        textDecoration: 'none'
                      }}
                    >
                  {app.preview_url && (
                    <img
                      src={app.preview_url}
                      alt={app.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      />
                    )}
                    </a>
                    
                    {/* App title overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      padding: '8px',
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      maxHeight: 40,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {app.name}
                    </div>
                    
                    {/* Stats overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '4px 6px',
                      background: 'rgba(0,0,0,0.7)',
                      fontSize: 10,
                      color: 'white',
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'center'
                    }}>
                      <span>👁️ {app.view_count || 0}</span>
                      <span>🎯 {app.try_count || 0}</span>
                    </div>
                    
                    {/* Delete button (only for created apps) */}
                    {myAppsView === 'created' && app.creator_id === userId && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          if (confirm(`Delete "${app.name}"? This cannot be undone.`)) {
                            try {
                              await fetch(`/api/apps/${app.id}`, { method: 'DELETE' });
                              // Refresh apps list
                              window.location.reload();
                            } catch (err) {
                              alert('Error deleting app');
                            }
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: 'rgba(0,0,0,0.8)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete app"
                      >
                        ×
                      </button>
                    )}
                  </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              {activeTab === 'saved' ? 'No saved apps yet' : 'No created apps yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
