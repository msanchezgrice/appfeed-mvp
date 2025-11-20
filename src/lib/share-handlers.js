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
   * Opens SMS compose with pre-filled text
   * Works on iOS and Android
   */
  sms: (app, run = null, assetUrl = null) => {
    const isResult = !!run;
    const url = run 
      ? `${SITE_URL}/app/${app.id}?run=${run.id}`
      : `${SITE_URL}/app/${app.id}`;
    
    const text = isResult
      ? `Check out what I made with ${app.name}! ${url}`
      : `Try ${app.name} on Clipcade! ${url}`;
    
    // SMS protocol (works on iOS and Android)
    const smsUrl = `sms:?&body=${encodeURIComponent(text)}`;
    window.location.href = smsUrl;
    
    return { platform: 'sms', url };
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
        const response = await fetch(assetUrl);
        const blob = await response.blob();
        const file = new File([blob], `${app.id}-${run.id}.jpg`, { type: blob.type || 'image/jpeg' });
        
        // Check if files can be shared
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      } catch (error) {
        console.error('Error adding file to share:', error);
        // Continue without file
      }
    }
    
    await navigator.share(shareData);
    
    return { platform: 'native', url };
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
