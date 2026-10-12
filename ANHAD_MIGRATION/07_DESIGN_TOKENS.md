# ANHAD Design Tokens & Visual Specifications
**Document:** `ANHAD_MIGRATION/07_DESIGN_TOKENS.md`  
**Version:** 1.0.0  
**Source File Audited:** `frontend/css/theme-variables.css`, `frontend/css/anhad-core.css`  

---

## 1. Color Palette Tokens

### 1.1 Core Light Theme
- `--bg-primary`: `#FAF8F5` (Sacred Cream / Off-white)
- `--bg-secondary`: `#F2F2F7` (iOS System Gray 6)
- `--bg-tertiary`: `#E5E5EA` (iOS System Gray 5)
- `--text-primary`: `#1C1C1E` (iOS Dark Gray Label)
- `--text-secondary`: `#8E8E93` (iOS Muted Gray Label)
- `--text-accent`: `#D4943A` (Warm Golden Ochre)
- `--border-color`: `rgba(0, 0, 0, 0.1)`
- `--shadow-color`: `rgba(0, 0, 0, 0.15)`
- `--highlight-color`: `#FFD60A` (Gurbani Search Highlight Gold)
- `--btn-bg`: `#D4943A`
- `--btn-text`: `#FFFFFF`

### 1.2 Core Dark Theme
- `--bg-primary`: `#1C1C1E` (Dark Slate Surface) / `#0D0D0F` (OLED Deep Canvas)
- `--bg-secondary`: `#2C2C2E` (Dark Gray Card Surface)
- `--bg-tertiary`: `#3A3A3C` (Elevated Input Surface)
- `--text-primary`: `#F5F5F7` (iOS Light Label)
- `--text-secondary`: `#8E8E93` (Secondary Muted)
- `--text-accent`: `#D4943A` (Warm Golden Ochre)
- `--border-color`: `rgba(255, 255, 255, 0.15)`
- `--shadow-color`: `rgba(0, 0, 0, 0.5)`
- `--highlight-color`: `#FFD60A`

### 1.3 Divine Gold Theme
- `--bg-primary`: `#FFF8E7` (Warm Amber Cream)
- `--bg-secondary`: `#FFF5E0` (Soft Golden Ivory)
- `--bg-tertiary`: `#FAEED8` (Muted Golden Surface)
- `--text-primary`: `#3B2A00` (Deep Amber Brown)
- `--text-secondary`: `#7A6A4F` (Muted Earth Ochre)
- `--text-accent`: `#B8860B` (Dark Goldenrod)
- `--border-color`: `rgba(59, 42, 0, 0.15)`

### 1.4 Dynamic Auto-Theme (Diurnal Rhythm)
- **Morning (5 AM – 9 AM):**
  - `--bg-primary`: `#FFF5EC` (Warm Dawn Peach)
  - `--text-primary`: `#3E2723`
  - `--text-accent`: `#E8A87C`
- **Day (9 AM – 4 PM):**
  - Matches Light Theme (`#FAF8F5` / `#1C1C1E`)
- **Evening (4 PM – 8 PM):**
  - `--bg-primary`: `#FFF8E7` (Golden Hour Sunset)
  - `--text-primary`: `#3B2A00`
  - `--text-accent`: `#B8860B`
- **Night (8 PM – 5 AM):**
  - Matches Dark Theme (`#0D0D0F` / `#F5F5F7`)

---

## 2. Card Gradient Tokens

```typescript
export const CardGradients = {
  green: {
    light: ['#E8F5E9', '#C8E6C9'],
    dark:  ['#1C3D2A', '#2D4A3E'],
  },
  gold: {
    light: ['#FFF8E1', '#FFECB3'],
    dark:  ['#3D2D1C', '#4A3D2A'],
  },
  purple: {
    light: ['#EDE7F6', '#D1C4E9'],
    dark:  ['#2D1C3D', '#3A2D4A'],
  },
  blue: {
    light: ['#E3F2FD', '#BBDEFB'],
    dark:  ['#1C2D3D', '#2A3D4A'],
  },
  rose: {
    light: ['#FFEBEE', '#FFCDD2'],
    dark:  ['#3D1C2D', '#4A2A3D'],
  },
  eventGold: {
    light: ['#FFFCF8', '#FFF8EE', '#FFF2E0', '#FFE8C8', '#FFECB3'],
    dark:  ['#2D2D1C', '#3D3D2A', '#4A4A2D', '#3D3D1C', '#2D2D2A'],
  }
};
```

---

## 3. Typography Scale & Font Families

### 3.1 Custom Gurmukhi Scripture Fonts
- **Default Gurmukhi:** `'Noto Sans Gurmukhi'` (Gurmukhi Lipi)
- **Sacred Manuscript Font 1:** `'RiyastiHastlikhat'` / `'Riyasti'` (`frontend/nitnem/g-fonts/RiyastiHastlikhat.ttf`)
- **Sacred Manuscript Font 2:** `'PGMuskan'` (`frontend/nitnem/g-fonts/pg_muskan_5.ttf`)
- **Sacred Serif Font:** `'PGSerif'` (`frontend/nitnem/g-fonts/pg_serif_r.ttf`)
- **Pixel Font:** `'PixelR'` (`frontend/nitnem/g-fonts/pixel_r_21.ttf`)

### 3.2 Display & Interface Fonts
- **Serif Display:** `'Cinzel'`, `'OptimusPrinceps'`, `'Playfair Display'`
- **Sans-serif Body:** `'Inter'`, `System` (SF Pro on iOS, Roboto on Android)

### 3.3 Type Scale
- **Display Hero:** 32pt / LineHeight 40pt / Bold
- **Title 1 (Bani Title):** 28pt / LineHeight 34pt / SemiBold
- **Title 2 (Card Header):** 22pt / LineHeight 28pt / SemiBold
- **Title 3 (Section Heading):** 18pt / LineHeight 24pt / Medium
- **Headline:** 17pt / LineHeight 22pt / SemiBold
- **Gurbani Reader Verse (Configurable):** 20pt to 40pt (Default 28pt)
- **Body Regular:** 15pt / LineHeight 20pt / Regular
- **Subheadline:** 14pt / LineHeight 18pt / Regular
- **Footnote / Timestamp:** 12pt / LineHeight 16pt / Regular
- **Caption:** 11pt / LineHeight 13pt / Regular

---

## 4. Spacing Scale & Corner Radii

- **Spacing Scale:**
  - `xs`: 4dp
  - `sm`: 8dp
  - `md`: 12dp
  - `lg`: 16dp
  - `xl`: 20dp
  - `2xl`: 24dp
  - `3xl`: 32dp
  - `4xl`: 40dp
- **Border Radii:**
  - `button`: 12dp
  - `input`: 14dp
  - `card`: 18dp
  - `heroCard`: 24dp
  - `pill`: 9999dp (fully rounded)
