import { createAdminSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';
import { uploadImageVariants } from '@/src/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req) {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Get all apps with data URL images
    const { data: apps } = await supabase
      .from('apps')
      .select('id, name, preview_url')
      .like('preview_url', 'data:image%');
    
    if (!apps || apps.length === 0) {
      return NextResponse.json({ message: 'No images to migrate' });
    }
    
    console.log(`[Migrate Images] Found ${apps.length} apps with data URL images`);
    
    const results = [];
    
    for (const app of apps) {
      try {
        console.log(`[Migrate Images] Processing: ${app.name}`);
        
        // Extract base64 data and mime type from data URL
        const matches = app.preview_url.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        
        if (!matches) {
          console.error(`[Migrate Images] Invalid data URL for ${app.name}`);
          results.push({ appId: app.id, success: false, error: 'Invalid data URL' });
          continue;
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload responsive variants (WebP) and set 720 as canonical
        const baseKey = `app-previews/${app.id}`;
        const { defaultUrl, urls } = await uploadImageVariants(buffer, baseKey);
        
        // Update app with storage URL
        await supabase
          .from('apps')
          .update({
            preview_url: defaultUrl
          })
          .eq('id', app.id);
        
        console.log(`[Migrate Images] ✓ Migrated ${app.name} to variants`, urls);
        results.push({ appId: app.id, appName: app.name, success: true, url: defaultUrl });
        
      } catch (err) {
        console.error(`[Migrate Images] Error for ${app.name}:`, err);
        results.push({ appId: app.id, success: false, error: err.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`[Migrate Images] Complete: ${successful}/${apps.length} migrated`);
    
    return NextResponse.json({
      success: true,
      total: apps.length,
      migrated: successful,
      failed: apps.length - successful,
      results
    });
    
  } catch (error) {
    console.error('[Migrate Images] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

