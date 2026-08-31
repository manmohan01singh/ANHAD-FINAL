/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD CORE JS
 * Smart back navigation · Page transitions · Offline banner · Haptics
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL APP ROOT RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════
(function() {
    if (!window.ANHAD_ROOT) {
        const path = window.location.pathname;
        const marker = '/frontend/';
        const idx = path.indexOf(marker);
        if (idx !== -1) {
            window.ANHAD_ROOT = window.location.origin + path.substring(0, idx + marker.length);
        } else {
            // Fallback for local development
            window.ANHAD_ROOT = window.location.origin + '/';
        }
        console.log('[ANHAD] Global Root Resolved:', window.ANHAD_ROOT);
    }
})();

(function AnhadCore() {
  'use strict';

  /* ─── SVG chevron used in back buttons ──────────────────────────────────── */
  const CHEVRON_SVG = `<svg class="back-chevron" viewBox="0 0 9 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 1L1 8L8 15" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  /* ─── Haptic feedback ────────────────────────────────────────────────────── */
  function haptic(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern || 8);
    } catch (_) {}
  }

  /* ─── Smart back navigation ─────────────────────────────────────────────── */
  function initBack(homeHref) {
    const fallback = homeHref || _resolveHome();

    document.querySelectorAll(
      '.glass-nav__back, .glass-back-btn, [data-anhad-back]'
    ).forEach(function(btn) {
      // Skip if already wired by smart-back.js v2
      if (btn._anhadBackWired) return;

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        haptic(8);
        // Delegate to unified smart-back navigation
        if (window.anhadGoBack) {
          window.anhadGoBack(fallback);
        } else if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = fallback;
        }
      });

      // Ensure back buttons have the chevron + label if they are empty
      if (!btn.querySelector('.back-chevron') && !btn.querySelector('svg')) {
        const label = btn.dataset.label || btn.textContent.trim() || 'Back';
        btn.innerHTML = CHEVRON_SVG +
          '<span class="back-label">' + _escHtml(label) + '</span>';
      }
    });
  }

  function _resolveHome() {
    const depth = (window.location.pathname.match(/\//g) || []).length;
    if (depth <= 1) return '/index.html';
    return '../index.html';
  }

  function _escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ─── Page-enter transition ─────────────────────────────────────────────── */
  function initTransition(selector) {
    // NATIVE APP FIX: Skip page-enter animation if returning to Home
    const isReturning = window.HomeStateManager?.isReturningFromNavigation();
    const hasPlayedAnimations = window.HomeStateManager?.hasPlayedAnimations();
    
    if (isReturning && hasPlayedAnimations) {
      // Skip animation - just show content instantly
      return;
    }
    
    var el = selector
      ? document.querySelector(selector)
      : (document.querySelector('.page-enter') || document.querySelector('.app') || document.body);

    if (!el) return;
    el.classList.add('page-enter');

    // The class is deliberately NOT removed here any more.
    //
    // animationend BUBBLES, so the first staggered child's event (0.48s) used
    // to fire this {once:true} handler while children 2-5 were still animating
    // (0.52s-0.64s). Dropping .page-enter mid-flight made them stop matching
    // `.page-enter > *:nth-child(N)` and fall through to index.html's
    // `.app > * { animation: anhad-enter ... }` — a newly-matching animation
    // rule always restarts, so they blinked back to opacity:0 and replayed.
    // That was the second of the two reported flashes.
    //
    // Waiting for the container's own animation instead does not help either:
    // it finishes at 0.5s, still ahead of children 4 and 5. And Home ships
    // class="app page-enter" in its static markup, which the SPA copies back
    // onto #app via syncElementAttributes on every return — so a removed class
    // gets re-added, restarting the animation and flashing again. Leaving it in
    // place makes that copy a no-op. The finished animations hold their end
    // state via their `both`/`forwards` fill, and
    // `.app:not(.app--exiting) { opacity: 1 !important }` keeps the container
    // visible on bfcache restore regardless.
    el.addEventListener('animationend', function handler(e) {
      if (e.target !== el) return;
      el.removeEventListener('animationend', handler);
      if (window.HomeStateManager) {
        window.HomeStateManager.markAnimationsPlayed();
      }
    });
  }

  /* ─── Offline banner ─────────────────────────────────────────────────────── */
  function initOfflineBanner() {
    var banner = document.querySelector('.ac-offline-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'ac-offline-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      document.body.prepend(banner);
    }

    function _render(isOnline) {
      if (isOnline) {
        banner.innerHTML = '<em class="ac-offline-banner__icon">✓</em> Back online';
        banner.classList.remove('visible');
        banner.classList.add('online');
        banner.classList.add('visible');
        setTimeout(function() {
          banner.classList.remove('visible');
          setTimeout(function() { banner.classList.remove('online'); }, 400);
        }, 2200);
      } else {
        banner.innerHTML = '<em class="ac-offline-banner__icon">⚡</em> You\'re offline — cached content shown';
        banner.classList.remove('online');
        banner.classList.add('visible');
      }
    }

    if (!navigator.onLine) _render(false);

    // AnhadCore.init() is re-run by smooth-navigation.js on every SPA
    // navigation, so an unguarded pair here stacked one more online/offline
    // handler per page change for the whole session.
    if (window.__anhadCoreOfflineBound) return;
    window.__anhadCoreOfflineBound = true;

    window.addEventListener('offline', function() { _render(false); });
    window.addEventListener('online',  function() { _render(true);  });
  }

  /* ─── Compact nav on scroll ─────────────────────────────────────────────── */
  function initNavCompact() {
    if (window.__anhadCoreNavCompactBound) return;
    window.__anhadCoreNavCompactBound = true;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          // Re-resolved per tick: the previous version captured .glass-nav at
          // init time, and the SPA content swap detaches that node.
          var nav = document.querySelector('.glass-nav');
          if (nav) nav.classList.toggle('compact', window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── Tappable spring feedback (supplement CSS :active) ─────────────────── */
  function initHaptics() {
    // One document-level listener per session, not per navigation. Each copy
    // ran a closest() tree walk on every tap, so after N page changes a single
    // tap did N walks before the click dispatched.
    if (window.__anhadCoreHapticsBound) return;
    window.__anhadCoreHapticsBound = true;
    document.addEventListener('pointerdown', function(e) {
      if (e.pointerType === 'touch') {
        var t = e.target.closest('.tappable, .glass-nav__back, .glass-back-btn, .icon-btn, .glass-nav__action-btn');
        if (t) haptic(6);
      }
    }, { passive: true });
  }

  /* ─── Public API ─────────────────────────────────────────────────────────── */
  window.AnhadCore = {
    initBack:         initBack,
    initTransition:   initTransition,
    initOfflineBanner: initOfflineBanner,
    initNavCompact:   initNavCompact,
    initHaptics:      initHaptics,

    /** Call once — runs all init functions */
    init: function(opts) {
      var o = opts || {};
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          _runAll(o);
        });
      } else {
        _runAll(o);
      }
    }
  };

  function _runAll(o) {
    if (window.AnhadSvgSprite && typeof window.AnhadSvgSprite.ensure === 'function') {
      window.AnhadSvgSprite.ensure();
    }
    initBack(o.homeHref);
    if (o.transition !== false) initTransition(o.transitionSelector);
    initOfflineBanner();
    initNavCompact();
    initHaptics();
  }

  /* Auto-init if data-anhad-core attribute present on <html> or <body> */
  function refreshSessionFlags() {
    try {
      localStorage.setItem('anhad_session_active_ts', Date.now().toString());
      sessionStorage.setItem('anhad_welcomed', '1');
      // Set a long-term flag once they've entered the app successfully
      localStorage.setItem('anhad_welcome_seen', 'true');
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function() {
    refreshSessionFlags();
    var autoEl = document.documentElement.dataset.anhadCore || document.body.dataset.anhadCore;
    if (autoEl !== undefined) {
      _runAll({});
    }
  });

  // Also refresh on every SPA page swap
  window.addEventListener('anhad_page_changed', refreshSessionFlags);
})();
