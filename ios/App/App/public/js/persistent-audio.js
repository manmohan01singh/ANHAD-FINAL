/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO - PERSISTENT AUDIO MANAGER
 * Handles audio playback that continues even when navigating between pages
 * 
 * Features:
 * - Fast audio loading with preloading
 * - Background playback across page navigation
 * - Playback position memory
 * - Media Session API for lock screen controls
 * - Offline support via Service Worker
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

class PersistentAudioManager {
    constructor() {
        // Audio configuration
        this.audioFiles = [
            { src: 'Audio/audio1.mp3', title: 'Gurbani Kirtan 1', artist: 'Sri Darbar Sahib' },
            { src: 'Audio/audio2.mp3', title: 'Gurbani Kirtan 2', artist: 'Sri Darbar Sahib' },
            { src: 'Audio/audio3.mpeg', title: 'Gurbani Kirtan 3', artist: 'Sri Darbar Sahib' },
            { src: 'Audio/audio4.mpeg', title: 'Gurbani Kirtan 4', artist: 'Sri Darbar Sahib' },
            { src: 'Audio/audio5.mpeg', title: 'Gurbani Kirtan 5', artist: 'Sri Darbar Sahib' },
            { src: 'Audio/audio6.mpeg', title: 'Gurbani Kirtan 6', artist: 'Sri Darbar Sahib' }
        ];

        // State
        this.audio = null;
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isLoading = false;
        this.volume = 0.8;
        this.currentTime = 0;
        this.duration = 0;
        this.preloadedAudios = new Map();

        // Callbacks
        this.onPlayStateChange = null;
        this.onTimeUpdate = null;
        this.onTrackChange = null;
        this.onLoadingChange = null;
        this.onError = null;

        // Storage keys
        this.STORAGE_KEYS = {
            VOLUME: 'gurbani_volume',
            TRACK_INDEX: 'gurbani_track_index',
            CURRENT_TIME: 'gurbani_current_time',
            IS_PLAYING: 'gurbani_is_playing'
        };

        this.init();
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    init() {
        // Load saved state
        this.loadState();

        // Create audio element
        this.createAudioElement();

        // Preload audio files for instant playback
        this.preloadAllAudio();

        // Setup Media Session for lock screen controls
        this.setupMediaSession();

        // Save state periodically
        this.startStateAutoSave();

        // Handle page visibility for battery optimization
        this.setupVisibilityHandler();

        console.log('[PersistentAudio] Initialized');
    }

    createAudioElement() {
        this.audio = new Audio();
        this.audio.preload = 'auto';
        this.audio.volume = this.volume;

        // Event listeners
        this.audio.addEventListener('loadstart', () => {
            this.isLoading = true;
            this.notifyLoadingChange(true);
        });

        this.audio.addEventListener('canplay', () => {
            this.isLoading = false;
            this.notifyLoadingChange(false);
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
        });

        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.notifyTimeUpdate();
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.notifyPlayStateChange();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.notifyPlayStateChange();
        });

        this.audio.addEventListener('ended', () => {
            this.next();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('[PersistentAudio] Error:', e);
            this.isLoading = false;
            this.notifyLoadingChange(false);
            this.notifyError('Failed to load audio');

            // Try next track on error
            setTimeout(() => this.next(), 2000);
        });

        // Load last played track
        this.loadTrack(this.currentTrackIndex, false);
    }

    // ═══════════════════════════════════════════════════════════════
    // AUDIO PRELOADING - For Instant Playback
    // ═══════════════════════════════════════════════════════════════

    preloadAllAudio() {
        console.log('[PersistentAudio] Preloading all audio files...');

        this.audioFiles.forEach((file, index) => {
            this.preloadTrack(index);
        });
    }

    preloadTrack(index) {
        const file = this.audioFiles[index];
        if (!file || this.preloadedAudios.has(index)) return;

        const preloadAudio = new Audio();
        preloadAudio.preload = 'auto';

        // Use absolute path based on current location
        const basePath = this.getBasePath();
        preloadAudio.src = `${basePath}${file.src}`;

        // Store reference
        this.preloadedAudios.set(index, preloadAudio);

        preloadAudio.addEventListener('canplaythrough', () => {
            console.log(`[PersistentAudio] Preloaded: ${file.title}`);
        });
    }

    getBasePath() {
        // Determine base path based on current page location
        const path = window.location.pathname;

        // If we're in a subdirectory, go back to frontend
        const pathParts = path.split('/');
        pathParts.pop(); // Remove current file

        // Count how many levels deep we are from frontend
        let levels = 0;
        for (const part of pathParts.reverse()) {
            if (part === 'frontend') break;
            if (part && part !== '') levels++;
        }

        return levels > 0 ? '../'.repeat(levels) : './';
    }

    // ═══════════════════════════════════════════════════════════════
    // PLAYBACK CONTROLS
    // ═══════════════════════════════════════════════════════════════

    async loadTrack(index, autoPlay = true) {
        if (index < 0 || index >= this.audioFiles.length) {
            index = 0;
        }

        const file = this.audioFiles[index];
        this.currentTrackIndex = index;

        console.log(`[PersistentAudio] Loading track ${index}: ${file.title}`);

        // Use preloaded audio if available
        const preloaded = this.preloadedAudios.get(index);
        if (preloaded && preloaded.readyState >= 4) {
            // Clone the preloaded audio for playing
            this.audio.src = preloaded.src;
        } else {
            const basePath = this.getBasePath();
            this.audio.src = `${basePath}${file.src}`;
        }

        // If we have a saved position for this track, seek to it
        const savedTime = this.getSavedCurrentTime();
        if (savedTime > 0 && savedTime < this.duration - 10) {
            this.audio.currentTime = savedTime;
        }

        if (autoPlay) {
            await this.play();
        }

        this.notifyTrackChange();
        this.updateMediaSession();
    }

    async play() {
        try {
            this.isLoading = true;
            this.notifyLoadingChange(true);

            await this.audio.play();

            this.isPlaying = true;
            this.isLoading = false;
            this.notifyPlayStateChange();
            this.notifyLoadingChange(false);

            console.log('[PersistentAudio] Playing');
        } catch (error) {
            console.error('[PersistentAudio] Play failed:', error);
            this.isLoading = false;
            this.notifyLoadingChange(false);

            // User interaction might be needed
            if (error.name === 'NotAllowedError') {
                this.notifyError('Tap play to start audio');
            }
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.notifyPlayStateChange();
        console.log('[PersistentAudio] Paused');
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    next() {
        const nextIndex = (this.currentTrackIndex + 1) % this.audioFiles.length;
        this.loadTrack(nextIndex, true);
    }

    previous() {
        // If more than 3 seconds in, restart current track
        if (this.currentTime > 3) {
            this.seek(0);
            return;
        }

        const prevIndex = (this.currentTrackIndex - 1 + this.audioFiles.length) % this.audioFiles.length;
        this.loadTrack(prevIndex, true);
    }

    seek(time) {
        if (isNaN(time) || !isFinite(time)) return;
        this.audio.currentTime = Math.max(0, Math.min(time, this.duration));
    }

    seekPercent(percent) {
        const time = (percent / 100) * this.duration;
        this.seek(time);
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.audio.volume = this.volume;
        this.saveState();
    }

    // ═══════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════

    getCurrentTrack() {
        return this.audioFiles[this.currentTrackIndex] || null;
    }

    getProgress() {
        if (!this.duration || this.duration === 0) return 0;
        return (this.currentTime / this.duration) * 100;
    }

    formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE PERSISTENCE
    // ═══════════════════════════════════════════════════════════════

    loadState() {
        try {
            this.volume = parseFloat(localStorage.getItem(this.STORAGE_KEYS.VOLUME)) || 0.8;
            this.currentTrackIndex = parseInt(localStorage.getItem(this.STORAGE_KEYS.TRACK_INDEX)) || 0;
            console.log('[PersistentAudio] State loaded');
        } catch (e) {
            console.warn('[PersistentAudio] Failed to load state:', e);
        }
    }

    getSavedCurrentTime() {
        try {
            return parseFloat(localStorage.getItem(this.STORAGE_KEYS.CURRENT_TIME)) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveState() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.VOLUME, this.volume.toString());
            localStorage.setItem(this.STORAGE_KEYS.TRACK_INDEX, this.currentTrackIndex.toString());
            localStorage.setItem(this.STORAGE_KEYS.CURRENT_TIME, this.currentTime.toString());
            localStorage.setItem(this.STORAGE_KEYS.IS_PLAYING, this.isPlaying.toString());
        } catch (e) {
            console.warn('[PersistentAudio] Failed to save state:', e);
        }
    }

    startStateAutoSave() {
        // Save state every 5 seconds
        this._autoSaveInterval = setInterval(() => {
            if (this.isPlaying) {
                this.saveState();
            }
        }, 5000);

        // Save on page unload
        window.addEventListener('beforeunload', () => this.saveState());
        window.addEventListener('pagehide', () => this.saveState());
    }

    // ═══════════════════════════════════════════════════════════════
    // MEDIA SESSION (Lock Screen Controls)
    // ═══════════════════════════════════════════════════════════════

    setupMediaSession() {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime) this.seek(details.seekTime);
        });

        this.updateMediaSession();
    }

    updateMediaSession() {
        if (!('mediaSession' in navigator)) return;

        const track = this.getCurrentTrack();
        if (!track) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: 'Gurbani Radio',
            artwork: [
                { src: 'assets/sacred-symbol.png', sizes: '96x96', type: 'image/png' },
                { src: 'assets/sacred-symbol.png', sizes: '128x128', type: 'image/png' },
                { src: 'assets/sacred-symbol.png', sizes: '192x192', type: 'image/png' },
                { src: 'assets/sacred-symbol.png', sizes: '256x256', type: 'image/png' },
                { src: 'assets/sacred-symbol.png', sizes: '384x384', type: 'image/png' },
                { src: 'assets/sacred-symbol.png', sizes: '512x512', type: 'image/png' }
            ]
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // VISIBILITY HANDLER (Battery Optimization)
    // ═══════════════════════════════════════════════════════════════

    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveState();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // CALLBACKS / NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════

    notifyPlayStateChange() {
        if (typeof this.onPlayStateChange === 'function') {
            this.onPlayStateChange(this.isPlaying);
        }
    }

    notifyTimeUpdate() {
        if (typeof this.onTimeUpdate === 'function') {
            this.onTimeUpdate({
                currentTime: this.currentTime,
                duration: this.duration,
                progress: this.getProgress(),
                formattedCurrent: this.formatTime(this.currentTime),
                formattedDuration: this.formatTime(this.duration)
            });
        }
    }

    notifyTrackChange() {
        if (typeof this.onTrackChange === 'function') {
            this.onTrackChange(this.getCurrentTrack(), this.currentTrackIndex);
        }
    }

    notifyLoadingChange(isLoading) {
        if (typeof this.onLoadingChange === 'function') {
            this.onLoadingChange(isLoading);
        }
    }

    notifyError(message) {
        if (typeof this.onError === 'function') {
            this.onError(message);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════

    destroy() {
        this.saveState();
        this.pause();
        this.preloadedAudios.forEach(audio => {
            audio.src = '';
        });
        this.preloadedAudios.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL INSTANCE - Available across all pages
// ═══════════════════════════════════════════════════════════════════════════════

// Make sure we only create one instance
if (!window.gurbaniAudio) {
    window.gurbaniAudio = new PersistentAudioManager();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistentAudioManager;
}
