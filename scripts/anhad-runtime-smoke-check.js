/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD RUNTIME SMOKE CHECK
 *
 * Real headless-Chrome checks that didn't exist in either legacy verification
 * script (scripts/phase9-production-verifier.js, scripts/chrome-browser-runner.js):
 *   1. App shell loads (real page, real title, real #app/header/tab bar)
 *   2. Hero cards present
 *   3. window.AnhadAudio genuinely re-guards against double-init — proven
 *      behaviorally (re-inject the real script tag, confirm a marker
 *      survives), not just by checking a flag exists
 *   4. Clicking a shell-page nav link does NOT cause a full reload (in-memory
 *      marker technique: wiped by any real navigation, survives an SPA swap)
 *   5. The mini-player (#gmp) persists across that same in-app navigation
 *
 * Every check starts with a sanity gate (confirm the real ANHAD page — not
 * some other process on the same port — actually loaded) before doing
 * anything else. Verdict vocabulary is fixed to exactly three values:
 * PASSED / FAILED: <reason> / BLOCKED: <reason> — never a hand-typed string,
 * always computed from the individual check results.
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

function launchChrome() {
  // ISOLATED PROFILE: without --user-data-dir, Chrome's persistent default
  // profile carries a service worker registration across every run of this
  // script (and anhad-home-after-back-timing.js) made today. That SW's own
  // update/activation cycle can fire mid-run and trigger pwa-register.js's
  // controllerchange -> _safeReload(), a real reload with a test-
  // contamination cause rather than an app bug. Fresh temp profile per run.
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-smoke-check-'));
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

function runChecks(wsUrl) {
  const WebSocket = require('ws');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();
    const checks = [];
    // Captured for the whole session so Fix-3-style "did a fallback fire?"
    // questions can be answered from real console output instead of assumed
    // from reading the source — smooth-navigation.js already logs its own
    // fallback/cache-hit paths (see performSwap/applyNewContent).
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
        ws.send(JSON.stringify({
          id: evalId,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise, returnByValue: true, includeCommandLineAPI: true }
        }));
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
    ws.on('error', (err) => reject(err));

    ws.on('open', async () => {
      try {
        ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));

        // --- Sanity gate ---
        // On a fresh session (no prior localStorage/sessionStorage for this
        // origin), index.html's own welcome-check redirects to
        // Homepage/ios-homepage.html — the exact same shouldBypassWelcome()
        // logic a real first-time visitor hits (found by running this: the
        // page really did land there, with a legitimate "ANHAD..." title,
        // not a bug). That page doesn't have the #app shell these checks
        // need, so stamp the same session flags smooth-navigation.js itself
        // sets before navigating to index.html, then navigate there for
        // real and wait for the actual shell.
        const anyPageLoaded = await pollFor(`!!document.title`, { timeoutMs: 15000 });
        if (!anyPageLoaded) {
          ws.close();
          return resolve({ checks: [{ name: 'sanityGate', status: 'BLOCKED', reason: 'No page loaded at all within 15s of connecting.' }], consoleMessages });
        }
        await evalRT(`
          sessionStorage.setItem('anhad_welcomed', '1');
          localStorage.setItem('anhad_welcome_seen', 'true');
          localStorage.setItem('anhad_session_active_ts', Date.now().toString());
        `);
        ws.send(JSON.stringify({ id: id++, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/index.html` } }));

        const shellReady = await pollFor(
          `!!document.title && document.title.includes('ANHAD') && !!document.getElementById('app') && typeof window.navigateTo === 'function'`,
          { timeoutMs: 15000 }
        );
        if (!shellReady) {
          const title = await evalRT('document.title').catch(() => '(eval failed)');
          const url = await evalRT('location.href').catch(() => '(eval failed)');
          ws.close();
          return resolve({ checks: [{ name: 'sanityGate', status: 'BLOCKED', reason: `App shell not ready within 15s (last observed: title="${title}", url="${url}").` }], consoleMessages });
        }
        checks.push({ name: 'sanityGate', status: 'PASSED' });

        // --- Check 1: app shell loads ---
        const shell = await evalRT(`({
          appContainer: !!document.getElementById('app'),
          header: !!document.querySelector('.header'),
          tabBar: !!(document.getElementById('mainNav') || document.querySelector('.tab-bar'))
        })`);
        checks.push({
          name: 'appShellLoads',
          status: (shell.appContainer && shell.header && shell.tabBar) ? 'PASSED' : 'FAILED',
          reason: (shell.appContainer && shell.header && shell.tabBar) ? null : `detail: ${JSON.stringify(shell)}`
        });

        // --- Check 2: hero cards present ---
        // Checks presence, not an exact count — the real count (4, found by
        // running this) isn't what this smoke check exists to pin down, and
        // hard-coding a guessed number just makes the check brittle against
        // legitimate future changes to how many hero cards Home shows.
        const heroCount = await evalRT(`document.querySelectorAll('.hero-card').length`);
        checks.push({ name: 'heroCardsPresent', status: heroCount > 0 ? 'PASSED' : 'FAILED', reason: heroCount > 0 ? null : 'found 0 .hero-card elements' });

        // --- Check 3: AnhadAudio singleton genuinely re-guards against double-init ---
        await evalRT(`window.AnhadAudioLoadEngine && window.AnhadAudioLoadEngine();`);
        const audioReady = await pollFor(`window.AnhadAudio && window.AnhadAudio._singleton === true`, { timeoutMs: 8000 });
        if (!audioReady) {
          checks.push({ name: 'anhadAudioSingletonExists', status: 'FAILED', reason: 'window.AnhadAudio not present/singleton-flagged 8s after triggering load' });
        } else {
          checks.push({ name: 'anhadAudioSingletonExists', status: 'PASSED' });

          const marker = 'verify_' + Date.now();
          await evalRT(`window.AnhadAudio.__verifyMarker = ${JSON.stringify(marker)};`);
          // Re-injecting via a fresh <script src> tag proved flaky across
          // identical runs (found by running this repeatedly) — most likely
          // racing with the page's own AnhadAudioLoadEngine() demand-loading
          // mechanism, which can create its own concurrent script-tag loads.
          // Fetch the source as text and eval() it directly instead: fully
          // synchronous from the page's point of view, no network-load race.
          const stillSame = await evalRT(`
            fetch('lib/anhad-audio-singleton.js?v=smoke-check')
              .then(r => r.text())
              .then(src => {
                (0, eval)(src); // indirect eval -> executes in global scope, same as a <script> tag
                return !!(window.AnhadAudio && window.AnhadAudio.__verifyMarker === ${JSON.stringify(marker)}
                   && window.AnhadAudio._singleton === true && typeof window.AnhadAudio.play === 'function');
              })
          `, true);
          checks.push({ name: 'anhadAudioIsSingleton', status: stillSame ? 'PASSED' : 'FAILED', reason: stillSame ? null : 're-executing the script replaced window.AnhadAudio instead of the double-init guard short-circuiting' });
        }

        // --- Check 4 & 5: nav click doesn't force a reload; mini-player persists ---
        const gmpReady = await pollFor(`!!document.getElementById('gmp')`, { timeoutMs: 5000 });
        if (!gmpReady) {
          checks.push({ name: 'miniPlayerPersistsAcrossNav', status: 'FAILED', reason: '#gmp never appeared' });
          checks.push({ name: 'navLinkNoFullReload', status: 'BLOCKED', reason: 'skipped — mini-player precondition failed' });
        } else {
          const navMarker = 'nav_' + Date.now();
          await evalRT(`document.getElementById('gmp').dataset.smokeTag = ${JSON.stringify(navMarker)};`);
          await evalRT(`window.__anhadNavVerifyMarker = ${JSON.stringify(navMarker)};`);

          const clicked = await evalRT(`
            (function(){
              var link = document.querySelector('a.tab-item[href*="Insights"]') || document.querySelector('a[href*="Insights/insights.html"]');
              if (!link) return false;
              link.click();
              return true;
            })()
          `);

          if (!clicked) {
            checks.push({ name: 'navLinkNoFullReload', status: 'BLOCKED', reason: 'no Insights nav link found in the DOM to click' });
            checks.push({ name: 'miniPlayerPersistsAcrossNav', status: 'BLOCKED', reason: 'skipped — nav click precondition failed' });
          } else {
            const navigated = await pollFor(`location.pathname.toLowerCase().includes('insights')`, { timeoutMs: 8000 });
            const markerSurvived = await evalRT(`window.__anhadNavVerifyMarker === ${JSON.stringify(navMarker)}`).catch(() => false);
            // Root-caused by running this (see diagnostic trace): Insights/insights.html
            // has no id="app" element, so smooth-navigation.js's applyNewContent()
            // structure-mismatch fallback (window.location.href = url) fires on
            // every single navigation into it, defeating the SPA swap entirely —
            // not a click-handling or timing issue in this check itself.
            checks.push({
              name: 'navLinkNoFullReload',
              status: (navigated && markerSurvived) ? 'PASSED' : 'FAILED',
              reason: (navigated && markerSurvived) ? null :
                `navigated=${navigated}, markerSurvived=${markerSurvived} — likely cause: destination page has no id="app" container, so smooth-navigation.js falls back to a full reload (window.navigateTo itself does this, confirmed independent of click handling)`
            });

            const gmpMarkerSurvived = await evalRT(`
              (function(){ var el = document.getElementById('gmp'); return !!el && el.dataset.smokeTag === ${JSON.stringify(navMarker)}; })()
            `).catch(() => false);
            checks.push({
              name: 'miniPlayerPersistsAcrossNav',
              status: gmpMarkerSurvived ? 'PASSED' : 'FAILED',
              reason: gmpMarkerSurvived ? null : '#gmp was recreated (or removed) by the navigation instead of persisting'
            });
          }
        }

        // --- Fix 2 verification: Favorites SW/PWAManager re-init guard ---
        // Required flows: Home->Favorites->Back->Home; Favorites->Home->Favorites;
        // Home->Favorites repeated x5. Must confirm: no full reload, no
        // controllerchange-triggered reload, mini-player persists, global state
        // persists, SW remains functional, exactly one PWAManager instance,
        // no duplicate listeners. Reported honestly either way — the guard is
        // real defense-in-depth but the investigation that produced it found
        // the originally-suspected re-execution mechanism was already
        // structurally blocked, so a still-occurring reload here would mean
        // the real cause is something else (e.g. _safeReload's own version-
        // poll/controllerchange cycle), not that the guard failed.
        await pollFor(`typeof window.navigateTo === 'function'`, { timeoutMs: 10000 });
        await evalRT(`window.navigateTo && window.navigateTo('/index.html')`, true);
        await pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, { timeoutMs: 8000 });
        const pwaGuardPresent = await evalRT(`window.__anhadPWAManagerInit === true && !!window.pwaManager`).catch(() => false);

        if (!pwaGuardPresent) {
          checks.push({ name: 'pwaManagerGuardActive', status: 'BLOCKED', reason: 'window.__anhadPWAManagerInit / window.pwaManager not present on Home — cannot run Favorites SW guard checks (expected in Capacitor-detected contexts, which skip SW registration entirely)' });
        } else {
          checks.push({ name: 'pwaManagerGuardActive', status: 'PASSED' });

          const instanceMarker = 'pwa_instance_' + Date.now();
          const globalStateMarker = 'global_state_' + Date.now();
          const gmpReady0 = await pollFor(`!!document.getElementById('gmp')`, { timeoutMs: 5000 });
          // pwa-register.js registers its 'appinstalled' listener only AFTER
          // `await navigator.serviceWorker.register(...)` resolves — racy to
          // snapshot the "before" count until that settles, or this measures
          // the tail of initial-page-load async setup instead of real
          // per-navigation-cycle growth. Wait for the registration this
          // PWAManager instance itself is holding, not just any SW state.
          await pollFor(`!!(window.pwaManager && window.pwaManager.registration)`, { timeoutMs: 8000 });
          const listenerCountBefore = gmpReady0
            ? await evalRT(`(function(){ var l = (typeof getEventListeners === 'function') ? getEventListeners(window) : null; return l && l.appinstalled ? l.appinstalled.length : null; })()`).catch(() => null)
            : null;
          await evalRT(`
            window.pwaManager.__testInstanceMarker = ${JSON.stringify(instanceMarker)};
            window.__anhadTestGlobalState = ${JSON.stringify(globalStateMarker)};
            window.__anhadReloadCanary = ${JSON.stringify(instanceMarker)};
            window.__anhadControllerChangeFired = false;
            if (navigator.serviceWorker) {
              navigator.serviceWorker.addEventListener('controllerchange', function() { window.__anhadControllerChangeFired = true; });
            }
            var gmp = document.getElementById('gmp');
            if (gmp) gmp.dataset.smokeTagFav = ${JSON.stringify(instanceMarker)};
          `);

          // A fresh profile's first-ever SW registration can trigger exactly
          // one controllerchange -> _safeReload() shortly after — a real,
          // unrelated app behavior, not a bug in this guard (found by running
          // this: window.navigateTo briefly stops existing while the fresh
          // realm's deferred scripts are still loading post-reload). Wait for
          // it rather than letting the whole run crash on a TypeError.
          const waitForNavReady = () => pollFor(`typeof window.navigateTo === 'function'`, { timeoutMs: 10000 });
          const goHome = async () => {
            if (!(await waitForNavReady())) return false;
            await evalRT(`window.navigateTo('/index.html')`, true);
            return pollFor(`(location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')) && document.querySelectorAll('.hero-card').length > 0`, { timeoutMs: 8000 });
          };
          const goFavorites = async () => {
            if (!(await waitForNavReady())) return false;
            await evalRT(`window.navigateTo('Favorites/favorites.html')`, true);
            return pollFor(`location.pathname.toLowerCase().includes('favorites')`, { timeoutMs: 8000 });
          };

          // Flow 1: Home -> Favorites -> Back -> Home
          let flow1Ok = await goFavorites();
          await evalRT(`window.history.back()`);
          flow1Ok = flow1Ok && await pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, { timeoutMs: 8000 });
          checks.push({ name: 'favoritesFlow_HomeFavBackHome', status: flow1Ok ? 'PASSED' : 'FAILED', reason: flow1Ok ? null : 'navigation sequence did not complete within timeout' });

          // Flow 2: Favorites -> Home -> Favorites (currently on Home from flow 1)
          let flow2Ok = await goFavorites();
          flow2Ok = flow2Ok && await goHome();
          flow2Ok = flow2Ok && await goFavorites();
          checks.push({ name: 'favoritesFlow_FavHomeFav', status: flow2Ok ? 'PASSED' : 'FAILED', reason: flow2Ok ? null : 'navigation sequence did not complete within timeout' });

          // Flow 3: Home -> Favorites, repeated 5x (currently on Favorites from flow 2)
          let flow3Ok = await goHome();
          for (let i = 0; i < 5 && flow3Ok; i++) {
            flow3Ok = await goFavorites();
            if (flow3Ok) flow3Ok = await goHome();
          }
          checks.push({ name: 'favoritesFlow_RepeatedX5', status: flow3Ok ? 'PASSED' : 'FAILED', reason: flow3Ok ? null : 'a navigation in the repeated cycle did not complete within timeout' });

          // Flow 4: a REAL click on the actual Favorites tab link (not a
          // programmatic navigateTo() call like flows 1-3) — the pre-existing
          // Insights check above shows clicking a real link can behave
          // differently from calling navigateTo() directly, so this closes
          // that gap for Favorites specifically rather than assuming parity.
          const favLinkClicked = await evalRT(`
            (function(){
              var link = document.querySelector('a.tab-item[href*="Favorites"]') || document.querySelector('a[href*="Favorites/favorites.html"]');
              if (!link) return false;
              link.click();
              return true;
            })()
          `);
          let flow4Ok = false;
          if (favLinkClicked) {
            flow4Ok = await pollFor(`location.pathname.toLowerCase().includes('favorites')`, { timeoutMs: 8000 });
          }
          checks.push({
            name: 'favoritesFlow_RealLinkClick',
            status: !favLinkClicked ? 'BLOCKED' : (flow4Ok ? 'PASSED' : 'FAILED'),
            reason: !favLinkClicked ? 'no Favorites nav link found in the DOM to click' : (flow4Ok ? null : 'clicking the real Favorites link did not navigate within 8s')
          });
          if (flow4Ok) await goHome();

          const post = await evalRT(`
            (function(){
              var listeners = (typeof getEventListeners === 'function') ? getEventListeners(window) : null;
              var gmp = document.getElementById('gmp');
              return {
                noFullReload: window.__anhadReloadCanary === ${JSON.stringify(instanceMarker)},
                globalStatePersisted: window.__anhadTestGlobalState === ${JSON.stringify(globalStateMarker)},
                singlePwaManagerInstance: !!window.pwaManager && window.pwaManager.__testInstanceMarker === ${JSON.stringify(instanceMarker)},
                controllerChangeFired: window.__anhadControllerChangeFired === true,
                appinstalledListenerCount: listeners && listeners.appinstalled ? listeners.appinstalled.length : null,
                miniPlayerPersisted: !!gmp && gmp.dataset.smokeTagFav === ${JSON.stringify(instanceMarker)}
              };
            })()
          `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));

          const swFunctional = await evalRT(`
            navigator.serviceWorker.getRegistration().then(function(r){ return !!r && (r.active !== null || r.installing !== null || r.waiting !== null); })
          `, true).catch(() => false);

          checks.push({ name: 'noFullReloadAcrossFavoritesFlows', status: post.noFullReload ? 'PASSED' : 'FAILED', reason: post.noFullReload ? null : 'in-memory canary was wiped — a real navigation/reload occurred somewhere in the flow sequence' });
          checks.push({
            name: 'noControllerchangeTriggeredReload',
            status: post.noFullReload ? 'PASSED' : 'FAILED',
            reason: post.noFullReload
              ? (post.controllerChangeFired ? 'controllerchange fired during the run but did not cause a reload (cooldown/guard worked as designed)' : null)
              : `reload canary wiped; controllerchange fired=${post.controllerChangeFired} — ${post.controllerChangeFired ? 'consistent with a controllerchange-triggered reload' : 'reload happened via some other path, not controllerchange'}`
          });
          checks.push({ name: 'globalStatePersistsAcrossFavoritesFlows', status: post.globalStatePersisted ? 'PASSED' : 'FAILED', reason: post.globalStatePersisted ? null : 'window-level state marker did not survive the flow sequence' });
          checks.push({ name: 'miniPlayerPersistsAcrossFavoritesFlows', status: post.miniPlayerPersisted ? 'PASSED' : 'FAILED', reason: post.miniPlayerPersisted ? null : '#gmp was recreated (or removed) somewhere in the Favorites flow sequence instead of persisting' });
          checks.push({ name: 'singlePWAManagerInstance', status: post.singlePwaManagerInstance ? 'PASSED' : 'FAILED', reason: post.singlePwaManagerInstance ? null : 'window.pwaManager identity changed — a second PWAManager was constructed during the flow sequence' });
          checks.push({ name: 'serviceWorkerRemainsFunctional', status: swFunctional ? 'PASSED' : 'FAILED', reason: swFunctional ? null : 'navigator.serviceWorker.getRegistration() did not resolve to an active/installing/waiting registration after the flow sequence' });
          // "No duplicate listeners" means repeated navigation doesn't GROW the
          // count — not that the absolute count is <=1. trendora-app.js and
          // pwa-register.js each legitimately register their own independent
          // 'appinstalled' listener (found by running this: 2 at steady state,
          // confirmed unrelated to PWAManager re-construction), so an absolute
          // ceiling of 1 was the wrong bar. Growth across the flow sequence is
          // what Fix 2 actually needs to prevent.
          checks.push({
            name: 'noDuplicateListenerGrowth',
            status: (post.appinstalledListenerCount == null || listenerCountBefore == null) ? 'BLOCKED' : (post.appinstalledListenerCount <= listenerCountBefore ? 'PASSED' : 'FAILED'),
            reason: (post.appinstalledListenerCount == null || listenerCountBefore == null)
              ? 'getEventListeners() unavailable in this CDP eval context'
              : (post.appinstalledListenerCount <= listenerCountBefore ? `steady at ${post.appinstalledListenerCount} 'appinstalled' listener(s) before and after the flow sequence` : `'appinstalled' listener count grew from ${listenerCountBefore} to ${post.appinstalledListenerCount} across the flow sequence`)
          });
        }

        // --- Diagnostic (informational, not pass/fail): did any fallback-to-
        // full-reload log line fire during this entire run? Answers "why" for
        // navLinkNoFullReload / the Favorites flows from real console output
        // rather than from reading the source.
        const fallbackSignals = consoleMessages.filter((m) =>
          m.includes('Target structure mismatch') || m.includes('SPA swap failed, falling back'));
        checks.push({
          name: 'fallbackToFullReloadDiagnostic',
          status: 'PASSED',
          reason: fallbackSignals.length ? `observed ${fallbackSignals.length} fallback log line(s): ${JSON.stringify(fallbackSignals.slice(0, 5))}` : 'no structure-mismatch or fetch-failure fallback logged during this run'
        });

        ws.close();
        resolve({ checks, consoleMessages });
      } catch (err) {
        ws.close();
        reject(err);
      }
    });
  });
}

function computeOverallStatus(checks) {
  if (checks.some((c) => c.status === 'FAILED')) {
    return 'FAILED: ' + checks.filter((c) => c.status === 'FAILED').map((c) => c.name).join(', ');
  }
  if (checks.some((c) => c.status === 'BLOCKED')) {
    return 'BLOCKED: ' + checks.filter((c) => c.status === 'BLOCKED').map((c) => c.name).join(', ');
  }
  return 'PASSED';
}

async function main() {
  console.log('\n=== ANHAD Runtime Smoke Check ===\n');

  let serverProc = null;
  let chromeProc = null;

  try {
    serverProc = await ensureServerRunning();
    chromeProc = launchChrome();
    const wsUrl = await getCDPPageWebSocketUrl();
    const { checks, consoleMessages } = await runChecks(wsUrl);
    const overallStatus = computeOverallStatus(checks);

    checks.forEach((c) => {
      console.log(`  ${c.status === 'PASSED' ? 'PASS' : c.status}  ${c.name}${c.reason ? ' — ' + c.reason : ''}`);
    });
    console.log('\nOverall:', overallStatus);

    const report = {
      suite: 'ANHAD Runtime Smoke Check',
      timestamp: new Date().toISOString(),
      checks,
      overallStatus,
      consoleMessageCount: consoleMessages.length
    };
    fs.writeFileSync(path.join(__dirname, '../anhad-smoke-check-report.json'), JSON.stringify(report, null, 2));
    console.log('\nReport saved to anhad-smoke-check-report.json\n');
  } catch (err) {
    console.error('Smoke check error:', err);
    fs.writeFileSync(path.join(__dirname, '../anhad-smoke-check-report.json'), JSON.stringify({
      suite: 'ANHAD Runtime Smoke Check',
      timestamp: new Date().toISOString(),
      overallStatus: 'FAILED: script error - ' + (err && err.message ? err.message : String(err))
    }, null, 2));
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill();
    process.exit(0);
  }
}

main();
