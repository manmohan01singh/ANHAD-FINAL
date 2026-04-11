/**
 * ANHAD Global Theme System - FOUC-Free Unified Edition
 * Include this script after the blocking script in <head>
 * 
 * API:
 *   AnhadTheme.toggle() - Toggle between dark and light
 *   AnhadTheme.set('dark' | 'light') - Set specific theme
 *   AnhadTheme.get() - Get current theme
 */

(function () {
    'use strict';

    const THEME_KEY = 'anhad_theme';

    function applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark', 'dark-mode');
            root.setAttribute('data-theme', 'dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark', 'dark-mode');
            root.setAttribute('data-theme', 'light');
            root.style.colorScheme = 'light';
        }

        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#0D0D0F' : '#FAF8F5';
        }

        // Update theme toggle icons
        const icons = document.querySelectorAll('#themeIcon, .theme-icon');
        icons.forEach(icon => {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        });
    }

    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'light';
    }

    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    function toggle() {
        const newTheme = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        return newTheme;
    }

    function isDark() {
        return getTheme() === 'dark';
    }

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
        isDark: isDark
    };

    // Backwards compatibility
    window.toggleTheme = toggle;
})();
