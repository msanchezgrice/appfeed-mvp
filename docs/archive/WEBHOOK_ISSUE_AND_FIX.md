# 🔧 Critical Issue: Clerk Webhooks Not Working

## 🚨 Problem Identified via Browser MCP

**Test:** Created new user test6@test.com  
**Result:** Sign-up stuck on "Loading..."  
**Database Check:** No profile created in Supabase ❌

---

## 🔍 Root Cause: Clerk Webhook Not Configured

### What Should Happen
```
1. User signs up in Clerk
2. Clerk sends webhook to: /api/webhooks/clerk
3. Webhook creates profile in Supabase profiles table
4. User can now save API keys (foreign key works)
```

### What's Actually Happening
```
1. User signs up in Clerk ✅
2. Clerk webhook NOT firing ❌
3. No profile created in Supabase ❌
4. Saving API keys fails (foreign key error) ❌
```

---

## ✅ Immediate Workaround (Already Applied)

I added auto-profile creation in `/api/secrets`:

```javascript
// Check if profile exists, create if not
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', userId)
  .single();

if (!profile) {
  // Auto-create profile
  await supabase.from('profiles').insert({
    id: userId,
    clerk_user_id: userId,
    username: `user_${userId.slice(-8)}`,
    display_name: 'User'
  });
}
```

**This works for saving API keys**, but doesn't help with the stuck sign-up.

---

## 🔧 Proper Fix: Configure Clerk Webhook

### Step 1: Create Webhook Endpoint in Clerk Dashboard

1. Go to: https://dashboard.clerk.com
2. Select your app
3. Go to: **Webhooks**
4. Click: **Add Endpoint**
5. **Endpoint URL:** 
   - Local: Use ngrok or similar tunnel
   - Production: `https://your-domain.com/api/webhooks/clerk`
6. **Events to Subscribe:**
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
7. Copy the **Signing Secret**
8. Add to `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### Step 2: For Local Testing (ngrok)

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Use this in Clerk webhook: https://abc123.ngrok.io/api/webhooks/clerk
```

---

## 🎯 Alternative: Sync Profile on First Use

Since webhooks are hard to test locally, I'll add profile sync to the sign-in flow:

### Add Profile Sync to Middleware

**Create:** `src/lib/sync-profile.js`

```javascript
export async function syncProfileFromClerk(clerkUser, supabase) {
  const userId = clerkUser.id;
  
  // Check if profile exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (existing) return; // Already synced
  
  // Create profile
  await supabase.from('profiles').insert({
    id: userId,
    clerk_user_id: userId,
    username: clerkUser.username || `user_${userId.slice(-8)}`,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    display_name: clerkUser.fullName || clerkUser.username || 'User',
    avatar_url: clerkUser.imageUrl
  });
}
```

Let me implement this now:

