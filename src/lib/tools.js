import { getDecryptedSecret } from './secrets.js';

const OPENAI_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Utility to perform template interpolation like {{var||fallback}}
function tpl(str, ctx) {
  return String(str || '').replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const [path, fb] = expr.split('||').map(s => s.trim());
    const val = path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined) ? acc[k] : undefined, ctx);
    return (val === undefined || val === null || val === '') ? (fb ?? '') : String(val);
  });
}

// Fetch article content from URL using Jina AI Reader
async function fetchArticleContent(url) {
  try {
    console.log('[Article Fetch] Fetching:', url);
    
    // Use Jina AI Reader API - free service for clean article extraction
    const jinaUrl = `https://r.jina.ai/${url}`;
    
    const response = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain' }
    });
    
    if (!response.ok) {
      console.error('[Article Fetch] Failed:', response.status);
      return null;
    }
    
    const content = await response.text();
    console.log('[Article Fetch] Success, content length:', content.length);
    
    // Limit to first 3000 chars to fit in context
    return content.substring(0, 3000);
    
  } catch (error) {
    console.error('[Article Fetch] Error:', error);
    return null;
  }
}

export async function tool_llm_complete({ userId, args, mode, supabase }) {
  // Try to use BYOK OpenAI key from encrypted Supabase secrets
  console.log('[LLM] Starting - userId:', userId, 'mode:', mode);
  
  let apiKey = null;
  
  if (!userId) {
    console.log('[LLM] No userId - user not signed in, using stub');
    return {
      output: `🔒 Sign in to use real AI - Currently showing stub data.\n\nTo enable real AI responses:\n1. Sign in at /profile\n2. Add your OpenAI API key in Settings\n3. Try this app again!`,
      usedStub: true,
      error: 'USER_NOT_SIGNED_IN'
    };
  }
  
  if (!supabase) {
    console.error('[LLM] No supabase client provided');
    return {
      output: `⚠️ Error: Database connection missing. Please contact support.`,
      usedStub: true,
      error: 'NO_SUPABASE_CLIENT'
    };
  }
  
  console.log('[LLM] Attempting to retrieve API key for user:', userId);
  
  try {
    apiKey = await getDecryptedSecret(userId, 'openai', supabase);
    console.log('[LLM] API key retrieval result:', apiKey ? 'KEY_FOUND' : 'NO_KEY');
  } catch (err) {
    console.error('[LLM] Error retrieving API key:', err);
    return {
      output: `⚠️ Error retrieving API key: ${err.message}\n\nPlease check:\n1. You're signed in\n2. API key is saved in Settings\n3. Database connection is working`,
      usedStub: true,
      error: `KEY_RETRIEVAL_ERROR: ${err.message}`
    };
  }
  
  if (!apiKey) {
    console.log('[LLM] No API key found for user - need to add in settings');
    return {
      output: `🔑 No API key found.\n\nTo use real AI:\n1. Go to /profile → Settings\n2. Enter your OpenAI API key (sk-...)\n3. Click "Save API Keys"\n4. Try this app again!`,
      usedStub: true,
      error: 'NO_API_KEY_CONFIGURED'
    };
  }
  
  console.log('[LLM] API key found, making OpenAI API call...');
  const system = tpl(args.system || '', {});
  const prompt = tpl(args.prompt || '', {});
  
  // Check if prompt contains URLs - if so, use web search tool
  const hasUrl = /https?:\/\/[^\s]+/.test(prompt);
  
  if (hasUrl) {
    console.log('[LLM] URL detected in prompt, using Responses API with web search tool');
  }
  
  // Enhanced design guidelines for prettier outputs
  const designGuidelines = `

OUTPUT DESIGN GUIDELINES:
- Use clear markdown formatting with headers (##, ###)
- Include relevant emojis to make content engaging
- Structure: Use bullet points or numbered lists where appropriate
- Tone: Friendly, professional, and helpful
- Format: Keep paragraphs short and scannable
- Style: Use **bold** for emphasis, *italics* for nuance
- Always end with a helpful tip or call-to-action when appropriate

APP DESIGN CONTEXT (for reference):
- Container color: ${args.design?.containerColor || 'purple-blue gradient'}
- Font color: ${args.design?.fontColor || 'white'}
- Font family: ${args.design?.fontFamily || 'system default'}
- Input layout: ${args.design?.inputLayout || 'vertical'}

Note: Container size, max width, and core layout are FIXED and cannot be changed.

Remember: Make the output visually appealing and easy to read!
`;

  const enhancedSystem = system ? `${system}${designGuidelines}` : `You are a helpful AI assistant.${designGuidelines}`;
  
  console.log('[LLM] Making OpenAI API request:', {
    model: DEFAULT_MODEL,
    promptLength: prompt.length,
    systemLength: system.length,
    hasUrl
  });
  
  try {
    // Use Responses API with web search for URLs, otherwise Chat Completions
    const endpoint = hasUrl 
      ? `${OPENAI_BASE}/v1/responses`
      : `${OPENAI_BASE}/v1/chat/completions`;
    
    const requestBody = hasUrl ? {
      // Responses API format
      model: DEFAULT_MODEL,
      input: prompt,
      instructions: enhancedSystem,
      tools: [{ type: "web_search" }],
      temperature: 0.7,
      max_output_tokens: 500
    } : {
      // Chat Completions format  
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: enhancedSystem },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    };
    
    console.log('[LLM] Calling:', endpoint);
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('[LLM] OpenAI response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[LLM] OpenAI API error:', res.status, errorText.slice(0, 200));
      return { 
        output: `❌ OpenAI API Error (${res.status}):\n${errorText.slice(0, 300)}\n\nCheck:\n1. Your API key is valid\n2. You have OpenAI credits\n3. API key has correct permissions`, 
        usedStub: true,
        error: `OPENAI_API_ERROR_${res.status}`
      };
    }
    
    const j = await res.json();
    
    console.log('[LLM] Response format:', {
      hasOutput: !!j.output,
      hasChoices: !!j.choices,
      outputType: typeof j.output,
      keys: Object.keys(j).join(', ')
    });
    
    // Handle both Responses API and Chat Completions responses
    let txt;
    if (hasUrl && j.output !== undefined) {
      // Responses API returns complex nested structure
      console.log('[LLM] Parsing Responses API output...');
      
      if (typeof j.output === 'string') {
        txt = j.output.trim();
      } else if (Array.isArray(j.output)) {
        // Output is array of parts - find the message with text
        const textParts = j.output
          .filter(part => part.type === 'message' || part.text)
          .map(part => {
            if (part.text) return part.text;
            if (part.content && Array.isArray(part.content)) {
              return part.content
                .filter(c => c.type === 'output_text' || c.text)
                .map(c => c.text)
                .join('\n');
            }
            return '';
          })
          .filter(Boolean);
        txt = textParts.join('\n\n');
      } else if (j.output.content) {
        txt = j.output.content;
      } else if (j.text) {
        // Sometimes the text is at top level
        txt = j.text;
      } else {
        txt = JSON.stringify(j.output);
      }
      console.log('[LLM] Responses API parsed! Text extracted:', txt.substring(0, 100));
    } else {
      // Chat Completions format: { choices: [{ message: { content: "text" } }] }
      txt = j.choices?.[0]?.message?.content?.trim() || 'No content';
    }
    
    console.log('[LLM] Success! Response length:', txt.length);
    return { 
      output: { markdown: txt },  // Return as object with markdown field
      usedStub: false 
    };
  } catch (err) {
    console.error('[LLM] Network/fetch error:', err);
    return {
      output: `⚠️ Network error calling OpenAI:\n${err.message}\n\nThis might be a connection issue or invalid API key format.`,
      usedStub: true,
      error: `NETWORK_ERROR: ${err.message}`
    };
  }
}

const ACTIVITY_DB = {
  'austin': {
    outdoors: ['Lady Bird Lake loop', 'Barton Springs dip', 'Zilker picnic', 'Greenbelt hike', 'Sunset at Mount Bonnell'],
    indoors: ['Blanton Museum', 'Pinballz arcade', 'BookPeople browse', 'Austin Bouldering Project', 'IMAX at Bob Bullock'],
    family: ['Thinkery kids museum', 'Zilker Zephyr (mini train)', 'Austin Zoo', 'Kite flying at Zilker', 'Central Library atrium'],
    date: ['Wine at South Congress', 'Paddle board at sunset', 'Alamo Drafthouse', 'Eberly dinner', 'Mozart’s coffee']
  },
  'san francisco': {
    outdoors: ['Crissy Field walk', 'Lands End trail', 'Golden Gate Park bikes', 'Twin Peaks sunset', 'Ocean Beach bonfire'],
    indoors: ['Exploratorium', 'SF MOMA', 'Yerba Buena ice rink', 'Archery at Golden Gate Park', 'Alcatraz night tour'],
    family: ['California Academy of Sciences', 'Children’s Creativity Museum', 'Cable Car ride', 'Aquarium by the Bay', 'Dolores Park picnic'],
    date: ['Ferry Building oysters', 'Painted Ladies sunset', 'Foreign Cinema', 'Bike to Sausalito', 'Marina stroll']
  }
};

export async function tool_activities_lookup({ args }) {
  const city = (args.city || '').toLowerCase().trim();
  const vibe = (args.vibe || 'outdoors').toLowerCase().trim();
  const catalog = ACTIVITY_DB[city] || ACTIVITY_DB['austin'];
  const list = catalog[vibe] || catalog['outdoors'];
  const items = list.slice(0, Math.max(1, Math.min(5, Number(args.limit) || 5))).map((name, i) => ({
    rank: i+1, name, where: city || 'austin', vibe
  }));
  return { output: items };
}

export async function tool_todo_add({ userId, args, mode, supabase }) {
  const title = String(args.title || '').trim();
  if (!title) return { output: { ok:false, error:'Missing title' } };
  const due = String(args.due || '').trim();
  const item = { id: 'td_' + Math.random().toString(36).slice(2,9), title, due, done:false, createdAt: new Date().toISOString() };
  
  if (mode === 'use' && userId && supabase) {
    // Save to database
    try {
      const { error } = await supabase
        .from('todos')
        .insert({
          user_id: userId,
          title,
          due_date: due || null,
          completed: false
        });
      
      if (error) {
        console.error('Error saving todo:', error);
        return { output: { ok:false, error: 'Failed to save todo' } };
      }
      
      // Get total count
      const { count } = await supabase
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      return { output: { ok:true, added: item, total: count || 1 } };
    } catch (err) {
      console.error('Todo add error:', err);
      return { output: { ok:false, error: String(err.message) } };
    }
  } else {
    return { output: { ok:true, added: item, simulated:true } };
  }
}

// Image processing tool using Gemini Image Generation
export async function tool_image_process({ userId, args, mode, supabase }) {
  console.log('[Image Process] Starting:', { userId, mode, instruction: args.instruction?.substring(0, 50) });
  
  const imageData = args.image; // base64 or URL
  const instruction = args.instruction || 'Transform this image artistically';
  
  if (!imageData) {
    return {
      output: { markdown: 'No image provided' },
      error: 'IMAGE_REQUIRED'
    };
  }
  
  // Get Gemini API key from environment
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiKey) {
    console.error('[Image Process] No Gemini API key');
    return {
      output: { markdown: 'Gemini API key not configured' },
      error: 'NO_GEMINI_KEY'
    };
  }
  
  try {
    // Extract base64 data if it's a data URL
    let base64Data = imageData;
    let mimeType = 'image/jpeg';
    
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }
    
    console.log('[Image Process] Calling Gemini 2.5 Flash Image API for generation...');
    
    // Use gemini-2.5-flash-image for actual image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: instruction },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["Image"], // Request image output, not text
            imageConfig: {
              aspectRatio: "1:1" // Square output
            }
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Image Process] API error:', error);
      return {
        output: { markdown: `Image generation failed: ${response.statusText}` },
        error: 'API_ERROR'
      };
    }
    
    const result = await response.json();
    
    // Extract generated image from response
    const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inline_data || p.inlineData);
    
    if (imagePart) {
      const generatedImage = imagePart.inline_data || imagePart.inlineData;
      const imageBase64 = generatedImage.data;
      const imageMime = generatedImage.mime_type || generatedImage.mimeType || 'image/png';
      
      console.log('[Image Process] Image generated successfully!', imageBase64.substring(0, 50));
      
      return {
        output: { 
          image: `data:${imageMime};base64,${imageBase64}`,
          markdown: '✨ **Image transformed successfully!**\n\nYour artistic image is ready!'
        },
        metadata: {
          model: 'gemini-2.5-flash-image',
          tokens: result.usageMetadata?.totalTokenCount || 1290
        }
      };
    } else {
      // Fallback to text if no image generated
      const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No result';
      return {
        output: { markdown: textOutput },
        metadata: { model: 'gemini-2.5-flash-image' }
      };
    }
    
  } catch (error) {
    console.error('[Image Process] Error:', error);
    return {
      output: { markdown: `Error processing image: ${error.message}` },
      error: 'PROCESSING_ERROR'
    };
  }
}

// Email sending tool using Resend
export async function tool_email_send({ userId, args, mode, supabase }) {
  console.log('[Email Send] Starting:', { userId, to: args.to, subject: args.subject });
  
  const { to, subject, content } = args;
  
  if (!to || !content) {
    return {
      output: { markdown: '❌ Email and content are required' },
      error: 'MISSING_PARAMS'
    };
  }
  
  // Get Resend API key from environment
  const resendKey = process.env.RESEND_API_KEY;
  
  if (!resendKey) {
    console.error('[Email Send] No Resend API key configured');
    return {
      output: { markdown: '⚠️ Email service not configured. Contact support.' },
      error: 'NO_EMAIL_KEY'
    };
  }
  
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    
    console.log('[Email Send] Sending email via Resend...');
    
    const { data, error } = await resend.emails.send({
      from: 'AppFeed <noreply@clipcade.com>',
      to: [to],
      subject: subject || 'Your AppFeed Result',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Your AppFeed Result</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #888; font-size: 12px;">
            Sent from <a href="https://www.clipcade.com">AppFeed</a>
          </p>
        </div>
      `
    });
    
    if (error) {
      console.error('[Email Send] Error:', error);
      return {
        output: { markdown: `❌ Email failed: ${error.message}` },
        error: 'SEND_ERROR'
      };
    }
    
    console.log('[Email Send] Success:', data);
    
    return {
      output: { 
        markdown: `✅ **Email sent successfully!**\n\nSent to: ${to}\n\nCheck your inbox! 📬` 
      },
      metadata: {
        emailId: data.id
      }
    };
    
  } catch (error) {
    console.error('[Email Send] Error:', error);
    return {
      output: { markdown: `❌ Error sending email: ${error.message}` },
      error: 'EMAIL_ERROR'
    };
  }
}

export const ToolRegistry = {
  'llm.complete': tool_llm_complete,
  'image.process': tool_image_process,
  'email.send': tool_email_send,
  'activities.lookup': tool_activities_lookup,
  'todo.add': tool_todo_add
};

export function interpolateArgs(args, ctx) {
  if (!args) return {};
  const tplStr = (s) => String(s || '').replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const [path, fb] = expr.split('||').map(s => s.trim());
    const val = path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined) ? acc[k] : undefined, ctx);
    return (val === undefined || val === null || val === '') ? (fb ?? '') : String(val);
  });
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    out[k] = typeof v === 'string' ? tplStr(v) : v;
  }
  return out;
}
