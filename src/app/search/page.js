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
      const res = await fetch('/api/apps');
      const j = await res.json();
      setApps(j.apps);
      setTags(j.tags);
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

    const matchesTag = !selectedTag || app.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 0' }}>
      <h1 style={{ marginBottom: 16 }}>Search</h1>

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
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              background: selectedTag === tag ? '#fe2c55' : '#333',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            #{tag}
          </button>
        ))}
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
