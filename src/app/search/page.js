'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TikTokFeedCard from '@/src/components/TikTokFeedCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const tagParam = searchParams.get('tag');

  const [apps, setApps] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(tagParam || '');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/apps');
        const j = await res.json();
        setApps(j.apps || []);
        setTags(j.tags || []);
      } catch (error) {
        console.error('Error fetching apps:', error);
        setApps([]);
        setTags([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (tagParam) {
      setSelectedTag(tagParam);
    }
  }, [tagParam]);

  const filteredApps = apps.filter(app => {
    const matchesSearch = !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Fix: Handle both string tags from URL and object tags from API
    const tagName = typeof selectedTag === 'string' ? selectedTag : selectedTag?.name || '';
    const matchesTag = !tagName || app.tags?.includes(tagName);

    return matchesSearch && matchesTag;
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 0', paddingBottom: '100px', minHeight: 'calc(100vh - 60px)' }}>
      <h1 style={{ marginBottom: 16 }}>Search</h1>
      
      {/* Popular Tags Autocomplete */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 6,
          marginBottom: 12,
          maxHeight: showAllTags ? 'none' : '56px',
          overflow: 'hidden',
          transition: 'max-height 0.3s'
        }}>
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                border: selectedTag === tag ? 'none' : '1px solid #444',
                background: selectedTag === tag ? 'var(--brand)' : '#1a1a1a',
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
                transition: 'all 0.2s'
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
        {popularTags.length > 10 && (
          <button 
            onClick={() => setShowAllTags(!showAllTags)}
            className="small"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#888', 
              cursor: 'pointer',
              padding: 0
            }}
          >
            {showAllTags ? '▲ Show less tags' : '▼ Show all tags'}
          </button>
        )}
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

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={() => setSelectedTag('')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: !selectedTag ? '#fe2c55' : '#333',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          All
        </button>
        {tags.map((tag, index) => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          return (
            <button
              key={`tag-${tagName}-${index}`}
              onClick={() => setSelectedTag(tagName)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: selectedTag === tagName ? '#fe2c55' : '#333',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              #{tagName}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredApps.length > 0 ? (
          filteredApps.map(app => <TikTokFeedCard key={app.id} app={app} />)
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            No apps found
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
