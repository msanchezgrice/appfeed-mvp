'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, posthog } from '@/src/lib/posthog';

export function PostHogProvider({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Initialize PostHog
  useEffect(() => {
    initPostHog();
  }, []);

  // Track pageviews
  useEffect(() => {
    if (pathname && typeof window !== 'undefined') {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthog?.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  // Identify user when Clerk loads
  useEffect(() => {
    if (isLoaded && user && typeof window !== 'undefined') {
      posthog?.identify(user.id, {
        email: user.emailAddresses?.[0]?.emailAddress,
        name: user.fullName,
        username: user.username,
        created_at: user.createdAt,
        avatar: user.imageUrl,
      });
    } else if (isLoaded && !user) {
      posthog?.reset(); // Clear user identity on logout
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}
