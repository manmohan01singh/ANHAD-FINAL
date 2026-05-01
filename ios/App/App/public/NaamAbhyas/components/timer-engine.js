/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TIMER ENGINE - Precision Timer for Naam Abhyas Meditation Sessions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

class TimerEngine {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pauseTime = null;
        this.duration = 0;
        this.remaining = 0;
        this.intervalId = null;
        this.callbacks = {
            onTick: null,
            onComplete: null,
            onPause: null,
            onResume: null
        };
    }

    /**
     * Start the timer
     * @param {number} durationSeconds - Duration in seconds
     * @param {object} callbacks - Callback functions
     */
    start(durationSeconds, callbacks = {}) {
        if (this.isRunning) {
            this.stop();
        }

        this.duration = durationSeconds;
        this.remaining = durationSeconds;
        this.startTime = Date.now();
        this.isRunning = true;
        this.isPaused = false;
        this.callbacks = { ...this.callbacks, ...callbacks };

        this.intervalId = setInterval(() => {
            this.tick();
        }, 100); // Update every 100ms for smooth display

        // Initial tick
        this.tick();

        return this;
    }

    /**
     * Internal tick function
     */
    tick() {
        if (!this.isRunning || this.isPaused) return;

        const elapsed = (Date.now() - this.startTime) / 1000;
        this.remaining = Math.max(0, this.duration - elapsed);

        // Call tick callback
        if (this.callbacks.onTick) {
            this.callbacks.onTick({
                remaining: this.remaining,
                elapsed: elapsed,
                duration: this.duration,
                progress: (elapsed / this.duration) * 100,
                formatted: this.formatTime(this.remaining)
            });
        }

        // Check for completion
        if (this.remaining <= 0) {
            this.complete();
        }
    }

    /**
     * Pause the timer
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.pauseTime = Date.now();

        if (this.callbacks.onPause) {
            this.callbacks.onPause({
                remaining: this.remaining,
                formatted: this.formatTime(this.remaining)
            });
        }

        return this;
    }

    /**
     * Resume the timer
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;

        // Adjust start time to account for pause
        const pauseDuration = Date.now() - this.pauseTime;
        this.startTime += pauseDuration;
        this.isPaused = false;

        if (this.callbacks.onResume) {
            this.callbacks.onResume({
                remaining: this.remaining,
                formatted: this.formatTime(this.remaining)
            });
        }

        return this;
    }

    /**
     * Stop the timer
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        this.isPaused = false;

        return this;
    }

    /**
     * Complete the timer
     */
    complete() {
        this.stop();

        if (this.callbacks.onComplete) {
            this.callbacks.onComplete({
                duration: this.duration,
                actualDuration: (Date.now() - this.startTime) / 1000
            });
        }
    }

    /**
     * End timer early
     * @returns {object} Timer data
     */
    endEarly() {
        const data = {
            duration: this.duration,
            elapsed: this.duration - this.remaining,
            remaining: this.remaining,
            endedEarly: true
        };

        this.stop();

        return data;
    }

    /**
     * Add time to the timer
     * @param {number} seconds - Seconds to add
     */
    addTime(seconds) {
        this.duration += seconds;
        return this;
    }

    /**
     * Format seconds to MM:SS
     * @param {number} seconds - Seconds to format
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Get current timer state
     * @returns {object} Timer state
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            remaining: this.remaining,
            duration: this.duration,
            progress: ((this.duration - this.remaining) / this.duration) * 100,
            formatted: this.formatTime(this.remaining)
        };
    }
}

// Export for global usage
window.TimerEngine = TimerEngine;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimerEngine;
}
