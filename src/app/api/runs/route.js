import { runApp } from '@/src/lib/runner';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { uploadImageToStorage } from '@/src/lib/supabase-storage';
import sharp from 'sharp';
import { logEventServer } from '@/src/lib/metrics';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Get userId from Clerk auth (try authenticated first, fallback to anonymous)
    let supabase, userId;
    // Check device cookie to allow a single platform-fallback try
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader
        .split(';')
        .map(p => {
          const [k, ...rest] = p.trim().split('=');
          return [k, rest.join('=')];
        })
        .filter(([k]) => k)
    );
    const fallbackCookieUsed = cookies['cc_fallback_try_used'] === '1';
    const fallbackAllowed = !fallbackCookieUsed;
    
    try {
      const authResult = await createServerSupabaseClient();
      supabase = authResult.supabase;
      userId = authResult.userId;
      console.log('[API /runs] Auth result:', { userId: userId || 'NULL', hasSupabase: !!supabase });
    } catch (err) {
      console.log('[API /runs] Auth failed, using anonymous:', err.message);
      const anonResult = await createServerSupabaseClient({ allowAnonymous: true });
      supabase = anonResult.supabase;
      userId = null;
    }
    
    const body = await req.json();
    
    console.log('[API /runs] POST request:', {
      appId: body.appId,
      mode: body.mode,
      userId: userId || 'ANONYMOUS',
      hasInputs: !!body.inputs,
      clerkAuth: userId ? 'SUCCESS' : 'FAILED'
    });
    
    // Get app from database
    const { data: app, error } = await supabase
      .from('apps')
      .select('*')
      .eq('id', body.appId)
      .single();
    
    if (error || !app) {
      console.error('[API /runs] App not found:', body.appId, error);
      return new Response(JSON.stringify({ error: 'App not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[API /runs] App loaded:', {
      id: app.id,
      name: app.name,
      hasRuntime: !!app.runtime,
      steps: app.runtime?.steps?.length || 0
    });
    
    const inputs = body.inputs || {};
    const mode = body.mode === 'use' ? 'use' : 'try';
    
    console.log('[API /runs] Starting execution with inputs:', Object.keys(inputs));
    
    // Run the app
    const run = await runApp({ app, inputs, userId, mode, supabase, fallbackAllowed });
    
    console.log('[API /runs] Execution complete:', {
      runId: run.id,
      status: run.status,
      usedStub: run.trace?.[0]?.usedStub,
      hasOutput: !!run.outputs
    });
    
    // Save run to database (only for authenticated users)
    if (userId) {
      const { error: saveError } = await supabase
        .from('runs')
        .insert({
          id: run.id,
          app_id: app.id,
          user_id: userId,
          mode,
          status: run.status,
          inputs: run.inputs,
          outputs: run.outputs,
          trace: run.trace,
          duration_ms: run.durationMs
        });
      
      if (saveError) {
        console.error('Error saving run:', saveError);
      }
    } else {
      console.log('[API /runs] Skipping run save for anonymous user');
    }

    // Upload output asset (image) and input image (first image input) to storage
    // THIS RUNS FOR ALL RUNS with image outputs, not just when user clicks "Save"
    let assetUrl = null;
    let assetType = null;
    let inputAssetUrl = null;
    let inputAssetMime = null;
    try {
      // Output image
      const outImg = run?.outputs?.image;
      console.log('[API /runs] Checking for output image:', { 
        runId: run.id, 
        hasImage: !!outImg, 
        imageType: typeof outImg,
        startsWithData: typeof outImg === 'string' && outImg.startsWith('data:image/')
      });
      
      if (typeof outImg === 'string' && outImg.startsWith('data:image/')) {
        const re = new RegExp('^data:(image/[^;]+);base64,(.+)$');
        const match = outImg.match(re);
        if (match) {
          const mime = match[1];
          const b64 = match[2];
          const imageSizeKb = Math.round(b64.length * 0.75 / 1024); // Approximate size
          console.log('[API /runs] Processing output image:', { 
            runId: run.id, 
            mime, 
            sizeKb: imageSizeKb 
          });
          
          // compress to jpeg 70% width <= 1200
          const buffer = Buffer.from(b64, 'base64');
          const compressed = await sharp(buffer).resize(1200, null, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
          const compB64 = compressed.toString('base64');
          
          console.log('[API /runs] Uploading to storage...', { 
            runId: run.id, 
            compressedSizeKb: Math.round(compressed.length / 1024) 
          });
          
          const uploaded = await uploadImageToStorage(compB64, `run-assets/${run.id}`, 'image/jpeg');
          assetUrl = uploaded.url;
          assetType = 'image/jpeg';
          
          console.log('[API /runs] Upload successful:', { runId: run.id, assetUrl });
          
          await supabase.from('runs').update({ asset_url: assetUrl, asset_type: assetType }).eq('id', run.id);
          
          console.log('[API /runs] Database updated with asset_url');
        } else {
          console.warn('[API /runs] Image data URL format not recognized:', { runId: run.id });
        }
      } else if (outImg) {
        console.warn('[API /runs] Output image exists but not a data URL:', { 
          runId: run.id, 
          type: typeof outImg 
        });
      }
      // Input image (from app.inputs schema)
      if (app?.inputs && typeof run?.inputs === 'object') {
        for (const [key, spec] of Object.entries(app.inputs)) {
          if (spec?.type === 'image') {
            const val = run.inputs[key];
            if (typeof val === 'string' && val.startsWith('data:image/')) {
              const reIn = new RegExp('^data:(image/[^;]+);base64,(.+)$');
              const match = val.match(reIn);
              if (match) {
                const mime = match[1];
                const b64 = match[2];
                // light resize to 800 for caching
                const buffer = Buffer.from(b64, 'base64');
                const compressed = await sharp(buffer).resize(800, null, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
                const compB64 = compressed.toString('base64');
                const uploaded = await uploadImageToStorage(compB64, `run-inputs/${run.id}-${key}`, 'image/jpeg');
                inputAssetUrl = uploaded.url;
                inputAssetMime = 'image/jpeg';
                await supabase.from('runs').update({ input_asset_url: inputAssetUrl, input_asset_mime: inputAssetMime }).eq('id', run.id);
                break; // only first image input
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[API /runs] Asset upload error (non-fatal):', {
        error: err.message,
        stack: err.stack,
        runId: run?.id,
        hasOutputImage: !!run?.outputs?.image
      });
    }
    
    // Save assets to user library (for authenticated users)
    if (userId && (assetUrl || inputAssetUrl)) {
      try {
        // Save output image to user assets library
        if (assetUrl) {
          await supabase.from('user_assets').insert({
            user_id: userId,
            asset_type: 'output',
            source_type: 'generated',
            mime_type: assetType || 'image/jpeg',
            url: assetUrl,
            source_run_id: run.id,
            source_app_id: app.id
          }).select().single();
          console.log('[API /runs] Saved output to user assets library');
        }
        
        // Save input image to user assets library
        if (inputAssetUrl) {
          await supabase.from('user_assets').insert({
            user_id: userId,
            asset_type: 'input',
            source_type: 'upload',
            mime_type: inputAssetMime || 'image/jpeg',
            url: inputAssetUrl,
            source_run_id: run.id,
            source_app_id: app.id
          }).select().single();
          console.log('[API /runs] Saved input to user assets library');
        }
      } catch (err) {
        // Non-fatal - don't break the run if asset saving fails
        console.error('[API /runs] User assets save error (non-fatal):', err);
      }
    }
    
    // Increment try/use counters on apps table
    try {
      if (mode === 'try') {
        await supabase
          .from('apps')
          .update({ try_count: app.try_count + 1 })
          .eq('id', app.id);
      } else if (mode === 'use') {
        await supabase
          .from('apps')
          .update({ use_count: app.use_count + 1 })
          .eq('id', app.id);
      }
    } catch (err) {
      console.error('Error incrementing count:', err);
    }
    
    // Track analytics event
    if (userId) {
      try {
        await supabase.rpc('track_app_event', {
          p_app_id: app.id,
          p_user_id: userId,
          p_event_type: mode
        });
      } catch (err) {
        console.error('Analytics error:', err);
      }
    }
    // Vercel WA custom event (server-side)
    logEventServer(mode === 'try' ? 'app_run_try' : 'app_run_use', {
      appId: app.id
    });
    
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (fallbackAllowed && !userId && mode === 'try') {
      headers.append('Set-Cookie', 'cc_fallback_try_used=1; Path=/; Max-Age=31536000; SameSite=Lax');
    }
    return new Response(JSON.stringify({ ...run, asset_url: assetUrl, asset_type: assetType, input_asset_url: inputAssetUrl }), { headers });
  } catch (e) {
    console.error('Run error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(req) {
  try {
    // Use service-role client to read limited run fields for preset prefill and lists
    const { supabase, userId } = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('run');
    const appId = searchParams.get('appId') || searchParams.get('app_id');
    const mine = searchParams.get('mine');
    if (!id && !appId) {
      // If requesting user's assets
      if (mine === '1' || mine === 'true') {
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const { data: runs, error } = await supabase
          .from('runs')
          .select('id, app_id, created_at, asset_url, asset_type, input_asset_url, outputs')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(60);
        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to fetch runs' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ runs: runs || [] }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (id) {
      const { data: run, error } = await supabase
        .from('runs')
        .select('id, app_id, inputs, created_at, asset_url, asset_type, input_asset_url, outputs, trace, status')
        .eq('id', id)
        .single();
      if (error || !run) {
        return new Response(JSON.stringify({ error: 'Run not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ run }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // appId listing for the current user
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const { data: runs, error } = await supabase
        .from('runs')
        .select('id, app_id, created_at, asset_url, asset_type, input_asset_url, inputs')
        .eq('app_id', appId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch runs' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ runs: runs || [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.error('Run GET error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
