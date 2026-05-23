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
        // Intercept with instant local search if DB is fully synced
        if (State.isOfflineReady) {
            const localResult = await OfflineCache.search(query, type, source);
            if (localResult) return localResult;
        }

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
        State.keyboardClosedAt = Date.now(); // ghost-tap guard timestamp
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
        // Small delay prevents ghost-tap on underlying tab bar buttons
        setTimeout(() => { performSearch(); }, 80);
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
// OFFLINE ENGINE — Total Gurbani Sync (SGGS, Dasam, BG, NL)
// ═══════════════════════════════════════════════════════════════════════════════

const OfflineCache = {
    DB_NAME:    'AnhadGurbaniDB',
    DB_VERSION: 2,
    STORE:      'pages', // store entire Angs
    _db:        null,
    _busy:      false,
    _offlineVerses: [],  // Global memory array for instant search

    SOURCES: [
        { id: 'G', name: 'SGGS', maxEst: 1430, el: 'SGGS' },
        { id: 'D', name: 'Dasam Granth', maxEst: 1428, el: 'Dasam' },
        { id: 'B', name: 'Bhai Gurdas & Nand Lal', maxEst: 800, el: 'Bhai' }, // Includes N
        { id: 'N', name: 'Nand Lal', maxEst: 100, el: 'Bhai' }
    ],

    async openDB() {
        if (this._db) return this._db;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                // Delete old v1 store if exists
                if (db.objectStoreNames.contains('raagShabads')) db.deleteObjectStore('raagShabads');
                if (!db.objectStoreNames.contains(this.STORE)) {
                    // id is e.g. "G-1", "D-1428"
                    db.createObjectStore(this.STORE, { keyPath: 'id' });
                }
            };
            req.onsuccess  = e => { this._db = e.target.result; resolve(this._db); };
            req.onerror    = e => reject(e.target.error);
        });
    },

    async saveBatch(pages) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx  = db.transaction(this.STORE, 'readwrite');
            const store = tx.objectStore(this.STORE);
            pages.forEach(p => store.put(p));
            tx.oncomplete = resolve;
            tx.onerror    = e => reject(e.target.error);
        });
    },

    async loadAllVerses() {
        if (this._offlineVerses.length > 0) return this._offlineVerses;
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx  = db.transaction(this.STORE, 'readonly');
            const req = tx.objectStore(this.STORE).getAll();
            req.onsuccess = e => {
                const pages = e.target.result || [];
                const flatVerses = [];
                pages.forEach(p => {
                    if (p.verses) {
                        p.verses.forEach(v => {
                            // Inject source ID into verse for filtering
                            v.sourceId = p.source;
                            flatVerses.push(v);
                        });
                    }
                });
                this._offlineVerses = flatVerses;
                resolve(flatVerses);
            };
            req.onerror = () => resolve([]);
        });
    },

    async getCachedCount() {
        const db = await this.openDB();
        return new Promise((resolve) => {
            const tx  = db.transaction(this.STORE, 'readonly');
            const req = tx.objectStore(this.STORE).count();
            req.onsuccess = e => resolve(e.target.result || 0);
            req.onerror   = () => resolve(0);
        });
    },

    // ── UI Helpers ──
    setRingProgress(pct) {
        const circ  = 2 * Math.PI * 52;
        const track = document.getElementById('offlineRingTrack');
        if (track) track.style.strokeDashoffset = circ * (1 - pct / 100);
        const txt   = document.getElementById('offlinePct');
        if (txt)   txt.textContent = Math.round(pct) + '%';
    },

    setButtonState(state) {
        const btn   = document.getElementById('offlineMagicBtn');
        const idle  = document.getElementById('offlineBtnIdle');
        const load  = document.getElementById('offlineBtnLoading');
        const done  = document.getElementById('offlineBtnDone');
        if (!btn) return;
        btn.classList.remove('offline-busy', 'offline-done');
        
        if (state === 'idle') {
            if (idle) idle.style.display = 'flex';
            if (load) load.style.display = 'none';
            if (done) done.style.display = 'none';
            this.setRingProgress(0);
        } else if (state === 'busy') {
            btn.classList.add('offline-busy');
            if (idle) idle.style.display = 'none';
            if (load) load.style.display = 'flex';
            if (done) done.style.display = 'none';
        } else if (state === 'done') {
            btn.classList.add('offline-done');
            if (idle) idle.style.display = 'none';
            if (load) load.style.display = 'none';
            if (done) done.style.display = 'flex';
            this.setRingProgress(100);
        }
    },

    updateOverlayUI(sourceId, ang, maxEst, isDone = false) {
        const srcObj = this.SOURCES.find(s => s.id === sourceId);
        if (!srcObj) return;
        const barId = 'bar' + srcObj.el;
        const statusId = 'status' + srcObj.el;
        const rowId = 'progress' + srcObj.el;
        
        const row = document.getElementById(rowId);
        const bar = document.getElementById(barId);
        const status = document.getElementById(statusId);
        
        if (row) row.classList.add('active');
        
        if (isDone) {
            if (row) { row.classList.remove('active'); row.classList.add('done'); }
            if (status) status.textContent = 'Complete ✓';
            if (bar) bar.style.width = '100%';
        } else {
            if (status) status.textContent = `Ang ${ang}`;
            if (bar) {
                let pct = Math.min((ang / maxEst) * 100, 100);
                bar.style.width = pct + '%';
            }
        }
    },

    updateStatsText(count) {
        const st = document.getElementById('offlineStatsText');
        if (st) st.textContent = `Total ${count} Angs cached`;
    },

    showOverlay() {
        document.getElementById('offlineProgressBackdrop')?.classList.add('show');
        document.getElementById('offlineProgressSheet')?.classList.add('show');
    },
    hideOverlay() {
        document.getElementById('offlineProgressBackdrop')?.classList.remove('show');
        document.getElementById('offlineProgressSheet')?.classList.remove('show');
    },

    async checkAndRestoreState() {
        const count = await this.getCachedCount();
        this.updateStatsText(count);
        if (count > 2800) {
            this.setButtonState('done');
            State.isOfflineReady = true;
            // Pre-load into memory for 0ms searches
            this.loadAllVerses().catch(()=>{});
        }
    },

    async startDownload() {
        if (this._busy) return;
        
        const btn = document.getElementById('offlineMagicBtn');
        if (btn?.classList.contains('offline-done')) {
            this.showOverlay(); // Just show status if done
            return;
        }

        this._busy = true;
        this.setButtonState('busy');
        this.showOverlay();
        
        let totalCount = await this.getCachedCount();
        this.updateStatsText(totalCount);

        try {
            const BATCH = 16; // Parallel requests

            for (const src of this.SOURCES) {
                let currentAng = 1;
                let sourceDone = false;
                
                while (!sourceDone) {
                    const batchAngs = Array.from({length: BATCH}, (_, i) => currentAng + i);
                    const pagesToSave = [];
                    
                    await Promise.all(batchAngs.map(async ang => {
                        try {
                            const res = await fetch(`https://api.banidb.com/v2/angs/${ang}?source=${src.id}`);
                            if (!res.ok) return;
                            const data = await res.json();
                            
                            // BaniDB fallback detection: if it returns pageNo < requested, we hit the max
                            if (!data.page || data.page.length === 0) {
                                sourceDone = true;
                                return;
                            }
                            const actualPageNo = data.page[0].pageNo || ang;
                            if (actualPageNo < ang) {
                                sourceDone = true;
                                return;
                            }

                            // Keep only essential fields to save IndexedDB space
                            const minVerses = data.page.map(v => ({
                                verseId: v.verseId,
                                shabadId: v.shabadId,
                                unicode: v.verse?.unicode || '',
                                firstLetters: v.verse?.firstletters || v.verse?.firstLetters || '',
                                english: v.translation?.en?.bdb || '',
                                writerId: v.writer?.writerId || 0,
                                raagId: v.raag?.raagId || 0,
                                pageNo: actualPageNo,
                                lineNo: v.lineNo
                            }));

                            pagesToSave.push({
                                id: `${src.id}-${actualPageNo}`,
                                source: src.id,
                                pageNo: actualPageNo,
                                verses: minVerses
                            });
                            
                            if (actualPageNo % 10 === 0) {
                                this.updateOverlayUI(src.id, actualPageNo, src.maxEst);
                            }
                            
                        } catch (e) {
                            // silent skip on network error
                        }
                    }));
                    
                    if (pagesToSave.length > 0) {
                        await this.saveBatch(pagesToSave);
                        totalCount += pagesToSave.length;
                        this.updateStatsText(totalCount);
                        // Global ring progress (approximate max 2950 angs)
                        const globalPct = Math.min((totalCount / 2950) * 100, 99);
                        this.setRingProgress(globalPct);
                    }
                    
                    if (sourceDone) break;
                    currentAng += BATCH;
                }
                
                this.updateOverlayUI(src.id, currentAng, src.maxEst, true);
            }

            this.setButtonState('done');
            State.isOfflineReady = true;
            this.updateStatsText(totalCount);
            
            // Reload all into memory cache
            await this.loadAllVerses();
            
            setTimeout(() => this.hideOverlay(), 3000);
            
        } catch(err) {
            console.error('Offline sync error:', err);
            this.setButtonState('idle');
        }
        this._busy = false;
    },
    
    // ── Local Search Engine ──
    async search(query, type, source) {
        let verses = await this.loadAllVerses();
        if (!verses.length) return null; // Not ready

        const searchType = SEARCH_TYPES[type] ?? 0;
        const q = query.trim();
        if (!q) return { results: [], totalInfo: { count: 0 } };
        
        // Filter by source
        if (source && source !== 'all') {
            verses = verses.filter(v => v.sourceId === source);
        }

        // Search logic matching API
        let matches = [];
        const normQ = q.toLowerCase();

        if (searchType === 1) {
            // Gurmukhi Exact (ignores some matras for robustness if needed, but basic includes works best for exact)
            matches = verses.filter(v => v.unicode && v.unicode.includes(q));
        } else if (searchType === 0) {
            // First Letter (English chars)
            matches = verses.filter(v => v.firstLetters && v.firstLetters.toLowerCase().includes(normQ));
        } else if (searchType === 2) {
            // English Translation
            matches = verses.filter(v => v.english && v.english.toLowerCase().includes(normQ));
        }

        // BaniDB search returns specific structured objects
        const results = matches.map(v => ({
            verseId: v.verseId,
            shabadId: v.shabadId,
            verse: { unicode: v.unicode },
            translation: { en: { bdb: v.english } },
            source: { sourceId: v.sourceId, pageNo: v.pageNo },
            raag: { raagId: v.raagId },
            writer: { writerId: v.writerId }
        }));

        // Note: For simplicity we return all matches on "page 1" in offline mode
        // Since offline is instant, pagination is less critical, but we can slice if needed.
        return {
            results: results.slice(0, 100), // cap to 100 for UI sanity
            totalInfo: { count: results.length }
        };
    },

    // ── Offline Raag Engine ──
    async getRaagShabads(raagId) {
        let verses = await this.loadAllVerses();
        if (!verses.length) return null;
        
        // Find all unique shabads for this raag
        const raagVerses = verses.filter(v => v.raagId === raagId && v.shabadId);
        const map = new Map();
        
        const getWriterIdStr = (wid) => {
            if (wid === 1) return 'M1';
            if (wid === 2) return 'M2';
            if (wid === 3) return 'M3';
            if (wid === 4) return 'M4';
            if (wid === 5) return 'M5';
            if (wid === 6) return 'M9';
            if (wid === 7) return 'M10';
            if (wid > 7 && wid < 30) return 'Bhagat';
            return 'Other';
        };

        raagVerses.forEach(v => {
            if (!map.has(v.shabadId)) {
                map.set(v.shabadId, {
                    shabadId: v.shabadId,
                    firstVerse: v.unicode,
                    writerId: getWriterIdStr(v.writerId),
                    pageNo: v.pageNo,
                    count: 1
                });
            } else {
                map.get(v.shabadId).count++;
            }
        });

        return Array.from(map.values()).sort((a, b) => a.pageNo - b.pageNo);
    }
};

window.OfflineCache = OfflineCache;

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSICAL RAAGS DATA
// ═══════════════════════════════════════════════════════════════════════════════

const CLASSICAL_RAAGS = [
    { id: 1,  en: 'Siri Raag',   pa: 'ਸਿਰੀਰਾਗੁ',    time: 'Morning',        desc: 'The foremost of all Raags',        count: 165, startAng: 14,   endAng: 93   },
    { id: 2,  en: 'Maajh',       pa: 'ਮਾਝ',           time: 'All Times',      desc: 'Yearning for the Beloved Lord',     count: 68,  startAng: 94,   endAng: 150  },
    { id: 3,  en: 'Gauri',       pa: 'ਗਉੜੀ',          time: 'Morning',        desc: 'Peaceful contemplation',            count: 542, startAng: 151,  endAng: 346  },
    { id: 4,  en: 'Asa',         pa: 'ਆਸਾ',            time: 'Early Morning',  desc: 'Hope and spiritual joy',            count: 485, startAng: 347,  endAng: 488  },
    { id: 5,  en: 'Gujri',       pa: 'ਗੂਜਰੀ',         time: 'Early Morning',  desc: 'Deep devotion and surrender',       count: 42,  startAng: 489,  endAng: 526  },
    { id: 6,  en: 'Devgandhari', pa: 'ਦੇਵਗੰਧਾਰੀ',    time: 'Afternoon',      desc: 'Spiritual longing and devotion',    count: 18,  startAng: 527,  endAng: 536  },
    { id: 7,  en: 'Bihagara',    pa: 'ਬਿਹਾਗੜਾ',      time: 'Night',          desc: 'Love and divine separation',        count: 23,  startAng: 537,  endAng: 556  },
    { id: 8,  en: 'Wadhans',     pa: 'ਵਡਹੰਸੁ',        time: 'Morning',        desc: 'Praise and deep gratitude',         count: 47,  startAng: 557,  endAng: 594  },
    { id: 9,  en: 'Sorath',      pa: 'ਸੋਰਠਿ',         time: 'Morning',        desc: 'Bravery and divine valor',          count: 108, startAng: 595,  endAng: 659  },
    { id: 10, en: 'Dhanasari',   pa: 'ਧਨਾਸਰੀ',       time: 'Morning',        desc: 'Contentment and inner peace',       count: 87,  startAng: 660,  endAng: 695  },
    { id: 11, en: 'Jaitsari',    pa: 'ਜੈਤਸਰੀ',       time: 'Afternoon',      desc: 'Victory and celebration of God',    count: 28,  startAng: 696,  endAng: 710  },
    { id: 12, en: 'Todi',        pa: 'ਟੋਡੀ',           time: 'Morning',        desc: 'Intense longing for Waheguru',      count: 20,  startAng: 711,  endAng: 718  },
    { id: 13, en: 'Bairari',     pa: 'ਬੈਰਾੜੀ',       time: 'Morning',        desc: 'Joy and divine tranquility',        count: 4,   startAng: 719,  endAng: 720  },
    { id: 14, en: 'Tilang',      pa: 'ਤਿਲੰਗ',         time: 'Night',          desc: 'Heartfelt prayer and surrender',    count: 17,  startAng: 721,  endAng: 727  },
    { id: 15, en: 'Suhi',        pa: 'ਸੂਹੀ',           time: 'Morning',        desc: 'Love and divine union',             count: 103, startAng: 728,  endAng: 794  },
    { id: 16, en: 'Bilaval',     pa: 'ਬਿਲਾਵਲੁ',      time: 'Morning',        desc: 'Joy and happiness in the Lord',     count: 109, startAng: 795,  endAng: 858  },
    { id: 17, en: 'Gaund',       pa: 'ਗੋਂਡ',           time: 'All Times',      desc: 'Deep contemplation and calm',       count: 20,  startAng: 859,  endAng: 875  },
    { id: 18, en: 'Ramkali',     pa: 'ਰਾਮਕਲੀ',        time: 'Morning',        desc: 'Profound meditation on the Divine', count: 203, startAng: 876,  endAng: 974  },
    { id: 19, en: 'Nat Narayan', pa: 'ਨਟ ਨਾਰਾਇਣ',    time: 'Afternoon',      desc: 'Cosmic dance of creation',          count: 19,  startAng: 975,  endAng: 983  },
    { id: 20, en: 'Mali Gaura',  pa: 'ਮਾਲੀ ਗਉੜਾ',    time: 'Morning',        desc: 'Spiritual radiance and grace',      count: 8,   startAng: 984,  endAng: 988  },
    { id: 21, en: 'Maru',        pa: 'ਮਾਰੂ',           time: 'Afternoon',      desc: 'Determination and inner courage',   count: 239, startAng: 989,  endAng: 1106 },
    { id: 22, en: 'Tukhari',     pa: 'ਤੁਖਾਰੀ',        time: 'Early Morning',  desc: 'Divine love and holy longing',      count: 22,  startAng: 1107, endAng: 1117 },
    { id: 23, en: 'Kedara',      pa: 'ਕੇਦਾਰਾ',        time: 'Afternoon',      desc: 'Serene and peaceful remembrance',   count: 16,  startAng: 1118, endAng: 1124 },
    { id: 24, en: 'Bhairo',      pa: 'ਭੈਰਉ',           time: 'Morning',        desc: 'Fearlessness before the Lord',      count: 136, startAng: 1125, endAng: 1167 },
    { id: 25, en: 'Basant',      pa: 'ਬਸੰਤੁ',          time: 'Spring Season',  desc: 'Joy and renewal of all creation',   count: 60,  startAng: 1168, endAng: 1196 },
    { id: 26, en: 'Sarang',      pa: 'ਸਾਰੰਗ',         time: 'Afternoon',      desc: 'Grace, beauty and divine elegance', count: 112, startAng: 1197, endAng: 1253 },
    { id: 27, en: 'Malar',       pa: 'ਮਲਾਰ',           time: 'Rainy Season',   desc: 'Soothing and deeply refreshing',    count: 57,  startAng: 1254, endAng: 1293 },
    { id: 28, en: 'Kanra',       pa: 'ਕਾਨੜਾ',         time: 'Late Night',     desc: 'Longing for the Divine presence',   count: 50,  startAng: 1294, endAng: 1318 },
    { id: 29, en: 'Kalyan',      pa: 'ਕਲਿਆਨ',         time: 'Evening',        desc: 'Welfare and eternal bliss',         count: 10,  startAng: 1319, endAng: 1326 },
    { id: 30, en: 'Prabhati',    pa: 'ਪ੍ਰਭਾਤੀ',      time: 'Early Morning',  desc: 'Dawn prayer to the Creator',        count: 36,  startAng: 1327, endAng: 1351 },
    { id: 31, en: 'Jaijawanti',  pa: 'ਜੈਜਾਵੰਤੀ',     time: 'Night',          desc: 'Victory song of the eternal soul',  count: 8,   startAng: 1352, endAng: 1353 },
];

// Expose to OfflineCache (defined before this block)
window.CLASSICAL_RAAGS_REF = CLASSICAL_RAAGS;


const GURU_INFO = {
    'M1':     { name: 'Guru Nanak Dev Ji',   pa: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',     img: '../guruimages/gurunanakdevsahebji.jpeg',    grad: 'pastel-gradient-1', order: 1 },
    'M2':     { name: 'Guru Angad Dev Ji',    pa: 'ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ',      img: '../guruimages/guruangaddevsahebji.jpeg',    grad: 'pastel-gradient-2', order: 2 },
    'M3':     { name: 'Guru Amar Das Ji',     pa: 'ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ',       img: '../guruimages/guruamardasji.jpeg',          grad: 'pastel-gradient-3', order: 3 },
    'M4':     { name: 'Guru Ram Das Ji',      pa: 'ਗੁਰੂ ਰਾਮਦਾਸ ਜੀ',        img: '../guruimages/gururamdassahebji.jpeg',      grad: 'pastel-gradient-4', order: 4 },
    'M5':     { name: 'Guru Arjan Dev Ji',    pa: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',      img: '../guruimages/guruarjanddevsahebji.jpeg',   grad: 'pastel-gradient-5', order: 5 },
    'M9':     { name: 'Guru Teg Bahadur Ji',  pa: 'ਗੁਰੂ ਤੇਗ ਬਹਾਦੁਰ ਜੀ',    img: '../guruimages/gurutegbahadursahebji.jpeg',  grad: 'pastel-gradient-1', order: 6 },
    'M10':    { name: 'Guru Gobind Singh Ji', pa: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',   img: '../guruimages/gurugobindsinghsahebji.jpeg', grad: 'pastel-gradient-2', order: 7 },
    'Bhagat': { name: 'Bhagat Bani',          pa: 'ਭਗਤ ਬਾਣੀ',              img: null,                                       grad: 'pastel-gradient-3', order: 8 },
    'Other':  { name: 'Other Gurbani',        pa: 'ਹੋਰ ਗੁਰਬਾਣੀ',           img: null,                                       grad: 'pastel-gradient-4', order: 9 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// RAAG MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const RaagManager = {
    _currentRaag: null,

    open() {
        const overlay = document.getElementById('raagOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        // Trigger slide-in after display:flex is applied
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { overlay.classList.add('raag-open'); });
        });
        this.showListView();
        this.renderGrid();
    },

    close() {
        const overlay = document.getElementById('raagOverlay');
        if (!overlay) return;
        overlay.classList.remove('raag-open');
        overlay.addEventListener('transitionend', () => {
            overlay.style.display = 'none';
            this.showListView();
        }, { once: true });
    },

    showListView() {
        const lv = document.getElementById('raagListView');
        const dv = document.getElementById('raagDetailView');
        if (lv) { lv.style.display = 'flex'; lv.style.flexDirection = 'column'; }
        if (dv) { dv.classList.remove('detail-open'); setTimeout(() => { dv.style.display = 'none'; }, 300); }
    },

    showDetailView() {
        const lv = document.getElementById('raagListView');
        const dv = document.getElementById('raagDetailView');
        if (lv) lv.style.display = 'none';
        if (dv) {
            dv.style.display = 'flex';
            dv.style.flexDirection = 'column';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { dv.classList.add('detail-open'); });
            });
        }
    },

    renderGrid() {
        const grid = document.getElementById('raagGridList');
        if (!grid) return;
        const gradients = ['pastel-gradient-1','pastel-gradient-2','pastel-gradient-3','pastel-gradient-4','pastel-gradient-5'];
        grid.innerHTML = `<div class="raag-fs-grid">${CLASSICAL_RAAGS.map((raag, i) => `
            <button class="raag-list-item ${gradients[i % gradients.length]}"
                 data-raag-id="${raag.id}"
                 data-raag-en="${raag.en}"
                 data-raag-pa="${encodeURIComponent(raag.pa)}"
                 data-raag-time="${raag.time}">
                <span class="raag-list-name-pa">${raag.pa}</span>
                <span class="raag-list-name-en">${raag.en}</span>
                <span class="raag-list-shabads">${raag.count} Shabads</span>
                <span class="raag-list-time">🕐 ${raag.time}</span>
            </button>
        `).join('')}</div>`;
        grid.querySelectorAll('.raag-list-item').forEach(item => {
            item.addEventListener('click', () => {
                haptic();
                const pa = decodeURIComponent(item.dataset.raagPa);
                this.openRaagDetail(
                    item.dataset.raagId,
                    item.dataset.raagEn,
                    pa,
                    item.dataset.raagTime
                );
            });
        });
    },

    getWriterId(verse) {
        const wid = verse.writer?.writerId;
        const en  = verse.writer?.english || '';
        if (wid === 1  || /Nanak/i.test(en))        return 'M1';
        if (wid === 2  || /Angad/i.test(en))         return 'M2';
        if (wid === 3  || /Amar/i.test(en))          return 'M3';
        if (wid === 4  || /Ram\s*Das/i.test(en))     return 'M4';
        if (wid === 5  || /Arjan/i.test(en))         return 'M5';
        if (wid === 6  || /Teg/i.test(en))           return 'M9';
        if (wid === 7  || /Gobind/i.test(en))        return 'M10';
        if (/Mahala\s*1/i.test(en))   return 'M1';
        if (/Mahala\s*2/i.test(en))   return 'M2';
        if (/Mahala\s*3/i.test(en))   return 'M3';
        if (/Mahala\s*4/i.test(en))   return 'M4';
        if (/Mahala\s*5/i.test(en))   return 'M5';
        if (/Mahala\s*9/i.test(en))   return 'M9';
        if (/Mahala\s*10/i.test(en))  return 'M10';
        if (/kabir|namdev|ravidas|farid|sain|pipa|bhikan|trilochan|sadhna|dhanna|jaidev|surdas/i.test(en)) return 'Bhagat';
        return 'Other';
    },

    // Group individual verses into shabads (one card per shabadId, showing first pankti)
    groupVersesByShabads(verses) {
        const shabadMap = new Map(); // shabadId → {firstVerse, writerId, pageNo, count}
        verses.forEach(v => {
            if (!v.verse?.unicode || !v.shabadId) return;
            if (!shabadMap.has(v.shabadId)) {
                shabadMap.set(v.shabadId, {
                    shabadId: v.shabadId,
                    firstVerse: v.verse.unicode,
                    writerId: this.getWriterId(v),
                    pageNo: v.pageNo,
                    count: 1
                });
            } else {
                shabadMap.get(v.shabadId).count++;
            }
        });
        return Array.from(shabadMap.values()).sort((a, b) => a.pageNo - b.pageNo);
    },

    // Render pre-deduped shabads array (already sorted by pageNo)
    renderGroupedShabads(shabads, container) {

        // Group shabads by writerId
        const groups = {};
        shabads.forEach(s => {
            const wid = s.writerId;
            if (!groups[wid]) groups[wid] = [];
            groups[wid].push(s);
        });

        const GURU_ORDER = ['M1','M2','M3','M4','M5','M9','M10','Bhagat','Other'];
        const sortedKeys = Object.keys(groups).sort((a, b) =>
            (GURU_ORDER.indexOf(a) === -1 ? 99 : GURU_ORDER.indexOf(a)) -
            (GURU_ORDER.indexOf(b) === -1 ? 99 : GURU_ORDER.indexOf(b))
        );

        if (sortedKeys.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-secondary);">No shabads found.</div>';
            return;
        }

        const cardGrads = ['pastel-gradient-1','pastel-gradient-2','pastel-gradient-3','pastel-gradient-4','pastel-gradient-5'];

        container.innerHTML = `<div class="raag-detail-groups">${sortedKeys.map(wid => {
            const info = GURU_INFO[wid] || GURU_INFO['Other'];
            const groupShabads = groups[wid];

            const avatarHtml = info.img
                ? `<img src="${info.img}" alt="${info.name}" class="raag-group-avatar" onerror="this.outerHTML='<div class=raag-group-avatar-placeholder>ੴ</div>'">`
                : `<div class="raag-group-avatar-placeholder">ੴ</div>`;

            const cards = groupShabads.map((s, i) => `
                <button class="raag-shabad-card ${cardGrads[i % cardGrads.length]}"
                     data-shabad="${s.shabadId}">
                    <div class="raag-shabad-text">${s.firstVerse}</div>
                    <div class="raag-shabad-footer">
                        <span class="raag-shabad-ang">Ang ${s.pageNo}</span>
                        <span class="raag-shabad-line-count">${s.count} ਪੰਕਤੀਆਂ</span>
                    </div>
                </button>`).join('');

            return `<div class="raag-group-section">
                <div class="raag-group-header">
                    ${avatarHtml}
                    <div class="raag-group-info">
                        <div class="raag-group-name-pa">${info.pa}</div>
                        <div class="raag-group-name-en">${info.name} · ${groupShabads.length} Shabads</div>
                    </div>
                    <span class="raag-group-count">${groupShabads.length}</span>
                </div>
                <div class="raag-shabad-cards">${cards}</div>
            </div>`;
        }).join('')}</div>`;

        // Wire shabad card clicks — cache shabads for instant back navigation
        const cachedShabads = shabads; // closure reference
        container.querySelectorAll('.raag-shabad-card').forEach(card => {
            card.addEventListener('click', () => {
                haptic();
                const shabadId = card.dataset.shabad;
                if (this._currentRaag) {
                    const saveData = { ...this._currentRaag, cachedShabads };
                    try {
                        sessionStorage.setItem('gurbaniKhoj_backToRaag', JSON.stringify(saveData));
                    } catch(e) {
                        // Too large for sessionStorage (rare) — save without cache
                        sessionStorage.setItem('gurbaniKhoj_backToRaag', JSON.stringify(this._currentRaag));
                    }
                }
                window.location.href = `shabad-reader.html?shabad=${shabadId}&from=raag`;
            });
        });
    },

    async openRaagDetail(raagId, raagEn, raagPa, raagTime) {
        this._currentRaag = { raagId, raagEn, raagPa, raagTime };
        this.showDetailView();

        const titleEl = document.getElementById('selectedRaagTitle');
        const metaEl  = document.getElementById('selectedRaagMeta');
        const descEl  = document.getElementById('selectedRaagDesc');
        const listEl  = document.getElementById('raagShabadsList');
        const raagInfo = CLASSICAL_RAAGS.find(r => String(r.id) === String(raagId));

        if (titleEl) titleEl.textContent = raagEn;
        if (metaEl)  metaEl.textContent  = `${raagTime || ''} · Ang ${raagInfo?.startAng || ''}–${raagInfo?.endAng || ''}`;
        if (descEl)  descEl.textContent  = raagInfo?.desc || '';

        if (!raagInfo?.startAng) {
            if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-secondary);">Ang range unavailable.</div>';
            return;
        }

        // ── 1) Check in-memory cache (instant, no fetch) ──
        if (!this._shabadCache) this._shabadCache = {};
        if (this._shabadCache[raagId]) {
            this.renderGroupedShabads(this._shabadCache[raagId], listEl);
            return;
        }

        // ── 2) Check Offline Engine (Total DB) ──
        if (State.isOfflineReady) {
            const idbShabads = await OfflineCache.getRaagShabads(raagId);
            if (idbShabads && idbShabads.length > 0) {
                this._shabadCache[raagId] = idbShabads;
                if (metaEl) metaEl.textContent = `${raagTime || ''} · Ang ${raagInfo?.startAng}–${raagInfo?.endAng} · ${idbShabads.length} Shabads`;
                this.renderGroupedShabads(idbShabads, listEl);
                return;
            }
        }

        // ── Fetch ALL angs in raag range in batches (Progressive render) ──
        const { startAng, endAng } = raagInfo;
        const allAngs = Array.from({ length: endAng - startAng + 1 }, (_, i) => startAng + i);
        const BATCH = 8; // 8 parallel requests at a time
        const totalBatches = Math.ceil(allAngs.length / BATCH);
        let doneBatches = 0;
        const shabadMap = new Map(); // shabadId → {firstVerse, writerId, pageNo, count}

        // Show initial loading text
        if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-secondary);">Fetching Angs...</div>';
        if (metaEl) metaEl.innerHTML = `<span style="color:#c8a96a;">Loading 0%</span> · Ang ${startAng}–${endAng}`;

        const updateProgressAndRender = () => {
            const pct = Math.round((doneBatches / totalBatches) * 100);
            
            // Render what we have so far!
            const currentShabads = Array.from(shabadMap.values()).sort((a, b) => a.pageNo - b.pageNo);
            if (currentShabads.length > 0) {
                this.renderGroupedShabads(currentShabads, listEl);
            }
            
            if (metaEl) {
                if (doneBatches < totalBatches) {
                    metaEl.innerHTML = `<span style="color:#c8a96a;">Loading ${pct}%</span> · Ang ${startAng}–${endAng} · ${currentShabads.length} Shabads`;
                } else {
                    metaEl.textContent = `${raagTime || ''} · Ang ${startAng}–${endAng} · ${currentShabads.length} Shabads`;
                }
            }
        };

        try {
            for (let i = 0; i < allAngs.length; i += BATCH) {
                const batch = allAngs.slice(i, i + BATCH);
                await Promise.all(batch.map(async ang => {
                    try {
                        const res = await fetch(`https://api.banidb.com/v2/angs/${ang}?source=G`,
                            { headers: { Accept: 'application/json' } });
                        if (!res.ok) return;
                        const data = await res.json();
                        (Array.isArray(data?.page) ? data.page : [])
                            .filter(v => v.verse?.unicode && v.shabadId)
                            .forEach(v => {
                                if (!shabadMap.has(v.shabadId)) {
                                    shabadMap.set(v.shabadId, {
                                        shabadId: v.shabadId,
                                        firstVerse: v.verse.unicode,
                                        writerId: this.getWriterId({ writer: { english: v.writer?.english || '', writerId: v.writer?.writerId || 0 } }),
                                        pageNo: v.pageNo || ang,
                                        count: 1
                                    });
                                } else {
                                    shabadMap.get(v.shabadId).count++;
                                }
                            });
                    } catch(e) { /* skip failed ang silently */ }
                }));
                doneBatches++;
                updateProgressAndRender();
            }

            const finalShabads = Array.from(shabadMap.values()).sort((a, b) => a.pageNo - b.pageNo);
            
            // Cache final result in memory for instant back navigation
            if (finalShabads.length > 0) {
                this._shabadCache[raagId] = finalShabads;
            } else {
                if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-secondary);">No shabads found. Check connection.</div>';
            }

            // Save to OfflineCache (v2) if possible so we don't fetch again next time
            // We mimic the verse structure required by our new offline DB logic
            if (finalShabads.length > 0) {
                // Since OfflineEngine saves by pages, we just save the final array in memory
                // so it's instant for the session. Total offline sync is handled by the magic button.
            }



            // Cache in memory
            this._shabadCache[raagId] = finalShabads;

            this.renderGroupedShabads(finalShabads, listEl);
        } catch(err) {
            console.error('Raag detail error:', err);
            if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-secondary);">Could not load. Check connection.</div>';
        }
    }
};

window.RaagManager = RaagManager;


// ═══════════════════════════════════════════════════════════════════════════════
// DAILY RARE SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const RARE_SHABADS = [
    { shabadId: 2456,  gurmukhi: 'ਹਰਿ ਕਾ ਨਾਮੁ ਮਨਿ ਵਸੈ ਹੋਵੈ ਅਨੰਦੁ ਅਪਾਰੁ',         source: 'SGGS', ang: 318  },
    { shabadId: 3015,  gurmukhi: 'ਜੀਅ ਕੀ ਬਿਰਥਾ ਹੋਇ ਸੁ ਗੁਰ ਪਹਿ ਅਰਦਾਸਿ ਕਰਿ',      source: 'SGGS', ang: 519  },
    { shabadId: 4200,  gurmukhi: 'ਨਾਮ ਕੇ ਧਾਰੇ ਸਗਲੇ ਜੰਤ',                          source: 'SGGS', ang: 284  },
    { shabadId: 1850,  gurmukhi: 'ਅੰਮ੍ਰਿਤੁ ਪੀਵਹੁ ਸਦਾ ਚਿਰੁ ਜੀਵਹੁ',                 source: 'SGGS', ang: 496  },
    { shabadId: 5100,  gurmukhi: 'ਸਤਿਗੁਰ ਕੀ ਬਾਣੀ ਸਤਿ ਸਤਿ ਕਰਿ ਜਾਣਹੁ',             source: 'SGGS', ang: 308  },
    { shabadId: 3567,  gurmukhi: 'ਨਿਰਭਉ ਨਿਰੰਕਾਰੁ ਸਤਿਨਾਮੁ',                         source: 'SGGS', ang: 796  },
    { shabadId: 2190,  gurmukhi: 'ਤੂ ਕਰਤਾ ਸਚਿਆਰੁ ਮੈਡਾ ਸਾਈ',                       source: 'SGGS', ang: 353  },
    { shabadId: 4875,  gurmukhi: 'ਗੁਰ ਕੀ ਮਤਿ ਤੂੰ ਲੇਹਿ ਇਆਨੇ',                      source: 'SGGS', ang: 288  },
    { shabadId: 3300,  gurmukhi: 'ਹਰਿ ਹਰਿ ਹਰਿ ਗੁਣ ਗਾਵਹੁ ਮੇਰੇ ਭਾਈ',               source: 'SGGS', ang: 583  },
    { shabadId: 1560,  gurmukhi: 'ਸਾਚੇ ਨਾਮ ਕੀ ਵਡਿਆਈ',                              source: 'SGGS', ang: 660  },
    { shabadId: 6230,  gurmukhi: 'ਅੰਤਰਜਾਮੀ ਪੁਰਖ ਬਿਧਾਤੇ',                           source: 'SGGS', ang: 268  },
    { shabadId: 2780,  gurmukhi: 'ਮਨੁ ਮੇਰਾ ਹਰਿ ਕੈ ਰੰਗਿ ਰਾਤਾ',                     source: 'SGGS', ang: 162  },
    { shabadId: 4500,  gurmukhi: 'ਤੂੰ ਠਾਕੁਰੁ ਤੁਮ ਪਹਿ ਅਰਦਾਸਿ',                     source: 'SGGS', ang: 268  },
    { shabadId: 3800,  gurmukhi: 'ਸੁਖਮਨੀ ਸੁਖ ਅੰਮ੍ਰਿਤ ਪ੍ਰਭ ਨਾਮੁ',                  source: 'SGGS', ang: 262  },
    { shabadId: 1200,  gurmukhi: 'ਏਕੁ ਪਿਤਾ ਏਕਸ ਕੇ ਹਮ ਬਾਰਿਕ',                     source: 'SGGS', ang: 611  },
    { shabadId: 5670,  gurmukhi: 'ਭਜਹੁ ਗੋਬਿੰਦ ਭੂਲਿ ਮਤ ਜਾਹੁ',                      source: 'SGGS', ang: 1150 },
    { shabadId: 2950,  gurmukhi: 'ਬਹੁਤਾ ਕਰਮੁ ਲਿਖਿਆ ਨਾ ਜਾਇ',                        source: 'SGGS', ang: 8    },
    { shabadId: 4110,  gurmukhi: 'ਜਉ ਤਉ ਪ੍ਰੇਮ ਖੇਲਣ ਕਾ ਚਾਉ',                       source: 'SGGS', ang: 1412 },
    { shabadId: 3450,  gurmukhi: 'ਨਾਨਕ ਦਾਸ ਇਹੈ ਸੁਖੁ ਮਾਗੈ',                        source: 'SGGS', ang: 1007 },
    { shabadId: 5430,  gurmukhi: 'ਧੰਨੁ ਸੁ ਰਾਗੁ ਸੁਭਾਖਿਆ ਸੋਈ',                       source: 'SGGS', ang: 1423 },
    { shabadId: 6140,  gurmukhi: 'ਵਾਹਿਗੁਰੂ ਗੁਰਮੰਤ੍ਰੁ ਹੈ ਜਪਿ ਹਉਮੈ ਖੋਈ',           source: 'SGGS', ang: 1114 },
    { shabadId: 2100,  gurmukhi: 'ਜੋ ਮਾਗਹਿ ਠਾਕੁਰ ਅਪੁਨੇ ਤੇ ਸੋਈ ਸੋਈ ਦੇਵੈ',          source: 'SGGS', ang: 268  },
    { shabadId: 1700,  gurmukhi: 'ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ',          source: 'SGGS', ang: 441  },
    { shabadId: 3999,  gurmukhi: 'ਤੇਰਾ ਕੀਆ ਮੀਠਾ ਲਾਗੈ',                              source: 'SGGS', ang: 394  },
    { shabadId: 5010,  gurmukhi: 'ਅਕਾਲ ਪੁਰਖ ਕੀ ਰਖਿਆ ਹਮਨੈ',                         source: 'SGGS', ang: 199  },
    { shabadId: 2300,  gurmukhi: 'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖੁ ਪਾਵਉ',                   source: 'SGGS', ang: 263  },
    { shabadId: 4650,  gurmukhi: 'ਤੇਰੇ ਭਾਣੇ ਸਰਬ ਕਲਿਆਣ',                             source: 'SGGS', ang: 681  },
    { shabadId: 1430,  gurmukhi: 'ਪ੍ਰਭੁ ਮੇਰਾ ਨਿਰੰਕਾਰੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ',              source: 'SGGS', ang: 283  },
    { shabadId: 3120,  gurmukhi: 'ਭਗਤਿ ਕਰਹੁ ਅਰਦਾਸਿ ਨਿਤ ਚਾਉ',                       source: 'SGGS', ang: 540  },
    { shabadId: 5850,  gurmukhi: 'ਜੋ ਤੇਰੈ ਰੰਗਿ ਰਾਤੇ ਤਿਨ ਕਉ ਸਭਿ ਕੋ ਮਾਨੈ',          source: 'SGGS', ang: 449  },
];

const DailySuggestions = {
    KEY: 'gurbani_daily_suggestions',

    getTodayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    },

    getDailyShabad(dateKey) {
        const dayNum = parseInt(dateKey.replace(/-/g,''), 10);
        return RARE_SHABADS[dayNum % RARE_SHABADS.length];
    },

    loadHistory() {
        try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); } catch(e) { return {}; }
    },

    saveHistory(h) {
        try { localStorage.setItem(this.KEY, JSON.stringify(h)); } catch(e) {}
    },

    ensureToday() {
        const history = this.loadHistory();
        const today   = this.getTodayKey();
        if (!history[today]) {
            history[today] = this.getDailyShabad(today);
            const keys = Object.keys(history).sort().reverse().slice(0, 10);
            const trimmed = {};
            keys.forEach(k => { trimmed[k] = history[k]; });
            this.saveHistory(trimmed);
            return trimmed;
        }
        return history;
    },

    open() {
        const overlay = document.getElementById('rareSuggestionsOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            this.render();
        }
    },

    close() {
        const overlay = document.getElementById('rareSuggestionsOverlay');
        if (overlay) overlay.style.display = 'none';
    },

    render() {
        const list = document.getElementById('rareSuggestionsList');
        if (!list) return;
        const history = this.ensureToday();
        const today   = this.getTodayKey();
        const days    = Object.keys(history).sort().reverse();
        if (!days.length) {
            list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-secondary);">No suggestions yet.</div>';
            return;
        }
        const dayNames   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        list.innerHTML = days.map(dateKey => {
            const shabad  = history[dateKey];
            const isToday = dateKey === today;
            const [y,m,d] = dateKey.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const label   = isToday ? 'Today' : `${dayNames[dateObj.getDay()]}, ${d} ${monthNames[m-1]}`;
            return `
            <div class="daily-suggest-card ${isToday ? 'today-card' : ''}"
                 data-shabad="${shabad.shabadId}">
                <div class="daily-suggest-header">
                    <span class="daily-suggest-date">${label}</span>
                    <span class="daily-suggest-badge">${shabad.source} · Ang ${shabad.ang}</span>
                </div>
                <div class="daily-suggest-text">${shabad.gurmukhi}</div>
                <div class="daily-suggest-footer">
                    <span class="daily-suggest-writer">✦ Rare Shabad</span>
                    <span style="color:var(--ios-blue);font-weight:600;">Read ›</span>
                </div>
            </div>`;
        }).join('');

        list.querySelectorAll('.daily-suggest-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                haptic();
                const sid = card.dataset.shabad;
                DailySuggestions.close();
                window.location.href = `shabad-reader.html?shabad=${sid}`;
            });
        });
    }
};

window.DailySuggestions = DailySuggestions;

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
        DailySuggestions.open();
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

    // Raag Quick Card → open Raag Overlay
    $('#quickCardRaag')?.addEventListener('click', () => {
        haptic();
        RaagManager.open();
    });

    // Simran Quick Card → open Waheguru Simran shabad (ID 6140)
    $('#quickCardSimran')?.addEventListener('click', () => {
        haptic();
        window.location.href = 'shabad-reader.html?shabad=6140';
    });

    // Raag Overlay — close / back
    $('#raagClose')?.addEventListener('click', () => { haptic(); RaagManager.close(); });
    $('#raagBackdrop')?.addEventListener('click', () => RaagManager.close());
    $('#raagDetailBack')?.addEventListener('click', () => { haptic(); RaagManager.showListView(); });

    // Daily Suggestions Overlay — close
    $('#rareSuggestionsClose')?.addEventListener('click', () => { haptic(); DailySuggestions.close(); });
    $('#rareSuggestionsBackdrop')?.addEventListener('click', () => DailySuggestions.close());

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
        // If not on welcome screen, show it first
        if (document.body.classList.contains('has-results')) {
            updateSearchInput('');
            sessionStorage.removeItem('gurbaniKhoj_state');
            showWelcome();
        }
        // Focus search bar
        setTimeout(() => {
            DOM.searchInput?.focus();
            DOM.searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
        DOM.tabSearch.classList.add('active');
    });

    DOM.tabMore?.addEventListener('click', () => {
        // Ghost-tap guard: ignore if keyboard was closed within last 600ms
        if (Date.now() - (State.keyboardClosedAt || 0) < 600) return;
        haptic();
        window.location.href = 'search-history.html';
    });

    DOM.tabBookmarks?.addEventListener('click', () => {
        // Ghost-tap guard: ignore if keyboard was closed within last 600ms
        if (Date.now() - (State.keyboardClosedAt || 0) < 600) return;
        haptic();
        window.location.href = '../Favorites/favorites.html';
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
                // ALWAYS consume and clear so it doesn't leak
                sessionStorage.removeItem('gurbaniKhoj_state');
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

    // ── Back-from-reader: restore raag view INSTANTLY (no animation delays) ──
    try {
        const raagBack = sessionStorage.getItem('gurbaniKhoj_backToRaag');
        if (raagBack) {
            sessionStorage.removeItem('gurbaniKhoj_backToRaag');
            const saved = JSON.parse(raagBack);
            const { raagId, raagEn, raagPa, raagTime, cachedShabads } = saved;

            // If we have cached shabads, inject into RaagManager's memory cache
            if (cachedShabads && Array.isArray(cachedShabads)) {
                if (!RaagManager._shabadCache) RaagManager._shabadCache = {};
                RaagManager._shabadCache[raagId] = cachedShabads;
            }

            showWelcome();

            // Open raag overlay INSTANTLY — skip all CSS transitions
            const overlay = document.getElementById('raagOverlay');
            if (overlay) {
                overlay.style.transition = 'none';
                overlay.style.display    = 'flex';
                overlay.classList.add('raag-open');
                requestAnimationFrame(() => { overlay.style.transition = ''; });
            }

            RaagManager.renderGrid();

            // Show detail view INSTANTLY too
            const lv = document.getElementById('raagListView');
            const dv = document.getElementById('raagDetailView');
            if (lv) lv.style.display = 'none';
            if (dv) {
                dv.style.transition    = 'none';
                dv.style.display       = 'flex';
                dv.style.flexDirection = 'column';
                dv.classList.add('detail-open');
                requestAnimationFrame(() => { dv.style.transition = ''; });
            }

            // Load the detail (will use in-memory cache if available → instant)
            RaagManager._currentRaag = { raagId, raagEn, raagPa, raagTime };
            RaagManager.openRaagDetail(raagId, raagEn, raagPa, raagTime);

            restored = true;
        }
    } catch(e) { console.warn('Raag back restore error:', e); }

    if (!restored) {
        showWelcome();
    }

    // Wire magic offline download button (Long Press = Progress Sheet, Tap = Download)
    const offlineBtn = document.getElementById('offlineMagicBtn');
    if (offlineBtn) {
        let pressTimer;
        let isLongPress = false;
        
        const startPress = () => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                haptic && haptic();
                OfflineCache.showOverlay();
            }, 500);
        };
        const endPress = () => clearTimeout(pressTimer);

        offlineBtn.addEventListener('touchstart', startPress, {passive: true});
        offlineBtn.addEventListener('mousedown', startPress);
        offlineBtn.addEventListener('touchend', endPress);
        offlineBtn.addEventListener('mouseup', endPress);
        offlineBtn.addEventListener('mouseleave', endPress);
        
        offlineBtn.addEventListener('click', (e) => { 
            if (isLongPress) {
                e.preventDefault();
                return;
            }
            haptic && haptic(); 
            OfflineCache.startDownload(); 
        });
        
        // Hide overlay bindings
        document.getElementById('offlineProgressBackdrop')?.addEventListener('click', () => OfflineCache.hideOverlay());
        document.querySelector('#offlineProgressSheet .sheet-handle')?.addEventListener('click', () => OfflineCache.hideOverlay());
    }

    // Check if all raags already cached (show green ring on reload)
    OfflineCache.checkAndRestoreState().catch(() => {});

    console.log('Gurbani Khoj initialized');
});
