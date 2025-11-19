-- User Assets Library Migration
-- Allows users to store and reuse uploaded images and generated outputs

-- =====================================================
-- 1. CREATE USER_ASSETS TABLE
-- =====================================================
CREATE TABLE user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Asset metadata
  asset_type TEXT NOT NULL CHECK (asset_type IN ('input', 'output')),
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'generated', 'url')),
  mime_type TEXT NOT NULL,
  
  -- Storage URLs (optimized variants)
  url TEXT NOT NULL,              -- Default 720p WebP
  url_360 TEXT,                   -- Mobile optimized
  url_1080 TEXT,                  -- High quality
  blur_data_url TEXT,             -- Tiny blur placeholder
  
  -- Original metadata
  original_filename TEXT,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  content_hash TEXT,              -- SHA-1 for deduplication
  
  -- Context tracking
  source_run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
  source_app_id TEXT REFERENCES apps(id) ON DELETE SET NULL,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_assets
CREATE INDEX idx_user_assets_user_id ON user_assets(user_id, created_at DESC);
CREATE INDEX idx_user_assets_type ON user_assets(asset_type, user_id);
CREATE INDEX idx_user_assets_source_type ON user_assets(source_type);
CREATE INDEX idx_user_assets_last_used ON user_assets(user_id, last_used_at DESC);
CREATE INDEX idx_user_assets_favorites ON user_assets(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_user_assets_content_hash ON user_assets(user_id, content_hash) WHERE content_hash IS NOT NULL;

-- =====================================================
-- 2. ADD COLUMNS TO RUNS TABLE (if not exist)
-- =====================================================
DO $$ 
BEGIN
  -- Add asset_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runs' AND column_name = 'asset_url'
  ) THEN
    ALTER TABLE runs ADD COLUMN asset_url TEXT;
  END IF;

  -- Add asset_type if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runs' AND column_name = 'asset_type'
  ) THEN
    ALTER TABLE runs ADD COLUMN asset_type TEXT;
  END IF;

  -- Add input_asset_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runs' AND column_name = 'input_asset_url'
  ) THEN
    ALTER TABLE runs ADD COLUMN input_asset_url TEXT;
  END IF;

  -- Add input_asset_mime if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runs' AND column_name = 'input_asset_mime'
  ) THEN
    ALTER TABLE runs ADD COLUMN input_asset_mime TEXT;
  END IF;

  -- Add preview_blur if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runs' AND column_name = 'preview_blur'
  ) THEN
    ALTER TABLE runs ADD COLUMN preview_blur TEXT;
  END IF;
END $$;

-- =====================================================
-- 3. ADD COLUMNS TO APPS TABLE FOR PREVIEW_BLUR
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apps' AND column_name = 'preview_blur'
  ) THEN
    ALTER TABLE apps ADD COLUMN preview_blur TEXT;
  END IF;
END $$;

-- =====================================================
-- 4. BACKFILL EXISTING RUNS TO USER_ASSETS
-- =====================================================
-- This will populate user_assets from existing runs that have images
-- Note: Run this after the table is created to preserve historical data

INSERT INTO user_assets (
  user_id,
  asset_type,
  source_type,
  mime_type,
  url,
  source_run_id,
  source_app_id,
  created_at
)
SELECT 
  r.user_id,
  'output' as asset_type,
  'generated' as source_type,
  COALESCE(r.asset_type, 'image/jpeg') as mime_type,
  r.asset_url as url,
  r.id as source_run_id,
  r.app_id as source_app_id,
  r.created_at
FROM runs r
WHERE r.asset_url IS NOT NULL 
  AND r.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_assets ua 
    WHERE ua.source_run_id = r.id AND ua.asset_type = 'output'
  )
ON CONFLICT DO NOTHING;

-- Backfill input assets
INSERT INTO user_assets (
  user_id,
  asset_type,
  source_type,
  mime_type,
  url,
  source_run_id,
  source_app_id,
  created_at
)
SELECT 
  r.user_id,
  'input' as asset_type,
  'upload' as source_type,
  COALESCE(r.input_asset_mime, 'image/jpeg') as mime_type,
  r.input_asset_url as url,
  r.id as source_run_id,
  r.app_id as source_app_id,
  r.created_at
FROM runs r
WHERE r.input_asset_url IS NOT NULL 
  AND r.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_assets ua 
    WHERE ua.source_run_id = r.id AND ua.asset_type = 'input'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CREATE HELPER FUNCTION TO UPDATE LAST_USED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_asset_last_used(
  p_user_id TEXT,
  p_asset_url TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_assets
  SET last_used_at = NOW()
  WHERE user_id = p_user_id 
    AND url = p_asset_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE user_assets IS 'User asset library for reusable uploads and generated images';
COMMENT ON COLUMN user_assets.asset_type IS 'Type: input (uploaded) or output (generated)';
COMMENT ON COLUMN user_assets.source_type IS 'Source: upload, generated, or url';
COMMENT ON COLUMN user_assets.content_hash IS 'SHA-1 hash for deduplication';
COMMENT ON COLUMN user_assets.last_used_at IS 'Updated when asset is reused in an app';

