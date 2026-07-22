# NAAM ABHYAS - COMPLETE PRODUCTION ARCHITECTURE
## Complete Redesign & Rebuild from Scratch

---

## 🎯 EXECUTIVE SUMMARY

This document outlines the complete architecture for rebuilding Naam Abhyas as a production-grade feature that eliminates all existing issues and creates a premium spiritual experience.

### Current Problems Being Solved:
- ❌ Poor UI/UX
- ❌ Timer race conditions
- ❌ Multiple timers interfering
- ❌ Popup issues
- ❌ State inconsistency
- ❌ Difficult maintenance

### New Architecture Goals:
- ✅ Beautiful, spiritual iOS-inspired UI
- ✅ Single-source-of-truth state management
- ✅ Zero race conditions
- ✅ Bulletproof background support
- ✅ Smooth animations (60 FPS)
- ✅ Time-based adaptive color palette
- ✅ Production-ready maintainability

---

## 🏗️ 1. SYSTEM ARCHITECTURE

### 1.1 Core Principle: SINGLE ENGINE PATTERN

```
┌─────────────────────────────────────────────────────────────┐
│                    NAAM ABHYAS ENGINE                        │
│                  (Single Source of Truth)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Session    │  │    Audio     │  │ Notification │     │
│  │  Controller  │  │  Controller  │  │  Controller  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    State     │  │   Timeline   │  │    Popup     │     │
│  │    Store     │  │    Engine    │  │  Controller  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                         │
│           (localStorage + IndexedDB for audio)               │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                         UI LAYER                             │
│  Home · Session Card · Timeline · Popup · Settings           │
└─────────────────────────────────────────────────────────────┘
```


### 1.2 Folder Structure

```
frontend/
├── NaamAbhyas/
│   ├── index.html                      # Main entry point
│   ├── css/
│   │   ├── naam-abhyas-core.css       # Base styles
│   │   ├── naam-abhyas-cards.css      # Card components
│   │   ├── naam-abhyas-timeline.css   # Timeline styles
│   │   ├── naam-abhyas-popup.css      # Popup system
│   │   ├── naam-abhyas-animations.css # 60 FPS animations
│   │   └── naam-abhyas-themes.css     # Time-based colors
│   ├── js/
│   │   ├── core/
│   │   │   ├── NaamAbhyasEngine.js       # Main engine (orchestrator)
│   │   │   ├── SessionController.js      # Session management
│   │   │   ├── AudioController.js        # Audio playback
│   │   │   ├── NotificationController.js # Hourly notifications
│   │   │   ├── StateStore.js             # State management
│   │   │   ├── TimelineEngine.js         # Hour timeline
│   │   │   └── PopupController.js        # Popup system
│   │   ├── ui/
│   │   │   ├── HomeUI.js                 # Home screen renderer
│   │   │   ├── SessionUI.js              # Active session UI
│   │   │   ├── TimelineUI.js             # Timeline renderer
│   │   │   ├── StatsUI.js                # Statistics cards
│   │   │   └── SettingsUI.js             # Settings panel
│   │   ├── utils/
│   │   │   ├── TimeUtils.js              # Time calculations
│   │   │   ├── StorageUtils.js           # Persistence helpers
│   │   │   ├── AnimationUtils.js         # Animation helpers
│   │   │   └── ThemeUtils.js             # Time-based themes
│   │   └── naam-abhyas-init.js           # Initialization
│   └── assets/
│       ├── audio/
│       │   └── waheguru-simran.mp3       # Simran audio
│       └── images/
│           └── completion-illustration.svg

```

---

## 🎨 2. DESIGN SYSTEM

### 2.1 Color Palette (Time-Based Adaptation)

```javascript
const COLOR_PALETTES = {
  morning: {
    primary: '#FFF5EC',      // Warm cream
    secondary: '#FFEBD8',    // Light peach
    accent: '#E8A87C',       // Warm gold
    text: '#3E2723',         // Deep brown
    textSecondary: '#7D6B58',
    card: 'linear-gradient(145deg, #FFF0E6, #FFE4CC)',
    cardBorder: 'rgba(232, 168, 124, 0.2)',
    shadow: '4px 4px 12px rgba(232, 148, 100, 0.08)'
  },
  
  day: {
    primary: '#FAF8F5',      // Neutral white
    secondary: '#F2F2F7',    // iOS light gray
    accent: '#007AFF',       // iOS blue
    text: '#1C1C1E',         // Almost black
    textSecondary: '#8E8E93',
    card: 'linear-gradient(145deg, #FFFFFF, #F5F5F7)',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    shadow: '4px 4px 12px rgba(0, 0, 0, 0.06)'
  },
  
  evening: {
    primary: '#FFF8E7',      // Golden hour
    secondary: '#FFF0D4',    // Warm yellow
    accent: '#B8860B',       // Deep gold
    text: '#3B2A00',         // Dark brown
    textSecondary: '#7A6A4F',
    card: 'linear-gradient(145deg, #FFF8D8, #FFE896)',
    cardBorder: 'rgba(184, 134, 11, 0.25)',
    shadow: '4px 4px 12px rgba(184, 134, 11, 0.08)'
  },
  
  night: {
    primary: '#0D0D0F',      // Deep black
    secondary: '#1C1C1E',    // iOS dark gray
    accent: '#0A84FF',       // iOS dark blue
    text: '#F5F5F7',         // White
    textSecondary: '#8E8E93',
    card: 'linear-gradient(145deg, #1C1C1E, #2C2C2E)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    shadow: '4px 4px 12px rgba(0, 0, 0, 0.25)'
  }
};
```


### 2.2 Typography

```css
/* Gurmukhi - Sacred text */
--font-gurmukhi: 'Noto Sans Gurmukhi', 'Baloo Paaji 2', serif;

/* English - Modern iOS */
--font-primary: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
--font-secondary: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif;

/* Sizes */
--text-hero: 2rem;           /* ਵਾਹਿਗੁਰੂ */
--text-title: 1.5rem;        /* Card titles */
--text-body: 1rem;           /* Regular text */
--text-caption: 0.875rem;    /* Subtitles */
--text-small: 0.75rem;       /* Timestamps */
```

### 2.3 Spacing & Layout

```css
/* Claymorphism principles */
--clay-radius: 24px;
--clay-shadow-light: 
  4px 4px 12px rgba(0, 0, 0, 0.08),
  -4px -4px 12px rgba(255, 255, 255, 0.95);
--clay-shadow-dark:
  4px 4px 12px rgba(0, 0, 0, 0.25),
  -4px -4px 12px rgba(255, 255, 255, 0.05);

/* Safe areas */
--safe-top: max(env(safe-area-inset-top, 24px), 24px);
--safe-bottom: max(env(safe-area-inset-bottom, 16px), 16px);

/* Card spacing */
--card-gap: 16px;
--card-padding: 20px;
```

---

## 🧠 3. STATE MANAGEMENT

### 3.1 State Schema

```typescript
interface NaamAbhyasState {
  // System status
  isEnabled: boolean;
  
  // Active session
  activeSession: {
    isActive: boolean;
    startTime: number;        // Unix timestamp
    duration: number;         // seconds
    remainingTime: number;    // seconds (calculated)
    isPaused: boolean;
    hour: number;             // 0-23
  } | null;
  
  // Audio state
  audio: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
  };
  
  // Timeline (today's schedule)
  timeline: {
    date: string;             // YYYY-MM-DD
    hours: {
      hour: number;           // 0-23
      completed: boolean;
      skipped: boolean;
      timestamp: number | null;
    }[];
  };
  
  // Statistics
  stats: {
    currentStreak: number;    // consecutive hours
    longestStreak: number;
    totalSessions: number;
    totalMinutes: number;
    todayCompleted: number;
    perfectDays: number;      // days with all 24 hours completed
  };
  
  // Settings
  settings: {
    sessionDuration: number;  // default 120 seconds
    audioVolume: number;      // 0-1
    notificationsEnabled: boolean;
    hapticEnabled: boolean;
  };
}
```


### 3.2 StateStore Implementation

```javascript
class StateStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Set();
  }
  
  // Get current state (immutable)
  getState() {
    return Object.freeze({ ...this.state });
  }
  
  // Update state (with persistence)
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.saveState();
    this.notifyListeners();
  }
  
  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  // Persistence
  saveState() {
    localStorage.setItem('naamAbhyas_state', JSON.stringify(this.state));
  }
  
  loadState() {
    const saved = localStorage.getItem('naamAbhyas_state');
    return saved ? JSON.parse(saved) : this.getDefaultState();
  }
  
  getDefaultState() {
    return {
      isEnabled: false,
      activeSession: null,
      audio: { isPlaying: false, currentTime: 0, duration: 0, volume: 0.7 },
      timeline: this.createTodayTimeline(),
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        totalMinutes: 0,
        todayCompleted: 0,
        perfectDays: 0
      },
      settings: {
        sessionDuration: 120,
        audioVolume: 0.7,
        notificationsEnabled: true,
        hapticEnabled: true
      }
    };
  }
  
  createTodayTimeline() {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today,
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        completed: false,
        skipped: false,
        timestamp: null
      }))
    };
  }
}
```

---

## 🎮 4. SESSION CONTROLLER

### 4.1 Core Principle: Timestamp-Based (NO Intervals)

```javascript
class SessionController {
  constructor(stateStore, audioController, notificationController) {
    this.store = stateStore;
    this.audio = audioController;
    this.notifications = notificationController;
    this.rafId = null;
  }
  
  /**
   * Start a session
   * Uses timestamps - never JavaScript intervals
   */
  startSession(hour = null) {
    const state = this.store.getState();
    
    // Prevent duplicate sessions
    if (state.activeSession?.isActive) {
      console.warn('Session already active');
      return false;
    }
    
    const now = Date.now();
    const currentHour = hour ?? new Date().getHours();
    
    // Create session
    const session = {
      isActive: true,
      startTime: now,
      duration: state.settings.sessionDuration,
      isPaused: false,
      hour: currentHour
    };
    
    this.store.setState({ activeSession: session });
    
    // Start audio
    this.audio.play();
    
    // Start update loop (RAF, not setInterval)
    this.startUpdateLoop();
    
    return true;
  }
  
  /**
   * Update loop using requestAnimationFrame
   * Calculates remaining time from timestamps
   */
  startUpdateLoop() {
    const update = () => {
      const state = this.store.getState();
      const session = state.activeSession;
      
      if (!session || !session.isActive) {
        this.stopUpdateLoop();
        return;
      }
      
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
      const remaining = Math.max(0, session.duration - elapsed);
      
      // Update UI
      this.updateUI(remaining);
      
      // Check completion
      if (remaining === 0) {
        this.completeSession();
        return;
      }
      
      this.rafId = requestAnimationFrame(update);
    };
    
    this.rafId = requestAnimationFrame(update);
  }
  
  stopUpdateLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Complete session
   */
  completeSession() {
    const state = this.store.getState();
    const session = state.activeSession;
    
    if (!session) return;
    
    // Stop audio
    this.audio.stop();
    
    // Update timeline
    const timeline = { ...state.timeline };
    timeline.hours[session.hour] = {
      ...timeline.hours[session.hour],
      completed: true,
      timestamp: Date.now()
    };
    
    // Update stats
    const stats = { ...state.stats };
    stats.totalSessions += 1;
    stats.totalMinutes += Math.floor(session.duration / 60);
    stats.todayCompleted += 1;
    stats.currentStreak += 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    
    // Check perfect day
    const allCompleted = timeline.hours.every(h => h.completed);
    if (allCompleted) {
      stats.perfectDays += 1;
    }
    
    // Update state
    this.store.setState({
      activeSession: null,
      timeline,
      stats
    });
    
    // Show completion dialog
    this.showCompletionDialog();
    
    // Haptic feedback
    if (state.settings.hapticEnabled && navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  }
  
  /**
   * Handle app going to background
   */
  handleBackground() {
    const state = this.store.getState();
    if (state.activeSession?.isActive) {
      // Save current timestamp
      localStorage.setItem('naamAbhyas_backgroundTime', Date.now().toString());
    }
  }
  
  /**
   * Handle app returning from background
   */
  handleForeground() {
    const state = this.store.getState();
    const session = state.activeSession;
    
    if (!session?.isActive) return;
    
    const backgroundTime = parseInt(localStorage.getItem('naamAbhyas_backgroundTime') || '0');
    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    const remaining = Math.max(0, session.duration - elapsed);
    
    if (remaining === 0) {
      // Session completed while in background
      this.completeSession();
    } else {
      // Resume audio
      this.audio.play();
    }
  }
}
```

---

## 🔊 5. AUDIO CONTROLLER

### 5.1 Single Audio Instance Pattern

```javascript
class AudioController {
  constructor(stateStore) {
    this.store = stateStore;
    this.audio = null;
    this.audioContext = null;
    this.initialized = false;
  }
  
  /**
   * Initialize audio (lazy load)
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Create audio element
      this.audio = new Audio();
      this.audio.src = '../assets/audio/waheguru-simran.mp3';
      this.audio.loop = true; // Auto-loop
      
      // Set volume
      const state = this.store.getState();
      this.audio.volume = state.settings.audioVolume;
      
      // Preload
      this.audio.preload = 'auto';
      
      // Web Audio API for better control
      if (window.AudioContext || window.webkitAudioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaElementSource(this.audio);
        source.connect(this.audioContext.destination);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  }
  
  /**
   * Play audio
   */
  async play() {
    await this.initialize();
    
    try {
      // Resume audio context (iOS requirement)
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      await this.audio.play();
      
      this.store.setState({
        audio: {
          ...this.store.getState().audio,
          isPlaying: true
        }
      });
    } catch (error) {
      console.error('Audio play failed:', error);
    }
  }
  
  /**
   * Stop audio
   */
  stop() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.audio.currentTime = 0;
    
    this.store.setState({
      audio: {
        ...this.store.getState().audio,
        isPlaying: false,
        currentTime: 0
      }
    });
  }
  
  /**
   * Set volume
   */
  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.audio) {
      this.stop();
      this.audio.src = '';
      this.audio = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
```

---

## 🔔 6. NOTIFICATION CONTROLLER

### 6.1 Hourly Notification System

```javascript
class NotificationController {
  constructor(stateStore) {
    this.store = stateStore;
    this.scheduledAlarms = new Set();
  }
  
  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  /**
   * Schedule hourly notifications
   */
  async scheduleHourlyAlarms() {
    const state = this.store.getState();
    
    if (!state.isEnabled || !state.settings.notificationsEnabled) {
      return;
    }
    
    // Clear existing alarms
    this.clearAllAlarms();
    
    // Use Capacitor Local Notifications if available
    if (window.Capacitor?.Plugins?.LocalNotifications) {
      await this.scheduleCapacitorAlarms();
    } else {
      // Fallback: Use guaranteed-alarm-system.js
      await this.scheduleFallbackAlarms();
    }
  }
  
  /**
   * Schedule with Capacitor
   */
  async scheduleCapacitorAlarms() {
    const { LocalNotifications } = window.Capacitor.Plugins;
    
    // Schedule for every hour
    const notifications = [];
    
    for (let hour = 0; hour < 24; hour++) {
      notifications.push({
        id: hour,
        title: 'ਨਾਮ ਅਭਿਆਸ',
        body: 'Time for Naam Simran - 2 minutes with Waheguru 🙏',
        schedule: {
          on: { hour, minute: 0 }
        },
        actionTypeId: 'naam-abhyas',
        extra: { hour }
      });
    }
    
    await LocalNotifications.schedule({ notifications });
  }
  
  /**
   * Fallback scheduler (web)
   */
  async scheduleFallbackAlarms() {
    // Use existing guaranteed-alarm-system.js
    if (window.GuaranteedAlarmSystem) {
      for (let hour = 0; hour < 24; hour++) {
        window.GuaranteedAlarmSystem.scheduleHourly(hour, () => {
          this.showNotification(hour);
        });
      }
    }
  }
  
  /**
   * Show notification
   */
  showNotification(hour) {
    if (Notification.permission !== 'granted') return;
    
    const notification = new Notification('ਨਾਮ ਅਭਿਆਸ', {
      body: 'Time for Naam Simran - 2 minutes with Waheguru 🙏',
      icon: '../assets/icon-192x192.png',
      badge: '../assets/icon-96x96.png',
      tag: `naam-abhyas-${hour}`,
      requireInteraction: true,
      data: { hour }
    });
    
    notification.onclick = () => {
      window.focus();
      this.openSessionPopup(hour);
      notification.close();
    };
  }
  
  /**
   * Clear all scheduled alarms
   */
  clearAllAlarms() {
    if (window.Capacitor?.Plugins?.LocalNotifications) {
      window.Capacitor.Plugins.LocalNotifications.cancel({ notifications: [] });
    }
    
    this.scheduledAlarms.clear();
  }
}
```

---

## ⏱️ 7. TIMELINE ENGINE

### 7.1 Hour-by-Hour Timeline

```javascript
class TimelineEngine {
  constructor(stateStore) {
    this.store = stateStore;
  }
  
  /**
   * Get current hour
   */
  getCurrentHour() {
    return new Date().getHours();
  }
  
  /**
   * Get timeline for today
   */
  getTodayTimeline() {
    const state = this.store.getState();
    const today = new Date().toISOString().split('T')[0];
    
    // Reset timeline if day changed
    if (state.timeline.date !== today) {
      const newTimeline = {
        date: today,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          completed: false,
          skipped: false,
          timestamp: null
        }))
      };
      
      this.store.setState({ timeline: newTimeline });
      return newTimeline;
    }
    
    return state.timeline;
  }
  
  /**
   * Mark hour as completed
   */
  completeHour(hour) {
    const timeline = this.getTodayTimeline();
    timeline.hours[hour] = {
      ...timeline.hours[hour],
      completed: true,
      timestamp: Date.now()
    };
    
    this.store.setState({ timeline });
  }
  
  /**
   * Get completion percentage
   */
  getCompletionPercentage() {
    const timeline = this.getTodayTimeline();
    const completed = timeline.hours.filter(h => h.completed).length;
    return Math.round((completed / 24) * 100);
  }
  
  /**
   * Get next uncompleted hour
   */
  getNextUncompletedHour() {
    const timeline = this.getTodayTimeline();
    const currentHour = this.getCurrentHour();
    
    // Check current hour first
    if (!timeline.hours[currentHour].completed) {
      return currentHour;
    }
    
    // Find next uncompleted
    for (let i = 1; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      if (!timeline.hours[hour].completed) {
        return hour;
      }
    }
    
    return null; // All completed
  }
}
```

---

## 🎭 8. POPUP CONTROLLER

### 8.1 Beautiful Start Session Popup

```javascript
class PopupController {
  constructor(sessionController) {
    this.session = sessionController;
    this.activePopup = null;
  }
  
  /**
   * Show session start popup
   */
  showSessionPopup(hour) {
    // Remove existing popup
    this.dismissPopup();
    
    const popup = this.createPopup({
      type: 'session-start',
      hour,
      title: 'ਨਾਮ ਅਭਿਆਸ',
      subtitle: 'Time for Simran',
      primaryButton: {
        text: 'Start',
        icon: '🙏',
        action: () => {
          this.session.startSession(hour);
          this.dismissPopup();
        }
      },
      secondaryButton: {
        text: 'Later',
        action: () => this.dismissPopup()
      }
    });
    
    document.body.appendChild(popup);
    this.activePopup = popup;
    
    // Animate in
    requestAnimationFrame(() => {
      popup.classList.add('visible');
    });
  }
  
  /**
   * Show completion dialog
   */
  showCompletionDialog() {
    const popup = this.createPopup({
      type: 'completion',
      title: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ',
      subtitle: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਿਹ',
      message: 'Naam Abhyas Complete',
      icon: '✓',
      primaryButton: {
        text: 'Continue',
        action: () => this.dismissPopup()
      }
    });
    
    document.body.appendChild(popup);
    this.activePopup = popup;
    
    requestAnimationFrame(() => {
      popup.classList.add('visible');
    });
  }
  
  /**
   * Create popup element
   */
  createPopup(config) {
    const popup = document.createElement('div');
    popup.className = 'naam-popup';
    popup.innerHTML = `
      <div class="naam-popup__backdrop"></div>
      <div class="naam-popup__card">
        ${config.icon ? `<div class="naam-popup__icon">${config.icon}</div>` : ''}
        <h2 class="naam-popup__title">${config.title}</h2>
        <p class="naam-popup__subtitle">${config.subtitle}</p>
        ${config.message ? `<p class="naam-popup__message">${config.message}</p>` : ''}
        <div class="naam-popup__actions">
          ${config.primaryButton ? `
            <button class="naam-popup__btn naam-popup__btn--primary">
              ${config.primaryButton.icon || ''}
              <span>${config.primaryButton.text}</span>
            </button>
          ` : ''}
          ${config.secondaryButton ? `
            <button class="naam-popup__btn naam-popup__btn--secondary">
              ${config.secondaryButton.text}
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    // Attach event listeners
    const primaryBtn = popup.querySelector('.naam-popup__btn--primary');
    const secondaryBtn = popup.querySelector('.naam-popup__btn--secondary');
    
    if (primaryBtn && config.primaryButton?.action) {
      primaryBtn.addEventListener('click', config.primaryButton.action);
    }
    
    if (secondaryBtn && config.secondaryButton?.action) {
      secondaryBtn.addEventListener('click', config.secondaryButton.action);
    }
    
    // Backdrop dismiss
    const backdrop = popup.querySelector('.naam-popup__backdrop');
    backdrop.addEventListener('click', () => this.dismissPopup());
    
    return popup;
  }
  
  /**
   * Dismiss active popup
   */
  dismissPopup() {
    if (this.activePopup) {
      this.activePopup.classList.remove('visible');
      setTimeout(() => {
        this.activePopup.remove();
        this.activePopup = null;
      }, 300);
    }
  }
}
```

---

## 🎨 9. UI COMPONENTS

### 9.1 Home Screen Layout

```html
<div class="naam-home">
  <!-- Header -->
  <header class="naam-header">
    <button class="naam-back-btn">← Home</button>
    <div class="naam-header-pill">
      <span class="streak-icon">🔥</span>
      <span class="streak-count">12</span>
    </div>
    <button class="naam-settings-btn">⚙️</button>
  </header>
  
  <!-- Hero Banner -->
  <section class="naam-hero">
    <h1 class="naam-hero__title">ਵਾਹਿਗੁਰੂ</h1>
    <p class="naam-hero__subtitle">Sacred Hourly Practice</p>
  </section>
  
  <!-- Enable Toggle Card -->
  <section class="naam-card naam-toggle-card">
    <div class="toggle-content">
      <div class="toggle-info">
        <span class="toggle-icon">🔔</span>
        <div>
          <h3>Enable Naam Abhyas</h3>
          <p>Hourly reminders for 2-min Simran</p>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="naam-toggle">
        <span class="toggle-slider"></span>
      </label>
    </div>
  </section>
  
  <!-- Next Session Card -->
  <section class="naam-card naam-next-card">
    <div class="card-header">
      <span class="card-icon">⏰</span>
      <div>
        <h3>Next Naam Abhyas</h3>
        <p>In 23 minutes</p>
      </div>
    </div>
    <div class="session-time">3:00 PM</div>
    <div class="session-progress">
      <div class="progress-dots">
        <!-- 24 dots for hours -->
      </div>
      <p>8 / 24 completed today</p>
    </div>
  </section>
  
  <!-- Timeline Card -->
  <section class="naam-card naam-timeline-card">
    <div class="card-header">
      <span class="card-icon">📅</span>
      <h3>Sacred Day Timeline</h3>
    </div>
    <div class="timeline-scroll">
      <!-- Hour blocks -->
    </div>
  </section>
  
  <!-- Statistics Card -->
  <section class="naam-card naam-stats-card">
    <div class="card-header">
      <span class="card-icon">📊</span>
      <h3>Discipline Dashboard</h3>
    </div>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">12</span>
        <span class="stat-label">Hour Streak</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">8</span>
        <span class="stat-label">Today</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">16m</span>
        <span class="stat-label">Total Time</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">45</span>
        <span class="stat-label">Best Streak</span>
      </div>
    </div>
  </section>
</div>
```


### 9.2 Active Session UI

```html
<div class="naam-session-active">
  <!-- Animated Background -->
  <div class="session-bg-orbs">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
  </div>
  
  <!-- Main Content -->
  <div class="session-content">
    <div class="session-icon-wrap">
      <div class="session-icon">🙏</div>
    </div>
    
    <h2 class="session-title">ਵਾਹਿਗੁਰੂ</h2>
    <p class="session-subtitle">Naam Simran in Progress</p>
    
    <!-- Timer Display -->
    <div class="session-timer">
      <svg class="timer-ring" viewBox="0 0 200 200">
        <circle class="timer-bg" cx="100" cy="100" r="90"/>
        <circle class="timer-progress" cx="100" cy="100" r="90"/>
      </svg>
      <div class="timer-text">
        <span class="timer-value">1:43</span>
        <span class="timer-label">remaining</span>
      </div>
    </div>
    
    <!-- Audio Visualization -->
    <div class="audio-viz">
      <div class="viz-bar"></div>
      <div class="viz-bar"></div>
      <div class="viz-bar"></div>
      <div class="viz-bar"></div>
      <div class="viz-bar"></div>
    </div>
    
    <!-- Controls -->
    <div class="session-controls">
      <button class="session-btn session-btn--secondary">
        Pause
      </button>
      <button class="session-btn session-btn--danger">
        End
      </button>
    </div>
  </div>
</div>
```

### 9.3 Timeline Hour Block

```html
<div class="timeline-hour" data-hour="14">
  <div class="hour-time">2 PM</div>
  <div class="hour-status">
    <span class="status-icon">✓</span>
    <span class="status-label">Completed</span>
  </div>
</div>

<!-- States: completed, current, upcoming, skipped -->
```

---

## 🎬 10. ANIMATIONS (60 FPS)

### 10.1 Animation Principles

```css
/* Use transforms and opacity only (GPU accelerated) */
.animated {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
  backface-visibility: hidden;
}

/* Card entrance */
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.naam-card {
  animation: cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Stagger children */
.naam-card:nth-child(1) { animation-delay: 0ms; }
.naam-card:nth-child(2) { animation-delay: 50ms; }
.naam-card:nth-child(3) { animation-delay: 100ms; }
.naam-card:nth-child(4) { animation-delay: 150ms; }

/* Popup entrance */
@keyframes popupEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.naam-popup.visible .naam-popup__card {
  animation: popupEnter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Timer ring animation */
@keyframes timerProgress {
  from {
    stroke-dashoffset: 565; /* 2πr */
  }
  to {
    stroke-dashoffset: 0;
  }
}

.timer-progress {
  stroke-dasharray: 565;
  animation: timerProgress 120s linear;
}

/* Audio visualization */
@keyframes vizPulse {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

.viz-bar {
  animation: vizPulse 1s ease-in-out infinite;
  transform-origin: bottom;
}

.viz-bar:nth-child(1) { animation-delay: 0s; }
.viz-bar:nth-child(2) { animation-delay: 0.1s; }
.viz-bar:nth-child(3) { animation-delay: 0.2s; }
.viz-bar:nth-child(4) { animation-delay: 0.3s; }
.viz-bar:nth-child(5) { animation-delay: 0.4s; }

/* Completion checkmark */
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.completion-check {
  stroke-dasharray: 100;
  animation: checkmark 0.6s ease-out forwards;
}
```

---

## 🎨 11. CLAYMORPHISM STYLING

### 11.1 Clay Cards (Time-Based)

```css
/* Base card */
.naam-card {
  padding: 24px;
  border-radius: 24px;
  backdrop-filter: blur(20px);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Morning - Soft cushion clay */
[data-time-of-day="morning"] .naam-card {
  background: linear-gradient(145deg, 
    rgba(255, 253, 249, 0.92), 
    rgba(255, 229, 208, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 
    4px 4px 12px rgba(232, 148, 100, 0.08),
    -4px -4px 12px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 4px rgba(232, 148, 100, 0.05);
}

/* Day - Bright white clay */
[data-time-of-day="day"] .naam-card {
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.95), 
    rgba(245, 245, 247, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 
    4px 4px 12px rgba(0, 0, 0, 0.06),
    -4px -4px 12px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 4px rgba(0, 0, 0, 0.03);
}

/* Evening - Golden clay */
[data-time-of-day="evening"] .naam-card {
  background: linear-gradient(145deg, 
    rgba(255, 253, 248, 0.92), 
    rgba(255, 236, 184, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 
    4px 4px 12px rgba(184, 134, 11, 0.08),
    -4px -4px 12px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 4px rgba(184, 134, 11, 0.05);
}

/* Night - Dark glass */
[data-time-of-day="night"] .naam-card {
  background: linear-gradient(145deg, 
    rgba(28, 28, 30, 0.95), 
    rgba(44, 44, 46, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    4px 4px 12px rgba(0, 0, 0, 0.25),
    -4px -4px 12px rgba(255, 255, 255, 0.05),
    inset 2px 2px 4px rgba(255, 255, 255, 0.05),
    inset -2px -2px 4px rgba(0, 0, 0, 0.25);
}

/* Tap feedback */
.naam-card:active {
  transform: scale(0.98);
}
```

### 11.2 Buttons

```css
/* Primary button */
.naam-btn-primary {
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

[data-time-of-day="morning"] .naam-btn-primary {
  background: linear-gradient(145deg, #E8A87C, #D4943A);
  color: #fff;
  box-shadow: 
    0 4px 12px rgba(212, 148, 58, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

[data-time-of-day="night"] .naam-btn-primary {
  background: linear-gradient(145deg, #0A84FF, #007AFF);
  color: #fff;
  box-shadow: 
    0 4px 12px rgba(10, 132, 255, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.naam-btn-primary:active {
  transform: scale(0.95);
}
```

---

## 🔒 12. RACE CONDITION PREVENTION

### 12.1 Problem Analysis

**Old System Issues:**
```javascript
// ❌ PROBLEM: Multiple independent timers
setInterval(() => updateTimer(), 1000);
setTimeout(() => checkCompletion(), 120000);
requestAnimationFrame(() => updateUI());

// ❌ PROBLEM: Multiple audio instances
const audio1 = new Audio();
const audio2 = new Audio(); // Duplicate!

// ❌ PROBLEM: Multiple state sources
localStorage.setItem('timer', time);
sessionStorage.setItem('active', true);
window.timerState = {...};
```

### 12.2 Solution: Single Source of Truth

```javascript
// ✅ SOLUTION: One engine orchestrates everything
class NaamAbhyasEngine {
  constructor() {
    // Single instances only
    this.store = new StateStore();
    this.session = new SessionController(this.store);
    this.audio = new AudioController(this.store);
    this.notifications = new NotificationController(this.store);
    this.timeline = new TimelineEngine(this.store);
    this.popup = new PopupController(this.session);
    
    // Prevent duplicate initialization
    if (window.naamAbhyasEngine) {
      console.warn('Engine already exists');
      return window.naamAbhyasEngine;
    }
    
    window.naamAbhyasEngine = this;
  }
  
  // Single entry point for starting sessions
  async startSession(hour) {
    // Check if already active
    const state = this.store.getState();
    if (state.activeSession?.isActive) {
      console.warn('Session already active - ignoring duplicate request');
      return false;
    }
    
    // Start through controller
    return await this.session.startSession(hour);
  }
}

// Initialize once
const engine = new NaamAbhyasEngine();
```

### 12.3 Mutex Pattern for Critical Operations

```javascript
class SessionController {
  constructor(stateStore) {
    this.store = stateStore;
    this.operationLock = false;
  }
  
  async startSession(hour) {
    // Prevent concurrent starts
    if (this.operationLock) {
      console.warn('Operation in progress');
      return false;
    }
    
    this.operationLock = true;
    
    try {
      // Check state
      const state = this.store.getState();
      if (state.activeSession?.isActive) {
        return false;
      }
      
      // Start session
      // ... implementation ...
      
      return true;
    } finally {
      this.operationLock = false;
    }
  }
}
```

---

## 🔄 13. BACKGROUND SUPPORT

### 13.1 Lifecycle Management

```javascript
class NaamAbhyasEngine {
  constructor() {
    // ... initialization ...
    
    this.setupLifecycleHandlers();
  }
  
  setupLifecycleHandlers() {
    // Page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackground();
      } else {
        this.handleForeground();
      }
    });
    
    // Capacitor app state
    if (window.Capacitor?.Plugins?.App) {
      window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          this.handleBackground();
        } else {
          this.handleForeground();
        }
      });
    }
    
    // Before unload
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
  }
  
  handleBackground() {
    const state = this.store.getState();
    
    if (state.activeSession?.isActive) {
      // Save timestamp for restoration
      const backgroundData = {
        sessionStartTime: state.activeSession.startTime,
        duration: state.activeSession.duration,
        backgroundTime: Date.now()
      };
      
      localStorage.setItem('naamAbhyas_background', JSON.stringify(backgroundData));
      
      // Audio will pause automatically on mobile
      // Timer uses timestamps, so it will be accurate on return
    }
  }
  
  handleForeground() {
    const backgroundData = localStorage.getItem('naamAbhyas_background');
    
    if (!backgroundData) return;
    
    const data = JSON.parse(backgroundData);
    const state = this.store.getState();
    
    if (state.activeSession?.isActive) {
      // Calculate elapsed time
      const elapsed = Math.floor((Date.now() - data.sessionStartTime) / 1000);
      const remaining = Math.max(0, data.duration - elapsed);
      
      if (remaining === 0) {
        // Session completed in background
        this.session.completeSession();
      } else {
        // Resume audio
        this.audio.play();
      }
    }
    
    // Clear background data
    localStorage.removeItem('naamAbhyas_background');
  }
}
```

### 13.2 Timestamp-Based Timer (No Intervals)

```javascript
class SessionController {
  startUpdateLoop() {
    const update = () => {
      const state = this.store.getState();
      const session = state.activeSession;
      
      if (!session?.isActive) {
        this.stopUpdateLoop();
        return;
      }
      
      // Calculate from timestamp (NOT increment counter)
      const now = Date.now();
      const elapsed = Math.floor((now - session.startTime) / 1000);
      const remaining = Math.max(0, session.duration - elapsed);
      
      // Update UI
      this.updateTimerDisplay(remaining);
      
      // Check completion
      if (remaining === 0) {
        this.completeSession();
        return;
      }
      
      // Continue loop
      this.rafId = requestAnimationFrame(update);
    };
    
    this.rafId = requestAnimationFrame(update);
  }
  
  updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const display = `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    const timerEl = document.querySelector('.timer-value');
    if (timerEl) {
      timerEl.textContent = display;
    }
    
    // Update progress ring
    const progress = ((this.store.getState().settings.sessionDuration - seconds) / 
                      this.store.getState().settings.sessionDuration) * 100;
    this.updateProgressRing(progress);
  }
}
```

---

## 💾 14. PERSISTENCE STRATEGY

### 14.1 Storage Architecture

```javascript
const STORAGE_KEYS = {
  STATE: 'naamAbhyas_state',           // Main state
  BACKGROUND: 'naamAbhyas_background',  // Background recovery
  HISTORY: 'naamAbhyas_history',        // Historical data
  SETTINGS: 'naamAbhyas_settings'       // User preferences
};

class StorageUtils {
  // Save with error handling
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Storage save failed:', error);
      return false;
    }
  }
  
  // Load with fallback
  static load(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage load failed:', error);
      return defaultValue;
    }
  }
  
  // Clear specific key
  static clear(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage clear failed:', error);
      return false;
    }
  }
  
  // Check storage availability
  static isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### 14.2 State Restoration

```javascript
class StateStore {
  loadState() {
    const saved = StorageUtils.load(STORAGE_KEYS.STATE);
    
    if (!saved) {
      return this.getDefaultState();
    }
    
    // Validate loaded state
    const state = this.validateState(saved);
    
    // Check if day changed - reset timeline
    const today = new Date().toISOString().split('T')[0];
    if (state.timeline.date !== today) {
      state.timeline = this.createTodayTimeline();
      state.stats.todayCompleted = 0;
    }
    
    // Clear any stale active sessions
    if (state.activeSession?.isActive) {
      const elapsed = Math.floor((Date.now() - state.activeSession.startTime) / 1000);
      if (elapsed >= state.activeSession.duration) {
        // Session should have completed
        state.activeSession = null;
      }
    }
    
    return state;
  }
  
  validateState(state) {
    // Ensure all required properties exist
    const defaults = this.getDefaultState();
    
    return {
      ...defaults,
      ...state,
      stats: { ...defaults.stats, ...state.stats },
      settings: { ...defaults.settings, ...state.settings }
    };
  }
}
```

---

## 🎯 15. MAIN ENGINE ORCHESTRATOR

### 15.1 Complete NaamAbhyasEngine Implementation

```javascript
/**
 * NAAM ABHYAS ENGINE
 * Single source of truth - orchestrates all subsystems
 */
class NaamAbhyasEngine {
  constructor() {
    // Singleton pattern
    if (window.naamAbhyasEngine) {
      return window.naamAbhyasEngine;
    }
    
    // Initialize subsystems
    this.store = new StateStore();
    this.audio = new AudioController(this.store);
    this.session = new SessionController(this.store, this.audio);
    this.notifications = new NotificationController(this.store, this);
    this.timeline = new TimelineEngine(this.store);
    this.popup = new PopupController(this.session);
    this.ui = new UIController(this.store, this);
    
    // Setup lifecycle
    this.setupLifecycleHandlers();
    
    // Subscribe to state changes
    this.store.subscribe((state) => this.onStateChange(state));
    
    // Global reference
    window.naamAbhyasEngine = this;
    
    // Initialize UI
    this.ui.render();
  }
  
  /**
   * Initialize the system
   */
  async initialize() {
    const state = this.store.getState();
    
    // Request notification permission if enabled
    if (state.settings.notificationsEnabled) {
      await this.notifications.requestPermission();
    }
    
    // Schedule notifications if enabled
    if (state.isEnabled) {
      await this.notifications.scheduleHourlyAlarms();
    }
    
    // Check for pending notification tap
    this.checkNotificationTap();
  }
  
  /**
   * Enable/disable Naam Abhyas
   */
  async setEnabled(enabled) {
    this.store.setState({ isEnabled: enabled });
    
    if (enabled) {
      await this.notifications.scheduleHourlyAlarms();
    } else {
      this.notifications.clearAllAlarms();
    }
    
    this.ui.render();
  }
  
  /**
   * Start a session (main entry point)
   */
  async startSession(hour = null) {
    const currentHour = hour ?? new Date().getHours();
    const success = await this.session.startSession(currentHour);
    
    if (success) {
      this.ui.showSessionUI();
    }
    
    return success;
  }
  
  /**
   * Handle state changes
   */
  onStateChange(state) {
    // Update UI
    this.ui.render();
    
    // Save to storage
    this.store.saveState();
  }
  
  /**
   * Lifecycle handlers
   */
  setupLifecycleHandlers() {
    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackground();
      } else {
        this.handleForeground();
      }
    });
    
    // Capacitor
    if (window.Capacitor?.Plugins?.App) {
      window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          this.handleBackground();
        } else {
          this.handleForeground();
        }
      });
    }
  }
  
  handleBackground() {
    this.session.handleBackground();
  }
  
  handleForeground() {
    this.session.handleForeground();
  }
  
  /**
   * Check if opened from notification
   */
  checkNotificationTap() {
    const params = new URLSearchParams(window.location.search);
    const hour = params.get('notification_hour');
    
    if (hour !== null) {
      this.popup.showSessionPopup(parseInt(hour));
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.session.stopUpdateLoop();
    this.audio.destroy();
    this.notifications.clearAllAlarms();
    delete window.naamAbhyasEngine;
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const engine = new NaamAbhyasEngine();
  engine.initialize();
});
```

---

## 🧪 16. ERROR HANDLING & EDGE CASES

### 16.1 Comprehensive Error Prevention

```javascript
class ErrorHandler {
  // Prevent duplicate sessions
  static preventDuplicateSession(activeSession) {
    if (activeSession?.isActive) {
      console.warn('[NaamAbhyas] Session already active - ignoring request');
      return false;
    }
    return true;
  }
  
  // Prevent duplicate timers
  static preventDuplicateTimer(rafId) {
    if (rafId !== null) {
      console.warn('[NaamAbhyas] Timer already running');
      return false;
    }
    return true;
  }
  
  // Prevent duplicate audio
  static preventDuplicateAudio(audioElement) {
    if (audioElement && !audioElement.paused) {
      console.warn('[NaamAbhyas] Audio already playing');
      return false;
    }
    return true;
  }
  
  // Handle audio load errors
  static async handleAudioError(error) {
    console.error('[NaamAbhyas] Audio error:', error);
    
    // Show user-friendly message
    this.showToast('Audio failed to load. Session will continue silently.');
    
    // Continue session without audio
    return true;
  }
  
  // Handle notification permission denied
  static handleNotificationDenied() {
    console.warn('[NaamAbhyas] Notification permission denied');
    
    this.showToast('Enable notifications to receive hourly reminders');
  }
  
  // Handle storage quota exceeded
  static handleStorageError(error) {
    console.error('[NaamAbhyas] Storage error:', error);
    
    try {
      // Clear old history data
      const historyKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('naamAbhyas_history_'));
      
      historyKeys.forEach(key => localStorage.removeItem(key));
      
      this.showToast('Storage cleaned. Please try again.');
    } catch (e) {
      this.showToast('Storage full. Some features may not work.');
    }
  }
  
  // Show toast notification
  static showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'naam-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });
    
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
```

### 16.2 Edge Cases Handled

```javascript
// Edge Case 1: Day boundary crossing
class TimelineEngine {
  getTodayTimeline() {
    const state = this.store.getState();
    const today = new Date().toISOString().split('T')[0];
    
    // Reset timeline if day changed
    if (state.timeline.date !== today) {
      console.log('[NaamAbhyas] Day changed - resetting timeline');
      
      const newTimeline = this.createTodayTimeline();
      this.store.setState({ 
        timeline: newTimeline,
        stats: {
          ...state.stats,
          todayCompleted: 0
        }
      });
      
      return newTimeline;
    }
    
    return state.timeline;
  }
}

// Edge Case 2: App killed during session
class SessionController {
  handleForeground() {
    const state = this.store.getState();
    const session = state.activeSession;
    
    if (!session?.isActive) return;
    
    // Recalculate from timestamp
    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    const remaining = Math.max(0, session.duration - elapsed);
    
    if (remaining === 0) {
      // Session completed while app was closed
      console.log('[NaamAbhyas] Session completed in background');
      this.completeSession();
    } else if (elapsed > session.duration + 300) {
      // Session is way overdue (>5 min) - mark as skipped
      console.log('[NaamAbhyas] Session timeout - marking as skipped');
      this.store.setState({ activeSession: null });
    } else {
      // Resume session
      console.log('[NaamAbhyas] Resuming session');
      this.audio.play();
      this.startUpdateLoop();
    }
  }
}

// Edge Case 3: Multiple browser tabs
class NaamAbhyasEngine {
  constructor() {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'naamAbhyas_state') {
        console.log('[NaamAbhyas] State updated in another tab');
        this.store.state = JSON.parse(e.newValue);
        this.ui.render();
      }
    });
  }
}
```

---

## 📊 17. PERFORMANCE OPTIMIZATION

### 17.1 Memory Management

```javascript
class NaamAbhyasEngine {
  // Cleanup on page unload
  setupCleanup() {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  cleanup() {
    // Stop timers
    if (this.session.rafId) {
      cancelAnimationFrame(this.session.rafId);
    }
    
    // Stop audio
    this.audio.destroy();
    
    // Clear event listeners
    this.store.listeners.clear();
    
    // Save state
    this.store.saveState();
    
    console.log('[NaamAbhyas] Cleanup complete');
  }
}
```

### 17.2 Rendering Optimization

```javascript
class UIController {
  constructor(store, engine) {
    this.store = store;
    this.engine = engine;
    this.renderScheduled = false;
    this.lastRender = 0;
  }
  
  // Debounced render (max 60 FPS)
  render() {
    if (this.renderScheduled) return;
    
    this.renderScheduled = true;
    
    requestAnimationFrame((timestamp) => {
      // Throttle to 60 FPS
      if (timestamp - this.lastRender < 16) {
        this.renderScheduled = false;
        return;
      }
      
      this.doRender();
      this.lastRender = timestamp;
      this.renderScheduled = false;
    });
  }
  
  doRender() {
    const state = this.store.getState();
    
    // Update only changed elements (virtual DOM concept)
    this.updateTimeline(state.timeline);
    this.updateStats(state.stats);
    this.updateNextSession(state);
  }
  
  // Update only changed DOM elements
  updateTimeline(timeline) {
    const container = document.querySelector('.timeline-scroll');
    if (!container) return;
    
    timeline.hours.forEach((hourData, index) => {
      const hourEl = container.children[index];
      if (!hourEl) return;
      
      // Only update if changed
      const isCompleted = hourData.completed;
      const wasCompleted = hourEl.classList.contains('completed');
      
      if (isCompleted !== wasCompleted) {
        hourEl.classList.toggle('completed', isCompleted);
      }
    });
  }
}
```

### 17.3 Asset Optimization

```javascript
// Lazy load audio
class AudioController {
  async initialize() {
    if (this.initialized) return;
    
    // Only load audio when needed
    this.audio = new Audio();
    this.audio.src = '../assets/audio/waheguru-simran.mp3';
    this.audio.preload = 'metadata'; // Load metadata only
    
    this.initialized = true;
  }
  
  async play() {
    await this.initialize();
    
    // Preload on first play
    if (this.audio.readyState < 3) {
      await new Promise((resolve) => {
        this.audio.addEventListener('canplaythrough', resolve, { once: true });
        this.audio.load();
      });
    }
    
    await this.audio.play();
  }
}
```

---

## 🚀 18. IMPLEMENTATION PLAN

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create folder structure
- [ ] Implement StateStore
- [ ] Implement StorageUtils
- [ ] Implement TimeUtils
- [ ] Setup base CSS (colors, typography)
- [ ] Create time-based theme system

### Phase 2: Session Engine (Week 2)
- [ ] Implement SessionController
- [ ] Implement AudioController  
- [ ] Implement timestamp-based timer
- [ ] Add background/foreground handlers
- [ ] Test session lifecycle

### Phase 3: UI Components (Week 3)
- [ ] Design and implement Home Screen
- [ ] Design and implement Session Card
- [ ] Design and implement Timeline
- [ ] Design and implement Statistics Card
- [ ] Design and implement Popup System
- [ ] Add animations (60 FPS)

### Phase 4: Notifications (Week 4)
- [ ] Implement NotificationController
- [ ] Setup Capacitor Local Notifications
- [ ] Integrate with guaranteed-alarm-system.js
- [ ] Test hourly notifications
- [ ] Handle notification taps

### Phase 5: Integration & Polish (Week 5)
- [ ] Integrate with existing ANHAD navigation
- [ ] Add Settings panel
- [ ] Implement completion dialog
- [ ] Add haptic feedback
- [ ] Test on iOS and Android

### Phase 6: Testing & Optimization (Week 6)
- [ ] Race condition testing
- [ ] Background/foreground testing
- [ ] Memory leak testing
- [ ] Performance optimization
- [ ] Accessibility testing
- [ ] User acceptance testing

---

## 🎯 19. SUCCESS METRICS

### Functional Requirements
- ✅ Zero race conditions
- ✅ Zero duplicate timers
- ✅ Zero duplicate audio instances
- ✅ Zero duplicate notifications
- ✅ Zero state inconsistencies
- ✅ 100% background restoration accuracy
- ✅ <100ms UI response time
- ✅ 60 FPS animations

### User Experience
- ✅ Beautiful, spiritual interface
- ✅ Smooth, jank-free scrolling
- ✅ Instant feedback on all interactions
- ✅ Clear visual hierarchy
- ✅ Accessible to all users
- ✅ Works offline
- ✅ Consistent with ANHAD design

### Technical Quality
- ✅ Single source of truth
- ✅ Clear separation of concerns
- ✅ Maintainable codebase
- ✅ Well-documented code
- ✅ Comprehensive error handling
- ✅ Memory efficient
- ✅ Production-ready

---

## 🔍 20. RACE CONDITION ANALYSIS

### 20.1 Old System Problems

```
❌ Problem 1: Multiple Timers
┌─────────────────────────────────────┐
│ setInterval #1 (updates UI)        │ ← Running
│ setTimeout #1 (check completion)   │ ← Running
│ requestAnimationFrame #1           │ ← Running
└─────────────────────────────────────┘
         ↓ User taps "Start" again
┌─────────────────────────────────────┐
│ setInterval #2 (updates UI)        │ ← Running
│ setTimeout #2 (check completion)   │ ← Running
│ requestAnimationFrame #2           │ ← Running
└─────────────────────────────────────┘
Result: 6 timers interfering!

❌ Problem 2: Multiple Audio
┌─────────────────────────────────────┐
│ Audio #1 playing                    │
└─────────────────────────────────────┘
         ↓ User taps "Start" again
┌─────────────────────────────────────┐
│ Audio #1 still playing              │
│ Audio #2 playing                    │
└─────────────────────────────────────┘
Result: Overlapping audio!

❌ Problem 3: State Inconsistency
localStorage:  { active: true, time: 120 }
sessionStorage: { active: false, time: 90 }
window.state:   { active: true, time: 110 }
Result: No one knows the truth!
```

### 20.2 New System Solution

```
✅ Solution: Single Engine Pattern

┌─────────────────────────────────────────────────┐
│         NAAM ABHYAS ENGINE (Singleton)          │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  SessionController                        │ │
│  │  - operationLock: boolean                 │ │
│  │  - rafId: number | null                   │ │
│  │                                           │ │
│  │  startSession() {                         │ │
│  │    if (lock) return false; // PREVENT    │ │
│  │    if (rafId) return false; // PREVENT   │ │
│  │    lock = true;                           │ │
│  │    rafId = requestAnimationFrame(...);    │ │
│  │  }                                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  AudioController                          │ │
│  │  - audio: HTMLAudioElement | null         │ │
│  │                                           │ │
│  │  play() {                                 │ │
│  │    if (audio?.playing) return; // PREVENT│ │
│  │    await audio.play();                    │ │
│  │  }                                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  StateStore (Single Source of Truth)      │ │
│  │  - state: Object                          │ │
│  │                                           │ │
│  │  setState(updates) {                      │ │
│  │    this.state = {...state, ...updates};   │ │
│  │    this.save();                           │ │
│  │    this.notify();                         │ │
│  │  }                                        │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Result: ONE timer, ONE audio, ONE state!
```

---

## 🎨 21. DESIGN MOCKUPS (ASCII)

### 21.1 Home Screen

```
┌─────────────────────────────────────────────┐
│  ← Home         🔥 12         ⚙️           │
├─────────────────────────────────────────────┤
│                                             │
│              ਵਾਹਿਗੁਰੂ                       │
│        Sacred Hourly Practice               │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔔  Enable Naam Abhyas       [  ]  │   │
│  │     Hourly reminders            ◯   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ⏰  Next Naam Abhyas                │   │
│  │     In 23 minutes                   │   │
│  │                                     │   │
│  │         3:00 PM                     │   │
│  │                                     │   │
│  │  ● ● ● ● ● ● ● ● ○ ○ ○ ○ ○ ○ ○ ○   │   │
│  │  8 / 24 completed today            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📅  Sacred Day Timeline             │   │
│  │                                     │   │
│  │  12 AM  ✓    6 AM   ✓    12 PM ✓   │   │
│  │   1 AM  ✓    7 AM   ✓     1 PM ✓   │   │
│  │   2 AM  ✓    8 AM   ✓     2 PM ✓   │   │
│  │   3 AM  ○    9 AM   ○     3 PM •   │   │
│  │   4 AM  ○   10 AM   ○     4 PM ○   │   │
│  │   5 AM  ○   11 AM   ○     5 PM ○   │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📊  Discipline Dashboard            │   │
│  │                                     │   │
│  │     ╭───╮                           │   │
│  │    ╱ 33% ╲      🔥 12  📅 8         │   │
│  │   │  ○○○  │     Hour   Today        │   │
│  │    ╲     ╱      Streak              │   │
│  │     ╰───╯                           │   │
│  │                 ⏱️ 16m  🏆 45        │   │
│  │                 Total   Best        │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 21.2 Active Session

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│               🙏                            │
│                                             │
│           ਵਾਹਿਗੁਰੂ                          │
│      Naam Simran in Progress                │
│                                             │
│           ╭─────────╮                       │
│          ╱           ╲                      │
│         │    1:43     │                     │
│         │  remaining  │                     │
│          ╲           ╱                      │
│           ╰─────────╯                       │
│                                             │
│          ┃┃ ┃ ┃┃ ┃ ┃┃                       │
│          Audio Playing                      │
│                                             │
│         [  Pause  ]  [ End ]                │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### 21.3 Completion Dialog

```
┌─────────────────────────────────────────────┐
│                 ╭───────╮                   │
│                │    ✓    │                  │
│                 ╰───────╯                   │
│                                             │
│      ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ                 │
│      ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਿਹ                │
│                                             │
│         Naam Abhyas Complete                │
│      ✓ One more hour completed              │
│                                             │
│           [   Continue   ]                  │
│                                             │
└─────────────────────────────────────────────┘
```

### 21.4 Start Session Popup

```
┌─────────────────────────────────────────────┐
│                                             │
│           ਨਾਮ ਅਭਿਆਸ                         │
│          Time for Simran                    │
│                                             │
│     Take 2 minutes to remember              │
│            Waheguru Ji                      │
│                                             │
│       [  🙏  Start  ]  [ Later ]            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔐 22. SECURITY & PRIVACY

### 22.1 Data Privacy
- All data stored locally (localStorage)
- No external API calls
- No user tracking
- No analytics
- No data collection
- User controls all data

### 22.2 Secure Storage
```javascript
class SecureStorage {
  // Encrypt sensitive data (optional)
  static encrypt(data) {
    // Use Web Crypto API if needed
    return data; // Plain for now
  }
  
  // Validate data integrity
  static validateData(data) {
    if (!data) return false;
    if (typeof data !== 'object') return false;
    
    // Check required fields
    const required = ['isEnabled', 'stats', 'timeline'];
    return required.every(field => field in data);
  }
}
```

---

## 📱 23. MOBILE OPTIMIZATION

### 23.1 Touch Interactions
```css
/* Large touch targets (44x44px minimum) */
.naam-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* Prevent double-tap zoom */
button, a, .tappable {
  touch-action: manipulation;
}

/* Remove tap highlight */
* {
  -webkit-tap-highlight-color: transparent;
}
```

### 23.2 iOS Safe Areas
```css
.naam-home {
  padding-top: max(env(safe-area-inset-top), 24px);
  padding-bottom: max(env(safe-area-inset-bottom), 24px);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### 23.3 Performance
- Use CSS transforms (GPU accelerated)
- Lazy load images
- Defer non-critical JavaScript
- Use requestAnimationFrame for animations
- Minimize reflows and repaints

---

## ♿ 24. ACCESSIBILITY

### 24.1 ARIA Labels
```html
<button aria-label="Start Naam Abhyas session">
  🙏 Start
</button>

<div role="timer" aria-live="polite" aria-atomic="true">
  <span aria-label="Time remaining">1:43</span>
</div>

<div role="progressbar" 
     aria-valuenow="33" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Daily completion progress">
</div>
```

### 24.2 Keyboard Navigation
```javascript
// Trap focus in popup
class PopupController {
  trapFocus(popup) {
    const focusableElements = popup.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    popup.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
      
      if (e.key === 'Escape') {
        this.dismissPopup();
      }
    });
  }
}
```

### 24.3 Screen Reader Support
```javascript
// Announce state changes
class UIController {
  announceToScreenReader(message) {
    const liveRegion = document.getElementById('sr-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }
  
  onSessionComplete() {
    this.announceToScreenReader('Naam Abhyas session completed. One hour added to your streak.');
  }
}
```

---

## 🧩 25. INTEGRATION WITH ANHAD

### 25.1 Navigation Integration
```javascript
// Use existing smooth-navigation.js
class NaamAbhyasUI {
  setupNavigation() {
    const backBtn = document.querySelector('.naam-back-btn');
    
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Use ANHAD navigation system
      if (window.navigateTo) {
        window.navigateTo('../index.html');
      } else {
        window.location.href = '../index.html';
      }
    });
  }
}
```

### 25.2 Theme Integration
```javascript
// Use existing global-theme.js
class NaamAbhyasTheme {
  getCurrentTheme() {
    const theme = localStorage.getItem('anhad_theme') || 'auto';
    const timeOfDay = this.getTimeOfDay();
    
    return {
      mode: theme,
      timeOfDay: timeOfDay,
      colors: this.getColors(theme, timeOfDay)
    };
  }
  
  getTimeOfDay() {
    const forced = localStorage.getItem('anhad_forced_time_of_day');
    if (forced) return forced;
    
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 16) return 'day';
    if (hour >= 16 && hour < 20) return 'evening';
    return 'night';
  }
}
```

### 25.3 Audio Integration
```javascript
// Use existing anhad-audio-singleton.js
class AudioController {
  async initialize() {
    // Check if global audio coordinator exists
    if (window.AnhadAudioCoordinator) {
      // Coordinate with other audio sources
      await window.AnhadAudioCoordinator.requestAudioSession('naam-abhyas');
    }
    
    // Initialize audio element
    this.audio = new Audio();
    this.audio.src = '../assets/audio/waheguru-simran.mp3';
    this.audio.loop = true;
  }
  
  async play() {
    // Pause other audio sources
    if (window.AnhadAudioCoordinator) {
      await window.AnhadAudioCoordinator.pauseOtherSessions('naam-abhyas');
    }
    
    await this.audio.play();
  }
}
```

---

## 🔄 26. MIGRATION STRATEGY

### 26.1 Phase 1: Parallel Development
- Keep old Naam Abhyas running
- Build new system in separate folder
- Test independently

### 26.2 Phase 2: User Testing
- Deploy new system to beta users
- Collect feedback
- Fix issues

### 26.3 Phase 3: Data Migration
```javascript
class DataMigration {
  static migrateOldData() {
    // Check for old data
    const oldState = localStorage.getItem('naamAbhyas_old_state');
    if (!oldState) return;
    
    const old = JSON.parse(oldState);
    
    // Migrate to new structure
    const newState = {
      isEnabled: old.enabled || false,
      stats: {
        currentStreak: old.streak || 0,
        longestStreak: old.bestStreak || 0,
        totalSessions: old.totalSessions || 0,
        totalMinutes: old.totalMinutes || 0,
        todayCompleted: old.todayCount || 0,
        perfectDays: old.perfectDays || 0
      },
      timeline: this.createTodayTimeline(),
      settings: {
        sessionDuration: 120,
        audioVolume: 0.7,
        notificationsEnabled: true,
        hapticEnabled: true
      }
    };
    
    // Save new format
    localStorage.setItem('naamAbhyas_state', JSON.stringify(newState));
    
    // Archive old data
    localStorage.setItem('naamAbhyas_old_state_backup', oldState);
    localStorage.removeItem('naamAbhyas_old_state');
    
    console.log('[Migration] Data migrated successfully');
  }
}
```

### 26.4 Phase 4: Replace Old System
- Remove old files
- Update navigation links
- Clear old localStorage keys

---

## 📝 27. CODE DOCUMENTATION STANDARDS

### 27.1 File Headers
```javascript
/**
 * ═══════════════════════════════════════════════════════════════════
 * NAAM ABHYAS - SESSION CONTROLLER
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Manages session lifecycle using timestamp-based timing.
 * Never uses setInterval or setTimeout for timing.
 * All time calculations based on Date.now() for accuracy.
 * 
 * Key Principles:
 * - Single active session at a time
 * - Timestamp-based (survives background)
 * - RAF-based update loop (smooth 60 FPS)
 * - Mutex lock prevents race conditions
 * 
 * @module SessionController
 * @requires StateStore
 * @requires AudioController
 * ═══════════════════════════════════════════════════════════════════
 */
```

### 27.2 Function Documentation
```javascript
/**
 * Start a new Naam Abhyas session
 * 
 * @param {number} [hour] - Optional hour to start (0-23). Defaults to current hour.
 * @returns {Promise<boolean>} - True if session started, false if already active
 * 
 * @example
 * // Start session for current hour
 * const started = await sessionController.startSession();
 * 
 * @example
 * // Start session for specific hour
 * const started = await sessionController.startSession(14); // 2 PM
 */
async startSession(hour = null) {
  // Implementation...
}
```

### 27.3 Inline Comments
```javascript
// Calculate elapsed time from start timestamp
// Using Math.floor ensures we don't jump seconds
const elapsed = Math.floor((Date.now() - session.startTime) / 1000);

// Calculate remaining time
// Math.max ensures we never go negative
const remaining = Math.max(0, session.duration - elapsed);

// Update UI only if changed (prevent unnecessary reflows)
if (this.lastDisplayedTime !== remaining) {
  this.updateTimerDisplay(remaining);
  this.lastDisplayedTime = remaining;
}
```

---

## 🧪 28. TESTING STRATEGY

### 28.1 Unit Tests
```javascript
// Test: Session start prevents duplicates
test('Session start prevents duplicates', () => {
  const engine = new NaamAbhyasEngine();
  
  const result1 = engine.startSession(14);
  expect(result1).toBe(true);
  
  const result2 = engine.startSession(14);
  expect(result2).toBe(false); // Should be prevented
  
  const state = engine.store.getState();
  expect(state.activeSession).not.toBeNull();
});

// Test: Timer accuracy after background
test('Timer is accurate after background', () => {
  const engine = new NaamAbhyasEngine();
  
  // Start session
  engine.startSession(14);
  const startTime = Date.now();
  
  // Simulate 30 seconds in background
  jest.advanceTimersByTime(30000);
  
  // Return to foreground
  engine.handleForeground();
  
  const state = engine.store.getState();
  const elapsed = Math.floor((Date.now() - state.activeSession.startTime) / 1000);
  
  expect(elapsed).toBe(30);
});
```

### 28.2 Integration Tests
```javascript
// Test: Complete session flow
test('Complete session flow', async () => {
  const engine = new NaamAbhyasEngine();
  
  // Enable system
  await engine.setEnabled(true);
  
  // Start session
  const started = await engine.startSession(14);
  expect(started).toBe(true);
  
  // Fast-forward to completion
  jest.advanceTimersByTime(120000);
  
  // Check completion
  const state = engine.store.getState();
  expect(state.activeSession).toBeNull();
  expect(state.timeline.hours[14].completed).toBe(true);
  expect(state.stats.totalSessions).toBe(1);
  expect(state.stats.currentStreak).toBe(1);
});
```

### 28.3 Manual Testing Checklist
- [ ] Start session works
- [ ] Audio plays correctly
- [ ] Timer counts down accurately
- [ ] Session completes automatically
- [ ] Completion dialog appears
- [ ] Stats update correctly
- [ ] Timeline updates correctly
- [ ] Notifications trigger hourly
- [ ] Notification tap opens popup
- [ ] Background/foreground works
- [ ] Day boundary resets timeline
- [ ] Multiple tabs sync state
- [ ] Settings persist
- [ ] Accessibility works
- [ ] Animations are smooth

---

## 🎯 29. FINAL DELIVERABLES CHECKLIST

### 29.1 Core Files
- [ ] `NaamAbhyasEngine.js` - Main orchestrator
- [ ] `SessionController.js` - Session management
- [ ] `AudioController.js` - Audio playback
- [ ] `NotificationController.js` - Hourly notifications
- [ ] `StateStore.js` - State management
- [ ] `TimelineEngine.js` - Hour timeline
- [ ] `PopupController.js` - Popup system
- [ ] `UIController.js` - UI rendering
- [ ] `StorageUtils.js` - Persistence
- [ ] `TimeUtils.js` - Time calculations
- [ ] `ThemeUtils.js` - Time-based themes

### 29.2 UI Files
- [ ] `index.html` - Main page
- [ ] `naam-abhyas-core.css` - Base styles
- [ ] `naam-abhyas-cards.css` - Card components
- [ ] `naam-abhyas-timeline.css` - Timeline styles
- [ ] `naam-abhyas-popup.css` - Popup styles
- [ ] `naam-abhyas-animations.css` - Animations
- [ ] `naam-abhyas-themes.css` - Time-based colors

### 29.3 Assets
- [ ] `waheguru-simran.mp3` - Audio file
- [ ] `completion-illustration.svg` - Success icon
- [ ] Icon assets (if needed)

### 29.4 Documentation
- [ ] Architecture document (this file)
- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
- [ ] Migration guide

### 29.5 Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual test results
- [ ] Performance benchmarks
- [ ] Accessibility audit

---

## 🌟 30. CONCLUSION

This architecture document provides a complete blueprint for rebuilding Naam Abhyas as a production-grade feature that:

✅ **Eliminates all race conditions** through single-engine pattern
✅ **Provides beautiful UI** with time-based adaptive colors
✅ **Ensures reliability** with timestamp-based timing
✅ **Maintains state** across background/foreground transitions
✅ **Integrates seamlessly** with existing ANHAD ecosystem
✅ **Performs optimally** with 60 FPS animations
✅ **Scales maintainably** with clear separation of concerns

### Key Architectural Decisions

1. **Single Engine Pattern**: One orchestrator controls all subsystems
2. **Timestamp-Based Timing**: No intervals, only timestamps
3. **Single Source of Truth**: StateStore manages all state
4. **RAF-Based Updates**: Smooth 60 FPS rendering
5. **Mutex Locks**: Prevent concurrent operations
6. **Time-Based Themes**: Automatic color adaptation
7. **Claymorphism Design**: Premium iOS-inspired UI

### Next Steps

1. Review and approve architecture
2. Create project structure
3. Begin Phase 1 implementation
4. Iterate based on feedback
5. Deploy and monitor

---

## 📞 SUPPORT & QUESTIONS

For any questions or clarifications about this architecture:

1. Review the relevant section above
2. Check the code examples
3. Consult the design mockups
4. Test the concepts in isolation

**This is a complete production-ready architecture. No patches. No compromises. Built right from scratch.**

---

*Document Version: 1.0*  
*Last Updated: 2026-07-22*  
*Author: Principal Software Architect*

═══════════════════════════════════════════════════════════════════
END OF ARCHITECTURE DOCUMENT
═══════════════════════════════════════════════════════════════════
