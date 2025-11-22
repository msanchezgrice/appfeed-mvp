'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [homeBadge, setHomeBadge] = useState(0);

  const navItems = [
    { label: 'Feed', icon: '🏠', path: '/feed' },
    { label: 'Home', icon: '⭐', path: '/home' },
    { label: 'Search', icon: '🔍', path: '/search' },
    { label: 'My Assets', icon: '🎨', path: '/library' },
    { label: 'Profile', icon: '👤', path: '/profile' }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem('cc_home_badge_count');
      const n = raw ? parseInt(raw, 10) : 0;
      if (!Number.isNaN(n)) setHomeBadge(n);
    } catch {
      // ignore
    }
  }, [pathname]);

  // Hide bottom nav on landing pages
  if (pathname === '/' || pathname.startsWith('/how-it-works') || pathname.startsWith('/docs') || pathname.startsWith('/faq')) {
    return null;
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '600px',
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
        const showHomeBadge = item.path === '/home' && homeBadge > 0;
        const badgeLabel = homeBadge > 9 ? '9+' : homeBadge.toString();
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
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{item.label}</div>
              {showHomeBadge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: -14,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 0 0 2px rgba(0,0,0,0.7)'
                  }}
                >
                  {badgeLabel}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
