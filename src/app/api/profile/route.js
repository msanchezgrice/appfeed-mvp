import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/profile - Update current user's profile
export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, avatarUrl } = body;

    console.log('[API /profile] Updating profile for:', userId, {
      displayName,
      avatarUrl: avatarUrl?.substring(0, 80) + '...'
    });

    // Build update object
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (displayName !== undefined && displayName !== null) {
      updates.display_name = displayName;
    }

    if (avatarUrl !== undefined && avatarUrl !== null) {
      updates.avatar_url = avatarUrl;
    }

    // Update profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[API /profile] Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log('[API /profile] ✓ Profile updated successfully');

    return NextResponse.json({
      success: true,
      profile: data
    });
  } catch (e) {
    console.error('[API /profile] Exception:', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

// GET /api/profile - Get user profile (by identifier or current user)
export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get('identifier'); // Can be username or user ID
    
    // If identifier provided, lookup by username or ID (for public profile viewing)
    if (identifier) {
      // Try username first (more user-friendly)
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', identifier)
        .single();
      
      // If not found by username, try by ID (backward compatibility)
      if (error || !profile) {
        ({ data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', identifier)
          .single());
      }
      
      if (error || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      
      return NextResponse.json({ profile });
    }
    
    // No identifier - return current user's profile
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[API /profile] Error fetching profile:', error);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (e) {
    console.error('[API /profile] Exception:', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

