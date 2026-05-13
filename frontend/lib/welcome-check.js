(function() {
  'use strict';
  
  // UNIFIED welcome check
  var isCapacitor = typeof window.Capacitor !== 'undefined' || (window.webkit && window.webkit.messageHandlers);
  var isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // FIX: Prevent double-splash on back navigation.
  // We use a timestamp marker: if the app was active within the last 2 hours,
  // we treat this as a session continuation (not a cold start) and skip splash.
  var ACTIVE_KEY = 'anhad_session_active_ts';
  var ACTIVE_WINDOW_MS = 7200000; // 2 hours
  
  var lastActive = 0;
  try {
    lastActive = parseInt(localStorage.getItem(ACTIVE_KEY) || '0', 10);
  } catch (e) {}
  
  var sessionActive = (Date.now() - lastActive) < ACTIVE_WINDOW_MS;

  // Also treat navigating from an internal page (referrer check)
  var isInternalNav = document.referrer && (
    document.referrer.indexOf(window.location.hostname) !== -1 ||
    document.referrer.indexOf('file://') !== -1 ||
    document.referrer.indexOf('capacitor://') !== -1 ||
    document.referrer.indexOf('localhost') !== -1
  );

  // CRITICAL: Check if we are already inside the SPA shell
  // We check for window.navigateTo (SPA engine) or mainNav (persistent shell element)
  var isSPA = typeof window.navigateTo === 'function' || !!document.getElementById('mainNav');
  
  var seenBefore = false;
  try {
    seenBefore = localStorage.getItem('anhad_welcome_seen') === 'true';
  } catch (e) {}

  if (sessionStorage.getItem('anhad_welcomed') === '1' || isSPA) {
    // Already in SPA or already entered in this session
    try {
      sessionStorage.setItem('anhad_welcomed', '1');
    } catch (e) {}
  } else {
    // Cold start - redirect to splash
    window.location.replace('./Homepage/ios-homepage.html');
  }
})();
