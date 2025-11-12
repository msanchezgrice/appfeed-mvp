# 🎨 POLISH ITEMS - Prioritized Plan

## ✅ EASY WINS (Do First - 30 mins total)

### 1. Remove Like Button from Feed (5 mins) ⭐ EASIEST
**File:** `src/components/TikTokFeedCard.js`  
**Change:** Hide/remove like button from right side  
**Risk:** None - just UI change  
**Test:** Browser MCP  

### 2. Replace AppFeed → Clipcade (10 mins) ⭐ SAFE
**Files:** All components, metadata, text  
**Change:** Find/replace "AppFeed" with "Clipcade"  
**Risk:** None - branding only  
**Test:** grep + Browser MCP  

### 3. Add Loading Animation (5 mins) ⭐ EASY
**File:** `src/components/AppForm.js` or wherever "Run" button is  
**Change:** Show spinner while processing  
**Risk:** None - pure UX enhancement  
**Test:** Browser MCP  

---

## 🎯 MEDIUM TASKS (Do Second - 45 mins total)

### 4. Dynamic OpenGraph per App (20 mins)
**File:** `src/app/app/[id]/page.js`  
**Change:** Generate metadata from app data  
**Risk:** Low - Next.js metadata API  
**Test:** Share app link, check preview  

### 5. Tag Autocomplete in Search (15 mins)
**File:** `src/app/search/page.js`  
**Change:** Show popular tags, expandable list  
**Risk:** Low - just UI enhancement  
**Test:** Browser MCP on search page  

### 6. Verify Nano Banana Images (10 mins)
**Check:** Are apps generating images correctly?  
**Fix:** Re-run image generation if needed  
**Risk:** None - just verification  
**Test:** Supabase CLI + Browser MCP  

---

## 📋 RECOMMENDED ORDER

**Phase 1: Quick Wins (20 mins)**
1. Remove like button
2. Add loading animation
3. Replace AppFeed → Clipcade

**Phase 2: Polish (45 mins)**
4. Dynamic OpenGraph
5. Tag autocomplete
6. Verify images

**Total Time: ~1 hour**

---

## ✅ PROPOSED EXECUTION

**I'll do these one by one:**
1. Make changes
2. Test with Browser MCP
3. Verify with Supabase CLI if needed
4. Commit & push
5. Wait for Vercel deploy
6. Verify on clipcade.com
7. Get your sign-off
8. Move to next item

---

## 🎯 Success Criteria

**After all polish:**
- ✅ No like button in feed
- ✅ "Clipcade" branding everywhere
- ✅ Loading spinners on Run
- ✅ Beautiful OpenGraph per app
- ✅ Tag suggestions in search
- ✅ All images Nano Banana generated

---

## 🚀 READY TO START?

**Say "GO" and I'll:**
1. Start with #1 (Remove like button)
2. Test with Browser MCP
3. Push to GitHub
4. Move through list systematically
5. Complete all 6 items in ~1 hour

**Or adjust priorities if you want different order!**

