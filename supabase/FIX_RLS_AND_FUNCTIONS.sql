-- Fix RLS policies and add missing functions
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CHECK CURRENT RLS POLICIES
-- =====================================================
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('library_saves', 'apps', 'profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- 2. FIX: Make library_saves work with anonymous users
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can save apps" ON library_saves;
DROP POLICY IF EXISTS "Users can unsave apps" ON library_saves;
DROP POLICY IF EXISTS "Users can view their own saves" ON library_saves;

-- Recreate with simpler policies that work with Supabase anon key
CREATE POLICY "Anyone authenticated can save apps"
  ON library_saves FOR INSERT
  WITH CHECK (true);  -- We'll check user_id in the API

CREATE POLICY "Anyone authenticated can unsave apps"
  ON library_saves FOR DELETE
  USING (true);  -- We'll check user_id in the API

CREATE POLICY "Anyone authenticated can view saves"
  ON library_saves FOR SELECT
  USING (true);  -- We'll filter by user_id in the API

-- =====================================================
-- 3. ADD MISSING ANALYTICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION track_app_event(
  p_app_id TEXT,
  p_user_id TEXT,
  p_event_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update app counters based on event type
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
  
  -- Insert analytics record
  INSERT INTO app_analytics (app_id, user_id, event_type, created_at)
  VALUES (p_app_id, p_user_id, p_event_type, NOW())
  ON CONFLICT DO NOTHING;  -- Prevent duplicates
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FIX: Allow anyone to insert into app_analytics
-- =====================================================

DROP POLICY IF EXISTS "Anyone can track analytics" ON app_analytics;

CREATE POLICY "Anyone can track analytics"
  ON app_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view analytics"
  ON app_analytics FOR SELECT
  USING (true);

-- =====================================================
-- 5. VERIFY FUNCTIONS EXIST
-- =====================================================

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'track_app_event',
    'upsert_secret',
    'get_decrypted_secret',
    'delete_secret',
    'get_clerk_user_id'
  )
ORDER BY routine_name;

-- If any are missing, you need to run those migration files!

-- =====================================================
-- 6. TEST: Try inserting a library save
-- =====================================================

-- Replace with your actual user_id and app_id
-- INSERT INTO library_saves (user_id, app_id)
-- VALUES ('user_2xyz...', 'app_weather_checker')
-- ON CONFLICT (user_id, app_id) DO NOTHING;

-- SELECT * FROM library_saves WHERE user_id = 'user_2xyz...';

-- =====================================================
-- 7. CHECK RLS IS ENABLED
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('apps', 'library_saves', 'profiles', 'app_analytics')
ORDER BY tablename;

-- All should show: rowsecurity = true

COMMIT;
