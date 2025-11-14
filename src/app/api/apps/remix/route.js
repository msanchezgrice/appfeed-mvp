import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import sharp from 'sharp';
import { logEventServer } from '@/src/lib/metrics';

export const dynamic = 'force-dynamic';

// Helper to compress generated images (keeps previews small and fast)
async function compressImage(base64Data, mimeType) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const compressed = await sharp(buffer)
      .resize(800, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    const compressedBase64 = compressed.toString('base64');
    return `data:image/jpeg;base64,${compressedBase64}`;
  } catch (err) {
    console.error('[Remix/Compress] Error:', err);
    return `data:${mimeType};base64,${base64Data}`;
  }
}

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please sign in to remix apps' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { appId, remixPrompt, remixData } = await req.json();
    
    if (!appId || (!remixPrompt && !remixData)) {
      return new Response(JSON.stringify({ error: 'appId and (remixPrompt or remixData) required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the original app
    const { data: originalApp, error: fetchError } = await supabase
      .from('apps')
      .select('*')
      .eq('id', appId)
      .single();
    
    if (fetchError || !originalApp) {
      return new Response(JSON.stringify({ error: 'Original app not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create remixed app with AI-modified manifest
    const remixedAppId = `${appId}-remix-${Date.now().toString(36)}`;
    
    let changes = {};
    
    // If remixData provided (from JSON editor), use it directly!
    if (remixData) {
      console.log('[Remix] Using direct JSON data:', remixData);
      changes = remixData;
    } else {
      // Otherwise, use LLM to parse natural language prompt
      console.log('[Remix] Using LLM to parse:', remixPrompt);
      
      try {
      const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: 'Return ONLY valid JSON with changed fields. Use proper CSS gradients for colors.'
          }, {
            role: 'user',
            content: `Parse: "${remixPrompt}"

Current app:
- Name: ${originalApp.name}
- Background: ${originalApp.design?.containerColor || 'default gradient'}

Return JSON with ONLY fields to change:
{
  "name": "new name (only if user wants to rename)",
  "design": {
    "containerColor": "linear-gradient(135deg, #color1 0%, #color2 100%)" // or "#hex"
  }
}

Color mapping:
- pink → linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)
- blue → linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
- green → linear-gradient(135deg, #10b981 0%, #059669 100%)
- orange → linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
- dark → #1a1a1a`
          }],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });
      
      if (llmRes.ok) {
        const llmData = await llmRes.json();
        changes = JSON.parse(llmData.choices[0].message.content || '{}');
        console.log('[Remix] LLM parsed changes:', changes);
      }
      } catch (err) {
        console.error('[Remix] LLM parse error:', err);
      }
    }
    
    const remixedApp = {
      id: remixedAppId,
      name: changes.name || `${originalApp.name} (Remixed)`,
      creator_id: userId,
      description: changes.description || originalApp.description, // Clean, no concatenation!
      design: {
        ...(originalApp.design || {}),
        ...(changes.design || {})
      },
      tags: [...new Set([...(originalApp.tags || []), 'remix'])],
      preview_type: originalApp.preview_type,
      preview_url: originalApp.preview_url,
      preview_gradient: originalApp.preview_gradient,
      demo: originalApp.demo,
      inputs: originalApp.inputs,
      outputs: originalApp.outputs,
      runtime: originalApp.runtime,
      fork_of: originalApp.id,
      remix_prompt: remixPrompt,
      is_published: true
    };
    
    // Insert remixed app
    const { data: insertedApp, error: insertError } = await supabase
      .from('apps')
      .insert(remixedApp)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating remixed app:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create remixed app' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate Nano Banana image for the new remix
    try {
      console.log('[Remix] Generating Nano Banana image for:', remixedAppId);
      
      // Try user key first, then fall back to platform key
      const envKey = process.env.GEMINI_API_KEY;
      let userKey = null;
      try {
        const { getDecryptedSecret } = await import('@/src/lib/secrets.js');
        userKey = await getDecryptedSecret(userId, 'gemini', supabase);
      } catch (err) {
        console.warn('[Remix] Error retrieving user Gemini key:', err);
      }
      
      const geminiKey = userKey || envKey;
      console.log('[Remix] Gemini key source:', userKey ? 'user-secret' : (envKey ? 'platform-env' : 'none'));
      
      if (geminiKey) {
        const imagePrompt = `Generate an elevated apple store type image for this mobile app based on: ${remixedApp.name}. Description: ${remixedApp.description}`;
        
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
            const compressedDataUrl = await compressImage(imageBase64, imageMime);
            
            // Update app with generated image
            await supabase
              .from('apps')
              .update({ preview_url: compressedDataUrl, preview_type: 'image' })
              .eq('id', remixedAppId);
            
            console.log('[Remix] Nano Banana image generated! ✅');
          }
        }
      }
    } catch (err) {
      console.error('[Remix] Image generation error:', err);
      // Don't fail the remix if image generation fails
    }
    
    // Increment remix count on original app
    try {
      await supabase.rpc('update_app_remix_count', {
        p_app_id: originalApp.id
      });
    } catch (err) {
      console.error('Error updating remix count:', err);
    }
    
    // Track analytics
    try {
      await supabase.rpc('track_app_event', {
        p_app_id: originalApp.id,
        p_user_id: userId,
        p_event_type: 'remix'
      });
    } catch (err) {
      console.error('Analytics error:', err);
    }
    // Vercel WA custom event
    logEventServer('app_remix_create', { appId: remixedAppId, parentId: originalApp.id });
    
    return new Response(JSON.stringify({
      ok: true,
      appId: remixedAppId,
      app: insertedApp
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    console.error('Remix POST error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
