/* ═══════════════════════════════════════════════════════════════════════════
   GURBANI RADIO — Complete Audio Engine v3.0
   Real audio playback · Virtual-live server sync · Mini-player bridge
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── CONFIG ────────────────────────────────────────────────────────────────

    const API_BASE = (() => {
        try {
            if (window.Capacitor) return 'https://anhad-final.onrender.com';
            const port = window.location.port;
            if (port === '3000' || port === '3001') return '';
            const host = window.location.hostname;
            if (host.match(/^[0-9]+(\.[0-9]+){3}$/)) return `http://${host}:3000`;
            return 'https://anhad-final.onrender.com';
        } catch (e) { return 'https://anhad-final.onrender.com'; }
    })();

    const R2_BASE = 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
    const SIMRAN_R2_BASE = 'https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev';
    const SIMRAN_R2_PREFIX = 'waheguru';
    const STATE_KEY = 'anhad_global_audio';
    const SIMRAN_FILENAMES = [
        '01 - DEENANATH SUNO WAHEGURU SIMRAN DAY 1.mp3',
        '02 - TUM KARO DAYA WAHEGURU SIMRAIN DAY 2.mp3',
        '03 - SUNN YAAR HAMARE SAJAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '04 - SUKH NAAHI RE HAR BHAGAT BINA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '05 - TU PRABH DATA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '06 - SATNAM WAHEGURU - SIMRAN - AMRITVELA TRUST..mp3',
        '07 - MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '08 - RAKHWALA SIMRAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '09 - AAS PYAASI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '10 - PRABH PAAS JAN KI ARDAS - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '11 - TU HI TU HI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '12 - NAAM NAAM NAAM APNA NAAM DEHO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '13 - DHAN GURU RAMDAS JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '14 - AAO SAJANA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '15 - TUJ BIN KAVAN HAMARA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '16 - MERA BAID GURU GOVINDA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '17 - JAGAN TE SUPNA BHALA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '18 - EH NEECH KARAM HAR MERE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '19 - APNA NAAM JAPAO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '20 - MERE PYAARE SATUGURU JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '21 - RAKH LEHO BHAGWAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '22 - KAB GAL LAVENGE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '23 - MERE RAM MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '24 - RAKHEYA KARO SIMRAN DAY 25.mp3',
        '25 - WAHEGURU SIMRAN UTH NAAM JAP AMRITVELA TRUST BEST SIMRAN.mp3',
        '26 - BEST WAHEGURU SIMRAN DAY 27 CHALIYA 2020.mp3',
        '27 - KAD NANAK AAVE VARI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '28 - BIN GUR NA PAVAIGO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '29 - KIYO SHINGAR MILAN KE TAAYEE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '30 - NAAM BINA NAHI JEEVIA JAYE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '31 - AATH PEHAR SIMRO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '32 - MIL MERE PREETMA JEEO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '33 - SATNAM SHRI WAHEGURU SIMRAN DAY 35 CHALIYA 2020.mp3',
        '34 - RAKH RAKH MERE BEETHLA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '35 - PRAAN ADHAARA RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '36 - DHAN BABA NANAK - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '37 - SUNN MANN MITTAR PYAREYA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
        '38 - MERE SATGUR PYARE GURNANAK AAJA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3',
    ];

    const BG_SLOTS = {
        morning: '../assets/darbar-sahib-morning-bg.webp',
        day: '../assets/darbar-sahib-day-bg.webp',
        evening: '../assets/darbar-sahib-evening-bg.webp',
        night: '../assets/HERO CARD IMAGES/new-night-bg.avif',
    };

    const HERO = '../assets/HERO CARD IMAGES';

    const STREAMS = {
        darbar: {
            name: 'Darbar Sahib Live',
            subtitle: 'Sri Harmandir Sahib Ji',
            url: 'https://live.sgpc.net:8443/;nocache=1',
            type: 'live',
            artwork: `${HERO}/day-darbar-sahib.webp`,
            artworkSlots: {
                morning: `${HERO}/morning-darbar-sahib.webp`,
                day: `${HERO}/day-darbar-sahib.webp`,
                evening: `${HERO}/evening-darbar-sahib.webp`,
                night: `${HERO}/night-darbar-sahib.webp`,
            },
            bgSlots: BG_SLOTS,
            trackTitle: 'Kirtan • Live',
            accent: '#C88010',
        },
        amritvela: {
            name: 'Amritvela Kirtan',
            subtitle: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
            url: null,
            type: 'playlist',
            totalTracks: 40,
            artwork: `${HERO}/day-amritvela-kirtan.webp`,
            artworkSlots: {
                morning: `${HERO}/morning-amritvela-kirtan.webp`,
                day: `${HERO}/day-amritvela-kirtan.webp`,
                evening: `${HERO}/evening-amritvela-kirtan.webp`,
                night: `${HERO}/night-amritvela-kirtan.webp`,
            },
            bgSlots: BG_SLOTS,
            trackTitle: 'Amritvela Kirtan',
            accent: '#B8860B',
            getTrackUrl(idx) {
                const i = ((idx % this.totalTracks) + this.totalTracks) % this.totalTracks + 1;
                return `${R2_BASE}/day-${i}.webm?t=${Date.now()}`;
            }
        },
        simran: {
            name: 'Waheguru Simran',
            subtitle: 'Naam Simran • Virtual Live',
            url: null,
            type: 'simran',
            totalTracks: 38,
            artwork: `${HERO}/day-waheguru-simran.webp`,
            artworkSlots: {
                morning: `${HERO}/morning-waheguru-simran.webp`,
                day: `${HERO}/day-waheguru-simran.webp`,
                evening: `${HERO}/evening-waheguru-simran.webp`,
                night: `${HERO}/night-waheguru-simran.webp`,
            },
            bgSlots: BG_SLOTS,
            trackTitle: 'Waheguru • Waheguru',
            accent: '#8B7355',
            getTrackUrl(idx) {
                const i = ((idx % this.totalTracks) + this.totalTracks) % this.totalTracks;
                const filename = SIMRAN_FILENAMES[i];
                return `${SIMRAN_R2_BASE}/${SIMRAN_R2_PREFIX}/${encodeURIComponent(filename)}`;
            }
        }
    };

    // ─── TIME OF DAY ───────────────────────────────────────────────────────────

    function getSlot() {
        const forced = localStorage.getItem('anhad_forced_time_of_day');
        if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
            console.log('[GR] Using forced time:', forced);
            return forced;
        }
        const h = new Date().getHours();
        console.log('[GR] Current hour:', h);
        if (h >= 5 && h < 9) return 'morning';
        if (h >= 9 && h < 16) return 'day';
        if (h >= 16 && h < 20) return 'evening';
        console.log('[GR] Returning night slot');
        return 'night';
    }

    function syncTimeOfDay() {
        const slot = getSlot();
        const prevSlot = document.documentElement.getAttribute('data-time-of-day');
        console.log('[GR] syncTimeOfDay - current slot:', slot, 'prev slot:', prevSlot);
        if (slot === prevSlot) return;
        console.log('[GR] Time slot changed from', prevSlot, 'to', slot);
        document.documentElement.setAttribute('data-time-of-day', slot);
        updateBg(slot);
        const st = STREAMS[curStream];
        if (st && st.artworkSlots) {
            const artSrc = st.artworkSlots[slot] || st.artwork;
            if (elArtImg) {
                elArtImg.classList.add('xfade');
                setTimeout(() => {
                    elArtImg.src = artSrc + '?v=' + Date.now();
                    elArtImg.classList.remove('xfade');
                }, 320);
            }
        }
    }

    // Refresh theme on storage changes from other tabs
    window.addEventListener('storage', e => {
        if (e.key === 'anhad_forced_time_of_day' || e.key === 'anhad_theme') syncTimeOfDay();
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncTimeOfDay();
    });

    // Listen for theme changes from global-theme.js
    document.addEventListener('anhadThemeChanged', () => {
        syncTimeOfDay();
    });
    window.addEventListener('anhadTimeForced', () => {
        syncTimeOfDay();
    });

    // ─── SERVER SYNC ───────────────────────────────────────────────────────────

    let _syncCache = null;
    let _syncCacheAt = 0;
    let _syncStream = null; // which stream the cache is for
    const SYNC_TTL = 4000;
    const EPOCH = 1704067200000; // Jan 1 2024

    async function getServerPos(force = false) {
        // Invalidate cache if stream switched
        if (_syncStream !== curStream) {
            _syncCache = null;
            _syncStream = curStream;
        }
        if (!force && _syncCache && (Date.now() - _syncCacheAt) < SYNC_TTL) {
            const drift = (Date.now() - _syncCacheAt) / 1000;
            return { trackIndex: _syncCache.trackIndex, position: _syncCache.position + drift, trackFilename: _syncCache.trackFilename };
        }
        try {
            const t0 = Date.now();
            const apiPath = curStream === 'simran' ? '/api/simran/live' : '/api/radio/live';
            const res = await fetch(`${API_BASE}${apiPath}?t=${Date.now()}&r=${Math.random()}`,
                { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            const t1 = Date.now();
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const latency = (t1 - t0) / 2000;
            _syncCache = { trackIndex: data.trackIndex, position: data.trackPosition + latency, trackFilename: data.trackFilename };
            _syncCacheAt = Date.now();
            _syncStream = curStream;
            return { ..._syncCache };
        } catch (e) {
            return localPos();
        }
    }

    function localPos() {
        const isSimran = curStream === 'simran';
        const totalTracks = isSimran ? 38 : 40;
        const trackDuration = isSimran ? 600 : 3600; // Simran tracks ~10min, Amritvela ~1hr
        const total = totalTracks * trackDuration;
        const elapsed = (Date.now() - EPOCH) / 1000;
        const pos = ((elapsed % total) + total) % total;
        return { trackIndex: Math.floor(pos / trackDuration), position: pos % trackDuration, trackFilename: isSimran ? SIMRAN_FILENAMES[Math.floor(pos / trackDuration) % 38] : undefined };
    }

    // ─── STATE ─────────────────────────────────────────────────────────────────

    // All audio state managed by window.AnhadAudio singleton
    // Radio Page subscribes to master state for perfect synchronization (Category 3 fix)
    let curStream = 'darbar'; // Local UI-only state for stream selection display
    let sleepTimer = null;
    let sleepEnd = 0;
    let sleepTick = null;

    // ─── DOM REFS ──────────────────────────────────────────────────────────────

    const $ = id => document.getElementById(id);

    const elPlayer = $('player');
    const elBtnDarbar = $('btnDarbar');
    const elBtnAmrit = $('btnAmritvela');
    const elBtnSimran = $('btnSimran');
    const elPill = $('streamPill');
    const elArtwork = $('artworkCard');
    const elArtImg = $('artworkImg');
    const elArtGlow = $('artworkGlow');
    const elTitle = $('trackTitle');
    const elArtist = $('trackArtist');
    const elSub = $('trackSubtitle');
    const elMiniEq = $('miniEq');
    const elPlayBtn = $('playBtn');
    const elPlayIcon = $('playIcon');
    const elPrevBtn = $('prevBtn');
    const elRewindBtn = $('rewindBtn');
    const elNextBtn = $('nextBtn');
    const elForwardBtn = $('forwardBtn');
    const elVolInput = $('volumeInput');
    const elVolFill = $('volumeFill');
    const elProgFill = $('progressFill');
    const elProgKnob = $('progressKnob');
    const elElapsed = $('elapsedTime');
    const elLiveBtn = $('liveBtn');
    const elLiveDot = $('liveDot');
    const elLiveBehind = $('liveBehind');
    const elStatus = $('statusPill');
    const elStatusDot = $('statusDot');
    const elStatusTxt = $('statusText');
    const elErr = $('errToast');
    const elErrTitle = $('errTitle');
    const elErrMsg = $('errMsg');
    const elConn = $('connOverlay');
    const elConnStream = $('connStream');
    const elPlSheet = $('plSheet');
    const elSleepSheet = $('sleepSheet');
    const elSleepBubble = $('sleepBubble');
    const elSimSwitch = $('simranSwitch');
    const elSimState = $('simranState');

    // BG layers
    const elBgMorning = $('bgMorning');
    const elBgDay = $('bgDay');
    const elBgEvening = $('bgEvening');
    const elBgNight = $('bgNight');

    // ─── BACKGROUND ENGINE ─────────────────────────────────────────────────────

    const BG_ELS = { morning: elBgMorning, day: elBgDay, evening: elBgEvening, night: elBgNight };

    function updateBg(slot) {
        console.log('[GR] updateBg called with slot:', slot);
        Object.entries(BG_ELS).forEach(([k, el]) => {
            if (!el) {
                console.log('[GR] Missing element for slot:', k);
                return;
            }
            if (k === slot) {
                el.classList.remove('hidden');
                el.style.opacity = '1';
                el.style.display = 'block';
                console.log('[GR] Showing:', k);
            } else {
                el.classList.add('hidden');
                el.style.opacity = '0';
                console.log('[GR] Hiding:', k);
            }
        });
    }

    // ─── AUDIO ENGINE (DELEGATED TO UNIFIED ANHADAUDIO SINGLETON) ──────────────

    // All audio state is managed by window.AnhadAudio singleton
    // This page subscribes to state changes via event listeners

    async function startStream(name) {
        curStream = name;
        const st = STREAMS[name];
        setConn(true, st.name);

        if (window.AudioCoordinator) window.AudioCoordinator.requestPlay('GurbaniRadioPage');

        try {
            if (window.AnhadAudio) {
                // If it is already playing this stream, don't restart it to avoid audio cut out!
                const grState = window.AnhadAudio.getState();
                if (grState.isPlaying && grState.currentStream === name) {
                    setConn(false);
                    return;
                }
                await window.AnhadAudio.play(name);
            }
        } catch (e) {
            setConn(false);
            updateUI();
        }
    }

    // Dummy advanceTrack mapping (AnhadAudio handles this autonomously)
    async function advanceTrack(keepElement) {
        if (window.AnhadAudio) {
            await window.AnhadAudio.playNextTrack();
        }
    }

    async function togglePlay() {
        if (!window.AnhadAudio) return;
        const gaState = window.AnhadAudio.getState();
        if (!gaState.isPlaying || gaState.currentStream !== curStream) {
            await startStream(curStream);
        } else {
            window.AnhadAudio.pause();
        }
    }

    // Dummy bridgeState mapping (AnhadAudio authoritatively manages global state)
    function bridgeState() { }

    // Dummy updateMediaSession mapping (AnhadAudio manages this globally)
    function updateMediaSession() { }

    // ─── STREAM SWITCHING ──────────────────────────────────────────────────────

    function setStream(name) {
        const st = STREAMS[name];
        curStream = name;
        const slot = getSlot();

        // Update segmented switcher
        [elBtnDarbar, elBtnAmrit, elBtnSimran].forEach(b =>
            b.classList.toggle('active', b.dataset.stream === name));
        if (elPill) elPill.className = 'stream-pill ' + name;

        // Accent
        if (elPlayer) elPlayer.dataset.stream = name;

        // Artwork crossfade — use time-of-day slot
        const artSrc = (st.artworkSlots && st.artworkSlots[slot]) || st.artwork;
        if (elArtImg) {
            elArtImg.classList.add('xfade');
            setTimeout(() => {
                elArtImg.src = artSrc + '?v=' + Date.now();
                elArtImg.classList.remove('xfade');
            }, 320);
        }
        if (elArtGlow) elArtGlow.style.background =
            `radial-gradient(circle, ${st.accent}66, transparent 70%)`;

        // Track info
        if (elTitle) elTitle.textContent = st.trackTitle || st.name;
        if (elArtist) elArtist.textContent = st.name;
        if (elSub) elSub.textContent = st.subtitle;

        // Background — use current time of day
        updateBg(slot);

        // Progress reset for live
        if (st.type === 'live') {
            if (elProgFill) elProgFill.style.width = '0%';
            if (elProgKnob) elProgKnob.style.left = '0%';
            if (elElapsed) elElapsed.textContent = '∞';
        }
        // Reset live badge state
        setLiveSynced(true);
        updateSeekButtons();
    }

    // ─── PLAY STATE UI ─────────────────────────────────────────────────────────

    function updateUI() {
        if (!elPlayBtn || !elPlayIcon) return;

        // Read playing state from AnhadAudio singleton
        const state = window.AnhadAudio ? window.AnhadAudio.getState() : {};
        const playing = state.isPlaying || false;

        if (playing) {
            elPlayBtn.classList.remove('paused');
            elPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
            elArtwork?.classList.add('playing');
            elMiniEq?.classList.add('playing');
            elArtGlow?.classList.add('pulse');
        } else {
            elPlayBtn.classList.add('paused');
            elPlayIcon.innerHTML = '<polygon points="6,4 20,12 6,20" fill="currentColor"/>';
            elArtwork?.classList.remove('playing');
            elMiniEq?.classList.remove('playing');
            elArtGlow?.classList.remove('pulse');
        }
    }

    // ─── CONNECT OVERLAY ───────────────────────────────────────────────────────

    function setConn(show, name) {
        if (elPlayBtn) {
            elPlayBtn.classList.toggle('loading', show);
        }
        if (elConn) {
            elConn.classList.toggle('show', false);
        }
    }

    function setLiveSynced(isSynced) {
        if (!elLiveBtn || !elLiveDot) return;
        if (isSynced) {
            elLiveBtn.classList.remove('behind');
            elLiveBtn.classList.add('synced');
            elLiveDot.classList.remove('pulsing');
            if (elLiveBehind) elLiveBehind.textContent = '';
        } else {
            elLiveBtn.classList.add('behind');
            elLiveBtn.classList.remove('synced');
            elLiveDot.classList.add('pulsing');
            if (elLiveBehind) {
                // Read from AnhadAudio singleton instead of local state
                const state = window.AnhadAudio ? window.AnhadAudio.getState() : {};
                const curTrack = state.currentTrackIndex || 0;
                const audioCurrentTime = state.currentTime || 0;
                
                // Compute total drift from live edge
                const liveNow = localPos();
                let diff = 0;
                if (curTrack === liveNow.trackIndex) {
                    diff = Math.round(liveNow.position - audioCurrentTime);
                } else {
                    const dur = curStream === 'simran' ? 600 : 3600;
                    diff = Math.round((liveNow.trackIndex - curTrack) * dur + liveNow.position - audioCurrentTime);
                }
                // Show as -Xs or -Xm — YouTube-style
                if (diff > 0) {
                    if (diff < 60) elLiveBehind.textContent = `-${diff}s`;
                    else elLiveBehind.textContent = `-${Math.floor(diff / 60)}m${diff % 60 > 0 ? (diff % 60) + 's' : ''}`;
                } else {
                    elLiveBehind.textContent = '';
                    // We're actually ahead — that means synced
                    setLiveSynced(true);
                }
            }
        }
    }

    function updateSeekButtons() {
        const st = STREAMS[curStream];
        const isLiveStream = st && st.type === 'live';
        if (elRewindBtn) {
            elRewindBtn.disabled = isLiveStream;
            elRewindBtn.style.opacity = isLiveStream ? '0.35' : '1';
            elRewindBtn.style.pointerEvents = isLiveStream ? 'none' : 'auto';
        }
        if (elForwardBtn) {
            elForwardBtn.disabled = isLiveStream;
            elForwardBtn.style.opacity = isLiveStream ? '0.35' : '1';
            elForwardBtn.style.pointerEvents = isLiveStream ? 'none' : 'auto';
        }
        if (elPrevBtn) {
            elPrevBtn.disabled = isLiveStream;
            elPrevBtn.style.opacity = isLiveStream ? '0.35' : '1';
            elPrevBtn.style.pointerEvents = isLiveStream ? 'none' : 'auto';
        }
    }

    // ─── STATUS PILL ───────────────────────────────────────────────────────────

    function showStatus(msg, isErr) {
        if (!elStatus) return;
        elStatusTxt.textContent = msg;
        elStatusDot.classList.toggle('error', !!isErr);
        elStatus.classList.add('show');
        clearTimeout(elStatus._t);
        elStatus._t = setTimeout(() => elStatus.classList.remove('show'), 2600);
    }

    // ─── ERROR TOAST ───────────────────────────────────────────────────────────

    function showErr(title, msg) {
        if (!elErr) return;
        elErrTitle.textContent = title;
        elErrMsg.textContent = msg;
        elErr.classList.add('show');
        clearTimeout(elErr._t);
        elErr._t = setTimeout(() => elErr.classList.remove('show'), 5500);
    }

    // ─── SLEEP TIMER ───────────────────────────────────────────────────────────

    function setSleep(mins) {
        clearTimeout(sleepTimer);
        clearInterval(sleepTick);
        if (!mins) {
            sleepEnd = 0;
            if (elSleepBubble) { elSleepBubble.classList.remove('visible'); elSleepBubble.textContent = ''; }
            return;
        }
        sleepEnd = Date.now() + mins * 60000;
        sleepTimer = setTimeout(() => {
            // Pause through AnhadAudio singleton
            if (window.AnhadAudio) {
                window.AnhadAudio.pause();
            }
            clearInterval(sleepTick);
            if (elSleepBubble) { elSleepBubble.classList.remove('visible'); elSleepBubble.textContent = ''; }
            showStatus('Sleep timer — Goodnight 🙏');
        }, mins * 60000);

        // Countdown bubble
        sleepTick = setInterval(() => {
            const rem = sleepEnd - Date.now();
            if (rem <= 0) { clearInterval(sleepTick); return; }
            const m = Math.ceil(rem / 60000);
            if (elSleepBubble) elSleepBubble.textContent = `Sleep in ${m}m`;
        }, 10000);

        if (elSleepBubble) {
            const m = Math.ceil(mins);
            elSleepBubble.textContent = `Sleep in ${m}m`;
            elSleepBubble.classList.add('visible');
        }
        showStatus(`Sleep timer: ${mins} min`);
    }

    // ─── VOLUME ────────────────────────────────────────────────────────────────

    if (elVolInput) {
        elVolInput.addEventListener('input', function () {
            const v = this.value;
            // Set volume through AnhadAudio singleton
            if (window.AnhadAudio) {
                const audio = window.AnhadAudio.getAudio();
                if (audio) audio.volume = parseFloat(v);
            }
            if (elVolFill) elVolFill.style.width = (v * 100) + '%';
        });
    }

    // ─── CONTROLS ──────────────────────────────────────────────────────────────

    if (elPlayBtn) elPlayBtn.addEventListener('click', () => togglePlay());

    if (elPrevBtn) elPrevBtn.addEventListener('click', () => showStatus('Seeking to previous track'));

    if (elRewindBtn) {
        elRewindBtn.addEventListener('click', () => {
            if (window.AnhadAudio) {
                const audio = window.AnhadAudio.getAudio();
                const state = window.AnhadAudio.getState();
                if (audio && state.currentStream) {
                    audio.currentTime = Math.max(0, audio.currentTime - 10);
                    showStatus('Rewinded 10s');
                }
            }
        });
    }

    if (elForwardBtn) {
        elForwardBtn.addEventListener('click', () => {
            if (window.AnhadAudio) {
                const audio = window.AnhadAudio.getAudio();
                const state = window.AnhadAudio.getState();
                if (audio && state.currentStream) {
                    const dur = audio.duration || 3600;
                    audio.currentTime = Math.min(dur - 2, audio.currentTime + 10);
                    showStatus('Forwarded 10s');
                }
            }
        });
    }

    if (elNextBtn) elNextBtn.addEventListener('click', async () => {
        if (STREAMS[curStream].type !== 'live') {
            await advanceTrack();
            showStatus('Skipped to next track');
        } else {
            showStatus('Live — cannot skip');
        }
    });

    // Stream switcher
    if (elBtnDarbar) elBtnDarbar.addEventListener('click', () => startStream('darbar'));
    if (elBtnAmrit) elBtnAmrit.addEventListener('click', () => startStream('amritvela'));
    if (elBtnSimran) elBtnSimran.addEventListener('click', () => startStream('simran'));

    // (Simran sub-switch removed — no functionality)

    // Live button — seek to current live edge (YouTube-style drift seek, not restart)
    if (elLiveBtn) {
        elLiveBtn.addEventListener('click', async () => {
            if (window.AnhadAudio) {
                await window.AnhadAudio.jumpToLive();
            }
        });
    }

    // Back button
    const elBack = $('backBtn');
    if (elBack) {
        elBack.addEventListener('click', () => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = '../index.html';
        });
    }

    // ─── PLAYLIST SHEET ────────────────────────────────────────────────────────

    const elPlBtn = $('playlistBtn');
    const elPlClose = $('plClose');
    const elPlOver = $('plOverlay');

    function openPl() { if (elPlSheet) elPlSheet.classList.add('show'); }
    function closePl() { if (elPlSheet) elPlSheet.classList.remove('show'); }

    if (elPlBtn) elPlBtn.addEventListener('click', openPl);
    if (elPlClose) elPlClose.addEventListener('click', closePl);
    if (elPlOver) elPlOver.addEventListener('click', closePl);

    // Playlist item clicks
    ['plItemDarbar', 'plItemAmrit', 'plItemSimran'].forEach((id, idx) => {
        const el = $(id);
        if (!el) return;
        const names = ['darbar', 'amritvela', 'simran'];
        el.addEventListener('click', () => { closePl(); startStream(names[idx]); });
    });

    // ─── SLEEP SHEET ───────────────────────────────────────────────────────────

    const elSleepBtn = $('sleepBtn');
    const elSleepClose = $('sleepClose');
    const elSleepOver = $('sleepOverlay');
    const elSleepCancel = $('sleepCancel');

    function openSleep() { if (elSleepSheet) elSleepSheet.classList.add('show'); }
    function closeSleep() { if (elSleepSheet) elSleepSheet.classList.remove('show'); }

    if (elSleepBtn) elSleepBtn.addEventListener('click', openSleep);
    if (elSleepClose) elSleepClose.addEventListener('click', closeSleep);
    if (elSleepOver) elSleepOver.addEventListener('click', closeSleep);
    if (elSleepCancel) elSleepCancel.addEventListener('click', () => { setSleep(0); closeSleep(); });

    document.querySelectorAll('.sleep-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.sleep-opt').forEach(o => o.classList.remove('active-sleep'));
            opt.classList.add('active-sleep');
            setSleep(parseInt(opt.dataset.mins, 10));
            closeSleep();
        });
    });

    // ─── SHARE / FAV ───────────────────────────────────────────────────────────

    const elFavBtn = $('favBtn');
    const elShareBtn = $('shareBtn');
    let isFav = localStorage.getItem('grFav') === '1';

    function updateFav() {
        if (!elFavBtn) return;
        if (isFav) elFavBtn.classList.add('active');
        else elFavBtn.classList.remove('active');
    }
    updateFav();

    if (elFavBtn) {
        elFavBtn.addEventListener('click', () => {
            isFav = !isFav;
            localStorage.setItem('grFav', isFav ? '1' : '0');
            updateFav();
            showStatus(isFav ? 'Added to favourites ♥' : 'Removed from favourites');
            if (navigator.vibrate) navigator.vibrate(30);
        });
    }

    if (elShareBtn) {
        elShareBtn.addEventListener('click', async () => {
            const data = {
                title: 'Gurbani Radio — ANHAD', url: window.location.href,
                text: 'Listen to Live Kirtan & Amritvela 24/7'
            };
            try {
                if (navigator.share) await navigator.share(data);
                else {
                    await navigator.clipboard.writeText(window.location.href);
                    showStatus('Link copied!');
                }
            } catch (e) { if (e.name !== 'AbortError') showStatus('Could not share', true); }
        });
    }

    // ─── ERROR RETRY ───────────────────────────────────────────────────────────

    const elErrRetry = $('errRetry');
    if (elErrRetry) {
        elErrRetry.addEventListener('click', () => {
            elErr.classList.remove('show');
            startStream(curStream);
        });
    }

    // ─── DYNAMIC BG ON INIT ────────────────────────────────────────────────────

    function initBg() {
        const initialSlot = getSlot();
        console.log('[GR] Initial time slot:', initialSlot);
        updateBg(initialSlot);
        syncTimeOfDay();
    }

    // ─── INIT ──────────────────────────────────────────────────────────────────

    function init() {
        initBg();
        setStream('darbar');
        updateUI();

        // ─── QUERY PARAM SEAMLESS REDIRECT ───────────────────────────────────────
        let initialStream = 'darbar';
        let forcePlay = false;

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const queryStream = urlParams.get('stream');
            if (queryStream && ['darbar', 'amritvela', 'simran'].includes(queryStream)) {
                initialStream = queryStream;
                forcePlay = true;
            } else {
                // Pick up from localStorage if GMP was playing
                const saved = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
                if (saved && saved.isPlaying && saved.stream &&
                    (Date.now() - (saved.timestamp || 0)) < 30 * 60000) {
                    initialStream = saved.stream;
                    forcePlay = true;
                }
            }
        } catch (e) { }

        setStream(initialStream);

        // Listen to global singleton state updates
        if (window.AnhadAudio) {
            window.AnhadAudio.on('statechange', (state) => {
                if (state.currentStream) {
                    curStream = state.currentStream;

                    [elBtnDarbar, elBtnAmrit, elBtnSimran].forEach(b => {
                        if (b) b.classList.toggle('active', b.dataset.stream === curStream);
                    });
                    if (elPill) elPill.className = 'stream-pill ' + curStream;
                    if (elPlayer) elPlayer.dataset.stream = curStream;

                    const st = STREAMS[curStream];
                    if (st) {
                        if (elTitle) elTitle.textContent = state.currentTrackTitle || st.trackTitle || st.name;
                        if (elArtist) elArtist.textContent = state.currentTrackArtist || st.name;
                        if (elSub) elSub.textContent = state.streamSubtitle || st.subtitle;

                        const slot = getSlot();
                        const artSrc = (st.artworkSlots && st.artworkSlots[slot]) || state.artwork || st.artwork;
                        if (elArtImg && !elArtImg.src.includes(artSrc)) {
                            elArtImg.classList.add('xfade');
                            setTimeout(() => {
                                elArtImg.src = artSrc + '?v=' + Date.now();
                                elArtImg.classList.remove('xfade');
                            }, 320);
                        }
                        if (elArtGlow) elArtGlow.style.background = `radial-gradient(circle, ${st.accent}66, transparent 70%)`;
                    }
                }

                const activeSt = STREAMS[curStream];
                if (activeSt && activeSt.type === 'live') {
                    if (elProgFill) elProgFill.style.width = '0%';
                    if (elProgKnob) elProgKnob.style.left = '0%';
                    if (elElapsed) elElapsed.textContent = '∞';
                } else {
                    if (state.duration && isFinite(state.duration)) {
                        const pct = Math.min((state.currentTime / state.duration) * 100, 100);
                        if (elProgFill) elProgFill.style.width = pct + '%';
                        if (elProgKnob) elProgKnob.style.left = pct + '%';
                        const s = Math.floor(state.currentTime % 60);
                        const m = Math.floor(state.currentTime / 60);
                        if (elElapsed) elElapsed.textContent = m + ':' + (s < 10 ? '0' : '') + s;
                    }
                }

                setConn(state.isLoading);
                updateUI();

                setLiveSynced(!state.isBehind);
                if (state.isBehind && state.liveOffset) {
                    const diff = Math.round(state.liveOffset);
                    if (elLiveBehind) {
                        if (diff < 60) elLiveBehind.textContent = `-${diff}s`;
                        else elLiveBehind.textContent = `-${Math.floor(diff / 60)}m${diff % 60 > 0 ? (diff % 60) + 's' : ''}`;
                    }
                } else {
                    if (elLiveBehind) elLiveBehind.textContent = '';
                }

                updateSeekButtons();
            });

            // Initialize or sync with currently playing singleton state
            const state = window.AnhadAudio.getState();
            if (state.isPlaying && state.currentStream === initialStream) {
                updateUI();
            } else if (forcePlay) {
                startStream(initialStream);
            } else {
                updateUI();
            }
        } else {
            // Fallback if singleton is not loaded
            if (forcePlay) startStream(initialStream);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Persist on page hide (for GMP continuity)
    window.addEventListener('pagehide', bridgeState);
    window.addEventListener('beforeunload', bridgeState);

})();
