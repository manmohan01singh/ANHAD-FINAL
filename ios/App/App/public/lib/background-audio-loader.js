/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEAMLESS BACKGROUND AUDIO LOADER
 * 
 * Ultra-fast audio resume for seamless page transitions.
 * Creates audio element IMMEDIATELY and preloads for zero-gap playback.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'gurbaniRadioState';
    const BROADCAST_START_KEY = 'gurbani_broadcast_start';
    const STATE_VALIDITY_MS = 120000; // 2 minutes validity for smoother experience

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    const RENDER_BASE = (() => {
        try {
// For Capacitor apps, always use production URL
                if (window.Capacitor) return 'https://anhad-final.onrender.com';
                
                            const port = window.location.port;
            const host = window.location.hostname;
            if (port === '3000' || port === '3001') return 'http://localhost:3000';
            if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
            if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
        } catch (e) {}
        return 'https://anhad-final.onrender.com';
    })();

    const CONFIG = {
        baseUrl: RENDER_BASE + '/audio',

        totalTracks: 40,
        defaultDuration: 3600,

        getAudioUrl(index) {
            const safeIndex = ((index % this.totalTracks) + this.totalTracks) % this.totalTracks;
            return `${this.baseUrl}/day-${safeIndex + 1}.webm`;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // VIRTUAL LIVE CALCULATOR
    // ═══════════════════════════════════════════════════════════════════════════

    function getBroadcastStart() {
        return 1704067200000; // Universal deterministic fallback epoch (Jan 1, 2024)
    }

    function getCurrentLivePosition() {
        const broadcastStart = getBroadcastStart();
        const elapsedSeconds = (Date.now() - broadcastStart) / 1000;
        const totalDuration = CONFIG.totalTracks * CONFIG.defaultDuration;
        const positionInPlaylist = elapsedSeconds % totalDuration;

        const trackIndex = Math.floor(positionInPlaylist / CONFIG.defaultDuration);
        const position = positionInPlaylist % CONFIG.defaultDuration;

        return { trackIndex, position };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                const elapsed = Date.now() - (state.timestamp || 0);

                // Check if state is still valid
                if (elapsed <= STATE_VALIDITY_MS) {
                    return state;
                }
            }
        } catch (e) { }
        return null;
    }

    function saveState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...state,
                timestamp: Date.now()
            }));
        } catch (e) { }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEAMLESS BACKGROUND AUDIO PLAYER
    // ═══════════════════════════════════════════════════════════════════════════

    class SeamlessAudioPlayer {
        constructor() {
            this.audio = null;
            this.isPlaying = false;
            this.volume = 0.8;
            this.currentTrackIndex = 0;
            this.isInitialized = false;
        }

        // Called immediately on script load
        immediateInit() {
            const state = loadState();

            if (!state || !state.isPlaying) {
                console.log('[SeamlessAudio] No active playback state');
                return;
            }

            console.log('[SeamlessAudio] 🚀 Immediate init - resuming playback');
            this.volume = state.volume || 0.8;
            this.currentTrackIndex = state.stationIndex || 0;

            // Create audio element immediately
            this.createAudioElement();

            // Start loading audio immediately (don't wait for DOM)
            this.preloadAndPlay();
        }

        createAudioElement() {
            // Check for existing element
            const existing = document.getElementById('backgroundAudioPlayer');
            if (existing) {
                this.audio = existing;
                return;
            }

            this.audio = document.createElement('audio');
            this.audio.id = 'backgroundAudioPlayer';
            this.audio.preload = 'auto';
            this.audio.crossOrigin = 'anonymous';
            this.audio.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';

            // Append to document as soon as possible
            const appendAudio = () => {
                if (document.body) {
                    document.body.appendChild(this.audio);
                } else {
                    // Body not ready, wait for it
                    requestAnimationFrame(appendAudio);
                }
            };
            appendAudio();

            // Event listeners
            this.audio.addEventListener('ended', () => this.onTrackEnded());
            this.audio.addEventListener('error', () => this.onError());
            this.audio.addEventListener('play', () => this.onPlay());
            this.audio.addEventListener('pause', () => this.onPause());
            this.audio.addEventListener('canplaythrough', () => {
                console.log('[SeamlessAudio] ✅ Audio ready to play');
            });
        }

        async preloadAndPlay() {
            const livePos = getCurrentLivePosition();
            this.currentTrackIndex = livePos.trackIndex;

            const url = CONFIG.getAudioUrl(livePos.trackIndex);
            console.log(`[SeamlessAudio] Loading: ${url} @ ${Math.floor(livePos.position)}s`);

            this.audio.src = url;
            this.audio.volume = this.volume;

            try {
                // Load immediately
                this.audio.load();

                // Wait for enough data to play
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

                    const onCanPlay = () => {
                        clearTimeout(timeout);
                        this.audio.removeEventListener('canplay', onCanPlay);
                        this.audio.removeEventListener('error', onError);
                        resolve();
                    };

                    const onError = (e) => {
                        clearTimeout(timeout);
                        this.audio.removeEventListener('canplay', onCanPlay);
                        this.audio.removeEventListener('error', onError);
                        if (e.target.error.code === 2) {
                            this._showErrorMessage('Audio service unavailable due to server overload. Please try again later.');
                        } else {
                            this._showErrorMessage('Audio service temporarily unavailable. Please try again later.');
                        }
                        reject(e);
                    };

                    this.audio.addEventListener('canplay', onCanPlay);
                    this.audio.addEventListener('error', onError);
                });

                // Seek to live position
                const safePosition = Math.min(livePos.position, (this.audio.duration || 3600) - 5);
                this.audio.currentTime = Math.max(0, safePosition);

                // Play!
                await this.audio.play();
                this.isPlaying = true;
                this.isInitialized = true;

                console.log('[SeamlessAudio] ▶️ Playback started seamlessly!');

                // Notify UI
                this.dispatchStateChange(true);

            } catch (e) {
                console.warn('[SeamlessAudio] Could not auto-resume:', e.message);
                this._showErrorMessage('Audio service temporarily unavailable. Please try again later.');
                // Store for manual resume
                this.isInitialized = true;
            }
        }

        onTrackEnded() {
            this.preloadAndPlay();
        }

        onError() {
            this._showErrorMessage('Audio service temporarily unavailable. Please try again later.');
            console.warn('[SeamlessAudio] Error, retrying in 2s...');
            setTimeout(() => this.preloadAndPlay(), 2000);
        }

        _showErrorMessage(message) {
            // Show toast if available
            if (typeof window.showToast === 'function') {
                window.showToast(message, { type: 'error', duration: 5000 });
                return;
            }
            
            // Create a simple inline notification
            if (!this._errorBanner) {
                this._errorBanner = document.createElement('div');
                this._errorBanner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#ef4444;color:white;padding:12px 24px;border-radius:8px;z-index:99999;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
                document.body.appendChild(this._errorBanner);
            }
            this._errorBanner.textContent = message;
            this._errorBanner.style.display = 'block';
            
            // Hide after 5 seconds
            setTimeout(() => {
                if (this._errorBanner) this._errorBanner.style.display = 'none';
            }, 5000);
        }

        onPlay() {
            this.isPlaying = true;
            saveState({
                isPlaying: true,
                stationIndex: this.currentTrackIndex,
                volume: this.volume,
                currentTime: this.audio?.currentTime || 0
            });
            this.dispatchStateChange(true);
        }

        onPause() {
            this.isPlaying = false;
            saveState({
                isPlaying: false,
                stationIndex: this.currentTrackIndex,
                volume: this.volume,
                currentTime: this.audio?.currentTime || 0
            });
            this.dispatchStateChange(false);
        }

        dispatchStateChange(isPlaying) {
            window.dispatchEvent(new CustomEvent('gurbaniRadioStateChange', {
                detail: {
                    isPlaying,
                    trackIndex: this.currentTrackIndex,
                    currentTime: this.audio?.currentTime || 0
                }
            }));
        }

        toggle() {
            if (!this.audio) {
                this.createAudioElement();
                this.preloadAndPlay();
                return;
            }

            if (this.isPlaying) {
                this.audio.pause();
            } else {
                this.preloadAndPlay();
            }
        }

        play() {
            if (!this.audio) {
                this.createAudioElement();
            }
            this.preloadAndPlay();
        }

        pause() {
            if (this.audio && this.isPlaying) {
                this.audio.pause();
            }
        }

        setVolume(value) {
            this.volume = Math.max(0, Math.min(1, value));
            if (this.audio) {
                this.audio.volume = this.volume;
            }
        }

        getCurrentTrackInfo() {
            return {
                title: `Day ${this.currentTrackIndex + 1} — ਗੁਰਬਾਣੀ ਕੀਰਤਨ`,
                artist: 'Live Kirtan • Divine Shabad',
                isPlaying: this.isPlaying
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IMMEDIATE INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Don't initialize on the Gurbani Radio page itself
    const isRadioPage = window.location.pathname.includes('gurbani-radio.html') ||
        window.location.pathname.includes('gurbani-radio-new.html') ||
        window.location.pathname.includes('GurbaniRadio');

    if (!isRadioPage) {
        // Create player immediately
        window.backgroundAudio = new SeamlessAudioPlayer();

        // Start initialization IMMEDIATELY - don't wait for DOM
        window.backgroundAudio.immediateInit();

        console.log('🔊 Seamless Audio Loader initialized');
    }

})();
