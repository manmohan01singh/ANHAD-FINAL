/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Interactions System
   Magnetic search, tilt, press, worm pills, voice, favorites,
   hukamnama flip, bento entrance, section reveals, haptics
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const Interactions = {
  init() {
    this._magneticSearch();
    this._cyclingPlaceholder();
    this._voiceSearch();
    this._wormPills();
    this._heroTilt();
    this._heroFav();
    this._listenerCount();
    this._hukamnamaFlip();
    this._bentoEntrance();
    this._bentoPress();
    this._sectionHeadingReveal();
    this._sadhanaRing();
    this._segmentBar();
    this._navSpring();
  },

  /* Item 14: Magnetic Search Bar */
  _magneticSearch() {
    const bar = document.querySelector('.search-bar');
    if (!bar) return;
    const container = bar.parentElement;
    container.addEventListener('mousemove', e => {
      const r = bar.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        const f = Math.max(0, (120 - dist) / 120);
        const mx = (dx / dist) * f * 6;
        const my = (dy / dist) * f * 6;
        bar.style.transform = `translate3d(${mx}px,${my}px,0)`;
      } else {
        bar.style.transform = 'translate3d(0,0,0)';
      }
    }, { passive: true });
    container.addEventListener('mouseleave', () => {
      bar.style.transform = 'translate3d(0,0,0)';
    }, { passive: true });
  },

  /* Item 15: Cycling Placeholder */
  _cyclingPlaceholder() {
    const el = document.querySelector('.search-placeholder');
    const input = document.querySelector('.search-input');
    if (!el || !input) return;
    const suggestions = [
      'ਗੁਰਬਾਣੀ ਖੋਜੋ...', 'Search shabads...',
      'ਰਾਗ ਭੈਰਵੀ...', 'Japji Sahib Ji...', 'ਸੁਖਮਨੀ ਸਾਹਿਬ...',
    ];
    let idx = 0;
    el.textContent = suggestions[0];
    const intervalId = setInterval(() => {
      el.style.opacity = '0';
      setTimeout(() => {
        idx = (idx + 1) % suggestions.length;
        el.textContent = suggestions[idx];
        el.style.opacity = '1';
      }, 400);
    }, 3500);
    
    // Cleanup on pagehide
    window.addEventListener('pagehide', () => {
      clearInterval(intervalId);
    }, { once: true });
    
    input.addEventListener('focus', () => { el.style.opacity = '0'; });
    input.addEventListener('blur', () => { if (!input.value) el.style.opacity = '1'; });
    input.addEventListener('input', () => { el.style.opacity = input.value ? '0' : '1'; });
  },

  /* Item 16: Voice Search */
  _voiceSearch() {
    const btn = document.getElementById('micBtn');
    const wave = document.querySelector('.voice-waveform');
    const input = document.querySelector('.search-input');
    if (!btn || !input) return;

    let recognition;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pa-IN';
    }

    btn.addEventListener('click', () => {
      if (!recognition) return;
      btn.classList.toggle('recording');
      if (wave) wave.classList.toggle('active');
      if (btn.classList.contains('recording')) {
        recognition.start();
        if (navigator.vibrate) navigator.vibrate(8);
      } else {
        recognition.stop();
      }
    });

    if (recognition) {
      recognition.onresult = e => {
        const text = e.results[0][0].transcript;
        input.value = text;
        input.dispatchEvent(new Event('input'));
        btn.classList.remove('recording');
        if (wave) wave.classList.remove('active');
      };
      recognition.onerror = () => {
        btn.classList.remove('recording');
        if (wave) wave.classList.remove('active');
      };
      recognition.onend = () => {
        btn.classList.remove('recording');
        if (wave) wave.classList.remove('active');
      };
    }
  },

  /* Item 17: Worm Pills */
  _wormPills() {
    const pills = document.querySelectorAll('.category-pill');
    const worm = document.querySelector('.worm-pill');
    if (!pills.length || !worm) return;

    const moveTo = (pill) => {
      const nav = pill.parentElement;
      const navR = nav.getBoundingClientRect();
      const pillR = pill.getBoundingClientRect();
      worm.style.left = (pillR.left - navR.left) + 'px';
      worm.style.width = pillR.width + 'px';
    };

    const activePill = document.querySelector('.category-pill.active') || pills[0];
    if (activePill) {
      activePill.classList.add('active');
      requestAnimationFrame(() => moveTo(activePill));
    }

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        moveTo(pill);
        if (navigator.vibrate) navigator.vibrate(5);
      });
    });
  },

  /* Item 24: Hero Card Tilt */
  _heroTilt() {
    const cards = document.querySelectorAll('.hero-card-v2');
    cards.forEach(card => {
      const shine = card.querySelector('.tilt-shine');
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(1200px) rotateX(${-y*12}deg) rotateY(${x*12}deg) scale(1.02)`;
        if (shine) {
          shine.style.background =
            `radial-gradient(circle at ${(x+0.5)*100}% ${(y+0.5)*100}%,rgba(255,255,255,0.18) 0%,transparent 60%)`;
        }
      }, { passive: true });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) scale(1)';
        card.style.transition = 'transform 600ms cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => card.style.transition = '', 600);
      }, { passive: true });
    });
  },

  /* Item 22: Heart Favourite */
  _heroFav() {
    const btns = document.querySelectorAll('.fav-btn');
    btns.forEach(btn => {
      const key = 'anhad_fav_' + (btn.dataset.id || 'hero');
      if (localStorage.getItem(key) === 'true') btn.classList.add('active');

      btn.addEventListener('click', e => {
        e.stopPropagation();
        const isActive = btn.classList.toggle('active');
        localStorage.setItem(key, isActive);
        btn.classList.add('pop');
        setTimeout(() => btn.classList.remove('pop'), 400);
        if (isActive) this._burstHearts(btn);
        if (navigator.vibrate) navigator.vibrate(8);
      });
    });
  },

  _burstHearts(origin) {
    const r = origin.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      p.style.background = '#D4860A';
      p.style.left = (r.left + r.width/2) + 'px';
      p.style.top = (r.top + r.height/2) + 'px';
      const angle = (i / 8) * Math.PI * 2;
      const dist = 20 + Math.random() * 20;
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      // Add parent existence check before DOM mutation
      if (!document.body || !document.body.isConnected) return;
      document.body.appendChild(p);
      setTimeout(() => {
        if (p && p.isConnected) p.remove();
      }, 600);
    }
  },

  /* Item 23: Listener Count */
  _listenerCount() {
    const el = document.getElementById('listenerCount');
    if (!el) return;
    let count = 12400;
    const update = () => {
      const target = count + Math.floor((Math.random() - 0.5) * 100);
      this._animateCount(count, target, el);
      count = target;
    };
    el.textContent = count.toLocaleString() + ' listening';
    const intervalId = setInterval(update, 30000);
    
    // Cleanup on pagehide
    window.addEventListener('pagehide', () => {
      clearInterval(intervalId);
    }, { once: true });
  },

  _animateCount(from, to, el) {
    const diff = to - from;
    const duration = 800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + diff * ease).toLocaleString() + ' listening';
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  /* Item 28: Hukamnama Flip */
  _hukamnamaFlip() {
    const card = document.querySelector('.hukamnama-card');
    if (!card) return;
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      if (navigator.vibrate) navigator.vibrate(8);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lines = card.querySelectorAll('.hukamnama-verse .line');
          lines.forEach((line, i) => {
            setTimeout(() => {
              line.classList.add('revealed');
              // Use animation-play-state for smooth animations
              line.style.animationPlayState = 'running';
            }, i * 150);
          });
          observer.unobserve(card);
        } else {
          // Pause animations when not visible
          const lines = card.querySelectorAll('.hukamnama-verse .line');
          lines.forEach(line => {
            line.style.animationPlayState = 'paused';
          });
        }
      });
    }, { threshold: 0, rootMargin: '50px' });
    observer.observe(card);
    
    // Cleanup on pagehide
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  },

  /* Item 32: Bento Entrance Stagger */
  _bentoEntrance() {
    const items = document.querySelectorAll('.bento-item');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0');
          setTimeout(() => {
            entry.target.classList.add('entered');
            // Use animation-play-state instead of DOM removal for performance
            entry.target.style.animationPlayState = 'running';
          }, delay);
          observer.unobserve(entry.target);
        } else {
          // Pause animation when not visible instead of removing from DOM
          entry.target.style.animationPlayState = 'paused';
        }
      });
    }, { threshold: 0, rootMargin: '50px' });
    items.forEach((item, i) => {
      item.dataset.delay = i * 80;
      // Initialize with paused state
      item.style.animationPlayState = 'paused';
      observer.observe(item);
    });
    
    // Cleanup on pagehide
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  },

  /* Item 33: Press Haptic */
  _bentoPress() {
    document.querySelectorAll('.bento-item').forEach(item => {
      item.addEventListener('pointerdown', () => {
        item.classList.add('pressing');
        item.style.transform = 'scale(0.96)';
        if (navigator.vibrate) navigator.vibrate(8);
      });
      const release = () => {
        item.classList.remove('pressing');
        item.style.transform = '';
        setTimeout(() => { item.style.transform = 'scale(1.02)'; }, 50);
        setTimeout(() => { item.style.transform = ''; }, 200);
      };
      item.addEventListener('pointerup', release);
      item.addEventListener('pointerleave', release);
    });
  },

  /* Item 47: Section Heading Reveal */
  _sectionHeadingReveal() {
    const headings = document.querySelectorAll('.section-heading h3');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '700 22px Inter, system-ui, sans-serif';

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const h3 = entry.target;
          const text = h3.textContent.trim();
          const firstWord = text.split(' ')[0];
          const w = ctx.measureText(firstWord).width;
          h3.style.setProperty('--underline-w', w + 'px');
          h3.classList.add('revealed');
          // Use animation-play-state for smooth reveal
          h3.style.animationPlayState = 'running';
          observer.unobserve(h3);
        } else {
          // Pause animation when not visible
          entry.target.style.animationPlayState = 'paused';
        }
      });
    }, { threshold: 0, rootMargin: '50px' });
    headings.forEach(h => {
      // Initialize with paused state
      h.style.animationPlayState = 'paused';
      observer.observe(h);
    });
    
    // Cleanup on pagehide
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  },

  /* Item 40: Sadhana Progress Ring */
  _sadhanaRing() {
    const fill = document.getElementById('sadhanaRingFill');
    const text = document.getElementById('sadhanaRingText');
    if (!fill) return;
    const completed = parseInt(localStorage.getItem('anhad_sadhana_done') || '3');
    const total = 7;
    const pct = completed / total;
    const circumference = 2 * Math.PI * 35;
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            fill.style.strokeDashoffset = circumference * (1 - pct);
            // Use animation-play-state for smooth animation
            fill.style.animationPlayState = 'running';
          });
          if (text) text.textContent = Math.round(pct * 100) + '%';
          if (pct >= 1) {
            setTimeout(() => {
              fill.style.stroke = '#FFD700';
              fill.style.filter = 'drop-shadow(0 0 6px gold)';
            }, 1300);
          }
          observer.unobserve(entry.target);
        } else {
          // Pause animation when not visible
          fill.style.animationPlayState = 'paused';
        }
      });
    }, { threshold: 0, rootMargin: '50px' });
    const ringContainer = fill.closest('.sadhana-card') || fill;
    // Initialize with paused state
    fill.style.animationPlayState = 'paused';
    observer.observe(ringContainer);
    
    // Cleanup on pagehide
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  },

  /* Item 42: Segmented Progress Bar */
  _segmentBar() {
    const segments = document.querySelectorAll('.segment');
    segments.forEach((seg, i) => {
      const done = parseInt(localStorage.getItem('anhad_sadhana_done') || '3');
      if (i < done) seg.classList.add('done');
      else if (i === done) seg.classList.add('active');
    });
  },

  /* Item 44: Nav Spring Bounce */
  _navSpring() {
    const btns = document.querySelectorAll('.nav-pill-v2 .nav-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.Spring) {
          const spring = new Spring({ stiffness: 600, damping: 20, mass: 0.3, initialValue: 1 });
          spring.to(1.35, v => { btn.style.transform = `scale(${v})`; });
          setTimeout(() => {
            spring.to(1.0, v => { btn.style.transform = `scale(${v})`; });
          }, 120);
        }
        if (navigator.vibrate) navigator.vibrate(5);
      });
    });
  }
};

window.Interactions = Interactions;
