/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RANDOM SHABAD — DIVINE EXPERIENCE ENGINE
 * iOS 26+ Liquid Glass • Haptic Feedback • Fluid Animations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class RandomShabad {
    constructor() {
        this.config = {
            larivaar: false,
            transliteration: false,
            english: true,
            punjabi: false,
            fontSize: 1.5,
            theme: 'dark'
        };

        this.state = {
            shabad: null,
            isLoading: false
        };

        this.bookmarks = this.load('gurbani_favorite_shabads') || [];
        this.init();
    }

    init() {
        this.cacheDOM();
        this.loadConfig();
        this.applyTheme();
        this.bindEvents();
        this.fetchShabad();
    }

    cacheDOM() {
        this.$ = {
            // States
            loadingState: document.getElementById('loadingState'),
            errorState: document.getElementById('errorState'),
            contentState: document.getElementById('contentState'),
            versesContainer: document.getElementById('versesContainer'),

            // Display
            angNumber: document.getElementById('angNumber'),
            sourceInfo: document.getElementById('sourceInfo'),

            // Actions
            themeToggle: document.getElementById('themeToggle'),
            newShabadBtn: document.getElementById('newShabadBtn'),
            copyBtn: document.getElementById('copyBtn'),
            shareBtn: document.getElementById('shareBtn'),
            saveBtn: document.getElementById('saveBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            retryBtn: document.getElementById('retryBtn'),

            // Settings Sheet
            sheetOverlay: document.getElementById('sheetOverlay'),
            settingsSheet: document.getElementById('settingsSheet'),

            // Toggles
            larivaarToggle: document.getElementById('larivaarToggle'),
            translitToggle: document.getElementById('translitToggle'),
            englishToggle: document.getElementById('englishToggle'),
            punjabiToggle: document.getElementById('punjabiToggle'),
            fontSlider: document.getElementById('fontSlider'),

            // Toast
            toast: document.getElementById('toast'),
            toastMsg: document.getElementById('toastMsg')
        };
    }

    bindEvents() {
        // Theme
        this.$.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Primary Action
        this.$.newShabadBtn?.addEventListener('click', () => this.fetchShabad());
        this.$.retryBtn?.addEventListener('click', () => this.fetchShabad());

        // Quick Actions
        this.$.copyBtn?.addEventListener('click', () => this.copyShabad());
        this.$.shareBtn?.addEventListener('click', () => this.shareShabad());
        this.$.saveBtn?.addEventListener('click', () => this.toggleBookmark());

        // Settings
        this.$.settingsBtn?.addEventListener('click', () => this.openSettings());
        this.$.sheetOverlay?.addEventListener('click', () => this.closeSettings());

        // Toggles
        this.bindToggle(this.$.larivaarToggle, 'larivaar');
        // Transliteration removed - was causing object object display
        // this.bindToggle(this.$.translitToggle, 'transliteration');
        this.bindToggle(this.$.englishToggle, 'english');
        this.bindToggle(this.$.punjabiToggle, 'punjabi');

        // Font Slider
        this.$.fontSlider?.addEventListener('input', (e) => {
            this.config.fontSize = parseFloat(e.target.value);
            this.applyFontSize();
            this.saveConfig();
        });

        // Swipe gesture on settings sheet
        this.initSheetGestures();

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeSettings();
            if (e.key === 'r' && !e.metaKey && !e.ctrlKey) this.fetchShabad();
        });
    }

    bindToggle(el, key) {
        if (!el) return;
        el.addEventListener('click', () => {
            this.haptic();
            const isActive = el.classList.toggle('active');
            el.setAttribute('aria-checked', isActive);
            this.config[key] = isActive;
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
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    showState(state) {
        ['loading', 'error', 'content'].forEach(s => {
            const el = this.$[`${s}State`];
            if (el) el.style.display = s === state ? 'flex' : 'none';
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // API - FETCH RANDOM SHABAD
    // ═══════════════════════════════════════════════════════════════

    async fetchShabad() {
        if (this.state.isLoading) return;

        this.state.isLoading = true;
        this.showState('loading');
        this.haptic('medium');

        try {
            const res = await fetch('https://api.banidb.com/v2/random/shabad');
            if (!res.ok) throw new Error('Network error');

            const data = await res.json();
            if (!data?.verses?.length) throw new Error('No verses');

            this.state.shabad = data;
            this.updateHeader(data);
            this.renderVerses();
            this.showState('content');
            this.updateSaveButton();
            this.haptic('light');

        } catch (err) {
            console.error('Fetch error:', err);
            this.showState('error');
            this.haptic('error');
        } finally {
            this.state.isLoading = false;
        }
    }

    updateHeader(data) {
        const info = data.shabadInfo || {};
        const verse = data.verses[0] || {};

        // Ang
        this.$.angNumber.textContent = info.pageNo || verse.pageNo || '---';

        // Source
        const parts = [
            info.source?.english,
            info.raag?.english,
            info.writer?.english
        ].filter(Boolean);

        this.$.sourceInfo.textContent = parts.length
            ? parts.join(' • ')
            : 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ';
    }

    renderVerses() {
        const shabad = this.state.shabad;
        if (!shabad?.verses) return;

        const html = shabad.verses.map((v, i) => {
            let gurmukhi = v.verse?.unicode || '';
            if (this.config.larivaar) gurmukhi = gurmukhi.replace(/\s+/g, '');

            const translit = v.transliteration || '';
            const english = v.translation?.en?.bdb || v.translation?.en?.ms || '';
            const punjabi = v.translation?.pu?.bdb?.unicode || v.translation?.pu?.ss?.unicode || '';

            return `
                <div class="verse" style="animation-delay: ${i * 80}ms">
                    <p class="verse-gurmukhi${this.config.larivaar ? ' larivaar' : ''}">${gurmukhi}</p>
                    ${this.config.transliteration && translit ? `<p class="verse-transliteration">${translit}</p>` : ''}
                    ${this.config.english && english ? `<p class="verse-translation">${english}</p>` : ''}
                    ${this.config.punjabi && punjabi ? `<p class="verse-translation punjabi">${punjabi}</p>` : ''}
                </div>
            `;
        }).join('');

        this.$.versesContainer.innerHTML = html;
        this.$.versesContainer.scrollTop = 0;
    }

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════

    async copyShabad() {
        if (!this.state.shabad?.verses) return;
        this.haptic();

        const lines = this.state.shabad.verses.map(v => {
            let text = v.verse?.unicode || '';
            if (this.config.transliteration && v.transliteration) text += '\n' + v.transliteration;
            if (this.config.english) {
                const en = v.translation?.en?.bdb || v.translation?.en?.ms || '';
                if (en) text += '\n' + en;
            }
            return text;
        });

        const ang = this.state.shabad.shabadInfo?.pageNo || '';
        const full = `🙏 ਰੈਂਡਮ ਸ਼ਬਦ • Ang ${ang}\n\n${lines.join('\n\n')}\n\n— ANHAD`;

        try {
            await navigator.clipboard.writeText(full);
            this.toast('Copied!');
        } catch {
            this.toast('Copy failed');
        }
    }

    async shareShabad() {
        if (!this.state.shabad?.verses) return;
        this.haptic();

        const first = this.state.shabad.verses[0]?.verse?.unicode || '';
        const ang = this.state.shabad.shabadInfo?.pageNo || '';

        const shareData = {
            title: 'ਰੈਂਡਮ ਸ਼ਬਦ — ANHAD',
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
            this.toast('Removed');
        } else {
            // Get first verse data for favorites display
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
                source: 'Random Shabad',
                savedAt: Date.now()
            });
            this.toast('Saved!');
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
        this.haptic();
        this.syncToggles();
        this.$.sheetOverlay?.classList.add('visible');
        this.$.settingsSheet?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    closeSettings() {
        this.$.sheetOverlay?.classList.remove('visible');
        this.$.settingsSheet?.classList.remove('visible');
        document.body.style.overflow = '';
    }

    syncToggles() {
        this.setToggle(this.$.larivaarToggle, this.config.larivaar);
        this.setToggle(this.$.translitToggle, this.config.transliteration);
        this.setToggle(this.$.englishToggle, this.config.english);
        this.setToggle(this.$.punjabiToggle, this.config.punjabi);
        if (this.$.fontSlider) this.$.fontSlider.value = this.config.fontSize;
    }

    setToggle(el, active) {
        if (!el) return;
        el.classList.toggle('active', active);
        el.setAttribute('aria-checked', active);
    }

    // ═══════════════════════════════════════════════════════════════
    // THEME
    // ═══════════════════════════════════════════════════════════════

    toggleTheme() {
        this.haptic();
        this.config.theme = this.config.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveConfig();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.config.theme);
        const color = this.config.theme === 'dark' ? '#0a0a12' : '#f8f9fc';
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
        if (!navigator.vibrate) return;
        const patterns = { light: 8, medium: 15, heavy: 25, error: [20, 40, 20] };
        navigator.vibrate(patterns[type] || 8);
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

        // System preference
        if (!saved?.theme && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
            this.config.theme = 'light';
        }

        this.applyFontSize();
    }

    saveConfig() {
        this.save('anhad_shabad_config', this.config);
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    window.randomShabad = new RandomShabad();
    console.log('%c☬ ANHAD — Random Shabad', 'color: #D4A03A; font-size: 14px; font-weight: bold;');
});
