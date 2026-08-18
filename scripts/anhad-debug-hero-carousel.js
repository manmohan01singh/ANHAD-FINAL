/**
 * Isolated repro for the reported "blank hero carousel area after
 * navigating away from Home and back" — checks actual DOM structure,
 * computed styles, and image load state, not just navigation success.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DEBUG_PORT = 9228;

function launchChrome() {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anhad-hero-debug-'));
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
    if (msg.id && callbacks.has(msg.id)) callbacks.get(msg.id)(msg);
  });

  await new Promise((r) => ws.on('open', r));
  ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: id++, method: 'Page.enable' }));

  // Match the narrow mobile viewport the user's screenshots show.
  await new Promise((res) => {
    const cdpId = id++;
    callbacks.set(cdpId, () => res());
    ws.send(JSON.stringify({
      id: cdpId, method: 'Emulation.setDeviceMetricsOverride',
      params: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    }));
  });

  async function screenshot(label) {
    const data = await new Promise((res, rej) => {
      const cdpId = id++;
      callbacks.set(cdpId, (msg) => {
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result.data);
      });
      ws.send(JSON.stringify({ id: cdpId, method: 'Page.captureScreenshot', params: { format: 'png' } }));
    });
    const outPath = path.join(__dirname, `../hero-debug-${label}.png`);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log(`Screenshot saved: ${outPath}`);
  }

  await pollFor(`!!document.title`);
  await evalRT(`sessionStorage.setItem('anhad_welcomed','1'); localStorage.setItem('anhad_welcome_seen','true'); localStorage.setItem('anhad_session_active_ts', Date.now().toString());`);
  ws.send(JSON.stringify({ id: id++, method: 'Page.navigate', params: { url: `http://localhost:${PORT}/index.html` } }));
  await pollFor(`!!document.getElementById('app') && typeof window.navigateTo === 'function' && document.querySelectorAll('.hero-card').length > 0`, 15000);
  await new Promise((r) => setTimeout(r, 1500));

  async function inspectHeroCarousel(label) {
    const info = await evalRT(`
      (function(){
        var carousel = document.querySelector('.hero-carousel') || document.querySelector('.hero-carousel__track');
        var cards = document.querySelectorAll('.hero-card');
        var firstCard = cards[0];
        var cardRect = firstCard ? firstCard.getBoundingClientRect() : null;
        var carouselRect = carousel ? carousel.getBoundingClientRect() : null;
        var img = firstCard ? firstCard.querySelector('img.hero-card__image') : null;
        return {
          carouselFound: !!carousel,
          carouselRect: carouselRect ? { w: carouselRect.width, h: carouselRect.height } : null,
          cardCount: cards.length,
          firstCardRect: cardRect ? { w: cardRect.width, h: cardRect.height, top: cardRect.top } : null,
          firstCardVisible: cardRect ? (cardRect.width > 0 && cardRect.height > 0) : false,
          imgFound: !!img,
          imgSrc: img ? img.currentSrc || img.src : null,
          imgComplete: img ? img.complete : null,
          imgNaturalWidth: img ? img.naturalWidth : null,
          imgDisplay: img ? getComputedStyle(img).display : null,
          carouselDisplay: carousel ? getComputedStyle(carousel).display : null,
          carouselVisibility: carousel ? getComputedStyle(carousel).visibility : null,
          carouselOpacity: carousel ? getComputedStyle(carousel).opacity : null,
          carouselHTML_first300: carousel ? carousel.outerHTML.slice(0, 300) : null
        };
      })()
    `).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
    console.log(`\n=== hero carousel inspection: ${label} ===`);
    console.log(JSON.stringify(info, null, 2));
    return info;
  }

  await inspectHeroCarousel('initial load');
  await screenshot('01-initial-load');

  // Home -> Insights -> Back -> Home
  await evalRT(`window.navigateTo('/Insights/insights.html')`, true);
  await pollFor(`location.pathname.toLowerCase().includes('insights')`, 8000);
  await evalRT(`window.history.back()`);
  await pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, 8000);
  await new Promise((r) => setTimeout(r, 1000));
  await inspectHeroCarousel('after Home->Insights->Back->Home');
  await screenshot('02-after-insights-back');

  // Home -> Favorites -> Back -> Home
  await evalRT(`window.navigateTo('/Favorites/favorites.html')`, true);
  await pollFor(`location.pathname.toLowerCase().includes('favorites')`, 8000);
  await evalRT(`window.history.back()`);
  await pollFor(`location.pathname === '/' || location.pathname.toLowerCase().endsWith('index.html')`, 8000);
  await new Promise((r) => setTimeout(r, 1000));
  await inspectHeroCarousel('after Home->Favorites->Back->Home');
  await screenshot('03-after-favorites-back');

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
