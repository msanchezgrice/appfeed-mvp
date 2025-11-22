'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AssetThumbnail from '@/src/components/AssetThumbnail';

export default function MyAppsPage() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'unpublished'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null); // For preview modal
  const [assetsOverlayOpen, setAssetsOverlayOpen] = useState(false);
  const [assetsOverlayApp, setAssetsOverlayApp] = useState(null);
  const [assetsOverlayData, setAssetsOverlayData] = useState({ assets: [], jobs: [] });
  const [assetsOverlayLoading, setAssetsOverlayLoading] = useState(false);
  const [assetsOverlayError, setAssetsOverlayError] = useState('');
  const [assetsOverlayActionLoading, setAssetsOverlayActionLoading] = useState(false);
  const [assetsOverlayActionError, setAssetsOverlayActionError] = useState('');
  const [overlayPosterPrompt, setOverlayPosterPrompt] = useState('');
  const [overlayThumbPrompt, setOverlayThumbPrompt] = useState('');
  const [overlayOgPrompt, setOverlayOgPrompt] = useState('');
  const [overlayDemoPrompt, setOverlayDemoPrompt] = useState('');
  const [appStates, setAppStates] = useState({});

  const DEFAULT_POSTER_PROMPT = 'Generate an elevated 1080x1350 poster with bold title, UI inset, and QR space.';
  const DEFAULT_THUMB_PROMPT = 'Square thumbnail: clean gradient + recognizable mark/icon.';
  const DEFAULT_OG_PROMPT = 'Landscape OG 1200x630 with clear title, short description space, QR/CTA area.';
  const DEFAULT_DEMO_PROMPT = 'Open app, wait ~1.5s, tap Try, capture a short 9–12s clip.';

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

  // Load per-app state (last run / persisted state)
  useEffect(() => {
    if (!clerkUser || !apps.length) return;
    (async () => {
      try {
        const res = await fetch('/api/user-state', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const map = {};
        (data.states || []).forEach((s) => {
          if (s?.app_id) map[s.app_id] = s;
        });
        setAppStates(map);
      } catch (err) {
        console.error('[Home] Failed to load state map', err);
      }
    })();
  }, [clerkUser, apps.length]);

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

  const getStatePreview = (appId) => {
    const entry = appStates[appId];
    if (!entry) return null;
    const state = entry.state || {};
    const outputs = state.outputs || state;

    // Image priority: skip large data URLs to keep UI light
    const collectImages = [];
    if (Array.isArray(outputs?.images)) collectImages.push(...outputs.images);
    if (outputs?.image) collectImages.push(outputs.image);
    if (outputs?.thumbnails) collectImages.push(...outputs.thumbnails);
    if (state?.poster_url) collectImages.push(state.poster_url);
    if (state?.thumb_url) collectImages.push(state.thumb_url);
    if (state?.og_url) collectImages.push(state.og_url);

    const firstImg = collectImages.find((img) => typeof img === 'string' && !img.startsWith('data:'));
    if (firstImg) return { type: 'image', value: firstImg };

    // Text/chat preview
    if (outputs?.text) return { type: 'text', value: outputs.text };
    if (outputs?.message) return { type: 'text', value: outputs.message };
    if (Array.isArray(outputs?.messages) && outputs.messages.length) {
      const last = outputs.messages[outputs.messages.length - 1];
      if (typeof last === 'string') return { type: 'text', value: last };
      if (last?.content) return { type: 'text', value: last.content };
    }

    return null;
  };

  const openAssetsOverlay = async (app) => {
    setAssetsOverlayOpen(true);
    setAssetsOverlayApp(app);
    setAssetsOverlayLoading(true);
    setAssetsOverlayError('');
    setOverlayPosterPrompt('');
    setOverlayThumbPrompt('');
    setOverlayOgPrompt('');
    setOverlayDemoPrompt('');
    try {
      const res = await fetch(`/api/asset-jobs?appId=${encodeURIComponent(app.id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load marketing assets');
      }
      setAssetsOverlayData({ assets: data.assets || [], jobs: data.jobs || [] });
    } catch (err) {
      setAssetsOverlayError(err?.message || 'Failed to load marketing assets');
    } finally {
      setAssetsOverlayLoading(false);
    }
  };

  const regenAssetsFromOverlay = async (types = [], inputs = {}) => {
    if (!assetsOverlayApp?.id) return;
    setAssetsOverlayActionLoading(true);
    setAssetsOverlayActionError('');
    try {
      const res = await fetch('/api/asset-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appId: assetsOverlayApp.id,
          types: types.length ? types : ['poster', 'og', 'thumb'],
          inputs: { ...inputs, force: true }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate assets');
      }
      setAssetsOverlayData({ assets: data.assets || [], jobs: data.jobs || [] });
    } catch (err) {
      setAssetsOverlayActionError(err?.message || 'Failed to regenerate assets');
    } finally {
      setAssetsOverlayActionLoading(false);
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16
          }}
        >
          {filteredApps.map(app => {
            const statePreview = getStatePreview(app.id);
            const stateMeta = appStates[app.id];
            return (
              <div
                key={app.id}
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                  borderRadius: 16,
                  border: '1px solid #2a2a2a',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div
                    onClick={() => setSelectedApp(app)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      background: app.preview_gradient || '#333',
                      overflow: 'hidden',
                      border: '1px solid #333',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                  >
                    {app.preview_url ? (
                      <img
                        src={app.preview_url}
                        alt={app.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                        {app.icon || '📱'}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {app.icon ? `${app.icon} ${app.name}` : app.name}
                      </span>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: app.is_published ? '#10b981' : '#fbbf24',
                        color: app.is_published ? 'white' : '#000',
                        fontWeight: 700
                      }}>
                        {app.is_published ? 'LIVE' : 'DRAFT'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {app.description}
                    </div>
                  </div>
                </div>

                {statePreview && (
                  <div style={{
                    background: '#111',
                    border: '1px solid #222',
                    borderRadius: 12,
                    padding: 10,
                    minHeight: 70
                  }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                      Last session
                    </div>
                    {statePreview.type === 'image' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', border: '1px solid #333', flexShrink: 0 }}>
                          <img
                            src={statePreview.value}
                            alt="Last result"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: '#aaa' }}>
                          Previous output
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.4, maxHeight: 68, overflow: 'hidden' }}>
                        {statePreview.value}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888', flexWrap: 'wrap' }}>
                  <span>👁️ {app.view_count || 0}</span>
                  <span>🎯 {app.try_count || 0}</span>
                  <span>🔖 {app.save_count || 0}</span>
                  <span>🔄 {app.remix_count || 0}</span>
                  {stateMeta?.updated_at && (
                    <span style={{ opacity: 0.7 }}>Last opened {new Date(stateMeta.updated_at).toLocaleString()}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link
                    href={`/app/${app.id}`}
                    className="btn primary"
                    style={{ flex: 1, minWidth: 120, textAlign: 'center', textDecoration: 'none' }}
                  >
                    ▶️ Open / Resume
                  </Link>
                  <button
                    onClick={() => openAssetsOverlay(app)}
                    className="btn ghost"
                    style={{ flex: 1, minWidth: 120 }}
                  >
                    🖼️ Assets
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#aaa' }}>
                  <button
                    onClick={() => handleTogglePublish(app)}
                    className="btn ghost"
                    style={{
                      color: app.is_published ? '#fbbf24' : '#10b981',
                      border: `1px solid ${app.is_published ? '#fbbf24' : '#10b981'}`,
                      padding: '6px 12px',
                      fontSize: 12
                    }}
                  >
                    {app.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(app)}
                    className="btn ghost"
                    style={{
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      padding: '6px 12px',
                      fontSize: 12
                    }}
                  >
                    Delete
                  </button>
                  <Link
                    href={`/app/${app.id}`}
                    className="btn ghost"
                    style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assets Overlay */}
      {assetsOverlayOpen && (
        <div
          onClick={() => setAssetsOverlayOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000,
            padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0b1220',
              borderRadius: 16,
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #1f2937',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{
              padding: 20,
              borderBottom: '1px solid #1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Marketing Assets</div>
                <div className="small" style={{ color: '#9ca3af' }}>
                  {assetsOverlayApp?.name}
                </div>
              </div>
              <button
                onClick={() => setAssetsOverlayOpen(false)}
                className="btn ghost"
                style={{ padding: '6px 12px' }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Quick Regenerate */}
              {assetsOverlayApp && (
                <div className="card" style={{ marginBottom: 16, border: '1px solid #1f2937', background: '#0f172a' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Regenerate</div>
                  <div className="small" style={{ color: '#9ca3af', marginBottom: 8 }}>
                    Use prompts to regenerate poster, OG, thumb, or demo/GIF. Defaults apply when empty.
                  </div>
                  {assetsOverlayActionError && (
                    <div className="small" style={{ color: '#ef4444', marginBottom: 8 }}>
                      {assetsOverlayActionError}
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div>
                      <label className="label">Poster prompt</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder={DEFAULT_POSTER_PROMPT}
                        value={overlayPosterPrompt}
                        onChange={(e) => setOverlayPosterPrompt(e.target.value)}
                      />
                      <div className="small" style={{ color: '#9ca3af' }}>
                        {overlayPosterPrompt ? overlayPosterPrompt.slice(0, 80) + (overlayPosterPrompt.length > 80 ? '…' : '') : '(using default)'}
                      </div>
                      <button
                        className="btn"
                        style={{ marginTop: 6 }}
                        onClick={() => regenAssetsFromOverlay(['poster'], { prompt: overlayPosterPrompt })}
                        disabled={assetsOverlayActionLoading}
                      >
                        {assetsOverlayActionLoading ? 'Working…' : 'Regenerate Poster'}
                      </button>
                    </div>
                    <div>
                      <label className="label">Thumbnail prompt</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder={DEFAULT_THUMB_PROMPT}
                        value={overlayThumbPrompt}
                        onChange={(e) => setOverlayThumbPrompt(e.target.value)}
                      />
                      <div className="small" style={{ color: '#9ca3af' }}>
                        {overlayThumbPrompt ? overlayThumbPrompt.slice(0, 80) + (overlayThumbPrompt.length > 80 ? '…' : '') : '(using default)'}
                      </div>
                      <button
                        className="btn"
                        style={{ marginTop: 6 }}
                        onClick={() => regenAssetsFromOverlay(['thumb'], { prompt: overlayThumbPrompt })}
                        disabled={assetsOverlayActionLoading}
                      >
                        {assetsOverlayActionLoading ? 'Working…' : 'Regenerate Thumb'}
                      </button>
                    </div>
                    <div>
                      <label className="label">OG prompt</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder={DEFAULT_OG_PROMPT}
                        value={overlayOgPrompt}
                        onChange={(e) => setOverlayOgPrompt(e.target.value)}
                      />
                      <div className="small" style={{ color: '#9ca3af' }}>
                        {overlayOgPrompt ? overlayOgPrompt.slice(0, 80) + (overlayOgPrompt.length > 80 ? '…' : '') : '(using default)'}
                      </div>
                      <button
                        className="btn"
                        style={{ marginTop: 6 }}
                        onClick={() => regenAssetsFromOverlay(['og'], { prompt: overlayOgPrompt })}
                        disabled={assetsOverlayActionLoading}
                      >
                        {assetsOverlayActionLoading ? 'Working…' : 'Regenerate OG'}
                      </button>
                    </div>
                    <div>
                      <label className="label">Demo/GIF script</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder={DEFAULT_DEMO_PROMPT}
                        value={overlayDemoPrompt}
                        onChange={(e) => setOverlayDemoPrompt(e.target.value)}
                      />
                      <div className="small" style={{ color: '#9ca3af' }}>
                        {overlayDemoPrompt ? overlayDemoPrompt.slice(0, 80) + (overlayDemoPrompt.length > 80 ? '…' : '') : '(using default)'}
                      </div>
                      <button
                        className="btn"
                        style={{ marginTop: 6 }}
                        onClick={() => regenAssetsFromOverlay(['demo', 'gif'], { prompt: overlayDemoPrompt, clickTry: true, delayMs: 1500 })}
                        disabled={assetsOverlayActionLoading}
                      >
                        {assetsOverlayActionLoading ? 'Working…' : 'Generate Demo + GIF'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {assetsOverlayLoading && (
                <div className="small" style={{ color: '#888' }}>Loading assets…</div>
              )}
              {assetsOverlayError && (
                <div className="small" style={{ color: '#ef4444' }}>{assetsOverlayError}</div>
              )}
              {!assetsOverlayLoading && assetsOverlayData.assets && assetsOverlayData.assets.length === 0 && (
                <div className="small" style={{ color: '#888' }}>
                  No assets yet. Generate from Publish → success screen.
                </div>
              )}
              {assetsOverlayData.assets && assetsOverlayData.assets.length > 0 && (() => {
                const byKind = {};
          const messageUrl = assetsOverlayApp?.preview_url || assetsOverlayApp?.preview_image || null;
          if (messageUrl) {
            byKind['message'] = {
              id: 'message-image',
              kind: 'message',
              mime_type: 'image/*',
              url: messageUrl,
              blur_data_url: assetsOverlayApp.preview_blur || null
            };
          }
                assetsOverlayData.assets.forEach((a) => {
                  const key = a.kind || 'asset';
                  if (!byKind[key]) byKind[key] = a;
                });
                const assetsToShow = Object.values(byKind);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {assetsToShow.map((asset) => {
                      const isImage = (asset.mime_type || '').startsWith('image/') || asset.kind === 'message';
                      const isDataUrl = asset.url && asset.url.startsWith('data:');
                      const label = asset.kind === 'poster'
                        ? 'Poster'
                        : asset.kind === 'og'
                        ? 'OG'
                        : asset.kind === 'thumb'
                        ? 'Thumb'
                        : asset.kind === 'message'
                        ? 'Message preview'
                        : asset.kind.toUpperCase();
                      return (
                        <div key={asset.id} className="card" style={{ padding: 12 }}>
                          <div style={{ fontWeight: 700, textTransform: 'capitalize', marginBottom: 6 }}>{label}</div>
                          {isImage && (
                            <div
                              style={{
                                borderRadius: 10,
                                overflow: 'hidden',
                                border: '1px solid #1f2937',
                                marginBottom: 8,
                                background: '#020617',
                                position: 'relative'
                              }}
                            >
                              <img
                                src={asset.url}
                                alt={label}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block',
                                  aspectRatio: asset.kind === 'thumb' ? '1 / 1' : '4 / 5',
                                  objectFit: 'cover'
                                }}
                              />
                              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
                                <a className="btn" style={{ padding: '6px 10px', fontSize: 12 }} href={asset.url} download>
                                  Download
                                </a>
                                <a className="btn ghost" style={{ padding: '6px 10px', fontSize: 12 }} href={asset.url} target="_blank" rel="noopener noreferrer">
                                  Open
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="small" style={{ color: '#9ca3af', marginTop: 4 }}>
                            {asset.mime_type || 'asset'}
                          </div>
                          {!isDataUrl && (
                            <div className="small" style={{ color: '#6b7280', marginTop: 6, wordBreak: 'break-all' }}>
                              {asset.url}
                            </div>
                          )}
                          {isDataUrl && (
                            <div className="small" style={{ color: '#6b7280', marginTop: 6 }}>
                              (inline image)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
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
