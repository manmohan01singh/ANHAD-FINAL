/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║     ੴ GURBANI RADIO - FIXED VERSION v6.4 ੴ                                   ║
 * ║     ALL NAVIGATION PATHS FIXED - FULLY WORKING                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   MOBILE PERFORMANCE SYSTEM
   ═══════════════════════════════════════════════════════════════════════ */

// isMobile is declared in audio-core.js (loaded first) — do not redeclare
const isSlowDevice = navigator.deviceMemory ? navigator.deviceMemory < 4 : isMobile;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const shouldReduceAnimations = isMobile || isSlowDevice || prefersReducedMotion;

console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
console.log(`⚡ Performance mode: ${shouldReduceAnimations ? 'POWER SAVING' : 'FULL'}`);

if (isMobile) {
    document.documentElement.classList.add('is-mobile');
    document.body.classList.add('mobile-device');
}

if (shouldReduceAnimations) {
    document.documentElement.classList.add('reduce-motion');
}

/* ═══════════════════════════════════════════════════════════════════════
   NAVIGATION PATHS CONFIGURATION - FIXED FOR YOUR DIRECTORY STRUCTURE
   ═══════════════════════════════════════════════════════════════════════ */


const NAV_PATHS = {
    // All paths relative to frontend root
    dailyHukamnama: './Hukamnama/daily-hukamnama.html',
    nitnem: './nitnem/indexbani.html',
    nitnemTracker: './NitnemTracker/nitnem-tracker.html',
    sehajPaath: './SehajPaath/sehaj-paath.html',
    gurbaniKhoj: './GurbaniKhoj/gurbani-khoj.html',
    calendar: './Calendar/Gurupurab-Calendar.html',
    notes: './Notes/notes.html',
    reminders: './reminders/smart-reminders.html'
};


// Validate paths on load (development helper)
function validateNavPaths() {
    console.log('[NAV] Navigation paths configured:');
    Object.entries(NAV_PATHS).forEach(([key, path]) => {
        console.log(`  ${key}: ${path}`);
    });
}

// AUDIO_CONFIG is declared in audio-core.js (loaded first) — do not redeclare

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

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
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },

    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    haptic(style = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30],
                success: [10, 50, 10],
                error: [50, 30, 50, 30, 50],
                warning: [30, 50, 30]
            };
            navigator.vibrate(patterns[style] || patterns.light);
        }
    },

    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('[Storage] Failed to save:', e);
                return false;
            }
        },
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('[Storage] Failed to remove:', e);
            }
        }
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

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(247, 198, 52, 0.4) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-expand 0.6s ease-out forwards;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    },

    escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Navigation helper with error handling
    navigateTo(path, loadingText = 'Loading...') {
        console.log(`[NAV] Navigating to: ${path}`);

        // Show loading overlay
        const overlay = document.getElementById('navLoadingOverlay');
        if (overlay) {
            const textEl = overlay.querySelector('.nav-loading-text');
            if (textEl) textEl.textContent = loadingText;
            overlay.style.display = 'flex';
            requestAnimationFrame(() => overlay.style.opacity = '1');
        }

        // Navigate after brief delay for visual feedback
        setTimeout(() => {
            window.location.href = path;
        }, 100);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT EMITTER
// ═══════════════════════════════════════════════════════════════════════════════

class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`[EventEmitter] Error in ${event}:`, e);
                }
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

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

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

    get state() {
        return this._state;
    }

    setState(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this._state[key] = value;
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER-SYNCED LIVE MANAGER
// Replaces client-side VirtualLiveManager with server-authoritative positions.
// All devices hear the same audio at the same moment.
// ═══════════════════════════════════════════════════════════════════════════════

// Generate/retrieve unique listener ID
const LISTENER_ID = (() => {
    let id = Utils.storage.get('gurbani_listener_id');
    if (!id) {
        id = 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
        Utils.storage.set('gurbani_listener_id', id);
    }
    return id;
})();

// API base URL - Smart resolution for CORS and mobile apps
const API_BASE = (() => {
    try {
        const host = window.location.hostname;
        const port = window.location.port;
        if (port === '3000' || port === '3001') return ''; // Use relative path if hitting local node server
        if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`; // Local network IP testing
        return 'https://anhad-final.onrender.com'; // All other scenarios (mobile app, production)
    } catch (e) { }
    return 'https://anhad-final.onrender.com';
})();

class VirtualLiveManager extends EventEmitter {
    constructor() {
        super();
        this.serverEpoch = null;
        this.trackDurations = new Map();
        this.defaultDuration = 3600;
        this.pausedAt = null;
        this.isLive = true;
        this.liveThreshold = 5;
        this.lastSyncData = null;
        this.lastSyncTime = 0;
        this.listenersCount = 0;
        this.heartbeatInterval = null;
        this.driftCheckInterval = null;
        this.serverSynced = false;

        // Load cached epoch as fallback
        this.broadcastStartTime = this.loadBroadcastStart();

        // Try to sync with server immediately
        this.syncWithServer();

        // Start heartbeat
        this.startHeartbeat();
    }

    // Universal fallback epoch to guarantee all devices are perfectly synced even offline
    loadBroadcastStart() {
        return 1704067200000; // Jan 1, 2024
    }

    /**
     * Sync with server to get the authoritative epoch and live position.
     */
    async syncWithServer() {
        try {
            const startTime = Date.now();
            const response = await fetch(`${API_BASE}/api/radio/live`);
            const endTime = Date.now();

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const latencyMs = (endTime - startTime) / 2;

            // Store server epoch — this is the single source of truth
            this.serverEpoch = data.epoch;
            this.broadcastStartTime = data.epoch;
            Utils.storage.set('broadcastStartTime', data.epoch);

            // Store all track durations from server
            if (data.trackDurations) {
                Object.entries(data.trackDurations).forEach(([idx, dur]) => {
                    this.trackDurations.set(Number(idx), dur);
                });
            }

            this.lastSyncData = data;
            this.lastSyncTime = Date.now();
            this.listenersCount = data.listenersCount || 0;
            this.serverSynced = true;

            console.log(`[📻 ServerSync] Synced! Epoch: ${new Date(data.epoch).toISOString()}, Latency: ${Math.round(latencyMs)}ms, Listeners: ${data.listenersCount}`);

            return {
                trackIndex: data.trackIndex,
                position: data.trackPosition + (latencyMs / 1000),
                totalElapsed: data.totalElapsed,
                listenersCount: data.listenersCount
            };
        } catch (e) {
            console.warn('[📻 ServerSync] Failed to sync, using local fallback:', e.message);
            return null;
        }
    }

    /**
     * Report an actual track duration to the server.
     */
    async reportDuration(trackIndex, duration) {
        this.setTrackDuration(trackIndex, duration);
        try {
            await fetch(`${API_BASE}/api/radio/durations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackIndex, duration })
            });
        } catch (e) { /* non-critical */ }
    }

    /**
     * Start heartbeat loop (every 30s).
     */
    startHeartbeat() {
        if (this.heartbeatInterval) return;
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    async sendHeartbeat() {
        try {
            const resp = await fetch(`${API_BASE}/api/radio/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listenerId: LISTENER_ID })
            });
            if (resp.ok) {
                const data = await resp.json();
                this.listenersCount = data.listenersCount || 0;
            }
        } catch (e) { /* non-critical */ }
    }

    setTrackDuration(trackIndex, duration) {
        if (duration && isFinite(duration) && duration > 0) {
            this.trackDurations.set(trackIndex, duration);
        }
    }

    getTrackDuration(trackIndex) {
        return this.trackDurations.get(trackIndex) ||
            AUDIO_CONFIG.trackInfo[trackIndex]?.estimatedDuration ||
            this.defaultDuration;
    }

    getTotalPlaylistDuration() {
        let total = 0;
        for (let i = 0; i < AUDIO_CONFIG.totalTracks; i++) {
            total += this.getTrackDuration(i);
        }
        return total;
    }

    getCurrentLivePosition() {
        const now = Date.now();
        const elapsedSeconds = (now - this.broadcastStartTime) / 1000;
        const totalPlaylistDuration = this.getTotalPlaylistDuration();
        const positionInPlaylist = ((elapsedSeconds % totalPlaylistDuration) + totalPlaylistDuration) % totalPlaylistDuration;

        let accumulatedTime = 0;
        for (let i = 0; i < AUDIO_CONFIG.totalTracks; i++) {
            const trackDuration = this.getTrackDuration(i);
            if (accumulatedTime + trackDuration > positionInPlaylist) {
                return {
                    trackIndex: i,
                    position: positionInPlaylist - accumulatedTime,
                    totalElapsed: elapsedSeconds
                };
            }
            accumulatedTime += trackDuration;
        }

        return { trackIndex: 0, position: 0, totalElapsed: elapsedSeconds };
    }

    /**
     * Get live position — prefers server sync, falls back to local calculation.
     */
    async getLivePositionFromServer() {
        const serverPos = await this.syncWithServer();
        if (serverPos) return serverPos;
        return this.getCurrentLivePosition();
    }

    getPositionAfterElapsed(currentTrackIndex, currentPosition, elapsedSeconds) {
        let remainingSeconds = elapsedSeconds;
        let trackIndex = currentTrackIndex;
        let position = currentPosition;

        while (remainingSeconds > 0) {
            const trackDuration = this.getTrackDuration(trackIndex);
            const timeLeftInTrack = trackDuration - position;

            if (remainingSeconds < timeLeftInTrack) {
                position += remainingSeconds;
                remainingSeconds = 0;
            } else {
                remainingSeconds -= timeLeftInTrack;
                trackIndex = (trackIndex + 1) % AUDIO_CONFIG.totalTracks;
                position = 0;
            }
        }

        return { trackIndex, position };
    }

    onPause(currentTrackIndex, currentPosition) {
        this.pausedAt = {
            time: Date.now(),
            trackIndex: currentTrackIndex,
            position: currentPosition
        };
        this.isLive = false;
        this.emit('liveStatusChange', { isLive: false });
    }

    async getResumePosition() {
        // Always resume at the current LIVE position (server-synced)
        const serverPos = await this.syncWithServer();
        this.pausedAt = null;
        this.isLive = true;
        this.emit('liveStatusChange', { isLive: true });

        if (serverPos) return serverPos;

        // Fallback to local calculation
        if (!this.pausedAt) return this.getCurrentLivePosition();
        const elapsedSeconds = (Date.now() - this.pausedAt.time) / 1000;
        return this.getPositionAfterElapsed(
            this.pausedAt.trackIndex,
            this.pausedAt.position,
            elapsedSeconds
        );
    }

    async goToLive() {
        this.pausedAt = null;
        this.isLive = true;
        this.emit('liveStatusChange', { isLive: true });

        const serverPos = await this.syncWithServer();
        if (serverPos) return serverPos;
        return this.getCurrentLivePosition();
    }

    checkIfLive(currentTrackIndex, currentPosition) {
        const livePos = this.getCurrentLivePosition();
        if (currentTrackIndex !== livePos.trackIndex) {
            this.isLive = false;
        } else {
            const diff = Math.abs(currentPosition - livePos.position);
            this.isLive = diff < this.liveThreshold;
        }
        return this.isLive;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class AudioEngine extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            autoPlay: config.autoPlay !== false,
            shuffle: config.shuffle || false,
            repeat: config.repeat || 'all',
            fftSize: config.fftSize || 256,
            virtualLive: config.virtualLive !== false,
            ...config
        };

        this.audio = null;
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.sourceNode = null;
        this.frequencyData = null;
        this.currentTrackIndex = 0;
        this.playlist = [...Array(AUDIO_CONFIG.totalTracks).keys()];
        this.playHistory = [];
        this.isPlaying = false;
        this.isBuffering = false;
        this.isLoading = false;
        this.isMuted = false;
        this.volume = Utils.storage.get('volume', 0.8);
        this.currentTime = 0;
        this.duration = 0;
        this.shuffle = Utils.storage.get('shuffle', false);
        this.repeat = Utils.storage.get('repeat', 'all');
        this.virtualLive = new VirtualLiveManager();
        this.isLive = true;
        this.corsEnabled = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000;

        this._onTimeUpdate = this._onTimeUpdate.bind(this);

        this.virtualLive.on('liveStatusChange', (data) => {
            this.isLive = data.isLive;
            this.emit('liveStatusChange', data);
        });
    }

    async initialize() {
        if (this.audioContext) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = 0.8;

            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.volume;

            this.gainNode.connect(this.audioContext.destination);
            this.analyser.connect(this.gainNode);

            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

            this.emit('initialized');
        } catch (error) {
            console.error('[AudioEngine] Failed to initialize:', error);
        }
    }

    _onTimeUpdate() {
        if (!this.audio) return;
        this.currentTime = this.audio.currentTime;
        const progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;

        if (this.config.virtualLive && this.isPlaying) {
            this.virtualLive.checkIfLive(this.currentTrackIndex, this.currentTime);
        }

        this.emit('timeupdate', {
            currentTime: this.currentTime,
            duration: this.duration,
            progress,
            formattedCurrent: Utils.formatTime(this.currentTime),
            formattedDuration: Utils.formatTime(this.duration),
            isLive: this.isLive
        });
    }

    createAudioElement(useCORS = true) {
        this.destroyAudioElement();

        this.audio = new Audio();
        this.audio.preload = 'auto';
        this.audio.volume = this.volume;

        // ALWAYS enable CORS to support Cloudflare R2/S3 and Web Audio API analysis
        this.audio.crossOrigin = 'anonymous';
        this.corsEnabled = true;

        this._attachAudioEvents();
        return this.audio;
    }

    destroyAudioElement() {
        if (this.audio) {
            this.audio.pause();
            this.audio.removeEventListener('timeupdate', this._onTimeUpdate);
            this.audio.removeAttribute('src');
            this.audio.load();

            if (this.sourceNode) {
                try { this.sourceNode.disconnect(); } catch (e) { }
                this.sourceNode = null;
            }

            this.audio = null;
        }
    }

    _attachAudioEvents() {
        if (!this.audio) return;

        this.audio.addEventListener('loadstart', () => {
            this.isLoading = true;
            this.emit('loading');
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            // Report actual duration to server for global accuracy
            this.virtualLive.reportDuration(this.currentTrackIndex, this.duration);
            this.emit('durationchange', { duration: this.duration });
        });

        this.audio.addEventListener('canplay', () => {
            this.isBuffering = false;
            this.isLoading = false;
            this.emit('canplay');
        });

        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
            this.isLoading = false;
            this.isBuffering = false;
            this.retryCount = 0;
            this.emit('playing', this.getCurrentTrackInfo());
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.config.virtualLive && this.audio) {
                this.virtualLive.onPause(this.currentTrackIndex, this.audio.currentTime);
            }
            this.emit('paused');
        });

        this.audio.addEventListener('waiting', () => {
            this.isBuffering = true;
            this.emit('buffering');
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this._handleTrackEnded();
        });

        this.audio.addEventListener('error', () => {
            this._handleError(this.audio?.error);
        });

        this.audio.addEventListener('timeupdate', this._onTimeUpdate);

        this.audio.addEventListener('volumechange', () => {
            this.emit('volumechange', { volume: this.audio?.volume || 0 });
        });
    }

    _handleTrackEnded() {
        this.emit('ended');
        if (this.config.virtualLive) {
            this.next();
            return;
        }
        switch (this.repeat) {
            case 'one': this.play(); break;
            case 'all': this.next(); break;
            case 'none':
                if (this.hasNext()) this.next();
                else this.emit('playlistEnded');
                break;
        }
    }

    getCurrentTrackInfo() {
        const track = AUDIO_CONFIG.getTrack(this.currentTrackIndex);
        return {
            ...track.info,
            index: this.currentTrackIndex,
            total: AUDIO_CONFIG.totalTracks,
            url: track.url,
            filename: track.filename,
            isLive: this.isLive
        };
    }

    async loadTrack(index, autoPlay = true, seekPosition = 0) {
        try {
            await this.initialize();

            const track = AUDIO_CONFIG.getTrack(index);
            this.currentTrackIndex = track.index;

            this.playHistory.push(track.index);
            if (this.playHistory.length > 50) this.playHistory.shift();

            Utils.storage.set('lastTrackIndex', track.index);

            this.createAudioElement(false);
            this.audio.src = track.url;
            this.audio.load();

            this.emit('trackchange', this.getCurrentTrackInfo());

            if (seekPosition > 0) {
                await new Promise((resolve) => {
                    const onLoaded = () => {
                        this.audio.removeEventListener('loadedmetadata', onLoaded);
                        this.audio.currentTime = Math.min(seekPosition, this.audio.duration - 1);
                        resolve();
                    };
                    this.audio.addEventListener('loadedmetadata', onLoaded);
                });
            }

            if (autoPlay) await this.audio.play();
        } catch (error) {
            this._handleError(error);
        }
    }

    async play() {
        if (this.config.virtualLive && this.virtualLive.pausedAt) {
            // Always resume at LIVE position from server
            const resumePos = await this.virtualLive.getResumePosition();

            if (resumePos.trackIndex !== this.currentTrackIndex) {
                await this.loadTrack(resumePos.trackIndex, true, resumePos.position);
            } else if (this.audio) {
                this.audio.currentTime = Math.min(resumePos.position, this.duration - 1);
                await this.audio.play();
            } else {
                await this.loadTrack(resumePos.trackIndex, true, resumePos.position);
            }

            this.isLive = true;
            this.emit('liveStatusChange', { isLive: true });
            return;
        }

        if (this.audio && this.audio.src) {
            try {
                if (this.audioContext?.state === 'suspended') {
                    await this.audioContext.resume();
                }
                await this.audio.play();
            } catch (error) {
                await this.loadTrack(this.currentTrackIndex, true);
            }
        } else {
            await this.loadTrack(this.currentTrackIndex, true);
        }
    }

    async startLive() {
        // Fetch live position from server — single source of truth
        const livePos = await this.virtualLive.getLivePositionFromServer();
        this.isLive = true;
        await this.loadTrack(livePos.trackIndex, true, livePos.position);
        this.emit('liveStatusChange', { isLive: true });
    }

    async goLive() {
        // Fetch live position from server — single source of truth
        const livePos = await this.virtualLive.goToLive();
        this.isLive = true;
        await this.loadTrack(livePos.trackIndex, true, livePos.position);
        this.emit('liveStatusChange', { isLive: true });
    }

    pause() {
        if (this.audio) this.audio.pause();
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.isPlaying = false;
        this.currentTime = 0;
        this.virtualLive.pausedAt = null;
        this.emit('stopped');
    }

    async toggle() {
        if (this.isPlaying) this.pause();
        else await this.play();
    }

    async next() {
        let nextIndex = this.shuffle
            ? AUDIO_CONFIG.getRandomIndex(this.currentTrackIndex)
            : (this.currentTrackIndex + 1) % AUDIO_CONFIG.totalTracks;

        this.virtualLive.pausedAt = null;
        this.isLive = true;
        await this.loadTrack(nextIndex, true);
    }

    async previous() {
        if (this.currentTime > 3) {
            this.seek(0);
            return;
        }

        let prevIndex;
        if (this.playHistory.length > 1) {
            this.playHistory.pop();
            prevIndex = this.playHistory.pop();
        } else if (this.shuffle) {
            prevIndex = AUDIO_CONFIG.getRandomIndex(this.currentTrackIndex);
        } else {
            prevIndex = (this.currentTrackIndex - 1 + AUDIO_CONFIG.totalTracks) % AUDIO_CONFIG.totalTracks;
        }

        this.virtualLive.pausedAt = null;
        await this.loadTrack(prevIndex, true);
    }

    hasNext() {
        if (this.repeat === 'all' || this.shuffle) return true;
        return this.currentTrackIndex < AUDIO_CONFIG.totalTracks - 1;
    }

    seek(value, isSeconds = false) {
        if (!this.audio || !this.duration) return;

        let seekTime = isSeconds ? Utils.clamp(value, 0, this.duration) : (value / 100) * this.duration;
        this.audio.currentTime = seekTime;

        if (this.config.virtualLive) {
            this.isLive = false;
            this.virtualLive.isLive = false;
            this.emit('liveStatusChange', { isLive: false });
        }
    }

    setVolume(value) {
        this.volume = Utils.clamp(value, 0, 1);
        if (this.audio) this.audio.volume = this.volume;
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
        Utils.storage.set('volume', this.volume);
        this.emit('volumechange', { volume: this.volume });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.audio) this.audio.muted = this.isMuted;
        this.emit('mutechange', { muted: this.isMuted });
        return this.isMuted;
    }

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        Utils.storage.set('shuffle', this.shuffle);
        this.emit('shufflechange', { shuffle: this.shuffle });
        return this.shuffle;
    }

    cycleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeat);
        this.repeat = modes[(currentIndex + 1) % modes.length];
        Utils.storage.set('repeat', this.repeat);
        this.emit('repeatchange', { repeat: this.repeat });
        return this.repeat;
    }

    getFrequencyData() {
        if (this.analyser && this.frequencyData && this.isPlaying && this.corsEnabled) {
            this.analyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return new Uint8Array(128).fill(0);
    }

    getBassLevel() {
        const data = this.getFrequencyData();
        const bassRange = Math.floor(data.length * 0.1);
        let sum = 0;
        for (let i = 0; i < bassRange; i++) sum += data[i];
        return sum / bassRange / 255;
    }

    _handleError(error) {
        this.isPlaying = false;
        this.isLoading = false;

        let errorInfo = { type: 'unknown', message: 'Unknown error', recoverable: true };

        if (error instanceof MediaError) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_NETWORK:
                    errorInfo = { type: 'network', message: 'Network error', recoverable: true };
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    errorInfo = { type: 'decode', message: 'Cannot decode audio', recoverable: true };
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorInfo = { type: 'source', message: 'Format not supported', recoverable: false };
                    break;
            }
        } else if (error?.name === 'NotAllowedError') {
            errorInfo = { type: 'permission', message: 'Click play to start', recoverable: false };
        }

        this.emit('error', errorInfo);

        if (errorInfo.recoverable && this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => this.loadTrack(this.currentTrackIndex, true), this.retryDelay * this.retryCount);
        }
    }

    destroy() {
        this.stop();
        this.destroyAudioElement();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUALIZER ENGINE (Mobile Optimized)
// ═══════════════════════════════════════════════════════════════════════════════

class VisualizerEngine {
    constructor(audioEngine, options = {}) {
        if (isMobile || shouldReduceAnimations) {
            this.particles = [];
            this.isActive = false;
            return;
        }

        this.audioEngine = audioEngine;
        this.options = {
            barCount: options.barCount || 12,
            sensitivity: options.sensitivity || 1.8,
            smoothing: options.smoothing || 0.75,
            minHeight: options.minHeight || 6,
            maxHeight: options.maxHeight || 45
        };

        this.bars = [];
        this.previousHeights = [];
        this.isActive = false;
        this.animationId = null;

        this.init();
    }

    init() {
        const container = document.querySelector('.sacred-visualizer');
        if (container) {
            this.bars = Array.from(container.querySelectorAll('.viz-bar'));
            this.previousHeights = new Array(this.bars.length).fill(this.options.minHeight);
        }

        this.audioEngine.on('playing', () => this.start());
        this.audioEngine.on('paused', () => this.stop());
        this.audioEngine.on('stopped', () => this.stop());
    }

    start() {
        if (isMobile || shouldReduceAnimations) return;
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.bars.forEach((bar) => {
            bar.style.height = `${this.options.minHeight}px`;
        });
    }

    animate() {
        if (!this.isActive) return;

        const frequencyData = this.audioEngine.getFrequencyData();
        const dataLength = frequencyData.length;

        this.bars.forEach((bar, index) => {
            const start = Math.floor(index * dataLength / this.bars.length);
            const end = Math.floor((index + 1) * dataLength / this.bars.length);

            let sum = 0;
            for (let i = start; i < end; i++) sum += frequencyData[i];
            const average = sum / (end - start);
            const normalized = (average / 255) * this.options.sensitivity;

            const targetHeight = Utils.mapRange(
                normalized, 0, 1,
                this.options.minHeight,
                this.options.maxHeight
            );

            const smoothedHeight = Utils.lerp(
                this.previousHeights[index],
                targetHeight,
                1 - this.options.smoothing
            );

            this.previousHeights[index] = smoothedHeight;
            bar.style.height = `${smoothedHeight}px`;
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.stop();
        this.bars = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEM (Disabled on Mobile)
// ═══════════════════════════════════════════════════════════════════════════════

class ParticleSystem {
    constructor(container, options = {}) {
        if (isMobile || shouldReduceAnimations) {
            this.particles = [];
            this.isActive = false;
            return;
        }

        this.container = typeof container === 'string'
            ? document.getElementById(container)
            : container;

        this.options = {
            count: options.count || 40,
            colors: options.colors || ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'],
            minSize: options.minSize || 2,
            maxSize: options.maxSize || 7
        };

        this.particles = [];
        this.isActive = false;

        if (this.container) this.init();
    }

    init() {
        if (this.container) this.container.innerHTML = '';
        this.particles = [];

        for (let i = 0; i < this.options.count; i++) {
            this.createParticle();
        }
        this.isActive = true;
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';

        const size = Utils.random(this.options.minSize, this.options.maxSize);
        const duration = Utils.random(12, 30);
        const delay = Utils.random(0, duration);
        const x = Utils.random(0, 100);
        const drift = Utils.random(-30, 30);
        const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];

        Object.assign(particle.style, {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            left: `${x}%`,
            bottom: '-20px',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            borderRadius: '50%',
            opacity: '0',
            animation: `particle-float ${duration}s ease-in-out ${delay}s infinite`,
            '--drift': `${drift}px`,
            pointerEvents: 'none',
            zIndex: '1'
        });

        if (this.container) {
            this.container.appendChild(particle);
            this.particles.push(particle);
        }
    }

    pause() {
        this.particles.forEach(p => p.style.animationPlayState = 'paused');
    }

    resume() {
        if (shouldReduceAnimations) return;
        this.particles.forEach(p => p.style.animationPlayState = 'running');
    }

    destroy() {
        this.particles.forEach(p => p.remove());
        this.particles = [];
        this.isActive = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI CONTROLLER - FIXED NAVIGATION PATHS v6.4
// ═══════════════════════════════════════════════════════════════════════════════

class UIController extends EventEmitter {
    constructor(audioEngine, stateManager) {
        super();

        this.audio = audioEngine;
        this.stateManager = stateManager;

        this.elements = {};
        this.isDraggingProgress = false;
        this.toastQueue = [];
        this.isShowingToast = false;
        this.firstPlay = true;
        this.listenerCount = 1247;
        this.listenerUpdateInterval = null;

        // Track bound handlers to prevent duplicates
        this.boundHandlers = new Map();

        // Notes state
        this.notesOriginalContent = '';
        this.notesModified = false;

        // Shabad state
        this.currentShabad = null;
        this.shabadBookmarked = false;

        this.shabadPrefsKey = 'randomShabad_settings_v1';
        this.shabadSettings = {
            larivaar: false,
            showTransliteration: true,
            showEnglish: true,
            showPunjabi: false
        };

        this.init();
    }

    init() {
        window.ui = this; // Global access for callbacks
        this.cacheElements();
        this.injectStyles();
        this.setupEventListeners();
        this.setupProgressBar();
        this.setupKeyboardShortcuts();
        this.setupAudioEventListeners();
        this.loadSavedState();
        this.hideLoadingScreen();
        this.setupLiveButton();
        this.startListenerSimulation();
        validateNavPaths(); // Log navigation paths for debugging
    }

    cacheElements() {
        const ids = [
            'playBtn', 'playIcon', 'prevBtn', 'nextBtn',
            'volumeBtn', 'volumeSlider', 'volumeValue', 'volumePopup', 'volumeFill',
            'currentTime', 'totalTime', 'progressFill', 'progressScrubber', 'progressTrack',
            'loadingScreen', 'toast',
            'scheduleBtn', 'scheduleModal', 'closeScheduleModal',
            'shareBtn', 'shareModal', 'closeShareModal',
            'favoriteBtn', 'copyLinkBtn', 'liveBtn', 'listenerCount',
            'shareWhatsapp', 'shareTelegram', 'shareFacebook', 'shareTwitter',
            // Notes
            'notesCard', 'notesOverlay', 'notesClose',
            'notesTextarea', 'notesCharCount',
            'saveNotesBtn', 'downloadNotesBtn', 'clearNotesBtn',
            'notesConfirmOverlay', 'confirmSaveBtn', 'confirmDiscardBtn', 'confirmCancelBtn',
            'notesToast', 'notesToastMessage',
            // Shabad
            'randomShabadCard', 'shabadOverlay', 'shabadClose',
            'shabadContainer', 'shabadLoading', 'shabadContent', 'shabadError',
            'savedShabadsModal', 'savedShabadsList', 'savedShabadsClose', 'shabadMenuBtn',
            'shabadAngNumber', 'shabadGurmukhi',
            'shabadTransliteration', 'shabadTranslation', 'shabadSource',
            'newShabadBtn', 'copyShabadBtn', 'shareShabadBtn', 'bookmarkShabadBtn',
            'shabadTooltip', 'shabadRetryBtn',
            'shabadSettingsBtn', 'shabadSettingsBackdrop', 'shabadSettingsSheet', 'shabadSettingsClose',
            'toggleShabadLarivaar', 'toggleShabadTranslit', 'toggleShabadEnglish', 'toggleShabadPunjabi',
            // Bento cards - FIXED IDs
            'DailyHukamnamaCard', 'nitnemCard', 'nitnemTrackerCard', 'sehajPaathCard', 'gurbaniKhojCard', 'calendarCard', 'remindersCard'
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        // Query selectors for elements without IDs
        this.elements.statusLive = document.querySelector('.status-item--live');
        this.elements.playerCard = document.querySelector('.player__card');

        // Also try to get calendar card by class if not found by ID
        if (!this.elements.calendarCard) {
            this.elements.calendarCard = document.querySelector('.bento-card--calendar');
        }
    }

    injectStyles() {
        if (document.getElementById('ui-controller-styles')) return;

        const style = document.createElement('style');
        style.id = 'ui-controller-styles';
        style.textContent = `
            @keyframes ripple-expand {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(4); opacity: 0; }
            }
            
            @keyframes particle-float {
                0% { transform: translateY(0) translateX(0) scale(0); opacity: 0; }
                10% { opacity: 0.8; transform: translateY(-10vh) translateX(calc(var(--drift) * 0.3)) scale(1); }
                90% { opacity: 0.4; }
                100% { transform: translateY(-100vh) translateX(var(--drift)) scale(0.5); opacity: 0; }
            }

            @keyframes navSpin {
                to { transform: rotate(360deg); }
            }

            .live-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 14px;
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
                border: 1px solid rgba(239, 68, 68, 0.4);
                border-radius: 20px;
                color: #ef4444;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1.5px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
            }

            .live-btn:hover {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.2));
                transform: scale(1.05);
            }

            .live-btn--active { box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
            .live-btn--inactive { background: rgba(100, 100, 100, 0.15); border-color: rgba(100, 100, 100, 0.3); color: #888; }

            .live-btn__pulse {
                width: 8px;
                height: 8px;
                background: #ef4444;
                border-radius: 50%;
                animation: live-pulse 1.5s ease-in-out infinite;
            }

            .live-btn--inactive .live-btn__pulse { display: none; }

            @keyframes live-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.4); opacity: 0.6; }
            }
            
            /* Notes & Shabad Overlays */
            .notes-overlay.active,
            .shabad-overlay.active {
                display: flex !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            .notes-toast.show,
            .shabad-tooltip.show {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            
            .notes-confirm-overlay.active {
                display: flex !important;
            }

            .shabad-lines {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .shabad-line {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .shabad-line-g {
                font-family: 'Noto Sans Gurmukhi', sans-serif;
                font-size: 1.5rem;
                line-height: 1.6;
                color: var(--text-primary, #fff);
            }

            .shabad-line-t {
                font-size: 1rem;
                color: var(--text-secondary, rgba(255,255,255,0.7));
                font-style: italic;
            }

            .shabad-line-tr {
                font-size: 0.95rem;
                color: var(--text-tertiary, rgba(255,255,255,0.6));
            }

            .shabad-line-tr[data-lang="pa"] {
                font-family: 'Noto Sans Gurmukhi', sans-serif;
            }

            /* Navigation Loading Overlay */
            #navLoadingOverlay {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.35);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
                opacity: 0;
                transition: opacity 180ms ease;
            }
            
            #navLoadingOverlay.visible {
                display: flex;
                opacity: 1;
            }

            /* Bento card hover effects */
            .bento-card {
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .bento-card:hover {
                transform: translateY(-2px);
            }
            
            .bento-card:active {
                transform: scale(0.98);
            }
        `;
        document.head.appendChild(style);
    }

    startListenerSimulation() {
        const updateInterval = isMobile ? 15000 : 5000;

        this.listenerUpdateInterval = setInterval(() => {
            const change = Math.floor(Utils.random(-5, 8));
            this.listenerCount = Math.max(100, this.listenerCount + change);

            const listenerEl = this.elements.listenerCount || document.querySelector('.status-item__value');
            if (listenerEl) {
                listenerEl.textContent = Utils.formatNumber(this.listenerCount);
            }
        }, updateInterval);
    }

    setupLiveButton() {
        let liveBtn = this.elements.liveBtn;

        if (!liveBtn) {
            liveBtn = document.createElement('button');
            liveBtn.id = 'liveBtn';
            liveBtn.className = 'live-btn live-btn--active';
            liveBtn.innerHTML = `<span class="live-btn__pulse"></span><span class="live-btn__text">LIVE</span>`;

            const progressTime = document.querySelector('.progress-time');
            const liveIndicator = document.querySelector('.progress-time__live');
            if (progressTime && liveIndicator) {
                liveIndicator.parentNode.replaceChild(liveBtn, liveIndicator);
            }

            this.elements.liveBtn = liveBtn;
        }

        if (this.elements.liveBtn) {
            this.elements.liveBtn.addEventListener('click', async () => {
                Utils.haptic('medium');
                await this.audio.goLive();
                this.showToast('🔴 Jumped to LIVE', 'success');
            });
        }
    }

    updateLiveStatus(isLive) {
        const { liveBtn, statusLive } = this.elements;

        if (liveBtn) {
            liveBtn.classList.toggle('live-btn--active', isLive);
            liveBtn.classList.toggle('live-btn--inactive', !isLive);
        }

        if (statusLive) {
            const dot = statusLive.querySelector('.status-item__dot');
            if (dot) {
                dot.style.background = isLive ? '#ef4444' : '#888';
            }
        }
    }

    // Safe click handler that prevents duplicates
    addClickHandler(elementId, handler) {
        const element = this.elements[elementId];
        if (!element) {
            return;
        }

        const handlerKey = `${elementId}_click`;
        if (this.boundHandlers.has(handlerKey)) {
            return;
        }

        element.addEventListener('click', handler);
        this.boundHandlers.set(handlerKey, handler);
    }

    showNavigationOverlay(text = 'Loading...') {
        let overlay = document.getElementById('navLoadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'navLoadingOverlay';
            overlay.setAttribute('aria-hidden', 'true');

            const card = document.createElement('div');
            card.style.cssText = `
                padding: 18px 20px;
                border-radius: 22px;
                background: var(--glass-bg-elevated, rgba(28,28,30,0.78));
                border: 1px solid var(--glass-border, rgba(255,255,255,0.12));
                color: var(--text-primary, #fff);
                text-align: center;
                min-width: 220px;
            `;

            const spinner = document.createElement('div');
            spinner.style.cssText = `
                width: 44px;
                height: 44px;
                margin: 0 auto 10px;
                border-radius: 50%;
                border: 3px solid rgba(255,255,255,0.25);
                border-top-color: var(--accent-saffron, #FF9500);
                animation: navSpin 900ms linear infinite;
            `;

            const textEl = document.createElement('div');
            textEl.className = 'nav-loading-text';
            textEl.textContent = text;
            textEl.style.cssText = 'font-weight: 700; font-size: 14px;';

            card.appendChild(spinner);
            card.appendChild(textEl);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
        } else {
            const textEl = overlay.querySelector('.nav-loading-text');
            if (textEl) textEl.textContent = text;
        }

        overlay.classList.add('visible');
    }

    hideNavigationOverlay() {
        const overlay = document.getElementById('navLoadingOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    setupEventListeners() {
        // ═══════════════════════════════════════════════════════════════
        // PLAYER CONTROLS
        // ═══════════════════════════════════════════════════════════════

        this.addClickHandler('playBtn', async (e) => {
            Utils.createRipple(this.elements.playBtn, e);
            Utils.haptic('medium');

            if (this.firstPlay && !this.audio.isPlaying) {
                this.firstPlay = false;
                await this.audio.startLive();
            } else {
                await this.audio.toggle();
            }
        });

        this.addClickHandler('prevBtn', () => {
            Utils.haptic('light');
            this.audio.previous();
        });

        this.addClickHandler('nextBtn', () => {
            Utils.haptic('light');
            this.audio.next();
        });

        // Volume
        this.addClickHandler('volumeBtn', (e) => {
            e.stopPropagation();
            this.toggleVolumePopup();
        });

        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.audio.setVolume(value);
                this.updateVolumeUI(value);
            });
        }

        document.addEventListener('click', (e) => {
            const volumePopup = this.elements.volumePopup;
            const volumeBtn = this.elements.volumeBtn;
            if (volumePopup && !volumePopup.contains(e.target) && !volumeBtn?.contains(e.target)) {
                volumePopup.setAttribute('data-visible', 'false');
            }
        });

        // Favorite
        this.addClickHandler('favoriteBtn', () => {
            Utils.haptic('success');
            this.toggleFavorite();
        });

        // Modals
        this.addClickHandler('scheduleBtn', () => this.openModal('scheduleModal'));
        this.addClickHandler('closeScheduleModal', () => this.closeModal('scheduleModal'));
        this.addClickHandler('shareBtn', () => this.openModal('shareModal'));
        this.addClickHandler('closeShareModal', () => this.closeModal('shareModal'));

        // Copy Link
        this.addClickHandler('copyLinkBtn', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                Utils.haptic('success');
                this.showToast('🔗 Link copied!', 'success');
            } catch (e) {
                this.showToast('❌ Copy failed', 'error');
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // BENTO CARDS - NAVIGATION (FIXED PATHS)
        // ═══════════════════════════════════════════════════════════════

        this.addClickHandler('DailyHukamnamaCard', () => {
            console.log('[UI] ✅ Daily Hukamnama clicked');
            this.showNavigationOverlay('Loading Hukamnama…');
            window.location.href = NAV_PATHS.dailyHukamnama;
        });

        this.addClickHandler('nitnemCard', () => {
            console.log('[UI] ✅ Nitnem card clicked');
            this.showNavigationOverlay('Loading Nitnem…');
            window.location.href = NAV_PATHS.nitnem;
        });

        this.addClickHandler('nitnemTrackerCard', () => {
            console.log('[UI] ✅ Nitnem Tracker card clicked');
            this.showNavigationOverlay('Loading Nitnem Tracker…');
            window.location.href = NAV_PATHS.nitnemTracker;
        });

        this.addClickHandler('sehajPaathCard', () => {
            console.log('[UI] ✅ Sehaj Paath clicked');
            this.showNavigationOverlay('Loading Sehaj Paath…');
            window.location.href = NAV_PATHS.sehajPaath;
        });

        this.addClickHandler('gurbaniKhojCard', () => {
            console.log('[UI] ✅ Gurbani Khoj clicked');
            this.showNavigationOverlay('Loading Gurbani Khoj…');
            window.location.href = NAV_PATHS.gurbaniKhoj;
        });

        // Calendar Card
        if (this.elements.calendarCard && !this.boundHandlers.has('calendarCard_click')) {
            this.elements.calendarCard.addEventListener('click', () => {
                console.log('[UI] ✅ Calendar card clicked');
                this.showNavigationOverlay('Loading Calendar…');
                window.location.href = NAV_PATHS.calendar;
            });
            this.boundHandlers.set('calendarCard_click', true);
        }

        this.addClickHandler('remindersCard', () => {
            console.log('[UI] ✅ Reminders card clicked');
            this.showNavigationOverlay('Loading Reminders…');
            window.location.href = NAV_PATHS.reminders;
        });

        // Keyboard accessibility for bento cards
        const keyboardActivate = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.click();
            }
        };

        ['DailyHukamnamaCard', 'nitnemCard', 'nitnemTrackerCard', 'sehajPaathCard', 'gurbaniKhojCard', 'calendarCard', 'notesCard', 'remindersCard'].forEach((id) => {
            const el = this.elements[id];
            if (el && !this.boundHandlers.has(`${id}_keydown`)) {
                el.addEventListener('keydown', keyboardActivate);
                this.boundHandlers.set(`${id}_keydown`, true);
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // NOTES MODAL
        // ═══════════════════════════════════════════════════════════════

        this.addClickHandler('notesCard', () => {
            console.log('[UI] ✅ Notes card clicked');
            this.showNavigationOverlay('Loading Notes…');
            window.location.href = NAV_PATHS.notes;
        });

        this.addClickHandler('notesClose', () => this.tryCloseNotes());

        if (this.elements.notesOverlay && !this.boundHandlers.has('notesOverlay_click')) {
            this.elements.notesOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.notesOverlay) {
                    this.tryCloseNotes();
                }
            });
            this.boundHandlers.set('notesOverlay_click', true);
        }

        this.addClickHandler('saveNotesBtn', () => {
            this.saveNotes();
            this.showNotesToast('Notes saved!');
        });

        this.addClickHandler('downloadNotesBtn', () => this.downloadNotes());
        this.addClickHandler('clearNotesBtn', () => this.clearNotes());

        if (this.elements.notesTextarea && !this.boundHandlers.has('notesTextarea_input')) {
            this.elements.notesTextarea.addEventListener('input', () => {
                this.updateNotesCharCount();
                this.notesModified = (this.elements.notesTextarea.value !== this.notesOriginalContent);
            });
            this.boundHandlers.set('notesTextarea_input', true);
        }

        this.addClickHandler('confirmSaveBtn', () => {
            this.saveNotes();
            this.hideNotesConfirm();
            this.closeNotesModal();
            this.showNotesToast('Notes saved!');
        });

        this.addClickHandler('confirmDiscardBtn', () => {
            this.hideNotesConfirm();
            this.closeNotesModal();
        });

        this.addClickHandler('confirmCancelBtn', () => this.hideNotesConfirm());

        // ═══════════════════════════════════════════════════════════════
        // RANDOM SHABAD MODAL
        // ═══════════════════════════════════════════════════════════════

        this.addClickHandler('randomShabadCard', () => {
            console.log('[UI] ✅ Random Shabad card clicked');
            this.openShabadModal();
        });

        this.addClickHandler('shabadClose', () => this.closeShabadModal());

        if (this.elements.shabadOverlay && !this.boundHandlers.has('shabadOverlay_click')) {
            this.elements.shabadOverlay.addEventListener('click', (e) => {
                // Close on backdrop click only
                if (e.target === this.elements.shabadOverlay ||
                    e.target.classList.contains('shabad-backdrop-blur')) {
                    this.closeShabadModal();
                }
            });
            this.boundHandlers.set('shabadOverlay_click', true);
        }

        // Swipe-to-close gesture for mobile
        if (this.elements.shabadContainer && !this.boundHandlers.has('shabadContainer_swipe')) {
            let startY = 0;
            let currentY = 0;
            let isDragging = false;

            this.elements.shabadContainer.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                isDragging = true;
            }, { passive: true });

            this.elements.shabadContainer.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;

                if (diff > 0) {
                    const translateY = Math.min(diff * 0.5, 100);
                    this.elements.shabadContainer.style.transform = `translateY(${translateY}px)`;
                    this.elements.shabadContainer.style.opacity = 1 - (diff / 400);
                }
            }, { passive: true });

            this.elements.shabadContainer.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;

                const diff = currentY - startY;
                if (diff > 100) {
                    this.closeShabadModal();
                }

                this.elements.shabadContainer.style.transform = '';
                this.elements.shabadContainer.style.opacity = '';
            });

            this.boundHandlers.set('shabadContainer_swipe', true);
        }

        this.addClickHandler('newShabadBtn', () => {
            const svg = this.elements.newShabadBtn?.querySelector('svg');
            if (svg) {
                svg.style.animation = 'shabad-orb-spin 0.8s linear infinite';
            }
            this.fetchRandomShabad();
        });

        this.addClickHandler('copyShabadBtn', () => this.copyShabad());
        this.addClickHandler('shareShabadBtn', () => this.shareShabad());
        this.addClickHandler('bookmarkShabadBtn', () => this.saveShabad());
        this.addClickHandler('shabadRetryBtn', () => this.fetchRandomShabad());

        this.addClickHandler('shabadSettingsBtn', () => this.openShabadSettings());
        this.addClickHandler('shabadSettingsClose', () => this.closeShabadSettings());

        if (this.elements.shabadSettingsBackdrop && !this.boundHandlers.has('shabadSettingsBackdrop_click')) {
            this.elements.shabadSettingsBackdrop.addEventListener('click', () => this.closeShabadSettings());
            this.boundHandlers.set('shabadSettingsBackdrop_click', true);
        }

        this.bindShabadSettingsToggles();

        // ═══════════════════════════════════════════════════════════════
        // ESCAPE KEY HANDLER
        // ═══════════════════════════════════════════════════════════════

        if (!this.boundHandlers.has('document_keydown_escape')) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (this.elements.notesOverlay?.classList.contains('active')) {
                        this.tryCloseNotes();
                    }
                    if (this.elements.shabadOverlay?.classList.contains('active')) {
                        this.closeShabadModal();
                    }
                    if (this.elements.shabadSettingsSheet?.classList.contains('visible')) {
                        this.closeShabadSettings();
                    }
                    document.querySelectorAll('.modal.modal--open').forEach(modal => {
                        this.closeModal(modal.id);
                    });
                }
            });
            this.boundHandlers.set('document_keydown_escape', true);
        }

        // Share buttons
        this.setupShareButtons();

        // Modal backdrop close
        if (!this.boundHandlers.has('modals_backdrop')) {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal.id);
                    }
                });
            });
            this.boundHandlers.set('modals_backdrop', true);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // NOTES FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    openNotesModal() {
        console.log('[UI] Opening Notes Modal');
        const { notesOverlay } = this.elements;
        if (notesOverlay) {
            document.body.style.overflow = 'hidden';
            notesOverlay.classList.add('active');
            this.loadNotes();
            setTimeout(() => this.elements.notesTextarea?.focus(), 100);
        }
    }

    closeNotesModal() {
        console.log('[UI] Closing Notes Modal');
        const { notesOverlay } = this.elements;
        if (notesOverlay) {
            document.body.style.overflow = '';
            notesOverlay.classList.remove('active');
            this.notesModified = false;
        }
    }

    tryCloseNotes() {
        if (this.notesModified) {
            this.showNotesConfirm();
        } else {
            this.closeNotesModal();
        }
    }

    showNotesConfirm() {
        const { notesConfirmOverlay } = this.elements;
        if (notesConfirmOverlay) notesConfirmOverlay.classList.add('active');
    }

    hideNotesConfirm() {
        const { notesConfirmOverlay } = this.elements;
        if (notesConfirmOverlay) notesConfirmOverlay.classList.remove('active');
    }

    loadNotes() {
        const { notesTextarea } = this.elements;
        if (notesTextarea) {
            const savedNotes = Utils.storage.get('userNotes', '');
            notesTextarea.value = savedNotes;
            this.notesOriginalContent = savedNotes;
            this.notesModified = false;
            this.updateNotesCharCount();
        }
    }

    saveNotes() {
        const { notesTextarea } = this.elements;
        if (notesTextarea) {
            Utils.storage.set('userNotes', notesTextarea.value);
            this.notesOriginalContent = notesTextarea.value;
            this.notesModified = false;
            Utils.haptic('success');
        }
    }

    downloadNotes() {
        const { notesTextarea } = this.elements;
        if (!notesTextarea || !notesTextarea.value.trim()) {
            this.showNotesToast('No notes to download');
            return;
        }

        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const content = `GURBANI RADIO - SACRED NOTES\nDate: ${date}\n================================\n\n${notesTextarea.value}\n\n================================\nWaheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Gurbani-Notes-${new Date().toLocaleDateString('en-CA')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.haptic('success');
        this.showNotesToast('Notes downloaded!');
    }

    clearNotes() {
        const { notesTextarea } = this.elements;
        if (notesTextarea && confirm('Are you sure you want to clear all notes?')) {
            notesTextarea.value = '';
            Utils.storage.remove('userNotes');
            this.notesOriginalContent = '';
            this.notesModified = false;
            this.updateNotesCharCount();
            Utils.haptic('warning');
            this.showNotesToast('Notes cleared');
        }
    }

    updateNotesCharCount() {
        const { notesTextarea, notesCharCount } = this.elements;
        if (notesTextarea && notesCharCount) {
            notesCharCount.textContent = `${notesTextarea.value.length} / 5000`;
        }
    }

    showNotesToast(message) {
        const { notesToast, notesToastMessage } = this.elements;
        if (notesToast && notesToastMessage) {
            notesToastMessage.textContent = message;
            notesToast.classList.add('show');
            setTimeout(() => notesToast.classList.remove('show'), 2500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SHABAD FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    openShabadModal() {
        console.log('[UI] Opening Shabad Modal');
        const { shabadOverlay } = this.elements;
        if (shabadOverlay) {
            document.body.style.overflow = 'hidden';
            shabadOverlay.classList.add('active');
            setTimeout(() => this.elements.shabadClose?.focus(), 100);
            this.loadShabadSettings();
            this.hydrateShabadSettingsUI();
            this.fetchRandomShabad();
        }
    }

    closeShabadModal() {
        console.log('[UI] Closing Shabad Modal');
        const { shabadOverlay, shabadContainer } = this.elements;
        if (shabadOverlay) {
            document.body.style.overflow = '';
            shabadOverlay.classList.remove('active');
            this.closeShabadSettings();

            // Stop spinner animation
            const svg = this.elements.newShabadBtn?.querySelector('svg');
            if (svg) svg.style.animation = '';

            // Reset transform if swiped
            if (shabadContainer) {
                shabadContainer.style.transform = '';
                shabadContainer.style.opacity = '';
            }
        }
    }

    loadShabadSettings() {
        try {
            const raw = Utils.storage.get(this.shabadPrefsKey, null);
            if (raw && typeof raw === 'object') {
                this.shabadSettings = {
                    larivaar: !!raw.larivaar,
                    showTransliteration: raw.showTransliteration !== false,
                    showEnglish: raw.showEnglish !== false,
                    showPunjabi: !!raw.showPunjabi
                };
            }
        } catch (e) { }
    }

    saveShabadSettings() {
        try {
            Utils.storage.set(this.shabadPrefsKey, this.shabadSettings);
        } catch (e) { }
    }

    hydrateShabadSettingsUI() {
        const { toggleShabadLarivaar, toggleShabadTranslit, toggleShabadEnglish, toggleShabadPunjabi } = this.elements;
        if (toggleShabadLarivaar) toggleShabadLarivaar.checked = !!this.shabadSettings.larivaar;
        if (toggleShabadTranslit) toggleShabadTranslit.checked = !!this.shabadSettings.showTransliteration;
        if (toggleShabadEnglish) toggleShabadEnglish.checked = !!this.shabadSettings.showEnglish;
        if (toggleShabadPunjabi) toggleShabadPunjabi.checked = !!this.shabadSettings.showPunjabi;
    }

    bindShabadSettingsToggles() {
        const bind = (id, fn) => {
            const el = this.elements[id];
            if (!el || this.boundHandlers.has(`${id}_change`)) return;
            el.addEventListener('change', fn);
            this.boundHandlers.set(`${id}_change`, true);
        };

        bind('toggleShabadLarivaar', (e) => {
            this.shabadSettings.larivaar = !!e.target.checked;
            this.saveShabadSettings();
            this.renderShabad();
        });

        bind('toggleShabadTranslit', (e) => {
            this.shabadSettings.showTransliteration = !!e.target.checked;
            this.saveShabadSettings();
            this.renderShabad();
        });

        bind('toggleShabadEnglish', (e) => {
            this.shabadSettings.showEnglish = !!e.target.checked;
            this.saveShabadSettings();
            this.renderShabad();
        });

        bind('toggleShabadPunjabi', (e) => {
            this.shabadSettings.showPunjabi = !!e.target.checked;
            this.saveShabadSettings();
            this.renderShabad();
        });
    }

    openShabadSettings() {
        const { shabadSettingsBackdrop, shabadSettingsSheet } = this.elements;
        if (shabadSettingsBackdrop) shabadSettingsBackdrop.classList.add('visible');
        if (shabadSettingsSheet) shabadSettingsSheet.classList.add('visible');
    }

    closeShabadSettings() {
        const { shabadSettingsBackdrop, shabadSettingsSheet } = this.elements;
        if (shabadSettingsBackdrop) shabadSettingsBackdrop.classList.remove('visible');
        if (shabadSettingsSheet) shabadSettingsSheet.classList.remove('visible');
    }

    async fetchRandomShabad() {
        console.log('[UI] Fetching Random Shabad...');
        const { shabadLoading, shabadContent, shabadError, newShabadBtn } = this.elements;

        if (shabadLoading) shabadLoading.style.display = 'flex';
        if (shabadContent) shabadContent.style.display = 'none';
        if (shabadError) shabadError.style.display = 'none';

        // Animate the refresh SVG icon
        const svg = newShabadBtn?.querySelector('svg');
        if (svg) svg.style.animation = 'shabad-orb-spin 0.8s linear infinite';

        try {
            const response = await fetch('https://api.banidb.com/v2/random/G', {
                headers: { Accept: 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (!data?.shabadInfo || !Array.isArray(data?.verses)) {
                throw new Error('Unexpected API response');
            }

            this.currentShabad = data;
            this.displayShabad(data);

            if (shabadContent) shabadContent.style.display = 'flex';
            if (shabadError) shabadError.style.display = 'none';

        } catch (error) {
            console.error('[UI] Failed to fetch random shabad:', error);
            if (shabadError) {
                shabadError.style.display = 'flex';
                const errorMsg = shabadError.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.textContent = error.message || 'Unable to receive Hukam. Please check your connection.';
                }
            }
            if (shabadContent) shabadContent.style.display = 'none';
        } finally {
            if (shabadLoading) shabadLoading.style.display = 'none';
            if (svg) svg.style.animation = '';
        }
    }

    displayShabad(data) {
        console.log('[SHABAD] displayShabad() called with data:', data);
        const { shabadContent, shabadAngNumber, shabadSource, shabadError } = this.elements;

        if (!data || !data.shabadInfo) {
            console.error('[SHABAD] ❌ Invalid data structure - missing shabadInfo');
            if (shabadError) shabadError.style.display = 'flex';
            return;
        }

        const shabadInfo = data.shabadInfo;
        const verses = data.verses || [];
        console.log('[SHABAD] Raw verses count:', verses.length);

        const verseLines = verses.map((v) => {
            const gurmukhi = v?.verse?.unicode || '';
            const larivaar = v?.larivaar?.unicode || v?.verse?.larivaar || '';

            // [CRITICAL FIX] BaniDB API returns transliteration as object: { en: "...", hi: "..." }
            // Must extract the 'en' property BEFORE converting to string
            let transliteration = v?.transliteration;
            if (transliteration && typeof transliteration === 'object') {
                transliteration = transliteration.en || transliteration.hi || '';
            }
            transliteration = transliteration || '';

            const en = v?.translation?.en?.bdb || v?.translation?.en?.ms || v?.translation?.en?.ssk || '';
            const pa = v?.translation?.pu?.bdb?.unicode || v?.translation?.pu?.ss?.unicode || '';

            return {
                gurmukhi: String(gurmukhi || '').trim(),
                larivaar: String(larivaar || gurmukhi || '').trim(),
                transliteration: String(transliteration).trim(),
                translationEn: String(en || '').trim(),
                translationPa: String(pa || '').trim()
            };
        }).filter((l) => l.gurmukhi || l.larivaar);
        console.log('[SHABAD] Normalized verses count:', verseLines.length);
        if (verseLines.length > 0) {
            console.log('[SHABAD] First verse sample:', verseLines[0]);
        } else {
            console.error('[SHABAD] ❌ NO VALID VERSES AFTER NORMALIZATION');
        }

        if (shabadAngNumber) {
            const angValue = shabadAngNumber.querySelector('.ang-value');
            if (angValue) {
                angValue.textContent = shabadInfo.pageNo || '---';
            } else {
                shabadAngNumber.textContent = shabadInfo.pageNo || '---';
            }
        }

        this.currentShabad = {
            shabadId: shabadInfo.shabadId || shabadInfo.shabadID || null,
            verses: verseLines,
            ang: shabadInfo.pageNo,
            raag: shabadInfo.raag?.english || shabadInfo.raag?.unicode || 'Unknown',
            raagUnicode: shabadInfo.raag?.unicode || '',
            writer: shabadInfo.writer?.english || shabadInfo.writer?.unicode || 'Unknown',
            writerUnicode: shabadInfo.writer?.unicode || ''
        };

        this.renderShabad();

        if (shabadSource) {
            const raag = this.currentShabad.raagUnicode || this.currentShabad.raag || 'ਰਾਗ';
            const writer = this.currentShabad.writerUnicode || this.currentShabad.writer || 'ਗੁਰੂ ਸਾਹਿਬ';

            shabadSource.innerHTML = `
                <span><i class="fas fa-music"></i> ${Utils.escapeHtml(raag)}</span>
                <span><i class="fas fa-feather"></i> ${Utils.escapeHtml(writer)}</span>
            `;
        }

        const bookmarks = Utils.storage.get('shabadBookmarks', []);
        const currentId = this.currentShabad.shabadId;
        this.shabadBookmarked = !!currentId && bookmarks.some((b) =>
            String(b?.shabadId ?? b?.id) === String(currentId)
        );
        this.updateBookmarkButton();

    }

    renderShabad() {
        console.log('[SHABAD] renderShabad() called');
        // [GOD-LEVEL FIX] Random Shabad Rendering
        const shabadContainer = this.elements.shabadContainer;
        const shabadContent = this.elements.shabadContent;
        const shabadGurmukhi = this.elements.shabadGurmukhi;

        if (!shabadContainer || !shabadContent || !shabadGurmukhi) {
            console.error('[SHABAD] ❌ Missing DOM elements:', {
                shabadContainer: !!shabadContainer,
                shabadContent: !!shabadContent,
                shabadGurmukhi: !!shabadGurmukhi
            });
            return;
        }

        if (!this.currentShabad) {
            console.warn('[SHABAD] ⚠️ No currentShabad to render');
            shabadContent.style.opacity = '0';
            return;
        }

        console.log('[SHABAD] Rendering shabad with', this.currentShabad.verses?.length || 0, 'verses');
        shabadContent.style.opacity = '1';

        // Clear previous content to prevent empty boxes
        shabadGurmukhi.innerHTML = '';

        const lines = this.currentShabad.verses;
        if (!lines || lines.length === 0) {
            console.error('[SHABAD] ❌ No verses in currentShabad.verses');
            return;
        }

        const larivaar = !!this.shabadSettings.larivaar;
        const showTrans = !!this.shabadSettings.showTransliteration;
        const showEn = !!this.shabadSettings.showEnglish;
        const showPa = !!this.shabadSettings.showPunjabi;

        console.log('[SHABAD] Render settings:', { larivaar, showTrans, showEn, showPa });

        // [DATA CONTRACT] Normalize lines to ensure no raw objects are rendered
        // and filter out empty lines to prevent empty UI boxes
        const validLines = lines.filter(l => l && (l.gurmukhi || l.larivaar));
        console.log('[SHABAD] Valid lines for rendering:', validLines.length);

        const htmlContent = validLines.map((l, index) => {
            const g = larivaar ? (l.larivaar || l.gurmukhi) : (l.gurmukhi || l.larivaar);

            // [CRITICAL FIX] Normalize transliteration - handle object or string
            let t = l.transliteration;
            if (typeof t === 'object' && t !== null) {
                t = t.en || t.pa || ''; // Prefer English Roman, fallback to Punjabi
            }

            const en = l.translationEn;
            const pa = l.translationPa;

            // [UI INTEGRITY] Translation MUST follow Pangti immediately
            return `
                   <div class="shabad-line" data-index="${index}">
                     <div class="shabad-line-g">${Utils.escapeHtml(g || '—')}</div>
                     ${showTrans && t ? `<div class="shabad-line-t">${Utils.escapeHtml(String(t))}</div>` : ''}
                     ${showEn && en ? `<div class="shabad-line-tr" data-lang="en">${Utils.escapeHtml(String(en))}</div>` : ''}
                     ${showPa && pa ? `<div class="shabad-line-tr" data-lang="pa">${Utils.escapeHtml(String(pa))}</div>` : ''}
                   </div>
                 `;
        }).join('');

        if (!htmlContent || htmlContent.trim() === '') {
            console.error('[SHABAD] ❌ No HTML content generated!');
            shabadGurmukhi.innerHTML = `
                <div class="shabad-error-message" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.7);">
                    <p>⚠️ Shabad could not be loaded. Please try again.</p>
                </div>
            `;
            return;
        }

        shabadGurmukhi.innerHTML = `
            <div class="shabad-lines" data-larivaar="${larivaar ? '1' : '0'}">
                ${htmlContent}
            </div>
        `;
        console.log('[SHABAD] ✅ Rendering complete. HTML length:', htmlContent.length);
    }

    copyShabad() {
        if (!this.currentShabad?.verses?.length) {
            this.showToast('❌ No shabad to copy', 'error');
            return;
        }

        const larivaar = !!this.shabadSettings.larivaar;
        const showTrans = !!this.shabadSettings.showTransliteration;
        const showEn = !!this.shabadSettings.showEnglish;
        const showPa = !!this.shabadSettings.showPunjabi;

        const lines = this.currentShabad.verses.map((l) => {
            const g = larivaar ? (l.larivaar || l.gurmukhi) : (l.gurmukhi || l.larivaar);
            const parts = [g].filter(Boolean);
            if (showTrans && l.transliteration) parts.push(l.transliteration);
            if (showEn && l.translationEn) parts.push(l.translationEn);
            if (showPa && l.translationPa) parts.push(l.translationPa);
            return parts.join('\n');
        });

        const textToCopy = `🙏 RANDOM SHABAD - Ang ${this.currentShabad.ang || '—'}\n\n${lines.join('\n\n')}\n\n— From Gurbani Live Radio`;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                Utils.haptic('success');
                this.showToast('📋 Shabad copied!', 'success');
                const icon = this.elements.copyShabadBtn?.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-copy');
                    icon.classList.add('fa-check');
                    setTimeout(() => {
                        icon.classList.remove('fa-check');
                        icon.classList.add('fa-copy');
                    }, 2000);
                }
            })
            .catch(() => this.showToast('❌ Copy failed', 'error'));
    }

    async shareShabad() {
        if (!this.currentShabad?.verses?.length) {
            this.showToast('❌ No shabad to share', 'error');
            return;
        }

        const larivaar = !!this.shabadSettings.larivaar;
        const showTrans = !!this.shabadSettings.showTransliteration;
        const showEn = !!this.shabadSettings.showEnglish;
        const showPa = !!this.shabadSettings.showPunjabi;

        const lines = this.currentShabad.verses.map((l) => {
            const g = larivaar ? (l.larivaar || l.gurmukhi) : (l.gurmukhi || l.larivaar);
            const parts = [g].filter(Boolean);
            if (showTrans && l.transliteration) parts.push(l.transliteration);
            if (showEn && l.translationEn) parts.push(l.translationEn);
            if (showPa && l.translationPa) parts.push(l.translationPa);
            return parts.join('\n');
        });

        const shareData = {
            title: 'Divine Shabad - Gurbani Live Radio',
            text: `${lines.join('\n\n')}\n\n— Ang ${this.currentShabad.ang || '—'}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                Utils.haptic('success');
            } catch (error) {
                if (error.name !== 'AbortError') this.copyShabad();
            }
        } else {
            this.copyShabad();
        }
    }

    saveShabad() {
        if (!this.currentShabad) return;

        const id = this.currentShabad.shabadId;
        if (!id) {
            this.showToast('❌ Shabad ID missing', 'error');
            return;
        }

        const saved = Utils.storage.get('gurbani_saved_shabads', []);
        const idx = saved.findIndex(s => String(s.shabadId) === String(id));

        if (idx >= 0) {
            saved.splice(idx, 1);
            Utils.storage.set('gurbani_saved_shabads', saved);
            this.showToast('💔 Shabad removed', 'info');
            this.shabadBookmarked = false;
        } else {
            const firstLine = this.currentShabad.verses.find(v => v.gurmukhi);
            const pangti = firstLine ? firstLine.gurmukhi : 'Unknown Shabad';

            saved.push({
                shabadId: id,
                pangti: pangti,
                timestamp: new Date().toISOString(),
                fullShabad: this.currentShabad
            });

            Utils.storage.set('gurbani_saved_shabads', saved);
            this.showToast('❤️ Shabad saved', 'success');
            this.shabadBookmarked = true;
        }
        this.updateBookmarkButton();
        this.renderSavedShabadsList(); // Refresh list if open
    }

    openSavedShabads() {
        const modal = this.elements.savedShabadsModal || document.getElementById('savedShabadsModal');
        if (modal) {
            this.renderSavedShabadsList();
            modal.classList.add('active');
            // Also add modal--open class for body scroll lock etc if handled by CSS
            modal.classList.add('modal--open');
        }
    }

    closeSavedShabads() {
        const modal = this.elements.savedShabadsModal || document.getElementById('savedShabadsModal');
        if (modal) {
            modal.classList.remove('active');
            modal.classList.remove('modal--open');
        }
    }

    renderSavedShabadsList() {
        const listEl = this.elements.savedShabadsList || document.getElementById('savedShabadsList');
        if (!listEl) return;

        const saved = Utils.storage.get('gurbani_saved_shabads', []);

        if (saved.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No saved shabads yet</div>';
            return;
        }

        // Sort by date desc
        saved.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        listEl.innerHTML = saved.map(s => `
            <div class="saved-shabad-item" onclick="window.ui.loadSavedShabad('${s.shabadId}')">
                <div class="saved-shabad-info">
                    <div class="saved-shabad-pangti">${Utils.escapeHtml(s.pangti)}</div>
                    <div class="saved-shabad-date">${new Date(s.timestamp).toLocaleDateString()}</div>
                </div>
                <button class="delete-saved-btn" onclick="window.ui.deleteSavedShabad('${s.shabadId}', event)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    loadSavedShabad(id) {
        const saved = Utils.storage.get('gurbani_saved_shabads', []);
        const item = saved.find(s => String(s.shabadId) === String(id));
        if (item && item.fullShabad) {
            this.currentShabad = item.fullShabad;
            this.renderShabad();
            this.closeSavedShabads();

            // Check bookmark state
            this.shabadBookmarked = true;
            this.updateBookmarkButton();
        }
    }

    deleteSavedShabad(id, e) {
        if (e) e.stopPropagation();
        if (!confirm('Remove this saved shabad?')) return;

        const saved = Utils.storage.get('gurbani_saved_shabads', []);
        const newSaved = saved.filter(s => String(s.shabadId) !== String(id));
        Utils.storage.set('gurbani_saved_shabads', newSaved);
        this.renderSavedShabadsList();

        // Update current button state if matches
        if (this.currentShabad && String(this.currentShabad.shabadId) === String(id)) {
            this.shabadBookmarked = false;
            this.updateBookmarkButton();
        }
    }

    updateBookmarkButton() {
        const btn = this.elements.bookmarkShabadBtn;
        if (!btn) return;

        const icon = btn.querySelector('i');
        if (this.shabadBookmarked) {
            icon?.classList.remove('far');
            icon?.classList.add('fas');
            btn.classList.add('active');
        } else {
            icon?.classList.remove('fas');
            icon?.classList.add('far');
            btn.classList.remove('active');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SHARE & MODALS
    // ═══════════════════════════════════════════════════════════════════════════════

    setupShareButtons() {
        const shareUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent('🙏 Listen to Divine Gurbani Radio - 24/7 Sacred Kirtan');

        const shareLinks = {
            shareWhatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
            shareTelegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
            shareFacebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
            shareTwitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`
        };

        Object.entries(shareLinks).forEach(([id, url]) => {
            this.addClickHandler(id, () => {
                if (window.Capacitor?.isNativePlatform?.()) {
                    navigator.clipboard?.writeText(url).catch(() => {});
                } else {
                    window.open(url, '_blank', 'width=600,height=400');
                }
                Utils.haptic('light');
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (typeof modal.showModal === 'function') modal.showModal();
            modal.classList.add('modal--open');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal--open');
            if (typeof modal.close === 'function') modal.close();
            document.body.style.overflow = '';
        }
    }

    toggleVolumePopup() {
        const { volumePopup } = this.elements;
        if (volumePopup) {
            const isVisible = volumePopup.getAttribute('data-visible') === 'true';
            volumePopup.setAttribute('data-visible', !isVisible);
        }
    }

    toggleFavorite() {
        const { favoriteBtn } = this.elements;
        if (!favoriteBtn) return;

        const isFavorited = favoriteBtn.classList.toggle('control-btn--favorited');
        const icon = favoriteBtn.querySelector('i');
        if (icon) icon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        this.showToast(isFavorited ? '❤️ Added to favorites' : '💔 Removed', 'success');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PROGRESS BAR
    // ═══════════════════════════════════════════════════════════════════════════════

    setupProgressBar() {
        const progressContainer = this.elements.progressTrack;
        if (!progressContainer) return;

        const { progressFill, progressScrubber } = this.elements;
        let isDragging = false;

        const updateProgressFromEvent = (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const percent = Utils.clamp((clientX - rect.left) / rect.width * 100, 0, 100);
            if (progressFill) progressFill.style.width = `${percent}%`;
            if (progressScrubber) progressScrubber.style.left = `${percent}%`;
            return percent;
        };

        const handleStart = (e) => {
            isDragging = true;
            this.isDraggingProgress = true;
            Utils.haptic('light');
            updateProgressFromEvent(e);
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            updateProgressFromEvent(e);
        };

        const handleEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            this.isDraggingProgress = false;
            const percent = updateProgressFromEvent(e.changedTouches ? e.changedTouches[0] : e);
            this.audio.seek(percent);
        };

        progressContainer.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        progressContainer.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);

        progressContainer.addEventListener('click', (e) => {
            if (!isDragging) {
                const rect = progressContainer.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                this.audio.seek(Utils.clamp(percent, 0, 100));
                Utils.haptic('light');
            }
        });
    }

    setupKeyboardShortcuts() {
        if (this.boundHandlers.has('keyboard_shortcuts')) return;

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.audio.toggle();
                    break;
                case 'arrowright':
                    e.preventDefault();
                    if (e.shiftKey) this.audio.next();
                    else this.audio.seek(this.audio.currentTime + 10, true);
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    if (e.shiftKey) this.audio.previous();
                    else this.audio.seek(this.audio.currentTime - 10, true);
                    break;
                case 'm':
                    e.preventDefault();
                    this.audio.toggleMute();
                    break;
                case 'g':
                    e.preventDefault();
                    this.audio.goLive();
                    break;
            }
        });

        this.boundHandlers.set('keyboard_shortcuts', true);
    }

    setupAudioEventListeners() {
        this.audio.on('timeupdate', (data) => {
            if (!this.isDraggingProgress) {
                this.updateProgress(data.progress);
                this.updateTimeDisplay(data.currentTime, data.duration);
            }
        });

        this.audio.on('playing', (info) => {
            this.updatePlayButton(true);
            this.activatePlayerGlow();
        });

        this.audio.on('paused', () => {
            this.updatePlayButton(false);
            this.deactivatePlayerGlow();
        });

        this.audio.on('stopped', () => {
            this.updatePlayButton(false);
            this.updateProgress(0);
            this.updateTimeDisplay(0, 0);
            this.deactivatePlayerGlow();
        });

        this.audio.on('loading', () => this.setLoadingState(true));
        this.audio.on('canplay', () => this.setLoadingState(false));
        this.audio.on('buffering', () => this.setLoadingState(true));
        this.audio.on('volumechange', (data) => this.updateVolumeUI(data.volume));
        this.audio.on('liveStatusChange', (data) => this.updateLiveStatus(data.isLive));

        this.audio.on('error', (error) => {
            this.setLoadingState(false);
            if (error.type !== 'permission') {
                this.showToast(`⚠️ ${error.message}`, 'error');
            }
        });
    }

    loadSavedState() {
        const savedVolume = Utils.storage.get('volume', 0.8);
        this.audio.setVolume(savedVolume);
        this.updateVolumeUI(savedVolume);
        this.audio.currentTrackIndex = Utils.storage.get('lastTrackIndex', 0);
    }

    updatePlayButton(isPlaying) {
        const { playBtn, playIcon } = this.elements;
        if (playBtn) playBtn.classList.toggle('control-btn--playing', isPlaying);
        if (playIcon) {
            playIcon.classList.remove('fa-play', 'fa-pause');
            playIcon.classList.add(isPlaying ? 'fa-pause' : 'fa-play');
        }
    }

    updateProgress(percent) {
        const { progressFill, progressScrubber } = this.elements;
        const clamped = Utils.clamp(percent, 0, 100);
        if (progressFill) progressFill.style.width = `${clamped}%`;
        if (progressScrubber) progressScrubber.style.left = `${clamped}%`;
    }

    updateTimeDisplay(current, duration) {
        const { currentTime, totalTime } = this.elements;
        if (currentTime) currentTime.textContent = Utils.formatTime(current);
        if (totalTime) totalTime.textContent = Utils.formatTime(duration);
    }

    updateVolumeUI(volume) {
        const { volumeSlider, volumeValue, volumeFill, volumeBtn } = this.elements;
        const percent = Math.round(volume * 100);
        if (volumeSlider) volumeSlider.value = percent;
        if (volumeValue) volumeValue.textContent = `${percent}%`;
        if (volumeFill) volumeFill.style.width = `${percent}%`;
        if (volumeBtn) {
            const icon = volumeBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas ' + (
                    volume === 0 ? 'fa-volume-mute' :
                        volume < 0.3 ? 'fa-volume-off' :
                            volume < 0.7 ? 'fa-volume-down' : 'fa-volume-up'
                );
            }
        }
    }

    setLoadingState(isLoading) {
        const { playBtn, playIcon } = this.elements;
        if (playBtn) playBtn.classList.toggle('control-btn--loading', isLoading);
        if (playIcon && isLoading) {
            playIcon.classList.remove('fa-play', 'fa-pause');
            playIcon.classList.add('fa-spinner', 'fa-spin');
        } else if (playIcon) {
            playIcon.classList.remove('fa-spinner', 'fa-spin');
            playIcon.classList.add(this.audio.isPlaying ? 'fa-pause' : 'fa-play');
        }
    }

    activatePlayerGlow() {
        const { playerCard } = this.elements;
        if (playerCard) playerCard.classList.add('player__card--playing');
    }

    deactivatePlayerGlow() {
        const { playerCard } = this.elements;
        if (playerCard) playerCard.classList.remove('player__card--playing');
    }

    showToast(message, type = 'info', duration = 3000) {
        this.toastQueue.push({ message, type, duration });
        if (!this.isShowingToast) this.processToastQueue();
    }

    processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.isShowingToast = false;
            return;
        }

        this.isShowingToast = true;
        const { message, type, duration } = this.toastQueue.shift();
        const { toast } = this.elements;
        if (!toast) {
            this.isShowingToast = false;
            return;
        }

        const toastMessage = toast.querySelector('.toast__message');
        const toastIcon = toast.querySelector('.toast__icon i');

        if (toastMessage) toastMessage.textContent = message;
        if (toastIcon) {
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            toastIcon.className = `fas ${icons[type] || icons.info}`;
        }

        toast.className = `toast toast--${type}`;
        requestAnimationFrame(() => toast.classList.add('toast--visible'));

        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => this.processToastQueue(), 300);
        }, duration);
    }

    hideLoadingScreen() {
        const { loadingScreen } = this.elements;
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    destroy() {
        if (this.listenerUpdateInterval) {
            clearInterval(this.listenerUpdateInterval);
        }
        this.boundHandlers.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

class GurbaniRadioApp {
    constructor() {
        this.stateManager = new StateManager({
            isReady: false,
            isPlaying: false,
            volume: 0.8,
            isLive: true
        });

        this.audioEngine = null;
        this.visualizer = null;
        this.particles = null;
        this.uiController = null;
        this.isInitialized = false;

        console.log('[GurbaniRadio] ੴ Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh ੴ');
    }

    async init() {
        if (this.isInitialized) return;

        try {
            console.log('[GurbaniRadio] Initializing application...');

            // Initialize Audio Engine
            this.audioEngine = new AudioEngine({
                autoPlay: true,
                virtualLive: true,
                fftSize: 256
            });

            // Initialize UI Controller
            this.uiController = new UIController(this.audioEngine, this.stateManager);

            // Initialize Visualizer (disabled on mobile)
            this.visualizer = new VisualizerEngine(this.audioEngine, {
                barCount: 12,
                sensitivity: 1.8
            });

            // Initialize Particle System (disabled on mobile)
            const particleContainer = document.getElementById('particles');
            if (particleContainer) {
                this.particles = new ParticleSystem(particleContainer, { count: 40 });
            }

            // Setup global handlers
            this.setupHandlers();

            this.isInitialized = true;
            this.stateManager.setState({ isReady: true });

            console.log('[GurbaniRadio] ✅ Application initialized successfully');

        } catch (error) {
            console.error('[GurbaniRadio] ❌ Initialization failed:', error);
        }
    }

    setupHandlers() {
        // Visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.particles) this.particles.pause();
            } else {
                if (this.particles) this.particles.resume();
            }
        });

        // Online/Offline status
        window.addEventListener('online', () => {
            this.uiController?.showToast('🌐 Back online!', 'success');
        });

        window.addEventListener('offline', () => {
            this.uiController?.showToast('📡 Connection lost', 'warning');
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (this.audioEngine) {
                Utils.storage.set('lastVolume', this.audioEngine.volume);
                Utils.storage.set('lastTrackIndex', this.audioEngine.currentTrackIndex);
            }
        });
    }

    destroy() {
        this.audioEngine?.destroy();
        this.visualizer?.destroy();
        this.particles?.destroy();
        this.uiController?.destroy();
        this.isInitialized = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

let gurbaniRadio = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Init] DOM Ready - Starting app...');

    try {
        gurbaniRadio = new GurbaniRadioApp();
        await gurbaniRadio.init();

        // Expose to global scope for debugging
        window.gurbaniRadio = gurbaniRadio;
        window.AUDIO_CONFIG = AUDIO_CONFIG;
        window.NAV_PATHS = NAV_PATHS;

    } catch (error) {
        console.error('[Init] Critical error:', error);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                console.log('[SW] No existing registration');
                return;
            }

            try {
                await registration.update();
            } catch (e) {
                console.warn('[SW] Update check failed:', e);
            }

            console.log('[SW] Ready:', registration.scope);
        } catch (error) {
            console.warn('[SW] Registration failed:', error);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIQUID GLASS OPTICAL ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

(function () {
    let ticking = false;

    function update() {
        const scrollY = window.scrollY || window.pageYOffset;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? scrollY / max : 0;

        document.documentElement.style.setProperty("--liquid-flow", scrollY * 0.15);
        document.documentElement.style.setProperty("--refraction", 20 + progress * 40);
        document.documentElement.style.setProperty("--highlight-shift", progress * 100);
        document.documentElement.style.setProperty("--dispersion", 0.3 + progress * 0.7);

        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    update();
})();

// ═══════════════════════════════════════════════════════════════════════════════
// PWA INSTALL PROMPT - ANHAD
// ═══════════════════════════════════════════════════════════════════════════════

let deferredPrompt = null;

function isStandaloneMode() {
    try {
        const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)');
        const displayModeStandalone = !!mq?.matches;
        const iosStandalone = typeof navigator !== 'undefined' && 'standalone' in navigator ? !!navigator.standalone : false;
        const persisted = localStorage.getItem('pwaInstalled') === 'true';
        return displayModeStandalone || iosStandalone || persisted;
    } catch (e) {
        return false;
    }
}

if (isStandaloneMode()) {
    hideInstallButton();
}

window.addEventListener('beforeinstallprompt', (e) => {
    if (isStandaloneMode()) {
        return;
    }
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt captured');
    // Show install button after a short delay
    setTimeout(showInstallButton, 2000);
});

function showInstallButton() {
    const installBtn = document.getElementById('installAppBtn');
    if (!installBtn || deferredPrompt === null) return;

    installBtn.style.display = 'flex';
    
    // Add entrance animation
    requestAnimationFrame(() => {
        installBtn.classList.add('visible');
    });

    // Remove old listeners by cloning
    const newBtn = installBtn.cloneNode(true);
    installBtn.parentNode.replaceChild(newBtn, installBtn);

    newBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('[PWA] ANHAD installed');
                hideInstallButton();
            }
            deferredPrompt = null;
        }
    });
}

function hideInstallButton() {
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.classList.remove('visible');
        setTimeout(() => {
            installBtn.style.display = 'none';
        }, 400);
    }
}

window.addEventListener('appinstalled', () => {
    console.log('[PWA] ANHAD was installed successfully');
    try {
        localStorage.setItem('pwaInstalled', 'true');
    } catch (e) { }
    hideInstallButton();
    deferredPrompt = null;

    if (gurbaniRadio?.uiController) {
        gurbaniRadio.uiController.showToast('✅ ANHAD installed successfully!', 'success');
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION LOADER CLEANUP - FIX FOR BACK BUTTON LOADERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Clean up navigation loading overlay on page show.
 * This handles the bfcache (back-forward cache) where navigating back
 * restores the page state including any active loading overlays.
 */
window.addEventListener('pageshow', (event) => {
    // Always clean up on pageshow, whether from bfcache or fresh load
    const overlay = document.getElementById('navLoadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.opacity = '0';
        overlay.classList.remove('visible');
    }

    // Also check for any module-specific loaders that might be stuck
    document.querySelectorAll('.loading-overlay, .nav-loading-overlay').forEach(el => {
        el.style.display = 'none';
        el.style.opacity = '0';
    });

    console.log('[NAV] Page shown, loaders cleaned up. Persisted:', event.persisted);
});

/**
 * Before unload - hide loader to prevent flash on back navigation
 */
window.addEventListener('pagehide', () => {
    const overlay = document.getElementById('navLoadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.opacity = '0';
        overlay.classList.remove('visible');
    }
});

/**
 * Also handle visibility change for tab switching scenarios
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Small delay to allow page to fully render before hiding any stuck loaders
        setTimeout(() => {
            const overlay = document.getElementById('navLoadingOverlay');
            if (overlay && overlay.classList.contains('visible')) {
                // If overlay is still showing after 100ms on visibility, something is wrong
                overlay.style.display = 'none';
                overlay.classList.remove('visible');
            }
        }, 100);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// iOS VOLUME SLIDER & ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════

(function initIOSBottomControls() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupIOSControls);
    } else {
        setupIOSControls();
    }

    function setupIOSControls() {
        // Elements
        const iosVolumeSlider = document.getElementById('iosVolumeSlider');
        const iosVolumeFill = document.getElementById('iosVolumeFill');
        const iosVolumeThumb = document.getElementById('iosVolumeThumb');
        const volumeMuteBtn = document.getElementById('volumeMuteBtn');
        const volumeMaxBtn = document.getElementById('volumeMaxBtn');

        // Action buttons
        const lyricsBtn = document.getElementById('lyricsBtn');
        const repeatBtn = document.getElementById('repeatBtn');
        const airplayBtn = document.getElementById('airplayBtn');
        const queueBtn = document.getElementById('queueBtn');

        let lastVolume = 0.8; // Store last volume for unmute

        // ─────────────────────────────────────────────────────────────────
        // VOLUME SLIDER
        // ─────────────────────────────────────────────────────────────────
        function updateVolumeUI(volume) {
            const percent = Math.round(volume * 100);
            if (iosVolumeFill) iosVolumeFill.style.width = `${percent}%`;
            if (iosVolumeThumb) iosVolumeThumb.style.left = `${percent}%`;
            if (iosVolumeSlider) iosVolumeSlider.value = percent;
        }

        function setVolume(volume) {
            volume = Math.max(0, Math.min(1, volume));

            // Update audio engine if available
            if (window.gurbaniRadio?.audioEngine) {
                window.gurbaniRadio.audioEngine.setVolume(volume);
            }

            // Update UI
            updateVolumeUI(volume);

            // Store for persistence
            if (volume > 0) lastVolume = volume;
            try {
                localStorage.setItem('volume', volume.toString());
            } catch (e) { }
        }

        if (iosVolumeSlider) {
            iosVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                setVolume(volume);
            });

            // Initialize with saved volume
            try {
                const savedVolume = parseFloat(localStorage.getItem('volume') || '0.8');
                updateVolumeUI(savedVolume);
                lastVolume = savedVolume > 0 ? savedVolume : 0.8;
            } catch (e) {
                updateVolumeUI(0.8);
            }
        }

        // Mute button (low speaker icon)
        if (volumeMuteBtn) {
            volumeMuteBtn.addEventListener('click', () => {
                const currentVolume = window.gurbaniRadio?.audioEngine?.volume ?? 0.8;

                if (currentVolume > 0) {
                    // Mute
                    lastVolume = currentVolume;
                    setVolume(0);
                } else {
                    // Unmute
                    setVolume(lastVolume || 0.5);
                }

                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }

        // Max volume button (high speaker icon)
        if (volumeMaxBtn) {
            volumeMaxBtn.addEventListener('click', () => {
                setVolume(1);
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }

        // Listen for volume changes from audio engine
        if (window.gurbaniRadio?.audioEngine) {
            window.gurbaniRadio.audioEngine.on('volumechange', (data) => {
                updateVolumeUI(data.volume);
            });
        }

        // Also check periodically for late-initialized audio engine
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            checkCount++;
            if (window.gurbaniRadio?.audioEngine) {
                window.gurbaniRadio.audioEngine.on('volumechange', (data) => {
                    updateVolumeUI(data.volume);
                });
                // Sync initial volume
                const currentVol = window.gurbaniRadio.audioEngine.volume;
                if (currentVol !== undefined) updateVolumeUI(currentVol);
                clearInterval(checkInterval);
            }
            if (checkCount > 20) clearInterval(checkInterval);
        }, 500);

        // ─────────────────────────────────────────────────────────────────
        // ACTION BUTTONS
        // ─────────────────────────────────────────────────────────────────

        // Lyrics button - show/hide lyrics overlay or modal
        if (lyricsBtn) {
            lyricsBtn.addEventListener('click', () => {
                lyricsBtn.classList.toggle('active');
                // Could integrate with a lyrics display feature
                console.log('[iOS Controls] Lyrics toggled');
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }

        // Repeat button - cycle through repeat modes
        if (repeatBtn) {
            let repeatMode = 0; // 0: off, 1: repeat all, 2: repeat one
            const badge = repeatBtn.querySelector('.ios-action-badge');

            repeatBtn.addEventListener('click', () => {
                repeatMode = (repeatMode + 1) % 3;

                if (repeatMode === 0) {
                    repeatBtn.classList.remove('active');
                    if (badge) badge.style.display = 'none';
                } else if (repeatMode === 1) {
                    repeatBtn.classList.add('active');
                    if (badge) {
                        badge.style.display = 'flex';
                        badge.textContent = '∞';
                    }
                } else {
                    repeatBtn.classList.add('active');
                    if (badge) {
                        badge.style.display = 'flex';
                        badge.textContent = '1';
                    }
                }

                // Apply to audio engine if available
                if (window.gurbaniRadio?.audioEngine) {
                    window.gurbaniRadio.audioEngine.repeatMode = repeatMode;
                }

                console.log('[iOS Controls] Repeat mode:', repeatMode);
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }

        // AirPlay button - show cast/share options
        if (airplayBtn) {
            airplayBtn.addEventListener('click', () => {
                airplayBtn.classList.toggle('active');

                // Try to show native share if available
                if (navigator.share) {
                    navigator.share({
                        title: 'ANHAD - Divine Gurbani',
                        text: '🙏 Listen to sacred Gurbani Kirtan 24/7',
                        url: window.location.href
                    }).catch(() => { });
                }

                console.log('[iOS Controls] AirPlay/Share clicked');
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }

        // Queue button - show stations list
        if (queueBtn) {
            queueBtn.addEventListener('click', () => {
                queueBtn.classList.toggle('active');

                // Show stations or schedule modal
                const scheduleModal = document.getElementById('scheduleModal');
                if (scheduleModal) {
                    if (scheduleModal.classList.contains('modal--open')) {
                        scheduleModal.classList.remove('modal--open');
                    } else {
                        scheduleModal.classList.add('modal--open');
                    }
                }

                console.log('[iOS Controls] Queue clicked');
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }

        console.log('[iOS Controls] Bottom controls initialized');
    }
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   SERVICE WORKER MESSAGE HANDLER
   Handles background notification tracking to prevent duplicates
═══════════════════════════════════════════════════════════════════════════════ */

(function initServiceWorkerHandler() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, key, id, hour, today } = event.data || {};

        // Handle notification shown check from SW
        if (type === 'CHECK_NOTIFICATION_SHOWN' && event.ports?.[0]) {
            const shown = sessionStorage.getItem(key) === 'true' ||
                localStorage.getItem(key) === 'true';
            event.ports[0].postMessage({ shown });
            return;
        }

        // Mark notification as shown
        if (type === 'NOTIFICATION_SHOWN' && key) {
            sessionStorage.setItem(key, 'true');
            localStorage.setItem(key, 'true');
            console.log('[SW Handler] Notification marked as shown:', id);
        }

        // Handle Naam Abhyas schedule queries (if naam-abhyas.js isn't loaded)
        if (type === 'GET_NAAM_ABHYAS_SCHEDULE' && event.ports?.[0]) {
            // Try to get schedule from localStorage for SW
            try {
                const config = JSON.parse(localStorage.getItem('naam_abhyas_config') || '{}');
                const history = JSON.parse(localStorage.getItem('naam_abhyas_history') || '{}');
                const todayKey = new Date().toLocaleDateString('en-CA');
                const schedule = history.scheduleHistory?.[todayKey] || {};

                const sessions = Object.entries(schedule)
                    .filter(([h, s]) => s && s.status === 'pending')
                    .map(([h, s]) => ({
                        hour: parseInt(h),
                        startMinute: s.startMinute,
                        duration: config.duration || 2,
                        notified: !!s.notified
                    }));

                event.ports[0].postMessage({
                    sessions,
                    enabled: config.enabled,
                    duration: config.duration
                });
            } catch (e) {
                event.ports[0].postMessage({ sessions: [], enabled: false });
            }
            return;
        }

        // Handle Naam Abhyas notification confirmation
        if (type === 'NAAM_ABHYAS_NOTIFIED' && hour !== undefined) {
            try {
                const history = JSON.parse(localStorage.getItem('naam_abhyas_history') || '{}');
                const todayKey = today || new Date().toLocaleDateString('en-CA');

                if (history.scheduleHistory?.[todayKey]?.[hour]) {
                    history.scheduleHistory[todayKey][hour].notified = true;
                    localStorage.setItem('naam_abhyas_history', JSON.stringify(history));
                    console.log('[SW Handler] Naam Abhyas notified for hour:', hour);
                }
            } catch (e) {
                console.warn('[SW Handler] Error marking notification:', e);
            }
        }
    });

    console.log('[SW Handler] Global Service Worker message handler initialized');
})();

