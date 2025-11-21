import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';
import { runApp } from '@/src/lib/runner';

export async function POST(req) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { manifest, inputs, mode } = body || {};

    if (!manifest || typeof manifest !== 'object') {
      return NextResponse.json({ error: 'Manifest required' }, { status: 400 });
    }

    const previewApp = {
      id: manifest.id || `preview-${Date.now()}`,
      name: manifest.name || 'Preview App',
      description: manifest.description || '',
      tags: manifest.tags || [],
      demo: manifest.demo || { sampleInputs: {} },
      inputs: manifest.inputs || {},
      outputs: manifest.outputs || { markdown: { type: 'string' } },
      runtime: manifest.runtime || { engine: 'local', steps: [] },
      design: manifest.design || {},
      modal_theme: manifest.modal_theme || {},
      input_theme: manifest.input_theme || {},
      preview_gradient: manifest.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

    const run = await runApp({
      app: previewApp,
      inputs: inputs || previewApp.demo?.sampleInputs || {},
      userId,
      mode: mode === 'use' ? 'use' : 'try',
      supabase,
      fallbackAllowed: true
    });

    return NextResponse.json({ run });
  } catch (error) {
    console.error('[API] Preview run error:', error);
    return NextResponse.json({ error: error.message || 'Failed to run preview' }, { status: 500 });
  }
}
