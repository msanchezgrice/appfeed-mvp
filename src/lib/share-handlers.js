const SITE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com';

/**
 * Platform-specific share handlers
 * Each handler receives app, run (optional), and assetUrl (optional)
 */
export const shareHandlers = {
  /**
   * Twitter/X share
   * Opens Twitter intent with pre-filled text and URL
   */
  twitter: (app, run = null, assetUrl = null) => {
    const isResult = !!run;
    const text = isResult
      ? `Check out what I made with ${app.name}! 🎨\n\nTry it yourself on @clipcade`
      : `Try ${app.name} on @clipcade! 🚀`;
    
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    
    return { platform: 'twitter', url };
  },

  /**
   * SMS share
   * Opens SMS compose with pre-filled text and image if available
   * Works on iOS and Android
   */
  sms: async (app, run = null, assetUrl = null) => {
    const isResult = !!run;
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    const title = isResult
      ? `Check out my ${app.name} result!`
      : app.name;
    
    const text = isResult
      ? `Check out what I made with ${app.name}!`
      : app.description || `Try ${app.name} on Clipcade!`;
    
    // Try to use native share with image if available (works better for SMS)
    if (navigator.share && assetUrl && isResult) {
      console.log('[Share] Attempting SMS with image via native share', { assetUrl });
      
      try {
        const shareData = {
          title,
          text,
          url,
        };
        
        // Try to include image file with improved error handling
        try {
          console.log('[Share] Fetching image from:', assetUrl);
          
          // Fetch with no-cors mode if needed
          const response = await fetch(assetUrl, {
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log('[Share] Image fetched:', { size: blob.size, type: blob.type });
          
          // Ensure proper MIME type
          const mimeType = blob.type || 'image/jpeg';
          const imageBlob = new Blob([blob], { type: mimeType });
          
          // Create file with explicit type and descriptive name
          const sanitizedName = app.name.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
          const fileName = `${sanitizedName}_result.jpg`;
          const file = new File([imageBlob], fileName, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          console.log('[Share] File created:', { name: file.name, size: file.size, type: file.type });
          
          // Check if files can be shared
          if (navigator.canShare) {
            const canShareWithFile = navigator.canShare({ files: [file] });
            console.log('[Share] Can share with file:', canShareWithFile);
            
            if (canShareWithFile) {
              shareData.files = [file];
              console.log('[Share] ✓ Image file added to share data');
            } else {
              console.warn('[Share] ⚠️ Device does not support file sharing');
            }
          } else {
            console.warn('[Share] ⚠️ navigator.canShare not available');
          }
        } catch (imgError) {
          console.error('[Share] ❌ Image fetch failed:', imgError);
          console.error('[Share] Error details:', {
            message: imgError.message,
            name: imgError.name,
            stack: imgError.stack
          });
          // Continue without image
        }
        
        console.log('[Share] Triggering native share:', shareData);
        await navigator.share(shareData);
        console.log('[Share] ✓ Native share completed');
        
        return { platform: 'sms', url, withImage: !!shareData.files };
      } catch (shareError) {
        // If native share fails or is cancelled, fall back to SMS protocol
        if (shareError.name === 'AbortError') {
          console.log('[Share] User cancelled share');
          throw shareError; // User cancelled, bubble up
        }
        console.error('[Share] Native share failed:', shareError);
        console.warn('[Share] Falling back to SMS protocol (no image support)');
      }
    } else {
      console.log('[Share] Native share not available or no image', {
        hasNavigatorShare: !!navigator.share,
        hasAssetUrl: !!assetUrl,
        isResult
      });
    }
    
    // Fallback: SMS protocol (works on iOS and Android, but no image)
    console.log('[Share] Using SMS protocol fallback');
    const smsText = isResult
      ? `Check out what I made with ${app.name}! ${url}`
      : `Try ${app.name} on Clipcade! ${url}`;
    
    const smsUrl = `sms:?&body=${encodeURIComponent(smsText)}`;
    window.location.href = smsUrl;
    
    return { platform: 'sms', url, withImage: false };
  },

  /**
   * Email share
   * Opens email client with pre-filled subject and body
   */
  email: (app, run = null, assetUrl = null) => {
    const isResult = !!run;
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    const subject = isResult
      ? `Check out my ${app.name} result!`
      : `Try ${app.name} on Clipcade`;
    
    const body = isResult
      ? `I created this using ${app.name} on Clipcade.\n\nSee it here: ${url}${assetUrl ? `\n\nDirect image: ${assetUrl}` : ''}`
      : `I thought you'd like this app: ${app.name}\n\n${app.description}\n\nTry it here: ${url}`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    
    return { platform: 'email', url };
  },

  /**
   * WhatsApp share
   * Opens WhatsApp with pre-filled message
   */
  whatsapp: (app, run = null, assetUrl = null) => {
    const isResult = !!run;
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    const text = isResult
      ? `Check out what I made with ${app.name}! ${url}`
      : `Try ${app.name} on Clipcade! ${url}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    
    return { platform: 'whatsapp', url };
  },

  /**
   * TikTok share
   * Opens TikTok app if available, otherwise copies link
   */
  tiktok: (app, run = null, assetUrl = null) => {
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    // Try to open TikTok app (deep link)
    const tiktokUrl = `snssdk1233://`;
    
    // Copy link first
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        // Try to open TikTok app
        window.location.href = tiktokUrl;
        
        // Fallback message if app doesn't open
        setTimeout(() => {
          alert('Link copied! Paste it in TikTok to share.');
        }, 1000);
      });
    } else {
      alert('Link copied! Open TikTok and paste to share.');
    }
    
    return { platform: 'tiktok', url };
  },

  /**
   * Copy link to clipboard
   * Includes both app URL and asset URL if available
   */
  copyLink: async (app, run = null, assetUrl = null) => {
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    const textToCopy = assetUrl && run
      ? `${url}\n\nDirect image: ${assetUrl}`
      : url;
    
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    
    return { platform: 'copy', url, copied: true };
  },

  /**
   * Save image to device
   * Downloads the asset image if available
   */
  saveImage: async (app, run = null, assetUrl = null) => {
    if (!assetUrl) {
      throw new Error('No image to save');
    }
    
    try {
      // Fetch the image
      const response = await fetch(assetUrl);
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${app.id}${run ? `-${run.id}` : ''}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      
      return { platform: 'save', saved: true };
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  },

  /**
   * Native share
   * Triggers the browser's native share sheet
   * Includes image file if available
   */
  nativeShare: async (app, run = null, assetUrl = null) => {
    if (!navigator.share) {
      throw new Error('Native share not supported');
    }
    
    console.log('[Share] Native share triggered', { assetUrl, hasRun: !!run });
    
    const isResult = !!run;
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    const title = isResult
      ? `Check out my ${app.name} result!`
      : app.name;
    
    const text = isResult
      ? `See my creation from ${app.name}`
      : app.description;
    
    const shareData = {
      title,
      text,
      url,
    };
    
    // Try to include image file if available
    if (assetUrl && run) {
      try {
        console.log('[Share] Fetching image for native share:', assetUrl);
        
        const response = await fetch(assetUrl, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('[Share] Image fetched:', { size: blob.size, type: blob.type });
        
        // Ensure proper MIME type
        const mimeType = blob.type || 'image/jpeg';
        const imageBlob = new Blob([blob], { type: mimeType });
        
        // Create file with explicit type and descriptive name
        const sanitizedName = app.name.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        const fileName = `${sanitizedName}_result.jpg`;
        const file = new File([imageBlob], fileName, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        console.log('[Share] File created:', { name: file.name, size: file.size, type: file.type });
        
        // Check if files can be shared
        if (navigator.canShare) {
          const canShareWithFile = navigator.canShare({ files: [file] });
          console.log('[Share] Can share with file:', canShareWithFile);
          
          if (canShareWithFile) {
            shareData.files = [file];
            console.log('[Share] ✓ Image file added to native share');
          } else {
            console.warn('[Share] ⚠️ Device does not support file sharing');
          }
        } else {
          console.warn('[Share] ⚠️ navigator.canShare not available');
        }
      } catch (error) {
        console.error('[Share] ❌ Error adding file to share:', error);
        console.error('[Share] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        // Continue without file
      }
    }
    
    console.log('[Share] Triggering native share sheet:', shareData);
    await navigator.share(shareData);
    console.log('[Share] ✓ Native share completed');
    
    return { platform: 'native', url, withImage: !!shareData.files };
  }
};

/**
 * Get appropriate share platforms based on context
 * Returns array of platform objects with labels and icons
 */
export function getSharePlatforms(hasImage = false) {
  const platforms = [
    { id: 'twitter', label: 'Twitter', icon: '𝕏', color: '#000000' },
    { id: 'sms', label: 'SMS', icon: '💬', color: '#34C759' },
    { id: 'email', label: 'Email', icon: '✉️', color: '#FF9500' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '📱', color: '#25D366' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#FE2C55' },
    { id: 'copyLink', label: 'Copy Link', icon: '🔗', color: '#667eea' },
  ];
  
  // Add save image option if image is available
  if (hasImage) {
    platforms.push({ id: 'saveImage', label: 'Save Image', icon: '💾', color: '#FFD700' });
  }
  
  return platforms;
}

/**
 * Execute share handler by platform ID
 */
export async function executeShare(platformId, app, run, assetUrl) {
  const handler = shareHandlers[platformId];
  if (!handler) {
    throw new Error(`Unknown platform: ${platformId}`);
  }
  
  return await handler(app, run, assetUrl);
}
