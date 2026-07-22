# Pothi Bani Display Update - Guru Images Implementation

## Summary
Replaced emoji icons with Guru Saheb display pictures (DPs) in the Pothi feature, matching the professional style used in the SGGS HTML section.

## Changes Made

### 1. Bani Database Update (Line ~768)
**Updated all banis to use Guru images instead of emojis:**

- **Nitnem Banis:**
  - Japji Sahib → Guru Nanak Dev Ji
  - Jaap Sahib, Tav Prasad Savaiye, Chaupai Sahib → Guru Gobind Singh Ji
  - Anand Sahib → Guru Amar Das Ji
  - Rehras Sahib → Guru Ram Das Ji
  - Sohila Sahib → Guru Nanak Dev Ji
  - Ardas → Sri Guru Granth Sahib Ji

- **Sri Guru Granth Sahib Ji Banis:**
  - Sukhmani Sahib, Dukh Bhanjani, Shabad Hazare, Barah Maha, Bavan Akhri, Sukhmana → Guru Arjan Dev Ji
  - Asa Di Vaar, Aarti, Sidh Gosht, Dakhni Oankar → Guru Nanak Dev Ji
  - Salok Mahalla 9 → Guru Tegh Bahadur Ji
  - Lavan → Guru Ram Das Ji
  - Raag Mala, Salok Bhagat Kabir Ji, Salok Sheikh Farid → Sri Guru Granth Sahib Ji

- **Sri Dasam Granth Sahib Ji Banis:**
  - All banis → Guru Gobind Singh Ji (Shabad Hazare P10, Akal Ustat, Chandi Charitra, Chandi Di Vaar, Shastar Naam Mala, Ugardanti)

### 2. CSS Updates

**Card Icon Styling (Line ~258):**
```css
.pothi-bani-card .card-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    overflow: hidden;
    border: 2px solid rgba(212, 175, 55, 0.2);
}
.pothi-bani-card .card-icon img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center 30%;
}
```

**Edit Mode Icon Styling (Line ~551):**
```css
.bani-select-icon { 
    width: 40px; height: 40px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid rgba(212, 175, 55, 0.15);
}
.bani-select-icon img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center 30%;
}
```

### 3. JavaScript Rendering Updates

**Reading View (Line ~1239):**
- Changed from emoji `${bani.icon}` to image tag
- Added proper alt text and lazy loading
- Format: `<img decoding="async" src="${bani.guruImage}" alt="${bani.guruAlt}" loading="lazy">`

**Pending Banis View (Line ~1319):**
- Updated rollover banis to use Guru images with proper styling
- Maintained consistent border and image positioning

**Edit View (Line ~1733):**
- Updated selection cards to display Guru images instead of emojis
- Consistent styling across all view modes

## Files Updated

✅ `frontend/nitnem/my-pothi.html` (main source)
✅ `ios/App/App/public/nitnem/my-pothi.html` (iOS build)
✅ `android/app/src/main/assets/public/nitnem/my-pothi.html` (Android build)

## Benefits

1. **Professional Appearance:** Matches the premium design of SGGS section
2. **Spiritual Authenticity:** Shows actual Guru Sahebs instead of generic emojis
3. **Consistency:** Uniform design language across the entire app
4. **Better Recognition:** Users can immediately identify which Guru's bani they're reading
5. **Respectful Presentation:** Honors the Gurus with their sacred images

## Image Sources

All Guru images are sourced from:
- `../guruimages/` directory
- Images available in both JPEG and AVIF formats
- Properly optimized with `object-position: center 30%` for best face framing

## Testing Recommendations

1. ✅ Verify images load correctly in reading view
2. ✅ Check edit mode displays images properly
3. ✅ Test pending banis rollover with images
4. ✅ Ensure drag-and-drop functionality still works
5. ✅ Validate on both light and dark themes
6. ✅ Test on mobile devices (iOS & Android)

## Notes

- All emojis have been completely removed
- Image paths are relative (`../guruimages/`)
- Lazy loading implemented for performance
- Alt text added for accessibility
- Border styling matches the sacred gold theme

---

**Status:** ✅ COMPLETE
**Date:** January 2025
**Impact:** All Pothi banis now display with Guru Saheb DPs
