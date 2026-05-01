/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔔 CAPACITOR HAPTICS WRAPPER v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides a unified haptics API that:
 * 1. Uses Capacitor Haptics plugin when available (mobile native)
 * 2. Falls back to navigator.vibrate for web testing
 * 
 * Critical for iOS: navigator.vibrate is blocked on iOS WebViews
 * This wrapper ensures haptics work on both iOS and Android native apps
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Check if Capacitor Haptics plugin is available
 * @returns {boolean} True if Capacitor plugin is available
 */
function isCapacitorAvailable() {
    return !!(window.Capacitor?.Plugins?.Haptics);
}

/**
 * Haptic impact styles (Capacitor)
 */
const ImpactStyle = {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
    Rigid: 'RIGID',
    Soft: 'SOFT'
};

/**
 * Haptic notification types (Capacitor)
 */
const NotificationType = {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR'
};

/**
 * Trigger a haptic impact
 * @param {string} style - Impact style: 'light', 'medium', 'heavy', 'rigid', 'soft'
 * @returns {Promise<void>}
 */
async function impact(style = 'light') {
    if (isCapacitorAvailable()) {
        try {
            const { Haptics } = window.Capacitor.Plugins;
            const impactStyle = ImpactStyle[style.charAt(0).toUpperCase() + style.slice(1).toLowerCase()] || ImpactStyle.Light;
            await Haptics.impact({ style: impactStyle });
            return;
        } catch (error) {
            console.error('[CapacitorHaptics] Impact failed:', error);
        }
    }
    
    // Web fallback
    if (navigator.vibrate) {
        const durations = {
            light: 10,
            medium: 25,
            heavy: 50,
            rigid: 30,
            soft: 15
        };
        navigator.vibrate(durations[style] || 10);
    }
}

/**
 * Trigger a haptic notification
 * @param {string} type - Notification type: 'success', 'warning', 'error'
 * @returns {Promise<void>}
 */
async function notification(type = 'success') {
    if (isCapacitorAvailable()) {
        try {
            const { Haptics } = window.Capacitor.Plugins;
            const notificationType = NotificationType[type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()] || NotificationType.Success;
            await Haptics.notification({ type: notificationType });
            return;
        } catch (error) {
            console.error('[CapacitorHaptics] Notification failed:', error);
        }
    }
    
    // Web fallback
    if (navigator.vibrate) {
        const patterns = {
            success: [50, 50, 50],
            warning: [100],
            error: [200, 100, 200]
        };
        navigator.vibrate(patterns[type] || [50]);
    }
}

/**
 * Vibrate with a custom pattern
 * @param {number|number[]} pattern - Duration in ms or array of durations
 * @returns {Promise<void>}
 */
async function vibrate(pattern) {
    if (isCapacitorAvailable()) {
        try {
            const { Haptics } = window.Capacitor.Plugins;
            
            // Convert pattern to Capacitor format
            if (typeof pattern === 'number') {
                // Single duration - use impact
                if (pattern < 20) await impact('light');
                else if (pattern < 40) await impact('medium');
                else await impact('heavy');
            } else if (Array.isArray(pattern)) {
                // Pattern - use notification or sequence of impacts
                for (let i = 0; i < pattern.length; i += 2) {
                    const duration = pattern[i];
                    if (duration < 20) await impact('light');
                    else if (duration < 40) await impact('medium');
                    else await impact('heavy');
                    
                    // Wait for the pause
                    if (pattern[i + 1]) {
                        await new Promise(resolve => setTimeout(resolve, pattern[i + 1]));
                    }
                }
            }
            return;
        } catch (error) {
            console.error('[CapacitorHaptics] Vibrate failed:', error);
        }
    }
    
    // Web fallback
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

/**
 * Selection haptic (for UI interactions like button taps)
 * @returns {Promise<void>}
 */
async function selection() {
    if (isCapacitorAvailable()) {
        try {
            const { Haptics } = window.Capacitor.Plugins;
            await Haptics.selection();
            return;
        } catch (error) {
            console.error('[CapacitorHaptics] Selection failed:', error);
        }
    }
    
    // Web fallback
    if (navigator.vibrate) {
        navigator.vibrate(5);
    }
}

/**
 * Start a custom haptic pattern (advanced)
 * @param {Array} pattern - Array of { duration: number, intensity: number }
 * @returns {Promise<void>}
 */
async function startCustom(pattern) {
    if (isCapacitorAvailable()) {
        try {
            const { Haptics } = window.Capacitor.Plugins;
            await Haptics.start({ style: 'CUSTOM', pattern });
            return;
        } catch (error) {
            console.error('[CapacitorHaptics] Custom haptic failed:', error);
        }
    }
    
    // Web fallback - just vibrate the total duration
    if (navigator.vibrate && pattern.length > 0) {
        const totalDuration = pattern.reduce((sum, p) => sum + (p.duration || 0), 0);
        navigator.vibrate(totalDuration);
    }
}

/**
 * Stop any ongoing haptic
 * @returns {Promise<void>}
 */
async function stop() {
    if (isCapacitorAvailable()) {
        try {
            const { Haptics } = window.Capacitor.Plugins;
            await Haptics.stop();
            return;
        } catch (error) {
            console.error('[CapacitorHaptics] Stop failed:', error);
        }
    }
    
    // Web fallback
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isCapacitorAvailable,
        impact,
        notification,
        vibrate,
        selection,
        startCustom,
        stop,
        ImpactStyle,
        NotificationType
    };
}

// Also make available globally for easy access
try {
    window.CapacitorHaptics = {
        isCapacitorAvailable,
        impact,
        notification,
        vibrate,
        selection,
        startCustom,
        stop,
        ImpactStyle,
        NotificationType
    };
} catch (e) {
    console.error('[CapacitorHaptics] Failed to initialize:', e);
    window.CapacitorHaptics = {
        isCapacitorAvailable: () => false,
        impact: async () => {},
        notification: async () => {},
        vibrate: async () => {},
        selection: async () => {},
        startCustom: async () => {},
        stop: async () => {}
    };
}

// Convenience function - replace navigator.vibrate globally
window.safeVibrate = function(pattern) {
    vibrate(pattern);
};
