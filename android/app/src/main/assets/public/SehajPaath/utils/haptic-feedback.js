/**
 * Haptic Feedback Utility
 * Uses Capacitor Haptics plugin when available (native iOS/Android)
 * Falls back to navigator.vibrate for web testing
 */

class HapticFeedback {
    constructor() {
        this.enabled = true;
        this.loadPreference();
    }

    loadPreference() {
        try {
            const settings = JSON.parse(localStorage.getItem('sehajPaathReaderSettings') || '{}');
            this.enabled = settings.hapticFeedback !== false;
        } catch {
            this.enabled = true;
        }
    }

    /**
     * Check if haptics are supported
     */
    isSupported() {
        return window.CapacitorHaptics?.isCapacitorAvailable() || 'vibrate' in navigator;
    }

    /**
     * Light tap feedback
     */
    light() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.impact('light');
        } else {
            navigator.vibrate(10);
        }
    }

    /**
     * Medium tap feedback
     */
    medium() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.impact('medium');
        } else {
            navigator.vibrate(20);
        }
    }

    /**
     * Heavy tap feedback
     */
    heavy() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.impact('heavy');
        } else {
            navigator.vibrate(30);
        }
    }

    /**
     * Selection feedback
     */
    selection() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.selection();
        } else {
            navigator.vibrate([5, 5, 5]);
        }
    }

    /**
     * Success feedback pattern
     */
    success() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.notification('success');
        } else {
            navigator.vibrate([10, 50, 20]);
        }
    }

    /**
     * Error feedback pattern
     */
    error() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.notification('error');
        } else {
            navigator.vibrate([50, 30, 50, 30, 50]);
        }
    }

    /**
     * Achievement unlock pattern
     */
    achievement() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.notification('success');
        } else {
            navigator.vibrate([20, 100, 10, 100, 30, 100, 50]);
        }
    }

    /**
     * Page turn feedback
     */
    pageTurn() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.selection();
        } else {
            navigator.vibrate(8);
        }
    }

    /**
     * Bookmark add feedback
     */
    bookmark() {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.impact('light');
        } else {
            navigator.vibrate([15, 30, 15]);
        }
    }

    /**
     * Custom pattern
     */
    pattern(pattern) {
        if (!this.enabled || !this.isSupported()) return;
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.vibrate(pattern);
        } else {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Enable/disable haptics
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Global instance
const haptics = new HapticFeedback();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HapticFeedback, haptics };
}
