/* ═══════════════════════════════════════════════════════════════════════════════
   MALA COUNTER COMPONENT
   Advanced 108-bead Mala Counter with animations and haptics
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

class MalaCounter {
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 1: CONSTRUCTOR & INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────
    
    constructor(options = {}) {
        this.options = {
            container: options.container || '#malaRing',
            beadCount: options.beadCount || 108,
            radius: options.radius || 85,
            centerRadius: options.centerRadius || 70,
            beadRadius: options.beadRadius || null, // Auto-calculated if null
            sumeruSize: options.sumeruSize || 1.5, // Multiplier for sumeru bead
            colors: {
                inactive: options.colors?.inactive || 'rgba(255,255,255,0.2)',
                active: options.colors?.active || '#AF52DE',
                completed: options.colors?.completed || '#34C759',
                sumeru: options.colors?.sumeru || '#FFD700',
                glow: options.colors?.glow || 'rgba(175, 82, 222, 0.6)'
            },
            haptics: options.haptics !== false,
            sounds: options.sounds !== false,
            animation: {
                duration: options.animation?.duration || 150,
                easing: options.animation?.easing || 'ease-out'
            },
            onCount: options.onCount || null,
            onComplete: options.onComplete || null,
            onReset: options.onReset || null
        };
        
        this.state = {
            count: 0,
            completedMalas: 0,
            isAnimating: false,
            currentJaap: 'waheguru'
        };
        
        this.beads = [];
        this.svg = null;
        this.centerElement = null;
        
        this.init();
    }
    
    init() {
        this.createSVG();
        this.createBeads();
        this.createSumeruBead();
        this.bindEvents();
        
        return this;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 2: SVG CREATION
    // ─────────────────────────────────────────────────────────────────────────
    
    createSVG() {
        const container = document.querySelector(this.options.container);
        if (!container) {
            console.error('Mala container not found:', this.options.container);
            return;
        }
        
        // Clear existing
        const existingSvg = container.querySelector('.mala-beads-svg');
        if (existingSvg) {
            existingSvg.remove();
        }
        
        // Create SVG
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'mala-beads-svg');
        this.svg.setAttribute('viewBox', '0 0 200 200');
        this.svg.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
        `;
        
        // Add definitions
        this.createDefs();
        
        container.insertBefore(this.svg, container.firstChild);
    }
    
    createDefs() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        defs.innerHTML = `
            <!-- Inactive Bead Gradient -->
            <radialGradient id="malaBeadInactive" cx="30%" cy="30%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
                <stop offset="100%" stop-color="${this.options.colors.inactive}"/>
            </radialGradient>
            
            <!-- Active Bead Gradient -->
            <radialGradient id="malaBeadActive" cx="30%" cy="30%">
                <stop offset="0%" stop-color="#D67BFF"/>
                <stop offset="100%" stop-color="${this.options.colors.active}"/>
            </radialGradient>
            
            <!-- Completed Bead Gradient -->
            <radialGradient id="malaBeadCompleted" cx="30%" cy="30%">
                <stop offset="0%" stop-color="#5EE080"/>
                <stop offset="100%" stop-color="${this.options.colors.completed}"/>
            </radialGradient>
            
            <!-- Sumeru Bead Gradient -->
            <radialGradient id="malaSumeruGradient" cx="30%" cy="30%">
                <stop offset="0%" stop-color="#FFF5CC"/>
                <stop offset="50%" stop-color="${this.options.colors.sumeru}"/>
                <stop offset="100%" stop-color="#CC9900"/>
            </radialGradient>
            
            <!-- Glow Filter -->
            <filter id="malaBeadGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feFlood flood-color="${this.options.colors.glow}" result="color"/>
                <feComposite in="color" in2="blur" operator="in" result="shadow"/>
                <feMerge>
                    <feMergeNode in="shadow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            
            <!-- Sumeru Glow -->
            <filter id="malaSumeruGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feFlood flood-color="rgba(255, 215, 0, 0.8)" result="color"/>
                <feComposite in="color" in2="blur" operator="in" result="shadow"/>
                <feMerge>
                    <feMergeNode in="shadow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            
            <!-- Pulse Animation -->
            <animate id="pulseAnim" attributeName="r" dur="0.2s" values="1;1.3;1" repeatCount="1"/>
        `;
        
        this.svg.appendChild(defs);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 3: BEAD CREATION
    // ─────────────────────────────────────────────────────────────────────────
    
    createBeads() {
        const { beadCount, radius } = this.options;
        const centerX = 100;
        const centerY = 100;
        
        // Calculate bead radius based on count
        const beadRadius = this.options.beadRadius || this.calculateBeadRadius(beadCount);
        
        // Create beads group
        const beadsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        beadsGroup.setAttribute('class', 'mala-beads-group');
        
        this.beads = [];
        
        for (let i = 0; i < beadCount; i++) {
            // Calculate position (start from top, go clockwise)
            const angle = ((i / beadCount) * 2 * Math.PI) - (Math.PI / 2);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            // Create bead
            const bead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bead.setAttribute('cx', x);
            bead.setAttribute('cy', y);
            bead.setAttribute('r', beadRadius);
            bead.setAttribute('fill', 'url(#malaBeadInactive)');
            bead.setAttribute('class', 'mala-bead');
            bead.setAttribute('data-index', i);
            bead.style.cssText = `
                cursor: pointer;
                transition: all ${this.options.animation.duration}ms ${this.options.animation.easing};
                transform-origin: ${x}px ${y}px;
            `;
            
            beadsGroup.appendChild(bead);
            this.beads.push({
                element: bead,
                index: i,
                x, y,
                radius: beadRadius,
                state: 'inactive' // inactive, active, completed
            });
        }
        
        this.svg.appendChild(beadsGroup);
    }
    
    createSumeruBead() {
        const { radius, sumeruSize } = this.options;
        const beadRadius = this.options.beadRadius || this.calculateBeadRadius(this.options.beadCount);
        const sumeruRadius = beadRadius * sumeruSize;
        
        const centerX = 100;
        const centerY = 100 - radius;
        
        const sumeru = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sumeru.setAttribute('cx', centerX);
        sumeru.setAttribute('cy', centerY);
        sumeru.setAttribute('r', sumeruRadius);
        sumeru.setAttribute('fill', 'url(#malaSumeruGradient)');
        sumeru.setAttribute('filter', 'url(#malaSumeruGlow)');
        sumeru.setAttribute('class', 'mala-sumeru');
        sumeru.style.cssText = `
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        this.svg.appendChild(sumeru);
        this.sumeruBead = sumeru;
    }
    
    calculateBeadRadius(count) {
        if (count <= 27) return 8;
        if (count <= 54) return 6;
        if (count <= 108) return 4;
        return 3;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 4: EVENT HANDLING
    // ─────────────────────────────────────────────────────────────────────────
    
    bindEvents() {
        // Individual bead clicks
        this.beads.forEach(bead => {
            bead.element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleBeadClick(bead.index);
            });
        });
        
        // Sumeru click for reset
        this.sumeruBead?.addEventListener('click', () => {
            this.handleSumeruClick();
        });
    }
    
    handleBeadClick(index) {
        // Only allow clicking the next bead in sequence
        if (index === this.state.count) {
            this.increment();
        }
    }
    
    handleSumeruClick() {
        if (this.state.count > 0) {
            this.reset();
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 5: COUNTING LOGIC
    // ─────────────────────────────────────────────────────────────────────────
    
    increment() {
        if (this.state.isAnimating) return;
        if (this.state.count >= this.options.beadCount) {
            this.complete();
            return;
        }
        
        this.state.isAnimating = true;
        
        // Activate current bead
        const currentBead = this.beads[this.state.count];
        this.activateBead(currentBead);
        
        // Increment count
        this.state.count++;
        
        // Haptic feedback
        if (this.options.haptics && window.HapticPatterns) {
            window.HapticPatterns.malaTap();
        }
        
        // Callback
        if (typeof this.options.onCount === 'function') {
            this.options.onCount({
                count: this.state.count,
                total: this.options.beadCount,
                percentage: (this.state.count / this.options.beadCount) * 100
            });
        }
        
        // Check for completion
        if (this.state.count >= this.options.beadCount) {
            setTimeout(() => this.complete(), this.options.animation.duration);
        }
        
        // Reset animation flag
        setTimeout(() => {
            this.state.isAnimating = false;
        }, this.options.animation.duration);
        
        return this;
    }
    
    activateBead(bead) {
        const { element, x, y } = bead;
        
        // Pulse animation
        element.style.transform = 'scale(1.5)';
        element.setAttribute('fill', 'url(#malaBeadActive)');
        element.setAttribute('filter', 'url(#malaBeadGlow)');
        
        // After pulse, settle to completed state
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.setAttribute('fill', 'url(#malaBeadCompleted)');
            element.removeAttribute('filter');
            bead.state = 'completed';
        }, this.options.animation.duration);
    }
    
    complete() {
        this.state.completedMalas++;
        
        // Haptic feedback
        if (this.options.haptics && window.HapticPatterns) {
            window.HapticPatterns.malaComplete();
        }
        
        // Animate all beads
        this.animateCompletion();
        
        // Callback
        if (typeof this.options.onComplete === 'function') {
            this.options.onComplete({
                malas: this.state.completedMalas,
                jaap: this.state.currentJaap
            });
        }
        
        // Reset after animation
        setTimeout(() => {
            this.reset(false);
        }, 1000);
    }
    
    animateCompletion() {
        // Pulse all beads in a wave
        this.beads.forEach((bead, index) => {
            setTimeout(() => {
                bead.element.style.transform = 'scale(1.3)';
                bead.element.setAttribute('filter', 'url(#malaBeadGlow)');
                
                setTimeout(() => {
                    bead.element.style.transform = 'scale(1)';
                }, 150);
            }, index * 10);
        });
        
        // Pulse sumeru
        if (this.sumeruBead) {
            this.sumeruBead.style.transform = 'scale(1.5)';
            setTimeout(() => {
                this.sumeruBead.style.transform = 'scale(1)';
            }, 500);
        }
    }
    
    reset(triggerCallback = true) {
        this.state.count = 0;
        
        // Reset all beads
        this.beads.forEach(bead => {
            bead.element.setAttribute('fill', 'url(#malaBeadInactive)');
            bead.element.removeAttribute('filter');
            bead.element.style.transform = 'scale(1)';
            bead.state = 'inactive';
        });
        
        // Callback
        if (triggerCallback && typeof this.options.onReset === 'function') {
            this.options.onReset();
        }
        
        return this;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 6: PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────
    
    getCount() {
        return this.state.count;
    }
    
    getCompletedMalas() {
        return this.state.completedMalas;
    }
    
    getProgress() {
        return {
            count: this.state.count,
            total: this.options.beadCount,
            percentage: (this.state.count / this.options.beadCount) * 100,
            completedMalas: this.state.completedMalas
        };
    }
    
    setJaap(jaap) {
        this.state.currentJaap = jaap;
        return this;
    }
    
    setBeadCount(count) {
        if (![27, 54, 108].includes(count)) {
            console.warn('Invalid bead count. Using 108.');
            count = 108;
        }
        
        this.options.beadCount = count;
        this.reset(false);
        
        // Recreate beads
        const beadsGroup = this.svg.querySelector('.mala-beads-group');
        if (beadsGroup) beadsGroup.remove();
        
        const sumeru = this.svg.querySelector('.mala-sumeru');
        if (sumeru) sumeru.remove();
        
        this.createBeads();
        this.createSumeruBead();
        this.bindEvents();
        
        return this;
    }
    
    destroy() {
        if (this.svg) {
            this.svg.remove();
        }
        this.beads = [];
        this.svg = null;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MalaCounter;
}

if (typeof window !== 'undefined') {
    window.MalaCounter = MalaCounter;
}