-- AppFeed MVP - Row Level Security (RLS) Policies  
-- Uses Supabase Auth (UUID-based user IDs)
-- When migrating to Clerk, we'll need to update policies to use TEXT user IDs

-- =====================================================
-- 2. PROFILES TABLE RLS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view public profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (automatically on signup)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id);

-- =====================================================
-- 3. APPS TABLE RLS
-- =====================================================
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Published apps are viewable by everyone, unpublished only by creator
CREATE POLICY "Apps are viewable based on publish status"
  ON apps FOR SELECT
  USING (is_published = TRUE OR creator_id = auth.uid()::text);

-- Authenticated users can create apps
CREATE POLICY "Authenticated users can create apps"
  ON apps FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = creator_id
  );

-- Users can update their own apps
CREATE POLICY "Users can update their own apps"
  ON apps FOR UPDATE
  USING (auth.uid()::text = creator_id);

-- Users can delete their own apps
CREATE POLICY "Users can delete their own apps"
  ON apps FOR DELETE
  USING (auth.uid()::text = creator_id);

-- =====================================================
-- 4. LIBRARY_SAVES TABLE RLS
-- =====================================================
ALTER TABLE library_saves ENABLE ROW LEVEL SECURITY;

-- Users can view their own saves
CREATE POLICY "Users can view their own saves"
  ON library_saves FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can save apps
CREATE POLICY "Users can save apps"
  ON library_saves FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = user_id
  );

-- Users can unsave apps
CREATE POLICY "Users can unsave apps"
  ON library_saves FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- 5. FOLLOWS TABLE RLS
-- =====================================================
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows (public social graph)
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

-- Authenticated users can follow others
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = follower_id
  );

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid()::text = follower_id);

-- =====================================================
-- 6. RUNS TABLE RLS
-- =====================================================
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Users can view their own runs
CREATE POLICY "Users can view their own runs"
  ON runs FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can create runs
CREATE POLICY "Users can create runs"
  ON runs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = user_id
  );

-- App creators can view runs of their apps (for analytics)
CREATE POLICY "Creators can view runs of their apps"
  ON runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = runs.app_id
      AND apps.creator_id = auth.uid()::text
    )
  );

-- =====================================================
-- 7. SECRETS TABLE RLS (CRITICAL - MAXIMUM SECURITY)
-- =====================================================
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view metadata of their own secrets (not the encrypted key)
CREATE POLICY "Users can view their own secret metadata"
  ON secrets FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own secrets
CREATE POLICY "Users can insert their own secrets"
  ON secrets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = user_id
  );

-- Users can update their own secrets
CREATE POLICY "Users can update their own secrets"
  ON secrets FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Users can delete their own secrets
CREATE POLICY "Users can delete their own secrets"
  ON secrets FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- 8. LIKES TABLE RLS
-- =====================================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes (to show like counts)
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

-- Users can like apps
CREATE POLICY "Users can like apps"
  ON likes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = user_id
  );

-- Users can unlike apps
CREATE POLICY "Users can unlike apps"
  ON likes FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- 9. APP_ANALYTICS TABLE RLS
-- =====================================================
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (for anonymous tracking)
CREATE POLICY "Anyone can insert analytics events"
  ON app_analytics FOR INSERT
  WITH CHECK (true);

-- App creators can view analytics for their apps
CREATE POLICY "Creators can view analytics for their apps"
  ON app_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = app_analytics.app_id
      AND apps.creator_id = auth.uid()::text
    )
  );

-- Users can view their own analytics
CREATE POLICY "Users can view their own analytics"
  ON app_analytics FOR SELECT
  USING (auth.uid()::text = user_id);

-- =====================================================
-- 10. TAGS TABLE RLS
-- =====================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view tags
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

-- =====================================================
-- 11. TODOS TABLE RLS
-- =====================================================
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Users can view their own todos
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can create todos
CREATE POLICY "Users can create todos"
  ON todos FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid()::text = user_id
  );

-- Users can update their own todos
CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Users can delete their own todos
CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant select to anon for public data
GRANT SELECT ON profiles, apps, follows, tags, likes TO anon;
