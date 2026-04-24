/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OVERLAY PLAYER V4 — Thin UI Wrapper for AnhadAudio Singleton
 *
 * This file ONLY handles the mini-player UI injection and updates.
 * All audio logic is delegated to window.AnhadAudio (anhad-audio-singleton.js)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // Prevent double-init
  if (window.AnhadOverlayPlayerUI) return;

  let miniPlayerEl = null;
  let unsubscribeStateChange = null;
  let unsubscribeLoading = null;
  let unsubscribeTimeUpdate = null;
  let retryCount = 0;
  const MAX_RETRIES = 50; // 5 seconds max

  /**
   * Initialize the UI wrapper
   */
  function init() {
    console.log('[OverlayPlayerUI] Initializing thin UI wrapper...');

    // Wait for singleton to be available
    if (!window.AnhadAudio) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        console.error('[OverlayPlayerUI] AnhadAudio not available after retries, giving up');
        return;
      }
      console.warn('[OverlayPlayerUI] AnhadAudio not ready, retrying...');
      setTimeout(init, 100);
      return;
    }

    // Inject UI
    injectUI();

    // Subscribe to singleton events
    subscribeToSingleton();

    // Listen for SPA page changes to toggle visibility
    window.addEventListener('anhad_page_changed', handlePageChange);

    // Mark as loaded
    window.AnhadOverlayPlayerUI = true;
    console.log('[OverlayPlayerUI] ✅ UI wrapper ready');
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

    // Attach UI listeners - all delegate to AnhadAudio singleton
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
    if (!miniPlayerEl) return;
    if (!window.AnhadAudio) return;

    const state = window.AnhadAudio.getState();

    // Force hide on player page
    const isPlayerPage = window.location.pathname.toLowerCase().includes('gurbani-radio');
    if (isPlayerPage) {
      miniPlayerEl.style.display = 'none';
      miniPlayerEl.classList.remove('gmp--visible');
      return;
    }

    // Don't show if nothing is loaded
    if (!state.currentStream) {
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

    if (artImg) artImg.src = state.artwork;
    if (titleEl) titleEl.textContent = state.streamName;
    if (subEl) subEl.textContent = state.streamSubtitle;
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

    // Subscribe to state changes
    unsubscribeStateChange = window.AnhadAudio.on('statechange', () => {
      updateUI();
    });

    // Subscribe to loading events
    unsubscribeLoading = window.AnhadAudio.on('loading', () => {
      updateUI();
    });

    // Subscribe to time updates for progress bar
    unsubscribeTimeUpdate = window.AnhadAudio.on('timeupdate', (data) => {
      if (data && data.progress !== undefined) {
        const progressFill = document.getElementById('gmp-progress-fill');
        if (progressFill) progressFill.style.width = data.progress + '%';
      }
    });

    console.log('[OverlayPlayerUI] Subscribed to AnhadAudio events');
  }

  function cleanup() {
    if (unsubscribeStateChange) unsubscribeStateChange();
    if (unsubscribeLoading) unsubscribeLoading();
    if (unsubscribeTimeUpdate) unsubscribeTimeUpdate();
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('pagehide', cleanup);

})();
