import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET single app
export async function GET(req, { params }) {
  try {
    const { supabase } = await createServerSupabaseClient({ allowAnonymous: true });
    const { id } = params;

    const { data: app, error } = await supabase
      .from('apps')
      .select(`
        *,
        html_content,
        creator:profiles!apps_creator_id_fkey (
          id,
          clerk_user_id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ app, creator: app.creator });
  } catch (error) {
    console.error('[API /apps/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch app' }, { status: 500 });
  }
}

// PATCH app (publish/unpublish)
export async function PATCH(req, { params }) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    const { id } = params;
    const { is_published } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this app or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    
    const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
    
    const { data: app } = await supabase
      .from('apps')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!app || (app.creator_id !== userId && !isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the app
    const { error } = await supabase
      .from('apps')
      .update({ is_published })
      .eq('id', id);

    if (error) {
      console.error('[API /apps/:id] Update error:', error);
      return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_published });
  } catch (error) {
    console.error('[API /apps/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

// DELETE app
export async function DELETE(req, { params }) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this app or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    const isAdmin = profile?.email === 'msanchezgrice@gmail.com';

    const { data: app } = await supabase
      .from('apps')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!app || (app.creator_id !== userId && !isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized - you can only delete your own apps' }, { status: 403 });
    }

    // Delete the app
    const { error } = await supabase
      .from('apps')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API /apps/:id] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'App deleted' });
  } catch (error) {
    console.error('[API /apps/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
  }
}
