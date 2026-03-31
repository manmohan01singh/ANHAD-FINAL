/**
 * Bani Reader Application
 * Universal reader for displaying Gurbani from BaniDB
 * @version 2.0.0
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // DEFAULTS
    // ═══════════════════════════════════════════════════════════════

    const DEFAULTS = {
        gurmukhiSize: 28,
        transliterationSize: 18,
        translationSize: 16,
        theme: localStorage.getItem('anhad_theme') || 'light', // Sync with global theme
        spacing: 'normal',
        showGurmukhi: true,
        showTransliteration: true,
        showEnglish: true,
        showPunjabi: false,
        autoScroll: false,
        autoScrollSpeed: 5,
        wakeLock: false
    };

    const SIZE_LIMITS = {
        gurmukhi: { min: 18, max: 52 },
        transliteration: { min: 12, max: 32 },
        translation: { min: 12, max: 28 }
    };

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    const state = {
        baniId: null,
        baniData: null,
        settings: { ...DEFAULTS },
        isSettingsOpen: false,
        scrollProgress: 0,
        wakeLockSentinel: null,
        autoScrollInterval: null
    };

    // ═══════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ═══════════════════════════════════════════════════════════════

    const elements = {
        loading: document.getElementById('readerLoading'),
        loadingText: document.getElementById('loadingText'),
        error: document.getElementById('readerError'),
        errorMessage: document.getElementById('errorMessage'),
        retryBtn: document.getElementById('retryBtn'),
        headerTitle: document.getElementById('headerTitle'),
        versesContainer: document.getElementById('versesContainer'),
        readerStats: document.getElementById('readerStats'),
        readerEnd: document.getElementById('readerEnd'),
        progressBar: document.getElementById('progressBar'),
        progressText: document.getElementById('progressText'),
        scrollTopBtn: document.getElementById('scrollTopBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        settingsOverlay: document.getElementById('settingsOverlay'),
        settingsClose: document.getElementById('settingsClose'),
        bookmarkBtn: document.getElementById('bookmarkBtn'),
        readAgainBtn: document.getElementById('readAgainBtn'),
        // Toggles
        toggleGurmukhi: document.getElementById('toggleGurmukhi'),
        toggleTransliteration: document.getElementById('toggleTransliteration'),
        toggleEnglish: document.getElementById('toggleEnglish'),
        togglePunjabi: document.getElementById('togglePunjabi'),
        // Settings
        gurmukhiSizeDisplay: document.getElementById('gurmukhiSizeDisplay'),
        transliterationSizeDisplay: document.getElementById('transliterationSizeDisplay'),
        translationSizeDisplay: document.getElementById('translationSizeDisplay'),
        autoScrollToggle: document.getElementById('autoScrollToggle'),
        autoScrollSpeed: document.getElementById('autoScrollSpeed'),
        wakeLockToggle: document.getElementById('wakeLockToggle'),
        resetSettingsBtn: document.getElementById('resetSettingsBtn')
    };

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    async function init() {
        console.log('🙏 Initializing Bani Reader...');

        // Get Bani ID from URL
        const params = new URLSearchParams(window.location.search);
        state.baniId = parseInt(params.get('id'), 10);

        if (!state.baniId || isNaN(state.baniId)) {
            showError('Invalid Bani ID. Please select a Bani from the library.');
            return;
        }

        // Load settings
        loadSettings();

        // Apply settings
        applySettings();

        // Setup event listeners
        setupEventListeners();

        // Load Bani
        await loadBani();

        console.log('✓ Bani Reader initialized');
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD BANI
    // ═══════════════════════════════════════════════════════════════

    async function loadBani() {
        showLoading(`Loading Bani...`);

        try {
            const data = await BaniDB.getBani(state.baniId);
            state.baniData = data;

            if (!data.verses || data.verses.length === 0) {
                throw new Error('No verses found in this Bani');
            }

            // Update title
            updateHeader(data);

            // Render content
            renderVerses(data.verses);
            renderStats(data);

            // Hide loading
            hideLoading();

            // Show end card
            elements.readerEnd.style.display = 'block';

        } catch (error) {
            console.error('Failed to load Bani:', error);
            showError(`Could not load Bani: ${error.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER HEADER
    // ═══════════════════════════════════════════════════════════════

    function updateHeader(data) {
        if (!elements.headerTitle) return;

        const nameGurmukhi = data.baniInfo?.unicode || data.baniInfo?.gurmukhi || 'ਬਾਣੀ';
        const nameEnglish = data.baniInfo?.transliteration || 'Bani';

        elements.headerTitle.innerHTML = `
      <span class="reader-header__gurmukhi">${BaniDB.escapeHtml(nameGurmukhi)}</span>
      <span class="reader-header__english">${BaniDB.escapeHtml(nameEnglish)}</span>
    `;

        // Update page title
        document.title = `${nameEnglish} | Gurbani Live`;
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER VERSES
    // ═══════════════════════════════════════════════════════════════

    function renderVerses(verses) {
        if (!elements.versesContainer) return;
        elements.versesContainer.innerHTML = '';

        let currentHeader = null;

        verses.forEach((verseData, index) => {
            const parsed = BaniDB.parseVerse(verseData);

            // Section headers
            const header = verseData.header || verseData.verse?.header;
            if (header && header !== currentHeader) {
                currentHeader = header;
                const headerEl = createSectionHeader(header);
                elements.versesContainer.appendChild(headerEl);
            }

            // Create verse element
            const verseEl = createVerseElement(parsed, index);
            elements.versesContainer.appendChild(verseEl);
        });

        // Update visibility based on settings
        updateDisplayVisibility();
    }

    function createSectionHeader(headerType) {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'section-header';

        const headerNames = {
            1: 'ਛੰਦ • Chhant',
            2: 'ਸਵੈਯਾ • Savaiyya',
            3: 'ਦੋਹਰਾ • Dohra',
            4: 'ਚੌਪਈ • Chaupai',
            5: 'ਅੜਿੱਲ • Arill',
            6: 'ਭੁਜੰਗ ਪ੍ਰਯਾਤ • Bhujang Prayat'
        };

        const name = headerNames[headerType] || `Section ${headerType}`;
        headerDiv.innerHTML = `<h2>${name}</h2>`;

        return headerDiv;
    }

    function createVerseElement(parsed, index) {
        const verseEl = document.createElement('div');
        verseEl.className = 'verse';
        verseEl.dataset.verseId = parsed.id || index;
        verseEl.style.animationDelay = `${Math.min(index * 0.03, 0.3)}s`;

        verseEl.innerHTML = `
      <div class="verse__gurmukhi ${state.settings.showGurmukhi ? '' : 'hidden'}">${parsed.gurmukhi}</div>
      <div class="verse__transliteration ${state.settings.showTransliteration ? '' : 'hidden'}">${parsed.transliteration}</div>
      <div class="verse__english ${state.settings.showEnglish ? '' : 'hidden'}">${parsed.english}</div>
      <div class="verse__punjabi ${state.settings.showPunjabi ? '' : 'hidden'}">${parsed.punjabi}</div>
    `;

        return verseEl;
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER STATS
    // ═══════════════════════════════════════════════════════════════

    function renderStats(data) {
        if (!elements.readerStats) return;

        const verseCount = data.verses?.length || 0;
        const baniName = data.baniInfo?.unicode || '';

        elements.readerStats.innerHTML = `
      ✓ ${BaniDB.escapeHtml(baniName)} • ${verseCount} verses
    `;
    }

    // ═══════════════════════════════════════════════════════════════
    // DISPLAY TOGGLES
    // ═══════════════════════════════════════════════════════════════

    function toggleDisplay(type) {
        const settingKey = `show${type.charAt(0).toUpperCase() + type.slice(1)}`;
        state.settings[settingKey] = !state.settings[settingKey];

        updateDisplayVisibility();
        updateToggleButtons();
        saveSettings();
    }

    function updateDisplayVisibility() {
        // Gurmukhi
        document.querySelectorAll('.verse__gurmukhi').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showGurmukhi);
        });

        // Transliteration
        document.querySelectorAll('.verse__transliteration').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showTransliteration);
        });

        // English
        document.querySelectorAll('.verse__english').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showEnglish);
        });

        // Punjabi
        document.querySelectorAll('.verse__punjabi').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showPunjabi);
        });
    }

    function updateToggleButtons() {
        if (elements.toggleGurmukhi) {
            elements.toggleGurmukhi.dataset.active = state.settings.showGurmukhi;
            elements.toggleGurmukhi.classList.toggle('active', state.settings.showGurmukhi);
        }
        if (elements.toggleTransliteration) {
            elements.toggleTransliteration.dataset.active = state.settings.showTransliteration;
            elements.toggleTransliteration.classList.toggle('active', state.settings.showTransliteration);
        }
        if (elements.toggleEnglish) {
            elements.toggleEnglish.dataset.active = state.settings.showEnglish;
            elements.toggleEnglish.classList.toggle('active', state.settings.showEnglish);
        }
        if (elements.togglePunjabi) {
            elements.togglePunjabi.dataset.active = state.settings.showPunjabi;
            elements.togglePunjabi.classList.toggle('active', state.settings.showPunjabi);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════

    function applySettings() {
        const root = document.documentElement;

        // Font sizes
        root.style.setProperty('--gurmukhi-size', `${state.settings.gurmukhiSize}px`);
        root.style.setProperty('--transliteration-size', `${state.settings.transliterationSize}px`);
        root.style.setProperty('--translation-size', `${state.settings.translationSize}px`);

        // Theme - apply to both html and body for maximum compatibility
        document.documentElement.setAttribute('data-theme', state.settings.theme);
        document.body.setAttribute('data-theme', state.settings.theme);

        // Spacing
        document.body.setAttribute('data-spacing', state.settings.spacing);

        // Update displays
        if (elements.gurmukhiSizeDisplay) elements.gurmukhiSizeDisplay.textContent = state.settings.gurmukhiSize;
        if (elements.transliterationSizeDisplay) elements.transliterationSizeDisplay.textContent = state.settings.transliterationSize;
        if (elements.translationSizeDisplay) elements.translationSizeDisplay.textContent = state.settings.translationSize;

        // Update toggle states
        updateToggleButtons();
        updateSettingsUI();
    }

    function updateSettingsUI() {
        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === state.settings.theme);
        });

        // Spacing buttons
        document.querySelectorAll('.spacing-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.spacing === state.settings.spacing);
        });

        // Auto scroll
        if (elements.autoScrollToggle) {
            elements.autoScrollToggle.dataset.active = state.settings.autoScroll;
        }
        if (elements.autoScrollSpeed) {
            elements.autoScrollSpeed.value = state.settings.autoScrollSpeed;
            elements.autoScrollSpeed.disabled = !state.settings.autoScroll;
        }

        // Wake lock
        if (elements.wakeLockToggle) {
            elements.wakeLockToggle.dataset.active = state.settings.wakeLock;
        }
    }

    function adjustSize(target, action) {
        const key = `${target}Size`;
        const limits = SIZE_LIMITS[target];

        if (!limits) return;

        const step = 2;

        if (action === 'increase' && state.settings[key] < limits.max) {
            state.settings[key] += step;
        } else if (action === 'decrease' && state.settings[key] > limits.min) {
            state.settings[key] -= step;
        }

        applySettings();
        saveSettings();
    }

    function setTheme(theme) {
        state.settings.theme = theme;
        applySettings();
        saveSettings();
    }

    function setSpacing(spacing) {
        state.settings.spacing = spacing;
        applySettings();
        saveSettings();
    }

    function resetSettings() {
        state.settings = { ...DEFAULTS };
        applySettings();
        saveSettings();
    }

    function saveSettings() {
        try {
            localStorage.setItem('baniReader_settings', JSON.stringify(state.settings));
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem('baniReader_settings');
            if (saved) {
                state.settings = { ...DEFAULTS, ...JSON.parse(saved) };
            }
            
            // Always sync with global theme on load
            const globalTheme = localStorage.getItem('anhad_theme') || 'light';
            state.settings.theme = globalTheme;
            
        } catch (e) {
            console.warn('Could not load settings:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AUTO SCROLL
    // ═══════════════════════════════════════════════════════════════

    function toggleAutoScroll() {
        state.settings.autoScroll = !state.settings.autoScroll;

        if (state.settings.autoScroll) {
            startAutoScroll();
        } else {
            stopAutoScroll();
        }

        updateSettingsUI();
        saveSettings();
    }

    function startAutoScroll() {
        if (state.autoScrollInterval) return;

        const speed = state.settings.autoScrollSpeed;
        const scrollAmount = speed * 0.5;

        state.autoScrollInterval = setInterval(() => {
            window.scrollBy({ top: scrollAmount, behavior: 'auto' });
        }, 50);
    }

    function stopAutoScroll() {
        if (state.autoScrollInterval) {
            clearInterval(state.autoScrollInterval);
            state.autoScrollInterval = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // WAKE LOCK
    // ═══════════════════════════════════════════════════════════════

    async function toggleWakeLock() {
        if (!('wakeLock' in navigator)) {
            alert('Wake Lock is not supported in this browser');
            return;
        }

        state.settings.wakeLock = !state.settings.wakeLock;

        if (state.settings.wakeLock) {
            try {
                state.wakeLockSentinel = await navigator.wakeLock.request('screen');
                console.log('Wake Lock acquired');
            } catch (e) {
                console.warn('Could not acquire Wake Lock:', e);
                state.settings.wakeLock = false;
            }
        } else {
            if (state.wakeLockSentinel) {
                await state.wakeLockSentinel.release();
                state.wakeLockSentinel = null;
                console.log('Wake Lock released');
            }
        }

        updateSettingsUI();
        saveSettings();
    }

    // ═══════════════════════════════════════════════════════════════
    // PROGRESS TRACKING
    // ═══════════════════════════════════════════════════════════════

    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

        state.scrollProgress = progress;

        if (elements.progressBar) {
            elements.progressBar.style.width = `${progress}%`;
        }
        if (elements.progressText) {
            elements.progressText.textContent = `${progress}%`;
        }

        // Show/hide scroll top button
        if (elements.scrollTopBtn) {
            elements.scrollTopBtn.classList.toggle('visible', scrollTop > 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS PANEL
    // ═══════════════════════════════════════════════════════════════

    function openSettings() {
        state.isSettingsOpen = true;
        elements.settingsPanel?.classList.add('visible');
        elements.settingsOverlay?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeSettings() {
        state.isSettingsOpen = false;
        elements.settingsPanel?.classList.remove('visible');
        elements.settingsOverlay?.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // ═══════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════

    function showLoading(message) {
        if (elements.loading) {
            elements.loading.classList.remove('hidden');
            elements.loading.style.display = 'flex';
        }
        if (elements.loadingText) {
            elements.loadingText.textContent = message;
        }
        if (elements.error) {
            elements.error.style.display = 'none';
        }
    }

    function hideLoading() {
        if (elements.loading) {
            elements.loading.classList.add('hidden');
            setTimeout(() => {
                elements.loading.style.display = 'none';
            }, 500);
        }
    }

    function showError(message) {
        if (elements.loading) {
            elements.loading.style.display = 'none';
        }
        if (elements.error) {
            elements.error.style.display = 'flex';
        }
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════

    function setupEventListeners() {
        // Scroll progress
        window.addEventListener('scroll', updateProgress, { passive: true });

        // Scroll to top
        elements.scrollTopBtn?.addEventListener('click', scrollToTop);

        // Settings panel
        elements.settingsBtn?.addEventListener('click', openSettings);
        elements.settingsClose?.addEventListener('click', closeSettings);
        elements.settingsOverlay?.addEventListener('click', closeSettings);

        // Display toggles
        elements.toggleGurmukhi?.addEventListener('click', () => toggleDisplay('gurmukhi'));
        elements.toggleTransliteration?.addEventListener('click', () => toggleDisplay('transliteration'));
        elements.toggleEnglish?.addEventListener('click', () => toggleDisplay('english'));
        elements.togglePunjabi?.addEventListener('click', () => toggleDisplay('punjabi'));

        // Size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                adjustSize(btn.dataset.target, btn.dataset.action);
            });
        });

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => setTheme(btn.dataset.theme));
        });

        // Spacing buttons
        document.querySelectorAll('.spacing-btn').forEach(btn => {
            btn.addEventListener('click', () => setSpacing(btn.dataset.spacing));
        });

        // Auto scroll toggle
        elements.autoScrollToggle?.addEventListener('click', toggleAutoScroll);
        elements.autoScrollSpeed?.addEventListener('input', (e) => {
            state.settings.autoScrollSpeed = parseInt(e.target.value, 10);
            if (state.settings.autoScroll) {
                stopAutoScroll();
                startAutoScroll();
            }
            saveSettings();
        });

        // Wake lock toggle
        elements.wakeLockToggle?.addEventListener('click', toggleWakeLock);

        // Reset settings
        elements.resetSettingsBtn?.addEventListener('click', () => {
            resetSettings();
            closeSettings();
        });

        // Retry button
        elements.retryBtn?.addEventListener('click', loadBani);

        // Read again button
        elements.readAgainBtn?.addEventListener('click', scrollToTop);

        // ═══════════════════════════════════════════════════════════════
        // GLOBAL THEME SYNC — Listen for theme changes from other parts of the app
        // ═══════════════════════════════════════════════════════════════
        window.addEventListener('storage', (e) => {
            if (e.key === 'anhad_theme' && e.newValue) {
                state.settings.theme = e.newValue;
                applySettings();
                console.log('🎨 Nitnem reader synced with global theme:', e.newValue);
            }
        });

        // Listen for custom theme change events
        window.addEventListener('themechange', (e) => {
            if (e.detail?.theme) {
                state.settings.theme = e.detail.theme;
                applySettings();
                console.log('🎨 Nitnem reader theme changed via event:', e.detail.theme);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isSettingsOpen) {
                closeSettings();
            }
        });

        // Stop auto scroll on user interaction
        window.addEventListener('wheel', () => {
            if (state.settings.autoScroll) {
                state.settings.autoScroll = false;
                stopAutoScroll();
                updateSettingsUI();
                saveSettings();
            }
        }, { passive: true });

        window.addEventListener('touchstart', () => {
            if (state.settings.autoScroll) {
                state.settings.autoScroll = false;
                stopAutoScroll();
                updateSettingsUI();
                saveSettings();
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════

    document.addEventListener('DOMContentLoaded', init);
})();
