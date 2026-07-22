# NAAM ABHYAS V2 - COMPLETE FEATURE SPECIFICATION
## Based on Original Design Screenshots & Code

---

## 🎯 CORE FEATURES TO IMPLEMENT

### 1. **Sacred Day Timeline Card** 
**Reference**: Screenshot 1
```
📅 Sacred Day Timeline
   Your hourly Waheguru reminders

HOURLY REMINDERS
├─ 5:21 AM for 2 min [5:00] ❌
├─ 6:03 AM for 2 min [6:00] ❌  
├─ 7:51 AM for 2 min [7:00] ❌
└─ 8:26 AM for 2 min [8:00] ❌
```

**Features**:
- Scrollable list of 24 hours
- Random time within each hour (e.g., 5:21, 6:03, 7:51)
- Duration display ("for 2 min")
- Base hour shown on right (5:00, 6:00, 7:00)
- Red X for missed/pending
- Green ✓ for completed
- Auto-refreshes

---

### 2. **Gurbani Quote Card**
**Reference**: Screenshot 1 (bottom)
```
💡 [Refresh Icon]

"ਰਾਤਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ"

Chant the Lord's Name, day and night
— Sri Guru Granth Sahib Ji, Ang 185
```

**Features**:
- Random Gurbani quote
- Gurmukhi text (orange/gold)
- English translation
- Source reference (Ang number)
- Refresh button (top-right)
- Bulb icon

---

### 3. **Settings Modal** 
**Reference**: Screenshots 2 & 3

#### **Appearance Section**
```
Appearance
Choose your preferred look

[☀️ System] [💡 Light] [🌙 Dark]
```
- 3 pill buttons
- Gold border on selected
- Icons + labels

#### **Session Duration**
```
Session Duration
How long for each Simran session?

[2m] [5m] [11m]

[2] mins
```
- 3 preset pills (2m, 5m, 11m)
- Gold fill on selected
- Custom number input below

#### **Active Hours**
```
Active Hours
When reminders are active

From          Until
[5:00 AM ▼] to [10:00 PM ▼]
```
- Two dropdown selects
- "to" label between
- Time format: 12-hour with AM/PM

#### **Notifications Toggles**
```
Notifications
How you're reminded

Hour start notification    [ON]
2-minute warning           [ON]
Vibration                  [ON]
Sound                      [ON]
```
- 4 toggle switches
- Green when ON
- Gray when OFF

#### **Notification Sound Picker**
```
Notification Sound
Choose your reminder sound

[Gentle Bell ▼] [▶️]
```
- Dropdown select
- Play button (gold circle)
- Options: Gentle Bell, Soft Chime, Temple Bell, etc.

#### **Auto-start Timer**
```
Auto-start Timer
Automatically start meditation

[OFF]
```
- Single toggle
- When ON: Starts session automatically

---

### 4. **Extra Naam Simran Section**
**Reference**: Screenshot 4
```
EXTRA NAAM SIMRAN

[▶️ Start Now    [🕐 Quick]  [🧘 Deep]
   2 min]
```

**Features**:
- 3 buttons in row
- "Start Now" (gold, large) - Default 2min
- "Quick" (icon) - Fast session
- "Deep" (icon) - Longer session
- Gray background cards

---

### 5. **Discipline Dashboard**
**Reference**: Screenshot 4
```
⭐ Discipline Dashboard
   Discipline thrives on visibility

   [Circular Progress Ring]
        0%
   
   COMPLETION

⭐          📅
0           0
HOUR STREAK TODAY
```

**Features**:
- Circular progress ring (gray track, gold fill)
- Percentage in center
- "COMPLETION" label
- Two stats below:
  - Hour Streak (star icon)
  - Today (calendar icon)
- Large numbers, small labels

---

## 🎨 DESIGN SYSTEM

### Colors
- **Gold/Sacred**: `#D4943A` (primary accent)
- **Background Light**: `#FAF8F5`, `#FFF5EC` (morning), `#FFFDF9` (day)
- **Background Dark**: `#0D0D0F`, `#0F0F12` (night)
- **Text Primary**: `#1C1C1E` (light), `#F5F5F7` (dark)
- **Success Green**: `#34C759`
- **Error Red**: `#FF3B30`

### Typography
- **Gurmukhi**: Noto Sans Gurmukhi, Mukta Mahee
- **English**: Inter, -apple-system
- **Sizes**: 
  - Hero: 3rem
  - H1: 2rem
  - H2: 1.5rem
  - Body: 1rem
  - Small: 0.875rem

### Spacing
- Card padding: 24px
- Card gap: 16px
- Section gap: 32px
- Button padding: 14px 20px

### Border Radius
- Cards: 24px
- Buttons: 16px
- Pills: 20px
- Small buttons: 12px

---

## 📱 COMPONENTS TO BUILD

### 1. Timeline Item
```html
<div class="timeline-item [completed|pending|upcoming]">
  <div class="timeline-status">
    <span class="status-icon">[✓|❌|○]</span>
  </div>
  <div class="timeline-time">
    <span class="display-time">5:21 AM</span>
    <span class="duration">for 2 min</span>
  </div>
  <span class="base-hour">5:00</span>
</div>
```

### 2. Quote Card
```html
<div class="quote-card">
  <div class="quote-header">
    <span class="quote-icon">💡</span>
    <button class="quote-refresh">🔄</button>
  </div>
  <p class="quote-gurmukhi">"ਰਾਤਿ ਕਾ ਨਾਮੁ..."</p>
  <p class="quote-english">Chant the Lord's Name...</p>
  <p class="quote-source">— Sri Guru Granth Sahib Ji, Ang 185</p>
</div>
```

### 3. Duration Pills
```html
<div class="duration-pills">
  <button class="duration-pill [active]" data-duration="2">2m</button>
  <button class="duration-pill" data-duration="5">5m</button>
  <button class="duration-pill" data-duration="11">11m</button>
</div>
<input type="number" class="duration-custom" placeholder="mins">
```

### 4. Progress Ring (SVG)
```html
<svg class="progress-ring" viewBox="0 0 200 200">
  <circle class="ring-track" cx="100" cy="100" r="85" />
  <circle class="ring-fill" cx="100" cy="100" r="85" 
          stroke-dasharray="534" stroke-dashoffset="[calculated]"/>
</svg>
<div class="progress-text">
  <span class="progress-value">0%</span>
</div>
```

---

## 🔧 JAVASCRIPT FEATURES

### Random Time Generation
```javascript
function generateRandomTime(baseHour) {
  const minute = Math.floor(Math.random() * 60);
  const displayHour = baseHour % 12 || 12;
  const ampm = baseHour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}
```

### Gurbani Quotes Database
```javascript
const gurbaniQuotes = [
  {
    gurmukhi: "ਰਾਤਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ",
    english: "Chant the Lord's Name, day and night",
    source: "Sri Guru Granth Sahib Ji, Ang 185"
  },
  {
    gurmukhi: "ਸਤਿਨਾਮੁ ਜਪਿ ਵਡਭਾਗੀਆ",
    english: "Meditate on the True Name, most fortunate ones",
    source: "Sri Guru Granth Sahib Ji, Ang 386"
  },
  // Add 20-30 more quotes
];
```

### Progress Calculation
```javascript
function calculateProgress() {
  const completed = timeline.filter(h => h.completed).length;
  const percentage = (completed / 24) * 100;
  updateProgressRing(percentage);
}
```

### Sound Picker Options
```javascript
const sounds = [
  { name: "Gentle Bell", file: "gentle-bell.mp3" },
  { name: "Soft Chime", file: "soft-chime.mp3" },
  { name: "Temple Bell", file: "temple-bell.mp3" },
  { name: "Singing Bowl", file: "singing-bowl.mp3" },
  { name: "Om Chant", file: "om-chant.mp3" }
];
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Core Layout
- [ ] Sacred Day Timeline card
- [ ] Gurbani Quote card
- [ ] Extra Simran buttons
- [ ] Discipline Dashboard

### Phase 2: Settings Modal
- [ ] Appearance theme selector
- [ ] Duration pills + custom input
- [ ] Active hours dropdowns
- [ ] Notification toggles
- [ ] Sound picker with preview
- [ ] Auto-start toggle

### Phase 3: Functionality
- [ ] Random time generation
- [ ] Timeline state management
- [ ] Progress calculation
- [ ] Quote rotation
- [ ] Settings persistence
- [ ] Sound preview

### Phase 4: Interactions
- [ ] Timeline scrolling
- [ ] Quote refresh
- [ ] Duration selection
- [ ] Hour dropdowns
- [ ] Toggle animations
- [ ] Sound play button

### Phase 5: Polish
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling
- [ ] Smooth transitions
- [ ] Haptic feedback
- [ ] Accessibility

---

## 🎯 KEY DIFFERENCES FROM CURRENT V2

| Feature | Current V2 | Needed (Old Design) |
|---------|-----------|---------------------|
| Timeline | Grid of hours | Scrollable list with times |
| Quote | Missing | Gurbani card with refresh |
| Theme | CSS vars only | Visual theme picker |
| Duration | Slider | Pill buttons + number input |
| Active Hours | Text only | Dropdown selects |
| Notifications | Text options | Toggle switches |
| Sound | Text | Dropdown + play button |
| Extra Simran | 4 buttons grid | 3 buttons row |
| Progress | Missing | Circular ring with % |
| Stats | 2x2 grid | Row below progress |

---

## 🚀 PRIORITY ORDER

1. **HIGH** - Sacred Day Timeline (core feature)
2. **HIGH** - Settings with all controls
3. **MEDIUM** - Gurbani Quote card
4. **MEDIUM** - Discipline Dashboard with progress
5. **LOW** - Extra Simran buttons
6. **LOW** - Polish & animations

---

**Total Estimated Work**: 8-12 hours for complete implementation
**Current Progress**: 40% (core engine done, UI needs full redesign)
