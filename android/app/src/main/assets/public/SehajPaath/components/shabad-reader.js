/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHABAD READER — Sacred Reading Engine
 * 
 * Philosophy:
 * - Fetch → Parse → Render → Disappear
 * - The code serves the reading, not the features
 * - Settings in top-right only
 * - NO floating controls at bottom
 * - Highlight ONLY searched pangti, NEVER Rahao by default
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════

    const state = {
        shabadId: null,
        shabadData: null,
        fontSize: localStorage.getItem('shabad_fontSize') || 'medium',
        theme: localStorage.getItem('anhad_theme') || 'light',
        showTransliteration: localStorage.getItem('shabad_transliteration') !== 'false',
        showTranslation: localStorage.getItem('shabad_translation') !== 'false',
        searchQuery: null
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM REFERENCES
    // ═══════════════════════════════════════════════════════════════════════════

    const elements = {
        readerNav: document.getElementById('readerNav'),
        backLink: document.getElementById('backLink'),
        navMeta: document.getElementById('navMeta'),
        settingsBtn: document.getElementById('settingsBtn'),
        loadingState: document.getElementById('loadingState'),
        errorState: document.getElementById('errorState'),
        errorMessage: document.getElementById('errorMessage'),
        readerContent: document.getElementById('readerContent'),
        shabadHeader: document.getElementById('shabadHeader'),
        versesFlow: document.getElementById('versesFlow'),
        shabadFooter: document.getElementById('shabadFooter'),
        // Settings Panel
        settingsOverlay: document.getElementById('settingsOverlay'),
        settingsBackdrop: document.getElementById('settingsBackdrop'),
        settingsPanel: document.getElementById('settingsPanel'),
        settingsClose: document.getElementById('settingsClose'),
        transliterationToggle: document.getElementById('transliterationToggle'),
        translationToggle: document.getElementById('translationToggle')
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('🙏 Shabad Reader initializing...');

        // Extract shabad ID from URL
        const params = new URLSearchParams(window.location.search);
        state.shabadId = params.get('id');

        // Preserve search context for back navigation
        const searchQuery = params.get('q');
        if (searchQuery) {
            elements.backLink.href = `../GurbaniKhoj/gurbani-khoj.html?q=${encodeURIComponent(searchQuery)}`;
            state.searchQuery = searchQuery;
        }

        // Validate ID
        if (!state.shabadId || state.shabadId === 'undefined' || state.shabadId === 'null') {
            showError('No shabad specified. Please search for a shabad first.');
            return;
        }

        // Apply saved preferences
        applyFontSize(state.fontSize);
        applyTheme(state.theme);
        applyDisplaySettings();

        // Setup event listeners
        setupEventListeners();

        // Fetch and render
        loadShabad();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════════

    async function loadShabad() {
        try {
            console.log(`[Reader] Fetching shabad ${state.shabadId}...`);

            let data;

            // Use BaniDB if available
            if (window.BaniDB) {
                data = await window.BaniDB.getShabadById(state.shabadId);
            } else {
                // Fallback to direct API call
                const response = await fetch(`https://api.banidb.com/v2/shabads/${state.shabadId}`);
                if (!response.ok) throw new Error('Failed to fetch shabad');
                data = await response.json();
            }

            if (!data || (!data.shabad && !data.verses)) {
                throw new Error('No shabad data received');
            }

            state.shabadData = data;
            renderShabad(data);

        } catch (error) {
            console.error('[Reader] Load error:', error);
            showError(error.message || 'Unable to load shabad. Please try again.');
        }
    }

    function showError(message) {
        elements.loadingState.classList.add('hidden');
        elements.errorState.classList.remove('hidden');
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDERING — NO RAHAO AUTO-CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    function renderShabad(data) {
        const verses = data.shabad || data.verses || [];
        const firstVerse = verses[0]?.verse || verses[0] || {};

        // Extract metadata
        const raag = firstVerse.raag?.unicode || firstVerse.raag?.gurmukhi ||
            data.shabadInfo?.raag?.unicode || '';
        const writer = firstVerse.writer?.unicode || firstVerse.writer?.english ||
            data.shabadInfo?.writer?.english || '';
        const pageNo = firstVerse.pageNo || data.shabadInfo?.pageNo || '';
        const source = firstVerse.source?.english || 'Sri Guru Granth Sahib Ji';

        // Update nav meta
        elements.navMeta.textContent = pageNo ? `ਅੰਗ ${pageNo}` : '';

        // Update page title
        if (raag) {
            document.title = `${raag} | ਸ਼ਬਦ`;
        }

        // Render header
        elements.shabadHeader.innerHTML = `
            ${raag ? `<div class="header-raag">${escapeHtml(raag)}</div>` : ''}
            ${writer ? `<div class="header-writer">${escapeHtml(writer)}</div>` : ''}
            <div class="header-source">${escapeHtml(source)}${pageNo ? ` • ਅੰਗ ${pageNo}` : ''}</div>
        `;

        // Render verses — NO RAHAO AUTO-CLASS
        elements.versesFlow.innerHTML = verses.map((verseData, index) => {
            const verse = verseData.verse || verseData;

            // Extract text
            const gurmukhi = verse.unicode || verse.verse?.unicode ||
                verse.gurmukhi || verse.verse?.gurmukhi || '';

            const transliteration = verseData.transliteration?.english ||
                verseData.transliteration?.roman ||
                verse.transliteration?.english || '';

            const translation = extractTranslation(verseData.translation || verse.translation);

            // NO RAHAO AUTO-HIGHLIGHTING — Just render as normal verse
            return `
                <div class="verse" data-index="${index}">
                    <p class="verse-gurmukhi">${escapeHtml(gurmukhi)}</p>
                    ${transliteration ? `<p class="verse-transliteration">${escapeHtml(transliteration)}</p>` : ''}
                    ${translation ? `<p class="verse-translation">${escapeHtml(translation)}</p>` : ''}
                </div>
            `;
        }).join('');

        // Show content, hide loading
        elements.loadingState.classList.add('hidden');
        elements.readerContent.classList.remove('hidden');

        // Highlight ONLY the searched verse (NOT Rahao)
        if (state.searchQuery) {
            highlightSearchedVerse();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HIGHLIGHT SEARCHED VERSE — ONLY EXACT MATCH (NO RAHAO)
    // ═══════════════════════════════════════════════════════════════════════════

    function highlightSearchedVerse() {
        if (!state.searchQuery) return;

        const verses = document.querySelectorAll('.verse');
        let foundMatch = false;
        let matchedElement = null;

        // Normalize search query
        const query = state.searchQuery.toLowerCase().replace(/\s+/g, ' ').trim();

        verses.forEach(verse => {
            const gurmukhiText = verse.querySelector('.verse-gurmukhi')?.textContent || '';

            // Check if this verse contains the search query
            // ONLY highlight the searched pangti — NEVER Rahao by default
            if (gurmukhiText.includes(state.searchQuery) ||
                gurmukhiText.toLowerCase().includes(query)) {

                // Add highlight class ONLY to the matched verse
                verse.classList.add('searched-highlight');
                verse.classList.add('just-landed');
                foundMatch = true;
                matchedElement = verse;

                console.log('🔍 Highlighted searched verse:', gurmukhiText.substring(0, 50) + '...');

                // Remove landing animation after it completes
                setTimeout(() => {
                    verse.classList.remove('just-landed');
                }, 2000);
            }
        });

        // Smooth, respectful scroll to matched verse
        if (foundMatch && matchedElement) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    matchedElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 400);
            });
        }

        // Clear search query after highlighting (one-time operation)
        state.searchQuery = null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SETTINGS PANEL
    // ═══════════════════════════════════════════════════════════════════════════

    function openSettings() {
        elements.settingsOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeSettings() {
        elements.settingsOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function setTheme(theme) {
        state.theme = theme;
        localStorage.setItem('anhad_theme', theme);
        applyTheme(theme);

        // Update active state on theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    function setFontSize(size) {
        state.fontSize = size;
        localStorage.setItem('shabad_fontSize', size);
        applyFontSize(size);

        // Update active state on font buttons
        document.querySelectorAll('.font-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
    }

    function toggleTransliteration() {
        state.showTransliteration = !state.showTransliteration;
        localStorage.setItem('shabad_transliteration', state.showTransliteration);
        applyDisplaySettings();
    }

    function toggleTranslation() {
        state.showTranslation = !state.showTranslation;
        localStorage.setItem('shabad_translation', state.showTranslation);
        applyDisplaySettings();
    }

    function applyDisplaySettings() {
        document.body.classList.toggle('hide-transliteration', !state.showTransliteration);
        document.body.classList.toggle('hide-translation', !state.showTranslation);

        // Update toggle states
        if (elements.transliterationToggle) {
            elements.transliterationToggle.checked = state.showTransliteration;
        }
        if (elements.translationToggle) {
            elements.translationToggle.checked = state.showTranslation;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function extractTranslation(translationObj) {
        if (!translationObj) return '';

        // Try different translation sources
        return translationObj.en?.bdb ||
            translationObj.en?.ms ||
            translationObj.en?.ssk ||
            translationObj.english ||
            (typeof translationObj === 'string' ? translationObj : '');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function applyFontSize(size) {
        document.documentElement.setAttribute('data-font-size', size);

        // Update active button
        document.querySelectorAll('.font-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // Update meta theme color
        const themeColors = {
            light: '#FAF9F7',
            dark: '#0C0C0C',
            gold: '#1A1408'
        };
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme] || themeColors.light);

        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    function setupEventListeners() {
        // Settings button — opens panel
        elements.settingsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            openSettings();
        });

        // Settings close button
        elements.settingsClose?.addEventListener('click', closeSettings);

        // Settings backdrop click closes
        elements.settingsBackdrop?.addEventListener('click', closeSettings);

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTheme(btn.dataset.theme);
            });
        });

        // Font size buttons
        document.querySelectorAll('.font-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setFontSize(btn.dataset.size);
            });
        });

        // Transliteration toggle
        elements.transliterationToggle?.addEventListener('change', toggleTransliteration);

        // Translation toggle
        elements.translationToggle?.addEventListener('change', toggleTranslation);

        // Handle system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (state.theme === 'system') {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close settings or go back
            if (e.key === 'Escape') {
                if (!elements.settingsOverlay.classList.contains('hidden')) {
                    closeSettings();
                } else {
                    window.history.back();
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
