import { createAdminSupabaseClient } from './supabase-server';

/**
 * Syncs Clerk user profile to Supabase
 * Call this on sign-in/sign-up to ensure profile exists
 */
export async function syncProfileFromClerk(clerkUserId, clerkUserData = {}) {
  try {
    const supabase = createAdminSupabaseClient();
    
    console.log('[Sync Profile] Checking profile for user:', clerkUserId);
    
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', clerkUserId)
      .single();
    
    if (existing) {
      console.log('[Sync Profile] Profile exists, updating...');
      
      // Build update object with only provided fields
      const updates = {};
      if (clerkUserData.username) updates.username = clerkUserData.username;
      if (clerkUserData.email !== undefined) updates.email = clerkUserData.email;
      if (clerkUserData.displayName) updates.display_name = clerkUserData.displayName;
      if (clerkUserData.avatarUrl) updates.avatar_url = clerkUserData.avatarUrl;
      updates.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', clerkUserId);
      
      if (error) {
        console.error('[Sync Profile] Error updating profile:', error);
        return { success: false, error: error.message };
      }
      
      console.log('[Sync Profile] Profile updated successfully:', updates);
      return { success: true, created: false, updated: true };
    }
    
    // Create profile
    console.log('[Sync Profile] Creating new profile...');
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: clerkUserId,
        clerk_user_id: clerkUserId,
        username: clerkUserData.username || `user_${clerkUserId.slice(-8)}`,
        email: clerkUserData.email || null,
        display_name: clerkUserData.displayName || clerkUserData.username || 'User',
        avatar_url: clerkUserData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${clerkUserId}`
      });
    
    if (error) {
      console.error('[Sync Profile] Error creating profile:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[Sync Profile] Profile created successfully');
    return { success: true, created: true };
  } catch (err) {
    console.error('[Sync Profile] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

