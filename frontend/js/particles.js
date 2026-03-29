/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Golden Dust Particle Trail (Item 46)
   Canvas overlay, click-triggered golden particle bursts
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const Particles = {
  canvas: null,
  ctx: null,
  particles: [],
  dpr: 1,

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'particle-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this._resize();
    window.addEventListener('resize', () => this._resize(), { passive: true });

    document.addEventListener('click', e => this._burst(e.clientX, e.clientY));
    document.addEventListener('touchend', e => {
      if (e.changedTouches.length) {
        const t = e.changedTouches[0];
        this._burst(t.clientX, t.clientY);
      }
    }, { passive: true });

    this._tick();
  },

  _resize() {
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  },

  _burst(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      const hue = 35 + Math.random() * 20;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 2,
        life: 40,
        maxLife: 40,
        hue,
      });
    }
  },

  _tick() {
    this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this._tick());
  }
};

window.Particles = Particles;
