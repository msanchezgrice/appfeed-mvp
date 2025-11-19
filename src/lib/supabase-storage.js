import { createAdminSupabaseClient } from './supabase-server';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Upload base64 image to Supabase Storage
 * @param {string} base64Data - Base64 encoded image data (without data:image/png;base64, prefix)
 * @param {string} fileName - File name for storage
 * @param {string} mimeType - Image MIME type (e.g., 'image/png')
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadImageToStorage(base64Data, fileName, mimeType = 'image/png') {
  const supabase = createAdminSupabaseClient();
  
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Determine file extension
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const filePath = `app-previews/${fileName}.${ext}`;
  
  console.log('[Storage] Uploading:', filePath, 'Size:', Math.round(buffer.length / 1024), 'KB');
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('app-images') // Make sure this bucket exists
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true // Overwrite if exists
    });
  
  if (error) {
    console.error('[Storage] Upload error:', error);
    throw error;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('app-images')
    .getPublicUrl(filePath);
  
  console.log('[Storage] Uploaded successfully:', publicUrl);
  
  return {
    url: publicUrl,
    path: filePath
  };
}

/**
 * Delete image from Supabase Storage
 * @param {string} filePath - Path in storage bucket
 */
export async function deleteImageFromStorage(filePath) {
  const supabase = createAdminSupabaseClient();
  
  const { error } = await supabase.storage
    .from('app-images')
    .remove([filePath]);
  
  if (error) {
    console.error('[Storage] Delete error:', error);
    throw error;
  }
  
  console.log('[Storage] Deleted:', filePath);
}

/**
 * Upload HTML bundle to Supabase Storage
 * @param {string} htmlContent - Full HTML content
 * @param {string} appId - App ID for file naming
 * @returns {Promise<{url: string, path: string, size: number}>}
 */
export async function uploadHtmlToStorage(htmlContent, appId) {
  const supabase = createAdminSupabaseClient();
  
  // Convert HTML string to buffer
  const buffer = Buffer.from(htmlContent, 'utf-8');
  // Use generic extension - Supabase is very restrictive with MIME types
  const filePath = `html-bundles/${appId}`;
  
  console.log('[Storage] Uploading HTML:', filePath, 'Size:', Math.round(buffer.length / 1024), 'KB');
  
  // Upload to Supabase Storage as application/octet-stream (generic binary, always supported)
  const { data, error } = await supabase.storage
    .from('app-images') // Use same bucket
    .upload(filePath, buffer, {
      contentType: 'application/octet-stream',
      upsert: true,
      cacheControl: '31536000' // Cache for 1 year
    });
  
  if (error) {
    console.error('[Storage] HTML upload error:', error);
    throw error;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('app-images')
    .getPublicUrl(filePath);
  
  console.log('[Storage] HTML uploaded successfully:', publicUrl);
  
  return {
    url: publicUrl,
    path: filePath,
    size: buffer.length
  };
}

/**
 * Upload 360/720/1080 WebP variants for an image buffer
 * Returns canonical 720 URL and all variant URLs following a stable naming
 * @param {Buffer} buffer
 * @param {string} baseFileKey e.g. "app-previews/abc123" (no extension)
 */
export async function uploadImageVariants(buffer, baseFileKey) {
  const supabase = createAdminSupabaseClient();
  const sanitizeSegment = (s) => {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96);
  };
  const parts = String(baseFileKey).split('/');
  const dir = parts.slice(0, -1).join('/');
  const name = sanitizeSegment(parts[parts.length - 1] || 'asset');
  const version = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 8);
  const keyFor = (w) => `${dir}/${name}-${w}-${version}.webp`;
  const variants = [
    { w: 360, key: keyFor(360) },
    { w: 720, key: keyFor(720) },
    { w: 1080, key: keyFor(1080) }
  ];
  const out = {};
  for (const v of variants) {
    const webp = await sharp(buffer).resize({ width: v.w, fit: 'inside', withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
    const { error } = await supabase.storage
      .from('app-images')
      .upload(v.key, webp, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000'
      });
    if (error) {
      console.error('[Storage] Variant upload error:', v.key, error);
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage.from('app-images').getPublicUrl(v.key);
    out[v.w] = publicUrl;
  }
  // Tiny blur placeholder (24px width)
  const blurBuf = await sharp(buffer).resize({ width: 24, fit: 'inside', withoutEnlargement: true }).webp({ quality: 35 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuf.toString('base64')}`;
  return {
    defaultUrl: out[720] || out[360] || out[1080],
    urls: out,
    blurDataUrl,
    version
  };
}

