/**
 * ANHAD EXTREME MINI PLAYER — Premium Claymorphism Edition
 * Auto theme, persistent visibility, loading animations
 */

(function() {
    'use strict';
    const STATE_KEY = 'gurbani_radio_state';
    const STREAMS = {
        darbar: { name: 'Darbar Sahib Live', subtitle: 'Sri Harmandir Sahib Ji', url: 'https://live.sgpc.net:8443/;nocache=1', type: 'live', img: 'assets/darbar-sahib-evening.webp' },
        amritvela: { name: 'Amritvela Kirtan', subtitle: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ', type: 'playlist', img: 'assets/Darbar-sahib-AMRITVELA.webp' }
    };
    let audio = null, currentStream = null, isPlaying = false, isLoading = false, playerEl = null;
    const isRadioPage = location.pathname.toLowerCase().includes('gurbani-radio');
    if (isRadioPage) return;

    function getTheme() {
        const h = document.documentElement;
        return h.classList.contains('dark') || h.classList.contains('dark-mode') || h.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function saveState() {
        try { localStorage.setItem(STATE_KEY, JSON.stringify({ isPlaying, stream: currentStream, timestamp: Date.now() })); } catch(e) {}
    }

    function loadState() {
        try { const s = localStorage.getItem(STATE_KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; }
    }

    function getAmritvelaPos() {
        const e = (Date.now() - 1704067200000) / 1000;
        const p = ((e % 144000) + 144000) % 144000;
        return { trackIndex: Math.floor(p / 3600), position: p % 3600 };
    }

    function injectCSS() {
        if (document.getElementById('anhad-mp-css')) return;
        const s = document.createElement('style');
        s.id = 'anhad-mp-css';
        s.textContent = `
        #anhad-mini-player { position:fixed; bottom:calc(88px + env(safe-area-inset-bottom,0px)); left:12px; right:12px; height:72px; border-radius:20px; display:none; align-items:center; gap:14px; padding:12px 16px; z-index:10001; cursor:pointer; transform:translateY(20px); opacity:0; transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        #anhad-mini-player.show { display:flex; }
        #anhad-mini-player.visible { transform:translateY(0); opacity:1; }
        html:not([data-theme="dark"]):not(.dark):not(.dark-mode) #anhad-mini-player { background:linear-gradient(145deg,rgba(255,255,255,0.95),rgba(248,248,250,0.9)); box-shadow:20px 20px 60px rgba(0,0,0,0.08),-10px-10px 40px rgba(255,255,255,0.9),inset 0 1px 1px rgba(255,255,255,0.8),0 0 0 1px rgba(0,0,0,0.04); border:1px solid rgba(255,255,255,0.6); }
        html[data-theme="dark"] #anhad-mini-player,html.dark #anhad-mini-player,html.dark-mode #anhad-mini-player { background:linear-gradient(145deg,rgba(45,45,50,0.95),rgba(30,30,35,0.9)); box-shadow:20px 20px 60px rgba(0,0,0,0.4),-10px-10px 40px rgba(255,255,255,0.05),inset 0 1px 1px rgba(255,255,255,0.1),0 0 0 1px rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); }
        .amp-art { width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg,#D4860A,#F5C842); position:relative; flex-shrink:0; overflow:hidden; box-shadow:4px 4px 12px rgba(0,0,0,0.15),inset 0 0 0 2px rgba(255,255,255,0.3); }
        .amp-art img { width:100%; height:100%; object-fit:cover; border-radius:16px; }
        .amp-live { position:absolute; top:4px; right:4px; width:8px; height:8px; background:#FF3B30; border-radius:50%; animation:pulse 1.5s infinite; display:none; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .amp-info { flex:1; min-width:0; }
        .amp-title { font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .amp-sub { font-size:12px; opacity:0.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
        html:not([data-theme="dark"]):not(.dark):not(.dark-mode) .amp-title { color:#1d1d1f; }
        html:not([data-theme="dark"]):not(.dark):not(.dark-mode) .amp-sub { color:#6e6e73; }
        html[data-theme="dark"] .amp-title,html.dark .amp-title,html.dark-mode .amp-title { color:#fff; }
        html[data-theme="dark"] .amp-sub,html.dark .amp-sub,html.dark-mode .amp-sub { color:rgba(255,255,255,0.7); }
        .amp-btn { width:44px; height:44px; border-radius:50%; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; }
        .amp-btn:active { transform:scale(0.9); }
        .amp-play { background:linear-gradient(145deg,#D4860A,#F5C842); color:#fff; }
        .amp-close { background:rgba(0,0,0,0.05); color:inherit; font-size:18px; }
        .amp-loading { width:20px; height:20px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .amp-play svg { width:20px; height:20px; fill:currentColor; }
        `;
        document.head.appendChild(s);
    }

    function createPlayer() {
        if (playerEl || document.getElementById('anhad-mini-player')) return;
        const el = document.createElement('div');
        el.id = 'anhad-mini-player';
        el.innerHTML = `
            <div class="amp-art"><img id="amp-img" src="" alt=""><div class="amp-live"></div></div>
            <div class="amp-info"><div class="amp-title">—</div><div class="amp-sub">—</div></div>
            <button class="amp-btn amp-play" id="amp-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
            <button class="amp-btn amp-close" id="amp-close">×</button>
        `;
        document.body.appendChild(el);
        playerEl = el;
        document.getElementById('amp-play').addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
        document.getElementById('amp-close').addEventListener('click', (e) => { e.stopPropagation(); stop(); });
        el.addEventListener('click', () => {
            const url = currentStream === 'amritvela' ? 'GurbaniRadio/gurbani-radio.html?stream=amritvela' : 'GurbaniRadio/gurbani-radio.html';
            window.location.href = url;
        });
    }

    function updateUI() {
        if (!playerEl) return;
        const stream = currentStream ? STREAMS[currentStream] : null;
        if (!stream) return;
        playerEl.querySelector('.amp-title').textContent = stream.name;
        playerEl.querySelector('.amp-sub').textContent = stream.subtitle;
        playerEl.querySelector('.amp-live').style.display = stream.type === 'live' ? 'block' : 'none';
        const img = playerEl.querySelector('#amp-img');
        if (img && stream.img) img.src = stream.img;
        const icon = isLoading ? '<div class="amp-loading"></div>' : (isPlaying ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<path d="M8 5v14l11-7z"/>');
        playerEl.querySelector('.amp-play').innerHTML = isLoading ? icon : `<svg viewBox="0 0 24 24">${icon}</svg>`;
    }

    function show() {
        if (!playerEl) createPlayer();
        playerEl.classList.add('show');
        requestAnimationFrame(() => playerEl.classList.add('visible'));
        updateUI();
    }

    function hide() {
        if (!playerEl) return;
        playerEl.classList.remove('visible');
        setTimeout(() => playerEl.classList.remove('show'), 400);
    }

    async function play(streamName) {
        if (!audio) {
            audio = new Audio();
            audio.volume = 0.8;
            audio.addEventListener('playing', () => { isPlaying = true; isLoading = false; saveState(); updateUI(); dispatchEvent(); });
            audio.addEventListener('pause', () => { isPlaying = false; saveState(); updateUI(); dispatchEvent(); });
            audio.addEventListener('waiting', () => { isLoading = true; updateUI(); });
            audio.addEventListener('ended', () => { if (currentStream === 'amritvela') playNext(); });
            audio.addEventListener('error', () => { isLoading = false; isPlaying = false; updateUI(); setTimeout(() => play(currentStream), 3000); });
        }
        currentStream = streamName;
        const stream = STREAMS[streamName];
        if (stream.type === 'live') {
            // CRITICAL FIX: Add cache buster AND force seek to live edge
            audio.src = stream.url + '?t=' + Date.now();
            audio.load();
            // Set currentTime to very high value to force seek to live edge
            // This drops old buffer and reconnects at current live position
            audio.currentTime = 999999;
        } else {
            const pos = getAmritvelaPos();
            audio.src = `https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev/day-${pos.trackIndex + 1}.webm?t=${Date.now()}`;
        }
        audio.load();
        isLoading = true;
        show();
        audio.play().catch(() => { isLoading = false; updateUI(); });
        saveState();
    }

    function playNext() {
        if (!audio || currentStream !== 'amritvela') return;
        const pos = getAmritvelaPos();
        audio.src = `https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev/day-${pos.trackIndex + 1}.webm?t=${Date.now()}`;
        audio.play().catch(() => {});
    }

    function pause() { if (audio) audio.pause(); }

    function toggle() { isPlaying ? pause() : currentStream && play(currentStream); }

    function stop() {
        if (audio) { audio.pause(); audio.src = ''; }
        isPlaying = false; isLoading = false; currentStream = null;
        hide();
        localStorage.removeItem(STATE_KEY);
    }

    function dispatchEvent() {
        window.dispatchEvent(new CustomEvent('anhadAudioStateChange', { detail: { isPlaying, stream: currentStream } }));
    }

    function resume() {
        const state = loadState();
        if (state && state.isPlaying && state.stream && Date.now() - state.timestamp < 1800000) {
            play(state.stream);
        }
    }

    injectCSS();
    window.AnhadMiniPlayer = { play, pause, toggle, stop, isPlaying: () => isPlaying, getStream: () => currentStream };
    window.addEventListener('anhadRequestPlay', (e) => { const s = e.detail?.stream; if (s) play(s); });
    setTimeout(resume, 500);
})();
