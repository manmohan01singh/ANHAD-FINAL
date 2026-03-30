/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUDIO MANAGER - Sound Management for Naam Abhyas
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

class AudioManager {
    constructor() {
        this.sounds = {};
        this.audioContext = null;
        this.isInitialized = false;
        this.volume = 0.7;

        this.init();
    }

    /**
     * Initialize audio manager
     */
    async init() {
        // Pre-define available sounds
        this.soundPaths = {
            'gentle-bell': 'assets/sounds/gentle-bell.mp3',
            'tibetan-bowl': 'assets/sounds/tibetan-bowl.mp3',
            'soft-chime': 'assets/sounds/soft-chime.mp3',
            'om-sound': 'assets/sounds/om-sound.mp3',
            'start-bell': 'assets/sounds/start-bell.mp3',
            'end-bell': 'assets/sounds/end-bell.mp3',
            'ambient-waheguru': 'assets/sounds/ambient-waheguru.mp3'
        };

        // Initialize Audio Context on first user interaction
        document.addEventListener('click', () => this.initAudioContext(), { once: true });
        document.addEventListener('touchstart', () => this.initAudioContext(), { once: true });

        this.isInitialized = true;
    }

    /**
     * Initialize Web Audio Context
     */
    initAudioContext() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio Context initialized');
        } catch (e) {
            console.log('AudioContext not available:', e);
        }
    }

    /**
     * Preload a sound
     * @param {string} soundId - Sound identifier
     */
    async preload(soundId) {
        if (this.sounds[soundId]) return this.sounds[soundId];

        const path = this.soundPaths[soundId];
        if (!path) {
            console.warn(`Sound "${soundId}" not found`);
            return null;
        }

        try {
            const audio = new Audio(path);
            audio.preload = 'auto';
            await audio.load();
            this.sounds[soundId] = audio;
            return audio;
        } catch (e) {
            console.error(`Failed to preload sound "${soundId}":`, e);
            return null;
        }
    }

    /**
     * Preload all sounds
     */
    async preloadAll() {
        const promises = Object.keys(this.soundPaths).map(id => this.preload(id));
        await Promise.all(promises);
        console.log('🔊 All sounds preloaded');
    }

    /**
     * Play a sound
     * @param {string} soundId - Sound identifier
     * @param {object} options - Play options
     */
    async play(soundId, options = {}) {
        const { volume = this.volume, loop = false, onEnded = null } = options;

        // Get or create audio element
        let audio = this.sounds[soundId];
        if (!audio) {
            audio = await this.preload(soundId);
            if (!audio) {
                // Try creating directly
                const path = this.soundPaths[soundId];
                if (!path) return null;

                audio = new Audio(path);
            }
        }

        try {
            // Reset to start
            audio.currentTime = 0;
            audio.volume = volume;
            audio.loop = loop;

            // Play
            await audio.play();

            // Handle ended event
            if (onEnded) {
                audio.onended = onEnded;
            }

            return audio;
        } catch (e) {
            console.log(`Failed to play sound "${soundId}":`, e);
            return null;
        }
    }

    /**
     * Stop a sound
     * @param {string} soundId - Sound identifier
     */
    stop(soundId) {
        const audio = this.sounds[soundId];
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        Object.values(this.sounds).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    /**
     * Pause a sound
     * @param {string} soundId - Sound identifier
     */
    pause(soundId) {
        const audio = this.sounds[soundId];
        if (audio) {
            audio.pause();
        }
    }

    /**
     * Resume a sound
     * @param {string} soundId - Sound identifier
     */
    resume(soundId) {
        const audio = this.sounds[soundId];
        if (audio && audio.paused) {
            audio.play();
        }
    }

    /**
     * Set global volume
     * @param {number} volume - Volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        // Update all loaded sounds
        Object.values(this.sounds).forEach(audio => {
            audio.volume = this.volume;
        });
    }

    /**
     * Get global volume
     * @returns {number} Current volume
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Play notification sound with haptic feedback
     * @param {string} soundId - Sound identifier
     */
    async playNotification(soundId) {
        // Play sound
        await this.play(soundId);

        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    /**
     * Play start meditation sound
     */
    async playStartBell() {
        await this.play('start-bell');
    }

    /**
     * Play end meditation sound
     */
    async playEndBell() {
        await this.play('end-bell');
    }

    /**
     * Play ambient Waheguru (looped)
     * @param {number} volume - Volume for ambient sound
     */
    async playAmbient(volume = 0.3) {
        return await this.play('ambient-waheguru', {
            volume,
            loop: true
        });
    }

    /**
     * Stop ambient sound
     */
    stopAmbient() {
        this.stop('ambient-waheguru');
    }

    /**
     * Get available sounds
     * @returns {Array} List of available sound IDs
     */
    getAvailableSounds() {
        return Object.keys(this.soundPaths);
    }

    /**
     * Check if a sound is loaded
     * @param {string} soundId - Sound identifier
     * @returns {boolean}
     */
    isLoaded(soundId) {
        return !!this.sounds[soundId];
    }

    /**
     * Generate a simple beep using Web Audio API
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume (0-1)
     */
    beep(frequency = 440, duration = 0.2, volume = 0.5) {
        if (!this.audioContext) {
            this.initAudioContext();
        }

        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + duration
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Beep failed:', e);
        }
    }

    /**
     * Play a gentle chime pattern
     */
    playChime() {
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => this.beep(freq, 0.3, 0.4), i * 150);
        });
    }

    /**
     * Dispose all audio resources
     */
    dispose() {
        this.stopAll();
        this.sounds = {};

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// Export for global usage
window.AudioManager = AudioManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
