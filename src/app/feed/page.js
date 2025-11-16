'use client';
import { useEffect, useRef, useState } from 'react';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

export default function FeedPage() {
  const [apps, setApps] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const PAGE_SIZE = 5;

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/apps?limit=${PAGE_SIZE}&offset=0`);
        const j = await res.json();
        const first = Array.isArray(j.apps) ? j.apps : [];
        setApps(first);
        setHasMore(first.length === PAGE_SIZE);
        setPage(1);
      } catch {
        setApps([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, []);

  const loadMore = async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const offset = page * PAGE_SIZE;
      const res = await fetch(`/api/apps?limit=${PAGE_SIZE}&offset=${offset}`);
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

  // Infinite scroll: load next page when sentinel enters viewport
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
        const res = await fetch(`/api/apps?limit=${PAGE_SIZE}&offset=${offset}`);
        const j = await res.json();
        const next = Array.isArray(j.apps) ? j.apps : [];
        setApps(prev => [...prev, ...next]);
        setHasMore(next.length === PAGE_SIZE);
        setPage(p => p + 1);
      } catch {
        setHasMore(false);
      } finally {
        setIsLoadingMore(false);
        // Re-observe for subsequent loads if needed
        if (sentinelRef.current && hasMore) {
          observer.observe(sentinelRef.current);
        }
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, isLoading, isLoadingMore]);

  return (
    <>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0',
        paddingBottom: '100px',
        width: '100%',
        minHeight: 'calc(100vh - 60px)'
      }}>
        <div className="feed-scroll" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '0 8px'
        }}>
          {/* Initial skeletons */}
          {isLoading && apps.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-${i}`} style={{ height: '60vh', borderRadius: 12, background: '#0f0f0f', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))
          ) : (
            apps.map(app => <TikTokFeedCard key={app.id} app={app} />)
          )}
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} />
          {/* Loading more indicator */}
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
          {/* No more indicator */}
          {!isLoading && !isLoadingMore && !hasMore && apps.length > 0 && (
            <div style={{ textAlign: 'center', padding: 16, color: '#555' }}>You’re all caught up</div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .feed-scroll {
            padding: 0 16px !important;
          }
        }

        @media (max-width: 767px) {
          .feed-scroll {
            gap: 12px !important;
          }
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
