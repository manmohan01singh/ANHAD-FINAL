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
    liveKirtanCard: $('#liveKirtanCard')
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
}

function showResults() {
    hideAllViews();
    DOM.resultsView?.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH LOGIC (Gurmukhi Only)
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

        DOM.loadMoreBtn.style.display = State.page < State.totalPages ? 'block' : 'none';
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
    if (State.sourceFilter === 'all') {
        DOM.resultsCount.textContent = `${total} results`;
    } else {
        const sourceName = GURBANI_SOURCES[State.sourceFilter]?.shortName || State.sourceFilter;
        DOM.resultsCount.textContent = `${filtered} / ${total} results (${sourceName})`;
    }
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

        // Get source info for badge
        const source = verse._source || GURBANI_SOURCES.G;

        // Apply search highlighting
        const gurmukhi = query ? highlightSearchTerm(gurmukhiRaw, query) : gurmukhiRaw;

        // Stagger animation delay
        const animDelay = Math.min(index * 40, 360);

        return `
            <article class="result-card" data-shabad="${shabadId}" data-verse="${verseId}" style="animation-delay: ${animDelay}ms">
                <div class="result-meta">
                    <span class="result-source-badge" style="background: ${source.color}15; color: ${source.color}">
                        ${source.shortName}
                    </span>
                    <span class="result-ang">Ang ${ang}</span>
                </div>
                <p class="result-gurmukhi">${gurmukhi}</p>
            </article>
        `;
    }).join('');

    if (append) {
        DOM.resultsList.insertAdjacentHTML('beforeend', html);
    } else {
        DOM.resultsList.innerHTML = html;
    }

    // Add click handlers for navigation
    DOM.resultsList.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', () => {
            haptic();
            const shabadId = card.dataset.shabad;
            const verseId = card.dataset.verse;

            // Save full search state to sessionStorage for back-navigation
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
            } catch (e) {
                console.warn('Could not save search state:', e);
            }

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
            DOM.searchInput.value = firstLetters;
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
        DOM.searchInput.value = State.keyboardText;
    },

    addChar(char) {
        State.keyboardText += char;
        DOM.searchInput.value = State.keyboardText;
        this.updatePreview();
        haptic();
    },

    backspace() {
        State.keyboardText = State.keyboardText.slice(0, -1);
        DOM.searchInput.value = State.keyboardText;
        this.updatePreview();
        haptic();
    },

    space() {
        State.keyboardText += ' ';
        DOM.searchInput.value = State.keyboardText;
        this.updatePreview();
        haptic();
    },

    search() {
        DOM.searchInput.value = State.keyboardText;
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
            DOM.searchInput.value = item.query;
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
    // Theme toggle
    DOM.themeToggle?.addEventListener('click', () => Theme.toggle());

    // Search input with debounced search
    let searchTimeout;
    DOM.searchInput.addEventListener('input', (e) => {
        // Update keyboard text state when typing directly
        State.keyboardText = e.target.value;

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

    // Mic button
    DOM.micBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!VoiceSearch.isListening) {
            VoiceSearch.start();
        }
    });

    // Keyboard button
    DOM.keyboardBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        Keyboard.open();
    });

    // Search bar - open keyboard when clicking (not the buttons)
    DOM.searchBar?.addEventListener('click', (e) => {
        // Don't open if clicking mic button or keyboard button
        if (e.target.closest('#micBtn') || e.target.closest('#keyboardBtn')) return;
        // Open Gurmukhi keyboard
        Keyboard.open();
    });

    DOM.voiceCancel?.addEventListener('click', () => {
        VoiceSearch.stop();
    });

    // Keyboard - closes when clicking backdrop or after search

    // Click on backdrop closes keyboard
    DOM.keyboardOverlay?.querySelector('.keyboard-backdrop')?.addEventListener('click', (e) => {
        e.stopPropagation();
        Keyboard.close();
    });

    // Keyboard keys - use both click and touch events for mobile
    const keyboardBody = DOM.keyboardOverlay?.querySelector('.keyboard-body');
    console.log('Keyboard body found:', keyboardBody);
    if (keyboardBody) {
        const handleKeyPress = (e) => {
            console.log('Key press event:', e.type, e.target);
            const key = e.target.closest('.kb-key');
            if (!key) {
                console.log('No .kb-key found for click');
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            console.log('Key clicked:', key.textContent.trim(), 'action:', key.dataset.action);
            const action = key.dataset.action;
            if (action === 'backspace') {
                Keyboard.backspace();
            } else if (action === 'space') {
                Keyboard.space();
            } else if (action === 'search') {
                Keyboard.search();
            } else {
                Keyboard.addChar(key.textContent.trim());
            }
        };

        keyboardBody.addEventListener('click', handleKeyPress);
        keyboardBody.addEventListener('touchstart', handleKeyPress, { passive: false });
        console.log('Keyboard event listeners attached');
    } else {
        console.error('Keyboard body not found!');
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
    } else {
        console.error('History button not found');
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

    // Try to restore full search state from sessionStorage (back-navigation)
    let restored = false;
    try {
        // Check if coming from history page with a query
        const historyQuery = sessionStorage.getItem('gurbaniKhoj_historyQuery');
        if (historyQuery) {
            sessionStorage.removeItem('gurbaniKhoj_historyQuery');
            DOM.searchInput.value = historyQuery;
            State.keyboardText = historyQuery;
            performSearch();
            restored = true;
        }

        if (!restored) {
            const savedRaw = sessionStorage.getItem('gurbaniKhoj_state');
            if (savedRaw) {
                const saved = JSON.parse(savedRaw);
                // Clear it so it only restores once
                // Keep state in storage so it persists for multiple back/forth navigations
                // sessionStorage.removeItem('gurbaniKhoj_state');

                if (saved.allResults && saved.allResults.length > 0) {
                    // Restore state
                    State.query = saved.query || '';
                    State.allResults = saved.allResults;
                    State.sourceFilter = saved.sourceFilter || 'all';
                    State.page = saved.page || 1;
                    State.totalPages = saved.totalPages || 1;
                    DOM.searchInput.value = saved.inputValue || saved.query || '';
                    State.keyboardText = DOM.searchInput.value;

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
