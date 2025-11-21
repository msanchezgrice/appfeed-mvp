import { install, chromium } from 'playwright';

/**
 * Helper script to install Chromium for Playwright in CI (e.g., Vercel build step).
 * Usage: node playwright-install.mjs
 */
async function main() {
  try {
    // Install only chromium to reduce footprint
    await install({ browsers: ['chromium'] });
    const executablePath = chromium.executablePath();
    console.log('[Playwright Install] Chromium installed at:', executablePath);
  } catch (err) {
    console.error('[Playwright Install] Failed to install Chromium:', err?.message || err);
    process.exit(1);
  }
}

main();
