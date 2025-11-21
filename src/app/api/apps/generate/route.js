import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { sanitizeManifest, generateManifestWithAnthropic } from '@/src/lib/ai-publish';
import { DEFAULT_AI_TOOLS } from '@/src/lib/publish-tools';

export async function POST(request) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, tools, toolOrder, promptTemplates, model } = body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let toolWhitelist = Array.isArray(tools) && tools.length ? tools : DEFAULT_AI_TOOLS;
    if (!Array.isArray(toolWhitelist) || !toolWhitelist.length) {
      toolWhitelist = [DEFAULT_AI_TOOLS[0] || 'llm.complete'];
    }
    const normalizedOrder = Array.isArray(toolOrder) && toolOrder.length ? toolOrder : toolWhitelist;

    const rawManifest = await generateManifestWithAnthropic({
      prompt,
      userId,
      supabase,
      toolWhitelist,
      toolOrder: normalizedOrder,
      promptTemplates,
      model
    });

    const manifest = sanitizeManifest(rawManifest, {
      allowedTools: toolWhitelist,
      toolOrder: normalizedOrder,
      promptTemplates
    });

    return NextResponse.json({ manifest });
  } catch (error) {
    console.error('[API] Manifest generate error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate manifest' }, { status: 500 });
  }
}
