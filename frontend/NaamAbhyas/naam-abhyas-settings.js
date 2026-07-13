/**
 * NAAM ABHYAS SETTINGS — Configuration Manager
 * ══════════════════════════════════════════════════════════════════
 * Handles all settings for Naam Abhyas feature
 * ══════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     CONSTANTS
  ───────────────────────────────────────────────── */
  var SETTINGS_KEY = 'naam_abhyas_settings_v2';
  var DEFAULTS = {
    enabled: true,
    timeRange: {
      start: 5,
      end: 22
    },
    duration: 120, // seconds
    customDuration: null,
    sound: 'gentle-chime',
    theme: 'auto',
    autoStart: true,
    vibration: true,
    randomTiming: true
  };

  /* ─────────────────────────────────────────────────
     DOM REFERENCES
  ───────────────────────────────────────────────── */
  var DOM = {};

  /* ─────────────────────────────────────────────────
     UTILITIES
  ───────────────────────────────────────────────── */
  function getSettings() {
    try {
      var stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        var settings = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return Object.assign({}, DEFAULTS, settings);
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  }

  function showToast(message) {
    if (!DOM.toast) return;
    DOM.toast.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(function () {
      DOM.toast.classList.remove('show');
    }, 2500);
  }

  function haptic(style) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: style || 'MEDIUM' }).catch(function () {});
      }
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────
     POPULATE TIME SELECTS
  ───────────────────────────────────────────────── */
  function populateTimeSelects() {
    var settings = getSettings();
    
    // Clear and populate start hour
    DOM.startHourSelect.innerHTML = '';
    for (var h = 0; h <= 23; h++) {
      var opt = document.createElement('option');
      opt.value = h;
      var per = h >= 12 ? 'PM' : 'AM';
      var h12 = h % 12 || 12;
      opt.textContent = h12 + ':00 ' + per;
      if (h === settings.timeRange.start) opt.selected = true;
      DOM.startHourSelect.appendChild(opt);
    }

    // Clear and populate end hour
    DOM.endHourSelect.innerHTML = '';
    for (var h2 = 0; h2 <= 23; h2++) {
      var opt2 = document.createElement('option');
      opt2.value = h2;
      var per2 = h2 >= 12 ? 'PM' : 'AM';
      var h122 = h2 % 12 || 12;
      opt2.textContent = h122 + ':00 ' + per2;
      if (h2 === settings.timeRange.end) opt2.selected = true;
      DOM.endHourSelect.appendChild(opt2);
    }
  }

  /* ─────────────────────────────────────────────────
     LOAD SETTINGS INTO UI
  ───────────────────────────────────────────────── */
  function loadSettings() {
    var settings = getSettings();

    // Master toggle
    DOM.masterToggle.checked = settings.enabled;

    // Time range
    populateTimeSelects();

    // Duration
    if (settings.duration === 60) DOM.durationSelect.value = '60';
    else if (settings.duration === 120) DOM.durationSelect.value = '120';
    else if (settings.duration === 180) DOM.durationSelect.value = '180';
    else if (settings.duration === 300) DOM.durationSelect.value = '300';
    else if (settings.duration === 600) DOM.durationSelect.value = '600';
    else if (settings.duration === 900) DOM.durationSelect.value = '900';
    else {
      DOM.durationSelect.value = 'custom';
      if (DOM.customMinutes) DOM.customMinutes.value = Math.floor(settings.duration / 60);
      showCustomDurationInput();
    }

    // Sound
    var soundRadios = document.querySelectorAll('input[name="sound"]');
    soundRadios.forEach(function (radio) {
      if (radio.value === settings.sound) {
        radio.checked = true;
      }
    });

    // Theme
    var themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(function (radio) {
      if (radio.value === settings.theme) {
        radio.checked = true;
      }
    });

    // Toggles
    DOM.autoStartToggle.checked = settings.autoStart;
    DOM.vibrationToggle.checked = settings.vibration;
    DOM.randomTimingToggle.checked = settings.randomTiming;
  }

  /* ─────────────────────────────────────────────────
     COLLECT SETTINGS FROM UI
  ───────────────────────────────────────────────── */
  function collectSettings() {
    var duration = parseInt(DOM.durationSelect.value, 10);
    if (DOM.durationSelect.value === 'custom' && DOM.customMinutes) {
      duration = parseInt(DOM.customMinutes.value, 10) * 60;
    }

    var selectedSound = 'gentle-chime';
    var soundRadios = document.querySelectorAll('input[name="sound"]');
    soundRadios.forEach(function (radio) {
      if (radio.checked) selectedSound = radio.value;
    });

    var selectedTheme = 'auto';
    var themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(function (radio) {
      if (radio.checked) selectedTheme = radio.value;
    });

    return {
      enabled: DOM.masterToggle.checked,
      timeRange: {
        start: parseInt(DOM.startHourSelect.value, 10),
        end: parseInt(DOM.endHourSelect.value, 10)
      },
      duration: duration,
      customDuration: DOM.durationSelect.value === 'custom' ? duration : null,
      sound: selectedSound,
      theme: selectedTheme,
      autoStart: DOM.autoStartToggle.checked,
      vibration: DOM.vibrationToggle.checked,
      randomTiming: DOM.randomTimingToggle.checked
    };
  }

  /* ─────────────────────────────────────────────────
     CUSTOM DURATION INPUT
  ───────────────────────────────────────────────── */
  function showCustomDurationInput() {
    if (DOM.customDurationInput) {
      DOM.customDurationInput.style.display = 'flex';
    }
  }

  function hideCustomDurationInput() {
    if (DOM.customDurationInput) {
      DOM.customDurationInput.style.display = 'none';
    }
  }

  /* ─────────────────────────────────────────────────
     SOUND PREVIEW
  ───────────────────────────────────────────────── */
  var currentAudio = null;
  function previewSound(soundName) {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    // Map sound names to audio files
    var soundMap = {
      'gentle-chime': '../Audio/audio1.mp3',
      'soft-bell': '../Audio/audio2.mp3',
      'singing-bowl': '../Audio/audio3.mpeg',
      'peaceful-harp': '../Audio/audio4.mpeg'
    };

    var audioFile = soundMap[soundName];
    if (!audioFile) return;

    currentAudio = new Audio(audioFile);
    currentAudio.volume = 0.7;
    currentAudio.play().catch(function () {
      showToast('Could not play sound preview');
    });

    haptic('LIGHT');
  }

  /* ─────────────────────────────────────────────────
     APPLY THEME
  ───────────────────────────────────────────────── */
  function applyTheme(theme) {
    var effective = theme;
    if (theme === 'auto') {
      var h = new Date().getHours();
      effective = (h >= 5 && h < 20) ? 'light' : 'dark';
    }
    
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.style.backgroundColor = effective === 'dark' ? '#08080F' : '#FAF8F5';
    
    if (effective === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Also save to global theme if it exists
    localStorage.setItem('naam_abhyas_theme', theme);
  }

  /* ─────────────────────────────────────────────────
     SAVE SETTINGS
  ───────────────────────────────────────────────── */
  function handleSave() {
    var settings = collectSettings();

    // Validation
    if (settings.timeRange.start >= settings.timeRange.end) {
      showToast('⚠️ Start time must be before end time');
      return;
    }

    if (settings.duration < 60 || settings.duration > 3600) {
      showToast('⚠️ Duration must be between 1 and 60 minutes');
      return;
    }

    // Save
    DOM.saveBtn.classList.add('saving');
    DOM.saveBtn.textContent = 'Saving...';

    var saved = saveSettings(settings);
    
    if (saved) {
      // Apply theme
      applyTheme(settings.theme);

      // Regenerate schedule with random times
      generateRandomSchedule(settings);

      // Reschedule notifications if on native platform
      rescheduleNotifications();

      haptic('MEDIUM');
      showToast('✅ Settings saved successfully!');

      setTimeout(function () {
        DOM.saveBtn.classList.remove('saving');
        DOM.saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Save Settings';
        
        // Navigate back after a short delay
        setTimeout(function () {
          goBack();
        }, 800);
      }, 500);
    } else {
      DOM.saveBtn.classList.remove('saving');
      DOM.saveBtn.textContent = 'Save Settings';
      showToast('❌ Failed to save settings');
    }
  }

  /* ─────────────────────────────────────────────────
     GENERATE RANDOM SCHEDULE
  ───────────────────────────────────────────────── */
  function generateRandomSchedule(settings) {
    if (!settings.randomTiming) return;

    var times = [];
    var hourRange = settings.timeRange.end - settings.timeRange.start + 1;

    for (var i = 0; i < hourRange; i++) {
      var hour = settings.timeRange.start + i;
      if (hour > settings.timeRange.end) break;
      
      // Generate random minute between 0-59
      var minute = Math.floor(Math.random() * 60);
      
      times.push({
        hour: hour,
        minute: minute,
        enabled: true
      });
    }

    // Save generated schedule
    try {
      localStorage.setItem('naam_abhyas_generated_schedule', JSON.stringify(times));
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────
     RESCHEDULE NOTIFICATIONS
  ───────────────────────────────────────────────── */
  function rescheduleNotifications() {
    // Trigger notification rescheduling if available
    try {
      if (window.__anhadGlobalScheduler && typeof window.__anhadGlobalScheduler.scheduleAll === 'function') {
        window.__anhadGlobalScheduler.scheduleAll();
      }
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────
     BACK NAVIGATION
  ───────────────────────────────────────────────── */
  function goBack() {
    haptic('LIGHT');
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'naam-abhyas.html';
    }
  }

  /* ─────────────────────────────────────────────────
     DOM INIT & EVENT BINDINGS
  ───────────────────────────────────────────────── */
  function cacheDom() {
    DOM.backBtn = document.getElementById('backBtn');
    DOM.masterToggle = document.getElementById('masterToggle');
    DOM.startHourSelect = document.getElementById('startHourSelect');
    DOM.endHourSelect = document.getElementById('endHourSelect');
    DOM.durationSelect = document.getElementById('durationSelect');
    DOM.customDurationInput = document.getElementById('customDurationInput');
    DOM.customMinutes = document.getElementById('customMinutes');
    DOM.autoStartToggle = document.getElementById('autoStartToggle');
    DOM.vibrationToggle = document.getElementById('vibrationToggle');
    DOM.randomTimingToggle = document.getElementById('randomTimingToggle');
    DOM.saveBtn = document.getElementById('saveBtn');
    DOM.toast = document.getElementById('toast');
  }

  function bindEvents() {
    if (DOM.backBtn) {
      DOM.backBtn.addEventListener('click', goBack);
    }

    if (DOM.saveBtn) {
      DOM.saveBtn.addEventListener('click', handleSave);
    }

    // Duration select change
    if (DOM.durationSelect) {
      DOM.durationSelect.addEventListener('change', function () {
        if (this.value === 'custom') {
          showCustomDurationInput();
        } else {
          hideCustomDurationInput();
        }
      });
    }

    // Sound preview buttons
    document.querySelectorAll('.sound-preview').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var soundName = this.getAttribute('data-sound');
        previewSound(soundName);
      });
    });

    // Theme change
    document.querySelectorAll('input[name="theme"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (this.checked) {
          applyTheme(this.value);
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────────── */
  function boot() {
    cacheDom();
    loadSettings();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
