/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OVERLAY PLAYER V3 — Truly Independent Persistent Audio (Mobile Optimized)
 *
 * This is a Singleton system. Once loaded, it stays alive in the "Shell".
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // State
  const state = {
    audio: null,
    isPlaying: false,
    isLoading: false,
    currentStream: 'darbar',
    currentTrackIndex: 0,
    miniPlayerEl: null,
    streams: {
      darbar: {
        name: 'Darbar Sahib Live',
        subtitle: 'Sri Harmandir Sahib Ji',
        url: 'https://live.sgpc.net:8443/;nocache=1',
        artwork: 'assets/darbar-sahib-evening.webp',
        type: 'live'
      },
      amritvela: {
        name: 'Amritvela Kirtan',
        subtitle: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
        artwork: 'assets/Darbar-sahib-AMRITVELA.webp',
        type: 'playlist',
        totalTracks: 40,
        baseUrl: 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev',
        getTrackUrl(index) {
          return `${this.baseUrl}/day-${((index % this.totalTracks) + 40) % 40 + 1}.webm?t=${Date.now()}`;
        }
      }
    }
  };

  /**
   * Initialize the player system
   */
  function init() {
    if (window.AnhadOverlayPlayer) return; 

    console.log('[OverlayPlayer] Initializing persistent player core...');
    
    // 1. Create persistent audio element
    state.audio = new Audio();
    state.audio.preload = 'none';
    state.audio.volume = 0.8;

    // 2. Setup audio listeners
    setupAudioListeners();

    // 3. Inject UI
    injectUI();

    // 4. Expose API
    window.AnhadOverlayPlayer = {
      play: playStream,
      pause: () => state.audio.pause(),
      toggle: togglePlayPause,
      stop: stopAudio,
      getState: () => ({ ...state, audio: null }), 
      updateUI: updateUI
    };

    // 5. Try to resume from localStorage
    resumeFromStorage();

    // 6. Listen for SPA page changes to toggle visibility
    window.addEventListener('anhad_page_changed', handlePageChange);
  }

  function setupAudioListeners() {
    const a = state.audio;

    a.addEventListener('loadstart', () => { state.isLoading = true; updateUI(); });
    a.addEventListener('waiting', () => { state.isLoading = true; updateUI(); });
    a.addEventListener('canplay', () => { state.isLoading = false; updateUI(); });

    a.addEventListener('playing', () => {
      state.isPlaying = true;
      state.isLoading = false;
      updateUI();
      window.dispatchEvent(new CustomEvent('anhad_audio_playing', { detail: state }));
    });

    a.addEventListener('pause', () => {
      state.isPlaying = false;
      updateUI();
      window.dispatchEvent(new CustomEvent('anhad_audio_paused', { detail: state }));
    });

    a.addEventListener('timeupdate', () => {
      if (!a.duration || a.duration === Infinity) return;
      const progress = (a.currentTime / a.duration) * 100;
      const progressFill = document.getElementById('gmp-progress-fill');
      if (progressFill) progressFill.style.width = progress + '%';
    });

    a.addEventListener('ended', () => {
      if (state.streams[state.currentStream]?.type === 'playlist') {
        playNextTrack();
      }
    });

    a.addEventListener('error', (e) => {
      console.error('[OverlayPlayer] Audio error:', e);
      state.isPlaying = false;
      state.isLoading = false;
      updateUI();
    });
  }

  function injectUI() {
    if (document.getElementById('gmp')) return;

    const container = document.createElement('aside');
    container.id = 'gmp';
    container.className = 'gmp';
    container.style.display = 'none'; 
    
    container.innerHTML = `
      <div class="gmp__art" id="gmp-art-container">
        <img src="" alt="Artwork" id="gmp-art-img">
        <div class="gmp__loading-overlay" id="gmp-loader">
          <div class="gmp__spinner"></div>
        </div>
      </div>
      <div class="gmp__info" id="gmp-tap-area">
        <div class="gmp__title">
          <span class="gmp__live-dot" id="gmp-live-dot"></span>
          <span id="gmp-title-text">—</span>
        </div>
        <div class="gmp__sub" id="gmp-subtitle-text">—</div>
      </div>
      <div class="gmp__controls">
        <button class="gmp__btn gmp__btn--play" id="gmp-play-btn" aria-label="Play">
          <svg viewBox="0 0 24 24" fill="currentColor" id="gmp-play-svg"><path d="M8 5v14l11-7z"/></svg>
          <div class="gmp__btn-spinner" id="gmp-btn-loader"></div>
        </button>
      </div>
      <div class="gmp__progress">
        <div class="gmp__progress-fill" id="gmp-progress-fill"></div>
      </div>
    `;

    document.body.appendChild(container);
    state.miniPlayerEl = container;

    // Attach UI listeners - using the NEW consistent IDs
    document.getElementById('gmp-play-btn').onclick = (e) => { 
        e.stopPropagation(); 
        if (window.navigator?.vibrate) window.navigator.vibrate(10); // Haptic!
        togglePlayPause(); 
    };
    
    document.getElementById('gmp-tap-area').onclick = () => {
      if (window.navigateTo) window.navigateTo('GurbaniRadio/gurbani-radio.html');
      else window.location.href = 'GurbaniRadio/gurbani-radio.html';
    };

    handlePageChange();
  }

  function handlePageChange() {
    const isPlayerPage = window.location.pathname.toLowerCase().includes('gurbani-radio');
    if (state.miniPlayerEl) {
        if (isPlayerPage) {
            state.miniPlayerEl.style.display = 'none';
            state.miniPlayerEl.classList.remove('gmp--visible');
        } else if (state.audio && state.audio.src) {
            updateUI();
        }
    }
  }

  function updateUI() {
    const el = state.miniPlayerEl;
    if (!el) return;

    // Force hide on player page
    const isPlayerPage = window.location.pathname.toLowerCase().includes('gurbani-radio');
    if (isPlayerPage) {
        el.style.display = 'none';
        el.classList.remove('gmp--visible');
        return;
    }

    const stream = state.streams[state.currentStream];
    // Don't show if nothing is loaded
    if (!stream || (!state.isPlaying && !state.audio?.src)) {
        el.style.display = 'none';
        el.classList.remove('gmp--visible');
        return;
    }

    el.style.display = 'flex';
    el.classList.add('gmp--visible');

    const artImg = document.getElementById('gmp-art-img');
    const titleEl = document.getElementById('gmp-title-text');
    const subEl = document.getElementById('gmp-subtitle-text');
    const liveDot = document.getElementById('gmp-live-dot');
    const playSvg = document.getElementById('gmp-play-svg');
    const loader = document.getElementById('gmp-loader');
    const btnLoader = document.getElementById('gmp-btn-loader');

    if (artImg) artImg.src = stream.artwork;
    if (titleEl) titleEl.textContent = stream.name;
    if (subEl) subEl.textContent = stream.subtitle;
    if (liveDot) liveDot.style.display = stream.type === 'live' ? 'block' : 'none';

    if (loader) loader.classList.toggle('active', state.isLoading);
    if (btnLoader) btnLoader.style.display = state.isLoading ? 'block' : 'none';

    if (playSvg) {
        if (state.isPlaying) {
            playSvg.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
        } else {
            playSvg.innerHTML = `<path d="M8 5v14l11-7z"/>`;
        }
        playSvg.style.opacity = state.isLoading ? '0' : '1';
    }
  }

  async function playStream(streamName) {
    if (!state.streams[streamName]) return;
    
    state.currentStream = streamName;
    const stream = state.streams[streamName];

    state.isLoading = true;
    updateUI();

    const cacheBuster = 't=' + Date.now();
    if (stream.type === 'live') {
      state.audio.src = stream.url + (stream.url.includes('?') ? '&' : '?') + cacheBuster;
    } else {
      state.audio.src = stream.getTrackUrl(state.currentTrackIndex);
    }

    try {
      await state.audio.play();
      saveToStorage();
    } catch (e) {
      console.warn('[OverlayPlayer] Play failed:', e);
    }
    updateUI();
  }

  function togglePlayPause() {
    if (!state.audio.src && state.currentStream) {
        playStream(state.currentStream);
        return;
    }

    if (state.audio.paused) {
      state.audio.play();
    } else {
      state.audio.pause();
    }
  }

  function stopAudio() {
    state.audio.pause();
    state.audio.src = '';
    state.isPlaying = false;
    updateUI();
    localStorage.removeItem('anhad_persistent_audio');
  }

  function playNextTrack() {
    const stream = state.streams[state.currentStream];
    if (stream.type !== 'playlist') return;
    state.currentTrackIndex = (state.currentTrackIndex + 1) % stream.totalTracks;
    playStream(state.currentStream);
  }

  function saveToStorage() {
    localStorage.setItem('anhad_persistent_audio', JSON.stringify({
      stream: state.currentStream,
      trackIndex: state.currentTrackIndex,
      isPlaying: state.isPlaying,
      timestamp: Date.now()
    }));
  }

  function resumeFromStorage() {
    const saved = localStorage.getItem('anhad_persistent_audio');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      // Only keep for 1 hour
      if (Date.now() - data.timestamp < 3600000) {
        state.currentStream = data.stream;
        state.currentTrackIndex = data.trackIndex;
        // Don't auto-play (browsers block it), but show the bar so user can tap Play
        updateUI();
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
