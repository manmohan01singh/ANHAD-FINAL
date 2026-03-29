/* ═══════════════════════════════════════════════════════════════════════════
   CINEMATIC ALARM v4 — PRODUCTION ENGINE
   Canvas sky, smooth momentum drag, audio picker, location themes w/ SVG swap,
   dynamic bonfire, aurora, fireflies, parallax — all at 60fps
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ─── STATE ──────────────────────────────────────────────────────── */
    const S = {
        min: 780, dragging: false, dx0: 0, dm0: 0,
        hint: true, sheet: false, audioSheet: false, locSheet: false,
        velocity: 0, lastDragX: 0, lastDragTime: 0, momentumRaf: null,
        selectedSound: 'audio1', currentLocation: 'desert',
    };

    /* ─── AUDIO FILES ────────────────────────────────────────────────── */
    const AUDIO_FILES = [
        { id: 'audio1', file: 'audio1.mp3', name: 'Waheguru Simran', desc: 'Soft melodic simran', icon: '🕉️' },
        { id: 'audio2', file: 'audio2.mp3', name: 'Amritvela Dhun', desc: 'Peaceful morning raga', icon: '🌅' },
        { id: 'audio3', file: 'audio3.mpeg', name: 'Rehras Sahib', desc: 'Evening prayer melody', icon: '🙏' },
        { id: 'audio4', file: 'audio4.mpeg', name: 'Kirtan Sohila', desc: 'Night prayer harmony', icon: '🌙' },
        { id: 'audio5', file: 'audio5.mpeg', name: 'Asa Di Var', desc: 'Morning congregation', icon: '☀️' },
        { id: 'audio6', file: 'audio6.mpeg', name: 'Anand Sahib', desc: 'Blissful melody', icon: '✨' },
    ];
    let previewAudio = null;

    /* ─── LOCATION THEMES ────────────────────────────────────────────── */
    const LOCATIONS = [
        {
            id: 'desert', name: 'Rajasthan Desert', flag: '🇮🇳', desc: 'Sand dunes & camels',
            landColors: {
                far: [30, 35, 55], mid: [22, 28, 42], near: [38, 40, 55], front: [48, 50, 65],
                farD: [138, 128, 112], midD: [172, 160, 138], nearD: [208, 196, 170], frontD: [240, 230, 208]
            }
        },
        {
            id: 'newyork', name: 'New York', flag: '🇺🇸', desc: 'City skyline',
            landColors: {
                far: [40, 42, 55], mid: [35, 38, 50], near: [50, 52, 62], front: [60, 62, 72],
                farD: [120, 125, 130], midD: [145, 148, 155], nearD: [170, 175, 180], frontD: [195, 200, 205]
            }
        },
        {
            id: 'alps', name: 'Swiss Alps', flag: '🇨🇭', desc: 'Snow-capped peaks',
            landColors: {
                far: [50, 55, 70], mid: [60, 65, 78], near: [85, 90, 100], front: [110, 115, 125],
                farD: [180, 185, 200], midD: [200, 205, 218], nearD: [218, 222, 232], frontD: [235, 238, 245]
            }
        },
        {
            id: 'sahara', name: 'Sahara', flag: '🇲🇦', desc: 'Golden sands',
            landColors: {
                far: [55, 40, 25], mid: [45, 32, 18], near: [70, 55, 35], front: [90, 72, 48],
                farD: [200, 170, 120], midD: [220, 190, 140], nearD: [235, 210, 165], frontD: [248, 230, 185]
            }
        },
        {
            id: 'japan', name: 'Kyoto, Japan', flag: '🇯🇵', desc: 'Cherry blossoms',
            landColors: {
                far: [45, 35, 50], mid: [38, 28, 42], near: [55, 42, 55], front: [68, 55, 68],
                farD: [155, 130, 145], midD: [178, 155, 168], nearD: [200, 178, 192], frontD: [222, 200, 215]
            }
        },
        {
            id: 'iceland', name: 'Iceland', flag: '🇮🇸', desc: 'Northern lights',
            landColors: {
                far: [25, 35, 48], mid: [18, 28, 40], near: [35, 45, 55], front: [45, 55, 65],
                farD: [120, 135, 150], midD: [145, 158, 172], nearD: [170, 182, 195], frontD: [195, 205, 218]
            }
        },
    ];

    /* ─── SVG LANDSCAPE PATHS PER LOCATION ───────────────────────── */
    const LOC_SVG = {
        desert: {
            previewSvg: '<svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#c8956a"/><path d="M0 65 Q30 40 70 55 Q110 70 140 48 Q170 32 200 42 L200 100 H0Z" fill="#d4a870"/><path d="M0 80 Q50 60 100 72 Q150 84 200 68 L200 100 H0Z" fill="#e8c890"/><circle cx="35" cy="48" r="2" fill="#5a4030"/><line x1="35" y1="48" x2="35" y2="58" stroke="#5a4030" stroke-width="0.8"/></svg>',
            d4: 'M0 320 L0 190 Q50 140 120 165 Q190 190 270 150 Q340 115 430 140 Q510 168 590 128 Q670 92 760 118 Q840 148 920 108 Q990 75 1080 102 Q1160 128 1240 92 Q1300 68 1400 95 L1400 320Z',
            d3: 'M0 280 L0 160 Q90 108 190 138 Q280 168 380 118 Q460 78 560 108 Q660 148 740 98 Q820 58 910 88 Q990 122 1080 82 Q1160 50 1260 78 Q1340 105 1400 80 L1400 280Z',
            d2: 'M0 240 L0 138 Q110 85 230 118 Q330 148 430 100 Q510 65 620 92 Q720 125 810 82 Q900 50 1000 75 Q1100 108 1200 68 Q1300 40 1400 62 L1400 240Z',
            d1: 'M0 200 L0 112 Q140 62 280 98 Q390 130 500 82 Q590 50 700 72 Q800 100 900 60 Q990 35 1100 55 Q1200 80 1300 48 Q1380 30 1400 42 L1400 200Z',
        },
        newyork: {
            previewSvg: '<svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#3a4555"/><rect x="15" y="30" width="14" height="70" fill="#4a5565" rx="1"/><rect x="17" y="33" width="3" height="3" fill="rgba(255,200,80,0.5)"/><rect x="22" y="33" width="3" height="3" fill="rgba(255,200,80,0.3)"/><rect x="40" y="15" width="18" height="85" fill="#4a5868" rx="1"/><rect x="43" y="18" width="3" height="3" fill="rgba(255,220,100,0.5)"/><rect x="49" y="18" width="3" height="3" fill="rgba(255,220,100,0.3)"/><rect x="70" y="22" width="12" height="78" fill="#4a5262" rx="1"/><rect x="90" y="10" width="10" height="90" fill="#4a5868" rx="1"/><path d="M95 10 L95 2 L97 10" fill="#5a6a7a"/><rect x="110" y="35" width="16" height="65" fill="#4a5565" rx="1"/><rect x="135" y="20" width="20" height="80" fill="#4a5868" rx="1"/><rect x="165" y="40" width="14" height="60" fill="#4a5262" rx="1"/><rect x="185" y="28" width="15" height="72" fill="#4a5565" rx="1"/><path d="M0 95 Q100 90 200 95 L200 100 H0Z" fill="#2a3545"/></svg>',
            d4: 'M0 320 L0 180 L40 180 L40 120 L55 120 L55 105 L70 105 L70 120 L90 120 L90 85 L110 85 L110 95 L125 95 L125 70 L145 70 L145 100 L165 100 L165 60 L190 60 L190 50 L195 38 L200 50 L200 60 L215 60 L215 100 L240 100 L240 130 L270 130 L270 90 L300 90 L300 110 L330 110 L330 75 L360 75 L360 60 L365 45 L370 60 L370 100 L400 100 L400 140 L450 140 L450 85 L480 85 L480 65 L520 65 L520 95 L560 95 L560 110 L600 110 L600 70 L640 70 L640 55 L645 35 L650 55 L650 100 L700 100 L700 130 L750 130 L750 80 L790 80 L790 110 L830 110 L830 65 L870 65 L870 50 L875 32 L880 50 L880 90 L930 90 L930 120 L980 120 L980 75 L1020 75 L1020 100 L1060 100 L1060 60 L1100 60 L1100 85 L1140 85 L1140 110 L1200 110 L1200 70 L1240 70 L1240 55 L1245 40 L1250 55 L1250 95 L1300 95 L1300 120 L1350 120 L1350 85 L1400 85 L1400 320Z',
            d3: 'M0 280 L0 160 L50 160 L50 130 L80 130 L80 110 L120 110 L120 95 L160 95 L160 120 L200 120 L200 100 L250 100 L250 80 L300 80 L300 105 L350 105 L350 125 L400 125 L400 90 L450 90 L450 110 L500 110 L500 85 L550 85 L550 105 L600 105 L600 95 L650 95 L650 115 L700 115 L700 135 L750 135 L750 100 L800 100 L800 120 L850 120 L850 95 L900 95 L900 110 L950 110 L950 130 L1000 130 L1000 105 L1050 105 L1050 85 L1100 85 L1100 110 L1150 110 L1150 125 L1200 125 L1200 100 L1250 100 L1250 115 L1300 115 L1300 135 L1350 135 L1350 120 L1400 120 L1400 280Z',
            d2: 'M0 240 L0 145 L60 145 L60 125 L130 125 L130 140 L200 140 L200 120 L280 120 L280 138 L360 138 L360 118 L440 118 L440 135 L520 135 L520 115 L600 115 L600 130 L680 130 L680 110 L760 110 L760 128 L840 128 L840 115 L920 115 L920 125 L1000 125 L1000 108 L1080 108 L1080 122 L1160 122 L1160 110 L1240 110 L1240 130 L1320 130 L1320 115 L1400 115 L1400 240Z',
            d1: 'M0 200 L0 150 Q200 140 400 148 Q600 155 800 145 Q1000 138 1200 144 Q1300 148 1400 142 L1400 200Z',
            hasWindows: true,
        },
        alps: {
            previewSvg: '<svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#8aa0c0"/><path d="M0 70 L30 35 L50 55 L80 20 L110 50 L130 30 L160 55 L200 25 L200 100 H0Z" fill="#a0b0c8"/><path d="M80 20 L85 18" fill="none" stroke="#e8f0ff" stroke-width="2"/><path d="M0 85 Q50 70 100 78 Q150 86 200 75 L200 100 H0Z" fill="#6a8a5a"/><rect x="85" y="68" width="8" height="10" fill="#7a5a40" rx="1"/><path d="M83 68 L89 62 L95 68" fill="#8a6a50"/></svg>',
            d4: 'M0 320 L0 180 L80 100 L130 150 L200 70 L280 130 L350 55 L380 80 L440 45 L500 95 L560 30 L630 85 L700 50 L770 100 L820 65 L900 40 L960 80 L1020 55 L1080 90 L1140 35 L1200 75 L1260 50 L1320 88 L1400 42 L1400 320Z',
            d3: 'M0 280 L0 165 L90 100 L140 135 L220 80 L300 120 L370 65 L450 105 L530 55 L610 95 L690 60 L770 100 L850 70 L930 105 L1010 55 L1090 90 L1170 50 L1250 85 L1330 60 L1400 80 L1400 280Z',
            d2: 'M0 240 L0 150 Q70 110 140 130 Q210 150 280 120 Q350 95 420 115 Q490 140 560 110 Q630 85 700 105 Q770 130 840 100 Q910 80 980 100 Q1050 125 1120 95 Q1190 70 1260 90 Q1330 115 1400 85 L1400 240Z',
            d1: 'M0 200 L0 130 Q100 100 200 115 Q300 135 400 108 Q500 85 600 102 Q700 125 800 95 Q900 75 1000 92 Q1100 115 1200 88 Q1300 68 1400 82 L1400 200Z',
        },
        sahara: {
            previewSvg: '<svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#d4a060"/><path d="M0 55 Q40 35 80 50 Q120 65 160 42 Q180 35 200 38 L200 100 H0Z" fill="#dab070"/><path d="M0 75 Q50 58 100 68 Q150 78 200 62 L200 100 H0Z" fill="#e8c890"/></svg>',
            d4: 'M0 320 L0 200 Q80 150 160 175 Q240 200 320 160 Q400 130 480 155 Q560 185 640 145 Q720 115 800 140 Q880 170 960 135 Q1040 108 1120 132 Q1200 160 1280 125 Q1360 100 1400 115 L1400 320Z',
            d3: 'M0 280 L0 175 Q100 130 200 155 Q300 185 400 145 Q500 110 600 138 Q700 168 800 128 Q900 95 1000 120 Q1100 150 1200 112 Q1300 82 1400 105 L1400 280Z',
            d2: 'M0 240 L0 148 Q120 100 240 128 Q360 158 480 118 Q600 82 720 110 Q840 140 960 102 Q1080 72 1200 98 Q1320 128 1400 95 L1400 240Z',
            d1: 'M0 200 L0 120 Q160 72 320 105 Q480 138 640 95 Q800 58 960 88 Q1120 120 1280 78 Q1380 55 1400 65 L1400 200Z',
        },
        japan: {
            previewSvg: '<svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#b89aaa"/><path d="M0 65 Q40 50 80 58 Q120 66 160 55 Q180 50 200 52 L200 100 H0Z" fill="#8a7080"/><path d="M0 82 Q60 72 120 78 Q170 85 200 76 L200 100 H0Z" fill="#6a5868"/><path d="M90 55 L100 20 L110 55" fill="#7a5a4a"/><circle cx="50" cy="45" r="8" fill="rgba(255,180,190,0.4)"/><circle cx="160" cy="50" r="7" fill="rgba(255,180,190,0.35)"/></svg>',
            d4: 'M0 320 L0 195 Q80 155 160 172 Q240 192 320 165 Q400 142 480 158 Q560 178 640 155 Q720 135 800 150 Q880 168 960 148 Q1040 130 1120 145 Q1200 162 1280 142 Q1360 128 1400 138 L1400 320Z',
            d3: 'M0 280 L0 172 Q100 138 200 155 Q300 175 400 148 Q500 125 600 142 Q700 162 800 138 Q900 118 1000 132 Q1100 152 1200 128 Q1300 112 1400 125 L1400 280Z',
            d2: 'M0 240 L0 150 Q120 115 240 135 Q360 155 480 128 Q600 105 720 122 Q840 142 960 118 Q1080 98 1200 115 Q1320 135 1400 112 L1400 240Z',
            d1: 'M0 200 L0 128 Q160 90 320 112 Q480 135 640 105 Q800 80 960 100 Q1120 122 1280 95 Q1380 78 1400 85 L1400 200Z',
        },
        iceland: {
            previewSvg: '<svg viewBox="0 0 200 100"><rect width="200" height="100" fill="#506880"/><path d="M0 60 L30 40 L60 55 L90 30 L120 50 L150 35 L180 52 L200 42 L200 100 H0Z" fill="#607888"/><path d="M0 80 Q50 68 100 75 Q150 82 200 72 L200 100 H0Z" fill="#4a6070"/></svg>',
            d4: 'M0 320 L0 195 L60 130 L100 160 L160 100 L220 140 L280 80 L340 115 L400 70 L460 105 L520 60 L580 95 L640 55 L700 85 L760 50 L820 80 L880 45 L940 78 L1000 40 L1060 72 L1120 35 L1180 68 L1240 42 L1300 72 L1360 48 L1400 60 L1400 320Z',
            d3: 'M0 280 L0 170 Q80 130 160 150 Q240 172 320 135 Q400 105 480 128 Q560 155 640 120 Q720 92 800 115 Q880 140 960 108 Q1040 80 1120 105 Q1200 132 1280 100 Q1360 78 1400 92 L1400 280Z',
            d2: 'M0 240 L0 148 Q100 108 200 128 Q300 152 400 118 Q500 88 600 110 Q700 135 800 102 Q900 78 1000 98 Q1100 122 1200 92 Q1300 68 1400 82 L1400 240Z',
            d1: 'M0 200 L0 132 Q140 95 280 118 Q420 142 560 108 Q700 78 840 100 Q980 125 1120 92 Q1260 65 1400 80 L1400 200Z',
        },
    };

    /* ─── STORAGE ────────────────────────────────────────────────────── */
    const SK = 'cine_alarms_v4';
    const loadA = () => {
        try { const r = localStorage.getItem(SK); if (r) return JSON.parse(r); } catch { }
        return [
            { id: 'amritvela', label: 'Amritvela Simran', time: 240, on: true, days: [0, 1, 2, 3, 4, 5, 6], sound: 'audio1' },
            { id: 'rehras', label: 'Rehras Sahib', time: 1110, on: true, days: [0, 1, 2, 3, 4, 5, 6], sound: 'audio3' },
            { id: 'sohila', label: 'Sohila Sahib', time: 1290, on: true, days: [0, 1, 2, 3, 4, 5, 6], sound: 'audio4' },
        ];
    };
    const saveA = a => localStorage.setItem(SK, JSON.stringify(a));
    let alarms = loadA();

    /* ─── SKY TABLE ──────────────────────────────────────────────── */
    const SKY = [
        { t: 0, top: [4, 8, 18], mid: [8, 14, 30], bot: [12, 18, 36], glow: [0, 0, 0, 0], fog: 0 },
        { t: 200, top: [5, 9, 22], mid: [9, 15, 34], bot: [14, 20, 40], glow: [0, 0, 0, 0], fog: 0 },
        { t: 280, top: [12, 16, 38], mid: [24, 28, 52], bot: [42, 36, 55], glow: [150, 60, 20, 0.1], fog: 0.01 },
        { t: 320, top: [22, 32, 65], mid: [58, 50, 78], bot: [120, 82, 65], glow: [255, 120, 40, 0.5], fog: 0.08 },
        { t: 360, top: [42, 68, 120], mid: [110, 100, 130], bot: [195, 140, 92], glow: [255, 150, 55, 0.85], fog: 0.16 },
        { t: 400, top: [68, 115, 175], mid: [135, 158, 195], bot: [208, 182, 148], glow: [255, 180, 82, 0.55], fog: 0.1 },
        { t: 460, top: [95, 155, 218], mid: [152, 192, 228], bot: [195, 210, 225], glow: [255, 205, 125, 0.18], fog: 0.04 },
        { t: 580, top: [115, 175, 238], mid: [162, 202, 238], bot: [198, 216, 235], glow: [0, 0, 0, 0], fog: 0 },
        { t: 720, top: [125, 188, 245], mid: [170, 210, 245], bot: [202, 220, 240], glow: [0, 0, 0, 0], fog: 0 },
        { t: 880, top: [118, 174, 235], mid: [160, 198, 235], bot: [195, 214, 232], glow: [0, 0, 0, 0], fog: 0 },
        { t: 990, top: [100, 148, 208], mid: [150, 168, 198], bot: [202, 172, 142], glow: [255, 168, 62, 0.22], fog: 0.03 },
        { t: 1050, top: [65, 90, 155], mid: [125, 108, 132], bot: [215, 148, 88], glow: [255, 142, 42, 0.78], fog: 0.14 },
        { t: 1100, top: [38, 52, 105], mid: [75, 62, 92], bot: [175, 108, 62], glow: [255, 118, 32, 0.68], fog: 0.1 },
        { t: 1150, top: [20, 28, 60], mid: [38, 32, 56], bot: [85, 58, 48], glow: [195, 78, 22, 0.32], fog: 0.05 },
        { t: 1210, top: [10, 16, 34], mid: [16, 20, 38], bot: [22, 25, 42], glow: [0, 0, 0, 0], fog: 0 },
        { t: 1380, top: [4, 8, 18], mid: [8, 14, 30], bot: [12, 18, 36], glow: [0, 0, 0, 0], fog: 0 },
        { t: 1440, top: [4, 8, 18], mid: [8, 14, 30], bot: [12, 18, 36], glow: [0, 0, 0, 0], fog: 0 },
    ];

    /* ─── MATH ───────────────────────────────────────────────────── */
    const lerp = (a, b, t) => a + (b - a) * t;
    const lC = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
    const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
    const wrap = m => ((m % 1440) + 1440) % 1440;

    function iS(stops, min, key) {
        const m = wrap(min);
        for (let i = 0; i < stops.length - 1; i++) {
            if (m >= stops[i].t && m <= stops[i + 1].t) {
                return lC(stops[i][key], stops[i + 1][key], (m - stops[i].t) / (stops[i + 1].t - stops[i].t));
            }
        }
        return stops[0][key];
    }
    function iF(stops, min, key) {
        const m = wrap(min);
        for (let i = 0; i < stops.length - 1; i++) {
            if (m >= stops[i].t && m <= stops[i + 1].t) {
                return lerp(stops[i][key], stops[i + 1][key], (m - stops[i].t) / (stops[i + 1].t - stops[i].t));
            }
        }
        return stops[0][key];
    }
    function iG(min) {
        const m = wrap(min);
        for (let i = 0; i < SKY.length - 1; i++) {
            if (m >= SKY[i].t && m <= SKY[i + 1].t) {
                const t = (m - SKY[i].t) / (SKY[i + 1].t - SKY[i].t);
                const a = SKY[i].glow, b = SKY[i + 1].glow;
                return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)),
                Math.round(lerp(a[2], b[2], t)), +lerp(a[3], b[3], t).toFixed(3)];
            }
        }
        return [0, 0, 0, 0];
    }

    /* ─── LAND COLOR STOPS (location-aware) ──────────────────────── */
    function getLandStops() {
        const loc = LOCATIONS.find(l => l.id === S.currentLocation) || LOCATIONS[0];
        const c = loc.landColors;
        return [
            { t: 0, far: c.far, mid: c.mid, near: c.near, front: c.front },
            { t: 320, far: lC(c.far, c.farD, 0.5), mid: lC(c.mid, c.midD, 0.5), near: lC(c.near, c.nearD, 0.5), front: lC(c.front, c.frontD, 0.5) },
            { t: 460, far: c.farD, mid: c.midD, near: c.nearD, front: c.frontD },
            { t: 720, far: c.farD, mid: c.midD, near: c.nearD, front: c.frontD },
            { t: 1050, far: lC(c.far, c.farD, 0.6), mid: lC(c.mid, c.midD, 0.6), near: lC(c.near, c.nearD, 0.6), front: lC(c.front, c.frontD, 0.6) },
            { t: 1150, far: c.far, mid: c.mid, near: c.near, front: c.front },
            { t: 1440, far: c.far, mid: c.mid, near: c.near, front: c.front },
        ];
    }

    /* ─── CELESTIAL ──────────────────────────────────────────────── */
    function sunP(min) {
        const m = wrap(min), rise = 290, set = 1140;
        if (m < rise || m > set) return { x: 50, y: 115, o: 0, s: 0.8, g: 0 };
        const p = (m - rise) / (set - rise);
        const arc = Math.sin(p * Math.PI);
        return { x: lerp(6, 94, p), y: lerp(74, 10, arc), o: Math.min(1, arc * 3.5), s: 0.78 + 0.38 * (1 - arc), g: 0.22 + 0.78 * (1 - arc) };
    }
    function moonP(min) {
        const m = wrap(min), rise = 1110, set = 390;
        let vis = false, p = 0;
        if (m >= rise) { vis = true; p = (m - rise) / (1440 - rise + set); }
        else if (m <= set) { vis = true; p = (m + 1440 - rise) / (1440 - rise + set); }
        if (!vis) return { x: 80, y: 105, o: 0 };
        const arc = Math.sin(p * Math.PI);
        return { x: lerp(90, 8, p), y: lerp(58, 8, arc), o: Math.min(1, arc * 3) };
    }

    /* ─── CANVAS SKY ─────────────────────────────────────────────── */
    let cvs, ctx;
    function initCvs() {
        cvs = document.getElementById('skyCanvas'); if (!cvs) return;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const rs = () => {
            cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr;
            cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px';
            ctx = cvs.getContext('2d'); ctx.scale(dpr, dpr);
        };
        rs(); addEventListener('resize', rs);
    }
    function drawSky(min) {
        if (!ctx) return;
        const w = innerWidth, h = innerHeight;
        const top = iS(SKY, min, 'top'), mid = iS(SKY, min, 'mid'), bot = iS(SKY, min, 'bot'), glow = iG(min);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, `rgb(${top})`); g.addColorStop(0.38, `rgb(${mid})`); g.addColorStop(0.7, `rgb(${bot})`);
        if (glow[3] > 0.01) { g.addColorStop(0.82, `rgba(${glow[0]},${glow[1]},${glow[2]},${glow[3] * 0.75})`); g.addColorStop(0.97, `rgba(${glow[0]},${glow[1]},${glow[2]},${glow[3] * 0.12})`); }
        else { g.addColorStop(0.94, `rgb(${bot})`); }
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        const sun = sunP(min);
        if (sun.o > 0.04 && glow[3] > 0.04) {
            const sx = (sun.x / 100) * w, hy = h * 0.62;
            const rg = ctx.createRadialGradient(sx, hy, 0, sx, hy, w * 0.48);
            rg.addColorStop(0, `rgba(${glow[0]},${glow[1]},${glow[2]},${glow[3] * 0.45})`);
            rg.addColorStop(0.35, `rgba(${glow[0]},${Math.max(0, glow[1] - 30)},${Math.max(0, glow[2] - 20)},${glow[3] * 0.18})`);
            rg.addColorStop(1, 'transparent');
            ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
        }
        const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.8);
        vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.18)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    }

    /* ─── DOM ────────────────────────────────────────────────────── */
    let E = {};
    function cE() {
        const $ = id => document.getElementById(id);
        E = {
            sc: $('scene'), thm: $('thm'), tp: $('tp'),
            dh: $('dh'), ab: $('ab'), lb: $('lb'), sb: $('sb'), spk: $('spk'),
            ash: $('ash'), abd: $('abd'), acl: $('acl'),
            als: $('als'), cnt: $('cnt'), tw: $('tw'), ld: $('ld'),
            d1: $('d1'), d2: $('d2'), d3: $('d3'), d4: $('d4'), mfill: $('mfill'),
            audSh: $('audSh'), audBd: $('audBd'), audCl: $('audCl'), audLs: $('audLs'),
            locSh: $('locSh'), locBd: $('locBd'), locCl: $('locCl'), locGr: $('locGr'),
        };
    }

    /* ─── RENDER ─────────────────────────────────────────────────── */
    let raf = null;
    function render() {
        const min = S.min, m = wrap(min), r = document.documentElement.style;
        drawSky(min);

        // Sun
        const sun = sunP(min);
        r.setProperty('--sun-x', sun.x + '%'); r.setProperty('--sun-y', sun.y + '%');
        r.setProperty('--sun-opacity', sun.o); r.setProperty('--sun-scale', sun.s); r.setProperty('--sun-glow', sun.g);

        // Moon
        const moon = moonP(min);
        r.setProperty('--moon-x', moon.x + '%'); r.setProperty('--moon-y', moon.y + '%'); r.setProperty('--moon-opacity', moon.o);

        // Stars + aurora
        let stars = 0;
        if (m < 280) stars = 1;
        else if (m < 400) stars = 1 - (m - 280) / 120;
        else if (m > 1210) stars = 1;
        else if (m > 1100) stars = (m - 1100) / 110;
        r.setProperty('--stars-opacity', stars);
        r.setProperty('--aurora-opacity', stars * 0.7);

        // Fireflies
        let ff = 0;
        if (m > 1080 || m < 350) {
            if (m > 1080 && m < 1200) ff = (m - 1080) / 120;
            else if (m >= 1200 || m < 280) ff = 1;
            else if (m >= 280 && m < 350) ff = 1 - (m - 280) / 70;
        }
        r.setProperty('--firefly-opacity', ff);

        // Snow
        let snow = 0;
        if (m < 200) snow = 0.7;
        else if (m < 350) snow = 0.7 * (1 - (m - 200) / 150);
        else if (m > 1300) snow = 0.7 * ((m - 1300) / 140);
        r.setProperty('--snow-opacity', snow);

        // Birds
        let birds = 0;
        if (m > 480 && m < 1020) {
            if (m < 540) birds = (m - 480) / 60;
            else if (m > 960) birds = (1020 - m) / 60;
            else birds = 1;
        }
        r.setProperty('--birds-opacity', birds);

        // Bonfire
        let bonfire = 0;
        if (m > 1050 || m < 420) {
            if (m > 1050 && m < 1120) bonfire = (m - 1050) / 70;
            else if (m >= 1120 || m < 350) bonfire = 1;
            else if (m >= 350 && m < 420) bonfire = 1 - (m - 350) / 70;
        }
        r.setProperty('--bonfire-opacity', bonfire);
        r.setProperty('--bonfire-scale', 0.3 + bonfire * 0.7);

        // Night lights intensity (van + buildings)
        let vl = 0;
        if (m > 1080 || m < 380) {
            if (m > 1080 && m < 1150) vl = (m - 1080) / 70;
            else if (m >= 1150 || m < 320) vl = 1;
            else if (m >= 320 && m < 380) vl = 1 - (m - 320) / 60;
        }
        r.setProperty('--van-lights', vl);
        document.querySelectorAll('.vwg').forEach(el => el.setAttribute('fill', `rgba(255,200,80,${(vl * 0.35).toFixed(2)})`));
        document.querySelectorAll('.vhl').forEach(el => el.setAttribute('fill', `rgba(255,240,180,${(vl * 0.55).toFixed(2)})`));

        // Building windows glow at night
        document.querySelectorAll('.bwin').forEach(el => { el.style.opacity = vl; });

        // Fog
        const fog = iF(SKY, min, 'fog');
        r.setProperty('--fog-opacity', fog);
        r.setProperty('--atmo-haze', `rgba(180,160,140,${(fog * 0.35).toFixed(3)})`);

        // Clouds
        let co = 0.12;
        if (m > 400 && m < 1050) co = 0.5;
        else if (m > 320 && m <= 400) co = lerp(0.15, 0.5, (m - 320) / 80);
        else if (m >= 1050 && m < 1150) co = lerp(0.5, 0.12, (m - 1050) / 100);
        r.setProperty('--clouds-opacity', co);

        // Landscape colors
        const LAND = getLandStops();
        const lf = iS(LAND, min, 'far'), lm = iS(LAND, min, 'mid'), ln = iS(LAND, min, 'near'), lfr = iS(LAND, min, 'front');
        document.querySelectorAll('.dpf').forEach(p => p.setAttribute('fill', `rgb(${lf})`));
        document.querySelectorAll('.dpm').forEach(p => p.setAttribute('fill', `rgb(${lm})`));
        document.querySelectorAll('.dpn').forEach(p => p.setAttribute('fill', `rgb(${ln})`));
        document.querySelectorAll('.dpp').forEach(p => p.setAttribute('fill', `rgb(${lfr})`));

        // Trees
        const tc = `rgb(${Math.max(0, lm[0] - 28)},${Math.max(0, lm[1] - 18)},${Math.max(0, lm[2] - 12)})`;
        const tk = `rgb(${Math.max(0, lm[0] - 42)},${Math.max(0, lm[1] - 38)},${Math.max(0, lm[2] - 28)})`;
        document.querySelectorAll('.ts').forEach(p => p.setAttribute('fill', tc));
        document.querySelectorAll('.tt').forEach(p => p.setAttribute('fill', tk));

        // Time text
        const h24 = Math.floor(min / 60) % 24, mn = Math.floor(min % 60);
        const h12 = h24 % 12 || 12, prd = h24 < 12 ? 'AM' : 'PM';
        if (E.thm) E.thm.textContent = `${h12}:${String(mn).padStart(2, '0')}`;
        if (E.tp) E.tp.textContent = prd;
    }

    /* ─── PARALLAX ───────────────────────────────────────────────── */
    function setPx(dx) {
        const c = clamp(dx, -500, 500);
        if (E.d4) E.d4.style.transform = `translateX(${c * 0.006}px)`;
        if (E.d3) E.d3.style.transform = `translateX(${c * 0.012}px)`;
        if (E.d2) E.d2.style.transform = `translateX(${c * 0.018}px)`;
        if (E.d1) E.d1.style.transform = `translateX(${c * 0.024}px)`;
    }

    /* ─── MOMENTUM DRAG ──────────────────────────────────────────── */
    const gx = e => e.touches ? e.touches[0].clientX : e.clientX;
    function ds(e) {
        if (S.momentumRaf) { cancelAnimationFrame(S.momentumRaf); S.momentumRaf = null; }
        S.dragging = true; S.dx0 = gx(e); S.dm0 = S.min;
        S.lastDragX = S.dx0; S.lastDragTime = performance.now(); S.velocity = 0;
        if (S.hint) { S.hint = false; E.dh && E.dh.classList.add('gone'); }
        e.preventDefault();
    }
    function dm(e) {
        if (!S.dragging) return; e.preventDefault();
        const now = performance.now(), cx = gx(e), dx = cx - S.dx0, dt = now - S.lastDragTime;
        if (dt > 0) { S.velocity = lerp(S.velocity, (cx - S.lastDragX) / dt, 0.3); }
        S.lastDragX = cx; S.lastDragTime = now;
        S.min = wrap(S.dm0 + dx * 2.0);
        setPx(dx);
        if (E.mfill) { E.mfill.style.transform = `translateX(${clamp((dx / innerWidth) * 120 + 45, 0, 90)}px)`; }
        if (!raf) raf = requestAnimationFrame(() => { render(); raf = null; });
    }
    function de() {
        if (!S.dragging) return; S.dragging = false;
        if (Math.abs(S.velocity) > 0.15) {
            let vel = S.velocity * 800;
            const step = () => {
                vel *= 0.94;
                if (Math.abs(vel) < 0.3) { S.min = Math.round(S.min); resetPx(); render(); return; }
                S.min = wrap(S.min + vel * 0.016); render();
                S.momentumRaf = requestAnimationFrame(step);
            };
            S.momentumRaf = requestAnimationFrame(step);
        } else { S.min = Math.round(S.min); resetPx(); render(); }
    }
    function resetPx() {
        [E.d1, E.d2, E.d3, E.d4].forEach(d => { if (d) d.style.transform = ''; });
        if (E.mfill) E.mfill.style.transform = 'translateX(45px)';
    }
    function initDrag() {
        const sc = E.sc; if (!sc) return;
        sc.addEventListener('touchstart', ds, { passive: false });
        sc.addEventListener('touchmove', dm, { passive: false });
        sc.addEventListener('touchend', de); sc.addEventListener('touchcancel', de);
        sc.addEventListener('mousedown', ds);
        addEventListener('mousemove', dm); addEventListener('mouseup', de);
    }

    /* ─── ALARM SHEET ────────────────────────────────────────────── */
    function openSh() { S.sheet = true; E.ash.classList.add('on'); E.abd.classList.add('on'); rList(); }
    function closeSh() { S.sheet = false; E.ash.classList.remove('on'); E.abd.classList.remove('on'); }
    function rList() {
        if (!E.als) return;
        if (!alarms.length) { E.als.innerHTML = '<div class="as-em"><div class="as-em-i">⏰</div><div class="as-em-t">No alarms yet<br>Drag to pick a time, then tap + Add Alarm</div></div>'; return; }
        const dn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        E.als.innerHTML = alarms.map(a => {
            const h = Math.floor(a.time / 60) % 24, m = a.time % 60, h12 = h % 12 || 12, p = h < 12 ? 'AM' : 'PM';
            const ds = a.days.length === 7 ? 'Every day' : a.days.map(d => dn[d]).join(' ');
            return `<div class="ai"><div class="ail"><div class="ait">${h12}:${String(m).padStart(2, '0')}<span class="ap">${p}</span></div><div class="albl">${a.label}</div><div class="ady">${ds}</div></div><div class="air"><button class="adl" data-id="${a.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button><label class="atg"><input type="checkbox" data-id="${a.id}" ${a.on ? 'checked' : ''}><span class="tk"></span></label></div></div>`;
        }).join('');
        E.als.querySelectorAll('.atg input').forEach(i => { i.addEventListener('change', e => { const al = alarms.find(a => a.id === e.target.dataset.id); if (al) { al.on = e.target.checked; saveA(alarms); uC(); toast(al.on ? `${al.label} enabled` : `${al.label} disabled`); } }); });
        E.als.querySelectorAll('.adl').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); alarms = alarms.filter(a => a.id !== b.dataset.id); saveA(alarms); uC(); rList(); toast('Alarm deleted'); }); });
    }
    function uC() { if (E.cnt) E.cnt.textContent = alarms.filter(a => a.on).length + ' active'; }
    function addAlarm() {
        const t = Math.round(S.min), h = Math.floor(t / 60) % 24, m = t % 60, h12 = h % 12 || 12, p = h < 12 ? 'AM' : 'PM';
        const a = { id: 'a_' + Date.now(), label: `Alarm ${h12}:${String(m).padStart(2, '0')} ${p}`, time: t, on: true, days: [0, 1, 2, 3, 4, 5, 6], sound: S.selectedSound };
        alarms.push(a); saveA(alarms); uC();
        toast(`⏰ Alarm set for ${h12}:${String(m).padStart(2, '0')} ${p}`);
        try { if (window.AlarmPersistence) window.AlarmPersistence.saveAlarm(a); } catch { }
        openSh();
    }

    /* ─── AUDIO PICKER ───────────────────────────────────────────── */
    function openAudioSh() { S.audioSheet = true; E.audSh.classList.add('on'); E.audBd.classList.add('on'); renderAudioList(); }
    function closeAudioSh() { S.audioSheet = false; E.audSh.classList.remove('on'); E.audBd.classList.remove('on'); stopPreview(); }
    function renderAudioList() {
        if (!E.audLs) return;
        E.audLs.innerHTML = AUDIO_FILES.map(af => {
            const sel = af.id === S.selectedSound ? 'selected' : '';
            return `<div class="audio-item ${sel}" data-id="${af.id}"><div class="audio-icon">${af.icon}</div><div class="audio-info"><div class="audio-name">${af.name}</div><div class="audio-desc">${af.desc}</div></div><button class="audio-play-btn" data-file="${af.file}" data-id="${af.id}"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg></button></div>`;
        }).join('');
        E.audLs.querySelectorAll('.audio-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.audio-play-btn')) return;
                S.selectedSound = item.dataset.id;
                localStorage.setItem('cine_selected_sound', S.selectedSound);
                renderAudioList();
                toast(`🔔 Sound: ${AUDIO_FILES.find(a => a.id === item.dataset.id).name}`);
            });
        });
        E.audLs.querySelectorAll('.audio-play-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const file = btn.dataset.file, id = btn.dataset.id;
                if (previewAudio && previewAudio._id === id) { stopPreview(); return; }
                stopPreview();
                previewAudio = new Audio(`../Audio/${file}`);
                previewAudio._id = id; previewAudio.volume = 0.5;
                previewAudio.play().catch(() => { });
                btn.classList.add('playing');
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
                previewAudio.addEventListener('ended', () => stopPreview());
            });
        });
    }
    function stopPreview() {
        if (previewAudio) { previewAudio.pause(); previewAudio.currentTime = 0; previewAudio = null; }
        document.querySelectorAll('.audio-play-btn.playing').forEach(b => {
            b.classList.remove('playing');
            b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
        });
    }

    /* ─── LOCATION THEME — SVG LANDSCAPE SWAP ────────────────────── */
    function openLocSh() { S.locSheet = true; E.locSh.classList.add('on'); E.locBd.classList.add('on'); renderLocGrid(); }
    function closeLocSh() { S.locSheet = false; E.locSh.classList.remove('on'); E.locBd.classList.remove('on'); }

    function genWindowsSVG() {
        let s = '';
        const bx = [42, 55, 92, 110, 130, 167, 192, 212, 240, 272, 332, 362, 402, 452, 482, 522, 562, 602, 642, 652, 702, 752, 792, 832, 872, 932, 982, 1022, 1062, 1102, 1142, 1202, 1242, 1302, 1352];
        const bw = [13, 15, 18, 12, 15, 20, 14, 16, 28, 22, 16, 18, 28, 22, 20, 16, 18, 24, 18, 20, 28, 22, 18, 24, 18, 22, 20, 18, 22, 18, 18, 22, 18, 20, 18];
        const bh = [120, 105, 85, 95, 70, 100, 60, 100, 140, 130, 110, 75, 100, 85, 65, 95, 110, 70, 100, 60, 130, 80, 110, 65, 90, 120, 75, 100, 60, 85, 110, 70, 55, 85, 115];
        for (let i = 0; i < bx.length; i++) {
            const x = bx[i], w = bw[i] || 14, top = 320 - (bh[i] || 100);
            for (let wy = top + 5; wy < 310; wy += 12) {
                for (let wx = x + 2; wx < x + w - 3; wx += 6) {
                    if (Math.random() > 0.4) {
                        s += `<rect class="bwin" x="${wx}" y="${wy}" width="3" height="3.5" rx="0.3" fill="rgba(255,210,100,${(0.2 + Math.random() * 0.5).toFixed(2)})"/>`;
                    }
                }
            }
        }
        return s;
    }

    function applyLocation(locId) {
        const svgs = LOC_SVG[locId]; if (!svgs) return;
        ['d4', 'd3', 'd2', 'd1'].forEach((id, i) => {
            const layer = document.getElementById(id); if (!layer) return;
            const cls = ['dpf', 'dpm', 'dpn', 'dpp'][i];
            let svgH = `<svg viewBox="0 0 1400 ${[320, 280, 240, 200][i]}" preserveAspectRatio="none"><path class="${cls}" d="${svgs[id]}"/>`;
            if (svgs.hasWindows && i === 0) svgH += genWindowsSVG();
            svgH += '</svg>';
            layer.innerHTML = svgH;
        });
        const campEls = document.querySelectorAll('.van, .van-headlight, .bonfire-grp, .f-ground, .embers, .smoke-puff, .tgrp');
        campEls.forEach(e => e.style.display = (locId === 'newyork') ? 'none' : '');
    }

    function renderLocGrid() {
        if (!E.locGr) return;
        E.locGr.innerHTML = LOCATIONS.map(loc => {
            const active = loc.id === S.currentLocation ? 'active' : '';
            const svg = LOC_SVG[loc.id]?.previewSvg || '';
            return `<div class="loc-card ${active}" data-id="${loc.id}"><div class="loc-preview">${svg}<div class="loc-flag">${loc.flag}</div><div class="loc-name">${loc.name}</div></div></div>`;
        }).join('');
        E.locGr.querySelectorAll('.loc-card').forEach(card => {
            card.addEventListener('click', () => {
                S.currentLocation = card.dataset.id;
                localStorage.setItem('cine_location', S.currentLocation);
                applyLocation(S.currentLocation);
                renderLocGrid(); render();
                toast(`🌍 ${LOCATIONS.find(l => l.id === card.dataset.id).name}`);
            });
        });
    }

    /* ─── TOAST ──────────────────────────────────────────────────── */
    function toast(msg) {
        const t = document.createElement('div');
        t.className = 'tm'; t.textContent = msg; E.tw.appendChild(t);
        setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
    }

    /* ─── STARS ──────────────────────────────────────────────────── */
    function genStars() {
        const c = document.getElementById('sf'); if (!c) return;
        let h = '';
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * 100, y = Math.random() * 58, d = Math.random() * 5;
            const sz = Math.random();
            const cl = sz > 0.96 ? 'st5' : sz > 0.90 ? 'st4' : sz > 0.78 ? 'st3' : sz > 0.48 ? 'st2' : 'st1';
            h += `<div class="star ${cl}" style="left:${x}%;top:${y}%;animation-delay:${d}s"></div>`;
        }
        c.innerHTML = h;
    }

    /* ─── INIT ───────────────────────────────────────────────────── */
    function init() {
        cE(); initCvs();
        const now = new Date();
        S.min = now.getHours() * 60 + now.getMinutes();
        S.selectedSound = localStorage.getItem('cine_selected_sound') || 'audio1';
        S.currentLocation = localStorage.getItem('cine_location') || 'desert';

        genStars(); initDrag(); applyLocation(S.currentLocation); render(); uC();

        E.ab && E.ab.addEventListener('click', addAlarm);
        E.lb && E.lb.addEventListener('click', openSh);
        E.spk && E.spk.addEventListener('click', openAudioSh);
        E.sb && E.sb.addEventListener('click', openLocSh);

        E.abd && E.abd.addEventListener('click', closeSh);
        E.acl && E.acl.addEventListener('click', closeSh);
        E.audBd && E.audBd.addEventListener('click', closeAudioSh);
        E.audCl && E.audCl.addEventListener('click', closeAudioSh);
        E.locBd && E.locBd.addEventListener('click', closeLocSh);
        E.locCl && E.locCl.addEventListener('click', closeLocSh);

        const bk = document.getElementById('bk');
        if (bk) bk.addEventListener('click', () => {
            if (S.sheet) closeSh();
            else if (S.audioSheet) closeAudioSh();
            else if (S.locSheet) closeLocSh();
            else history.back();
        });

        setTimeout(() => E.ld && E.ld.classList.add('gone'), 800);
    }

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
