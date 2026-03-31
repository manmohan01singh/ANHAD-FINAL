/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD POPUP — Unified Glassmorphism Popup & Toast System
 *
 * Replaces ALL native alert(), confirm(), prompt() calls and legacy modal
 * implementations across the ANHAD app with a premium glassmorphism UI.
 *
 * Usage:
 *   AnhadPopup.alert({ title, message, icon? })          → Promise<void>
 *   AnhadPopup.confirm({ title, message, icon? })        → Promise<boolean>
 *   AnhadPopup.prompt({ title, message, placeholder? })  → Promise<string|null>
 *   AnhadPopup.toast(message, { type?, duration? })      → void
 *
 * The CSS must be loaded via <link rel="stylesheet" href="css/anhad-clay.css">
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // ─── ICON MAP ────────────────────────────────────────────────────────────
  const ICONS = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
    confirm: '🤔',
    prayer:  '🙏',
    bell:    '🔔',
    star:    '⭐',
  };

  const TOAST_ICONS = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  let toastTimer = null;

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'anhad-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    return overlay;
  }

  function createPanel() {
    const panel = document.createElement('div');
    panel.className = 'anhad-popup-panel';
    return panel;
  }

  function createIconStrip(type) {
    const strip = document.createElement('div');
    strip.className = 'anhad-popup-icon-strip';
    const icon = document.createElement('div');
    icon.className = `anhad-popup-icon anhad-popup-icon--${type || 'info'}`;
    icon.textContent = ICONS[type] || ICONS.info;
    icon.setAttribute('aria-hidden', 'true');
    strip.appendChild(icon);
    return strip;
  }

  function createContent(title, message) {
    const content = document.createElement('div');
    content.className = 'anhad-popup-content';
    if (title) {
      const h = document.createElement('h3');
      h.className = 'anhad-popup-title';
      h.textContent = title;
      content.appendChild(h);
    }
    if (message) {
      const p = document.createElement('p');
      p.className = 'anhad-popup-message';
      p.textContent = message;
      content.appendChild(p);
    }
    return content;
  }

  function createActions(buttons) {
    const wrap = document.createElement('div');
    wrap.className = 'anhad-popup-actions';
    buttons.forEach(({ label, type, onClick }) => {
      const btn = document.createElement('button');
      btn.className = `anhad-popup-btn anhad-popup-btn--${type || 'primary'}`;
      btn.textContent = label;
      btn.addEventListener('click', onClick);
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function showOverlay(overlay) {
    document.body.appendChild(overlay);
    // Force reflow for transition
    void overlay.offsetHeight;
    requestAnimationFrame(() => overlay.classList.add('visible'));
  }

  function closeOverlay(overlay) {
    return new Promise(resolve => {
      overlay.classList.add('closing');
      overlay.classList.remove('visible');
      const done = () => {
        overlay.remove();
        resolve();
      };
      overlay.addEventListener('transitionend', function handler(e) {
        if (e.target === overlay) {
          overlay.removeEventListener('transitionend', handler);
          done();
        }
      });
      // Fallback — always clean up
      setTimeout(done, 400);
    });
  }

  // ─── ALERT ───────────────────────────────────────────────────────────────
  function anhadAlert({ title = 'Notice', message = '', icon = 'info', buttonText = 'OK' } = {}) {
    return new Promise(resolve => {
      const overlay = createOverlay();
      const panel = createPanel();

      panel.appendChild(createIconStrip(icon));
      panel.appendChild(createContent(title, message));
      panel.appendChild(createActions([
        {
          label: buttonText,
          type: 'primary',
          onClick: async () => { await closeOverlay(overlay); resolve(); }
        }
      ]));

      // Close on backdrop click
      overlay.addEventListener('click', async (e) => {
        if (e.target === overlay) { await closeOverlay(overlay); resolve(); }
      });

      // Close on Escape
      const onKey = async (e) => {
        if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); await closeOverlay(overlay); resolve(); }
      };
      document.addEventListener('keydown', onKey);

      overlay.appendChild(panel);
      showOverlay(overlay);

      // Auto-focus the button
      panel.querySelector('.anhad-popup-btn')?.focus();
    });
  }

  // ─── CONFIRM ─────────────────────────────────────────────────────────────
  function anhadConfirm({
    title = 'Confirm',
    message = '',
    icon = 'confirm',
    confirmText = 'Yes',
    cancelText = 'Cancel',
    danger = false
  } = {}) {
    return new Promise(resolve => {
      const overlay = createOverlay();
      const panel = createPanel();

      panel.appendChild(createIconStrip(icon));
      panel.appendChild(createContent(title, message));
      panel.appendChild(createActions([
        {
          label: cancelText,
          type: 'secondary',
          onClick: async () => { await closeOverlay(overlay); resolve(false); }
        },
        {
          label: confirmText,
          type: danger ? 'danger' : 'primary',
          onClick: async () => { await closeOverlay(overlay); resolve(true); }
        }
      ]));

      // Backdrop → cancel
      overlay.addEventListener('click', async (e) => {
        if (e.target === overlay) { await closeOverlay(overlay); resolve(false); }
      });

      const onKey = async (e) => {
        if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); await closeOverlay(overlay); resolve(false); }
      };
      document.addEventListener('keydown', onKey);

      overlay.appendChild(panel);
      showOverlay(overlay);
    });
  }

  // ─── PROMPT ──────────────────────────────────────────────────────────────
  function anhadPrompt({
    title = 'Input',
    message = '',
    icon = 'info',
    placeholder = '',
    defaultValue = '',
    confirmText = 'OK',
    cancelText = 'Cancel'
  } = {}) {
    return new Promise(resolve => {
      const overlay = createOverlay();
      const panel = createPanel();

      panel.appendChild(createIconStrip(icon));
      panel.appendChild(createContent(title, message));

      // Input field
      const inputWrap = document.createElement('div');
      inputWrap.className = 'anhad-popup-input-wrap';
      const input = document.createElement('input');
      input.className = 'anhad-popup-input';
      input.type = 'text';
      input.placeholder = placeholder;
      input.value = defaultValue;
      inputWrap.appendChild(input);
      panel.appendChild(inputWrap);

      const submit = async () => { await closeOverlay(overlay); resolve(input.value); };
      const cancel = async () => { await closeOverlay(overlay); resolve(null); };

      panel.appendChild(createActions([
        { label: cancelText, type: 'secondary', onClick: cancel },
        { label: confirmText, type: 'primary', onClick: submit }
      ]));

      // Enter to submit
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

      // Backdrop & Escape → cancel
      overlay.addEventListener('click', async (e) => { if (e.target === overlay) cancel(); });
      const onKey = async (e) => {
        if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); cancel(); }
      };
      document.addEventListener('keydown', onKey);

      overlay.appendChild(panel);
      showOverlay(overlay);

      // Auto-focus input
      setTimeout(() => input.focus(), 100);
    });
  }

  // ─── TOAST ───────────────────────────────────────────────────────────────
  function anhadToast(message, { type = 'info', duration = 3000 } = {}) {
    // Remove existing toast
    const existing = document.querySelector('.anhad-toast');
    if (existing) {
      existing.remove();
      clearTimeout(toastTimer);
    }

    const toast = document.createElement('div');
    toast.className = `anhad-toast anhad-toast--${type}`;

    const iconEl = document.createElement('span');
    iconEl.className = 'anhad-toast__icon';
    iconEl.textContent = TOAST_ICONS[type] || TOAST_ICONS.info;
    toast.appendChild(iconEl);

    const textEl = document.createElement('span');
    textEl.textContent = message;
    toast.appendChild(textEl);

    document.body.appendChild(toast);
    void toast.offsetHeight;
    requestAnimationFrame(() => toast.classList.add('visible'));

    toastTimer = setTimeout(() => {
      toast.classList.add('closing');
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ─── GLOBAL EXPORT ───────────────────────────────────────────────────────
  window.AnhadPopup = {
    alert: anhadAlert,
    confirm: anhadConfirm,
    prompt: anhadPrompt,
    toast: anhadToast
  };

  // Also override window.showToast for compatibility with existing code
  window.showToast = function (message, opts = {}) {
    anhadToast(message, {
      type: opts.type || 'info',
      duration: opts.duration || 3000
    });
  };

  console.log('✨ AnhadPopup claymorphism system loaded');

})();
