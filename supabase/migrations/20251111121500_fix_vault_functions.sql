-- Fix vault functions to use correct pgsodium schema
-- The issue is that pgsodium.decrypted_key doesn't exist, we need to use pgsodium.valid_key

-- Drop old functions
DROP FUNCTION IF EXISTS upsert_secret(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_decrypted_secret(TEXT, TEXT);

-- Recreate upsert_secret with correct pgsodium references
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
  v_key_raw BYTEA;
  v_nonce BYTEA;
BEGIN
  -- Get the encryption key ID
  SELECT id INTO v_key_id FROM pgsodium.valid_key WHERE name = 'api_keys';
  
  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Encryption key "api_keys" not found';
  END IF;
  
  -- Get the raw key and generate a nonce
  SELECT raw_key INTO v_key_raw FROM pgsodium.valid_key WHERE id = v_key_id;
  v_nonce := gen_random_bytes(24); -- 24 bytes for crypto_secretbox
  
  -- Encrypt the API key
  v_encrypted := encode(
    pgsodium.crypto_secretbox(
      p_api_key::bytea,
      v_nonce,
      v_key_raw
    ),
    'base64'
  ) || '::' || encode(v_nonce, 'base64'); -- Store nonce with ciphertext
  
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

-- Recreate get_decrypted_secret with correct pgsodium references
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
  v_key_raw BYTEA;
  v_encrypted TEXT;
  v_ciphertext BYTEA;
  v_nonce BYTEA;
  v_parts TEXT[];
BEGIN
  -- Get the encryption key ID
  SELECT id INTO v_key_id FROM pgsodium.valid_key WHERE name = 'api_keys';
  
  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Encryption key "api_keys" not found';
  END IF;
  
  -- Get the raw key
  SELECT raw_key INTO v_key_raw FROM pgsodium.valid_key WHERE id = v_key_id;
  
  -- Get the encrypted value
  SELECT api_key_encrypted INTO v_encrypted FROM secrets 
  WHERE user_id = p_user_id AND provider = p_provider;
  
  IF v_encrypted IS NULL THEN
    RETURN; -- No secret found
  END IF;
  
  -- Split ciphertext and nonce
  v_parts := string_to_array(v_encrypted, '::');
  v_ciphertext := decode(v_parts[1], 'base64');
  v_nonce := decode(v_parts[2], 'base64');
  
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
        v_ciphertext,
        v_nonce,
        v_key_raw
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_secret TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_decrypted_secret TO authenticated, service_role;

-- Verify functions work
SELECT 'Vault functions fixed!' AS status;
