/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHABAD VICHAR — Daily Divine Contemplation
 * Apple Books Style • Daily Calendar-Based Shabad • Clean iOS Design
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class ShabadVichar {
    constructor() {
        this.config = {
            larivaar: false,
            transliteration: false,
            english: true,
            punjabi: false,
            fontSize: 1.4,
            theme: 'light'
        };

        this.state = {
            shabad: null,
            isLoading: false,
            isDailyShabad: true // Tracks if showing daily or random override
        };

        this.bookmarks = this.load('gurbani_favorite_shabads') || [];
        this.todayKey = this.getTodayKey();
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.loadConfig();
        this.applyTheme();
        this.bindEvents();
        this.loadDailyShabad();
    }

    // ═══════════════════════════════════════════════════════════════
    // DAILY SHABAD LOGIC — Calendar Based
    // ═══════════════════════════════════════════════════════════════

    getTodayKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    getStorageKey() {
        return `shabad_vichar_daily_${this.todayKey}`;
    }

    loadDailyShabad() {
        const storageKey = this.getStorageKey();
        const savedShabad = this.load(storageKey);

        if (savedShabad && savedShabad.verses && savedShabad.verses.length > 0) {
            // Use today's saved shabad
            this.state.shabad = savedShabad;
            this.state.isDailyShabad = true;
            this.updateHeader(savedShabad);
            this.renderVerses();
            this.showState('verses');
        } else {
            // Fetch new shabad for today
            this.fetchShabad(true);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DOM CACHE
    // ═══════════════════════════════════════════════════════════════

    cacheDOM() {
        this.$ = {
            // States
            loadingState: document.getElementById('loadingState'),
            errorState: document.getElementById('errorState'),
            versesState: document.getElementById('versesState'),
            versesContainer: document.getElementById('versesContainer'),

            // Header
            angNumber: document.getElementById('angNumber'),
            sourceInfo: document.getElementById('sourceInfo'),

            // Actions
            newShabadBtn: document.getElementById('newShabadBtn'),
            copyBtn: document.getElementById('copyBtn'),
            shareBtn: document.getElementById('shareBtn'),
            saveBtn: document.getElementById('saveBtn'),
            retryBtn: document.getElementById('retryBtn'),
            infoBtn: document.getElementById('infoBtn'),
            settingsBtn: document.getElementById('settingsBtn'),

            // Settings Sheet
            sheetBackdrop: document.getElementById('sheetBackdrop'),
            settingsSheet: document.getElementById('settingsSheet'),

            // Info Sheet
            infoSheetBackdrop: document.getElementById('infoSheetBackdrop'),
            infoSheet: document.getElementById('infoSheet'),

            // Toggles
            larivaarToggle: document.getElementById('larivaarToggle'),
            translitToggle: document.getElementById('translitToggle'),
            englishToggle: document.getElementById('englishToggle'),
            punjabiToggle: document.getElementById('punjabiToggle'),
            fontSlider: document.getElementById('fontSlider'),
            themeToggleBtn: document.getElementById('themeToggleBtn'),

            // Toast
            toast: document.getElementById('toast'),
            toastMsg: document.getElementById('toastMsg')
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT BINDING
    // ═══════════════════════════════════════════════════════════════

    bindEvents() {
        // New Shabad (personal override - not saved as daily)
        this.$.newShabadBtn?.addEventListener('click', () => {
            this.haptic('medium');
            this.fetchShabad(false); // false = not daily, just random
        });

        // Retry
        this.$.retryBtn?.addEventListener('click', () => {
            this.haptic('light');
            this.loadDailyShabad();
        });

        // Quick Actions
        this.$.copyBtn?.addEventListener('click', () => this.copyShabad());
        this.$.shareBtn?.addEventListener('click', () => this.shareShabad());
        this.$.saveBtn?.addEventListener('click', () => this.toggleBookmark());

        // Settings
        this.$.settingsBtn?.addEventListener('click', () => this.openSettings());
        this.$.sheetBackdrop?.addEventListener('click', () => this.closeSettings());

        // Info Sheet
        this.$.infoBtn?.addEventListener('click', () => this.openInfoSheet());
        this.$.infoSheetBackdrop?.addEventListener('click', () => this.closeInfoSheet());

        // Toggles
        this.bindToggle(this.$.larivaarToggle, 'larivaar');
        this.bindToggle(this.$.translitToggle, 'transliteration');
        this.bindToggle(this.$.englishToggle, 'english');
        this.bindToggle(this.$.punjabiToggle, 'punjabi');

        // Font Slider
        this.$.fontSlider?.addEventListener('input', (e) => {
            this.config.fontSize = parseFloat(e.target.value);
            this.applyFontSize();
            this.saveConfig();
        });

        // Theme Toggle
        this.$.themeToggleBtn?.addEventListener('click', () => this.toggleTheme());

        // Swipe to close settings
        this.initSheetGestures();

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
                this.closeInfoSheet();
            }
        });
    }

    bindToggle(el, key) {
        if (!el) return;
        el.addEventListener('change', () => {
            this.haptic('light');
            this.config[key] = el.checked;
            this.saveConfig();
            this.renderVerses();
        });
    }

    initSheetGestures() {
        const sheet = this.$.settingsSheet;
        if (!sheet) return;

        let startY = 0;
        let currentY = 0;

        sheet.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        sheet.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            if (diff > 0) {
                sheet.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: true });

        sheet.addEventListener('touchend', () => {
            const diff = currentY - startY;
            sheet.style.transform = '';
            if (diff > 80) this.closeSettings();
        });
        
        // Swipe back gesture on content area
        this.initSwipeBackGesture();
    }

    initSwipeBackGesture() {
        const content = document.querySelector('.shabad-content');
        if (!content) return;
        
        let startX = 0;
        let isSwiping = false;
        
        content.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            if (startX < 30) { // Only trigger near left edge
                isSwiping = true;
            }
        }, { passive: true });
        
        content.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            const currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            if (diff > 100) {
                this.haptic('light');
                if (window.navigateTo) window.navigateTo('../index.html'); else window.location.href = '../index.html';
                isSwiping = false;
            }
        }, { passive: true });
        
        content.addEventListener('touchend', () => {
            isSwiping = false;
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    showState(state) {
        ['loading', 'error', 'verses'].forEach(s => {
            const el = this.$[`${s}State`];
            if (el) {
                el.classList.toggle('active', s === state);
            }
        });
        // Clear verses container when showing loading or error
        if (state !== 'verses' && this.$.versesContainer) {
            this.$.versesContainer.innerHTML = '';
        }
    }

    showError(message) {
        console.error('User error:', message);
        // Try to show error in UI if error container exists
        if (this.$.errorState) {
            this.$.errorState.innerHTML = `<div class="error-message">${message}</div>`;
        }
        // Also try to show as alert for better user feedback
        if (typeof alert !== 'undefined') {
            setTimeout(() => alert(message), 100);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // API — FETCH SHABAD
    // ═══════════════════════════════════════════════════════════════

    async fetchShabad(isDaily = false) {
        if (this.state.isLoading) return;

        this.state.isLoading = true;
        this.state.isDailyShabad = isDaily;
        this.showState('loading');
        this.haptic('medium');

        const maxRetries = 3;
        const baseTimeout = 10000; // 10 seconds
        let attempt = 0;

        const attemptFetch = async (retryCount) => {
            const timeout = baseTimeout * Math.pow(2, retryCount); // Exponential backoff
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
            });

            try {
                console.log(`Attempt ${retryCount + 1}/${maxRetries} with ${timeout}ms timeout`);
                
                const res = await Promise.race([
                    fetch('https://api.banidb.com/v2/random/shabad', {
                        method: 'GET',
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    }),
                    timeoutPromise
                ]);
                
                if (!res.ok) {
                    throw new Error(`Network error: ${res.status} ${res.statusText}`);
                }

                const data = await res.json();
                if (!data?.verses?.length) {
                    throw new Error('No verses in response');
                }

                return data;

            } catch (err) {
                console.error(`Attempt ${retryCount + 1} failed:`, err.message);
                
                if (retryCount === maxRetries - 1) {
                    throw err; // Final attempt failed, throw the error
                }
                
                // Wait before next retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                return attemptFetch(retryCount + 1);
            }
        };

        try {
            const data = await attemptFetch(0);
            
            this.state.shabad = data;

            // If this is the daily shabad, save it
            if (isDaily) {
                this.save(this.getStorageKey(), data);
            }

            this.updateHeader(data);
            this.renderVerses();
            this.showState('verses');
            this.updateSaveButton();
            this.haptic('light');

        } catch (err) {
            console.error('All fetch attempts failed:', err);
            this.showState('error');
            this.haptic('error');
            
            // Show user-friendly error message
            if (err.message.includes('Timeout')) {
                this.showError('Network timeout - please check your connection and try again');
            } else if (err.message.includes('Network error')) {
                this.showError('Network error - please check your internet connection');
            } else {
                this.showError('Unable to fetch shabad - please try again later');
            }
        } finally {
            this.state.isLoading = false;
        }
    }

    updateHeader(data) {
        const info = data.shabadInfo || {};
        const verse = data.verses[0] || {};

        // Ang number
        this.$.angNumber.textContent = info.pageNo || verse.pageNo || '---';

        // Source info
        const parts = [
            info.source?.english,
            info.raag?.english,
            info.writer?.english
        ].filter(Boolean);

        this.$.sourceInfo.textContent = parts.length
            ? parts.join(' • ')
            : 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ';
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER VERSES — Apple Notes Style (No Cards, Line Separators)
    // ═══════════════════════════════════════════════════════════════

    renderVerses() {
        const shabad = this.state.shabad;
        if (!shabad?.verses) return;

        const html = shabad.verses.map((v, i) => {
            let gurmukhi = v.verse?.unicode || '';
            if (this.config.larivaar) {
                gurmukhi = gurmukhi.replace(/\s+/g, '');
            }

            const translit = v.transliteration?.en || v.transliteration?.english || v.transliteration || '';
            const english = v.translation?.en?.bdb || v.translation?.en?.ms || '';
            const punjabi = v.translation?.pu?.bdb?.unicode || v.translation?.pu?.ss?.unicode || '';

            let translationsHtml = '';

            if ((this.config.english && english) || (this.config.punjabi && punjabi)) {
                translationsHtml = '<div class="verse-translations">';
                
                if (this.config.english && english) {
                    translationsHtml += `<p class="verse-translation">${english}</p>`;
                }
                
                if (this.config.punjabi && punjabi) {
                    translationsHtml += `<p class="verse-translation punjabi">${punjabi}</p>`;
                }
                
                translationsHtml += '</div>';
            }

            return `
                <div class="verse-item" style="animation-delay: ${i * 50}ms">
                    <p class="verse-gurmukhi${this.config.larivaar ? ' larivaar' : ''}">${gurmukhi}</p>
                    ${this.config.transliteration && translit ? `<p class="verse-transliteration">${translit}</p>` : ''}
                    ${translationsHtml}
                </div>
            `;
        }).join('');

        this.$.versesContainer.innerHTML = html;
        this.$.versesContainer.scrollTop = 0;
        
        // Add tap handlers to verses
        this.$.versesContainer.querySelectorAll('.verse-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.haptic('light');
                this.showVerseMenu(index);
            });
        });
    }

    showVerseMenu(index) {
        const verse = this.state.shabad?.verses[index];
        if (!verse) return;
        
        const gurmukhi = verse.verse?.unicode || '';
        const english = verse.translation?.en?.bdb || verse.translation?.en?.ms || '';
        
        // Show native share if available, else copy
        if (navigator.share) {
            navigator.share({
                title: 'Shabad Vichar',
                text: `${gurmukhi}\n\n${english}`,
            }).catch(() => {});
        } else {
            const text = `${gurmukhi}\n\n${english}`;
            navigator.clipboard.writeText(text).then(() => {
                this.toast('Verse copied!');
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════

    async copyShabad() {
        if (!this.state.shabad?.verses) return;
        this.haptic('light');

        const lines = this.state.shabad.verses.map(v => {
            let text = v.verse?.unicode || '';
            if (this.config.transliteration && v.transliteration) {
                const translit = v.transliteration?.en || v.transliteration?.english || '';
                if (translit) text += '\n' + translit;
            }
            if (this.config.english) {
                const en = v.translation?.en?.bdb || v.translation?.en?.ms || '';
                if (en) text += '\n' + en;
            }
            return text;
        });

        const ang = this.state.shabad.shabadInfo?.pageNo || '';
        const header = this.state.isDailyShabad ? '☬ Shabad Vichar' : '☬ Random Shabad';
        const full = `${header} • Ang ${ang}\n\n${lines.join('\n\n')}\n\n— ANHAD`;

        try {
            await navigator.clipboard.writeText(full);
            this.toast('Copied!');
        } catch {
            this.toast('Copy failed');
        }
    }

    async shareShabad() {
        if (!this.state.shabad?.verses) return;
        this.haptic('light');

        const first = this.state.shabad.verses[0]?.verse?.unicode || '';
        const ang = this.state.shabad.shabadInfo?.pageNo || '';
        const title = this.state.isDailyShabad ? 'Shabad Vichar' : 'Random Shabad';

        const shareData = {
            title: `${title} — ANHAD`,
            text: `${first}\n\nAng ${ang}\n\n— ANHAD`,
            url: location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.text);
                this.toast('Copied!');
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error(e);
        }
    }

    toggleBookmark() {
        if (!this.state.shabad) return;
        this.haptic('medium');

        const id = this.state.shabad.shabadInfo?.shabadId || this.state.shabad.verses[0]?.shabadId;
        if (!id) return;

        const idx = this.bookmarks.findIndex(b => b.id === id || b.shabadId === id);

        if (idx > -1) {
            this.bookmarks.splice(idx, 1);
            this.toast('Removed from favorites');
        } else {
            const firstVerse = this.state.shabad.verses[0];
            const gurmukhi = firstVerse?.verse?.unicode || '';
            const translation = firstVerse?.translation?.en?.bdb || firstVerse?.translation?.en?.ms || '';

            this.bookmarks.push({
                id,
                shabadId: id,
                gurmukhi: gurmukhi,
                translation: translation,
                english: translation,
                ang: this.state.shabad.shabadInfo?.pageNo || firstVerse?.pageNo,
                source: this.state.isDailyShabad ? 'Shabad Vichar' : 'Random Shabad',
                savedAt: Date.now()
            });
            this.toast('Saved to favorites!');
        }

        this.save('gurbani_favorite_shabads', this.bookmarks);
        this.updateSaveButton();
    }

    updateSaveButton() {
        if (!this.$.saveBtn || !this.state.shabad) return;

        const id = this.state.shabad.shabadInfo?.shabadId || this.state.shabad.verses[0]?.shabadId;
        const isSaved = this.bookmarks.some(b => b.id === id || b.shabadId === id);

        this.$.saveBtn.classList.toggle('active', isSaved);
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════

    openSettings() {
        this.haptic('light');
        this.syncToggles();
        this.$.sheetBackdrop?.classList.add('visible');
        this.$.settingsSheet?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    closeSettings() {
        this.$.sheetBackdrop?.classList.remove('visible');
        this.$.settingsSheet?.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // ═══════════════════════════════════════════════════════════════
    // INFO SHEET
    // ═══════════════════════════════════════════════════════════════

    openInfoSheet() {
        this.haptic('light');
        this.$.infoSheetBackdrop?.classList.add('visible');
        this.$.infoSheet?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    closeInfoSheet() {
        this.$.infoSheetBackdrop?.classList.remove('visible');
        this.$.infoSheet?.classList.remove('visible');
        document.body.style.overflow = '';
    }

    syncToggles() {
        if (this.$.larivaarToggle) this.$.larivaarToggle.checked = this.config.larivaar;
        if (this.$.translitToggle) this.$.translitToggle.checked = this.config.transliteration;
        if (this.$.englishToggle) this.$.englishToggle.checked = this.config.english;
        if (this.$.punjabiToggle) this.$.punjabiToggle.checked = this.config.punjabi;
        if (this.$.fontSlider) this.$.fontSlider.value = this.config.fontSize;
    }

    // ═══════════════════════════════════════════════════════════════
    // THEME
    // ═══════════════════════════════════════════════════════════════

    toggleTheme() {
        this.haptic('light');
        this.config.theme = this.config.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveConfig();
        localStorage.setItem('anhad_theme', this.config.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.config.theme);
        const color = this.config.theme === 'dark' ? '#1C1C1E' : '#FAF8F5';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    }

    applyFontSize() {
        document.documentElement.style.setProperty('--font-size', `${this.config.fontSize}rem`);
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════

    toast(msg) {
        if (!this.$.toast || !this.$.toastMsg) return;
        this.$.toastMsg.textContent = msg;
        this.$.toast.classList.add('show');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.$.toast.classList.remove('show'), 2000);
    }

    haptic(type = 'light') {
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.impact(type);
        } else if (navigator.vibrate) {
            const patterns = { light: 8, medium: 15, heavy: 25, error: [20, 40, 20] };
            navigator.vibrate(patterns[type] || 8);
        }
    }

    load(key) {
        try { return JSON.parse(localStorage.getItem(key)); }
        catch { return null; }
    }

    save(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); }
        catch { /* ignore */ }
    }

    loadConfig() {
        const saved = this.load('anhad_shabad_config');
        if (saved) this.config = { ...this.config, ...saved };

        // Sync with global app theme
        const globalTheme = localStorage.getItem('anhad_theme');
        if (globalTheme) {
            this.config.theme = globalTheme;
        } else {
            const darkFlag = localStorage.getItem('anhad_dark_mode');
            if (darkFlag === 'true') this.config.theme = 'dark';
            else if (darkFlag === 'false') this.config.theme = 'light';
        }

        this.applyFontSize();
    }

    saveConfig() {
        this.save('anhad_shabad_config', this.config);
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZE — SPA Compatible
// ═══════════════════════════════════════════════════════════════

function initShabadVichar() {
    // Prevent double initialization if already loaded in this SPA session
    if (window.shabadVichar && typeof window.shabadVichar.init === 'function') {
        window.shabadVichar.init();
    } else {
        window.shabadVichar = new ShabadVichar();
    }
    console.log('%c☬ ANHAD — Shabad Vichar', 'color: #D4A03A; font-size: 14px; font-weight: bold;');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShabadVichar);
} else {
    initShabadVichar();
}
