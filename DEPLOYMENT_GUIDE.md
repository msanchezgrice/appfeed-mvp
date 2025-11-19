# User Asset Library - Deployment Guide

## 🚀 Quick Start Deployment

Follow these steps to deploy the User Asset Library feature to production.

---

## Step 1: Database Migration

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20251119000001_user_assets.sql`
5. Paste and click **Run**
6. Wait for confirmation (should take ~5 seconds)

### Option B: Supabase CLI

```bash
# Make sure you're in the project root
cd /Users/miguel/Desktop/appfeed-mvp

# Run the migration
supabase db push
```

### Verify Migration Success

Run this query in SQL Editor:

```sql
-- Check if user_assets table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_assets'
);

-- Should return: true

-- Check columns were added to runs table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'runs' 
  AND column_name IN ('asset_url', 'input_asset_url', 'preview_blur');

-- Should return 3 rows
```

---

## Step 2: Deploy to Vercel

### Automatic Deployment (If Connected)

```bash
# Commit all changes
git add .
git commit -m "feat: Add user asset library with image reuse functionality

- New user_assets table for storing uploads and generated images
- AssetPicker component for reusing previous uploads
- Full Library page at /library with management tools
- Auto-save assets when running apps
- Image optimization with WebP variants and blur placeholders"

# Push to main (or your production branch)
git push origin main
```

Vercel will automatically deploy. Monitor at: https://vercel.com/your-team/appfeed-mvp

### Manual Deployment

```bash
# Install Vercel CLI if not already
npm i -g vercel

# Deploy to production
vercel --prod

# Follow prompts
```

---

## Step 3: Verify Deployment

### Automated Health Check

```bash
# After deployment completes
curl https://your-app.vercel.app/api/user-assets?type=input&limit=1

# Should return (when authenticated):
# {"assets":[],"total":0,"hasMore":false}

# Or 401 if not authenticated (expected)
```

### Manual Testing

1. **Visit your deployed app** (e.g., https://appfeed-mvp.vercel.app)

2. **Sign in** with your account

3. **Test Asset Upload Flow:**
   - Go to an app with image input
   - Upload a test image
   - Run the app
   - Navigate to `/library`
   - Verify your uploaded image appears in "Uploads" tab
   - Verify generated image appears in "Generated" tab

4. **Test Asset Reuse Flow:**
   - Go to a different app with image input
   - Look below the file input for AssetPicker
   - Verify thumbnails of recent uploads appear
   - Click a thumbnail
   - Verify it populates the input field
   - Run the app successfully

5. **Test Library Page:**
   - Click "Library" in bottom navigation
   - Verify tabs work (Uploads / Generated)
   - Click an asset to view full-screen
   - Test favorite button (⭐)
   - Test download button (⬇️)
   - Test delete button (🗑️)

---

## Step 4: Monitor Performance

### Check Logs

```bash
# Vercel CLI
vercel logs --follow

# Look for:
# ✅ "[API /runs] Saved input to user assets library"
# ✅ "[API /runs] Saved output to user assets library"
# ✅ "[user-assets] Saved new asset: {uuid}"
```

### Monitor Database

```sql
-- Check assets are being created
SELECT 
  asset_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM user_assets
GROUP BY asset_type;

-- Expected output after a few test runs:
-- asset_type | count | latest
-- input      | 3     | 2024-11-19 10:30:00
-- output     | 3     | 2024-11-19 10:30:00
```

### Check Storage Usage

1. Go to Supabase Dashboard → Storage
2. Navigate to `app-images` bucket
3. Check `user-assets/` folder
4. Verify files are being created with proper structure:
   ```
   user-assets/
     {userId}/
       uploads/
         {timestamp}-360.webp
         {timestamp}-720.webp
         {timestamp}-1080.webp
   ```

---

## Step 5: Post-Deployment Configuration (Optional)

### Set Up Monitoring

Add these alerts in your monitoring tool:

1. **Asset Creation Failures**
   - Alert if error rate on `/api/user-assets` > 5%
   - Check logs for "User assets save error"

2. **Storage Growth**
   - Alert if storage exceeds expected growth rate
   - Monitor: Supabase Storage dashboard

3. **Performance**
   - Alert if `/api/user-assets` response time > 2s
   - Monitor: Vercel Analytics

### Enable Analytics (Recommended)

Add to `src/lib/analytics.js`:

```javascript
// Asset tracking events
export const analytics = {
  // ... existing events ...
  
  assetUploaded(userId, assetType, fileSize) {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('asset_uploaded', {
        user_id: userId,
        asset_type: assetType,
        file_size_kb: Math.round(fileSize / 1024)
      });
    }
  },
  
  assetReused(userId, assetId, appId) {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('asset_reused', {
        user_id: userId,
        asset_id: assetId,
        app_id: appId
      });
    }
  },
  
  libraryViewed(userId, assetCount) {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('library_viewed', {
        user_id: userId,
        asset_count: assetCount
      });
    }
  }
};
```

### Storage Quota (Future)

If you want to limit storage per user:

```sql
-- Add storage quota column to profiles
ALTER TABLE profiles ADD COLUMN storage_used_bytes BIGINT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN storage_quota_bytes BIGINT DEFAULT 104857600; -- 100MB

-- Update storage used when assets are added/deleted
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET storage_used_bytes = storage_used_bytes + NEW.file_size_bytes
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET storage_used_bytes = storage_used_bytes - OLD.file_size_bytes
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_storage_trigger
AFTER INSERT OR DELETE ON user_assets
FOR EACH ROW
EXECUTE FUNCTION update_user_storage();
```

---

## Troubleshooting Common Issues

### Issue: Migration Fails

**Error:** `relation "user_assets" already exists`

**Solution:** Table may already exist from a previous migration. Check:

```sql
SELECT * FROM user_assets LIMIT 1;
```

If it exists and has correct columns, you're good. Otherwise, drop and recreate:

```sql
DROP TABLE IF EXISTS user_assets CASCADE;
-- Then re-run migration
```

---

### Issue: Assets Not Saving

**Symptom:** User uploads image, but it doesn't appear in library

**Debug Steps:**

1. Check browser console for errors
2. Check Vercel logs for "/api/runs" endpoint
3. Verify user is authenticated (Clerk session exists)
4. Check Supabase logs for insert errors

**Common Causes:**

- ❌ User not authenticated → Asset save skipped (by design)
- ❌ Supabase RLS blocking insert → Check policies
- ❌ Storage bucket doesn't exist → Create `app-images` bucket
- ❌ Sharp dependency missing → Re-deploy to rebuild

---

### Issue: Images Not Loading

**Symptom:** Thumbnails show "Failed to load"

**Debug Steps:**

1. Check Network tab in browser dev tools
2. Look for 403/404 errors on image URLs
3. Verify Supabase Storage bucket is public

**Solution:**

```sql
-- Make app-images bucket public
-- In Supabase Dashboard → Storage → app-images → Settings
-- Enable: Public bucket
```

Or via SQL:

```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'app-images';
```

---

### Issue: Slow Loading

**Symptom:** Library page takes >3s to load

**Debug Steps:**

1. Check query response times in Vercel logs
2. Check Supabase database performance metrics
3. Verify indexes exist on user_assets table

**Solutions:**

```sql
-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_assets_user_id 
ON user_assets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_assets_type 
ON user_assets(asset_type, user_id);

-- Analyze table for query planner
ANALYZE user_assets;
```

---

## Rollback Plan (If Needed)

If you need to rollback the feature:

### 1. Remove Navigation Link

```javascript
// src/components/BottomNav.js
// Remove Library item from navItems array
```

### 2. Remove AssetPicker from AppForm

```javascript
// src/components/AppForm.js
// Comment out:
// import AssetPicker from './AssetPicker';
// And the <AssetPicker /> component usage
```

### 3. Stop Auto-Saving Assets

```javascript
// src/app/api/runs/route.js
// Comment out the "Save assets to user library" section
```

### 4. (Optional) Drop Database Table

⚠️ **CAUTION:** This will delete all user assets permanently!

```sql
DROP TABLE IF EXISTS user_assets CASCADE;
```

---

## Performance Benchmarks

After deployment, you should see:

| Metric | Target | Actual |
|--------|--------|--------|
| Asset picker load time | <100ms | ⏱️ Test |
| Library page initial load | <1s | ⏱️ Test |
| Thumbnail load time | <200ms | ⏱️ Test |
| Full image load time | <500ms | ⏱️ Test |
| Asset reuse vs upload speed | 5x faster | ⏱️ Test |

---

## Success Criteria

✅ Migration completes without errors  
✅ Assets saved automatically when apps run  
✅ AssetPicker shows recent uploads  
✅ Library page displays all assets correctly  
✅ Can favorite/delete/download assets  
✅ Can reuse assets in different apps  
✅ No increase in app run failures  
✅ Page load times remain <2s  

---

## Support & Maintenance

### Regular Maintenance

**Weekly:**
- Check storage growth rate
- Monitor error logs for asset save failures
- Review user feedback on feature

**Monthly:**
- Analyze asset reuse rate (target: >30%)
- Check library engagement rate (target: >20%)
- Review storage costs vs projections

**Quarterly:**
- Consider implementing auto-cleanup (assets >90 days)
- Evaluate need for storage quotas
- Review and optimize slow queries

### Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Check Vercel logs: `vercel logs --follow`
3. Check Supabase logs in dashboard
4. Review `USER_ASSET_LIBRARY_IMPLEMENTATION.md` for technical details

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Production URL:** _____________  
**Status:** ✅ Complete

---

Happy deploying! 🚀

