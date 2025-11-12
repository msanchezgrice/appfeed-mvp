export async function generateMetadata({ params }) {
  // Fetch app data for dynamic OpenGraph
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com'}/api/apps/${params.id}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return {
        title: 'App - Clipcade',
        description: 'Discover and try this mini-app on Clipcade'
      };
    }
    
    const data = await res.json();
    const app = data.app;
    const creator = data.creator;
    
    // Use app's Nano Banana generated image, fallback to gradient
    const appImage = (app.preview_url && app.preview_url.includes('supabase.co/storage')) 
      ? app.preview_url 
      : `https://lobodzhfgojceqfvgcit.supabase.co/storage/v1/object/public/app-images/app-previews/${app.id}.png`;
    
    return {
      title: `${app.name} | Try on Clipcade`,
      description: app.description || `Try ${app.name} - a mini-app on Clipcade`,
      openGraph: {
        title: app.name,  // APP NAME, not Clipcade
        description: app.description,
        images: [{
          url: appImage,  // APP'S Nano Banana image
          width: 1200,
          height: 630,
          alt: app.name
        }],
        type: 'website',
        siteName: 'Clipcade',
        url: `https://www.clipcade.com/app/${app.id}`
      },
      twitter: {
        card: 'summary_large_image',
        title: app.name,  // APP NAME
        description: app.description,
        images: [appImage],  // APP IMAGE
        creator: creator?.display_name ? `@${creator.display_name}` : '@clipcade'
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'App - Clipcade',
      description: 'Discover and try this mini-app on Clipcade'
    };
  }
}

export default function AppLayout({ children }) {
  return children;
}

