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
  // SINGLETON GUARD - Prevent duplicate initialization
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (window.GlobalMiniPlayer && window.GlobalMiniPlayer._initialized) {
    return;
  }

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
    } catch (e) { }
    return '';
  })();

  function resolveAsset(filename) {
    return GMP_BASE ? GMP_BASE + 'assets/' + filename : 'assets/' + filename;
  }

  const SIMRAN_R2_BASE = 'https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev';
  const SIMRAN_R2_PREFIX = 'waheguru';
  const SIMRAN_FILENAMES = [
    '01 - DEENANATH SUNO WAHEGURU SIMRAN DAY 1.mp3',
    '02 - TUM KARO DAYA WAHEGURU SIMRAIN DAY 2.mp3',
    '03 - SUNN YAAR HAMARE SAJAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '04 - SUKH NAAHI RE HAR BHAGAT BINA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '05 - TU PRABH DATA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '06 - SATNAM WAHEGURU - SIMRAN - AMRITVELA TRUST..mp3',
    '07 - MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '08 - RAKHWALA SIMRAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '09 - AAS PYAASI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '10 - PRABH PAAS JAN KI ARDAS - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '11 - TU HI TU HI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '12 - NAAM NAAM NAAM APNA NAAM DEHO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '13 - DHAN GURU RAMDAS JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '14 - AAO SAJANA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '15 - TUJ BIN KAVAN HAMARA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '16 - MERA BAID GURU GOVINDA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '17 - JAGAN TE SUPNA BHALA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '18 - EH NEECH KARAM HAR MERE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '19 - APNA NAAM JAPAO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '20 - MERE PYAARE SATUGURU JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '21 - RAKH LEHO BHAGWAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '22 - KAB GAL LAVENGE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '23 - MERE RAM MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '24 - RAKHEYA KARO SIMRAN DAY 25.mp3',
    '25 - WAHEGURU SIMRAN UTH NAAM JAP AMRITVELA TRUST BEST SIMRAN.mp3',
    '26 - BEST WAHEGURU SIMRAN DAY 27 CHALIYA 2020.mp3',
    '27 - KAD NANAK AAVE VARI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '28 - BIN GUR NA PAVAIGO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '29 - KIYO SHINGAR MILAN KE TAAYEE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '30 - NAAM BINA NAHI JEEVIA JAYE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '31 - AATH PEHAR SIMRO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '32 - MIL MERE PREETMA JEEO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '33 - SATNAM SHRI WAHEGURU SIMRAN DAY 35 CHALIYA 2020.mp3',
    '34 - RAKH RAKH MERE BEETHLA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '35 - PRAAN ADHAARA RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '36 - DHAN BABA NANAK - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '37 - SUNN MANN MITTAR PYAREYA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    '38 - MERE SATGUR PYARE GURNANAK AAJA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3'
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME-BASED ARTWORK HELPER (like Gurbani Radio)
  // ═══════════════════════════════════════════════════════════════════════════
  
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
    if (!stream || !stream.artworkSlots) return stream?.artwork || '';
    const timeSlot = getTimeOfDay();
    return stream.artworkSlots[timeSlot] || stream.artwork;
  }

  const STREAMS = {
    darbar: {
      name: 'Darbar Sahib Live',
      subtitle: 'Sri Harmandir Sahib Ji',
      url: 'https://live.sgpc.net:8443/;nocache=1',
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
      playerPage: 'GurbaniRadio/gurbani-radio.html?stream=amritvela',
      getTrackUrl(index) {
        const base = getAudioBase();
        return `${base}/day-${((index % this.totalTracks) + this.totalTracks) % this.totalTracks + 1}.webm?t=${Date.now()}`;
      }
    },
    simran: {
      name: 'Waheguru Simran',
      subtitle: 'Naam Simran • Virtual Live',
      artwork: resolveAsset('HERO CARD IMAGES/day-waheguru-simran.webp'),
      artworkSlots: {
        morning: resolveAsset('HERO CARD IMAGES/morning-waheguru-simran.webp'),
        day: resolveAsset('HERO CARD IMAGES/day-waheguru-simran.webp'),
        evening: resolveAsset('HERO CARD IMAGES/evening-waheguru-simran.webp'),
        night: resolveAsset('HERO CARD IMAGES/night-waheguru-simran.webp')
      },
      type: 'simran',
      totalTracks: 38,
      playerPage: 'GurbaniRadio/gurbani-radio.html?stream=simran',
      getTrackUrl(idx) {
        const i = ((idx % this.totalTracks) + this.totalTracks) % this.totalTracks;
        const filename = SIMRAN_FILENAMES[i];
        return `${SIMRAN_R2_BASE}/${SIMRAN_R2_PREFIX}/${encodeURIComponent(filename)}`;
      }
    },
    hukamnama: {
      name: 'Daily Hukamnama',
      subtitle: 'Sachkhand Sri Harmandir Sahib',
      url: `${API_BASE}/api/hukamnama/audio`,
      artwork: resolveAsset('HUKAMNAMA-SAHIB.webp'),
      type: 'live',
      skipCacheBuster: true,
      playerPage: 'Hukamnama/daily-hukamnama.html'
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
    } catch (e) { }
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
    if (!window.AnhadAudio) return getLocalLivePosition();
    
    const state = window.AnhadAudio.getState();
    const currentStream = state.currentStream || 'darbar';
    
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
      // CRITICAL FIX: Add cache buster to URL to bypass server-side caching
      const apiPath = currentStream === 'simran' ? '/api/simran/live' : '/api/radio/live';
      const freshUrl = `${API_BASE}${apiPath}?t=${Date.now()}&r=${Math.random()}`;
      const resp = await fetch(freshUrl, {
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
    if (!window.AnhadAudio) return { trackIndex: 0, position: 0 };
    
    const state = window.AnhadAudio.getState();
    const currentStream = state.currentStream || 'darbar';
    
    const UNIVERSAL_EPOCH = 1704067200000; // Jan 1, 2024
    const elapsed = (Date.now() - UNIVERSAL_EPOCH) / 1000;
    const isSimran = currentStream === 'simran';
    const totalTracks = isSimran ? 38 : 40;
    const trackDuration = isSimran ? 600 : 3600;
    const totalDur = totalTracks * trackDuration;
    const pos = ((elapsed % totalDur) + totalDur) % totalDur;
    return { trackIndex: Math.floor(pos / trackDuration), position: pos % trackDuration };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SKIP PLAYER PAGES — Don't double up
  // ═══════════════════════════════════════════════════════════════════════════

  const currentPath = window.location.pathname.toLowerCase();
  // Hide mini player on Gurbani Radio page (it has its own full player)
  const isPlayerPage = currentPath.includes('gurbani-radio');

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO ENGINE - Using AnhadAudio Singleton
  // ═══════════════════════════════════════════════════════════════════════════

  // All audio state is managed by window.AnhadAudio singleton
  // Mini player subscribes to state changes and updates UI accordingly
  let miniPlayerEl = null;
  let isInitialPageLoad = true; // Track if this is the first page load
  let pendingUIUpdate = null; // Queue for UI updates before mini player is ready

  async function playStream(streamName) {
    if (!window.AnhadAudio) return;
    updateMiniPlayerUI(true);
    setLoadingState(true);
    await window.AnhadAudio.play(streamName);
  }

  async function playNextTrack() {
    if (!window.AnhadAudio) return;
    await window.AnhadAudio.playNextTrack();
  }

  async function togglePlayPause() {
    if (!window.AnhadAudio) return;
    const state = window.AnhadAudio.getState();
    if (state.isPlaying) {
      window.AnhadAudio.pause();
    } else {
      await window.AnhadAudio.resumeInPlace();
    }
  }

  function stopAudio() {
    if (window.AnhadAudio) {
      window.AnhadAudio.stop();
    }
    updateMiniPlayerUI(false);
  }

  async function resumePlayback() {
    // Sync UI to match window.AnhadAudio state
    if (window.AnhadAudio) {
      const state = window.AnhadAudio.getState();
      updateMiniPlayerUI(state.isPlaying);
      updatePlayPauseIcon();
    }
  }

  function persistState() {
    // No-op: State persistence is handled authoritatively by window.AnhadAudio singleton
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA SESSION (Lock screen controls)
  // ═══════════════════════════════════════════════════════════════════════════

  function updateMediaSession() {
    // Only use web MediaSession for PWA, not Capacitor (native MediaSessionCompat handles it)
    if (window.Capacitor) return;
    if (!('mediaSession' in navigator)) return;
    if (!window.AnhadAudio) return;
    
    const state = window.AnhadAudio.getState();
    const stream = STREAMS[state.currentStream];
    if (!stream) return;

    // Multiple artwork sizes for best OS rendering — logo fallback
    const primaryArt = stream.artwork || '../assets/icons/icon-1024x1024.png';
    const artworkList = [
      { src: '../assets/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { src: '../assets/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { src: '../assets/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '../assets/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: primaryArt, sizes: '1024x1024', type: 'image/png' }
    ];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: stream.name,
      artist: stream.subtitle,
      album: 'ANHAD',
      artwork: artworkList
    });

    // CRITICAL: Instant resume from lock screen
    navigator.mediaSession.setActionHandler('play', () => {
      window.AnhadAudio.resumeInPlace();
    });
    navigator.mediaSession.setActionHandler('pause', () => window.AnhadAudio.pause());
    navigator.mediaSession.setActionHandler('stop', () => stopAudio());
    navigator.mediaSession.setActionHandler('previoustrack', () => window.AnhadAudio.play(state.currentStream));

    navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
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
    console.log('[GMP] injectMiniPlayer called - checking conditions...');
    const hasExisting = document.getElementById('gmp');
    console.log('[GMP] hasExisting:', hasExisting, 'isPlayerPage:', isPlayerPage);
    if (hasExisting || isPlayerPage) {
      console.log('[GMP] injectMiniPlayer - returning early (element exists or is player page)');
      return;
    }

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
        <div class="gmp__loading-overlay" id="gmpLoading">
          <div class="gmp__spinner"></div>
        </div>
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
          <svg viewBox="0 0 24 24" fill="currentColor" id="gmpPlayIcon"><path d="M8 5v14l11-7z"/></svg>
          <div class="gmp__btn-spinner" id="gmpBtnSpinner"></div>
        </button>
        <button class="gmp__btn gmp__btn--close" id="gmpClose" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="gmp__progress"><div class="gmp__progress-fill" id="gmpProgress"></div></div>
    `;

    // Insert BEFORE bottom navigation for Application Shell positioning
    const bottomNav = document.querySelector('.bottom-nav, .nav-pill, .pill-nav, nav[role="navigation"], .tab-bar');
    if (bottomNav) {
      document.body.insertBefore(el, bottomNav);
    } else {
      document.body.appendChild(el);
    }
    miniPlayerEl = el;

    // Create Spotify-style background element
    createBackgroundElement();

    // Apply any pending UI update that was queued before injection
    if (pendingUIUpdate !== null) {
      console.log('[GMP] Applying pending UI update after injection. forceVisible:', pendingUIUpdate);
      const forceVisible = pendingUIUpdate;
      pendingUIUpdate = null;
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => updateMiniPlayerUI(forceVisible), 0);
    }

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
      if (!window.AnhadAudio) return;
      const state = window.AnhadAudio.getState();
      const stream = STREAMS[state.currentStream];
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SPOTIFY-STYLE BACKGROUND
  // ═══════════════════════════════════════════════════════════════════════════

  let backgroundEl = null;

  function createBackgroundElement() {
    if (document.getElementById('gmp-background')) return;

    const bg = document.createElement('div');
    bg.id = 'gmp-background';
    bg.className = 'gmp-background';
    bg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bg);
    backgroundEl = bg;
  }

  function updateBackground(artworkUrl) {
    if (!backgroundEl) createBackgroundElement();
    
    const state = window.AnhadAudio ? window.AnhadAudio.getState() : { isPlaying: false };
    if (artworkUrl && state.isPlaying) {
      backgroundEl.style.backgroundImage = `url('${artworkUrl}')`;
      backgroundEl.classList.add('gmp-background--visible');
    } else {
      backgroundEl.classList.remove('gmp-background--visible');
    }
  }

  // Loading state management
  let isLoading = false;

  function setLoadingState(loading) {
    isLoading = loading;

    // Update artwork loading overlay
    const loadingOverlay = document.getElementById('gmpLoading');
    if (loadingOverlay) {
      loadingOverlay.style.display = loading ? 'flex' : 'none';
    }

    // Update play button spinner
    const playIcon = document.getElementById('gmpPlayIcon');
    const btnSpinner = document.getElementById('gmpBtnSpinner');
    if (playIcon && btnSpinner) {
      if (loading) {
        playIcon.style.display = 'none';
        btnSpinner.style.display = 'block';
      } else {
        playIcon.style.display = 'block';
        btnSpinner.style.display = 'none';
      }
    }

    // Also update the main play/pause icon when not loading
    if (!loading) {
      updatePlayPauseIcon();
    }
  }

  function updatePlayPauseIcon() {
    if (!window.AnhadAudio) return;
    const state = window.AnhadAudio.getState();
    const playIcon = document.getElementById('gmpPlayIcon');
    if (playIcon && !isLoading) {
      playIcon.style.opacity = '0';
      setTimeout(() => {
        playIcon.innerHTML = state.isPlaying
          ? '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'
          : '<path d="M8 5v14l11-7z"/>';
        playIcon.style.opacity = '1';
      }, 150);
    }
  }

  function updateMiniPlayerUI(forceVisible) {
    if (!miniPlayerEl) {
      // Queue the update for when mini player is ready
      pendingUIUpdate = forceVisible;
      console.log('[GMP] updateMiniPlayerUI: miniPlayerEl is null, queuing update. forceVisible:', forceVisible);
      return;
    }

    if (!window.AnhadAudio) return;
    const state = window.AnhadAudio.getState();
    const stream = STREAMS[state.currentStream || 'darbar'];

    // Determine if we should actually show the mini player
    // Show when: explicitly forced, OR audio is playing/loading with valid stream
    const hasActiveStream = state.currentStream && stream;
    const singletonAudio = window.AnhadAudio.getAudio ? window.AnhadAudio.getAudio() : null;
    const actuallyPlaying = state.isPlaying && singletonAudio && singletonAudio.src && singletonAudio.src !== window.location.href;
    const isActive = state.isLoading || actuallyPlaying || forceVisible;
    // MODIFIED: Show when forceVisible is true even without active stream
    const shouldShow = (isActive && hasActiveStream) || forceVisible;

    if (!shouldShow) {
      // Hide mini player - CSS has display:none by default
      miniPlayerEl.classList.remove('gmp--visible');
      // Clear artwork to prevent broken image flash
      const artImg = document.getElementById('gmpArt');
      if (artImg) artImg.src = '';
      return;
    }

    // Show mini player - CSS .gmp--visible has display:flex
    miniPlayerEl.classList.add('gmp--visible');

    // Update artwork only when showing - USE TIME-BASED ARTWORK
    const artImg = document.getElementById('gmpArt');
    if (artImg && stream) {
      const timeBasedArtwork = getArtworkForStream(stream);
      artImg.src = timeBasedArtwork;
    }

    // Update title/subtitle
    const titleEl = document.getElementById('gmpTitle');
    const subEl = document.getElementById('gmpSub');
    if (titleEl) titleEl.textContent = stream?.name || '';
    if (subEl) subEl.textContent = stream?.subtitle || '';

    // Show/hide live dot
    const liveDot = document.getElementById('gmpLiveDot');
    if (liveDot) liveDot.style.display = stream?.type === 'live' ? '' : 'none';

    // Update loading state visual
    setLoadingState(state.isLoading || isLoading);
  }

  // Expose setLoadingState globally for external use
  window.GlobalMiniPlayer = {
    ...window.GlobalMiniPlayer,
    setLoading: setLoadingState,
    isLoading: () => isLoading
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE STATE BEFORE PAGE UNLOADS
  // ═══════════════════════════════════════════════════════════════════════════

  // State persistence is handled by AnhadAudio singleton

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPOSE GLOBAL API (for other scripts to interact)
  // ═══════════════════════════════════════════════════════════════════════════

  window.GlobalMiniPlayer = {
    _initialized: true,
    play: playStream,
    pause: () => { if (window.AnhadAudio) window.AnhadAudio.pause(); },
    toggle: togglePlayPause,
    stop: stopAudio,
    isPlaying: () => {
      if (!window.AnhadAudio) return false;
      const state = window.AnhadAudio.getState();
      return state.isPlaying;
    },
    getStream: () => {
      if (!window.AnhadAudio) return null;
      const state = window.AnhadAudio.getState();
      return state.currentStream;
    },
    getAudio: () => window.AnhadAudio ? window.AnhadAudio.getAudio() : null,
    show: () => updateMiniPlayerUI(true),
    hide: () => { miniPlayerEl?.classList.remove('gmp--visible'); }
  };

  // Register with AudioCoordinator if available
  if (window.AudioCoordinator) {
    window.AudioCoordinator.register('GlobalMiniPlayer', {
      pause: () => { if (window.AnhadAudio) window.AnhadAudio.pause(); },
      isPlaying: () => {
        if (!window.AnhadAudio) return false;
        const state = window.AnhadAudio.getState();
        return state.isPlaying;
      },
      getStream: () => {
        if (!window.AnhadAudio) return null;
        const state = window.AnhadAudio.getState();
        return state.currentStream;
      }
    });
    console.log('[GMP] Registered with AudioCoordinator');
  } else {
    // Wait for coordinator to load
    setTimeout(() => {
      if (window.AudioCoordinator) {
        window.AudioCoordinator.register('GlobalMiniPlayer', {
          pause: () => { if (window.AnhadAudio) window.AnhadAudio.pause(); },
          isPlaying: () => {
            if (!window.AnhadAudio) return false;
            const state = window.AnhadAudio.getState();
            return state.isPlaying;
          },
          getStream: () => {
            if (!window.AnhadAudio) return null;
            const state = window.AnhadAudio.getState();
            return state.currentStream;
          }
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
  // MASTER STATE SUBSCRIPTION (Task 5.4)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * updateMiniPlayer - Reads from master state and updates UI
   * 
   * Subscribes to:
   * - window.AnhadAudio.on('statechange', updateMiniPlayer)
   * - window.AnhadAudio.on('timeupdate', updateMiniPlayer)
   * 
   * Requirements: 2.6, 2.7, 2.8, 2.9, 2.10
   * Bug Condition: isBugCondition() where Mini Player shows stale/different state
   * Expected: Mini Player always shows current master state
   */
  function updateMiniPlayer() {
    if (!window.AnhadAudio || !miniPlayerEl) return;
    
    // Read from master state (single source of truth)
    const state = window.AnhadAudio.getState();
    const stream = STREAMS[state.currentStream || 'darbar'];
    
    // Update title and artist from master state
    const titleEl = document.getElementById('gmpTitle');
    const subEl = document.getElementById('gmpSub');
    if (titleEl) {
      titleEl.textContent = state.currentTrackTitle || (stream?.name || '—');
    }
    if (subEl) {
      subEl.textContent = state.currentTrackArtist || (stream?.subtitle || '—');
    }
    
    // Update progress bar from master state
    const fill = miniPlayerEl?.querySelector('.gmp__progress-fill');
    if (fill && state.duration && isFinite(state.duration)) {
      const pct = (state.currentTime / state.duration) * 100;
      fill.style.width = pct + '%';
    }
    
    // Update play/pause icon from master state
    const playIcon = document.getElementById('gmpPlayIcon');
    if (playIcon && !isLoading) {
      playIcon.style.opacity = '0';
      setTimeout(() => {
        playIcon.innerHTML = state.isPlaying
          ? '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'
          : '<path d="M8 5v14l11-7z"/>';
        playIcon.style.opacity = '1';
      }, 150);
    }
    
    // Update live dot visibility
    const liveDot = document.getElementById('gmpLiveDot');
    if (liveDot) {
      liveDot.style.display = stream?.type === 'live' ? '' : 'none';
    }
    
    // Update artwork from master state - USE TIME-BASED ARTWORK
    const artImg = document.getElementById('gmpArt');
    if (artImg && stream) {
      const timeBasedArtwork = getArtworkForStream(stream);
      artImg.src = timeBasedArtwork;
    }
    
    // Update visibility based on playing state
    const hasActiveStream = state.currentStream && stream;
    const actuallyPlaying = state.isPlaying;
    const shouldShow = (actuallyPlaying || state.isLoading) && hasActiveStream;
    
    if (shouldShow) {
      miniPlayerEl.classList.add('gmp--visible');
    } else {
      miniPlayerEl.classList.remove('gmp--visible');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    injectCSS();
    injectMiniPlayer();

    if (window.AnhadAudio) {
      window.AnhadAudio.on('statechange', updateMiniPlayer);
      window.AnhadAudio.on('timeupdate', updateMiniPlayer);
      window.AnhadAudio.on('loading', (e) => {
        setLoadingState(e.isLoading);
      });
    }

    if (window.AnhadAudio) {
      const state = window.AnhadAudio.getState();
      const wasNavigating = sessionStorage.getItem('anhad_navigating');
      if ((state.isPlaying && state.currentStream) || wasNavigating) {
        if (miniPlayerEl) {
          miniPlayerEl.classList.add('gmp--visible');
          updateMiniPlayer();
        }
        if (wasNavigating) {
          sessionStorage.removeItem('anhad_navigating');
        }
      }
    }

    resumePlayback();
  }

  // Listen for restore event from smooth-navigation.js
  window.addEventListener('anhadRestoreMiniPlayer', (e) => {
    if (window.AnhadAudio && miniPlayerEl) {
      const state = window.AnhadAudio.getState();
      if (state.isPlaying) {
        miniPlayerEl.classList.add('gmp--visible', 'gmp--animate-in');
        updateMiniPlayer(); // Use new updateMiniPlayer function

        setTimeout(() => {
          miniPlayerEl?.classList.remove('gmp--animate-in');
        }, 250);
      }
    }
  });

  // ─── Listening time tracker (feeds Dashboard stats) ──────────────────────
  // Every 10s while audio is playing, credit 1 minute to AnhadStats AND Dashboard.
  const PENDING_KIRTAN_TIME_KEY = 'anhad_pending_kirtan_minutes';
  let accumulatedSeconds = 0;

  // Load any pending time from previous sessions
  function getPendingKirtanMinutes() {
    try {
      const stored = localStorage.getItem(PENDING_KIRTAN_TIME_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) { return 0; }
  }

  function addPendingKirtanMinutes(minutes) {
    try {
      const current = getPendingKirtanMinutes();
      localStorage.setItem(PENDING_KIRTAN_TIME_KEY, (current + minutes).toString());
    } catch (e) { }
  }

  function clearPendingKirtanMinutes() {
    try {
      localStorage.removeItem(PENDING_KIRTAN_TIME_KEY);
    } catch (e) { }
  }

  // Sync pending time to Dashboard when available
  function syncPendingKirtanTime() {
    const pending = getPendingKirtanMinutes();
    if (pending > 0 && window.DashboardAnalytics && typeof window.DashboardAnalytics.updateDailyData === 'function') {
      window.DashboardAnalytics.updateDailyData('listen', pending);
      console.log(`[GMP] ✅ Synced ${pending} pending min to DashboardAnalytics (from other pages)`);
      clearPendingKirtanMinutes();
      return true;
    }
    return false;
  }

  // Try to sync any pending time when page loads
  setTimeout(syncPendingKirtanTime, 2000); // Delay to let Dashboard init

  // Also try to sync periodically in case Dashboard loads later
  setInterval(syncPendingKirtanTime, 5000);

  setInterval(function () {
    const actuallyPlaying = window.AnhadAudio ? window.AnhadAudio.isPlaying() : false;

    if (actuallyPlaying) {
      accumulatedSeconds += 10;

      if (accumulatedSeconds >= 60) {
        const minutes = Math.floor(accumulatedSeconds / 60);
        accumulatedSeconds = accumulatedSeconds % 60;

        if (window.AnhadStats && typeof window.AnhadStats.addListeningTime === 'function') {
          window.AnhadStats.addListeningTime(minutes);
        }

        if (window.UnifiedStats) {
          window.UnifiedStats.recordKirtanListening(minutes);
        }

        if (window.DashboardAnalytics && typeof window.DashboardAnalytics.updateDailyData === 'function') {
          const pending = getPendingKirtanMinutes();
          if (pending > 0) {
            window.DashboardAnalytics.updateDailyData('listen', pending);
            clearPendingKirtanMinutes();
          }
          window.DashboardAnalytics.updateDailyData('listen', minutes);
        } else {
          addPendingKirtanMinutes(minutes);
        }
      }
    }
  }, 10000);

  // Start as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose test function for manual verification
  window.testKirtanTracking = function () {
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

  // Keyboard shortcut: Press K to add 1 minute manually
  document.addEventListener('keydown', (e) => {
    if (e.key === 'k' || e.key === 'K') {
      console.log('[GMP] ⌨️ K key pressed - triggering manual test');
      const result = window.testKirtanTracking();
      console.log('[GMP] Test result:', result);
    }
  });

  console.log('[GMP] Global Mini-Player loaded (press K to test tracking)');
})();
