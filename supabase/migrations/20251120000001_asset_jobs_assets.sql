-- Marketing Asset Jobs & Asset Library
-- Adds asset_jobs (poster/og/demo/gif/copy tasks) and app_assets (generated outputs)

-- =====================================================
-- 1) TABLES
-- =====================================================
CREATE TABLE asset_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('poster', 'og', 'demo', 'gif', 'thumb', 'copy')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'complete', 'failed')),
  inputs JSONB DEFAULT '{}'::jsonb,
  outputs JSONB,
  error TEXT,
  created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asset_jobs_app ON asset_jobs(app_id, created_at DESC);
CREATE INDEX idx_asset_jobs_status ON asset_jobs(status);

CREATE TABLE app_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('poster', 'og', 'demo', 'gif', 'thumb', 'copy')),
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  blur_data_url TEXT,
  variant_id TEXT,
  run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
  prompt TEXT,
  created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_assets_app ON app_assets(app_id, created_at DESC);
CREATE INDEX idx_app_assets_kind ON app_assets(kind, app_id);

-- =====================================================
-- 2) RLS POLICIES
-- =====================================================
ALTER TABLE asset_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_assets ENABLE ROW LEVEL SECURITY;

-- Asset jobs: owner or app creator can view/manage
CREATE POLICY "Asset jobs are viewable by app creator"
  ON asset_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apps a
      WHERE a.id = asset_jobs.app_id
        AND a.creator_id = auth.uid()::text
    )
  );

CREATE POLICY "Asset jobs can be inserted by app creator"
  ON asset_jobs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM apps a
      WHERE a.id = app_id
        AND a.creator_id = auth.uid()::text
    )
  );

CREATE POLICY "Asset jobs can be updated by app creator"
  ON asset_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM apps a
      WHERE a.id = asset_jobs.app_id
        AND a.creator_id = auth.uid()::text
    )
  );

-- App assets: published apps are viewable by anyone; creators can manage
CREATE POLICY "App assets are viewable if app is published or creator"
  ON app_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apps a
      WHERE a.id = app_assets.app_id
        AND (a.is_published = TRUE OR a.creator_id = auth.uid()::text)
    )
  );

CREATE POLICY "App assets can be inserted by app creator"
  ON app_assets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM apps a
      WHERE a.id = app_id
        AND a.creator_id = auth.uid()::text
    )
  );

CREATE POLICY "App assets can be updated by app creator"
  ON app_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM apps a
      WHERE a.id = app_assets.app_id
        AND a.creator_id = auth.uid()::text
    )
  );

CREATE POLICY "App assets can be deleted by app creator"
  ON app_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM apps a
      WHERE a.id = app_assets.app_id
        AND a.creator_id = auth.uid()::text
    )
  );

-- =====================================================
-- 3) TIMESTAMP TRIGGERS
-- =====================================================
CREATE TRIGGER asset_jobs_updated_at
  BEFORE UPDATE ON asset_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER app_assets_updated_at
  BEFORE UPDATE ON app_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4) COMMENTS
-- =====================================================
COMMENT ON TABLE asset_jobs IS 'Queued and processed marketing asset jobs (poster, og, demo, gif, copy)';
COMMENT ON TABLE app_assets IS 'Generated marketing assets linked to an app (poster, og, demo, gif, copy)';
