/**
 * Reader Engine - Clean Bani Display
 * FIXES: Wrong verse type labels (Chhant, Savaiyya on Japji etc.)
 * @version 2.1.0
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // DEFAULTS
    // ═══════════════════════════════════════════════════════════════

    const DEFAULTS = {
        // Display
        fontSize: 28,
        fontFamily: 'gurmukhi',
        lineSpacing: 1.8,
        textAlign: 'center',
        // Appearance
        theme: 'dark',
        amoled: false,
        accentColor: '#D4AF37',
        // Reading
        showTranslation: true,
        translationLang: 'english',
        showTransliteration: true,
        paragraphMode: false,
        larivaar: false,
        wakeLock: false,
        // Audio
        autoPlay: false,
        playbackSpeed: 1,
        // Legacy (for toggle buttons)
        showGurmukhi: true,
        showRoman: true,
        showEnglish: true,
        showPunjabi: false
    };

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    const state = {
        baniId: null,
        baniData: null,
        baniMeta: null,
        settings: { ...DEFAULTS },
        isSettingsOpen: false,
        wakeLockSentinel: null
    };

    // ═══════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ═══════════════════════════════════════════════════════════════

    const $ = (id) => document.getElementById(id);

    const els = {
        // Core
        loadingOverlay: $('loadingOverlay'),
        loadingText: $('loadingText'),
        errorState: $('errorState'),
        errorMessage: $('errorMessage'),
        retryBtn: $('retryBtn'),
        readerApp: $('readerApp'),
        readerTitle: $('readerTitle'),
        readerInfo: $('readerInfo'),
        versesContainer: $('versesContainer'),
        readerEnd: $('readerEnd'),
        progressBar: $('progressBar'),
        progressText: $('progressText'),
        scrollTopBtn: $('scrollTopBtn'),
        // NEW: Header and toggles for scroll-hide
        readerHeader: document.querySelector('.reader-header'),
        readerToggles: document.querySelector('.reader-toggles'),
        settingsBtn: $('settingsBtn'),
        settingsOverlay: $('settingsOverlay'),
        settingsDrawer: $('settingsDrawer'),
        settingsClose: $('settingsClose'),
        bookmarkBtn: $('bookmarkBtn'),
        readAgainBtn: $('readAgainBtn'),
        resetBtn: $('resetBtn'),
        // Display toggles (header)
        toggleGurmukhi: $('toggleGurmukhi'),
        toggleRoman: $('toggleRoman'),
        toggleEnglish: $('toggleEnglish'),
        togglePunjabi: $('togglePunjabi'),
        // NEW: Display settings
        fontSizeSlider: $('fontSizeSlider'),
        fontSizeValue: $('fontSizeValue'),
        fontFamilySelect: $('fontFamilySelect'),
        lineSpacingSlider: $('lineSpacingSlider'),
        lineSpacingValue: $('lineSpacingValue'),
        // NEW: Appearance
        amoledToggle: $('amoledToggle'),
        // NEW: Reading
        translationToggle: $('translationToggle'),
        translationLangSelect: $('translationLangSelect'),
        transliterationToggle: $('transliterationToggle'),
        larivaarToggle: $('larivaarToggle'),
        wakeLockToggle: $('wakeLockToggle'),
        // NEW: Audio
        autoPlayToggle: $('autoPlayToggle'),
        playbackSpeedSelect: $('playbackSpeedSelect'),
        // NEW: Paragraph Mode
        paragraphModeToggle: $('paragraphModeToggle'),
        // NEW: Data actions
        downloadOfflineBtn: $('downloadOfflineBtn'),
        clearHistoryBtn: $('clearHistoryBtn')
    };

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    async function init() {
        console.log('🙏 Initializing Reader...');

        // Get Bani ID from URL
        const params = new URLSearchParams(window.location.search);
        state.baniId = parseInt(params.get('id'), 10);

        if (!state.baniId || isNaN(state.baniId)) {
            showError('Invalid Bani ID');
            return;
        }

        // Get metadata for this Bani
        state.baniMeta = typeof getBaniMeta === 'function' ? getBaniMeta(state.baniId) : null;

        // Load settings
        loadSettings();
        applySettings();

        // Setup events
        setupEvents();

        // Load Bani
        await loadBani();
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD BANI
    // ═══════════════════════════════════════════════════════════════

    async function loadBani() {
        showLoading('Loading Bani...');

        try {
            const data = await BaniDB.getBani(state.baniId);
            state.baniData = data;

            if (!data.verses || data.verses.length === 0) {
                throw new Error('No verses found');
            }

            // Update header
            updateHeader(data);

            // Render verses - CLEAN, NO WRONG LABELS
            renderVerses(data.verses);

            // Show info
            renderInfo(data);

            // Hide loading, show app
            hideLoading();
            els.readerApp.style.display = 'flex';
            els.readerEnd.style.display = 'block';

        } catch (error) {
            console.error('Load failed:', error);
            showError(error.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UPDATE HEADER
    // ═══════════════════════════════════════════════════════════════

    function updateHeader(data) {
        const meta = state.baniMeta;
        const nameGurmukhi = meta?.nameGurmukhi || data.baniInfo?.unicode || 'ਬਾਣੀ';
        const nameEnglish = meta?.nameEnglish || data.baniInfo?.transliteration || 'Bani';

        els.readerTitle.innerHTML = `
      <span class="reader-gurmukhi">${escapeHtml(nameGurmukhi)}</span>
      <span class="reader-english">${escapeHtml(nameEnglish)}</span>
    `;

        document.title = `${nameEnglish} | Gurbani Live`;
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER INFO
    // ═══════════════════════════════════════════════════════════════

    function renderInfo(data) {
        const meta = state.baniMeta;
        const verseCount = data.verses?.length || 0;

        let info = '';

        if (meta) {
            info = `${meta.nameGurmukhi || meta.nameEnglish}`;
            if (meta.author) info += ` • ${meta.author}`;
            if (meta.estimatedTime) info += ` • ${meta.estimatedTime}`;
        } else {
            info = `${verseCount} verses`;
        }

        els.readerInfo.textContent = info;
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER VERSES - FIXED: NO WRONG LABELS
    // ═══════════════════════════════════════════════════════════════

    function renderVerses(verses) {
        els.versesContainer.innerHTML = '';

        const meta = state.baniMeta;
        const hideVerseType = meta?.hideVerseType === true;
        const showChhandType = meta?.showChhandType === true;

        let currentSection = null;
        let verseNumber = 0;

        verses.forEach((verseData, index) => {
            const parsed = parseVerse(verseData);

            // Section headers - only show for specific Banis that need them
            // AND only if showChhandType is true (like Jaap Sahib)
            if (showChhandType && !hideVerseType) {
                const header = verseData.header || verseData.verse?.header;
                if (header && header !== currentSection) {
                    currentSection = header;
                    const sectionEl = createSectionDivider(header);
                    els.versesContainer.appendChild(sectionEl);
                }
            }

            verseNumber++;

            // Create verse element - CLEAN
            const verseEl = createVerseElement(parsed, verseNumber, index);
            els.versesContainer.appendChild(verseEl);
        });

        updateVisibility();
    }

    /**
     * Parse verse data - extract all languages
     */
    function parseVerse(verseData) {
        const verse = verseData.verse || verseData;

        // Gurmukhi
        let gurmukhi = '';
        if (verse.verse) {
            gurmukhi = typeof verse.verse === 'string'
                ? verse.verse
                : verse.verse.unicode || verse.verse.gurmukhi || '';
        } else {
            gurmukhi = verse.unicode || verse.gurmukhi || '';
        }

        // Transliteration (Roman)
        let roman = '';
        const translit = verseData.transliteration || verse.transliteration;
        if (translit) {
            roman = typeof translit === 'string'
                ? translit
                : translit.english || translit.en || translit.roman || '';
        }

        // English Translation
        let english = '';
        const translation = verseData.translation || verse.translation;
        if (translation) {
            if (typeof translation === 'string') {
                english = translation;
            } else if (translation.en) {
                const en = translation.en;
                english = typeof en === 'string' ? en : en.bdb || en.ms || en.ssk || '';
            }
        }

        // Punjabi Translation
        let punjabi = '';
        if (translation?.pu) {
            const pu = translation.pu;
            if (typeof pu === 'string') {
                punjabi = pu;
            } else {
                for (const src of ['ss', 'bdb', 'ms', 'ft']) {
                    if (pu[src]) {
                        punjabi = typeof pu[src] === 'string'
                            ? pu[src]
                            : pu[src].unicode || pu[src].gurmukhi || '';
                        if (punjabi) break;
                    }
                }
            }
        }

        return {
            gurmukhi: escapeHtml(gurmukhi),
            roman: escapeHtml(roman),
            english: escapeHtml(english),
            punjabi: escapeHtml(punjabi)
        };
    }

    /**
     * Create verse element - CLEAN, NO WRONG LABELS
     */
    function createVerseElement(parsed, number, index) {
        const el = document.createElement('div');
        el.className = 'verse';
        el.style.animationDelay = `${Math.min(index * 0.02, 0.2)}s`;

        // Optional: Show subtle verse number
        // Only for Banis where it makes sense
        const meta = state.baniMeta;
        let numberLabel = '';
        if (meta?.structure && meta.totalUnits) {
            // Show: "Pauri 5", "Verse 10", etc.
            // But keep it subtle
        }

        el.innerHTML = `
      <div class="verse-gurmukhi ${state.settings.showGurmukhi ? '' : 'hidden'}">${parsed.gurmukhi}</div>
      <div class="verse-roman ${state.settings.showRoman ? '' : 'hidden'}">${parsed.roman}</div>
      <div class="verse-english ${state.settings.showEnglish ? '' : 'hidden'}">${parsed.english}</div>
      <div class="verse-punjabi ${state.settings.showPunjabi ? '' : 'hidden'}">${parsed.punjabi}</div>
    `;

        return el;
    }

    /**
     * Create section divider - ONLY for Banis that need it
     */
    function createSectionDivider(headerType) {
        const el = document.createElement('div');
        el.className = 'section-divider';

        // Map header types to proper names
        const names = {
            1: 'ਛੰਦ',
            2: 'ਸਵੈਯਾ',
            3: 'ਦੋਹਰਾ',
            4: 'ਚੌਪਈ',
            5: 'ਅੜਿੱਲ',
            6: 'ਭੁਜੰਗ ਪ੍ਰਯਾਤ'
        };

        const name = names[headerType] || `Section ${headerType}`;
        el.innerHTML = `<span>${name}</span>`;

        return el;
    }

    // ═══════════════════════════════════════════════════════════════
    // DISPLAY TOGGLES
    // ═══════════════════════════════════════════════════════════════

    function toggleDisplay(type) {
        const key = `show${type.charAt(0).toUpperCase() + type.slice(1)}`;
        state.settings[key] = !state.settings[key];
        updateVisibility();
        updateToggleButtons();
        saveSettings();
    }

    function updateVisibility() {
        document.querySelectorAll('.verse-gurmukhi').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showGurmukhi);
        });
        document.querySelectorAll('.verse-roman').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showRoman);
        });
        document.querySelectorAll('.verse-english').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showEnglish);
        });
        document.querySelectorAll('.verse-punjabi').forEach(el => {
            el.classList.toggle('hidden', !state.settings.showPunjabi);
        });
    }

    function updateToggleButtons() {
        if (els.toggleGurmukhi) {
            els.toggleGurmukhi.dataset.active = state.settings.showGurmukhi;
            els.toggleGurmukhi.classList.toggle('active', state.settings.showGurmukhi);
        }
        if (els.toggleRoman) {
            els.toggleRoman.dataset.active = state.settings.showRoman;
            els.toggleRoman.classList.toggle('active', state.settings.showRoman);
        }
        if (els.toggleEnglish) {
            els.toggleEnglish.dataset.active = state.settings.showEnglish;
            els.toggleEnglish.classList.toggle('active', state.settings.showEnglish);
        }
        if (els.togglePunjabi) {
            els.togglePunjabi.dataset.active = state.settings.showPunjabi;
            els.togglePunjabi.classList.toggle('active', state.settings.showPunjabi);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════

    function applySettings() {
        const root = document.documentElement;
        const s = state.settings;

        // Font size (unified)
        root.style.setProperty('--gurmukhi-size', `${s.fontSize}px`);
        root.style.setProperty('--roman-size', `${Math.round(s.fontSize * 0.65)}px`);
        root.style.setProperty('--translation-size', `${Math.round(s.fontSize * 0.57)}px`);

        // Line spacing
        root.style.setProperty('--line-spacing', s.lineSpacing);

        // Accent color
        root.style.setProperty('--accent', s.accentColor);

        // Theme (direct application - includes dark, light, sepia, amoled, gold)
        root.setAttribute('data-theme', s.theme);

        // Text alignment
        document.querySelectorAll('.verse').forEach(el => {
            el.style.textAlign = s.textAlign;
        });

        // Paragraph mode
        if (els.versesContainer) {
            els.versesContainer.classList.toggle('paragraph-mode', s.paragraphMode);
        }

        // Update toggles
        updateToggleButtons();
        updateSettingsUI();
    }

    function updateSettingsUI() {
        const s = state.settings;

        // Font size slider
        if (els.fontSizeSlider) {
            els.fontSizeSlider.value = s.fontSize;
            updateSliderProgress(els.fontSizeSlider);
        }
        if (els.fontSizeValue) {
            els.fontSizeValue.textContent = `${s.fontSize}pt`;
        }

        // Font family
        if (els.fontFamilySelect) {
            els.fontFamilySelect.value = s.fontFamily;
        }

        // Line spacing slider
        if (els.lineSpacingSlider) {
            els.lineSpacingSlider.value = s.lineSpacing * 10;
            updateSliderProgress(els.lineSpacingSlider);
        }
        if (els.lineSpacingValue) {
            els.lineSpacingValue.textContent = s.lineSpacing.toFixed(1);
        }

        // Text alignment
        document.querySelectorAll('#textAlignmentControl .segment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === s.textAlign);
        });

        // Theme pills
        document.querySelectorAll('.theme-pill').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === s.theme);
        });

        // AMOLED toggle
        if (els.amoledToggle) {
            els.amoledToggle.setAttribute('aria-checked', s.amoled);
            els.amoledToggle.classList.toggle('active', s.amoled);
        }

        // Accent colors
        document.querySelectorAll('.color-dot').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === s.accentColor);
        });

        // Translation toggle
        if (els.translationToggle) {
            els.translationToggle.setAttribute('aria-checked', s.showTranslation);
            els.translationToggle.classList.toggle('active', s.showTranslation);
        }

        // Translation language
        if (els.translationLangSelect) {
            els.translationLangSelect.value = s.translationLang;
        }

        // Transliteration toggle
        if (els.transliterationToggle) {
            els.transliterationToggle.setAttribute('aria-checked', s.showTransliteration);
            els.transliterationToggle.classList.toggle('active', s.showTransliteration);
        }

        // Larivaar toggle
        if (els.larivaarToggle) {
            els.larivaarToggle.setAttribute('aria-checked', s.larivaar);
            els.larivaarToggle.classList.toggle('active', s.larivaar);
        }

        // Wake lock toggle
        if (els.wakeLockToggle) {
            els.wakeLockToggle.setAttribute('aria-checked', s.wakeLock);
            els.wakeLockToggle.classList.toggle('active', s.wakeLock);
        }

        // Auto-play toggle
        if (els.autoPlayToggle) {
            els.autoPlayToggle.setAttribute('aria-checked', s.autoPlay);
            els.autoPlayToggle.classList.toggle('active', s.autoPlay);
        }

        // Playback speed
        if (els.playbackSpeedSelect) {
            els.playbackSpeedSelect.value = s.playbackSpeed;
        }

        // Paragraph mode toggle
        if (els.paragraphModeToggle) {
            els.paragraphModeToggle.setAttribute('aria-checked', s.paragraphMode);
            els.paragraphModeToggle.classList.toggle('active', s.paragraphMode);
        }
    }

    function updateSliderProgress(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const progress = ((val - min) / (max - min)) * 100;
        slider.style.setProperty('--slider-progress', `${progress}%`);
    }

    function adjustSize(target, action) {
        const limits = {
            gurmukhi: { min: 18, max: 52 },
            roman: { min: 12, max: 32 },
            translation: { min: 12, max: 28 }
        };

        const key = `${target}Size`;
        const limit = limits[target];
        if (!limit) return;

        const step = 2;

        if (action === 'increase' && state.settings[key] < limit.max) {
            state.settings[key] += step;
        } else if (action === 'decrease' && state.settings[key] > limit.min) {
            state.settings[key] -= step;
        }

        applySettings();
        saveSettings();
    }

    function setTheme(theme) {
        state.settings.theme = theme;
        localStorage.setItem('nitnem_theme', theme);
        applySettings();
        saveSettings();
    }

    function resetSettings() {
        state.settings = { ...DEFAULTS };
        applySettings();
        saveSettings();
        closeSettings();
    }

    function saveSettings() {
        try {
            localStorage.setItem('nitnem_reader_settings', JSON.stringify(state.settings));
        } catch (e) {
            console.warn('Could not save settings');
        }
    }

    function loadSettings() {
        try {
            // Load theme first
            const savedTheme = localStorage.getItem('nitnem_theme');
            if (savedTheme) {
                state.settings.theme = savedTheme;
            }

            // Load other settings
            const saved = localStorage.getItem('nitnem_reader_settings');
            if (saved) {
                state.settings = { ...DEFAULTS, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Could not load settings');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // WAKE LOCK
    // ═══════════════════════════════════════════════════════════════

    async function toggleWakeLock() {
        if (!('wakeLock' in navigator)) {
            alert('Wake Lock not supported');
            return;
        }

        state.settings.wakeLock = !state.settings.wakeLock;

        if (state.settings.wakeLock) {
            try {
                state.wakeLockSentinel = await navigator.wakeLock.request('screen');
            } catch (e) {
                state.settings.wakeLock = false;
            }
        } else {
            if (state.wakeLockSentinel) {
                await state.wakeLockSentinel.release();
                state.wakeLockSentinel = null;
            }
        }

        updateSettingsUI();
        saveSettings();
    }

    // ═══════════════════════════════════════════════════════════════
    // PROGRESS & SCROLL (with scroll-hide header/toggles)
    // ═══════════════════════════════════════════════════════════════

    let lastScrollTop = 0;
    let scrollThreshold = 100;

    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

        if (els.progressBar) els.progressBar.style.width = `${progress}%`;
        if (els.progressText) els.progressText.textContent = `${progress}%`;

        // Scroll top button
        if (els.scrollTopBtn) {
            els.scrollTopBtn.classList.toggle('visible', scrollTop > 500);
        }

        // Scroll-hide header and toggles
        if (scrollTop > scrollThreshold) {
            const scrollingDown = scrollTop > lastScrollTop;

            if (scrollingDown) {
                // Hide header and toggles when scrolling down
                els.readerHeader?.classList.add('hidden');
                els.readerToggles?.classList.add('hidden');
                els.progressText?.classList.add('hidden');
            } else {
                // Show header and toggles when scrolling up
                els.readerHeader?.classList.remove('hidden');
                els.readerToggles?.classList.remove('hidden');
                els.progressText?.classList.remove('hidden');
            }
        } else {
            // Always show at top of page
            els.readerHeader?.classList.remove('hidden');
            els.readerToggles?.classList.remove('hidden');
            els.progressText?.classList.remove('hidden');
        }

        lastScrollTop = scrollTop;
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS PANEL
    // ═══════════════════════════════════════════════════════════════

    function openSettings() {
        state.isSettingsOpen = true;
        els.settingsOverlay?.classList.add('visible');
        els.settingsDrawer?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeSettings() {
        state.isSettingsOpen = false;
        els.settingsOverlay?.classList.remove('visible');
        els.settingsDrawer?.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOKMARK
    // ═══════════════════════════════════════════════════════════════

    function toggleBookmark() {
        let favorites = JSON.parse(localStorage.getItem('nitnem_favorites') || '[]');
        const exists = favorites.some(f => f.id === state.baniId);

        if (exists) {
            favorites = favorites.filter(f => f.id !== state.baniId);
            els.bookmarkBtn?.classList.remove('active');
        } else {
            favorites.push({
                id: state.baniId,
                name: state.baniMeta?.nameEnglish || 'Bani',
                timestamp: Date.now()
            });
            els.bookmarkBtn?.classList.add('active');
        }

        localStorage.setItem('nitnem_favorites', JSON.stringify(favorites));
    }

    function checkBookmark() {
        const favorites = JSON.parse(localStorage.getItem('nitnem_favorites') || '[]');
        const isFavorite = favorites.some(f => f.id === state.baniId);
        els.bookmarkBtn?.classList.toggle('active', isFavorite);
    }

    // ═══════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════

    function showLoading(msg) {
        if (els.loadingText) els.loadingText.textContent = msg;
        if (els.loadingOverlay) els.loadingOverlay.classList.remove('hidden');
        if (els.errorState) els.errorState.style.display = 'none';
    }

    function hideLoading() {
        if (els.loadingOverlay) els.loadingOverlay.classList.add('hidden');
    }

    function showError(msg) {
        if (els.loadingOverlay) els.loadingOverlay.style.display = 'none';
        if (els.errorState) els.errorState.style.display = 'flex';
        if (els.errorMessage) els.errorMessage.textContent = msg;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════

    function setupEvents() {
        // Progress
        window.addEventListener('scroll', updateProgress, { passive: true });

        // Scroll to top
        els.scrollTopBtn?.addEventListener('click', scrollToTop);

        // Settings panel
        els.settingsBtn?.addEventListener('click', openSettings);
        els.settingsClose?.addEventListener('click', closeSettings);
        els.settingsOverlay?.addEventListener('click', closeSettings);

        // Display toggles (header bar)
        els.toggleGurmukhi?.addEventListener('click', () => toggleDisplay('gurmukhi'));
        els.toggleRoman?.addEventListener('click', () => toggleDisplay('roman'));
        els.toggleEnglish?.addEventListener('click', () => toggleDisplay('english'));
        els.togglePunjabi?.addEventListener('click', () => toggleDisplay('punjabi'));

        // ═══════════════════════════════════════════════════════════
        // NEW: iOS Settings Controls
        // ═══════════════════════════════════════════════════════════

        // Font size slider
        els.fontSizeSlider?.addEventListener('input', (e) => {
            state.settings.fontSize = parseInt(e.target.value, 10);
            applySettings();
            saveSettings();
        });

        // Font family select
        els.fontFamilySelect?.addEventListener('change', (e) => {
            state.settings.fontFamily = e.target.value;
            applySettings();
            saveSettings();
        });

        // Line spacing slider
        els.lineSpacingSlider?.addEventListener('input', (e) => {
            state.settings.lineSpacing = parseFloat(e.target.value) / 10;
            applySettings();
            saveSettings();
        });

        // Text alignment segmented control
        document.querySelectorAll('#textAlignmentControl .segment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.settings.textAlign = btn.dataset.value;
                applySettings();
                saveSettings();
            });
        });

        // Theme pills
        document.querySelectorAll('.theme-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                state.settings.theme = btn.dataset.theme;
                localStorage.setItem('nitnem_theme', btn.dataset.theme);
                applySettings();
                saveSettings();
            });
        });

        // AMOLED toggle
        els.amoledToggle?.addEventListener('click', () => {
            state.settings.amoled = !state.settings.amoled;
            applySettings();
            saveSettings();
        });

        // Accent color picker
        document.querySelectorAll('.color-dot').forEach(btn => {
            btn.addEventListener('click', () => {
                state.settings.accentColor = btn.dataset.color;
                applySettings();
                saveSettings();
            });
        });

        // Translation toggle
        els.translationToggle?.addEventListener('click', () => {
            state.settings.showTranslation = !state.settings.showTranslation;
            state.settings.showEnglish = state.settings.showTranslation;
            updateVisibility();
            applySettings();
            saveSettings();
        });

        // Translation language
        els.translationLangSelect?.addEventListener('change', (e) => {
            state.settings.translationLang = e.target.value;
            saveSettings();
        });

        // Transliteration toggle
        els.transliterationToggle?.addEventListener('click', () => {
            state.settings.showTransliteration = !state.settings.showTransliteration;
            state.settings.showRoman = state.settings.showTransliteration;
            updateVisibility();
            applySettings();
            saveSettings();
        });

        // Larivaar toggle
        els.larivaarToggle?.addEventListener('click', () => {
            state.settings.larivaar = !state.settings.larivaar;
            applySettings();
            saveSettings();
            // TODO: Re-render verses in larivaar mode
        });

        // Paragraph mode toggle
        els.paragraphModeToggle?.addEventListener('click', () => {
            state.settings.paragraphMode = !state.settings.paragraphMode;
            applySettings();
            saveSettings();
        });

        // Wake lock toggle
        els.wakeLockToggle?.addEventListener('click', toggleWakeLock);

        // Auto-play toggle
        els.autoPlayToggle?.addEventListener('click', () => {
            state.settings.autoPlay = !state.settings.autoPlay;
            applySettings();
            saveSettings();
        });

        // Playback speed
        els.playbackSpeedSelect?.addEventListener('change', (e) => {
            state.settings.playbackSpeed = parseFloat(e.target.value);
            saveSettings();
        });

        // Download for offline
        els.downloadOfflineBtn?.addEventListener('click', async () => {
            els.downloadOfflineBtn.disabled = true;
            els.downloadOfflineBtn.querySelector('.action-label').textContent = 'Downloading...';
            try {
                // Cache the current Bani data
                if (state.baniData) {
                    localStorage.setItem(`bani_cache_${state.baniId}`, JSON.stringify(state.baniData));
                }
                els.downloadOfflineBtn.querySelector('.action-label').textContent = '✓ Saved!';
            } catch (e) {
                els.downloadOfflineBtn.querySelector('.action-label').textContent = 'Failed';
            }
            setTimeout(() => {
                els.downloadOfflineBtn.querySelector('.action-label').textContent = 'Download for Offline';
                els.downloadOfflineBtn.disabled = false;
            }, 2000);
        });

        // Clear history
        els.clearHistoryBtn?.addEventListener('click', () => {
            if (confirm('Clear all reading history?')) {
                localStorage.removeItem('nitnemHub_state');
                els.clearHistoryBtn.querySelector('.action-label').textContent = '✓ Cleared!';
                setTimeout(() => {
                    els.clearHistoryBtn.querySelector('.action-label').textContent = 'Clear Reading History';
                }, 2000);
            }
        });

        // Bookmark
        els.bookmarkBtn?.addEventListener('click', toggleBookmark);

        // Reset
        els.resetBtn?.addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                resetSettings();
            }
        });

        // Retry
        els.retryBtn?.addEventListener('click', loadBani);

        // Read again
        els.readAgainBtn?.addEventListener('click', scrollToTop);

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isSettingsOpen) closeSettings();
        });

        // Check bookmark on load
        setTimeout(checkBookmark, 100);
    }

    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════

    document.addEventListener('DOMContentLoaded', init);
})();
