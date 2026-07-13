/**
 * NAAM ABHYAS — Professional Schedule-Based UI
 * ══════════════════════════════════════════════════════════════════
 * Architecture:
 *   1. Shows hourly schedule list (always visible, scrollable)
 *   2. Tap session → Shows duration popup → Opens timer page
 *   3. Notification workflow: tap → direct to timer with autoStart
 *   4. Clean, professional, Google-level UI
 * ══════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     HOURLY SCHEDULE CONFIGURATION
  ───────────────────────────────────────────────── */
  var HOURLY_SCHEDULE = [
    { hour: 4,  label: 'Amritvela Hour',  icon: '🌅' },
    { hour: 5,  label: 'Morning Simran',  icon: '🌄' },
    { hour: 6,  label: 'Sunrise Session', icon: '☀️' },
    { hour: 7,  label: 'Early Day',       icon: '🌤' },
    { hour: 8,  label: 'Morning Peak',    icon: '⏰' },
    { hour: 9,  label: 'Mid-Morning',     icon: '📿' },
    { hour: 10, label: 'Late Morning',    icon: '🙏' },
    { hour: 11, label: 'Pre-Noon',        icon: '🕉' },
    { hour: 12, label: 'Noon Session',    icon: '☀️' },
    { hour: 13, label: 'Afternoon',       icon: '🌤' },
    { hour: 14, label: 'Mid-Afternoon',   icon: '📿' },
    { hour: 15, label: 'Late Afternoon',  icon: '🙏' },
    { hour: 16, label: 'Pre-Evening',     icon: '🌇' },
    { hour: 17, label: 'Evening Session', icon: '🌆' },
    { hour: 18, label: 'Sunset Hour',     icon: '🌅' },
    { hour: 19, label: 'Dusk Simran',     icon: '🌙' },
    { hour: 20, label: 'Evening Peak',    icon: '⭐' },
    { hour: 21, label: 'Night Session',   icon: '🌟' },
    { hour: 22, label: 'Late Night',      icon: '✨' },
    { hour: 23, label: 'Pre-Midnight',    icon: '🌙' }
  ];

  /* ─────────────────────────────────────────────────
     DOM REFERENCES
  ───────────────────────────────────────────────── */
  var DOM = {};
  var currentPopupSession = null;

  /* ─────────────────────────────────────────────────
     UTILITY FUNCTIONS
  ───────────────────────────────────────────────── */
  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

  function formatH12(hour) {
    var per = hour >= 12 ? 'PM' : 'AM';
    var h12 = hour % 12 || 12;
    return h12 + ':00 ' + per;
  }

  function haptic(style) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: style || 'MEDIUM' }).catch(function () {});
      }
    } catch (e) {}
  }

  function showToast(msg, durationMs) {
    var el = DOM.toast;
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, durationMs || 2500);
  }

  /* ─────────────────────────────────────────────────
     MANAGER INTEGRATION
  ───────────────────────────────────────────────── */
  function getManager() {
    return window.NaamAbhyasManager || null;
  }

  function getTodayCompletedSessions() {
    var manager = getManager();
    if (!manager) return [];
    try {
      var today = new Date().toLocaleDateString('en-CA');
      var records = JSON.parse(localStorage.getItem(manager.KEYS.records) || '{}');
      var completed = [];
      Object.keys(records).forEach(function(key) {
        var rec = records[key];
        if (rec && rec.completedAt && rec.completedAt.startsWith(today)) {
          completed.push({ hour: rec.hour, minute: rec.minute });
        }
      });
      return completed;
    } catch(e) {
      return [];
    }
  }

  function getStreakData() {
    var manager = getManager();
    if (!manager) return { streak: 0, total: 0 };
    try {
      var today = new Date().toLocaleDateString('en-CA');
      var history = JSON.parse(localStorage.getItem(manager.KEYS.history) || '{}');
      
      // Calculate streak
      var streak = 0;
      var date = new Date();
      for (var i = 0; i < 365; i++) {
        var d = date.toLocaleDateString('en-CA');
        var dayData = history[d];
        if (i === 0 && (!dayData || Object.keys(dayData).length === 0)) {
          // Today incomplete, check yesterday
          date.setDate(date.getDate() - 1);
          continue;
        }
        if (!dayData || Object.keys(dayData).length === 0) break;
        streak++;
        date.setDate(date.getDate() - 1);
      }

      // Get this week's total
      var total = 0;
      var startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      for (var j = 0; j < 7; j++) {
        var weekDay = new Date(startOfWeek);
        weekDay.setDate(weekDay.getDate() + j);
        var dayStr = weekDay.toLocaleDateString('en-CA');
        var dayRec = history[dayStr];
        if (dayRec) {
          total += Object.keys(dayRec).length;
        }
      }

      return { streak: streak, total: total };
    } catch(e) {
      return { streak: 0, total: 0 };
    }
  }

  /* ─────────────────────────────────────────────────
     RENDER FUNCTIONS
  ───────────────────────────────────────────────── */
  function renderStats() {
    var completed = getTodayCompletedSessions();
    var streak = getStreakData();
    
    var today = new Date();
    var dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    var percent = Math.round((completed.length / HOURLY_SCHEDULE.length) * 100);

    if (DOM.statsDate) DOM.statsDate.textContent = dateStr;
    if (DOM.statsPercent) DOM.statsPercent.textContent = percent + '%';
    if (DOM.statCompleted) DOM.statCompleted.textContent = completed.length;
    if (DOM.statStreak) DOM.statStreak.textContent = streak.streak;
    if (DOM.statTotal) DOM.statTotal.textContent = streak.total;
  }

  function isSessionCompleted(hour) {
    var completed = getTodayCompletedSessions();
    return completed.some(function(s) { return s.hour === hour; });
  }

  function renderScheduleList() {
    var container = DOM.scheduleList;
    if (!container) return;
    
    container.innerHTML = '';
    
    HOURLY_SCHEDULE.forEach(function(session) {
      var isCompleted = isSessionCompleted(session.hour);
      
      var item = document.createElement('div');
      item.className = 'na-schedule-item' + (isCompleted ? ' completed' : '');
      item.setAttribute('data-hour', session.hour);
      
      item.innerHTML = [
        '<div class="na-schedule-time">',
        '  <div class="na-schedule-time-icon">' + session.icon + '</div>',
        '  <div class="na-schedule-time-text">' + formatH12(session.hour) + '</div>',
        '</div>',
        '<div class="na-schedule-info">',
        '  <div class="na-schedule-label">' + session.label + '</div>',
        '  <div class="na-schedule-duration">2-minute session</div>',
        '</div>',
        '<div class="na-schedule-check">',
        '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">',
        '    <polyline points="20 6 9 17 4 12"/>',
        '  </svg>',
        '</div>'
      ].join('');
      
      item.addEventListener('click', function() {
        if (!isCompleted) {
          openDurationPopup(session);
        }
      });
      
      container.appendChild(item);
    });
  }

  /* ─────────────────────────────────────────────────
     POPUP HANDLING
  ───────────────────────────────────────────────── */
  function openDurationPopup(session) {
    currentPopupSession = session;
    
    if (DOM.popupTime) {
      DOM.popupTime.textContent = formatH12(session.hour) + ' — ' + session.label;
    }
    
    if (DOM.popupOverlay) {
      DOM.popupOverlay.classList.add('active');
    }
    
    haptic('LIGHT');
  }

  function closeDurationPopup() {
    if (DOM.popupOverlay) {
      DOM.popupOverlay.classList.remove('active');
    }
    currentPopupSession = null;
  }

  function startSession(durationSeconds) {
    if (!currentPopupSession) return;
    
    closeDurationPopup();
    haptic('MEDIUM');
    
    // Store session context for timer page
    var manager = getManager();
    if (manager && typeof manager.storeLaunchContext === 'function') {
      manager.storeLaunchContext({
        autoStart: true,
        source: 'schedule',
        hour: currentPopupSession.hour,
        minute: 0,
        duration: durationSeconds,
        session: currentPopupSession
      });
    }
    
    // Navigate to timer page (create if not exists)
    window.location.href = 'naam-abhyas-timer.html?autoStart=true&hour=' + currentPopupSession.hour + '&minute=0&duration=' + durationSeconds;
  }

  /* ─────────────────────────────────────────────────
     BACK NAVIGATION
  ───────────────────────────────────────────────── */
  function goBack() {
    haptic('LIGHT');
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '../index.html';
    }
  }

  /* ─────────────────────────────────────────────────
     DOM INIT & EVENT BINDINGS
  ───────────────────────────────────────────────── */
  function cacheDom() {
    DOM.scheduleList  = document.getElementById('naScheduleList');
    DOM.statsDate     = document.getElementById('naStatsDate');
    DOM.statsPercent  = document.getElementById('naStatsPercent');
    DOM.statCompleted = document.getElementById('naStatCompleted');
    DOM.statStreak    = document.getElementById('naStatStreak');
    DOM.statTotal     = document.getElementById('naStatTotal');
    DOM.popupOverlay  = document.getElementById('naPopupOverlay');
    DOM.popupTime     = document.getElementById('naPopupTime');
    DOM.popupCancel   = document.getElementById('naPopupCancel');
    DOM.backBtn       = document.getElementById('naBackBtn');
    DOM.settingsBtn   = document.getElementById('naSettingsBtn');
    DOM.toast         = document.getElementById('naToast');
  }

  function bindEvents() {
    if (DOM.backBtn) {
      DOM.backBtn.addEventListener('click', goBack);
    }

    if (DOM.settingsBtn) {
      DOM.settingsBtn.addEventListener('click', function() {
        window.location.href = 'naam-abhyas-settings.html';
      });
    }

    if (DOM.popupCancel) {
      DOM.popupCancel.addEventListener('click', closeDurationPopup);
    }

    // Duration option buttons
    document.querySelectorAll('.na-popup-option').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var duration = parseInt(this.getAttribute('data-duration'), 10);
        startSession(duration);
      });
    });

    // Close popup on backdrop click
    if (DOM.popupOverlay) {
      DOM.popupOverlay.addEventListener('click', function(e) {
        if (e.target === DOM.popupOverlay) {
          closeDurationPopup();
        }
      });
    }
  }

  /* ─────────────────────────────────────────────────
     NOTIFICATION INTEGRATION
  ───────────────────────────────────────────────── */
  function checkNotificationLaunch() {
    var url = new URL(window.location.href);
    var autoStart = url.searchParams.get('autoStart') === 'true';
    var hour = url.searchParams.get('hour');
    var minute = url.searchParams.get('minute');
    var duration = url.searchParams.get('duration') || '120';
    
    if (autoStart && hour !== null) {
      // Redirect to timer page with params
      setTimeout(function() {
        window.location.href = 'naam-abhyas-timer.html?autoStart=true&hour=' + hour + '&minute=' + (minute || '0') + '&duration=' + duration;
      }, 300);
    }
  }

  /* ─────────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────────── */
  function boot() {
    cacheDom();
    bindEvents();
    renderStats();
    renderScheduleList();
    checkNotificationLaunch();
    
    // Set up periodic refresh for real-time updates
    setInterval(function() {
      renderStats();
      renderScheduleList();
    }, 60000); // Refresh every minute
    
    // Listen for session completion events
    window.addEventListener('naamSessionCompleted', function() {
      renderStats();
      renderScheduleList();
      showToast('✅ Session completed! Waheguru Ji 🙏', 3000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
