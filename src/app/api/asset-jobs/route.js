import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import {
  fetchAppForAssets,
  processAssetJob,
  supportedJobTypes
} from '@/src/lib/asset-kit';

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function loadAssetsAndJobs(supabase, appId) {
  const [{ data: jobs }, { data: assets }] = await Promise.all([
    supabase
      .from('asset_jobs')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false }),
    supabase
      .from('app_assets')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false })
  ]);

  return { jobs: jobs || [], assets: assets || [] };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    if (!appId) return jsonError('appId is required', 400);

    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) return jsonError('Unauthorized', 401);

    const app = await fetchAppForAssets(supabase, appId);
    if (app.creator_id !== userId) return jsonError('Forbidden', 403);

    const data = await loadAssetsAndJobs(supabase, appId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[AssetJobs][GET] Error:', error);
    const status = error?.status || 500;
    return jsonError(error?.message || 'Failed to load asset jobs', status);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const appId = body.appId;
    const types = supportedJobTypes(body.types?.length ? body.types : ['poster', 'og', 'thumb']);
    if (!appId) return jsonError('appId is required', 400);
    if (!types.length) return jsonError('No valid job types provided', 400);

    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) return jsonError('Unauthorized', 401);

    const app = await fetchAppForAssets(supabase, appId);
    if (app.creator_id !== userId) return jsonError('Forbidden', 403);

    // Create job records
    const jobsToInsert = types.map((type) => ({
      app_id: appId,
      type,
      status: 'queued',
      created_by: userId,
      inputs: body.inputs || {}
    }));

    const { data: inserted, error } = await supabase
      .from('asset_jobs')
      .insert(jobsToInsert)
      .select();

    if (error) {
      console.error('[AssetJobs][POST] Insert error:', error);
      return jsonError('Failed to queue jobs', 500);
    }

    // Process sequentially (sync path for now)
    const processed = [];
    for (const job of inserted || []) {
      const result = await processAssetJob({ supabase, job, app, userId });
      processed.push(result);
    }

    const data = await loadAssetsAndJobs(supabase, appId);
    return NextResponse.json({
      jobs: processed,
      assets: data.assets
    });
  } catch (error) {
    console.error('[AssetJobs][POST] Error:', error);
    const status = error?.status || 500;
    return jsonError(error?.message || 'Failed to create asset jobs', status);
  }
}
