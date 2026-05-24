/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD VIRTUAL LIVE INDICATOR — YouTube-style DVR badge
 *
 * Features:
 *   • "● LIVE" badge when at live edge  (offset ≤ 5s)
 *   • "−5m 30s" label when user has scrubbed back
 *   • Clicking badge snaps back to live via AnhadAudio.jumpToLive()
 *   • Auto-shows "● LIVE" button after 10s of pause
 *   • Progress bar shows user position relative to live edge
 *   • Works on both Amritvela Kirtan and Waheguru Simran streams
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  let currentOffsetSeconds = 0;
  let isAtLive = true;
  let pausedAt = null;          // Timestamp when audio was paused
  let pauseCheckTimer = null;   // Timer to auto-show LIVE after 10s pause
  let badgeEl = null;           // The injected badge element
  let progressLiveEl = null;    // Optional: live tick mark on progress bar
  let initialized = false;

  // ─── Format offset as "−5m 30s" or "−45s" ───────────────────────────────
  function formatOffset(secs) {
    if (secs < 60) return `\u2212${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `\u2212${m}m ${s}s` : `\u2212${m}m`;
  }

  // ─── Create the badge element ─────────────────────────────────────────────
  function createBadge() {
    if (document.getElementById('anhad-live-badge')) return;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #anhad-live-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 100px;
        font-size: 13px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        border: none;
        outline: none;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        user-select: none;
        -webkit-user-select: none;
        letter-spacing: 0.02em;
        position: relative;
        overflow: hidden;
        z-index: 10;
        -webkit-tap-highlight-color: transparent;
      }

      /* LIVE state — red pulsing dot */
      #anhad-live-badge.at-live {
        background: rgba(255, 59, 48, 0.18);
        color: #ff3b30;
        border: 1.5px solid rgba(255, 59, 48, 0.35);
      }
      #anhad-live-badge.at-live::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ff3b30;
        flex-shrink: 0;
        animation: anhad-live-pulse 1.8s ease-in-out infinite;
      }
      #anhad-live-badge.at-live:hover {
        background: rgba(255, 59, 48, 0.28);
        transform: scale(1.05);
      }

      /* BEHIND state — grey offset label */
      #anhad-live-badge.behind-live {
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-secondary, #aaa);
        border: 1.5px solid rgba(255, 255, 255, 0.12);
      }
      #anhad-live-badge.behind-live::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--text-secondary, #888);
        flex-shrink: 0;
      }
      #anhad-live-badge.behind-live:hover {
        background: rgba(255, 59, 48, 0.12);
        color: #ff6b6b;
        border-color: rgba(255, 59, 48, 0.3);
        transform: scale(1.05);
      }
      #anhad-live-badge:active { transform: scale(0.96); }

      /* PAUSED-and-behind state */
      #anhad-live-badge.paused-behind {
        background: rgba(255, 59, 48, 0.12);
        color: #ff6b6b;
        border: 1.5px solid rgba(255, 59, 48, 0.25);
        animation: anhad-live-nudge 2s ease-in-out infinite;
      }

      @keyframes anhad-live-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.4; transform: scale(0.7); }
      }
      @keyframes anhad-live-nudge {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,48,0); }
        50%       { box-shadow: 0 0 0 6px rgba(255,59,48,0.15); }
      }
    `;
    document.head.appendChild(style);

    // Create badge button
    badgeEl = document.createElement('button');
    badgeEl.id = 'anhad-live-badge';
    badgeEl.setAttribute('aria-label', 'LIVE — click to return to live position');
    badgeEl.textContent = 'LIVE';
    badgeEl.classList.add('at-live');

    // Click → jump to live
    badgeEl.addEventListener('click', async () => {
      if (!window.AnhadAudio) return;
      badgeEl.style.transform = 'scale(0.9)';
      setTimeout(() => { if (badgeEl) badgeEl.style.transform = ''; }, 200);
      await window.AnhadAudio.jumpToLive();
    });

    return badgeEl;
  }

  // ─── Attach badge to existing player HTML ─────────────────────────────────
  function attachBadge() {
    if (!badgeEl) createBadge();
    if (!badgeEl || document.getElementById('anhad-live-badge')) return;

    // Try to replace the existing static live-indicator span
    const existingLiveSpan = document.querySelector('.live-indicator');
    if (existingLiveSpan) {
      existingLiveSpan.replaceWith(badgeEl);
      return;
    }

    // Or insert after progress labels
    const progressLabels = document.querySelector('.progress-labels');
    if (progressLabels) {
      progressLabels.appendChild(badgeEl);
      return;
    }

    // Fallback: insert before controls
    const controls = document.querySelector('.controls');
    if (controls) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;justify-content:center;margin-bottom:8px;';
      wrapper.appendChild(badgeEl);
      controls.parentNode.insertBefore(wrapper, controls);
    }
  }

  // ─── Update badge based on offset ─────────────────────────────────────────
  function updateBadge(offsetSecs, atLive, paused) {
    if (!badgeEl) return;

    if (atLive && !paused) {
      badgeEl.textContent = 'LIVE';
      badgeEl.className = 'at-live';
      badgeEl.style.cursor = 'default';
    } else if (paused && !atLive && offsetSecs > 10) {
      // Paused more than 10s behind — nudge animation to draw attention
      badgeEl.textContent = formatOffset(offsetSecs);
      badgeEl.className = 'paused-behind';
      badgeEl.style.cursor = 'pointer';
    } else if (!atLive) {
      badgeEl.textContent = formatOffset(offsetSecs);
      badgeEl.className = 'behind-live';
      badgeEl.style.cursor = 'pointer';
    } else {
      // Paused but at live edge
      badgeEl.textContent = 'LIVE';
      badgeEl.className = 'at-live';
      badgeEl.style.cursor = 'default';
    }
  }

  // ─── Handle pause: start counting how long paused ─────────────────────────
  function onPaused() {
    pausedAt = Date.now();
    clearTimeout(pauseCheckTimer);

    // After 10s of pause, show LIVE button prominently if behind
    pauseCheckTimer = setTimeout(() => {
      if (!pausedAt) return; // Was resumed
      if (!badgeEl) return;
      const elapsed = (Date.now() - pausedAt) / 1000;
      if (elapsed >= 10 && currentOffsetSeconds > 5) {
        updateBadge(currentOffsetSeconds, false, true);
      }
    }, 10000);
  }

  function onResumed() {
    pausedAt = null;
    clearTimeout(pauseCheckTimer);
  }

  // ─── Listen to singleton events ───────────────────────────────────────────
  function attachListeners() {
    // Live offset from singleton (fires every 1 second while playing)
    window.addEventListener('anhadLiveOffset', (e) => {
      const { offsetSeconds, isAtLive: live, stream } = e.detail;
      // Only show for playlist streams (not Darbar live which has its own badge)
      if (stream !== 'amritvela' && stream !== 'simran') return;

      currentOffsetSeconds = offsetSeconds;
      isAtLive = live;
      updateBadge(offsetSeconds, live, !!pausedAt);
    });

    // Audio state changes
    window.addEventListener('anhadAudioStateChange', (e) => {
      const { isPlaying } = e.detail;
      if (isPlaying) {
        onResumed();
      } else {
        onPaused();
      }
    });

    // Keyboard shortcut: L key → jump to live
    document.addEventListener('keydown', (e) => {
      if (e.key === 'l' || e.key === 'L') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        if (window.AnhadAudio) window.AnhadAudio.jumpToLive();
      }
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    if (initialized) return;

    // Only activate on Amritvela / Simran player pages
    const isPlaylistPage = window.location.href.includes('gurbani-radio-amritvela') ||
                           window.location.href.includes('gurbani-radio-darbar') ||
                           window.location.href.includes('gurbani-radio.html') ||
                           (window.location.search && window.location.search.includes('stream='));

    // Always inject if AnhadAudio is present and emitting liveoffset
    attachBadge();
    attachListeners();
    initialized = true;

    console.log('[AnhadLiveIndicator] YouTube-style live indicator active');
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Slight delay to ensure player HTML is rendered
    setTimeout(init, 50);
  }

  // Expose for debugging
  window.AnhadLiveIndicator = {
    getOffset: () => currentOffsetSeconds,
    isAtLive: () => isAtLive,
    forceRefresh: () => updateBadge(currentOffsetSeconds, isAtLive, !!pausedAt)
  };

})();
