/**
 * Minimal, isolated repro for the Gurbani Radio card click investigation —
 * no accumulated state from other flows, just: load Home, inspect
 * heroCard1's actual structure, click its non-button area, watch exactly
 * what happens.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9227;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-debug-'));
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${userDataDir}`, '--remote-allow-origins=*', `http://localhost:${PORT}/index.html`
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
  const consoleMessages = [];
  const exceptions = [];

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
    if (msg.id && callbacks.has(msg.id)) { callbacks.get(msg.id)(msg); return; }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = (msg.params.args || []).map((a) => (a.value !== undefined ? String(a.value) : (a.description || a.type))).join(' ');
      consoleMessages.push(text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails);
    }
  });

  await new Promise((r) => ws.on('open', r));
  ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));

  await pollFor(`!!document.title`);
  await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
  ws.send(JSON.stringify({ id: id++, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/index.html` } }));
  await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function' && document.querySelectorAll('.hero-card').length > 0`, 15000);
  await new Promise((r) => setTimeout(r, 1000));

  // Inspect heroCard1's actual structure
  const structure = await evalRT(`
    (function(){
      var card = document.getElementById('heroCard1');
      if (!card) return { found: false };
      var titleEl = card.querySelector('.hero-card__title');
      return {
        found: true,
        cardTag: card.tagName,
        cardClasses: card.className,
        hasTitleEl: !!titleEl,
        titleElTag: titleEl ? titleEl.tagName : null,
        titleElText: titleEl ? titleEl.textContent : null,
        innerHTML_first500: card.innerHTML.slice(0, 500)
      };
    })()
  `);
  console.log('=== heroCard1 structure ===');
  console.log(JSON.stringify(structure, null, 2));

  consoleMessages.length = 0;
  exceptions.length = 0;
  const urlBefore = await evalRT(`location.href`);
  console.log('\n=== URL before click:', urlBefore, '===');

  const clickResult = await evalRT(`
    (function(){
      var card = document.getElementById('heroCard1');
      var target = card.querySelector('.hero-card__title') || card;
      target.click();
      return { targetTag: target.tagName, targetClass: target.className };
    })()
  `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
  console.log('=== click result ===');
  console.log(JSON.stringify(clickResult, null, 2));

  await new Promise((r) => setTimeout(r, 2000));
  const urlAfter = await evalRT(`location.href`).catch((e) => 'EVAL_FAILED: ' + String(e && e.message ? e.message : e));
  console.log('\n=== URL 2s after click:', urlAfter, '===');
  console.log('\n=== console messages during click ===');
  console.log(JSON.stringify(consoleMessages, null, 2));
  console.log('\n=== exceptions during click ===');
  console.log(JSON.stringify(exceptions, null, 2));

  // Wait longer and check again in case navigation is just slow
  await new Promise((r) => setTimeout(r, 5000));
  const urlAfter2 = await evalRT(`location.href`).catch((e) => 'EVAL_FAILED: ' + String(e && e.message ? e.message : e));
  console.log('\n=== URL 7s after click:', urlAfter2, '===');

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
