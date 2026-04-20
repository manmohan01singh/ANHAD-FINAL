(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // GURPURAB CALENDAR V2 — Alpine.js Component
  // Performance-optimized with reactive data binding
  // ═══════════════════════════════════════════════════════════════════════════

  // Type colors
  const TYPE_COLORS = {
    prakash: '#FF6B00',
    shaheedi: '#EF4444',
    gurgaddi: '#8B5CF6',
    historical: '#22C55E',
    sangrand: '#3B82F6',
    puranmashi: '#F59E0B',
    masya: '#111827'
  };

  // Filter options
  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'prakash', label: 'Prakash' },
    { id: 'shaheedi', label: 'Shaheedi' },
    { id: 'gurgaddi', label: 'Gurgaddi' },
    { id: 'historical', label: 'Historical' },
    { id: 'sangrand', label: 'Sangrand' },
    { id: 'puranmashi', label: 'Puranmashi' },
    { id: 'masya', label: 'Masya' }
  ];

  // Storage keys
  const STORAGE = {
    CACHE: 'gurpurab_calendar_cache_v2',
    REMINDERS: 'gurpurab_calendar_reminders_v2'
  };

  // Configuration
  const CONFIG = {
    CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
    UPCOMING_DAYS: 365
  };

  // Utility functions
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

  function formatGregorianLong(d) {
    try {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return d.toDateString();
    }
  }

  // Nanakshahi conversion
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

  // Alpine.js component
  function calendarApp() {
    return {
      // State
      today: startOfDay(new Date()),
      currentMonth: startOfMonth(new Date()),
      currentView: 'monthly',
      currentFilter: 'all',
      searchQuery: '',
      events: [],
      eventsByYear: new Map(),
      selectedEvent: null,
      showSettings: false,
      showReminder: false,
      showArth: false,
      currentTheme: 'light',
      
      // Reminder state
      reminderEnabled: true,
      reminderTime: '08:00',
      reminderDays: [30, 10, 7, 3, 1, 0],

      // Computed properties
      filters: FILTERS,

      get todayNanakshahi() {
        const ns = nanakshahiFromGregorian(this.today);
        return `${ns.day} ${ns.monthName}, ${ns.year}`;
      },

      get todayGregorian() {
        return formatGregorianLong(this.today);
      },

      get currentMonthLabel() {
        const g = this.currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        const ns = nanakshahiFromGregorian(this.currentMonth);
        return `${g} / ${ns.monthName}`;
      },

      get filteredEvents() {
        let filtered = this.events.slice();

        if (this.currentFilter !== 'all') {
          filtered = filtered.filter(e => e.type === this.currentFilter);
        }

        const q = this.searchQuery.trim().toLowerCase();
        if (q) {
          filtered = filtered.filter(e => {
            return (
              String(e.name_en || '').toLowerCase().includes(q) ||
              String(e.name_pa || '').toLowerCase().includes(q) ||
              String(e.nanakshahi_date || '').toLowerCase().includes(q)
            );
          });
        }

        return filtered.map(e => ({ ...e, _date: parseISODate(e.gregorian_date) }))
          .filter(e => e._date)
          .sort((a, b) => a._date - b._date);
      },

      get upcomingEvents() {
        const today = this.today;
        const end = new Date(today);
        end.setDate(end.getDate() + CONFIG.UPCOMING_DAYS);

        return this.filteredEvents
          .filter(e => e._date >= today && e._date <= end)
          .slice(0, 8);
      },

      get calendarDays() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const first = new Date(year, month, 1);

        const mondayFirstIndex = (first.getDay() + 6) % 7;
        const start = new Date(first);
        start.setDate(first.getDate() - mondayFirstIndex);

        const days = [];
        for (let i = 0; i < 42; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const iso = formatISODate(d);
          const dayEvents = this.getEventsForDate(iso);
          
          days.push({
            date: d.getDate(),
            iso: iso,
            label: formatGregorianLong(d),
            isCurrentMonth: d.getMonth() === month,
            isToday: formatISODate(d) === formatISODate(this.today),
            events: dayEvents
          });
        }

        return days;
      },

      get yearlyMonths() {
        const year = this.today.getFullYear();
        const months = [];
        
        for (let m = 0; m < 12; m++) {
          const mDate = new Date(year, m, 1);
          const monthEvents = this.filteredEvents
            .filter(e => e._date && e._date.getMonth() === m);
          
          // Generate mini calendar days
          const first = new Date(year, m, 1);
          const mondayFirstIndex = (first.getDay() + 6) % 7;
          const start = new Date(first);
          start.setDate(first.getDate() - mondayFirstIndex);
          
          const days = [];
          for (let i = 0; i < 42; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const iso = formatISODate(d);
            const dayEvents = this.getEventsForDate(iso);
            
            days.push({
              date: d.getDate(),
              iso: iso,
              isCurrentMonth: d.getMonth() === m,
              events: dayEvents
            });
          }
          
          months.push({
            index: m,
            name: mDate.toLocaleDateString('en-IN', { month: 'long' }),
            eventCount: monthEvents.length,
            days: days
          });
        }
        
        return months;
      },

      get usedEventTypes() {
        const used = new Map();
        this.events.forEach(e => {
          const id = e.type;
          const color = e.color || TYPE_COLORS[id] || '#999';
          if (!used.has(id)) used.set(id, { id, color, label: FILTERS.find(f => f.id === id)?.label || id });
        });
        return Array.from(used.values());
      },

      // Methods
      async initApp() {
        // Initialize theme
        this.currentTheme = window.AnhadTheme ? window.AnhadTheme.get() : 'light';
        this.applyTheme();
        
        // Listen for theme changes
        document.addEventListener('anhad-theme-change', () => {
          this.currentTheme = window.AnhadTheme ? window.AnhadTheme.get() : 'light';
          this.applyTheme();
        });

        // Load events
        await this.loadEvents();
        this.updateTodayDisplay();
      },

      applyTheme() {
        const html = document.documentElement;
        if (this.currentTheme === 'dark') {
          html.classList.add('dark-mode');
          html.setAttribute('data-theme', 'dark');
        } else {
          html.classList.remove('dark-mode');
          html.setAttribute('data-theme', 'light');
        }
      },

      setTheme(theme) {
        this.currentTheme = theme;
        if (window.AnhadTheme) {
          window.AnhadTheme.set(theme);
        }
        this.applyTheme();
      },

      async loadEvents() {
        // Try cache first
        const cached = localStorage.getItem(STORAGE.CACHE);
        const cacheTime = localStorage.getItem(STORAGE.CACHE + '_time');
        const now = Date.now();

        if (cached && cacheTime && (now - parseInt(cacheTime)) < CONFIG.CACHE_TTL_MS) {
          try {
            const parsed = JSON.parse(cached);
            this.eventsByYear = new Map(parsed);
            this.events = this.combineLoadedEvents();
            return;
          } catch (e) {
            console.warn('[Calendar] Cache parse error, will fetch fresh:', e);
          }
        }

        // Load fresh data
        try {
          const year = this.today.getFullYear();
          await this.ensureYearLoaded(year);
          await this.ensureYearLoaded(year + 1);
          this.events = this.combineLoadedEvents();

          // Save to cache
          localStorage.setItem(STORAGE.CACHE, JSON.stringify(Array.from(this.eventsByYear.entries())));
          localStorage.setItem(STORAGE.CACHE + '_time', String(now));
        } catch (error) {
          console.error('[Calendar] Load error:', error);
          this.events = [];
        }
      },

      async ensureYearLoaded(year) {
        if (this.eventsByYear.has(year)) return;

        try {
          // Try 2026 events first
          const res2026 = await fetch('../data/gurpurab-events-2026.json', { cache: 'no-cache' });
          if (res2026.ok) {
            const data2026 = await res2026.json();
            if (Array.isArray(data2026.gurupurabs)) {
              const events = data2026.gurupurabs.map(e => this.normalizeEvent(e));
              this.eventsByYear.set(2026, events);
              return;
            }
          }
        } catch (e) {
          console.warn('[Calendar] 2026 fetch failed:', e);
        }

        // Fallback to guru-purabs.json
        try {
          const res = await fetch('../data/guru-purabs.json', { cache: 'no-cache' });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.gurupurabs)) {
              const events = data.gurupurabs.map(e => this.normalizeEvent(e));
              this.eventsByYear.set(year, events);
            }
          }
        } catch (e) {
          console.warn('[Calendar] guru-purabs.json fetch failed:', e);
        }
      },

      normalizeEvent(event) {
        return {
          id: event.id,
          name_en: event.name || event.name_en,
          name_pa: event.namePunjabi || event.name_pa,
          type: event.type,
          nanakshahi_date: event.nanakshahi ? `${event.nanakshahi.date} ${event.nanakshahi.month}` : event.nanakshahi_date,
          gregorian_date: event.gregorian2026 || event.gregorian_date,
          description_en: event.description || event.description_en,
          description_pa: event.descriptionPunjabi || event.description_pa,
          color: event.color,
          arth: event.arth,
          related_shabads: event.related_shabads,
          celebrations: event.celebrations
        };
      },

      combineLoadedEvents() {
        const all = [];
        for (const events of this.eventsByYear.values()) {
          all.push(...events);
        }
        return all;
      },

      getEventsForDate(iso) {
        const events = [];
        for (const yearEvents of this.eventsByYear.values()) {
          for (const e of yearEvents) {
            if (e.gregorian_date === iso) {
              events.push(e);
            }
          }
        }
        return events;
      },

      updateTodayDisplay() {
        // Today display is reactive via computed properties
      },

      setFilter(filterId) {
        this.currentFilter = filterId;
      },

      filterEvents() {
        // Filter is reactive via computed property
      },

      navigateMonth(delta) {
        this.currentMonth = new Date(
          this.currentMonth.getFullYear(),
          this.currentMonth.getMonth() + delta,
          1
        );
      },

      goToMonth(monthIndex) {
        this.currentMonth = new Date(
          this.today.getFullYear(),
          monthIndex,
          1
        );
        this.currentView = 'monthly';
      },

      handleDayClick(day) {
        if (day.events.length === 1) {
          this.openEventModal(day.events[0]);
        } else if (day.events.length > 1) {
          // Show picker for multiple events
          this.openDayPicker(day);
        }
      },

      openDayPicker(day) {
        // For simplicity, just open the first event
        if (day.events.length > 0) {
          this.openEventModal(day.events[0]);
        }
      },

      openEventModal(event) {
        this.selectedEvent = event;
        document.body.classList.add('modal-open');
      },

      closeEventModal() {
        this.selectedEvent = null;
        document.body.classList.remove('modal-open');
      },

      openReminderSheet() {
        this.showReminder = true;
        // Load existing reminder settings
        const storage = this.loadReminders();
        const existing = storage[this.selectedEvent.id];
        if (existing) {
          this.reminderEnabled = existing.enabled ?? true;
          this.reminderTime = existing.notification_time || '08:00';
          this.reminderDays = existing.days_before || [30, 10, 7, 3, 1, 0];
        } else {
          this.reminderEnabled = true;
          this.reminderTime = '08:00';
          this.reminderDays = [30, 10, 7, 3, 1, 0];
        }
      },

      closeReminderSheet() {
        this.showReminder = false;
      },

      toggleReminderDay(days) {
        const index = this.reminderDays.indexOf(days);
        if (index > -1) {
          this.reminderDays.splice(index, 1);
        } else {
          this.reminderDays.push(days);
        }
      },

      saveReminder() {
        const storage = this.loadReminders();
        storage[this.selectedEvent.id] = {
          enabled: this.reminderEnabled,
          notification_time: this.reminderTime,
          days_before: [...this.reminderDays]
        };
        localStorage.setItem(STORAGE.REMINDERS, JSON.stringify(storage));
        this.showReminder = false;
      },

      loadReminders() {
        try {
          return JSON.parse(localStorage.getItem(STORAGE.REMINDERS) || '{}');
        } catch {
          return {};
        }
      },

      openArthModal() {
        if (!this.selectedEvent?.arth) {
          alert('ਅਰਥ ਉਪਲਬਧ ਨਹੀਂ ਹੈ');
          return;
        }
        this.showArth = true;
      },

      closeArthModal() {
        this.showArth = false;
      },

      downloadICS() {
        if (!this.selectedEvent) return;
        
        const event = this.selectedEvent;
        const date = parseISODate(event.gregorian_date);
        if (!date) return;

        const startDate = formatISODate(date).replace(/-/g, '');
        const endDate = formatISODate(new Date(date.getTime() + 24 * 60 * 60 * 1000)).replace(/-/g, '');

        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//ANHAD Gurpurab Calendar//EN',
          'BEGIN:VEVENT',
          `DTSTART:${startDate}T080000Z`,
          `DTEND:${endDate}T080000Z`,
          `SUMMARY:${escapeHtml(event.name_en)}`,
          `DESCRIPTION:${escapeHtml(event.description_en || '')}`,
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.name_en.replace(/\s+/g, '_')}.ics`;
        a.click();
        URL.revokeObjectURL(url);
      },

      shareEvent() {
        if (!this.selectedEvent) return;
        
        const event = this.selectedEvent;
        const shareData = {
          title: event.name_en,
          text: `${event.name_en}\n${event.nanakshahi_date}\n${formatGregorianLong(parseISODate(event.gregorian_date))}`
        };

        if (navigator.share) {
          navigator.share(shareData).catch(console.error);
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(shareData.text).then(() => {
            alert('Event details copied to clipboard');
          }).catch(() => {
            alert('Sharing not supported on this device');
          });
        }
      },

      goBack() {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '../index.html';
        }
      },

      formatDate(iso) {
        const d = parseISODate(iso);
        return d ? formatGregorianLong(d) : iso;
      },

      getDaysText(event) {
        if (!event._date) return '—';
        const days = daysBetween(this.today, event._date);
        if (days === 0) return 'Today';
        if (days > 0) return `${days} days`;
        return `${Math.abs(days)} days ago`;
      },

      getRemainingText(event) {
        if (!event._date) return '—';
        const days = daysBetween(this.today, event._date);
        if (days === 0) return 'Today';
        if (days > 0) return `${days} days remaining`;
        return `${Math.abs(days)} days ago`;
      },

      getTypeColor(type) {
        return TYPE_COLORS[type] || '#999';
      }
    };
  }

  // Register Alpine component
  if (typeof Alpine !== 'undefined') {
    Alpine.data('calendarApp', calendarApp);
  } else {
    // Fallback if Alpine.js fails to load
    console.error('[Calendar] Alpine.js not loaded');
  }

})();
