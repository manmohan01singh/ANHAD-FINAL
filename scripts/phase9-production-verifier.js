/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 9: REAL RUNTIME VALIDATION & PRODUCTION VERIFICATION ENGINE v3.0
 *
 * Runs real Chromium (`chrome.exe`), tests server assets (CSS, JS, 404s),
 * logs browser console errors, executes 100 continuous SPA navigation cycles,
 * and extracts empirical runtime performance & memory telemetry.
 *
 * v3.0 fixes (found by actually reading v2.0's own last real output, which
 * showed 100% failure — 0/100 nav cycles, no app UI detected — while the
 * saved report still claimed "VERIFIED SUCCESS ✅"):
 *   1. Verdict is now COMPUTED from real results, never a hardcoded string.
 *   2. A sanity gate confirms the real ANHAD page actually loaded (title +
 *      #app + window.navigateTo) before running anything else — v2.0 never
 *      checked this, so a wrong/failed navigation silently ran the rest of
 *      the script against nothing.
 *   3. The fixed 2500ms wait is replaced with a real poll-until-ready loop.
 *   4. The route list no longer includes gurbani-radio-darbar.html — it was
 *      never a valid SPA-swap target (not in isShellPage()'s allowlist) and
 *      forces a full reload, which kills the async navigation loop mid-cycle
 *      (a real, likely contributor to v2.0's 0/100 result). It's also been
 *      deleted as confirmed dead code as of this pass. Replaced with
 *      confirmed shell-page routes only.
 *   5. Each of the 100 navigation cycles now has its own 3s timeout — v2.0's
 *      loop had no per-cycle bound, so one hung navigateTo() call could
 *      stall the whole script forever.
 *   6. window.AnhadAudioLoadEngine() is triggered before checking for the
 *      mini-player — v2.0 never loaded audio at all, so
 *      uiComponentsVerified.miniPlayerPresent could structurally never be
 *      true.
 *   7. Console capture is split into errors vs. warnings; only errors gate
 *      pass/fail (gating on zero warnings in a codebase this size fails for
 *      unrelated reasons almost every run).
 *   8. Reuses an already-running backend on :3000 if present (checked via
 *      /health) instead of always spawning a bespoke static-only server —
 *      the real backend, not a stand-in with no API routes.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9222;

async function ensureServerRunning() {
  try {
    const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      console.log('Reusing already-running backend on :' + PORT);
      return null; // not ours to kill later
    }
  } catch (e) {}

  console.log('No backend detected on :' + PORT + ', starting backend/server.js');
  const proc = spawn(process.execPath, [path.join(__dirname, '../backend/server.js')], {
    stdio: 'ignore',
    detached: false
  });

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
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Could not find an ANHAD page target on http://localhost:${PORT} via Chrome Remote Debugging`);
}

function runCDPProductionValidation(wsUrl) {
  const WebSocket = require('ws');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    const consoleErrors = [];
    const consoleWarnings = [];
    const networkFailures = [];

    function evalRT(expression, awaitPromise = false) {
      return new Promise((res, rej) => {
        const evalId = id++;
        callbacks.set(evalId, (msg) => {
          callbacks.delete(evalId);
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else if (msg.result && msg.result.exceptionDetails) rej(new Error(JSON.stringify(msg.result.exceptionDetails)));
          else res(msg.result ? msg.result.result.value : undefined);
        });
        ws.send(JSON.stringify({
          id: evalId,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise, returnByValue: true }
        }));
      });
    }

    async function pollFor(expression, { intervalMs = 200, timeoutMs = 15000 } = {}) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        try {
          const ok = await evalRT(expression);
          if (ok) return true;
        } catch (e) {}
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      return false;
    }

    ws.on('open', () => {
      ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: id++, method: 'Network.enable' }));

      ws.on('message', (data) => {
        const msg = JSON.parse(data);

        if (msg.method === 'Network.responseReceived') {
          const status = msg.params.response.status;
          const url = msg.params.response.url;
          if (status >= 400) networkFailures.push({ url, status });
        }

        if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params.type;
          const text = msg.params.args.map((a) => a.value).join(' ');
          if (type === 'error') consoleErrors.push({ type, text });
          else if (type === 'warning') consoleWarnings.push({ type, text });
        }

        if (msg.id && callbacks.has(msg.id)) callbacks.get(msg.id)(msg);
      });

      (async () => {
        try {
          // On a fresh session (no prior localStorage/sessionStorage for
          // this origin), index.html's own welcome-check redirects to
          // Homepage/ios-homepage.html — the exact shouldBypassWelcome()
          // logic a real first-time visitor hits. Setting the bypass flags
          // alone isn't enough here: Chrome already launched straight at
          // index.html?spa=1 as a command-line arg and already got
          // redirected before this script ever connects. Stamp the flags
          // (same ones smooth-navigation.js itself sets) then navigate to
          // index.html for real.
          const anyPageLoaded = await pollFor(`!!document.title`, { timeoutMs: 15000 });
          if (anyPageLoaded) {
            await evalRT(`
              sessionStorage.setItem('anhad_welcomed', '1');
              localStorage.setItem('anhad_welcome_seen', 'true');
              localStorage.setItem('anhad_session_active_ts', Date.now().toString());
            `);
            ws.send(JSON.stringify({ id: id++, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/index.html` } }));
          }

          // --- Sanity gate: confirm we actually landed on the real ANHAD page ---
          // Polled as one combined condition, not checked once — a single
          // title check (even after a short fixed wait) can race Chrome's
          // own initial parse and see "" well before any real problem exists.
          const shellReady = await pollFor(
            `!!document.title && document.title.includes('ANHAD') && !!document.getElementById('app') && typeof window.navigateTo === 'function'`,
            { timeoutMs: 15000 }
          );
          if (!shellReady) {
            const title = await evalRT('document.title').catch(() => '(eval failed)');
            ws.close();
            return resolve({
              blocked: `App shell not ready within 15s (last observed title: "${title}"). Backend on :${PORT} may be serving something unexpected, or navigation failed.`,
              consoleErrors, consoleWarnings, networkFailures
            });
          }

          // Trigger audio load deterministically so miniPlayerPresent can ever be true.
          await evalRT(`window.AnhadAudioLoadEngine && window.AnhadAudioLoadEngine();`);
          await pollFor(`window.AnhadAudio && window.AnhadAudio._singleton === true`, { timeoutMs: 8000 });

          const initialHeapMB = await evalRT(`performance.memory ? Math.round((performance.memory.usedJSHeapSize / 1048576) * 100) / 100 : null`);

          // Only confirmed shell pages (isShellPage() allowlist) — anything
          // else forces a full reload and kills this async loop mid-cycle.
          const routes = ['./Insights/insights.html', '../index.html', './Favorites/favorites.html', '../index.html'];

          let navCycles = 0;
          const startNavTime = await evalRT('performance.now()');
          for (let i = 0; i < 100; i++) {
            const route = routes[i % routes.length];
            try {
              await evalRT(
                `Promise.race([
                  window.navigateTo(${JSON.stringify(route)}, { replace: true }).then(() => true),
                  new Promise((_, rej) => setTimeout(() => rej('cycle timeout'), 3000))
                ])`,
                true
              );
              navCycles++;
            } catch (e) {
              // per-cycle timeout or navigation error — stop the endurance
              // loop here rather than hang; partial completion is still
              // reported honestly below.
              break;
            }
          }
          const endNavTime = await evalRT('performance.now()');
          const totalNavDurationMs = Math.round(endNavTime - startNavTime);
          const finalHeapMB = await evalRT(`performance.memory ? Math.round((performance.memory.usedJSHeapSize / 1048576) * 100) / 100 : null`);

          const timing = await evalRT(`(function(){
            const navTiming = performance.getEntriesByType('navigation')[0] || {};
            const paints = performance.getEntriesByType('paint') || [];
            const fp = paints.find(p => p.name === 'first-paint');
            const fcp = paints.find(p => p.name === 'first-contentful-paint');
            return {
              domContentLoadedMs: Math.round(navTiming.domContentLoadedEventEnd - navTiming.startTime),
              loadEventMs: Math.round(navTiming.loadEventEnd - navTiming.startTime),
              firstPaintMs: fp ? Math.round(fp.startTime) : null,
              firstContentfulPaintMs: fcp ? Math.round(fcp.startTime) : null
            };
          })()`);

          const ui = await evalRT(`({
            headerPresent: !!document.querySelector('.header'),
            tabBarPresent: !!(document.getElementById('mainNav') || document.querySelector('.tab-bar')),
            miniPlayerPresent: !!document.querySelector('#gmp'),
            appContainerPresent: !!document.querySelector('#app')
          })`);

          ws.close();
          resolve({
            runtimeTelemetry: {
              endurance100Navigations: {
                completedCycles: navCycles,
                totalTimeMs: totalNavDurationMs,
                avgMsPerNav: navCycles > 0 ? Math.round((totalNavDurationMs / navCycles) * 100) / 100 : 0
              },
              memoryTelemetryMB: {
                initialHeapMB,
                finalHeapMB,
                heapGrowthMB: (typeof initialHeapMB === 'number' && typeof finalHeapMB === 'number')
                  ? Math.round((finalHeapMB - initialHeapMB) * 100) / 100 : null
              },
              startupTiming: timing,
              uiComponentsVerified: ui
            },
            consoleErrors, consoleWarnings, networkFailures
          });
        } catch (err) {
          ws.close();
          reject(err);
        }
      })();
    });

    ws.on('error', (err) => reject(err));
  });
}

function computeVerdict(result) {
  if (result.blocked) return { status: 'BLOCKED', reason: result.blocked };

  const failures = [];
  const nav = result.runtimeTelemetry.endurance100Navigations;
  if (nav.completedCycles !== 100) failures.push(`${nav.completedCycles}/100 navigation cycles completed`);
  const ui = result.runtimeTelemetry.uiComponentsVerified;
  if (!ui.headerPresent) failures.push('header missing after cycling');
  if (!ui.tabBarPresent) failures.push('tab bar missing after cycling');
  if (!ui.appContainerPresent) failures.push('#app missing after cycling');
  if (result.networkFailures.length) failures.push(`${result.networkFailures.length} network 4xx/5xx response(s)`);
  if (result.consoleErrors.length) failures.push(`${result.consoleErrors.length} console error(s)`);

  if (failures.length === 0) return { status: 'PASSED', reason: null };
  return { status: 'FAILED', reason: failures.join('; ') };
}

async function main() {
  console.log('\n===============================================================');
  console.log('       PHASE 9: PRODUCTION RUNTIME VERIFICATION ENGINE v3.0    ');
  console.log('===============================================================\n');

  let serverProc = null;
  let chromeProc = null;

  try {
    serverProc = await ensureServerRunning();
    chromeProc = launchChrome();
    const wsUrl = await getCDPPageWebSocketUrl();
    const result = await runCDPProductionValidation(wsUrl);
    const verdict = computeVerdict(result);

    console.log('REAL BROWSER PRODUCTION VALIDATION RESULTS:\n');
    if (result.blocked) {
      console.log('BLOCKED:', result.blocked);
    } else {
      console.log('1. 100 Navigation Endurance Test:', result.runtimeTelemetry.endurance100Navigations);
      console.log('2. JS Heap Memory Telemetry:', result.runtimeTelemetry.memoryTelemetryMB);
      console.log('3. Startup Timings:', result.runtimeTelemetry.startupTiming);
      console.log('4. Persistent Shell Components:', result.runtimeTelemetry.uiComponentsVerified);
      console.log('5. Network 4xx/5xx Failures:', result.networkFailures.length === 0 ? 'ZERO' : result.networkFailures);
      console.log('6. Console Errors:', result.consoleErrors.length === 0 ? 'ZERO' : result.consoleErrors);
      console.log('7. Console Warnings (informational, not gating):', result.consoleWarnings.length);
    }
    console.log('\nVERDICT:', verdict.status, verdict.reason ? '- ' + verdict.reason : '');

    const report = {
      suite: 'Phase 9 - Production Runtime Validation (Chromium Engine)',
      timestamp: new Date().toISOString(),
      results: result,
      status: verdict.status,
      reason: verdict.reason
    };

    fs.writeFileSync(
      path.join(__dirname, '../phase9-production-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\nPhase 9 report saved to phase9-production-report.json\n');
  } catch (err) {
    console.error('Phase 9 verification error:', err);
    fs.writeFileSync(
      path.join(__dirname, '../phase9-production-report.json'),
      JSON.stringify({
        suite: 'Phase 9 - Production Runtime Validation (Chromium Engine)',
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        reason: 'Script error: ' + (err && err.message ? err.message : String(err))
      }, null, 2)
    );
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill(); // only kill the server if we started it ourselves
    process.exit(0);
  }
}

main();
