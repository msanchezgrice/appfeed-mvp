import sharp from 'sharp';
import { getDecryptedSecret } from './secrets';
import { uploadImageVariants } from './supabase-storage';
import { captureDemo } from './demo-capture';

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com';
const FALLBACK_OPENAI_KEY = process.env.OPENAI_FALLBACK_API_KEY || process.env.OPENAI_API_KEY || '';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const GEMINI_MAX_OUTPUT_TOKENS = 32768;

function ensureAppOwnership(app, userId) {
  if (!app) {
    const err = new Error('App not found');
    err.status = 404;
    throw err;
  }
  if (!userId || app.creator_id !== userId) {
    const err = new Error('You do not have permission to manage assets for this app');
    err.status = 403;
    throw err;
  }
}

export async function fetchAppForAssets(supabase, appId) {
  const { data: app, error } = await supabase
    .from('apps')
    .select('*')
    .eq('id', appId)
    .single();

  if (error || !app) {
    const err = new Error('App not found');
    err.status = 404;
    throw err;
  }

  return app;
}

export async function createOgAssetRecord({ supabase, app, userId, promptOverride, force }) {
  // If no prompt override and not forced, prefer existing OG asset or create simple OG link record
  if (!promptOverride && !force) {
    const { data: existing } = await supabase
      .from('app_assets')
      .select('*')
      .eq('app_id', app.id)
      .eq('kind', 'og')
      .order('created_at', { ascending: false })
      .limit(1);
    if (existing && existing.length) {
      return { asset: existing[0], url: existing[0].url };
    }
  }

  const envKey = process.env.GEMINI_API_KEY;
  let userKey = null;

  try {
    userKey = await getDecryptedSecret(userId, 'gemini', supabase);
  } catch (err) {
    console.warn('[AssetKit] Could not fetch user Gemini key:', err?.message || err);
  }

  const geminiApiKey = userKey || envKey;

  // Fallback: if no Gemini key, store dynamic OG endpoint
  if (!geminiApiKey) {
    const ogUrl = `${DEFAULT_SITE_URL}/api/og?app=${encodeURIComponent(app.id)}`;
    const payload = {
      app_id: app.id,
      kind: 'og',
      url: ogUrl,
      width: 1200,
      height: 630,
      mime_type: 'image/png',
      created_by: userId
    };
    const { data, error } = await supabase
      .from('app_assets')
      .insert(payload)
      .select()
      .single();
    if (error) {
      throw new Error(error.message || 'Failed to save OG asset record');
    }
    return { asset: data, url: ogUrl };
  }

  const basePrompt = `Generate a social sharing OG image (1200x630) for this app.

Name: ${app.name}
Description: ${app.description || 'Mobile app'}
Style: Clean, legible, strong contrast, include space for title.`;
  const prompt = promptOverride && String(promptOverride).trim()
    ? `${basePrompt}\n\nCREATOR NOTES: ${String(promptOverride).trim()}`
    : basePrompt;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\nQuality: high-res, balanced composition, readable text, no artifacts, allow space for title/description.` }] }],
        generationConfig: {
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
          imageConfig: { aspectRatio: '16:9' }
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini OG image error: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini did not return an OG image');
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const baseKey = `app-assets/${app.id}/og`;
  const { defaultUrl, urls, blurDataUrl, version } = await uploadImageVariants(buffer, baseKey);

  const payload = {
    app_id: app.id,
    kind: 'og',
    url: defaultUrl,
    mime_type: imagePart.inlineData.mimeType || 'image/webp',
    width: 1200,
    height: 630,
    blur_data_url: blurDataUrl,
    variant_id: version,
    prompt,
    created_by: userId
  };

  const { data: asset, error } = await supabase
    .from('app_assets')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to save OG asset');
  }

  return { asset, url: defaultUrl };
}

export async function createPosterAsset({ supabase, app, userId, promptOverride, force }) {
  // Return existing poster if already generated and not forcing a refresh
  if (!force && !promptOverride) {
    const { data: existing } = await supabase
      .from('app_assets')
      .select('*')
      .eq('app_id', app.id)
      .eq('kind', 'poster')
      .order('created_at', { ascending: false })
      .limit(1);
    if (existing && existing.length) {
      return { asset: existing[0], urls: { 720: existing[0].url }, blur: existing[0].blur_data_url };
    }
  }

  const envKey = process.env.GEMINI_API_KEY;
  let userKey = null;

  try {
    userKey = await getDecryptedSecret(userId, 'gemini', supabase);
  } catch (err) {
    console.warn('[AssetKit] Could not fetch user Gemini key:', err?.message || err);
  }

  const geminiApiKey = userKey || envKey;
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const basePrompt = `Generate an elevated, mobile-first marketing poster for this app.

Name: ${app.name}
Description: ${app.description || 'Mobile app'}

Style: 1080x1350 poster, clean, premium, high-contrast text, space for QR code.
Mood: Aspirational and clear. Text legible.`;

  const prompt = promptOverride && String(promptOverride).trim()
    ? `${basePrompt}\n\nCREATOR NOTES: ${String(promptOverride).trim()}`
    : basePrompt;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${prompt}\n\nQuality: high-res, balanced composition, readable text, no artifacts, allow space for QR/title.` }]
        }],
        generationConfig: {
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
          imageConfig: {
            aspectRatio: '3:4'
          }
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini image error: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini did not return an image');
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const metadata = await sharp(buffer).metadata();
  const baseKey = `app-assets/${app.id}/poster`;
  const { defaultUrl, urls, blurDataUrl, version } = await uploadImageVariants(buffer, baseKey);

  const payload = {
    app_id: app.id,
    kind: 'poster',
    url: defaultUrl,
    mime_type: imagePart.inlineData.mimeType || 'image/webp',
    width: metadata.width || null,
    height: metadata.height || null,
    blur_data_url: blurDataUrl,
    variant_id: version,
    prompt,
    created_by: userId
  };

  const { data: asset, error } = await supabase
    .from('app_assets')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to save poster asset');
  }

  return {
    asset,
    urls,
    blur: blurDataUrl
  };
}

async function fetchImageBuffer(srcUrl) {
  if (!srcUrl) throw new Error('No source image URL provided');
  const res = await fetch(srcUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch image (${res.status})`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

export async function createThumbAsset({ supabase, app, userId, promptOverride, force }) {
  // If no prompt, derive from existing preview
  if (!promptOverride && !force) {
    const source = app.preview_url || app.preview_image || null;
    if (!source) {
      throw new Error('No preview image available to create thumbnail');
    }
    const buffer = await fetchImageBuffer(source);
    const square = await sharp(buffer)
      .resize({ width: 720, height: 720, fit: 'cover', position: 'center' })
      .webp({ quality: 70 })
      .toBuffer();
    const baseKey = `app-assets/${app.id}/thumb`;
    const { defaultUrl, urls, blurDataUrl, version } = await uploadImageVariants(square, baseKey);
    const payload = {
      app_id: app.id,
      kind: 'thumb',
      url: defaultUrl,
      mime_type: 'image/webp',
      width: 720,
      height: 720,
      blur_data_url: blurDataUrl,
      variant_id: version,
      prompt: null,
      created_by: userId
    };
    const { data: asset, error } = await supabase
      .from('app_assets')
      .insert(payload)
      .select()
      .single();
    if (error) {
      throw new Error(error.message || 'Failed to save thumbnail asset');
    }
    return { asset, urls, blur: blurDataUrl };
  }

  // Prompt-based generation via Gemini (1:1)
  const envKey = process.env.GEMINI_API_KEY;
  let userKey = null;
  try {
    userKey = await getDecryptedSecret(userId, 'gemini', supabase);
  } catch (err) {
    console.warn('[AssetKit] Could not fetch user Gemini key for thumb:', err?.message || err);
  }
  const geminiApiKey = userKey || envKey;
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured for thumbnail generation');
  }
  const prompt = `Generate a square thumbnail/shelf image for this app. App: ${app.name}. Description: ${app.description || ''}. Creator notes: ${String(promptOverride).trim()}. Quality: crisp, clean gradient, no artifacts, clear icon/mark.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
          imageConfig: { aspectRatio: '1:1' }
        }
      })
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini thumb error: ${errorText.slice(0, 200)}`);
  }
  const data = await response.json();
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini did not return a thumbnail image');
  }
  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const baseKey = `app-assets/${app.id}/thumb`;
  const { defaultUrl, urls, blurDataUrl, version } = await uploadImageVariants(buffer, baseKey);
  const payload = {
    app_id: app.id,
    kind: 'thumb',
    url: defaultUrl,
    mime_type: imagePart.inlineData.mimeType || 'image/webp',
    width: 720,
    height: 720,
    blur_data_url: blurDataUrl,
    variant_id: version,
    prompt: promptOverride || null,
    created_by: userId
  };
  const { data: asset, error } = await supabase
    .from('app_assets')
    .insert(payload)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || 'Failed to save thumbnail asset');
  }
  return { asset, urls, blur: blurDataUrl };
}

export async function processAssetJob({ supabase, job, app, userId }) {
  ensureAppOwnership(app, userId);

  // Mark in progress
  await supabase
    .from('asset_jobs')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      error: null
    })
    .eq('id', job.id);

  try {
    let outputs = null;

    if (job.type === 'poster') {
      const promptOverride = job.inputs && typeof job.inputs.prompt === 'string' ? job.inputs.prompt : null;
      const force = !!(job.inputs && job.inputs.force);
      outputs = await createPosterAsset({ supabase, app, userId, promptOverride, force });
    } else if (job.type === 'og') {
      const promptOverride = job.inputs && typeof job.inputs.prompt === 'string' ? job.inputs.prompt : null;
      const force = !!(job.inputs && job.inputs.force);
      outputs = await createOgAssetRecord({ supabase, app, userId, promptOverride, force });
    } else if (job.type === 'thumb') {
      const promptOverride = job.inputs && typeof job.inputs.prompt === 'string' ? job.inputs.prompt : null;
      const force = !!(job.inputs && job.inputs.force);
      outputs = await createThumbAsset({ supabase, app, userId, promptOverride, force });
    } else if (job.type === 'demo' || job.type === 'gif') {
      const script = job.inputs || {};
      const demo = await captureDemo({ appId: app.id, userId, supabase, script });
      const assets = [];
      if (demo.poster) {
        const { data: posterAsset, error: posterError } = await supabase
          .from('app_assets')
          .insert({
            app_id: app.id,
            kind: 'demo',
            url: demo.poster.url,
            mime_type: demo.poster.mime_type || 'image/webp',
            blur_data_url: demo.poster.blur || null,
            variant_id: demo.poster.version || null,
            created_by: userId
          })
          .select()
          .single();
        if (posterError) throw posterError;
        assets.push(posterAsset);
      }
      if (demo.gif?.url) {
        const { data: gifAsset, error: gifError } = await supabase
          .from('app_assets')
          .insert({
            app_id: app.id,
            kind: 'gif',
            url: demo.gif.url,
            mime_type: demo.gif.mime_type || 'image/gif',
            created_by: userId
          })
          .select()
          .single();
        if (gifError) throw gifError;
        assets.push(gifAsset);
      }
      outputs = { assets };
    } else {
      throw new Error(`Unsupported job type: ${job.type}`);
    }

    const { data: updated } = await supabase
      .from('asset_jobs')
      .update({
        status: 'complete',
        outputs,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)
      .select()
      .single();

    return updated || { ...job, status: 'complete', outputs };
  } catch (error) {
    const { data: failed } = await supabase
      .from('asset_jobs')
      .update({
        status: 'failed',
        error: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)
      .select()
      .single();

    return failed || { ...job, status: 'failed', error: error.message };
  }
}

export function supportedJobTypes(types = []) {
  const allowed = new Set(['poster', 'og', 'demo', 'gif', 'thumb', 'copy']);
  return (Array.isArray(types) ? types : [])
    .map((t) => String(t || '').trim().toLowerCase())
    .filter((t) => allowed.has(t));
}
