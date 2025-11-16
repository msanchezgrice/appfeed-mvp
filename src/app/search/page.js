'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const tagParam = searchParams.get('tag');

  const [apps, setApps] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(tagParam || '');
  const [showAllTags, setShowAllTags] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const sentinelRef = useRef(null);
  const PAGE_SIZE = 5;
  
  // Popular tags from database (2 rows worth)
  const popularTags = [
    'productivity', 'remix', 'email', 'ai', 'communication', 
    'image', 'vision', 'writing', 'art', 'coding', 'news', 'summary'
  ];

  // Build query string for API based on filters
  const apiQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedTag) params.set('tag', selectedTag);
    params.set('limit', String(PAGE_SIZE));
    return params.toString();
  }, [searchQuery, selectedTag]);

  // Initial + filter change load
  useEffect(() => {
    const loadFirstPage = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/apps?${apiQuery}&offset=0`);
        const j = await res.json();
        const first = Array.isArray(j.apps) ? j.apps : [];
        setApps(first);
        setTags(j.tags || []);
        setHasMore(first.length === PAGE_SIZE);
        setPage(1);
      } catch (error) {
        console.error('Error fetching apps:', error);
        setApps([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };
    // reset before load
    setApps([]);
    setHasMore(true);
    setPage(0);
    loadFirstPage();
  }, [apiQuery]);

  // Infinite scroll: load next page when sentinel visible
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      observer.unobserve(el);
      try {
        setIsLoadingMore(true);
        const offset = page * PAGE_SIZE;
        const res = await fetch(`/api/apps?${apiQuery}&offset=${offset}`);
        const j = await res.json();
        const next = Array.isArray(j.apps) ? j.apps : [];
        setApps(prev => [...prev, ...next]);
        setHasMore(next.length === PAGE_SIZE);
        setPage(p => p + 1);
      } catch {
        setHasMore(false);
      } finally {
        setIsLoadingMore(false);
        if (sentinelRef.current && hasMore) {
          observer.observe(sentinelRef.current);
        }
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, isLoading, isLoadingMore, apiQuery]);

  // Manual fallback: Load more button
  const loadMore = async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const offset = page * PAGE_SIZE;
      const res = await fetch(`/api/apps?${apiQuery}&offset=${offset}`);
      const j = await res.json();
      const next = Array.isArray(j.apps) ? j.apps : [];
      setApps(prev => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
      setPage(p => p + 1);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <>
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 0', paddingBottom: '100px', minHeight: 'calc(100vh - 60px)' }}>
      <h1 style={{ marginBottom: 16 }}>Search</h1>
      
      {/* Popular Tags Autocomplete */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setSelectedTag('')}
          style={{
            padding: '6px 14px',
            borderRadius: 16,
            border: !selectedTag ? 'none' : '1px solid #444',
            background: !selectedTag ? '#ff2d55' : '#1a1a1a',
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            marginRight: 8
          }}
        >
          All
        </button>
        <div style={{ 
          display: 'inline-flex', 
          flexWrap: 'wrap', 
          gap: 6,
          maxHeight: showAllTags ? 'none' : '64px',
          overflow: 'hidden',
          transition: 'max-height 0.3s'
        }}>
          {(tags?.length ? tags.map(t => t.name) : popularTags).map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                border: selectedTag === tag ? 'none' : '1px solid #444',
                background: selectedTag === tag ? 'var(--brand)' : '#1a1a1a',
                color: 'white',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s'
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <button 
            onClick={() => setShowAllTags(!showAllTags)}
            className="small"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#888', 
              cursor: 'pointer',
              padding: 0,
              fontSize: 12
            }}
          >
            {showAllTags ? '▲ Show less' : '▼ Show all tags'}
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search apps..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: 16,
          borderRadius: 8,
          border: '1px solid #333',
          marginBottom: 16,
          background: '#1a1a1a',
          color: '#fff'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Skeletons during first load */}
        {isLoading && apps.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`sk-${i}`} style={{ height: '60vh', borderRadius: 12, background: '#0f0f0f', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
        ) : apps.length > 0 ? (
          <>
            {apps.map(app => <TikTokFeedCard key={app.id} app={app} />)}
            <div ref={sentinelRef} />
            {isLoadingMore && (
              <div style={{ textAlign: 'center', padding: 16, color: '#888' }}>Loading more…</div>
            )}
            {/* Fallback button */}
            {hasMore && !isLoadingMore && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={loadMore}
                  className="btn"
                  style={{ padding: '10px 16px' }}
                >
                  Load more
                </button>
              </div>
            )}
            {!hasMore && (
              <div style={{ textAlign: 'center', padding: 16, color: '#555' }}>You’re all caught up</div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            No apps found
          </div>
        )}
      </div>
    </div>
    <style jsx global>{`
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    `}</style>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
