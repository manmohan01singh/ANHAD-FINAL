/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART REMINDERS v7.0 - UNIFIED CONTROLLER
 * 
 * Features:
 * ✅ Stable, predictable UI
 * ✅ Reliable background alarm handling
 * ✅ Bidirectional Nitnem Tracker sync
 * ✅ Robust error handling
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ════════════════════════════════════════════════════════════════════════════
  
  const CONFIG = {
    version: '7.0.0',
    storage: {
      reminders: 'sr_reminders_v7',
      settings: 'sr_settings_v7',
      stats: 'sr_stats_v7',
      alarmLog: 'nitnemTracker_alarmLog'
    },
    sync: {
      nitnemChannel: 'gurbani-nitnem-sync',
      reminderChannel: 'gurbani-reminder-sync'
    },
    audio: {
      basePath: (() => {
        const loc = window.location;
        if (loc.protocol === 'file:' || (window.Capacitor && window.Capacitor.isNative)) {
          return '../Audio/';
        }
        if (loc.pathname.includes('/reminders/')) {
          return '../Audio/';
        }
        return './Audio/';
      })(),
      files: {
        'audio1': 'audio1.mp3',
        'audio2': 'audio2.mp3',
        'audio3': 'audio3.mpeg',
        'audio4': 'audio4.mpeg',
        'audio5': 'audio5.mpeg',
        'audio6': 'audio6.mpeg'
      }
    },
    defaults: {
      amritvela: { time: '04:00', tone: 'audio1', icon: '🌅', color: '#FFD60A' },
      rehras: { time: '18:30', tone: 'audio3', icon: '🌆', color: '#FF9500' },
      sohila: { time: '21:30', tone: 'audio4', icon: '🌙', color: '#AF52DE' }
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════

  const State = {
    reminders: null,
    settings: null,
    stats: null,
    currentEditId: null,
    audioPlayer: null,
    nextAlarmTimeout: null,
    countdownInterval: null,
    isModalOpen: false,
    broadcastChannel: null,
    isOnline: navigator.onLine
  };

  // ════════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════

  const Utils = {
    generateId() {
      return 'alarm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    },

    formatTime12(time24) {
      const [h, m] = time24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return { hour: hour.toString().padStart(2, '0'), min: m.toString().padStart(2, '0'), period };
    },

    formatTime24(hour, min, period) {
      let h = parseInt(hour);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}:${min.padStart(2, '0')}`;
    },

    getNextOccurrence(time24, days = [0, 1, 2, 3, 4, 5, 6]) {
      const now = new Date();
      const [h, m] = time24.split(':').map(Number);
      const next = new Date();
      next.setHours(h, m, 0, 0);

      const today = now.getDay();
      let daysUntil = 0;
      
      // Find next valid day
      while (!days.includes((today + daysUntil) % 7)) {
        daysUntil++;
      }

      if (daysUntil === 0 && next <= now) {
        daysUntil = 1;
        while (!days.includes((today + daysUntil) % 7)) {
          daysUntil++;
        }
      }

      next.setDate(now.getDate() + daysUntil);
      return next;
    },

    getCountdown(targetDate) {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) return { value: 0, unit: 'now', text: 'Now' };

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return { 
          value: hours, 
          unit: hours === 1 ? 'hr' : 'hrs',
          text: `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${minutes} min`
        };
      }
      return { 
        value: minutes, 
        unit: minutes === 1 ? 'min' : 'mins',
        text: `${minutes} minutes`
      };
    },

    getDayNames(days) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (days.length === 7) return 'Every day';
      if (days.length === 0) return 'Never';
      if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays';
      if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
      return days.map(d => dayNames[d]).join(', ');
    },

    today() {
      return new Date().toLocaleDateString('en-CA');
    },

    debounce(fn, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          fn(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // STORAGE MANAGER
  // ════════════════════════════════════════════════════════════════════════════

  const Storage = {
    get(key, defaults = null) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaults;
      } catch (e) {
        console.error('[Storage] Get error:', e);
        return defaults;
      }
    },

    set(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('[Storage] Set error:', e);
        return false;
      }
    },

    // Migrate from older versions
    migrate() {
      const oldKeys = ['sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'];
      let migrated = false;

      for (const key of oldKeys) {
        const oldData = this.get(key);
        if (oldData) {
          const newData = this.convertToV7(oldData);
          if (newData) {
            this.set(CONFIG.storage.reminders, newData);
            migrated = true;
            console.log('[Storage] Migrated from', key);
            break;
          }
        }
      }

      return migrated;
    },

    convertToV7(oldData) {
      try {
        // Handle v4 format (object with core/custom)
        if (oldData.core || oldData.custom) {
          return {
            core: this.convertReminders(oldData.core || {}),
            custom: Array.isArray(oldData.custom) ? oldData.custom.map(r => this.convertReminder(r)) : []
          };
        }
        // Handle array format
        if (Array.isArray(oldData)) {
          const core = {};
          const custom = [];
          oldData.forEach(r => {
            const converted = this.convertReminder(r);
            if (['amritvela', 'rehras', 'sohila'].includes(r.id)) {
              core[r.id] = converted;
            } else {
              custom.push(converted);
            }
          });
          return { core, custom };
        }
      } catch (e) {
        console.error('[Storage] Migration error:', e);
      }
      return null;
    },

    convertReminders(reminders) {
      const result = {};
      Object.entries(reminders).forEach(([key, r]) => {
        result[key] = this.convertReminder(r);
      });
      return result;
    },

    convertReminder(r) {
      return {
        id: r.id || Utils.generateId(),
        type: r.type || 'custom',
        label: r.label || r.title || 'Alarm',
        gurmukhi: r.gurmukhi || '',
        time: r.time || '08:00',
        enabled: r.enabled !== false,
        days: r.days || [0, 1, 2, 3, 4, 5, 6],
        tone: r.tone || 'audio1',
        snooze: r.snooze || 10,
        nitnemSync: r.nitnemSync !== false,
        icon: r.icon || '🔔',
        color: r.color || '#007AFF'
      };
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // HAPTICS
  // ════════════════════════════════════════════════════════════════════════════

  const Haptic = {
    enabled: true,

    tap() {
      if (this.enabled) {
        if (window.CapacitorHaptics) {
          window.CapacitorHaptics.impact('light');
        } else if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    },

    success() {
      if (this.enabled) {
        if (window.CapacitorHaptics) {
          window.CapacitorHaptics.notification('success');
        } else if (navigator.vibrate) {
          navigator.vibrate([10, 50, 20]);
        }
      }
    },

    warning() {
      if (this.enabled) {
        if (window.CapacitorHaptics) {
          window.CapacitorHaptics.notification('warning');
        } else if (navigator.vibrate) {
          navigator.vibrate([30, 30, 30]);
        }
      }
    },

    alarm() {
      if (this.enabled) {
        if (window.CapacitorHaptics) {
          window.CapacitorHaptics.notification('error');
        } else if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 1000]);
        }
      }
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════

  const Toast = {
    container: null,

    init() {
      this.container = document.getElementById('toastContainer');
    },

    show(message, type = 'info', duration = 3000) {
      if (!this.container) return;

      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.innerHTML = `<span class="toast-icon">${icons[type]}</span> ${message}`;

      this.container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // AUDIO MANAGER
  // ════════════════════════════════════════════════════════════════════════════

  const AudioManager = {
    currentAudio: null,
    currentTone: null,
    isPlaying: false,
    
    sounds: [
      { id: 'audio1', name: 'Waheguru Simran', desc: 'Soft melodic simran', icon: '🕉️' },
      { id: 'audio2', name: 'Amritvela Dhun', desc: 'Peaceful morning raga', icon: '🌅' },
      { id: 'audio3', name: 'Rehras Sahib', desc: 'Evening prayer melody', icon: '🙏' },
      { id: 'audio4', name: 'Kirtan Sohila', desc: 'Night prayer harmony', icon: '🌙' },
      { id: 'audio5', name: 'Asa Di Var', desc: 'Morning congregation', icon: '☀️' },
      { id: 'audio6', name: 'Anand Sahib', desc: 'Blissful melody', icon: '✨' }
    ],

    play(tone, loop = false) {
      this.stop();

      const file = CONFIG.audio.files[tone];
      if (!file) return;

      this.currentAudio = new Audio(CONFIG.audio.basePath + file);
      this.currentTone = tone;
      this.currentAudio.loop = loop;
      this.currentAudio.volume = 0.8;
      this.isPlaying = true;
      
      // Handle ended event for non-looping audio
      if (!loop) {
        this.currentAudio.addEventListener('ended', () => {
          this.isPlaying = false;
          this.updatePlayButtons();
        });
      }
      
      // Handle autoplay restrictions
      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('[Audio] Play failed:', err);
          this.isPlaying = false;
        });
      }
      
      this.updatePlayButtons();
    },

    stop() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      this.isPlaying = false;
      this.currentTone = null;
      this.updatePlayButtons();
    },

    toggle(tone) {
      // If same tone is playing, stop it
      if (this.isPlaying && this.currentTone === tone) {
        this.stop();
        return false;
      }
      
      // Otherwise play the new tone
      this.play(tone, false);
      return true;
    },

    // Update all play buttons to show correct state
    updatePlayButtons() {
      document.querySelectorAll('.sound-play').forEach(btn => {
        const tone = btn.dataset.sound;
        const isThisPlaying = this.isPlaying && this.currentTone === tone;
        
        // Update icon
        btn.innerHTML = isThisPlaying 
          ? `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        
        // Update visual state
        btn.classList.toggle('playing', isThisPlaying);
      });
    },

    preview(tone) {
      // Toggle play/pause - no auto-stop
      this.toggle(tone);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // NITNEM SYNC
  // ════════════════════════════════════════════════════════════════════════════

  const NitnemSync = {
    channel: null,

    init() {
      // Setup BroadcastChannel for cross-tab sync
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(CONFIG.sync.nitnemChannel);
        this.channel.onmessage = (event) => this.handleMessage(event.data);
      }

      // Listen for alarm responses from Nitnem Tracker
      window.addEventListener('alarmInteraction', (e) => {
        this.handleAlarmInteraction(e.detail);
      });

      // Listen for online/offline
      window.addEventListener('online', () => State.isOnline = true);
      window.addEventListener('offline', () => State.isOnline = false);
    },

    handleMessage(data) {
      switch (data.type) {
        case 'SYNC_REQUEST':
          this.broadcastSyncData();
          break;
        case 'ALARM_RESPONSE':
          this.updateLocalStats(data.alarmId, data.status);
          break;
      }
    },

    handleAlarmInteraction(detail) {
      const { alarmId, action, timestamp } = detail;
      this.recordResponse(alarmId, action, timestamp);
    },

    recordResponse(alarmId, status, timestamp = null) {
      const today = Utils.today();
      const time = timestamp || new Date().toISOString();

      // Get or create alarm log
      let alarmLog = Storage.get(CONFIG.storage.alarmLog, {});
      if (!alarmLog[today]) {
        alarmLog[today] = {};
      }

      // Record the response
      alarmLog[today][alarmId] = {
        status,
        timestamp: time
      };

      Storage.set(CONFIG.storage.alarmLog, alarmLog);

      // Update stats
      this.updateStats(status);

      // Broadcast to other tabs
      this.broadcast('ALARM_RESPONSE', { alarmId, status, timestamp: time });

      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('alarmResponseRecorded', {
        detail: { alarmId, status, timestamp: time }
      }));

      console.log('[NitnemSync] Recorded', status, 'for', alarmId);
    },

    updateStats(status) {
      let stats = Storage.get(CONFIG.storage.stats, { completed: 0, missed: 0, streak: 0 });
      
      if (status === 'completed' || status === 'followed') {
        stats.completed++;
      } else if (status === 'missed') {
        stats.missed++;
      }

      Storage.set(CONFIG.storage.stats, stats);
    },

    updateLocalStats(alarmId, status) {
      // Update UI to reflect the response
      UI.updateAlarmStatus(alarmId, status);
    },

    broadcast(type, data) {
      if (this.channel) {
        this.channel.postMessage({ type, data });
      }
      
      // Also dispatch locally
      window.dispatchEvent(new CustomEvent('nitnemSync', {
        detail: { type, data }
      }));
    },

    broadcastSyncData() {
      this.broadcast('SYNC_DATA', {
        reminders: State.reminders,
        stats: State.stats,
        timestamp: Date.now()
      });
    },

    forceSync() {
      this.broadcastSyncData();
      Toast.show('Synced with Nitnem Tracker', 'success');
      Haptic.success();
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // BACKGROUND ALARM MANAGER
  // ════════════════════════════════════════════════════════════════════════════

  const AlarmScheduler = {
    scheduled: new Map(),
    checkInterval: null,

    async init() {
      // CRITICAL: Request notification permission on Android 13+ first
      await this.requestNotificationPermission();
      await this.requestAlarmReliability();
      
      // CRITICAL: Create notification channel (required Android 8+)
      await this.createNotificationChannel();

      // Check alarms every 10 seconds (more reliable)
      this.checkInterval = setInterval(() => this.checkAlarms(), 10000);
      
      // Check immediately on load
      this.checkAlarms();
      
      // Check for missed alarms from when app was closed
      this.checkMissedAlarms();
      
      // Check for pending alarms that triggered while app was closed
      this.checkPendingAlarms();

      // Schedule all alarms with Capacitor for background support
      this.scheduleAllWithCapacitor();

      // Set up Capacitor notification listener
      this.setupCapacitorListener();

      // Check when page becomes visible — reschedule to ensure nothing was lost
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkAlarms();
          this.checkMissedAlarms();
          this.scheduleAllWithCapacitor(); // Reschedule on every app foreground
        }
      });
      
      // Check when window gets focus
      window.addEventListener('focus', () => {
        this.checkAlarms();
        this.checkMissedAlarms();
      });
    },

    async requestNotificationPermission() {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
      if (!window.Capacitor.Plugins.LocalNotifications) return;
      try {
        const perms = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
        if (perms.display !== 'granted') {
          await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.warn('[AlarmScheduler] Permission request failed:', e);
      }
    },

    async requestAlarmReliability() {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
      const plugin = window.Capacitor.Plugins.AlarmReliability;
      if (!plugin) return;
      try {
        const status = await plugin.getStatus();
        if (!status || status.exactAlarm !== true) {
          await plugin.requestExactAlarmPermission();
        }
        if (status && status.batteryOptimized === true) {
          await plugin.requestIgnoreBatteryOptimizations();
        }
      } catch (e) {
        console.warn('[AlarmScheduler] Alarm reliability permission check failed:', e);
      }
    },

    async createNotificationChannel() {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
      if (!window.Capacitor.Plugins.LocalNotifications) return;
      try {
        await window.Capacitor.Plugins.LocalNotifications.createChannel({
          id: 'anhad_reminders',
          name: 'ANHAD Reminders',
          description: 'Nitnem and spiritual practice reminders',
          importance: 5, // MAX importance — shows heads-up notification
          visibility: 1, // PUBLIC
          sound: 'default',
          vibration: true,
          lights: true
        });
        console.log('[AlarmScheduler] Notification channel created');
      } catch (e) {
        console.warn('[AlarmScheduler] Channel creation failed:', e);
      }
    },

    async scheduleAllWithCapacitor() {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform() || !window.Capacitor.Plugins.LocalNotifications) {
        return;
      }

      try {
        const previousIds = Storage.get('sr_native_notification_ids_v7', []);
        if (Array.isArray(previousIds) && previousIds.length > 0) {
          await window.Capacitor.Plugins.LocalNotifications.cancel({
            notifications: previousIds.map(id => ({ id: Number(id) }))
          });
        }

        // Get all enabled alarms
        const allReminders = [
          ...Object.values(State.reminders.core),
          ...State.reminders.custom
        ].filter(r => r.enabled);

        const notifications = [];
        const now = new Date();

        // Schedule for next 7 days to survive longer without reschedule
        allReminders.forEach(alarm => {
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDate = new Date(now);
            checkDate.setDate(checkDate.getDate() + dayOffset);
            const dayOfWeek = checkDate.getDay();
            
            // Only schedule if this day is in the alarm's active days
            if (!alarm.days.includes(dayOfWeek)) continue;
            
            const [h, m] = alarm.time.split(':').map(Number);
            const scheduleTime = new Date(checkDate);
            scheduleTime.setHours(h, m, 0, 0);
            
            // Skip if time has already passed
            if (scheduleTime <= now) continue;
            
            notifications.push({
              id: this.hashString(alarm.id + '_d' + dayOffset),
              title: alarm.label || alarm.title || 'Reminder',
              body: 'Time for your spiritual practice 🙏',
              schedule: {
                at: scheduleTime,
                allowWhileIdle: true,
                exact: true // CRITICAL: Without this, Android batches and delays
              },
              channelId: 'anhad_reminders',
              sound: 'default',
              smallIcon: 'ic_stat_notify',
              extra: {
                action: 'show_alarm',
                alarmId: alarm.id,
                alarmLabel: alarm.label || alarm.title || 'Alarm',
                alarmTime: alarm.time || '',
                alarmIcon: alarm.icon || 'ðŸ””',
                alarmTone: alarm.tone || 'audio1',
                url: window.location.href
              }
            });

            this.scheduleFullScreenAlarm(alarm, scheduleTime, dayOffset);
          }
        });

        if (notifications.length > 0) {
          await window.Capacitor.Plugins.LocalNotifications.schedule({
            notifications
          });
          Storage.set('sr_native_notification_ids_v7', notifications.map(n => n.id));
          console.log('[AlarmScheduler] Scheduled', notifications.length, 'alarms for next 7 days');
        } else {
          Storage.set('sr_native_notification_ids_v7', []);
        }
      } catch (error) {
        console.error('[AlarmScheduler] Failed to schedule all alarms with Capacitor:', error);
      }
    },

    async scheduleFullScreenAlarm(alarm, scheduledTime, dayOffset = 0) {
      const plugin = window.Capacitor?.Plugins?.AlarmReliability;
      if (!plugin || !scheduledTime || new Date(scheduledTime) <= new Date()) return;

      try {
        const [hour = '', minute = ''] = String(alarm.time || '').split(':');
        await plugin.scheduleFullScreenAlarm({
          id: this.hashString('fs_' + alarm.id + '_' + new Date(scheduledTime).toDateString() + '_' + dayOffset),
          timestamp: new Date(scheduledTime).getTime(),
          title: alarm.label || alarm.title || 'Reminder',
          message: 'Time for your spiritual practice',
          hour,
          minute
        });
      } catch (error) {
        console.warn('[AlarmScheduler] Full-screen alarm scheduling failed:', error);
      }
    },

    setupCapacitorListener() {
      if (!window.Capacitor || !window.Capacitor.Plugins.LocalNotifications) {
        return;
      }

      window.Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('[AlarmScheduler] Notification action performed:', notification);
        const alarmId = notification.notification.extra?.alarmId;
        if (alarmId) {
          const alarm = this.findAlarmById(alarmId);
          if (alarm) {
            // Navigate to reminders page and trigger alarm
            window.location.href = 'smart-reminders-v7.html';
            setTimeout(() => {
              this.triggerAlarm(alarm);
            }, 1000);
          }
        }
      });
    },

    checkAlarms() {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.getDay();

      // Get all enabled alarms for today
      const allReminders = [
        ...Object.values(State.reminders.core),
        ...State.reminders.custom
      ];

      // Find alarms that should trigger now (exact match)
      const activeAlarms = allReminders.filter(r => 
        r.enabled && 
        r.days.includes(today) && 
        r.time === currentTime
      );

      // Check if already responded today
      const alarmLog = Storage.get(CONFIG.storage.alarmLog, {});
      const todayLog = alarmLog[Utils.today()] || {};

      activeAlarms.forEach(alarm => {
        if (!todayLog[alarm.id]) {
          // Check if we already triggered this alarm recently (prevent duplicates)
          const lastTriggered = this.scheduled.get(alarm.id + '_triggered');
          if (!lastTriggered || (Date.now() - lastTriggered) > 60000) {
            this.scheduled.set(alarm.id + '_triggered', Date.now());
            this.triggerAlarm(alarm);
          }
        }
      });
    },
    
    checkMissedAlarms() {
      // Check for alarms that should have triggered while app was closed
      const now = new Date();
      const today = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const allReminders = [
        ...Object.values(State.reminders.core),
        ...State.reminders.custom
      ];
      
      const alarmLog = Storage.get(CONFIG.storage.alarmLog, {});
      const todayLog = alarmLog[Utils.today()] || {};
      
      allReminders.forEach(alarm => {
        if (!alarm.enabled || !alarm.days.includes(today)) return;
        if (todayLog[alarm.id]) return; // Already responded
        
        // Parse alarm time
        const [h, m] = alarm.time.split(':').map(Number);
        const alarmMinutes = h * 60 + m;
        
        // Check if alarm time passed in last 5 minutes
        const diff = currentMinutes - alarmMinutes;
        
        if (diff >= 0 && diff <= 5) {
          // Alarm should have triggered recently
          const lastTriggered = this.scheduled.get(alarm.id + '_triggered');
          if (!lastTriggered || (Date.now() - lastTriggered) > 300000) {
            console.log('[AlarmScheduler] Triggering missed alarm:', alarm.label);
            this.scheduled.set(alarm.id + '_triggered', Date.now());
            this.triggerAlarm(alarm);
          }
        }
      });
    },
    
    checkPendingAlarms() {
      // Check for alarms that were triggered but modal wasn't shown (app was closed)
      const triggeredAlarms = Storage.get('sr_triggered_alarms', {});
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60000);
      
      Object.entries(triggeredAlarms).forEach(([alarmId, data]) => {
        const triggeredTime = new Date(data.timestamp);
        
        // If alarm was triggered in last 5 minutes and wasn't shown
        if (triggeredTime > fiveMinutesAgo && !data.shown) {
          // Find the alarm
          const alarm = this.findAlarmById(alarmId);
          if (alarm) {
            console.log('[AlarmScheduler] Recovering pending alarm:', alarm.label);
            this.triggerAlarm(alarm);
          }
        }
        
        // Clean up old entries (older than 1 hour)
        if (triggeredTime < new Date(now - 60 * 60000)) {
          delete triggeredAlarms[alarmId];
        }
      });
      
      Storage.set('sr_triggered_alarms', triggeredAlarms);
    },

    triggerAlarm(alarm) {
      console.log('[AlarmScheduler] Triggering:', alarm.label);
      
      // Persist triggered alarm state for background/Capacitor support
      const triggeredAlarms = Storage.get('sr_triggered_alarms', {});
      triggeredAlarms[alarm.id] = {
        timestamp: new Date().toISOString(),
        label: alarm.label,
        shown: false
      };
      Storage.set('sr_triggered_alarms', triggeredAlarms);
      
      // Play sound
      if (State.settings.sound) {
        AudioManager.play(alarm.tone, true);
      }

      // Vibrate
      if (State.settings.vibration) {
        Haptic.alarm();
      }

      // Show modal
      UI.showAlarmModal(alarm);
      
      // Mark as shown
      triggeredAlarms[alarm.id].shown = true;
      Storage.set('sr_triggered_alarms', triggeredAlarms);

      // Dispatch event
      window.dispatchEvent(new CustomEvent('alarmTriggered', {
        detail: { alarm, timestamp: new Date().toISOString() }
      }));
    },

    scheduleNext() {
      // Clear existing timeout
      if (State.nextAlarmTimeout) {
        clearTimeout(State.nextAlarmTimeout);
      }

      // Find next alarm
      const next = this.findNextAlarm();
      if (!next) {
        UI.updateHeroCard(null);
        return;
      }

      const delay = next.nextTime - Date.now();
      
      // Update hero card
      UI.updateHeroCard(next.alarm, next.nextTime);

      // Schedule trigger with Capacitor for background support
      if (window.Capacitor && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins.LocalNotifications) {
        this.scheduleWithCapacitor(next.alarm, next.nextTime);
      }

      // Also schedule with setTimeout for in-app triggering
      State.nextAlarmTimeout = setTimeout(() => {
        this.triggerAlarm(next.alarm);
      }, delay);

      console.log('[AlarmScheduler] Next alarm:', next.alarm.label, 'in', Math.round(delay / 60000), 'min');
    },

    async scheduleWithCapacitor(alarm, scheduledTime) {
      try {
        await window.Capacitor.Plugins.LocalNotifications.schedule({
          notifications: [{
            id: this.hashString(alarm.id),
            title: alarm.label || alarm.title || 'Reminder',
            body: 'Time for your spiritual practice 🙏',
            schedule: {
              at: new Date(scheduledTime),
              allowWhileIdle: true,
              exact: true // CRITICAL: Exact timing for alarm-like behavior
            },
            channelId: 'anhad_reminders',
            sound: 'default',
            smallIcon: 'ic_stat_notify',
            extra: {
              action: 'show_alarm',
              alarmId: alarm.id,
              alarmLabel: alarm.label || alarm.title || 'Alarm',
              alarmTime: alarm.time || '',
              alarmIcon: alarm.icon || '🔔',
              alarmTone: alarm.tone || 'audio1',
              url: window.location.href
            }
          }]
        });
        await this.scheduleFullScreenAlarm(alarm, scheduledTime, 0);
        console.log('[AlarmScheduler] Scheduled with Capacitor:', alarm.label, 'at', new Date(scheduledTime).toLocaleString());
      } catch (error) {
        console.error('[AlarmScheduler] Capacitor scheduling failed:', error);
      }
    },

    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    },

    findNextAlarm() {
      const now = new Date();
      const today = now.getDay();
      const allReminders = [
        ...Object.values(State.reminders.core),
        ...State.reminders.custom
      ].filter(r => r.enabled);

      let nearest = null;
      let nearestTime = Infinity;

      allReminders.forEach(alarm => {
        const nextTime = Utils.getNextOccurrence(alarm.time, alarm.days);
        const delay = nextTime - now;
        
        if (delay > 0 && delay < nearestTime) {
          nearest = alarm;
          nearestTime = delay;
        }
      });

      if (!nearest) return null;

      return {
        alarm: nearest,
        nextTime: Utils.getNextOccurrence(nearest.time, nearest.days)
      };
    },

    snoozeAlarm(alarmId, minutes = 10) {
      const alarm = this.findAlarmById(alarmId);
      if (!alarm) return;

      const snoozeTime = Date.now() + (minutes * 60000);

      // Schedule with Capacitor for background support
      if (window.Capacitor && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins.LocalNotifications) {
        window.Capacitor.Plugins.LocalNotifications.schedule({
          notifications: [{
            id: this.hashString('snooze_' + alarmId + '_' + snoozeTime),
            title: 'Snoozed: ' + (alarm.label || alarm.title || 'Reminder'),
            body: 'Your snoozed alarm is ringing!',
            schedule: {
              at: new Date(snoozeTime),
              allowWhileIdle: true,
              exact: true
            },
            channelId: 'anhad_reminders',
            sound: 'default',
            smallIcon: 'ic_stat_notify',
            extra: {
              alarmId: alarmId,
              isSnooze: true,
              url: window.location.href
            }
          }]
        }).catch(err => console.error('[AlarmScheduler] Capacitor snooze failed:', err));
      }

      // Also schedule with setTimeout for in-app triggering
      setTimeout(() => {
        this.triggerAlarm(alarm);
      }, minutes * 60000);

      Toast.show(`Snoozed for ${minutes} minutes`, 'info');
    },

    findAlarmById(id) {
      const allReminders = [
        ...Object.values(State.reminders.core),
        ...State.reminders.custom
      ];
      return allReminders.find(r => r.id === id);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // UI CONTROLLER
  // ════════════════════════════════════════════════════════════════════════════

  const UI = {
    elements: {},

    init() {
      this.cacheElements();
      this.setupEventListeners();
      this.render();
      this.setupScrollListener();
    },

    cacheElements() {
      const els = [
        'appLoading', 'appHeader', 'statusPill', 'statusText', 'nextTime', 'nextCountdown',
        'heroCard', 'heroIcon', 'heroLabel', 'heroTime', 'heroPeriod', 'heroDays', 'heroCountdown',
        'heroSync', 'snoozeHeroBtn',
        'coreAlarmsList', 'customAlarmsList', 'customEmptyState',
        'streakValue', 'completedValue', 'obedienceValue',
        'fabAddAlarm', 'modalBackdrop', 'editSheet', 'addSheet', 'settingsSheet', 'alarmModal',
        'editSheetTitle', 'editLabel', 'editTime', 'editNitnemSync',
        'editDays', 'soundSelector', 'addLabel', 'addTime', 'addDays', 'addSoundSelector',
        'saveAlarmBtn', 'deleteAlarmBtn', 'cancelEditBtn', 'cancelAddBtn', 'createAlarmBtn',
        'closeEditSheet', 'closeAddSheet', 'closeSettingsSheet', 'settingsBtn',
        'neverMissToggle', 'smartSnoozeToggle', 'preReminderToggle', 'nitnemSyncToggle',
        'vibrationToggle', 'soundToggle', 'forceSyncBtn',
        'alarmModalIcon', 'alarmModalTime', 'alarmModalLabel',
        'modalSnoozeBtn', 'modalCompleteBtn', 'toastContainer',
        'backBtn', 'addCustomBtn', 'nitnemLinkBtn'
      ];

      els.forEach(id => {
        this.elements[id] = document.getElementById(id);
      });

      Toast.init();
    },

    setupEventListeners() {
      // Header
      this.elements.backBtn?.addEventListener('click', () => {
        // Navigate back to referrer or default to index.html
        const referrer = document.referrer;
        if (referrer && referrer.includes(window.location.hostname)) {
          window.history.back();
        } else {
          window.location.href = '../index.html';
        }
      });

      this.elements.settingsBtn?.addEventListener('click', () => this.openSheet('settingsSheet'));

      // FAB
      this.elements.fabAddAlarm?.addEventListener('click', () => this.openSheet('addSheet'));
      this.elements.addCustomBtn?.addEventListener('click', () => this.openSheet('addSheet'));

      // Sheets
      this.elements.modalBackdrop?.addEventListener('click', () => this.closeAllSheets());
      this.elements.closeEditSheet?.addEventListener('click', () => this.closeSheet('editSheet'));
      this.elements.closeAddSheet?.addEventListener('click', () => this.closeSheet('addSheet'));
      this.elements.closeSettingsSheet?.addEventListener('click', () => this.closeSheet('settingsSheet'));

      // Form actions
      this.elements.cancelEditBtn?.addEventListener('click', () => this.closeSheet('editSheet'));
      this.elements.cancelAddBtn?.addEventListener('click', () => this.closeSheet('addSheet'));
      this.elements.saveAlarmBtn?.addEventListener('click', () => this.saveAlarm());
      this.elements.createAlarmBtn?.addEventListener('click', () => this.createAlarm());
      this.elements.deleteAlarmBtn?.addEventListener('click', () => this.deleteAlarm());

      // Day selectors
      this.setupDaySelector('editDays');
      this.setupDaySelector('addDays');

      // Sound selectors
      this.renderSoundSelector('soundSelector');
      this.renderSoundSelector('addSoundSelector');

      // Settings toggles
      this.setupSettingsToggles();

      // Nitnem link
      this.elements.nitnemLinkBtn?.addEventListener('click', () => {
        window.location.href = '../NitnemTracker/nitnem-tracker.html';
      });

      // Hero actions
      this.elements.snoozeHeroBtn?.addEventListener('click', () => {
        const nextAlarm = AlarmScheduler.findNextAlarm();
        if (nextAlarm) {
          AlarmScheduler.snoozeAlarm(nextAlarm.alarm.id, 10);
          this.updateHeroCard(nextAlarm.alarm, new Date(Date.now() + 10 * 60000));
        }
      });


      // Modal actions
      this.elements.modalSnoozeBtn?.addEventListener('click', () => this.snoozeCurrentAlarm());
      this.elements.modalCompleteBtn?.addEventListener('click', () => this.completeCurrentAlarm());

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeAllSheets();
        }
      });
    },

    setupScrollListener() {
      let lastScroll = 0;
      window.addEventListener('scroll', Utils.debounce(() => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
          this.elements.appHeader?.classList.add('scrolled');
        } else {
          this.elements.appHeader?.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
      }, 100));
    },

    setupDaySelector(elementId) {
      const container = this.elements[elementId];
      if (!container) return;

      container.querySelectorAll('.day-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          Haptic.tap();
          chip.classList.toggle('active');
        });
      });
    },

    renderSoundSelector(elementId) {
      const container = this.elements[elementId];
      if (!container) return;

      container.innerHTML = AudioManager.sounds.map(sound => `
        <div class="sound-option" data-sound="${sound.id}">
          <div class="sound-icon">${sound.icon}</div>
          <div class="sound-info">
            <div class="sound-name">${sound.name}</div>
            <div class="sound-desc">${sound.desc}</div>
          </div>
          <button class="sound-play" data-sound="${sound.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
      `).join('');

      container.querySelectorAll('.sound-option').forEach(option => {
        option.addEventListener('click', (e) => {
          if (e.target.closest('.sound-play')) return;
          Haptic.tap();
          container.querySelectorAll('.sound-option').forEach(o => o.classList.remove('active'));
          option.classList.add('active');
        });
      });

      container.querySelectorAll('.sound-play').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          Haptic.tap();
          AudioManager.preview(btn.dataset.sound);
        });
      });
    },

    setupSettingsToggles() {
      const toggles = {
        neverMissToggle: 'neverMissMode',
        smartSnoozeToggle: 'smartSnooze',
        preReminderToggle: 'preReminder',
        nitnemSyncToggle: 'nitnemSync',
        vibrationToggle: 'vibration',
        soundToggle: 'sound'
      };

      Object.entries(toggles).forEach(([elementId, settingKey]) => {
        const toggle = this.elements[elementId];
        if (toggle) {
          toggle.checked = State.settings[settingKey] !== false;
          toggle.addEventListener('change', () => {
            State.settings[settingKey] = toggle.checked;
            Storage.set(CONFIG.storage.settings, State.settings);
            Haptic.success();
            Toast.show(`${settingKey} ${toggle.checked ? 'enabled' : 'disabled'}`, 'success');
          });
        }
      });

      this.elements.forceSyncBtn?.addEventListener('click', () => {
        Haptic.success();
        NitnemSync.forceSync();
      });
    },

    render() {
      this.renderCoreAlarms();
      this.renderCustomAlarms();
      this.updateStats();
      AlarmScheduler.scheduleNext();
      AlarmScheduler.scheduleAllWithCapacitor();
      
      // Hide loading
      setTimeout(() => {
        this.elements.appLoading?.classList.add('hidden');
      }, 500);
    },

    renderCoreAlarms() {
      const container = this.elements.coreAlarmsList;
      if (!container) return;

      const coreAlarms = Object.values(State.reminders.core);
      const alarmLog = Storage.get(CONFIG.storage.alarmLog, {});
      const todayLog = alarmLog[Utils.today()] || {};

      container.innerHTML = coreAlarms.map(alarm => {
        const time12 = Utils.formatTime12(alarm.time);
        const status = todayLog[alarm.id]?.status || 'pending';
        const statusClass = status === 'completed' ? 'completed' : status === 'missed' ? 'missed' : 'pending';
        const statusText = status === 'completed' ? 'Done' : status === 'missed' ? 'Missed' : 'Pending';

        return `
          <div class="alarm-card ${alarm.id} ${alarm.enabled ? 'active' : ''}" data-id="${alarm.id}">
            <div class="alarm-icon-wrapper">${alarm.icon || '🔔'}</div>
            <div class="alarm-info">
              <div class="alarm-gurmukhi">${alarm.gurmukhi || ''}</div>
              <div class="alarm-label">${alarm.label}</div>
              <div class="alarm-time-row">
                <span class="alarm-time">${time12.hour}:${time12.min}</span>
                <span class="alarm-period">${time12.period}</span>
              </div>
              <div class="alarm-days">${Utils.getDayNames(alarm.days)}</div>
            </div>
            <div class="alarm-status">
              <span class="status-badge ${statusClass}">${statusText}</span>
              <input type="checkbox" class="ios-toggle" ${alarm.enabled ? 'checked' : ''} data-id="${alarm.id}">
            </div>
          </div>
        `;
      }).join('');

      // Add click handlers
      container.querySelectorAll('.alarm-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.classList.contains('ios-toggle')) return;
          const id = card.dataset.id;
          this.openEditSheet(id);
        });
      });

      container.querySelectorAll('.ios-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
          Haptic.tap();
          const id = e.target.dataset.id;
          const alarm = State.reminders.core[id];
          if (alarm) {
            alarm.enabled = e.target.checked;
            Storage.set(CONFIG.storage.reminders, State.reminders);
            e.target.closest('.alarm-card').classList.toggle('active', e.target.checked);
            AlarmScheduler.scheduleNext();
            AlarmScheduler.scheduleAllWithCapacitor();
          }
        });
      });
    },

    renderCustomAlarms() {
      const container = this.elements.customAlarmsList;
      const emptyState = this.elements.customEmptyState;
      if (!container) return;

      const customAlarms = State.reminders.custom || [];
      
      if (customAlarms.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      container.style.display = 'flex';
      emptyState.style.display = 'none';

      const alarmLog = Storage.get(CONFIG.storage.alarmLog, {});
      const todayLog = alarmLog[Utils.today()] || {};

      container.innerHTML = customAlarms.map(alarm => {
        const time12 = Utils.formatTime12(alarm.time);
        const status = todayLog[alarm.id]?.status || 'pending';
        const statusClass = status === 'completed' ? 'completed' : status === 'missed' ? 'missed' : 'pending';
        const statusText = status === 'completed' ? 'Done' : status === 'missed' ? 'Missed' : 'Pending';

        return `
          <div class="alarm-card custom ${alarm.enabled ? 'active' : ''}" data-id="${alarm.id}">
            <div class="alarm-icon-wrapper">${alarm.icon || '⏰'}</div>
            <div class="alarm-info">
              <div class="alarm-label">${alarm.label}</div>
              <div class="alarm-time-row">
                <span class="alarm-time">${time12.hour}:${time12.min}</span>
                <span class="alarm-period">${time12.period}</span>
              </div>
              <div class="alarm-days">${Utils.getDayNames(alarm.days)}</div>
            </div>
            <div class="alarm-status">
              <span class="status-badge ${statusClass}">${statusText}</span>
              <input type="checkbox" class="ios-toggle" ${alarm.enabled ? 'checked' : ''} data-id="${alarm.id}">
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.alarm-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.classList.contains('ios-toggle')) return;
          const id = card.dataset.id;
          this.openEditSheet(id);
        });
      });

      container.querySelectorAll('.ios-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
          Haptic.tap();
          const id = e.target.dataset.id;
          const alarm = State.reminders.custom.find(r => r.id === id);
          if (alarm) {
            alarm.enabled = e.target.checked;
            Storage.set(CONFIG.storage.reminders, State.reminders);
            e.target.closest('.alarm-card').classList.toggle('active', e.target.checked);
            AlarmScheduler.scheduleNext();
            AlarmScheduler.scheduleAllWithCapacitor();
          }
        });
      });
    },

    updateStats() {
      const stats = Storage.get(CONFIG.storage.stats, { completed: 0, missed: 0, streak: 0 });
      const total = stats.completed + stats.missed;
      const obedience = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

      if (this.elements.streakValue) {
        this.elements.streakValue.textContent = stats.streak || 0;
      }
      if (this.elements.completedValue) {
        this.elements.completedValue.textContent = stats.completed || 0;
      }
      if (this.elements.obedienceValue) {
        this.elements.obedienceValue.textContent = obedience + '%';
      }
    },

    updateAlarmStatus(alarmId, status) {
      const card = document.querySelector(`.alarm-card[data-id="${alarmId}"]`);
      if (card) {
        const badge = card.querySelector('.status-badge');
        if (badge) {
          badge.className = `status-badge ${status}`;
          badge.textContent = status === 'completed' ? 'Done' : status === 'missed' ? 'Missed' : 'Pending';
        }
      }
    },

    updateHeroCard(alarm, nextTime) {
      if (!alarm || !nextTime) {
        this.elements.heroCard.style.display = 'none';
        this.elements.statusPill.style.display = 'none';
        return;
      }

      this.elements.heroCard.style.display = 'block';
      this.elements.statusPill.style.display = 'inline-flex';

      const time12 = Utils.formatTime12(alarm.time);
      const countdown = Utils.getCountdown(nextTime);
      const daysText = Utils.getDayNames(alarm.days);
      
      // Calculate time until alarm
      const delay = nextTime - Date.now();
      const isAlarmTime = delay <= 0; // Alarm time has passed

      // Update hero card with detailed alarm info
      this.elements.heroIcon.textContent = alarm.icon || '🔔';
      this.elements.heroLabel.textContent = alarm.gurmukhi || alarm.label;
      this.elements.heroTime.textContent = `${time12.hour}:${time12.min}`;
      this.elements.heroPeriod.textContent = time12.period;
      this.elements.heroDays.textContent = daysText;
      
      // Update countdown text (compact format)
      if (isAlarmTime) {
        this.elements.heroCountdown.innerHTML = `<span class="time-value">Now</span>`;
        this.elements.statusText.textContent = 'Alarm Now';
      } else {
        this.elements.heroCountdown.innerHTML = `in <span class="time-value">${countdown.text}</span>`;
        this.elements.statusText.textContent = 'Next Alarm';
      }
      
      // Update snooze button text based on state
      if (this.elements.snoozeHeroBtn) {
        if (isAlarmTime) {
          this.elements.snoozeHeroBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Snooze 10m
          `;
        } else {
          this.elements.snoozeHeroBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Later
          `;
        }
      }
      
      // Update status bar
      this.elements.nextTime.textContent = `${time12.hour}:${time12.min}`;
      this.elements.nextCountdown.textContent = countdown.text;

      // Update countdown every minute
      if (State.countdownInterval) {
        clearInterval(State.countdownInterval);
      }
      State.countdownInterval = setInterval(() => {
        const updatedDelay = nextTime - Date.now();
        const updatedIsAlarmTime = updatedDelay <= 0;
        const updatedCountdown = Utils.getCountdown(nextTime);
        
        if (updatedIsAlarmTime) {
          this.elements.heroCountdown.innerHTML = `<span class="time-value">Now</span>`;
          this.elements.statusText.textContent = 'Alarm Now';
        } else {
          this.elements.heroCountdown.innerHTML = `in <span class="time-value">${updatedCountdown.text}</span>`;
          this.elements.statusText.textContent = 'Next Alarm';
        }
        this.elements.nextCountdown.textContent = updatedCountdown.text;
      }, 60000);
    },

    openSheet(sheetId) {
      Haptic.tap();
      this.elements.modalBackdrop?.classList.add('active');
      this.elements[sheetId]?.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    closeSheet(sheetId) {
      // Stop audio preview when closing any sheet
      AudioManager.stop();
      
      this.elements[sheetId]?.classList.remove('active');
      if (!document.querySelector('.bottom-sheet.active')) {
        this.elements.modalBackdrop?.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    closeAllSheets() {
      document.querySelectorAll('.bottom-sheet').forEach(sheet => {
        sheet.classList.remove('active');
      });
      this.elements.modalBackdrop?.classList.remove('active');
      document.body.style.overflow = '';
    },

    openEditSheet(id) {
      Haptic.tap();
      State.currentEditId = id;

      const alarm = State.reminders.core[id] || State.reminders.custom.find(r => r.id === id);
      if (!alarm) return;

      const isCore = ['amritvela', 'rehras', 'sohila'].includes(id);

      this.elements.editSheetTitle.textContent = isCore ? 'Edit Core Alarm' : 'Edit Custom Alarm';
      this.elements.editLabel.value = alarm.label;
      this.elements.editTime.value = alarm.time;
      this.elements.editNitnemSync.checked = alarm.nitnemSync !== false;
      this.elements.deleteAlarmBtn.style.display = isCore ? 'none' : 'flex';

      // Set days
      this.elements.editDays?.querySelectorAll('.day-chip').forEach(chip => {
        const day = parseInt(chip.dataset.day);
        chip.classList.toggle('active', alarm.days.includes(day));
      });

      // Set sound
      this.elements.soundSelector?.querySelectorAll('.sound-option').forEach(option => {
        option.classList.toggle('active', option.dataset.sound === alarm.tone);
      });

      this.openSheet('editSheet');
    },

    saveAlarm() {
      Haptic.success();

      // Stop audio preview if playing
      AudioManager.stop();

      const id = State.currentEditId;
      const alarm = State.reminders.core[id] || State.reminders.custom.find(r => r.id === id);
      if (!alarm) return;

      alarm.label = this.elements.editLabel.value;
      alarm.time = this.elements.editTime.value;
      alarm.nitnemSync = this.elements.editNitnemSync.checked;

      // Get days
      alarm.days = [];
      this.elements.editDays?.querySelectorAll('.day-chip.active').forEach(chip => {
        alarm.days.push(parseInt(chip.dataset.day));
      });

      // Get sound
      const activeSound = this.elements.soundSelector?.querySelector('.sound-option.active');
      if (activeSound) {
        alarm.tone = activeSound.dataset.sound;
      }

      Storage.set(CONFIG.storage.reminders, State.reminders);
      this.closeSheet('editSheet');
      Toast.show('Alarm saved', 'success');
      this.render();
    },

    deleteAlarm() {
      Haptic.warning();

      const id = State.currentEditId;
      const idx = State.reminders.custom.findIndex(r => r.id === id);
      
      if (idx > -1) {
        State.reminders.custom.splice(idx, 1);
        Storage.set(CONFIG.storage.reminders, State.reminders);
        this.closeSheet('editSheet');
        Toast.show('Alarm deleted', 'warning');
        this.render();
      }
    },

    createAlarm() {
      Haptic.success();

      const label = this.elements.addLabel.value || 'Custom Alarm';
      const time = this.elements.addTime.value || '08:00';

      // Get days
      const days = [];
      this.elements.addDays?.querySelectorAll('.day-chip.active').forEach(chip => {
        days.push(parseInt(chip.dataset.day));
      });

      // Get sound
      const activeSound = this.elements.addSoundSelector?.querySelector('.sound-option.active');
      const tone = activeSound ? activeSound.dataset.sound : 'audio1';

      const newAlarm = {
        id: Utils.generateId(),
        type: 'custom',
        label,
        time,
        enabled: true,
        days: days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6],
        tone,
        snooze: 10,
        nitnemSync: true,
        icon: '⏰',
        color: '#007AFF'
      };

      State.reminders.custom.push(newAlarm);
      Storage.set(CONFIG.storage.reminders, State.reminders);

      this.closeSheet('addSheet');
      Toast.show('Alarm created', 'success');
      this.render();

      // Reset form
      this.elements.addLabel.value = '';
      this.elements.addTime.value = '';
    },

    showAlarmModal(alarm) {
      State.isModalOpen = true;
      State.currentModalAlarm = alarm;

      const time12 = Utils.formatTime12(alarm.time);

      this.elements.alarmModalIcon.textContent = alarm.icon || '🔔';
      this.elements.alarmModalTime.textContent = `${time12.hour}:${time12.min}`;
      this.elements.alarmModalLabel.textContent = alarm.gurmukhi || alarm.label;

      this.elements.alarmModal.classList.add('active');
    },

    closeAlarmModal() {
      State.isModalOpen = false;
      State.currentModalAlarm = null;
      this.elements.alarmModal.classList.remove('active');
      AudioManager.stop();
    },

    snoozeCurrentAlarm() {
      if (!State.currentModalAlarm) return;
      
      Haptic.tap();
      AlarmScheduler.snoozeAlarm(State.currentModalAlarm.id, 10);
      this.closeAlarmModal();
      Toast.show('Snoozed for 10 minutes', 'info');
    },

    completeCurrentAlarm() {
      if (!State.currentModalAlarm) return;

      Haptic.success();
      const alarmId = State.currentModalAlarm.id;
      this.completeAlarm(alarmId);
      this.closeAlarmModal();
    },

    completeAlarm(alarmId) {
      // Record in Nitnem Sync
      NitnemSync.recordResponse(alarmId, 'completed');
      
      // Update UI
      this.updateAlarmStatus(alarmId, 'completed');
      this.updateStats();
      
      Toast.show('Great job! Alarm completed', 'success');
      
      // Schedule next alarm
      AlarmScheduler.scheduleNext();
      AlarmScheduler.scheduleAllWithCapacitor();
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════════════════════════════════════

  function init() {
    console.log('[SmartReminders] Initializing v' + CONFIG.version);

    // Migrate storage if needed
    Storage.migrate();

    // Load state
    const defaultReminders = {
      core: {
        amritvela: {
          id: 'amritvela',
          type: 'core',
          label: 'Amritvela Simran',
          gurmukhi: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ',
          time: '04:00',
          enabled: true,
          days: [0, 1, 2, 3, 4, 5, 6],
          tone: 'audio1',
          icon: '🌅',
          color: '#FFD60A',
          nitnemSync: true
        },
        rehras: {
          id: 'rehras',
          type: 'core',
          label: 'Rehras Sahib',
          gurmukhi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ',
          time: '18:30',
          enabled: true,
          days: [0, 1, 2, 3, 4, 5, 6],
          tone: 'audio3',
          icon: '🌆',
          color: '#FF9500',
          nitnemSync: true
        },
        sohila: {
          id: 'sohila',
          type: 'core',
          label: 'Sohila Sahib',
          gurmukhi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ',
          time: '21:30',
          enabled: true,
          days: [0, 1, 2, 3, 4, 5, 6],
          tone: 'audio4',
          icon: '🌙',
          color: '#AF52DE',
          nitnemSync: true
        }
      },
      custom: []
    };

    State.reminders = Storage.get(CONFIG.storage.reminders, defaultReminders);
    State.settings = Storage.get(CONFIG.storage.settings, {
      neverMissMode: false,
      smartSnooze: true,
      preReminder: false,
      nitnemSync: true,
      vibration: true,
      sound: true
    });
    State.stats = Storage.get(CONFIG.storage.stats, { completed: 0, missed: 0, streak: 0 });

    // Setup event listeners
    NitnemSync.init();
    AlarmScheduler.init();
    UI.init();
    ThemeSync.init();

    console.log('[SmartReminders] Ready');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // THEME SYNC - Auto-adapt from main index.html
  // ════════════════════════════════════════════════════════════════════════════

  const ThemeSync = {
    init() {
      // Listen for theme changes from other tabs (main index.html)
      window.addEventListener('storage', (e) => {
        if (e.key === 'anhad_theme') {
          this.applyTheme(e.newValue || 'light');
        }
      });

      // Listen for custom theme change events
      window.addEventListener('themeChanged', (e) => {
        this.applyTheme(e.detail?.theme || 'light');
      });

      console.log('[ThemeSync] Initialized');
    },

    applyTheme(theme) {
      const html = document.documentElement;
      
      html.setAttribute('data-theme', theme);
      html.style.colorScheme = theme;
      
      if (theme === 'dark') {
        html.classList.add('dark', 'dark-mode');
      } else {
        html.classList.remove('dark', 'dark-mode');
      }

      console.log('[ThemeSync] Applied theme:', theme);
    },

    getTheme() {
      return localStorage.getItem('anhad_theme') || 'light';
    }
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external use
  window.SmartReminders = {
    getState: () => State,
    recordAlarmResponse: (alarmId, status) => NitnemSync.recordResponse(alarmId, status),
    forceSync: () => NitnemSync.forceSync(),
    refresh: () => UI.render()
  };
})();
