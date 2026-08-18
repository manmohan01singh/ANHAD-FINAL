/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FULL SPA LIFECYCLE VERIFICATION
 *
 * Built in response to real user browser-console findings that the earlier
 * navigation verification pass missed: shared header controls (theme,
 * notifications, settings, guide) dying after an SPA swap, Gurbani Radio
 * cards not navigating, 404s for /favorites.html and /insights.html,
 * /Favorites/assets/app-logo.webp resolving wrong, and insights.js's
 * openModal() throwing on a null DOM lookup when Insights is reached via
 * SPA swap. Root causes for all of these were investigated and fixed before
 * this script was written (see frontend/index.html, frontend/lib/smooth-
 * navigation.js, frontend/Insights/insights.html, frontend/Insights/
 * insights.js, frontend/Favorites/favorites.html, frontend/js/trendora-
 * app.js, frontend/js/homepage-data.js) — this script exists to PROVE those
 * fixes hold under real repeated navigation, not to guess whether they do.
 *
 * Captures generically, not by grepping for known strings:
 *   - Network.responseReceived / Network.loadingFailed -> real 404/failure count
 *   - Runtime.exceptionThrown -> real uncaught JS exception count
 *   - Runtime.consoleAPICalled filtered by level -> real console error/warning count
 *   - Page.frameNavigated (main frame only) -> real full-document navigation count
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9226;

function launchChrome() {
  // Isolated profile per run — a shared default profile carries service-
  // worker state across every script run today, which previously caused a
  // one-time controllerchange->_safeReload() to fire mid-test and get
  // misread as an app bug (see anhad-home-after-back-timing.js). A fresh
  // profile avoids that confound here too.
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-lifecycle-'));
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--remote-allow-origins=*',
    `http://localhost:${PORT}/index.html`
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
      const target = (data || []).find((t) => t.type === 'page' && t.url && t.url.startsWith(`http://localhost:${PORT}`));
      if (target) return target.webSocketDebuggerUrl;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Could not find an ANHAD page target on http://localhost:${PORT} via Chrome Remote Debugging`);
}

async function main() {
  console.log('\n=== ANHAD Full SPA Lifecycle Verification ===\n');
  let serverProc = null;
  let chromeProc = null;

  const report = {
    suite: 'ANHAD Full SPA Lifecycle Verification',
    timestamp: new Date().toISOString(),
    networkRequests: [],
    failedRequests: [],
    consoleErrors: [],
    consoleWarnings: [],
    uncaughtExceptions: [],
    frameNavigations: [],
    steps: []
  };

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
          id: evalId,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise, returnByValue: true, includeCommandLineAPI: true }
        }));
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

    const requestUrlById = new Map();
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id && callbacks.has(msg.id)) { callbacks.get(msg.id)(msg); return; }

      switch (msg.method) {
        case 'Network.requestWillBeSent': {
          requestUrlById.set(msg.params.requestId, msg.params.request.url);
          report.networkRequests.push({ url: msg.params.request.url });
          break;
        }
        case 'Network.responseReceived': {
          const url = msg.params.response.url;
          const status = msg.params.response.status;
          if (status >= 400) {
            report.failedRequests.push({ url, status, type: 'http-error' });
          }
          break;
        }
        case 'Network.loadingFailed': {
          const url = requestUrlById.get(msg.params.requestId) || '(unknown url)';
          if (!msg.params.canceled) {
            report.failedRequests.push({ url, error: msg.params.errorText, type: 'network-failure' });
          }
          break;
        }
        case 'Runtime.exceptionThrown': {
          const ex = msg.params.exceptionDetails;
          report.uncaughtExceptions.push({
            text: ex.text,
            url: ex.url,
            lineNumber: ex.lineNumber,
            description: ex.exception && (ex.exception.description || ex.exception.value)
          });
          break;
        }
        case 'Runtime.consoleAPICalled': {
          const text = (msg.params.args || [])
            .map((a) => (a.value !== undefined ? String(a.value) : (a.description || a.type)))
            .join(' ');
          if (msg.params.type === 'error') report.consoleErrors.push(text);
          else if (msg.params.type === 'warning') report.consoleWarnings.push(text);
          break;
        }
        case 'Page.frameNavigated': {
          if (!msg.params.frame.parentId) {
            report.frameNavigations.push({ url: msg.params.frame.url, ts: Date.now() });
          }
          break;
        }
      }
    });

    await new Promise((r) => ws.on('open', r));
    ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: id++, method: 'Network.enable' }));

    await pollFor(`!!document.title`);
    await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
    ws.send(JSON.stringify({ id: id++, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/index.html` } }));
    const ready = await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);
    report.steps.push({ name: 'initialLoad', ok: ready, details: ready ? null : 'shell never became ready' });
    if (!ready) throw new Error('shell never became ready — aborting');

    // Reset capture AFTER initial load settles, so cold-load noise (fonts,
    // initial prefetches, the one-time SW registration cycle) doesn't drown
    // out what happens during the actual navigation flows under test.
    await new Promise((r) => setTimeout(r, 1500));
    report.networkRequests = [];
    report.failedRequests = [];
    report.consoleErrors = [];
    report.consoleWarnings = [];
    report.uncaughtExceptions = [];
    report.frameNavigations = [];

    // ─── Header control check (real, non-destructive where possible) ──────
    // Settings/Guide/Notifications navigate AWAY from Home (full reload —
    // none of their destinations are SPA shell pages), so actually clicking
    // them here would derail the multi-step flow under test. Instead verify
    // the exact mechanism the fix relies on: a non-null onclick handler
    // whose source text targets the right destination — this is a direct,
    // real check of "will this element function when clicked", not a proxy
    // for it, since onclick="" content-attribute handlers are compiled by
    // the browser into that same .onclick property on parse, whether the
    // element came from initial page HTML, an innerHTML reassignment, or a
    // cloneNode() (all three paths this app's SPA swap can take). Theme is
    // verified with an actual click since toggling it has no navigation
    // side effect to derail the flow.
    async function checkHeaderControls(label) {
      const result = await evalRT(`
        (function(){
          function check(id, mustInclude) {
            var el = document.getElementById(id);
            if (!el) return { present: false };
            var fn = el.onclick;
            var wired = typeof fn === 'function' && fn.toString().includes(mustInclude);
            return { present: true, wired: wired };
          }
          return {
            settings: check('settingsBtn', 'Settings/index.html'),
            guide: check('tourGuideBtn', 'guide/index.html'),
            notifications: check('notifBtn', 'smart-reminders'),
            themePresent: !!document.getElementById('themeToggleBtn')
          };
        })()
      `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));

      let themeOk = false;
      let themeDiag = null;
      if (result && result.themePresent) {
        const themeReady = await pollFor(`!!window.AnhadTheme`, 5000);
        // Compare data-theme-mode (the stored light/dark/auto preference,
        // read by AnhadTheme's own getTheme() from localStorage — a strict
        // 3-way cycle, always different after exactly one toggle), not
        // data-theme (the EFFECTIVE computed value, which in 'auto' mode
        // depends on time-of-day/system preference and can coincidentally
        // equal the previous effective value even though the underlying
        // mode genuinely changed — found by running this: comparing
        // data-theme gave a false failure, auto's computed light == the
        // prior explicit light, even though toggle() really did run).
        const themeBefore = await evalRT(`document.documentElement.getAttribute('data-theme-mode')`).catch(() => null);
        await evalRT(`document.getElementById('themeToggleBtn').click()`);
        await new Promise((r) => setTimeout(r, 400));
        const themeAfter = await evalRT(`document.documentElement.getAttribute('data-theme-mode')`).catch(() => null);
        themeOk = themeAfter !== null && themeAfter !== themeBefore;
        themeDiag = { themeReady, themeBefore, themeAfter };
        // Toggle back so repeated cycles start from a consistent state
        // (best-effort — AnhadTheme.toggle() cycles light->dark->auto->light,
        // so two clicks don't necessarily return to the exact starting state,
        // but that's cosmetic for this test, not a correctness concern).
        if (themeOk) await evalRT(`document.getElementById('themeToggleBtn').click()`);
      }

      const allOk = !!(result && !result.error &&
        result.settings.present && result.settings.wired &&
        result.guide.present && result.guide.wired &&
        result.notifications.present && result.notifications.wired &&
        themeOk);

      report.steps.push({
        name: `headerControls:${label}`,
        ok: allOk,
        details: allOk ? null : JSON.stringify({ ...result, themeOk, themeDiag })
      });
      return allOk;
    }

    // Header controls (#settingsBtn etc.) only exist in frontend/index.html's
    // own header — Insights/Favorites have no matching ids at all (confirmed
    // by investigation), so this check is only meaningful on Home. Calling
    // it elsewhere isn't a bug to report, it's a no-op by design.
    async function checkHeaderControlsIfOnHome(label) {
      const onHome = await evalRT(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`).catch(() => false);
      if (!onHome) return true;
      return checkHeaderControls(label);
    }

    // Absolute (leading-slash) paths throughout — matching the same
    // unambiguous convention now used in the real tab-bar markup
    // (frontend/index.html's own self-link already did; Favorites'/
    // Insights' tab bars were fixed to match). window.navigateTo()
    // resolves whatever string it's given against window.location.href
    // (the CURRENT page), not against window.ANHAD_ROOT — a bare
    // 'Insights/insights.html' is only correct when called from a
    // root-level page. Real clicks are safe because the DOM href is
    // already absolute by the time they fire; calling navigateTo()
    // directly with a bare relative string here reproduced a genuine
    // doubled-path 404 (e.g. /Favorites/Insights/insights.html) when
    // called from a non-root page — a real gap in navigateTo() itself,
    // not just a hazard for this test script, since any future
    // programmatic (non-click) caller could hit it the same way.
    const goHome = async () => {
      if (!(await waitForNavReady())) return false;
      await evalRT(`window.navigateTo('/index.html')`, true);
      return pollFor(`(location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')) && document.querySelectorAll('.hero-card').length > 0`, 8000);
    };
    const goInsights = async () => {
      if (!(await waitForNavReady())) return false;
      await evalRT(`window.navigateTo('/Insights/insights.html')`, true);
      return pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);
    };
    const goFavorites = async () => {
      if (!(await waitForNavReady())) return false;
      await evalRT(`window.navigateTo('/Favorites/favorites.html')`, true);
      return pollFor(`location.pathname.toLowerCase().includes('favorites')`, 8000);
    };

    // Baseline: header controls on initial Home load
    await checkHeaderControls('initialHome');

    // Home -> Insights -> Back -> Home
    let ok = await goInsights();
    await evalRT(`window.history.back()`);
    ok = ok && await pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, 8000);
    report.steps.push({ name: 'flow:HomeInsightsBackHome', ok, details: ok ? null : 'navigation did not complete' });
    await checkHeaderControlsIfOnHome('afterHomeInsightsBackHome');

    // Home -> Favorites -> Back -> Home
    ok = await goFavorites();
    await evalRT(`window.history.back()`);
    ok = ok && await pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, 8000);
    report.steps.push({ name: 'flow:HomeFavoritesBackHome', ok, details: ok ? null : 'navigation did not complete' });
    await checkHeaderControlsIfOnHome('afterHomeFavoritesBackHome');

    // Home -> Insights -> Favorites -> Insights -> Home, checking after every hop
    ok = await goInsights();
    report.steps.push({ name: 'flow:toInsights', ok });
    await checkHeaderControlsIfOnHome('onInsights_1');
    ok = ok && await goFavorites();
    report.steps.push({ name: 'flow:InsightsToFavorites', ok });
    await checkHeaderControlsIfOnHome('onFavorites_1');
    ok = ok && await goInsights();
    report.steps.push({ name: 'flow:FavoritesToInsights', ok });
    await checkHeaderControlsIfOnHome('onInsights_2');
    ok = ok && await goHome();
    report.steps.push({ name: 'flow:InsightsToHome', ok });
    await checkHeaderControlsIfOnHome('afterInsightsFavoritesInsightsHome');

    // Repeat the whole sequence 5 times, checking header controls each time back on Home
    for (let cycle = 1; cycle <= 5; cycle++) {
      let cycleOk = await goInsights();
      cycleOk = cycleOk && await evalRT(`window.history.back()`).then(() => pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, 8000));
      cycleOk = cycleOk && await goFavorites();
      cycleOk = cycleOk && await evalRT(`window.history.back()`).then(() => pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, 8000));
      report.steps.push({ name: `repeatCycle_${cycle}`, ok: cycleOk, details: cycleOk ? null : 'a navigation step in this cycle failed' });
      await checkHeaderControlsIfOnHome(`repeatCycle_${cycle}`);
    }

    // ─── insights.js modal fix: real click on a category card while reached via SPA swap ───
    await goInsights();
    // goInsights() only polls the URL, not that #app's content actually
    // finished swapping in — wait for the real DOM target before clicking,
    // to avoid a false failure racing the swap.
    await pollFor(`document.querySelectorAll('.category-card').length > 0`, 5000);
    const modalResult = await evalRT(`
      (function(){
        var card = document.querySelector('.category-card[data-topic="history"]');
        if (!card) return { found: false };
        try {
          card.click();
          var modal = document.getElementById('insightModal');
          var langSwitch = document.getElementById('langSwitch');
          return { found: true, clicked: true, modalExists: !!modal, langSwitchExists: !!langSwitch, modalActive: !!(modal && modal.classList.contains('insight-modal--active')) };
        } catch (e) {
          return { found: true, clicked: false, error: String(e && e.message ? e.message : e) };
        }
      })()
    `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
    const modalOk = !!(modalResult && modalResult.found && modalResult.clicked && !modalResult.error && modalResult.modalExists && modalResult.langSwitchExists);
    report.steps.push({ name: 'insightsModalOpensViaSpaSwap', ok: modalOk, details: modalOk ? null : JSON.stringify(modalResult) });
    // Close it and leave, exercising the page-cleanup registry
    await evalRT(`if (window.closeModal) window.closeModal();`).catch(() => {});
    await goHome();
    const cleanupResult = await evalRT(`({ openModalGone: typeof window.openModal === 'undefined', closeModalGone: typeof window.closeModal === 'undefined' })`).catch((e) => ({ error: String(e) }));
    const cleanupOk = !!(cleanupResult && cleanupResult.openModalGone && cleanupResult.closeModalGone);
    report.steps.push({ name: 'insightsGlobalsCleanedUpAfterLeaving', ok: cleanupOk, details: cleanupOk ? null : JSON.stringify(cleanupResult) });

    // ─── Gurbani Radio: real click path ───
    // Play button / LIVE badge intentionally stopPropagation() for in-place
    // quick-play (frontend/index.html initHeroInteractions()) — confirmed
    // by investigation, not assumed. Testing the actual reported user
    // action (tap the card) against the "dead zone" (avoiding button/badge)
    // to confirm the underlying navigateTo() mechanism genuinely works,
    // per the user's own instruction: "If the destination is intentionally
    // not an SPA page, establish that explicitly and ensure the correct
    // normal navigation occurs" — this is a full-reload destination
    // (GurbaniRadio/gurbani-radio.html is not an isShellPage() match), so
    // this check expects and requires a real frame navigation, not an SPA swap.
    await goHome();
    const preNavCount = report.frameNavigations.length;
    const staleDomCheck = await evalRT(`
      (function(){
        var stale = document.querySelectorAll('[onclick*="openModal"]');
        return {
          staleOpenModalElements: stale.length,
          staleTagsAndClasses: Array.from(stale).slice(0, 5).map(function(el){ return el.tagName + '.' + el.className; }),
          appChildCount: document.getElementById('app') ? document.getElementById('app').children.length : null,
          categoryCardCount: document.querySelectorAll('.category-card').length,
          heroCardCount: document.querySelectorAll('.hero-card').length
        };
      })()
    `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
    report.steps.push({ name: 'staleDomDiagnosticBeforeGurbaniClick', ok: staleDomCheck.staleOpenModalElements === 0, details: JSON.stringify(staleDomCheck) });
    const cardClickResult = await evalRT(`
      (function(){
        var card = document.getElementById('heroCard1');
        if (!card) return { found: false };
        // Click the card's title text (span.hero-card__title or similar),
        // explicitly avoiding the play button / LIVE badge subtrees.
        var playBtn = card.querySelector('.hero-card__play-btn');
        var badge = card.querySelector('[class*="badge"], [class*="live"]');
        var target = card.querySelector('.hero-card__title') || card;
        if (target === playBtn || (playBtn && playBtn.contains(target))) return { found: true, skipped: 'would hit play button' };
        target.click();
        return { found: true, clicked: true };
      })()
    `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
    // A real full-page navigation (fetch + parse + run GurbaniRadio's own
    // scripts) genuinely takes longer than an SPA swap, especially this
    // deep into a long test run — 6s produced a false failure; give it more room.
    const navigatedToRadio = await pollFor(`location.pathname.toLowerCase().includes('gurbaniradio')`, 15000);
    const gurbaniOk = !!(cardClickResult && cardClickResult.clicked && navigatedToRadio);
    report.steps.push({
      name: 'gurbaniRadioCardNavigatesOnRealClick',
      ok: gurbaniOk,
      details: gurbaniOk ? null : `cardClickResult=${JSON.stringify(cardClickResult)}, navigatedToRadio=${navigatedToRadio} — NOTE: clicking the play button/LIVE badge specifically is a confirmed intentional quick-play affordance (e.stopPropagation() in frontend/index.html), not a bug; this check targets the card's non-button/badge area to test real navigation`
    });

    ws.close();

    report.summary = {
      totalFailedRequests: report.failedRequests.length,
      totalConsoleErrors: report.consoleErrors.length,
      totalUncaughtExceptions: report.uncaughtExceptions.length,
      totalFullFrameNavigations: report.frameNavigations.length,
      allStepsOk: report.steps.every((s) => s.ok !== false)
    };
  } catch (err) {
    console.error('Lifecycle verification error:', err);
    report.fatalError = String(err && err.message ? err.message : err);
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill();
    report.steps.forEach((s) => {
      console.log(`  ${s.ok === false ? 'FAIL' : 'PASS'}  ${s.name}${s.details ? ' — ' + s.details : ''}`);
    });
    if (report.summary) {
      console.log('\nSummary:', JSON.stringify(report.summary, null, 2));
    }
    fs.writeFileSync(path.join(__dirname, '../anhad-lifecycle-report.json'), JSON.stringify(report, null, 2));
    console.log('\nFull report saved to anhad-lifecycle-report.json\n');
    process.exit(0);
  }
}

main();
