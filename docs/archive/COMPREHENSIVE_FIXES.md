# 🔧 Comprehensive Fixes Required

## Issues Found:

### 1. ❌ **Library Save Failing**
**Error:** `new row violates row-level security policy for table "library_saves"`

**Cause:** RLS policies expecting Clerk JWT, but we're using anonymous Supabase key

**Fix:** Run `/supabase/FIX_RLS_AND_FUNCTIONS.sql` in Supabase SQL Editor

---

### 2. ❌ **TikTokFeedCard Using Old Auth**
**Problem:** Still using `localStorage.getItem('uid')` instead of Clerk

**Fix:** Update TikTokFeedCard.js to use Clerk `useUser()` hook

---

### 3. ❌ **Missing Database Function**
**Error:** `track_app_event` function doesn't exist

**Fix:** Create the function (included in FIX_RLS_AND_FUNCTIONS.sql)

---

### 4. ❌ **Search Page Error** 
**Problem:** Likely trying to access undefined `tags` array

**Fix:** Add null checks in search page

---

### 5. ❌ **Apps Need Real Prompts**
**Problem:** Sample apps have basic prompts, not functional

**Fix:** Create new seed data with working app configurations

---

## 🎯 Action Plan (In Order):

### Step 1: Fix Database (CRITICAL)
```bash
# Go to Supabase Dashboard
# https://supabase.com/dashboard/project/lobodzhfgojceqfvgcit

# SQL Editor → New query
# Copy ALL content from: /supabase/FIX_RLS_AND_FUNCTIONS.sql
# Click Run
```

**This fixes:**
- ✅ Library save RLS policy
- ✅ Adds `track_app_event` function
- ✅ Fixes analytics tracking

---

### Step 2: Update TikTokFeedCard
**File:** `/src/components/TikTokFeedCard.js`

**Changes:**
1. Remove `uid()` function
2. Add `useUser()` from Clerk
3. Update API calls to not send `x-user-id` header (server will get it from Clerk session)

---

### Step 3: Fix Search Page
**File:** `/src/app/search/page.js`

**Add null check:**
```javascript
const matchesTag = !selectedTag || app.tags?.includes(selectedTag);
```
(Already has it, but verify it's not throwing elsewhere)

---

### Step 4: Create Working Sample Apps
**New file:** `/supabase/seed_working_apps.sql`

With:
- Real OpenAI prompts
- Proper input/output schemas
- Functional tools (if needed)

---

### Step 5: Test All Routes
After fixes, test:
- ✅ Feed loads
- ✅ Search works
- ✅ Save to library works
- ✅ Profile shows saved apps
- ✅ Apps can be executed

---

## 📋 Quick Checklist:

- [ ] Run FIX_RLS_AND_FUNCTIONS.sql in Supabase
- [ ] Verify functions created (check SQL output)
- [ ] Update TikTokFeedCard.js (remove localStorage uid)
- [ ] Create new seed data with working apps
- [ ] Test library save functionality
- [ ] Test search page
- [ ] Test app execution

---

## 🚨 Priority Order:

1. **CRITICAL:** Fix RLS policies (blocks all saves)
2. **CRITICAL:** Fix TikTokFeedCard auth (using old system)
3. **HIGH:** Add working sample apps
4. **MEDIUM:** Fix search errors
5. **LOW:** Optimize and polish

---

**Start with Step 1 - Run the SQL fix!** That will unblock most issues.
