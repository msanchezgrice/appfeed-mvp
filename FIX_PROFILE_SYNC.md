# 🔧 Fix: User "test2" in Clerk but NOT in Supabase

## Current Situation
- ✅ You're logged in as "test2" in Clerk
- ❌ "test2" profile does NOT exist in Supabase database
- ❌ Webhook didn't create the profile automatically

---

## ✅ SOLUTION 1: Manual Profile Sync (Fastest - Do This Now!)

### Step 1: Open Browser Console
While logged in as "test2" at http://localhost:3000:

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Paste and run this command:

```javascript
fetch('/api/sync-profile', { 
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(d => {
  console.log('✅ Profile sync result:', d);
  if (d.ok) {
    console.log('✅ SUCCESS! Profile created:', d.profile);
    console.log('User ID:', d.profile.id);
    console.log('Username:', d.profile.username);
    console.log('Email:', d.profile.email);
  } else {
    console.error('❌ Error:', d.error);
  }
});
```

**Expected Output:**
```javascript
{
  ok: true,
  action: "created",
  profile: {
    id: "user_2abc...",
    username: "test2",
    email: "test2@example.com",
    display_name: "Test2",
    avatar_url: "https://..."
  }
}
```

### Step 2: Verify in Supabase

Go to: https://supabase.com/dashboard/project/lobodzhfgojceqfvgcit/editor

Run this SQL:
```sql
SELECT * FROM profiles WHERE username LIKE '%test2%';
```

You should see your profile! ✅

---

## ✅ SOLUTION 2: Using Supabase CLI

### Check Current Profiles
```bash
cd /Users/miguel/Desktop/appfeed-mvp

# List all profiles
supabase db remote select profiles --columns "id,username,email,display_name"
```

### Manually Insert Profile (if sync fails)

Get your Clerk user ID first:
```javascript
// Run in browser console while logged in
console.log('Your Clerk User ID:', window.Clerk?.user?.id);
console.log('Your Email:', window.Clerk?.user?.primaryEmailAddress?.emailAddress);
```

Then run in Supabase SQL Editor:
```sql
INSERT INTO profiles (
  id,
  clerk_user_id,
  username,
  email,
  display_name,
  avatar_url
) VALUES (
  'YOUR_CLERK_USER_ID',  -- Replace with actual ID from above
  'YOUR_CLERK_USER_ID',  -- Same ID
  'test2',
  'test2@example.com',   -- Replace with actual email
  'Test2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=test2'
);
```

---

## 🔍 Why Webhook Didn't Work

Based on the logs, the webhook received a 400 error (Missing svix headers). This happens when:

1. **Webhook not configured in Clerk Dashboard**
2. **Wrong webhook URL** (ngrok might have restarted)
3. **Webhook secret mismatch**
4. **User created before webhook was set up**

### Fix Webhook for Future Users

#### 1. Verify ngrok URL hasn't changed
```bash
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*'
```

Current URL should be: `https://flavia-hematologic-messiah.ngrok-free.dev`

#### 2. Check Clerk Webhook Configuration

Go to: https://dashboard.clerk.com → Webhooks

**Verify:**
- Endpoint URL: `https://flavia-hematologic-messiah.ngrok-free.dev/api/webhooks/clerk`
- Events selected: ✅ user.created, ✅ user.updated, ✅ user.deleted
- Status: Active
- Signing secret matches `.env.local`

#### 3. Test Webhook (in Clerk Dashboard)

Click "Send test event" → Should see:
- ✅ 200 OK response
- Check server logs: `tail -f /tmp/appfeed-dev.log`
- Should see: "Webhook received: user.created"

---

## 🧪 Testing the Fix

### After Profile Sync:

1. **Check Profile Page**
   - Go to http://localhost:3000/profile
   - Should load without errors
   - Should show your avatar, username, email
   - Followers count: 0

2. **Check Database**
   ```sql
   SELECT 
     id,
     username,
     email,
     display_name,
     created_at
   FROM profiles
   ORDER BY created_at DESC;
   ```

3. **Test Creating an App**
   - Go to http://localhost:3000/publish
   - Try creating a test app
   - Should work now that profile exists

4. **Test Feed**
   - Run the seed data (after profile exists)
   - Feed should show apps

---

## 🔧 Debugging Commands

### Check if you're authenticated
```javascript
// In browser console
console.log('Clerk User:', window.Clerk?.user);
console.log('User ID:', window.Clerk?.user?.id);
console.log('Email:', window.Clerk?.user?.primaryEmailAddress?.emailAddress);
```

### Check API responses
```javascript
// Test if APIs work
fetch('/api/apps').then(r => r.json()).then(console.log);
```

### Check server logs
```bash
tail -f /tmp/appfeed-dev.log
```

### Query Supabase directly
```bash
# Using Supabase CLI
supabase db remote select profiles

# Or in SQL Editor
SELECT COUNT(*) as total_users FROM profiles;
SELECT * FROM profiles WHERE username = 'test2';
```

---

## 📊 Expected Database State

### After Profile Sync:
```sql
-- profiles table
id              | username | email             | display_name | created_at
user_2xyz...    | test2    | test2@example.com | Test2        | 2025-11-11...
```

### After Seed Data:
```sql
-- apps table
id                     | name             | creator_id   | view_count | is_published
app_weather_checker    | Weather Checker  | user_2xyz... | 142        | true
app_code_explainer     | Code Explainer   | user_2xyz... | 256        | true
app_email_writer       | Email Writer     | user_2xyz... | 189        | true
```

---

## ✅ Success Checklist

- [ ] Profile sync returns `{ ok: true }`
- [ ] Profile appears in Supabase `profiles` table
- [ ] Profile page loads without errors
- [ ] Can publish apps
- [ ] Seed data runs successfully (after profile exists)
- [ ] Feed shows 3 apps
- [ ] All stats show real data (0 followers, etc)

---

## 🚨 If Manual Sync STILL Fails

Check the error in browser console and server logs:

**Common Issues:**

1. **"Not authenticated"** → Sign out and back in
2. **"Profile already exists"** → Check Supabase, might be there already
3. **"RLS policy violation"** → Check RLS policies allow insert
4. **Network error** → Check dev server is running

**Nuclear Option - Direct SQL Insert:**
```sql
-- Get your Clerk user ID from browser console first
INSERT INTO profiles (id, clerk_user_id, username, email, display_name, avatar_url)
VALUES (
  'user_2abc...', 
  'user_2abc...', 
  'test2', 
  'test2@example.com', 
  'Test2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=test2'
)
ON CONFLICT (id) DO NOTHING;
```

---

**Start with SOLUTION 1 - Run the profile sync in browser console NOW!** 🚀
