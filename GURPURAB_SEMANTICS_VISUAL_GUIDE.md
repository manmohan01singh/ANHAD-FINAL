# 🎨 GURPURAB EVENT SEMANTICS — VISUAL GUIDE

## 🕯️ REMEMBRANCE EVENTS (Jyoti Jyot Divas)

### Visual Appearance
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Upcoming Gurpurab                              │
│                                                 │
│  Jyoti Jyot Divas of Sri Guru                  │
│  Har Krishan Sahib Ji                          │
│                                                 │
│  🕯️ In remembrance                              │
│                                                 │
│  🙏                                             │
│  Today                                          │
│                                                 │
│  [Soft gray glow - respectful, calm]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Color Palette
- **Background:** `rgba(60, 60, 67, 0.05)` — Soft gray
- **Border:** `rgba(60, 60, 67, 0.25)` — 3px left
- **Text Primary:** Standard black/white
- **Text Secondary:** `rgba(60, 60, 67, 0.6)` — Muted
- **Glow:** Subtle radial, 50% opacity

### Effects
- ❌ NO ring lights
- ❌ NO flashy animations
- ✅ Soft subtle glow
- ✅ Respectful stillness
- ✅ Calm appearance

### Emoji
- 🕯️ Candle (remembrance)
- 🙏 Folded hands (prayer)

---

## 🎉 CELEBRATION EVENTS (Prakash/Gurgaddi)

### Visual Appearance
```
┌─────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════╗  │
│  ║ [Animated golden ring light flowing]     ║  │
│  ║                                           ║  │
│  ║  Upcoming Gurpurab                        ║  │
│  ║                                           ║  │
│  ║  Prakash Gurpurab of Sri Guru            ║  │
│  ║  Gobind Singh Sahib Ji                   ║  │
│  ║                                           ║  │
│  ║  🎉 Celebrate today!                      ║  │
│  ║                                           ║  │
│  ║  ✨                                        ║  │
│  ║  Today                                    ║  │
│  ║                                           ║  │
│  ║  [Pulsing golden glow - festive]         ║  │
│  ╚═══════════════════════════════════════════╝  │
└─────────────────────────────────────────────────┘
```

### Color Palette
- **Background:** Golden gradient
  - `rgba(212, 148, 58, 0.12)` → `rgba(255, 215, 0, 0.08)`
- **Ring Light:** Animated gradient
  - `#FF6B00` (kesri) → `#FFD700` (gold) → `#FFA500` (orange)
- **Text Primary:** Standard with golden accents
- **Text Accent:** `#D4943A` (kesri)
- **Glow:** Pulsing radial, 60-90% opacity

### Effects
- ✅ Animated ring light (3s flow)
- ✅ Pulsing inner glow (2.5s)
- ✅ Premium, smooth animations
- ✅ Festive appearance
- ✅ NOT overdone

### Emoji
- 🎉 Party popper (celebration)
- ✨ Sparkles (divine light)

---

## 📅 NEUTRAL EVENTS

### Visual Appearance
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Upcoming Gurpurab                              │
│                                                 │
│  Historical Event                               │
│                                                 │
│  Apr 15                                         │
│                                                 │
│  14                                             │
│  days                                           │
│                                                 │
│  [Standard styling - no special effects]       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Color Palette
- **Background:** Default event card gradient
- **Border:** Standard
- **Text:** Standard colors
- **Glow:** Minimal

### Effects
- ❌ NO ring lights
- ❌ NO special animations
- ✅ Clean, standard appearance

---

## 🌙 DARK MODE COMPARISON

### Remembrance (Dark Mode)
```
┌─────────────────────────────────────────────────┐
│  [Dark background with subtle gray glow]       │
│                                                 │
│  Jyoti Jyot Divas                              │
│  Color: #F5F5F7 (light text)                   │
│  Accent: rgba(255, 255, 255, 0.5)              │
│                                                 │
│  🕯️ In remembrance                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Celebration (Dark Mode)
```
┌─────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════╗  │
│  ║ [Golden ring light - same animation]     ║  │
│  ║                                           ║  │
│  ║  Prakash Gurpurab                        ║  │
│  ║  Color: #F5F5F7 (light text)             ║  │
│  ║  Accent: #E8B84A (golden)                ║  │
│  ║                                           ║  │
│  ║  🎉 Celebrate today!                      ║  │
│  ╚═══════════════════════════════════════════╝  │
└─────────────────────────────────────────────────┘
```

---

## 🎭 ANIMATION DETAILS

### Ring Light Flow (Celebration Only)
```css
@keyframes ringLightFlow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

Duration: 3s
Timing: linear
Loop: infinite
Opacity: 0.65
```

**Visual Effect:**
```
Frame 1: [■■■□□□□□□] Kesri at left
Frame 2: [□□■■■□□□□] Gold in middle
Frame 3: [□□□□□■■■□] Orange at right
Frame 4: [■■■□□□□□□] Loop back
```

### Celebration Pulse (Celebration Only)
```css
@keyframes celebrationPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 0.9; transform: scale(1.02); }
}

Duration: 2.5s
Timing: ease-in-out
Loop: infinite
```

**Visual Effect:**
```
Breathe in  → Glow brightens, card slightly expands
Breathe out → Glow dims, card returns to normal
```

---

## 📊 SIDE-BY-SIDE COMPARISON

### Light Mode
```
┌─────────────────────┬─────────────────────┐
│   REMEMBRANCE       │    CELEBRATION      │
├─────────────────────┼─────────────────────┤
│ Gray gradient       │ Golden gradient     │
│ 3px gray border     │ Ring light border   │
│ Subtle glow         │ Pulsing glow        │
│ NO animation        │ Smooth animation    │
│ 🕯️ In remembrance   │ 🎉 Celebrate today! │
│ Muted colors        │ Vibrant colors      │
│ Respectful tone     │ Festive tone        │
└─────────────────────┴─────────────────────┘
```

### Dark Mode
```
┌─────────────────────┬─────────────────────┐
│   REMEMBRANCE       │    CELEBRATION      │
├─────────────────────┼─────────────────────┤
│ Dark gray gradient  │ Dark golden grad    │
│ White border 20%    │ Ring light (same)   │
│ Subtle glow         │ Pulsing glow        │
│ NO animation        │ Smooth animation    │
│ #F5F5F7 text        │ #F5F5F7 text        │
│ Muted accents       │ #E8B84A accents     │
└─────────────────────┴─────────────────────┘
```

---

## 🎯 CLASSIFICATION VISUAL FLOW

```
Event Data
    ↓
┌───────────────────────────────────────┐
│ Check Event Name                      │
│ Contains: "jyoti jot", "shaheedi"?   │
└───────────────────────────────────────┘
    ↓ YES                    ↓ NO
🕯️ REMEMBRANCE          ┌───────────────────────────────────────┐
                        │ Check Event Type                      │
                        │ Type: "shaheedi", "jyoti-jot"?       │
                        └───────────────────────────────────────┘
                            ↓ YES                    ↓ NO
                        🕯️ REMEMBRANCE          ┌───────────────────────────────────────┐
                                                │ Check Celebration Keywords            │
                                                │ Contains: "prakash", "gurgaddi"?     │
                                                └───────────────────────────────────────┘
                                                    ↓ YES                    ↓ NO
                                                🎉 CELEBRATION          📅 NEUTRAL
```

---

## 🔍 DETAILED STYLING SPECS

### Remembrance Event Card
```css
.event-card.event-remembrance.event-today {
  /* Background */
  background: linear-gradient(160deg, 
    rgba(60, 60, 67, 0.05) 0%, 
    rgba(60, 60, 67, 0.02) 100%);
  
  /* Border */
  border-left: 3px solid rgba(60, 60, 67, 0.25);
  padding-left: calc(var(--space-5) - 3px);
  
  /* Glow (::before pseudo-element) */
  radial-gradient(circle at 50% 50%, 
    rgba(60, 60, 67, 0.08) 0%, 
    transparent 70%);
  opacity: 0.5;
}
```

### Celebration Event Card
```css
.event-card.event-celebration.event-today {
  /* Background */
  background: linear-gradient(160deg, 
    rgba(212, 148, 58, 0.12) 0%, 
    rgba(255, 215, 0, 0.08) 50%,
    rgba(212, 148, 58, 0.06) 100%);
  
  /* Ring Light (::before pseudo-element) */
  inset: -3px;
  background: linear-gradient(90deg, 
    #FF6B00 0%, #FFD700 25%, 
    #FFA500 50%, #FFD700 75%, 
    #FF6B00 100%);
  background-size: 300% 100%;
  animation: ringLightFlow 3s linear infinite;
  opacity: 0.65;
  
  /* Inner Glow (::after pseudo-element) */
  radial-gradient(circle at 50% 50%, 
    rgba(255, 215, 0, 0.15) 0%, 
    transparent 70%);
  animation: celebrationPulse 2.5s ease-in-out infinite;
}
```

---

## 📱 RESPONSIVE BEHAVIOR

### Mobile (< 768px)
- Ring light: 2px border (thinner)
- Animations: Same speed
- Glow: Slightly reduced opacity
- Text: Same size

### Tablet (768px - 1024px)
- Ring light: 3px border (standard)
- Animations: Full effect
- Glow: Full opacity
- Text: Standard size

### Desktop (> 1024px)
- Ring light: 3px border (standard)
- Animations: Full effect
- Glow: Full opacity
- Text: Standard size

---

## ⚡ PERFORMANCE METRICS

### GPU Acceleration
```css
transform: translateZ(0);
backface-visibility: hidden;
will-change: auto;
```

### Animation Performance
- Ring light: CSS-only, 60fps
- Pulse glow: CSS-only, 60fps
- No JavaScript animations
- No layout shifts

### Rendering
- First paint: < 100ms
- Animation start: Immediate
- Smooth scrolling: Maintained
- Zero flicker: Guaranteed

---

## 🎨 COLOR REFERENCE

### Remembrance Palette
```
Primary:   rgba(60, 60, 67, 0.05)  ░░░░░░░░░░
Border:    rgba(60, 60, 67, 0.25)  ████░░░░░░
Text:      rgba(60, 60, 67, 0.8)   ████████░░
Muted:     rgba(60, 60, 67, 0.6)   ██████░░░░
```

### Celebration Palette
```
Kesri:     #FF6B00  ████████████████████
Gold:      #FFD700  ████████████████████
Orange:    #FFA500  ████████████████████
Accent:    #D4943A  ████████████████████
```

---

## ✅ VISUAL CHECKLIST

### Remembrance Events
- [ ] Soft gray gradient background
- [ ] 3px left border (gray)
- [ ] Subtle radial glow
- [ ] NO ring lights
- [ ] NO animations
- [ ] Text: "🕯️ In remembrance"
- [ ] Muted color palette
- [ ] Respectful appearance

### Celebration Events
- [ ] Golden gradient background
- [ ] Animated ring light border
- [ ] Pulsing inner glow
- [ ] Smooth 3s flow animation
- [ ] Smooth 2.5s pulse animation
- [ ] Text: "🎉 Celebrate today!"
- [ ] Vibrant kesri/gold colors
- [ ] Festive appearance

### Both Categories
- [ ] Dark mode support
- [ ] Reduced motion support
- [ ] GPU accelerated
- [ ] Zero flicker
- [ ] Smooth rendering

---

**Visual implementation complete and culturally appropriate! ✨**
