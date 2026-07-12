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
 *   3. Play/Pause resumes in place; only explicit LIVE joins the server edge
 *   4. Cache-bust every .src assignment
 *   5. MediaSession for lock screen controls
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Prevent double-init
  if (window.AnhadAudio && window.AnhadAudio._singleton) return;

  // NUCLEAR GUARD: If returning from cached SPA navigation, skip ALL initialization
  // This prevents the audio engine from re-initializing, re-resuming, and causing
  // native AudioService calls that trigger navigation lag on Capacitor.
  if (window._ANHAD_SKIP_AUDIO_INIT) {
    console.log('[AnhadAudio] 🚫 NUCLEAR GUARD: Cached return detected, skipping ALL init');
    // Still expose the API so UI code doesn't crash
    if (!window.AnhadAudio) {
      window.AnhadAudio = {
        _singleton: true,
        _nuclearGuard: true,
        play: () => { console.log('[AnhadAudio] 🚫 Nuclear guarded: play() blocked'); },
        pause: () => {},
        resume: () => {},
        resumeInPlace: () => {},
        toggle: () => {},
        stop: () => {},
        jumpToLive: () => {},
        playNextTrack: () => {},
        setVolume: () => {},
        getState: () => ({ isPlaying: false, isLoading: false, currentStream: null, currentTrackIndex: 0 }),
        getAudio: () => null,
        isPlaying: () => false,
        getCurrentStream: () => null,
        on: () => function() {},
        off: () => {},
        STREAMS: [],
        getStreamInfo: () => null
      };
    }
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const STATE_KEY = 'anhad_audio_state';
  const DURATION_CACHE_KEY = 'anhad_audio_track_durations_v1';
  const BROADCAST_META_KEY = 'anhad_broadcast_virtual_meta_v1';
  const RESUME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  const CDN_BASE = 'https://anhad-final.onrender.com/audio';
  const CDN_BASE_R2 = 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev'; // Direct R2 for Amritvela WebM
  const CDN_BASE_SIMRAN = 'https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev/waheguru';
  const SGPC_LIVE = 'https://live.sgpc.net:8443/;nocache=1';
  // PERF FIX: Fixed UTC epoch for backend-free virtual live sync.
  const VIRTUAL_LIVE_EPOCH_START = 1704067200; // 2024-01-01 00:00:00 UTC
  // PERF FIX: Known measured durations from backend state files, with defaults for unknown tracks.
  const AMRITVELA_KNOWN_DURATIONS = {
    2: 5191, 5: 5638, 10: 5591, 12: 5633, 13: 6537, 14: 5640,
    18: 6038, 21: 6026, 23: 4899, 25: 5771, 29: 5136, 30: 5755,
    31: 5181, 32: 5747, 33: 6628, 34: 5990, 35: 4796, 37: 5717
  };
  const SIMRAN_KNOWN_DURATIONS = {
    0: 2747, 1: 2676, 5: 2379, 9: 2250, 10: 2287, 11: 2116,
    12: 2250, 13: 2080, 14: 2062, 15: 2455, 17: 2024, 21: 1951,
    23: 1959, 24: 1994, 25: 2262, 26: 2136, 27: 2477, 28: 1895,
    31: 5371, 32: 2019, 34: 2282, 37: 3167
  };

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
    } catch (e) { }
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
    } catch (e) { }
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
      artwork: resolveAsset('HERO CARD IMAGES/day-darbar-sahib.webp'),
      artworkSlots: {
        morning: resolveAsset('HERO CARD IMAGES/morning-darbar-sahib.webp'),
        day: resolveAsset('HERO CARD IMAGES/day-darbar-sahib.webp'),
        evening: resolveAsset('HERO CARD IMAGES/evening-darbar-sahib.webp'),
        night: resolveAsset('HERO CARD IMAGES/night-darbar-sahib.webp')
      },
      type: 'live',
      playerPage: 'GurbaniRadio/gurbani-radio.html'
    },
    amritvela: {
      name: 'Amritvela Kirtan',
      subtitle: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
      artwork: resolveAsset('HERO CARD IMAGES/day-amritvela-kirtan.webp'),
      artworkSlots: {
        morning: resolveAsset('HERO CARD IMAGES/morning-amritvela-kirtan.webp'),
        day: resolveAsset('HERO CARD IMAGES/day-amritvela-kirtan.webp'),
        evening: resolveAsset('HERO CARD IMAGES/evening-amritvela-kirtan.webp'),
        night: resolveAsset('HERO CARD IMAGES/night-amritvela-kirtan.webp')
      },
      type: 'playlist',
      totalTracks: 40,
      defaultTrackDuration: 3600,
      liveApi: '/api/radio/live',
      durationApi: '/api/radio/durations',
      playerPage: 'GurbaniRadio/gurbani-radio.html?stream=amritvela',
      getTrackUrl(index, position = 0) {
        const safeIndex = ((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1;
        const filename = `day-${safeIndex}.webm`;
        // Capacitor: direct R2 CDN (no Render middleman = no cold starts)
        // PWA: same-origin Render proxy (simpler, no CORS issues)
        // NOTE: No time-based cache-busting — browser caches by URL, stable URL = instant resume
        const base = window.Capacitor ? CDN_BASE_R2 : CDN_BASE;
        return `${base}/${filename}?v=2.1.5`;
      }
    },
    simran: {
      name: 'Waheguru Simran',
      subtitle: 'Amritvela Trust',
      artwork: resolveAsset('HERO CARD IMAGES/day-waheguru-simran.webp'),
      artworkSlots: {
        morning: resolveAsset('HERO CARD IMAGES/morning-waheguru-simran.webp'),
        day: resolveAsset('HERO CARD IMAGES/day-waheguru-simran.webp'),
        evening: resolveAsset('HERO CARD IMAGES/evening-waheguru-simran.webp'),
        night: resolveAsset('HERO CARD IMAGES/night-waheguru-simran.webp')
      },
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
        // Direct CDN URL for both PWA and Capacitor.
        // Simran tracks are MP3 — natively supported on all platforms.
        // Seeking done via audio.currentTime after loadedmetadata.
        // NOTE: No time-based cache-busting — stable URL = browser can cache and resume instantly.
        return `${CDN_BASE_SIMRAN}/${encodeURIComponent(filename)}?v=2.1.5`;
      }
    },
    hukamnama: {
      name: 'Daily Hukamnama',
      subtitle: 'Sachkhand Sri Harmandir Sahib',
      url: `${API_BASE}/api/hukamnama/audio`, // Use backend streaming proxy
      artwork: resolveAsset('HUKAMNAMA-SAHIB.webp'),
      type: 'live',
      skipCacheBuster: true,
      playerPage: 'Hukamnama/daily-hukamnama.html'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL STATE — Single source of truth
  // ═══════════════════════════════════════════════════════════════════════════

  let audio = null;            // THE one Audio element
  let currentStream = null;    // 'darbar' | 'amritvela' | 'simran' | null
  let currentTrackIndex = 0;
  let currentShufflePosition = 0; // Position in shuffle order for seamless advancing
  let currentTrackTitle = '';   // Live track title from server (e.g. "Deenanath Suno")
  let currentTrackArtist = '';  // Live track artist from server
  let liveSyncAnchor = null;    // { wallTime, audioTime, trackIndex }
  let pauseAnchor = null;       // { trackIndex, position, timestamp } - for pause/resume position preservation
  let isPlaying = false;
  let isLoading = false;
  let isPlayLocked = false;    // CAPACITOR FIX: prevents re-entrant play() during active play operation
  let playLockTimeoutId = null;
  let audioRetryCount = 0;     // Error retry counter (max 5)
  let trackTransitionInProgress = false; // Prevents ended + watchdog double-fire
  let playRequestId = 0;       // Guards stale canplay handlers after rapid stream changes
  let lastPlaylistEndedAt = 0; // Coalesce ended + near-end watchdog double-fires
  let watchdogGraceUntil = 0;  // Suppress stall watchdog for N ms after a new load
  let lastLoadedAt = 0;        // Timestamp of last audio.load() call
  let lastWatchTime = 0;       // For stall detection
  let stalledWatchTicks = 0;   // Consecutive stall ticks
  let lastTransitionProof = null; // Debug proof that next-track starts at 0:00
  let foregroundServiceGraceUntil = 0; // CAPACITOR FIX: grace window after startForegroundService()
  let foregroundServiceActive = false;  // CAPACITOR FIX: prevents double-starting the foreground service
  let capacitorWatchdogGraceUntil = 0; // CAPACITOR FIX: suppress watchdog for 2 minutes after play
  let manualPauseUntil = 0; // User pause must not be swallowed by audio-focus grace
  let lastLiveDriftCheckAt = 0;
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
    var _set = listeners.get(event);
    return function () { if (_set) _set.delete(fn); };
  }

  function off(event, fn) {
    var _s2 = listeners.get(event); if (_s2) _s2.delete(fn);
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
    } catch (e) { }
  }

  function getCachedTrackDuration(streamName, trackIndex) {
    const stream = STREAMS[streamName];
    const fallback = stream && stream.defaultTrackDuration || 3600;
    // PERF FIX: Prefer measured durations baked into the PWA for backend-free sync.
    const known = streamName === 'amritvela'
      ? AMRITVELA_KNOWN_DURATIONS[trackIndex]
      : streamName === 'simran'
        ? SIMRAN_KNOWN_DURATIONS[trackIndex]
        : null;
    if (Number.isFinite(known) && known > 60) return known;
    const duration = getDurationCache() && getDurationCache()[streamName] && getDurationCache()[streamName][trackIndex];
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
    } catch (e) { }

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
      } catch (e) { }
    }
  }

  function getBroadcastEpoch(streamName) {
    try {
      const meta = JSON.parse(localStorage.getItem(BROADCAST_META_KEY) || '{}');
      const e = meta[streamName] && meta[streamName].epoch;
      return Number.isFinite(e) ? e : null;
    } catch (e) {
      return null;
    }
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
    } catch (e) { }

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
      } catch (e) { }
    }
  }

  function getBroadcastEpoch(streamName) {
    try {
      const meta = JSON.parse(localStorage.getItem(BROADCAST_META_KEY) || '{}');
      const e = meta[streamName] && meta[streamName].epoch;
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
   * Virtual-live position (offline fallback).
   * Mirrors server's getCurrentLivePosition() exactly:
   *  - Cycle uses fixedTotal (shuffle stability)
   *  - Position uses learnedTotal (actual durations, no dead zones)
   *  - Server-synced durations from localStorage cache
   */
  function computeVirtualLivePosition(streamName) {
    const stream = STREAMS[streamName];
    const playlist = buildVirtualPlaylist(streamName);
    const totalDuration = getVirtualTotalDuration(streamName);
    if (!stream || !playlist.length || totalDuration <= 0) {
      return { trackIndex: 0, position: 0, shufflePosition: 0, trackDuration: 0 };
    }

    // PERF FIX: Fixed UTC math; no API call required to join the live point.
    const nowUTC = Math.floor(Date.now() / 1000);

    const positionInPlaylist = ((nowUTC - VIRTUAL_LIVE_EPOCH_START) % totalDuration + totalDuration) % totalDuration;
    return computeVirtualLivePositionOrdered(playlist, totalDuration, positionInPlaylist);
  }

  // PERF FIX: Ordered virtual-live schedule helpers used by the no-backend engine.
  function computeVirtualLivePositionOrdered(playlist, totalDuration, positionInPlaylist) {
    let accumulated = 0;
    for (let i = 0; i < playlist.length; i += 1) {
      const trackDuration = playlist[i].duration;
      if (accumulated + trackDuration > positionInPlaylist) {
        return {
          trackIndex: i,
          position: Math.max(0, positionInPlaylist - accumulated),
          shufflePosition: i,
          trackDuration,
          trackTitle: playlist[i].title,
          trackArtist: playlist[i].artist,
          totalDuration,
          trackAccumulatedStart: accumulated
        };
      }
      accumulated += trackDuration;
    }
    return { trackIndex: 0, position: 0, shufflePosition: 0, trackDuration: playlist[0] && playlist[0].duration || 0 };
  }

  function getTimeOfDay() {
    const forced = localStorage.getItem('anhad_forced_time_of_day');
    if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
      return forced;
    }
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return 'morning';
    if (h >= 9 && h < 16) return 'day';
    if (h >= 16 && h < 20) return 'evening';
    return 'night';
  }

  function getArtworkForStream(stream) {
    if (!stream) return '';
    if (!stream.artworkSlots) return stream.artwork || '';
    const timeSlot = getTimeOfDay();
    return stream.artworkSlots[timeSlot] || stream.artwork;
  }

  function getSimranTitles() {
    return [
      'Deenanath Suno', 'Tum Karo Daya', 'Sunn Yaar Hamare Sajan', 'Sukh Naahi Re',
      'Tu Prabh Data', 'Satnam Waheguru', 'Mere Ram', 'Rakhwala Simran', 'Aas Pyaasi',
      'Prabh Paas Jan Ki Ardas', 'Tu Hi Tu Hi', 'Naam Naam Naam Apna Naam Deho',
      'Dhan Guru Ramdas Ji', 'Aao Sajana', 'Tuj Bin Kavan Hamara', 'Mera Baid Guru Govinda',
      'Jagan Te Supna Bhala', 'Eh Neech Karam Har Mere', 'Apna Naam Japao',
      'Mere Pyaare Satuguru Ji', 'Rakh Leho Bhagwan', 'Kab Gal Lavenge', 'Mere Ram Mere Ram',
      'Rakheya Karo', 'Waheguru Simran Uth Naam Jap', 'Best Waheguru Simran',
      'Kad Nanak Aave Vari', 'Bin Gur Na Pavaigo', 'Kiyo Shingar Milan Ke Taayee',
      'Naam Bina Nahi Jeevia Jaye', 'Aath Pehar Simro', 'Mil Mere Preetma Jeeo',
      'Satnam Shri Waheguru', 'Rakh Rakh Mere Beethla', 'Praan Adhaara Ram',
      'Dhan Baba Nanak', 'Sunn Mann Mittar Pyareya', 'Mere Satgur Pyare Gurnanak Aaja'
    ];
  }

  function buildVirtualPlaylist(streamName) {
    const stream = STREAMS[streamName];
    if (!stream || stream.type !== 'playlist') return [];
    const titles = streamName === 'simran' ? getSimranTitles() : [];
    return Array.from({ length: stream.totalTracks || 0 }, (_, index) => ({
      id: `${streamName}-${index + 1}`,
      url: stream.getTrackUrl(index),
      duration: Math.round(getCachedTrackDuration(streamName, index)),
      title: streamName === 'simran' ? (titles[index] || 'Waheguru Simran') : `Day ${index + 1} - Amritvela Kirtan`,
      artist: stream.subtitle || ''
    }));
  }

  function getVirtualTotalDuration(streamName) {
    return buildVirtualPlaylist(streamName).reduce((sum, track) => sum + track.duration, 0);
  }

  function getTrackAccumulatedStart(streamName, trackIndex) {
    const playlist = buildVirtualPlaylist(streamName);
    let start = 0;
    for (let i = 0; i < playlist.length; i += 1) {
      if (i === trackIndex) return start;
      start += playlist[i].duration;
    }
    return 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER SYNC — Single source of live position truth
  // ═══════════════════════════════════════════════════════════════════════════

  // BUGFIX: Cache variables for stream-specific invalidation (Task 3.3)
  let _syncCache = null;
  let _syncCacheAt = 0;
  let _syncStream = null; // Track which stream the cache is for

  /**
   * BUGFIX Task 3.4: Add force sync API parameter
   * When force === true, bypass cache completely and fetch fresh server data
   * @param {boolean} force - If true, bypass cache and force fresh sync
   * @returns {Promise<Object>} Live position data
   */
  async function getServerLivePosition(force = false) {
    // BUGFIX: Detect stream switch - invalidate cache (Task 3.3)
    // Ensure cache from previous stream (Darbar/Amritvela/Simran) doesn't persist
    if (_syncStream !== currentStream) {
      _syncCache = null;
      _syncCacheAt = 0;
      _syncStream = currentStream;
      console.log(`[AnhadAudio] Stream switch detected (${_syncStream} → ${currentStream}), cache invalidated`);
    }

    // BUGFIX Task 3.4: Force fresh sync when explicitly requested
    // Used on: page load, resume from background, reconnect events
    if (force) {
      _syncCache = null;
      _syncCacheAt = 0;
      console.log('[AnhadAudio] Force sync requested - cache invalidated');
    }

    // PERF FIX: Virtual live streams are synchronized by UTC math, not a backend round trip.
    if (currentStream && STREAMS[currentStream] && STREAMS[currentStream].type === 'playlist') {
      const localPos = getLocalLivePosition();
      console.log(`[AnhadAudio] Virtual live sync: ${currentStream} track ${localPos.trackIndex + 1} seekTo=${Math.floor(localPos.position)}s`);
      emitLivePosition(localPos, false);
      return localPos;
    }
    let timeoutId = null;
    try {
      const t0 = Date.now();
      const apiEndpoint = STREAMS[currentStream] && STREAMS[currentStream].liveApi || '/api/radio/live';
      // FIX: Use deterministic time bucket (5s) instead of Math.random() to prevent cache-busting loops
      const url = `${API_BASE}${apiEndpoint}?t=${Math.floor(Date.now() / 5000) * 5000}`;
      console.log(`[AnhadAudio] Fetching live position from: ${url}`);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000);

      const resp = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      timeoutId = null;
      const t1 = Date.now();
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const latency = (t1 - t0) / 2000;

      if (currentStream && data.epoch != null) {
        persistBroadcastMeta(currentStream, data);
      }

      if (typeof data.trackIndex !== 'number' || !Number.isFinite(data.trackPosition)) {
        console.warn('[AnhadAudio] Live API missing track fields; using virtual timeline');
        const localPos = getLocalLivePosition();
        emitLivePosition(localPos, false);
        return localPos;
      }

      console.log(`[AnhadAudio] ✅ Server sync: Track ${data.trackIndex + 1} at ${Math.floor(data.trackPosition)}s (latency: ${latency.toFixed(2)}s)`);
      const serverPos = {
        trackIndex: data.trackIndex,
        position: data.trackPosition + latency,
        shufflePosition: data.shufflePosition,
        trackDuration: data.trackDuration,
        trackTitle: data.trackTitle,
        trackArtist: data.trackArtist,
        listeners: data.listenersCount
      };
      emitLivePosition(serverPos, true);
      return serverPos;
    } catch (e) {
      console.warn('[AnhadAudio] ❌ Server sync failed, using local fallback:', e.message);
      console.log(`[AnhadAudio] API_BASE: ${API_BASE}, Stream: ${currentStream}`);
      const localPos = getLocalLivePosition();
      emitLivePosition(localPos, false);
      return localPos;
    }
  }

  function emitLivePosition(pos, fromServer) {
    if (!pos || !currentStream || STREAMS[currentStream] && STREAMS[currentStream].type !== 'playlist') return;
    const localTime = audio ? Number(audio.currentTime) || 0 : 0;
    const sameTrack = pos.trackIndex === currentTrackIndex;
    const drift = sameTrack ? Math.abs((Number(pos.position) || 0) - localTime) : Infinity;
    const payload = {
      stream: currentStream,
      trackIndex: pos.trackIndex,
      position: pos.position,
      localTrackIndex: currentTrackIndex,
      localPosition: localTime,
      drift,
      fromServer,
      isAtLiveEdge: sameTrack && drift <= 10
    };
    emit('liveposition', payload);
    window.dispatchEvent(new CustomEvent('anhadLiveSyncStatus', { detail: payload }));
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
        shufflePosition: currentShufflePosition,   // persist shuffle position for refresh-resume
        isPlaying,
        // PERF FIX: Persist explicit volume preference, defaulting safely to 70%.
        volume: audio ? audio.volume : 0.7,
        currentTime: audio ? audio.currentTime : 0,
        timestamp: Date.now()
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(data));
      // NOTE: Removed duplicate write to gurbani_radio_state to prevent double I/O
    } catch (e) { }
  }

  function loadState() {
    try {
      const s = localStorage.getItem(STATE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  // Restore currentStream on init ONLY if the user was actively playing (isPlaying = true)
  // AND the state is recent enough. This prevents the mini-player from showing on every
  // fresh page load just because localStorage has a stale stream reference.
  // The mini-player should only appear when the user has explicitly played Kirtan.
  const initialSavedState = loadState();
  if (initialSavedState && initialSavedState.stream && STREAMS[initialSavedState.stream]) {
    const isFresh = Date.now() - (initialSavedState.timestamp || 0) < RESUME_THRESHOLD_MS;
    if (initialSavedState.isPlaying && isFresh) {
      currentStream = initialSavedState.stream;
      currentTrackIndex = initialSavedState.trackIndex || 0;
      console.log('[AnhadAudio] Restored stream from saved state:', currentStream);
    } else {
      console.log('[AnhadAudio] Saved state found but not restoring — isPlaying was false or state is stale');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO ELEMENT — Created ONCE
  // ═══════════════════════════════════════════════════════════════════════════

  function initAudioElement() {
    if (audio) return;

    // Check for preloaded audio from audio-preload.js and adopt it
    if (window.__anhadPreloadedAudio && window.__anhadPreloadedAudio.audio) {
      console.log('[AnhadAudio] Adopting preloaded audio element');
      audio = window.__anhadPreloadedAudio.audio;
      // Sync state from preload
      if (window.__anhadPreloadedAudio.stream) {
        var _preloadedSrc = audio.src || '';
        if (!_preloadedSrc.startsWith('data:audio/wav;base64,')) {
          currentStream = window.__anhadPreloadedAudio.stream;
          currentTrackIndex = window.__anhadPreloadedAudio.trackIndex || 0;
        } else {
          console.log('[AnhadAudio] Preloaded audio is WAV unlock only, not setting currentStream');
        }
      }
      // CRITICAL FIX: The preloaded audio plays a silent WAV only to unlock the audio
      // context (browser autoplay policy). DO NOT set isPlaying=true for this —
      // it would show the mini-player and trigger native AudioService bridge calls
      // unnecessarily. Only set isPlaying if the src is a REAL stream URL.
      var _preloadedSrc = audio.src || '';
      if (!audio.paused && !audio.ended && _preloadedSrc && !_preloadedSrc.startsWith('data:audio/wav;base64,')) {
        isPlaying = true;
        console.log('[AnhadAudio] Adopted audio is already playing real stream, synced isPlaying=true');
      } else {
        console.log('[AnhadAudio] Adopted audio is playing silent WAV (unlock only), isPlaying stays false');
      }
      // Clear the preloaded reference
      window.__anhadPreloadedAudio = null;

      // Re-attach event listeners to the adopted element
      attachAudioEventListeners();
      return;
    }

    if (window.Capacitor) {
      // CAPACITOR: Standard <audio> element — NO crossOrigin (CORS not needed for playback,
      // and SGPC/R2 CDN don't send Access-Control-Allow-Origin for https://localhost)
      audio = document.createElement('audio');
      audio.preload = 'auto';
      // PERF FIX: Never initialize at 100%; restore below or stay at a safe 70%.
      audio.volume = 0.7;

      // DOM-attached element: forces Android WebView to allocate a media buffer
      audio.id = 'anhad-global-audio';
      audio.style.position = 'absolute';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0';
      audio.style.pointerEvents = 'none';
      if (!document.getElementById('anhad-global-audio')) {
        document.body.appendChild(audio);
      }
    } else {
      audio = new Audio();
      audio.preload = 'auto'; // Changed from 'metadata' to 'auto' for better loading
      // PERF FIX: Never initialize at 100%; restore below or stay at a safe 70%.
      audio.volume = 0.7;
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

    // PERF FIX: Restore volume preference from localStorage with a safe 70% default.
    const saved = loadState();
    const savedVolume = Number(localStorage.getItem('anhad_audio_volume'));
    if (Number.isFinite(savedVolume)) audio.volume = Math.max(0, Math.min(1, savedVolume));
    else if (saved && saved.volume !== undefined) audio.volume = Math.max(0, Math.min(1, Number(saved.volume)));

    attachAudioEventListeners();
    
    // AUTOPLAY FIX: Create a user interaction listener to unlock audio on first click
    // This ensures browsers grant permission for audio playback
    if (!window.Capacitor) {
      const unlockAudio = () => {
        if (audio && audio.paused) {
          // Create a silent play/pause to unlock audio context
          const originalSrc = audio.src;
          const originalTime = audio.currentTime;
          
          // Try to play current audio (will succeed if within user gesture)
          audio.play().then(() => {
            console.log('[AnhadAudio] ✅ Audio context unlocked');
            // If we were supposed to be paused, pause again
            if (!isPlaying) {
              audio.pause();
            }
          }).catch(() => {
            // Still blocked, will try again on next user interaction
            console.log('[AnhadAudio] Audio still locked, waiting for user gesture');
          });
        }
        // Remove listener after first successful interaction
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      };
      
      // Listen for first user interaction
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('touchstart', unlockAudio, { once: true });
    }
  }

  function attachAudioEventListeners() {
    if (!audio) return;

    audio.addEventListener('playing', () => {
      // NUCLEAR FIX: If the audio src is the preloaded silent WAV (used only to unlock
      // browser autoplay policy), do NOT start native AudioService or sync state.
      // This prevents the native bridge call chain that causes navigation lag.
      var _isWavUnlock = audio && audio.src && audio.src.startsWith('data:audio/wav;base64,');
      
      isPlaying = !_isWavUnlock;
      isLoading = false;
      isPlayLocked = false;
      if (playLockTimeoutId) {
        clearTimeout(playLockTimeoutId);
        playLockTimeoutId = null;
      }
      emit('loading', { isLoading: false });
      audioRetryCount = 0;

      // For silent WAV unlock, skip ALL native bridge calls — just update internal state
      if (_isWavUnlock) {
        console.log('[AnhadAudio] ℹ️ playing event for preloaded WAV (unlock only) — skipping native bridge');
        currentStream = null;
        currentTrackIndex = 0;
        emit('statechange', getPublicState());
        return;
      }

      // Update anchor on every play to maintain accuracy
      if (currentStream === 'amritvela' || currentStream === 'simran') {
        liveSyncAnchor = {
          wallTime: Date.now(),
          audioTime: audio.currentTime,
          trackIndex: currentTrackIndex
        };
      }
      saveState();
      updateMediaSession();
      acquireWakeLock();

      // Set grace window BEFORE starting foreground service.
      // On Android, AudioService.start() grabs audio focus which fires a spurious 'pause'.
      foregroundServiceGraceUntil = Date.now() + 3000;
      // CAPACITOR FIX: Suppress watchdog for 2 minutes after play() to avoid WebView false stalls
      if (window.Capacitor) {
        capacitorWatchdogGraceUntil = Date.now() + 120000; // 2 minutes
      }
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
      // ALWAYS clear the play lock on pause — even if isLoading, to prevent isPlayLocked getting stuck.
      // This is especially critical on iOS where audio.load() can fire a spurious pause while loading.
      isPlayLocked = false;
      if (playLockTimeoutId) { clearTimeout(playLockTimeoutId); playLockTimeoutId = null; }
      if (trackTransitionInProgress || isLoading) return;

      // NUCLEAR FIX: If the preloaded silent WAV ended, just update state — no native bridge calls.
      // The WAV is only used to unlock browser autoplay policy, not for actual playback.
      var _isWavPause = audio && audio.src && audio.src.startsWith('data:audio/wav;base64,');
      if (_isWavPause) {
        console.log('[AnhadAudio] ℹ️ pause event for preloaded WAV (ended naturally) — skipping native bridge');
        currentStream = null;
        currentTrackIndex = 0;
        isPlaying = false;
        isLoading = false;
        isPlayLocked = false;
        emit('loading', { isLoading: false });
        saveState();
        emit('statechange', getPublicState());
        return;
      }

      // NUCLEAR GUARD: On cached SPA return, suppress ALL pause events completely
      // This prevents the chain: pause → suppressed → resume() → AudioService → spurious pause → ...
      if (window._ANHAD_SKIP_AUDIO_INIT) {
        console.log('[AnhadAudio] 🚫 Pause suppressed by _ANHAD_SKIP_AUDIO_INIT');
        // Sync playing state to prevent downstream code from thinking we're paused
        isPlaying = true;
        return;
      }

      // CAPACITOR: Suppress spurious pause from AudioService audio focus grab.
      // Android re-grants focus automatically — just ignore the pause.
      if (Date.now() < foregroundServiceGraceUntil && Date.now() > manualPauseUntil) {
        console.log('[AnhadAudio] ⚡ Suppressing spurious pause (grace window)');
        return;
      }

      // BUGFIX: Invalidate sync anchor on pause to force fresh calculation on resume
      // This prevents timeline drift accumulation when user pauses and resumes
      liveSyncAnchor = null;
      console.log('[AnhadAudio] 🔄 Cache invalidated on pause');

      manualPauseUntil = 0;
      isPlaying = false;
      isLoading = false;
      isPlayLocked = false;
      foregroundServiceActive = false;
      emit('loading', { isLoading: false });
      saveState();
      releaseWakeLock();
      syncNativeState('PAUSE');
      if (!window.Capacitor) {
        stopForegroundService();
      } else {
        updateForegroundServiceNotification();
      }
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

    audio.addEventListener('stalled', () => {
      // PERF FIX: Recover slow network stalls without forcing a page reload.
      const streamAtStall = currentStream;
      setTimeout(() => {
        if (!audio || currentStream !== streamAtStall) return;
        try { audio.load(); } catch (e) { }
      }, 2000);
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
      if (playLockTimeoutId) {
        clearTimeout(playLockTimeoutId);
        playLockTimeoutId = null;
      }
      if (currentStream && audioRetryCount < 3) {
        audioRetryCount++;
        const retryDelay = currentStream === 'darbar' ? 3000 : 2000 * audioRetryCount;
        const streamAtError = currentStream;
        console.log(`[AnhadAudio] 🔁 Auto-retry ${audioRetryCount}/3 in ${retryDelay / 1000}s...`);
        setTimeout(() => {
          if (!isPlaying && !isPlayLocked && currentStream === streamAtError) {
            if (streamAtError === 'darbar' && audio) {
              try { audio.load(); } catch (e) { }
              audio.play().catch(() => play(streamAtError));
            } else {
              play(streamAtError);
            }
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

    // ── UPDATE track metadata (title/artist from server sync or local STREAMS) ──
    const incomingPosition = Math.max(0, Number(pos.position) || 0);
    const knownDuration = Number(pos.trackDuration) || getCachedTrackDuration(streamName, currentTrackIndex);
    if (false && Number.isFinite(knownDuration) && knownDuration > 60 && incomingPosition > 0 && knownDuration - incomingPosition <= 12) {
      const epoch = getBroadcastEpoch(streamName) || 1704067200000;
      const totalTracks = stream.totalTracks || 40;
      const defaultDur = stream.defaultTrackDuration || 3600;
      const fixedTotal = totalTracks * defaultDur;
      const elapsedSeconds = (Date.now() - epoch) / 1000;
      const cycle = Math.floor(elapsedSeconds / fixedTotal);
      const shuffleOrder = regenerateShuffleOrder(epoch, cycle, totalTracks);
      let posInShuffle = Number.isFinite(Number(pos.shufflePosition)) ? Number(pos.shufflePosition) : shuffleOrder.indexOf(currentTrackIndex);
      if (posInShuffle < 0) posInShuffle = currentShufflePosition || 0;
      const nextPosInShuffle = (posInShuffle + 1) % totalTracks;
      const nextTrackIndex = shuffleOrder[nextPosInShuffle];
      console.log(`[AnhadAudio] Live join was ${Math.round(knownDuration - incomingPosition)}s from track end; opening next track cleanly`);
      currentTrackIndex = nextTrackIndex;
      currentShufflePosition = nextPosInShuffle;
      pos = { ...pos, trackIndex: nextTrackIndex, position: 0, shufflePosition: nextPosInShuffle, trackTitle: null };
    }

    if (pos.trackTitle) {
      currentTrackTitle = pos.trackTitle;
    } else if (stream.tracks && stream.tracks[currentTrackIndex] && stream.tracks[currentTrackIndex].title) {
      currentTrackTitle = stream.tracks[currentTrackIndex].title;
    } else if (streamName === 'simran') {
      // Build title from filename: extract human-readable part
      const simranTitles = [
        'Deenanath Suno', 'Tum Karo Daya', 'Sunn Yaar Hamare Sajan', 'Sukh Naahi Re',
        'Tu Prabh Data', 'Satnam Waheguru', 'Mere Ram', 'Rakhwala Simran', 'Aas Pyaasi',
        'Prabh Paas Jan Ki Ardas', 'Tu Hi Tu Hi', 'Naam Naam Naam Apna Naam Deho',
        'Dhan Guru Ramdas Ji', 'Aao Sajana', 'Tuj Bin Kavan Hamara', 'Mera Baid Guru Govinda',
        'Jagan Te Supna Bhala', 'Eh Neech Karam Har Mere', 'Apna Naam Japao',
        'Mere Pyaare Satuguru Ji', 'Rakh Leho Bhagwan', 'Kab Gal Lavenge', 'Mere Ram Mere Ram',
        'Rakheya Karo', 'Waheguru Simran Uth Naam Jap', 'Best Waheguru Simran',
        'Kad Nanak Aave Vari', 'Bin Gur Na Pavaigo', 'Kiyo Shingar Milan Ke Taayee',
        'Naam Bina Nahi Jeevia Jaye', 'Aath Pehar Simro', 'Mil Mere Preetma Jeeo',
        'Satnam Shri Waheguru', 'Rakh Rakh Mere Beethla', 'Praan Adhaara Ram',
        'Dhan Baba Nanak', 'Sunn Mann Mittar Pyareya', 'Mere Satgur Pyare Gurnanak Aaja'
      ];
      currentTrackTitle = simranTitles[currentTrackIndex] || 'Waheguru Simran';
    } else if (streamName === 'amritvela') {
      currentTrackTitle = `Day ${currentTrackIndex + 1} - Amritvela Kirtan`;
    } else {
      currentTrackTitle = stream.name;
    }
    currentTrackArtist = pos.trackArtist || stream.subtitle || '';

    // Emit track change event so UI can update subtitle/title
    window.dispatchEvent(new CustomEvent('anhadTrackChanged', {
      detail: {
        stream: streamName,
        trackIndex: currentTrackIndex,
        trackTitle: currentTrackTitle,
        trackArtist: currentTrackArtist
      }
    }));

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

    // CAPACITOR FIX: DO NOT use #t= for Android WebView!
    audio.src = trackUrl;
    lastLoadedAt = Date.now(); // Track when we started loading
    // On PWA: call load() to reset media pipeline for reused elements.
    // On Capacitor: do NOT call load() — it jams Android's native MediaPlayer.
    if (!window.Capacitor) {
      try { audio.load(); } catch (e) { }
    }

    // Wait for metadata before the first play(). Starting muted playback here and
    // then calling play() again after metadata causes "interrupted by a new load
    // request" on Chromium/Android.
    audio.volume = 0;

    // Update live sync anchor after load
    liveSyncAnchor = {
      wallTime: Date.now(),
      audioTime: requestedPosition,
      trackIndex: currentTrackIndex
    };

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
          audio.currentTime = 0;
        } catch (e) { }
        lastTransitionProof = {
          stream: streamName,
          trackIndex: currentTrackIndex,
          requestedPosition,
          startedAt: 0,
          reason,
          timestamp: Date.now()
        };
        audio.volume = 0;
        audio.play()
          .then(() => {
            isPlaying = true;
            isLoading = false;
            const actualStart = Number(audio.currentTime) || 0;
            lastTransitionProof.actualStart = actualStart;
            lastTransitionProof.verified = actualStart < 1.5;
            emit('statechange', getPublicState());

            const targetVol = 0.8;
            const fadeMs = 2000;
            const steps = 20;
            let step = 0;
            const interval = setInterval(() => {
              step++;
              if (audio) audio.volume = targetVol * (step / steps);
              if (step >= steps) {
                clearInterval(interval);
                if (audio) audio.volume = targetVol;
              }
            }, fadeMs / steps);
          })
          .catch(e => { console.warn('[AnhadAudio] ❌ Play failed:', e.message); isPlaying = false; isLoading = false; isPlayLocked = false; if (playLockTimeoutId) { clearTimeout(playLockTimeoutId); playLockTimeoutId = null; } emit('statechange', getPublicState());
            // Retry on next user interaction (same pattern as live stream)
            var _streamName = streamName;
            var _retryPlaylist = function() {
              document.removeEventListener('click', _retryPlaylist, { capture: true });
              document.removeEventListener('touchend', _retryPlaylist, { capture: true });
              if (window.AnhadAudio && currentStream === _streamName) {
                window.AnhadAudio.play(_streamName);
              }
            };
            document.addEventListener('click', _retryPlaylist, { once: true, capture: true });
            document.addEventListener('touchend', _retryPlaylist, { once: true, capture: true });
          });
        return;
      }

      // ── Virtual-live seek: clamp to real duration ──
      const realDur = Number.isFinite(loadedDuration) && loadedDuration > 60 ? loadedDuration : null;
      let seekPos = requestedPosition;

      // Safety clamp: if position somehow exceeds real duration, cap it
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

      // ═══ PLAY PATH ═══
      // Capacitor with seek: mute → play → seek → unmute (avoids hearing 0:00 glitch)
      // PWA / from-beginning: seek → play at full volume

      if (window.Capacitor && seekPos > 2) {
        audio.volume = 0;
        audio.play().then(() => {
          isPlaying = true;
          isLoading = false;
          emit('statechange', getPublicState());

          const doCapacitorSeek = () => {
            if (requestId !== playRequestId || currentStream !== streamName) return;
            performSeek(true);
            setTimeout(() => { audio.volume = 0.8; }, 150);
            console.log(`[AnhadAudio] ▶️ Capacitor: Seeked to ${Math.floor(seekPos)}s (${reason})`);
          };
          if (audio.readyState >= 2) {
            doCapacitorSeek();
          } else {
            audio.addEventListener('playing', doCapacitorSeek, { once: true });
          }
        }).catch(e => {
          audio.volume = 0.8;
          isPlaying = false;
          isLoading = false;
          emit('statechange', getPublicState());
          console.warn('[AnhadAudio] ❌ Play failed:', e.message);
        });
        // Safety: always restore volume after 5s
        setTimeout(() => { if (audio && audio.volume < 0.1) audio.volume = 0.8; }, 5000);
      } else {
        const seeked = performSeek(false);

        // If duration is still unknown on timeout/forced path, defer play
        // until loadedmetadata arrives — otherwise play() throws "interrupted
        // by a new load request" because the audio element has no data.
        if (!seeked && (reason === 'timeout' || reason === 'forced')) {
          console.warn(`[AnhadAudio] ⏰ Duration still unknown (${reason}), deferring play until metadata loads`);
          audio.addEventListener('loadedmetadata', () => {
            if (requestId !== playRequestId || currentStream !== streamName) return;
            reportTrackDuration();
            const seeked2 = performSeek(false);
            const fromStart = requestedPosition < 2;
            if (fromStart) { audio.volume = 0; } else { audio.volume = 0.8; }
            audio.play().then(() => {
              isPlaying = true;
              isLoading = false;
              emit('statechange', getPublicState());
              console.log(`[AnhadAudio] ▶️ Playing from ${Math.floor(audio.currentTime)}s (deferred)`);
              if (fromStart) {
                const targetVol = 0.8;
                const fadeMs = 2000;
                const steps = 20;
                let step = 0;
                const interval = setInterval(() => {
                  step++;
                  if (audio) { audio.volume = targetVol * (step / steps); }
                  if (step >= steps) { clearInterval(interval); if (audio) audio.volume = targetVol; }
                }, fadeMs / steps);
              }
            }).catch(e => {
              console.warn('[AnhadAudio] ❌ Deferred play failed:', e.message);
              isPlaying = false;
              isLoading = false;
              emit('statechange', getPublicState());
            });
          }, { once: true });
          return;
        }

        const isFromBeginning = seekPos <= 2;
        if (isFromBeginning) {
          audio.volume = 0;
        } else {
          audio.volume = 0.8;
        }

        audio.play().then(() => {
          isPlaying = true;
          isLoading = false;
          emit('statechange', getPublicState());
          console.log(`[AnhadAudio] ▶️ Playing from ${Math.floor(audio.currentTime)}s (${reason})`);

          if (isFromBeginning) {
            const targetVol = 0.8;
            const fadeMs = 2000;
            const steps = 20;
            let step = 0;
            const interval = setInterval(() => {
              step++;
              if (audio) {
                audio.volume = targetVol * (step / steps);
              }
              if (step >= steps) {
                clearInterval(interval);
                if (audio) audio.volume = targetVol;
              }
            }, fadeMs / steps);
          }
        }).catch(e => {
          console.warn('[AnhadAudio] ❌ Play failed:', e.message);
          isPlaying = false;
          isLoading = false;
          emit('statechange', getPublicState());
        });
      }
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
      // 25-second hard timeout — CDN sometimes takes long to respond
      setTimeout(() => {
        if (!seekAndPlayCalled && requestId === playRequestId) {
          if (audio.readyState >= 1) {
            console.warn(`[AnhadAudio] ⏰ 25s metadata timeout (readyState: ${audio.readyState}), metadata arrived late`);
            doSeekAndPlay('timeout');
          } else {
            console.warn(`[AnhadAudio] ⏰ 25s metadata timeout (readyState: ${audio.readyState}), waiting for loadedmetadata...`);
            audio.addEventListener('loadedmetadata', () => {
              if (!seekAndPlayCalled && requestId === playRequestId) doSeekAndPlay('loadedmetadata');
            }, { once: true });
            // Final safety — force play after another 20s (45s total)
            setTimeout(() => {
              if (!seekAndPlayCalled && requestId === playRequestId) {
                console.warn(`[AnhadAudio] ⏰ Final 45s timeout, forcing play`);
                doSeekAndPlay('forced');
              }
            }, 20000);
          }
        }
      }, 25000);
    }
  }

  async function play(streamName) {
    // NUCLEAR GUARD: Never start playback on cached SPA return
    if (window._ANHAD_SKIP_AUDIO_INIT) {
      console.log('[AnhadAudio] 🚫 play() blocked by _ANHAD_SKIP_AUDIO_INIT');
      return;
    }
    if (!streamName) streamName = currentStream || 'darbar';
    if (!STREAMS[streamName]) {
      console.error('[AnhadAudio] Unknown stream:', streamName);
      return;
    }

    // BUGFIX: When the user explicitly requests a stream that is already loading,
    // wait for the current load to complete instead of dropping their request.
    // This prevents the "play blocked" scenario when autoResume is active.
    if (isPlayLocked && streamName === currentStream) {
      if (audio && !audio.paused && !audio.ended) {
        console.log('[AnhadAudio] ⚡ play() — already playing stream:', streamName);
        return;
      }
      // Wait for the current play cycle to finish (lock clears via 'playing' event or timeout)
      console.log('[AnhadAudio] ⏳ play() deferred — waiting for current load of:', streamName);
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (!isPlayLocked || (audio && !audio.paused)) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
        setTimeout(() => { clearInterval(interval); resolve(); }, 20000);
      });
      // If it's now playing the requested stream, we're done
      if (currentStream === streamName && audio && !audio.paused) return;
      // Otherwise, clear stale state and proceed with fresh play
      isPlayLocked = false;
      if (playLockTimeoutId) { clearTimeout(playLockTimeoutId); playLockTimeoutId = null; }
    }

    initAudioElement();
    const requestId = ++playRequestId;
    currentStream = streamName;
    const stream = STREAMS[streamName];

    if (navigator.onLine === false) {
      console.warn('[AnhadAudio] Offline; streaming playback skipped');
      manualPauseUntil = 0;
      isPlaying = false;
      isLoading = false;
      isPlayLocked = false;
      emit('loading', { isLoading: false });
      emit('statechange', getPublicState());
      return;
    }

    isPlayLocked = true; // Lock: cleared when 'playing' fires or on error
    isLoading = true;
    emit('loading', { isLoading: true });
    emit('statechange', getPublicState());

    // Pause any competing page-level audio elements
    killCompetingAudio();

    // Auto-unlock after 15s in case something goes wrong and 'playing' never fires.
    // IMPORTANT: do NOT clear this immediately; it must remain active until playback succeeds or fails.
    if (playLockTimeoutId) clearTimeout(playLockTimeoutId);
    playLockTimeoutId = setTimeout(() => {
      isPlayLocked = false;
      playLockTimeoutId = null;
      console.warn('[AnhadAudio] ⏱️ play() lock auto-unlocked after timeout');
      emit('statechange', getPublicState());
    }, 15000);

    try {
      if (stream.type === 'live') {
        // ── DARBAR LIVE ──
        // Capacitor: try SGPC directly (fastest, no Render middleman)
        // Fallback: Render proxy for CORS/port compatibility
        const baseUrl = (window.Capacitor && streamName === 'darbar')
          ? SGPC_LIVE
          : stream.url;
        const freshUrl = stream.skipCacheBuster
          ? baseUrl
          : (baseUrl + (baseUrl.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 5000) * 5000);
        console.log('[AnhadAudio] 🔴 LIVE: ' + freshUrl);
        audio.src = freshUrl;
        lastLoadedAt = Date.now(); // Track when we started loading
        // NOTE: Do NOT call audio.load() here — setting audio.src already resets the element.
        // Calling audio.load() before audio.play() fires a 'pause' event that (when isLoading=true)
        // gets suppressed, leaving isPlayLocked stuck. It also breaks the iOS user gesture chain.
        try {
          await audio.play();
        } catch (e) {
          console.warn('[AnhadAudio] ❌ Autoplay blocked:', e.message);
          isPlaying = false;
          isLoading = false;
          isPlayLocked = false;
          if (playLockTimeoutId) { clearTimeout(playLockTimeoutId); playLockTimeoutId = null; }
          
          emit('statechange', getPublicState());
          
          // Retry on next user interaction
          const retryPlay = function() {
            document.removeEventListener('click', retryPlay, { capture: true });
            document.removeEventListener('touchend', retryPlay, { capture: true });
            if (currentStream === streamName) {
              audio.src = freshUrl;
              audio.play().catch(function(){});
            }
          };
          document.addEventListener('click', retryPlay, { once: true, capture: true });
          document.addEventListener('touchend', retryPlay, { once: true, capture: true });
        }

      } else if (stream.type === 'playlist') {
        // ── PLAYLIST (Amritvela / Simran) ──
        
        // BUGFIX Task 4.3: Check pause anchor in play() function
        // Requirements: 2.4, 2.5
        // If pauseAnchor exists and valid (<30min old), resume from anchor position.
        // Otherwise clear and sync to live.
        const PAUSE_ANCHOR_TTL_MS = 30 * 60 * 1000; // 30 minutes
        if (pauseAnchor && 
            pauseAnchor.trackIndex !== undefined &&
            pauseAnchor.position !== undefined &&
            (Date.now() - pauseAnchor.timestamp) < PAUSE_ANCHOR_TTL_MS) {
          
          console.log(`[Resume] From pause anchor: Track ${pauseAnchor.trackIndex + 1} @ ${Math.floor(pauseAnchor.position)}s (${Math.round((Date.now() - pauseAnchor.timestamp) / 1000)}s ago)`);
          
          // Resume from anchor position instead of syncing to live
          const anchorPos = {
            trackIndex: pauseAnchor.trackIndex,
            position: pauseAnchor.position,
            shufflePosition: pauseAnchor.shufflePosition || 0
          };
          loadPlaylistPosition(streamName, anchorPos, requestId);
          
          // Fetch server data in background to update duration cache and live offset anchor
          getServerLivePosition().catch(() => { });
          
        } else {
          // No valid pause anchor — clear it and sync to live server position
          if (pauseAnchor) {
            console.log(`[Resume] Pause anchor expired or invalid, syncing to live`);
            pauseAnchor = null;
          }
          
          // REFRESH-RESUME LOGIC:
          // If the user refreshed within 15 minutes and was on the same stream,
          // restore their exact position instead of snapping to the live edge.
          // They can click LIVE to jump back. This prevents the jarring track-change
          // that happens when the server is at a different position than where they left off.
          const saved = loadState();
          const savedAgeMs = Date.now() - (saved && saved.timestamp || 0);
          const isRecentRefresh = savedAgeMs < 15 * 60 * 1000; // 15 minutes
          const isSameStream = saved && saved.stream === streamName;
          const hasSavedPosition = saved && typeof saved.currentTime === 'number' && saved.currentTime > 5;

          // PERF FIX: Virtual live joins the UTC live position on load; pause/resume is the only DVR-like path.
          if (false && isRecentRefresh && isSameStream && hasSavedPosition) {
            // Restore saved position — don't snap to live
            console.log(`[AnhadAudio] 🔄 Refresh-resume: stream=${streamName} track=${saved.trackIndex} at ${Math.floor(saved.currentTime)}s (${Math.round(savedAgeMs / 1000)}s ago)`);
            const restoredPos = {
              trackIndex: saved.trackIndex || 0,
              position: saved.currentTime,
              shufflePosition: saved.shufflePosition || 0
            };
            loadPlaylistPosition(streamName, restoredPos, requestId);
            // Fetch server data in background to update duration cache and live offset anchor
            getServerLivePosition().catch(() => { });
          } else {
            // New session or too old — sync to live server position
            try {
              const pos = await getServerLivePosition();
              loadPlaylistPosition(streamName, pos, requestId);
            } catch (e) {
              console.error('[AnhadAudio] Playlist sync failed:', e);
              const local = getLocalLivePosition();
              loadPlaylistPosition(streamName, local, requestId);
            }
          }
        }
      }
    } finally {
      // no-op: playLockTimeoutId is cleared by success (playing) or failure (error/autounlock)
    }

    saveState();
    emit('statechange', getPublicState());
  }

  function pause() {
    manualPauseUntil = Date.now() + 5000;
    isPlaying = false;
    isLoading = false;
    isPlayLocked = false;
    
    // BUGFIX Task 4.2: Save pause anchor for pause/resume position preservation
    // Requirements: 2.4, 2.5
    if (audio && currentStream && STREAMS[currentStream] && STREAMS[currentStream].type === 'playlist') {
      pauseAnchor = {
        trackIndex: currentTrackIndex,
        position: audio.currentTime,
        timestamp: Date.now()
      };
      console.log(`[Pause] Anchored at Track ${currentTrackIndex + 1} @ ${Math.floor(audio.currentTime)}s`);
    }
    
    emit('loading', { isLoading: false });
    emit('statechange', getPublicState());
    window.dispatchEvent(new CustomEvent('anhadAudioStateChange', {
      detail: { isPlaying: false, stream: currentStream }
    }));
    if (audio && !audio.paused) {
      audio.pause();
    }
  }

  async function resume() {
    // NUCLEAR GUARD: Never resume audio on cached SPA return
    if (window._ANHAD_SKIP_AUDIO_INIT) {
      console.log('[AnhadAudio] 🚫 resume() blocked by _ANHAD_SKIP_AUDIO_INIT');
      return;
    }
    initAudioElement();
    // NUCLEAR GUARD: If audio src is a silent WAV (unlock only), do NOT resume
    if (audio && audio.src && audio.src.startsWith('data:audio/wav;base64,')) {
      console.log('[AnhadAudio] 🚫 resume() blocked — audio is WAV unlock only');
      return;
    }
    if (audio && audio.src && !audio.paused && currentStream) {
      console.log('[AnhadAudio] Resume ignored; audio is already playing');
      return;
    }
    if (audio && audio.src && audio.paused && currentStream) {
      // CAPACITOR FIX: On cached return, audio may show as paused but shouldn't be resumed
      // automagically — prevents native AudioService re-sync lag chain
      console.log('[AnhadAudio] Resuming existing stream in-place');
      try {
        isLoading = true;
        emit('loading', { isLoading: true });
        await audio.play();
        return;
      } catch (e) {
        console.warn('[AnhadAudio] In-place resume failed:', e.message);
      } finally {
        isLoading = false;
        emit('loading', { isLoading: false });
      }
    }

    if (currentStream && STREAMS[currentStream] && STREAMS[currentStream].type === 'playlist') {
      console.log('[AnhadAudio] No loaded source for playlist, rejoining live timeline');
      await play(currentStream);
      return;
    }

    console.log('[AnhadAudio] No loaded audio to resume, joining live stream');
    await play(currentStream || 'darbar');
  }

  async function toggle(streamName) {
    // NUCLEAR GUARD: Never toggle audio on cached SPA return
    if (window._ANHAD_SKIP_AUDIO_INIT) {
      console.log('[AnhadAudio] 🚫 toggle() blocked by _ANHAD_SKIP_AUDIO_INIT');
      return;
    }
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
    // Clear pause anchor - user explicitly wants live edge
    pauseAnchor = null;
    console.log('[JumpToLive] Cleared pause anchor');
    
    if (!currentStream) currentStream = 'darbar';
    const stream = STREAMS[currentStream];
    if (stream && stream.type === 'playlist' && isPlaying && audio && audio.readyState >= 2) {
      try {
        const pos = await getServerLivePosition();
        if (pos && pos.trackIndex === currentTrackIndex) {
          const duration = Number(audio.duration);
          const maxSeek = Number.isFinite(duration) && duration > 1 ? duration - 1 : pos.position;
          const target = Math.max(0, Math.min(pos.position, maxSeek));
          audio.currentTime = target;
          watchdogGraceUntil = Date.now() + 30000;
          lastWatchTime = target;
          stalledWatchTicks = 0;
          console.log(`[AnhadAudio] ⏩ Jump to live (optimized seek) → ${Math.floor(target)}s`);
          emit('statechange', getPublicState());
          return;
        }
      } catch (e) {
        console.warn('[AnhadAudio] jumpToLive optimized check failed:', e.message);
      }
    }
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
   * Advance to the next track in the shuffled playlist WITH server synchronization.
   * This ensures true virtual live sync - all devices hear the same position.
   * Like buses: the server timeline runs continuously regardless of listeners.
   */
  async function advanceToNextTrack() {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return;
    if (trackTransitionInProgress) return;
    trackTransitionInProgress = true;

    // PERF FIX: Virtual-live track endings advance locally to the next ordered track.
    // A fresh UTC sync happens only when the user taps Jump to Live.
    const orderedStream = STREAMS[currentStream];
    if (orderedStream && orderedStream.type === 'playlist') {
      const nextIndex = (currentTrackIndex + 1) % orderedStream.totalTracks;
      const requestId = ++playRequestId;
      const advancedStream = currentStream;
      currentTrackIndex = nextIndex;
      currentShufflePosition = nextIndex;
      loadPlaylistPosition(advancedStream, {
        trackIndex: nextIndex,
        position: 0,
        shufflePosition: nextIndex,
        trackDuration: getCachedTrackDuration(advancedStream, nextIndex)
      }, requestId);
      setTimeout(() => { trackTransitionInProgress = false; }, 3000);
      return;
    }

    try {
      const stream = STREAMS[currentStream];
      if (!stream || !audio) { trackTransitionInProgress = false; return; }

      // SEAMLESS ADVANCE FIX:
      // When a track ends, asking the server immediately is WRONG — the server may still
      // report the just-ended track near position 0 (it hasn't advanced its internal clock yet).
      // Instead: advance locally to the NEXT shuffle position at position 0 for an instant
      // seamless transition, then do a corrective server sync after 10 seconds.
      const epoch = getBroadcastEpoch(currentStream) || 1704067200000;
      const totalTracks = stream.totalTracks || 40;
      const defaultDur = stream.defaultTrackDuration || 3600;
      const fixedTotal = totalTracks * defaultDur;
      const elapsedSeconds = (Date.now() - epoch) / 1000;
      const cycle = Math.floor(elapsedSeconds / fixedTotal);
      const shuffleOrder = regenerateShuffleOrder(epoch, cycle, totalTracks);

      let posInShuffle = shuffleOrder.indexOf(currentTrackIndex);
      if (posInShuffle === -1) posInShuffle = currentShufflePosition;
      const nextPosInShuffle = (posInShuffle + 1) % totalTracks;
      const nextTrackIndex = shuffleOrder[nextPosInShuffle];

      currentTrackIndex = nextTrackIndex;
      currentShufflePosition = nextPosInShuffle;
      window.__anhadFallbackAttempts = 0; // Reset on natural track advance

      console.log(`[AnhadAudio] ⏭️ Seamless local advance: shuffle pos ${posInShuffle}→${nextPosInShuffle}, track ${nextTrackIndex + 1}`);

      const requestId = ++playRequestId;
      const advancedStream = currentStream;
      loadPlaylistPosition(advancedStream, {
        trackIndex: nextTrackIndex,
        position: 0, // Start from beginning for instant seamless playback
        shufflePosition: nextPosInShuffle
      }, requestId);

      // Corrective server sync after 10s — aligns all devices to the true live position
      // without interrupting the just-started track playback
      setTimeout(async () => {
        if (!isPlaying || currentStream !== advancedStream || trackTransitionInProgress) return;
        try {
          const serverPos = await getServerLivePosition();
          if (!serverPos || serverPos.trackIndex == null) return;
          const serverShufflePos = shuffleOrder.indexOf(serverPos.trackIndex);
          const distanceAhead = serverShufflePos >= 0
            ? (serverShufflePos - currentShufflePosition + totalTracks) % totalTracks
            : 0;

          // Only correct if the server is clearly ahead; one-track mismatch is often lag.
          if (serverPos.trackIndex !== currentTrackIndex && distanceAhead >= 2) {
            console.log(`[AnhadAudio] 🔄 Corrective sync: local track ${currentTrackIndex + 1} → server track ${serverPos.trackIndex + 1}`);
            const corrId = ++playRequestId;
            loadPlaylistPosition(advancedStream, {
              trackIndex: serverPos.trackIndex,
              position: serverPos.position,
              shufflePosition: serverPos.shufflePosition
            }, corrId);
          } else if (serverPos.trackIndex !== currentTrackIndex) {
            console.log(`[AnhadAudio] Corrective sync ignored: server mismatch is only ${distanceAhead} shuffle step(s) ahead`);
          } else {
            // Same track, just correct drift if needed (>12s)
            const drift = serverPos.position - (audio ? audio.currentTime : 0);
            if (Math.abs(drift) >= 12 && audio && audio.readyState >= 2) {
              const maxSeek = Number.isFinite(audio.duration) ? audio.duration - 1 : serverPos.position;
              audio.currentTime = Math.max(0, Math.min(serverPos.position, maxSeek));
              watchdogGraceUntil = Date.now() + 30000;
              console.log(`[AnhadAudio] ↔️ Drift corrected by ${Math.round(drift)}s after advance`);
            }
          }
        } catch (e) {
          console.warn('[AnhadAudio] Post-advance server sync failed (non-critical):', e.message);
        }
      }, 10000);

    } catch (e) {
      console.error('[AnhadAudio] advanceToNextTrack failed:', e);
      // Emergency fallback — restart current stream from live
      window.__anhadFallbackAttempts = (window.__anhadFallbackAttempts || 0) + 1;
      if (window.__anhadFallbackAttempts <= 5) {
        setTimeout(() => play(currentStream), 2000);
      } else {
        stop();
      }
    } finally {
      setTimeout(() => { trackTransitionInProgress = false; }, 3000);
    }
  }

  async function playNextTrack() {
    if (!currentStream || STREAMS[currentStream].type !== 'playlist') return;
    // Use local advancement for seamless transitions
    await advanceToNextTrack();
  }

  async function correctLiveDrift() {
    if (!isPlaying || !audio || !currentStream || STREAMS[currentStream] && STREAMS[currentStream].type !== 'playlist') return;
    if (trackTransitionInProgress || isPlayLocked || isLoading) return;
    if (Date.now() - lastLiveDriftCheckAt < 25000) return;
    lastLiveDriftCheckAt = Date.now();

    try {
      const pos = await getServerLivePosition();
      if (!pos || pos.trackIndex == null || !Number.isFinite(pos.position)) return;

      const localTime = Number(audio.currentTime) || 0;
      const drift = pos.position - localTime;

      if (pos.trackIndex !== currentTrackIndex) {
        // CRITICAL: If the user is "behind" but still on the previous track, 
        // don't force them to jump to the new track yet!
        // Let them finish their current track naturally.
        const stream = STREAMS[currentStream];
        if (stream && stream.type === 'playlist') {
          console.log(`[AnhadAudio] Live drift: track mismatch (${currentTrackIndex + 1} vs server ${pos.trackIndex + 1}), but staying at user position (Playlist DVR mode).`);
          emit('statechange', getPublicState());
          return;
        }

        console.log(`[AnhadAudio] Live drift: significant track mismatch ${currentTrackIndex + 1} -> ${pos.trackIndex + 1}, rejoining server timeline`);
        const requestId = ++playRequestId;
        loadPlaylistPosition(currentStream, pos, requestId);
        return;
      }

      if (Math.abs(drift) >= 12 && Math.abs(drift) < 90 && audio.readyState >= 2) {
        const duration = Number(audio.duration);
        const maxSeek = Number.isFinite(duration) && duration > 1 ? duration - 1 : pos.position;
        const target = Math.max(0, Math.min(pos.position, maxSeek));

        // CRITICAL: For playlist streams, don't auto-jump to live!
        // This satisfies requirement: "if -10 sec is there, it would be there throw out till the user click on the live button"
        const stream = STREAMS[currentStream];
        if (stream && stream.type === 'playlist') {
          console.log(`[AnhadAudio] Live drift: behind by ${Math.floor(drift)}s, waiting for manual jump`);
          emit('statechange', getPublicState());
          return;
        }

        audio.currentTime = target;
        watchdogGraceUntil = Date.now() + 30000;
        lastWatchTime = target;
        stalledWatchTicks = 0;
        console.log(`[AnhadAudio] Live drift corrected by ${Math.round(drift)}s`);
      } else if (Math.abs(drift) >= 300) {
        // CRITICAL: Even for large drifts, don't auto-jump if it's a playlist!
        // The user might be intentionally 30min or 1hr behind.
        const stream = STREAMS[currentStream];
        if (stream && stream.type === 'playlist') {
          console.log(`[AnhadAudio] Massive live drift (${Math.round(drift)}s) detected, but staying at user position (Playlist DVR mode).`);
          emit('statechange', getPublicState());
          return;
        }

        console.log(`[AnhadAudio] Massive live drift (${Math.round(drift)}s), rejoining server timeline (Live Stream mode)`);
        const requestId = ++playRequestId;
        loadPlaylistPosition(currentStream, pos, requestId);
      }
    } catch (e) {
      console.warn('[AnhadAudio] Drift correction skipped:', e.message);
    }
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
    // PERF FIX: Persist volume independently so every radio entry restores instantly.
    try { localStorage.setItem('anhad_audio_volume', String(audio.volume)); } catch (e) { }
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
    // For Kirtan streams (amritvela, simran), use stream artwork for all sizes
    // For other streams, use app logo
    const resolvedArt = getArtworkForStream(stream);
    const primaryArt = resolvedArt || resolveAsset('icons/icon-1024x1024.png');

    let artworkList;
    if (resolvedArt) {
      artworkList = [
        { src: resolvedArt, sizes: '72x72', type: 'image/webp' },
        { src: resolvedArt, sizes: '152x152', type: 'image/webp' },
        { src: resolvedArt, sizes: '192x192', type: 'image/webp' },
        { src: resolvedArt, sizes: '512x512', type: 'image/webp' },
        { src: resolvedArt, sizes: '1024x1024', type: 'image/webp' }
      ];
    } else {
      // Use app logo for non-Kirtan streams or fallback
      artworkList = [
        { src: resolveAsset('icons/icon-72x72.png'), sizes: '72x72', type: 'image/png' },
        { src: resolveAsset('icons/icon-152x152.png'), sizes: '152x152', type: 'image/png' },
        { src: resolveAsset('icons/icon-192x192.png'), sizes: '192x192', type: 'image/png' },
        { src: resolveAsset('icons/icon-512x512.png'), sizes: '512x512', type: 'image/png' },
        { src: primaryArt, sizes: '1024x1024', type: 'image/png' }
      ];
    }

    // Show actual track title on lock screen for playlist streams (e.g. Simran track names)
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrackTitle || stream.name,
      artist: currentTrackArtist || stream.subtitle,
      album: 'ANHAD - Gurbani Radio',
      artwork: artworkList
    });

    // PLAY: resume in-place so lock screen play does NOT re-sync to live position
    navigator.mediaSession.setActionHandler('play', () => resumeInPlace());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('stop', () => stop());
    // PREVIOUS = jump to live (server position re-sync)
    navigator.mediaSession.setActionHandler('previoustrack', () => play(currentStream));

    if (stream.type === 'playlist') {
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      });
    } else {
      // Live stream — disable seek/next controls
      try { navigator.mediaSession.setActionHandler('nexttrack', null); } catch (e) { }
      try { navigator.mediaSession.setActionHandler('seekbackward', null); } catch (e) { }
      try { navigator.mediaSession.setActionHandler('seekforward', null); } catch (e) { }
    }

    // Update position state for lock screen seek bar
    if (audio && audio.duration && isFinite(audio.duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate || 1,
          position: audio.currentTime
        });
      } catch (e) { }
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Also expose getLiveOffset on public API (needed by virtual-live-indicator)
    if (window.AnhadAudio) window.AnhadAudio.getLiveOffset = getLiveOffset;
  }

  // ─── INTERVAL CLEANUP ─────────────────────────────────────────────────────
  // All page-lifecycle intervals stored for cleanup on pagehide.
  const _pageIntervals = [];

  // ─── LIVE OFFSET HEARTBEAT — Emits every second while playing ────────────
  // Powers the YouTube-style live indicator on player pages.
  _pageIntervals.push(setInterval(() => {
    if (!isPlaying || !currentStream || !audio) return;
    const stream = STREAMS[currentStream];
    if (!stream || stream.type !== 'playlist') return;
    const drift = getVirtualDrift();
    const offsetSeconds = Math.max(0, Math.round(drift.driftSeconds || 0));
    const isAtLive = offsetSeconds <= 10;

    emit('liveoffset', { offsetSeconds, isAtLive, stream: currentStream, ...drift });
    window.dispatchEvent(new CustomEvent('anhadLiveOffset', {
      detail: { offsetSeconds, isAtLive, stream: currentStream, ...drift }
    }));
  }, 1000));

  _pageIntervals.push(setInterval(() => {
    // PERF FIX: Drift check runs while playing or paused so pause/resume shows "behind live".
    if (!currentStream || !audio || STREAMS[currentStream] && STREAMS[currentStream].type !== 'playlist') return;
    const drift = getVirtualDrift();
    const detail = {
      ...drift,
      stream: currentStream,
      driftSeconds: Math.round(drift.driftSeconds),
      isLive: drift.driftSeconds <= 10
    };
    emit('livedrift', detail);
    window.dispatchEvent(new CustomEvent('anhadLiveDrift', { detail }));
  }, 5000));

  // ─── WAKELOCK: Keep screen alive during playback ─────────────────────────
  let _wakeLock = null;
  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try { _wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { }
  }
  function releaseWakeLock() {
    if (_wakeLock) { try { _wakeLock.release(); } catch (e) { } _wakeLock = null; }
  }

  // ─── FOREGROUND SERVICE: Keep app alive in background for audio ────────
  function startForegroundService() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
        const stream = STREAMS[currentStream];
        window.Capacitor.Plugins.AudioService.start({
          title: stream ? stream.name : 'ANHAD Kirtan',
          artist: stream ? stream.subtitle : 'Playing',
          stream: currentStream || 'darbar'
        }).catch(function (e) {
          // If start fails, reset the flag so it can be retried next time
          foregroundServiceActive = false;
          console.warn('[AudioService] Foreground service start failed:', e);
        });
        console.log('[AudioService] Foreground service STARTED');
      }
    } catch (e) { console.warn('[AudioService] Start failed:', e); }
  }
  function stopForegroundService() {
    foregroundServiceActive = false; // Reset flag so service can start again on next play
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
        window.Capacitor.Plugins.AudioService.stop().catch(function () { });
        console.log('[AudioService] Foreground service STOPPED');
      }
    } catch (e) { }
  }
  function updateForegroundServiceNotification() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
        const stream = STREAMS[currentStream];
        window.Capacitor.Plugins.AudioService.updateNotification({
          title: stream ? stream.name : 'ANHAD Kirtan',
          artist: stream ? stream.subtitle : 'Playing',
          stream: currentStream || 'darbar'
        }).catch(function () { });
      }
    } catch (e) { }
  }
  function syncNativeState(action) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioService) {
        window.Capacitor.Plugins.AudioService.updateState({ action }).catch(function () { });
        console.log('[AudioService] Native state synced:', action);
      }
    } catch (e) { console.warn('[AudioService] State sync failed:', e); }
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
    } catch (e) { }
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
      
      // BUGFIX: Wall clock validation for device sleep/background detection
      // Check if wall clock jumped significantly while tab was hidden
      if (liveSyncAnchor && audio) {
        const wallClockDrift = Math.abs(Date.now() - liveSyncAnchor.wallTime);
        if (wallClockDrift > 60000) {
          console.log(`[Sync] Wall clock jump detected on tab visibility (${Math.floor(wallClockDrift/1000)}s), invalidating cache`);
          liveSyncAnchor = null; // Force fresh sync
          // BUGFIX Task 3.4: Force fresh sync when resuming from background
          if (currentStream && (currentStream === 'amritvela' || currentStream === 'simran')) {
            getServerLivePosition(true).catch(e => console.warn('[AnhadAudio] Force sync on visibility failed:', e));
          }
        } else {
          // Re-anchor the live sync clock after tab was hidden (tab timer may have throttled)
          liveSyncAnchor = {
            wallTime: Date.now(),
            audioTime: audio.currentTime,
            trackIndex: currentTrackIndex
          };
        }
      }
    }
  });

  // BUGFIX Task 3.4: Force fresh sync on network reconnect
  window.addEventListener('online', () => {
    console.log('[AnhadAudio] Network reconnected, forcing fresh sync');
    _syncCache = null;
    _syncCacheAt = 0;
    if (currentStream && (currentStream === 'amritvela' || currentStream === 'simran') && isPlaying) {
      getServerLivePosition(true).then(pos => {
        console.log(`[AnhadAudio] Reconnect sync: Track ${pos.trackIndex + 1} at ${Math.floor(pos.position)}s`);
      }).catch(e => console.warn('[AnhadAudio] Force sync on reconnect failed:', e));
    }
  });

  // Update position state periodically for lock screen seek bar
  _pageIntervals.push(setInterval(() => {
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
      } catch (e) { }
    }
  }, 5000));

  _pageIntervals.push(setInterval(() => {
    correctLiveDrift();
  }, 15000)); // Tighter sync (15s instead of 30s)

  _pageIntervals.push(setInterval(() => {
    if (!isPlaying || !audio || !currentStream || STREAMS[currentStream] && STREAMS[currentStream].type !== 'playlist') return;
    if (trackTransitionInProgress) return; // Don't interfere during a transition

    // ── GRACE PERIOD: Don't stall-detect while CDN is still buffering to seek position ──
    if (Date.now() < watchdogGraceUntil) {
      stalledWatchTicks = 0;
      lastWatchTime = Number(audio.currentTime) || 0;
      return;
    }
    // CAPACITOR FIX: Suppress watchdog for 2 minutes after play() to avoid WebView false stalls
    if (window.Capacitor && Date.now() < capacitorWatchdogGraceUntil) {
      stalledWatchTicks = 0;
      lastWatchTime = Number(audio.currentTime) || 0;
      return;
    }

    const duration = Number(audio.duration);
    const currentTime = Number(audio.currentTime) || 0;

    // Near-end detection: if within 5s of track end and ended hasn't fired yet
    // CRITICAL: Only trigger when duration came from actual metadata (not the 3600s default)
    // and the audio element has actually loaded this track's metadata (readyState >= 1).
    // Without this guard, the watchdog fires prematurely on default durations causing 10s loops.
    if (Number.isFinite(duration) && duration > 60 && duration !== 3600 && currentTime >= duration - 5 && audio.readyState >= 1) {
      const now = Date.now();
      if (now - lastPlaylistEndedAt < 3000) return; // ended handler already handled this
      lastPlaylistEndedAt = now;
      console.log('[AnhadAudio] 🕐 Watchdog: near end of track, advancing with fade-out...');

      // FADE OUT OVER 3 SECONDS BEFORE ADVANCING
      const fadeOutMs = 3000;
      const steps = 15;
      let step = 0;
      const startVol = audio.volume;
      const interval = setInterval(() => {
        step++;
        if (audio) {
          audio.volume = Math.max(0, startVol * (1 - step / steps));
        }
        if (step >= steps) {
          clearInterval(interval);
          advanceToNextTrack();
        }
      }, fadeOutMs / steps);

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
    // CAPACITOR FIX: Raise stall threshold to 6 ticks (90s) for WebView's longer buffering
    const stallThreshold = window.Capacitor ? 6 : 3;

    if (stalledWatchTicks >= stallThreshold) {
      stalledWatchTicks = 0;
      if (Date.now() < foregroundServiceGraceUntil) {
        console.log('[AnhadAudio] ⚡ Watchdog: stall ignored — within foreground service grace window');
        return;
      }
      if (isPlayLocked) {
        console.log('[AnhadAudio] ⚡ Watchdog: stall ignored — play() already in progress');
        return;
      }
      console.warn(`[AnhadAudio] 🔄 Playlist stalled ${stallThreshold * 15}s, re-syncing to live position...`);
      play(currentStream);
    }
  }, 15000));

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-RESUME on page load
  // DISABLED: Causes lag when returning to index.html in Capacitor version
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
    // BUGFIX Task 3.4: Force fresh sync on page load
    setTimeout(() => play(state.stream), 300);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC STATE — Read-only snapshot
  // ═══════════════════════════════════════════════════════════════════════════

  function getLiveOffset() {
    // PERF FIX: Drift is based on the deterministic UTC schedule, not a play-time anchor.
    if (currentStream === 'amritvela' || currentStream === 'simran') {
      const drift = getVirtualDrift();
      return Math.max(0, drift.driftSeconds);
    }
    if (!liveSyncAnchor || (currentStream !== 'amritvela' && currentStream !== 'simran')) return 0;
    if (!audio) return 0;

    // BUGFIX: Wall clock validation for device sleep detection
    // Before using liveSyncAnchor, validate that wall clock hasn't jumped significantly
    // If wall clock drifted >60s, device likely slept/backgrounded - invalidate cache
    const wallClockDrift = Math.abs(Date.now() - liveSyncAnchor.wallTime);
    if (wallClockDrift > 60000) {
      console.log(`[Sync] Wall clock jump detected (${Math.floor(wallClockDrift/1000)}s), invalidating cache`);
      liveSyncAnchor = null;
      return 0; // Force fresh sync by returning 0 drift
    }

    // Expected audio position if we were at the live edge
    const elapsedSinceSync = (Date.now() - liveSyncAnchor.wallTime) / 1000;
    const expectedAudioTime = liveSyncAnchor.audioTime + elapsedSinceSync;

    // Simple offset: expected - actual
    return Math.max(0, expectedAudioTime - audio.currentTime);
  }

  function getVirtualDrift() {
    if (!audio || !currentStream || STREAMS[currentStream] && STREAMS[currentStream].type !== 'playlist') {
      return { driftSeconds: 0, isLive: true };
    }
    const live = computeVirtualLivePosition(currentStream);
    if (!live) {
      return { driftSeconds: 0, isLive: true };
    }
    const userPosition = getTrackAccumulatedStart(currentStream, currentTrackIndex) + (Number(audio.currentTime) || 0);
    const livePosition = Number(live.trackAccumulatedStart || 0) + (Number(live.position) || 0);
    const total = Number(live.totalDuration) || getVirtualTotalDuration(currentStream);
    let driftSeconds = livePosition - userPosition;
    if (driftSeconds < -10 && total > 0) driftSeconds += total;
    if (driftSeconds < 0) driftSeconds = 0;
    return {
      driftSeconds,
      isLive: driftSeconds <= 10,
      liveTrackIndex: live.trackIndex,
      liveSeekTo: live.position,
      userTrackIndex: currentTrackIndex,
      userPosition: Number(audio.currentTime) || 0
    };
  }

  function getPublicState() {
    const stream = currentStream ? STREAMS[currentStream] : null;
    const offset = getLiveOffset();
    const resolvedArtwork = stream ? getArtworkForStream(stream) : '';
    return {
      isPlaying,
      isLoading,
      currentStream,
      currentTrackIndex,
      currentTrackTitle,
      currentTrackArtist,
      liveOffset: offset,
      isBehind: offset > 10,
      streamName: stream && stream.name || '',
      streamSubtitle: stream && stream.subtitle || '',
      streamType: stream && stream.type || '',
      artwork: resolvedArtwork,
      playerPage: stream && stream.playerPage || '',
      volume: audio && audio.volume || 0.8,
      currentTime: audio && audio.currentTime || 0,
      duration: audio && audio.duration || 0,
      pauseAnchor: pauseAnchor  // BUGFIX Task 5.3: Expose pause anchor in master state
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

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPOSE GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════════

  // resumeInPlace: resume paused audio WITHOUT re-syncing to live position.
  // Use this for the play/pause button. Use play() / jumpToLive() to jump to live.
  async function resumeInPlace() {
    initAudioElement();
    // NUCLEAR GUARD: If audio src is a silent WAV (unlock only), do NOT resume
    if (audio && audio.src && audio.src.startsWith('data:audio/wav;base64,')) {
      console.log('[AnhadAudio] 🚫 resumeInPlace() blocked — audio is WAV unlock only');
      return;
    }
    if (!audio || !currentStream) {
      if (currentStream) await play(currentStream);
      return;
    }
    if (!audio.paused) return; // Already playing
    if (!audio.src || audio.src === window.location.href) {
      // Nothing loaded yet — do a full play
      if (currentStream) await play(currentStream);
      return;
    }
    try {
      isLoading = true;
      emit('loading', { isLoading: true });
      await audio.play();
    } catch (e) {
      console.warn('[AnhadAudio] resumeInPlace failed:', e.message);
      isPlaying = false;
      emit('statechange', getPublicState());
    } finally {
      isLoading = false;
      emit('loading', { isLoading: false });
    }
  }

  window.AnhadAudio = {
    _singleton: true,
    play,
    pause,
    resume,
    resumeInPlace,  // NEW: resume without re-syncing — for play/pause button
    toggle,
    stop,
    jumpToLive,
    playNextTrack,
    setVolume,
    getState: getPublicState,
    getAudio: () => audio,
    isPlaying: () => isPlaying,
    getCurrentStream: () => currentStream,
    getCurrentTrackTitle: () => currentTrackTitle,
    getCurrentTrackArtist: () => currentTrackArtist,
    on,
    off,
    STREAMS: Object.keys(STREAMS),
    getStreamInfo: (name) => STREAMS[name] ? { ...STREAMS[name] } : null,
    getLiveOffset,         // Returns seconds behind live edge (0 = at live)
    getLiveDrift: getVirtualDrift,
    getLastTransitionProof: () => lastTransitionProof,
    getLiveSyncAnchor: () => liveSyncAnchor  // Exposed for debugging
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

  // ─── Detect and kill competing audio systems ──────────────────────────────
  function detectAndKillCompetingSystems() {
    // Check for persistent-audio.js legacy system
    if (window.LegacyAnhadAudio && !window.LegacyAnhadAudio._legacy) {
      console.warn('[AnhadAudio] ⚠️ Detected legacy audio system using wrong namespace - forcing cleanup');
    }

    // Check for GlobalMiniPlayer (global-mini-player.js)
    if (window.GlobalMiniPlayer && window.GlobalMiniPlayer.getAudio) {
      const gmpAudio = window.GlobalMiniPlayer.getAudio();
      if (gmpAudio && !gmpAudio.paused) {
        console.warn('[AnhadAudio] ⚠️ Detected active GlobalMiniPlayer - pausing it');
        window.GlobalMiniPlayer.pause();
        window.GlobalMiniPlayer.stop && GlobalMiniPlayer.stop();
      }
      // Unregister from coordinator if registered
      if (window.AudioCoordinator) {
        window.AudioCoordinator.unregister('GlobalMiniPlayer');
      }
    }

    // Check for any orphaned <audio> elements on the page
    document.querySelectorAll('audio').forEach(el => {
      if (el.id !== 'anhad-global-audio' && !el.paused) {
        console.warn('[AnhadAudio] ⚠️ Killing orphaned audio element');
        el.pause();
        el.src = '';
        el.removeAttribute('src');
      }
    });

    // Log detection summary
    console.log('[AnhadAudio] ✅ Competing system check complete');
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  detectAndKillCompetingSystems();
  initAudioElement();
  registerWithCoordinator();

  // Listen for external play requests (from hero cards etc.)
  window.addEventListener('anhadPlayStream', (e) => {
    const stream = e.detail && e.detail.stream;
    if (stream) play(stream);
  });
  window.addEventListener('anhadRequestPlay', (e) => {
    const stream = e.detail && e.detail.stream;
    if (stream) play(stream);
  });

  // Auto-resume after short delay - DISABLED to prevent lag on navigation back to home
  // if (document.readyState === 'loading') {
  //   document.addEventListener('DOMContentLoaded', () => setTimeout(autoResume, 500));
  // } else {
  //   setTimeout(autoResume, 500);
  // }

  console.log('🪯 ANHAD Audio Singleton loaded — ONE audio, ONE truth');
})();
