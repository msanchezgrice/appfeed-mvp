import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { tool_llm_complete } from '@/src/lib/tools';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient({ allowAnonymous: true });
    const body = await req.json();
    const { mood = 'encouraging', tone_strength = 'medium', messages = [] } = body || {};
    const mode = userId ? 'use' : 'try';

    const system = `You are a live chat agent. Match the selected mood exactly: ${mood}. Keep responses short, conversational, and safe. Tone strength: ${tone_strength}.`;
    const transcript = messages.map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`).join('\n');
    const prompt = `Conversation so far:\n${transcript}\n\nRespond as the ${mood} agent.`;

    const res = await tool_llm_complete({
      userId,
      args: { system, prompt },
      mode,
      supabase,
      fallbackAllowed: true
    });

    return NextResponse.json({
      ok: true,
      output: res?.output || null,
      message: res?.output?.markdown || ''
    });
  } catch (e) {
    console.error('[API /chat] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}


