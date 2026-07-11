(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // ANHAD — Ultra-Robust Session Check v3.0
  //
  // NEVER show the splash screen if ANY of these are true:
  //  1. SPA engine is already loaded (back-nav via popstate/SPA swap)
  //  2. sessionStorage.anhad_welcomed = '1' (same browser tab session)
  //  3. localStorage.anhad_welcome_seen = 'true' (user has ever launched the app)
  //  4. localStorage.anhad_session_active_ts within last 24h
  //  5. Running inside Capacitor WebView (capacitor:// protocol)
  //  6. Referrer is from our own origin (internal navigation)
  //  7. URL hash contains '#app' or '?spa=' (SPA back-nav)
  //  8. HomeStateManager indicates we're returning from navigation (NEW)
  // ═══════════════════════════════════════════════════════════════════════

  var ACTIVE_KEY  = 'anhad_session_active_ts';
  var SEEN_KEY    = 'anhad_welcome_seen';
  var SESSION_KEY = 'anhad_welcomed';
  // 24 hours — covers Capacitor/Android cold restarts, PWA re-opens
  var ACTIVE_WINDOW_MS = 86400000;

  function bypass() {
    // Always stamp sessionStorage + localStorage so all paths stay unlocked
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch(e) {}
    try { localStorage.setItem(SEEN_KEY, 'true'); } catch(e) {}
    try { localStorage.setItem(ACTIVE_KEY, Date.now().toString()); } catch(e) {}
  }

  // 1) SPA engine already running
  if (typeof window.navigateTo === 'function') { bypass(); return; }

  // 2) Same session
  try { if (sessionStorage.getItem(SESSION_KEY) === '1') { bypass(); return; } } catch(e) {}

  // 3) User has EVER launched the app (persists across restarts)
  try {
    var seen = localStorage.getItem(SEEN_KEY);
    if (seen === 'true' || seen === '1') { bypass(); return; }
  } catch(e) {}

  // 4) Active within the last 24 hours
  try {
    var lastActive = parseInt(localStorage.getItem(ACTIVE_KEY) || '0', 10);
    if ((Date.now() - lastActive) < ACTIVE_WINDOW_MS) { bypass(); return; }
  } catch(e) {}

  // 5) Capacitor / WebView — never show splash in native context
  try {
    if (window.location.protocol === 'capacitor:' ||
        window.Capacitor ||
        (window.location.hostname === 'localhost' && navigator.userAgent.indexOf('wv') !== -1)) {
      bypass(); return;
    }
  } catch(e) {}

  // 6) Internal navigation (same-origin referrer)
  try {
    var ref = document.referrer;
    if (ref && (
      ref.indexOf(window.location.hostname) !== -1 ||
      ref.indexOf('file://') !== -1 ||
      ref.indexOf('capacitor://') !== -1 ||
      ref.indexOf('localhost') !== -1
    )) { bypass(); return; }
  } catch(e) {}

  // 7) SPA back-nav indicators in URL
  try {
    var search = window.location.search;
    var hash   = window.location.hash;
    if (search.indexOf('spa=') !== -1 || hash.indexOf('#app') !== -1) {
      bypass(); return;
    }
  } catch(e) {}

  // 8) NEW: Check if HomeStateManager indicates returning from navigation
  try {
    if (window.HomeStateManager && window.HomeStateManager.isReturningFromNavigation()) {
      bypass(); return;
    }
  } catch(e) {}

  // ─── COLD START: Truly first visit → redirect to welcome/splash ───
  // Mark as seen BEFORE redirect so the splash itself won't loop
  try { localStorage.setItem(SEEN_KEY, 'true'); } catch(e) {}
  window.location.replace('./Homepage/ios-homepage.html');
})();
