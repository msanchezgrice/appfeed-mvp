-- Seed data: 3 sample apps for testing
-- Run this in Supabase SQL Editor after signing up

-- Insert 3 sample apps (uses your first profile as creator)
INSERT INTO apps (
  id,
  creator_id,
  name,
  description,
  tags,
  preview_type,
  preview_gradient,
  runtime,
  is_published,
  view_count,
  try_count,
  use_count,
  save_count,
  remix_count
) VALUES 
(
  'app_weather_checker',
  (SELECT id FROM profiles LIMIT 1), -- Uses first profile in database
  'Weather Checker',
  'Get current weather for any city using real-time data',
  ARRAY['weather', 'api', 'data'],
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '{"model": "gpt-4o-mini", "prompt": "You are a helpful weather assistant. Get current conditions for the requested city and provide a friendly summary.", "tools": [{"name": "get_weather", "description": "Get current weather", "parameters": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}}]}'::jsonb,
  true,
  142,
  28,
  12,
  5,
  2
),
(
  'app_code_explainer',
  (SELECT id FROM profiles LIMIT 1),
  'Code Explainer',
  'Explains any code snippet in simple terms with examples',
  ARRAY['coding', 'education', 'programming'],
  'gradient',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  '{"model": "gpt-4o-mini", "prompt": "You are an expert programmer. Analyze code and explain: 1) Purpose, 2) How it works, 3) Key concepts.", "tools": []}'::jsonb,
  true,
  256,
  45,
  23,
  8,
  3
),
(
  'app_email_writer',
  (SELECT id FROM profiles LIMIT 1),
  'Professional Email Writer',
  'Writes professional emails based on your intent and context',
  ARRAY['writing', 'productivity', 'communication'],
  'gradient',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  '{"model": "gpt-4o-mini", "prompt": "You are a professional communication expert. Write clear, professional emails matching the context and tone.", "tools": []}'::jsonb,
  true,
  189,
  34,
  19,
  6,
  1
);

-- Verify the inserts
SELECT 
  id,
  name,
  description,
  view_count,
  save_count,
  tags,
  creator_id,
  is_published
FROM apps
ORDER BY created_at DESC
LIMIT 3;

-- Check your profile was found
SELECT 
  id, 
  username, 
  display_name,
  email
FROM profiles
LIMIT 1;
