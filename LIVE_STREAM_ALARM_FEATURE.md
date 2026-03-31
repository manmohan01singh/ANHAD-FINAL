# 🔴 Live Stream Alarm Feature

## Overview

Users can now select **Live Darbar Sahib** or **Live Amritvela Kirtan** as their alarm sound. When the alarm fires, it automatically starts playing the selected live stream through the GlobalMiniPlayer system.

## Features

✅ **Live Darbar Sahib** - 24/7 live Kirtan from Sri Harmandir Sahib  
✅ **Live Amritvela Kirtan** - Continuous curated Smagam tracks  
✅ Seamless integration with existing alarm system  
✅ Works with GuaranteedAlarmSystem for reliability  
✅ Beautiful UI with live badges and animations  
✅ Automatic GlobalMiniPlayer integration  

## Implementation

### Files Created/Modified

#### New Files:
1. **`frontend/reminders/smart-reminders-v6-livestream.js`**
   - Extension module for live stream support
   - Adds live stream configuration
   - Provides helper functions

2. **`frontend/reminders/js/livestream-sound-options.js`**
   - UI component for sound selection
   - Generates HTML for live stream options
   - Handles preview and selection logic

3. **`frontend/reminders/css/livestream-sounds.css`**
   - Styles for live stream options
   - Animated LIVE badges
   - Responsive design

#### Modified Files:
1. **`frontend/lib/guaranteed-alarm-system.js`**
   - Added `LIVE_STREAMS` configuration
   - Added `playLiveStream()` function
   - Modified `playAlarmSound()` to detect live streams
   - Modified `stopAlarm()` to stop live streams

## How It Works

### 1. Configuration

```javascript
const CONFIG = {
    liveStreams: {
        'live-darbar': {
            name: 'Live Darbar Sahib',
            subtitle: 'Sri Harmandir Sahib Ji • 24/7',
            icon: '🕌',
            stream: 'darbar'  // Maps to GlobalMiniPlayer stream ID
        },
        'live-amritvela': {
            name: 'Live Amritvela Kirtan',
            subtitle: 'Curated Smagam Tracks',
            icon: '🌅',
            stream: 'amritvela'
        }
    }
};
```

### 2. Alarm Firing Logic

When an alarm fires:

```javascript
function playAlarmSound(tone) {
    // Check if it's a live stream
    if (CONFIG.LIVE_STREAMS[tone]) {
        playLiveStream(tone);
        return;
    }
    
    // Otherwise play regular audio file
    // ... existing code
}

function playLiveStream(tone) {
    const streamInfo = CONFIG.LIVE_STREAMS[tone];
    
    // Use GlobalMiniPlayer to start the stream
    if (window.GlobalMiniPlayer) {
        window.GlobalMiniPlayer.play(streamInfo.stream);
    }
}
```

### 3. UI Integration

The sound selector now shows:

```
📻 Live Streams
├── 🕌 Live Darbar Sahib [LIVE]
│   Sri Harmandir Sahib Ji • 24/7
│   Real-time Kirtan from Golden Temple
│
└── 🌅 Live Amritvela Kirtan [LIVE]
    Curated Smagam Tracks
    Continuous Amritvela Kirtan

🔔 Audio Files
├── 🔔 Waheguru Bell
├── 📿 Mool Mantar
├── 🎵 Kirtan Gentle
├── 🌙 Peaceful Night
├── 🌄 Morning Raga
└── ⏰ Simple Bell
```

## Integration Steps

### Step 1: Add Scripts to HTML

Add these scripts to `frontend/reminders/smart-reminders.html`:

```html
<!-- Live Stream Support -->
<link rel="stylesheet" href="css/livestream-sounds.css">
<script src="smart-reminders-v6-livestream.js"></script>
<script src="js/livestream-sound-options.js"></script>
```

### Step 2: Initialize Sound Selector

In your existing JavaScript, replace the sound selector initialization:

```javascript
// OLD: Manual HTML generation
// NEW: Use LiveStreamSoundOptions
window.LiveStreamSoundOptions.initialize(
    'soundSheetBody',  // Container ID
    currentTone,       // Currently selected tone
    (soundId, soundType) => {
        // Handle selection
        console.log('Selected:', soundId, soundType);
    }
);
```

### Step 3: Update Alarm Scheduling

The GuaranteedAlarmSystem automatically handles live streams. No changes needed to existing alarm scheduling code.

## User Experience

### Setting an Alarm with Live Stream

1. User opens Smart Reminders
2. Clicks "Add Alarm" or edits existing alarm
3. Clicks "Sound" button
4. Sees live stream options at the top with animated LIVE badges
5. Selects "Live Darbar Sahib" or "Live Amritvela Kirtan"
6. Saves the alarm

### When Alarm Fires

1. At the scheduled time, alarm fires
2. System detects it's a live stream
3. GlobalMiniPlayer automatically starts playing the selected stream
4. User hears live Kirtan instead of a regular alarm sound
5. Mini-player appears showing the live stream
6. User can pause/control from mini-player

## Benefits

### For Users
- Wake up to live Kirtan from Darbar Sahib
- More spiritual and meaningful alarm experience
- Seamless transition to listening to Gurbani
- No need to manually start the stream

### Technical
- Leverages existing GlobalMiniPlayer infrastructure
- No additional audio management needed
- Works with all existing alarm features
- Reliable through GuaranteedAlarmSystem

## Testing

### Test Scenarios

1. **Set alarm with Live Darbar Sahib**
   - Create alarm for 2 minutes from now
   - Select "Live Darbar Sahib" as sound
   - Wait for alarm to fire
   - Verify live stream starts automatically

2. **Set alarm with Live Amritvela**
   - Create alarm for 2 minutes from now
   - Select "Live Amritvela Kirtan" as sound
   - Wait for alarm to fire
   - Verify live stream starts automatically

3. **Switch between live and regular**
   - Edit existing alarm
   - Change from regular audio to live stream
   - Verify it saves correctly
   - Change back to regular audio
   - Verify it works both ways

4. **Multiple alarms**
   - Set one alarm with live stream
   - Set another with regular audio
   - Verify both fire correctly

### Quick Test

```javascript
// In browser console:

// Test live stream detection
window.GuaranteedAlarmSystem.fireAlarm({
    id: 'test',
    title: 'Test Live Stream',
    tone: 'live-darbar',
    enabled: true
});

// Should start playing Live Darbar Sahib
```

## Future Enhancements

### Potential Additions
- [ ] More live stream sources
- [ ] Preview live streams (show info instead of playing)
- [ ] Schedule-based auto-selection (Darbar for morning, etc.)
- [ ] Fade-in for live streams
- [ ] Volume control for alarm streams
- [ ] Integration with Nitnem Tracker

### Advanced Features
- [ ] Smart stream selection based on time of day
- [ ] Fallback to regular audio if stream unavailable
- [ ] Stream quality selection
- [ ] Offline mode with cached audio

## Troubleshooting

### Live Stream Doesn't Start

**Check:**
1. Is GlobalMiniPlayer loaded?
   ```javascript
   console.log(window.GlobalMiniPlayer);
   ```

2. Is the stream ID correct?
   ```javascript
   console.log(CONFIG.LIVE_STREAMS);
   ```

3. Check browser console for errors

### Audio Plays Instead of Stream

**Cause:** Tone ID might not match live stream IDs

**Fix:** Ensure alarm tone is set to `'live-darbar'` or `'live-amritvela'`

### UI Doesn't Show Live Options

**Check:**
1. Is `livestream-sounds.css` loaded?
2. Is `livestream-sound-options.js` loaded?
3. Check browser console for errors

## Code Examples

### Check if Tone is Live Stream

```javascript
function isLiveStream(toneId) {
    return toneId === 'live-darbar' || toneId === 'live-amritvela';
}
```

### Get Live Stream Info

```javascript
const streamInfo = window.LiveStreamSoundOptions.getInfo('live-darbar');
console.log(streamInfo);
// {
//     id: 'live-darbar',
//     name: 'Live Darbar Sahib',
//     subtitle: 'Sri Harmandir Sahib Ji • 24/7',
//     icon: '🕌',
//     type: 'live',
//     badge: 'LIVE'
// }
```

### Manually Start Live Stream

```javascript
if (window.GlobalMiniPlayer) {
    window.GlobalMiniPlayer.play('darbar');
}
```

## Summary

This feature seamlessly integrates live Kirtan streams into the alarm system, providing users with a more spiritual and meaningful wake-up experience. The implementation leverages existing infrastructure and requires minimal changes to the codebase.

**Key Achievement:** Users can now wake up to live Darbar Sahib Kirtan at 4 AM (Amritvela) or any other time! 🙏

---

**Version:** 1.0  
**Date:** 2024  
**Status:** ✅ Ready for Integration
