# Gemini Provider Support - Database Constraint Fix

## Issue
Users were unable to save Google Gemini API keys due to a database check constraint that didn't include 'gemini' as an allowed provider.

**Error:**
```
new row for relation "secrets" violates check constraint "secrets_provider_check"
```

## Root Cause
The `secrets` table had a check constraint defined in `supabase/migrations/20241110000002_vault_setup.sql` (line 22) that only allowed:
- `'openai'`
- `'anthropic'`
- `'replicate'`
- `'github'`
- `'custom'`

But NOT `'gemini'`, even though the application code already supported it.

## Solution

### 1. Database Migration
Created new migration: `supabase/migrations/20251113000001_add_gemini_provider.sql`

This migration:
- Drops the old check constraint
- Creates a new check constraint that includes `'gemini'`

**To apply this migration:**
```bash
# If using Supabase CLI
npx supabase db push

# Or run the SQL directly in Supabase SQL Editor
```

### 2. Code Updates - User Key Fallback Pattern
Updated all Gemini API key usage to follow the same pattern as Anthropic:
1. Try user's personal Gemini API key first
2. Fall back to platform `process.env.GEMINI_API_KEY` if user hasn't provided one

This ensures:
- ✅ Platform-level Gemini key continues to work as fallback
- ✅ Users can optionally provide their own Gemini keys
- ✅ No breaking changes to existing functionality

### Files Updated

#### 1. **src/lib/tools.js** - `tool_image_process` function
- Added user key retrieval with platform fallback
- Logs which key source is being used

#### 2. **src/app/api/apps/publish/route.js** - Image generation during publish
- Added user key retrieval with platform fallback
- Maintains backward compatibility

#### 3. **src/app/api/apps/remix/route.js** - Image generation during remix
- Added user key retrieval with platform fallback
- Uses dynamic import for secrets library

#### 4. **src/app/api/generate-app-image/route.js** - Single app image generation
- Added user key retrieval with platform fallback
- User-facing endpoint now respects user keys

#### 5. **src/app/api/generate-all-images/route.js** - Batch admin operation
- **Left unchanged** - admin bulk operations use platform key only

## Pattern Used

All updated functions now follow this pattern:

```javascript
// Try user key first, then fall back to platform key
const envKey = process.env.GEMINI_API_KEY;
let userKey = null;

try {
  const { getDecryptedSecret } = await import('@/src/lib/secrets.js');
  userKey = await getDecryptedSecret(userId, 'gemini', supabase);
} catch (err) {
  console.warn('[Context] Error retrieving user Gemini key:', err);
}

const geminiKey = userKey || envKey;
console.log('[Context] Gemini key source:', userKey ? 'user-secret' : (envKey ? 'platform-env' : 'none'));
```

This matches the Anthropic pattern already in use (see `generateManifestWithAnthropic` in `publish/route.js`).

## Testing

After applying the migration:

1. **Test user can save Gemini key:**
   - Go to `/profile` → Settings
   - Add Google Gemini API Key
   - Click "Save API Keys"
   - Should succeed without constraint error

2. **Test fallback logic:**
   - User WITH Gemini key → uses user's key
   - User WITHOUT Gemini key → uses platform key (from env)
   - Check logs for "Gemini key source: user-secret" or "platform-env"

3. **Verify no breaking changes:**
   - Image generation should still work for all users
   - Apps using `tool_image_process` should work
   - Publish/remix image generation should work

## Summary

✅ Database constraint fixed to allow 'gemini' provider
✅ All Gemini API usage updated to support user keys with platform fallback
✅ No breaking changes - platform key still works as fallback
✅ Maintains consistency with existing Anthropic pattern
✅ Proper logging added for debugging key source

Users can now save their Gemini API keys, and the system will intelligently use their personal key when available, falling back to the platform key when not.

