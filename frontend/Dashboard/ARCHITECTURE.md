# Dashboard Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIVITIES                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
         ┌──────────────┐  ┌──────────┐  ┌──────────┐
         │ Audio Player │  │  Reader  │  │  Nitnem  │
         │   (Radio,    │  │ (Sehaj   │  │ (Tracker)│
         │ NaamAbhyas)  │  │  Paath)  │  │          │
         └──────────────┘  └──────────┘  └──────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────┐
         │      STATS INTEGRATION LAYER              │
         │   (lib/stats-integration.js)              │
         │                                           │
         │  • AudioTracker                           │
         │  • SehajPaathIntegration                  │
         │  • NitnemIntegration                      │
         │  • NaamAbhyasIntegration                  │
         │  • UnifiedStreakSystem                    │
         │  • DashboardUpdater                       │
         └───────────────────────────────────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────┐
         │      CENTRAL STATS SYSTEM                 │
         │   (lib/user-stats.js)                     │
         │                                           │
         │  window.AnhadStats                        │
         │  • addListeningTime()                     │
         │  • addPagesRead()                         │
         │  • addNitnemCompleted()                   │
         │  • updateStreak()                         │
         │  • getSummary()                           │
         └───────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
         ┌──────────────┐  ┌──────────┐  ┌──────────┐
         │  localStorage│  │  Events  │  │Dashboard │
         │              │  │          │  │   UI     │
         │ anhad_user_  │  │ stats    │  │          │
         │   stats      │  │ Updated  │  │ Real-time│
         └──────────────┘  └──────────┘  └──────────┘
```

## Data Flow

### 1. Audio Listening Flow

```
User plays audio
       │
       ▼
<audio> element fires 'play' event
       │
       ▼
AudioTracker.startTracking()
       │
       ▼
Timer starts counting
       │
       ▼
Every 30 seconds OR on pause/stop
       │
       ▼
AudioTracker.stopTracking()
       │
       ▼
Calculate duration in minutes
       │
       ▼
AnhadStats.addListeningTime(minutes)
       │
       ▼
Update localStorage + dispatch 'statsUpdated'
       │
       ▼
Dashboard receives event and refreshes
```

### 2. Reading Progress Flow

```
User reads Ang in SehajPaath
       │
       ▼
User clicks "Next Ang"
       │
       ▼
StatisticsDashboard.recordAngRead(ang)
       │
       ▼
Dispatch 'sehajPaathAngRead' event
       │
       ▼
SehajPaathIntegration hears event
       │
       ▼
AnhadStats.addPagesRead(1)
       │
       ▼
Update localStorage + dispatch 'statsUpdated'
       │
       ▼
Dashboard receives event and refreshes
```

### 3. Nitnem Completion Flow

```
User completes all daily banis
       │
       ▼
Data saved to nitnemTracker_nitnemLog
       │
       ▼
NitnemIntegration checks every minute
       │
       ▼
Detects full day completion
       │
       ▼
AnhadStats.addNitnemCompleted(1)
       │
       ▼
Update localStorage + dispatch 'statsUpdated'
       │
       ▼
Dashboard receives event and refreshes
```

### 4. NaamAbhyas Session Flow

```
User completes NaamAbhyas session
       │
       ▼
NaamAbhyas.recordSession(sessionData)
       │
       ▼
Dispatch 'naamAbhyasSessionComplete' event
       │
       ▼
NaamAbhyasIntegration hears event
       │
       ▼
Calculate duration in minutes
       │
       ▼
AnhadStats.addListeningTime(minutes)
       │
       ▼
Update localStorage + dispatch 'statsUpdated'
       │
       ▼
Dashboard receives event and refreshes
```

## Component Responsibilities

### AudioTracker
```javascript
Responsibilities:
- Monitor all <audio> elements
- Track custom audio players
- Calculate listening duration
- Sync every 30 seconds
- Handle page visibility changes
- Clean up on unload

Events Listened:
- play, pause, ended (native)
- audioPlayerPlay, audioPlayerPause, audioPlayerStop (custom)

Events Dispatched:
- None (calls AnhadStats directly)
```

### SehajPaathIntegration
```javascript
Responsibilities:
- Listen for Ang read events
- Intercept StatisticsDashboard.recordAngRead()
- Sync reading progress to central stats

Events Listened:
- sehajPaathAngRead

Events Dispatched:
- None (calls AnhadStats directly)
```

### NitnemIntegration
```javascript
Responsibilities:
- Monitor nitnemTracker_nitnemLog
- Check daily completion status
- Detect when all banis completed
- Sync to central stats

Events Listened:
- nitnemBaniCompleted
- nitnemDayCompleted

Events Dispatched:
- None (calls AnhadStats directly)

Polling:
- Checks every 60 seconds
```

### NaamAbhyasIntegration
```javascript
Responsibilities:
- Listen for session completion
- Intercept recordSession() method
- Calculate session duration
- Sync to central stats

Events Listened:
- naamAbhyasSessionComplete

Events Dispatched:
- None (calls AnhadStats directly)
```

### UnifiedStreakSystem
```javascript
Responsibilities:
- Check daily activity across all modules
- Update streak if any activity detected
- Handle streak freezes
- Track milestones

Polling:
- Checks every 60 minutes

Criteria for Streak:
- todayListeningMinutes > 0 OR
- todayPagesRead > 0 OR
- todayNitnemCount > 0
```

### DashboardUpdater
```javascript
Responsibilities:
- Listen for all stats events
- Dispatch dashboardRefresh event
- Handle page visibility changes

Events Listened:
- statsUpdated
- streakUpdated
- goalsUpdated
- visibilitychange

Events Dispatched:
- dashboardRefresh
```

## Storage Structure

### Central Stats (anhad_user_stats)
```javascript
{
  // Lifetime totals
  totalListeningMinutes: 0,
  totalPagesRead: 0,
  totalNitnemCompleted: 0,
  totalShabadsViewed: 0,
  totalDaysActive: 0,

  // Today's activity
  todayListeningMinutes: 0,
  todayPagesRead: 0,
  todayNitnemCount: 0,
  todayDate: "2026-03-10",

  // Session tracking
  sessionListeningMinutes: 0,
  sessionStartTime: "2026-03-10T10:00:00Z",

  // Metadata
  firstUseDate: "2026-03-10",
  lastActiveDate: "2026-03-10"
}
```

### Streak Data (anhad_streak_data)
```javascript
{
  currentStreak: 0,
  longestStreak: 0,
  lastCheckIn: "2026-03-10",
  freezesUsed: 0,
  freezesAvailable: 1,

  milestones: {
    day1: false,
    day7: false,
    day21: false,
    day40: false,
    day108: false,
    day365: false
  }
}
```

### Daily Goals (anhad_daily_goals)
```javascript
{
  readPages: {
    target: 5,
    current: 0,
    enabled: true
  },
  listenMinutes: {
    target: 30,
    current: 0,
    enabled: true
  },
  completeNitnem: {
    target: 1,
    current: 0,
    enabled: true
  },
  naamAbhyas: {
    target: 1,
    current: 0,
    enabled: false
  }
}
```

## Event System

### Events Dispatched by Modules
```javascript
// SehajPaath
window.dispatchEvent(new CustomEvent('sehajPaathAngRead', {
  detail: { ang: 5, date: "2026-03-10" }
}));

// NaamAbhyas
window.dispatchEvent(new CustomEvent('naamAbhyasSessionComplete', {
  detail: { duration: 120, isExtra: false, hour: 10 }
}));

// Nitnem (future)
window.dispatchEvent(new CustomEvent('nitnemBaniCompleted', {
  detail: { bani: "Japji Sahib" }
}));

window.dispatchEvent(new CustomEvent('nitnemDayCompleted', {
  detail: { date: "2026-03-10" }
}));
```

### Events Dispatched by Stats System
```javascript
// Stats updated
window.dispatchEvent(new CustomEvent('statsUpdated', {
  detail: stats
}));

// Streak updated
window.dispatchEvent(new CustomEvent('streakUpdated', {
  detail: { current: 5, longest: 10 }
}));

// Goals updated
window.dispatchEvent(new CustomEvent('goalsUpdated', {
  detail: goals
}));

// Milestone achieved
window.dispatchEvent(new CustomEvent('milestoneAchieved', {
  detail: { milestone: 'day7', streak: 7 }
}));

// Dashboard refresh
window.dispatchEvent(new CustomEvent('dashboardRefresh'));
```

## Performance Characteristics

### Sync Intervals
```
AudioTracker:        Every 30 seconds
NitnemIntegration:   Every 60 seconds
UnifiedStreakSystem: Every 60 minutes
Dashboard:           On-demand (event-driven)
```

### Memory Usage
```
Integration Layer:   ~50KB
Event Listeners:     ~10KB
Total Overhead:      ~60KB
```

### CPU Usage
```
Idle:                ~0%
Audio Playing:       ~0.1% (30s sync)
Active Tracking:     ~0.5%
```

### Storage Usage
```
Central Stats:       ~10KB
Streak Data:         ~2KB
Goals Data:          ~2KB
Total:               ~14KB
```

## Initialization Sequence

```
1. Page loads
2. user-stats.js loads → window.AnhadStats created
3. stats-integration.js loads → Waits for AnhadStats
4. AnhadStats detected → Initialize all integrations
5. AudioTracker starts monitoring
6. SehajPaathIntegration hooks into methods
7. NitnemIntegration starts polling
8. NaamAbhyasIntegration hooks into methods
9. UnifiedStreakSystem starts hourly checks
10. DashboardUpdater starts listening
11. Console: "[StatsIntegration] ✓ All integrations active"
```

## Error Handling

### AnhadStats Not Found
```javascript
if (!window.AnhadStats) {
  console.warn('[StatsIntegration] AnhadStats not found, retrying...');
  setTimeout(initStatsIntegration, 1000);
  return;
}
```

### localStorage Errors
```javascript
try {
  localStorage.setItem(key, value);
} catch (e) {
  console.error('[UserStats] Error saving stats:', e);
  // Graceful degradation - continue without persistence
}
```

### Event Dispatch Errors
```javascript
try {
  window.dispatchEvent(new CustomEvent('statsUpdated', { detail }));
} catch (e) {
  console.error('[UserStats] Error dispatching event:', e);
  // Continue - event system is non-critical
}
```

## Testing Strategy

### Unit Tests (Manual)
```javascript
// Test AnhadStats API
AnhadStats.addListeningTime(5);
console.log(AnhadStats.getSummary().totalListeningMinutes); // Should be 5

// Test event dispatch
window.addEventListener('statsUpdated', (e) => {
  console.log('Stats updated:', e.detail);
});
AnhadStats.addPagesRead(1); // Should trigger event

// Test integration
// Play audio for 30 seconds, check console for sync message
```

### Integration Tests (Manual)
```javascript
// Test full flow
1. Play audio → Wait 30s → Check stats
2. Read Ang → Check stats
3. Complete Nitnem → Wait 1min → Check stats
4. Complete NaamAbhyas → Check stats
5. Open dashboard → Verify all data correct
```

### Performance Tests
```javascript
// Monitor console for timing
console.time('statsUpdate');
AnhadStats.addListeningTime(1);
console.timeEnd('statsUpdate'); // Should be < 10ms

// Monitor memory
console.memory.usedJSHeapSize; // Before
// Use app for 1 hour
console.memory.usedJSHeapSize; // After (should not grow significantly)
```

## Summary

The architecture is:
- ✅ Modular (each component has single responsibility)
- ✅ Event-driven (loose coupling between modules)
- ✅ Performance-optimized (smart sync intervals)
- ✅ Error-resilient (graceful degradation)
- ✅ Extensible (easy to add new integrations)
- ✅ Maintainable (clear separation of concerns)
