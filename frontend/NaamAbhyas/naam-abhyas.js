/**
 * NAAM ABHYAS V3.0 — Complete Professional System
 * ══════════════════════════════════════════════════════════════════
 * Features:
 * - Random notification times within user-selected hour range
 * - On/Off toggle in settings
 * - Custom duration selection
 * - Notification sound selection
 * - Theme control
 * - Direct timer start from notification (no popups)
 * - Auto-mark complete when timer finishes
 * - Beautiful claymorphism UI
 * ══════════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';

  // ═══ CONFIGURATION & STATE ═══
  var CONFIG_KEY = 'naamAbhyas_config_v3';
  var SESSIONS_KEY = 'naamAbhyas_sessions_v3';
  var STATS_KEY = 'naamAbhyas_stats_v3';

  var DEFAULT_CONFIG = {
    enabled: true,
    startHour: 6,
    endHour: 22,
    sessionCount: 8,
    duration: 120, // seconds
    notificationSound: 'chime1',
    theme: 'auto'
  };

  var state = {
    config: null,
    todaySessions: [],
    timerRunning: false,
    timerStartTime: null,
    timerDuration: 120,
    timerInterval: null,
    currentSessionId: null
  };

  var DOM = {};

  // ═══ UTILITY FUNCTIONS ═══
  function loadConfig() {
    try {
      var saved = localStorage.getItem(CONFIG_KEY);
      state.config = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch(e) {
      state.config = DEFAULT_CONFIG;
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));
    } catch(e) {}
  }

  function getTodayKey() {
    return new Date().toLocaleDateString('en-CA');
  }

  function loadTodaySessions() {
    try {
      var today = getTodayKey();
      var allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
      state.todaySessions = allSessions[today] || [];
    } catch(e) {
      state.todaySessions = [];
    }
  }

  function saveTodaySessions() {
    try {
      var today = getTodayKey();
      var allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
      allSessions[today] = state.todaySessions;
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
    } catch(e) {}
  }

  function generateRandomSessions() {
    if (!state.config.enabled) return [];
    
    var sessions = [];
    var start = state.config.startHour;
    var end = state.config.endHour;
    var count = state.config.sessionCount;
    
    // Generate random times between start and end hours
    var usedMinutes = new Set();
    
    for (var i = 0; i < count; i++) {
      var randomHour = start + Math.floor(Math.random() * (end - start + 1));
      var randomMinute = Math.floor(Math.random() * 60);
      
      // Avoid exact duplicates
      var key = randomHour + ':' + randomMinute;
      while (usedMinutes.has(key)) {
        randomMinute = Math.floor(Math.random() * 60);
        key = randomHour + ':' + randomMinute;
      }
      usedMinutes.add(key);
      
      sessions.push({
        id: 'session_' + Date.now() + '_' + i,
        hour: randomHour,
        minute: randomMinute,
        completed: false,
        completedAt: null
      });
    }
    
    // Sort by time
    sessions.sort(function(a, b) {
      return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
    });
    
    return sessions;
  }

  function ensureTodaySessions() {
    var today = getTodayKey();
    var lastGenerated = localStorage.getItem('naamAbhyas_lastGenerated');
    
    if (lastGenerated !== today || state.todaySessions.length === 0) {
      state.todaySessions = generateRandomSessions();
      saveTodaySessions();
      localStorage.setItem('naamAbhyas_lastGenerated', today);
      scheduleAllNotifications();
    }
  }

  function formatH12(hour, minute) {
    var per = hour >= 12 ? 'PM' : 'AM';
    var h12 = hour % 12 || 12;
    var min = String(minute).padStart(2, '0');
    return h12 + ':' + min + ' ' + per;
  }

  function formatMinSec(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function haptic(style) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: style || 'MEDIUM' }).catch(function(){});
      }
    } catch(e) {}
  }

  function showToast(msg) {
    if (!DOM.toast) return;
    DOM.toast.textContent = msg;
    DOM.toast.classList.add('show');
    setTimeout(function() {
      DOM.toast.classList.remove('show');
    }, 3000);
  }

  function playChime() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch(e) {}
  }

  // ═══ RENDER FUNCTIONS ═══
  function renderStats() {
    var completed = state.todaySessions.filter(function(s) { return s.completed; }).length;
    var total = state.todaySessions.length;
    var percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    var today = new Date();
    var dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    // Calculate streak
    var streak = calculateStreak();
    
    // Calculate week total
    var weekTotal = calculateWeekTotal();
    
    if (DOM.statsDate) DOM.statsDate.textContent = dateStr;
    if (DOM.statsPercent) DOM.statsPercent.textContent = percent + '%';
    if (DOM.statCompleted) DOM.statCompleted.textContent = completed;
    if (DOM.statStreak) DOM.statStreak.textContent = streak;
    if (DOM.statTotal) DOM.statTotal.textContent = weekTotal;
  }

  function calculateStreak() {
    try {
      var allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
      var streak = 0;
      var date = new Date();
      
      for (var i = 0; i < 365; i++) {
        var key = date.toLocaleDateString('en-CA');
        var daySessions = allSessions[key] || [];
        var hasCompleted = daySessions.some(function(s) { return s.completed; });
        
        if (i === 0 && !hasCompleted) {
          // Today not complete yet, check yesterday
          date.setDate(date.getDate() - 1);
          continue;
        }
        
        if (!hasCompleted) break;
        streak++;
        date.setDate(date.getDate() - 1);
      }
      
      return streak;
    } catch(e) {
      return 0;
    }
  }

  function calculateWeekTotal() {
    try {
      var allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
      var total = 0;
      var today = new Date();
      var startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      for (var i = 0; i < 7; i++) {
        var date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        var key = date.toLocaleDateString('en-CA');
        var daySessions = allSessions[key] || [];
        total += daySessions.filter(function(s) { return s.completed; }).length;
      }
      
      return total;
    } catch(e) {
      return 0;
    }
  }

  function renderScheduleList() {
    if (!DOM.scheduleList) return;
    
    DOM.scheduleList.innerHTML = '';
    
    if (state.todaySessions.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:40px 20px;color:var(--text-sec);';
      empty.textContent = state.config.enabled 
        ? 'No sessions scheduled for today' 
        : 'Naam Abhyas is disabled. Enable it in settings.';
      DOM.scheduleList.appendChild(empty);
      return;
    }
    
    state.todaySessions.forEach(function(session) {
      var item = document.createElement('div');
      item.className = 'na-schedule-item' + (session.completed ? ' completed' : '');
      item.setAttribute('data-id', session.id);
      
      item.innerHTML = [
        '<div class="na-schedule-time">',
        '  <div class="na-schedule-time-icon">🙏</div>',
        '  <div class="na-schedule-time-text">' + formatH12(session.hour, session.minute) + '</div>',
        '</div>',
        '<div class="na-schedule-info">',
        '  <div class="na-schedule-label">Naam Simran</div>',
        '  <div class="na-schedule-duration">' + Math.floor(state.config.duration / 60) + ' min session</div>',
        '</div>',
        '<div class="na-schedule-check">',
        '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">',
        '    <polyline points="20 6 9 17 4 12"/>',
        '  </svg>',
        '</div>'
      ].join('');
      
      if (!session.completed) {
        item.addEventListener('click', function() {
          startTimerForSession(session);
        });
      }
      
      DOM.scheduleList.appendChild(item);
    });
  }

  // ═══ TIMER FUNCTIONS ═══
  function startTimerForSession(session) {
    state.currentSessionId = session.id;
    state.timerDuration = state.config.duration;
    openTimerScreen();
    
    // Auto-start after animation
    setTimeout(function() {
      startTimer();
    }, 400);
  }

  function openTimerScreen() {
    if (DOM.timerOverlay) {
      DOM.timerOverlay.classList.add('active');
    }
    haptic('MEDIUM');
  }

  function closeTimerScreen() {
    if (DOM.timerOverlay) {
      DOM.timerOverlay.classList.remove('active');
    }
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    state.timerRunning = false;
    if (DOM.timerOrb) DOM.timerOrb.classList.remove('breathing');
  }

  function startTimer() {
    if (state.timerRunning) return;
    
    state.timerRunning = true;
    state.timerStartTime = Date.now();
    
    // Play gentle chime
    playChime();
    
    // Start breathing animation
    if (DOM.timerOrb) DOM.timerOrb.classList.add('breathing');
    
    // Update button states
    if (DOM.startTimerBtn) DOM.startTimerBtn.style.display = 'none';
    if (DOM.pauseTimerBtn) DOM.pauseTimerBtn.style.display = 'flex';
    
    // Start countdown
    updateTimerDisplay();
    state.timerInterval = setInterval(updateTimerDisplay, 250);
    
    haptic('LIGHT');
  }

  function pauseTimer() {
    if (!state.timerRunning) return;
    
    state.timerRunning = false;
    var elapsed = (Date.now() - state.timerStartTime) / 1000;
    state.timerDuration = Math.max(0, state.timerDuration - elapsed);
    
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    
    if (DOM.timerOrb) DOM.timerOrb.classList.remove('breathing');
    
    // Update button
    if (DOM.pauseTimerBtn) {
      DOM.pauseTimerBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
    
    haptic('LIGHT');
    showToast('⏸ Paused');
  }

  function resumeTimer() {
    if (state.timerRunning) return;
    
    state.timerRunning = true;
    state.timerStartTime = Date.now();
    
    if (DOM.timerOrb) DOM.timerOrb.classList.add('breathing');
    
    // Update button
    if (DOM.pauseTimerBtn) {
      DOM.pauseTimerBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/></svg>';
    }
    
    updateTimerDisplay();
    state.timerInterval = setInterval(updateTimerDisplay, 250);
    
    haptic('LIGHT');
  }

  function updateTimerDisplay() {
    if (!state.timerRunning) return;
    
    var elapsed = (Date.now() - state.timerStartTime) / 1000;
    var remaining = Math.max(0, state.timerDuration - elapsed);
    
    // Update display
    if (DOM.timerDisplay) {
      DOM.timerDisplay.textContent = formatMinSec(remaining);
    }
    
    // Update progress ring
    if (DOM.progressBar) {
      var totalDuration = state.config.duration;
      var progress = 1 - (remaining / totalDuration);
      var circumference = 2 * Math.PI * 90;
      var offset = circumference * (1 - progress);
      DOM.progressBar.style.strokeDashoffset = offset;
    }
    
    // Check if complete
    if (remaining <= 0) {
      completeTimer();
    }
  }

  function completeTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    
    state.timerRunning = false;
    if (DOM.timerOrb) DOM.timerOrb.classList.remove('breathing');
    
    // Mark session as complete
    if (state.currentSessionId) {
      var session = state.todaySessions.find(function(s) { return s.id === state.currentSessionId; });
      if (session) {
        session.completed = true;
        session.completedAt = new Date().toISOString();
        saveTodaySessions();
      }
    }
    
    // Play completion chime
    playChime();
    haptic('SUCCESS');
    
    // Close timer and show completion
    closeTimerScreen();
    showCompletionScreen();
  }

  // ═══ COMPLETION SCREEN ═══
  function showCompletionScreen() {
    if (DOM.completionOverlay) {
      DOM.completionOverlay.classList.add('active');
    }
    
    // Update stats
    var completed = state.todaySessions.filter(function(s) { return s.completed; }).length;
    var streak = calculateStreak();
    var duration = Math.floor(state.config.duration / 60);
    
    if (DOM.completionStatToday) DOM.completionStatToday.textContent = completed;
    if (DOM.completionStatStreak) DOM.completionStatStreak.textContent = streak;
    if (DOM.completionStatDuration) DOM.completionStatDuration.textContent = duration + 'm';
  }

  function closeCompletionScreen() {
    if (DOM.completionOverlay) {
      DOM.completionOverlay.classList.remove('active');
    }
    
    // Refresh UI
    renderStats();
    renderScheduleList();
    
    haptic('MEDIUM');
  }

  // ═══ NOTIFICATION SCHEDULING ═══
  function scheduleAllNotifications() {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.LocalNotifications) return;
    
    var LN = window.Capacitor.Plugins.LocalNotifications;
    
    // Cancel all existing Naam Abhyas notifications
    LN.getPending().then(function(result) {
      var pending = result.notifications || [];
      var toCancel = pending.filter(function(n) { 
        return n.id >= 90000 && n.id < 91000; 
      }).map(function(n) { return { id: n.id }; });
      
      if (toCancel.length > 0) {
        LN.cancel({ notifications: toCancel });
      }
    }).catch(function() {});
    
    if (!state.config.enabled) return;
    
    // Schedule new notifications
    var notifications = state.todaySessions.map(function(session, index) {
      var scheduleTime = new Date();
      scheduleTime.setHours(session.hour, session.minute, 0, 0);
      
      return {
        id: 90000 + index,
        title: '🙏 Naam Abhyas Time',
        body: 'It\'s time for your ' + Math.floor(state.config.duration / 60) + '-minute Naam Simran. Tap to begin.',
        schedule: {
          at: scheduleTime,
          allowWhileIdle: true,
          exact: true
        },
        channelId: 'naam_abhyas_v3',
        sound: 'default',
        smallIcon: 'ic_stat_notify',
        largeIcon: 'app_logo',
        extra: {
          action: 'start_naam_abhyas',
          sessionId: session.id,
          hour: session.hour,
          minute: session.minute
        }
      };
    });
    
    if (notifications.length > 0) {
      LN.schedule({ notifications: notifications }).catch(function(e) {
        console.error('Failed to schedule notifications:', e);
      });
    }
  }

  // ═══ NOTIFICATION HANDLER ═══
  function checkNotificationLaunch() {
    var url = new URL(window.location.href);
    var autoStart = url.searchParams.get('autoStart') === 'true';
    var hour = url.searchParams.get('hour');
    var minute = url.searchParams.get('minute');
    
    if (autoStart && hour !== null && minute !== null) {
      // Find the session
      var session = state.todaySessions.find(function(s) {
        return s.hour === parseInt(hour, 10) && s.minute === parseInt(minute, 10);
      });
      
      if (session && !session.completed) {
        // Start timer directly (no popup)
        setTimeout(function() {
          startTimerForSession(session);
        }, 300);
      }
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  // ═══ NAVIGATION ═══
  function goBack() {
    haptic('LIGHT');
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '../index.html';
    }
  }

  function openSettings() {
    haptic('LIGHT');
    window.location.href = 'naam-abhyas-settings.html';
  }

  // ═══ DOM & EVENT BINDINGS ═══
  function cacheDom() {
    DOM.scheduleList = document.getElementById('scheduleList');
    DOM.statsDate = document.getElementById('statsDate');
    DOM.statsPercent = document.getElementById('statsPercent');
    DOM.statCompleted = document.getElementById('statCompleted');
    DOM.statStreak = document.getElementById('statStreak');
    DOM.statTotal = document.getElementById('statTotal');
    DOM.timerOverlay = document.getElementById('timerOverlay');
    DOM.timerDisplay = document.getElementById('timerDisplay');
    DOM.timerOrb = document.querySelector('.na-orb');
    DOM.progressBar = document.getElementById('progressBar');
    DOM.startTimerBtn = document.getElementById('startTimerBtn');
    DOM.pauseTimerBtn = document.getElementById('pauseTimerBtn');
    DOM.closeTimerBtn = document.getElementById('closeTimerBtn');
    DOM.completionOverlay = document.getElementById('completionOverlay');
    DOM.completionStatToday = document.getElementById('completionStatToday');
    DOM.completionStatStreak = document.getElementById('completionStatStreak');
    DOM.completionStatDuration = document.getElementById('completionStatDuration');
    DOM.doneBtn = document.getElementById('doneBtn');
    DOM.toast = document.getElementById('toast');
  }

  function bindEvents() {
    var backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', goBack);
    
    var settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    
    if (DOM.closeTimerBtn) {
      DOM.closeTimerBtn.addEventListener('click', closeTimerScreen);
    }
    
    if (DOM.startTimerBtn) {
      DOM.startTimerBtn.addEventListener('click', startTimer);
    }
    
    if (DOM.pauseTimerBtn) {
      DOM.pauseTimerBtn.addEventListener('click', function() {
        if (state.timerRunning) {
          pauseTimer();
        } else {
          resumeTimer();
        }
      });
    }
    
    if (DOM.doneBtn) {
      DOM.doneBtn.addEventListener('click', closeCompletionScreen);
    }
  }

  // ═══ INITIALIZATION ═══
  function init() {
    cacheDom();
    loadConfig();
    loadTodaySessions();
    ensureTodaySessions();
    renderStats();
    renderScheduleList();
    bindEvents();
    checkNotificationLaunch();
    
    // Refresh every minute
    setInterval(function() {
      renderStats();
      renderScheduleList();
    }, 60000);
  }

  // ═══ BOOT ═══
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();
