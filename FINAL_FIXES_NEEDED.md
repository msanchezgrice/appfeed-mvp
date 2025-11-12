# 🔧 Final Fixes Needed

## Issues Found:

### 1. ❌ Heart/Like Not Saving
**Problem:** TikTokFeedCard uses old `uid()` localStorage function
**Impact:** User not authenticated properly in requests
**Fix:** Update to use Clerk `useUser()` hook

### 2. ❌ Library API Returns 401
**Problem:** Library endpoint requires auth, but TikTokFeedCard sends old x-user-id header
**Impact:** Can't fetch saved apps
**Fix:** Remove x-user-id header, use Clerk session

### 3. ❌ Search Error
**Problem:** Webpack/React error (likely Clerk component issue)
**Fix:** Verify search page imports

### 4. ❌ App Execution Not Working
**Problem:** Runner expects `app.runtime.steps[]` but new apps have simple `runtime` structure
**Impact:** Apps don't execute, sandbox mode shown
**Fix:** Update runner to handle new runtime format OR restructure apps

### 5. ❌ Profile Creation Manual
**Problem:** Webhook not working automatically
**Fix:** Test and fix webhook, or keep manual sync as fallback

---

## Priority Fixes:

### FIX 1: Update TikTokFeedCard to Use Clerk (CRITICAL)
**File:** `/src/components/TikTokFeedCard.js`

**Current (BROKEN):**
```javascript
function uid() { 
  return (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'u_jamie'; 
}

async function api(path, method='GET', body) {
  const res = await fetch(path, {
    method, 
    headers: { 'Content-Type':'application/json', 'x-user-id': uid() }, // ❌ OLD
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}
```

**New (WORKING):**
```javascript
import { useUser } from '@clerk/nextjs';

// Inside component:
const { user } = useUser();

async function api(path, method='GET', body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type':'application/json' },
    credentials: 'include', // ✅ Use Clerk session
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}
```

---

### FIX 2: Update Runner for New App Format
**File:** `/src/lib/runner.js`

**Problem:** Apps now have simple runtime structure:
```json
{
  "model": "gpt-4o-mini",
  "prompt": "...",
  "temperature": 0.7
}
```

But runner expects:
```javascript
app.runtime.steps[0].tool
```

**Solution:** Create adapter or update apps to use steps format

---

### FIX 3: Remove Placeholder Stats in Profile
**File:** `/src/app/profile/page.js`

**Already fixed!** Using real DB data now.

---

## Quick Action Plan:

1. Update TikTokFeedCard.js (most critical)
2. Fix runner.js or app format
3. Test webhook
4. Verify all routes work

Time estimate: 15 minutes
