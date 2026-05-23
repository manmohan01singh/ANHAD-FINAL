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
    // DOM ELEMENTS - Lazy initialization to avoid race conditions
    // ═══════════════════════════════════════════════════════════════

    const getElements = () => ({
        // Match actual HTML IDs in nitnem/index.html
        loadingOverlay: document.getElementById('skeletonContainer') || document.getElementById('loadingOverlay'),
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
    });

    // Cache elements after DOM is ready
    let elements = {};

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

        // CRITICAL: Only run on nitnem page, not main index.html
        if (!window.location.pathname.includes('/nitnem/')) {
            console.log('[HubApp] Not on nitnem page, skipping initialization');
            return;
        }

        // CRITICAL: Initialize elements after DOM is ready
        elements = getElements();

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

        // Simple: Update greeting once more after everything settles
        setTimeout(updateGreeting, 1000);

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
        // Get fresh element reference each time
        const greetingEl = document.getElementById('greeting');
        if (greetingEl) {
            const html = `<span class="greeting-icon">${icon}</span><span class="greeting-text">${greeting}</span>`;
            greetingEl.innerHTML = html;
            console.log('[HubApp] Greeting updated successfully');
        } else {
            console.warn('[HubApp] Greeting element not found, will retry...');
        }
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
        const recentSection = document.getElementById('recentSection');
        const recentList = document.getElementById('recentList');
        
        if (!recentSection || !recentList) return;

        if (state.recentlyRead.length === 0) {
            recentSection.style.display = 'none';
            return;
        }

        recentSection.style.display = 'block';
        recentList.innerHTML = '';

        state.recentlyRead.slice(0, 5).forEach(bani => {
            const item = document.createElement('a');
            item.href = `reader.html?id=${bani.id}`;
            item.className = 'recent-item';
            item.innerHTML = `
                <span class="recent-name">${bani.nameGurmukhi || bani.nameEnglish}</span>
                <span class="recent-arrow">→</span>
            `;
            recentList.appendChild(item);
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
        const searchModal = document.getElementById('searchModal');
        const searchInput = document.getElementById('searchInput');
        
        if (searchModal) {
            searchModal.setAttribute('aria-hidden', 'false');
            searchModal.classList.add('visible');
        }
        if (searchInput) searchInput.focus();
        document.body.style.overflow = 'hidden';
        // Pause liquid glass orbs for performance
        document.querySelectorAll('.liquid-orb').forEach(orb => {
            orb.style.animationPlayState = 'paused';
        });
    }

    function closeSearch() {
        state.isSearchOpen = false;
        const searchModal = document.getElementById('searchModal');
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (searchModal) {
            searchModal.setAttribute('aria-hidden', 'true');
            searchModal.classList.remove('visible');
        }
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '<p class="search-hint">Search by name in Gurmukhi, English, or Hindi...</p>';
        document.body.style.overflow = '';
        // Resume liquid glass orbs
        document.querySelectorAll('.liquid-orb').forEach(orb => {
            orb.style.animationPlayState = '';
        });
    }

    function handleSearch(query) {
        const searchResults = document.getElementById('searchResults');
        
        if (!query || query.length < 2) {
            if (searchResults) searchResults.innerHTML = '<p class="search-hint">Type at least 2 characters...</p>';
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
            if (searchResults) searchResults.innerHTML = '<p class="search-hint">No Banis found matching your search.</p>';
            return;
        }

        if (searchResults) {
            searchResults.innerHTML = '';
            results.forEach(bani => {
                const card = createBaniCard(bani);
                card.addEventListener('click', closeSearch);
                searchResults.appendChild(card);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════

    function openSettings() {
        state.isSettingsOpen = true;
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.setAttribute('aria-hidden', 'false');
            settingsModal.classList.add('visible');
        }
        document.body.style.overflow = 'hidden';
        // Pause liquid glass orbs for performance
        document.querySelectorAll('.liquid-orb').forEach(orb => {
            orb.style.animationPlayState = 'paused';
        });
    }

    function closeSettings() {
        state.isSettingsOpen = false;
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.setAttribute('aria-hidden', 'true');
            settingsModal.classList.remove('visible');
        }
        document.body.style.overflow = '';
        // Resume liquid glass orbs
        document.querySelectorAll('.liquid-orb').forEach(orb => {
            orb.style.animationPlayState = '';
        });
    }

    function renderSettingsPanel() {
        const settingsBody = document.getElementById('settingsBody');
        if (!settingsBody) return;

        settingsBody.innerHTML = `
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
        settingsBody.querySelectorAll('.theme-btn').forEach(btn => {
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
        // Get fresh element references
        const els = getElements();
        
        // Search trigger opens modal
        els.searchTrigger?.addEventListener('click', openSearch);
        els.searchCancel?.addEventListener('click', closeSearch);
        els.searchInput?.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });
        els.searchModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeSearch);

        // Settings
        els.settingsBtn?.addEventListener('click', openSettings);
        els.settingsClose?.addEventListener('click', closeSettings);
        els.settingsModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeSettings);

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
        const loadingOverlay = document.getElementById('skeletonContainer') || document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            // Immediate hide to prevent persistent overlay
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
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

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    // SPA integration
    window.addEventListener('anhad_page_changed', function() {
        if (window.location.pathname.includes('/nitnem/')) {
            console.log('[HubApp] Re-initializing for SPA navigation...');
            init();
        }
    });
})();
