/**
 * ANHAD Persistent Audio System V2
 * 
 * Supports multiple streams:
 * - darbar: SGPC Live Kirtan from Sri Harmandir Sahib
 * - amritvela: Curated Kirtan tracks from Cloudflare
 * 
 * Audio persists across ALL pages.
 */

(function () {
    'use strict';

    // Stream configurations
    const STREAMS = {
        darbar: {
            name: 'Darbar Sahib Live',
            url: 'https://live.sgpc.net:8443/;nocache=1',
            type: 'live'
        },
        amritvela: {
            name: 'Amritvela Kirtan',
            baseUrl: null, // resolved at runtime via PA_API_BASE
            totalTracks: 40,
            type: 'playlist',
            getTrackUrl(index) {
                const base = PA_API_BASE || 'https://anhad-final.onrender.com';
                return `${base}/audio/day-${(index % this.totalTracks) + 1}.webm`;
            }
        }
    };

    const STATE_KEY = 'anhad_persistent_audio';
    let audio = null;
    let currentStream = 'darbar';
    let currentTrackIndex = 0;
    let broadcastStart = null;

    // Get saved state
    function getState() {
        try {
            const saved = localStorage.getItem(STATE_KEY);
            return saved ? JSON.parse(saved) : { shouldPlay: false, stream: 'darbar', trackIndex: 0 };
        } catch (e) {
            return { shouldPlay: false, stream: 'darbar', trackIndex: 0 };
        }
    }

    // Save state
    function saveState(shouldPlay, stream, trackIndex) {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify({
                shouldPlay: shouldPlay,
                stream: stream || currentStream,
                trackIndex: trackIndex !== undefined ? trackIndex : currentTrackIndex,
                timestamp: Date.now()
            }));
        } catch (e) { }
    }

    // API base URL - Smart localhost-aware resolution
    const PA_API_BASE = (() => {
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

    // Cached server sync data - MUST be fetched from server
    let serverSyncData = null;
    let lastSyncTime = 0;
    const SYNC_CACHE_TTL = 5000; // Cache server response for 5 seconds max

    // Get current position from SERVER (async) - THE ONLY SOURCE OF TRUTH
    async function getServerLivePosition() {
        // Use cached data if fresh (< 5 seconds old)
        if (serverSyncData && (Date.now() - lastSyncTime) < SYNC_CACHE_TTL) {
            // Extrapolate position based on time elapsed since last sync
            const elapsedSinceSync = (Date.now() - lastSyncTime) / 1000;
            return {
                trackIndex: serverSyncData.trackIndex,
                trackPosition: serverSyncData.trackPosition + elapsedSinceSync,
                fromCache: true
            };
        }

        try {
            const startTime = Date.now();
            const resp = await fetch(`${PA_API_BASE}/api/radio/live`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const endTime = Date.now();
            
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            const latencyMs = (endTime - startTime) / 2;

            // Update cached epoch for future calculations
            broadcastStart = data.epoch;
            localStorage.setItem('gurbani_broadcast_start', data.epoch.toString());
            localStorage.setItem('gurbani_last_sync', Date.now().toString());

            // Cache the sync data
            serverSyncData = {
                trackIndex: data.trackIndex,
                trackPosition: data.trackPosition + (latencyMs / 1000),
                epoch: data.epoch,
                trackDurations: data.trackDurations
            };
            lastSyncTime = Date.now();

            console.log(`[Sync] Server: Track ${data.trackIndex + 1} at ${Math.floor(data.trackPosition)}s`);

            return {
                trackIndex: serverSyncData.trackIndex,
                trackPosition: serverSyncData.trackPosition,
                fromCache: false
            };
        } catch (e) {
            console.error('[Sync] Server unreachable:', e.message);
            
            // If we have cached data, use it even if stale
            if (serverSyncData) {
                const elapsedSinceSync = (Date.now() - lastSyncTime) / 1000;
                console.warn(`[Sync] Using stale cache (${Math.floor(elapsedSinceSync)}s old)`);
                return {
                    trackIndex: serverSyncData.trackIndex,
                    trackPosition: serverSyncData.trackPosition + elapsedSinceSync,
                    fromCache: true,
                    stale: true
                };
            }

            // CRITICAL: If no server and no cache, we CANNOT play synchronized audio
            // Show error to user instead of playing wrong track
            throw new Error('Cannot sync with server. Please check your connection.');
        }
    }

    // Create and return audio element
    function createAudio() {
        if (audio) return audio;

        audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'none';

        audio.addEventListener('playing', () => {
            console.log(`🔊 Playing: ${STREAMS[currentStream].name}`);
            // Notify coordinator that we're playing
            if (window.AudioCoordinator) {
                window.AudioCoordinator.requestPlay('AnhadAudio');
            }
            saveState(true);
            dispatchStateChange(true);

            // Start drift correction for playlist streams
            if (STREAMS[currentStream].type === 'playlist') {
                startDriftCorrection();
            }
        });

        audio.addEventListener('pause', () => {
            console.log('⏸️ Audio paused');
            // Notify coordinator that we paused
            if (window.AudioCoordinator) {
                window.AudioCoordinator.notifyPause('AnhadAudio');
            }
            saveState(false);
            dispatchStateChange(false);

            // Stop drift correction
            stopDriftCorrection();
        });

        audio.addEventListener('ended', () => {
            // For playlist type, go to next track
            if (STREAMS[currentStream].type === 'playlist') {
                nextTrack();
            }
        });

        audio.addEventListener('error', (e) => {
            console.error('❌ Audio error:', e);
            // Show user-friendly message for 503/backend errors
            const error = audio?.error;
            let message = 'Audio playback error';
            if (error?.code === 2 || (error?.code === 4 && audio?.src?.includes('onrender.com'))) {
                message = 'Audio service temporarily unavailable. Please try again later.';
            }
            // Show notification with DOM check
            const showNotification = () => {
                if (typeof window.showToast === 'function') {
                    window.showToast(message, { type: 'error', duration: 5000 });
                } else if (document.body) {
                    let banner = document.getElementById('anhad-audio-error');
                    if (!banner) {
                        banner = document.createElement('div');
                        banner.id = 'anhad-audio-error';
                        banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#ef4444;color:white;padding:12px 24px;border-radius:8px;z-index:99999;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
                        document.body.appendChild(banner);
                    }
                    banner.textContent = message;
                    banner.style.display = 'block';
                    setTimeout(() => { if(banner) banner.style.display = 'none'; }, 5000);
                } else {
                    // Retry when body is ready
                    setTimeout(showNotification, 100);
                }
            };
            showNotification();
        });

        return audio;
    }

    // Drift correction - periodically check if we're in sync with server
    let driftCorrectionInterval = null;
    const DRIFT_CHECK_INTERVAL = 30000; // Check every 30 seconds
    const DRIFT_THRESHOLD = 5; // Correct if off by more than 5 seconds

    function startDriftCorrection() {
        stopDriftCorrection(); // Clear any existing interval

        driftCorrectionInterval = setInterval(async () => {
            if (!audio || audio.paused || STREAMS[currentStream].type !== 'playlist') {
                return;
            }

            try {
                // Force fresh sync
                serverSyncData = null;
                lastSyncTime = 0;
                
                const pos = await getServerLivePosition();
                
                // Check if we're on the wrong track
                if (pos.trackIndex !== currentTrackIndex) {
                    console.warn(`[Drift] Wrong track! Server: ${pos.trackIndex + 1}, Local: ${currentTrackIndex + 1}. Correcting...`);
                    currentTrackIndex = pos.trackIndex;
                    audio.src = STREAMS[currentStream].getTrackUrl(currentTrackIndex);
                    audio.addEventListener('loadedmetadata', function seekAfterTrackChange() {
                        audio.removeEventListener('loadedmetadata', seekAfterTrackChange);
                        const duration = audio.duration || 3600;
                        audio.currentTime = Math.min(pos.trackPosition, duration - 10);
                    }, { once: true });
                    audio.play();
                    return;
                }

                // Check if we're drifted on the same track
                const drift = Math.abs(audio.currentTime - pos.trackPosition);
                if (drift > DRIFT_THRESHOLD) {
                    console.warn(`[Drift] Off by ${Math.floor(drift)}s. Correcting...`);
                    audio.currentTime = Math.min(pos.trackPosition, audio.duration - 10);
                }
            } catch (e) {
                console.error('[Drift] Correction failed:', e.message);
            }
        }, DRIFT_CHECK_INTERVAL);

        console.log('[Drift] Correction started');
    }

    function stopDriftCorrection() {
        if (driftCorrectionInterval) {
            clearInterval(driftCorrectionInterval);
            driftCorrectionInterval = null;
            console.log('[Drift] Correction stopped');
        }
    }

    // Dispatch state change event
    function dispatchStateChange(isPlaying) {
        window.dispatchEvent(new CustomEvent('anhadAudioStateChange', {
            detail: {
                isPlaying: isPlaying,
                stream: currentStream,
                streamName: STREAMS[currentStream].name
            }
        }));
    }

    // Switch to a different stream
    async function switchStream(streamName) {
        if (!STREAMS[streamName]) {
            console.error('Unknown stream:', streamName);
            return;
        }

        const wasPlaying = isPlaying();
        
        // Always pause current audio when switching
        if (audio && !audio.paused) {
            pause();
        }

        currentStream = streamName;
        const stream = STREAMS[streamName];

        if (stream.type === 'live') {
            audio.src = stream.url;
        } else if (stream.type === 'playlist') {
            try {
                // Force fresh server sync when switching streams
                serverSyncData = null;
                lastSyncTime = 0;
                
                const pos = await getServerLivePosition();
                currentTrackIndex = pos.trackIndex;
                audio.src = stream.getTrackUrl(currentTrackIndex);

                if (wasPlaying) {
                    audio.addEventListener('loadedmetadata', function seekOnSwitch() {
                        audio.removeEventListener('loadedmetadata', seekOnSwitch);
                        const duration = audio.duration || 3600;
                        audio.currentTime = Math.min(pos.trackPosition, duration - 10);
                    }, { once: true });
                }
            } catch (e) {
                console.error('[Switch] Cannot sync:', e.message);
                if (typeof window.showToast === 'function') {
                    window.showToast('Cannot connect to radio server.', { type: 'error', duration: 3000 });
                }
                return;
            }
        }

        saveState(wasPlaying, streamName, currentTrackIndex);

        if (wasPlaying) {
            // Notify coordinator before playing new stream
            if (window.AudioCoordinator) {
                window.AudioCoordinator.requestPlay('AnhadAudio');
            }
            audio.play().catch(e => {
                console.log('Autoplay blocked after stream switch');
            });
        }

        console.log(`📻 Switched to: ${stream.name}`);
    }

    // Play audio
    async function play(streamName) {
        createAudio();

        // If stream specified and different, switch
        if (streamName && streamName !== currentStream) {
            // Notify coordinator BEFORE switching to pause other players
            if (window.AudioCoordinator) {
                window.AudioCoordinator.requestPlay('AnhadAudio');
            }
            await switchStream(streamName);
            return; // switchStream handles the play
        }

        const stream = STREAMS[currentStream];

        // Set source if not set
        if (!audio.src || audio.src === window.location.href) {
            if (stream.type === 'live') {
                audio.src = stream.url;
            } else if (stream.type === 'playlist') {
                try {
                    const pos = await getServerLivePosition();
                    currentTrackIndex = pos.trackIndex;
                    audio.src = stream.getTrackUrl(currentTrackIndex);

                    // For playlist, seek to server-synced live position after load
                    audio.addEventListener('loadedmetadata', function seekToLive() {
                        audio.removeEventListener('loadedmetadata', seekToLive);
                        const duration = audio.duration || 3600;
                        const seekTo = Math.min(pos.trackPosition, duration - 10);
                        audio.currentTime = Math.max(0, seekTo);
                        console.log(`[Play] Synced to ${Math.floor(seekTo)}s ${pos.fromCache ? '(cached)' : '(server)'}`);
                    }, { once: true });
                } catch (e) {
                    // Cannot sync - show error
                    console.error('[Play] Cannot sync:', e.message);
                    if (typeof window.showToast === 'function') {
                        window.showToast('Cannot connect to radio server. Please check your connection.', { type: 'error', duration: 5000 });
                    }
                    return; // Don't play if we can't sync
                }
            }
        }

        // Notify coordinator before playing
        if (window.AudioCoordinator) {
            window.AudioCoordinator.requestPlay('AnhadAudio');
        }

        audio.play().catch(e => {
            console.log('Autoplay blocked, user interaction required');
        });
    }

    // Pause audio
    function pause() {
        if (audio) {
            audio.pause();
        }
    }

    // Toggle playback
    function toggle(streamName) {
        if (audio && !audio.paused) {
            pause();
        } else {
            play(streamName);
        }
    }

    // Jump to Live - forces reconnection to the server-synced live position
    async function jumpToLive(streamName) {
        createAudio();

        // If stream specified, switch to it
        if (streamName && streamName !== currentStream) {
            currentStream = streamName;
        }

        const stream = STREAMS[currentStream];

        // Force reconnect by resetting the source
        audio.pause();

        if (stream.type === 'live') {
            // For live stream, add cache buster to force fresh connection
            audio.src = stream.url + '?t=' + Date.now();
        } else if (stream.type === 'playlist') {
            try {
                // FORCE fresh server sync (bypass cache)
                serverSyncData = null;
                lastSyncTime = 0;
                
                const pos = await getServerLivePosition();
                currentTrackIndex = pos.trackIndex;
                audio.src = stream.getTrackUrl(currentTrackIndex);

                audio.addEventListener('loadedmetadata', function seekToLive() {
                    audio.removeEventListener('loadedmetadata', seekToLive);
                    const duration = audio.duration || 3600;
                    const seekTo = Math.min(pos.trackPosition, duration - 10);
                    audio.currentTime = Math.max(0, seekTo);
                    console.log(`[JumpToLive] Synced to Track ${pos.trackIndex + 1} at ${Math.floor(seekTo)}s`);
                }, { once: true });
            } catch (e) {
                console.error('[JumpToLive] Cannot sync:', e.message);
                if (typeof window.showToast === 'function') {
                    window.showToast('Cannot connect to radio server. Please check your connection.', { type: 'error', duration: 5000 });
                }
                return;
            }
        }

        audio.play().catch(e => {
            console.log('Autoplay blocked for jump to live');
        });

        saveState(true, currentStream, currentTrackIndex);
        console.log(`🔴 Jumped to live: ${stream.name}`);
    }

    // Check if playing
    function isPlaying() {
        return audio && !audio.paused;
    }

    // Get current stream
    function getCurrentStream() {
        return currentStream;
    }

    // Next track (for playlist type)
    function nextTrack() {
        if (STREAMS[currentStream].type !== 'playlist') return;

        currentTrackIndex = (currentTrackIndex + 1) % STREAMS[currentStream].totalTracks;
        const wasPlaying = isPlaying();
        audio.src = STREAMS[currentStream].getTrackUrl(currentTrackIndex);
        saveState(wasPlaying, currentStream, currentTrackIndex);
        if (wasPlaying) audio.play();
    }

    // Previous track (for playlist type)
    function prevTrack() {
        if (STREAMS[currentStream].type !== 'playlist') return;

        if (audio.currentTime > 5) {
            audio.currentTime = 0;
        } else {
            currentTrackIndex = (currentTrackIndex - 1 + STREAMS[currentStream].totalTracks) % STREAMS[currentStream].totalTracks;
            const wasPlaying = isPlaying();
            audio.src = STREAMS[currentStream].getTrackUrl(currentTrackIndex);
            saveState(wasPlaying, currentStream, currentTrackIndex);
            if (wasPlaying) audio.play();
        }
    }

    // Expose global API
    window.AnhadAudio = {
        play,
        pause,
        toggle,
        jumpToLive,
        isPlaying,
        switchStream,
        getCurrentStream,
        nextTrack,
        prevTrack,
        getAudio: () => audio,
        STREAMS: Object.keys(STREAMS)
    };

    // Register with AudioCoordinator if available
    if (window.AudioCoordinator) {
        window.AudioCoordinator.register('AnhadAudio', {
            pause: pause,
            isPlaying: isPlaying,
            getStream: getCurrentStream
        });
        console.log('🎵 AnhadAudio registered with AudioCoordinator');
    } else {
        // Wait for coordinator to load
        setTimeout(() => {
            if (window.AudioCoordinator) {
                window.AudioCoordinator.register('AnhadAudio', {
                    pause: pause,
                    isPlaying: isPlaying,
                    getStream: getCurrentStream
                });
                console.log('🎵 AnhadAudio registered with AudioCoordinator (delayed)');
            }
        }, 500);
    }

    // Auto-resume on page load if was playing
    function autoResume() {
        const state = getState();
        // Only auto-resume if was playing within last 30 minutes
        if (state.shouldPlay && (Date.now() - state.timestamp < 1800000)) {
            console.log('🔄 Auto-resuming:', state.stream);
            currentStream = state.stream || 'darbar';
            currentTrackIndex = state.trackIndex || 0;
            setTimeout(() => play(), 300);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoResume);
    } else {
        autoResume();
    }

    console.log('🪯 ANHAD Persistent Audio System V2 loaded');
    console.log('📻 Available streams:', Object.keys(STREAMS).join(', '));
})();
