/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — Dynamic Haptic Mala Bead Counter & Simran Jaap Module
 * ═══════════════════════════════════════════════════════════════════════════════
 * Synthesizes realistic wooden bead acoustic clicks via Web Audio API,
 * triggers tactile haptic feedback, tracks 27/54/108 milestones with singing
 * bowl harmonic chimes, and persists Jaap history locally.
 */

(function(window) {
  'use strict';

  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Synthesize realistic wooden bead tactile click sound (zero network dependency)
  function playBeadClickSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. High frequency transient pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.035);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);

      // 2. Filtered acoustic wood resonance
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(780, now);
      osc2.frequency.exponentialRampToValueAtTime(240, now + 0.045);

      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.05);
    } catch (e) {}
  }

  // Synthesize rich meditative singing bowl bell for 108 milestone
  function playMilestoneChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const fundamental = 528; // Solfeggio 528 Hz
      const harmonics = [1, 2.01, 2.98, 4.02];
      const gains = [0.4, 0.2, 0.1, 0.05];

      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * h, now);
        
        gain.gain.setValueAtTime(gains[i], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3.0);
      });
    } catch (e) {}
  }

  function triggerHaptic(type = 'light') {
    try {
      if (!('vibrate' in navigator)) return;
      if (type === 'milestone') {
        navigator.vibrate([40, 60, 40, 60, 80]);
      } else if (type === 'submilestone') {
        navigator.vibrate([25, 40, 25]);
      } else {
        navigator.vibrate(15);
      }
    } catch (e) {}
  }

  const STORAGE_KEY = 'anhad_mala_counter_v1';
  const NITNEM_MALA_KEY = 'nitnemTracker_malaLog';

  const MalaCounter = {
    count: 0,
    target: 108,
    rounds: 0,
    totalJaap: 0,
    soundEnabled: true,
    hapticEnabled: true,
    isOpen: false,

    init() {
      this._loadState();
      this._injectDOM();
      this._bindEvents();

      // Listen for cross-component or cross-page Mala updates
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY || e.key === NITNEM_MALA_KEY) {
          this._loadState();
          this._updateUI();
        }
      });
      window.addEventListener('malaUpdated', (e) => {
        if (e && e.detail && e.detail._source !== 'home_mala') {
          this._loadState();
          this._updateUI();
        }
      });
    },

    _loadState() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const nitnemLog = JSON.parse(localStorage.getItem(NITNEM_MALA_KEY) || '{}');
        const nitnemToday = nitnemLog[today] || {};

        if (saved.date === today) {
          this.count = saved.count || 0;
          this.rounds = Math.max(saved.rounds || 0, nitnemToday.completedMalas || 0);
          this.totalJaap = Math.max(saved.totalJaap || 0, nitnemToday.totalCount || 0);
          this.target = saved.target || 108;
        } else if (nitnemToday && (nitnemToday.totalCount || nitnemToday.completedMalas)) {
          this.count = 0;
          this.rounds = nitnemToday.completedMalas || 0;
          this.totalJaap = nitnemToday.totalCount || 0;
          this.target = 108;
        } else {
          this.count = 0;
          this.rounds = 0;
          this.totalJaap = 0;
          this.target = 108;
        }
      } catch (e) {
        this.count = 0;
        this.rounds = 0;
        this.totalJaap = 0;
      }
    },

    _saveState() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        
        // 1. Save Home Mala Counter state
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: today,
          count: this.count,
          rounds: this.rounds,
          totalJaap: this.totalJaap,
          target: this.target
        }));

        // 2. Synchronize to Nitnem Tracker Mala Log (nitnemTracker_malaLog)
        const nitnemLog = JSON.parse(localStorage.getItem(NITNEM_MALA_KEY) || '{}');
        nitnemLog[today] = {
          completedMalas: this.rounds,
          totalCount: this.totalJaap,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(NITNEM_MALA_KEY, JSON.stringify(nitnemLog));

        // 3. Dispatch storage and custom events for real-time synchronization
        try {
          window.dispatchEvent(new StorageEvent('storage', {
            key: NITNEM_MALA_KEY,
            newValue: JSON.stringify(nitnemLog),
            url: window.location.href
          }));
          window.dispatchEvent(new CustomEvent('malaUpdated', {
            detail: {
              _source: 'home_mala',
              count: this.count,
              rounds: this.rounds,
              totalJaap: this.totalJaap,
              target: this.target,
              date: today
            }
          }));
        } catch (evErr) {}
      } catch (e) {}
    },

    _injectDOM() {
      if (document.getElementById('malaModal')) return;

      const modal = document.createElement('div');
      modal.id = 'malaModal';
      modal.className = 'mala-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="mala-modal__backdrop" id="malaBackdrop"></div>
        <div class="mala-modal__sheet">
          <div class="mala-modal__header">
            <div class="mala-modal__drag-handle"></div>
            <div class="mala-modal__header-content">
              <div class="mala-modal__title-box">
                <span class="mala-modal__eyebrow">✦ SIMRAN & NAAM ABHYAS</span>
                <h2 class="mala-modal__title">Digital Mala Counter</h2>
              </div>
              <button class="mala-modal__close-btn" id="malaCloseBtn" aria-label="Close Mala Counter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div class="mala-modal__body">
            <!-- Target Selector Pills -->
            <div class="mala-target-selector">
              <button class="mala-target-btn ${this.target === 27 ? 'active' : ''}" data-target="27">27 Beads</button>
              <button class="mala-target-btn ${this.target === 54 ? 'active' : ''}" data-target="54">54 Beads</button>
              <button class="mala-target-btn ${this.target === 108 ? 'active' : ''}" data-target="108">108 Mala</button>
            </div>

            <!-- Big Interactive Bead Wheel -->
            <div class="mala-interactive-circle" id="malaCircleBtn" role="button" aria-label="Tap to Jaap">
              <svg class="mala-ring-svg" viewBox="0 0 240 240">
                <circle class="mala-ring-bg" cx="120" cy="120" r="102"/>
                <circle class="mala-ring-fill" id="malaRingProgress" cx="120" cy="120" r="102" stroke-dasharray="640.88" stroke-dashoffset="640.88"/>
              </svg>
              <div class="mala-center-display">
                <div class="mala-mantra">ਵਾਹਿਗੁਰੂ</div>
                <div class="mala-count" id="malaCountDisplay">${this.count}</div>
                <div class="mala-target-label">of <span id="malaTargetDisplay">${this.target}</span></div>
              </div>
              <div class="mala-tap-hint">Tap anywhere to count</div>
            </div>

            <!-- Stats Bar -->
            <div class="mala-stats-bar">
              <div class="mala-stat-item">
                <span class="mala-stat-label">Mala Completed</span>
                <span class="mala-stat-value" id="malaRoundsDisplay">${this.rounds}</span>
              </div>
              <div class="mala-stat-divider"></div>
              <div class="mala-stat-item">
                <span class="mala-stat-label">Total Today</span>
                <span class="mala-stat-value" id="malaTotalDisplay">${this.totalJaap}</span>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="mala-actions">
              <button class="mala-action-btn" id="malaSoundToggle" title="Toggle Sound">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <span id="malaSoundLabel">Sound: ON</span>
              </button>
              <button class="mala-action-btn mala-action-btn--reset" id="malaResetBtn" title="Reset Current Round">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this._updateUI();
    },

    _bindEvents() {
      const modal = document.getElementById('malaModal');
      const backdrop = document.getElementById('malaBackdrop');
      const closeBtn = document.getElementById('malaCloseBtn');
      const circleBtn = document.getElementById('malaCircleBtn');
      const soundBtn = document.getElementById('malaSoundToggle');
      const resetBtn = document.getElementById('malaResetBtn');

      if (backdrop) backdrop.addEventListener('click', () => this.close());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      if (circleBtn) {
        circleBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.increment();
          circleBtn.classList.add('pulse');
          setTimeout(() => circleBtn.classList.remove('pulse'), 180);
        });
      }

      const targetBtns = document.querySelectorAll('.mala-target-btn');
      targetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const t = parseInt(btn.getAttribute('data-target'), 10);
          if (t && t !== this.target) {
            this.target = t;
            targetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this._updateUI();
            this._saveState();
          }
        });
      });

      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          this.soundEnabled = !this.soundEnabled;
          const label = document.getElementById('malaSoundLabel');
          if (label) label.textContent = this.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
          soundBtn.classList.toggle('active', this.soundEnabled);
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (this.count > 0 && confirm('Reset current Mala count?')) {
            this.count = 0;
            this._updateUI();
            this._saveState();
          }
        });
      }

      // Keyboard spacebar counting support
      window.addEventListener('keydown', (e) => {
        if (this.isOpen && (e.code === 'Space' || e.key === ' ')) {
          e.preventDefault();
          this.increment();
          if (circleBtn) {
            circleBtn.classList.add('pulse');
            setTimeout(() => circleBtn.classList.remove('pulse'), 180);
          }
        }
      });
    },

    open() {
      const modal = document.getElementById('malaModal');
      if (!modal) return;
      this.isOpen = true;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this._updateUI();
    },

    close() {
      const modal = document.getElementById('malaModal');
      if (!modal) return;
      this.isOpen = false;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    increment() {
      this.count++;
      this.totalJaap++;

      // Trigger sensory feedback
      if (this.soundEnabled) playBeadClickSound();
      if (this.hapticEnabled) triggerHaptic('light');

      // Milestone check (108 complete)
      if (this.count >= this.target) {
        this.count = 0;
        this.rounds++;
        if (this.soundEnabled) setTimeout(playMilestoneChime, 100);
        if (this.hapticEnabled) triggerHaptic('milestone');
        this._showCelebration();
      } else if (this.count === Math.floor(this.target / 2)) {
        if (this.hapticEnabled) triggerHaptic('submilestone');
      }

      this._updateUI();
      this._saveState();
    },

    _updateUI() {
      const countEl = document.getElementById('malaCountDisplay');
      const targetEl = document.getElementById('malaTargetDisplay');
      const roundsEl = document.getElementById('malaRoundsDisplay');
      const totalEl = document.getElementById('malaTotalDisplay');
      const ringFill = document.getElementById('malaRingProgress');

      if (countEl) countEl.textContent = this.count;
      if (targetEl) targetEl.textContent = this.target;
      if (roundsEl) roundsEl.textContent = this.rounds;
      if (totalEl) totalEl.textContent = this.totalJaap;

      if (ringFill) {
        const circumference = 2 * Math.PI * 102; // ~640.88
        const progress = Math.min(1, this.count / this.target);
        const offset = circumference - (progress * circumference);
        ringFill.style.strokeDashoffset = offset;
      }
    },

    _showCelebration() {
      const circleBtn = document.getElementById('malaCircleBtn');
      if (circleBtn) {
        circleBtn.classList.add('milestone-bloom');
        setTimeout(() => circleBtn.classList.remove('milestone-bloom'), 1200);
      }
    }
  };

  window.AnhadMalaCounter = MalaCounter;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MalaCounter.init());
  } else {
    MalaCounter.init();
  }
})(window);
