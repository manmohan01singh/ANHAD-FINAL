(function() {
  'use strict';

  function init() {
    const toggle = document.getElementById('companionToggle');
    if (!toggle) return;

    if (window.CompanionMode) {
      toggle.checked = window.CompanionMode.isEnabled();
    } else {
      toggle.checked = localStorage.getItem('anhad_companion_mode') === 'true';
    }

    toggle.addEventListener('change', (e) => {
      if (window.CompanionMode) {
        window.CompanionMode.setEnabled(e.target.checked);
      } else {
        localStorage.setItem('anhad_companion_mode', e.target.checked ? 'true' : 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
