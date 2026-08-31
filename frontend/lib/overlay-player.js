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
  let unsubscribeError = null;
  // Latest error, cleared as soon as audio flows again.
  let lastError = null;
  let retryCount = 0;
  const MAX_RETRIES = 200;

  /**
   * Pages allowed to show the mini player: Homepage, Favorites page, and Sadhsangat page (the last page).
   * No other page should contain the mini player.
   */
  function isMiniPlayerPage() {
    try {
      var p = window.location.pathname.toLowerCase();
      // Remove trailing slash for reliable matching
      if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1);
      
      // 1. Homepage
      if (p === '' || p === '/' || p === '/index.html' || p.endsWith('/frontend') || p.endsWith('/frontend/index.html') || p.endsWith('/anhad-final') || p.endsWith('/anhad-final/index.html')) {
        return true;
      }
      // 2. Favorites page
      if (p.includes('favorites.html') || p.endsWith('/favorites')) {
        return true;
      }
      // 3. The last page (Sadhsangat Live)
      if (p.includes('sadhsangat-live') || p.endsWith('/sadhsangat-live')) {
        return true;
      }
      
      // All other pages (readers, nitnem, settings, calendar, notes, insights, etc.) are strictly excluded
      return false;
    } catch (e) {
      return false;
    }
  }

  function init() {
    if (!isMiniPlayerPage()) {
      console.log('[OverlayPlayer] Not a mini-player page, skipping UI');
      return;
    }

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
      // After a failure, toggle() is the wrong call — it would try to pause a
      // stream that is already dead. Re-issue play() on the current stream so
      // the singleton re-resolves the live position and resets the errored
      // media element.
      const state = window.AnhadAudio.getState();
      if ((state.connectionState === 'failed' || lastError) && !state.isPlaying && state.currentStream) {
        lastError = null;
        window.AnhadAudio.play(state.currentStream);
        return;
      }
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
    if (!miniPlayerEl) return;
    // Belt and braces for the SPA path: those three pages swap without a
    // document load, so init() does not re-run and cannot re-gate.
    const isPlayerPage = window.location.pathname.toLowerCase().includes('gurbani-radio');
    if (isPlayerPage || !isMiniPlayerPage()) {
      miniPlayerEl.style.display = 'none';
      miniPlayerEl.classList.remove('gmp--visible');
      return;
    }
    updateUI();
  }

  function updateUI() {
    if (!miniPlayerEl || !window.AnhadAudio) return;
    if (!isMiniPlayerPage()) {
      miniPlayerEl.style.display = 'none';
      miniPlayerEl.classList.remove('gmp--visible');
      return;
    }

    const state = window.AnhadAudio.getState();
    const currentPath = window.location.pathname.toLowerCase();
    const isPlayerPage = currentPath.includes('gurbani-radio');
    const isDashboardPage = currentPath.includes('dashboard');

    // Hide only when there's genuinely nothing loaded (stop() clears
    // currentStream) or on a page that shouldn't show it — NOT on
    // `!state.isPlaying`, which is also true while paused. That made the
    // mini player vanish the instant its own pause button was tapped, with
    // no way to see it again short of starting playback from elsewhere.
    if (isPlayerPage || isDashboardPage || (!state.currentStream && !state.isLoading)) {
      miniPlayerEl.style.display = 'none';
      miniPlayerEl.classList.remove('gmp--visible');
      // Release the reserved band so pages don't keep an empty gap at the
      // bottom when there is no player to make room for.
      document.body.classList.remove('has-mini-player');
      return;
    }

    miniPlayerEl.style.display = 'flex';
    miniPlayerEl.classList.add('gmp--visible');
    // The mini player is position:fixed, so it does not participate in layout
    // and will sit on top of whatever the page's last content happens to be.
    // This class is the single signal every page uses to reserve scroll runway
    // for it (and to lift floating controls out of its band). Set here because
    // this function is the ONE place the player's visibility is decided.
    document.body.classList.add('has-mini-player');

    const artImg = document.getElementById('gmp-art-img');
    const titleEl = document.getElementById('gmp-title-text');
    const subEl = document.getElementById('gmp-subtitle-text');
    const liveDot = document.getElementById('gmp-live-dot');
    const playSvg = document.getElementById('gmp-play-svg');
    const loader = document.getElementById('gmp-loader');
    const btnLoader = document.getElementById('gmp-btn-loader');

    // Any confirmed playback clears a stale error banner.
    if (state.isPlaying) lastError = null;

    const conn = state.connectionState;
    const isReconnecting = conn === 'reconnecting';
    const hasFailed = conn === 'failed' || (!!lastError && !state.isPlaying && !state.isLoading);

    if (artImg) artImg.src = state.artwork || 'assets/HERO CARD IMAGES/day-darbar-sahib.webp';
    if (titleEl) titleEl.textContent = state.currentTrackTitle;
    // connectionState was previously write-only — nothing in the app read it,
    // so a failed stream looked identical to a paused one.
    if (subEl) {
      if (isReconnecting) subEl.textContent = 'Reconnecting…';
      else if (hasFailed) subEl.textContent = 'Tap to retry';
      else subEl.textContent = state.currentTrackArtist;
    }
    miniPlayerEl.classList.toggle('gmp--error', hasFailed);
    miniPlayerEl.classList.toggle('gmp--reconnecting', isReconnecting);
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
    // The mini player never subscribed to 'error' at all, so a stream could die
    // and the UI would keep showing a pause button over silence with no way for
    // the user to know, let alone retry.
    unsubscribeError = window.AnhadAudio.on('error', (info) => {
      lastError = info || { message: 'Playback error' };
      updateUI();
    });
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
    if (unsubscribeError) unsubscribeError();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pagehide', cleanup);

  // Expose global controller mapping so legacy overlay calls still resolve
  window.AnhadOverlayPlayerUIExposed = true;
  window.AnhadUpdateOverlayUI = updateUI;
})();
