/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO - AUDIO INTEGRATION
 * This script connects the Persistent Audio Manager to your existing UI
 * 
 * Features:
 * 1. Fast loading with audio preloading
 * 2. Persists playback across page navigations (in SPA mode)
 * 3. Saves playback position when leaving page
 * 4. Restores playback when returning
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {
    // ═══════════════════════════════════════════════════════════════
    // AUDIO UI CONNECTOR
    // Connects the PersistentAudioManager to your existing player UI
    // ═══════════════════════════════════════════════════════════════

    class AudioUIConnector {
        constructor() {
            // Wait for gurbaniAudio to be available
            this.audio = window.gurbaniAudio;
            if (!this.audio) {
                console.warn('[AudioUI] PersistentAudioManager not found, will retry...');
                this.waitForAudioManager();
                return;
            }

            this.elements = {};
            this.isConnected = false;

            this.init();
        }

        waitForAudioManager() {
            const checkInterval = setInterval(() => {
                if (window.gurbaniAudio) {
                    this.audio = window.gurbaniAudio;
                    clearInterval(checkInterval);
                    this.init();
                }
            }, 100);

            // Stop checking after 10 seconds
            setTimeout(() => clearInterval(checkInterval), 10000);
        }

        init() {
            this.cacheElements();
            this.setupCallbacks();
            this.setupEventListeners();
            this.updateUI();
            this.isConnected = true;
            console.log('[AudioUI] Connected to PersistentAudioManager');
        }

        cacheElements() {
            // Main player controls
            this.elements.playBtn = document.getElementById('playBtn');
            this.elements.playIcon = document.getElementById('playIcon');
            this.elements.prevBtn = document.getElementById('prevBtn');
            this.elements.nextBtn = document.getElementById('nextBtn');

            // Progress
            this.elements.progressTrack = document.getElementById('progressTrack');
            this.elements.progressFill = document.getElementById('progressFill');
            this.elements.progressScrubber = document.getElementById('progressScrubber');
            this.elements.currentTime = document.getElementById('currentTime');
            this.elements.totalTime = document.getElementById('totalTime');

            // Volume
            this.elements.volumeBtn = document.getElementById('volumeBtn');
            this.elements.volumeSlider = document.getElementById('volumeSlider');
            this.elements.volumeValue = document.getElementById('volumeValue');
            this.elements.volumeFill = document.getElementById('volumeFill');

            // Track info
            this.elements.trackTitle = document.getElementById('trackTitle');
            this.elements.trackArtist = document.getElementById('trackArtist');

            // Loading indicator
            this.elements.loadingScreen = document.getElementById('loadingScreen');

            // Persistent player (if exists)
            this.elements.persistentPlayer = document.getElementById('persistent-audio-player');
        }

        setupCallbacks() {
            // Connect to audio manager callbacks
            this.audio.onPlayStateChange = (isPlaying) => {
                this.updatePlayButton(isPlaying);
            };

            this.audio.onTimeUpdate = (data) => {
                this.updateProgress(data);
            };

            this.audio.onTrackChange = (track, index) => {
                this.updateTrackInfo(track);
            };

            this.audio.onLoadingChange = (isLoading) => {
                this.updateLoadingState(isLoading);
            };

            this.audio.onError = (message) => {
                this.showError(message);
            };
        }

        setupEventListeners() {
            // Play button
            if (this.elements.playBtn) {
                this.elements.playBtn.addEventListener('click', () => {
                    this.audio.toggle();
                });
            }

            // Previous button
            if (this.elements.prevBtn) {
                this.elements.prevBtn.addEventListener('click', () => {
                    this.audio.previous();
                });
            }

            // Next button
            if (this.elements.nextBtn) {
                this.elements.nextBtn.addEventListener('click', () => {
                    this.audio.next();
                });
            }

            // Progress bar seek
            if (this.elements.progressTrack) {
                this.elements.progressTrack.addEventListener('click', (e) => {
                    const rect = this.elements.progressTrack.getBoundingClientRect();
                    const percent = ((e.clientX - rect.left) / rect.width) * 100;
                    this.audio.seekPercent(percent);
                });
            }

            // Volume slider
            if (this.elements.volumeSlider) {
                this.elements.volumeSlider.addEventListener('input', (e) => {
                    const volume = e.target.value / 100;
                    this.audio.setVolume(volume);
                    this.updateVolumeUI(volume);
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Space to play/pause (if not in input)
                if (e.code === 'Space' && !this.isInputFocused()) {
                    e.preventDefault();
                    this.audio.toggle();
                }

                // Arrow keys for seek
                if (e.code === 'ArrowRight' && !this.isInputFocused()) {
                    this.audio.seek(this.audio.currentTime + 10);
                }
                if (e.code === 'ArrowLeft' && !this.isInputFocused()) {
                    this.audio.seek(this.audio.currentTime - 10);
                }
            });
        }

        isInputFocused() {
            const active = document.activeElement;
            return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        }

        // ═══════════════════════════════════════════════════════════════
        // UI UPDATES
        // ═══════════════════════════════════════════════════════════════

        updateUI() {
            this.updatePlayButton(this.audio.isPlaying);
            this.updateTrackInfo(this.audio.getCurrentTrack());
            this.updateVolumeUI(this.audio.volume);
        }

        updatePlayButton(isPlaying) {
            if (this.elements.playIcon) {
                this.elements.playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
            if (this.elements.playBtn) {
                this.elements.playBtn.setAttribute('aria-pressed', isPlaying.toString());
                this.elements.playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
            }
        }

        updateProgress(data) {
            if (this.elements.progressFill) {
                this.elements.progressFill.style.width = `${data.progress}%`;
            }
            if (this.elements.progressScrubber) {
                this.elements.progressScrubber.style.left = `${data.progress}%`;
            }
            if (this.elements.currentTime) {
                this.elements.currentTime.textContent = data.formattedCurrent;
            }
            if (this.elements.totalTime) {
                this.elements.totalTime.textContent = data.formattedDuration;
            }
        }

        updateTrackInfo(track) {
            if (!track) return;

            if (this.elements.trackTitle) {
                const titleEl = this.elements.trackTitle.querySelector('.title-text');
                if (titleEl) {
                    titleEl.textContent = track.title;
                } else {
                    this.elements.trackTitle.textContent = track.title;
                }
            }
            if (this.elements.trackArtist) {
                const artistSpan = this.elements.trackArtist.querySelector('span');
                if (artistSpan) {
                    artistSpan.textContent = track.artist;
                }
            }
        }

        updateVolumeUI(volume) {
            const percent = Math.round(volume * 100);

            if (this.elements.volumeSlider) {
                this.elements.volumeSlider.value = percent;
            }
            if (this.elements.volumeValue) {
                this.elements.volumeValue.textContent = `${percent}%`;
            }
            if (this.elements.volumeFill) {
                this.elements.volumeFill.style.width = `${percent}%`;
            }
        }

        updateLoadingState(isLoading) {
            if (this.elements.playBtn) {
                this.elements.playBtn.classList.toggle('loading', isLoading);
            }
        }

        showError(message) {
            console.error('[AudioUI]', message);
            // You could show a toast notification here
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PERSISTENT PLAYER BAR (Fixed at bottom)
    // ═══════════════════════════════════════════════════════════════

    function createPersistentPlayerBar() {
        // Check if it already exists
        if (document.getElementById('persistent-audio-bar')) {
            return;
        }

        const audio = window.gurbaniAudio;
        if (!audio) return;

        // Create the persistent player bar HTML
        const playerBar = document.createElement('div');
        playerBar.id = 'persistent-audio-bar';
        playerBar.className = 'persistent-audio-player';
        playerBar.innerHTML = `
            <div class="persistent-audio-player__progress" id="persistent-progress">
                <div class="persistent-audio-player__progress-fill" id="persistent-progress-fill"></div>
            </div>
            <div class="persistent-audio-player__container">
                <div class="persistent-audio-player__info">
                    <div class="persistent-audio-player__title" id="persistent-title">Gurbani Kirtan</div>
                    <div class="persistent-audio-player__artist" id="persistent-artist">Sri Darbar Sahib</div>
                </div>
                <div class="persistent-audio-player__controls">
                    <button class="persistent-audio-player__btn" id="persistent-prev" aria-label="Previous">
                        <i class="fas fa-backward-step"></i>
                    </button>
                    <button class="persistent-audio-player__btn persistent-audio-player__btn--play" id="persistent-play" aria-label="Play">
                        <i class="fas fa-play" id="persistent-play-icon"></i>
                    </button>
                    <button class="persistent-audio-player__btn" id="persistent-next" aria-label="Next">
                        <i class="fas fa-forward-step"></i>
                    </button>
                </div>
                <div class="persistent-audio-player__time" id="persistent-time">0:00 / 0:00</div>
            </div>
        `;

        document.body.appendChild(playerBar);

        // Connect events
        const playBtn = document.getElementById('persistent-play');
        const prevBtn = document.getElementById('persistent-prev');
        const nextBtn = document.getElementById('persistent-next');
        const progress = document.getElementById('persistent-progress');

        playBtn?.addEventListener('click', () => audio.toggle());
        prevBtn?.addEventListener('click', () => audio.previous());
        nextBtn?.addEventListener('click', () => audio.next());

        progress?.addEventListener('click', (e) => {
            const rect = progress.getBoundingClientRect();
            const percent = ((e.clientX - rect.left) / rect.width) * 100;
            audio.seekPercent(percent);
        });

        // Update callbacks
        const originalPlayStateChange = audio.onPlayStateChange;
        audio.onPlayStateChange = (isPlaying) => {
            if (originalPlayStateChange) originalPlayStateChange(isPlaying);
            const icon = document.getElementById('persistent-play-icon');
            if (icon) {
                icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
        };

        const originalTimeUpdate = audio.onTimeUpdate;
        audio.onTimeUpdate = (data) => {
            if (originalTimeUpdate) originalTimeUpdate(data);
            const fill = document.getElementById('persistent-progress-fill');
            const time = document.getElementById('persistent-time');
            if (fill) fill.style.width = `${data.progress}%`;
            if (time) time.textContent = `${data.formattedCurrent} / ${data.formattedDuration}`;
        };

        const originalTrackChange = audio.onTrackChange;
        audio.onTrackChange = (track, index) => {
            if (originalTrackChange) originalTrackChange(track, index);
            const title = document.getElementById('persistent-title');
            const artist = document.getElementById('persistent-artist');
            if (title && track) title.textContent = track.title;
            if (artist && track) artist.textContent = track.artist;
        };

        const originalLoadingChange = audio.onLoadingChange;
        audio.onLoadingChange = (isLoading) => {
            if (originalLoadingChange) originalLoadingChange(isLoading);
            playBtn?.classList.toggle('loading', isLoading);
        };

        // Initialize with current state
        const track = audio.getCurrentTrack();
        if (track) {
            const title = document.getElementById('persistent-title');
            const artist = document.getElementById('persistent-artist');
            if (title) title.textContent = track.title;
            if (artist) artist.textContent = track.artist;
        }

        const icon = document.getElementById('persistent-play-icon');
        if (icon) {
            icon.className = audio.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }

        console.log('[AudioUI] Persistent player bar created');
    }

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION ENHANCEMENT
    // Save audio state before leaving, restore when returning
    // ═══════════════════════════════════════════════════════════════

    function setupNavigationHandling() {
        // Save state before navigating away
        window.addEventListener('beforeunload', () => {
            if (window.gurbaniAudio) {
                window.gurbaniAudio.saveState();
            }
        });

        window.addEventListener('pagehide', () => {
            if (window.gurbaniAudio) {
                window.gurbaniAudio.saveState();
            }
        });

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && window.gurbaniAudio) {
                window.gurbaniAudio.saveState();
            }
        });

        // Intercept navigation links to save state
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.href.startsWith('#') && window.gurbaniAudio) {
                // Save current state before navigation
                window.gurbaniAudio.saveState();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    function initAudioIntegration() {
        // Initialize UI connector
        window.audioUIConnector = new AudioUIConnector();

        // Setup navigation handling
        setupNavigationHandling();

        // Create persistent player bar (optional - only on main pages)
        // Uncomment if you want a fixed player at bottom:
        // createPersistentPlayerBar();

        // Add padding to body for persistent player
        // document.body.style.paddingBottom = '80px';

        console.log('[AudioIntegration] Initialized');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAudioIntegration);
    } else {
        // DOM already loaded
        initAudioIntegration();
    }

    // Expose for debugging
    window.createPersistentPlayerBar = createPersistentPlayerBar;

})();
