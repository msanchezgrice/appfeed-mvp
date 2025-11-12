'use client';

// Client-side Supabase client with Clerk authentication
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

/**
 * Hook to get Supabase client in client components with Clerk JWT
 * Automatically includes Clerk JWT token in requests
 */
export function useSupabaseClient() {
  const { getToken } = useAuth();
  
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: async () => {
            const token = await getToken({ template: 'supabase' });
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        },
      }
    );
  }, [getToken]);
  
  return supabase;
}
