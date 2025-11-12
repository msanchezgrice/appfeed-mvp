# 🔍 Authentication Debug Guide

## The Problem:

Despite all fixes:
1. Library saves not persisting → Returns 401 Unauthorized
2. App execution failing → Can't save runs
3. API keys not saving → Vault function error

## Root Cause:

**Clerk authentication is not reaching the API routes.**

Even though:
- ✅ User is signed in (visible in UI)
- ✅ Middleware is configured
- ✅ Service role key is set

The issue: `currentUser()` returns `null` in API routes.

---

## Why This Happens:

### Clerk v5 Architecture:

In Clerk v5, the session is stored in cookies. For `currentUser()` to work in API routes:

1. **Browser must send cookies** → `credentials: 'include'` ✅ (we have this)
2. **Middleware must run** → Sets auth context ✅ (middleware exists)
3. **Cookies must be readable** → Next.js must parse them
4. **currentUser() must be awaited** → ✅ (we do this)

---

## Debug Steps:

### 1. Check if Clerk cookies exist:

In browser console:
```javascript
document.cookie
```

Should see: `__session=...` or `__clerk_db_jwt=...`

### 2. Check if cookies are sent to API:

In browser Network tab:
- Click heart icon
- Find `POST /api/library` request
- Check "Cookies" tab
- Should see Clerk cookies

### 3. Check server-side auth:

In `src/lib/supabase-server.js`, add logging:
```javascript
export async function createServerSupabaseClient(options = {}) {
  const user = await currentUser();
  console.log('🔐 Current user:', user?.id || 'NONE');
  console.log('🔐 User email:', user?.emailAddresses?.[0]?.emailAddress);
  const userId = user?.id || null;
  // ...
}
```

---

## Possible Fixes:

### Option 1: Use auth() instead of currentUser()

```javascript
import { auth } from '@clerk/nextjs/server';

export async function createServerSupabaseClient(options = {}) {
  const { userId } = await auth();
  console.log('🔐 Auth userId:', userId || 'NONE');
  // ...
}
```

### Option 2: Force middleware to set auth

```javascript
export default clerkMiddleware((auth, req) => {
  // Force Clerk to process auth for all routes
  return;
});
```

### Option 3: Use Clerk's built-in API helpers

```javascript
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

---

## Quick Test:

Add this to `/api/library/route.js`:

```javascript
export async function POST(req) {
  try {
    // TEST: Multiple auth methods
    const user1 = await currentUser();
    const auth1 = await auth();
    const auth2 = getAuth(req);
    
    console.log('🔍 currentUser():', user1?.id || 'NULL');
    console.log('🔍 auth():', auth1.userId || 'NULL');
    console.log('🔍 getAuth(req):', auth2.userId || 'NULL');
    
    // Use whichever works
    const userId = user1?.id || auth1.userId || auth2.userId;
    
    if (!userId) {
      console.error('❌ NO AUTH METHOD WORKED');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ User authenticated:', userId);
    // ... rest of code
  }
}
```

---

## Expected Behavior:

When working correctly:
- `currentUser()` should return user object
- `auth().userId` should return Clerk user ID
- Logs should show: `✅ User authenticated: user_xxx`

---

## Next Steps:

1. Add logging to see which auth method works
2. Update all API routes to use working method
3. Test saves, runs, secrets
4. Remove debug logs once working

---

Time to debug: 5-10 minutes
