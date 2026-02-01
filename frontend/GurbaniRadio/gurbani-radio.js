/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO — iOS 17 APPLE MUSIC STYLE PLAYER
 * 
 * Clean, minimal JavaScript for the iOS 17 styled player
 * Integrates with PersistentAudio for cross-page playback
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIO CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

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
            title: `Day ${i + 1} — ਗੁਰਬਾਣੀ ਕੀਰਤਨ`,
            artist: 'Live Kirtan • Divine Shabad',
            duration: 3600
        })),

        getTrack(index) {
            const safeIndex = ((index % this.audioFiles.length) + this.audioFiles.length) % this.audioFiles.length;
            return {
                url: `${this.baseUrl}/${this.audioFiles[safeIndex]}`,
                info: this.trackInfo[safeIndex],
                index: safeIndex
            };
        },

        get totalTracks() {
            return this.audioFiles.length;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // VIRTUAL LIVE MANAGER
    // Simulates 24/7 live broadcast - when you resume, it jumps to "now"
    // ═══════════════════════════════════════════════════════════════════════════

    class VirtualLiveManager {
        constructor() {
            this.broadcastStart = this.loadBroadcastStart();
            this.trackDurations = new Map();
            this.defaultDuration = 3600;
        }

        loadBroadcastStart() {
            let start = null;
            try {
                start = localStorage.getItem('gurbani_broadcast_start');
                if (start) start = parseInt(start, 10);
            } catch (e) { }

            if (!start || isNaN(start)) {
                start = Date.now();
                try { localStorage.setItem('gurbani_broadcast_start', start.toString()); } catch (e) { }
            }
            return start;
        }

        setTrackDuration(index, duration) {
            if (duration && isFinite(duration) && duration > 0) {
                this.trackDurations.set(index, duration);
            }
        }

        getTrackDuration(index) {
            return this.trackDurations.get(index) || this.defaultDuration;
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
            const elapsedSeconds = (now - this.broadcastStart) / 1000;
            const totalDuration = this.getTotalPlaylistDuration();
            const positionInPlaylist = elapsedSeconds % totalDuration;

            let accumulated = 0;
            for (let i = 0; i < AUDIO_CONFIG.totalTracks; i++) {
                const trackDuration = this.getTrackDuration(i);
                if (accumulated + trackDuration > positionInPlaylist) {
                    return {
                        trackIndex: i,
                        position: positionInPlaylist - accumulated
                    };
                }
                accumulated += trackDuration;
            }
            return { trackIndex: 0, position: 0 };
        }
    }

    const virtualLive = new VirtualLiveManager();

    // ═══════════════════════════════════════════════════════════════════════════
    // GURBANI RADIO PLAYER
    // ═══════════════════════════════════════════════════════════════════════════

    class GurbaniRadioPlayer {
        constructor() {
            this.audio = document.getElementById('audioPlayer');
            this.isPlaying = false;
            this.currentTrackIndex = 0;
            this.volume = 0.8;
            this.isFavorite = false;

            this.cacheElements();
            this.loadSavedState();
            this.setupEventListeners();
            this.updateVolumeUI();

            // Auto-play if was playing before
            setTimeout(() => {
                if (this.isPlaying) {
                    this.goLive();
                }
            }, 300);
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

            // Debug: Log which elements were found
            console.log('🎵 Player elements:', {
                playBtn: !!this.elements.playBtn,
                starBtn: !!this.elements.starBtn,
                shareBtn: !!this.elements.shareBtn,
                liveBtn: !!this.elements.liveBtn,
                prevBtn: !!this.elements.prevBtn,
                nextBtn: !!this.elements.nextBtn,
                volumeInput: !!this.elements.volumeInput,
                airplayBtn: !!this.elements.airplayBtn,
                listBtn: !!this.elements.listBtn,
                moreBtn: !!this.elements.moreBtn
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

            // Transport controls
            this.elements.playBtn?.addEventListener('click', () => {
                console.log('⏯️ Play button clicked');
                this.toggle();
            });
            this.elements.prevBtn?.addEventListener('click', () => {
                console.log('⏮️ Prev button clicked');
                this.showToast('Jumping to live...');
                this.goLive();
            });
            this.elements.nextBtn?.addEventListener('click', () => {
                console.log('⏭️ Next button clicked');
                this.showToast('Jumping to live...');
                this.goLive();
            });

            // Volume
            this.elements.volumeInput?.addEventListener('input', (e) => {
                console.log('🔊 Volume changed:', e.target.value);
                this.setVolume(e.target.value / 100);
            });

            // Favorite
            this.elements.starBtn?.addEventListener('click', () => {
                console.log('⭐ Favorite button clicked');
                this.toggleFavorite();
            });

            // Share
            this.elements.shareBtn?.addEventListener('click', () => {
                console.log('📤 Share button clicked');
                this.share();
            });

            // AirPlay
            this.elements.airplayBtn?.addEventListener('click', () => {
                console.log('📺 AirPlay button clicked');
                this.showAirPlay();
            });

            // Track List / More
            this.elements.listBtn?.addEventListener('click', () => {
                console.log('📋 List button clicked');
                this.showTrackList();
            });
            this.elements.moreBtn?.addEventListener('click', () => {
                console.log('⋯ More button clicked');
                this.showMoreOptions();
            });

            // LIVE button - clicking jumps to live
            this.elements.liveBtn?.addEventListener('click', () => {
                console.log('🔴 LIVE button clicked!');
                this.showToast('Going LIVE...');
                this.goLive();
            });
            this.elements.navLiveIndicator?.addEventListener('click', () => this.goLive());

            // Make LIVE button have pointer cursor
            if (this.elements.liveBtn) this.elements.liveBtn.style.cursor = 'pointer';
            if (this.elements.navLiveIndicator) this.elements.navLiveIndicator.style.cursor = 'pointer';

            // Progress bar seeking
            this.elements.progressBar?.addEventListener('click', (e) => this.seek(e));

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));

            // Save state before leaving
            window.addEventListener('beforeunload', () => this.saveState());
            window.addEventListener('pagehide', () => this.saveState());
        }

        // ═══ PLAYBACK CONTROLS ═══

        async goLive() {
            try {
                const livePos = virtualLive.getCurrentLivePosition();
                console.log(`📻 Going LIVE: Day ${livePos.trackIndex + 1} at ${this.formatTime(livePos.position)}`);
                await this.loadTrackAtPosition(livePos.trackIndex, livePos.position);
            } catch (error) {
                console.error('Playback error:', error);
            }
        }

        loadTrackAtPosition(trackIndex, seekPosition) {
            return new Promise((resolve, reject) => {
                const track = AUDIO_CONFIG.getTrack(trackIndex);
                this.currentTrackIndex = track.index;
                this.updateTrackInfo(track);

                const currentSrc = this.audio.src || '';
                const isSameTrack = currentSrc.includes(`day-${track.index + 1}.webm`);

                const seekAndPlay = async () => {
                    try {
                        const duration = this.audio.duration || 3600;
                        if (isFinite(duration)) {
                            virtualLive.setTrackDuration(track.index, duration);
                        }

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
                this.audio.src = track.url;
                this.audio.load();
            });
        }

        toggle() {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.goLive();
            }
        }

        pause() {
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
            this.saveState();
        }

        setVolume(value) {
            this.volume = Math.max(0, Math.min(1, value));
            this.audio.volume = this.volume;
            this.updateVolumeUI();
            this.saveState();
        }

        seek(e) {
            if (!this.audio.duration) return;
            const rect = this.elements.progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
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

        updateTrackInfo(track) {
            if (this.elements.trackTitle) {
                this.elements.trackTitle.textContent = track.info.title;
            }
            if (this.elements.trackArtist) {
                this.elements.trackArtist.textContent = track.info.artist;
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
                virtualLive.setTrackDuration(this.currentTrackIndex, this.audio.duration);
            }
        }

        onTrackEnded() {
            console.log('🎵 Track ended, continuing live...');
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
            setTimeout(() => this.goLive(), 2000);
        }

        // ═══ ACTIONS ═══

        toggleFavorite() {
            this.isFavorite = !this.isFavorite;
            this.elements.starBtn?.classList.toggle('active', this.isFavorite);

            // Fill the star when active
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
            const track = AUDIO_CONFIG.getTrack(this.currentTrackIndex);

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'ਗੁਰਬਾਣੀ ਰੇਡੀਓ - ANHAD',
                        text: `Listening to ${track.info.title}`,
                        url: window.location.href
                    });
                    this.showToast('Shared successfully!');
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        this.showToast('Share cancelled');
                    }
                }
            } else {
                // Fallback: copy URL
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
            // Show AirPlay picker if available
            if (this.audio.webkitShowPlaybackTargetPicker) {
                this.audio.webkitShowPlaybackTargetPicker();
            } else {
                this.showToast('AirPlay not available on this device');
            }
            this.haptic();
        }

        showTrackList() {
            // Show track list (could open a drawer)
            this.showToast('Track list coming soon!');
            this.haptic();
        }

        showMoreOptions() {
            // Show more options menu
            this.showToast('More options coming soon!');
            this.haptic();
        }

        showToast(message) {
            // Create or update toast
            let toast = document.getElementById('playerToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'playerToast';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%) translateY(20px);
                    background: rgba(60, 60, 60, 0.95);
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 10000;
                    opacity: 0;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                `;
                document.body.appendChild(toast);
            }

            toast.textContent = message;
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';

            clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
            }, 2000);
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
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
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
        window.gurbaniRadio = new GurbaniRadioPlayer();
        console.log('🙏 Gurbani Radio initialized');
    });

})();
