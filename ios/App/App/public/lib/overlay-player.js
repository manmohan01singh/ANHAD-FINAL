/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OVERLAY PLAYER (UI WRAPPER)
 * 
 * Thin UI wrapper that delegates 100% of playback logic to window.AnhadAudio.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // Prevent double-init
  if (window.AnhadOverlayPlayerUI) {
    console.log('[OverlayPlayer] Overlay UI already loaded, skipping duplicate init');
    return;
  }

  let miniPlayerEl = null;
  let unsubscribeStateChange = null;
  let unsubscribeLoading = null;
  let unsubscribeTimeUpdate = null;
  let retryCount = 0;
  const MAX_RETRIES = 200;

  function init() {
    console.log('[OverlayPlayer] Initializing thin UI wrapper...');

    if (!window.AnhadAudio) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        console.error('[OverlayPlayer] AnhadAudio singleton not available, aborting');
        return;
      }
      setTimeout(init, 100);
      return;
    }

    injectUI();
    subscribeToSingleton();

    window.addEventListener('anhad_page_changed', handlePageChange);
    window.AnhadOverlayPlayerUI = true;
    console.log('[OverlayPlayer] ✅ Thin UI wrapper initialized successfully');
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
        <button class="gmp__btn gmp__btn--close" id="gmp-close-btn" aria-label="Close">×</button>
      </div>
      <div class="gmp__progress">
        <div class="gmp__progress-fill" id="gmp-progress-fill"></div>
      </div>
    `;

    document.body.appendChild(container);
    miniPlayerEl = container;

    // Button actions
    document.getElementById('gmp-play-btn').onclick = (e) => {
      e.stopPropagation();
      if (window.navigator?.vibrate) window.navigator.vibrate(10);
      window.AnhadAudio.toggle();
    };

    document.getElementById('gmp-tap-area').onclick = () => {
      const state = window.AnhadAudio.getState();
      const url = state.playerPage || 'GurbaniRadio/gurbani-radio.html';
      if (window.navigateTo) window.navigateTo(url);
      else window.location.href = url;
    };

    document.getElementById('gmp-close-btn').onclick = (e) => {
      e.stopPropagation();
      window.AnhadAudio.stop();
    };

    handlePageChange();
  }

  function handlePageChange() {
    const isPlayerPage = window.location.pathname.toLowerCase().includes('gurbani-radio');
    if (miniPlayerEl) {
      if (isPlayerPage) {
        miniPlayerEl.style.display = 'none';
        miniPlayerEl.classList.remove('gmp--visible');
      } else {
        updateUI();
      }
    }
  }

  function updateUI() {
    if (!miniPlayerEl || !window.AnhadAudio) return;

    const state = window.AnhadAudio.getState();
    const currentPath = window.location.pathname.toLowerCase();
    const isPlayerPage = currentPath.includes('gurbani-radio');
    const isDashboardPage = currentPath.includes('dashboard');

    if (isPlayerPage || isDashboardPage || (!state.isPlaying && !state.isLoading)) {
      miniPlayerEl.style.display = 'none';
      miniPlayerEl.classList.remove('gmp--visible');
      return;
    }

    miniPlayerEl.style.display = 'flex';
    miniPlayerEl.classList.add('gmp--visible');

    const artImg = document.getElementById('gmp-art-img');
    const titleEl = document.getElementById('gmp-title-text');
    const subEl = document.getElementById('gmp-subtitle-text');
    const liveDot = document.getElementById('gmp-live-dot');
    const playSvg = document.getElementById('gmp-play-svg');
    const loader = document.getElementById('gmp-loader');
    const btnLoader = document.getElementById('gmp-btn-loader');

    if (artImg) artImg.src = state.artwork || 'assets/HERO CARD IMAGES/day-darbar-sahib.webp';
    if (titleEl) titleEl.textContent = state.currentTrackTitle;
    if (subEl) subEl.textContent = state.currentTrackArtist;
    if (liveDot) liveDot.style.display = state.streamType === 'live' ? 'block' : 'none';

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

  function subscribeToSingleton() {
    if (!window.AnhadAudio) return;

    unsubscribeStateChange = window.AnhadAudio.on('statechange', updateUI);
    unsubscribeLoading = window.AnhadAudio.on('loading', updateUI);
    unsubscribeTimeUpdate = window.AnhadAudio.on('timeupdate', (data) => {
      if (data && data.progress !== undefined) {
        const progressFill = document.getElementById('gmp-progress-fill');
        if (progressFill) progressFill.style.width = data.progress + '%';
      }
    });
  }

  function cleanup() {
    if (unsubscribeStateChange) unsubscribeStateChange();
    if (unsubscribeLoading) unsubscribeLoading();
    if (unsubscribeTimeUpdate) unsubscribeTimeUpdate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pagehide', cleanup);

  // Expose global controller mapping so legacy overlay calls still resolve
  window.AnhadOverlayPlayerUIExposed = true;
})();
