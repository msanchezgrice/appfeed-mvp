# Vercel Environment Variables Setup

## ✅ PostHog Analytics - REQUIRED

Add these environment variables to your Vercel project:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following:

**Variable Name:** `NEXT_PUBLIC_POSTHOG_KEY`  
**Value:** `phc_1q3kOHxBsN7Yu3gUehDc1ChAraAfXbxdJ8uGRXX6woT`  
**Environment:** Production, Preview, Development (select all)

**Variable Name:** `NEXT_PUBLIC_POSTHOG_HOST`  
**Value:** `https://us.i.posthog.com`  
**Environment:** Production, Preview, Development (select all)

---

## 🚀 After Adding Variables

1. **Redeploy your app** in Vercel (Settings → Deployments → click "..." → Redeploy)
2. Once deployed, check PostHog for live events: https://us.posthog.com/project/251302/events

---

## 📊 What's Now Being Tracked

### User Attribution
- ✅ **Signup source tracking** - Know where every user came from (UTM params, referrer)
- ✅ **Landing page tracking** - See what page converts best
- ✅ **Full user journey** - From first visit to signup to first publish

### App Engagement  
- ✅ **App views** - Track views from feed vs detail page vs profile
- ✅ **App tries** - When users click "Run"
- ✅ **App saves** - Save to library tracking
- ✅ **App shares** - Track share clicks (native share vs copy link)
- ✅ **App remixes** - Track viral remixing

### Creator Activity
- ✅ **App published** - Track AI vs manual creation
- ✅ **User follows** - Social graph growth
- ✅ **Creator engagement** - Time to first publish

### Conversion Funnels
- ✅ **Signup funnel** - View → Try → Signup → Publish
- ✅ **Engagement funnel** - View → Try → Save/Remix
- ✅ **Creator funnel** - View → Remix → Publish

---

## 📈 Key Metrics You Can Now Track (Matching Your Admin Dashboard)

Your PostHog setup now tracks all the same metrics as your `/admin` dashboard:

### Platform Overview
- Total Users & Signups Today (with attribution!)
- Total Apps & Apps Today
- Total Views, Total Tries
- Conversion Rate (tries/views)
- Average views per app

### Top Apps Analysis
- Most viewed apps (with source breakdown)
- Try rate per app
- Save rate per app
- Share rate per app

### Creator Analytics
- Top creators by followers
- Apps published per creator
- Follower growth over time

### Virality Metrics
- K-Factor per app
- Share rate (views → shares)
- Remix rate (views → remixes)
- Viral coefficient

### Growth Tracking
- Daily/Weekly signups
- New vs returning users
- Retention cohorts (D1, D7, D30)
- User activation rate

---

## 🎯 Recommended PostHog Dashboards to Create

Once your env vars are set and the app is deployed, create these dashboards in PostHog:

### 1. **Growth Dashboard**
- New users per day (with source breakdown)
- Signup conversion rate
- Activation rate (signup → first publish)
- Retention cohorts

### 2. **Engagement Dashboard**
- Daily/Weekly Active Users
- Apps viewed per user
- Try rate (tries / views)
- Save rate (saves / views)
- Share rate (shares / views)

### 3. **Attribution Dashboard**
- Signups by utm_source
- Signups by landing_page
- Conversion rate by source
- Cost per signup (if you add cost data)

### 4. **Creator Dashboard**
- Apps published per day
- AI vs manual creation ratio
- Time to first publish
- Creator retention

### 5. **Viral Growth Dashboard**
- Remixes per app
- Share virality (shares / views)
- Remix virality (remixes / tries)
- K-factor trend over time

---

##  📱 Real-World Use Cases

### Find Your Best Acquisition Channels
```
Event: user_signed_up
Group by: utm_source
```
See which marketing channels bring the most users.

### Optimize Your Conversion Funnel
```
Funnel:
1. app_viewed
2. app_tried
3. app_saved OR app_published
```
Find where users drop off.

### Identify Your Most Viral Apps
```
Event: app_remixed
Group by: original_app_id
```
See which apps drive the most engagement.

### Track Feature Adoption
```
Event: app_published
Filter: is_ai_generated = true
```
See how many users use AI vs manual creation.

---

## 🔍 Session Replay - Debug UX Issues

With session replay enabled, you can:
- Watch exactly how users interact with your app
- See where users get stuck or confused
- Debug reported issues by watching the user's session
- Understand why users don't convert

**To view recordings:**
PostHog → Recordings → Filter by events

---

## 🎓 Next Steps

1. ✅ Add env vars to Vercel (see above)
2. ✅ Redeploy your app
3. ✅ Test: Visit your app and trigger some events
4. ✅ Verify: Check PostHog Live Events feed
5. 📊 Create your first dashboard (Growth Dashboard)
6. 🎯 Set up retention cohorts
7. 🚨 Set up alerts for key metrics

---

## 🐛 Troubleshooting

### Events not showing in PostHog?
1. Check env vars are set in Vercel
2. Redeploy the app
3. Clear your browser cache
4. Check browser console for PostHog errors
5. Verify you're using the production URL (not localhost)

### How long until I see data?
- **Live events**: Instant (check "Live Events" in PostHog)
- **Dashboards**: ~1-2 minutes
- **Session recordings**: ~2-5 minutes to process

---

## 💰 Cost Management

**PostHog Free Tier:**
- 1M events/month
- Unlimited team members
- Unlimited session recordings (up to 15K/month)
- All features included

**If you exceed limits:**
- Option 1: Upgrade to paid plan ($0.00031/event)
- Option 2: Self-host PostHog (free forever)
- Option 3: Reduce autocapture events

**Current estimate:** With your traffic, you should stay well under 1M events/month.

---

**Questions?** Check your PostHog dashboard: https://us.posthog.com/project/251302

Or reference: `POSTHOG_SETUP.md` for more detailed setup instructions.

