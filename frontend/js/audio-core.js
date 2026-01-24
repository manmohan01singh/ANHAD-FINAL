/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║     ੴ GURBANI RADIO - CORE AUDIO ENGINE                                        ║
 * ║     Global Audio Singleton & State Management                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════
// UTILS & CONFIG (Extracted from script.js)
// ═══════════════════════════════════════════════════════════════════════

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;

const AUDIO_CONFIG = {
    baseUrl: (() => {
        try {
            const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
            const onBackendPort = window.location.port === '3000';
            if (isLocalhost && !onBackendPort) {
                return `${window.location.protocol}//${window.location.hostname}:3000/audio`;
            }
        } catch (e) { }
        return '/audio';
    })(),

    audioFiles: Array.from({ length: 40 }, (_, i) => `day-${i + 1}.webm`),

    trackInfo: Array.from({ length: 40 }, (_, i) => ({
        title: `Day ${i + 1} - Gurbani Kirtan`,
        artist: 'Divine Shabad',
        estimatedDuration: 3600
    })),

    getAudioUrl(filename) {
        return `${this.baseUrl}/${filename}`;
    },

    getTrack(index) {
        const safeIndex = ((index % this.audioFiles.length) + this.audioFiles.length) % this.audioFiles.length;
        return {
            url: this.getAudioUrl(this.audioFiles[safeIndex]),
            info: this.trackInfo[safeIndex],
            index: safeIndex,
            filename: this.audioFiles[safeIndex]
        };
    },

    getRandomIndex(currentIndex = -1) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.audioFiles.length);
        } while (newIndex === currentIndex && this.audioFiles.length > 1);
        return newIndex;
    },

    get totalTracks() {
        return this.audioFiles.length;
    }
};

const Utils = {
    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    },
    throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },
    random(min, max) { return Math.random() * (max - min) + min; },
    clamp(value, min, max) { return Math.min(Math.max(value, min), max); },
    lerp(start, end, factor) { return start + (end - start) * factor; },
    mapRange(value, inMin, inMax, outMin, outMax) { return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin; },

    storage: {
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); return true; }
            catch (e) { console.warn('[Storage] Failed to save:', e); return false; }
        },
        get(key, defaultValue = null) {
            try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; }
            catch (e) { return defaultValue; }
        },
        remove(key) { try { localStorage.removeItem(key); } catch (e) { } }
    },

    createRipple(element, event) {
        if (isMobile) {
            element.style.opacity = '0.7';
            setTimeout(() => element.style.opacity = '1', 150);
            return;
        }
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        ripple.style.cssText = `position: absolute; width: ${size}px; height: ${size}px; left: ${x}px; top: ${y}px; background: radial-gradient(circle, rgba(247, 198, 52, 0.4) 0%, transparent 70%); border-radius: 50%; transform: scale(0); animation: ripple-expand 0.6s ease-out forwards; pointer-events: none;`;
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    },

    escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
};

// ═══════════════════════════════════════════════════════════════════════
// CORE CLASSES
// ═══════════════════════════════════════════════════════════════════════

class EventEmitter {
    constructor() { this.events = new Map(); }
    on(event, callback) {
        if (!this.events.has(event)) this.events.set(event, new Set());
        this.events.get(event).add(callback);
        return () => this.off(event, callback);
    }
    off(event, callback) {
        if (this.events.has(event)) this.events.get(event).delete(callback);
    }
    emit(event, data) {
        if (this.events.has(event)) {
            // Convert Set to Array to avoid issues if listeners remove themselves during emit
            Array.from(this.events.get(event)).forEach(callback => {
                try { callback(data); } catch (e) { console.error(`[EventEmitter] Error in ${event}:`, e); }
            });
        }
    }
    once(event, callback) {
        const onceCallback = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };
        this.on(event, onceCallback);
    }
}

class StateManager extends EventEmitter {
    constructor(initialState = {}) {
        super();
        this._state = new Proxy(initialState, {
            set: (target, property, value) => {
                const oldValue = target[property];
                target[property] = value;
                if (oldValue !== value) {
                    this.emit('change', { property, value, oldValue });
                    this.emit(`change:${property}`, { value, oldValue });
                }
                return true;
            }
        });
    }
    get state() { return this._state; }
    setState(updates) {
        Object.entries(updates).forEach(([key, value]) => { this._state[key] = value; });
    }
}

class VirtualLiveManager extends EventEmitter {
    constructor() {
        super();
        this.broadcastStartTime = this.loadBroadcastStart();
        this.trackDurations = new Map();
        this.defaultDuration = 3600;
        this.pausedAt = null;
        this.isLive = true;
        this.liveThreshold = 5;
    }

    loadBroadcastStart() {
        let startTime = Utils.storage.get('broadcastStartTime');
        if (!startTime) {
            const now = new Date();
            // Use consistent epoch start to ensure all users hear same thing roughly
            startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
            Utils.storage.set('broadcastStartTime', startTime);
        }
        return startTime;
    }

    setTrackDuration(trackIndex, duration) {
        if (duration && isFinite(duration) && duration > 0) this.trackDurations.set(trackIndex, duration);
    }
    getTrackDuration(trackIndex) {
        return this.trackDurations.get(trackIndex) || AUDIO_CONFIG.trackInfo[trackIndex]?.estimatedDuration || this.defaultDuration;
    }
    getTotalPlaylistDuration() {
        let total = 0;
        for (let i = 0; i < AUDIO_CONFIG.totalTracks; i++) total += this.getTrackDuration(i);
        return total;
    }
    getCurrentLivePosition() {
        const now = Date.now();
        const elapsedSeconds = (now - this.broadcastStartTime) / 1000;
        const totalPlaylistDuration = this.getTotalPlaylistDuration();
        const positionInPlaylist = elapsedSeconds % totalPlaylistDuration;
        let accumulatedTime = 0;
        for (let i = 0; i < AUDIO_CONFIG.totalTracks; i++) {
            const trackDuration = this.getTrackDuration(i);
            if (accumulatedTime + trackDuration > positionInPlaylist) {
                return { trackIndex: i, position: positionInPlaylist - accumulatedTime, totalElapsed: elapsedSeconds };
            }
            accumulatedTime += trackDuration;
        }
        return { trackIndex: 0, position: 0, totalElapsed: elapsedSeconds };
    }

    // ... Helper methods for resume/pause/check omitted for brevity but required logic included below ...
    onPause(idx, pos) {
        this.pausedAt = { time: Date.now(), trackIndex: idx, position: pos };
        this.isLive = false;
        this.emit('liveStatusChange', { isLive: false });
    }

    goToLive() {
        this.pausedAt = null;
        this.isLive = true;
        this.emit('liveStatusChange', { isLive: true });
        return this.getCurrentLivePosition();
    }

    checkIfLive(currentTrackIndex, currentPosition) {
        const livePos = this.getCurrentLivePosition();
        if (currentTrackIndex !== livePos.trackIndex) this.isLive = false;
        else {
            const diff = Math.abs(currentPosition - livePos.position);
            this.isLive = diff < this.liveThreshold;
        }
        return this.isLive;
    }
}

class AudioEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            autoPlay: config.autoPlay !== false,
            shuffle: config.shuffle || false,
            repeat: config.repeat || 'all',
            virtualLive: config.virtualLive !== false,
            ...config
        };

        // Single Audio Instance Enforced
        this.audio = null;
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = Utils.storage.get('volume', 0.8);
        this.virtualLive = new VirtualLiveManager();
        this.isLive = true;
        this.playHistory = [];

        // Bindings
        this._onTimeUpdate = this._onTimeUpdate.bind(this);
    }

    createAudioElement() {
        if (this.audio) return this.audio; // Singleton!

        this.audio = new Audio();
        this.audio.preload = 'auto';
        this.audio.volume = this.volume;
        this.audio.crossOrigin = 'anonymous';

        this._attachEvents();
        return this.audio;
    }

    _attachEvents() {
        if (!this.audio) return;
        this.audio.addEventListener('timeupdate', this._onTimeUpdate);
        this.audio.addEventListener('playing', () => { this.isPlaying = true; this.emit('playing', this.getCurrentTrackInfo()); });
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.config.virtualLive) this.virtualLive.onPause(this.currentTrackIndex, this.audio.currentTime);
            this.emit('paused');
        });
        this.audio.addEventListener('ended', () => this.next());
        this.audio.addEventListener('loadedmetadata', () => {
            this.virtualLive.setTrackDuration(this.currentTrackIndex, this.audio.duration);
            this.emit('durationchange', { duration: this.audio.duration });
        });
        this.audio.addEventListener('volumechange', () => this.emit('volumechange', { volume: this.audio.volume }));
    }

    _onTimeUpdate() {
        if (!this.audio) return;
        const info = {
            currentTime: this.audio.currentTime,
            duration: this.audio.duration || 0,
            isLive: this.isLive
        };
        // Check live status
        if (this.config.virtualLive && this.isPlaying) {
            this.virtualLive.checkIfLive(this.currentTrackIndex, this.audio.currentTime);
        }
        this.emit('timeupdate', info);
    }

    getCurrentTrackInfo() {
        const track = AUDIO_CONFIG.getTrack(this.currentTrackIndex);
        return {
            ...track.info,
            index: this.currentTrackIndex,
            url: track.url,
            isLive: this.isLive
        };
    }

    async loadTrack(index, autoPlay = true, seekPosition = 0) {
        this.currentTrackIndex = index;
        if (!this.audio) this.createAudioElement();

        // Prevent reloading if same track and close position
        const track = AUDIO_CONFIG.getTrack(index);
        if (this.audio.src.endsWith(track.filename) && Math.abs(this.audio.currentTime - seekPosition) < 2) {
            if (autoPlay && this.audio.paused) this.audio.play();
            return;
        }

        this.audio.src = track.url;
        this.audio.currentTime = seekPosition;

        this.emit('trackchange', this.getCurrentTrackInfo());

        if (autoPlay) {
            try { await this.audio.play(); }
            catch (e) { console.warn("Auto-play prevented", e); }
        }
    }

    async goLive() {
        if (this.isLive && this.isPlaying) {
            console.log("Already Live and Playing - Idempotent Action");
            return; // Fix Problem 3
        }

        const livePos = this.virtualLive.goToLive();
        this.isLive = true;

        await this.loadTrack(livePos.trackIndex, true, livePos.position);
        this.emit('liveStatusChange', { isLive: true });
    }

    toggle() {
        if (!this.audio) { this.goLive(); return; }
        if (this.audio.paused) this.audio.play(); else this.audio.pause();
    }

    stop() {
        if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; }
        this.isPlaying = false;
        this.emit('stopped');
    }

    next() {
        // Logic for next track
        const nextIndex = (this.currentTrackIndex + 1) % AUDIO_CONFIG.totalTracks;
        this.loadTrack(nextIndex, true, 0);
    }

    prev() {
        const prevIndex = (this.currentTrackIndex - 1 + AUDIO_CONFIG.totalTracks) % AUDIO_CONFIG.totalTracks;
        this.loadTrack(prevIndex, true, 0);
    }
}

// EXPOSE GLOBALLY
window.GurbaniAudioCore = {
    AudioEngine,
    AUDIO_CONFIG,
    Utils,
    EventEmitter,
    VirtualLiveManager
};
