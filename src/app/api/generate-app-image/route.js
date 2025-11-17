import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';
import { uploadImageVariants } from '@/src/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for image generation

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { appId } = await req.json();
    
    if (!appId) {
      return NextResponse.json({ error: 'appId required' }, { status: 400 });
    }
    
    // Get app details
    const { data: app } = await supabase
      .from('apps')
      .select('*')
      .eq('id', appId)
      .single();
    
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }
    
    // Generate image with Gemini - try user key first, then fall back to platform key
    const envKey = process.env.GEMINI_API_KEY;
    let userKey = null;
    
    try {
      const { getDecryptedSecret } = await import('@/src/lib/secrets.js');
      userKey = await getDecryptedSecret(userId, 'gemini', supabase);
    } catch (err) {
      console.warn('[Generate Image] Error retrieving user Gemini key:', err);
    }
    
    const geminiApiKey = userKey || envKey;
    console.log('[Generate Image] Gemini key source:', userKey ? 'user-secret' : (envKey ? 'platform-env' : 'none'));
    
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }
    
    // Create prompt for elevated, Apple-like image
    const prompt = `Generate an elevated, minimal, Apple-like aesthetic image for this app:

App Name: ${app.name}
Description: ${app.description}

Style: Clean, minimal, professional, modern, high-quality photography
Mood: Aspirational, premium, elegant
Colors: Soft, muted, sophisticated
Composition: Centered, balanced, spacious

Create a beautiful image that captures the essence of this app in an elevated, professional way.`;

    console.log('[Generate Image] Creating image for:', app.name);
    
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': geminiApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            imageConfig: {
              aspectRatio: '9:16' // TikTok-style vertical
            }
          }
        })
      }
    );
    
    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('[Generate Image] Gemini API error:', error);
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }
    
    const geminiData = await geminiResponse.json();
    
    // Extract base64 image data
    const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (!imagePart) {
      console.error('[Generate Image] No image in response');
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }
    
    const imageBase64 = imagePart.inlineData.data;
    const buffer = Buffer.from(imageBase64, 'base64');
    const baseKey = `app-previews/${appId}`;
    const { defaultUrl, urls, blurDataUrl } = await uploadImageVariants(buffer, baseKey);
    console.log('[Generate Image] Uploaded variants for:', app.name, urls);
    
    await supabase
      .from('apps')
      .update({
        preview_type: 'image',
        preview_url: defaultUrl,
        preview_blur: blurDataUrl
      })
      .eq('id', appId);
    
    return NextResponse.json({
      success: true,
      appId,
      imageUrl: defaultUrl
    });
    
  } catch (error) {
    console.error('[Generate Image] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

