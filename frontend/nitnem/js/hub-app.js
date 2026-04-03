/**
 * Nitnem Hub Application
 * Main controller for the Bani Library Hub
 * @version 2.0.0
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // APPLICATION STATE
    // ═══════════════════════════════════════════════════════════════

    const state = {
        allBanis: [],
        recentlyRead: [],
        favorites: [],
        settings: {
            theme: 'light',
            viewMode: 'grid'
        },
        isSearchOpen: false,
        isSettingsOpen: false
    };

    // ═══════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ═══════════════════════════════════════════════════════════════

    const elements = {
        // Updated to match actual HTML element IDs
        loadingOverlay: document.getElementById('loadingOverlay'),
        greeting: document.getElementById('greeting'),
        searchTrigger: document.getElementById('searchTrigger'),
        settingsBtn: document.getElementById('settingsBtn'),
        searchModal: document.getElementById('searchModal'),
        searchInput: document.getElementById('searchInput'),
        searchResults: document.getElementById('searchResults'),
        searchCancel: document.getElementById('searchCancel'),
        settingsModal: document.getElementById('settingsModal'),
        settingsPanel: document.getElementById('settingsPanel'),
        settingsBody: document.getElementById('settingsBody'),
        settingsClose: document.getElementById('settingsClose'),
        recentSection: document.getElementById('recentSection'),
        recentList: document.getElementById('recentList')
    };

    // ═══════════════════════════════════════════════════════════════
    // BANI METADATA (Extended info not in API)
    // ═══════════════════════════════════════════════════════════════

    const baniMeta = {
        2: { author: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ', time: '20-25 min', source: 'sggs', featured: true },
        4: { author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ', time: '15-20 min', source: 'dasam', featured: true },
        6: { author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ', time: '3-5 min', source: 'dasam' },
        7: { author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ', time: '3-5 min', source: 'dasam' },
        9: { author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ', time: '5-7 min', source: 'dasam', featured: true },
        10: { author: 'ਗੁਰੂ ਅਮਰਦਾਸ ਜੀ', time: '15-20 min', source: 'sggs', featured: true },
        21: { author: 'ਸਮੂਹਿਕ', time: '20-25 min', source: 'sggs', featured: true },
        23: { author: 'ਸਮੂਹਿਕ', time: '5-7 min', source: 'sggs', featured: true },
        31: { author: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ', time: '90-120 min', source: 'sggs', featured: true },
        36: { author: 'ਸਮੂਹਿਕ', time: '25-30 min', source: 'sggs', featured: true },
        90: { author: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ', time: '45-60 min', source: 'sggs', featured: true }
    };

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    async function init() {
        console.log('🙏 Initializing Nitnem Hub...');

        // Load saved state
        loadState();

        // Set greeting immediately
        updateGreeting();

        // Apply theme
        applyTheme(state.settings.theme);

        // Setup event listeners
        setupEventListeners();

        // Load all Banis (for search)
        await loadBanis();

        // Render recently read
        renderRecentlyRead();

        // Initialize settings panel
        renderSettingsPanel();

        // Hide loading - IMMEDIATE to prevent persistent overlay
        hideLoadingScreen();

        // CRITICAL: Re-apply greeting after everything else loads
        setTimeout(updateGreeting, 500);
        setTimeout(updateGreeting, 1500);
        setTimeout(updateGreeting, 3000);

        // Start protecting greeting from overwrites
        protectGreeting();

        // AGGRESSIVE: Keep re-applying greeting every 500ms for 10 seconds
        let attempts = 0;
        const interval = setInterval(() => {
            updateGreeting();
            attempts++;
            if (attempts >= 20) clearInterval(interval);
        }, 500);

        console.log('✓ Nitnem Hub initialized');
    }

    // ═══════════════════════════════════════════════════════════════
    // GREETING BASED ON TIME
    // ═══════════════════════════════════════════════════════════════

    function updateGreeting() {
        const hour = new Date().getHours();
        console.log('[HubApp] Current hour:', hour, 'Updating greeting...');
        let greeting = '';
        let icon = '';

        if (hour < 6) {
            // Before 6 AM - 5 Banis Nitnem
            icon = '🙏';
            greeting = '5 ਬਾਣੀਆਂ ਦਾ ਨਿਤਨੇਮ ਜ਼ਰੂਰ ਕਰਿਓ • ਵਾਹਿਗੁਰੂ ਜੀ';
        } else if (hour >= 6 && hour < 18) {
            // 6 AM - 6 PM - Day time, Sukhmani Sahib
            icon = '🕊️';
            greeting = 'ਰੀਲਾਂ ਨੂੰ ਛੱਡ ਕੇ ਇੱਥੇ ਪਹੁੰਚ ਗਏ ਓ • ਸੁਖਮਨੀ ਸਾਹਿਬ ਦਾ ਜਾਪ ਕਰੋ';
        } else if (hour >= 18 && hour < 21) {
            // 6 PM - 9 PM - Rehras Sahib time
            icon = '🌆';
            greeting = 'ਰਹਿਰਾਸ ਸਾਹਿਬ ਜ਼ਰੂਰ ਕਰਿਓ • ਵਾਹਿਗੁਰੂ ਜੀ';
        } else {
            // 9 PM onwards - Sohila Sahib
            icon = '🌙';
            greeting = 'ਸੋਹਿਲਾ ਸਾਹਿਬ ਜ਼ਰੂਰ ਕਰਿਓ • ਵਾਹਿਗੁਰੂ ਜੀ';
        }

        console.log('[HubApp] Setting greeting:', greeting);
        // Re-query element each time to avoid stale reference
        const greetingEl = document.getElementById('greeting');
        if (greetingEl) {
            const html = `<span class="greeting-icon">${icon}</span><span class="greeting-text">${greeting}</span>`;
            greetingEl.innerHTML = html;
            // Store current greeting to detect changes
            greetingEl.dataset.expectedHtml = html;
            console.log('[HubApp] Greeting element updated:', greetingEl.id, greetingEl.className);
            // DEBUG: Check what's actually in the DOM after setting
            setTimeout(() => {
                const checkEl = document.getElementById('greeting');
                if (checkEl) {
                    const actualText = checkEl.textContent;
                    const expectedText = icon + greeting;
                    console.log('[HubApp] DEBUG - Expected:', expectedText);
                    console.log('[HubApp] DEBUG - Actual:', actualText);
                    console.log('[HubApp] DEBUG - Match:', actualText === expectedText);
                    console.log('[HubApp] DEBUG - innerHTML:', checkEl.innerHTML.substring(0, 100));
                }
            }, 100);
        } else {
            console.error('[HubApp] Greeting element NOT FOUND!');
        }
    }

    // Protect greeting from being overwritten by other scripts
    function protectGreeting() {
        if (!elements.greeting) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const expected = elements.greeting.dataset.expectedHtml;
                    if (expected && elements.greeting.innerHTML !== expected) {
                        console.log('[HubApp] Greeting was overwritten! Re-applying...');
                        updateGreeting();
                    }
                }
            });
        });
        
        observer.observe(elements.greeting, {
            childList: true,
            characterData: true,
            subtree: true
        });
        
        console.log('[HubApp] Greeting protected from overwrites');
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD BANIS FROM API
    // ═══════════════════════════════════════════════════════════════

    async function loadBanis() {
        try {
            const banis = await BaniDB.getAllBanis();
            state.allBanis = banis.map(b => BaniDB.formatBaniInfo(b));
            console.log(`Loaded ${state.allBanis.length} Banis for search`);
        } catch (error) {
            console.error('Failed to load Banis:', error);
            showError('Could not load Banis. Please check your connection.');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER BANI CARD
    // ═══════════════════════════════════════════════════════════════

    function createBaniCard(bani, options = {}) {
        const meta = baniMeta[bani.id] || {};
        const card = document.createElement('a');
        card.href = `reader.html?id=${bani.id}`;
        card.className = `bani-card${options.featured ? ' bani-card--featured' : ''}`;
        card.dataset.baniId = bani.id;

        card.innerHTML = `
      <div class="bani-card__header">
        <h3 class="bani-card__title">${bani.nameGurmukhi || bani.nameEnglish}</h3>
        ${meta.featured ? '<span class="bani-card__badge">Featured</span>' : ''}
      </div>
      <p class="bani-card__english">${bani.nameEnglish}</p>
      <div class="bani-card__meta">
        ${meta.author ? `<span class="bani-card__meta-item">${meta.author}</span>` : ''}
        ${meta.time ? `<span class="bani-card__meta-item">⏱ ${meta.time}</span>` : ''}
      </div>
    `;

        // Track click for recently read
        card.addEventListener('click', (e) => {
            addToRecentlyRead(bani);
        });

        return card;
    }

    // ═══════════════════════════════════════════════════════════════
    // RENDER SECTIONS
    // ═══════════════════════════════════════════════════════════════

    function renderFeatured() {
        if (!elements.featuredGrid) return;
        elements.featuredGrid.innerHTML = '';

        const featuredIds = [2, 31, 36, 21, 23, 90];
        const featured = state.allBanis.filter(b => featuredIds.includes(b.id));

        featured.slice(0, 6).forEach(bani => {
            elements.featuredGrid.appendChild(createBaniCard(bani, { featured: true }));
        });
    }

    function renderNitnem() {
        if (!elements.nitnemBanis) return;
        elements.nitnemBanis.innerHTML = '';

        const nitnemIds = [2, 4, 6, 7, 9, 10, 21, 23];
        const nitnem = state.allBanis.filter(b => nitnemIds.includes(b.id));

        // Sort in order
        nitnem.sort((a, b) => nitnemIds.indexOf(a.id) - nitnemIds.indexOf(b.id));

        nitnem.forEach(bani => {
            elements.nitnemBanis.appendChild(createBaniCard(bani));
        });
    }

    function renderSGGS() {
        if (!elements.sggsBanis) return;
        elements.sggsBanis.innerHTML = '';

        const sggsIds = [2, 3, 10, 27, 30, 31, 33, 34, 35, 36];
        const sggs = state.allBanis.filter(b => sggsIds.includes(b.id));

        sggs.slice(0, 8).forEach(bani => {
            elements.sggsBanis.appendChild(createBaniCard(bani));
        });
    }

    function renderDasam() {
        if (!elements.dasamBanis) return;
        elements.dasamBanis.innerHTML = '';

        const dasamIds = [4, 5, 6, 7, 8, 9, 12, 13, 19, 28, 29, 53];
        const dasam = state.allBanis.filter(b => dasamIds.includes(b.id));

        dasam.slice(0, 8).forEach(bani => {
            elements.dasamBanis.appendChild(createBaniCard(bani));
        });
    }

    function renderAllBanis() {
        if (!elements.allBanisGrid) return;
        elements.allBanisGrid.innerHTML = '';

        state.allBanis.forEach(bani => {
            elements.allBanisGrid.appendChild(createBaniCard(bani));
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // RECENTLY READ
    // ═══════════════════════════════════════════════════════════════

    function addToRecentlyRead(bani) {
        // Remove if already exists
        state.recentlyRead = state.recentlyRead.filter(b => b.id !== bani.id);

        // Add to front
        state.recentlyRead.unshift({
            ...bani,
            timestamp: Date.now()
        });

        // Keep only last 10
        state.recentlyRead = state.recentlyRead.slice(0, 10);

        saveState();
    }

    function renderRecentlyRead() {
        if (!elements.recentSection || !elements.recentList) return;

        if (state.recentlyRead.length === 0) {
            elements.recentSection.style.display = 'none';
            return;
        }

        elements.recentSection.style.display = 'block';
        elements.recentList.innerHTML = '';

        state.recentlyRead.slice(0, 5).forEach(bani => {
            const item = document.createElement('a');
            item.href = `reader.html?id=${bani.id}`;
            item.className = 'recent-item';
            item.innerHTML = `
                <span class="recent-name">${bani.nameGurmukhi || bani.nameEnglish}</span>
                <span class="recent-arrow">→</span>
            `;
            elements.recentList.appendChild(item);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════════════════

    function renderStats() {
        // Get data from unified storage if available
        try {
            const nitnemData = JSON.parse(localStorage.getItem('nitnemTracker_history') || '{}');
            const today = new Date().toLocaleDateString('en-CA');

            // Completed today
            const todayData = nitnemData[today] || {};
            const completedToday = Object.values(todayData).filter(v => v === true).length;
            if (elements.completedToday) {
                elements.completedToday.textContent = completedToday;
            }

            // Calculate streak
            let streak = 0;
            const dates = Object.keys(nitnemData).sort().reverse();
            for (const date of dates) {
                const dayData = nitnemData[date] || {};
                const completed = Object.values(dayData).filter(v => v === true).length;
                if (completed > 0) {
                    streak++;
                } else {
                    break;
                }
            }
            if (elements.readStreak) {
                elements.readStreak.textContent = streak;
            }
        } catch (e) {
            console.warn('Could not load stats:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════════════════════════

    function openSearch() {
        state.isSearchOpen = true;
        elements.searchModal.setAttribute('aria-hidden', 'false');
        elements.searchInput.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeSearch() {
        state.isSearchOpen = false;
        elements.searchModal.setAttribute('aria-hidden', 'true');
        elements.searchInput.value = '';
        elements.searchResults.innerHTML = '<p class="search-hint">Search by name in Gurmukhi, English, or Hindi...</p>';
        document.body.style.overflow = '';
    }

    function handleSearch(query) {
        if (!query || query.length < 2) {
            elements.searchResults.innerHTML = '<p class="search-hint">Type at least 2 characters...</p>';
            return;
        }

        const queryLower = query.toLowerCase();

        const results = state.allBanis.filter(bani => {
            return (
                bani.nameGurmukhi?.includes(query) ||
                bani.nameEnglish?.toLowerCase().includes(queryLower) ||
                bani.nameHindi?.includes(query)
            );
        });

        if (results.length === 0) {
            elements.searchResults.innerHTML = '<p class="search-hint">No Banis found matching your search.</p>';
            return;
        }

        elements.searchResults.innerHTML = '';
        results.forEach(bani => {
            const card = createBaniCard(bani);
            card.addEventListener('click', closeSearch);
            elements.searchResults.appendChild(card);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════

    function openSettings() {
        state.isSettingsOpen = true;
        elements.settingsModal?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeSettings() {
        state.isSettingsOpen = false;
        elements.settingsModal?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function renderSettingsPanel() {
        if (!elements.settingsBody) return;

        elements.settingsBody.innerHTML = `
      <div class="setting-group">
        <label class="setting-label">Theme</label>
        <div class="theme-grid">
          <button class="theme-btn ${state.settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
            🌙 Dark
          </button>
          <button class="theme-btn ${state.settings.theme === 'light' ? 'active' : ''}" data-theme="light">
            ☀️ Light
          </button>
          <button class="theme-btn ${state.settings.theme === 'sepia' ? 'active' : ''}" data-theme="sepia">
            📜 Sepia
          </button>
          <button class="theme-btn ${state.settings.theme === 'amoled' ? 'active' : ''}" data-theme="amoled">
            ⬛ AMOLED
          </button>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">Data Management</label>
        <button class="setting-btn" id="clearCacheBtn">
          🗑️ Clear Cache
        </button>
        <button class="setting-btn" id="preCacheBtn">
          ⬇️ Download Popular Banis for Offline
        </button>
      </div>
      
      <div class="setting-group">
        <p class="setting-info">Gurbani content from BaniDB.com</p>
      </div>
    `;

        // Theme buttons
        elements.settingsBody.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                state.settings.theme = theme;
                applyTheme(theme);
                saveState();
                renderSettingsPanel();
            });
        });

        // Clear cache
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                BaniDB.clearCache();
                alert('Cache cleared successfully!');
            });
        }

        // Pre-cache
        const preCacheBtn = document.getElementById('preCacheBtn');
        if (preCacheBtn) {
            preCacheBtn.addEventListener('click', async () => {
                preCacheBtn.disabled = true;
                preCacheBtn.textContent = '⏳ Downloading...';

                try {
                    const count = await BaniDB.preCachePopularBanis((loaded, total) => {
                        preCacheBtn.textContent = `⏳ Downloading ${loaded}/${total}...`;
                    });
                    preCacheBtn.textContent = `✓ ${count} Banis saved for offline`;
                } catch (e) {
                    preCacheBtn.textContent = '❌ Download failed';
                }

                setTimeout(() => {
                    preCacheBtn.textContent = '⬇️ Download Popular Banis for Offline';
                    preCacheBtn.disabled = false;
                }, 3000);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // THEME
    // ═══════════════════════════════════════════════════════════════

    function applyTheme(theme) {
        // Use data-theme attribute only (light is default in CSS)
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            const colors = {
                dark: '#0A0A0F',
                light: '#F8F9FA',
                sepia: '#F4ECD8',
                amoled: '#000000'
            };
            metaTheme.content = colors[theme] || colors.light; // Default to light
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE PERSISTENCE
    // ═══════════════════════════════════════════════════════════════

    function saveState() {
        try {
            localStorage.setItem('nitnemHub_state', JSON.stringify({
                recentlyRead: state.recentlyRead,
                favorites: state.favorites,
                settings: state.settings
            }));
            // Save to nitnem-specific theme key for independent theme control
            localStorage.setItem('anhad_nitnem_theme', state.settings.theme);
        } catch (e) {
            console.warn('Could not save state:', e);
        }
    }

    function loadState() {
        try {
            // ONLY use nitnem-specific theme key - NO fallback to global
            // This ensures nitnem page always has its own theme independent of main app
            const nitnemTheme = localStorage.getItem('anhad_nitnem_theme');
            
            if (nitnemTheme) {
                state.settings.theme = nitnemTheme;
            }
            // If no nitnem theme set, default to 'light' (already set in state default)
            
            // Then load from hub-specific state
            const saved = localStorage.getItem('nitnemHub_state');
            if (saved) {
                const data = JSON.parse(saved);
                state.recentlyRead = data.recentlyRead || [];
                state.favorites = data.favorites || [];
                // Only use saved settings if no nitnem theme was explicitly set
                if (!nitnemTheme && data.settings) {
                    state.settings = { ...state.settings, ...data.settings };
                }
            }
        } catch (e) {
            console.warn('Could not load state:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // QUICK ACTIONS
    // ═══════════════════════════════════════════════════════════════

    function handleQuickAction(action) {
        switch (action) {
            case 'morning-nitnem':
                window.location.href = 'reader.html?collection=morning';
                break;
            case 'evening-nitnem':
                window.location.href = 'reader.html?id=21';
                break;
            case 'night-nitnem':
                window.location.href = 'reader.html?id=23';
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════

    function setupEventListeners() {
        // Search trigger opens modal
        elements.searchTrigger?.addEventListener('click', openSearch);
        elements.searchCancel?.addEventListener('click', closeSearch);
        elements.searchInput?.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });
        elements.searchModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeSearch);

        // Settings
        elements.settingsBtn?.addEventListener('click', openSettings);
        elements.settingsClose?.addEventListener('click', closeSettings);
        elements.settingsModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeSettings);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (state.isSearchOpen) closeSearch();
                if (state.isSettingsOpen) closeSettings();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════

    function hideLoadingScreen() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('hidden');
            // Immediate hide to prevent persistent overlay
            setTimeout(() => {
                elements.loadingOverlay.style.display = 'none';
            }, 300);
        }
    }

    function showError(message) {
        console.error(message);
        // Could show a toast notification here
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════

    document.addEventListener('DOMContentLoaded', init);
})();
