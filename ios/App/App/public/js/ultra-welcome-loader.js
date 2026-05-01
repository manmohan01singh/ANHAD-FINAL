/* ═══════════════════════════════════════════════════════════════════════════════
   ANHAD — ULTRA PREMIUM WELCOME LOADER
   Spectacular loading screen with animations and smooth transitions
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

const UltraWelcomeLoader = {
  loader: null,
  progressFill: null,
  minLoadTime: 2000, // Minimum 2 seconds to show the beautiful loader
  startTime: null,

  init() {
    this.startTime = Date.now();
    this.createLoader();
    this.createFloatingParticles();
    this.startLoading();
  },

  createLoader() {
    // Create loader HTML
    const loaderHTML = `
      <div class="ultra-loader">
        <div class="ultra-loader__logo">
          <img src="assets/app-logo-384.png" alt="ANHAD">
          <div class="ultra-loader__orbit">
            <div class="ultra-loader__particle"></div>
            <div class="ultra-loader__particle"></div>
            <div class="ultra-loader__particle"></div>
            <div class="ultra-loader__particle"></div>
          </div>
        </div>
        <div class="ultra-loader__text">ANHAD</div>
        <div class="ultra-loader__progress">
          <div class="ultra-loader__progress-fill"></div>
        </div>
      </div>
    `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', loaderHTML);
    this.loader = document.querySelector('.ultra-loader');
    this.progressFill = document.querySelector('.ultra-loader__progress-fill');
  },

  createFloatingParticles() {
    const container = document.createElement('div');
    container.className = 'floating-particles';
    
    // Create 20 floating particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      
      // Random positioning
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 15 + 's';
      particle.style.animationDuration = (10 + Math.random() * 10) + 's';
      
      container.appendChild(particle);
    }
    
    document.body.appendChild(container);
  },

  async startLoading() {
    // Simulate loading resources
    const resources = [
      this.preloadFonts(),
      this.preloadImages(),
      this.preloadCriticalAssets(),
      this.initializeApp()
    ];

    try {
      await Promise.all(resources);
      await this.ensureMinLoadTime();
      this.hideLoader();
    } catch (error) {
      console.error('Loading error:', error);
      // Still hide loader even if there's an error
      await this.ensureMinLoadTime();
      this.hideLoader();
    }
  },

  async preloadFonts() {
    // Check if fonts are loaded
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    return new Promise(resolve => setTimeout(resolve, 300));
  },

  async preloadImages() {
    const criticalImages = [
      'assets/darbar-sahib-day.webp',
      'assets/Darbar-sahib-AMRITVELA.webp',
      'assets/app-logo-384.png'
    ];

    const imagePromises = criticalImages.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error
        img.src = src;
      });
    });

    await Promise.all(imagePromises);
  },

  async preloadCriticalAssets() {
    // Simulate loading critical assets
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  async initializeApp() {
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize app components
    this.initScrollReveal();
    this.initCascadeAnimations();
    
    return Promise.resolve();
  },

  async ensureMinLoadTime() {
    const elapsed = Date.now() - this.startTime;
    const remaining = this.minLoadTime - elapsed;
    
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
  },

  hideLoader() {
    if (!this.loader) return;

    // Add hidden class to trigger fade out
    this.loader.classList.add('hidden');

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.loader && this.loader.parentNode) {
        this.loader.parentNode.removeChild(this.loader);
      }
    }, 800);

    // Add cascade class to app
    const app = document.getElementById('app');
    if (app) {
      app.classList.add('ultra-cascade');
    }
  },

  initScrollReveal() {
    // Intersection Observer for scroll reveal animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all scroll-reveal elements
    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el);
    });
  },

  initCascadeAnimations() {
    // Add cascade animation to main sections
    const sections = document.querySelectorAll('.hero-carousel, .practice-grid, .quick-card');
    sections.forEach((section, index) => {
      section.style.animationDelay = (index * 0.1) + 's';
    });
  }
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    UltraWelcomeLoader.init();
  });
} else {
  UltraWelcomeLoader.init();
}

// Export for use in other modules
window.UltraWelcomeLoader = UltraWelcomeLoader;
