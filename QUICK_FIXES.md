# 🔧 Quick Fixes

## Issue 1: User Not Showing in Database

### Why This Happens
The Clerk webhook needs to receive the `user.created` event, but sometimes:
- Webhook secret mismatch
- ngrok URL changed
- User created before webhook was configured

### ✅ Quick Fix: Manual Profile Sync

I created a manual sync endpoint. Run this in your browser console (when signed in):

```javascript
fetch('/api/sync-profile', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log('Profile synced:', d));
```

**Or use curl:**
```bash
curl -X POST http://localhost:3000/api/sync-profile \
  -H "Cookie: $(curl -s http://localhost:3000 | grep -o 'session=[^;]*')"
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "created",
  "profile": {
    "id": "user_...",
    "username": "your-username",
    "email": "your@email.com"
  }
}
```

### ✅ Verify Profile Created

Go to Supabase Dashboard:
```sql
SELECT * FROM profiles;
```

You should now see your profile! ✅

---

## Issue 2: API Keys "Saving" but Not Visible

### Good News: They ARE Saved! 🎉

**Your API keys ARE being saved** - they're just encrypted with Vault so you can't see them in plain text (this is intentional for security).

### ✅ Verify Vault Functions Exist

Run in Supabase SQL Editor:

```sql
-- Check vault functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%secret%'
ORDER BY routine_name;
```

**Should see:**
- `delete_secret`
- `get_decrypted_secret`
- `has_secret`
- `upsert_secret`

### ✅ Check Secrets Table

```sql
-- See your saved secrets (metadata only)
SELECT 
  user_id,
  provider,
  key_name,
  is_valid,
  created_at
FROM secrets
ORDER BY created_at DESC;
```

If you see rows → **Keys are saved!** ✅

### ✅ Test Decryption (Proves it Works)

```sql
-- Decrypt your OpenAI key (replace with your user_id)
SELECT get_decrypted_secret('user_...', 'openai') as my_key;
```

Should return your actual API key (proves encryption works).

---

## Issue 3: Webhook 400 Error

The webhook returned 400 (Missing svix headers). This means Clerk's webhook didn't reach your server properly.

### ✅ Verify Webhook Configuration

1. **Check Clerk Dashboard:**
   - Go to: https://dashboard.clerk.com
   - Webhooks → Your endpoint
   - URL should be: `https://flavia-hematologic-messiah.ngrok-free.dev/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted` ✓

2. **Verify Secret Matches:**
   ```bash
   # Check your .env.local
   cat .env.local | grep CLERK_WEBHOOK_SECRET
   ```
   Should match the signing secret in Clerk Dashboard

3. **Test Webhook (in Clerk Dashboard):**
   - Click "Send test event"
   - Should see 200 OK
   - Check server logs: `tail -f /tmp/appfeed-dev.log`

---

## 🎯 Complete Fix Workflow

### Step 1: Sync Your Profile (Run Now)
```javascript
// In browser console (when signed in)
fetch('/api/sync-profile', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

### Step 2: Verify Profile in Supabase
```sql
SELECT * FROM profiles WHERE id LIKE 'user_%';
```

### Step 3: Verify Vault Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('upsert_secret', 'get_decrypted_secret');
```

### Step 4: Test API Key Saving
1. Go to http://localhost:3000/profile
2. Click "Settings" tab
3. Enter API key: `sk-test123`
4. Click "Save API Keys"
5. Should see success message ✅

### Step 5: Verify in Database
```sql
-- Check secrets saved
SELECT provider, key_name, is_valid 
FROM secrets 
WHERE user_id = 'YOUR_USER_ID';

-- Decrypt to verify
SELECT get_decrypted_secret('YOUR_USER_ID', 'openai');
-- Should return: sk-test123
```

### Step 6: Load Sample Apps
```sql
-- Run the seed data
-- Copy/paste from: /supabase/seed_apps.sql
```

---

## 📊 Expected State After Fixes

### Profiles Table
```
id          | username    | email           | display_name
user_2xyz   | johndoe     | john@email.com  | John Doe
```

### Secrets Table
```
user_id    | provider | key_name        | is_valid
user_2xyz  | openai   | OpenAI API Key  | true
```

### Apps Table (after seed)
```
name                      | creator_id | view_count | is_published
Weather Checker           | user_2xyz  | 142        | true
Code Explainer            | user_2xyz  | 256        | true
Professional Email Writer | user_2xyz  | 189        | true
```

---

## 🐛 Still Having Issues?

### Profile Sync Failed?
```javascript
// Check auth state
console.log('Signed in?', window.Clerk?.user?.id);

// Try sync again
await fetch('/api/sync-profile', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

### Vault Functions Missing?
Run the vault migration:
```bash
# File: /supabase/migrations/20241110000002_vault_setup.sql
# Copy all SQL and run in Supabase SQL Editor
```

### Apps Not Showing?
```sql
-- Check apps exist
SELECT COUNT(*) FROM apps WHERE is_published = true;

-- Check creator_id matches your user
SELECT creator_id FROM apps LIMIT 1;
```

---

## ✅ Success Checklist

- [ ] Profile exists in `profiles` table
- [ ] Can save API keys (see success message)
- [ ] Secrets appear in `secrets` table
- [ ] Can decrypt secrets with `get_decrypted_secret()`
- [ ] Feed shows sample apps (after seed)
- [ ] Profile shows 0 followers (real data)
- [ ] Sign Out button works

---

**Most Important: Run the profile sync first!** Everything else depends on having a profile in the database.
