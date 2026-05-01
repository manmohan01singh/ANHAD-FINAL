/**
 * OPTICAL LIQUID GLASS PHYSICS ENGINE
 * Implements real glass physics: refraction, Fresnel effects, caustics, chromatic aberration
 * Creates 3D space with dynamic light source that responds to user interaction
 */

class OpticalLiquidGlass {
  constructor() {
    this.lightSource = {
      x: 75, // Upper right positioning
      y: 25,
      intensity: 1,
      color: { r: 255, g: 255, b: 255, a: 0.9 }
    };
    
    this.pointer = { x: 50, y: 50 };
    this.tilt = { x: 0, y: 0 };
    this.scroll = { progress: 0, y: 0 };

    this.motion = {
      intensity: 0,
      velocity: 0,
      lastY: window.pageYOffset || document.documentElement.scrollTop || 0,
      lastTime: performance.now()
    };

    this.svgFilters = {
      displacement: null,
      turbulence: null
    };
    
    this.springPhysics = {
      stiffness: 400,
      damping: 25,
      mass: 1.0,
      velocity: { x: 0, y: 0 },
      overshoot: 0.15
    };
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.cacheSVGFilters();
    this.enableGlassRipples();
    this.startAnimationLoop();
    this.updateCSSVariables();
  }

  cacheSVGFilters() {
    this.svgFilters.displacement = document.getElementById('glassRefractionDisplacement');
    this.svgFilters.turbulence = document.getElementById('glassRefractionNoise');
  }
  
  setupEventListeners() {
    // Pointer tracking for 3D light source positioning
    document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    
    // Device orientation for tilt effects
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => this.handleDeviceTilt(e));
    }
    
    // Scroll tracking for liquid motion
    let ticking = false;
    const updateScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', updateScroll, { passive: true });
    
    // Window resize for responsive updates
    window.addEventListener('resize', () => this.updateCSSVariables());
  }
  
  handlePointerMove(e) {
    const target = this.springPhysics;
    const current = this.pointer;
    
    // Calculate spring physics for smooth organic motion
    const deltaX = (e.clientX / window.innerWidth * 100) - current.x;
    const deltaY = (e.clientY / window.innerHeight * 100) - current.y;
    
    // Spring force calculation
    const springX = target.stiffness * deltaX;
    const springY = target.stiffness * deltaY;
    
    // Damping force
    const dampX = -target.damping * target.velocity.x;
    const dampY = -target.damping * target.velocity.y;
    
    // Update velocity
    target.velocity.x += (springX + dampX) / target.mass;
    target.velocity.y += (springY + dampY) / target.mass;
    
    // Update position with velocity
    current.x += target.velocity.x * 0.016; // 60fps timestep
    current.y += target.velocity.y * 0.016;
    
    // Apply overshoot and settling
    current.x += deltaX * target.overshoot;
    current.y += deltaY * target.overshoot;
    
    this.updateLightSource();
  }
  
  handleTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.handlePointerMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }
  }
  
  handleDeviceTilt(e) {
    if (e.beta !== null && e.gamma !== null) {
      // Convert device orientation to tilt angles
      this.tilt.x = Math.max(-45, Math.min(45, e.gamma));
      this.tilt.y = Math.max(-45, Math.min(45, e.beta));
      
      this.updateLightSource();
    }
  }
  
  handleScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

    this.updateMotionFromScroll(scrollY);
    
    // Apply spring physics to scroll for organic settling
    const scrollDelta = progress - this.scroll.progress;
    this.scroll.progress += scrollDelta * 0.1; // Smooth settling
    this.scroll.y = scrollY;
    
    this.updateCSSVariables();
  }
  
  updateLightSource() {
    // Dynamic light source that responds to user interaction
    const pointerInfluence = 0.3; // How much pointer affects light
    const tiltInfluence = 0.2; // How much tilt affects light
    
    // Calculate dynamic light position
    const baseX = 75; // Upper right default
    const baseY = 25;
    
    const pointerOffsetX = (this.pointer.x - 50) * pointerInfluence;
    const pointerOffsetY = (this.pointer.y - 50) * pointerInfluence;
    
    const tiltOffsetX = this.tilt.x * tiltInfluence;
    const tiltOffsetY = this.tilt.y * tiltInfluence;
    
    this.lightSource.x = baseX + pointerOffsetX + tiltOffsetX;
    this.lightSource.y = baseY + pointerOffsetY + tiltOffsetY;
    
    // Dynamic intensity based on interaction
    const distance = Math.sqrt(
      Math.pow(this.pointer.x - 50, 2) + 
      Math.pow(this.pointer.y - 50, 2)
    );
    this.lightSource.intensity = Math.max(0.7, Math.min(1.5, 1 + (distance / 100) * 0.5));
    
    this.updateCSSVariables();
  }

  updateMotionFromScroll(scrollY) {
    const now = performance.now();
    const dt = Math.max(16, now - this.motion.lastTime);
    const dy = Math.abs(scrollY - this.motion.lastY);
    const velocity = (dy / dt) * 1000;

    this.motion.velocity = this.motion.velocity * 0.82 + velocity * 0.18;

    const intensity = Math.min(this.motion.velocity / 2800, 1);
    this.motion.intensity = this.motion.intensity * 0.8 + intensity * 0.2;

    this.motion.lastY = scrollY;
    this.motion.lastTime = now;

    this.updateRefractionFilter();
  }

  updateRefractionFilter() {
    const displacement = this.svgFilters.displacement;
    const turbulence = this.svgFilters.turbulence;
    if (!displacement || !turbulence) return;

    const scale = 2 + this.motion.intensity * 11;
    const freq = 0.010 + this.motion.intensity * 0.020;
    const octaves = this.motion.intensity > 0.5 ? 3 : 2;

    displacement.setAttribute('scale', String(scale));
    turbulence.setAttribute('baseFrequency', String(freq));
    turbulence.setAttribute('numOctaves', String(octaves));
  }

  enableGlassRipples() {
    const selector = '.modal__container, .ios-glass, .bento-card, .action-btn, .verse, .control-toggle, .back-btn, .settings-btn, .settings-panel, .settings-panel__content, .bani-card__link, .gutka-nav__back, .settings-toggle, .glass-card, .event-row, .filter-chip, .view-btn, .icon-pill';

    document.addEventListener(
      'pointerdown',
      (e) => {
        const target = e.target.closest(selector);
        if (!target) return;
        this.spawnRipple(target, e.clientX, e.clientY);
      },
      { passive: true }
    );
  }

  spawnRipple(container, clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.3;

    const ripple = document.createElement('span');
    ripple.className = 'glass-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    container.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 750);
  }
  
  updateCSSVariables() {
    const root = document.documentElement;
    
    // Update 3D light source position
    root.style.setProperty('--light-x', `${this.lightSource.x}%`);
    root.style.setProperty('--light-y', `${this.lightSource.y}%`);
    root.style.setProperty('--light-intensity', this.lightSource.intensity);

    const angle = Math.atan2(this.lightSource.y - 50, this.lightSource.x - 50) * (180 / Math.PI) + 135;
    root.style.setProperty('--light-angle', `${angle}deg`);
    
    // Update pointer tracking
    root.style.setProperty('--pointer-x', `${this.pointer.x}%`);
    root.style.setProperty('--pointer-y', `${this.pointer.y}%`);
    
    // Update device tilt
    root.style.setProperty('--tilt-x', `${this.tilt.x}deg`);
    root.style.setProperty('--tilt-y', `${this.tilt.y}deg`);
    
    // Update scroll progress
    root.style.setProperty('--scroll-progress', this.scroll.progress);
    root.style.setProperty('--scroll-y', `${this.scroll.y}px`);

    root.style.setProperty('--motion-intensity', this.motion.intensity);
    
    // Calculate and update refraction shifts
    const refractionX = (this.pointer.x - 50) * 0.1;
    const refractionY = (this.pointer.y - 50) * 0.1;
    root.style.setProperty('--refraction-shift-x', `${refractionX}%`);
    root.style.setProperty('--refraction-shift-y', `${refractionY}%`);
    
    // Update caustic rotation based on scroll and interaction
    const causticRotation = this.scroll.progress * 360 + (this.pointer.x * 3.6);
    root.style.setProperty('--caustic-rotation', `${causticRotation}deg`);
    
    // Dynamic Fresnel calculations based on viewing angle
    const viewingAngle = Math.atan2(this.pointer.y - 50, this.pointer.x - 50);
    const fresnelStrength = Math.pow(Math.cos(viewingAngle), 2) * this.springPhysics.overshoot;
    root.style.setProperty('--fresnel-strength', fresnelStrength);
    
    // Chromatic aberration intensity based on light angle
    const chromaticIntensity = Math.min(0.35, Math.abs(Math.sin(viewingAngle)) * 0.15 + this.motion.intensity * 0.14);
    root.style.setProperty('--chromatic-intensity', chromaticIntensity);
  }
  
  startAnimationLoop() {
    const animate = () => {
      // Continue spring physics simulation
      if (Math.abs(this.springPhysics.velocity.x) > 0.01 || 
          Math.abs(this.springPhysics.velocity.y) > 0.01) {
        
        // Apply damping to velocity
        this.springPhysics.velocity.x *= 0.95;
        this.springPhysics.velocity.y *= 0.95;
        
        this.updateCSSVariables();
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
}

// Initialize optical liquid glass system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OpticalLiquidGlass();
});

// Export for potential external use
window.OpticalLiquidGlass = OpticalLiquidGlass;
