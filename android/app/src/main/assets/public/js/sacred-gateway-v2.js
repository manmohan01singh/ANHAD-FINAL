/* ═══════════════════════════════════════════════════════════════════════════════
   ANAHAD — SACRED GATEWAY V2.0 CONTROLLER
   
   "Buttery Smooth • Zero Flicker • iOS-like Experience"
   
   Performance-optimized JavaScript for the welcome page:
   - No heavy particle systems
   - GPU-accelerated transitions only
   - Touch-optimized interactions
   - Smooth enter/exit animations
═══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ───────────────────────────────────────────────────────────────────────────
    // GATEWAY CONTROLLER CLASS
    // ───────────────────────────────────────────────────────────────────────────

    class SacredGatewayV2Controller {
        constructor() {
            // DOM elements
            this.gateway = document.querySelector('.sacred-gateway-v2');
            this.enterButton = document.getElementById('sgEnterBtn');
            this.backButton = document.getElementById('backToWelcomeBtn');
            this.app = document.querySelector('.app');

            // State
            this.isTransitioning = false;
            this.hasEntered = false;

            // Initialize
            if (this.gateway) {
                this.init();
            }
        }

        init() {
            console.log('🌟 Sacred Gateway V2 initializing...');

            // AUTO-SKIP WELCOME PAGE - Immediately enter the app
            // The iOS Homepage is now the new entry point
            // This hides the welcome page completely

            // Hide welcome page immediately
            if (this.gateway) {
                this.gateway.style.display = 'none';
            }

            // Hide loading screen immediately
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }

            // Show main app immediately
            if (this.app) {
                this.app.style.display = 'block';
                this.app.style.opacity = '1';
                this.app.style.pointerEvents = 'auto';
            }

            // Enable scrolling
            document.body.style.overflow = 'auto';
            document.body.style.overflowX = 'hidden';
            document.documentElement.style.overflow = 'auto';
            document.body.style.position = 'static';

            // Mark as entered
            this.hasEntered = true;

            // Store in localStorage
            try {
                localStorage.setItem('anhad_welcomed', 'true');
                localStorage.setItem('anhad_last_visit', Date.now().toString());
            } catch (e) {
                // localStorage not available
            }

            console.log('✨ Welcome page bypassed - Main app ready!');
        }

        bindEvents() {
            // Enter button - click and touch
            if (this.enterButton) {
                // Click handler
                this.enterButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.enterSanctuary();
                });

                // Touch handler for mobile
                this.enterButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.enterSanctuary();
                }, { passive: false });

                // Hover sound effect (optional)
                this.enterButton.addEventListener('mouseenter', () => {
                    this.playHaptic('light');
                });
            }

            // Back to welcome button (in main app header)
            if (this.backButton) {
                this.backButton.addEventListener('click', () => {
                    this.returnToWelcome();
                });
            }

            // Keyboard support
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.gateway && !this.gateway.classList.contains('hidden')) {
                    this.enterSanctuary();
                }
                if (e.key === 'Escape' && this.app && this.app.style.display !== 'none') {
                    this.returnToWelcome();
                }
            });

            // Handle visibility change (pause/resume animations)
            document.addEventListener('visibilitychange', () => {
                this.handleVisibilityChange();
            });
        }

        preloadImages() {
            const images = this.gateway ? this.gateway.querySelectorAll('img') : [];
            let loadedCount = 0;
            const totalImages = images.length;

            const onImageLoad = () => {
                loadedCount++;
                if (loadedCount >= totalImages) {
                    this.onAllImagesLoaded();
                }
            };

            if (totalImages === 0) {
                this.onAllImagesLoaded();
                return;
            }

            images.forEach(img => {
                if (img.complete) {
                    onImageLoad();
                } else {
                    img.addEventListener('load', onImageLoad);
                    img.addEventListener('error', onImageLoad);
                }
            });
        }

        onAllImagesLoaded() {
            console.log('🖼️ All images loaded');
            this.gateway?.classList.add('images-loaded');
        }

        enterSanctuary() {
            // Prevent double triggers
            if (this.isTransitioning || this.hasEntered) {
                return;
            }

            console.log('🚀 Entering sanctuary...');
            this.isTransitioning = true;
            this.hasEntered = true;

            // Play haptic feedback
            this.playHaptic('medium');

            // Prepare body for scrolling
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            // Fade out gateway
            this.gateway.classList.add('hidden');

            // Show main app
            if (this.app) {
                // Make visible but transparent
                this.app.style.display = 'block';
                this.app.style.opacity = '0';
                this.app.style.pointerEvents = 'none';

                // Force reflow
                void this.app.offsetHeight;

                // Animate in
                requestAnimationFrame(() => {
                    this.app.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    this.app.style.opacity = '1';
                    this.app.style.pointerEvents = 'auto';
                });
            }

            // Complete transition
            setTimeout(() => {
                // Hide gateway completely
                this.gateway.style.display = 'none';

                // Enable scrolling
                document.body.style.overflow = 'auto';
                document.body.style.overflowX = 'hidden';
                document.documentElement.style.overflow = 'auto';
                document.body.style.position = 'static';

                // Scroll to top
                window.scrollTo(0, 0);

                // Mark transition complete
                this.isTransitioning = false;

                // Store in localStorage
                try {
                    localStorage.setItem('anhad_welcomed', 'true');
                    localStorage.setItem('anhad_last_visit', Date.now().toString());
                } catch (e) {
                    // localStorage not available
                }

                console.log('✅ Sanctuary entered!');
            }, 800);
        }

        returnToWelcome() {
            if (this.isTransitioning) {
                return;
            }

            console.log('🔙 Returning to welcome...');
            this.isTransitioning = true;

            // Play haptic
            this.playHaptic('light');

            // Fade out app
            if (this.app) {
                this.app.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                this.app.style.opacity = '0';
                this.app.style.pointerEvents = 'none';
            }

            // Show gateway
            setTimeout(() => {
                if (this.app) {
                    this.app.style.display = 'none';
                }

                // Show and animate gateway
                this.gateway.style.display = 'flex';

                // Force reflow
                void this.gateway.offsetHeight;

                requestAnimationFrame(() => {
                    this.gateway.classList.remove('hidden');
                });

                // Scroll gateway to top
                this.gateway.scrollTop = 0;

                // Mark as not entered
                this.hasEntered = false;
                this.isTransitioning = false;

                console.log('✅ Back at welcome!');
            }, 500);
        }

        handleVisibilityChange() {
            if (document.hidden) {
                // Page hidden - could pause animations here
                console.log('📴 Page hidden');
            } else {
                // Page visible - could resume animations here
                console.log('📱 Page visible');
            }
        }

        playHaptic(intensity = 'light') {
            // Vibration API for haptic feedback on mobile
            if ('vibrate' in navigator) {
                switch (intensity) {
                    case 'light':
                        navigator.vibrate(10);
                        break;
                    case 'medium':
                        navigator.vibrate(20);
                        break;
                    case 'heavy':
                        navigator.vibrate(30);
                        break;
                }
            }
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // INTERACTIVE ELEMENTS CONTROLLER
    // ───────────────────────────────────────────────────────────────────────────

    class InteractiveElementsController {
        constructor() {
            this.granthImages = document.querySelectorAll('.sg-granth-image');
            this.init();
        }

        init() {
            this.granthImages.forEach(granth => {
                // Touch feedback
                granth.addEventListener('touchstart', () => {
                    granth.style.transform = 'scale(0.97) translateZ(0)';
                }, { passive: true });

                granth.addEventListener('touchend', () => {
                    granth.style.transform = 'scale(1) translateZ(0)';
                }, { passive: true });
            });
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // PERFORMANCE MONITOR (Development only)
    // ───────────────────────────────────────────────────────────────────────────

    class PerformanceMonitor {
        constructor() {
            this.enabled = false; // Set to true for debugging
            if (this.enabled) {
                this.init();
            }
        }

        init() {
            this.frameCount = 0;
            this.lastTime = performance.now();
            this.fpsDisplay = this.createFPSDisplay();
            this.update();
        }

        createFPSDisplay() {
            const display = document.createElement('div');
            display.id = 'fps-display';
            display.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                background: rgba(0,0,0,0.8);
                color: #0f0;
                font-family: monospace;
                font-size: 12px;
                border-radius: 4px;
                z-index: 99999;
            `;
            document.body.appendChild(display);
            return display;
        }

        update() {
            this.frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastTime;

            if (elapsed >= 1000) {
                const fps = Math.round(this.frameCount * 1000 / elapsed);
                this.fpsDisplay.textContent = `${fps} FPS`;
                this.fpsDisplay.style.color = fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00';
                this.frameCount = 0;
                this.lastTime = currentTime;
            }

            requestAnimationFrame(() => this.update());
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // INITIALIZE ON DOM READY
    // ───────────────────────────────────────────────────────────────────────────

    function initializeSacredGatewayV2() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        // Core controller
        const gateway = new SacredGatewayV2Controller();

        // Interactive elements
        new InteractiveElementsController();

        // Performance monitor (dev only)
        new PerformanceMonitor();

        // Expose for external use
        window.SacredGatewayV2 = {
            controller: gateway,
            enter: () => gateway.enterSanctuary(),
            back: () => gateway.returnToWelcome()
        };

        console.log('🕉️ ANAHAD Sacred Gateway V2 — Ready');
    }

    // Start initialization
    initializeSacredGatewayV2();

})();
