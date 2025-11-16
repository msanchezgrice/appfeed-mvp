import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/src/lib/supabase-server';
import { runApp } from '@/src/lib/runner';
import { logEventServer } from '@/src/lib/metrics';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function nowHHMM() {
  const d = new Date();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function isWeekdayUTC() {
  const d = new Date();
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  return day >= 1 && day <= 5;
}

async function processCron({ keyFromClient }) {
  try {
    if (keyFromClient !== 'cron-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createAdminSupabaseClient();
    const targetAppIds = ['gratitude-daily-email', 'habit-builder-reminder'];
    const utcNowHHMM = nowHHMM();

    const results = [];

    // For each app, find users who saved it (as a proxy for "subscribed")
    for (const appId of targetAppIds) {
      // resolve app exists
      const { data: app } = await supabase.from('apps').select('*').eq('id', appId).single();
      if (!app) {
        results.push({ appId, status: 'app_not_found' });
        continue;
      }
      // users who saved the app
      const { data: saves } = await supabase
        .from('library_saves')
        .select('user_id')
        .eq('app_id', appId);
      const userIds = Array.from(new Set((saves || []).map(s => s.user_id))).filter(Boolean);
      if (userIds.length === 0) {
        results.push({ appId, status: 'no_subscribers' });
        continue;
      }
      // for each user, get last inputs for this app to determine schedule
      for (const userId of userIds) {
        try {
          const { data: lastRun } = await supabase
            .from('runs')
            .select('id, created_at, inputs')
            .eq('app_id', appId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const inputs = (lastRun?.inputs && typeof lastRun.inputs === 'object') ? lastRun.inputs : {};
          const sendTime = inputs.send_time || '08:00';
          const cadence = inputs.cadence || 'daily';
          const userEmail = inputs.email || null;

          if (!userEmail) {
            results.push({ appId, userId, status: 'skip_no_email' });
            continue;
          }

          // cadence guard
          if (cadence === 'weekdays' && !isWeekdayUTC()) {
            results.push({ appId, userId, status: 'skip_weekend' });
            continue;
          }

          // time guard: only run when HH:MM matches UTC now
          if (sendTime !== utcNowHHMM) {
            results.push({ appId, userId, status: 'skip_time_mismatch', now: utcNowHHMM, sendTime });
            continue;
          }

          // daily guard: do not run if we already have a run today for this user/app
          const todayIso = new Date().toISOString().slice(0, 10);
          const { data: todayRuns } = await supabase
            .from('runs')
            .select('id, created_at')
            .eq('app_id', appId)
            .eq('user_id', userId)
            .gte('created_at', `${todayIso}T00:00:00Z`);
          if (Array.isArray(todayRuns) && todayRuns.length > 0) {
            results.push({ appId, userId, status: 'skip_already_sent' });
            continue;
          }

          // execute with BYOK using runner directly (service role client)
          const run = await runApp({ app, inputs, userId, mode: 'use', supabase, fallbackAllowed: false });

          // save run
          await supabase.from('runs').insert({
            id: run.id,
            app_id: app.id,
            user_id: userId,
            mode: 'use',
            status: run.status,
            inputs: run.inputs,
            outputs: run.outputs,
            trace: run.trace,
            duration_ms: run.durationMs
          });

          // increment use_count
          const newUseCount = (app.use_count || 0) + 1;
          await supabase.from('apps').update({ use_count: newUseCount }).eq('id', app.id);

          // analytics
          logEventServer('app_run_use_cron', { appId: app.id });

          results.push({ appId, userId, status: 'sent', runId: run.id });
        } catch (err) {
          console.error('[CRON daily] Error processing', appId, userId, err);
          results.push({ appId, userId, status: 'error', error: String(err?.message || err) });
        }
      }
    }

    return NextResponse.json({ ok: true, nowUTC: utcNowHHMM, results });
  } catch (e) {
    console.error('[CRON daily] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  return processCron({ keyFromClient: body?.adminKey });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('adminKey') || searchParams.get('key');
  return processCron({ keyFromClient: key });
}


