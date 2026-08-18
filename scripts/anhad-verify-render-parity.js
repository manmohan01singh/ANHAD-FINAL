/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFICATION: SPA render parity — the exact symptoms reported by the user.
 *
 *   1. Flash of GIANT unstyled guru portraits when leaving Home.
 *   2. Flash of the "Gurbani GPT — Coming Soon" popup when returning to Home.
 *   3. Learning (Insights) + Favorites rendering as "HTML but no CSS".
 *   4. Learning page missing its heading.
 *   5. Upcoming Gurpurab card blank (no text, no image) after returning to Home.
 *
 * The flash checks are REAL: a requestAnimationFrame sampler runs continuously
 * inside the page and records any frame where the overlay is visible or a guru
 * portrait exceeds its styled size. Checking only the settled end-state would
 * miss exactly the defect the user is reporting.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9233;

function launchChrome() {
  // ANHAD_PROFILE_DIR pins a PERSISTENT Chrome profile so the run reuses an
  // already-installed Service Worker. Fresh profiles (the default) never
  // exercise the SW cache path that real returning users are actually on, which
  // is how a "verified fixed" change previously failed to reach the user.
  const userDataDir = process.env.ANHAD_PROFILE_DIR
    || fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-parity2-'));
  if (process.env.ANHAD_PROFILE_DIR && !fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${userDataDir}`, '--remote-allow-origins=*', 'about:blank'
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
    await new Promise(r => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error('backend/server.js did not become healthy within 15s');
}

async function getCDPPageWebSocketUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      const data = await res.json();
      const target = (data || []).find(t => t.type === 'page');
      if (target) return target.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('no page target');
}

// Continuous per-frame sampler for unstyled-content flashes.
const FLASH_SAMPLER = `
(function () {
  if (window.__anhadFlash) return;
  window.__anhadFlash = { overlayVisibleFrames: 0, maxOverlayOpacity: 0, oversizedGuruFrames: 0, maxGuruWidth: 0, samples: 0 };
  var f = window.__anhadFlash;
  function sample() {
    f.samples++;
    var ov = document.getElementById('anhadComingSoonOverlay');
    if (ov) {
      var cs = getComputedStyle(ov);
      var op = parseFloat(cs.opacity || '0');
      // 'active' is the legitimate user-triggered state; anything else is a leak.
      if (!ov.classList.contains('active') && cs.display !== 'none' && cs.visibility !== 'hidden' && op > 0.01) {
        f.overlayVisibleFrames++;
        if (op > f.maxOverlayOpacity) f.maxOverlayOpacity = op;
      }
    }
    // Guru portraits are styled to ~170px; unstyled they render at natural size.
    var imgs = document.querySelectorAll('#guruSliderTrack img, .greeting__guru-img');
    for (var i = 0; i < imgs.length; i++) {
      var w = imgs[i].getBoundingClientRect().width;
      if (w > f.maxGuruWidth) f.maxGuruWidth = w;
      if (w > 260) { f.oversizedGuruFrames++; break; }
    }
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
})();
`;

async function main() {
  console.log('\n=== ANHAD Render Parity Verification ===\n');
  let serverProc = null, chromeProc = null;
  const report = { steps: [], consoleErrors: [], failedRequests: [], uncaughtExceptions: [] };

  const step = (name, ok, details) => {
    report.steps.push({ name, ok, details: details === undefined ? null : details });
  };

  try {
    serverProc = await ensureServerRunning();
    chromeProc = launchChrome();
    const wsUrl = await getCDPPageWebSocketUrl();
    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    function send(method, params = {}) {
      return new Promise(res => {
        const cbId = id++;
        callbacks.set(cbId, msg => { callbacks.delete(cbId); res(msg.result); });
        ws.send(JSON.stringify({ id: cbId, method, params }));
      });
    }
    function evalRT(expression, awaitPromise = false) {
      return new Promise((res, rej) => {
        const evalId = id++;
        callbacks.set(evalId, msg => {
          callbacks.delete(evalId);
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else if (msg.result && msg.result.exceptionDetails) rej(new Error(JSON.stringify(msg.result.exceptionDetails)));
          else res(msg.result ? msg.result.result.value : undefined);
        });
        ws.send(JSON.stringify({ id: evalId, method: 'Runtime.evaluate', params: { expression, awaitPromise, returnByValue: true, includeCommandLineAPI: true } }));
      });
    }
    async function pollFor(expr, timeoutMs = 15000) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        try { if (await evalRT(expr)) return true; } catch (e) {}
        await new Promise(r => setTimeout(r, 150));
      }
      return false;
    }
    const navReady = () => pollFor(`typeof window.navigateTo === 'function'`, 10000);

    const reqInfo = new Map();
    ws.on('message', data => {
      const msg = JSON.parse(data);
      if (msg.id && callbacks.has(msg.id)) { callbacks.get(msg.id)(msg); return; }
      if (msg.method === 'Runtime.exceptionThrown') {
        const ex = msg.params.exceptionDetails;
        report.uncaughtExceptions.push((ex.exception && (ex.exception.description || ex.exception.value)) || ex.text);
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        report.consoleErrors.push((msg.params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' '));
      } else if (msg.method === 'Network.requestWillBeSent') {
        reqInfo.set(msg.params.requestId, { documentURL: msg.params.documentURL, type: msg.params.type });
      } else if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
        const info = reqInfo.get(msg.params.requestId) || {};
        report.failedRequests.push({ url: msg.params.response.url, status: msg.params.response.status, resourceType: info.type });
      }
    });

    await new Promise(r => ws.on('open', r));
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: FLASH_SAMPLER });

    // ── Baseline: hard loads, to compare SPA results against ──────────────
    // page-lifecycle.js adds 'app--instant' on the pageshow event, which by
    // definition does not fire during an SPA swap. Its absence is inherent to
    // SPA navigation, not a styling regression (it only forces opacity:1 /
    // transition:none), so compare identity classes and ignore it.
    const RUNTIME_ONLY_CLASSES = ['app--instant', 'app--exiting', 'app--fade-in', 'app--fade-out'];
    const identityClasses = (cls) => (cls || '').split(/\s+/)
      .filter(Boolean).filter(c => !RUNTIME_ONLY_CLASSES.includes(c)).sort().join(' ');

    const readSnapshot = () => evalRT(`(function(){
      var h = document.getElementById('pageHeader');
      var t = document.querySelector('.insights-header__title');
      var ft = document.querySelector('.header__title');
      var app = document.getElementById('app');
      var gmp = document.getElementById('gmp');
      var activeTabs = Array.from(document.querySelectorAll('.tab-item.active')).map(function(el){
        return (el.getAttribute('href') || '') + '|' + el.textContent.trim().replace(/\\s+/g,' ');
      });
      return {
        appClass: app ? app.className : null,
        pageHeaderPresent: !!h,
        pageHeaderVisible: h ? (getComputedStyle(h).display !== 'none' && h.getBoundingClientRect().height > 0) : false,
        insightsTitleText: t ? t.textContent.trim() : null,
        insightsTitleWeight: t ? getComputedStyle(t).fontWeight : null,
        favTitleSize: ft ? getComputedStyle(ft).fontSize : null,
        favTitleWeight: ft ? getComputedStyle(ft).fontWeight : null,
        gmpPosition: gmp ? getComputedStyle(gmp).position : null,
        gmpZIndex: gmp ? getComputedStyle(gmp).zIndex : null,
        activeTabCount: activeTabs.length,
        activeTabs: activeTabs
      };
    })()`);

    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await pollFor(`!!document.title`, 10000);
    await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);

    await send('Page.navigate', { url: `http://localhost:${PORT}/Insights/insights.html` });
    await pollFor(`!!document.querySelector('.insights-header__title')`, 12000);
    await new Promise(r => setTimeout(r, 400));
    const insightsDirect = await readSnapshot();

    await send('Page.navigate', { url: `http://localhost:${PORT}/Favorites/favorites.html` });
    await pollFor(`!!document.querySelector('.header__title')`, 12000);
    await new Promise(r => setTimeout(r, 400));
    const favDirect = await readSnapshot();

    // ── SPA run: Home -> Insights -> Favorites -> Home ────────────────────
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);
    await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 10000);
    await new Promise(r => setTimeout(r, 1200));
    const homeDirect = await readSnapshot();
    await evalRT(`window.__anhadFlash.overlayVisibleFrames = 0; window.__anhadFlash.oversizedGuruFrames = 0; window.__anhadFlash.maxGuruWidth = 0; window.__anhadFlash.maxOverlayOpacity = 0;`);

    await navReady();
    await evalRT(`window.navigateTo('/Insights/insights.html')`, true);
    await pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);
    await new Promise(r => setTimeout(r, 700));
    const insightsSpa = await readSnapshot();

    step('1_learningHeadingPresentAfterSpaNav',
      insightsSpa.pageHeaderPresent && insightsSpa.pageHeaderVisible && insightsSpa.insightsTitleText === insightsDirect.insightsTitleText,
      JSON.stringify({ spa: insightsSpa, direct: insightsDirect }));

    step('2_insightsCssActuallyApplied',
      insightsSpa.insightsTitleWeight === insightsDirect.insightsTitleWeight && insightsSpa.insightsTitleWeight !== null,
      `spa=${insightsSpa.insightsTitleWeight} direct=${insightsDirect.insightsTitleWeight}`);

    step('3_insightsAppClassMatchesHardLoad',
      identityClasses(insightsSpa.appClass) === identityClasses(insightsDirect.appClass),
      `spa="${insightsSpa.appClass}" direct="${insightsDirect.appClass}"`);

    step('3b_miniPlayerStaysFixedOnInsights',
      insightsSpa.gmpPosition === 'fixed',
      `gmpPosition=${insightsSpa.gmpPosition} gmpZIndex=${insightsSpa.gmpZIndex}`);

    step('3c_exactlyOneActiveTabOnInsights',
      insightsSpa.activeTabCount === 1 && insightsSpa.activeTabs.some(t => t.includes('Insights')),
      JSON.stringify(insightsSpa.activeTabs));

    await navReady();
    await evalRT(`window.navigateTo('/Favorites/favorites.html')`, true);
    await pollFor(`location.pathname.toLowerCase().includes('favorites')`, 8000);
    await new Promise(r => setTimeout(r, 700));
    const favSpa = await readSnapshot();

    step('4_favoritesCssActuallyApplied',
      favSpa.favTitleSize === favDirect.favTitleSize && favSpa.favTitleWeight === favDirect.favTitleWeight && favSpa.favTitleSize !== null,
      `spa=${favSpa.favTitleSize}/${favSpa.favTitleWeight} direct=${favDirect.favTitleSize}/${favDirect.favTitleWeight}`);

    step('5_favoritesAppClassMatchesHardLoad',
      identityClasses(favSpa.appClass) === identityClasses(favDirect.appClass),
      `spa="${favSpa.appClass}" direct="${favDirect.appClass}"`);

    step('5b_miniPlayerStaysFixedOnFavorites',
      favSpa.gmpPosition === 'fixed',
      `gmpPosition=${favSpa.gmpPosition} gmpZIndex=${favSpa.gmpZIndex}`);

    step('5c_exactlyOneActiveTabOnFavorites',
      favSpa.activeTabCount === 1 && favSpa.activeTabs.some(t => t.includes('Favorites')),
      JSON.stringify(favSpa.activeTabs));

    await navReady();
    await evalRT(`window.navigateTo('/index.html')`, true);
    await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 10000);
    await new Promise(r => setTimeout(r, 1500));
    const homeSpa = await readSnapshot();

    step('6_homeAppClassMatchesHardLoad',
      identityClasses(homeSpa.appClass) === identityClasses(homeDirect.appClass),
      `spa="${homeSpa.appClass}" direct="${homeDirect.appClass}"`);

    step('6b_miniPlayerFixedAfterReturnToHome',
      homeSpa.gmpPosition === 'fixed',
      `gmpPosition=${homeSpa.gmpPosition} gmpZIndex=${homeSpa.gmpZIndex}`);

    step('6c_exactlyOneActiveTabAfterReturnToHome',
      homeSpa.activeTabCount === 1 && homeSpa.activeTabs.some(t => t.includes('index.html') || t.startsWith('/|')),
      JSON.stringify(homeSpa.activeTabs));

    step('7_learningHeaderRemovedOnReturnToHome',
      !homeSpa.pageHeaderPresent || !homeSpa.pageHeaderVisible,
      JSON.stringify({ present: homeSpa.pageHeaderPresent, visible: homeSpa.pageHeaderVisible }));

    step('0_exactlyOneActiveTabOnDirectHomeLoad',
      homeDirect.activeTabCount === 1 && homeDirect.activeTabs.some(t => t.includes('index.html') || t.startsWith('/|')),
      JSON.stringify(homeDirect.activeTabs));

    // ── Flash detection across the whole SPA run ──────────────────────────
    const flash = await evalRT(`window.__anhadFlash`);
    step('8_noComingSoonPopupFlash', flash.overlayVisibleFrames === 0, JSON.stringify(flash));
    step('9_noGiantUnstyledGuruImageFlash', flash.oversizedGuruFrames === 0,
      `oversizedFrames=${flash.oversizedGuruFrames} maxGuruWidth=${Math.round(flash.maxGuruWidth)}px samples=${flash.samples}`);

    // ── Gurpurab card populated after SPA return ──────────────────────────
    const card = await evalRT(`(function(){
      var t = document.getElementById('eventTitle');
      var d = document.getElementById('eventDate');
      var img = document.getElementById('eventGuruImg');
      return {
        titleText: t ? t.textContent.trim() : null,
        titleHasSkeleton: t ? t.classList.contains('skeleton') : null,
        dateText: d ? d.textContent.trim() : null,
        imgSrc: img ? img.getAttribute('src') : null,
        imgNaturalWidth: img ? img.naturalWidth : null
      };
    })()`);
    step('10_gurpurabCardPopulatedAfterSpaReturn',
      !!(card.titleText && card.titleText.length > 0 && card.titleHasSkeleton === false && card.imgSrc && card.imgNaturalWidth > 0),
      JSON.stringify(card));

    ws.close();
    report.summary = {
      totalConsoleErrors: report.consoleErrors.length,
      totalFailedRequests: report.failedRequests.length,
      totalUncaughtExceptions: report.uncaughtExceptions.length,
      allStepsOk: report.steps.every(s => s.ok !== false)
    };
  } catch (err) {
    console.error('Verification error:', err);
    report.fatalError = String(err && err.message ? err.message : err);
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill();
    report.steps.forEach(s => console.log(`  ${s.ok === false ? 'FAIL' : 'PASS'}  ${s.name}${s.details ? ' — ' + s.details : ''}`));
    if (report.consoleErrors.length) console.log('\nConsole errors:', JSON.stringify(report.consoleErrors.slice(0, 10), null, 2));
    if (report.failedRequests.length) console.log('\nFailed requests:', JSON.stringify(report.failedRequests.slice(0, 10), null, 2));
    if (report.uncaughtExceptions.length) console.log('\nUncaught exceptions:', JSON.stringify(report.uncaughtExceptions.slice(0, 10), null, 2));
    if (report.summary) console.log('\nSummary:', JSON.stringify(report.summary, null, 2));
    fs.writeFileSync(path.join(__dirname, 'anhad-render-parity-report.json'), JSON.stringify(report, null, 2));
    process.exit(0);
  }
}

main();
