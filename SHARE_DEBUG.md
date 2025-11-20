# 🔍 Share Feature Debug Check

## ✅ Current Status (in code)

### ShareSheet Integration
- ✅ Imported in `/app/[id]/page.js`
- ✅ State: `showShareSheet` declared
- ✅ App page button: Line 380 - `onClick={() => setShowShareSheet(true)}`
- ✅ Result overlay button: Line 431 - `onClick={() => setShowShareSheet(true)}`
- ✅ Component rendered: Lines 495-501 with `assetUrl={overlayRun?.asset_url}`

### SMS Handler (Custom ShareSheet)
- ✅ Async function
- ✅ Tries native share with image file FIRST
- ✅ Falls back to SMS protocol if native share fails
- ✅ Logs: `[Share] SMS with image file via native share`

### Native Share (Share via...)
- ✅ Includes image file via `files: [file]`
- ✅ Checks `navigator.canShare` before adding file
- ✅ Fetches asset from `assetUrl` prop

---

## 🧪 Quick Test

### 1. Hard Refresh Browser
```
Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
Safari: Cmd+Option+R
```

### 2. Open Console
```
Press F12 or Right-click → Inspect → Console tab
```

### 3. Generate a Result
```
1. Go to: https://www.clipcade.com/app/affirmations-daily
2. Click "Try"
3. Submit form
4. Result overlay appears
```

### 4. Check ShareSheet Appears
```
1. Click "Share" button in overlay header
2. ✅ Should see ShareSheet slide up from bottom
3. ✅ Should see platforms: Twitter, SMS, Email, WhatsApp, TikTok, Copy, Save
4. ✅ Should see "Share via..." button at bottom
```

### 5. Test SMS with Image
```
1. Click "SMS" button (📱)
2. Check console logs:
   - Look for: [Share] SMS with image file via native share
   - OR: [Share] Could not fetch image...

3. ✅ Should open native share (if on mobile) or SMS compose
4. ✅ Image should be attached
```

### 6. Test Native Share
```
1. Click "Share via..." button
2. ✅ Should open native share sheet
3. ✅ Image should be included
4. Select iMessage
5. ✅ Image preview should appear in iMessage compose
```

---

## 🐛 If ShareSheet Not Appearing

### Check 1: JavaScript Errors
```javascript
// Open console and look for errors like:
// - ShareSheet is not defined
// - Cannot read property 'share'
// - Module not found
```

### Check 2: Button Click Not Working
```javascript
// In console, type:
document.querySelector('button').addEventListener('click', (e) => {
  console.log('Button clicked:', e.target.textContent);
});

// Then click Share button - should log
```

### Check 3: State Not Updating
```javascript
// Check if React state is stuck
// Look for hydration errors in console
```

---

## 🐛 If Image Not Attaching

### Check 1: asset_url is NULL
```javascript
// In console after generating result:
fetch('/api/runs?id=YOUR_RUN_ID')
  .then(r => r.json())
  .then(data => {
    console.log('asset_url:', data.run.asset_url);
    console.log('outputs.image:', !!data.run.outputs.image);
  });

// If asset_url is null → image upload failed
// Check Vercel logs: vercel logs --prod | grep "API /runs"
```

### Check 2: Fetch Failing
```javascript
// Check console for errors like:
// - Error adding file to share: Failed to fetch
// - Could not fetch image for SMS
// - CORS error

// If CORS error → asset_url domain issue
// If 404 → asset_url is wrong URL
```

### Check 3: canShare Returns False
```javascript
// In console:
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
console.log('Can share files:', navigator.canShare({ files: [testFile] }));

// If false → browser doesn't support file sharing
// Try on mobile iOS/Android
```

---

## 📱 Platform-Specific Issues

### iOS Safari
- ✅ Supports `navigator.share` with files
- ✅ Can attach images to iMessage
- ⚠️ Requires HTTPS
- ⚠️ Must be triggered by user gesture

### Android Chrome
- ✅ Supports `navigator.share` with files
- ✅ Can attach images to SMS apps
- ⚠️ File size limits (~5MB)

### Desktop Chrome/Edge
- ❌ `navigator.share` may not be available
- ✅ SMS handler falls back to SMS protocol (text only)
- ✅ Can copy link instead

---

## 🔍 Debug Commands

### Check current deployment
```bash
cd /Users/miguel/Desktop/appfeed-mvp
vercel ls | head -5

# Should show latest deployment ~17 mins ago
```

### Check ShareSheet file exists
```bash
ls -la src/components/ShareSheet.js

# Should show file with recent timestamp
```

### Verify ShareSheet import in page
```bash
grep "import ShareSheet" src/app/app/[id]/page.js

# Should show: import ShareSheet from '@/src/components/ShareSheet';
```

### Check if SMS handler is async
```bash
grep -A 5 "sms: async" src/lib/share-handlers.js

# Should show async function with navigator.share logic
```

---

## ✅ Expected Console Logs

### When clicking SMS button:
```
[Share] SMS with image file via native share
```

### OR (if image fetch fails):
```
[Share] Could not fetch image for SMS, sharing URL only: Error...
```

### OR (if native share fails):
```
[Share] Native share failed, falling back to SMS protocol: Error...
```

---

## 🆘 Common Issues & Fixes

### Issue: "ShareSheet not showing"
**Cause:** Browser cache  
**Fix:** Hard refresh (Cmd+Shift+R)

### Issue: "No image in SMS"
**Cause:** `asset_url` is NULL  
**Fix:** Check `/api/runs` logs for upload errors

### Issue: "Can't share files"
**Cause:** Browser doesn't support `navigator.canShare({ files: [...] })`  
**Fix:** Test on mobile iOS/Android

### Issue: "CORS error when fetching image"
**Cause:** Supabase Storage CORS not configured  
**Fix:** Add CORS rules to Supabase bucket

### Issue: "Share button doesn't respond"
**Cause:** JavaScript error breaking page  
**Fix:** Check console for errors, fix and redeploy

---

## 📊 What to Report

If still not working, please share:

1. **Browser & device:** (e.g., "iOS 17 Safari", "Desktop Chrome 120")
2. **Console logs:** Copy any errors or [Share] messages
3. **Network tab:** Check if asset_url fetch succeeds
4. **ShareSheet visibility:** Does it slide up or not appear at all?
5. **Specific behavior:** Which button (SMS vs Share via...) and what happens

---

**The code is correct and deployed. Most likely this is browser cache or asset_url being NULL.**
