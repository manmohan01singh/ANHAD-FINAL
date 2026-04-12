/**
 * ANHAD EXTREME CLEAN — iOS 26+ Divine Experience
 * Only: Time-aware Darbar Sahib + Extreme Dynamic Island + Insane Touch FX
 */

class AnhadExtreme {
  constructor() {
    this.audio = null;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.isPlaying = false;
    this.island = null;
    this.isExpanded = false;
    this.touchEffects = [];
    this.particles = [];
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.detectTimeOfDay();
    this.initIsland();
    this.initAudio();
    this.initTouchEffects();
    this.initParticles();
    this.initParallax();
    this.startAutoKirtan();
  }

  cacheElements() {
    this.audio = document.getElementById('kirtan-audio');
    this.island = document.getElementById('extreme-island');
    this.playBtn = document.getElementById('extreme-play');
    this.closeBtn = document.querySelector('.full-close');
    this.visualizer = document.getElementById('extreme-visualizer');
    this.fxCanvas = document.getElementById('extreme-fx');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TIME DETECTION
  // ════════════════════════════════════════════════════════════════════════════
  
  detectTimeOfDay() {
    const hour = new Date().getHours();
    const times = {
      amritvela: [0, 4],
      morning: [4, 7],
      day: [7, 17],
      evening: [17, 19],
      night: [19, 24]
    };
    
    let currentTime = 'day';
    for (const [time, [start, end]] of Object.entries(times)) {
      if (hour >= start && hour < end) {
        currentTime = time;
        break;
      }
    }
    
    document.body.setAttribute('data-time', currentTime);
    
    document.querySelectorAll('.bg-image').forEach(img => {
      img.classList.toggle('active', img.dataset.time === currentTime);
    });
    
    console.log(`🌅 ANHAD: ${currentTime.toUpperCase()} (${hour}:00)`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // EXTREME DYNAMIC ISLAND
  // ════════════════════════════════════════════════════════════════════════════
  
  initIsland() {
    if (!this.island) return;
    
    // Tap to expand/collapse
    this.island.addEventListener('click', (e) => {
      if (e.target.closest('.full-close, .control-main')) return;
      this.isExpanded ? this.collapseIsland() : this.expandIsland();
    });
    
    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.collapseIsland();
      });
    }
    
    // Play/Pause
    if (this.playBtn) {
      this.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleKirtan();
      });
    }
    
    // Touch gestures
    let startY = 0;
    let startTime = 0;
    
    this.island.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
      this.island.style.transition = 'none';
    }, { passive: true });
    
    this.island.addEventListener('touchmove', (e) => {
      const deltaY = e.touches[0].clientY - startY;
      if (!this.isExpanded && deltaY < 0) {
        this.island.style.transform = `translateX(-50%) translateY(${deltaY * 0.3}px)`;
      } else if (this.isExpanded && deltaY > 0) {
        this.island.style.transform = `translateX(-50%) translateY(${deltaY * 0.3}px)`;
      }
    }, { passive: true });
    
    this.island.addEventListener('touchend', (e) => {
      const deltaY = e.changedTouches[0].clientY - startY;
      const deltaTime = Date.now() - startTime;
      
      this.island.style.transition = '';
      this.island.style.transform = 'translateX(-50%)';
      
      if (this.isExpanded && (deltaY > 50 || (deltaTime < 300 && deltaY > 20))) {
        this.collapseIsland();
      } else if (!this.isExpanded && (deltaY < -30 || (deltaTime < 300 && deltaY < -15))) {
        this.expandIsland();
      }
    });
  }

  expandIsland() {
    if (this.isExpanded) return;
    this.isExpanded = true;
    this.island.classList.add('island-expanded');
    this.island.classList.remove('island-collapsed');
    
    // Haptic visual feedback
    this.createTouchRipple(window.innerWidth / 2, this.island.getBoundingClientRect().top + 24, true);
  }

  collapseIsland() {
    if (!this.isExpanded) return;
    this.isExpanded = false;
    this.island.classList.remove('island-expanded');
    this.island.classList.add('island-collapsed');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AUDIO — Auto-Start Kirtan
  // ════════════════════════════════════════════════════════════════════════════
  
  initAudio() {
    if (!this.audio) return;
    
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      document.body.classList.add('audio-playing');
      document.body.classList.remove('audio-paused');
      this.startVisualizer();
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      document.body.classList.remove('audio-playing');
      document.body.classList.add('audio-paused');
    });
  }

  async startAutoKirtan() {
    const autoPlay = localStorage.getItem('anhad_autoplay') !== 'false';
    if (!autoPlay) return;
    
    setTimeout(async () => {
      try {
        await this.audio.play();
        console.log('🎵 ANHAD: Kirtan started');
      } catch {
        console.log('🔇 Auto-play blocked, waiting for interaction');
      }
    }, 1000);
  }

  async toggleKirtan() {
    if (!this.audio) return;
    
    if (this.audio.paused) {
      try {
        await this.audio.play();
        // Resume audio context
        if (this.audioContext?.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (err) {
        console.warn('Play failed:', err);
      }
    } else {
      this.audio.pause();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AUDIO VISUALIZER — Real-time Waveform
  // ════════════════════════════════════════════════════════════════════════════
  
  async startVisualizer() {
    if (!this.visualizer) return;
    
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      
      const source = this.audioContext.createMediaElementSource(this.audio);
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const ctx = this.visualizer.getContext('2d');
    this.visualizer.width = this.visualizer.offsetWidth;
    this.visualizer.height = this.visualizer.offsetHeight;
    
    const barCount = 20;
    const barWidth = (this.visualizer.width / barCount) - 2;
    
    const draw = () => {
      if (!this.isPlaying) {
        ctx.clearRect(0, 0, this.visualizer.width, this.visualizer.height);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 2);
          const y = (this.visualizer.height - 4) / 2;
          ctx.fillRect(x, y, barWidth, 4);
        }
        return;
      }
      
      this.analyser.getByteFrequencyData(this.dataArray);
      ctx.clearRect(0, 0, this.visualizer.width, this.visualizer.height);
      
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor(i * (this.dataArray.length / barCount));
        const value = this.dataArray[idx];
        const percent = value / 255;
        const height = percent * this.visualizer.height * 0.8;
        
        const x = i * (barWidth + 2);
        const y = (this.visualizer.height - height) / 2;
        
        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, 'rgba(212, 168, 83, 0.4)');
        gradient.addColorStop(0.5, 'rgba(212, 168, 83, 0.9)');
        gradient.addColorStop(1, 'rgba(212, 168, 83, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, height);
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INSANE TOUCH EFFECTS — Golden Ripples, Particles, Light Bursts
  // ════════════════════════════════════════════════════════════════════════════
  
  initTouchEffects() {
    const canvas = this.fxCanvas;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Touch anywhere creates ripples
    const handleTouch = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      const x = touch.clientX;
      const y = touch.clientY;
      
      // Check if touching island or button
      if (e.target.closest('#extreme-island, .enter-floating')) return;
      
      this.createTouchRipple(x, y);
      this.createLightBurst(x, y);
      
      // Also toggle kirtan on background tap
      if (e.type === 'click') {
        this.toggleKirtan();
      }
    };
    
    document.addEventListener('touchstart', handleTouch, { passive: true });
    document.addEventListener('click', handleTouch);
    
    // Animate effects
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw ripples
      this.touchEffects = this.touchEffects.filter(effect => {
        effect.update();
        effect.draw(ctx);
        return effect.alive;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  createTouchRipple(x, y, isBig = false) {
    const count = isBig ? 3 : 1;
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.touchEffects.push(new GoldenRipple(x, y, isBig));
      }, i * 100);
    }
  }

  createLightBurst(x, y) {
    // Add golden particles bursting from touch point
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.touchEffects.push(new LightParticle(x, y, angle));
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FLOATING PARTICLES — Ambient Golden Dust
  // ════════════════════════════════════════════════════════════════════════════
  
  initParticles() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0.6;';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particleCount = 25;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * 0.3 + 0.1,
        speedX: Math.random() * 0.2 - 0.1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;
        
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 83, ${p.opacity})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PARALLAX — 3D Depth on Mouse Move
  // ════════════════════════════════════════════════════════════════════════════
  
  initParallax() {
    const bg = document.getElementById('cinematic-bg');
    const orbs = document.querySelectorAll('.orb');
    const center = document.getElementById('sacred-center');
    
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    
    // Smooth parallax animation
    const animate = () => {
      currentX += (mouseX - currentX) * 0.05;
      currentY += (mouseY - currentY) * 0.05;
      
      // Background moves opposite to mouse
      if (bg) {
        bg.style.transform = `translate(${currentX * -15}px, ${currentY * -15}px) scale(1.05)`;
      }
      
      // Orbs move with different depths
      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 8;
        orb.style.transform = `translate(${currentX * depth}px, ${currentY * depth}px)`;
      });
      
      // Center text moves slightly
      if (center) {
        center.style.transform = `translate(calc(-50% + ${currentX * 5}px), calc(-50% + ${currentY * 5}px))`;
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EFFECT CLASSES
// ════════════════════════════════════════════════════════════════════════════

class GoldenRipple {
  constructor(x, y, isBig = false) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = isBig ? 200 : 120;
    this.opacity = isBig ? 0.8 : 0.6;
    this.speed = isBig ? 6 : 4;
    this.alive = true;
    this.isBig = isBig;
  }

  update() {
    this.radius += this.speed;
    this.opacity -= 0.02;
    
    if (this.opacity <= 0) {
      this.alive = false;
    }
  }

  draw(ctx) {
    // Main ripple
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(212, 168, 83, ${this.opacity})`;
    ctx.lineWidth = this.isBig ? 3 : 2;
    ctx.stroke();
    
    // Inner glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${this.opacity * 0.5})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Outer faint
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(212, 168, 83, ${this.opacity * 0.2})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

class LightParticle {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = Math.random() * 3 + 2;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.life = 1;
    this.decay = 0.03;
    this.size = Math.random() * 3 + 2;
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.size *= 0.95;
    
    if (this.life <= 0 || this.size < 0.5) {
      this.alive = false;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${this.life})`;
    ctx.fill();
    
    // Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${this.life * 0.3})`;
    ctx.fill();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INITIALIZE
// ════════════════════════════════════════════════════════════════════════════

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.anhad = new AnhadExtreme();
  });
} else {
  window.anhad = new AnhadExtreme();
}
