-- AppFeed MVP - Triggers and Helper Functions
-- Auto-updates timestamps, denormalized counts, and maintains data integrity

-- =====================================================
-- 1. AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Generic function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search_vector for apps
CREATE OR REPLACE FUNCTION update_app_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' || 
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secrets_updated_at
  BEFORE UPDATE ON secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply search vector update to apps
CREATE TRIGGER update_apps_search_vector
  BEFORE INSERT OR UPDATE OF name, description, tags ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_app_search_vector();

-- =====================================================
-- 2. AUTO-UPDATE DENORMALIZED COUNTS
-- =====================================================

-- Update app save_count when library_saves changes
CREATE OR REPLACE FUNCTION update_app_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE apps SET save_count = save_count + 1 WHERE id = NEW.app_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE apps SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.app_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER library_saves_count_trigger
  AFTER INSERT OR DELETE ON library_saves
  FOR EACH ROW EXECUTE FUNCTION update_app_save_count();

-- Update app remix_count when a forked app is created
CREATE OR REPLACE FUNCTION update_app_remix_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fork_of IS NOT NULL THEN
    UPDATE apps SET remix_count = remix_count + 1 WHERE id = NEW.fork_of;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apps_remix_count_trigger
  AFTER INSERT ON apps
  FOR EACH ROW EXECUTE FUNCTION update_app_remix_count();

-- Update profile follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the person being followed
    UPDATE profiles SET total_followers = total_followers + 1 WHERE id = NEW.following_id;
    -- Increment following count for the follower
    UPDATE profiles SET total_following = total_following + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count
    UPDATE profiles SET total_followers = GREATEST(0, total_followers - 1) WHERE id = OLD.following_id;
    -- Decrement following count
    UPDATE profiles SET total_following = GREATEST(0, total_following - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follows_count_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Update tag app_count when apps are created/deleted
CREATE OR REPLACE FUNCTION update_tag_counts()
RETURNS TRIGGER AS $$
DECLARE
  tag_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Increment counts for new tags
    FOREACH tag_name IN ARRAY NEW.tags
    LOOP
      INSERT INTO tags (name, app_count) 
      VALUES (tag_name, 1)
      ON CONFLICT (name) 
      DO UPDATE SET app_count = tags.app_count + 1;
    END LOOP;
    
    -- Decrement counts for removed tags (on UPDATE)
    IF TG_OP = 'UPDATE' THEN
      FOREACH tag_name IN ARRAY OLD.tags
      LOOP
        IF NOT (tag_name = ANY(NEW.tags)) THEN
          UPDATE tags SET app_count = GREATEST(0, app_count - 1) WHERE name = tag_name;
        END IF;
      END LOOP;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts for all tags
    FOREACH tag_name IN ARRAY OLD.tags
    LOOP
      UPDATE tags SET app_count = GREATEST(0, app_count - 1) WHERE name = tag_name;
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apps_tag_counts_trigger
  AFTER INSERT OR UPDATE OF tags OR DELETE ON apps
  FOR EACH ROW EXECUTE FUNCTION update_tag_counts();

-- =====================================================
-- 3. AUTO-MARK TODO AS COMPLETED
-- =====================================================

CREATE OR REPLACE FUNCTION auto_mark_todo_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  ELSIF NEW.completed = FALSE AND OLD.completed = TRUE THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_completed_trigger
  BEFORE UPDATE OF completed ON todos
  FOR EACH ROW EXECUTE FUNCTION auto_mark_todo_completed();

-- =====================================================
-- 4. ANALYTICS HELPER FUNCTIONS
-- =====================================================

-- Function to track analytics events
CREATE OR REPLACE FUNCTION track_app_event(
  p_app_id TEXT,
  p_user_id TEXT,
  p_event_type TEXT,
  p_session_id TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Insert analytics event
  INSERT INTO app_analytics (
    app_id, user_id, event_type, session_id, 
    user_agent, referrer, metadata
  )
  VALUES (
    p_app_id, p_user_id, p_event_type, p_session_id,
    p_user_agent, p_referrer, p_metadata
  )
  RETURNING id INTO v_event_id;
  
  -- Update denormalized counts on apps table
  CASE p_event_type
    WHEN 'view' THEN
      UPDATE apps SET view_count = view_count + 1 WHERE id = p_app_id;
    WHEN 'try' THEN
      UPDATE apps SET try_count = try_count + 1 WHERE id = p_app_id;
    WHEN 'use' THEN
      UPDATE apps SET use_count = use_count + 1 WHERE id = p_app_id;
    ELSE
      -- Other events don't update app counts
  END CASE;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_app_event TO authenticated, anon;

-- Function to get app analytics summary
CREATE OR REPLACE FUNCTION get_app_analytics(
  p_app_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  event_type TEXT,
  count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.event_type,
    COUNT(*) as count,
    COUNT(DISTINCT aa.user_id) as unique_users
  FROM app_analytics aa
  WHERE aa.app_id = p_app_id
    AND aa.created_at >= NOW() - (p_days || ' days')::interval
  GROUP BY aa.event_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_app_analytics TO authenticated;

-- Function to get user's app performance
CREATE OR REPLACE FUNCTION get_user_app_performance(
  p_user_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  app_id TEXT,
  app_name TEXT,
  total_views BIGINT,
  total_tries BIGINT,
  total_uses BIGINT,
  total_saves BIGINT,
  total_remixes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as app_id,
    a.name as app_name,
    COALESCE(SUM(CASE WHEN aa.event_type = 'view' THEN 1 ELSE 0 END), 0) as total_views,
    COALESCE(SUM(CASE WHEN aa.event_type = 'try' THEN 1 ELSE 0 END), 0) as total_tries,
    COALESCE(SUM(CASE WHEN aa.event_type = 'use' THEN 1 ELSE 0 END), 0) as total_uses,
    COALESCE(SUM(CASE WHEN aa.event_type = 'save' THEN 1 ELSE 0 END), 0) as total_saves,
    a.remix_count as total_remixes
  FROM apps a
  LEFT JOIN app_analytics aa ON aa.app_id = a.id 
    AND aa.created_at >= NOW() - (p_days || ' days')::interval
  WHERE a.creator_id = p_user_id
  GROUP BY a.id, a.name, a.remix_count
  ORDER BY total_views DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_app_performance TO authenticated;

-- =====================================================
-- 5. SEARCH HELPER FUNCTIONS
-- =====================================================

-- Full-text search for apps
CREATE OR REPLACE FUNCTION search_apps(
  p_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  description TEXT,
  creator_id TEXT,
  tags TEXT[],
  view_count INTEGER,
  save_count INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.creator_id,
    a.tags,
    a.view_count,
    a.save_count,
    ts_rank(a.search_vector, websearch_to_tsquery('english', p_query)) as rank
  FROM apps a
  WHERE a.is_published = TRUE
    AND a.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, a.view_count DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION search_apps TO authenticated, anon;

-- =====================================================
-- 6. FEED GENERATION HELPER
-- =====================================================

-- Get personalized feed for user
CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  description TEXT,
  creator_id TEXT,
  tags TEXT[],
  preview_type TEXT,
  preview_url TEXT,
  view_count INTEGER,
  save_count INTEGER,
  created_at TIMESTAMPTZ,
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.creator_id,
    a.tags,
    a.preview_type,
    a.preview_url,
    a.view_count,
    a.save_count,
    a.created_at,
    -- Simple scoring algorithm: recency + popularity + following boost
    (
      -- Recency score (0-100)
      100 * EXP(-EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 604800) + -- 7 days decay
      -- Popularity score (0-100)
      LEAST(100, LOG(1 + a.view_count) * 10) +
      LEAST(100, LOG(1 + a.save_count) * 20) +
      -- Following boost (50 points if following creator)
      CASE WHEN EXISTS(
        SELECT 1 FROM follows f 
        WHERE f.follower_id = p_user_id 
        AND f.following_id = a.creator_id
      ) THEN 50 ELSE 0 END
    )::NUMERIC as score
  FROM apps a
  WHERE a.is_published = TRUE
  ORDER BY score DESC, a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_personalized_feed TO authenticated, anon;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION track_app_event IS 'Track an app event and update denormalized counts';
COMMENT ON FUNCTION get_app_analytics IS 'Get analytics summary for an app';
COMMENT ON FUNCTION get_user_app_performance IS 'Get performance metrics for all of a user''s apps';
COMMENT ON FUNCTION search_apps IS 'Full-text search across apps';
COMMENT ON FUNCTION get_personalized_feed IS 'Get personalized app feed based on recency, popularity, and following';
