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
  const RESUME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  const CDN_BASE = 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
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
      playerPage: 'GurbaniRadio/gurbani-radio.html?stream=amritvela',
      getTrackUrl(index) {
        const safeIndex = ((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1;
        return `${CDN_BASE}/day-${safeIndex}.webm?t=${Date.now()}`;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER SYNC — Single source of live position truth
  // ═══════════════════════════════════════════════════════════════════════════

  async function getServerLivePosition() {
    try {
      const t0 = Date.now();
      const url = `${API_BASE}/api/radio/live?t=${Date.now()}&r=${Math.random()}`;
      const resp = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const t1 = Date.now();
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const latency = (t1 - t0) / 2000;

      console.log(`[AnhadAudio] Server sync: Track ${data.trackIndex + 1} at ${Math.floor(data.trackPosition)}s`);
      return {
        trackIndex: data.trackIndex,
        position: data.trackPosition + latency,
        trackTitle: data.trackTitle,
        trackArtist: data.trackArtist,
        listeners: data.listenersCount
      };
    } catch (e) {
      console.warn('[AnhadAudio] Server sync failed, using local fallback:', e.message);
      return getLocalLivePosition();
    }
  }

  function getLocalLivePosition() {
    const EPOCH = 1704067200000; // Jan 1, 2024
    const elapsed = (Date.now() - EPOCH) / 1000;
    const totalDur = 40 * 3600;
    const pos = ((elapsed % totalDur) + totalDur) % totalDur;
    return { trackIndex: Math.floor(pos / 3600), position: pos % 3600 };
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

    // Restore volume from saved state
    const saved = loadState();
    if (saved && saved.volume !== undefined) {
      audio.volume = saved.volume;
    }

    audio.addEventListener('playing', () => {
      isPlaying = true;
      isLoading = false;
      saveState();
      updateMediaSession();
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
      if (currentStream === 'amritvela') {
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
      // Auto-retry after 3 seconds
      setTimeout(() => {
        if (currentStream && !isPlaying) {
          console.log('[AnhadAudio] Auto-retrying after error...');
          play(currentStream);
        }
      }, 3000);
    });

    console.log('[AnhadAudio] ✅ Single audio element created');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE PLAYBACK — The ONLY place audio.src is set
  // ═══════════════════════════════════════════════════════════════════════════

  async function play(streamName) {
    if (!streamName) streamName = currentStream || 'darbar';
    if (!STREAMS[streamName]) {
      console.error('[AnhadAudio] Unknown stream:', streamName);
      return;
    }

    initAudioElement();
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
        currentTrackIndex = pos.trackIndex;
        const freshUrl = stream.getTrackUrl(currentTrackIndex);
        audio.src = freshUrl;
        audio.load();

        console.log(`[AnhadAudio] 🔴 AMRITVELA: Track ${pos.trackIndex + 1} at ${Math.floor(pos.position)}s`);

        const seekAndPlay = () => {
          const dur = audio.duration || 3600;
          const seekPos = Math.min(pos.position, dur - 5);
          if (seekPos > 2) {
            audio.currentTime = seekPos;
            console.log(`[AnhadAudio] ✅ Seeked to ${Math.floor(seekPos)}s`);
          }
          audio.play().catch(e => {
            console.warn('[AnhadAudio] Play failed:', e.message);
            isPlaying = false;
            isLoading = false;
            emit('statechange', getPublicState());
          });
        };

        if (audio.readyState >= 2) {
          seekAndPlay();
        } else {
          audio.addEventListener('canplay', seekAndPlay, { once: true });
        }
      } catch (e) {
        console.error('[AnhadAudio] Amritvela sync failed:', e);
        // Fallback
        const local = getLocalLivePosition();
        currentTrackIndex = local.trackIndex;
        audio.src = stream.getTrackUrl(currentTrackIndex);
        audio.load();
        try { await audio.play(); } catch (err) {}
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
    if (!('mediaSession' in navigator) || !currentStream) return;
    const stream = STREAMS[currentStream];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: stream.name,
      artist: stream.subtitle,
      album: 'ANHAD',
      artwork: [{ src: stream.artwork, sizes: '512x512', type: 'image/webp' }]
    });

    navigator.mediaSession.setActionHandler('play', () => play(currentStream));
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('stop', () => stop());
    if (stream.type === 'playlist') {
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
    }
  }

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
    if (state.stream === 'amritvela') return;

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
