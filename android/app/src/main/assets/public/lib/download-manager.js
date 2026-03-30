/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DOWNLOAD MANAGER — Background Gurbani Data Hydration
 * Auto-downloads ALL 1430 Angs + Banis silently in the background
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Strategy:
 *   • Starts automatically when app is used
 *   • Downloads in small batches (10 Angs at a time) 
 *   • Respects API rate limits (200ms delay between batches)
 *   • Can be paused/resumed
 *   • Resumes from where it left off (even across app restarts)
 *   • Shows optional progress UI
 *   • Does NOT block the user — runs entirely in background
 * 
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class GurbaniDownloadManager {
    static BATCH_SIZE = 10;
    static BATCH_DELAY_MS = 300;
    static API_BASE = 'https://api.banidb.com/v2';
    static TOTAL_ANGS = 1430;

    // Popular Bani IDs from bani-catalog.json
    static BANI_IDS = [
        2, 4, 6, 7, 9, 10, 21, 23, 24, 22, 25, 26, 30, 31, 33, 34, 36, 27,
        3, 5, 8, 11, 12, 13, 19, 28, 29, 38, 39, 46, 53, 35, 77, 78,
        86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
        100, 101, 102, 103, 104, 105, 106, 107,
        55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76
    ];

    constructor() {
        this.db = new GurbaniDB();
        this._isRunning = false;
        this._isPaused = false;
        this._isCancelled = false;
        this._currentAng = 0;
        this._progress = { angs: 0, banis: 0, phase: 'idle', percent: 0 };
        this._listeners = [];
        this._uiElement = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    /**
     * Start background download — called automatically by the app
     */
    async start() {
        if (this._isRunning) {
            console.log('⏳ Download already running');
            return;
        }

        // Check if already fully hydrated
        const status = await this.db.getHydrationStatus();
        if (status.isFullyHydrated && status.banisDownloaded >= 30) {
            console.log('✅ Gurbani data already fully downloaded');
            this._emit('complete', status);
            return;
        }

        this._isRunning = true;
        this._isPaused = false;
        this._isCancelled = false;

        console.log('🚀 GurbaniDownload: Starting background download...');
        this._showProgressUI();
        this._emit('start', { existing: status });

        try {
            // Phase 1: Download priority Banis first (Nitnem banis for immediate use)
            await this._downloadPriorityBanis();

            // Phase 2: Download all 1430 Angs
            await this._downloadAllAngs(status.angsDownloaded);

            // Phase 3: Download remaining Banis
            await this._downloadAllBanis();

            // Mark complete
            await this.db.setHydrationMeta('hydration_status', {
                status: 'complete',
                lastSyncAt: Date.now(),
                totalAngs: GurbaniDownloadManager.TOTAL_ANGS,
                totalBanis: GurbaniDownloadManager.BANI_IDS.length
            });

            const finalStatus = await this.db.getHydrationStatus();
            console.log('✅ GurbaniDownload: Complete!', finalStatus);
            this._emit('complete', finalStatus);
            this._hideProgressUI();

        } catch (error) {
            if (this._isCancelled) {
                console.log('⏸️ GurbaniDownload: Cancelled by user');
                this._emit('cancelled');
            } else {
                console.error('❌ GurbaniDownload: Error:', error);
                this._emit('error', error);

                // Save progress so we can resume
                await this.db.setHydrationMeta('hydration_status', {
                    status: 'paused',
                    lastAngDownloaded: this._currentAng,
                    lastSyncAt: Date.now(),
                    error: error.message
                });
            }
            this._hideProgressUI();
        } finally {
            this._isRunning = false;
        }
    }

    /**
     * Pause the download
     */
    pause() {
        this._isPaused = true;
        this._emit('paused', this._progress);
    }

    /**
     * Resume a paused download
     */
    resume() {
        this._isPaused = false;
        this._emit('resumed', this._progress);
    }

    /**
     * Cancel the download
     */
    cancel() {
        this._isCancelled = true;
        this._isRunning = false;
    }

    /**
     * Listen for progress events
     */
    onProgress(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(l => l !== callback);
        };
    }

    /**
     * Get current progress
     */
    getProgress() {
        return { ...this._progress };
    }

    /**
     * Check if running
     */
    get isRunning() {
        return this._isRunning;
    }

    // ═══════════════════════════════════════════════════════════════
    // DOWNLOAD PHASES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Phase 1: Download priority Banis (Nitnem) first
     */
    async _downloadPriorityBanis() {
        const priorityIds = [2, 4, 6, 7, 9, 10, 21, 23]; // Core Nitnem
        this._progress.phase = 'priority_banis';

        for (const id of priorityIds) {
            if (this._isCancelled) throw new Error('Cancelled');
            await this._waitWhilePaused();

            try {
                // Check if already cached
                const existing = await this.db._get('banis', id);
                if (existing) continue;

                const data = await this._fetchJSON(`/banis/${id}`);
                await this.db._put('banis', { id, data, downloadedAt: Date.now() });
                this._progress.banis++;
                this._emit('progress', this._progress);
            } catch (e) {
                console.warn(`Failed to download Bani ${id}:`, e.message);
            }

            await this._delay(200);
        }
    }

    /**
     * Phase 2: Download all 1430 Angs in batches
     */
    async _downloadAllAngs(startFrom) {
        this._progress.phase = 'angs';
        this._currentAng = startFrom || 0;

        // Find which Angs we already have
        const existingAngs = new Set();
        try {
            const allAngs = await this.db._getAll('angs');
            allAngs.forEach(a => existingAngs.add(a.angNumber));
        } catch (e) {
            // Ignore
        }

        // Build list of Angs to download
        const toDownload = [];
        for (let i = 1; i <= GurbaniDownloadManager.TOTAL_ANGS; i++) {
            if (!existingAngs.has(i)) toDownload.push(i);
        }

        if (toDownload.length === 0) {
            console.log('✅ All Angs already downloaded');
            this._progress.angs = GurbaniDownloadManager.TOTAL_ANGS;
            this._emit('progress', this._progress);
            return;
        }

        console.log(`📥 Downloading ${toDownload.length} remaining Angs...`);

        // Download in batches
        for (let i = 0; i < toDownload.length; i += GurbaniDownloadManager.BATCH_SIZE) {
            if (this._isCancelled) throw new Error('Cancelled');
            await this._waitWhilePaused();

            const batch = toDownload.slice(i, i + GurbaniDownloadManager.BATCH_SIZE);

            // Fetch batch in parallel
            const results = await Promise.allSettled(
                batch.map(angNum => this._downloadAng(angNum))
            );

            // Count successes
            const successes = results.filter(r => r.status === 'fulfilled').length;
            this._progress.angs = existingAngs.size + i + successes;
            this._progress.percent = ((this._progress.angs / GurbaniDownloadManager.TOTAL_ANGS) * 100).toFixed(1);
            this._currentAng = batch[batch.length - 1];

            this._emit('progress', { ...this._progress });
            this._updateProgressUI();

            // Rate limit delay
            await this._delay(GurbaniDownloadManager.BATCH_DELAY_MS);
        }
    }

    /**
     * Download a single Ang and store it
     */
    async _downloadAng(angNumber) {
        const data = await this._fetchJSON(`/angs/${angNumber}`);
        const formatted = this.db._formatAngData(data, angNumber);
        await this.db._put('angs', formatted);

        // Index for search (fire and forget)
        this.db._indexAngForSearch(formatted).catch(() => {});

        return formatted;
    }

    /**
     * Phase 3: Download all Banis
     */
    async _downloadAllBanis() {
        this._progress.phase = 'banis';

        for (const id of GurbaniDownloadManager.BANI_IDS) {
            if (this._isCancelled) throw new Error('Cancelled');
            await this._waitWhilePaused();

            try {
                const existing = await this.db._get('banis', id);
                if (existing) {
                    this._progress.banis++;
                    continue;
                }

                const data = await this._fetchJSON(`/banis/${id}`);
                await this.db._put('banis', { id, data, downloadedAt: Date.now() });
                this._progress.banis++;
                this._emit('progress', this._progress);
            } catch (e) {
                console.warn(`Failed to download Bani ${id}:`, e.message);
            }

            await this._delay(200);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROGRESS UI — Floating Minimal Indicator
    // ═══════════════════════════════════════════════════════════════

    _showProgressUI() {
        // Don't create if already exists
        if (document.getElementById('gurbaniDownloadProgress')) return;

        const container = document.createElement('div');
        container.id = 'gurbaniDownloadProgress';
        container.innerHTML = `
            <div class="gdp-inner">
                <div class="gdp-ring">
                    <svg viewBox="0 0 36 36">
                        <path class="gdp-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        <path class="gdp-ring-fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke-dasharray="0, 100"/>
                    </svg>
                    <span class="gdp-icon">☬</span>
                </div>
                <div class="gdp-text">
                    <span class="gdp-title">Downloading Bani</span>
                    <span class="gdp-detail">Preparing...</span>
                </div>
                <button class="gdp-close" onclick="this.closest('#gurbaniDownloadProgress').style.display='none'" aria-label="Hide">×</button>
            </div>
        `;
        document.body.appendChild(container);
        this._uiElement = container;

        // Inject styles if not already present
        if (!document.getElementById('gurbaniDownloadCSS')) {
            const style = document.createElement('link');
            style.id = 'gurbaniDownloadCSS';
            style.rel = 'stylesheet';
            
            // Dynamically resolve CSS path based on where download-manager.js was loaded from
            const scriptTag = document.querySelector('script[src*="download-manager.js"]');
            style.href = scriptTag ? scriptTag.src.replace('download-manager.js', 'download-ui.css') : '../lib/download-ui.css';
            
            document.head.appendChild(style);
        }
    }

    _updateProgressUI() {
        const el = this._uiElement || document.getElementById('gurbaniDownloadProgress');
        if (!el) return;

        const fill = el.querySelector('.gdp-ring-fill');
        const detail = el.querySelector('.gdp-detail');
        const percent = parseFloat(this._progress.percent) || 0;

        if (fill) fill.setAttribute('stroke-dasharray', `${percent}, 100`);
        if (detail) {
            if (this._progress.phase === 'angs') {
                detail.textContent = `ਅੰਗ ${this._progress.angs}/${GurbaniDownloadManager.TOTAL_ANGS}`;
            } else if (this._progress.phase === 'banis') {
                detail.textContent = `ਬਾਣੀ ${this._progress.banis}/${GurbaniDownloadManager.BANI_IDS.length}`;
            } else if (this._progress.phase === 'priority_banis') {
                detail.textContent = 'ਨਿਤਨੇਮ ਬਾਣੀਆਂ...';
            }
        }
    }

    _hideProgressUI() {
        const el = this._uiElement || document.getElementById('gurbaniDownloadProgress');
        if (el) {
            el.classList.add('gdp-complete');
            const detail = el.querySelector('.gdp-detail');
            const icon = el.querySelector('.gdp-icon');
            if (detail) detail.textContent = 'Complete ✓';
            if (icon) icon.textContent = '✓';
            setTimeout(() => el.remove(), 4000);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════

    _emit(event, data) {
        this._listeners.forEach(fn => {
            try { fn(event, data); } catch (e) { /* ignore */ }
        });
    }

    _delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async _waitWhilePaused() {
        while (this._isPaused && !this._isCancelled) {
            await this._delay(500);
        }
    }

    async _fetchJSON(endpoint, retries = 2) {
        const url = `${GurbaniDownloadManager.API_BASE}${endpoint}`;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                if (attempt === retries) throw error;
                await this._delay(1000 * attempt);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-START: Begin background download when app loads
// ═══════════════════════════════════════════════════════════════

window.GurbaniDownloadManager = GurbaniDownloadManager;

// Auto-start after a short delay (let the page finish loading first)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window._gurbaniDownloader = new GurbaniDownloadManager();
            window._gurbaniDownloader.start();
        }, 3000); // Wait 3 seconds after page load
    });
} else {
    setTimeout(() => {
        window._gurbaniDownloader = new GurbaniDownloadManager();
        window._gurbaniDownloader.start();
    }, 3000);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GurbaniDownloadManager;
}
