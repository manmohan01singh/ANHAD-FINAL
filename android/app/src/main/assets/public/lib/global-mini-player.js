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
      playerPage: 'GurbaniRadio/ios17-gurbani-radio.html'
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
        return `${base}/day-${((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1}.webm`;
      }
    }
  };

  // RENDER_BASE kept for legacy reference; API_BASE below does smart resolution
  const RENDER_BASE = 'http://localhost:3000';

  function getAudioBase() {
    return 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
  }

  // Smart API URL resolution for CORS and mobile apps
  const API_BASE = (() => {
    try {
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

  async function getServerLivePosition() {
    try {
      const t0 = Date.now();
      const resp = await fetch(`${API_BASE}/api/radio/live`);
      const t1 = Date.now();
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const latency = (t1 - t0) / 2000;
      return {
        trackIndex: data.trackIndex,
        position: data.trackPosition + latency
      };
    } catch (e) {
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
  const isPlayerPage = currentPath.includes('gurbani-radio') ||
                       currentPath.includes('ios17-gurbani-radio');

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  let audio = null;
  let currentStream = 'darbar';
  let currentTrackIndex = 0;
  let isPlaying = false;
  let miniPlayerEl = null;

  function createAudio() {
    if (audio) return audio;
    
    // Check if we have a preloaded audio element
    if (window.__anhadPreloadedAudio && 
        window.__anhadPreloadedAudio.stream === currentStream &&
        Date.now() - window.__anhadPreloadedAudio.timestamp < 5000) {
      // Use the preloaded audio element
      audio = window.__anhadPreloadedAudio.audio;
      console.log('[GMP] ⚡ Using preloaded audio element');
      delete window.__anhadPreloadedAudio; // Clean up
    } else {
      audio = new Audio();
      audio.preload = 'auto';
    }
    
    // No crossOrigin here, Cloudflare R2 lacks Allow-Origin but video/webm plays opaquely.
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
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
      // Notify coordinator that we paused
      if (window.AudioCoordinator) {
        window.AudioCoordinator.notifyPause('GlobalMiniPlayer');
      }
      persistState();
      updateMiniPlayerUI();
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
    saveState({
      isPlaying,
      stream: currentStream,
      trackIndex: currentTrackIndex,
      volume: audio ? audio.volume : 0.8,
      currentTime: audio ? audio.currentTime : 0,
      duration: audio ? audio.duration : 0
    });
  }

  async function playStream(streamName) {
    createAudio();
    
    // Notify AudioCoordinator BEFORE playing to pause other players
    if (window.AudioCoordinator) {
      window.AudioCoordinator.requestPlay('GlobalMiniPlayer');
    }
    
    currentStream = streamName;
    const stream = STREAMS[streamName];

    if (stream.type === 'live') {
      audio.src = stream.url;
      try { await audio.play(); } catch (e) { console.warn('[GMP] Autoplay blocked'); }
    } else if (stream.type === 'playlist') {
      const pos = await getServerLivePosition();
      currentTrackIndex = pos.trackIndex;
      audio.src = stream.getTrackUrl(currentTrackIndex);

      audio.addEventListener('loadedmetadata', function seek() {
        audio.removeEventListener('loadedmetadata', seek);
        const dur = audio.duration || 3600;
        audio.currentTime = Math.min(pos.position, dur - 5);
      }, { once: true });

      try { await audio.play(); } catch (e) { console.warn('[GMP] Autoplay blocked'); }
    }

    persistState();
    updateMiniPlayerUI();
  }

  async function playNextTrack() {
    const stream = STREAMS[currentStream];
    if (stream.type !== 'playlist') return;
    
    // For Virtual Live, don't just increment. Always resync with the server
    // so drift is corrected perfectly on every track boundary.
    const pos = await getServerLivePosition();
    currentTrackIndex = pos.trackIndex;
    audio.src = stream.getTrackUrl(currentTrackIndex);
    
    audio.addEventListener('loadedmetadata', function seek() {
      audio.removeEventListener('loadedmetadata', seek);
      const dur = audio.duration || 3600;
      audio.currentTime = Math.min(pos.position, dur - 5);
    }, { once: true });
    
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
      // Virtual Live effect: when answering pause, snap ahead to exactly the live server moment
      if (STREAMS[currentStream].type === 'playlist') {
        getServerLivePosition().then(pos => {
          const expectedSrc = STREAMS[currentStream].getTrackUrl(pos.trackIndex);
          const isSameTrack = audio.src.endsWith(expectedSrc) || audio.src === expectedSrc;
          
          if (isSameTrack && audio.readyState >= 1) {
            const dur = isFinite(audio.duration) ? audio.duration : 3600;
            const targetPos = Math.min(pos.position || 0, dur - 5);
            // Snap if drift > 3s
            if (Math.abs(audio.currentTime - targetPos) > 3) {
              audio.currentTime = targetPos;
            }
            audio.play().catch(() => {});
          } else {
            currentTrackIndex = pos.trackIndex;
            audio.src = expectedSrc;
            audio.addEventListener('loadedmetadata', function seek() {
               audio.removeEventListener('loadedmetadata', seek);
               const dur = isFinite(audio.duration) ? audio.duration : 3600;
               audio.currentTime = Math.min(pos.position || 0, dur - 5);
               audio.play().catch(() => {});
            }, { once: true });
          }
        }).catch(() => audio.play().catch(() => {})); // fallback
      } else {
        audio.play().catch(() => {});
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
    currentTrackIndex = state.trackIndex || 0;

    createAudio();
    audio.volume = state.volume || 0.8;

    const stream = STREAMS[currentStream];
    if (!stream) return;

    if (stream.type === 'live') {
      audio.src = stream.url;
    } else if (stream.type === 'playlist') {
      // Use server position for fresh accuracy
      try {
        const pos = await getServerLivePosition();
        currentTrackIndex = pos.trackIndex;
        audio.src = stream.getTrackUrl(currentTrackIndex);
        audio.addEventListener('loadedmetadata', function seek() {
          audio.removeEventListener('loadedmetadata', seek);
          const dur = audio.duration || 3600;
          audio.currentTime = Math.min(pos.position, dur - 5);
        }, { once: true });
      } catch (e) {
        audio.src = stream.getTrackUrl(currentTrackIndex);
      }
    }

    try {
      await audio.play();
      console.log(`[GMP] ▶ Resumed: ${stream.name}`);
    } catch (e) {
      console.log('[GMP] Autoplay blocked — waiting for user interaction');
      // Show mini-player anyway so user can tap play
      isPlaying = false;
      updateMiniPlayerUI(true); // force visible even if paused
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
  // Every 60s while audio is playing, credit 1 minute to AnhadStats.
  setInterval(function () {
    if (isPlaying && window.AnhadStats && typeof window.AnhadStats.addListeningTime === 'function') {
      window.AnhadStats.addListeningTime(1);
    }
  }, 60000);

  // Start as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[GMP] Global Mini-Player loaded');
})();
