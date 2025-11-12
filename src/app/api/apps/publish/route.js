import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/src/lib/supabase-server';

export async function POST(request) {
  try {
    const { supabase, userId } = await createServerSupabaseClient();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();

    const { mode, appData } = body;
    
    console.log('[Publish] Request received:', { 
      mode, 
      userId,
      hasAppData: !!appData,
      appDataKeys: Object.keys(appData || {})
    });

    // Generate app ID
    const appName = appData.name || appData.analysisResult?.name || 'app';
    const appId = `${appName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

    // Create app object based on mode
    let newApp;

    if (mode === 'inline') {
      // Parse manifest JSON
      let manifest;
      try {
        manifest = JSON.parse(appData.manifestJson);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid manifest JSON' }, { status: 400 });
      }

      newApp = {
        id: appId,
        name: appData.name,
        creator_id: userId,
        description: appData.description,
        tags: appData.tags ? appData.tags.split(',').map(t => t.trim()) : [],
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        demo: manifest.demo || { sampleInputs: {} },
        inputs: manifest.inputs || {},
        outputs: manifest.outputs || { markdown: { type: 'string' } },
        runtime: manifest.runtime || {},
        fork_of: null
      };
    } else if (mode === 'remote') {
      newApp = {
        id: appId,
        name: `Remote: ${appData.remoteUrl}`,
        creator_id: userId,
        description: 'Remote adapter app',
        tags: appData.tags ? appData.tags.split(',').map(t => t.trim()) : [],
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        demo: { sampleInputs: {} },
        inputs: {},
        outputs: { markdown: { type: 'string' } },
        runtime: {
          engine: 'remote',
          url: appData.remoteUrl
        },
        fork_of: null
      };
    } else if (mode === 'github') {
      // GitHub analysis result contains the manifest
      const manifest = appData.analysisResult?.manifest || {};
      const analysisName = appData.analysisResult?.name || appData.name || 'GitHub App';
      const analysisDescription = appData.analysisResult?.description || appData.description || 'AI-generated app from GitHub';
      const analysisTags = appData.tags ? appData.tags.split(',').map(t => t.trim()) : (appData.analysisResult?.tags || ['github', 'ai-generated']);

      newApp = {
        id: appId,
        name: analysisName,
        creator_id: userId,
        description: analysisDescription,
        tags: analysisTags,
        device_types: appData.isMobile ? ['mobile'] : ['mobile', 'desktop'],
        preview_type: 'image',
        preview_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop',
        preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        demo: manifest.demo || { sampleInputs: {} },
        inputs: manifest.inputs || {},
        outputs: manifest.outputs || { markdown: { type: 'string' } },
        runtime: manifest.runtime || {
          engine: 'remote',
          url: manifest.run?.url || ''
        },
        fork_of: null,
        github_url: appData.githubUrl,
        is_published: true
      };
    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    // Insert app into Supabase
    const { data: insertedApp, error } = await supabase
      .from('apps')
      .insert(newApp)
      .select()
      .single();

    if (error) {
      console.error('Error inserting app:', error);
      return NextResponse.json({ error: 'Failed to publish app' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      appId: insertedApp.id,
      app: insertedApp
    });

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish app' },
      { status: 500 }
    );
  }
}
