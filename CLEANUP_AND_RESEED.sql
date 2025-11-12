-- ============================================================================
-- CLEANUP AND RESEED WITH WORKING APPS
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================================================

-- Step 1: Clean up ALL existing data
DELETE FROM library_saves;
DELETE FROM app_analytics;
DELETE FROM likes;
DELETE FROM runs;
DELETE FROM apps;

-- Step 2: Insert 5 REAL working apps with proper runtime.steps[] structure
INSERT INTO apps (
  id, creator_id, name, description, tags, preview_type, preview_gradient,
  inputs, outputs, demo, runtime, is_published,
  view_count, try_count, use_count, save_count, remix_count
) VALUES

-- 1. Daily Affirmations
('affirmations-daily', (SELECT id FROM profiles LIMIT 1), 'Daily Affirmations', 'Get 3 short affirmations tailored to your mood', ARRAY['wellbeing', 'daily', 'ai'], 'gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'{"mood":{"type":"string","placeholder":"calm/stressed/optimistic"},"style":{"type":"string","enum":["short","poetic","coach"],"default":"short"}}'::jsonb,
'{"markdown":{"type":"string"}}'::jsonb,
'{"mood":"optimistic","style":"short"}'::jsonb,
'{"engine":"node","limits":{"timeoutMs":5000,"tokens":800},"steps":[{"tool":"llm.complete","args":{"system":"You are a warm, supportive coach. Keep things concise.","prompt":"Write 3 first-person daily affirmations. Mood: {{mood||neutral}}. Style: {{style||short}}."}}]}'::jsonb,
true, 245, 48, 32, 18, 3),

-- 2. Text Summarizer
('text-summarizer', (SELECT id FROM profiles LIMIT 1), 'Text Summarizer', 'Condense articles into key points', ARRAY['productivity', 'writing'], 'gradient', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
'{"text":{"type":"string","required":true,"placeholder":"Paste text...","format":"textarea"}}'::jsonb,
'{"summary":{"type":"string"}}'::jsonb,
'{"text":"The quick brown fox jumps over the lazy dog."}'::jsonb,
'{"engine":"node","limits":{"timeoutMs":10000,"tokens":1000},"steps":[{"tool":"llm.complete","args":{"system":"Expert summarizer. Create concise summaries.","prompt":"Summarize in 2-3 sentences:\\n\\n{{text}}"}}]}'::jsonb,
true, 412, 89, 67, 34, 7),

-- 3. Email Reply
('email-reply', (SELECT id FROM profiles LIMIT 1), 'Email Reply Writer', 'Professional email responses', ARRAY['productivity', 'email'], 'gradient', 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
'{"email":{"type":"string","required":true,"format":"textarea"},"points":{"type":"string","required":true},"tone":{"type":"string","enum":["professional","friendly"],"default":"professional"}}'::jsonb,
'{"reply":{"type":"string"}}'::jsonb,
'{"email":"Can we meet?","points":"Yes, Tuesday 2pm","tone":"professional"}'::jsonb,
'{"engine":"node","limits":{"timeoutMs":8000,"tokens":600},"steps":[{"tool":"llm.complete","args":{"system":"Professional assistant. Write clear emails.","prompt":"Write {{tone}} reply:\\n\\n{{email}}\\n\\nPoints: {{points}}"}}]}'::jsonb,
true, 328, 71, 54, 28, 5),

-- 4. Code Explainer  
('code-explainer', (SELECT id FROM profiles LIMIT 1), 'Code Explainer', 'Understand code snippets', ARRAY['coding', 'education'], 'gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'{"code":{"type":"string","required":true,"format":"code"},"language":{"type":"string","enum":["javascript","python","java"],"default":"javascript"}}'::jsonb,
'{"explanation":{"type":"string"}}'::jsonb,
'{"code":"function add(a,b){return a+b}","language":"javascript"}'::jsonb,
'{"engine":"node","limits":{"timeoutMs":8000,"tokens":1000},"steps":[{"tool":"llm.complete","args":{"system":"Expert programmer. Explain clearly.","prompt":"Explain this {{language}} code:\\n\\n{{code}}"}}]}'::jsonb,
true, 567, 112, 89, 45, 12),

-- 5. Social Post Writer
('social-post', (SELECT id FROM profiles LIMIT 1), 'Social Post Writer', 'Engaging social media posts', ARRAY['social-media', 'marketing'], 'gradient', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
'{"topic":{"type":"string","required":true},"platform":{"type":"string","enum":["Instagram","Twitter","LinkedIn"],"default":"Instagram"},"tone":{"type":"string","enum":["professional","casual","funny"],"default":"casual"}}'::jsonb,
'{"post":{"type":"string"}}'::jsonb,
'{"topic":"Launched new app","platform":"Twitter","tone":"casual"}'::jsonb,
'{"engine":"node","limits":{"timeoutMs":6000,"tokens":400},"steps":[{"tool":"llm.complete","args":{"system":"Social media expert. Create engaging posts with emojis.","prompt":"Create {{tone}} {{platform}} post: {{topic}}"}}]}'::jsonb,
true, 389, 78, 56, 29, 8);

-- Step 3: Verify everything worked
SELECT 
  id,
  name,
  jsonb_array_length(runtime->'steps') as step_count,
  (runtime->'steps'->0->>'tool') as first_tool,
  view_count,
  is_published
FROM apps
ORDER BY name;

-- Should see 5 apps, all with step_count = 1, first_tool = 'llm.complete'
