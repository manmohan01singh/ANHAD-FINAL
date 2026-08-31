/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — THE JOURNEY CONTROLLER & BLESSING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const ARDAAS_STORAGE_KEY = 'anhad_user_ardaas_count';
  let ardaasCount = 0;
  let toastTimer = null;

  // ─── Haptic Feedback ───
  function triggerHaptic(style = 'MEDIUM') {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: style }).catch(() => {});
      } else if (navigator.vibrate) {
        navigator.vibrate(style === 'HEAVY' ? 60 : 30);
      }
    } catch (e) {}
  }

  // ─── Toast System ───
  function showToast(message) {
    const toast = document.getElementById('journeyToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  // ─── Version Loader ───
  async function syncAppVersion() {
    try {
      const response = await fetch('../version.json?t=' + Date.now());
      if (response.ok) {
        const data = await response.json();
        const ver = data.version ? `v${data.version}` : 'v1.1.14';
        
        const heroVer = document.getElementById('heroVersionLabel');
        if (heroVer) heroVer.textContent = ver;

        const footerVer = document.getElementById('footerVersionText');
        if (footerVer) footerVer.textContent = ver;
      }
    } catch (e) {
      console.log('[Journey] Version fetch error, using fallback:', e);
    }
  }

  // ─── Ardaas Blessing Engine with Gentle Particle Bloom ───
  function initArdaasEngine() {
    const btn = document.getElementById('sendArdaasBtn');
    const pill = document.getElementById('ardaasCountPill');
    const thankNote = document.getElementById('ardaasThankNote');
    const stage = document.getElementById('particleStage');

    // Load initial count
    try {
      ardaasCount = parseInt(localStorage.getItem(ARDAAS_STORAGE_KEY) || '0', 10);
      if (isNaN(ardaasCount)) ardaasCount = 0;
    } catch (e) {
      ardaasCount = 0;
    }

    if (pill) pill.textContent = ardaasCount;

    if (ardaasCount > 0 && thankNote) {
      thankNote.textContent = `You have blessed this seva ${ardaasCount} time${ardaasCount > 1 ? 's' : ''} 🙏`;
    }

    if (btn) {
      btn.addEventListener('click', (e) => {
        triggerHaptic('HEAVY');
        ardaasCount++;

        try {
          localStorage.setItem(ARDAAS_STORAGE_KEY, ardaasCount.toString());
        } catch (err) {}

        if (pill) {
          pill.textContent = ardaasCount;
          pill.style.transform = 'scale(1.3)';
          setTimeout(() => { pill.style.transform = 'scale(1)'; }, 200);
        }

        if (thankNote) {
          thankNote.textContent = `Waheguru Ji Kirpa! Blessing sent (${ardaasCount}) 🙏`;
        }

        spawnGentleSparkles(e, stage);
        showToast('🙏 ਧੰਨਵਾਦ ਜੀ! Your blessing & Ardaas has been received.');
      });
    }
  }

  function spawnGentleSparkles(event, container) {
    if (!container) return;

    const symbols = ['✨', '🌸', '🪯', 'ੴ', '🕊️'];
    const count = 7;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'sparkle-particle';
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];

      const startX = 50 + (Math.random() * 40 - 20); // Center around 50%
      const tx = (Math.random() * 120 - 60) + 'px';

      particle.style.left = `${startX}%`;
      particle.style.bottom = '20px';
      particle.style.setProperty('--tx', tx);
      particle.style.animationDelay = `${i * 0.08}s`;

      container.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1800);
    }
  }

  // ─── Sharing Engine ───
  function initSharing() {
    const shareData = {
      title: 'ANHAD • Complete Gurbani Sanctuary',
      text: 'Experience ANHAD — A peaceful sanctuary for Nitnem, 24x7 Gurbani Radio, Live Darbar Sahib, and Naam Simran. 100% Free & Ad-Free Seva.',
      url: window.location.origin
    };

    const handleShare = async () => {
      triggerHaptic('LIGHT');
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {}
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          showToast('🔗 App Link copied to clipboard!');
        } catch (e) {
          showToast('🔗 Share ANHAD: ' + shareData.url);
        }
      }
    };

    const topBtn = document.getElementById('journeyShareTopBtn');
    if (topBtn) topBtn.addEventListener('click', handleShare);

    const shareAppBtn = document.getElementById('shareAppBtn');
    if (shareAppBtn) shareAppBtn.addEventListener('click', handleShare);
  }

  // ─── Back Button ───
  function initBackButton() {
    const backBtn = document.getElementById('journeyBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        triggerHaptic('LIGHT');
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '../index.html';
        }
      });
    }
  }

  // ─── Bootstrapping ───
  function boot() {
    initBackButton();
    syncAppVersion();
    initArdaasEngine();
    initSharing();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
