/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO - SPA ROUTER
 * Handles dynamic page loading without full page reloads
 * This allows audio to continue playing when navigating between pages
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

class SPARouter {
    constructor(options = {}) {
        // Configuration
        this.contentContainerId = options.contentContainer || 'spa-content';
        this.loadingContainerId = options.loadingContainer || 'spa-loading';
        this.audioPlayerId = options.audioPlayer || 'persistent-audio-player';

        // Cache loaded pages
        this.pageCache = new Map();

        // Current page tracking
        this.currentPage = 'home';

        // Page routes mapping
        this.routes = {
            'home': { url: null, title: 'Gurbani Radio' }, // null = show original content
            'hukamnama': { url: 'Hukamnama/daily-hukamnama.html', title: 'Daily Hukamnama' },
            'nitnem': { url: 'nitnem/indexbani.html', title: 'Nitnem Paath' },
            'nitnem-tracker': { url: 'NitnemTracker/nitnem-tracker.html', title: 'Nitnem Tracker' },
            'sehaj-paath': { url: 'SehajPaath/sehaj-paath.html', title: 'Sehaj Paath' },
            'calendar': { url: 'Calendar/Gurupurab-Calendar.html', title: 'Gurpurab Calendar' },
            'notes': { url: 'Notes/notes.html', title: 'My Notes' },
            'reminders': { url: 'reminders/smart-reminders.html', title: 'Smart Reminders' }
        };

        // Original home content
        this.homeContent = null;

        // Bound methods
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.handlePopState = this.handlePopState.bind(this);

        this.init();
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    init() {
        this.contentContainer = document.getElementById(this.contentContainerId);
        this.loadingContainer = document.getElementById(this.loadingContainerId);

        if (!this.contentContainer) {
            console.warn('[SPARouter] Content container not found');
            return;
        }

        // Save original home content
        this.homeContent = this.contentContainer.innerHTML;

        // Setup link interception
        this.setupLinkInterception();

        // Handle browser back/forward
        window.addEventListener('popstate', this.handlePopState);

        console.log('[SPARouter] Initialized');
    }

    setupLinkInterception() {
        // Intercept all internal links
        document.addEventListener('click', this.handleLinkClick);
    }

    // ═══════════════════════════════════════════════════════════════
    // LINK HANDLING
    // ═══════════════════════════════════════════════════════════════

    handleLinkClick(e) {
        const link = e.target.closest('a[href], [data-spa-link]');
        if (!link) return;

        // Get the href
        const href = link.getAttribute('href') || link.dataset.spaLink;
        if (!href) return;

        // Skip external links
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        // Skip anchor links
        if (href.startsWith('#')) return;

        // Check if this is a known route
        const routeKey = this.getRouteKeyFromHref(href);
        if (routeKey) {
            e.preventDefault();
            this.navigate(routeKey);
        }
    }

    getRouteKeyFromHref(href) {
        // Normalize href
        const normalizedHref = href.replace(/^\.\.\//, '').replace(/^\.\//, '');

        // Check routes
        for (const [key, route] of Object.entries(this.routes)) {
            if (route.url && normalizedHref.includes(route.url.replace('.html', ''))) {
                return key;
            }
        }

        // Check specific patterns
        if (normalizedHref.includes('daily-hukamnama')) return 'hukamnama';
        if (normalizedHref.includes('nitnem-tracker')) return 'nitnem-tracker';
        if (normalizedHref.includes('sehaj-paath')) return 'sehaj-paath';
        if (normalizedHref.includes('Calendar') || normalizedHref.includes('Gurupurab')) return 'calendar';
        if (normalizedHref.includes('notes.html')) return 'notes';
        if (normalizedHref.includes('smart-reminders')) return 'reminders';
        if (normalizedHref.includes('indexbani') || normalizedHref.includes('nitnem/index')) return 'nitnem';

        return null;
    }

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════

    async navigate(pageKey, pushState = true) {
        const route = this.routes[pageKey];
        if (!route) {
            console.warn(`[SPARouter] Unknown route: ${pageKey}`);
            return;
        }

        // Don't reload same page
        if (pageKey === this.currentPage) return;

        console.log(`[SPARouter] Navigating to: ${pageKey}`);

        // Show loading
        this.showLoading();

        try {
            // Load page content
            const content = await this.loadPage(pageKey, route.url);

            // Update container
            this.contentContainer.innerHTML = content;

            // Update state
            this.currentPage = pageKey;

            // Update URL without reload
            if (pushState) {
                const url = route.url ? route.url : '/';
                history.pushState({ page: pageKey }, route.title, url);
            }

            // Update title
            document.title = `${route.title} | Gurbani Radio`;

            // Initialize page scripts
            this.initializePageScripts(pageKey);

            // Scroll to top
            window.scrollTo(0, 0);

        } catch (error) {
            console.error(`[SPARouter] Failed to load page:`, error);
            this.showError('Failed to load page. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async loadPage(pageKey, url) {
        // Home is special - return original content
        if (!url || pageKey === 'home') {
            return this.homeContent;
        }

        // Check cache first
        if (this.pageCache.has(pageKey)) {
            console.log(`[SPARouter] Serving from cache: ${pageKey}`);
            return this.pageCache.get(pageKey);
        }

        // Fetch page
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Parse and extract main content
        const content = this.extractMainContent(html);

        // Cache it
        this.pageCache.set(pageKey, content);

        return content;
    }

    extractMainContent(html) {
        // Create a temporary container
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Try to find main content
        const mainContent = doc.querySelector('main') ||
            doc.querySelector('.app-container') ||
            doc.querySelector('.main-content') ||
            doc.body;

        // Remove scripts that might conflict
        mainContent.querySelectorAll('script').forEach(s => s.remove());

        // Update relative paths
        this.updateRelativePaths(mainContent);

        return mainContent.innerHTML;
    }

    updateRelativePaths(container) {
        // Update image sources
        container.querySelectorAll('img[src]').forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('/')) {
                // Leave as-is, browser will resolve
            }
        });

        // Update link hrefs
        container.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                // Add click handler for SPA navigation
                link.setAttribute('data-spa-link', href);
            }
        });
    }

    initializePageScripts(pageKey) {
        // Dispatch custom event for page-specific initialization
        const event = new CustomEvent('spa:pageload', {
            detail: { page: pageKey }
        });
        document.dispatchEvent(event);

        // Re-run any inline initialization
        this.runPageInit(pageKey);
    }

    runPageInit(pageKey) {
        // Page-specific initializations
        switch (pageKey) {
            case 'hukamnama':
                // Daily Hukamnama init
                if (typeof initHukamnama === 'function') initHukamnama();
                break;
            case 'nitnem-tracker':
                // Nitnem Tracker init
                if (typeof initNitnemTracker === 'function') initNitnemTracker();
                break;
            case 'sehaj-paath':
                // Sehaj Paath init
                if (typeof initSehajPaath === 'function') initSehajPaath();
                break;
            case 'calendar':
                // Calendar init
                if (typeof initCalendar === 'function') initCalendar();
                break;
            case 'notes':
                // Notes init
                if (typeof initNotes === 'function') initNotes();
                break;
            case 'reminders':
                // Reminders init
                if (typeof initReminders === 'function') initReminders();
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BROWSER HISTORY
    // ═══════════════════════════════════════════════════════════════

    handlePopState(event) {
        const page = event.state?.page || 'home';
        this.navigate(page, false);
    }

    // Go back to home
    goHome() {
        this.navigate('home');
    }

    // ═══════════════════════════════════════════════════════════════
    // LOADING UI
    // ═══════════════════════════════════════════════════════════════

    showLoading() {
        if (this.loadingContainer) {
            this.loadingContainer.style.display = 'flex';
            this.loadingContainer.style.opacity = '1';
        }
    }

    hideLoading() {
        if (this.loadingContainer) {
            this.loadingContainer.style.opacity = '0';
            setTimeout(() => {
                this.loadingContainer.style.display = 'none';
            }, 300);
        }
    }

    showError(message) {
        this.contentContainer.innerHTML = `
            <div class="spa-error">
                <div class="spa-error__icon">⚠️</div>
                <h2 class="spa-error__title">Oops!</h2>
                <p class="spa-error__message">${message}</p>
                <button class="spa-error__button" onclick="window.spaRouter.goHome()">
                    Go Back Home
                </button>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    // Navigate programmatically
    go(pageKey) {
        return this.navigate(pageKey);
    }

    // Check if we're on a specific page
    isCurrentPage(pageKey) {
        return this.currentPage === pageKey;
    }

    // Clear cache
    clearCache() {
        this.pageCache.clear();
    }

    // Add custom route
    addRoute(key, url, title) {
        this.routes[key] = { url, title };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

// Make sure we only create one instance
if (!window.spaRouter) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.spaRouter = new SPARouter();
        });
    } else {
        window.spaRouter = new SPARouter();
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPARouter;
}
