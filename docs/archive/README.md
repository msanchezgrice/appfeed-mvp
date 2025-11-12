# AppFeed MVP — "TikTok for Apps" 🚀

A **TikTok-style feed for mini-apps** where creators publish, viewers discover, and everyone remixes.

![AppFeed](https://img.shields.io/badge/Status-MVP-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![Node](https://img.shields.io/badge/Node.js-20.x-green)

## ✨ Features

### TikTok-Style UI
- **Vertical scrolling feed** with full-screen cards
- **Animated GIF previews** for each app
- **Right-side action buttons**: Like ❤️, Save 🔖, Share 🔗
- **Bottom navigation**: Home, Search, Library, Profile
- **Clickable hashtags** → Search by tag
- **Clickable creators** → View their profile

### App Discovery & Execution
- **Watch-first** approach with animated previews
- **Try mode**: Sandbox with read-only, compute-limited runs
- **Use mode**: Real execution with BYOK (Bring Your Own Keys)
- **Beautiful app UIs**: Custom gradient cards for each app type
- **Remix functionality**: Clone apps with different defaults

### Creator Tools
- **Simple JSON manifests** to publish apps
- **Automatic attribution** and remix lineage
- **Profile pages** showing created & saved apps
- **Follow system** for building audience

### Security & Privacy
- **BYOK secrets vault**: Encrypted with AES-256-GCM
- **Sandboxed execution**: Network/compute limits in Try mode
- **No permanent storage** of API keys on server

> ⚠️ **Prototype notes**
> - The data store is a simple JSON file on disk at `.data/db.json` (created at runtime).
> - This is **not** production grade. It trades completeness for clarity and velocity.
> - Network calls are limited and disabled in Try mode by default.
> - LLM calls fall back to **offline stubs** if the user has not provided provider keys.

## Quickstart

1. **Prereqs**
   - Node.js 20.x (recommended)
   - npm or pnpm

2. **Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set SECRET_ENCRYPTION_KEY (generate a random 32-byte hex string)
   npm install
   npm run dev
   ```

3. **Open** http://localhost:3000

4. **Add your keys (BYOK)**
   - Go to **/secrets** (top nav → "Secrets") and add your **OpenAI API key** if you want real LLM outputs.
   - Without keys, the runner uses **stubs** for demo purposes.

## Environment Variables

Create `.env.local` with:
```
# Required
SECRET_ENCRYPTION_KEY=                                  # 64 hex chars (32 bytes) used to encrypt BYOK secrets

# Optional
PORT=3000                                               # dev server port
NEXT_PUBLIC_SITE_URL=http://localhost:3000              # deep links
OPENAI_MODEL=gpt-4o-mini                                # default model (used if user key is present)
ALLOW_NETWORK_IN_TRY=0                                  # 0 or 1 — allow http.fetch during Try mode
```

### Generating a key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📱 Pages & Routes

### Public Pages
- `/` — Landing page with docs and info
- `/feed` — TikTok-style app feed
- `/search` — Search apps with hashtag filters
- `/library` — Your saved apps
- `/profile` — Your profile (saved & created apps)
- `/profile/[id]` — View other creators' profiles
- `/app/[id]` — Individual app details
- `/secrets` — Manage BYOK API keys
- `/how-it-works` — Product documentation
- `/docs` — Developer docs
- `/faq` — Frequently asked questions

### API Routes
- `POST /api/runs` — Execute an app (Try or Use)
- `GET /api/apps` — List all apps
- `GET /api/apps/[id]` — Get app details
- `GET/POST /api/secrets` — Manage encrypted user secrets
- `POST /api/library` — Save/remove apps
- `POST /api/follow` — Follow/unfollow creators
- `POST /api/remix` — Create app variants

## Current "Users"
This MVP simulates auth. You can switch the current user in the top nav:
- **u_alex** (creator)
- **u_jamie** (viewer)
(Stored as a cookie in the browser; *not secure*, purely for local prototyping.)

## 🎨 Example Apps

Each app has a custom UI with gradients and animations:

### Daily Affirmations ✨
- Purple gradient card with pulse animation
- Generates personalized affirmations based on mood
- Uses OpenAI (LLM) or offline stubs
- **Preview**: Sparkle GIF animation

### This Weekend Near Me 🎉
- Pink gradient card with float animation
- Recommends weekend activities for your city
- Works offline with static dataset
- **Preview**: Party GIF animation

### Todo: Add Item ✓
- Blue gradient card with check animation
- Adds tasks to your personal todo list
- Stores locally in your browser
- **Preview**: Checkmark GIF animation

## Remix
Click **Remix** on a card to clone the app with different default inputs (e.g., default city or style).
This is an **Insta-Remix** (parameter defaults only) that links back to the origin app.

## Notes
- All secrets are encrypted with AES-256-GCM using `SECRET_ENCRYPTION_KEY`.
- Traces redact secrets; logs are in-memory and/or stored in `.data/db.json` in simplified form.
- "Try" runs are read-only and compute-limited; "Use" runs can write (e.g., to your todo list).

Have fun. Ship fast.
