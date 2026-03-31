/* ═══════════════════════════════════════════════════════════════════════════════
   ANHAD — ULTRA AMBIENT EFFECTS
   Advanced particle systems, cursor effects, and ambient animations
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

const UltraAmbientEffects = {
  canvas: null,
  ctx: null,
  particles: [],
  mouseX: 0,
  mouseY: 0,
  isTouch: false,
  animationFrame: null,

  init() {
    this.isTouch = 'ontouchstart' in window;
    this.createCanvas();
    this.initMouseTracking();
    this.initClickEffects();
    this.initHoverEffects();
    this.startAnimation();
  },

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'particle-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });
  },

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(dpr, dpr);
  },

  initMouseTracking() {
    if (this.isTouch) return;

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      // Create trailing particles on mouse move
      if (Math.random() > 0.7) {
        this.createParticle(e.clientX, e.clientY, 'trail');
      }
    }, { passive: true });
  },

  initClickEffects() {
    const createBurst = (x, y) => {
      // Create burst of particles
      const particleCount = this.isTouch ? 12 : 20;
      for (let i = 0; i < particleCount; i++) {
        this.createParticle(x, y, 'burst');
      }
      
      // Create expanding ring
      this.createRing(x, y);
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
  },

  initHoverEffects() {
    // Add glow effect to interactive elements
    const interactiveElements = document.querySelectorAll(
      '.hero-card, .practice-card, .quick-card, .nav-tab, button'
    );

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        if (this.isTouch) return;
        const rect = el.getBoundingClientRect();
        this.createGlow(rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    });
  },

  createParticle(x, y, type = 'default') {
    const particle = {
      x,
      y,
      vx: 0,
      vy: 0,
      size: 2,
      life: 60,
      maxLife: 60,
      hue: 35 + Math.random() * 20,
      alpha: 1,
      type
    };

    switch (type) {
      case 'burst':
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed - 1;
        particle.size = 2 + Math.random() * 3;
        particle.life = 40;
        particle.maxLife = 40;
        break;
        
      case 'trail':
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = Math.random() * 2;
        particle.size = 1 + Math.random() * 2;
        particle.life = 30;
        particle.maxLife = 30;
        break;
        
      case 'ambient':
        particle.vx = (Math.random() - 0.5) * 0.5;
        particle.vy = -0.5 - Math.random() * 0.5;
        particle.size = 1 + Math.random();
        particle.life = 120;
        particle.maxLife = 120;
        break;
    }

    this.particles.push(particle);
  },

  createRing(x, y) {
    const ring = {
      x,
      y,
      radius: 0,
      maxRadius: 50,
      life: 30,
      maxLife: 30,
      type: 'ring'
    };
    this.particles.push(ring);
  },

  createGlow(x, y) {
    const glow = {
      x,
      y,
      radius: 0,
      maxRadius: 80,
      life: 20,
      maxLife: 20,
      type: 'glow'
    };
    this.particles.push(glow);
  },

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      if (p.type === 'ring') {
        p.radius += (p.maxRadius - p.radius) * 0.2;
        p.life--;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
        continue;
      }
      
      if (p.type === 'glow') {
        p.radius += (p.maxRadius - p.radius) * 0.15;
        p.life--;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
        continue;
      }

      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Apply gravity
      p.vy += 0.05;
      
      // Apply air resistance
      p.vx *= 0.98;
      p.vy *= 0.98;
      
      // Update life
      p.life--;
      p.alpha = p.life / p.maxLife;

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      if (p.type === 'ring') {
        const alpha = p.life / p.maxLife;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `hsla(40, 90%, 60%, ${alpha * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        return;
      }
      
      if (p.type === 'glow') {
        const alpha = p.life / p.maxLife;
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, `hsla(40, 90%, 60%, ${alpha * 0.3})`);
        gradient.addColorStop(0.5, `hsla(40, 90%, 60%, ${alpha * 0.1})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        return;
      }

      // Draw regular particles
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
      this.ctx.fill();
      
      // Add glow
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${p.alpha * 0.5})`;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  },

  generateAmbientParticles() {
    // Generate ambient particles occasionally
    if (Math.random() > 0.95 && this.particles.length < 50) {
      const x = Math.random() * window.innerWidth;
      const y = window.innerHeight + 20;
      this.createParticle(x, y, 'ambient');
    }
  },

  startAnimation() {
    const animate = () => {
      this.updateParticles();
      this.drawParticles();
      this.generateAmbientParticles();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  },

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let loader finish
    setTimeout(() => {
      UltraAmbientEffects.init();
    }, 2500);
  });
} else {
  setTimeout(() => {
    UltraAmbientEffects.init();
  }, 2500);
}

window.UltraAmbientEffects = UltraAmbientEffects;
