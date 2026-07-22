# NAAM ABHYAS - QUICK REFERENCE GUIDE
## Essential Information at a Glance

---

## 🎯 THE PROBLEM

**Old System:**
- Multiple timers interfering (race conditions)
- Duplicate audio instances overlapping
- State inconsistency (localStorage vs sessionStorage vs window)
- Poor UI/UX
- Difficult to maintain
- Breaks on background/foreground

**Result:** Buggy, unreliable, frustrating user experience

---

## ✅ THE SOLUTION

**New System - Single Engine Pattern:**

```
ONE Engine → ONE Timer → ONE Audio → ONE State → ONE Source of Truth
```

**Key Principle:** Everything flows through a single orchestrator (NaamAbhyasEngine)

---

## 🏗️ ARCHITECTURE (5-Second Version)

```
┌──────────────────────────────────────┐
│     NaamAbhyasEngine (Boss)          │
│  ┌────────────────────────────────┐  │
│  │ SessionController              │  │
│  │ - Timestamp-based timing       │  │
│  │ - RAF update loop              │  │
│  │ - Mutex lock                   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ AudioController                │  │
│  │ - Single audio instance        │  │
│  │ - Auto-loop                    │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ StateStore                     │  │
│  │ - Single source of truth       │  │
│  │ - Auto-persistence             │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```


---

## 🎨 DESIGN LANGUAGE

**Style:** Modern iOS + Soft Claymorphism + Spiritual

**Colors:** Time-based adaptation
- **Morning:** Warm cream (#FFF5EC) + peach
- **Day:** Clean white (#FAF8F5) + sky blue
- **Evening:** Golden hour (#FFF8E7) + gold
- **Night:** Deep black (#0D0D0F) + dark blue

**Typography:**
- Gurmukhi: Noto Sans Gurmukhi (sacred)
- English: SF Pro / Inter (modern)

**Animation:** All 60 FPS, GPU-accelerated (transform + opacity only)

---

## 🔑 KEY COMPONENTS

### 1. StateStore (Single Source of Truth)
```javascript
{
  isEnabled: boolean,
  activeSession: { startTime, duration, hour } | null,
  timeline: { date, hours: [] },
  stats: { streak, total, today },
  settings: { duration, volume }
}
```

### 2. SessionController (Timestamp-Based)
```javascript
startSession(hour) {
  // Check lock
  // Save startTime = Date.now()
  // Start RAF loop
  // Calculate: remaining = duration - (now - startTime)
}
```

### 3. AudioController (Single Instance)
```javascript
play() {
  // Check if already playing
  // Play waheguru-simran.mp3
  // Loop automatically
}
```

### 4. NotificationController (Hourly)
```javascript
scheduleHourlyAlarms() {
  // For each hour 0-23
  // Schedule notification
  // On tap → open popup
}
```

---

## 🚀 USER FLOW

```
Every hour at :00
    ↓
Notification arrives
    ↓
User taps notification
    ↓
Beautiful popup appears
    [Start] [Later]
    ↓
User taps Start
    ↓
Session begins
- Timer: 2:00 countdown
- Audio: Waheguru Simran plays (looping)
- UI: Beautiful animation
    ↓
After 2 minutes
    ↓
Auto-complete
- Timer stops
- Audio stops
- Completion dialog shows
- Stats update
- Timeline updates
- Streak increases
```

---

## 🔒 RACE CONDITION PREVENTION

**Problem:** Multiple timers/audio/state

**Solution:** Mutex locks + single instances

```javascript
// Prevent duplicate sessions
if (activeSession?.isActive) return false;

// Prevent duplicate timers
if (rafId !== null) return false;

// Prevent duplicate audio
if (audio?.playing) return false;
```

---

## 🔄 BACKGROUND SUPPORT

**Problem:** Timers stop when app goes to background

**Solution:** Timestamp-based calculation

```javascript
// On foreground return:
const elapsed = (now - startTime) / 1000;
const remaining = duration - elapsed;

// If remaining = 0 → complete session
// If remaining > 0 → resume audio + UI
```

**No intervals needed!** Time is always calculated from timestamp.

---

## 📁 FILE STRUCTURE

```
frontend/NaamAbhyas/
├── index.html
├── css/
│   ├── naam-abhyas-core.css       (base)
│   ├── naam-abhyas-cards.css      (components)
│   ├── naam-abhyas-timeline.css   (timeline)
│   ├── naam-abhyas-popup.css      (popups)
│   ├── naam-abhyas-animations.css (60fps)
│   └── naam-abhyas-themes.css     (colors)
├── js/
│   ├── core/
│   │   ├── NaamAbhyasEngine.js       ← Main orchestrator
│   │   ├── SessionController.js      ← Timer logic
│   │   ├── AudioController.js        ← Audio playback
│   │   ├── NotificationController.js ← Hourly alarms
│   │   ├── StateStore.js             ← State management
│   │   ├── TimelineEngine.js         ← Hour tracking
│   │   └── PopupController.js        ← Popup system
│   ├── ui/
│   │   ├── HomeUI.js                 ← Home screen
│   │   ├── SessionUI.js              ← Active session
│   │   └── TimelineUI.js             ← Timeline view
│   └── utils/
│       ├── TimeUtils.js
│       ├── StorageUtils.js
│       └── ThemeUtils.js
└── assets/
    └── audio/
        └── waheguru-simran.mp3
```

---

## ⚡ QUICK START CODE

### Initialize Engine
```javascript
// Auto-runs on page load
const engine = new NaamAbhyasEngine();
await engine.initialize();
```

### Enable Naam Abhyas
```javascript
await engine.setEnabled(true);
// → Schedules hourly notifications
```

### Start Session
```javascript
await engine.startSession(); // Current hour
await engine.startSession(14); // 2 PM
```

### Get State
```javascript
const state = engine.store.getState();
console.log(state.stats.currentStreak);
console.log(state.timeline.hours[14].completed);
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Week 1: Foundation
- [ ] Create folder structure
- [ ] Implement StateStore
- [ ] Implement StorageUtils
- [ ] Setup base CSS

### Week 2: Core Logic
- [ ] Implement SessionController
- [ ] Implement AudioController
- [ ] Test timestamp-based timing
- [ ] Test background/foreground

### Week 3: UI
- [ ] Design Home Screen
- [ ] Design Session UI
- [ ] Design Timeline
- [ ] Design Popups
- [ ] Add animations

### Week 4: Notifications
- [ ] Implement NotificationController
- [ ] Setup Capacitor notifications
- [ ] Test hourly alarms
- [ ] Handle notification taps

### Week 5: Integration
- [ ] Integrate with ANHAD nav
- [ ] Integrate with theme system
- [ ] Add Settings panel
- [ ] Polish animations

### Week 6: Testing
- [ ] Race condition tests
- [ ] Background tests
- [ ] Performance tests
- [ ] User testing
- [ ] Deploy

---

## 🔍 DEBUGGING TIPS

### Check if session is active
```javascript
const state = window.naamAbhyasEngine.store.getState();
console.log('Active:', state.activeSession?.isActive);
```

### Check timer accuracy
```javascript
const session = state.activeSession;
const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
console.log('Elapsed:', elapsed, 'Expected:', session.duration);
```

### Check for duplicate instances
```javascript
console.log('Engine:', window.naamAbhyasEngine);
console.log('RAF ID:', window.naamAbhyasEngine.session.rafId);
console.log('Audio playing:', window.naamAbhyasEngine.audio.audio?.paused === false);
```

### Monitor state changes
```javascript
window.naamAbhyasEngine.store.subscribe((state) => {
  console.log('State changed:', state);
});
```

---

## 💡 KEY INSIGHTS

1. **Never use setInterval for timing** → Use timestamps + RAF
2. **Never create multiple audio instances** → One singleton
3. **Never have multiple state sources** → StateStore only
4. **Always check locks before operations** → Prevent race conditions
5. **Always calculate from timestamps** → Survives background
6. **Always use GPU transforms** → Smooth 60 FPS
7. **Always validate state on load** → Handle corrupted data

---

## 🎨 VISUAL HIERARCHY

```
┌─────────────────────────────────┐
│ Header (Sticky)                 │  ← Minimal, transparent
├─────────────────────────────────┤
│ Hero Banner                     │  ← ਵਾਹਿਗੁਰੂ large
├─────────────────────────────────┤
│ Enable Toggle (Prominent)       │  ← First action
├─────────────────────────────────┤
│ Next Session Card (Primary)     │  ← Focus here
│ - Countdown                     │
│ - Progress dots                 │
├─────────────────────────────────┤
│ Timeline (Secondary)            │  ← Visual schedule
├─────────────────────────────────┤
│ Stats (Tertiary)                │  ← Dashboard
└─────────────────────────────────┘
```

---

## 🚀 PERFORMANCE TARGETS

- [ ] <100ms initial load
- [ ] <16ms frame time (60 FPS)
- [ ] <50ms tap response
- [ ] <1s audio start
- [ ] <100KB total JS
- [ ] <50KB total CSS
- [ ] Zero memory leaks
- [ ] Zero jank

---

## ✅ SUCCESS CRITERIA

### Functional
- ✅ Zero race conditions
- ✅ Zero duplicate timers
- ✅ Zero state inconsistencies
- ✅ 100% background accuracy
- ✅ All 24 hours tracked

### Experience
- ✅ Beautiful, spiritual UI
- ✅ 60 FPS animations
- ✅ Instant feedback
- ✅ Clear visual hierarchy
- ✅ Accessible to all

### Technical
- ✅ Single source of truth
- ✅ Clean architecture
- ✅ Maintainable code
- ✅ Well-documented
- ✅ Production-ready

---

*Quick Reference Guide v1.0*  
*See NAAM_ABHYAS_ARCHITECTURE.md for full details*
