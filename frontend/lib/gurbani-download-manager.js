/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI DOWNLOAD MANAGER — First-Time Download UI
 * Shows progress bar when downloading banis for offline use
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    class GurbaniDownloadManager {
        constructor() {
            this.overlay = null;
            this.progressBar = null;
            this.statusText = null;
            this.isShowing = false;
        }

        /**
         * Check if download is needed and show UI if so
         */
        async checkAndDownload() {
            // Check if already downloaded
            if (window.gurbaniLocalDB && window.gurbaniLocalDB.isDownloaded()) {
                console.log('[GurbaniDownloadManager] Already downloaded, skipping');
                // Still refresh stale banis in background
                window.gurbaniLocalDB.refreshStaleBanis();
                return true;
            }

            // Check if we're online
            if (!navigator.onLine) {
                console.warn('[GurbaniDownloadManager] Offline, cannot download');
                this.showOfflineMessage();
                return false;
            }

            // Show download UI
            await this.showDownloadUI();
            return true;
        }

        /**
         * Create and show download progress UI
         */
        async showDownloadUI() {
            if (this.isShowing) return;
            this.isShowing = true;

            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.id = 'gurbani-download-overlay';
            this.overlay.innerHTML = `
                <div class="download-container">
                    <div class="download-header">
                        <div class="download-icon">📿</div>
                        <div class="download-header-text">
                            <h2 class="download-title">ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ</h2>
                            <p class="download-subtitle">Preparing Gurbani for offline reading</p>
                        </div>
                    </div>
                    
                    <div class="download-steps">
                        <div class="download-step active" id="step-1">
                            <span class="step-number">1</span>
                            <span class="step-text">Connecting to BaniDB...</span>
                        </div>
                        <div class="download-step" id="step-2">
                            <span class="step-number">2</span>
                            <span class="step-text">Downloading Nitnem Banis...</span>
                        </div>
                        <div class="download-step" id="step-3">
                            <span class="step-number">3</span>
                            <span class="step-text">Saving to device storage...</span>
                        </div>
                    </div>
                    
                    <div class="download-progress-wrapper">
                        <div class="download-progress-bar" id="download-progress-bar"></div>
                    </div>
                    
                    <div class="download-status-row">
                        <span class="download-status" id="download-status">Starting download...</span>
                        <span class="download-count" id="download-count">0 / 8</span>
                    </div>
                    
                    <div class="download-badges">
                        <span class="badge">📶 Works offline</span>
                        <span class="badge">⚡ Instant loading</span>
                    </div>
                </div>
            `;

            // Add styles
            const styles = document.createElement('style');
            styles.textContent = `
                #gurbani-download-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Noto Sans Gurmukhi', -apple-system, BlinkMacSystemFont, sans-serif;
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                }
                .download-container {
                    text-align: left;
                    padding: 32px 28px;
                    max-width: 360px;
                    width: 85%;
                    background: linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.9) 100%);
                    border-radius: 24px;
                    box-shadow:
                        0 8px 32px rgba(0, 0, 0, 0.12),
                        0 2px 8px rgba(0, 0, 0, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .download-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                }
                .download-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    box-shadow:
                        4px 4px 12px rgba(0, 0, 0, 0.15),
                        inset 0 1px 1px rgba(255, 255, 255, 0.2);
                    flex-shrink: 0;
                }
                .download-header-text {
                    flex: 1;
                }
                .download-title {
                    color: #1a1a2e;
                    font-size: 20px;
                    margin: 0 0 4px 0;
                    font-weight: 700;
                    letter-spacing: -0.3px;
                }
                .download-subtitle {
                    color: #64748b;
                    font-size: 13px;
                    margin: 0;
                    font-weight: 400;
                }
                .download-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .download-step {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 16px;
                    background: rgba(241, 245, 249, 0.6);
                    border-radius: 14px;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                }
                .download-step.active {
                    background: rgba(254, 243, 199, 0.4);
                    border-color: rgba(251, 191, 36, 0.3);
                }
                .step-number {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 700;
                    color: #1a1a2e;
                    box-shadow:
                        0 4px 12px rgba(251, 191, 36, 0.35),
                        inset 0 1px 1px rgba(255, 255, 255, 0.4);
                    flex-shrink: 0;
                }
                .download-step.active .step-number {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow:
                        0 4px 16px rgba(245, 158, 11, 0.45),
                        inset 0 1px 1px rgba(255, 255, 255, 0.4);
                }
                .step-text {
                    color: #475569;
                    font-size: 14px;
                    font-weight: 500;
                }
                .download-step.active .step-text {
                    color: #92400e;
                    font-weight: 600;
                }
                .download-progress-wrapper {
                    width: 100%;
                    height: 8px;
                    background: rgba(226, 232, 240, 0.6);
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 16px;
                    padding: 2px;
                }
                .download-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
                    width: 0%;
                    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 6px;
                    background-size: 200% 100%;
                    animation: shimmer 2s ease-in-out infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .download-status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .download-status {
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 500;
                }
                .download-count {
                    color: #f59e0b;
                    font-size: 15px;
                    font-weight: 700;
                }
                .download-badges {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: rgba(254, 243, 199, 0.5);
                    border-radius: 100px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #92400e;
                    border: 1px solid rgba(251, 191, 36, 0.2);
                }
            `;

            document.head.appendChild(styles);
            document.body.appendChild(this.overlay);

            // Get UI elements
            this.progressBar = document.getElementById('download-progress-bar');
            this.statusText = document.getElementById('download-status');
            this.countText = document.getElementById('download-count');

            // Start download
            try {
                await window.gurbaniLocalDB.downloadAllBanis(
                    (current, total, currentBani) => this.onProgress(current, total, currentBani)
                );

                // Download complete
                this.onComplete();
            } catch (error) {
                this.onError(error);
            }
        }

        /**
         * Update progress UI
         */
        onProgress(current, total, currentBani) {
            const percentage = (current / total) * 100;

            if (this.progressBar) {
                this.progressBar.style.width = `${percentage}%`;
            }

            if (this.statusText) {
                this.statusText.textContent = `Downloading ${currentBani}...`;
            }

            if (this.countText) {
                this.countText.textContent = `${current} / ${total}`;
            }

            console.log(`[GurbaniDownloadManager] Progress: ${current}/${total} - ${currentBani}`);
        }

        /**
         * Download complete
         */
        onComplete() {
            if (this.statusText) {
                this.statusText.textContent = '✓ Download complete!';
            }

            if (this.countText) {
                this.countText.textContent = 'ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ';
            }

            console.log('[GurbaniDownloadManager] Download complete');

            // Hide after brief delay
            setTimeout(() => {
                this.hide();
            }, 1500);
        }

        /**
         * Download error
         */
        onError(error) {
            console.error('[GurbaniDownloadManager] Download failed:', error);

            if (this.statusText) {
                this.statusText.textContent = 'Download failed. Will retry next time.';
                this.statusText.style.color = '#FF6B6B';
            }

            // Hide after delay
            setTimeout(() => {
                this.hide();
            }, 3000);
        }

        /**
         * Show offline message
         */
        showOfflineMessage() {
            this.overlay = document.createElement('div');
            this.overlay.id = 'gurbani-download-overlay';
            this.overlay.innerHTML = `
                <div class="download-container">
                    <div class="download-icon">📿</div>
                    <h2 class="download-title">ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ</h2>
                    <div class="download-offline-msg">
                        You are currently offline.<br><br>
                        Please connect to the internet to download Gurbani for offline use.
                    </div>
                </div>
            `;

            const styles = document.createElement('style');
            styles.textContent = `
                #gurbani-download-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Noto Sans Gurmukhi', -apple-system, BlinkMacSystemFont, sans-serif;
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                }
                .download-container {
                    text-align: left;
                    padding: 32px 28px;
                    max-width: 360px;
                    width: 85%;
                    background: linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.9) 100%);
                    border-radius: 24px;
                    box-shadow:
                        0 8px 32px rgba(0, 0, 0, 0.12),
                        0 2px 8px rgba(0, 0, 0, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .download-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                }
                .download-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    box-shadow:
                        4px 4px 12px rgba(0, 0, 0, 0.15),
                        inset 0 1px 1px rgba(255, 255, 255, 0.2);
                    flex-shrink: 0;
                }
                .download-header-text {
                    flex: 1;
                }
                .download-title {
                    color: #1a1a2e;
                    font-size: 20px;
                    margin: 0 0 4px 0;
                    font-weight: 700;
                    letter-spacing: -0.3px;
                }
                .download-offline-msg {
                    color: #475569;
                    font-size: 14px;
                    margin-top: 20px;
                    padding: 20px;
                    background: rgba(241, 245, 249, 0.6);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 100, 100, 0.2);
                    line-height: 1.6;
                }
            `;

            document.head.appendChild(styles);
            document.body.appendChild(this.overlay);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hide();
            }, 5000);
        }

        /**
         * Hide the download UI
         */
        hide() {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.style.opacity = '0';
                this.overlay.style.transition = 'opacity 0.5s ease';

                setTimeout(() => {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                    this.isShowing = false;
                }, 500);
            }
        }
    }

    // Create singleton
    window.GurbaniDownloadManager = GurbaniDownloadManager;
    window.gurbaniDownloadManager = new GurbaniDownloadManager();

    console.log('[GurbaniDownloadManager] Module loaded');
})();
