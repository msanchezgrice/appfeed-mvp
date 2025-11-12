# ✅ Correct Clerk JWT Template for Supabase

## Template Configuration

### Basic Info
- **Template Name**: `supabase` (lowercase, exactly this)
- **Description**: JWT for Supabase RLS
- **Signing Algorithm**: RS256 (default, don't change)
- **Token Lifetime**: 3600 seconds

### Claims (Copy this EXACTLY)

```json
{
  "aud": "authenticated",
  "exp": {{user.created_at}},
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

**IMPORTANT**: 
- Make sure there are NO quotes around `{{user.created_at}}`
- All other values HAVE quotes: `"{{user.id}}"`
- Template name must be lowercase `supabase`

---

## Common Errors & Fixes

### Error: "Invalid template"
**Cause**: Template name is wrong
**Fix**: Name must be exactly `supabase` (lowercase)

### Error: "Claims validation failed"
**Cause**: Missing required claims
**Fix**: Make sure you have:
- `sub` - User ID
- `role` - Must be "authenticated"
- `aud` - Must be "authenticated"

### Error: "exp claim invalid"
**Cause**: Wrong format for expiration
**Fix**: Use `{{user.created_at}}` without quotes, OR use:
```json
{
  "exp": 1800000000000
}
```

---

## Minimal Working Template

If above doesn't work, try this minimal version:

```json
{
  "sub": "{{user.id}}"
}
```

Then test. If it works, add back other claims one by one.

---

## How to Test

1. Save the template
2. Sign out of your Clerk session
3. Sign back in (to get new token)
4. Try accessing a protected API route
5. Check browser console for errors

---

## Screenshots Guide

Your template should look like:
```
┌─────────────────────────────────┐
│ Template name: supabase         │
│ ✓ Saved                         │
├─────────────────────────────────┤
│ Claims:                         │
│ {                               │
│   "aud": "authenticated",       │
│   "exp": {{user.created_at}},   │ ← No quotes!
│   "sub": "{{user.id}}",         │ ← With quotes!
│   "email": "...",               │
│   "role": "authenticated"       │
│ }                               │
└─────────────────────────────────┘
```

---

## Verify It's Working

Run this in browser console after signing in:

```javascript
// Get the token
const token = await window.Clerk.session.getToken({ template: 'supabase' });
console.log('Token:', token);

// Decode it (just to see, don't use in prod)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Payload:', payload);
// Should show: { sub: "user_...", role: "authenticated", ... }
```

---

## Alternative: Use Clerk's Pre-built Supabase Template

1. In JWT Templates, look for **"Supabase"** in the template gallery
2. Click it to auto-configure
3. Just change the name to `supabase` if needed
4. Save

This pre-built template has all the correct claims!

---

## Still Having Issues?

**Share the exact error message** you're seeing. Common error locations:
- Browser console (F12)
- Network tab → API responses
- Vercel logs
- Supabase logs

**Or try:** Start with minimal template `{"sub": "{{user.id}}"}` and verify that works first.
