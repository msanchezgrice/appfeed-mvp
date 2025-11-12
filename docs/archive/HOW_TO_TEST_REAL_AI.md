# 🧪 How to Test Real AI Responses

## 🔍 Problem Diagnosis

**What I See in Your Browser:**
- ✅ App IS running (executing successfully)
- ⚠️ Showing stub output: "(stubbed — add your OpenAI key on /secrets)"
- ❌ 401 Unauthorized errors for `/api/secrets` and `/api/library`

**Root Cause:** You're browsing as an **anonymous user** (not signed in)

**Your API Key Status:**
```sql
✅ Stored in database: user_35LGR8TO4rHQaJH5xIO9BgHShmd
✅ Provider: openai
✅ Encrypted: Working
✅ Decrypts to: sk-proj-VvOOpwc...
```

**The Issue:** The API key belongs to `user_35LGR8TO4rHQaJH5xIO9BgHShmd` but you're **not signed in** as that user!

---

## ✅ How to Fix: Sign In

### Option 1: Sign In with Existing Account (Fastest)

**Step 1:** Navigate to sign-in
```
http://localhost:3000/sign-in
```

**Step 2:** Enter credentials
```
Email: test2@test.com
Password: [Your Clerk password for this account]
```

**Step 3:** After signing in
- Auto-redirects to `/feed` ✅
- Now browsing as: user_35LGR8TO4rHQaJH5xIO9BgHShmd ✅
- Can access stored API key ✅

**Step 4:** Try an app
```
1. Click "Try" on any app
2. Enter text
3. Click "Run"
4. ✅ Should get REAL OpenAI response!
5. No more "(stubbed)" message!
```

---

### Option 2: Add API Key to YOUR Account

If you want to use your own account instead:

**Step 1:** Sign in with your account
```
http://localhost:3000/sign-in
[Use your own email/password]
```

**Step 2:** Go to Settings
```
http://localhost:3000/profile
Click "Settings" tab
```

**Step 3:** Enter your API key
```
OpenAI API Key: sk-proj-VvOOpwc4Hw3u...
Click "Save API Keys"
Wait for "✅ API keys saved successfully!"
```

**Step 4:** Try an app
```
Go to /feed
Click "Try" on any app
✅ Will use YOUR API key!
```

---

## 🔐 Why Anonymous Users See Stubs

This is **correct security behavior**:

| User State | userId | API Key Access | App Output |
|------------|--------|----------------|------------|
| ❌ Anonymous (you now) | null | ❌ Can't access keys | ⚠️ Stub data |
| ✅ Signed in (test2@test.com) | user_35LGR8TO... | ✅ Can access own key | ✅ Real AI |
| ✅ Signed in (your account) | your_user_id | ✅ Can access own key | ✅ Real AI (if you add key) |

**Why this is good:**
- Prevents unauthorized use of your API keys ✅
- Each user brings their own key (BYOK) ✅
- No one else can use your OpenAI credits ✅

---

## 🧪 Quick Verification Test

### Test as Anonymous (Current State)
```bash
# What happens now:
1. Browse to /feed
2. Try an app
3. Result: Stub data ✅ (correct - no API key access)
```

### Test as Signed-In User
```bash
# What will happen after signing in:
1. Sign in as test2@test.com
2. Browse to /feed (auto-redirects from /)
3. Try an app
4. Result: REAL OpenAI response! ✅
```

---

## 📊 Current Database State

### API Key Stored ✅
```sql
SELECT user_id, provider, key_name, is_valid 
FROM secrets;

Result:
user_id: user_35LGR8TO4rHQaJH5xIO9BgHShmd
provider: openai
key_name: OpenAI API Key
is_valid: true
```

### Decryption Working ✅
```sql
SELECT provider, LEFT(api_key, 15) || '...' as preview
FROM get_decrypted_secret('user_35LGR8TO4rHQaJH5xIO9BgHShmd', 'openai');

Result:
provider: openai
preview: sk-proj-VvOOpwc...
```

**Encryption system is 100% functional!** ✅

---

## 🎯 The Fix (30 seconds)

```bash
1. Go to: http://localhost:3000/sign-in
2. Sign in as: test2@test.com
3. Go to: http://localhost:3000/feed (or auto-redirects)
4. Click "Try" on Text Summarizer
5. Enter: "AI is changing the world"
6. Click "Run"
7. ✅ Get REAL OpenAI summary!
```

---

## 💡 Understanding the Flow

### Without Sign-In (Current)
```
Anonymous User
  ↓
userId = null
  ↓
getDecryptedSecret(null, 'openai')
  ↓
No user = No API key access
  ↓
Returns: null
  ↓
tool_llm_complete sees null
  ↓
Returns: "stubbed — add your OpenAI key"
  ↓
✅ Correct behavior for anonymous users
```

### With Sign-In (What You Need)
```
Signed In as test2@test.com
  ↓
userId = 'user_35LGR8TO4rHQaJH5xIO9BgHShmd'
  ↓
getDecryptedSecret('user_35LGR8TO4rHQaJH5xIO9BgHShmd', 'openai')
  ↓
Supabase RPC: get_decrypted_secret()
  ↓
Decrypts: sk-proj-VvOOpwc...
  ↓
Returns: Your actual OpenAI key
  ↓
tool_llm_complete makes REAL OpenAI API call
  ↓
Returns: Actual AI response
  ↓
✅ No stub message!
```

---

## ✅ Confirmation

**Your Setup is Working Perfectly:**
1. ✅ API key is saved in database
2. ✅ Encryption/decryption working
3. ✅ Code updated to use Supabase
4. ✅ Anonymous users correctly blocked from API keys
5. ✅ Signed-in users can access their own keys

**You just need to sign in to unlock the real AI!**

---

## 🚀 Next Steps

1. **Sign in** as test2@test.com
2. **Try an app**
3. **See real AI magic!** ✨

The system is working exactly as designed - you just need to authenticate to access your API keys!

