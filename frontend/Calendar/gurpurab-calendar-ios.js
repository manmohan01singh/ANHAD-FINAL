(function () {
  'use strict';

  const TYPE_COLORS = {
    prakash: '#FF6B00',
    shaheedi: '#EF4444',
    gurgaddi: '#8B5CF6',
    historical: '#22C55E',
    sangrand: '#3B82F6',
    puranmashi: '#F59E0B',
    masya: '#111827'
  };

  const state = {
    today: startOfDay(new Date()),
    month: startOfMonth(new Date()),
    events: [],
    expandedEvent: null
  };

  function qs(id) { return document.getElementById(id); }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function formatISODate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

  function parseISODate(iso) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function daysBetween(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / (24 * 60 * 60 * 1000));
  }

  function escapeHtml(s) {
    return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  function nanakshahiFromGregorian(date) {
    const nsMonths = [
      { name: 'ਚੇਤ', days: 31 }, { name: 'ਵੈਸਾਖ', days: 31 }, { name: 'ਜੇਠ', days: 31 },
      { name: 'ਹਾੜ', days: 31 }, { name: 'ਸਾਵਣ', days: 31 }, { name: 'ਭਾਦੋਂ', days: 30 },
      { name: 'ਅੱਸੂ', days: 30 }, { name: 'ਕੱਤਕ', days: 30 }, { name: 'ਮੱਘਰ', days: 30 },
      { name: 'ਪੋਹ', days: 30 }, { name: 'ਮਾਘ', days: 30 }, { name: 'ਫੱਗਣ', days: 30 }
    ];

    const year = date.getFullYear();
    const startOfNsYear = new Date(year, 2, 14);
    let nsYear, dayOffset;

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
      monthIndex++;
    }

    const nsMonth = nsMonths[Math.min(monthIndex, nsMonths.length - 1)];
    return { year: nsYear, monthName: nsMonth.name, day: dayOffset + 1 };
  }

  function formatGregorianLong(d) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatMonthTitle(d) {
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  async function loadEventsForYear(year) {
    try {
      if (year === 2026) {
        const res = await fetch('../data/gurpurab-events-2026.json', { cache: 'no-cache' });
        if (res.ok) {
          const json = await res.json();
          if (json?.years?.['2026']) {
            return json.years['2026'].map(normalizeEvent).filter(Boolean);
          }
        }
      }

      const res = await fetch('../data/guru-purabs.json', { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        if (json?.__schema === 'guru-purabs') {
          return buildEventsFromGuruPurabs(json, year);
        }
      }

      const res2 = await fetch('../data/gurpurab-events.json', { cache: 'no-cache' });
      if (res2.ok) {
        const json = await res2.json();
        const list = json?.years?.[String(year)];
        if (Array.isArray(list)) {
          return list.map(normalizeEvent).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('[Calendar] Load error:', e);
    }
    return [];
  }

  function normalizeEvent(raw, idx) {
    if (!raw?.gregorian_date) return null;
    const type = String(raw.type || 'historical').toLowerCase();
    return {
      id: String(raw.id || `${raw.gregorian_date}-${idx}`),
      name_pa: String(raw.name_pa || ''),
      name_en: String(raw.name_en || ''),
      gregorian_date: raw.gregorian_date,
      type: TYPE_COLORS[type] ? type : 'historical',
      color: String(raw.color || TYPE_COLORS[type] || '#999')
    };
  }

  function buildEventsFromGuruPurabs(data, year) {
    const events = [];
    const purabs = data?.gurupurabs || [];

    purabs.forEach((p) => {
      const dateEntry = p?.dates?.find(d => d.year === year || d.gregorianYear === year);
      if (!dateEntry?.gregorianDate) return;

      events.push({
        id: String(p.id || `${dateEntry.gregorianDate}-${events.length}`),
        name_pa: String(p.namePunjabi || p.name?.punjabi || ''),
        name_en: String(p.nameEnglish || p.name?.english || ''),
        gregorian_date: dateEntry.gregorianDate,
        type: String(p.type || 'historical').toLowerCase(),
        color: String(p.color || TYPE_COLORS[p.type] || '#999')
      });
    });

    return events;
  }

  async function init() {
    const year = state.today.getFullYear();
    const events2026 = await loadEventsForYear(2026);
    const eventsYear = await loadEventsForYear(year);
    const eventsNext = await loadEventsForYear(year + 1);

    const map = new Map();
    [...events2026, ...eventsYear, ...eventsNext].forEach(e => {
      const key = `${e.gregorian_date}-${e.id}`;
      if (!map.has(key)) map.set(key, e);
    });

    state.events = Array.from(map.values()).sort((a, b) => {
      const da = parseISODate(a.gregorian_date);
      const db = parseISODate(b.gregorian_date);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });

    render();
    qs('loader')?.classList.add('hidden');
  }

  function render() {
    renderToday();
    renderCalendar();
    renderUpcoming();
  }

  function renderToday() {
    const ns = nanakshahiFromGregorian(state.today);
    const nkEl = qs('todayNk');
    const gEl = qs('todayG');
    if (nkEl) nkEl.textContent = `${ns.day} ${ns.monthName}, ${ns.year}`;
    if (gEl) gEl.textContent = formatGregorianLong(state.today);
  }

  function renderCalendar() {
    const monthLabel = qs('monthLabel');
    if (monthLabel) monthLabel.textContent = formatMonthTitle(state.month);

    const grid = qs('calendarGrid');
    if (!grid) return;

    const year = state.month.getFullYear();
    const month = state.month.getMonth();
    const first = new Date(year, month, 1);
    const mondayFirstIndex = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayFirstIndex);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }

    const eventsByISO = groupEventsByISO(state.events);
    const todayISO = formatISODate(state.today);

    grid.innerHTML = '';
    days.forEach((d) => {
      const iso = formatISODate(d);
      const isToday = iso === todayISO;
      const isOtherMonth = d.getMonth() !== month;
      const dayEvents = eventsByISO.get(iso) || [];

      const cell = document.createElement('div');
      cell.className = 'calendar-day' + (isOtherMonth ? ' other-month' : '') + (isToday ? ' today' : '');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', formatGregorianLong(d));

      const dots = dayEvents.slice(0, 3).map(e =>
        `<span class="event-dot" style="background:${escapeHtml(e.color)}"></span>`
      ).join('');

      cell.innerHTML = `
        <span class="day-number">${d.getDate()}</span>
        <span class="day-dots">${dots}</span>
      `;

      if (dayEvents.length > 0) {
        cell.addEventListener('click', () => showDayEvents(d, dayEvents));
      }

      grid.appendChild(cell);
    });
  }

  function groupEventsByISO(list) {
    const map = new Map();
    list.forEach(e => {
      const d = parseISODate(e.gregorian_date);
      if (!d) return;
      const iso = formatISODate(d);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(e);
    });
    return map;
  }

  function showDayEvents(date, dayEvents) {
    const list = qs('upcomingList');
    if (!list || dayEvents.length === 0) return;

    qs('upcomingTitle').textContent = `Events on ${formatGregorianLong(date)}`;
    list.innerHTML = '';

    dayEvents.forEach(e => {
      const row = createEventRow(e, true);
      list.appendChild(row);
    });

    state.expandedEvent = null;
  }

  function renderUpcoming() {
    const list = qs('upcomingList');
    const title = qs('upcomingTitle');
    if (!list || !title) return;

    title.textContent = 'Upcoming';

    const today = state.today;
    const end = new Date(today);
    end.setDate(end.getDate() + 90);

    const upcoming = state.events
      .map(e => ({ ...e, _date: parseISODate(e.gregorian_date) }))
      .filter(e => e._date && e._date >= today && e._date <= end)
      .sort((a, b) => a._date - b._date)
      .slice(0, 10);

    list.innerHTML = '';

    if (upcoming.length === 0) {
      list.innerHTML = '<div class="empty-state">No upcoming events</div>';
      return;
    }

    upcoming.forEach(e => {
      const row = createEventRow(e, false);
      list.appendChild(row);
    });
  }

  function createEventRow(e, isDayView) {
    const d = parseISODate(e.gregorian_date);
    const days = daysBetween(state.today, d);
    const isToday = days === 0;

    const row = document.createElement('div');
    row.className = 'event-row' + (isToday ? ' event-today' : '');
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');

    const when = isToday ? 'Today' : days > 0 ? `${days} days` : `${Math.abs(days)} days ago`;

    row.innerHTML = `
      <div class="event-main">
        <div class="event-dot" style="background:${escapeHtml(e.color)}"></div>
        <div class="event-info">
          <div class="event-title">${escapeHtml(e.name_en || '—')}</div>
          <div class="event-meta">${escapeHtml(formatGregorianLong(d))} • ${escapeHtml(e.type)}</div>
        </div>
        <div class="event-when">${escapeHtml(when)}</div>
      </div>
      <div class="event-detail hidden">
        <div class="event-name-pa">${escapeHtml(e.name_pa || '')}</div>
        <div class="event-date-pair">
          <span>📅 ${escapeHtml(formatGregorianLong(d))}</span>
          <span>🪯 ${escapeHtml(e.gregorian_date)}</span>
        </div>
      </div>
    `;

    row.addEventListener('click', () => toggleEventDetail(row, e));
    row.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        row.click();
      }
    });

    return row;
  }

  function toggleEventDetail(row, e) {
    const detail = row.querySelector('.event-detail');
    const wasHidden = detail.classList.contains('hidden');

    document.querySelectorAll('.event-detail').forEach(d => d.classList.add('hidden'));

    if (wasHidden) {
      detail.classList.remove('hidden');
      state.expandedEvent = e.id;
    } else {
      state.expandedEvent = null;
    }
  }

  function bindUI() {
    qs('btnBack')?.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../index.html';
      }
    });

    qs('btnToday')?.addEventListener('click', () => {
      state.month = startOfMonth(state.today);
      renderCalendar();
      renderUpcoming();
    });

    qs('btnPrev')?.addEventListener('click', () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
      renderCalendar();
    });

    qs('btnNext')?.addEventListener('click', () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindUI();
    init();
  });
})();
