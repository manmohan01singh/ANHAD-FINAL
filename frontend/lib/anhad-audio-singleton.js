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
  const RESUME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  const CDN_BASE = 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
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
      getTrackUrl(index) {
        const safeIndex = ((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1;
        return `${CDN_BASE}/day-${safeIndex}.webm?t=${Date.now()}`;
      }
    },
    simran: {
      name: 'Waheguru Simran',
      subtitle: 'Amritvela Trust',
      artwork: resolveAsset('waheguru-simran-cover.svg'),
      type: 'playlist',
      totalTracks: 38,
      defaultTrackDuration: 2000,
      liveApi: '/api/simran/live',
      durationApi: '/api/simran/durations',
      playerPage: 'GurbaniRadio/gurbani-radio.html?stream=simran',
      getTrackUrl(index) {
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
        return `${CDN_BASE_SIMRAN}/${encodeURIComponent(simranTracks[safeIndex])}?t=${Date.now()}`;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL STATE — Single source of truth
  // ═══════════════════════════════════════════════════════════════════════════

  let audio = null;            // THE one Audio element
  let currentStream = null;    // 'darbar' | 'amritvela' | null
  let currentTrackIndex = 0;
  let isPlaying = false;
  let isLoading = false;
  let audioRetryCount = 0;     // Error retry counter (max 5)
  let playRequestId = 0;       // Guards stale canplay handlers after rapid stream changes
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
    const EPOCH = 1704067200000; // Jan 1, 2024
    const elapsed = (Date.now() - EPOCH) / 1000;
    const streamName = currentStream || 'amritvela';
    const totalTracks = STREAMS[streamName]?.totalTracks || 40;
    const durations = Array.from({ length: totalTracks }, (_, index) => getCachedTrackDuration(streamName, index));
    const totalDur = durations.reduce((sum, dur) => sum + dur, 0);
    const pos = ((elapsed % totalDur) + totalDur) % totalDur;
    let cursor = pos;
    for (let index = 0; index < totalTracks; index += 1) {
      if (cursor < durations[index]) return { trackIndex: index, position: cursor };
      cursor -= durations[index];
    }
    return { trackIndex: 0, position: 0 };
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

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO ELEMENT — Created ONCE
  // ═══════════════════════════════════════════════════════════════════════════

  function initAudioElement() {
    if (audio) return;

    audio = new Audio();
    audio.preload = 'none';
    audio.volume = 0.8;

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
      audioRetryCount = 0; // Reset retry counter on success
      saveState();
      updateMediaSession();
      acquireWakeLock(); // Keep alive for background playback
      startForegroundService(); // CRITICAL: Keep process alive in background
      syncNativeState('PLAY'); // Sync native service state
      emit('statechange', getPublicState());
      window.dispatchEvent(new CustomEvent('anhadAudioStateChange', {
        detail: { isPlaying: true, stream: currentStream }
      }));
      window.dispatchEvent(new CustomEvent('anhadaudiostatechange', {
        detail: { isPlaying: true }
      }));
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
      saveState();
      releaseWakeLock(); // Allow screen to sleep
      stopForegroundService(); // Stop background service when not playing
      syncNativeState('PAUSE'); // Sync native service state
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

    audio.addEventListener('loadedmetadata', () => {
      reportTrackDuration();
    });

    audio.addEventListener('ended', () => {
      if (currentStream === 'amritvela' || currentStream === 'simran') {
        playNextTrack();
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
      isPlaying = false;
      isLoading = false;
      emit('error', { message: 'Audio playback error' });
      emit('statechange', getPublicState());
      // Auto-retry with max attempts and increasing delay
      audioRetryCount = (audioRetryCount || 0) + 1;
      if (audioRetryCount <= 5 && currentStream && !isPlaying) {
        const delay = Math.min(3000 * audioRetryCount, 15000);
        console.log(`[AnhadAudio] Auto-retry ${audioRetryCount}/5 in ${delay/1000}s...`);
        setTimeout(() => {
          if (currentStream && !isPlaying) {
            play(currentStream);
          }
        }, delay);
      } else if (audioRetryCount > 5) {
        console.warn('[AnhadAudio] Max retries exceeded, stopping auto-retry');
        audioRetryCount = 0;
        emit('error', { message: 'Unable to connect. Please try again later.' });
      }
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
    const requestedPosition = Math.max(0, Number(pos.position) || 0);
    audio.src = stream.getTrackUrl(currentTrackIndex);
    audio.load();

    console.log(`[AnhadAudio] 🎯 Virtual live: ${streamName} track ${currentTrackIndex + 1}/${stream.totalTracks} at ${Math.floor(requestedPosition)}s (depth: ${depth})`);

    const seekAndPlay = () => {
      if (requestId !== playRequestId || currentStream !== streamName) {
        console.log(`[AnhadAudio] ⚠️ Request mismatch: expected ${requestId}, got ${playRequestId}`);
        return;
      }

      const loadedDuration = Number(audio.duration);
      const duration = Number.isFinite(loadedDuration) && loadedDuration > 60
        ? loadedDuration
        : getCachedTrackDuration(streamName, currentTrackIndex);

      rememberTrackDuration(streamName, currentTrackIndex, duration);

      console.log(`[AnhadAudio] 📊 Track duration: ${duration}s, requested: ${requestedPosition}s`);

      if (requestedPosition >= duration - 3 && depth < stream.totalTracks) {
        const nextPosition = Math.max(0, requestedPosition - duration);
        const nextIndex = (currentTrackIndex + 1) % stream.totalTracks;
        console.log(`[AnhadAudio] 🔄 Live position crossed track end, rolling to track ${nextIndex + 1}`);
        loadPlaylistPosition(streamName, { trackIndex: nextIndex, position: nextPosition }, requestId, depth + 1);
        return;
      }

      const seekPos = Math.min(requestedPosition, Math.max(0, duration - 5));
      
      // Always seek to the live position, even if it's close to start
      if (Number.isFinite(audio.duration)) {
        audio.currentTime = seekPos;
        console.log(`[AnhadAudio] ⏩ Seeked to ${Math.floor(seekPos)}s (requested: ${Math.floor(requestedPosition)}s)`);
      } else {
        console.warn(`[AnhadAudio] ⚠️ Cannot seek - audio duration not available`);
      }

      audio.play().then(() => {
        console.log(`[AnhadAudio] ▶️ Playing ${streamName} at live position`);
        isPlaying = true;
        isLoading = false;
        emit('statechange', getPublicState());
      }).catch(e => {
        console.warn('[AnhadAudio] ❌ Play failed:', e.message);
        isPlaying = false;
        isLoading = false;
        emit('statechange', getPublicState());
      });
    };

    if (audio.readyState >= 2) {
      console.log(`[AnhadAudio] 🚀 Audio ready, seeking immediately`);
      seekAndPlay();
    } else {
      console.log(`[AnhadAudio] ⏳ Waiting for audio to load (readyState: ${audio.readyState})`);
      audio.addEventListener('canplay', seekAndPlay, { once: true });
    }
  }

  async function play(streamName) {
    if (!streamName) streamName = currentStream || 'darbar';
    if (!STREAMS[streamName]) {
      console.error('[AnhadAudio] Unknown stream:', streamName);
      return;
    }

    initAudioElement();
    const requestId = ++playRequestId;
    currentStream = streamName;
    const stream = STREAMS[streamName];

    isLoading = true;
    emit('loading', { isLoading: true });
    emit('statechange', getPublicState());

    // Pause any competing page-level audio elements
    killCompetingAudio();

    if (stream.type === 'live') {
      // ── DARBAR LIVE: Cache-bust + force live edge ──
      const freshUrl = stream.url + (stream.url.includes('?') ? '&' : '?') + 't=' + Date.now() + '&r=' + Math.random();
      console.log('[AnhadAudio] 🔴 LIVE: Fresh stream connection');
      audio.src = freshUrl;
      audio.load();
      try {
        await audio.play();
      } catch (e) {
        console.warn('[AnhadAudio] Autoplay blocked:', e.message);
        isPlaying = false;
        isLoading = false;
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

    saveState();
    emit('statechange', getPublicState());
  }

  function pause() {
    if (audio && !audio.paused) {
      audio.pause();
    }
  }

  async function toggle(streamName) {
    initAudioElement();

    if (audio && !audio.paused && (!streamName || streamName === currentStream)) {
      // Currently playing the same stream → pause
      pause();
    } else if (streamName && streamName !== currentStream) {
      // Different stream requested → switch
      await play(streamName);
    } else if (audio && audio.paused && currentStream) {
      // Paused → resume at live position
      await play(currentStream);
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

  async function playNextTrack() {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return;
    // Re-sync with server on track boundary for perfect live sync
    await play(currentStream);
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

    // Playlist streams are virtual-live: every resume must re-sync to the server timeline.
    navigator.mediaSession.setActionHandler('play', () => {
      if (stream.type === 'playlist') {
        play(currentStream);
        return;
      }

      if (audio && audio.src && audio.src !== window.location.href) {
        audio.play().catch(() => play(currentStream));
      } else {
        play(currentStream);
      }
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
        }).catch(function() {});
        console.log('[AudioService] Foreground service STARTED');
      }
    } catch(e) { console.warn('[AudioService] Start failed:', e); }
  }
  function stopForegroundService() {
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

  let lastWatchTime = 0;
  let stalledWatchTicks = 0;
  setInterval(() => {
    if (!isPlaying || !audio || !currentStream || STREAMS[currentStream]?.type !== 'playlist') return;
    const duration = Number(audio.duration);
    const currentTime = Number(audio.currentTime) || 0;

    if (Number.isFinite(duration) && duration > 60 && currentTime >= duration - 2) {
      play(currentStream);
      return;
    }

    if (!audio.paused && Math.abs(currentTime - lastWatchTime) < 0.35) {
      stalledWatchTicks += 1;
    } else {
      stalledWatchTicks = 0;
    }
    lastWatchTime = currentTime;

    if (stalledWatchTicks >= 2) {
      stalledWatchTicks = 0;
      console.warn('[AnhadAudio] Playlist playback looked stuck, refreshing virtual live position');
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
