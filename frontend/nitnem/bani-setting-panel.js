// ═══════════════════════════════════════════════════════════════
// SETTINGS PANEL CONTROLLER - ENHANCED VERSION
// Supports 12 Themes + All Visual Customizations
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT SETTINGS
  // ═══════════════════════════════════════════════════════════════
  
  const DEFAULTS = {
    gurmukhiSize: 28,
    transliterationSize: 18,
    translationSize: 16,
    punjabiSize: 16,
    theme: 'dark',
    spacing: 'normal',
    lensMode: false,
    glassGlow: 0.35,
    edgeChroma: 0.35,
    uiMotion: 1,
    ripples: true
  };

  // Size limits
  const SIZE_LIMITS = {
    gurmukhi: { min: 18, max: 52 },
    transliteration: { min: 12, max: 32 },
    translation: { min: 12, max: 28 },
    punjabi: { min: 12, max: 28 }
  };

  // Available themes
  const THEMES = [
    'dark',
    'light', 
    'sepia',
    'deep-blue',
    'indigo',
    'amber',
    'purple',
    'green',
    'saffron',
    'teal',
    'rose',
    'midnight'
  ];

  // ═══════════════════════════════════════════════════════════════
  // DOM ELEMENTS
  // ═══════════════════════════════════════════════════════════════
  
  let settingsBtn;
  let settingsPanel;
  let settingsOverlay;
  let settingsClose;
  let resetSettings;
  let gurmukhiSizeDisplay;
  let transliterationSizeDisplay;
  let translationSizeDisplay;
  let punjabiSizeDisplay;

  let glassGlowSlider;
  let edgeChromaSlider;
  let uiMotionSlider;
  let ripplesToggle;

  let lensModeToggle;

  // ═══════════════════════════════════════════════════════════════
  // CURRENT SETTINGS STATE
  // ═══════════════════════════════════════════════════════════════
  
  let settings = { ...DEFAULTS };

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZE DOM REFERENCES
  // ═══════════════════════════════════════════════════════════════

  function initDOMReferences() {
    settingsBtn = document.getElementById('settingsBtn');
    settingsPanel = document.getElementById('settingsPanel');
    settingsOverlay = document.getElementById('settingsOverlay');
    settingsClose = document.getElementById('settingsClose');
    resetSettings = document.getElementById('resetSettings');
    
    gurmukhiSizeDisplay = document.getElementById('gurmukhiSize');
    transliterationSizeDisplay = document.getElementById('transliterationSize');
    translationSizeDisplay = document.getElementById('translationSize');
    punjabiSizeDisplay = document.getElementById('punjabiSize');

    glassGlowSlider = document.getElementById('glassGlow');
    edgeChromaSlider = document.getElementById('edgeChroma');
    uiMotionSlider = document.getElementById('uiMotion');
    ripplesToggle = document.getElementById('ripplesToggle');
  }

  // ═══════════════════════════════════════════════════════════════
  // PANEL TOGGLE
  // ═══════════════════════════════════════════════════════════════
  
  function openSettings() {
    if (settingsPanel) settingsPanel.classList.add('visible');
    if (settingsOverlay) settingsOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeSettings() {
    if (settingsPanel) settingsPanel.classList.remove('visible');
    if (settingsOverlay) settingsOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  // ═══════════════════════════════════════════════════════════════
  // APPLY SETTINGS TO CSS
  // ═══════════════════════════════════════════════════════════════
  
  function applySettings() {
    const root = document.documentElement;
    
    // Apply font sizes as CSS custom properties
    root.style.setProperty('--font-gurmukhi', `${settings.gurmukhiSize}px`);
    root.style.setProperty('--font-transliteration', `${settings.transliterationSize}px`);
    root.style.setProperty('--font-translation', `${settings.translationSize}px`);
    root.style.setProperty('--font-punjabi', `${settings.punjabiSize || settings.translationSize}px`);
    
    // Apply theme to body
    document.body.setAttribute('data-theme', settings.theme);
    
    // Apply spacing to body
    document.body.setAttribute('data-spacing', settings.spacing);

    document.body.classList.toggle('lens-mode', settings.lensMode === true);

    // Optical liquid glass tuning
    root.style.setProperty('--glass-glow', String(settings.glassGlow ?? DEFAULTS.glassGlow));
    root.style.setProperty('--edge-chroma', String(settings.edgeChroma ?? DEFAULTS.edgeChroma));
    root.style.setProperty('--ui-motion', String(settings.uiMotion ?? DEFAULTS.uiMotion));
    
    // Update size displays
    if (gurmukhiSizeDisplay) gurmukhiSizeDisplay.textContent = settings.gurmukhiSize;
    if (transliterationSizeDisplay) transliterationSizeDisplay.textContent = settings.transliterationSize;
    if (translationSizeDisplay) translationSizeDisplay.textContent = settings.translationSize;
    if (punjabiSizeDisplay) punjabiSizeDisplay.textContent = settings.punjabiSize || settings.translationSize;

    if (glassGlowSlider) glassGlowSlider.value = String(settings.glassGlow ?? DEFAULTS.glassGlow);
    if (edgeChromaSlider) edgeChromaSlider.value = String(settings.edgeChroma ?? DEFAULTS.edgeChroma);
    if (uiMotionSlider) uiMotionSlider.value = String(settings.uiMotion ?? DEFAULTS.uiMotion);
    if (ripplesToggle) ripplesToggle.dataset.on = String((settings.ripples ?? DEFAULTS.ripples) === true);
    
    // Update active buttons
    updateActiveButtons();

    if (lensModeToggle) lensModeToggle.dataset.active = String(settings.lensMode === true);
    
    console.log('⚙️ Settings applied:', settings);
  }

  const LensEngine = {
    container: null,
    bars: null,
    background: null,
    io: null,
    mo: null,
    visible: new Set(),
    rafId: 0,
    resizeRafId: 0,
    scrollHandler: null,
    resizeHandler: null,

    ensureDOM() {
      if (!document.body) return;

      if (!this.background) {
        this.background = document.querySelector('.lens-background');
      }
      if (!this.background) {
        const bg = document.createElement('div');
        bg.className = 'lens-background';
        bg.innerHTML = `
          <div class="lens-orb lens-orb--1"></div>
          <div class="lens-orb lens-orb--2"></div>
          <div class="lens-orb lens-orb--3"></div>
        `;
        document.body.insertBefore(bg, document.body.firstChild);
        this.background = bg;
      }

      if (!this.bars) {
        this.bars = document.querySelector('.lens-glass-bars');
      }
      if (!this.bars) {
        const bars = document.createElement('div');
        bars.className = 'lens-glass-bars';
        for (let i = 0; i < 5; i++) {
          const bar = document.createElement('div');
          bar.className = 'lens-glass-bar';
          bars.appendChild(bar);
        }
        document.body.appendChild(bars);
        this.bars = bars;
      }
    },

    updateOffsets() {
      const header = document.querySelector('.bani-header');
      const controls = document.querySelector('.bani-controls');
      const headerH = header ? header.offsetHeight : 0;
      const controlsH = controls ? controls.offsetHeight : 0;

      document.documentElement.style.setProperty('--lens-header-height', `${headerH}px`);
      document.documentElement.style.setProperty('--lens-controls-height', `${controlsH}px`);
      document.documentElement.style.setProperty('--lens-top-offset', `${headerH + controlsH}px`);
    },

    observeAll() {
      if (!this.container || !this.io) return;
      this.container.querySelectorAll('.verse').forEach((el) => {
        this.io.observe(el);
      });
    },

    requestUpdate() {
      if (this.rafId) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = 0;
        this.update();
      });
    },

    requestOffsets() {
      if (this.resizeRafId) return;
      this.resizeRafId = requestAnimationFrame(() => {
        this.resizeRafId = 0;
        this.updateOffsets();
        this.requestUpdate();
      });
    },

    update() {
      if (!(document.body && document.body.classList.contains('lens-mode'))) return;
      if (!this.container) return;

      this.ensureDOM();
      this.updateOffsets();

      const bars = Array.from(document.querySelectorAll('.lens-glass-bar'));
      if (bars.length === 0) return;

      const barCenters = bars.map((b) => {
        const r = b.getBoundingClientRect();
        return r.top + r.height / 2;
      });

      const maxDist = 110;
      this.visible.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;

        let min = Infinity;
        for (let i = 0; i < barCenters.length; i++) {
          const d = Math.abs(barCenters[i] - center);
          if (d < min) min = d;
        }

        const intensity = min < maxDist ? 1 - (min / maxDist) : 0;
        const glowBase = settings.glassGlow ?? DEFAULTS.glassGlow;
        const chromaBase = settings.edgeChroma ?? DEFAULTS.edgeChroma;

        const lensGlow = intensity * glowBase;
        const lensCa = intensity * chromaBase;

        const vx = OpticalEngine?.state?.velocity?.x ?? 0;
        const vy = OpticalEngine?.state?.velocity?.y ?? 0;
        const bendPx = intensity * 1.8;

        const shiftX = vx * bendPx;
        const shiftY = vy * bendPx;

        el.style.setProperty('--lens-intensity', intensity.toFixed(3));
        el.style.setProperty('--lens-glow', lensGlow.toFixed(3));
        el.style.setProperty('--lens-ca', lensCa.toFixed(3));
        el.style.setProperty('--lens-shift-x', `${shiftX.toFixed(2)}px`);
        el.style.setProperty('--lens-shift-y', `${shiftY.toFixed(2)}px`);

        el.classList.toggle('pankti-active', intensity > 0.6);
      });
    },

    init(container) {
      if (!container) return;

      if (this.container === container && this.io) {
        this.requestOffsets();
        this.requestUpdate();
        return;
      }

      this.destroy();
      this.container = container;

      this.ensureDOM();
      this.updateOffsets();

      this.io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (entry.isIntersecting) {
            this.visible.add(el);
          } else {
            this.visible.delete(el);
            el.classList.remove('pankti-active');
            el.style.removeProperty('--lens-intensity');
            el.style.removeProperty('--lens-glow');
            el.style.removeProperty('--lens-ca');
            el.style.removeProperty('--lens-shift-x');
            el.style.removeProperty('--lens-shift-y');
          }
        });
        this.requestUpdate();
      }, {
        root: container,
        threshold: [0, 0.25, 0.5, 0.75, 1]
      });

      this.observeAll();

      this.mo = new MutationObserver(() => {
        this.observeAll();
        this.requestUpdate();
      });
      this.mo.observe(container, { childList: true, subtree: true });

      this.scrollHandler = () => this.requestUpdate();
      this.resizeHandler = () => this.requestOffsets();

      container.addEventListener('scroll', this.scrollHandler, { passive: true });
      window.addEventListener('resize', this.resizeHandler, { passive: true });

      this.requestUpdate();
    },

    destroy() {
      if (this.container && this.scrollHandler) {
        this.container.removeEventListener('scroll', this.scrollHandler);
      }
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }

      this.scrollHandler = null;
      this.resizeHandler = null;

      if (this.io) this.io.disconnect();
      if (this.mo) this.mo.disconnect();

      this.io = null;
      this.mo = null;
      this.visible.clear();
      this.container = null;
    }
  };

  function clampNumber(value, min, max, fallback) {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function ensureOpticalControlsExist() {
    if (!settingsPanel) return;
    const content = settingsPanel.querySelector('.settings-content');
    if (!content) return;

    if (document.getElementById('glassGlow')) return;

    const group = document.createElement('div');
    group.className = 'setting-group';
    group.innerHTML = `
      <label class="setting-label"><i class="fas fa-magic"></i> Optical Glass</label>

      <div class="toggle-pill" style="margin-bottom: 1rem;">
        <span class="toggle-pill__label">Ripples</span>
        <button class="toggle-pill__switch" id="ripplesToggle" type="button" data-on="true" aria-label="Toggle ripples"></button>
      </div>

      <label class="setting-label" style="text-transform:none; letter-spacing:0; margin-bottom:0.5rem;">Glow Intensity</label>
      <input class="range-slider" id="glassGlow" type="range" min="0" max="0.8" step="0.05" value="0.35">

      <label class="setting-label" style="text-transform:none; letter-spacing:0; margin:1rem 0 0.5rem;">Edge Chroma</label>
      <input class="range-slider" id="edgeChroma" type="range" min="0" max="0.8" step="0.05" value="0.35">

      <label class="setting-label" style="text-transform:none; letter-spacing:0; margin:1rem 0 0.5rem;">UI Motion</label>
      <input class="range-slider" id="uiMotion" type="range" min="0" max="1" step="0.1" value="1">
    `;

    const resetGroup = document.getElementById('resetSettings')?.closest('.setting-group');
    if (resetGroup && resetGroup.parentElement) {
      resetGroup.parentElement.insertBefore(group, resetGroup);
    } else {
      content.appendChild(group);
    }
  }

  function applyOpticalDefaultsForTheme(themeName) {
    if (typeof themeName !== 'string') return;

    const themeDefaults = {
      dark: { glow: 0.42, chroma: 0.38 },
      light: { glow: 0.28, chroma: 0.28 },
      sepia: { glow: 0.30, chroma: 0.26 },
      'deep-blue': { glow: 0.44, chroma: 0.42 },
      indigo: { glow: 0.44, chroma: 0.42 },
      amber: { glow: 0.40, chroma: 0.34 },
      purple: { glow: 0.44, chroma: 0.44 },
      green: { glow: 0.40, chroma: 0.34 },
      saffron: { glow: 0.40, chroma: 0.34 },
      teal: { glow: 0.42, chroma: 0.38 },
      rose: { glow: 0.44, chroma: 0.42 },
      midnight: { glow: 0.42, chroma: 0.34 }
    };

    const d = themeDefaults[themeName];
    if (!d) return;

    if (settings.glassGlow === DEFAULTS.glassGlow) settings.glassGlow = d.glow;
    if (settings.edgeChroma === DEFAULTS.edgeChroma) settings.edgeChroma = d.chroma;
  }

  const OpticalEngine = {
    root: document.documentElement,
    state: {
      light: { x: 0.6, y: 0.22 },
      targetLight: { x: 0.6, y: 0.22 },
      velocity: { x: 0, y: 0 },
      scrollGlow: 0,
      lastScrollY: 0,
      lastScrollT: 0,
      scrollSource: 'window'
    },

    init() {
      this.state.lastScrollY = (window.scrollY || 0);
      this.state.lastScrollT = performance.now();

      window.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: true });
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });

      const versesContainer = document.getElementById('versesContainer');
      if (versesContainer) {
        versesContainer.addEventListener('scroll', () => this.onScroll(), { passive: true });
      }
      document.addEventListener('pointerdown', (e) => this.onRipple(e), { passive: true });

      this.tick();
    },

    getScrollMetrics() {
      const isLens = document.body && document.body.classList.contains('lens-mode');
      const container = isLens ? document.getElementById('versesContainer') : null;

      if (container) {
        return {
          source: 'container',
          y: container.scrollTop || 0,
          scrollHeight: container.scrollHeight || 0,
          clientHeight: container.clientHeight || 0
        };
      }

      return {
        source: 'window',
        y: window.scrollY || 0,
        scrollHeight: document.documentElement.scrollHeight || 0,
        clientHeight: window.innerHeight || 0
      };
    },

    onPointerMove(e) {
      const x = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
      const y = Math.min(1, Math.max(0, e.clientY / window.innerHeight));

      this.state.targetLight.x = 0.55 + (x - 0.5) * 0.45;
      this.state.targetLight.y = 0.26 + (y - 0.5) * 0.35;
    },

    onScroll() {
      const now = performance.now();
      const m = this.getScrollMetrics();
      const y = m.y;

      if (this.state.scrollSource !== m.source) {
        this.state.scrollSource = m.source;
        this.state.lastScrollY = y;
        this.state.lastScrollT = now;
        return;
      }

      const dt = Math.max(16, now - this.state.lastScrollT);
      const dy = y - this.state.lastScrollY;
      const v = dy / dt;

      const glowKick = Math.min(1, Math.abs(v) * 10);
      this.state.scrollGlow = Math.max(this.state.scrollGlow, glowKick);

      const denom = (m.scrollHeight - m.clientHeight);
      const progress = denom > 0 ? (y / denom) : 0;

      this.root.style.setProperty('--scroll-progress', String(progress));
      this.state.velocity.x = Math.max(-8, Math.min(8, v * 18));
      this.state.velocity.y = Math.max(-8, Math.min(8, v * 10));

      this.state.lastScrollY = y;
      this.state.lastScrollT = now;
    },

    onRipple(e) {
      if (!(settings.ripples ?? DEFAULTS.ripples)) return;
      if (!(e.target instanceof Element)) return;

      const surface = e.target.closest('.verse, .control-toggle, .back-btn, .settings-btn, .settings-panel');
      if (!surface) return;

      const rect = surface.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'droplet-ripple';

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const size = Math.max(rect.width, rect.height) * 1.15;

      ripple.style.setProperty('--droplet-ripple-x', `${x}%`);
      ripple.style.setProperty('--droplet-ripple-y', `${y}%`);
      ripple.style.setProperty('--droplet-ripple-size', `${size}px`);

      surface.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    },

    tick() {
      const motion = settings.uiMotion ?? DEFAULTS.uiMotion;
      const ease = motion > 0 ? 0.10 : 0.22;

      this.state.light.x += (this.state.targetLight.x - this.state.light.x) * ease;
      this.state.light.y += (this.state.targetLight.y - this.state.light.y) * ease;

      const inertia = motion > 0 ? 0.86 : 0.94;
      this.state.velocity.x *= inertia;
      this.state.velocity.y *= inertia;

      this.state.scrollGlow *= motion > 0 ? 0.9 : 0.94;
      if (this.state.scrollGlow < 0.001) this.state.scrollGlow = 0;

      this.root.style.setProperty('--light-x', `${(this.state.light.x * 100).toFixed(2)}%`);
      this.root.style.setProperty('--light-y', `${(this.state.light.y * 100).toFixed(2)}%`);
      this.root.style.setProperty('--refract-x', `${this.state.velocity.x.toFixed(2)}px`);
      this.root.style.setProperty('--refract-y', `${this.state.velocity.y.toFixed(2)}px`);
      this.root.style.setProperty('--scroll-glow', this.state.scrollGlow.toFixed(3));

      requestAnimationFrame(() => this.tick());
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // UPDATE ACTIVE BUTTONS
  // ═══════════════════════════════════════════════════════════════

  function updateActiveButtons() {
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      const isActive = btn.dataset.theme === settings.theme;
      btn.classList.toggle('active', isActive);
    });
    
    // Spacing buttons
    document.querySelectorAll('.spacing-btn').forEach(btn => {
      const isActive = btn.dataset.spacing === settings.spacing;
      btn.classList.toggle('active', isActive);
    });
  }

  function ensureLensModeToggleExists() {
    const controls = document.querySelector('.bani-controls');
    if (!controls) return;

    let btn = document.getElementById('lensModeToggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'lensModeToggle';
      btn.type = 'button';
      btn.className = 'control-toggle';
      btn.dataset.active = 'false';
      btn.innerHTML = '<span>Lens</span>';
      controls.appendChild(btn);
    }

    lensModeToggle = btn;
    lensModeToggle.dataset.active = String(settings.lensMode === true);

    if (lensModeToggle.dataset.bound !== 'true') {
      lensModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        settings.lensMode = !(settings.lensMode === true);
        applySettings();
        saveSettings();
        initLensModeIfEnabled();
      });
      lensModeToggle.dataset.bound = 'true';
    }
  }

  function initLensModeIfEnabled() {
    const isLens = document.body && document.body.classList.contains('lens-mode');
    const container = document.getElementById('versesContainer');

    if (!isLens) {
      LensEngine.destroy();
      document.querySelectorAll('.verse').forEach((el) => {
        el.classList.remove('pankti-active');
        el.style.removeProperty('--lens-intensity');
        el.style.removeProperty('--lens-glow');
        el.style.removeProperty('--lens-ca');
        el.style.removeProperty('--lens-shift-x');
        el.style.removeProperty('--lens-shift-y');
      });
      document.querySelector('.lens-background')?.remove();
      document.querySelector('.lens-glass-bars')?.remove();
      return;
    }

    if (!container) return;
    LensEngine.init(container);
  }

  // ═══════════════════════════════════════════════════════════════
  // SAVE/LOAD FROM LOCAL STORAGE
  // ═══════════════════════════════════════════════════════════════

  function saveSettings() {
    try {
      localStorage.setItem('baniSettings', JSON.stringify(settings));
      console.log('💾 Settings saved');
    } catch (e) {
      console.warn('Could not save settings:', e);
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('baniSettings');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Validate theme exists
        if (parsed.theme && !THEMES.includes(parsed.theme)) {
          parsed.theme = DEFAULTS.theme;
        }
        settings = { ...DEFAULTS, ...parsed };
        console.log('📂 Settings loaded:', settings);
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
      settings = { ...DEFAULTS };
    }

    settings.lensMode = settings.lensMode === true;
    settings.glassGlow = clampNumber(settings.glassGlow, 0, 0.8, DEFAULTS.glassGlow);
    settings.edgeChroma = clampNumber(settings.edgeChroma, 0, 0.8, DEFAULTS.edgeChroma);
    settings.uiMotion = clampNumber(settings.uiMotion, 0, 1, DEFAULTS.uiMotion);
    if (typeof settings.ripples !== 'boolean') settings.ripples = DEFAULTS.ripples;

    applySettings();
  }

  // ═══════════════════════════════════════════════════════════════
  // SIZE ADJUSTMENT
  // ═══════════════════════════════════════════════════════════════

  function adjustSize(target, action) {
    const key = `${target}Size`;
    const limits = SIZE_LIMITS[target];
    
    if (!limits || settings[key] === undefined) {
      console.warn('Unknown size target:', target);
      return;
    }
    
    const step = 2;
    
    if (action === 'increase' && settings[key] < limits.max) {
      settings[key] = Math.min(settings[key] + step, limits.max);
    } else if (action === 'decrease' && settings[key] > limits.min) {
      settings[key] = Math.max(settings[key] - step, limits.min);
    }
    
    applySettings();
    saveSettings();
  }

  // ═══════════════════════════════════════════════════════════════
  // THEME CHANGE
  // ═══════════════════════════════════════════════════════════════

  function setTheme(themeName) {
    if (THEMES.includes(themeName)) {
      settings.theme = themeName;
      applyOpticalDefaultsForTheme(themeName);
      applySettings();
      saveSettings();
      
      // Add transition effect
      document.body.style.transition = 'background 0.5s ease, color 0.3s ease';
      setTimeout(() => {
        document.body.style.transition = '';
      }, 500);
      
      console.log('🎨 Theme changed to:', themeName);
    } else {
      console.warn('Unknown theme:', themeName);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SPACING CHANGE
  // ═══════════════════════════════════════════════════════════════

  function setSpacing(spacingName) {
    const validSpacing = ['compact', 'normal', 'relaxed'];
    if (validSpacing.includes(spacingName)) {
      settings.spacing = spacingName;
      applySettings();
      saveSettings();
      console.log('📏 Spacing changed to:', spacingName);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RESET TO DEFAULTS
  // ═══════════════════════════════════════════════════════════════
  
  function resetToDefaults() {
    settings = { ...DEFAULTS };
    applySettings();
    saveSettings();
    
    // Visual feedback
    if (resetSettings) {
      const originalHTML = resetSettings.innerHTML;
      resetSettings.innerHTML = '<i class="fas fa-check"></i> Reset Complete!';
      resetSettings.style.background = 'var(--success-color)';
      resetSettings.style.borderColor = 'var(--success-color)';
      resetSettings.style.color = '#fff';
      
      setTimeout(() => {
        resetSettings.innerHTML = originalHTML;
        resetSettings.style.background = '';
        resetSettings.style.borderColor = '';
        resetSettings.style.color = '';
      }, 1500);
    }
    
    console.log('🔄 Settings reset to defaults');
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════
  
  function setupEventListeners() {
    // Open/Close panel
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
      });
    }
    
    if (settingsClose) {
      settingsClose.addEventListener('click', (e) => {
        e.preventDefault();
        closeSettings();
      });
    }
    
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', closeSettings);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsPanel && settingsPanel.classList.contains('visible')) {
        closeSettings();
      }
    });
    
    // Size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const target = btn.dataset.target;
        if (action && target) {
          adjustSize(target, action);
          
          // Add click animation
          btn.style.transform = 'scale(0.9)';
          setTimeout(() => {
            btn.style.transform = '';
          }, 100);
        }
      });
    });
    
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = btn.dataset.theme;
        if (theme) {
          setTheme(theme);
        }
      });
    });
    
    // Spacing buttons
    document.querySelectorAll('.spacing-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const spacing = btn.dataset.spacing;
        if (spacing) {
          setSpacing(spacing);
        }
      });
    });
    
    // Reset button
    if (resetSettings) {
      resetSettings.addEventListener('click', (e) => {
        e.preventDefault();
        resetToDefaults();
      });
    }

    if (glassGlowSlider) {
      glassGlowSlider.addEventListener('input', () => {
        settings.glassGlow = clampNumber(glassGlowSlider.value, 0, 0.8, DEFAULTS.glassGlow);
        applySettings();
        saveSettings();
      });
    }

    if (edgeChromaSlider) {
      edgeChromaSlider.addEventListener('input', () => {
        settings.edgeChroma = clampNumber(edgeChromaSlider.value, 0, 0.8, DEFAULTS.edgeChroma);
        applySettings();
        saveSettings();
      });
    }

    if (uiMotionSlider) {
      uiMotionSlider.addEventListener('input', () => {
        settings.uiMotion = clampNumber(uiMotionSlider.value, 0, 1, DEFAULTS.uiMotion);
        applySettings();
        saveSettings();
      });
    }

    if (ripplesToggle) {
      ripplesToggle.addEventListener('click', () => {
        settings.ripples = !(settings.ripples ?? DEFAULTS.ripples);
        ripplesToggle.dataset.on = String(settings.ripples);
        saveSettings();
      });
    }

    console.log('🎛️ Event listeners attached');
  }

  // ═══════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS (Optional)
  // ═══════════════════════════════════════════════════════════════

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + , to open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        if (settingsPanel && settingsPanel.classList.contains('visible')) {
          closeSettings();
        } else {
          openSettings();
        }
      }
      
      // Ctrl/Cmd + 0 to reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetToDefaults();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API (for external access if needed)
  // ═══════════════════════════════════════════════════════════════

  window.BaniSettings = {
    open: openSettings,
    close: closeSettings,
    setTheme: setTheme,
    setSpacing: setSpacing,
    reset: resetToDefaults,
    getSettings: () => ({ ...settings }),
    getThemes: () => [...THEMES]
  };

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZE
  // ═══════════════════════════════════════════════════════════════
  
  function init() {
    initDOMReferences();
    ensureOpticalControlsExist();
    initDOMReferences();
    loadSettings();
    ensureLensModeToggleExists();
    setupEventListeners();
    setupKeyboardShortcuts();
    OpticalEngine.init();
    initLensModeIfEnabled();
    console.log('⚙️ Settings panel initialized with theme:', settings.theme);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();