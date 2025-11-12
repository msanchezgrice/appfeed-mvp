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
    
    const appImage = app.preview_url || 'https://lobodzhfgojceqfvgcit.supabase.co/storage/v1/object/public/app-images/app-previews/wishboard-starter-mhv10wyp.png';
    
    return {
      title: `${app.name} - Clipcade`,
      description: app.description || 'Try this mini-app on Clipcade',
      openGraph: {
        title: app.name,
        description: app.description,
        images: [{
          url: appImage,
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
        title: app.name,
        description: app.description,
        images: [appImage],
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

