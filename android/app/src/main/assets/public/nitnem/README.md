# Nitnem Module - Complete Reconstruction

## Version 2.0.0 | January 2026

### 🕉️ Overview

The Nitnem module has been completely rebuilt from the ground up to provide the most beautiful, spiritual, and technologically advanced Bani reading experience. This module now supports **100+ Banis** from Sri Guru Granth Sahib Ji and Sri Dasam Granth Sahib Ji via the BaniDB API.

---

## 📂 New File Structure

```
nitnem/
├── index.html              # Main Bani Library Hub
├── reader.html             # Universal Bani Reader
├── indexbani.html          # Redirect to new index (backwards compat)
├── css/
│   ├── design-system.css   # Core design tokens & variables
│   ├── hub.css             # Hub page styles
│   ├── reader.css          # Reader page styles
│   └── settings-panel.css  # Settings panel component
├── js/
│   ├── banidb-api.js       # BaniDB API wrapper with caching
│   ├── hub-app.js          # Hub page application
│   └── reader-app.js       # Reader page application
├── data/
│   └── bani-catalog.json   # Bani metadata & categories
├── icons/                  # PWA icons (preserved)
└── [Old individual HTML files preserved for backwards compatibility]
```

---

## 🌟 New Features

### Bani Library Hub (index.html)
- **Dynamic Hero Section** with animated Ik Onkar symbol
- **Time-based Greetings** (Amrit Vela, Morning, Evening, Night)
- **Quick Actions** for Morning/Evening/Night Nitnem
- **Recently Read** section with automatic tracking
- **Categorized Banis**: Nitnem, SGGS, Dasam Granth, All Banis
- **Universal Search** across all 100+ Banis
- **Grid/List View Toggle**
- **Reading Statistics** (streak, completed today)
- **Theme Selection** (Dark, Light, Sepia, AMOLED)

### Universal Bani Reader (reader.html)
- **Verse-by-Verse Display** with beautiful cards
- **Multi-Language Support**: Gurmukhi, Transliteration, English, Punjabi
- **Toggle Controls** for each language layer
- **Reading Progress Bar** with percentage
- **Auto-Scroll** with adjustable speed
- **Keep Screen Awake** (Wake Lock API)
- **Font Size Controls** for each text type
- **12 Theme Options**
- **Line Spacing Options** (Compact, Normal, Relaxed)
- **Section Headers** for Banis with multiple sections
- **Smooth Animations** for verse appearance
- **Keyboard Shortcuts**

### BaniDB API Integration
- **100+ Banis** available from the API
- **Smart Caching** (24-hour expiry, localStorage + memory)
- **Retry Logic** for failed requests
- **Verse Parsing** with all translation sources
- **Pre-cache Popular Banis** for offline use
- **Random Shabad** support
- **Hukamnama** support

---

## 🎨 Design System

### Themes Available
1. Dark (Default)
2. Light
3. Sepia
4. AMOLED Black
5. Deep Blue
6. Indigo
7. Amber (Royal Gold)
8. Saffron
9. Teal
10. Purple
11. Green
12. Rose

### iOS 26+ Inspired Design
- Liquid Glass morphism effects
- Smooth spring animations
- Frosted blur backgrounds
- Subtle shadows and glows
- Micro-interactions on hover/touch
- Sacred gold accent color

---

## 📱 PWA Support

The module is fully PWA-compatible:
- All new files should be added to the Service Worker cache
- Offline reading supported via BaniDB caching
- Icons preserved in `/icons/` directory

### Files to Add to Service Worker Cache:
```javascript
// Add to sw.js STATIC_CACHE_FILES array:
'/nitnem/index.html',
'/nitnem/reader.html',
'/nitnem/css/design-system.css',
'/nitnem/css/hub.css',
'/nitnem/css/reader.css',
'/nitnem/css/settings-panel.css',
'/nitnem/js/banidb-api.js',
'/nitnem/js/hub-app.js',
'/nitnem/js/reader-app.js',
'/nitnem/data/bani-catalog.json',
```

---

## 🔗 Navigation

### From Main App
Link to: `/nitnem/index.html` or `/nitnem/`

### Old Links (Backwards Compatible)
- `/nitnem/indexbani.html` → Redirects to `/nitnem/index.html`
- Individual Bani files preserved but recommend using reader.html

### Reader URL Format
```
/nitnem/reader.html?id={baniId}
```

Example: `/nitnem/reader.html?id=2` (Japji Sahib)

---

## 📚 Bani ID Reference

| ID | Bani Name |
|----|-----------|
| 2 | Japji Sahib |
| 4 | Jaap Sahib |
| 6 | Tav Prasad Savaiye (Sravag Sudh) |
| 7 | Tav Prasad Savaiye (Deenan Ki) |
| 9 | Chaupai Sahib |
| 10 | Anand Sahib |
| 21 | Rehras Sahib |
| 23 | Sohila Sahib |
| 24 | Ardas |
| 31 | Sukhmani Sahib |
| 36 | Dukh Bhanjani Sahib |
| 90 | Asa Di Vaar |

Full list available via BaniDB API: `https://api.banidb.com/v2/banis`

---

## 🧪 Testing Checklist

- [ ] Hub page loads all Banis from API
- [ ] Search works for Gurmukhi, English, Hindi
- [ ] Quick actions navigate correctly
- [ ] Reader loads any Bani by ID
- [ ] All language toggles work
- [ ] Theme switching works
- [ ] Font size adjustments work
- [ ] Progress bar updates on scroll
- [ ] Settings persist after reload
- [ ] Offline caching works
- [ ] PWA installs correctly
- [ ] Mobile responsive design
- [ ] Keyboard navigation works

---

## 🙏 Credits

- Gurbani content from **[BaniDB](https://banidb.com)**
- UI inspired by iOS 26+ design language
- Built with ❤️ as Seva through code

ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ ॥ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਿਹ ॥
