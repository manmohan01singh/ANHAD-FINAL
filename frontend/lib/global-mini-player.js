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
      playerPage: 'GurbaniRadio/gurbani-radio.html',
      getTrackUrl(index) {
        const base = getAudioBase();
        return `${base}/day-${((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1}.webm`;
      }
    }
  };

  function resolveAsset(filename) {
    // Works from any page depth (e.g. /GurbaniRadio/, /NaamAbhyas/, etc.)
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length;
    // In subdirectory pages like /GurbaniRadio/page.html, we need ../assets/
    // In root pages like /index.html, we need assets/
    if (path.includes('/frontend/') && !path.endsWith('/frontend/') && !path.endsWith('/frontend/index.html')) {
      // Check if we're in a subdirectory
      const afterFrontend = path.split('/frontend/')[1] || '';
      const parts = afterFrontend.split('/').filter(Boolean);
      if (parts.length > 1) {
        return '../assets/' + filename;
      }
    }
    return 'assets/' + filename;
  }

  const RENDER_BASE = 'https://anhad-final.onrender.com';

  function getAudioBase() {
    try {
      const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const onBackendPort = window.location.port === '3000';
      if (isLocalhost && !onBackendPort) {
        return `${window.location.protocol}//${window.location.hostname}:3000/audio`;
      }
    } catch (e) { }
    return RENDER_BASE + '/audio';
  }

  const API_BASE = (() => {
    try {
      const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const onBackendPort = window.location.port === '3000';
      if (isLocalhost && !onBackendPort) {
        return `${window.location.protocol}//${window.location.hostname}:3000`;
      }
    } catch (e) { }
    return RENDER_BASE;
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

  function getLocalLivePosition() {
    let start;
    try {
      start = parseInt(localStorage.getItem('gurbani_broadcast_start') || '0', 10);
    } catch (e) { start = 0; }
    if (!start) { start = Date.now(); try { localStorage.setItem('gurbani_broadcast_start', start.toString()); } catch (e) { } }
    const elapsed = (Date.now() - start) / 1000;
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
    audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.volume = 0.8;

    audio.addEventListener('playing', () => {
      isPlaying = true;
      persistState();
      updateMiniPlayerUI();
      updateMediaSession();
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
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
      console.warn('[GMP] Audio error, retrying in 2s...');
      setTimeout(() => resumePlayback(), 2000);
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
    currentTrackIndex = (currentTrackIndex + 1) % stream.totalTracks;
    audio.src = stream.getTrackUrl(currentTrackIndex);
    try { await audio.play(); } catch (e) { }
    persistState();
  }

  function togglePlayPause() {
    if (!audio || !audio.src || audio.src === window.location.href) {
      // Nothing loaded — start darbar by default
      playStream(currentStream);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => {});
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
    saveState({ isPlaying: false, stream: currentStream, trackIndex: currentTrackIndex, volume: audio?.volume || 0.8, currentTime: 0 });
    updateMiniPlayerUI();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-RESUME ON PAGE LOAD
  // ═══════════════════════════════════════════════════════════════════════════

  async function resumePlayback() {
    const state = loadState();
    if (!state || !state.isPlaying) return;
    if (Date.now() - (state.timestamp || 0) > RESUME_THRESHOLD_MS) return;

    // Don't resume on player pages — those have their own audio
    if (isPlayerPage) return;

    currentStream = state.stream || 'darbar';
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

    // Resolve CSS path based on current page depth
    const path = window.location.pathname;
    const afterFrontend = (path.split('/frontend/')[1] || '').split('/').filter(Boolean);
    const prefix = afterFrontend.length > 1 ? '../' : '';
    link.href = prefix + 'css/global-mini-player.css';

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
    const hasNav = !!document.querySelector('.bottom-nav, .nav-pill, .pill-nav, nav[class*="nav"]');
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
      togglePlayPause();
    });

    document.getElementById('gmpClose')?.addEventListener('click', (e) => {
      e.stopPropagation();
      stopAudio();
    });

    document.getElementById('gmpTap')?.addEventListener('click', () => {
      const stream = STREAMS[currentStream];
      if (stream?.playerPage) {
        const path = window.location.pathname;
        const afterFrontend = (path.split('/frontend/')[1] || '').split('/').filter(Boolean);
        const prefix = afterFrontend.length > 1 ? '../' : '';
        window.location.href = prefix + stream.playerPage;
      }
    });

    // Also make artwork tappable
    el.querySelector('.gmp__art')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('gmpTap')?.click();
    });
  }

  function updateMiniPlayerUI(forceVisible) {
    if (!miniPlayerEl) return;

    const stream = STREAMS[currentStream];
    if (!stream) return;

    const shouldShow = isPlaying || forceVisible;
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

    // Update play/pause icon
    const playBtn = document.getElementById('gmpPlay');
    if (playBtn) {
      playBtn.innerHTML = isPlaying
        ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
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
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    injectCSS();
    injectMiniPlayer();
    resumePlayback();
  }

  // Start as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[GMP] Global Mini-Player loaded');
})();
