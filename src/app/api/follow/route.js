import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/follow?userId=xxx - Get followers/following for a user
export async function GET(req) {
  try {
    const { supabase, userId: currentUserId } = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || currentUserId;
    const type = searchParams.get('type'); // 'followers' or 'following'

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (type === 'followers') {
      // Get users who follow the target user
      const { data: followers, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at,
          follower:profiles!follows_follower_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[API /follow] Error fetching followers:', error);
        return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
      }

      const formattedFollowers = (followers || []).map(f => f.follower).filter(Boolean);

      return NextResponse.json({
        followers: formattedFollowers,
        count: formattedFollowers.length
      });
    } else if (type === 'following') {
      // Get users that the target user follows
      const { data: following, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          created_at,
          following:profiles!follows_following_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('follower_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[API /follow] Error fetching following:', error);
        return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
      }

      const formattedFollowing = (following || []).map(f => f.following).filter(Boolean);

      return NextResponse.json({
        following: formattedFollowing,
        count: formattedFollowing.length
      });
    } else {
      // Get both
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id, follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)')
          .eq('following_id', targetUserId),
        supabase
          .from('follows')
          .select('following_id, following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url)')
          .eq('follower_id', targetUserId)
      ]);

      const followers = (followersRes.data || []).map(f => f.follower).filter(Boolean);
      const following = (followingRes.data || []).map(f => f.following).filter(Boolean);

      return NextResponse.json({
        followers,
        following,
        followersCount: followers.length,
        followingCount: following.length
      });
    }
  } catch (e) {
    console.error('[API /follow] GET exception:', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

// POST /api/follow - Follow/unfollow a user
export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    if (action === 'follow') {
      // Create follow relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: userId,
          following_id: targetUserId
        });

      if (followError) {
        // Ignore if already following (unique constraint violation)
        if (followError.code === '23505') {
          return NextResponse.json({ success: true, alreadyFollowing: true });
        }
        console.error('[API /follow] Follow error:', followError);
        return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
      }

      // Update follower counts
      await Promise.all([
        // Increment following count for current user
        supabase.rpc('increment_following_count', { user_id: userId }),
        // Increment follower count for target user
        supabase.rpc('increment_follower_count', { user_id: targetUserId })
      ]).catch(err => console.error('[API /follow] Count update error:', err));

      return NextResponse.json({ success: true, following: true });
    } else if (action === 'unfollow') {
      // Remove follow relationship
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId);

      if (unfollowError) {
        console.error('[API /follow] Unfollow error:', unfollowError);
        return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
      }

      // Update follower counts
      await Promise.all([
        // Decrement following count for current user
        supabase.rpc('decrement_following_count', { user_id: userId }),
        // Decrement follower count for target user
        supabase.rpc('decrement_follower_count', { user_id: targetUserId })
      ]).catch(err => console.error('[API /follow] Count update error:', err));

      return NextResponse.json({ success: true, following: false });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e) {
    console.error('[API /follow] POST exception:', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
