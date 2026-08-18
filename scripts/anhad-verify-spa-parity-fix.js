/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFICATION: SPA / Hard-Refresh Rendering Parity fixes (Fix 1-4, this pass)
 *
 * Targets the specific scenarios the approved plan's Root Causes 1-4 describe,
 * which the existing anhad-full-lifecycle-verification.js does NOT cover:
 *
 *   - Root Cause 2's EXACT trigger: session's first page is NOT Home, so
 *     trendora-app.js/homepage-data.js must load correctly on first SPA
 *     arrival at Home (previously silently never loaded at all).
 *   - Root Cause 3: guru portrait slider / hero carousel must stay populated
 *     across a CACHED-CLONE return to Home (DOM_CACHE hit), not just a fresh
 *     SPA arrival.
 *   - Root Cause 1: Favorites' .header/.header__title computed styles must
 *     match between a direct hard load and an SPA arrival from Home.
 *   - Root Cause 4 + the CarouselController/App.init leaks found while
 *     implementing: window/document listener + setInterval counts must stay
 *     BOUNDED across repeated Home revisits, not grow per-cycle.
 *
 * Listener/interval counts are measured by monkey-patching addEventListener/
 * setInterval/clearInterval via Page.addScriptToEvaluateOnNewDocument, so
 * counts are real instrumentation, not inferred from source reading.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9227;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-parity-'));
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--remote-allow-origins=*',
    'about:blank'
  ], { stdio: 'ignore' });
}

async function ensureServerRunning() {
  try {
    const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return null;
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

async function getCDPPageWebSocketUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      const data = await res.json();
      const target = (data || []).find((t) => t.type === 'page');
      if (target) return target.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Could not find a page target via Chrome Remote Debugging on port ${DEBUG_PORT}`);
}

const INSTRUMENTATION_SCRIPT = `
(function() {
  if (window.__anhadTestInstrumentation) return;
  window.__anhadTestInstrumentation = {
    windowAdd: {}, documentAdd: {}, intervalsCreated: 0, intervalsCleared: 0,
    tracedSources: {}
  };
  var t = window.__anhadTestInstrumentation;
  var WATCHED = { pageshow: 1, pagehide: 1 };
  function recordSource(bucket, type) {
    if (!WATCHED[type]) return;
    var stack = (new Error()).stack || '';
    // frame 0 = "Error", frame 1 = this function, frame 2 = the
    // addEventListener override that called it, frame 3 = the real caller.
    var line = stack.split('\\n')[3] || stack;
    var key = type + ' :: ' + line.trim();
    t.tracedSources[key] = (t.tracedSources[key] || 0) + 1;
  }
  var origWinAdd = window.addEventListener.bind(window);
  window.addEventListener = function(type) {
    t.windowAdd[type] = (t.windowAdd[type] || 0) + 1;
    recordSource('window', type);
    return origWinAdd.apply(window, arguments);
  };
  var origDocAdd = document.addEventListener.bind(document);
  document.addEventListener = function(type) {
    t.documentAdd[type] = (t.documentAdd[type] || 0) + 1;
    recordSource('document', type);
    return origDocAdd.apply(document, arguments);
  };
  var origSetInterval = window.setInterval.bind(window);
  window.setInterval = function() {
    t.intervalsCreated++;
    var stack = (new Error()).stack || '';
    var line = stack.split('\\n')[2] || stack;
    var key = 'setInterval :: ' + line.trim();
    t.tracedSources[key] = (t.tracedSources[key] || 0) + 1;
    return origSetInterval.apply(window, arguments);
  };
  var origClearInterval = window.clearInterval.bind(window);
  window.clearInterval = function() {
    t.intervalsCleared++;
    return origClearInterval.apply(window, arguments);
  };
})();
`;

async function main() {
  console.log('\n=== ANHAD SPA/Hard-Refresh Parity Fix Verification ===\n');
  let serverProc = null;
  let chromeProc = null;
  const report = { steps: [], consoleErrors: [], failedRequests: [], uncaughtExceptions: [] };

  try {
    serverProc = await ensureServerRunning();
    chromeProc = launchChrome();
    const wsUrl = await getCDPPageWebSocketUrl();
    const WebSocket = require('ws');
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
        ws.send(JSON.stringify({
          id: evalId, method: 'Runtime.evaluate',
          params: { expression, awaitPromise, returnByValue: true, includeCommandLineAPI: true }
        }));
      });
    }
    function send(method, params = {}) {
      return new Promise((res) => {
        const cbId = id++;
        callbacks.set(cbId, (msg) => { callbacks.delete(cbId); res(msg); });
        ws.send(JSON.stringify({ id: cbId, method, params }));
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
    const waitForNavReady = () => pollFor(`typeof window.navigateTo === 'function'`, 10000);

    const requestInfoById = new Map();
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id && callbacks.has(msg.id)) { callbacks.get(msg.id)(msg); return; }
      if (msg.method === 'Runtime.exceptionThrown') {
        const ex = msg.params.exceptionDetails;
        const desc = ex.exception && (ex.exception.description || ex.exception.value) || ex.text;
        report.uncaughtExceptions.push(`${desc} (at ${ex.url || '(inline)'}:${ex.lineNumber}:${ex.columnNumber})`);
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        report.consoleErrors.push((msg.params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' '));
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'log') {
        const text = (msg.params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ');
        if (text.includes('DOM_CACHE') || text.includes('INSTANT CACHE HIT') || text.includes('Skipping script execution')) {
          console.log(`  [console @ ${report._currentStep || '?'}]`, text);
        }
      } else if (msg.method === 'Network.requestWillBeSent') {
        requestInfoById.set(msg.params.requestId, {
          documentURL: msg.params.documentURL,
          type: msg.params.type,
          initiator: msg.params.initiator
        });
      } else if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
        const info = requestInfoById.get(msg.params.requestId) || {};
        let initiatorSummary = info.initiator ? info.initiator.type : 'unknown';
        if (info.initiator && info.initiator.stack && info.initiator.stack.callFrames && info.initiator.stack.callFrames[0]) {
          const f = info.initiator.stack.callFrames[0];
          initiatorSummary += ` @ ${f.url}:${f.lineNumber}:${f.columnNumber} (${f.functionName || 'anonymous'})`;
        }
        report.failedRequests.push({
          url: msg.params.response.url,
          status: msg.params.response.status,
          documentURLAtRequestTime: info.documentURL,
          resourceType: info.type,
          initiator: initiatorSummary,
          testStepAtRequestTime: report._currentStep || '(before any step)'
        });
      }
    });

    await new Promise((r) => ws.on('open', r));
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENTATION_SCRIPT });

    // ═══ SCENARIO A: session's FIRST page is Insights, not Home (Root Cause 2's exact trigger) ═══
    report._currentStep = 'A0-hardload-insights';
    await send('Page.navigate', { url: `http://localhost:${PORT}/Insights/insights.html` });
    await pollFor(`!!document.title`, 10000);
    await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
    await send('Page.navigate', { url: `http://localhost:${PORT}/Insights/insights.html` });
    const insightsReady = await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);
    report.steps.push({ name: 'A0_sessionStartsOnInsights', ok: insightsReady });
    if (!insightsReady) throw new Error('Insights never became ready as session start page — aborting');

    // Confirm the premise: trendora-app.js/homepage-data.js truly not loaded yet
    const preHomeState = await evalRT(`({
      appDefined: typeof App !== 'undefined',
      windowAppInit: !!window.__anhadAppInitialized,
      scriptTagPresent: !!document.querySelector('script[src*="trendora-app.js"]')
    })`);
    report.steps.push({ name: 'A1_homeScriptsNotYetLoaded', ok: !preHomeState.windowAppInit && !preHomeState.scriptTagPresent, details: JSON.stringify(preHomeState) });

    // Now SPA-navigate to Home for the FIRST time this session (non-cached path)
    report._currentStep = 'A2-spa-insights-to-home';
    await waitForNavReady();
    await evalRT(`window.navigateTo('/index.html')`, true);
    const homeArrived = await pollFor(`(location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')) && document.querySelectorAll('.hero-card').length > 0`, 10000);
    report.steps.push({ name: 'A2_firstSpaArrivalAtHome', ok: homeArrived });
    // Give async script loads + requestAnimationFrame revival a moment to settle
    await new Promise((r) => setTimeout(r, 1200));

    const postHomeState = await evalRT(`({
      appInitialized: !!window.__anhadAppInitialized,
      guruSlides: document.querySelectorAll('#guruSliderTrack .greeting__slide').length,
      heroTrackChildren: document.getElementById('heroTrack') ? document.getElementById('heroTrack').children.length : -1,
      heroDots: document.querySelectorAll('.hero-carousel__dot').length,
      navPathsBound: (function(){
        var el = document.getElementById('gurbaniRadioCard');
        return !!el;
      })()
    })`);
    const scriptsLoadedOk = postHomeState.appInitialized && postHomeState.guruSlides > 0 && postHomeState.heroTrackChildren > 0;
    report.steps.push({
      name: 'A3_homeScriptsAndVisualsPopulatedOnFirstSpaArrival',
      ok: scriptsLoadedOk,
      details: JSON.stringify(postHomeState)
    });

    // ═══ SCENARIO B: cached-clone return to Home (Root Cause 3) ═══
    report._currentStep = 'B-home-to-insights';
    await evalRT(`window.navigateTo('/Insights/insights.html')`, true);
    await pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);
    await waitForNavReady();
    report._currentStep = 'B-insights-back-to-home-cached';
    await evalRT(`window.navigateTo('/index.html')`, true);
    const cachedReturnArrived = await pollFor(`(location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')) && document.querySelectorAll('.hero-card').length > 0`, 8000);
    await new Promise((r) => setTimeout(r, 800));
    const cachedReturnState = await evalRT(`({
      guruSlides: document.querySelectorAll('#guruSliderTrack .greeting__slide').length,
      heroTrackChildren: document.getElementById('heroTrack') ? document.getElementById('heroTrack').children.length : -1,
      appDataCached: document.getElementById('app') ? document.getElementById('app').dataset.cached : null
    })`);
    const cachedRevivalOk = cachedReturnArrived && cachedReturnState.guruSlides > 0 && cachedReturnState.heroTrackChildren > 0;
    report.steps.push({
      name: 'B1_visualsStillPopulatedAfterCachedReturn',
      ok: cachedRevivalOk,
      details: JSON.stringify(cachedReturnState)
    });

    // ═══ SCENARIO C: Favorites CSS parity — direct load vs SPA arrival from Home ═══
    report._currentStep = 'C-hardload-favorites';
    const directFavoritesStyles = await (async () => {
      await send('Page.navigate', { url: `http://localhost:${PORT}/Favorites/favorites.html` });
      await pollFor(`!!document.querySelector('.header__title')`, 10000);
      return evalRT(`(function(){
        var el = document.querySelector('.header__title');
        if (!el) return null;
        var cs = getComputedStyle(el);
        return { fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color };
      })()`);
    })();
    // Now go back to Home hard, then SPA into Favorites, and compare
    report._currentStep = 'C-hardload-home-again';
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);
    await waitForNavReady();
    report._currentStep = 'C-spa-home-to-favorites';
    await evalRT(`window.navigateTo('/Favorites/favorites.html')`, true);
    await pollFor(`location.pathname.toLowerCase().includes('favorites')`, 8000);
    await pollFor(`!!document.querySelector('.header__title')`, 5000);
    const spaFavoritesStyles = await evalRT(`(function(){
      var el = document.querySelector('.header__title');
      if (!el) return null;
      var cs = getComputedStyle(el);
      return { fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color };
    })()`);
    const stylesMatch = directFavoritesStyles && spaFavoritesStyles &&
      directFavoritesStyles.fontFamily === spaFavoritesStyles.fontFamily &&
      directFavoritesStyles.fontSize === spaFavoritesStyles.fontSize &&
      directFavoritesStyles.fontWeight === spaFavoritesStyles.fontWeight &&
      directFavoritesStyles.color === spaFavoritesStyles.color;
    report.steps.push({
      name: 'C1_favoritesHeaderTitleStylesMatchDirectVsSpa',
      ok: stylesMatch,
      details: JSON.stringify({ direct: directFavoritesStyles, spa: spaFavoritesStyles })
    });

    // ═══ SCENARIO D: repeated Home<->Insights cycles — listener/interval growth check ═══
    report._currentStep = 'D-favorites-to-home';
    await evalRT(`window.navigateTo('/index.html')`, true);
    await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 8000);
    await new Promise((r) => setTimeout(r, 500));
    const beforeCycles = await evalRT(`JSON.parse(JSON.stringify(window.__anhadTestInstrumentation))`);

    for (let cycle = 1; cycle <= 6; cycle++) {
      report._currentStep = `D-cycle${cycle}-home-to-insights`;
      await waitForNavReady();
      await evalRT(`window.navigateTo('/Insights/insights.html')`, true);
      await pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);
      report._currentStep = `D-cycle${cycle}-insights-to-home`;
      await waitForNavReady();
      await evalRT(`window.navigateTo('/index.html')`, true);
      await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 8000);
      await new Promise((r) => setTimeout(r, 300));
    }
    const afterCycles = await evalRT(`JSON.parse(JSON.stringify(window.__anhadTestInstrumentation))`);

    console.log('\n--- traced sources (setInterval / pageshow / pagehide registrations, by call site) ---');
    Object.entries(afterCycles.tracedSources || {}).sort((a, b) => b[1] - a[1]).forEach(([key, count]) => {
      console.log(`  ${count}x  ${key}`);
    });
    console.log('---\n');

    // Net active intervals (created - cleared) must stay small/bounded, not grow ~linearly with cycle count.
    const netActiveIntervalsBefore = beforeCycles.intervalsCreated - beforeCycles.intervalsCleared;
    const netActiveIntervalsAfter = afterCycles.intervalsCreated - afterCycles.intervalsCleared;
    const intervalGrowth = netActiveIntervalsAfter - netActiveIntervalsBefore;

    // anhadAudioStateChange (homepage-data.js) and the sky-bg/theme listeners should NOT grow per cycle
    // (each is guarded to bind once); page-scoped listeners on window (popstate, pageshow, etc. from
    // Scheduler.init(), which runs once via App.init()'s outer guard) should also not grow.
    const watchedEvents = ['anhadAudioStateChange', 'anhad_page_restored', 'anhad_page_changed', 'anhadTimeForced', 'popstate', 'pageshow', 'pagehide', 'storage', 'visibilitychange'];
    const listenerGrowth = {};
    watchedEvents.forEach(evt => {
      const before = beforeCycles.windowAdd[evt] || 0;
      const after = afterCycles.windowAdd[evt] || 0;
      listenerGrowth[evt] = { before, after, grew: after > before };
    });
    const anyListenerGrew = Object.values(listenerGrowth).some(v => v.grew);

    report.steps.push({
      name: 'D1_intervalCountBoundedAcross6Cycles',
      ok: intervalGrowth <= 1, // allow small slack (e.g. a single legitimate one-time timer), but not ~6 (one per cycle)
      details: JSON.stringify({ netActiveIntervalsBefore, netActiveIntervalsAfter, intervalGrowth, beforeCycles, afterCycles })
    });
    report.steps.push({
      name: 'D2_noWindowListenerAccumulationAcross6Cycles',
      ok: !anyListenerGrew,
      details: JSON.stringify(listenerGrowth)
    });

    // Final visual sanity check after 6 full cycles
    const finalVisualState = await evalRT(`({
      guruSlides: document.querySelectorAll('#guruSliderTrack .greeting__slide').length,
      heroTrackChildren: document.getElementById('heroTrack') ? document.getElementById('heroTrack').children.length : -1
    })`);
    report.steps.push({
      name: 'D3_visualsStillCorrectAfter6Cycles',
      ok: finalVisualState.guruSlides > 0 && finalVisualState.heroTrackChildren > 0,
      details: JSON.stringify(finalVisualState)
    });

    ws.close();
    report.summary = {
      totalConsoleErrors: report.consoleErrors.length,
      totalFailedRequests: report.failedRequests.length,
      totalUncaughtExceptions: report.uncaughtExceptions.length,
      allStepsOk: report.steps.every((s) => s.ok !== false)
    };
  } catch (err) {
    console.error('Verification error:', err);
    report.fatalError = String(err && err.message ? err.message : err);
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill();
    report.steps.forEach((s) => {
      console.log(`  ${s.ok === false ? 'FAIL' : 'PASS'}  ${s.name}${s.details ? ' — ' + s.details : ''}`);
    });
    if (report.consoleErrors.length) console.log('\nConsole errors:', JSON.stringify(report.consoleErrors, null, 2));
    if (report.failedRequests.length) console.log('\nFailed requests:', JSON.stringify(report.failedRequests, null, 2));
    if (report.uncaughtExceptions.length) console.log('\nUncaught exceptions:', JSON.stringify(report.uncaughtExceptions, null, 2));
    if (report.summary) console.log('\nSummary:', JSON.stringify(report.summary, null, 2));
    fs.writeFileSync(path.join(__dirname, 'anhad-parity-report.json'), JSON.stringify(report, null, 2));
    console.log('\nFull report saved to anhad-parity-report.json\n');
    process.exit(0);
  }
}

main();
