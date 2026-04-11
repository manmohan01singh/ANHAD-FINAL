/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI SEARCH ENGINE — Complete Functionality
 * 
 * Features:
 * - Unified search pipeline (text, voice, keyboard)
 * - Gurmukhi keyboard popup with ALL characters
 * - Voice search with AUTO-TRIGGER (actually returns results!)
 * - Language selection for voice (Punjabi/English)
 * - Beautiful results with staggered animations
 * - First Letter, Gurmukhi, and English transliteration search
 * - Theme toggle support
 * 
 * Version: 2.0 - Complete Task 1 Implementation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    const API_BASE = 'https://api.banidb.com/v2';
    const DEBOUNCE_DELAY = 350;
    const VOICE_AUTO_SEARCH_DELAY = 300;
    const MAX_RESULTS = 50;

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════

    const state = {
        searchMode: 'first-letter', // 'first-letter', 'gurmukhi', or 'english'
        currentQuery: '',
        isLoading: false,
        debounceTimer: null,
        lastResults: [],
        recognition: null,
        isListening: false,
        voiceLanguage: 'pa-IN', // 'pa-IN' for Punjabi, 'en-US' for English
        theme: localStorage.getItem('anhad_theme') || 'system'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM REFERENCES
    // ═══════════════════════════════════════════════════════════════════════════

    const elements = {
        // Search
        searchInput: document.getElementById('searchInput'),
        clearBtn: document.getElementById('clearBtn'),
        keyboardBtn: document.getElementById('keyboardBtn'),
        voiceBtn: document.getElementById('voiceBtn'),
        modeBtns: document.querySelectorAll('[data-mode]'),

        // States
        emptyState: document.getElementById('emptyState'),
        loadingState: document.getElementById('loadingState'),
        loadingText: document.getElementById('loadingText'),
        noResultsState: document.getElementById('noResultsState'),
        noResultsMessage: document.getElementById('noResultsMessage'),
        errorState: document.getElementById('errorState'),
        errorMessage: document.getElementById('errorMessage'),
        retryBtn: document.getElementById('retryBtn'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),

        // Results
        resultsList: document.getElementById('resultsList'),
        resultsCount: document.getElementById('resultsCount'),
        resultsQuery: document.getElementById('resultsQuery'),
        resultsContainer: document.getElementById('resultsContainer'),

        // Keyboard
        keyboardOverlay: document.getElementById('keyboardOverlay'),
        keyboardBackdrop: document.getElementById('keyboardBackdrop'),
        keyboardPopup: document.getElementById('keyboardPopup'),
        keyboardClose: document.getElementById('keyboardClose'),
        keyboardPreview: document.getElementById('keyboardPreview'),
        backspaceKey: document.getElementById('backspaceKey'),
        doneKey: document.getElementById('doneKey'),

        // Voice
        voiceOverlay: document.getElementById('voiceOverlay'),
        voiceStatus: document.getElementById('voiceStatus'),
        voiceTranscript: document.getElementById('voiceTranscript'),
        voiceCancelBtn: document.getElementById('voiceCancelBtn'),
        langPunjabi: document.getElementById('langPunjabi'),
        langEnglish: document.getElementById('langEnglish'),

        // Theme
        themeToggle: document.getElementById('themeToggle'),

        // Toast
        toastContainer: document.getElementById('toastContainer')
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('🔍 Gurbani Search Engine v2.0 initializing...');

        if (!elements.searchInput) {
            console.error('[Search] Critical: Required elements not found');
            return;
        }

        // Apply saved theme
        applyTheme(state.theme);

        // Check for query in URL
        const params = new URLSearchParams(window.location.search);
        const urlQuery = params.get('q');
        if (urlQuery) {
            elements.searchInput.value = urlQuery;
            state.currentQuery = urlQuery;
            // Auto-detect search mode based on query
            detectAndSetSearchMode(urlQuery);
            performSearch(urlQuery, 'url');
        }

        // Setup all event listeners
        setupEventListeners();

        // Setup voice recognition
        setupVoiceRecognition();

        // Focus search input
        setTimeout(() => elements.searchInput?.focus(), 100);

        console.log('✅ Gurbani Search Engine v2.0 ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    function setupEventListeners() {
        // ─── Search Input ───
        elements.searchInput.addEventListener('input', handleInputChange);
        elements.searchInput.addEventListener('keydown', handleInputKeydown);

        // ─── Clear Button ───
        elements.clearBtn?.addEventListener('click', clearSearch);
        elements.clearSearchBtn?.addEventListener('click', clearSearch);

        // ─── Keyboard Button ───
        elements.keyboardBtn?.addEventListener('click', openGurmukhiKeyboard);

        // ─── Voice Button ───
        elements.voiceBtn?.addEventListener('click', toggleVoiceSearch);

        // ─── Mode Buttons ───
        elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => setSearchMode(btn.dataset.mode));
        });

        // ─── Retry Button ───
        elements.retryBtn?.addEventListener('click', () => {
            if (state.currentQuery) performSearch(state.currentQuery, 'retry');
        });

        // ─── Keyboard Popup ───
        elements.keyboardBackdrop?.addEventListener('click', closeGurmukhiKeyboard);
        elements.keyboardClose?.addEventListener('click', closeGurmukhiKeyboard);
        elements.backspaceKey?.addEventListener('click', handleBackspace);
        elements.doneKey?.addEventListener('click', handleKeyboardDone);

        // Keyboard character keys
        document.querySelectorAll('.key[data-char]').forEach(key => {
            key.addEventListener('click', () => {
                insertCharacter(key.dataset.char);
                // Add visual feedback
                key.style.animation = 'keyPress 0.15s ease-out';
                setTimeout(() => key.style.animation = '', 150);
            });
        });

        // ─── Voice Language Selector ───
        elements.langPunjabi?.addEventListener('click', () => setVoiceLanguage('pa-IN'));
        elements.langEnglish?.addEventListener('click', () => setVoiceLanguage('en-US'));

        // ─── Voice Cancel ───
        elements.voiceCancelBtn?.addEventListener('click', stopVoiceRecognition);

        // ─── Theme Toggle ───
        elements.themeToggle?.addEventListener('click', toggleTheme);

        // ─── Global Keyboard Shortcuts ───
        document.addEventListener('keydown', handleGlobalKeydown);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH INPUT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    function handleInputChange(e) {
        const query = e.target.value;

        // Update clear button visibility
        elements.clearBtn.hidden = !query;

        // Update keyboard preview if open
        if (elements.keyboardPreview) {
            elements.keyboardPreview.textContent = query;
        }

        // Empty query - show empty state
        if (!query.trim()) {
            showState('empty');
            state.currentQuery = '';
            updateURL('');
            return;
        }

        state.currentQuery = query.trim();

        // Auto-detect mode based on input
        detectAndSetSearchMode(query.trim());

        // Debounced search
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            performSearch(query.trim(), 'typed');
        }, DEBOUNCE_DELAY);
    }

    function handleInputKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(state.debounceTimer);
            if (elements.searchInput.value.trim()) {
                performSearch(elements.searchInput.value.trim(), 'enter');
            }
        }
    }

    function handleGlobalKeydown(e) {
        // Escape to clear or close modals
        if (e.key === 'Escape') {
            if (!elements.keyboardOverlay.classList.contains('hidden')) {
                closeGurmukhiKeyboard();
            } else if (!elements.voiceOverlay.classList.contains('hidden')) {
                stopVoiceRecognition();
            } else if (elements.searchInput.value) {
                clearSearch();
            }
        }
    }

    function clearSearch() {
        elements.searchInput.value = '';
        elements.clearBtn.hidden = true;
        state.currentQuery = '';
        showState('empty');
        updateURL('');
        elements.searchInput.focus();

        // Clear keyboard preview if exists
        if (elements.keyboardPreview) {
            elements.keyboardPreview.textContent = '';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH MODE
    // ═══════════════════════════════════════════════════════════════════════════

    function detectAndSetSearchMode(query) {
        // Check if query contains Gurmukhi characters
        const gurmukhiRegex = /[\u0A00-\u0A7F]/;

        if (gurmukhiRegex.test(query)) {
            setSearchMode('gurmukhi', false);
        } else if (/^[a-zA-Z\s]+$/.test(query) && query.length > 4) {
            // Longer English text likely means English transliteration search
            setSearchMode('english', false);
        } else {
            // Default to first letters for short queries
            setSearchMode('first-letter', false);
        }
    }

    function setSearchMode(mode, triggerSearch = true) {
        state.searchMode = mode;

        // Update UI
        elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update placeholder
        const placeholders = {
            'first-letter': 'ਖੋਜੋ... hjkn, vv, etc.',
            'gurmukhi': 'ਗੁਰਮੁਖੀ ਵਿੱਚ ਖੋਜੋ...',
            'english': 'Search in English... waheguru'
        };
        elements.searchInput.placeholder = placeholders[mode] || 'ਖੋਜੋ...';

        // Re-search if there's a query
        if (triggerSearch && state.currentQuery) {
            performSearch(state.currentQuery, 'mode-change');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UNIFIED SEARCH PIPELINE
    // ═══════════════════════════════════════════════════════════════════════════

    async function performSearch(query, source) {
        if (!query || !query.trim()) return;

        const trimmedQuery = query.trim();
        console.log(`[Search] Query: "${trimmedQuery}" | Mode: ${state.searchMode} | Source: ${source}`);

        // Show loading
        showState('loading');
        if (elements.loadingText) {
            elements.loadingText.textContent = source === 'voice'
                ? 'ਬੋਲਣ ਦੀ ਖੋਜ...'
                : 'ਖੋਜ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...';
        }
        state.isLoading = true;

        // Update URL
        updateURL(trimmedQuery);

        try {
            let results = [];
            const searchType = getSearchTypeNumber();

            // Use BaniDB if available, otherwise direct API
            if (window.BaniDB && typeof window.BaniDB.search === 'function') {
                const searchTypeStr = getSearchTypeString();
                console.log(`[Search] Using BaniDB.search with type: ${searchTypeStr}`);
                const response = await window.BaniDB.search(trimmedQuery, searchTypeStr, MAX_RESULTS);
                results = response.verses || response.results || (Array.isArray(response) ? response : []);
            } else {
                // Direct API call
                const url = `${API_BASE}/search/${encodeURIComponent(trimmedQuery)}?searchtype=${searchType}&source=G&results=${MAX_RESULTS}`;
                console.log(`[Search] Direct API call: ${url}`);

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const data = await response.json();
                results = data.verses || data.results || [];
            }

            console.log(`[Search] Found ${results.length} results`);
            state.lastResults = results;

            if (results.length === 0) {
                elements.noResultsMessage.textContent = `No results found for: "${trimmedQuery}"`;
                showState('no-results');
            } else {
                renderResults(results, trimmedQuery);
                showState('results');
            }

        } catch (error) {
            console.error('[Search] Error:', error);
            elements.errorMessage.textContent = error.message || 'Search failed. Please try again.';
            showState('error');
        } finally {
            state.isLoading = false;
        }
    }

    function getSearchTypeString() {
        const types = {
            'first-letter': 'first-letter',
            'gurmukhi': 'gurmukhi',
            'english': 'english'
        };
        return types[state.searchMode] || 'first-letter';
    }

    function getSearchTypeNumber() {
        // BaniDB API search types:
        // 0 = First Letter Search (Each letter represents first letter of each word)
        // 1 = First Word (Gurmukhi)
        // 2 = Full Word (Gurmukhi) - USE THIS FOR PHRASE SEARCH
        // 3 = Full Word Translation
        // 4 = Full Word (Romanized/English)
        // 5 = Ang
        // 6 = Main Letter Search
        // 7 = Romanized First Letter
        const modes = {
            'firstLetters': 0,   // First letter of each word
            'first-letter': 0,   // Alias for first letter
            'gurmukhi': 2,       // FIXED: Full word Gurmukhi for phrase search
            'english': 4         // Full word romanized
        };
        return modes[state.searchMode] ?? 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESULTS RENDERING
    // ═══════════════════════════════════════════════════════════════════════════

    function renderResults(verses, query) {
        // Update count
        elements.resultsCount.textContent = `${verses.length} result${verses.length !== 1 ? 's' : ''}`;

        // Show query
        if (elements.resultsQuery) {
            elements.resultsQuery.textContent = `for "${query}"`;
        }

        // Render results with staggered animation
        elements.resultsContainer.innerHTML = verses.map((verseData, index) => {
            // Extract data correctly from API response
            const innerVerse = verseData.verse || verseData;

            // IDs - prioritize outer object
            const shabadId = verseData.shabadId || verseData.verseId || verseData.id ||
                innerVerse.shabadId || innerVerse.verseId || innerVerse.id;

            // Content
            const gurmukhi = innerVerse.unicode || innerVerse.verse?.unicode ||
                innerVerse.gurmukhi || innerVerse.verse?.gurmukhi || '';
            const translation = extractTranslation(verseData.translation || innerVerse.translation);
            const transliteration = extractTransliteration(verseData.transliteration || innerVerse.transliteration);
            const source = verseData.source?.english || innerVerse.source?.english || 'Sri Guru Granth Sahib Ji';
            const pageNo = verseData.pageNo || verseData.ang || innerVerse.pageNo || innerVerse.ang || '';
            const raag = verseData.raag?.unicode || innerVerse.raag?.unicode ||
                verseData.raag?.english || innerVerse.raag?.english || '';

            // Build reader URL with query for highlighting
            const readerUrl = `shabad-reader.html?id=${shabadId}&q=${encodeURIComponent(query)}`;

            // Log first result for debugging
            if (index === 0) {
                console.log(`[Search] First result - shabadId: ${shabadId}, gurmukhi: ${gurmukhi.substring(0, 30)}...`);
            }

            return `
                <a href="${readerUrl}" class="result-item" data-shabad-id="${shabadId}" style="animation-delay: ${Math.min(index * 50, 400)}ms">
                    <p class="result-gurmukhi">${escapeHtml(gurmukhi)}</p>
                    ${translation ? `<p class="result-translation">${escapeHtml(translation)}</p>` : ''}
                    <div class="result-meta">
                        <span class="result-source">${escapeHtml(source)}${raag ? ` • ${escapeHtml(raag)}` : ''}</span>
                        ${pageNo ? `<span class="result-ang">📖 ਅੰਗ ${pageNo}</span>` : ''}
                        <span class="result-arrow">→</span>
                    </div>
                </a>
            `;
        }).join('');
    }

    function extractTranslation(translation) {
        if (!translation) return '';
        if (typeof translation === 'string') return translation;

        if (translation.en) {
            const en = translation.en;
            if (typeof en === 'string') return en;
            return en.bdb || en.ms || en.ssk || '';
        }

        return '';
    }

    function extractTransliteration(transliteration) {
        if (!transliteration) return '';
        if (typeof transliteration === 'string') return transliteration;

        if (transliteration.en) {
            const en = transliteration.en;
            if (typeof en === 'string') return en;
            return '';
        }

        return '';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UI STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function showState(stateName) {
        // Hide all states
        elements.emptyState?.classList.add('hidden');
        elements.loadingState?.classList.add('hidden');
        elements.noResultsState?.classList.add('hidden');
        elements.errorState?.classList.add('hidden');
        elements.resultsList?.classList.add('hidden');

        // Show requested state
        switch (stateName) {
            case 'empty':
                elements.emptyState?.classList.remove('hidden');
                break;
            case 'loading':
                elements.loadingState?.classList.remove('hidden');
                break;
            case 'no-results':
                elements.noResultsState?.classList.remove('hidden');
                break;
            case 'error':
                elements.errorState?.classList.remove('hidden');
                break;
            case 'results':
                elements.resultsList?.classList.remove('hidden');
                break;
        }
    }

    function updateURL(query) {
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }
        window.history.replaceState({}, '', url);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GURMUKHI KEYBOARD — Complete Implementation
    // ═══════════════════════════════════════════════════════════════════════════

    function openGurmukhiKeyboard() {
        elements.keyboardOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Update preview
        if (elements.keyboardPreview) {
            elements.keyboardPreview.textContent = elements.searchInput.value;
        }

        // Switch to Gurmukhi mode when keyboard opens
        setSearchMode('gurmukhi', false);

        // Haptic feedback
        vibrate(10);
    }

    function closeGurmukhiKeyboard() {
        elements.keyboardOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        elements.searchInput.focus();
    }

    function insertCharacter(char) {
        const input = elements.searchInput;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;

        // Insert character at cursor position
        input.value = value.substring(0, start) + char + value.substring(end);

        // Move cursor after inserted character
        const newPos = start + char.length;
        input.setSelectionRange(newPos, newPos);

        // Update clear button
        elements.clearBtn.hidden = !input.value;

        // Update keyboard preview
        if (elements.keyboardPreview) {
            elements.keyboardPreview.textContent = input.value;
        }

        // Haptic feedback
        vibrate(10);
    }

    function handleBackspace() {
        const input = elements.searchInput;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;

        if (start === end && start > 0) {
            // No selection - delete one character before cursor
            input.value = value.substring(0, start - 1) + value.substring(end);
            input.setSelectionRange(start - 1, start - 1);
        } else if (start !== end) {
            // Selection - delete selected text
            input.value = value.substring(0, start) + value.substring(end);
            input.setSelectionRange(start, start);
        }

        // Update clear button
        elements.clearBtn.hidden = !input.value;

        // Update keyboard preview
        if (elements.keyboardPreview) {
            elements.keyboardPreview.textContent = input.value;
        }

        // Haptic feedback
        vibrate(5);
    }

    function handleKeyboardDone() {
        closeGurmukhiKeyboard();

        // Trigger search if there's input
        const query = elements.searchInput.value.trim();
        if (query) {
            state.currentQuery = query;
            performSearch(query, 'keyboard');
        }

        // Haptic feedback
        vibrate(15);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VOICE SEARCH — Complete Implementation with Auto-Trigger
    // ═══════════════════════════════════════════════════════════════════════════

    function setupVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.log('[Voice] Speech recognition not supported');
            elements.voiceBtn?.style.setProperty('display', 'none');
            return;
        }

        const recognition = new SpeechRecognition();

        // Configuration
        recognition.lang = state.voiceLanguage;
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 3;

        let finalTranscript = '';

        recognition.onstart = () => {
            state.isListening = true;
            finalTranscript = '';
            elements.voiceBtn?.classList.add('listening');
            elements.voiceOverlay?.classList.remove('hidden');
            elements.voiceStatus.textContent = state.voiceLanguage === 'pa-IN'
                ? 'ਬੋਲੋ... Listening...'
                : 'Listening...';
            elements.voiceTranscript.textContent = '';
            console.log('[Voice] Started listening in', state.voiceLanguage);
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update display
            const displayText = (finalTranscript + interimTranscript).trim();
            elements.voiceTranscript.textContent = displayText;
            elements.searchInput.value = displayText;
            elements.clearBtn.hidden = !displayText;

            // Update status
            if (displayText) {
                elements.voiceStatus.textContent = state.voiceLanguage === 'pa-IN'
                    ? 'ਸੁਣ ਰਿਹਾ ਹੈ...'
                    : 'Heard you...';
            }
        };

        recognition.onend = () => {
            state.isListening = false;
            elements.voiceBtn?.classList.remove('listening');

            const transcript = finalTranscript.trim();
            console.log('[Voice] Ended. Final transcript:', transcript);

            if (transcript) {
                // ═══════════════════════════════════════════════════════════════
                // VOICE FIRST-LETTER SEARCH FIX:
                // Convert spoken words to first letters for first-letter search
                // Example: "tuu mero mera parbat swami" → "t m m p s" → search
                // ═══════════════════════════════════════════════════════════════

                // Show processing state
                elements.voiceStatus.textContent = state.voiceLanguage === 'pa-IN'
                    ? 'ਖੋਜ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...'
                    : 'Processing...';

                // Split transcript into words and extract first letters
                const words = transcript.split(/\s+/).filter(w => w.length > 0);

                // Create first-letter search query
                let firstLettersQuery = '';

                if (state.voiceLanguage === 'en-US') {
                    // English: Map romanized first letters to Gurmukhi
                    const romanToGurmukhiMap = {
                        's': 'ਸ', 'h': 'ਹ', 'k': 'ਕ', 'g': 'ਗ', 'n': 'ਨ',
                        'c': 'ਚ', 'j': 'ਜ', 't': 'ਤ', 'd': 'ਦ', 'p': 'ਪ',
                        'b': 'ਬ', 'm': 'ਮ', 'y': 'ਯ', 'r': 'ਰ', 'l': 'ਲ',
                        'v': 'ਵ', 'w': 'ਵ', 'a': 'ਅ', 'i': 'ਇ', 'e': 'ੲ',
                        'u': 'ਉ', 'o': 'ਓ'
                    };

                    words.forEach(word => {
                        const firstChar = word.charAt(0).toLowerCase();
                        const gurmukhiChar = romanToGurmukhiMap[firstChar] || firstChar;
                        firstLettersQuery += gurmukhiChar;
                    });

                    console.log('[Voice] English → First Letters:', words.map(w => w[0]).join(' '), '→', firstLettersQuery);
                } else {
                    // Punjabi: Take first letter of each Gurmukhi word
                    words.forEach(word => {
                        firstLettersQuery += word.charAt(0);
                    });

                    console.log('[Voice] Punjabi → First Letters:', firstLettersQuery);
                }

                // Set to first-letter search mode
                setSearchMode('first-letter', false);

                // Update input with original transcript for display
                elements.searchInput.value = transcript;
                elements.clearBtn.hidden = false;
                state.currentQuery = firstLettersQuery;

                // ═══ AUTO-TRIGGER FIRST-LETTER SEARCH ═══
                setTimeout(() => {
                    elements.voiceOverlay?.classList.add('hidden');

                    // Search with first-letters query
                    performSearch(firstLettersQuery, 'voice');

                    const displayMsg = state.voiceLanguage === 'en-US'
                        ? `Searching: "${words.map(w => w[0]).join('')}" (from "${transcript}")`
                        : `ਖੋਜ: "${firstLettersQuery}"`;
                    showToast(displayMsg, 'info');
                }, VOICE_AUTO_SEARCH_DELAY);
            } else {
                // No transcript - close overlay
                elements.voiceOverlay?.classList.add('hidden');
                showToast('No speech detected. Please try again.', 'error');
            }
        };

        recognition.onerror = (event) => {
            console.error('[Voice] Error:', event.error);
            state.isListening = false;
            elements.voiceBtn?.classList.remove('listening');
            elements.voiceOverlay?.classList.add('hidden');

            let message = 'Voice search failed';
            switch (event.error) {
                case 'no-speech':
                    message = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    message = 'Microphone not available.';
                    break;
                case 'not-allowed':
                    message = 'Microphone permission denied.';
                    break;
                case 'network':
                    message = 'Network error. Check your connection.';
                    break;
            }

            showToast(message, 'error');
        };

        state.recognition = recognition;
    }

    function setVoiceLanguage(lang) {
        state.voiceLanguage = lang;

        // Update UI
        elements.langPunjabi?.classList.toggle('active', lang === 'pa-IN');
        elements.langEnglish?.classList.toggle('active', lang === 'en-US');

        // Update recognition if exists
        if (state.recognition) {
            state.recognition.lang = lang;
        }

        // Update status text
        if (elements.voiceStatus) {
            elements.voiceStatus.textContent = lang === 'pa-IN'
                ? 'ਬੋਲੋ... Listening...'
                : 'Listening...';
        }

        // Haptic feedback
        vibrate(10);
    }

    function toggleVoiceSearch() {
        if (state.isListening) {
            stopVoiceRecognition();
        } else {
            startVoiceRecognition();
        }
    }

    function startVoiceRecognition() {
        if (state.recognition && !state.isListening) {
            try {
                // Update language before starting
                state.recognition.lang = state.voiceLanguage;
                state.recognition.start();
                vibrate(15);
            } catch (error) {
                console.error('[Voice] Start error:', error);
                showToast('Could not start voice search', 'error');
            }
        }
    }

    function stopVoiceRecognition() {
        if (state.recognition && state.isListening) {
            state.recognition.stop();
        }
        elements.voiceOverlay?.classList.add('hidden');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function toggleTheme() {
        const themes = ['system', 'light', 'dark'];
        const currentIndex = themes.indexOf(state.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        state.theme = themes[nextIndex];

        applyTheme(state.theme);
        localStorage.setItem('anhad_theme', state.theme);

        // Show toast
        const themeNames = { 'system': 'System', 'light': 'Light', 'dark': 'Dark' };
        showToast(`Theme: ${themeNames[state.theme]}`, 'info');

        vibrate(10);
    }

    function applyTheme(theme) {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    function vibrate(duration = 10) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    function showToast(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        // Add to container
        if (elements.toastContainer) {
            elements.toastContainer.appendChild(toast);
        } else {
            // Fallback: add to body
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 24px;
                background: var(--bg-elevated, #252540);
                color: var(--text-primary, #fff);
                font-size: 14px;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                z-index: 1101;
                animation: toastIn 0.25s ease-out;
            `;
            document.body.appendChild(toast);
        }

        // Remove after duration
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.2s ease-out forwards';
            setTimeout(() => toast.remove(), 200);
        }, duration);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
