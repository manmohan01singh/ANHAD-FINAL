/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANAHAD — THE ULTIMATE SPIRITUAL WELCOME CONTROLLER
 * 
 * "When complete, this page should make designers pause and think:
 *  'How did they make this?'"
 * 
 * Features:
 * - 50+ floating golden particles (sacred dust)
 * - Phased cinematic entrance sequence
 * - Parallax mouse tracking
 * - Breathing animations
 * - Buttery 60fps performance
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // DOM ELEMENTS
    // ─────────────────────────────────────────────────────────────────────────
    const gateway = document.getElementById('sacredGateway') || document.getElementById('gateway');
    const gatewayEnter = document.getElementById('sacredEnterBtn') || document.getElementById('gatewayEnter');
    const particleLayer = document.getElementById('particlesContainer') || document.getElementById('particleLayer');
    const shrineBg = document.querySelector('.layer-shrine-bg img') || document.querySelector('.shrine-image-wrapper');
    const app = document.querySelector('.app');

    // State
    const hasVisited = sessionStorage.getItem('anahad_visited');
    let particles = [];
    let isAnimating = true;
    let rafId = null;

    // ─────────────────────────────────────────────────────────────────────────
    // PARTICLE SYSTEM - Golden Sacred Dust
    // ─────────────────────────────────────────────────────────────────────────
    const PARTICLE_CONFIG = {
        count: 45,
        minSize: 2,
        maxSize: 5,
        minDuration: 15,
        maxDuration: 30,
        minOpacity: 0.25,
        maxOpacity: 0.7,
        blurChance: 0.3, // 30% of particles get blur
        maxBlur: 2,
    };

    function createParticle() {
        if (!particleLayer || !isAnimating) return;

        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random properties
        const size = PARTICLE_CONFIG.minSize + Math.random() * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize);
        const duration = PARTICLE_CONFIG.minDuration + Math.random() * (PARTICLE_CONFIG.maxDuration - PARTICLE_CONFIG.minDuration);
        const delay = Math.random() * -duration;
        const opacity = PARTICLE_CONFIG.minOpacity + Math.random() * (PARTICLE_CONFIG.maxOpacity - PARTICLE_CONFIG.minOpacity);
        const left = 5 + Math.random() * 90; // 5-95% to avoid edge clipping
        const blur = Math.random() < PARTICLE_CONFIG.blurChance ? Math.random() * PARTICLE_CONFIG.maxBlur : 0;

        particle.style.cssText = `
            --size: ${size}px;
            --duration: ${duration}s;
            --delay: ${delay}s;
            --opacity: ${opacity};
            --blur: ${blur}px;
            left: ${left}%;
        `;

        particleLayer.appendChild(particle);
        particles.push(particle);
    }

    function initParticles() {
        if (!particleLayer) return;

        // Create initial batch
        for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
            createParticle();
        }
    }

    function destroyParticles() {
        particles.forEach(p => p.remove());
        particles = [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PARALLAX MOUSE TRACKING
    // ─────────────────────────────────────────────────────────────────────────
    let mouseX = 0.5;
    let mouseY = 0.5;
    let currentX = 0.5;
    let currentY = 0.5;

    function handleParallax() {
        if (!isAnimating) return;

        // Smooth interpolation (lerp)
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;

        // Apply to shrine background
        if (shrineBg) {
            const moveX = (currentX - 0.5) * 20;
            const moveY = (currentY - 0.5) * 15;
            shrineBg.style.transform = `scale(1.08) translate(${moveX}px, ${moveY}px)`;
        }

        rafId = requestAnimationFrame(handleParallax);
    }

    function onMouseMove(e) {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENTRANCE ANIMATION SYSTEM
    // ─────────────────────────────────────────────────────────────────────────
    function triggerEntranceAnimations() {
        // Shrine aura and halo
        const shrineAura = document.querySelector('.shrine-aura');
        const shrineHalo = document.querySelector('.shrine-halo');

        if (shrineAura) {
            shrineAura.style.animation = 'auraBreath 6s var(--ease-breathe) infinite';
            shrineAura.style.opacity = '1';
        }

        if (shrineHalo) {
            shrineHalo.style.animation = 'haloBreath 8s var(--ease-breathe) infinite';
            shrineHalo.style.animationDelay = '-3s';
            shrineHalo.style.opacity = '1';
        }

        // Phased reveals are handled by CSS animation delays
        // Just trigger particles after main content loads
        setTimeout(() => {
            initParticles();
        }, 500);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENTER APP - The Sacred Transition
    // ─────────────────────────────────────────────────────────────────────────
    function enterApp() {
        if (!gateway) return;

        // Stop animations
        isAnimating = false;
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        // Fade out gateway with cinematic timing
        gateway.classList.add('hidden');

        // Show app with fade in
        if (app) {
            app.style.display = 'block';
            app.style.opacity = '0';
            requestAnimationFrame(() => {
                app.style.transition = 'opacity 1s cubic-bezier(0.19, 1, 0.22, 1)';
                app.style.opacity = '1';
            });
        }

        // Unlock scroll
        document.body.style.overflow = '';

        // Mark visited
        sessionStorage.setItem('anahad_visited', 'true');

        // Cleanup
        setTimeout(() => {
            gateway.style.display = 'none';
            destroyParticles();
            document.removeEventListener('mousemove', onMouseMove);
        }, 1500);

        console.log('🕉️ Welcome to ANAHAD — The Unstruck Sound');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KEYBOARD ACCESSIBILITY
    // ─────────────────────────────────────────────────────────────────────────
    function handleKeydown(e) {
        if (e.key === 'Enter' && gateway && !gateway.classList.contains('hidden')) {
            enterApp();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOUCH SUPPORT
    // ─────────────────────────────────────────────────────────────────────────
    function onTouchMove(e) {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX / window.innerWidth;
            mouseY = e.touches[0].clientY / window.innerHeight;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────
    function init() {
        // Check if gateway is actually visible (not hidden with display:none)
        const gatewayVisible = gateway && getComputedStyle(gateway).display !== 'none';

        // Only hide app if gateway is visible (user needs to see gateway first)
        if (app && gatewayVisible) {
            app.style.display = 'none';
        }

        // Skip gateway if visited this session OR if gateway is hidden
        if ((hasVisited && gateway) || !gatewayVisible) {
            if (gateway) gateway.style.display = 'none';
            if (app) {
                app.style.display = 'block';
                app.style.opacity = '1';
            }
            return;
        }

        // Lock scroll
        document.body.style.overflow = 'hidden';

        // Start parallax loop
        handleParallax();

        // Mouse/touch tracking
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: true });

        // Trigger entrance animations
        triggerEntranceAnimations();

        // Enter button
        if (gatewayEnter) {
            gatewayEnter.addEventListener('click', enterApp);
        }

        // Keyboard
        document.addEventListener('keydown', handleKeydown);

        console.log('🕉️ ANAHAD — Ultimate Spiritual Welcome initialized');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // START
    // ─────────────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
