# User Asset Library - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  AppForm.js  │  │ AssetPicker  │  │ Library Page │         │
│  │              │  │              │  │              │         │
│  │ File Input   │→ │ Recent Imgs  │  │ Full Gallery │         │
│  │ + Preview    │  │ View All btn │  │ Management   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         │                  │                  │                  │
├─────────┼──────────────────┼──────────────────┼─────────────────┤
│         │   API LAYER      │                  │                  │
│         ↓                  ↓                  ↓                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │          /api/runs             /api/user-assets     │       │
│  │                                                       │       │
│  │  POST → Execute app          GET → Fetch assets     │       │
│  │  ↓ Auto-save assets          POST → Save/Delete     │       │
│  │                                                       │       │
│  └────────────────────┬─────────────────┬───────────────┘       │
│                       │                  │                       │
│                       │                  │                       │
├───────────────────────┼──────────────────┼───────────────────────┤
│   DATA & STORAGE      │                  │                       │
│                       ↓                  ↓                       │
│  ┌────────────────────────────┐  ┌─────────────────────────┐  │
│  │    Supabase Database       │  │   Supabase Storage      │  │
│  │                            │  │                         │  │
│  │  ┌──────────────┐         │  │  app-images/           │  │
│  │  │ user_assets  │         │  │  └─ user-assets/       │  │
│  │  │              │         │  │     └─ {userId}/       │  │
│  │  │ - id         │         │  │        ├─ uploads/     │  │
│  │  │ - user_id    │         │  │        │  ├─ *-360.webp│  │
│  │  │ - asset_type │◄────────┼──┼────────│  ├─ *-720.webp│  │
│  │  │ - url        │         │  │        │  └─ *-1080.webp│ │
│  │  │ - url_360    │         │  │        └─ outputs/     │  │
│  │  │ - url_1080   │         │  │           └─ ...       │  │
│  │  │ - blur_data  │         │  │                         │  │
│  │  │ - is_favorite│         │  └─────────────────────────┘  │
│  │  │ - last_used  │         │                                │
│  │  └──────────────┘         │                                │
│  │                            │                                │
│  │  ┌──────────────┐         │                                │
│  │  │    runs      │         │                                │
│  │  │              │         │                                │
│  │  │ - asset_url  │         │                                │
│  │  │ - input_url  │         │                                │
│  │  └──────────────┘         │                                │
│  └────────────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Upload & Save Flow

```
User uploads image
    ↓
AppForm receives file
    ↓
Convert to base64 data URL
    ↓
POST /api/runs
    ↓
┌─────────────────────────────────┐
│ App execution happens           │
│ (run app logic)                 │
└─────────────────────────────────┘
    ↓
Upload to storage (run-inputs/)
    ↓
┌─────────────────────────────────┐
│ Optimize image:                 │
│ • Resize to 360/720/1080        │
│ • Convert to WebP               │
│ • Generate blur placeholder     │
│ • Calculate SHA-1 hash          │
└─────────────────────────────────┘
    ↓
INSERT into user_assets
    ↓
    ✓ Asset saved to library!
```

### 2. Reuse Asset Flow

```
User opens app with image input
    ↓
AssetPicker component loads
    ↓
GET /api/user-assets?type=input&limit=4
    ↓
Display 4 recent thumbnails
    ↓
User clicks thumbnail
    ↓
Asset URL populated into form field
    ↓
POST /api/user-assets (action: 'use')
    ↓
Update last_used_at timestamp
    ↓
User runs app (no upload needed!)
```

### 3. Library Management Flow

```
User clicks Library in nav
    ↓
/library page loads
    ↓
GET /api/user-assets?type=input&limit=24
    ↓
Render grid with AssetThumbnail components
    ↓
User actions:
│
├─ Click asset → View full-screen
├─ Click ⭐ → POST (action: 'favorite')
├─ Click ⬇️ → Download 1080px version
└─ Click 🗑️ → POST (action: 'delete')
```

---

## 🎨 Component Hierarchy

```
App Root
│
├─ BottomNav (updated)
│  └─ Library Link (new)
│
├─ /library (new page)
│  ├─ Stats Cards
│  ├─ Tab Controls (Uploads/Generated)
│  └─ Asset Grid
│     └─ AssetThumbnail × N
│
├─ AppForm (modified)
│  ├─ File Input (existing)
│  ├─ Image Preview (new)
│  ├─ AssetPicker (new)
│  │  └─ AssetThumbnail × 4
│  └─ AssetLibraryModal (new)
│     ├─ Tab Navigation
│     └─ Asset Grid
│        └─ AssetThumbnail × N
│
└─ AssetThumbnail (new, shared)
   ├─ Blur Placeholder
   ├─ Lazy-loaded Image
   ├─ Metadata Overlay
   └─ Hover Actions
```

---

## 💾 Database Schema Relationships

```sql
profiles (Clerk users)
    ↓ (1:N)
user_assets
    ├─ user_id → profiles.id
    ├─ source_run_id → runs.id (nullable)
    └─ source_app_id → apps.id (nullable)

runs (app executions)
    ├─ asset_url (generated output)
    ├─ input_asset_url (uploaded input)
    └─ user_id → profiles.id
```

### Entity Relationship

```
┌──────────────┐
│   profiles   │
│              │
│ id (PK)      │
│ username     │
│ email        │
└──────┬───────┘
       │
       │ 1:N
       │
       ↓
┌──────────────────┐       ┌──────────────┐
│   user_assets    │       │     runs     │
│                  │       │              │
│ id (PK)          │ N:1   │ id (PK)      │
│ user_id (FK) ────┼───────┤ user_id (FK) │
│ asset_type       │       │ asset_url    │
│ source_type      │       │ input_url    │
│ url              │←──────┤ (references) │
│ url_360          │       │              │
│ url_1080         │       └──────────────┘
│ blur_data_url    │
│ content_hash     │       ┌──────────────┐
│ source_run_id (FK)───────┤    apps      │
│ source_app_id (FK)────────┤              │
│ is_favorite      │       │ id (PK)      │
│ last_used_at     │       │ name         │
└──────────────────┘       └──────────────┘
```

---

## 🔐 Security & Permissions

### Row Level Security (RLS)

```sql
-- Users can only see their own assets
CREATE POLICY "Users see own assets"
ON user_assets FOR SELECT
USING (auth.clerk_user_id() = user_id);

-- Users can only insert their own assets
CREATE POLICY "Users insert own assets"
ON user_assets FOR INSERT
WITH CHECK (auth.clerk_user_id() = user_id);

-- Users can only update their own assets
CREATE POLICY "Users update own assets"
ON user_assets FOR UPDATE
USING (auth.clerk_user_id() = user_id);

-- Users can only delete their own assets
CREATE POLICY "Users delete own assets"
ON user_assets FOR DELETE
USING (auth.clerk_user_id() = user_id);
```

### API Authentication

```javascript
// All /api/user-assets endpoints require authentication
const { userId } = await createServerSupabaseClient();

if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## ⚡ Performance Optimizations

### 1. Image Optimization Pipeline

```
Original Upload (5MB JPEG)
    ↓
Sharp Processing
    ├─ Resize to 360px width → WebP 70% quality → ~20KB
    ├─ Resize to 720px width → WebP 70% quality → ~80KB
    ├─ Resize to 1080px width → WebP 70% quality → ~150KB
    └─ Resize to 24px width → WebP 35% quality → ~2KB (blur)
                                                      ↓
                                          Embedded as data URL
```

**Result:** 97% size reduction (5MB → 150KB for best quality)

### 2. Lazy Loading Strategy

```
Component Mount
    ↓
AssetPicker checks auth
    ↓ (if authenticated)
Fetch 4 recent assets
    ↓
Render thumbnails with:
    ├─ Blur placeholder (instant, <1KB)
    ├─ loading="lazy" attribute
    └─ Intersection Observer
        ↓ (when visible)
        Load 360px WebP
```

### 3. Caching Strategy

```
Browser
    ↓
Request: GET /storage/user-assets/xyz-720.webp
    ↓
CDN (Supabase CDN)
    ├─ Cache-Control: public, max-age=31536000
    └─ Hit: Serve from cache (0ms)
        Miss: Fetch from storage → Cache → Serve
```

### 4. Database Indexing

```sql
-- Primary access pattern: user's recent assets
CREATE INDEX idx_user_assets_user_id 
ON user_assets(user_id, created_at DESC);

-- Filter by type
CREATE INDEX idx_user_assets_type 
ON user_assets(asset_type, user_id);

-- Last used sorting
CREATE INDEX idx_user_assets_last_used 
ON user_assets(user_id, last_used_at DESC);

-- Deduplication lookup
CREATE INDEX idx_user_assets_content_hash 
ON user_assets(user_id, content_hash);

-- Favorites filter
CREATE INDEX idx_user_assets_favorites 
ON user_assets(user_id, is_favorite) 
WHERE is_favorite = TRUE;
```

---

## 🧪 Testing Strategy

### Unit Tests (Recommended)

```javascript
// AssetThumbnail.test.js
describe('AssetThumbnail', () => {
  it('shows blur placeholder immediately');
  it('loads thumbnail with lazy loading');
  it('handles load errors gracefully');
  it('shows favorite indicator when is_favorite=true');
  it('calls onClick when clicked');
});

// AssetPicker.test.js
describe('AssetPicker', () => {
  it('fetches recent assets on mount');
  it('does not render for anonymous users');
  it('calls onSelect when asset clicked');
  it('updates last_used_at when asset selected');
});

// /api/user-assets
describe('GET /api/user-assets', () => {
  it('requires authentication');
  it('filters by asset_type');
  it('paginates correctly');
  it('filters favorites');
});

describe('POST /api/user-assets', () => {
  it('saves new asset with variants');
  it('deduplicates by content hash');
  it('deletes asset and updates state');
  it('toggles favorite status');
});
```

### Integration Tests

```javascript
// Asset upload → save → reuse flow
test('user can upload, save, and reuse asset', async () => {
  // 1. Upload image in app
  const file = new File(['...'], 'test.jpg');
  await uploadImage(file);
  
  // 2. Verify saved to library
  const assets = await fetchAssets();
  expect(assets).toHaveLength(1);
  
  // 3. Reuse in another app
  await selectAsset(assets[0].id);
  expect(inputField.value).toBe(assets[0].url);
  
  // 4. Verify last_used_at updated
  const updated = await fetchAssets();
  expect(updated[0].last_used_at).toBeAfter(assets[0].last_used_at);
});
```

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

```javascript
// PostHog Events
{
  event: 'asset_uploaded',
  properties: {
    user_id: string,
    asset_type: 'input' | 'output',
    file_size_kb: number,
    deduplicated: boolean
  }
}

{
  event: 'asset_reused',
  properties: {
    user_id: string,
    asset_id: string,
    app_id: string,
    time_since_upload_days: number
  }
}

{
  event: 'library_viewed',
  properties: {
    user_id: string,
    total_assets: number,
    uploads_count: number,
    generated_count: number
  }
}

{
  event: 'asset_deleted',
  properties: {
    user_id: string,
    asset_id: string,
    asset_age_days: number
  }
}
```

### Database Queries for Analytics

```sql
-- Asset reuse rate
SELECT 
  COUNT(DISTINCT user_id) as users_reusing,
  AVG(reuse_count) as avg_reuses_per_user
FROM (
  SELECT 
    user_id,
    COUNT(*) as reuse_count
  FROM user_assets
  WHERE last_used_at > created_at + INTERVAL '1 minute'
  GROUP BY user_id
) subquery;

-- Most reused assets
SELECT 
  asset_type,
  source_app_id,
  COUNT(*) as reuse_count
FROM user_assets
WHERE last_used_at > created_at + INTERVAL '1 minute'
GROUP BY asset_type, source_app_id
ORDER BY reuse_count DESC
LIMIT 10;

-- Storage usage per user
SELECT 
  user_id,
  COUNT(*) as asset_count,
  SUM(file_size_bytes) / 1024 / 1024 as storage_mb
FROM user_assets
GROUP BY user_id
ORDER BY storage_mb DESC
LIMIT 20;

-- Deduplication effectiveness
SELECT 
  content_hash,
  COUNT(*) as duplicate_count
FROM user_assets
WHERE content_hash IS NOT NULL
GROUP BY content_hash
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

---

## 🔮 Future Enhancements Roadmap

### Phase 2: Advanced Features
- [ ] Asset collections/albums
- [ ] Search assets by app or date
- [ ] Bulk operations (select multiple → delete)
- [ ] Storage quota enforcement
- [ ] Auto-cleanup of unused assets

### Phase 3: Social Features
- [ ] Share assets publicly (shareable links)
- [ ] Asset comments/notes
- [ ] Community asset templates

### Phase 4: AI Features
- [ ] AI-powered asset tagging
- [ ] Semantic similarity search
- [ ] Auto-categorization
- [ ] Smart suggestions based on app type

---

## 📚 Technical References

### Image Optimization
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WebP Format Guide](https://developers.google.com/speed/webp)
- [Blur Placeholder Technique](https://blurha.sh/)

### Performance
- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [Lazy Loading Images](https://web.dev/lazy-loading-images/)
- [CDN Caching Strategies](https://web.dev/http-cache/)

### Database
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Architecture Version:** 1.0  
**Last Updated:** November 19, 2024  
**Status:** Production Ready ✅

