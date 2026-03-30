/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Aurora Background System (Items 1–6)
   iOS-style colored orbs on cream background — ALWAYS LIGHT THEME
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const Aurora = {
  blobs: [
    { x:15, y:10, w:55, h:50, speed:0.0008, phase:0 },
    { x:65, y:5,  w:50, h:45, speed:0.0006, phase:2.1 },
    { x:40, y:60, w:45, h:40, speed:0.0009, phase:4.2 },
  ],
  layers: [],
  mouseX: 0.5, mouseY: 0.5,
  running: false,

  init() {
    this._createLayers();
    this._createNoise();
    this._setupMandana();
    this._createStars();
    this._setupParallax();
    this.running = true;
    requestAnimationFrame(t => this._tick(t));
  },

  _createLayers() {
    this.blobs.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = `aurora-layer aurora-layer--${i+1} parallax-layer`;
      el.setAttribute('aria-hidden','true');
      el.style.cssText = `left:${b.x}vw;top:${b.y}vh;`;
      document.body.prepend(el);
      this.layers.push(el);
    });
  },

  _createNoise() {
    const el = document.createElement('div');
    el.className = 'noise-overlay';
    el.setAttribute('aria-hidden','true');
    document.body.prepend(el);
  },

  _setupMandana() {
    const m = document.querySelector('.mandana-watermark');
    if (!m) return;
    m.classList.add('parallax-layer');
    window.addEventListener('scroll', () => {
      m.style.marginTop = (window.scrollY * 0.15) + 'px';
    }, { passive: true });
  },

  _createStars() {
    const h = new Date().getHours();
    if (h < 3 || h >= 6) return;
    const container = document.createElement('div');
    container.className = 'star-field active';
    container.setAttribute('aria-hidden','true');
    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = 1 + Math.random();
      star.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*60}%;animation:twinkle ${2+Math.random()*3}s ease-in-out ${Math.random()*3}s infinite;`;
      container.appendChild(star);
    }
    document.body.prepend(container);
  },

  _setupParallax() {
    document.addEventListener('mousemove', e => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
    }, { passive: true });
    if (window.DeviceMotionEvent && 'ontouchstart' in window) {
      window.addEventListener('deviceorientation', e => {
        if (e.gamma != null) {
          this.mouseX = (e.gamma + 45) / 90;
          this.mouseY = (e.beta + 45) / 90;
        }
      }, { passive: true });
    }
  },

  _tick(t) {
    if (!this.running) return;
    const dx = (this.mouseX - 0.5);
    const dy = (this.mouseY - 0.5);

    this.blobs.forEach((b, i) => {
      const x = b.x + Math.sin(t * b.speed + b.phase) * 8;
      const y = b.y + Math.cos(t * b.speed * 0.7 + b.phase) * 6;
      this.layers[i].style.transform = `translate3d(${x + dx*1.5}vw, ${y + dy*1.5}vh, 0)`;
    });

    const mandana = document.querySelector('.mandana-watermark');
    if (mandana) {
      mandana.style.left = `calc(50% + ${dx*2}vw)`;
      mandana.style.top = `calc(50% + ${dy*2}vh)`;
    }

    requestAnimationFrame(t2 => this._tick(t2));
  }
};

window.Aurora = Aurora;
