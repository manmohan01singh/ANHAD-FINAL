# Naam Abhyas Notification Refinement

## Overview
Updated Naam Abhyas notification messages to be more respectful, calming, and contextually appropriate based on time of day.

## Changes Made

### 1. **Time-Based Categorization** 🕐
Messages are now categorized by time of day for more personal, contextual reminders:

#### 🌅 Morning (3 AM - 8 AM) - Amrit Vela & Early Morning
- Focus: Beginning the day with Simran
- 5 messages including:
  - "ਵਾਹਿਗੁਰੂ ਜੀ — ਸਿਮਰਨ ਦਾ ਸਮਾਂ ਹੋ ਗਿਆ 🙏"
  - "Begin your day with Naam Simran. 🙏"

#### ☀️ Daytime (9 AM - 5 PM)
- Focus: Taking peaceful pauses during busy hours
- 8 messages including:
  - "ਕਿਰਪਾ ਕਰਕੇ 2 ਮਿੰਟ ਲਈ ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਕਰੋ"
  - "Take a peaceful 2-minute pause for Naam Simran. 🙏"

#### 🌆 Evening (6 PM - 9 PM)
- Focus: Ending the day with reflection
- 5 messages including:
  - "ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ"
  - "Let the mind become still. Remember Waheguru Ji."

#### 🌙 Night (10 PM - 2 AM)
- Focus: Final moments of the day in Naam
- 6 messages including:
  - "Offer these final moments of the day to Naam. 🙏"
  - "Pause. Breathe. Close your eyes. Waheguru... Waheguru... 🙏"

#### General Messages (Mixed In 20% of the time)
- 5 universal messages that work any time

### 2. **Tone Refinement**
- Removed casual/urgent language ("Har kise nu wait kra", "Tera schedule ho gya")
- Removed comparison-based messaging ("2 minutes > 2 hours of scrolling")
- Removed gamification language ("Your streak grows stronger")
- Added gentle, respectful invitations instead of commands

### 3. **Bilingual Balance**
- Maintained Gurmukhi for authentic Gurbani lines
- English translations are more literal and respectful
- Messages work well in both languages

## Technical Implementation

```javascript
// Time-based message selection
function getTimeBasedMessage(hour) {
    var timeCategory;
    if (hour >= 3 && hour < 9) {
        timeCategory = naamMessages.morning;
    } else if (hour >= 9 && hour < 18) {
        timeCategory = naamMessages.daytime;
    } else if (hour >= 18 && hour < 22) {
        timeCategory = naamMessages.evening;
    } else {
        timeCategory = naamMessages.night;
    }
    
    // 20% chance to use general messages
    if (Math.random() < 0.2) {
        timeCategory = naamMessages.general;
    }
    
    // Random selection from category
    var msgIdx = Math.floor(Math.random() * timeCategory.length);
    return timeCategory[msgIdx];
}
```

## Files Updated

1. ✅ `frontend/lib/capacitor-notifications-global.js`
2. ✅ `ios/App/App/public/lib/capacitor-notifications-global.js`
3. ⚠️ `android/app/src/main/assets/public/lib/capacitor-notifications-global.js` (needs update on next build)

## Gurbani Source Attribution - Important Recommendation

### Current Gurbani Lines in Messages:
1. **"ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ"**
   - Source: SGGS Ang 263, Raag Gauri
   
2. **"ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ"**
   - Source: SGGS Ang 263, Raag Gauri
   
3. **"ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ"**
   - Source: SGGS Ang 441, Raag Asa
   
4. **"ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ"**
   - Source: SGGS Ang 669, Raag Dhanasari
   
5. **"ਤੂੰ ਮੇਰਾ ਪਿਤਾ ਤੂੰਹੈ ਮੇਰਾ ਮਾਤਾ"**
   - Source: SGGS Ang 103, Raag Majh
   
6. **"ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ ਜੀਉ"**
   - Source: SGGS Ang 72, Raag Sri Raag
   
7. **"ਨਾਮ ਜਪਤ ਅਘ ਕੋਟਿ ਉਤਾਰੇ"**
   - Source: SGGS Ang 266, Raag Gauri

### Recommendation: Add Gurbani Source Attribution

**Why This Matters:**
- Respectful practice for a Gurbani-focused app
- Helps users distinguish between actual Gurbani and app-generated messages
- Educational value - users learn which Ang/Raag the line comes from
- Builds trust and credibility

**Implementation Options:**

#### Option 1: In Notification Details
When user taps the notification, show:
```
🙏 Naam Abhyas Reminder

ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ
"Meditate upon the Divine and find peace."

📖 Source: Sri Guru Granth Sahib Ji, Ang 263
🎵 Raag: Gauri
✍️ Guru: Guru Arjan Dev Ji
```

#### Option 2: In Naam Abhyas Settings
Add a "Message Sources" section where users can see all Gurbani lines with their sources.

#### Option 3: Subtle Footer in Notification
For messages with Gurbani:
```
Body: ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ — Meditate upon the Divine and find peace. (SGGS 263)
```

### Data Structure for Attribution

```javascript
{
    gurmukhi: "ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ",
    english: "Meditate upon the Divine and find peace.",
    source: {
        ang: 263,
        raag: "Gauri",
        guru: "Guru Arjan Dev Ji",
        type: "gurbani" // vs "app-generated"
    }
}
```

## Benefits of This Refinement

1. **More Respectful**: Gentle invitations instead of urgent commands
2. **Contextually Appropriate**: Morning messages feel different from evening ones
3. **Culturally Sensitive**: Maintains Gurbani authenticity
4. **Calming Tone**: Helps users approach Simran with peace, not pressure
5. **Professional**: Suitable for a spiritual/religious app
6. **Varied**: 29 total messages across 5 categories prevent repetition

## Testing Recommendations

1. Test notifications at different times of day to verify correct categorization
2. Verify bilingual display works correctly
3. Check that Gurmukhi text renders properly on all devices
4. Confirm notification delivery timing hasn't changed
5. Test the 20% general message mixing

## Next Steps (Optional Enhancements)

1. **Add Gurbani source attribution** (see recommendation above)
2. Consider adding a user preference for:
   - Gurmukhi only
   - English only
   - Bilingual (current default)
3. Add seasonal messages (Gurpurab days, Vaisakhi, etc.)
4. Consider voice-based notifications using Gurbani audio clips

---

**Updated**: January 2025
**Status**: ✅ Implemented in frontend and iOS, pending Android build
