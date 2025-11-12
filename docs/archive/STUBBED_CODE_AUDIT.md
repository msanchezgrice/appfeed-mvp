# 📋 Stubbed & TODO Code Audit

## Summary
**Total Files with Stubs:** 6  
**Status:** Most "stubs" are intentional fallbacks, not unfinished code

---

## 🔍 Detailed Analysis

### 1. `lib/tools.js` - LLM Stub Output
**Location:** Line 25  
**Type:** ✅ **Intentional Fallback** (Not a bug)

```javascript
if (!apiKey) {
  return {
    output: `• I choose to believe in myself.\n• I can take one small step.\n• I am enough. (stubbed — add your OpenAI key on /secrets)`,
    usedStub: true
  };
}
```

**Purpose:** Returns friendly stub data when user hasn't added API key  
**Status:** ✅ **KEEP THIS** - It's correct UX behavior  
**Action:** None needed

**Also at line 47:**
```javascript
return { output: `LLM error: ${t.slice(0,180)}`, usedStub: true };
```
**Purpose:** Error handling for failed API calls  
**Status:** ✅ **KEEP THIS**

---

### 2. `lib/runner.js` - UsedStub Tracking
**Location:** Line 39  
**Type:** ✅ **Intentional Feature**

```javascript
trace[i] = { ...trace[i], status:'ok', output: res.output, usedStub: res.usedStub || false };
```

**Purpose:** Tracks whether stub data was used (for debugging/UX)  
**Status:** ✅ **KEEP THIS** - Useful for users to know when real API is used  
**Action:** None needed

---

### 3. `components/RunTrace.js` - Stub Indicator
**Location:** Line 21  
**Type:** ✅ **Intentional UX**

```javascript
{step.usedStub ? <div className="small">⚠️ used stub output (no key)</div> : null}
```

**Purpose:** Shows visual indicator when stub data is used  
**Status:** ✅ **KEEP THIS** - Good UX to inform users  
**Action:** None needed

---

### 4. `lib/db.js` - Old File-Based System
**Location:** Multiple references  
**Type:** ⚠️ **DEPRECATED** (No longer used)

**Functions Found:**
- `getSecret()` - Old file-based secret retrieval
- `addSecret()` - Old file-based secret storage
- `listSecrets()` - Old file-based secret listing

**Status:** ⚠️ **CAN BE REMOVED** - Now using Supabase encryption  
**Action:** Delete these functions (not currently called)

---

### 5. `lib/seed.js` - Seed Data Generator
**Location:** Entire file  
**Type:** ✅ **Development Tool**

**Purpose:** Generates initial test data for database  
**Status:** ✅ **KEEP THIS** - Useful for development/testing  
**Action:** None needed (it's a seed script, not production code)

---

### 6. `components/AppOutput.js` - Output Display
**Location:** No actual stubs found  
**Type:** ✅ **Clean Code**

Just displays app execution results. No stub code detected.

---

## 📊 Analytics - Real vs Placeholder

### Current Implementation: ✅ **ALL REAL DATA**

The analytics in profile/page.js are NOT using placeholder data! They're calculated from actual database values:

```javascript
// Lines 67-73
const userApps = appsData.apps.filter(app => app.creator_id === userId);
const totalViews = userApps.reduce((sum, app) => sum + (app.view_count || 0), 0);
const totalTries = userApps.reduce((sum, app) => sum + (app.try_count || 0), 0);
const totalUses = userApps.reduce((sum, app) => sum + (app.use_count || 0), 0);
const totalSaves = userApps.reduce((sum, app) => sum + (app.save_count || 0), 0);
const totalRemixes = userApps.reduce((sum, app) => sum + (app.remix_count || 0), 0);
```

**Data Source:** Database columns on `apps` table
- `view_count`
- `try_count`
- `use_count`
- `save_count`
- `remix_count`

**Status:** ✅ **ALREADY INSTRUMENTED**

---

## 🎯 What Needs Instrumentation

### Missing: View Count Tracking
**Location:** Apps table has `view_count` column but no tracking code

**Where to Add:**
1. In `/app/[id]/page.js` - Track when app page is viewed
2. In feed cards - Track when app card is viewed

**Implementation Needed:**
```javascript
// Example:
useEffect(() => {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      appId: app.id,
      eventType: 'view'
    })
  });
}, [app.id]);
```

### Missing: Try/Use/Save Count Updates
**Location:** Counts exist in database but may not be incrementing

**Current Status:**
- `/api/runs` saves run to database ✅
- But doesn't increment `try_count` or `use_count` on apps table ❌

**Fix Needed:**
```javascript
// In /api/runs route.js after saving run:
if (mode === 'try') {
  await supabase.rpc('increment_try_count', { p_app_id: app.id });
} else if (mode === 'use') {
  await supabase.rpc('increment_use_count', { p_app_id: app.id });
}
```

---

## 📝 Complete Stub/TODO List

### Intentional Stubs (✅ Keep)
1. **LLM stub output** - `lib/tools.js:25` - Returns friendly message when no API key
2. **UsedStub flag** - `lib/runner.js:39` - Tracks stub usage
3. **Stub indicator** - `components/RunTrace.js:21` - Shows ⚠️ when stub used
4. **Seed data** - `lib/seed.js` - Development tool

### Deprecated Code (⚠️ Can Remove)
5. **File-based secrets** - `lib/db.js` - Old system (replaced with Supabase)
   - `getSecret()`
   - `addSecret()`
   - `listSecrets()`

### Missing Instrumentation (❌ Add)
6. **View count tracking** - Need to implement
7. **Try/Use count increments** - Need to implement
8. **Save count increments** - Need to implement
9. **Remix count increments** - Need to implement

---

## 🔧 Recommended Actions

### Immediate (Required for Analytics)
1. ✅ Create analytics instrumentation functions
2. ✅ Add view tracking to app pages
3. ✅ Increment try/use counts in `/api/runs`
4. ✅ Increment save count in `/api/library`
5. ✅ Increment remix count in `/api/remix`

### Optional (Code Cleanup)
6. Remove old file-based secret functions from `lib/db.js`
7. Remove unused imports
8. Clean up commented code

### Keep As-Is (Intentional)
- Stub output when no API key (good UX)
- UsedStub tracking (helpful for debugging)
- Seed data script (useful for dev)

---

## 💡 Key Insight

**Most "stubs" are NOT bugs - they're intentional fallback behavior!**

The real missing piece is **analytics event tracking** to increment the counters in the database. The display code is already using real database values - we just need to populate those values by tracking events.

---

## Next Steps

See `ANALYTICS_INSTRUMENTATION_PLAN.md` for detailed implementation guide.

