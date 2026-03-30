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

    // API base URL - Always use render backend
    const PA_API_BASE = 'https://anhad-final.onrender.com';

    // Get broadcast start for virtual live (tries server, falls back to local)
    function getBroadcastStart() {
        if (broadcastStart) return broadcastStart;
        let start = localStorage.getItem('gurbani_broadcast_start');
        if (start) {
            broadcastStart = parseInt(start, 10);
        } else {
            broadcastStart = Date.now();
            localStorage.setItem('gurbani_broadcast_start', broadcastStart.toString());
        }
        return broadcastStart;
    }

    // Get current position from SERVER (async)
    async function getServerLivePosition() {
        try {
            const startTime = Date.now();
            const resp = await fetch(`${PA_API_BASE}/api/radio/live`);
            const endTime = Date.now();
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const latencyMs = (endTime - startTime) / 2;

            // Update local cached epoch
            broadcastStart = data.epoch;
            localStorage.setItem('gurbani_broadcast_start', data.epoch.toString());

            return {
                trackIndex: data.trackIndex,
                trackPosition: data.trackPosition + (latencyMs / 1000)
            };
        } catch (e) {
            // Fallback to local
            return getVirtualLivePosition();
        }
    }

    // Get current position in virtual live playlist (local fallback)
    function getVirtualLivePosition() {
        const elapsed = (Date.now() - getBroadcastStart()) / 1000;
        const trackDuration = 3600; // 1 hour per track
        const totalDuration = STREAMS.amritvela.totalTracks * trackDuration;
        const positionInPlaylist = ((elapsed % totalDuration) + totalDuration) % totalDuration;

        const trackIndex = Math.floor(positionInPlaylist / trackDuration);
        const trackPosition = positionInPlaylist % trackDuration;

        return { trackIndex, trackPosition };
    }

    // Create and return audio element
    function createAudio() {
        if (audio) return audio;

        audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'none';

        audio.addEventListener('playing', () => {
            console.log(`🔊 Playing: ${STREAMS[currentStream].name}`);
            saveState(true);
            dispatchStateChange(true);
        });

        audio.addEventListener('pause', () => {
            console.log('⏸️ Audio paused');
            saveState(false);
            dispatchStateChange(false);
        });

        audio.addEventListener('ended', () => {
            // For playlist type, go to next track
            if (STREAMS[currentStream].type === 'playlist') {
                nextTrack();
            }
        });

        audio.addEventListener('error', (e) => {
            console.error('❌ Audio error:', e);
        });

        return audio;
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
        if (wasPlaying) {
            pause();
        }

        currentStream = streamName;
        const stream = STREAMS[streamName];

        if (stream.type === 'live') {
            audio.src = stream.url;
        } else if (stream.type === 'playlist') {
            // Go to server-synced live position
            const pos = await getServerLivePosition();
            currentTrackIndex = pos.trackIndex;
            audio.src = stream.getTrackUrl(currentTrackIndex);
        }

        saveState(wasPlaying, streamName, currentTrackIndex);

        if (wasPlaying) {
            play();
        }

        console.log(`📻 Switched to: ${stream.name}`);
    }

    // Play audio
    async function play(streamName) {
        createAudio();

        // If stream specified and different, switch
        if (streamName && streamName !== currentStream) {
            await switchStream(streamName);
        }

        const stream = STREAMS[currentStream];

        // Set source if not set
        if (!audio.src || audio.src === window.location.href) {
            if (stream.type === 'live') {
                audio.src = stream.url;
            } else if (stream.type === 'playlist') {
                const pos = await getServerLivePosition();
                currentTrackIndex = pos.trackIndex;
                audio.src = stream.getTrackUrl(currentTrackIndex);

                // For playlist, seek to server-synced live position after load
                audio.addEventListener('loadedmetadata', function seekToLive() {
                    audio.removeEventListener('loadedmetadata', seekToLive);
                    const duration = audio.duration || 3600;
                    audio.currentTime = Math.min(pos.trackPosition, duration - 10);
                }, { once: true });
            }
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
            // For playlist, jump to server-synced live position
            const pos = await getServerLivePosition();
            currentTrackIndex = pos.trackIndex;
            audio.src = stream.getTrackUrl(currentTrackIndex);

            audio.addEventListener('loadedmetadata', function seekToLive() {
                audio.removeEventListener('loadedmetadata', seekToLive);
                const duration = audio.duration || 3600;
                audio.currentTime = Math.min(pos.trackPosition, duration - 10);
            }, { once: true });
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
