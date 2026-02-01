/**
 * GURBANI KHOJ - Premium Edition with Theme Toggle
 * Fixed: Voice search extracts ONLY base consonants (no matras)
 * NEW: Search History, Favorites
 */

// ═══════════════════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API = {
    base: 'https://api.banidb.com/v2',
    timeout: 15000,
    perPage: 20
};

const SEARCH_TYPES = {
    0: 0,  // First Letter
    1: 1,  // Gurmukhi
    2: 4   // English (Transliteration)
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    searchInput: $('#searchInput'),
    searchBar: $('#searchBar'),
    clearBtn: $('#clearBtn'),
    micBtn: $('#micBtn'),
    keyboardBtn: $('#keyboardBtn'),
    voicePanel: $('#voicePanel'),
    voiceCancel: $('#voiceCancel'),
    themeToggle: $('#themeToggle'),

    resultsView: $('#resultsView'),
    resultsList: $('#resultsList'),
    resultsCount: $('#resultsCount'),
    loadMoreBtn: $('#loadMoreBtn'),

    loadingState: $('#loadingState'),
    emptyState: $('#emptyState'),
    emptyMessage: $('#emptyMessage'),
    welcomeState: $('#welcomeState'),
    historySection: $('#historySection'),
    historyList: $('#historyList'),

    keyboardOverlay: $('#keyboardOverlay'),
    keyboardPreview: $('#keyboardPreview'),
    keyboardDone: $('#keyboardDone'),

    settingsBtn: $('#settingsBtn'),
    settingsOverlay: $('#settingsOverlay'),
    settingsDone: $('#settingsDone'),

    toast: $('#toast'),
    toastText: $('#toastText')
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

const State = {
    query: '',
    searchType: 0,
    page: 1,
    totalPages: 1,
    searchedVerseId: null,
    isLoading: false,
    keyboardText: '',
    theme: 'light',
    searchHistory: [],
    favorites: []
};

// ═══════════════════════════════════════════════════════════════════════════════
// GURMUKHI MATRAS (Vowel Signs to Remove)
// ═══════════════════════════════════════════════════════════════════════════════

// All Gurmukhi matras (vowel signs) - these will be stripped
const GURMUKHI_MATRAS = /[\u0A3E-\u0A4C\u0A3C\u0A4D\u0A70\u0A71]/g;

// Base consonants range: ੳ ਅ ੲ ਸ ਹ ਕ ਖ ਗ ਘ ਙ ਚ ਛ ਜ ਝ ਞ ਟ ਠ ਡ ਢ ਣ ਤ ਥ ਦ ਧ ਨ ਪ ਫ ਬ ਭ ਮ ਯ ਰ ਲ ਵ ੜ ਸ਼ ਖ਼ ਗ਼ ਜ਼ ਫ਼
function getBaseConsonant(char) {
    // Remove all matras and diacritics
    return char.replace(GURMUKHI_MATRAS, '');
}

// Extract ONLY the first base consonant (no matra) from each word
function extractFirstLetters(text) {
    // Map English letters to Gurmukhi base consonants
    const englishToGurmukhi = {
        'a': 'ਅ', 'b': 'ਬ', 'c': 'ਚ', 'd': 'ਦ', 'e': 'ਏ', 'f': 'ਫ',
        'g': 'ਗ', 'h': 'ਹ', 'i': 'ਇ', 'j': 'ਜ', 'k': 'ਕ', 'l': 'ਲ',
        'm': 'ਮ', 'n': 'ਨ', 'o': 'ਓ', 'p': 'ਪ', 'q': 'ਕ', 'r': 'ਰ',
        's': 'ਸ', 't': 'ਤ', 'u': 'ਉ', 'v': 'ਵ', 'w': 'ਵ', 'x': 'ਕ',
        'y': 'ਯ', 'z': 'ਜ਼'
    };

    // Map Hindi/Devanagari to Gurmukhi BASE consonants ONLY
    // ALL vowels (अ आ इ ई उ ऊ ए ऐ ओ औ) -> ਅ (base vowel)
    const hindiToGurmukhi = {
        // ALL vowels map to ਅ (base)
        'अ': 'ਅ', 'आ': 'ਅ', 'इ': 'ਅ', 'ई': 'ਅ', 'उ': 'ਅ', 'ऊ': 'ਅ',
        'ए': 'ਅ', 'ऐ': 'ਅ', 'ओ': 'ਅ', 'औ': 'ਅ', 'ऋ': 'ਅ',
        // Consonants
        'क': 'ਕ', 'ख': 'ਖ', 'ग': 'ਗ', 'घ': 'ਘ', 'ङ': 'ਙ',
        'च': 'ਚ', 'छ': 'ਛ', 'ज': 'ਜ', 'झ': 'ਝ', 'ञ': 'ਞ',
        'ट': 'ਟ', 'ठ': 'ਠ', 'ड': 'ਡ', 'ढ': 'ਢ', 'ण': 'ਣ',
        'त': 'ਤ', 'थ': 'ਥ', 'द': 'ਦ', 'ध': 'ਧ', 'न': 'ਨ',
        'प': 'ਪ', 'फ': 'ਫ', 'ब': 'ਬ', 'भ': 'ਭ', 'म': 'ਮ',
        'य': 'ਯ', 'र': 'ਰ', 'ल': 'ਲ', 'व': 'ਵ',
        'श': 'ਸ', 'ष': 'ਸ', 'स': 'ਸ', 'ह': 'ਹ',
        'क़': 'ਕ', 'ख़': 'ਖ', 'ग़': 'ਗ', 'ज़': 'ਜ', 'फ़': 'ਫ',
        'ड़': 'ੜ', 'ढ़': 'ੜ'
    };

    // Hindi matras to strip
    const HINDI_MATRAS = /[\u093E-\u094C\u093C\u094D\u0902\u0903]/g;

    const words = text.trim().split(/\s+/);
    let result = '';

    for (const word of words) {
        if (!word) continue;

        // Get the first character and strip any matras
        let firstChar = word[0];

        // Check if it's Gurmukhi
        if (/[\u0A00-\u0A7F]/.test(firstChar)) {
            // Strip matras to get base consonant only
            let baseChar = getBaseConsonant(firstChar);
            // Normalize ALL Gurmukhi vowels to ਅ
            if (/[ਅਆਇਈਉਊਏਐਓਔੳੲ]/.test(baseChar)) {
                baseChar = 'ਅ';
            }
            if (baseChar) result += baseChar;
        }
        // Check if it's Hindi/Devanagari
        else if (/[\u0900-\u097F]/.test(firstChar)) {
            // Strip Hindi matras first
            const strippedChar = firstChar.replace(HINDI_MATRAS, '');
            // Map to Gurmukhi
            if (hindiToGurmukhi[strippedChar]) {
                result += hindiToGurmukhi[strippedChar];
            }
        }
        // Check if it's English
        else if (/[a-zA-Z]/.test(firstChar)) {
            const lower = firstChar.toLowerCase();
            if (englishToGurmukhi[lower]) {
                result += englishToGurmukhi[lower];
            }
        }
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════════════════════

const Theme = {
    init() {
        const saved = localStorage.getItem('gurbaniTheme') || 'light';
        this.set(saved);
    },

    toggle() {
        const newTheme = State.theme === 'light' ? 'dark' : 'light';
        this.set(newTheme);
        haptic('medium');
    },

    set(theme) {
        State.theme = theme;
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('gurbaniTheme', theme);

        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#0a0a0f' : '#f8f6f2';
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

const SearchHistory = {
    MAX_ITEMS: 10,

    load() {
        const saved = localStorage.getItem('gurbaniSearchHistory');
        State.searchHistory = saved ? JSON.parse(saved) : [];
        this.render();
    },

    add(query) {
        if (!query || query.length < 2) return;

        // Remove if already exists
        State.searchHistory = State.searchHistory.filter(h => h !== query);

        // Add to beginning
        State.searchHistory.unshift(query);

        // Limit to max items
        if (State.searchHistory.length > this.MAX_ITEMS) {
            State.searchHistory = State.searchHistory.slice(0, this.MAX_ITEMS);
        }

        localStorage.setItem('gurbaniSearchHistory', JSON.stringify(State.searchHistory));
        this.render();
    },

    remove(query) {
        State.searchHistory = State.searchHistory.filter(h => h !== query);
        localStorage.setItem('gurbaniSearchHistory', JSON.stringify(State.searchHistory));
        this.render();
    },

    clear() {
        State.searchHistory = [];
        localStorage.removeItem('gurbaniSearchHistory');
        this.render();
    },

    render() {
        if (!DOM.historyList) return;

        if (State.searchHistory.length === 0) {
            if (DOM.historySection) DOM.historySection.style.display = 'none';
            return;
        }

        if (DOM.historySection) DOM.historySection.style.display = 'block';

        DOM.historyList.innerHTML = State.searchHistory.map(query => `
            <button class="history-item" data-query="${encodeURIComponent(query)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>${query}</span>
                <button class="history-remove" data-remove="${encodeURIComponent(query)}">×</button>
            </button>
        `).join('');

        // Add click handlers
        DOM.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('history-remove')) {
                    e.stopPropagation();
                    this.remove(decodeURIComponent(e.target.dataset.remove));
                    haptic();
                    return;
                }
                const query = decodeURIComponent(item.dataset.query);
                DOM.searchInput.value = query;
                performSearch();
                haptic();
            });
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════════════════════════════════════

const Favorites = {
    load() {
        const saved = localStorage.getItem('gurbani_favorite_shabads');
        State.favorites = saved ? JSON.parse(saved) : [];
    },

    add(shabad) {
        if (!shabad || !shabad.shabadId) return;

        // Check if already exists
        const exists = State.favorites.find(f => f.shabadId === shabad.shabadId || f.id === shabad.shabadId);
        if (exists) return;

        // Save in unified format
        State.favorites.unshift({
            id: shabad.shabadId,
            shabadId: shabad.shabadId,
            gurmukhi: shabad.gurmukhi || '',
            translation: shabad.translation || '',
            english: shabad.translation || '',
            ang: shabad.ang || '',
            source: 'Gurbani Khoj',
            savedAt: Date.now()
        });
        localStorage.setItem('gurbani_favorite_shabads', JSON.stringify(State.favorites));
        showToast('Added to favorites ❤️');
    },

    remove(shabadId) {
        State.favorites = State.favorites.filter(f => f.shabadId !== shabadId && f.id !== shabadId);
        localStorage.setItem('gurbani_favorite_shabads', JSON.stringify(State.favorites));
        showToast('Removed from favorites');
    },

    isFavorite(shabadId) {
        return State.favorites.some(f => f.shabadId === shabadId || f.id === shabadId);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST & HAPTIC
// ═══════════════════════════════════════════════════════════════════════════════

function showToast(message) {
    DOM.toastText.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 3000);
}

function haptic(style = 'light') {
    if (navigator.vibrate) {
        navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 30);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const GurbaniAPI = {
    async search(query, type = 0, page = 1) {
        const searchType = SEARCH_TYPES[type] ?? 0;
        const url = `${API.base}/search/${encodeURIComponent(query)}?searchtype=${searchType}&source=G&page=${page}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Search failed');
        return response.json();
    },

    async getShabad(shabadId) {
        const url = `${API.base}/shabads/${shabadId}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Could not load Shabad');
        return response.json();
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function hideAllViews() {
    DOM.resultsView?.classList.remove('active');
    DOM.loadingState?.classList.remove('active');
    DOM.emptyState?.classList.remove('active');
    DOM.welcomeState?.classList.remove('active');
}

function showLoading() {
    hideAllViews();
    DOM.loadingState?.classList.add('active');
}

function showEmpty(message = 'Try searching with first letters') {
    hideAllViews();
    if (DOM.emptyMessage) DOM.emptyMessage.textContent = message;
    DOM.emptyState?.classList.add('active');
}

function showWelcome() {
    hideAllViews();
    DOM.welcomeState?.classList.add('active');
    SearchHistory.render();
}

function showResults() {
    hideAllViews();
    DOM.resultsView?.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

async function performSearch(append = false) {
    const query = DOM.searchInput.value.trim();

    if (!query) {
        showWelcome();
        return;
    }

    if (State.isLoading) return;
    State.isLoading = true;

    if (!append) {
        State.query = query;
        State.page = 1;
        DOM.resultsList.innerHTML = '';
        showLoading();

        // Add to history
        SearchHistory.add(query);
    }

    try {
        const data = await GurbaniAPI.search(query, State.searchType, State.page);

        if (!data.verses || data.verses.length === 0) {
            if (!append) showEmpty();
            return;
        }

        State.totalPages = data.resultsInfo?.pages?.totalPages || 1;
        displayResults(data.verses, append);

        const total = data.resultsInfo?.totalResults || data.verses.length;
        DOM.resultsCount.textContent = `${total} results`;

        DOM.loadMoreBtn.style.display = State.page < State.totalPages ? 'block' : 'none';
        showResults();

    } catch (error) {
        console.error('Search error:', error);
        showEmpty('Search failed. Please try again.');
    } finally {
        State.isLoading = false;
    }
}

function displayResults(verses, append = false) {
    const html = verses.map(verse => {
        const ang = verse.pageNo || verse.source?.pageNo || '';
        const raag = verse.raag?.english || '';
        const gurmukhi = verse.verse?.unicode || '';
        const translation = verse.translation?.en?.bdb || verse.translation?.en?.ms || '';
        const shabadId = verse.shabadId;
        const verseId = verse.verseId;
        const isFav = Favorites.isFavorite(shabadId);

        return `
            <article class="result-card" data-shabad="${shabadId}" data-verse="${verseId}">
                <div class="result-meta">
                    <span class="result-ang">Ang ${ang}</span>
                    <span class="result-raag">${raag}</span>
                    <button class="result-fav ${isFav ? 'active' : ''}" data-fav-shabad="${shabadId}" data-fav-ang="${ang}" data-fav-gurmukhi="${encodeURIComponent(gurmukhi)}">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>
                <p class="result-gurmukhi">${gurmukhi}</p>
                <p class="result-translation">${translation}</p>
            </article>
        `;
    }).join('');

    if (append) {
        DOM.resultsList.insertAdjacentHTML('beforeend', html);
    } else {
        DOM.resultsList.innerHTML = html;
    }

    // Add click handlers
    DOM.resultsList.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Check if favorite button was clicked
            if (e.target.classList.contains('result-fav')) {
                e.stopPropagation();
                const shabadId = e.target.dataset.favShabad;
                const ang = e.target.dataset.favAng;
                const gurmukhi = decodeURIComponent(e.target.dataset.favGurmukhi);

                if (Favorites.isFavorite(shabadId)) {
                    Favorites.remove(shabadId);
                    e.target.textContent = '🤍';
                    e.target.classList.remove('active');
                } else {
                    Favorites.add({ shabadId, ang, gurmukhi });
                    e.target.textContent = '❤️';
                    e.target.classList.add('active');
                }
                haptic();
                return;
            }

            haptic();
            const shabadId = card.dataset.shabad;
            const verseId = card.dataset.verse;

            // Navigate to full Shabad reader
            window.location.href = `shabad-reader.html?shabad=${shabadId}&verse=${verseId}`;
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE RECOGNITION
// ═══════════════════════════════════════════════════════════════════════════════

const VoiceSearch = {
    recognition: null,
    isListening: false,

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Voice not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'pa-IN';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoice(transcript);
        };

        this.recognition.onend = () => {
            this.stop();
        };

        this.recognition.onerror = (event) => {
            console.error('Voice error:', event.error);
            this.stop();
            if (event.error === 'no-speech') {
                showToast('No speech detected. Try again.');
            }
        };
    },

    async start() {
        if (!this.recognition) {
            showToast('Voice search not supported on this browser');
            return;
        }

        // Request microphone permission first (required on mobile)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
        } catch (permError) {
            console.error('Mic permission error:', permError);
            if (permError.name === 'NotAllowedError') {
                showToast('Please allow microphone access to use voice search');
            } else if (permError.name === 'NotFoundError') {
                showToast('No microphone found on this device');
            } else {
                showToast('Could not access microphone');
            }
            return;
        }

        this.isListening = true;
        DOM.micBtn.classList.add('listening');
        DOM.voicePanel.classList.add('active');

        try {
            this.recognition.start();
            haptic('medium');
        } catch (error) {
            console.error('Voice start error:', error);
            showToast('Could not start voice search. Try again.');
            this.stop();
        }
    },

    stop() {
        this.isListening = false;
        DOM.micBtn.classList.remove('listening');
        DOM.voicePanel.classList.remove('active');

        try {
            this.recognition?.stop();
        } catch (e) { }
    },

    async processVoice(transcript) {
        console.log('Voice transcript:', transcript);
        this.stop();

        // ALWAYS extract first letters (base consonants only, no matras)
        const firstLetters = extractFirstLetters(transcript);

        if (firstLetters.length >= 2) {
            console.log('Extracted first letters:', firstLetters);
            DOM.searchInput.value = firstLetters;
            State.searchType = 0; // First Letter search
            updateFilterUI();
            showToast(`Searching: ${firstLetters}`);
            await performSearch();
        } else {
            showToast('Could not extract letters. Try again.');
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════════════════════════

const Keyboard = {
    open() {
        State.keyboardText = DOM.searchInput.value;
        this.updatePreview();
        DOM.keyboardOverlay.classList.add('active');
        haptic();
    },

    close() {
        DOM.keyboardOverlay.classList.remove('active');
        DOM.searchInput.value = State.keyboardText;
        DOM.searchInput.focus();
    },

    updatePreview() {
        const preview = DOM.keyboardPreview.querySelector('.preview-text') || DOM.keyboardPreview;
        preview.textContent = State.keyboardText || '';
    },

    addChar(char) {
        State.keyboardText += char;
        this.updatePreview();
        haptic();
    },

    backspace() {
        State.keyboardText = State.keyboardText.slice(0, -1);
        this.updatePreview();
        haptic();
    },

    space() {
        State.keyboardText += ' ';
        this.updatePreview();
        haptic();
    },

    search() {
        this.close();
        performSearch();
        haptic('medium');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

const Settings = {
    open() {
        DOM.settingsOverlay.classList.add('active');
        haptic();
    },

    close() {
        DOM.settingsOverlay.classList.remove('active');
    },

    setFont(font) {
        document.documentElement.dataset.font = font;
        localStorage.setItem('gurbaniFont', font);

        $$('.font-options .setting-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.font === font);
        });
    },

    setBackground(bg) {
        document.documentElement.dataset.bg = bg;
        localStorage.setItem('gurbaniBg', bg);

        $$('.bg-options .setting-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.bg === bg);
        });
    },

    load() {
        const font = localStorage.getItem('gurbaniFont') || 'raavi';
        const bg = localStorage.getItem('gurbaniBg') || 'default';
        this.setFont(font);
        this.setBackground(bg);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER UI
// ═══════════════════════════════════════════════════════════════════════════════

function updateFilterUI() {
    $$('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', parseInt(pill.dataset.type) === State.searchType);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

function initEventListeners() {
    // Theme toggle
    DOM.themeToggle?.addEventListener('click', () => Theme.toggle());

    // Search input
    let searchTimeout;
    DOM.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (DOM.searchInput.value.trim()) {
                performSearch();
            } else {
                showWelcome();
            }
        }, 500);
    });

    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Clear
    DOM.clearBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        State.keyboardText = '';
        showWelcome();
        haptic();
    });

    // Mic
    DOM.micBtn.addEventListener('click', () => {
        if (VoiceSearch.isListening) {
            VoiceSearch.stop();
        } else {
            VoiceSearch.start();
        }
    });

    DOM.voiceCancel.addEventListener('click', () => {
        VoiceSearch.stop();
    });

    // Keyboard
    DOM.keyboardBtn.addEventListener('click', () => Keyboard.open());
    DOM.keyboardDone.addEventListener('click', () => Keyboard.close());

    DOM.keyboardOverlay.querySelector('.keyboard-backdrop').addEventListener('click', () => {
        Keyboard.close();
    });

    // Keyboard keys
    $$('.kb-key').forEach(key => {
        key.addEventListener('click', () => {
            const action = key.dataset.action;

            if (action === 'backspace') {
                Keyboard.backspace();
            } else if (action === 'space') {
                Keyboard.space();
            } else if (action === 'search') {
                Keyboard.search();
            } else {
                Keyboard.addChar(key.textContent);
            }
        });
    });

    // Filters
    $$('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            State.searchType = parseInt(pill.dataset.type);
            updateFilterUI();
            haptic();

            if (DOM.searchInput.value.trim()) {
                performSearch();
            }
        });
    });

    // Load more
    DOM.loadMoreBtn.addEventListener('click', () => {
        State.page++;
        performSearch(true);
        haptic();
    });

    // Settings
    DOM.settingsBtn?.addEventListener('click', () => Settings.open());
    DOM.settingsDone?.addEventListener('click', () => Settings.close());

    DOM.settingsOverlay?.querySelector('.settings-backdrop')?.addEventListener('click', () => {
        Settings.close();
    });

    $$('.font-options .setting-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            Settings.setFont(opt.dataset.font);
            haptic();
        });
    });

    $$('.bg-options .setting-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            Settings.setBackground(opt.dataset.bg);
            haptic();
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Settings.load();
    SearchHistory.load();
    Favorites.load();
    VoiceSearch.init();
    initEventListeners();
    showWelcome();

    console.log('Gurbani Khoj Premium initialized');
});
