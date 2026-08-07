/**
 * ============================================
 * DAILY HUKAMNAMA - REBUILT V3
 * Pure JavaScript Module with Dynamic Guru Portraits
 * Premium iOS 18+ Inspired UX
 * ============================================
 */

'use strict';

(function() {
    const CONFIG = {
        API_BASE: 'https://api.banidb.com/v2',
        ENDPOINTS: {
            TODAY: '/hukamnamas/today',
            BY_DATE: '/hukamnamas/{year}/{month}/{day}'
        },
        GURU_MAP: {
            1: { file: 'gurunanakdevsahebji.jpeg', name: 'Sri Guru Nanak Dev Sahib Ji' },
            2: { file: 'guruangaddevsahebji.jpeg', name: 'Sri Guru Angad Dev Sahib Ji' },
            3: { file: 'guruamardasji.jpeg', name: 'Sri Guru Amar Das Sahib Ji' },
            4: { file: 'gururamdassahebji.jpeg', name: 'Sri Guru Ram Das Sahib Ji' },
            5: { file: 'guruarjanddevsahebji.jpeg', name: 'Sri Guru Arjan Dev Sahib Ji' },
            6: { file: 'guruhargobindsahebji.jpeg', name: 'Sri Guru Hargobind Sahib Ji' },
            7: { file: 'guruharraisahebji.jpeg', name: 'Sri Guru Har Rai Sahib Ji' },
            8: { file: 'guruharkrishansahebji.jpeg', name: 'Sri Guru Har Krishan Sahib Ji' },
            9: { file: 'gurutegbahadursahebji.jpeg', name: 'Sri Guru Tegh Bahadur Sahib Ji' },
            10: { file: 'gurugobindsinghsahebji.jpeg', name: 'Sri Guru Gobind Singh Sahib Ji' }
        },
        GURU_GRANTH: { file: 'gurugranthsahebji.jpeg', name: 'Sri Guru Granth Sahib Ji' },
        SGPC_HUKAM_AUDIO: 'https://corsproxy.io/?url=http://live.sgpc.net:8443/;nocache=1'
    };

    const FONT_MAP = {
        'riyasti': "Riyasti, RiyastiHastlikhat, 'Noto Sans Gurmukhi', 'Gurmukhi MN', 'AnmolLipi', sans-serif",
        'pg-muskan': "PGMuskan, 'Noto Sans Gurmukhi', 'Gurmukhi MN', 'AnmolLipi', sans-serif",
        'gurbani-akhar': "'Noto Sans Gurmukhi', 'Gurmukhi MN', 'AnmolLipi', sans-serif"
    };

    const state = {
        data: null,
        settings: JSON.parse(localStorage.getItem('anhad_hukam_settings')) || {
            fontSize: 24,
            fontFamily: 'riyasti',
            showTranslit: true,
            showEnglish: true,
            showPunjabi: true
        }
    };

    const elements = {
        skeleton: document.getElementById('skeletonLoader'),
        header: document.getElementById('header'),
        mainScroll: document.getElementById('mainScroll'),
        guruImage: document.getElementById('guruImage'),
        metaDate: document.getElementById('metaDate'),
        metaAng: document.getElementById('metaAng'),
        metaRaag: document.getElementById('metaRaag'),
        metaWriter: document.getElementById('metaWriter'),
        hukamContent: document.getElementById('hukamContent'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsModal: document.getElementById('settingsModal'),
        closeSettings: document.getElementById('closeSettings'),
        fontSizeSlider: document.getElementById('fontSizeSlider'),
        fontSizeDisplay: document.getElementById('fontSizeDisplay'),
        fontFamilySelect: document.getElementById('fontFamilySelect'),
        translitToggle: document.getElementById('translitToggle'),
        englishToggle: document.getElementById('englishToggle'),
        punjabiToggle: document.getElementById('punjabiToggle')
    };

    // ─── INITIALIZATION ──────────────────────────────────────────────────

    async function init() {
        try {
            console.log('🚀 Hukamnama V3 Initializing...');
            
            setupListeners();
            applySettings();
            
            // Safety timeout: hide skeleton after 10s even if fetch hangs
            const safetyTimer = setTimeout(() => {
                console.warn('[Hukamnama] Safety timeout — hiding skeleton loader');
                hideLoader();
            }, 10000);
            
            await fetchHukamnama();
            clearTimeout(safetyTimer);
            
            const hero = document.getElementById('hero');
            if (hero) hero.classList.add('panning');
        } catch (err) {
            console.error('[Hukamnama] Init crashed:', err);
            hideLoader();
            showError();
        }
    }

    function setupListeners() {
        let lastScrollY = 0;
        let scrollDirTimer = null;
        elements.mainScroll.addEventListener('scroll', () => {
            const sy = elements.mainScroll.scrollTop;
            const goingDown = sy > lastScrollY && sy > 80;
            const goingUp = sy < lastScrollY;
            const atTop = sy < 10;

            if (sy > 40) {
                elements.header.classList.add('scrolled');
            } else {
                elements.header.classList.remove('scrolled');
            }

            if (goingDown && !atTop) {
                elements.header.classList.add('hidden-header');
            } else if (goingUp || atTop) {
                elements.header.classList.remove('hidden-header');
            }

            const actionBar = document.getElementById('actionBar');
            if (actionBar && !actionBar.classList.contains('player-open')) {
                if (goingDown && sy > 200) {
                    actionBar.classList.add('hidden-bar');
                } else if (goingUp || atTop || sy < 150) {
                    actionBar.classList.remove('hidden-bar');
                }
            }

            // Progressive hero collapse
            const hero = document.getElementById('hero');
            if (hero) {
                const heroHeight = hero.offsetHeight;
                const collapseDistance = heroHeight * 0.7 || 1;
                const progress = Math.min(1, Math.max(0, sy / collapseDistance));
                hero.style.setProperty('--scroll-progress', progress);
                hero.setAttribute('data-collapsing', 'true');
            }

            lastScrollY = sy;
            clearTimeout(scrollDirTimer);
            scrollDirTimer = setTimeout(() => {
                lastScrollY = sy;
                const hero = document.getElementById('hero');
                if (hero) hero.removeAttribute('data-collapsing');
            }, 100);
        });

        // Settings
        elements.settingsBtn.addEventListener('click', () => {
            hapticFeedback();
            elements.settingsModal.classList.add('active');
        });

        elements.closeSettings.addEventListener('click', () => {
            hapticFeedback();
            elements.settingsModal.classList.remove('active');
        });

        // Audio Buttons — opens the self-contained Hukam player
        const audioBtn = document.getElementById('audioBtn');
        
        const triggerHukam = () => {
            hapticFeedback();
            HukamPlayer.start();
        };

        if (audioBtn) audioBtn.addEventListener('click', triggerHukam);

        // Share Button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                hapticFeedback();
                try {
                    const firstVerse = state.data?.verses?.[0]?.gurmukhi || '';
                    const dateStr = state.data?.date || '';
                    const raagStr = state.data?.raag || '';
                    const writerStr = state.data?.writer || '';
                    const text = `🌸 Daily Hukamnama — ${dateStr}\n${raagStr} • ${writerStr}\n\n${firstVerse}\n\nRead more on ANHAD`;
                    if (navigator.share) {
                        await navigator.share({ title: 'Daily Hukamnama', text });
                    } else {
                        await navigator.clipboard.writeText(text);
                    }
                } catch (e) {}
            });
        }

        // History Button
        const calendarBtn = document.getElementById('calendarBtn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                hapticFeedback();
                window.open('https://sgpc.net/hukamnama-sahib-archives/', '_blank', 'noopener');
            });
        }

        // Reading Mode Toggle
        const readingBtn = document.getElementById('readingBtn');
        const mainScroll = elements.mainScroll;
        if (readingBtn) {
            readingBtn.addEventListener('click', () => {
                hapticFeedback();
                const isActive = mainScroll.classList.toggle('reading-mode');
                readingBtn.classList.toggle('active', isActive);
                if (isActive) {
                    mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        elements.fontSizeSlider.addEventListener('input', (e) => {
            state.settings.fontSize = e.target.value;
            updateDisplay();
            saveSettings();
        });

        elements.fontFamilySelect.addEventListener('change', (e) => {
            state.settings.fontFamily = e.target.value;
            updateDisplay();
            saveSettings();
        });

        [elements.translitToggle, elements.englishToggle, elements.punjabiToggle].forEach(el => {
            el.addEventListener('change', () => {
                state.settings.showTranslit = elements.translitToggle.checked;
                state.settings.showEnglish = elements.englishToggle.checked;
                state.settings.showPunjabi = elements.punjabiToggle.checked;
                updateDisplay();
                saveSettings();
            });
        });

        // Theme Pills
        const themePills = document.querySelectorAll('.theme-pill');
        themePills.forEach(pill => {
            pill.addEventListener('click', () => {
                hapticFeedback();
                const val = pill.getAttribute('data-theme-val');
                setAppTheme(val);
                updateThemePills(val);
            });
        });
    }

    // ─── HUKAMNAMA AUDIO PLAYER ───────────────────────────────────────────────
    // Self-contained player — does NOT use the global AnhadAudio kirtan singleton.
    const HukamPlayer = {
        audio: null,

        // Audio URL priority:
        // 1. Our own backend proxy (scrapes SGPC page, bypasses CORS) — most reliable
        // 2. Direct SGPC patterns as fallbacks when backend unreachable
        getUrls() {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');

            // Resolve the backend base URL (same logic as AnhadAudio singleton)
            const host = window.location.hostname;
            const port = window.location.port;
            let apiBase;
            try {
                // Capacitor app detection
                if (window.Capacitor) {
                    apiBase = 'https://anhad-final.onrender.com';
                } else if (port === '3000' || port === '3001') {
                    apiBase = '';
                } else if (host === 'localhost' || host === '127.0.0.1') {
                    apiBase = 'http://localhost:3000';
                } else if (host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                    apiBase = `http://${host}:3000`;
                } else {
                    apiBase = 'https://anhad-final.onrender.com';
                }
            } catch (e) {
                apiBase = 'https://anhad-final.onrender.com';
            }

            const isCapacitor = !!(window.Capacitor);
            const sgpcDateUrl = `https://www.sgpc.net/hukamnama/${y}/${m}/${day}/hukamnama.mp3`;

            const urls = [
                `${apiBase}/api/hukamnama/audio`,  // ✅ Backend proxy (primary)
                sgpcDateUrl,
                `https://www.sgpc.net/hukamnama/hukamnama.mp3`,
            ];

            // Capacitor: add CORS proxy fallback for SGPC URLs
            if (isCapacitor) {
                urls.push(
                    `https://corsproxy.io/?${encodeURIComponent(sgpcDateUrl)}`,
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(sgpcDateUrl)}`
                );
            }

            return urls;
        },

        init() {
            // Create audio element lazily - will be initialized in start() with user gesture
            if (!this.audio) {
                this.audio = new Audio();
                this.audio.preload = 'auto';
            }
            // iOS WKWebView / Capacitor: allow inline playback within user gesture
            this.audio.setAttribute('playsinline', '');
            this.audio.setAttribute('webkit-playsinline', '');

            // Play/Pause button in the mini player
            document.getElementById('hukamPlayBtn')?.addEventListener('click', async () => {
                hapticFeedback();
                if (this.audio.paused) {
                    // AUTOPLAY FIX: If no src set, initialize audio in this click handler
                    if (!this.audio.src) {
                        await this.start();
                    } else {
                        try {
                            await this.audio.play();
                        } catch (e) {
                            console.error('[HukamPlayer] Play failed:', e);
                        }
                    }
                } else {
                    this.audio.pause();
                }
            });

            // Close button
            document.getElementById('hukamCloseBtn')?.addEventListener('click', () => {
                hapticFeedback();
                this.stop();
            });

            // Seek on progress bar click
            document.getElementById('hukamProgressTrack')?.addEventListener('click', (e) => {
                if (!this.audio.duration) return;
                const rect = document.getElementById('hukamProgressTrack').getBoundingClientRect();
                this.audio.currentTime = ((e.clientX - rect.left) / rect.width) * this.audio.duration;
            });

            // Audio events
            this.audio.addEventListener('play',        () => this.onPlay());
            this.audio.addEventListener('pause',       () => this.onPause());
            this.audio.addEventListener('timeupdate',  () => this.onTimeUpdate());
            this.audio.addEventListener('loadedmetadata', () => this.onMeta());
            this.audio.addEventListener('ended',       () => this.onEnded());
            this.audio.addEventListener('waiting',     () => this.setWave(true));
            this.audio.addEventListener('canplay',     () => this.setWave(false));
            this.audio.addEventListener('error', (e) => {
                console.error('[HukamPlayer] Audio error:', e);
                this.setWave(false);
            });
        },

        async start() {
            // AUTOPLAY FIX: Always initialize audio in the context of a user gesture
            if (!this.audio) {
                this.audio = new Audio();
                this.audio.preload = 'auto';
                this.init();
            }

            // If already showing and audio exists, just toggle play/pause
            const player = document.getElementById('hukamPlayer');
            if (player?.classList.contains('visible') && this.audio.src) {
                if (this.audio.paused) {
                    try { await this.audio.play(); } catch (e) { console.error('[HukamPlayer] Resume play failed:', e); }
                } else {
                    this.audio.pause();
                }
                return;
            }

            this.showPlayer();
            this.setWave(true);
            this.setSub('Loading Hukamnama...');

            const urls = this.getUrls();
            const isCapacitor = !!(window.Capacitor);

            // Capacitor (WKWebView): try all URLs synchronously within gesture context
            // by skipping await between attempts — set src & fire play() on each, then
            // track which one succeeds first.
            if (isCapacitor) {
                const results = await Promise.any(urls.map(url => new Promise(async (resolve, reject) => {
                    try {
                        const a = new Audio();
                        a.setAttribute('playsinline', '');
                        a.setAttribute('webkit-playsinline', '');
                        a.preload = 'auto';
                        a.src = url;
                        a.load();
                        await a.play();
                        // Success — replace our audio element with this working one
                        if (this.audio) { this.audio.pause(); this.audio.src = ''; }
                        this.audio = a;
                        this.init(); // re-attach listeners to the new element
                        resolve(url);
                    } catch (e) {
                        reject(e);
                    }
                }))).catch(() => null);

                if (results) {
                    console.log('[HukamPlayer] ✅ Capacitor success with URL:', results);
                    this.setSub('Sachkhand Sri Harmandir Sahib');
                    this.setWave(false);
                    return;
                }
            } else {
                // Browser: sequential attempts (safer for non-Capacitor)
                for (const url of urls) {
                    try {
                        this.audio.src = url;
                        this.audio.load();
                        await this.audio.play();
                        console.log('[HukamPlayer] ✅ Success with URL:', url);
                        this.setSub('Sachkhand Sri Harmandir Sahib');
                        this.setWave(false);
                        return;
                    } catch (e) {
                        console.warn('[HukamPlayer] ❌ URL failed:', url, e.message);
                    }
                }
            }

            // All URLs failed
            this.setWave(false);
            this.setSub('Tap here to listen on SGPC →');
            const subEl = document.getElementById('hukamPlayerSub');
            if (subEl) {
                subEl.style.cursor = 'pointer';
                subEl.onclick = () => {
                    window.open('https://sgpc.net/hukamnama-sahib/', '_blank', 'noopener');
                };
            }
        },

        stop() {
            this.audio.pause();
            this.audio.src = '';
            document.getElementById('hukamPlayer')?.classList.remove('visible');
            document.getElementById('actionBar')?.classList.remove('player-open');
            document.getElementById('hukamProgressFill').style.width = '0%';
            document.getElementById('hukamCurrent').textContent = '0:00';
            document.getElementById('hukamDuration').textContent = '--:--';
        },

        showPlayer() {
            document.getElementById('hukamPlayer')?.classList.add('visible');
            document.getElementById('actionBar')?.classList.add('player-open');
        },

        setWave(active) {
            const wave = document.getElementById('hukamWave');
            if (!wave) return;
            wave.querySelectorAll('span').forEach(s => {
                s.style.animationPlayState = active ? 'running' : 'paused';
            });
            wave.style.opacity = active ? '1' : '0.4';
        },

        setSub(text) {
            const sub = document.getElementById('hukamPlayerSub');
            if (sub) { sub.textContent = text; sub.style.cursor = ''; sub.onclick = null; }
        },

        setPlayState(playing) {
            const pauseIcon = document.getElementById('hukamPauseIcon');
            const playIcon  = document.getElementById('hukamPlayIcon');
            if (pauseIcon) pauseIcon.style.display = playing ? ''     : 'none';
            if (playIcon)  playIcon.style.display  = playing ? 'none' : '';
            this.setWave(playing);
        },

        onPlay()  { this.setPlayState(true);  this.setSub('Sachkhand Sri Harmandir Sahib'); },
        onPause() { this.setPlayState(false); },
        onEnded() {
            this.setPlayState(false);
            document.getElementById('hukamProgressFill').style.width = '0%';
            document.getElementById('hukamCurrent').textContent = '0:00';
        },
        onMeta() {
            const dur = document.getElementById('hukamDuration');
            if (dur) dur.textContent = this.fmt(this.audio.duration);
        },
        onTimeUpdate() {
            const el = document.getElementById('hukamCurrent');
            const fill = document.getElementById('hukamProgressFill');
            if (el) el.textContent = this.fmt(this.audio.currentTime);
            if (fill && this.audio.duration) {
                fill.style.width = (this.audio.currentTime / this.audio.duration * 100) + '%';
            }
        },
        fmt(s) {
            if (!isFinite(s)) return '--:--';
            const m = Math.floor(s / 60);
            return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
        }
    };

    function setAppTheme(theme) {
        localStorage.setItem('anhad_theme', theme);
        let effectiveTheme = theme;
        if (theme === 'auto') {
            const hour = new Date().getHours();
            effectiveTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
        }
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Notify other components if needed
        window.dispatchEvent(new CustomEvent('anhadThemeChanged', { detail: { theme, effectiveTheme } }));
    }

    function updateThemePills(activeTheme) {
        const themePills = document.querySelectorAll('.theme-pill');
        themePills.forEach(pill => {
            if (pill.getAttribute('data-theme-val') === activeTheme) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
    }

    // ─── DATA FETCHING ───────────────────────────────────────────────────

    async function fetchHukamnama() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.TODAY}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (data && data.shabads) {
                state.data = processHukamnama(data);
                renderHukamnama();
                hideLoader();
            } else {
                throw new Error('Invalid Hukamnama data');
            }
        } catch (error) {
            console.error('❌ Hukamnama Fetch Failed:', error);
            showError();
        }
    }

    function processHukamnama(data) {
        const shabad = data.shabads[0];
        const info = shabad.shabadInfo;
        
        return {
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
            ang: info.pageNo,
            raag: info.raag.english,
            writer: info.writer.english,
            writerId: info.writer.writerId,
            verses: shabad.verses.map(v => ({
                gurmukhi: v.verse.unicode,
                translit: v.transliteration?.en || '',
                english: extractText(v.translation?.en),
                punjabi: extractPunjabiText(v.translation?.pu)
            }))
        };
    }

    function extractText(data) {
        if (!data) return '';
        if (typeof data === 'string') return data;
        if (data.unicode) return data.unicode;
        if (data.text) return data.text;
        
        // If it's an object with multiple interpretations (e.g. { "1": "text" }), get the first one
        const keys = Object.keys(data);
        if (keys.length > 0) {
            const first = data[keys[0]];
            if (!first) return '';
            return typeof first === 'string' ? first : (first.unicode || first.text || '');
        }
        return '';
    }

    function extractPunjabiText(pu) {
        if (!pu) return '';
        if (typeof pu === 'string') return pu;
        
        // Priority: Shiromani Committee/Sahib Singh (ss) -> Manmohan Singh (ms) -> BaniDB (bdb) -> Faridkot Teeka (ft)
        const priority = ['ss', 'ms', 'bdb', 'ft'];
        for (const source of priority) {
            const translation = pu[source];
            if (translation) {
                const text = typeof translation === 'string' ? translation : (translation.unicode || translation.text);
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            }
        }
        
        // Fallback to any other key
        for (const key in pu) {
            const translation = pu[key];
            if (translation) {
                const text = typeof translation === 'string' ? translation : (translation.unicode || translation.text);
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            }
        }
        
        return '';
    }

    // ─── RENDERING ───────────────────────────────────────────────────────

    function renderHukamnama() {
        const d = state.data;
        
        // Update Meta
        if (elements.metaDate) elements.metaDate.textContent = d.date;
        elements.metaAng.textContent = d.ang;
        elements.metaRaag.textContent = d.raag;
        elements.metaWriter.textContent = d.writer;

        // Update Guru Image
        updateGuruImage(d.writerId, d.writer);

        // Render Content with staggered animation
        elements.hukamContent.innerHTML = d.verses.map((v, i) => {
            const delay = Math.min(i * 60, 400);
            return `
            <div class="verse-block" style="animation-delay:${delay}ms">
                <div class="verse-gurmukhi">${v.gurmukhi}</div>
                ${state.settings.showTranslit && v.translit ? `<div class="verse-translit">${v.translit}</div>` : ''}
                ${state.settings.showEnglish && v.english ? `<div class="verse-translation">${v.english}</div>` : ''}
                ${state.settings.showPunjabi && v.punjabi ? `<div class="verse-punjabi">${v.punjabi}</div>` : ''}
            </div>`;
        }).join('');

        updateDisplay();

        // Trigger hero entrance animation
        const heroEl = document.getElementById('hero');
        if (heroEl) heroEl.classList.add('entered');
    }

    function updateGuruImage(writerId, writerName) {
        let guruData = CONFIG.GURU_GRANTH;
        const name = writerName.toLowerCase();
        
        if (CONFIG.GURU_MAP[writerId]) {
            guruData = CONFIG.GURU_MAP[writerId];
        } else if (name.includes('nanak') || name.includes('mahala 1')) guruData = CONFIG.GURU_MAP[1];
        else if (name.includes('angad') || name.includes('mahala 2')) guruData = CONFIG.GURU_MAP[2];
        else if (name.includes('amar') || name.includes('mahala 3')) guruData = CONFIG.GURU_MAP[3];
        else if (name.includes('ram') || name.includes('mahala 4')) guruData = CONFIG.GURU_MAP[4];
        else if (name.includes('arjan') || name.includes('mahala 5')) guruData = CONFIG.GURU_MAP[5];
        else if (name.includes('hargobind') || name.includes('mahala 6')) guruData = CONFIG.GURU_MAP[6];
        else if (name.includes('rai') || name.includes('mahala 7')) guruData = CONFIG.GURU_MAP[7];
        else if (name.includes('krishan') || name.includes('mahala 8')) guruData = CONFIG.GURU_MAP[8];
        else if (name.includes('teg') || name.includes('mahala 9')) guruData = CONFIG.GURU_MAP[9];
        else if (name.includes('gobind') || name.includes('mahala 10')) guruData = CONFIG.GURU_MAP[10];

        const newSrc = `../guruimages/${guruData.file}`;
        
        // Preload the image before updating to prevent visible loading delay
        const preloadImg = new Image();
        preloadImg.fetchpriority = 'high';
        preloadImg.onload = () => {
            elements.guruImage.src = newSrc;
        };
        preloadImg.onerror = () => {
            // If new image fails to load, keep the default
            console.warn('[Hukamnama] Failed to load guru image:', newSrc);
        };
        preloadImg.src = newSrc;
        
        const nameDisplay = document.getElementById('guruNameDisplay');
        if (nameDisplay) nameDisplay.textContent = guruData.name;
    }

    function hapticFeedback() {
        if (navigator.vibrate) navigator.vibrate(10);
    }

    function updateDisplay() {
        const fontKey = state.settings.fontFamily || 'riyasti';
        if (elements.fontFamilySelect) elements.fontFamilySelect.value = fontKey;
        elements.fontSizeDisplay.textContent = `${state.settings.fontSize}px`;
        
        if (state.data) {
            const d = state.data;
            elements.hukamContent.innerHTML = d.verses.map((v, i) => {
                const delay = Math.min(i * 60, 400);
                return `
                <div class="verse-block" style="animation-delay:${delay}ms">
                    <div class="verse-gurmukhi" style="font-size: ${state.settings.fontSize}px">${v.gurmukhi}</div>
                    ${state.settings.showTranslit && v.translit ? `<div class="verse-translit">${v.translit}</div>` : ''}
                    ${state.settings.showEnglish && v.english ? `<div class="verse-translation">${v.english}</div>` : ''}
                    ${state.settings.showPunjabi && v.punjabi ? `<div class="verse-punjabi">${v.punjabi}</div>` : ''}
                </div>`;
            }).join('');
        }
        
        // Apply font class to override default hardcoded font-family
        document.querySelectorAll('.verse-gurmukhi').forEach(v => {
            v.classList.remove('font-riyasti', 'font-pg-muskan', 'font-gurbani-akhar');
            v.classList.add(`font-${fontKey}`);
            v.style.fontSize = `${state.settings.fontSize}px`;
        });
    }

    // ─── UI HELPERS ──────────────────────────────────────────────────────

    function hideLoader() {
        if (elements.skeleton) {
            elements.skeleton.style.opacity = '0';
            setTimeout(() => elements.skeleton.classList.add('hidden'), 500);
        }
    }

    function showError() {
        hideLoader();
        elements.hukamContent.innerHTML = `
            <div style="text-align:center;padding:80px 24px;">
                <div style="font-size:2.5rem;margin-bottom:20px;">🙏</div>
                <p style="color:var(--text-secondary);margin-bottom:8px;font-size:1rem;">Unable to load Hukamnama</p>
                <p style="color:var(--text-tertiary);font-size:0.85rem;margin-bottom:24px;">Please check your connection and try again.</p>
                <button onclick="window.location.reload()" style="background:var(--accent,#C9A84C);border:none;padding:10px 28px;border-radius:20px;font-weight:500;font-size:0.9rem;color:#000;cursor:pointer;">Retry</button>
            </div>
        `;
    }

    function applySettings() {
        elements.fontSizeSlider.value = state.settings.fontSize;
        if (elements.fontFamilySelect) elements.fontFamilySelect.value = state.settings.fontFamily;
        elements.translitToggle.checked = state.settings.showTranslit;
        elements.englishToggle.checked = state.settings.showEnglish;
        elements.punjabiToggle.checked = state.settings.showPunjabi;
        
        const fontKey = state.settings.fontFamily || 'riyasti';
        document.querySelectorAll('.verse-gurmukhi').forEach(v => {
            v.classList.remove('font-riyasti', 'font-pg-muskan', 'font-gurbani-akhar');
            v.classList.add(`font-${fontKey}`);
        });
        
        const theme = localStorage.getItem('anhad_theme') || 'auto';
        setAppTheme(theme);
        updateThemePills(theme);
    }

    function saveSettings() {
        localStorage.setItem('anhad_hukam_settings', JSON.stringify(state.settings));
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();