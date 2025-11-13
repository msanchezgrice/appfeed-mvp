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

// Five viral manifests with varied modal/input themes
function getViralManifests() {
  return [
    {
      name: 'Tweet Roast or Toast',
      description: 'Paste a tweet link or text and get a spicy roast or wholesome toast in one line.',
      tags: ['twitter', 'meme', 'roast', 'hot-take'],
      preview_gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
      design: { containerColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#1a1a1a', buttonColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accentColor: '#f5576c' },
      input_theme: { borderColor: '#333', backgroundColor: '#0f0f0f' },
      demo: { sampleInputs: { tweet_url: 'https://x.com/someone/status/123', tone: 'roast', spice: 'medium' } },
      inputs: {
        tweet_url: { type: 'string', label: 'Tweet URL or text', placeholder: 'https://x.com/… or paste text', required: true },
        tone: { type: 'string', label: 'Tone', enum: ['roast', 'toast'], default: 'roast', required: true },
        spice: { type: 'string', label: 'Spice level', enum: ['mild', 'medium', 'spicy'], default: 'medium', required: true }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'llm.complete',
          args: {
            system: 'You are a witty, PG-13 internet comedian. One line, ≤240 chars, 1–2 emojis max. No slurs or harassment.',
            prompt: 'Content: {{tweet_url}}. Write a {{tone}} with {{spice}} spice. Return only the line.'
          },
          output: 'result'
        }]
      }
    },
    {
      name: 'Pet as CEO Poster',
      description: 'Upload a pet photo and get a glossy magazine‑cover poster in your chosen persona.',
      tags: ['pet', 'poster', 'image', 'meme'],
      preview_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      design: { containerColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', fontColor: 'black', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#121212', buttonColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', accentColor: '#ff7aa2' },
      input_theme: { borderColor: '#333', backgroundColor: '#0f0f0f' },
      demo: { sampleInputs: { persona: 'CEO', palette: 'neon', slogan: 'Chief Treat Officer' } },
      inputs: {
        image: { type: 'image', label: 'Pet photo', accept: 'image/*', required: true },
        persona: { type: 'string', label: 'Persona', enum: ['CEO', 'Tech bro', 'Supervillain', 'Angel investor'], default: 'CEO', required: true },
        palette: { type: 'select', label: 'Palette', options: [
          { value: 'neon', label: 'Neon' },
          { value: 'pastel', label: 'Pastel' },
          { value: 'monochrome', label: 'Monochrome' }
        ], default: 'neon', required: true },
        slogan: { type: 'string', label: 'Slogan (optional)', placeholder: 'e.g., Chief Treat Officer' }
      },
      outputs: { image: { type: 'image' }, markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'image.process',
          args: {
            image: '{{image}}',
            instruction: 'Turn the subject into a high‑gloss magazine cover as a {{persona}}. {{palette}} color vibe, cinematic lighting, centered subject, minimal typography. If provided, tastefully include the text: “{{slogan}}”.'
          },
          output: 'poster'
        }]
      }
    },
    {
      name: 'Headline → Spicy Take',
      description: 'Paste a link to get an ultra‑shareable one‑liner spicy take.',
      tags: ['news', 'hot-take', 'twitter', 'meme'],
      preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      design: { containerColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0f172a', buttonColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accentColor: '#38bdf8' },
      input_theme: { borderColor: '#334155', backgroundColor: '#0b1220' },
      demo: { sampleInputs: { url: 'https://www.nytimes.com/...', tone: 'spicy', perspective: 'crypto', length: 'one-liner' } },
      inputs: {
        url: { type: 'string', label: 'URL', placeholder: 'https://…', required: true },
        tone: { type: 'string', label: 'Tone', enum: ['spicy', 'wholesome', 'deadpan'], default: 'spicy' },
        perspective: { type: 'string', label: 'Perspective', enum: ['AI', 'crypto', 'Swifties', 'gamers', 'VC'], default: 'AI' },
        length: { type: 'string', label: 'Length', enum: ['one-liner', 'thread (3 bullets)'], default: 'one-liner' }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'llm.complete',
          args: {
            system: 'You write viral, PG‑13, witty takes. Keep to the requested length. ≤240 chars for one‑liners, 3 bullets for threads.',
            prompt: 'Read {{url}} and produce a {{tone}} take from {{perspective}} perspective as a {{length}}. No preface, just the output.'
          },
          output: 'result'
        }]
      }
    },
    {
      name: 'Red Flag Scanner',
      description: 'Paste text and get a humorous red‑flag meter + top 3 red flags.',
      tags: ['dating', 'startups', 'meme', 'twitter'],
      preview_gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
      design: { containerColor: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#1a1a1a', buttonColor: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', accentColor: '#fb923c' },
      input_theme: { borderColor: '#333', backgroundColor: '#0f0f0f' },
      demo: { sampleInputs: { text: 'I wake up at 4am to grind. Crypto maxi. Hustle is my love language.', persona: 'dating', strictness: '3' } },
      inputs: {
        text: { type: 'string', label: 'Text', placeholder: 'Paste bio, pitch, DM, etc.', required: true },
        persona: { type: 'string', label: 'Context', enum: ['dating', 'startup', 'investor', 'influencer'], default: 'dating' },
        strictness: { type: 'string', label: 'Strictness', enum: ['1', '2', '3', '4', '5'], default: '3' }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'llm.complete',
          args: {
            system: 'Be playful and PG‑13. Return a red‑flag meter and top‑3 flags.',
            prompt: 'Context: {{persona}}. Strictness: {{strictness}}/5. Analyze: {{text}}. Output:\\n- Meter: [🟥🟥🟥⬜⬜] style\\n- Top 3 red flags (short, punchy)\\n- One playful tip'
          },
          output: 'result'
        }]
      }
    },
    {
      name: 'Alignment Chart Maker',
      description: 'Create a text‑based 3×3 alignment chart for any topic.',
      tags: ['alignment', 'tierlist', 'meme', 'twitter'],
      preview_gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      design: { containerColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', fontColor: 'black', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#101010', buttonColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', accentColor: '#ef9fb0' },
      input_theme: { borderColor: '#333', backgroundColor: '#0f0f0f' },
      demo: { sampleInputs: { axisX: 'Based↔Cringe', axisY: 'Chaotic↔Lawful', items: 'AI founders, Crypto bros, Swifties, VCs, Gamers' } },
      inputs: {
        axisX: { type: 'string', label: 'X Axis', placeholder: 'e.g., Based↔Cringe', required: true },
        axisY: { type: 'string', label: 'Y Axis', placeholder: 'e.g., Chaotic↔Lawful', required: true },
        items: { type: 'string', label: 'Items (comma‑separated)', placeholder: 'Item A, Item B, …', required: true }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'llm.complete',
          args: {
            system: 'You produce readable alignment charts in markdown.',
            prompt: 'Axes: X={{axisX}} Y={{axisY}}. Items: {{items}}. Place items into a 3×3 grid with short, funny rationale. Use markdown headings per quadrant and bullet the items.'
          },
          output: 'result'
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
      const appId = `${manifest.name.toLowerCase().replace(/\\s+/g, '-')}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;

      const newApp = {
        id: appId,
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

      const { data: insertedApp, error } = await supabase
        .from('apps')
        .insert(newApp)
        .select()
        .single();
      if (error) {
        console.error('[Viral] Insert error:', error);
        created.push({ name: manifest.name, error: 'insert_failed' });
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

      created.push({ id: insertedApp.id, name: insertedApp.name, preview_url: insertedApp.preview_url });
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


