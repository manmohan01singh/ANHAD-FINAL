/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD AUDIO SINGLETON — THE ONE TRUE AUDIO ENGINE
 * 
 * Replaces: overlay-player.js audio, mini-player-extreme.js audio,
 *           persistent-audio.js audio, global-mini-player.js audio,
 *           ios17-player.js audio, ios-homepage.js audio
 * 
 * Rules:
 *   1. ONE Audio() element — created once, never duplicated
 *   2. Every UI button calls window.AnhadAudio.*
 *   3. Resume ALWAYS jumps to live position (server-synced)
 *   4. Cache-bust every .src assignment
 *   5. MediaSession for lock screen controls
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Prevent double-init
  if (window.AnhadAudio && window.AnhadAudio._singleton) return;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const STATE_KEY = 'anhad_audio_state';
  const DURATION_CACHE_KEY = 'anhad_audio_track_durations_v1';
  const BROADCAST_META_KEY = 'anhad_broadcast_virtual_meta_v1';
  const RESUME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  const CDN_BASE = 'https://anhad-final.onrender.com/audio';
  const CDN_BASE_SIMRAN = 'https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru';
  const SGPC_LIVE = 'https://live.sgpc.net:8443/;nocache=1';

  // Smart API resolution
  const API_BASE = (() => {
    try {
      if (window.Capacitor) return 'https://anhad-final.onrender.com';
      const host = window.location.hostname;
      const port = window.location.port;
      if (port === '3000' || port === '3001') return '';
      if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
      if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
      return 'https://anhad-final.onrender.com';
    } catch (e) {}
    return 'https://anhad-final.onrender.com';
  })();

  // ─── Asset path resolution ────────────────────────────────────────────────
  const SCRIPT_BASE = (() => {
    try {
      const scripts = document.querySelectorAll('script[src]');
      for (const s of scripts) {
        if (s.src.includes('anhad-audio-singleton')) {
          return s.src.replace(/lib\/anhad-audio-singleton\.js.*$/, '');
        }
      }
    } catch (e) {}
    return '';
  })();

  function resolveAsset(filename) {
    return SCRIPT_BASE ? SCRIPT_BASE + 'assets/' + filename : 'assets/' + filename;
  }

  const STREAMS = {
    darbar: {
      name: 'Darbar Sahib Live',
      subtitle: 'Sri Harmandir Sahib Ji',
      url: SGPC_LIVE,
      artwork: resolveAsset('darbar-sahib-evening.webp'),
      type: 'live',
      playerPage: 'GurbaniRadio/gurbani-radio.html'
    },
    amritvela: {
      name: 'Amritvela Kirtan',
      subtitle: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
      artwork: resolveAsset('Darbar-sahib-AMRITVELA.webp'),
      type: 'playlist',
      totalTracks: 40,
      defaultTrackDuration: 3600,
      liveApi: '/api/radio/live',
      durationApi: '/api/radio/durations',
      playerPage: 'GurbaniRadio/gurbani-radio.html?stream=amritvela',
      getTrackUrl(index, position = 0) {
        const safeIndex = ((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1;
        const filename = `day-${safeIndex}.webm`;
        // Android: use server-side seeking to bypass WebM buffering bug
        if (window.Capacitor && position > 5) {
          return `${API_BASE}/api/stream-mp3?file=${filename}&start=${Math.floor(position)}`;
        }
        // PWA: direct CDN works fine
        return `${CDN_BASE}/${filename}?v=2.1.4`;
      }
    },
    simran: {
      name: 'Waheguru Simran',
      subtitle: 'Amritvela Trust',
      artwork: resolveAsset('waheguru-simran-cover.svg'),
      type: 'playlist',
      totalTracks: 38,
      defaultTrackDuration: 3600,
      liveApi: '/api/simran/live',
      durationApi: '/api/simran/durations',
      playerPage: 'GurbaniRadio/gurbani-radio.html?stream=simran',
      getTrackUrl(index, position = 0) {
        const simranTracks = [
          '01 - DEENANATH SUNO WAHEGURU SIMRAN DAY 1.mp3', '02 - TUM KARO DAYA WAHEGURU SIMRAIN DAY 2.mp3', '03 - SUNN YAAR HAMARE SAJAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '04 - SUKH NAAHI RE HAR BHAGAT BINA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '05 - TU PRABH DATA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '06 - SATNAM WAHEGURU - SIMRAN - AMRITVELA TRUST..mp3',
          '07 - MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '08 - RAKHWALA SIMRAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '09 - AAS PYAASI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '10 - PRABH PAAS JAN KI ARDAS - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '11 - TU HI TU HI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '12 - NAAM NAAM NAAM APNA NAAM DEHO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '13 - DHAN GURU RAMDAS JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '14 - AAO SAJANA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '15 - TUJ BIN KAVAN HAMARA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '16 - MERA BAID GURU GOVINDA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '17 - JAGAN TE SUPNA BHALA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '18 - EH NEECH KARAM HAR MERE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '19 - APNA NAAM JAPAO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '20 - MERE PYAARE SATUGURU JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '21 - RAKH LEHO BHAGWAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '22 - KAB GAL LAVENGE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '23 - MERE RAM MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '24 - RAKHEYA KARO SIMRAN DAY 25.mp3',
          '25 - WAHEGURU SIMRAN UTH NAAM JAP AMRITVELA TRUST BEST SIMRAN.mp3', '26 - BEST WAHEGURU SIMRAN DAY 27 CHALIYA 2020.mp3', '27 - KAD NANAK AAVE VARI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '28 - BIN GUR NA PAVAIGO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '29 - KIYO SHINGAR MILAN KE TAAYEE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '30 - NAAM BINA NAHI JEEVIA JAYE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '31 - AATH PEHAR SIMRO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '32 - MIL MERE PREETMA JEEO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '33 - SATNAM SHRI WAHEGURU SIMRAN DAY 35 CHALIYA 2020.mp3',
          '34 - RAKH RAKH MERE BEETHLA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '35 - PRAAN ADHAARA RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '36 - DHAN BABA NANAK - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
          '37 - SUNN MANN MITTAR PYAREYA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', '38 - MERE SATGUR PYARE GURNANAK AAJA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3'
        ];
        const safeIndex = ((index % this.totalTracks) + this.totalTracks) % this.totalTracks;
        const filename = simranTracks[safeIndex];
        // VBR MP3 seeking is broken in all browsers — server-side seek for any mid-track position
        if (position > 5) {
          return `${API_BASE}/api/stream-mp3?file=${encodeURIComponent(filename)}&start=${Math.floor(position)}`;
        }
        // PWA: direct CDN works fine
        return `${CDN_BASE_SIMRAN}/${encodeURIComponent(filename)}`;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL STATE — Single source of truth
  // ═══════════════════════════════════════════════════════════════════════════

  let audio = null;            // THE one Audio element
  let currentStream = null;    // 'darbar' | 'amritvela' | null
  let currentTrackIndex = 0;
  let currentShufflePosition = 0; // Position in shuffle order for seamless advancing
  let isPlaying = false;
  let isLoading = false;
  let isPlayLocked = false;    // CAPACITOR FIX: prevents re-entrant play() during active play operation
  let audioRetryCount = 0;     // Error retry counter (max 5)
  let trackTransitionInProgress = false; // Prevents ended + watchdog double-fire
  let playRequestId = 0;       // Guards stale canplay handlers after rapid stream changes
  let lastPlaylistEndedAt = 0; // Coalesce ended + near-end watchdog double-fires
  let watchdogGraceUntil = 0;  // Suppress stall watchdog for N ms after a new load
  let lastLoadedAt = 0;        // Timestamp of last audio.load() call
  let lastWatchTime = 0;       // For stall detection
  let stalledWatchTicks = 0;   // Consecutive stall ticks
  let foregroundServiceGraceUntil = 0; // CAPACITOR FIX: grace window after startForegroundService()
  let foregroundServiceActive = false;  // CAPACITOR FIX: prevents double-starting the foreground service
  const listeners = new Map(); // event → Set<fn>

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  function emit(event, data) {
    const fns = listeners.get(event);
    if (fns) fns.forEach(fn => { try { fn(data); } catch (e) { console.error('[AnhadAudio] Event error:', e); } });
  }

  function on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  }

  function off(event, fn) {
    listeners.get(event)?.delete(fn);
  }

  function getDurationCache() {
    try {
      const raw = localStorage.getItem(DURATION_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function rememberTrackDuration(streamName, trackIndex, duration) {
    if (!streamName || !Number.isFinite(duration) || duration <= 60) return;
    try {
      const cache = getDurationCache();
      cache[streamName] = cache[streamName] || {};
      cache[streamName][trackIndex] = Math.round(duration);
      localStorage.setItem(DURATION_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  }

  function getCachedTrackDuration(streamName, trackIndex) {
    const stream = STREAMS[streamName];
    const fallback = stream?.defaultTrackDuration || 3600;
    const duration = getDurationCache()?.[streamName]?.[trackIndex];
    return Number.isFinite(duration) && duration > 60 ? duration : fallback;
  }

  /**
   * Persist server epoch + merge API track durations (must mirror backend BroadcastEngine).
   */
  function persistBroadcastMeta(streamName, data) {
    if (!streamName || !data || data.epoch == null) return;
    try {
      const raw = localStorage.getItem(BROADCAST_META_KEY);
      const meta = raw ? JSON.parse(raw) : {};
      meta[streamName] = { epoch: Number(data.epoch), lastServerTime: Date.now() };
      localStorage.setItem(BROADCAST_META_KEY, JSON.stringify(meta));
    } catch (e) {}

    if (data.trackDurations && typeof data.trackDurations === 'object') {
      try {
        const cache = getDurationCache();
        cache[streamName] = cache[streamName] || {};
        Object.entries(data.trackDurations).forEach(([k, v]) => {
          const idx = Number(k);
          const dur = Number(v);
          if (Number.isFinite(idx) && idx >= 0 && Number.isFinite(dur) && dur > 60) {
            cache[streamName][idx] = Math.round(dur);
          }
        });
        localStorage.setItem(DURATION_CACHE_KEY, JSON.stringify(cache));
      } catch (e) {}
    }
  }

  function getBroadcastEpoch(streamName) {
    try {
      const meta = JSON.parse(localStorage.getItem(BROADCAST_META_KEY) || '{}');
      const e = meta[streamName]?.epoch;
      return Number.isFinite(e) ? e : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Deterministic shuffle — same algorithm as backend/server.js BroadcastEngine.regenerateShuffleOrder
   */
  function regenerateShuffleOrder(epoch, cycle, length) {
    let seed = (epoch || 0) + cycle * 2654435761;
    function rand() {
      seed |= 0;
      seed = seed + 0x6d2b79f5 | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const shuffleOrder = Array.from({ length }, (_, i) => i);
    for (let i = shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
    }
    return shuffleOrder;
  }

  /**
   * Virtual-live position using persisted server epoch + shuffled playlist (offline / API fallback).
   */
  function computeVirtualLivePosition(streamName) {
    const stream = STREAMS[streamName];
    const totalTracks = stream?.totalTracks || 40;
    const epoch = getBroadcastEpoch(streamName) || 1704067200000;
    const defaultDur = stream?.defaultTrackDuration || 3600;

    const getDur = (index) => getCachedTrackDuration(streamName, index);

    // STABLE: use fixed total for cycle (matches server fix)
    const fixedTotal = totalTracks * defaultDur;
    const learnedTotal = (() => {
      let t = 0;
      for (let i = 0; i < totalTracks; i++) t += getDur(i);
      return t > 0 ? t : fixedTotal;
    })();

    const elapsedSeconds = (Date.now() - epoch) / 1000;
    const cycle = Math.floor(elapsedSeconds / fixedTotal);
    const positionInPlaylist = ((elapsedSeconds % learnedTotal) + learnedTotal) % learnedTotal;
    const shuffleOrder = regenerateShuffleOrder(epoch, cycle, totalTracks);

    let accumulated = 0;
    for (let i = 0; i < totalTracks; i += 1) {
      const actualTrackIndex = shuffleOrder[i];
      const trackDuration = getDur(actualTrackIndex);
      if (accumulated + trackDuration > positionInPlaylist) {
        return {
          trackIndex: actualTrackIndex,
          position: Math.max(0, positionInPlaylist - accumulated)
        };
      }
      accumulated += trackDuration;
    }
    return { trackIndex: shuffleOrder[0] || 0, position: 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER SYNC — Single source of live position truth
  // ═══════════════════════════════════════════════════════════════════════════

  async function getServerLivePosition() {
    try {
      const t0 = Date.now();
      const apiEndpoint = STREAMS[currentStream]?.liveApi || '/api/radio/live';
      const url = `${API_BASE}${apiEndpoint}?t=${Date.now()}&r=${Math.random()}`;
      console.log(`[AnhadAudio] Fetching live position from: ${url}`);
      
      const resp = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const t1 = Date.now();
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const latency = (t1 - t0) / 2000;

      if (currentStream && data.epoch != null) {
        persistBroadcastMeta(currentStream, data);
      }

      if (typeof data.trackIndex !== 'number' || !Number.isFinite(data.trackPosition)) {
        console.warn('[AnhadAudio] Live API missing track fields; using virtual timeline');
        return getLocalLivePosition();
      }

      console.log(`[AnhadAudio] ✅ Server sync: Track ${data.trackIndex + 1} at ${Math.floor(data.trackPosition)}s (latency: ${latency.toFixed(2)}s)`);
      return {
        trackIndex: data.trackIndex,
        position: data.trackPosition + latency,
        trackTitle: data.trackTitle,
        trackArtist: data.trackArtist,
        listeners: data.listenersCount
      };
    } catch (e) {
      console.warn('[AnhadAudio] ❌ Server sync failed, using local fallback:', e.message);
      console.log(`[AnhadAudio] API_BASE: ${API_BASE}, Stream: ${currentStream}`);
      return getLocalLivePosition();
    }
  }

  function getLocalLivePosition() {
    const streamName = currentStream || 'amritvela';
    return computeVirtualLivePosition(streamName);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // localStorage PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  function saveState() {
    try {
      const data = {
        stream: currentStream,
        trackIndex: currentTrackIndex,
        isPlaying,
        volume: audio ? audio.volume : 0.8,
        currentTime: audio ? audio.currentTime : 0,
        timestamp: Date.now()
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(data));
      // Also write to gurbani_radio_state for Gurbani Radio page compatibility
      localStorage.setItem('gurbani_radio_state', JSON.stringify(data));
    } catch (e) {}
  }

  function loadState() {
    try {
      const s = localStorage.getItem(STATE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  // Restore currentStream on init so toggling correctly targets the active stream
  const initialSavedState = loadState();
  if (initialSavedState && initialSavedState.stream && STREAMS[initialSavedState.stream]) {
    currentStream = initialSavedState.stream;
    currentTrackIndex = initialSavedState.trackIndex || 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO ELEMENT — Created ONCE
  // ═══════════════════════════════════════════════════════════════════════════

  function initAudioElement() {
    if (audio) return;

    // CAPACITOR DOM FIX: Use <video> instead of <audio> for video/webm!
    // Since the Amritvela files are actually 'video/webm' (even though they only contain Opus audio),
    // Android WebView's Audio pipeline chokes on them and loops buffering. 
    // The Video pipeline allocates a proper hardware buffer and handles seeking flawlessly!
    audio = document.createElement('video');
    audio.preload = 'metadata';
    audio.volume = 0.8;

    // CAPACITOR DOM FIX: Append to DOM to force Android WebView to allocate a full-priority media buffer!
    // In-memory Audio objects get their network requests aggressively throttled on mobile,
    // which causes the infinite "buffering" loop when downloading the WebM Cues index!
    audio.id = 'anhad-global-audio';
    // Use visually hidden instead of display:none to prevent aggressive WebView throttling
    audio.style.position = 'absolute';
    audio.style.width = '1px';
    audio.style.height = '1px';
    audio.style.opacity = '0';
    audio.style.pointerEvents = 'none';
    if (!document.getElementById('anhad-global-audio')) {
      document.body.appendChild(audio);
    }

    // Enable background playback for Capacitor native apps
    if (window.Capacitor) {
      // Configure for background audio on iOS/Android
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      
      // Prevent screen from sleeping during playback
      if ('wakeLock' in navigator) {
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible' && isPlaying) {
            try {
              await navigator.wakeLock.request('screen');
            } catch (e) {
              console.log('Wake lock failed:', e);
            }
          }
        });
      }
    }

    // Restore volume from saved state
    const saved = loadState();
    if (saved && saved.volume !== undefined) {
      audio.volume = saved.volume;
    }

    audio.addEventListener('playing', () => {
      isPlaying = true;
      isLoading = false;
      isPlayLocked = false;
      emit('loading', { isLoading: false });
      audioRetryCount = 0;
      saveState();
      updateMediaSession();
      acquireWakeLock();

      // Set grace window BEFORE starting foreground service.
      // On Android, AudioService.start() grabs audio focus which fires a spurious 'pause'.
      foregroundServiceGraceUntil = Date.now() + 3000;
      if (!foregroundServiceActive) {
        foregroundServiceActive = true;
        startForegroundService();
      }
      syncNativeState('PLAY');

      emit('statechange', getPublicState());
      window.dispatchEvent(new CustomEvent('anhadAudioStateChange', {
        detail: { isPlaying: true, stream: currentStream }
      }));
      window.dispatchEvent(new CustomEvent('anhadaudiostatechange', {
        detail: { isPlaying: true }
      }));
    });

    audio.addEventListener('pause', () => {
      if (trackTransitionInProgress || isLoading) return;

      // CAPACITOR: Suppress spurious pause from AudioService audio focus grab.
      // Android re-grants focus automatically — just ignore the pause.
      if (Date.now() < foregroundServiceGraceUntil) {
        console.log('[AnhadAudio] ⚡ Suppressing spurious pause (grace window)');
        return;
      }

      isPlaying = false;
      isLoading = false;
      isPlayLocked = false;
      foregroundServiceActive = false;
      emit('loading', { isLoading: false });
      saveState();
      releaseWakeLock();
      stopForegroundService();
      syncNativeState('PAUSE');
      emit('statechange', getPublicState());
      window.dispatchEvent(new CustomEvent('anhadAudioStateChange', {
        detail: { isPlaying: false, stream: currentStream }
      }));
      window.dispatchEvent(new CustomEvent('anhadaudiostatechange', {
        detail: { isPlaying: false }
      }));
    });

    audio.addEventListener('waiting', () => {
      isLoading = true;
      emit('loading', { isLoading: true });
    });

    audio.addEventListener('canplay', () => {
      isLoading = false;
      emit('loading', { isLoading: false });
    });

    audio.addEventListener('ended', () => {
      if (currentStream === 'amritvela' || currentStream === 'simran') {
        const now = Date.now();
        if (now - lastPlaylistEndedAt < 2500) return;
        if (trackTransitionInProgress) return;
        lastPlaylistEndedAt = now;
        console.log('[AnhadAudio] 🔚 Track ended naturally, advancing to next...');
        advanceToNextTrack();
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio || !audio.duration || !isFinite(audio.duration)) return;
      emit('timeupdate', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        progress: (audio.currentTime / audio.duration) * 100
      });
    });

    audio.addEventListener('error', () => {
      const errCode = audio.error ? audio.error.code : -1;
      // Code 1 = MEDIA_ERR_ABORTED — this fires when we call audio.load() with a new src.
      // It is NOT a real error — it's the browser aborting the previous download.
      // Ignore it completely to prevent false error toasts during track transitions.
      if (errCode === 1) {
        console.log('[AnhadAudio] ℹ️ ABORT error during src change — normal, ignoring');
        return;
      }
      isPlaying = false;
      isLoading = false;
      emit('loading', { isLoading: false });
      const errMsg = audio.error ? audio.error.message : 'unknown';
      console.warn(`[AnhadAudio] ❌ Audio error code=${errCode}: ${errMsg}`);

      // For playlist streams, auto-retry on network errors (code 2/3/4)
      // The retry calls play() which re-fetches the live position. audioRetryCount
      // is reset to 0 on success (in the 'playing' handler), so at most 3 retries.
      isPlayLocked = false;
      if ((currentStream === 'amritvela' || currentStream === 'simran') && audioRetryCount < 3) {
        audioRetryCount++;
        const retryDelay = 2000 * audioRetryCount;
        const streamAtError = currentStream;
        console.log(`[AnhadAudio] 🔁 Auto-retry ${audioRetryCount}/3 in ${retryDelay/1000}s...`);
        setTimeout(() => {
          if (!isPlaying && !isPlayLocked && currentStream === streamAtError) {
            play(currentStream);
          }
        }, retryDelay);
        return;
      }

      audioRetryCount = 0;
      emit('error', { message: `Audio error (code ${errCode}): ${errMsg}` });
      emit('statechange', getPublicState());
    });

    console.log('[AnhadAudio] ✅ Single audio element created');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE PLAYBACK — The ONLY place audio.src is set
  // ═══════════════════════════════════════════════════════════════════════════

  function loadPlaylistPosition(streamName, pos, requestId, depth = 0) {
    const stream = STREAMS[streamName];
    if (!audio || !stream || stream.type !== 'playlist') return;

    currentTrackIndex = ((Number(pos.trackIndex) || 0) % stream.totalTracks + stream.totalTracks) % stream.totalTracks;
    // Store shuffle position if provided
    if (pos.shufflePosition !== undefined) {
      currentShufflePosition = pos.shufflePosition;
    }
    const requestedPosition = Math.max(0, Number(pos.position) || 0);
    const isFromBeginning = requestedPosition < 2; // Track transition = start from 0

    // ── WATCHDOG GRACE: Suppress stall detection for 45s after every new load ──
    // This prevents the watchdog from triggering during CDN buffering / seek latency.
    lastLoadedAt = Date.now();
    watchdogGraceUntil = lastLoadedAt + 45000; // 45 second grace period
    lastWatchTime = 0;   // Reset stall baseline so seek-position jump doesn't look like a stall
    stalledWatchTicks = 0;

    const trackUrl = stream.getTrackUrl(currentTrackIndex, requestedPosition);

    // Set isLoading BEFORE audio.load()
    isLoading = true;
    emit('loading', { isLoading: true });

    // CAPACITOR FIX: DO NOT use #t= for Android WebView! It causes infinite loading/stuttering loops
    // because the native Android MediaPlayer fails to parse WebM HTTP fragments correctly.
    // We will seek manually via audio.currentTime.
    audio.src = trackUrl;
    // CAPACITOR BUGFIX: Do NOT call audio.load() here. Calling load() immediately after setting src
    // on Android WebView resets the OS network buffer and permanently jams the MediaPlayer.

    console.log(`[AnhadAudio] 🎯 Virtual live: ${streamName} track ${currentTrackIndex + 1}/${stream.totalTracks} at ${Math.floor(requestedPosition)}s (fromBeginning=${isFromBeginning})`);

    let seekAndPlayCalled = false;

    const doSeekAndPlay = (reason) => {
      if (seekAndPlayCalled) return;
      seekAndPlayCalled = true;

      if (requestId !== playRequestId || currentStream !== streamName) {
        console.log(`[AnhadAudio] ⚠️ Stale request (${reason}), aborting`);
        return;
      }

      // DO NOT cache local duration - always rely on server's broadcast truth
      const loadedDuration = Number(audio.duration);

      // ── Track from beginning: just play ──
      if (isFromBeginning) {
        console.log(`[AnhadAudio] ▶️ Track transition: playing from 0:00 (${reason})`);
        try {
          if (audio.currentTime > 2) audio.currentTime = 0;
        } catch (e) {}
        audio.play()
          .then(() => { isPlaying = true; isLoading = false; emit('statechange', getPublicState()); })
          .catch(e => { console.warn('[AnhadAudio] ❌ Play failed:', e.message); isPlaying = false; isLoading = false; emit('statechange', getPublicState()); });
        return;
      }

      // ── Virtual-live seek: clamp to real duration ──
      const realDur = Number.isFinite(loadedDuration) && loadedDuration > 60 ? loadedDuration : null;
      let seekPos = requestedPosition;

      if (realDur && seekPos >= realDur - 2) {
        seekPos = Math.max(0, realDur - 5);
        console.log(`[AnhadAudio] ⚡ Clamping ${Math.floor(requestedPosition)}s → ${Math.floor(seekPos)}s (track duration=${Math.floor(realDur)}s)`);
      }

      const performSeek = (afterPlay = false) => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          if (!afterPlay) console.warn('[AnhadAudio] ⚠️ Duration still unknown at seek-time, will retry post-play');
          return false;
        }
        
        const clampedSeek = Math.min(seekPos, audio.duration - 1);

        // CAPACITOR FIX: Delay manual seek on Android until after playback has started!
        // If we set currentTime while the MediaPlayer is still initializing the buffer,
        // it permanently locks up ("infinite buffering").
        if (window.Capacitor && !afterPlay) {
            console.log(`[AnhadAudio] ⏳ Capacitor: Deferring seek to post-play to prevent buffer lock...`);
            return true; // We will seek in the .then() block of audio.play()
        }

        if (Math.abs(audio.currentTime - clampedSeek) > 3) {
          audio.currentTime = clampedSeek;
          // Extend grace window: we just seeked, give CDN time to buffer new byte-range
          watchdogGraceUntil = Date.now() + 30000;
          lastWatchTime = clampedSeek;
          stalledWatchTicks = 0;
          console.log(`[AnhadAudio] ⏩ ${afterPlay ? 'Post-play' : 'Pre-play'} seek → ${Math.floor(clampedSeek)}s`);
        }
        return true;
      };

      // If Capacitor already got a pre-seeked stream, don't seek again
      if (window.Capacitor && trackUrl.includes('/api/stream-mp3')) {
        audio.volume = 0;
        audio.play().then(() => {
          setTimeout(() => { audio.volume = 0.8; }, 300);
        }).catch(e => {
          audio.volume = 0.8;
          console.warn('[AnhadAudio] Play failed:', e.message);
        });
        return; // Server already seeked, no currentTime manipulation needed
      }

      performSeek(false);

      audio.volume = 0; // Mute temporarily to avoid hearing the 0:00 glitch before seek
      audio.play().then(() => {
        isPlaying = true;
        isLoading = false;
        emit('statechange', getPublicState());
        
        // Wait for the MediaPlayer to physically start pumping audio bytes
        audio.addEventListener('playing', () => {
          if (seekPos > 2) {
            console.log(`[AnhadAudio] ⏳ MediaPlayer is now pumping bytes, executing safe seek...`);
            performSeek(true);
            
            // Restore volume after a tiny delay to allow buffer to jump
            setTimeout(() => { audio.volume = 0.8; }, 100);
          } else {
            audio.volume = 0.8;
          }
        }, { once: true });
        
        console.log(`[AnhadAudio] ▶️ Play promise resolved, waiting for native playing event... (${reason})`);
      }).catch(e => {
        audio.volume = 0.8;
        console.warn('[AnhadAudio] ❌ Play failed:', e.message);
        isPlaying = false;
        isLoading = false;
        emit('statechange', getPublicState());
      });
    };

    // ── Wait for loadedmetadata: guarantees audio.duration is finite ──
    // We prefer this over canplay which can fire before duration is known.
    const onMeta = () => {
      reportTrackDuration();
      doSeekAndPlay('loadedmetadata');
    };
    const onCanPlay = () => { if (!seekAndPlayCalled) doSeekAndPlay('canplay'); };

    if (audio.readyState >= 1) { // HAVE_METADATA or better
      console.log(`[AnhadAudio] 🚀 Metadata ready (readyState ${audio.readyState}), seeking immediately`);
      reportTrackDuration();
      doSeekAndPlay('readyState>=1');
    } else {
      console.log(`[AnhadAudio] ⏳ Waiting for metadata... (readyState: ${audio.readyState})`);
      audio.addEventListener('loadedmetadata', onMeta, { once: true });
      // canplay as fallback in case loadedmetadata never fires (some browsers)
      audio.addEventListener('canplay', onCanPlay, { once: true });
      // 8-second hard timeout — if CDN completely fails to respond
      setTimeout(() => {
        if (!seekAndPlayCalled && requestId === playRequestId) {
          console.warn(`[AnhadAudio] ⏰ 8s metadata timeout (readyState: ${audio.readyState}), forcing play anyway`);
          doSeekAndPlay('timeout');
        }
      }, 8000);
    }
  }

  async function play(streamName) {
    if (!streamName) streamName = currentStream || 'darbar';
    if (!STREAMS[streamName]) {
      console.error('[AnhadAudio] Unknown stream:', streamName);
      return;
    }

    // CAPACITOR FIX: Block re-entrant play() calls.
    // On Android, the auto-retry logic + foreground service events can trigger
    // multiple overlapping play() calls which cause the reload loop.
    if (isPlayLocked && streamName === currentStream) {
      console.log('[AnhadAudio] ⚡ play() blocked — already loading stream:', streamName);
      return;
    }

    initAudioElement();
    const requestId = ++playRequestId;
    currentStream = streamName;
    const stream = STREAMS[streamName];

    isPlayLocked = true; // Lock: cleared when 'playing' fires or on error
    isLoading = true;
    emit('loading', { isLoading: true });
    emit('statechange', getPublicState());

    // Pause any competing page-level audio elements
    killCompetingAudio();

    // Auto-unlock after 15s in case something goes wrong and 'playing' never fires
    const lockTimeout = setTimeout(() => { isPlayLocked = false; }, 15000);

    try {
      if (stream.type === 'live') {
        // ── DARBAR LIVE: Cache-bust + force live edge ──
        const freshUrl = stream.url + (stream.url.includes('?') ? '&' : '?') + 't=' + Date.now() + '&r=' + Math.random();
        console.log('[AnhadAudio] 🔴 LIVE: Fresh stream connection');
        audio.src = freshUrl;
        try {
          await audio.play();
        } catch (e) {
          console.warn('[AnhadAudio] Autoplay blocked:', e.message);
          isPlaying = false;
          isLoading = false;
          isPlayLocked = false;
          emit('statechange', getPublicState());
        }

      } else if (stream.type === 'playlist') {
        // ── AMRITVELA: Server-sync + seek to live position ──
        try {
          const pos = await getServerLivePosition();
          loadPlaylistPosition(streamName, pos, requestId);
        } catch (e) {
          console.error('[AnhadAudio] Amritvela sync failed:', e);
          const local = getLocalLivePosition();
          loadPlaylistPosition(streamName, local, requestId);
        }
      }
    } finally {
      clearTimeout(lockTimeout);
    }

    saveState();
    emit('statechange', getPublicState());
  }

  function pause() {
    if (audio && !audio.paused) {
      audio.pause();
    }
  }

  async function resume() {
    // Always re-sync to server to provide a 'Live' feel, skipping over paused time.
    console.log('[AnhadAudio] Resuming with full live-sync (virtual live feel)');
    await play(currentStream || 'darbar');
  }

  async function toggle(streamName) {
    initAudioElement();

    if (audio && !audio.paused && (!streamName || streamName === currentStream)) {
      // Currently playing the same stream → pause
      pause();
    } else if (streamName && streamName !== currentStream) {
      // Different stream requested → switch (always full sync for new stream)
      await play(streamName);
    } else if (audio && audio.paused && currentStream) {
      // Paused → resume at current position (no re-sync for playlist streams)
      await resume();
    } else {
      // Nothing loaded → play default
      await play(streamName || 'darbar');
    }
  }


  async function jumpToLive() {
    if (!currentStream) currentStream = 'darbar';
    await play(currentStream);
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    isPlaying = false;
    isLoading = false;
    currentStream = null;
    saveState();
    emit('statechange', getPublicState());
    window.dispatchEvent(new CustomEvent('anhadAudioStateChange', {
      detail: { isPlaying: false, stream: null }
    }));
  }

  /**
   * Advance to the next track in the shuffled playlist WITHOUT re-querying the server.
   * This ensures seamless auto-advance when a track naturally ends.
   * Uses the local virtual-live position (which just advanced past the ended track).
   */
  async function advanceToNextTrack() {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return;
    if (trackTransitionInProgress) return;
    trackTransitionInProgress = true;

    try {
      const stream = STREAMS[currentStream];
      if (!stream || !audio) { trackTransitionInProgress = false; return; }

      const epoch = getBroadcastEpoch(currentStream) || 1704067200000;
      const totalTracks = stream.totalTracks || 40;
      const defaultDur = stream.defaultTrackDuration || 3600;

      // STABLE: use fixed total for cycle (matches server fix)
      const fixedTotal = totalTracks * defaultDur;
      const elapsedSeconds = (Date.now() - epoch) / 1000;
      const cycle = Math.floor(elapsedSeconds / fixedTotal);
      const shuffleOrder = regenerateShuffleOrder(epoch, cycle, totalTracks);

      // Find where we currently are in the shuffle order
      let currentPosInShuffle = shuffleOrder.indexOf(currentTrackIndex);
      if (currentPosInShuffle === -1) currentPosInShuffle = currentShufflePosition;

      // ALWAYS advance to next position in shuffle — never re-compute from timeline
      const nextPosInShuffle = (currentPosInShuffle + 1) % totalTracks;
      const nextTrackIndex = shuffleOrder[nextPosInShuffle];
      currentShufflePosition = nextPosInShuffle;

      console.log(`[AnhadAudio] ⏭️ Shuffle advance: position ${currentPosInShuffle}→${nextPosInShuffle}, track ${currentTrackIndex + 1} → track ${nextTrackIndex + 1}`);

      const requestId = ++playRequestId;
      loadPlaylistPosition(currentStream, {
        trackIndex: nextTrackIndex,
        position: 0,
        shufflePosition: nextPosInShuffle
      }, requestId);
    } catch (e) {
      console.error('[AnhadAudio] AdvanceToNextTrack error:', e);
      // Fallback: full server re-sync
      await play(currentStream);
    } finally {
      // Clear the flag after a short delay to prevent immediate re-triggers
      setTimeout(() => { trackTransitionInProgress = false; }, 3000);
    }
  }

  async function playNextTrack() {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return;
    // Use local advancement for seamless transitions
    await advanceToNextTrack();
  }

  async function reportTrackDuration() {
    const stream = STREAMS[currentStream];
    if (!stream || stream.type !== 'playlist' || !stream.durationApi || !audio) return;
    if (!audio.duration || !isFinite(audio.duration) || audio.duration <= 60) return;

    rememberTrackDuration(currentStream, currentTrackIndex, audio.duration);

    try {
      await fetch(`${API_BASE}${stream.durationApi}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackIndex: currentTrackIndex,
          duration: audio.duration
        })
      });
    } catch (e) {
      console.warn('[AnhadAudio] Duration report failed:', e.message);
    }
  }

  function setVolume(vol) {
    initAudioElement();
    audio.volume = Math.max(0, Math.min(1, vol));
    saveState();
    emit('volumechange', { volume: audio.volume });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KILL COMPETING AUDIO — Nuclear option for page-level <audio> elements
  // ═══════════════════════════════════════════════════════════════════════════

  function killCompetingAudio() {
    // Pause any <audio> elements on the page that are NOT ours
    document.querySelectorAll('audio').forEach(el => {
      if (el !== audio && !el.paused) {
        el.pause();
        console.log('[AnhadAudio] Killed competing audio element');
      }
    });

    // Notify AudioCoordinator if available
    if (window.AudioCoordinator) {
      window.AudioCoordinator.requestPlay('AnhadAudio');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA SESSION — Lock screen / notification controls
  // ═══════════════════════════════════════════════════════════════════════════

  function updateMediaSession() {
    // Only use web MediaSession for PWA, not Capacitor (native MediaSessionCompat handles it)
    if (window.Capacitor) return;
    if (!('mediaSession' in navigator) || !currentStream) return;
    const stream = STREAMS[currentStream];

    // Build artwork array with multiple sizes for best OS rendering
    // Use stream artwork as primary, app logo as fallback
    const primaryArt = stream.artwork || resolveAsset('icons/icon-1024x1024.png');
    const artworkList = [
      { src: resolveAsset('icons/icon-72x72.png'), sizes: '72x72', type: 'image/png' },
      { src: resolveAsset('icons/icon-152x152.png'), sizes: '152x152', type: 'image/png' },
      { src: resolveAsset('icons/icon-192x192.png'), sizes: '192x192', type: 'image/png' },
      { src: resolveAsset('icons/icon-512x512.png'), sizes: '512x512', type: 'image/png' },
      { src: primaryArt, sizes: '1024x1024', type: 'image/png' }
    ];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: stream.name,
      artist: stream.subtitle,
      album: 'ANHAD',
      artwork: artworkList
    });

    // CAPACITOR FIX: Use resume() for MediaSession play handler.
    // On Android, the lock screen/notification play button fires this.
    // Calling play() triggers a full server re-sync which causes stutter.
    // resume() plays in-place if audio is still loaded, falls back to play() only if needed.
    navigator.mediaSession.setActionHandler('play', () => {
      resume();
    });
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('stop', () => stop());
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      // Restart the current stream from live position
      play(currentStream);
    });

    if (stream.type === 'playlist') {
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      });
    } else {
      // Live stream — no next/seek
      try { navigator.mediaSession.setActionHandler('nexttrack', null); } catch(e) {}
      try { navigator.mediaSession.setActionHandler('seekbackward', null); } catch(e) {}
      try { navigator.mediaSession.setActionHandler('seekforward', null); } catch(e) {}
    }

    // Update position state for lock screen seek bar
    if (audio && audio.duration && isFinite(audio.duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate || 1,
          position: audio.currentTime
        });
      } catch (e) {}
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }

  // ─── WAKELOCK: Keep screen alive during playback ─────────────────────────
  let _wakeLock = null;
  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try { _wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
  }
  function releaseWakeLock() {
    if (_wakeLock) { try { _wakeLock.release(); } catch(e) {} _wakeLock = null; }
  }

  // ─── FOREGROUND SERVICE: Keep app alive in background for audio ────────
  function startForegroundService() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
        const stream = STREAMS[currentStream];
        window.Capacitor.Plugins.AudioService.start({
          title: stream ? stream.name : 'ANHAD Kirtan',
          artist: stream ? stream.subtitle : 'Playing'
        }).catch(function(e) {
          // If start fails, reset the flag so it can be retried next time
          foregroundServiceActive = false;
          console.warn('[AudioService] Foreground service start failed:', e);
        });
        console.log('[AudioService] Foreground service STARTED');
      }
    } catch(e) { console.warn('[AudioService] Start failed:', e); }
  }
  function stopForegroundService() {
    foregroundServiceActive = false; // Reset flag so service can start again on next play
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
        window.Capacitor.Plugins.AudioService.stop().catch(function() {});
        console.log('[AudioService] Foreground service STOPPED');
      }
    } catch(e) {}
  }
  function updateForegroundServiceNotification() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService && isPlaying) {
        const stream = STREAMS[currentStream];
        window.Capacitor.Plugins.AudioService.updateNotification({
          title: stream ? stream.name : 'ANHAD Kirtan',
          artist: stream ? stream.subtitle : 'Playing'
        }).catch(function() {});
      }
    } catch(e) {}
  }
  function syncNativeState(action) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
        window.Capacitor.Plugins.AudioService.updateState({ action }).catch(function() {});
        console.log('[AudioService] Native state synced:', action);
      }
    } catch(e) { console.warn('[AudioService] State sync failed:', e); }
  }

  // ─── AUDIO FOCUS: Pause on phone call, resume after ───────────────────────
  let _wasPlayingBeforeInterrupt = false;
  
  // Capacitor uses App plugin for lifecycle, NOT document pause/resume (that's Cordova)
  function setupAudioFocusHandling() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
          if (!state.isActive) {
            // App went to background — DON'T pause, let foreground service keep it alive
            _wasPlayingBeforeInterrupt = isPlaying;
          } else {
            // App came to foreground — re-acquire wakelock and re-sync
            if (isPlaying) {
              acquireWakeLock();
              updateMediaSession();
            }
          }
        });
        console.log('[AnhadAudio] Capacitor audio focus handling registered');
      }
    } catch(e) {}
  }
  // Retry until Capacitor is ready
  if (window.Capacitor) {
    setTimeout(setupAudioFocusHandling, 1000);
  }

  // Fallback: Also listen to visibility change for PWA
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isPlaying) {
      acquireWakeLock();
      updateMediaSession();
      updateForegroundServiceNotification();
    }
  });

  // Update position state periodically for lock screen seek bar
  setInterval(() => {
    if (window.Capacitor) return; // Skip for Capacitor - native handles it
    if (isPlaying && audio && 'mediaSession' in navigator) {
      try {
        if (audio.duration && isFinite(audio.duration)) {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: 1,
            position: audio.currentTime
          });
        }
      } catch (e) {}
    }
  }, 5000);

  setInterval(() => {
    if (!isPlaying || !audio || !currentStream || STREAMS[currentStream]?.type !== 'playlist') return;
    if (trackTransitionInProgress) return; // Don't interfere during a transition

    // ── GRACE PERIOD: Don't stall-detect while CDN is still buffering to seek position ──
    if (Date.now() < watchdogGraceUntil) {
      stalledWatchTicks = 0;
      lastWatchTime = Number(audio.currentTime) || 0;
      return;
    }

    const duration = Number(audio.duration);
    const currentTime = Number(audio.currentTime) || 0;

    // Near-end detection: if within 5s of track end and ended hasn't fired yet
    if (Number.isFinite(duration) && duration > 60 && currentTime >= duration - 5) {
      const now = Date.now();
      if (now - lastPlaylistEndedAt < 3000) return; // ended handler already handled this
      lastPlaylistEndedAt = now;
      console.log('[AnhadAudio] 🕐 Watchdog: near end of track, advancing...');
      advanceToNextTrack();
      return;
    }

    // Stall detection: if audio.currentTime hasn't moved in 45+ seconds (3 ticks × 15s)
    // Only count as stalled if audio is NOT in a loading/seeking state
    const isBuffering = audio.readyState < 3 && !audio.paused; // HAVE_FUTURE_DATA not yet reached
    if (!audio.paused && !isBuffering && Math.abs(currentTime - lastWatchTime) < 0.35) {
      stalledWatchTicks += 1;
    } else {
      stalledWatchTicks = 0;
    }
    lastWatchTime = currentTime;

    if (stalledWatchTicks >= 3) {
      stalledWatchTicks = 0;
      if (Date.now() < foregroundServiceGraceUntil) {
        console.log('[AnhadAudio] ⚡ Watchdog: stall ignored — within foreground service grace window');
        return;
      }
      if (isPlayLocked) {
        console.log('[AnhadAudio] ⚡ Watchdog: stall ignored — play() already in progress');
        return;
      }
      console.warn('[AnhadAudio] 🔄 Playlist truly stalled 45s, re-syncing to live position...');
      play(currentStream);
    }
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-RESUME on page load
  // ═══════════════════════════════════════════════════════════════════════════

  function autoResume() {
    const state = loadState();
    if (!state || !state.isPlaying || !state.stream) return;
    if (Date.now() - (state.timestamp || 0) > RESUME_THRESHOLD_MS) return;

    // Don't auto-resume on Gurbani Radio page — it has its own full player
    if (window.location.pathname.toLowerCase().includes('gurbani-radio')) return;

    // Only auto-resume Darbar live stream, not Amrit Vela
    // Amrit Vela should only play on the Gurbani Radio page
    if (state.stream === 'amritvela' || state.stream === 'simran') return;

    console.log('[AnhadAudio] 🔄 Auto-resuming:', state.stream);
    currentStream = state.stream;
    currentTrackIndex = state.trackIndex || 0;
    // Emit state immediately so UI shows, then play
    emit('statechange', getPublicState());
    setTimeout(() => play(state.stream), 300);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC STATE — Read-only snapshot
  // ═══════════════════════════════════════════════════════════════════════════

  function getPublicState() {
    const stream = currentStream ? STREAMS[currentStream] : null;
    return {
      isPlaying,
      isLoading,
      currentStream,
      currentTrackIndex,
      streamName: stream?.name || '',
      streamSubtitle: stream?.subtitle || '',
      streamType: stream?.type || '',
      artwork: stream?.artwork || '',
      playerPage: stream?.playerPage || '',
      volume: audio?.volume || 0.8,
      currentTime: audio?.currentTime || 0,
      duration: audio?.duration || 0
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER WITH AUDIO COORDINATOR
  // ═══════════════════════════════════════════════════════════════════════════

  function registerWithCoordinator() {
    if (!window.AudioCoordinator) return;
    window.AudioCoordinator.register('AnhadAudio', {
      pause: pause,
      isPlaying: () => isPlaying,
      getStream: () => currentStream
    });
    console.log('[AnhadAudio] Registered with AudioCoordinator');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE STATE ON PAGE HIDE  
  // ═══════════════════════════════════════════════════════════════════════════

  window.addEventListener('pagehide', saveState);
  window.addEventListener('beforeunload', saveState);

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPOSE GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════════

  window.AnhadAudio = {
    _singleton: true,
    play,
    pause,
    resume,
    toggle,
    stop,
    jumpToLive,
    playNextTrack,
    setVolume,
    getState: getPublicState,
    getAudio: () => audio,
    isPlaying: () => isPlaying,
    getCurrentStream: () => currentStream,
    on,
    off,
    STREAMS: Object.keys(STREAMS),
    getStreamInfo: (name) => STREAMS[name] ? { ...STREAMS[name] } : null
  };

  // ─── Backward compatibility shims ─────────────────────────────────────────
  // So old code referencing AnhadOverlayPlayer / AnhadMiniPlayer still works
  window.AnhadOverlayPlayer = {
    play: (stream) => play(stream),
    pause,
    toggle: (stream) => toggle(stream),
    stop,
    getState: getPublicState,
    updateUI: () => emit('statechange', getPublicState())
  };

  window.AnhadMiniPlayer = {
    play: (stream) => play(stream),
    pause,
    toggle: () => toggle(),
    stop,
    isPlaying: () => isPlaying,
    getStream: () => currentStream
  };

  // ─── Init ─────────────────────────────────────────────────────────────────
  initAudioElement();
  registerWithCoordinator();

  // Listen for external play requests (from hero cards etc.)
  window.addEventListener('anhadPlayStream', (e) => {
    const stream = e.detail?.stream;
    if (stream) play(stream);
  });
  window.addEventListener('anhadRequestPlay', (e) => {
    const stream = e.detail?.stream;
    if (stream) play(stream);
  });

  // Auto-resume after short delay
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(autoResume, 500));
  } else {
    setTimeout(autoResume, 500);
  }

  console.log('🪯 ANHAD Audio Singleton loaded — ONE audio, ONE truth');
})();
