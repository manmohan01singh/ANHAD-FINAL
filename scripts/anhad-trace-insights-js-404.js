/**
 * Traces the initiator of the recurring insights.js 404 seen during
 * verification, using Network.requestWillBeSent's initiator field.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9230;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-insights404-'));
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${userDataDir}`, '--remote-allow-origins=*', 'about:blank'
  ], { stdio: 'ignore' });
}
async function ensureServerRunning() {
  try { const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(3000) }); if (res.ok) return null; } catch (e) {}
  const proc = spawn(process.execPath, [path.join(__dirname, '../backend/server.js')], { stdio: 'ignore' });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try { const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(1000) }); if (res.ok) return proc; } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill(); throw new Error('server did not become healthy');
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

const INNERHTML_TRACE_SCRIPT = `
(function() {
  var proto = Element.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'innerHTML');
  window.__innerHTMLTrace = [];
  Object.defineProperty(proto, 'innerHTML', {
    set: function(value) {
      if (typeof value === 'string' && value.indexOf('insights.js') !== -1) {
        window.__innerHTMLTrace.push({
          tag: this.tagName, id: this.id, className: this.className,
          href: location.href, stack: (new Error()).stack,
          snippet: value.substring(Math.max(0, value.indexOf('insights.js') - 80), value.indexOf('insights.js') + 20)
        });
      }
      return desc.set.call(this, value);
    },
    get: desc.get,
    configurable: true
  });
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
    const requestInfo = new Map();
    function evalRT(expression, awaitPromise = false) {
      return new Promise((res, rej) => {
        const evalId = id++;
        callbacks.set(evalId, (msg) => {
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
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id && callbacks.has(msg.id)) { const cb = callbacks.get(msg.id); callbacks.delete(msg.id); cb(msg); return; }
      if (msg.method === 'Network.requestWillBeSent') {
        requestInfo.set(msg.params.requestId, { url: msg.params.request.url, initiator: msg.params.initiator, documentURL: msg.params.documentURL, type: msg.params.type });
      }
      if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
        const info = requestInfo.get(msg.params.requestId);
        if (msg.params.response.url.includes('insights.js') || (info && info.url.includes('insights.js'))) {
          console.log('\n>>> insights.js 404 detected:');
          console.log('  url:', msg.params.response.url);
          console.log('  status:', msg.params.response.status);
          console.log('  documentURL at request time:', info && info.documentURL);
          console.log('  resourceType:', info && info.type);
          console.log('  initiator:', JSON.stringify(info && info.initiator, null, 2));
        }
      }
    });
    await new Promise((r) => ws.on('open', r));
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Runtime.enable' })); });
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.enable' })); });
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Network.enable' })); });
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.addScriptToEvaluateOnNewDocument', params: { source: INNERHTML_TRACE_SCRIPT } })); });

    // Reproduce anhad-verify-spa-parity-fix.js's scenario A0 exactly:
    // session starts on Insights (hard load twice, matching the flag-priming
    // pattern), not Home.
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/Insights/insights.html` } })); });
    await pollFor(`!!document.title`, 10000);
    await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
    await new Promise((res) => { const cbId = id++; callbacks.set(cbId, () => res()); ws.send(JSON.stringify({ id: cbId, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/Insights/insights.html` } })); });
    await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);
    console.log('Insights loaded (hard, twice). Now looping SPA Insights<->Home to catch the race...');

    for (let i = 1; i <= 8; i++) {
      await evalRT(`window.navigateTo('/index.html')`, true);
      await pollFor(`document.querySelectorAll('.hero-card').length > 0`, 10000);
      await pollFor(`typeof window.navigateTo === 'function'`, 5000);
      await evalRT(`window.navigateTo('/Insights/insights.html')`, true);
      await pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);
      console.log(`  cycle ${i} done`);
    }
    await new Promise(r => setTimeout(r, 1000));

    const trace = await evalRT(`window.__innerHTMLTrace`);
    if (trace && trace.length) {
      console.log(`\n>>> Caught ${trace.length} innerHTML assignment(s) referencing insights.js:`);
      trace.forEach((t, i) => {
        console.log(`\n--- #${i} ---`);
        console.log('target element:', t.tag, t.id, t.className);
        console.log('document href at assignment time:', t.href);
        console.log('snippet:', t.snippet);
        console.log('stack:', t.stack);
      });
    } else {
      console.log('\nNo innerHTML assignment referencing insights.js was caught across 8 cycles.');
    }
    console.log('Done watching.');

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
