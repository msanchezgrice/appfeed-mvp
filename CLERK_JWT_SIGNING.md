# Clerk JWT Template - Signing Key Question

## ❌ Do NOT Use Custom Signing Key

**Answer: Leave it as DEFAULT / Use Clerk's RS256 signing**

### Why?

Clerk automatically signs JWTs with its own private key using RS256 algorithm. Supabase then verifies these tokens using Clerk's public key.

You do NOT need to provide any custom key!

---

## Correct Settings

### In the JWT Template Form:

**Template Name**: `supabase`

**Signing Algorithm**: 
- Choose: **"RS256"** (default)
- OR leave as "Default" if that's an option

**Custom Signing Key**: 
- Leave EMPTY
- OR select "Use default Clerk signing"
- Do NOT add any custom key

**Claims**:
```json
{
  "sub": "{{user.id}}"
}
```

**Lifetime**: `3600`

---

## If Clerk UI is Asking for a Key

### Option 1: Select "Default" or "Clerk Managed"
Most likely there's a dropdown or radio button that says:
- ○ Custom signing key
- ● **Clerk managed signing** ← Select this!

### Option 2: Skip the Signing Key Section
If there's a "signing key" field that's optional, just leave it blank.

### Option 3: Use Their Supabase Integration Template
1. In JWT Templates, look for **"Create from gallery"** or **"Integrations"**
2. Find **"Supabase"** in the list
3. Click it - it will auto-configure everything correctly
4. Just verify the name is `supabase`

---

## What You Should See

After creating the template, in the template list:
```
Name: supabase
Status: Active ✅
Algorithm: RS256
Type: Custom Template
```

---

## To Verify It Works

After saving, test in browser console:

```javascript
// After signing in
await window.Clerk.session.getToken({ template: 'supabase' })
// Should return a long JWT string starting with "eyJ..."
```

---

## Why No Custom Key Needed?

**The Flow:**
1. User signs in → Clerk issues JWT
2. Clerk signs JWT with **Clerk's private key** (you don't need to provide this)
3. Your app includes JWT in requests to Supabase
4. Supabase verifies JWT using **Clerk's public key** (automatically fetched)
5. RLS policies check the claims

**You only configure WHAT claims to include, not HOW to sign!**

---

## If You're Still Stuck

Try creating the template via Clerk's Supabase integration:
1. Go to **Configure** (or **Integrations**) in Clerk Dashboard
2. Find **Supabase** 
3. Click **"Configure"**
4. It will auto-create the JWT template for you

OR just use the minimal template above and it will work!
