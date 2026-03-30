/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES INTEGRATION - APP INITIALIZATION & ENHANCEMENTS
 * Handles app initialization, service worker, and additional features
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // APP INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize the Notes UI
        const notesUI = new NotesUI();

        // Make it globally accessible for debugging
        window.notesApp = notesUI;

        // Initialize additional features
        initTouchEnhancements();
        initThemeDetection();
        initVibration();

        // Console welcome
        console.log('%c📝 Notes App Ready', 'font-size: 16px; font-weight: bold; color: #f7c634;');
        console.log('Keyboard: ⌘N (new) | ⌘F (search) | ⌘S (save) | ESC (close)');
    });

    // ═══════════════════════════════════════════════════════════════
    // TOUCH ENHANCEMENTS
    // ═══════════════════════════════════════════════════════════════

    function initTouchEnhancements() {
        // Add haptic feedback simulation on button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, .note-card, .folder-tab, .menu-option, .sort-option');
            if (button) {
                triggerHaptic('light');
            }
        });

        // Add touch ripple effect
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.note-card, .fab, .empty-cta');
            if (target) {
                target.style.transform = 'scale(0.98)';
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('.note-card, .fab, .empty-cta');
            if (target) {
                target.style.transform = '';
            }
        }, { passive: true });

        // Prevent double-tap zoom on buttons
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd < 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    // ═══════════════════════════════════════════════════════════════
    // HAPTIC FEEDBACK
    // ═══════════════════════════════════════════════════════════════

    function initVibration() {
        // Store original click for elements that should vibrate
        const vibrateElements = [
            '.fab', '.editor-btn', '.menu-option', '.confirm-btn', '.folder-tab'
        ];

        vibrateElements.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.addEventListener('click', () => triggerHaptic('light'));
            });
        });
    }

    function triggerHaptic(style = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: [5],
                medium: [10],
                heavy: [20],
                success: [5, 50, 5],
                error: [20, 30, 20]
            };
            navigator.vibrate(patterns[style] || patterns.light);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // THEME DETECTION
    // ═══════════════════════════════════════════════════════════════

    function initThemeDetection() {
        // Currently only dark theme, but detect system preference for future
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

        // Apply theme class to body
        document.body.classList.add('theme-dark');

        // Listen for changes
        prefersDark.addEventListener('change', (e) => {
            // For now, always use dark theme
            document.body.classList.add('theme-dark');
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // SWIPE GESTURES FOR NOTE CARDS
    // ═══════════════════════════════════════════════════════════════

    function initSwipeGestures() {
        const notesList = document.getElementById('notes-list');
        if (!notesList) return;

        let startX = 0;
        let startY = 0;
        let currentCard = null;
        let isScrolling = null;

        notesList.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.note-card');
            if (!card) return;

            currentCard = card;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = null;
        }, { passive: true });

        notesList.addEventListener('touchmove', (e) => {
            if (!currentCard) return;

            const diffX = e.touches[0].clientX - startX;
            const diffY = e.touches[0].clientY - startY;

            // Determine if scrolling or swiping
            if (isScrolling === null) {
                isScrolling = Math.abs(diffY) > Math.abs(diffX);
            }

            if (!isScrolling && Math.abs(diffX) > 10) {
                e.preventDefault();
                const translateX = Math.max(-80, Math.min(0, diffX));
                currentCard.style.transform = `translateX(${translateX}px)`;
            }
        }, { passive: false });

        notesList.addEventListener('touchend', () => {
            if (currentCard) {
                currentCard.style.transform = '';
            }
            currentCard = null;
            isScrolling = null;
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // PULL TO REFRESH
    // ═══════════════════════════════════════════════════════════════

    function initPullToRefresh() {
        const main = document.querySelector('.notes-main');
        if (!main) return;

        let startY = 0;
        let isPulling = false;

        main.addEventListener('touchstart', (e) => {
            if (main.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });

        main.addEventListener('touchmove', (e) => {
            if (!isPulling) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0 && diff < 100) {
                main.style.transform = `translateY(${diff * 0.4}px)`;
            }
        }, { passive: true });

        main.addEventListener('touchend', () => {
            if (isPulling) {
                main.style.transform = '';
                isPulling = false;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // VISIBILITY CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Refresh notes when app becomes visible
            if (window.notesApp) {
                window.notesApp.renderNotes();
            }
        }
    });

    // ═══════════════════════════════════════════════════════════════
    // ORIENTATION CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════

    window.addEventListener('orientationchange', () => {
        // Delay to allow orientation change to complete
        setTimeout(() => {
            if (window.notesApp) {
                window.notesApp.renderNotes();
            }
        }, 100);
    });

    // ═══════════════════════════════════════════════════════════════
    // PREVENT ZOOM ON DOUBLE TAP (iOS)
    // ═══════════════════════════════════════════════════════════════

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // ═══════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════

    window.addEventListener('error', (e) => {
        console.error('[Notes App] Error:', e.message);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('[Notes App] Unhandled Promise:', e.reason);
    });

    // ═══════════════════════════════════════════════════════════════
    // STORAGE QUOTA CHECK
    // ═══════════════════════════════════════════════════════════════

    async function checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(2);

                if (percentUsed > 80) {
                    console.warn(`[Notes App] Storage usage: ${percentUsed}%`);
                }
            } catch (error) {
                // Ignore storage estimate errors
            }
        }
    }

    // Run storage check
    checkStorageQuota();

})();
