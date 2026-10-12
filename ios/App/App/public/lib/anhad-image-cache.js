/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD In-Memory Decoded Image Cache & Instant Preloader v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * Keeps decoded HTMLImageElement bitmaps in memory across SPA navigations.
 * Guarantees zero blank flashes, zero refetch delays, and instant return to Home.
 */

(function(window) {
  'use strict';
  if (window.AnhadImageCache) return;

  const cache = new Map();

  const CRITICAL_IMAGES = [
    'guruimages/guru-greeting-hero.webp',
    'assets/darbar-sahib-morning-bg.webp',
    'assets/darbar-sahib-day-bg.webp',
    'assets/darbar-sahib-evening-bg.webp',
    'assets/HERO CARD IMAGES/day-darbar-sahib.webp',
    'assets/HERO CARD IMAGES/day-amritvela-kirtan.webp',
    'assets/HERO CARD IMAGES/day-waheguru-simran.webp',
    'assets/HUKAMNAMA-SAHIB.webp'
  ];

  function resolveUrl(url) {
    if (!url) return '';
    try {
      return new URL(url, document.baseURI || window.location.href).href;
    } catch (e) {
      return url;
    }
  }

  function preload(url) {
    if (!url) return Promise.resolve(null);
    const abs = resolveUrl(url);
    if (cache.has(abs)) {
      return cache.get(abs).readyPromise;
    }

    const img = new Image();
    img.decoding = 'async';

    const readyPromise = new Promise((resolve) => {
      const onDone = () => {
        if ('decode' in img) {
          img.decode().then(() => resolve(img)).catch(() => resolve(img));
        } else {
          resolve(img);
        }
      };

      img.onload = onDone;
      img.onerror = () => {
        console.warn('[ImageCache] Preload failed for:', abs);
        resolve(null);
      };

      img.src = abs;
      if (img.complete && img.naturalWidth > 0) {
        onDone();
      }
    });

    cache.set(abs, { img, readyPromise });
    return readyPromise;
  }

  function preloadAll(urls) {
    if (!Array.isArray(urls)) return Promise.resolve();
    return Promise.all(urls.map(u => preload(u)));
  }

  function isReady(url) {
    const abs = resolveUrl(url);
    const entry = cache.get(abs);
    return !!(entry && entry.img && entry.img.complete && entry.img.naturalWidth > 0);
  }

  function getCachedElement(url) {
    const abs = resolveUrl(url);
    const entry = cache.get(abs);
    return entry ? entry.img : null;
  }

  // Pre-warm critical images as soon as DOM is ready or immediately
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        preloadAll(CRITICAL_IMAGES);
      }, { once: true });
    } else {
      preloadAll(CRITICAL_IMAGES);
    }
  }

  window.AnhadImageCache = {
    preload,
    preloadAll,
    isReady,
    getCachedElement,
    cache
  };
})(typeof window !== 'undefined' ? window : globalThis);
