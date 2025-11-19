'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyAppsPage() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'unpublished'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null); // For preview modal

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (!clerkUser) return;

    (async () => {
      setLoading(true);
      const userId = clerkUser.id;
      
      try {
        // Fetch all user's apps (including unpublished)
        const appsRes = await fetch(`/api/apps?includeUnpublished=true&userId=${userId}&limit=500`);
        const appsData = await appsRes.json();
        const userApps = (appsData.apps || []).filter(app => app.creator_id === userId);
        
        // Fetch all apps to calculate remix counts (apps that forked from user's apps)
        const allAppsRes = await fetch(`/api/apps?limit=1000`);
        const allAppsData = await allAppsRes.json();
        const allApps = allAppsData.apps || [];
        
        // Calculate remix counts by finding apps with fork_of pointing to user's apps
        const remixCounts = {};
        allApps.forEach(app => {
          if (app.fork_of && userApps.some(userApp => userApp.id === app.fork_of)) {
            remixCounts[app.fork_of] = (remixCounts[app.fork_of] || 0) + 1;
          }
        });
        
        // Add remix counts to user apps
        const appsWithRemixCount = userApps.map(app => ({
          ...app,
          remix_count: remixCounts[app.id] || 0
        }));
        
        setApps(appsWithRemixCount);
        setFilteredApps(appsWithRemixCount);
      } catch (e) {
        console.error('Error loading apps:', e);
        setApps([]);
        setFilteredApps([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [clerkUser, isLoaded, isSignedIn, router]);

  // Apply filters and search
  useEffect(() => {
    let result = [...apps];

    // Apply status filter
    if (filter === 'published') {
      result = result.filter(app => app.is_published);
    } else if (filter === 'unpublished') {
      result = result.filter(app => !app.is_published);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query)
      );
    }

    setFilteredApps(result);
  }, [apps, filter, searchQuery]);

  const handleDelete = async (app) => {
    if (!confirm(`Permanently delete "${app.name}"? This CANNOT be undone!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/apps/${app.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('App deleted successfully!');
        setApps(apps.filter(a => a.id !== app.id));
      } else {
        const error = await res.json();
        alert('Error: ' + (error.error || 'Failed to delete'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleTogglePublish = async (app) => {
    try {
      const newStatus = !app.is_published;
      const res = await fetch(`/api/apps/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: newStatus })
      });
      if (res.ok) {
        alert(newStatus ? 'App published!' : 'App unpublished!');
        setApps(apps.map(a => a.id === app.id ? { ...a, is_published: newStatus } : a));
      } else {
        alert('Error updating app');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', paddingBottom: '100px' }}>
        <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 24 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Link href="/profile" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>
              ← Back to Profile
            </Link>
            <h1 style={{ margin: '8px 0 4px 0' }}>🎨 My Apps</h1>
            <p style={{ color: '#888', margin: 0, fontSize: 14 }}>
              Manage your created apps and view performance metrics
            </p>
          </div>
          <Link href="/publish" className="btn primary" style={{ textDecoration: 'none' }}>
            + Create New App
          </Link>
        </div>

        {/* Filters and Search */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginTop: 20,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFilter('all')}
              className="btn ghost"
              style={{
                background: filter === 'all' ? 'var(--brand)' : 'transparent',
                color: filter === 'all' ? 'white' : '#888',
                padding: '6px 16px',
                fontSize: 14
              }}
            >
              All ({apps.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className="btn ghost"
              style={{
                background: filter === 'published' ? 'var(--brand)' : 'transparent',
                color: filter === 'published' ? 'white' : '#888',
                padding: '6px 16px',
                fontSize: 14
              }}
            >
              Published ({apps.filter(a => a.is_published).length})
            </button>
            <button
              onClick={() => setFilter('unpublished')}
              className="btn ghost"
              style={{
                background: filter === 'unpublished' ? 'var(--brand)' : 'transparent',
                color: filter === 'unpublished' ? 'white' : '#888',
                padding: '6px 16px',
                fontSize: 14
              }}
            >
              Unpublished ({apps.filter(a => !a.is_published).length})
            </button>
          </div>

          {/* Search box */}
          <input
            type="text"
            className="input"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              maxWidth: 300,
              padding: '8px 12px',
              fontSize: 14
            }}
          />
        </div>
      </div>

      {/* Apps List */}
      {filteredApps.length === 0 ? (
        <div style={{
          background: 'var(--bg-dark)',
          borderRadius: 12,
          border: '1px solid #333',
          padding: 60,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <p style={{ color: '#888', marginBottom: 20 }}>
            {searchQuery ? 'No apps match your search' : 
             filter === 'published' ? 'No published apps yet' :
             filter === 'unpublished' ? 'No unpublished apps' :
             'You haven\'t created any apps yet'}
          </p>
          {!searchQuery && apps.length === 0 && (
            <Link href="/publish" className="btn primary" style={{ textDecoration: 'none' }}>
              Create Your First App →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ 
          background: 'var(--bg-dark)', 
          borderRadius: 12, 
          border: '1px solid #333',
          overflow: 'hidden'
        }}>
          {filteredApps.map((app, index) => (
            <div
              key={app.id}
              style={{
                padding: 20,
                borderBottom: index < filteredApps.length - 1 ? '1px solid #222' : 'none',
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* App Preview/Thumbnail - Left side */}
              <div
                onClick={() => setSelectedApp(app)}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  background: app.preview_gradient || '#333',
                  flexShrink: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid #333'
                }}
              >
                {app.preview_url ? (
                  <img
                    src={app.preview_url}
                    alt={app.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48
                  }}>
                    {app.icon || '📱'}
                  </div>
                )}
              </div>

              {/* App Info and Stats - Main section */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* App Name and Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h3 
                    style={{ margin: 0, fontSize: 18, cursor: 'pointer' }}
                    onClick={() => setSelectedApp(app)}
                  >
                    {app.icon && <span style={{ marginRight: 8 }}>{app.icon}</span>}
                    {app.name}
                  </h3>
                  <span style={{
                    fontSize: 11,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: app.is_published ? '#10b981' : '#fbbf24',
                    color: app.is_published ? 'white' : '#000',
                    fontWeight: 600
                  }}>
                    {app.is_published ? 'PUBLISHED' : 'UNPUBLISHED'}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: 14,
                  color: '#888',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {app.description}
                </p>

                {/* Stats Row */}
                <div style={{
                  display: 'flex',
                  gap: 20,
                  fontSize: 13,
                  color: '#888',
                  marginBottom: 12,
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <span style={{ opacity: 0.7 }}>👁️</span> {(app.view_count || 0).toLocaleString()}
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>🎯</span> {(app.try_count || 0).toLocaleString()}
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>💾</span> {(app.save_count || 0).toLocaleString()}
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>🔄</span> {(app.remix_count || 0).toLocaleString()}
                  </div>
                  <div style={{ opacity: 0.6, fontSize: 12 }}>
                    ID: {app.id}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link
                    href={`/app/${app.id}`}
                    className="btn ghost"
                    style={{
                      padding: '6px 14px',
                      fontSize: 13,
                      textDecoration: 'none'
                    }}
                    target="_blank"
                  >
                    👁️ View
                  </Link>
                  
                  <Link
                    href={`/app/${app.id}`}
                    className="btn ghost"
                    style={{
                      padding: '6px 14px',
                      fontSize: 13,
                      textDecoration: 'none'
                    }}
                  >
                    ✏️ Edit
                  </Link>

                  <button
                    onClick={() => handleTogglePublish(app)}
                    className="btn ghost"
                    style={{
                      color: app.is_published ? '#fbbf24' : '#10b981',
                      border: `1px solid ${app.is_published ? '#fbbf24' : '#10b981'}`,
                      padding: '6px 14px',
                      fontSize: 13
                    }}
                  >
                    {app.is_published ? '📤 Unpublish' : '✅ Publish'}
                  </button>

                  <button
                    onClick={() => handleDelete(app)}
                    className="btn ghost"
                    style={{
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      padding: '6px 14px',
                      fontSize: 13
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              <h2 style={{ margin: 0 }}>
                {selectedApp.icon} {selectedApp.name}
              </h2>
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
              {/* Preview Image */}
              {selectedApp.preview_url && (
                <div style={{ marginBottom: 20 }}>
                  <img
                    src={selectedApp.preview_url}
                    alt={selectedApp.name}
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      maxHeight: 300,
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14 }}>{selectedApp.description}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Stats</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>👁️ {selectedApp.view_count || 0} views</div>
                  <div>🎯 {selectedApp.try_count || 0} tries</div>
                  <div>💾 {selectedApp.save_count || 0} saves</div>
                  <div>🔄 {selectedApp.remix_count || 0} remixes</div>
                </div>
              </div>

              {selectedApp.tags && selectedApp.tags.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Tags</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedApp.tags.map(tag => (
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
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href={`/app/${selectedApp.id}`}
                  target="_blank"
                  className="btn primary"
                  style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                >
                  🔗 Open App
                </Link>
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

