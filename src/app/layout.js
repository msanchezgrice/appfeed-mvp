import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import BottomNav from '@/src/components/BottomNav';

export const metadata = {
  title: 'Clipcade - Discover, Run & Remix Mini-Apps',
  description: 'TikTok-style feed for mini-apps. Discover, try, and remix apps with your own AI. Bring your own API key.',
  keywords: 'apps, mini-apps, AI, remix, TikTok, discover, BYOK',
  authors: [{ name: 'Clipcade' }],
  creator: 'Clipcade',
  publisher: 'Clipcade',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.clipcade.com',
    siteName: 'Clipcade',
    title: 'Clipcade - Discover, Run & Remix Mini-Apps',
    description: 'TikTok-style feed for mini-apps. Discover, try, and remix apps with your own AI.',
    images: [
      {
        url: 'https://lobodzhfgojceqfvgcit.supabase.co/storage/v1/object/public/app-images/app-previews/wishboard-starter-mhv10wyp.png',
        width: 1200,
        height: 630,
        alt: 'Clipcade - Discover Mini-Apps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clipcade - Discover, Run & Remix Mini-Apps',
    description: 'TikTok-style feed for mini-apps. Try and remix apps with your own AI.',
    images: ['https://lobodzhfgojceqfvgcit.supabase.co/storage/v1/object/public/app-images/app-previews/wishboard-starter-mhv10wyp.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </head>
        <body>
          {children}
          <BottomNav />
        </body>
      </html>
    </ClerkProvider>
  );
}
