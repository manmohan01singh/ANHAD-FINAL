/**
 * ============================================
 * DAILY HUKAMNAMA - GURBANI RADIO
 * Pure JavaScript Module with BaniDB Integration
 * iOS 17+ Inspired Spiritual Experience
 * ============================================
 */

'use strict';

/* ==========================================
   CONFIGURATION & CONSTANTS
   ========================================== */

const CONFIG = {
    // BaniDB API Endpoints
    API: {
        BASE_URL: 'https://api.banidb.com/v2',
        HUKAMNAMA_TODAY: '/hukamnamas/today',
        HUKAMNAMA_BY_DATE: '/hukamnamas/{year}/{month}/{day}',
        RANDOM_SHABAD: '/random'
    },

    // Nanakshahi Calendar Months
    NANAKSHAHI_MONTHS: [
        'ਚੇਤ', 'ਵੈਸਾਖ', 'ਜੇਠ', 'ਹਾੜ', 'ਸਾਵਣ', 'ਭਾਦੋਂ',
        'ਅੱਸੂ', 'ਕੱਤਕ', 'ਮੱਘਰ', 'ਪੋਹ', 'ਮਾਘ', 'ਫੱਗਣ'
    ],

    // English Month Names
    ENGLISH_MONTHS: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ],

    // Day Names
    DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    DAY_NAMES_FULL: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    // Raag Mapping (BaniDB uses numbers)
    RAAG_MAP: {
        1: 'Sri Raag', 2: 'Raag Majh', 3: 'Raag Gauri',
        4: 'Raag Asa', 5: 'Raag Gujri', 6: 'Raag Devgandhari',
        7: 'Raag Bihagara', 8: 'Raag Wadahans', 9: 'Raag Sorath',
        10: 'Raag Dhanasari', 11: 'Raag Jaitsri', 12: 'Raag Todi',
        13: 'Raag Bairari', 14: 'Raag Tilang', 15: 'Raag Suhi',
        16: 'Raag Bilawal', 17: 'Raag Gaund', 18: 'Raag Ramkali',
        19: 'Raag Nat Narayan', 20: 'Raag Mali Gaura', 21: 'Raag Maru',
        22: 'Raag Tukhari', 23: 'Raag Kedara', 24: 'Raag Bhairav',
        25: 'Raag Basant', 26: 'Raag Sarang', 27: 'Raag Malar',
        28: 'Raag Kanra', 29: 'Raag Kalyan', 30: 'Raag Prabhati',
        31: 'Raag Jaijavanti'
    },

    // Writer Mapping
    WRITER_MAP: {
        1: 'Guru Nanak Dev Ji',
        2: 'Guru Angad Dev Ji',
        3: 'Guru Amar Das Ji',
        4: 'Guru Ram Das Ji',
        5: 'Guru Arjan Dev Ji',
        6: 'Guru Teg Bahadur Ji',
        7: 'Guru Gobind Singh Ji',
        8: 'Bhagat Kabir Ji',
        9: 'Bhagat Farid Ji',
        10: 'Bhagat Namdev Ji',
        11: 'Bhagat Ravidas Ji',
        12: 'Bhagat Trilochan Ji',
        13: 'Bhagat Dhanna Ji',
        14: 'Bhagat Beni Ji',
        15: 'Bhagat Bhikhan Ji',
        16: 'Bhagat Sain Ji',
        17: 'Bhagat Pipa Ji',
        18: 'Bhagat Ramanand Ji',
        19: 'Bhagat Parmanand Ji',
        20: 'Bhagat Sadhna Ji',
        21: 'Bhagat Jaidev Ji',
        22: 'Bhagat Surdas Ji',
        23: 'Bhai Mardana Ji',
        24: 'Baba Sundar Ji',
        25: 'Bhai Satta Ji',
        26: 'Bhai Balwand Ji'
    },

    // Default Settings
    DEFAULTS: {
        theme: 'dark',
        fontSize: 24,
        fontWeight: 400,
        lineSpacing: 1.8,
        fontFamily: "'Noto Sans Gurmukhi', sans-serif",
        showTransliteration: true,
        showEnglish: true,
        showPunjabi: true,
        larivaar: false,
        larivaarAssist: false
    },

    // LocalStorage Keys
    STORAGE_KEYS: {
        SETTINGS: 'gurbani_hukamnama_settings',
        FAVORITES: 'gurbani_hukamnama_favorites',
        CACHE: 'gurbani_hukamnama_cache',
        HISTORY: 'gurbani_hukamnama_history'
    },

    // Animation Delays
    ANIMATION: {
        TOAST_DURATION: 3000,
        DEBOUNCE_DELAY: 300
    }
};

/* ==========================================
   STATE MANAGEMENT
   ========================================== */

const State = {
    currentHukamnama: null,
    selectedDate: new Date(),
    isLoading: false,
    settings: { ...CONFIG.DEFAULTS },
    favorites: [],
    history: [],

    // Initialize state from localStorage
    async init() {
        this.loadSettings();
        this.loadFavorites();
        this.loadHistory();

        // Try to sync from IndexedDB if localStorage is empty
        await this.syncFromIndexedDB();
    },

    async syncFromIndexedDB() {
        try {
            if (window.GurbaniStorage) {
                await window.GurbaniStorage.init();

                // Restore favorites if empty
                if (this.favorites.length === 0) {
                    const storedFavorites = await window.GurbaniStorage.get('settings', 'hukamnama_favorites');
                    if (storedFavorites && storedFavorites.length > 0) {
                        this.favorites = storedFavorites;
                        localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(this.favorites));
                    }
                }

                // Restore history if empty
                if (this.history.length === 0) {
                    const storedHistory = await window.GurbaniStorage.get('settings', 'hukamnama_history');
                    if (storedHistory && storedHistory.length > 0) {
                        this.history = storedHistory;
                        localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
                    }
                }
            }
        } catch (e) {
            console.warn('IndexedDB sync error:', e);
        }
    },

    persistToIndexedDB() {
        try {
            if (window.GurbaniStorage && window.GurbaniStorage.isReady) {
                window.GurbaniStorage.set('settings', 'hukamnama_settings', this.settings);
                window.GurbaniStorage.set('settings', 'hukamnama_favorites', this.favorites);
                window.GurbaniStorage.set('settings', 'hukamnama_history', this.history);
            }
        } catch (e) {
            console.warn('IndexedDB persist error:', e);
        }
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            if (saved) {
                this.settings = { ...CONFIG.DEFAULTS, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    },

    saveSettings() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
            this.persistToIndexedDB();
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    },

    loadFavorites() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.FAVORITES);
            if (saved) {
                this.favorites = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load favorites:', e);
        }
    },

    saveFavorites() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(this.favorites));
            this.persistToIndexedDB();
        } catch (e) {
            console.warn('Failed to save favorites:', e);
        }
    },

    loadHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    this.history = parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load history:', e);
        }
    },

    saveHistory() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
            this.persistToIndexedDB();
        } catch (e) {
            console.warn('Failed to save history:', e);
        }
    },

    addToHistory(hukamnama, date) {
        try {
            const dateKey = this.formatDateKey(date);
            const title = hukamnama?.metadata?.title || '';
            const existingIndex = this.history.findIndex(h => h.date === dateKey);
            if (existingIndex > -1) {
                this.history.splice(existingIndex, 1);
            }
            this.history.unshift({
                date: dateKey,
                title,
                savedAt: new Date().toISOString()
            });
            this.history = this.history.slice(0, 20);
            this.saveHistory();
        } catch (e) {
            console.warn('Failed to update history:', e);
        }
    },

    isFavorite(date) {
        const dateStr = this.formatDateKey(date);
        return this.favorites.some(f => f.date === dateStr);
    },

    toggleFavorite(hukamnama, date) {
        const dateStr = this.formatDateKey(date);
        const index = this.favorites.findIndex(f => f.date === dateStr);

        if (index > -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            return false;
        } else {
            this.favorites.push({
                date: dateStr,
                hukamnama: hukamnama,
                savedAt: new Date().toISOString()
            });
            this.saveFavorites();
            return true;
        }
    },

    formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
};

/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */

const Utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Format English date
    formatEnglishDate(date) {
        const day = date.getDate();
        const month = CONFIG.ENGLISH_MONTHS[date.getMonth()];
        const year = date.getFullYear();
        const weekday = CONFIG.DAY_NAMES_FULL[date.getDay()];
        return `${weekday}, ${month} ${day}, ${year}`;
    },

    // Calculate Nanakshahi date (approximation)
    getNanakshahiDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        // Nanakshahi calendar epoch starts March 14
        const nanakshahiEpoch = new Date(year, 2, 14);
        const diffTime = date - nanakshahiEpoch;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let nanakshahiYear = year - 1468;
        let nanakshahiMonth, nanakshahiDay;

        // Simplified calculation for month lengths
        const monthLengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30];

        if (diffDays < 0) {
            // Before Chet 1
            nanakshahiYear--;
            const prevYearDays = 365 + diffDays;
            let remaining = prevYearDays;
            nanakshahiMonth = 0;

            for (let i = 0; i < 12; i++) {
                if (remaining < monthLengths[i]) {
                    nanakshahiMonth = i;
                    nanakshahiDay = remaining + 1;
                    break;
                }
                remaining -= monthLengths[i];
            }
        } else {
            let remaining = diffDays;
            nanakshahiMonth = 0;

            for (let i = 0; i < 12; i++) {
                if (remaining < monthLengths[i]) {
                    nanakshahiMonth = i;
                    nanakshahiDay = remaining + 1;
                    break;
                }
                remaining -= monthLengths[i];
            }
        }

        const monthName = CONFIG.NANAKSHAHI_MONTHS[nanakshahiMonth] || CONFIG.NANAKSHAHI_MONTHS[0];

        return {
            day: nanakshahiDay || 1,
            month: monthName,
            year: nanakshahiYear,
            formatted: `${nanakshahiDay || 1} ${monthName} ${nanakshahiYear}`
        };
    },

    // Convert to Gurmukhi numerals
    toGurmukhiNumerals(num) {
        const gurmukhiDigits = ['੦', '੧', '੨', '੩', '੪', '੫', '੬', '੭', '੮', '੯'];
        return String(num).split('').map(d => gurmukhiDigits[parseInt(d)] || d).join('');
    },

    // Get relative date label
    getRelativeDateLabel(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        const diffTime = today - compareDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays === -1) return 'Tomorrow';
        if (diffDays > 0 && diffDays <= 7) return `${diffDays} days ago`;

        return null;
    },

    // Haptic feedback simulation (visual)
    hapticFeedback(element) {
        if (!element) return;

        element.style.transform = 'scale(0.97)';
        setTimeout(() => {
            element.style.transform = '';
        }, 100);

        // Try native haptic if available
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    },

    // Safe HTML escape
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

/* ==========================================
   BaniDB API SERVICE
   ========================================== */

const BaniDBService = {
    // Fetch today's Hukamnama
    async fetchTodayHukamnama() {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.HUKAMNAMA_TODAY}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return this.parseHukamnamaResponse(data);
        } catch (error) {
            console.error('Error fetching today\'s Hukamnama:', error);
            throw error;
        }
    },

    // Fetch Hukamnama by date
    async fetchHukamnamaByDate(year, month, day) {
        try {
            const url = `${CONFIG.API.BASE_URL}${CONFIG.API.HUKAMNAMA_BY_DATE}`
                .replace('{year}', year)
                .replace('{month}', String(month).padStart(2, '0'))
                .replace('{day}', String(day).padStart(2, '0'));

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Hukamnama not available for this date');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return this.parseHukamnamaResponse(data);
        } catch (error) {
            console.error('Error fetching Hukamnama by date:', error);
            throw error;
        }
    },

    // Parse API response into structured format
    parseHukamnamaResponse(data) {
        if (!data) {
            throw new Error('Invalid response format');
        }

        if (data.hukamnamainfo) {
            const info = data.hukamnamainfo;
            const verses = data.hukamnama || [];

            const metadata = {
                date: info.date || new Date().toLocaleDateString('en-CA'),
                ang: info.pageno || null,
                raagId: null,
                writerId: null,
                raag: 'Sri Raag',
                writer: 'Guru Nanak Dev Ji',
                title: ''
            };

            const processedVerses = verses.map((verse, index) => {
                if (index === 0) {
                    if (verse.raagId) {
                        metadata.raagId = verse.raagId;
                        metadata.raag = CONFIG.RAAG_MAP[verse.raagId] || `Raag ${verse.raagId}`;
                    }
                    if (verse.writerId) {
                        metadata.writerId = verse.writerId;
                        metadata.writer = CONFIG.WRITER_MAP[verse.writerId] || `Writer ${verse.writerId}`;
                    }
                    if (verse.writer && verse.writer.english) {
                        metadata.writer = verse.writer.english;
                    }
                    if (verse.raag && verse.raag.english) {
                        metadata.raag = verse.raag.english;
                    }
                }

                return {
                    id: verse.verseId || verse.id || index,
                    gurmukhi: verse.verse || '',
                    transliteration: verse.transliteration || verse.translit || '',
                    translation: {
                        english: this.extractTranslation(verse, 'en'),
                        punjabi: this.extractTranslation(verse, 'pu')
                    },
                    larivaar: verse.larivaar || verse.verse?.replace(/\s+/g, '') || ''
                };
            });

            metadata.title = this.deriveTitle(processedVerses);

            return {
                metadata,
                verses: processedVerses,
                rawData: data
            };
        }

        if (!Array.isArray(data.shabads) || data.shabads.length === 0) {
            throw new Error('Invalid response format');
        }

        const firstInfo = data.shabads[0]?.shabadInfo || {};
        const greg = data?.date?.gregorian || {};
        const yyyy = greg.year || new Date().getFullYear();
        const mm = greg.month || (new Date().getMonth() + 1);
        const dd = greg.date || new Date().getDate();
        const dateKey = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

        const metadata = {
            date: dateKey,
            ang: firstInfo.pageNo || null,
            raagId: firstInfo?.raag?.raagId || null,
            writerId: firstInfo?.writer?.writerId || null,
            raag: firstInfo?.raag?.english || firstInfo?.raag?.unicode || 'Unknown Raag',
            writer: firstInfo?.writer?.english || firstInfo?.writer?.gurmukhi || 'Unknown',
            title: ''
        };

        const processedVerses = [];
        data.shabads.forEach((shabad, shabadIndex) => {
            const verses = Array.isArray(shabad?.verses) ? shabad.verses : [];
            verses.forEach((v, verseIndex) => {
                const verseObj = v?.verse || {};
                const larivaarObj = v?.larivaar || {};
                const gurmukhi = verseObj.unicode || verseObj.gurmukhi || '';
                const larivaar = larivaarObj.unicode || larivaarObj.gurmukhi || (gurmukhi ? gurmukhi.replace(/\s+/g, '') : '');
                const translitObj = v?.transliteration || {};
                const transliteration = translitObj.en || translitObj.english || '';

                processedVerses.push({
                    id: v.verseId || `${shabadIndex}-${verseIndex}`,
                    gurmukhi,
                    transliteration,
                    translation: {
                        english: this.extractTranslation(v, 'en'),
                        punjabi: this.extractTranslation(v, 'pu')
                    },
                    larivaar,
                    pageNo: v.pageNo || firstInfo.pageNo || null,
                    lineNo: v.lineNo || null
                });
            });
        });

        metadata.title = this.deriveTitle(processedVerses);

        return {
            metadata,
            verses: processedVerses,
            rawData: data
        };
    },

    deriveTitle(verses) {
        const candidates = Array.isArray(verses) ? verses : [];
        const isLikelyHeader = (t) => {
            const raw = (t || '').trim();
            const rawLower = raw.toLowerCase();
            return rawLower.includes('sloku') ||
                rawLower.includes('salok') ||
                rawLower.includes('pauvi') ||
                rawLower.includes('pauṛ') ||
                rawLower.includes('mahala') ||
                rawLower.includes('mhlw') ||
                rawLower.includes('rhwau') ||
                raw.startsWith('ੴ') ||
                raw.includes('ਸਲੋਕ') ||
                raw.includes('ਪਉੜੀ') ||
                raw.includes('ਰਹਾਉ') ||
                raw.includes('ਮਹਲਾ') ||
                raw.includes('ਮਃ') ||
                rawLower.includes('ghar') ||
                rawLower.includes('chaupade') ||
                raw.trim().length < 10;
        };
        for (const v of candidates) {
            const text = (v?.gurmukhi || '').trim();
            if (!text) continue;
            if (isLikelyHeader(text)) continue;
            return text;
        }
        return (candidates[0]?.gurmukhi || '').trim();
    },

    // Extract translation from verse object
    extractTranslation(verse, lang) {
        if (verse && verse.translation && typeof verse.translation === 'object') {
            if (lang === 'en') {
                const en = verse.translation.en;
                if (typeof en === 'string') return en;
                if (en && typeof en === 'object') {
                    return en.bdb || en.ms || en.ssk || '';
                }
            }
            if (lang === 'pu') {
                const pu = verse.translation.pu;
                const pick = (obj) => {
                    if (!obj) return '';
                    if (typeof obj === 'string') return obj;
                    if (typeof obj === 'object') return obj.unicode || obj.gurmukhi || '';
                    return '';
                };
                if (pu && typeof pu === 'object') {
                    return pick(pu.bdb) || pick(pu.ms) || pick(pu.ss) || pick(pu.ft) || '';
                }
            }
        }

        // Check different possible locations for translations
        if (verse.translation) {
            if (typeof verse.translation === 'string') {
                return lang === 'en' ? verse.translation : '';
            }

            if (verse.translation[lang]) {
                if (typeof verse.translation[lang] === 'string') {
                    return verse.translation[lang];
                }
                if (verse.translation[lang].bdb) {
                    return verse.translation[lang].bdb;
                }
                if (verse.translation[lang].ms) {
                    return verse.translation[lang].ms;
                }
                if (verse.translation[lang].ssk) {
                    return verse.translation[lang].ssk;
                }
            }
            // English specific keys
            if (lang === 'en') {
                return verse.translation.english ||
                    verse.translation.bdb ||
                    verse.translation.ms ||
                    verse.translation.ssk || '';
            }
            // Punjabi specific keys
            if (lang === 'pu') {
                return verse.translation.punjabi ||
                    verse.translation.ft ||
                    verse.translation.ss || '';
            }
        }

        return '';
    }
};

/* ==========================================
   DOM ELEMENTS CACHE
   ========================================== */

const DOM = {
    // Will be populated on DOMContentLoaded
    elements: {},

    init() {
        this.elements = {
            // Hero Section
            heroImage: document.getElementById('heroImage'),
            heroHukamnamaTitle: document.getElementById('heroHukamnamaTitle'),
            englishDate: document.getElementById('englishDate'),
            nanakshahiDate: document.getElementById('nanakshahiDate'),
            refreshBtn: document.getElementById('refreshBtn'),
            backBtn: document.getElementById('backBtn'),

            // Hukamnama Card
            hukamnamaCard: document.getElementById('hukamnamaCard'),
            hukamnamaMeta: document.getElementById('hukamnamaMeta'),
            raagDisplay: document.getElementById('raagDisplay'),
            angDisplay: document.getElementById('angDisplay'),
            writerDisplay: document.getElementById('writerDisplay'),
            settingsBtn: document.getElementById('settingsBtn'),

            // States
            loadingState: document.getElementById('loadingState'),
            errorState: document.getElementById('errorState'),
            errorMessage: document.getElementById('errorMessage'),
            retryBtn: document.getElementById('retryBtn'),
            hukamnamaContent: document.getElementById('hukamnamaContent'),

            // Text Sections
            gurmukhiSection: document.getElementById('gurmukhiSection'),
            gurmukhiText: document.getElementById('gurmukhiText'),
            transliterationSection: document.getElementById('transliterationSection'),
            transliterationText: document.getElementById('transliterationText'),
            englishSection: document.getElementById('englishSection'),
            englishText: document.getElementById('englishText'),
            punjabiSection: document.getElementById('punjabiSection'),
            punjabiText: document.getElementById('punjabiText'),
            hukamnamaFooterMeta: document.getElementById('hukamnamaFooterMeta'),

            // Action Buttons
            shareBtn: document.getElementById('shareBtn'),
            copyBtn: document.getElementById('copyBtn'),
            saveBtn: document.getElementById('saveBtn'),
            readModeBtn: document.getElementById('readModeBtn'),
            autoScrollBtn: document.getElementById('autoScrollBtn'),
            heartIcon: document.getElementById('heartIcon'),

            // Date Browser
            datePicker: document.getElementById('datePicker'),
            dateTrigger: document.getElementById('dateTrigger'),
            selectedDateLabel: document.getElementById('selectedDateLabel'),
            quickDates: document.getElementById('quickDates'),
            historyList: document.getElementById('historyList'),

            // FIX: Previous/Next Day Navigation Buttons
            prevDayBtn: document.getElementById('prevDayBtn'),
            nextDayBtn: document.getElementById('nextDayBtn'),

            // Settings
            settingsOverlay: document.getElementById('settingsOverlay'),
            settingsSheet: document.getElementById('settingsSheet'),
            closeSettings: document.getElementById('closeSettings'),
            fontSizeSlider: document.getElementById('fontSizeSlider'),
            fontSizeValue: document.getElementById('fontSizeValue'),
            fontWeightSlider: document.getElementById('fontWeightSlider'),
            fontWeightValue: document.getElementById('fontWeightValue'),
            lineSpacingSlider: document.getElementById('lineSpacingSlider'),
            lineSpacingValue: document.getElementById('lineSpacingValue'),
            fontFamilySelector: document.getElementById('fontFamilySelector'),
            larivaarToggle: document.getElementById('larivaarToggle'),
            larivaarAssistToggle: document.getElementById('larivaarAssistToggle'),
            larivaarAssistItem: document.getElementById('larivaarAssistItem'),
            transliterationToggle: document.getElementById('transliterationToggle'),
            englishToggle: document.getElementById('englishToggle'),
            punjabiToggle: document.getElementById('punjabiToggle'),
            themeToggleBtn: document.getElementById('themeToggleBtn'),

            // Toast
            toastContainer: document.getElementById('toastContainer'),

            // Action Sheet
            actionSheetOverlay: document.getElementById('actionSheetOverlay'),
            actionSheet: document.getElementById('actionSheet'),
            actionSheetContent: document.getElementById('actionSheetContent'),
            actionSheetCancel: document.getElementById('actionSheetCancel'),

            // Reading Mode
            readingToolbar: document.getElementById('readingToolbar'),
            readingDoneBtn: document.getElementById('readingDoneBtn'),
            readingTranslationsBtn: document.getElementById('readingTranslationsBtn'),
            readingAutoScrollToggle: document.getElementById('readingAutoScrollToggle'),
            scrollSpeedSlider: document.getElementById('scrollSpeedSlider')
        };
    },

    get(key) {
        return this.elements[key];
    }
};

/* ==========================================
   UI CONTROLLER
   ========================================== */

const UIController = {
    // Show loading state
    showLoading() {
        DOM.get('loadingState').classList.remove('hidden');
        DOM.get('loadingState').style.display = 'flex';
        DOM.get('errorState').classList.add('hidden');
        DOM.get('errorState').style.display = 'none';
        DOM.get('hukamnamaContent').classList.add('hidden');
        DOM.get('hukamnamaContent').style.display = 'none';

        // Animate refresh button
        DOM.get('refreshBtn').classList.add('loading');
    },

    // Hide loading state
    hideLoading() {
        DOM.get('loadingState').classList.add('hidden');
        DOM.get('loadingState').style.display = 'none';
        DOM.get('refreshBtn').classList.remove('loading');
    },

    // Show error state
    showError(message) {
        this.hideLoading();
        DOM.get('errorState').classList.remove('hidden');
        DOM.get('errorState').style.display = 'flex';
        DOM.get('hukamnamaContent').classList.add('hidden');
        DOM.get('hukamnamaContent').style.display = 'none';
        DOM.get('errorMessage').textContent = message || 'Please check your connection and try again.';
    },

    // Show Hukamnama content
    showContent() {
        this.hideLoading();
        DOM.get('errorState').classList.add('hidden');
        DOM.get('errorState').style.display = 'none';
        DOM.get('hukamnamaContent').classList.remove('hidden');
        DOM.get('hukamnamaContent').style.display = 'block';

        // Trigger entrance animation
        DOM.get('hukamnamaContent').style.animation = 'none';
        DOM.get('hukamnamaContent').offsetHeight; // Force reflow
        DOM.get('hukamnamaContent').style.animation = 'content-fade-in 0.6s ease-out forwards';
    },

    // Update date displays
    updateDates(date) {
        const englishDateEl = DOM.get('englishDate');
        const nanakshahiDateEl = DOM.get('nanakshahiDate');

        // English date
        const englishFormatted = Utils.formatEnglishDate(date);
        if (englishDateEl) {
            englishDateEl.textContent = englishFormatted;
        }

        // Nanakshahi date
        const nanakshahi = Utils.getNanakshahiDate(date);
        const gurmukhiDay = Utils.toGurmukhiNumerals(nanakshahi.day);
        const gurmukhiYear = Utils.toGurmukhiNumerals(nanakshahi.year);
        if (nanakshahiDateEl) {
            nanakshahiDateEl.textContent = `${gurmukhiDay} ${nanakshahi.month} ${gurmukhiYear}`;
        }

        // Update date picker
        const dateStr = State.formatDateKey(date);
        const datePickerEl = DOM.get('datePicker');
        if (datePickerEl) {
            datePickerEl.value = dateStr;
        }

        // Update label
        const relativeLabel = Utils.getRelativeDateLabel(date);
        const selectedDateLabelEl = DOM.get('selectedDateLabel');
        if (selectedDateLabelEl) {
            selectedDateLabelEl.textContent = relativeLabel || Utils.formatEnglishDate(date);
        }
    },

    // Update metadata display
    updateMetadata(metadata) {
        // Raag
        const raagSpan = DOM.get('raagDisplay').querySelector('span');
        raagSpan.textContent = metadata.raag || 'Unknown Raag';

        // Ang
        const angSpan = DOM.get('angDisplay').querySelector('span');
        angSpan.textContent = metadata.ang ? `Ang: ${metadata.ang}` : 'Ang: ---';

        // Writer
        const writerSpan = DOM.get('writerDisplay').querySelector('span');
        writerSpan.textContent = metadata.writer || 'Unknown';
    },

    // Render Hukamnama verses
    renderHukamnama(hukamnama) {
        const { metadata, verses } = hukamnama;

        // Update metadata
        this.updateMetadata(metadata);

        // Clear existing content
        DOM.get('gurmukhiText').innerHTML = '';
        DOM.get('transliterationText').innerHTML = '';
        DOM.get('englishText').innerHTML = '';
        DOM.get('punjabiText').innerHTML = '';

        // Render each verse
        verses.forEach((verse, index) => {
            // Gurmukhi
            const gurmukhiVerse = document.createElement('div');
            gurmukhiVerse.className = 'verse';
            gurmukhiVerse.setAttribute('data-verse-id', verse.id);
            gurmukhiVerse.innerHTML = State.settings.larivaar ?
                Utils.escapeHtml(verse.larivaar || verse.gurmukhi.replace(/\s+/g, '')) :
                Utils.escapeHtml(verse.gurmukhi);
            DOM.get('gurmukhiText').appendChild(gurmukhiVerse);

            // Transliteration
            if (verse.transliteration) {
                const translitVerse = document.createElement('div');
                translitVerse.className = 'verse';
                translitVerse.textContent = verse.transliteration;
                DOM.get('transliterationText').appendChild(translitVerse);
            }

            // English Translation
            if (verse.translation.english) {
                const englishVerse = document.createElement('div');
                englishVerse.className = 'verse';
                englishVerse.textContent = verse.translation.english;
                DOM.get('englishText').appendChild(englishVerse);
            }

            // Punjabi Translation
            if (verse.translation.punjabi) {
                const punjabiVerse = document.createElement('div');
                punjabiVerse.className = 'verse';
                punjabiVerse.textContent = verse.translation.punjabi;
                DOM.get('punjabiText').appendChild(punjabiVerse);
            }
        });

        // Apply current settings
        this.applySettings();

        // Update save button state
        this.updateSaveButtonState();

        // Hero title + footer meta
        const heroTitle = DOM.get('heroHukamnamaTitle');
        if (heroTitle) {
            heroTitle.textContent = metadata.title || verses?.[0]?.gurmukhi || 'Daily Hukamnama';
        }
        const footerMeta = DOM.get('hukamnamaFooterMeta');
        if (footerMeta) {
            const ang = metadata.ang ? `Ang ${metadata.ang}` : '';
            const raag = metadata.raag ? `${metadata.raag}` : '';
            const writer = metadata.writer ? `${metadata.writer}` : '';
            const parts = [raag, ang, writer].filter(Boolean);
            footerMeta.textContent = parts.join(' • ');
        }
    },

    renderHistory() {
        const list = DOM.get('historyList');
        if (!list) return;
        list.innerHTML = '';

        const items = Array.isArray(State.history) ? State.history.slice(0, 8) : [];
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'history-item';
            btn.setAttribute('data-date', item.date);
            btn.innerHTML = `
                <div class="history-date">${Utils.escapeHtml(item.date)}</div>
                <div class="history-title-text">${Utils.escapeHtml(item.title || 'Hukamnama')}</div>
            `;
            btn.addEventListener('click', () => {
                const dt = new Date(item.date + 'T00:00:00');
                if (!isNaN(dt.getTime())) {
                    this.selectDate(dt);
                }
            });
            list.appendChild(btn);
        });
    },

    // Update save/favorite button state
    updateSaveButtonState() {
        const isFav = State.isFavorite(State.selectedDate);
        const saveBtn = DOM.get('saveBtn');
        const heartIcon = DOM.get('heartIcon');

        if (isFav) {
            saveBtn.classList.add('saved');
            heartIcon.setAttribute('fill', 'currentColor');
        } else {
            saveBtn.classList.remove('saved');
            heartIcon.setAttribute('fill', 'none');
        }
    },

    // Apply settings to UI
    applySettings() {
        const settings = State.settings;

        // Theme
        document.documentElement.setAttribute('data-theme', settings.theme);
        this.updateThemeButtons(settings.theme);

        // Font size
        DOM.get('gurmukhiText').style.fontSize = `${settings.fontSize}px`;
        DOM.get('fontSizeSlider').value = settings.fontSize;
        DOM.get('fontSizeValue').textContent = `${settings.fontSize}px`;

        // Line spacing
        DOM.get('gurmukhiText').style.lineHeight = settings.lineSpacing;
        DOM.get('lineSpacingSlider').value = settings.lineSpacing;
        DOM.get('lineSpacingValue').textContent = settings.lineSpacing;

        // Font family
        DOM.get('gurmukhiText').style.fontFamily = settings.fontFamily;
        DOM.get('punjabiText').style.fontFamily = settings.fontFamily;
        DOM.get('fontFamilySelector').value = settings.fontFamily;

        // Larivaar
        DOM.get('larivaarToggle').checked = settings.larivaar;
        if (settings.larivaar) {
            DOM.get('gurmukhiText').classList.add('larivaar');
        } else {
            DOM.get('gurmukhiText').classList.remove('larivaar');
        }

        // Section visibility
        DOM.get('transliterationToggle').checked = settings.showTransliteration;
        DOM.get('transliterationSection').style.display = settings.showTransliteration ? 'block' : 'none';

        DOM.get('englishToggle').checked = settings.showEnglish;
        DOM.get('englishSection').style.display = settings.showEnglish ? 'block' : 'none';

        DOM.get('punjabiToggle').checked = settings.showPunjabi;
        DOM.get('punjabiSection').style.display = settings.showPunjabi ? 'block' : 'none';
    },

    // Update theme toggle buttons
    updateThemeButtons(theme) {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    // Generate quick date chips
    generateQuickDates() {
        const container = DOM.get('quickDates');
        container.innerHTML = '';

        const today = new Date();

        // Generate last 14 days
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            const chip = document.createElement('button');
            chip.className = 'quick-date-chip';
            chip.setAttribute('data-date', State.formatDateKey(date));

            let dayLabel = CONFIG.DAY_NAMES[date.getDay()];
            if (i === 0) dayLabel = 'Today';
            if (i === 1) dayLabel = 'Yesterday';

            chip.innerHTML = `
                <span class="day-name">${dayLabel}</span>
                <span class="day-date">${date.getDate()}</span>
            `;

            // Mark active
            if (State.formatDateKey(date) === State.formatDateKey(State.selectedDate)) {
                chip.classList.add('active');
            }

            chip.addEventListener('click', () => {
                this.selectDate(date);
            });

            container.appendChild(chip);
        }
    },

    // Select a date
    selectDate(date) {
        State.selectedDate = date;
        this.updateDates(date);
        this.generateQuickDates();
        HukamnamaController.loadHukamnama(date);
    },

    // Show toast notification
    showToast(message, type = 'info', duration = CONFIG.ANIMATION.TOAST_DURATION) {
        const container = DOM.get('toastContainer');

        const toast = document.createElement('div');
        toast.className = 'toast';

        let iconSvg = '';
        switch (type) {
            case 'success':
                iconSvg = '<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5"/></svg>';
                break;
            case 'error':
                iconSvg = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
                break;
            case 'warning':
                iconSvg = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
                break;
            default:
                iconSvg = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
        }

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <span class="toast-message">${Utils.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Remove after duration
        setTimeout(() => {
            toast.classList.add('toast-hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    // Open settings panel
    openSettings() {
        DOM.get('settingsOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    // Close settings panel
    closeSettings() {
        DOM.get('settingsOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }
};

const ActionSheetController = {
    open(items = []) {
        const overlay = DOM.get('actionSheetOverlay');
        const content = DOM.get('actionSheetContent');
        if (!overlay || !content) return;

        content.innerHTML = '';

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = `action-sheet-item ${item.destructive ? 'destructive' : ''}`;
            btn.textContent = item.label;
            btn.addEventListener('click', async () => {
                try {
                    await item.onSelect?.();
                } finally {
                    this.close();
                }
            });
            content.appendChild(btn);
        });

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        const overlay = DOM.get('actionSheetOverlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};

const AutoScrollController = {
    isRunning: false,
    rafId: null,
    lastTs: 0,
    speedPxPerSec: 35,

    setSpeed(pxPerSec) {
        const val = Number(pxPerSec);
        if (!Number.isFinite(val)) return;
        this.speedPxPerSec = Math.max(5, Math.min(200, val));
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTs = 0;
        UIController.showToast('Auto-scroll started', 'info', 1500);

        const tick = (ts) => {
            if (!this.isRunning) return;
            if (!this.lastTs) this.lastTs = ts;
            const dt = (ts - this.lastTs) / 1000;
            this.lastTs = ts;

            const delta = this.speedPxPerSec * dt;
            window.scrollBy(0, delta);

            const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
            if (atBottom) {
                this.stop();
                UIController.showToast('Reached end', 'success', 1500);
                return;
            }
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
    },

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        UIController.showToast('Auto-scroll stopped', 'info', 1200);
    },

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }
};

const ReadingModeController = {
    isActive: false,
    translationsVisible: true,

    open() {
        if (this.isActive) return;
        this.isActive = true;
        document.body.classList.add('reading-mode');
        const toolbar = DOM.get('readingToolbar');
        if (toolbar) toolbar.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    close() {
        if (!this.isActive) return;
        this.isActive = false;
        document.body.classList.remove('reading-mode');
        const toolbar = DOM.get('readingToolbar');
        if (toolbar) toolbar.classList.remove('active');
        if (AutoScrollController.isRunning) {
            AutoScrollController.stop();
        }
    },

    toggleTranslations() {
        this.translationsVisible = !this.translationsVisible;
        const show = this.translationsVisible;
        DOM.get('transliterationSection').style.display = show && State.settings.showTransliteration ? 'block' : 'none';
        DOM.get('englishSection').style.display = show && State.settings.showEnglish ? 'block' : 'none';
        DOM.get('punjabiSection').style.display = show && State.settings.showPunjabi ? 'block' : 'none';
    }
};

/* ==========================================
   HUKAMNAMA CONTROLLER
   ========================================== */

const HukamnamaController = {
    // Load Hukamnama (today or by date)
    async loadHukamnama(date = null) {
        if (State.isLoading) return;

        State.isLoading = true;
        UIController.showLoading();

        try {
            let hukamnama;
            const targetDate = date || new Date();
            const dateKey = State.formatDateKey(targetDate);

            const cached = CacheController.getCached(dateKey);
            if (cached) {
                hukamnama = cached;
            }

            if (!hukamnama && (!date || this.isToday(date))) {
                // Fetch today's Hukamnama
                hukamnama = await BaniDBService.fetchTodayHukamnama();
                State.selectedDate = new Date();
            } else if (!hukamnama) {
                // Fetch by specific date
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();
                hukamnama = await BaniDBService.fetchHukamnamaByDate(year, month, day);
                State.selectedDate = date;
            }

            CacheController.setCached(State.formatDateKey(State.selectedDate), hukamnama);

            // Store current Hukamnama
            State.currentHukamnama = hukamnama;

            State.addToHistory(hukamnama, State.selectedDate);

            // Update UI
            UIController.updateDates(State.selectedDate);
            UIController.renderHukamnama(hukamnama);
            UIController.showContent();
            UIController.generateQuickDates();
            UIController.renderHistory();

        } catch (error) {
            console.error('Failed to load Hukamnama:', error);
            UIController.showError(error.message || 'Failed to load Hukamnama. Please try again.');
        } finally {
            State.isLoading = false;
        }
    },

    // Check if date is today
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    },

    // Refresh current Hukamnama
    refresh() {
        Utils.hapticFeedback(DOM.get('refreshBtn'));
        this.loadHukamnama(State.selectedDate);
    },

    // Share Hukamnama
    async share() {
        if (!State.currentHukamnama) {
            UIController.showToast('No Hukamnama loaded to share', 'warning');
            return;
        }

        Utils.hapticFeedback(DOM.get('shareBtn'));

        ActionSheetController.open([
            { label: 'Share as Text', onSelect: () => this.shareAsText() },
            { label: 'Share as Image', onSelect: () => ShareImageController.shareAsImage() }
        ]);
    },

    async shareAsText() {
        const shareText = this.generateShareText();
        const shareData = {
            title: 'Daily Hukamnama - Gurbani Radio',
            text: shareText,
            url: window.location.href
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                UIController.showToast('Shared successfully!', 'success');
            } else {
                // Fallback to clipboard
                await this.copyToClipboard(shareText);
                UIController.showToast('Copied to clipboard for sharing!', 'success');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
                // Fallback to clipboard
                await this.copyToClipboard(shareText);
                UIController.showToast('Copied to clipboard!', 'success');
            }
        }
    },

    // Copy Hukamnama to clipboard
    async copy() {
        if (!State.currentHukamnama) {
            UIController.showToast('No Hukamnama loaded to copy', 'warning');
            return;
        }

        Utils.hapticFeedback(DOM.get('copyBtn'));

        ActionSheetController.open([
            {
                label: 'Copy Gurmukhi Only', onSelect: async () => {
                    await this.copyToClipboard(this.generateCopyTextGurmukhiOnly());
                    this.showCopySuccess();
                }
            },
            {
                label: 'Copy Full (with Translations)', onSelect: async () => {
                    await this.copyToClipboard(this.generateCopyText());
                    this.showCopySuccess();
                }
            }
        ]);
    },

    showCopySuccess() {
        const copyBtn = DOM.get('copyBtn');
        if (copyBtn) {
            copyBtn.classList.add('success');
            setTimeout(() => copyBtn.classList.remove('success'), 1500);
        }
        UIController.showToast('Copied to clipboard!', 'success');
    },

    // Copy text to clipboard helper
    async copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    },

    // Save/Favorite Hukamnama
    save() {
        if (!State.currentHukamnama) {
            UIController.showToast('No Hukamnama loaded to save', 'warning');
            return;
        }

        Utils.hapticFeedback(DOM.get('saveBtn'));

        const isSaved = State.toggleFavorite(State.currentHukamnama, State.selectedDate);
        UIController.updateSaveButtonState();

        if (isSaved) {
            UIController.showToast('Hukamnama saved to favorites! ❤️', 'success');
        } else {
            UIController.showToast('Removed from favorites', 'info');
        }
    },

    // Generate share text
    generateShareText() {
        const { metadata, verses } = State.currentHukamnama;
        const dateStr = Utils.formatEnglishDate(State.selectedDate);

        let text = `🙏 Daily Hukamnama - ${dateStr}\n`;
        text += `📖 ${metadata.raag} | Ang ${metadata.ang}\n`;
        text += `✍️ ${metadata.writer}\n\n`;

        text += `ੴ\n\n`;

        // Add Gurmukhi
        verses.forEach(verse => {
            text += `${verse.gurmukhi}\n`;
        });

        text += `\n— — —\n\n`;

        // Add English translation
        verses.forEach(verse => {
            if (verse.translation.english) {
                text += `${verse.translation.english}\n`;
            }
        });

        text += `\nਵਾਹਿਗੁਰੂ 🙏\n`;
        text += `\n— Gurbani Radio`;

        return text;
    },

    // Generate copy text (more detailed)
    generateCopyText() {
        const { metadata, verses } = State.currentHukamnama;
        const dateStr = Utils.formatEnglishDate(State.selectedDate);
        const nanakshahi = Utils.getNanakshahiDate(State.selectedDate);

        let text = `═══════════════════════════════════\n`;
        text += `       DAILY HUKAMNAMA\n`;
        text += `       Sri Darbar Sahib, Amritsar\n`;
        text += `═══════════════════════════════════\n\n`;

        text += `📅 ${dateStr}\n`;
        text += `🗓️ ${nanakshahi.formatted} (Nanakshahi)\n\n`;

        text += `📖 ${metadata.raag}\n`;
        text += `📃 Ang: ${metadata.ang}\n`;
        text += `✍️ ${metadata.writer}\n\n`;

        text += `═══════════════════════════════════\n`;
        text += `              ੴ\n`;
        text += `═══════════════════════════════════\n\n`;

        // Gurmukhi
        text += `【 ਗੁਰਮੁਖੀ 】\n\n`;
        verses.forEach(verse => {
            text += `${verse.gurmukhi}\n\n`;
        });

        // Transliteration
        if (State.settings.showTransliteration) {
            text += `\n【 Transliteration 】\n\n`;
            verses.forEach(verse => {
                if (verse.transliteration) {
                    text += `${verse.transliteration}\n\n`;
                }
            });
        }

        // English
        if (State.settings.showEnglish) {
            text += `\n【 English Translation 】\n\n`;
            verses.forEach(verse => {
                if (verse.translation.english) {
                    text += `${verse.translation.english}\n\n`;
                }
            });
        }

        // Punjabi
        if (State.settings.showPunjabi) {
            text += `\n【 ਪੰਜਾਬੀ ਅਰਥ 】\n\n`;
            verses.forEach(verse => {
                if (verse.translation.punjabi) {
                    text += `${verse.translation.punjabi}\n\n`;
                }
            });
        }

        text += `═══════════════════════════════════\n`;
        text += `           ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ\n`;
        text += `           ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ\n`;
        text += `═══════════════════════════════════\n\n`;

        text += `— Gurbani Radio | gurbaniradio.app\n`;

        return text;
    },

    generateCopyTextGurmukhiOnly() {
        const { metadata, verses } = State.currentHukamnama;
        const dateStr = Utils.formatEnglishDate(State.selectedDate);

        let text = `Daily Hukamnama - ${dateStr}\n`;
        text += `${metadata.raag || ''}${metadata.ang ? ` | Ang ${metadata.ang}` : ''}\n`;
        text += `${metadata.writer || ''}\n\n`;
        verses.forEach(v => {
            if (v.gurmukhi) text += `${v.gurmukhi}\n`;
        });
        return text.trim();
    }
};

/* ==========================================
   SETTINGS CONTROLLER
   ========================================== */

const SettingsController = {
    // Update theme
    setTheme(theme) {
        State.settings.theme = theme;
        State.saveSettings();
        UIController.applySettings();

        // Update meta theme color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#1a1a2e' : '#f5f5f7';
        }
    },

    // Update font size
    setFontSize(size) {
        State.settings.fontSize = parseInt(size);
        State.saveSettings();
        DOM.get('gurmukhiText').style.fontSize = `${size}px`;
        DOM.get('fontSizeValue').textContent = `${size}px`;
    },

    // Update line spacing
    setLineSpacing(spacing) {
        State.settings.lineSpacing = parseFloat(spacing);
        State.saveSettings();
        DOM.get('gurmukhiText').style.lineHeight = spacing;
        DOM.get('lineSpacingValue').textContent = spacing;
    },

    // Update font family
    setFontFamily(family) {
        State.settings.fontFamily = family;
        State.saveSettings();
        DOM.get('gurmukhiText').style.fontFamily = family;
        DOM.get('punjabiText').style.fontFamily = family;
    },

    // Update font weight
    setFontWeight(weight) {
        State.settings.fontWeight = parseInt(weight);
        State.saveSettings();
        DOM.get('gurmukhiText').style.fontWeight = weight;
        const fontWeightValue = DOM.get('fontWeightValue');
        if (fontWeightValue) fontWeightValue.textContent = weight;
    },

    // Toggle Larivaar Assist mode
    toggleLarivaarAssist(enabled) {
        State.settings.larivaarAssist = enabled;
        State.saveSettings();
        const gurmukhiText = DOM.get('gurmukhiText');
        if (enabled) {
            gurmukhiText.classList.add('larivaar-assist');
        } else {
            gurmukhiText.classList.remove('larivaar-assist');
        }
    },

    // Toggle Larivaar mode
    toggleLarivaar(enabled) {
        State.settings.larivaar = enabled;
        State.saveSettings();

        const gurmukhiText = DOM.get('gurmukhiText');

        if (enabled) {
            gurmukhiText.classList.add('larivaar');
            // Re-render with larivaar text
            if (State.currentHukamnama) {
                const verses = gurmukhiText.querySelectorAll('.verse');
                State.currentHukamnama.verses.forEach((verse, index) => {
                    if (verses[index]) {
                        verses[index].textContent = verse.larivaar || verse.gurmukhi.replace(/\s+/g, '');
                    }
                });
            }
        } else {
            gurmukhiText.classList.remove('larivaar');
            // Re-render with padched text
            if (State.currentHukamnama) {
                const verses = gurmukhiText.querySelectorAll('.verse');
                State.currentHukamnama.verses.forEach((verse, index) => {
                    if (verses[index]) {
                        verses[index].textContent = verse.gurmukhi;
                    }
                });
            }
        }
    },

    // Toggle section visibility
    toggleSection(section, enabled) {
        switch (section) {
            case 'transliteration':
                State.settings.showTransliteration = enabled;
                DOM.get('transliterationSection').style.display = enabled ? 'block' : 'none';
                break;
            case 'english':
                State.settings.showEnglish = enabled;
                DOM.get('englishSection').style.display = enabled ? 'block' : 'none';
                break;
            case 'punjabi':
                State.settings.showPunjabi = enabled;
                DOM.get('punjabiSection').style.display = enabled ? 'block' : 'none';
                break;
        }
        State.saveSettings();
    },

    // Adjust text size inline (from section controls)
    adjustTextSize(target, action) {
        const currentSize = State.settings.fontSize;
        let newSize;

        if (action === 'increase') {
            newSize = Math.min(currentSize + 2, 48);
        } else {
            newSize = Math.max(currentSize - 2, 14);
        }

        this.setFontSize(newSize);
        DOM.get('fontSizeSlider').value = newSize;

        // Visual feedback
        UIController.showToast(`Font size: ${newSize}px`, 'info', 1500);
    }
};

/* ==========================================
   EVENT HANDLERS
   ========================================== */

const EventHandlers = {
    init() {
        this.bindNavigationEvents();
        this.bindActionEvents();
        this.bindSettingsEvents();
        this.bindDateEvents();
        this.bindSectionEvents();
        this.bindKeyboardEvents();
        this.bindTouchEvents();
        this.bindThemeEvents();
        this.bindSliderEvents();
    },

    // Navigation events
    bindNavigationEvents() {
        // Back button
        DOM.get('backBtn').addEventListener('click', () => {
            Utils.hapticFeedback(DOM.get('backBtn'));
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '../index.html';
            }
        });

        // Refresh button
        DOM.get('refreshBtn').addEventListener('click', () => {
            HukamnamaController.refresh();
        });

        // Retry button
        DOM.get('retryBtn').addEventListener('click', () => {
            Utils.hapticFeedback(DOM.get('retryBtn'));
            HukamnamaController.loadHukamnama(State.selectedDate);
        });
    },

    // FIX: Theme toggle buttons - properly wire up dark/light toggle
    bindThemeEvents() {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (!theme) return;

                Utils.hapticFeedback(btn);
                SettingsController.setTheme(theme);

                // Update active state on all theme buttons
                document.querySelectorAll('.theme-option').forEach(b => {
                    b.classList.toggle('active', b.dataset.theme === theme);
                });

                UIController.showToast(`Switched to ${theme} mode`, 'success', 1500);
            });
        });
    },

    // FIX: Font size and spacing sliders - proper reactive binding
    bindSliderEvents() {
        const fontSizeSlider = DOM.get('fontSizeSlider');
        const lineSpacingSlider = DOM.get('lineSpacingSlider');

        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                SettingsController.setFontSize(size);
            });
        }

        if (lineSpacingSlider) {
            lineSpacingSlider.addEventListener('input', (e) => {
                const spacing = parseFloat(e.target.value);
                SettingsController.setLineSpacing(spacing);
            });
        }

        // Font family selector
        const fontFamilySelector = DOM.get('fontFamilySelector');
        if (fontFamilySelector) {
            fontFamilySelector.addEventListener('change', (e) => {
                SettingsController.setFontFamily(e.target.value);
            });
        }

        // Content toggles
        const larivaarToggle = DOM.get('larivaarToggle');
        if (larivaarToggle) {
            larivaarToggle.addEventListener('change', (e) => {
                SettingsController.toggleLarivaar(e.target.checked);
            });
        }

        const transliterationToggle = DOM.get('transliterationToggle');
        if (transliterationToggle) {
            transliterationToggle.addEventListener('change', (e) => {
                SettingsController.toggleSection('transliteration', e.target.checked);
            });
        }

        const englishToggle = DOM.get('englishToggle');
        if (englishToggle) {
            englishToggle.addEventListener('change', (e) => {
                SettingsController.toggleSection('english', e.target.checked);
            });
        }

        const punjabiToggle = DOM.get('punjabiToggle');
        if (punjabiToggle) {
            punjabiToggle.addEventListener('change', (e) => {
                SettingsController.toggleSection('punjabi', e.target.checked);
            });
        }

        // Font weight slider
        const fontWeightSlider = DOM.get('fontWeightSlider');
        if (fontWeightSlider) {
            fontWeightSlider.addEventListener('input', (e) => {
                const weight = parseInt(e.target.value);
                SettingsController.setFontWeight(weight);
            });
        }

        // Larivaar assist toggle
        const larivaarAssistToggle = DOM.get('larivaarAssistToggle');
        if (larivaarAssistToggle) {
            larivaarAssistToggle.addEventListener('change', (e) => {
                SettingsController.toggleLarivaarAssist(e.target.checked);
            });
        }

        // Top bar theme toggle button
        const themeToggleBtn = DOM.get('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                Utils.hapticFeedback(themeToggleBtn);
                const currentTheme = State.settings.theme;
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                SettingsController.setTheme(newTheme);
                UIController.showToast(`Switched to ${newTheme} mode`, 'success', 1500);
            });
        }
    },

    // Action buttons
    bindActionEvents() {
        // Share
        const shareBtn = DOM.get('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                Utils.hapticFeedback(shareBtn);
                ActionSheetController.open([
                    { label: 'Share as Text', onSelect: () => HukamnamaController.shareAsText() },
                    { label: 'Share as Image', onSelect: () => ShareImageController.shareAsImage() }
                ]);
            });
        }

        // Copy
        const copyBtn = DOM.get('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                HukamnamaController.copy();
            });
        }

        // Save/Favorite
        const saveBtn = DOM.get('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                HukamnamaController.save();
            });
        }

        // Reading mode
        const readModeBtn = DOM.get('readModeBtn');
        if (readModeBtn) {
            readModeBtn.addEventListener('click', () => {
                Utils.hapticFeedback(readModeBtn);
                ReadingModeController.open();
            });
        }

        // Auto scroll quick toggle
        const autoScrollBtn = DOM.get('autoScrollBtn');
        if (autoScrollBtn) {
            autoScrollBtn.addEventListener('click', () => {
                Utils.hapticFeedback(autoScrollBtn);
                AutoScrollController.toggle();
            });
        }
    },

    // Settings events
    bindSettingsEvents() {
        // Open settings
        DOM.get('settingsBtn').addEventListener('click', () => {
            Utils.hapticFeedback(DOM.get('settingsBtn'));
            UIController.openSettings();
        });

        // Close settings
        DOM.get('closeSettings').addEventListener('click', () => {
            UIController.closeSettings();
        });

        // Close on overlay click
        DOM.get('settingsOverlay').addEventListener('click', (e) => {
            if (e.target === DOM.get('settingsOverlay')) {
                UIController.closeSettings();
            }
        });

        const actionSheetOverlay = DOM.get('actionSheetOverlay');
        const actionSheetCancel = DOM.get('actionSheetCancel');
        if (actionSheetOverlay) {
            actionSheetOverlay.addEventListener('click', (e) => {
                if (e.target === actionSheetOverlay) {
                    ActionSheetController.close();
                }
            });
        }
        if (actionSheetCancel) {
            actionSheetCancel.addEventListener('click', () => {
                ActionSheetController.close();
            });
        }

        const readingDoneBtn = DOM.get('readingDoneBtn');
        if (readingDoneBtn) {
            readingDoneBtn.addEventListener('click', () => {
                ReadingModeController.close();
            });
        }

        const readingTranslationsBtn = DOM.get('readingTranslationsBtn');
        if (readingTranslationsBtn) {
            readingTranslationsBtn.addEventListener('click', () => {
                ReadingModeController.toggleTranslations();
            });
        }

        const readingAutoScrollToggle = DOM.get('readingAutoScrollToggle');
        if (readingAutoScrollToggle) {
            readingAutoScrollToggle.addEventListener('click', () => {
                AutoScrollController.toggle();
            });
        }

        const scrollSpeedSlider = DOM.get('scrollSpeedSlider');
        if (scrollSpeedSlider) {
            scrollSpeedSlider.addEventListener('input', Utils.debounce((e) => {
                AutoScrollController.setSpeed(e.target.value);
            }, 30));
        }
    },

    // Date picker events
    bindDateEvents() {
        // Date picker change
        DOM.get('datePicker').addEventListener('change', (e) => {
            const selectedDate = new Date(e.target.value + 'T00:00:00');
            if (!isNaN(selectedDate.getTime())) {
                UIController.selectDate(selectedDate);
            }
        });

        const dateTrigger = DOM.get('dateTrigger');
        const datePicker = DOM.get('datePicker');
        if (dateTrigger && datePicker) {
            dateTrigger.addEventListener('click', () => {
                try {
                    if (datePicker.showPicker) {
                        datePicker.showPicker();
                    } else {
                        datePicker.focus();
                        datePicker.click();
                    }
                } catch (e) {
                    datePicker.focus();
                    datePicker.click();
                }
            });
        }

        // Set max date to today
        const today = new Date();
        DOM.get('datePicker').max = State.formatDateKey(today);

        // Set min date (BaniDB has data from around 2002)
        DOM.get('datePicker').min = '2002-01-01';

        // FIX: Previous/Next Day Navigation
        const prevDayBtn = DOM.get('prevDayBtn');
        const nextDayBtn = DOM.get('nextDayBtn');

        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', () => {
                Utils.hapticFeedback(prevDayBtn);
                const prevDate = new Date(State.selectedDate);
                prevDate.setDate(prevDate.getDate() - 1);

                // Check if date is valid (not before 2002)
                const minDate = new Date('2002-01-01T00:00:00');
                if (prevDate >= minDate) {
                    UIController.selectDate(prevDate);
                } else {
                    UIController.showToast('No earlier Hukamnama available', 'info');
                }
            });
        }

        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', () => {
                Utils.hapticFeedback(nextDayBtn);
                const nextDate = new Date(State.selectedDate);
                nextDate.setDate(nextDate.getDate() + 1);

                // Check if date is not in future
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                if (nextDate <= todayDate) {
                    UIController.selectDate(nextDate);
                } else {
                    UIController.showToast('Future Hukamnama not available yet', 'info');
                }
            });
        }
    },

    // Section collapse/expand events
    bindSectionEvents() {
        // Toggle section buttons
        document.querySelectorAll('.toggle-section-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                const textContent = btn.closest('.text-section').querySelector('.text-content');
                const isCollapsed = textContent.classList.toggle('collapsed');
                btn.classList.toggle('collapsed', isCollapsed);
            });
        });

        // Text size adjustment buttons
        document.querySelectorAll('.text-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Utils.hapticFeedback(btn);
                SettingsController.adjustTextSize(btn.dataset.target, btn.dataset.action);
            });
        });
    },

    // Keyboard shortcuts
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Escape to close settings
            if (e.key === 'Escape') {
                UIController.closeSettings();
            }

            // Ctrl/Cmd + C to copy
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !window.getSelection().toString()) {
                e.preventDefault();
                HukamnamaController.copy();
            }

            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                HukamnamaController.save();
            }

            // R to refresh
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
                HukamnamaController.refresh();
            }
        });
    },

    // Touch gestures
    bindTouchEvents() {
        let touchStartY = 0;
        let touchStartX = 0;

        const settingsSheet = DOM.get('settingsSheet');

        // Swipe down to close settings
        settingsSheet.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        settingsSheet.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const deltaY = touchY - touchStartY;
            const deltaX = Math.abs(touchX - touchStartX);

            // If scrolled down more than sideways and more than 100px
            if (deltaY > 100 && deltaY > deltaX) {
                UIController.closeSettings();
            }
        }, { passive: true });

        // Pull to refresh on main content
        let pullStartY = 0;
        const mainContent = document.querySelector('.main-content');

        mainContent.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                pullStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        mainContent.addEventListener('touchend', (e) => {
            if (pullStartY > 0) {
                const pullEndY = e.changedTouches[0].clientY;
                const pullDistance = pullEndY - pullStartY;

                if (pullDistance > 120 && window.scrollY === 0) {
                    HukamnamaController.refresh();
                }
                pullStartY = 0;
            }
        }, { passive: true });
    }
};

/* ==========================================
   OFFLINE SUPPORT & CACHING
   ========================================== */

const CacheController = {
    CACHE_DURATION: 60 * 60 * 1000, // 1 hour in milliseconds

    // Get cached Hukamnama
    getCached(dateKey) {
        try {
            const cacheStr = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE);
            if (!cacheStr) return null;

            const cache = JSON.parse(cacheStr);
            const entry = cache[dateKey];

            if (!entry) return null;

            // Check if cache is still valid
            const now = Date.now();
            if (now - entry.timestamp > this.CACHE_DURATION) {
                // Cache expired
                this.removeCached(dateKey);
                return null;
            }

            return entry.data;
        } catch (e) {
            console.warn('Cache read error:', e);
            return null;
        }
    },

    // Set cached Hukamnama
    setCached(dateKey, data) {
        try {
            let cache = {};
            const cacheStr = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE);

            if (cacheStr) {
                cache = JSON.parse(cacheStr);
            }

            // Limit cache size (keep last 7 days)
            const keys = Object.keys(cache);
            if (keys.length >= 7) {
                // Remove oldest entry
                const oldest = keys.sort()[0];
                delete cache[oldest];
            }

            cache[dateKey] = {
                data: data,
                timestamp: Date.now()
            };

            localStorage.setItem(CONFIG.STORAGE_KEYS.CACHE, JSON.stringify(cache));
        } catch (e) {
            console.warn('Cache write error:', e);
        }
    },

    // Remove cached entry
    removeCached(dateKey) {
        try {
            const cacheStr = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE);
            if (!cacheStr) return;

            const cache = JSON.parse(cacheStr);
            delete cache[dateKey];
            localStorage.setItem(CONFIG.STORAGE_KEYS.CACHE, JSON.stringify(cache));
        } catch (e) {
            console.warn('Cache remove error:', e);
        }
    },

    // Clear all cache
    clearAll() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHE);
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
    }
};

/* ==========================================
   ACCESSIBILITY CONTROLLER
   ========================================== */

const AccessibilityController = {
    init() {
        this.setupAriaLabels();
        this.setupFocusManagement();
        this.setupReducedMotion();
    },

    // Setup ARIA labels dynamically
    setupAriaLabels() {
        // Update date displays with accessible labels
        const updateAriaLabels = () => {
            const englishDate = DOM.get('englishDate');
            const nanakshahiDate = DOM.get('nanakshahiDate');

            if (englishDate) {
                englishDate.setAttribute('aria-label', `English date: ${englishDate.querySelector('.date-value')?.textContent || ''}`);
            }

            if (nanakshahiDate) {
                nanakshahiDate.setAttribute('aria-label', `Nanakshahi date: ${nanakshahiDate.querySelector('.date-value')?.textContent || ''}`);
            }
        };

        // Run initially and observe changes
        updateAriaLabels();

        // Create observer for date updates
        const observer = new MutationObserver(updateAriaLabels);
        const englishDate = DOM.get('englishDate');

        if (englishDate) {
            observer.observe(englishDate, { childList: true, subtree: true, characterData: true });
        }
    },

    // Setup focus management for modal
    setupFocusManagement() {
        const settingsOverlay = DOM.get('settingsOverlay');
        const settingsSheet = DOM.get('settingsSheet');

        if (!settingsOverlay || !settingsSheet) return;

        // Trap focus in settings modal
        settingsSheet.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            const focusableElements = settingsSheet.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    },

    // Respect reduced motion preference
    setupReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        const updateMotionPreference = () => {
            if (prefersReducedMotion.matches) {
                document.documentElement.style.setProperty('--duration-fast', '0ms');
                document.documentElement.style.setProperty('--duration-normal', '0ms');
                document.documentElement.style.setProperty('--duration-slow', '0ms');
                document.documentElement.style.setProperty('--duration-slower', '0ms');
            } else {
                document.documentElement.style.removeProperty('--duration-fast');
                document.documentElement.style.removeProperty('--duration-normal');
                document.documentElement.style.removeProperty('--duration-slow');
                document.documentElement.style.removeProperty('--duration-slower');
            }
        };

        updateMotionPreference();
        prefersReducedMotion.addEventListener('change', updateMotionPreference);
    },

    // Announce message to screen readers
    announce(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
};

/* ==========================================
   THEME CONTROLLER (System Preference)
   ========================================== */

const ThemeController = {
    init() {
        this.setupSystemThemeListener();
        this.applyInitialTheme();
    },

    // Listen for system theme changes
    setupSystemThemeListener() {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        darkModeMediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set a preference
            const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            if (!savedSettings) {
                SettingsController.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    // Apply initial theme
    applyInitialTheme() {
        const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);

        if (!savedSettings) {
            // No saved preference, use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            State.settings.theme = prefersDark ? 'dark' : 'light';
        }

        UIController.applySettings();
    }
};

/* ==========================================
   PERFORMANCE MONITOR
   ========================================== */

const PerformanceMonitor = {
    marks: {},

    start(label) {
        this.marks[label] = performance.now();
    },

    end(label) {
        if (this.marks[label]) {
            const duration = performance.now() - this.marks[label];
            console.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
            delete this.marks[label];
            return duration;
        }
        return 0;
    },

    // Log Web Vitals
    logVitals() {
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.debug('📊 LCP:', lastEntry.startTime.toFixed(2) + 'ms');
            });

            try {
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {
                // Not supported
            }

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.debug('📊 FID:', entry.processingStart - entry.startTime + 'ms');
                });
            });

            try {
                fidObserver.observe({ type: 'first-input', buffered: true });
            } catch (e) {
                // Not supported
            }
        }
    }
};

/* ==========================================
   SERVICE WORKER REGISTRATION
   ========================================== */

const ServiceWorkerController = {
    async register() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ ServiceWorker registered:', registration.scope);

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            UIController.showToast('New version available! Refresh to update.', 'info', 5000);
                        }
                    });
                });
            } catch (error) {
                console.warn('ServiceWorker registration failed:', error);
            }
        }
    }
};

/* ==========================================
   IMAGE LAZY LOADING & ERROR HANDLING
   ========================================== */

const ImageController = {
    init() {
        this.setupHeroImage();
        this.setupLazyLoading();
    },

    // Setup hero image with fallback
    setupHeroImage() {
        const heroImage = DOM.get('heroImage');
        if (!heroImage) return;

        // Fallback images in case primary fails
        const fallbackImages = [
            '/assets/darbar-sahib-evening.jpg',
            'https://images.unsplash.com/photo-1609947017136-9daf32a15f94?w=1200&q=80'
        ];

        let fallbackIndex = 0;

        heroImage.addEventListener('error', () => {
            if (fallbackIndex < fallbackImages.length) {
                heroImage.src = fallbackImages[fallbackIndex];
                fallbackIndex++;
            } else {
                // All fallbacks failed, use gradient background
                heroImage.style.display = 'none';
                heroImage.parentElement.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)';
            }
        });

        // Optimize loading
        heroImage.loading = 'eager';
        heroImage.decoding = 'async';
    },

    // Setup lazy loading for any additional images
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[data-src]');

            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }
};

/* ==========================================
   NETWORK STATUS HANDLER
   ========================================== */

const NetworkController = {
    isOnline: navigator.onLine,

    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            UIController.showToast('You are back online!', 'success');

            // Refresh if we have no data
            if (!State.currentHukamnama) {
                HukamnamaController.loadHukamnama();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            UIController.showToast('You are offline. Some features may be limited.', 'warning');
        });
    },

    // Check connection before fetch
    checkConnection() {
        return this.isOnline;
    }
};

/* ==========================================
   ANALYTICS (Privacy-Friendly)
   ========================================== */

const AnalyticsController = {
    // Track page view (no personal data)
    trackPageView() {
        // Placeholder for privacy-friendly analytics
        console.debug('📊 Page view tracked');
    },

    // Track events
    trackEvent(category, action, label = null) {
        console.debug(`📊 Event: ${category} - ${action}${label ? ` - ${label}` : ''}`);
    }
};

/* ==========================================
   APP INITIALIZATION
   ========================================== */

const App = {
    async init() {
        console.log('🙏 Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh!');
        console.log('📿 Initializing Daily Hukamnama Module...');

        PerformanceMonitor.start('App Init');

        try {
            // Initialize DOM cache
            DOM.init();

            // Initialize state from localStorage
            State.init();

            // Initialize controllers
            ThemeController.init();
            AccessibilityController.init();
            ImageController.init();
            NetworkController.init();

            // Bind event handlers
            EventHandlers.init();

            // Apply saved settings
            UIController.applySettings();

            // Generate quick date chips
            UIController.generateQuickDates();

            UIController.renderHistory();

            // Load today's Hukamnama
            await HukamnamaController.loadHukamnama();

            // Register service worker for PWA
            ServiceWorkerController.register();

            // Log performance
            PerformanceMonitor.end('App Init');
            PerformanceMonitor.logVitals();

            // Track page view
            AnalyticsController.trackPageView();

            console.log('✅ Daily Hukamnama Module initialized successfully!');

        } catch (error) {
            console.error('❌ App initialization error:', error);
            UIController.showError('Failed to initialize the app. Please refresh the page.');
        }
    }
};

const ShareImageController = {
    async shareAsImage() {
        if (!State.currentHukamnama) {
            UIController.showToast('No Hukamnama loaded to share', 'warning');
            return;
        }

        try {
            const blob = await this.renderImageBlob();
            const dateKey = State.formatDateKey(State.selectedDate);
            const file = new File([blob], `hukamnama-${dateKey}.png`, { type: 'image/png' });

            const shareData = { files: [file], title: 'Daily Hukamnama', text: 'Daily Hukamnama' };
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                UIController.showToast('Shared as image!', 'success');
                return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hukamnama-${dateKey}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            UIController.showToast('Image downloaded', 'success');
        } catch (e) {
            console.error('Share as image failed:', e);
            UIController.showToast('Unable to share as image', 'error');
        }
    },

    renderImageBlob() {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const width = 1080;
            const height = 1350;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported'));

            const img = new Image();
            img.onload = () => {
                ctx.fillStyle = '#0D0D1A';
                ctx.fillRect(0, 0, width, height);

                const imgH = Math.floor(height * 0.42);
                ctx.save();
                ctx.globalAlpha = 0.95;
                ctx.drawImage(img, 0, 0, width, imgH);
                ctx.restore();

                const grd = ctx.createLinearGradient(0, 0, 0, imgH);
                grd.addColorStop(0, 'rgba(0,0,0,0.10)');
                grd.addColorStop(1, 'rgba(13,13,26,0.95)');
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, width, imgH);

                const { metadata, verses } = State.currentHukamnama;
                const dateStr = Utils.formatEnglishDate(State.selectedDate);
                const title = metadata.title || verses?.[0]?.gurmukhi || 'Daily Hukamnama';

                ctx.fillStyle = 'rgba(255,179,71,0.95)';
                ctx.font = '700 44px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
                ctx.fillText('Daily Hukamnama', 72, imgH + 92);

                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.font = '500 28px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
                ctx.fillText(dateStr, 72, imgH + 140);

                ctx.fillStyle = '#FFFFFF';
                ctx.font = `600 38px "Noto Sans Gurmukhi", "Mukta Mahee", sans-serif`;
                const wrapped = this.wrapText(ctx, title, width - 144);
                wrapped.slice(0, 3).forEach((line, idx) => {
                    ctx.fillText(line, 72, imgH + 210 + idx * 54);
                });

                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '500 28px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
                const metaLine = `${metadata.raag || ''}${metadata.ang ? ` • Ang ${metadata.ang}` : ''}${metadata.writer ? ` • ${metadata.writer}` : ''}`;
                ctx.fillText(metaLine, 72, imgH + 400);

                ctx.fillStyle = 'rgba(255,255,255,0.92)';
                ctx.font = `500 34px "Noto Sans Gurmukhi", "Mukta Mahee", sans-serif`;
                const bodyLines = [];
                (verses || []).slice(0, 10).forEach(v => {
                    if (v?.gurmukhi) bodyLines.push(v.gurmukhi);
                });
                const bodyWrapped = bodyLines.flatMap(t => this.wrapText(ctx, t, width - 144));
                bodyWrapped.slice(0, 12).forEach((line, idx) => {
                    ctx.fillText(line, 72, imgH + 480 + idx * 48);
                });

                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error('Failed to encode image'));
                    resolve(blob);
                }, 'image/png');
            };
            img.onerror = () => reject(new Error('Failed to load background image'));
            img.src = DOM.get('heroImage')?.currentSrc || DOM.get('heroImage')?.src || '/assets/darbar-sahib-evening.jpg';
        });
    },

    wrapText(ctx, text, maxWidth) {
        const words = (text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let line = '';
        words.forEach(word => {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        });
        if (line) lines.push(line);
        return lines;
    }
};

/* ==========================================
   DOM CONTENT LOADED - START APP
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/* ==========================================
   HANDLE PAGE VISIBILITY CHANGE
   ========================================== */

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Check if date has changed while page was hidden
        const now = new Date();
        const today = State.formatDateKey(now);
        const current = State.formatDateKey(State.selectedDate);

        // If viewing today and it's a new day, refresh
        if (HukamnamaController.isToday(State.selectedDate) && today !== current) {
            console.log('📅 New day detected, refreshing Hukamnama...');
            HukamnamaController.loadHukamnama();
        }
    }
});

/* ==========================================
   HANDLE BEFOREUNLOAD - SAVE STATE
   ========================================== */

window.addEventListener('beforeunload', () => {
    State.saveSettings();
});

/* ==========================================
   CSS ANIMATION KEYFRAMES (Injected)
   ========================================== */

const injectAnimationStyles = () => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes content-fade-in {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .hidden {
            display: none !important;
        }
        
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
    `;
    document.head.appendChild(styleSheet);
};

// Inject styles immediately
injectAnimationStyles();

/* ==========================================
   EXPORT FOR MODULE USAGE (Optional)
   ========================================== */

// If using ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        App,
        State,
        HukamnamaController,
        UIController,
        SettingsController,
        BaniDBService,
        Utils
    };
}

// Expose to window for debugging
window.GurbaniHukamnama = {
    App,
    State,
    HukamnamaController,
    UIController,
    SettingsController,
    refresh: () => HukamnamaController.refresh(),
    loadDate: (date) => HukamnamaController.loadHukamnama(date)
};

console.log('🎯 Daily Hukamnama module loaded. Access via window.GurbaniHukamnama');