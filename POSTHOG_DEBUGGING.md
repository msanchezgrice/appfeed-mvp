# PostHog Not Sending Events - Debugging Guide

## ✅ Confirmed: Code is Deployed

All PostHog code from commits 91b6e55, a61551c, and bb3ab30 IS deployed to production.

**Evidence:**
- `PostHogProvider` found in deployed HTML
- Reverse proxy code in `next.config.js` 
- All commits are on origin/main

---

## 🔍 Why You Don't See `/ingest/batch` Requests

### Most Likely Cause: Vercel Didn't Pick Up Environment Variable

When you add environment variables in Vercel, you need to:

1. ✅ Add the variable (you did this)
2. ❌ **Redeploy the app** (Vercel doesn't auto-redeploy)

**Solution:** Force a redeploy in Vercel Dashboard

---

## 📋 Step-by-Step Debugging

### Step 1: Verify Environment Variable is Set

**Go to:** Vercel Dashboard → appfeed-mvp → Settings → Environment Variables

**Check:**
- ✅ Variable name: `NEXT_PUBLIC_POSTHOG_KEY`
- ✅ Value: `phc_1q3kOHxBsN7Yu3gUehDc1ChAraAfXbxdJ8uGRXX6woT`
- ✅ Environments: Production ✓, Preview ✓, Development ✓ (all checked)

### Step 2: Force Redeploy

**Option A: Via Vercel Dashboard**
1. Go to Vercel Dashboard → appfeed-mvp → Deployments
2. Click on the latest deployment
3. Click "..." menu → "Redeploy"
4. Select "Use existing Build Cache" (faster)
5. Click "Redeploy"

**Option B: Via Git Push (I can do this for you)**
```bash
git commit --allow-empty -m "Redeploy to pick up PostHog env var"
git push origin main
```

### Step 3: Verify PostHog Loads

After redeploying, visit https://www.clipcade.com and:

1. **Open DevTools:** F12
2. **Console tab:** Look for:
   ```
   [PostHog] Initialized successfully
   ```
3. **Network tab:** Filter by "ingest"
   - You should see: `POST /ingest/batch`
   - You should see: `POST /ingest/decide`

### Step 4: Check for Errors

**If you DON'T see PostHog in console:**

1. **Check for errors:** Look for red errors in Console
2. **Check env var:** In Console, type:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_POSTHOG_KEY)
   ```
   - Should show: `phc_1q3kOHxBsN7Yu3gUehDc1ChAraAfXbxdJ8uGRXX6woT`
   - If undefined: Env var not loaded (need to redeploy)

3. **Check PostHog object:** In Console, type:
   ```javascript
   window.posthog
   ```
   - Should show: PostHog object
   - If undefined: PostHog didn't initialize

---

## 🐛 Common Issues & Fixes

### Issue 1: Env Var Shows Undefined

**Problem:** Vercel hasn't redeployed with new env var

**Fix:** Redeploy the app (see Step 2 above)

### Issue 2: CORS or Network Errors

**Problem:** Reverse proxy not working

**Fix:** Check `next.config.js` has the rewrites (it does)

### Issue 3: PostHog Object Exists But No Requests

**Problem:** Events aren't being triggered

**Fix:** 
1. Navigate to a different page (should trigger pageview)
2. View an app (should trigger app_viewed)
3. Click "Run" on an app (should trigger app_tried)

### Issue 4: 403/401 Errors on /ingest

**Problem:** API key invalid or not sent

**Fix:** Verify API key in Vercel env vars matches PostHog project

---

## ✅ What You Should See When Working

### In Browser Console (F12 → Console):
```
[PostHog] Initialized successfully
```

### In Network Tab (F12 → Network → Filter: "ingest"):
```
POST /ingest/batch         200 OK
POST /ingest/decide        200 OK  
GET  /ingest/static/...    200 OK
```

### In PostHog Dashboard:
Live Events showing up: https://us.posthog.com/project/251302/events

---

## 🚀 Quick Fix Commands

Want me to trigger a redeploy for you? I can run:

```bash
cd /Users/miguel/Desktop/appfeed-mvp
git commit --allow-empty -m "Redeploy to pick up PostHog env var"
git push origin main
```

This will force Vercel to redeploy with the environment variable loaded.

---

## 📞 If Still Not Working

1. Screenshot the Console tab (showing any errors)
2. Screenshot the Network tab (filtered by "ingest")
3. Screenshot Vercel environment variables page
4. Share with me and I'll debug further

---

**Most likely you just need to redeploy!** Vercel doesn't auto-redeploy when you change env vars.

