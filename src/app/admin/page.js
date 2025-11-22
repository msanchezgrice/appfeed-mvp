'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    // Restore last active tab from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminActiveTab') || 'overview';
    }
    return 'overview';
  }); // 'overview', 'apps', 'creators', 'viral', 'growth'
  const [stats, setStats] = useState(null);
  const [topApps, setTopApps] = useState([]);
  const [manageApps, setManageApps] = useState([]); // dedicated list for Manage tab
  const [viralityLeaderboard, setViralityLeaderboard] = useState([]);
  const [followerLeaderboard, setFollowerLeaderboard] = useState([]);
  const [growthByDay, setGrowthByDay] = useState([]);
  const [growthByWeek, setGrowthByWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('day'); // 'day', 'week', 'all' - default to today
  const [growthFilter, setGrowthFilter] = useState('day'); // 'day', 'week', 'month'
  const [selectedApp, setSelectedApp] = useState(null); // For modal preview
  const [fetchedKey, setFetchedKey] = useState(null); // cache last fetch key
  const [userStats, setUserStats] = useState({ newUsers: 0, returningUsers: 0 }); // Users tab
  const [manageSearch, setManageSearch] = useState('');
  const [manageStatus, setManageStatus] = useState('all'); // all | published | unpublished
  const [generatingPreviewId, setGeneratingPreviewId] = useState(null);

  // Check admin access
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in?redirect_url=/admin');
      return;
    }
    
    // Check if user is admin (you can set this in Clerk dashboard)
    const isAdmin = user?.publicMetadata?.role === 'admin' || 
                    user?.emailAddresses?.[0]?.emailAddress === 'msanchezgrice@gmail.com';
    
    if (isLoaded && !isAdmin) {
      alert('Unauthorized - Admin access only');
      router.push('/feed');
      return;
    }
  }, [user, isLoaded, router]);

  // Fetch lightweight overview once (kept separate to avoid heavy queries)
  useEffect(() => {
    if (!user) return;
    setLoading(false);
    const loadOverview = async () => {
      try {
        const res = await fetch('/api/admin/simple-stats', { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const data = await res.json();
          if (data.overview) setStats(data.overview);
        }
      } catch (err) {
        console.error('[Admin] Overview fetch error:', err);
      }
    };
    loadOverview();
  }, [user]);

  // Persist active tab to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminActiveTab', activeTab);
    }
  }, [activeTab]);

  // Lazily fetch tab-specific data only when that tab is active
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'overview') return;

    const key = `${activeTab}:${activeTab === 'growth' ? growthFilter : timeFilter}`;
    if (fetchedKey === key) return; // simple memo to avoid repeat fetches

    const fetchTab = async () => {
      try {
        // Special case: Manage tab needs full app list (including unpublished) for admins
        if (activeTab === 'manage') {
          const res = await fetch(`/api/apps?includeUnpublished=true&limit=500`, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) {
            console.error('[Admin] Manage fetch failed:', res.status);
            return;
          }
          const data = await res.json();
          if (Array.isArray(data.apps)) {
            setManageApps(data.apps);
            console.log('[Admin] Manage apps loaded:', data.apps.length);
          } else {
            setManageApps([]);
          }
          setFetchedKey(key);
          return;
        }

        const time = activeTab === 'growth' ? growthFilter : timeFilter;
        const url = `/api/admin/stats?tab=${activeTab}&time=${time}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) {
          console.error('[Admin] Stats fetch failed:', res.status);
          return;
        }
        const data = await res.json();
        if (data.overview) setStats(data.overview);
        if (activeTab === 'apps' && data.topApps) setTopApps(data.topApps);
        if (activeTab === 'viral' && data.viralityLeaderboard) setViralityLeaderboard(data.viralityLeaderboard);
        if (activeTab === 'creators' && data.followerLeaderboard) setFollowerLeaderboard(data.followerLeaderboard);
        if (activeTab === 'growth') {
          if (data.growthByDay) setGrowthByDay(data.growthByDay);
          if (data.growthByWeek) setGrowthByWeek(data.growthByWeek);
        }
        if (activeTab === 'users' && data.users) {
          setUserStats({
            newUsers: data.users.newUsers || 0,
            returningUsers: data.users.returningUsers || 0
          });
        }
        setFetchedKey(key);
      } catch (err) {
        console.error('[Admin] Tab fetch error:', err);
      }
    };
    fetchTab();
  }, [user, activeTab, timeFilter, growthFilter, fetchedKey]);

  if (!isLoaded) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!user) return null;
  
  // Show UI immediately, data loads in background

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 16px', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>🔐 Clipcade Admin</h1>
            <p className="small" style={{ color: '#888' }}>
              Logged in as: {user.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {stats?.cached && (
            <span className="small" style={{ color: '#888', padding: '8px 12px' }}>
              Cached: {new Date(stats.lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={async () => {
              alert('⚠️ Manual refresh temporarily disabled.\n\nStats will auto-refresh nightly at midnight.\n\nThis prevents database overload.');
            }}
            className="btn ghost"
            style={{ fontSize: 13, padding: '8px 16px', opacity: 0.5 }}
            disabled
          >
            🔄 Refresh Stats (Disabled)
          </button>
        </div>
      </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #333', paddingBottom: 0, overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '3px solid var(--brand)' : '3px solid transparent',
              color: activeTab === 'overview' ? 'white' : '#888',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: '-2px',
              whiteSpace: 'nowrap'
            }}
          >
            ⚡ Quick View
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'apps' ? '3px solid var(--brand)' : '3px solid transparent',
              color: activeTab === 'apps' ? 'white' : '#888',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            🔥 Top Apps
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'creators' ? '3px solid var(--brand)' : '3px solid transparent',
              color: activeTab === 'creators' ? 'white' : '#888',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            👥 Top Creators
          </button>
          <button
            onClick={() => setActiveTab('viral')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'viral' ? '3px solid var(--brand)' : '3px solid transparent',
              color: activeTab === 'viral' ? 'white' : '#888',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            🚀 Viral Apps
          </button>
          <button
            onClick={() => setActiveTab('growth')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'growth' ? '3px solid var(--brand)' : '3px solid transparent',
              color: activeTab === 'growth' ? 'white' : '#888',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📈 Growth
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid var(--brand)' : '3px solid transparent',
              color: activeTab === 'users' ? 'white' : '#888',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            👤 Users
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'manage' ? '3px solid var(--brand)' : '3px solid transparent',
              color: activeTab === 'manage' ? 'white' : '#888',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: '-2px',
              whiteSpace: 'nowrap'
            }}
          >
            🗑️ Manage
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 16 }}>📊 Platform Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand)' }}>{stats?.totalApps || 0}</div>
            <div className="small" style={{ color: '#888', marginTop: 4 }}>Total Apps</div>
            <div className="small" style={{ color: '#10b981', marginTop: 4 }}>
              +{stats?.appsToday || 0} today
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand)' }}>{stats?.totalUsers || 0}</div>
            <div className="small" style={{ color: '#888', marginTop: 4 }}>Total Users</div>
            <div className="small" style={{ color: '#10b981', marginTop: 4 }}>
              +{stats?.signupsToday || 0} today
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand)' }}>
              {stats?.totalViews?.toLocaleString() || 0}
            </div>
            <div className="small" style={{ color: '#888', marginTop: 4 }}>Total Views</div>
            <div className="small" style={{ color: '#888', marginTop: 4 }}>
              ~{stats?.avgViews || 0}/app
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--brand)' }}>
              {stats?.totalTries?.toLocaleString() || 0}
            </div>
            <div className="small" style={{ color: '#888', marginTop: 4 }}>Total Tries</div>
            <div className="small" style={{ color: '#fbbf24', marginTop: 4 }}>
              {stats?.conversionRate || 0}% conversion
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>📊 Quick Overview</h2>
          <p className="small" style={{ color: '#888', marginBottom: 20 }}>
            Lightweight stats that load instantly without heavy queries
          </p>
          <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
              Platform is operational ✅
            </div>
            <div style={{ fontSize: 14, color: '#888' }}>
              Check individual tabs for detailed stats (may take longer to load)
            </div>
          </div>
        </div>
      )}

      {activeTab === 'apps' && (
        <div>
          {/* Top Apps */}
          <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>🔥 Top Apps (by Views)</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setTimeFilter('day')}
              className="btn ghost"
              style={{
                background: timeFilter === 'day' ? 'var(--brand)' : 'transparent',
                color: timeFilter === 'day' ? 'white' : '#888',
                padding: '6px 12px',
                fontSize: 12
              }}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className="btn ghost"
              style={{
                background: timeFilter === 'week' ? 'var(--brand)' : 'transparent',
                color: timeFilter === 'week' ? 'white' : '#888',
                padding: '6px 12px',
                fontSize: 12
              }}
            >
              Week
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className="btn ghost"
              style={{
                background: timeFilter === 'all' ? 'var(--brand)' : 'transparent',
                color: timeFilter === 'all' ? 'white' : '#888',
                padding: '6px 12px',
                fontSize: 12
              }}
            >
              All Time
            </button>
          </div>
        </div>
        <div style={{ background: 'var(--bg-dark)', borderRadius: 12, border: '1px solid #333', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#888' }}>#</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#888' }}>App Name</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Views</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Tries</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Saves</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Shares</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#888' }}>Creator</th>
              </tr>
            </thead>
            <tbody>
              {topApps.slice(0, 10).map((app, i) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 12, color: '#888' }}>{i + 1}</td>
                  <td style={{ padding: 12 }}>
                    <a href={`/app/${app.id}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>
                      {app.name}
                    </a>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{app.view_count || 0}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{app.try_count || 0}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{app.save_count || 0}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{app.share_count || 0}</td>
                  <td style={{ padding: 12, fontSize: 12, color: '#888' }}>
                    {app.creator?.display_name || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        </div>
      )}

      {activeTab === 'creators' && (
        <div>
          {/* Follower Leaderboard */}
          <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 16 }}>👥 Top Creators (by Followers)</h2>
        <div style={{ background: 'var(--bg-dark)', borderRadius: 12, border: '1px solid #333', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#888' }}>#</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#888' }}>Creator</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Followers</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Apps</th>
              </tr>
            </thead>
            <tbody>
              {followerLeaderboard.length > 0 ? followerLeaderboard.map((creator, i) => (
                <tr key={creator.userId} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 12, color: '#888' }}>{i + 1}</td>
                  <td style={{ padding: 12 }}>{creator.display_name}</td>
                  <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', color: 'var(--brand)' }}>
                    {creator.follower_count}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', color: '#888' }}>
                    {creator.app_count}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                    No followers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        </div>
      )}

      {activeTab === 'viral' && (
        <div>
          {/* Virality / K-Factor Leaderboard */}
          <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 16 }}>🚀 Virality Leaderboard (K-Factor)</h2>
        <p className="small" style={{ color: '#888', marginBottom: 12 }}>
          K-Factor = (Shares + Remixes) / Views. Higher = more viral. Min 10 views to qualify.
        </p>
        <div style={{ background: 'var(--bg-dark)', borderRadius: 12, border: '1px solid #333', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#888' }}>#</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#888' }}>App Name</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>K-Factor</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Share Rate<br/>(Views)</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Share Rate<br/>(Tries)</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Remix Rate<br/>(Views)</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>Remix Rate<br/>(Tries)</th>
              </tr>
            </thead>
            <tbody>
              {viralityLeaderboard.length > 0 ? viralityLeaderboard.map((app, i) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 12, color: '#888' }}>{i + 1}</td>
                  <td style={{ padding: 12 }}>
                    <a href={`/app/${app.id}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>
                      {app.name}
                    </a>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                    <span style={{ 
                      color: parseFloat(app.k_factor) > 0.5 ? '#10b981' : 
                             parseFloat(app.k_factor) > 0.2 ? '#fbbf24' : '#888'
                    }}>
                      {app.k_factor}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', color: '#888' }}>{app.share_rate_views}%</td>
                  <td style={{ padding: 12, textAlign: 'center', color: '#888' }}>{app.share_rate_tries}%</td>
                  <td style={{ padding: 12, textAlign: 'center', color: '#888' }}>{app.remix_rate_views}%</td>
                  <td style={{ padding: 12, textAlign: 'center', color: '#888' }}>{app.remix_rate_tries}%</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                    Not enough data yet (need apps with 10+ views)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        </div>
      )}

      {activeTab === 'growth' && (
        <div>
          {/* Growth Chart */}
          <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>📈 User Growth</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setGrowthFilter('day')}
              className="btn ghost"
              style={{
                background: growthFilter === 'day' ? 'var(--brand)' : 'transparent',
                color: growthFilter === 'day' ? 'white' : '#888',
                padding: '6px 12px',
                fontSize: 12
              }}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setGrowthFilter('week')}
              className="btn ghost"
              style={{
                background: growthFilter === 'week' ? 'var(--brand)' : 'transparent',
                color: growthFilter === 'week' ? 'white' : '#888',
                padding: '6px 12px',
                fontSize: 12
              }}
            >
              Last 4 Weeks
            </button>
          </div>
        </div>
        <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
          {growthFilter === 'day' ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200 }}>
              {growthByDay.map((day, i) => {
                const maxSignups = Math.max(...growthByDay.map(d => d.signups), 1);
                const height = (day.signups / maxSignups) * 160;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{day.signups}</div>
                    <div style={{
                      width: '100%',
                      height: height || 20,
                      background: 'var(--brand)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s'
                    }} />
                    <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200 }}>
              {growthByWeek.map((week, i) => {
                const maxSignups = Math.max(...growthByWeek.map(w => w.signups), 1);
                const height = (week.signups / maxSignups) * 160;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{week.signups}</div>
                    <div style={{
                      width: '100%',
                      height: height || 20,
                      background: 'var(--brand)',
                      borderRadius: '4px 4px 0 0'
                    }} />
                    <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{week.week}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>👤 Users (Today)</h2>
          <p className="small" style={{ color: '#888', marginBottom: 20 }}>
            New = profiles created today. Returning = existing users who interacted today.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>New Users Today</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand)' }}>{userStats.newUsers || 0}</div>
            </div>
            <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Returning Users Today</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand)' }}>{userStats.returningUsers || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Apps Tab */}
      {activeTab === 'manage' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>🗑️ Manage Apps</h2>
          <p className="small" style={{ color: '#888', marginBottom: 20 }}>
            Delete apps from the platform (careful - this is permanent!)
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            marginBottom: 12, 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <input
              value={manageSearch}
              onChange={(e) => setManageSearch(e.target.value)}
              placeholder="Search by name, id, or description"
              style={{
                flex: '1 1 240px',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #333',
                background: '#0f0f0f',
                color: '#fff'
              }}
            />
            <select
              value={manageStatus}
              onChange={(e) => setManageStatus(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #333',
                background: '#0f0f0f',
                color: '#fff'
              }}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
          <div style={{ background: 'var(--bg-dark)', borderRadius: 12, border: '1px solid #333' }}>
            {(() => {
              const filtered = manageApps.filter(app => {
                const term = manageSearch.toLowerCase().trim();
                const matchesSearch = term
                  ? (app.name?.toLowerCase().includes(term) ||
                     app.description?.toLowerCase().includes(term) ||
                     app.id?.toLowerCase().includes(term))
                  : true;
                const matchesStatus = manageStatus === 'all'
                  ? true
                  : manageStatus === 'published'
                    ? !!app.is_published
                    : !app.is_published;
                return matchesSearch && matchesStatus;
              });

              if (!filtered.length) {
                return (
                  <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                    No apps match your filters
                  </div>
                );
              }

              return filtered.map(app => (
              <div 
                key={app.id}
                style={{
                  padding: 16,
                  borderBottom: '1px solid #222',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div 
                    style={{ flex: 1, marginRight: 16 }}
                    onClick={() => setSelectedApp(app)}
                  >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    marginBottom: 8
                  }}>
                    <span style={{ fontSize: 20 }}>{app.icon || '📱'}</span>
                    <span style={{ fontWeight: 600 }}>{app.name}</span>
                    {!app.is_published && (
                      <span style={{ 
                        fontSize: 11, 
                        padding: '2px 8px', 
                        borderRadius: 12,
                        background: '#fbbf24',
                        color: '#000'
                      }}>
                        UNPUBLISHED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 8, lineHeight: 1.4 }}>
                    {app.description?.substring(0, 120)}{app.description?.length > 120 ? '...' : ''}
                  </div>
                  <div className="small" style={{ color: '#666', display: 'flex', gap: 12 }}>
                    <span>👁️ {app.view_count || 0}</span>
                    <span>🎯 {app.try_count || 0}</span>
                    <span>🔖 {app.save_count || 0}</span>
                    <span>ID: {app.id}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => {
                      try {
                        const newStatus = !app.is_published;
                        const res = await fetch('/api/apps/' + app.id, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_published: newStatus })
                        });
                        if (res.ok) {
                          alert(newStatus ? 'App published!' : 'App unpublished!');
                          window.location.reload();
                        } else {
                          alert('Error updating app');
                        }
                      } catch (err) {
                        alert('Error: ' + err.message);
                      }
                    }}
                    className="btn ghost"
                    style={{
                      color: app.is_published ? '#fbbf24' : '#10b981',
                      border: `1px solid ${app.is_published ? '#fbbf24' : '#10b981'}`,
                      padding: '6px 12px',
                      fontSize: 13
                    }}
                  >
                    {app.is_published ? '👁️ Unpublish' : '✅ Publish'}
                  </button>
                  <button
                    onClick={async () => {
                      setGeneratingPreviewId(app.id);
                      try {
                        const res = await fetch('/api/generate-app-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ appId: app.id })
                        });
                        if (res.ok) {
                          alert('Preview generation triggered');
                        } else {
                          const error = await res.json();
                          alert('Failed to trigger preview: ' + (error.error || res.status));
                        }
                      } catch (err) {
                        alert('Error: ' + err.message);
                      } finally {
                        setGeneratingPreviewId(null);
                      }
                    }}
                    className="btn ghost"
                    style={{
                      color: '#60a5fa',
                      border: '1px solid #60a5fa',
                      padding: '6px 12px',
                      fontSize: 13,
                      opacity: generatingPreviewId === app.id ? 0.6 : 1
                    }}
                    disabled={generatingPreviewId === app.id}
                  >
                    🎞️ {generatingPreviewId === app.id ? 'Generating...' : 'Generate preview'}
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (confirm(`Permanently delete "${app.name}"? This CANNOT be undone!`)) {
                        try {
                          const res = await fetch('/api/apps/' + app.id, { method: 'DELETE' });
                          if (res.ok) {
                            alert('App permanently deleted!');
                            window.location.reload();
                          } else {
                            const error = await res.json();
                            alert('Error: ' + (error.error || 'Failed to delete'));
                          }
                        } catch (err) {
                          alert('Error: ' + err.message);
                        }
                      }
                    }}
                    className="btn ghost"
                    style={{
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      padding: '6px 12px',
                      fontSize: 13
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* App Preview Modal */}
      {selectedApp && (
        <div 
          onClick={() => setSelectedApp(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: 16
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              borderRadius: 16,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #333'
            }}
          >
            <div style={{ 
              padding: 24, 
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0 }}>{selectedApp.icon} {selectedApp.name}</h2>
              <button 
                onClick={() => setSelectedApp(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#888'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14 }}>{selectedApp.description}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Stats</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>👁️ {selectedApp.view_count || 0} views</div>
                  <div>🎯 {selectedApp.try_count || 0} tries</div>
                  <div>🔖 {selectedApp.save_count || 0} saves</div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedApp.tags?.map(tag => (
                    <span key={tag} style={{
                      background: '#333',
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 12
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Design</div>
                <pre style={{ 
                  fontSize: 11, 
                  background: '#0a0a0a', 
                  padding: 12, 
                  borderRadius: 8,
                  overflow: 'auto',
                  color: '#888'
                }}>
                  {JSON.stringify(selectedApp.design, null, 2)}
                </pre>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/app/${selectedApp.id}`} target="_blank" className="btn primary" style={{ flex: 1 }}>
                  🔗 Open App
                </a>
                <button onClick={() => setSelectedApp(null)} className="btn ghost">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
