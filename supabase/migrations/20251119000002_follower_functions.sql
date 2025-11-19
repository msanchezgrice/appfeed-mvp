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

