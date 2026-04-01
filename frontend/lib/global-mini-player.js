/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GLOBAL MINI-PLAYER — Persistent Audio Across ALL Pages
 *
 * Self-contained system that:
 * 1. Creates its own <audio> element
 * 2. Reads saved state from localStorage on EVERY page load
 * 3. Resumes audio instantly (near zero-gap thanks to HTTP cache)
 * 4. Injects a floating mini-player UI on every page
 * 5. Saves state on pagehide for seamless continuity
 *
 * Drop this script on ANY page to get persistent audio.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const STATE_KEY = 'anhad_global_audio';
  const RESUME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  // ─── Compute base path from our own script src ─────────────────────────────
  // Works with file://, http://localhost, Vercel, any subdirectory depth.
  const GMP_BASE = (function () {
    try {
      const all = document.querySelectorAll('script[src]');
      for (let i = 0; i < all.length; i++) {
        const s = all[i].src || '';
        if (s.includes('global-mini-player')) {
          return s.replace(/lib\/global-mini-player\.js[^/]*$/, '');
        }
      }
    } catch (e) {}
    return '';
  })();

  function resolveAsset(filename) {
    return GMP_BASE ? GMP_BASE + 'assets/' + filename : 'assets/' + filename;
  }

  const STREAMS = {
    darbar: {
      name: 'Darbar Sahib Live',
      subtitle: 'Sri Harmandir Sahib Ji',
      url: 'https://live.sgpc.net:8443/;nocache=1',
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
        const base = getAudioBase();
        // CRITICAL FIX: Add cache buster to prevent browser audio caching
        return `${base}/day-${((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1}.webm?t=${Date.now()}`;
      }
    }
  };

  // RENDER_BASE kept for legacy reference; API_BASE below does smart resolution
  const RENDER_BASE = 'https://anhad-final.onrender.com';

  function getAudioBase() {
    return 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
  }

  // Smart API URL resolution for CORS and mobile apps
  const API_BASE = (() => {
    try {
        // For Capacitor apps, always use production URL
        if (window.Capacitor) return 'https://anhad-final.onrender.com';
        
        const host = window.location.hostname;
        const port = window.location.port;
        if (port === '3000' || port === '3001') return '';
        if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
        return 'https://anhad-final.onrender.com';
    } catch(e){}
    return 'https://anhad-final.onrender.com';
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  function loadState() {
    try {
      const s = localStorage.getItem(STATE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  function saveState(data) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (e) { }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER SYNC (for playlist position)
  // ═══════════════════════════════════════════════════════════════════════════

  let lastSyncTime = 0;
  let cachedPosition = null;
  const SYNC_CACHE_TTL = 3000; // Only cache for 3 seconds

  async function getServerLivePosition(forceRefresh = false) {
    // Use cache only if fresh AND not forcing refresh
    if (!forceRefresh && cachedPosition && (Date.now() - lastSyncTime) < SYNC_CACHE_TTL) {
      const elapsedSinceSync = (Date.now() - lastSyncTime) / 1000;
      return {
        trackIndex: cachedPosition.trackIndex,
        position: cachedPosition.position + elapsedSinceSync
      };
    }

    try {
      const t0 = Date.now();
      const resp = await fetch(`${API_BASE}/api/radio/live`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const t1 = Date.now();
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const latency = (t1 - t0) / 2000;
      
      // Update cache
      cachedPosition = {
        trackIndex: data.trackIndex,
        position: data.trackPosition + latency
      };
      lastSyncTime = Date.now();
      
      console.log(`[GMP] Server sync: Track ${data.trackIndex + 1} at ${Math.floor(cachedPosition.position)}s`);
      
      return {
        trackIndex: cachedPosition.trackIndex,
        position: cachedPosition.position
      };
    } catch (e) {
      console.warn('[GMP] Server sync failed, using local calculation:', e.message);
      return getLocalLivePosition();
    }
  }

  // Universal timeline fallback
  function getLocalLivePosition() {
    const UNIVERSAL_EPOCH = 1704067200000; // Jan 1, 2024
    const elapsed = (Date.now() - UNIVERSAL_EPOCH) / 1000;
    const totalDur = 40 * 3600;
    const pos = ((elapsed % totalDur) + totalDur) % totalDur;
    return { trackIndex: Math.floor(pos / 3600), position: pos % 3600 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SKIP PLAYER PAGES — Don't double up
  // ═══════════════════════════════════════════════════════════════════════════

  const currentPath = window.location.pathname.toLowerCase();
  const isPlayerPage = currentPath.includes('gurbani-radio');

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  let audio = null;
  let currentStream = 'darbar';
  let currentTrackIndex = 0;
  let isPlaying = false;
  let miniPlayerEl = null;

  function createAudio() {
    // CRITICAL FIX: Always create NEW audio element to avoid cached position
    if (audio) {
      // Kill old audio completely - remove ALL event listeners
      const oldAudio = audio;
      oldAudio.pause();
      oldAudio.src = '';
      oldAudio.removeAttribute('src');
      oldAudio.load();
      // Remove from DOM if attached
      if (oldAudio.parentNode) oldAudio.parentNode.removeChild(oldAudio);
      audio = null;
    }
    
    audio = new Audio();
    audio.preload = 'none'; // CRITICAL: Don't preload to avoid caching
    audio.volume = 0.8;

    audio.addEventListener('playing', () => {
      isPlaying = true;
      // Notify coordinator that we're playing
      if (window.AudioCoordinator) {
        window.AudioCoordinator.requestPlay('GlobalMiniPlayer');
      }
      persistState();
      updateMiniPlayerUI();
      updateMediaSession();
      
      // Notify KirtanListeningTracker
      window.dispatchEvent(new CustomEvent('anhadaudiostatechange', { detail: { isPlaying: true } }));
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
      // Notify coordinator that we paused
      if (window.AudioCoordinator) {
        window.AudioCoordinator.notifyPause('GlobalMiniPlayer');
      }
      persistState();
      updateMiniPlayerUI();
      
      // Notify KirtanListeningTracker
      window.dispatchEvent(new CustomEvent('anhadaudiostatechange', { detail: { isPlaying: false } }));
    });

    audio.addEventListener('ended', () => {
      if (STREAMS[currentStream].type === 'playlist') {
        playNextTrack();
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio || !audio.duration || !isFinite(audio.duration)) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      const fill = miniPlayerEl?.querySelector('.gmp__progress-fill');
      if (fill) fill.style.width = pct + '%';
    });

    audio.addEventListener('error', () => {
      isPlaying = false;
      updateMiniPlayerUI();
      showGmpToast('Kirtan unavailable — check connection');
      setTimeout(() => resumePlayback(), 3000);
    });

    return audio;
  }

  function persistState() {
    // CRITICAL: Don't save position for playlist streams - always jump to live
    // Only save the stream type and playing state
    saveState({
      isPlaying,
      stream: currentStream,
      volume: audio ? audio.volume : 0.8
      // Removed: trackIndex, currentTime, duration - these cause stale position issues
    });
  }

  async function playStream(streamName) {
    // CRITICAL: Create fresh audio element EVERY time to avoid cache
    createAudio();
    
    // Notify AudioCoordinator BEFORE playing to pause other players
    if (window.AudioCoordinator) {
      window.AudioCoordinator.requestPlay('GlobalMiniPlayer');
    }
    
    currentStream = streamName;
    const stream = STREAMS[streamName];

    if (stream.type === 'live') {
      // CRITICAL FIX: Add cache buster AND disable caching headers
      const freshUrl = stream.url + (stream.url.includes('?') ? '&' : '?') + 't=' + Date.now() + '&nocache=' + Math.random();
      console.log('[GMP] 🔴 LIVE: Loading fresh stream:', freshUrl);
      audio.src = freshUrl;
      audio.load(); // Force reload
      try { await audio.play(); } catch (e) { console.warn('[GMP] Autoplay blocked'); }
    } else if (stream.type === 'playlist') {
      // CRITICAL FIX: ALWAYS fetch fresh server position
      try {
        const pos = await getServerLivePosition(true); // Force fresh sync
        currentTrackIndex = pos.trackIndex;
        const freshUrl = stream.getTrackUrl(currentTrackIndex) + '&r=' + Math.random();
        audio.src = freshUrl;
        audio.load(); // Force reload to avoid cache
        console.log(`[GMP] 🔴 LIVE: Track ${pos.trackIndex + 1} at ${Math.floor(pos.position)}s`);

        // CRITICAL FIX: Wait for canplay before seeking and playing
        const seekAndPlay = () => {
          const dur = audio.duration || 3600;
          const seekPos = Math.min(pos.position, dur - 5);
          console.log(`[GMP] 🎯 Seeking to ${Math.floor(seekPos)}s (duration: ${Math.floor(dur)}s)`);
          audio.currentTime = seekPos;
          // Small delay to ensure seek takes effect
          setTimeout(() => {
            console.log(`[GMP] ✅ Playing from ${Math.floor(audio.currentTime)}s`);
            audio.play().catch(() => {});
          }, 100);
        };
        
        if (audio.readyState >= 2) {
          // HAVE_ENOUGH_DATA - seek immediately
          seekAndPlay();
        } else {
          // Wait until we can play
          audio.addEventListener('canplay', seekAndPlay, { once: true });
        }
      } catch (e) {
        console.error('[GMP] Failed to get live position:', e);
        // Fallback to local calculation
        const localPos = getLocalLivePosition();
        currentTrackIndex = localPos.trackIndex;
        const freshUrl = stream.getTrackUrl(currentTrackIndex) + '&r=' + Math.random();
        audio.src = freshUrl;
        audio.load(); // Force reload
        console.log(`[GMP] Using fallback: Track ${localPos.trackIndex + 1} at ${Math.floor(localPos.position)}s`);
        // CRITICAL FIX: Wait for canplay before seeking and playing
        const seekAndPlay = () => {
          const dur = audio.duration || 3600;
          const seekPos = Math.min(localPos.position, dur - 5);
          console.log(`[GMP] 🎯 Fallback seeking to ${Math.floor(seekPos)}s (duration: ${Math.floor(dur)}s)`);
          audio.currentTime = seekPos;
          // Small delay to ensure seek takes effect
          setTimeout(() => {
            console.log(`[GMP] ✅ Fallback playing from ${Math.floor(audio.currentTime)}s`);
            audio.play().catch(() => {});
          }, 100);
        };
        
        if (audio.readyState >= 2) {
          // HAVE_ENOUGH_DATA - seek immediately
          seekAndPlay();
        } else {
          // Wait until we can play
          audio.addEventListener('canplay', seekAndPlay, { once: true });
        }
      }
    }

    persistState();
    updateMiniPlayerUI();
  }

  async function playNextTrack() {
    const stream = STREAMS[currentStream];
    if (stream.type !== 'playlist') return;
    
    // CRITICAL: Create fresh audio element to avoid cache
    createAudio();
    
    // For Virtual Live, don't just increment. Always resync with the server
    // so drift is corrected perfectly on every track boundary.
    const pos = await getServerLivePosition(true); // Force fresh sync
    currentTrackIndex = pos.trackIndex;
    const freshUrl = stream.getTrackUrl(currentTrackIndex) + '&r=' + Math.random();
    audio.src = freshUrl;
    audio.load(); // Force reload
    console.log(`[GMP] 🔴 NEXT TRACK (LIVE): Track ${pos.trackIndex + 1}`);
    
    audio.addEventListener('loadedmetadata', function seek() {
      audio.removeEventListener('loadedmetadata', seek);
      const dur = audio.duration || 3600;
      audio.currentTime = Math.min(pos.position, dur - 5);
    }, { once: true });
    // FIX: If already loaded, seek immediately
    if (audio.readyState >= 1) {
      const dur = audio.duration || 3600;
      audio.currentTime = Math.min(pos.position, dur - 5);
    }
    
    try { await audio.play(); } catch (e) { }
    persistState();
  }

  async function togglePlayPause() {
    if (!audio || !audio.src || audio.src === window.location.href) {
      // Nothing loaded — start darbar by default
      playStream(currentStream);
      return;
    }
    if (audio.paused) {
      // CRITICAL FIX: ALWAYS recreate audio and jump to live - NO CACHE
      if (STREAMS[currentStream].type === 'playlist') {
        console.log('[GMP] 🔴 RECREATING AUDIO FOR LIVE PLAYBACK');
        playStream(currentStream); // This will fetch fresh position and create new audio
      } else {
        // Live stream - RECREATE audio element to force fresh connection
        console.log('[GMP] 🔴 RECREATING AUDIO FOR LIVE STREAM');
        playStream(currentStream); // This will create fresh audio with cache buster
      }
    } else {
      audio.pause();
    }
  }

  function stopAudio() {
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    isPlaying = false;
    currentStream = null; // Clear current stream so mini player hides
    saveState({ isPlaying: false, stream: null, trackIndex: 0, volume: audio?.volume || 0.8, currentTime: 0 });
    updateMiniPlayerUI();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-RESUME ON PAGE LOAD
  // ═══════════════════════════════════════════════════════════════════════════

  async function resumePlayback() {
    const state = loadState();
    if (!state || !state.isPlaying || !state.stream) return; // Don't resume if no stream (user closed it)
    if (Date.now() - (state.timestamp || 0) > RESUME_THRESHOLD_MS) return;

    // Don't resume on player pages — those have their own audio
    if (isPlayerPage) return;

    currentStream = state.stream;
    // CRITICAL: Don't use saved trackIndex - always fetch live position

    createAudio();
    audio.volume = state.volume || 0.8;

    const stream = STREAMS[currentStream];
    if (!stream) return;

    if (stream.type === 'live') {
      // CRITICAL FIX: Add multiple cache busters to force fresh live connection
      const freshUrl = stream.url + (stream.url.includes('?') ? '&' : '?') + 't=' + Date.now() + '&nocache=' + Math.random();
      audio.src = freshUrl;
      audio.load(); // Force reload
      console.log(`[GMP] 🔴 RESUMING LIVE with fresh connection`);
    } else if (stream.type === 'playlist') {
      // CRITICAL FIX: ALWAYS fetch fresh server position on resume (ignore saved state)
      try {
        const pos = await getServerLivePosition(true); // Force fresh sync
        currentTrackIndex = pos.trackIndex;
        const freshUrl = stream.getTrackUrl(currentTrackIndex) + '&r=' + Math.random();
        audio.src = freshUrl;
        audio.load(); // Force reload
        console.log(`[GMP] 🔴 RESUMING AT LIVE: Track ${pos.trackIndex + 1} at ${Math.floor(pos.position)}s`);
        
        // CRITICAL FIX: Wait for canplay before seeking and playing
        const seekAndPlay = () => {
          const dur = audio.duration || 3600;
          const seekPos = Math.min(pos.position, dur - 5);
          console.log(`[GMP] 🎯 Resume seeking to ${Math.floor(seekPos)}s (duration: ${Math.floor(dur)}s)`);
          audio.currentTime = seekPos;
          // Small delay to ensure seek takes effect
          setTimeout(() => {
            console.log(`[GMP] ✅ Resume playing from ${Math.floor(audio.currentTime)}s`);
            audio.play().catch(() => {});
          }, 100);
        };
        
        if (audio.readyState >= 2) {
          // HAVE_ENOUGH_DATA - seek immediately
          seekAndPlay();
        } else {
          // Wait until we can play
          audio.addEventListener('canplay', seekAndPlay, { once: true });
        }
      } catch (e) {
        console.error('[GMP] Failed to get live position on resume:', e);
        // Fallback to local calculation
        const localPos = getLocalLivePosition();
        currentTrackIndex = localPos.trackIndex;
        const freshUrl = stream.getTrackUrl(currentTrackIndex) + '&r=' + Math.random();
        audio.src = freshUrl;
        audio.load(); // Force reload
        console.log(`[GMP] Using fallback: Track ${localPos.trackIndex + 1} at ${Math.floor(localPos.position)}s`);
        // CRITICAL FIX: Wait for canplay before seeking and playing
        const seekAndPlay = () => {
          const dur = audio.duration || 3600;
          const seekPos = Math.min(localPos.position, dur - 5);
          console.log(`[GMP] 🎯 Resume fallback seeking to ${Math.floor(seekPos)}s (duration: ${Math.floor(dur)}s)`);
          audio.currentTime = seekPos;
          // Small delay to ensure seek takes effect
          setTimeout(() => {
            console.log(`[GMP] ✅ Resume fallback playing from ${Math.floor(audio.currentTime)}s`);
            audio.play().catch(() => {});
          }, 100);
        };
        
        if (audio.readyState >= 2) {
          // HAVE_ENOUGH_DATA - seek immediately
          seekAndPlay();
        } else {
          // Wait until we can play
          audio.addEventListener('canplay', seekAndPlay, { once: true });
        }
      }
    }

    if (stream.type === 'live') {
      try {
        await audio.play();
        console.log(`[GMP] ▶ Resumed: ${stream.name}`);
      } catch (e) {
        console.log('[GMP] Autoplay blocked — waiting for user interaction');
        isPlaying = false;
        updateMiniPlayerUI(true);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA SESSION (Lock screen controls)
  // ═══════════════════════════════════════════════════════════════════════════

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const stream = STREAMS[currentStream];
    if (!stream) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: stream.name,
      artist: stream.subtitle,
      album: 'ANHAD',
      artwork: [{ src: stream.artwork, sizes: '512x512', type: 'image/webp' }]
    });

    navigator.mediaSession.setActionHandler('play', () => audio?.play());
    navigator.mediaSession.setActionHandler('pause', () => audio?.pause());
    navigator.mediaSession.setActionHandler('stop', () => stopAudio());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MINI-PLAYER UI (Injected into DOM)
  // ═══════════════════════════════════════════════════════════════════════════

  function injectCSS() {
    if (document.getElementById('gmp-css')) return;
    const link = document.createElement('link');
    link.id = 'gmp-css';
    link.rel = 'stylesheet';

    link.href = GMP_BASE ? GMP_BASE + 'css/global-mini-player.css' : 'css/global-mini-player.css';
    document.head.appendChild(link);
  }

  function injectMiniPlayer() {
    if (document.getElementById('gmp') || isPlayerPage) return;

    const el = document.createElement('aside');
    el.id = 'gmp';
    el.className = 'gmp';
    el.setAttribute('aria-label', 'Now Playing');
    el.setAttribute('role', 'complementary');

    // Check if page has a bottom nav
    const hasNav = !!document.querySelector('.bottom-nav, .nav-pill, .pill-nav, nav[class*="nav"], .tab-bar');
    if (!hasNav) el.classList.add('gmp--no-nav');

    el.innerHTML = `
      <div class="gmp__art">
        <img src="" alt="" width="46" height="46" id="gmpArt">
      </div>
      <div class="gmp__info" id="gmpTap">
        <div class="gmp__title">
          <span class="gmp__live-dot" id="gmpLiveDot"></span>
          <span id="gmpTitle">—</span>
        </div>
        <div class="gmp__sub" id="gmpSub">—</div>
      </div>
      <div class="gmp__controls">
        <button class="gmp__btn gmp__btn--play" id="gmpPlay" aria-label="Play/Pause">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="gmp__btn gmp__btn--close" id="gmpClose" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="gmp__progress"><div class="gmp__progress-fill" id="gmpProgress"></div></div>
    `;

    document.body.appendChild(el);
    miniPlayerEl = el;

    // Event handlers
    document.getElementById('gmpPlay')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      togglePlayPause();
    });

    document.getElementById('gmpClose')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      stopAudio();
    });

    document.getElementById('gmpTap')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const stream = STREAMS[currentStream];
      if (stream?.playerPage) {
        const href = GMP_BASE ? GMP_BASE + stream.playerPage : stream.playerPage;
        window.location.href = href;
      }
    });

    // Also make artwork tappable
    el.querySelector('.gmp__art')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      document.getElementById('gmpTap')?.click();
    });
  }

  function updateMiniPlayerUI(forceVisible) {
    if (!miniPlayerEl) return;

    const stream = STREAMS[currentStream];
    if (!stream) {
      // No stream selected, hide mini player
      miniPlayerEl.classList.remove('gmp--visible');
      return;
    }

    // Mini player should stay visible once shown, unless explicitly closed
    // Only hide if there's no stream (user clicked close)
    const shouldShow = true; // Always show if we have a stream
    miniPlayerEl.classList.toggle('gmp--visible', shouldShow);

    // Update artwork
    const artImg = document.getElementById('gmpArt');
    if (artImg && stream.artwork) artImg.src = stream.artwork;

    // Update title/subtitle
    const titleEl = document.getElementById('gmpTitle');
    const subEl = document.getElementById('gmpSub');
    if (titleEl) titleEl.textContent = stream.name;
    if (subEl) subEl.textContent = stream.subtitle;

    // Show/hide live dot
    const liveDot = document.getElementById('gmpLiveDot');
    if (liveDot) liveDot.style.display = stream.type === 'live' ? '' : 'none';

    // Update play/pause icon with smooth transition
    const playBtn = document.getElementById('gmpPlay');
    if (playBtn) {
      const svg = playBtn.querySelector('svg');
      if (svg) {
        svg.style.opacity = '0';
        setTimeout(() => {
          svg.innerHTML = isPlaying
            ? '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'
            : '<path d="M8 5v14l11-7z"/>';
          svg.style.opacity = '1';
        }, 150);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE STATE BEFORE PAGE UNLOADS (critical for persistence)
  // ═══════════════════════════════════════════════════════════════════════════

  window.addEventListener('pagehide', () => {
    if (audio && isPlaying) {
      persistState();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (audio && isPlaying) {
      persistState();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPOSE GLOBAL API (for other scripts to interact)
  // ═══════════════════════════════════════════════════════════════════════════

  window.GlobalMiniPlayer = {
    play: playStream,
    pause: () => { if (audio) audio.pause(); },
    toggle: togglePlayPause,
    stop: stopAudio,
    isPlaying: () => isPlaying,
    getStream: () => currentStream,
    getAudio: () => audio,
    show: () => updateMiniPlayerUI(true),
    hide: () => { miniPlayerEl?.classList.remove('gmp--visible'); }
  };

  // Register with AudioCoordinator if available
  if (window.AudioCoordinator) {
    window.AudioCoordinator.register('GlobalMiniPlayer', {
      pause: () => { if (audio) audio.pause(); },
      isPlaying: () => isPlaying,
      getStream: () => currentStream
    });
    console.log('[GMP] Registered with AudioCoordinator');
  } else {
    // Wait for coordinator to load
    setTimeout(() => {
      if (window.AudioCoordinator) {
        window.AudioCoordinator.register('GlobalMiniPlayer', {
          pause: () => { if (audio) audio.pause(); },
          isPlaying: () => isPlaying,
          getStream: () => currentStream
        });
        console.log('[GMP] Registered with AudioCoordinator (delayed)');
      }
    }, 500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTEN FOR PLAY EVENTS FROM OTHER SCRIPTS
  // ═══════════════════════════════════════════════════════════════════════════

  window.addEventListener('anhadPlayStream', (e) => {
    const streamName = e.detail?.stream;
    if (streamName && STREAMS[streamName]) {
      playStream(streamName);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TOAST NOTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  function showGmpToast(message) {
    try {
      let toast = document.getElementById('gmp-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'gmp-toast';
        toast.style.cssText = 'position:fixed;bottom:160px;left:50%;transform:translateX(-50%) translateY(8px);background:rgba(30,10,50,0.92);color:#FDF6EC;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:500;z-index:10001;opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap;backdrop-filter:blur(10px);border:1px solid rgba(212,134,10,0.3);';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(8px)';
      }, 3500);
    } catch (e) { }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    injectCSS();
    injectMiniPlayer();
    resumePlayback();
  }

  // ─── Listening time tracker (feeds Dashboard stats) ──────────────────────
  // Every 60s while audio is playing, credit 1 minute to AnhadStats AND Dashboard.
  setInterval(function () {
    console.log('[GMP] ⏱️ Timer tick - isPlaying:', isPlaying, 'DashboardAnalytics:', !!window.DashboardAnalytics);
    if (isPlaying) {
      // Sync to AnhadStats
      if (window.AnhadStats && typeof window.AnhadStats.addListeningTime === 'function') {
        window.AnhadStats.addListeningTime(1);
        console.log('[GMP] ✅ Synced 1 min to AnhadStats');
      }
      // DIRECT: Sync to DashboardAnalytics for immediate chart update
      if (window.DashboardAnalytics && typeof window.DashboardAnalytics.updateDailyData === 'function') {
        window.DashboardAnalytics.updateDailyData('listen', 1);
        console.log('[GMP] ✅ Synced 1 min to DashboardAnalytics');
      } else {
        console.log('[GMP] ❌ DashboardAnalytics not available');
      }
    }
  }, 10000); // DEBUG: 10 seconds for testing

  // Start as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose test function for manual verification
  window.testKirtanTracking = function() {
    console.log('[GMP] 🧪 MANUAL TEST: Adding 1 minute...');
    if (window.DashboardAnalytics && typeof window.DashboardAnalytics.updateDailyData === 'function') {
      window.DashboardAnalytics.updateDailyData('listen', 1);
      console.log('[GMP] ✅ Manual test: Added 1 min to DashboardAnalytics');
      return 'Success - check dashboard graph';
    } else {
      console.log('[GMP] ❌ DashboardAnalytics not available');
      return 'Failed - DashboardAnalytics not found';
    }
  };

  console.log('[GMP] Global Mini-Player loaded');
})();
