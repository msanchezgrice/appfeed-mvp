# 🔑 Required Environment Variables for Creator Analytics

Add these to your `.env.local` file:

```bash
# =====================================================
# PostHog Analytics API (REQUIRED for Creator Analytics)
# =====================================================

# Project API Key - Get from: https://app.posthog.com/settings/project
# Look for "Project API Key" section, copy the key that starts with phc_
POSTHOG_PROJECT_API_KEY=phc_your_project_key_here

# Personal API Key - Get from: https://app.posthog.com/settings/user
# Click "Personal API Keys" → "Create Personal API Key"
# Give it a name like "AppFeed Analytics" and copy the key that starts with phx_
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key_here
```

## ⚠️ Important Notes

1. **Both keys are required** - The analytics dashboard won't work without them
2. **Server-side only** - These keys are never exposed to the client
3. **Restart required** - Restart your dev server after adding these
4. **Keep them secret** - Don't commit `.env.local` to git (it's in `.gitignore`)

## 🔍 How to Get These Keys

### Step 1: Project API Key

1. Go to https://app.posthog.com
2. Click **Settings** (gear icon)
3. Select **Project** 
4. Scroll to **Project API Key** section
5. Copy the key (format: `phc_xxxxx...`)

### Step 2: Personal API Key

1. Still in PostHog, click **Settings**
2. Select **User** (your user settings, not project)
3. Find **Personal API Keys** section
4. Click **Create Personal API Key**
5. Enter a label: "AppFeed Creator Analytics"
6. Click **Create**
7. **Copy the key immediately** (you can't see it again!)
8. Format: `phx_xxxxx...`

## ✅ Verify Setup

After adding the keys and restarting:

```bash
# In your terminal
cd /Users/miguel/Desktop/appfeed-mvp
npm run dev
```

Then test:
1. Visit your profile: http://localhost:3000/profile/YOUR_USER_ID
2. Click "📊 View Analytics"
3. You should see the analytics dashboard load

If you see "Analytics Unavailable" error, check:
- Keys are correctly copy-pasted (no extra spaces)
- Both keys are present
- Dev server was restarted after adding keys
- Keys are from the correct PostHog project

## 🎯 Quick Test Command

Run this in your browser console on the analytics page to check if keys are working:

```javascript
fetch('/api/me/analytics?days=7')
  .then(r => r.json())
  .then(data => console.log('Analytics data:', data))
  .catch(err => console.error('Error:', err));
```

If you get data back, setup is correct! ✅


