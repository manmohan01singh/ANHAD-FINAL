/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD CLIENT COMMUNITY PRESENCE COORDINATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * Sends periodic lightweight heartbeats and powers the live community indicators.
 */

(function(window) {
  'use strict';

  if (window.CommunityPresence) return;

  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  let heartbeatTimer = null;
  let latestPresence = {
    totalActive: 1,
    byActivity: { listening: 0, live_stream: 0, nitnem: 0, sehaj_paath: 0, simran: 0, idle: 1 }
  };

  function detectCurrentActivity() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('sadhsangat-live')) {
      return 'live_stream';
    }
    if (window.AnhadAudio && window.AnhadAudio.getState && window.AnhadAudio.getState().isPlaying) {
      return 'listening';
    }
    if (path.includes('reader.html') || path.includes('nitnem')) {
      return 'nitnem';
    }
    if (path.includes('sehajpaath')) {
      return 'sehaj_paath';
    }
    if (path.includes('simran') || path.includes('mala')) {
      return 'simran';
    }
    return 'idle';
  }

  async function sendHeartbeat() {
    try {
      const auth = window.AnhadAuth ? window.AnhadAuth.getProfile() : { uid: 'anon' };
      let streak = 0;
      try {
        const streakData = JSON.parse(localStorage.getItem('anhad_streak_data') || '{}');
        streak = streakData.currentStreak || 0;
      } catch (e) {}

      const payload = {
        id: auth.uid,
        activity: detectCurrentActivity(),
        streak,
        displayName: auth.displayName,
        isPublic: auth.privacy ? auth.privacy.showOnLeaderboard : false
      };

      const res = await fetch('/api/community/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.presence) {
          latestPresence = data.presence;
          updateCommunityTicker(latestPresence);
          window.dispatchEvent(new CustomEvent('anhad_community_updated', { detail: latestPresence }));
        }
      }
    } catch (e) {
      // Offline / network hiccup handled quietly
    }
  }

  function updateCommunityTicker(presence) {
    const el = document.getElementById('communityLiveTicker');
    if (!el) return;

    const total = presence.totalActive || 1;
    const listening = presence.byActivity?.listening || 0;
    const nitnem = presence.byActivity?.nitnem || 0;

    el.innerHTML = `
      <span class="ticker-pulse"></span>
      <span class="ticker-count">${total.toLocaleString()}</span> Sangat connected now
      ${listening > 0 ? ` • <span class="ticker-sub">${listening.toLocaleString()} listening</span>` : ''}
      ${nitnem > 0 ? ` • <span class="ticker-sub">${nitnem.toLocaleString()} in Nitnem</span>` : ''}
    `;
  }

  function start() {
    if (heartbeatTimer) return;
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }

  function stop() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
    window.addEventListener('anhad_page_changed', sendHeartbeat);
    window.addEventListener('focus', sendHeartbeat);
  }

  window.CommunityPresence = {
    start,
    stop,
    sendHeartbeat,
    getLatestPresence: () => latestPresence
  };
})(typeof window !== 'undefined' ? window : globalThis);
