/**
 * Reader Engine - PURE iOS Experience
 * Apple-Level Design • Clean • Minimal
 * @version 5.0.0 - PURE iOS Edition
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // DEFAULTS
    // ═══════════════════════════════════════════════════════════════

    const DEFAULTS = {
        // General
        wakeLock: false,
        larivaar: false,
        larivaarAssist: false,
        continuousReading: false,
        paragraphMode: false,
        bestVersion: false,
        showVisraams: false,
        paperBackground: false,
        showTitles: true,
        hideGurmukhi: false,

        // Translation
        translationSize: 16,
        punjabiTranslation: false,
        englishTranslation: true,

        // Transliteration
        translitSize: 17,
        englishTranslit: true,
        hindiTranslit: false,
        shahmukhiTranslit: false,

        // Colors
        gurmukhiColorIdx: 0,
        translationColorIdx: 2,
        translitColorIdx: 2,

        // Font
        gurbaniFontSize: 28,
        fontFamily: 'noto',
        fontWeight: '500',
        textAlign: 'center',

        // Audio
        autoPlay: false,
        playbackSpeed: 1,

        // Display toggles - Gurmukhi only selected by default on first open
        showGurmukhi: true,
        showRoman: false,
        showEnglish: false,
        showPunjabi: false,

        // Backgrounds - both off (0) by default in light AND dark mode
        ikonkarTransparency: 0,
        orbsOpacity: 0
    };

    // Color Palette
    const COLOR_PALETTE = [
        'currentColor', // Default text
        '#D4AF37',      // Sacred Gold
        '#8E8E93',      // iOS Gray
        '#DC2626',      // Red
        '#F59E0B',      // Amber
        '#2E8B57',      // Green
        '#3B82F6',      // Blue
        '#8B5CF6',      // Purple
        '#EC4899',      // Pink
        '#000000',      // Black
        '#FFFFFF',      // White
    ];

    // Font Families
    const FONT_MAP = {
        'noto': "'Noto Sans Gurmukhi', sans-serif",
        'pg-serif': "'PG Serif', 'Noto Sans Gurmukhi', sans-serif",
        'mfjashan': "'MFJashan', 'Noto Sans Gurmukhi', sans-serif",
        'pg-khanna': "'PG Khanna', 'Noto Sans Gurmukhi', sans-serif",
        'pixel-r': "'Pixel R', 'Noto Sans Gurmukhi', sans-serif",
        'riyasti': "'RiyastiHastlikhat', 'Noto Sans Gurmukhi', sans-serif",
        'pg-muskan': "'PGMuskan', 'Noto Sans Gurmukhi', sans-serif"
    };

    // Font Display Names (User-friendly)
    const FONT_NAMES = {
        'noto': 'Gurmukhi Lipi',
        'pg-serif': 'Gurmukhi Font 1',
        'mfjashan': 'Gurmukhi Font 2',
        'pg-khanna': 'Gurmukhi Font 3',
        'pixel-r': 'Gurmukhi Font 4',
        'riyasti': 'Riyasti Hastlikhat',
        'pg-muskan': 'PG Muskan'
    };

    // Default font sizes (larger for non-Noto fonts)
    const FONT_SIZES = {
        'noto': 28,      // Noto Sans default
        'pg-serif': 36,  // Larger for handwritten fonts
        'mfjashan': 36,
        'pg-khanna': 34,
        'pixel-r': 34,
        'riyasti': 36,   // Handwritten style
        'pg-muskan': 36  // Handwritten style
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
        wakeLockSentinel: null,
        currentColorPicker: null,
        // My Pothi context
        isFromPothi: false,
        pothiOrder: [],
        nextBaniId: null,
        nextBaniMeta: null
    };

    // ═══════════════════════════════════════════════════════════════
    // DOM CACHE
    // ═══════════════════════════════════════════════════════════════

    const $ = (id) => document.getElementById(id);
    let els = {};

    function initElements() {
        els = {
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
            paperBackground: $('paperBackground'),
            ikonkarBackground: $('ikonkarBackground'),

            // Header
            readerHeader: document.querySelector('.reader-header'),
            readerToggles: document.querySelector('.reader-toggles'),
            settingsBtn: $('settingsBtn'),
            settingsOverlay: $('settingsOverlay'),
            settingsDrawer: $('settingsDrawer'),
            settingsCloseFloat: $('settingsCloseFloat'),
            bookmarkBtn: $('bookmarkBtn'),
            tickBtn: $('tickBtn'),
            readAgainBtn: $('readAgainBtn'),
            resetBtn: $('resetBtn'),

            // Display toggles
            toggleGurmukhi: $('toggleGurmukhi'),
            toggleRoman: $('toggleRoman'),
            toggleEnglish: $('toggleEnglish'),
            togglePunjabi: $('togglePunjabi'),

            // General
            wakeLockToggle: $('wakeLockToggle'),
            larivaarToggle: $('larivaarToggle'),
            larivaarAssistToggle: $('larivaarAssistToggle'),
            larivaarAssistRow: $('larivaarAssistRow'),
            larivaarAssistDivider: $('larivaarAssistDivider'),
            continuousReadingToggle: $('continuousReadingToggle'),
            paragraphModeToggle: $('paragraphModeToggle'),
            bestVersionToggle: $('bestVersionToggle'),
            showVisraamsToggle: $('showVisraamsToggle'),
            paperBackgroundToggle: $('paperBackgroundToggle'),
            showTitlesToggle: $('showTitlesToggle'),
            hideGurmukhiToggle: $('hideGurmukhiToggle'),

            // Translation
            translationSizeValue: $('translationSizeValue'),
            punjabiTranslationToggle: $('punjabiTranslationToggle'),
            englishTranslationToggle: $('englishTranslationToggle'),

            // Transliteration
            translitSizeValue: $('translitSizeValue'),
            englishTranslitToggle: $('englishTranslitToggle'),
            hindiTranslitToggle: $('hindiTranslitToggle'),
            shahmukhiTranslitToggle: $('shahmukhiTranslitToggle'),

            // Colors
            gurmukhiColor: $('gurmukhiColor'),
            translationColor: $('translationColor'),
            translitColor: $('translitColor'),
            longVisraamColor: $('longVisraamColor'),
            shortVisraamColor: $('shortVisraamColor'),
            larivaarAssistColor: $('larivaarAssistColor'),
            backgroundColor: $('backgroundColor'),

            // Font
            fontPreview: $('fontPreview'),
            gurbaniFontSizeValue: $('gurbaniFontSizeValue'),
            fontFamilySelect: $('fontFamilySelect'),
            fontWeightSelect: $('fontWeightSelect'),
            textAlignSelect: $('textAlignSelect'),

            // Audio
            autoPlayToggle: $('autoPlayToggle'),
            playbackSpeedSelect: $('playbackSpeedSelect'),

            // Data
            downloadOfflineBtn: $('downloadOfflineBtn'),
            clearHistoryBtn: $('clearHistoryBtn'),

            // Ik Onkar Background
            ikonkarTransparency: $('ikonkarTransparency'),
            transparencyValue: $('transparencyValue'),

            // Orbs Background
            orbsOpacitySlider: $('orbsOpacitySlider'),
            orbsOpacityValue: $('orbsOpacityValue'),

            // Color Picker
            colorPickerModal: $('colorPickerModal'),
            pickerTitle: $('pickerTitle'),
            pickerColors: $('pickerColors'),
            pickerClose: $('pickerClose')
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    async function init() {
        console.log('🙏 ANHAD Reader v5.0 - PURE iOS');

        initElements();

        const params = new URLSearchParams(window.location.search);
        state.baniId = parseInt(params.get('id'), 10);

        if (!state.baniId || isNaN(state.baniId)) {
            showError('Invalid Bani ID');
            return;
        }

        // Check if coming from My Pothi
        state.isFromPothi = params.get('from') === 'pothi';
        if (state.isFromPothi) {
            try {
                const saved = localStorage.getItem('anhad_my_pothi');
                if (saved) state.pothiOrder = JSON.parse(saved);
            } catch (e) { state.pothiOrder = []; }
        }

        state.baniMeta = typeof getBaniMeta === 'function' ? getBaniMeta(state.baniId) : null;

        loadSettings();
        applyAllSettings();
        setupEvents();
        
        // Show skeleton immediately for perceived speed
        showSkeleton();
        
        await loadBani();

        // Setup Next Bani for My Pothi
        if (state.isFromPothi) {
            setupNextBani();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD BANI — Offline-first: Try IndexedDB, then API, then Local Data
    // ═══════════════════════════════════════════════════════════════

    async function loadBani() {
        try {
            let data = null;
            let loadedFromCache = false;

            // 1. Try BaniCacheOptimizer first (fastest - memory + IndexedDB)
            if (window.baniCacheOptimizer) {
                try {
                    data = await window.baniCacheOptimizer.getBani(state.baniId);
                    if (data && data.verses && data.verses.length > 0) {
                        console.log('[ReaderEngine] ⚡ Loaded from cache:', state.baniId);
                        loadedFromCache = true;
                    }
                } catch (e) {
                    console.warn('[ReaderEngine] Cache failed, trying fallback:', e);
                }
            }

            // 2. Fallback to gurbaniLocalDB
            if (!data && window.gurbaniLocalDB) {
                const cached = await window.gurbaniLocalDB.getBani(state.baniId);
                if (cached && cached.verses && cached.verses.length > 0) {
                    console.log('[ReaderEngine] ✓ Loaded from gurbaniLocalDB:', state.baniId);
                    data = {
                        verses: cached.verses,
                        baniInfo: { unicode: cached.name, transliteration: cached.name }
                    };
                    loadedFromCache = true;
                }
            }

            // 3. Try API (BaniDB)
            if (!data) {
                console.log('[ReaderEngine] 🌐 Fetching from API:', state.baniId);
                try {
                    data = await BaniDB.getBani(state.baniId);
                    
                    // Save to both cache systems for future use
                    if (data && data.verses) {
                        const meta = state.baniMeta || {};
                        
                        // Save to BaniCacheOptimizer
                        if (window.baniCacheOptimizer) {
                            await window.baniCacheOptimizer.cacheBani(state.baniId, data);
                        }
                        
                        // Save to gurbaniLocalDB
                        if (window.gurbaniLocalDB) {
                            await window.gurbaniLocalDB.saveBani(
                                state.baniId, 
                                meta.name || meta.nameEnglish || 'Bani', 
                                data.verses
                            );
                        }
                        
                        console.log('[ReaderEngine] ✓ Cached for future use');
                    }
                } catch (apiError) {
                    console.warn('[ReaderEngine] API failed, checking local fallback:', apiError);
                    // 4. Final fallback: Check LocalBaniData for missing Banis
                    if (typeof LocalBaniData !== 'undefined' && LocalBaniData[state.baniId]) {
                        console.log('[ReaderEngine] Using LocalBaniData fallback for ID:', state.baniId);
                        data = LocalBaniData[state.baniId];
                    } else {
                        throw apiError; // Re-throw if no local data either
                    }
                }
            }

            state.baniData = data;

            if (!data) {
                throw new Error(`Bani ${state.baniId} could not be loaded. Please check your connection and try again.`);
            }

            if (!data.verses || data.verses.length === 0) {
                throw new Error('No verses found for this Bani');
            }

            updateHeader(data);
            
            // Render ALL verses immediately to prevent disappearing panktis during scroll
            hideSkeleton();
            renderVerses(data.verses);
            renderInfo(data);

            hideLoading();
            els.readerApp.style.display = 'block';
            els.readerEnd.style.display = 'block';

            checkBookmark();
            checkNitnemTick();

        } catch (error) {
            console.error('Load failed:', error);
            hideSkeleton();
            showError(error.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SKELETON UI — Instant visual feedback
    // ═══════════════════════════════════════════════════════════════

    function showSkeleton() {
        const skeleton = document.getElementById('skeletonContainer');
        if (skeleton) skeleton.style.display = 'block';
        // Also show the app immediately so users see structure
        if (els.readerApp) els.readerApp.style.display = 'block';
    }

    function hideSkeleton() {
        const skeleton = document.getElementById('skeletonContainer');
        if (skeleton) {
            skeleton.style.opacity = '0';
            skeleton.style.transition = 'opacity 0.3s ease';
            setTimeout(() => { skeleton.style.display = 'none'; }, 300);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MY POTHI — Next Bani Setup
    // ═══════════════════════════════════════════════════════════════

    // Bani database for name lookup (matches my-pothi.html)
    const ALL_BANIS_LOOKUP = [
        { id: 2, name: 'ਜਪੁਜੀ ਸਾਹਿਬ', english: 'Japji Sahib Ji', icon: '🌅' },
        { id: 4, name: 'ਜਾਪੁ ਸਾਹਿਬ', english: 'Jaap Sahib Ji', icon: '⚔️' },
        { id: 6, name: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ', english: 'Tav Prasad Savaiye', icon: '🙏' },
        { id: 7, name: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ (ਦੀਨਨ ਕੀ)', english: 'Tav Prasad Savaiye (Deenan Ki)', icon: '🙏' },
        { id: 9, name: 'ਬੇਨਤੀ ਚੌਪਈ ਸਾਹਿਬ', english: 'Chaupai Sahib Ji', icon: '🛡️' },
        { id: 10, name: 'ਅਨੰਦੁ ਸਾਹਿਬ', english: 'Anand Sahib Ji', icon: '😊' },
        { id: 21, name: 'ਰਹਿਰਾਸਿ ਸਾਹਿਬ', english: 'Rehras Sahib Ji', icon: '🌇' },
        { id: 23, name: 'ਸੋਹਿਲਾ ਸਾਹਿਬ', english: 'Kirtan Sohila', icon: '🌙' },
        { id: 24, name: 'ਅਰਦਾਸ', english: 'Ardas', icon: '🙏' },
        { id: 31, name: 'ਸੁਖਮਨੀ ਸਾਹਿਬ', english: 'Sukhmani Sahib Ji', icon: '🕊️' },
        { id: 90, name: 'ਆਸਾ ਦੀ ਵਾਰ', english: 'Asa Di Vaar', icon: '☀️' },
        { id: 36, name: 'ਦੁਖ ਭੰਜਨੀ ਸਾਹਿਬ', english: 'Dukh Bhanjani Sahib Ji', icon: '💚' },
        { id: 3, name: 'ਸ਼ਬਦ ਹਜ਼ਾਰੇ', english: 'Shabad Hazare', icon: '💎' },
        { id: 27, name: 'ਬਾਰਹ ਮਾਹਾ', english: 'Barah Maha', icon: '📅' },
        { id: 30, name: 'ਸਲੋਕ ਮਹਲਾ ੯', english: 'Salok Mahalla 9', icon: '📜' },
        { id: 22, name: 'ਆਰਤੀ', english: 'Aarti', icon: '🪔' },
        { id: 11, name: 'ਲਾਵਾਂ', english: 'Lavan', icon: '💍' },
        { id: 33, name: 'ਬਾਵਨ ਅਖਰੀ', english: 'Bavan Akhri', icon: '📖' },
        { id: 34, name: 'ਸਿਧ ਗੋਸਟਿ', english: 'Sidh Gosht', icon: '🧘' },
        { id: 35, name: 'ਦਖਣੀ ਓਅੰਕਾਰੁ', english: 'Dakhni Oankar', icon: '🕉️' },
        { id: 32, name: 'ਸੁਖਮਨਾ ਸਾਹਿਬ', english: 'Sukhmana Sahib Ji', icon: '🕊️' },
        { id: 38, name: 'ਰਾਗ ਮਾਲਾ', english: 'Raag Mala', icon: '🎵' },
        { id: 77, name: 'ਸਲੋਕ ਭਗਤ ਕਬੀਰ ਜੀ', english: 'Salok Bhagat Kabir Ji', icon: '📿' },
        { id: 78, name: 'ਸਲੋਕ ਸੇਖ ਫਰੀਦ ਕੇ', english: 'Salok Sheikh Farid', icon: '🤲' },
        { id: 5, name: 'ਸ਼ਬਦ ਹਜ਼ਾਰੇ ਪਾਤਿਸ਼ਾਹੀ ੧੦', english: 'Shabad Hazare P10', icon: '💎' },
        { id: 8, name: 'ਬਚਿੱਤਰ ਨਾਟਕ', english: 'Bachittar Natak', icon: '📜' },
        { id: 12, name: 'ਜ਼ਫ਼ਰਨਾਮਾ', english: 'Zafarnama', icon: '✉️' },
        { id: 13, name: 'ਚੰਡੀ ਦੀ ਵਾਰ', english: 'Chandi Di Vaar', icon: '🗡️' },
        { id: 19, name: 'ਸ਼ਸਤ੍ਰ ਨਾਮ ਮਾਲਾ', english: 'Shastar Naam Mala', icon: '🔱' },
        { id: 28, name: 'ਚੰਡੀ ਚਰਿਤ੍ਰ', english: 'Chandi Charitra', icon: '⚔️' },
        { id: 29, name: 'ਅਕਾਲ ਉਸਤਤ', english: 'Akal Ustat', icon: '🌟' },
        { id: 53, name: 'ਉਗ੍ਰਦੰਤੀ', english: 'Ugardanti', icon: '🔥' },
    ];

    function setupNextBani() {
        if (!state.isFromPothi || state.pothiOrder.length === 0) return;

        const currentIdx = state.pothiOrder.indexOf(state.baniId);
        if (currentIdx === -1 || currentIdx >= state.pothiOrder.length - 1) return;

        const nextId = state.pothiOrder[currentIdx + 1];
        const nextBani = ALL_BANIS_LOOKUP.find(b => b.id === nextId);
        if (!nextBani) return;

        state.nextBaniId = nextId;
        state.nextBaniMeta = nextBani;

        // Show the Next Bani container
        const container = document.getElementById('nextBaniContainer');
        const nameEl = document.getElementById('nextBaniName');
        const iconEl = document.getElementById('nextBaniIcon');
        const btnEl = document.getElementById('nextBaniBtn');

        if (container && nameEl && iconEl && btnEl) {
            container.style.display = 'block';
            nameEl.textContent = nextBani.name;
            iconEl.textContent = nextBani.icon;
            btnEl.href = `reader.html?id=${nextId}&from=pothi`;
            console.log(`📖 Next Bani in Pothi: ${nextBani.english} (ID: ${nextId})`);
        }
    }

    function updateHeader(data) {
        const meta = state.baniMeta;
        const nameGurmukhi = meta?.nameGurmukhi || data.baniInfo?.unicode || 'ਬਾਣੀ';
        const nameEnglish = meta?.nameEnglish || data.baniInfo?.transliteration || 'Bani';

        els.readerTitle.innerHTML = `
            <span class="reader-gurmukhi">${escapeHtml(nameGurmukhi)}</span>
            <span class="reader-english">${escapeHtml(nameEnglish)}</span>
        `;

        document.title = `${nameEnglish} | ANHAD`;
    }

    function renderInfo(data) {
        const meta = state.baniMeta;
        const verseCount = data.verses?.length || 0;

        let info = `${verseCount} verses`;
        if (meta?.estimatedTime) {
            info += ` • ${meta.estimatedTime}`;
        }

        els.readerInfo.textContent = info;
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER VERSES
    // ═══════════════════════════════════════════════════════════════

    function renderVerses(verses) {
        els.versesContainer.innerHTML = '';

        const meta = state.baniMeta;
        let currentSection = null;

        verses.forEach((verseData, index) => {
            const parsed = parseVerse(verseData);

            if (meta?.showChhandType && state.settings.showTitles) {
                const header = verseData.header || verseData.verse?.header;
                if (header && header !== currentSection) {
                    currentSection = header;
                    els.versesContainer.appendChild(createSectionDivider(header));
                }
            }

            els.versesContainer.appendChild(createVerseElement(parsed, index));
        });

        applyModes();
        applyFontToVerses();
        updateVisibility();
    }

    // ═══════════════════════════════════════════════════════════════
    // PROGRESSIVE RENDERING — Chunked for speed
    // Renders first batch immediately, rest via requestIdleCallback
    // ═══════════════════════════════════════════════════════════════

    function renderVersesProgressive(verses) {
        els.versesContainer.innerHTML = '';

        const FIRST_CHUNK = 30; // Render first 30 verses immediately
        const CHUNK_SIZE = 40;  // Then 40 at a time
        const meta = state.baniMeta;
        let currentSection = null;

        // Build document fragment for first chunk
        const fragment = document.createDocumentFragment();
        const firstBatch = verses.slice(0, FIRST_CHUNK);

        firstBatch.forEach((verseData, index) => {
            const parsed = parseVerse(verseData);
            if (meta?.showChhandType && state.settings.showTitles) {
                const header = verseData.header || verseData.verse?.header;
                if (header && header !== currentSection) {
                    currentSection = header;
                    fragment.appendChild(createSectionDivider(header));
                }
            }
            fragment.appendChild(createVerseElement(parsed, index));
        });

        els.versesContainer.appendChild(fragment);
        applyModes();
        applyFontToVerses();
        updateVisibility();

        // Render remaining chunks asynchronously
        if (verses.length > FIRST_CHUNK) {
            let offset = FIRST_CHUNK;
            
            function renderNextChunk() {
                if (offset >= verses.length) return;
                
                const chunk = verses.slice(offset, offset + CHUNK_SIZE);
                const chunkFragment = document.createDocumentFragment();
                
                chunk.forEach((verseData, i) => {
                    const parsed = parseVerse(verseData);
                    if (meta?.showChhandType && state.settings.showTitles) {
                        const header = verseData.header || verseData.verse?.header;
                        if (header && header !== currentSection) {
                            currentSection = header;
                            chunkFragment.appendChild(createSectionDivider(header));
                        }
                    }
                    chunkFragment.appendChild(createVerseElement(parsed, offset + i));
                });

                els.versesContainer.appendChild(chunkFragment);
                applyFontToVerses();
                updateVisibility();

                offset += CHUNK_SIZE;
                
                if (offset < verses.length) {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(renderNextChunk, { timeout: 100 });
                    } else {
                        setTimeout(renderNextChunk, 16);
                    }
                }
            }

            if ('requestIdleCallback' in window) {
                requestIdleCallback(renderNextChunk, { timeout: 100 });
            } else {
                setTimeout(renderNextChunk, 50);
            }
        }
    }

    function parseVerse(verseData) {
        const verse = verseData.verse || verseData;

        let gurmukhi = '';
        if (verse.verse) {
            gurmukhi = typeof verse.verse === 'string' ? verse.verse : verse.verse.unicode || verse.verse.gurmukhi || '';
        } else {
            gurmukhi = verse.unicode || verse.gurmukhi || '';
        }

        // CRITICAL FIX: Clean up corrupted Unicode characters
        // Replace common encoding issues
        gurmukhi = cleanupCorruptedText(gurmukhi);

        let roman = '';
        const translit = verseData.transliteration || verse.transliteration;
        if (translit) {
            roman = typeof translit === 'string' ? translit : translit.english || translit.en || '';
        }

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

        let punjabi = '';
        if (translation?.pu) {
            const pu = translation.pu;
            if (typeof pu === 'string') {
                punjabi = pu;
            } else {
                for (const src of ['ss', 'bdb', 'ms', 'ft']) {
                    if (pu[src]) {
                        punjabi = typeof pu[src] === 'string' ? pu[src] : pu[src].unicode || pu[src].gurmukhi || '';
                        if (punjabi) break;
                    }
                }
            }
        }

        return { gurmukhi, roman, english, punjabi, visraam: verse.visraam };
    }

    // Clean up corrupted/malformed Unicode text
    function cleanupCorruptedText(text) {
        if (!text) return '';
        
        // Remove replacement characters (\uFFFD) and other common corruption
        text = text.replace(/\uFFFD/g, '');
        
        // Fix common Gurmukhi encoding issues
        const fixMap = {
            // Add space after ॥ if missing (simple character match)
            '॥ੴ': '॥ ੴ',
            '॥ਅ': '॥ ਅ',
            '॥ਆ': '॥ ਆ',
            '॥ਇ': '॥ ਇ',
            '॥ਸ': '॥ ਸ',
            '॥ਗ': '॥ ਗ',
            '॥ਹ': '॥ ਹ',
            '॥ਜ': '॥ ਜ',
            '॥ਨ': '॥ ਨ',
            '॥ਕ': '॥ ਕ',
            '॥ਪ': '॥ ਪ',
            '॥ਤ': '॥ ਤ',
            '॥ਮ': '॥ ਮ',
            '॥ਰ': '॥ ਰ',
            '॥ਧ': '॥ ਧ',
            '॥ਵ': '॥ ਵ',
            '॥ਦ': '॥ ਦ',
            '॥ਚ': '॥ ਚ',
            '॥ਬ': '॥ ਬ',
            // Fix doubled punctuation
            '॥॥': '॥'
        };
        
        Object.entries(fixMap).forEach(([pattern, replacement]) => {
            text = text.replace(new RegExp(pattern, 'g'), replacement);
        });
        
        // Remove zero-width characters
        text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
        
        // Trim extra whitespace
        text = text.trim().replace(/\s+/g, ' ');
        
        return text;
    }

    function createVerseElement(parsed, index) {
        const el = document.createElement('div');
        el.className = 'verse';
        el.style.animationDelay = `${Math.min(index * 0.03, 0.3)}s`;

        // SMART PAUDI + RAHAO DETECTION: Check if verse ends with paudi marker OR contains rahao
        // Paudi markers use Gurmukhi numbers: ॥੧॥ ॥੨॥ ॥੩॥ ॥੪॥ ॥੫॥ etc.
        // Rahao markers: ਰਹਾਉ (can be at start or end of verse)
        const paudiPattern = /॥[੦੧੨੩੪੫੬੭੮੯]+॥\s*$/;
        const rahaoPattern = /ਰਹਾਉ/;
        
        if (paudiPattern.test(parsed.gurmukhi) || rahaoPattern.test(parsed.gurmukhi)) {
            el.classList.add('paudi-end');
            const marker = rahaoPattern.test(parsed.gurmukhi) ? 'Rahao' : 'Paudi';
            console.log(`[${marker} detected]:`, parsed.gurmukhi.slice(-20));
        }

        // SMART HEADING DETECTION
        // 1. Ik Onkar lines: ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥
        const ikOnkarPattern = /^੧ਓ|^ੴ/;
        
        // 2. Raag headings: Must have ਰਾਗੁ at START and be short (< 50 chars)
        const raagPattern = /^ਰਾਗੁ\s/;
        
        // 3. Mahala headings: Must have ਮਹਲਾ and be short (< 60 chars), not in middle of long verse
        const mahalaPattern = /ਮਹਲਾ\s*[੦੧੨੩੪੫੬੭੮੯]/;
        
        // 4. Other heading markers that are typically at START
        // FIXED: Changed ਵਾਰ to more specific pattern to avoid false matches like "ਵਾਰਿਆ ਨ ਜਾਵਾ"
        // Added ਅਸਟਪਦੀ (Asht Padi - Sukhmani Sahib) and ਭੁਜੰਗ (Bhujang Prayat - Jaap Sahib)
        const otherHeadingPattern = /^(ਛੰਦ|ਸਲੋਕੁ|ਪਉੜੀ|ਚੌਪਈ|ਦੋਹਰਾ|ਸਵੱਯੇ|ਅਸਟਪਦੀ|ਭੁਜੰਗ\s*ਪ੍ਰਯਾਤ)/;
        
        // 5. Special case: "ਵਾਰ" ONLY when it's at START and followed by specific patterns (not part of a sentence)
        // This catches "ਵਾਰ ਰਾਗ" etc. but NOT "ਵਾਰਿਆ ਨ ਜਾਵਾ"
        const vaarHeadingPattern = /^ਵਾਰ\s+(ਰਾਗ|ਸਾਰੰਗ|ਮਾਰੂ|ਆਸਾ|ਗੂਜਰੀ|ਸੋਰਠਿ)/;
        
        // 6. EXCLUDE: Bani titles (like "ਜਪੁਜੀ ਸਾਹਿਬ", "ਜਾਪੁ ਸਾਹਿਬ") - these are NOT headings
        const baniTitlePattern = /(ਜਪੁਜੀ|ਜਾਪੁ|ਅਨੰਦੁ|ਰਹਿਰਾਸਿ|ਸੋਹਿਲਾ|ਸੁਖਮਨੀ)\s+(ਸਾਹਿਬ|ਸਾਹਿਬੁ)/;
        
        // 7. EXCLUDE: Verses containing "ਵਾਰਿਆ" (this is NOT a heading, it's part of verse content)
        const falseVaarPattern = /ਵਾਰਿਆ/;
        
        const isShortVerse = parsed.gurmukhi.length < 60;
        const isVeryShort = parsed.gurmukhi.length < 40;
        const isBaniTitle = baniTitlePattern.test(parsed.gurmukhi);
        const isFalseVaar = falseVaarPattern.test(parsed.gurmukhi);
        
        if (
            !isBaniTitle && // EXCLUDE bani titles
            !isFalseVaar && // EXCLUDE false "ਵਾਰ" matches like "ਵਾਰਿਆ ਨ ਜਾਵਾ"
            (
                ikOnkarPattern.test(parsed.gurmukhi) || // Ik Onkar
                raagPattern.test(parsed.gurmukhi) || // Raag
                (mahalaPattern.test(parsed.gurmukhi) && isShortVerse) || // Mahala (only if short)
                (otherHeadingPattern.test(parsed.gurmukhi) && isVeryShort) || // Other headings (very short only)
                (vaarHeadingPattern.test(parsed.gurmukhi) && isVeryShort) // Vaar headings (specific patterns only)
            )
        ) {
            el.classList.add('verse-heading');
            console.log('[Heading detected]:', parsed.gurmukhi);
        }

        // Get current font class
        const fontClass = `font-${state.settings.fontFamily}`;

        // Apply Larivaar or Visraam highlighting
        let gurmukhiHTML = '';
        if (state.settings.larivaar) {
            if (state.settings.larivaarAssist) {
                gurmukhiHTML = applyLarivaarAssist(parsed.gurmukhi);
            } else {
                gurmukhiHTML = escapeHtml(parsed.gurmukhi.replace(/\s+/g, ''));
            }
        } else if (state.settings.showVisraams) {
            gurmukhiHTML = applyVisraams(parsed.gurmukhi, parsed.visraam);
        } else {
            gurmukhiHTML = escapeHtml(parsed.gurmukhi);
        }

        el.innerHTML = `
            <div class="verse-gurmukhi ${fontClass}">${gurmukhiHTML}</div>
            <div class="verse-roman">${escapeHtml(parsed.roman)}</div>
            <div class="verse-english">${escapeHtml(parsed.english)}</div>
            <div class="verse-punjabi">${escapeHtml(parsed.punjabi)}</div>
        `;

        return el;
    }

    function applyVisraams(gurmukhiText, visraamObj) {
        if (!visraamObj) return escapeHtml(gurmukhiText);

        let visraamArray = null;
        for (const src of ['ss', 'bdb', 'ms', 'ft']) {
            if (visraamObj[src] && Array.isArray(visraamObj[src])) {
                visraamArray = visraamObj[src];
                break;
            }
        }

        if (!visraamArray || visraamArray.length === 0) {
            return escapeHtml(gurmukhiText);
        }

        const words = gurmukhiText.split(/\s+/);
        const visraamMap = {};
        visraamArray.forEach(v => {
            if (v.p !== undefined) {
                visraamMap[v.p] = v.t || 'y';
            }
        });

        let result = '';
        words.forEach((word, idx) => {
            const escapedWord = escapeHtml(word);
            const pauseType = visraamMap[idx];

            if (pauseType) {
                if (pauseType === 'y' || pauseType === 'v') {
                    result += `<span class="visraam-long">${escapedWord}</span>`;
                } else {
                    result += `<span class="visraam-short">${escapedWord}</span>`;
                }
            } else {
                result += escapedWord;
            }

            if (idx < words.length - 1) {
                result += ' ';
            }
        });

        return result;
    }

    function applyLarivaarAssist(text) {
        const words = text.split(/\s+/);
        let result = '';
        words.forEach((word, i) => {
            const escapedWord = escapeHtml(word);
            if (i % 2 === 1) {
                result += `<span class="word-alt">${escapedWord}</span>`;
            } else {
                result += escapedWord;
            }
        });
        return result;
    }

    function createSectionDivider(headerType) {
        const el = document.createElement('div');
        el.className = 'section-divider';

        const names = { 1: 'ਛੰਦ', 2: 'ਸਵੈਯਾ', 3: 'ਦੋਹਰਾ', 4: 'ਚੌਪਈ', 5: 'ਅੜਿੱਲ', 6: 'ਭੁਜੰਗ ਪ੍ਰਯਾਤ' };
        el.innerHTML = `<span>${names[headerType] || `Section ${headerType}`}</span>`;

        return el;
    }

    // ═══════════════════════════════════════════════════════════════
    // APPLY FONT TO ALL VERSES (Direct Style Application)
    // ═══════════════════════════════════════════════════════════════

    function applyFontToVerses() {
        const fontKey = state.settings.fontFamily || 'noto';
        const fontFamily = FONT_MAP[fontKey] || FONT_MAP.noto;
        const fontWeight = state.settings.fontWeight || '500';
        const fontSize = state.settings.gurbaniFontSize || 28;
        const textAlign = state.settings.textAlign || 'center';

        // Update CSS custom properties for font (works on deployed version too)
        const root = document.documentElement;
        root.style.setProperty('--font-gurmukhi', fontFamily);
        root.style.setProperty('--gurmukhi-size', `${fontSize}px`);
        root.style.setProperty('--font-weight', fontWeight);
        
        // CRITICAL FIX: Set text-align as CSS variable so Best Version mode can use it
        root.style.setProperty('--text-align', textAlign);

        document.querySelectorAll('.verse-gurmukhi').forEach(el => {
            // Remove all font classes first
            el.classList.remove('font-noto', 'font-pg-serif', 'font-mfjashan', 'font-pg-khanna', 'font-pixel-r', 'font-riyasti', 'font-pg-muskan');

            // Add current font class
            el.classList.add(`font-${fontKey}`);

            // CRITICAL FIX: Don't use cssText or individual styles - use CSS class
            // This ensures settings work on both localhost and deployed version
        });

        // Apply text alignment directly to verses (for non-Best Version modes)
        document.querySelectorAll('.verse').forEach(el => {
            el.style.textAlign = textAlign;
        });

        // Update font preview
        const preview = document.querySelector('.font-preview-text');
        if (preview) {
            preview.style.fontFamily = fontFamily;
            preview.style.fontWeight = fontWeight;
            preview.style.fontSize = `${fontSize}px`;
        }

        // Update font select value
        if (els.fontFamilySelect) {
            els.fontFamilySelect.value = fontKey;
        }
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
        const s = state.settings;

        document.querySelectorAll('.verse-gurmukhi').forEach(el => {
            el.classList.toggle('hidden', !s.showGurmukhi || s.hideGurmukhi);
        });
        document.querySelectorAll('.verse-roman').forEach(el => {
            el.classList.toggle('hidden', !s.showRoman || !s.englishTranslit);
        });
        document.querySelectorAll('.verse-english').forEach(el => {
            el.classList.toggle('hidden', !s.showEnglish);
        });
        // Punjabi: only check showPunjabi toggle (punjabiTranslation is a secondary setting in the drawer)
        document.querySelectorAll('.verse-punjabi').forEach(el => {
            el.classList.toggle('hidden', !s.showPunjabi);
        });
    }

    function updateToggleButtons() {
        const s = state.settings;

        if (els.toggleGurmukhi) {
            els.toggleGurmukhi.classList.toggle('active', s.showGurmukhi);
        }
        if (els.toggleRoman) {
            els.toggleRoman.classList.toggle('active', s.showRoman);
        }
        if (els.toggleEnglish) {
            els.toggleEnglish.classList.toggle('active', s.showEnglish);
        }
        if (els.togglePunjabi) {
            els.togglePunjabi.classList.toggle('active', s.showPunjabi);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // IK ONKAR BACKGROUND TRANSPARENCY
    // ═══════════════════════════════════════════════════════════════

    function updateIkonkarBackground() {
        const opacity = state.settings.ikonkarTransparency / 100;
        
        if (els.ikonkarBackground) {
            // CRITICAL FIX: Set opacity directly on element
            els.ikonkarBackground.style.opacity = opacity.toString();
            els.ikonkarBackground.style.display = 'block';
            els.ikonkarBackground.style.visibility = 'visible';
            
            if (opacity > 0) {
                els.ikonkarBackground.classList.remove('hidden');
            }

            // Ensure image loads properly
            const img = els.ikonkarBackground.querySelector('img');
            if (img) {
                // Force image reload if src is not set
                if (!img.src || img.src === window.location.href) {
                    img.src = '../assets/icons/bg-nitnem.jpg';
                }
                // Check if image exists
                img.onerror = function() {
                    console.error('❌ Ik Onkar background image not found at: ../assets/icons/bg-nitnem.jpg');
                };
                img.onload = function() {
                    console.log('✅ Ik Onkar background image loaded successfully');
                };
            }
            
            console.log(`🖼️ Ik Onkar background opacity set to: ${opacity} (${state.settings.ikonkarTransparency}%)`);
        }
        
        if (els.ikonkarTransparency) {
            els.ikonkarTransparency.value = state.settings.ikonkarTransparency;
        }
        if (els.transparencyValue) {
            els.transparencyValue.textContent = `${state.settings.ikonkarTransparency}%`;
        }
    }

    function updateOrbsBackground() {
        const orbs = document.querySelector('.bg-orbs');
        if (orbs) {
            const opacity = (state.settings.orbsOpacity ?? 0) / 100;
            orbs.style.opacity = opacity;
        }
        if (els.orbsOpacitySlider) {
            els.orbsOpacitySlider.value = state.settings.orbsOpacity ?? 0;
        }
        if (els.orbsOpacityValue) {
            els.orbsOpacityValue.textContent = `${state.settings.orbsOpacity ?? 0}%`;
        }
    }

    function setIkonkarTransparency(value) {
        const newValue = parseInt(value, 10);
        if (isNaN(newValue) || newValue < 0 || newValue > 100) {
            console.warn('Invalid Ik Onkar transparency value:', value);
            return;
        }
        state.settings.ikonkarTransparency = newValue;
        console.log('🎚️ Ik Onkar transparency changed to:', newValue);
        updateIkonkarBackground();
        saveSettings();
    }

    // ═══════════════════════════════════════════════════════════════
    // APPLY ALL SETTINGS
    // ═══════════════════════════════════════════════════════════════

    function applyAllSettings() {
        const root = document.documentElement;
        const s = state.settings;

        // Font sizes
        root.style.setProperty('--gurmukhi-size', `${s.gurbaniFontSize}px`);
        root.style.setProperty('--translation-size', `${s.translationSize}px`);
        root.style.setProperty('--roman-size', `${s.translitSize}px`);
        root.style.setProperty('--font-weight', s.fontWeight);
        root.style.setProperty('--line-spacing', '1.8');

        // Text Colors
        const gColor = COLOR_PALETTE[s.gurmukhiColorIdx] || 'currentColor';
        const tColor = COLOR_PALETTE[s.translationColorIdx] || 'currentColor';
        const rColor = COLOR_PALETTE[s.translitColorIdx] || 'currentColor';

        if (gColor !== 'currentColor') {
            root.style.setProperty('--gurmukhi-text-color', gColor);
        } else {
            root.style.removeProperty('--gurmukhi-text-color');
        }

        if (tColor !== 'currentColor') {
            root.style.setProperty('--translation-text-color', tColor);
        } else {
            root.style.removeProperty('--translation-text-color');
        }

        if (rColor !== 'currentColor') {
            root.style.setProperty('--translit-text-color', rColor);
        } else {
            root.style.removeProperty('--translit-text-color');
        }

        // Theme
        if (s.paperBackground) {
            root.setAttribute('data-theme', 'sepia');
        } else {
            root.setAttribute('data-theme', s.theme);
        }

        // Paper background
        if (els.paperBackground) {
            els.paperBackground.classList.toggle('visible', s.paperBackground);
        }
        if (els.readerApp) {
            els.readerApp.classList.toggle('paper-active', s.paperBackground);
        }

        // Apply modes
        applyModes();

        // Apply font to verses
        applyFontToVerses();

        // Apply Ik Onkar background
        updateIkonkarBackground();

        // Apply Orbs background
        updateOrbsBackground();

        // Update UI
        updateSettingsUI();
        updateToggleButtons();
    }

    function applyModes() {
        const container = els.versesContainer;
        if (!container) return;

        // Larivaar
        document.body.classList.toggle('larivaar-mode', state.settings.larivaar);
        document.body.classList.toggle('larivaar-assist', state.settings.larivaar && state.settings.larivaarAssist);

        // Continuous reading (true continuous - inline display)
        container.classList.toggle('continuous-mode', state.settings.continuousReading);

        // Paragraph mode
        container.classList.toggle('paragraph-mode', state.settings.paragraphMode && !state.settings.continuousReading);

        // Best Version mode (line break after every ॥)
        container.classList.toggle('best-version-mode', state.settings.bestVersion && !state.settings.continuousReading && !state.settings.paragraphMode);

        // Show/hide larivaar assist option
        if (els.larivaarAssistRow) {
            els.larivaarAssistRow.style.display = state.settings.larivaar ? 'flex' : 'none';
        }
        if (els.larivaarAssistDivider) {
            els.larivaarAssistDivider.style.display = state.settings.larivaar ? 'block' : 'none';
        }
    }

    function updateSettingsUI() {
        const s = state.settings;

        // Toggles
        const toggleMap = {
            wakeLockToggle: 'wakeLock',
            larivaarToggle: 'larivaar',
            larivaarAssistToggle: 'larivaarAssist',
            continuousReadingToggle: 'continuousReading',
            paragraphModeToggle: 'paragraphMode',
            bestVersionToggle: 'bestVersion',
            showVisraamsToggle: 'showVisraams',
            paperBackgroundToggle: 'paperBackground',
            showTitlesToggle: 'showTitles',
            hideGurmukhiToggle: 'hideGurmukhi',
            punjabiTranslationToggle: 'punjabiTranslation',
            englishTranslationToggle: 'englishTranslation',
            englishTranslitToggle: 'englishTranslit',
            hindiTranslitToggle: 'hindiTranslit',
            shahmukhiTranslitToggle: 'shahmukhiTranslit',
            autoPlayToggle: 'autoPlay'
        };

        Object.entries(toggleMap).forEach(([elKey, settingKey]) => {
            const el = els[elKey];
            if (el) {
                const isOn = s[settingKey];
                el.setAttribute('aria-checked', isOn);
                el.classList.toggle('active', isOn);
            }
        });

        // Size values
        if (els.gurbaniFontSizeValue) {
            els.gurbaniFontSizeValue.textContent = `${s.gurbaniFontSize} px`;
        }
        if (els.translationSizeValue) {
            els.translationSizeValue.textContent = `${s.translationSize} px`;
        }
        if (els.translitSizeValue) {
            els.translitSizeValue.textContent = `${s.translitSize} px`;
        }

        // Selects
        if (els.fontFamilySelect) els.fontFamilySelect.value = s.fontFamily;
        if (els.fontWeightSelect) els.fontWeightSelect.value = s.fontWeight;
        if (els.textAlignSelect) els.textAlignSelect.value = s.textAlign;
        if (els.playbackSpeedSelect) els.playbackSpeedSelect.value = s.playbackSpeed;

        // Theme bubbles
        document.querySelectorAll('.theme-bubble').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === s.theme && !s.paperBackground);
        });

        // Color circles
        const colorMap = {
            gurmukhiColor: 'gurmukhiColorIdx',
            translationColor: 'translationColorIdx',
            translitColor: 'translitColorIdx'
        };

        Object.entries(colorMap).forEach(([elKey, settingKey]) => {
            const el = els[elKey];
            if (el) {
                const color = COLOR_PALETTE[s[settingKey]] || COLOR_PALETTE[0];
                el.style.background = color === 'currentColor' ? '#8E8E93' : color;
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // SIZE ADJUSTMENT
    // ═══════════════════════════════════════════════════════════════

    function adjustSize(target, action) {
        const config = {
            gurbani: { min: 18, max: 56, key: 'gurbaniFontSize' },
            translation: { min: 12, max: 28, key: 'translationSize' },
            translit: { min: 12, max: 28, key: 'translitSize' }
        }[target];

        if (!config) return;

        const step = 2;
        const current = state.settings[config.key];

        if (action === 'increase' && current < config.max) {
            state.settings[config.key] = current + step;
        } else if (action === 'decrease' && current > config.min) {
            state.settings[config.key] = current - step;
        }

        applyAllSettings();
        saveSettings();
    }

    // ═══════════════════════════════════════════════════════════════
    // THEME
    // ═══════════════════════════════════════════════════════════════

    function setTheme(theme) {
        // Normalize to only dark/light
        const normalizedTheme = (theme === 'light' || theme === 'sepia') ? 'light' : 'dark';
        state.settings.theme = normalizedTheme;
        state.settings.paperBackground = false;
        applyAllSettings();
        saveSettings();
        // Propagate to isolated Nitnem theme system so other pages stay in sync
        try {
            localStorage.setItem('nitnem_theme_override', normalizedTheme);
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: normalizedTheme } }));
    }

    // ═══════════════════════════════════════════════════════════════
    // COLOR PICKER
    // ═══════════════════════════════════════════════════════════════

    function openColorPicker(settingKey, title) {
        state.currentColorPicker = settingKey;

        if (els.pickerTitle) els.pickerTitle.textContent = title;

        if (els.pickerColors) {
            els.pickerColors.innerHTML = '';
            COLOR_PALETTE.forEach((color, idx) => {
                if (color === 'currentColor') return; // Skip default

                const btn = document.createElement('button');
                btn.className = 'picker-color';
                btn.style.background = color;
                btn.dataset.index = idx;

                if (state.settings[settingKey] === idx) btn.classList.add('selected');

                btn.addEventListener('click', () => {
                    state.settings[settingKey] = idx;
                    applyAllSettings();
                    saveSettings();
                    closeColorPicker();
                });

                els.pickerColors.appendChild(btn);
            });
        }

        if (els.colorPickerModal) els.colorPickerModal.classList.add('visible');
    }

    function closeColorPicker() {
        if (els.colorPickerModal) els.colorPickerModal.classList.remove('visible');
        state.currentColorPicker = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // TOGGLE SETTING
    // ═══════════════════════════════════════════════════════════════

    function toggleSetting(key) {
        state.settings[key] = !state.settings[key];

        // Re-render for larivaar or visraam changes
        if ((key === 'larivaar' || key === 'larivaarAssist' || key === 'showVisraams') && state.baniData?.verses) {
            renderVerses(state.baniData.verses);
        }

        applyAllSettings();
        saveSettings();
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
        } else if (state.wakeLockSentinel) {
            await state.wakeLockSentinel.release();
            state.wakeLockSentinel = null;
        }

        updateSettingsUI();
        saveSettings();
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

    function resetSettings() {
        if (confirm('Reset all settings?')) {
            state.settings = { ...DEFAULTS };
            applyAllSettings();
            saveSettings();
            if (state.baniData?.verses) renderVerses(state.baniData.verses);
            closeSettings();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SAVE/LOAD
    // ═══════════════════════════════════════════════════════════════

    function saveSettings() {
        try {
            localStorage.setItem('anhad_reader_v5', JSON.stringify(state.settings));
        } catch (e) { }
    }

    function loadSettings() {
        try {
            // --- Migration: v5 → v5.1 clears old defaults ------------------
            // Old v5 had showRoman=true, showEnglish=true, ikonkarTransparency=10/30
            // New v5.1 defaults: Gurmukhi-only, both backgrounds off (0)
            const SETTINGS_VERSION = 'v5.1';
            const storedVersion = localStorage.getItem('anhad_reader_settings_version');
            if (storedVersion !== SETTINGS_VERSION) {
                // Clear old settings so DEFAULTS apply cleanly
                localStorage.removeItem('anhad_reader_v5');
                localStorage.setItem('anhad_reader_settings_version', SETTINGS_VERSION);
            }
            // ----------------------------------------------------------------

            const getNitnemDefaultTheme = () => {
                var override = localStorage.getItem('nitnem_theme_override');
                if (override === 'light' || override === 'dark') return override;
                var hour = new Date().getHours();
                return (hour >= 6 && hour < 19) ? 'light' : 'dark';
            };
            const saved = localStorage.getItem('anhad_reader_v5');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Sync with isolated Nitnem theme on load - prefer isolated theme
                const nitnemTheme = getNitnemDefaultTheme();
                parsed.theme = nitnemTheme;
                state.settings = { ...DEFAULTS, ...parsed };
            } else {
                // No saved settings — use DEFAULTS (both backgrounds are 0 by default)
                const nitnemTheme = getNitnemDefaultTheme();
                state.settings = { ...DEFAULTS };
                state.settings.theme = nitnemTheme;
            }
        } catch (e) {
            state.settings = { ...DEFAULTS };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROGRESS & SCROLL
    // ═══════════════════════════════════════════════════════════════

    let lastScrollTop = 0;
    const SCROLL_THRESHOLD = 80;

    let _nitnemCompletionFired = false;

    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

        if (els.progressBar) els.progressBar.style.width = `${progress}%`;
        if (els.progressText) els.progressText.textContent = `${progress}%`;

        // Credit one Nitnem completion when user reads 90%+ of the bani
        if (progress >= 90 && !_nitnemCompletionFired && docHeight > 200) {
            _nitnemCompletionFired = true;
            if (window.AnhadStats && typeof window.AnhadStats.addNitnemCompleted === 'function') {
                window.AnhadStats.addNitnemCompleted(1);
            }
            // Unified Stats - record bani name and completion
            if (window.UnifiedStats) {
                const baniName = state.baniMeta?.nameEnglish || 'Bani';
                window.UnifiedStats.recordNitnemBani(baniName);
                window.UnifiedStats.recordNitnemComplete();
            }
        }

        // Scroll top button
        if (els.scrollTopBtn) {
            els.scrollTopBtn.classList.toggle('visible', scrollTop > 400);
        }

        // Hide header & toggles on scroll DOWN, show on scroll UP
        const scrollingDown = scrollTop > lastScrollTop && scrollTop > SCROLL_THRESHOLD;

        const stickyTopBar = document.getElementById('readerStickyTopBar');
        if (stickyTopBar) {
            stickyTopBar.classList.toggle('hidden', scrollingDown);
        }
        if (els.readerHeader) {
            els.readerHeader.classList.toggle('hidden', scrollingDown);
        }
        if (els.readerToggles) {
            els.readerToggles.classList.toggle('hidden', scrollingDown);
        }
        if (els.progressText) {
            els.progressText.classList.toggle('hidden', scrollingDown);
        }

        lastScrollTop = scrollTop;
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOKMARK
    // ═══════════════════════════════════════════════════════════════

    function toggleBookmark() {
        let favorites = JSON.parse(localStorage.getItem('anhad_favorites') || '[]');
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

        localStorage.setItem('anhad_favorites', JSON.stringify(favorites));
    }

    function checkBookmark() {
        const favorites = JSON.parse(localStorage.getItem('anhad_favorites') || '[]');
        els.bookmarkBtn?.classList.toggle('active', favorites.some(f => f.id === state.baniId));
    }

    // ═══════════════════════════════════════════════════════════════
    // NITNEM TRACKER TICK
    // ═══════════════════════════════════════════════════════════════

    function toggleNitnemTick() {
        if (!state.baniId) return;

        try {
            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];
            
            // Load Nitnem Tracker data
            const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}');
            const selectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || '{}');

            // Get or create today's progress
            if (!nitnemLog[today]) {
                nitnemLog[today] = {
                    amritvela: [],
                    rehras: [],
                    sohila: []
                };
            }

            const todayProgress = nitnemLog[today];
            const isTicked = checkIfBaniTicked(todayProgress);

            if (isTicked) {
                // Untick: Remove bani from all periods
                ['amritvela', 'rehras', 'sohila'].forEach(period => {
                    todayProgress[period] = todayProgress[period].filter(uid => uid !== `bani-${state.baniId}`);
                });
                els.tickBtn?.classList.remove('ticked');
                console.log('[Reader] Bani unticked in Nitnem Tracker');
            } else {
                // Tick: Add bani to appropriate period based on current time
                const currentHour = new Date().getHours();
                let period = 'rehras'; // default

                if (currentHour >= 0 && currentHour < 12) {
                    period = 'amritvela';
                } else if (currentHour >= 12 && currentHour < 18) {
                    period = 'rehras';
                } else {
                    period = 'sohila';
                }

                // Add bani to the period
                const baniUid = `bani-${state.baniId}`;
                if (!Array.isArray(todayProgress[period])) {
                    todayProgress[period] = [];
                }
                if (!todayProgress[period].includes(baniUid)) {
                    todayProgress[period].push(baniUid);
                }
                els.tickBtn?.classList.add('ticked');
                console.log('[Reader] Bani ticked in Nitnem Tracker for period:', period);

                // SYNC: Record in UnifiedStats for streak tracking
                if (window.UnifiedStats) {
                    const baniName = state.baniMeta?.nameEnglish || 'Bani';
                    window.UnifiedStats.recordNitnemBani(baniName);
                }
            }

            // Save back to localStorage
            localStorage.setItem('nitnemTracker_nitnemLog', JSON.stringify(nitnemLog));

            // Dispatch event to notify Nitnem Tracker
            window.dispatchEvent(new CustomEvent('nitnemUpdated', {
                detail: {
                    baniId: state.baniId,
                    date: today
                }
            }));

        } catch (e) {
            console.error('[Reader] Error toggling Nitnem tick:', e);
        }
    }

    function checkIfBaniTicked(todayProgress) {
        if (!todayProgress || !state.baniId) return false;
        const baniUid = `bani-${state.baniId}`;
        
        return ['amritvela', 'rehras', 'sohila'].some(period => {
            return Array.isArray(todayProgress[period]) && todayProgress[period].includes(baniUid);
        });
    }

    function checkNitnemTick() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}');
            const todayProgress = nitnemLog[today];
            
            const isTicked = checkIfBaniTicked(todayProgress);
            els.tickBtn?.classList.toggle('ticked', isTicked);
            
            console.log('[Reader] Nitnem tick state:', isTicked);
        } catch (e) {
            console.error('[Reader] Error checking Nitnem tick:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════

    function showLoading(msg) {
        if (els.loadingText) els.loadingText.textContent = msg;
        if (els.loadingOverlay) els.loadingOverlay.style.display = 'flex';
        if (els.errorState) els.errorState.style.display = 'none';
    }

    function hideLoading() {
        if (els.loadingOverlay) els.loadingOverlay.style.display = 'none';
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
    // OFFLINE BADGE — Shows when bani is cached
    // ═══════════════════════════════════════════════════════════════

    function showOfflineBadge(show) {
        const badge = document.getElementById('offlineBadge');
        if (badge) {
            badge.style.opacity = show ? '0.7' : '0';
            badge.title = show ? 'Available offline ✓' : '';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT SETUP
    // ═══════════════════════════════════════════════════════════════

    function setupEvents() {
        // Scroll
        window.addEventListener('scroll', updateProgress, { passive: true });

        // Scroll top
        els.scrollTopBtn?.addEventListener('click', scrollToTop);

        // Settings
        els.settingsBtn?.addEventListener('click', openSettings);
        els.settingsCloseFloat?.addEventListener('click', closeSettings);
        els.settingsOverlay?.addEventListener('click', closeSettings);

        // Display toggles
        els.toggleGurmukhi?.addEventListener('click', () => toggleDisplay('gurmukhi'));
        els.toggleRoman?.addEventListener('click', () => toggleDisplay('roman'));
        els.toggleEnglish?.addEventListener('click', () => toggleDisplay('english'));
        els.togglePunjabi?.addEventListener('click', () => toggleDisplay('punjabi'));

        // Orbs opacity slider
        els.orbsOpacitySlider?.addEventListener('input', (e) => {
            state.settings.orbsOpacity = parseInt(e.target.value, 10);
            updateOrbsBackground();
            saveSettings();
        });

        // Bookmark & actions
        els.bookmarkBtn?.addEventListener('click', toggleBookmark);
        els.tickBtn?.addEventListener('click', toggleNitnemTick);
        els.readAgainBtn?.addEventListener('click', scrollToTop);
        els.resetBtn?.addEventListener('click', resetSettings);
        els.retryBtn?.addEventListener('click', loadBani);

        // General toggles
        els.wakeLockToggle?.addEventListener('click', toggleWakeLock);
        els.larivaarToggle?.addEventListener('click', () => toggleSetting('larivaar'));
        els.larivaarAssistToggle?.addEventListener('click', () => toggleSetting('larivaarAssist'));
        els.continuousReadingToggle?.addEventListener('click', () => toggleSetting('continuousReading'));
        els.paragraphModeToggle?.addEventListener('click', () => toggleSetting('paragraphMode'));
        els.bestVersionToggle?.addEventListener('click', () => toggleSetting('bestVersion'));
        els.showVisraamsToggle?.addEventListener('click', () => toggleSetting('showVisraams'));
        els.paperBackgroundToggle?.addEventListener('click', () => toggleSetting('paperBackground'));
        els.showTitlesToggle?.addEventListener('click', () => toggleSetting('showTitles'));
        els.hideGurmukhiToggle?.addEventListener('click', () => toggleSetting('hideGurmukhi'));

        // Translation toggles
        els.punjabiTranslationToggle?.addEventListener('click', () => toggleSetting('punjabiTranslation'));
        els.englishTranslationToggle?.addEventListener('click', () => toggleSetting('englishTranslation'));

        // Transliteration toggles
        els.englishTranslitToggle?.addEventListener('click', () => toggleSetting('englishTranslit'));
        els.hindiTranslitToggle?.addEventListener('click', () => toggleSetting('hindiTranslit'));
        els.shahmukhiTranslitToggle?.addEventListener('click', () => toggleSetting('shahmukhiTranslit'));

        // Audio
        els.autoPlayToggle?.addEventListener('click', () => toggleSetting('autoPlay'));

        // Size controls
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => adjustSize(btn.dataset.target, btn.dataset.action));
        });

        // Theme bubbles
        document.querySelectorAll('.theme-bubble').forEach(btn => {
            btn.addEventListener('click', () => setTheme(btn.dataset.theme));
        });

        // ═══════════════════════════════════════════════════════════════
        // GLOBAL THEME SYNC — Listen for theme changes from other parts of the app
        // ═══════════════════════════════════════════════════════════════
        window.addEventListener('storage', (e) => {
            if (e.key === 'nitnem_theme_override' && e.newValue) {
                state.settings.theme = e.newValue;
                applyAllSettings();
                saveSettings();
                console.log('🎨 Nitnem Reader: Synced with isolated Nitnem theme:', e.newValue);
            }
        });

        // Listen for custom theme change events
        window.addEventListener('themechange', (e) => {
            if (e.detail?.theme) {
                state.settings.theme = e.detail.theme;
                applyAllSettings();
                saveSettings();
                console.log('🎨 Nitnem Reader: Theme changed via event:', e.detail.theme);
            }
        });

        // Font select - DIRECT FONT APPLICATION + SIZE ADJUSTMENT
        els.fontFamilySelect?.addEventListener('change', (e) => {
            const fontKey = e.target.value;
            state.settings.fontFamily = fontKey;
            
            // Auto-adjust size based on font (larger for handwritten fonts)
            if (FONT_SIZES[fontKey]) {
                state.settings.gurbaniFontSize = FONT_SIZES[fontKey];
            }
            
            // CRITICAL FIX: Force immediate style reflow so font changes without refresh
            applyFontToVerses();
            
            // Force browser to recalculate styles immediately
            requestAnimationFrame(() => {
                const versesContainer = document.getElementById('versesContainer');
                if (versesContainer) {
                    // Trigger reflow by reading a layout property
                    void versesContainer.offsetHeight;
                    
                    // Re-apply font in case it didn't take
                    applyFontToVerses();
                }
            });
            
            saveSettings();
        });

        els.fontWeightSelect?.addEventListener('change', (e) => {
            state.settings.fontWeight = e.target.value;
            applyFontToVerses();
            saveSettings();
        });

        els.textAlignSelect?.addEventListener('change', (e) => {
            state.settings.textAlign = e.target.value;
            applyFontToVerses();
            saveSettings();
        });

        els.playbackSpeedSelect?.addEventListener('change', (e) => {
            state.settings.playbackSpeed = parseFloat(e.target.value);
            saveSettings();
        });

        // Ik Onkar Background transparency slider
        els.ikonkarTransparency?.addEventListener('input', (e) => {
            setIkonkarTransparency(e.target.value);
        });

        // Color pickers
        els.gurmukhiColor?.addEventListener('click', () => openColorPicker('gurmukhiColorIdx', 'Gurbani Color'));
        els.translationColor?.addEventListener('click', () => openColorPicker('translationColorIdx', 'Translation Color'));
        els.translitColor?.addEventListener('click', () => openColorPicker('translitColorIdx', 'Transliteration Color'));

        // Color picker close
        els.pickerClose?.addEventListener('click', closeColorPicker);
        document.querySelector('.picker-backdrop')?.addEventListener('click', closeColorPicker);

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (state.currentColorPicker) closeColorPicker();
                else if (state.isSettingsOpen) closeSettings();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
