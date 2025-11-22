import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  console.log('[API /apps] Request received');
  try {
    // For includeUnpublished, need authenticated client
    const { searchParams } = new URL(req.url);
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';
    
    const { supabase, userId } = await createServerSupabaseClient({ 
      allowAnonymous: !includeUnpublished // Require auth if including unpublished
    });
    
    console.log('[API /apps] userId:', userId, 'includeUnpublished:', includeUnpublished);
    
    if (includeUnpublished && !userId) {
      console.log('[API /apps] includeUnpublished requires auth but no userId - returning published only');
    }
    
    // Get query parameters for filtering
    const tag = searchParams.get('tag');
    const creatorId = searchParams.get('creator');
    const search = searchParams.get('q');
    const deviceType = searchParams.get('device');

    // Defensive caps to protect Supabase and avoid huge scans
    const rawLimit = parseInt(searchParams.get('limit') || '60', 10);
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(Math.max(rawLimit || 1, 1), 60); // 1–60
    const offset = Math.min(Math.max(rawOffset || 0, 0), 500); // cap offset at 500
    const requestUserId = searchParams.get('userId');
    
    console.log('[API /apps] GET request:', { tag, creatorId, search, deviceType, includeUnpublished, requestUserId, authUserId: userId });
    
    // Build query
    let query = supabase
      .from('apps')
      .select(`
        *,
        html_content,
        creator:profiles!apps_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `);
    
    // If includeUnpublished is true, check if admin
    if (includeUnpublished && userId) {
      // Check if current user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('clerk_user_id', userId)
        .single();
      
      const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
      
      console.log('[API /apps] includeUnpublished=true, userId:', userId, 'isAdmin:', isAdmin);
      
      if (isAdmin) {
        // Admin sees ALL apps - don't add is_published filter at all!
        console.log('[API /apps] Admin mode - NO is_published filter');
      } else if (requestUserId) {
        // Regular user sees published OR their own unpublished
        query = query.or(`is_published.eq.true,and(is_published.eq.false,creator_id.eq.${requestUserId})`);
      } else {
        // Not admin, not requesting specific user - published only
        query = query.eq('is_published', true);
      }
    } else {
      // Default: only published apps
      query = query.eq('is_published', true);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }
    
    if (deviceType) {
      query = query.contains('device_types', [deviceType]);
    }
    
    if (search) {
      // Use full-text search
      const { data: searchResults, error: searchError } = await supabase.rpc('search_apps', {
        p_query: search,
        p_limit: limit,
        p_offset: offset
      });
      
      if (searchError) throw searchError;
      
      // Get full app data with creators
      const appIds = searchResults.map(r => r.id);
      const { data: apps, error } = await supabase
        .from('apps')
        .select(`
          *,
          html_content,
          creator:profiles!apps_creator_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .in('id', appIds);
      
      if (error) throw error;
      
      return Response.json({ 
        apps: apps || [],
        total: searchResults.length
      });
    }
    
    const { data: apps, error, count } = await query;
    
    if (error) {
      console.error('Error fetching apps:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch apps' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get tags
    const { data: tags } = await supabase
      .from('tags')
      .select('*')
      .order('app_count', { ascending: false });
    
    return Response.json({
      apps: apps || [],
      tags: tags || [],
      total: count
    });
  } catch (e) {
    console.error('Apps GET error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
