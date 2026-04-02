/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPACITOR INITIALIZATION - Hardware Back Button Handler
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Handles Android hardware back button for proper navigation behavior.
 * 
 * Bug Fix: Task 7.4 - Performance and Stability Audit Fixes
 * Bug Condition: NOT hasHandler
 * Expected Behavior: Navigate on back button, minimize on root
 * Preservation: Navigation works identically (Req 3.5)
 * 
 * Requirements: 1.22, 2.22
 * 
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════════
    // HARDWARE BACK BUTTON HANDLER
    // ═══════════════════════════════════════════════════════════════════════════════

    function initBackButtonHandler() {
        // Check if Capacitor App plugin is available
        if (!window.Capacitor?.Plugins?.App) {
            console.log('[CapacitorInit] App plugin not available, skipping back button handler');
            return;
        }

        const { App } = window.Capacitor.Plugins;

        // Add listener for hardware back button
        App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                // Navigate back if history exists
                window.history.back();
                console.log('[CapacitorInit] Back button: navigating back');
            } else {
                // On root page, minimize app instead of exiting
                if (App.minimizeApp) {
                    App.minimizeApp();
                    console.log('[CapacitorInit] Back button: minimizing app');
                } else {
                    // Fallback: exit app if minimize not available
                    console.log('[CapacitorInit] Back button: at root, minimize not available');
                }
            }
        });

        console.log('[CapacitorInit] Hardware back button handler registered');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════

    function init() {
        initBackButtonHandler();
        console.log('[CapacitorInit] Initialization complete');
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for manual initialization if needed
    window.CapacitorInit = {
        initBackButtonHandler
    };

})();
