# 🔍 iMessage Result Image Debug Guide

## 🚀 Latest Fix Deployed
**Commit:** `ae20efd` - Enhanced OG API logging + fallback

---

## 🧪 Test Steps (5 minutes)

### **Step 1: Generate a Result**
```
1. Go to: https://www.clipcade.com/app/affirmations-daily
2. Click "Try"
3. Fill form and submit
4. Wait for result with image to appear
5. Copy the URL from browser (includes ?run=...)
```

---

### **Step 2: Check Vercel Logs** ⭐ MOST IMPORTANT
```bash
# In terminal, run:
vercel logs --prod --since 2m | grep "OG"

# You should see output like:
[OG] Fetching run data for: { runId: 'abc123', appId: 'affirmations-daily' }
[OG] Run fetched successfully: {
  runId: 'abc123',
  hasRun: true,
  hasAssetUrl: true,  ← ⭐ THIS MUST BE TRUE
  hasOutputs: true,
  outputKeys: [ 'markdown', 'image' ],
  assetUrl: 'https://lobodzhfgojceqfvgcit.supabase.co/storage...'
}
[OG] Using asset_url from run
```

---

### **Step 3: Interpret the Logs**

#### ✅ **GOOD - Image Should Work:**
```
hasAssetUrl: true
assetUrl: 'https://lobodzhfgojceqfvgcit.supabase.co/storage/...'
[OG] Using asset_url from run
```
**Action:** Share via SMS and wait 30 seconds for preview

---

#### ⚠️ **FALLBACK - Might Work:**
```
hasAssetUrl: false
hasOutputs: true
outputKeys: [ 'image' ]
[OG] Using image from outputs (data URL)
```
**Meaning:** No asset_url saved, but found image in outputs
**Action:** Test SMS, but image might not load (data URLs can be too large)

---

#### ❌ **BAD - Won't Show Image:**
```
hasAssetUrl: false
hasOutputs: false
[OG] No image found for run
```
**Meaning:** Run has no image data at all
**Root cause:** `/api/runs` didn't save the image properly

---

### **Step 4: Test SMS Share**
```
1. Click share button
2. Select SMS
3. Send to yourself
4. Wait 30 seconds (iOS needs time to fetch OG data)
5. Check if preview shows result image
```

**If preview doesn't show:**
- iOS cached old data (wait 10 mins or try different number)
- Check OpenGraph debugger: https://www.opengraph.xyz/

---

### **Step 5: Verify with OpenGraph Debugger**
```
1. Go to: https://www.opengraph.xyz/
2. Paste your share URL:
   https://www.clipcade.com/app/affirmations-daily?run=YOUR_RUN_ID
3. Check:
   ✅ og:image tag present
   ✅ Image URL points to /api/og?app=...&run=...&type=result
   ✅ Image loads when clicked
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: `hasAssetUrl: false`**
**Meaning:** Run exists but no asset_url was saved

**Debug:**
```sql
-- Check Supabase directly:
SELECT id, asset_url, asset_type, outputs 
FROM runs 
WHERE id = 'YOUR_RUN_ID';
```

**If asset_url is NULL:**
- Image wasn't uploaded to Supabase Storage
- Issue is in `/api/runs` route (POST handler)
- Check if image processing code is running

**Fix Required:**
- Verify Supabase Storage bucket exists
- Check environment variables for Supabase
- Review `/api/runs` logs for upload errors

---

### **Issue 2: `[OG] Run fetch failed`**
**Meaning:** OG API can't fetch the run from database

**Debug:**
```bash
# Test run API directly:
curl "https://www.clipcade.com/api/runs?id=YOUR_RUN_ID"

# Should return run data with asset_url
```

**If fails:**
- Run doesn't exist in database
- Run ID is wrong
- API has authentication issues

---

### **Issue 3: Image in Outputs But No Asset URL**
**Logs show:**
```
hasAssetUrl: false
outputKeys: [ 'image' ]
[OG] Using image from outputs (data URL)
```

**Why this happens:**
- Run executed successfully
- Image exists in outputs as data:image/... string
- But image wasn't uploaded to storage

**Impact:**
- OG API will try to use the data URL
- **This may not work** - data URLs in og:image are unreliable
- iMessage/WhatsApp may reject large data URLs

**Fix Required:**
- Need to investigate why `/api/runs` isn't uploading images
- Check storage bucket permissions
- Check if upload code is being executed

---

### **Issue 4: iOS Not Showing Preview**
**Even though logs look good:**
```
hasAssetUrl: true
[OG] Using asset_url from run
```

**Possible Causes:**
1. **iOS Cache** (most common)
   - iOS caches OG data for 10-15 minutes
   - Solution: Wait or try different number

2. **Image Load Time**
   - OG API is slow to generate
   - iOS timeout before image loads
   - Solution: Optimize OG API performance

3. **Image Format Issues**
   - Image isn't valid PNG/JPEG
   - Solution: Check asset_url directly in browser

4. **URL Structure**
   - Some SMS apps have issues with certain URLs
   - Solution: Test with OpenGraph debugger first

---

## 🔧 Quick Diagnostic Commands

### **Check if OG API is working:**
```bash
curl -I "https://www.clipcade.com/api/og?app=affirmations-daily&run=YOUR_RUN_ID&type=result"

# Should return:
HTTP/2 200
content-type: image/png
```

### **Check if run has asset_url:**
```bash
curl "https://www.clipcade.com/api/runs?id=YOUR_RUN_ID" | jq '.run.asset_url'

# Should return a URL or null
```

### **Watch logs live:**
```bash
vercel logs --prod --follow | grep -E "(OG|asset_url|Run data)"
```

---

## 📊 What the New Logs Tell You

### **Complete Flow:**
```
1. User shares result
2. SMS includes: https://www.clipcade.com/app/X?run=Y
3. iOS/WhatsApp fetches that URL to get OG tags
4. Server returns metadata with og:image pointing to /api/og?app=X&run=Y&type=result
5. iOS/WhatsApp fetches /api/og endpoint
6. OG API logs appear in Vercel:
   [OG] Fetching run data for: { runId: 'Y', appId: 'X' }
   [OG] Run fetched successfully: { hasAssetUrl: true, ... }
   [OG] Using asset_url from run
7. OG API generates image with result
8. iOS/WhatsApp displays preview with image
```

### **Log Meanings:**
- `[OG] Fetching run data` → OG API was called
- `hasAssetUrl: true` → Image was uploaded to storage ✅
- `hasAssetUrl: false, hasOutputs: true` → Image in outputs, using fallback ⚠️
- `hasAssetUrl: false, hasOutputs: false` → No image data ❌
- `[OG] Using asset_url` → Best case, should work
- `[OG] Using image from outputs` → Fallback, might not work
- `[OG] No image found` → Will only show app preview

---

## ✅ Success Checklist

After testing, you should see:

```
✅ Vercel logs show: hasAssetUrl: true
✅ Vercel logs show: [OG] Using asset_url from run
✅ OpenGraph debugger shows image
✅ Image URL loads in browser
✅ SMS preview shows result image (wait 30s)
✅ Link opens app page (not direct asset)
```

---

## 🆘 Next Steps Based on Results

### **If hasAssetUrl: true but SMS preview doesn't show:**
→ iOS cache issue. Wait 10 minutes or test with different number.

### **If hasAssetUrl: false:**
→ Need to fix `/api/runs` to upload images to storage. This is the root issue.

### **If OG API returns 500 error:**
→ Check full Vercel logs for stack trace. Likely image processing issue.

### **If runs API returns 404:**
→ Run doesn't exist. Check if run ID is correct.

---

## 🔬 Advanced Debugging

### **Test the full chain:**
```bash
# 1. Create a run
curl -X POST https://www.clipcade.com/api/runs \
  -H "Content-Type: application/json" \
  -d '{"appId":"affirmations-daily","inputs":{"mood":"happy"},"mode":"try"}'

# Note the run ID from response

# 2. Check run data
curl "https://www.clipcade.com/api/runs?id=RUN_ID_HERE"

# 3. Test OG API
curl "https://www.clipcade.com/api/og?app=affirmations-daily&run=RUN_ID_HERE&type=result" -o test-og.png

# 4. Open test-og.png to see the generated image
open test-og.png
```

---

## 📝 Report Template

After testing, report findings:

```
### Test Results:

**Vercel Logs:**
- hasAssetUrl: [true/false]
- hasOutputs: [true/false]
- Using: [asset_url / outputs / app preview]

**OpenGraph Debugger:**
- og:image present: [yes/no]
- Image loads: [yes/no]
- Image URL: [url]

**SMS Test:**
- Preview appears: [yes/no]
- Time waited: [seconds]
- iOS version: [version]

**Conclusion:**
[Describe if it works or what the issue is]
```

---

Ready to test! Start with Step 2 (check logs) - that will tell you immediately if the issue is with image upload or just iOS caching. 🔍
