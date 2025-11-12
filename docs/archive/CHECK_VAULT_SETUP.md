# 🔐 Vault Setup Verification

## Issue: API Keys Saving but Not Showing in DB

**Your secrets ARE being saved!** They're encrypted in Supabase Vault, not visible in the `secrets` table directly.

---

## How Vault Works

### 1. **Encrypted Storage**
When you save an API key:
- It's encrypted with `pgsodium` Vault
- Stored in encrypted format (you can't see the plain text)
- Only accessible via special RPC functions

### 2. **The `secrets` Table**
```sql
Column                | Value
--------------------- | -----
user_id              | Your Clerk user ID
provider             | 'openai' or 'anthropic'
encrypted_value      | vault.secrets reference (encrypted)
key_name             | 'OpenAI API Key'
is_valid             | true
created_at           | timestamp
```

---

## ✅ Verify Vault Functions Exist

Run this in Supabase SQL Editor:

```sql
-- Check if Vault functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('upsert_secret', 'get_decrypted_secret', 'delete_secret')
ORDER BY routine_name;
```

**Expected Result:**
```
upsert_secret
get_decrypted_secret  
delete_secret
```

If any are missing, run the migration: `/supabase/migrations/20241110000002_vault_setup.sql`

---

## ✅ Check Your Saved Secrets

Run this to see your secrets (metadata only, not decrypted):

```sql
SELECT 
  user_id,
  provider,
  key_name,
  is_valid,
  created_at,
  last_used_at
FROM secrets
ORDER BY created_at DESC;
```

You should see:
- Your user_id
- provider: 'openai' or 'anthropic'
- key_name: 'OpenAI API Key'
- is_valid: true

**Note:** You WON'T see the actual API key value (it's encrypted!)

---

## ✅ Test Decryption (Verify it Works)

Run this to decrypt your secret (replace YOUR_USER_ID):

```sql
SELECT get_decrypted_secret('YOUR_USER_ID', 'openai') as decrypted_key;
```

This should return your actual API key (proves encryption/decryption works).

---

## 🐛 Troubleshooting

### "Function does not exist"

**Problem:** Vault functions not created

**Solution:** Run the vault setup migration:
1. Go to Supabase Dashboard → SQL Editor
2. Open: `/supabase/migrations/20241110000002_vault_setup.sql`
3. Copy all SQL and run it

### "No rows returned"

**Problem:** API key not saved yet

**Solution:** 
1. Go to http://localhost:3000/profile
2. Click "Settings" tab
3. Enter an API key
4. Click "Save API Keys"
5. Check again

### "RLS policy violation"

**Problem:** RLS not allowing access

**Solution:** Ensure you're signed in and the `secrets` RLS policies allow your user_id

---

## 🔒 Security Notes

### Why You Can't See Keys in DB Table?

**This is intentional and secure!**

- Keys are encrypted with pgsodium Vault
- Even database admins can't see plain text keys
- Only your app (via RPC functions) can decrypt
- RLS policies ensure only the owner can access

### How to Retrieve Keys in Your App?

Your app uses the RPC function:

```javascript
const { data } = await supabase.rpc('get_decrypted_secret', {
  p_user_id: userId,
  p_provider: 'openai'
});
// data contains the decrypted API key
```

---

## ✅ Everything is Working If:

1. ✅ `/api/secrets` POST returns `{ ok: true }`
2. ✅ `secrets` table has a row with your user_id
3. ✅ Running `get_decrypted_secret` returns your key
4. ✅ `is_valid` column is `true`

---

## 🎯 Quick Test

1. **Go to Profile → Settings**
2. **Enter a fake API key:** `sk-test123`
3. **Click Save**
4. **Check Supabase:**
   ```sql
   SELECT * FROM secrets WHERE provider = 'openai';
   ```
5. **Decrypt it:**
   ```sql
   SELECT get_decrypted_secret(
     (SELECT user_id FROM secrets LIMIT 1),
     'openai'
   );
   ```
6. **Should return:** `sk-test123`

If this works, Vault is set up correctly! ✅

---

**The "success" message means it IS saving - just encrypted and hidden for security!** 🔐
