/* ═══════════════════════════════════════════════════════════════════════════════
   ANAHAD — SACRED TRINITY WELCOME PAGE
   
   Animation Engine & Particle System
   
   "The most beautiful, sacred, premium spiritual interface ever created"
═══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ───────────────────────────────────────────────────────────────────────────
    // SACRED PARTICLE SYSTEM
    // ───────────────────────────────────────────────────────────────────────────

    class SacredParticleSystem {
        constructor(containerId = 'particlesContainer') {
            this.container = document.getElementById(containerId);
            this.particles = [];
            // DISABLED for mobile performance - set to 0
            this.particleCount = 0;

            if (this.container && this.particleCount > 0) {
                this.init();
            }
        }

        init() {
            // Create particles
            for (let i = 0; i < this.particleCount; i++) {
                this.createParticle(i);
            }
        }

        createParticle(index) {
            const particle = document.createElement('div');
            particle.className = 'sacred-particle';

            // Random properties
            const size = Math.random() * 4 + 1;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 8;
            const opacity = Math.random() * 0.6 + 0.1;

            particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}%;
        top: ${y}%;
        --duration: ${duration}s;
        --delay: -${delay}s;
        --opacity: ${opacity};
      `;

            this.container.appendChild(particle);
            this.particles.push(particle);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // GATEWAY CONTROLLER
    // ───────────────────────────────────────────────────────────────────────────

    class SacredGatewayController {
        constructor() {
            this.gateway = document.querySelector('.sacred-gateway');
            this.enterButton = document.getElementById('sacredEnterBtn');
            this.wisdomButton = document.getElementById('wisdomBtn');
            this.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
            this.app = document.querySelector('.app');

            this.init();
        }

        init() {
            console.log('🔧 SacredGatewayController init started');
            console.log('🔧 Gateway element:', this.gateway);
            console.log('🔧 Enter button:', this.enterButton);
            console.log('🔧 App element:', this.app);

            // Initialize particle system
            new SacredParticleSystem('particlesContainer');

            // Bind events
            if (this.enterButton) {
                console.log('✅ Enter button found! Adding click listener...');
                this.enterButton.addEventListener('click', (e) => {
                    console.log('🚀 Enter button CLICKED!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.enterSanctuary();
                });
                // Also add for touch
                this.enterButton.addEventListener('touchend', (e) => {
                    console.log('📱 Enter button TOUCHED!');
                    e.preventDefault();
                    this.enterSanctuary();
                });
            } else {
                console.error('❌ Enter button NOT FOUND!');
            }

            if (this.wisdomButton) {
                this.wisdomButton.addEventListener('click', () => this.showWisdom());
            }

            // Back to Welcome button
            if (this.backToWelcomeBtn) {
                this.backToWelcomeBtn.addEventListener('click', () => this.returnToWelcome());
            }

            // Check if user has visited before (optional: skip welcome)
            // this.checkPreviousVisit();

            // Preload check
            this.handlePreload();
            console.log('🔧 SacredGatewayController init completed');
        }

        handlePreload() {
            // Ensure all images are loaded before showing full animation
            const images = this.gateway ? this.gateway.querySelectorAll('img') : [];
            let loadedCount = 0;

            const checkAllLoaded = () => {
                loadedCount++;
                if (loadedCount >= images.length) {
                    this.gateway?.classList.add('loaded');
                }
            };

            if (images.length === 0) {
                this.gateway?.classList.add('loaded');
                return;
            }

            images.forEach(img => {
                if (img.complete) {
                    checkAllLoaded();
                } else {
                    img.addEventListener('load', checkAllLoaded);
                    img.addEventListener('error', checkAllLoaded);
                }
            });
        }

        enterSanctuary() {
            console.log('🚀 enterSanctuary() called');

            // IMMEDIATELY start hiding gateway (don't wait)
            if (this.gateway) {
                console.log('📍 Gateway found, starting transition...');

                // Reset body scroll FIRST
                document.body.style.overflow = 'auto';
                document.body.style.overflowX = 'hidden';
                document.documentElement.style.overflow = 'auto';

                this.gateway.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                this.gateway.style.opacity = '0';
                this.gateway.style.transform = 'scale(1.02)';
                this.gateway.style.pointerEvents = 'none';

                // Show main app immediately, don't wait for gateway animation
                if (this.app) {
                    console.log('📍 Showing main app...');
                    this.app.style.display = 'block';
                    this.app.style.transition = 'opacity 0.5s ease-out';
                    this.app.style.overflow = 'auto';

                    requestAnimationFrame(() => {
                        this.app.style.opacity = '1';
                        this.app.style.pointerEvents = 'auto';
                    });
                    console.log('✅ Main app should now be visible!');
                } else {
                    console.error('❌ App element not found!');
                }

                // Hide gateway completely after transition
                setTimeout(() => {
                    console.log('📍 Hiding gateway completely...');
                    this.gateway.classList.add('hidden');
                    this.gateway.style.display = 'none';

                    // Ensure scrolling works
                    document.body.style.overflow = 'auto';
                    document.body.style.position = 'static';
                    window.scrollTo(0, 0);
                }, 800);

                // Store visit
                localStorage.setItem('anhad_welcomed', 'true');
            } else {
                console.error('❌ Gateway element not found!');
            }
        }

        returnToWelcome() {
            // Show the gateway again with beautiful animation
            if (this.gateway) {
                // Hide the app first with transition
                if (this.app) {
                    this.app.style.transition = 'opacity 0.5s ease-out';
                    this.app.style.opacity = '0';
                    this.app.style.pointerEvents = 'none';

                    setTimeout(() => {
                        this.app.style.display = 'none';
                    }, 500);
                }

                // Show gateway
                this.gateway.classList.remove('hidden');
                this.gateway.style.display = 'flex';

                // Animate in
                setTimeout(() => {
                    this.gateway.style.transition = 'opacity 1s cubic-bezier(0.19, 1, 0.22, 1), transform 1s cubic-bezier(0.19, 1, 0.22, 1)';
                    this.gateway.style.opacity = '1';
                    this.gateway.style.transform = 'scale(1)';
                }, 50);

                // Scroll to top of gateway
                this.gateway.scrollTop = 0;
            }
        }

        showWisdom() {
            // Could trigger a random shabad or wisdom modal
            const shabadOverlay = document.querySelector('.shabad-overlay');
            if (shabadOverlay) {
                shabadOverlay.classList.add('active');
                // Trigger random shabad fetch if available
                if (typeof window.loadRandomShabad === 'function') {
                    window.loadRandomShabad();
                }
            }
        }

        checkPreviousVisit() {
            const hasVisited = localStorage.getItem('anhad_welcomed');
            if (hasVisited && this.gateway) {
                // Skip welcome animation
                this.gateway.style.display = 'none';
                if (this.app) {
                    this.app.style.opacity = '1';
                }
            }
        }
    }


    // ───────────────────────────────────────────────────────────────────────────
    // HOVER EFFECTS CONTROLLER
    // ───────────────────────────────────────────────────────────────────────────

    class HoverEffectsController {
        constructor() {
            this.granthContainers = document.querySelectorAll('.granth-container');
            this.init();
        }

        init() {
            this.granthContainers.forEach(container => {
                container.addEventListener('mouseenter', (e) => this.onMouseEnter(e));
                container.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
            });
        }

        onMouseEnter(e) {
            const container = e.currentTarget;
            const aura = container.querySelector('.granth-aura');

            if (aura) {
                aura.style.animationPlayState = 'running';
                aura.style.opacity = '1';
            }
        }

        onMouseLeave(e) {
            const container = e.currentTarget;
            const aura = container.querySelector('.granth-aura');

            if (aura) {
                aura.style.opacity = '';
            }
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // SCROLL VISIBILITY
    // ───────────────────────────────────────────────────────────────────────────

    class ScrollVisibilityController {
        constructor() {
            this.scrollIndicator = document.querySelector('.scroll-indicator');
            this.gateway = document.querySelector('.sacred-gateway');

            if (this.gateway && this.scrollIndicator) {
                this.init();
            }
        }

        init() {
            this.gateway.addEventListener('scroll', () => this.onScroll());
        }

        onScroll() {
            const scrollTop = this.gateway.scrollTop;

            if (scrollTop > 100) {
                this.scrollIndicator.style.opacity = '0';
                this.scrollIndicator.style.pointerEvents = 'none';
            } else {
                this.scrollIndicator.style.opacity = '';
                this.scrollIndicator.style.pointerEvents = '';
            }
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // LIGHT BEAMS GENERATOR - Holy Light Descending
    // ───────────────────────────────────────────────────────────────────────────

    class LightBeamsGenerator {
        constructor(containerId = 'lightBeamsLayer') {
            this.container = document.getElementById(containerId);
            this.beamCount = 8;

            if (this.container) {
                this.init();
            }
        }

        init() {
            for (let i = 0; i < this.beamCount; i++) {
                this.createBeam(i);
            }
        }

        createBeam(index) {
            const beam = document.createElement('div');
            beam.className = 'light-beam';

            const left = 10 + Math.random() * 80;
            const duration = 6 + Math.random() * 8;
            const delay = Math.random() * 10;
            const width = 2 + Math.random() * 3;

            beam.style.cssText = `
                left: ${left}%;
                width: ${width}px;
                --duration: ${duration}s;
                --delay: -${delay}s;
            `;

            this.container.appendChild(beam);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // FLOATING SACRED SYMBOLS - Gurmukhi Characters Rising
    // ───────────────────────────────────────────────────────────────────────────

    class FloatingSymbolsGenerator {
        constructor(containerId = 'floatingSymbolsLayer') {
            this.container = document.getElementById(containerId);
            this.symbols = ['ੴ', 'ਵ', 'ਹ', 'ਗ', 'ਰ', 'ੁ', '☬', 'ਸ', 'ਤ', 'ਨ', 'ਮ'];
            this.symbolCount = 15;

            if (this.container) {
                this.init();
            }
        }

        init() {
            for (let i = 0; i < this.symbolCount; i++) {
                this.createSymbol(i);
            }
        }

        createSymbol(index) {
            const symbol = document.createElement('div');
            symbol.className = 'floating-symbol';
            symbol.textContent = this.symbols[index % this.symbols.length];

            const left = 5 + Math.random() * 90;
            const fontSize = 1 + Math.random() * 2;
            const duration = 15 + Math.random() * 20;
            const delay = Math.random() * 20;

            symbol.style.cssText = `
                left: ${left}%;
                font-size: ${fontSize}rem;
                --duration: ${duration}s;
                animation-delay: -${delay}s;
            `;

            this.container.appendChild(symbol);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ROSE PETALS GENERATOR - Falling Gulab 🌸
    // ───────────────────────────────────────────────────────────────────────────

    class RosePetalsGenerator {
        constructor(containerId = 'rosePetalsLayer') {
            console.log('🌸 RosePetalsGenerator constructor started');
            this.container = document.getElementById(containerId);
            this.petalCount = 25;
            this.shapes = ['shape-1', 'shape-2', 'shape-3'];
            this.colors = ['pink-light', 'pink-medium', 'pink-deep', 'red', 'saffron'];

            if (this.container) {
                console.log('🌸 Rose petals container found:', this.container);
                this.init();
            } else {
                console.error('❌ Rose petals container NOT FOUND!');
            }
        }

        init() {
            console.log(`🌸 Creating ${this.petalCount} rose petals...`);
            for (let i = 0; i < this.petalCount; i++) {
                this.createPetal(i);
            }
            console.log('🌸 All rose petals created!');
        }

        createPetal(index) {
            const petal = document.createElement('div');

            // Random shape and color
            const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            const isSway = Math.random() > 0.5;

            petal.className = `rose-petal ${shape} ${color}${isSway ? ' sway-style' : ''}`;

            // Random properties
            const left = Math.random() * 100;
            const size = 12 + Math.random() * 18;
            const duration = 10 + Math.random() * 15;
            const delay = Math.random() * 20;
            const opacity = 0.5 + Math.random() * 0.4;

            petal.style.cssText = `
                left: ${left}%;
                --size: ${size}px;
                --duration: ${duration}s;
                --delay: -${delay}s;
                --opacity: ${opacity};
            `;

            this.container.appendChild(petal);
        }
    }


    // ───────────────────────────────────────────────────────────────────────────
    // GLOW ORBS SYSTEM - Divine Energy Orbs
    // ───────────────────────────────────────────────────────────────────────────

    class GlowOrbsSystem {
        constructor(containerId = 'particlesContainer') {
            this.container = document.getElementById(containerId);
            this.orbCount = 12;

            if (this.container) {
                this.init();
            }
        }

        init() {
            for (let i = 0; i < this.orbCount; i++) {
                this.createOrb(i);
            }
        }

        createOrb(index) {
            const orb = document.createElement('div');
            orb.className = 'glow-orb';

            const size = 15 + Math.random() * 40;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = 8 + Math.random() * 12;
            const delay = Math.random() * 10;
            const opacity = 0.2 + Math.random() * 0.4;

            orb.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}%;
                top: ${y}%;
                --duration: ${duration}s;
                --delay: -${delay}s;
                --opacity: ${opacity};
            `;

            this.container.appendChild(orb);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // MOUSE PARALLAX EFFECT
    // ───────────────────────────────────────────────────────────────────────────

    class MouseParallaxEffect {
        constructor() {
            this.nishanSahib = document.querySelector('.nishan-sahib-container');
            this.shrineSection = document.querySelector('.shrine-section');
            this.granthContainers = document.querySelectorAll('.granth-container');

            this.mouseX = 0.5;
            this.mouseY = 0.5;
            this.currentX = 0.5;
            this.currentY = 0.5;
            this.isAnimating = true;

            this.init();
        }

        init() {
            document.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
            this.animate();
        }

        onMouseMove(e) {
            this.mouseX = e.clientX / window.innerWidth;
            this.mouseY = e.clientY / window.innerHeight;
        }

        animate() {
            if (!this.isAnimating) return;

            // Smooth interpolation
            this.currentX += (this.mouseX - this.currentX) * 0.05;
            this.currentY += (this.mouseY - this.currentY) * 0.05;

            // Apply parallax to Nishan Sahib
            if (this.nishanSahib) {
                const moveX = (this.currentX - 0.5) * 15;
                const moveY = (this.currentY - 0.5) * 10;
                this.nishanSahib.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }

            // Apply subtle parallax to shrine
            if (this.shrineSection) {
                const moveX = (this.currentX - 0.5) * 8;
                const moveY = (this.currentY - 0.5) * 5;
                this.shrineSection.style.transform = `translateX(${moveX}px)`;
            }

            requestAnimationFrame(() => this.animate());
        }

        stop() {
            this.isAnimating = false;
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // SOUND EFFECTS (Optional - Browser Audio API)
    // ───────────────────────────────────────────────────────────────────────────

    class AmbientSoundController {
        constructor() {
            this.audioContext = null;
            this.isPlaying = false;
        }

        // Placeholder for ambient sound functionality
        async init() {
            // Could add ambient sacred sounds here
            // Using Web Audio API for spiritual ambient sounds
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // INITIALIZE ON DOM READY
    // ───────────────────────────────────────────────────────────────────────────

    function initializeSacredTrinity() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        // Core systems only - animations disabled for mobile performance
        new SacredGatewayController();
        new HoverEffectsController();
        new ScrollVisibilityController();

        // DISABLED for mobile performance:
        // new LightBeamsGenerator();      // Disabled
        // new FloatingSymbolsGenerator(); // Disabled
        // new RosePetalsGenerator();      // Disabled - rose petals
        // new GlowOrbsSystem();           // Disabled
        // new MouseParallaxEffect();      // Disabled

        console.log('✨ Sacred Trinity Welcome initialized (performance mode)');
        console.log('🕉️ ANAHAD — The Unstruck Sound awaits...');
    }

    // Start initialization
    initializeSacredTrinity();

    // Expose for external use
    window.SacredTrinity = {
        SacredParticleSystem,
        SacredGatewayController,
        HoverEffectsController,
        LightBeamsGenerator,
        FloatingSymbolsGenerator,
        RosePetalsGenerator,
        GlowOrbsSystem,
        MouseParallaxEffect
    };

})();
