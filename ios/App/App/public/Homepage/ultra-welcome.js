/* ═══════════════════════════════════════════════════════════════════════════════
   ANHAD — ULTRA PREMIUM WELCOME PAGE EFFECTS
   Spectacular loading, particles, and interactive animations
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

const UltraWelcome = {
  loader: null,
  progressFill: null,
  particleCanvas: null,
  particleCtx: null,
  particles: [],
  cursorGlow: null,
  minLoadTime: 2500,
  startTime: null,
  isTouch: false,

  init() {
    this.startTime = Date.now();
    this.isTouch = 'ontouchstart' in window;
    
    this.createLoader();
    this.createFloatingParticles();
    this.createParticleCanvas();
    
    if (!this.isTouch) {
      this.createCursorGlow();
    }
    
    this.startLoading();
  },

  createLoader() {
    const loaderHTML = `
      <div class="ultra-welcome-loader">
        <div class="ultra-welcome-loader__darbar"></div>
        <div class="ultra-welcome-loader__overlay"></div>
        <div class="ultra-welcome-loader__glow"></div>
        <div class="ultra-welcome-loader__logo">
          <img src="../assets/app-logo-384.png" alt="ANHAD">
        </div>
        <div class="ultra-welcome-loader__text">ANHAD</div>
        <div class="ultra-welcome-loader__progress">
          <div class="ultra-welcome-loader__progress-fill"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', loaderHTML);
    this.loader = document.querySelector('.ultra-welcome-loader');
    this.progressFill = document.querySelector('.ultra-welcome-loader__progress-fill');
  },

  createFloatingParticles() {
    const container = document.createElement('div');
    container.className = 'ultra-floating-particles';
    
    // REDUCED: Create 15 floating particles instead of 30
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'ultra-floating-particle';
      
      // Random positioning and timing
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 30 + 's';
      particle.style.animationDuration = (20 + Math.random() * 20) + 's';
      particle.style.width = (3 + Math.random() * 3) + 'px';
      particle.style.height = particle.style.width;
      
      container.appendChild(particle);
    }
    
    document.body.appendChild(container);
  },

  createParticleCanvas() {
    // REDUCED: Skip heavy canvas particles on mobile
    if (this.isTouch) {
      return;
    }
    
    this.particleCanvas = document.createElement('canvas');
    this.particleCanvas.className = 'ultra-particle-canvas';
    document.body.appendChild(this.particleCanvas);
    
    this.particleCtx = this.particleCanvas.getContext('2d');
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });
    
    // Start particle animation after loader
    setTimeout(() => {
      this.initInteractiveParticles();
    }, 3000);
  },

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.particleCanvas.width = window.innerWidth * dpr;
    this.particleCanvas.height = window.innerHeight * dpr;
    this.particleCanvas.style.width = window.innerWidth + 'px';
    this.particleCanvas.style.height = window.innerHeight + 'px';
    this.particleCtx.scale(dpr, dpr);
  },

  initInteractiveParticles() {
    // Click/touch burst effect - REDUCED particle count
    const createBurst = (x, y) => {
      const count = this.isTouch ? 8 : 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 2,
          life: 50,
          maxLife: 50,
          hue: 35 + Math.random() * 20,
          alpha: 1
        });
      }
    };

    document.addEventListener('click', (e) => {
      createBurst(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length) {
        const touch = e.changedTouches[0];
        createBurst(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    // Mouse move trail (desktop only) - REDUCED frequency
    if (!this.isTouch) {
      let lastX = 0, lastY = 0;
      document.addEventListener('mousemove', (e) => {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 15 && Math.random() > 0.8) {
          this.particles.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: 1 + Math.random() * 1.5,
            life: 25,
            maxLife: 25,
            hue: 35 + Math.random() * 20,
            alpha: 1
          });
        }
        
        lastX = e.clientX;
        lastY = e.clientY;
      }, { passive: true });
    }

    this.animateParticles();
  },

  animateParticles() {
    const animate = () => {
      this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);

      // Update and draw particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // Gravity
        p.vx *= 0.98; // Air resistance
        p.vy *= 0.98;
        p.life--;
        p.alpha = p.life / p.maxLife;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        // Draw particle
        this.particleCtx.beginPath();
        this.particleCtx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        this.particleCtx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
        this.particleCtx.shadowBlur = 10;
        this.particleCtx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${p.alpha * 0.5})`;
        this.particleCtx.fill();
        this.particleCtx.shadowBlur = 0;
      }

      requestAnimationFrame(animate);
    };
    animate();
  },

  createCursorGlow() {
    this.cursorGlow = document.createElement('div');
    this.cursorGlow.className = 'ultra-cursor-glow';
    document.body.appendChild(this.cursorGlow);

    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      this.cursorGlow.classList.add('active');
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.cursorGlow.classList.remove('active');
    });

    // Smooth follow animation
    const updateGlow = () => {
      currentX += (mouseX - currentX) * 0.1;
      currentY += (mouseY - currentY) * 0.1;
      
      this.cursorGlow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      requestAnimationFrame(updateGlow);
    };
    updateGlow();
  },

  async startLoading() {
    const resources = [
      this.preloadImages(),
      this.preloadFonts(),
      this.waitForDOM()
    ];

    try {
      await Promise.all(resources);
      await this.ensureMinLoadTime();
      this.hideLoader();
    } catch (error) {
      console.error('Loading error:', error);
      await this.ensureMinLoadTime();
      this.hideLoader();
    }
  },

  async preloadImages() {
    const images = [
      '../assets/darbar-sahib-day.webp',
      '../assets/Darbar-sahib-AMRITVELA.webp',
      '../assets/darbar-sahib-evening.webp',
      '../assets/app-logo-384.png'
    ];

    const promises = images.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });
    });

    await Promise.all(promises);
  },

  async preloadFonts() {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    return new Promise(resolve => setTimeout(resolve, 300));
  },

  async waitForDOM() {
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    return Promise.resolve();
  },

  async ensureMinLoadTime() {
    const elapsed = Date.now() - this.startTime;
    const remaining = this.minLoadTime - elapsed;
    
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
  },

  hideLoader() {
    if (!this.loader) return;

    this.loader.classList.add('hidden');

    setTimeout(() => {
      if (this.loader && this.loader.parentNode) {
        this.loader.parentNode.removeChild(this.loader);
      }
    }, 1000);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    UltraWelcome.init();
  });
} else {
  UltraWelcome.init();
}

window.UltraWelcome = UltraWelcome;
