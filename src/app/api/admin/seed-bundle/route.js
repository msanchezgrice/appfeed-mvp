import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function compressToJpegDataUrl(base64Data, mimeType) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const compressed = await sharp(buffer)
      .resize(800, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    return `data:image/jpeg;base64,${compressed.toString('base64')}`;
  } catch (e) {
    console.warn('[Seed Bundle] Compress failed, returning original mime', mimeType);
    return `data:${mimeType};base64,${base64Data}`;
  }
}

function manifests(userId) {
  // 10 target apps as minimal records aligned with current schema
  const list = [
    {
      id: 'chat-encouragement',
      name: 'Live Encouragement Chat',
      description: 'Chat with an agent whose mood you choose: Encouraging, Discouraging, Uplifting, or Depressing.',
      tags: ['chat','mental-health','mood'],
      device_types: ['mobile'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      design: { containerColor: '#0b1220', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0b1220', buttonColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accentColor: '#4facfe' },
      input_theme: { borderColor: '#223', backgroundColor: '#0f172a' },
      demo: { sampleInputs: { mood: 'encouraging', topic: 'goals', tone_strength: 'medium' } },
      inputs: {
        mood: { type: 'select', label: 'Agent Mood', required: true, options: [
          { label:'Encouraging', value:'encouraging' },
          { label:'Discouraging', value:'discouraging' },
          { label:'Uplifting', value:'uplifting' },
          { label:'Depressing', value:'depressing' }
        ], default: 'encouraging' },
        topic: { type: 'string', label: 'Topic', placeholder: 'What would you like to talk about?', required: true },
        tone_strength: { type: 'select', label: 'Tone Strength', options: [
          { label:'Soft', value:'soft' }, { label:'Medium', value:'medium' }, { label:'Strong', value:'strong' }
        ], default: 'medium' }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [
          { tool: 'llm.complete', args: {
            system: 'You are a live chat agent. Match the selected mood exactly: {{mood}}. Keep responses short, conversational, and safe.',
            prompt: 'User opens with topic: {{topic}}. Respond as the {{mood}} agent. Tone strength: {{tone_strength}}.',
            temperature: 0.8, max_tokens: 250
          }, output: 'message' }
        ]
      }
    },
    {
      id: 'flappy-bird-mini',
      name: 'Flappy Mini',
      description: 'Full-screen mobile Flappy clone. Pick a bird and background theme.',
      tags: ['game','arcade'],
      device_types: ['mobile'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
      design: { containerColor: '#000', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#000', buttonColor: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', accentColor: '#f5af19' },
      input_theme: { borderColor: '#333', backgroundColor: '#111' },
      demo: { sampleInputs: { bird_color: 'yellow', background_theme: 'day' } },
      inputs: {
        bird_color: { type: 'select', label: 'Bird Color', required: true, default: 'yellow', options: [
          { label:'Yellow', value:'yellow' }, { label:'Red', value:'red' }, { label:'Blue', value:'blue' }, { label:'Green', value:'green' }
        ]},
        background_theme: { type: 'select', label: 'Background', required: true, default: 'day', options: [
          { label:'Day', value:'day' }, { label:'Night', value:'night' }, { label:'Forest', value:'forest' }, { label:'Ocean', value:'ocean' }
        ]}
      },
      outputs: { markdown: { type: 'string' } },
      runtime: { engine: 'local', steps: [{ tool: 'llm.complete', args: { prompt: 'Get Ready!', temperature: 0.2, max_tokens: 10 }, output: 'banner' }] }
    },
    {
      id: 'gratitude-daily-email',
      name: 'Daily Gratitude Journal',
      description: 'Get a thoughtful prompt by email once per day to build a gratitude habit.',
      tags: ['wellness','email','journaling','daily'],
      device_types: ['mobile','desktop'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      design: { containerColor: '#0b1f17', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0b1f17', buttonColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', accentColor: '#10b981' },
      input_theme: { borderColor: '#1d3a2c', backgroundColor: '#0f2a20' },
      demo: { sampleInputs: { email: 'you@example.com', send_time: '08:00', focus_area: 'general', cadence: 'daily' } },
      inputs: {
        email: { type: 'string', label: 'Your Email', placeholder: 'you@example.com', required: true },
        send_time: { type: 'select', label: 'Send Time', required: true, default: '08:00', options: [
          { label:'7:00 AM', value:'07:00' }, { label:'8:00 AM', value:'08:00' }, { label:'9:00 AM', value:'09:00' }
        ]},
        focus_area: { type: 'select', label: 'Focus Area', default: 'general', options: [
          { label:'General', value:'general' }, { label:'Work', value:'work' }, { label:'Family', value:'family' }, { label:'Health', value:'health' }
        ]},
        cadence: { type: 'select', label: 'Cadence', default: 'daily', options: [
          { label:'Daily', value:'daily' }, { label:'Weekdays', value:'weekdays' }
        ]}
      },
      outputs: { markdown: { type: 'string' } },
      runtime: {
        engine: 'local',
        steps: [
          { tool: 'llm.complete', args: {
            system: 'Generate a short daily gratitude reflection prompt aligned to the user focus area.',
            prompt: 'Focus area: {{focus_area}}. Output 1–2 sentence prompt.',
            temperature: 0.7, max_tokens: 120
          }, output: 'prompt' },
          { tool: 'email.send', args: {
            to: '{{email}}',
            subject: 'Your Daily Gratitude Prompt 🌅',
            content: 'Hi!\\n\\n{{prompt.markdown}}\\n\\nReply to this email with your reflection.'
          }, output: 'email_status' }
        ]
      }
    },
    {
      id: 'wordle-daily-themed',
      name: 'Daily Wordle (Themed)',
      description: 'Pick a theme (Animals, Foods, Cities, Verbs, Brands). Play one of 10 curated words per theme.',
      tags: ['game','wordle','daily'],
      device_types: ['mobile'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      design: { containerColor: '#111', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#111', buttonColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', accentColor: '#a8edea' },
      input_theme: { borderColor: '#333', backgroundColor: '#1a1a1a' },
      demo: { sampleInputs: { theme: 'animals' } },
      inputs: {
        theme: { type: 'select', label: 'Theme', required: true, default: 'animals', options: [
          { label:'Animals', value:'animals' }, { label:'Foods', value:'foods' }, { label:'Cities', value:'cities' },
          { label:'Verbs', value:'verbs' }, { label:'Brands', value:'brands' }
        ]}
      },
      outputs: { markdown: { type: 'string' } },
      runtime: { engine: 'local', steps: [{ tool: 'llm.complete', args: { prompt: 'OK', temperature: 0.0, max_tokens: 2 }, output: 'status' }] },
      data: {
        words: {
          animals: ['tiger','zebra','otter','eagle','whale','panda','camel','rhino','koala','sloth'],
          foods: ['pasta','curry','bagel','pizza','chili','apple','olive','sushi','tacos','bread'],
          cities: ['paris','tokyo','miami','milan','delhi','osaka','sofia','cairo','seoul','perth'],
          verbs: ['build','write','teach','learn','speak','judge','drawn','laugh','dance','throw'],
          brands: ['apple','tesla','nokia','sony','ikea','adobe','gucci','prada','visa','nvidia']
        }
      }
    },
    {
      id: 'weekend-near-me',
      name: 'Weekend Near Me',
      description: 'Pick your city and vibe to get 3 suggestions for this weekend.',
      tags: ['travel','local','fun'],
      device_types: ['mobile','desktop'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      design: { containerColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#1a1a1a', buttonColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accentColor: '#f093fb' },
      input_theme: { borderColor: '#333', backgroundColor: '#1a1a1a' },
      demo: { sampleInputs: { city: 'austin', vibe: 'family' } },
      inputs: {
        city: { type: 'select', label: 'City', required: true, default: 'austin', options: [
          { label:'Austin', value:'austin' }, { label:'San Francisco', value:'san francisco' }
        ]},
        vibe: { type: 'select', label: 'Focus', required: true, default: 'family', options: [
          { label:'Family', value:'family' }, { label:'Partying', value:'date' }, { label:'Single', value:'outdoors' }, { label:'Indoors', value:'indoors' }
        ]}
      },
      outputs: { items: { type: 'array' } },
      runtime: { engine: 'local', steps: [{ tool: 'activities.lookup', args: { city: '{{city}}', vibe: '{{vibe}}', limit: 3 }, output: 'items' }] }
    },
    {
      id: 'recipes-quick-plan',
      name: 'Quick Recipe Planner',
      description: 'Generate a 20–30 minute recipe with ingredients and a grocery list.',
      tags: ['food','planning'],
      device_types: ['mobile','desktop'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      design: { containerColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#1a2332', buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accentColor: '#667eea' },
      input_theme: { borderColor: '#333', backgroundColor: '#1a1a1a' },
      demo: { sampleInputs: { cuisine: 'italian', diet: 'any', time_limit: '30', servings: '2' } },
      inputs: {
        cuisine: { type: 'string', label: 'Cuisine (optional)', placeholder: 'Italian, Mexican, Japanese...' },
        diet: { type: 'select', label: 'Diet', default: 'any', options: [
          { label:'Any', value:'any' }, { label:'Vegetarian', value:'vegetarian' }, { label:'Vegan', value:'vegan' }, { label:'Gluten-free', value:'gluten-free' }
        ]},
        time_limit: { type: 'select', label: 'Time Limit', default: '30', options: [
          { label:'20 min', value:'20' }, { label:'30 min', value:'30' }, { label:'45 min', value:'45' }
        ]},
        servings: { type: 'select', label: 'Servings', default: '2', options: [
          { label:'1', value:'1' }, { label:'2', value:'2' }, { label:'4', value:'4' }
        ]}
      },
      outputs: { markdown: { type: 'string' } },
      runtime: { engine: 'local', steps: [
        { tool: 'llm.complete', args: {
          system: 'Return clearly formatted markdown with sections: Title, Ingredients (checklist), Steps (numbered), Grocery List (bulleted), Tips.',
          prompt: 'Create a {{diet}} {{cuisine||quick}} recipe in {{time_limit}} minutes for {{servings}} servings.',
          temperature: 0.7, max_tokens: 500
        }, output: 'markdown' }
      ] }
    },
    {
      id: 'resume-cover-helper',
      name: 'Resume + Cover Letter',
      description: 'Paste your resume and job description; get a tailored cover letter and resume bullet tweaks.',
      tags: ['career','writing'],
      device_types: ['desktop','mobile'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      design: { containerColor: '#0b1220', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0b1220', buttonColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accentColor: '#4facfe' },
      input_theme: { borderColor: '#223', backgroundColor: '#0f172a' },
      demo: { sampleInputs: { role_title: 'Senior Backend Engineer', company: 'Acme', job_description: '...', resume: '...' } },
      inputs: {
        role_title: { type: 'string', label: 'Role Title', required: true, placeholder: 'Senior Backend Engineer' },
        company: { type: 'string', label: 'Company', required: true },
        job_description: { type: 'string', label: 'Job Description', required: true, placeholder: 'Paste JD here...' },
        resume: { type: 'string', label: 'Your Resume', required: true, placeholder: 'Paste resume text...' }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: { engine: 'local', steps: [
        { tool: 'llm.complete', args: {
          system: 'Output markdown with sections: Cover Letter (with greeting), Tailored Bullets (3–5), Final Tips.',
          prompt: 'Role: {{role_title}} at {{company}}.\\n\\nJob Description:\\n{{job_description}}\\n\\nResume:\\n{{resume}}',
          temperature: 0.6, max_tokens: 700
        }, output: 'markdown' }
      ] }
    },
    {
      id: 'habit-builder-reminder',
      name: 'Habit Builder',
      description: 'Define a habit and get a daily reminder email with a micro-prompt.',
      tags: ['productivity','email','habits','daily'],
      device_types: ['mobile','desktop'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      design: { containerColor: '#0b1f17', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0b1f17', buttonColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', accentColor: '#10b981' },
      input_theme: { borderColor: '#1d3a2c', backgroundColor: '#0f2a20' },
      demo: { sampleInputs: { habit: 'Read 10 minutes', email: 'you@example.com', send_time: '07:00' } },
      inputs: {
        habit: { type: 'string', label: 'Habit', required: true, placeholder: 'e.g., Read 10 minutes' },
        email: { type: 'string', label: 'Email', required: true },
        send_time: { type: 'select', label: 'Send Time', default: '07:00', options: [
          { label:'6:00 AM', value:'06:00' }, { label:'7:00 AM', value:'07:00' }, { label:'8:00 AM', value:'08:00' }
        ] }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: { engine: 'local', steps: [
        { tool: 'llm.complete', args: {
          system: 'Write a very short motivational micro-prompt to encourage the user to perform their habit today.',
          prompt: 'Habit: {{habit}}. Output 1–2 sentences.',
          temperature: 0.7, max_tokens: 120
        }, output: 'msg' },
        { tool: 'email.send', args: { to: '{{email}}', subject: 'Your Habit Reminder ✅', content: '{{msg.markdown}}\\n\\nYou got this.' }, output: 'email_status' }
      ] }
    },
    {
      id: 'meme-captioner',
      name: 'Meme Captioner',
      description: 'Upload an image and generate a meme-style caption overlay.',
      tags: ['images','memes'],
      device_types: ['mobile','desktop'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      design: { containerColor: '#101010', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#101010', buttonColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accentColor: '#f093fb' },
      input_theme: { borderColor: '#333', backgroundColor: '#181818' },
      demo: { sampleInputs: { style: 'impact', caption: 'When the sprint ends...' } },
      inputs: {
        image: { type: 'image', label: 'Image', accept: 'image/*', required: true },
        style: { type: 'select', label: 'Caption Style', default: 'impact', options: [
          { label:'Top & Bottom (Impact)', value:'impact' },
          { label:'Top Only', value:'top' },
          { label:'Bottom Only', value:'bottom' }
        ]},
        caption: { type: 'string', label: 'Caption Text', placeholder: 'When the sprint ends...' }
      },
      outputs: { image: { type: 'string' }, markdown: { type: 'string' } },
      runtime: { engine: 'local', steps: [
        { tool: 'image.process', args: { image: '{{image}}', instruction: "Add meme caption '{{caption}}' in {{style}} style (white Impact font with black stroke), centered and readable." }, output: 'image_result' }
      ] }
    },
    {
      id: 'itinerary-48h',
      name: '48-Hour City Itinerary',
      description: 'Get a concise 2-day plan tailored to your vibe and budget.',
      tags: ['travel','planning'],
      device_types: ['mobile','desktop'],
      preview_type: 'image',
      preview_url: null,
      preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      design: { containerColor: '#0b1220', fontColor: 'white', fontFamily: 'system-ui', inputLayout: 'vertical' },
      modal_theme: { backgroundColor: '#0b1220', buttonColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accentColor: '#4facfe' },
      input_theme: { borderColor: '#223', backgroundColor: '#0f172a' },
      demo: { sampleInputs: { city: 'Lisbon', vibe: 'culture', budget: 'mid', with_kids: 'no' } },
      inputs: {
        city: { type: 'string', label: 'City', required: true, placeholder: 'Lisbon' },
        vibe: { type: 'select', label: 'Vibe', default: 'culture', options: [
          { label:'Culture', value:'culture' }, { label:'Food', value:'food' }, { label:'Nightlife', value:'nightlife' }, { label:'Outdoors', value:'outdoors' }
        ]},
        budget: { type: 'select', label: 'Budget', default: 'mid', options: [
          { label:'$', value:'low' }, { label:'$$', value:'mid' }, { label:'$$$', value:'high' }
        ]},
        with_kids: { type: 'select', label: 'With Kids?', default: 'no', options: [
          { label:'No', value:'no' }, { label:'Yes', value:'yes' }
        ] }
      },
      outputs: { markdown: { type: 'string' } },
      runtime: { engine: 'local', steps: [
        { tool: 'llm.complete', args: {
          system: 'Output markdown with sections: Overview, Day 1 (Morning/Afternoon/Evening), Day 2 (Morning/Afternoon/Evening), Dining, Tips.',
          prompt: 'City: {{city}}. Vibe: {{vibe}}. Budget: {{budget}}. With kids: {{with_kids}}.',
          temperature: 0.7, max_tokens: 650
        }, output: 'markdown' }
      ] }
    }
  ];
  // Assign creator IDs and publication flags
  return list.map(app => ({
    ...app,
    creator_id: userId,
    is_published: true
  }));
}

async function generatePreviewWithGemini({ app, supabase, apiKey }) {
  try {
    if (!apiKey) return null;
    const prompt = `Generate an elevated, minimal, Apple-like aesthetic image for this app:

App Name: ${app.name}
Description: ${app.description}

Style: Clean, minimal, professional, modern, high-quality photography
Mood: Aspirational, premium, elegant
Colors: Soft, muted, sophisticated
Composition: Centered, balanced, spacious

Create a beautiful image that captures the essence of this app in an elevated, professional way.`;
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { imageConfig: { aspectRatio: '9:16' } }
        })
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      console.error('[Seed Bundle] Gemini error:', txt);
      return null;
    }
    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) return null;
    const dataUrl = await compressToJpegDataUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png');
    await supabase.from('apps').update({ preview_type: 'image', preview_url: dataUrl }).eq('id', app.id);
    return dataUrl;
  } catch (e) {
    console.error('[Seed Bundle] Preview generation failed for', app.id, e);
    return null;
  }
}

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('email').eq('clerk_user_id', userId).single();
    const isAdmin = profile?.email === 'msanchezgrice@gmail.com';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { regenerateImages = true } = body || {};

    const apps = manifests(userId);
    const results = [];

    // Insert or skip if exists
    for (const app of apps) {
      try {
        const { data: existing } = await supabase.from('apps').select('id').eq('id', app.id).single();
        if (existing?.id) {
          results.push({ id: app.id, status: 'exists' });
          continue;
        }
        const { error } = await supabase.from('apps').insert(app);
        if (error) {
          console.error('[Seed Bundle] Insert error', app.id, error);
          results.push({ id: app.id, status: 'error', error: error.message });
          continue;
        }
        results.push({ id: app.id, status: 'inserted' });
      } catch (e) {
        results.push({ id: app.id, status: 'error', error: e.message });
      }
    }

    // Generate Nano Banana previews (Gemini) for inserted or all (if regenerateImages)
    const geminiApiKey = process.env.GEMINI_API_KEY || null;
    if (geminiApiKey && regenerateImages) {
      for (const r of results) {
        if (r.status === 'inserted' || r.status === 'exists') {
          const { data: app } = await supabase.from('apps').select('id, name, description').eq('id', r.id).single();
          if (app) {
            const url = await generatePreviewWithGemini({ app, supabase, apiKey: geminiApiKey });
            r.preview = url ? 'generated' : 'skipped';
          }
          // light delay to avoid rate limits
          await new Promise(res => setTimeout(res, 1200));
        }
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error('[Seed Bundle] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}


