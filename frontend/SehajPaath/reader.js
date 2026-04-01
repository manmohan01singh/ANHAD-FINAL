/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEHAJ PAATH READER - ENHANCED
 * Immersive Gurbani Reading Experience
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Initialize global cache instance before BaniDBAPI tries to use it
if (typeof window !== 'undefined' && !window.sehajPaathCache) {
    window.sehajPaathCache = new OfflineManager();
    console.log('[SehajPaath] Global cache initialized');
}

class SehajPaathReader {
    constructor() {
        this.currentAng = 1;
        this.angData = null;
        this.settings = this.loadSettings();
        this.isBookmarked = false;
        this.readingStartTime = Date.now();
        this.lastScrollPosition = 0;
        this.headerVisible = true;
        this.api = null;

        // Detached Reading Mode - prevents Random/Search from corrupting progress
        this.isDetachedMode = false;
        this.detachedSource = null;

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Sehaj Paath Reader...');

            // Get Ang from URL params
            const params = new URLSearchParams(window.location.search);
            this.currentAng = parseInt(params.get('ang')) || this.getSavedAng();

            // Capture search query from URL
            this.searchQuery = params.get('q') || null;
            this.highlightedLineId = params.get('lineId') || null;

            // Check detached mode
            const source = params.get('source');
            if (source && ['random', 'search', 'bookmark', 'share', 'hukamnama'].includes(source)) {
                this.isDetachedMode = true;
                this.detachedSource = source;
                console.log(`📌 DETACHED MODE: ${source}`);
            }

            if (this.searchQuery) {
                this.isDetachedMode = true;
                this.detachedSource = 'search';
            }

            console.log('� Loading Ang:', this.currentAng);

            // Initialize API with error handling
            try {
                this.api = new BaniDBAPI();
                console.log('✅ API initialized');
            } catch (apiError) {
                console.error('❌ Failed to initialize API:', apiError);
                this.showErrorMessage('Failed to initialize reader. Please refresh.');
                return;
            }

            // Setup event listeners
            this.setupEventListeners();
            this.applySettings();

            // Load the Ang with error handling
            try {
                await this.loadAng(this.currentAng);
                console.log('✅ Reader initialized successfully');
            } catch (loadError) {
                console.error('❌ Failed to load initial Ang:', loadError);
                this.showErrorMessage('Failed to load Gurbani. Please check your connection.');
            }

            // Auto-download next 5 Angs
            setTimeout(() => {
                this.autoDownloadNextFiveAngs().catch(err => {
                    console.warn('Auto-download failed:', err);
                });
            }, 2000);

        } catch (error) {
            console.error('❌ Reader initialization error:', error);
            this.showErrorMessage('An error occurred. Please refresh the page.');
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('sehajPaathReaderSettings');
            const settings = saved ? JSON.parse(saved) : this.getDefaultSettings();
            
            // Always sync with global theme on load
            const globalTheme = localStorage.getItem('anhad_theme') || 'light';
            settings.theme = globalTheme;
            
            return settings;
        } catch {
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        // Sync with global theme
        const globalTheme = localStorage.getItem('anhad_theme') || 'light';
        
        return {
            theme: globalTheme, // Use global theme instead of always 'dark'
            fontSize: 22,
            lineSpacing: 2.2,
            displayMode: 'padchhed',
            showTranslation: true,
            showTransliteration: false,
            translationLang: 'en',
            autoHideHeader: true,
            hapticFeedback: true,
            continuousReading: false,
            paragraphMode: false,
            larivaarAssist: false
        };
    }

    saveSettings() {
        localStorage.setItem('sehajPaathReaderSettings', JSON.stringify(this.settings));
    }

    getSavedAng() {
        try {
            const state = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');
            return state.currentPaath?.currentAng || 1;
        } catch {
            return 1;
        }
    }

    saveCurrentAng() {
        // ═══════════════════════════════════════════════════════════════════════════
        // CRITICAL: Do NOT save progress in Detached Mode
        // This prevents Random Ang, Search, and Bookmarks from corrupting
        // the sacred Sehaj Paath progress.
        // ═══════════════════════════════════════════════════════════════════════════
        if (this.isDetachedMode) {
            console.log('📌 Detached Mode: Skipping progress save for Ang', this.currentAng);
            return;
        }

        try {
            let state = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');

            if (!state.currentPaath) {
                state = {
                    currentPaath: {
                        id: `paath_${Date.now()}`,
                        number: 1,
                        startDate: new Date().toISOString(),
                        currentAng: 1,
                        lastReadAt: null
                    }
                };
            }

            state.currentPaath.currentAng = this.currentAng;
            state.currentPaath.lastReadAt = new Date().toISOString();

            localStorage.setItem('sehajPaathState', JSON.stringify(state));

            // Track today's reading
            this.trackDailyReading();
        } catch (error) {
            console.error('Error saving ang:', error);
        }
    }

    trackDailyReading() {
        try {
            const today = new Date().toDateString();
            let history = JSON.parse(localStorage.getItem('sehajPaathHistory') || '[]');

            // Add to history
            history.unshift({
                ang: this.currentAng,
                timestamp: new Date().toISOString()
            });

            // Keep last 100 entries
            localStorage.setItem('sehajPaathHistory', JSON.stringify(history.slice(0, 100)));
            
            // ═══ SYNC WITH DASHBOARD ═══
            // ONLY use UnifiedProgressTracker to avoid double counting
            if (window.UnifiedProgressTracker) {
                window.UnifiedProgressTracker.trackPagesRead(1);
            } else if (window.AnhadStats) {
                // Fallback: only if UnifiedProgressTracker not available
                window.AnhadStats.addPagesRead(1);
            }
            
            console.log('[SehajPaath] ✅ Tracked 1 page read');
        } catch (e) {
            console.error('Error tracking history:', e);
        }
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backBtn')?.addEventListener('click', () => this.goBack());

        // Bookmark button
        document.getElementById('bookmarkBtn')?.addEventListener('click', () => this.toggleBookmark());

        // Settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());

        // ═══════════════════════════════════════════════════════════════════════════
        // TASK 2: SEARCH BUTTON — Navigate to Search Page
        // ═══════════════════════════════════════════════════════════════════════════
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.openSearchModal();
        });

        // Navigation buttons
        document.getElementById('prevAngBtn')?.addEventListener('click', () => this.prevAng());
        document.getElementById('nextAngBtn')?.addEventListener('click', () => this.nextAng());

        // Seek bar
        const seekBar = document.getElementById('seekBar');
        if (seekBar) {
            seekBar.addEventListener('input', (e) => {
                const newAng = parseInt(e.target.value);
                const display = document.getElementById('currentAngDisplay');
                if (display) display.textContent = newAng;
                // Update progress bar too
                this.updateReadingProgressBar(newAng);
            });
            seekBar.addEventListener('change', (e) => {
                this.loadAng(parseInt(e.target.value));
            });
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // GLOBAL THEME SYNC — Listen for theme changes from other parts of the app
        // ═══════════════════════════════════════════════════════════════════════════
        window.addEventListener('storage', (e) => {
            if (e.key === 'anhad_theme' && e.newValue) {
                this.settings.theme = e.newValue;
                this.applyTheme();
                console.log('🎨 Synced with global theme:', e.newValue);
            }
        });

        // Listen for custom theme change events
        window.addEventListener('themechange', (e) => {
            if (e.detail?.theme) {
                this.settings.theme = e.detail.theme;
                this.applyTheme();
                console.log('🎨 Theme changed via event:', e.detail.theme);
            }
        });

        // Scroll handling for auto-hide — THROTTLED with rAF
        this._scrollTicking = false;
        this._scrollHideTimer = null;
        const scroll = document.getElementById('gurbaniScroll');
        if (scroll) {
            scroll.addEventListener('scroll', () => {
                if (!this._scrollTicking) {
                    requestAnimationFrame(() => {
                        this.handleScroll();
                        this._scrollTicking = false;
                    });
                    this._scrollTicking = true;
                }
            }, { passive: true });
        }

        // Tap to show/hide header/footer
        document.getElementById('gurbaniContent')?.addEventListener('click', (e) => {
            if (e.target.closest('.gurbani-line')) {
                // Show floating actions bar when line is clicked
                this.showFloatingActionsBar();
                return;
            }
            this.toggleUI();
        });

        // Quick actions overlay
        document.getElementById('closeActionsBtn')?.addEventListener('click', () => this.closeQuickActions());
        document.querySelector('.quick-actions-backdrop')?.addEventListener('click', () => this.closeQuickActions());

        // Settings panel
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettings());
        document.querySelector('.settings-backdrop')?.addEventListener('click', () => this.closeSettings());

        // Settings controls
        this.setupSettingsControls();

        // Floating actions bar
        this.setupFloatingActionsBar();

        // Swipe gestures
        this.setupSwipeGestures();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Download/Offline caching
        this.setupDownloadListeners();
    }

    setupSettingsControls() {
        // Font size
        const fontSlider = document.getElementById('fontSizeSlider');
        const fontSizeValue = document.getElementById('fontSizeValue');
        fontSlider?.addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            this.applyFontSize();
            this.saveSettings();
            if (fontSizeValue) fontSizeValue.textContent = `${e.target.value}px`;
        });

        // Line spacing
        const lineSlider = document.getElementById('lineSpacingSlider');
        const lineSpacingValue = document.getElementById('lineSpacingValue');
        lineSlider?.addEventListener('input', (e) => {
            this.settings.lineSpacing = parseFloat(e.target.value);
            this.applyLineSpacing();
            this.saveSettings();
            if (lineSpacingValue) lineSpacingValue.textContent = e.target.value;
        });

        // ═══════════════════════════════════════════════════════════════════════════
        // TASK 2: MODERN THEME PILLS
        // ═══════════════════════════════════════════════════════════════════════════
        document.querySelectorAll('.theme-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.theme = btn.dataset.theme;
                this.applyTheme();
                this.saveSettings();
            });
        });

        // Theme buttons (legacy + extended)
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.theme-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.theme = btn.dataset.theme;
                this.applyTheme();
                this.saveSettings();
            });
        });

        // ═══════════════════════════════════════════════════════════════════════════
        // TASK 2: DISPLAY MODE PILLS
        // ═══════════════════════════════════════════════════════════════════════════
        document.querySelectorAll('.mode-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.displayMode = btn.dataset.mode;
                this.applyModes();
                this.renderGurbani();
                this.saveSettings();
            });
        });

        // Display mode radios (legacy)
        document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.displayMode = e.target.value;
                this.renderGurbani();
                this.saveSettings();
            });
        });

        // Translation toggle
        document.getElementById('showTranslation')?.addEventListener('change', (e) => {
            this.settings.showTranslation = e.target.checked;
            this.renderGurbani();
            this.saveSettings();
        });

        // Transliteration toggle
        document.getElementById('showTransliteration')?.addEventListener('change', (e) => {
            this.settings.showTransliteration = e.target.checked;
            this.renderGurbani();
            this.saveSettings();
        });

        // Hindi toggle
        document.getElementById('showHindi')?.addEventListener('change', (e) => {
            this.settings.showHindi = e.target.checked;
            this.renderGurbani();
            this.saveSettings();
        });

        // Font style select
        document.getElementById('fontStyleSelect')?.addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.applyFontFamily();
            this.saveSettings();
        });

        // Auto-hide header
        document.getElementById('autoHideHeader')?.addEventListener('change', (e) => {
            this.settings.autoHideHeader = e.target.checked;
            this.saveSettings();
        });

        // Haptic feedback
        document.getElementById('hapticFeedback')?.addEventListener('change', (e) => {
            this.settings.hapticFeedback = e.target.checked;
            this.saveSettings();
        });

        // Show line numbers
        document.getElementById('showLineNumbers')?.addEventListener('change', (e) => {
            this.settings.showLineNumbers = e.target.checked;
            this.applyLineNumbersVisibility();
            this.saveSettings();
        });

        // Continuous Reading toggle
        document.getElementById('continuousReading')?.addEventListener('change', (e) => {
            this.settings.continuousReading = e.target.checked;
            this.applyModes();
            this.saveSettings();
        });

        // Paragraph Mode toggle
        document.getElementById('paragraphMode')?.addEventListener('change', (e) => {
            this.settings.paragraphMode = e.target.checked;
            this.applyModes();
            this.saveSettings();
        });

        // Larivaar Assist toggle
        document.getElementById('larivaarAssist')?.addEventListener('change', (e) => {
            this.settings.larivaarAssist = e.target.checked;
            this.applyModes();
            this.renderGurbani();
            this.saveSettings();
        });
    }

    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        const container = document.getElementById('gurbaniContent');

        if (!container) return;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }

    handleSwipe(startX, endX) {
        const threshold = 80;
        const diff = startX - endX;

        if (Math.abs(diff) < threshold) return;

        if (diff > 0) {
            // Swiped left - next ang
            this.nextAng();
        } else {
            // Swiped right - previous ang
            this.prevAng();
        }
    }

    handleScroll() {
        const scroll = document.getElementById('gurbaniScroll');
        if (!scroll) return;

        const currentPosition = scroll.scrollTop;
        const delta = currentPosition - this.lastScrollPosition;

        // ═══════════════════════════════════════════════════════════════════
        // CONTINUOUS READING — Auto-load next Ang when near bottom
        // This is the KEY to smooth, flicker-free Sehaj Paath
        // ═══════════════════════════════════════════════════════════════════
        if (this.settings.continuousReading && !this._isLoadingNextAng) {
            const scrollHeight = scroll.scrollHeight;
            const clientHeight = scroll.clientHeight;
            const distanceFromBottom = scrollHeight - (currentPosition + clientHeight);

            // Load next Ang when within 300px of bottom
            if (distanceFromBottom < 300 && this.currentAng < 1430) {
                this._isLoadingNextAng = true;
                this.loadAngContinuous(this.currentAng + 1);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // AUTO-HIDE HEADER/FOOTER — Always enabled for immersive reading
        // ═══════════════════════════════════════════════════════════════════
        const header = document.getElementById('readerHeader');
        const footer = document.getElementById('readerFooter');
        const container = document.getElementById('readerContainer');

        // Only toggle after significant scroll delta to prevent rapid flickering
        if (Math.abs(delta) < 5) {
            this.lastScrollPosition = currentPosition;
            return;
        }

        // Clear any existing timer
        if (this._scrollHideTimer) {
            clearTimeout(this._scrollHideTimer);
        }

        if (delta > 0 && currentPosition > 50) {
            // Scrolling down - hide UI for full screen
            if (this.headerVisible) {
                header?.classList.add('hidden');
                footer?.classList.add('hidden');
                container?.classList.add('fullscreen-reading');
                this.headerVisible = false;
            }
        } else if (delta < -5) {
            // Scrolling up - show UI
            if (!this.headerVisible) {
                header?.classList.remove('hidden');
                footer?.classList.remove('hidden');
                container?.classList.remove('fullscreen-reading');
                this.headerVisible = true;
            }
        }

        // Auto-hide again after 3 seconds of no scrolling
        this._scrollHideTimer = setTimeout(() => {
            if (currentPosition > 50 && this.headerVisible) {
                header?.classList.add('hidden');
                footer?.classList.add('hidden');
                container?.classList.add('fullscreen-reading');
                this.headerVisible = false;
            }
        }, 3000);

        this.lastScrollPosition = currentPosition;
    }

    toggleUI() {
        const header = document.getElementById('readerHeader');
        const footer = document.getElementById('readerFooter');
        const container = document.getElementById('readerContainer');
        const isContinuousOrParagraph = this.settings.continuousReading || this.settings.paragraphMode;

        if (this.headerVisible) {
            header?.classList.add('hidden');
            footer?.classList.add('hidden');
            this.headerVisible = false;
            if (isContinuousOrParagraph) {
                container?.classList.add('fullscreen-reading');
            }
        } else {
            header?.classList.remove('hidden');
            footer?.classList.remove('hidden');
            this.headerVisible = true;
            container?.classList.remove('fullscreen-reading');
        }
    }

    handleKeyboard(e) {
        switch (e.key) {
            case 'ArrowLeft':
                this.prevAng();
                break;
            case 'ArrowRight':
                this.nextAng();
                break;
            case 'Escape':
                this.closeSettings();
                this.closeQuickActions();
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════════════════════════

    async loadAng(angNumber) {
        if (angNumber < 1 || angNumber > 1430) return;

        // In continuous reading mode, use the seamless appender instead
        if (this.settings.continuousReading && this.angData) {
            await this.loadAngContinuous(angNumber);
            return;
        }

        this.showLoading();
        this.currentAng = angNumber;

        console.log('📖 Fetching Ang:', angNumber);

        try {
            const data = await this.api.getAng(angNumber);

            if (!data || !data.lines || data.lines.length === 0) {
                console.warn('⚠️ No lines data for Ang:', angNumber);
                this.showErrorMessage('No Gurbani data found for this Ang.');
                this.hideLoading();
                return;
            }

            this.angData = data;
            this.renderGurbani();
            this.updateUI();
            this.saveCurrentAng();
            this.updateStats();
            this.checkBookmarkStatus();

            // Preload adjacent angs
            this.preloadAdjacentAngs();

            this.haptic('light');

        } catch (error) {
            console.error('❌ Error loading Ang:', error);
            this.showErrorMessage('Failed to load Gurbani. Please check your connection and try again.');
        } finally {
            this.hideLoading();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTINUOUS READING — SEAMLESS ANG APPENDING (ZERO FLICKER)
    // Appends next Ang's lines below current content without clearing.
    // No loading overlay. No scroll jump. Completely smooth.
    // ═══════════════════════════════════════════════════════════════════════════

    async loadAngContinuous(angNumber) {
        if (angNumber < 1 || angNumber > 1430) {
            this._isLoadingNextAng = false;
            return;
        }

        console.log('📜 Continuous: Appending Ang', angNumber);

        try {
            const data = await this.api.getAng(angNumber);

            if (!data || !data.lines || data.lines.length === 0) {
                this._isLoadingNextAng = false;
                return;
            }

            // Update state (but DON'T clear content)
            this.currentAng = angNumber;
            this.angData = data;

            // Build new lines as DocumentFragment — NO innerHTML clearing
            const container = document.getElementById('gurbaniLines');
            if (!container) {
                this._isLoadingNextAng = false;
                return;
            }

            // Add a subtle Ang divider
            const divider = document.createElement('div');
            divider.className = 'ang-divider';
            divider.innerHTML = `<span>ਅੰਗ ${angNumber}</span>`;
            container.appendChild(divider);

            // Build fragment with new lines
            const fragment = document.createDocumentFragment();
            const isLarivaarMode = this.settings.displayMode === 'larivaar';

            data.lines.forEach((line, index) => {
                let text = isLarivaarMode ?
                    (line.larivaar || line.gurmukhi?.replace(/\s+/g, '') || '') :
                    (line.gurmukhi || '');

                if (isLarivaarMode && this.settings.larivaarAssist && line.gurmukhi) {
                    text = this.applyLarivaarAssist(line.gurmukhi);
                }

                let translation = '';
                if (line.translation) {
                    if (typeof line.translation === 'string') {
                        translation = line.translation;
                    } else if (line.translation[this.settings.translationLang]) {
                        translation = line.translation[this.settings.translationLang];
                    } else if (line.translation.en) {
                        translation = line.translation.en;
                    }
                }

                let transliteration = '';
                if (line.transliteration) {
                    if (typeof line.transliteration === 'string') {
                        transliteration = line.transliteration;
                    } else if (line.transliteration.en) {
                        transliteration = line.transliteration.en;
                    }
                }

                const lineEl = document.createElement('div');
                lineEl.className = 'gurbani-line';
                lineEl.dataset.lineId = line.id || index;
                lineEl.dataset.shabadId = line.shabadId || '';
                lineEl.innerHTML = `
                    <p class="gurmukhi-text ${isLarivaarMode ? 'larivaar' : ''}">${text || 'ੴ'}</p>
                    ${this.settings.showTranslation && translation ?
                    `<p class="translation-text">${translation}</p>` : ''}
                    ${this.settings.showTransliteration && transliteration ?
                    `<p class="transliteration-text">${transliteration}</p>` : ''}
                    <span class="line-number">${index + 1}</span>
                `;
                fragment.appendChild(lineEl);
            });

            // Append WITHOUT clearing — this is what prevents flicker
            container.appendChild(fragment);

            // Update UI elements (ang display, progress, etc.)
            this.updateUI();
            this.saveCurrentAng();
            this.updateStats();
            this.updateReadingProgressBar();

            // Preload the next one
            if (this.currentAng < 1430) {
                this.api.getAng(this.currentAng + 1).catch(() => {});
            }

            console.log('✅ Continuous: Ang', angNumber, 'appended seamlessly');

        } catch (error) {
            console.error('❌ Continuous load error:', error);
        } finally {
            // Allow next load after a short cooldown
            setTimeout(() => {
                this._isLoadingNextAng = false;
            }, 500);
        }
    }

    showErrorMessage(message) {
        const container = document.getElementById('gurbaniLines');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p class="error-icon">⚠️</p>
                    <p class="error-text">${message}</p>
                    <p class="error-hint">Please check your internet connection and try again.</p>
                    <div class="error-actions">
                        <button class="retry-btn" onclick="window.reader.loadAng(window.reader.currentAng)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                            Retry
                        </button>
                        <button class="back-btn-error" onclick="window.location.href='sehaj-paath.html'">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                            Go Back
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async preloadAdjacentAngs() {
        // Preload next and previous angs in background
        if (this.currentAng < 1430) {
            this.api.getAng(this.currentAng + 1).catch(() => { });
        }
        if (this.currentAng > 1) {
            this.api.getAng(this.currentAng - 1).catch(() => { });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════════

    renderGurbani() {
        const container = document.getElementById('gurbaniLines');
        if (!container) {
            console.error('❌ Gurbani container not found');
            return;
        }

        if (!this.angData || !this.angData.lines || this.angData.lines.length === 0) {
            console.warn('⚠️ No Gurbani data to render');
            container.innerHTML = `
                <div class="empty-state">
                    <p>Loading Gurbani...</p>
                </div>
            `;
            return;
        }

        console.log('🖌️ Rendering', this.angData.lines.length, 'lines');

        const lines = this.angData.lines;

        container.innerHTML = lines.map((line, index) => {
            // Get the Gurmukhi text
            const isLarivaarMode = this.settings.displayMode === 'larivaar';
            let text = isLarivaarMode ?
                (line.larivaar || line.gurmukhi?.replace(/\s+/g, '') || '') :
                (line.gurmukhi || '');

            // Apply Larivaar Assist (alternating word colors)
            if (isLarivaarMode && this.settings.larivaarAssist && line.gurmukhi) {
                text = this.applyLarivaarAssist(line.gurmukhi);
            }

            // Get translation
            let translation = '';
            if (line.translation) {
                if (typeof line.translation === 'string') {
                    translation = line.translation;
                } else if (line.translation[this.settings.translationLang]) {
                    translation = line.translation[this.settings.translationLang];
                } else if (line.translation.en) {
                    translation = line.translation.en;
                }
            }

            // Get transliteration
            let transliteration = '';
            if (line.transliteration) {
                if (typeof line.transliteration === 'string') {
                    transliteration = line.transliteration;
                } else if (line.transliteration.en) {
                    transliteration = line.transliteration.en;
                }
            }

            return `
                <div class="gurbani-line" data-line-id="${line.id || index}" data-shabad-id="${line.shabadId || ''}">
                    <p class="gurmukhi-text ${isLarivaarMode ? 'larivaar' : ''}">${text || 'ੴ'}</p>
                    ${this.settings.showTranslation && translation ?
                    `<p class="translation-text">${translation}</p>` : ''}
                    ${this.settings.showTransliteration && transliteration ?
                    `<p class="transliteration-text">${transliteration}</p>` : ''}
                    <span class="line-number">${index + 1}</span>
                </div>
            `;
        }).join('');

        // Update raag name
        const raagNameEl = document.getElementById('raagName');
        if (raagNameEl && this.angData.raag) {
            raagNameEl.textContent = this.angData.raag;
        }

        // Scroll to top (unless we need to highlight a searched line)
        const scroll = document.getElementById('gurbaniScroll');
        if (scroll && !this.searchQuery) {
            scroll.scrollTop = 0;
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // TASK 2: HIGHLIGHT SEARCHED PANGTHI (ONLY EXACT MATCH - NO RAHAU AUTO)
        // ═══════════════════════════════════════════════════════════════════════════
        if (this.searchQuery) {
            this.highlightSearchedLine();
        }

        console.log('✅ Gurbani rendered successfully');
    }

    updateUI() {
        // Update ang display
        const angDisplay = document.getElementById('currentAngDisplay');
        if (angDisplay) angDisplay.textContent = this.currentAng;

        const seekBar = document.getElementById('seekBar');
        if (seekBar) seekBar.value = this.currentAng;

        // Update nav buttons
        const prevBtn = document.getElementById('prevAngBtn');
        const nextBtn = document.getElementById('nextAngBtn');
        const prevNum = document.getElementById('prevAngNum');
        const nextNum = document.getElementById('nextAngNum');

        if (prevBtn) {
            prevBtn.disabled = this.currentAng <= 1;
        }
        if (prevNum) {
            prevNum.textContent = this.currentAng > 1 ? this.currentAng - 1 : '-';
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentAng >= 1430;
        }
        if (nextNum) {
            nextNum.textContent = this.currentAng < 1430 ? this.currentAng + 1 : '-';
        }

        // Update ang info
        const angInfoText = document.getElementById('angInfoText');
        if (angInfoText) {
            angInfoText.textContent = `Ang ${this.currentAng} of 1430`;
        }
    }

    updateProgressDisplay() {
        const progress = (this.currentAng / 1430) * 100;

        const progressFill = document.getElementById('progressFillMini');
        if (progressFill) progressFill.style.width = `${progress}%`;

        const progressText = document.getElementById('progressTextMini');
        if (progressText) progressText.textContent = `${progress.toFixed(1)}%`;

        // Update streak
        try {
            const stats = JSON.parse(localStorage.getItem('sehajPaathStats') || '{}');
            const streakDisplay = document.getElementById('streakDisplay');
            if (streakDisplay) streakDisplay.textContent = stats.currentStreak || 0;
        } catch { }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    prevAng() {
        if (this.currentAng > 1) {
            this.loadAng(this.currentAng - 1);
            // Stats are already updated in loadAng() -> updateStats()
        }
    }

    nextAng() {
        if (this.currentAng < 1430) {
            this.loadAng(this.currentAng + 1);
            // Stats are already updated in loadAng() -> updateStats()
        }
    }

    goBack() {
        // Use browser history if available, otherwise go to sehaj-paath.html
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            window.location.href = 'sehaj-paath.html';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BOOKMARKS
    // ═══════════════════════════════════════════════════════════════════════════

    checkBookmarkStatus() {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]');
            this.isBookmarked = bookmarks.some(b => b.ang === this.currentAng);
            this.updateBookmarkButton();
        } catch { }
    }

    updateBookmarkButton() {
        const btn = document.getElementById('bookmarkBtn');
        if (btn) {
            btn.classList.toggle('bookmarked', this.isBookmarked);
        }
    }

    toggleBookmark() {
        try {
            let bookmarks = JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]');

            if (this.isBookmarked) {
                // Remove bookmark
                bookmarks = bookmarks.filter(b => b.ang !== this.currentAng);
                this.showToast('Bookmark removed');
            } else {
                // Add bookmark with first line of Gurbani
                const firstLine = this.angData?.lines?.[0]?.gurmukhi || '';
                bookmarks.push({
                    id: `bm_${Date.now()}`,
                    ang: this.currentAng,
                    title: `Ang ${this.currentAng}`,
                    gurmukhi: firstLine.substring(0, 50),
                    createdAt: new Date().toISOString()
                });
                this.showToast('Bookmarked! 🔖');
            }

            localStorage.setItem('sehajPaathBookmarks', JSON.stringify(bookmarks));
            this.isBookmarked = !this.isBookmarked;
            this.updateBookmarkButton();
            this.haptic('medium');
        } catch (error) {
            console.error('Bookmark error:', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════

    applySettings() {
        this.applyTheme();
        this.applyFontSize();
        this.applyLineSpacing();
        this.applyModes();
        this.updateSettingsUI();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DISPLAY MODES - Continuous Reading, Paragraph Mode, Larivaar
    // ═══════════════════════════════════════════════════════════════════════════

    applyModes() {
        const container = document.getElementById('gurbaniLines');
        const readerContainer = document.getElementById('readerContainer');
        const larivaarAssistRow = document.getElementById('larivaarAssistRow');
        const isLarivaar = this.settings.displayMode === 'larivaar';

        // Toggle Larivaar Assist Row visibility
        if (larivaarAssistRow) {
            larivaarAssistRow.style.display = isLarivaar ? 'flex' : 'none';
        }

        // Apply body classes for larivaar
        document.body.classList.toggle('larivaar-mode', isLarivaar);
        document.body.classList.toggle('larivaar-assist', isLarivaar && this.settings.larivaarAssist);

        // Apply container classes
        if (container) {
            container.classList.toggle('continuous-mode', this.settings.continuousReading);
            container.classList.toggle('paragraph-mode', this.settings.paragraphMode && !this.settings.continuousReading);
        }

        // In continuous/paragraph mode, auto-hide header/footer for fullscreen reading
        const isContinuousOrParagraph = this.settings.continuousReading || this.settings.paragraphMode;
        if (isContinuousOrParagraph && this.settings.autoHideHeader) {
            const header = document.getElementById('readerHeader');
            const footer = document.getElementById('readerFooter');
            // Auto-hide after a brief delay
            setTimeout(() => {
                header?.classList.add('hidden');
                footer?.classList.add('hidden');
                readerContainer?.classList.add('fullscreen-reading');
                this.headerVisible = false;
            }, 800);
        } else {
            // Restore normal mode
            readerContainer?.classList.remove('fullscreen-reading');
        }

        // Update toggle checkboxes
        const continuousToggle = document.getElementById('continuousReading');
        if (continuousToggle) continuousToggle.checked = this.settings.continuousReading;

        const paragraphToggle = document.getElementById('paragraphMode');
        if (paragraphToggle) paragraphToggle.checked = this.settings.paragraphMode;

        const larivaarAssistToggle = document.getElementById('larivaarAssist');
        if (larivaarAssistToggle) larivaarAssistToggle.checked = this.settings.larivaarAssist;
    }

    applyLarivaarAssist(text) {
        if (!text) return '';
        const words = text.split(/\s+/);
        return words.map((word, i) => {
            if (i % 2 === 1) {
                return `<span class="word-alt">${word}</span>`;
            }
            return word;
        }).join('');
    }

    applyTheme() {
        // Normalize to only dark/light
        const theme = this.settings.theme;
        const normalizedTheme = (theme === 'light' || theme === 'sepia' || theme === 'auto') ? 'light' : 'dark';
        document.documentElement.dataset.theme = normalizedTheme;
    }

    applyFontSize() {
        document.documentElement.style.setProperty('--gurmukhi-size', `${this.settings.fontSize}px`);
    }

    applyLineSpacing() {
        document.documentElement.style.setProperty('--line-height', this.settings.lineSpacing);
    }

    updateSettingsUI() {
        // Font size slider
        const fontSlider = document.getElementById('fontSizeSlider');
        if (fontSlider) fontSlider.value = this.settings.fontSize;

        // Line spacing slider
        const lineSlider = document.getElementById('lineSpacingSlider');
        if (lineSlider) lineSlider.value = this.settings.lineSpacing;

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });

        // Display mode radios
        const displayRadio = document.querySelector(`input[name="displayMode"][value="${this.settings.displayMode}"]`);
        if (displayRadio) displayRadio.checked = true;

        // Toggles
        const showTrans = document.getElementById('showTranslation');
        if (showTrans) showTrans.checked = this.settings.showTranslation;

        const showTranslit = document.getElementById('showTransliteration');
        if (showTranslit) showTranslit.checked = this.settings.showTransliteration;

        // Translation language
        const transLang = document.getElementById('translationLang');
        if (transLang) transLang.value = this.settings.translationLang;

        // Other settings
        const autoHide = document.getElementById('autoHideHeader');
        if (autoHide) autoHide.checked = this.settings.autoHideHeader;

        const haptic = document.getElementById('hapticFeedback');
        if (haptic) haptic.checked = this.settings.hapticFeedback;
    }

    openSettings() {
        document.getElementById('settingsPanel')?.classList.add('active');
    }

    closeSettings() {
        document.getElementById('settingsPanel')?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH MODAL
    // ═══════════════════════════════════════════════════════════════════════════

    openSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.add('active');
            const input = document.getElementById('goToAngInput');
            if (input) {
                input.value = '';
                input.focus();
            }
        }

        // Setup event listeners if not already done
        if (!this._searchModalInitialized) {
            this._searchModalInitialized = true;

            document.getElementById('closeSearchBtn')?.addEventListener('click', () => this.closeSearchModal());
            document.querySelector('.search-modal-backdrop')?.addEventListener('click', () => this.closeSearchModal());

            document.getElementById('goToAngBtn')?.addEventListener('click', () => this.goToAngFromModal());

            document.getElementById('goToAngInput')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.goToAngFromModal();
                }
                if (e.key === 'Escape') {
                    this.closeSearchModal();
                }
            });
        }
    }

    closeSearchModal() {
        document.getElementById('searchModal')?.classList.remove('active');
    }

    goToAngFromModal() {
        const input = document.getElementById('goToAngInput');
        if (input) {
            const ang = parseInt(input.value);
            if (ang >= 1 && ang <= 1430) {
                this.closeSearchModal();
                this.loadAng(ang);
            } else {
                this.showToast('Please enter a valid Ang (1-1430)', 'error');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    toggleQuickActions() {
        const overlay = document.getElementById('quickActionsOverlay');
        overlay?.classList.toggle('active');
    }

    closeQuickActions() {
        document.getElementById('quickActionsOverlay')?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STATISTICS
    // ═══════════════════════════════════════════════════════════════════════════

    startReadingTimer() {
        this.readingStartTime = Date.now();

        // Update reading time display every second
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.readingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const readingTimeEl = document.getElementById('readingTime');
            if (readingTimeEl) {
                readingTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    updateStats() {
        // ═══════════════════════════════════════════════════════════════════════════
        // CRITICAL: Do NOT update stats in Detached Mode
        // This prevents Random Ang from affecting streak calculations
        // ═══════════════════════════════════════════════════════════════════════════
        if (this.isDetachedMode) {
            console.log('📌 Detached Mode: Skipping stats update');
            // Still update the UI display but don't save changes
            this.updateProgressDisplay();
            return;
        }

        try {
            let stats = JSON.parse(localStorage.getItem('sehajPaathStats') || '{}');
            const today = new Date().toDateString();

            // Check if this is a new day
            if (stats.lastReadDate !== today) {
                // Check streak
                const lastRead = stats.lastReadDate ? new Date(stats.lastReadDate) : null;
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastRead && lastRead.toDateString() === yesterday.toDateString()) {
                    stats.currentStreak = (stats.currentStreak || 0) + 1;
                } else if (!lastRead || lastRead.toDateString() !== today) {
                    stats.currentStreak = 1;
                }

                // Update longest streak
                stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);

                // Reset daily stats
                stats.todayAngsRead = 0;
                stats.todayReadingTime = 0;
            }

            // Update daily angs
            stats.todayAngsRead = (stats.todayAngsRead || 0) + 1;
            stats.totalAngsRead = (stats.totalAngsRead || 0) + 1;
            stats.lastReadDate = today;
            stats.lastReadAng = this.currentAng;

            localStorage.setItem('sehajPaathStats', JSON.stringify(stats));

            // ═══════════════════════════════════════════════════════════════════
            // DASHBOARD INTEGRATION — Push stats to unified AnhadStats system
            // This makes Sehaj Paath progress visible on the Dashboard
            // ═══════════════════════════════════════════════════════════════════
            try {
                // Update unified stats for Dashboard
                if (window.AnhadStats) {
                    window.AnhadStats.addPagesRead(1);
                    console.log('📊 Sent Ang read to Dashboard stats');
                } else {
                    // Fallback: dispatch event for stats-integration.js
                    window.dispatchEvent(new CustomEvent('sehajPaathAngRead', {
                        detail: { ang: this.currentAng, timestamp: Date.now() }
                    }));
                }
            } catch (e) {
                console.warn('Dashboard stats sync error:', e);
            }

            // Also update legacy unified storage for backward compatibility
            try {
                let unifiedStats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
                unifiedStats.sehajPaath = {
                    currentAng: this.currentAng,
                    totalAngsRead: stats.totalAngsRead || 0,
                    currentStreak: stats.currentStreak || 0,
                    longestStreak: stats.longestStreak || 0,
                    todayAngsRead: stats.todayAngsRead || 0,
                    progress: ((this.currentAng / 1430) * 100).toFixed(1),
                    lastReadDate: today,
                    lastUpdated: Date.now()
                };
                localStorage.setItem('anhad_user_stats', JSON.stringify(unifiedStats));

                // Also push to Nitnem tracker format for cross-section visibility
                let readingLog = JSON.parse(localStorage.getItem('anhad_reading_log') || '[]');
                const todayLog = readingLog.find(l => l.date === today);
                if (todayLog) {
                    todayLog.sehajPaathAngs = stats.todayAngsRead;
                    todayLog.sehajPaathAng = this.currentAng;
                } else {
                    readingLog.push({
                        date: today,
                        sehajPaathAngs: stats.todayAngsRead,
                        sehajPaathAng: this.currentAng,
                        timestamp: Date.now()
                    });
                }
                // Keep only last 90 days
                if (readingLog.length > 90) readingLog = readingLog.slice(-90);
                localStorage.setItem('anhad_reading_log', JSON.stringify(readingLog));

                console.log('📊 Stats synced to Dashboard:', unifiedStats.sehajPaath);
            } catch (e) {
                console.warn('Dashboard sync error:', e);
            }

            this.updateProgressDisplay();
        } catch (error) {
            console.error('Stats update error:', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('hidden');
    }

    showToast(message) {
        // Remove existing toast
        document.querySelectorAll('.reader-toast').forEach(t => t.remove());

        const container = document.getElementById('toastContainer');
        if (container) {
            container.innerHTML = `<div class="toast">${message}</div>`;
            setTimeout(() => container.innerHTML = '', 2500);
        } else {
            // Create inline toast
            const toast = document.createElement('div');
            toast.className = 'reader-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 24px;
                border-radius: 24px;
                font-size: 14px;
                z-index: 9999;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        }
    }

    haptic(type = 'light') {
        if (!this.settings.hapticFeedback) return;

        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30]
            };
            navigator.vibrate(patterns[type] || [10]);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: READING PROGRESS BAR
    // ═══════════════════════════════════════════════════════════════════════════

    updateReadingProgressBar(ang = this.currentAng) {
        const progressFill = document.getElementById('readingProgressFill');
        if (progressFill) {
            const progress = ((ang - 1) / 1429) * 100; // 1430 total angs
            progressFill.style.width = `${progress}%`;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: HIGHLIGHT SEARCHED LINE — ONLY EXACT MATCH (NO RAHAU AUTO)
    // This fixes the bug where Rahau lines were auto-highlighted
    // Now ONLY the exact searched pangthi gets highlighted
    // ═══════════════════════════════════════════════════════════════════════════

    highlightSearchedLine() {
        if (!this.searchQuery) return;

        const container = document.getElementById('gurbaniLines');
        if (!container) return;

        const lines = container.querySelectorAll('.gurbani-line');
        let foundMatch = false;
        let matchedElement = null;

        // Normalize search query
        const normalizedQuery = this.searchQuery.toLowerCase().replace(/\s+/g, ' ').trim();

        lines.forEach(line => {
            const gurmukhiText = line.querySelector('.gurmukhi-text')?.textContent || '';

            // Check if this line contains or matches the search query
            // Support partial matching for both Gurmukhi and transliteration
            if (gurmukhiText.includes(this.searchQuery) ||
                gurmukhiText.toLowerCase().includes(normalizedQuery)) {

                // Add highlight class ONLY to the matched line
                line.classList.add('searched-highlight');
                foundMatch = true;
                matchedElement = line;

                console.log('🔍 Highlighted searched line:', gurmukhiText.substring(0, 50) + '...');
            }
        });

        // If we found a match, smooth scroll to it
        if (foundMatch && matchedElement) {
            const scroll = document.getElementById('gurbaniScroll');
            if (scroll) {
                scroll.classList.add('smooth-scroll-to-search');

                // Wait for render, then scroll
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        matchedElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 300);
                });
            }
        }

        // Clear search query after highlighting (one-time operation)
        this.searchQuery = null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: FLOATING ACTIONS BAR
    // ═══════════════════════════════════════════════════════════════════════════

    setupFloatingActionsBar() {
        const fabBookmark = document.getElementById('fabBookmark');
        const fabShare = document.getElementById('fabShare');
        const fabCopy = document.getElementById('fabCopy');

        fabBookmark?.addEventListener('click', () => {
            this.toggleBookmark();
            this.hideFloatingActionsBar();
        });

        fabShare?.addEventListener('click', () => {
            this.shareCurrentPage();
            this.hideFloatingActionsBar();
        });

        fabCopy?.addEventListener('click', () => {
            this.copyGurbaniText();
            this.hideFloatingActionsBar();
        });

        // Hide on outside click
        document.addEventListener('click', (e) => {
            const fab = document.getElementById('floatingActionsBar');
            if (fab && !fab.contains(e.target) && !e.target.closest('.gurbani-line')) {
                this.hideFloatingActionsBar();
            }
        });
    }

    showFloatingActionsBar() {
        const fab = document.getElementById('floatingActionsBar');
        if (fab) {
            fab.classList.add('visible');
            this.haptic('light');
        }
    }

    hideFloatingActionsBar() {
        const fab = document.getElementById('floatingActionsBar');
        if (fab) {
            fab.classList.remove('visible');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: APPLY FONT FAMILY
    // ═══════════════════════════════════════════════════════════════════════════

    applyFontFamily() {
        const fontFamily = this.settings.fontFamily || 'Noto Sans Gurmukhi';
        document.documentElement.style.setProperty('--font-gurmukhi', `'${fontFamily}', sans-serif`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: LINE NUMBERS VISIBILITY
    // ═══════════════════════════════════════════════════════════════════════════

    applyLineNumbersVisibility() {
        const show = this.settings.showLineNumbers !== false;
        document.querySelectorAll('.line-number').forEach(el => {
            el.style.display = show ? 'block' : 'none';
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: SHARE FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════════

    shareCurrentPage() {
        const shareData = {
            title: `Ang ${this.currentAng} - Sri Guru Granth Sahib Ji`,
            text: `Reading Ang ${this.currentAng} of Sri Guru Granth Sahib Ji`,
            url: `${window.location.origin}${window.location.pathname}?ang=${this.currentAng}`
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => this.showToast('Shared successfully! 📤'))
                .catch(err => console.log('Share cancelled:', err));
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(shareData.url)
                .then(() => this.showToast('Link copied! 📋'))
                .catch(() => this.showToast('Could not copy link'));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK 2: COPY GURBANI TEXT
    // ═══════════════════════════════════════════════════════════════════════════

    copyGurbaniText() {
        if (!this.angData?.lines) return;

        const textToCopy = this.angData.lines
            .map(line => line.gurmukhi || '')
            .filter(text => text.trim())
            .join('\n');

        navigator.clipboard.writeText(textToCopy)
            .then(() => this.showToast('Gurbani copied! 📋'))
            .catch(() => this.showToast('Could not copy text'));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOWNLOAD / OFFLINE CACHING - Download 5 Angs at a time
    // ═══════════════════════════════════════════════════════════════════════════

    setupDownloadListeners() {
        // Download button in header
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.openDownloadModal());

        // Download modal controls
        document.getElementById('closeDownloadBtn')?.addEventListener('click', () => this.closeDownloadModal());
        document.querySelector('.download-modal-backdrop')?.addEventListener('click', () => this.closeDownloadModal());
        document.getElementById('downloadStartBtn')?.addEventListener('click', () => this.downloadFiveAngs());
    }

    openDownloadModal() {
        const modal = document.getElementById('downloadModal');
        if (modal) {
            modal.classList.add('active');
            this.updateCachedCount();
        }
    }

    closeDownloadModal() {
        document.getElementById('downloadModal')?.classList.remove('active');
    }

    updateCachedCount() {
        const cachedCountEl = document.getElementById('cachedCount');
        if (cachedCountEl && window.sehajPaathCache) {
            const count = window.sehajPaathCache.getCacheCount();
            cachedCountEl.textContent = `Cached: ${count} Angs`;
        }
    }

    async downloadFiveAngs() {
        const startBtn = document.getElementById('downloadStartBtn');
        const progressContainer = document.getElementById('downloadProgressContainer');
        const progressFill = document.getElementById('downloadProgressFill');
        const progressText = document.getElementById('downloadProgressText');
        const statusEl = document.getElementById('downloadStatus');

        if (!window.sehajPaathCache) {
            this.showToast('Cache not available');
            return;
        }

        // Calculate range: current ang + next 4 (5 total)
        const startAng = this.currentAng;
        const endAng = Math.min(1430, startAng + 4);
        const total = endAng - startAng + 1;

        // Disable start button and show progress
        if (startBtn) startBtn.disabled = true;
        if (progressContainer) progressContainer.style.display = 'block';
        if (statusEl) statusEl.textContent = 'Starting download...';

        let completed = 0;
        let failed = 0;

        for (let ang = startAng; ang <= endAng; ang++) {
            try {
                if (statusEl) statusEl.textContent = `Downloading Ang ${ang}...`;

                // Check if already cached
                if (window.sehajPaathCache.isCached(ang)) {
                    completed++;
                    this.updateDownloadProgress(completed, total);
                    continue;
                }

                // Fetch from API using proxy
                const response = await fetch(`/api/banidb/angs/${ang}/G`);
                if (!response.ok) throw new Error(`Failed to fetch Ang ${ang}`);

                const data = await response.json();

                // Format data similar to BaniDBAPI
                const formatted = this.formatAngDataForCache(data, ang);

                // Cache it
                await window.sehajPaathCache.cacheAng(ang, formatted);

                completed++;
                this.updateDownloadProgress(completed, total);

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`Failed to download Ang ${ang}:`, error);
                failed++;
            }
        }

        // Update status
        if (failed === 0) {
            if (statusEl) statusEl.textContent = `✅ Downloaded ${completed} Angs successfully!`;
            this.showToast(`Downloaded ${completed} Angs for offline reading`);
        } else {
            if (statusEl) statusEl.textContent = `⚠️ Downloaded ${completed}, Failed: ${failed}`;
            this.showToast(`Downloaded ${completed} Angs, ${failed} failed`);
        }

        // Update cached count and re-enable button
        this.updateCachedCount();
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Download Again';
        }

        // Hide progress after a delay
        setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
        }, 3000);
    }

    updateDownloadProgress(completed, total) {
        const progressFill = document.getElementById('downloadProgressFill');
        const progressText = document.getElementById('downloadProgressText');
        const percent = (completed / total) * 100;

        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${completed}/${total}`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTO DOWNLOAD - Download next 5 Angs in background on page load
    // ═══════════════════════════════════════════════════════════════════════════

    async autoDownloadNextFiveAngs() {
        console.log('📥 Auto-downloading next 5 Angs in background...');
        
        if (!window.sehajPaathCache) {
            console.warn('[AutoDownload] Cache not available');
            return;
        }

        // Calculate range: current ang + next 4 (5 total)
        const startAng = this.currentAng;
        const endAng = Math.min(1430, startAng + 4);
        const total = endAng - startAng + 1;

        let completed = 0;
        let failed = 0;
        let skipped = 0;

        // Show subtle toast notification
        this.showToast('📥 Downloading next 5 Angs for offline reading...');

        for (let ang = startAng; ang <= endAng; ang++) {
            // Check if already cached
            if (window.sehajPaathCache.isCached(ang)) {
                skipped++;
                completed++;
                continue;
            }

            try {
                console.log(`[AutoDownload] Downloading Ang ${ang}...`);

                // Fetch from API using the proxy
                const response = await fetch(`/api/banidb/angs/${ang}/G`);
                if (!response.ok) throw new Error(`Failed to fetch Ang ${ang}`);

                const data = await response.json();

                // Format data
                const formatted = this.formatAngDataForCache(data, ang);

                // Cache it
                await window.sehajPaathCache.cacheAng(ang, formatted);

                completed++;
                console.log(`[AutoDownload] ✓ Cached Ang ${ang}`);

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                console.error(`[AutoDownload] Failed to download Ang ${ang}:`, error);
                failed++;
            }
        }

        // Show completion toast
        if (failed === 0) {
            this.showToast(`✅ Downloaded ${completed} Angs for offline reading`);
        } else {
            this.showToast(`⚠️ Downloaded ${completed}, Failed: ${failed}, Skipped: ${skipped}`);
        }

        // Update cached count in download modal if open
        this.updateCachedCount();
        
        console.log(`[AutoDownload] Complete: ${completed} success, ${failed} failed, ${skipped} skipped`);
    }

    formatAngDataForCache(data, angNumber) {
        // Handle different response structures
        let pageData = [];
        let raagInfo = '';

        if (data?.page && Array.isArray(data.page)) {
            pageData = data.page;
            raagInfo = data.page[0]?.line?.raag?.gurmukhi || '';
        } else if (Array.isArray(data)) {
            pageData = data;
        }

        const verses = pageData.map(item => {
            return {
                id: item.verseId || item.id || item.lineId,
                shabadId: item.shabadId,
                ang: item.pageNo || item.ang || angNumber,
                gurmukhi: item.verse?.unicode || item.verse?.gurmukhi || item.gurmukhi?.unicode || item.gurmukhi || '',
                larivaar: item.larivaar?.unicode || item.larivaar?.gurmukhi || item.larivaar || '',
                translation: {
                    en: this.extractTranslation(item, 'en'),
                    pu: this.extractTranslation(item, 'pu'),
                    hi: this.extractTranslation(item, 'hi')
                },
                transliteration: {
                    en: item.transliteration?.english || item.transliteration?.en || '',
                    hi: item.transliteration?.hindi || item.transliteration?.hi || ''
                },
                writer: item.writer?.english || item.writer?.gurmukhi || '',
                raag: item.raag?.english || item.raag?.gurmukhi || ''
            };
        });

        return {
            ang: angNumber,
            source: 'G',
            raag: raagInfo || verses[0]?.raag || '',
            verses: verses.filter(v => v.gurmukhi)
        };
    }

    extractTranslation(item, lang) {
        const trans = item.translation;
        if (!trans) return '';

        if (typeof trans === 'string') return trans;

        if (trans[lang]) {
            const langTrans = trans[lang];
            if (lang === 'en') {
                return langTrans.bdb || langTrans.ms || langTrans.ssk ||
                    (typeof langTrans === 'string' ? langTrans : '');
            }
            if (lang === 'pu') {
                return langTrans.ss?.unicode || langTrans.bdb?.unicode || langTrans.ms?.unicode ||
                    (typeof langTrans === 'string' ? langTrans : '');
            }
            if (lang === 'hi') {
                return langTrans.ss || langTrans.sts ||
                    (typeof langTrans === 'string' ? langTrans : '');
            }
        }

        return '';
    }
}

// Add error message styles
const style = document.createElement('style');
style.textContent = `
    .error-message {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
    }
    .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    .error-text {
        font-size: 16px;
        margin-bottom: 20px;
    }
    .retry-btn {
        padding: 12px 24px;
        background: var(--sehaj-gold);
        color: #1a1a1a;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
    }
    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-tertiary);
    }
`;
document.head.appendChild(style);

// Initialize reader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new SehajPaathReader();
});
