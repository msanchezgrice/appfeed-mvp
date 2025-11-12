-- Clean all apps and add only working ones with proper structure

-- 1. Delete ALL existing apps
DELETE FROM library_saves;  -- Clear saves first (foreign key)
DELETE FROM app_analytics;  -- Clear analytics
DELETE FROM apps;  -- Now clear apps

-- 2. Insert 5 REAL working apps with proper runtime.steps structure
INSERT INTO apps (
  id,
  creator_id,
  name,
  description,
  tags,
  preview_type,
  preview_gradient,
  inputs,
  outputs,
  demo,
  runtime,
  is_published,
  view_count,
  try_count,
  use_count,
  save_count,
  remix_count
) VALUES

-- App 1: Daily Affirmations
(
  'affirmations-daily',
  (SELECT id FROM profiles LIMIT 1),
  'Daily Affirmations',
  'Get 3 short affirmations tailored to your mood',
  ARRAY['wellbeing', 'daily', 'ai'],
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '{"mood": {"type": "string", "required": false, "placeholder": "calm / stressed / optimistic"}, "style": {"type": "string", "required": false, "enum": ["short", "poetic", "coach"], "default": "short"}}'::jsonb,
  '{"markdown": {"type": "string"}}'::jsonb,
  '{"mood": "optimistic", "style": "short"}'::jsonb,
  '{"engine": "node", "limits": {"timeoutMs": 5000, "tokens": 800}, "steps": [{"tool": "llm.complete", "args": {"system": "You are a warm, supportive coach. Keep things concise.", "prompt": "Write 3 first-person daily affirmations. Mood: {{mood||neutral}}. Style: {{style||short}}."}}]}'::jsonb,
  true, 245, 48, 32, 18, 3
),

-- App 2: Text Summarizer
(
  'text-summarizer',
  (SELECT id FROM profiles LIMIT 1),
  'Text Summarizer',
  'Condense long articles or documents into key points',
  ARRAY['productivity', 'writing', 'ai'],
  'gradient',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  '{"text": {"type": "string", "required": true, "placeholder": "Paste your text here...", "format": "textarea"}}'::jsonb,
  '{"summary": {"type": "string"}}'::jsonb,
  '{"text": "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet."}'::jsonb,
  '{"engine": "node", "limits": {"timeoutMs": 10000, "tokens": 1000}, "steps": [{"tool": "llm.complete", "args": {"system": "You are an expert at summarizing text. Create concise summaries.", "prompt": "Summarize this text in 2-3 sentences:\\n\\n{{text}}"}}]}'::jsonb,
  true, 412, 89, 67, 34, 7
),

-- App 3: Email Reply Writer
(
  'email-reply',
  (SELECT id FROM profiles LIMIT 1),
  'Email Reply Writer',
  'Generate professional email responses quickly',
  ARRAY['productivity', 'email', 'communication'],
  'gradient',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  '{"email": {"type": "string", "required": true, "placeholder": "Paste email", "format": "textarea"}, "points": {"type": "string", "required": true, "placeholder": "What to say?"}, "tone": {"type": "string", "enum": ["professional", "friendly", "formal"], "default": "professional"}}'::jsonb,
  '{"reply": {"type": "string"}}'::jsonb,
  '{"email": "Can we meet next week?", "points": "Yes, Tuesday 2pm works", "tone": "professional"}'::jsonb,
  '{"engine": "node", "limits": {"timeoutMs": 8000, "tokens": 600}, "steps": [{"tool": "llm.complete", "args": {"system": "Professional communication assistant. Write clear email replies.", "prompt": "Write a {{tone}} email reply to:\\n\\n{{email}}\\n\\nPoints: {{points}}"}}]}'::jsonb,
  true, 328, 71, 54, 28, 5
),

-- App 4: Code Explainer
(
  'code-explainer',
  (SELECT id FROM profiles LIMIT 1),
  'Code Explainer',
  'Understand any code snippet with clear explanations',
  ARRAY['coding', 'education', 'development'],
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '{"code": {"type": "string", "required": true, "format": "code"}, "language": {"type": "string", "enum": ["javascript", "python", "java"], "default": "javascript"}}'::jsonb,
  '{"explanation": {"type": "string"}}'::jsonb,
  '{"code": "function add(a, b) { return a + b; }", "language": "javascript"}'::jsonb,
  '{"engine": "node", "limits": {"timeoutMs": 8000, "tokens": 1000}, "steps": [{"tool": "llm.complete", "args": {"system": "Expert programmer. Explain code clearly.", "prompt": "Explain this {{language}} code:\\n\\n{{code}}"}}]}'::jsonb,
  true, 567, 112, 89, 45, 12
),

-- App 5: Social Post Writer
(
  'social-post-writer',
  (SELECT id FROM profiles LIMIT 1),
  'Social Post Writer',
  'Create engaging social media posts for any platform',
  ARRAY['social-media', 'marketing', 'content'],
  'gradient',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  '{"topic": {"type": "string", "required": true, "placeholder": "What is your post about?"}, "platform": {"type": "string", "enum": ["Instagram", "Twitter", "LinkedIn"], "default": "Instagram"}, "tone": {"type": "string", "enum": ["professional", "casual", "funny"], "default": "casual"}}'::jsonb,
  '{"post": {"type": "string"}}'::jsonb,
  '{"topic": "Launched my new app today", "platform": "Twitter", "tone": "casual"}'::jsonb,
  '{"engine": "node", "limits": {"timeoutMs": 6000, "tokens": 400}, "steps": [{"tool": "llm.complete", "args": {"system": "Social media expert. Create engaging posts with emojis and hashtags appropriate for the platform.", "prompt": "Create a {{tone}} {{platform}} post about: {{topic}}"}}]}'::jsonb,
  true, 389, 78, 56, 29, 8
);

-- Final verification
SELECT 
  id,
  name,
  jsonb_array_length(runtime->'steps') as steps,
  (runtime->'steps'->0->>'tool') as first_tool,
  is_published
FROM apps
ORDER BY created_at DESC;
