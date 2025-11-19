import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/profile/update - Update user profile directly
export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, avatarUrl } = body;

    console.log('[Profile Update] Updating profile for user:', userId, { displayName, avatarUrl: avatarUrl?.substring(0, 60) });

    // Build update object
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (displayName !== undefined) {
      updates.display_name = displayName;
    }

    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl;
    }

    // Update profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('[Profile Update] Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log('[Profile Update] Profile updated successfully:', updates);

    return NextResponse.json({
      success: true,
      updated: updates
    });
  } catch (e) {
    console.error('[Profile Update] Exception:', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

