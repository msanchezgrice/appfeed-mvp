import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { tool_llm_complete } from '@/src/lib/tools';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const mood = String(body.mood || 'encouraging');
    const topic = String(body.topic || 'general');
    const tone = String(body.tone_strength || 'medium');
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

    // Build prompt from chat history
    const lines = [];
    lines.push(`Topic: ${topic}`);
    lines.push(`Mood: ${mood} • Tone: ${tone}`);
    lines.push('');
    lines.push('Conversation so far:');
    for (const m of history) {
      const role = m.role === 'user' ? 'User' : 'Agent';
      const content = String(m.content || '').slice(0, 1200);
      lines.push(`${role}: ${content}`);
    }
    lines.push('');
    lines.push('Respond as the agent. Keep it short and conversational.');
    const prompt = lines.join('\n');

    const system = `You are a live chat agent. Match mood exactly: ${mood}. If asked for harmful advice or negative self-harm, deflect and keep safe.`;

    const res = await tool_llm_complete({
      userId,
      args: { system, prompt, temperature: 0.8, max_tokens: 250 },
      mode: 'use',
      supabase,
      fallbackAllowed: false
    });

    const msg = typeof res?.output === 'string' ? res.output : (res?.output?.markdown || '');
    return NextResponse.json({ message: msg, usedStub: !!res?.usedStub });
  } catch (e) {
    console.error('[API /chat] Error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

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


