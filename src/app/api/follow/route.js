import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get followers (people following this user)
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('following_id', userId);
    
    // Get following (people this user follows)
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('follower_id', userId);
    
    if (followersError || followingError) {
      console.error('Error fetching follows:', followersError || followingError);
      return new Response(JSON.stringify({ error: 'Failed to fetch follows' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Transform the data to flatten the nested profile objects
    const followersData = followers?.map(f => ({
      follower_id: f.follower_id,
      username: f.profiles?.username,
      display_name: f.profiles?.display_name,
      avatar_url: f.profiles?.avatar_url
    })) || [];
    
    const followingData = following?.map(f => ({
      following_id: f.following_id,
      username: f.profiles?.username,
      display_name: f.profiles?.display_name,
      avatar_url: f.profiles?.avatar_url
    })) || [];
    
    return new Response(JSON.stringify({
      followers: followersData,
      following: followingData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Follow GET error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { creatorId, action } = await req.json();
    
    if (!creatorId) {
      return new Response(JSON.stringify({ error: 'creatorId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'follow') {
      // Insert follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: userId,
          following_id: creatorId
        });
      
      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error following user:', error);
        return new Response(JSON.stringify({ error: 'Failed to follow user' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (action === 'unfollow') {
      // Delete follow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', creatorId);
      
      if (error) {
        console.error('Error unfollowing user:', error);
        return new Response(JSON.stringify({ error: 'Failed to unfollow user' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Follow POST error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
