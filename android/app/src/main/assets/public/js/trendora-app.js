/* ANHAD — TRENDORA-INSPIRED PREMIUM APPLICATION LOGIC V2 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // § 1. CENTRALIZED STORE
  // No more 12 localStorage keys with 3 naming conventions.
  // ═══════════════════════════════════════════════════════════════════════════
  const Store = {
    _cache: {},

    get(key, fallback = null) {
      if (this._cache[key] !== undefined) return this._cache[key];
      try {
        const data = localStorage.getItem(key);
        if (data === null) return fallback;
        const parsed = JSON.parse(data);
        this._cache[key] = parsed;
        return parsed;
      } catch (e) {
        return fallback;
      }
    },

    set(key, value) {
      try {
        this._cache[key] = value;
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* storage full or private browsing */ }
    },

    clearCache() {
      this._cache = {};
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 2. STORAGE KEYS — Single source of truth
  // ═══════════════════════════════════════════════════════════════════════════
  const KEYS = {
    NITNEM_LOG: 'nitnemTracker_nitnemLog',
    NITNEM_STREAK: 'anhad_streak_data',
    NITNEM_USER: 'nitnemTracker_userData',
    NITNEM_SELECTED: 'nitnemTracker_selectedBanis',
    POTHI_ORDER: 'anhad_my_pothi',
    POTHI_COMPLETED: 'anhad_my_pothi_completed',
    SEHAJ_STATE: 'sehajPaathState',
    SEHAJ_STATS: 'sehajPaathStats',
    SEHAJ_BACKUP: 'gurbani_sehajPaath_progress',
    NAAM_HISTORY: 'naam_abhyas_history',
    NAAM_SCHEDULE: 'naam_abhyas_schedule',
    NAAM_CONFIG: 'naam_abhyas_config',
    REMINDERS: 'smart_reminders_v1',
    INSTALL_DISMISSED: 'installBannerDismissed',
    INSTALL_FIRST_SEEN: 'installBannerFirstSeen',
    PWA_INSTALLED: 'pwaInstalled',
    WELCOME_SEEN: 'anhad_welcome_seen',
    SESSION_ACTIVE: 'anhad_session_active',
    DARK_MODE: 'anhad_dark_mode',
    HUKAM_CACHE: 'gurbani_hukamnama_cache',
    HUKAM_FAVORITES: 'gurbani_hukamnama_favorites',
    NOTES: 'gurbani_notes_v2',
    USER_PROFILE: 'anhad_user_profile',
    STREAK_SAVER: 'nitnemTracker_streakSaver'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 3. NAVIGATION PATHS
  // ═══════════════════════════════════════════════════════════════════════════
  const NAV_PATHS = {
    gurbaniRadio: 'GurbaniRadio/gurbani-radio.html?stream=darbar&autoplay=true',
    gurbaniRadioAlt: 'GurbaniRadio/gurbani-radio.html?stream=amritvela&autoplay=true',
    gurbaniRadioSimran: 'GurbaniRadio/gurbani-radio.html?stream=simran&autoplay=true',
    hukamnama: 'Hukamnama/daily-hukamnama.html',
    shabadVichar: 'ShabadVichar/shabad-vichar.html',
    nitnem: 'nitnem/index.html',
    sehajPaath: 'SehajPaath/sehaj-paath.html',
    gurbaniKhoj: 'GurbaniKhoj/gurbani-khoj.html',
    naamAbhyas: 'NaamAbhyas/naam-abhyas.html',
    calendar: 'Calendar/GurpurabCalendar-ios.html',
    nitnemTracker: 'NitnemTracker/nitnem-tracker.html',
    reminders: 'reminders/smart-reminders-v7.html',
    notes: 'Notes/notes.html',
    insights: 'Insights/insights.html',
    favorites: 'Favorites/favorites.html',
    profile: 'Dashboard/dashboard.html',
    homepage: 'Homepage/ios-homepage.html'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 4. NAVIGATION — Page Transitions (No White Flash)
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * Element-scoped bind guard.
   *
   * smooth-navigation.js replaces #app.innerHTML wholesale on every SPA
   * arrival, so a FRESH node legitimately needs re-binding even though every
   * window-level flag in this realm still says "initialized". Keying the guard
   * on the NODE makes it reset exactly when it should: a new node has no
   * expando, a surviving node keeps its binding.
   *
   * An expando, deliberately NOT dataset. smooth-navigation.js:217 does
   * cachePage(currentActiveUrl, document.documentElement.outerHTML) — it
   * serializes the LIVE DOM into PAGE_CACHE. A dataset write becomes a real
   * attribute, is baked into that cached HTML, and gets replayed onto a
   * brand-new node later, convincing mount() it was already bound and
   * reintroducing the exact bug this guards against. Expandos never serialize.
   *
   * Same shape as the existing slider._anhadSliderBound below,
   * homepage-data.js' el._navBound, and anhad-core.js' btn._anhadBackWired.
   */
  function bindOnce(el, key) {
    if (!el) return false;
    const k = '__anhadBound_' + key;
    if (el[k]) return false;
    el[k] = true;
    return true;
  }

  const Navigation = {
    _exitTimer: null,
    _safetyTimer: null,

    navigateTo(path) {
      if (window.navigateTo) {
        window.navigateTo(path);
        return;
      }
      const app = document.querySelector('.app');
      if (app) {
        app.classList.add('app--exiting');
        this._exitTimer = setTimeout(() => { window.location.href = path; }, 180);
      } else {
        window.location.href = path;
      }
    },

    _clearTimers() {
      if (this._exitTimer) {
        clearTimeout(this._exitTimer);
        this._exitTimer = null;
      }
      if (this._safetyTimer) {
        clearTimeout(this._safetyTimer);
        this._safetyTimer = null;
      }
    },

    bindCard(elementId, path) {
      const el = document.getElementById(elementId);
      if (!el) return;
      // Per-node guard: mount() runs on EVERY Home entry, but a node that
      // survived the entry (hard load, bfcache restore) must not collect a
      // second click/keydown pair.
      if (!bindOnce(el, 'nav')) return;
      el.addEventListener('click', (e) => {
        if (e.target.closest('button[data-action]') || e.target.closest('a[href]')) return;
        e.preventDefault();
        this.navigateTo(path);
      });
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.navigateTo(path);
        }
      });
    }
  };

  // Module-level (not inside any function) listener registrations below.
  //
  // CORRECTION: an earlier version of this comment claimed the file is 'no
  // longer a SHELL_SCRIPTS entry' and re-executes on every SPA arrival. That
  // is wrong, and believing it is what hid the Home-lifecycle bug for so long.
  // trendora-app.js IS listed in smooth-navigation.js's SHELL_SCRIPTS (:261),
  // and its <script> tag sits OUTSIDE #app (index.html:3504) so the innerHTML
  // swap never removes it — meaning executePageScripts() finds it already
  // loaded and skips it, and this IIFE runs ONCE per realm on the ordinary
  // path. App.init() is never re-entered; App.mount() is what runs per arrival.
  //
  // The guard below is still required, because the skip is conditional on
  // isScriptAlreadyLoaded(): arriving at Home from a HARD-REFRESHED Insights,
  // where this file was never loaded, does inject and execute it a second time
  // in the same realm. { once: true } does NOT substitute for the guard — SPA
  // navigation uses history.pushState, which never fires 'pagehide'.
  // Confirmed via real-browser testing: anhad_page_changed's listener count
  // grew 8->14 across 6 Home<->Insights cycles, meaning a single dispatched
  // event was firing refreshAll() that many times over.
  const _trendoraModuleListenersAlreadyBound = window.__anhadTrendoraModuleListenersBound;
  window.__anhadTrendoraModuleListenersBound = true;

  if (!_trendoraModuleListenersAlreadyBound) {
  // NOT { once: true }. Every non-shell link out of Home (Nitnem, Gurbani
  // Radio, Sehaj Paath, Hukamnama) is a full document navigation, so
  // smooth-navigation.js's runPageCleanup() never fires for it — pagehide is
  // the only teardown hook on that path, and it has to keep working for the
  // whole session. { once: true } removed itself after the first departure,
  // which is also why pagehide firing on a backgrounded mobile PWA silently
  // disarmed it for good.
  window.addEventListener('pagehide', () => {
    if (Navigation._exitTimer) {
      clearTimeout(Navigation._exitTimer);
      Navigation._exitTimer = null;
    }
    if (Navigation._safetyTimer) {
      clearTimeout(Navigation._safetyTimer);
      Navigation._safetyTimer = null;
    }
    // Only tear down Home's own timers/observers, never another page's.
    try { if (isOnHome()) App.unmount(); } catch (e) {}
  });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // § 5. CONTEXTUAL GURBANI GREETING
  // ═══════════════════════════════════════════════════════════════════════════
  const Greeting = {
    _tuks: {
      amritvela: [
        { gurmukhi: 'ਜਾਗ ਲੇਹੁ ਰੇ ਮਨਾ ਜਾਗ ਲੇਹੁ ਕਹਾ ਗਾਫਲ ਸੋਇਆ', translation: 'Wake up, O my mind! Wake up! Why are you sleeping unaware?' },
        { gurmukhi: 'ਕੁਰਬਾਣੁ ਜਾਈ ਉਸੁ ਵੇਲਾ ਸੁਹਾਵੀ ਜਿਤੁ ਤੁਮਰੈ ਦੁਆਰੈ ਆਇਆ', translation: 'I am a sacrifice to that beautiful time, when I come to Your Door.' },
        { gurmukhi: 'ਚੋਜੀ ਮੇਰੇ ਗੋਵਿੰਦਾ ਚੋਜੀ ਮੇਰੇ ਪਿਆਰਿਆ ਹਰਿ ਪ੍ਰਭੁ ਮੇਰਾ ਚੋਜੀ ਜੀਉ', translation: 'Playful is my Lord of the Universe, Playful is my Beloved. My Lord God is Playful.' }
      ],
      morning: [
        { gurmukhi: 'ਹਰਿ ਕੀ ਵਡਿਆਈ ਦੇਖਹੁ ਸੰਤਹੁ ਹਰਿ ਨਿਮਾਣਿਆ ਮਾਣੁ ਦੇਵਾਏ', translation: 'Behold the glorious greatness of the Lord, O Saints; the Lord bestows honor upon the dishonored.' },
        { gurmukhi: 'ਏ ਮਨ ਹਰਿ ਜੀ ਧਿਆਇ ਤੂ ਇਕ ਮਨਿ ਇਕ ਚਿਤਿ ਭਾਇ', translation: 'O mind, meditate on the Dear Lord, with single-minded consciousness and loving focus.' },
        { gurmukhi: 'ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ ਜੀਉ ॥੫॥', translation: 'The One Name is the Lord\'s Command; O Nanak, the True Guru has given me this understanding.' }
      ],
      afternoon: [
        { gurmukhi: 'ਓਇ ਸਾਜਨ ਓਇ ਮੀਤ ਪਿਆਰੇ', translation: 'They are my friends, they are my beloved companions.' },
        { gurmukhi: 'ਜੋ ਮਾਗਹਿ ਠਾਕੁਰ ਅਪੁਨੇ ਤੇ ਸੋਈ ਸੋਈ ਦੇਵੈ', translation: 'Whatever one asks of his Lord and Master, He gives that very thing.' },
        { gurmukhi: 'ਹਉ ਬਲਿਹਾਰੀ ਤਿਨ ਕਉ ਜੋ ਗੁਰਮੁਖਿ ਸਿਖਾ', translation: 'I am a sacrifice to those Sikhs who live as Gurmukhs.' }
      ],
      evening: [
        { gurmukhi: 'ਪ੍ਰੀਤਮ ਜਾਨਿ ਲੇਹੁ ਮਨ ਮਾਹੀ', translation: 'O Beloved, please know this in Your Mind.' },
        { gurmukhi: 'ਵਿਣੁ ਮਨੁ ਮਾਰੇ ਕੋਈ ਨ ਸਿਝਈ ਵੇਖਹੁ ਕੋ ਲਿਵ ਲਾਇ', translation: 'Without subduing the mind, no one succeeds; let anyone carefully reflect on this.' },
        { gurmukhi: 'ਰੰਗਿ ਰਤਾ ਮੇਰਾ ਸਾਹਿਬੁ ਰਵਿ ਰਹਿਆ ਭਰਪੂਰਿ', translation: 'Imbued with Love, my Lord and Master is pervading and permeating all. ||1||Pause||' }
      ],
      night: [
        { gurmukhi: 'ਚੇਤਨਾ ਹੈ ਤਉ ਚੇਤ ਲੈ ਨਿਸਿ ਦਿਨਿ ਮੈ ਪ੍ਰਾਨੀ', translation: 'If you are going to become conscious, then be conscious of Him, night and day, O mortal.' },
        { gurmukhi: 'ਮੀਤੁ ਕਰੈ ਸੋਈ ਹਮ ਮਾਨਾ', translation: 'Whatever my Friend does, I accept.' },
        { gurmukhi: 'ਭਉ ਨ ਵਿਆਪੈ ਤੇਰੀ ਸਰਣਾ', translation: 'Fear does not overtake one who seeks Your Sanctuary.' }
      ]
    },

    getSalutation() {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 6) return 'ਵਾਹਿਗੁਰੂ ਜੀ';
      return 'Sat Sri Akal';
    },

    getTimeSlot() {
      const hour = new Date().getHours();
      if (hour >= 2 && hour < 6) return 'amritvela';
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 21) return 'evening';
      return 'night';
    },

    getTuk() {
      const slot = this.getTimeSlot();
      const tuks = this._tuks[slot];
      const randomIndex = Math.floor(Math.random() * tuks.length);
      return tuks[randomIndex];
    },

    update() {
      if (typeof window.syncGreetingHeroArtwork === 'function') {
        window.syncGreetingHeroArtwork();
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 5.1 PORTRAIT SLIDER — Interactive All-Guru Carousel
  // ═══════════════════════════════════════════════════════════════════════════
  // Helper to resolve Guru ID from Gurpurab event
  function getGuruIdFromEvent(event) {
    if (!event) return null;
    const evName = (event.name || '').toLowerCase();
    const evId = (event.id || '').toLowerCase();
    const searchStrings = [evName, evId];

    const mapping = {
      'guru-nanak': 'guru-nanak',
      'nanak': 'guru-nanak',
      'guru-angad': 'guru-angad',
      'angad': 'guru-angad',
      'guru-amar-das': 'guru-amar-das',
      'amar-das': 'guru-amar-das',
      'guru-ram-das': 'guru-ram-das',
      'ram-das': 'guru-ram-das',
      'guru-arjan': 'guru-arjan',
      'arjan': 'guru-arjan',
      'guru-hargobind': 'guru-hargobind',
      'hargobind': 'guru-hargobind',
      'bandi-chhor': 'guru-hargobind',
      'miri-piri': 'guru-hargobind',
      'guru-har-rai': 'guru-har-rai',
      'har-rai': 'guru-har-rai',
      'guru-harkrishan': 'guru-harkrishan',
      'guru-har-krishan': 'guru-harkrishan',
      'harkrishan': 'guru-harkrishan',
      'har-krishan': 'guru-harkrishan',
      'guru-teg-bahadur': 'guru-teg-bahadur',
      'teg-bahadur': 'guru-teg-bahadur',
      'guru-gobind': 'guru-gobind',
      'gobind': 'guru-gobind',
      'gobind-singh': 'guru-gobind',
      'sahibzad': 'guru-gobind',
      'vaisakhi': 'guru-gobind',
      'khalsa': 'guru-gobind',
      'sggs': 'sggs',
      'guru-granth': 'sggs',
      'granth-sahib': 'sggs',
      'first-parkash': 'sggs',
      'sampuranta': 'sggs',
      'granth': 'sggs'
    };

    for (const [key, guruId] of Object.entries(mapping)) {
      if (searchStrings.some(s => s.includes(key))) {
        return guruId;
      }
    }
    return null;
  }

      const PortraitSlider = {
    _currentIndex: 10, // Default to Sri Guru Granth Sahib Ji
    _startX: 0,
    _startY: 0,
    _isMoving: false,
    _eventsBound: false,
    _gurus: [
      { id: 'guru-nanak', name: 'Sri Guru Nanak Dev Sahib Ji', img: 'guruimages/gurunanakdevsahebji.jpeg', pos: 'center 20%', colors: ['#ddcdb3', '#c9b89f', '#b8a88e'] },
      { id: 'guru-angad', name: 'Sri Guru Angad Dev Sahib Ji', img: 'guruimages/guruangaddevsahebji.jpeg', pos: 'center 25%', colors: ['#ab9468', '#e6d8bf', '#624d31'] },
      { id: 'guru-amar-das', name: 'Sri Guru Amar Das Sahib Ji', img: 'guruimages/guruamardasji.jpeg', pos: 'center 25%', colors: ['#e7be7f', '#e4dccd', '#a37f4f'] },
      { id: 'guru-ram-das', name: 'Sri Guru Ram Das Sahib Ji', img: 'guruimages/gururamdassahebji.jpeg', pos: 'center 25%', colors: ['#a97634', '#e3bc7b', '#8b5e28'] },
      { id: 'guru-arjan', name: 'Sri Guru Arjan Dev Sahib Ji', img: 'guruimages/guruarjanddevsahebji.jpeg', gurbani: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥', translation: 'In the Amrit Vela, chant the True Name, and contemplate His Glorious Greatness.', pos: 'center 25%', colors: ['#edeef0', '#e0c195', '#c9a876'] },
      { id: 'guru-hargobind', name: 'Sri Guru Hargobind Sahib Ji', img: 'guruimages/guruhargobindsahebji.jpeg', pos: 'center 25%', colors: ['#ecedef', '#c0c0bf', '#916026'] },
      { id: 'guru-har-rai', name: 'Sri Guru Har Rai Sahib Ji', img: 'guruimages/guruharraisahebji.jpeg', pos: 'center 25%', colors: ['#ac7d3d', '#afab85', '#875515'] },
      { id: 'guru-harkrishan', name: 'Sri Guru Har Krishan Sahib Ji', img: 'guruimages/guruharkrishansahebji.jpeg', pos: 'center 25%', colors: ['#ece5d5', '#d9d0c0', '#c6bbab'] },
      { id: 'guru-teg-bahadur', name: 'Sri Guru Tegh Bahadur Sahib Ji', img: 'guruimages/gurutegbahadursahebji.jpeg', pos: 'center 45%', colors: ['#2f3d46', '#4a5a63', '#5d6d76'] },
      { id: 'guru-gobind', name: 'Sri Guru Gobind Singh Sahib Ji', img: 'guruimages/gurugobindsinghsahebji.jpeg', pos: 'center 25%', colors: ['#b77928', '#e1cdac', '#8e5f1f'] },
      { id: 'sggs', name: 'Sri Guru Granth Sahib Ji', img: 'guruimages/gurugranthsahebji.jpeg', pos: 'center 25%', colors: ['#a06f2c', '#53371e', '#c89035'] }
    ],

    init() {
      const track = document.getElementById('guruSliderTrack');
      if (!track) return;
      
      // If track has no slides, generate them
      if (track.children.length === 0) {
        track.innerHTML = '';
        this._gurus.forEach((guru, i) => {
          const slide = document.createElement('div');
          slide.className = 'greeting__slide';
          slide.setAttribute('data-guru', guru.id);
          slide.setAttribute('data-index', i);
          slide.innerHTML = `
            <div class="greeting__guru-portrait">
              <img src="${guru.img}" alt="${guru.name}" style="object-position: ${guru.pos || 'center 25%'}; pointer-events: none; -webkit-user-drag: none; user-select: none;" loading="lazy" draggable="false">
            </div>
          `;
          track.appendChild(slide);
        });
      }

      // Bind click on all slides
      const slides = track.querySelectorAll('.greeting__slide');
      slides.forEach((slide, i) => {
        slide.onclick = (e) => {
          e.stopPropagation();
          this._currentIndex = i;
          this.update();
        };
      });

      this._renderDots();
      this._bindEvents();
      this.update(true);
    },

    _renderDots() {
      const dotsContainer = document.getElementById('guruDots');
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      this._gurus.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = `greeting__dot ${i === this._currentIndex ? 'greeting__dot--active' : ''}`;
        dot.setAttribute('data-index', i);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this._currentIndex = i;
          this.update();
        });
        dotsContainer.appendChild(dot);
      });
    },

    _bindEvents() {
      const slider = document.getElementById('guruSlider');

      // Re-bind arrow buttons directly on every call
      const prevBtn = document.getElementById('guruSliderPrev');
      const nextBtn = document.getElementById('guruSliderNext');
      if (prevBtn) {
        prevBtn.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          this.prev();
        };
      }
      if (nextBtn) {
        nextBtn.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          this.next();
        };
      }

      if (this._eventsBound || !slider) return;
      this._eventsBound = true;

      // Touch Events (Mobile/Tablet)
      slider.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        this._startX = e.touches[0].clientX;
        this._startY = e.touches[0].clientY;
        this._isMoving = true;
      }, { passive: true });

      slider.addEventListener('touchmove', (e) => {
        if (!this._isMoving || !e.touches || e.touches.length === 0) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - this._startX;
        const deltaY = currentY - this._startY;

        if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            this.next();
          } else {
            this.prev();
          }
          this._startX = currentX;
          this._startY = currentY;
          this._isMoving = false;
        }
      }, { passive: true });

      slider.addEventListener('touchend', () => {
        this._isMoving = false;
      }, { passive: true });

      // Mouse Events (Desktop)
      slider.addEventListener('mousedown', (e) => {
        this._startX = e.clientX;
        this._startY = e.clientY;
        this._isMoving = true;
      });

      window.addEventListener('mousemove', (e) => {
        if (!this._isMoving) return;
        const deltaX = e.clientX - this._startX;
        const deltaY = e.clientY - this._startY;

        if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            this.next();
          } else {
            this.prev();
          }
          this._startX = e.clientX;
          this._startY = e.clientY;
          this._isMoving = false;
        }
      });

      window.addEventListener('mouseup', () => {
        this._isMoving = false;
      });
    },

    next() {
      this._currentIndex = (this._currentIndex + 1) % this._gurus.length;
      this.update();
    },

    prev() {
      this._currentIndex = (this._currentIndex - 1 + this._gurus.length) % this._gurus.length;
      this.update();
    },

    setGuruById(idOrEvent) {
      let guruId = null;
      if (idOrEvent && typeof idOrEvent === 'object') {
        guruId = getGuruIdFromEvent(idOrEvent);
      } else if (typeof idOrEvent === 'string') {
        guruId = getGuruIdFromEvent({ id: idOrEvent });
        if (!guruId) {
          guruId = idOrEvent;
        }
      }
      if (!guruId) return;

      const idx = this._gurus.findIndex(g => g.id === guruId);
      if (idx !== -1 && idx !== this._currentIndex) {
        this._currentIndex = idx;
        this.update(true);
      }
    },

    update(immediate = false) {
      const slides = document.querySelectorAll('.greeting__slide');
      const total = this._gurus.length;

      slides.forEach((slide, i) => {
        slide.classList.remove('greeting__slide--active', 'greeting__slide--prev', 'greeting__slide--next', 'greeting__slide--far-prev', 'greeting__slide--far-next');

        let diff = i - this._currentIndex;
        if (diff < -total / 2) diff += total;
        if (diff > total / 2) diff -= total;

        if (diff === 0) {
          slide.classList.add('greeting__slide--active');
        } else if (diff === -1) {
          slide.classList.add('greeting__slide--prev');
        } else if (diff === 1) {
          slide.classList.add('greeting__slide--next');
        } else if (diff === -2) {
          slide.classList.add('greeting__slide--far-prev');
        } else if (diff === 2) {
          slide.classList.add('greeting__slide--far-next');
        }
        // slides with Math.abs(diff) > 2 stay completely hidden with no active/prev/next class
      });

      // Update dots
      const dots = document.querySelectorAll('.greeting__dot');
      dots.forEach((dot, i) => {
        if (i === this._currentIndex) {
          dot.classList.add('greeting__dot--active');
        } else {
          dot.classList.remove('greeting__dot--active');
        }
      });

      const current = this._gurus[this._currentIndex];
      if (current) {
        const salEl = document.getElementById('greetingSalutation');
        const gurEl = document.getElementById('greetingGurbani');
        const transEl = document.getElementById('greetingTranslation');
        if (salEl) salEl.textContent = current.name;
        if (gurEl) gurEl.textContent = current.gurbani || 'ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ ਜੀਉ ॥੫॥';
        if (transEl) transEl.textContent = current.translation || "The One Name is the Lord's Command; O Nanak, the True Guru has given me this understanding.";
      }
    },

    _updateOrbColors() {
      return;
    },

    _syncText() {
      this.update();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 6. DATA MANAGER — Real Data, No Fabrication
  // ═══════════════════════════════════════════════════════════════════════════
  const DataManager = {
    getTotalBanis() {
      // Read from My Pothi order (user's custom bani collection)
      const pothiOrder = Store.get(KEYS.POTHI_ORDER);
      if (pothiOrder && Array.isArray(pothiOrder) && pothiOrder.length > 0) {
        return pothiOrder.length;
      }
      
      // Fallback to Nitnem Tracker if Pothi is empty
      const selected = Store.get(KEYS.NITNEM_SELECTED);
      if (!selected) return 11;
      const total = (selected.amritvela?.length || 0) +
        (selected.rehras?.length || 0) +
        (selected.sohila?.length || 0);
      return total || 11;
    },

    getCompletedToday() {
      const today = new Date().toLocaleDateString('en-CA');
      
      // Read from My Pothi completion data
      const pothiCompleted = Store.get(KEYS.POTHI_COMPLETED);
      if (pothiCompleted && pothiCompleted[today]) {
        const todayCompleted = pothiCompleted[today];
        return Array.isArray(todayCompleted) ? todayCompleted.length : 0;
      }
      
      // Fallback to Nitnem Tracker log
      const log = Store.get(KEYS.NITNEM_LOG);
      if (!log || !log[today]) return 0;
      const todayData = log[today];
      if (Array.isArray(todayData)) return todayData.length;
      if (typeof todayData === 'object') {
        return (todayData.amritvela?.length || 0) +
          (todayData.rehras?.length || 0) +
          (todayData.sohila?.length || 0);
      }
      return 0;
    },

    getStreak() {
      // 1. Check for active streak saver (highest priority)
      const saverData = Store.get(KEYS.STREAK_SAVER);
      if (saverData && !saverData.completed) {
        return {
          count: saverData.brokenStreak || 0,
          isSaved: true,
          isPending: true
        };
      }
      let streak = 0;
      const streakData = Store.get(KEYS.NITNEM_STREAK);
      if (streakData) {
        streak = streakData.current || streakData.currentStreak || 0;
      }
      if (streak === 0) {
        const userData = Store.get(KEYS.NITNEM_USER);
        if (userData) {
          streak = userData.streaks?.current || userData.streak?.current || 0;
        }
      }
      return { count: streak, isSaved: false, isPending: false };
    },

    getSehajPaath() {
      let currentAng = 1;
      const state = Store.get(KEYS.SEHAJ_STATE);
      if (state) currentAng = state.currentPaath?.currentAng || state.currentAng || 1;
      if (currentAng <= 1) {
        const backup = Store.get(KEYS.SEHAJ_BACKUP);
        if (backup) currentAng = backup.data?.currentAng || backup.currentAng || 1;
      }
      const totalAngs = 1430;
      const progress = ((currentAng / totalAngs) * 100).toFixed(1);
      const remaining = totalAngs - currentAng + 1;
      return { currentAng, totalAngs, progress, remaining, hasStarted: currentAng > 1 };
    },

    getNaamAbhyas() {
      let lastSession = null, completedToday = 0, totalSessions = 0, nextHour = null;
      const history = Store.get(KEYS.NAAM_HISTORY);
      if (history) {
        const today = new Date().toLocaleDateString('en-CA');
        if (history.daily && history.daily[today]) completedToday = history.daily[today].completed || 0;
        if (history.sessions && history.sessions.length > 0) {
          const sorted = [...history.sessions].sort((a, b) => new Date(b.endTime || b.date) - new Date(a.endTime || a.date));
          lastSession = sorted[0];
        }
        totalSessions = history.totalCompleted || 0;
      }
      const schedule = Store.get(KEYS.NAAM_SCHEDULE);
      if (schedule && typeof schedule === 'object') {
        const now = new Date();
        const startHour = now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours();
        for (let h = startHour; h < 24; h++) {
          if (schedule[h] && schedule[h].status === 'pending') { nextHour = h; break; }
        }
      }
      return { lastSession, completedToday, totalSessions, nextHour };
    },

    getHukamDate() {
      return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    async getNextGurpurab() {
      try {
        const nameFilter = localStorage.getItem('gurpurab_name_filter') || 'guru-sahib';
        const dataUrl = (window.ANHAD_ROOT || '') + 'data/gurpurab-events-2026.json';
        let data = null;
        try {
          const response = await fetch(dataUrl);
          if (response.ok) data = await response.json();
        } catch (e) {
          console.warn('[DataManager] Fetch failed, using fallback calendar data:', e);
        }
        if (!data || !data.years) {
          data = {
            years: {
              '2026': [
                { id: 'sampuranta-sggs-2026', name_en: 'Sampuranta Diwas Sri Guru Granth Sahib Ji', name_pa: 'ਸੰਪੂਰਨਤਾ ਦਿਵਸ ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ', gregorian_date: '2026-08-30', type: 'historical' },
                { id: 'first-parkash-sggs', name_en: 'First Parkash Sri Guru Granth Sahib Ji', name_pa: 'ਪਹਿਲਾ ਪ੍ਰਕਾਸ਼ ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ', gregorian_date: '2026-09-12', type: 'parkash' },
                { id: 'gurpurab-guru-nanak', name_en: 'Prakash Purab Sri Guru Nanak Dev Ji', name_pa: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ', gregorian_date: '2026-11-24', type: 'gurpurab' }
              ]
            }
          };
        }
        const guruNames = [
          'guru nanak', 'ਗੁਰੂ ਨਾਨਕ', 
          'guru angad', 'ਗੁਰੂ ਅੰਗਦ', 
          'guru amar das', 'ਗੁਰੂ ਅਮਰ ਦਾਸ', 
          'guru ram das', 'ਗੁਰੂ ਰਾਮ ਦਾਸ', 
          'guru arjan', 'ਗੁਰੂ ਅਰਜਨ', 
          'guru har gobind', 'ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ', 'guru hargobind', 'ਗੁਰੂ ਹਰਗੋਬਿੰਦ', 
          'guru har rai', 'ਗੁਰੂ ਹਰਿ ਰਾਇ', 
          'guru har krishan', 'ਗੁਰੂ ਹਰਿ ਕ੍ਰਿਸ਼ਨ', 'guru harkrishan', 'ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ', 
          'guru tegh bahadur', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦੁਰ', 'guru teg bahadur', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ',
          'guru gobind singh', 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ',
          'guru granth', 'ਗੁਰੂ ਗ੍ਰੰਥ', 'granth sahib', 'ਗ੍ਰੰਥ ਸਾਹਿਬ', 'sggs', 'sampuranta', 'first-parkash'
        ];
        const events = (data.years['2026'] || [])
          .filter(e => {
            if (e.type?.toLowerCase().includes('dastar') || e.name_en?.toLowerCase().includes('dastar')) return false;
            if (nameFilter === 'guru-sahib') {
              const name = String(e.name_en || '').toLowerCase();
              const namePa = String(e.name_pa || '').toLowerCase();
              const id = String(e.id || '').toLowerCase();
              return guruNames.some(guruName => name.includes(guruName) || namePa.includes(guruName) || id.includes(guruName));
            }
            return true;
          })
          .map(e => {
            const [y, m, d] = e.gregorian_date.split('-');
            return { name: e.name_en, name_pa: e.name_pa, id: e.id, date: new Date(y, m - 1, d), type: e.type, eventCategory: this.classifyEventType(e.type, e.name_en) };
          })
          .sort((a, b) => a.date - b.date);
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEvents = events.filter(g => g.date.getTime() === todayMidnight.getTime());
        if (todayEvents.length > 0) {
          return { events: todayEvents.map(e => ({ name: e.name, id: e.id, daysLeft: 0, dateStr: 'Today', isToday: true, eventCategory: e.eventCategory, type: e.type })), isToday: true, isMultiple: todayEvents.length > 1 };
        } else {
          const upcoming = events.find(g => g.date > todayMidnight);
          if (upcoming) {
            const daysLeft = Math.round((upcoming.date - todayMidnight) / 86400000);
            return { events: [{ name: upcoming.name, id: upcoming.id, daysLeft, dateStr: upcoming.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isToday: false, eventCategory: upcoming.eventCategory, type: upcoming.type }], isToday: false, isMultiple: false };
          }
        }
        return null;
      } catch (e) { return null; }
    },

    classifyEventType(type, eventName = '') {
      const name = String(eventName || '').toLowerCase();
      if (name.includes('jyoti jot') || name.includes('joti jot') || name.includes('ਜੋਤੀ ਜੋਤ') || name.includes('shaheedi') || name.includes('ਸ਼ਹੀਦੀ') || name.includes('barsi')) return 'remembrance';
      const memorialTypes = ['shaheedi', 'historical', 'joti-jot', 'jyoti-jot', 'barsi'];
      if (memorialTypes.includes(String(type).toLowerCase())) return 'remembrance';
      const celebrationTypes = ['prakash', 'gurgaddi', 'janam', 'vaisakhi', 'dastar'];
      if (celebrationTypes.includes(String(type).toLowerCase()) || name.includes('prakash') || name.includes('gurgaddi') || name.includes('ਪ੍ਰਕਾਸ਼') || name.includes('ਗੁਰਗੱਦੀ') || name.includes('vaisakhi') || name.includes('ਵੈਸਾਖੀ')) return 'celebration';
      return 'neutral';
    },

    getNotificationCount() {
      let count = 0;
      try {
        const reminders = Store.get(KEYS.REMINDERS);
        if (reminders) count += reminders.custom?.filter(r => !r.completed)?.length || 0;
      } catch (e) { }
      return count;
    },

    getNitnemTimeSuggestion() {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 9) return 'Morning Banis';
      if (hour >= 17 && hour < 20) return 'Rehras Sahib Ji';
      if (hour >= 20 || hour < 4) return 'Sohila Sahib Ji';
      return 'Daily Prayers';
    },

    getNextBani() {
      const hour = new Date().getHours(), completed = this.getCompletedToday(), total = this.getTotalBanis();
      if (completed >= total) return 'All Complete ✓';
      const today = new Date().toLocaleDateString('en-CA'), log = Store.get(KEYS.NITNEM_LOG), todayData = log ? log[today] : null;
      const doneAmritvela = todayData?.amritvela?.length || (Array.isArray(todayData) ? todayData.length : 0);
      const doneRehras = todayData?.rehras?.length || 0, doneSohila = todayData?.sohila?.length || 0;
      if (hour >= 4 && hour < 17 && doneAmritvela === 0) return 'Morning Banis due';
      if (hour >= 17 && hour < 21 && doneRehras === 0) return 'Rehras Sahib Ji due';
      if ((hour >= 21 || hour < 4) && doneSohila === 0) return 'Sohila Sahib Ji due';
      return `${completed}/${total} done`;
    },

    async getHukamnamaPreview() {
      try {
        const cache = Store.get(KEYS.HUKAM_CACHE), today = new Date().toLocaleDateString('en-CA');
        if (cache && cache.date === today && cache.firstLine) return cache;
        const resp = await fetch('https://api.banidb.com/v2/hukamnamas/today');
        if (!resp.ok) return null;
        const data = await resp.json();
        let firstLine = '', writer = '', ang = null;
        if (data.hukamnamainfo) {
          ang = data.hukamnamainfo.pageno;
          const verses = data.hukamnama || [];
          for (const v of verses) {
            const text = (v.verse || '').trim();
            if (text && text.length > 10 && !text.includes('ਮਹਲਾ') && !text.includes('ਸਲੋਕ')) { firstLine = text; break; }
          }
          if (!firstLine && verses.length > 0) firstLine = (verses[0].verse || '').trim();
          if (verses[0]?.writerId) {
            const writerMap = { 1: 'Guru Nanak Dev Sahib Ji', 2: 'Guru Angad Dev Sahib Ji', 3: 'Guru Amar Das Sahib Ji', 4: 'Guru Ram Das Sahib Ji', 5: 'Guru Arjan Dev Sahib Ji', 6: 'Guru Teg Bahadur Ji' };
            writer = writerMap[verses[0].writerId] || '';
          }
        } else if (data.shabads && data.shabads.length > 0) {
          const info = data.shabads[0]?.shabadInfo || {};
          ang = info.pageNo; writer = info?.writer?.english || '';
          const verses = data.shabads[0]?.verses || [];
          for (const v of verses) {
            const text = (v?.verse?.unicode || '').trim();
            if (text && text.length > 10) { firstLine = text; break; }
          }
        }
        const result = { date: today, firstLine, writer, ang };
        Store.set(KEYS.HUKAM_CACHE, result);
        return result;
      } catch (e) { return null; }
    },

    getNotesCount() {
      const notes = Store.get(KEYS.NOTES, []);
      return Array.isArray(notes) ? notes.length : 0;
    },

    getHukamFavoritesCount() {
      const favs = Store.get(KEYS.HUKAM_FAVORITES, []);
      return Array.isArray(favs) ? favs.length : 0;
    },

    getNaamMinutesToday() {
      const history = Store.get(KEYS.NAAM_HISTORY);
      if (!history || !history.sessions) return 0;
      const today = new Date().toLocaleDateString('en-CA');
      let totalMinutes = 0;
      for (const s of history.sessions) {
        const sDate = (s.endTime || s.date || '').split('T')[0];
        if (sDate === today) totalMinutes += (s.duration || s.durationMinutes || 0);
      }
      return Math.round(totalMinutes);
    },

    getSehajPercent() {
      const data = this.getSehajPaath();
      return { percent: parseFloat(data.progress), remaining: data.remaining, currentAng: data.currentAng, hasStarted: data.hasStarted };
    },

    getUserName() {
      const profile = Store.get(KEYS.USER_PROFILE);
      return profile?.name || profile?.displayName || null;
    },

    getNanakshahiDate() {
      const date = new Date(), year = date.getFullYear(), nanakshahiEpoch = new Date(year, 2, 14), diffTime = date - nanakshahiEpoch, diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const monthNames = ['ਚੇਤ', 'ਵੈਸਾਖ', 'ਜੇਠ', 'ਹਾੜ', 'ਸਾਵਣ', 'ਭਾਦੋਂ', 'ਅੱਸੂ', 'ਕੱਤਕ', 'ਮੱਘਰ', 'ਪੋਹ', 'ਮਾਘ', 'ਫੱਗਣ'], monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];
      let nanakshahiYear = year - 1468, nMonth = 0, nDay = 1;
      if (diffDays < 0) {
        nanakshahiYear--;
        let rem = 365 + diffDays;
        for (let i = 0; i < 12; i++) {
          if (rem < monthLengths[i]) { nMonth = i; nDay = rem + 1; break; }
          rem -= monthLengths[i];
        }
      } else {
        let rem = diffDays;
        for (let i = 0; i < 12; i++) {
          if (rem < monthLengths[i]) { nMonth = i; nDay = rem + 1; break; }
          rem -= monthLengths[i];
        }
      }
      return { day: nDay, month: monthNames[nMonth] || monthNames[0], year: nanakshahiYear, formatted: `${nDay} ${monthNames[nMonth] || monthNames[0]} ${nanakshahiYear}` };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 7. UI CONTROLLER — Minimal DOM Updates
  // ═══════════════════════════════════════════════════════════════════════════
  const UIController = {
    _setRing(id, progress) {
      const ring = document.getElementById(id);
      if (!ring) return;
      const circumference = 163.4;
      ring.style.strokeDasharray = circumference;
      const offset = circumference * (1 - Math.min(progress, 1));
      requestAnimationFrame(() => { ring.style.strokeDashoffset = offset; });
    },

    updateNitnemCard() {
      const completed = DataManager.getCompletedToday();
      const total = DataManager.getTotalBanis();
      const streakInfo = DataManager.getStreak();
      const streak = streakInfo.count;
      const isSaved = streakInfo.isSaved;
      const suggestion = DataManager.getNitnemTimeSuggestion();
      const statusEl = document.getElementById('nitnemStatus');
      const streakEl = document.getElementById('nitnemStreak');
      const checkEl = document.getElementById('nitnemCheck');

      // Update progress ring
      this._setRing('nitnemRing', completed / total);

      if (statusEl) {
        if (completed >= total) {
          statusEl.textContent = '✓ Complete';
          statusEl.className = 'practice-card__status practice-card__status--active';
        } else if (completed > 0) {
          statusEl.textContent = `${completed}/${total} done`;
          statusEl.className = 'practice-card__status practice-card__status--accent';
        } else {
          statusEl.textContent = suggestion;
          statusEl.className = 'practice-card__status';
        }
      }

      if (checkEl) {
        checkEl.classList.toggle('practice-card__check--visible', completed >= total);
      }

      // Streak in quick access
      if (streakEl) {
        if (isSaved) {
          streakEl.innerHTML = `<span class="quick-card__streak saved">🛡️ ${streak} Day Streak</span>`;
          const card = document.getElementById('nitnemTrackerCard');
          if (card) card.classList.add('streak-saved');
        } else if (streak > 0) {
          streakEl.innerHTML = `<span class="quick-card__streak">🔥 ${streak} day${streak > 1 ? 's' : ''}</span>`;
          const card = document.getElementById('nitnemTrackerCard');
          if (card) card.classList.remove('streak-saved');
        } else if (completed > 0) {
          streakEl.innerHTML = `<span class="quick-card__progress">${completed}/${total}</span>`;
        } else {
          streakEl.innerHTML = '<span class="quick-card__progress">Start today</span>';
        }
      }
    },

    updateSehajCard() {
      const data = DataManager.getSehajPercent();
      const statusEl = document.getElementById('sehajStatus');

      // Update progress ring
      this._setRing('sehajRing', data.currentAng / 1430);

      if (statusEl) {
        if (data.hasStarted) {
          statusEl.textContent = `Ang ${data.currentAng} · ${data.percent}%`;
          statusEl.className = 'practice-card__status practice-card__status--accent';
        } else {
          statusEl.textContent = 'Begin journey';
          statusEl.className = 'practice-card__status';
        }
      }
    },

    async updateHukamCard() {
      // Claimed BEFORE the await. smooth-navigation.js can replace
      // #app.innerHTML while this fetch is in flight (trivially reproducible on
      // a slow connection), and the old code captured statusEl up here and
      // wrote to it afterwards — landing the result on a detached node while
      // the live Hukamnama card kept its shipped placeholder text. That is one
      // of the ways the Practice cards came back looking wrong.
      const epoch = window.__anhadNavEpoch || 0;
      let statusEl = document.getElementById('hukamStatus');

      // Show date initially, and clear any styling a previous BaniDB hit left
      // behind — these three were set on success and never reset, so a later
      // fallback to the plain date rendered in 10px Gurmukhi.
      if (statusEl) {
        statusEl.textContent = DataManager.getHukamDate();
        statusEl.className = 'practice-card__status';
        statusEl.style.fontFamily = '';
        statusEl.style.fontSize = '';
        statusEl.style.lineHeight = '';
      }

      // Then try to load and show first line from BaniDB
      const preview = await DataManager.getHukamnamaPreview();
      if ((window.__anhadNavEpoch || 0) !== epoch) return; // navigated away mid-fetch
      statusEl = document.getElementById('hukamStatus');     // re-resolve: may be a new node
      if (preview && preview.firstLine && statusEl) {
        const truncated = preview.firstLine.length > 30 ? preview.firstLine.substring(0, 30) + '…' : preview.firstLine;
        statusEl.textContent = truncated;
        statusEl.className = 'practice-card__status practice-card__status--accent';
        statusEl.style.fontFamily = 'var(--font-gurmukhi)';
        statusEl.style.fontSize = '10px';
        statusEl.style.lineHeight = '1.5';
      }
    },

    _renderEventData(data) {
      const titleEl = document.getElementById('eventTitle');
      const dateEl = document.getElementById('eventDate');
      const countEl = document.getElementById('eventCountdown');
      const labelEl = document.getElementById('eventCountdownLabel');
      const eyebrowEl = document.querySelector('.event-card__eyebrow');
      const card = document.getElementById('eventCard');

      if (!data || !data.events || data.events.length === 0) {
        if (card) card.style.display = 'none';
        return;
      }

      // Clear any existing rotation interval.
      //
      // Tracked on window, NOT as card._rotationInterval. The handle used to
      // live on the #eventCard node while the cleanup re-queried
      // getElementById('eventCard') — which, after smooth-navigation.js
      // replaces #app.innerHTML, returns the NEW node whose property is
      // undefined. The old detached node's interval was therefore never
      // cleared and kept firing for the life of the realm, driving
      // PortraitSlider.setGuruById() from a dead card, once more per Home
      // visit. Same trap CarouselController._autoTimer was fixed for.
      if (window.__anhadEventCardRotation) {
        clearInterval(window.__anhadEventCardRotation);
        window.__anhadEventCardRotation = null;
      }

      if (!card) return;
      card.style.display = '';

      // Remove skeleton placeholders from all populated elements
      if (titleEl) titleEl.classList.remove('skeleton');
      if (dateEl) dateEl.classList.remove('skeleton');
      if (countEl) countEl.classList.remove('skeleton');
      if (labelEl) labelEl.classList.remove('skeleton');
      const badgeValueEl = document.getElementById('eventCountdownBadgeValue');
      const badgeLabelEl = document.getElementById('eventCountdownBadgeLabel');
      if (badgeValueEl) badgeValueEl.classList.remove('skeleton');
      if (badgeLabelEl) badgeLabelEl.classList.remove('skeleton');

      const events = data.events;
      let currentIndex = 0;

      // Function to update display for current event
      const updateEventDisplay = (event) => {
        if (titleEl) {
          titleEl.textContent = event.name;
          titleEl.classList.remove('skeleton');
          titleEl.style.fontSize = '';  // Reset any inline styles
          titleEl.style.lineHeight = '';
          titleEl.style.letterSpacing = '';
        }

        // Apply event category styling
        card.classList.remove('event-remembrance', 'event-celebration', 'event-neutral', 'event-today');

        if (event.eventCategory === 'remembrance') {
          card.classList.add('event-remembrance');
        } else if (event.eventCategory === 'celebration') {
          card.classList.add('event-celebration');
        } else {
          card.classList.add('event-neutral');
        }

        if (event.isToday) {
          card.classList.add('event-today');
        }

        // Update eyebrow text
        if (eyebrowEl) {
          eyebrowEl.textContent = event.isToday ? 'TODAY' : 'Upcoming Gurpurab';
        }

        const badgeValueEl = document.getElementById('eventCountdownBadgeValue');
        const badgeLabelEl = document.getElementById('eventCountdownBadgeLabel');
        const celebrationBadge = document.getElementById('gurpurabCelebrationBadge');
        const remembranceBadge = document.getElementById('gurpurabRemembranceBadge');
        const daysBadge = document.getElementById('eventDaysBadge');

        // Update date/countdown display
        if (event.isToday) {
          if (daysBadge) daysBadge.style.display = 'none';
          if (event.eventCategory === 'remembrance') {
            if (remembranceBadge) {
              remembranceBadge.textContent = `🕯️ ${event.name || 'Remembrance Day'}`;
              remembranceBadge.style.display = 'inline-flex';
            }
            if (celebrationBadge) celebrationBadge.style.display = 'none';
            if (dateEl) dateEl.textContent = '🕯️ In remembrance';
            if (countEl) countEl.textContent = '🙏';
            if (labelEl) labelEl.textContent = 'Today';
          } else {
            if (celebrationBadge) {
              celebrationBadge.textContent = `✦ Today: ${event.name || 'Gurpurab'}`;
              celebrationBadge.style.display = 'inline-flex';
            }
            if (remembranceBadge) remembranceBadge.style.display = 'none';
            if (dateEl) dateEl.textContent = '🎉 Celebrate today!';
            if (countEl) countEl.textContent = '✨';
            if (labelEl) labelEl.textContent = 'Today';
          }
          if (badgeValueEl) badgeValueEl.textContent = 'Today';
          if (badgeLabelEl) badgeLabelEl.textContent = '';
        } else {
          if (celebrationBadge) celebrationBadge.style.display = 'none';
          if (remembranceBadge) remembranceBadge.style.display = 'none';
          if (dateEl) dateEl.textContent = event.dateStr || 'Upcoming';
          const daysNum = (typeof event.daysLeft === 'number' && !isNaN(event.daysLeft)) ? event.daysLeft : null;
          if (daysNum !== null && daysNum >= 0) {
            if (countEl) countEl.textContent = daysNum;
            if (labelEl) labelEl.textContent = daysNum === 1 ? 'day' : 'days';
            if (daysBadge) {
              daysBadge.innerHTML = `<span>${daysNum}</span> <span>${daysNum === 1 ? 'day left' : 'days left'}</span>`;
              daysBadge.style.display = 'inline-flex';
            }
          } else {
            if (countEl) countEl.textContent = '🗓️';
            if (labelEl) labelEl.textContent = 'Upcoming';
            if (daysBadge) daysBadge.style.display = 'none';
          }
        }

        // Update Guru image
        this._updateGuruImage(event);

        // Update greeting section with Guru Sahib info if filter is active
        this._updateGreetingForGuruSahib(event);
      };

      // Display first event
      updateEventDisplay(events[0]);
      card.style.opacity = '1';

      // Apply progressive decoration based on days until event (5-day buildup)
      this._applyProgressiveDecoration(events[0]);

      // ═══════════════════════════════════════════════════════════════════
      // GURPURAB SPECIAL MODE — Activate divine visual effects
      // ═══════════════════════════════════════════════════════════════════
      if (data.isToday && events.length > 0) {
        const firstEvent = events[0];
        const isCelebration = firstEvent.eventCategory === 'celebration' ||
          ['gurgaddi', 'prakash', 'vaisakhi', 'khalsa-sajna'].includes(firstEvent.type);

        // Add appropriate mode class to body
        document.body.classList.add(
          isCelebration ? 'gurpurab-mode--celebration' : 'gurpurab-mode--remembrance'
        );
      } else {
        // Remove any existing Gurpurab mode classes
        document.body.classList.remove('gurpurab-mode--celebration', 'gurpurab-mode--remembrance');
      }

      // Setup auto-rotation for multiple events with smooth spring physics
      if (data.isMultiple && events.length > 1) {
        card.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.6s ease';
        if (titleEl) {
          titleEl.style.transition = 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }

        window.__anhadEventCardRotation = setInterval(() => {
          currentIndex = (currentIndex + 1) % events.length;

          if (titleEl) {
            titleEl.style.opacity = '0';
            titleEl.style.transform = 'translateY(-10px)';
          }
          card.style.transform = 'scale(0.96) translateY(-4px)';
          card.style.boxShadow = '0 20px 40px rgba(212, 148, 58, 0.2)';

          setTimeout(() => {
            updateEventDisplay(events[currentIndex]);

            if (titleEl) {
              titleEl.style.opacity = '1';
              titleEl.style.transform = 'translateY(0)';
            }
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
            card.style.boxShadow = '';
          }, 500);
        }, 6000);
      }
    },

    async updateEventCard() {
      // refreshAll() now runs this on every SPA arrival, including pages that
      // have no event card at all — bail before doing any work so those pages
      // don't pay for a needless gurpurab JSON fetch. (_renderEventData is
      // separately null-guarded; this is purely to avoid the network call.)
      if (!document.getElementById('eventCard')) return;

      // 1. Synchronously render cached event if available — removes skeleton
      try {
        const cached = localStorage.getItem('anhad_cached_upcoming_gurpurab');
        if (cached) {
          const parsed = JSON.parse(cached);
          this._renderEventData(parsed);
          // Check freshness: silently re-fetch in background
          const card = document.getElementById('eventCard');
          if (card) card.dataset.cacheRendered = 'true';
        }
      } catch (e) {
        console.warn('[EventCard] Failed to parse cached event on init:', e);
      }

      // 2. Fetch fresh data asynchronously (background refresh)
      try {
        const data = await DataManager.getNextGurpurab();
        if (data) {
          localStorage.setItem('anhad_cached_upcoming_gurpurab', JSON.stringify(data));
          this._renderEventData(data);
        } else {
          // Only hide if no cached content was rendered
          const card = document.getElementById('eventCard');
          if (card && !card.dataset.cacheRendered) card.style.display = 'none';
        }
      } catch (error) {
        console.error('[EventCard] Error loading event data:', error);
        const card = document.getElementById('eventCard');
        if (card && !card.dataset.cacheRendered) card.style.display = 'none';
      }
    },

    _applyProgressiveDecoration(event) {
      const card = document.getElementById('eventCard');
      const container = document.getElementById('gurpurabContainer');
      if (!card || !event) return;

      const daysLeft = event.daysLeft || 0;
      const isToday = event.isToday || daysLeft === 0;

      // Remove existing decoration classes
      card.classList.remove('gurpurab-decor-day-5', 'gurpurab-decor-day-4', 'gurpurab-decor-day-3', 'gurpurab-decor-day-2', 'gurpurab-decor-day-1', 'gurpurab-decor-today');

      // Apply progressive decoration based on days remaining
      if (isToday) {
        card.classList.add('gurpurab-decor-today');
        if (container) container.classList.add('gurpurab-mode--celebration');
      } else if (daysLeft <= 5) {
        card.classList.add(`gurpurab-decor-day-${daysLeft}`);
        // Show container for 3+ days
        if (daysLeft <= 3 && container) {
          container.classList.add('gurpurab-mode--celebration');
        }
      }
    },

    _updateGuruImage(event) {

      // ── Guru Image Mapping ──
      // Using guruimages/ folder with .jpeg files as requested
      // PATTERN ORDER MATTERS: Most specific patterns first, generic patterns last
      const guruImageMap = {
        // SGGS patterns FIRST (highest priority to prevent mismatches)
        'sggs': 'guruimages/gurugranthsahebji.jpeg',
        'guru-granth': 'guruimages/gurugranthsahebji.jpeg',
        'granth-sahib': 'guruimages/gurugranthsahebji.jpeg',
        'guru granth sahib': 'guruimages/gurugranthsahebji.jpeg',
        'gurbani': 'guruimages/gurugranthsahebji.jpeg',
        'parkash': 'guruimages/gurugranthsahebji.jpeg',
        
        // Primary patterns - Gurus in order
        'guru-nanak': 'guruimages/gurunanakdevsahebji.jpeg',
        'guru-angad': 'guruimages/guruangaddevsahebji.jpeg',
        'guru-amar-das': 'guruimages/guruamardasji.jpeg',
        'guru-ram-das': 'guruimages/gururamdassahebji.jpeg',
        'guru-arjan': 'guruimages/guruarjanddevsahebji.jpeg',
        'guru-hargobind': 'guruimages/guruhargobindsahebji.jpeg',
        'guru-har-rai': 'guruimages/guruharraisahebji.jpeg',
        'guru-harkrishan': 'guruimages/guruharkrishansahebji.jpeg',
        'guru-har-krishan': 'guruimages/guruharkrishansahebji.jpeg',
        'guru-teg-bahadur': 'guruimages/gurutegbahadursahebji.jpeg',
        'guru-gobind': 'guruimages/gurugobindsinghsahebji.jpeg',
        
        // Special events
        'sahibzad': 'guruimages/gurugobindsinghsahebji.jpeg',
        'vaisakhi': 'guruimages/gurugobindsinghsahebji.jpeg',
        'khalsa': 'guruimages/gurugobindsinghsahebji.jpeg',
        'bandi-chhor': 'guruimages/guruhargobindsahebji.jpeg',
        'miri-piri': 'guruimages/guruhargobindsahebji.jpeg',
        
        // Additional short patterns (keep at end as they're more generic)
        'nanak': 'guruimages/gurunanakdevsahebji.jpeg',
        'angad': 'guruimages/guruangaddevsahebji.jpeg',
        'amar-das': 'guruimages/guruamardasji.jpeg',
        'ram-das': 'guruimages/gururamdassahebji.jpeg',
        'arjan': 'guruimages/guruarjanddevsahebji.jpeg',
        'hargobind': 'guruimages/guruhargobindsahebji.jpeg',
        'har-rai': 'guruimages/guruharraisahebji.jpeg',
        'harkrishan': 'guruimages/guruharkrishansahebji.jpeg',
        'har-krishan': 'guruimages/guruharkrishansahebji.jpeg',
        'teg-bahadur': 'guruimages/gurutegbahadursahebji.jpeg',
        'gobind': 'guruimages/gurugobindsinghsahebji.jpeg',
        'gobind-singh': 'guruimages/gurugobindsinghsahebji.jpeg',
      };

      // Match event name to Guru image (use name instead of ID for better matching)
      let guruImg = null;
      let guruName = null;
      const evName = (event.name_en || event.name || '').toLowerCase();
      const evId = (event.id || '').toLowerCase();

      console.log('[GuruImage] Event ID:', evId, 'Event Name:', evName);

      // CRITICAL FIX: Check event ID first for explicit SGGS patterns
      // This prevents "arjan" in "sampuranta-sggs" or "parkash-sggs" from matching Guru Arjan
      if (evId.includes('sggs') || evId.includes('granth-sahib') || evId.includes('first-parkash') || evId.includes('sampuranta') ||
          evName.includes('guru granth sahib') || evName.includes('sri guru granth')) {
        guruImg = 'guruimages/gurugranthsahebji.jpeg';
        guruName = 'Sri Guru Granth Sahib Ji';
        console.log('[GuruImage] Matched SGGS (explicit check)');
      }

      // If not SGGS, check other patterns
      if (!guruImg) {
        // Check both name and ID for patterns
        const searchStrings = [evName, evId];

        console.log('[GuruImage] Search strings:', searchStrings);

        for (const [key, filename] of Object.entries(guruImageMap)) {
          if (searchStrings.some(s => s.includes(key))) {
            guruImg = filename; // Full path from map
          const nameMap = {
            'guru-nanak': 'Sri Guru Nanak Dev Sahib Ji',
            'guru-angad': 'Sri Guru Angad Dev Sahib Ji',
            'guru-amar-das': 'Sri Guru Amar Das Sahib Ji',
            'guru-ram-das': 'Sri Guru Ram Das Sahib Ji',
            'guru-arjan': 'Sri Guru Arjan Dev Sahib Ji',
            'guru-hargobind': 'Sri Guru Hargobind Sahib Ji',
            'guru-har-rai': 'Sri Guru Har Rai Sahib Ji',
            'guru-harkrishan': 'Sri Guru Har Krishan Sahib Ji',
            'guru-har-krishan': 'Sri Guru Har Krishan Sahib Ji',
            'guru-teg-bahadur': 'Sri Guru Tegh Bahadur Sahib Ji',
            'guru-gobind': 'Sri Guru Gobind Singh Sahib Ji',
            'sggs': 'Sri Guru Granth Sahib Ji',
            'guru-granth': 'Sri Guru Granth Sahib Ji',
            'sahibzad': 'Chaar Sahib Jizade',
            'vaisakhi': 'DHAN GURU GOBIND SINGH SAHIB JI',
            'khalsa': 'DHAN GURU GOBIND SINGH SAHIB JI',
            'bandi-chhor': 'Sri Guru Hargobind Sahib Ji',
            'miri-piri': 'Sri Guru Hargobind Sahib Ji',
            'nanak': 'Sri Guru Nanak Dev Sahib Ji',
            'angad': 'Sri Guru Angad Dev Sahib Ji',
            'amar-das': 'Sri Guru Amar Das Sahib Ji',
            'ram-das': 'Sri Guru Ram Das Sahib Ji',
            'arjan': 'Sri Guru Arjan Dev Sahib Ji',
            'hargobind': 'Sri Guru Hargobind Sahib Ji',
            'har-rai': 'Sri Guru Har Rai Sahib Ji',
            'harkrishan': 'Sri Guru Har Krishan Sahib Ji',
            'har-krishan': 'Sri Guru Har Krishan Sahib Ji',
            'teg-bahadur': 'Sri Guru Tegh Bahadur Sahib Ji',
            'gobind': 'Sri Guru Gobind Singh Sahib Ji',
            'gobind-singh': 'Sri Guru Gobind Singh Sahib Ji',
          };
            guruName = nameMap[key] || event.name_en || event.name;
            console.log('[GuruImage] Matched pattern:', key, '->', guruName, guruImg);
            break;
          }
        }
      }

      const defaultImg = 'guruimages/gurugranthsahebji.jpeg';
      const finalImg = guruImg || defaultImg;
      const finalName = guruName || 'Sri Guru Granth Sahib Ji';

      console.log('[GuruImage] Final image:', finalImg, 'Final name:', finalName);

      /**
       * Helper to perform smooth crossfade image update with retries.
       * The old image stays visible while the new one loads in background,
       * then crossfades in — zero flash, zero blink.
       */
      const updateImg = (el, src, alt, classToApply = 'loaded', retries = 2) => {
        if (!el) {
          console.log('[GuruImage] Element not found for:', src);
          return;
        }
        // Normalize src comparison — compare filename tails to avoid false positives
        const currentSrcRaw = el.getAttribute('src') || '';
        const srcTail = src.split('/').pop().split('?')[0];
        const alreadyLoaded = currentSrcRaw.split('/').pop().split('?')[0] === srcTail
          && el.complete && el.naturalWidth > 0;
        if (alreadyLoaded) {
          el.style.opacity = '1';
          el.classList.add(classToApply);
          console.log('[GuruImage] Image already set and loaded:', src);
          return;
        }

        console.log('[GuruImage] Updating image to:', src, 'alt:', alt, 'retries left:', retries);

        // ── SMOOTH CROSSFADE: preload in background, then swap ──
        // Keep current image fully visible while new one loads
        const wrapper = el.parentElement;
        const preloadImg = new window.Image();

        // Guarded: a memory-cached image reports complete===true synchronously
        // AND still fires a real load event, so the manual doSwap() below plus
        // preloadImg.onload ran this whole fade twice — a visible double blink.
        let swapDone = false;
        const doSwap = () => {
          if (swapDone) return;
          swapDone = true;
          // Prepare the transition on the real element — start invisible
          el.style.transition = 'opacity 0s'; // instant reset first
          el.style.opacity = '0';
          el.classList.remove(classToApply);

          // One rAF to let the browser register opacity:0, then start fade
          requestAnimationFrame(() => {
            el.src = src;
            el.alt = alt;
            el.style.transition = 'opacity 0.4s ease';
            // If browser cached it, el.complete fires instantly
            if (el.complete && el.naturalWidth > 0) {
              el.style.opacity = '1';
              el.classList.add(classToApply);
              console.log('[GuruImage] Image swapped (cached) successfully:', src);
            } else {
              el.onload = () => {
                el.style.opacity = '1';
                el.classList.add(classToApply);
                el.onload = null; el.onerror = null;
                console.log('[GuruImage] Image crossfaded successfully:', src);
              };
              el.onerror = () => {
                el.onload = null; el.onerror = null;
                console.warn('[GuruImage] Swap element load failed:', src);
                el.style.opacity = '1'; // show whatever was there
              };
            }
          });
        };

        preloadImg.onload = doSwap;
        preloadImg.onerror = () => {
          console.warn('[GuruImage] Image failed to load:', src);
          if (retries > 0) {
            console.log(`[GuruImage] Retrying... (${retries} attempts left)`);
            setTimeout(() => {
              const retrySrc = src.includes('?') ? `${src}&retry=${retries}` : `${src}?retry=${retries}`;
              updateImg(el, retrySrc, alt, classToApply, retries - 1);
            }, 500);
          } else {
            console.error('[GuruImage] All retries failed. Using fallback.');
            if (el.getAttribute('src') !== defaultImg) {
              updateImg(el, defaultImg, 'Sri Guru Granth Sahib Ji', classToApply, 0);
            }
          }
        };

        // Start preloading in background (old image stays visible)
        preloadImg.src = src;
        // If browser cached it synchronously, onload fires immediately
        if (preloadImg.complete && preloadImg.naturalWidth > 0) {
          doSwap();
        }
      };

      // Update event card image only (greeting portrait now handled by Slider)
      const eventImgEl = document.getElementById('eventGuruImg');
      updateImg(eventImgEl, finalImg, finalName);

      // Sync Slider to this Guru
      PortraitSlider.setGuruById(event);
    },

    _updateGreetingForGuruSahib(event) {
      // Handled by PortraitSlider.setGuruById call in _updateGuruImage
    },

    _getGuruInfoFromEvent(event) {
      const guruImageMap = {
        'guru-nanak': { image: 'guruimages/gurunanakdevsahebji.jpeg', name: 'Sri Guru Nanak Dev Sahib Ji' },
        'guru-angad': { image: 'guruimages/guruangaddevsahebji.jpeg', name: 'Sri Guru Angad Dev Sahib Ji' },
        'guru-amar-das': { image: 'guruimages/guruamardasji.jpeg', name: 'Sri Guru Amar Das Sahib Ji' },
        'guru-ram-das': { image: 'guruimages/gururamdassahebji.jpeg', name: 'Sri Guru Ram Das Sahib Ji' },
        'guru-arjan': { image: 'guruimages/guruarjanddevsahebji.jpeg', name: 'Sri Guru Arjan Dev Sahib Ji' },
        'guru-hargobind': { image: 'guruimages/guruhargobindsahebji.jpeg', name: 'Sri Guru Hargobind Sahib Ji' },
        'guru-har-rai': { image: 'guruimages/guruharraisahebji.jpeg', name: 'Sri Guru Har Rai Sahib Ji' },
        'guru-harkrishan': { image: 'guruimages/guruharkrishansahebji.jpeg', name: 'Sri Guru Har Krishan Sahib Ji' },
        'guru-har-krishan': { image: 'guruimages/guruharkrishansahebji.jpeg', name: 'Sri Guru Har Krishan Sahib Ji' },
        'guru-teg-bahadur': { image: 'guruimages/gurutegbahadursahebji.jpeg', name: 'Sri Guru Tegh Bahadur Sahib Ji' },
        'guru-gobind': { image: 'guruimages/gurugobindsinghsahebji.jpeg', name: 'Sri Guru Gobind Singh Sahib Ji' },
        'nanak': { image: 'guruimages/gurunanakdevsahebji.jpeg', name: 'Sri Guru Nanak Dev Sahib Ji' },
        'angad': { image: 'guruimages/guruangaddevsahebji.jpeg', name: 'Sri Guru Angad Dev Sahib Ji' },
        'amar-das': { image: 'guruimages/guruamardasji.jpeg', name: 'Sri Guru Amar Das Sahib Ji' },
        'ram-das': { image: 'guruimages/gururamdassahebji.jpeg', name: 'Sri Guru Ram Das Sahib Ji' },
        'arjan': { image: 'guruimages/guruarjanddevsahebji.jpeg', name: 'Sri Guru Arjan Dev Sahib Ji' },
        'hargobind': { image: 'guruimages/guruhargobindsahebji.jpeg', name: 'Sri Guru Hargobind Sahib Ji' },
        'har-rai': { image: 'guruimages/guruharraisahebji.jpeg', name: 'Sri Guru Har Rai Sahib Ji' },
        'harkrishan': { image: 'guruimages/guruharkrishansahebji.jpeg', name: 'Sri Guru Har Krishan Sahib Ji' },
        'har-krishan': { image: 'guruimages/guruharkrishansahebji.jpeg', name: 'Sri Guru Har Krishan Sahib Ji' },
        'teg-bahadur': { image: 'guruimages/gurutegbahadursahebji.jpeg', name: 'Sri Guru Tegh Bahadur Sahib Ji' },
        'gobind': { image: 'guruimages/gurugobindsinghsahebji.jpeg', name: 'Sri Guru Gobind Singh Sahib Ji' },
        'gobind-singh': { image: 'guruimages/gurugobindsinghsahebji.jpeg', name: 'Sri Guru Gobind Singh Sahib Ji' },
      };

      const evName = (event.name || '').toLowerCase();
      const evId = (event.id || '').toLowerCase();
      const searchStrings = [evName, evId];

      for (const [key, info] of Object.entries(guruImageMap)) {
        if (searchStrings.some(s => s.includes(key))) {
          return info;
        }
      }

      return null;
    },

    updateNaamCard() {
      const data = DataManager.getNaamAbhyas();
      const subtitleEl = document.getElementById('naamSubtitle');
      const metaEl = document.getElementById('naamMeta');

      if (data.nextHour !== null) {
        const ampm = data.nextHour >= 12 ? 'PM' : 'AM';
        const hour12 = data.nextHour % 12 || 12;

        // Try to get exact time from schedule
        let timeStr = `${hour12}:00 ${ampm}`;
        const schedule = Store.get(KEYS.NAAM_SCHEDULE);
        if (schedule && schedule[data.nextHour] && schedule[data.nextHour].startTime) {
          timeStr = schedule[data.nextHour].startTime;
        }

        if (subtitleEl) {
          subtitleEl.textContent = data.completedToday > 0
            ? `${data.completedToday} done · Next at ${timeStr}`
            : `Next at ${timeStr}`;
        }
        if (metaEl) metaEl.textContent = timeStr;
      } else if (data.completedToday > 0) {
        if (subtitleEl) subtitleEl.textContent = `${data.completedToday} sessions today`;
        if (metaEl) metaEl.textContent = `✓ ${data.completedToday}`;
      } else {
        if (subtitleEl) subtitleEl.textContent = 'Begin meditation';
        if (metaEl) metaEl.textContent = 'Start';
      }
    },

    updateProgressBar() {
      const completed = DataManager.getCompletedToday();
      const total = DataManager.getTotalBanis();
      const percent = Math.round((completed / total) * 100);

      const fillEl = document.getElementById('progressFill');
      const textEl = document.getElementById('progressText');
      const labelEl = document.getElementById('progressLabel');

      if (fillEl) {
        requestAnimationFrame(() => { fillEl.style.width = `${percent}%`; });
      }
      if (textEl) textEl.textContent = `${completed}/${total} Banis`;
      if (labelEl) {
        if (completed >= total) {
          labelEl.textContent = '✓ Complete';
        } else if (completed === 0) {
          labelEl.textContent = '☀️ Start morning Nitnem';
        } else {
          labelEl.textContent = '☀️ Continue morning Nitnem';
        }
      }
    },

    updateNotificationBadge() {
      const count = DataManager.getNotificationCount();
      const badge = document.getElementById('notifBadge');
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 9 ? '9+' : count;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    },

    refreshAll() {
      // Each updater is isolated: this is the ONLY path that repopulates Home
      // after an SPA return, and it was a bare sequential call list — so a
      // throw in any one of them (a missing element on a page that landed
      // elsewhere, a corrupt localStorage value) silently blanked every card
      // after it, including the gurpurab card and the guru slider at the end.
      const safe = (label, fn) => {
        try { fn.call(this); }
        catch (err) { console.warn('[Trendora] refreshAll:' + label + ' failed', err); }
      };

      safe('clearCache', () => Store.clearCache());
      safe('nitnemCard', this.updateNitnemCard);
      safe('sehajCard', this.updateSehajCard);
      safe('hukamCard', this.updateHukamCard);
      safe('naamCard', this.updateNaamCard);
      safe('progressBar', this.updateProgressBar);
      safe('notificationBadge', this.updateNotificationBadge);
      safe('nanakshahiDate', this.updateNanakshahiDate);
      safe('notesCard', this.updateNotesCard);
      safe('nitnemQuickAccess', this.updateNitnemQuickAccess);
      // updateEventCard() populates the Upcoming Gurpurab card. It was the ONE
      // member of App.init()'s criticalUpdates not mirrored here, and it is the
      // only writer of #eventTitle/#eventDate/#eventCountdown/#eventGuruImg —
      // so on any path that re-enters via refreshAll() instead of a full
      // App.init() (SPA return to Home, bfcache restore, visibilitychange) the
      // card kept the blank, skeleton-classed markup it ships with. It has a
      // synchronous localStorage fast path, so this renders without a flash.
      // autoRemindUpcomingGurpurab() below fetches the same data but writes no
      // DOM — it is not a substitute.
      safe('eventCard', this.updateEventCard);
      // Same class of omission as updateEventCard(): only ever called from
      // App.init(), so the Hukamnama hero card kept whatever text it was left
      // with on any refreshAll()-only re-entry. Self-guards when absent.
      safe('hukamHeroCard', this.updateHukamHeroCard);
      safe('autoRemind', this.autoRemindUpcomingGurpurab);
      safe('homepageVisuals', this.reviveHomepageVisuals);
    },

    // RE-INIT HOMEPAGE COMPONENTS
    // These elements only exist on index.html, but refreshAll() runs on every
    // SPA arrival regardless of which page landed. The internal guards in each
    // of these prevent errors when the elements are missing (i.e. when the swap
    // landed on a non-Home page).
    reviveHomepageVisuals() {
      this.updateHeroCardImages();
      if (typeof Greeting !== 'undefined') Greeting.update();
      if (typeof PortraitSlider !== 'undefined') PortraitSlider.init();
      if (typeof CarouselController !== 'undefined') CarouselController.init();
      // Re-point the compact-header observer at the incoming .greeting node.
      // App.init() is guarded to run once per realm, so without this the
      // observer stayed attached to the element the first content swap
      // detached, and the header never compacted again after leaving Home.
      if (typeof ScrollHeader !== 'undefined') ScrollHeader.init();
    },

    async autoRemindUpcomingGurpurab() {
      if (!('Notification' in window) || !window.isSecureContext) return;
      if (Notification.permission !== 'granted') return;

      const data = await DataManager.getNextGurpurab();
      if (!data || !data.events || data.events.length === 0) return;

      const event = data.events[0]; // Check first/upcoming event
      if (event.daysLeft === 1) {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const cacheKey = `gurpurab_global_notified_${event.id}_${todayStr}`;
        if (!localStorage.getItem(cacheKey)) {
          try {
            const n = new Notification('Tomorrow is ' + event.name, {
              body: 'A special holy day is arriving tomorrow. Tap to view the Gurpurab calendar.',
              icon: 'assets/icon-192x192.png',
              requireInteraction: true
            });
            n.onclick = () => {
              window.focus();
              Navigation.navigateTo(NAV_PATHS.calendar + '?highlight=' + event.id);
            };
            localStorage.setItem(cacheKey, 'true');
          } catch (e) { }
        }
      }
    },

    updateNanakshahiDate() {
      const el = document.getElementById('nanakshahiDate');
      if (!el) return;
      const nd = DataManager.getNanakshahiDate();
      el.textContent = `${nd.day} ${nd.month} ${nd.year} ਨਾਨਕਸ਼ਾਹੀ`;
    },

    updateGreetingName() {
      const salEl = document.getElementById('greetingSalutation');
      if (!salEl) return;

      // Don't overwrite if there's a guru name displayed (from gurpurab event)
      const currentText = salEl.textContent || '';
      const hasGuruName = currentText.includes('Guru') || currentText.includes('SAHIB');
      if (hasGuruName) return;

      const name = DataManager.getUserName();
      const sal = Greeting.getSalutation();
      salEl.textContent = name ? `${sal}, ${name}` : sal;
    },

    updateNotesCard() {
      const el = document.getElementById('notesSubtitle');
      const metaEl = document.getElementById('notesMeta');
      const count = DataManager.getNotesCount();
      if (el) {
        el.textContent = count > 0 ? `${count} note${count > 1 ? 's' : ''} saved` : 'Start writing';
      }
      if (metaEl) {
        metaEl.textContent = count > 0 ? count : '';
      }
    },

    updateNitnemQuickAccess() {
      const subtitleEl = document.querySelector('#nitnemTrackerCard .quick-card__subtitle');
      if (subtitleEl) {
        subtitleEl.textContent = DataManager.getNextBani();
      }
    },

    async updateHukamHeroCard() {
      // Same detached-node hazard as updateHukamCard above — see the note there.
      const epoch = window.__anhadNavEpoch || 0;
      if (!document.getElementById('heroHukamTitle')) return;
      const preview = await DataManager.getHukamnamaPreview();
      if ((window.__anhadNavEpoch || 0) !== epoch) return; // navigated away mid-fetch
      const titleEl = document.getElementById('heroHukamTitle');
      const subtitleEl = document.getElementById('heroHukamSubtitle');
      if (titleEl && preview && preview.firstLine) {
        const truncated = preview.firstLine.length > 50 ? preview.firstLine.substring(0, 50) + '…' : preview.firstLine;
        titleEl.textContent = truncated;
        titleEl.style.fontFamily = 'var(--font-gurmukhi)';
        if (subtitleEl && preview.ang) {
          subtitleEl.textContent = `Ang ${preview.ang} · ${preview.writer || 'Sri Guru Granth Sahib Ji'}`;
        }
      }
    },

    updateHeroCardImages() {
      // PRIMARY: Delegate to the authoritative AnhadSky system (anhad-sky-bg.js)
      if (window.AnhadSky && typeof window.AnhadSky.updateHeroCardImages === 'function') {
        window.AnhadSky.updateHeroCardImages();
        return;
      }

      // FALLBACK: Direct update using the new clean WebP paths
      const forced = localStorage.getItem('anhad_forced_time_of_day');
      let slot = 'day';
      if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
        slot = forced;
      } else {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 9) slot = 'morning';
        else if (hour >= 9 && hour < 16) slot = 'day';
        else if (hour >= 16 && hour < 20) slot = 'evening';
        else slot = 'night';
      }

      const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
      const effectiveSlot = mode === 'dark' ? 'night' : mode === 'light' ? 'day' : slot;

      const imageSets = {
        morning: [
          'assets/HERO CARD IMAGES/morning-darbar-sahib.webp',
          'assets/HERO CARD IMAGES/morning-amritvela-kirtan.webp',
          'assets/HERO CARD IMAGES/morning-waheguru-simran.webp'
        ],
        day: [
          'assets/HERO CARD IMAGES/day-darbar-sahib.webp',
          'assets/HERO CARD IMAGES/day-amritvela-kirtan.webp',
          'assets/HERO CARD IMAGES/day-waheguru-simran.webp'
        ],
        evening: [
          'assets/HERO CARD IMAGES/evening-darbar-sahib.webp',
          'assets/HERO CARD IMAGES/evening-amritvela-kirtan.webp',
          'assets/HERO CARD IMAGES/evening-waheguru-simran.webp'
        ],
        night: [
          'assets/HERO CARD IMAGES/night-darbar-sahib.webp',
          'assets/HERO CARD IMAGES/night-amritvela-kirtan.webp',
          'assets/HERO CARD IMAGES/night-waheguru-simran.webp'
        ]
      };

      const images = imageSets[effectiveSlot];

      [
        { id: 'heroCard1Img', src: images[0] },
        { id: 'heroCard2Img', src: images[1] },
        { id: 'heroCard3Img', src: images[2] }
      ].forEach(({ id, src }) => {
        const img = document.getElementById(id);
        if (!img) return;
        const newAbsolute = new URL(src, document.baseURI).href;
        if (img.src === newAbsolute) return; // Already correct, no re-download
        const preload = new Image();
        // Guarded — see swapHeroImgSmooth() in anhad-sky-bg.js. A cached image
        // triggers both the synchronous manual call and a real load event,
        // running the crossfade twice.
        let done = false;
        const doSwap = () => {
          if (done) return;
          done = true;
          img.style.transition = 'opacity 0s';
          img.style.opacity = '0';
          requestAnimationFrame(() => {
            img.src = src;
            img.style.transition = 'opacity 0.5s ease';
            requestAnimationFrame(() => { img.style.opacity = '1'; });
          });
        };
        preload.onload = doSwap;
        preload.onerror = () => { if (!done) { done = true; img.src = src; } };
        preload.src = src;
        if (preload.complete && preload.naturalWidth > 0) doSwap();
      });
    }

  };

  // ═ THEME CONTROLLER (Reconstructed — Single Source of Truth) ═
  const ThemeController = {
    init() {
      if (window.AnhadTheme) {
        // Theme is already initialized authoritatively by global-theme.js / head blocker
      } else {
        const savedTheme = localStorage.getItem('anhad_theme') || 'auto';
        const getIsDark = (theme) => {
          if (theme === 'dark') return true;
          if (theme === 'light') return false;
          if (theme === 'auto') {
            const forced = localStorage.getItem('anhad_forced_time_of_day');
            if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
              return forced === 'night';
            }
            const hour = new Date().getHours();
            return hour < 5 || hour >= 20;
          }
          return false;
        };
        this._apply(getIsDark(savedTheme));
      }

      // Toggle button — element-scoped. #app is replaced wholesale on every
      // SPA arrival, so this must re-bind against the fresh node each mount.
      const toggleEl = document.getElementById('themeToggle');
      if (bindOnce(toggleEl, 'themeToggle')) toggleEl.addEventListener('click', () => {
        if (window.AnhadTheme) {
          window.AnhadTheme.toggle();
        } else {
          const isDark = document.documentElement.classList.contains('dark-mode');
          const newTheme = isDark ? 'light' : 'dark';
          localStorage.setItem('anhad_theme', newTheme);
          this._apply(newTheme === 'dark');
          window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
        }
      });

      // ── Realm-scoped from here down ──────────────────────────────────────
      // window/document outlive every #app swap, so everything below must bind
      // exactly once per JS realm however many times Home is mounted.
      if (window.__anhadThemeControllerRealmBound) return;
      window.__anhadThemeControllerRealmBound = true;

      // Listen for custom theme change events
      window.addEventListener('themechange', (e) => {
        UIController.updateHeroCardImages();
      });

      // Listen for storage changes (other tabs)
      window.addEventListener('storage', (e) => {
        if ((e.key === 'anhad_theme' || e.key === 'anhad_forced_time_of_day') && localStorage.getItem('anhad_theme')) {
          if (window.AnhadTheme) window.AnhadTheme.apply(window.AnhadTheme.get());
        }
        // Update on Nitnem Tracker changes
        if (e.key === 'nitnemTracker_nitnemLog' || e.key === 'nitnemTracker_selectedBanis' || e.key === 'anhad_streak_data' || e.key === 'anhad_unified_stats') {
          Store.clearCache();
          UIController.updateNitnemCard();
          UIController.updateProgressBar();
        }
        // Update on My Pothi changes
        if (e.key === 'anhad_my_pothi' || e.key === 'anhad_my_pothi_completed') {
          Store.clearCache();
          UIController.updateProgressBar();
        }
      });

      // Clear cache and update UI on pageshow (e.g. back navigation from NitnemTracker / bfcache restore)
      window.addEventListener('pageshow', (e) => {
        console.log('[AnhadHome] Page shown (restored from cache:', e.persisted, '), refreshing card displays...');
        Store.clearCache();
        UIController.updateNitnemCard();
        UIController.updateProgressBar();
      });

      // Listen for in-page nitnem updates (same page, e.g. My Pothi dispatches this)
      window.addEventListener('nitnemUpdated', () => {
        Store.clearCache();
        UIController.updateNitnemCard();
        UIController.updateProgressBar();
      });

      // Listen for Pothi completion updates from My Pothi page
      window.addEventListener('nitnemCompletionUpdated', () => {
        Store.clearCache();
        UIController.updateProgressBar();
      });

      // Listen for UnifiedStats events so streak updates live on the dashboard
      window.addEventListener('statsChanged', () => {
        Store.clearCache();
        UIController.updateNitnemCard();
      });
      window.addEventListener('statsInitialized', () => {
        Store.clearCache();
        UIController.updateNitnemCard();
      });
      window.addEventListener('streakUpdated', () => {
        Store.clearCache();
        UIController.updateNitnemCard();
      });
      window.addEventListener('nitnemDayCompleted', () => {
        Store.clearCache();
        UIController.updateNitnemCard();
      });
    },

    _apply(isDark) {
      const root = document.documentElement;
      const body = document.body;

      if (isDark) {
        root.classList.add('dark-mode');
        if (body) body.classList.add('dark-mode');
        root.style.colorScheme = 'dark';
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark-mode');
        if (body) body.classList.remove('dark-mode');
        root.style.colorScheme = 'light';
        root.setAttribute('data-theme', 'light');
      }

      // Update theme dot indicator
      const toggleBtn = document.getElementById('themeToggle');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-checked', String(isDark));
      }
    }
  };

  // ═ CAROUSEL CONTROLLER ═
  const CarouselController = {
    _paused: false,

    init() {
      const track = document.getElementById('heroTrack');
      const dots = document.querySelectorAll('.hero-carousel__dot');
      // Per-node guard for the element listeners below. The auto-advance timer
      // is guarded separately on window (see the note at its clearInterval),
      // because it must be re-armed against the live nodes on every mount even
      // when the track itself survived.
      const trackIsNew = bindOnce(track, 'carousel');
      if (!track || !dots.length) return;

      let current = 0;
      const totalSlides = track.children.length;

      // The track has `gap: var(--space-3)` between cards and the cards use
      // `scroll-snap-align: center`, so `i * track.offsetWidth` is never an
      // actual snap position. Writing it to scrollLeft left the container
      // slightly off-snap, and `scroll-snap-type: x mandatory` immediately
      // animated a correction — which swallowed touch gestures that started
      // over the carousel. Measure the real cards instead.
      const scrollTargetFor = (i) => {
        const card = track.children[i];
        if (!card) return 0;
        return card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2;
      };
      const indexFromScroll = () => {
        const centre = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < track.children.length; i++) {
          const card = track.children[i];
          const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
          if (dist < bestDist) { bestDist = dist; best = i; }
        }
        return best;
      };

      // PERF: Throttled scroll handler using rAF to prevent 100+ events/sec
      let scrollTicking = false;
      if (trackIsNew) track.addEventListener('scroll', () => {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(() => {
            const idx = indexFromScroll();
            if (idx !== current) {
              current = idx;
              dots.forEach((d, i) => d.classList.toggle('hero-carousel__dot--active', i === idx));
            }
            scrollTicking = false;
          });
        }
      }, { passive: true });

      dots.forEach((dot, i) => {
        if (!bindOnce(dot, 'carouselDot')) return;
        dot.addEventListener('click', () => {
          track.scrollLeft = scrollTargetFor(i);
        });
      });

      // Auto-advance every 7 seconds.
      // Tracked on window, NOT this._autoTimer. Two reasons, both real:
      // (1) init() now runs on every mount(), so the previous mount's interval
      //     must be visible here to be cleared;
      // (2) this IIFE can execute a second time in one realm (arriving at Home
      //     from a hard-refreshed Insights re-injects the file), handing us a
      //     fresh object literal whose _autoTimer is undefined — so a
      //     per-object property could never see the earlier interval.
      // Confirmed via real-browser tracing: this leaked one growing interval
      // per Home revisit while the ineffective this._autoTimer guard was used.
      if (window.__anhadCarouselAutoTimer) clearInterval(window.__anhadCarouselAutoTimer);
      window.__anhadCarouselAutoTimer = setInterval(() => {
        if (this._paused || document.hidden) return;
        current = (current + 1) % totalSlides;
        track.scrollLeft = scrollTargetFor(current);
        dots.forEach((d, i) => d.classList.toggle('hero-carousel__dot--active', i === current));
      }, 7000);

      // Pause on touch
      if (trackIsNew) {
        track.addEventListener('touchstart', () => { this._paused = true; }, { passive: true });
        track.addEventListener('touchend', () => {
          setTimeout(() => { this._paused = false; }, 10000);
        }, { passive: true });
      }
    }
  };

  // ═ SHEET CONTROLLER ═
  const SheetController = {
    _active: null,

    open(sheetId) {
      const overlay = document.getElementById(sheetId + 'Overlay');
      const sheet = document.getElementById(sheetId);
      if (!overlay || !sheet) return;

      overlay.style.display = 'block';
      sheet.style.display = 'block';
      overlay.setAttribute('aria-hidden', 'false');
      sheet.setAttribute('aria-hidden', 'false');

      requestAnimationFrame(() => {
        overlay.classList.add('sheet-overlay--active');
        overlay.style.pointerEvents = '';
        sheet.classList.add('sheet--active');
      });

      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      this._active = sheetId;

      if (!overlay._anhadSheetCloseBound) {
        overlay._anhadSheetCloseBound = true;
        overlay.addEventListener('click', () => this.close(sheetId));
      }
    },

    close(sheetId) {
      const id = sheetId || this._active;
      if (!id) return;

      const overlay = document.getElementById(id + 'Overlay');
      const sheet = document.getElementById(id);

      if (sheet) {
        sheet.classList.remove('sheet--active');
        sheet.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          if (!sheet.classList.contains('sheet--active')) {
            sheet.style.display = 'none';
          }
        }, 450);
      }

      if (overlay) {
        overlay.style.pointerEvents = 'none';
        overlay.classList.remove('sheet-overlay--active');
        overlay.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          if (!overlay.classList.contains('sheet-overlay--active')) {
            overlay.style.display = 'none';
          }
        }, 300);
      }

      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      this._active = null;
    },

    closeAll() {
      if (this._active) this.close(this._active);
    },

    // CRITICAL FIX: Force-close all sheets on page load
    // Prevents stuck modal state from persisted/cached DOM
    ensureAllClosed() {
      document.querySelectorAll('.sheet').forEach(sheet => {
        sheet.classList.remove('sheet--active');
        sheet.setAttribute('aria-hidden', 'true');
        sheet.style.display = 'none';
      });
      document.querySelectorAll('.sheet-overlay').forEach(overlay => {
        overlay.classList.remove('sheet-overlay--active');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.pointerEvents = 'none';
        overlay.style.display = 'none';
      });
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      this._active = null;

      try {
        sessionStorage.removeItem('anhad_radio_sheet_open');
        sessionStorage.removeItem('anhad_modal_state');
      } catch (e) {}
    }
  };

  // ═ AUDIO SYNC — Dual Hero Cards + Mini Player ═
  const AudioSync = {
    _info: {
      darbar: { title: 'Darbar Sahib Ji Live', subtitle: 'Sri Harmandir Sahib Ji' },
      amritvela: { title: 'Amritvela Smagams', subtitle: 'Sacred Dawn Kirtan Collection' },
      simran: { title: 'Waheguru Simran', subtitle: 'Divine Meditation & Simran' }
    },

    init() {
      // Split deliberately. The old guard here was `this._initialized`, an
      // object property — and because trendora-app.js is in SHELL_SCRIPTS
      // (smooth-navigation.js:261) this IIFE runs once per realm, so that flag
      // stayed true forever. Every SPA return to Home therefore found it set
      // and skipped the whole method, leaving the freshly-swapped
      // #heroPlayBtn1..4 and #miniPlayerPlayBtn with no handlers at all.
      // Element bindings now re-run per mount behind per-node guards; only the
      // window listeners below are realm-scoped.

      // Both hero play buttons - trigger mini player directly instead of navigating
      ['heroPlayBtn1', 'heroPlayBtn2', 'heroPlayBtn3', 'heroPlayBtn4'].forEach(id => {
        const btn = document.getElementById(id);
        if (!bindOnce(btn, 'heroPlay')) return;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const stream = btn.dataset.stream;

          // Hukamnama is NOT a live audio stream — navigate to its player page
          if (stream === 'hukamnama') {
            const card = btn.closest('.hero-card');
            const href = card ? card.dataset.href : 'Hukamnama/daily-hukamnama.html';
            window.location.href = href;
            return;
          }

          // Use AnhadAudio singleton directly
          if (window.AnhadAudio) {
            const state = window.AnhadAudio.getState();
            if (state.isPlaying && state.currentStream === stream) {
              window.AnhadAudio.pause();
            } else {
              window.AnhadAudio.play(stream);
            }
          } else {
            // If the audio engine is still lazy-loading, dispatch an event for when it finishes
            window.dispatchEvent(new CustomEvent('anhadPlayStream', { detail: { stream } }));
            // Add a temporary loading state
            btn.style.opacity = '0.5';
            setTimeout(() => btn.style.opacity = '1', 1000);
          }
        });
      });

      // Mini player - use AnhadAudio singleton
      const miniBtn = document.getElementById('miniPlayerPlayBtn');
      if (bindOnce(miniBtn, 'miniPlay')) miniBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (window.AnhadAudio) {
          window.AnhadAudio.toggle();
        }
      });

      // Realm-scoped: one state-change subscription per realm, not per mount.
      if (!window.__anhadAudioSyncRealmBound) {
        window.__anhadAudioSyncRealmBound = true;
        window.addEventListener('anhadAudioStateChange', (e) => this._sync(e.detail));
        // ══ CAPACITOR OPTIMIZATION: cached page restore — sync UI state only,
        // never re-initialize the audio engine or mini player.
        window.addEventListener('anhad_page_restored', (e) => {
          if (e && e.detail && e.detail.fromCache && window.AnhadAudio) {
            console.log('[AudioSync] ⚡ Cached page restored, syncing UI only');
            const st = window.AnhadAudio.getState();
            if (st.isPlaying) this._sync({ isPlaying: true, stream: st.currentStream || 'darbar' });
          }
        });
      }

      // Check initial state using AnhadAudio singleton.
      // Tracked on window, not a local: mount() may run again before this
      // fires, and two in-flight copies would both write the player UI.
      if (window.__anhadAudioSyncTimer) clearTimeout(window.__anhadAudioSyncTimer);
      window.__anhadAudioSyncTimer = setTimeout(() => {
        if (window.AnhadAudio) {
          const state = window.AnhadAudio.getState();
          if (state.isPlaying) {
            this._sync({ isPlaying: true, stream: state.currentStream || 'darbar' });
          }
        } else if (window.AnhadMiniPlayer && window.AnhadMiniPlayer.isPlaying()) {
          this._sync({ isPlaying: true, stream: window.AnhadMiniPlayer.getStream() || 'darbar' });
        } else if (window.GlobalMiniPlayer && window.GlobalMiniPlayer.isPlaying()) {
          this._sync({ isPlaying: true, stream: window.GlobalMiniPlayer.getStream() || 'darbar' });
        }
      }, 300); // Reduced from 800ms
    },

    _sync({ isPlaying, stream }) {
      const pauseIcon = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      const playIcon = '<polygon points="6,3 20,12 6,21"/>';

      // ══ CAPACITOR OPTIMIZATION: Batch DOM updates for zero lag ══
      // Use DocumentFragment to batch updates before applying to DOM
      const updates = [];

      // Hero cards
      ['1', '2', '3', '4'].forEach(n => {
        const card = document.getElementById('heroCard' + n);
        const icon = document.getElementById('heroPlayIcon' + n);
        const cardStream = card?.dataset.stream;
        const isThis = stream === cardStream && isPlaying;
        if (card) updates.push({ el: card, class: 'hero-card--playing', add: isThis });
        if (icon) updates.push({ el: icon, html: isThis ? pauseIcon : playIcon });
      });

      // Apply all updates in a single requestAnimationFrame
      requestAnimationFrame(() => {
        updates.forEach(({ el, class: cls, add, html }) => {
          if (cls !== undefined) {
            el.classList.toggle(cls, add);
          }
          if (html !== undefined) {
            el.innerHTML = html;
          }
        });
      });

      // Mini player (legacy element in index.html)
      const miniPlayer = document.getElementById('miniPlayer');
      if (miniPlayer) {
        if (isPlaying) {
          // INSTANT show - no delay
          miniPlayer.style.display = 'flex';
          miniPlayer.style.opacity = '1';
          miniPlayer.classList.add('mini-player--visible');
        } else {
          miniPlayer.style.opacity = '0';
          miniPlayer.classList.remove('mini-player--visible');
          // Quick hide after fade
          setTimeout(() => {
            if (!miniPlayer.classList.contains('mini-player--visible')) {
              miniPlayer.style.display = 'none';
            }
          }, 200); // Reduced from 500ms
        }
      }

      // Also update the Global Mini Player (gmp) element if it exists
      const gmp = document.getElementById('gmp');
      if (gmp && window.GlobalMiniPlayer) {
        // The global mini player manages its own visibility through its own API
        // Just ensure it's synced by calling show/hide as needed
        if (isPlaying) {
          window.GlobalMiniPlayer.show();
        }
        // Note: we don't auto-hide gmp on pause - user must click close button
      }

      const info = this._info[stream] || this._info.darbar;
      const miniTitle = document.getElementById('miniTitle');
      const miniSubtitle = document.getElementById('miniSubtitle');
      const miniPlayIcon = document.getElementById('miniPlayIcon');
      const miniThumb = document.querySelector('.mini-player__thumb');

      // Batch mini-player UI updates
      requestAnimationFrame(() => {
        if (miniTitle) {
          miniTitle.innerHTML = (stream === 'darbar' ? '<span class="mini-player__live-dot"></span>' : '') + info.title;
        }
        if (miniSubtitle) miniSubtitle.textContent = info.subtitle;
        if (miniPlayIcon) miniPlayIcon.innerHTML = isPlaying ? pauseIcon : playIcon;
        if (miniThumb) {
          miniThumb.src = stream === 'amritvela' ? '/assets/Darbar-sahib-AMRITVELA.webp' : '/assets/darbar-sahib-evening.webp';
          miniThumb.alt = info.title;
        }
      });
    }
  };

  // ═ INSTALL CONTROLLER ═
  const INSTALL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

  const InstallController = {
    _deferredPrompt: null,

    init() {
      const banner = document.getElementById('installBanner');
      const installCta = document.getElementById('installCta');
      const dismissBtn = document.getElementById('installDismiss');

      if (!banner) return;

      console.log('[PWA] Initializing InstallController...');

      if (this._isStandalone()) {
        console.log('[PWA] App is already standalone, hiding banner');
        banner.style.display = 'none';
        return;
      }

      // Capacitor native app — no PWA install needed
      if (window.Capacitor) {
        console.log('[PWA] Running in Capacitor native app, hiding install banner');
        banner.style.display = 'none';
        return;
      }

      // Check for persistent dismissal
      const dismissedTime = Store.get(KEYS.INSTALL_DISMISSED);
      if (dismissedTime && (Date.now() - parseInt(dismissedTime)) < INSTALL_COOLDOWN_MS) {
        console.log('[PWA] Banner dismissed recently, waiting for cooldown');
        banner.style.display = 'none';
        return;
      }

      // Never on a first visit — the banner is an interruption, and a brand new
      // user has not seen the app yet. Record the visit and wait for the next one.
      if (!Store.get(KEYS.INSTALL_FIRST_SEEN)) {
        Store.set(KEYS.INSTALL_FIRST_SEEN, Date.now().toString());
        console.log('[PWA] First visit — deferring install banner');
        banner.style.display = 'none';
        return;
      }

      // Realm-scoped: these two live on window and outlive every #app swap,
      // so they must bind once per realm however many times Home is mounted.
      // The DOM bindings below use .onclick assignment, which is inherently
      // idempotent, so they are safe to re-run on every mount.
      if (!window.__anhadInstallRealmBound) {
        window.__anhadInstallRealmBound = true;

        // Capture native prompt (Android/Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
          console.log('[PWA] Native beforeinstallprompt event fired');
          e.preventDefault();
          this._deferredPrompt = e;
          this._showBanner();
        });

        // Handle successful install
        window.addEventListener('appinstalled', () => {
          console.log('[PWA] App installed successfully');
          Store.set(KEYS.PWA_INSTALLED, true);
          this._hideBanner();
        });
      }

      // Bind actions
      if (installCta) {
        installCta.onclick = () => {
          console.log('[PWA] Install CTA clicked');
          this._triggerInstall();
        };
      }

      if (dismissBtn) {
        dismissBtn.onclick = () => {
          console.log('[PWA] User dismissed install banner');
          Store.set(KEYS.INSTALL_DISMISSED, Date.now().toString());
          this._hideBanner();
        };
      }

      // Fallback for iOS/Safari: show after delay if not dismissed and no prompt yet.
      // Tracked on window: mount() can run again inside the 5s window, and two
      // in-flight copies would both call _showBanner().
      if (window.__anhadInstallFallbackTimer) clearTimeout(window.__anhadInstallFallbackTimer);
      window.__anhadInstallFallbackTimer = setTimeout(() => {
        if (!this._isStandalone() && !this._deferredPrompt) {
          const dismissed = Store.get(KEYS.INSTALL_DISMISSED);
          if (!dismissed || (Date.now() - parseInt(dismissed)) > INSTALL_COOLDOWN_MS) {
            console.log('[PWA] Showing install banner (Fallback/iOS)');
            this._showBanner();
          }
        }
      }, 5000); // 5s delay for stability
    },

    _isStandalone() {
      try {
        return window.matchMedia('(display-mode: standalone)').matches ||
          navigator.standalone ||
          Store.get(KEYS.PWA_INSTALLED) === true;
      } catch (e) { return false; }
    },

    _showBanner() {
      const banner = document.getElementById('installBanner');
      if (!banner) return;

      // The mini player occupies the same floating strip above the nav pill.
      // Two stacked floating cards there overlap, so defer to the player.
      if (document.querySelector('.mini-player--visible')) {
        console.log('[PWA] Mini player is visible, not showing install banner');
        return;
      }

      console.log('[PWA] Displaying install banner');
      banner.style.display = 'block';
      // Force reflow
      banner.offsetHeight;

      // Visibility is driven purely by the class — inline transform/opacity
      // would outrank the stylesheet and pin the banner to a hard-coded offset.
      requestAnimationFrame(() => {
        banner.classList.add('install-banner--visible');
      });
    },

    _hideBanner() {
      const banner = document.getElementById('installBanner');
      if (!banner) return;

      console.log('[PWA] Hiding install banner');
      banner.classList.remove('install-banner--visible');
      setTimeout(() => {
        if (!banner.classList.contains('install-banner--visible')) {
          banner.style.display = 'none';
        }
      }, 500);
    },

    _triggerInstall() {
      if (this._deferredPrompt) {
        console.log('[PWA] Triggering native install prompt');
        this._deferredPrompt.prompt();
        this._deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted install');
            Store.set(KEYS.PWA_INSTALLED, true);
          }
          this._deferredPrompt = null;
          this._hideBanner();
        });
      } else {
        // Detect platform for best install path
        const ua = navigator.userAgent || '';
        const isAndroid = /android/i.test(ua);
        const isIOS = /iPad|iPhone|iPod/.test(ua);

        if (isAndroid) {
          // Offer APK download for Android users via Chrome
          console.log('[PWA] Android detected — offering APK download');
          const apkUrl = 'https://github.com/user/anhad-app/releases/latest/download/anhad.apk';
          const confirmed = confirm(
            '📲 Install ANHAD App\n\n' +
            'Get the full native experience with:\n' +
            '• Background kirtan playback\n' +
            '• Home screen widgets\n' +
            '• Naam Abhyas reminders\n\n' +
            'Download the Android APK now?'
          );
          if (confirmed) {
            window.open(apkUrl, '_blank', 'noopener');
          }
        } else if (isIOS) {
          // iOS-specific instructions
          console.log('[PWA] iOS detected — showing Add to Home Screen instructions');
          alert(
            '📲 Install ANHAD\n\n' +
            '1. Tap the Share button  ⎙\n' +
            '2. Scroll down and tap "Add to Home Screen"\n' +
            '3. Tap "Add" to confirm\n\n' +
            'The app icon will appear on your Home Screen!'
          );
        } else {
          // Desktop / other browsers
          console.log('[PWA] Desktop/other — showing generic instructions');
          alert(
            '📲 Install ANHAD\n\n' +
            'Click the install icon in your browser\'s address bar,\n' +
            'or use your browser menu → "Install App".'
          );
        }
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 11. SCHEDULER — Efficient Timers (Not 6 Runaway Intervals)
  // ═══════════════════════════════════════════════════════════════════════════
  const Scheduler = {
    // Held on window for the same reason as ScrollHeader._observer above: a
    // second execution of this IIFE would otherwise get a fresh empty array and
    // be unable to see — let alone clear — the previous execution's timers.
    get _intervals() {
      if (!window.__anhadSchedulerIntervals) window.__anhadSchedulerIntervals = [];
      return window.__anhadSchedulerIntervals;
    },
    set _intervals(v) { window.__anhadSchedulerIntervals = v; },
    _visible: true,

    init() {
      // Everything in here is realm-scoped (window/document listeners plus one
      // interval), so it belongs to App.initOnce() and never to a mount.
      if (this._intervals.length > 0) {
        console.log('[Scheduler] Cleaning up', this._intervals.length, 'existing intervals');
        this.destroy();
      }

      // Only 2 timers. Not 6.
      // Greeting.update() removed - now handled by gurpurab event system
      this._add(() => UIController.updateNotificationBadge(), 300000); // Notifs: 5 min

      // Pause when tab hidden
      document.addEventListener('visibilitychange', () => {
        this._visible = document.visibilityState === 'visible';
        if (this._visible) {
          // Refresh all data when user returns
          Store.clearCache();
          UIController.refreshAll();
          // Greeting.update() removed - now handled by gurpurab event system
        }
      });

      // ═══ CRITICAL: bfcache recovery — fix stuck exit animations ═══
      window.addEventListener('pageshow', (e) => {
        // ALWAYS clean up visual state, not just on bfcache restore
        const appEl = document.querySelector('.app');
        if (appEl) {
          appEl.classList.remove('app--exiting');
          appEl.style.opacity = '';
          appEl.style.transform = '';
          appEl.style.filter = '';
          appEl.style.pointerEvents = '';
        }
        // Unlock body scroll in case a modal/sheet had locked it
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        // Close any stuck sheets
        SheetController.closeAll();

        // Deliberately no refreshAll() here any more: App's own pageshow hook
        // drives the full mount() on a bfcache restore, and running both meant
        // two rebuilds per restore.
        if (e.persisted) {
          console.log('[Scheduler] ✅ Recovered from bfcache (visual state reset)');
        }
      });

      // Proactively clean up BEFORE page enters bfcache
      window.addEventListener('pagehide', () => {
        const appEl = document.querySelector('.app');
        if (appEl) {
          appEl.classList.remove('app--exiting');
          appEl.style.opacity = '';
          appEl.style.transform = '';
          appEl.style.filter = '';
        }
        document.body.style.overflow = '';
      });

      // Handle browser back/forward button (popstate)
      window.addEventListener('popstate', () => {
        const appEl = document.querySelector('.app');
        if (appEl) {
          appEl.classList.remove('app--exiting');
          appEl.style.opacity = '';
          appEl.style.transform = '';
          appEl.style.filter = '';
          appEl.style.pointerEvents = '';
        }
        document.body.style.overflow = '';
        SheetController.closeAll();
      });
    },

    _add(fn, ms) {
      this._intervals.push(setInterval(() => {
        if (this._visible) fn();
      }, ms));
    },

    destroy() {
      this._intervals.forEach(id => clearInterval(id));
      this._intervals = [];
    }
  };

  // ═ SCROLL HEADER ═
  const ScrollHeader = {
    // Held on window, not as an object property: this file's IIFE can execute a
    // second time in one realm (arriving at Home from a hard-refreshed Insights
    // re-injects it — smooth-navigation.js:1081-1091), which would hand us a
    // fresh object whose _observer is undefined, orphaning the previous one
    // against a detached .greeting. Same trap as CarouselController._autoTimer.
    get _observer() { return window.__anhadScrollHeaderObserver || null; },
    set _observer(v) { window.__anhadScrollHeaderObserver = v; },

    init() {
      const greeting = document.querySelector('.greeting');
      if (!greeting) return;

      // Both nodes are inside #app, which the SPA replaces wholesale on every
      // navigation. The previous version captured them once and never
      // reconnected: the observer kept a strong reference to a detached
      // .greeting forever (so it could never fire again) while writing to a
      // detached .header, and header--compact silently stopped working after
      // the first return to Home. Rebuild against the live nodes, and resolve
      // .header at callback time rather than closing over it.
      if (this._observer) this._observer.disconnect();

      this._observer = new IntersectionObserver(
        ([entry]) => {
          const header = document.querySelector('.header');
          if (header) header.classList.toggle('header--compact', !entry.isIntersecting);
        },
        { threshold: 0, rootMargin: '-20px 0px 0px 0px' }
      );
      this._observer.observe(greeting);
    }
  };

  // ═ SCROLL REVEAL ═
  const ScrollReveal = {
    init() {
      // Delegated to window.AnhadScrollEngine for centralized, zero-cost viewport reveals
      if (window.AnhadScrollEngine && window.AnhadScrollEngine.scan) {
        window.AnhadScrollEngine.scan();
      }
    }
  };

  // ═ APP ORCHESTRATOR ═
  // ═══════════════════════════════════════════════════════════════════════════
  // APP LIFECYCLE — initOnce() / mount() / unmount()
  //
  // The split exists because Home has THREE entry paths that used to
  // initialize differently:
  //   (a) hard load       -> boot()
  //   (b) SPA arrival     -> refreshHomeForSpa(), via __anhadPageInit and the
  //                          anhad_page_changed event
  //   (c) Back / bfcache  -> pageshow
  //
  // What made (b) and (c) wrong: smooth-navigation.js replaces #app.innerHTML
  // wholesale (:716), destroying every node and every addEventListener on it —
  // while this file IS in SHELL_SCRIPTS (:261) and its <script> tag lives
  // OUTSIDE #app (index.html:3504), so it is never re-injected and this IIFE
  // never re-runs. App.init() was therefore never re-entered at all, and the
  // only thing still running on arrival was refreshAll(), which repaints data
  // but binds nothing. Result: the Practice cards and the Gurbani Radio hero
  // cards came back inert, and only a full reload (a new realm) fixed it.
  //
  // The rule for adding code here:
  //   binds a window/document listener, or owns a realm singleton -> initOnce()
  //   touches anything inside #app                                -> mount()
  // Anything in mount() MUST be safe to run again. Element listeners use the
  // per-node bindOnce() guard; timers use the clear-then-set-on-window idiom.
  // ═══════════════════════════════════════════════════════════════════════════
  const App = {
    // Kept as a shim so any existing caller keeps working.
    init() {
      this.initOnce();
      this.mount();
    },

    // ── REALM-SCOPED. Runs exactly once per JS realm. ───────────────────────
    initOnce() {
      if (window.__anhadAppInitOnce) return;
      window.__anhadAppInitOnce = true;

      Scheduler.init();

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') SheetController.closeAll();
      });

      // Entry path (c). A bfcache restore runs no applyNewContent(), so the
      // nav epoch never moves and refreshHomeForSpa() would suppress itself —
      // bump it here so the arrival registers as real.
      //
      // The probe is DOM truth, not e.persisted alone: the Capacitor WebView
      // does not reliably set persisted, and #heroCard1's bind expando says
      // directly whether the live DOM is currently wired up. On an ordinary
      // first load boot() has already mounted and claimed the epoch, so this
      // correctly does nothing rather than double-mounting.
      window.addEventListener('pageshow', (e) => {
        try {
          if (!isOnHome()) return;
          const hero = document.getElementById('heroCard1');
          const bound = !!(hero && hero.__anhadBound_nav);
          // window.__anhadHomeMounted is the authority, not the expando alone:
          // pagehide fires when a mobile PWA is merely backgrounded, so
          // unmount() has already stopped this page's timers while every node
          // is still bound. Probing the expando by itself would conclude
          // "nothing to do" and leave the carousel and campaign rotation dead
          // for the rest of the visit.
          if (!e.persisted && bound && window.__anhadHomeMounted) return;
          window.__anhadNavEpoch = (window.__anhadNavEpoch || 0) + 1;
          refreshHomeForSpa();
        } catch (err) {
          console.warn('[App] pageshow remount failed', err);
        }
      });
    },

    // ── PER-MOUNT. Runs on EVERY entry to Home. Must stay re-runnable. ──────
    mount() {
      // Each step is isolated. mount() now runs on EVERY arrival rather than
      // once per session, so a single throw part-way down would otherwise
      // starve everything after it — including _bindNavigation(), which is the
      // whole reason this method exists. One failing widget must not be able
      // to hand the user an inert Home again.
      const step = (label, fn) => {
        try { fn(); }
        catch (err) { console.warn('[App] mount step failed: ' + label, err); }
      };

      // Bindings first, deliberately: they are the P0 fix, they are cheap, and
      // nothing below them is a prerequisite. Data repaint can fail and the
      // page is still fully usable; the reverse is not true.
      step('bindNavigation', () => this._bindNavigation());
      step('bindSheets', () => this._bindSheets());

      // Reset state a previous page (or a stuck sheet) may have left behind.
      step('resetChrome', () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        SheetController.ensureAllClosed(); // Use ensureAllClosed instead of closeAll
        this._restoreHomeShellElements();
      });

      step('theme', () => ThemeController.init());
      step('carousel', () => CarouselController.init());
      step('portraitSlider', () => PortraitSlider.init());

      // PERF: Split UI updates and run them sequentially to yield the main thread.
      const criticalUpdates = [
        () => UIController.updateProgressBar(),
        () => UIController.updateHeroCardImages(),
        () => UIController.updateNitnemCard(),
        () => UIController.updateSehajCard(),
        () => UIController.updateHukamCard(),
        () => UIController.updateEventCard()
      ];

      const deferredUpdates = [
        () => UIController.updateNaamCard(),
        () => UIController.updateNotificationBadge(),
        () => UIController.updateNanakshahiDate(),
        () => UIController.updateNotesCard(),
        () => UIController.updateNitnemQuickAccess()
      ];

      // Schedule critical updates sequentially over separate frames
      let criticalIndex = 0;
      const runNextCritical = () => {
        if (criticalIndex < criticalUpdates.length) {
          step('criticalUpdate#' + criticalIndex, criticalUpdates[criticalIndex]);
          criticalIndex++;
          requestAnimationFrame(runNextCritical);
        } else {
          // Once critical is done, schedule deferred updates
          if ('requestIdleCallback' in window) {
            requestIdleCallback(runNextDeferred, { timeout: 1000 });
          } else {
            setTimeout(runNextDeferred, 150);
          }
        }
      };

      // Schedule deferred updates sequentially over idle callback or short timeout
      let deferredIndex = 0;
      const runNextDeferred = () => {
        if (deferredIndex < deferredUpdates.length) {
          step('deferredUpdate#' + deferredIndex, deferredUpdates[deferredIndex]);
          deferredIndex++;
          if (deferredIndex < deferredUpdates.length) {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(runNextDeferred, { timeout: 500 });
            } else {
              setTimeout(runNextDeferred, 50);
            }
          }
        }
      };

      // Start the update chain
      step('startUpdateChain', () => requestAnimationFrame(runNextCritical));

      // PERF: Defer API fetch with requestIdleCallback
      step('hukamHeroCard', () => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => UIController.updateHukamHeroCard(), { timeout: 2000 });
        } else {
          setTimeout(() => UIController.updateHukamHeroCard(), 1000);
        }
      });

      step('audioSync', () => AudioSync.init());
      step('install', () => InstallController.init());
      step('scrollHeader', () => ScrollHeader.init());
      step('scrollReveal', () => ScrollReveal.init());
      step('navIndicator', () => this._initNavIndicator());

      // Ambient campaign announcement inside the greeting (campaign-renderer.js).
      // Owns exactly one realm-scoped timer, so this is safe on every mount.
      step('campaign', () => {
        if (window.AnhadCampaignRenderer && window.AnhadCampaignRenderer.update) {
          window.AnhadCampaignRenderer.update();
        }
      });

      // Read by the pageshow probe in initOnce() to tell "already live" from
      // "unmounted and never remounted".
      window.__anhadHomeMounted = true;
    },

    // ── TEARDOWN. Runs when leaving Home, from both departure paths. ────────
    // Deliberately does NOT clear __anhadAppInitOnce or Scheduler's intervals:
    // those are realm-scoped and must survive so initOnce() stays a no-op.
    unmount() {
      window.__anhadHomeMounted = false;

      const stopTimer = (key, clear) => {
        try {
          if (window[key]) { clear(window[key]); window[key] = null; }
        } catch (e) {}
      };
      stopTimer('__anhadEventCardRotation', clearInterval);
      stopTimer('__anhadCarouselAutoTimer', clearInterval);
      stopTimer('__anhadInstallFallbackTimer', clearTimeout);
      stopTimer('__anhadAudioSyncTimer', clearTimeout);

      try {
        (window.__anhadOverlayRemoveTimers || []).forEach(id => clearTimeout(id));
        window.__anhadOverlayRemoveTimers = [];
      } catch (e) {}

      try {
        if (window.__anhadScrollHeaderObserver) {
          window.__anhadScrollHeaderObserver.disconnect();
          window.__anhadScrollHeaderObserver = null;
        }
      } catch (e) {}

      try {
        if (window.AnhadCampaignRenderer && window.AnhadCampaignRenderer.stopRotation) {
          window.AnhadCampaignRenderer.stopRotation();
        }
      } catch (e) {}

      try { SheetController.closeAll(); } catch (e) {}
      try { Navigation._clearTimers(); } catch (e) {}

      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const appEl = document.querySelector('.app');
      if (appEl) appEl.classList.remove('app--exiting');
    },

    // smooth-navigation.js:560-573 force-hides a list of out-of-app elements on
    // every swap with inline display/visibility/opacity/pointer-events, and never
    // restores them — so Home's own decorative layers stayed dead for the rest of
    // the session after a single navigation away. Restore only the Home-owned
    // decorative subset; deliberately NOT .welcome-screen / .ultra-loader /
    // .skeleton-container, which are meant to stay hidden once dismissed.
    _restoreHomeShellElements() {
      ['.bg-orbs', '.ikonkar-background', '#ikonkarBackground', '.bg-effects'].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.display = '';
          el.style.visibility = '';
          el.style.opacity = '';
          el.style.pointerEvents = '';
        });
      });
    },

    _initNavIndicator() {
      const indicator = document.getElementById('navIndicator');
      const tabs = document.querySelectorAll('.nav-tab');
      if (!indicator || !tabs.length) return;

      const activeTab = document.querySelector('.nav-tab--active');
      if (activeTab) {
        const rect = activeTab.getBoundingClientRect();
        const parent = activeTab.parentElement.getBoundingClientRect();
        indicator.style.transform = `translateX(${rect.left - parent.left + (rect.width - 56) / 2}px) translateY(-50%)`;
      }
    },

    _bindNavigation() {
      // Practice grid cards
      Navigation.bindCard('nitnemPractice', NAV_PATHS.nitnem);
      Navigation.bindCard('sehajPractice', NAV_PATHS.sehajPaath);
      Navigation.bindCard('hukamPractice', NAV_PATHS.hukamnama);

      // Quick access cards
      Navigation.bindCard('nitnemTrackerCard', NAV_PATHS.nitnemTracker);
      Navigation.bindCard('naamCard', NAV_PATHS.naamAbhyas);
      Navigation.bindCard('shabadVicharCard', NAV_PATHS.shabadVichar);
      Navigation.bindCard('searchCard', NAV_PATHS.gurbaniKhoj);
      Navigation.bindCard('eventCard', NAV_PATHS.calendar);

      // Hero cards -> Radio
      Navigation.bindCard('heroCard1', NAV_PATHS.gurbaniRadio);
      Navigation.bindCard('heroCard2', NAV_PATHS.gurbaniRadioAlt);
      Navigation.bindCard('heroCard3', NAV_PATHS.gurbaniRadioSimran);

      // Notification button: bound via a plain onclick="" attribute on
      // #notifBtn itself (frontend/index.html header markup) instead of
      // addEventListener here. This matters most on a cached-clone return to
      // Home (DOM_CACHE hit): that path clones a saved #app node and never
      // re-runs this._bindNavigation() at all (App.init()'s window-level
      // guard only lets the FULL bind sequence run once per session), so an
      // addEventListener-based binding could never survive/rebind once Home
      // is restored from cache — onclick="" survives because it's baked into
      // the cloned HTML itself. See also the (now-removed) duplicate binding
      // this used to have in homepage-data.js.
    },

    // Called from mount(), so every binding here needs the per-node guard:
    // these three ids live inside #app and are fresh nodes on every arrival.
    _bindSheets() {
      const bind = (id, key, fn) => {
        const el = document.getElementById(id);
        if (bindOnce(el, key)) el.addEventListener('click', fn);
      };

      bind('radioSheetCancel', 'sheetCancel', () => {
        SheetController.close('radioSheet');
      });

      // Radio sheet options
      bind('optionDarbar', 'sheetDarbar', () => {
        SheetController.close('radioSheet');
        Navigation.navigateTo(NAV_PATHS.gurbaniRadio);
      });

      bind('optionAmritvela', 'sheetAmritvela', () => {
        SheetController.close('radioSheet');
        Navigation.navigateTo(NAV_PATHS.gurbaniRadioAlt);
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════════════════════════
  // ── SPA re-entry, registered BEFORE boot() ────────────────────────────────
  // Order is load-bearing. This module is one IIFE, and boot()/App.init() below
  // runs a long synchronous chain with no error handling of its own. Registered
  // after boot(), a single throw anywhere in App.init() aborted the IIFE and
  // this listener never existed — permanently killing every future SPA return
  // to Home while a hard load still looked fine. Registering first (plus the
  // try/catch on boot) means repopulation survives an init failure.
  // Set the instant boot() below completes App.init() for a FRESH script
  // injection (arriving at Home from a page that never loaded this file, e.g.
  // Insights). That happens synchronously mid-way through
  // smooth-navigation.js's executePageScripts(), which is BEFORE the
  // anhad_page_changed event this module also listens for — so on that exact
  // navigation, App.init() (which already runs PortraitSlider.init(),
  // updateEventCard(), etc. as part of its own criticalUpdates) and
  // refreshHomeForSpa() (which reruns the same work via refreshAll() /
  // reviveHomepageVisuals()) both fired for the SAME arrival, back to back —
  // a real double DOM rebuild of the guru slider and every home card, visible
  // as a flash/"looks like it reloaded". On every later, ordinary return to
  // Home the script is never re-injected, App.init() never runs again, and
  // only the listener below fires — this window only needs to suppress the
  // one redundant call that follows an App.init() moments earlier.
  window.__anhadHomeBootedAt = 0;
  window.__anhadHomeLastRefreshAt = 0;

  // Debounce lives INSIDE refreshHomeForSpa, not in whichever caller happens
  // to invoke it. There are now two independent triggers for the same
  // navigation — the anhad_page_changed listener below, AND
  // smooth-navigation.js's runPageInit() -> window.__anhadPageInit registry
  // (see that registration further down, which used to be silently
  // overwritten by homepage-data.js's own registration for the same 4 keys —
  // now fixed to compose instead of clobber). Putting the debounce here means
  // BOTH triggers firing for one arrival — expected once the clobbering bug
  // is fixed — still only does the actual work once, instead of reintroducing
  // the double-render this function was written to eliminate in the first
  // place.
  // Deduplicated per ARRIVAL, not per elapsed time.
  //
  // The previous version used two wall-clock windows and both dropped real
  // arrivals, leaving Home with its shipped placeholders — an empty guru
  // slider, three &nbsp; greeting lines and a skeleton Gurpurab card:
  //
  //   * A 500ms window stamped on every call. The anhad_page_changed listener
  //     below had no "am I on Home?" check and that event fires on EVERY
  //     navigation, so LEAVING Home stamped the clock. Returning within 500ms —
  //     trivial, because PAGE_CACHE makes the swap instant — made both triggers
  //     bail and nothing repopulated Home.
  //   * A 2500ms window measured from __anhadHomeBootedAt, which boot() stamps
  //     once per JS realm. Every arrival inside the first 2.5s of a session
  //     bailed against a DOM that applyNewContent had already replaced.
  //
  // smooth-navigation.js now bumps window.__anhadNavEpoch once per arrival, so
  // the two triggers for a single arrival collapse correctly while a genuinely
  // new arrival always runs — no timing assumption, no artificial delay.
  let pendingEpoch = null;
  const refreshHomeForSpa = () => {
    const epoch = window.__anhadNavEpoch || 0;
    if (window.__anhadHomeHandledEpoch === epoch) return; // already done for this arrival
    if (pendingEpoch === epoch) return;                   // already scheduled for this arrival
    pendingEpoch = epoch;
    Store.clearCache();
    requestAnimationFrame(() => {
      pendingEpoch = null;
      // Claimed only once the work actually runs, so a frame dropped while
      // backgrounded cannot mark the arrival handled without repopulating.
      window.__anhadHomeHandledEpoch = epoch;
      // The whole point of the lifecycle fix: this used to be refreshAll()
      // alone, which repaints data but binds nothing — so after the #app swap
      // every card came back inert. mount() rebinds against the live DOM and
      // calls refreshAll() itself. initOnce() is a no-op after the first call.
      try { App.initOnce(); App.mount(); }
      catch (err) { console.warn('[Trendora] Home mount failed', err); }
    });
  };

  const isOnHome = () => {
    const p = window.location.pathname;
    return p === '/' || p === '/frontend/' ||
      p.endsWith('/index.html') || p.endsWith('/frontend/');
  };

  if (!_trendoraModuleListenersAlreadyBound) {
    window.addEventListener('anhad_page_changed', () => {
      // anhad_page_changed fires for every navigation, including departures.
      // Without this check, leaving Home ran refreshAll() against the incoming
      // page's DOM and — under the old time-based debounce — poisoned the very
      // window a fast return needed.
      if (!isOnHome()) return;
      console.log('[Trendora] Page change detected, refreshing UI data...');
      refreshHomeForSpa();
    });
  }

  // Second, independent repopulation path via the shell's own page-lifecycle
  // registry (smooth-navigation.js runPageInit), mirroring how
  // homepage-data.js and Insights/insights.js already register. Belt and
  // braces: if the event listener above is ever lost, Home still repopulates.
  //
  // Composes with whatever is already registered at each key instead of
  // overwriting it outright. homepage-data.js registers these SAME 4 keys
  // (loaded right after this script, index.html:3387-3388) — whichever
  // script's registration ran second used to silently win, so
  // window.__anhadPageInit['/index.html'] only ever called ONE of the two
  // intended repopulation functions, never both, despite each script's own
  // comments describing this as redundant "belt and braces" coverage.
  window.__anhadPageInit = window.__anhadPageInit || {};
  ['/', '/index.html', '/frontend/', '/frontend/index.html'].forEach(p => {
    const existing = window.__anhadPageInit[p];
    window.__anhadPageInit[p] = (existing && existing !== refreshHomeForSpa)
      ? () => {
          try { existing(); } catch (e) { console.warn('[Trendora] chained page-init (existing) failed', e); }
          refreshHomeForSpa();
        }
      : refreshHomeForSpa;
  });

  // Teardown half of the lifecycle. smooth-navigation.js has read
  // window.__anhadPageCleanup since it was written (runPageCleanup(), :332-350)
  // but nothing in the codebase ever registered a handler, so leaving Home
  // never released anything. Composes rather than overwrites, exactly like the
  // __anhadPageInit registration above; runPageCleanup() de-dupes by function
  // identity, so registering all four Home keys still yields one call.
  window.__anhadPageCleanup = window.__anhadPageCleanup || {};
  const _homeCleanup = () => {
    try { App.unmount(); } catch (e) { console.warn('[Trendora] Home unmount failed', e); }
  };
  ['/', '/index.html', '/frontend/', '/frontend/index.html'].forEach(p => {
    const existing = window.__anhadPageCleanup[p];
    window.__anhadPageCleanup[p] = (existing && existing !== _homeCleanup)
      ? () => {
          try { existing(); } catch (e) { console.warn('[Trendora] chained cleanup failed', e); }
          _homeCleanup();
        }
      : _homeCleanup;
  });

  const boot = () => {
    try {
      App.init();
      window.__anhadHomeBootedAt = Date.now();
      // App.init() fully populates Home, so claim the arrival this script was
      // injected on. That is the one case where both the epoch triggers below
      // AND a full init fire for the same navigation (arriving at Home from a
      // page that never loaded this file); without this they would rebuild
      // everything a second time, which is the visible "two-time flash".
      window.__anhadHomeHandledEpoch = window.__anhadNavEpoch || 0;
      console.log('[Trendora] App Initialized');
    } catch (err) {
      // Never let an init failure take down the rest of this module.
      console.error('[Trendora] App.init() failed — SPA refresh path still active', err);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP: Remove hero card dark overlays
  // ═══════════════════════════════════════════════════════════════════════════
  if (window.innerWidth >= 1024) {
    const removeOverlays = () => {
      // Inject CSS once per document. This used to append unconditionally on
      // every call — including the two delayed re-runs below and every later
      // invocation — so duplicate #hero-overlay-remover nodes accumulated.
      if (document.getElementById('hero-overlay-remover')) {
        applyOverlayInlineStyles();
        return;
      }
      const style = document.createElement('style');
      style.id = 'hero-overlay-remover';
      style.textContent = `
        .hero-card__image-wrapper::before,
        .hero-card__image-wrapper::after {
          display: none !important;
          content: none !important;
          background: none !important;
          opacity: 0 !important;
        }
        .hero-card__image {
          mask-image: none !important;
          -webkit-mask-image: none !important;
          filter: none !important;
        }
        .hero-card__overlay {
          background: transparent !important;
        }
      `;
      document.head.appendChild(style);
      applyOverlayInlineStyles();
    };

    // Per-node guarded: cssText += on an already-processed node appends the
    // same declarations again and grows the style attribute without bound.
    function applyOverlayInlineStyles() {
      document.querySelectorAll('.hero-card__image-wrapper').forEach(el => {
        if (!bindOnce(el, 'heroWrapStyle')) return;
        el.style.cssText += '; position: relative; overflow: hidden; border-radius: 16px;';
      });
      document.querySelectorAll('.hero-card__image').forEach(el => {
        if (!bindOnce(el, 'heroImgStyle')) return;
        el.style.cssText += '; mask-image: none; -webkit-mask-image: none; filter: none;';
      });
      document.querySelectorAll('.hero-card__overlay').forEach(el => {
        if (!bindOnce(el, 'heroOverlayStyle')) return;
        el.style.cssText += '; background: transparent;';
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', removeOverlays);
    } else {
      removeOverlays();
    }

    // Also run after a short delay to catch any dynamically added elements.
    // Tracked on window so App.unmount() can cancel them when Home is left
    // before they fire, instead of letting them run against the next page.
    window.__anhadOverlayRemoveTimers = window.__anhadOverlayRemoveTimers || [];
    window.__anhadOverlayRemoveTimers.push(setTimeout(removeOverlays, 500));
    window.__anhadOverlayRemoveTimers.push(setTimeout(removeOverlays, 1000));

    // The hero nodes are replaced on every SPA arrival, so the inline styles
    // (and their per-node guards) have to be reapplied to the new ones.
    window.addEventListener('anhad_page_changed', () => {
      if (window.innerWidth >= 1024) removeOverlays();
    });
  }

  // NOTE: the anhad_page_changed listener and the __anhadPageInit registration
  // both live ABOVE boot() now — see the comment there for why the order
  // matters.

})();

