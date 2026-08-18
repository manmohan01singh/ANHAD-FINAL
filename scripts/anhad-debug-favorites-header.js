/**
 * Isolated repro for the reported Favorites header overlap: back button
 * covering the "FA" of "Favorites" title text.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9229;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-fav-header-debug-'));
  return spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${userDataDir}`, '--remote-allow-origins=*', `http://localhost:${PORT}/Favorites/favorites.html`
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

  function evalRT(expression) {
    return new Promise((res, rej) => {
      const evalId = id++;
      callbacks.set(evalId, (msg) => {
        callbacks.delete(evalId);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else if (msg.result && msg.result.exceptionDetails) rej(new Error(JSON.stringify(msg.result.exceptionDetails)));
        else res(msg.result ? msg.result.result.value : undefined);
      });
      ws.send(JSON.stringify({ id: evalId, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
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
    if (msg.id && callbacks.has(msg.id)) callbacks.get(msg.id)(msg);
  });

  await new Promise((r) => ws.on('open', r));
  ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));

  // Match the viewport shown in the user's screenshot (~390px wide phone).
  await new Promise((res) => {
    const cdpId = id++;
    callbacks.set(cdpId, () => res());
    ws.send(JSON.stringify({
      id: cdpId, method: 'Emulation.setDeviceMetricsOverride',
      params: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    }));
  });

  await pollFor(`!!document.querySelector('.header__title')`, 15000);
  await new Promise((r) => setTimeout(r, 500));

  const measurements = await evalRT(`
    (function(){
      var header = document.querySelector('.header');
      var back = document.querySelector('.header__back');
      var title = document.querySelector('.header__title');
      var hRect = header ? header.getBoundingClientRect() : null;
      var bRect = back ? back.getBoundingClientRect() : null;
      var tRect = title ? title.getBoundingClientRect() : null;
      return {
        headerRect: hRect ? { x: hRect.x, width: hRect.width } : null,
        backRect: bRect ? { x: bRect.x, width: bRect.width, right: bRect.right } : null,
        titleRect: tRect ? { x: tRect.x, width: tRect.width, left: tRect.left } : null,
        titleText: title ? title.textContent : null,
        overlap: (bRect && tRect) ? (bRect.right > tRect.left) : null,
        headerComputedStyle: header ? {
          display: getComputedStyle(header).display,
          justifyContent: getComputedStyle(header).justifyContent,
          padding: getComputedStyle(header).padding,
          maxWidth: getComputedStyle(header).maxWidth,
          width: getComputedStyle(header).width
        } : null,
        titleComputedStyle: title ? {
          marginLeft: getComputedStyle(title).marginLeft,
          paddingLeft: getComputedStyle(title).paddingLeft,
          fontSize: getComputedStyle(title).fontSize
        } : null,
        bodyWidth: document.body.getBoundingClientRect().width,
        appWidth: document.querySelector('.app') ? document.querySelector('.app').getBoundingClientRect().width : null
      };
    })()
  `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));

  console.log(JSON.stringify(measurements, null, 2));

  const data = await new Promise((res, rej) => {
    const cdpId = id++;
    callbacks.set(cdpId, (msg) => {
      if (msg.error) rej(new Error(JSON.stringify(msg.error)));
      else res(msg.result.data);
    });
    ws.send(JSON.stringify({ id: cdpId, method: 'Page.captureScreenshot', params: { format: 'png', clip: { x: 0, y: 0, width: 390, height: 200, scale: 1 } } }));
  });
  fs.writeFileSync(path.join(__dirname, '../fav-header-debug.png'), Buffer.from(data, 'base64'));
  console.log('Screenshot saved: fav-header-debug.png');

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
