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

  window.addEventListener('pagehide', () => {
    if (Navigation._exitTimer) {
      clearTimeout(Navigation._exitTimer);
      Navigation._exitTimer = null;
    }
    if (Navigation._safetyTimer) {
      clearTimeout(Navigation._safetyTimer);
      Navigation._safetyTimer = null;
    }
  }, { once: true });

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
      const salEl = document.getElementById('greetingSalutation');
      const gurEl = document.getElementById('greetingGurbani');
      const transEl = document.getElementById('greetingTranslation');
      const name = DataManager.getUserName();
      const sal = this.getSalutation();
      if (salEl) salEl.textContent = name ? `${sal}, ${name}` : sal;
      const tuk = this.getTuk();
      if (gurEl) gurEl.textContent = tuk.gurmukhi;
      if (transEl) transEl.textContent = tuk.translation;
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
      'guru-granth': 'sggs'
    };

    for (const [key, guruId] of Object.entries(mapping)) {
      if (searchStrings.some(s => s.includes(key))) {
        return guruId;
      }
    }
    return null;
  }

  const PortraitSlider = {
    _currentIndex: 4, // Default to Guru Arjan Dev Ji
    _startX: 0,
    _isDragging: false,
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
      if (!track) {
        console.log('[PortraitSlider] Track element not found, skipping init');
        return;
      }

      // Check cached upcoming gurpurab in localStorage to set initial index synchronously
      try {
        const cachedStr = localStorage.getItem('anhad_cached_upcoming_gurpurab');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const event = cached.events && cached.events[0];
          const guruId = getGuruIdFromEvent(event);
          if (guruId) {
            const idx = this._gurus.findIndex(g => g.id === guruId);
            if (idx !== -1) {
              this._currentIndex = idx;
            }
          }
        }
      } catch (e) {
        console.warn('[PortraitSlider] Failed to parse cached upcoming gurpurab on init:', e);
      }

      // Clear track and inject slides
      track.innerHTML = '';
      this._gurus.forEach((guru, i) => {
        const slide = document.createElement('div');
        slide.className = 'greeting__slide';
        slide.dataset.index = i;
        slide.innerHTML = `
          <div class="greeting__guru-portrait">
            <img class="greeting__guru-img" src="${guru.img}" alt="${guru.name}" loading="lazy" style="object-position: ${guru.pos || 'center 25%'} !important;">
          </div>
        `;
        track.appendChild(slide);
      });

      this._bindEvents();
      this.update(true);
    },

    _bindEvents() {
      const slider = document.getElementById('guruSlider');
      if (!slider) return;

      slider.addEventListener('touchstart', (e) => this._onDragStart(e.touches[0].clientX), { passive: true });
      slider.addEventListener('mousedown', (e) => this._onDragStart(e.clientX));

      // SCROLL FIX: passive:true on touchmove prevents the browser from waiting to
      // see if we'll call preventDefault() — which would block page scroll on mobile.
      slider.addEventListener('touchmove', (e) => this._onDragMove(e.touches[0].clientX), { passive: true });
      window.addEventListener('mousemove', (e) => this._onDragMove(e.clientX));

      // SCROLL FIX: passive:true on window touchend is CRITICAL.
      // A non-passive window touchend listener blocks scroll dispatch for the
      // entire page on Android Chrome because the browser must wait to check if
      // preventDefault() will be called — even if we never call it.
      window.addEventListener('touchend', () => this._onDragEnd(), { passive: true });
      window.addEventListener('touchcancel', () => this._onDragEnd(), { passive: true });
      window.addEventListener('mouseup', () => this._onDragEnd());
    },

    _onDragStart(x) {
      this._startX = x;
      this._isDragging = true;
    },

    _onDragMove(x) {
      if (!this._isDragging) return;
      const diff = this._startX - x;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.next();
        else this.prev();
        this._isDragging = false;
      }
    },

    _onDragEnd() {
      this._isDragging = false;
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
          guruId = idOrEvent; // fallback
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
        // Handle wrap around
        if (diff < -total / 2) diff += total;
        if (diff > total / 2) diff -= total;

        if (diff === 0) slide.classList.add('greeting__slide--active');
        else if (diff === -1) slide.classList.add('greeting__slide--prev');
        else if (diff === 1) slide.classList.add('greeting__slide--next');
        else if (diff < -1) slide.classList.add('greeting__slide--far-prev');
        else if (diff > 1) slide.classList.add('greeting__slide--far-next');
      });

      // Update background orb colors based on current Guru
      this._updateOrbColors();
      
      this._syncText();
    },

    _updateOrbColors() {
      const guru = this._gurus[this._currentIndex];
      if (!guru || !guru.colors || guru.colors.length === 0) return;

      const orb1 = document.querySelector('.greeting-orb-1');
      const orb2 = document.querySelector('.greeting-orb-2');
      const orb3 = document.querySelector('.greeting-orb-3');

      if (!orb1 || !orb2 || !orb3) return;

      // Helper function to convert hex to rgba
      const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const color1 = guru.colors[0] || '#ddcdb3';
      const color2 = guru.colors[1] || guru.colors[0] || '#ddcdb3';
      const color3 = guru.colors[2] || guru.colors[1] || guru.colors[0] || '#ddcdb3';

      // Apply gradient backgrounds with smooth transition
      orb1.style.background = `radial-gradient(circle, ${hexToRgba(color1, 0.7)}, ${hexToRgba(color1, 0.4)}, transparent)`;
      orb2.style.background = `radial-gradient(circle, ${hexToRgba(color2, 0.7)}, ${hexToRgba(color2, 0.4)}, transparent)`;
      orb3.style.background = `radial-gradient(circle, ${hexToRgba(color3, 0.6)}, ${hexToRgba(color3, 0.3)}, transparent)`;
    },

    _syncText() {
      const guru = this._gurus[this._currentIndex];
      const salEl = document.getElementById('greetingSalutation');
      const gurEl = document.getElementById('greetingGurbani');
      const transEl = document.getElementById('greetingTranslation');

      if (salEl) salEl.textContent = guru.name;
      if (gurEl) {
        if (guru.gurbani) {
          gurEl.textContent = guru.gurbani;
          if (transEl) transEl.textContent = guru.translation;
        } else {
          const tuk = Greeting.getTuk();
          gurEl.textContent = tuk.gurmukhi;
          if (transEl) transEl.textContent = tuk.translation;
        }
      }
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
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const guruNames = ['guru nanak', 'ਗੁਰੂ ਨਾਨਕ', 'guru angad', 'ਗੁਰੂ ਅੰਗਦ', 'guru amar das', 'ਗੁਰੂ ਅਮਰ ਦਾਸ', 'guru ram das', 'ਗੁਰੂ ਰਾਮ ਦਾਸ', 'guru arjan', 'ਗੁਰੂ ਅਰਜਨ', 'guru har gobind', 'ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ', 'guru hargobind', 'ਗੁਰੂ ਹਰਗੋਬਿੰਦ', 'guru har rai', 'ਗੁਰੂ ਹਰਿ ਰਾਇ', 'guru har krishan', 'ਗੁਰੂ ਹਰਿ ਕ੍ਰਿਸ਼ਨ', 'guru harkrishan', 'ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ', 'guru tegh bahadur', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦੁਰ', 'guru gobind singh', 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ'];
        const events = (data.years['2026'] || [])
          .filter(e => {
            if (e.type?.toLowerCase().includes('dastar') || e.name_en?.toLowerCase().includes('dastar')) return false;
            if (nameFilter === 'guru-sahib') {
              const name = String(e.name_en || '').toLowerCase();
              const namePa = String(e.name_pa || '').toLowerCase();
              return guruNames.some(guruName => name.includes(guruName) || namePa.includes(guruName));
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
      const statusEl = document.getElementById('hukamStatus');
      // Show date initially
      if (statusEl) statusEl.textContent = DataManager.getHukamDate();
      // Then try to load and show first line from BaniDB
      const preview = await DataManager.getHukamnamaPreview();
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

      // Clear any existing rotation interval
      if (card && card._rotationInterval) {
        clearInterval(card._rotationInterval);
        card._rotationInterval = null;
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

        // Update date/countdown display
        if (event.isToday) {
          if (event.eventCategory === 'remembrance') {
            if (dateEl) dateEl.textContent = '🕯️ In remembrance';
            if (countEl) countEl.textContent = '🙏';
            if (labelEl) labelEl.textContent = 'Today';
          } else if (event.eventCategory === 'celebration') {
            if (dateEl) dateEl.textContent = '🎉 Celebrate today!';
            if (countEl) countEl.textContent = '✨';
            if (labelEl) labelEl.textContent = 'Today';
          } else {
            if (dateEl) dateEl.textContent = 'Today';
            if (countEl) countEl.textContent = '🙏';
            if (labelEl) labelEl.textContent = 'Today';
          }
          if (badgeValueEl) badgeValueEl.textContent = 'Today';
          if (badgeLabelEl) badgeLabelEl.textContent = '';
        } else {
          if (dateEl) dateEl.textContent = event.dateStr;
          if (countEl) countEl.textContent = event.daysLeft;
          if (labelEl) labelEl.textContent = event.daysLeft === 1 ? 'day' : 'days';
          if (badgeValueEl) badgeValueEl.textContent = event.daysLeft;
          if (badgeLabelEl) badgeLabelEl.textContent = event.daysLeft === 1 ? 'day left' : 'days left';
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

        card._rotationInterval = setInterval(() => {
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
      const guruImageMap = {
        // Primary patterns
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
        'sggs': 'guruimages/gurugranthsahebji.jpeg',
        'guru-granth': 'guruimages/gurugranthsahebji.jpeg',
        'sahibzad': 'guruimages/gurugobindsinghsahebji.jpeg',
        'vaisakhi': 'guruimages/gurugobindsinghsahebji.jpeg',
        'khalsa': 'guruimages/gurugobindsinghsahebji.jpeg',
        'bandi-chhor': 'guruimages/guruhargobindsahebji.jpeg',
        'miri-piri': 'guruimages/guruhargobindsahebji.jpeg',
        // Additional patterns for better matching
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
      const evName = (event.name || '').toLowerCase();
      const evId = (event.id || '').toLowerCase();

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
          guruName = nameMap[key] || event.name;
          console.log('[GuruImage] Matched pattern:', key, '->', guruName, guruImg);
          break;
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

        const doSwap = () => {
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
      if (textEl) textEl.textContent = `${completed}/${total}`;
      if (labelEl) labelEl.textContent = completed >= total ? '✓ Complete' : 'Today\'s Nitnem';
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
      Store.clearCache();
      this.updateNitnemCard();
      this.updateSehajCard();
      this.updateHukamCard();
      this.updateNaamCard();
      this.updateProgressBar();
      this.updateNotificationBadge();
      this.updateNanakshahiDate();
      this.updateNotesCard();
      this.updateNitnemQuickAccess();
      this.autoRemindUpcomingGurpurab();
      this.updateHeroCardImages();

      // RE-INIT HOMEPAGE COMPONENTS
      // These elements only exist on index.html, but refreshAll is called 
      // on every SPA swap. The internal guards in these init methods 
      // will prevent errors if the elements are missing.
      if (typeof Greeting !== 'undefined') Greeting.update();
      if (typeof PortraitSlider !== 'undefined') PortraitSlider.init();
      if (typeof CarouselController !== 'undefined') CarouselController.init();
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
      const titleEl = document.getElementById('heroHukamTitle');
      const subtitleEl = document.getElementById('heroHukamSubtitle');
      if (!titleEl) return;
      const preview = await DataManager.getHukamnamaPreview();
      if (preview && preview.firstLine) {
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
        preload.onload = () => {
          img.style.transition = 'opacity 0s';
          img.style.opacity = '0';
          requestAnimationFrame(() => {
            img.src = src;
            img.style.transition = 'opacity 0.5s ease';
            requestAnimationFrame(() => { img.style.opacity = '1'; });
          });
        };
        preload.onerror = () => { img.src = src; };
        preload.src = src;
        if (preload.complete && preload.naturalWidth > 0) preload.onload();
      });
    }

  };

  // ═ THEME CONTROLLER (Reconstructed — Single Source of Truth) ═
  const ThemeController = {
    init() {
      // Read the unified theme key
      const savedTheme = localStorage.getItem('anhad_theme') || 'light';

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

      const isDark = getIsDark(savedTheme);
      this._apply(isDark);

      // Listen for custom theme change events
      window.addEventListener('themechange', (e) => {
        UIController.updateHeroCardImages();
      });

      // Toggle button
      document.getElementById('themeToggle')?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';

        // Store the theme
        localStorage.setItem('anhad_theme', newTheme);
        try { localStorage.setItem('anhad_dark_mode', String(newTheme === 'dark')); } catch (e) { }

        // Apply to DOM
        this._apply(newTheme === 'dark');

        // Sync with global-theme.js if loaded
        if (window.AnhadTheme) {
          window.AnhadTheme.set(newTheme);
        }

        // Update meta theme-color
        const metas = document.querySelectorAll('meta[name="theme-color"]');
        metas.forEach(m => m.content = newTheme === 'dark' ? '#000000' : '#F2F2F7');

        // Dispatch event for components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));

        console.log('🎨 Theme toggled:', newTheme);
      });

      // Listen for storage changes (other tabs)
      window.addEventListener('storage', (e) => {
        if ((e.key === 'anhad_theme' || e.key === 'anhad_forced_time_of_day') && localStorage.getItem('anhad_theme')) {
          const isDark = getIsDark(localStorage.getItem('anhad_theme'));
          this._apply(isDark);
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

      // INSTANT THEME CHANGE: Disable transitions temporarily
      root.classList.add('theme-changing');

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
      const dot = document.getElementById('themeDot');
      const toggleBtn = document.getElementById('themeToggle');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-checked', String(isDark));
      }

      // FORCE SYNCHRONOUS LAYOUT to ensure the transition skip applies immediately
      const _ = root.offsetHeight;

      // Remove the class to re-enable transitions for normal interactions
      setTimeout(() => {
        root.classList.remove('theme-changing');
      }, 100);
    }
  };

  // ═ CAROUSEL CONTROLLER ═
  const CarouselController = {
    _autoTimer: null,
    _paused: false,

    init() {
      const track = document.getElementById('heroTrack');
      const dots = document.querySelectorAll('.hero-carousel__dot');
      if (!track || !dots.length) return;

      let current = 0;
      const totalSlides = track.children.length;

      // PERF: Throttled scroll handler using rAF to prevent 100+ events/sec
      let scrollTicking = false;
      track.addEventListener('scroll', () => {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(() => {
            const idx = Math.round(track.scrollLeft / track.offsetWidth);
            if (idx !== current) {
              current = idx;
              dots.forEach((d, i) => d.classList.toggle('hero-carousel__dot--active', i === idx));
            }
            scrollTicking = false;
          });
        }
      }, { passive: true });

      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          track.scrollLeft = i * track.offsetWidth;
        });
      });

      // Auto-advance every 7 seconds
      this._autoTimer = setInterval(() => {
        if (this._paused) return;
        current = (current + 1) % totalSlides;
        track.scrollLeft = current * track.offsetWidth;
        dots.forEach((d, i) => d.classList.toggle('hero-carousel__dot--active', i === current));
      }, 7000);

      // Pause on touch
      track.addEventListener('touchstart', () => { this._paused = true; }, { passive: true });
      track.addEventListener('touchend', () => {
        setTimeout(() => { this._paused = false; }, 10000);
      }, { passive: true });
    }
  };

  // ═ SHEET CONTROLLER ═
  const SheetController = {
    _active: null,

    open(sheetId) {
      const overlay = document.getElementById(sheetId + 'Overlay');
      const sheet = document.getElementById(sheetId);
      if (!overlay || !sheet) return;

      overlay.classList.add('sheet-overlay--active');
      sheet.classList.add('sheet--active');
      document.body.style.overflow = 'hidden';
      this._active = sheetId;

      // Close on overlay click
      overlay.addEventListener('click', () => this.close(sheetId), { once: true });
    },

    close(sheetId) {
      const id = sheetId || this._active;
      if (!id) return;

      const overlay = document.getElementById(id + 'Overlay');
      const sheet = document.getElementById(id);

      if (sheet) sheet.classList.remove('sheet--active');
      if (overlay) {
        setTimeout(() => {
          overlay.classList.remove('sheet-overlay--active');
        }, 300);
      }
      document.body.style.overflow = '';
      this._active = null;
    },

    closeAll() {
      if (this._active) this.close(this._active);
    }
  };

  // ═ AUDIO SYNC — Dual Hero Cards + Mini Player ═
  const AudioSync = {
    _info: {
      darbar: { title: 'Darbar Sahib Ji Live', subtitle: 'Sri Harmandir Sahib Ji' },
      amritvela: { title: 'Amritvela Kirtan', subtitle: 'Curated Smagam Tracks' },
      simran: { title: 'Waheguru Simran', subtitle: 'Divine Meditation & Simran' }
    },

    init() {
      // FIX: Guard against duplicate listener binding on re-init
      if (this._initialized) {
        console.log('[AudioSync] Already initialized, skipping re-bind');
        return;
      }
      this._initialized = true;
      
      // ══ CAPACITOR OPTIMIZATION: Listen for cached page restore ══
      // When user returns to home from cache, ONLY sync UI state
      // Do NOT re-initialize audio engine or mini-player
      window.addEventListener('anhad_page_restored', (e) => {
        if (e.detail.fromCache) {
          console.log('[AudioSync] ⚡ Cached page restored, syncing UI only');
          // Quick UI sync without heavy initialization
          if (window.AnhadAudio) {
            const state = window.AnhadAudio.getState();
            if (state.isPlaying) {
              this._sync({ isPlaying: true, stream: state.currentStream || 'darbar' });
            }
          }
        }
      });
      
      // Both hero play buttons - trigger mini player directly instead of navigating
      ['heroPlayBtn1', 'heroPlayBtn2', 'heroPlayBtn3', 'heroPlayBtn4'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
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
      document.getElementById('miniPlayerPlayBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (window.AnhadAudio) {
          window.AnhadAudio.toggle();
        }
      });

      window.addEventListener('anhadAudioStateChange', (e) => this._sync(e.detail));

      // Check initial state using AnhadAudio singleton
      // REDUCED delay from 800ms to 300ms for faster initial sync
      setTimeout(() => {
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

      // Check for persistent dismissal (24h cooldown)
      const dismissedTime = Store.get(KEYS.INSTALL_DISMISSED);
      if (dismissedTime && (Date.now() - parseInt(dismissedTime)) < 86400000) {
        console.log('[PWA] Banner dismissed recently, waiting for cooldown');
        banner.style.display = 'none';
        return;
      }

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

      // Fallback for iOS/Safari: show after delay if not dismissed and no prompt yet
      setTimeout(() => {
        if (!this._isStandalone() && !this._deferredPrompt) {
          const dismissed = Store.get(KEYS.INSTALL_DISMISSED);
          if (!dismissed || (Date.now() - parseInt(dismissed)) > 86400000) {
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

      console.log('[PWA] Displaying install banner');
      banner.style.display = 'block';
      // Force reflow
      banner.offsetHeight;

      requestAnimationFrame(() => {
        banner.classList.add('install-banner--visible');
        banner.style.opacity = '1';
        banner.style.transform = 'translateY(0)';
      });
    },

    _hideBanner() {
      const banner = document.getElementById('installBanner');
      if (!banner) return;

      console.log('[PWA] Hiding install banner');
      banner.classList.remove('install-banner--visible');
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity = '0';
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
    _intervals: [],
    _visible: true,

    init() {
      // FIX: Clean up existing intervals before re-init to prevent memory leaks
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

        if (e.persisted) {
          Store.clearCache();
          UIController.refreshAll();
          // Greeting.update() removed - now handled by gurpurab event system
          console.log('[Scheduler] ✅ Recovered from bfcache');
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
    init() {
      const header = document.querySelector('.header');
      const greeting = document.querySelector('.greeting');
      if (!header || !greeting) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          header.classList.toggle('header--compact', !entry.isIntersecting);
        },
        { threshold: 0, rootMargin: '-20px 0px 0px 0px' }
      );
      observer.observe(greeting);
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
  const App = {
    _isInitialized: false,

    init() {
      // FIX: Guard against duplicate init() calls from SPA page changes
      // On re-entry, only refresh data — don't re-bind all listeners
      if (this._isInitialized) {
        console.log('[App] Already initialized, running refreshAll() only');
        requestAnimationFrame(() => UIController.refreshAll());
        return;
      }
      this._isInitialized = true;

      // CRITICAL: Reset body overflow in case it was stuck from previous session
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      // Close any stuck sheets from previous session
      SheetController.closeAll();

      ThemeController.init();
      CarouselController.init();
      PortraitSlider.init();
      this._bindNavigation();

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
          criticalUpdates[criticalIndex]();
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
          deferredUpdates[deferredIndex]();
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
      requestAnimationFrame(runNextCritical);

      // PERF: Defer API fetch with requestIdleCallback
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => UIController.updateHukamHeroCard(), { timeout: 2000 });
      } else {
        setTimeout(() => UIController.updateHukamHeroCard(), 1000);
      }

      AudioSync.init();
      InstallController.init();
      Scheduler.init();
      ScrollHeader.init();
      ScrollReveal.init();
      this._initNavIndicator();
      this._bindSheets();

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') SheetController.closeAll();
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

      // Notification button
      document.getElementById('notifBtn')?.addEventListener('click', () => {
        Navigation.navigateTo(NAV_PATHS.reminders);
      });
    },

    _bindSheets() {

      document.getElementById('radioSheetCancel')?.addEventListener('click', () => {
        SheetController.close('radioSheet');
      });

      // Radio sheet options
      document.getElementById('optionDarbar')?.addEventListener('click', () => {
        SheetController.close('radioSheet');
        Navigation.navigateTo(NAV_PATHS.gurbaniRadio);
      });

      document.getElementById('optionAmritvela')?.addEventListener('click', () => {
        SheetController.close('radioSheet');
        Navigation.navigateTo(NAV_PATHS.gurbaniRadioAlt);
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════════════════════════
  const boot = () => {
    App.init();
    console.log('[Trendora] App Initialized');
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
      // Inject CSS
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

      // Directly modify elements
      document.querySelectorAll('.hero-card__image-wrapper').forEach(el => {
        el.style.cssText += '; position: relative; overflow: hidden; border-radius: 16px;';
      });
      document.querySelectorAll('.hero-card__image').forEach(el => {
        el.style.cssText += '; mask-image: none; -webkit-mask-image: none; filter: none;';
      });
      document.querySelectorAll('.hero-card__overlay').forEach(el => {
        el.style.cssText += '; background: transparent;';
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', removeOverlays);
    } else {
      removeOverlays();
    }

    // Also run after a short delay to catch any dynamically added elements
    setTimeout(removeOverlays, 500);
    setTimeout(removeOverlays, 1000);
  }

  // Handle SPA page changes from the shell
  window.addEventListener('anhad_page_changed', () => {
    console.log('[Trendora] Page change detected, refreshing UI data...');
    // FIX: Don't re-init the entire app — only refresh data to prevent
    // duplicate event listeners and memory leaks
    Store.clearCache();
    requestAnimationFrame(() => UIController.refreshAll());
  });

})();

