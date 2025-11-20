# 🧪 Testing Checklist - Share & OG System

## 📍 Deployment Status
**GitHub:** Pushed to `main` branch ✅  
**Vercel:** Deployment in progress... check status at:
- Dashboard: https://vercel.com/dashboard
- Latest deployment: https://appfeed-2t884lqyw-miguel-sanchezgrices-projects.vercel.app

---

## 🎯 **PRIORITY 1: Critical Tests (Do These First)**

### ✅ **Test 1: iOS SMS Share (Most Important!)**
**Why:** This is the #1 viral growth vector

**Steps:**
1. Open Clipcade on iPhone (Safari or Chrome)
2. Go to Feed
3. Try any app (e.g., "Affirmations Daily")
4. Generate a result with an image
5. Click share button (🔗)
6. Tap "SMS" (💬)
7. Send message to yourself (or a test number)
8. **Wait 5-10 seconds** for preview to load
9. ✅ **Verify:**
   - Rich preview appears with image
   - App name shows as title
   - Description is visible
   - Link is tappable
   - Opens to correct result

**Troubleshooting:**
- If no preview: iOS caches OG data - wait 10 mins or use different number
- If broken image: Check `/api/og` endpoint directly
- Check with OpenGraph debugger first

---

### ✅ **Test 2: ShareSheet UI**
**Why:** Core user experience

**Steps:**
1. Open any app in feed
2. Click share button (🔗)
3. ✅ **Verify ShareSheet slides up smoothly**
4. ✅ **Check all platform buttons visible:**
   - 𝕏 Twitter
   - 💬 SMS
   - ✉️ Email
   - 📱 WhatsApp
   - 🎵 TikTok
   - 🔗 Copy Link
5. ✅ **Verify preview card shows:**
   - App name
   - Description
   - Image (if result)
6. ✅ **Tap "Share via..." button**
   - Native share sheet opens
7. ✅ **Tap Cancel**
   - Sheet closes smoothly

**Test on both:**
- Mobile (iOS/Android)
- Desktop

---

### ✅ **Test 3: OG Image API**
**Why:** Everything depends on this working

**Direct API Test:**
```bash
# Test app-only OG image
curl -I https://www.clipcade.com/api/og?app=affirmations-daily&type=app

# Expected: HTTP 200, Content-Type: image/png

# Test result OG image (replace with real runId)
curl -I https://www.clipcade.com/api/og?app=affirmations-daily&run=RUN_ID_HERE&type=result
```

**Browser Test:**
1. Open: `https://www.clipcade.com/api/og?app=affirmations-daily&type=app`
2. ✅ Should see beautiful OG image with:
   - App name as title
   - Description
   - Gradient background or app preview
   - Clipcade branding

---

### ✅ **Test 4: OpenGraph Debugger**
**Why:** Validates all OG tags before real testing

**Steps:**
1. Go to: https://www.opengraph.xyz/
2. Test app-only URL:
   ```
   https://www.clipcade.com/app/affirmations-daily
   ```
3. ✅ **Verify tags present:**
   - `og:title` ✓
   - `og:description` ✓
   - `og:image` ✓
   - `og:image:width` = 1200 ✓
   - `og:image:height` = 630 ✓
   - `og:image:type` = image/png ✓
   - `og:url` ✓
   - `twitter:card` = summary_large_image ✓

4. Test result URL (after generating one):
   ```
   https://www.clipcade.com/app/affirmations-daily?run=RUN_ID
   ```
5. ✅ **Verify:**
   - Title says "Check out my ... result!"
   - Image shows generated output
   - All OG tags present

---

## 🎯 **PRIORITY 2: Platform-Specific Tests**

### ✅ **Test 5: Twitter/X Share**
1. Generate result with image
2. Click share → Twitter
3. ✅ **Verify:**
   - Twitter opens in new window
   - Tweet text pre-filled: "Check out what I made with {app}!"
   - URL included
   - Large image card preview visible
4. Post tweet (optional - just close if testing)
5. If posted, verify tweet shows:
   - Large image
   - Correct title/description
   - Link preview

---

### ✅ **Test 6: WhatsApp Share**
1. Click share → WhatsApp
2. ✅ **Verify:**
   - WhatsApp opens (web or app)
   - Message pre-filled with link
   - Link preview loads with image
3. Send to yourself or close

---

### ✅ **Test 7: Email Share**
1. Click share → Email
2. ✅ **Verify:**
   - Email client opens
   - Subject: "Check out my {app} result!"
   - Body includes link
3. Send to yourself
4. Open email
5. ✅ **Verify link works**

---

### ✅ **Test 8: Copy Link**
1. Click share → Copy Link
2. ✅ **Verify:**
   - Green checkmark (✓) appears
   - Sheet auto-closes after 1.5s
3. Paste in Notes app
4. ✅ **Verify:**
   - Correct URL copied
   - If result, includes both app URL and direct image URL

---

### ✅ **Test 9: Save Image**
*Only appears when result has image*

1. Generate result with image
2. Click share → Save Image
3. ✅ **Verify:**
   - Image downloads to device
   - Filename: `{appId}-{runId}.jpg`
4. Open downloaded image
5. ✅ **Verify it's the correct result**

---

## 🎯 **PRIORITY 3: Both Modes Test**

### ✅ **Test 10: App-Only Share (No Run)**
**Scenario:** User shares app card from feed WITHOUT running it

1. Go to Feed
2. Find any app card
3. Click share button
4. Click SMS
5. Send to yourself
6. ✅ **Verify:**
   - Preview shows app card (NOT a result)
   - Title is app name
   - Description is app description
   - URL is `/app/{id}` (NO ?run= param)
   - OG image shows app preview

---

### ✅ **Test 11: Result Share (With Run)**
**Scenario:** User shares after generating output

1. Run any app with image output
2. Wait for result
3. Click share button
4. Click Twitter
5. ✅ **Verify:**
   - Preview shows result image
   - Title says "Check out my {app} result!"
   - URL includes `?run={id}`
   - OG image shows generated result

---

## 🎯 **PRIORITY 4: Edge Cases**

### ✅ **Test 12: Apps Without Images**
1. Run text-only app (e.g., chat)
2. Click share
3. ✅ **Verify:**
   - ShareSheet shows preview (no image section)
   - "Save Image" button NOT present
   - All other platforms work

---

### ✅ **Test 13: iframe/HTML Bundle Apps**
1. Upload one of the HTML games
2. Play game
3. Click share
4. ✅ **Verify:**
   - ShareSheet opens
   - Preview shows app card
   - All platforms work

---

### ✅ **Test 14: Multiple Shares**
1. Generate result
2. Share via SMS
3. Immediately share via Twitter
4. ✅ **Verify both work without conflicts**

---

### ✅ **Test 15: Mobile Safari vs Chrome**
Test on both browsers:
- Safari (iOS)
- Chrome (iOS)
- Chrome (Android)

✅ **Verify:**
- ShareSheet UI looks correct
- Native share button works
- All platforms function

---

## 🎯 **PRIORITY 5: Analytics Verification**

### ✅ **Test 16: PostHog Event Tracking**
1. Go to PostHog dashboard
2. Navigate to Events
3. Generate result and share via each platform
4. ✅ **Verify events appear:**
   ```
   app_shared: {
     platform: 'twitter|sms|email|whatsapp|tiktok|copy|save|native',
     app_id: '...',
     app_name: '...'
   }
   ```

---

## 🐛 **Known Issues to Watch For**

### Issue 1: iOS iMessage Not Showing Preview
**Symptoms:** SMS sent but no rich preview
**Causes:**
- iOS caches OG data (wait 10 minutes)
- OG image not loading (check `/api/og`)
- Missing og:image:width/height tags

**Fix:**
1. Check OpenGraph debugger first
2. Wait 10 minutes and resend
3. Try different phone number

---

### Issue 2: ShareSheet Not Closing
**Symptoms:** Sheet stays open after action
**Causes:**
- Platform handler error
- Timeout not firing

**Fix:**
- Check browser console for errors
- Try clicking Cancel button

---

### Issue 3: OG Image Shows Wrong Content
**Symptoms:** Image shows app when should show result (or vice versa)
**Causes:**
- Wrong `type` param in OG URL
- Run data not fetching correctly

**Fix:**
1. Check URL params: `/api/og?app={id}&run={id}&type=result`
2. Verify run exists in database
3. Check API logs

---

## 📱 **Test Devices**

### Minimum Test Coverage:
- ✅ iPhone (Safari) - **REQUIRED**
- ✅ iPhone (Chrome)
- ✅ Android (Chrome)
- ✅ Desktop (Chrome)
- ✅ Desktop (Safari)

---

## ✅ **Quick Test Script**

**5-Minute Smoke Test:**
1. ✅ Open `/api/og?app=affirmations-daily&type=app` → Should show image
2. ✅ Run Affirmations Daily → Generate result
3. ✅ Click share → ShareSheet opens
4. ✅ Click Copy Link → Shows checkmark
5. ✅ Paste in OpenGraph debugger → All tags present
6. ✅ Share via SMS → Send to yourself → Wait for preview
7. ✅ DONE!

If all 7 pass, system is working ✅

---

## 📊 **Success Metrics**

After 24 hours, check:
- Share button click rate (should increase)
- SMS shares (track in PostHog)
- Click-through rate on shared links
- Sign-up conversion from shares

---

## 🆘 **If Something Breaks**

### Step 1: Check Build Logs
```bash
vercel logs
```

### Step 2: Check API Endpoint
```bash
curl https://www.clipcade.com/api/og?app=test&type=app
```

### Step 3: Verify Package Installed
```bash
npm list @vercel/og
```

### Step 4: Check Vercel Edge Function
- Go to Vercel Dashboard
- Check Functions tab
- Verify `/api/og` is deployed as Edge Function

### Step 5: Rollback if Needed
```bash
git revert HEAD
git push origin main
```

---

## 🎯 **What to Focus On**

**Most Important:**
1. iOS SMS rich previews (90% of viral growth)
2. ShareSheet UI/UX (user experience)
3. OG images loading correctly
4. Both modes working (app vs result)

**Less Critical:**
- Individual platform quirks
- Desktop experience
- Edge cases

---

## 📝 **Report Template**

After testing, report:

```
✅ iOS SMS: PASS / FAIL
✅ ShareSheet UI: PASS / FAIL
✅ OG Images: PASS / FAIL
✅ Twitter Share: PASS / FAIL
✅ Both Modes: PASS / FAIL

Issues Found:
- [List any issues]

Recommendations:
- [Any suggestions]
```

---

## 🚀 **Ready to Test!**

Start with Priority 1 tests, especially iOS SMS. That's the most important for viral growth!

Good luck! 🍀
