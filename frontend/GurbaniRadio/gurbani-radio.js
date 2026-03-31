/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO — Server-Synced Live Player
 * 
 * TRUE LIVE RADIO: All devices play the same audio at the same moment.
 * The server is the single source of truth for broadcast position.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // API CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Smart localhost-aware API base — works on localhost:3000 AND Render
    const RENDER_BASE = (() => {
        try {
            const port = window.location.port;
            const host = window.location.hostname;
            if (port === '3000' || port === '3001') return 'http://localhost:3000';
            if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
            if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
        } catch (e) {}
        return 'https://anhad-final.onrender.com';
    })();

    const API_BASE = RENDER_BASE;

    const AUDIO_BASE = `${API_BASE}/audio`;

    // Generate a unique listener ID per device (persisted in localStorage)
    function getListenerId() {
        let id = null;
        try {
            id = localStorage.getItem('gurbani_listener_id');
        } catch (e) { }
        if (!id) {
            id = 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
            try { localStorage.setItem('gurbani_listener_id', id); } catch (e) { }
        }
        return id;
    }

    const LISTENER_ID = getListenerId();

    // ═══════════════════════════════════════════════════════════════════════════
    // SERVER SYNC MANAGER
    // Fetches live position from the server — the single source of truth
    // ═══════════════════════════════════════════════════════════════════════════

    class ServerSyncManager {
        constructor() {
            this.lastSyncData = null;
            this.lastSyncTime = 0;
            this.serverTimeOffset = 0; // Compensate for clock differences
            this.trackDurations = {};
            this.heartbeatInterval = null;
            this.syncInterval = null;
            this.listenersCount = 0;
        }

        /**
         * Fetch the current live position from the server.
         * Compensates for network latency by measuring round-trip time.
         */
        async fetchLivePosition() {
            try {
                const startTime = Date.now();
                const response = await fetch(`${API_BASE}/api/radio/live`);
                const endTime = Date.now();

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();

                // Estimate network latency (half round-trip)
                const latencyMs = (endTime - startTime) / 2;
                const latencySec = latencyMs / 1000;

                // Adjust position forward by latency to compensate for fetch time
                const adjustedPosition = data.trackPosition + latencySec;

                // Store track durations for client-side prediction
                this.trackDurations = data.trackDurations || {};

                // Calculate server time offset
                this.serverTimeOffset = data.serverTime - (startTime + latencyMs);

                this.lastSyncData = data;
                this.lastSyncTime = Date.now();
                this.listenersCount = data.listenersCount || 0;

                // Check if adjusted position exceeds the track duration
                const trackDuration = data.trackDuration || 3600;
                if (adjustedPosition >= trackDuration) {
                    // Track ended during fetch, need to move to next
                    return await this.fetchLivePosition(); // Re-fetch for accurate position
                }

                return {
                    trackIndex: data.trackIndex,
                    position: Math.min(adjustedPosition, trackDuration - 1),
                    trackTitle: data.trackTitle,
                    trackArtist: data.trackArtist,
                    trackFilename: data.trackFilename,
                    trackUrl: data.trackUrl,
                    trackDuration: trackDuration,
                    listenersCount: data.listenersCount,
                    latencyMs: Math.round(latencyMs)
                };
            } catch (error) {
                console.error('[📻 Sync] Failed to fetch live position:', error);

                // Fallback: use client-side time-based calculation with last known data
                if (this.lastSyncData) {
                    return this.predictCurrentPosition();
                }

                return null;
            }
        }

        /**
         * Client-side prediction between server syncs.
         * Uses server epoch + local clock to estimate current position.
         */
        predictCurrentPosition() {
            if (!this.lastSyncData) return null;

            const data = this.lastSyncData;
            const elapsedSinceSync = (Date.now() - this.lastSyncTime) / 1000;

            // Walk forward from last known position
            let trackIndex = data.trackIndex;
            let position = data.trackPosition + elapsedSinceSync;

            // Advance through tracks as needed
            while (true) {
                const trackDuration = this.trackDurations[trackIndex] || 3600;
                if (position < trackDuration) break;
                position -= trackDuration;
                trackIndex = (trackIndex + 1) % (data.totalTracks || 40);
            }

            return {
                trackIndex,
                position,
                trackFilename: `day-${trackIndex + 1}.webm`,
                trackUrl: `${AUDIO_BASE}/day-${trackIndex + 1}.webm`,
                trackTitle: `Day ${trackIndex + 1} — ਗੁਰਬਾਣੀ ਕੀਰਤਨ`,
                trackArtist: 'Live Kirtan • Bhai Gurpreet Singh Ji',
                trackDuration: this.trackDurations[trackIndex] || 3600,
                listenersCount: this.listenersCount,
                predicted: true
            };
        }

        /**
         * Report actual track duration to the server.
         */
        async reportDuration(trackIndex, duration) {
            try {
                await fetch(`${API_BASE}/api/radio/durations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trackIndex, duration })
                });
                console.log(`[📻 Sync] Reported duration for track ${trackIndex + 1}: ${Math.round(duration)}s`);
            } catch (e) {
                // Silently fail — non-critical
            }
        }

        /**
         * Send heartbeat to maintain listener status.
         */
        async sendHeartbeat() {
            try {
                const response = await fetch(`${API_BASE}/api/radio/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ listenerId: LISTENER_ID })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.listenersCount = data.listenersCount || 0;
                    return data;
                }
            } catch (e) {
                // Silently fail
            }
            return null;
        }

        /**
         * Start the heartbeat loop (every 30s).
         */
        startHeartbeat() {
            // Send immediately
            this.sendHeartbeat();

            // Then every 30s
            this.heartbeatInterval = setInterval(() => {
                this.sendHeartbeat();
            }, 30000);
        }

        /**
         * Stop the heartbeat loop.
         */
        stopHeartbeat() {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }
        }

        /**
         * Destroy and cleanup.
         */
        destroy() {
            this.stopHeartbeat();
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }
    }

    const syncManager = new ServerSyncManager();

    // ═══════════════════════════════════════════════════════════════════════════
    // GURBANI RADIO PLAYER — Server-Synced
    // ═══════════════════════════════════════════════════════════════════════════

    class GurbaniRadioPlayer {
        constructor() {
            this.audio = document.getElementById('audioPlayer');
            this.isPlaying = false;
            this.currentTrackIndex = 0;
            this.volume = 0.8;
            this.isFavorite = false;
            this.driftCheckInterval = null;

            this.cacheElements();
            this.loadSavedState();
            this.setupEventListeners();
            this.updateVolumeUI();
            this.initThemeToggle();
            this.initGlobalStatePersistence();

            // Auto-play if was playing before — jump to live
            setTimeout(() => {
                if (this.isPlaying) {
                    this.goLive();
                }
            }, 300);
        }

        // ━━━ THEME TOGGLE ━━━
        initThemeToggle() {
            const toggle = document.getElementById('themeToggle');
            const icon = document.getElementById('themeIcon');
            const saved = localStorage.getItem('kirtan_player_theme') || 'dark';
            if (saved === 'light') {
                document.body.classList.add('light-player');
                if (icon) icon.className = 'fas fa-moon';
            }
            toggle?.addEventListener('click', () => {
                const isLight = document.body.classList.toggle('light-player');
                localStorage.setItem('kirtan_player_theme', isLight ? 'light' : 'dark');
                if (icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
            });
        }

        // ━━━ GLOBAL STATE PERSISTENCE for cross-page mini-player ━━━
        initGlobalStatePersistence() {
            const saveGlobal = () => {
                if (this.isPlaying) {
                    try {
                        localStorage.setItem('anhad_global_audio', JSON.stringify({
                            isPlaying: true,
                            stream: 'amritvela',
                            trackIndex: this.currentTrackIndex,
                            volume: this.volume,
                            currentTime: this.audio?.currentTime || 0,
                            timestamp: Date.now()
                        }));
                    } catch(e) {}
                }
            };
            window.addEventListener('pagehide', saveGlobal);
            window.addEventListener('beforeunload', saveGlobal);
        }

        cacheElements() {
            this.elements = {
                playBtn: document.getElementById('playBtn'),
                playIcon: document.getElementById('playIcon'),
                prevBtn: document.getElementById('prevBtn'),
                nextBtn: document.getElementById('nextBtn'),
                starBtn: document.getElementById('starBtn'),
                shareBtn: document.getElementById('shareBtn'),
                airplayBtn: document.getElementById('airplayBtn'),
                listBtn: document.getElementById('listBtn'),
                moreBtn: document.getElementById('moreBtn'),
                liveBtn: document.getElementById('liveBtn'),
                navLiveIndicator: document.querySelector('.ios17-nav__title'),
                listenersCount: document.getElementById('listenersCount'),

                trackTitle: document.getElementById('trackTitle'),
                trackArtist: document.getElementById('trackArtist'),
                artwork: document.getElementById('artwork'),
                artworkImg: document.getElementById('artworkImg'),
                bgArt: document.getElementById('bgArt'),

                progress: document.getElementById('progress'),
                progressBar: document.getElementById('progressBar'),
                progressKnob: document.getElementById('progressKnob'),
                elapsed: document.getElementById('elapsed'),
                remaining: document.getElementById('remaining'),

                volumeInput: document.getElementById('volumeInput'),
                volumeFill: document.getElementById('volumeFill')
            };

            console.log('🎵 Player elements:', {
                playBtn: !!this.elements.playBtn,
                starBtn: !!this.elements.starBtn,
                shareBtn: !!this.elements.shareBtn,
                liveBtn: !!this.elements.liveBtn,
                prevBtn: !!this.elements.prevBtn,
                nextBtn: !!this.elements.nextBtn,
                volumeInput: !!this.elements.volumeInput,
                listenersCount: !!this.elements.listenersCount
            });
        }

        loadSavedState() {
            try {
                if (window.PersistentAudio) {
                    const state = window.PersistentAudio.getPlaybackState();
                    this.currentTrackIndex = state.stationIndex || 0;
                    this.volume = state.volume || 0.8;
                    this.isPlaying = state.isPlaying || false;
                } else {
                    const saved = localStorage.getItem('gurbaniRadioState');
                    if (saved) {
                        const state = JSON.parse(saved);
                        this.currentTrackIndex = state.stationIndex || 0;
                        this.volume = state.volume || 0.8;
                        this.isPlaying = state.isPlaying || false;
                    }
                }
            } catch (e) {
                console.warn('[GurbaniRadio] Could not load state:', e);
            }
        }

        saveState() {
            const state = {
                isPlaying: this.isPlaying,
                stationIndex: this.currentTrackIndex,
                volume: this.volume,
                currentTime: this.audio ? this.audio.currentTime : 0
            };

            try {
                localStorage.setItem('gurbaniRadioState', JSON.stringify(state));
                if (window.PersistentAudio) {
                    window.PersistentAudio.saveState(state);
                }
            } catch (e) { }
        }

        setupEventListeners() {
            // Audio events
            this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
            this.audio.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
            this.audio.addEventListener('ended', () => this.onTrackEnded());
            this.audio.addEventListener('play', () => this.onPlay());
            this.audio.addEventListener('pause', () => this.onPause());
            this.audio.addEventListener('error', (e) => this.onError(e));

            // Transport controls — ALL jump to live
            this.elements.playBtn?.addEventListener('click', () => {
                console.log('⏯️ Play button clicked');
                this.toggle();
            });
            this.elements.prevBtn?.addEventListener('click', () => {
                console.log('⏮️ Prev button clicked → Going LIVE');
                this.showToast('Jumping to live...');
                this.goLive();
            });
            this.elements.nextBtn?.addEventListener('click', () => {
                console.log('⏭️ Next button clicked → Going LIVE');
                this.showToast('Jumping to live...');
                this.goLive();
            });

            // Volume
            this.elements.volumeInput?.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });

            // Favorite
            this.elements.starBtn?.addEventListener('click', () => this.toggleFavorite());

            // Share
            this.elements.shareBtn?.addEventListener('click', () => this.share());

            // AirPlay
            this.elements.airplayBtn?.addEventListener('click', () => this.showAirPlay());

            // Track List / More
            this.elements.listBtn?.addEventListener('click', () => this.showTrackList());
            this.elements.moreBtn?.addEventListener('click', () => this.showMoreOptions());

            // LIVE button — clicking jumps to live
            this.elements.liveBtn?.addEventListener('click', () => {
                console.log('🔴 LIVE button clicked!');
                this.showToast('Going LIVE...');
                this.goLive();
            });
            this.elements.navLiveIndicator?.addEventListener('click', () => this.goLive());

            // Make LIVE button have pointer cursor
            if (this.elements.liveBtn) this.elements.liveBtn.style.cursor = 'pointer';
            if (this.elements.navLiveIndicator) this.elements.navLiveIndicator.style.cursor = 'pointer';

            // Progress bar — disabled in live mode (can't seek in live radio)
            // Clicking progress bar jumps to live instead
            this.elements.progressBar?.addEventListener('click', () => {
                this.showToast('📻 Live radio — seeking not available');
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));

            // Save state before leaving
            window.addEventListener('beforeunload', () => {
                this.saveState();
                syncManager.stopHeartbeat();
            });
            window.addEventListener('pagehide', () => {
                this.saveState();
                syncManager.stopHeartbeat();
            });

            // Visibility change — re-sync when tab becomes visible
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && this.isPlaying) {
                    this.driftCheck();
                }
            });
        }

        // ═══ LIVE PLAYBACK — Server-Synced ═══

        /**
         * Go to the LIVE position by asking the server.
         * This is the primary entry point for playback.
         */
        async goLive() {
            try {
                const livePos = await syncManager.fetchLivePosition();

                if (!livePos) {
                    this.showToast('⚠️ Could not connect to server');
                    return;
                }

                console.log(`📻 Going LIVE: Track ${livePos.trackIndex + 1} at ${this.formatTime(livePos.position)} (latency: ${livePos.latencyMs}ms)`);

                await this.loadTrackAtPosition(livePos.trackIndex, livePos.position, livePos);

                // Start heartbeat to maintain listener status
                syncManager.startHeartbeat();

                // Start drift checking every 60s
                this.startDriftCheck();

                // Update listener count
                this.updateListenerCount(livePos.listenersCount);

            } catch (error) {
                console.error('Playback error:', error);
                this.showToast('⚠️ Playback error, retrying...');
                setTimeout(() => this.goLive(), 3000);
            }
        }

        /**
         * Load a specific track at a specific position and play.
         */
        loadTrackAtPosition(trackIndex, seekPosition, liveData) {
            return new Promise((resolve, reject) => {
                this.currentTrackIndex = trackIndex;
                this.updateTrackInfo(liveData);

                const filename = `day-${trackIndex + 1}.webm`;
                const currentSrc = this.audio.src || '';
                const isSameTrack = currentSrc.includes(filename);

                const seekAndPlay = async () => {
                    try {
                        const duration = this.audio.duration || liveData.trackDuration || 3600;
                        const safePosition = Math.min(Math.max(0, seekPosition), duration - 5);
                        this.audio.currentTime = safePosition;

                        await this.audio.play();
                        this.isPlaying = true;
                        this.updatePlayButton();
                        this.saveState();
                        resolve();
                    } catch (e) {
                        console.error('Play failed:', e);
                        reject(e);
                    }
                };

                if (isSameTrack && this.audio.readyState >= 1) {
                    seekAndPlay();
                    return;
                }

                const onLoaded = () => {
                    this.audio.removeEventListener('loadedmetadata', onLoaded);
                    this.audio.removeEventListener('error', onError);
                    seekAndPlay();
                };

                const onError = (e) => {
                    this.audio.removeEventListener('loadedmetadata', onLoaded);
                    this.audio.removeEventListener('error', onError);
                    reject(e);
                };

                this.audio.crossOrigin = 'anonymous';
                this.audio.addEventListener('loadedmetadata', onLoaded);
                this.audio.addEventListener('error', onError);
                this.audio.src = `${AUDIO_BASE}/${filename}`;
                this.audio.load();
            });
        }

        /**
         * Periodic drift check — re-sync with server if we've drifted.
         */
        startDriftCheck() {
            if (this.driftCheckInterval) clearInterval(this.driftCheckInterval);

            this.driftCheckInterval = setInterval(() => {
                if (this.isPlaying) {
                    this.driftCheck();
                }
            }, 60000); // Every 60 seconds
        }

        /**
         * Check if we've drifted from the server's live position.
         * If drift > 5s, re-sync.
         */
        async driftCheck() {
            try {
                const livePos = await syncManager.fetchLivePosition();
                if (!livePos) return;

                // Update listener count
                this.updateListenerCount(livePos.listenersCount);

                // Check if we're on the wrong track
                if (livePos.trackIndex !== this.currentTrackIndex) {
                    console.log(`[📻 Drift] Track mismatch! Expected ${livePos.trackIndex + 1}, on ${this.currentTrackIndex + 1}. Re-syncing...`);
                    await this.loadTrackAtPosition(livePos.trackIndex, livePos.position, livePos);
                    return;
                }

                // Check position drift
                const currentPos = this.audio?.currentTime || 0;
                const drift = Math.abs(currentPos - livePos.position);

                if (drift > 5) {
                    console.log(`[📻 Drift] Drift detected: ${drift.toFixed(1)}s. Correcting...`);
                    if (this.audio) {
                        this.audio.currentTime = livePos.position;
                    }
                }
            } catch (e) {
                // Non-critical, skip this check
            }
        }

        toggle() {
            if (this.isPlaying) {
                this.pause();
            } else {
                // Always go to LIVE when pressing play
                this.goLive();
            }
        }

        pause() {
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
            this.saveState();
            syncManager.stopHeartbeat();

            if (this.driftCheckInterval) {
                clearInterval(this.driftCheckInterval);
                this.driftCheckInterval = null;
            }
        }

        setVolume(value) {
            this.volume = Math.max(0, Math.min(1, value));
            this.audio.volume = this.volume;
            this.updateVolumeUI();
            this.saveState();
        }

        // ═══ UI UPDATES ═══

        updatePlayButton() {
            if (!this.elements.playIcon) return;

            if (this.isPlaying) {
                // Pause icon
                this.elements.playIcon.innerHTML = `
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                `;
                this.elements.artwork?.classList.remove('ios17-artwork--paused');
            } else {
                // Play icon
                this.elements.playIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
                this.elements.artwork?.classList.add('ios17-artwork--paused');
            }
        }

        updateTrackInfo(data) {
            if (this.elements.trackTitle && data.trackTitle) {
                this.elements.trackTitle.textContent = data.trackTitle;
            }
            if (this.elements.trackArtist && data.trackArtist) {
                this.elements.trackArtist.textContent = data.trackArtist;
            }
        }

        updateVolumeUI() {
            const percent = this.volume * 100;
            if (this.elements.volumeFill) {
                this.elements.volumeFill.style.width = `${percent}%`;
            }
            if (this.elements.volumeInput) {
                this.elements.volumeInput.value = percent;
            }
        }

        updateListenerCount(count) {
            this.listenersCount = count || 0;

            // Update the listener count element if it exists
            if (this.elements.listenersCount) {
                this.elements.listenersCount.textContent = `🎧 ${count} listening`;
                this.elements.listenersCount.style.display = count > 0 ? '' : 'none';
            }

            // Also try to update any listener count element in the page
            const listenerEl = document.querySelector('.listeners-count, [data-listeners]');
            if (listenerEl) {
                listenerEl.textContent = count > 0 ? `🎧 ${count} listening now` : '';
            }
        }

        // ═══ EVENT HANDLERS ═══

        onTimeUpdate() {
            if (!this.audio.duration || !isFinite(this.audio.duration)) return;

            const current = this.audio.currentTime;
            const duration = this.audio.duration;
            const percent = (current / duration) * 100;

            if (this.elements.progress) {
                this.elements.progress.style.width = `${percent}%`;
            }
            if (this.elements.progressKnob) {
                this.elements.progressKnob.style.left = `${percent}%`;
            }
            if (this.elements.elapsed) {
                this.elements.elapsed.textContent = this.formatTime(current);
            }
        }

        onMetadataLoaded() {
            if (this.audio.duration && isFinite(this.audio.duration)) {
                // Report actual duration to server — improves accuracy for all listeners
                syncManager.reportDuration(this.currentTrackIndex, this.audio.duration);
            }
        }

        onTrackEnded() {
            console.log('🎵 Track ended, re-syncing with server...');
            // Don't guess — ask the server what's playing now
            this.goLive();
        }

        onPlay() {
            this.isPlaying = true;
            this.updatePlayButton();
        }

        onPause() {
            this.isPlaying = false;
            this.updatePlayButton();
        }

        onError(e) {
            console.error('Audio error:', e);
            this.isPlaying = false;
            this.updatePlayButton();
            this.showToast('Reconnecting...');
            // Retry with fresh server sync after 3 seconds
            setTimeout(() => this.goLive(), 3000);
        }

        // ═══ ACTIONS ═══

        toggleFavorite() {
            this.isFavorite = !this.isFavorite;
            this.elements.starBtn?.classList.toggle('active', this.isFavorite);

            if (this.elements.starBtn) {
                const svg = this.elements.starBtn.querySelector('svg');
                if (svg) {
                    svg.setAttribute('fill', this.isFavorite ? 'currentColor' : 'none');
                }
            }

            this.showToast(this.isFavorite ? 'Added to favorites ✓' : 'Removed from favorites');
            this.haptic();
        }

        async share() {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'ਗੁਰਬਾਣੀ ਰੇਡੀਓ - ANHAD',
                        text: `Listening to Day ${this.currentTrackIndex + 1} — 24/7 Live Gurbani Kirtan`,
                        url: window.location.href
                    });
                    this.showToast('Shared successfully!');
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        this.showToast('Share cancelled');
                    }
                }
            } else {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    this.showToast('Link copied to clipboard ✓');
                } catch (e) {
                    this.showToast('Could not copy link');
                }
            }
            this.haptic();
        }

        showAirPlay() {
            if (this.audio.webkitShowPlaybackTargetPicker) {
                this.audio.webkitShowPlaybackTargetPicker();
            } else {
                this.showToast('AirPlay not available on this device');
            }
            this.haptic();
        }

        showTrackList() {
            this.showToast('Track list coming soon!');
            this.haptic();
        }

        showMoreOptions() {
            this.showToast('More options coming soon!');
            this.haptic();
        }

        showToast(message) {
            // Use claymorphism toast system
            if (window.AnhadPopup) {
                AnhadPopup.toast(message, { type: 'info', duration: 2000 });
            } else {
                // Fallback console log if popup system not loaded
                console.log('[Toast]', message);
            }
        }

        handleKeyboard(e) {
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.toggle();
                    break;
                case 'ArrowUp':
                    this.setVolume(this.volume + 0.1);
                    break;
                case 'ArrowDown':
                    this.setVolume(this.volume - 0.1);
                    break;
            }
        }

        // ═══ UTILITIES ═══

        formatTime(seconds) {
            if (!isFinite(seconds)) return '0:00';
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            if (hrs > 0) {
                return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        haptic(style = 'light') {
            try {
                if (navigator.vibrate) {
                    navigator.vibrate(style === 'light' ? 10 : 25);
                }
            } catch (e) { }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════════════════

    window.addEventListener('DOMContentLoaded', () => {
        window.gurbaniRadioPlayer = new GurbaniRadioPlayer();
        window.gurbaniSyncManager = syncManager;
        console.log('🙏 Gurbani Radio initialized — Server-Synced Live Mode');
    });

})();
