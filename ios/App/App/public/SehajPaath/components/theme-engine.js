/**
 * Theme Engine Component
 */

class ThemeEngine {
    constructor() {
        this.themes = {
            gradient: { name: 'Gradient', icon: '🌈' },
            light: { name: 'Light', icon: '☀️' },
            dark: { name: 'Dark', icon: '🌙' },
            sepia: { name: 'Sepia', icon: '📜' },
            oled: { name: 'OLED', icon: '⬛' }
        };

        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
        this.setupAutoSwitch();
    }

    loadTheme() {
        return localStorage.getItem('anhad_theme') || 'gradient';
    }

    saveTheme(theme) {
        localStorage.setItem('anhad_theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        this.currentTheme = theme;
        this.saveTheme(theme);
        this.updateMetaThemeColor(theme);
    }

    updateMetaThemeColor(theme) {
        const colors = {
            gradient: '#1a1a2e',
            light: '#F8F5F0',
            dark: '#1c1c1e',
            sepia: '#f4ecd8',
            oled: '#000000'
        };

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = colors[theme] || colors.gradient;
    }

    getTheme() {
        return this.currentTheme;
    }

    getThemes() {
        return this.themes;
    }

    toggle() {
        const themeList = Object.keys(this.themes);
        const currentIndex = themeList.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeList.length;
        this.applyTheme(themeList[nextIndex]);
        return this.currentTheme;
    }

    setupAutoSwitch() {
        const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
        if (!settings.autoThemeSwitch) return;

        const checkTime = () => {
            const hour = new Date().getHours();
            const darkStart = parseInt(settings.darkModeStart || '19');
            const lightStart = parseInt(settings.lightModeStart || '6');

            if (hour >= darkStart || hour < lightStart) {
                this.applyTheme('dark');
            } else {
                this.applyTheme('light');
            }
        };

        checkTime();
        setInterval(checkTime, 60 * 1000);
    }

    enableAutoSwitch(darkStart = '19:00', lightStart = '06:00') {
        const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
        settings.autoThemeSwitch = true;
        settings.darkModeStart = darkStart.split(':')[0];
        settings.lightModeStart = lightStart.split(':')[0];
        localStorage.setItem('sehajPaathSettings', JSON.stringify(settings));
        this.setupAutoSwitch();
    }

    disableAutoSwitch() {
        const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
        settings.autoThemeSwitch = false;
        localStorage.setItem('sehajPaathSettings', JSON.stringify(settings));
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeEngine;
}
