/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BACKGROUND DOWNLOAD UI
 * Visual feedback for background Bani/Ang downloads
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Floating progress indicator
 * ✅ Pause/Resume/Cancel controls
 * ✅ Storage usage display
 * ✅ Download statistics
 * ✅ Auto-hide when complete
 * 
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class BackgroundDownloadUI {
    constructor(cacheOptimizer) {
        this.cache = cacheOptimizer;
        this.container = null;
        this.isVisible = false;
        this.isMinimized = false;
        
        this.init();
    }

    init() {
        this.createUI();
        this.attachListeners();
        this.updateStats();
        
        // Update stats every 5 seconds
        setInterval(() => this.updateStats(), 5000);
    }

    createUI() {
        // Create floating container
        this.container = document.createElement('div');
        this.container.id = 'bg-download-ui';
        this.container.className = 'bg-download-hidden';
        this.container.innerHTML = `
            <div class="bg-download-header">
                <div class="bg-download-title">
                    <span class="bg-download-icon">📥</span>
                    <span>Background Download</span>
                </div>
                <div class="bg-download-actions">
                    <button class="bg-download-btn minimize" title="Minimize">−</button>
                    <button class="bg-download-btn close" title="Close">×</button>
                </div>
            </div>
            
            <div class="bg-download-body">
                <div class="bg-download-progress">
                    <div class="bg-download-progress-bar">
                        <div class="bg-download-progress-fill"></div>
                    </div>
                    <div class="bg-download-progress-text">0%</div>
                </div>
                
                <div class="bg-download-stats">
                    <div class="bg-download-stat">
                        <span class="label">Downloaded:</span>
                        <span class="value" id="bg-dl-completed">0</span>
                    </div>
                    <div class="bg-download-stat">
                        <span class="label">Remaining:</span>
                        <span class="value" id="bg-dl-remaining">0</span>
                    </div>
                    <div class="bg-download-stat">
                        <span class="label">Failed:</span>
                        <span class="value" id="bg-dl-failed">0</span>
                    </div>
                </div>
                
                <div class="bg-download-storage">
                    <span class="label">Storage:</span>
                    <span class="value" id="bg-dl-storage">Calculating...</span>
                </div>
                
                <div class="bg-download-controls">
                    <button class="bg-download-control-btn pause" id="bg-dl-pause">
                        <span class="icon">⏸️</span> Pause
                    </button>
                    <button class="bg-download-control-btn resume hidden" id="bg-dl-resume">
                        <span class="icon">▶️</span> Resume
                    </button>
                    <button class="bg-download-control-btn cancel" id="bg-dl-cancel">
                        <span class="icon">❌</span> Cancel
                    </button>
                </div>
                
                <div class="bg-download-cache-stats">
                    <div class="cache-stat">
                        <span class="label">Banis:</span>
                        <span class="value" id="bg-cache-banis">0</span>
                    </div>
                    <div class="cache-stat">
                        <span class="label">Angs:</span>
                        <span class="value" id="bg-cache-angs">0</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('bg-download-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'bg-download-styles';
        style.textContent = `
            #bg-download-ui {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 320px;
                background: rgba(255, 255, 255, 0.98);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            #bg-download-ui.bg-download-hidden {
                transform: translateY(120%);
                opacity: 0;
                pointer-events: none;
            }
            
            #bg-download-ui.bg-download-minimized .bg-download-body {
                display: none;
            }
            
            #bg-download-ui.bg-download-minimized {
                width: 200px;
            }
            
            .bg-download-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                cursor: move;
            }
            
            .bg-download-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: #1a1a1a;
                font-size: 14px;
            }
            
            .bg-download-icon {
                font-size: 18px;
            }
            
            .bg-download-actions {
                display: flex;
                gap: 4px;
            }
            
            .bg-download-btn {
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .bg-download-btn:hover {
                background: rgba(0, 0, 0, 0.1);
            }
            
            .bg-download-body {
                padding: 16px;
            }
            
            .bg-download-progress {
                margin-bottom: 16px;
            }
            
            .bg-download-progress-bar {
                height: 8px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .bg-download-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #45a049);
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            .bg-download-progress-text {
                text-align: center;
                font-size: 12px;
                font-weight: 600;
                color: #666;
            }
            
            .bg-download-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .bg-download-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px;
                background: rgba(0, 0, 0, 0.03);
                border-radius: 6px;
            }
            
            .bg-download-stat .label {
                font-size: 11px;
                color: #666;
                margin-bottom: 4px;
            }
            
            .bg-download-stat .value {
                font-size: 16px;
                font-weight: 600;
                color: #1a1a1a;
            }
            
            .bg-download-storage {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                background: rgba(33, 150, 243, 0.1);
                border-radius: 6px;
                margin-bottom: 12px;
                font-size: 12px;
            }
            
            .bg-download-storage .label {
                color: #666;
            }
            
            .bg-download-storage .value {
                font-weight: 600;
                color: #2196F3;
            }
            
            .bg-download-controls {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .bg-download-control-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                transition: all 0.2s;
            }
            
            .bg-download-control-btn.pause {
                background: #FF9800;
                color: white;
            }
            
            .bg-download-control-btn.pause:hover {
                background: #F57C00;
            }
            
            .bg-download-control-btn.resume {
                background: #4CAF50;
                color: white;
            }
            
            .bg-download-control-btn.resume:hover {
                background: #45a049;
            }
            
            .bg-download-control-btn.cancel {
                background: #f44336;
                color: white;
            }
            
            .bg-download-control-btn.cancel:hover {
                background: #da190b;
            }
            
            .bg-download-control-btn.hidden {
                display: none;
            }
            
            .bg-download-cache-stats {
                display: flex;
                justify-content: space-around;
                padding-top: 12px;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .cache-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .cache-stat .label {
                font-size: 11px;
                color: #666;
                margin-bottom: 4px;
            }
            
            .cache-stat .value {
                font-size: 14px;
                font-weight: 600;
                color: #1a1a1a;
            }
            
            /* Dark theme support */
            @media (prefers-color-scheme: dark) {
                #bg-download-ui {
                    background: rgba(30, 30, 30, 0.98);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                
                .bg-download-title,
                .bg-download-stat .value,
                .cache-stat .value {
                    color: #ffffff;
                }
                
                .bg-download-header {
                    border-bottom-color: rgba(255, 255, 255, 0.1);
                }
                
                .bg-download-btn {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .bg-download-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .bg-download-stat {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .bg-download-cache-stats {
                    border-top-color: rgba(255, 255, 255, 0.1);
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    attachListeners() {
        // Close button
        this.container.querySelector('.close').addEventListener('click', () => {
            this.hide();
        });
        
        // Minimize button
        this.container.querySelector('.minimize').addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        // Pause button
        document.getElementById('bg-dl-pause').addEventListener('click', () => {
            this.cache.pauseBackgroundDownload();
        });
        
        // Resume button
        document.getElementById('bg-dl-resume').addEventListener('click', () => {
            this.cache.resumeBackgroundDownload();
        });
        
        // Cancel button
        document.getElementById('bg-dl-cancel').addEventListener('click', () => {
            if (confirm('Cancel all pending downloads?')) {
                this.cache.cancelBackgroundDownload();
            }
        });
        
        // Listen to download events
        this.cache.onDownloadProgress((event) => {
            this.handleDownloadEvent(event);
        });
    }

    handleDownloadEvent(event) {
        switch (event.event) {
            case 'download_started':
                this.show();
                break;
                
            case 'progress':
                this.updateProgress(event.data);
                break;
                
            case 'download_completed':
                this.updateProgress(event.data);
                setTimeout(() => this.hide(), 3000);
                break;
                
            case 'download_paused':
                this.showResumeButton();
                break;
                
            case 'download_cancelled':
                this.hide();
                break;
        }
    }

    updateProgress(progress) {
        const fill = this.container.querySelector('.bg-download-progress-fill');
        const text = this.container.querySelector('.bg-download-progress-text');
        
        fill.style.width = `${progress.percentage}%`;
        text.textContent = `${progress.percentage}%`;
        
        document.getElementById('bg-dl-completed').textContent = progress.completed;
        document.getElementById('bg-dl-remaining').textContent = progress.remaining;
        document.getElementById('bg-dl-failed').textContent = progress.failed;
        
        if (progress.paused) {
            this.showResumeButton();
        } else {
            this.showPauseButton();
        }
    }

    async updateStats() {
        const stats = await this.cache.getCacheStats();
        const storage = await this.cache.getStorageEstimate();
        
        document.getElementById('bg-cache-banis').textContent = stats.dbBanis;
        document.getElementById('bg-cache-angs').textContent = stats.dbAngs;
        
        if (storage) {
            document.getElementById('bg-dl-storage').textContent = 
                `${storage.usageInMB} MB / ${storage.quotaInMB} MB (${storage.percentUsed}%)`;
        }
    }

    show() {
        this.isVisible = true;
        this.container.classList.remove('bg-download-hidden');
    }

    hide() {
        this.isVisible = false;
        this.container.classList.add('bg-download-hidden');
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('bg-download-minimized');
    }

    showPauseButton() {
        document.getElementById('bg-dl-pause').classList.remove('hidden');
        document.getElementById('bg-dl-resume').classList.add('hidden');
    }

    showResumeButton() {
        document.getElementById('bg-dl-pause').classList.add('hidden');
        document.getElementById('bg-dl-resume').classList.remove('hidden');
    }
}

// Auto-initialize when cache optimizer is ready
if (window.baniCacheOptimizer) {
    window.backgroundDownloadUI = new BackgroundDownloadUI(window.baniCacheOptimizer);
} else {
    window.addEventListener('load', () => {
        if (window.baniCacheOptimizer) {
            window.backgroundDownloadUI = new BackgroundDownloadUI(window.baniCacheOptimizer);
        }
    });
}
