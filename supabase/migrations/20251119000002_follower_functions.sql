-- Follower Count Management Functions
-- Helper functions to maintain denormalized follower/following counts

-- Increment follower count for a user
CREATE OR REPLACE FUNCTION increment_follower_count(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_followers = COALESCE(total_followers, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement follower count for a user
CREATE OR REPLACE FUNCTION decrement_follower_count(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_followers = GREATEST(COALESCE(total_followers, 0) - 1, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Increment following count for a user
CREATE OR REPLACE FUNCTION increment_following_count(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_following = COALESCE(total_following, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement following count for a user
CREATE OR REPLACE FUNCTION decrement_following_count(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_following = GREATEST(COALESCE(total_following, 0) - 1, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Refresh follower counts (for fixing any inconsistencies)
CREATE OR REPLACE FUNCTION refresh_follower_counts()
RETURNS VOID AS $$
BEGIN
  -- Update all follower counts
  UPDATE profiles p
  SET total_followers = (
    SELECT COUNT(*)
    FROM follows f
    WHERE f.following_id = p.id
  );
  
  -- Update all following counts
  UPDATE profiles p
  SET total_following = (
    SELECT COUNT(*)
    FROM follows f
    WHERE f.follower_id = p.id
  );
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION increment_follower_count IS 'Increment follower count when someone follows a user';
COMMENT ON FUNCTION decrement_follower_count IS 'Decrement follower count when someone unfollows a user';
COMMENT ON FUNCTION increment_following_count IS 'Increment following count when user follows someone';
COMMENT ON FUNCTION decrement_following_count IS 'Decrement following count when user unfollows someone';
COMMENT ON FUNCTION refresh_follower_counts IS 'Recalculate all follower/following counts from scratch';

