import sharp from 'sharp';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { getDecryptedSecret } from '@/src/lib/secrets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function compressToDataUrl(buffer) {
  const compressed = await sharp(buffer)
    .resize(800, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  return `data:image/jpeg;base64,${compressed.toString('base64')}`;
}

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, prompt: promptOverride } = await req.json();
    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description required' }, { status: 400 });
    }

    const envKey = process.env.GEMINI_API_KEY;
    let userKey = null;
    try {
      userKey = await getDecryptedSecret(userId, 'gemini', supabase);
    } catch (error) {
      console.warn('[Preview Image] Unable to fetch user Gemini key:', error?.message || error);
    }
    const geminiKey = userKey || envKey;
    if (!geminiKey) {
      return NextResponse.json({ error: 'Gemini key missing' }, { status: 500 });
    }

    let prompt = `Generate an elevated, minimal, Apple-like aesthetic image for this app:

App Name: ${name}
Description: ${description}

Style: Clean, minimal, professional, modern, high-quality photography
Mood: Aspirational, premium, elegant
Colors: Soft, muted, sophisticated
Composition: Centered, balanced, spacious`;
    if (promptOverride && typeof promptOverride === 'string' && promptOverride.trim()) {
      prompt += `\n\nCreator override instructions:\n${promptOverride.trim()}`;
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': geminiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            imageConfig: { aspectRatio: '9:16' }
          }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('[Preview Image] Gemini API error:', text);
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const dataUrl = await compressToDataUrl(buffer);

    return NextResponse.json({ imageDataUrl: dataUrl });
  } catch (error) {
    console.error('[Preview Image] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate preview image' }, { status: 500 });
  }
}
