# 🔐 Clerk + Supabase Setup Guide

**Your database is ready!** Now we just need to connect Clerk authentication.

## ✅ What's Already Done

- ✅ Supabase database with all tables
- ✅ Clerk-compatible RLS policies
- ✅ Sign-in/sign-up pages
- ✅ Clerk middleware
- ✅ Clerk webhook route
- ✅ Supabase clients configured for Clerk JWT

**All you need: 15 minutes to set up Clerk dashboard**

---

## 📋 Step 1: Create Clerk Application (5 min)

1. Go to [clerk.com](https://clerk.com) and sign in
2. Click **"Create Application"**
3. **Application name**: `AppFeed`
4. **Authentication methods** - Enable:
   - ✅ Email
   - ✅ GitHub
   - ✅ Google (optional)
5. Click **"Create Application"**

---

## 📋 Step 2: Get API Keys (2 min)

1. In Clerk Dashboard, go to **API Keys** (left sidebar)
2. Copy these keys to your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 📋 Step 3: Configure JWT Template for Supabase (5 min)

**This is CRITICAL** - Supabase needs to verify Clerk's JWTs.

1. In Clerk Dashboard, go to **JWT Templates** (left sidebar)
2. Click **"New template"** → Select **"Supabase"**
3. **Template name**: `supabase` (must be exactly this)
4. The template should auto-fill with:

```json
{
  "aud": "authenticated",
  "exp": "{{user.exp}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated",
  "user_metadata": {
    "full_name": "{{user.full_name}}",
    "avatar_url": "{{user.profile_image_url}}"
  }
}
```

5. **Important settings:**
   - Signing algorithm: **RS256** (should be default)
   - Token lifetime: **3600 seconds** (1 hour)

6. Click **"Save"**

---

## 📋 Step 4: Set Up Webhook for User Sync (5 min)

This syncs Clerk users → Supabase profiles table.

1. In Clerk Dashboard, go to **Webhooks** (left sidebar)
2. Click **"Add Endpoint"**
3. **Endpoint URL**:
   - For local dev: Use [ngrok](https://ngrok.com): `ngrok http 3000` → Use the URL
   - For production: `https://your-app.vercel.app/api/webhooks/clerk`

4. **Subscribe to events** - Select these:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`

5. Click **"Create"**

6. Copy the **Signing Secret** (starts with `whsec_...`) to `.env.local`:

```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

---

## 📋 Step 5: Run the Clerk Migration in Supabase

We need to apply one more migration to update RLS policies for Clerk.

### Option A: Via Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/lobodzhfgojceqfvgcit)
2. Click **SQL Editor**
3. Click **"New query"**
4. Copy contents of `/supabase/migrations/20241110000005_clerk_jwt_support.sql`
5. Paste and click **"Run"**

### Option B: Via CLI

```bash
cd /Users/miguel/Desktop/appfeed-mvp
supabase db push
```

---

## 📋 Step 6: Test Locally (5 min)

```bash
# Make sure .env.local has all 3 Clerk keys
npm run dev
```

**Test the flow:**

1. Visit `http://localhost:3000`
2. Click **"Sign In"** (or go to `/sign-in`)
3. Sign up with email or OAuth
4. Should redirect to `/feed`
5. Check Supabase Dashboard → **Table Editor** → **profiles**
   - You should see your new profile!

---

## 📋 Step 7: Deploy to Vercel (5 min)

### Add Environment Variables to Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these (same as `.env.local`):

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase (already have these)
NEXT_PUBLIC_SUPABASE_URL=https://lobodzhfgojceqfvgcit.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# OpenAI
OPENAI_API_KEY=sk-...

# App Config
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
PORT=3000
OPENAI_MODEL=gpt-4o-mini
ALLOW_NETWORK_IN_TRY=0
```

### Update Webhook URL

1. Go back to Clerk Dashboard → **Webhooks**
2. Edit your webhook
3. Change URL to production: `https://your-app.vercel.app/api/webhooks/clerk`
4. Save

### Deploy

```bash
# Commit changes
git add .
git commit -m "Add Clerk authentication"
git push

# Vercel will auto-deploy
```

---

## ✅ Verification Checklist

### Clerk Dashboard
- [ ] JWT template named "supabase" exists
- [ ] Webhook configured with correct events
- [ ] Signing secret copied to .env

### Local Testing
- [ ] Can sign up with email
- [ ] Can sign in with OAuth (GitHub/Google)
- [ ] After signup, profile appears in Supabase
- [ ] Webhook logs show success in Clerk dashboard

### Production Testing
- [ ] Sign up creates profile in Supabase
- [ ] Can save apps to library
- [ ] Can publish apps
- [ ] Can add API keys (encrypted in Vault)

---

## 🐛 Troubleshooting

### "Unauthorized" errors on API calls

**Problem**: RLS policies rejecting requests

**Solutions**:
1. Check JWT template is named exactly `supabase`
2. Verify template includes `sub` claim with `{{user.id}}`
3. Check `get_clerk_user_id()` function exists in Supabase
4. Run the Clerk migration: `/supabase/migrations/20241110000005_clerk_jwt_support.sql`

### Webhook not creating profiles

**Problem**: User signup doesn't create Supabase profile

**Solutions**:
1. Check webhook URL is accessible
2. Verify webhook secret in .env matches Clerk
3. Check Clerk webhook logs for errors
4. Verify events are enabled: `user.created`, `user.updated`, `user.deleted`

### "Invalid template" error

**Problem**: `getToken({ template: 'supabase' })` fails

**Solutions**:
1. JWT template must be named exactly `supabase` (lowercase)
2. Template must be applied to your Clerk application
3. Try signing out and back in to refresh token

---

## 🔐 Security Notes

### What's Encrypted
- ✅ API keys in Supabase Vault (pgsodium)
- ✅ User passwords (Clerk handles this)
- ✅ JWT tokens signed with RS256

### What's Protected
- ✅ All mutations require authentication
- ✅ RLS policies prevent unauthorized access
- ✅ Service role key never exposed to client
- ✅ Webhook validates signature

---

## 📊 Architecture

```
User Browser
    ↓ Sign in
Clerk (Auth)
    ↓ JWT Token
Next.js API Routes
    ↓ Verify JWT + extract user ID
Supabase RLS Policies
    ↓ Check: public.get_clerk_user_id() = user_id
Supabase Database
    ↓ Return data
```

---

## 🎯 Next Steps After Setup

1. **Seed initial data**:
   - Create some starter apps
   - Add featured creators
   - Populate tags

2. **Test all features**:
   - Sign up → profile created ✅
   - Publish app ✅
   - Save to library ✅
   - Add API keys ✅
   - Try/use apps ✅
   - Follow creators ✅

3. **Monitor**:
   - Clerk Dashboard → Users
   - Supabase Dashboard → Table Editor
   - Vercel Logs

4. **Optional enhancements**:
   - Add more OAuth providers
   - Customize Clerk UI theme
   - Add email templates
   - Implement waitlist

---

## 📚 Resources

- **Clerk Docs**: https://clerk.com/docs
- **Clerk + Supabase Guide**: https://clerk.com/docs/integrations/databases/supabase
- **Supabase Dashboard**: https://supabase.com/dashboard/project/lobodzhfgojceqfvgcit
- **Your App**: Will be at your Vercel URL

---

**Questions?** Check the troubleshooting section or Clerk/Supabase docs!

Good luck! 🚀
