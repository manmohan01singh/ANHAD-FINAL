# 📍 Journey Link Position in Profile Page

## Exact Position

The Journey link is positioned **between the User Card and the Stats Grid** on the Profile page.

```
Profile Page Layout:
┌─────────────────────────────────────┐
│  ← Back    My Profile               │  ← Navigation Bar (Sticky)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   👤                                │
│                                     │
│  Waheguru Ji                        │  ← User Card
│  Member since...           🔥 0     │     (Name, Streak Badge)
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🌿  The Journey                  → │  ← **JOURNEY LINK HERE**
│      Discover the story behind...   │     (Glass card, clickable)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │  🎧    │  │  📅    │  │  📖    ││  ← Quick Stats Grid
│  │  0     │  │  0     │  │  0     ││     (4 stat cards)
│  │Hours   │  │Days    │  │Nitnem  ││
│  └────────┘  └────────┘  └────────┘│
│  ...                                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🎯 Today vs Yesterday              │
│  ...                                │  ← Rest of Profile content
└─────────────────────────────────────┘
```

## Visual Hierarchy

**Position**: 
- **After**: User Card (with avatar and streak)
- **Before**: Quick Stats Grid (4 stat cards)

**Prominence**: 
- Full-width card
- Eye-catching 🌿 icon
- Gradient title
- Hover effect with animation

## Why This Position?

1. **High Visibility** - Right at the top, users see it immediately
2. **Logical Flow** - After seeing their profile, they can learn about the app
3. **Not Intrusive** - Doesn't interfere with stats/analytics below
4. **Easy to Spot** - Distinct design separates it from stats cards

## Design Features

The Journey card has:
- **Icon**: 🌿 (floating animation)
- **Title**: "The Journey" (gradient gold → mint)
- **Description**: "Discover the story behind ANHAD"
- **Arrow**: → (slides right on hover)
- **Border**: Subtle gold glow
- **Background**: Glass morphism effect
- **Hover**: Lifts up with shadow

## Code Position

```html
<!-- Line ~126 in profile.html -->

<!-- User Card -->
<section class="user-card glass-card">
  ...
</section>

<!-- Journey Link 👈 HERE -->
<section class="journey-link-section">
  <a href="../Journey/journey.html" class="journey-link-card glass-card">
    <div class="journey-link__icon">🌿</div>
    <div class="journey-link__content">
      <h3 class="journey-link__title">The Journey</h3>
      <p class="journey-link__description">Discover the story behind ANHAD</p>
    </div>
    <div class="journey-link__arrow">
      <i class="fas fa-chevron-right"></i>
    </div>
  </a>
</section>

<!-- Quick Stats Grid -->
<section class="stats-grid">
  ...
</section>
```

## How It Looks

**Desktop/Tablet:**
```
┌────────────────────────────────────────────┐
│ 🌿  The Journey                          →│
│     Discover the story behind ANHAD        │
└────────────────────────────────────────────┘
```

**Mobile:**
```
┌───────────────────────────┐
│ 🌿  The Journey         →│
│     Discover the story... │
└───────────────────────────┘
```

## Styling Details

```css
.journey-link-section {
    padding: 24px 16px;  /* Spacing around card */
    padding-top: 0;       /* No top padding (flows from user card) */
}

.journey-link-card {
    display: flex;         /* Horizontal layout */
    align-items: center;   /* Vertically centered */
    gap: 16px;            /* Space between elements */
    padding: 24px;        /* Inner padding */
    border: 1px solid rgba(212, 165, 116, 0.2);  /* Gold border */
}
```

## To Move It Elsewhere

If you want to move it to a different position:

### Option 1: Bottom of Profile
Move the section after all stats, before the footer

### Option 2: In Settings Page
Add similar card in Settings instead of Profile

### Option 3: Homepage Hero
Add as a featured card on the homepage

### Option 4: Footer Navigation
Add to the bottom tab bar

Let me know if you want to reposition it! 

---

**Currently**: Top of Profile page, right after User Card ✅
