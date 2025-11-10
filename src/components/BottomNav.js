'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: '🏠', path: '/feed' },
    { label: 'Search', icon: '🔍', path: '/search' },
    { label: 'Library', icon: '📚', path: '/library' },
    { label: 'Profile', icon: '👤', path: '/profile' }
  ];

  // Hide bottom nav on landing pages
  if (pathname === '/' || pathname.startsWith('/how-it-works') || pathname.startsWith('/docs') || pathname.startsWith('/faq')) {
    return null;
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      background: '#000',
      borderTop: '1px solid #333',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {navItems.map(item => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? '#fff' : '#888',
              textDecoration: 'none',
              flex: 1,
              height: '100%',
              transition: 'color 0.2s'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 2 }}>{item.icon}</div>
            <div style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{item.label}</div>
          </Link>
        );
      })}
    </nav>
  );
}
