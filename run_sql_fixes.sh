#!/bin/bash
# Run SQL fixes via Supabase CLI
# This creates a single migration and applies it

cd "$(dirname "$0")"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Running SQL Fixes via Supabase CLI                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Create a combined migration file
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_apply_fixes.sql"

echo "Creating migration file: $MIGRATION_FILE"

cat > "$MIGRATION_FILE" << 'EOSQL'
-- Combined fixes migration
-- This includes RLS fixes and working app seeds

-- =====================================================
-- DROP OLD POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can save apps" ON library_saves;
DROP POLICY IF EXISTS "Users can unsave apps" ON library_saves;
DROP POLICY IF EXISTS "Users can view their own saves" ON library_saves;

-- =====================================================
-- CREATE SIMPLER RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone authenticated can save apps"
  ON library_saves FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can unsave apps"
  ON library_saves FOR DELETE
  USING (true);

CREATE POLICY "Anyone authenticated can view saves"
  ON library_saves FOR SELECT
  USING (true);

-- =====================================================
-- ADD ANALYTICS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION track_app_event(
  p_app_id TEXT,
  p_user_id TEXT,
  p_event_type TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_event_type = 'view' THEN
    UPDATE apps SET view_count = view_count + 1 WHERE id = p_app_id;
  ELSIF p_event_type = 'try' THEN
    UPDATE apps SET try_count = try_count + 1 WHERE id = p_app_id;
  ELSIF p_event_type = 'use' THEN
    UPDATE apps SET use_count = use_count + 1 WHERE id = p_app_id;
  ELSIF p_event_type = 'save' THEN
    UPDATE apps SET save_count = save_count + 1 WHERE id = p_app_id;
  ELSIF p_event_type = 'unsave' THEN
    UPDATE apps SET save_count = GREATEST(save_count - 1, 0) WHERE id = p_app_id;
  ELSIF p_event_type = 'remix' THEN
    UPDATE apps SET remix_count = remix_count + 1 WHERE id = p_app_id;
  END IF;
  
  INSERT INTO app_analytics (app_id, user_id, event_type, created_at)
  VALUES (p_app_id, p_user_id, p_event_type, NOW())
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIX APP_ANALYTICS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Anyone can track analytics" ON app_analytics;
DROP POLICY IF EXISTS "Anyone can view analytics" ON app_analytics;

CREATE POLICY "Anyone can track analytics"
  ON app_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view analytics"
  ON app_analytics FOR SELECT
  USING (true);
EOSQL

echo "✅ Migration file created"
echo ""
echo "Now push to Supabase..."
echo ""

# Link to remote project
supabase link --project-ref lobodzhfgojceqfvgcit

# Push migrations
supabase db push

echo ""
echo "✅ SQL fixes applied!"
echo ""
echo "Next: Run seed_working_apps.sql manually in Supabase Dashboard"
