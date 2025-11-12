-- AppFeed MVP - Supabase Vault Setup
-- Enables pgsodium extension and creates encrypted secrets table

-- =====================================================
-- 1. ENABLE PGSODIUM EXTENSION (Vault)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- =====================================================
-- 2. CREATE ENCRYPTION KEY
-- =====================================================
-- Create a named key for API key encryption
-- This key is stored in the vault and never exposed
SELECT pgsodium.create_key(name := 'api_keys');

-- =====================================================
-- 3. SECRETS TABLE WITH VAULT ENCRYPTION
-- =====================================================
CREATE TABLE secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'replicate', 'github', 'custom')),
  
  -- Encrypted API key (stored as base64-encoded ciphertext)
  api_key_encrypted TEXT NOT NULL,
  
  -- Metadata
  key_name TEXT, -- User-friendly name (e.g., "My OpenAI Key")
  is_valid BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider)
);

-- Indexes for secrets
CREATE INDEX idx_secrets_user_id ON secrets(user_id);
CREATE INDEX idx_secrets_provider ON secrets(user_id, provider);

-- =====================================================
-- 4. VAULT HELPER FUNCTIONS
-- =====================================================

-- Function to insert/update encrypted secret
-- This function encrypts the API key before storing
CREATE OR REPLACE FUNCTION upsert_secret(
  p_user_id TEXT,
  p_provider TEXT,
  p_api_key TEXT,
  p_key_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_secret_id UUID;
  v_encrypted TEXT;
  v_key_id UUID;
BEGIN
  -- Get the encryption key ID
  SELECT id INTO v_key_id FROM pgsodium.valid_key WHERE name = 'api_keys';
  
  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Encryption key "api_keys" not found';
  END IF;
  
  -- Encrypt the API key
  v_encrypted := encode(
    pgsodium.crypto_secretbox(
      p_api_key::bytea,
      (SELECT decrypted_secret FROM pgsodium.decrypted_key WHERE id = v_key_id),
      (SELECT nonce FROM pgsodium.decrypted_key WHERE id = v_key_id)
    ),
    'base64'
  );
  
  -- Insert or update
  INSERT INTO secrets (user_id, provider, api_key_encrypted, key_name)
  VALUES (p_user_id, p_provider, v_encrypted, p_key_name)
  ON CONFLICT (user_id, provider) 
  DO UPDATE SET
    api_key_encrypted = v_encrypted,
    key_name = COALESCE(p_key_name, secrets.key_name),
    updated_at = NOW(),
    is_valid = TRUE
  RETURNING id INTO v_secret_id;
  
  RETURN v_secret_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get decrypted secret (only for server-side use)
-- This should ONLY be called from server-side API routes
CREATE OR REPLACE FUNCTION get_decrypted_secret(
  p_user_id TEXT,
  p_provider TEXT
)
RETURNS TABLE(
  provider TEXT,
  api_key TEXT,
  key_name TEXT,
  last_used_at TIMESTAMPTZ
) AS $$
DECLARE
  v_key_id UUID;
BEGIN
  -- Get the encryption key ID
  SELECT id INTO v_key_id FROM pgsodium.valid_key WHERE name = 'api_keys';
  
  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Encryption key "api_keys" not found';
  END IF;
  
  -- Update last_used_at
  UPDATE secrets 
  SET last_used_at = NOW() 
  WHERE user_id = p_user_id AND provider = p_provider;
  
  -- Return decrypted secret
  RETURN QUERY
  SELECT 
    s.provider,
    convert_from(
      pgsodium.crypto_secretbox_open(
        decode(s.api_key_encrypted, 'base64'),
        (SELECT decrypted_secret FROM pgsodium.decrypted_key WHERE id = v_key_id),
        (SELECT nonce FROM pgsodium.decrypted_key WHERE id = v_key_id)
      ),
      'UTF8'
    ) as api_key,
    s.key_name,
    s.last_used_at
  FROM secrets s
  WHERE s.user_id = p_user_id AND s.provider = p_provider
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate if a secret exists (without decrypting)
CREATE OR REPLACE FUNCTION has_secret(
  p_user_id TEXT,
  p_provider TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM secrets 
    WHERE user_id = p_user_id 
    AND provider = p_provider 
    AND is_valid = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a secret
CREATE OR REPLACE FUNCTION delete_secret(
  p_user_id TEXT,
  p_provider TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN;
BEGIN
  DELETE FROM secrets 
  WHERE user_id = p_user_id AND provider = p_provider
  RETURNING TRUE INTO v_deleted;
  
  RETURN COALESCE(v_deleted, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on these functions
GRANT EXECUTE ON FUNCTION upsert_secret TO authenticated;
GRANT EXECUTE ON FUNCTION get_decrypted_secret TO authenticated;
GRANT EXECUTE ON FUNCTION has_secret TO authenticated;
GRANT EXECUTE ON FUNCTION delete_secret TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE secrets IS 'Stores encrypted API keys using Supabase Vault (pgsodium)';
COMMENT ON COLUMN secrets.api_key_encrypted IS 'Base64-encoded encrypted API key - never exposed to client';
COMMENT ON FUNCTION upsert_secret IS 'Safely insert or update an encrypted API key';
COMMENT ON FUNCTION get_decrypted_secret IS 'Decrypt and return API key - SERVER SIDE ONLY';
COMMENT ON FUNCTION has_secret IS 'Check if user has a valid secret for provider without decrypting';
COMMENT ON FUNCTION delete_secret IS 'Securely delete a secret';
