-- Quick check of Supabase profiles table
-- Run this in Supabase SQL Editor

-- 1. Check if profiles table exists and has data
SELECT 
  COUNT(*) as total_profiles,
  MAX(created_at) as last_profile_created
FROM profiles;

-- 2. List all existing profiles
SELECT 
  id,
  username,
  email,
  display_name,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 3. Check for "test2" specifically
SELECT 
  id,
  username,
  email,
  display_name,
  avatar_url,
  created_at
FROM profiles
WHERE username LIKE '%test2%' 
   OR email LIKE '%test2%'
   OR display_name LIKE '%test2%';

-- 4. Check if apps table is ready
SELECT COUNT(*) as total_apps FROM apps;

-- If you see 0 profiles, the user wasn't synced yet!
-- Run the profile sync in browser console first.
