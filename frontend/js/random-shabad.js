/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * RANDOM SHABAD MANAGER - ULTRA iOS 26+ EXPERIENCE
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * Premium Random Shabad feature with BaniDB API integration
 * Features: History, Bookmarks, Accent Colors, Font Size, Themes, Reading Mode
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */

class RandomShabadManager {
    constructor() {
        // DOM Elements
        this.overlay = document.getElementById('shabadOverlay');
        this.container = document.getElementById('shabadContainer');
        this.loadingState = document.getElementById('shabadLoading');
        this.errorState = document.getElementById('shabadError');
        this.contentArea = document.getElementById('shabadContent');
        this.gurmukhiContainer = document.getElementById('shabadGurmukhi');
        this.angBadge = document.getElementById('shabadAngNumber');
        this.sourceInfo = document.getElementById('shabadSource');

        // Settings with defaults
        this.settings = {
            larivaar: false,
            transliteration: true,
            english: true,
            punjabi: false,
            fontSize: 1.55, // rem
            accentColor: 'gold',
            theme: 'dark', // 'dark' or 'light'
            readingMode: false,
            vibration: true
        };

        // Accent Colors Map
        this.accentColors = {
            gold: { value: '#FFD700', rgb: '255, 215, 0' },
            amber: { value: '#F59E0B', rgb: '245, 158, 11' },
            saffron: { value: '#FF8C00', rgb: '255, 140, 0' },
            rose: { value: '#F43F5E', rgb: '244, 63, 94' },
            violet: { value: '#8B5CF6', rgb: '139, 92, 246' },
            teal: { value: '#14B8A6', rgb: '20, 184, 166' },
            blue: { value: '#3B82F6', rgb: '59, 130, 246' },
            emerald: { value: '#10B981', rgb: '16, 185, 129' }
        };

        // Current shabad data
        this.currentShabad = null;
        this.bookmarks = this.loadBookmarks();
        this.history = this.loadHistory();

        // Bind events
        this.bindEvents();
        this.loadSettings();
        this.applySettings();
        this.injectAdditionalHTML();
    }

    // ═══════════════════════════════════════════════════════════════
    // ADDITIONAL HTML INJECTION
    // ═══════════════════════════════════════════════════════════════
    injectAdditionalHTML() {
        // Add gradient mesh to backdrop
        const backdrop = this.overlay?.querySelector('.shabad-backdrop-blur');
        if (backdrop && !backdrop.querySelector('.shabad-gradient-mesh')) {
            const mesh = document.createElement('div');
            mesh.className = 'shabad-gradient-mesh';
            backdrop.after(mesh);
        }

        // Add more particles
        const particles = this.overlay?.querySelector('.shabad-particles');
        if (particles && particles.children.length < 8) {
            for (let i = particles.children.length; i < 8; i++) {
                const particle = document.createElement('span');
                particle.className = 'particle';
                particles.appendChild(particle);
            }
        }

        // Add inner glow layer
        const glassShine = this.container?.querySelector('.shabad-glass-shine');
        if (glassShine && !this.container.querySelector('.shabad-glass-inner-glow')) {
            const innerGlow = document.createElement('div');
            innerGlow.className = 'shabad-glass-inner-glow';
            glassShine.after(innerGlow);
        }

        // Add header controls wrapper
        const closeBtn = this.container?.querySelector('.shabad-close-btn');
        const settingsBtn = this.container?.querySelector('.shabad-settings-btn');
        if (closeBtn && !this.container.querySelector('.shabad-header-controls')) {
            const controls = document.createElement('div');
            controls.className = 'shabad-header-controls';

            // Move close button
            controls.appendChild(closeBtn);

            // Create actions wrapper
            const actions = document.createElement('div');
            actions.className = 'shabad-header-actions';

            // Add history button
            const historyBtn = document.createElement('button');
            historyBtn.className = 'shabad-history-btn';
            historyBtn.id = 'shabadHistoryBtn';
            historyBtn.setAttribute('aria-label', 'View History');
            historyBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                </svg>
            `;
            actions.appendChild(historyBtn);

            // Add theme toggle button
            const themeBtn = document.createElement('button');
            themeBtn.className = 'shabad-theme-btn';
            themeBtn.id = 'shabadThemeToggle';
            themeBtn.setAttribute('aria-label', 'Toggle Theme');
            themeBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
            `;
            actions.appendChild(themeBtn);

            // Move settings button
            if (settingsBtn) {
                actions.appendChild(settingsBtn);
            }

            controls.appendChild(actions);
            this.container.insertBefore(controls, this.container.firstChild.nextSibling);
        }

        // Add icon ring to header icon
        const headerIcon = this.container?.querySelector('.shabad-header-icon');
        if (headerIcon && !headerIcon.querySelector('.icon-ring')) {
            const ring = document.createElement('span');
            ring.className = 'icon-ring';
            headerIcon.insertBefore(ring, headerIcon.querySelector('.icon-glow')?.nextSibling);
        }

        // Add icon to ang badge
        if (this.angBadge && !this.angBadge.querySelector('.ang-icon')) {
            const angIcon = document.createElement('span');
            angIcon.className = 'ang-icon';
            angIcon.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
            `;
            this.angBadge.insertBefore(angIcon, this.angBadge.firstChild);
        }

        // Enhance settings sheet with more options
        this.enhanceSettingsSheet();
    }

    enhanceSettingsSheet() {
        const sheetBody = document.querySelector('#shabadSettingsSheet .sheet-body');
        if (!sheetBody || sheetBody.querySelector('.settings-section')) return;

        sheetBody.innerHTML = `
            <!-- Display Section -->
            <div class="settings-section">
                <div class="settings-section-title">Display Options</div>
                <div class="settings-group">
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">ਲੜੀਵਾਰ</span>
                            <span class="setting-desc">Continuous script without spaces</span>
                        </div>
                        <label class="ios-toggle">
                            <input type="checkbox" id="toggleShabadLarivaar">
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Transliteration</span>
                            <span class="setting-desc">Roman script pronunciation</span>
                        </div>
                        <label class="ios-toggle">
                            <input type="checkbox" id="toggleShabadTranslit" checked>
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">English Translation</span>
                            <span class="setting-desc">Show meaning in English</span>
                        </div>
                        <label class="ios-toggle">
                            <input type="checkbox" id="toggleShabadEnglish" checked>
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">ਪੰਜਾਬੀ ਅਰਥ</span>
                            <span class="setting-desc">Punjabi translation</span>
                        </div>
                        <label class="ios-toggle">
                            <input type="checkbox" id="toggleShabadPunjabi">
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Font Size Section -->
            <div class="settings-section">
                <div class="settings-section-title">Font Size</div>
                <div class="settings-group">
                    <div class="setting-item">
                        <div class="font-size-control">
                            <div class="font-size-slider">
                                <input type="range" id="shabadFontSize" min="1" max="2.5" step="0.1" value="1.55">
                            </div>
                            <div class="font-size-labels">
                                <span>ੳ Small</span>
                                <span>ੳ Medium</span>
                                <span style="font-size: 1.2em;">ੳ Large</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Accent Color Section -->
            <div class="settings-section">
                <div class="settings-section-title">Accent Color</div>
                <div class="settings-group">
                    <div class="setting-item">
                        <div class="accent-colors-grid">
                            <button class="accent-color-btn active" data-color="gold" title="Gold"></button>
                            <button class="accent-color-btn" data-color="amber" title="Amber"></button>
                            <button class="accent-color-btn" data-color="saffron" title="Saffron"></button>
                            <button class="accent-color-btn" data-color="rose" title="Rose"></button>
                            <button class="accent-color-btn" data-color="violet" title="Violet"></button>
                            <button class="accent-color-btn" data-color="teal" title="Teal"></button>
                            <button class="accent-color-btn" data-color="blue" title="Blue"></button>
                            <button class="accent-color-btn" data-color="emerald" title="Emerald"></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Theme Section -->
            <div class="settings-section">
                <div class="settings-section-title">Theme</div>
                <div class="settings-group">
                    <div class="setting-item">
                        <div class="theme-selector">
                            <button class="theme-btn active" data-theme="dark">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                                </svg>
                                Dark
                            </button>
                            <button class="theme-btn" data-theme="light">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="5"/>
                                    <line x1="12" y1="1" x2="12" y2="3"/>
                                    <line x1="12" y1="21" x2="12" y2="23"/>
                                </svg>
                                Light
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Experience Section -->
            <div class="settings-section">
                <div class="settings-section-title">Experience</div>
                <div class="settings-group">
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Reading Mode</span>
                            <span class="setting-desc">Larger text, more space</span>
                        </div>
                        <label class="ios-toggle">
                            <input type="checkbox" id="toggleReadingMode">
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <span class="setting-label">Haptic Feedback</span>
                            <span class="setting-desc">Vibration on interactions</span>
                        </div>
                        <label class="ios-toggle">
                            <input type="checkbox" id="toggleVibration" checked>
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- History Section -->
            <div class="settings-section" id="historySection" style="display: none;">
                <div class="settings-section-title">Recent Shabads</div>
                <div class="shabad-history-list" id="shabadHistoryList">
                    <p style="color: var(--shabad-text-muted); text-align: center; padding: 20px;">
                        No history yet. Get your first Divine Message!
                    </p>
                </div>
            </div>
        `;

        // Re-bind settings events after injection
        this.bindSettingsEvents();
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT BINDINGS
    // ═══════════════════════════════════════════════════════════════
    bindEvents() {
        // Close button
        document.getElementById('shabadClose')?.addEventListener('click', () => this.close());

        // Backdrop click
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay || e.target.classList.contains('shabad-backdrop-blur')) {
                this.close();
            }
        });

        // Action buttons
        document.getElementById('newShabadBtn')?.addEventListener('click', () => {
            this.vibrate();
            this.loadShabad();
        });
        document.getElementById('copyShabadBtn')?.addEventListener('click', () => {
            this.vibrate();
            this.copyShabad();
        });
        document.getElementById('shareShabadBtn')?.addEventListener('click', () => {
            this.vibrate();
            this.shareShabad();
        });
        document.getElementById('bookmarkShabadBtn')?.addEventListener('click', () => {
            this.vibrate();
            this.toggleBookmark();
        });
        document.getElementById('shabadRetryBtn')?.addEventListener('click', () => {
            this.vibrate();
            this.loadShabad();
        });

        // Settings
        document.getElementById('shabadSettingsBtn')?.addEventListener('click', () => {
            this.vibrate();
            this.openSettings();
        });
        document.getElementById('shabadSettingsClose')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('shabadSettingsBackdrop')?.addEventListener('click', () => this.closeSettings());

        // Keyboard escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
                this.close();
            }
        });

        // Swipe to close
        this.setupSwipeGesture();
    }

    bindSettingsEvents() {
        // Display toggles
        document.getElementById('toggleShabadLarivaar')?.addEventListener('change', (e) => {
            this.settings.larivaar = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });

        document.getElementById('toggleShabadTranslit')?.addEventListener('change', (e) => {
            this.settings.transliteration = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });

        document.getElementById('toggleShabadEnglish')?.addEventListener('change', (e) => {
            this.settings.english = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });

        document.getElementById('toggleShabadPunjabi')?.addEventListener('change', (e) => {
            this.settings.punjabi = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });

        // Font size slider
        document.getElementById('shabadFontSize')?.addEventListener('input', (e) => {
            this.settings.fontSize = parseFloat(e.target.value);
            this.applyFontSize();
            this.saveSettings();
        });

        // Accent colors
        document.querySelectorAll('.accent-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.setAccentColor(color);
                this.vibrate();
            });
        });

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
                this.vibrate();
            });
        });

        // Theme toggle button in header
        document.getElementById('shabadThemeToggle')?.addEventListener('click', () => {
            const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
            this.vibrate();
        });

        // Reading mode toggle
        document.getElementById('toggleReadingMode')?.addEventListener('change', (e) => {
            this.settings.readingMode = e.target.checked;
            this.applyReadingMode();
            this.saveSettings();
        });

        // Vibration toggle
        document.getElementById('toggleVibration')?.addEventListener('change', (e) => {
            this.settings.vibration = e.target.checked;
            this.saveSettings();
        });

        // History button
        document.getElementById('shabadHistoryBtn')?.addEventListener('click', () => {
            this.vibrate();
            this.showHistorySection();
        });
    }

    setupSwipeGesture() {
        if (!this.container) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        this.container.addEventListener('touchstart', (e) => {
            if (e.target.closest('.shabad-scroll-container')) return;
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        this.container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0) {
                this.container.style.transform = `translateY(${Math.min(diff, 200)}px) scale(${1 - diff * 0.0005})`;
                this.container.style.opacity = 1 - diff * 0.002;
            }
        }, { passive: true });

        this.container.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;

            const diff = currentY - startY;
            if (diff > 100) {
                this.close();
            } else {
                this.container.style.transform = '';
                this.container.style.opacity = '';
            }
            startY = 0;
            currentY = 0;
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS APPLICATION
    // ═══════════════════════════════════════════════════════════════
    applySettings() {
        this.applyAccentColor();
        this.applyFontSize();
        this.applyTheme();
        this.applyReadingMode();
        this.syncSettingsUI();
    }

    applyAccentColor() {
        const color = this.accentColors[this.settings.accentColor] || this.accentColors.gold;
        document.documentElement.style.setProperty('--shabad-accent', color.value);
        document.documentElement.style.setProperty('--shabad-accent-rgb', color.rgb);
    }

    applyFontSize() {
        document.documentElement.style.setProperty('--shabad-font-size', `${this.settings.fontSize}rem`);
    }

    applyTheme() {
        this.overlay?.setAttribute('data-shabad-theme', this.settings.theme);
    }

    applyReadingMode() {
        if (this.contentArea) {
            this.contentArea.classList.toggle('reading-mode', this.settings.readingMode);
        }
    }

    syncSettingsUI() {
        // Sync toggles
        const larivaar = document.getElementById('toggleShabadLarivaar');
        const translit = document.getElementById('toggleShabadTranslit');
        const english = document.getElementById('toggleShabadEnglish');
        const punjabi = document.getElementById('toggleShabadPunjabi');
        const readingMode = document.getElementById('toggleReadingMode');
        const vibration = document.getElementById('toggleVibration');
        const fontSlider = document.getElementById('shabadFontSize');

        if (larivaar) larivaar.checked = this.settings.larivaar;
        if (translit) translit.checked = this.settings.transliteration;
        if (english) english.checked = this.settings.english;
        if (punjabi) punjabi.checked = this.settings.punjabi;
        if (readingMode) readingMode.checked = this.settings.readingMode;
        if (vibration) vibration.checked = this.settings.vibration;
        if (fontSlider) fontSlider.value = this.settings.fontSize;

        // Sync accent color buttons
        document.querySelectorAll('.accent-color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.settings.accentColor);
        });

        // Sync theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });
    }

    setAccentColor(color) {
        this.settings.accentColor = color;
        this.applyAccentColor();
        this.saveSettings();

        // Update UI
        document.querySelectorAll('.accent-color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
    }

    setTheme(theme) {
        this.settings.theme = theme;
        this.applyTheme();
        this.saveSettings();

        // Update UI
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // CORE FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════
    open() {
        this.overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.loadShabad();
    }

    close() {
        this.overlay?.classList.remove('active');
        document.body.style.overflow = '';

        // Reset container transform
        if (this.container) {
            this.container.style.transform = '';
            this.container.style.opacity = '';
        }
    }

    async loadShabad() {
        this.showLoading();

        try {
            // Use BaniDB API for random shabad
            const randomId = Math.floor(Math.random() * 60403) + 1;
            const response = await fetch(`https://api.banidb.com/v2/shabads/${randomId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch shabad');
            }

            const data = await response.json();

            if (!data || !data.verses || data.verses.length === 0) {
                throw new Error('No shabad found');
            }

            this.currentShabad = data;
            this.renderShabad(data);
            this.addToHistory(data);
            this.showContent();
            this.vibrate();

        } catch (error) {
            console.error('Error loading shabad:', error);
            this.showError();
        }
    }

    renderShabad(data) {
        if (!this.gurmukhiContainer) return;

        const verses = data.verses || [];
        const shabadInfo = data.shabadInfo || {};

        // Update Ang number
        if (this.angBadge) {
            const angValue = this.angBadge.querySelector('.ang-value');
            if (angValue) {
                angValue.textContent = shabadInfo.pageNo || verses[0]?.pageNo || '---';
            }
        }

        // Update source info
        if (this.sourceInfo) {
            const sourceName = shabadInfo.source?.gurmukhi || verses[0]?.source?.gurmukhi || '';
            const writer = shabadInfo.writer?.gurmukhi || verses[0]?.writer?.gurmukhi || '';
            const raag = shabadInfo.raag?.gurmukhi || verses[0]?.raag?.gurmukhi || '';

            this.sourceInfo.innerHTML = `
                ${sourceName ? `<span>${sourceName}</span>` : ''}
                ${raag ? `<span>${raag}</span>` : ''}
                ${writer ? `<span>${writer}</span>` : ''}
            `;
        }

        // Render lines
        this.gurmukhiContainer.innerHTML = verses.map(verse => {
            const gurmukhi = this.settings.larivaar
                ? (verse.verse?.unicode || '').replace(/\s+/g, '')
                : (verse.verse?.unicode || '');

            const transliteration = verse.transliteration || '';
            const englishTranslation = verse.translation?.en?.bdb || verse.translation?.en?.ms || '';
            const punjabiTranslation = verse.translation?.pu?.bdb?.unicode || verse.translation?.pu?.ss?.unicode || '';

            return `
                <div class="shabad-line" data-larivaar="${this.settings.larivaar}">
                    <div class="shabad-gurmukhi">${gurmukhi || 'ੴ'}</div>
                    ${this.settings.transliteration && transliteration ?
                    `<div class="shabad-transliteration">${transliteration}</div>` : ''}
                    ${this.settings.english && englishTranslation ?
                    `<div class="shabad-translation">${englishTranslation}</div>` : ''}
                    ${this.settings.punjabi && punjabiTranslation ?
                    `<div class="shabad-translation punjabi">${punjabiTranslation}</div>` : ''}
                </div>
            `;
        }).join('');

        // Update bookmark button state
        this.updateBookmarkButton();
    }

    renderCurrentShabad() {
        if (this.currentShabad) {
            this.renderShabad(this.currentShabad);
        }
    }

    showLoading() {
        if (this.loadingState) this.loadingState.style.display = 'flex';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.contentArea) this.contentArea.style.display = 'none';
    }

    showContent() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.contentArea) this.contentArea.style.display = 'flex';
    }

    showError() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'flex';
        if (this.contentArea) this.contentArea.style.display = 'none';
    }

    // ═══════════════════════════════════════════════════════════════
    // COPY & SHARE
    // ═══════════════════════════════════════════════════════════════
    async copyShabad() {
        if (!this.currentShabad) return;

        const verses = this.currentShabad.verses || [];
        const ang = this.currentShabad.shabadInfo?.pageNo || verses[0]?.pageNo || '';

        const text = verses.map(v => {
            let line = v.verse?.unicode || '';
            if (this.settings.transliteration && v.transliteration) {
                line += '\n' + v.transliteration;
            }
            if (this.settings.english) {
                const translation = v.translation?.en?.bdb || v.translation?.en?.ms || '';
                if (translation) line += '\n' + translation;
            }
            return line;
        }).join('\n\n');

        const fullText = `🙏 ਰੈਂਡਮ ਸ਼ਬਦ • Random Shabad\nAng ${ang}\n\n${text}\n\n— Shared via ANHAD`;

        try {
            await navigator.clipboard.writeText(fullText);
            this.showToast('Shabad copied!', 'success');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Failed to copy');
        }
    }

    async shareShabad() {
        if (!this.currentShabad) return;

        const verses = this.currentShabad.verses || [];
        const firstLine = verses[0]?.verse?.unicode || 'Random Shabad';
        const ang = this.currentShabad.shabadInfo?.pageNo || verses[0]?.pageNo || '';

        const shareData = {
            title: 'ਰੈਂਡਮ ਸ਼ਬਦ • Random Shabad',
            text: `${firstLine}\n\nAng ${ang} - Sri Guru Granth Sahib Ji\n\nShared via ANHAD`,
            url: window.location.origin
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.showToast('Shared!', 'success');
            } else {
                await navigator.clipboard.writeText(shareData.text);
                this.showToast('Copied to clipboard!', 'success');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOKMARKS
    // ═══════════════════════════════════════════════════════════════
    toggleBookmark() {
        if (!this.currentShabad) return;

        const shabadId = this.currentShabad.shabadInfo?.shabadId ||
            this.currentShabad.verses?.[0]?.shabadId;

        if (!shabadId) return;

        const index = this.bookmarks.findIndex(b => b.id === shabadId);

        if (index > -1) {
            this.bookmarks.splice(index, 1);
            this.showToast('Bookmark removed');
        } else {
            this.bookmarks.push({
                id: shabadId,
                ang: this.currentShabad.shabadInfo?.pageNo || this.currentShabad.verses?.[0]?.pageNo,
                firstLine: this.currentShabad.verses?.[0]?.verse?.unicode || '',
                timestamp: Date.now()
            });
            this.showToast('Shabad saved!', 'success');
        }

        this.saveBookmarks();
        this.updateBookmarkButton();
    }

    updateBookmarkButton() {
        const btn = document.getElementById('bookmarkShabadBtn');
        if (!btn || !this.currentShabad) return;

        const shabadId = this.currentShabad.shabadInfo?.shabadId ||
            this.currentShabad.verses?.[0]?.shabadId;

        const isBookmarked = this.bookmarks.some(b => b.id === shabadId);

        btn.classList.toggle('bookmarked', isBookmarked);

        const icon = btn.querySelector('.action-icon svg');
        if (icon) {
            icon.style.fill = isBookmarked ? 'currentColor' : 'none';
        }
    }

    loadBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('gurbani_shabad_bookmarks') || '[]');
        } catch {
            return [];
        }
    }

    saveBookmarks() {
        try {
            localStorage.setItem('gurbani_shabad_bookmarks', JSON.stringify(this.bookmarks));
        } catch (err) {
            console.error('Failed to save bookmarks:', err);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // HISTORY
    // ═══════════════════════════════════════════════════════════════
    addToHistory(data) {
        const shabadId = data.shabadInfo?.shabadId || data.verses?.[0]?.shabadId;
        if (!shabadId) return;

        // Remove if already exists
        this.history = this.history.filter(h => h.id !== shabadId);

        // Add to front
        this.history.unshift({
            id: shabadId,
            ang: data.shabadInfo?.pageNo || data.verses?.[0]?.pageNo,
            firstLine: data.verses?.[0]?.verse?.unicode || '',
            timestamp: Date.now()
        });

        // Keep only last 20
        this.history = this.history.slice(0, 20);
        this.saveHistory();
    }

    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem('gurbani_shabad_history') || '[]');
        } catch {
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('gurbani_shabad_history', JSON.stringify(this.history));
        } catch (err) {
            console.error('Failed to save history:', err);
        }
    }

    showHistorySection() {
        const historySection = document.getElementById('historySection');
        const historyList = document.getElementById('shabadHistoryList');

        if (historySection) {
            historySection.style.display = 'block';
        }

        if (historyList && this.history.length > 0) {
            historyList.innerHTML = this.history.map(item => `
                <div class="history-item" data-shabad-id="${item.id}">
                    <div class="history-item-ang">${item.ang || '—'}</div>
                    <div class="history-item-content">
                        <div class="history-item-line">${item.firstLine || 'ੴ'}</div>
                        <div class="history-item-time">${this.formatTimeAgo(item.timestamp)}</div>
                    </div>
                </div>
            `).join('');

            // Bind click events
            historyList.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const shabadId = item.dataset.shabadId;
                    this.closeSettings();
                    await this.loadShabadById(shabadId);
                });
            });
        }

        this.openSettings();
    }

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    async loadShabadById(shabadId) {
        this.showLoading();

        try {
            const response = await fetch(`https://api.banidb.com/v2/shabads/${shabadId}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            if (!data || !data.verses || data.verses.length === 0) {
                throw new Error('No shabad found');
            }

            this.currentShabad = data;
            this.renderShabad(data);
            this.showContent();

        } catch (error) {
            console.error('Error loading shabad by ID:', error);
            this.showError();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS PANEL
    // ═══════════════════════════════════════════════════════════════
    openSettings() {
        document.getElementById('shabadSettingsBackdrop')?.classList.add('visible');
        document.getElementById('shabadSettingsSheet')?.classList.add('visible');
        this.syncSettingsUI();
    }

    closeSettings() {
        document.getElementById('shabadSettingsBackdrop')?.classList.remove('visible');
        document.getElementById('shabadSettingsSheet')?.classList.remove('visible');
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('gurbani_shabad_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('gurbani_shabad_settings', JSON.stringify(this.settings));
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════
    vibrate() {
        if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        document.querySelector('.shabad-toast')?.remove();

        const toast = document.createElement('div');
        toast.className = `shabad-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

let randomShabadManager;

document.addEventListener('DOMContentLoaded', () => {
    randomShabadManager = new RandomShabadManager();

    // Expose global functions for onclick handlers
    window.openRandomShabad = () => randomShabadManager.open();
    window.closeRandomShabad = () => randomShabadManager.close();
});

// Global access
window.RandomShabadManager = RandomShabadManager;
