/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DETACHED READING MODE
 * Prevents Random Ang and other non-sequential navigation from corrupting
 * Sehaj Paath progress. This is SPIRITUALLY CRITICAL.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class DetachedReadingMode {
    constructor() {
        this.isActive = false;
        this.detachedAng = null;
        this.source = null; // 'random', 'search', 'bookmark', 'share_link', 'hukamnama'
        this.originalState = null;
        this.indicatorElement = null;

        this.init();
    }

    init() {
        // Check if we should be in detached mode from URL params
        const params = new URLSearchParams(window.location.search);
        const source = params.get('source');
        const ang = params.get('ang');

        if (source && ['random', 'search', 'bookmark', 'share', 'hukamnama'].includes(source)) {
            this.enterDetachedMode(parseInt(ang), source);
        }
    }

    /**
     * Capture the current Sehaj Paath state before entering detached mode
     */
    captureCurrentState() {
        try {
            const state = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');
            return {
                currentAng: state.currentPaath?.currentAng || 1,
                lastReadAt: state.currentPaath?.lastReadAt,
                savedAt: new Date().toISOString()
            };
        } catch {
            return { currentAng: 1, savedAt: new Date().toISOString() };
        }
    }

    /**
     * Enter Detached Reading Mode
     * @param {number} angNumber - The ang being viewed in detached mode
     * @param {string} source - The source that triggered detached mode
     */
    enterDetachedMode(angNumber, source) {
        console.log(`📌 Entering Detached Reading Mode - Ang ${angNumber} (${source})`);

        this.isActive = true;
        this.detachedAng = angNumber;
        this.source = source;
        this.originalState = this.captureCurrentState();

        // Store detached state
        sessionStorage.setItem('detachedMode', JSON.stringify({
            isActive: true,
            detachedAng: angNumber,
            source: source,
            originalAng: this.originalState.currentAng,
            enteredAt: new Date().toISOString()
        }));

        // Show visual indicator
        this.showDetachedIndicator();

        // Add detached class to body
        document.body.classList.add('detached-mode');

        // Trigger haptic
        this.haptic('light');
    }

    /**
     * Exit Detached Reading Mode
     */
    exitDetachedMode() {
        console.log('📌 Exiting Detached Reading Mode');

        this.isActive = false;
        this.detachedAng = null;
        this.source = null;

        // Clear session storage
        sessionStorage.removeItem('detachedMode');

        // Hide indicator
        this.hideDetachedIndicator();

        // Remove detached class from body
        document.body.classList.remove('detached-mode');
    }

    /**
     * Return to Sehaj Paath at the saved position
     */
    returnToSehajPaath() {
        const originalAng = this.originalState?.currentAng || this.getSehajPaathAng();

        console.log(`📌 Returning to Sehaj Paath - Ang ${originalAng}`);

        this.exitDetachedMode();

        // Navigate to the original ang without detached source
        window.location.href = `reader.html?ang=${originalAng}`;
    }

    /**
     * Get the true Sehaj Paath position (ignoring detached ang)
     */
    getSehajPaathAng() {
        try {
            const state = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');
            return state.currentPaath?.currentAng || 1;
        } catch {
            return 1;
        }
    }

    /**
     * Check if we can save progress (only if NOT in detached mode)
     */
    canSaveProgress() {
        return !this.isActive;
    }

    /**
     * Display the detached mode indicator
     */
    showDetachedIndicator() {
        if (this.indicatorElement) {
            this.indicatorElement.classList.add('visible');
            return;
        }

        // Create indicator element
        this.indicatorElement = document.createElement('div');
        this.indicatorElement.className = 'detached-indicator visible';
        this.indicatorElement.innerHTML = `
            <div class="detached-banner">
                <div class="detached-info">
                    <span class="detached-icon">${this.getSourceIcon()}</span>
                    <div class="detached-text">
                        <span class="detached-title">Detached Reading Mode</span>
                        <span class="detached-subtitle">Progress unchanged • ${this.getSourceLabel()}</span>
                    </div>
                </div>
                <button class="detached-return-btn" id="returnToSehajPaathBtn">
                    <span>Return to Ang ${this.originalState?.currentAng || this.getSehajPaathAng()}</span>
                    <span class="return-icon">→</span>
                </button>
            </div>
        `;

        document.body.appendChild(this.indicatorElement);

        // Add event listener for return button
        document.getElementById('returnToSehajPaathBtn')?.addEventListener('click', () => {
            this.returnToSehajPaath();
        });

        // Add styles if not already added
        this.addStyles();
    }

    /**
     * Hide the detached mode indicator
     */
    hideDetachedIndicator() {
        if (this.indicatorElement) {
            this.indicatorElement.classList.remove('visible');
            setTimeout(() => {
                this.indicatorElement?.remove();
                this.indicatorElement = null;
            }, 300);
        }
    }

    /**
     * Get icon based on source
     */
    getSourceIcon() {
        const icons = {
            random: '🎲',
            search: '🔍',
            bookmark: '🔖',
            share: '🔗',
            hukamnama: '🙏'
        };
        return icons[this.source] || '📖';
    }

    /**
     * Get label based on source
     */
    getSourceLabel() {
        const labels = {
            random: 'Random Ang',
            search: 'Search Result',
            bookmark: 'Bookmark',
            share: 'Shared Link',
            hukamnama: 'Today\'s Hukamnama'
        };
        return labels[this.source] || 'Detached View';
    }

    /**
     * Add CSS styles for detached mode
     */
    addStyles() {
        if (document.getElementById('detachedModeStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'detachedModeStyles';
        styles.textContent = `
            /* ═══════════════════════════════════════════════════════════════════════════════
               DETACHED MODE STYLES
               ═══════════════════════════════════════════════════════════════════════════════ */
            
            .detached-indicator {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 9000;
                transform: translateY(-100%);
                transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
                padding-top: env(safe-area-inset-top, 0);
            }
            
            .detached-indicator.visible {
                transform: translateY(0);
            }
            
            .detached-banner {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px 16px;
                background: linear-gradient(135deg, 
                    rgba(255, 149, 0, 0.95) 0%, 
                    rgba(255, 107, 53, 0.95) 100%);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 20px rgba(255, 149, 0, 0.3);
            }
            
            .detached-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .detached-icon {
                font-size: 20px;
            }
            
            .detached-text {
                display: flex;
                flex-direction: column;
            }
            
            .detached-title {
                font-size: 13px;
                font-weight: 600;
                color: #fff;
            }
            
            .detached-subtitle {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.85);
            }
            
            .detached-return-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 20px;
                color: #fff;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .detached-return-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .detached-return-btn:active {
                transform: scale(0.95);
            }
            
            .return-icon {
                font-size: 14px;
            }
            
            /* Adjust header when detached indicator is shown */
            body.detached-mode .reader-header,
            body.detached-mode .app-header {
                top: 48px !important;
            }
            
            body.detached-mode .reader-content {
                padding-top: 48px;
            }
            
            /* Glow effect on border when in detached mode */
            body.detached-mode {
                --detached-glow: rgba(255, 149, 0, 0.15);
            }
            
            body.detached-mode::after {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 200px;
                background: linear-gradient(180deg, var(--detached-glow) 0%, transparent 100%);
                pointer-events: none;
                z-index: 8999;
            }
            
            /* Floating return button for when scrolling */
            .floating-return-btn {
                position: fixed;
                bottom: 100px;
                right: 16px;
                z-index: 9001;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #FF9500 0%, #FF6B35 100%);
                border: none;
                border-radius: 24px;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(255, 149, 0, 0.4);
                transform: scale(0);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            
            .floating-return-btn.visible {
                transform: scale(1);
            }
            
            .floating-return-btn:active {
                transform: scale(0.95);
            }
            
            /* Animation for the return button */
            @keyframes pulseGlow {
                0%, 100% {
                    box-shadow: 0 4px 20px rgba(255, 149, 0, 0.4);
                }
                50% {
                    box-shadow: 0 4px 30px rgba(255, 149, 0, 0.6);
                }
            }
            
            .floating-return-btn {
                animation: pulseGlow 2s ease-in-out infinite;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Haptic feedback
     */
    haptic(type = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30]
            };
            navigator.vibrate(patterns[type] || [10]);
        }
    }

    /**
     * Restore detached state from session storage (for page refresh)
     */
    restoreFromSession() {
        try {
            const saved = sessionStorage.getItem('detachedMode');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.isActive) {
                    this.isActive = true;
                    this.detachedAng = data.detachedAng;
                    this.source = data.source;
                    this.originalState = { currentAng: data.originalAng };
                    this.showDetachedIndicator();
                    document.body.classList.add('detached-mode');
                    return true;
                }
            }
        } catch (e) {
            console.error('Error restoring detached mode:', e);
        }
        return false;
    }
}

// Global instance
let detachedMode;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    detachedMode = new DetachedReadingMode();

    // Restore from session if needed
    detachedMode.restoreFromSession();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DetachedReadingMode;
}
