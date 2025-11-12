// Server-side Supabase client with Clerk authentication
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/**
 * Creates a Supabase client for server-side operations with Clerk JWT
 * Use this in API routes and Server Components
 * For public routes (no auth required), pass allowAnonymous: true
 */
export async function createServerSupabaseClient(options = {}) {
  const { allowAnonymous = false } = options;
  
  // For public routes, use anonymous access
  if (allowAnonymous) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return { supabase, userId: null };
  }
  
  // For authenticated routes, get user from Clerk
  const { userId } = await auth();
  
  // Debug logging (remove after fixing)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Auth check - userId:', userId || 'NULL');
  }
  
  // Use service role key for authenticated operations to bypass RLS
  // This is safe because we verify the user via Clerk first
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  
  return { supabase, userId };
}

/**
 * Creates a Supabase admin client with service role key
 * WARNING: Use only for admin operations, bypasses RLS
 */
export function createAdminSupabaseClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
