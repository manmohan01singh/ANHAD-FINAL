/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Homepage Data & Logic
   Real-time data, navigation, audio sync, install, filters
   Extracted from inline scripts for clean architecture
   ═══════════════════════════════════════════════════════════════════ */
// Whole-file IIFE: this script is no longer in smooth-navigation.js's
// SHELL_SCRIPTS, so its <script> tag gets removed and freshly re-added
// (executePageScripts()) on every non-cached SPA arrival at Home — as a
// plain external script (not the inline-script path, which already gets an
// IIFE wrapper from executePageScripts() itself), each re-execution runs in
// global scope. Every top-level const/let/class here would otherwise throw
// "Identifier has already been declared" on the second execution onward —
// confirmed via real-browser testing: this GURU_IMAGE_MAP declaration threw
// exactly that, aborting the entire file's parse (and therefore every guard
// and listener defined below, including the ones added specifically to
// survive repeated execution) on every SPA revisit to Home after the first.
(function () {
'use strict';

// ═══════════════════════════════════════════════════════════════════
// GURU IMAGE MAPPING — Maps events to their corresponding Guru images
// ═══════════════════════════════════════════════════════════════════
const GURU_IMAGE_MAP = {
  // Guru numbers 1-10 for the ten Gurus
  1: '/assets/icons/guru-nanak-dev-ji.png',
  2: '/assets/icons/guru-angad-dev-ji.png',
  3: '/assets/icons/guru-amar-das-ji.png',
  4: '/assets/icons/guru-ramdas-ji.png',
  5: '/assets/icons/guru-arjan-dev-ji.png',
  6: '/assets/icons/guru-hargobind-ji.png',
  7: '/assets/icons/guru-har-rai-ji.png',
  8: '/assets/icons/guru-har-krishan-ji.png',
  9: '/assets/icons/guru-tegh-bahadur-ji.png',
  10: '/assets/icons/guru-gobind-singh-ji.png',
  // Special mappings for Guru Granth Sahib and Sahibzade
  'guru-granth-sahib': '/assets/icons/guru-granth-sahib-ji.png',
  'sahibzade': '/assets/icons/sahibzade.png'
};

// Maps event names/patterns to their corresponding guru
const EVENT_TO_GURU_MAP = {
  // Vaisakhi / Khalsa Sajna → Guru Gobind Singh Ji
  'vaisakhi': 10,
  'khalsa': 10,

  // Sangrand → Guru Granth Sahib Ji
  'sangrand': 'guru-granth-sahib',

  // Bandi Chhor Divas → Guru Hargobind Sahib Ji
  'bandi-chor': 6,
  'bandi-chhor': 6,

  // Hola Mohalla → Guru Gobind Singh Ji
  'hola-mohalla': 10,

  // Miri Piri Diwas → Guru Hargobind Sahib Ji
  'miri-piri': 6,

  // Guru Granth Sahib events
  'guru-granth': 'guru-granth-sahib',
  'sampuranta': 'guru-granth-sahib',
  'first-parkash': 'guru-granth-sahib',
  'gurgaddi-sggs': 'guru-granth-sahib',

  // Sahibzade events
  'sahibzada': 'sahibzade',
  'vade-sahibzade': 'sahibzade',
  'chhote-sahibzade': 'sahibzade',

  // Historical events without specific guru → Guru Granth Sahib Ji
  'sikh-dastar': 'guru-granth-sahib',
  'darbar-khalsa': 'guru-granth-sahib',
  'nanakshahi-newyear': 'guru-granth-sahib'
};

// Helper function to get guru image for an event
function getGuruImageForEvent(eventName, guruNumber) {
  const nameLower = String(eventName || '').toLowerCase();

  // First check if event name matches a pattern in EVENT_TO_GURU_MAP
  for (const [pattern, guruId] of Object.entries(EVENT_TO_GURU_MAP)) {
    if (nameLower.includes(pattern)) {
      return GURU_IMAGE_MAP[guruId] || GURU_IMAGE_MAP['guru-granth-sahib'];
    }
  }

  // If guru_number is provided, use that
  if (guruNumber && GURU_IMAGE_MAP[guruNumber]) {
    return GURU_IMAGE_MAP[guruNumber];
  }

  // Default to Guru Granth Sahib Ji
  return GURU_IMAGE_MAP['guru-granth-sahib'];
}

// Helper function to get guru name for display
function getGuruNameForEvent(eventName, guruNumber) {
  const nameLower = String(eventName || '').toLowerCase();

  // Special cases
  if (nameLower.includes('vaisakhi') || nameLower.includes('khalsa')) {
    return 'Sri Guru Gobind Singh Sahib Ji';
  }
  if (nameLower.includes('sangrand')) {
    return 'Sri Guru Granth Sahib Ji';
  }
  if (nameLower.includes('bandi-chor') || nameLower.includes('bandi-chhor')) {
    return 'Sri Guru Hargobind Sahib Ji';
  }
  if (nameLower.includes('hola-mohalla')) {
    return 'Sri Guru Gobind Singh Sahib Ji';
  }
  if (nameLower.includes('miri-piri')) {
    return 'Sri Guru Hargobind Sahib Ji';
  }
  if (nameLower.includes('guru-granth') || nameLower.includes('sampuranta') ||
    nameLower.includes('first-parkash') || nameLower.includes('gurgaddi-sggs')) {
    return 'Sri Guru Granth Sahib Ji';
  }
  if (nameLower.includes('sahibzada')) {
    return 'Sahibzade';
  }

  // Extract guru name from event name if it contains "Guru"
  const guruMatch = nameLower.match(/guru\s+(\w+)/);
  if (guruMatch) {
    const guruName = guruMatch[1].charAt(0).toUpperCase() + guruMatch[1].slice(1);
    return `Sri Guru ${guruName} Sahib Ji`;
  }

  // Default
  return 'Sri Guru Granth Sahib Ji';
}

// Named + readyState-guarded (not a bare DOMContentLoaded listener) so this
// still runs when smooth-navigation.js re-injects this script on SPA
// navigation, well after the document's own DOMContentLoaded already fired.
// Mirrors the pattern already used below at the DYNAMIC ISLAND & AUDIO ENGINE
// IIFE's own boot check. The cache/return detection inside (HomeStateManager,
// _homepageDataInitialized, etc.) already correctly no-ops repeat calls.
function _anhadHomepageDataInit() {

  // ━━━ REAL-TIME CLOCK — hoisted to top to prevent TDZ error in fast-return path ━━━
  let lastTimeStr = '';
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (timeStr !== lastTimeStr) {
      const el = document.getElementById('currentTime');
      if (el) el.textContent = timeStr;
      lastTimeStr = timeStr;
    }
  }

  // ━━━ REAL-TIME GREETING — hoisted to top to prevent TDZ error in fast-return path ━━━
  function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour >= 4 && hour < 12) greeting = 'Good Morning ☀️';
    else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
    else if (hour >= 17 && hour < 21) greeting = 'Good Evening 🌅';
    else greeting = 'Waheguru Ji 🌙';
    const el = document.getElementById('greeting');
    if (el) el.textContent = greeting;
  }

  // ━━━ NAVIGATION PATHS — hoisted to prevent TDZ error in fast-return path ━━━
  const NAV_PATHS = {
    gurbaniRadioCard: 'GurbaniRadio/gurbani-radio.html',
    DailyHukamnamaCard: 'Hukamnama/daily-hukamnama.html',
    shabadVicharCard: 'ShabadVichar/shabad-vichar.html',
    nitnemCard: 'nitnem/index.html',
    sehajPaathCard: 'SehajPaath/sehaj-paath.html',
    gurbaniKhojCard: 'GurbaniKhoj/gurbani-khoj.html',
    naamAbhyasCard: 'NaamAbhyas/naam-abhyas.html',
    calendarCard: 'Calendar/GurpurabCalendar-ios.html',
    nitnemTrackerCard: 'NitnemTracker/nitnem-tracker.html',
    remindersCard: 'reminders/smart-reminders-v7.html',
    notesCard: 'Notes/notes.html'
  };

  // NATIVE APP FIX: HomeStateManager-backed fast return path.
  //
  // Gated on having ALREADY done a full init in this JS realm. Previously this
  // only checked HomeStateManager, and both of its signals are effectively
  // always true: isReturningFromNavigation() falls through to "is there any
  // session state?" (anhad-sky-bg.js writes some via saveImageState), and
  // isRecentlyInitialized() is re-stamped on every visibilitychange so it never
  // expires. sessionStorage also survives a hard reload. So on the exact
  // sequence the user reported — hard-reload on Insights, then navigate to
  // Home — this file was freshly injected, took the fast path on its FIRST
  // run, and skipped everything below: #hukamDate, listener counts, the nitnem
  // and sehaj subtitles, the Gurpurab fields, the notification badge, the
  // filter panel, the radio menu and all five update intervals. It also never
  // set _homepageDataInitialized, so every later call repeated the same
  // shortcut and Home never recovered.
  const isReturning = window.HomeStateManager?.isReturningFromNavigation();
  const hasRecentState = window.HomeStateManager?.isRecentlyInitialized();

  if (window._homepageDataInitialized && isReturning && hasRecentState) {
    console.log('[HomepageData] 🚀 Fast return - restoring from cached state');
    
    // Restore data from cache without re-fetching
    const cachedState = window.HomeStateManager.getState();
    if (cachedState?.data) {
      // Restore UI from cached data instantly
      restoreUIFromCache(cachedState.data);
    }
    
    // Only update time-sensitive data
    updateClock();
    updateGreeting();
    
    // Bind event listeners (always needed)
    bindNavigationListeners();
    bindProfileDropdown();
    bindThemeToggle();
    
    // Start lightweight timers only
    startLightweightTimers();
    
    console.log('[HomepageData] ✓ Fast return complete');
    return;
  }

  // FIX: Guard against duplicate initialization on SPA re-mount
  if (window._homepageDataInitialized) {
    console.log('[HomepageData] Already initialized, skipping duplicate init');
    return;
  }
  window._homepageDataInitialized = true;

  // FIX: Track intervals for cleanup
  const _hpIntervals = [];

  Object.entries(NAV_PATHS).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        el.style.transform = 'scale(0.97)';
        if (navigator.vibrate) navigator.vibrate(10);
        const destination = path;
        setTimeout(() => {
          if (window.navigateTo) window.navigateTo(destination);
          else window.location.href = destination;
        }, 100);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    }
  });

  // ━━━ REAL-TIME GREETING ━━━ (declared above at top of DOMContentLoaded — no duplicate)
  // ━━━ REAL-TIME CLOCK ━━━ (declared above at top of DOMContentLoaded — no duplicate)

  // ━━━ LISTENER COUNT ━━━
  let baseListeners = 1247;
  function updateListenerCount() {
    const variation = Math.floor(Math.random() * 50) - 25;
    const current = Math.max(1000, baseListeners + variation);
    const formatted = current.toLocaleString();
    const el = document.getElementById('listenerCount');
    const heroEl = document.getElementById('heroListeners');
    if (el) el.textContent = `${formatted} listening`;
    if (heroEl) heroEl.textContent = formatted;
  }

  // ━━━ HUKAMNAMA DATE ━━━
  function updateHukamDate() {
    const now = new Date();
    const el = document.getElementById('hukamDate');
    if (el) el.textContent = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ━━━ NEXT GURPURAB ━━━
  async function updateNextGurpurab() {
    const subtitleEl = document.getElementById('nextGurpurab');
    const dateEl = document.getElementById('gurpurabDate');
    const calendarCard = document.getElementById('calendarCard');

    // Guru image updates are now handled by trendora-app.js to avoid conflicts
    // This function only updates the text and calendar card styling

    if (!subtitleEl || !dateEl) return;
    
    // PHASE 1 OPTIMIZATION: Check cache first (saves ~300ms on returns)
    const cacheKey = 'anhad_gurpurab_cache_2026';
    const cacheTimeKey = 'anhad_gurpurab_cache_time';
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheTimestamp = sessionStorage.getItem(cacheTimeKey);
    const cacheAge = Date.now() - (parseInt(cacheTimestamp) || 0);
    
    // Use cache if less than 1 hour old (instant load!)
    if (cachedData && cacheAge < 3600000) {
      try {
        const data = JSON.parse(cachedData);
        processGurpurabData(data, subtitleEl, dateEl, calendarCard);
        return; // EXIT - No fetch needed! Saves ~300ms
      } catch(e) {
        // Cache corrupted, clear it and fetch fresh
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(cacheTimeKey);
      }
    }
    
    // Fetch fresh data (first time or stale cache)
    try {
      const dataUrl = (window.ANHAD_ROOT || '') + 'data/gurpurab-events-2026.json';
      const response = await fetch(dataUrl);
      const data = await response.json();
      
      // Cache for next time
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(cacheTimeKey, Date.now().toString());
      
      processGurpurabData(data, subtitleEl, dateEl, calendarCard);
    } catch (e) {
      subtitleEl.textContent = 'View Gurpurab Calendar';
      dateEl.textContent = '📅 Open';
    }
  }
  
  // Helper function to process Gurpurab data (extracted for cache reuse)
  function processGurpurabData(data, subtitleEl, dateEl, calendarCard) {
    try {
      const events2026 = data.years['2026'] || [];
      const gurpurabs = events2026.map(e => {
        const [y, m, d] = e.gregorian_date.split('-');
        return {
          name: e.name_en,
          id: e.id,
          date: new Date(y, m - 1, d), // Local midnight 
          type: e.type
        };
      }).sort((a, b) => a.date - b.date);

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todayEvent = gurpurabs.find(g => g.date.getTime() === todayMidnight.getTime());

      // Determine which event to display (today's event or next upcoming)
      const displayEvent = todayEvent || gurpurabs.find(g => g.date > todayMidnight);

      if (displayEvent) {
        // FIX: Add event type classes to calendar card for ring lights
        if (calendarCard) {
          calendarCard.classList.remove('celebration', 'memorial');
          const memorialTypes = ['shaheedi', 'historical'];
          const celebrationTypes = ['prakash', 'gurgaddi'];
          if (memorialTypes.includes(displayEvent.type)) {
            calendarCard.classList.add('memorial');
          } else if (celebrationTypes.includes(displayEvent.type)) {
            calendarCard.classList.add('celebration');
          }
        }

        if (todayEvent) {
          // FIX: Different text for memorial vs celebration
          const memorialTypes = ['shaheedi', 'historical'];
          if (memorialTypes.includes(todayEvent.type)) {
            subtitleEl.textContent = `🕯️ Remembrance: ${todayEvent.name}`;
            dateEl.textContent = '🙏 Today';
          } else {
            subtitleEl.textContent = `🙏 Today: ${todayEvent.name}`;
            dateEl.textContent = '🎉 Celebrate!';
          }
          return;
        }

        // It's an upcoming event
        const daysLeft = Math.round((displayEvent.date - todayMidnight) / 86400000);
        const dateStr = displayEvent.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // FIX: Add celebration class for upcoming celebration events
        if (calendarCard) {
          const celebrationTypes = ['prakash', 'gurgaddi'];
          if (celebrationTypes.includes(displayEvent.type)) {
            calendarCard.classList.add('celebration');
          }
        }

        subtitleEl.textContent = `Up Next: ${displayEvent.name}`;
        dateEl.textContent = daysLeft === 0 ? '🎊 Today!' : daysLeft === 1 ? '🎊 Tomorrow!' : `${daysLeft} days • ${dateStr}`;
      } else {
        subtitleEl.textContent = 'View all events for 2026';
        dateEl.textContent = '📅 Calendar';
      }
    } catch (e) {
      subtitleEl.textContent = 'View Gurpurab Calendar';
      dateEl.textContent = '📅 Open';
    }
  }

  // ━━━ NAAM ABHYAS ━━━
  function updateNextSession() {
    let lastSessionTime = null, totalMinutesToday = 0, nextScheduledHour = null, completedToday = 0;
    try {
      const historyData = localStorage.getItem('naam_abhyas_history');
      if (historyData) {
        const parsed = JSON.parse(historyData);
        const today = new Date().toLocaleDateString('en-CA');
        if (parsed.daily && parsed.daily[today]) { completedToday = parsed.daily[today].completed || 0; totalMinutesToday = parsed.daily[today].totalMinutes || 0; }
        if (parsed.sessions && parsed.sessions.length > 0) {
          const sorted = [...parsed.sessions].sort((a, b) => new Date(b.endTime || b.date) - new Date(a.endTime || a.date));
          const last = sorted[0];
          lastSessionTime = new Date(last.endTime || last.date);
        }
      }
      const scheduleData = localStorage.getItem('naam_abhyas_schedule');
      if (scheduleData) {
        const schedule = JSON.parse(scheduleData);
        const now = new Date(), ch = now.getHours(), cm = now.getMinutes(), sh = ch; // Always check from current hour - status='pending' handles filtering
        if (typeof schedule === 'object') { for (let h = sh; h < 24; h++) { if (schedule[h] && schedule[h].status === 'pending') { nextScheduledHour = h; break; } } }
      }
      if (nextScheduledHour === null) {
        const configData = localStorage.getItem('naam_abhyas_config');
        if (configData) { const config = JSON.parse(configData); if (config.enabled && config.activeHours) { const now = new Date(), eh = now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours(); if (eh >= config.activeHours.start && eh < config.activeHours.end) nextScheduledHour = eh; else if (eh < config.activeHours.start) nextScheduledHour = config.activeHours.start; } }
      }
    } catch (e) { }
    const subtitleEl = document.getElementById('naamSubtitle') || document.getElementById('nextSession'), timeEl = document.getElementById('naamMeta') || document.getElementById('sessionTime');
    if (!subtitleEl || !timeEl) return;
    if (nextScheduledHour !== null) {
      let timeStr; try { const sd = localStorage.getItem('naam_abhyas_schedule'); if (sd) { const s = JSON.parse(sd); if (s[nextScheduledHour]?.startTime) timeStr = s[nextScheduledHour].startTime; } } catch (e) { }
      if (!timeStr) { const ampm = nextScheduledHour >= 12 ? 'PM' : 'AM'; timeStr = `${nextScheduledHour % 12 || 12}:00 ${ampm}`; }
      subtitleEl.textContent = completedToday > 0 ? `${completedToday} sessions today • Next at` : 'Next session at';
      timeEl.textContent = timeStr;
    } else if (lastSessionTime && !isNaN(lastSessionTime.getTime())) {
      const timeStr = lastSessionTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const today = new Date().toLocaleDateString('en-CA'), sessionDate = lastSessionTime.toLocaleDateString('en-CA');
      subtitleEl.textContent = sessionDate === today ? (completedToday > 0 ? `${completedToday} sessions today` : 'Completed today') : `Last: ${lastSessionTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      timeEl.textContent = sessionDate === today ? `✓ ${timeStr}` : timeStr;
    } else { subtitleEl.textContent = 'Start your meditation journey'; timeEl.textContent = 'Begin Now'; }
  }

  // ━━━ NITNEM TRACKER ━━━
  function updateNitnemTracker() {
    let streak = 0, completedToday = 0, totalBanis = 0;
    try {
      const sb = localStorage.getItem('nitnemTracker_selectedBanis');
      if (sb) {
        const p = JSON.parse(sb);
        totalBanis = (p.amritvela?.length || 0) + (p.rehras?.length || 0) + (p.sohila?.length || 0);
      } else {
        totalBanis = 11; // Default only if no selection exists
      }
    } catch (e) { }
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const nl = localStorage.getItem('nitnemTracker_nitnemLog');
      if (nl) {
        const p = JSON.parse(nl);
        if (p[today]) {
          // Handle different data structure formats
          if (Array.isArray(p[today])) {
            completedToday = p[today].length;
          } else if (typeof p[today] === 'object') {
            const td = p[today];
            // Check for completed array (newer format)
            if (Array.isArray(td.completed)) {
              completedToday = td.completed.length;
            } else {
              // Fallback to individual bani arrays
              completedToday = (td.amritvela?.length || 0) + (td.rehras?.length || 0) + (td.sohila?.length || 0);
            }
          } else if (typeof p[today] === 'number') {
            completedToday = p[today];
          }
        }
      }

      // SYNC: Use UnifiedStats for streak data
      if (window.UnifiedStats) {
        const streaks = window.UnifiedStats.getStreaks();
        streak = streaks.nitnem || 0;
      } else {
        const sd = localStorage.getItem('anhad_streak_data');
        if (sd) { const p = JSON.parse(sd); streak = p.current || p.currentStreak || 0; }
        if (streak === 0) { const ud = localStorage.getItem('nitnemTracker_userData'); if (ud) { const p = JSON.parse(ud); streak = p.streaks?.current || p.streak?.current || 0; } }
      }
    } catch (e) { }
    const streakEl = document.getElementById('nitnemStreak'), textEl = document.getElementById('streakText'), ringFill = document.getElementById('nitnemRingFill'), ringText = document.getElementById('nitnemRingText');
    const circumference = 163.36, progress = completedToday / totalBanis, offset = circumference * (1 - progress);
    if (ringFill) setTimeout(() => { ringFill.style.strokeDashoffset = offset; }, 150);
    if (ringText) ringText.textContent = `${completedToday}/${totalBanis}`;
    if (completedToday > 0) {
      if (textEl) textEl.textContent = completedToday >= totalBanis ? '🎉 All banis completed! Waheguru ji!' : `${completedToday}/${totalBanis} banis completed today`;
      if (streakEl) streakEl.innerHTML = streak > 0 ? `<span class="quick-card__streak">🔥 ${streak} day${streak > 1 ? 's' : ''}</span>` : `<span class="quick-card__progress">${completedToday}/${totalBanis}</span>`;
    } else if (streak > 0) {
      if (textEl) textEl.textContent = `${streak}-day streak! Start today's Nitnem`;
      if (streakEl) streakEl.innerHTML = `<span class="quick-card__streak">🔥 ${streak} day${streak > 1 ? 's' : ''}</span>`;
    } else { if (textEl) textEl.textContent = 'Track your daily Nitnem practice'; if (streakEl) streakEl.innerHTML = '<span class="quick-card__progress">Start today</span>'; }
  }

  // Bind to UnifiedStats events for real-time updates
  window.addEventListener('statsInitialized', updateNitnemTracker);
  window.addEventListener('statsChanged', updateNitnemTracker);
  window.addEventListener('nitnemDayCompleted', updateNitnemTracker);
  window.addEventListener('nitnemUpdated', updateNitnemTracker);

  // Cross-page SPA synchronization
  window.addEventListener('streakUpdated', updateNitnemTracker);
  window.addEventListener('storage', (e) => {
    if (e.key === 'anhad_streak_data' || 
        e.key === 'nitnemTracker_nitnemLog' || 
        e.key === 'nitnemTracker_progress' ||
        e.key === 'nitnemTracker_selectedBanis') {
      console.log('[Homepage] Storage event detected, updating nitnem tracker');
      updateNitnemTracker();
    }
  });

  // CRITICAL FIX: Expose updateNitnemTracker globally for cross-page updates
  window.updateNitnemTracker = updateNitnemTracker;

  // ━━━ SEHAJ PAATH ━━━
  function updateSehajPaath() {
    let currentAng = 1, hasData = false;
    try {
      const sd = localStorage.getItem('sehajPaathState');
      if (sd) { const p = JSON.parse(sd); currentAng = p.currentPaath?.currentAng || p.currentAng || 1; hasData = currentAng > 1; }
      if (!hasData) { const bd = localStorage.getItem('gurbani_sehajPaath_progress'); if (bd) { const p = JSON.parse(bd); currentAng = p.data?.currentAng || p.currentAng || 1; hasData = currentAng > 1; } }
    } catch (e) { }
    const totalAngs = 1430, progress = ((currentAng / totalAngs) * 100).toFixed(1);
    const subtitleEl = document.getElementById('sehajSubtitle'), angEl = document.getElementById('sehajAng');
    if (!subtitleEl || !angEl) return;
    if (currentAng >= totalAngs) { subtitleEl.textContent = '🎉 Sehaj Paath completed! Start again'; angEl.textContent = `${totalAngs} Angs read ✨`; }
    else if (currentAng > 1) { subtitleEl.textContent = `${progress}% complete • ${totalAngs - currentAng + 1} angs remaining`; angEl.textContent = `Continue Ang ${currentAng}`; }
    else { subtitleEl.textContent = 'Begin your personalized reading journey'; angEl.textContent = 'Start Ang 1'; }
  }

  // ━━━ PROGRESS CARD ━━━
  function updateProgressCard() {
    const now = new Date(), hour = now.getHours();
    let completed = 0, total = 11;
    try { const sb = localStorage.getItem('nitnemTracker_selectedBanis'); if (sb) { const p = JSON.parse(sb); total = (p.amritvela?.length || 0) + (p.rehras?.length || 0) + (p.sohila?.length || 0); if (total === 0) total = 11; } } catch (e) { }
    try { const today = now.toLocaleDateString('en-CA'); const nl = localStorage.getItem('nitnemTracker_nitnemLog'); if (nl) { const p = JSON.parse(nl); if (p[today]) { if (Array.isArray(p[today])) completed = p[today].length; else { const td = p[today]; completed = (td.amritvela?.length || 0) + (td.rehras?.length || 0) + (td.sohila?.length || 0); } } } } catch (e) { }
    let suggestion = ''; if (hour >= 4 && hour < 9) suggestion = 'Start Japji Sahib Ji 🌅'; else if (hour >= 9 && hour < 12) suggestion = 'Continue morning Nitnem ☀️'; else if (hour >= 12 && hour < 17) suggestion = 'Rehras Sahib Ji in evening 🙏'; else if (hour >= 17 && hour < 20) suggestion = 'Time for Rehras Sahib Ji 🌆'; else suggestion = 'Sohila Sahib Ji before bed 🌙';
    const percent = Math.round((completed / total) * 100);
    const lbl = document.getElementById('progressLabel'), pct = document.getElementById('progressPercent'), txt = document.getElementById('progressText'), fill = document.getElementById('progressFill');
    if (lbl) lbl.textContent = `${completed}/${total} Banis`;
    if (pct) pct.textContent = `${percent}%`;
    if (txt) txt.textContent = completed === 0 ? suggestion : completed >= total ? 'Amazing! All banis completed today! 🎉' : `${completed} done! ${suggestion}`;
    if (fill) setTimeout(() => { fill.style.width = `${percent}%`; }, 600);
    
    console.log('[Homepage] Progress card updated:', { completed, total, percent });
  }

  // CRITICAL FIX: Bind progress card updates to storage events
  window.addEventListener('storage', (e) => {
    if (e.key === 'nitnemTracker_nitnemLog' || 
        e.key === 'nitnemTracker_selectedBanis' ||
        e.key === 'nitnemTracker_progress') {
      console.log('[Homepage] Storage event detected, updating progress card');
      updateProgressCard();
    }
  });
  window.addEventListener('nitnemUpdated', updateProgressCard);

  // ━━━ NITNEM SUBTITLE ━━━
  function updateNitnemSubtitle() {
    const hour = new Date().getHours(), el = document.getElementById('nitnemSubtitle');
    if (!el) return;
    if (hour >= 4 && hour < 9) el.textContent = 'Morning Banis 🌅';
    else if (hour >= 17 && hour < 20) el.textContent = 'Rehras Sahib Ji 🌆';
    else if (hour >= 20 || hour < 4) el.textContent = 'Sohila Sahib Ji 🌙';
    else el.textContent = 'Daily Prayers';
  }

  // ━━━ NOTIFICATION BADGE ━━━
  function updateNotificationBadge() {
    let count = 0;
    try { const r = localStorage.getItem('cine_alarms_v4'); if (r) { const p = JSON.parse(r); if (Array.isArray(p)) count += p.filter(a => a.on).length; } const hour = new Date().getHours(); if (hour >= 6 && hour < 10) count++; if (hour >= 17 && hour < 20) count++; } catch (e) { }
    const badge = document.getElementById('notifBadge');
    if (badge) { if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = 'flex'; } else { badge.style.display = 'none'; } }
  }

  // NOTIFICATION CLICK: bound via a plain onclick="" attribute on #notifBtn
  // itself (frontend/index.html header markup) — this was a duplicate of
  // that same binding (this file is also a SHELL_SCRIPTS entry, so it never
  // re-runs after an SPA swap either, meaning this copy was equally unable
  // to survive/rebind after Home is restored from DOM_CACHE).

  // ━━━ BACK BUTTON CLICK ━━━
  const backBtn = document.querySelector('.header__btn[href*="ios-homepage"]') || document.querySelector('.header__btn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // CRITICAL: Don't redirect to ios-homepage in Capacitor — causes redirect loop
      if (typeof window.Capacitor !== 'undefined') {
        // In native mode, just go back in history or stay
        if (window.anhadGoBack) {
          window.anhadGoBack('./index.html');
        } else {
          window.history.back();
        }
        return;
      }

      const destination = 'Homepage/ios-homepage.html';
      if (window.navigateTo) window.navigateTo(destination);
      else window.location.href = destination;
    });
  }

  // ━━━ PROFILE DROPDOWN ━━━
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  let backdrop = document.createElement('div');
  backdrop.className = 'profile-dropdown-backdrop';
  document.body.appendChild(backdrop);

  profileBtn?.addEventListener('click', () => {
    profileDropdown?.classList.toggle('open');
    backdrop.classList.toggle('active');
  });

  backdrop.addEventListener('click', () => {
    profileDropdown?.classList.remove('open');
    backdrop.classList.remove('active');
  });

  // ━━━ THEME TOGGLE (Dropdown) ━━━
  const themeToggleDropdown = document.getElementById('themeToggleDropdown');
  const themeToggleTrack = document.getElementById('themeToggleTrack');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');

  themeToggleDropdown?.addEventListener('click', () => {
    if (window.AnhadTheme) {
      window.AnhadTheme.toggle();
      updateThemeUI();
    }
  });

  function updateThemeUI() {
    if (!window.AnhadTheme) return;
    const mode = window.AnhadTheme.get ? window.AnhadTheme.get() : 'auto';
    const isDark = window.AnhadTheme.isDark ? window.AnhadTheme.isDark() : false;
    if (isDark) {
      themeToggleTrack?.classList.add('active');
      if (themeLabel) themeLabel.textContent = 'Light Mode';
    } else {
      themeToggleTrack?.classList.remove('active');
      if (themeLabel) themeLabel.textContent = 'Dark Mode';
    }
    if (themeIcon) {
      themeIcon.textContent = mode === 'auto' ? '✨' : (isDark ? '☀️' : '🌙');
    }
  }

  // Initialize theme UI synchronously without delay
  updateThemeUI();

  // ━━━ FILTER PANEL ━━━
  const filterPanel = document.getElementById('filterPanel'), filterClose = document.getElementById('filterClose'), filterOptions = document.querySelectorAll('.filter-panel__option');
  document.querySelector('.filter-btn')?.addEventListener('click', () => filterPanel?.classList.add('active'));
  filterClose?.addEventListener('click', () => filterPanel?.classList.remove('active'));
  filterPanel?.addEventListener('click', e => { if (e.target === filterPanel) filterPanel.classList.remove('active'); });
  filterOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      filterOptions.forEach(o => o.classList.remove('selected')); opt.classList.add('selected');
      const filter = opt.dataset.filter;
      document.querySelectorAll('[data-category]').forEach(card => { card.style.display = filter === 'radio' ? '' : (card.dataset.category === filter ? '' : 'none'); });
      filterPanel?.classList.remove('active');
    });
  });

  // ━━━ INSTALL BANNER ━━━
  // Handled centrally in trendora-app.js (InstallController)
  // to prevent ID conflicts and double-firing logic.

  // ━━━ RADIO MENU ━━━
  const radioMenu = document.getElementById('radioMenu'), radioMenuCancel = document.getElementById('radioMenuCancel'), gurbaniRadioCard = document.getElementById('gurbaniRadioCard');
  radioMenuCancel?.addEventListener('click', () => radioMenu?.classList.remove('active'));
  radioMenu?.addEventListener('click', e => { if (e.target === radioMenu) radioMenu.classList.remove('active'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && radioMenu?.classList.contains('active')) radioMenu.classList.remove('active'); });

  // ━━━ INIT ALL ━━━
  // PHASE 3: ULTRA-INSTANT - Only absolute essentials, defer everything else
  
  // INSTANT: Critical UI only (< 10ms)
  updateGreeting();
  updateClock();
  
  // DEFERRED: Everything else loads invisibly in idle time (0ms blocking)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      updateListenerCount();
      updateHukamDate();
      updateNitnemTracker();
      updateSehajPaath();
      updateProgressCard();
      updateNitnemSubtitle();
      updateNotificationBadge();
    }, { timeout: 50 });
    
    // Defer Gurpurab separately (can be slow)
    requestIdleCallback(() => {
      updateNextGurpurab();
      updateNextSession();
    }, { timeout: 200 });
  } else {
    // Minimal delay fallback
    setTimeout(() => {
      updateListenerCount();
      updateHukamDate();
      updateNitnemTracker();
      updateSehajPaath();
      updateProgressCard();
      updateNitnemSubtitle();
      updateNotificationBadge();
      updateNextGurpurab();
      updateNextSession();
    }, 0); // Next tick - non-blocking
  }
  
  // Intervals are tracked on `window`, not in a per-call local, and any set
  // from a previous init are cleared first — otherwise each re-entry into this
  // body leaked another five permanently-running timers.
  function startHomepageIntervals() {
    (window.__anhadHomepageIntervals || []).forEach(id => clearInterval(id));
    // Retire the lightweight set too — it duplicates updateClock/updateGreeting
    // from this set under a different window key. See startLightweightTimers().
    (window.__anhadHomeLightweightIntervals || []).forEach(id => clearInterval(id));
    window.__anhadHomeLightweightIntervals = [];
    window.__anhadHomepageIntervals = [
      setInterval(() => { if (!document.hidden) updateClock(); }, 15000),
      setInterval(() => { if (!document.hidden) updateListenerCount(); }, 60000),
      setInterval(() => { if (!document.hidden) updateGreeting(); }, 300000),
      setInterval(() => { if (!document.hidden) updateNitnemSubtitle(); }, 300000),
      setInterval(() => { if (!document.hidden) updateNotificationBadge(); }, 300000)
    ];
    return window.__anhadHomepageIntervals;
  }

  _hpIntervals.push(...startHomepageIntervals());

  // Clean up intervals on genuine page unload.
  //
  // Deliberately does NOT reset window._homepageDataInitialized any more.
  // `pagehide` fires whenever a mobile PWA is backgrounded — not just on real
  // unload — so resetting the guard there meant that every app switch re-armed
  // this entire init body, re-registering ~10 undeduped listeners on window /
  // document (including an anhad_page_changed handler that runs 10 update
  // functions). Those stacked for the rest of the session and made every
  // subsequent navigation progressively slower. Repopulating Home on SPA
  // return is trendora-app.js's job (refreshAll via __anhadPageInit /
  // anhad_page_changed), not something to buy with a guard reset here.
  if (!window.__anhadHomepagePagehideBound) {
    window.__anhadHomepagePagehideBound = true;
    window.addEventListener('pagehide', () => {
      (window.__anhadHomepageIntervals || []).forEach(id => clearInterval(id));
      window.__anhadHomepageIntervals = [];
    });

    // ...and put them back when the page returns. `pagehide` fires every time a
    // mobile PWA is backgrounded, and the guard above means this init body will
    // not run again — so without this, one app switch permanently froze Home's
    // clock, listener count, greeting, nitnem subtitle and notification badge
    // for the rest of the session.
    window.addEventListener('pageshow', () => {
      const p = window.location.pathname;
      const onHome = p === '/' || p === '/frontend/' ||
        p.endsWith('/index.html') || p.endsWith('/frontend/');
      if (onHome && !(window.__anhadHomepageIntervals || []).length) {
        startHomepageIntervals();
      }
    });
  }

  // ━━━ REFRESH ON RETURN ━━━
  // OPTIMIZED: Only update time-sensitive data to prevent splash effect
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateClock();
      updateGreeting();
      // Only update data that actually changes, not full re-render
      updateNitnemSubtitle();
    }
  });
  window.addEventListener('pageshow', e => {
    if (e.persisted) {
      updateClock();
      updateGreeting();
      updateNitnemSubtitle();
    }
  });

  // ━━━ REFRESH ON SPA NAVIGATION BACK ━━━
  // CRITICAL FIX: When user navigates back to homepage via SPA, force refresh
  // all dynamic data (especially Gurpurab) to prevent stale information.
  window.addEventListener('anhad_page_changed', function () {
    // Only run if we're on the homepage.
    // smooth-navigation.js normalises '/index.html' to '/' before pushState
    // (normalizeUrl, smooth-navigation.js:46), so after any SPA navigation the
    // live pathname is bare '/'. The two endsWith() tests below matched neither,
    // and this entire refresh block — ten updaters including the Gurpurab card,
    // Nitnem tracker and Hukamnama date — never ran on a return to Home.
    const p = window.location.pathname;
    const onHome = p === '/' || p === '/frontend/' ||
      p.endsWith('/index.html') || p.endsWith('/frontend/');
    if (onHome) {
      console.log('[HomepageData] SPA page changed back to homepage, refreshing data');
      updateNextGurpurab();
      updateGreeting();
      updateClock();
      updateNitnemTracker();
      updateSehajPaath();
      updateProgressCard();
      updateNextSession();
      updateNitnemSubtitle();
      updateNotificationBadge();
      updateHukamDate();
    }
  });

  // ━━━ FAST RETURN HELPERS ━━━
  function restoreUIFromCache(cachedData) {
    if (cachedData.greeting) {
      const el = document.getElementById('greeting');
      if (el) el.textContent = cachedData.greeting;
    }
    if (cachedData.clock) {
      const el = document.getElementById('currentTime');
      if (el) el.textContent = cachedData.clock;
    }
    if (cachedData.nitnem) {
      const { completedToday, totalBanis, streak } = cachedData.nitnem;
      const textEl = document.getElementById('streakText');
      const streakEl = document.getElementById('nitnemStreak');
      if (textEl && streakEl) {
        if (completedToday > 0) {
          textEl.textContent = completedToday >= totalBanis ? '🎉 All banis completed! Waheguru ji!' : `${completedToday}/${totalBanis} banis completed today`;
          streakEl.innerHTML = streak > 0 ? `<span class="quick-card__streak">🔥 ${streak} day${streak > 1 ? 's' : ''}</span>` : `<span class="quick-card__progress">${completedToday}/${totalBanis}</span>`;
        }
      }
    }
    // Add more restore logic as needed for other cards
  }

  function bindNavigationListeners() {
    Object.entries(NAV_PATHS).forEach(([id, path]) => {
      const el = document.getElementById(id);
      if (el && !el._navBound) {
        el._navBound = true;
        el.addEventListener('click', () => {
          el.style.transform = 'scale(0.97)';
          if (navigator.vibrate) navigator.vibrate(10);
          setTimeout(() => {
            if (window.navigateTo) window.navigateTo(path);
            else window.location.href = path;
          }, 100);
        });
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
        });
      }
    });
  }

  function bindProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown && !profileBtn._dropdownBound) {
      profileBtn._dropdownBound = true;
      let backdrop = document.querySelector('.profile-dropdown-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'profile-dropdown-backdrop';
        document.body.appendChild(backdrop);
      }
      profileBtn.addEventListener('click', () => {
        profileDropdown.classList.toggle('open');
        backdrop.classList.toggle('active');
      });
      backdrop.addEventListener('click', () => {
        profileDropdown.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }
  }

  function bindThemeToggle() {
    const themeToggleDropdown = document.getElementById('themeToggleDropdown');
    if (themeToggleDropdown && !themeToggleDropdown._toggleBound) {
      themeToggleDropdown._toggleBound = true;
      themeToggleDropdown.addEventListener('click', () => {
        if (window.AnhadTheme) {
          window.AnhadTheme.toggle();
          updateThemeUI();
        }
      });
    }
  }

  function startLightweightTimers() {
    // Guarded on window: this function (called from the "fast return" branch
    // above) can run again on a later re-execution of this file.
    //
    // It also has to clear the FULL set, not just its own. The two sets are
    // disjoint arrays under different window keys, but they overlap in duty —
    // updateClock @15s and updateGreeting @300s appear in both — so a session
    // that took the full-init path and later the fast-return path ended up
    // running each of those twice, permanently. Whichever set arms last now
    // owns those two jobs outright.
    (window.__anhadHomeLightweightIntervals || []).forEach(id => clearInterval(id));
    (window.__anhadHomepageIntervals || []).forEach(id => clearInterval(id));
    window.__anhadHomepageIntervals = [];

    window.__anhadHomeLightweightIntervals = [
      setInterval(() => { if (!document.hidden) updateClock(); }, 15000),
      setInterval(() => { if (!document.hidden) updateGreeting(); }, 300000)
    ];

    if (!window.__anhadHomeLightweightPagehideBound) {
      window.__anhadHomeLightweightPagehideBound = true;
      // NOT { once: true }: pagehide also fires when a mobile PWA is merely
      // backgrounded, so the first background used to consume the listener and
      // leave every later departure without cleanup.
      window.addEventListener('pagehide', () => {
        (window.__anhadHomeLightweightIntervals || []).forEach(id => clearInterval(id));
      });
    }
  }

  // Save state after full initialization
  if (window.HomeStateManager) {
    const stateData = {
      data: {
        greeting: document.getElementById('greeting')?.textContent,
        clock: document.getElementById('currentTime')?.textContent,
        nitnem: {
          completedToday: 0, // Will be updated by updateNitnemTracker
          totalBanis: 0,
          streak: 0
        }
      },
      animations: {
        playedOnce: true
      }
    };
    window.HomeStateManager.saveState(stateData);
  }

  console.log('✨ ANHAD Premium Homepage Data Initialized');
}

// Composes with whatever is already registered at each key instead of
// overwriting it outright — see the matching comment in trendora-app.js's own
// __anhadPageInit registration (loaded just before this script,
// index.html:3387-3388) for why: both scripts register these same 4 keys,
// and whichever ran second used to silently win, so only one of the two
// intended repopulation paths ever actually fired.
window.__anhadPageInit = window.__anhadPageInit || {};
['/index.html', '/', '/frontend/index.html', '/frontend/'].forEach(p => {
  const existing = window.__anhadPageInit[p];
  window.__anhadPageInit[p] = (existing && existing !== _anhadHomepageDataInit)
    ? () => {
        try { existing(); } catch (e) { console.warn('[HomepageData] chained page-init (existing) failed', e); }
        _anhadHomepageDataInit();
      }
    : _anhadHomepageDataInit;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _anhadHomepageDataInit);
} else {
  _anhadHomepageDataInit();
}

// ━━━ DYNAMIC ISLAND & AUDIO ENGINE ━━━
(function () {
  'use strict';

  const island = document.getElementById('dynamicIsland');
  const islandDefault = document.getElementById('islandDefault');
  const islandPlaying = document.getElementById('islandPlaying');
  const islandStreamName = document.getElementById('islandStreamName');
  const islandWaveform = document.getElementById('islandWaveform');
  const islandActionBtn = document.getElementById('islandActionBtn');

  function setIslandState(isPlaying, streamName) {
    if (!island) return;

    if (isPlaying) {
      island.classList.add('playing');
      islandDefault.style.opacity = '0';
      islandDefault.style.pointerEvents = 'none';

      islandPlaying.style.opacity = '1';
      islandPlaying.style.pointerEvents = 'auto';
      islandWaveform.classList.remove('paused');

      islandStreamName.textContent = streamName === 'amritvela' ? 'Amritvela Radio' : 'Live Kirtan';
      islandActionBtn.innerHTML = '<i class="fas fa-pause"></i>';

      // NOTE: deliberately not setting navigator.mediaSession.metadata here.
      // AnhadAudio's updateMediaSession() (lib/anhad-audio-singleton.js) is the
      // single writer of that shared browser API — it has the real track title
      // and time-of-day artwork. This widget used to write its own generic
      // metadata here too, racing with the singleton's with no coordination
      // (whichever ran last silently won).
    } else {
      islandWaveform.classList.add('paused');
      islandActionBtn.innerHTML = '<i class="fas fa-play"></i>';

      // If completely stopped or no engine
      if (!window.AnhadAudio || !window.AnhadAudio.getCurrentStream()) {
        island.classList.remove('playing');
        islandPlaying.style.opacity = '0';
        islandPlaying.style.pointerEvents = 'none';
        islandDefault.style.opacity = '1';
        islandDefault.style.pointerEvents = 'auto';
      }
    }
  }

  function init() {
    const playIcon1 = document.getElementById('heroPlayIcon1'), card1 = document.getElementById('gurbaniRadioCard');
    const playIcon2 = document.getElementById('heroPlayIcon2'), card2 = document.getElementById('amritvelaCard');

    // This file is no longer in smooth-navigation.js's SHELL_SCRIPTS, so init()
    // now re-runs on every non-cached SPA arrival at Home. The click/element
    // listeners below re-bind safely each time (#app's innerHTML swap destroys
    // the old elements they were bound to, so old closures just go inert with
    // them) — but window is never destroyed, so guard this one to avoid N
    // stacked listeners each replaying the same (harmless but wasted) DOM
    // writes on every future anhadAudioStateChange event.
    if (!window.__anhadIslandAudioListenerBound) {
      window.__anhadIslandAudioListenerBound = true;
      window.addEventListener('anhadAudioStateChange', function (e) {
        const isPlaying = e.detail.isPlaying;
        const stream = e.detail.stream || 'darbar';

        // Update Hero Cards visually
        if (stream === 'darbar') {
          if (playIcon1) playIcon1.setAttribute('class', isPlaying ? 'fas fa-pause' : 'fas fa-play');
          if (card1) card1.classList.toggle('playing', isPlaying);
          if (playIcon2) playIcon2.setAttribute('class', 'fas fa-play');
          if (card2) card2.classList.remove('playing');
        } else if (stream === 'amritvela') {
          if (playIcon2) playIcon2.setAttribute('class', isPlaying ? 'fas fa-pause' : 'fas fa-play');
          if (card2) card2.classList.toggle('playing', isPlaying);
          if (playIcon1) playIcon1.setAttribute('class', 'fas fa-play');
          if (card1) card1.classList.remove('playing');
        }

        setIslandState(isPlaying, stream);
      });
    }

    // Check Initial State on Load
    setTimeout(function () {
      if (window.AnhadAudio && window.AnhadAudio.isPlaying()) {
        const stream = window.AnhadAudio.getCurrentStream() || 'darbar';
        if (stream === 'darbar') {
          // FIX: Use setAttribute for SVG elements instead of className
          if (playIcon1) playIcon1.setAttribute('class', 'fas fa-pause');
          if (card1) card1.classList.add('playing');
        } else if (stream === 'amritvela') {
          // FIX: Use setAttribute for SVG elements instead of className
          if (playIcon2) playIcon2.setAttribute('class', 'fas fa-pause');
          if (card2) card2.classList.add('playing');
        }
        setIslandState(true, stream);
      }
    }, 600);

    // Dynamic Island Interactions
    islandActionBtn?.addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger island click
      if (window.AnhadAudio) window.AnhadAudio.toggle();
    });

    // Clicking island while playing routes to full player
    island?.addEventListener('click', () => {
      if (island.classList.contains('playing')) {
        const stream = window.AnhadAudio?.getCurrentStream() || 'darbar';
        window.location.href = stream === 'amritvela' ? 'GurbaniRadio/gurbani-radio.html?stream=amritvela' : 'GurbaniRadio/gurbani-radio.html';
      }
    });

    // MediaSession OS Controls (Lockscreen/Control Center)
    // Only use web MediaSession for PWA, not Capacitor (native MediaSessionCompat handles it)
    if (!window.Capacitor && navigator.mediaSession) {
      navigator.mediaSession.setActionHandler('play', () => { if (window.AnhadAudio) window.AnhadAudio.play(); });
      navigator.mediaSession.setActionHandler('pause', () => { if (window.AnhadAudio) window.AnhadAudio.pause(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  else setTimeout(init, 50);
})();

})();
