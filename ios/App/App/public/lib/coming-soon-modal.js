/**
 * ═══════════════════════════════════════════════════════════════════════
 * ANHAD — SHARED "COMING SOON" MODAL
 * One reusable placeholder dialog for any feature that isn't shipped yet.
 * Requires css/coming-soon-modal.css to be linked on the page.
 *
 * Usage A — declarative (no extra JS needed):
 *   <button data-coming-soon
 *           data-cs-title="Shabad Vichar"
 *           data-cs-gurmukhi="ਸ਼ਬਦ ਵਿਚਾਰ"
 *           data-cs-feature="Deep Gurbani Contemplation"
 *           data-cs-desc="A guided space for daily Shabad reflection.">
 *     Shabad Vichar
 *   </button>
 *   Any element (link, card, button) with [data-coming-soon] is
 *   auto-wired on DOMContentLoaded: click/Enter/Space opens the modal
 *   instead of navigating, Escape and backdrop-click close it.
 *
 * Usage B — imperative:
 *   window.AnhadComingSoon.show({ title, gurmukhi, feature, desc });
 *   window.AnhadComingSoon.hide();
 * ═══════════════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';

  if (window.AnhadComingSoon) return; // prevent double-init across SPA swaps

  var overlay = null;
  var card = null;
  var closeBtn = null;
  var lastFocused = null;

  function ensureDom() {
    if (overlay) return;
    overlay = document.getElementById('anhadComingSoonOverlay');
    if (overlay) {
      card = document.getElementById('anhadComingSoonCard');
      closeBtn = card ? card.querySelector('.cs-close') : null;
      wireStaticDom();
      return;
    }

    overlay = document.createElement('div');
    overlay.id = 'anhadComingSoonOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Coming soon');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div id="anhadComingSoonCard">' +
        '<div class="cs-badge-pill"><span class="cs-badge-dot"></span><span class="cs-badge-text">COMING SOON</span></div>' +
        '<div class="cs-ik-onkar" id="csIkOnkar">ੴ</div>' +
        '<div class="cs-title" id="csTitle"></div>' +
        '<div class="cs-gurmukhi-subtitle" id="csGurmukhi"></div>' +
        '<div class="cs-feature" id="csFeature"></div>' +
        '<div class="cs-desc" id="csDesc"></div>' +
        '<button class="cs-close ios-haptic" id="anhadComingSoonClose">ਵਾਹਿਗੁਰੂ &nbsp;✓</button>' +
      '</div>';
    document.body.appendChild(overlay);
    card = overlay.querySelector('#anhadComingSoonCard');
    closeBtn = overlay.querySelector('#anhadComingSoonClose');
    wireStaticDom();
  }

  function wireStaticDom() {
    if (overlay._wired) return;
    overlay._wired = true;

    if (closeBtn) closeBtn.addEventListener('click', hide);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) hide();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) hide();
      // Minimal focus trap: only one focusable control (Close) lives in
      // the modal, so Tab/Shift+Tab should just keep returning to it.
      if (e.key === 'Tab' && overlay.classList.contains('active') && closeBtn) {
        e.preventDefault();
        closeBtn.focus();
      }
    });
  }

  function show(opts) {
    opts = opts || {};
    ensureDom();

    setText('csTitle', opts.title || 'Coming Soon');
    setText('csGurmukhi', opts.gurmukhi || '');
    setText('csFeature', opts.feature || '');
    setText('csDesc', opts.desc || 'Stay tuned — this feature is on its way! 🙏');
    var ikOnkar = overlay.querySelector('#csIkOnkar');
    if (ikOnkar) ikOnkar.style.display = opts.hideIkOnkar ? 'none' : '';

    lastFocused = document.activeElement;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    if (navigator.vibrate) { try { navigator.vibrate([10, 30, 10]); } catch (e) {} }
    if (closeBtn) closeBtn.focus();
  }

  function setText(id, text) {
    var el = overlay.querySelector('#' + id);
    if (!el) return;
    if (!text) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.textContent = text;
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus(); } catch (e) {}
    }
  }

  function autoWire() {
    var triggers = document.querySelectorAll('[data-coming-soon]');
    triggers.forEach(function(el) {
      if (el._comingSoonWired) return;
      el._comingSoonWired = true;

      var open = function(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        show({
          title: el.getAttribute('data-cs-title'),
          gurmukhi: el.getAttribute('data-cs-gurmukhi'),
          feature: el.getAttribute('data-cs-feature'),
          desc: el.getAttribute('data-cs-desc')
        });
      };

      el.addEventListener('click', open);
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') open(e);
      });
    });
  }

  window.AnhadComingSoon = { show: show, hide: hide, autoWire: autoWire };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoWire);
  } else {
    autoWire();
  }

  // Re-scan after SPA swaps (smooth-navigation.js fires this on #app replace).
  window.addEventListener('anhad_page_changed', autoWire);
})();
