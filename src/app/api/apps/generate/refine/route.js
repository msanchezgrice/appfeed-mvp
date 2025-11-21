import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { sanitizeManifest, refineManifestWithAnthropic } from '@/src/lib/ai-publish';
import { DEFAULT_AI_TOOLS } from '@/src/lib/publish-tools';

export async function POST(request) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { manifest, instructions, tools, toolOrder, promptTemplates, model } = body || {};
    if (!manifest || typeof manifest !== 'object') {
      return NextResponse.json({ error: 'Manifest is required for refinement' }, { status: 400 });
    }
    if (!instructions || typeof instructions !== 'string' || !instructions.trim()) {
      return NextResponse.json({ error: 'Instructions are required' }, { status: 400 });
    }

    let toolWhitelist = Array.isArray(tools) && tools.length ? tools : DEFAULT_AI_TOOLS;
    if (!Array.isArray(toolWhitelist) || !toolWhitelist.length) {
      toolWhitelist = [DEFAULT_AI_TOOLS[0] || 'llm.complete'];
    }
    const normalizedOrder = Array.isArray(toolOrder) && toolOrder.length ? toolOrder : toolWhitelist;

    const rawManifest = await refineManifestWithAnthropic({
      manifest,
      instructions,
      userId,
      supabase,
      toolWhitelist,
      toolOrder: normalizedOrder,
      promptTemplates,
      model
    });

    const cleanedManifest = sanitizeManifest(rawManifest, {
      allowedTools: toolWhitelist,
      toolOrder: normalizedOrder,
      promptTemplates
    });

    return NextResponse.json({ manifest: cleanedManifest });
  } catch (error) {
    console.error('[API] Manifest refine error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refine manifest' }, { status: 500 });
  }
}
