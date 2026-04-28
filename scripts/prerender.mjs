// Postbuild prerender: walks the SPA in headless Chromium, captures the fully
// rendered HTML for each known route, writes per-route index.html files into
// dist/. Express (server.js) then serves these via express.static — Googlebot,
// PerplexityBot, ClaudeBot, and GPTBot get real content instead of an empty
// `<div id="root">`. Vite's hash-named asset URLs in the prerendered HTML keep
// the bundle wiring intact for the JS hydration step in the user's browser.
//
// Run as: `npm run prerender` (called automatically after `vite build`).
import Prerenderer from '@prerenderer/prerenderer';
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

// Routes that should be prerendered. Mirrors the <Route> list in
// src/App.tsx and the URLs in public/sitemap.xml. Skip /admin (auth-gated)
// and any route with a dynamic param (governance-documents/:docId) — those
// are fine as runtime SPA routes.
const ROUTES = [
  '/',
  '/ecosystem',
  '/products',
  '/investors',
  '/media-hub',
  '/investors/corporate-governance',
  '/investors/governance-documents',
  '/board-of-directors',
  '/careers',
];

async function main() {
  console.log('[prerender] starting Puppeteer + static server on dist/...');

  const prerenderer = new Prerenderer({
    staticDir: DIST_DIR,
    renderer: new PuppeteerRenderer({
      // Wait until React has hydrated and Helmet/JSON-LD has painted into the
      // head. networkIdle is too aggressive for sites with motion animations
      // — we only need the initial DOM, not a quiescent network.
      renderAfterDocumentEvent: 'load',
      renderAfterTime: 1500,
      headless: true,
      timeout: 30_000,
      launchOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    }),
  });

  try {
    await prerenderer.initialize();
    const results = await prerenderer.renderRoutes(ROUTES);

    for (const result of results) {
      // Map "/ecosystem" -> "dist/ecosystem/index.html"; "/" -> "dist/index.html"
      const route = result.route === '/' ? '' : result.route.replace(/^\//, '');
      const outDir = route ? join(DIST_DIR, route) : DIST_DIR;
      const outFile = join(outDir, 'index.html');
      await mkdir(outDir, { recursive: true });
      await writeFile(outFile, result.html.trim() + '\n', 'utf8');
      console.log(`[prerender] wrote ${outFile.replace(DIST_DIR, 'dist')} (${result.html.length} bytes)`);
    }

    console.log(`[prerender] done — ${results.length} routes prerendered.`);
  } finally {
    await prerenderer.destroy();
  }
}

main().catch((err) => {
  console.error('[prerender] failed:', err);
  process.exit(1);
});
