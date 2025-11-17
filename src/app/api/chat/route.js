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

    console.log('[Chat API] Received request:', { mood, tone_strength, messageCount: messages.length, userId, mode });

    // Build conversation context with full message history
    const system = `You are a live chat agent with the following characteristics:
- Mood: ${mood} (match this mood consistently in all responses)
- Tone strength: ${tone_strength}
- Keep responses conversational, engaging, and appropriate
- Maintain context from the entire conversation
- Respond naturally to the user's latest message while remembering what was discussed before`;

    // Format the conversation history for the LLM
    const transcript = messages.map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`).join('\n');
    
    // Get the last user message for context
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    const prompt = `Conversation history:
${transcript}

Now respond to the user's latest message as a ${mood} agent with ${tone_strength} tone. Keep your response natural and conversational.`;

    console.log('[Chat API] Calling LLM with', messages.length, 'messages');

    const res = await tool_llm_complete({
      userId,
      args: { system, prompt },
      mode,
      supabase,
      fallbackAllowed: true
    });

    console.log('[Chat API] LLM response received:', { 
      hasOutput: !!res?.output, 
      outputLength: res?.output?.markdown?.length || 0,
      usedStub: res?.usedStub 
    });

    return NextResponse.json({
      ok: true,
      output: res?.output || null,
      message: res?.output?.markdown || res?.output || 'No response generated',
      usedStub: res?.usedStub || false
    });
  } catch (e) {
    console.error('[API /chat] Error:', e);
    return NextResponse.json({ 
      error: e.message || 'Failed',
      message: '⚠️ An error occurred. Please try again.' 
    }, { status: 500 });
  }
}

