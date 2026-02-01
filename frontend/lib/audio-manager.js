/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD AUDIO MANAGER - Cross-Page Persistent Audio Controller
 * 
 * Features:
 * - Creates hidden iframe for persistent audio
 * - BroadcastChannel for state synchronization
 * - Auto-resume on page load
 * - Seamless playback across navigation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const CHANNEL_NAME = 'anhad_audio_channel';
    const FRAME_ID = 'anhad-audio-frame';

    // Singleton pattern
    if (window.AnhadAudioManager) {
        return;
    }

    class AnhadAudioManager {
        constructor() {
            this.bc = new BroadcastChannel(CHANNEL_NAME);
            this.state = {
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                volume: 0.7,
                muted: false,
                streamType: 'darbar-sahib',
                trackIndex: 0,
                src: '',
                timestamp: 0
            };
            this.listeners = new Set();
            this.frameReady = false;
            this.pendingCommands = [];

            this._init();
        }

        _init() {
            // Set up BroadcastChannel listener
            this.bc.onmessage = (event) => {
                if (event.data.type === 'state') {
                    this.state = { ...this.state, ...event.data };
                    this._notifyListeners();
                } else if (event.data.type === 'error') {
                    console.warn('[AudioManager] Error:', event.data.message);
                }
            };

            // Create hidden iframe if not on player page
            this._createAudioFrame();

            // Request initial state
            setTimeout(() => {
                this._sendCommand('get_state');
            }, 100);

            // Handle storage events from other tabs
            window.addEventListener('storage', (e) => {
                if (e.key === 'anhad_audio_state') {
                    this._sendCommand('get_state');
                }
            });

            console.log('[AudioManager] Initialized');
        }

        _createAudioFrame() {
            // Don't create on player pages - they have their own audio
            const path = window.location.pathname.toLowerCase();
            if (path.includes('ios17-gurbani-radio') || path.includes('gurbani-radio.html')) {
                return;
            }

            // Check if frame already exists
            if (document.getElementById(FRAME_ID)) {
                this.frameReady = true;
                return;
            }

            // Determine correct path to audio-frame.html
            let framePath = 'lib/audio-frame.html';

            // Adjust path based on current location depth
            if (path.includes('/gurbanikhoj/') || path.includes('/hukamnama/') ||
                path.includes('/nitnem/') || path.includes('/sehajpaath/') ||
                path.includes('/calendar/') || path.includes('/notes/') ||
                path.includes('/reminders/') || path.includes('/naamabhyas/') ||
                path.includes('/randomshabad/') || path.includes('/nitnemtracker/')) {
                framePath = '../lib/audio-frame.html';
            }

            const iframe = document.createElement('iframe');
            iframe.id = FRAME_ID;
            iframe.src = framePath;
            iframe.style.cssText = `
                position: fixed;
                width: 0;
                height: 0;
                border: none;
                opacity: 0;
                pointer-events: none;
                z-index: -1;
            `;

            iframe.onload = () => {
                this.frameReady = true;
                // Execute any pending commands
                this.pendingCommands.forEach(cmd => this._sendCommand(cmd.type, cmd.data));
                this.pendingCommands = [];
            };

            document.body.appendChild(iframe);
        }

        _sendCommand(type, data = {}) {
            if (!this.frameReady && type !== 'get_state') {
                this.pendingCommands.push({ type, data });
                return;
            }
            this.bc.postMessage({ type, data });
        }

        _notifyListeners() {
            this.listeners.forEach(cb => {
                try {
                    cb(this.state);
                } catch (e) {
                    console.error('[AudioManager] Listener error:', e);
                }
            });
        }

        // Public API

        play(options = {}) {
            this._sendCommand('play', options);
        }

        pause() {
            this._sendCommand('pause');
        }

        toggle() {
            this._sendCommand('toggle');
        }

        setVolume(volume) {
            this._sendCommand('set_volume', { volume });
        }

        setMuted(muted) {
            this._sendCommand('set_muted', { muted });
        }

        seek(time) {
            this._sendCommand('seek', { time });
        }

        loadTrack(src, index, streamType = 'amritvela', autoplay = true) {
            this._sendCommand('load_track', { src, index, streamType, autoplay });
        }

        setStream(streamType, autoplay = true) {
            this._sendCommand('set_stream', { streamType, autoplay });
        }

        getState() {
            return { ...this.state };
        }

        onStateChange(callback) {
            this.listeners.add(callback);
            // Immediately call with current state
            callback(this.state);
            // Return unsubscribe function
            return () => this.listeners.delete(callback);
        }

        isPlaying() {
            return this.state.isPlaying;
        }
    }

    // Create global instance
    window.AnhadAudioManager = new AnhadAudioManager();

    // Also expose for ES modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.AnhadAudioManager;
    }
})();
