export async function generateMetadata({ params, searchParams }) {
  // Fetch app data for dynamic OpenGraph
  try {
    const appRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com'}/api/apps/${params.id}`, {
      cache: 'no-store'
    });
    
    if (!appRes.ok) {
      return {
        title: 'App - Clipcade',
        description: 'Discover and try this mini-app on Clipcade'
      };
    }
    
    const appData = await appRes.json();
    const app = appData.app;
    const creator = appData.creator;
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com';
    
    // Check if this is a run share (has ?run= parameter)
    const runId = searchParams?.run;
    
    if (runId) {
      // Run share - use OG API with run data
      const ogImageUrl = `${baseUrl}/api/og?app=${app.id}&run=${runId}&type=result`;
      const shareUrl = `${baseUrl}/app/${app.id}?run=${runId}`;
      
      return {
        title: `Check out my ${app.name} result! | Clipcade`,
        description: `See my creation from ${app.name}. ${app.description}`,
        metadataBase: new URL(baseUrl),
        openGraph: {
          title: `Check out my ${app.name} result!`,
          description: `See my creation from ${app.name}`,
          images: [{
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${app.name} result`,
            type: 'image/png',
          }],
          type: 'website',
          siteName: 'Clipcade',
          url: shareUrl,
        },
        twitter: {
          card: 'summary_large_image',
          site: '@clipcade',
          title: `Check out my ${app.name} result!`,
          description: `See my creation from ${app.name}`,
          images: [{
            url: ogImageUrl,
            alt: `${app.name} result`,
          }],
          creator: creator?.username ? `@${creator.username}` : '@clipcade',
        },
        other: {
          // Apple-specific for iMessage rich links
          'apple-mobile-web-app-capable': 'yes',
          'apple-mobile-web-app-title': 'Clipcade',
        }
      };
    }
    
    // App-only share - use OG API without run
    const ogImageUrl = `${baseUrl}/api/og?app=${app.id}&type=app`;
    const shareUrl = `${baseUrl}/app/${app.id}`;
    
    return {
      title: `${app.name} | Try on Clipcade`,
      description: app.description || `Try ${app.name} - a mini-app on Clipcade`,
      metadataBase: new URL(baseUrl),
      openGraph: {
        title: app.name,
        description: app.description,
        images: [{
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: app.name,
          type: 'image/png',
        }],
        type: 'website',
        siteName: 'Clipcade',
        url: shareUrl,
      },
      twitter: {
        card: 'summary_large_image',
        site: '@clipcade',
        title: app.name,
        description: app.description,
        images: [{
          url: ogImageUrl,
          alt: app.name,
        }],
        creator: creator?.username ? `@${creator.username}` : '@clipcade',
      },
      other: {
        // Apple-specific for iMessage rich links
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-title': 'Clipcade',
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

