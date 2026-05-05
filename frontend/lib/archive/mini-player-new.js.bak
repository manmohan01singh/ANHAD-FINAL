/**
 * ANHAD MINI PLAYER — Simple & Reliable
 * Shows on all pages when audio is playing
 */

(function() {
    'use strict';

    const STATE_KEY = 'gurbani_radio_state';

    // Stream configuration
    const STREAMS = {
        darbar: {
            name: 'Darbar Sahib Live',
            subtitle: 'Sri Harmandir Sahib Ji',
            url: 'https://live.sgpc.net:8443/;nocache=1',
            type: 'live'
        },
        amritvela: {
            name: 'Amritvela Kirtan',
            subtitle: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
            type: 'playlist'
        }
    };

    // State
    let audio = null;
    let currentStream = null;
    let isPlaying = false;
    let playerEl = null;

    // Check if on Gurbani Radio page (skip there)
    const isRadioPage = window.location.pathname.toLowerCase().includes('gurbani-radio');

    function saveState() {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify({
                isPlaying,
                stream: currentStream,
                volume: audio ? audio.volume : 0.8,
                timestamp: Date.now()
            }));
        } catch(e) {}
    }

    // Save state every 5 seconds while playing
    setInterval(() => {
        if (isPlaying && currentStream) {
            saveState();
        }
    }, 5000);

    function loadState() {
        try {
            const s = localStorage.getItem(STATE_KEY);
            return s ? JSON.parse(s) : null;
        } catch(e) { return null; }
    }

    function getAudioBase() {
        return 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
    }

    function getAmritvelaUrl(index) {
        return `${getAudioBase()}/day-${(index % 40) + 1}.webm?t=${Date.now()}`;
    }

    async function getAmritvelaPosition() {
        try {
            const resp = await fetch('https://anhad-final.onrender.com/api/radio/live?t=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await resp.json();
            return { trackIndex: data.trackIndex, position: data.trackPosition };
        } catch(e) {
            // Fallback to local calculation
            const elapsed = (Date.now() - 1704067200000) / 1000;
            const totalDur = 40 * 3600;
            const pos = ((elapsed % totalDur) + totalDur) % totalDur;
            return { trackIndex: Math.floor(pos / 3600), position: pos % 3600 };
        }
    }

    function createPlayerElement() {
        if (playerEl || document.getElementById('anhad-mini-player')) return;

        const el = document.createElement('div');
        el.id = 'anhad-mini-player';
        el.innerHTML = `
            <div class="amp-art">
                <img id="amp-img" src="" alt="">
                <div class="amp-live-indicator"></div>
            </div>
            <div class="amp-info">
                <div class="amp-title" id="amp-title">—</div>
                <div class="amp-subtitle" id="amp-subtitle">—</div>
            </div>
            <button class="amp-btn amp-play" id="amp-play" aria-label="Play/Pause">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="amp-btn amp-close" id="amp-close" aria-label="Close">×</button>
        `;
        document.body.appendChild(el);
        playerEl = el;

        // Events
        document.getElementById('amp-play').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlay();
        });

        document.getElementById('amp-close').addEventListener('click', (e) => {
            e.stopPropagation();
            stop();
        });

        playerEl.addEventListener('click', (e) => {
            if (e.target.closest('.amp-btn')) return;
            window.location.href = 'GurbaniRadio/gurbani-radio.html';
        });
    }

    function updateUI() {
        if (!playerEl) return;

        const stream = currentStream ? STREAMS[currentStream] : null;

        if (!isPlaying || !stream) {
            playerEl.classList.remove('active');
            return;
        }

        playerEl.classList.add('active');

        document.getElementById('amp-title').textContent = stream.name;
        document.getElementById('amp-subtitle').textContent = stream.subtitle;

        // Update play icon
        const playIcon = document.querySelector('#amp-play svg path');
        playIcon.setAttribute('d', isPlaying
            ? 'M6 4h4v16H6V4zm8 0h4v16h-4V4z'  // Pause
            : 'M8 5v14l11-7z'                  // Play
        );

        // Show/hide live indicator
        const liveIndicator = playerEl.querySelector('.amp-live-indicator');
        liveIndicator.style.display = stream.type === 'live' ? 'block' : 'none';
    }

    async function play(streamName) {
        if (!audio) {
            audio = new Audio();
            audio.volume = 0.8;

            audio.addEventListener('playing', () => {
                isPlaying = true;
                saveState();
                updateUI();
                // Dispatch event to sync other UI components
                window.dispatchEvent(new CustomEvent('anhadaudiostatechange', { detail: { isPlaying: true, stream: currentStream } }));
                window.dispatchEvent(new CustomEvent('anhadAudioStateChange', { detail: { isPlaying: true, stream: currentStream } }));
            });

            audio.addEventListener('pause', () => {
                isPlaying = false;
                saveState();
                updateUI();
                // Dispatch event to sync other UI components
                window.dispatchEvent(new CustomEvent('anhadaudiostatechange', { detail: { isPlaying: false, stream: currentStream } }));
                window.dispatchEvent(new CustomEvent('anhadAudioStateChange', { detail: { isPlaying: false, stream: currentStream } }));
            });

            audio.addEventListener('ended', () => {
                if (currentStream === 'amritvela') {
                    playNextAmritvela();
                }
            });

            audio.addEventListener('error', () => {
                isPlaying = false;
                updateUI();
                setTimeout(() => play(currentStream), 3000);
            });
        }

        currentStream = streamName;
        const stream = STREAMS[streamName];

        if (stream.type === 'live') {
            audio.src = stream.url + '?t=' + Date.now();
            audio.load();
            audio.play().catch(() => {});
        } else if (stream.type === 'playlist') {
            const pos = await getAmritvelaPosition();
            audio.src = getAmritvelaUrl(pos.trackIndex);
            audio.load();
            audio.currentTime = pos.position;
            audio.play().catch(() => {});
        }

        createPlayerElement();
        updateUI();
        saveState();
    }

    async function playNextAmritvela() {
        if (!audio || currentStream !== 'amritvela') return;
        const pos = await getAmritvelaPosition();
        audio.src = getAmritvelaUrl(pos.trackIndex);
        audio.play().catch(() => {});
    }

    function pause() {
        if (audio) audio.pause();
    }

    function togglePlay() {
        if (isPlaying) {
            pause();
        } else if (currentStream) {
            play(currentStream);
        }
    }

    function stop() {
        if (audio) {
            audio.pause();
            audio.src = '';
        }
        isPlaying = false;
        currentStream = null;
        updateUI();
        localStorage.removeItem(STATE_KEY);
    }

    function resumeFromState() {
        if (isRadioPage) return;

        const state = loadState();
        if (state && state.isPlaying && state.stream) {
            // Check if not too old (30 min)
            if (Date.now() - state.timestamp < 30 * 60 * 1000) {
                play(state.stream);
            }
        }
    }

    // Initialize
    if (!isRadioPage) {
        // Create CSS
        const style = document.createElement('style');
        style.textContent = `
            #anhad-mini-player {
                position: fixed;
                bottom: calc(88px + env(safe-area-inset-bottom, 0px));
                left: 12px;
                right: 12px;
                height: 70px;
                background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
                border-radius: 16px;
                display: none;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                z-index: 10001;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
            }
            #anhad-mini-player.active {
                display: flex;
                animation: ampSlideUp 0.3s ease;
            }
            @keyframes ampSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .amp-art {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: linear-gradient(135deg, #D4860A, #F5C842);
                position: relative;
                flex-shrink: 0;
                overflow: hidden;
            }
            .amp-art img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .amp-live-indicator {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 8px;
                height: 8px;
                background: #FF3B30;
                border-radius: 50%;
                animation: ampPulse 1.5s infinite;
                display: none;
            }
            @keyframes ampPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(0.8); }
            }
            .amp-info {
                flex: 1;
                min-width: 0;
            }
            .amp-title {
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .amp-subtitle {
                color: rgba(255,255,255,0.6);
                font-size: 12px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-top: 2px;
            }
            .amp-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background: rgba(255,255,255,0.1);
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: all 0.2s;
            }
            .amp-btn:active { transform: scale(0.9); }
            .amp-btn svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }
            .amp-play { background: #D4860A; }
            .amp-close {
                background: transparent;
                font-size: 20px;
                color: rgba(255,255,255,0.5);
            }
        `;
        document.head.appendChild(style);

        // Resume if was playing
        resumeFromState();
    }

    // Expose global API
    window.AnhadMiniPlayer = {
        play,
        pause,
        toggle: togglePlay,
        stop,
        isPlaying: () => isPlaying,
        getStream: () => currentStream
    };

    // Listen for play requests from radio page
    window.addEventListener('anhadRequestPlay', (e) => {
        const stream = e.detail?.stream;
        if (stream && !isRadioPage) {
            play(stream);
        }
    });

})();
