/**
 * SHABAD READER - Premium iOS Pothi Style
 * Exact replica of the screenshot layout & styles
 */

const API_BASE = 'https://api.banidb.com/v2';
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Gurmukhi to Devanagari Transliteration Mapper
function transliterateGurmukhiToDevanagari(text) {
    if (!text) return '';
    const mapping = {
        'ਕ': 'क', 'ਖ': 'ख', 'ਗ': 'ग', 'ਘ': 'घ', 'ਙ': 'ङ',
        'ਚ': 'च', 'ਛ': 'छ', 'ਜ': 'ज', 'ਝ': 'झ', 'ਞ': 'ञ',
        'ਟ': 'ट', 'ਠ': 'ठ', 'ਡ': 'ड', 'ਢ': 'ढ', 'ਣ': 'ण',
        'ਤ': 'त', 'ਥ': 'थ', 'ਦ': 'द', 'ਧ': 'ध', 'ਨ': 'न',
        'ਪ': 'प', 'ਫ': 'फ', 'ਬ': 'ब', 'ਭ': 'भ', 'ਮ': 'म',
        'ਯ': 'य', 'ਰ': 'र', 'ਲ': 'ल', 'ਵ': 'व', 'ੜ': 'ड़',
        'ਸ਼': 'श', 'ਖ਼': 'ख़', 'ਗ਼': 'ग़', 'ਜ਼': 'ज़', 'ਫ਼': 'फ़', 'ਲ਼': 'ळ',
        'ਸ': 'स', 'ਹ': 'ह',
        'ੳ': 'उ', 'ਅ': 'अ', 'ੲ': 'इ',
        'ਆ': 'आ', 'ਇ': 'इ', 'ਈ': 'ई', 'ਉ': 'उ', 'ਊ': 'ऊ',
        'ਏ': 'ए', 'ਐ': 'ऐ', 'ਓ': 'ओ', 'ਔ': 'औ',
        'ਾ': 'ा', 'ਿ': 'ि', 'ੀ': 'ी', 'ੁ': 'ु', 'ੂ': 'ू',
        'ੇ': 'े', 'ੈ': 'ै', 'ੋ': 'ो', 'ੌ': 'ौ',
        'ੰ': 'ं', 'ਂ': 'ं', '੍ਹ': '्ह', '੍': '्', 'ੑ': '्', 'ੵ': '्य',
        '੦': '०', '੧': '१', '੨': '२', '੩': '३', '੪': '४',
        '੫': '५', '੬': '६', '੭': '७', '੮': '८', '੯': '९',
        '।': '।', '॥': '॥'
    };
    let result = '';
    let i = 0;
    while (i < text.length) {
        const char = text[i];
        if (char === 'ੱ') {
            let nextIdx = i + 1;
            while (nextIdx < text.length && (text[nextIdx] === ' ' || 'ਾਿੀੁੂੇੈੋੌ'.includes(text[nextIdx]))) {
                nextIdx++;
            }
            if (nextIdx < text.length) {
                const nextChar = text[nextIdx];
                const mappedNext = mapping[nextChar] || nextChar;
                result += mappedNext + '्';
            }
            i++;
            continue;
        }
        if (mapping[char]) {
            result += mapping[char];
        } else {
            result += char;
        }
        i++;
    }
    return result;
}

const DOM = {
    navBack: $('#navBack'),
    navTitle: $('#navTitle'),
    navSubtitle: $('#navSubtitle'),
    navMeta: $('#navMeta'),
    bookmarkBtn: $('#bookmarkBtn'),
    settingsBtn: $('#settingsBtn'),
    favBtn: $('#favBtn'),

    loadingState: $('#loadingState'),
    shabadLines: $('#shabadLines'),

    prevShabadBtn: $('#prevShabadBtn'),
    nextShabadBtn: $('#nextShabadBtn'),

    settingsOverlay: $('#settingsOverlay'),
    settingsDone: $('#settingsDone'),

    // DISPLAY Settings
    fontSizeSlider: $('#fontSizeSlider'),
    fontRowBtn: $('#fontRowBtn'),
    activeFontVal: $('#activeFontVal'),
    lineSpacingSegmented: $('#lineSpacingSegmented'),
    alignSegmented: $('#alignSegmented'),

    // READING Settings
    autoScrollRow: $('#autoScrollRow'),
    autoScrollVal: $('#autoScrollVal'),
    scrollSpeedRow: $('#scrollSpeedRow'),
    scrollSpeedSettingsVal: $('#scrollSpeedSettingsVal'),
    pauseNextShabadSwitch: $('#pauseNextShabadSwitch'),
    translitSwitch: $('#translitSwitch'),
    hindiGurbaniSwitch: $('#hindiGurbaniSwitch'),
    translationSwitch: $('#translationSwitch'),
    punjabiTranslationSwitch: $('#punjabiTranslationSwitch'),
    hindiTranslationSwitch: $('#hindiTranslationSwitch'),

    // AUDIO Settings
    autoPlaySwitch: $('#autoPlaySwitch'),
    repeatRow: $('#repeatRow'),
    repeatVal: $('#repeatVal'),
    bgAudioRow: $('#bgAudioRow'),
    bgAudioVal: $('#bgAudioVal'),

    // IMMERSIVE Focus Settings
    focusModeToggle: $('#focusModeToggle'),

    // Autoscroll components
    autoscrollPill: $('#autoscrollPill'),
    scrollPlayBtn: $('#scrollPlayBtn'),
    scrollSpeedSlider: $('#scrollSpeedSlider'),
    scrollSpeedVal: $('#scrollSpeedVal'),

    // Word Vichar Sheet components
    wordSheetOverlay: $('#wordSheetOverlay'),
    wordDisplay: $('#wordDisplay'),
    wordSearchBtn: $('#wordSearchBtn'),
    wordCopyBtn: $('#wordCopyBtn'),

    toast: $('#toast'),
    toastText: $('#toastText')
};

const State = {
    shabadId: null,
    highlightVerseId: null,
    verses: [],
    shabadInfo: null,
    readerTheme: 'paper', // white, paper, charcoal, midnight
    displayMode: 'padchhed',
    showTranslitEn: false,
    showTranslitHi: false,
    showTransEn: true,
    showTransPu: false,
    showTransHi: false,
    focusMode: false,
    autoscrollVisible: true,
    autoscrollActive: false,
    autoscrollSpeed: 1.0,
    fontSizeBase: 23,
    lineSpacing: 1.35,
    fontGurmukhi: 'pothi', // pothi, court, modern, royal
    textAlign: 'center', // left, center, right

    // Cycles
    scrollSpeedText: 'Normal', // Slow, Normal, Fast
    repeatMode: 'One Shabad', // One Shabad, All, None
    bgAudioMode: 'Continue', // Continue, Pause
    pauseNextShabad: true,
    autoPlay: true,
    isFavorite: false
};

// Font display names mapping
const FONT_NAMES = {
    'pothi': 'Sacred Pothi',
    'court': 'Court Script',
    'modern': 'Modern Serif',
    'royal': 'Royal Text',
    'noto': 'Noto Sans Gurmukhi',
    'mukta': 'Mukta Mahee',
    'raavi': 'Raavi',
    'gurbani': 'AnmolLipi'
};

// ═══════════════════════════════════════════════════════════════════════════════
// URL PARAMS & HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        shabadId: params.get('shabad'),
        verseId: params.get('verse')
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME PRESENTS OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════════

const ReaderTheme = {
    init() {
        const globalTheme = localStorage.getItem('anhad_theme') || 'auto';
        let saved = localStorage.getItem('gurbani_reader_theme');
        
        if (globalTheme === 'auto') {
            const hour = new Date().getHours();
            const effectiveTheme = (hour >= 5 && hour < 20) ? 'light' : 'dark';
            saved = (effectiveTheme === 'dark') ? 'charcoal' : 'paper';
        } else {
            // Always sync reader theme with global theme on page load
            saved = (globalTheme === 'dark') ? 'charcoal' : 'paper';
        }
        this.set(saved, false);
    },

    set(theme, saveGlobal = false) {
        State.readerTheme = theme;
        document.documentElement.setAttribute('data-reader-theme', theme);
        localStorage.setItem('gurbani_reader_theme', theme);

        // Sync dark mode class
        const isDark = (theme === 'charcoal' || theme === 'midnight');
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        if (isDark) {
            document.documentElement.classList.add('dark', 'dark-mode');
        } else {
            document.documentElement.classList.remove('dark', 'dark-mode');
        }

        if (saveGlobal) {
            localStorage.setItem('anhad_theme', isDark ? 'dark' : 'light');
            // Dispatch dynamic theme change events
            const eventDetail = { bubbles: true, detail: { theme: isDark ? 'dark' : 'light' } };
            document.dispatchEvent(new CustomEvent('themechange', eventDetail));
            document.dispatchEvent(new CustomEvent('anhadThemeChanged', eventDetail));
        }

        // Update settings swatches active class
        $$('.theme-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.readerTheme === theme);
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITES / POTHI BOOKMARK
// ═══════════════════════════════════════════════════════════════════════════════

const Favorites = {
    load() {
        const saved = localStorage.getItem('gurbani_favorite_shabads');
        return saved ? JSON.parse(saved) : [];
    },

    save(favorites) {
        localStorage.setItem('gurbani_favorite_shabads', JSON.stringify(favorites));
    },

    isFavorite(shabadId) {
        const favorites = this.load();
        return favorites.some(f => String(f.shabadId) === String(shabadId) || String(f.id) === String(shabadId));
    },

    add(shabad) {
        const favorites = this.load();
        if (!favorites.some(f => String(f.shabadId) === String(shabad.shabadId) || String(f.id) === String(shabad.shabadId))) {
            favorites.unshift({
                id: shabad.shabadId,
                shabadId: shabad.shabadId,
                gurmukhi: shabad.gurmukhi || '',
                translation: shabad.translation || '',
                english: shabad.translation || '',
                ang: shabad.ang || '',
                source: 'Pothi Reader',
                savedAt: Date.now()
            });
            this.save(favorites);
        }
    },

    remove(shabadId) {
        let favorites = this.load();
        favorites = favorites.filter(f => String(f.shabadId) !== String(shabadId) && String(f.id) !== String(shabadId));
        this.save(favorites);
    },

    toggle(shabadId, shabadInfo) {
        if (this.isFavorite(shabadId)) {
            this.remove(shabadId);
            return false;
        } else {
            this.add(shabadInfo);
            return true;
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTICS & TOAST
// ═══════════════════════════════════════════════════════════════════════════════

function haptic(style = 'light') {
    if (navigator.vibrate) {
        navigator.vibrate(style === 'light' ? 8 : 18);
    }
}

function showToast(message) {
    DOM.toastText.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 2200);
}

// ═══════════════════════════════════════════════════════════════════════════════
// API LOADER
// ═══════════════════════════════════════════════════════════════════════════════

async function loadShabad(shabadId) {
    try {
        const response = await fetch(`${API_BASE}/shabads/${shabadId}`);
        if (!response.ok) throw new Error('Failed to load');
        return response.json();
    } catch (error) {
        console.error('Load error:', error);
        showToast('Could not load Shabad');
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIGHLIGHT AND RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function highlightSearchTerm(text, query) {
    if (!query || !text) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || params.get('query') || '';
}

function renderShabad(data) {
    if (!data || !data.verses || data.verses.length === 0) {
        showToast('Shabad not found');
        return;
    }

    State.verses = data.verses;
    const firstVerse = data.verses[0];

    // Find the highlighted verse if any, else default to first
    let targetVerse = firstVerse;
    if (State.highlightVerseId) {
        const found = data.verses.find(v => String(v.verseId) === String(State.highlightVerseId));
        if (found) targetVerse = found;
    }

    State.shabadInfo = {
        shabadId: State.shabadId,
        ang: targetVerse.pageNo || firstVerse.pageNo,
        raag: targetVerse.raag?.english || firstVerse.raag?.english || '',
        gurmukhi: targetVerse.verse?.unicode || '',
        translation: targetVerse.translation?.en?.bdb || targetVerse.translation?.en?.ms || targetVerse.translation?.en?.ssk || ''
    };

    // Header metadata update
    let sourceName = 'Sri Guru Granth Sahib Ji';
    let writerName = firstVerse.writer?.gurmukhi || firstVerse.writer?.english || '';
    
    // Extract Guru name from writer string
    let guruName = '';
    if (firstVerse.writer) {
        const mahala = firstVerse.writer.mahala;
        if (mahala) {
            const mahalaNum = mahala.replace(/\D/g, ''); // Extract number
            const guruNames = {
                '1': 'Guru Nanak Dev Ji',
                '2': 'Guru Angad Dev Ji',
                '3': 'Guru Amar Das Ji',
                '4': 'Guru Ram Das Ji',
                '5': 'Guru Arjan Dev Ji',
                '6': 'Guru Hargobind Sahib Ji',
                '7': 'Guru Har Rai Sahib Ji',
                '8': 'Guru Har Krishan Sahib Ji',
                '9': 'Guru Tegh Bahadur Ji'
            };
            guruName = guruNames[mahalaNum] || '';
        }
    }
    
    // Build title: raag + mahala
    let raagName = firstVerse.raag?.gurmukhi || firstVerse.raag?.english || '';
    let mahala = firstVerse.writer?.mahala || '';
    DOM.navTitle.textContent = raagName ? `${raagName} ${mahala}`.trim() : 'ਗੁਰਬਾਣੀ';
    
    // Subtitle: Guru name if available, else source
    DOM.navSubtitle.textContent = guruName || sourceName;
    
    // Meta: writer + ang
    let metaParts = [];
    if (!guruName && writerName) metaParts.push(writerName); // Only show writer if no Guru name
    if (firstVerse.pageNo) metaParts.push(`Ang ${firstVerse.pageNo}`);
    DOM.navMeta.textContent = metaParts.join(' • ');

    State.isFavorite = Favorites.isFavorite(State.shabadId);
    updateFavButton();
    
    const searchQuery = getSearchQuery();

    // Render HTML
    DOM.shabadLines.innerHTML = data.verses.map((verse, index) => {
        const isHighlighted = String(verse.verseId) === String(State.highlightVerseId);

        // Gurmukhi source text
        const gurmukhiRaw = State.displayMode === 'larivaar'
            ? (verse.larivaar?.unicode || verse.verse?.unicode || '')
            : (verse.verse?.unicode || '');

        // Wrap words individually
        const words = gurmukhiRaw.trim().split(/\s+/);
        const gurmukhiSpans = words.map(word => {
            const cleanWord = word.replace(/[।॥]/g, '').trim();
            let displayWord = word;
            if (searchQuery) {
                displayWord = highlightSearchTerm(word, searchQuery);
            }
            return `<span class="g-word" data-word="${cleanWord}">${displayWord}</span>`;
        }).join(' ');

        // Transliteration
        let translitHtml = '';
        if (State.showTranslitEn) {
            const translitRaw = verse.transliteration?.english || '';
            const translit = searchQuery ? highlightSearchTerm(translitRaw, searchQuery) : translitRaw;
            if (translit) {
                translitHtml += `<p class="transliteration">${translit}</p>`;
            }
        }
        
        // Hindi Gurbani (Devnagari script)
        let hindiGurbaniHtml = '';
        if (State.showTranslitHi) {
            let hindiRaw = verse.transliteration?.hindi || verse.transliteration?.hi || '';
            if (!hindiRaw) {
                hindiRaw = transliterateGurmukhiToDevanagari(verse.verse?.unicode || '');
            }
            const highlighted = searchQuery ? highlightSearchTerm(hindiRaw, searchQuery) : hindiRaw;
            if (highlighted) {
                hindiGurbaniHtml += `<p class="hindi-gurbani">${highlighted}</p>`;
            }
        }

        // Translations HTML Builder
        let translationsHtml = '';
        if (State.showTransPu) {
            const puTransRaw = verse.translation?.pu?.ss?.unicode || verse.translation?.pu?.bdb?.unicode || verse.translation?.pu?.ms?.unicode || '';
            const puTrans = searchQuery ? highlightSearchTerm(puTransRaw, searchQuery) : puTransRaw;
            if (puTrans) {
                translationsHtml += `<p class="translation punjabi">${puTrans}</p>`;
            }
        }
        
        if (State.showTransHi) {
            const hiTransRaw = verse.translation?.hi?.ss || verse.translation?.hi?.sts || '';
            const hiTrans = searchQuery ? highlightSearchTerm(hiTransRaw, searchQuery) : hiTransRaw;
            if (hiTrans) {
                translationsHtml += `<p class="translation hindi">${hiTrans}</p>`;
            }
        }

        if (State.showTransEn) {
            const enTransRaw = verse.translation?.en?.bdb || verse.translation?.en?.ms || verse.translation?.en?.ssk || '';
            const enTrans = searchQuery ? highlightSearchTerm(enTransRaw, searchQuery) : enTransRaw;
            if (enTrans) {
                translationsHtml += `<p class="translation english">${enTrans}</p>`;
            }
        }

        // Dividers between main verse segments (e.g. after Rahao or verse pairs)
        const isRahao = verse.verse?.unicode?.includes('ਰਹਾਉ');
        const showDivider = (index < data.verses.length - 1) && (isRahao || (index % 2 === 1));

        return `
            <div class="shabad-line ${isHighlighted ? 'highlighted' : ''}" data-verse="${verse.verseId}">
                <span class="verse-number">${index + 1}</span>
                <p class="gurmukhi">${gurmukhiSpans}</p>
                ${hindiGurbaniHtml}
                ${translitHtml}
                ${translationsHtml}
            </div>
            ${showDivider ? `<div class="verse-divider"></div>` : ''}
        `;
    }).join('');

    DOM.loadingState.classList.remove('active');

    // Scroll active verse
    if (State.highlightVerseId) {
        setTimeout(() => {
            selectActiveLine(State.highlightVerseId, true);
        }, 300);
    }
}

function selectActiveLine(verseId, smoothScroll = true) {
    State.highlightVerseId = verseId;
    
    $$('.shabad-line').forEach(line => {
        const isCurrent = String(line.dataset.verse) === String(verseId);
        line.classList.toggle('highlighted', isCurrent);
    });

    if (smoothScroll) {
        const activeLine = $(`.shabad-line[data-verse="${verseId}"]`);
        if (activeLine) {
            activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMOOTH AUTOSCROLL ENGINE (requestAnimationFrame)
// ═══════════════════════════════════════════════════════════════════════════════

let autoscrollId = null;
let lastTickTime = 0;

const Autoscroll = {
    init() {
        const enabled = localStorage.getItem('reader_autoscroll_enabled') === 'true'; // default false
        const speed = parseFloat(localStorage.getItem('reader_autoscroll_speed')) || 1.0;
        
        State.autoscrollVisible = enabled;
        State.autoscrollSpeed = speed;
        
        DOM.scrollSpeedSlider.value = speed;
        DOM.scrollSpeedVal.textContent = `${speed.toFixed(1)}x`;
        DOM.autoScrollVal.textContent = enabled ? 'On >' : 'Off >';
        DOM.autoscrollPill.style.display = enabled ? 'flex' : 'none';

        // Speed slider
        DOM.scrollSpeedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            State.autoscrollSpeed = val;
            DOM.scrollSpeedVal.textContent = `${val.toFixed(1)}x`;
            localStorage.setItem('reader_autoscroll_speed', val);
        });

        // Autoscroll start/pause toggle
        DOM.scrollPlayBtn.addEventListener('click', () => {
            haptic();
            if (State.autoscrollActive) {
                this.stop();
            } else {
                this.start();
            }
        });

        window.addEventListener('wheel', () => this.stop(), { passive: true });
        window.addEventListener('touchmove', () => this.stop(), { passive: true });
    },

    start() {
        if (State.autoscrollActive) return;
        State.autoscrollActive = true;
        
        DOM.scrollPlayBtn.classList.add('playing');
        DOM.scrollPlayBtn.querySelector('.play-svg').style.display = 'none';
        DOM.scrollPlayBtn.querySelector('.pause-svg').style.display = 'block';
        
        // Add thin mode to player card
        DOM.autoscrollPill.classList.add('thin-mode');
        
        lastTickTime = performance.now();
        this.tick();
    },

    stop() {
        if (!State.autoscrollActive) return;
        State.autoscrollActive = false;
        
        DOM.scrollPlayBtn.classList.remove('playing');
        DOM.scrollPlayBtn.querySelector('.play-svg').style.display = 'block';
        DOM.scrollPlayBtn.querySelector('.pause-svg').style.display = 'none';
        
        // Remove thin mode from player card
        DOM.autoscrollPill.classList.remove('thin-mode');
        
        if (autoscrollId) {
            cancelAnimationFrame(autoscrollId);
            autoscrollId = null;
        }
    },

    tick() {
        if (!State.autoscrollActive) return;

        const now = performance.now();
        const delta = (now - lastTickTime) / 1000;
        lastTickTime = now;

        // Custom pixel rate mapping speed
        const scrollAmount = State.autoscrollSpeed * 22 * delta;
        window.scrollBy(0, scrollAmount);

        // Auto-stop at bottom
        const scrolledToBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 5);
        if (scrolledToBottom) {
            this.stop();
            showToast('End of Shabad reached');
        } else {
            autoscrollId = requestAnimationFrame(() => this.tick());
        }
    },

    toggleVisibility(show) {
        State.autoscrollVisible = show;
        localStorage.setItem('reader_autoscroll_enabled', show);
        DOM.autoScrollVal.textContent = show ? 'On >' : 'Off >';
        DOM.autoscrollPill.style.display = show ? 'flex' : 'none';
        if (!show) this.stop();
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORD CONTEMPLATION SHEET (VICHAR)
// ═══════════════════════════════════════════════════════════════════════════════

const WordVichar = {
    init() {
        DOM.wordCopyBtn.addEventListener('click', () => {
            const word = DOM.wordDisplay.textContent;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(word);
                showToast('Copied to clipboard');
            }
            haptic();
            this.close();
        });

        DOM.wordSearchBtn.addEventListener('click', () => {
            const word = DOM.wordDisplay.textContent;
            haptic('medium');
            this.close();
            window.location.href = `gurbani-khoj.html?q=${encodeURIComponent(word)}`;
        });

        DOM.wordSheetOverlay.querySelector('.word-sheet-backdrop').addEventListener('click', () => {
            this.close();
        });
    },

    open(word) {
        haptic();
        DOM.wordDisplay.textContent = word;
        DOM.wordSheetOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        DOM.wordSheetOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS CONTROLLER (Segmented, Switches, Cycles)
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
        State.fontGurmukhi = font;
        document.documentElement.setAttribute('data-font', font);
        localStorage.setItem('gurbaniFont', font);

        const fontKeyMap = {
            'pothi': 'noto-sans',
            'noto': 'noto-sans',
            'court': 'mukta-mahee',
            'mukta': 'mukta-mahee',
            'modern': 'baloo-paaji',
            'royal': 'noto-serif',
            'raavi': 'raavi',
            'gurbani': 'anmol-lipi'
        };
        const fontMap = {
            'noto-sans': "'Noto Sans Gurmukhi', sans-serif",
            'mukta-mahee': "'Mukta Mahee', 'Noto Sans Gurmukhi', sans-serif",
            'baloo-paaji': "'Baloo Paaji 2', 'Noto Sans Gurmukhi', sans-serif",
            'noto-serif': "'Noto Serif Gurmukhi', 'Noto Sans Gurmukhi', serif",
            'raavi': "'Raavi', 'Noto Sans Gurmukhi', sans-serif",
            'anmol-lipi': "'AnmolLipi', 'Noto Sans Gurmukhi', sans-serif"
        };
        const targetKey = fontKeyMap[font] || 'noto-sans';
        localStorage.setItem('gurbaniKhoj_font', targetKey);
        document.documentElement.style.setProperty('--font-gurmukhi', fontMap[targetKey]);

        const displayName = FONT_NAMES[font] || 'Sacred Pothi';
        if (DOM.activeFontVal) DOM.activeFontVal.textContent = `${displayName} >`;
        
        $$('#fontRowBtn .row-value').forEach(el => {
            el.textContent = `${displayName} >`;
        });
    },

    setFontSize(size) {
        State.fontSizeBase = size;
        document.documentElement.style.setProperty('--font-size-base', `${size}px`);
        localStorage.setItem('shabadFontSize', size);
    },

    setLineSpacing(spacing) {
        State.lineSpacing = spacing;
        document.documentElement.style.setProperty('--line-spacing', spacing);
        
        // Update active segment button
        $$('#lineSpacingSegmented .segment-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.spacing) === spacing);
        });
        
        localStorage.setItem('reader_line_spacing', spacing);
        
        // Re-render to apply spacing immediately
        if (State.verses.length) {
            renderShabad({ verses: State.verses });
        }
    },

    setTextAlign(align) {
        State.textAlign = align;
        document.documentElement.style.setProperty('--text-align', align);
        
        // Update segment active button
        $$('#alignSegmented .segment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === align);
        });

        localStorage.setItem('reader_text_align', align);
    },

    toggleTranslitEn(show = null) {
        const nextState = show !== null ? show : !State.showTranslitEn;
        State.showTranslitEn = nextState;
        DOM.translitSwitch.classList.toggle('active', nextState);
        localStorage.setItem('shabadTranslitEn', nextState ? 'on' : 'off');
        if (State.verses.length) renderShabad({ verses: State.verses });
    },

    toggleTranslitHi(show = null) {
        const nextState = show !== null ? show : !State.showTranslitHi;
        State.showTranslitHi = nextState;
        DOM.hindiGurbaniSwitch.classList.toggle('active', nextState);
        localStorage.setItem('shabadTranslitHi', nextState ? 'on' : 'off');
        if (State.verses.length) renderShabad({ verses: State.verses });
    },

    toggleTransEn(show = null) {
        const nextState = show !== null ? show : !State.showTransEn;
        State.showTransEn = nextState;
        DOM.translationSwitch.classList.toggle('active', nextState);
        localStorage.setItem('shabadTransEn', nextState ? 'on' : 'off');
        if (State.verses.length) renderShabad({ verses: State.verses });
    },

    toggleTransPu(show = null) {
        const nextState = show !== null ? show : !State.showTransPu;
        State.showTransPu = nextState;
        DOM.punjabiTranslationSwitch.classList.toggle('active', nextState);
        localStorage.setItem('shabadTransPu', nextState ? 'on' : 'off');
        if (State.verses.length) renderShabad({ verses: State.verses });
    },

    toggleTransHi(show = null) {
        const nextState = show !== null ? show : !State.showTransHi;
        State.showTransHi = nextState;
        DOM.hindiTranslationSwitch.classList.toggle('active', nextState);
        localStorage.setItem('shabadTransHi', nextState ? 'on' : 'off');
        if (State.verses.length) renderShabad({ verses: State.verses });
    },

    toggleFocusMode(enabled = null) {
        const nextState = enabled !== null ? enabled : !State.focusMode;
        State.focusMode = nextState;
        DOM.focusModeToggle.classList.toggle('active', nextState);
        DOM.shabadLines.classList.toggle('focus-mode-active', nextState);
        localStorage.setItem('reader_focus_mode', nextState);
    },

    load() {
        this.setFontSize(parseInt(localStorage.getItem('shabadFontSize')) || 22);
        DOM.fontSizeSlider.value = State.fontSizeBase;

        this.setFont(localStorage.getItem('gurbaniFont') || 'pothi');

        this.setLineSpacing(parseFloat(localStorage.getItem('reader_line_spacing')) || 1.35);
        this.setTextAlign(localStorage.getItem('reader_text_align') || 'center');

        this.toggleTranslitEn(localStorage.getItem('shabadTranslitEn') === 'on');
        this.toggleTranslitHi(localStorage.getItem('shabadTranslitHi') === 'on');
        
        this.toggleTransEn(localStorage.getItem('shabadTransEn') !== 'off');
        this.toggleTransPu(localStorage.getItem('shabadTransPu') === 'on');
        this.toggleTransHi(localStorage.getItem('shabadTransHi') === 'on');

        this.toggleFocusMode(localStorage.getItem('reader_focus_mode') === 'true');

        // Cycles settings recovery
        State.scrollSpeedText = localStorage.getItem('reader_scroll_speed_text') || 'Normal';
        DOM.scrollSpeedSettingsVal.textContent = `${State.scrollSpeedText} >`;

        State.repeatMode = localStorage.getItem('reader_repeat_mode') || 'One Shabad';
        DOM.repeatVal.textContent = `${State.repeatMode} >`;

        State.bgAudioMode = localStorage.getItem('reader_bg_audio_mode') || 'Continue';
        DOM.bgAudioVal.textContent = `${State.bgAudioMode} >`;

        State.pauseNextShabad = localStorage.getItem('reader_pause_next_shabad') !== 'false';
        DOM.pauseNextShabadSwitch.classList.toggle('active', State.pauseNextShabad);

        State.autoPlay = localStorage.getItem('reader_autoplay') !== 'false';
        DOM.autoPlaySwitch.classList.toggle('active', State.autoPlay);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITE UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

function updateFavButton() {
    if (!DOM.favBtn) return;
    DOM.favBtn.classList.toggle('active', State.isFavorite);
    
    // Also visual highlight on the navbar bookmark icon
    if (DOM.bookmarkBtn) {
        DOM.bookmarkBtn.classList.toggle('active', State.isFavorite);
        DOM.bookmarkBtn.querySelector('svg').setAttribute('fill', State.isFavorite ? 'currentColor' : 'none');
    }
}

function toggleFavorite() {
    if (!State.shabadInfo) return;

    State.isFavorite = Favorites.toggle(State.shabadId, State.shabadInfo);
    updateFavButton();

    showToast(State.isFavorite ? 'Added to Pothi Pustak 📖' : 'Removed from Pothi');
    haptic('medium');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADJACENT SHABAD NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function loadAdjacentShabad(offset) {
    const nextId = parseInt(State.shabadId) + offset;
    if (nextId > 0 && nextId < 7000) {
        haptic('medium');
        const params = new URLSearchParams(window.location.search);
        params.set('shabad', nextId);
        params.delete('verse'); // clear line focus
        window.location.search = params.toString();
    } else {
        showToast('Limit reached');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS & EVENT WIRING
// ═══════════════════════════════════════════════════════════════════════════════

function initEvents() {
    // Back navigation
    DOM.navBack.addEventListener('click', (e) => {
        e.preventDefault();
        if (history.length > 1) {
            history.back();
        } else {
            window.location.href = 'gurbani-khoj.html';
        }
    });

    // Bookmark/Fav buttons
    DOM.bookmarkBtn.addEventListener('click', toggleFavorite);
    DOM.favBtn.addEventListener('click', toggleFavorite);

    // Adjacent shabad buttons
    DOM.prevShabadBtn.addEventListener('click', () => loadAdjacentShabad(-1));
    DOM.nextShabadBtn.addEventListener('click', () => loadAdjacentShabad(1));

    // Settings panel triggers
    DOM.settingsBtn.addEventListener('click', () => Settings.open());
    DOM.settingsDone.addEventListener('click', () => Settings.close());
    DOM.settingsOverlay.querySelector('.settings-backdrop').addEventListener('click', () => Settings.close());

    // Font size slider
    DOM.fontSizeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        Settings.setFontSize(val);
    });

    // Font family cycle button - now toggles submenu
    DOM.fontRowBtn.addEventListener('click', () => {
        haptic();
        const submenu = $('#fontSubmenu');
        const isVisible = submenu.style.display !== 'none';
        submenu.style.display = isVisible ? 'none' : 'flex';
    });

    // Font option selection
    $$('.font-option').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic();
            const font = btn.dataset.font;
            Settings.setFont(font);
            
            // Update active state
            $$('.font-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Hide submenu
            $('#fontSubmenu').style.display = 'none';
        });
    });

    // Line spacing segmented control
    $$('#lineSpacingSegmented .segment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic();
            Settings.setLineSpacing(parseFloat(btn.dataset.spacing));
        });
    });

    // Alignment segmented control
    $$('#alignSegmented .segment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic();
            Settings.setTextAlign(btn.dataset.align);
        });
    });

    // Theme preset clicks
    $$('.theme-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic();
            ReaderTheme.set(btn.dataset.readerTheme, true);
        });
    });

    // Switches
    DOM.translitSwitch.addEventListener('click', () => {
        haptic();
        Settings.toggleTranslitEn();
    });

    DOM.hindiGurbaniSwitch.addEventListener('click', () => {
        haptic();
        Settings.toggleTranslitHi();
    });

    DOM.translationSwitch.addEventListener('click', () => {
        haptic();
        Settings.toggleTransEn();
    });

    DOM.punjabiTranslationSwitch.addEventListener('click', () => {
        haptic();
        Settings.toggleTransPu();
    });

    DOM.hindiTranslationSwitch.addEventListener('click', () => {
        haptic();
        Settings.toggleTransHi();
    });

    DOM.focusModeToggle.addEventListener('click', () => {
        haptic();
        Settings.toggleFocusMode();
    });

    DOM.pauseNextShabadSwitch.addEventListener('click', () => {
        haptic();
        State.pauseNextShabad = !State.pauseNextShabad;
        localStorage.setItem('reader_pause_next_shabad', State.pauseNextShabad);
        DOM.pauseNextShabadSwitch.classList.toggle('active', State.pauseNextShabad);
    });

    DOM.autoPlaySwitch.addEventListener('click', () => {
        haptic();
        State.autoPlay = !State.autoPlay;
        localStorage.setItem('reader_autoplay', State.autoPlay);
        DOM.autoPlaySwitch.classList.toggle('active', State.autoPlay);
    });

    // Clicking cycles
    DOM.autoScrollRow.addEventListener('click', () => {
        haptic();
        Autoscroll.toggleVisibility(!State.autoscrollVisible);
    });

    DOM.scrollSpeedRow.addEventListener('click', () => {
        haptic();
        const speeds = ['Slow', 'Normal', 'Fast'];
        const rates = [0.5, 1.0, 2.5];
        const nextIdx = (speeds.indexOf(State.scrollSpeedText) + 1) % speeds.length;
        
        State.scrollSpeedText = speeds[nextIdx];
        DOM.scrollSpeedSettingsVal.textContent = `${speeds[nextIdx]} >`;
        localStorage.setItem('reader_scroll_speed_text', speeds[nextIdx]);

        // Live update slider
        DOM.scrollSpeedSlider.value = rates[nextIdx];
        State.autoscrollSpeed = rates[nextIdx];
        DOM.scrollSpeedVal.textContent = `${rates[nextIdx].toFixed(1)}x`;
        localStorage.setItem('reader_autoscroll_speed', rates[nextIdx]);
    });

    DOM.repeatRow.addEventListener('click', () => {
        haptic();
        const modes = ['One Shabad', 'All Shabads', 'None'];
        const nextIdx = (modes.indexOf(State.repeatMode) + 1) % modes.length;
        State.repeatMode = modes[nextIdx];
        DOM.repeatVal.textContent = `${modes[nextIdx]} >`;
        localStorage.setItem('reader_repeat_mode', modes[nextIdx]);
    });

    DOM.bgAudioRow.addEventListener('click', () => {
        haptic();
        const modes = ['Continue', 'Pause'];
        const nextIdx = (modes.indexOf(State.bgAudioMode) + 1) % modes.length;
        State.bgAudioMode = modes[nextIdx];
        DOM.bgAudioVal.textContent = `${modes[nextIdx]} >`;
        localStorage.setItem('reader_bg_audio_mode', modes[nextIdx]);
    });

    // Word Vichar click triggers
    DOM.shabadLines.addEventListener('click', (e) => {
        const wordEl = e.target.closest('.g-word');
        if (wordEl) {
            e.stopPropagation();
            const word = wordEl.dataset.word;
            WordVichar.open(word);
            return;
        }

        const lineEl = e.target.closest('.shabad-line');
        if (lineEl) {
            const verseId = lineEl.dataset.verse;
            selectActiveLine(verseId, true);
            haptic();
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR — GOLD READING TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

const progressFill = document.getElementById('progressFill');

function updateProgress() {
    if (!progressFill) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) { progressFill.style.width = '0%'; return; }
    const pct = Math.min(100, (scrollTop / docHeight) * 100);
    progressFill.style.width = pct + '%';
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS — SACRED COMMAND PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

const kbdHint = document.getElementById('kbdHint');
let kbdHintTimer = null;

function showKbdHint() {
    if (!kbdHint) return;
    kbdHint.classList.add('show');
    clearTimeout(kbdHintTimer);
    kbdHintTimer = setTimeout(() => kbdHint.classList.remove('show'), 4000);
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Skip if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key.toLowerCase()) {
            case 'f':
                e.preventDefault();
                Settings.toggleFocusMode();
                haptic();
                showToast(State.focusMode ? 'Focus Mode On' : 'Focus Mode Off');
                break;
            case ' ':
                e.preventDefault();
                if (State.autoscrollVisible) {
                    DOM.scrollPlayBtn.click();
                }
                break;
            case 'p':
                e.preventDefault();
                loadAdjacentShabad(-1);
                break;
            case 'n':
                e.preventDefault();
                loadAdjacentShabad(1);
                break;
            case 'escape':
                if (DOM.settingsOverlay.classList.contains('active')) {
                    Settings.close();
                }
                if (DOM.wordSheetOverlay.classList.contains('active')) {
                    WordVichar.close();
                }
                break;
        }
    });

    // Show hint on first interaction
    document.addEventListener('click', () => showKbdHint(), { once: true });
    // Also show hint after content loads
    setTimeout(showKbdHint, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

// Header hide/show on scroll
let lastScrollY = 0;
let scrollTimer = null;

function initHeaderScroll() {
    const nav = $('.ios-nav');
    if (!nav) return;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Clear existing timer
        if (scrollTimer) clearTimeout(scrollTimer);
        
        // Hide when scrolling down (after 100px), show when scrolling up
        if (currentScrollY > 100) {
            if (currentScrollY > lastScrollY && !State.autoscrollActive) {
                // Scrolling down - hide header
                nav.classList.add('nav-hidden');
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up - show header
                nav.classList.remove('nav-hidden');
            }
        } else {
            // Always show when near top
            nav.classList.remove('nav-hidden');
        }
        
        lastScrollY = currentScrollY;
        
        // Also show header briefly after scroll stops
        scrollTimer = setTimeout(() => {
            if (currentScrollY > 100 && !State.autoscrollActive) {
                nav.classList.remove('nav-hidden');
            }
        }, 2000);
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = getParams();
    State.shabadId = params.shabadId;
    State.highlightVerseId = params.verseId;

    if (!State.shabadId) {
        showToast('No Shabad specified');
        return;
    }

    ReaderTheme.init();
    Settings.load();
    Autoscroll.init();
    WordVichar.init();
    initEvents();
    initKeyboardShortcuts();
    initHeaderScroll();

    const data = await loadShabad(State.shabadId);
    if (data) {
        renderShabad(data);
        // Sync values
        Settings.setLineSpacing(State.lineSpacing);
        Settings.setTextAlign(State.textAlign);
    }

    // Progress bar scroll listener
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    setTimeout(updateProgress, 500);

    // Sync reader theme when global theme changes
    document.addEventListener('themechange', (e) => {
        const globalTheme = e.detail?.theme;
        if (!globalTheme) return;
        const isDark = globalTheme === 'dark' || (globalTheme === 'auto' && new Date().getHours() >= 20);
        const preferredReaderTheme = isDark ? 'charcoal' : 'paper';
        const currentReaderTheme = document.documentElement.getAttribute('data-reader-theme');
        if (currentReaderTheme !== preferredReaderTheme) {
            ReaderTheme.set(preferredReaderTheme, false);
        }
    });

    console.log('Pothi App Reader Overhauled.');
});
