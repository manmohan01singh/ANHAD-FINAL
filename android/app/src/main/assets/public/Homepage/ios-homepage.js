/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * ANHAD â€” CINEMATIC DARBAR SAHIB HOMEPAGE
 * Version: 11.0.0 â€” Matches new ios-homepage.html cinematic layout
 *
 * Features:
 * - Cinematic entry fade-in with staggered reveal
 * - Time-of-day responsive background (Amritvela/Morning/Evening/Night)
 * - Live Kirtan audio with EQ wave visualizer
 * - Gurbani shabad rotation
 * - Stars canvas rendering (night mode)
 * - Smart welcome/session management
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

(() => {
    'use strict';

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SMART NAVIGATION â€” PWA & Website Session Management
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const WELCOME_SEEN_KEY = 'anhad_welcome_seen';
    const SESSION_KEY = 'anhad_session_active';

    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');

    // Check if running as Capacitor native app
    const isCapacitor = typeof window.Capacitor !== 'undefined' ||
                        navigator.userAgent.includes('Capacitor');

    // NOTE: DO NOT skip welcome screen for Capacitor â€” user must see it on cold start
    // The sessionStorage flag 'anhad_welcomed' in index.html prevents redirect loops

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // TIME-OF-DAY SYSTEM
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function getTimeOfDay() {
        const h = new Date().getHours();
        if (h >= 2 && h < 6) return 'amritvela';
        if (h >= 6 && h < 12) return 'morning';
        if (h >= 12 && h < 17) return 'afternoon';
        if (h >= 17 && h < 21) return 'evening';
        return 'night';
    }

    function applyTimeOfDay() {
        const tod = getTimeOfDay();
        const body = document.body;

        // Remove all time classes
        body.classList.remove('time-amritvela', 'time-morning', 'time-afternoon', 'time-evening', 'time-night');
        body.classList.add(`time-${tod}`);

        // Update scene background image based on time
        const sceneBg = document.getElementById('scene-bg');
        if (sceneBg) {
            const imageMap = {
                amritvela: '../assets/Darbar-sahib-AMRITVELA.webp',
                morning: '../assets/darbar-sahib-day.webp',
                afternoon: '../assets/darbar-sahib-day.webp',
                evening: '../assets/darbar-sahib-evening.webp',
                night: '../assets/darbar-sahib-evening.webp'
            };
            const img = imageMap[tod] || imageMap.morning;
            sceneBg.style.backgroundImage = `url('${img}')`;

            // Trigger loaded animation
            requestAnimationFrame(() => {
                setTimeout(() => sceneBg.classList.add('loaded'), 100);
            });
        }

        // Show stars at night
        if (tod === 'night' || tod === 'amritvela') {
            initStars();
        }

        // Adjust light source for night
        const lightSource = document.getElementById('light-source');
        if (lightSource && (tod === 'night' || tod === 'amritvela')) {
            lightSource.style.opacity = '0.4';
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // FIREWORKS PARTICLE SYSTEM
    // Golden particles explode on click/touch anywhere
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function initFireworks() {
        const canvas = document.getElementById('fireworks-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particles = [];
        const goldenColors = [
            '#FFD700', '#FFA500', '#F5D47A', '#E8C547', '#D4B03A',
            '#C9A227', '#B89120', '#FFE885', '#F0D050', '#FFEC8B'
        ];

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.color = goldenColors[Math.floor(Math.random() * goldenColors.length)];
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 6 + 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.gravity = 0.2;
                this.friction = 0.96;
                this.alpha = 1;
                this.decay = Math.random() * 0.02 + 0.01;
                this.size = Math.random() * 4 + 2;
            }

            update() {
                this.vx *= this.friction;
                this.vy *= this.friction;
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= this.decay;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        function createExplosion(x, y) {
            const particleCount = 25;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(x, y));
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles = particles.filter(p => {
                p.update();
                p.draw();
                return p.alpha > 0;
            });

            requestAnimationFrame(animate);
        }

        // Handle click/touch anywhere on page
        document.addEventListener('click', (e) => {
            // Don't trigger on links/buttons to avoid interfering with navigation
            if (e.target.closest('a, button, #enter-btn')) return;
            createExplosion(e.clientX, e.clientY);
        });

        // Touch support for mobile
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('a, button, #enter-btn')) return;
            const touch = e.touches[0];
            createExplosion(touch.clientX, touch.clientY);
        }, { passive: true });

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        animate();
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // STARS CANVAS (Night/Amritvela only)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function initStars() {
        const canvas = document.getElementById('stars-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.classList.add('visible');

        const stars = [];
        for (let i = 0; i < 80; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.6,
                radius: Math.random() * 1.5 + 0.3,
                alpha: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.005
            });
        }

        let frame = 0;
        function drawStars() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(star => {
                const twinkle = Math.sin(frame * star.twinkleSpeed) * 0.3 + 0.7;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
                ctx.fill();
            });
            frame++;
            requestAnimationFrame(drawStars);
        }
        drawStars();

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // -------------------------------------------------------------------
    // LIVE KIRTAN AUDIO with UnifiedStats Tracking
    // -------------------------------------------------------------------
    class KirtanTracker {
        constructor() {
            this.isTracking = false;
            this.timer = null;
        }
        start() {
            if (this.isTracking) return;
            this.isTracking = true;
            console.log("[KirtanTracker] Started");
            this.recordMinute();
            this.timer = setInterval(() => this.recordMinute(), 60000);
        }
        stop() {
            if (!this.isTracking) return;
            this.isTracking = false;
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            console.log("[KirtanTracker] Stopped");
        }
        recordMinute() {
            if (window.UnifiedStats && typeof window.UnifiedStats.recordKirtanListening === "function") {
                window.UnifiedStats.recordKirtanListening(1);
                console.log("[KirtanTracker] Recorded via UnifiedStats");
                return;
            }
            try {
                const today = new Date().toISOString().split("T")[0];
                const key = "anhad_daily_analytics";
                let data = JSON.parse(localStorage.getItem(key) || "{}");
                if (!data[today]) data[today] = { readPages: 0, listenMinutes: 0, nitnemCount: 0 };
                data[today].listenMinutes += 1;
                localStorage.setItem(key, JSON.stringify(data));
                console.log("[KirtanTracker] Recorded to localStorage");
            } catch (e) {
                console.error("[KirtanTracker] Error:", e);
            }
        }
        cleanup() {
            this.stop();
        }
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // LIVE KIRTAN AUDIO - Uses AnhadAudio Singleton
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function initAudio() {
        const tapHint = document.getElementById('tap-hint');

        if (!window.AnhadAudio) {
            console.warn('[Homepage] AnhadAudio not available, retrying...');
            setTimeout(initAudio, 100);
            return;
        }

        const tracker = new KirtanTracker();

        function toggleAudio() {
            const state = window.AnhadAudio.getState();
            if (state.isPlaying) {
                window.AnhadAudio.pause();
            } else {
                window.AnhadAudio.play('darbar');
            }
        }

        // Tap anywhere to toggle audio (except on buttons/links)
        document.body.addEventListener('click', (e) => {
            // Don't toggle if clicking the Enter button or links
            if (e.target.closest('#enter-btn') || e.target.closest('a')) return;
            toggleAudio();
        });

        // Subscribe to singleton events for UI updates
        window.AnhadAudio.on('statechange', (audioState) => {
            if (audioState.isPlaying) {
                document.body.classList.add('audio-playing');
                tracker.start();
                if (tapHint) tapHint.textContent = 'Tap to pause kirtan';
            } else {
                document.body.classList.remove('audio-playing');
                tracker.stop();
                if (tapHint) tapHint.textContent = 'Tap to play kirtan';
            }
        });

        // Auto-start kirtan on page load
        setTimeout(() => {
            if (navigator.onLine) {
                window.AnhadAudio.play('darbar').catch(e => console.warn('[Homepage] Autoplay failed:', e));
            } else {
                console.warn('[Homepage] Offline, skipping auto-play to prevent crash');
                if (tapHint) tapHint.textContent = 'App is offline. Tap when connected.';
            }
        }, 500);

        // Handle visibility change - pause tracking when tab hidden
        document.addEventListener('visibilitychange', () => {
            const state = window.AnhadAudio.getState();
            if (document.hidden && state.isPlaying) {
                tracker.stop();
            } else if (!document.hidden && state.isPlaying) {
                tracker.start();
            }
        });

        // Cleanup on page unload
        window.addEventListener('pagehide', () => {
            tracker.cleanup();
        });

        console.log('[Homepage] Audio initialized with AnhadAudio singleton');
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // GURBANI SHABAD ROTATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const SHABADS = [
        { gurmukhi: 'à¨§à©°à¨¨à© à¨¸à© à¨µà©‡à¨²à¨¾ à¨œà¨¿à¨¤à© à¨®à©ˆ à¨¸à¨¤à¨¿à¨—à©à¨°à© à¨®à¨¿à¨²à¨¿à¨†', english: 'Blessed is the time when I meet the True Guru' },
        { gurmukhi: 'à¨¸à¨¾à¨šà© à¨•à¨¹à©‹à¨‚ à¨¸à©à¨¨ à¨²à©‡à¨¹à© à¨¸à¨­à©ˆ à¨œà¨¿à¨¨ à¨ªà©à¨°à©‡à¨® à¨•à©€à¨“ à¨¤à¨¿à¨¨ à¨¹à©€ à¨ªà©à¨°à¨­à© à¨ªà¨¾à¨‡à¨“', english: 'I speak the truth â€“ only through love is God attained' },
        { gurmukhi: 'à¨¨à¨¾à¨¨à¨• à¨¨à¨¾à¨® à¨šà©œà©à¨¹à¨¦à©€ à¨•à¨²à¨¾ à¨¤à©‡à¨°à©‡ à¨­à¨¾à¨£à©‡ à¨¸à¨°à¨¬à©±à¨¤ à¨¦à¨¾ à¨­à¨²à¨¾', english: 'Nanak, in Thy Name, may all prosper by Thy grace' },
        { gurmukhi: 'à¨à¨• à¨“à¨…à©°à¨•à¨¾à¨° à¨¸à¨¤à¨¿ à¨¨à¨¾à¨®à©', english: 'There is One God, Truth is His Name' },
        { gurmukhi: 'à¨®à¨¨ à¨¤à©‚à©° à¨œà©‹à¨¤à¨¿ à¨¸à¨°à©‚à¨ªà© à¨¹à©ˆ à¨†à¨ªà¨£à¨¾ à¨®à©‚à¨²à© à¨ªà¨›à¨¾à¨£à©', english: 'O my mind, you are the embodiment of the Divine Light â€“ know your origin' },
        { gurmukhi: 'à¨¦à©‡à¨¹ à¨¸à¨¼à¨¿à¨µà¨¾ à¨¬à¨° à¨®à©‹à¨¹à¨¿ à¨‡à¨¹à©ˆ à¨¸à¨¼à©à¨­ à¨•à¨°à¨®à¨¨ à¨¤à©‡ à¨•à¨¬à¨¹à©‚à©° à¨¨ à¨Ÿà¨°à©‹à¨‚', english: 'Grant me this boon, O God â€“ may I never refrain from righteous acts' }
    ];

    function initShabadRotation() {
        const shabadEl = document.getElementById('shabad');
        const translationEl = document.getElementById('translation');
        if (!shabadEl || !translationEl) return;

        let currentIndex = 0;

        function rotateShabad() {
            currentIndex = (currentIndex + 1) % SHABADS.length;
            const shabad = SHABADS[currentIndex];

            // Fade out
            shabadEl.style.opacity = '0';
            translationEl.style.opacity = '0';

            setTimeout(() => {
                shabadEl.textContent = shabad.gurmukhi;
                translationEl.textContent = shabad.english;

                // Fade in
                shabadEl.style.opacity = '1';
                translationEl.style.opacity = '1';
            }, 500);
        }

        // Rotate every 12 seconds
        setInterval(rotateShabad, 12000);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // ENTER BUTTON â€” Navigation Handler
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function initEnterButton() {
        const enterBtn = document.getElementById('enter-btn');
        if (!enterBtn) return;

        enterBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Set the CORRECT flag that index.html checks
            sessionStorage.setItem('anhad_welcomed', '1');

            // Also set legacy flags for compatibility
            if (isPWA) {
                sessionStorage.setItem(SESSION_KEY, 'true');
            } else {
                localStorage.setItem(WELCOME_SEEN_KEY, 'true');
            }

            // Haptic feedback
            if ('vibrate' in navigator) navigator.vibrate(15);

            window.location.replace('../index.html');
        });
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // INITIALIZATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    function init() {
        applyTimeOfDay();
        initAudio();
        initShabadRotation();
        initEnterButton();
        initFireworks();

        console.log('%câ˜¬ ANHAD Cinematic Homepage Ready', 'color: #C9A227; font-size: 14px; font-weight: bold;');
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
