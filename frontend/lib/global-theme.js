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

        const activeTimeOfDay = (theme === 'dark') ? 'night' : ((theme === 'light') ? 'day' : timeOfDay);
        html.setAttribute('data-time-of-day', activeTimeOfDay);

        // Update in-memory cache
        window._anhadThemeCache = {
            theme: theme,
            timeOfDay: activeTimeOfDay
        };

        // 1. SCOPE TRANSITION KILL to background/color properties only
        html.classList.add('theme-switching');

        // 2. APPLY THEME ATTRIBUTES & CLASSES
        if (effectiveTheme === 'dark' || activeTimeOfDay === 'night') {
            html.classList.add('dark', 'dark-mode');
            if (document.body) document.body.classList.add('dark-mode');
            html.setAttribute('data-theme', 'dark');
            html.style.colorScheme = 'dark';
            html.style.setProperty('background-color', '#0D0D0F', 'important');
            html.style.color = '#F5F5F7';
        } else {
            html.classList.remove('dark', 'dark-mode');
            if (document.body) document.body.classList.remove('dark-mode');
            html.setAttribute('data-theme', 'light');
            html.style.colorScheme = 'light';
            html.style.setProperty('background-color', '#FAF8F5', 'important');
            html.style.color = '#1C1C1E';
        }

        // Store original mode for UI
        html.setAttribute('data-theme-mode', theme);

        // In auto mode with time-based backgrounds
        if (theme === 'auto') {
            let autoBg = '#FAF8F5';
            if (activeTimeOfDay === 'morning') autoBg = '#FFF5EC';
            else if (activeTimeOfDay === 'day') autoBg = '#FAF8F5';
            else if (activeTimeOfDay === 'evening') autoBg = '#FFF8E7';
            else if (activeTimeOfDay === 'night') autoBg = '#0D0D0F';
            html.style.setProperty('background-color', autoBg, 'important');
        }

        // Update meta theme-color (cached — not queried on every tick)
        if (!_metaTheme || !document.contains(_metaTheme)) _metaTheme = document.querySelector('meta[name="theme-color"]');
        if (_metaTheme) {
            _metaTheme.content = (effectiveTheme === 'dark' || activeTimeOfDay === 'night') ? '#0D0D0F' : '#FAF8F5';
        }

        if (!_themeIcons || !_themeIcons.length || !document.contains(_themeIcons[0])) {
            _themeIcons = document.querySelectorAll('#themeIcon, .theme-icon');
        }
        if (_themeIcons.length > 0) {
            const isDarkNow = (effectiveTheme === 'dark' || activeTimeOfDay === 'night');
            const iconText = theme === 'auto' ? '✨' : (isDarkNow ? '☀️' : '🌙');
            const iconClass = theme === 'auto' ? 'fas fa-magic' : (isDarkNow ? 'fas fa-sun' : 'fas fa-moon');
            _themeIcons.forEach(icon => {
                if (icon.tagName === 'SPAN') {
                    icon.textContent = iconText;
                } else if (icon.tagName && icon.tagName.toLowerCase() === 'svg') {
                    const href = isDarkNow ? '#icon-sun-theme' : '#icon-moon-theme';
                    icon.innerHTML = `<use href="${href}"/>`;
                } else {
                    icon.className = iconClass;
                }
            });
        }

        if (typeof window.syncGreetingHeroArtwork === 'function') {
            window.syncGreetingHeroArtwork();
        }

        // 3. RESTORE TRANSITIONS after one rAF
        if (html.classList.contains('theme-switching') || html.classList.contains('theme-changing')) {
            requestAnimationFrame(() => {
                html.classList.remove('theme-switching');
                html.classList.remove('theme-changing');
            });
        }
    }

    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'auto';
    }

    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
        const eventDetail = { bubbles: true, detail: { theme } };
        document.dispatchEvent(new CustomEvent('themechange', eventDetail));
        document.dispatchEvent(new CustomEvent('anhadThemeChanged', eventDetail));
        document.dispatchEvent(new CustomEvent('anhad_theme_changed', eventDetail));
        window.dispatchEvent(new CustomEvent('themechange', eventDetail));
        window.dispatchEvent(new CustomEvent('anhadThemeChanged', eventDetail));
        window.dispatchEvent(new CustomEvent('anhad_theme_changed', eventDetail));
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
                
                // Dispatch events immediately so all page widgets update cards/images/overlays instantly
                const eventDetail = { bubbles: true, detail: { theme: 'auto', slot } };
                document.dispatchEvent(new CustomEvent('themechange', eventDetail));
                document.dispatchEvent(new CustomEvent('anhadThemeChanged', eventDetail));
            }
        } else {
            lastAppliedSlot = null;
            lastAppliedTheme = null;
        }
    }, 1000);

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

    // Scroll-state detection lives in js/scroll-engine.js, which owns the
    // .scrolling / .is-scrolling classes and guards on a cached boolean so it
    // only touches classList on an actual state change. The copy that used to
    // be here had no such guard — it ran classList.add plus a
    // clearTimeout/setTimeout pair on every one of the hundreds of scroll
    // events per gesture, and its independent 150ms timer raced
    // scroll-engine's, leaving the class state inconsistent. Every stylesheet
    // that keys off .scrolling is Home-only, and scroll-engine.js is loaded on
    // Home, so nothing else needs to set it.

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
