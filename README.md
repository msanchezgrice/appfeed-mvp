# Clipcade

**Live Site:** https://www.clipcade.com

TikTok-style feed for mini-apps. Discover, try, and remix apps with your own AI.

## Features

- 📱 TikTok-style vertical feed
- 🔄 Remix apps with natural language
- 🎨 AI-generated images (Gemini)
- 🔐 BYOK (Bring Your Own Key)
- 📧 Email digests & notifications
- 🖼️ Image processing (10 artistic styles)
- 🔍 Web search integration
- 💾 Save & organize apps
- 👤 User profiles & social features

## Tech Stack

- **Frontend:** Next.js 15.2.3, React 19
- **Auth:** Clerk (production)
- **Database:** Supabase (Postgres + Storage)
- **AI:** OpenAI (LLM + Web Search), Gemini (Image Gen)
- **Email:** Resend
- **Hosting:** Vercel

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add your API keys
npm run dev
```

## Apps Available

16 mini-apps including:
- Text Summarizer
- Email Reply Writer  
- Ghiblify My Photo (image transformation)
- Daily News Digest
- Article Digest via Email
- And more!

## Development

```bash
npm run dev    # Start dev server (port 3000)
npm run build  # Build for production
npm start      # Start production server
```

## Environment Variables

See `.env.example` for required variables.

Never commit API keys to git!

## License

MIT

