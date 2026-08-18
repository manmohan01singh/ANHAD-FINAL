/**
 * Measures "Home after Back" — the warm, in-memory SPA-cache-restore path —
 * which Lighthouse cannot measure at all (it only does fresh/cold
 * navigations). Uses performance.mark/measure bracketing a real
 * navigate-to-Insights-then-history.back() sequence, via CDP, against the
 * real running app. This answers a different question than cold-start
 * numbers: not "how fast does Home load fresh" but "how fast does Back
 * actually feel once bfcache/the SPA cache can be used."
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9225;

function launchChrome() {
  // ISOLATED PROFILE: without --user-data-dir this uses Chrome's persistent
  // default profile, so every prior run of this (or the smoke-check) script
  // today leaves its service worker registration behind. That SW's own
  // update-check/activation cycle can then fire mid-trial and trigger
  // pwa-register.js's controllerchange -> _safeReload() — a REAL reload,
  // but caused by cross-run test contamination, not by the app's actual
  // Home-after-Back behavior (found by running this: a trial's console
  // log showed "[PWA] Reloading: controllerchange" with no corresponding
  // app-side cause). A fresh temp profile per run removes that confound.
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-back-timing-'));
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--remote-allow-origins=*', `http://localhost:${PORT}/index.html`
  ], { stdio: 'ignore' });
}
async function getTarget() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      const data = await res.json();
      const t = (data || []).find((t) => t.type === 'page' && t.url && t.url.startsWith(`http://localhost:${PORT}`));
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('no target');
}

async function main() {
  const chromeProc = launchChrome();
  const wsUrl = await getTarget();
  const WebSocket = require('ws');
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();
  // Captured for the whole run so each trial can be attributed the exact
  // DOM_CACHE hit/miss and any fallback-to-full-reload lines smooth-
  // navigation.js itself logs, instead of inferring cache state indirectly.
  const consoleMessages = [];

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
  async function pollFor(expression, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try { if (await evalRT(expression)) return true; } catch (e) {}
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      try {
        const text = (msg.params.args || [])
          .map((a) => (a.value !== undefined ? String(a.value) : (a.description || a.type)))
          .join(' ');
        consoleMessages.push(text);
      } catch (e) {}
    }
  });

  await new Promise((r) => ws.on('open', r));
  ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));

  await pollFor(`!!document.title`);
  await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
  ws.send(JSON.stringify({ id: id++, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/index.html` } }));
  const ready = await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);
  if (!ready) throw new Error('Home shell never became ready');

  const results = [];
  const TRIAL_COUNT = 6; // 5+ cycles required to rule out an intermittent race, not just a single lucky/unlucky run
  for (let trial = 1; trial <= TRIAL_COUNT; trial++) {
    const consoleCursorStart = consoleMessages.length;

    // If the PREVIOUS trial's back-navigation was a genuine full reload, the
    // whole JS realm was replaced and window.navigateTo (defined by a
    // deferred script) may not exist yet on the fresh document — calling it
    // immediately throws instead of producing a useful measurement. Wait for
    // it rather than crashing, and record how long that took: a real, honest
    // signal in its own right, not just a robustness workaround.
    const navReadyStart = Date.now();
    const navReady = await pollFor(`typeof window.navigateTo === 'function'`, 10000);
    const navReadyWaitMs = Date.now() - navReadyStart;
    if (!navReady) {
      results.push({ trial, error: 'window.navigateTo never became available within 10s — aborting remaining trials', navReadyWaitMs });
      break;
    }

    // Navigate away to a real shell page
    await evalRT(`window.navigateTo('Insights/insights.html')`, true);
    await pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);

    const wasFullReloadMarkerBefore = 'back_check_' + trial + '_' + Date.now();
    await evalRT(`window.__anhadBackCheck = ${JSON.stringify(wasFullReloadMarkerBefore)}; performance.mark('anhad_before_back_${trial}');`);
    const t0 = await evalRT(`Date.now()`);

    await evalRT(`window.history.back()`);
    await pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, 8000);
    await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 5000);

    // Realm-resilient: if history.back() triggered a full reload instead of
    // a bfcache restore, the JS realm (and any performance.mark set before
    // it) is gone — found by running this: it genuinely happened here, so
    // this can't assume the mark survived. Fall back to a Date.now() delta
    // (measured across two separate CDP round-trips, so it's a real but
    // slightly less precise number) rather than crashing either way.
    const wasFullReload = await evalRT(`window.__anhadBackCheck !== ${JSON.stringify(wasFullReloadMarkerBefore)}`).catch(() => true);
    let durationMs;
    if (!wasFullReload) {
      try {
        await evalRT(`performance.mark('anhad_after_back_${trial}'); performance.measure('anhad_back_${trial}','anhad_before_back_${trial}','anhad_after_back_${trial}')`);
        durationMs = Math.round(await evalRT(`performance.getEntriesByName('anhad_back_${trial}')[0].duration`));
      } catch (e) {
        wasFullReload === false; // measure failed unexpectedly; fall through to Date.now() estimate below
      }
    }
    if (durationMs === undefined) {
      const t1 = await evalRT(`Date.now()`);
      durationMs = t1 - t0; // includes ~1 CDP round-trip of overhead; still a real, honest measurement
    }

    // DRAIN: Runtime.consoleAPICalled events and Runtime.evaluate responses
    // are independent message streams over the same WebSocket with no
    // ordering guarantee between them — found by running this: a trial's
    // own trailing console lines (e.g. its DOM_CACHE back-check lookup)
    // were consistently arriving AFTER this script had already moved on
    // and sliced the NEXT trial's cursor start, silently misattributing
    // them by one trial. A short pause lets in-flight messages land before
    // this trial's window is read.
    await new Promise((r) => setTimeout(r, 400));

    // Real evidence for which path fired, not an inference: smooth-
    // navigation.js logs '⚡ INSTANT CACHE HIT' only on the DOM_CACHE-hit
    // fast path, and 'Target structure mismatch'/'SPA swap failed' only on
    // the two full-reload fallback paths. pwa-register.js logs '[PWA]
    // Reloading:' right before its own independent window.location.reload()
    // call (controllerchange or version-change triggered) — a real reload
    // this script's own realm-reset detection would also flag as
    // wasFullPageReload, but from a completely different, unrelated cause
    // that closing the DOM_CACHE race cannot fix. Keep the full raw line set
    // too — a reload with none of these markers means a fourth mechanism.
    const trialConsoleLines = consoleMessages.slice(consoleCursorStart);
    const domCacheHit = trialConsoleLines.some((m) => m.includes('INSTANT CACHE HIT'));
    const fallbackFired = trialConsoleLines.filter((m) => m.includes('Target structure mismatch') || m.includes('SPA swap failed, falling back'));
    const pwaReloadFired = trialConsoleLines.filter((m) => m.includes('[PWA] Reloading') || m.includes('[PWA]') && m.includes('VERSION CHANGED'));
    const domCacheDebugLines = trialConsoleLines.filter((m) => m.includes('DOM_CACHE') || m.includes('DOM SAVED'));

    results.push({
      trial,
      backNavigationDurationMs: durationMs,
      wasFullPageReload: !!wasFullReload,
      measurementMethod: wasFullReload ? 'Date.now() delta (realm reset by full reload)' : 'performance.mark/measure',
      domCacheHitOnBack: domCacheHit,
      fallbackToReloadLogged: fallbackFired.length > 0,
      fallbackLogLines: fallbackFired,
      pwaReloadLogged: pwaReloadFired.length > 0,
      pwaReloadLogLines: pwaReloadFired,
      domCacheDebugLines,
      navReadyWaitMsAtTrialStart: navReadyWaitMs,
      // Full raw capture too — if a reload happens with none of the specific
      // markers above set, this is what actually explains it.
      allConsoleLinesThisTrial: wasFullReload ? trialConsoleLines : undefined
    });
  }

  ws.close();
  chromeProc.kill();

  const report = {
    suite: 'ANHAD Home-after-Back timing',
    timestamp: new Date().toISOString(),
    source: 'CDP performance.mark/measure inside the page, same tab/session as the initial load',
    note: 'Measures the in-memory SPA cache path, not the browser HTTP cache — a different signal from Lighthouse cold-start numbers; do not average them together.',
    trials: results,
    summary: {
      trialCount: results.length,
      anyFullPageReload: results.some((r) => r.wasFullPageReload),
      allDomCacheHitsOnBack: results.every((r) => r.domCacheHitOnBack),
      maxBackNavigationDurationMs: Math.max(...results.map((r) => r.backNavigationDurationMs))
    }
  };
  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(__dirname, '../home-after-back-report.json'), JSON.stringify(report, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
