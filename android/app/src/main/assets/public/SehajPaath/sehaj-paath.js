/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEHAJ PAATH - MAIN CONTROLLER (ENHANCED)
 * Complete functionality for Sri Guru Granth Sahib Ji Reading App
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class SehajPaathApp {
    constructor() {
        this.state = {
            currentAng: 1,
            currentPaath: null,
            isLoading: true,
            theme: window.AnhadTheme ? window.AnhadTheme.get() : 'light' // Sync with global theme
        };

        this.statistics = {};
        this.api = null;
        this.settingsPanel = null;
        this.bookmarksManager = null;
        this.notesManager = null;
        this.achievementsEngine = null;

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Sehaj Paath App...');

            // Sync with global theme immediately
            this.syncGlobalTheme();

            // Initialize API
            this.api = new BaniDBAPI();

            // Initialize components
            this.initComponents();

            // Load saved state
            await this.loadState();

            // Setup event listeners
            this.setupEventListeners();

            // Update UI
            this.updateUI();

            // Check achievements
            this.checkAchievements();

            // Sync stats with dashboard
            this.syncDashboardStats();

            // Hide loading screen
            this.hideLoading();

            console.log('✨ Sehaj Paath App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Sehaj Paath:', error);
            this.showError('Failed to load application');
            this.hideLoading();
        }
    }

    syncGlobalTheme() {
        // Listen for global theme changes
        window.addEventListener('themechange', (e) => {
            const theme = e.detail.theme;
            this.state.theme = theme;
            const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
            settings.theme = theme;
            localStorage.setItem('sehajPaathSettings', JSON.stringify(settings));
            console.log('🎨 Sehaj Paath synced with global theme:', theme);
        });

        // Apply current global theme
        if (window.AnhadTheme) {
            const globalTheme = window.AnhadTheme.get();
            this.state.theme = globalTheme;
            const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
            if (settings.theme !== globalTheme) {
                settings.theme = globalTheme;
                localStorage.setItem('sehajPaathSettings', JSON.stringify(settings));
            }
        }
    }

    syncDashboardStats() {
        try {
            // Sync Sehaj Paath stats to unified dashboard system
            const stats = this.statistics;
            const paath = this.state.currentPaath;

            // Update unified stats for dashboard
            const unifiedStats = JSON.parse(localStorage.getItem('anhad_unified_stats') || '{}');
            
            if (!unifiedStats.sehajPaath) {
                unifiedStats.sehajPaath = {};
            }

            unifiedStats.sehajPaath = {
                currentAng: paath?.currentAng || 1,
                totalAngsRead: stats.totalAngsRead || 0,
                currentStreak: stats.currentStreak || 0,
                longestStreak: stats.longestStreak || 0,
                todayAngsRead: stats.todayAngsRead || 0,
                totalReadingTimeMinutes: Math.floor((stats.totalReadingTimeSeconds || 0) / 60),
                lastUpdated: new Date().toISOString()
            };

            localStorage.setItem('anhad_unified_stats', JSON.stringify(unifiedStats));
            console.log('📊 Sehaj Paath stats synced to dashboard');
        } catch (error) {
            console.warn('Dashboard sync error:', error);
        }
    }

    initComponents() {
        // Initialize settings panel
        if (typeof SettingsPanel !== 'undefined') {
            this.settingsPanel = new SettingsPanel();
        }

        // Initialize bookmarks manager
        if (typeof BookmarksManager !== 'undefined') {
            this.bookmarksManager = new BookmarksManager();
        }

        // Initialize notes manager
        if (typeof NotesManager !== 'undefined') {
            this.notesManager = new NotesManager();
        }

        // Initialize achievements engine
        if (typeof AchievementsEngine !== 'undefined') {
            this.achievementsEngine = new AchievementsEngine();
        }

        // Initialize theme engine
        if (typeof ThemeEngine !== 'undefined') {
            this.themeEngine = new ThemeEngine();
        }
    }

    async loadState() {
        try {
            const savedState = this.getStoredState();

            if (savedState && savedState.currentPaath) {
                this.state = { ...this.state, ...savedState };
            } else {
                await this.initNewPaath();
            }

            await this.loadStatistics();
            this.loadReminderSettings();
            this.loadOfflineStatus();
        } catch (error) {
            console.error('Error loading state:', error);
            await this.initNewPaath();
        }
    }

    getStoredState() {
        try {
            const stored = localStorage.getItem('sehajPaathState');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    async saveState() {
        try {
            localStorage.setItem('sehajPaathState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    async initNewPaath() {
        const completedPaaths = JSON.parse(localStorage.getItem('completedPaaths') || '[]');

        this.state.currentPaath = {
            id: `paath_${Date.now()}`,
            number: completedPaaths.length + 1,
            startDate: new Date().toISOString(),
            currentAng: 1,
            lastReadAt: null,
            totalTimeSpentSeconds: 0,
            angsReadToday: [],
            todayDate: new Date().toDateString()
        };

        await this.saveState();
    }

    async loadStatistics() {
        try {
            const stats = JSON.parse(localStorage.getItem('sehajPaathStats') || '{}');
            const today = new Date().toDateString();

            this.statistics = {
                totalAngsRead: stats.totalAngsRead || 0,
                totalReadingTimeSeconds: stats.totalReadingTimeSeconds || 0,
                currentStreak: stats.currentStreak || 0,
                longestStreak: stats.longestStreak || 0,
                todayAngsRead: stats.lastReadDate === today ? (stats.todayAngsRead || 0) : 0,
                todayReadingTime: stats.lastReadDate === today ? (stats.todayReadingTime || 0) : 0,
                lastReadDate: stats.lastReadDate || null
            };

            // Reset daily stats if new day
            if (stats.lastReadDate && stats.lastReadDate !== today) {
                this.statistics.todayAngsRead = 0;
                this.statistics.todayReadingTime = 0;

                // Check streak
                const lastRead = new Date(stats.lastReadDate);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastRead.toDateString() !== yesterday.toDateString()) {
                    // Streak broken
                    this.statistics.currentStreak = 0;
                }
            }

            this.saveStatistics();
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.statistics = {
                totalAngsRead: 0,
                currentStreak: 0,
                longestStreak: 0,
                todayAngsRead: 0,
                todayReadingTime: 0,
                lastReadDate: null
            };
        }
    }

    saveStatistics() {
        localStorage.setItem('sehajPaathStats', JSON.stringify(this.statistics));
        // Also sync to dashboard
        this.syncDashboardStats();
    }

    loadReminderSettings() {
        try {
            const enabled = localStorage.getItem('sehajPaathReminderEnabled') === 'true';
            const time = localStorage.getItem('sehajPaathReminderTime') || '06:00';

            const toggle = document.getElementById('reminderToggle');
            const timeInput = document.getElementById('reminderTime');
            const body = document.getElementById('reminderBody');

            if (toggle) toggle.checked = enabled;
            if (timeInput) timeInput.value = time;
            if (body) body.classList.toggle('disabled', !enabled);
        } catch (error) {
            console.error('Error loading reminder settings:', error);
        }
    }

    loadOfflineStatus() {
        try {
            const cached = JSON.parse(localStorage.getItem('sehajPaathCachedAngs') || '[]');
            const percent = ((cached.length / 1430) * 100).toFixed(1);

            const info = document.getElementById('offlineInfo');
            const fill = document.getElementById('downloadProgressFill');

            if (info) info.textContent = `${cached.length} Angs saved for offline reading (${percent}%)`;
            if (fill) fill.style.width = `${percent}%`;
        } catch (error) {
            console.error('Error loading offline status:', error);
        }
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backBtn')?.addEventListener('click', () => this.goBack());

        // Continue reading button
        document.getElementById('continueReadingBtn')?.addEventListener('click', () => this.openReader());

        // Ang slider
        const angSlider = document.getElementById('angSlider');
        if (angSlider) {
            angSlider.addEventListener('input', (e) => this.onAngSliderChange(e));
            angSlider.addEventListener('change', (e) => {
                // Go to ang when slider is released
                this.openReader(parseInt(e.target.value));
            });
        }

        // Ang input and go button
        const angInput = document.getElementById('angInput');
        const goToAngBtn = document.getElementById('goToAngBtn');
        if (angInput && goToAngBtn) {
            goToAngBtn.addEventListener('click', () => this.goToAng(parseInt(angInput.value)));
            angInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.goToAng(parseInt(angInput.value));
            });
        }

        // Quick nav buttons
        document.querySelectorAll('.quick-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickNav(e));
        });

        // Action buttons
        this.setupActionButtons();

        // Bottom navigation
        this.setupBottomNav();

        // Modal management
        this.setupModals();

        // Header scroll behavior
        this.setupHeaderScroll();

        // Reminder toggle
        const reminderToggle = document.getElementById('reminderToggle');
        if (reminderToggle) {
            reminderToggle.addEventListener('change', (e) => this.toggleReminder(e.target.checked));
        }

        // Reminder time
        const reminderTime = document.getElementById('reminderTime');
        if (reminderTime) {
            reminderTime.addEventListener('change', (e) => {
                localStorage.setItem('sehajPaathReminderTime', e.target.value);
                this.showToast(`Reminder time set to ${e.target.value}`);
            });
        }

        // Download button
        document.getElementById('downloadAngsBtn')?.addEventListener('click', () => this.downloadAllAngs());

        // New Paath button
        document.getElementById('newPaathBtn')?.addEventListener('click', () => this.startNewPaath());
    }

    setupActionButtons() {
        // Bookmarks button
        document.getElementById('bookmarksBtn')?.addEventListener('click', () => {
            this.renderBookmarksModal();
            this.openModal('bookmarksModal');
        });

        // Notes button
        document.getElementById('notesBtn')?.addEventListener('click', () => {
            this.renderNotesModal();
            this.openModal('notesModal');
        });

        // History button
        document.getElementById('historyBtn')?.addEventListener('click', () => {
            this.renderHistoryModal();
            this.openModal('historyModal');
        });

        // Achievements button
        document.getElementById('achievementsBtn')?.addEventListener('click', () => {
            this.renderAchievementsModal();
            this.openModal('achievementsModal');
        });

        // Search button (header) - go to dedicated search page
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            window.location.href = 'gurbani-search.html';
        });

        // Settings button (header)
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.renderSettingsModal();
            this.openModal('settingsModal');
        });
    }

    setupBottomNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.handleNavigation(tab);
            });
        });
    }

    setupModals() {
        // Close buttons for all modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Backdrop click to close
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => this.closeAllModals());
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.performSearch(e.target.value), 300);
            });
        }

        // Search tabs
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                // Re-run search with new type
                const query = document.getElementById('searchInput')?.value;
                if (query) this.performSearch(query);
            });
        });
    }

    setupHeaderScroll() {
        const header = document.getElementById('appHeader');
        const mainContent = document.querySelector('.main-content');

        if (header && mainContent) {
            let lastScrollTop = 0;
            let scrollThreshold = 50;

            mainContent.addEventListener('scroll', () => {
                const currentScroll = mainContent.scrollTop;

                // Add scrolled class for blur effect
                if (currentScroll > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }

                // Hide/show header based on scroll direction
                if (currentScroll > scrollThreshold) {
                    if (currentScroll > lastScrollTop) {
                        // Scrolling DOWN - hide header
                        header.classList.add('scrolled-up');
                    } else {
                        // Scrolling UP - show header
                        header.classList.remove('scrolled-up');
                    }
                } else {
                    // At top - always show header
                    header.classList.remove('scrolled-up');
                }

                lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
            }, { passive: true });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UI UPDATE METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    updateUI() {
        this.updateProgressDisplay();
        this.updateStatsDisplay();
        this.updatePaathProgress();
        this.updateBookmarkCount();
        this.updateNotesCount();
        this.updateHeaderInfo();
    }

    updateHeaderInfo() {
        const currentAng = this.state.currentPaath?.currentAng || 1;

        // Update header to show current reading Ang instead of Paath number
        const paathNumber = document.getElementById('paathNumber');
        if (paathNumber) {
            paathNumber.textContent = `ਅੰਗ ${currentAng}`;
        }

        // Update subtitle with today's date
        const subtitle = document.getElementById('headerSubtitle');
        if (subtitle) {
            const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
            subtitle.textContent = today;
        }
    }

    updateProgressDisplay() {
        const currentAng = this.state.currentPaath?.currentAng || 1;
        const progress = (currentAng / 1430) * 100;

        // Update current ang number
        const angNumber = document.getElementById('currentAngNumber');
        if (angNumber) angNumber.textContent = currentAng;

        // Update progress percentage text
        const progressText = document.getElementById('progressPercentText');
        if (progressText) progressText.textContent = `${progress.toFixed(1)}%`;

        // Update progress ring
        const progressRing = document.getElementById('mainProgressRing');
        if (progressRing) {
            const circumference = 2 * Math.PI * 54;
            const offset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDasharray = circumference;
            progressRing.style.strokeDashoffset = offset;
        }

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        if (progressFill) progressFill.style.width = `${progress}%`;

        // Update progress label
        const angProgressLabel = document.getElementById('angProgressLabel');
        if (angProgressLabel) angProgressLabel.textContent = `${currentAng} / 1430`;

        // Update slider
        const angSlider = document.getElementById('angSlider');
        if (angSlider) angSlider.value = currentAng;

        const sliderCurrentAng = document.getElementById('sliderCurrentAng');
        if (sliderCurrentAng) sliderCurrentAng.textContent = currentAng;

        // Update input
        const angInput = document.getElementById('angInput');
        if (angInput) angInput.value = currentAng;
    }

    updateStatsDisplay() {
        // Today's angs
        const todayAngs = document.getElementById('todayAngsRead');
        if (todayAngs) todayAngs.textContent = this.statistics.todayAngsRead || 0;

        // Today's reading time
        const todayTime = document.getElementById('todayReadingTime');
        if (todayTime) {
            const minutes = Math.floor((this.statistics.todayReadingTime || 0) / 60);
            todayTime.textContent = `${minutes} min`;
        }

        // Current streak
        const streakEl = document.getElementById('currentStreak');
        if (streakEl) streakEl.textContent = this.statistics.currentStreak || 0;

        const headerStreak = document.getElementById('headerStreakCount');
        if (headerStreak) headerStreak.textContent = this.statistics.currentStreak || 0;
    }

    updatePaathProgress() {
        if (!this.state.currentPaath) return;

        const paath = this.state.currentPaath;
        const progress = ((paath.currentAng || 1) / 1430) * 100;

        // Update paath ID
        const paathId = document.getElementById('currentPaathId');
        if (paathId) paathId.textContent = `#${paath.number || 1}`;

        // Update progress bar
        const progressFill = document.getElementById('paathProgressFill');
        if (progressFill) progressFill.style.width = `${progress}%`;

        // Update stats
        const angsProgress = document.getElementById('paathAngsProgress');
        if (angsProgress) angsProgress.textContent = `${paath.currentAng || 1}/1430 Angs`;

        const percentEl = document.getElementById('paathPercent');
        if (percentEl) percentEl.textContent = `${progress.toFixed(1)}%`;

        // Update dates
        const startDate = document.getElementById('paathStartDate');
        if (startDate && paath.startDate) {
            startDate.textContent = new Date(paath.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        // Estimate finish date
        const estDate = document.getElementById('paathEstDate');
        if (estDate) {
            const avgAngsPerDay = this.calculateAverageAngsPerDay();
            if (avgAngsPerDay > 0) {
                const remainingAngs = 1430 - (paath.currentAng || 1);
                const daysRemaining = Math.ceil(remainingAngs / avgAngsPerDay);
                const finishDate = new Date();
                finishDate.setDate(finishDate.getDate() + daysRemaining);
                estDate.textContent = finishDate.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
            } else {
                estDate.textContent = '~286 days';
            }
        }

        // Update completed paaths list
        this.renderCompletedPaaths();
    }

    renderCompletedPaaths() {
        const container = document.getElementById('completedPaathsList');
        const noMessage = document.getElementById('noCompletedMessage');
        if (!container) return;

        const completed = JSON.parse(localStorage.getItem('completedPaaths') || '[]');

        if (completed.length === 0) {
            if (noMessage) noMessage.style.display = 'block';
            return;
        }

        if (noMessage) noMessage.style.display = 'none';

        container.innerHTML = completed.map((p, i) => `
            <div class="completed-paath-item">
                <div class="completed-info">
                    <span class="completed-number">Paath #${p.number || i + 1}</span>
                    <span class="completed-date">${new Date(p.endDate).toLocaleDateString()}</span>
                </div>
                <span class="completed-badge">${p.completed ? '✅ Completed' : '📖 Partial'}</span>
            </div>
        `).join('');
    }

    calculateAverageAngsPerDay() {
        if (!this.state.currentPaath?.startDate) return 5;

        const startDate = new Date(this.state.currentPaath.startDate);
        const today = new Date();
        const daysPassed = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));

        return (this.state.currentPaath.currentAng || 1) / daysPassed;
    }

    updateBookmarkCount() {
        const count = document.getElementById('bookmarkCount');
        if (count) {
            const bookmarks = JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]');
            count.textContent = bookmarks.length;
            count.style.display = bookmarks.length > 0 ? 'flex' : 'none';
        }
    }

    updateNotesCount() {
        const count = document.getElementById('notesCount');
        if (count) {
            const notes = JSON.parse(localStorage.getItem('sehajPaathNotes') || '[]');
            count.textContent = notes.length;
            count.style.display = notes.length > 0 ? 'flex' : 'none';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    goBack() {
        window.location.href = '../index.html';
    }

    openReader(ang = null) {
        const targetAng = ang || this.state.currentPaath?.currentAng || 1;
        window.location.href = `reader.html?ang=${targetAng}`;
    }

    /**
     * Open reader in DETACHED MODE - for Random Ang, Search, Bookmarks, Hukamnama
     * This prevents non-sequential navigation from corrupting Sehaj Paath progress.
     * @param {number} ang - The ang number to open
     * @param {string} source - The source: 'random', 'search', 'bookmark', 'hukamnama'
     */
    openReaderDetached(ang, source = 'random') {
        window.location.href = `reader.html?ang=${ang}&source=${source}`;
    }

    onAngSliderChange(e) {
        const value = parseInt(e.target.value);

        const sliderCurrentAng = document.getElementById('sliderCurrentAng');
        if (sliderCurrentAng) sliderCurrentAng.textContent = value;

        const angInput = document.getElementById('angInput');
        if (angInput) angInput.value = value;
    }

    goToAng(ang) {
        if (ang < 1 || ang > 1430 || isNaN(ang)) {
            this.showToast('Please enter a valid Ang number (1-1430)');
            return;
        }
        this.openReader(ang);
    }

    async handleQuickNav(e) {
        const btn = e.currentTarget;
        const ang = btn.dataset.ang;
        const action = btn.dataset.action;

        if (ang) {
            // Quick nav to specific Ang (like Japji, Sukhmani) - use detached mode
            this.openReaderDetached(parseInt(ang), 'bookmark');
        } else if (action === 'random') {
            // Random Ang - ALWAYS use detached mode
            const randomAng = Math.floor(Math.random() * 1430) + 1;
            this.showToast(`🎲 Random Ang ${randomAng} (Progress unchanged)`);
            setTimeout(() => this.openReaderDetached(randomAng, 'random'), 500);
        } else if (action === 'hukamnama') {
            await this.fetchAndOpenHukamnama();
        }
    }

    async fetchAndOpenHukamnama() {
        try {
            this.showToast('🙏 Fetching today\'s Hukamnama...');

            const hukamnama = await this.api.getHukamnama();
            if (hukamnama?.ang) {
                this.showToast(`Opening Hukamnama - Ang ${hukamnama.ang}`);
                // Hukamnama uses detached mode
                setTimeout(() => this.openReaderDetached(hukamnama.ang, 'hukamnama'), 500);
            } else {
                // Fallback to random ang - still detached
                const randomAng = Math.floor(Math.random() * 1430) + 1;
                this.showToast('Could not fetch Hukamnama. Opening random Ang...');
                setTimeout(() => this.openReaderDetached(randomAng, 'random'), 500);
            }
        } catch (error) {
            console.error('Error fetching hukamnama:', error);
            const randomAng = Math.floor(Math.random() * 1430) + 1;
            this.showToast('Opening random Ang instead...');
            setTimeout(() => this.openReaderDetached(randomAng, 'random'), 500);
        }
    }

    handleNavigation(tab) {
        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        switch (tab) {
            case 'home':
                // Already on home - scroll to top
                document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'read':
                this.openReader();
                break;
            case 'search':
                // Open dedicated Gurmukhi search page
                window.location.href = 'gurbani-search.html';
                break;
            case 'bookmarks':
                this.renderBookmarksModal();
                this.openModal('bookmarksModal');
                break;
            case 'settings':
                this.renderSettingsModal();
                this.openModal('settingsModal');
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    renderSettingsModal() {
        const container = document.getElementById('settingsContainer');
        if (!container) return;

        if (this.settingsPanel) {
            this.settingsPanel.render('settingsContainer');
        } else {
            // Fallback settings UI
            container.innerHTML = this.getSettingsHTML();
            this.attachSettingsListeners(container);
        }
    }

    getSettingsHTML() {
        const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
        // Sync with global theme
        const globalTheme = window.AnhadTheme ? window.AnhadTheme.get() : 'light';
        const theme = settings.theme || globalTheme;

        return `
            <div class="settings-inner">
                <section class="settings-section">
                    <h3>🎨 Theme</h3>
                    <div class="theme-grid">
                        <button class="theme-btn ${theme === 'light' ? 'active' : ''}" data-theme="light">
                            <span>☀️</span><span>Light</span>
                        </button>
                        <button class="theme-btn ${theme === 'dark' ? 'active' : ''}" data-theme="dark">
                            <span>🌙</span><span>Dark</span>
                        </button>
                    </div>
                </section>
                
                <section class="settings-section">
                    <h3>📖 Reading</h3>
                    <div class="setting-row">
                        <label>Font Size</label>
                        <input type="range" id="settingsFontSize" min="16" max="32" value="${settings.fontSize || 22}">
                    </div>
                    <div class="setting-row toggle-row">
                        <label>Show Translation</label>
                        <input type="checkbox" id="settingsTranslation" ${settings.showTranslation !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row toggle-row">
                        <label>Show Transliteration</label>
                        <input type="checkbox" id="settingsTransliteration" ${settings.showTransliteration ? 'checked' : ''}>
                    </div>
                </section>
                
                <section class="settings-section">
                    <h3>🗑️ Data</h3>
                    <button class="settings-btn danger" id="clearDataBtn">Clear All Data</button>
                </section>
            </div>
        `;
    }

    attachSettingsListeners(container) {
        // Theme buttons - sync with global theme
        container.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                
                // Update global theme
                if (window.AnhadTheme) {
                    window.AnhadTheme.set(theme);
                } else {
                    document.documentElement.dataset.theme = theme;
                }
                
                // Save to local settings
                const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
                settings.theme = theme;
                localStorage.setItem('sehajPaathSettings', JSON.stringify(settings));
                this.showToast(`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
            });
        });

        // Font size
        container.querySelector('#settingsFontSize')?.addEventListener('change', (e) => {
            const settings = JSON.parse(localStorage.getItem('sehajPaathSettings') || '{}');
            settings.fontSize = parseInt(e.target.value);
            localStorage.setItem('sehajPaathSettings', JSON.stringify(settings));
        });

        // Clear data
        container.querySelector('#clearDataBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure? This will delete all your reading progress, bookmarks, and settings.')) {
                Object.keys(localStorage)
                    .filter(k => k.startsWith('sehajPaath'))
                    .forEach(k => localStorage.removeItem(k));
                localStorage.removeItem('completedPaaths');
                location.reload();
            }
        });
    }

    renderBookmarksModal() {
        const container = document.getElementById('bookmarksContainer');
        if (!container) return;

        const bookmarks = JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]');

        container.innerHTML = bookmarks.length === 0 ? `
            <div class="empty-state">
                <span class="empty-icon">🔖</span>
                <p>No bookmarks yet</p>
                <p class="subtle">Tap the bookmark icon while reading to save your place</p>
            </div>
        ` : `
            <div class="bookmarks-list">
                ${bookmarks.map(b => `
                    <div class="bookmark-item" data-ang="${b.ang}">
                        <div class="bookmark-info">
                            <span class="bookmark-ang">Ang ${b.ang}</span>
                            <span class="bookmark-date">${new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button class="bookmark-delete" data-id="${b.id}">🗑️</button>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners
        container.querySelectorAll('.bookmark-item').forEach(item => {
            item.querySelector('.bookmark-info')?.addEventListener('click', () => {
                this.closeAllModals();
                this.openReader(parseInt(item.dataset.ang));
            });
        });

        container.querySelectorAll('.bookmark-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                let bookmarks = JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]');
                bookmarks = bookmarks.filter(b => b.id !== id);
                localStorage.setItem('sehajPaathBookmarks', JSON.stringify(bookmarks));
                this.renderBookmarksModal();
                this.updateBookmarkCount();
                this.showToast('Bookmark removed');
            });
        });
    }

    renderNotesModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('notesModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'notesModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📝 Notes</h2>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body" id="notesContainer"></div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.modal-close')?.addEventListener('click', () => this.closeAllModals());
            modal.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeAllModals());
        }

        const container = document.getElementById('notesContainer');
        const notes = JSON.parse(localStorage.getItem('sehajPaathNotes') || '[]');

        container.innerHTML = notes.length === 0 ? `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>No notes yet</p>
                <p class="subtle">Add notes while reading to remember important passages</p>
            </div>
        ` : `
            <div class="notes-list">
                ${notes.map(n => `
                    <div class="note-item" data-id="${n.id}">
                        <div class="note-header">
                            ${n.ang ? `<span class="note-ang" data-ang="${n.ang}">Ang ${n.ang}</span>` : ''}
                            <span class="note-date">${new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p class="note-text">${n.text}</p>
                        <div class="note-actions">
                            <button class="note-delete" data-id="${n.id}">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Event listeners
        container.querySelectorAll('.note-ang').forEach(el => {
            el.addEventListener('click', () => {
                this.closeAllModals();
                this.openReader(parseInt(el.dataset.ang));
            });
        });

        container.querySelectorAll('.note-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                let notes = JSON.parse(localStorage.getItem('sehajPaathNotes') || '[]');
                notes = notes.filter(n => n.id !== btn.dataset.id);
                localStorage.setItem('sehajPaathNotes', JSON.stringify(notes));
                this.renderNotesModal();
                this.updateNotesCount();
                this.showToast('Note deleted');
            });
        });
    }

    renderHistoryModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('historyModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'historyModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📜 Reading History</h2>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body" id="historyContainer"></div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.modal-close')?.addEventListener('click', () => this.closeAllModals());
            modal.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeAllModals());
        }

        const container = document.getElementById('historyContainer');
        const history = JSON.parse(localStorage.getItem('sehajPaathHistory') || '[]').slice(0, 50);

        container.innerHTML = history.length === 0 ? `
            <div class="empty-state">
                <span class="empty-icon">📜</span>
                <p>No reading history yet</p>
                <p class="subtle">Your reading sessions will appear here</p>
            </div>
        ` : `
            <div class="history-list">
                ${history.map(h => `
                    <div class="history-item" data-ang="${h.ang}">
                        <div class="history-info">
                            <span class="history-ang">Ang ${h.ang}</span>
                            <span class="history-duration">${h.duration || ''}</span>
                        </div>
                        <span class="history-date">${new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.closeAllModals();
                this.openReader(parseInt(item.dataset.ang));
            });
        });
    }

    renderAchievementsModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('achievementsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'achievementsModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🏆 Achievements</h2>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body" id="achievementsContainer"></div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.modal-close')?.addEventListener('click', () => this.closeAllModals());
            modal.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeAllModals());
        }

        const container = document.getElementById('achievementsContainer');

        if (this.achievementsEngine) {
            this.achievementsEngine.render('achievementsContainer');
        } else {
            // Fallback achievements display
            const unlocked = JSON.parse(localStorage.getItem('sehajPaathAchievements') || '[]');
            const allAchievements = [
                { id: 'first_read', name: 'First Steps', desc: 'Read your first Ang', icon: '🌱' },
                { id: 'ang_10', name: 'Getting Started', desc: 'Read 10 Angs', icon: '📖' },
                { id: 'ang_50', name: 'Dedicated Reader', desc: 'Read 50 Angs', icon: '📚' },
                { id: 'ang_100', name: 'Century', desc: 'Read 100 Angs', icon: '💯' },
                { id: 'streak_3', name: 'Consistent', desc: '3 day reading streak', icon: '🔥' },
                { id: 'streak_7', name: 'Week Warrior', desc: '7 day reading streak', icon: '💪' },
                { id: 'streak_30', name: 'Monthly Master', desc: '30 day streak', icon: '🎖️' },
                { id: 'bookmark_5', name: 'Collector', desc: 'Save 5 bookmarks', icon: '🔖' }
            ];

            container.innerHTML = `
                <div class="achievements-grid">
                    <p class="achievements-progress">${unlocked.length}/${allAchievements.length} unlocked</p>
                    ${allAchievements.map(a => `
                        <div class="achievement-card ${unlocked.includes(a.id) ? 'unlocked' : 'locked'}">
                            <span class="achievement-icon">${unlocked.includes(a.id) ? a.icon : '🔒'}</span>
                            <span class="achievement-name">${unlocked.includes(a.id) ? a.name : '???'}</span>
                            <span class="achievement-desc">${a.desc}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════════════════════════════════════

    async performSearch(query) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer || !query.trim()) {
            if (resultsContainer) {
                resultsContainer.innerHTML = '<p class="search-placeholder">Enter your search query above</p>';
            }
            return;
        }

        resultsContainer.innerHTML = '<p class="search-placeholder">🔍 Searching...</p>';

        try {
            const activeTab = document.querySelector('.search-tab.active');
            const searchType = activeTab?.dataset.type || '1';

            const results = await this.api.search(query, searchType);

            if (!results || results.length === 0) {
                resultsContainer.innerHTML = '<p class="search-placeholder">No results found</p>';
                return;
            }

            resultsContainer.innerHTML = results.slice(0, 20).map(result => `
                <div class="search-result-item" data-ang="${result.ang}">
                    <div class="result-header">
                        <span class="result-ang">Ang ${result.ang}</span>
                        ${result.raag ? `<span class="result-raag">${result.raag}</span>` : ''}
                    </div>
                    <p class="result-gurmukhi">${result.gurmukhi || ''}</p>
                    ${result.translation ? `<p class="result-translation">${result.translation}</p>` : ''}
                </div>
            `).join('');

            // Add click handlers
            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const ang = parseInt(item.dataset.ang);
                    this.closeAllModals();
                    this.openReader(ang);
                });
            });
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<p class="search-placeholder">Search failed. Please try again.</p>';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAATH MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    async startNewPaath() {
        const confirm = window.confirm('Start a new Sehaj Paath? Your current progress will be saved to history.');

        if (!confirm) return;

        // Save current paath to completed
        if (this.state.currentPaath) {
            const completedPaaths = JSON.parse(localStorage.getItem('completedPaaths') || '[]');
            completedPaaths.push({
                ...this.state.currentPaath,
                endDate: new Date().toISOString(),
                completed: this.state.currentPaath.currentAng >= 1430
            });
            localStorage.setItem('completedPaaths', JSON.stringify(completedPaaths));
        }

        // Create new paath
        await this.initNewPaath();
        this.updateUI();

        this.showToast(`Started Paath #${this.state.currentPaath.number}! ਵਾਹਿਗੁਰੂ!`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REMINDER SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    toggleReminder(enabled) {
        const reminderBody = document.getElementById('reminderBody');
        if (reminderBody) {
            reminderBody.classList.toggle('disabled', !enabled);
        }

        localStorage.setItem('sehajPaathReminderEnabled', enabled);

        if (enabled) {
            const time = document.getElementById('reminderTime')?.value || '06:00';
            localStorage.setItem('sehajPaathReminderTime', time);
            this.showToast(`Daily reminder set for ${time}`);
        } else {
            this.showToast('Daily reminder disabled');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OFFLINE DOWNLOAD
    // ═══════════════════════════════════════════════════════════════════════════

    async downloadAllAngs() {
        const btn = document.getElementById('downloadAngsBtn');
        const info = document.getElementById('offlineInfo');
        const fill = document.getElementById('downloadProgressFill');

        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span><span>Downloading...</span>';

        this.showToast('Starting download... This may take a while.');

        const cacheService = typeof CacheService !== 'undefined' ? new CacheService() : null;

        if (!cacheService) {
            this.showToast('Offline download not available');
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download All Angs</span>';
            return;
        }

        try {
            let downloaded = 0;
            for (let ang = 1; ang <= 1430; ang++) {
                try {
                    const data = await this.api.getAng(ang);
                    await cacheService.cacheAng(ang, data);
                    downloaded++;

                    // Update progress every 10 angs
                    if (ang % 10 === 0) {
                        const percent = ((ang / 1430) * 100).toFixed(1);
                        if (info) info.textContent = `${ang}/1430 Angs downloaded (${percent}%)`;
                        if (fill) fill.style.width = `${percent}%`;
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(r => setTimeout(r, 100));
                } catch (e) {
                    console.warn(`Failed to cache Ang ${ang}:`, e);
                }
            }

            if (info) info.textContent = `${downloaded} Angs saved for offline reading`;
            if (fill) fill.style.width = '100%';
            this.showToast('Download complete! You can now read offline.');
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Download failed. Please try again.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download All Angs</span>';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACHIEVEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    checkAchievements() {
        if (this.achievementsEngine) {
            this.achievementsEngine.checkAchievements();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    hideLoading() {
        const loadingScreen = document.getElementById('appLoading');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
        this.state.isLoading = false;
    }

    showToast(message) {
        // Remove existing toast
        document.querySelectorAll('.simple-toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'simple-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 9999;
            animation: toastIn 0.3s ease;
            max-width: 80%;
            text-align: center;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    showError(message) {
        console.error(message);
        this.showToast(message);
    }
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
    
    .settings-inner { padding: 16px; }
    .settings-section { margin-bottom: 24px; }
    .settings-section h3 { font-size: 14px; color: var(--text-tertiary); margin-bottom: 12px; }
    .theme-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .theme-btn { display: flex; flex-direction: column; align-items: center; padding: 12px; background: var(--glass-bg); border: 2px solid transparent; border-radius: 12px; cursor: pointer; }
    .theme-btn.active { border-color: var(--sehaj-gold); }
    .theme-btn span:first-child { font-size: 24px; margin-bottom: 4px; }
    .theme-btn span:last-child { font-size: 11px; color: var(--text-secondary); }
    .setting-row { margin-bottom: 16px; }
    .setting-row label { display: block; margin-bottom: 8px; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; }
    .settings-btn { width: 100%; padding: 12px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 10px; color: var(--text-primary); cursor: pointer; }
    .settings-btn.danger { color: #FF3B30; border-color: rgba(255,59,48,0.3); }
    
    .bookmarks-list, .notes-list, .history-list { display: flex; flex-direction: column; gap: 12px; }
    .bookmark-item, .note-item, .history-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--glass-bg); border-radius: 12px; cursor: pointer; }
    .bookmark-info, .note-header, .history-info { display: flex; flex-direction: column; gap: 4px; }
    .bookmark-ang, .note-ang, .history-ang { font-weight: 600; color: var(--sehaj-gold); }
    .bookmark-date, .note-date, .history-date { font-size: 12px; color: var(--text-tertiary); }
    .bookmark-delete, .note-delete { background: none; border: none; font-size: 16px; cursor: pointer; }
    
    .achievements-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .achievements-progress { grid-column: span 2; text-align: center; padding: 12px; color: var(--text-secondary); }
    .achievement-card { padding: 16px; background: var(--glass-bg); border-radius: 12px; text-align: center; }
    .achievement-card.locked { opacity: 0.5; }
    .achievement-icon { font-size: 32px; display: block; margin-bottom: 8px; }
    .achievement-name { font-weight: 600; display: block; }
    .achievement-desc { font-size: 11px; color: var(--text-tertiary); }
    
    .note-text { margin: 8px 0; color: var(--text-primary); }
    .note-actions { margin-top: 8px; }
    .note-delete { padding: 4px 12px; background: rgba(255,59,48,0.1); border: none; border-radius: 6px; color: #FF3B30; cursor: pointer; font-size: 12px; }
    
    .completed-paath-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--glass-bg); border-radius: 10px; margin-top: 8px; }
    .completed-info { display: flex; flex-direction: column; }
    .completed-number { font-weight: 600; }
    .completed-date { font-size: 11px; color: var(--text-tertiary); }
    .completed-badge { font-size: 12px; }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sehajPaathApp = new SehajPaathApp();
});
