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
                    <div class="download-icon">📿</div>
                    <h2 class="download-title">ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ</h2>
                    <p class="download-subtitle">Preparing Gurbani for offline use</p>
                    <div class="download-progress-wrapper">
                        <div class="download-progress-bar" id="download-progress-bar"></div>
                    </div>
                    <p class="download-status" id="download-status">Starting download...</p>
                    <p class="download-count" id="download-count">0 / 8</p>
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
                    background: linear-gradient(135deg, #1A0A2E 0%, #2D1B4E 100%);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Noto Sans Gurmukhi', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .download-container {
                    text-align: center;
                    padding: 40px;
                    max-width: 400px;
                    width: 90%;
                }
                .download-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                .download-title {
                    color: #FFD700;
                    font-size: 24px;
                    margin: 0 0 10px 0;
                    font-weight: 600;
                }
                .download-subtitle {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 16px;
                    margin: 0 0 40px 0;
                }
                .download-progress-wrapper {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 20px;
                }
                .download-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #FFD700, #FFA500);
                    width: 0%;
                    transition: width 0.5s ease;
                    border-radius: 4px;
                }
                .download-status {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    margin: 0 0 10px 0;
                }
                .download-count {
                    color: #FFD700;
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                }
                .download-offline-msg {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    margin-top: 30px;
                    padding: 20px;
                    background: rgba(255, 0, 0, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 0, 0, 0.3);
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
                    background: linear-gradient(135deg, #1A0A2E 0%, #2D1B4E 100%);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Noto Sans Gurmukhi', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .download-container {
                    text-align: center;
                    padding: 40px;
                    max-width: 400px;
                    width: 90%;
                }
                .download-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                .download-title {
                    color: #FFD700;
                    font-size: 24px;
                    margin: 0 0 30px 0;
                    font-weight: 600;
                }
                .download-offline-msg {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    padding: 20px;
                    background: rgba(255, 100, 100, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 100, 100, 0.3);
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
