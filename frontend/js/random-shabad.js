/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RANDOM SHABAD MANAGER - iOS 18+ EXPERIENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Premium Random Shabad feature with BaniDB API integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class RandomShabadManager {
    constructor() {
        this.overlay = document.getElementById('shabadOverlay');
        this.container = document.getElementById('shabadContainer');
        this.loadingState = document.getElementById('shabadLoading');
        this.errorState = document.getElementById('shabadError');
        this.contentArea = document.getElementById('shabadContent');
        this.gurmukhiContainer = document.getElementById('shabadGurmukhi');
        this.angBadge = document.getElementById('shabadAngNumber');
        this.sourceInfo = document.getElementById('shabadSource');

        // Settings
        this.settings = {
            larivaar: false,
            transliteration: true,
            english: true,
            punjabi: false
        };

        // Current shabad data
        this.currentShabad = null;
        this.bookmarks = this.loadBookmarks();

        // Bind events
        this.bindEvents();
        this.loadSettings();
    }

    bindEvents() {
        // Close button
        document.getElementById('shabadClose')?.addEventListener('click', () => this.close());

        // Backdrop click
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay || e.target.classList.contains('shabad-backdrop-blur')) {
                this.close();
            }
        });

        // Action buttons
        document.getElementById('newShabadBtn')?.addEventListener('click', () => this.loadShabad());
        document.getElementById('copyShabadBtn')?.addEventListener('click', () => this.copyShabad());
        document.getElementById('shareShabadBtn')?.addEventListener('click', () => this.shareShabad());
        document.getElementById('bookmarkShabadBtn')?.addEventListener('click', () => this.toggleBookmark());
        document.getElementById('shabadRetryBtn')?.addEventListener('click', () => this.loadShabad());

        // Settings
        document.getElementById('shabadSettingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('shabadSettingsClose')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('shabadSettingsBackdrop')?.addEventListener('click', () => this.closeSettings());

        // Settings toggles
        document.getElementById('toggleShabadLarivaar')?.addEventListener('change', (e) => {
            this.settings.larivaar = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });
        document.getElementById('toggleShabadTranslit')?.addEventListener('change', (e) => {
            this.settings.transliteration = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });
        document.getElementById('toggleShabadEnglish')?.addEventListener('change', (e) => {
            this.settings.english = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });
        document.getElementById('toggleShabadPunjabi')?.addEventListener('change', (e) => {
            this.settings.punjabi = e.target.checked;
            this.saveSettings();
            this.renderCurrentShabad();
        });

        // Keyboard escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
                this.close();
            }
        });

        // Swipe to close
        this.setupSwipeGesture();
    }

    setupSwipeGesture() {
        if (!this.container) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        this.container.addEventListener('touchstart', (e) => {
            if (e.target.closest('.shabad-scroll-container')) return;
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        this.container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0) {
                this.container.style.transform = `translateY(${Math.min(diff, 200)}px) scale(${1 - diff * 0.0005})`;
                this.container.style.opacity = 1 - diff * 0.002;
            }
        }, { passive: true });

        this.container.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;

            const diff = currentY - startY;
            if (diff > 100) {
                this.close();
            } else {
                this.container.style.transform = '';
                this.container.style.opacity = '';
            }
            startY = 0;
            currentY = 0;
        });
    }

    open() {
        this.overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.loadShabad();
    }

    close() {
        this.overlay?.classList.remove('active');
        document.body.style.overflow = '';

        // Reset container transform
        if (this.container) {
            this.container.style.transform = '';
            this.container.style.opacity = '';
        }
    }

    async loadShabad() {
        this.showLoading();

        try {
            // Use BaniDB API for random shabad
            const randomId = Math.floor(Math.random() * 60403) + 1;
            const response = await fetch(`https://api.banidb.com/v2/shabads/${randomId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch shabad');
            }

            const data = await response.json();

            if (!data || !data.verses || data.verses.length === 0) {
                throw new Error('No shabad found');
            }

            this.currentShabad = data;
            this.renderShabad(data);
            this.showContent();

        } catch (error) {
            console.error('Error loading shabad:', error);
            this.showError();
        }
    }

    renderShabad(data) {
        if (!this.gurmukhiContainer) return;

        const verses = data.verses || [];
        const shabadInfo = data.shabadInfo || {};

        // Update Ang number
        if (this.angBadge) {
            const angValue = this.angBadge.querySelector('.ang-value');
            if (angValue) {
                angValue.textContent = shabadInfo.pageNo || verses[0]?.pageNo || '---';
            }
        }

        // Update source info
        if (this.sourceInfo) {
            const sourceName = shabadInfo.source?.gurmukhi || verses[0]?.source?.gurmukhi || '';
            const writer = shabadInfo.writer?.gurmukhi || verses[0]?.writer?.gurmukhi || '';
            this.sourceInfo.innerHTML = `
                ${sourceName ? `<span>${sourceName}</span>` : ''}
                ${writer ? `<span> • ${writer}</span>` : ''}
            `;
        }

        // Render lines
        this.gurmukhiContainer.innerHTML = verses.map(verse => {
            const gurmukhi = this.settings.larivaar
                ? (verse.verse?.unicode || '').replace(/\s+/g, '')
                : (verse.verse?.unicode || '');

            const transliteration = verse.transliteration || '';
            const englishTranslation = verse.translation?.en?.bdb || verse.translation?.en?.ms || '';
            const punjabiTranslation = verse.translation?.pu?.bdb?.unicode || verse.translation?.pu?.ss?.unicode || '';

            return `
                <div class="shabad-line">
                    <div class="shabad-gurmukhi">${gurmukhi || 'ੴ'}</div>
                    ${this.settings.transliteration && transliteration ?
                    `<div class="shabad-transliteration">${transliteration}</div>` : ''}
                    ${this.settings.english && englishTranslation ?
                    `<div class="shabad-translation">${englishTranslation}</div>` : ''}
                    ${this.settings.punjabi && punjabiTranslation ?
                    `<div class="shabad-translation punjabi">${punjabiTranslation}</div>` : ''}
                </div>
            `;
        }).join('');

        // Update bookmark button state
        this.updateBookmarkButton();
    }

    renderCurrentShabad() {
        if (this.currentShabad) {
            this.renderShabad(this.currentShabad);
        }
    }

    showLoading() {
        if (this.loadingState) this.loadingState.style.display = 'flex';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.contentArea) this.contentArea.style.display = 'none';
    }

    showContent() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.contentArea) this.contentArea.style.display = 'flex';
    }

    showError() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'flex';
        if (this.contentArea) this.contentArea.style.display = 'none';
    }

    async copyShabad() {
        if (!this.currentShabad) return;

        const verses = this.currentShabad.verses || [];
        const text = verses.map(v => {
            let line = v.verse?.unicode || '';
            if (this.settings.transliteration && v.transliteration) {
                line += '\n' + v.transliteration;
            }
            if (this.settings.english) {
                const translation = v.translation?.en?.bdb || v.translation?.en?.ms || '';
                if (translation) line += '\n' + translation;
            }
            return line;
        }).join('\n\n');

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Shabad copied!', 'success');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Failed to copy');
        }
    }

    async shareShabad() {
        if (!this.currentShabad) return;

        const verses = this.currentShabad.verses || [];
        const firstLine = verses[0]?.verse?.unicode || 'Random Shabad';
        const ang = this.currentShabad.shabadInfo?.pageNo || verses[0]?.pageNo || '';

        const shareData = {
            title: 'Random Shabad',
            text: `${firstLine}\n\nAng ${ang} - Sri Guru Granth Sahib Ji\n\nShared via Gurbani Radio`,
            url: window.location.origin
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.showToast('Shared!', 'success');
            } else {
                await navigator.clipboard.writeText(shareData.text);
                this.showToast('Copied to clipboard!', 'success');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    }

    toggleBookmark() {
        if (!this.currentShabad) return;

        const shabadId = this.currentShabad.shabadInfo?.shabadId ||
            this.currentShabad.verses?.[0]?.shabadId;

        if (!shabadId) return;

        const index = this.bookmarks.findIndex(b => b.id === shabadId);

        if (index > -1) {
            this.bookmarks.splice(index, 1);
            this.showToast('Bookmark removed');
        } else {
            this.bookmarks.push({
                id: shabadId,
                ang: this.currentShabad.shabadInfo?.pageNo || this.currentShabad.verses?.[0]?.pageNo,
                firstLine: this.currentShabad.verses?.[0]?.verse?.unicode || '',
                timestamp: Date.now()
            });
            this.showToast('Shabad bookmarked!', 'success');
        }

        this.saveBookmarks();
        this.updateBookmarkButton();
    }

    updateBookmarkButton() {
        const btn = document.getElementById('bookmarkShabadBtn');
        if (!btn || !this.currentShabad) return;

        const shabadId = this.currentShabad.shabadInfo?.shabadId ||
            this.currentShabad.verses?.[0]?.shabadId;

        const isBookmarked = this.bookmarks.some(b => b.id === shabadId);

        btn.classList.toggle('bookmarked', isBookmarked);

        const icon = btn.querySelector('.action-icon svg');
        if (icon) {
            icon.style.fill = isBookmarked ? 'currentColor' : 'none';
        }
    }

    loadBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('gurbani_shabad_bookmarks') || '[]');
        } catch {
            return [];
        }
    }

    saveBookmarks() {
        try {
            localStorage.setItem('gurbani_shabad_bookmarks', JSON.stringify(this.bookmarks));
        } catch (err) {
            console.error('Failed to save bookmarks:', err);
        }
    }

    openSettings() {
        document.getElementById('shabadSettingsBackdrop')?.classList.add('visible');
        document.getElementById('shabadSettingsSheet')?.classList.add('visible');

        // Sync toggles with current settings
        const larivaar = document.getElementById('toggleShabadLarivaar');
        const translit = document.getElementById('toggleShabadTranslit');
        const english = document.getElementById('toggleShabadEnglish');
        const punjabi = document.getElementById('toggleShabadPunjabi');

        if (larivaar) larivaar.checked = this.settings.larivaar;
        if (translit) translit.checked = this.settings.transliteration;
        if (english) english.checked = this.settings.english;
        if (punjabi) punjabi.checked = this.settings.punjabi;
    }

    closeSettings() {
        document.getElementById('shabadSettingsBackdrop')?.classList.remove('visible');
        document.getElementById('shabadSettingsSheet')?.classList.remove('visible');
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('gurbani_shabad_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('gurbani_shabad_settings', JSON.stringify(this.settings));
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        document.querySelector('.shabad-toast')?.remove();

        const toast = document.createElement('div');
        toast.className = `shabad-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 2500);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

let randomShabadManager;

document.addEventListener('DOMContentLoaded', () => {
    randomShabadManager = new RandomShabadManager();

    // Expose global functions for onclick handlers
    window.openRandomShabad = () => randomShabadManager.open();
    window.closeRandomShabad = () => randomShabadManager.close();
});

// Global access
window.RandomShabadManager = RandomShabadManager;
