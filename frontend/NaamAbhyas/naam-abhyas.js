/**
 * NAAM ABHYAS — Single Timer Engine
 * ══════════════════════════════════════════════════════════════════
 * Architecture:
 *   1. NaamAbhyasManager (lib) = single source of truth for launch context
 *   2. This file = single countdown engine, never spawns duplicate intervals
 *   3. ONE visibility listener to handle background/foreground
 *   4. Completion recorded ONCE via manager.completeSession()
 *
 * Rules:
 *   - Never read localStorage for launch context (manager owns that)
 *   - Never create more than one interval / requestAnimationFrame loop
 *   - Never re-navigate or duplicate complete
 * ══════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────────── */
  var SESSION_DURATION_SECONDS = 120; // 2 minutes default

  /* ─────────────────────────────────────────────────
     DOM REFERENCES — set once after DOMContentLoaded
  ───────────────────────────────────────────────── */
  var DOM = {};
  var _startBtnSwapped = false;

  /* ─────────────────────────────────────────────────
     TIMER STATE — single canonical object
  ───────────────────────────────────────────────── */
  var state = {
    phase: 'idle',          // idle | running | paused | done
    totalSeconds: SESSION_DURATION_SECONDS,
    remainingMs: SESSION_DURATION_SECONDS * 1000,
    startedAt: null,        // wall clock when last resumed
    pausedAt: null,
    launchContext: null,    // resolved once from manager
    completed: false,       // guard against double-complete
    intervalId: null        // ONE interval id
  };

  /* ─────────────────────────────────────────────────
     UTILITY
  ───────────────────────────────────────────────── */
  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

  function formatTime(ms) {
    var totalSec = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return pad(m) + ':' + pad(s);
  }

  function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ─────────────────────────────────────────────────
     HAPTICS — thin wrapper, fail-safe
  ───────────────────────────────────────────────── */
  function haptic(style) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: style || 'MEDIUM' }).catch(function () {});
      }
    } catch (e) {}
  }

  function hapticSuccess() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' }).catch(function () {});
      }
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────
     TOAST
  ───────────────────────────────────────────────── */
  var toastTimer = null;
  function showToast(msg, durationMs) {
    var el = DOM.toast;
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, durationMs || 2500);
  }

  /* ─────────────────────────────────────────────────
     AUDIO CHIME
  ───────────────────────────────────────────────── */
  function playChime(type) {
    // Gentle audio cue — uses Web Audio API oscillator so no file needed
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, ctx.currentTime);        // A love freq
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'complete') {
        // Three ascending tones
        [0, 0.3, 0.6].forEach(function (offset, i) {
          var o2 = ctx.createOscillator();
          var g2 = ctx.createGain();
          o2.connect(g2);
          g2.connect(ctx.destination);
          o2.type = 'sine';
          var freqs = [528, 660, 792];
          o2.frequency.setValueAtTime(freqs[i], ctx.currentTime + offset);
          g2.gain.setValueAtTime(0, ctx.currentTime + offset);
          g2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + offset + 0.05);
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.6);
          o2.start(ctx.currentTime + offset);
          o2.stop(ctx.currentTime + offset + 0.6);
        });
      }
    } catch (e) { /* audio not critical */ }
  }

  /* ─────────────────────────────────────────────────
     STARS BACKGROUND GENERATOR
  ───────────────────────────────────────────────── */
  function generateStars() {
    var container = DOM.stars;
    if (!container) return;
    var count = 40;
    for (var i = 0; i < count; i++) {
      var star = document.createElement('div');
      star.className = 'na-star';
      var size = Math.random() * 2 + 1;
      star.style.cssText = [
        'width:' + size + 'px',
        'height:' + size + 'px',
        'left:' + (Math.random() * 100) + '%',
        'top:' + (Math.random() * 100) + '%',
        '--dur:' + (2 + Math.random() * 4) + 's',
        '--delay:' + (Math.random() * 4) + 's',
        '--opA:' + (0.05 + Math.random() * 0.15),
        '--opB:' + (0.3 + Math.random() * 0.4)
      ].join(';');
      container.appendChild(star);
    }
  }

  /* ─────────────────────────────────────────────────
     PROGRESS RING
  ───────────────────────────────────────────────── */
  function updateProgressRing(remainingMs) {
    var fill = DOM.progressFill;
    if (!fill) return;
    var total = state.totalSeconds * 1000;
    var ratio = Math.max(0, Math.min(1, remainingMs / total));
    var r = 76; // radius matches SVG in HTML
    var circumference = 2 * Math.PI * r;
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference * (1 - ratio);
  }

  /* ─────────────────────────────────────────────────
     TIMER DISPLAY UPDATE
  ───────────────────────────────────────────────── */
  function renderTimer(ms) {
    var timeStr = formatTime(ms);
    if (DOM.timerDisplay) {
      DOM.timerDisplay.textContent = timeStr;
      if (ms <= 15000) {
        DOM.timerDisplay.classList.add('urgent');
      } else {
        DOM.timerDisplay.classList.remove('urgent');
      }
    }
    updateProgressRing(ms);
  }

  /* ─────────────────────────────────────────────────
     THE ONE AND ONLY TICK ENGINE
     Never call startTicking() more than once.
     Guard: state.intervalId
  ───────────────────────────────────────────────── */
  function startTicking() {
    if (state.intervalId !== null) return; // already ticking

    state.startedAt = Date.now();

    state.intervalId = setInterval(function () {
      if (state.phase !== 'running') return;

      var elapsed = Date.now() - state.startedAt;
      var remaining = state.remainingMs - elapsed;

      if (remaining <= 0) {
        remaining = 0;
        renderTimer(0);
        stopTicking();
        onTimerComplete();
      } else {
        renderTimer(remaining);
      }
    }, 250);
  }

  function stopTicking() {
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  /* ─────────────────────────────────────────────────
     START / PAUSE / RESUME
  ───────────────────────────────────────────────── */
  function startTimer() {
    if (state.phase !== 'idle' && state.phase !== 'paused') return;

    if (state.phase === 'idle') {
      state.remainingMs = state.totalSeconds * 1000;
      renderTimer(state.remainingMs);
      if (DOM.orbEl) DOM.orbEl.classList.add('breathing');
      // Swap Start button → Pause button
      if (!_startBtnSwapped) {
        _startBtnSwapped = true;
        if (DOM.startBtn) DOM.startBtn.style.display = 'none';
        if (DOM.pauseBtn) DOM.pauseBtn.style.display = 'flex';
        window.dispatchEvent(new CustomEvent('naamTimerStarted'));
      }
    }

    state.phase = 'running';
    state.startedAt = Date.now();
    updatePlayPauseBtn(false);
    hidePauseIndicator();
    startTicking();
  }

  function pauseTimer() {
    if (state.phase !== 'running') return;
    var elapsed = Date.now() - state.startedAt;
    state.remainingMs = Math.max(0, state.remainingMs - elapsed);
    state.phase = 'paused';
    stopTicking();
    updatePlayPauseBtn(true);
    showPauseIndicator();
    haptic('LIGHT');
  }

  function resumeTimer() {
    if (state.phase !== 'paused') return;
    state.phase = 'running';
    state.startedAt = Date.now();
    startTicking();
    updatePlayPauseBtn(false);
    hidePauseIndicator();
  }

  function togglePause() {
    if (state.phase === 'running') pauseTimer();
    else if (state.phase === 'paused') resumeTimer();
  }

  /* ─────────────────────────────────────────────────
     UI STATE HELPERS
  ───────────────────────────────────────────────── */
  function updatePlayPauseBtn(isPaused) {
    if (!DOM.pauseBtn) return;
    DOM.pauseBtn.innerHTML = isPaused
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/></svg>';
  }

  function showPauseIndicator() {
    if (DOM.pauseIndicator) DOM.pauseIndicator.classList.add('visible');
  }
  function hidePauseIndicator() {
    if (DOM.pauseIndicator) DOM.pauseIndicator.classList.remove('visible');
  }

  /* ─────────────────────────────────────────────────
     COMPLETION
  ───────────────────────────────────────────────── */
  function onTimerComplete() {
    if (state.completed) return;
    state.completed = true;
    state.phase = 'done';
    stopTicking();

    if (DOM.orbEl) DOM.orbEl.classList.remove('breathing');

    playChime('complete');
    hapticSuccess();

    // Record the session ONCE via manager
    recordSessionCompletion();

    // Show completion screen
    setTimeout(function () {
      showCompletionScreen();
    }, 400);
  }

  function recordSessionCompletion() {
    try {
      var manager = window.NaamAbhyasManager;
      if (!manager || typeof manager.completeSession !== 'function') return;

      var ctx = state.launchContext;
      manager.completeSession({
        endedAt: new Date(),
        durationSeconds: state.totalSeconds,
        sessionId: ctx && ctx.session && ctx.session.id ? ctx.session.id : null,
        hour: ctx && ctx.hour !== null ? ctx.hour : undefined,
        minute: ctx && ctx.minute !== null ? ctx.minute : undefined
      });
    } catch (e) {
      console.warn('[NaamAbhyas] Session record failed:', e);
    }
  }

  /* ─────────────────────────────────────────────────
     COMPLETION SCREEN
  ───────────────────────────────────────────────── */
  function showCompletionScreen() {
    // Transition screens
    if (DOM.timerScreen) DOM.timerScreen.classList.add('hidden');
    if (DOM.completionScreen) {
      DOM.completionScreen.classList.remove('hidden');
      DOM.completionScreen.style.display = 'flex';
    }

    // Populate stats
    var stats = computeStats();
    if (DOM.statToday) DOM.statToday.textContent = stats.todayCount;
    if (DOM.statStreak) DOM.statStreak.textContent = stats.streak;
    if (DOM.statDuration) DOM.statDuration.textContent = Math.round(state.totalSeconds / 60) + 'm';

    // Confetti
    launchConfetti();
  }

  function computeStats() {
    var todayCount = 0;
    var streak = 0;
    try {
      var manager = window.NaamAbhyasManager;
      if (!manager) throw new Error('no manager');

      var today = new Date().toLocaleDateString('en-CA');
      var records = JSON.parse(localStorage.getItem(manager.KEYS.records) || '{}');
      var extras = JSON.parse(localStorage.getItem(manager.KEYS.extras) || '[]');
      var history = JSON.parse(localStorage.getItem(manager.KEYS.history) || '{}');

      // Count today's completed scheduled sessions
      var todayScheduled = Object.values(records).filter(function (r) {
        return r && r.completedAt && r.completedAt.startsWith(today);
      }).length;

      // Count today's extras
      var todayExtras = (Array.isArray(extras) ? extras : []).filter(function (r) {
        return r && r.completedAt && r.completedAt.startsWith(today);
      }).length;

      todayCount = todayScheduled + todayExtras;

      // Streak: how many consecutive days have at least one session
      var date = new Date();
      var streakCount = 0;
      for (var i = 0; i < 365; i++) {
        var d = date.toLocaleDateString('en-CA');
        var hasSession = (history[d] && Object.keys(history[d]).length > 0);
        if (i === 0 && !hasSession) { break; } // today might be the first
        if (!hasSession && i > 0) break;
        if (hasSession) streakCount++;
        date.setDate(date.getDate() - 1);
      }
      streak = streakCount;
    } catch (e) {
      todayCount = 1;
      streak = 0;
    }
    return { todayCount: todayCount || 1, streak: streak };
  }

  /* ─────────────────────────────────────────────────
     CONFETTI
  ───────────────────────────────────────────────── */
  function launchConfetti() {
    var layer = DOM.confettiLayer;
    if (!layer) return;
    var colors = ['#FF9500', '#F7C634', '#FFFFFF', '#FF6B35', '#FFB347'];
    var count = 55;
    for (var i = 0; i < count; i++) {
      (function (idx) {
        setTimeout(function () {
          var el = document.createElement('div');
          el.className = 'na-confetto';
          var w = Math.random() * 8 + 4;
          var h = Math.random() * 6 + 3;
          var color = colors[Math.floor(Math.random() * colors.length)];
          el.style.cssText = [
            'left:' + (Math.random() * 100) + '%',
            'width:' + w + 'px',
            'height:' + h + 'px',
            'background:' + color,
            'opacity:' + (0.7 + Math.random() * 0.3),
            '--dur:' + (2 + Math.random() * 1.5) + 's',
            '--delay:' + (Math.random() * 0.3) + 's',
            '--drift:' + ((Math.random() - 0.5) * 120) + 'px',
            '--spin:' + (Math.random() * 720 - 360) + 'deg'
          ].join(';');
          layer.appendChild(el);
          setTimeout(function () { el.remove(); }, 4000);
        }, idx * 30);
      })(i);
    }
  }

  /* ─────────────────────────────────────────────────
     BACKGROUND / FOREGROUND HANDLING
     Explicitly handles visibility, Cordova resume, and Capacitor App state changes
  ───────────────────────────────────────────────── */
  function handleAppResume() {
    if (state.phase === 'running') {
      var elapsed = Date.now() - state.startedAt;
      var remaining = Math.max(0, state.remainingMs - elapsed);
      renderTimer(remaining);

      // Reset startedAt to now, and remainingMs to the new offset
      state.startedAt = Date.now();
      state.remainingMs = remaining;

      if (state.intervalId === null) {
        startTicking();
      }
    }
  }

  function handleAppPause() {
    if (state.phase === 'running') {
      // Correct remainingMs before suspension
      var elapsed = Date.now() - state.startedAt;
      state.remainingMs = Math.max(0, state.remainingMs - elapsed);
      state.startedAt = Date.now();
    }
  }

  function setupVisibilityListener() {
    if (window.__naamAbhyasVisibilityInstalled) return;
    window.__naamAbhyasVisibilityInstalled = true;

    // 1. HTML5 visibility change
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        handleAppResume();
      } else {
        handleAppPause();
      }
    });

    // 2. Cordova/Capacitor standard resume & pause document events
    document.addEventListener('resume', handleAppResume);
    document.addEventListener('pause', handleAppPause);

    // 3. Capacitor Native App plugin state changes
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('appStateChange', function (s) {
          if (s.isActive) {
            handleAppResume();
          } else {
            handleAppPause();
          }
        });
      }
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────
     NAVIGATION — resolve launch context from manager
  ───────────────────────────────────────────────── */
  function resolveLaunchContext() {
    try {
      var manager = window.NaamAbhyasManager;
      if (manager && typeof manager.getLaunchContext === 'function') {
        return manager.getLaunchContext();
      }
    } catch (e) {}

    // Fallback: read URL params directly
    try {
      var url = new URL(window.location.href);
      var autoStart = url.searchParams.get('autoStart') === 'true';
      if (!autoStart) return null;
      return {
        autoStart: true,
        source: 'url',
        hour: url.searchParams.get('hour'),
        minute: url.searchParams.get('minute'),
        session: null
      };
    } catch (e) { return null; }
  }

  /* ─────────────────────────────────────────────────
     POPULATE SESSION CHIP
  ───────────────────────────────────────────────── */
  function populateSessionInfo(ctx) {
    if (!ctx) return;
    var hour = ctx.hour !== null && ctx.hour !== undefined ? Number(ctx.hour) : null;
    var minute = ctx.minute !== null && ctx.minute !== undefined ? Number(ctx.minute) : null;

    if (hour !== null && Number.isFinite(hour)) {
      var per = hour >= 12 ? 'PM' : 'AM';
      var h12 = hour % 12 || 12;
      var mStr = minute !== null && Number.isFinite(minute) ? String(minute).padStart(2, '0') : '00';
      var timeStr = h12 + ':' + mStr + ' ' + per;
      if (DOM.sessionTimeChip) DOM.sessionTimeChip.textContent = timeStr;
    } else {
      if (DOM.sessionTimeChip) DOM.sessionTimeChip.textContent = 'Extra Session';
    }

    if (ctx.source === 'notification') {
      if (DOM.sessionTypeChip) DOM.sessionTypeChip.textContent = '🔔 Scheduled';
    }
  }

  /* ─────────────────────────────────────────────────
     BACK NAVIGATION
  ───────────────────────────────────────────────── */
  var lastBackPress = 0;
  function handlePhysicalBack() {
    if (state.phase === 'running') {
      pauseTimer();
      showToast('⏸ Paused — tap back again to leave');
      var now = Date.now();
      if (now - lastBackPress < 2000) {
        goBack();
      } else {
        lastBackPress = now;
      }
    } else {
      goBack();
    }
  }

  function goBack() {
    window.__anhadBackOverride = null;
    stopTicking();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '../index.html';
    }
  }

  function onDone() {
    window.__anhadBackOverride = null;
    haptic('MEDIUM');
    goBack();
  }

  /* ─────────────────────────────────────────────────
     SUBSCRIPTION TO MANAGER LAUNCH EVENT
     Handles warm-start when page is already open
  ───────────────────────────────────────────────── */
  function subscribeToLaunchEvent() {
    window.addEventListener('naamAbhyasLaunchReady', function (e) {
      var ctx = e && e.detail;
      if (!ctx || state.phase !== 'idle') return;
      state.launchContext = ctx;
      populateSessionInfo(ctx);
      if (ctx.autoStart) {
        setTimeout(function () { startTimer(); playChime('start'); }, 300);
      }
    }, { once: true });

    // Also handle foreground alarm event
    window.addEventListener('naamAbhyasAlarmFired', function (e) {
      if (state.phase === 'running' || state.phase === 'done') return;
      if (e && e.detail) {
        state.launchContext = state.launchContext || {
          autoStart: true,
          source: 'notification',
          hour: e.detail.hour,
          minute: e.detail.minute,
          session: null
        };
        populateSessionInfo(state.launchContext);
      }
      if (state.phase === 'idle') {
        startTimer();
        playChime('start');
      } else if (state.phase === 'paused') {
        resumeTimer();
      }
    });
  }

  /* ─────────────────────────────────────────────────
     DOM INIT
  ───────────────────────────────────────────────── */
  function cacheDom() {
    DOM.timerScreen      = document.getElementById('naTimerScreen');
    DOM.completionScreen = document.getElementById('naCompletionScreen');
    DOM.timerDisplay     = document.getElementById('naTimerDisplay');
    DOM.pauseBtn         = document.getElementById('naPauseBtn');
    DOM.startBtn         = document.getElementById('naStartBtn');
    DOM.backBtn          = document.getElementById('naBackBtn');
    DOM.doneBtn          = document.getElementById('naDoneBtn');
    DOM.orbEl            = document.getElementById('naOrb');
    DOM.progressFill     = document.getElementById('naProgressFill');
    DOM.pauseIndicator   = document.getElementById('naPauseIndicator');
    DOM.toast            = document.getElementById('naToast');
    DOM.stars            = document.getElementById('naStars');
    DOM.confettiLayer    = document.getElementById('naConfettiLayer');
    DOM.sessionTimeChip  = document.getElementById('naSessionTimeChip');
    DOM.sessionTypeChip  = document.getElementById('naSessionTypeChip');
    DOM.statToday        = document.getElementById('naStatToday');
    DOM.statStreak       = document.getElementById('naStatStreak');
    DOM.statDuration     = document.getElementById('naStatDuration');
  }

  function bindEvents() {
    if (DOM.backBtn) DOM.backBtn.addEventListener('click', function () {
      if (state.phase === 'running') {
        pauseTimer();
        showToast('⏸ Paused — tap back again to leave');
        // Second tap within 2s actually leaves
        var taps = (DOM.backBtn._taps || 0) + 1;
        DOM.backBtn._taps = taps;
        setTimeout(function () { if (DOM.backBtn._taps === taps) DOM.backBtn._taps = 0; }, 2000);
        if (taps >= 2) { goBack(); }
      } else {
        goBack();
      }
    });

    if (DOM.pauseBtn) DOM.pauseBtn.addEventListener('click', function () {
      togglePause();
      haptic('LIGHT');
    });

    if (DOM.startBtn) DOM.startBtn.addEventListener('click', function () {
      if (state.phase === 'idle') {
        playChime('start');
        startTimer();
      }
    });

    if (DOM.doneBtn) DOM.doneBtn.addEventListener('click', onDone);
  }

  /* ─────────────────────────────────────────────────
     BOOT — called once after DOM ready
  ───────────────────────────────────────────────── */
  function boot() {
    cacheDom();
    generateStars();
    bindEvents();
    setupVisibilityListener();
    subscribeToLaunchEvent();
    window.__anhadBackOverride = handlePhysicalBack;

    // Initialise timer display
    renderTimer(state.totalSeconds * 1000);
    updateProgressRing(state.totalSeconds * 1000);
    updatePlayPauseBtn(false);

    // Resolve launch context
    var ctx = resolveLaunchContext();
    if (ctx) {
      state.launchContext = ctx;
      populateSessionInfo(ctx);
      if (ctx.autoStart) {
        // Small delay so page has painted before chime + animation
        setTimeout(function () {
          playChime('start');
          startTimer();
        }, 500);
      }
    }

    // Fire manager's auto-bridge (in case it loaded after this script)
    if (window.NaamAbhyasManager && typeof window.NaamAbhyasManager.installAutoBridge === 'function') {
      window.NaamAbhyasManager.installAutoBridge();
    }
  }

  /* ─────────────────────────────────────────────────
     ENTRY POINT
  ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
