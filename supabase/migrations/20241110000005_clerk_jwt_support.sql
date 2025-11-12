-- AppFeed MVP - Add Clerk JWT Support
-- This migration adds a helper function to extract Clerk user ID from JWT
-- and updates all RLS policies to use it

-- =====================================================
-- 1. CREATE CLERK JWT HELPER FUNCTION
-- =====================================================

-- Function to extract Clerk user ID from JWT token
-- Clerk puts the user ID in the 'sub' claim of the JWT
CREATE OR REPLACE FUNCTION public.get_clerk_user_id() 
RETURNS TEXT AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('request.jwt.claim.sub', true)
    ),
    ''
  )::TEXT;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_clerk_user_id IS 'Extracts Clerk user ID from JWT token';

-- =====================================================
-- 2. DROP OLD POLICIES
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Apps
DROP POLICY IF EXISTS "Apps are viewable based on publish status" ON apps;
DROP POLICY IF EXISTS "Authenticated users can create apps" ON apps;
DROP POLICY IF EXISTS "Users can update their own apps" ON apps;
DROP POLICY IF EXISTS "Users can delete their own apps" ON apps;

-- Library saves
DROP POLICY IF EXISTS "Users can view their own saves" ON library_saves;
DROP POLICY IF EXISTS "Users can save apps" ON library_saves;
DROP POLICY IF EXISTS "Users can unsave apps" ON library_saves;

-- Follows
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

-- Runs
DROP POLICY IF EXISTS "Users can view their own runs" ON runs;
DROP POLICY IF EXISTS "Users can create runs" ON runs;
DROP POLICY IF EXISTS "Creators can view runs of their apps" ON runs;

-- Secrets
DROP POLICY IF EXISTS "Users can view their own secret metadata" ON secrets;
DROP POLICY IF EXISTS "Users can insert their own secrets" ON secrets;
DROP POLICY IF EXISTS "Users can update their own secrets" ON secrets;
DROP POLICY IF EXISTS "Users can delete their own secrets" ON secrets;

-- Likes
DROP POLICY IF EXISTS "Users can like apps" ON likes;
DROP POLICY IF EXISTS "Users can unlike apps" ON likes;

-- App analytics
DROP POLICY IF EXISTS "Users can view their own analytics" ON app_analytics;

-- Todos
DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
DROP POLICY IF EXISTS "Users can create todos" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;

-- =====================================================
-- 3. RECREATE POLICIES WITH CLERK JWT
-- =====================================================

-- PROFILES
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (public.get_clerk_user_id() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (public.get_clerk_user_id() = id);

-- APPS
CREATE POLICY "Apps are viewable based on publish status"
  ON apps FOR SELECT
  USING (is_published = TRUE OR creator_id = public.get_clerk_user_id());

CREATE POLICY "Authenticated users can create apps"
  ON apps FOR INSERT
  WITH CHECK (
    public.get_clerk_user_id() IS NOT NULL 
    AND public.get_clerk_user_id() = creator_id
  );

CREATE POLICY "Users can update their own apps"
  ON apps FOR UPDATE
  USING (public.get_clerk_user_id() = creator_id);

CREATE POLICY "Users can delete their own apps"
  ON apps FOR DELETE
  USING (public.get_clerk_user_id() = creator_id);

-- LIBRARY_SAVES
CREATE POLICY "Users can view their own saves"
  ON library_saves FOR SELECT
  USING (public.get_clerk_user_id() = user_id);

CREATE POLICY "Users can save apps"
  ON library_saves FOR INSERT
  WITH CHECK (
    public.get_clerk_user_id() IS NOT NULL 
    AND public.get_clerk_user_id() = user_id
  );

CREATE POLICY "Users can unsave apps"
  ON library_saves FOR DELETE
  USING (public.get_clerk_user_id() = user_id);

-- FOLLOWS
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (
    public.get_clerk_user_id() IS NOT NULL 
    AND public.get_clerk_user_id() = follower_id
  );

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (public.get_clerk_user_id() = follower_id);

-- RUNS
CREATE POLICY "Users can view their own runs"
  ON runs FOR SELECT
  USING (public.get_clerk_user_id() = user_id);

CREATE POLICY "Users can create runs"
  ON runs FOR INSERT
  WITH CHECK (
    public.get_clerk_user_id() IS NOT NULL 
    AND public.get_clerk_user_id() = user_id
  );

CREATE POLICY "Creators can view runs of their apps"
  ON runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = runs.app_id
      AND apps.creator_id = public.get_clerk_user_id()
    )
  );

-- SECRETS (CRITICAL - MAXIMUM SECURITY)
CREATE POLICY "Users can view their own secret metadata"
  ON secrets FOR SELECT
  USING (public.get_clerk_user_id() = user_id);

CREATE POLICY "Users can insert their own secrets"
  ON secrets FOR INSERT
  WITH CHECK (
    public.get_clerk_user_id() IS NOT NULL 
    AND public.get_clerk_user_id() = user_id
  );

CREATE POLICY "Users can update their own secrets"
  ON secrets FOR UPDATE
  USING (public.get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete their own secrets"
  ON secrets FOR DELETE
  USING (public.get_clerk_user_id() = user_id);

-- LIKES
CREATE POLICY "Users can like apps"
  ON likes FOR INSERT
  WITH CHECK (
    public.get_clerk_user_id() IS NOT NULL 
    AND public.get_clerk_user_id() = user_id
  );

CREATE POLICY "Users can unlike apps"
  ON likes FOR DELETE
  USING (public.get_clerk_user_id() = user_id);

-- APP_ANALYTICS
CREATE POLICY "Users can view their own analytics"
  ON app_analytics FOR SELECT
  USING (public.get_clerk_user_id() = user_id);

-- TODOS
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (public.get_clerk_user_id() = user_id);

CREATE POLICY "Users can create todos"
  ON todos FOR INSERT
  WITH CHECK (
    public.get_clerk_user_id() IS NOT NULL 
    AND public.get_clerk_user_id() = user_id
  );

CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (public.get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (public.get_clerk_user_id() = user_id);
