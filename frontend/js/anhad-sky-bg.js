/**
 * ANHAD Sky Background Engine v5.0 — Minimal Performance Edition
 * Background image management + Hero card images + Time-adaptive colors.
 * Stars/Moon/Sun/Celestial elements REMOVED — background WebPs handle visuals.
 */
(function () {
  'use strict';

  // ── Time helpers ─────────────────────────────────────────────────────────
  function getSlot() {
    const forced = localStorage.getItem('anhad_forced_time_of_day');
    if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
      return forced;
    }
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return 'morning';
    if (h >= 9 && h < 16) return 'day';
    if (h >= 16 && h < 20) return 'evening';
    return 'night';
  }

  // ── Background image map (WebP — optimized) ──────────────────────────────
  const BG_IMAGES = {
    morning: 'assets/darbar-sahib-morning-bg.webp',
    day: 'assets/darbar-sahib-day-bg.webp',
    evening: 'assets/darbar-sahib-evening-bg.webp',
    night: 'assets/HERO CARD IMAGES/new-night-bg.webp',
  };

  // ── Pre-load all bg images for instant swap ──────────────────────────────
  function preloadBgImages() {
    Object.values(BG_IMAGES).forEach(url => {
      const img = new Image();
      img.fetchPriority = 'low';
      img.src = url;
    });
  }

  // ── Inject instant-bg CSS kill-switch ───────────────────────────────────
  function injectInstantBgCSS() {
    if (document.getElementById('anhad-instant-bg-style')) return;
    const s = document.createElement('style');
    s.id = 'anhad-instant-bg-style';
    s.textContent = `
      body {
        transition-property: color !important;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Dual-layer transition active state tracking ──────────────────────────
  let activeLayerIndex = 1;
  function ensureBgLayers() {
    let container = document.getElementById('anhadBgTransitionContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'anhadBgTransitionContainer';
      container.className = 'anhad-bg-container';

      const layer1 = document.createElement('div');
      layer1.id = 'anhadBgLayer1';
      layer1.className = 'anhad-bg-fade-layer';

      const layer2 = document.createElement('div');
      layer2.id = 'anhadBgLayer2';
      layer2.className = 'anhad-bg-fade-layer';

      container.appendChild(layer1);
      container.appendChild(layer2);
      document.body.insertBefore(container, document.body.firstChild || null);
    }
    return container;
  }

  function getEffectiveSlot() {
    const themeMode = document.documentElement.getAttribute('data-theme-mode');
    const isDark = document.documentElement.classList.contains('dark-mode') ||
                   document.documentElement.getAttribute('data-theme') === 'dark' ||
                   themeMode === 'dark';
    if (isDark) return 'night';
    if (themeMode === 'light') return null;
    return getSlot();
  }

  // ── Update time-of-day attribute on <html> ───────────────────────────────
  function applyTimeOfDay() {
    if (!document.documentElement.hasAttribute('data-anhad-home')) {
      document.documentElement.removeAttribute('data-time-of-day');
      clearTimeAdaptiveCardColors();
      return;
    }

    const slot = getEffectiveSlot();
    if (!slot) {
      document.documentElement.removeAttribute('data-time-of-day');
      clearTimeAdaptiveCardColors();
      return;
    }
    const currentSlot = document.documentElement.getAttribute('data-time-of-day');

    const bgRestored = document.documentElement.style.getPropertyValue('--dynamic-bg-url');
    if (currentSlot === slot && bgRestored) {
      return;
    }

    document.documentElement.setAttribute('data-time-of-day', slot);

    applyTimeAdaptiveCardColors(slot);

    const bgUrl = BG_IMAGES[slot];
    if (!bgUrl) return;

    // Ensure transition layers exist in DOM
    ensureBgLayers();

    const layer1 = document.getElementById('anhadBgLayer1');
    const layer2 = document.getElementById('anhadBgLayer2');
    if (!layer1 || !layer2) return;

    const layer1Url = layer1.style.backgroundImage || '';
    const layer2Url = layer2.style.backgroundImage || '';

    // First load: set image instantly on layer 1 without transition
    if (!layer1Url && !layer2Url) {
      layer1.style.backgroundImage = `url('${bgUrl}')`;
      layer1.classList.add('active');
      layer2.classList.remove('active');
      activeLayerIndex = 1;
      // Set dynamic bg URL and maintain background transparency synchronously
      document.documentElement.style.setProperty('--dynamic-bg-url', `url('${bgUrl}')`);
      
      // Save image state
      if (window.HomeStateManager) {
        window.HomeStateManager.saveImageState(slot, [bgUrl]);
      }
      return;
    }

    // Active/inactive layer selection
    const activeLayer = activeLayerIndex === 1 ? layer1 : layer2;
    const inactiveLayer = activeLayerIndex === 1 ? layer2 : layer1;

    const activeUrl = activeLayer.style.backgroundImage || '';
    if (activeUrl.includes(bgUrl)) {
      // The layer already shows the right image — it lives outside #app, so it
      // survives the SPA content swap — but applyNewContent() cleared the
      // --dynamic-bg-url custom property that Home's own CSS reads
      // (index.html body::before). Restore it before bailing out, or Home comes
      // back with the layer painted but the property empty.
      document.documentElement.style.setProperty('--dynamic-bg-url', `url('${bgUrl}')`);
      return;
    }

    // Set background on inactive layer, then swap classes for smooth transition
    inactiveLayer.style.backgroundImage = `url('${bgUrl}')`;
    inactiveLayer.classList.add('active');
    activeLayer.classList.remove('active');
    activeLayerIndex = activeLayerIndex === 1 ? 2 : 1;

    // Save for backward compatibility
    document.documentElement.style.setProperty('--dynamic-bg-url', `url('${bgUrl}')`);
    
    // CRITICAL FIX: Remove solid background color once image layer is active
    requestAnimationFrame(() => {
      document.documentElement.style.backgroundColor = 'transparent';
    });

    if (document.body.style.backgroundImage && document.body.style.backgroundImage !== 'none') {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
    }
    
    // Save image state
    if (window.HomeStateManager) {
      window.HomeStateManager.saveImageState(slot, [bgUrl]);
    }
  }

  // ── Hero card image map ───────────────────────────────────────────────────
  const HERO_CARD_IMGS = {
    morning: [
      'assets/HERO CARD IMAGES/morning-darbar-sahib.webp',
      'assets/HERO CARD IMAGES/morning-amritvela-kirtan.webp',
      'assets/HERO CARD IMAGES/morning-waheguru-simran.webp',
    ],
    day: [
      'assets/HERO CARD IMAGES/day-darbar-sahib.webp',
      'assets/HERO CARD IMAGES/day-amritvela-kirtan.webp',
      'assets/HERO CARD IMAGES/day-waheguru-simran.webp',
    ],
    evening: [
      'assets/HERO CARD IMAGES/evening-darbar-sahib.webp',
      'assets/HERO CARD IMAGES/evening-amritvela-kirtan.webp',
      'assets/HERO CARD IMAGES/evening-waheguru-simran.webp',
    ],
    night: [
      'assets/HERO CARD IMAGES/night-darbar-sahib.webp',
      'assets/HERO CARD IMAGES/night-amritvela-kirtan.webp',
      'assets/HERO CARD IMAGES/night-waheguru-simran.webp',
    ],
  };

  /**
   * Smoothly crossfade a hero card image src.
   * Old image stays fully visible while new one preloads.
   * Once loaded, fades in with a 500ms CSS opacity transition.
   */
  function swapHeroImgSmooth(el, newSrc) {
    if (!el || !newSrc) return;
    let newAbsolute;
    try { newAbsolute = new URL(newSrc, document.baseURI).href; } catch (e) { newAbsolute = newSrc; }
    if (el.src === newAbsolute) return; // already correct

    const preload = new Image();
    let done = false;
    const doSwap = () => {
      if (done) return;
      done = true;
      el.src = newSrc;
    };
    preload.onload = doSwap;
    preload.onerror = () => {
      if (done) return;
      done = true;
      el.src = newSrc;
    };
    preload.src = newSrc;
    if (preload.complete && preload.naturalWidth > 0) doSwap();
  }

  function updateHeroCardImages() {
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    const slot = getSlot();
    let targetSlot;
    if (mode === 'dark') targetSlot = 'night';
    else if (mode === 'light') targetSlot = 'day';
    else targetSlot = slot;

    const images = HERO_CARD_IMGS[targetSlot];

    const heroCardImages = document.querySelectorAll('.hero-card__image[data-img-morning]');
    heroCardImages.forEach((img, idx) => {
      let newSrc = '';
      if (mode === 'dark') newSrc = img.getAttribute('data-img-night') || images[idx] || '';
      else if (mode === 'light') newSrc = img.getAttribute('data-img-day') || images[idx] || '';
      else {
        if (slot === 'morning') newSrc = img.getAttribute('data-img-morning') || images[idx] || '';
        else if (slot === 'day') newSrc = img.getAttribute('data-img-day') || images[idx] || '';
        else if (slot === 'evening') newSrc = img.getAttribute('data-img-evening') || images[idx] || '';
        else newSrc = img.getAttribute('data-img-night') || images[idx] || '';
      }
      if (!newSrc) return;
      swapHeroImgSmooth(img, newSrc);
    });

    const idMap = [
      { id: 'heroCard1Img', src: images[0] },
      { id: 'heroCard2Img', src: images[1] },
      { id: 'heroCard3Img', src: images[2] },
    ];
    idMap.forEach(({ id, src }) => {
      const el = document.getElementById(id);
      if (el && src) swapHeroImgSmooth(el, src);
    });
  }

  // ── TIME-ADAPTIVE CARD COLORS ─────────────────────────────────────────────
  const CARD_PALETTES = {
    morning: { bg: 'rgba(255,235,208,0.84)', bgGlass: 'rgba(255,248,238,0.72)', text: '#1A0402', text2: '#4A1508', shadow: 'rgba(0,0,0,0.08)', border: 'rgba(230,140,60,0.30)', iconBg: 'rgba(255,215,160,0.70)', accent: '#EB6834' },
    day: { bg: '#FFFDF8', bgGlass: 'rgba(255,255,255,0.85)', text: '#1C1C1E', text2: '#8A6D3B', shadow: 'rgba(0,0,0,0.06)', border: 'rgba(212,148,58,0.15)', iconBg: 'rgba(212,148,58,0.1)', accent: '#D4943A' },
    evening: { bg: 'rgba(255,210,175,0.84)', bgGlass: 'rgba(255,235,210,0.72)', text: '#140205', text2: '#38050C', shadow: 'rgba(0,0,0,0.08)', border: 'rgba(200,80,20,0.30)', iconBg: 'rgba(255,185,130,0.70)', accent: '#F29A2E' },
    night: { bg: '#2C2C2E', bgGlass: 'rgba(44,44,46,0.72)', text: '#F5F5F7', text2: '#8E8E93', shadow: 'rgba(0,0,0,0.4)', border: 'rgba(255,255,255,0.08)', iconBg: 'rgba(212,148,58,0.15)', accent: '#D4943A' },
  };

  function applyTimeAdaptiveCardColors(slot) {
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    if (mode !== 'auto') return;
    const p = CARD_PALETTES[slot] || CARD_PALETTES.day;
    const root = document.documentElement;
    root.style.setProperty('--sky-card-bg', p.bg);
    root.style.setProperty('--sky-card-bg-glass', p.bgGlass);
    root.style.setProperty('--sky-card-text', p.text);
    root.style.setProperty('--sky-card-text2', p.text2);
    root.style.setProperty('--sky-card-shadow', p.shadow);
    root.style.setProperty('--sky-card-border', p.border);
    root.style.setProperty('--sky-card-icon-bg', p.iconBg);
    root.style.setProperty('--sky-card-accent', p.accent);
  }

  function clearTimeAdaptiveCardColors() {
    ['--sky-card-bg', '--sky-card-bg-glass', '--sky-card-text', '--sky-card-text2',
      '--sky-card-shadow', '--sky-card-border', '--sky-card-icon-bg', '--sky-card-accent'
    ].forEach(p => document.documentElement.style.removeProperty(p));
  }

  // ── Track last known slot/mode ────────────────────────────────────────────
  let _lastSlot = null;
  let _lastMode = null;

  function smartRefresh() {
    // Cheapest possible checks first — this runs on a timer for the entire
    // session. Skipping while hidden or off-Home avoids a synchronous
    // localStorage read (getSlot) on every tick of every non-Home page, which
    // is pure waste: nothing here has any effect outside Home.
    if (document.hidden) return;
    if (document.body.classList.contains('scrolling') || document.documentElement.classList.contains('scrolling')) return;
    if (!document.documentElement.hasAttribute('data-anhad-home')) return;

    const slot = getSlot();
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    const expectedBgUrl = BG_IMAGES[slot];
    const currentBg = document.documentElement.style.getPropertyValue('--dynamic-bg-url') || '';
    const bgIsStale = expectedBgUrl && !currentBg.includes(expectedBgUrl);

    if (slot === _lastSlot && mode === _lastMode && !bgIsStale) return;
    _lastSlot = slot;
    _lastMode = mode;
    requestAnimationFrame(() => {
      applyTimeOfDay();
      updateHeroCardImages();
    });
  }

  function instantRefresh() {
    _lastSlot = null;
    _lastMode = null;
    requestAnimationFrame(() => {
      applyTimeOfDay();
      updateHeroCardImages();
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  // This script IS in smooth-navigation.js's SHELL_SCRIPTS, so it executes at
  // most once per JS realm: skipped on SPA revisits to Home, but still injected
  // on first arrival at Home even when the session started on Insights or
  // Favorites (neither of which loads it). The window/document listeners and
  // the interval below therefore register once and outlive every navigation —
  // which is exactly why each of them has to guard on data-anhad-home itself
  // rather than assuming it only ever runs while Home is on screen.
  function init() {
    injectInstantBgCSS();
    preloadBgImages();
    _lastSlot = getSlot();
    _lastMode = document.documentElement.getAttribute('data-theme-mode') || 'light';

    // Mid-SPA-navigation injection (this script wasn't loaded yet, e.g. the
    // session started on Insights/Favorites and just arrived at Home for the
    // first time) vs. a genuine cold load. history.state.spa is only ever set
    // by smooth-navigation.js's own pushState/replaceState, which runs BEFORE
    // this script gets injected — so on SPA arrival it's already true here.
    // applyNewContent() makes its own explicit, correctly-ordered call to
    // these same functions (after AnhadTheme.apply() has settled data-theme-
    // mode/data-time-of-day for the incoming page) a few lines after
    // injecting this script. Self-triggering here too raced that later call
    // with STALE state — the doubled data-time-of-day/class/data-theme
    // mutations seen in a real trace, and the theme flash it caused. On a
    // true cold load there is no such later call, so self-trigger normally.
    const isMidSpaInjection = window.history.state && window.history.state.spa === true;
    if (!isMidSpaInjection) {
      applyTimeOfDay();
      updateHeroCardImages();
      // Home-only, same reason as the guard inside applyTimeOfDay(): the
      // --sky-card-* palette tints shared card classes on every page.
      if (document.documentElement.hasAttribute('data-anhad-home')) {
        applyTimeAdaptiveCardColors(_lastSlot);
      }
    }

    if (!_skyBgFirstBoot) return;

    window.addEventListener('anhadTimeForced', instantRefresh);
    window.addEventListener('storage', (e) => {
      if (e.key === 'anhad_forced_time_of_day' || e.key === 'anhad_theme') instantRefresh();
    });
    // 5s, not 1s: this only detects time-of-day slot rollover (hour boundaries)
    // and background staleness — neither needs sub-second latency, and forced
    // changes come through the anhadTimeForced/storage listeners instantly.
    setInterval(smartRefresh, 5000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        _lastSlot = null;
        _lastMode = null;
        requestAnimationFrame(() => {
          applyTimeOfDay();
          updateHeroCardImages();
          if (!document.documentElement.hasAttribute('data-anhad-home')) return;
          const slot = getSlot();
          const mode = document.documentElement.getAttribute('data-theme-mode') || 'auto';
          if (mode === 'auto') applyTimeAdaptiveCardColors(slot);
        });
      }
    });
  }

  function onThemeChange() {
    _lastMode = null;
    applyTimeOfDay();
    updateHeroCardImages();
    const mode = document.documentElement.getAttribute('data-theme-mode');
    if (mode === 'auto') applyTimeAdaptiveCardColors(getSlot());
    else clearTimeAdaptiveCardColors();
  }

  // See the comment above init() — captured once per script execution so
  // both this block and init() agree on whether listeners already exist.
  const _skyBgFirstBoot = !window.__anhadSkyBgListenersBound;
  window.__anhadSkyBgListenersBound = true;

  if (_skyBgFirstBoot) {
    document.addEventListener('anhadThemeChanged', onThemeChange);
    document.addEventListener('themechange', onThemeChange);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AnhadSky = {
    refresh: function () { },
    init,
    updateHeroCardImages,
    applyTimeOfDay,
    applyTimeAdaptiveCardColors,
    clearTimeAdaptiveCardColors,
  };
})();
