-- Add 'gemini' to secrets provider check constraint
-- This allows users to store Google Gemini API keys

-- Drop the old check constraint
ALTER TABLE secrets DROP CONSTRAINT IF EXISTS secrets_provider_check;

-- Add the new check constraint with 'gemini' included
ALTER TABLE secrets ADD CONSTRAINT secrets_provider_check 
  CHECK (provider IN ('openai', 'anthropic', 'gemini', 'replicate', 'github', 'custom'));

-- Add comment for documentation
COMMENT ON CONSTRAINT secrets_provider_check ON secrets IS 'Validates that provider is one of the supported API providers including Google Gemini';


