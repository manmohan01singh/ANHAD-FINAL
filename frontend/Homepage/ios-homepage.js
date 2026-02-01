/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — ULTRA PREMIUM iOS HOMEPAGE
 * Version: 6.0.0 (Clean Card-Focused Design)
 * 
 * Features:
 * - Smooth 60fps card carousel with iOS spring physics
 * - Dynamic ambient background color morphing
 * - Touch swipe gestures with momentum
 * - Auto-play with smart pause
 * - Keyboard navigation
 * - Haptic feedback
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class CardCarousel {
    constructor() {
        // DOM Elements
        this.wrapper = document.getElementById('cardWrapper');
        this.track = document.getElementById('cardsTrack');
        this.cards = Array.from(this.track?.querySelectorAll('.feature-card') || []);
        this.indicatorsContainer = document.getElementById('indicators');
        this.openButton = document.getElementById('openButton');
        this.prevBtn = document.getElementById('navPrev');
        this.nextBtn = document.getElementById('navNext');

        // Background Elements
        this.blobs = {
            blob1: document.getElementById('blob1'),
            blob2: document.getElementById('blob2'),
            blob3: document.getElementById('blob3')
        };
        this.bgGlow = document.getElementById('bgGlow');

        // State
        this.current = 0;
        this.total = this.cards.length;
        this.autoplayTimer = null;
        this.autoplayDelay = 5000;
        this.pauseDelay = 12000;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.startTime = 0;

        // Initialize
        if (this.cards.length > 0) {
            this.init();
        }
    }

    init() {
        this.createIndicators();
        this.bindEvents();
        this.updateCards();
        this.updateBackground(0);
        this.updateOpenButton();
        this.startAutoplay();
        this.initParticles();

        console.log('%c☬ ANHAD Homepage Ready', 'color: #8B5CF6; font-size: 14px; font-weight: bold;');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INDICATORS
    // ═══════════════════════════════════════════════════════════════════════════
    createIndicators() {
        if (!this.indicatorsContainer) return;

        this.indicatorsContainer.innerHTML = '';

        this.cards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = `indicator ${i === 0 ? 'is-active' : ''}`;
            dot.setAttribute('aria-label', `Go to card ${i + 1}`);
            dot.addEventListener('click', () => this.goTo(i));
            this.indicatorsContainer.appendChild(dot);
        });
    }

    updateIndicators() {
        const dots = this.indicatorsContainer?.querySelectorAll('.indicator');
        dots?.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === this.current);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    bindEvents() {
        // Navigation Arrows
        this.prevBtn?.addEventListener('click', () => {
            this.prev();
            this.haptic();
        });

        this.nextBtn?.addEventListener('click', () => {
            this.next();
            this.haptic();
        });

        // Touch Swipe
        this.wrapper?.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
        this.wrapper?.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
        this.wrapper?.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Mouse Drag
        this.wrapper?.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prev();
                this.haptic();
            }
            if (e.key === 'ArrowRight') {
                this.next();
                this.haptic();
            }
            if (e.key === 'Enter') {
                this.openCurrent();
            }
        });

        // Visibility
        document.addEventListener('visibilitychange', () => {
            document.hidden ? this.stopAutoplay() : this.startAutoplay();
        });

        // Card Click
        this.cards.forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('is-active')) {
                    this.openCurrent();
                }
            });
        });

        // Prevent context menu
        this.wrapper?.addEventListener('contextmenu', e => e.preventDefault());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOUCH HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════
    onTouchStart(e) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.startTime = Date.now();
        this.stopAutoplay();
    }

    onTouchMove(e) {
        if (!this.isDragging) return;
        this.currentX = e.touches[0].clientX;
    }

    onTouchEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;

        const diff = this.startX - this.currentX;
        const elapsed = Date.now() - this.startTime;
        const velocity = Math.abs(diff) / elapsed;

        // Quick flick or long drag
        if (Math.abs(diff) > 50 || velocity > 0.5) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
            this.haptic();
        }

        this.resetAutoplay();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MOUSE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════
    onMouseDown(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startTime = Date.now();
        this.stopAutoplay();
        e.preventDefault();
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        this.currentX = e.clientX;
    }

    onMouseUp() {
        if (!this.isDragging) return;
        this.isDragging = false;

        const diff = this.startX - this.currentX;
        const elapsed = Date.now() - this.startTime;
        const velocity = Math.abs(diff) / elapsed;

        if (Math.abs(diff) > 50 || velocity > 0.5) {
            diff > 0 ? this.next() : this.prev();
            this.haptic();
        }

        this.resetAutoplay();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════
    next() {
        this.goTo((this.current + 1) % this.total);
    }

    prev() {
        this.goTo((this.current - 1 + this.total) % this.total);
    }

    goTo(index) {
        if (index === this.current) return;

        this.current = index;
        this.updateCards();
        this.updateIndicators();
        this.updateBackground(index);
        this.updateOpenButton();
        this.resetAutoplay();
    }

    updateCards() {
        const next = (this.current + 1) % this.total;
        const prev = (this.current - 1 + this.total) % this.total;

        this.cards.forEach((card, i) => {
            card.classList.remove('is-active', 'is-next', 'is-prev');

            if (i === this.current) {
                card.classList.add('is-active');
            } else if (i === next) {
                card.classList.add('is-next');
            } else if (i === prev) {
                card.classList.add('is-prev');
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OPEN BUTTON
    // ═══════════════════════════════════════════════════════════════════════════
    updateOpenButton() {
        if (!this.openButton) return;

        const currentCard = this.cards[this.current];
        const href = currentCard?.dataset.href || '../index.html';
        this.openButton.href = href;
    }

    openCurrent() {
        const currentCard = this.cards[this.current];
        const href = currentCard?.dataset.href || '../index.html';
        window.location.href = href;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DYNAMIC BACKGROUND
    // ═══════════════════════════════════════════════════════════════════════════
    updateBackground(index) {
        const card = this.cards[index];
        if (!card) return;

        const primary = card.dataset.primary || '#8B5CF6';
        const secondary = card.dataset.secondary || '#F59E0B';
        const glow = this.hexToRgba(primary, 0.35);

        // Update CSS variables
        const root = document.documentElement;
        root.style.setProperty('--current-primary', primary);
        root.style.setProperty('--current-secondary', secondary);
        root.style.setProperty('--current-glow', glow);

        // Update blobs
        if (this.blobs.blob1) this.blobs.blob1.style.backgroundColor = primary;
        if (this.blobs.blob2) this.blobs.blob2.style.backgroundColor = secondary;
        if (this.blobs.blob3) this.blobs.blob3.style.backgroundColor = primary;

        // Update glow
        if (this.bgGlow) {
            this.bgGlow.style.background = `
                radial-gradient(
                    ellipse 60% 45% at center,
                    ${glow} 0%,
                    transparent 70%
                )
            `;
        }
    }

    hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOPLAY
    // ═══════════════════════════════════════════════════════════════════════════
    startAutoplay() {
        if (this.autoplayTimer) return;
        this.autoplayTimer = setInterval(() => this.next(), this.autoplayDelay);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    resetAutoplay() {
        this.stopAutoplay();
        setTimeout(() => this.startAutoplay(), this.pauseDelay);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARTICLES
    // ═══════════════════════════════════════════════════════════════════════════
    initParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        // Create floating particles
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${3 + Math.random() * 4}px;
                height: ${3 + Math.random() * 4}px;
                background: rgba(255, 255, 255, ${0.15 + Math.random() * 0.2});
                border-radius: 50%;
                left: ${10 + Math.random() * 80}%;
                animation: particleFloat ${12 + Math.random() * 8}s linear infinite;
                animation-delay: ${Math.random() * 10}s;
            `;
            container.appendChild(particle);
        }

        // Add animation
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes particleFloat {
                    0% {
                        top: 100%;
                        opacity: 0;
                        transform: translateX(0) scale(0);
                    }
                    10% {
                        opacity: 1;
                        transform: translateX(10px) scale(1);
                    }
                    50% {
                        transform: translateX(-15px) scale(1);
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        top: -5%;
                        opacity: 0;
                        transform: translateX(5px) scale(0.5);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HAPTIC
    // ═══════════════════════════════════════════════════════════════════════════
    haptic() {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARALLAX EFFECT ON CARDS (Desktop)
// ═══════════════════════════════════════════════════════════════════════════════
class CardParallax {
    constructor() {
        this.cards = document.querySelectorAll('.feature-card');

        if (window.matchMedia('(hover: hover)').matches) {
            this.init();
        }
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                if (!card.classList.contains('is-active')) return;

                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;

                card.style.transform = `
                    scale(1) translateX(0)
                    perspective(1000px)
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                `;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPEN BUTTON GLOW EFFECT
// ═══════════════════════════════════════════════════════════════════════════════
class ButtonGlow {
    constructor() {
        this.button = document.querySelector('.open-button');
        this.init();
    }

    init() {
        if (!this.button) return;

        // Update glow color with current theme
        const updateGlow = () => {
            const primary = getComputedStyle(document.documentElement)
                .getPropertyValue('--current-primary').trim();

            this.button.style.boxShadow = `
                0 4px 20px rgba(0, 0, 0, 0.3),
                0 0 40px ${this.hexToRgba(primary || '#8B5CF6', 0.2)},
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `;
        };

        // Create observer for theme changes
        const observer = new MutationObserver(updateGlow);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });

        updateGlow();
    }

    hexToRgba(hex, alpha) {
        if (!hex.startsWith('#')) return `rgba(139, 92, 246, ${alpha})`;
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Initialize carousel
    const carousel = new CardCarousel();

    // Initialize parallax
    const parallax = new CardParallax();

    // Initialize button glow
    const glow = new ButtonGlow();

    // Add touch feedback to buttons
    document.querySelectorAll('button, a').forEach(el => {
        el.addEventListener('touchstart', () => {
            if ('vibrate' in navigator) navigator.vibrate(5);
        }, { passive: true });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
window.addEventListener('error', (e) => {
    console.warn('ANHAD Error:', e.message);
});