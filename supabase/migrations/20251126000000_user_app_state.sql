-- User App State
-- Stores per-user, per-app state (inputs, outputs, last run) with schema versioning

CREATE TABLE user_app_state (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  state JSONB DEFAULT '{}'::jsonb,
  inputs JSONB DEFAULT '{}'::jsonb,
  state_schema_version INTEGER DEFAULT 1,
  last_run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  size_bytes INTEGER GENERATED ALWAYS AS (octet_length(state::text) + octet_length(inputs::text)) STORED,
  CONSTRAINT user_app_state_pkey PRIMARY KEY (user_id, app_id),
  CONSTRAINT user_app_state_size CHECK (octet_length(state::text) + octet_length(inputs::text) <= 262144)
);

CREATE INDEX idx_user_app_state_app ON user_app_state(app_id, updated_at DESC);
CREATE INDEX idx_user_app_state_user ON user_app_state(user_id, updated_at DESC);

ALTER TABLE user_app_state ENABLE ROW LEVEL SECURITY;

-- Policies: owners can manage their state
CREATE POLICY "Users can view their app state"
  ON user_app_state FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their app state"
  ON user_app_state FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their app state"
  ON user_app_state FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Helper to bump updated_at
CREATE OR REPLACE FUNCTION set_updated_at_user_app_state()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_app_state_updated_at
BEFORE UPDATE ON user_app_state
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_user_app_state();
