# 📊 Seed Data Guide

## How to Add Sample Apps to Your Database

### Step 1: Go to Supabase Dashboard

Open: https://supabase.com/dashboard/project/lobodzhfgojceqfvgcit

### Step 2: Open SQL Editor

Click **"SQL Editor"** in the left sidebar

### Step 3: Create New Query

Click **"New query"** button

### Step 4: Copy & Paste SQL

Open the file: `/supabase/seed_apps.sql`

Copy **ALL** the SQL content and paste it into the Supabase SQL Editor

### Step 5: Run the Query

Click **"Run"** (or press Cmd+Enter)

You should see:
```
Success!
3 rows returned
```

### Step 6: Verify Data

Go to **Table Editor** → **apps** table

You should now see 3 apps:
- ✅ Weather Checker
- ✅ Code Explainer  
- ✅ Professional Email Writer

Each app will have:
- Real view counts (142, 256, 189)
- Real try counts (28, 45, 34)
- Real save counts (5, 8, 6)
- Tags (weather/api/data, coding/education, writing/productivity)
- **Your user ID as creator**

### Step 7: Test in App

Go back to http://localhost:3000

1. **Feed page** → Should show all 3 apps! ✅
2. **Search page** → Try searching for "weather" or "code" ✅
3. **Profile page** → Should show 0 followers (real data) ✅

---

## What Changed

### ✅ Fixed Issues:

1. **Sign Out Button** → Now in Profile page under Settings tab
2. **Search Tab** → Added to navbar (between Feed and Library)
3. **Real Data Only** → Removed all `Math.random()` placeholders
4. **Followers Count** → Shows actual count from database (0 if none)
5. **App Stats** → Uses real columns: `view_count`, `save_count`, etc.

### ✅ New Files:

- `/supabase/seed_apps.sql` - 3 sample apps to populate feed
- `/SEED_DATA_GUIDE.md` - This guide

---

## Database Schema Used

The seed data uses these actual columns from your `apps` table:

```sql
- id (text)
- creator_id (text) - Links to your Clerk user ID
- name (text)
- description (text)
- prompt (text)
- output_schema (jsonb)
- tools (jsonb)
- tags (text[])
- is_published (boolean)
- view_count (integer)
- try_count (integer)
- use_count (integer)
- save_count (integer)
- remix_count (integer)
- follower_count (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## Troubleshooting

### "No rows returned" or "0 apps"?

**Check if you have a profile:**
```sql
SELECT * FROM profiles;
```

If empty → Sign up/sign in to create your profile first via the webhook.

### Apps not showing in feed?

**Check `is_published` is true:**
```sql
SELECT name, is_published FROM apps;
```

### Want to reset and start fresh?

**Delete all apps:**
```sql
DELETE FROM apps;
```

Then re-run the seed SQL.

---

## Next Steps

Once seed data is loaded:

1. ✅ Browse feed → See 3 apps
2. ✅ Click heart icon → Save to library
3. ✅ Go to Search → Test search functionality
4. ✅ Check Profile → See 0 followers (real data)
5. ✅ Click Settings → See Sign Out button
6. ✅ Try publishing your own app!

---

**All features are now using real database data!** 🎉
