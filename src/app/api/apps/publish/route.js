import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import sharp from 'sharp';
import { logEventServer } from '@/src/lib/metrics';
import { uploadHtmlToStorage } from '@/src/lib/supabase-storage';
import { getDecryptedSecret } from '@/src/lib/secrets';
import { DEFAULT_AI_TOOLS } from '@/src/lib/publish-tools';
import { sanitizeManifest, generateManifestWithAnthropic } from '@/src/lib/ai-publish';

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
      const requestedTools = Array.isArray(appData.tools) ? appData.tools : [];
      let toolWhitelist = requestedTools.length ? requestedTools : DEFAULT_AI_TOOLS;
      if (!Array.isArray(toolWhitelist) || !toolWhitelist.length) {
        toolWhitelist = [DEFAULT_AI_TOOLS[0] || 'llm.complete'];
      }
      const toolOrder = Array.isArray(appData.toolOrder) && appData.toolOrder.length ? appData.toolOrder : toolWhitelist;
      const promptTemplates = appData.promptTemplates || {};
      const modelChoice = appData.model;
      let manifestInput = appData.manifest || null;

      if (!manifestInput && appData.manifestJson) {
        try {
          manifestInput = JSON.parse(appData.manifestJson);
        } catch (err) {
          console.warn('[AI Publish] Invalid manifestJson payload, ignoring:', err?.message || err);
        }
      }

      if (!manifestInput && appData.prompt) {
        try {
          manifestInput = await generateManifestWithAnthropic({
            prompt: appData.prompt,
            userId,
            supabase,
            toolWhitelist,
            toolOrder,
            promptTemplates,
            model: modelChoice
          });
        } catch (err) {
          console.error('[AI Publish] Manifest generation error:', err);
          return NextResponse.json({ error: 'Failed to generate manifest with AI' }, { status: 502 });
        }
      }

      if (!manifestInput) {
        return NextResponse.json({ error: 'Generated manifest not found. Please regenerate before publishing.' }, { status: 400 });
      }

      const manifest = sanitizeManifest(manifestInput, { allowedTools: toolWhitelist, toolOrder, promptTemplates });
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
        preview_url: appData.previewImageDataUrl || manifest.preview_url || 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop',
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

    const providedPreview = mode === 'ai' && appData.previewImageDataUrl;
    if (!providedPreview) {
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
    } else {
      await supabase
        .from('apps')
        .update({ preview_url: appData.previewImageDataUrl, preview_type: 'image' })
        .eq('id', insertedApp.id);
      insertedApp.preview_url = appData.previewImageDataUrl;
      insertedApp.preview_type = 'image';
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
