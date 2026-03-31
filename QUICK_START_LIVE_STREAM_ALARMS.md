# 🚀 Quick Start: Live Stream Alarms

## For Users

### How to Set a Live Stream Alarm

1. **Open Smart Reminders**
   ```
   Navigate to: Reminders / Smart Reminders
   ```

2. **Create or Edit an Alarm**
   - Tap the "+" button to create new alarm
   - Or tap existing alarm to edit

3. **Select Live Stream Sound**
   - Tap the "Sound" button (🔊 icon)
   - You'll see two live stream options at the top:
     - 🕌 **Live Darbar Sahib** - 24/7 live Kirtan from Golden Temple
     - 🌅 **Live Amritvela Kirtan** - Continuous curated Smagam tracks
   - Tap your preferred live stream
   - You'll see a confirmation message

4. **Set Time and Save**
   - Set your desired alarm time
   - Tap "Save" or "Add Alarm"

5. **When Alarm Fires**
   - At the scheduled time, the live stream will automatically start
   - You'll hear live Kirtan through the mini-player
   - Control playback using the mini-player controls

### Example: Wake Up to Amritvela

```
Goal: Wake up at 4:00 AM to live Darbar Sahib Kirtan

Steps:
1. Open Smart Reminders
2. Tap "+" to add alarm
3. Set time to 4:00 AM
4. Tap Sound button
5. Select "🕌 Live Darbar Sahib"
6. Tap Save
7. Done! ✅

Result: At 4:00 AM, you'll wake up to live Kirtan from Golden Temple
```

## For Developers

### Quick Integration Test

#### 1. Test the Feature
```bash
# Open test page in browser
open frontend/test-livestream-alarm.html
```

#### 2. Verify Files Loaded
Open browser console and check:
```javascript
// Should all return true
console.log('GlobalMiniPlayer:', !!window.GlobalMiniPlayer);
console.log('GuaranteedAlarmSystem:', !!window.GuaranteedAlarmSystem);
console.log('LiveStreamExtension:', !!window.LiveStreamAlarmExtension);
console.log('LiveStreamSoundOptions:', !!window.LiveStreamSoundOptions);
```

#### 3. Test Alarm Firing
```javascript
// In browser console
const testAlarm = {
    id: 'test_' + Date.now(),
    title: 'Test Live Stream',
    tone: 'live-darbar',
    enabled: true
};

window.GuaranteedAlarmSystem.fireAlarm(testAlarm);
// Should start playing Live Darbar Sahib
```

#### 4. Test Sound Selection
```javascript
// Check available sounds
window.LiveStreamSoundOptions.options.forEach(opt => {
    console.log(`${opt.icon} ${opt.name} (${opt.type})`);
});

// Should show:
// 🕌 Live Darbar Sahib (live)
// 🌅 Live Amritvela Kirtan (live)
// 🕉️ Waheguru Simran (audio)
// ... etc
```

### Integration Checklist

#### ✅ Files in Place
- [ ] `frontend/lib/guaranteed-alarm-system.js` (modified)
- [ ] `frontend/reminders/smart-reminders.html` (modified)
- [ ] `frontend/reminders/cinematic-v5.js` (modified)
- [ ] `frontend/reminders/cinematic-v5.css` (modified)
- [ ] `frontend/reminders/smart-reminders-v6-livestream.js` (new)
- [ ] `frontend/reminders/js/livestream-sound-options.js` (new)
- [ ] `frontend/reminders/css/livestream-sounds.css` (new)

#### ✅ Scripts Loaded in HTML
Check `frontend/reminders/smart-reminders.html`:
```html
<!-- Should have these in order -->
<link rel="stylesheet" href="css/livestream-sounds.css">
<script src="smart-reminders-v6-livestream.js"></script>
<script src="js/livestream-sound-options.js"></script>
<script src="cinematic-v5.js"></script>
```

#### ✅ Live Streams in SOUNDS Array
Check `frontend/reminders/cinematic-v5.js`:
```javascript
const SOUNDS = [
    // Should have these at the top
    { id:'live-darbar', ... },
    { id:'live-amritvela', ... },
    // ... regular audio files
];
```

#### ✅ GuaranteedAlarmSystem Updated
Check `frontend/lib/guaranteed-alarm-system.js`:
```javascript
const CONFIG = {
    // Should have this
    LIVE_STREAMS: {
        'live-darbar': { ... },
        'live-amritvela': { ... }
    }
};
```

### Common Issues & Solutions

#### Issue 1: Live Stream Doesn't Start
**Symptoms:** Alarm fires but no audio plays

**Check:**
```javascript
// 1. Is GlobalMiniPlayer available?
console.log(window.GlobalMiniPlayer);

// 2. Is the tone ID correct?
console.log(alarm.tone); // Should be 'live-darbar' or 'live-amritvela'

// 3. Check console for errors
// Look for: [GuaranteedAlarms] or [LiveStreamAlarm] messages
```

**Solution:**
- Ensure `global-mini-player.js` is loaded before alarm fires
- Check that tone ID matches exactly: `'live-darbar'` or `'live-amritvela'`
- Verify GlobalMiniPlayer is initialized

#### Issue 2: Live Options Don't Appear
**Symptoms:** Sound selector only shows regular audio files

**Check:**
```javascript
// Are live streams in SOUNDS array?
console.log(SOUNDS.filter(s => s.type === 'live'));
// Should return 2 items
```

**Solution:**
- Verify `cinematic-v5.js` has updated SOUNDS array
- Check browser cache (hard refresh: Ctrl+Shift+R)
- Ensure scripts are loaded in correct order

#### Issue 3: Preview Button Shows Error
**Symptoms:** Clicking preview on live stream shows error

**Expected Behavior:** This is correct! Live streams show info message instead of preview.

**Check:**
```javascript
// Should show toast message
// "🕌 Live Darbar Sahib - Will start when alarm fires"
```

### Manual Testing Script

```javascript
// Copy-paste this into browser console for complete test

console.log('🧪 Starting Live Stream Alarm Test...\n');

// 1. Check systems
console.log('1️⃣ Checking Systems:');
console.log('   GlobalMiniPlayer:', !!window.GlobalMiniPlayer ? '✅' : '❌');
console.log('   GuaranteedAlarmSystem:', !!window.GuaranteedAlarmSystem ? '✅' : '❌');
console.log('   LiveStreamExtension:', !!window.LiveStreamAlarmExtension ? '✅' : '❌');
console.log('   LiveStreamSoundOptions:', !!window.LiveStreamSoundOptions ? '✅' : '❌');

// 2. Check live streams configured
console.log('\n2️⃣ Checking Live Streams:');
if (window.LiveStreamSoundOptions) {
    const liveStreams = window.LiveStreamSoundOptions.options.filter(o => o.type === 'live');
    console.log('   Found', liveStreams.length, 'live streams:');
    liveStreams.forEach(s => console.log('   -', s.icon, s.name));
}

// 3. Test alarm firing
console.log('\n3️⃣ Testing Alarm (will start in 3 seconds)...');
setTimeout(() => {
    const testAlarm = {
        id: 'test_' + Date.now(),
        title: 'Test Live Stream',
        tone: 'live-darbar',
        enabled: true
    };
    
    console.log('   Firing test alarm with tone:', testAlarm.tone);
    window.GuaranteedAlarmSystem.fireAlarm(testAlarm);
    
    setTimeout(() => {
        if (window.GlobalMiniPlayer && window.GlobalMiniPlayer.isPlaying) {
            console.log('   ✅ SUCCESS! Live stream is playing!');
        } else {
            console.log('   ⚠️ Live stream may not be playing. Check audio.');
        }
    }, 2000);
}, 3000);

console.log('\n✅ Test script running...');
```

## Testing Workflow

### 1. Quick Visual Test (30 seconds)
```
1. Open Smart Reminders
2. Click Sound button
3. ✅ Verify: See live streams at top with LIVE badges
4. ✅ Verify: Animated gradient backgrounds
5. ✅ Verify: Icons pulse
```

### 2. Selection Test (1 minute)
```
1. Click "Live Darbar Sahib"
2. ✅ Verify: Item highlights
3. ✅ Verify: Toast shows confirmation
4. Click "Live Amritvela Kirtan"
5. ✅ Verify: Selection changes
6. ✅ Verify: Toast shows new selection
```

### 3. Alarm Test (2 minutes)
```
1. Create alarm for 1 minute from now
2. Select "Live Darbar Sahib"
3. Save alarm
4. Wait for alarm to fire
5. ✅ Verify: Live stream starts automatically
6. ✅ Verify: Mini-player appears
7. ✅ Verify: Can control playback
```

### 4. Full Integration Test (5 minutes)
```
1. Create multiple alarms:
   - 4:00 AM with Live Darbar Sahib
   - 6:00 PM with Live Amritvela Kirtan
   - 9:00 PM with regular audio
2. ✅ Verify: All save correctly
3. Edit each alarm
4. ✅ Verify: Correct sound selected
5. Test one alarm
6. ✅ Verify: Correct audio plays
```

## Production Deployment

### Pre-Deployment Checklist
- [ ] All files committed to repository
- [ ] Test page works locally
- [ ] Manual testing completed
- [ ] No console errors
- [ ] GlobalMiniPlayer integration verified
- [ ] GuaranteedAlarmSystem integration verified
- [ ] Mobile responsive design verified
- [ ] Dark/light mode tested

### Deployment Steps
1. Commit all changes
2. Push to repository
3. Deploy to production
4. Test on production URL
5. Verify live streams work
6. Monitor for errors

### Post-Deployment Verification
```javascript
// On production site, run:
console.log('Live Stream Alarms:', {
    extension: !!window.LiveStreamAlarmExtension,
    options: !!window.LiveStreamSoundOptions,
    guaranteed: !!window.GuaranteedAlarmSystem,
    miniPlayer: !!window.GlobalMiniPlayer
});
// All should be true
```

## Support & Troubleshooting

### Getting Help
1. Check `LIVE_STREAM_ALARM_FEATURE.md` for detailed documentation
2. Check `LIVE_STREAM_ALARM_IMPLEMENTATION_COMPLETE.md` for technical details
3. Review browser console for error messages
4. Test with `frontend/test-livestream-alarm.html`

### Debug Mode
Enable verbose logging:
```javascript
// In browser console
localStorage.setItem('debug_live_streams', 'true');
// Reload page
```

### Reset Everything
If things get stuck:
```javascript
// Clear all alarm data
localStorage.removeItem('anhad_cine_v5');
localStorage.removeItem('sr_reminders_v4');
// Reload page
```

## Success Indicators

✅ **Feature is Working When:**
- Live stream options appear in sound selector
- LIVE badges are animated
- Selection saves correctly
- Alarm fires and starts live stream
- GlobalMiniPlayer shows stream playing
- User can control playback
- No console errors

🎉 **You're Done!**

Users can now wake up to live Kirtan from Darbar Sahib! 🙏

---

**Need Help?** Check the documentation files or test page for more details.
