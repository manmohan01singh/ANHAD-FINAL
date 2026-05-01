/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Homepage Data & Logic
   Real-time data, navigation, audio sync, install, filters
   Extracted from inline scripts for clean architecture
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

// ═══════════════════════════════════════════════════════════════════
// GURU IMAGE MAPPING — Maps events to their corresponding Guru images
// ═══════════════════════════════════════════════════════════════════
const GURU_IMAGE_MAP = {
  // Guru numbers 1-10 for the ten Gurus
  1: 'assets/icons/guru-nanak-dev-ji.png',
  2: 'assets/icons/guru-angad-dev-ji.png',
  3: 'assets/icons/guru-amar-das-ji.png',
  4: 'assets/icons/guru-ramdas-ji.png',
  5: 'assets/icons/guru-arjan-dev-ji.png',
  6: 'assets/icons/guru-hargobind-ji.png',
  7: 'assets/icons/guru-har-rai-ji.png',
  8: 'assets/icons/guru-har-krishan-ji.png',
  9: 'assets/icons/guru-tegh-bahadur-ji.png',
  10: 'assets/icons/guru-gobind-singh-ji.png',
  // Special mappings for Guru Granth Sahib and Sahibzade
  'guru-granth-sahib': 'assets/icons/guru-granth-sahib-ji.png',
  'sahibzade': 'assets/icons/sahibzade.png'
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

document.addEventListener('DOMContentLoaded', function () {

  // ━━━ NAVIGATION PATHS ━━━
  const NAV_PATHS = {
    gurbaniRadioCard: 'GurbaniRadio/gurbani-radio.html',
    DailyHukamnamaCard: 'Hukamnama/daily-hukamnama.html',
    shabadVicharCard: 'ShabadVichar/shabad-vichar.html',
    nitnemCard: 'nitnem/indexbani.html',
    sehajPaathCard: 'SehajPaath/sehaj-paath.html',
    gurbaniKhojCard: 'GurbaniKhoj/gurbani-khoj.html',
    naamAbhyasCard: 'NaamAbhyas/naam-abhyas.html',
    calendarCard: 'Calendar/GurpurabCalendar-ios.html',
    nitnemTrackerCard: 'NitnemTracker/nitnem-tracker.html',
    remindersCard: 'reminders/smart-reminders-v7.html',
    notesCard: 'Notes/notes.html'
  };

  Object.entries(NAV_PATHS).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        el.style.transform = 'scale(0.97)';
        if (navigator.vibrate) navigator.vibrate(10);
        setTimeout(() => window.location.href = path, 100);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    }
  });

  // ━━━ REAL-TIME GREETING ━━━
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

  // ━━━ REAL-TIME CLOCK ━━━
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const el = document.getElementById('currentTime');
    if (el) el.textContent = timeStr;
  }

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
    try {
      const response = await fetch('data/gurpurab-events-2026.json');
      const data = await response.json();
      const events2026 = data.years['2026'] || [];
      const gurpurabs = events2026.map(e => ({ 
        name: e.name_en, 
        id: e.id,
        date: new Date(e.gregorian_date), 
        type: e.type 
      })).sort((a, b) => a.date - b.date);
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      const todayEvent = gurpurabs.find(g => g.date.toLocaleDateString('en-CA') === todayStr);
      
      // Determine which event to display (today's event or next upcoming)
      const displayEvent = todayEvent || gurpurabs.find(g => g.date >= now);
      
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
        const daysLeft = Math.ceil((displayEvent.date - now) / 86400000);
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
        const now = new Date(), ch = now.getHours(), cm = now.getMinutes(), sh = cm >= 30 ? ch + 1 : ch;
        if (typeof schedule === 'object') { for (let h = sh; h < 24; h++) { if (schedule[h] && schedule[h].status === 'pending') { nextScheduledHour = h; break; } } }
      }
      if (nextScheduledHour === null) {
        const configData = localStorage.getItem('naam_abhyas_config');
        if (configData) { const config = JSON.parse(configData); if (config.enabled && config.activeHours) { const now = new Date(), eh = now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours(); if (eh >= config.activeHours.start && eh < config.activeHours.end) nextScheduledHour = eh; else if (eh < config.activeHours.start) nextScheduledHour = config.activeHours.start; } }
      }
    } catch (e) {}
    const subtitleEl = document.getElementById('nextSession'), timeEl = document.getElementById('sessionTime');
    if (!subtitleEl || !timeEl) return;
    if (nextScheduledHour !== null) {
      let timeStr; try { const sd = localStorage.getItem('naam_abhyas_schedule'); if (sd) { const s = JSON.parse(sd); if (s[nextScheduledHour]?.startTime) timeStr = s[nextScheduledHour].startTime; } } catch (e) {}
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
    } catch (e) {}
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const nl = localStorage.getItem('nitnemTracker_nitnemLog');
      if (nl) { const p = JSON.parse(nl); if (p[today]) { if (Array.isArray(p[today])) completedToday = p[today].length; else if (typeof p[today] === 'object') { const td = p[today]; completedToday = (td.amritvela?.length || 0) + (td.rehras?.length || 0) + (td.sohila?.length || 0); } } }
      const sd = localStorage.getItem('nitnemTracker_streakData');
      if (sd) { const p = JSON.parse(sd); streak = p.current || p.currentStreak || 0; }
      if (streak === 0) { const ud = localStorage.getItem('nitnemTracker_userData'); if (ud) { const p = JSON.parse(ud); streak = p.streaks?.current || p.streak?.current || 0; } }
    } catch (e) {}
    const streakEl = document.getElementById('streakDays'), textEl = document.getElementById('streakText'), ringFill = document.getElementById('nitnemRingFill'), ringText = document.getElementById('nitnemRingText');
    const circumference = 163.36, progress = completedToday / totalBanis, offset = circumference * (1 - progress);
    if (ringFill) setTimeout(() => { ringFill.style.strokeDashoffset = offset; }, 150);
    if (ringText) ringText.textContent = `${completedToday}/${totalBanis}`;
    if (completedToday > 0) {
      if (textEl) textEl.textContent = completedToday >= totalBanis ? '🎉 All banis completed! Waheguru ji!' : `${completedToday}/${totalBanis} banis completed today`;
      if (streakEl) streakEl.textContent = streak > 0 ? `🔥 ${streak} Day${streak > 1 ? 's' : ''} Streak` : `✓ ${completedToday}/${totalBanis}`;
    } else if (streak > 0) {
      if (textEl) textEl.textContent = `${streak}-day streak! Start today's Nitnem`;
      if (streakEl) streakEl.textContent = `🔥 ${streak} Day${streak > 1 ? 's' : ''} Streak`;
    } else { if (textEl) textEl.textContent = 'Track your daily Nitnem practice'; if (streakEl) streakEl.textContent = '📿 Start Today'; }
  }

  // ━━━ SEHAJ PAATH ━━━
  function updateSehajPaath() {
    let currentAng = 1, hasData = false;
    try {
      const sd = localStorage.getItem('sehajPaathState');
      if (sd) { const p = JSON.parse(sd); currentAng = p.currentPaath?.currentAng || p.currentAng || 1; hasData = currentAng > 1; }
      if (!hasData) { const bd = localStorage.getItem('gurbani_sehajPaath_progress'); if (bd) { const p = JSON.parse(bd); currentAng = p.data?.currentAng || p.currentAng || 1; hasData = currentAng > 1; } }
    } catch (e) {}
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
    try { const sb = localStorage.getItem('nitnemTracker_selectedBanis'); if (sb) { const p = JSON.parse(sb); total = (p.amritvela?.length || 0) + (p.rehras?.length || 0) + (p.sohila?.length || 0); if (total === 0) total = 11; } } catch (e) {}
    try { const today = now.toLocaleDateString('en-CA'); const nl = localStorage.getItem('nitnemTracker_nitnemLog'); if (nl) { const p = JSON.parse(nl); if (p[today]) { if (Array.isArray(p[today])) completed = p[today].length; else { const td = p[today]; completed = (td.amritvela?.length || 0) + (td.rehras?.length || 0) + (td.sohila?.length || 0); } } } } catch (e) {}
    let suggestion = ''; if (hour >= 4 && hour < 9) suggestion = 'Start Japji Sahib Ji 🌅'; else if (hour >= 9 && hour < 12) suggestion = 'Continue morning Nitnem ☀️'; else if (hour >= 12 && hour < 17) suggestion = 'Rehras Sahib Ji in evening 🙏'; else if (hour >= 17 && hour < 20) suggestion = 'Time for Rehras Sahib Ji 🌆'; else suggestion = 'Sohila Sahib Ji before bed 🌙';
    const percent = Math.round((completed / total) * 100);
    const lbl = document.getElementById('progressLabel'), pct = document.getElementById('progressPercent'), txt = document.getElementById('progressText'), fill = document.getElementById('progressFill');
    if (lbl) lbl.textContent = `${completed}/${total} Banis`;
    if (pct) pct.textContent = `${percent}%`;
    if (txt) txt.textContent = completed === 0 ? suggestion : completed >= total ? 'Amazing! All banis completed today! 🎉' : `${completed} done! ${suggestion}`;
    if (fill) setTimeout(() => { fill.style.width = `${percent}%`; }, 600);
  }

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
    try { const r = localStorage.getItem('cine_alarms_v4'); if (r) { const p = JSON.parse(r); if (Array.isArray(p)) count += p.filter(a => a.on).length; } const hour = new Date().getHours(); if (hour >= 6 && hour < 10) count++; if (hour >= 17 && hour < 20) count++; } catch (e) {}
    const badge = document.getElementById('notifBadge');
    if (badge) { if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = 'flex'; } else { badge.style.display = 'none'; } }
  }

  // ━━━ NOTIFICATION CLICK ━━━
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = 'reminders/smart-reminders-v7.html';
    });
  }

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
      window.location.href = 'Homepage/ios-homepage.html';
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
    const isDark = window.AnhadTheme.isDark();
    if (isDark) {
      themeToggleTrack?.classList.add('active');
      if (themeIcon) themeIcon.className = 'fas fa-sun';
      if (themeLabel) themeLabel.textContent = 'Light Mode';
    } else {
      themeToggleTrack?.classList.remove('active');
      if (themeIcon) themeIcon.className = 'fas fa-moon';
      if (themeLabel) themeLabel.textContent = 'Dark Mode';
    }
  }

  // Initialize theme UI
  setTimeout(updateThemeUI, 100);

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
  updateGreeting(); updateClock(); updateListenerCount(); updateHukamDate(); updateNextGurpurab();
  updateNextSession(); updateNitnemTracker(); updateSehajPaath(); updateProgressCard(); updateNitnemSubtitle(); updateNotificationBadge();
  setInterval(updateClock, 1000); setInterval(updateListenerCount, 5000); setInterval(updateGreeting, 60000); setInterval(updateNitnemSubtitle, 60000); setInterval(updateNotificationBadge, 60000);

  // ━━━ REFRESH ON RETURN ━━━
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { updateNitnemTracker(); updateSehajPaath(); updateProgressCard(); updateNextSession(); updateNitnemSubtitle(); } });
  window.addEventListener('pageshow', e => { if (e.persisted) { updateNitnemTracker(); updateSehajPaath(); updateProgressCard(); updateNextSession(); updateNitnemSubtitle(); } });

  console.log('✨ ANHAD Premium Homepage Data Initialized');
});

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
      
      if (!window.Capacitor && navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: streamName === 'amritvela' ? 'Amritvela Radio' : 'Live Kirtan',
          artist: 'Sri Harmandir Sahib Ji',
          album: 'ANHAD Audio Engine',
          artwork: [
            { src: 'assets/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: 'assets/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'assets/icon-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
      }
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

    // Check Initial State on Load
    setTimeout(function () {
      if (window.AnhadAudio && window.AnhadAudio.isPlaying()) {
        const stream = window.AnhadAudio.getCurrentStream() || 'darbar';
        if (stream === 'darbar') { 
          if (playIcon1) playIcon1.className = 'fas fa-pause'; 
          if (card1) card1.classList.add('playing'); 
        } else if (stream === 'amritvela') { 
          if (playIcon2) playIcon2.className = 'fas fa-pause'; 
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
