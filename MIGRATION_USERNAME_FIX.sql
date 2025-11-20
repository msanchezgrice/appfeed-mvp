-- Migration: Fix usernames to use actual Clerk usernames instead of truncated IDs
-- Run this in Supabase SQL Editor

-- This will update all profiles to use proper usernames from Clerk
-- Format: Extract username from clerk_user_id (user_XXXXX becomes XXXXX or use first 12 chars if needed)

-- Step 1: Check current usernames
SELECT 
  id,
  clerk_user_id,
  username,
  display_name
FROM profiles
WHERE username IS NULL OR username LIKE 'user_%'
LIMIT 10;

-- Step 2: Update usernames to be the clerk_user_id without 'user_' prefix
-- This makes them cleaner but still unique
UPDATE profiles
SET username = CASE 
  -- If username is null or starts with 'user_', use clerk_user_id without 'user_' prefix
  WHEN username IS NULL OR username LIKE 'user_%' THEN 
    SUBSTRING(clerk_user_id FROM 6)  -- Remove 'user_' prefix
  ELSE username
END
WHERE username IS NULL OR username LIKE 'user_%';

-- Step 3: For Miguel specifically, set a custom username
-- UPDATE profiles
-- SET username = 'migs'
-- WHERE clerk_user_id = 'user_35O1xMHRfgFwjT2ZryvSkyvPesi';

-- Step 4: Verify the changes
SELECT 
  clerk_user_id,
  username,
  display_name,
  LENGTH(username) as username_length
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- Note: After running this, usernames will be the unique clerk ID without 'user_' prefix
-- Users can then manually update their username in settings to something custom like 'migs'
