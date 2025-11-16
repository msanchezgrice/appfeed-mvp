import { createAdminSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';
import { uploadImageVariants } from '@/src/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch generation

export async function POST(req) {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Check for admin authorization (you might want to add a secret key check here)
    const { adminKey } = await req.json();
    
    if (adminKey !== 'generate-all-images-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all published apps
    const { data: apps } = await supabase
      .from('apps')
      .select('id, name, description')
      .eq('is_published', true);
    
    if (!apps || apps.length === 0) {
      return NextResponse.json({ error: 'No apps found' }, { status: 404 });
    }
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }
    
    console.log(`[Generate All Images] Starting generation for ${apps.length} apps...`);
    
    const results = [];
    
    // Generate images for each app
    for (const app of apps) {
      try {
        const prompt = `Generate an elevated, minimal, Apple-like aesthetic image for this app:

App Name: ${app.name}
Description: ${app.description}

Style: Clean, minimal, professional, modern, high-quality photography
Mood: Aspirational, premium, elegant
Colors: Soft, muted, sophisticated
Composition: Centered, balanced, spacious

Create a beautiful image that captures the essence of this app in an elevated, professional way.`;

        console.log(`[Generate All Images] Generating for: ${app.name}`);
        
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
                  aspectRatio: '9:16'
                }
              }
            })
          }
        );
        
        if (!geminiResponse.ok) {
          const error = await geminiResponse.text();
          console.error(`[Generate All Images] Failed for ${app.name}:`, error);
          results.push({ appId: app.id, success: false, error });
          continue;
        }
        
        const geminiData = await geminiResponse.json();
        const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        
        if (!imagePart) {
          console.error(`[Generate All Images] No image for ${app.name}`);
          results.push({ appId: app.id, success: false, error: 'No image generated' });
          continue;
        }
        
        const imageBase64 = imagePart.inlineData.data;
        const buffer = Buffer.from(imageBase64, 'base64');
        const baseKey = `app-previews/${app.id}`;
        const { defaultUrl, urls } = await uploadImageVariants(buffer, baseKey);
        
        // Update app with generated image
        await supabase
          .from('apps')
          .update({
            preview_type: 'image',
            preview_url: defaultUrl
          })
          .eq('id', app.id);
        
        console.log(`[Generate All Images] ✓ Generated for: ${app.name}`, urls);
        results.push({ appId: app.id, appName: app.name, success: true, url: defaultUrl });
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.error(`[Generate All Images] Error for ${app.name}:`, err);
        results.push({ appId: app.id, success: false, error: err.message });
      }
    }
    
    console.log(`[Generate All Images] Complete. ${results.filter(r => r.success).length}/${apps.length} successful`);
    
    return NextResponse.json({
      success: true,
      total: apps.length,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
    
  } catch (error) {
    console.error('[Generate All Images] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}

