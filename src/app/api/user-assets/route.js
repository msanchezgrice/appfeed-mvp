import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { uploadImageVariants } from '@/src/lib/supabase-storage';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/user-assets?type=input|output&limit=20&offset=0
export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'input', 'output', or null for all
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const favoritesOnly = searchParams.get('favorites') === 'true';

    // Build query
    let query = supabase
      .from('user_assets')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false });

    if (type) {
      query = query.eq('asset_type', type);
    }

    if (favoritesOnly) {
      query = query.eq('is_favorite', true);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: assets, error, count } = await query;

    if (error) {
      console.error('[user-assets] GET error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assets: assets || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    });
  } catch (e) {
    console.error('[user-assets] GET exception:', e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// POST /api/user-assets
// Actions: save, delete, favorite, unfavorite
export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, assetId, asset, source, filename, assetType, sourceRunId, sourceAppId } = body;

    // ============================================
    // ACTION: SAVE NEW ASSET
    // ============================================
    if (action === 'save') {
      if (!asset || !source) {
        return NextResponse.json(
          { error: 'asset and source required' },
          { status: 400 }
        );
      }

      // Parse data URL
      const dataUrlRegex = /^data:(image\/[^;]+);base64,(.+)$/;
      const match = asset.match(dataUrlRegex);
      
      if (!match) {
        return NextResponse.json(
          { error: 'Invalid image data' },
          { status: 400 }
        );
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Calculate content hash for deduplication
      const contentHash = crypto.createHash('sha1').update(buffer).digest('hex');

      // Check for existing asset with same hash
      const { data: existingAsset } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('content_hash', contentHash)
        .single();

      if (existingAsset) {
        // Asset already exists, just update last_used_at
        await supabase
          .from('user_assets')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', existingAsset.id);

        return NextResponse.json({
          asset: existingAsset,
          deduplicated: true
        });
      }

      // Get image dimensions
      const metadata = await sharp(buffer).metadata();

      // Upload optimized variants
      const timestamp = Date.now();
      const assetDir = assetType === 'output' ? 'outputs' : 'uploads';
      const baseKey = `user-assets/${userId}/${assetDir}/${timestamp}`;
      const { defaultUrl, urls, blurDataUrl } = await uploadImageVariants(buffer, baseKey);

      // Save to database
      const { data: newAsset, error: saveError } = await supabase
        .from('user_assets')
        .insert({
          user_id: userId,
          asset_type: assetType || 'input',
          source_type: source,
          mime_type: mimeType,
          url: defaultUrl,
          url_360: urls[360],
          url_1080: urls[1080],
          blur_data_url: blurDataUrl,
          original_filename: filename || 'upload.jpg',
          file_size_bytes: buffer.length,
          width: metadata.width,
          height: metadata.height,
          content_hash: contentHash,
          source_run_id: sourceRunId || null,
          source_app_id: sourceAppId || null
        })
        .select()
        .single();

      if (saveError) {
        console.error('[user-assets] Save error:', saveError);
        return NextResponse.json(
          { error: 'Failed to save asset' },
          { status: 500 }
        );
      }

      console.log('[user-assets] Saved new asset:', newAsset.id);

      return NextResponse.json({
        asset: newAsset,
        deduplicated: false
      });
    }

    // ============================================
    // ACTION: DELETE ASSET
    // ============================================
    if (action === 'delete') {
      if (!assetId) {
        return NextResponse.json(
          { error: 'assetId required' },
          { status: 400 }
        );
      }

      const { error: deleteError } = await supabase
        .from('user_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', userId); // Ensure user owns the asset

      if (deleteError) {
        console.error('[user-assets] Delete error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete asset' },
          { status: 500 }
        );
      }

      // TODO: Also delete from storage bucket (cleanup job)

      return NextResponse.json({ success: true });
    }

    // ============================================
    // ACTION: FAVORITE / UNFAVORITE
    // ============================================
    if (action === 'favorite' || action === 'unfavorite') {
      if (!assetId) {
        return NextResponse.json(
          { error: 'assetId required' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('user_assets')
        .update({ is_favorite: action === 'favorite' })
        .eq('id', assetId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[user-assets] Favorite error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update asset' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // ============================================
    // ACTION: UPDATE LAST USED
    // ============================================
    if (action === 'use') {
      const { assetUrl } = body;
      
      if (!assetUrl) {
        return NextResponse.json(
          { error: 'assetUrl required' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('user_assets')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('url', assetUrl);

      if (updateError) {
        console.error('[user-assets] Update last_used error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update asset' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (e) {
    console.error('[user-assets] POST exception:', e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

