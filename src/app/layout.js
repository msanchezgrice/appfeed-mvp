'use client';
import './globals.css';
import Navbar from '@/src/components/Navbar';
import BottomNav from '@/src/components/BottomNav';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Hide navbar on app pages (feed, search, library, profile)
  const hideNavbar = pathname.startsWith('/feed') ||
                     pathname.startsWith('/search') ||
                     pathname.startsWith('/library') ||
                     pathname.startsWith('/profile') ||
                     pathname.startsWith('/secrets');

  return (
    <html lang="en">
      <body>
        {!hideNavbar && <Navbar />}
        <div className="container" style={{ paddingBottom: hideNavbar ? 80 : 20, paddingTop: hideNavbar ? 0 : 20 }}>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
