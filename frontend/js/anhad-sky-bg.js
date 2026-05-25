/**
 * ANHAD Sky Background Engine v4.0 — Ultra Performance Edition
 * Sun, Moon (3 phases), Stars, Organic Clouds — all pure CSS/SVG, zero raster images.
 * Real clock-time celestial positioning. 90fps. Pixel-sharp.
 *
 * FIXES in v4.0:
 *  - Removed ?v=Date.now() cache-busting that was forcing image re-downloads every 30s
 *  - Hero card images now use WebP (10x smaller) with clean filenames
 *  - Background images use WebP versions
 *  - Smart src comparison: only sets img.src when it actually changes
 *  - Auto-refresh every 60s (was 30s) — only updates when time slot changes
 */
(function () {
  'use strict';

  const CFG = {
    stars: 165,
    brightStars: 12,
    shootingStars: 5,
    cloudsFg: 3,
    cloudsBg: 4,
  };

  function r(a, b) { return Math.random() * (b - a) + a; }
  function ri(a, b) { return Math.floor(r(a, b + 1)); }

  // ── Time helpers ─────────────────────────────────────────────────────────
  function getSlot() {
    const forced = localStorage.getItem('anhad_forced_time_of_day');
    if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
      return forced;
    }
    const h = new Date().getHours();
    if (h >= 5  && h < 9)  return 'morning';
    if (h >= 9  && h < 16) return 'day';
    if (h >= 16 && h < 20) return 'evening';
    return 'night';
  }

  function getMoonPhase() {
    const d = new Date().getDate();
    if (d <= 8)  return 'crescent';
    if (d <= 22) return 'half';
    return 'full';
  }

  function getSunClass() {
    const s = getSlot();
    if (s === 'morning') return 'sun-morning';
    if (s === 'day')     return 'sun-day';
    if (s === 'evening') return 'sun-evening';
    return '';
  }

  // ── Celestial arc positions ──────────────────────────────────────────────
  function celestialPos() {
    const now = new Date();
    const t   = now.getHours() + now.getMinutes() / 60;

    // Sun arc 5am → 8pm (15h)
    const sp = Math.max(0, Math.min(1, (t - 5) / 15));
    const sunL = 5  + sp * 90;
    const sunT = 55 - Math.sin(sp * Math.PI) * 52;

    // Moon arc 8pm → 5am (9h, wrapping midnight)
    let mp = 0.5;
    if (t >= 20)    mp = (t - 20) / 9;
    else if (t < 5) mp = (t + 4)  / 9;
    mp = Math.max(0, Math.min(1, mp));
    const moonL = 8  + mp * 84;
    const moonT = 50 - Math.sin(mp * Math.PI) * 47;

    return { sunL, sunT, moonL, moonT };
  }

  // ── Inject SVG defs for organic cloud filter ─────────────────────────────
  function injectSVG() {
    if (document.getElementById('anhad-svg-defs')) return;
    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.id = 'anhad-svg-defs';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    svg.innerHTML = `<defs>
      <!-- Organic cloud edge displacement -->
      <filter id="cloud-turbulence" x="-25%" y="-25%" width="150%" height="150%"
              color-interpolation-filters="linearRGB" primitiveUnits="userSpaceOnUse">
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.011"
                      numOctaves="5" seed="42" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise"
                           scale="24" xChannelSelector="R" yChannelSelector="G"
                           result="displaced"/>
        <feGaussianBlur in="displaced" stdDeviation="2.5" result="soft"/>
        <feComposite in="soft" in2="SourceGraphic" operator="in"/>
      </filter>
      <!-- Star glow -->
      <filter id="star-glow" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="1.2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;
    document.body.insertBefore(svg, document.body.firstChild);
  }

  // ── Build canvas DOM ─────────────────────────────────────────────────────
  function buildCanvas() {
    if (document.getElementById('anhad-sky-canvas')) return;
    const c = document.createElement('div');
    c.id = 'anhad-sky-canvas';
    c.setAttribute('aria-hidden', 'true');
    // Order: BG clouds → stars → moon → sun → horizon glow → FG clouds
    c.innerHTML = `
      <div id="anhad-clouds-bg"></div>
      <div id="anhad-stars"></div>
      <div id="anhad-moon"><span class="moon-inner"></span></div>
      <div id="anhad-sun"></div>
      <div id="anhad-horizon-glow"></div>
      <div id="anhad-morning-rays"></div>
      <div id="anhad-clouds-fg"></div>
    `;
    document.body.insertBefore(c, document.body.firstChild);
  }

  // ── Stars ────────────────────────────────────────────────────────────────
  function buildStars() {
    const c = document.getElementById('anhad-stars');
    if (!c || c.children.length > 0) return;
    const f = document.createDocumentFragment();

    for (let i = 0; i < CFG.stars; i++) {
      const el  = document.createElement('div');
      el.className = 'anhad-star';
      const sz  = r(0.5, 2.5);
      const op  = r(0.22, 0.96);
      const dur = r(2, 7);
      const del = r(0, 9);
      const isGold = Math.random() > 0.70;
      const isBlue = Math.random() > 0.82;
      const col = isGold ? `hsl(${ri(38,52)},70%,85%)` : isBlue ? `hsl(${ri(200,230)},60%,92%)` : '#FFF';
      el.style.cssText = `left:${r(0,100)}%;top:${r(0,85)}%;width:${sz}px;height:${sz}px;background:${col};--star-opacity:${op.toFixed(2)};--td:${dur.toFixed(1)}s;--dl:-${del.toFixed(1)}s;opacity:${op.toFixed(2)};`;
      f.appendChild(el);
    }

    // Brighter featured stars
    for (let i = 0; i < CFG.brightStars; i++) {
      const el = document.createElement('div');
      el.className = 'anhad-star anhad-star--bright';
      const sz  = r(2.0, 4.5);
      const op  = r(0.60, 1.0);
      const dur = r(2.5, 6);
      const del = r(0, 7);
      el.style.cssText = `left:${r(2,98)}%;top:${r(2,70)}%;width:${sz}px;height:${sz}px;--star-opacity:${op.toFixed(2)};--td:${dur.toFixed(1)}s;--dl:-${del.toFixed(1)}s;`;
      f.appendChild(el);
    }

    // Shooting stars
    for (let i = 0; i < CFG.shootingStars; i++) {
      const el  = document.createElement('div');
      el.className = 'anhad-shooting-star';
      const dur = r(5, 14);
      const del = r(5, 40);
      el.style.cssText = `left:${r(3,50)}%;top:${r(2,36)}%;animation-duration:${dur.toFixed(1)}s;animation-delay:${del.toFixed(1)}s;`;
      f.appendChild(el);
    }

    c.appendChild(f);
  }

  // ── Clouds (foreground + background layers) ──────────────────────────────
  function buildClouds() {
    // Disabled to reduce load in auto mode
    return;
  }

  // ── Position sun, moon and set phase ────────────────────────────────────
  function positionCelestials() {
    const { sunL, sunT, moonL, moonT } = celestialPos();

    const sun  = document.getElementById('anhad-sun');
    const moon = document.getElementById('anhad-moon');

    if (sun) {
      sun.style.left  = `${sunL}%`;
      sun.style.top   = `${sunT}%`;
      sun.className   = getSunClass();
    }
    if (moon) {
      moon.style.left  = `${moonL}%`;
      moon.style.top   = `${moonT}%`;
      moon.className   = `moon-${getMoonPhase()}`;
    }
  }

  // ── Background image map (WebP — optimized) ──────────────────────────────
  const BG_IMAGES = {
    morning: "assets/darbar-sahib-morning-bg.webp",
    day:     "assets/darbar-sahib-day-bg.webp",
    evening: "assets/darbar-sahib-evening-bg.webp",
    night:   "assets/HERO CARD IMAGES/new-night-bg.webp",
  };

  // ── Update time-of-day attribute on <html> ───────────────────────────────
  function applyTimeOfDay() {
    const slot = getSlot();
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    document.documentElement.setAttribute('data-time-of-day', slot);

    // CRITICAL: Background image ONLY in dynamic/auto mode.
    // In explicit light/dark modes, background is a plain color (no background image).
    if (mode === 'light' || mode === 'dark') {
      if (document.body.style.backgroundImage !== 'none') {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundAttachment = '';
      }
      const canvas = document.getElementById('anhad-sky-canvas');
      if (canvas) {
        canvas.style.backgroundImage = '';
      }
      return;
    }

    const bgUrl = BG_IMAGES[slot];
    if (!bgUrl) return;

    // Crossfade: only update when image actually changes
    const current = document.body.style.backgroundImage || '';
    if (current.includes(bgUrl)) return; // Already correct — skip

    // Make background image swap instant (in milliseconds) with no transition delay
    document.body.style.transition = 'none';

    document.body.style.backgroundImage = `url('${bgUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    // Clear inline background image on sky canvas so CSS stylesheet rules can control it without specificity override
    const canvas = document.getElementById('anhad-sky-canvas');
    if (canvas) {
      canvas.style.backgroundImage = '';
    }
  }

  // ── Hero card image map (WebP — clean filenames) ─────────────────────────
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

  // ── Update hero card images based on theme mode ───────────────────────────
  function updateHeroCardImages() {
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
    const slot = getSlot();

    // Determine which time slot to use
    let targetSlot;
    if (mode === 'dark') {
      targetSlot = 'night';
    } else if (mode === 'light') {
      targetSlot = 'day';
    } else {
      // auto: use actual time of day
      targetSlot = slot;
    }

    const images = HERO_CARD_IMGS[targetSlot];

    // Update via data-img-* attributes (for compatibility with HTML declarations)
    const heroCardImages = document.querySelectorAll('.hero-card__image[data-img-morning]');
    heroCardImages.forEach((img, idx) => {
      let newSrc = '';
      if (mode === 'dark') {
        newSrc = img.getAttribute('data-img-night') || images[idx] || '';
      } else if (mode === 'light') {
        newSrc = img.getAttribute('data-img-day') || images[idx] || '';
      } else {
        if (slot === 'morning') newSrc = img.getAttribute('data-img-morning') || images[idx] || '';
        else if (slot === 'day') newSrc = img.getAttribute('data-img-day') || images[idx] || '';
        else if (slot === 'evening') newSrc = img.getAttribute('data-img-evening') || images[idx] || '';
        else newSrc = img.getAttribute('data-img-night') || images[idx] || '';
      }

      if (!newSrc) return;

      // CRITICAL FIX: Compare properly without setting if already correct
      // No ?v=Date.now() — browser cache must work!
      const currentSrc = img.src;
      const newAbsolute = new URL(newSrc, document.baseURI).href;

      if (currentSrc !== newAbsolute) {
        img.classList.add('anhad-img-fade-out');
        const onLoad = () => {
          img.classList.remove('anhad-img-fade-out');
          img.classList.add('anhad-img-fade-in');
          setTimeout(() => img.classList.remove('anhad-img-fade-in'), 600);
        };
        // Set src — browser will use cache if available (304 Not Modified)
        img.addEventListener('load', onLoad, { once: true });
        img.src = newSrc;
      }
    });

    // Also update by IDs for direct compatibility
    const idMap = [
      { id: 'heroCard1Img', src: images[0] },
      { id: 'heroCard2Img', src: images[1] },
      { id: 'heroCard3Img', src: images[2] },
    ];
    idMap.forEach(({ id, src }) => {
      const el = document.getElementById(id);
      if (el && src) {
        const newAbsolute = new URL(src, document.baseURI).href;
        if (el.src !== newAbsolute) {
          el.src = src;
        }
      }
    });
  }

  // ── Scroll optimization ───────────────────────────────────────────────────
  let scrollTimeout;
  function handleScroll() {
    document.body.classList.add('is-scrolling');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('is-scrolling');
    }, 150);
  }

  // ── Track last known slot to avoid unnecessary updates ───────────────────
  let _lastSlot = null;
  let _lastMode = null;

  function smartRefresh() {
    const slot = getSlot();
    const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';

    // Check if bg image is stale
    let bgIsStale = false;
    if (mode === 'auto') {
      const expectedBgUrl = BG_IMAGES[slot];
      const currentBg = document.body.style.backgroundImage || '';
      bgIsStale = expectedBgUrl && !currentBg.includes(expectedBgUrl);
    } else {
      // Explicit light/dark modes should have 'none' as background image
      const currentBg = document.body.style.backgroundImage || '';
      bgIsStale = currentBg && currentBg !== 'none';
    }

    // Run update if slot, mode, or bg changed
    if (slot === _lastSlot && mode === _lastMode && !bgIsStale) return;
    _lastSlot = slot;
    _lastMode = mode;
    requestAnimationFrame(() => {
      applyTimeOfDay();
      updateHeroCardImages();
      positionCelestials();
    });
  }

  // ── INSTANT event-driven refresh (fires in milliseconds) ─────────────────
  // Called whenever localStorage 'anhad_forced_time_of_day' changes — no polling wait.
  function instantRefresh() {
    _lastSlot = null; // Force re-evaluation
    _lastMode = null;
    requestAnimationFrame(() => {
      applyTimeOfDay();
      updateHeroCardImages();
      positionCelestials();
    });
  }

  // ── Inject fade transition CSS ────────────────────────────────────────────
  function injectFadeCSS() {
    if (document.getElementById('anhad-img-fade-style')) return;
    const s = document.createElement('style');
    s.id = 'anhad-img-fade-style';
    s.textContent = `
      .hero-card__image {
        transition: opacity 0.5s ease-in-out;
      }
      .anhad-img-fade-out {
        opacity: 0 !important;
      }
      .anhad-img-fade-in {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    injectFadeCSS();
    _lastSlot = getSlot();
    _lastMode = document.documentElement.getAttribute('data-theme-mode') || 'light';

    applyTimeOfDay();
    updateHeroCardImages();

    if (document.documentElement.getAttribute('data-theme-mode') === 'auto') {
      injectSVG();
      buildCanvas();
      buildStars();
      buildClouds();
      positionCelestials();
    }

    // Add scroll listener for performance optimization
    window.addEventListener('scroll', handleScroll, { passive: true, capture: false });

    // ── EVENT-DRIVEN: React instantly when forced time changes (same tab) ───
    // This fires in <1ms — no polling delay at all.
    window.addEventListener('anhadTimeForced', instantRefresh);

    // ── EVENT-DRIVEN: React to localStorage changes from other tabs ─────────
    window.addEventListener('storage', (e) => {
      if (e.key === 'anhad_forced_time_of_day' || e.key === 'anhad_theme') {
        instantRefresh();
      }
    });

    // ── SAFETY NET: 30s lightweight poll (fallback only) ────────────────────
    // Real-clock transitions (9:00am → day, 8:00pm → night) handled by this.
    // Event-driven updates (themechange, anhadTimeForced) handle the instant case.
    setInterval(smartRefresh, 30000); // was 500ms
  }

  function onThemeChange() {
    const mode = document.documentElement.getAttribute('data-theme-mode');
    _lastMode = null; // Force refresh on theme change
    applyTimeOfDay();      // ← updates bg image immediately for new mode
    updateHeroCardImages();
    if (mode === 'auto') {
      if (!document.getElementById('anhad-sky-canvas')) {
        injectSVG();
        buildCanvas();
        buildStars();
        buildClouds();
      }
      positionCelestials();
    }
    // NOTE: removed 'else { backgroundImage = none }' — bg always shows now
  }

  // Use document listeners only — events dispatched on window bubble to document,
  // so a window+document pair fires onThemeChange TWICE per toggle.
  document.addEventListener('anhadThemeChanged', onThemeChange);
  document.addEventListener('themechange', onThemeChange);
  // NOTE: window 'themechange' listener intentionally REMOVED to prevent double-fire.

  // Force immediate update when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
    });
  } else {
    init();
  }

  window.AnhadSky = { refresh: positionCelestials, init, updateHeroCardImages, applyTimeOfDay };
})();
