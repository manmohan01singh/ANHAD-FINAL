/**
 * ANHAD Global Theme System - Ultimate Performance Edition
 * Optimized for zero-lag, FOUC-free theme switching.
 * 
 * API:
 *   AnhadTheme.toggle() - Toggle between light, dark, and auto
 *   AnhadTheme.set(theme) - Set specific theme ('light', 'dark', 'auto')
 *   AnhadTheme.get() - Get current theme mode
 *   AnhadTheme.isDark() - Check if current effective theme is dark
 */

(function () {
    'use strict';

    const THEME_KEY = 'anhad_theme';
    const html = document.documentElement;

    // Cached DOM references (queried once, not on every 30s tick)
    let _metaTheme = null;
    let _themeIcons = null;

    function getAutoTheme() {
        let timeOfDay = localStorage.getItem('anhad_forced_time_of_day');
        if (timeOfDay && ['morning', 'day', 'evening', 'night'].includes(timeOfDay)) {
            return (timeOfDay === 'night') ? 'dark' : 'light';
        }
        const hour = new Date().getHours();
        return (hour >= 5 && hour < 20) ? 'light' : 'dark';
    }

    function applyTheme(theme) {
        let effectiveTheme = theme;
        if (theme === 'auto') {
            effectiveTheme = getAutoTheme();
        }

        // Determine time-of-day for auto mode styling and images
        let timeOfDay = localStorage.getItem('anhad_forced_time_of_day');
        if (!timeOfDay || !['morning', 'day', 'evening', 'night'].includes(timeOfDay)) {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 9) {
                timeOfDay = 'morning';
            } else if (hour >= 9 && hour < 16) {
                timeOfDay = 'day';
            } else if (hour >= 16 && hour < 20) {
                timeOfDay = 'evening';
            } else {
                timeOfDay = 'night';
            }
        }
        // Only set time-of-day on home page where the sky canvas + palette exist
        // Sub-pages use clean light/dark mode only (no morning/day/evening/night palette)
        if (html.hasAttribute('data-anhad-home')) {
            html.setAttribute('data-time-of-day', timeOfDay);
        }

        // 1. SCOPE TRANSITION KILL to background/color properties only
        // This preserves transform/opacity animations so buttons and scrolling
        // remain alive during theme switch — no more global animation freeze!
        html.classList.add('theme-switching');

        // 2. APPLY THEME ATTRIBUTES & CLASSES
        if (effectiveTheme === 'dark') {
            html.classList.add('dark', 'dark-mode');
            if (document.body) document.body.classList.add('dark-mode');
            html.setAttribute('data-theme', 'dark');
            html.style.colorScheme = 'dark';
        } else {
            html.classList.remove('dark', 'dark-mode');
            if (document.body) document.body.classList.remove('dark-mode');
            html.setAttribute('data-theme', 'light');
            html.style.colorScheme = 'light';
        }

        // Store original mode for UI
        html.setAttribute('data-theme-mode', theme);

        // Clear inline background color to allow CSS variables to take over
        // EXCEPT in auto mode where we need transparent background for image layers
        if (theme !== 'auto') {
            html.style.backgroundColor = '';
        } else {
            // In auto mode, keep background transparent for image layers
            html.style.backgroundColor = 'transparent';
        }

        // Update meta theme-color (cached — not queried on every tick)
        if (!_metaTheme) _metaTheme = document.querySelector('meta[name="theme-color"]');
        if (_metaTheme) {
            _metaTheme.content = effectiveTheme === 'dark' ? '#0D0D0F' : '#FAF8F5';
        }

        // Update theme toggle icons (use cache, reset cache if icons were removed by SPA swap)
        if (!_themeIcons || !_themeIcons.length) {
            _themeIcons = document.querySelectorAll('#themeIcon, .theme-icon');
        }
        if (_themeIcons.length > 0) {
            const iconText = theme === 'auto' ? '✨' : (effectiveTheme === 'dark' ? '☀️' : '🌙');
            const iconClass = theme === 'auto' ? 'fas fa-magic' : (effectiveTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon');
            _themeIcons.forEach(icon => {
                if (icon.tagName === 'SPAN') {
                    icon.textContent = iconText;
                } else {
                    icon.className = iconClass;
                }
            });
        }

        // 3. RESTORE TRANSITIONS after one rAF so the browser paints the instant switch
        requestAnimationFrame(() => {
            html.classList.remove('theme-switching');
            html.classList.remove('theme-changing');
        });
    }

    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'auto';
    }

    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
        // Dispatch on document with bubbling so all listeners on document and window receive it cleanly
        const eventDetail = { bubbles: true, detail: { theme } };
        document.dispatchEvent(new CustomEvent('themechange', eventDetail));
        document.dispatchEvent(new CustomEvent('anhadThemeChanged', eventDetail));
        window.dispatchEvent(new CustomEvent('anhadTimeForced'));
    }

    function toggle() {
        const current = getTheme();
        let next;
        if (current === 'light') next = 'dark';
        else if (current === 'dark') next = 'auto';
        else next = 'light';

        setTheme(next);
        return next;
    }

    function isDark() {
        const theme = getTheme();
        return theme === 'dark' || (theme === 'auto' && getAutoTheme() === 'dark');
    }

    // Auto-update if in auto mode — 500ms lightweight slot check (only runs heavy DOM update on actual slot change)
    let lastAppliedSlot = null;
    let lastAppliedTheme = null;
    setInterval(() => {
        const theme = getTheme();
        if (theme === 'auto') {
            let slot = localStorage.getItem('anhad_forced_time_of_day');
            if (!slot || !['morning', 'day', 'evening', 'night'].includes(slot)) {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 9) slot = 'morning';
                else if (hour >= 9 && hour < 16) slot = 'day';
                else if (hour >= 16 && hour < 20) slot = 'evening';
                else slot = 'night';
            }
            const effectiveTheme = (slot === 'night') ? 'dark' : 'light';
            if (slot !== lastAppliedSlot || effectiveTheme !== lastAppliedTheme) {
                lastAppliedSlot = slot;
                lastAppliedTheme = effectiveTheme;
                applyTheme('auto');
            }
        } else {
            lastAppliedSlot = null;
            lastAppliedTheme = null;
        }
    }, 30000); // 30s safety net — event-driven 'themechange' handles instant switching (was 500ms)

    // Only sync icons on load — full theme was already applied by inline IIFE in <head>.
    // Running full applyTheme() here would cause a redundant style recalculation.
    function _syncIconsOnLoad() {
        const theme = getTheme();
        let effectiveTheme = theme === 'auto' ? getAutoTheme() : theme;
        if (!_themeIcons || !_themeIcons.length) {
            _themeIcons = document.querySelectorAll('#themeIcon, .theme-icon');
        }
        if (_themeIcons.length > 0) {
            const iconText = theme === 'auto' ? '✨' : (effectiveTheme === 'dark' ? '☀️' : '🌙');
            const iconClass = theme === 'auto' ? 'fas fa-magic' : (effectiveTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon');
            _themeIcons.forEach(icon => {
                if (icon.tagName === 'SPAN') icon.textContent = iconText;
                else icon.setAttribute('class', iconClass);
            });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _syncIconsOnLoad);
    } else {
        _syncIconsOnLoad();
    }

    // Listen for OS system theme preference changes and apply instantly in 'auto' mode
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (getTheme() === 'auto') {
                applyTheme('auto');
            }
        });
    }

    // Expose Global API
    window.AnhadTheme = {
        get: getTheme,
        set: setTheme,
        toggle: toggle,
        isDark: isDark,
        getAutoTheme: getAutoTheme,
        apply: applyTheme // For manual forcing
    };

    // Backwards compatibility
    window.toggleTheme = toggle;
    window.applyTheme = applyTheme;
})();
