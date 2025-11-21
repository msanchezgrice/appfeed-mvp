import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import sharp from 'sharp';
import { getDecryptedSecret } from '@/src/lib/secrets';
import { logEventServer } from '@/src/lib/metrics';
import { uploadHtmlToStorage } from '@/src/lib/supabase-storage';
import { AI_TOOL_MAP, DEFAULT_AI_TOOLS } from '@/src/lib/publish-tools';

export const maxDuration = 60; // Allow up to 60 seconds for image generation

// Helper function to compress base64 image
async function compressImage(base64Data, mimeType) {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Compress using sharp - convert to JPEG with 70% quality, max width 800px
    const compressed = await sharp(buffer)
      .resize(800, null, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 70 })
      .toBuffer();
    
    // Convert back to base64
    const compressedBase64 = compressed.toString('base64');
    return `data:image/jpeg;base64,${compressedBase64}`;
  } catch (err) {
    console.error('[Compress] Error:', err);
    // Return original if compression fails
    return `data:${mimeType};base64,${base64Data}`;
  }
}

// Basic manifest sanitization and defaults
function sanitizeManifest(raw, allowedTools = DEFAULT_AI_TOOLS) {
  const manifest = typeof raw === 'object' && raw ? raw : {};
  const safeString = (v, d = '') => (typeof v === 'string' && v.trim() ? v.trim() : d);
  const safeArray = (v) => Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : [];
  const safeObject = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  const allowedToolList = (Array.isArray(allowedTools) && allowedTools.length ? allowedTools : DEFAULT_AI_TOOLS)
    .filter(tool => AI_TOOL_MAP[tool]);
  if (allowedToolList.length === 0) {
    allowedToolList.push(DEFAULT_AI_TOOLS[0] || 'llm.complete');
  }
  const allowedToolSet = new Set(allowedToolList);
  
  const outputs = safeObject(manifest.outputs);
  const demo = safeObject(manifest.demo);
  if (!demo.sampleInputs || typeof demo.sampleInputs !== 'object') {
    demo.sampleInputs = {};
  }
  const design = safeObject(manifest.design);
  if (!design.containerColor) {
    design.containerColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  if (!design.fontColor) {
    design.fontColor = 'white';
  }
  if (!design.fontFamily) {
    design.fontFamily = 'inherit';
  }
  if (!design.inputLayout) {
    design.inputLayout = 'vertical';
  }
  const runtime = safeObject(manifest.runtime);
  if (!runtime.engine) {
    runtime.engine = 'local';
  }
  if (!Array.isArray(runtime.steps)) {
    runtime.steps = [];
  }
  runtime.steps = runtime.steps
    .filter(step => step && allowedToolSet.has(step.tool))
    .map((step, index) => ({
      tool: step.tool,
      args: safeObject(step.args),
      output: safeString(step.output, step.tool === 'image.process' ? `image_${index || 'result'}` : 'result')
    }));
  if (runtime.steps.length === 0) {
    const fallbackTool = allowedToolList[0];
    runtime.steps.push({
      tool: fallbackTool,
      args: fallbackTool === 'image.process'
        ? { instruction: 'Transform the uploaded image or create a fresh concept based on user inputs.' }
        : { prompt: 'Summarize the provided inputs in a helpful way.' },
      output: fallbackTool === 'image.process' ? 'image' : 'markdown'
    });
  }
  const usesImageTool = runtime.steps.some(step => step.tool === 'image.process');
  const usesTextTool = runtime.steps.some(step => step.tool !== 'image.process');
  if (usesImageTool && !outputs.image) {
    outputs.image = { type: 'image' };
  }
  if (usesTextTool && !outputs.markdown) {
    outputs.markdown = { type: 'string' };
  }
  if (!Object.keys(outputs).length) {
    outputs.markdown = { type: 'string' };
  }
  const inputs = safeObject(manifest.inputs);
  
  return {
    name: safeString(manifest.name, 'AI App'),
    description: safeString(manifest.description, 'App generated from your prompt'),
    tags: safeArray(manifest.tags),
    design,
    preview_gradient: safeString(
      manifest.preview_gradient,
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    ),
    modal_theme: safeObject(manifest.modal_theme),
    input_theme: safeObject(manifest.input_theme),
    demo,
    inputs,
    outputs,
    runtime
  };
}

async function generateManifestWithAnthropic({ prompt, userId, supabase, toolWhitelist }) {
  const envKey = process.env.ANTHROPIC_API_KEY;
  const userKey = await getDecryptedSecret(userId, 'anthropic', supabase);
  const apiKey = userKey || envKey;
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Add it in Profile → Secrets.');
  }
  console.log('[AI Publish] Anthropic key source:', userKey ? 'user-secret' : (envKey ? 'env' : 'none'));
  
  // Pull light-weight user profile for context (author attribution)
  let userMeta = { id: userId, username: `user_${String(userId || '').slice(-8)}`, display_name: null };
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .single();
    if (profile) {
      userMeta.username = profile.username || userMeta.username;
      userMeta.display_name = profile.display_name || null;
    }
  } catch (e) {
    console.warn('[AI Publish] Failed to fetch profile for prompt context:', e?.message || e);
  }
  
  // Pull a few existing apps to bias the shape and fields
  let examples = [];
  try {
    const { data: sampleApps } = await supabase
      .from('apps')
      .select('name, description, tags, design, preview_gradient, inputs, outputs, runtime')
      .eq('is_published', true)
      .limit(3);
    if (Array.isArray(sampleApps)) {
      examples = sampleApps.map(a => ({
        name: a.name,
        description: a.description,
        tags: a.tags,
        design: a.design,
        preview_gradient: a.preview_gradient,
        inputs: a.inputs,
        outputs: a.outputs,
        runtime: a.runtime
      }));
    }
  } catch (e) {
    console.warn('[AI Publish] Could not load example apps:', e?.message || e);
  }

  const allowedToolIds = (Array.isArray(toolWhitelist) && toolWhitelist.length ? toolWhitelist : DEFAULT_AI_TOOLS)
    .filter(tool => AI_TOOL_MAP[tool]);
  if (allowedToolIds.length === 0) {
    allowedToolIds.push(DEFAULT_AI_TOOLS[0] || 'llm.complete');
  }
  const allowedToolMeta = allowedToolIds.map(id => AI_TOOL_MAP[id]).filter(Boolean);
  const toolNames = allowedToolMeta.map(meta => `"${meta.id}"`).join(', ');
  const toolGuidance = allowedToolMeta
    .map(meta => `- ${meta.id}: ${meta.description} ${meta.promptHint}`)
    .join(' ');
  const outputGuidance = allowedToolMeta
    .map(meta => {
      if (meta.outputType === 'image') {
        return `- ${meta.id} produces images → include outputs.image { type: "image" } and bind that step's output there.`;
      }
      return `- ${meta.id} produces markdown/text → include outputs.markdown { type: "string" } (or similar) for that step.`;
    })
    .join(' ');
  
  const system = [
    'You are Clipcade’s app manifest generator.',
    'Return ONLY a valid JSON object matching the required schema.',
    'Use concise, production-ready values.',
    `Supported runtime tools (user-selected): ${toolNames}. DO NOT reference other tools.`,
    toolGuidance ? `TOOL DETAILS: ${toolGuidance}` : '',
    outputGuidance ? `OUTPUT MAPPING: ${outputGuidance}` : '',
    'If unsure for outputs, default to { "markdown": { "type": "string" } }.{',
    'SCHEMA RULES:',
    '- Editable: name, description, tags, preview_url, preview_gradient, design.containerColor, design.fontColor, design.fontFamily, design.inputLayout, modal_theme.*, input_theme.*',
    '- Locked (do not mark as editable): container size, layout structure, and core logic in runtime steps',
    '- Inputs: Use supported types only: string | number | boolean | enum | file(image/video) when needed',
    '- Runtime: Prefer local engine; steps must use only the allowed tools listed above; define deterministic, minimal steps',
    '- Outputs: Match outputs to the tools you include (image outputs for image.process, markdown for llm.complete) and only add required fields',
    '- Demo: Provide sampleInputs that satisfy inputs',
    '}', 
  ].filter(Boolean).join(' ');
  
  const examplePrimaryTool = allowedToolMeta[0]?.id || 'llm.complete';
  const exampleOutputKey = allowedToolMeta[0]?.outputType === 'image' ? 'image' : 'markdown';
  const exampleOutputs = {
    [exampleOutputKey]: allowedToolMeta[0]?.outputType === 'image' ? { type: 'image' } : { type: 'string' }
  };
  const exampleToolArgs = examplePrimaryTool === 'image.process'
    ? { instruction: 'Create a polished visual for {{topic}}.' }
    : { prompt: 'Answer clearly about {{topic}}.' };
  
  const example = {
    name: "My App Name",
    description: "What it does in 1-2 sentences",
    tags: ["category1","category2"],
    design: {
      containerColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontColor: "white",
      fontFamily: "system-ui",
      inputLayout: "vertical"
    },
    preview_gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    modal_theme: { backgroundColor: "#1a2332", buttonColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", accentColor: "#667eea" },
    input_theme: { borderColor: "#333", backgroundColor: "#1a1a1a" },
    demo: { sampleInputs: {} },
    inputs: {
      topic: { type: "string", label: "Topic", placeholder: "Describe the subject...", required: true }
    },
    outputs: exampleOutputs,
    runtime: {
      engine: "local",
      steps: [{
        tool: examplePrimaryTool,
        args: exampleToolArgs,
        output: exampleOutputKey
      }]
    }
  };
  
  const userMsg = [
    'Create a Clipcade app manifest from this prompt.',
    'Prompt:',
    JSON.stringify(prompt),
    '',
    'User context:',
    JSON.stringify({ username: userMeta.username, display_name: userMeta.display_name }),
    '',
    'User-selected runtime tools (restrict yourself to these):',
    JSON.stringify(allowedToolIds),
    '',
    'Return ONLY JSON with fields:',
    'name, description, tags, design, preview_gradient, modal_theme, input_theme, demo, inputs, outputs, runtime',
    '',
    'Example JSON (shape only, adapt to the prompt):',
    JSON.stringify(example),
    '',
    'Here are a few existing apps for reference (use only as loose guidance for shape and field naming, not content):',
    JSON.stringify(examples)
  ].join('\n');
  
  const modelPrimary = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
  const modelFallback = 'claude-3-5-sonnet-latest';
  const modelSecondFallback = 'claude-sonnet-4-5';
  console.log('[AI Publish] Model selection:', { primary: modelPrimary, fallback: modelFallback, second_fallback: modelSecondFallback });
  
  function tryParseJsonLoose(text) {
    try {
      return JSON.parse(text);
    } catch {
      // Try to extract first JSON object block
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = text.slice(start, end + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          // Try removing code fences
          const cleaned = candidate.replace(/```(?:json)?/g, '');
          try {
            return JSON.parse(cleaned);
          } catch {
            return {};
          }
        }
      }
      return {};
    }
  }
  
  async function callAnthropic(model) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        temperature: 0.2,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error (${model}): ${text}`);
    }
    const data = await res.json();
    const content = data?.content?.[0]?.text || '';
    return tryParseJsonLoose(content || '{}');
  }
  
  try {
    return await callAnthropic(modelPrimary);
  } catch (e) {
    console.error('[AI Publish] Anthropic primary model failed, falling back:', e?.message || e);
    try {
      return await callAnthropic(modelFallback);
    } catch (e2) {
      console.error('[AI Publish] Anthropic first fallback failed, second fallback:', e2?.message || e2);
      return await callAnthropic(modelSecondFallback);
    }
  }
}

export async function POST(request) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();

    const { mode, appData } = body;
    
    console.log('[Publish] Request received:', { 
      mode, 
      userId,
      hasAppData: !!appData,
      appDataKeys: Object.keys(appData || {})
    });

    // Generate app ID
    const appName = appData.name || appData.analysisResult?.name || 'app';
    const appId = `${appName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

    // Create app object based on mode
    let newApp;

    // helper: infer render_type from name/description/tags
    const inferRenderType = (name, desc, tags=[]) => {
      const s = `${name || ''} ${desc || ''}`.toLowerCase();
      const t = (tags || []).map(x => String(x||'').toLowerCase());
      if (s.includes('wordle') || t.includes('wordle')) return 'wordle';
      if (s.includes('flappy') || t.includes('arcade') || s.includes('arcade')) return 'flappy';
      if (s.includes('chat') || t.includes('chat')) return 'chat';
      return null;
    };

    if (mode === 'inline') {
      // Parse manifest JSON
      let manifest;
      try {
        manifest = JSON.parse(appData.manifestJson);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid manifest JSON' }, { status: 400 });
      }

      // Backfill render_type
      const inferred = inferRenderType(appData.name, appData.description, appData.tags ? appData.tags.split(',').map(t=>t.trim()) : []);
      if (inferred) {
        manifest.runtime = manifest.runtime || {};
        manifest.runtime.render_type = manifest.runtime.render_type || inferred;
      }

      newApp = {
        id: appId,
        name: appData.name,
        creator_id: userId,
        description: appData.description,
        tags: appData.tags ? appData.tags.split(',').map(t => t.trim()) : [],
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        demo: manifest.demo || { sampleInputs: {} },
        inputs: manifest.inputs || {},
        outputs: manifest.outputs || { markdown: { type: 'string' } },
        runtime: manifest.runtime || {},
        fork_of: null
      };
    } else if (mode === 'ai') {
      // Generate via Anthropic (Sonnet)
      const prompt = appData.prompt;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return NextResponse.json({ error: 'Prompt is required for AI generation' }, { status: 400 });
      }
      const requestedTools = Array.isArray(appData.tools) ? appData.tools : [];
      const toolWhitelist = (requestedTools.length ? requestedTools : DEFAULT_AI_TOOLS)
        .filter(tool => AI_TOOL_MAP[tool]);
      if (toolWhitelist.length === 0) {
        toolWhitelist.push(DEFAULT_AI_TOOLS[0] || 'llm.complete');
      }
      
      let rawManifest = {};
      try {
        rawManifest = await generateManifestWithAnthropic({ prompt, userId, supabase, toolWhitelist });
      } catch (err) {
        console.error('[AI Publish] Manifest generation error:', err);
        return NextResponse.json({ error: 'Failed to generate manifest with AI' }, { status: 502 });
      }
      
      const manifest = sanitizeManifest(rawManifest, toolWhitelist);
      const aiName = manifest.name || 'AI App';
      const aiId = `${aiName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
      
      // Backfill render_type
      const inferred = inferRenderType(aiName, manifest.description, (appData.tags ? appData.tags.split(',').map(t => t.trim()) : manifest.tags || []));
      if (inferred) {
        manifest.runtime = manifest.runtime || { engine: 'local', steps: [] };
        manifest.runtime.render_type = manifest.runtime.render_type || inferred;
      }

      newApp = {
        id: aiId,
        name: aiName,
        creator_id: userId,
        description: manifest.description,
        tags: (appData.tags ? appData.tags.split(',').map(t => t.trim()) : manifest.tags || []).filter(Boolean),
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop',
        preview_gradient: manifest.preview_gradient || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        demo: manifest.demo || { sampleInputs: {} },
        inputs: manifest.inputs || {},
        outputs: manifest.outputs || { markdown: { type: 'string' } },
        runtime: manifest.runtime || { engine: 'local', steps: [] },
        design: manifest.design || {},
        modal_theme: manifest.modal_theme || {},
        input_theme: manifest.input_theme || {},
        fork_of: null,
        is_published: true
      };
    } else if (mode === 'remote') {
      newApp = {
        id: appId,
        name: `Remote: ${appData.remoteUrl}`,
        creator_id: userId,
        description: 'Remote adapter app',
        tags: appData.tags ? appData.tags.split(',').map(t => t.trim()) : [],
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        demo: { sampleInputs: {} },
        inputs: {},
        outputs: { markdown: { type: 'string' } },
        runtime: {
          engine: 'remote',
          url: appData.remoteUrl
        },
        fork_of: null
      };
    } else if (mode === 'github') {
      // GitHub analysis result contains the manifest
      const manifest = appData.analysisResult?.manifest || {};
      const analysisName = appData.analysisResult?.name || appData.name || 'GitHub App';
      const analysisDescription = appData.analysisResult?.description || appData.description || 'AI-generated app from GitHub';
      const analysisTags = appData.tags ? appData.tags.split(',').map(t => t.trim()) : (appData.analysisResult?.tags || ['github', 'ai-generated']);

      // Backfill render_type
      const inferred = inferRenderType(analysisName, analysisDescription, analysisTags);
      if (inferred) {
        manifest.runtime = manifest.runtime || {};
        manifest.runtime.render_type = manifest.runtime.render_type || inferred;
      }

      newApp = {
        id: appId,
        name: analysisName,
        creator_id: userId,
        description: analysisDescription,
        tags: analysisTags,
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        demo: manifest.demo || { sampleInputs: {} },
        inputs: manifest.inputs || {},
        outputs: manifest.outputs || { markdown: { type: 'string' } },
        runtime: manifest.runtime || {
          engine: 'remote',
          url: manifest.run?.url || ''
        },
        fork_of: null,
        github_url: appData.githubUrl,
        is_published: true
      };
    } else if (mode === 'remote-url') {
      // Deploy from URL - iframe external hosted apps (Cloud Run, Vercel, etc.)
      newApp = {
        id: appId,
        name: appData.name,
        creator_id: userId,
        description: appData.description,
        tags: appData.tags ? appData.tags.split(',').map(t => t.trim()) : [],
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        demo: { sampleInputs: {} },
        inputs: {},
        outputs: { iframe: { type: 'iframe' } },
        runtime: {
          engine: 'iframe',
          render_type: 'iframe',
          url: appData.externalUrl
        },
        fork_of: null,
        is_published: true
      };
    } else if (mode === 'html-bundle') {
      // HTML Bundle - store directly in database TEXT column
      const htmlSize = Buffer.byteLength(appData.htmlContent, 'utf8');
      
      // Size limit: 5MB
      if (htmlSize > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'HTML content too large. Maximum size is 5MB.' }, { status: 400 });
      }

      // Note: Supabase Storage is too restrictive (only allows image/video MIME types)
      // We'll store HTML in a dedicated TEXT column instead
      console.log('[Publish] Storing HTML in database (size:', Math.round(htmlSize / 1024), 'KB)');

      newApp = {
        id: appId,
        name: appData.name,
        creator_id: userId,
        description: appData.description,
        tags: appData.tags ? appData.tags.split(',').map(t => t.trim()) : [],
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        demo: { sampleInputs: {} },
        inputs: {},
        outputs: { html: { type: 'html' } },
        runtime: {
          engine: 'html-bundle',
          render_type: 'html-bundle',
          usage_count: 0,
          usage_limit: 100 // 100 runs per app
        },
        html_content: appData.htmlContent, // Store in dedicated TEXT column
        fork_of: null,
        is_published: true
      };
    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    // Insert app into Supabase
    const { data: insertedApp, error } = await supabase
      .from('apps')
      .insert(newApp)
      .select()
      .single();

    if (error) {
      console.error('Error inserting app:', error);
      return NextResponse.json({ error: 'Failed to publish app' }, { status: 500 });
    }

    // Vercel WA custom event for app creation
    logEventServer('app_create', { appId: insertedApp.id, mode });

    // Track analytics event when AI mode
    if (mode === 'ai') {
      try {
        await supabase.rpc('track_app_event', {
          p_app_id: insertedApp.id,
          p_user_id: userId,
          p_event_type: 'publish_ai'
        });
      } catch (err) {
        console.error('[AI Publish] Analytics error:', err);
      }
    }

    // Generate Nano Banana image using Gemini
    try {
      console.log('[Publish] Generating Nano Banana image for:', newApp.name);
      
      // Try user key first, then fall back to platform key
      const envKey = process.env.GEMINI_API_KEY;
      let userKey = null;
      try {
        userKey = await getDecryptedSecret(userId, 'gemini', supabase);
      } catch (err) {
        console.warn('[Publish] Error retrieving user Gemini key:', err);
      }
      
      const geminiKey = userKey || envKey;
      console.log('[Publish] Gemini key source:', userKey ? 'user-secret' : (envKey ? 'platform-env' : 'none'));
      
      if (geminiKey) {
        const imagePrompt = `Generate an elevated apple store type image for this mobile app based on: ${newApp.name}. Description: ${newApp.description}`;
        
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`,
          {
            method: 'POST',
            headers: { 
              'x-goog-api-key': geminiKey,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: imagePrompt }] }],
              generationConfig: {
                imageConfig: { aspectRatio: "9:16" }
              }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          
          if (imagePart) {
            const imageBase64 = imagePart.inlineData.data;
            const imageMime = imagePart.inlineData.mimeType || 'image/png';
            
            // Compress the image before storing
            const compressedDataUrl = await compressImage(imageBase64, imageMime);
            
            // Update app with generated image
            await supabase
              .from('apps')
              .update({ preview_url: compressedDataUrl, preview_type: 'image' })
              .eq('id', insertedApp.id);
            
            // Update the returned app object
            insertedApp.preview_url = compressedDataUrl;
            insertedApp.preview_type = 'image';
            
            console.log('[Publish] Nano Banana image generated and compressed! ✅');
          }
        } else {
          console.error('[Publish] Gemini API error:', await geminiRes.text());
        }
      }
    } catch (err) {
      console.error('[Publish] Image generation error:', err);
      // Don't fail the publish if image generation fails
    }

    return NextResponse.json({
      success: true,
      appId: insertedApp.id,
      app: insertedApp
    });

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish app' },
      { status: 500 }
    );
  }
}
