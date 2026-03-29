/* ═══════════════════════════════════════════════════════════════════
   ANHAD — App Orchestrator (Item 50: 60FPS guarantee)
   Initializes all systems, performance monitoring, IntersectionObserver
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const AnhadApp = {
  init() {
    /* Phase 1: Aurora background (Items 1-6) */
    if (window.Aurora) Aurora.init();

    /* Phase 2: Spring physics (prereq) */
    /* spring.js loaded separately */

    /* Phase 3: Scroll & Header (Items 7-13, 45) */
    if (window.ScrollSystem) ScrollSystem.init();

    /* Phase 4: Interactions (Items 14-33, 40-42, 44, 47) */
    if (window.Interactions) Interactions.init();

    /* Phase 5: Explore Carousel (Items 34-39) */
    const carouselEl = document.getElementById('exploreCarousel');
    if (carouselEl && window.ExploreCarousel) {
      this.carousel = new ExploreCarousel(carouselEl);
    }

    /* Phase 6: Golden Dust Particles (Item 46) */
    if (window.Particles) Particles.init();

    /* Phase 7: Hero Carousel Dots */
    this._heroSlider();

    /* Item 50: Performance Systems */
    this._setupVisibilityObserver();
    this._setupFPSMonitor();
  },

  /* Item 25: Hero Slider Dots */
  _heroSlider() {
    const cards = document.querySelectorAll('.hero-card-v2');
    const dots = document.querySelectorAll('.hero-dot');
    if (cards.length < 2) return;
    let current = 0;

    const show = (idx) => {
      cards.forEach((c, i) => {
        c.style.display = i === idx ? '' : 'none';
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      current = idx;
    };

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => show(i));
    });

    let startX = 0;
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      heroSection.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
      }, { passive: true });
      heroSection.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        if (dx < -50) show(Math.min(current + 1, cards.length - 1));
        if (dx > 50) show(Math.max(current - 1, 0));
      }, { passive: true });
    }

    show(0);
  },

  /* Item 50G: Pause off-screen animations */
  _setupVisibilityObserver() {
    const animated = document.querySelectorAll(
      '.aurora-layer, .mandana-watermark, .play-btn-hero, .profile-avatar, .carousel-progress'
    );
    if (!animated.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        e.target.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
      });
    });
    animated.forEach(el => observer.observe(el));
  },

  /* Item 50E: FPS Monitor (dev only) */
  _setupFPSMonitor() {
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    let lastFrame = 0;
    const monitor = (ts) => {
      if (lastFrame) {
        const fps = 1000 / (ts - lastFrame);
        if (fps < 55) console.warn('FPS drop:', Math.round(fps));
      }
      lastFrame = ts;
      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AnhadApp.init());
} else {
  AnhadApp.init();
}

window.AnhadApp = AnhadApp;
