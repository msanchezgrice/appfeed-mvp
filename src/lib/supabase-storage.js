import { createAdminSupabaseClient } from './supabase-server';

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

