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
    1: 1  // Gurmukhi (Full Word) - Always use this for best results
};

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-SOURCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const GURBANI_SOURCES = {
    G: { id: 'G', name: 'Sri Guru Granth Sahib Ji', shortName: 'SGGS', color: '#b8860b', priority: 1 },
    D: { id: 'D', name: 'Sri Dasam Granth Sahib Ji', shortName: 'Dasam', color: '#007aff', priority: 2 },
    B: { id: 'B', name: 'Bhai Gurdas Ji', shortName: 'Bhai Gurdas', color: '#34c759', priority: 3 },
    N: { id: 'N', name: 'Bhai Nand Lal Ji', shortName: 'Bhai Nand Lal', color: '#ff9500', priority: 4 }
};

// Force Gurmukhi search type - always returns 1
function getSearchType() {
    return 1; // Always Gurmukhi
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    searchInput: $('#searchInput'),
    searchBar: $('#searchBar'),
    keyboardBtn: $('#keyboardBtn'),
    micBtn: $('#micBtn'),
    clearBtn: $('#clearBtn'),
    voicePanel: $('#voicePanel'),
    voiceCancel: $('#voiceCancel'),
    voiceStatus: $('#voiceStatus'),
    voiceHint: $('#voiceHint'),
    voiceTranscriptPreview: $('#voiceTranscriptPreview'),
    themeToggle: $('#themeToggle'),

    resultsView: $('#resultsView'),
    resultsList: $('#resultsList'),
    resultsCount: $('#resultsCount'),
    loadMoreBtn: $('#loadMoreBtn'),

    loadingState: $('#loadingState'),
    emptyState: $('#emptyState'),
    emptyMessage: $('#emptyMessage'),
    welcomeState: $('#welcomeState'),

    keyboardOverlay: $('#keyboardOverlay'),
    keyboardPreview: $('#keyboardPreview'),

    historyBtn: $('#historyBtn'),
    historyOverlay: $('#historyOverlay'),
    historyClose: $('#historyClose'),
    historyClearAll: $('#historyClearAll'),
    historyListModal: $('#historyListModal'),
    historyEmpty: $('#historyEmpty'),

    toast: $('#toast'),
    toastText: $('#toastText'),

    // Live Kirtan Tracker
    liveKirtanCard: $('#liveKirtanCard'),

    // Background Layers
    guruBgContainer: $('#guruBgContainer'),
    guruBgImg1: $('#guruBgImg1'),
    guruBgImg2: $('#guruBgImg2'),

    // New Navigation and Screen Controls
    backBtn: $('#backBtn'),
    menuBtn: $('#menuBtn'),
    notificationBtn: $('#notificationBtn'),
    filterBtn: $('#filterBtn'),
    tabHome: $('#tabHome'),
    tabSearch: $('#tabSearch'),
    tabBookmarks: $('#tabBookmarks'),
    tabMore: $('#tabMore'),
    actionBarMic: $('#actionBarMic'),
    actionBarKeyboard: $('#actionBarKeyboard')
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

const State = {
    query: '',
    searchType: 1,  // Default to Gurmukhi (was 0 for First Letter)
    page: 1,
    totalPages: 1,
    searchedVerseId: null,
    isLoading: false,
    keyboardText: '',
    theme: 'light',
    favorites: [],
    sourceFilter: 'all', // 'all' | 'G' | 'D' | 'B' | 'N'
    allResults: [] // Store all results for client-side filtering
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
    // Map English letters to Gurmukhi base consonants (NO matras)
    const englishToGurmukhi = {
        'a': 'ਅ', 'b': 'ਬ', 'c': 'ਚ', 'd': 'ਦ', 'e': 'ਏ', 'f': 'ਫ',
        'g': 'ਗ', 'h': 'ਹ', 'i': 'ਇ', 'j': 'ਜ', 'k': 'ਕ', 'l': 'ਲ',
        'm': 'ਮ', 'n': 'ਨ', 'o': 'ਓ', 'p': 'ਪ', 'q': 'ਕ', 'r': 'ਰ',
        's': 'ਸ', 't': 'ਤ', 'u': 'ੳ', 'v': 'ਵ', 'w': 'ਵ', 'x': 'ਕ',
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
            // Convert standalone vowels to their base consonant form
            if (baseChar === 'ਉ') baseChar = 'ੳ';
            if (baseChar === 'ਊ') baseChar = 'ੳ';
            if (baseChar === 'ਇ') baseChar = 'ੲ';
            if (baseChar === 'ਈ') baseChar = 'ੲ';
            if (baseChar === 'ਏ') baseChar = 'ੲ';
            // Normalize remaining standalone vowels to ਅ
            if (/[ਅਆਐਓਔ]/.test(baseChar)) {
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
// BACKGROUND MANAGER & SEARCH SYNC
// ═══════════════════════════════════════════════════════════════════════════════

const BackgroundManager = {
    images: [
        'gurunanakdevsahebji.jpeg',
        'gurugranthsahebji.jpeg',
        'gurugobindsinghsahebji.jpeg',
        'guruangaddevsahebji.jpeg',
        'guruamardasji.jpeg',
        'gururamdassahebji.jpeg',
        'guruarjanddevsahebji.jpeg',
        'guruhargobindsahebji.jpeg',
        'guruharraisahebji.jpeg',
        'guruharkrishansahebji.jpeg',
        'gurutegbahadursahebji.jpeg'
    ],
    currentIndex: 0,
    timer: null,

    init() {
        // Start background image cycling
        this.start();
        this.updateBlurState();
    },

    start() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.next();
        }, 15000); // 15 seconds cycle for richer active feel
    },

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    next() {
        if (!DOM.guruBgImg1 || !DOM.guruBgImg2) return;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        const newImageSrc = `../guruimages/${this.images[this.currentIndex]}`;

        const activeImg = DOM.guruBgImg1.classList.contains('active') ? DOM.guruBgImg1 : DOM.guruBgImg2;
        const inactiveImg = activeImg === DOM.guruBgImg1 ? DOM.guruBgImg2 : DOM.guruBgImg1;

        inactiveImg.src = newImageSrc;
        inactiveImg.onload = () => {
            inactiveImg.classList.add('active');
            activeImg.classList.remove('active');
        };
    },

    updateBlurState() {
        const hasText = !!(DOM.searchInput && DOM.searchInput.value.trim());
        if (DOM.guruBgContainer) {
            DOM.guruBgContainer.classList.toggle('blurred', hasText);
        }
    }
};

function updateSearchInput(value) {
    if (DOM.searchInput) {
        DOM.searchInput.value = value;
    }
    State.keyboardText = value;
    if (DOM.clearBtn) {
        DOM.clearBtn.style.display = value.trim() ? 'block' : 'none';
    }
    BackgroundManager.updateBlurState();
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════════════════════

const Theme = {
    init() {
        // ── Sync with global app theme (anhad_theme) first ──
        const globalTheme = localStorage.getItem('anhad_theme');
        if (globalTheme) {
            this.set(globalTheme);
        } else {
            const darkFlag = localStorage.getItem('anhad_dark_mode');
            if (darkFlag === 'true') this.set('dark');
            else if (darkFlag === 'false') this.set('light');
            else this.set(localStorage.getItem('gurbaniTheme') || 'light');
        }
    },

    toggle() {
        // Disable all transitions for instant theme switch
        document.documentElement.classList.add('no-transitions');
        const newTheme = State.theme === 'light' ? 'dark' : 'light';
        this.set(newTheme);
        // Sync to global theme key
        localStorage.setItem('anhad_theme', newTheme);
        haptic('medium');
        // Re-enable transitions after paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.documentElement.classList.remove('no-transitions');
            });
        });
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
// HISTORY TRACKER (RECENT SHABAD HISTORY)
// ═══════════════════════════════════════════════════════════════════════════════

const HistoryTracker = {
    addShabad(shabadId, gurmukhiText, angText) {
        try {
            const raw = localStorage.getItem('gurbani_shabad_history');
            let history = raw ? JSON.parse(raw) : [];
            
            // Remove if already exists
            history = history.filter(h => String(h.id) !== String(shabadId));
            
            // Add to front
            history.unshift({
                id: shabadId,
                ang: parseInt(angText) || angText || '',
                firstLine: gurmukhiText || '',
                timestamp: Date.now()
            });
            
            // Keep only last 20
            history = history.slice(0, 20);
            
            localStorage.setItem('gurbani_shabad_history', JSON.stringify(history));
        } catch (e) {
            console.error('Error saving shabad history:', e);
        }
    }
};

const WelcomeScreen = {
    init() {
        this.renderRecent();
        this.renderBookmarks();
    },

    renderRecent() {
        const container = document.getElementById('welcomeRecentList');
        const section = document.getElementById('welcomeRecentSection');
        if (!container || !section) return;

        try {
            const raw = localStorage.getItem('gurbani_shabad_history');
            const history = raw ? JSON.parse(raw) : [];

            if (history.length === 0) {
                section.style.display = 'none';
                return;
            }

            section.style.display = 'block';
            container.innerHTML = history.slice(0, 10).map(item => {
                const angText = item.ang ? `Ang ${item.ang}` : '';
                return `
                    <div class="scroll-card" data-shabad="${item.id}">
                        <div class="scroll-card-header">
                            <span class="scroll-card-title">Recent Shabad</span>
                            <span class="scroll-card-source">${angText}</span>
                        </div>
                        <div class="scroll-card-text">${item.firstLine || 'Click to view'}</div>
                        <div class="scroll-card-footer">
                            <span>Open Shabad</span>
                            <span style="font-size: 14px;">›</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind click events
            container.querySelectorAll('.scroll-card').forEach(card => {
                card.addEventListener('click', () => {
                    haptic();
                    const shabadId = card.dataset.shabad;
                    window.location.href = `shabad-reader.html?shabad=${shabadId}`;
                });
            });
        } catch (e) {
            console.error('Error rendering recent on welcome screen:', e);
        }
    },

    renderBookmarks() {
        const container = document.getElementById('welcomeBookmarksList');
        const section = document.getElementById('welcomeBookmarksSection');
        if (!container || !section) return;

        try {
            const raw = localStorage.getItem('gurbani_favorite_shabads');
            const favorites = raw ? JSON.parse(raw) : [];

            if (favorites.length === 0) {
                section.style.display = 'none';
                return;
            }

            section.style.display = 'block';
            container.innerHTML = favorites.slice(0, 10).map(item => {
                const angText = item.ang ? `Ang ${item.ang}` : '';
                const source = item.source || 'Gurbani';
                return `
                    <div class="scroll-card" data-shabad="${item.shabadId || item.id}">
                        <div class="scroll-card-header">
                            <span class="scroll-card-title" style="color: #c8a96a;">Saved Shabad</span>
                            <span class="scroll-card-source">${source}</span>
                        </div>
                        <div class="scroll-card-text">${item.gurmukhi || 'Click to view'}</div>
                        <div class="scroll-card-footer">
                            <span>${angText}</span>
                            <span style="font-size: 14px; color: #ff2d55;">❤️</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind click events
            container.querySelectorAll('.scroll-card').forEach(card => {
                card.addEventListener('click', () => {
                    haptic();
                    const shabadId = card.dataset.shabad;
                    window.location.href = `shabad-reader.html?shabad=${shabadId}`;
                });
            });
        } catch (e) {
            console.error('Error rendering bookmarks on welcome screen:', e);
        }
    }
};

window.WelcomeScreen = WelcomeScreen;

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
    // Search a single source
    async searchSource(query, type = 0, page = 1, resultsPerPage = null, source = 'G') {
        const searchType = SEARCH_TYPES[type] ?? 0;
        const perPage = resultsPerPage || API.perPage;
        const url = `${API.base}/search/${encodeURIComponent(query)}?searchtype=${searchType}&source=${source}&page=${page}&results=${perPage}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API.timeout);

            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Search failed for source ${source}: ${response.status}`);
            }

            const data = await response.json();

            // Add source attribution to each verse
            if (data.verses && Array.isArray(data.verses)) {
                data.verses.forEach(verse => {
                    verse._source = GURBANI_SOURCES[source];
                });
            }

            return data;
        } catch (error) {
            console.warn(`Search API Error for source ${source}:`, error.message);
            // Return empty result instead of throwing to allow partial results
            return { verses: [], resultsInfo: { totalResults: 0 } };
        }
    },

    // Search all sources in parallel
    async searchAllSources(query, type = 0, page = 1, resultsPerPage = null) {
        const sources = Object.keys(GURBANI_SOURCES);

        // Search all sources in parallel
        const searchPromises = sources.map(sourceId =>
            this.searchSource(query, type, page, resultsPerPage, sourceId)
        );

        const results = await Promise.all(searchPromises);

        // Merge all verses and sort by relevance (keeping source priority)
        let allVerses = [];
        let totalResults = 0;

        results.forEach((result, index) => {
            const sourceId = sources[index];
            const sourceInfo = GURBANI_SOURCES[sourceId];

            if (result.verses && result.verses.length > 0) {
                // Add source priority for sorting
                result.verses.forEach(verse => {
                    verse._sourcePriority = sourceInfo.priority;
                });
                allVerses = allVerses.concat(result.verses);
            }

            totalResults += result.resultsInfo?.totalResults || 0;
        });

        // Sort by source priority (SGGS first, then Dasam, etc.)
        allVerses.sort((a, b) => a._sourcePriority - b._sourcePriority);

        return {
            verses: allVerses,
            resultsInfo: {
                totalResults: totalResults,
                pages: { totalPages: Math.ceil(allVerses.length / (resultsPerPage || API.perPage)) }
            }
        };
    },

    // Legacy single-source search (for backward compatibility)
    async search(query, type = 0, page = 1, resultsPerPage = null) {
        return this.searchAllSources(query, type, page, resultsPerPage);
    },

    async getShabad(shabadId) {
        const url = `${API.base}/shabads/${shabadId}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API.timeout);

            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to load Shabad with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid shabad data');
            }
            
            return data;
        } catch (error) {
            console.error('Shabad API Error:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please check your connection.');
            }
            throw new Error('Could not load Shabad. Please check your connection and try again.');
        }
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
    document.body.classList.remove('has-results');
}

function showLoading() {
    hideAllViews();
    DOM.loadingState?.classList.add('active');
    DOM.guruBgContainer?.classList.add('blurred');
}

function showEmpty(message = 'Try searching with first letters') {
    hideAllViews();
    if (DOM.emptyMessage) DOM.emptyMessage.textContent = message;
    DOM.emptyState?.classList.add('active');
    DOM.guruBgContainer?.classList.add('blurred');
}

function showWelcome() {
    hideAllViews();
    DOM.welcomeState?.classList.add('active');
    DOM.guruBgContainer?.classList.remove('blurred');
    if (window.WelcomeScreen) {
        WelcomeScreen.init();
    }
}

function showResults() {
    hideAllViews();
    DOM.resultsView?.classList.add('active');
    document.body.classList.add('has-results');
    DOM.guruBgContainer?.classList.add('blurred');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH LOGIC (Gurmukhi Only)
// ═══════════════════════════════════════════════════════════════════════════════

async function performSearch(append = false) {
    const query = DOM.searchInput.value.trim();

    if (!query) {
        sessionStorage.removeItem('gurbaniKhoj_state');
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
    }

    try {
        // First try to search from cache
        const cachedResults = GurbaniCache.search(query, State.sourceFilter);
        
        let data;
        let fromCache = false;

        if (cachedResults.verses && cachedResults.verses.length > 0) {
            // Use cached results
            data = { verses: cachedResults.verses, resultsInfo: { totalResults: cachedResults.verses.length } };
            fromCache = true;
            console.log(`Found ${cachedResults.verses.length} results in cache`);
            
            if (cachedResults.totalInCache) {
                showToast(`Offline: ${cachedResults.totalInCache} verses cached`);
            }
        } else {
            // If no cache results or insufficient, try API
            try {
                // Always use Gurmukhi search type (1) for best results
                data = await GurbaniAPI.search(query, 1, State.page);
                
                // Cache the API results
                if (data.verses && data.verses.length > 0) {
                    GurbaniCache.addVerses(data.verses);
                }
            } catch (apiError) {
                // If API fails, try cache again with broader search
                console.log('API failed, trying cache fallback:', apiError.message);
                const fallbackResults = GurbaniCache.search(query.substring(0, 2), 'all');
                if (fallbackResults.verses && fallbackResults.verses.length > 0) {
                    data = { verses: fallbackResults.verses, resultsInfo: { totalResults: fallbackResults.verses.length } };
                    fromCache = true;
                    showToast('Showing cached results (offline)');
                } else {
                    throw apiError;
                }
            }
        }

        if (!data.verses || data.verses.length === 0) {
            if (!append) showEmpty();
            return;
        }

        // Add to history with timestamp and result count
        if (!append && data.verses.length > 0) {
            const firstVerse = data.verses[0];
            const sourceName = firstVerse._source?.shortName || 'All Sources';
            History.add({
                query: query,
                gurmukhi: firstVerse.verse?.unicode || firstVerse.gurmukhi || query,
                source: sourceName,
                resultCount: data.verses.length,
                timestamp: Date.now()
            });
        }

        State.totalPages = data.resultsInfo?.pages?.totalPages || 1;

        // Store all results for client-side filtering
        if (!append) {
            State.allResults = data.verses || [];
        } else {
            State.allResults = State.allResults.concat(data.verses || []);
        }

        // Apply source filter if needed
        const filteredResults = State.sourceFilter === 'all'
            ? State.allResults
            : filterResultsBySource(State.allResults, State.sourceFilter);

        displayResults(filteredResults, append);
        updateResultsCount(filteredResults.length, State.allResults.length);
        showResults();

        if (fromCache) {
            // Show cache indicator
            const cacheIndicator = document.createElement('div');
            cacheIndicator.className = 'cache-indicator';
            cacheIndicator.textContent = '📴 Offline';
            cacheIndicator.style.cssText = 'position: fixed; bottom: 80px; right: 20px; background: rgba(52, 199, 89, 0.9); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; z-index: 1000;';
            document.body.appendChild(cacheIndicator);
            setTimeout(() => cacheIndicator.remove(), 2000);
        }

    } catch (error) {
        console.error('Search error:', error);
        const errorMessage = error.message || 'Failed to load Gurbani. Please check your connection and try again.';
        showEmpty(errorMessage);
        showToast(errorMessage);
    } finally {
        State.isLoading = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCE FILTERING
// ═══════════════════════════════════════════════════════════════════════════════

function filterResultsBySource(results, sourceFilter) {
    if (sourceFilter === 'all') return results;
    return results.filter(verse => {
        const source = verse._source || GURBANI_SOURCES.G;
        return source.id === sourceFilter;
    });
}

function updateResultsCount(filtered, total) {
    const sourceName = State.sourceFilter === 'all'
        ? 'All Sources'
        : (GURBANI_SOURCES[State.sourceFilter]?.name || State.sourceFilter);
    DOM.resultsCount.textContent = `Found ${filtered} Results`;
    const detail = document.getElementById('resultsSourceDetail');
    if (detail) detail.textContent = `Shabads from ${sourceName}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// iOS NOTES STYLE SEARCH HIGHLIGHTING
// ═══════════════════════════════════════════════════════════════════════════════

function highlightSearchTerm(text, query) {
    if (!query || !text) return text;
    
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex that matches the query (case-insensitive for Gurmukhi)
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // Replace matches with highlighted span
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function displayResults(verses, append = false) {
    const query = State.query || DOM.searchInput.value.trim();

    const html = verses.map((verse, index) => {
        const ang = verse.pageNo || verse.source?.pageNo || '';
        const gurmukhiRaw = verse.verse?.unicode || '';
        const shabadId = verse.shabadId;
        const verseId = verse.verseId;

        // Get source info
        const source = verse._source || GURBANI_SOURCES.G;

        // Apply search highlighting
        const gurmukhi = query ? highlightSearchTerm(gurmukhiRaw, query) : gurmukhiRaw;

        // Check if shabad is in favorites
        const isFav = Favorites.isFavorite(shabadId);

        // Stagger animation delay
        const animDelay = Math.min(index * 35, 350);

        // Build title from raag + writer like the reference image: "ਰਾਮਕਲੀ ਮਹਲਾ ੫"
        const writer = verse.writer?.unicode || verse.writer?.english || '';
        const raag = verse.raag?.unicode || verse.raag?.english || '';
        let cardTitle = '';
        if (raag && writer) {
            cardTitle = `${raag} ${writer}`;
        } else if (raag) {
            cardTitle = raag;
        } else if (writer) {
            cardTitle = writer;
        } else {
            cardTitle = source.shortName;
        }

        const bookmarkSvgFill = isFav ? 'currentColor' : 'none';

        return `
<article class="result-card" data-shabad="${shabadId}" data-verse="${verseId}" data-source="${source.id}" style="animation-delay:${animDelay}ms">
  <div class="result-card-header">
    <span class="result-gurmukhi-title">${cardTitle}</span>
    <button class="result-bookmark-btn ${isFav ? 'active' : ''}" data-shabad="${shabadId}" aria-label="Bookmark">
      <svg viewBox="0 0 24 24" fill="${bookmarkSvgFill}" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  </div>
  <p class="result-gurmukhi">${gurmukhi}</p>
  <div class="result-meta">
    <span class="result-source-text">${source.name}</span>
    <span class="result-meta-dot"></span>
    <span class="result-ang">Ang ${ang}</span>
  </div>
</article>`;
    }).join('');

    if (append) {
        DOM.resultsList.insertAdjacentHTML('beforeend', html);
    } else {
        DOM.resultsList.innerHTML = html;
    }

    // Show/hide load more
    if (DOM.loadMoreBtn) {
        DOM.loadMoreBtn.classList.toggle('visible', State.page < State.totalPages);
    }

    // Add click handlers for navigation and bookmarking
    DOM.resultsList.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const bookmarkBtn = e.target.closest('.result-bookmark-btn');
            if (bookmarkBtn) {
                e.stopPropagation();
                haptic();
                const shabadId = bookmarkBtn.dataset.shabad;
                const svg = bookmarkBtn.querySelector('svg');
                if (Favorites.isFavorite(shabadId)) {
                    Favorites.remove(shabadId);
                    bookmarkBtn.classList.remove('active');
                    svg.setAttribute('fill', 'none');
                } else {
                    const gurmukhiText = card.querySelector('.result-gurmukhi')?.textContent || '';
                    const angText = card.querySelector('.result-ang')?.textContent.replace('Ang ', '') || '';
                    Favorites.add({ shabadId, gurmukhi: gurmukhiText, ang: angText, translation: '' });
                    bookmarkBtn.classList.add('active');
                    svg.setAttribute('fill', 'currentColor');
                }
                return;
            }

            haptic();
            const shabadId = card.dataset.shabad;
            const verseId = card.dataset.verse;
            
            // Track in recent shabad history
            const gurmukhiText = card.querySelector('.result-gurmukhi')?.textContent || '';
            const angText = card.querySelector('.result-ang')?.textContent.replace('Ang ', '') || '';
            HistoryTracker.addShabad(shabadId, gurmukhiText, angText);

            try {
                sessionStorage.setItem('gurbaniKhoj_state', JSON.stringify({
                    query: State.query,
                    inputValue: DOM.searchInput.value,
                    allResults: State.allResults,
                    sourceFilter: State.sourceFilter,
                    scrollY: window.scrollY,
                    page: State.page,
                    totalPages: State.totalPages
                }));
            } catch (err) {}
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
        console.log('VoiceSearch.init() called');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        console.log('SpeechRecognition available:', !!SpeechRecognition);

        // In Capacitor WebView, SpeechRecognition is not available
        const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

        if (!SpeechRecognition) {
            console.warn('Voice not supported');
            if (DOM.micBtn) {
                // Don't hide — let user tap and see message
                DOM.micBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (isCapacitor) {
                        showToast('Voice search is not available in the app. Please use the Gurmukhi keyboard instead.');
                    } else {
                        showToast('Voice search not supported on this browser');
                    }
                });
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pa-IN';
        this.silenceTimer = null;
        this.transcriptBuffer = '';
        this.isProcessing = false;

        this.recognition.onresult = (event) => {
            // Clear any pending silence timer
            if (this.silenceTimer) {
                clearTimeout(this.silenceTimer);
                this.silenceTimer = null;
            }

            // Get the latest transcript
            const results = event.results;
            if (results.length > 0) {
                const lastResult = results[results.length - 1];
                this.transcriptBuffer = lastResult[0].transcript;

                // Update live transcript preview in voice panel
                if (DOM.voiceTranscriptPreview) {
                    DOM.voiceTranscriptPreview.textContent = this.transcriptBuffer;
                }

                // Update status text based on state
                if (DOM.voiceStatus) {
                    DOM.voiceStatus.textContent = lastResult.isFinal ? 'Processing...' : 'Listening...';
                }

                // Add processing state styling when final
                if (lastResult.isFinal && DOM.voicePanel) {
                    DOM.voicePanel.classList.add('processing');
                }

                // Show interim preview in toast for feedback
                if (!lastResult.isFinal) {
                    showToast(`Hearing: ${this.transcriptBuffer}`);
                }
            }

            // If this was a final result, start the silence timer
            const lastResult = results[results.length - 1];
            if (lastResult.isFinal) {
                this.silenceTimer = setTimeout(() => {
                    this.processBufferedVoice();
                }, 500); // 0.5 second silence before search - faster response
            }
        };

        this.recognition.onend = () => {
            // Restart if still listening (unless we're processing)
            if (this.isListening && !this.isProcessing) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.log('Restart failed:', e);
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Voice error:', event.error);
            if (event.error === 'no-speech') {
                // Don't stop on no-speech, just ignore and keep listening
                return;
            }
            this.stop();
            if (event.error !== 'aborted') {
                showToast('Voice error. Try again.');
            }
        };
    },

    async start() {
        // Prevent starting if already listening
        if (this.isListening) {
            console.log('VoiceSearch: Already listening');
            return;
        }

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
        this.isProcessing = false;
        this.transcriptBuffer = '';

        // Reset UI state
        DOM.micBtn.classList.add('listening');
        DOM.voicePanel.classList.add('active');
        DOM.voicePanel.classList.remove('processing');

        // Reset voice panel UI
        if (DOM.voiceStatus) DOM.voiceStatus.textContent = 'Listening...';
        if (DOM.voiceHint) DOM.voiceHint.textContent = 'Speak a Gurbani line';
        if (DOM.voiceTranscriptPreview) DOM.voiceTranscriptPreview.textContent = '';

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
        this.isProcessing = false;
        DOM.micBtn.classList.remove('listening');
        DOM.voicePanel.classList.remove('active');
        DOM.voicePanel.classList.remove('processing');

        // Clear any pending timer
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }

        // Clear transcript preview
        if (DOM.voiceTranscriptPreview) {
            DOM.voiceTranscriptPreview.textContent = '';
        }

        try {
            this.recognition?.stop();
        } catch (e) { }
    },

    async processBufferedVoice() {
        if (!this.transcriptBuffer || this.isProcessing) return;
        
        this.isProcessing = true;
        const transcript = this.transcriptBuffer;
        this.transcriptBuffer = '';
        
        console.log('Processing after silence:', transcript);
        this.stop();

        // ALWAYS extract first letters (base consonants only, no matras)
        const firstLetters = extractFirstLetters(transcript);

        if (firstLetters.length >= 2) {
            console.log('Extracted first letters:', firstLetters);
            updateSearchInput(firstLetters);
            showToast(`Searching: ${firstLetters}`);
            await performSearch();
        } else {
            showToast('Could not extract letters. Try again.');
        }
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════════════════════════

const Keyboard = {
    open() {
        State.keyboardText = DOM.searchInput.value || '';
        DOM.keyboardOverlay.classList.add('active');
        document.body.classList.add('keyboard-open');
        this.updatePreview();
        haptic();
    },

    close() {
        DOM.keyboardOverlay.classList.remove('active');
        document.body.classList.remove('keyboard-open');
        updateSearchInput(State.keyboardText);
    },

    addChar(char) {
        State.keyboardText += char;
        updateSearchInput(State.keyboardText);
        this.updatePreview();
        haptic();
    },

    backspace() {
        State.keyboardText = State.keyboardText.slice(0, -1);
        updateSearchInput(State.keyboardText);
        this.updatePreview();
        haptic();
    },

    space() {
        State.keyboardText += ' ';
        updateSearchInput(State.keyboardText);
        this.updatePreview();
        haptic();
    },

    search() {
        updateSearchInput(State.keyboardText);
        this.close();
        performSearch();
        haptic('medium');
    },

    updatePreview() {
        if (DOM.keyboardPreview) {
            DOM.keyboardPreview.textContent = State.keyboardText || '';
        }
    }
};

// Make Keyboard global for HTML onclick handlers
window.Keyboard = Keyboard;

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

const History = {
    items: [],

    open() {
        // Navigate to dedicated history page
        haptic();
        window.location.href = 'search-history.html';
    },

    close() {
        DOM.historyOverlay.classList.remove('active');
    },

    add(item) {
        // Ensure timestamp exists
        if (!item.timestamp) item.timestamp = Date.now();
        // Add to beginning, remove duplicates, keep max 50
        this.items = this.items.filter(i => i.query !== item.query);
        this.items.unshift(item);
        if (this.items.length > 50) this.items.pop();
        this.save();
    },

    clear() {
        this.items = [];
        this.save();
        this.render();
        showToast('History cleared');
    },

    save() {
        localStorage.setItem('gurbaniHistory', JSON.stringify(this.items));
    },

    load() {
        try {
            const saved = localStorage.getItem('gurbaniHistory');
            if (saved) {
                this.items = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    },

    render() {
        if (!DOM.historyListModal) return;

        if (this.items.length === 0) {
            DOM.historyListModal.innerHTML = '';
            DOM.historyEmpty.classList.add('active');
            if (DOM.historyClearAll) DOM.historyClearAll.style.display = 'none';
            return;
        }

        DOM.historyEmpty.classList.remove('active');
        if (DOM.historyClearAll) DOM.historyClearAll.style.display = 'block';

        DOM.historyListModal.innerHTML = this.items.map((item, index) => `
            <button class="history-item-modal" data-index="${index}" onclick="History.select(${index})">
                <div class="history-gurmukhi">${item.gurmukhi || item.query}</div>
                <div class="history-source">${item.source || 'All Sources'}</div>
            </button>
        `).join('');
    },

    select(index) {
        const item = this.items[index];
        if (item && item.query) {
            updateSearchInput(item.query);
            this.close();
            performSearch();
            haptic();
        }
    }
};

// Make History global
window.History = History;

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
    // Nav bar actions
    DOM.menuBtn?.addEventListener('click', () => {
        haptic();
        window.location.href = '../index.html';
    });

    DOM.notificationBtn?.addEventListener('click', () => {
        haptic();
        window.location.href = '../reminders/smart-reminders-v7.html';
    });

    // Theme toggle
    DOM.themeToggle?.addEventListener('click', () => Theme.toggle());

    // Clear search button
    DOM.clearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateSearchInput('');
        sessionStorage.removeItem('gurbaniKhoj_state');
        showWelcome();
        haptic();
    });

    // Search input with debounced search
    let searchTimeout;
    DOM.searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        State.keyboardText = val;
        DOM.clearBtn.style.display = val.trim() ? 'block' : 'none';
        BackgroundManager.updateBlurState();

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (DOM.searchInput.value.trim()) {
                performSearch();
            } else {
                showWelcome();
            }
        }, 350); // Faster 350ms debounce for better responsiveness
    });

    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Mic buttons
    DOM.micBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!VoiceSearch.isListening) {
            VoiceSearch.start();
        }
    });

    DOM.actionBarMic?.addEventListener('click', (e) => {
        e.stopPropagation();
        VoiceSearch.start();
    });

    $('#voiceMicTrigger')?.addEventListener('click', (e) => {
        e.stopPropagation();
        haptic();
        if (VoiceSearch.isListening) {
            VoiceSearch.stop();
        } else {
            VoiceSearch.start();
        }
    });

    // Keyboard buttons
    DOM.keyboardBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        Keyboard.open();
    });

    DOM.actionBarKeyboard?.addEventListener('click', (e) => {
        e.stopPropagation();
        Keyboard.open();
    });

    // Search bar - open keyboard when clicking (not the buttons)
    DOM.searchBar?.addEventListener('click', (e) => {
        // Don't open if clicking mic button or keyboard button
        if (e.target.closest('#micBtn') || e.target.closest('#keyboardBtn')) return;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
        if (!isMobile) {
            DOM.searchInput?.focus();
        } else {
            // Open Gurmukhi keyboard
            Keyboard.open();
        }
    });

    DOM.voiceCancel?.addEventListener('click', () => {
        VoiceSearch.stop();
    });

    $('#voiceBackBtn')?.addEventListener('click', () => {
        VoiceSearch.stop();
    });

    // Click on backdrop closes keyboard
    DOM.keyboardOverlay?.querySelector('.keyboard-backdrop')?.addEventListener('click', (e) => {
        e.stopPropagation();
        Keyboard.close();
    });

    // Keyboard keys - use both click and touch events for mobile
    // Premium iOS Virtual Keyboard Event Handler
    const keyboardBody = DOM.keyboardOverlay?.querySelector('.keyboard-body');
    if (keyboardBody) {
        // Strip inline onclick handlers dynamically to guarantee zero double-typing bugs
        DOM.keyboardOverlay.querySelectorAll('.kb-key').forEach(key => {
            key.removeAttribute('onclick');
        });

        let activePreviewBubble = null;
        let activeKeyEl = null;

        const removeBubble = () => {
            if (activePreviewBubble) {
                activePreviewBubble.remove();
                activePreviewBubble = null;
            }
            if (activeKeyEl) {
                activeKeyEl.classList.remove('pressed');
                activeKeyEl = null;
            }
        };

        const handleKeyPointerDown = (e) => {
            const key = e.target.closest('.kb-key');
            if (!key) return;

            e.preventDefault();
            e.stopPropagation();

            removeBubble();

            let action = key.dataset.action;
            if (!action) {
                if (key.classList.contains('backspace-key') || key.closest('.backspace-key')) {
                    action = 'backspace';
                } else if (key.classList.contains('space-key') || key.closest('.space-key')) {
                    action = 'space';
                } else if (key.classList.contains('search-action') || key.closest('.search-action')) {
                    action = 'search';
                }
            }
            const text = key.textContent.trim();

            // Tactile key press effect
            key.classList.add('pressed');
            activeKeyEl = key;

            // Trigger action
            if (action === 'backspace') {
                Keyboard.backspace();
            } else if (action === 'space' || text.toLowerCase() === 'space') {
                Keyboard.space();
            } else if (action === 'search') {
                Keyboard.search();
            } else {
                Keyboard.addChar(text);

                // Show native iOS style Key Preview Bubble above character keys
                const rect = key.getBoundingClientRect();
                const bubble = document.createElement('div');
                bubble.className = 'kb-key-preview-bubble';
                bubble.textContent = text;
                document.body.appendChild(bubble);

                const bubbleWidth = 56;
                const bubbleHeight = 68;
                const top = rect.top - bubbleHeight - 6;
                const left = rect.left + (rect.width / 2) - (bubbleWidth / 2);

                bubble.style.cssText = `
                    position: fixed;
                    top: ${top}px;
                    left: ${left}px;
                    width: ${bubbleWidth}px;
                    height: ${bubbleHeight}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--ios-glass-key-preview, rgba(255, 255, 255, 0.98));
                    color: #000;
                    font-size: 26px;
                    font-weight: 600;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    pointer-events: none;
                    z-index: 100000;
                    transform-origin: bottom center;
                    animation: kbPreviewPop 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                `;
                activePreviewBubble = bubble;
            }
        };

        keyboardBody.addEventListener('pointerdown', handleKeyPointerDown);
        
        // Clean up preview bubbles on lift/leave
        window.addEventListener('pointerup', removeBubble);
        window.addEventListener('pointercancel', removeBubble);
        keyboardBody.addEventListener('pointerleave', removeBubble);
    }

    // Live Kirtan Tracker
    DOM.liveKirtanCard?.addEventListener('click', () => {
        if (window.LiveKirtanTracker) {
            window.LiveKirtanTracker.openPanel();
        }
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

    // Source filter chips
    $$('.source-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            $$('.source-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Update state
            State.sourceFilter = chip.dataset.source;
            haptic();

            // Re-display results with filter applied
            if (State.allResults.length > 0) {
                const filtered = filterResultsBySource(State.allResults, State.sourceFilter);
                displayResults(filtered, false);
                updateResultsCount(filtered.length, State.allResults.length);
            }
        });
    });

    // Quick search grid cards
    $$('.quick-card[data-source]').forEach(card => {
        card.addEventListener('click', () => {
            const source = card.dataset.source;
            haptic();
            // Set active chip in sourceFilters
            const chip = $(`.source-chip[data-source="${source}"]`);
            if (chip) {
                $$('.source-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                State.sourceFilter = source;
            }
            // Focus search
            DOM.searchInput?.focus();
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
            if (isMobile) {
                Keyboard.open();
            }
        });
    });

    $$('.quick-card[data-query]').forEach(card => {
        card.addEventListener('click', () => {
            const query = card.dataset.query;
            haptic();
            updateSearchInput(query);
            performSearch();
        });
    });

    // View All links to search history
    $('#viewAllHistory')?.addEventListener('click', (e) => {
        e.preventDefault();
        History.open();
    });

    // Bottom Navigation tab bar clicks
    DOM.tabHome?.addEventListener('click', () => {
        haptic();
        updateSearchInput('');
        sessionStorage.removeItem('gurbaniKhoj_state');
        showWelcome();
        $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
        DOM.tabHome.classList.add('active');
    });

    DOM.tabSearch?.addEventListener('click', () => {
        haptic();
        DOM.searchInput?.focus();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
        if (isMobile) {
            Keyboard.open();
        }
        $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
        DOM.tabSearch.classList.add('active');
    });

    DOM.tabBookmarks?.addEventListener('click', () => {
        haptic();
        window.location.href = '../Favorites/favorites.html';
    });

    DOM.tabMore?.addEventListener('click', () => {
        haptic();
        window.location.href = 'search-history.html';
    });

    // Dynamic header back button
    DOM.backBtn?.addEventListener('click', (e) => {
        if (document.body.classList.contains('has-results')) {
            e.preventDefault();
            updateSearchInput('');
            sessionStorage.removeItem('gurbaniKhoj_state');
            showWelcome();
            $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
            DOM.tabHome.classList.add('active');
            haptic();
        }
    });

    // Filter button toggles source filters
    DOM.filterBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        haptic();
        const filters = $('#sourceFilters');
        if (filters) {
            filters.classList.toggle('visible-search');
        }
    });

    // Sub tabs inside results view
    $$('.sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.sub-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            haptic();
        });
    });

    // Load more
    DOM.loadMoreBtn.addEventListener('click', () => {
        State.page++;
        performSearch(true);
        haptic();
    });

    // History
    if (DOM.historyBtn) {
        DOM.historyBtn.addEventListener('click', () => {
            console.log('History button clicked');
            History.open();
        });
        console.log('History button event listener attached');
    }
    DOM.historyClose?.addEventListener('click', () => History.close());
    DOM.historyClearAll?.addEventListener('click', () => History.clear());

    DOM.historyOverlay?.querySelector('.history-backdrop')?.addEventListener('click', () => {
        History.close();
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

console.log('=== GURBANI KHOJ JS LOADED ===');

function init() {
    console.log('=== INIT FUNCTION CALLED ===');
}

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    History.load();
    Favorites.load();
    VoiceSearch.init();
    initEventListeners();
    BackgroundManager.init();

    // Enable direct keyboard input for desktop users by removing readonly attribute
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
    if (!isMobile && DOM.searchInput) {
        DOM.searchInput.removeAttribute('readonly');
        DOM.searchInput.focus();
    }

    // Try to restore full search state from sessionStorage (back-navigation)
    let restored = false;
    try {
        // Clear saved search state if we didn't come from Shabad Reader or Search History (or if referrer is index.html)
        const referrer = document.referrer || '';
        const isFromReader = referrer.includes('shabad-reader.html');
        const isFromHistory = referrer.includes('search-history.html');
        if (!isFromReader && !isFromHistory) {
            sessionStorage.removeItem('gurbaniKhoj_state');
        }

        // Check if coming from history page with a query
        const historyQuery = sessionStorage.getItem('gurbaniKhoj_historyQuery');
        if (historyQuery) {
            sessionStorage.removeItem('gurbaniKhoj_historyQuery');
            updateSearchInput(historyQuery);
            performSearch();
            restored = true;
        }

        if (!restored) {
            const savedRaw = sessionStorage.getItem('gurbaniKhoj_state');
            if (savedRaw) {
                const saved = JSON.parse(savedRaw);

                if (saved.allResults && saved.allResults.length > 0) {
                    // Restore state
                    State.query = saved.query || '';
                    State.allResults = saved.allResults;
                    State.sourceFilter = saved.sourceFilter || 'all';
                    State.page = saved.page || 1;
                    State.totalPages = saved.totalPages || 1;
                    updateSearchInput(saved.inputValue || saved.query || '');

                    // Restore active source chip
                    document.querySelectorAll('.source-chip').forEach(c => {
                        c.classList.toggle('active', c.dataset.source === State.sourceFilter);
                    });

                    // Display restored results
                    const filteredResults = State.sourceFilter === 'all'
                        ? State.allResults
                        : filterResultsBySource(State.allResults, State.sourceFilter);
                    displayResults(filteredResults, false);
                    updateResultsCount(filteredResults.length, State.allResults.length);
                    showResults();

                    // Restore scroll position after render
                    if (saved.scrollY) {
                        setTimeout(() => window.scrollTo(0, saved.scrollY), 80);
                    }

                    restored = true;
                    console.log('Restored search state with', State.allResults.length, 'results');
                }
            }
        }
    } catch (e) {
        console.warn('Could not restore search state:', e);
    }

    if (!restored) {
        showWelcome();
    }

    console.log('Gurbani Khoj initialized');
});
