import { createAdminSupabaseClient } from '@/src/lib/supabase-server';
import { NextResponse } from 'next/server';

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
        
        // Determine file extension
        const ext = mimeType.includes('png') ? 'png' : 'jpg';
        const filePath = `app-previews/${app.id}.${ext}`;
        
        console.log(`[Migrate Images] Uploading ${app.name}: ${Math.round(buffer.length / 1024)} KB`);
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('app-images')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });
        
        if (uploadError) {
          console.error(`[Migrate Images] Upload failed for ${app.name}:`, uploadError);
          results.push({ appId: app.id, success: false, error: uploadError.message });
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('app-images')
          .getPublicUrl(filePath);
        
        // Update app with storage URL
        await supabase
          .from('apps')
          .update({
            preview_url: publicUrl
          })
          .eq('id', app.id);
        
        console.log(`[Migrate Images] ✓ Migrated ${app.name} to: ${publicUrl}`);
        results.push({ appId: app.id, appName: app.name, success: true, url: publicUrl });
        
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

