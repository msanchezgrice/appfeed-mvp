import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    console.error('[Generate by Name/Compress] Error:', err);
    return `data:${mimeType};base64,${base64Data}`;
  }
}

async function run(name, supabase, userId) {
  // Determine admin
  let isAdmin = false;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    isAdmin = profile?.email === 'msanchezgrice@gmail.com';
  } catch {}
  // Find latest app by this name for current user; if none, try any app by name
  let app = null;
  const { data: own } = await supabase
    .from('apps')
    .select('id, name, description, creator_id')
    .eq('creator_id', userId)
    .eq('name', name)
    .order('created_at', { ascending: false })
    .limit(1);
  if (Array.isArray(own) && own.length) {
    app = own[0];
  } else {
    const { data: any } = await supabase
      .from('apps')
      .select('id, name, description, creator_id')
      .eq('name', name)
      .order('created_at', { ascending: false })
      .limit(1);
    if (Array.isArray(any) && any.length) app = any[0];
  }
  if (!app) {
    return { error: 'App not found by name' };
  }
  // If not admin and not owner, block
  if (!isAdmin && app.creator_id !== userId) {
    return { error: 'Forbidden: not your app' };
  }

  // Key selection: user key preferred, else platform key
  const envKey = process.env.GEMINI_API_KEY;
  let userKey = null;
  try {
    const { getDecryptedSecret } = await import('@/src/lib/secrets.js');
    userKey = await getDecryptedSecret(userId, 'gemini', supabase);
  } catch (err) {
    console.warn('[Generate by Name] Could not load user key:', err);
  }
  const geminiKey = userKey || envKey;
  if (!geminiKey) return { error: 'Gemini API key not configured' };

  const prompt = `Generate an elevated apple store type image for this mobile app based on: ${app.name}. Description: ${app.description}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { imageConfig: { aspectRatio: '9:16' } }
      })
    }
  );
  if (!geminiRes.ok) {
    const text = await geminiRes.text();
    return { error: `Gemini error: ${text.slice(0, 400)}` };
  }
  const geminiData = await geminiRes.json();
  const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imagePart) return { error: 'No image generated' };

  const imageBase64 = imagePart.inlineData.data;
  const imageMime = imagePart.inlineData.mimeType || 'image/png';
  const compressedDataUrl = await compressImage(imageBase64, imageMime);

  await supabase
    .from('apps')
    .update({ preview_url: compressedDataUrl, preview_type: 'image' })
    .eq('id', app.id);

  return { success: true, id: app.id, name: app.name, preview_url: compressedDataUrl };
}

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const result = await run(name, supabase, userId);
    if (result.error) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (e) {
    console.error('[Generate by Name] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const result = await run(name, supabase, userId);
    if (result.error) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (e) {
    console.error('[Generate by Name/GET] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}


