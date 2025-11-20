import { ImageResponse } from '@vercel/og';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app');
    const runId = searchParams.get('run');
    const type = searchParams.get('type') || 'result'; // 'result' or 'app'
    
    if (!appId) {
      return new NextResponse('Missing app parameter', { status: 400 });
    }
    
    // Fetch app data
    const appRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com'}/api/apps/${appId}`, {
      cache: 'no-store'
    });
    
    if (!appRes.ok) {
      return new NextResponse('App not found', { status: 404 });
    }
    
    const appData = await appRes.json();
    const app = appData.app;
    const creator = appData.creator;
    
    let runImageUrl = null;
    let title = app.name;
    let subtitle = app.description?.slice(0, 100) || 'Try this app on Clipcade';
    
    // If run ID provided, fetch run data
    if (runId && type === 'result') {
      try {
        const runRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com'}/api/runs?id=${runId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (runRes.ok) {
          const runData = await runRes.json();
          const run = runData.run;
          
          console.log('[OG] Run data:', { runId, hasAssetUrl: !!run?.asset_url, assetUrl: run?.asset_url });
          
          if (run?.asset_url) {
            runImageUrl = run.asset_url;
            title = `Check out my ${app.name} result!`;
            subtitle = `Created with ${app.name} on Clipcade`;
          } else {
            console.log('[OG] No asset_url found for run:', runId);
          }
        } else {
          console.error('[OG] Run fetch failed:', runRes.status);
        }
      } catch (err) {
        console.error('[OG] Error fetching run:', err);
      }
    }
    
    // Use app preview image as background if no run image
    const backgroundImage = runImageUrl || app.preview_url || null;
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay for readability */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
            }}
          />
          
          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '60px',
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: 'white',
                textAlign: 'center',
                marginBottom: 16,
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
                maxWidth: '90%',
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            
            {/* Subtitle */}
            <div
              style={{
                fontSize: 28,
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                marginBottom: 32,
                maxWidth: '80%',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
              }}
            >
              {subtitle}
            </div>
            
            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* Creator info */}
              {creator && (
                <div
                  style={{
                    fontSize: 20,
                    color: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>by</span>
                  <span style={{ fontWeight: 600 }}>@{creator.username}</span>
                  <span style={{ margin: '0 8px' }}>•</span>
                </div>
              )}
              
              {/* Clipcade branding */}
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Clipcade</span>
              </div>
            </div>
          </div>
          
          {/* Top badge for result type */}
          {runId && type === 'result' && (
            <div
              style={{
                position: 'absolute',
                top: 40,
                right: 40,
                backgroundColor: 'rgba(102, 126, 234, 0.95)',
                padding: '12px 24px',
                borderRadius: 20,
                fontSize: 20,
                fontWeight: 700,
                color: 'white',
                display: 'flex',
              }}
            >
              ✨ Result
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('[OG] Error generating image:', error);
    return new NextResponse('Failed to generate OG image', { status: 500 });
  }
}
