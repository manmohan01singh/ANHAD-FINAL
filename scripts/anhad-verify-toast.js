/**
 * Real-click verification of the new hero-card quick-play confirmation toast.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9231;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-toast-'));
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${userDataDir}`, '--remote-allow-origins=*', 'about:blank'
  ], { stdio: 'ignore' });
}
async function ensureServerRunning() {
  try { const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(3000) }); if (res.ok) return null; } catch (e) {}
  const proc = spawn(process.execPath, [path.join(__dirname, '../../../backend/server.js')], { stdio: 'ignore' });
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
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else if (msg.result && msg.result.exceptionDetails) rej(new Error(JSON.stringify(msg.result.exceptionDetails)));
          else res(msg.result ? msg.result.result.value : undefined);
        });
        ws.send(JSON.stringify({ id: evalId, method: 'Runtime.evaluate', params: { expression, awaitPromise, returnByValue: true, includeCommandLineAPI: true } }));
      });
    }
    function send(method, params = {}) {
      return new Promise((res) => { const cbId = id++; callbacks.set(cbId, (msg) => res(msg.result)); ws.send(JSON.stringify({ id: cbId, method, params })); });
    }
    async function pollFor(expression, timeoutMs = 15000) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) { try { if (await evalRT(expression)) return true; } catch (e) {} await new Promise((r) => setTimeout(r, 200)); }
      return false;
    }
    ws.on('message', (data) => { const msg = JSON.parse(data); if (msg.id && callbacks.has(msg.id)) { const cb = callbacks.get(msg.id); callbacks.delete(msg.id); cb(msg); } });
    await new Promise((r) => ws.on('open', r));
    await send('Runtime.enable');
    await send('Page.enable');

    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await pollFor(`!!document.title`, 10000);
    await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await pollFor(`!!document.getElementById('app')`, 15000);
    const btnsAppeared = await pollFor(`document.querySelectorAll('.hero-card__play-btn').length > 0`, 10000);
    console.log('hero play buttons appeared within timeout:', btnsAppeared);
    await new Promise(r => setTimeout(r, 500));

    const diag = await evalRT(`(function(){
      var btns = document.querySelectorAll('.hero-card__play-btn');
      return {
        count: btns.length,
        first: btns[0] ? { id: btns[0].id, stream: btns[0].dataset.stream, display: getComputedStyle(btns[0]).display, visibility: getComputedStyle(btns[0]).visibility, connected: btns[0].isConnected } : null,
        innerWidth: window.innerWidth,
        typeofInitHero: typeof initHeroInteractions,
        typeofShowToast: typeof showHeroQuickPlayToast
      };
    })()`);
    console.log('Diagnostic:', JSON.stringify(diag, null, 2));

    console.log('Test 1: clicking hero play button...');
    const clickResult = await evalRT(`(function(){
      var btn = document.querySelector('.hero-card__play-btn');
      if (!btn) return { found: false };
      var stream = btn.dataset.stream;
      btn.click();
      return { found: true, stream: stream };
    })()`);
    console.log('  click result:', JSON.stringify(clickResult));

    await new Promise(r => setTimeout(r, 200));
    const toastAfterClick = await evalRT(`(function(){
      var toasts = Array.from(document.body.children).filter(function(el){
        return el.tagName === 'DIV' && el.style.position === 'fixed' && el.textContent.includes('Playing');
      });
      return toasts.map(function(t){ return { text: t.textContent, opacity: t.style.opacity }; });
    })()`);
    console.log('  toast state right after click:', JSON.stringify(toastAfterClick));

    await new Promise(r => setTimeout(r, 400));
    const toastAfterFadeIn = await evalRT(`(function(){
      var toasts = Array.from(document.body.children).filter(function(el){
        return el.tagName === 'DIV' && el.style.position === 'fixed' && el.textContent.includes('Playing');
      });
      return toasts.map(function(t){ return { text: t.textContent, opacity: getComputedStyle(t).opacity }; });
    })()`);
    console.log('  toast state after fade-in (should show opacity 1, correct stream name):', JSON.stringify(toastAfterFadeIn));

    console.log('\nWaiting for toast to auto-remove (~2.2s)...');
    await new Promise(r => setTimeout(r, 2200));
    const toastAfterTimeout = await evalRT(`(function(){
      var toasts = Array.from(document.body.children).filter(function(el){
        return el.tagName === 'DIV' && el.style.position === 'fixed' && el.textContent.includes('Playing');
      });
      return toasts.length;
    })()`);
    console.log('  toast elements remaining after timeout (should be 0):', toastAfterTimeout);

    console.log('\nTest 2: clicking LIVE badge (different code path — jump-to-live branch)...');
    const badgeClickResult = await evalRT(`(function(){
      var badge = document.querySelector('.hero-card__badge--live, .hero-card__badge--dlive');
      if (!badge) return { found: false };
      var card = badge.closest('.hero-card');
      badge.click();
      return { found: true, stream: card ? card.dataset.stream : null };
    })()`);
    console.log('  badge click result:', JSON.stringify(badgeClickResult));
    await new Promise(r => setTimeout(r, 200));
    const toastAfterBadgeClick = await evalRT(`(function(){
      var toasts = Array.from(document.body.children).filter(function(el){
        return el.tagName === 'DIV' && el.style.position === 'fixed' && (el.textContent.includes('Playing') || el.textContent.includes('Jumped'));
      });
      return toasts.map(function(t){ return { text: t.textContent, opacity: t.style.opacity }; });
    })()`);
    console.log('  toast state after badge click:', JSON.stringify(toastAfterBadgeClick));

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
