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

// Five viral image apps including ControlNet meme generator
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
            instruction: 'Create a humorous roast image overlay on this photo. Add witty text commentary about the photo (fashion, pose, background, etc). Roast level: {{spice_level}}. Keep it PG-13 and playful. Style: bold white text with black stroke, meme-style overlay.'
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
        steps: [
          {
            tool: 'image.process',
            args: {
              image: '{{photo}}',
              instruction: 'Enhance this person with {{focus}} improvements. Show enhanced facial features, better grooming, improved lighting and posture. Create a realistic "glow-up" version showing their maximum potential. Professional photography quality, aspirational but believable transformation.'
            },
            output: 'enhanced_image'
          },
          {
            tool: 'llm.complete',
            args: {
              image: '{{enhanced_image.image}}',
              prompt: `You are a looksmaxxing coach. Analyze this enhanced photo and provide:

## 📊 Rating
- **Before:** 6-7/10 (baseline estimate)
- **After:** Rate this enhanced version /10

## ✨ Key Improvements Made
List 3-5 specific visual improvements you can see in this enhanced version:

## 💪 Actionable Tips for IRL
Provide 3-4 practical tips to achieve similar results in real life:
- Focus area: {{focus}}
- Be specific about grooming, fitness, style, or posture
- Make tips achievable within 30-90 days
- Include specific product recommendations if relevant

Use emojis, be encouraging but realistic!`,
              temperature: 0.7,
              max_tokens: 500,
              imageDetail: 'high'
            },
            output: 'analysis'
          }
        ]
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
            instruction: 'Transform this into a {{cover_type}} magazine cover. TIME: red border, bold "PERSON OF THE YEAR" text. Forbes: sleek "30 UNDER 30" design. FBI: wanted poster with "WANTED" header and description. Vogue: high fashion with elegant "VOGUE" masthead. Add headline: "{{headline}}" if provided. Professional magazine layout with proper branding and typography.'
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
            instruction: 'Age this person to {{target_age}} years old. Lifestyle: {{lifestyle}}. Show realistic aging effects - wrinkles, age spots, gray/white hair, skin texture changes. Healthy lifestyle = graceful aging. Average = normal aging. Rockstar = heavy weathering. Keep facial structure recognizable. Natural lighting, realistic aged portrait.'
          },
          output: 'aged'
        }]
      }
    },
    {
      name: 'ControlNet Hidden Text Meme',
      description: 'Create optical illusion memes where text is hidden in the image. Squint your eyes to see the hidden message!',
      tags: ['meme', 'illusion', 'viral', 'controlnet'],
      preview_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      design: { containerColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#1a1a1a', buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accentColor: '#667eea' },
      input_theme: { borderColor: '#333', backgroundColor: '#0f0f0f' },
      demo: { sampleInputs: { scene: 'dozens of computer monitors, keyboards, and electronic devices', text: 'CLIPCADE' } },
      inputs: {
        scene: { 
          type: 'select',
          label: 'Scene Type',
          options: [
            { value: 'dozens of trees and leaves in a dense forest', label: 'Forest 🌲' },
            { value: 'dozens of computer monitors, keyboards, and electronic devices', label: 'Tech Setup 💻' },
            { value: 'hundreds of people in a crowd at a concert', label: 'Concert Crowd 🎸' },
            { value: 'dozens of books, plants, and cozy furniture items', label: 'Cozy Room 🪴' },
            { value: 'hundreds of colorful flowers and petals', label: 'Flower Field 🌸' },
            { value: 'dozens of cute fluffy cats', label: 'Cats 🐱' }
          ],
          default: 'dozens of computer monitors, keyboards, and electronic devices',
          required: true 
        },
        text: { 
          type: 'string', 
          label: 'Hidden Word (ALL CAPS)', 
          placeholder: 'e.g., CLIPCADE', 
          required: true 
        }
      },
      outputs: { image: { type: 'image' }, markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'image.process',
          args: {
            instruction: 'Create an ultra-photorealistic optical illusion image made entirely of {{scene}}. The scene should look completely natural and chaotic at first glance - a realistic photograph with natural lighting, shadows, and depth. Hidden within the subtle shadows, edges, lighting gradients, and negative space, the word "{{text}}" should be barely visible, formed by extremely subtle variations in tone, shadow placement, and object arrangement. Very low contrast between the text and background - the letters should be almost invisible when viewed normally, only becoming readable when you squint or zoom way out. The text is NOT overlaid - it emerges from the natural shadows, edges of objects, and subtle lighting differences. Ultra high detail, cinematic photography, natural color grading, soft lighting, realistic depth of field, 4k, the hidden word should be nearly imperceptible and blend seamlessly into the photorealistic scene.'
          },
          output: 'meme'
        }]
      }
    },
    {
      name: 'Receipt to Recipes',
      description: 'Snap your grocery receipt and instantly get three delicious recipes tailored to your purchases.',
      tags: ['cooking', 'recipes', 'food', 'grocery', 'meal-planning'],
      preview_gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      design: { containerColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0b1f17', buttonColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', accentColor: '#10b981' },
      input_theme: { borderColor: '#1d3a2c', backgroundColor: '#0f2a20' },
      demo: { sampleInputs: {} },
      inputs: {
        receipt: { type: 'image', label: 'Receipt Photo', accept: 'image/*', required: true }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [{
          tool: 'llm.complete',
          args: {
            image: '{{receipt}}',
            prompt: `Analyze this grocery receipt and extract all the food items purchased.

Then, create 3 delicious recipes that use these ingredients:

## 🍳 Recipe 1: [Creative Name]
**What it is:** Brief appetizing description

**Ingredients from your receipt:**
- List the items from the receipt that will be used

**Quick Steps:**
1. Step one
2. Step two
3. Step three
4. Step four

---

## 🥗 Recipe 2: [Creative Name]
**What it is:** Brief appetizing description

**Ingredients from your receipt:**
- List the items from the receipt that will be used

**Quick Steps:**
1. Step one
2. Step two
3. Step three
4. Step four

---

## 🍝 Recipe 3: [Creative Name]
**What it is:** Brief appetizing description

**Ingredients from your receipt:**
- List the items from the receipt that will be used

**Quick Steps:**
1. Step one
2. Step two
3. Step three
4. Step four

---

💡 **Pro Tip:** Add a helpful cooking tip or substitution idea!`,
            temperature: 0.7,
            max_tokens: 1500,
            imageDetail: 'high'
          },
          output: 'recipes'
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


