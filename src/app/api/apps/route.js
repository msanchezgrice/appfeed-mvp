import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient({ allowAnonymous: true });
    const { searchParams } = new URL(req.url);
    
    // Get query parameters for filtering
    const tag = searchParams.get('tag');
    const creatorId = searchParams.get('creator');
    const search = searchParams.get('q');
    const deviceType = searchParams.get('device'); // 'mobile' or 'desktop'
    const limit = parseInt(searchParams.get('limit') || '100'); // Increased default limit
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';
    const requestUserId = searchParams.get('userId');
    
    console.log('[API /apps] GET request:', { tag, creatorId, search, deviceType, includeUnpublished, requestUserId, authUserId: userId });
    
    // Build query
    let query = supabase
      .from('apps')
      .select(`
        *,
        creator:profiles!apps_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `);
    
    // If includeUnpublished is true and userId matches, include unpublished apps
    if (includeUnpublished && requestUserId) {
      // Get published apps OR unpublished apps owned by the user
      query = query.or(`is_published.eq.true,and(is_published.eq.false,creator_id.eq.${requestUserId})`);
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
