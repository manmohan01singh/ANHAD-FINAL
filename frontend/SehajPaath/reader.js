/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEHAJ PAATH READER - ENHANCED
 * Immersive Gurbani Reading Experience
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
        console.log('🚀 Initializing Sehaj Paath Reader...');

        // Get Ang from URL params
        const params = new URLSearchParams(window.location.search);
        this.currentAng = parseInt(params.get('ang')) || this.getSavedAng();

        // ═══════════════════════════════════════════════════════════════════════════
        // TASK 2: SEARCH QUERY HIGHLIGHTING
        // Capture the search query from URL to highlight the exact searched pangthi
        // ═══════════════════════════════════════════════════════════════════════════
        this.searchQuery = params.get('q') || null;
        this.highlightedLineId = params.get('lineId') || null;

        // Check if this is a detached reading session (Random, Search, Bookmark, etc.)
        const source = params.get('source');
        if (source && ['random', 'search', 'bookmark', 'share', 'hukamnama'].includes(source)) {
            this.isDetachedMode = true;
            this.detachedSource = source;
            console.log(`📌 DETACHED MODE: ${source} - Progress will NOT be saved`);
        }

        // If coming from search, treat as detached
        if (this.searchQuery) {
            this.isDetachedMode = true;
            this.detachedSource = 'search';
            console.log('🔍 SEARCH MODE: Highlighting query:', this.searchQuery);
        }

        console.log('📖 Loading Ang:', this.currentAng);

        // Initialize API
        this.api = new BaniDBAPI();

        // Setup event listeners
        this.setupEventListeners();

        // Apply saved settings
        this.applySettings();

        // Load the Ang
        await this.loadAng(this.currentAng);

        // Start reading timer
        this.startReadingTimer();

        // Update progress display
        this.updateProgressDisplay();

        // Update reading progress bar at top
        this.updateReadingProgressBar();

        console.log('✅ Reader initialized successfully');
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('sehajPaathReaderSettings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch {
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            theme: 'dark',
            fontSize: 22,
            lineSpacing: 2.2,
            displayMode: 'padchhed',
            showTranslation: true,
            showTransliteration: false,
            translationLang: 'en',
            autoHideHeader: true,
            hapticFeedback: true
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
            window.location.href = 'gurbani-search.html';
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

        // Scroll handling for auto-hide
        const scroll = document.getElementById('gurbaniScroll');
        if (scroll) {
            scroll.addEventListener('scroll', () => this.handleScroll());
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

        // ═══════════════════════════════════════════════════════════════════════════
        // TASK 2: FLOATING ACTIONS BAR
        // ═══════════════════════════════════════════════════════════════════════════
        this.setupFloatingActionsBar();

        // Swipe gestures
        this.setupSwipeGestures();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
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
        if (!this.settings.autoHideHeader) return;

        const scroll = document.getElementById('gurbaniScroll');
        if (!scroll) return;

        const currentPosition = scroll.scrollTop;
        const header = document.getElementById('readerHeader');
        const footer = document.getElementById('readerFooter');

        if (currentPosition > this.lastScrollPosition && currentPosition > 100) {
            // Scrolling down - hide
            header?.classList.add('hidden');
            footer?.classList.add('hidden');
            this.headerVisible = false;
        } else if (currentPosition < this.lastScrollPosition) {
            // Scrolling up - show
            header?.classList.remove('hidden');
            footer?.classList.remove('hidden');
            this.headerVisible = true;
        }

        this.lastScrollPosition = currentPosition;
    }

    toggleUI() {
        const header = document.getElementById('readerHeader');
        const footer = document.getElementById('readerFooter');

        if (this.headerVisible) {
            header?.classList.add('hidden');
            footer?.classList.add('hidden');
            this.headerVisible = false;
        } else {
            header?.classList.remove('hidden');
            footer?.classList.remove('hidden');
            this.headerVisible = true;
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

        this.showLoading();
        this.currentAng = angNumber;

        console.log('📖 Fetching Ang:', angNumber);

        try {
            // Fetch from API
            const data = await this.api.getAng(angNumber);

            console.log('📄 Ang data received:', data);

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

            // Haptic feedback
            this.haptic('light');

        } catch (error) {
            console.error('❌ Error loading Ang:', error);
            this.showErrorMessage('Failed to load Gurbani. Please check your connection and try again.');
        } finally {
            this.hideLoading();
        }
    }

    showErrorMessage(message) {
        const container = document.getElementById('gurbaniLines');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p class="error-icon">⚠️</p>
                    <p class="error-text">${message}</p>
                    <button class="retry-btn" onclick="window.reader.loadAng(window.reader.currentAng)">Retry</button>
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
        const isLarivaar = this.settings.displayMode === 'larivaar';

        container.innerHTML = lines.map((line, index) => {
            // Get the Gurmukhi text
            let text = isLarivaar ?
                (line.larivaar || line.gurmukhi || '') :
                (line.gurmukhi || '');

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
                    <p class="gurmukhi-text ${isLarivaar ? 'larivaar' : ''}">${text || 'ੴ'}</p>
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
        }
    }

    nextAng() {
        if (this.currentAng < 1430) {
            this.loadAng(this.currentAng + 1);
        }
    }

    goBack() {
        window.location.href = 'sehaj-paath.html';
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
        this.updateSettingsUI();
    }

    applyTheme() {
        document.documentElement.dataset.theme = this.settings.theme;
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

            localStorage.setItem('sehajPaathStats', JSON.stringify(stats));
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
