/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PWA UPDATE CONTROLLER v1.0
 * Manual update check with status feedback - Data-safe updates
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    const UPDATE_CONTROLLER = {
        status: 'idle', // idle | checking | available | uptodate | error
        lastCheck: null,
        
        /**
         * Initialize the update controller
         */
        init() {
            this.bindEvents();
            this.loadLastCheckTime();
        },

        /**
         * Bind click events to update buttons
         */
        bindEvents() {
            document.addEventListener('click', (e) => {
                if (e.target.closest('.pwa-update-btn') || e.target.closest('#checkUpdateBtn')) {
                    e.preventDefault();
                    this.checkForUpdate();
                }
            });
        },

        /**
         * Load last check time from localStorage
         */
        loadLastCheckTime() {
            try {
                const last = localStorage.getItem('pwa_last_update_check');
                if (last) {
                    this.lastCheck = new Date(parseInt(last));
                    this.updateLastCheckDisplay();
                }
            } catch (e) { }
        },

        /**
         * Save check time to localStorage
         */
        saveLastCheckTime() {
            try {
                localStorage.setItem('pwa_last_update_check', Date.now().toString());
            } catch (e) { }
        },

        /**
         * Get formatted last check time
         */
        getLastCheckText() {
            if (!this.lastCheck) return 'Never checked';
            
            const now = new Date();
            const diff = now - this.lastCheck;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            return `${days}d ago`;
        },

        /**
         * Update the display of last check time
         */
        updateLastCheckDisplay() {
            const elements = document.querySelectorAll('.pwa-update-lastcheck');
            elements.forEach(el => {
                el.textContent = this.getLastCheckText();
            });
        },

        /**
         * Set button status state
         */
        setStatus(status, message = '') {
            this.status = status;
            
            const buttons = document.querySelectorAll('.pwa-update-btn, #checkUpdateBtn');
            const statusElements = document.querySelectorAll('.pwa-update-status');

            buttons.forEach(btn => {
                // Remove all status classes
                btn.classList.remove('checking', 'available', 'uptodate', 'error');
                
                switch(status) {
                    case 'checking':
                        btn.classList.add('checking');
                        btn.disabled = true;
                        break;
                    case 'available':
                        btn.classList.add('available');
                        btn.disabled = false;
                        break;
                    case 'uptodate':
                        btn.classList.add('uptodate');
                        btn.disabled = false;
                        break;
                    case 'error':
                        btn.classList.add('error');
                        btn.disabled = false;
                        break;
                    default:
                        btn.disabled = false;
                }
            });

            statusElements.forEach(el => {
                el.textContent = message;
                el.className = `pwa-update-status ${status}`;
            });
        },

        /**
         * Main update check function
         */
        async checkForUpdate() {
            if (!('serviceWorker' in navigator)) {
                this.setStatus('error', 'Not supported');
                return;
            }

            this.setStatus('checking', 'Checking...');

            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Force update check
                await registration.update();

                // Wait a moment for the update to be detected
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Check if update is available
                if (registration.waiting) {
                    this.setStatus('available', 'Update available! Click to install');
                    this.showUpdatePrompt();
                } else if (registration.installing) {
                    this.setStatus('checking', 'Downloading...');
                    
                    // Wait for installation
                    await new Promise((resolve) => {
                        const checkState = () => {
                            if (!registration.installing) {
                                resolve();
                            } else {
                                setTimeout(checkState, 500);
                            }
                        };
                        checkState();
                    });

                    // Check again
                    if (registration.waiting) {
                        this.setStatus('available', 'Update ready! Click to install');
                        this.showUpdatePrompt();
                    } else {
                        this.setStatus('uptodate', 'Up to date');
                    }
                } else {
                    this.setStatus('uptodate', 'Up to date');
                }

                this.lastCheck = new Date();
                this.saveLastCheckTime();
                this.updateLastCheckDisplay();

            } catch (error) {
                console.error('Update check failed:', error);
                this.setStatus('error', 'Check failed - try again');
            }
        },

        /**
         * Show update prompt dialog
         */
        showUpdatePrompt() {
            if (document.querySelector('.pwa-update-prompt')) return;

            const prompt = document.createElement('div');
            prompt.className = 'pwa-update-prompt';
            prompt.innerHTML = `
                <div class="pwa-update-prompt__content">
                    <div class="pwa-update-prompt__icon">✨</div>
                    <div class="pwa-update-prompt__title">New Version Available</div>
                    <div class="pwa-update-prompt__text">
                        A new version of ANHAD is ready.<br>
                        <strong>Your data is safe</strong> - streaks, bookmarks, and settings will be preserved.
                    </div>
                    <div class="pwa-update-prompt__actions">
                        <button class="pwa-update-prompt__btn pwa-update-prompt__btn--primary" id="installUpdateNow">
                            Install Now
                        </button>
                        <button class="pwa-update-prompt__btn pwa-update-prompt__btn--secondary" id="installUpdateLater">
                            Later
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(prompt);

            // Trigger reflow for animation
            requestAnimationFrame(() => {
                prompt.classList.add('visible');
            });

            // Install now
            document.getElementById('installUpdateNow').addEventListener('click', () => {
                this.applyUpdate();
                prompt.remove();
            });

            // Later
            document.getElementById('installUpdateLater').addEventListener('click', () => {
                prompt.classList.remove('visible');
                setTimeout(() => prompt.remove(), 300);
            });
        },

        /**
         * Apply the update
         */
        applyUpdate() {
            // Use the global pwaManager if available
            if (window.pwaManager && typeof window.pwaManager.applyUpdate === 'function') {
                window.pwaManager.applyUpdate();
            } else {
                // Fallback: manually trigger skipWaiting
                navigator.serviceWorker.ready.then(registration => {
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            }

            this.setStatus('checking', 'Installing...');

            // Listen for controller change and reload
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UPDATE_CONTROLLER.init());
    } else {
        UPDATE_CONTROLLER.init();
    }

    // Expose globally
    window.UPDATE_CONTROLLER = UPDATE_CONTROLLER;

})();
