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
    
    // Check if this is a run share (has ?run= parameter)
    const runId = searchParams?.run;
    
    if (runId) {
      // Fetch run data for run-specific OG metadata
      try {
        const runRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com'}/api/runs?id=${runId}`, {
          cache: 'no-store'
        });
        
        if (runRes.ok) {
          const runData = await runRes.json();
          const run = runData.run;
          
          // Use the run's output image if available
          const runImage = run?.asset_url || 
                          (app.preview_url && app.preview_url.includes('supabase.co/storage') 
                            ? app.preview_url 
                            : `https://lobodzhfgojceqfvgcit.supabase.co/storage/v1/object/public/app-images/app-previews/${app.id}.png`);
          
          return {
            title: `Check out my ${app.name} result! | Clipcade`,
            description: `See my creation from ${app.name}. ${app.description}`,
            openGraph: {
              title: `Check out my ${app.name} result!`,
              description: `See my creation from ${app.name}`,
              images: [{
                url: runImage,
                width: 1200,
                height: 630,
                alt: `${app.name} result`
              }],
              type: 'website',
              siteName: 'Clipcade',
              url: `https://www.clipcade.com/app/${app.id}?run=${runId}`
            },
            twitter: {
              card: 'summary_large_image',
              title: `Check out my ${app.name} result!`,
              description: `See my creation from ${app.name}`,
              images: [runImage],
              creator: creator?.display_name ? `@${creator.display_name}` : '@clipcade'
            }
          };
        }
      } catch (runError) {
        console.error('Error fetching run for metadata:', runError);
        // Fall through to app metadata if run fetch fails
      }
    }
    
    // Default: Use app's Nano Banana generated image
    const appImage = (app.preview_url && app.preview_url.includes('supabase.co/storage')) 
      ? app.preview_url 
      : `https://lobodzhfgojceqfvgcit.supabase.co/storage/v1/object/public/app-images/app-previews/${app.id}.png`;
    
    return {
      title: `${app.name} | Try on Clipcade`,
      description: app.description || `Try ${app.name} - a mini-app on Clipcade`,
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

