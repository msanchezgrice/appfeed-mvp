import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please sign in to remix apps' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { appId, remixPrompt } = await req.json();
    
    if (!appId || !remixPrompt) {
      return new Response(JSON.stringify({ error: 'appId and remixPrompt required' }), {
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
