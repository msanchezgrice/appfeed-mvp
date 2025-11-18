'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(1); // Default to today

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in?redirect_url=/me/analytics');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    fetch(`/api/me/analytics?days=${days}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Analytics error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [user, days]);

  if (!isLoaded || !user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 16px' }}>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: 16 }}>Analytics Unavailable</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>{error}</p>
          <p style={{ fontSize: 14, color: '#666' }}>
            If you've just set up PostHog, it may take a few minutes for data to appear.
            <br />
            Make sure <code>POSTHOG_PERSONAL_API_KEY</code> is set in your environment variables.
          </p>
          <Link href="/profile" className="btn" style={{ marginTop: 24 }}>
            ← Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/profile" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>
          ← Back to Profile
        </Link>
        <h1 style={{ margin: '16px 0 8px 0' }}>📊 Creator Analytics</h1>
        <p style={{ color: '#888', margin: 0 }}>
          Track your app performance and engagement metrics
        </p>
      </div>

      {/* Date Range Selector */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        {[
          { value: 1, label: 'Today' },
          { value: 7, label: 'Last 7 days' },
          { value: 30, label: 'Last 30 days' },
          { value: 90, label: 'Last 90 days' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDays(value)}
            className="btn"
            style={{
              background: days === value ? '#fe2c55' : '#1a1a1a',
              color: 'white',
              border: days === value ? '1px solid #fe2c55' : '1px solid #333'
            }}
          >
            {label}
          </button>
        ))}
        {loading && <span style={{ color: '#888', padding: '8px 12px' }}>Loading...</span>}
      </div>

      {!loading && analytics && (
        <>
          {/* Portfolio Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
            marginBottom: 40
          }}>
            <MetricCard
              label="Total Views"
              value={analytics.overview.totalViews.toLocaleString()}
              subtitle={`${analytics.overview.allTimeViews.toLocaleString()} all-time`}
              icon="👁️"
            />
            <MetricCard
              label="View → Try Rate"
              value={`${analytics.overview.viewToTryRate}%`}
              subtitle="Engagement quality"
              icon="🎯"
              color="#3b82f6"
            />
            <MetricCard
              label="Try → Save Rate"
              value={`${analytics.overview.tryToSaveRate}%`}
              subtitle="Content quality"
              icon="💾"
              color="#10b981"
            />
            <MetricCard
              label="Followers"
              value={analytics.overview.followerCount.toLocaleString()}
              subtitle="Audience size"
              icon="👥"
              color="#8b5cf6"
            />
          </div>

          {/* Secondary Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 40
          }}>
            <SmallMetricCard label="Apps Published" value={analytics.overview.totalApps} />
            <SmallMetricCard label="Total Tries" value={analytics.overview.totalTries.toLocaleString()} />
            <SmallMetricCard label="Total Saves" value={analytics.overview.totalSaves.toLocaleString()} />
            <SmallMetricCard label="Total Shares" value={analytics.overview.totalShares.toLocaleString()} />
            <SmallMetricCard label="Total Remixes" value={analytics.overview.totalRemixes.toLocaleString()} />
          </div>

          {/* Conversion Funnel */}
          {analytics.funnel && analytics.funnel.length > 0 && (
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 24,
              marginBottom: 32
            }}>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>🔄 Conversion Funnel</h2>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {analytics.funnel.map((step, index) => (
                  <div key={step.step} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      background: index === 0 ? '#fe2c55' : index === 1 ? '#3b82f6' : '#10b981',
                      borderRadius: 12,
                      padding: '16px 24px',
                      minWidth: 150,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>{step.step}</div>
                      <div style={{ fontSize: 24, fontWeight: 'bold' }}>{step.count.toLocaleString()}</div>
                      {step.dropoff > 0 && (
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                          {step.dropoff}% drop
                        </div>
                      )}
                    </div>
                    {index < analytics.funnel.length - 1 && (
                      <div style={{ color: '#666', fontSize: 24 }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Apps Table */}
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
            overflowX: 'auto'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 20 }}>🏆 Top Performing Apps</h2>
            {analytics.topApps.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: 12, color: '#888', fontWeight: 600, fontSize: 14 }}>
                      App
                    </th>
                    <th style={{ textAlign: 'right', padding: 12, color: '#888', fontWeight: 600, fontSize: 14 }}>
                      Views
                    </th>
                    <th style={{ textAlign: 'right', padding: 12, color: '#888', fontWeight: 600, fontSize: 14 }}>
                      Tries
                    </th>
                    <th style={{ textAlign: 'right', padding: 12, color: '#888', fontWeight: 600, fontSize: 14 }}>
                      Saves
                    </th>
                    <th style={{ textAlign: 'right', padding: 12, color: '#888', fontWeight: 600, fontSize: 14 }}>
                      Try Rate
                    </th>
                    <th style={{ textAlign: 'right', padding: 12, color: '#888', fontWeight: 600, fontSize: 14 }}>
                      Save Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topApps.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: 12 }}>
                        <Link href={`/app/${app.id}`} style={{ color: 'white', textDecoration: 'none' }}>
                          {app.name}
                        </Link>
                      </td>
                      <td style={{ textAlign: 'right', padding: 12 }}>{app.views.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: 12 }}>{app.tries.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: 12 }}>{app.saves.toLocaleString()}</td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: 12,
                        color: app.viewToTryRate > 15 ? '#10b981' : app.viewToTryRate > 10 ? '#fbbf24' : '#888'
                      }}>
                        {app.viewToTryRate}%
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: 12,
                        color: app.tryToSaveRate > 30 ? '#10b981' : app.tryToSaveRate > 20 ? '#fbbf24' : '#888'
                      }}>
                        {app.tryToSaveRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#888', textAlign: 'center', padding: 32 }}>
                No apps published yet. <Link href="/publish">Create your first app →</Link>
              </p>
            )}
          </div>

          {/* Traffic Sources */}
          {analytics.trafficSources && analytics.trafficSources.length > 0 && (
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 24,
              marginBottom: 32
            }}>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>🚦 Traffic Sources</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {analytics.trafficSources.map(source => {
                  const total = analytics.trafficSources.reduce((sum, s) => sum + s.views, 0);
                  const percentage = total > 0 ? ((source.views / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={source.source} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 12,
                      background: '#222',
                      borderRadius: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{getSourceIcon(source.source)}</span>
                        <span style={{ textTransform: 'capitalize' }}>{source.source}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 14, color: '#888' }}>{percentage}%</div>
                        <div style={{ fontWeight: 'bold' }}>{source.views.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Series Chart */}
          {analytics.timeSeries && analytics.timeSeries.length > 0 && (
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 24
            }}>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>📈 Performance Over Time</h2>
              <SimpleLineChart data={analytics.timeSeries} />
            </div>
          )}

          {/* Data Source Indicator */}
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontSize: 12, 
            marginTop: 32 
          }}>
            {analytics.dataSource === 'posthog' ? (
              <>✅ Analytics powered by PostHog + Supabase</>
            ) : (
              <>⚠️ Showing Supabase data only (PostHog not configured)</>
            )}
          </div>
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ color: '#888' }}>Loading your analytics...</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, subtitle, icon, color = '#fe2c55' }) {
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: 12,
      padding: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 32 }}>{icon}</span>
        <div style={{ fontSize: 14, color: '#888' }}>{label}</div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 'bold', color, marginBottom: 8 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#666' }}>{subtitle}</div>
      )}
    </div>
  );
}

function SmallMetricCard({ label, value }) {
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: 8,
      padding: 16
    }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

function SimpleLineChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.flatMap(d => [d.views, d.tries, d.saves]));
  const height = 200;
  const width = 100; // percentage

  // Create SVG path for each metric
  const createPath = (values) => {
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = height - ((value / maxValue) * (height - 20));
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const viewsPath = createPath(data.map(d => d.views));
  const triesPath = createPath(data.map(d => d.tries));
  const savesPath = createPath(data.map(d => d.saves));

  return (
    <div style={{ position: 'relative' }}>
      <svg 
        viewBox={`0 0 100 ${height}`} 
        preserveAspectRatio="none"
        style={{ width: '100%', height: '250px' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
          <line
            key={i}
            x1="0"
            y1={height - (fraction * (height - 20))}
            x2="100"
            y2={height - (fraction * (height - 20))}
            stroke="#333"
            strokeWidth="0.1"
          />
        ))}

        {/* Lines */}
        <path d={viewsPath} fill="none" stroke="#fe2c55" strokeWidth="0.5" />
        <path d={triesPath} fill="none" stroke="#3b82f6" strokeWidth="0.5" />
        <path d={savesPath} fill="none" stroke="#10b981" strokeWidth="0.5" />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16, fontSize: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 3, background: '#fe2c55' }} />
          <span>Views</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 3, background: '#3b82f6' }} />
          <span>Tries</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 3, background: '#10b981' }} />
          <span>Saves</span>
        </div>
      </div>

      {/* Date range */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: 8,
        fontSize: 12,
        color: '#666'
      }}>
        <span>{new Date(data[0]?.date).toLocaleDateString()}</span>
        <span>{new Date(data[data.length - 1]?.date).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function getSourceIcon(source) {
  const icons = {
    feed: '📱',
    search: '🔍',
    profile: '👤',
    direct: '🔗',
    external: '🌐',
    unknown: '❓'
  };
  return icons[source] || icons.unknown;
}

