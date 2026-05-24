/**
 * ANHAD Sky Background Engine v3.0 — Majestic Edition
 * Sun, Moon (3 phases), Stars, Organic Clouds — all pure CSS/SVG, zero images.
 * Real clock-time celestial positioning. 90fps. Pixel-sharp.
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
    const h = new Date().getHours();
    if (h >= 5  && h < 7)  return 'morning';
    if (h >= 7  && h < 16) return 'day';
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
    const fg = document.getElementById('anhad-clouds-fg');
    const bg = document.getElementById('anhad-clouds-bg');
    if (!fg || fg.children.length > 0) return;

    function cloud(container, layer) {
      const el = document.createElement('div');
      const wide = layer === 'fg' ? ri(200, 420) : ri(130, 280);
      const tall = Math.floor(wide * r(0.28, 0.44));
      const top  = layer === 'fg' ? r(4, 44) : r(1, 32);
      const dur  = layer === 'fg' ? r(60, 130) : r(110, 210);
      const del  = -r(0, dur);
      el.className = `anhad-cloud anhad-cloud--${layer}`;
      el.style.cssText = `width:${wide}px;height:${tall}px;top:${top}%;animation-duration:${dur.toFixed(0)}s;animation-delay:${del.toFixed(0)}s;`;
      return el;
    }

    const ff = document.createDocumentFragment();
    for (let i = 0; i < CFG.cloudsFg; i++) ff.appendChild(cloud(fg, 'fg'));
    fg.appendChild(ff);

    if (bg) {
      const bf = document.createDocumentFragment();
      for (let i = 0; i < CFG.cloudsBg; i++) bf.appendChild(cloud(bg, 'bg'));
      bg.appendChild(bf);
    }
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

  // ── Update time-of-day attribute on <html> ───────────────────────────────
  function applyTimeOfDay() {
    const slot = getSlot();
    const mode = document.documentElement.getAttribute('data-theme-mode');
    console.log('applyTimeOfDay - slot:', slot, 'mode:', mode);
    document.documentElement.setAttribute('data-time-of-day', slot);
    
    // Update background image directly to ensure it changes without refresh
    const canvas = document.getElementById('anhad-sky-canvas');
    console.log('Canvas exists:', !!canvas);
    
    if (canvas) {
      let bgImage = '';
      // Update background regardless of theme mode for auto-change
      switch(slot) {
        case 'morning':
          bgImage = 'assets/darbar-sahib-amritvela-morning.png';
          console.log('Morning - setting bg:', bgImage);
          break;
        case 'day':
          bgImage = 'assets/darbar-sahib-day.jpg';
          break;
        case 'evening':
          bgImage = 'assets/darbar-sahib-evening.jpg';
          break;
        case 'night':
          bgImage = 'assets/darbar-sahib-night.jpg';
          break;
      }
      if (bgImage) {
        canvas.style.backgroundImage = `url('${bgImage}')`;
        console.log('Background set to:', canvas.style.backgroundImage);
      }
    }
  }

  // ── Update hero card images based on theme mode ───────────────────────────
  function updateHeroCardImages() {
    const mode = document.documentElement.getAttribute('data-theme-mode');
    const slot = getSlot();
    const heroCardImages = document.querySelectorAll('.hero-card__image[data-img-morning]');
    
    heroCardImages.forEach(img => {
      let newSrc = '';
      
      if (mode === 'dark') {
        // Dark mode: always use night images
        newSrc = img.getAttribute('data-img-night');
      } else if (mode === 'light') {
        // Light mode: always use day images
        newSrc = img.getAttribute('data-img-day');
      } else if (mode === 'auto') {
        // Auto mode: use time-based images
        if (slot === 'morning') {
          newSrc = img.getAttribute('data-img-morning');
        } else if (slot === 'day') {
          newSrc = img.getAttribute('data-img-day');
        } else if (slot === 'evening') {
          newSrc = img.getAttribute('data-img-evening');
        } else {
          newSrc = img.getAttribute('data-img-night');
        }
      }
      
      // Force update even if src matches to ensure morning images load
      if (newSrc) {
        img.src = newSrc;
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

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
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
    // Refresh every 30s for faster time-based updates
    setInterval(() => { 
      requestAnimationFrame(() => {
        applyTimeOfDay(); 
        updateHeroCardImages(); 
        positionCelestials(); 
      });
    }, 30_000);
  }

  function onThemeChange() {
    const mode = document.documentElement.getAttribute('data-theme-mode');
    applyTimeOfDay();
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
  }

  document.addEventListener('anhadThemeChanged', onThemeChange);
  document.addEventListener('themechange',        onThemeChange);

  // Force immediate update when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      updateHeroCardImages();
    });
  } else {
    init();
    updateHeroCardImages();
  }
  
  // Also update images immediately on load to catch theme set in head script
  window.addEventListener('load', function() {
    updateHeroCardImages();
  });

  window.AnhadSky = { refresh: positionCelestials, init };
})();
