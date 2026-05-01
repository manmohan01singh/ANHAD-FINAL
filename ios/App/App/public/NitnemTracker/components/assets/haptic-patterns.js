/* ═══════════════════════════════════════════════════════════════════════════════
   HAPTIC PATTERNS - iOS-Style Vibration Patterns
   Advanced haptic feedback system for Nitnem Tracker
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

const HapticPatterns = {
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 1: PATTERN DEFINITIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    patterns: {
        // Impact Patterns (iOS UIImpactFeedbackGenerator style)
        impact: {
            light: [10],
            medium: [20],
            heavy: [35],
            soft: [5, 5, 5],
            rigid: [40]
        },
        
        // Notification Patterns (iOS UINotificationFeedbackGenerator style)
        notification: {
            success: [10, 50, 20, 50, 30],
            warning: [30, 30, 30],
            error: [50, 50, 50, 50, 100]
        },
        
        // Selection Pattern (iOS UISelectionFeedbackGenerator style)
        selection: {
            tick: [5],
            change: [8]
        },
        
        // Custom App-Specific Patterns
        custom: {
            // Mala Counter
            malaTap: [15],
            malaComplete: [30, 50, 30, 50, 50, 50, 100],
            mala27: [20, 30, 20],
            mala54: [25, 40, 25, 40, 25],
            
            // Amritvela
            amritvelaPresent: [20, 30, 40, 50, 60],
            amritvelaExcellent: [10, 20, 10, 20, 10, 20, 50, 100],
            
            // Nitnem
            baniComplete: [15, 30, 15],
            nitnemComplete: [20, 40, 20, 40, 20, 40, 80],
            
            // Streak
            streakMilestone: [30, 50, 30, 50, 30, 50, 30, 100],
            streakBroken: [100, 50, 100],
            
            // Achievement
            achievementUnlock: [20, 30, 20, 30, 40, 50, 60, 100],
            
            // Timer/Countdown
            timerTick: [5],
            timerComplete: [30, 30, 50, 50, 100],
            
            // Button Interactions
            buttonPress: [12],
            buttonRelease: [8],
            longPress: [10, 10, 10, 10, 30],
            
            // Navigation
            tabSwitch: [6],
            modalOpen: [15, 10],
            modalClose: [10, 15],
            
            // Scroll
            scrollBounce: [10],
            pullToRefresh: [15, 25, 35],
            
            // Gestures
            swipeComplete: [20],
            pinchComplete: [15, 15],
            
            // Alerts
            reminder: [30, 100, 30, 100, 30],
            urgentReminder: [50, 50, 50, 50, 50, 100, 100]
        },
        
        // Spiritual/Meditation Patterns
        spiritual: {
            waheguru: [20, 100, 20, 100, 20, 100, 20], // 4 syllables
            satnam: [30, 80, 30], // 2 syllables
            moolMantar: [15, 50, 15, 50, 15, 50, 15, 50, 15, 50, 15, 50, 15], // Long mantra
            ardas: [40, 100, 40]
        }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 2: CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────
    
    config: {
        enabled: true,
        intensity: 1.0, // 0.0 to 1.0
        respectReducedMotion: true
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 3: INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Initialize haptic system
     */
    init() {
        // Check for reduced motion preference
        if (this.config.respectReducedMotion) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                this.config.enabled = false;
                console.log('Haptics disabled due to reduced motion preference');
            }
        }
        
        // Check for vibration API support
        if (!('vibrate' in navigator)) {
            this.config.enabled = false;
            console.log('Vibration API not supported');
        }
        
        return this;
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 4: CORE METHODS
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Play a haptic pattern
     * @param {string} category - Pattern category
     * @param {string} name - Pattern name
     */
    play(category, name) {
        if (!this.config.enabled) return false;
        
        const pattern = this.patterns[category]?.[name];
        if (!pattern) {
            console.warn(`Haptic pattern not found: ${category}.${name}`);
            return false;
        }
        
        // Apply intensity scaling
        const scaledPattern = this.applyIntensity(pattern);
        
        try {
            navigator.vibrate(scaledPattern);
            return true;
        } catch (error) {
            console.error('Haptic playback error:', error);
            return false;
        }
    },
    
    /**
     * Play a custom pattern array
     * @param {number[]} pattern - Vibration pattern array
     */
    playCustom(pattern) {
        if (!this.config.enabled || !Array.isArray(pattern)) return false;
        
        const scaledPattern = this.applyIntensity(pattern);
        
        try {
            navigator.vibrate(scaledPattern);
            return true;
        } catch (error) {
            console.error('Haptic playback error:', error);
            return false;
        }
    },
    
    /**
     * Apply intensity scaling to pattern
     * @param {number[]} pattern - Original pattern
     * @returns {number[]} Scaled pattern
     */
    applyIntensity(pattern) {
        if (this.config.intensity === 1.0) return pattern;
        
        return pattern.map((value, index) => {
            // Only scale vibration durations (even indices in pattern)
            if (index % 2 === 0) {
                return Math.round(value * this.config.intensity);
            }
            return value;
        });
    },
    
    /**
     * Stop any ongoing vibration
     */
    stop() {
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 5: CONVENIENCE METHODS
    // ─────────────────────────────────────────────────────────────────────────
    
    // Impact
    impactLight() { return this.play('impact', 'light'); },
    impactMedium() { return this.play('impact', 'medium'); },
    impactHeavy() { return this.play('impact', 'heavy'); },
    impactSoft() { return this.play('impact', 'soft'); },
    impactRigid() { return this.play('impact', 'rigid'); },
    
    // Notification
    notificationSuccess() { return this.play('notification', 'success'); },
    notificationWarning() { return this.play('notification', 'warning'); },
    notificationError() { return this.play('notification', 'error'); },
    
    // Selection
    selectionTick() { return this.play('selection', 'tick'); },
    selectionChange() { return this.play('selection', 'change'); },
    
    // Mala
    malaTap() { return this.play('custom', 'malaTap'); },
    malaComplete() { return this.play('custom', 'malaComplete'); },
    
    // Amritvela
    amritvelaPresent() { return this.play('custom', 'amritvelaPresent'); },
    amritvelaExcellent() { return this.play('custom', 'amritvelaExcellent'); },
    
    // Nitnem
    baniComplete() { return this.play('custom', 'baniComplete'); },
    nitnemComplete() { return this.play('custom', 'nitnemComplete'); },
    
    // Streak
    streakMilestone() { return this.play('custom', 'streakMilestone'); },
    
    // Achievement
    achievementUnlock() { return this.play('custom', 'achievementUnlock'); },
    
    // UI
    buttonPress() { return this.play('custom', 'buttonPress'); },
    tabSwitch() { return this.play('custom', 'tabSwitch'); },
    modalOpen() { return this.play('custom', 'modalOpen'); },
    modalClose() { return this.play('custom', 'modalClose'); },
    
    // Spiritual
    waheguru() { return this.play('spiritual', 'waheguru'); },
    satnam() { return this.play('spiritual', 'satnam'); },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 6: CONFIGURATION METHODS
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Enable/disable haptics
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        return this;
    },
    
    /**
     * Set intensity level
     * @param {number} intensity - 0.0 to 1.0
     */
    setIntensity(intensity) {
        this.config.intensity = Math.max(0, Math.min(1, intensity));
        return this;
    },
    
    /**
     * Check if haptics are supported and enabled
     */
    isAvailable() {
        return this.config.enabled && 'vibrate' in navigator;
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 7: PATTERN CREATION HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Create a rhythmic pattern
     * @param {number} pulses - Number of pulses
     * @param {number} onTime - Vibration duration
     * @param {number} offTime - Pause duration
     */
    createRhythm(pulses, onTime = 20, offTime = 40) {
        const pattern = [];
        for (let i = 0; i < pulses; i++) {
            pattern.push(onTime);
            if (i < pulses - 1) {
                pattern.push(offTime);
            }
        }
        return pattern;
    },
    
    /**
     * Create a crescendo pattern
     * @param {number} steps - Number of steps
     * @param {number} startIntensity - Starting duration
     * @param {number} endIntensity - Ending duration
     */
    createCrescendo(steps, startIntensity = 10, endIntensity = 50) {
        const pattern = [];
        const step = (endIntensity - startIntensity) / (steps - 1);
        
        for (let i = 0; i < steps; i++) {
            pattern.push(Math.round(startIntensity + (step * i)));
            if (i < steps - 1) {
                pattern.push(30); // Fixed pause
            }
        }
        return pattern;
    },
    
    /**
     * Create a decrescendo pattern
     * @param {number} steps - Number of steps
     * @param {number} startIntensity - Starting duration
     * @param {number} endIntensity - Ending duration
     */
    createDecrescendo(steps, startIntensity = 50, endIntensity = 10) {
        return this.createCrescendo(steps, startIntensity, endIntensity);
    },
    
    /**
     * Register a custom pattern
     * @param {string} name - Pattern name
     * @param {number[]} pattern - Pattern array
     */
    registerPattern(name, pattern) {
        this.patterns.custom[name] = pattern;
        return this;
    }
};

// Initialize on load
HapticPatterns.init();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HapticPatterns;
}

if (typeof window !== 'undefined') {
    window.HapticPatterns = HapticPatterns;
}