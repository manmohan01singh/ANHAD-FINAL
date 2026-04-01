(function () {
  'use strict';

  const EVENT_TYPES = [
    { id: 'all', label: 'All' },
    { id: 'prakash', label: 'Prakash' },
    { id: 'shaheedi', label: 'Shaheedi' },
    { id: 'gurgaddi', label: 'Gurgaddi' },
    { id: 'historical', label: 'Historical' },
    { id: 'sangrand', label: 'Sangrand' },
    { id: 'puranmashi', label: 'Puranmashi' },
    { id: 'masya', label: 'Masya' }
  ];

  const TYPE_COLORS = {
    prakash: '#FF6B00',
    shaheedi: '#EF4444',
    gurgaddi: '#8B5CF6',
    historical: '#22C55E',
    sangrand: '#3B82F6',
    puranmashi: '#F59E0B',
    masya: '#111827'
  };

  const STORAGE = {
    CACHE: 'gurpurab_calendar_cache_v1',
    REMINDERS: 'gurpurab_calendar_reminders_v1'
  };

  const CONFIG = {
    CACHE_TTL_MS: 24 * 60 * 60 * 1000,
    UPCOMING_DAYS: 365,
    ENABLE_REMOTE_SYNC: false
  };

  const nsCal = (() => {
    try {
      return (typeof window !== 'undefined' && window.NanakshahiCalendar)
        ? new window.NanakshahiCalendar()
        : null;
    } catch (e) {
      console.warn('[GurpurabCalendar] NanakshahiCalendar init failed:', e);
      return null;
    }
  })();

  const state = {
    today: startOfDay(new Date()),
    month: startOfMonth(new Date()),
    view: 'monthly',
    filterType: 'all',
    query: '',
    events: [],
    selectedEvent: null,
    eventsByYear: new Map()
  };

  // Add to gurpurab-calendar.js
  class CalendarThemeEngine {
    constructor() {
      this.themes = {
        light: {
          '--cal-bg': '#f8f9fa',
          '--cal-card': '#ffffff',
          '--cal-text': '#1d1d1f',
          '--cal-muted': '#6e6e73',
          '--cal-accent': '#007aff',
          '--cal-highlight': 'rgba(0, 122, 255, 0.1)',
          '--cal-border': 'rgba(0, 0, 0, 0.08)'
        },
        dark: {
          '--cal-bg': '#0d0d12',
          '--cal-card': 'rgba(255, 255, 255, 0.05)',
          '--cal-text': '#ffffff',
          '--cal-muted': '#8e8e93',
          '--cal-accent': '#d4a574',
          '--cal-highlight': 'rgba(212, 165, 116, 0.15)',
          '--cal-border': 'rgba(255, 255, 255, 0.1)'
        },
        divineGold: {
          '--cal-bg': 'linear-gradient(180deg, #1a1510 0%, #0d0a06 100%)',
          '--cal-card': 'rgba(201, 168, 108, 0.08)',
          '--cal-text': '#f0e6d3',
          '--cal-muted': '#9a8b70',
          '--cal-accent': '#c9a86c',
          '--cal-highlight': 'rgba(201, 168, 108, 0.2)',
          '--cal-border': 'rgba(201, 168, 108, 0.15)'
        },
        sepia: {
          '--cal-bg': '#f4ecd8',
          '--cal-card': '#faf6eb',
          '--cal-text': '#5c4b37',
          '--cal-muted': '#8b7355',
          '--cal-accent': '#8b6914',
          '--cal-highlight': 'rgba(139, 115, 85, 0.15)',
          '--cal-border': 'rgba(92, 75, 55, 0.2)'
        }
      };

      this.currentTheme = localStorage.getItem('calendar_theme') || 'light';
      this.init();
    }

    init() {
      this.applyTheme(this.currentTheme);
      this.bindSettingsModal();
    }

    applyTheme(themeName) {
      const theme = this.themes[themeName];
      if (!theme) return;

      Object.entries(theme).forEach(([prop, value]) => {
        document.documentElement.style.setProperty(prop, value);
      });

      localStorage.setItem('calendar_theme', themeName);
      this.currentTheme = themeName;
      this.updateActiveThemeButton();
    }

    bindSettingsModal() {
      // Bind settings button
      const btnSettings = qs('btnSettings');
      if (btnSettings) {
        btnSettings.addEventListener('click', () => this.openSettingsModal());
      }

      // Bind close button and backdrop
      qs('settingsClose')?.addEventListener('click', () => this.closeSettingsModal());
      qs('settingsBackdrop')?.addEventListener('click', () => this.closeSettingsModal());

      // Bind theme options
      const themeGrid = qs('themeGrid');
      if (themeGrid) {
        themeGrid.querySelectorAll('[data-theme]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.applyTheme(btn.dataset.theme);
          });
        });
      }
    }

    openSettingsModal() {
      const modal = qs('settingsModal');
      const backdrop = qs('settingsBackdrop');
      if (modal && backdrop) {
        lockBodyScroll();
        backdrop.classList.add('visible');
        modal.classList.add('visible');
        modal.setAttribute('aria-hidden', 'false');
        backdrop.setAttribute('aria-hidden', 'false');
        this.updateActiveThemeButton();
      }
    }

    closeSettingsModal() {
      const modal = qs('settingsModal');
      const backdrop = qs('settingsBackdrop');
      if (modal && backdrop) {
        backdrop.classList.remove('visible');
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
        backdrop.setAttribute('aria-hidden', 'true');
        unlockBodyScroll();
      }
    }

    updateActiveThemeButton() {
      document.querySelectorAll('[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
      });
    }
  }

  // ═══ Body Scroll Lock — prevents page overscroll behind modals ═══
  let _scrollLockCount = 0;
  let _savedScrollY = 0;

  function lockBodyScroll() {
    if (_scrollLockCount === 0) {
      _savedScrollY = window.scrollY;
      document.body.classList.add('modal-open');
      document.body.style.top = `-${_savedScrollY}px`;
    }
    _scrollLockCount++;
  }

  function unlockBodyScroll() {
    _scrollLockCount = Math.max(0, _scrollLockCount - 1);
    if (_scrollLockCount === 0) {
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, _savedScrollY);
    }
  }

  function forceUnlockBodyScroll() {
    _scrollLockCount = 0;
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, _savedScrollY);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL STATE MANAGER - Fix flickering/reload on scroll
  // ═══════════════════════════════════════════════════════════════════════════
  const ScrollStateManager = {
    init() {
      // Restore scroll position on load
      const savedScroll = sessionStorage.getItem('calendar_scroll_y');
      if (savedScroll) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScroll));
        });
      }
      
      // Save scroll position (debounced)
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          sessionStorage.setItem('calendar_scroll_y', window.scrollY);
        }, 100);
      }, { passive: true });
      
      console.log('✅ ScrollStateManager initialized');
    }
  };
    document.body.style.top = '';
    window.scrollTo(0, _savedScrollY);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll state manager FIRST
    ScrollStateManager.init();
    
    // Initialize theme
    window.calendarTheme = new CalendarThemeEngine();
    
    // Continue with rest of initialization
    bindUI();
    boot().catch(() => {
      render();
    });
  });

  function qs(id) {
    return document.getElementById(id);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatISODate(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function parseISODate(iso) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const da = Number(m[3]);
    const d = new Date(y, mo, da);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  function daysBetween(a, b) {
    const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
    return Math.round(ms / (24 * 60 * 60 * 1000));
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // FIX: Helper function to categorize events as memorial or celebration
  function getEventCategory(type, eventName = '') {
    const name = String(eventName || '').toLowerCase();
    
    // PRIORITY 1: Check event name for explicit memorial indicators
    if (name.includes('jyoti jot') || name.includes('joti jot') || 
        name.includes('ਜੋਤੀ ਜੋਤ') || name.includes('shaheedi') || 
        name.includes('ਸ਼ਹੀਦੀ') || name.includes('barsi')) {
      return 'memorial';
    }
    
    // PRIORITY 2: Check type for memorial events
    const memorialTypes = ['shaheedi', 'historical', 'joti-jot', 'jyoti-jot', 'barsi'];
    if (memorialTypes.includes(String(type).toLowerCase())) {
      return 'memorial';
    }
    
    // PRIORITY 3: Check for celebration events
    const celebrationTypes = ['prakash', 'gurgaddi', 'janam', 'vaisakhi', 'dastar'];
    if (celebrationTypes.includes(String(type).toLowerCase()) || 
        name.includes('prakash') || name.includes('gurgaddi') || 
        name.includes('ਪ੍ਰਕਾਸ਼') || name.includes('ਗੁਰਗੱਦੀ') ||
        name.includes('vaisakhi') || name.includes('ਵੈਸਾਖੀ')) {
      return 'celebration';
    }
    
    // Default to neutral
    return 'neutral';
  }

  function nowLocalTimeHHMM() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  // Nanakshahi conversion copied from existing project logic (daily-hukamnama.js)
  function nanakshahiFromGregorian(date) {
    const nsMonths = [
      { name: 'ਚੇਤ', days: 31 },
      { name: 'ਵੈਸਾਖ', days: 31 },
      { name: 'ਜੇਠ', days: 31 },
      { name: 'ਹਾੜ', days: 31 },
      { name: 'ਸਾਵਣ', days: 31 },
      { name: 'ਭਾਦੋਂ', days: 30 },
      { name: 'ਅੱਸੂ', days: 30 },
      { name: 'ਕੱਤਕ', days: 30 },
      { name: 'ਮੱਘਰ', days: 30 },
      { name: 'ਪੋਹ', days: 30 },
      { name: 'ਮਾਘ', days: 30 },
      { name: 'ਫੱਗਣ', days: 30 }
    ];

    const year = date.getFullYear();
    const startOfNsYear = new Date(year, 2, 14);

    let nsYear;
    let dayOffset;
    if (date >= startOfNsYear) {
      nsYear = year - 1468;
      dayOffset = Math.floor((date - startOfNsYear) / (24 * 60 * 60 * 1000));
    } else {
      nsYear = year - 1469;
      const prevStart = new Date(year - 1, 2, 14);
      dayOffset = Math.floor((date - prevStart) / (24 * 60 * 60 * 1000));
    }

    let monthIndex = 0;
    while (monthIndex < nsMonths.length && dayOffset >= nsMonths[monthIndex].days) {
      dayOffset -= nsMonths[monthIndex].days;
      monthIndex += 1;
    }

    const nsMonth = nsMonths[Math.min(monthIndex, nsMonths.length - 1)];
    const nsDay = dayOffset + 1;

    return {
      year: nsYear,
      monthName: nsMonth.name,
      day: nsDay
    };
  }

  function formatGregorianLong(d) {
    try {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return d.toDateString();
    }
  }

  function formatMonthTitle(d) {
    const g = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const ns = nanakshahiFromGregorian(d);
    return `${g} / ${ns.monthName}`;
  }

  async function boot() {
    updateTodayCard();

    // Clear caches to ensure fresh data for 2026
    loadLocalDataset._cache = null;
    loadLocalDataset._cache2026 = null;
    state.eventsByYear.clear();
    localStorage.removeItem(STORAGE.CACHE);

    // FIX: Add loading state to prevent calendar from disappearing
    const calendarSection = qs('calendarSection');
    if (calendarSection) {
      calendarSection.classList.add('loading');
    }

    try {
      const year = state.today.getFullYear();
      await ensureYearLoaded(year);
      await ensureYearLoaded(year + 1);
      state.events = combineLoadedEvents();

      // FIX: Ensure events array is valid
      if (!Array.isArray(state.events)) {
        console.warn('⚠️ Events not loaded properly, using empty array');
        state.events = [];
      }

      scheduleLocalNotifications();
    } catch (error) {
      console.error('Calendar boot error:', error);
      // FIX: Use empty events array on error to prevent crashes
      state.events = state.events || [];
    } finally {
      // FIX: Always render and remove loading state
      if (calendarSection) {
        calendarSection.classList.remove('loading');
      }
      render();
    }

    applyHighlightFromUrl();
  }

  function bindUI() {
    qs('btnBack')?.addEventListener('click', goBack);

    qs('viewMonthly')?.addEventListener('click', () => setView('monthly'));
    qs('viewList')?.addEventListener('click', () => setView('list'));
    qs('viewYearly')?.addEventListener('click', () => setView('yearly'));

    qs('searchInput')?.addEventListener('input', (e) => {
      state.query = String(e.target.value || '').trim();
      renderBody();
    });

    EVENT_TYPES.forEach((t) => {
      const el = qs(`filter_${t.id}`);
      if (!el) return;
      el.addEventListener('click', () => {
        state.filterType = t.id;
        highlightFilters();
        renderBody();
      });
    });

    qs('monthPrev')?.addEventListener('click', async () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
      await ensureYearLoaded(state.month.getFullYear());
      state.events = combineLoadedEvents();
      renderBody();
    });

    qs('monthNext')?.addEventListener('click', async () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
      await ensureYearLoaded(state.month.getFullYear());
      state.events = combineLoadedEvents();
      renderBody();
    });

    qs('modalBackdrop')?.addEventListener('click', closeModal);
    qs('modalClose')?.addEventListener('click', closeModal);

    qs('btnArth')?.addEventListener('click', () => {
      if (!state.selectedEvent) return;
      openArthModal(state.selectedEvent);
    });

    qs('arthBackdrop')?.addEventListener('click', closeArthModal);
    qs('arthClose')?.addEventListener('click', closeArthModal);

    qs('btnSetReminder')?.addEventListener('click', () => {
      if (!state.selectedEvent) return;
      openReminderSheet(state.selectedEvent);
    });

    qs('reminderBackdrop')?.addEventListener('click', closeReminderSheet);
    qs('reminderClose')?.addEventListener('click', closeReminderSheet);
    qs('reminderSave')?.addEventListener('click', saveReminderSettings);

    qs('btnShare')?.addEventListener('click', () => {
      if (!state.selectedEvent) return;
      shareEvent(state.selectedEvent);
    });

    qs('btnAddCalendar')?.addEventListener('click', () => {
      if (!state.selectedEvent) return;
      downloadICSForEvent(state.selectedEvent);
    });
  }

  function goBack() {
    // Close any open modals first
    const eventModal = qs('eventModal');
    if (eventModal && eventModal.classList.contains('visible')) {
      closeModal();
      return;
    }

    const arthModal = qs('arthModal');
    if (arthModal && arthModal.classList.contains('visible')) {
      closeArthModal();
      return;
    }

    const reminderSheet = qs('reminderSheet');
    if (reminderSheet && reminderSheet.classList.contains('visible')) {
      closeReminderSheet();
      return;
    }

    // Default back navigation
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '../index.html';
    }
  }

  function setView(view) {
    state.view = view;
    qs('viewMonthly')?.classList.toggle('active', view === 'monthly');
    qs('viewList')?.classList.toggle('active', view === 'list');
    qs('viewYearly')?.classList.toggle('active', view === 'yearly');

    qs('calendarSection')?.classList.toggle('hidden', view !== 'monthly');
    qs('yearSection')?.classList.toggle('hidden', view !== 'yearly');
    qs('listSection')?.classList.toggle('hidden', view !== 'list');

    renderBody();
  }

  function highlightFilters() {
    EVENT_TYPES.forEach((t) => {
      qs(`filter_${t.id}`)?.classList.toggle('active', state.filterType === t.id);
    });
  }

  function updateTodayCard() {
    const ns = nanakshahiFromGregorian(state.today);
    const nk = `${ns.day} ${ns.monthName}, ${ns.year}`;
    qs('todayNk') && (qs('todayNk').textContent = nk);
    qs('todayG') && (qs('todayG').textContent = formatGregorianLong(state.today));
  }

  function applyHighlightFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const highlight = String(params.get('highlight') || '').trim();
      if (!highlight) return;

      const hit = state.events.find((e) => String(e.id) === highlight);
      if (!hit) return;

      const d = parseISODate(hit.gregorian_date);
      if (d) state.month = startOfMonth(d);
      renderBody();
      openEventModal(hit);
    } catch {
      // ignore
    }
  }

  function applyFilter(list) {
    let filtered = list.slice();

    if (state.filterType !== 'all') {
      filtered = filtered.filter((e) => e.type === state.filterType);
    }

    const q = state.query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((e) => {
        return (
          String(e.name_en || '').toLowerCase().includes(q) ||
          String(e.name_pa || '').toLowerCase().includes(q) ||
          String(e.nanakshahi_date || '').toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }

  function upcomingEvents(events) {
    const today = state.today;
    const end = new Date(today);
    end.setDate(end.getDate() + CONFIG.UPCOMING_DAYS);

    return events
      .map((e) => ({ ...e, _date: parseISODate(e.gregorian_date) }))
      .filter((e) => e._date && e._date >= today && e._date <= end)
      .sort((a, b) => a._date - b._date)
      .slice(0, 8);
  }

  function render() {
    highlightFilters();
    setView(state.view);
    renderUpcoming();
    renderBody();
  }

  function renderUpcoming() {
    const list = qs('upcomingList');
    if (!list) return;

    const filtered = applyFilter(state.events);
    const up = upcomingEvents(filtered);

    if (up.length === 0) {
      list.innerHTML = '<div style="padding: 8px 2px; font-weight: 800; color: rgba(11,11,15,0.55);">No upcoming events found.</div>';
      return;
    }

    list.innerHTML = '';
    up.forEach((e) => {
      const d = e._date;
      const days = daysBetween(state.today, d);
      const row = document.createElement('div');
      
      // FIX: Add event type classes for styling (memorial vs celebration)
      const eventCategory = getEventCategory(e.type, e.name_en || e.name_pa);
      const isToday = days === 0;
      row.className = `event-row event-${eventCategory}${isToday ? ' event-today' : ''}`;
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('data-event-category', eventCategory);

      const dotColor = e.color || TYPE_COLORS[e.type] || '#999';
      
      // FIX: Different badge text for memorial vs celebration events
      let badgeText = '';
      if (eventCategory === 'memorial') {
        badgeText = days === 0 ? 'In Remembrance' : `${days} days`;
      } else if (eventCategory === 'celebration') {
        badgeText = days === 0 ? 'Today' : `${days} days`;
      } else {
        badgeText = days === 0 ? 'Today' : `${days} days`;
      }
      
      row.innerHTML = `
        <div class="event-left">
          <div class="event-title">${escapeHtml(e.name_en || '—')}</div>
          <div class="event-sub">${escapeHtml(e.nanakshahi_date || '')} • ${escapeHtml(formatGregorianLong(d))}</div>
        </div>
        <div class="event-right">
          <div class="dot" style="background:${escapeHtml(dotColor)}"></div>
          <div class="days-left">${badgeText}</div>
        </div>
      `;

      row.addEventListener('click', () => openEventModal(e));
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          row.click();
        }
      });

      list.appendChild(row);
    });
  }

  function renderBody() {
    renderUpcoming();

    if (state.view === 'monthly') {
      renderMonthly();
      return;
    }

    if (state.view === 'list') {
      renderList();
      return;
    }

    if (state.view === 'yearly') {
      renderYearly();
      return;
    }
  }

  function renderMonthly() {
    const monthLabel = qs('monthLabel');
    monthLabel && (monthLabel.textContent = formatMonthTitle(state.month));

    const grid = qs('calendarGrid');
    if (!grid) return;

    const year = state.month.getFullYear();
    const month = state.month.getMonth();
    const first = new Date(year, month, 1);

    const mondayFirstIndex = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayFirstIndex);

    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }

    const filtered = applyFilter(state.events);
    const eventsByISO = groupEventsByISO(filtered);

    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    days.forEach((d) => {
      const iso = formatISODate(d);
      const cell = document.createElement('div');
      cell.className = 'day' + (d.getMonth() !== month ? ' other' : '');
      cell.tabIndex = 0;
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', formatGregorianLong(d));

      const dayEvents = eventsByISO.get(iso) || [];
      const dots = dayEvents
        .slice(0, 3)
        .map((e) => `<div class="dot" style="background:${escapeHtml(e.color || TYPE_COLORS[e.type] || '#999')}"></div>`)
        .join('');

      cell.innerHTML = `
        <div class="day-number">${d.getDate()}</div>
        <div class="dots">${dots}</div>
      `;

      cell.addEventListener('click', () => {
        if (dayEvents.length === 1) {
          openEventModal(dayEvents[0]);
          return;
        }
        if (dayEvents.length > 1) {
          openDayPicker(d, dayEvents);
          return;
        }
      });

      cell.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          cell.click();
        }
      });

      frag.appendChild(cell);
    });
    grid.appendChild(frag);

    renderLegend();
  }

  function renderLegend() {
    const legend = qs('legend');
    if (!legend) return;

    const used = new Map();
    state.events.forEach((e) => {
      const id = e.type;
      const color = e.color || TYPE_COLORS[id] || '#999';
      if (!used.has(id)) used.set(id, color);
    });

    const entries = Array.from(used.entries());
    entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));

    legend.innerHTML = '';
    entries.forEach(([type, color]) => {
      const label = EVENT_TYPES.find((t) => t.id === type)?.label || type;
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="dot" style="background:${escapeHtml(color)}"></span><span>${escapeHtml(label)}</span>`;
      legend.appendChild(item);
    });
  }

  function renderList() {
    const list = qs('eventList');
    if (!list) return;

    const filtered = applyFilter(state.events)
      .map((e) => ({ ...e, _date: parseISODate(e.gregorian_date) }))
      .filter((e) => e._date)
      .sort((a, b) => a._date - b._date);

    if (filtered.length === 0) {
      list.innerHTML = '<div style="padding: 8px 2px; font-weight: 800; color: rgba(11,11,15,0.55);">No events found.</div>';
      return;
    }

    list.innerHTML = '';
    filtered.forEach((e) => {
      const d = e._date;
      const days = daysBetween(state.today, d);
      const row = document.createElement('div');
      
      // FIX: Add event type classes for styling (memorial vs celebration)
      const eventCategory = getEventCategory(e.type, e.name_en || e.name_pa);
      const isToday = days === 0;
      row.className = `event-row event-${eventCategory}${isToday ? ' event-today' : ''}`;
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('data-event-category', eventCategory);

      const dotColor = e.color || TYPE_COLORS[e.type] || '#999';
      const when = days === 0 ? 'Today' : days > 0 ? `${days} days` : `${Math.abs(days)} days ago`;

      row.innerHTML = `
        <div class="event-left">
          <div class="event-title">${escapeHtml(e.name_en || '—')}</div>
          <div class="event-sub">${escapeHtml(e.nanakshahi_date || '')} • ${escapeHtml(formatGregorianLong(d))}</div>
        </div>
        <div class="event-right">
          <div class="dot" style="background:${escapeHtml(dotColor)}"></div>
          <div class="days-left">${escapeHtml(when)}</div>
        </div>
      `;

      row.addEventListener('click', () => openEventModal(e));
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          row.click();
        }
      });

      list.appendChild(row);
    });
  }

  function renderYearly() {
    const wrap = qs('yearGrid');
    if (!wrap) return;

    const year = state.today.getFullYear();
    const months = [];
    for (let m = 0; m < 12; m += 1) {
      months.push(new Date(year, m, 1));
    }

    const filtered = applyFilter(state.events);
    const eventsByISO = groupEventsByISO(filtered);

    wrap.innerHTML = '';
    months.forEach((mDate) => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.padding = '12px 12px 14px';

      const title = mDate.toLocaleDateString('en-IN', { month: 'long' });
      const monthEvents = filtered
        .map((e) => ({ ...e, _date: parseISODate(e.gregorian_date) }))
        .filter((e) => e._date && e._date.getMonth() === mDate.getMonth());

      const small = document.createElement('div');
      small.style.display = 'flex';
      small.style.alignItems = 'center';
      small.style.justifyContent = 'space-between';
      small.style.gap = '10px';
      small.style.marginBottom = '8px';
      small.innerHTML = `<div style="font-weight:900;">${escapeHtml(title)}</div><div style="font-weight:900; color: rgba(11,11,15,0.55);">${monthEvents.length}</div>`;

      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.style.gridTemplateColumns = 'repeat(7, 1fr)';

      const year = mDate.getFullYear();
      const month = mDate.getMonth();
      const first = new Date(year, month, 1);
      const mondayFirstIndex = (first.getDay() + 6) % 7;
      const start = new Date(first);
      start.setDate(first.getDate() - mondayFirstIndex);

      for (let i = 0; i < 42; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        if (d.getMonth() !== month) {
          const empty = document.createElement('div');
          empty.className = 'day other';
          empty.style.minHeight = '48px';
          empty.style.padding = '6px 6px';
          empty.style.cursor = 'default';
          empty.innerHTML = '<div class="day-number"></div><div class="dots"></div>';
          grid.appendChild(empty);
          continue;
        }

        const iso = formatISODate(d);
        const dayEvents = eventsByISO.get(iso) || [];
        const dots = dayEvents
          .slice(0, 2)
          .map((e) => `<div class="dot" style="width:8px;height:8px;background:${escapeHtml(e.color || TYPE_COLORS[e.type] || '#999')}"></div>`)
          .join('');

        const cell = document.createElement('div');
        cell.className = 'day';
        cell.style.minHeight = '48px';
        cell.style.padding = '6px 6px';
        cell.innerHTML = `<div class="day-number">${d.getDate()}</div><div class="dots">${dots}</div>`;

        cell.addEventListener('click', () => {
          state.month = startOfMonth(d);
          setView('monthly');
        });

        grid.appendChild(cell);
      }

      card.appendChild(small);
      card.appendChild(grid);
      wrap.appendChild(card);
    });
  }

  function groupEventsByISO(list) {
    const map = new Map();
    list.forEach((e) => {
      const d = parseISODate(e.gregorian_date);
      if (!d) return;
      const iso = formatISODate(d);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(e);
    });

    for (const arr of map.values()) {
      arr.sort((a, b) => String(a.importance || '').localeCompare(String(b.importance || '')));
    }

    return map;
  }

  function openDayPicker(date, dayEvents) {
    // Reuse the event modal as a simple picker list
    const titlePa = qs('modalTitlePa');
    const titleEn = qs('modalTitleEn');
    const kv = qs('modalKV');
    const history = qs('modalHistory');
    const related = qs('modalRelated');
    const celebrations = qs('modalCelebrations');
    const actions = qs('modalActions');

    if (titlePa) titlePa.textContent = '';
    if (titleEn) titleEn.textContent = formatGregorianLong(date);

    const ns = nanakshahiFromGregorian(date);
    if (kv) {
      kv.innerHTML = `<div>📅 Nanakshahi: ${escapeHtml(`${ns.day} ${ns.monthName}, ${ns.year}`)}</div>`;
    }

    if (history) {
      history.querySelector('.block-title').textContent = 'Events';
      history.querySelector('.block-text').innerHTML = dayEvents
        .map((e) => `• <span style="font-weight:900;">${escapeHtml(e.name_en || '—')}</span> <span style="color: rgba(11,11,15,0.55);">(${escapeHtml(e.type)})</span>`)
        .join('<br/>');
    }

    if (related) related.classList.add('hidden');
    if (celebrations) celebrations.classList.add('hidden');

    if (actions) {
      actions.classList.add('hidden');
    }

    openModalBase();

    // Add click handling: when user clicks on line in history block, open that event
    const blockText = history?.querySelector('.block-text');
    if (blockText) {
      const links = document.createElement('div');
      links.style.display = 'grid';
      links.style.gap = '8px';
      links.style.marginTop = '12px';

      dayEvents.forEach((e) => {
        const btn = document.createElement('button');
        btn.className = 'secondary';
        btn.type = 'button';
        btn.textContent = e.name_en || 'Event';
        btn.addEventListener('click', () => openEventModal(e));
        links.appendChild(btn);
      });

      blockText.innerHTML = '';
      blockText.appendChild(links);
    }
  }

  function openEventModal(event) {
    state.selectedEvent = event;

    const titlePa = qs('modalTitlePa');
    const titleEn = qs('modalTitleEn');
    const kv = qs('modalKV');

    const history = qs('modalHistory');
    const related = qs('modalRelated');
    const celebrations = qs('modalCelebrations');
    const actions = qs('modalActions');

    if (titlePa) titlePa.textContent = event.name_pa || '';
    if (titleEn) titleEn.textContent = event.name_en || '';

    const d = parseISODate(event.gregorian_date);
    const diff = d ? daysBetween(state.today, d) : null;
    const remaining = diff === null ? '—' : diff === 0 ? 'Today' : diff > 0 ? `${diff} days remaining` : `${Math.abs(diff)} days ago`;

    if (kv) {
      kv.innerHTML = `
        <div>📅 ${escapeHtml(event.nanakshahi_date || '—')}</div>
        <div>📅 ${escapeHtml(d ? formatGregorianLong(d) : event.gregorian_date || '—')}</div>
        <div>⏳ ${escapeHtml(remaining)}</div>
      `;
    }

    if (history) {
      history.classList.remove('hidden');
      history.querySelector('.block-title').textContent = 'History';
      history.querySelector('.block-text').textContent = event.description_en || event.description_pa || '—';
    }

    if (related) {
      const rel = Array.isArray(event.related_shabads) ? event.related_shabads : [];
      if (rel.length === 0) {
        related.classList.add('hidden');
      } else {
        related.classList.remove('hidden');
        related.querySelector('.block-text').innerHTML = rel.map((s) => `• ${escapeHtml(s)}`).join('<br/>');
      }
    }

    if (celebrations) {
      const cel = Array.isArray(event.celebrations) ? event.celebrations : [];
      if (cel.length === 0) {
        celebrations.classList.add('hidden');
      } else {
        celebrations.classList.remove('hidden');
        celebrations.querySelector('.block-text').innerHTML = cel.map((s) => `• ${escapeHtml(s)}`).join('<br/>');
      }
    }

    if (actions) actions.classList.remove('hidden');

    openModalBase();
  }

  function openModalBase() {
    lockBodyScroll();
    qs('modalBackdrop')?.classList.add('visible');
    qs('eventModal')?.classList.add('visible');
  }

  function closeModal() {
    qs('modalBackdrop')?.classList.remove('visible');
    qs('eventModal')?.classList.remove('visible');
    state.selectedEvent = null;
    unlockBodyScroll();
  }

  function openArthModal(event) {
    const modal = qs('arthModal');
    const backdrop = qs('arthBackdrop');
    const content = qs('arth-content');

    if (!modal || !backdrop || !content) return;

    const arth = event?.arth || null;
    if (!arth) {
      toast('ਅਰਥ ਉਪਲਬਧ ਨਹੀਂ ਹੈ');
      return;
    }

    const related = Array.isArray(arth.relatedShabads) ? arth.relatedShabads : [];

    content.innerHTML = `
      <div style="display:grid; gap: 12px;">
        <div style="font-weight: 900; font-size: 18px;">${escapeHtml(event.name_pa || '')}</div>
        <div style="font-weight: 800; color: rgba(11,11,15,0.65);">${escapeHtml(event.name_en || '')}</div>

        <div class="block" style="margin:0;">
          <div class="block-title">ਅਰਥ (Meaning)</div>
          <div class="block-text">
            <div style="font-weight: 900;">${escapeHtml(arth.meaningPunjabi || '')}</div>
            <div style="margin-top:8px;">${escapeHtml(arth.meaning || '')}</div>
          </div>
        </div>

        <div class="block" style="margin:0;">
          <div class="block-title">ਇਤਿਹਾਸਕ ਪ੍ਰਸੰਗ (Historical Context)</div>
          <div class="block-text">${escapeHtml(arth.historicalContext || '—')}</div>
        </div>

        ${related.length ? `
          <div class="block" style="margin:0;">
            <div class="block-title">ਸੰਬੰਧਿਤ ਸ਼ਬਦ (Related Shabads)</div>
            <div class="block-text">${related.map((s) => `• ${escapeHtml(s)}`).join('<br/>')}</div>
          </div>
        ` : ''}
      </div>
    `;

    lockBodyScroll();
    backdrop.classList.add('visible');
    modal.classList.add('visible');
  }

  function closeArthModal() {
    qs('arthBackdrop')?.classList.remove('visible');
    qs('arthModal')?.classList.remove('visible');
    unlockBodyScroll();
  }

  function openReminderSheet(event) {
    const d = parseISODate(event.gregorian_date);
    if (!d) return;

    const storage = loadReminders();
    const existing = storage[event.id] || null;

    const title = qs('reminderTitle');
    if (title) title.textContent = `Reminders • ${event.name_en || 'Event'}`;

    const time = qs('reminderTime');
    if (time) time.value = existing?.notification_time || '08:00';

    const days = existing?.days_before || [30, 10, 7, 3, 1, 0];
    const pills = qs('reminderDays');
    if (pills) {
      pills.innerHTML = '';
      const options = [30, 10, 7, 3, 1, 0];
      options.forEach((n) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'day-pill' + (days.includes(n) ? ' active' : '');
        btn.dataset.days = String(n);
        btn.textContent = n === 0 ? 'Day of' : `${n} days`;
        btn.addEventListener('click', () => {
          btn.classList.toggle('active');
        });
        pills.appendChild(btn);
      });
    }

    const enabled = qs('reminderEnabled');
    if (enabled) enabled.checked = existing ? !!existing.enabled : true;

    lockBodyScroll();
    qs('reminderBackdrop')?.classList.add('visible');
    qs('reminderSheet')?.classList.add('visible');
  }

  function closeReminderSheet() {
    qs('reminderBackdrop')?.classList.remove('visible');
    qs('reminderSheet')?.classList.remove('visible');
    unlockBodyScroll();
  }

  function saveReminderSettings() {
    const ev = state.selectedEvent;
    if (!ev) return;

    const time = String(qs('reminderTime')?.value || '08:00');
    const enabled = !!qs('reminderEnabled')?.checked;

    const pills = qs('reminderDays');
    const selected = [];
    pills?.querySelectorAll('.day-pill.active').forEach((btn) => {
      const v = Number(btn.dataset.days);
      if (Number.isFinite(v)) selected.push(v);
    });

    const days_before = selected.length ? selected.sort((a, b) => b - a) : [10, 1, 0];

    const storage = loadReminders();
    storage[ev.id] = {
      gurpurab_id: ev.id,
      days_before,
      notification_time: time,
      enabled
    };
    saveReminders(storage);

    if (enabled && 'Notification' in window) {
      try {
        if (window.isSecureContext && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => { });
        }
      } catch {
        // ignore
      }
    }

    closeReminderSheet();
    scheduleLocalNotifications();

    try {
      if (enabled && window.gurupurabReminders && typeof window.gurupurabReminders.scheduleReminder === 'function') {
        const y = String(new Date(ev.gregorian_date + 'T00:00:00').getFullYear());
        window.gurupurabReminders.scheduleReminder({
          id: ev.id,
          name: ev.name_en,
          namePunjabi: ev.name_pa,
          gregorianDates: { [y]: ev.gregorian_date }
        }, days_before);
      }
    } catch {
      // ignore
    }

    toast('Saved');
  }

  function toast(message) {
    let el = qs('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.position = 'fixed';
      el.style.left = '50%';
      el.style.bottom = '24px';
      el.style.transform = 'translateX(-50%)';
      el.style.zIndex = '2000';
      el.style.padding = '10px 12px';
      el.style.borderRadius = '999px';
      el.style.background = 'rgba(0,0,0,0.8)';
      el.style.color = '#fff';
      el.style.fontWeight = '900';
      el.style.opacity = '0';
      el.style.transition = 'opacity 180ms ease';
      document.body.appendChild(el);
    }

    el.textContent = String(message);
    el.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.style.opacity = '0';
    }, 1800);
  }

  function loadReminders() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE.REMINDERS) || '{}') || {};

      // Try to sync from IndexedDB if localStorage is empty
      if (Object.keys(stored).length === 0 && window.GurbaniStorage && window.GurbaniStorage.isReady) {
        window.GurbaniStorage.get('reminders', 'gurpurab_reminders').then(data => {
          if (data && Object.keys(data).length > 0) {
            localStorage.setItem(STORAGE.REMINDERS, JSON.stringify(data));
          }
        }).catch(() => { });
      }

      return stored;
    } catch {
      return {};
    }
  }

  function saveReminders(obj) {
    try {
      localStorage.setItem(STORAGE.REMINDERS, JSON.stringify(obj));

      // Also persist to IndexedDB
      if (window.GurbaniStorage && window.GurbaniStorage.isReady) {
        window.GurbaniStorage.set('reminders', 'gurpurab_reminders', obj);
      }
    } catch { }
  }

  // Best-effort local notifications (works while the page/app is open)
  // True push notifications (background) would require Push API + server.
  function scheduleLocalNotifications() {
    if (!('Notification' in window)) return;

    const reminders = loadReminders();
    const now = new Date();

    try {
      if (!window.isSecureContext) return;
    } catch { }

    if (Notification.permission === 'default') {
      // Not requesting automatically; only when user hits Set Reminder.
    }

    clearScheduledTimeouts();

    // setTimeout cannot reliably schedule delays beyond ~24.8 days (2^31-1).
    // So we schedule only a rolling window and re-run periodically while the page/app is open.
    const MAX_DELAY_MS = 2147483647;
    const RESCHEDULE_MS = 6 * 60 * 60 * 1000; // 6h

    try {
      if (scheduleLocalNotifications._rescheduleId) {
        clearTimeout(scheduleLocalNotifications._rescheduleId);
      }
    } catch { }
    scheduleLocalNotifications._rescheduleId = setTimeout(() => {
      scheduleLocalNotifications();
    }, Math.min(RESCHEDULE_MS, MAX_DELAY_MS));

    Object.values(reminders).forEach((r) => {
      if (!r?.enabled) return;
      const event = state.events.find((e) => String(e.id) === String(r.gurpurab_id));
      if (!event) return;

      const eventDate = parseISODate(event.gregorian_date);
      if (!eventDate) return;

      const [hh, mm] = String(r.notification_time || '08:00').split(':').map(Number);
      const atBase = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), hh || 8, mm || 0, 0);

      const daysArr = Array.isArray(r.days_before) ? r.days_before : [];
      daysArr.forEach((daysBefore) => {
        const when = new Date(atBase);
        when.setDate(atBase.getDate() - Number(daysBefore || 0));

        if (when <= now) return;

        const delay = when.getTime() - now.getTime();
        if (delay > MAX_DELAY_MS) return;
        const id = setTimeout(() => {
          fireNotification(event, daysBefore);
        }, delay);

        scheduleLocalNotifications._timeouts.push(id);
      });
    });
  }

  function clearScheduledTimeouts() {
    const list = scheduleLocalNotifications._timeouts || [];
    list.forEach((id) => {
      try {
        clearTimeout(id);
      } catch { }
    });
    scheduleLocalNotifications._timeouts = [];
  }

  async function fireNotification(event, daysBefore) {
    try {
      const ok = await Notification.requestPermission();
      if (ok !== 'granted') return;
    } catch {
      return;
    }

    const msg = daysBefore === 0
      ? `Today is ${event.name_en}!`
      : `${event.name_en} in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`;

    try {
      const n = new Notification('Gurpurab Reminder', {
        body: msg,
        tag: `gurpurab-${event.id}-${daysBefore}`,
        requireInteraction: daysBefore === 0,
        icon: 'assets/favicon-32x32.png',
        data: { url: 'Gurupurab-Calendar.html' }
      });

      n.onclick = (ev) => {
        ev.preventDefault();
        window.focus();
        openEventModal(event);
      };
    } catch { }
  }

  async function shareEvent(event) {
    const d = parseISODate(event.gregorian_date);
    const lines = [
      event.name_en || 'Gurpurab',
      event.name_pa || '',
      event.nanakshahi_date || '',
      d ? formatGregorianLong(d) : (event.gregorian_date || '')
    ].filter(Boolean);

    const text = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: event.name_en || 'Gurpurab', text });
        return;
      } catch {
        // continue
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast('Copied');
    } catch {
      toast(text);
    }
  }

  function downloadICSForEvent(event) {
    const d = parseISODate(event.gregorian_date);
    if (!d) return;

    const dtStart = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
    const dtEndDate = new Date(d);
    dtEndDate.setDate(d.getDate() + 1);
    const dtEnd = `${dtEndDate.getFullYear()}${pad2(dtEndDate.getMonth() + 1)}${pad2(dtEndDate.getDate())}`;

    const uid = `gurpurab-${String(event.id)}-${dtStart}@gurbani-radio`;

    const summary = escapeICS(event.name_en || 'Gurpurab');
    const description = escapeICS([event.name_pa || '', event.nanakshahi_date || '', event.description_en || ''].filter(Boolean).join(' - '));

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gurbani Radio//Gurpurab Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStart}T000000Z`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `gurpurab-${String(event.id)}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function escapeICS(s) {
    return String(s)
      .replaceAll('\\', '\\\\')
      .replaceAll('\n', '\\n')
      .replaceAll(',', '\\,')
      .replaceAll(';', '\\;');
  }

  async function loadEventsForYear(year) {
    // For 2026, always bypass cache and load from dedicated file
    if (year === 2026) {
      try {
        const res2026 = await fetch('../data/gurpurab-events-2026.json', { cache: 'no-cache' });
        if (res2026.ok) {
          const json2026 = await res2026.json();
          if (json2026 && json2026.years && Array.isArray(json2026.years['2026'])) {
            console.log('✅ Loaded 2026 events from dedicated file:', json2026.years['2026'].length, 'events');
            const events = json2026.years['2026'].map((e, idx) => normalizeLocalEvent(e, 2026, idx)).filter(Boolean);
            return events;
          }
        }
      } catch (e) {
        console.warn('Could not load 2026 specific events file, falling back:', e);
      }
    }

    const cached = loadCache();
    const now = Date.now();
    if (cached && cached.year === year && (now - cached.fetchedAt) < CONFIG.CACHE_TTL_MS && Array.isArray(cached.events)) {
      return cached.events;
    }

    const local = await loadLocalEvents(year);
    saveCache({ year, fetchedAt: now, events: local, source: 'local-json' });
    return local;
  }

  async function ensureYearLoaded(year) {
    const y = Number(year);
    if (!Number.isFinite(y)) return;
    if (state.eventsByYear.has(y)) return;
    const events = await loadEventsForYear(y);
    state.eventsByYear.set(y, Array.isArray(events) ? events : []);
  }

  function combineLoadedEvents() {
    const map = new Map();
    for (const list of state.eventsByYear.values()) {
      (list || []).forEach((e) => {
        const key = `${String(e.gregorian_date || '')}-${String(e.id || '')}`;
        if (!map.has(key)) map.set(key, e);
      });
    }
    return Array.from(map.values()).sort((a, b) => {
      const da = parseISODate(a.gregorian_date);
      const db = parseISODate(b.gregorian_date);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });
  }

  function normalizeCalendarPayload(payload, year) {
    // We don't know exact payload shape; attempt to map common candidates.
    // Expected output: array of {id,name_pa,name_en,nanakshahi_date,gregorian_date,type,color,importance, ...}
    const out = [];

    const list = payload?.data || payload?.events || payload?.calendar || payload;
    if (!Array.isArray(list)) return out;

    list.forEach((raw, idx) => {
      const date = raw?.gregorian || raw?.gregorian_date || raw?.date || raw?.eventDate || raw?.gDate;
      const iso = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
      if (!iso) return;

      const type = String(raw?.type || raw?.category || 'historical').toLowerCase();
      const mappedType = TYPE_COLORS[type] ? type : 'historical';

      out.push({
        id: String(raw?.id ?? raw?._id ?? `${year}-${idx}`),
        name_pa: String(raw?.name_pa || raw?.namePa || raw?.punjabi || raw?.namePunjabi || ''),
        name_en: String(raw?.name_en || raw?.nameEn || raw?.english || raw?.title || ''),
        nanakshahi_date: String(raw?.nanakshahi_date || raw?.nanakshahi || raw?.nDate || ''),
        gregorian_date: iso,
        type: mappedType,
        color: String(raw?.color || TYPE_COLORS[mappedType] || ''),
        importance: String(raw?.importance || raw?.priority || 'minor'),
        guru_number: raw?.guru_number ? Number(raw.guru_number) : (raw?.guru ? Number(raw.guru) : undefined),
        description_en: String(raw?.description_en || raw?.description || ''),
        description_pa: String(raw?.description_pa || ''),
        related_shabads: Array.isArray(raw?.related_shabads) ? raw.related_shabads : [],
        celebrations: Array.isArray(raw?.celebrations) ? raw.celebrations : []
      });
    });

    return out;
  }

  function mergeEvents(primary, fallback) {
    const map = new Map();

    const add = (event, source) => {
      if (!event?.gregorian_date) return;
      const key = `${event.gregorian_date}-${(event.name_en || event.name_pa || '').toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, { ...event, _source: source });
      }
    };

    (primary || []).forEach((e) => add(e, 'remote'));
    (fallback || []).forEach((e) => add(e, 'local'));

    return Array.from(map.values()).sort((a, b) => {
      const da = parseISODate(a.gregorian_date);
      const db = parseISODate(b.gregorian_date);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });
  }

  async function loadLocalEvents(year) {
    try {
      // For 2026, try to load from the specific 2026 events file first
      if (year === 2026) {
        try {
          const res2026 = await fetch('../data/gurpurab-events-2026.json', { cache: 'no-cache' });
          if (res2026.ok) {
            const json2026 = await res2026.json();
            if (json2026 && json2026.years && Array.isArray(json2026.years['2026'])) {
              console.log('✅ Loaded 2026 events from dedicated file:', json2026.years['2026'].length, 'events');
              return json2026.years['2026'].map((e, idx) => normalizeLocalEvent(e, year, idx)).filter(Boolean);
            }
          }
        } catch (e) {
          console.warn('Could not load 2026 specific events file:', e);
        }
      }

      const data = await loadLocalDataset();

      if (data && data.__schema === 'guru-purabs') {
        return buildEventsFromGuruPurabs(data, year);
      }

      const list = data?.years?.[String(year)];
      if (Array.isArray(list) && list.length) {
        return list.map((e, idx) => normalizeLocalEvent(e, year, idx)).filter(Boolean);
      }

      const generated = generateEventsForYearFromDefinitions(data, year);
      return generated.map((e, idx) => normalizeLocalEvent(e, year, idx)).filter(Boolean);
    } catch {
      return [];
    }
  }

  async function loadLocalDataset() {
    if (loadLocalDataset._cache) return loadLocalDataset._cache;

    // Try to load 2026 specific events first
    try {
      const res2026 = await fetch('../data/gurpurab-events-2026.json', { cache: 'no-cache' });
      if (res2026.ok) {
        const json2026 = await res2026.json();
        if (json2026 && json2026.years && json2026.years['2026']) {
          // Merge with existing data
          loadLocalDataset._cache2026 = json2026;
        }
      }
    } catch {
      // ignore 2026 specific file errors
    }

    try {
      const res = await fetch('../data/guru-purabs.json', { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.gurupurabs)) {
          const enriched = { ...json, __schema: 'guru-purabs' };
          loadLocalDataset._cache = enriched;
          return enriched;
        }
      }
    } catch {
      // ignore
    }

    const res = await fetch('../data/gurpurab-events.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    const json = await res.json();
    loadLocalDataset._cache = json;
    return json;
  }

  function buildEventsFromGuruPurabs(data, year) {
    const out = [];

    // Helper to process a single event item
    const processEvent = (g, idx, fallbackType) => {
      // Support both old (gregorianDates) and new (gregorian2026) format
      let isoExplicit = g?.gregorianDates?.[String(year)] || (year === 2026 ? g?.gregorian2026 : null);
      let date = isoExplicit ? parseISODate(isoExplicit) : null;

      // Fallback to nanakshahi conversion if no explicit date
      if (!date && g?.nanakshahi && nsCal && typeof nsCal.nanakshahiMonthDayToGregorianInYear === 'function') {
        const d = nsCal.nanakshahiMonthDayToGregorianInYear(year, g.nanakshahi.month, g.nanakshahi.date);
        if (d && !Number.isNaN(d.getTime())) date = d;
      }

      if (!date) return null;
      if (date.getFullYear() !== year) return null;

      const iso = formatISODate(date);
      const type = normalizeEventType(g.type || fallbackType);
      const color = String(g.color || TYPE_COLORS[type] || '').trim();

      const fallbackNs = nanakshahiFromGregorian(date);
      const nanakshahi_date = `${fallbackNs.day} ${fallbackNs.monthName}, ${fallbackNs.year}`;

      return {
        id: String(g.id ?? `${year}-${idx}`),
        name_pa: String(g.namePunjabi || ''),
        name_en: String(g.name || ''),
        nanakshahi_date,
        gregorian_date: iso,
        type,
        color,
        importance: String(g.importance || 'minor'),
        description_en: String(g.description || ''),
        description_pa: String(g.descriptionPunjabi || ''),
        related_shabads: Array.isArray(g?.arth?.relatedShabads) ? g.arth.relatedShabads : [],
        celebrations: Array.isArray(g.celebrations) ? g.celebrations : [],
        arth: g.arth || null
      };
    };

    // Process all arrays in the JSON
    const arraysToProcess = [
      { arr: data?.gurupurabs, type: 'prakash' },
      { arr: data?.gurgaddiDivas, type: 'gurgaddi' },
      { arr: data?.jotiJotDivas, type: 'joti-jot' },
      { arr: data?.shaheedDivas, type: 'shaheedi' },
      { arr: data?.historicalDivas, type: 'historical' },
      { arr: data?.sangrand2026, type: 'sangrand' },
      { arr: data?.puranmashi2026, type: 'puranmashi' },
      { arr: data?.masya2026, type: 'masya' },
      { arr: data?.additionalBhogDivas, type: 'historical' },
      { arr: data?.panjPyare, type: 'prakash' },
      { arr: data?.sahibzaadePrakash, type: 'prakash' }
    ];

    arraysToProcess.forEach(({ arr, type }) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((g, idx) => {
        const event = processEvent(g, idx, type);
        if (event) out.push(event);
      });
    });

    // Sort by date
    out.sort((a, b) => {
      const da = parseISODate(a.gregorian_date);
      const db = parseISODate(b.gregorian_date);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });

    console.log(`✅ Loaded ${out.length} events for ${year}`);
    return out;
  }

  function normalizeLocalEvent(raw, year, idx) {
    if (!raw) return null;

    const iso = String(raw.gregorian_date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;

    const d = parseISODate(iso);
    if (!d) return null;
    if (d.getFullYear() !== year) return null;

    const type = normalizeEventType(raw.type);
    const color = String(raw.color || TYPE_COLORS[type] || '').trim();

    const fallbackNs = nanakshahiFromGregorian(d);
    const nanakshahi_date = String(raw.nanakshahi_date || `${fallbackNs.day} ${fallbackNs.monthName}, ${fallbackNs.year}`);

    return {
      id: String(raw.id ?? `${year}-${idx}`),
      name_pa: String(raw.name_pa || ''),
      name_en: String(raw.name_en || raw.title || ''),
      nanakshahi_date,
      gregorian_date: iso,
      type,
      color,
      importance: String(raw.importance || 'minor'),
      guru_number: raw.guru_number != null ? Number(raw.guru_number) : undefined,
      description_en: String(raw.description_en || raw.description || ''),
      description_pa: String(raw.description_pa || ''),
      related_shabads: Array.isArray(raw.related_shabads) ? raw.related_shabads : [],
      celebrations: Array.isArray(raw.celebrations) ? raw.celebrations : []
    };
  }

  function normalizeEventType(type) {
    const t = String(type || '').trim().toLowerCase();
    if (!t) return 'historical';
    if (t === 'parkash') return 'prakash';
    if (t === 'prakash') return 'prakash';
    if (t === 'gurta_gaddi' || t === 'gur gaddi') return 'gurgaddi';
    if (t === 'gurgaddi') return 'gurgaddi';
    if (t === 'shaheedi') return 'shaheedi';
    if (t === 'historical') return 'historical';
    if (t === 'sangrand') return 'sangrand';
    if (t === 'puranmashi') return 'puranmashi';
    if (t === 'masya') return 'masya';
    if (t === 'joti-jot' || t === 'joti jot') return 'historical'; // Map to historical for color
    if (t === 'barsi') return 'historical';
    return 'historical';
  }

  function generateEventsForYearFromDefinitions(data, year) {
    const defs = Array.isArray(data?.definitions) ? data.definitions : [];
    if (defs.length === 0) return [];

    const NANAKSHAHI_MONTHS = [
      { number: 1, name: 'Chet', punjabi: 'ਚੇਤ', startGregorian: { month: 3, day: 14 } },
      { number: 2, name: 'Vaisakh', punjabi: 'ਵੈਸਾਖ', startGregorian: { month: 4, day: 14 } },
      { number: 3, name: 'Jeth', punjabi: 'ਜੇਠ', startGregorian: { month: 5, day: 15 } },
      { number: 4, name: 'Harh', punjabi: 'ਹਾੜ', startGregorian: { month: 6, day: 15 } },
      { number: 5, name: 'Sawan', punjabi: 'ਸਾਵਣ', startGregorian: { month: 7, day: 16 } },
      { number: 6, name: 'Bhadon', punjabi: 'ਭਾਦੋਂ', startGregorian: { month: 8, day: 16 } },
      { number: 7, name: 'Assu', punjabi: 'ਅੱਸੂ', startGregorian: { month: 9, day: 15 } },
      { number: 8, name: 'Katak', punjabi: 'ਕੱਤਕ', startGregorian: { month: 10, day: 15 } },
      { number: 9, name: 'Maghar', punjabi: 'ਮੱਘਰ', startGregorian: { month: 11, day: 14 } },
      { number: 10, name: 'Poh', punjabi: 'ਪੋਹ', startGregorian: { month: 12, day: 14 } },
      { number: 11, name: 'Magh', punjabi: 'ਮਾਘ', startGregorian: { month: 1, day: 13 } },
      { number: 12, name: 'Phagan', punjabi: 'ਫੱਗਣ', startGregorian: { month: 2, day: 12 } }
    ];

    const nanakshahiToGregorianFallback = (nanakshahiDay, nanakshahiMonth, baseYear) => {
      const month = NANAKSHAHI_MONTHS[Math.max(0, Math.min(NANAKSHAHI_MONTHS.length - 1, nanakshahiMonth - 1))];

      // IMPORTANT: Months 11/12 (Magh/Phagan) are in Jan/Feb and belong to the
      // Nanakshahi year that started the previous March. For a Gregorian-year view,
      // we must choose the date that lands inside `year`.
      let targetYear = baseYear;
      if (nanakshahiMonth >= 11) targetYear = baseYear + 1;

      const targetMonth = (month.startGregorian.month - 1);
      const targetDay = month.startGregorian.day + (nanakshahiDay - 1);
      return new Date(targetYear, targetMonth, targetDay);
    };

    const out = [];
    defs.forEach((def) => {
      const nsMonth = Number(def.nanakshahiMonth);
      const nsDay = Number(def.nanakshahiDay);
      if (!Number.isFinite(nsMonth) || !Number.isFinite(nsDay)) return;

      // Correct conversion: try to land inside the requested Gregorian year.
      // Prefer the dedicated helper if available.
      let d = null;
      if (nsCal && typeof nsCal.nanakshahiMonthDayToGregorianInYear === 'function') {
        d = nsCal.nanakshahiMonthDayToGregorianInYear(year, nsMonth, nsDay);
      }
      if (!d) {
        const candidateA = nanakshahiToGregorianFallback(nsDay, nsMonth, year);
        const candidateB = nanakshahiToGregorianFallback(nsDay, nsMonth, year - 1);
        d = candidateA.getFullYear() === year ? candidateA : candidateB;
      }
      if (Number.isNaN(d.getTime())) return;
      if (d.getFullYear() !== year) return;

      // Force timezone to UTC noon to avoid DST shifts causing off-by-one
      d.setUTCHours(12, 0, 0, 0);

      const iso = formatISODate(d);
      const ns = nanakshahiFromGregorian(d);

      out.push({
        id: String(def.id || `${year}-${iso}`),
        name_pa: String(def.name_pa || ''),
        name_en: String(def.name_en || ''),
        nanakshahi_date: `${ns.day} ${ns.monthName}, ${ns.year}`,
        gregorian_date: iso,
        type: String(def.type || 'historical'),
        color: String(def.color || ''),
        importance: String(def.importance || 'minor'),
        guru_number: def.guru_number != null ? Number(def.guru_number) : undefined,
        description_en: String(def.description_en || ''),
        description_pa: String(def.description_pa || ''),
        related_shabads: Array.isArray(def.related_shabads) ? def.related_shabads : [],
        celebrations: Array.isArray(def.celebrations) ? def.celebrations : []
      });
    });

    out.sort((a, b) => {
      const da = parseISODate(a.gregorian_date);
      const db = parseISODate(b.gregorian_date);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });

    return out;
  }

  function loadCache() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.CACHE) || 'null');
    } catch {
      return null;
    }
  }

  function saveCache(rec) {
    try {
      localStorage.setItem(STORAGE.CACHE, JSON.stringify(rec));
    } catch { }
  }

  // Expose minimal helpers for debugging
  window.__gurpurabCalendar = {
    state,
    reload: boot
  };
})();
