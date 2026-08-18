/**
 * Focused follow-up to anhad-verify-spa-parity-fix.js's D2 finding: pagehide
 * listener count grew 13->14 across 6 Home<->Insights cycles. Captures a
 * stack trace on every window.addEventListener('pagehide', ...) call so the
 * exact +1 registration site can be identified instead of guessed at.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9228;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-trace-'));
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
    try { const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(1000) }); if (res.ok) return proc; } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error('server did not become healthy');
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
  throw new Error('no page target');
}

const INSTRUMENTATION = `
(function() {
  if (window.__pagehideTrace) return;
  window.__pagehideTrace = [];
  var orig = window.addEventListener.bind(window);
  window.addEventListener = function(type) {
    if (type === 'pagehide') {
      window.__pagehideTrace.push({ stack: (new Error()).stack, href: location.href, t: performance.now() });
    }
    return orig.apply(window, arguments);
  };
})();
`;

async function main() {
  let serverProc = null, chromeProc = null;
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
        ws.send(JSON.stringify({ id: evalId, method: 'Runtime.evaluate', params: { expression, awaitPromise, returnByValue: true, includeCommandLineAPI: true } }));
      });
    }
    async function pollFor(expression, timeoutMs = 15000) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) { try { if (await evalRT(expression)) return true; } catch (e) {} await new Promise((r) => setTimeout(r, 200)); }
      return false;
    }
    const waitForNavReady = () => pollFor(`typeof window.navigateTo === 'function'`, 10000);
    ws.on('message', (data) => { const msg = JSON.parse(data); if (msg.id && callbacks.has(msg.id)) callbacks.get(msg.id)(msg); });
    await new Promise((r) => ws.on('open', r));
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Runtime.enable' })); });
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.enable' })); });
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.addScriptToEvaluateOnNewDocument', params: { source: INSTRUMENTATION } })); });

    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/Insights/insights.html` } })); });
    await pollFor(`!!document.title`, 10000);
    await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/Insights/insights.html` } })); });
    await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);

    await waitForNavReady();
    await evalRT(`window.navigateTo('/index.html')`, true);
    await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 10000);
    await new Promise((r) => setTimeout(r, 800));

    const before = await evalRT(`window.__pagehideTrace.length`);
    console.log('pagehide registrations before loop:', before);

    for (let cycle = 1; cycle <= 6; cycle++) {
      const countBeforeThisCycle = await evalRT(`window.__pagehideTrace.length`);
      await waitForNavReady();
      await evalRT(`window.navigateTo('/Insights/insights.html')`, true);
      await pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);
      await waitForNavReady();
      await evalRT(`window.navigateTo('/index.html')`, true);
      await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 8000);
      await new Promise((r) => setTimeout(r, 300));
      const countAfterThisCycle = await evalRT(`window.__pagehideTrace.length`);
      if (countAfterThisCycle > countBeforeThisCycle) {
        console.log(`\n>>> Growth detected during cycle ${cycle}: ${countBeforeThisCycle} -> ${countAfterThisCycle}`);
        const newEntries = await evalRT(`window.__pagehideTrace.slice(${countBeforeThisCycle})`);
        newEntries.forEach((e, i) => {
          console.log(`\n--- New pagehide registration #${i} (cycle ${cycle}) ---`);
          console.log('href:', e.href);
          console.log('stack:', e.stack);
        });
      } else {
        console.log(`cycle ${cycle}: no growth (${countBeforeThisCycle} -> ${countAfterThisCycle})`);
      }
    }

    const after = await evalRT(`window.__pagehideTrace.length`);
    console.log('\npagehide registrations after loop:', after);
    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill();
    process.exit(0);
  }
}
main();
