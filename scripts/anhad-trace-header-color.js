/**
 * Traces exactly which CSS rule wins `color` on Favorites' .header__title
 * when reached via SPA nav from Home, using CSS.getMatchedStylesForNode
 * (the real cascade, not a guess from reading source).
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9229;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-csstrace-'));
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
    function send(method, params = {}) {
      return new Promise((res) => { const cbId = id++; callbacks.set(cbId, (msg) => res(msg.result)); ws.send(JSON.stringify({ id: cbId, method, params })); });
    }
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
    ws.on('message', (data) => { const msg = JSON.parse(data); if (msg.id && callbacks.has(msg.id)) { const cb = callbacks.get(msg.id); callbacks.delete(msg.id); cb(msg); } });
    await new Promise((r) => ws.on('open', r));
    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');
    await send('CSS.enable');

    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await pollFor(`!!document.title`, 10000);
    await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function'`, 15000);

    await evalRT(`window.navigateTo('/Favorites/favorites.html')`, true);
    await pollFor(`location.pathname.toLowerCase().includes('favorites')`, 8000);
    await pollFor(`!!document.querySelector('.header__title')`, 5000);
    await new Promise(r => setTimeout(r, 300));

    // Report html/body attributes and inline styles that could carry state across the swap
    const carryState = await evalRT(`({
      htmlAttrs: Array.from(document.documentElement.attributes).map(a => a.name + '=' + a.value),
      htmlInlineStyle: document.documentElement.getAttribute('style'),
      bodyClass: document.body.className,
      bodyInlineStyle: document.body.getAttribute('style')
    })`);
    console.log('Carry-over state on <html>/<body> after SPA nav to Favorites:');
    console.log(JSON.stringify(carryState, null, 2));

    // Get the actual node and its matched styles for color
    const doc = await send('DOM.getDocument', { depth: -1, pierce: true });
    const nodeIdResult = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.header__title' });
    const nodeId = nodeIdResult.nodeId;
    const matched = await send('CSS.getMatchedStylesForNode', { nodeId });

    console.log('\n=== Matched CSS rules for .header__title (in cascade order, later = higher priority if equal specificity) ===');
    (matched.matchedCSSRules || []).forEach((m) => {
      const rule = m.rule;
      const props = (rule.style.cssText || '').includes('color') ? rule.style.cssText : null;
      const sel = (rule.selectorList.selectors || []).map(s => s.text).join(', ');
      const origin = rule.origin;
      const sheetId = rule.styleSheetId;
      console.log(`  [${origin}] ${sel}  =>  ${rule.style.cssProperties.filter(p => p.name === 'color').map(p => p.name + ':' + p.value).join(' ') || '(no color prop)'}`);
    });

    console.log('\n=== Inherited entries ===');
    (matched.inherited || []).forEach((inh, i) => {
      (inh.matchedCSSRules || []).forEach((m) => {
        const rule = m.rule;
        const colorProp = rule.style.cssProperties.filter(p => p.name === 'color' || p.name.startsWith('--'));
        if (colorProp.length) {
          const sel = (rule.selectorList.selectors || []).map(s => s.text).join(', ');
          console.log(`  [inherited level ${i}] [${rule.origin}] ${sel}  =>  ${colorProp.map(p => p.name + ':' + p.value).join(' ')}`);
        }
      });
    });

    const computedColor = await evalRT(`getComputedStyle(document.querySelector('.header__title')).color`);
    const cssVarTextPrimary = await evalRT(`getComputedStyle(document.querySelector('.header__title')).getPropertyValue('--text-primary')`);
    console.log('\ncomputed color:', computedColor);
    console.log('computed --text-primary on element:', cssVarTextPrimary);
    const rootVar = await evalRT(`getComputedStyle(document.documentElement).getPropertyValue('--text-primary')`);
    console.log('computed --text-primary on <html>:', rootVar);

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
