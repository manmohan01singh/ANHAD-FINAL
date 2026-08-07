# Guru Images Stack Enlarged & Gaps Reduced

## Date: 2026-07-25

## Changes Made

Increased the size of Guru portrait images in the stack and decreased gaps to fit more content on screen, especially optimized for dynamic themes where Guru names aren't displayed.

### Size Changes

#### Normal Mode (Light/Dark):
- **Portrait size:** 165px → **185px** (+20px)
- **Slider height:** 185px → **195px** (+10px)
- **Top margin:** -14px → **-18px** (tighter)
- **Bottom margin:** 2px → **0px** (removed gap)

#### Dynamic Mode (Auto themes):
- **Portrait size:** 170px → **200px** (+30px)
- **Slider height:** 185px → **210px** (+25px)
- **Top margin:** -12px → **-18px** (tighter)
- **Bottom margin:** 10px → **4px** (much tighter)
- **Progress margin:** 4px → **2px** (tighter)

### Result
- ✅ Guru images are **20-30px larger** for better visibility
- ✅ Vertical gaps reduced by **6-8px** for more compact layout
- ✅ More content fits on screen without feeling congested
- ✅ Dynamic themes (auto mode) get the most benefit with 200px portraits
- ✅ Stack is tighter and more prominent

## Files Updated

### Frontend:
- `frontend/css/responsive-fix.css`
- `frontend/css/anhad-sky-bg.css`

### iOS:
- `ios/App/App/public/css/responsive-fix.css`
- `ios/App/App/public/css/anhad-sky-bg.css`

### Android:
- `android/app/src/main/assets/public/css/responsive-fix.css`
- `android/app/src/main/assets/public/css/anhad-sky-bg.css`

## Visual Impact
The Guru portraits now have a more prominent presence, with tighter spacing that creates a cleaner, more focused layout while still maintaining breathing room for a premium feel.
