'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [topApps, setTopApps] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.overview);
          setTopApps(data.topApps || []);
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
  }, [user]);

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
        <h2 style={{ marginBottom: 16 }}>🔥 Top Apps (by Views)</h2>
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

