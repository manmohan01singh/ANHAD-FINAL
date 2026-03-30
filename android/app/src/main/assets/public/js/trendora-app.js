/* ANHAD — TRENDORA-INSPIRED PREMIUM APPLICATION LOGIC V2 */
(function() {
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
    NITNEM_STREAK: 'nitnemTracker_streakData',
    NITNEM_USER: 'nitnemTracker_userData',
    NITNEM_SELECTED: 'nitnemTracker_selectedBanis',
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
    USER_PROFILE: 'anhad_user_profile'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 3. NAVIGATION PATHS
  // ═══════════════════════════════════════════════════════════════════════════
  const NAV_PATHS = {
    gurbaniRadio: 'GurbaniRadio/ios17-gurbani-radio.html',
    gurbaniRadioAlt: 'GurbaniRadio/gurbani-radio.html',
    hukamnama: 'Hukamnama/daily-hukamnama.html',
    randomShabad: 'RandomShabad/random-shabad.html',
    nitnem: 'nitnem/indexbani.html',
    sehajPaath: 'SehajPaath/sehaj-paath.html',
    gurbaniKhoj: 'GurbaniKhoj/gurbani-khoj.html',
    naamAbhyas: 'NaamAbhyas/naam-abhyas.html',
    calendar: 'Calendar/Gurupurab-Calendar.html',
    nitnemTracker: 'NitnemTracker/nitnem-tracker.html',
    reminders: 'reminders/smart-reminders.html',
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
      const app = document.querySelector('.app');
      if (app) {
        app.classList.add('app--exiting');
        // Navigate after exit animation
        this._exitTimer = setTimeout(() => { window.location.href = path; }, 180);
        // SAFETY: If navigation doesn't happen within 600ms (e.g. browser blocks it),
        // remove the exit class so the page isn't stuck invisible
        this._safetyTimer = setTimeout(() => {
          if (app.classList.contains('app--exiting')) {
            app.classList.remove('app--exiting');
            app.style.opacity = '';
            app.style.transform = '';
            app.style.filter = '';
            console.warn('[Navigation] Safety: removed stuck app--exiting');
          }
        }, 600);
      } else {
        window.location.href = path;
      }
    },

    bindCard(elementId, path) {
      const el = document.getElementById(elementId);
      if (!el) return;
      
      el.addEventListener('click', (e) => {
        // Don't navigate if clicking on interactive children
        if (e.target.closest('button[data-action]') || e.target.closest('a[href]')) return;
        e.preventDefault();
        this.navigateTo(path);
      });

      // Keyboard accessibility
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

  // ═══════════════════════════════════════════════════════════════════════════
  // § 5. CONTEXTUAL GURBANI GREETING
  // Not "Good Morning ☀️" — every weather app does that.
  // Instead: rotating Gurbani tuks with translations.
  // ═══════════════════════════════════════════════════════════════════════════
  const Greeting = {
    _tuks: {
      amritvela: [
        { gurmukhi: 'ਜਾਗ ਲੇਹੁ ਰੇ ਮਨਾ ਜਾਗ ਲੇਹੁ ਕਹਾ ਗਾਫਲ ਸੋਇਆ ॥', translation: 'Wake up, O my mind! Wake up! Why are you sleeping unaware?' },
        { gurmukhi: 'ਕੁਰਬਾਣੁ ਜਾਈ ਉਸੁ ਵੇਲਾ ਸੁਹਾਵੀ ਜਿਤੁ ਤੁਮਰੈ ਦੁਆਰੈ ਆਇਆ ॥', translation: 'I am a sacrifice to that beautiful time, when I come to Your Door.' },
        { gurmukhi: 'ਚੋਜੀ ਮੇਰੇ ਗੋਵਿੰਦਾ ਚੋਜੀ ਮੇਰੇ ਪਿਆਰਿਆ ਹਰਿ ਪ੍ਰਭੁ ਮੇਰਾ ਚੋਜੀ ਜੀਉ ॥', translation: 'Playful is my Lord of the Universe, Playful is my Beloved. My Lord God is Playful.' }
      ],
      morning: [
        { gurmukhi: 'ਹਰਿ ਕੀ ਵਡਿਆਈ ਦੇਖਹੁ ਸੰਤਹੁ ਹਰਿ ਨਿਮਾਣਿਆ ਮਾਣੁ ਦੇਵਾਏ ॥', translation: 'Behold the glorious greatness of the Lord, O Saints; the Lord bestows honor upon the dishonored.' },
        { gurmukhi: 'ਏ ਮਨ ਹਰਿ ਜੀ ਧਿਆਇ ਤੂ ਇਕ ਮਨਿ ਇਕ ਚਿਤਿ ਭਾਇ ॥', translation: 'O mind, meditate on the Dear Lord, with single-minded consciousness and loving focus.' },
        { gurmukhi: 'ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ ਜੀਉ ॥੫॥', translation: 'The One Name is the Lord\'s Command; O Nanak, the True Guru has given me this understanding.' }
      ],
      afternoon: [
        { gurmukhi: 'ਓਇ ਸਾਜਨ ਓਇ ਮੀਤ ਪਿਆਰੇ ॥', translation: 'They are my friends, they are my beloved companions.' },
        { gurmukhi: 'ਜੋ ਮਾਗਹਿ ਠਾਕੁਰ ਅਪੁਨੇ ਤੇ ਸੋਈ ਸੋਈ ਦੇਵੈ ॥', translation: 'Whatever one asks of his Lord and Master, He gives that very thing.' },
        { gurmukhi: 'ਹਉ ਬਲਿਹਾਰੀ ਤਿੰਨ ਕੰਉ ਜੋ ਗੁਰਮੁਖਿ ਸਿਖਾ ॥', translation: 'I am a sacrifice to those Sikhs who live as Gurmukhs.' }
      ],
      evening: [
        { gurmukhi: 'ਪ੍ਰੀਤਮ ਜਾਨਿ ਲੇਹੁ ਮਨ ਮਾਹੀ ॥', translation: 'O Beloved, please know this in Your Mind.' },
        { gurmukhi: 'ਵਿਣੁ ਮਨੁ ਮਾਰੇ ਕੋਇ ਨ ਸਿਝਈ ਵੇਖਹੁ ਕੋ ਲਿਵ ਲਾਇ ॥', translation: 'Without subduing the mind, no one succeeds; let anyone carefully reflect on this.' },
        { gurmukhi: 'ਰੰਗਿ ਰਤਾ ਮੇਰਾ ਸਾਹਿਬੁ ਰਵਿ ਰਹਿਆ ਭਰਪੂਰਿ ॥੧॥ ਰਹਾਉ ॥', translation: 'Imbued with Love, my Lord and Master is pervading and permeating all. ||1||Pause||' }
      ],
      night: [
        { gurmukhi: 'ਚੇਤਨਾ ਹੈ ਤਉ ਚੇਤ ਲੈ ਨਿਸਿ ਦਿਨਿ ਮੈ ਪ੍ਰਾਨੀ ॥', translation: 'If you are going to become conscious, then be conscious of Him, night and day, O mortal.' },
        { gurmukhi: 'ਮੀਤੁ ਕਰੈ ਸੋਈ ਹਮ ਮਾਨਾ ॥', translation: 'Whatever my Friend does, I accept.' },
        { gurmukhi: 'ਭਉ ਨ ਵਿਆਪੈ ਤੇਰੀ ਸਰਣਾ ॥', translation: 'Fear does not overtake one who seeks Your Sanctuary.' }
      ]
    },

    getSalutation() {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 6) return 'ਵਾਹਿਗੁਰੂ ਜੀ';
      if (hour >= 6 && hour < 12) return 'Sat Sri Akal';
      if (hour >= 12 && hour < 17) return 'Sat Sri Akal';
      if (hour >= 17 && hour < 21) return 'Sat Sri Akal';
      return 'ਵਾਹਿਗੁਰੂ ਜੀ';
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
      // Randomize on every render for a dynamic and refreshing experience
      const randomIndex = Math.floor(Math.random() * tuks.length);
      return tuks[randomIndex];
    },

    update() {
      const salEl = document.getElementById('greetingSalutation');
      const gurEl = document.getElementById('greetingGurbani');
      const transEl = document.getElementById('greetingTranslation');

      // Set greeting with user name if available
      const name = DataManager.getUserName();
      const sal = this.getSalutation();
      if (salEl) salEl.textContent = name ? `${sal}, ${name}` : sal;
      
      const tuk = this.getTuk();
      if (gurEl) gurEl.textContent = tuk.gurmukhi;
      if (transEl) transEl.textContent = tuk.translation;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 6. DATA MANAGER — Real Data, No Fabrication
  // ═══════════════════════════════════════════════════════════════════════════
  const DataManager = {
    getTotalBanis() {
      const selected = Store.get(KEYS.NITNEM_SELECTED);
      if (!selected) return 11;
      const total = (selected.amritvela?.length || 0) +
                    (selected.rehras?.length || 0) +
                    (selected.sohila?.length || 0);
      return total || 11;
    },

    getCompletedToday() {
      const today = new Date().toLocaleDateString('en-CA');
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
      // Try streakData first
      const streakData = Store.get(KEYS.NITNEM_STREAK);
      if (streakData) {
        const s = streakData.current || streakData.currentStreak || 0;
        if (s > 0) return s;
      }
      // Fallback to userData
      const userData = Store.get(KEYS.NITNEM_USER);
      if (userData) {
        return userData.streaks?.current || userData.streak?.current || 0;
      }
      return 0;
    },

    getSehajPaath() {
      let currentAng = 1;

      // Primary: sehajPaathState
      const state = Store.get(KEYS.SEHAJ_STATE);
      if (state) {
        currentAng = state.currentPaath?.currentAng || state.currentAng || 1;
      }

      // Fallback: backup
      if (currentAng <= 1) {
        const backup = Store.get(KEYS.SEHAJ_BACKUP);
        if (backup) {
          currentAng = backup.data?.currentAng || backup.currentAng || 1;
        }
      }

      const totalAngs = 1430;
      const progress = ((currentAng / totalAngs) * 100).toFixed(1);
      const remaining = totalAngs - currentAng + 1;

      return { currentAng, totalAngs, progress, remaining, hasStarted: currentAng > 1 };
    },

    getNaamAbhyas() {
      let lastSession = null;
      let completedToday = 0;
      let totalSessions = 0;
      let nextHour = null;

      const history = Store.get(KEYS.NAAM_HISTORY);
      if (history) {
        const today = new Date().toLocaleDateString('en-CA');
        if (history.daily && history.daily[today]) {
          completedToday = history.daily[today].completed || 0;
        }
        if (history.sessions && history.sessions.length > 0) {
          const sorted = [...history.sessions].sort((a, b) =>
            new Date(b.endTime || b.date) - new Date(a.endTime || a.date)
          );
          lastSession = sorted[0];
        }
        totalSessions = history.totalCompleted || 0;
      }

      // Check schedule for next session
      const schedule = Store.get(KEYS.NAAM_SCHEDULE);
      if (schedule && typeof schedule === 'object') {
        const now = new Date();
        const startHour = now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours();
        for (let h = startHour; h < 24; h++) {
          if (schedule[h] && schedule[h].status === 'pending') {
            nextHour = h;
            break;
          }
        }
      }

      return { lastSession, completedToday, totalSessions, nextHour };
    },

    getHukamDate() {
      return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    async getNextGurpurab() {
      try {
        // Check sessionStorage cache first (1-hour TTL)
        const cacheKey = 'gurpurab_cache';
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const c = JSON.parse(cached);
            if (c.ts && Date.now() - c.ts < 3600000) return c.data;
          } catch(e) { /* cache miss */ }
        }

        const response = await fetch('data/gurpurab-events-2026.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const events = (data.years['2026'] || [])
          .map(e => ({
            name: e.name_en,
            id: e.id,
            date: new Date(e.gregorian_date),
            type: e.type
          }))
          .sort((a, b) => a.date - b.date);

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');

        const todayEvent = events.find(g => g.date.toLocaleDateString('en-CA') === todayStr);
        let result = null;
        if (todayEvent) {
          result = { name: todayEvent.name, id: todayEvent.id, daysLeft: 0, dateStr: 'Today', isToday: true };
        } else {
          const upcoming = events.find(g => g.date >= now);
          if (upcoming) {
            const daysLeft = Math.ceil((upcoming.date - now) / 86400000);
            const dateStr = upcoming.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            result = { name: upcoming.name, id: upcoming.id, daysLeft, dateStr, isToday: false };
          }
        }

        // Cache the result
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result })); } catch(e) {}
        return result;
      } catch (e) {
        return null;
      }
    },

    getNotificationCount() {
      let count = 0;
      try {
        const reminders = Store.get(KEYS.REMINDERS);
        if (reminders) {
          count += reminders.custom?.filter(r => !r.completed)?.length || 0;
        }
      } catch (e) { /* silent */ }
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
      const hour = new Date().getHours();
      const completed = this.getCompletedToday();
      const total = this.getTotalBanis();
      if (completed >= total) return 'All Complete ✓';
      const today = new Date().toLocaleDateString('en-CA');
      const log = Store.get(KEYS.NITNEM_LOG);
      const todayData = log ? log[today] : null;
      const doneAmritvela = todayData?.amritvela?.length || (Array.isArray(todayData) ? todayData.length : 0);
      const doneRehras = todayData?.rehras?.length || 0;
      const doneSohila = todayData?.sohila?.length || 0;
      if (hour >= 4 && hour < 17 && doneAmritvela === 0) return 'Morning Banis due';
      if (hour >= 17 && hour < 21 && doneRehras === 0) return 'Rehras Sahib Ji due';
      if ((hour >= 21 || hour < 4) && doneSohila === 0) return 'Sohila Sahib Ji due';
      return `${completed}/${total} done`;
    },

    async getHukamnamaPreview() {
      try {
        const cache = Store.get(KEYS.HUKAM_CACHE);
        const today = new Date().toLocaleDateString('en-CA');
        if (cache && cache.date === today && cache.firstLine) {
          return cache;
        }
        const resp = await fetch('https://api.banidb.com/v2/hukamnamas/today');
        if (!resp.ok) return null;
        const data = await resp.json();
        let firstLine = '', writer = '', ang = null;
        if (data.hukamnamainfo) {
          ang = data.hukamnamainfo.pageno;
          const verses = data.hukamnama || [];
          for (const v of verses) {
            const text = (v.verse || '').trim();
            if (text && text.length > 10 && !text.includes('ਮਹਲਾ') && !text.includes('ਸਲੋਕ')) {
              firstLine = text; break;
            }
          }
          if (!firstLine && verses.length > 0) firstLine = (verses[0].verse || '').trim();
          if (verses[0]?.writerId) {
            const writerMap = {1:'Guru Nanak Dev Sahib Ji',2:'Guru Angad Dev Sahib Ji',3:'Guru Amar Das Sahib Ji',4:'Guru Ram Das Sahib Ji',5:'Guru Arjan Dev Sahib Ji',6:'Guru Teg Bahadur Ji'};
            writer = writerMap[verses[0].writerId] || '';
          }
        } else if (data.shabads && data.shabads.length > 0) {
          const info = data.shabads[0]?.shabadInfo || {};
          ang = info.pageNo;
          writer = info?.writer?.english || '';
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
        if (sDate === today) {
          totalMinutes += (s.duration || s.durationMinutes || 0);
        }
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
      const date = new Date();
      const year = date.getFullYear();
      const nanakshahiEpoch = new Date(year, 2, 14);
      const diffTime = date - nanakshahiEpoch;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const monthNames = ['ਚੇਤ','ਵੈਸਾਖ','ਜੇਠ','ਹਾੜ','ਸਾਵਣ','ਭਾਦੋਂ','ਅੱਸੂ','ਕੱਤਕ','ਮੱਘਰ','ਪੋਹ','ਮਾਘ','ਫੱਗਣ'];
      const monthLengths = [31,31,31,31,31,30,30,30,30,30,30,30];
      let nanakshahiYear = year - 1468;
      let nMonth = 0, nDay = 1;
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
    // Progress ring helper (circumference = 2*PI*26 = 163.4)
    _setRing(id, progress) {
      const ring = document.getElementById(id);
      if (!ring) return;
      const circumference = 163.4; // 2 * PI * 26 (SVG r=26)
      ring.style.strokeDasharray = circumference;
      const offset = circumference * (1 - Math.min(progress, 1));
      requestAnimationFrame(() => { ring.style.strokeDashoffset = offset; });
    },

    updateNitnemCard() {
      const completed = DataManager.getCompletedToday();
      const total = DataManager.getTotalBanis();
      const streak = DataManager.getStreak();
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
        if (streak > 0) {
          streakEl.innerHTML = `<span class="quick-card__streak">🔥 ${streak} day${streak > 1 ? 's' : ''}</span>`;
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

    async updateEventCard() {
      const event = await DataManager.getNextGurpurab();
      const titleEl = document.getElementById('eventTitle');
      const dateEl = document.getElementById('eventDate');
      const countEl = document.getElementById('eventCountdown');
      const labelEl = document.getElementById('eventCountdownLabel');

      if (!event) {
        const card = document.getElementById('eventCard');
        if (card) card.style.display = 'none';
        return;
      }

      if (titleEl) {
        titleEl.textContent = event.name;
        titleEl.classList.remove('skeleton');
      }

      if (event.isToday) {
        if (dateEl) dateEl.textContent = '🎉 Celebrate today!';
        if (countEl) countEl.textContent = '🙏';
        if (labelEl) labelEl.textContent = 'Today';
      } else {
        if (dateEl) dateEl.textContent = event.dateStr;
        if (countEl) countEl.textContent = event.daysLeft;
        if (labelEl) labelEl.textContent = event.daysLeft === 1 ? 'day' : 'days';
      }

      // ── Guru Image Mapping ──
      const guruImageMap = {
        'guru-nanak':      'guru-nanak-dev-ji.png',
        'guru-angad':      'guru-angad-dev-ji.png',
        'guru-amar-das':   'guru-amar-das-ji.png',
        'guru-ram-das':    'guru-ramdas-ji.png',
        'guru-arjan':      'guru-arjan-dev-ji.png',
        'guru-hargobind':  'guru-hargobind-ji.png',
        'guru-har-rai':    'guru-har-rai-ji.png',
        'guru-harkrishan':  'guru-har-krishan-ji.png',
        'guru-har-krishan': 'guru-har-krishan-ji.png',
        'guru-tegh-bahadur': 'guru-tegh-bahadur-ji.png',
        'guru-teg-bahadur': 'guru-tegh-bahadur-ji.png',
        'guru-gobind':     'guru-gobind-singh-ji.png',
        'sggs':            'guru-granth-sahib-ji.png',
        'guru-granth':     'guru-granth-sahib-ji.png',
        'sahibzad':        'sahibzade.png',
        'vaisakhi':        'guru-gobind-singh-ji.png',
        'khalsa':          'guru-gobind-singh-ji.png',
        'bandi-chhor':     'guru-hargobind-ji.png',
        'miri-piri':       'guru-hargobind-ji.png',
      };

      // Match event ID to Guru image
      let guruImg = null;
      let guruName = null;
      const evId = (event.id || '').toLowerCase();
      for (const [key, filename] of Object.entries(guruImageMap)) {
        if (evId.includes(key)) {
          guruImg = 'assets/icons/' + filename;
          // Extract a readable Guru name
          const nameMap = {
            'guru-nanak': 'Sri Guru Nanak Dev Sahib Ji',
            'guru-angad': 'Sri Guru Angad Dev Sahib Ji',
            'guru-amar-das': 'Sri Guru Amar Das Sahib Ji',
            'guru-ram-das': 'Sri Guru Ram Das Sahib Ji',
            'guru-arjan': 'Sri Guru Arjan Dev Sahib Ji',
            'guru-hargobind': 'Sri Guru Hargobind Ji',
            'guru-har-rai': 'Sri Guru Har Rai Sahib Ji',
            'guru-harkrishan': 'Sri Guru Har Krishan Sahib Ji',
            'guru-har-krishan': 'Sri Guru Har Krishan Sahib Ji',
            'guru-tegh-bahadur': 'Sri Guru Tegh Bahadur Sahib Ji',
            'guru-teg-bahadur': 'Sri Guru Tegh Bahadur Sahib Ji',
            'guru-gobind': 'Sri Guru Gobind Singh Sahib Ji',
            'sggs': 'Sri Guru Granth Sahib Ji',
            'guru-granth': 'Sri Guru Granth Sahib Ji',
            'sahibzad': 'Chaar Sahib Jizade',
            'vaisakhi': 'Khalsa Panth',
            'khalsa': 'Khalsa Panth',
            'bandi-chhor': 'Sri Guru Hargobind Ji',
            'miri-piri': 'Sri Guru Hargobind Ji',
          };
          guruName = nameMap[key] || event.name;
          break;
        }
      }

      // Update event card image
      const eventGuruImg = document.getElementById('eventGuruImg');
      if (eventGuruImg && guruImg) {
        eventGuruImg.src = guruImg;
        eventGuruImg.alt = guruName || event.name;
      }

      // Update greeting portrait & salutation
      const greetingImg = document.getElementById('guruPortraitImg');
      const salEl = document.getElementById('greetingSalutation');
      if (greetingImg && guruImg) {
        greetingImg.src = guruImg;
        greetingImg.alt = guruName || event.name;
      }
      if (salEl && guruName) {
        salEl.textContent = guruName;
      }
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
    },

    async autoRemindUpcomingGurpurab() {
      if (!('Notification' in window) || !window.isSecureContext) return;
      if (Notification.permission !== 'granted') return;

      const event = await DataManager.getNextGurpurab();
      if (!event) return;

      if (event.daysLeft === 1) {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const cacheKey = `gurpurab_global_notified_${event.id}_${todayStr}`;
        if (!localStorage.getItem(cacheKey)) {
          try {
            const n = new Notification('Tomorrow is ' + event.name, {
              body: 'A special holy day is arriving tomorrow. Tap to view the Gurpurab calendar.',
              icon: 'assets/favicon-32x32.png',
              requireInteraction: true
            });
            n.onclick = () => {
              window.focus();
              Navigation.navigateTo(NAV_PATHS.calendar + '?highlight=' + event.id);
            };
            localStorage.setItem(cacheKey, 'true');
          } catch(e){}
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
    }
  };

  // ═ THEME CONTROLLER (Reconstructed — Single Source of Truth) ═
  const ThemeController = {
    init() {
      // Read the unified theme key
      const savedTheme = localStorage.getItem('anhad_theme') || 'light';
      this._apply(savedTheme === 'dark');

      // Toggle button
      document.getElementById('themeToggle')?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';

        // Store the theme
        localStorage.setItem('anhad_theme', newTheme);
        try { localStorage.setItem('anhad_dark_mode', String(newTheme === 'dark')); } catch(e) {}

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
        if (e.key === 'anhad_theme' && e.newValue) {
          this._apply(e.newValue === 'dark');
        }
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
      const dot = document.getElementById('themeDot');
      const toggleBtn = document.getElementById('themeToggle');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-checked', String(isDark));
      }
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
          track.scrollTo({ left: i * track.offsetWidth, behavior: 'smooth' });
        });
      });

      // Auto-advance every 7 seconds
      this._autoTimer = setInterval(() => {
        if (this._paused) return;
        current = (current + 1) % totalSlides;
        track.scrollTo({ left: current * track.offsetWidth, behavior: 'smooth' });
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
      amritvela: { title: 'Amritvela Kirtan', subtitle: 'Curated Smagam Tracks' }
    },

    init() {
      // Both hero play buttons
      ['heroPlayBtn1', 'heroPlayBtn2'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const stream = btn.dataset.stream;
          if (window.AnhadAudio) window.AnhadAudio.toggle(stream);
        });
      });

      // Mini player
      document.getElementById('miniPlayerPlayBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.AnhadAudio) {
          window.AnhadAudio.isPlaying() ? window.AnhadAudio.pause() : window.AnhadAudio.play();
        }
      });

      window.addEventListener('anhadAudioStateChange', (e) => this._sync(e.detail));

      setTimeout(() => {
        if (window.AnhadAudio && window.AnhadAudio.isPlaying()) {
          this._sync({ isPlaying: true, stream: window.AnhadAudio.getCurrentStream() || 'darbar' });
        }
      }, 800);
    },

    _sync({ isPlaying, stream }) {
      const pauseIcon = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      const playIcon = '<polygon points="6,3 20,12 6,21"/>';

      // Hero cards
      ['1', '2'].forEach(n => {
        const card = document.getElementById('heroCard' + n);
        const icon = document.getElementById('heroPlayIcon' + n);
        const cardStream = card?.dataset.stream;
        const isThis = stream === cardStream && isPlaying;
        if (card) card.classList.toggle('hero-card--playing', isThis);
        if (icon) icon.innerHTML = isThis ? pauseIcon : playIcon;
      });

      // Mini player
      const miniPlayer = document.getElementById('miniPlayer');
      if (miniPlayer) miniPlayer.classList.toggle('mini-player--visible', isPlaying);

      const info = this._info[stream] || this._info.darbar;
      const miniTitle = document.getElementById('miniTitle');
      const miniSubtitle = document.getElementById('miniSubtitle');
      const miniPlayIcon = document.getElementById('miniPlayIcon');
      const miniThumb = document.querySelector('.mini-player__thumb');

      if (miniTitle) {
        miniTitle.innerHTML = (stream === 'darbar' ? '<span class="mini-player__live-dot"></span>' : '') + info.title;
      }
      if (miniSubtitle) miniSubtitle.textContent = info.subtitle;
      if (miniPlayIcon) miniPlayIcon.innerHTML = isPlaying ? pauseIcon : playIcon;
      if (miniThumb) {
        miniThumb.src = stream === 'amritvela' ? 'assets/Darbar-sahib-AMRITVELA.webp' : 'assets/darbar-sahib-evening.webp';
        miniThumb.alt = info.title;
      }
    }
  };

  // ═ INSTALL CONTROLLER ═
  const InstallController = {
    _deferredPrompt: null,

    init() {
      const inlineInstallCard = document.getElementById('installAppCard');
      
      if (this._isStandalone()) {
        if (inlineInstallCard) inlineInstallCard.style.display = 'none';
        return;
      }

      // Show inline install card if not installed
      if (inlineInstallCard) inlineInstallCard.style.display = 'flex';

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this._deferredPrompt = e;
        setTimeout(() => this._showBanner(), 2000);
      });

      window.addEventListener('appinstalled', () => {
        Store.set(KEYS.PWA_INSTALLED, true);
        this._hideBanner();
        if (inlineInstallCard) inlineInstallCard.style.display = 'none';
      });

      // Bind buttons
      document.getElementById('installCta')?.addEventListener('click', () => this._install());
      document.getElementById('installDismiss')?.addEventListener('click', () => this._dismiss());
      document.getElementById('installAppCard')?.addEventListener('click', () => this._install());
    },

    _isStandalone() {
      try {
        return window.matchMedia('(display-mode: standalone)').matches ||
               navigator.standalone ||
               Store.get(KEYS.PWA_INSTALLED) === true;
      } catch (e) { return false; }
    },

    _showBanner() {
      // Don't show if dismissed recently (24h)
      const dismissed = Store.get(KEYS.INSTALL_DISMISSED);
      if (dismissed && (Date.now() - dismissed) < 86400000) return;

      const banner = document.getElementById('installBanner');
      if (banner) banner.classList.add('install-banner--visible');
    },

    _hideBanner() {
      const banner = document.getElementById('installBanner');
      if (banner) banner.classList.remove('install-banner--visible');
    },

    async _install() {
      if (this._deferredPrompt) {
        this._deferredPrompt.prompt();
        const { outcome } = await this._deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          Store.set(KEYS.PWA_INSTALLED, true);
          this._hideBanner();
        }
        this._deferredPrompt = null;
      } else {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        alert(isIOS
          ? 'To install ANHAD:\n\n1. Tap the Share button (📤)\n2. Tap "Add to Home Screen"\n3. Tap "Add"'
          : 'Use your browser\'s menu to install this app.');
      }
    },

    _dismiss() {
      Store.set(KEYS.INSTALL_DISMISSED, Date.now());
      this._hideBanner();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § 11. SCHEDULER — Efficient Timers (Not 6 Runaway Intervals)
  // ═══════════════════════════════════════════════════════════════════════════
  const Scheduler = {
    _intervals: [],
    _visible: true,

    init() {
      // Only 2 timers. Not 6.
      this._add(() => Greeting.update(), 3600000);  // Greeting: 1 hour (changes ~2x/day)
      this._add(() => UIController.updateNotificationBadge(), 300000); // Notifs: 5 min

      // Pause when tab hidden
      document.addEventListener('visibilitychange', () => {
        this._visible = document.visibilityState === 'visible';
        if (this._visible) {
          // Refresh all data when user returns
          Store.clearCache();
          UIController.refreshAll();
          Greeting.update();
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
          Greeting.update();
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
      const targets = document.querySelectorAll('.practice-grid, .quick-card, .event-card');
      if (!targets.length || !('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('scroll-revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      targets.forEach(t => observer.observe(t));
    }
  };

  // ═ APP ORCHESTRATOR ═
  const App = {
    init() {
      ThemeController.init();
      CarouselController.init();
      Greeting.update();
      this._bindNavigation();

      // PERF: Batch all DOM updates into a single rAF
      requestAnimationFrame(() => {
        UIController.updateNitnemCard();
        UIController.updateSehajCard();
        UIController.updateHukamCard();
        UIController.updateNaamCard();
        UIController.updateProgressBar();
        UIController.updateNotificationBadge();
        UIController.updateEventCard();
        UIController.updateNanakshahiDate();
        UIController.updateNotesCard();
        UIController.updateNitnemQuickAccess();
      });

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
      Navigation.bindCard('shabadCard', NAV_PATHS.randomShabad);
      Navigation.bindCard('searchCard', NAV_PATHS.gurbaniKhoj);
      Navigation.bindCard('eventCard', NAV_PATHS.calendar);

      // Hero cards -> Radio
      Navigation.bindCard('heroCard1', NAV_PATHS.gurbaniRadio);
      Navigation.bindCard('heroCard2', NAV_PATHS.gurbaniRadioAlt);

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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

})();
