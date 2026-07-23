# 🔥 Streak Saver Visual Guide

## ❄️ The Snapchat-Style System

```
┌─────────────────────────────────────────┐
│  🔥 7-Day Streak                        │
│  ❄️ 3/5 Freezes Left                   │
└─────────────────────────────────────────┘
```

---

## 📱 Modal Flow

### When User Misses Amritvela:

```
┌──────────────────────────────────────────────┐
│              ⚡ Streak Saver Available!      │
│       Your 7-day streak can be saved!        │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📿  Punishment Task                    │ │
│  │                                        │ │
│  │ Complete Japji Sahib × 2               │ │
│  │ Complete within 24 hours               │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ❄️  Streak Freeze Available           │ │
│  │                                        │ │
│  │ Save your streak instantly without     │ │
│  │ punishment (3 left this month)         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  💡 Complete the punishment Bani to         │
│     restore your 7-day streak!              │
│  ⚠️ If you decline, streak resets to 0     │
│                                              │
├──────────────────────────────────────────────┤
│  [Decline]  [❄️ Use Freeze]  [Accept]      │
└──────────────────────────────────────────────┘
```

---

## 🎮 User Options

### Option 1: Use Freeze (Instant) ❄️
```
Click "Use Streak Freeze"
     ↓
🎉 Streak Saved!
💙 2 freezes left this month
✅ No punishment needed
```

### Option 2: Accept Punishment 📿
```
Click "Accept Punishment"
     ↓
📖 2× Japji Sahib added to Nitnem
⏰ 24 hours to complete
✅ Complete them → Streak saved
```

### Option 3: Decline ❌
```
Click "Decline"
     ↓
💔 Streak reset to 0
🔄 Start fresh today
```

---

## 📊 Freeze Counter

### Display Locations:

1. **Modal Button:**
   ```
   ❄️ Use Streak Freeze (3/5)
   ```

2. **Header Badge (Future):**
   ```
   🔥 7  ❄️ 3/5
   ```

3. **Profile Stats:**
   ```
   Freezes Left: 3/5
   Resets: Feb 1st
   ```

---

## 🗓️ Monthly Reset

```
January 1st, 2024
├─ User has 5 freezes
├─ Uses 2 freezes
└─ Has 3 remaining

    ↓ [February 1st arrives]

February 1st, 2024
├─ Auto-resets to 5 freezes
└─ Previous history saved
```

---

## 🎨 Color Scheme

### Freeze Elements:
- **Primary:** `#00D9FF` (Icy Blue)
- **Secondary:** `#0099FF` (Deep Blue)
- **Glow:** `rgba(0, 217, 255, 0.3)`

### Punishment Elements:
- **Primary:** `#AF52DE` (Purple)
- **Secondary:** `#5856D6` (Indigo)

### Warning Elements:
- **Primary:** `#FF9500` (Orange)
- **Secondary:** `#FF3B30` (Red)

---

## 💫 Animations

### Freeze Button:
```css
/* Pulsing glow effect */
@keyframes freezePulse {
    0%, 100% { 
        transform: scale(1);
        filter: drop-shadow(0 0 4px rgba(0, 217, 255, 0.3));
    }
    50% { 
        transform: scale(1.1);
        filter: drop-shadow(0 0 8px rgba(0, 217, 255, 0.5));
    }
}
```

### Snowfall Effect:
```css
/* Snowflake floating */
@keyframes snowfall {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(10px) rotate(180deg); }
    100% { transform: translateY(0) rotate(360deg); }
}
```

---

## 📝 localStorage Structure

### Freeze Data:
```json
{
    "month": "2024-01",
    "freezesUsed": 2,
    "freezesRemaining": 3,
    "history": [
        {
            "date": "2024-01-05T06:30:00Z",
            "reason": "Saved 3-day streak",
            "streakSaved": 3
        },
        {
            "date": "2024-01-15T07:00:00Z",
            "reason": "Saved 7-day streak",
            "streakSaved": 7
        }
    ]
}
```

### Punishment Data:
```json
{
    "brokenStreak": 7,
    "punishment": {
        "type": "japji",
        "count": 2
    },
    "offeredAt": "2024-01-20T06:00:00Z",
    "expiresAt": "2024-01-21T06:00:00Z",
    "completed": false,
    "freezesAvailable": 3
}
```

---

## 🔔 Notifications

### Freeze Used:
```
┌─────────────────────────────────────┐
│  ❄️ Freeze Used!                   │
│  Streak saved! 2 freezes left      │
│  this month.                        │
└─────────────────────────────────────┘
```

### No Freezes Left:
```
┌─────────────────────────────────────┐
│  ❄️ No Freezes Left                │
│  You've used all 5 freezes this    │
│  month. Complete punishment.        │
└─────────────────────────────────────┘
```

### Punishment Complete:
```
┌─────────────────────────────────────┐
│  🎉 Streak Saved!                   │
│  Your 7-day streak is restored!    │
└─────────────────────────────────────┘
```

---

## 📈 Usage Scenarios

### Heavy User (Uses all 5):
```
Jan 3:  ❄️ Used (4 left)
Jan 8:  ❄️ Used (3 left)
Jan 12: ❄️ Used (2 left)
Jan 19: ❄️ Used (1 left)
Jan 27: ❄️ Used (0 left)
Jan 30: ❌ No freezes - must do punishment

Feb 1:  ✅ Reset to 5 freezes
```

### Moderate User (Uses 2-3):
```
Jan 5:  ❄️ Used (4 left)
Jan 18: ❄️ Used (3 left)
Jan 25: 📿 Did punishment instead

Feb 1:  ✅ Reset to 5 freezes
```

### Light User (Uses 0-1):
```
Jan 10: ❄️ Used (4 left)
...rest of month: Perfect attendance

Feb 1:  ✅ Reset to 5 freezes
        (unused ones don't carry over)
```

---

## 🎯 Best Practices

### For Users:
1. Save freezes for emergencies
2. Try punishment first (spiritual growth)
3. Use freeze if truly needed
4. Don't waste all freezes early in month

### For Developers:
1. Always check `freezesRemaining > 0`
2. Update UI after freeze use
3. Log freeze usage for analytics
4. Test monthly reset thoroughly

---

## 🔍 Debug Checks

### Console Logs:
```javascript
console.log('[StreakSaver] Freeze used - 2 remaining');
console.log('[StreakSaver] 🔄 Monthly freezes reset');
console.log('[StreakSaver] ❄️ Freeze used - 4 remaining');
```

### localStorage Check:
```javascript
// Check freeze data
JSON.parse(localStorage.getItem('nitnemTracker_streakFreezes'))

// Expected output:
{
    month: "2024-01",
    freezesUsed: 1,
    freezesRemaining: 4,
    history: [...]
}
```

---

## ✅ Testing Checklist

- [ ] Freeze button shows correct count
- [ ] Freeze button works (restores streak)
- [ ] Freeze count decrements after use
- [ ] "No freezes left" shows when 0
- [ ] Monthly reset works
- [ ] Freeze history logs correctly
- [ ] Punishment still works
- [ ] UI updates after freeze use
- [ ] Toast notifications show
- [ ] localStorage persists data

---

**Visual Guide Complete! 🎨**
