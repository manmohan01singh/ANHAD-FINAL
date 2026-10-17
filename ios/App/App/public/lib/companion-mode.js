/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD COMPANION MODE ENGINE
 * Manages Companion state, custom artwork upload & duration scheduling
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'anhad_companion_mode';
  const STORAGE_CUSTOM_IMG = 'anhad_companion_custom_image';
  const STORAGE_EXPIRY = 'anhad_companion_expiry';
  const STORAGE_DURATION_DAYS = 'anhad_companion_duration_days';
  const STORAGE_DURATION_HOURS = 'anhad_companion_duration_hours';
  const STORAGE_START_TIME = 'anhad_companion_start_time';
  const STORAGE_TITLE = 'anhad_companion_title';

  const DEFAULT_HERO = 'guruimages/guru-greeting-hero.webp';
  const COMPANION_HERO = 'assets/companion/chaliya-2026.webp';
  const DEFAULT_ALT = 'Sri Guru Granth Sahib Ji with Sri Guru Gobind Singh Ji and Sri Guru Nanak Dev Ji';
  const COMPANION_ALT = 'Chaliya 2026 — Sri Guru Nanak Dev Ji with Sri Harmandir Sahib Ji';

  function resolveAssetPath(relPath) {
    if (!relPath || relPath.startsWith('data:') || relPath.startsWith('http://') || relPath.startsWith('https://')) {
      return relPath;
    }
    const clean = relPath.replace(/^\//, '');
    const pathname = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    const parts = pathname.split('/').filter(Boolean);
    const isSub = parts.length > 1 && !(parts.length === 2 && parts[0] === 'frontend');
    const isSingleDir = parts.length === 1 && !parts[0].includes('.html') && parts[0] !== 'frontend';
    return (isSub || isSingleDir) ? `../${clean}` : clean;
  }

  function checkExpiration() {
    try {
      const expiryStr = localStorage.getItem(STORAGE_EXPIRY);
      if (expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (!isNaN(expiry) && Date.now() > expiry) {
          localStorage.setItem(STORAGE_KEY, 'false');
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  function isEnabled() {
    if (checkExpiration()) return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function broadcastChange(enabled) {
    try {
      window.dispatchEvent(new CustomEvent('anhad_companion_changed', { detail: { enabled } }));
      if (typeof window.BroadcastChannel === 'function') {
        const bc = new BroadcastChannel('anhad_companion_channel');
        bc.postMessage({ type: 'companion_changed', enabled });
        bc.close();
      }
    } catch (e) {}
  }

  function setEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    syncHeroImage();
    broadcastChange(enabled);
  }

  function toggle() {
    setEnabled(!isEnabled());
    return isEnabled();
  }

  function getCustomImage() {
    try {
      const img = localStorage.getItem(STORAGE_CUSTOM_IMG);
      if (!img || img.includes('Darbar-sahib') || img.includes('guru-greeting-hero')) {
        return null;
      }
      return img;
    } catch (e) {
      return null;
    }
  }

  function setCustomImage(imageDataOrUrl) {
    try {
      if (imageDataOrUrl) {
        localStorage.setItem(STORAGE_CUSTOM_IMG, imageDataOrUrl);
      } else {
        localStorage.removeItem(STORAGE_CUSTOM_IMG);
      }
      syncHeroImage();
    } catch (e) {
      console.warn('[CompanionMode] Failed to save custom image:', e);
    }
  }

  function setDuration(days, hours = 0) {
    const d = parseInt(days, 10) || 0;
    const h = parseInt(hours, 10) || 0;
    const now = Date.now();
    const durationMs = (d * 24 * 60 * 60 * 1000) + (h * 60 * 60 * 1000);

    if (durationMs > 0) {
      const expiry = now + durationMs;
      localStorage.setItem(STORAGE_EXPIRY, expiry.toString());
      localStorage.setItem(STORAGE_DURATION_DAYS, d.toString());
      localStorage.setItem(STORAGE_DURATION_HOURS, h.toString());
      localStorage.setItem(STORAGE_START_TIME, now.toString());
    } else {
      localStorage.removeItem(STORAGE_EXPIRY);
      localStorage.removeItem(STORAGE_DURATION_DAYS);
      localStorage.removeItem(STORAGE_DURATION_HOURS);
      localStorage.removeItem(STORAGE_START_TIME);
    }
  }

  function getRemainingTime() {
    const expiryStr = localStorage.getItem(STORAGE_EXPIRY);
    if (!expiryStr) return null;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry)) return null;

    const diff = expiry - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, expiryDate: new Date(expiry) };
    }

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return {
      days,
      hours,
      minutes,
      seconds,
      totalHours: Math.floor(diff / (1000 * 60 * 60)),
      isExpired: false,
      expiryDate: new Date(expiry)
    };
  }

  function getCompanionConfig() {
    return {
      enabled: isEnabled(),
      customImage: getCustomImage(),
      durationDays: parseInt(localStorage.getItem(STORAGE_DURATION_DAYS) || '40', 10),
      durationHours: parseInt(localStorage.getItem(STORAGE_DURATION_HOURS) || '0', 10),
      expiry: localStorage.getItem(STORAGE_EXPIRY) ? new Date(parseInt(localStorage.getItem(STORAGE_EXPIRY), 10)) : null,
      remaining: getRemainingTime(),
      title: localStorage.getItem(STORAGE_TITLE) || 'Chaliya 2026'
    };
  }

  function saveCompanionConfig(opts) {
    if (!opts) return;
    if (opts.customImage !== undefined) {
      setCustomImage(opts.customImage);
    }
    if (opts.days !== undefined) {
      setDuration(opts.days, opts.hours || 0);
    }
    if (opts.title) {
      localStorage.setItem(STORAGE_TITLE, opts.title);
    }
    if (opts.enabled !== undefined) {
      setEnabled(!!opts.enabled);
    } else {
      syncHeroImage();
    }
  }

  function syncHeroImage() {
    const heroImg = document.getElementById('greetingHeroArtwork');
    const heroSource = document.getElementById('greetingHeroSource');
    const banner = document.getElementById('greetingHeroBanner');

    checkExpiration();
    const enabled = isEnabled();

    const html = document.documentElement;
    const themeMode = html.getAttribute('data-theme-mode');
    const isDark = html.classList.contains('dark-mode') ||
                   html.getAttribute('data-theme') === 'dark' ||
                   themeMode === 'dark';
    const timeOfDay = html.getAttribute('data-time-of-day');
    const showDark = isDark || (themeMode === 'auto' && timeOfDay === 'night') || (timeOfDay === 'night' && themeMode !== 'light');

    if (enabled && !showDark) {
      if (document.body) document.body.classList.add('companion-mode-active');
      if (banner) {
        banner.classList.add('companion-mode-active');
        banner.style.setProperty('display', 'flex', 'important');
      }
      const darkCarousel = document.getElementById('greetingDarkCarousel');
      if (darkCarousel) {
        darkCarousel.classList.remove('companion-mode-active');
        darkCarousel.style.setProperty('display', 'none', 'important');
      }
      if (heroImg) heroImg.classList.add('companion-mode-active');
    } else {
      // Standard mode or dark mode (showDark === true)
      if (document.body) document.body.classList.remove('companion-mode-active');
      if (banner) banner.classList.remove('companion-mode-active');
      if (heroImg) heroImg.classList.remove('companion-mode-active');
      if (showDark) {
        if (banner) banner.style.setProperty('display', 'none', 'important');
        const darkCarousel = document.getElementById('greetingDarkCarousel');
        if (darkCarousel) {
          darkCarousel.style.setProperty('display', 'flex', 'important');
          if (window.PortraitSlider && typeof window.PortraitSlider.init === 'function') {
            window.PortraitSlider.init();
          }
        }
      } else {
        if (banner) banner.style.removeProperty('display');
        const darkCarousel = document.getElementById('greetingDarkCarousel');
        if (darkCarousel) darkCarousel.style.setProperty('display', 'none', 'important');
      }
    }

    if (!heroImg) return;

    const customImg = getCustomImage();
    const rawTarget = enabled ? (customImg || COMPANION_HERO) : DEFAULT_HERO;
    const targetSrc = resolveAssetPath(rawTarget);
    const targetAlt = enabled ? (localStorage.getItem(STORAGE_TITLE) || COMPANION_ALT) : DEFAULT_ALT;

    // Attach JPG fallback on heroImg if not already attached
    if (!heroImg._hasCompanionError) {
      heroImg._hasCompanionError = true;
      heroImg.addEventListener('error', function() {
        if (this.src && this.src.endsWith('.webp')) {
          const jpg = this.src.replace(/\.webp$/, '.jpg');
          this.src = jpg;
          if (heroSource) {
            heroSource.srcset = jpg;
            heroSource.type = 'image/jpeg';
          }
        }
      });
    }

    // Resolve URL if not a data URL
    let absoluteTarget;
    if (targetSrc.startsWith('data:')) {
      absoluteTarget = targetSrc;
    } else {
      try {
        absoluteTarget = new URL(targetSrc, document.baseURI || window.location.href).href;
      } catch (e) {
        absoluteTarget = targetSrc;
      }
    }

    if (heroImg.src !== absoluteTarget) {
      // Preload the new image off-screen before swapping, so there's no flash
      const preloader = new Image();
      preloader.onload = () => {
        // New image is fully loaded — now do the fade swap
        heroImg.style.transition = 'opacity 0.25s ease';
        heroImg.style.opacity = '0';
        setTimeout(() => {
          heroImg.src = targetSrc;
          heroImg.alt = targetAlt;
          if (heroSource) {
            heroSource.srcset = targetSrc;
            heroSource.type = targetSrc.endsWith('.jpg') || targetSrc.endsWith('.jpeg') ? 'image/jpeg' : 'image/webp';
          }
          try { heroImg.removeAttribute('srcset'); } catch (e) {}
          // Fade back in
          requestAnimationFrame(() => {
            heroImg.style.transition = 'opacity 0.4s ease';
            heroImg.style.opacity = '1';
          });
        }, 150);
      };
      preloader.onerror = () => {
        // Fallback: If WebP failed, attempt JPG
        if (absoluteTarget.endsWith('.webp')) {
          const jpgTarget = absoluteTarget.replace(/\.webp$/, '.jpg');
          const jpgSrc = targetSrc.replace(/\.webp$/, '.jpg');
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            heroImg.src = jpgSrc;
            heroImg.alt = targetAlt;
            if (heroSource) {
              heroSource.srcset = jpgSrc;
              heroSource.type = 'image/jpeg';
            }
          };
          fallbackImg.onerror = () => {
            heroImg.src = targetSrc;
            heroImg.alt = targetAlt;
            if (heroSource) heroSource.srcset = targetSrc;
          };
          fallbackImg.src = jpgTarget;
          return;
        }
        heroImg.src = targetSrc;
        heroImg.alt = targetAlt;
        if (heroSource) heroSource.srcset = targetSrc;
      };
      preloader.src = absoluteTarget;
    } else {
      heroImg.alt = targetAlt;
      if (heroSource) heroSource.srcset = targetSrc;
    }

    // Safely sync with greeting hero artwork controller if present
    if (typeof window.syncGreetingHeroArtwork === 'function' && !window.__syncingGreeting) {
      window.__syncingGreeting = true;
      try { window.syncGreetingHeroArtwork(); } catch (e) {}
      window.__syncingGreeting = false;
    }
  }

  // Pre-warm companion image in cache
  if (typeof window !== 'undefined' && window.AnhadImageCache) {
    try { window.AnhadImageCache.preload(COMPANION_HERO); } catch(e) {}
  }

  // Auto-sync on page load and SPA navigation
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', syncHeroImage);
    } else {
      syncHeroImage();
    }
    window.addEventListener('anhad_page_changed', syncHeroImage);
    window.addEventListener('anhad_companion_changed', syncHeroImage);
    window.addEventListener('anhadCampaignUpdated', syncHeroImage);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY || e.key === STORAGE_CUSTOM_IMG || e.key === STORAGE_EXPIRY) {
        syncHeroImage();
      }
    });

    try {
      if (typeof window.BroadcastChannel === 'function') {
        const bc = new BroadcastChannel('anhad_companion_channel');
        bc.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'companion_changed') {
            syncHeroImage();
          }
        };
      }
    } catch(e) {}

    // Check expiration every 60s
    setInterval(() => {
      if (checkExpiration()) syncHeroImage();
    }, 60000);
  }

  window.CompanionMode = {
    isEnabled,
    setEnabled,
    toggle,
    syncHeroImage,
    getCustomImage,
    setCustomImage,
    setDuration,
    getRemainingTime,
    getCompanionConfig,
    saveCompanionConfig,
    DEFAULT_HERO,
    COMPANION_HERO
  };
})(typeof window !== 'undefined' ? window : globalThis);
