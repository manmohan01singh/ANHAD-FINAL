import sys

file_path = "/run/media/manmohansingh/OS/right/ANHAD/frontend/GurbaniRadio/ios17-gurbani-radio.html"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_css = """        :root {
            --accent: #FFD700; /* Bright gold */
            --accent-glow: rgba(255, 215, 0, 0.4);
            --accent-red: #FF3B30;
            --accent-green: #34C759;

            --bg-primary: #0A0A0C; /* Deep warm black */
            --bg-secondary: #121214;
            --surface-1: rgba(255, 255, 255, 0.04);
            --surface-2: rgba(255, 255, 255, 0.08); 
            --surface-3: rgba(255, 255, 255, 0.12);

            --text-primary: #FFFFFF;
            --text-secondary: rgba(255, 255, 255, 0.60);
            --text-tertiary: rgba(255, 255, 255, 0.35);

            --safe-top: env(safe-area-inset-top, 44px);
            --safe-bottom: env(safe-area-inset-bottom, 34px);
        }

        *,
        *::before,
        *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        html {
            font-size: 16px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        body {
            font-family: -apple-system, 'SF Pro Display', 'Inter', 'Satoshi', BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            min-height: 100dvh;
            overflow: hidden;
            position: fixed;
            inset: 0;
            user-select: none;
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       DYNAMIC BACKGROUND & GLOW
       ═══════════════════════════════════════════════════════════════════════════════ */
        .bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            overflow: hidden;
            background: radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.15) 0%, var(--bg-primary) 70%);
        }

        .ambient-glow {
            position: absolute;
            width: 100vw;
            height: 100vw;
            max-width: 800px;
            max-height: 800px;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%);
            border-radius: 50%;
            top: -20%;
            left: 50%;
            transform: translateX(-50%);
            animation: pulse-glow 8s ease-in-out infinite alternate;
            pointer-events: none;
        }

        @keyframes pulse-glow {
            0% { opacity: 0.6; transform: translateX(-50%) scale(0.9); }
            100% { opacity: 1; transform: translateX(-50%) scale(1.1); }
        }

        .particles {
            position: absolute;
            inset: 0;
            background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 40px 40px;
            opacity: 0.3;
            animation: float-particles 60s linear infinite;
            pointer-events: none;
        }

        @keyframes float-particles {
            0% { background-position: 0 0; }
            100% { background-position: 400px 400px; }
        }

        /* hide legacy background elements */
        .bg__image, .bg__gradient {
            display: none;
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       PLAYER LAYOUT
       ═══════════════════════════════════════════════════════════════════════════════ */
        .player-container {
            position: relative;
            z-index: 1;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, rgba(10,10,12,0.4) 0%, rgba(10,10,12,0.95) 100%);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
        }

        .player {
            width: 100%;
            height: 100%;
            max-width: 428px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            padding: 0 28px;
            padding-top: max(16px, var(--safe-top));
            padding-bottom: max(20px, var(--safe-bottom));
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       HEADER
       ═══════════════════════════════════════════════════════════════════════════════ */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            flex-shrink: 0;
        }

        .header__btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: var(--text-secondary);
            font-size: 16px;
            cursor: pointer;
            border-radius: 50%;
            transition: all 0.2s ease;
        }

        .header__btn:active {
            transform: scale(0.9);
            background: rgba(255, 255, 255, 0.1);
        }

        .header__title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--accent);
            opacity: 0.9;
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       ARTWORK SECTION
       ═══════════════════════════════════════════════════════════════════════════════ */
        .artwork-section {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px 0 20px 0;
            min-height: 0;
        }

        .artwork-wrapper {
            position: relative;
            width: 100%;
            max-width: 360px;
            aspect-ratio: 1;
            animation: float-artwork 8s ease-in-out infinite;
        }

        @keyframes float-artwork {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(0.5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }

        .artwork {
            width: 100%;
            height: 100%;
            border-radius: 24px;
            overflow: hidden;
            position: relative;
            box-shadow:
                0 40px 80px rgba(0, 0, 0, 0.8),
                0 0 50px rgba(255, 215, 0, 0.15);
            transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.6s ease;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .is-paused .artwork {
            transform: scale(0.88);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            border-radius: 20px;
        }

        .is-paused .artwork-wrapper {
            animation-play-state: paused;
        }

        .artwork__img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: filter 0.6s ease;
        }

        .is-paused .artwork__img {
            filter: grayscale(20%);
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       TRACK INFO
       ═══════════════════════════════════════════════════════════════════════════════ */
        .track-info {
            padding: 24px 0 16px 0;
            flex-shrink: 0;
        }

        .track-info__row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
        }

        .track-info__text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .track-info__title-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .track-info__title {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #FFFFFF;
            text-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }

        .track-info__live-dot {
            width: 8px;
            height: 8px;
            background: var(--accent-red);
            border-radius: 50%;
            box-shadow: 0 0 12px var(--accent-red), 0 0 24px var(--accent-red);
            animation: pulse-live 1.5s ease-in-out infinite;
            margin-top: 4px;
        }

        @keyframes pulse-live {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
        }

        .track-info__artist {
            font-size: 20px;
            font-weight: 400;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            opacity: 0.8;
        }

        .track-info__actions {
            display: flex;
            gap: 10px;
            flex-shrink: 0;
            padding-top: 2px;
        }

        .track-info__btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: var(--surface-1);
            border: 1px solid var(--surface-2);
            color: var(--text-secondary);
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .track-info__btn:active {
            transform: scale(0.85);
            background: var(--surface-2);
        }

        .track-info__btn.active {
            color: var(--accent);
            border-color: var(--accent-glow);
            background: rgba(255, 215, 0, 0.1);
        }

        .track-info__btn.active i.far {
            font-weight: 900;
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       WAVEFORM Replacing Timeline
       ═══════════════════════════════════════════════════════════════════════════════ */
        .waveform-section {
            padding: 12px 0 20px 0;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .waveform {
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 3px;
            width: 100%;
        }

        .waveform-bar {
            flex: 1;
            background: var(--accent);
            border-radius: 4px;
            height: 4px;
            opacity: 0.6;
            transition: height 0.15s ease, opacity 0.3s ease;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
        }

        .is-paused .waveform-bar {
            height: 4px !important;
            opacity: 0.2;
        }

        .waveform-labels {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .waveform-time {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-tertiary);
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.5px;
        }

        .waveform-live-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 14px;
            background: rgba(255, 59, 48, 0.15);
            border: 1px solid rgba(255, 59, 48, 0.3);
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            color: var(--accent-red);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .waveform-live-btn:active {
            transform: scale(0.92);
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       TRANSPORT CONTROLS
       ═══════════════════════════════════════════════════════════════════════════════ */
        .controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 40px;
            padding: 10px 0;
            flex-shrink: 0;
        }

        .controls__btn {
            background: transparent;
            border: none;
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .controls__btn:active {
            transform: scale(0.85);
            opacity: 0.7;
        }

        .controls__skip {
            font-size: 28px;
            color: var(--text-secondary);
        }

        .controls__play {
            width: 84px;
            height: 84px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%);
            color: #0A0A0C;
            font-size: 32px;
            box-shadow: 
                0 15px 35px rgba(212, 175, 55, 0.4), 
                inset 0 4px 10px rgba(255,255,255,0.6),
                inset 0 -4px 10px rgba(0,0,0,0.2);
            border: none;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }

        .controls__play:active {
            transform: scale(0.92);
            box-shadow: 
                0 8px 20px rgba(212, 175, 55, 0.3), 
                inset 0 4px 10px rgba(255,255,255,0.6),
                inset 0 -4px 10px rgba(0,0,0,0.2);
        }

        .controls__play .fa-play {
            margin-left: 6px;
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       VOLUME SLIDER (Minimal & Thin)
       ═══════════════════════════════════════════════════════════════════════════════ */
        .volume {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 24px 0 10px 0;
            flex-shrink: 0;
        }

        .volume__icon {
            font-size: 13px;
            color: var(--text-tertiary);
            width: 20px;
            text-align: center;
            opacity: 0.8;
            transition: color 0.2s;
        }

        .volume__track {
            flex: 1;
            position: relative;
            height: 2px;
            background: rgba(255,255,255,0.1);
            border-radius: 1px;
        }

        .volume__fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: linear-gradient(90deg, #FFFFFF, #FFD700);
            border-radius: 1px;
            width: 70%;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(255,255,255,0.2);
        }

        .volume__fill::after {
            content: '';
            position: absolute;
            right: -5px;
            top: 50%;
            transform: translateY(-50%);
            width: 10px;
            height: 10px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(0,0,0,0.6);
            opacity: 0;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .volume:active .volume__fill::after,
        .volume:hover .volume__fill::after {
            opacity: 1;
            transform: translateY(-50%) scale(1.2);
        }

        .volume__input {
            position: absolute;
            inset: -15px 0;
            width: 100%;
            height: 32px;
            opacity: 0;
            cursor: pointer;
            margin: 0;
            -webkit-appearance: none;
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       FOOTER
       ═══════════════════════════════════════════════════════════════════════════════ */
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px 8px 20px;
            flex-shrink: 0;
        }

        .footer__btn {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-size: 18px;
            cursor: pointer;
            border-radius: 50%;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .footer__btn:active {
            transform: scale(0.85);
            background: var(--surface-1);
        }

        .footer__btn.active {
            color: var(--accent);
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       CONNECTION STATUS
       ═══════════════════════════════════════════════════════════════════════════════ */
        .status-bar {
            position: absolute;
            bottom: calc(var(--safe-bottom) + 80px);
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 24px;
            background: rgba(30, 30, 30, 0.85);
            border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 100px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            opacity: 0;
            visibility: hidden;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 100;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        }

        .status-bar.visible {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
        }

        .status-bar__dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent-green);
            box-shadow: 0 0 12px var(--accent-green);
        }

        .status-bar.error .status-bar__dot {
            background: var(--accent-red);
            box-shadow: 0 0 12px var(--accent-red);
        }

        /* ═══════════════════════════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════════════════════════ */
        @media (max-height: 750px) {
            .artwork-wrapper { max-width: 300px; }
            .track-info { padding: 12px 0 8px 0; }
            .track-info__title { font-size: 24px; }
            .track-info__artist { font-size: 18px; }
            .controls__play { width: 72px; height: 72px; font-size: 28px; }
            .waveform { height: 32px; }
            .ambient-glow { top: -30%; }
        }

        @media (max-width: 380px) {
            .player { padding-left: 20px; padding-right: 20px; }
            .artwork-wrapper { max-width: 280px; }
            .track-info__title { font-size: 24px; }
            .track-info__artist { font-size: 18px; }
            .controls { gap: 24px; }
        }

        @media (prefers-reduced-motion: reduce) {
"""

new_html = """    <!-- DYNAMIC BACKGROUND -->
    <div class="bg" aria-hidden="true">
        <div class="ambient-glow"></div>
        <div class="particles"></div>
    </div>

    <!-- PLAYER -->
    <div class="player-container">
    <main class="player" id="player">

        <!-- HEADER -->
        <header class="header">
            <button class="header__btn" id="closeBtn" aria-label="Close">
                <i class="fas fa-chevron-down"></i>
            </button>
            <span class="header__title">Darbar Sahib Live</span>
            <button class="header__btn" id="moreBtn" aria-label="More">
                <i class="fas fa-ellipsis"></i>
            </button>
        </header>

        <!-- ARTWORK -->
        <section class="artwork-section">
            <div class="artwork-wrapper">
                <div class="artwork" id="artwork">
                    <img class="artwork__img" src="../assets/DARBAR.jpg" alt="Sri Harmandir Sahib" id="artworkImg">
                </div>
            </div>
        </section>

        <!-- TRACK INFO -->
        <section class="track-info">
            <div class="track-info__row">
                <div class="track-info__text">
                    <div class="track-info__title-wrapper">
                        <h1 class="track-info__title">Live Kirtan</h1>
                        <div class="track-info__live-dot" title="Live"></div>
                    </div>
                    <p class="track-info__artist">Sri Harmandir Sahib</p>
                </div>
                <div class="track-info__actions">
                    <button class="track-info__btn" id="starBtn" aria-label="Favorite">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="track-info__btn" id="shareBtn" aria-label="Share">
                        <i class="fas fa-share-nodes"></i>
                    </button>
                    <button class="track-info__btn" id="menuBtn" aria-label="Options">
                        <i class="fas fa-ellipsis"></i>
                    </button>
                </div>
            </div>
        </section>

        <!-- LIVE WAVEFORM -->
        <section class="waveform-section">
            <div class="waveform" id="waveformContainer">
                <!-- Javascript will generate bars here -->
            </div>
            <div class="waveform-labels">
                <span class="waveform-time" id="elapsedTime">--:--</span>
                <button class="waveform-live-btn" id="liveBtn">LIVE</button>
            </div>
        </section>

        <!-- TRANSPORT CONTROLS -->
        <section class="controls">
            <button class="controls__btn controls__skip" id="prevBtn" aria-label="Previous">
                <i class="fas fa-backward-step"></i>
            </button>
            <button class="controls__btn controls__play" id="playBtn" aria-label="Play">
                <i class="fas fa-play" id="playIcon"></i>
            </button>
            <button class="controls__btn controls__skip" id="nextBtn" aria-label="Next">
                <i class="fas fa-forward-step"></i>
            </button>
        </section>

        <!-- VOLUME -->
        <section class="volume">
            <i class="fas fa-volume-off volume__icon"></i>
            <div class="volume__track">
                <div class="volume__fill" id="volumeFill"></div>
                <input type="range" class="volume__input" id="volumeInput" min="0" max="100" value="70">
            </div>
            <i class="fas fa-volume-high volume__icon"></i>
        </section>

        <!-- FOOTER -->
        <section class="footer">
            <button class="footer__btn" id="lyricsBtn" aria-label="Lyrics">
                <i class="fas fa-quote-left"></i>
            </button>
            <button class="footer__btn" id="airplayBtn" aria-label="AirPlay">
                <i class="fas fa-airplay"></i>
            </button>
            <button class="footer__btn" id="queueBtn" aria-label="Queue">
                <i class="fas fa-bars-staggered"></i>
            </button>
        </section>

        <!-- STATUS BAR -->
        <div class="status-bar" id="statusBar">
            <span class="status-bar__dot"></span>
            <span id="statusText">Connecting...</span>
        </div>

    </main>
    </div>
"""

new_js = """
            // ━━━ SHARE BUTTON ━━━
            const shareBtn = document.getElementById('shareBtn');
            shareBtn?.addEventListener('click', () => {
                if (navigator.share) {
                    navigator.share({
                        title: 'Darbar Sahib Live',
                        text: 'Listening to live kirtan from Sri Harmandir Sahib on ANHAD.',
                        url: window.location.href,
                    });
                } else {
                    alert('Sharing is not supported on this browser.');
                }
            });

            // ━━━ WAVEFORM GENERATION & ANIMATION ━━━
            const waveformContainer = document.getElementById('waveformContainer');
            if (waveformContainer) {
                const numBars = 40; 
                const bars = [];
                
                for(let i=0; i<numBars; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'waveform-bar';
                    const centerDist = Math.abs(i - numBars/2) / (numBars/2);
                    const curveMultiplier = 1 - Math.pow(centerDist, 2);
                    const initHeight = Math.max(4, Math.random() * 30 * curveMultiplier + 4);
                    bar.style.height = `${initHeight}px`;
                    waveformContainer.appendChild(bar);
                    bars.push({ element: bar, curve: curveMultiplier, maxH: 36 });
                }

                function animateWaveform() {
                    if(isPlaying) {
                        bars.forEach((b) => {
                            const current = parseFloat(b.element.style.height);
                            const target = Math.max(4, Math.random() * b.maxH * b.curve + 4);
                            const newHeight = current + (target - current) * 0.2;
                            b.element.style.height = `${newHeight}px`;
                        });
                    }
                    requestAnimationFrame(animateWaveform);
                }
                animateWaveform();
            }

            console.log('🪯 ANHAD | Darbar Sahib Live Player');
            console.log('💡 Keyboard: Space=Play/Pause, Arrows=Volume, L=Jump to Live');
            console.log('▶️ Auto-playing on page load...');
        });
    </script>
"""

out = []
i = 0
while i < len(lines):
    if i == 25:  # Line 26 (0-indexed 25)
        out.append(new_css)
        i = 624  # Skip to line 625 target
    elif i == 762: # Line 763
        out.append(new_html)
        i = 866    # Skip to line 866 target
    elif "console.log('🪯 ANHAD | Darbar Sahib" in lines[i]:
        out.append(new_js)
        # Skip next 4 lines
        i += 4
    else:
        out.append(lines[i])
        i += 1

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(out)

print("Update successful!")
