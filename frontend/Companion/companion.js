(function() {
  'use strict';

  function init() {
    const desc = document.getElementById('companionStatusDesc');
    const badge = document.getElementById('companionActiveBadge');
    if (!desc) return;

    const remaining = window.CompanionMode ? window.CompanionMode.getRemainingTime() : null;
    const isEnabled = window.CompanionMode ? window.CompanionMode.isEnabled() : (localStorage.getItem('anhad_companion_mode') === 'true');

    if (isEnabled && remaining && !remaining.isExpired) {
      desc.textContent = `Active Sacred Journey: ${remaining.days}d ${remaining.hours}h remaining until completion.`;
      if (badge) {
        badge.textContent = `✦ Day ${41 - Math.max(1, remaining.days)} of 40`;
        badge.style.color = '#22C55E';
        badge.style.background = 'rgba(34, 197, 94, 0.12)';
      }
    } else if (isEnabled) {
      desc.textContent = 'Active Sacred Journey: Dedicated Naam Simran & Nitnem on Home Screen.';
    } else {
      desc.textContent = 'Sacred 40-day spiritual abhyaas and collective Nitnem contemplation.';
      if (badge) {
        badge.textContent = '✦ Chaliya 2026';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
