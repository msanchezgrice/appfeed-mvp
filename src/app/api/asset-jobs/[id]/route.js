import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { fetchAppForAssets } from '@/src/lib/asset-kit';

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request, { params }) {
  try {
    const jobId = params.id;
    if (!jobId) return jsonError('Job ID is required', 400);

    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) return jsonError('Unauthorized', 401);

    const { data: job, error } = await supabase
      .from('asset_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) return jsonError('Job not found', 404);

    const app = await fetchAppForAssets(supabase, job.app_id);
    if (app.creator_id !== userId) return jsonError('Forbidden', 403);

    return NextResponse.json({ job });
  } catch (error) {
    console.error('[AssetJobs][ID][GET] Error:', error);
    const status = error?.status || 500;
    return jsonError(error?.message || 'Failed to load job', status);
  }
}
