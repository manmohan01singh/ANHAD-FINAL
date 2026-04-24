/**
 * SHABAD READER - Full Page Reader
 * Shows ONLY the searched Shabad (from header to end numbering)
 * Larivaar/Padchhed, Multi-language Translation, Transliteration
 * Favorites support
 */

// ═══════════════════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = 'https://api.banidb.com/v2';

// ═══════════════════════════════════════════════════════════════════════════════
// DOM
// ═══════════════════════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    navBack: $('#navBack'),
    navTitle: $('#navTitle'),
    themeToggle: $('#themeToggle'),
    fullscreenBtn: $('#fullscreenBtn'),
    settingsBtn: $('#settingsBtn'),
    favBtn: $('#favBtn'),

    angBadge: $('#angBadge'),
    raagName: $('#raagName'),
    writerName: $('#writerName'),

    loadingState: $('#loadingState'),
    shabadLines: $('#shabadLines'),

    fontSizeDown: $('#fontSizeDown'),
    fontSizeUp: $('#fontSizeUp'),
    shareBtn: $('#shareBtn'),

    settingsOverlay: $('#settingsOverlay'),
    settingsDone: $('#settingsDone'),
    translitToggle: $('#translitToggle'),

    toast: $('#toast'),
    toastText: $('#toastText')
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

const State = {
    shabadId: null,
    highlightVerseId: null,
    verses: [],
    shabadInfo: null,
    theme: 'light',
    displayMode: 'padchhed',
    translationLang: 'english',
    showTranslit: false,
    fontSizeBase: 22,
    fontGurmukhi: 'raavi',
    isFavorite: false,
    isFullscreen: false
};

// ═══════════════════════════════════════════════════════════════════════════════
// URL PARAMS
// ═══════════════════════════════════════════════════════════════════════════════

function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        shabadId: params.get('shabad'),
        verseId: params.get('verse')
    };
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
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITES
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
            // Save in unified format
            favorites.unshift({
                id: shabad.shabadId,
                shabadId: shabad.shabadId,
                gurmukhi: shabad.gurmukhi || '',
                translation: shabad.translation || '',
                english: shabad.translation || '',
                ang: shabad.ang || '',
                source: 'Shabad Reader',
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
// HAPTIC & TOAST
// ═══════════════════════════════════════════════════════════════════════════════

function haptic(style = 'light') {
    if (navigator.vibrate) {
        navigator.vibrate(style === 'light' ? 10 : 20);
    }
}

function showToast(message) {
    DOM.toastText.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// API
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
// iOS NOTES STYLE SEARCH HIGHLIGHTING
// ═══════════════════════════════════════════════════════════════════════════════

function highlightSearchTerm(text, query) {
    if (!query || !text) return text;
    
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex that matches the query (case-insensitive)
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // Replace matches with highlighted span
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// Get search query from URL if passed from Gurbani Khoj
function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || params.get('query') || '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER SHABAD - Only show actual Shabad verses
// ═══════════════════════════════════════════════════════════════════════════════

function renderShabad(data) {
    if (!data || !data.verses || data.verses.length === 0) {
        showToast('Shabad not found');
        return;
    }

    // The API returns the full Shabad - all verses belong to this Shabad
    // No filtering needed - the API endpoint /shabads/{id} returns only this Shabad's verses
    State.verses = data.verses;

    const firstVerse = data.verses[0];

    // Store shabad info for favorites
    State.shabadInfo = {
        shabadId: State.shabadId,
        ang: firstVerse.pageNo,
        raag: firstVerse.raag?.english || '',
        gurmukhi: firstVerse.verse?.unicode || ''
    };

    // Update meta
    DOM.angBadge.textContent = `Ang ${firstVerse.pageNo || ''}`;
    DOM.raagName.textContent = firstVerse.raag?.english || '';
    DOM.writerName.textContent = firstVerse.writer?.english || '';

    // Check favorite status
    State.isFavorite = Favorites.isFavorite(State.shabadId);
    updateFavButton();
    
    // Get search query for highlighting
    const searchQuery = getSearchQuery();

    // Render lines
    DOM.shabadLines.innerHTML = data.verses.map(verse => {
        const isHighlighted = String(verse.verseId) === String(State.highlightVerseId);

        // Gurmukhi (Padchhed or Larivaar)
        const gurmukhiRaw = State.displayMode === 'larivaar'
            ? (verse.larivaar?.unicode || verse.verse?.unicode || '')
            : (verse.verse?.unicode || '');

        // Transliteration
        const translitRaw = verse.transliteration?.english || '';

        // Translation based on language
        let translationRaw = '';
        let transClass = 'translation';

        switch (State.translationLang) {
            case 'english':
                translationRaw = verse.translation?.en?.bdb || verse.translation?.en?.ms || '';
                break;
            case 'punjabi':
                translationRaw = verse.translation?.pu?.ss?.unicode || verse.translation?.pu?.bdb?.unicode || '';
                transClass += ' punjabi';
                break;
            case 'hindi':
                translationRaw = verse.translation?.hi?.ss || verse.translation?.hi?.sts || '';
                transClass += ' hindi';
                break;
            case 'none':
                translationRaw = '';
                break;
        }
        
        // Apply search highlighting
        const gurmukhi = searchQuery ? highlightSearchTerm(gurmukhiRaw, searchQuery) : gurmukhiRaw;
        const translit = searchQuery ? highlightSearchTerm(translitRaw, searchQuery) : translitRaw;
        const translation = searchQuery ? highlightSearchTerm(translationRaw, searchQuery) : translationRaw;

        return `
            <div class="shabad-line ${isHighlighted ? 'highlighted' : ''}" data-verse="${verse.verseId}">
                <p class="gurmukhi">${gurmukhi}</p>
                <p class="transliteration">${translit}</p>
                <p class="${transClass}">${translation}</p>
            </div>
        `;
    }).join('');

    // Hide loading
    DOM.loadingState.classList.remove('active');

    // Scroll to highlighted
    setTimeout(() => {
        const highlighted = DOM.shabadLines.querySelector('.highlighted');
        if (highlighted) {
            highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITE BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

function updateFavButton() {
    if (!DOM.favBtn) return;
    DOM.favBtn.innerHTML = State.isFavorite ? '❤️' : '🤍';
    DOM.favBtn.classList.toggle('active', State.isFavorite);
}

function toggleFavorite() {
    if (!State.shabadInfo) return;

    State.isFavorite = Favorites.toggle(State.shabadId, State.shabadInfo);
    updateFavButton();

    showToast(State.isFavorite ? 'Added to favorites ❤️' : 'Removed from favorites');
    haptic('medium');
}

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

    setDisplay(mode) {
        State.displayMode = mode;
        document.documentElement.dataset.display = mode;
        localStorage.setItem('shabadDisplay', mode);

        $$('.display-options .setting-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.display === mode);
        });

        // Re-render
        if (State.verses.length) {
            renderShabad({ verses: State.verses });
        }
    },

    setTranslation(lang) {
        State.translationLang = lang;
        document.documentElement.dataset.trans = lang;
        localStorage.setItem('shabadTrans', lang);

        $$('.trans-options .setting-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.trans === lang);
        });

        // Re-render
        if (State.verses.length) {
            renderShabad({ verses: State.verses });
        }
    },

    toggleTranslit() {
        State.showTranslit = !State.showTranslit;
        document.documentElement.dataset.translit = State.showTranslit ? 'on' : 'off';
        localStorage.setItem('shabadTranslit', State.showTranslit ? 'on' : 'off');
        DOM.translitToggle.classList.toggle('active', State.showTranslit);
    },

    setFont(font) {
        State.fontGurmukhi = font;
        document.documentElement.dataset.font = font;
        localStorage.setItem('gurbaniFont', font);

        $$('.font-options .setting-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.font === font);
        });
    },

    load() {
        // Display mode
        const display = localStorage.getItem('shabadDisplay') || 'padchhed';
        this.setDisplay(display);

        // Translation
        const trans = localStorage.getItem('shabadTrans') || 'english';
        this.setTranslation(trans);

        // Transliteration
        const translit = localStorage.getItem('shabadTranslit') === 'on';
        State.showTranslit = translit;
        document.documentElement.dataset.translit = translit ? 'on' : 'off';
        DOM.translitToggle.classList.toggle('active', translit);

        // Font
        const font = localStorage.getItem('gurbaniFont') || 'raavi';
        this.setFont(font);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FONT SIZE
// ═══════════════════════════════════════════════════════════════════════════════

function updateFontSize(delta) {
    State.fontSizeBase = Math.max(16, Math.min(36, State.fontSizeBase + delta));
    document.documentElement.style.setProperty('--font-size-base', `${State.fontSizeBase}px`);
    localStorage.setItem('shabadFontSize', State.fontSizeBase);
    haptic();
}

function loadFontSize() {
    const saved = parseInt(localStorage.getItem('shabadFontSize')) || 22;
    State.fontSizeBase = saved;
    document.documentElement.style.setProperty('--font-size-base', `${saved}px`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULLSCREEN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Toggle browser fullscreen and UI "immersive" mode
 */
window.toggleFullscreen = async function() {
    console.log('Toggle fullscreen called');
    
    try {
        if (!document.fullscreenElement) {
            // Enter Fullscreen
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                await document.documentElement.msRequestFullscreen();
            }
            State.isFullscreen = true;
        } else {
            // Exit Fullscreen
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
            State.isFullscreen = false;
        }
    } catch (err) {
        console.warn('Fullscreen API failed, falling back to CSS-only mode', err);
        // Fallback for browsers that don't support/allow Fullscreen API
        State.isFullscreen = !State.isFullscreen;
        updateFullscreenUI();
    }
    
    haptic('medium');
};

/**
 * Sync UI classes and state with actual fullscreen status
 */
function updateFullscreenUI() {
    const isActuallyFullscreen = !!document.fullscreenElement || State.isFullscreen;
    
    document.body.classList.toggle('fullscreen', isActuallyFullscreen);
    if (DOM.fullscreenBtn) {
        DOM.fullscreenBtn.classList.toggle('active', isActuallyFullscreen);
    }
    
    // If entering fullscreen, show a brief hint
    if (isActuallyFullscreen) {
        document.body.classList.add('show-fs-hint');
        setTimeout(() => {
            document.body.classList.remove('show-fs-hint');
        }, 3000);
    }
}

// Listen for browser-level fullscreen changes (e.g. Esc key)
document.addEventListener('fullscreenchange', () => {
    State.isFullscreen = !!document.fullscreenElement;
    updateFullscreenUI();
});

document.addEventListener('webkitfullscreenchange', () => {
    State.isFullscreen = !!document.webkitFullscreenElement;
    updateFullscreenUI();
});

// "Tap anywhere to exit" logic
document.addEventListener('click', (e) => {
    // If in fullscreen and NOT clicking a control/button, exit fullscreen
    if ((document.fullscreenElement || State.isFullscreen) && 
        !e.target.closest('.bottom-controls') && 
        !e.target.closest('.ios-nav') && 
        !e.target.closest('.settings-sheet') &&
        !e.target.closest('.fullscreen-toggle')) {
        
        console.log('Exiting fullscreen via global click');
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            State.isFullscreen = false;
            updateFullscreenUI();
        }
        haptic('light');
    }
});


// ═══════════════════════════════════════════════════════════════════════════════
// SHARE
// ═══════════════════════════════════════════════════════════════════════════════

function shareShabad() {
    const highlighted = DOM.shabadLines.querySelector('.highlighted');
    const text = highlighted
        ? highlighted.querySelector('.gurmukhi')?.textContent
        : State.verses[0]?.verse?.unicode;

    if (navigator.share) {
        navigator.share({
            title: 'Gurbani',
            text: text || ''
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text || '');
        showToast('Copied to clipboard');
    }
    haptic();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

function initEvents() {
    // Navigation - Always return to Gurbani Khoj (Search) with state
    DOM.navBack.addEventListener('click', (e) => {
        e.preventDefault();
        
        // If we came from Gurbani Khoj, use history.back() for instant state restoration (bfcache)
        const referrer = document.referrer || '';
        if (referrer.includes('gurbani-khoj.html')) {
            history.back();
        } else {
            // Otherwise force go to Gurbani Khoj
            window.location.href = 'gurbani-khoj.html';
        }
    });

    // Theme
    DOM.themeToggle.addEventListener('click', () => Theme.toggle());

    // Fullscreen
    if (DOM.fullscreenBtn) {
        DOM.fullscreenBtn.addEventListener('click', toggleFullscreen);
        console.log('Fullscreen button event listener attached');
    } else {
        console.error('Fullscreen button not found');
    }

    // Favorite
    if (DOM.favBtn) {
        DOM.favBtn.addEventListener('click', toggleFavorite);
    }

    // Settings
    DOM.settingsBtn.addEventListener('click', () => Settings.open());
    DOM.settingsDone.addEventListener('click', () => Settings.close());

    DOM.settingsOverlay.querySelector('.settings-backdrop').addEventListener('click', () => {
        Settings.close();
    });

    // Display mode
    $$('.display-options .setting-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            Settings.setDisplay(opt.dataset.display);
            haptic();
        });
    });

    // Translation
    $$('.trans-options .setting-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            Settings.setTranslation(opt.dataset.trans);
            haptic();
        });
    });

    // Transliteration
    DOM.translitToggle.addEventListener('click', () => {
        Settings.toggleTranslit();
        haptic();
    });

    // Font
    $$('.font-options .setting-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            Settings.setFont(opt.dataset.font);
            haptic();
        });
    });

    // Font size
    DOM.fontSizeDown.addEventListener('click', () => updateFontSize(-2));
    DOM.fontSizeUp.addEventListener('click', () => updateFontSize(2));

    // Share
    DOM.shareBtn.addEventListener('click', shareShabad);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    const params = getParams();
    State.shabadId = params.shabadId;
    State.highlightVerseId = params.verseId;

    if (!State.shabadId) {
        showToast('No Shabad specified');
        return;
    }

    // Init settings
    Theme.init();
    Settings.load();
    loadFontSize();
    initEvents();

    // Load Shabad
    const data = await loadShabad(State.shabadId);
    if (data) {
        renderShabad(data);
    }

    console.log('Shabad Reader initialized');
});
