/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Explore Carousel (Items 34–39)
   Arc layout, blurred bg, scrubber, swipe momentum
   Enhanced for iOS Auto-Scroll Smoothness
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

class ExploreCarousel {
  constructor(container) {
    this.container = container;
    this.track = container.querySelector('.carousel-track');
    this.cards = [];
    this.scrubberDots = [];
    this.currentIndex = 0;
    this.autoplayTimer = null;
    this.bgBlur = container.querySelector('.carousel-bg-blur');

    this.data = [
      { title: 'Darbar Sahib Ji', subtitle: '24/7 Live Kirtan', img: 'assets/DARBAR.jpg', color: '#D4860A' },
      { title: 'Bangla Sahib Ji', subtitle: 'New Delhi', img: 'assets/bangla-sahib.jpg', color: '#3B82F6' },
      { title: 'Hazur Sahib Ji', subtitle: 'Nanded, Maharashtra', img: 'assets/hazur-sahib.jpg', color: '#8B5CF6' },
      { title: 'Patna Sahib Ji', subtitle: 'Bihar', img: 'assets/patna-sahib.jpg', color: '#10B981' },
      { title: 'Evening Kirtan', subtitle: 'Rehraas Sahib Ji', img: 'assets/darbar-sahib-evening.jpg', color: '#F59E0B' },
      { title: 'Amritvela', subtitle: 'Ambrosial Hours', img: 'assets/darbar-sahib-evening1.jpg', color: '#A855F7' },
      { title: 'Sacred Shrine', subtitle: 'Spiritual Journey', img: 'assets/shrine-image.webp', color: '#EF4444' },
    ];

    this._buildCards();
    this._buildScrubber();
    this._layoutArc();
    this._setupTouch();
    this._setupAutoplay();
    this._updateBackground();
  }

  _buildCards() {
    if (!this.track) return;
    this.data.forEach((d, i) => {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.innerHTML = `
        <img src="${d.img}" alt="${d.title} - ${d.subtitle}" loading="lazy" decoding="async">
        <div class="card-info"><h4>${d.title}</h4><p>${d.subtitle}</p></div>
        <div class="carousel-progress"></div>
      `;
      card.addEventListener('click', () => {
        this.goTo(i);
        if (navigator.vibrate) navigator.vibrate(5);
      });
      this.track.appendChild(card);
      this.cards.push(card);
    });
  }

  _buildScrubber() {
    const scrubber = this.container.querySelector('.thumb-scrubber');
    if (!scrubber) return;
    this.data.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'scrubber-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        this.goTo(i);
        if (navigator.vibrate) navigator.vibrate(2);
      });
      scrubber.appendChild(dot);
      this.scrubberDots.push(dot);
    });
  }

  /* Arc layout - smoother transitions */
  _layoutArc() {
    const center = this.currentIndex;
    const containerW = this.container.offsetWidth || 360;
    this.cards.forEach((card, i) => {
      const offset = i - center;
      const absOff = Math.abs(offset);
      let scale, ty, opacity, rz, tx;

      if (absOff === 0) {
        scale = 1; ty = 0; opacity = 1; rz = 0;
        tx = (containerW / 2) - 130;
      } else if (absOff === 1) {
        scale = 0.88; ty = -18; opacity = 0.65;
        rz = offset > 0 ? 3.5 : -3.5;
        tx = (containerW / 2) - 130 + offset * 200;
      } else if (absOff === 2) {
        scale = 0.76; ty = -28; opacity = 0.4;
        rz = offset > 0 ? 7 : -7;
        tx = (containerW / 2) - 130 + offset * 180;
      } else {
        scale = 0.65; ty = -36; opacity = 0;
        rz = offset > 0 ? 10 : -10;
        tx = (containerW / 2) - 130 + offset * 160;
      }

      card.style.transform = `translate3d(${tx}px,${ty}px,0) scale(${scale}) rotate(${rz}deg)`;
      card.style.opacity = opacity;
      card.style.zIndex = 10 - absOff;

      /* iOS Style Glow overlay */
      if (absOff === 0) {
        card.style.boxShadow = `0 24px 60px ${this.data[i].color}40, 0 4px 12px rgba(0,0,0,0.1)`;
      } else {
        card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
      }
    });

    this.scrubberDots.forEach((d, i) => {
      d.classList.toggle('active', i === center);
    });
  }

  goTo(idx) {
    this.currentIndex = Math.max(0, Math.min(idx, this.data.length - 1));
    this._layoutArc();
    this._updateBackground();
    this._restartAutoplay();
    this._restartProgress();
  }

  next() { this.goTo((this.currentIndex + 1) % this.data.length); }
  prev() { this.goTo((this.currentIndex - 1 + this.data.length) % this.data.length); }

  /* iOS Style smooth blurred background update */
  _updateBackground() {
    if (!this.bgBlur) return;
    const d = this.data[this.currentIndex];
    
    // Create new element for smooth crossfade
    const newBg = document.createElement('div');
    newBg.className = 'carousel-bg-blur';
    newBg.style.backgroundImage = `url(${d.img})`;
    newBg.style.opacity = '0';
    newBg.style.zIndex = '0';
    this.container.insertBefore(newBg, this.track);
    
    // Fade in new, fade out old
    requestAnimationFrame(() => {
      newBg.style.opacity = '0.08'; // very subtle in light mode
      if (this.bgBlur) {
        this.bgBlur.style.opacity = '0';
        setTimeout(() => { if(this.bgBlur && this.bgBlur.parentNode) this.bgBlur.remove(); this.bgBlur = newBg; }, 700);
      } else {
        this.bgBlur = newBg;
      }
    });
  }

  /* Smooth Autoplay */
  _setupAutoplay() {
    this._startAutoplay();
    this.container.addEventListener('mouseenter', () => this._stopAutoplay());
    this.container.addEventListener('mouseleave', () => this._startAutoplay());
    this.container.addEventListener('touchstart', () => this._stopAutoplay(), { passive: true });
    this.container.addEventListener('touchend', () => this._startAutoplay(), { passive: true });
  }

  _startAutoplay() {
    this._stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      // Very smooth automatic progression
      this.cards.forEach(c => c.style.transition = 'transform 800ms cubic-bezier(0.25, 1, 0.5, 1), opacity 800ms ease');
      this.next();
    }, 4500);
  }
  _stopAutoplay() { clearInterval(this.autoplayTimer); }
  
  _restartAutoplay() { 
    this._startAutoplay(); 
  }

  _restartProgress() {
    this.cards.forEach(c => {
      const p = c.querySelector('.carousel-progress');
      if (p) {
        p.style.animation = 'none';
        void p.offsetHeight;
        p.style.animation = 'progress-fill 4.5s linear';
      }
    });
  }

  /* Physics-based Swipe Velocity */
  _setupTouch() {
    let startX = 0, startTime = 0;
    const velocities = [];

    this.container.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startTime = Date.now();
      velocities.length = 0;
      this.cards.forEach(c => c.style.transition = 'none'); // Remove transition during drag
    }, { passive: true });

    this.container.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - startX;
      const dt = Date.now() - startTime;
      if (dt > 0) velocities.push(dx / dt);
      if (velocities.length > 5) velocities.shift();
      
      // Real-time drag feedback
      const center = this.currentIndex;
      const containerW = this.container.offsetWidth || 360;
      const dragFactor = dx / containerW;
      
      this.cards.forEach((card, i) => {
        const offset = (i - center) + (dragFactor * 1.5);
        const absOff = Math.abs(offset);
        let scale = Math.max(0.65, 1 - (absOff * 0.12));
        let tx = (containerW / 2) - 130 + offset * 180;
        card.style.transform = `translate3d(${tx}px,-${absOff*15}px,0) scale(${scale})`;
      });
      
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      this.cards.forEach(c => c.style.transition = 'transform 600ms cubic-bezier(0.34,1.56,0.64,1), opacity 500ms ease');
      const avgVel = velocities.length ? velocities.reduce((a,b) => a+b, 0) / velocities.length : 0;
      
      if (avgVel < -0.2) this.next();
      else if (avgVel > 0.2) this.prev();
      else this.goTo(this.currentIndex); // snap back
    }, { passive: true });
  }
}

window.ExploreCarousel = ExploreCarousel;
