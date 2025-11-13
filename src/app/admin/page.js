'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'apps', 'creators', 'viral', 'growth'
  const [stats, setStats] = useState(null);
  const [topApps, setTopApps] = useState([]);
  const [viralityLeaderboard, setViralityLeaderboard] = useState([]);
  const [followerLeaderboard, setFollowerLeaderboard] = useState([]);
  const [growthByDay, setGrowthByDay] = useState([]);
  const [growthByWeek, setGrowthByWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('day'); // 'day', 'week', 'all' - default to today
  const [growthFilter, setGrowthFilter] = useState('day'); // 'day', 'week', 'month'

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

  // Fetch admin data
  useEffect(() => {
    if (!user) return;
    
    // Stop loading immediately - show UI first
    setLoading(false);
    
    const fetchData = async () => {
      try {
        console.log('[Admin] Fetching data for tab:', activeTab);
        const startTime = Date.now();
        
        // Only fetch data for active tab to speed up loading
        const res = await fetch(`/api/admin/stats?time=${timeFilter}&tab=${activeTab}`, {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        console.log('[Admin] Fetch completed in:', Date.now() - startTime, 'ms');
        
        if (res.ok) {
          const data = await res.json();
          console.log('[Admin] Data received:', Object.keys(data));
          setStats(data.overview);
          
          // Set data based on active tab
          if (activeTab === 'apps') {
            setTopApps(data.topApps || []);
          } else if (activeTab === 'viral') {
            setViralityLeaderboard(data.viralityLeaderboard || []);
          } else if (activeTab === 'creators') {
            setFollowerLeaderboard(data.followerLeaderboard || []);
          } else if (activeTab === 'growth') {
            setGrowthByDay(data.growthByDay || []);
            setGrowthByWeek(data.growthByWeek || []);
          } else if (activeTab === 'manage') {
            // Fetch ALL apps for manage tab
            const appsRes = await fetch('/api/apps');
            if (appsRes.ok) {
              const appsData = await appsRes.json();
              setTopApps(appsData.apps || []);
              console.log('[Admin] Loaded', appsData.apps?.length, 'apps for management');
            }
          }
        } else {
          console.error('[Admin] API returned error:', res.status);
        }
      } catch (err) {
        console.error('[Admin] Error fetching admin data:', err);
        // Show error but don't freeze
        setStats({
          totalApps: 0,
          totalUsers: 0,
          totalViews: 0,
          totalTries: 0
        });
      }
    };

    // Fetch after a short delay to let UI render
    setTimeout(fetchData, 100);
  }, [user, timeFilter, activeTab]);

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

      {/* Manage Apps Tab */}
      {activeTab === 'manage' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>🗑️ Manage Apps</h2>
          <p className="small" style={{ color: '#888', marginBottom: 20 }}>
            Delete apps from the platform (careful - this is permanent!)
          </p>
          <div style={{ background: 'var(--bg-dark)', borderRadius: 12, border: '1px solid #333' }}>
            {topApps.length > 0 ? topApps.map(app => (
              <div key={app.id} style={{
                padding: 16,
                borderBottom: '1px solid #222',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{app.icon || '📱'} {app.name}</div>
                  <div className="small" style={{ color: '#888', marginTop: 4 }}>
                    ID: {app.id} • {app.view_count || 0} views
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
            )) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                No apps to manage
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

