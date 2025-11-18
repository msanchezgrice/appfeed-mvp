# Creator Analytics Setup Guide

## 🎉 What Was Just Implemented

You now have a **fully-branded creator analytics dashboard** powered by PostHog! Creators can see:

- 📊 Portfolio overview (views, tries, saves, engagement rates)
- 🏆 Top performing apps with conversion metrics
- 🔄 Conversion funnel visualization  
- 🚦 Traffic source breakdown
- 📈 Performance time-series chart
- 📱 Your custom UI with your branding (no PostHog branding visible)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get PostHog API Keys

1. Go to your PostHog project: https://app.posthog.com
2. Navigate to **Settings** → **Project** → **Project API Key**
   - Copy your **Project API Key** (starts with `phc_`)
3. Navigate to **Settings** → **User** → **Personal API Keys**
   - Click **Create Personal API Key**
   - Give it a name: "AppFeed Analytics"
   - Copy the key (starts with `phx_`)

### Step 2: Add to Environment Variables

Add these to your `.env.local`:

```bash
# PostHog (for creator analytics)
POSTHOG_PROJECT_API_KEY=phc_your_project_key_here
POSTHOG_PERSONAL_API_KEY=phx_your_personal_key_here
```

### Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Restart it
npm run dev
```

### Step 4: Test It!

1. Visit your profile: `http://localhost:3000/profile/YOUR_USER_ID`
2. Click **"📊 View Analytics"**
3. You should see your analytics dashboard!

---

## 📁 Files Created/Modified

### New Files ✨
- `src/lib/posthog-server.js` - PostHog API wrapper
- `src/app/api/me/analytics/route.js` - Analytics API endpoint
- `src/app/me/analytics/page.js` - Analytics dashboard UI

### Modified Files 📝
- `src/app/profile/[id]/page.js` - Added analytics button

### Dependencies 📦
- Installed `posthog-node` for server-side API access

---

## 🎨 Dashboard Features

### Portfolio Overview Cards
Shows 4 hero metrics:
1. **Total Views** - How many times apps were seen
2. **View → Try Rate** - % of viewers who tried the app
3. **Try → Save Rate** - % of triers who saved it
4. **Followers** - Audience size

### Conversion Funnel
Visual flow showing drop-off at each stage:
- 👁️ Viewed → 🎯 Tried → 💾 Saved

### Top Apps Table
Sortable table showing per-app performance:
- Views, Tries, Saves
- Try Rate (color-coded: green >15%, yellow >10%)
- Save Rate (color-coded: green >30%, yellow >20%)

### Traffic Sources
Where views are coming from:
- 📱 Feed
- 🔍 Search
- 👤 Profile
- 🔗 Direct
- 🌐 External

### Performance Chart
Line chart showing trends over time (7, 30, or 90 days)

---

## 🔧 How It Works

### Data Flow

```
1. User interacts with app (view/try/save)
   ↓
2. Client-side PostHog tracking (src/lib/analytics.js)
   ↓
3. Event stored in PostHog + Supabase
   ↓
4. Creator visits /me/analytics
   ↓
5. API fetches data from PostHog (via API)
   ↓
6. Custom UI displays data with your branding
```

### Why Hybrid Approach?

We use **both** PostHog and Supabase:

- **PostHog**: Detailed event tracking, time-series, funnels
- **Supabase**: Fast aggregate counts, all-time stats

This gives you:
- ✅ Fast loading (Supabase counts load instantly)
- ✅ Deep insights (PostHog provides trends/funnels)
- ✅ Best of both worlds

---

## 🐛 Troubleshooting

### "Analytics Unavailable" Error

**Cause**: PostHog API keys not configured or incorrect

**Solution**:
1. Check `.env.local` has both keys set
2. Restart dev server after adding keys
3. Verify keys are correct in PostHog dashboard

### No Data Showing

**Cause**: No events tracked yet or filtering by wrong creator_id

**Solution**:
1. Make sure you've used the app (view/try/save) to generate events
2. Check PostHog dashboard to see if events are coming in
3. Wait a few minutes for events to process

### "Query Failed" Errors

**Cause**: PostHog API rate limiting or network issues

**Solution**:
1. Add caching (see "Optimization" section below)
2. Reduce date range (try 7 days instead of 30)
3. Check PostHog status page

---

## ⚡ Optimization (Optional)

### Add Caching

To reduce API calls and improve performance:

```javascript
// Install Redis or use Vercel KV
npm install @vercel/kv

// src/app/api/me/analytics/route.js
import { kv } from '@vercel/kv';

export async function GET(req) {
  const { userId } = await createServerSupabaseClient();
  const cacheKey = `analytics:${userId}:${days}`;
  
  // Check cache first
  const cached = await kv.get(cacheKey);
  if (cached) return NextResponse.json(cached);
  
  // Fetch from PostHog...
  const data = await getCreatorPortfolioAnalytics(userId, days);
  
  // Cache for 1 hour
  await kv.set(cacheKey, data, { ex: 3600 });
  
  return NextResponse.json(data);
}
```

### Add Loading States

The dashboard already has loading states, but you can enhance them:
- Add skeleton loaders for cards
- Progressive loading (show Supabase data first, then PostHog)

---

## 📊 PostHog Dashboard (Optional)

You can also create dashboards in PostHog UI for internal analysis:

1. Go to PostHog → **Dashboards** → **New Dashboard**
2. Add insights:
   - **Trends**: `app_viewed` by `creator_id`
   - **Funnel**: `app_viewed` → `app_tried` → `app_saved`
   - **Retention**: Users who return after viewing
3. Filter by `creator_id` property

This gives you:
- Admin view of all creators
- Deeper analysis tools (cohorts, paths, session replay)

---

## 🔐 Privacy & Security

### What Creators See
- ✅ Aggregate counts (total views, tries, saves)
- ✅ Their own app performance
- ✅ Traffic source breakdown

### What Creators DON'T See
- ❌ Individual user identities
- ❌ IP addresses
- ❌ Personal data of viewers
- ❌ Other creators' data

### Best Practices
- PostHog keys are server-side only (never exposed to client)
- API route checks authentication before returning data
- Each creator only sees their own analytics

---

## 🎯 Next Steps

### Week 1: Launch
- ✅ Announce to creators
- ✅ Gather feedback
- ✅ Monitor for errors

### Week 2: Enhance
- Add CSV export functionality
- Add email reports (weekly digest)
- Add "How you compare" benchmarking

### Week 3: Optimize
- Add caching for better performance
- Optimize PostHog queries
- Add more time ranges (all-time, custom dates)

### Future Ideas
- Session replay links (see how users interact)
- Cohort analysis (compare creator groups)
- Predictive analytics (forecast views)
- Creator leaderboard (opt-in)

---

## 💡 Tips for Creators

Share these tips with your creators:

### Interpreting Metrics

**Good View → Try Rate**: >10%
- If lower: Improve preview video/gradient
- If higher: Great first impression!

**Good Try → Save Rate**: >20%
- If lower: App may not deliver on promise
- If higher: High-quality, useful app!

### Improving Performance

1. **Low views?** 
   - Add more relevant tags
   - Improve app name/description
   - Share on social media

2. **Low try rate?**
   - Make preview more compelling
   - Add better sample inputs
   - Showcase results in preview

3. **Low save rate?**
   - Ensure app works reliably
   - Make output more valuable
   - Add unique features

---

## 📚 Resources

- **PostHog Docs**: https://posthog.com/docs
- **PostHog API**: https://posthog.com/docs/api
- **Your Analytics Docs**:
  - `CREATOR_ANALYTICS_POSTHOG.md` - Full implementation guide
  - `ANALYTICS_COMPARISON.md` - Decision rationale
  - `CREATOR_ANALYTICS_RECOMMENDATIONS.md` - Future enhancements

---

## 🆘 Need Help?

### PostHog Issues
- Check PostHog status: https://status.posthog.com
- PostHog community: https://posthog.com/questions

### Implementation Issues
- Review the documentation files
- Check server logs for error details
- Test API endpoints directly with curl/Postman

### Feature Requests
Document what creators are asking for and prioritize based on feedback!

---

## ✅ Success Checklist

- [ ] PostHog API keys added to `.env.local`
- [ ] Dev server restarted
- [ ] Visited `/me/analytics` - dashboard loads
- [ ] Can see overview metrics
- [ ] Can see top apps table
- [ ] Can switch date ranges (7/30/90 days)
- [ ] Traffic sources showing
- [ ] Time-series chart rendering
- [ ] Profile page shows "View Analytics" button
- [ ] Only profile owner sees analytics button
- [ ] Data updates when interacting with apps

---

**You're all set! 🎉**

Creators can now see professional analytics with your custom branding, powered by PostHog's robust event tracking.


