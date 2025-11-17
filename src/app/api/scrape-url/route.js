import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { getDecryptedSecret } from '@/src/lib/secrets';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { url, image } = body;
    
    // Validate that at least one input is provided
    if (!url && !image) {
      return NextResponse.json({ error: 'URL or image is required' }, { status: 400 });
    }
    
    // Basic URL validation if provided
    let parsedUrl;
    if (url) {
      try {
        parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }
    
    console.log('[Scrape URL] Processing:', { hasUrl: !!url, hasImage: !!image }, 'for user:', userId);
    
    // Get OpenAI API key (user's or platform's)
    const envKey = process.env.OPENAI_API_KEY;
    let userKey = null;
    try {
      userKey = await getDecryptedSecret(userId, 'openai', supabase);
    } catch (err) {
      console.warn('[Scrape URL] Error retrieving user OpenAI key:', err);
    }
    
    const openaiKey = userKey || envKey;
    console.log('[Scrape URL] OpenAI key source:', userKey ? 'user-secret' : (envKey ? 'platform-env' : 'none'));
    
    if (!openaiKey) {
      return NextResponse.json({ 
        error: 'Missing OpenAI API key. Add it in Profile → Secrets.' 
      }, { status: 400 });
    }
    
    // Fetch the page content if URL is provided
    let pageContent = '';
    let pageTitle = '';
    
    if (url) {
      console.log('[Scrape URL] Fetching page content...');
      try {
        const pageResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ClipcadeBot/1.0; +https://clipcade.com)'
          },
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!pageResponse.ok) {
          throw new Error(`Failed to fetch page: ${pageResponse.status}`);
        }
        
        const html = await pageResponse.text();
        
        // Extract title and visible text content (simple approach)
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        pageTitle = titleMatch ? titleMatch[1] : '';
        
        // Remove scripts, styles, and extract text (basic cleaning)
        pageContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000); // Limit to 8000 chars to avoid token limits
        
        console.log('[Scrape URL] Page title:', pageTitle);
        console.log('[Scrape URL] Content length:', pageContent.length);
        
      } catch (fetchError) {
        console.error('[Scrape URL] Failed to fetch page:', fetchError);
        return NextResponse.json({ 
          error: 'Failed to fetch the URL. Make sure it is publicly accessible.' 
        }, { status: 400 });
      }
    }
    
    // Use OpenAI to analyze the page content or image
    const systemPrompt = `You are an AI app analyzer. You will receive either web page content or a screenshot/image and need to extract information to help create a similar app on the Clipcade platform.

Analyze the content/image and extract:
1. App name/title
2. Description of what it does
3. Input fields (name, type, label, placeholder, any constraints)
4. Output types (image, text, video, etc.)
5. Suggested tags/categories
6. UI design elements and style

Return ONLY a valid JSON object with this structure:
{
  "appName": "string",
  "description": "string (2-3 sentences)",
  "inputs": [
    {"name": "string", "type": "string", "label": "string", "placeholder": "string", "required": boolean}
  ],
  "outputTypes": ["image", "text", etc.],
  "tags": ["tag1", "tag2", ...],
  "suggestedPrompt": "A complete, detailed prompt that describes how to recreate this app"
}

Make the suggestedPrompt detailed and actionable. Include specifics about the UI, functionality, and behavior.`;

    // Build the user message based on whether we have URL or image
    let messages = [{ role: 'system', content: systemPrompt }];
    
    if (image) {
      // Vision API request with image
      console.log('[Scrape URL] Analyzing image with vision...');
      
      // Extract base64 data from data URL
      const base64Match = image.match(/^data:image\/[^;]+;base64,(.+)$/);
      const base64Data = base64Match ? base64Match[1] : image;
      
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this screenshot/image and extract app information. Look at the UI, text, inputs, and functionality shown. Provide a comprehensive prompt that could be used to recreate a similar app on the Clipcade platform.${url ? `\n\nThe image is from: ${url}` : ''}`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`,
              detail: 'high'
            }
          }
        ]
      });
    } else {
      // Text-only request with URL content
      console.log('[Scrape URL] Analyzing URL content...');
      messages.push({
        role: 'user',
        content: `Analyze this web page and extract app information:

URL: ${url}
Page Title: ${pageTitle}

Page Content:
${pageContent}

Extract all relevant information about what this app does, its inputs, outputs, and functionality. Provide a comprehensive prompt that could be used to recreate a similar app on the Clipcade platform.`
      });
    }

    // Call OpenAI API with GPT-4o (supports vision)
    const model = 'gpt-4o';
    
    console.log('[Scrape URL] Calling OpenAI with model:', model, '(vision:', !!image, ')');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Scrape URL] OpenAI API error:', errorText);
      return NextResponse.json({ 
        error: `OpenAI API error: ${errorText}` 
      }, { status: 502 });
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ 
        error: 'No response from OpenAI' 
      }, { status: 502 });
    }
    
    console.log('[Scrape URL] OpenAI raw response:', content);
    
    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (e) {
      console.error('[Scrape URL] Failed to parse OpenAI response:', e);
      return NextResponse.json({ 
        error: 'Failed to parse AI response' 
      }, { status: 500 });
    }
    
    // Validate the extracted data has required fields
    if (!extractedData.appName || !extractedData.description || !extractedData.suggestedPrompt) {
      console.warn('[Scrape URL] Incomplete data extracted:', extractedData);
      return NextResponse.json({ 
        error: 'Could not extract enough information from the URL' 
      }, { status: 400 });
    }
    
    console.log('[Scrape URL] Successfully extracted:', {
      appName: extractedData.appName,
      inputCount: extractedData.inputs?.length || 0,
      outputCount: extractedData.outputTypes?.length || 0
    });
    
    // Return the extracted data
    return NextResponse.json({
      success: true,
      data: extractedData
    });
    
  } catch (error) {
    console.error('[Scrape URL] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape URL' },
      { status: 500 }
    );
  }
}

