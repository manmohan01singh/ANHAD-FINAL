/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AnhadNav — Liquid Glass Navigation Controller v1.0
 * Global navigation manager for ANHAD app with notification dots and animations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /**
   * AnhadNav Controller
   * Exposed globally as window.AnhadNav
   */
  class AnhadNavController {
    constructor() {
      this.navElement = null;
      this.items = new Map();
      this.activeTab = 'home';
      this.isInitialized = false;
      
      // Bind methods
      this.init = this.init.bind(this);
      this.setActive = this.setActive.bind(this);
      this.showDot = this.showDot.bind(this);
      this.hideDot = this.hideDot.bind(this);
      this.handleThemeChange = this.handleThemeChange.bind(this);
      this.navigateTo = this.navigateTo.bind(this);
    }

    /**
     * Initialize the navigation controller
     * Call this after DOM is ready and nav element exists
     */
    init() {
      if (this.isInitialized) return;
      
      this.navElement = document.getElementById('mainNav');
      if (!this.navElement) {
        console.warn('[AnhadNav] Navigation element not found. Call init() after nav HTML is injected.');
        return;
      }

      // Cache nav items
      const navItems = this.navElement.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        const tabId = item.dataset.page;
        if (tabId) {
          this.items.set(tabId, {
            element: item,
            dotElement: item.querySelector('.nav-dot'),
            hasDot: false
          });
        }
      });

      // Determine current page
      this.detectCurrentPage();

      // Set initial active state
      this.setActive(this.activeTab, false);

      // Listen for theme changes
      this.setupThemeListener();

      // Setup click handlers
      this.setupClickHandlers();

      this.isInitialized = true;
    }

    /**
     * Detect current page from URL path
     */
    detectCurrentPage() {
      const path = window.location.pathname.toLowerCase();

      if (path.includes('/index') || path.endsWith('/frontend/') || !path.includes('.html') || path === '/' || path.endsWith('/')) {
        this.activeTab = 'home';
      } else if (path.includes('/insights')) {
        this.activeTab = 'learning';
      } else if (path.includes('/favorites')) {
        this.activeTab = 'favorites';
      } else if (path.includes('/dashboard') || path.includes('/profile')) {
        this.activeTab = 'profile';
      }
    }

    /**
     * Setup click handlers for navigation items
     */
    setupClickHandlers() {
      this.items.forEach((item, tabId) => {
        item.element.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Press animation - hardware accelerated
          item.element.style.transform = 'scale3d(0.92, 0.92, 1)';
          requestAnimationFrame(() => {
            setTimeout(() => {
              item.element.style.transform = '';
            }, 100);
          });

          // Navigate after animation
          this.navigateTo(tabId);
        });
      });
    }

    /**
     * Navigate to a specific tab/page
     * @param {string} tabId - The tab/page ID to navigate to
     */
    navigateTo(tabId) {
      const path = window.location.pathname.toLowerCase();
      const isRoot = path.endsWith('/index.html') || path.endsWith('/frontend/') || !path.includes('.html') || path === '/';
      const basePath = isRoot ? '' : '../';

      let targetUrl;
      switch (tabId) {
        case 'home':
          targetUrl = isRoot ? '#' : `${basePath}index.html`;
          break;
        case 'learning':
          targetUrl = `${basePath}Insights/insights.html`;
          break;
        case 'favorites':
          targetUrl = `${basePath}Favorites/favorites.html`;
          break;
        case 'profile':
          targetUrl = `${basePath}Dashboard/dashboard.html`;
          break;
        default:
          targetUrl = isRoot ? '#' : `${basePath}index.html`;
      }

      // Update active state immediately for perceived performance
      this.setActive(tabId);

      // Navigate via SPA engine if available (instant, no white flash)
      if (targetUrl === '#' || targetUrl.endsWith(window.location.pathname.split('/').pop())) {
        // Already on this page — scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (typeof window.navigateTo === 'function') {
        // SPA engine: instant, cache-powered navigation
        window.navigateTo(targetUrl);
      } else {
        // Fallback if SPA engine not yet loaded
        window.location.href = targetUrl;
      }
    }

    /**
     * Set the active tab
     * @param {string} tabId - Tab ID to set as active
     * @param {boolean} animate - Whether to animate the transition (default: true)
     */
    setActive(tabId, animate = true) {
      if (!this.items.has(tabId)) {
        console.warn(`[AnhadNav] Tab "${tabId}" not found`);
        return;
      }

      // Remove active from all tabs
      this.items.forEach((item, id) => {
        item.element.classList.remove('active');
        item.element.removeAttribute('aria-current');
      });

      // Set new active tab
      const activeItem = this.items.get(tabId);
      activeItem.element.classList.add('active');
      activeItem.element.setAttribute('aria-current', 'page');
      this.activeTab = tabId;

      // Trigger icon spring animation via class (no forced reflow)
      if (animate) {
        const iconWrap = activeItem.element.querySelector('.nav-icon-wrap');
        if (iconWrap) {
          iconWrap.classList.remove('spring-animate');
          requestAnimationFrame(() => { iconWrap.classList.add('spring-animate'); });
        }
      }
    }

    /**
     * Show notification dot on a tab
     * @param {string} tabId - Tab ID to show dot on
     */
    showDot(tabId) {
      if (!this.items.has(tabId)) {
        console.warn(`[AnhadNav] Tab "${tabId}" not found`);
        return;
      }

      const item = this.items.get(tabId);
      if (item.dotElement) {
        item.dotElement.classList.add('visible');
        item.hasDot = true;
      }
    }

    /**
     * Hide notification dot from a tab
     * @param {string} tabId - Tab ID to hide dot from
     */
    hideDot(tabId) {
      if (!this.items.has(tabId)) {
        console.warn(`[AnhadNav] Tab "${tabId}" not found`);
        return;
      }

      const item = this.items.get(tabId);
      if (item.dotElement) {
        item.dotElement.classList.remove('visible');
        item.hasDot = false;
      }
    }

    /**
     * Check if a tab has a notification dot
     * @param {string} tabId - Tab ID to check
     * @returns {boolean}
     */
    hasDot(tabId) {
      if (!this.items.has(tabId)) return false;
      return this.items.get(tabId).hasDot;
    }

    /**
     * Toggle notification dot on a tab
     * @param {string} tabId - Tab ID to toggle dot on
     */
    toggleDot(tabId) {
      if (this.hasDot(tabId)) {
        this.hideDot(tabId);
      } else {
        this.showDot(tabId);
      }
    }

    /**
     * Hide/show entire navigation
     * @param {boolean} hidden - Whether to hide the nav
     */
    setHidden(hidden) {
      if (this.navElement) {
        this.navElement.classList.toggle('hidden', hidden);
      }
    }

    /**
     * Setup theme change listener
     */
    setupThemeListener() {
      // Listen for custom theme change event
      window.addEventListener('anhad-theme-change', (e) => {
        this.handleThemeChange(e.detail?.theme);
      });

      // Also listen for manual theme attribute changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.getAttribute('data-theme');
            this.handleThemeChange(newTheme);
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
    }

    /**
     * Handle theme change
     * @param {string} theme - New theme name
     */
    handleThemeChange(theme) {
      // Theme changes are handled automatically via CSS [data-theme] selectors
      // This method is available for any JS-side theme adjustments if needed
      // AnhadNav theme changed
    }

    /**
     * Get current active tab
     * @returns {string}
     */
    getActiveTab() {
      return this.activeTab;
    }

    /**
     * Get all available tab IDs
     * @returns {string[]}
     */
    getTabIds() {
      return Array.from(this.items.keys());
    }
  }

  // Create global instance
  window.AnhadNav = new AnhadNavController();

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AnhadNav.init());
  } else {
    // DOM already loaded, initialize on next tick
    setTimeout(() => window.AnhadNav.init(), 0);
  }

  // Expose for manual initialization if needed

})();
