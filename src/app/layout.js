import './globals.css';
import Navbar from '@/src/components/Navbar';
import BottomNav from '@/src/components/BottomNav';

export const metadata = { title: 'AppFeed MVP', description: 'Feed-based discovery and try/use for mini-apps' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="container" style={{ paddingBottom: 80 }}>{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
