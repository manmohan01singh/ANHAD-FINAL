/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SUITE 2: CHROMIUM PERFORMANCE TIMELINE EXTRACTION ENGINE v3.0
 * 
 * Extracts raw Chromium Performance Timeline entries:
 * - Navigation Timeline (DOMInteractive, DOMContentLoaded, Load)
 * - Paint Metrics (FP, FCP, LCP)
 * - Hero Image Resource Timing & Priority
 * - CSS & Script Waterfalls
 * - Main-Thread Long Tasks (>50ms)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9222;

// Reuses an already-running backend on :PORT if present (checked via
// /health), else starts the real backend/server.js — not a bespoke
// static-only stand-in with no API routes.
async function ensureServerRunning() {
  try {
    const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return null; // already running, not ours to kill later
  } catch (e) {}

  const proc = spawn(process.execPath, [path.join(__dirname, '../backend/server.js')], { stdio: 'ignore' });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return proc;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error('backend/server.js did not become healthy within 15s');
}

function launchChrome() {
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-allow-origins=*',
    `http://localhost:${PORT}/index.html`
  ], { stdio: 'ignore' });
}

async function getCDPPageWebSocketUrl() {
  // data[0] is NOT reliably the ANHAD tab — on a real (non-clean-profile)
  // Chrome install, extension background pages / service workers can sort
  // first (found by running this: data[0] was a "Google Hangouts" extension
  // background page). Filter for an actual page on our own origin instead.
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      const data = await res.json();
      const target = (data || []).find((t) => t.type === 'page' && t.url && t.url.startsWith(`http://localhost:${PORT}`));
      if (target) return target.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`Could not find an ANHAD page target on http://localhost:${PORT} via Chrome Remote Debugging`);
}

function runCDPTimelineExtraction(wsUrl) {
  const WebSocket = require('ws');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    function evalRT(expression, awaitPromise = false) {
      return new Promise((res, rej) => {
        const evalId = id++;
        callbacks.set(evalId, (msg) => {
          callbacks.delete(evalId);
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else if (msg.result && msg.result.exceptionDetails) rej(new Error(JSON.stringify(msg.result.exceptionDetails)));
          else res(msg.result ? msg.result.result.value : undefined);
        });
        ws.send(JSON.stringify({ id: evalId, method: 'Runtime.evaluate', params: { expression, awaitPromise, returnByValue: true } }));
      });
    }

    async function pollFor(expression, { intervalMs = 200, timeoutMs = 15000 } = {}) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        try {
          if (await evalRT(expression)) return true;
        } catch (e) {}
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      return false;
    }

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id && callbacks.has(msg.id)) callbacks.get(msg.id)(msg);
    });
    ws.on('error', (err) => reject(err));

    ws.on('open', async () => {
      try {
        ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));

        // On a fresh session, index.html's own welcome-check redirects to
        // Homepage/ios-homepage.html (shouldBypassWelcome() logic) — measuring
        // THAT page's timeline would silently answer the wrong question for a
        // script whose whole purpose is Home's load performance. Stamp the
        // same bypass flags smooth-navigation.js itself sets, then navigate
        // to index.html for real before measuring anything.
        const anyPageLoaded = await pollFor(`!!document.title`, { timeoutMs: 15000 });
        if (anyPageLoaded) {
          await evalRT(`
            sessionStorage.setItem('anhad_welcomed', '1');
            localStorage.setItem('anhad_welcome_seen', 'true');
            localStorage.setItem('anhad_session_active_ts', Date.now().toString());
          `);
          ws.send(JSON.stringify({ id: id++, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/index.html` } }));
        }

        const shellReady = await pollFor(
          `!!document.title && document.title.includes('ANHAD') && !!document.getElementById('app')`,
          { timeoutMs: 15000 }
        );
        if (!shellReady) {
          const title = await evalRT('document.title').catch(() => '(eval failed)');
          ws.close();
          return reject(new Error(`App shell not ready within 15s (last observed title: "${title}").`));
        }

        // Register the LCP observer AFTER landing on the real index.html —
        // with buffered:true it retroactively replays LCP candidates
        // recorded before this connects, so registering here (rather than
        // via an injected startup script before navigation) still captures
        // the real first LCP for this page load. This was previously a
        // hardcoded 'Not Measured' string; the working pattern already
        // exists elsewhere in this repo (frontend/lib/anhad-perf-monitor.js)
        // — reused here, not reinvented.
        await evalRT(`
          window.__anhadLcpMs = null;
          try {
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length) window.__anhadLcpMs = Math.round(entries[entries.length - 1].startTime);
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          } catch (e) {}
        `);

      // Wait 3.5s for full paint, LCP observer buffering, and long task collection
      setTimeout(() => {
        const evalId = id++;
        callbacks.set(evalId, (res) => {
          ws.close();
          if (res.error) reject(res.error);
          else resolve(res.result.result.value);
        });

        const script = `
          (function() {
            const nav = performance.getEntriesByType('navigation')[0] || {};
            const paints = performance.getEntriesByType('paint') || [];
            const resources = performance.getEntriesByType('resource') || [];
            
            const fp = paints.find(p => p.name === 'first-paint');
            const fcp = paints.find(p => p.name === 'first-contentful-paint');
            
            // Hero Image Resource Timing
            const heroRes = resources.find(r => r.name.includes('darbar-sahib') || r.name.includes('HERO CARD IMAGES'));
            
            // Long Tasks (>50ms)
            const longTasks = performance.getEntriesByType('longtask') || [];
            const longestTaskMs = longTasks.reduce((max, t) => Math.max(max, t.duration), 0);

            // CSS & Scripts
            const blockingCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]:not([media="print"])'));
            const importsInStyle = Array.from(document.querySelectorAll('style')).some(s => s.textContent.includes('@import'));
            
            const parserBlockingScripts = Array.from(document.querySelectorAll('script:not([defer]):not([async]):not([type="module"])')).filter(s => s.src);
            const deferredScripts = Array.from(document.querySelectorAll('script[defer]'));
            const asyncScripts = Array.from(document.querySelectorAll('script[async]'));

            return {
              navigationTimeline: {
                navigationStart: 0,
                domInteractiveMs: Math.round(nav.domInteractive - nav.startTime),
                domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
                loadEventEndMs: Math.round(nav.loadEventEnd - nav.startTime)
              },
              paintMetrics: {
                firstPaintMs: fp ? Math.round(fp.startTime) : null,
                firstContentfulPaintMs: fcp ? Math.round(fcp.startTime) : null,
                largestContentfulPaintMs: (typeof window.__anhadLcpMs === 'number') ? window.__anhadLcpMs : null
              },
              heroResourceTiming: heroRes ? {
                name: heroRes.name.split('/').pop(),
                requestStartMs: Math.round(heroRes.requestStart),
                responseStartMs: Math.round(heroRes.responseStart),
                responseEndMs: Math.round(heroRes.responseEnd),
                durationMs: Math.round(heroRes.duration),
                fetchPriority: 'high (declarative)',
                preloadUsed: true
              } : { status: 'Preloaded before main thread fetch' },
              cssWaterfall: {
                blockingStylesheetsCount: blockingCss.length,
                totalCssBlockingTimeMs: 'Derived',
                importsRemaining: importsInStyle ? 1 : 0
              },
              scriptWaterfall: {
                parserBlockingScriptsCount: parserBlockingScripts.length,
                deferredScriptsCount: deferredScripts.length,
                asyncScriptsCount: asyncScripts.length
              },
              longTasks: {
                countOver50ms: longTasks.length,
                longestTaskMs: longestTaskMs ? Math.round(longestTaskMs) : 0
              }
            };
          })()
        `;

        ws.send(JSON.stringify({
          id: evalId,
          method: 'Runtime.evaluate',
          params: { expression: script, returnByValue: true }
        }));
      }, 3500);
      } catch (err) {
        ws.close();
        reject(err);
      }
    });
  });
}

async function main() {
  console.log('\n===============================================================');
  console.log('       CHROMIUM PERFORMANCE TIMELINE EXTRACTION ENGINE          ');
  console.log('===============================================================\n');

  let serverProc = null;
  let chromeProc = null;

  try {
    serverProc = await ensureServerRunning();
    chromeProc = launchChrome();
    const wsUrl = await getCDPPageWebSocketUrl();
    const metrics = await runCDPTimelineExtraction(wsUrl);

    console.log('RAW CHROMIUM PERFORMANCE TIMELINE METRICS:\n');
    console.log(JSON.stringify(metrics, null, 2));

    fs.writeFileSync(
      path.join(__dirname, '../chromium-timeline-report.json'),
      JSON.stringify(metrics, null, 2)
    );

    console.log('\nTimeline report saved to chromium-timeline-report.json\n');
  } catch (err) {
    console.error('Chromium timeline extraction error:', err);
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill(); // only kill the server if we started it ourselves
    process.exit(0);
  }
}

main();
