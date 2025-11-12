-- Real Working Apps with Functional Prompts
-- Run AFTER fixing RLS and AFTER your profile exists

-- First, clear old placeholder apps (optional)
-- DELETE FROM apps WHERE id IN ('app_weather_checker', 'app_code_explainer', 'app_email_writer');

-- Insert real, working apps
INSERT INTO apps (
  id,
  creator_id,
  name,
  description,
  tags,
  preview_type,
  preview_gradient,
  runtime,
  inputs,
  outputs,
  demo,
  is_published,
  view_count,
  try_count,
  use_count,
  save_count,
  remix_count
) VALUES

-- 1. Text Summarizer
(
  'app_text_summarizer',
  (SELECT id FROM profiles LIMIT 1),
  'Text Summarizer',
  'Condense long articles, documents, or text into concise summaries',
  ARRAY['productivity', 'writing', 'ai'],
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '{
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 500,
    "system_prompt": "You are an expert at summarizing text. Create concise, accurate summaries that capture the key points. Format your response as:\n\n**Main Points:**\n- [point 1]\n- [point 2]\n- [point 3]\n\n**Summary:** [2-3 sentence overview]",
    "user_prompt_template": "Summarize the following text:\n\n{{text}}"
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "title": "Text to Summarize",
        "description": "Paste your text here",
        "format": "textarea"
      }
    },
    "required": ["text"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "summary": {
        "type": "string",
        "title": "Summary"
      }
    }
  }'::jsonb,
  '{
    "text": "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet and is commonly used for testing fonts and keyboards."
  }'::jsonb,
  true,
  342, 67, 45, 23, 5
),

-- 2. Code Debugger
(
  'app_code_debugger',
  (SELECT id FROM profiles LIMIT 1),
  'Code Debugger',
  'Find and explain bugs in your code with AI-powered analysis',
  ARRAY['coding', 'development', 'debugging'],
  'gradient',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  '{
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "max_tokens": 1000,
    "system_prompt": "You are an expert programmer and debugger. Analyze code for bugs, errors, and potential issues. Provide:\n1. **Issue Found:** Clear description of the problem\n2. **Why It Happens:** Technical explanation\n3. **Fix:** Corrected code\n4. **Prevention:** Best practices to avoid this",
    "user_prompt_template": "Debug this {{language}} code:\n\n```{{language}}\n{{code}}\n```\n\nError message: {{error}}"
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "title": "Code",
        "description": "Paste your code here",
        "format": "code"
      },
      "language": {
        "type": "string",
        "title": "Language",
        "enum": ["javascript", "python", "java", "cpp", "go", "rust"],
        "default": "javascript"
      },
      "error": {
        "type": "string",
        "title": "Error Message (optional)",
        "description": "What error are you getting?"
      }
    },
    "required": ["code", "language"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "analysis": {
        "type": "string",
        "title": "Debug Analysis"
      }
    }
  }'::jsonb,
  '{
    "code": "function add(a, b) {\n  return a + b\n}\nconsole.log(add(1, 2))",
    "language": "javascript",
    "error": ""
  }'::jsonb,
  true,
  489, 92, 61, 34, 8
),

-- 3. Meeting Notes Generator
(
  'app_meeting_notes',
  (SELECT id FROM profiles LIMIT 1),
  'Meeting Notes Generator',
  'Turn meeting transcripts into organized action items and summaries',
  ARRAY['productivity', 'business', 'meetings'],
  'gradient',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  '{
    "model": "gpt-4o-mini",
    "temperature": 0.5,
    "max_tokens": 800,
    "system_prompt": "You are a professional meeting assistant. Convert meeting transcripts into structured notes with:\n\n**Summary:** Brief overview\n**Key Decisions:** Important conclusions\n**Action Items:** Clear tasks with owners\n**Next Steps:** What happens next\n\nFormat everything with bullet points and bold headers.",
    "user_prompt_template": "Generate professional meeting notes from this transcript:\n\n{{transcript}}"
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "transcript": {
        "type": "string",
        "title": "Meeting Transcript",
        "description": "Paste transcript or notes",
        "format": "textarea"
      }
    },
    "required": ["transcript"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "notes": {
        "type": "string",
        "title": "Meeting Notes"
      }
    }
  }'::jsonb,
  '{
    "transcript": "John: We need to launch the new feature by next week. Sarah: I can finish the frontend by Friday. John: Great, I will handle the backend. We should meet again on Thursday to review."
  }'::jsonb,
  true,
  256, 48, 32, 18, 3
),

-- 4. Social Media Caption Writer
(
  'app_caption_writer',
  (SELECT id FROM profiles LIMIT 1),
  'Social Media Caption Writer',
  'Generate engaging captions for Instagram, Twitter, LinkedIn posts',
  ARRAY['social-media', 'marketing', 'content'],
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '{
    "model": "gpt-4o-mini",
    "temperature": 0.9,
    "max_tokens": 300,
    "system_prompt": "You are a social media expert. Create engaging, platform-appropriate captions that drive engagement. Include relevant emojis and hashtags. Match the tone to the platform.",
    "user_prompt_template": "Create a {{platform}} caption for: {{topic}}\n\nTone: {{tone}}\nLength: {{length}}"
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "title": "What is your post about?",
        "description": "Describe your content"
      },
      "platform": {
        "type": "string",
        "title": "Platform",
        "enum": ["Instagram", "Twitter", "LinkedIn", "Facebook"],
        "default": "Instagram"
      },
      "tone": {
        "type": "string",
        "title": "Tone",
        "enum": ["professional", "casual", "funny", "inspirational"],
        "default": "casual"
      },
      "length": {
        "type": "string",
        "title": "Length",
        "enum": ["short", "medium", "long"],
        "default": "medium"
      }
    },
    "required": ["topic", "platform"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "caption": {
        "type": "string",
        "title": "Caption"
      }
    }
  }'::jsonb,
  '{
    "topic": "My coffee shop launched a new latte",
    "platform": "Instagram",
    "tone": "casual",
    "length": "medium"
  }'::jsonb,
  true,
  412, 78, 56, 29, 6
),

-- 5. Email Reply Assistant
(
  'app_email_reply',
  (SELECT id FROM profiles LIMIT 1),
  'Email Reply Assistant',
  'Generate professional email responses to save time',
  ARRAY['productivity', 'email', 'communication'],
  'gradient',
  'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
  '{
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 400,
    "system_prompt": "You are a professional communication assistant. Write clear, concise, and polite email replies that:\n- Address all points from the original email\n- Match the appropriate tone\n- Are actionable and clear\n- Include a proper greeting and sign-off",
    "user_prompt_template": "Write a {{tone}} email reply to this:\n\n{{email}}\n\nKey points to address: {{points}}"
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "title": "Original Email",
        "description": "Paste the email you received",
        "format": "textarea"
      },
      "points": {
        "type": "string",
        "title": "Points to Address",
        "description": "What do you want to say in your reply?"
      },
      "tone": {
        "type": "string",
        "title": "Tone",
        "enum": ["professional", "friendly", "formal", "casual"],
        "default": "professional"
      }
    },
    "required": ["email", "points"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "reply": {
        "type": "string",
        "title": "Email Reply"
      }
    }
  }'::jsonb,
  '{
    "email": "Hi, can we schedule a call next week to discuss the project?",
    "points": "Yes, Tuesday at 2pm works for me",
    "tone": "professional"
  }'::jsonb,
  true,
  378, 71, 49, 26, 4
);

-- Verify inserts
SELECT 
  id,
  name,
  description,
  tags,
  view_count,
  is_published
FROM apps
WHERE id LIKE 'app_%'
ORDER BY created_at DESC;

-- Check total apps
SELECT COUNT(*) as total_apps FROM apps;
