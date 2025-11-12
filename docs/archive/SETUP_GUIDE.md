# AppFeed Setup Guide - Clerk + Supabase

This guide will walk you through setting up your production-ready AppFeed deployment.

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ npm packages installed (`@clerk/nextjs`, `@supabase/supabase-js`)
- ✅ Git repository connected to Vercel (or your hosting platform)

---

## Part 1: Supabase Setup (15 minutes)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose your organization
4. Set project name: `appfeed-production`
5. Set database password (save it somewhere safe!)
6. Choose region closest to your users
7. Click **"Create new project"** and wait ~2 minutes

### 1.2 Run Database Migrations

1. Once project is ready, go to **SQL Editor** in left sidebar
2. Click **"New Query"**
3. Copy contents of `/supabase/migrations/20241110000001_initial_schema.sql`
4. Paste into editor and click **"Run"**
5. Repeat for these files **in order**:
   - `20241110000002_vault_setup.sql`
   - `20241110000003_rls_policies.sql`
   - `20241110000004_triggers_functions.sql`

### 1.3 Verify Setup

Run this query to verify everything is created:

```sql
-- Should show all 10 tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should show 'api_keys' encryption key
SELECT name FROM pgsodium.valid_key;

-- Should show auth function
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'auth' AND routine_name = 'clerk_user_id';
```

### 1.4 Get API Keys

1. Go to **Settings** → **API**
2. Copy these values (you'll need them for `.env.local`):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Starts with `eyJhbG...`
   - **service_role key**: Starts with `eyJhbG...` (different from anon key)

⚠️ **IMPORTANT**: Never expose service_role key to the client!

### 1.5 Set Up Storage (Optional - for future avatar uploads)

1. Go to **Storage** in left sidebar
2. Click **"Create bucket"**
3. Name: `avatars`, Public: Yes
4. Repeat for `app-previews` bucket

---

## Part 2: Clerk Setup (10 minutes)

### 2.1 Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign in
2. Click **"Create Application"**
3. Name: `AppFeed`
4. Choose auth methods:
   - ✅ Email
   - ✅ GitHub (recommended)
   - ✅ Google (optional)
5. Click **"Create Application"**

### 2.2 Get API Keys

1. On the Clerk dashboard, go to **API Keys**
2. Copy these values (you'll need them for `.env.local`):
   - **Publishable Key**: Starts with `pk_test_...` or `pk_live_...`
   - **Secret Key**: Starts with `sk_test_...` or `sk_live_...`

### 2.3 Create JWT Template for Supabase

**This is critical for RLS to work!**

1. In Clerk dashboard, go to **JWT Templates** in left sidebar
2. Click **"New Template"** → **"Supabase"** (or "Blank" if Supabase option not available)
3. Name it exactly: `supabase`
4. Set these claims:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

5. **Token Lifetime**: 3600 seconds (1 hour)
6. Click **"Save"**

### 2.4 Set Up Webhook

1. In Clerk dashboard, go to **Webhooks** in left sidebar
2. Click **"Add Endpoint"**
3. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/clerk`
   - For local testing: Use ngrok to expose localhost
4. **Subscribe to events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Click **"Create"**
6. Copy the **Signing Secret** (starts with `whsec_...`)

---

## Part 3: Local Environment Setup

### 3.1 Create .env.local

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 3.2 Fill in Environment Variables

Edit `.env.local` with your keys:

```bash
# Clerk (from Part 2.2)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_... # from Part 2.4

# Supabase (from Part 1.4)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # KEEP SECRET!

# OpenAI (your existing key)
OPENAI_API_KEY=sk-...

# Local config
PORT=3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3.3 Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and:

1. Click **"Sign Up"** - should show Clerk signup form
2. Create an account
3. Check Supabase:
   - Go to **Table Editor** → **profiles**
   - You should see your new profile!

---

## Part 4: Deploy to Vercel (Production)

### 4.1 Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Add ALL variables from your `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://your-app.vercel.app`

4. Make sure to select **"Production"** environment for each

### 4.2 Update Clerk Webhook URL

1. Go back to Clerk dashboard → **Webhooks**
2. Edit your webhook endpoint
3. Change URL to: `https://your-app.vercel.app/api/webhooks/clerk`
4. Click **"Save"**

### 4.3 Deploy

```bash
git add .
git commit -m "Add Supabase and Clerk integration"
git push
```

Vercel will automatically deploy.

### 4.4 Test Production

1. Visit `https://your-app.vercel.app`
2. Sign up with a new account
3. Verify in Supabase that profile was created

---

## Part 5: Verification Checklist

### ✅ Supabase
- [ ] All 4 migrations ran successfully
- [ ] 10 tables exist in public schema
- [ ] `pgsodium` extension enabled
- [ ] Encryption key 'api_keys' exists
- [ ] RLS enabled on all tables
- [ ] Test user profile created after signup

### ✅ Clerk
- [ ] Application created
- [ ] JWT template named "supabase" exists
- [ ] Webhook configured and verified
- [ ] Can sign up new users
- [ ] Users appear in Clerk dashboard

### ✅ Integration
- [ ] Signup creates profile in Supabase
- [ ] Login works and redirects to /feed
- [ ] API routes return data (not 401 errors)
- [ ] Can save API keys (test with dummy key)
- [ ] Can publish apps (test with sample manifest)

---

## Part 6: Testing the Full Flow

### Test 1: Authentication
1. **Sign up** → Profile should appear in Supabase
2. **Sign out** → Should redirect to home
3. **Sign in** → Should redirect to /feed

### Test 2: API Keys (BYOK)
1. Go to `/profile` → **Settings** tab
2. Add a test OpenAI key: `sk-test123456`
3. Save → Should show success
4. Check Supabase **secrets** table → Should have encrypted entry
5. Refresh page → Should show "present" status (not the actual key)

### Test 3: App Publishing
1. Go to `/publish`
2. Choose "Inline JSON" mode
3. Paste sample manifest:
```json
{
  "inputs": {
    "name": { "type": "string", "required": true }
  },
  "outputs": {
    "message": { "type": "string" }
  },
  "runtime": {
    "engine": "node",
    "steps": [
      {
        "tool": "echo",
        "args": { "text": "Hello {{name}}" }
      }
    ]
  },
  "demo": {
    "sampleInputs": { "name": "World" }
  }
}
```
4. Name: "Test App", Description: "A test", Tags: "test"
5. Click **Publish** → Should redirect to app page
6. Check Supabase **apps** table → Should see your app

### Test 4: App Interaction
1. View app in feed
2. Click **Try** → Should show input form
3. Submit → Should execute (may need OpenAI key for LLM steps)
4. Click **Save** → Should add to library
5. Check Supabase **library_saves** table → Should have entry

---

## Troubleshooting

### "Unauthorized" errors on API calls
- **Check**: Clerk JWT template is named exactly "supabase"
- **Check**: User is logged in (check Clerk session)
- **Check**: RLS policies allow the operation

### Webhook not creating profiles
- **Check**: Webhook URL is correct and accessible
- **Check**: Webhook secret matches `.env.local`
- **Check**: Events are enabled in Clerk
- **Check**: Vercel logs for errors: `vercel logs`

### "Encryption key not found" errors
- **Check**: `pgsodium` extension is enabled
- **Check**: `api_keys` key exists: `SELECT name FROM pgsodium.valid_key;`
- **Check**: Vault migration ran successfully

### RLS blocking legitimate queries
- **Check**: `auth.clerk_user_id()` function exists
- **Check**: JWT token includes "sub" claim with user ID
- **Check**: Profile exists for this Clerk user ID
- **Debug**: Use service role key temporarily to bypass RLS

### Can't decrypt secrets
- **Check**: Using service role key (not anon key)
- **Check**: Calling `get_decrypted_secret()` function (not direct SELECT)
- **Check**: User owns the secret

---

## Next Steps After Setup

1. **Migrate existing data** (if any) from `.data/db.json`
2. **Update remaining API routes** (see IMPLEMENTATION_STATUS.md)
3. **Update frontend components** to use Clerk hooks
4. **Add analytics tracking** 
5. **Test all features** end-to-end
6. **Monitor logs** in both Clerk and Supabase

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **Clerk + Supabase Guide**: https://clerk.com/docs/integrations/databases/supabase
- **Supabase Vault Guide**: https://supabase.com/docs/guides/database/vault

---

**Setup complete!** 🎉 Your AppFeed is now running on production-grade infrastructure with real auth and encrypted secrets.
