/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD Global Theme System
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides consistent dark/light mode across all pages.
 * Include this script in every page's <head> section for flash-free theming.
 * 
 * Usage:
 *   <script src="/lib/global-theme.js"></script>
 *   
 * API:
 *   AnhadTheme.toggle() - Toggle between dark and light
 *   AnhadTheme.set('dark' | 'light') - Set specific theme
 *   AnhadTheme.get() - Get current theme
 *   AnhadTheme.isDark() - Check if dark mode
 */

(function () {
    'use strict';

    const THEME_KEY = 'anhad_theme';
    const DARK_CLASS = 'dark-mode';

    // ═══════════════════════════════════════════════════════════════════════════
    // DARK MODE CSS VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════
    const darkModeStyles = `
        html.dark-mode {
            /* Background */
            --bg-primary: #0D0D0F;
            --bg-white: #1A1A1E;
            --bg-soft: #141418;
            
            /* Gold Spectrum (slightly warmer in dark) */
            --gold-50: #2A2515;
            --gold-100: #3D351A;
            --gold-300: #D4A03A;
            --gold-400: #E8B84A;
            --gold-500: #F5C75A;
            --gold-gradient: linear-gradient(135deg, #E8B84A 0%, #D4A03A 100%);
            --gold-glow: rgba(232, 184, 74, 0.35);
            
            /* Lavender Spectrum */
            --lavender-400: #B8A8F0;
            --lavender-500: #9A8CD8;
            --lavender-gradient: linear-gradient(135deg, #C4B5FD 0%, #9A8CD8 100%);
            --lavender-glow: rgba(154, 140, 216, 0.3);
            
            /* Light Orb Colors (adjusted for dark) */
            --orb-gold: rgba(232, 184, 74, 0.25);
            --orb-lavender: rgba(154, 140, 216, 0.2);
            --orb-mint: rgba(125, 211, 192, 0.18);
            --orb-rose: rgba(251, 113, 133, 0.15);
            
            /* Text */
            --text-primary: #F5F5F7;
            --text-secondary: #A1A1AA;
            --text-tertiary: #71717A;
            
            /* Tags (adjusted opacity for dark) */
            --tag-gold: rgba(232, 184, 74, 0.18);
            --tag-gold-text: #F5D485;
            --tag-lavender: rgba(154, 140, 216, 0.18);
            --tag-lavender-text: #C4B5FD;
            --tag-mint: rgba(125, 211, 192, 0.18);
            --tag-mint-text: #7DD3C0;
            --tag-rose: rgba(244, 63, 94, 0.18);
            --tag-rose-text: #FDA4AF;
            --tag-blue: rgba(59, 130, 246, 0.18);
            --tag-blue-text: #93C5FD;
            
            /* Shadows (subtle in dark) */
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
            --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
            --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.5);
            --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.6);
            --shadow-gold: 0 8px 32px rgba(232, 184, 74, 0.2);
            --shadow-lavender: 0 8px 32px rgba(154, 140, 216, 0.2);
            
            /* Glass (darker glass) */
            --glass-white: rgba(30, 30, 35, 0.8);
            --glass-border: rgba(255, 255, 255, 0.1);
            
            /* Theme colors */
            --theme-color: #0D0D0F;
        }
        
        /* Body background */
        html.dark-mode body {
            background: var(--bg-primary);
            color: var(--text-primary);
        }
        
        /* Cards and containers */
        html.dark-mode .task-card,
        html.dark-mode .feature-card,
        html.dark-mode .quick-tile,
        html.dark-mode .hero-card,
        html.dark-mode .progress-card {
            background: var(--bg-white);
            border-color: var(--glass-border);
        }
        
        /* Header buttons */
        html.dark-mode .header-btn--glass {
            background: var(--glass-white);
            border-color: var(--glass-border);
            color: var(--text-primary);
        }
        
        /* Category pills */
        html.dark-mode .category-pill--inactive {
            background: var(--glass-white);
            color: var(--text-secondary);
            border-color: var(--glass-border);
        }
        
        /* Bottom nav */
        html.dark-mode .bottom-nav {
            background: transparent !important;
            border-top-color: transparent !important;
        }
        
        html.dark-mode .bottom-nav__container {
            background: var(--glass-white);
        }
        
        html.dark-mode .nav-item {
            color: var(--text-tertiary);
        }
        
        html.dark-mode .nav-item--active {
            color: var(--gold-400);
        }
        
        /* Filter modal and overlays */
        html.dark-mode .filter-modal__content,
        html.dark-mode .radio-menu__sheet {
            background: var(--bg-white);
        }
        
        /* Section headers */
        html.dark-mode .section-header__title {
            color: var(--text-primary);
        }
        
        html.dark-mode .section-header__link {
            color: var(--gold-400);
        }
        
        /* Input fields */
        html.dark-mode input,
        html.dark-mode textarea,
        html.dark-mode select {
            background: var(--bg-soft);
            border-color: var(--glass-border);
            color: var(--text-primary);
        }
        
        /* iOS Install Banner */
        html.dark-mode .ios-install-banner {
            background: var(--bg-white);
        }
        
        /* Smooth theme transition */
        html.dark-mode *,
        html *:not(script):not(style) {
            transition: background-color 0.3s ease, 
                        border-color 0.3s ease,
                        color 0.15s ease,
                        box-shadow 0.3s ease;
        }
    `;

    // ═══════════════════════════════════════════════════════════════════════════
    // INJECT STYLES
    // ═══════════════════════════════════════════════════════════════════════════
    function injectStyles() {
        if (document.getElementById('anhad-theme-styles')) return;

        const style = document.createElement('style');
        style.id = 'anhad-theme-styles';
        style.textContent = darkModeStyles;
        document.head.appendChild(style);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'light';
    }

    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#0D0D0F' : '#FAF8F5';
        }
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        const body = document.body;

        if (theme === 'dark') {
            root.classList.add(DARK_CLASS);
            if (body) body.classList.add(DARK_CLASS);
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove(DARK_CLASS);
            if (body) body.classList.remove(DARK_CLASS);
            root.style.colorScheme = 'light';
        }

        root.setAttribute('data-theme', theme);

        // Update theme toggle icons if they exist
        const icons = document.querySelectorAll('#themeIcon, .theme-icon');
        icons.forEach(icon => {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        });
    }

    function toggle() {
        const current = getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        console.log('🎨 Theme:', newTheme);
        return newTheme;
    }

    function isDark() {
        return getTheme() === 'dark';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Inject styles immediately
    injectStyles();

    // Apply saved theme immediately (before DOM loads to prevent flash)
    applyTheme(getTheme());

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === THEME_KEY && e.newValue) {
            applyTheme(e.newValue);
        }
    });

    // Expose global API
    window.AnhadTheme = {
        get: getTheme,
        set: setTheme,
        toggle: toggle,
        isDark: isDark,
        DARK_CLASS: DARK_CLASS
    };

    // Also expose toggleTheme for backwards compatibility with index.html
    window.toggleTheme = toggle;

    console.log('🎨 ANHAD Theme System loaded. Current:', getTheme());
})();
