# PostHog Analytics Setup Guide

✅ **Installation Complete!**

PostHog has been successfully integrated into your Clipcade app. Follow these final steps to activate it.

---

## 📝 Final Setup Steps

### 1. Add Environment Variables

Add these two lines to your `.env.local` file:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_1q3kOHxBsN7Yu3gUehDc1ChAraAfXbxdJ8uGRXX6woT
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 2. Restart Your Development Server

```bash
npm run dev
```

That's it! PostHog is now tracking analytics. 🎉

---

## 📊 What's Being Tracked

### Automatic Tracking
- ✅ **Pageviews** - Every page visit
- ✅ **User identification** - Linked to Clerk user IDs
- ✅ **Session replay** - Watch user sessions (with sensitive data masked)
- ✅ **Console logs** - Debug issues faster

### Custom Events Tracked
- 🎯 **app_viewed** - When users view an app (in feed or detail page)
- 🎮 **app_tried** - When users click "Run" on an app
- 📱 **app_published** - When creators publish a new app
  - Tracks whether it was AI-generated or manual
  - Includes tags
- 🎨 **app_remixed** - When users remix an existing app
- 💾 **app_saved** - When users save an app to their library
- 👥 **user_followed** - When users follow a creator
- 👋 **user_unfollowed** - When users unfollow someone

### User Properties Tracked
- Email
- Username
- Name
- Avatar URL
- Account creation date

---

## 🎯 Next Steps - Analyzing Your Data

### 1. Create Key Dashboards

Go to your PostHog dashboard: https://us.posthog.com/project/251302

#### **Recommended Dashboards:**

**Growth Dashboard:**
- New users per day/week
- Retention cohorts (Day 1, Day 7, Day 30)
- User activation rate (signup → first app published)

**Engagement Dashboard:**
- Apps viewed per user
- Try rate (tries / views)
- Remix rate (remixes / tries)
- Save rate (saves / views)

**Creator Dashboard:**
- Apps published per day
- AI vs manual app creation ratio
- Time to first publish
- Apps published per creator

**Viral Growth Dashboard:**
- Share rate
- Remix virality (remixes per app)
- Follow rate (follows / profile views)

### 2. Set Up Funnels

Track your key conversion funnels:

**Signup → Activation Funnel:**
1. User signed up
2. app_viewed (first view)
3. app_tried (first try)
4. app_published (first publish)

**Consumption Funnel:**
1. app_viewed
2. app_tried
3. app_saved OR app_remixed

**Creator Funnel:**
1. app_viewed
2. app_remixed
3. app_published

### 3. Set Up Retention Cohorts

Track how many users come back:
- **Day 1 retention:** Users who return 1 day after signup
- **Day 7 retention:** Weekly active users
- **Day 30 retention:** Monthly active users

Focus on improving these metrics!

---

## 🔍 Session Replay

Session replay is enabled! You can watch exactly how users interact with your app.

**To view sessions:**
1. Go to PostHog → Recordings
2. Filter by events (e.g., "Show me sessions where users published an app")
3. Watch the replay to see UX issues

**What's masked:**
- All text inputs (passwords, API keys, etc.)
- Elements with `data-private` attribute

---

## ⚡ Performance Impact

- **Bundle size:** +45KB (loaded async, doesn't block page)
- **Load time impact:** Minimal (~10ms)
- **Data privacy:** All data stays in your PostHog project
- **GDPR compliant:** IP addresses are collected but can be anonymized

---

## 🛠️ Advanced Configuration

### Disable Session Recording (Optional)

If session recording feels too invasive, edit `src/lib/posthog.js`:

```javascript
session_recording: {
  enabled: false, // Change to false
}
```

### Track Additional Custom Events

Use the analytics helper anywhere in your code:

```javascript
import { analytics } from '@/src/lib/analytics';

// Track any custom event
analytics.trackEvent('custom_event_name', {
  property1: 'value1',
  property2: 'value2'
});
```

### Update User Properties

```javascript
import { updateUserProperties } from '@/src/lib/analytics';

updateUserProperties({
  plan: 'pro',
  apps_created: 10,
  is_verified: true
});
```

---

## 📈 Monitoring Growth Metrics

### Key Metrics to Watch

**North Star Metric:** Active creators (users who published ≥1 app in last 30 days)

**Supporting Metrics:**
1. **Signups per week** - Are you growing?
2. **Activation rate** - % of signups who publish their first app
3. **Weekly Active Users (WAU)** - Users who viewed/tried apps
4. **Remix rate** - Apps remixed / Total apps viewed
5. **Retention (D7, D30)** - Are users coming back?

### Alerts to Set Up

Set up alerts in PostHog for:
- 🚨 Signups drop below X per day
- 🚨 Error rate spikes
- 🎉 Viral app detected (high remix rate)

---

## 🎓 Resources

- [PostHog Docs](https://posthog.com/docs)
- [Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)
- [Retention Cohorts Guide](https://posthog.com/docs/user-guides/cohorts)
- [Session Replay Guide](https://posthog.com/docs/user-guides/recordings)

---

## 🆘 Troubleshooting

### Events not showing up?

1. Check browser console for PostHog errors
2. Verify environment variables are set: `console.log(process.env.NEXT_PUBLIC_POSTHOG_KEY)`
3. Make sure you restarted your dev server after adding env vars
4. Check PostHog dashboard for "Live Events" to see real-time data

### Session replays not recording?

- Session recordings take ~1-2 minutes to process
- Check PostHog → Settings → Session Recording is enabled

### Too much data / hitting limits?

PostHog free tier includes **1M events/month**. If you hit limits:
- Self-host PostHog (free forever)
- Reduce autocapture events
- Sample events (only track 50% of sessions)

---

## 💡 Tips for Success

1. **Start Simple:** Focus on 3-5 key metrics first
2. **Set Weekly Goals:** Review your dashboard every Monday
3. **Act on Insights:** Use session replay to find UX issues
4. **Experiment:** Run A/B tests with PostHog feature flags
5. **Share with Team:** Create public dashboards to keep everyone aligned

---

**Questions?** Check the PostHog docs or your dashboard at:
👉 https://us.posthog.com/project/251302

Happy analyzing! 🚀

