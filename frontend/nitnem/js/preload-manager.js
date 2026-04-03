/**
 * ANHAD Preload Manager - INSTANT NAVIGATION
 * Preloads all Nitnem pages for instant offline navigation
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Pages to preload when on the hub page
  const NITNEM_PAGES = [
    '/nitnem/reader.html',
    '/nitnem/japji-sahib.html',
    '/nitnem/jaap-sahib.html',
    '/nitnem/chaupai-sahib.html',
    '/nitnem/anand-sahib.html',
    '/nitnem/rehras-sahib.html',
    '/nitnem/sohila-sahib.html',
    '/nitnem/tav-prasad-savaiye.html',
    '/nitnem/category/sggs.html',
    '/nitnem/category/dasam.html',
    '/nitnem/category/nitnem.html',
    '/nitnem/category/sarbloh.html'
  ];

  // Critical CSS and JS to preload
  const CRITICAL_ASSETS = [
    '/nitnem/js/offline-bani-data.js',
    '/nitnem/js/banidb-api.js',
    '/nitnem/js/reader-engine.js',
    '/nitnem/css/reader.css'
  ];

  // Check if we're on the hub/main page
  function isHubPage() {
    return location.pathname.includes('/nitnem/index.html') || 
           location.pathname.endsWith('/nitnem/');
  }

  // Preload a single URL using link rel=prefetch
  function prefetchUrl(url) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = url.endsWith('.css') ? 'style' : 
                url.endsWith('.js') ? 'script' : 
                'document';
      
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
      
      document.head.appendChild(link);
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  // Preload using fetch API (more reliable for JS/CSS)
  function prefetchWithFetch(url) {
    return fetch(url, { mode: 'no-cors', cache: 'force-cache' })
      .then(() => true)
      .catch(() => false);
  }

  // Preload all pages progressively
  async function preloadAllPages() {
    if (!navigator.onLine) {
      console.log('[Preload] Offline - skipping prefetch');
      return;
    }

    console.log('[Preload] Starting progressive preload...');

    // First, preload critical assets
    for (const url of CRITICAL_ASSETS) {
      try {
        await prefetchWithFetch(url);
        await new Promise(r => setTimeout(r, 100)); // Throttle
      } catch (e) {}
    }

    // Then preload pages with lower priority
    for (const url of NITNEM_PAGES) {
      try {
        await prefetchUrl(url);
        await new Promise(r => setTimeout(r, 200)); // Throttle to not block UI
      } catch (e) {}
    }

    console.log('[Preload] Preload complete');
    
    // Store preload completion
    try {
      localStorage.setItem('anhad_preload_complete', Date.now());
    } catch (e) {}
  }

  // Add hover preload for bani cards
  function setupHoverPreload() {
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.bani-card, [data-prefetch]');
      if (card) {
        const href = card.getAttribute('href') || card.dataset.prefetch;
        if (href && !href.startsWith('http')) {
          prefetchUrl(href);
        }
      }
    }, { passive: true });
  }

  // Preload images that are likely to be needed
  function preloadCriticalImages() {
    const images = [
      '/assets/sggs-transparent.webp',
      '/assets/icons/bg-nitnem.jpg'
    ];
    
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  // Initialize
  function init() {
    // Always preload critical images
    preloadCriticalImages();
    
    // Setup hover preload
    setupHoverPreload();
    
    // If on hub page, preload all pages progressively
    if (isHubPage()) {
      // Delay preload to not block initial render
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadAllPages(), { timeout: 2000 });
      } else {
        setTimeout(preloadAllPages, 1000);
      }
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual triggering
  window.ANHADPreload = {
    preloadAllPages,
    prefetchUrl,
    isHubPage
  };
})();
