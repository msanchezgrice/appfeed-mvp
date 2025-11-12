# AppFeed Supabase Setup

This directory contains all SQL migrations for the AppFeed MVP database.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for first setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file **in order**:
   - `20241110000001_initial_schema.sql`
   - `20241110000002_vault_setup.sql`
   - `20241110000003_rls_policies.sql`
   - `20241110000004_triggers_functions.sql`

4. Verify all tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Database Schema Overview

### Core Tables

- **profiles**: User profiles (synced from Clerk)
- **apps**: Mini-apps with manifests
- **library_saves**: User's saved apps
- **follows**: Social graph (who follows whom)
- **runs**: App execution history
- **secrets**: Encrypted API keys (using Vault)
- **likes**: App likes
- **app_analytics**: Detailed event tracking
- **tags**: App categorization
- **todos**: User todo lists

### Key Features

✅ **Supabase Vault** - API keys encrypted with `pgsodium`
✅ **Row Level Security** - Integrated with Clerk JWT tokens
✅ **Full-text Search** - Postgres `tsvector` for fast app search
✅ **Denormalized Counts** - Triggers keep follower/save/view counts in sync
✅ **Analytics Functions** - Built-in helpers for metrics

## Verification Checklist

After running migrations, verify:

- [ ] All 10 tables exist
- [ ] `pgsodium` extension is enabled
- [ ] Encryption key 'api_keys' exists: `SELECT name FROM pgsodium.valid_key;`
- [ ] RLS is enabled on all tables: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;`
- [ ] Helper functions exist: `\df` in psql or check Functions in dashboard

## Testing Locally

Insert a test profile (replace with real Clerk user ID):

```sql
INSERT INTO profiles (id, clerk_user_id, username, display_name, avatar_url)
VALUES 
  ('user_test123', 'user_test123', 'testuser', 'Test User', 
   'https://api.dicebear.com/7.x/avataaars/svg?seed=test');
```

Test secret encryption:

```sql
-- Insert encrypted secret
SELECT upsert_secret(
  'user_test123',
  'openai',
  'sk-test-1234567890',
  'Test Key'
);

-- Verify it exists (encrypted)
SELECT id, user_id, provider, key_name, created_at 
FROM secrets 
WHERE user_id = 'user_test123';

-- Decrypt it (server-side only!)
SELECT * FROM get_decrypted_secret('user_test123', 'openai');
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ... # Never expose to client!

# Clerk (set up next)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# OpenAI (for server-side operations)
OPENAI_API_KEY=sk-...
```

## Next Steps

1. ✅ Run migrations
2. ⏭️ Set up Clerk authentication
3. ⏭️ Configure Clerk JWT template for Supabase
4. ⏭️ Set up Clerk webhook for user sync
5. ⏭️ Update API routes to use Supabase
6. ⏭️ Test everything end-to-end

## Troubleshooting

**Error: "pgsodium extension not available"**
- Vault is only available on paid Supabase plans
- For free tier, comment out vault setup and use app-level encryption temporarily

**Error: "permission denied for schema auth"**
- Make sure you're using the service role key for admin operations
- Some operations require `SECURITY DEFINER` functions

**RLS blocking queries**
- Check JWT token is being passed correctly
- Verify `auth.clerk_user_id()` returns the correct ID
- Use service role key to bypass RLS during debugging (be careful!)

## Support

- Supabase Docs: https://supabase.com/docs
- Clerk + Supabase Guide: https://clerk.com/docs/integrations/databases/supabase
- AppFeed Issues: [Your GitHub repo]
