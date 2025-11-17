import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import sharp from 'sharp';
import { getDecryptedSecret } from '@/src/lib/secrets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Helper: compress base64 image to a reasonable preview size
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
    console.error('[Viral/Compress] Error:', err);
    return `data:${mimeType};base64,${base64Data}`;
  }
}

// Four viral image transformation apps
function getViralManifests() {
  return [
    {
      name: 'Roast My Photo',
      description: 'Upload your selfie and prepare for a spicy roast. The AI analyzes your photo and delivers brutal (but funny) commentary.',
      tags: ['roast', 'meme', 'selfie', 'viral'],
      preview_gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
      design: { containerColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#1a1a1a', buttonColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accentColor: '#f5576c' },
      input_theme: { borderColor: '#333', backgroundColor: '#0f0f0f' },
      demo: { sampleInputs: { spice_level: 'medium' } },
      inputs: {
        photo: { type: 'image', label: 'Your Photo', accept: 'image/*', required: true },
        spice_level: { type: 'string', label: 'Roast Level', enum: ['mild', 'medium', 'nuclear'], default: 'medium', required: true }
      },
      outputs: { image: { type: 'image' }, markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'image.process',
          args: {
            image: '{{photo}}',
            instruction: 'Analyze this photo and provide a witty, {{spice_level}} roast. Focus on fashion choices, pose, background, lighting - anything visible. Keep it PG-13, funny, and under 200 characters. Add 2-3 fire emojis. No personal attacks, just playful observations about what you see in the image.'
          },
          output: 'roast'
        }]
      }
    },
    {
      name: 'LooksMax Me',
      description: 'Upload your photo and see your looksmaxxed potential. Get an AI-enhanced glow-up plus ratings and improvement tips.',
      tags: ['looksmaxing', 'glow-up', 'transformation', 'viral'],
      preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      design: { containerColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0f172a', buttonColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accentColor: '#38bdf8' },
      input_theme: { borderColor: '#334155', backgroundColor: '#0b1220' },
      demo: { sampleInputs: { focus: 'overall' } },
      inputs: {
        photo: { type: 'image', label: 'Your Photo', accept: 'image/*', required: true },
        focus: { type: 'string', label: 'Enhancement Focus', enum: ['overall', 'fitness', 'style', 'grooming'], default: 'overall', required: true }
      },
      outputs: { image: { type: 'image' }, markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'image.process',
          args: {
            image: '{{photo}}',
            instruction: 'Transform this person into their peak potential with {{focus}} focus. Enhance: facial symmetry, skin quality, jawline, lighting, grooming, style. Create an aspirational but realistic enhanced version. Professional photography quality, cinematic lighting, magazine-worthy portrait.'
          },
          output: 'enhanced'
        }]
      }
    },
    {
      name: 'Legendary Cover Star',
      description: 'Put yourself on TIME Person of Year, Forbes 30 Under 30, FBI Most Wanted, or Vogue cover with custom headline.',
      tags: ['magazine', 'cover', 'poster', 'meme', 'viral'],
      preview_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      design: { containerColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#1a2332', buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accentColor: '#667eea' },
      input_theme: { borderColor: '#333', backgroundColor: '#1a1a1a' },
      demo: { sampleInputs: { cover_type: 'time', headline: 'Changing The Game' } },
      inputs: {
        photo: { type: 'image', label: 'Your Photo', accept: 'image/*', required: true },
        cover_type: { 
          type: 'select', 
          label: 'Cover Type', 
          options: [
            { value: 'time', label: 'TIME Person of Year' },
            { value: 'forbes', label: 'Forbes 30 Under 30' },
            { value: 'fbi', label: 'FBI Most Wanted' },
            { value: 'vogue', label: 'Vogue Fashion' }
          ], 
          default: 'time', 
          required: true 
        },
        headline: { type: 'string', label: 'Custom Headline (optional)', placeholder: 'e.g., Disrupting Everything' }
      },
      outputs: { image: { type: 'image' }, markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'image.process',
          args: {
            image: '{{photo}}',
            instruction: 'Create a professional {{cover_type}} magazine cover. TIME=red border, bold typography, authoritative portrait. Forbes=sleek modern design, entrepreneurial energy. FBI=wanted poster aesthetic, mugshot style, official government document look. Vogue=high fashion, editorial lighting, elegant typography. Subject should look polished and professional. Include headline text: "{{headline}}" if provided, otherwise use cover-appropriate default text. Photorealistic magazine quality.'
          },
          output: 'cover'
        }]
      }
    },
    {
      name: 'Predict My Future',
      description: 'Upload your photo and see AI predictions of how you\'ll look at 40, 60, or 80. Time travel to your future self!',
      tags: ['aging', 'future', 'prediction', 'transformation', 'viral'],
      preview_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      design: { containerColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0f172a', buttonColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', accentColor: '#10b981' },
      input_theme: { borderColor: '#333', backgroundColor: '#0f0f0f' },
      demo: { sampleInputs: { target_age: '60', lifestyle: 'average' } },
      inputs: {
        photo: { type: 'image', label: 'Your Photo', accept: 'image/*', required: true },
        target_age: { 
          type: 'select', 
          label: 'Future Age', 
          options: [
            { value: '40', label: '40 Years Old' },
            { value: '60', label: '60 Years Old' },
            { value: '80', label: '80 Years Old' }
          ], 
          default: '60', 
          required: true 
        },
        lifestyle: { type: 'string', label: 'Lifestyle Path', enum: ['healthy', 'average', 'rockstar'], default: 'average' }
      },
      outputs: { image: { type: 'image' }, markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'image.process',
          args: {
            image: '{{photo}}',
            instruction: 'Age this person realistically to {{target_age}} years old with {{lifestyle}} lifestyle. Healthy path: graceful aging, good skin, minimal wrinkles, vitality. Average: normal aging signs, some wrinkles, gray hair. Rockstar: heavier aging, more weathered, lived-in look. Maintain facial structure and key features. Photorealistic, natural lighting, dignified portraiture.'
          },
          output: 'aged'
        }]
      }
    }
  ];
}

async function handleCreate() {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin‑gate for safety (aligns with other admin checks)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('clerk_user_id', userId)
      .single();
    const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const manifests = getViralManifests();
    const created = [];

    for (const manifest of manifests) {
      // Upsert strategy: if an app with same name exists for this user, update it; otherwise insert new
      let insertedApp = null;
      let op = 'inserted';
      let targetAppId = null;
      try {
        const { data: existingList } = await supabase
          .from('apps')
          .select('id, created_at')
          .eq('creator_id', userId)
          .eq('name', manifest.name)
          .order('created_at', { ascending: false })
          .limit(1);
        const existing = Array.isArray(existingList) && existingList.length ? existingList[0] : null;
        const baseFields = {
          name: manifest.name,
          creator_id: userId,
          description: manifest.description,
          tags: manifest.tags || [],
          device_types: ['mobile'],
          preview_type: 'image',
          preview_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop',
          preview_gradient: manifest.preview_gradient,
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
        if (existing) {
          targetAppId = existing.id;
          op = 'updated';
          const { data, error: upErr } = await supabase
            .from('apps')
            .update(baseFields)
            .eq('id', targetAppId)
            .select()
            .single();
          if (upErr) throw upErr;
          insertedApp = data;
        } else {
          targetAppId = `${manifest.name.toLowerCase().replace(/\\s+/g, '-')}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
          const newApp = { id: targetAppId, ...baseFields };
          const { data, error: insErr } = await supabase
            .from('apps')
            .insert(newApp)
            .select()
            .single();
          if (insErr) throw insErr;
          insertedApp = data;
        }
      } catch (err) {
        console.error('[Viral] Upsert error:', err);
        created.push({ name: manifest.name, error: 'upsert_failed' });
        continue;
      }

      // Generate Nano Banana (Gemini) preview image
      try {
        const envKey = process.env.GEMINI_API_KEY;
        let userKey = null;
        try {
          userKey = await getDecryptedSecret(userId, 'gemini', supabase);
        } catch (err) {
          console.warn('[Viral] Error retrieving user Gemini key:', err);
        }
        const geminiKey = userKey || envKey;
        if (geminiKey) {
          const imagePrompt = `Generate an elevated apple store type image for this mobile app based on: ${manifest.name}. Description: ${manifest.description}`;
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
                generationConfig: { imageConfig: { aspectRatio: '9:16' } }
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
              await supabase
                .from('apps')
                .update({ preview_url: compressedDataUrl, preview_type: 'image' })
                .eq('id', insertedApp.id);
              insertedApp.preview_url = compressedDataUrl;
              insertedApp.preview_type = 'image';
            }
          } else {
            console.error('[Viral] Gemini API error:', await geminiRes.text());
          }
        }
      } catch (err) {
        console.error('[Viral] Image generation error:', err);
      }

      created.push({ id: insertedApp.id, name: insertedApp.name, preview_url: insertedApp.preview_url, op });
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error('[Viral] Batch publish error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create viral apps' }, { status: 500 });
  }
}

export async function POST() {
  return handleCreate();
}

export async function GET() {
  // Convenience for triggering via browser while still admin-gated
  return handleCreate();
}


