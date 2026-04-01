/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUDIO PRELOAD — Ultra-Fast Audio Resumption
 * 
 * This script runs BEFORE the main audio system loads to:
 * 1. Immediately create a hidden audio element
 * 2. Preload the last playing stream from localStorage
 * 3. Minimize the gap when navigating between pages
 * 
 * Load this FIRST, before any other audio scripts.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const STATE_KEY = 'anhad_global_audio';
  const RESUME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  // Get saved state
  function loadState() {
    try {
      const s = localStorage.getItem(STATE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }

  // Check if we should preload
  const state = loadState();
  if (!state || !state.isPlaying) return;
  if (Date.now() - (state.timestamp || 0) > RESUME_THRESHOLD_MS) return;

  // Don't preload on player pages
  const currentPath = window.location.pathname.toLowerCase();
  const isPlayerPage = currentPath.includes('gurbani-radio');
  if (isPlayerPage) return;

  // Create hidden audio element for preloading
  const preloadAudio = new Audio();
  preloadAudio.preload = 'auto';
  preloadAudio.volume = state.volume || 0.8;
  preloadAudio.style.display = 'none';

  // Determine stream URL
  let streamUrl = '';
  if (state.stream === 'darbar') {
    streamUrl = 'https://live.sgpc.net:8443/;nocache=1';
  } else if (state.stream === 'amritvela') {
    const trackIndex = state.trackIndex || 0;
    const trackNum = ((trackIndex % 40) + 40) % 40 + 1;
    streamUrl = `https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev/day-${trackNum}.webm`;
  }

  if (streamUrl) {
    // Start preloading immediately
    preloadAudio.src = streamUrl;
    preloadAudio.load();

    // Store reference for main audio system to use
    window.__anhadPreloadedAudio = {
      audio: preloadAudio,
      stream: state.stream,
      trackIndex: state.trackIndex,
      timestamp: Date.now()
    };

    console.log('[AudioPreload] ⚡ Preloading:', state.stream);
  }
})();
