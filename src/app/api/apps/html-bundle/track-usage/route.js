import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Track usage for HTML bundle apps
 * Increments usage_count and tracks in PostHog
 */
export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient({ allowAnonymous: true });
    const body = await req.json();
    const { appId } = body;

    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 });
    }

    // Get current app data
    const { data: app, error: fetchError } = await supabase
      .from('apps')
      .select('id, runtime, name')
      .eq('id', appId)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Check if it's an HTML bundle app
    if (app.runtime?.engine !== 'html-bundle') {
      return NextResponse.json({ error: 'Not an HTML bundle app' }, { status: 400 });
    }

    const usageCount = app.runtime?.usage_count || 0;
    const usageLimit = app.runtime?.usage_limit || 100;

    // Check usage limit
    if (usageCount >= usageLimit) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        usageCount,
        usageLimit 
      }, { status: 429 });
    }

    // Increment usage count
    const updatedRuntime = {
      ...app.runtime,
      usage_count: usageCount + 1,
      last_used_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('apps')
      .update({ runtime: updatedRuntime })
      .eq('id', appId);

    if (updateError) {
      console.error('[HTML Bundle] Failed to update usage count:', updateError);
      return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
    }

    // Track in analytics (server-side)
    try {
      await supabase.rpc('track_app_event', {
        p_app_id: appId,
        p_user_id: userId || 'anonymous',
        p_event_type: 'html_bundle_run'
      });
    } catch (analyticsError) {
      // Don't fail the request if analytics fails
      console.error('[HTML Bundle] Analytics error:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      usageCount: usageCount + 1,
      usageLimit,
      remaining: usageLimit - (usageCount + 1)
    });

  } catch (error) {
    console.error('[HTML Bundle] Track usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track usage' },
      { status: 500 }
    );
  }
}

