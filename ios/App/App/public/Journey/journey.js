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
    }, 3200);
  }

  // ─── Version Loader ───
  async function syncAppVersion() {
    try {
      const response = await fetch('../version.json?t=' + Date.now());
      if (response.ok) {
        const data = await response.json();
        const ver = data.version ? `v${data.version}` : 'v1.1.13';
        
        const heroVer = document.getElementById('heroVersionLabel');
        if (heroVer) heroVer.textContent = ver;

        const footerVer = document.getElementById('footerVersionText');
        if (footerVer) footerVer.textContent = ver;
      }
    } catch (e) {
      console.log('[Journey] Version fetch error, using fallback:', e);
    }
  }

  // ─── Scroll Reveal Observer ───
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal-item');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    items.forEach(el => observer.observe(el));
  }

  // ─── Ardaas Blessing Engine with Particle Bloom ───
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

    if (!btn) return;

    btn.addEventListener('click', (e) => {
      triggerHaptic('HEAVY');
      ardaasCount++;
      
      try {
        localStorage.setItem(ARDAAS_STORAGE_KEY, ardaasCount.toString());
      } catch (e) {}

      if (pill) {
        pill.textContent = ardaasCount;
        pill.style.transform = 'scale(1.3)';
        setTimeout(() => { pill.style.transform = 'scale(1)'; }, 200);
      }

      if (thankNote) {
        thankNote.textContent = `ਧੰਨਵਾਦ ਜੀ! May Guru Sahib bless you with Chardi Kala 🙏`;
        thankNote.style.color = 'var(--journey-gold-primary)';
      }

      // Spawn Sparkle Particle Bloom
      spawnSparkles(stage, e);

      // Toast
      showToast('🙏 ਧੰਨਵਾਦ ਜੀ! Your blessing & Ardaas has been received.');
    });
  }

  function spawnSparkles(container, event) {
    if (!container) return;

    const symbols = ['✨', '🙏', '💛', '🌸', '💫', 'ੴ'];
    const particleCount = 12;
    const rect = container.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('span');
      particle.className = 'sparkle-particle';
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];

      const startX = (rect.width / 2) + (Math.random() * 80 - 40);
      const startY = rect.height - 40;
      const tx = (Math.random() * 160 - 80) + 'px';

      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      particle.style.setProperty('--tx', tx);

      container.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1600);
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
        } catch (e) {
          // User cancelled share
        }
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
    initScrollReveal();
    initArdaasEngine();
    initSharing();
    console.log('🙏 [Journey] About ANHAD initialized with divine elegance');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
