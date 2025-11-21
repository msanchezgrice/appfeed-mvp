import sharp from 'sharp';
import GIFEncoder from 'gif-encoder-2';
import { uploadImageVariants, uploadBufferToStorage } from './supabase-storage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clipcade.com';

async function loadPlaywright() {
  try {
    const { chromium } = await import('playwright');
    return chromium;
  } catch (err) {
    console.error('[DemoCapture] Playwright import failed', err);
    throw new Error('Playwright is not available in this environment.');
  }
}

async function encodeGifFromFrames(frames, width, height, delayMs = 150) {
  if (!frames.length) return null;
  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(delayMs);
  encoder.setQuality(10);
  for (const frame of frames) {
    const { data } = await sharp(frame).resize({ width, height, fit: 'cover' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    encoder.addFrame(data);
  }
  encoder.finish();
  return Buffer.from(encoder.out.getData());
}

export async function captureDemo({ appId, userId, supabase, script = {} }) {
  let chromium;
  try {
    chromium = await loadPlaywright();
  } catch (err) {
    const hint = 'Playwright Chromium is not installed. Install browsers (npx playwright install chromium) or set PLAYWRIGHT_BROWSERS_PATH to a bundled Chromium.';
    throw new Error(`${hint} Original error: ${err?.message || err}`);
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (err) {
    const hint = 'Failed to launch Chromium. Ensure headless_shell exists or set PLAYWRIGHT_CHROMIUM_PATH / install browsers.';
    throw new Error(`${hint} Original error: ${err?.message || err}`);
  }

  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const targetUrl = `${SITE_URL}/app/${appId}?autoplay=1`;
  const frames = [];
  let posterFrame = null;

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Optional scripted interactions
    if (script.clickTry) {
      try {
        await page.getByRole('button', { name: /try/i }).click({ timeout: 5000 });
      } catch {
        // ignore
      }
    }
    if (script.delayMs) {
      await page.waitForTimeout(script.delayMs);
    }

    // Capture a short sequence of frames
    const frameCount = Math.min(script.frameCount || 12, 24);
    const frameDelay = script.frameDelayMs || 300;
    for (let i = 0; i < frameCount; i++) {
      await page.waitForTimeout(frameDelay);
      const buf = await page.screenshot({ type: 'png' });
      frames.push(buf);
    }
    posterFrame = frames[0];

    // Encode GIF
    const gifBuffer = await encodeGifFromFrames(frames, 540, 960, frameDelay);

    // Take a final still for poster
    const posterBuf = posterFrame || (frames.length ? frames[0] : await page.screenshot({ type: 'png' }));

    // Upload poster variants
    const baseKey = `app-assets/${appId}/demo`;
    const { defaultUrl: posterUrl, urls: posterUrls, blurDataUrl: posterBlur, version: posterVersion } = await uploadImageVariants(posterBuf, `${baseKey}-poster`);

    // Upload GIF (if available)
    let gifUrl = null;
    if (gifBuffer) {
      const gifPath = `${baseKey}-clip.gif`;
      const { url } = await uploadBufferToStorage(gifBuffer, gifPath, 'image/gif', '2592000');
      gifUrl = url;
    }

    return {
      poster: {
        url: posterUrl,
        urls: posterUrls,
        blur: posterBlur,
        version: posterVersion,
        mime_type: 'image/webp'
      },
      gif: gifUrl ? { url: gifUrl, mime_type: 'image/gif' } : null
    };
  } finally {
    await browser.close();
  }
}
