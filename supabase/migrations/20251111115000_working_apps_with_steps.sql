-- Delete placeholder apps and add REAL working apps with proper runtime.steps structure
-- This matches the original AppFeed format

-- Remove old placeholder apps
DELETE FROM apps WHERE id IN (
  'app_weather_checker', 
  'app_code_explainer', 
  'app_email_writer',
  'app_text_summarizer',
  'app_code_debugger',
  'app_meeting_notes',
  'app_caption_writer',
  'app_email_reply'
);

-- Insert real working apps with proper runtime.steps format
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

-- 1. Daily Affirmations
(
  'affirmations-daily',
  (SELECT id FROM profiles LIMIT 1),
  'Daily Affirmations',
  'Get 3 short affirmations tailored to your mood',
  ARRAY['wellbeing', 'daily', 'ai'],
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '{
    "mood": {"type": "string", "required": false, "placeholder": "calm / stressed / optimistic"},
    "style": {"type": "string", "required": false, "enum": ["short", "poetic", "coach"], "default": "short"}
  }'::jsonb,
  '{
    "markdown": {"type": "string"}
  }'::jsonb,
  '{
    "mood": "optimistic",
    "style": "short"
  }'::jsonb,
  '{
    "engine": "node",
    "limits": {"timeoutMs": 5000, "tokens": 800},
    "steps": [
      {
        "tool": "llm.complete",
        "args": {
          "system": "You are a warm, supportive coach. Keep things concise.",
          "prompt": "Write 3 first-person daily affirmations. Mood: {{mood||neutral}}. Style: {{style||short}}."
        }
      }
    ]
  }'::jsonb,
  true,
  245, 48, 32, 18, 3
),

-- 2. Text Summarizer
(
  'text-summarizer',
  (SELECT id FROM profiles LIMIT 1),
  'Text Summarizer',
  'Condense long articles or documents into key points',
  ARRAY['productivity', 'writing', 'ai'],
  'gradient',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  '{
    "text": {"type": "string", "required": true, "placeholder": "Paste your text here...", "format": "textarea"}
  }'::jsonb,
  '{
    "summary": {"type": "string"}
  }'::jsonb,
  '{
    "text": "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet and is commonly used for testing fonts and keyboards in typography and computer programming."
  }'::jsonb,
  '{
    "engine": "node",
    "limits": {"timeoutMs": 10000, "tokens": 1000},
    "steps": [
      {
        "tool": "llm.complete",
        "args": {
          "system": "You are an expert at summarizing text. Create concise summaries that capture key points.",
          "prompt": "Summarize this text in 2-3 sentences:\\n\\n{{text}}"
        }
      }
    ]
  }'::jsonb,
  true,
  412, 89, 67, 34, 7
),

-- 3. Email Reply Writer
(
  'email-reply-writer',
  (SELECT id FROM profiles LIMIT 1),
  'Email Reply Writer',
  'Generate professional email responses quickly',
  ARRAY['productivity', 'email', 'communication'],
  'gradient',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  '{
    "email": {"type": "string", "required": true, "placeholder": "Paste email you received", "format": "textarea"},
    "points": {"type": "string", "required": true, "placeholder": "What do you want to say?"},
    "tone": {"type": "string", "required": false, "enum": ["professional", "friendly", "formal"], "default": "professional"}
  }'::jsonb,
  '{
    "reply": {"type": "string"}
  }'::jsonb,
  '{
    "email": "Hi, can we schedule a call next week to discuss the project?",
    "points": "Yes, Tuesday at 2pm works",
    "tone": "professional"
  }'::jsonb,
  '{
    "engine": "node",
    "limits": {"timeoutMs": 8000, "tokens": 600},
    "steps": [
      {
        "tool": "llm.complete",
        "args": {
          "system": "You are a professional communication assistant. Write clear, concise email replies with proper greeting and sign-off.",
          "prompt": "Write a {{tone}} email reply to:\\n\\n{{email}}\\n\\nKey points to address: {{points}}"
        }
      }
    ]
  }'::jsonb,
  true,
  328, 71, 54, 28, 5
),

-- 4. Code Explainer  
(
  'code-explainer',
  (SELECT id FROM profiles LIMIT 1),
  'Code Explainer',
  'Understand any code snippet with clear explanations',
  ARRAY['coding', 'education', 'development'],
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '{
    "code": {"type": "string", "required": true, "placeholder": "Paste code here", "format": "code"},
    "language": {"type": "string", "required": false, "enum": ["javascript", "python", "java", "cpp", "rust"], "default": "javascript"}
  }'::jsonb,
  '{
    "explanation": {"type": "string"}
  }'::jsonb,
  '{
    "code": "function fibonacci(n) {\\n  if (n <= 1) return n;\\n  return fibonacci(n-1) + fibonacci(n-2);\\n}",
    "language": "javascript"
  }'::jsonb,
  '{
    "engine": "node",
    "limits": {"timeoutMs": 8000, "tokens": 1000},
    "steps": [
      {
        "tool": "llm.complete",
        "args": {
          "system": "You are an expert programmer. Explain code clearly with: 1) What it does, 2) How it works, 3) Key concepts.",
          "prompt": "Explain this {{language}} code:\\n\\n```\\n{{code}}\\n```"
        }
      }
    ]
  }'::jsonb,
  true,
  567, 112, 89, 45, 12
),

-- 5. Meeting Notes Generator
(
  'meeting-notes',
  (SELECT id FROM profiles LIMIT 1),
  'Meeting Notes Generator',
  'Turn messy meeting transcripts into organized action items',
  ARRAY['productivity', 'business', 'meetings'],
  'gradient',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  '{
    "transcript": {"type": "string", "required": true, "placeholder": "Paste meeting transcript or notes", "format": "textarea"}
  }'::jsonb,
  '{
    "notes": {"type": "string"}
  }'::jsonb,
  '{
    "transcript": "John: We need to launch by Friday. Sarah: I can finish frontend by Thursday. John: Great, I will handle backend. Let us meet Thursday at 2pm to review progress."
  }'::jsonb,
  '{
    "engine": "node",
    "limits": {"timeoutMs": 10000, "tokens": 1200},
    "steps": [
      {
        "tool": "llm.complete",
        "args": {
          "system": "You are a professional meeting assistant. Create structured notes with: Summary, Key Decisions, Action Items, Next Steps. Use bullet points and bold headers.",
          "prompt": "Generate professional meeting notes from:\\n\\n{{transcript}}"
        }
      }
    ]
  }'::jsonb,
  true,
  298, 63, 47, 24, 6
);

-- Verify inserts
SELECT 
  id,
  name,
  description,
  tags,
  jsonb_array_length(runtime->'steps') as step_count,
  is_published
FROM apps
WHERE id IN ('affirmations-daily', 'text-summarizer', 'email-reply-writer', 'code-explainer', 'meeting-notes')
ORDER BY created_at DESC;

-- Check total apps
SELECT COUNT(*) as total_apps FROM apps WHERE is_published = true;
