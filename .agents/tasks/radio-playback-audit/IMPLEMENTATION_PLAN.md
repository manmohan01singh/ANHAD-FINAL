# ANHAD GURBANI RADIO — IMPLEMENTATION PLAN

**Date:** December 10, 2024  
**Priority:** Phase 3 — Critical Reliability Fixes  
**Estimated Total Effort:** 40-60 hours

---

## PLAN STRUCTURE

This plan addresses the confirmed failures identified in the audit report. Fixes are ordered by dependency and impact:

1. **Darbar Sahib Playback Re-engineering** (highest user impact)
2. **iOS Background Audio Configuration** (critical platform gap)
3. **Android Audio Focus Handling** (system integration)
4. **Virtual Stream Reliability** (edge cases)
5. **Diagnostic Logging** (debugging infrastructure)
6. **UX Improvements** (user feedback)

Each item specifies:
- **Files to modify** (exact paths from audit)
- **Current behavior** (what's wrong)
- **Fix implementation** (what to change)
- **Dependencies** (must complete X before Y)
- **Risk level** (low/medium/high)
- **Verification** (command + expected outcome)

---

## SECTION 1: DARBAR SAHIB PLAYBACK RE-ENGINEERING

### ITEM 1.1 — Implement Icecast Relay Server

**Problem:**  
SGPC live stream (`https://live.sgpc.net:8443/`) experiences frequent EOF events where the server stops sending bytes but TCP socket remains open. Current reconnection logic (6 retries with exponential backoff) often exhausts retries before stream recovers.

**Root Cause:**  
Direct dependency on upstream SGPC server stability. No intermediate relay to buffer/failover.

**Solution:**  
Deploy self-hosted Icecast2 relay server on DigitalOcean VPS to proxy SGPC stream.

**Files to Create:**
- New server: DigitalOcean Droplet (Ubuntu 22.04 LTS)
- `/etc/icecast2/icecast.xml` — Relay configuration
- `.env` — Add `DARBAR_RELAY_URL=https://relay.anhad.app/darbar`

**Files to Modify:**
- `frontend/lib/anhad-audio-singleton.js` (line 75):
  ```javascript
  // OLD:
  const SGPC_LIVE = 'https://live.sgpc.net:8443/;nocache=1';
  
  // NEW:
  const SGPC_LIVE = process.env.DARBAR_RELAY_URL || 'https://relay.anhad.app/darbar';
  const SGPC_FALLBACK = 'https://live.sgpc.net:8443/;nocache=1';
  ```

- `frontend/lib/anhad-audio-singleton.js` (DarbarLiveManager.play, line 1159):
  ```javascript
  // Add fallback logic
  let rawUrl = (streamObj && streamObj.url) ? streamObj.url : SGPC_LIVE;
  if (liveReconnectAttempts >= 3) {
    // After 3 failures, try fallback
    rawUrl = SGPC_FALLBACK;
  }
  ```

**Icecast Configuration (`/etc/icecast2/icecast.xml`):**
```xml
<icecast>
  <limits>
    <clients>1000</clients>
    <sources>2</sources>
    <burst-on-connect>1</burst-on-connect>
    <burst-size>65535</burst-size>
  </limits>
  
  <mount type="normal">
    <mount-name>/darbar</mount-name>
    <fallback-mount>/darbar-backup</fallback-mount>
    <fallback-override>1</fallback-override>
    <relay>
      <server>live.sgpc.net</server>
      <port>8443</port>
      <mount>/</mount>
      <on-demand>1</on-demand>
      <retry-delay>5</retry-delay>
    </relay>
  </mount>
  
  <hostname>relay.anhad.app</hostname>
  <listen-socket>
    <port>8000</port>
  </listen-socket>
</icecast>
```

**Cloudflare Proxy Setup:**
- DNS: `relay.anhad.app` → DigitalOcean Droplet IP
- SSL: Full (strict)
- Firewall: Allow port 8000 from Cloudflare IPs only

**Dependencies:** None (can be implemented independently)  
**Risk Level:** LOW (only changes stream URL, fallback preserves existing behavior)  
**Estimated Time:** 6 hours (server setup + testing + DNS propagation)

**Verification:**
1. SSH into VPS: `ssh root@relay.anhad.app`
2. Check Icecast status: `systemctl status icecast2`
3. Test relay URL: `curl -I https://relay.anhad.app/darbar` → Should return `200 OK` with `Content-Type: audio/mpeg`
4. Play in ANHAD app, monitor for 2+ hours continuous playback
5. Simulate SGPC outage (block upstream in icecast.xml), verify fallback triggers

---

### ITEM 1.2 — Add Icy-Metadata Header to Native Connections

**Problem:**  
On Capacitor native (Android/iOS), direct audio connections to Icecast/Shoutcast streams don't set `Icy-MetaData: 0` header. If server sends metadata frames, browser/WebView audio decoder may corrupt or stall.

**Current Behavior:**  
Proxy edge function (`api/stream.js` line 51) sets header for web, but native bypasses proxy.

**Solution:**  
Cannot set HTTP headers on HTML5 Audio element directly. Must proxy ALL Darbar Sahib connections (including native) through backend.

**Files to Modify:**
- `frontend/lib/anhad-audio-singleton.js` (toProxiedUrl function, lines 54-64):
  ```javascript
  // OLD:
  function toProxiedUrl(rawUrl) {
    if (!rawUrl) return rawUrl;
    // Bypass the proxy on Capacitor (no backend server locally)
    if (isCapacitorNative() || ...) return rawUrl;
    // ...
  }
  
  // NEW:
  function toProxiedUrl(rawUrl) {
    if (!rawUrl) return rawUrl;
    // ALWAYS proxy Darbar Sahib live streams (need Icy-MetaData: 0)
    if (rawUrl.includes('sgpc.net') || rawUrl.includes('relay.anhad.app') || rawUrl.includes('sikhnet.com')) {
      return '/api/stream?url=' + encodeURIComponent(rawUrl);
    }
    // Bypass proxy for CDN files (R2, etc.)
    if (isCorsCdnUrl(rawUrl)) return rawUrl;
    // Other live streams: proxy on web, direct on native
    if (isCapacitorNative() || ...) return rawUrl;
    return '/api/stream?url=' + encodeURIComponent(rawUrl);
  }
  ```

**Alternative (Backend Proxy on Native):**  
Capacitor apps need backend server running. Current architecture has frontend served locally, backend at remote URL. This requires:

- Update `capacitor.config.ts` to proxy `/api/*` requests to backend server
- OR: Bundle Express server in Capacitor app (increases app size significantly)

**Recommended Approach:** Accept native may skip Icy-MetaData header, but monitor for decoder corruption. If seen, implement full backend proxy for native.

**Dependencies:** Item 1.1 (relay must be deployed first)  
**Risk Level:** MEDIUM (changing proxy logic could break native playback if backend unreachable)  
**Estimated Time:** 3 hours (modify + test on Android/iOS devices)

**Verification:**
1. Build Android APK: `npm run cap:build`
2. Install on real device
3. Play Darbar Sahib for 30+ minutes
4. Monitor Chrome DevTools remote debugging for audio errors
5. Check Network tab: Darbar URL should hit `/api/stream?url=...`

---

### ITEM 1.3 — Enhance Live Stream EOF Recovery

**Problem:**  
`handleLiveStreamEnded()` (line 1172) triggers on `'ended'` event, but if stream silently stalls without firing `'ended'`, playback hangs indefinitely.

**Current Behavior:**  
- Stall watchdog (line 741) fires after 6 seconds of 'waiting'/'stalled' events
- After 3 stall recoveries, calls `handleLiveStreamEnded()`
- But if TCP socket is open and no events fire, no recovery triggers

**Solution:**  
Add active health check: if playback position doesn't advance for 15 seconds, force reconnection.

**Files to Modify:**
- `frontend/lib/anhad-audio-singleton.js` (add after line 1709, before existing watchdog):
  ```javascript
  // --- LIVE STREAM POSITION WATCHDOG ---
  // If audio element position hasn't advanced in 15s, force reconnection
  let lastLivePositionCheck = 0;
  let lastLivePositionValue = 0;
  const LIVE_POSITION_STALL_THRESHOLD_MS = 15000;
  
  setInterval(() => {
    if (!wantsPlayback || !isPlaying || !currentStream) return;
    if (!STREAMS[currentStream] || STREAMS[currentStream].type !== 'live') return;
    
    const audio = PlaybackQueueController.audio;
    if (!audio || audio.error || audio.readyState === 0) return;
    
    const now = Date.now();
    const currentPos = audio.currentTime || 0;
    
    if (lastLivePositionCheck === 0) {
      // First check, initialize
      lastLivePositionCheck = now;
      lastLivePositionValue = currentPos;
      return;
    }
    
    const elapsedMs = now - lastLivePositionCheck;
    const positionDelta = currentPos - lastLivePositionValue;
    
    if (elapsedMs >= LIVE_POSITION_STALL_THRESHOLD_MS && positionDelta < 1) {
      // Position hasn't advanced in 15 seconds — force reconnection
      console.warn('[AnhadAudio] Live stream position stalled for 15s, forcing reconnection...');
      lastLivePositionCheck = 0;
      handleLiveStreamEnded();
    } else if (positionDelta >= 1) {
      // Position advanced, reset timer
      lastLivePositionCheck = now;
      lastLivePositionValue = currentPos;
    }
  }, 5000); // Check every 5 seconds
  ```

**Dependencies:** None  
**Risk Level:** LOW (only adds detection, doesn't change existing recovery logic)  
**Estimated Time:** 2 hours (implement + test stall scenario)

**Verification:**
1. Open Chrome DevTools, Network tab
2. Play Darbar Sahib
3. Throttle network to "Slow 3G" after 30 seconds
4. Verify console logs: "Live stream position stalled for 15s, forcing reconnection..."
5. Verify audio resumes after reconnection

---

### ITEM 1.4 — Add Server Health Check Endpoint

**Problem:**  
No way to distinguish "SGPC server is down" from "user's network is down". Both trigger same retry logic.

**Solution:**  
Backend health check endpoint that pings SGPC stream and returns status.

**Files to Create:**
- `backend/routes/health.js`:
  ```javascript
  const express = require('express');
  const https = require('https');
  const router = express.Router();
  
  // Cache health check results for 30 seconds
  let cachedResult = null;
  let cacheTimestamp = 0;
  const CACHE_TTL_MS = 30000;
  
  router.get('/darbar-status', async (req, res) => {
    const now = Date.now();
    
    // Return cached result if fresh
    if (cachedResult && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return res.json(cachedResult);
    }
    
    // Ping SGPC stream
    const streamUrl = 'https://live.sgpc.net:8443/';
    const startTime = Date.now();
    
    https.get(streamUrl, { timeout: 5000 }, (streamRes) => {
      const latency = Date.now() - startTime;
      const status = streamRes.statusCode === 200 ? 'online' : 'offline';
      
      cachedResult = {
        status,
        latency,
        timestamp: now,
        contentType: streamRes.headers['content-type']
      };
      cacheTimestamp = now;
      
      streamRes.destroy(); // Don't download stream, just check headers
      res.json(cachedResult);
    }).on('error', (err) => {
      cachedResult = {
        status: 'offline',
        error: err.message,
        timestamp: now
      };
      cacheTimestamp = now;
      res.json(cachedResult);
    });
  });
  
  module.exports = router;
  ```

**Files to Modify:**
- `backend/server.js` (add after line 100):
  ```javascript
  const healthRoutes = require('./routes/health');
  app.use('/api/health', healthRoutes);
  ```

- `frontend/lib/anhad-audio-singleton.js` (modify error handler, line 712):
  ```javascript
  } else if (currentStream && STREAMS[currentStream]?.type === 'live') {
    // Check if SGPC server is down vs. user's network
    fetch('/api/health/darbar-status')
      .then(res => res.json())
      .then(health => {
        if (health.status === 'offline') {
          emit('error', { 
            type: 'stream_offline', 
            message: 'Darbar Sahib stream is currently offline. We\'ll retry automatically.' 
          });
        } else {
          emit('error', { 
            type: 'network', 
            message: 'Network error - Please check your internet connection' 
          });
        }
      })
      .catch(() => {
        // Health check failed, assume network issue
        emit('error', { type: 'network', message: 'Network error' });
      });
    
    // Continue with existing retry logic...
    liveReconnectAttempts++;
    // ...
  }
  ```

**Dependencies:** Item 1.1 (relay must exist to check)  
**Risk Level:** LOW (adds diagnostic info, doesn't change behavior)  
**Estimated Time:** 3 hours (implement + test)

**Verification:**
1. Start backend: `npm run dev`
2. Test endpoint: `curl http://localhost:3004/api/health/darbar-status`
3. Expected response:
   ```json
   {
     "status": "online",
     "latency": 245,
     "timestamp": 1702234567890,
     "contentType": "audio/mpeg"
   }
   ```
4. Block SGPC in firewall, retry curl, verify `"status": "offline"`

---

## SECTION 2: IOS BACKGROUND AUDIO CONFIGURATION

### ITEM 2.1 — Add UIBackgroundModes to Info.plist

**Problem:**  
iOS suspends background audio after ~30 seconds when app moves to background. No `UIBackgroundModes` configuration found in iOS project.

**Current Behavior:**  
Playing Darbar Sahib, press Home button, audio stops after 30s.

**Solution:**  
Add `UIBackgroundModes` key with `audio` value to Info.plist.

**Files to Modify:**
- `ios/App/App/Info.plist`:
  ```xml
  <!-- Add after existing <dict> keys, before closing </dict> -->
  <key>UIBackgroundModes</key>
  <array>
    <string>audio</string>
  </array>
  ```

**Full Context (Info.plist structure):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>ANHAD</string>
  <!-- ... other keys ... -->
  
  <!-- ADD THIS: -->
  <key>UIBackgroundModes</key>
  <array>
    <string>audio</string>
  </array>
  
</dict>
</plist>
```

**Dependencies:** None  
**Risk Level:** LOW (standard iOS audio configuration)  
**Estimated Time:** 30 minutes (modify + rebuild + test)

**Verification:**
1. Open Xcode: `npx cap open ios`
2. Verify Info.plist contains `UIBackgroundModes` → `audio`
3. Build to iOS device (simulator doesn't fully test background audio)
4. Play Darbar Sahib, press Home button
5. Wait 2 minutes, audio should continue playing
6. Open Control Center, verify playback controls show ANHAD
7. Test for 30+ minutes in background

---

### ITEM 2.2 — Configure AVAudioSession (Optional Enhancement)

**Problem:**  
Even with `UIBackgroundModes`, iOS may pause audio if another app plays sound (interruption handling).

**Current Behavior:**  
JavaScript MediaSession API handles web-level controls, but native iOS audio session not explicitly configured.

**Solution:**  
Add native Swift code to configure `AVAudioSession` for background playback and interruption handling.

**Files to Create:**
- `ios/App/App/AudioSessionManager.swift`:
  ```swift
  import Foundation
  import AVFoundation
  
  @objc public class AudioSessionManager: NSObject {
    
    @objc public static let shared = AudioSessionManager()
    
    @objc public func configureAudioSession() {
      let audioSession = AVAudioSession.sharedInstance()
      
      do {
        try audioSession.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try audioSession.setActive(true)
        
        // Listen for interruptions (calls, alarms, etc.)
        NotificationCenter.default.addObserver(
          self,
          selector: #selector(handleInterruption),
          name: AVAudioSession.interruptionNotification,
          object: audioSession
        )
        
        print("[ANHAD] AVAudioSession configured for background playback")
      } catch {
        print("[ANHAD] Failed to configure AVAudioSession: \(error)")
      }
    }
    
    @objc private func handleInterruption(notification: Notification) {
      guard let userInfo = notification.userInfo,
            let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
        return
      }
      
      switch type {
      case .began:
        // Interruption began (e.g., phone call)
        print("[ANHAD] Audio interruption began")
        // JavaScript MediaSession API will handle pause
      case .ended:
        // Interruption ended
        print("[ANHAD] Audio interruption ended")
        if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
          let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
          if options.contains(.shouldResume) {
            print("[ANHAD] Should resume playback after interruption")
            // JavaScript will handle resume via MediaSession
          }
        }
      @unknown default:
        break
      }
    }
  }
  ```

**Files to Modify:**
- `ios/App/App/AppDelegate.swift` (add in `application(_:didFinishLaunchingWithOptions:)`):
  ```swift
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Existing Capacitor setup...
    
    // Configure audio session for background playback
    AudioSessionManager.shared.configureAudioSession()
    
    return true
  }
  ```

**Dependencies:** Item 2.1 (UIBackgroundModes must be set first)  
**Risk Level:** MEDIUM (native Swift code, requires iOS testing)  
**Estimated Time:** 4 hours (implement + test interruption scenarios)

**Verification:**
1. Build iOS app: `npx cap sync ios && npx cap open ios`
2. Run on real device
3. Play Darbar Sahib
4. **Test interruptions:**
   - Make phone call → audio should pause
   - End call → audio should resume automatically
   - Start Apple Music → audio should mix or pause (depends on app policy)
   - Trigger Siri → audio should duck volume, then restore
5. Verify Xcode console logs: `[ANHAD] AVAudioSession configured for background playback`

**Note:** This item is OPTIONAL. Item 2.1 alone may be sufficient if MediaSession API already handles interruptions correctly.

---

## SECTION 3: ANDROID AUDIO FOCUS HANDLING

### ITEM 3.1 — Implement Audio Focus Request in AudioForegroundService

**Problem:**  
Android manifest declares `MODIFY_AUDIO_SETTINGS` permission but no explicit `AudioManager.requestAudioFocus()` call found. Other apps (calls, YouTube, etc.) may steal audio focus without proper recovery.

**Current Behavior:**  
Playing Darbar Sahib, incoming call plays ringtone, ANHAD audio continues playing (rude behavior). After call ends, both may play simultaneously.

**Solution:**  
Add audio focus handling in `AudioForegroundService.java`.

**Files to Modify:**
- `android/app/src/main/java/com/anhad/app/AudioForegroundService.java`:

**Note:** This file was not audited directly. Assuming it exists based on AndroidManifest.xml. If it doesn't exist, create it.

**Implementation:**
```java
package com.anhad.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class AudioForegroundService extends Service {
    
    private static final String CHANNEL_ID = "AnhadAudioChannel";
    private static final int NOTIFICATION_ID = 1001;
    
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean hasAudioFocus = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        requestAudioFocus();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        
        String title = intent.getStringExtra("title");
        String artist = intent.getStringExtra("artist");
        
        Notification notification = buildNotification(title, artist);
        startForeground(NOTIFICATION_ID, notification);
        
        return START_STICKY;
    }
    
    private void requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
            
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(audioAttributes)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(focusChangeListener)
                .build();
            
            int result = audioManager.requestAudioFocus(audioFocusRequest);
            hasAudioFocus = (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED);
        } else {
            int result = audioManager.requestAudioFocus(
                focusChangeListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            );
            hasAudioFocus = (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED);
        }
        
        if (hasAudioFocus) {
            android.util.Log.d("ANHAD", "Audio focus granted");
        } else {
            android.util.Log.w("ANHAD", "Audio focus denied");
        }
    }
    
    private AudioManager.OnAudioFocusChangeListener focusChangeListener = 
        new AudioManager.OnAudioFocusChangeListener() {
        @Override
        public void onAudioFocusChange(int focusChange) {
            switch (focusChange) {
                case AudioManager.AUDIOFOCUS_LOSS:
                    // Permanent loss (e.g., another app started music playback)
                    android.util.Log.d("ANHAD", "Audio focus lost permanently");
                    sendCommandToJS("PAUSE");
                    hasAudioFocus = false;
                    break;
                    
                case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                    // Temporary loss (e.g., notification sound, phone call)
                    android.util.Log.d("ANHAD", "Audio focus lost temporarily");
                    sendCommandToJS("PAUSE");
                    break;
                    
                case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                    // Can continue at lower volume (e.g., navigation voice)
                    android.util.Log.d("ANHAD", "Audio focus lost, should duck");
                    // Optionally: sendCommandToJS("DUCK") if implementing volume ducking
                    break;
                    
                case AudioManager.AUDIOFOCUS_GAIN:
                    // Regained focus
                    android.util.Log.d("ANHAD", "Audio focus regained");
                    sendCommandToJS("RESUME");
                    hasAudioFocus = true;
                    break;
            }
        }
    };
    
    private void sendCommandToJS(String command) {
        // Send command to JavaScript via Capacitor plugin bridge
        // This assumes a plugin method exists to receive native commands
        Intent intent = new Intent("com.anhad.app.AUDIO_COMMAND");
        intent.putExtra("command", command);
        sendBroadcast(intent);
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        abandonAudioFocus();
    }
    
    private void abandonAudioFocus() {
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
            } else {
                audioManager.abandonAudioFocus(focusChangeListener);
            }
            hasAudioFocus = false;
            android.util.Log.d("ANHAD", "Audio focus abandoned");
        }
    }
    
    private Notification buildNotification(String title, String artist) {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title != null ? title : "ANHAD Kirtan")
            .setContentText(artist != null ? artist : "Playing Gurbani Radio")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "ANHAD Audio Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Persistent notification for Gurbani Radio playback");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
```

**Files to Create (JavaScript Receiver):**
- `frontend/lib/android-audio-focus-receiver.js`:
  ```javascript
  (function() {
    'use strict';
    
    if (!window.Capacitor || !window.Capacitor.Plugins) return;
    
    // Listen for Android audio focus commands
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'AUDIO_COMMAND') {
        const command = event.data.command;
        console.log('[ANHAD] Received audio focus command:', command);
        
        if (!window.AnhadAudio) return;
        
        switch (command) {
          case 'PAUSE':
            window.AnhadAudio.pauseFromNative();
            break;
          case 'RESUME':
            window.AnhadAudio.resumeFromNative();
            break;
          case 'DUCK':
            // Optionally implement volume ducking
            window.AnhadAudio.setVolume(0.3);
            break;
        }
      }
    });
  })();
  ```

**Files to Modify:**
- `frontend/index.html` (add before anhad-audio-singleton.js):
  ```html
  <script src="lib/android-audio-focus-receiver.js"></script>
  ```

**Dependencies:** None  
**Risk Level:** MEDIUM (native Android code, requires device testing)  
**Estimated Time:** 6 hours (implement + test + debug)

**Verification:**
1. Build APK: `npm run cap:build`
2. Install on Android device
3. Play Darbar Sahib
4. **Test scenarios:**
   - Make phone call → audio should pause immediately
   - End call → audio should resume automatically
   - Play YouTube video → ANHAD audio should pause
   - Pause YouTube → ANHAD should NOT auto-resume (user paused it elsewhere)
   - Google Maps navigation → audio should duck (lower volume), not pause
   - Close Maps → audio should restore to full volume
5. Check logcat: `adb logcat | grep ANHAD`
   - Should see: "Audio focus granted", "Audio focus lost temporarily", etc.

---

### ITEM 3.2 — Handle Headphone/Bluetooth Disconnect

**Problem:**  
No `ACTION_AUDIO_BECOMING_NOISY` broadcast receiver. When user unplugs headphones, audio continues playing through device speaker (rude behavior).

**Solution:**  
Register broadcast receiver for audio route changes, pause playback when output becomes "noisy" (speaker).

**Files to Modify:**
- `android/app/src/main/java/com/anhad/app/AudioBecomingNoisyReceiver.java` (create new file):
  ```java
  package com.anhad.app;
  
  import android.content.BroadcastReceiver;
  import android.content.Context;
  import android.content.Intent;
  import android.media.AudioManager;
  
  public class AudioBecomingNoisyReceiver extends BroadcastReceiver {
      @Override
      public void onReceive(Context context, Intent intent) {
          if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
              android.util.Log.d("ANHAD", "Audio becoming noisy (headphones disconnected)");
              
              // Send pause command to JavaScript
              Intent pauseIntent = new Intent("com.anhad.app.AUDIO_COMMAND");
              pauseIntent.putExtra("command", "PAUSE");
              context.sendBroadcast(pauseIntent);
          }
      }
  }
  ```

- `android/app/src/main/java/com/anhad/app/AudioForegroundService.java` (register receiver in onCreate):
  ```java
  private AudioBecomingNoisyReceiver noisyReceiver;
  
  @Override
  public void onCreate() {
      super.onCreate();
      audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
      requestAudioFocus();
      
      // Register headphone disconnect receiver
      noisyReceiver = new AudioBecomingNoisyReceiver();
      IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
      registerReceiver(noisyReceiver, filter);
      android.util.Log.d("ANHAD", "Registered ACTION_AUDIO_BECOMING_NOISY receiver");
  }
  
  @Override
  public void onDestroy() {
      super.onDestroy();
      abandonAudioFocus();
      
      // Unregister receiver
      if (noisyReceiver != null) {
          unregisterReceiver(noisyReceiver);
      }
  }
  ```

**Dependencies:** Item 3.1 (requires AudioForegroundService)  
**Risk Level:** LOW (standard Android pattern)  
**Estimated Time:** 2 hours (implement + test)

**Verification:**
1. Build APK, install on Android device
2. Play Darbar Sahib with wired headphones connected
3. Unplug headphones while playing
4. Expected: audio pauses immediately
5. Plug headphones back in
6. Tap play button, audio resumes
7. Repeat test with Bluetooth headphones (turn off Bluetooth)

---

## SECTION 4: VIRTUAL STREAM RELIABILITY FIXES

### ITEM 4.1 — Reduce Track Transition Safety Timeout

**Problem:**  
`handleTrackEnded()` has a 10-second safety timeout (line 1299) to reset `isTransitioning` flag if Promise chain hangs. 10 seconds of silence is too long.

**Current Behavior:**  
If track transition Promise hangs, user hears 10s gap before safety timeout fires.

**Solution:**  
Reduce timeout to 5 seconds, add retry logic.

**Files to Modify:**
- `frontend/lib/anhad-audio-singleton.js` (line 1299):
  ```javascript
  // OLD:
  const safetyResetTimer = setTimeout(() => {
    if (isTransitioning) {
      console.warn('[AnhadAudio] 🔔 Safety timeout: resetting isTransitioning after 10s hang');
      isTransitioning = false;
    }
  }, 10000);
  
  // NEW:
  const safetyResetTimer = setTimeout(() => {
    if (isTransitioning) {
      console.warn('[AnhadAudio] 🔔 Safety timeout: resetting isTransitioning after 5s hang, retrying transition...');
      isTransitioning = false;
      
      // Retry transition immediately
      if (wantsPlayback && currentStream) {
        setTimeout(() => {
          if (!isPlaying && wantsPlayback) {
            console.log('[AnhadAudio] Retrying stuck track transition...');
            playStream(currentStream); // Re-resolve from live edge
          }
        }, 500);
      }
    }
  }, 5000); // Reduced from 10s to 5s
  ```

**Dependencies:** None  
**Risk Level:** LOW (only changes timeout duration)  
**Estimated Time:** 1 hour (modify + test)

**Verification:**
1. Play Amritvela Kirtan
2. Open Chrome DevTools, pause JavaScript execution right after `handleTrackEnded()` is called (set breakpoint at line 1293)
3. Wait 5 seconds, release breakpoint
4. Verify console log: "Safety timeout: resetting isTransitioning after 5s hang, retrying transition..."
5. Verify audio resumes within 1 second

---

### ITEM 4.2 — Add Track URL Validation

**Problem:**  
Already fixed in code (line 1339), but can be strengthened.

**Current Behavior:**  
Checks `trackUrl` is non-empty string before `loadAndPlay()`.

**Enhancement:**  
Also validate URL format (must be HTTPS or relative path).

**Files to Modify:**
- `frontend/lib/anhad-audio-singleton.js` (line 1339):
  ```javascript
  // OLD:
  if (!trackUrl || typeof trackUrl !== 'string' || trackUrl.trim() === '') {
    console.error('[AnhadAudio] ❌ Invalid track URL, skipping transition');
    clearTimeout(safetyResetTimer);
    isTransitioning = false;
    return;
  }
  
  // NEW:
  if (!trackUrl || typeof trackUrl !== 'string' || trackUrl.trim() === '') {
    console.error('[AnhadAudio] ❌ Invalid track URL (empty), skipping transition');
    clearTimeout(safetyResetTimer);
    isTransitioning = false;
    emit('error', { type: 'invalid_track', message: 'Track URL is invalid' });
    return;
  }
  
  // Additional validation: must be HTTPS or relative path
  const isValidUrl = trackUrl.startsWith('https://') || 
                     trackUrl.startsWith('/') || 
                     trackUrl.startsWith('./');
  if (!isValidUrl) {
    console.error('[AnhadAudio] ❌ Invalid track URL format:', trackUrl);
    clearTimeout(safetyResetTimer);
    isTransitioning = false;
    emit('error', { type: 'invalid_track', message: 'Track URL format is invalid' });
    return;
  }
  ```

**Dependencies:** None  
**Risk Level:** LOW (strengthens existing validation)  
**Estimated Time:** 30 minutes

**Verification:**
1. Manually corrupt `STREAMS.amritvela.getTrackUrl` to return invalid URL:
   ```javascript
   window.AnhadAudio.STREAMS.amritvela.getTrackUrl = () => 'invalid-url';
   ```
2. Play Amritvela, wait for track to end
3. Verify console error: "Invalid track URL format: invalid-url"
4. Verify error toast appears in UI

---

## SECTION 5: DIAGNOSTIC LOGGING INFRASTRUCTURE

### ITEM 5.1 — Implement Diagnostic Event Logger

**Problem:**  
Stream failures emit only `message` and `type`. No detailed context (network state, player state, stream URL, error codes).

**Solution:**  
Add in-memory ring buffer that logs every significant audio event with full context.

**Files to Modify:**
- `frontend/lib/anhad-audio-singleton.js` (add after line 267, before singleton guard):
  ```javascript
  // --- DIAGNOSTIC LOGGER ---
  const DIAGNOSTIC_LOG_SIZE = 50;
  const diagnosticLog = [];
  
  function logDiagnostic(eventType, data = {}) {
    const entry = {
      timestamp: Date.now(),
      time: new Date().toISOString(),
      eventType,
      data,
      context: {
        currentStream,
        isPlaying,
        isLoading,
        connectionState,
        liveReconnectAttempts,
        stallRecoveryAttempts,
        wantsPlayback,
        navigatorOnline: navigator.onLine,
        documentHidden: document.hidden,
        audioSrc: PlaybackQueueController.audio?.src,
        audioError: PlaybackQueueController.audio?.error ? {
          code: PlaybackQueueController.audio.error.code,
          message: PlaybackQueueController.audio.error.message
        } : null,
        audioNetworkState: PlaybackQueueController.audio?.networkState,
        audioReadyState: PlaybackQueueController.audio?.readyState,
        currentTime: PlaybackQueueController.audio?.currentTime,
        duration: PlaybackQueueController.audio?.duration
      }
    };
    
    diagnosticLog.push(entry);
    if (diagnosticLog.length > DIAGNOSTIC_LOG_SIZE) {
      diagnosticLog.shift(); // Remove oldest entry
    }
    
    // Also log to console in dev mode
    if (localStorage.getItem('anhad_debug') === 'true') {
      console.log('[DIAGNOSTIC]', eventType, entry);
    }
  }
  
  // Expose diagnostic log globally for debugging
  window.__anhadDiagnosticLog = diagnosticLog;
  window.exportDiagnosticLog = function() {
    const blob = new Blob([JSON.stringify(diagnosticLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anhad-diagnostic-log-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  ```

- **Add diagnostic calls throughout anhad-audio-singleton.js:**
  
  After line 503 (play event):
  ```javascript
  this.audio.addEventListener('play', () => {
    logDiagnostic('audio_play');
    // ...
  });
  ```
  
  After line 507 (playing event):
  ```javascript
  this.audio.addEventListener('playing', () => {
    logDiagnostic('audio_playing', { confirmed: true });
    notifyStateChange(true, true);
  });
  ```
  
  After line 627 (error event):
  ```javascript
  this.audio.addEventListener('error', (e) => {
    logDiagnostic('audio_error', {
      errorCode: this.audio.error?.code,
      errorMessage: this.audio.error?.message,
      errorType: errorType
    });
    // ...
  });
  ```
  
  In play() function (line 1382):
  ```javascript
  function play(streamName) {
    logDiagnostic('user_play_request', { streamName });
    // ...
  }
  ```
  
  In pause() function (line 1397):
  ```javascript
  function pause() {
    logDiagnostic('user_pause_request');
    // ...
  }
  ```
  
  In handleLiveStreamEnded() (line 1172):
  ```javascript
  function handleLiveStreamEnded() {
    logDiagnostic('live_stream_ended');
    // ...
  }
  ```
  
  In recoverAfterReconnect() (line 1640):
  ```javascript
  function recoverAfterReconnect(reason) {
    logDiagnostic('recovery_triggered', { reason });
    // ...
  }
  ```

**Dependencies:** None  
**Risk Level:** LOW (only adds logging, doesn't change behavior)  
**Estimated Time:** 4 hours (add calls throughout codebase + test)

**Verification:**
1. Open browser console
2. Enable debug mode: `localStorage.setItem('anhad_debug', 'true')`
3. Reload page
4. Play Darbar Sahib
5. Pause, resume, skip track, disconnect network, reconnect
6. Check console for `[DIAGNOSTIC]` logs
7. Export log: `window.exportDiagnosticLog()`
8. Open downloaded JSON file, verify all events recorded with full context

---

### ITEM 5.2 — Create Debug Panel UI

**Problem:**  
Diagnostic log is only accessible via console commands. Users can't easily export logs when reporting issues.

**Solution:**  
Add hidden debug panel accessible via secret gesture (triple-tap app logo).

**Files to Create:**
- `frontend/lib/debug-panel.js`:
  ```javascript
  (function() {
    'use strict';
    
    let tapCount = 0;
    let tapTimer = null;
    
    // Triple-tap on any element with class "debug-trigger" to open panel
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.debug-trigger')) return;
      
      tapCount++;
      clearTimeout(tapTimer);
      
      if (tapCount >= 3) {
        openDebugPanel();
        tapCount = 0;
      } else {
        tapTimer = setTimeout(() => { tapCount = 0; }, 1000);
      }
    });
    
    function openDebugPanel() {
      const existingPanel = document.getElementById('anhad-debug-panel');
      if (existingPanel) {
        existingPanel.style.display = 'flex';
        return;
      }
      
      const panel = document.createElement('div');
      panel.id = 'anhad-debug-panel';
      panel.innerHTML = `
        <div class="debug-panel-overlay">
          <div class="debug-panel-content">
            <div class="debug-panel-header">
              <h3>ANHAD Diagnostics</h3>
              <button class="debug-close" onclick="document.getElementById('anhad-debug-panel').style.display='none'">×</button>
            </div>
            <div class="debug-panel-body">
              <h4>Audio State</h4>
              <pre id="debug-state"></pre>
              
              <h4>Recent Events (Last 10)</h4>
              <pre id="debug-events"></pre>
              
              <div class="debug-actions">
                <button onclick="window.exportDiagnosticLog()">Export Full Log</button>
                <button onclick="window.__anhadDiagnosticLog.length = 0; alert('Log cleared')">Clear Log</button>
                <button onclick="window.AnhadAudio.stop(); alert('Stopped playback')">Stop Playback</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
      
      updateDebugPanel();
      setInterval(updateDebugPanel, 1000);
    }
    
    function updateDebugPanel() {
      const stateEl = document.getElementById('debug-state');
      const eventsEl = document.getElementById('debug-events');
      
      if (!stateEl || !eventsEl) return;
      
      if (window.AnhadAudio) {
        const state = window.AnhadAudio.getState();
        stateEl.textContent = JSON.stringify(state, null, 2);
      }
      
      if (window.__anhadDiagnosticLog) {
        const recent = window.__anhadDiagnosticLog.slice(-10);
        eventsEl.textContent = recent.map(e => 
          `${e.time} — ${e.eventType} — ${e.connectionState || ''}`
        ).join('\n');
      }
    }
  })();
  ```

- `frontend/css/debug-panel.css`:
  ```css
  #anhad-debug-panel {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999999;
    justify-content: center;
    align-items: center;
  }
  
  .debug-panel-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .debug-panel-content {
    background: #1a1a1a;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .debug-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #333;
  }
  
  .debug-panel-header h3 {
    margin: 0;
    color: #f7c634;
    font-size: 18px;
  }
  
  .debug-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 32px;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
  }
  
  .debug-panel-body {
    padding: 20px;
    overflow-y: auto;
    color: #fff;
  }
  
  .debug-panel-body h4 {
    margin: 20px 0 10px 0;
    color: #f7c634;
    font-size: 14px;
    text-transform: uppercase;
  }
  
  .debug-panel-body pre {
    background: #000;
    padding: 12px;
    border-radius: 6px;
    font-size: 11px;
    overflow-x: auto;
    white-space: pre-wrap;
  }
  
  .debug-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  
  .debug-actions button {
    flex: 1;
    padding: 10px;
    background: #f7c634;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
  }
  ```

**Files to Modify:**
- `frontend/index.html` (add before closing `</body>`):
  ```html
  <link rel="stylesheet" href="css/debug-panel.css">
  <script src="lib/debug-panel.js"></script>
  ```

- `frontend/index.html` (add class to ANHAD logo):
  ```html
  <!-- Find app logo, add class="debug-trigger" -->
  <img src="assets/logo.png" alt="ANHAD" class="debug-trigger">
  ```

**Dependencies:** Item 5.1 (requires diagnostic logger)  
**Risk Level:** LOW (hidden debug feature)  
**Estimated Time:** 3 hours (implement + style + test)

**Verification:**
1. Open ANHAD app
2. Triple-tap app logo
3. Debug panel should appear
4. Verify shows:
   - Current audio state (JSON)
   - Last 10 diagnostic events
   - Export/Clear/Stop buttons functional
5. Close panel, open again, verify updates in real-time

---

## SECTION 6: UX IMPROVEMENTS

### ITEM 6.1 — Add Persistent Reconnection Indicator

**Problem:**  
Error toasts disappear after 3 seconds. User may miss "reconnecting..." status.

**Solution:**  
Show persistent banner at top of mini-player when `connectionState === 'reconnecting'`.

**Files to Modify:**
- `frontend/lib/overlay-player.js` (add to updateUI function, line 185):
  ```javascript
  function updateUI() {
    // ... existing code ...
    
    const conn = state.connectionState;
    const isReconnecting = conn === 'reconnecting';
    const hasFailed = conn === 'failed' || (!!lastError && !state.isPlaying && !state.isLoading);
    
    // NEW: Show reconnection banner
    let reconnectBanner = miniPlayerEl.querySelector('.gmp-reconnect-banner');
    if (!reconnectBanner) {
      reconnectBanner = document.createElement('div');
      reconnectBanner.className = 'gmp-reconnect-banner';
      miniPlayerEl.insertBefore(reconnectBanner, miniPlayerEl.firstChild);
    }
    
    if (isReconnecting) {
      reconnectBanner.style.display = 'flex';
      reconnectBanner.textContent = `Reconnecting... Attempt ${state.liveReconnectAttempts || 1}`;
    } else {
      reconnectBanner.style.display = 'none';
    }
    
    // ... rest of function ...
  }
  ```

- `frontend/css/global-mini-player.css` (add styles):
  ```css
  .gmp-reconnect-banner {
    display: none;
    background: linear-gradient(135deg, #ff9500, #ff6b00);
    color: #fff;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    border-radius: 8px 8px 0 0;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  ```

**Dependencies:** None  
**Risk Level:** LOW (visual enhancement only)  
**Estimated Time:** 1 hour

**Verification:**
1. Play Darbar Sahib
2. Turn off Wi-Fi
3. Mini-player should show orange banner: "Reconnecting... Attempt 1"
4. Wait 2 seconds, banner updates: "Reconnecting... Attempt 2"
5. Turn Wi-Fi back on
6. Banner disappears when playback resumes

---

### ITEM 6.2 — Add "Retry Now" Button on Failed State

**Problem:**  
After 6 reconnection attempts fail, `connectionState` becomes `'failed'`. User must manually stop and restart playback.

**Solution:**  
Show "Retry Now" button in mini-player when state is `'failed'`.

**Files to Modify:**
- `frontend/lib/overlay-player.js` (modify play button click handler, line 133):
  ```javascript
  document.getElementById('gmp-play-btn').onclick = (e) => {
    e.stopPropagation();
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
    
    const state = window.AnhadAudio.getState();
    
    // After a failure, toggle() is the wrong call — it would try to pause a
    // stream that is already dead. Re-issue play() on the current stream so
    // the singleton re-resolves the live position and resets the errored
    // media element.
    if ((state.connectionState === 'failed' || lastError) && !state.isPlaying && state.currentStream) {
      lastError = null;
      window.AnhadAudio.play(state.currentStream);
      return;
    }
    window.AnhadAudio.toggle();
  };
  ```

- Modify subtitle text to show "Tap to retry" on failed state (line 201):
  ```javascript
  if (subEl) {
    if (isReconnecting) subEl.textContent = 'Reconnecting…';
    else if (hasFailed) subEl.textContent = 'Tap ▶ to retry';
    else subEl.textContent = state.currentTrackArtist;
  }
  ```

**Dependencies:** None  
**Risk Level:** LOW (improves existing behavior)  
**Estimated Time:** 30 minutes

**Verification:**
1. Play Darbar Sahib
2. In Chrome DevTools, set `liveReconnectAttempts = 6` in console:
   ```javascript
   // Simulate failed state
   const audio = window.AnhadAudio;
   audio.getState().liveReconnectAttempts = 6;
   audio.getState().connectionState = 'failed';
   ```
3. Mini-player subtitle should show: "Tap ▶ to retry"
4. Tap play button
5. Verify playback restarts from live edge

---

## DEPENDENCY GRAPH

```
1.1 Icecast Relay
 └─> 1.2 Icy-Metadata Header (depends on relay URL)
 └─> 1.4 Health Check (checks relay)

1.3 Position Watchdog (independent)

2.1 iOS UIBackgroundModes
 └─> 2.2 AVAudioSession Config (optional, depends on 2.1)

3.1 Audio Focus
 └─> 3.2 Headphone Disconnect (depends on AudioForegroundService from 3.1)

4.1 Track Transition Timeout (independent)
4.2 URL Validation (independent)

5.1 Diagnostic Logger
 └─> 5.2 Debug Panel (depends on logger)

6.1 Reconnection Banner (independent)
6.2 Retry Button (independent)
```

**Recommended Implementation Order:**
1. Item 5.1 (diagnostic logger) — enables debugging all other fixes
2. Item 1.1 (Icecast relay) — highest user impact
3. Item 2.1 (iOS background audio) — critical platform gap
4. Item 3.1 (Android audio focus) — system integration
5. Item 1.3 (position watchdog) — enhances Darbar reliability
6. Item 4.1, 4.2 (virtual stream fixes) — edge cases
7. Item 6.1, 6.2 (UX improvements) — polish
8. Item 5.2 (debug panel) — user-facing diagnostics
9. Item 3.2 (headphone disconnect) — nice-to-have
10. Item 1.2 (Icy-metadata native) — optional, test if needed
11. Item 1.4 (health check) — optional, adds diagnostics

---

## RISK ASSESSMENT

| Item | Risk Level | Impact | Justification |
|------|-----------|--------|---------------|
| 1.1 | LOW | HIGH | New relay, fallback preserves existing behavior |
| 1.2 | MEDIUM | MEDIUM | Proxying native adds latency, requires testing |
| 1.3 | LOW | HIGH | Only adds detection, doesn't change recovery |
| 1.4 | LOW | LOW | Adds diagnostic info, no behavior change |
| 2.1 | LOW | HIGH | Standard iOS config, well-documented |
| 2.2 | MEDIUM | MEDIUM | Native Swift code, requires device testing |
| 3.1 | MEDIUM | HIGH | Native Android code, affects system integration |
| 3.2 | LOW | MEDIUM | Standard Android pattern |
| 4.1 | LOW | MEDIUM | Only changes timeout, adds retry |
| 4.2 | LOW | LOW | Strengthens existing validation |
| 5.1 | LOW | LOW | Only adds logging |
| 5.2 | LOW | LOW | Hidden debug feature |
| 6.1 | LOW | LOW | Visual enhancement |
| 6.2 | LOW | LOW | Improves existing behavior |

**Total High-Risk Items:** 0  
**Total Medium-Risk Items:** 4 (1.2, 2.2, 3.1)  
**Total Low-Risk Items:** 10

---

## VERIFICATION SUMMARY

After all fixes implemented:

### Smoke Test Checklist

- [ ] **Darbar Sahib Live:** Play for 2+ hours continuously without interruption
- [ ] **Amritvela Kirtan:** Play through 3+ track transitions smoothly
- [ ] **Simran:** Play for 1+ hour, verify position tracking accurate
- [ ] **iOS Background:** App backgrounded for 10+ minutes, audio continues
- [ ] **Android Focus:** Incoming call pauses audio, call end resumes
- [ ] **Headphone Disconnect:** Unplug headphones, audio pauses immediately
- [ ] **Network Transition:** Switch Wi-Fi → Mobile Data, auto-recovers within 5s
- [ ] **Weak Network:** Throttle to "Slow 3G", audio buffers but doesn't fail
- [ ] **Offline/Online:** Disconnect Wi-Fi for 30s, reconnect, auto-resumes
- [ ] **Navigation:** Play audio, navigate between pages, playback uninterrupted
- [ ] **Mini-Player Sync:** Pause on main player, mini-player updates instantly
- [ ] **Lock Screen Controls:** Pause/play/next/prev work from iOS/Android lock screen
- [ ] **Long Session:** 8+ hours continuous playback, no drift or stall

---

**END OF IMPLEMENTATION PLAN**
