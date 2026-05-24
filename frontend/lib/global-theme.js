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

    function getAutoTheme() {
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
        html.setAttribute('data-time-of-day', timeOfDay);

        // 1. DISABLE TRANSITIONS INSTANTLY (Injection method is faster than class-based *)
        let style = document.getElementById('anhad-theme-fast-switch');
        if (!style) {
            style = document.createElement('style');
            style.id = 'anhad-theme-fast-switch';
            document.head.appendChild(style);
        }
        style.textContent = `
            *, *::before, *::after {
                transition: none !important;
                animation-duration: 0s !important;
                animation-delay: 0s !important;
            }
        `;

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
        html.style.backgroundColor = '';

        // Update meta theme-color (Important for mobile browser chrome)
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = effectiveTheme === 'dark' ? '#0D0D0F' : '#FAF8F5';
        }

        // Update theme toggle icons (Query only if they exist)
        const icons = document.querySelectorAll('#themeIcon, .theme-icon');
        if (icons.length > 0) {
            const iconText = theme === 'auto' ? '✨' : (effectiveTheme === 'dark' ? '☀️' : '🌙');
            const iconClass = theme === 'auto' ? 'fas fa-magic' : (effectiveTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon');
            
            icons.forEach(icon => {
                if (icon.tagName === 'SPAN') {
                    icon.textContent = iconText;
                } else {
                    icon.className = iconClass;
                }
            });
        }

        // 3. FORCE REFLOW & RENDER
        // This ensures the browser has processed the "no-transition" state before we remove it
        void html.offsetHeight;

        // 4. RESTORE TRANSITIONS
        // Use double rAF to ensure the browser has painted the theme change
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
                html.classList.remove('theme-changing');
                // NOTE: Do NOT clear body.style.backgroundImage here.
                // anhad-sky-bg.js owns the background and will always set the correct image.
                // Clearing it here causes the 30-second flicker bug.
            });
        });
    }

    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'auto';
    }

    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
        // Custom event for other components to react
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        // ── INSTANT signal to anhad-sky-bg.js so background updates in <1 frame
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
    }, 500); // 500ms safety net — event-driven updates handle the instant case

    // Initial application (Should be fast)
    // Note: blocking-initialization script in <head> handles the VERY first paint
    // but we re-apply here to sync UI elements.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => applyTheme(getTheme()));
    } else {
        applyTheme(getTheme());
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
