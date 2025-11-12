-- AppFeed MVP - Initial Schema Migration
-- Creates all tables with Clerk user IDs (TEXT instead of UUID)

-- =====================================================
-- 1. PROFILES TABLE (extends Clerk users)
-- =====================================================
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,  -- Clerk user ID (e.g., "user_2abc...")
  clerk_user_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Analytics (denormalized for performance)
  total_followers INTEGER DEFAULT 0,
  total_following INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Indexes for profiles
CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- =====================================================
-- 2. APPS TABLE
-- =====================================================
CREATE TABLE apps (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Preview media
  preview_type TEXT CHECK (preview_type IN ('image', 'video', 'gradient')),
  preview_url TEXT,
  preview_gradient TEXT,
  
  -- Manifest data (JSONB for flexibility)
  demo JSONB DEFAULT '{}',
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  runtime JSONB NOT NULL,
  
  -- Provenance
  fork_of TEXT REFERENCES apps(id) ON DELETE SET NULL,
  remix_prompt TEXT,
  github_url TEXT,
  
  -- Visibility
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Analytics (denormalized for performance)
  view_count INTEGER DEFAULT 0,
  try_count INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  remix_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for apps
CREATE INDEX idx_apps_creator_id ON apps(creator_id);
CREATE INDEX idx_apps_created_at ON apps(created_at DESC);
CREATE INDEX idx_apps_view_count ON apps(view_count DESC);
CREATE INDEX idx_apps_tags ON apps USING GIN(tags);
CREATE INDEX idx_apps_fork_of ON apps(fork_of) WHERE fork_of IS NOT NULL;
CREATE INDEX idx_apps_is_featured ON apps(is_featured, created_at DESC) WHERE is_featured = TRUE;
CREATE INDEX idx_apps_is_published ON apps(is_published, created_at DESC) WHERE is_published = TRUE;

-- Full-text search on apps (will be populated by trigger)
ALTER TABLE apps ADD COLUMN search_vector tsvector;
CREATE INDEX idx_apps_search ON apps USING GIN(search_vector);

-- =====================================================
-- 3. LIBRARY_SAVES TABLE
-- =====================================================
CREATE TABLE library_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: user can only save an app once
  UNIQUE(user_id, app_id)
);

-- Indexes for library_saves
CREATE INDEX idx_library_saves_user_id ON library_saves(user_id, created_at DESC);
CREATE INDEX idx_library_saves_app_id ON library_saves(app_id);

-- =====================================================
-- 4. FOLLOWS TABLE
-- =====================================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for follows
CREATE INDEX idx_follows_follower ON follows(follower_id, created_at DESC);
CREATE INDEX idx_follows_following ON follows(following_id, created_at DESC);

-- =====================================================
-- 5. RUNS TABLE
-- =====================================================
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Execution data
  mode TEXT NOT NULL CHECK (mode IN ('try', 'use')),
  status TEXT NOT NULL CHECK (status IN ('ok', 'error', 'timeout')),
  inputs JSONB DEFAULT '{}',
  outputs JSONB,
  trace JSONB DEFAULT '[]',
  duration_ms INTEGER,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for runs
CREATE INDEX idx_runs_app_id ON runs(app_id, created_at DESC);
CREATE INDEX idx_runs_user_id ON runs(user_id, created_at DESC);
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX idx_runs_mode ON runs(mode);

-- =====================================================
-- 6. LIKES TABLE
-- =====================================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, app_id)
);

-- Indexes for likes
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_app_id ON likes(app_id, created_at DESC);

-- =====================================================
-- 7. APP_ANALYTICS TABLE (granular event tracking)
-- =====================================================
CREATE TABLE app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Event tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'try', 'use', 'save', 'unsave', 'remix', 'share', 'like', 'unlike')),
  
  -- Context
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for app_analytics
CREATE INDEX idx_app_analytics_app_id ON app_analytics(app_id, created_at DESC);
CREATE INDEX idx_app_analytics_event_type ON app_analytics(event_type, created_at DESC);
CREATE INDEX idx_app_analytics_created_at ON app_analytics(created_at DESC);
CREATE INDEX idx_app_analytics_user_id ON app_analytics(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- 8. TAGS TABLE
-- =====================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  app_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tags
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_app_count ON tags(app_count DESC);
CREATE INDEX idx_tags_is_featured ON tags(is_featured) WHERE is_featured = TRUE;

-- =====================================================
-- 9. TODOS TABLE
-- =====================================================
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for todos
CREATE INDEX idx_todos_user_id ON todos(user_id, created_at DESC);
CREATE INDEX idx_todos_due_date ON todos(due_date) WHERE completed = FALSE;
CREATE INDEX idx_todos_completed ON todos(completed, user_id);

-- =====================================================
-- SEED DATA: Tags
-- =====================================================
INSERT INTO tags (name, description, is_featured) VALUES
  ('productivity', 'Apps for getting things done', TRUE),
  ('wellbeing', 'Mental health and wellness apps', TRUE),
  ('local', 'Location-based apps', FALSE),
  ('daily', 'Daily utilities and routines', TRUE),
  ('utility', 'General utility apps', FALSE),
  ('ai', 'AI-powered applications', TRUE),
  ('remix', 'Remixed versions of apps', FALSE),
  ('github', 'Apps sourced from GitHub', FALSE);
