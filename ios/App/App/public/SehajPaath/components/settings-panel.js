/**
 * Settings Panel Component
 */

class SettingsPanel {
    constructor() {
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
        } catch {
            return this.getDefaults();
        }
    }

    getDefaults() {
        // Sync with global theme by default
        const globalTheme = window.AnhadTheme ? window.AnhadTheme.get() : 'light';
        return {
            theme: globalTheme, // Use global theme (light or dark only)
            fontSize: 22,
            lineSpacing: 2.2,
            displayMode: 'padchhed',
            showTranslation: true,
            showTransliteration: false,
            translationLang: 'en',
            autoHideHeader: true,
            hapticFeedback: true,
            autoThemeSwitch: false,
            reminderEnabled: false,
            reminderTime: '06:00',
            notificationsEnabled: true
        };
    }

    save() {
        localStorage.setItem('sehajPaathSettings', JSON.stringify(this.settings));
    }

    get(key) {
        return this.settings[key] ?? this.getDefaults()[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
        this.applyChange(key, value);
    }

    applyChange(key, value) {
        switch (key) {
            case 'theme':
                // Sync with global theme system
                if (window.AnhadTheme) {
                    window.AnhadTheme.set(value);
                } else {
                    document.documentElement.dataset.theme = value;
                }
                break;
            case 'fontSize':
                // Apply to CSS variable
                document.documentElement.style.setProperty('--gurmukhi-size', `${value}px`);
                document.documentElement.style.setProperty('--gurmukhi-font-size', `${value}px`);

                // Apply directly to all Gurmukhi text elements
                const gurmukhiElements = document.querySelectorAll(
                    '.gurmukhi, .gurmukhi-text, .gurbani-line, .verse-gurmukhi, ' +
                    '[class*="gurmukhi"], .verse__gurmukhi, .shabad-line, .pangti'
                );
                gurmukhiElements.forEach(el => {
                    el.style.fontSize = `${value}px`;
                });

                // Also apply to reader content
                const readerContent = document.querySelector('.reader-content, .gurbani-content');
                if (readerContent) {
                    readerContent.style.setProperty('--gurmukhi-size', `${value}px`);
                }

                console.log(`✅ Font size applied: ${value}px`);
                break;
            case 'lineSpacing':
                document.documentElement.style.setProperty('--line-height', value);
                break;
        }
    }

    applyAll() {
        Object.entries(this.settings).forEach(([key, value]) => {
            this.applyChange(key, value);
        });
    }

    reset() {
        this.settings = this.getDefaults();
        this.save();
        this.applyAll();
    }

    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = { ...this.getDefaults(), ...imported };
            this.save();
            this.applyAll();
            return true;
        } catch {
            return false;
        }
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="settings-panel-inner">
                <!-- Appearance -->
                <section class="settings-section">
                    <h3 class="section-title">Appearance</h3>
                    
                    <div class="setting-row">
                        <span class="setting-label">Theme</span>
                        <div class="theme-switcher">
                            ${['light', 'dark'].map(t => `
                                <button class="theme-option ${this.get('theme') === t ? 'active' : ''}" data-theme="${t}">
                                    <span class="theme-icon">${{ light: '☀️', dark: '🌙' }[t]}</span>
                                    <span class="theme-label">${t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <span class="setting-label">Font Size</span>
                        <div class="slider-control">
                            <span>A</span>
                            <input type="range" id="settingsFontSize" min="16" max="32" value="${this.get('fontSize')}">
                            <span class="large">A</span>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <span class="setting-label">Line Spacing</span>
                        <input type="range" id="settingsLineSpacing" min="1.5" max="3" step="0.1" value="${this.get('lineSpacing')}">
                    </div>
                </section>
                
                <!-- Reading -->
                <section class="settings-section">
                    <h3 class="section-title">Reading</h3>
                    
                    <div class="setting-row toggle-row">
                        <div>
                            <span class="setting-label">Show Translation</span>
                            <span class="setting-desc">Display English translation</span>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" id="settingsShowTranslation" ${this.get('showTranslation') ? 'checked' : ''}>
                            <span class="toggle-track"></span>
                        </label>
                    </div>
                    
                    <div class="setting-row toggle-row">
                        <div>
                            <span class="setting-label">Show Transliteration</span>
                            <span class="setting-desc">Display phonetic text</span>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" id="settingsShowTranslit" ${this.get('showTransliteration') ? 'checked' : ''}>
                            <span class="toggle-track"></span>
                        </label>
                    </div>
                    
                    <div class="setting-row">
                        <span class="setting-label">Display Mode</span>
                        <div class="radio-options">
                            <label class="radio-option">
                                <input type="radio" name="displayMode" value="padchhed" ${this.get('displayMode') === 'padchhed' ? 'checked' : ''}>
                                <span>Padchhed</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="displayMode" value="larivaar" ${this.get('displayMode') === 'larivaar' ? 'checked' : ''}>
                                <span>Larivaar</span>
                            </label>
                        </div>
                    </div>
                </section>
                
                <!-- Experience -->
                <section class="settings-section">
                    <h3 class="section-title">Experience</h3>
                    
                    <div class="setting-row toggle-row">
                        <div>
                            <span class="setting-label">Auto-hide Header</span>
                            <span class="setting-desc">Hide header when scrolling</span>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" id="settingsAutoHide" ${this.get('autoHideHeader') ? 'checked' : ''}>
                            <span class="toggle-track"></span>
                        </label>
                    </div>
                    
                    <div class="setting-row toggle-row">
                        <div>
                            <span class="setting-label">Haptic Feedback</span>
                            <span class="setting-desc">Vibration on interactions</span>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" id="settingsHaptic" ${this.get('hapticFeedback') ? 'checked' : ''}>
                            <span class="toggle-track"></span>
                        </label>
                    </div>
                </section>
                
                <!-- Data -->
                <section class="settings-section">
                    <h3 class="section-title">Data</h3>
                    
                    <button class="settings-btn" id="exportDataBtn">
                        <span>📤</span> Export Data
                    </button>
                    <button class="settings-btn danger" id="clearDataBtn">
                        <span>🗑️</span> Clear All Data
                    </button>
                </section>
                
                <!-- About -->
                <section class="settings-section about">
                    <p class="app-version">Sehaj Paath v1.0.0</p>
                    <p class="app-credit">Made with ❤️ for the Sangat</p>
                </section>
            </div>
        `;

        this.attachListeners(container);
    }

    attachListeners(container) {
        // Theme switcher - sync with global theme
        container.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                this.set('theme', theme);
                
                // Show toast notification
                const toast = document.createElement('div');
                toast.className = 'theme-toast';
                toast.textContent = `Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
                document.body.appendChild(toast);
                setTimeout(() => toast.classList.add('show'), 10);
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 2000);
            });
        });

        // Font size
        container.querySelector('#settingsFontSize')?.addEventListener('input', e => {
            this.set('fontSize', parseInt(e.target.value));
        });

        // Line spacing
        container.querySelector('#settingsLineSpacing')?.addEventListener('input', e => {
            this.set('lineSpacing', parseFloat(e.target.value));
        });

        // Toggles
        container.querySelector('#settingsShowTranslation')?.addEventListener('change', e => {
            this.set('showTranslation', e.target.checked);
        });

        container.querySelector('#settingsShowTranslit')?.addEventListener('change', e => {
            this.set('showTransliteration', e.target.checked);
        });

        container.querySelector('#settingsAutoHide')?.addEventListener('change', e => {
            this.set('autoHideHeader', e.target.checked);
        });

        container.querySelector('#settingsHaptic')?.addEventListener('change', e => {
            this.set('hapticFeedback', e.target.checked);
        });

        // Display mode
        container.querySelectorAll('input[name="displayMode"]').forEach(radio => {
            radio.addEventListener('change', e => {
                this.set('displayMode', e.target.value);
            });
        });

        // Export
        container.querySelector('#exportDataBtn')?.addEventListener('click', () => {
            const data = {
                settings: this.settings,
                bookmarks: JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]'),
                state: JSON.parse(localStorage.getItem('sehajPaathState') || '{}'),
                stats: JSON.parse(localStorage.getItem('sehajPaathStats') || '{}')
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sehaj-paath-backup-${new Date().toLocaleDateString('en-CA')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Clear data
        container.querySelector('#clearDataBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure? This will delete all your reading progress, bookmarks, and settings.')) {
                Object.keys(localStorage)
                    .filter(k => k.startsWith('sehajPaath'))
                    .forEach(k => localStorage.removeItem(k));
                location.reload();
            }
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsPanel;
}
