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
        background-attachment: fixed;
        background-size: cover;
        background-position: center top;
        background-repeat: no-repeat;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Update time-of-day attribute on <html> ───────────────────────────────
  function applyTimeOfDay() {
    const slot = getSlot();
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    document.documentElement.setAttribute('data-time-of-day', slot);

    if (mode === 'light' || mode === 'dark') {
      const currentVal = document.documentElement.style.getPropertyValue('--dynamic-bg-url');
      if (currentVal && currentVal !== 'none') {
        document.documentElement.style.removeProperty('--dynamic-bg-url');
      }
      if (document.body.style.backgroundImage && document.body.style.backgroundImage !== 'none') {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundAttachment = '';
      }
      return;
    }

    applyTimeAdaptiveCardColors(slot);

    const bgUrl = BG_IMAGES[slot];
    if (!bgUrl) return;

    const current = document.documentElement.style.getPropertyValue('--dynamic-bg-url') || '';
    if (current.includes(bgUrl)) return;

    document.documentElement.style.setProperty('--dynamic-bg-url', `url('${bgUrl}')`);
    if (document.body.style.backgroundImage && document.body.style.backgroundImage !== 'none') {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
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
      try {
        const newAbsolute = new URL(newSrc, document.baseURI).href;
        if (img.src !== newAbsolute) img.src = newSrc;
      } catch (e) { img.src = newSrc; }
    });

    const idMap = [
      { id: 'heroCard1Img', src: images[0] },
      { id: 'heroCard2Img', src: images[1] },
      { id: 'heroCard3Img', src: images[2] },
    ];
    idMap.forEach(({ id, src }) => {
      const el = document.getElementById(id);
      if (el && src) {
        try {
          const newAbsolute = new URL(src, document.baseURI).href;
          if (el.src !== newAbsolute) el.src = src;
        } catch (e) { el.src = src; }
      }
    });
  }

  // ── TIME-ADAPTIVE CARD COLORS ─────────────────────────────────────────────
  const CARD_PALETTES = {
    morning: { bg: 'rgba(255,235,208,0.84)', bgGlass: 'rgba(255,248,238,0.72)', text: '#1A0402', text2: '#4A1508', shadow: 'rgba(18,15,12,0.22)', border: 'rgba(230,140,60,0.30)', iconBg: 'rgba(255,215,160,0.70)', accent: '#B84800' },
    day: { bg: 'rgba(210,238,255,0.84)', bgGlass: 'rgba(240,250,255,0.72)', text: '#000814', text2: '#02162E', shadow: 'rgba(0,80,180,0.30)', border: 'rgba(60,140,220,0.28)', iconBg: 'rgba(180,220,255,0.70)', accent: '#0A4078' },
    evening: { bg: 'rgba(255,210,175,0.84)', bgGlass: 'rgba(255,235,210,0.72)', text: '#140205', text2: '#38050C', shadow: 'rgba(18,15,12,0.22)', border: 'rgba(200,80,20,0.30)', iconBg: 'rgba(255,185,130,0.70)', accent: '#7A1410' },
    night: { bg: 'rgba(28,28,30,0.90)', bgGlass: 'rgba(28,28,30,0.80)', text: '#F5F5F7', text2: '#8E8E93', shadow: 'rgba(0,0,0,0.45)', border: 'rgba(255,255,255,0.12)', iconBg: 'rgba(58,58,60,0.70)', accent: '#FFD60A' },
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
    const slot = getSlot();
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    let bgIsStale = false;
    if (mode === 'auto') {
      const expectedBgUrl = BG_IMAGES[slot];
      const currentBg = document.documentElement.style.getPropertyValue('--dynamic-bg-url') || '';
      bgIsStale = expectedBgUrl && !currentBg.includes(expectedBgUrl);
    } else {
      const currentBg = document.documentElement.style.getPropertyValue('--dynamic-bg-url') || '';
      bgIsStale = currentBg && currentBg !== 'none';
    }
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
  function init() {
    injectInstantBgCSS();
    preloadBgImages();
    _lastSlot = getSlot();
    _lastMode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    applyTimeOfDay();
    updateHeroCardImages();
    applyTimeAdaptiveCardColors(_lastSlot);

    window.addEventListener('anhadTimeForced', instantRefresh);
    window.addEventListener('storage', (e) => {
      if (e.key === 'anhad_forced_time_of_day' || e.key === 'anhad_theme') instantRefresh();
    });
    setInterval(smartRefresh, 60000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        _lastSlot = null;
        _lastMode = null;
        requestAnimationFrame(() => {
          applyTimeOfDay();
          updateHeroCardImages();
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

  document.addEventListener('anhadThemeChanged', onThemeChange);
  document.addEventListener('themechange', onThemeChange);

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
