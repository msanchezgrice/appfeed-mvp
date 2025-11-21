import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { fetchAppForAssets, processAssetJob } from '@/src/lib/asset-kit';

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) return jsonError('Unauthorized', 401);

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 3, 10);

    const { data: jobs } = await supabase
      .from('asset_jobs')
      .select('*')
      .eq('status', 'queued')
      .eq('created_by', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (!jobs || !jobs.length) {
      return NextResponse.json({ processed: [] });
    }

    const processed = [];
    for (const job of jobs) {
      const app = await fetchAppForAssets(supabase, job.app_id);
      if (app.creator_id !== userId) {
        processed.push({ ...job, status: 'failed', error: 'Forbidden' });
        continue;
      }
      const result = await processAssetJob({ supabase, job, app, userId });
      processed.push(result);
    }

    return NextResponse.json({ processed });
  } catch (error) {
    console.error('[AssetJobs][PROCESS] Error:', error);
    const status = error?.status || 500;
    return jsonError(error?.message || 'Failed to process jobs', status);
  }
}
