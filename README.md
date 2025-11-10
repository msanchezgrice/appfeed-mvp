# AppFeed MVP — "TikTok for Apps" (Runnable Prototype)

This is a minimal, runnable MVP of a **feed-based discovery + try/use** platform for mini-apps.
It includes:
- A **feed** with 3 example apps (Daily Affirmations, This Weekend Near Me, and Todo List)
- **Watch-first** cards and **Try/Use** flows (Use supports BYOK: bring your own API keys, e.g., OpenAI)
- Basic UX for **tags**, **creators**, **save to library**, **follow**, and **remix** (parameter defaults)
- A simple, server-side **runner** that executes app manifests in a **sandboxed policy** (simulated)
- A local **secrets vault** (encrypted at rest with AES-256-GCM) for BYOK

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

## What’s included

- **Pages**
  - `/` — Feed with watch/try/use on cards
  - `/app/[id]` — App details
  - `/library` — Saved apps for the current user
  - `/secrets` — Manage BYOK secrets (OpenAI)
- **APIs**
  - `POST /api/runs` — Execute an app (Try or Use)
  - `GET /api/apps` — List apps (feed)
  - `GET /api/apps/[id]` — App details
  - `GET/POST /api/secrets` — List/Set user secrets (encrypted)
  - `POST /api/library` — Save/Remove apps from library
  - `POST /api/follow` — Follow/Unfollow creators

## Current "Users"
This MVP simulates auth. You can switch the current user in the top nav:
- **u_alex** (creator)
- **u_jamie** (viewer)
(Stored as a cookie in the browser; *not secure*, purely for local prototyping.)

## Example Apps
- **Daily Affirmations** — generates affirmations (LLM if keys available; stub otherwise)
- **This Weekend Near Me** — returns activities for a city (static dataset; offline)
- **Todo List** — adds an item to your personal todo list (stored locally)

## Remix
Click **Remix** on a card to clone the app with different default inputs (e.g., default city or style).
This is an **Insta-Remix** (parameter defaults only) that links back to the origin app.

## Notes
- All secrets are encrypted with AES-256-GCM using `SECRET_ENCRYPTION_KEY`.
- Traces redact secrets; logs are in-memory and/or stored in `.data/db.json` in simplified form.
- "Try" runs are read-only and compute-limited; "Use" runs can write (e.g., to your todo list).

Have fun. Ship fast.
