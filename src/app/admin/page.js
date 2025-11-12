'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [topApps, setTopApps] = useState([]);
  const [followerLeaderboard, setFollowerLeaderboard] = useState([]);
  const [growthByDay, setGrowthByDay] = useState([]);
  const [growthByWeek, setGrowthByWeek] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'day', 'week', 'all'
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
    
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/stats?time=${timeFilter}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.overview);
          setTopApps(data.topApps || []);
          setFollowerLeaderboard(data.followerLeaderboard || []);
          setGrowthByDay(data.growthByDay || []);
          setGrowthByWeek(data.growthByWeek || []);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user, timeFilter]);

  if (!isLoaded || loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 16px', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>🔐 Clipcade Admin</h1>
          <p className="small" style={{ color: '#888' }}>
            Logged in as: {user.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="btn ghost"
          style={{ fontSize: 20 }}
        >
          ↻
        </button>
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
                  <td style={{ padding: 12, fontSize: 12, color: '#888' }}>
                    {app.creator?.display_name || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Recent Activity */}
      <div>
        <h2 style={{ marginBottom: 16 }}>⚡ Recent Activity</h2>
        <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
          {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
            <div key={i} style={{ 
              padding: '12px 0', 
              borderBottom: i < recentActivity.length - 1 ? '1px solid #222' : 'none',
              fontSize: 14
            }}>
              <span style={{ color: '#888' }}>{activity.time}</span>
              {' - '}
              <span>{activity.description}</span>
            </div>
          )) : (
            <p style={{ color: '#888' }}>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

