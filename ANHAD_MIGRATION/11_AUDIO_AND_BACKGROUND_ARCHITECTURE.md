# ANHAD Audio, Streaming & Background Reliability Architecture
**Document:** `ANHAD_MIGRATION/11_AUDIO_AND_BACKGROUND_ARCHITECTURE.md`  
**Version:** 1.0.0  
**Source Code References:** `frontend/lib/anhad-audio-singleton.js` (1,907 lines), `frontend/GurbaniRadio/stream-library.js` (614 lines), `android/app/src/main/java/com/anhad/app/AudioForegroundService.java` (425 lines)  

---

## 1. Deep Analysis of Existing Audio Subsystems

The original audio engine in ANHAD is implemented across four distinct tiers:
1. `PlaybackQueueController`: An internal serialized Promise queue wrapping the browser's HTML5 `<audio>` element to avoid play/pause race conditions.
2. `VirtualLiveBroadcastEngine`: A television-style scheduler that synchronizes offline-recorded kirtan tracks across all global users based on pure UTC time elapsed since `VIRTUAL_LIVE_EPOCH_START` (1704067200 / 2024-01-01 00:00:00 UTC).
3. `DarbarLiveSubsystem`: A true live-stream player connected to SGPC's Icecast feed (`https://live.sgpc.net:8443/;nocache=1`).
4. `AudioForegroundService.java`: An Android native foreground service running a `PARTIAL_WAKE_LOCK` and `MediaSessionCompat` to prevent Android OS from terminating WebView audio in the background.

---

## 2. The Three Primary Streams Audited

### 2.1 Darbar Sahib Live (`darbar`)
- **Type:** True live Icecast audio stream.
- **URL:** `https://live.sgpc.net:8443/;nocache=1`
- **Fallback / Edge Proxy:** `https://anhad-final.onrender.com/api/stream?url=...` (used on web to bypass mixed-content blocks; direct HTTPS on mobile).
- **Behavior:** No track duration; continuous live feed. If the connection drops, it does not seek; it reconnects to the live edge with cache-busting headers.

### 2.2 Amritvela Kirtan (`amritvela`)
- **Type:** Virtual Live Broadcast.
- **Total Tracks:** 40 tracks stored as WebM files on Cloudflare R2: `https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev/day-{1..40}.webm?v=2.1.5`
- **Track Durations:** Explicitly pre-calibrated in `AMRITVELA_KNOWN_DURATIONS` (ranging from 3,732s to 6,628s; total cycle ~62.3 hours).
- **Algorithm:**
  1. Computes total elapsed seconds: `elapsed = Math.floor(Date.now() / 1000) - 1704067200`.
  2. Computes current cycle: `cycle = Math.floor(elapsed / totalCycleDuration)`.
  3. Computes cycle offset: `cycleOffset = elapsed % totalCycleDuration`.
  4. Generates a deterministic pseudo-random permutation order for the cycle using Mulberry32 / seed shuffle (`regenerateShuffleOrder`).
  5. Iterates through the shuffled tracks until the accumulated duration exceeds `cycleOffset`.
  6. The active track is `shuffleOrder[i]` and the starting seek position is `position = cycleOffset - accumulatedDuration`.
  7. **Crucial Invariant:** Every user on earth tuning into Amritvela Kirtan at that exact millisecond hears the exact same shabad at the exact same playhead position!

### 2.3 Waheguru Simran (`simran`)
- **Type:** Virtual Live Broadcast.
- **Total Tracks:** 38 tracks stored as MP3 files on Cloudflare R2: `https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru/{filename}.mp3?v=2.1.5`
- **Track Durations:** Pre-calibrated in `SIMRAN_KNOWN_DURATIONS` (ranging from 1,834s to 5,371s; total cycle ~24.8 hours).
- **Algorithm:** Operates identically to Amritvela using its own 38-track playlist and cycle duration.

---


### 2.4 The Complete 8-Stream Library Catalog
The stream library (frontend/lib/anhad-audio-singleton.js, lines 101-180) explicitly defines **exactly 8 streams** (rather than 20+):
1. darbar: Sri Harmandir Sahib Live (https://live.sgpc.net:8443/;nocache=1)
2. amritvela: Amritvela Kirtan Virtual Live (40 WebM tracks on Cloudflare R2)
3. simran: Waheguru Simran Virtual Live (38 MP3 tracks on Cloudflare R2)
4. sn_bangla: Gurdwara Bangla Sahib Live (SikhNet relay)
5. sn_sisganj: Gurdwara Sis Ganj Sahib Live (SikhNet relay)
6. sn_hazur: Takhat Sachkhand Sri Hazur Sahib Live (SikhNet relay)
7. sn_dukh: Gurdwara Dukh Nivaran Sahib Live (SikhNet relay)
8. sn_raag: Classical Raag Kirtan (SikhNet Raag stream)

All 8 streams will be ported into src/config/streams.ts with explicit type safety and metadata.

---

## 3. Playback Intent & Network Interruption Invariant

The original codebase establishes a non-negotiable rule documented in `CLAUDE.md` and enforced in `anhad-audio-singleton.js` (lines 286-328):
```
wantsPlayback === true
```
- **The User Intent Rule:** When a user taps Play, `wantsPlayback` is set to `true`. It is cleared **only** by an explicit user tap on Pause or Stop.
- **Network Loss Handling:** When the network disconnects, playback halts naturally. However, `wantsPlayback` remains `true`.
- **Anchor Capture (`captureNetworkInterruption`):**
  - For virtual live streams, the player records the interrupted track index and position in `networkInterruptAnchor`.
  - For live streams, the player enters state `'reconnecting'`.
- **Bounded Adaptive Backoff:**
  - Retry intervals follow an exponential curve with jitter: `2s -> 4s -> 8s -> 12s -> 15s -> 15s...`
  - Overlapping retry loops are blocked by `reconnectCycleActive = true`.
- **Automatic Resume:** When `navigator.onLine` fires or network returns, the system automatically checks stream reachability and calls `play()`. The user does **not** have to press Play again!

---

## 4. Target React Native Audio Architecture: `react-native-track-player`

To eliminate the brittle WebView-to-Java IPC layer while guaranteeing bulletproof background reliability, `ANHADIN-REACT` will use **`react-native-track-player` (RNTP v4)**:

```
┌────────────────────────────────────────────────────────┐
│                   React Native UI Layer                │
│       (HomeScreen, RadioScreen, GlobalMiniPlayer)      │
└───────────────────────────┬────────────────────────────┘
                            │ Zustand Store Hook
                            ▼
┌────────────────────────────────────────────────────────┐
│            Authoritative Audio Playback Service        │
│          (src/services/audio/AudioService.ts)          │
│   - owns wantsPlayback flag                            │
│   - coordinates VirtualLiveEngine timeline math        │
│   - manages adaptive reconnection backoff              │
└───────────────────────────┬────────────────────────────┘
                            │ RNTP API
                            ▼
┌────────────────────────────────────────────────────────┐
│               react-native-track-player                │
│       - Background Audio Service (Headless JS)         │
│       - Event Listeners (PlaybackQueueEnded, Remote*)  │
└───────────────────────────┬────────────────────────────┘
                            │ Native Bridge
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Android ExoPlayer     │ │       iOS AVPlayer        │
│ - MediaSessionCompat      │ │ - MPRemoteCommandCenter   │
│ - MediaBrowserServiceCompat│ │ - MPNowPlayingInfoCenter  │
│ - AudioFocusManager       │ │ - AVAudioSession (Playback)│
│ - Notification Channel    │ │ - Lockscreen Scrubbing    │
└───────────────────────────┘ └───────────────────────────┘
```

### 4.1 Native Platform Capabilities Delivered by RNTP:
1. **True 24/7 Background Playback:** Native service runs without being killed by Android Doze mode or iOS background limits.
2. **Lock Screen & Control Center Controls:** Native notification with album artwork, stream title ("Darbar Sahib Live"), artist ("Sri Harmandir Sahib Ji"), play/pause, and next/prev buttons.
3. **Bluetooth & Headphone Controls:** Media button events (`RemotePlay`, `RemotePause`, `RemoteNext`, `RemotePrevious`) wired directly to `AudioService`.
4. **Audio Focus & Interruptions:** Handled automatically by ExoPlayer/AVPlayer:
   - Phone call incoming -> Audio pauses. Call ends -> Audio automatically resumes.
   - Instagram/YouTube video played -> Audio ducks or pauses cleanly without crashing.
5. **Exact Track Transitions:** In virtual live streams, when track $N$ finishes, `TrackPlayer.add()` pre-buffers track $N+1$, enabling gapless transition.

---

## 5. Reliability Requirements & Invariants

1. **Exactly One Authoritative Playback State:** Managed by `useAudioStore` (Zustand). All UI surfaces (`HomeScreen`, `RadioScreen`, `GlobalMiniPlayer`, Lock Screen) observe this single state.
2. **Zero Duplicate Players:** Navigating between screens never re-instantiates or tears down the audio player.
3. **Network Failure Recovery:**
   - On error: state transitions to `'reconnecting'`.
   - Max 10 retry attempts with backoff: `[2, 4, 8, 12, 15, 15, 15, 15, 15, 15]` seconds.
   - If offline: waits for NetInfo `isConnected === true`, then triggers immediate reconnect probe.
4. **Explicit User Stop Respect:** If the user taps Pause, retries are immediately aborted, and `wantsPlayback` is set to `false`.
