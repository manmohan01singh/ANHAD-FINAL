/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD CORE JS
 * Smart back navigation · Page transitions · Offline banner · Haptics
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        haptic(8);
        if (window.history.length > 1) {
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
    var el = selector
      ? document.querySelector(selector)
      : (document.querySelector('.page-enter') || document.querySelector('.app') || document.body);

    if (!el) return;
    el.classList.add('page-enter');

    // Remove after animation completes so bfcache restore looks right
    el.addEventListener('animationend', function handler() {
      el.classList.remove('page-enter');
      el.removeEventListener('animationend', handler);
    }, { once: true });
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

    window.addEventListener('offline', function() { _render(false); });
    window.addEventListener('online',  function() { _render(true);  });
  }

  /* ─── Compact nav on scroll ─────────────────────────────────────────────── */
  function initNavCompact() {
    var nav = document.querySelector('.glass-nav');
    if (!nav) return;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          nav.classList.toggle('compact', window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── Tappable spring feedback (supplement CSS :active) ─────────────────── */
  function initHaptics() {
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
    initBack(o.homeHref);
    if (o.transition !== false) initTransition(o.transitionSelector);
    initOfflineBanner();
    initNavCompact();
    initHaptics();
  }

  /* Auto-init if data-anhad-core attribute present on <html> or <body> */
  document.addEventListener('DOMContentLoaded', function() {
    var autoEl = document.documentElement.dataset.anhadCore || document.body.dataset.anhadCore;
    if (autoEl !== undefined) {
      _runAll({});
    }
  });
})();
