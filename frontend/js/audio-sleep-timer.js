/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — Bedtime Kirtan Sleep Timer & Exponential Fade-Out Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * Allows users to peacefully sleep to Darbar Sahib Live or Rain Sabai Kirtan
 * with automated exponential volume attenuation and screen dimming.
 */

(function(window) {
  'use strict';

  const SleepTimer = {
    timerId: null,
    fadeInterval: null,
    endTime: 0,
    durationMs: 0,
    initialVolume: 1,
    isFading: false,
    dimmerActive: false,

    init() {
      this._injectDOM();
      this._bindEvents();
    },

    _injectDOM() {
      if (document.getElementById('sleepTimerModal')) return;

      const modal = document.createElement('div');
      modal.id = 'sleepTimerModal';
      modal.className = 'sleep-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="sleep-modal__backdrop" id="sleepBackdrop"></div>
        <div class="sleep-modal__sheet">
          <div class="sleep-modal__header">
            <div class="sleep-modal__drag-handle"></div>
            <div class="sleep-modal__header-content">
              <div class="sleep-modal__title-box">
                <span class="sleep-modal__eyebrow">✦ BEDTIME KIRTAN</span>
                <h2 class="sleep-modal__title">Sleep Timer</h2>
              </div>
              <button class="sleep-modal__close-btn" id="sleepCloseBtn" aria-label="Close Sleep Timer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div class="sleep-modal__body">
            <p class="sleep-modal__desc">Audio will smoothly fade out over 60 seconds when the timer ends so your sleep remains undisturbed.</p>

            <!-- Active Status Display -->
            <div class="sleep-active-status" id="sleepActiveStatus" style="display: none;">
              <div class="sleep-active-icon">🌙</div>
              <div class="sleep-active-info">
                <span class="sleep-active-label">Fading in</span>
                <span class="sleep-active-countdown" id="sleepCountdownText">30:00</span>
              </div>
              <button class="sleep-cancel-btn" id="sleepCancelBtn">Cancel</button>
            </div>

            <!-- Timer Presets -->
            <div class="sleep-presets-grid">
              <button class="sleep-preset-btn" data-minutes="15">
                <span class="sleep-preset-val">15</span>
                <span class="sleep-preset-unit">Minutes</span>
              </button>
              <button class="sleep-preset-btn" data-minutes="30">
                <span class="sleep-preset-val">30</span>
                <span class="sleep-preset-unit">Minutes</span>
              </button>
              <button class="sleep-preset-btn" data-minutes="45">
                <span class="sleep-preset-val">45</span>
                <span class="sleep-preset-unit">Minutes</span>
              </button>
              <button class="sleep-preset-btn" data-minutes="60">
                <span class="sleep-preset-val">60</span>
                <span class="sleep-preset-unit">Minutes</span>
              </button>
              <button class="sleep-preset-btn" data-minutes="90">
                <span class="sleep-preset-val">90</span>
                <span class="sleep-preset-unit">Minutes</span>
              </button>
              <button class="sleep-preset-btn sleep-preset-btn--dimmer" id="sleepDimmerToggle">
                <span class="sleep-preset-val">🌙</span>
                <span class="sleep-preset-unit">Night Dimmer</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Night Dimmer Overlay
      const dimmer = document.createElement('div');
      dimmer.id = 'anhadNightDimmer';
      dimmer.className = 'anhad-night-dimmer';
      dimmer.innerHTML = `
        <div class="dimmer-content">
          <div class="dimmer-icon">✨</div>
          <div class="dimmer-title">Night Meditation Mode</div>
          <div class="dimmer-subtitle">Audio will play softly in the background. Tap anywhere to wake screen.</div>
        </div>
      `;
      dimmer.addEventListener('click', () => this.toggleDimmer(false));
      document.body.appendChild(dimmer);
    },

    _bindEvents() {
      const backdrop = document.getElementById('sleepBackdrop');
      const closeBtn = document.getElementById('sleepCloseBtn');
      const cancelBtn = document.getElementById('sleepCancelBtn');
      const dimmerBtn = document.getElementById('sleepDimmerToggle');

      if (backdrop) backdrop.addEventListener('click', () => this.close());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());
      if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancel());

      if (dimmerBtn) {
        dimmerBtn.addEventListener('click', () => {
          this.toggleDimmer(true);
          this.close();
        });
      }

      const presetBtns = document.querySelectorAll('.sleep-preset-btn[data-minutes]');
      presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const mins = parseInt(btn.getAttribute('data-minutes'), 10);
          if (mins) {
            this.start(mins);
            this.close();
          }
        });
      });
    },

    open() {
      const modal = document.getElementById('sleepTimerModal');
      if (!modal) return;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this._updateDisplay();
    },

    close() {
      const modal = document.getElementById('sleepTimerModal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    start(minutes) {
      this.cancel();
      this.durationMs = minutes * 60 * 1000;
      this.endTime = Date.now() + this.durationMs;

      // Capture initial audio volume
      const audio = this._getAudioElement();
      if (audio) {
        this.initialVolume = typeof audio.volume === 'number' ? audio.volume : 1;
      }

      this._startTick();
      this._updateDisplay();
      this._showToast(`🌙 Sleep timer set for ${minutes} minutes`);
    },

    cancel() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
      this.endTime = 0;
      this.isFading = false;

      // Restore volume if cancelled mid-fade
      const audio = this._getAudioElement();
      if (audio) audio.volume = this.initialVolume;

      this._updateDisplay();
    },

    _startTick() {
      this.timerId = setInterval(() => {
        const remaining = this.endTime - Date.now();

        if (remaining <= 0) {
          this._finish();
        } else if (remaining <= 60000 && !this.isFading) {
          this._startFadeOut(remaining);
        }

        this._updateDisplay();
      }, 1000);
    },

    _startFadeOut(durationMs) {
      this.isFading = true;
      const audio = this._getAudioElement();
      if (!audio) return;

      const fadeStart = Date.now();
      const startVol = audio.volume;

      this.fadeInterval = setInterval(() => {
        const elapsed = Date.now() - fadeStart;
        const progress = Math.min(1, elapsed / durationMs);

        // Smooth exponential volume fade curve
        const factor = Math.pow(1 - progress, 2);
        audio.volume = Math.max(0, startVol * factor);

        if (progress >= 1) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }, 100);
    },

    _finish() {
      this.cancel();
      const audio = this._getAudioElement();
      if (audio) {
        audio.pause();
        audio.volume = this.initialVolume; // Reset for next session
      }
      if (window.AnhadAudio && typeof window.AnhadAudio.pause === 'function') {
        window.AnhadAudio.pause();
      }
      this._showToast('🌙 Sleep timer ended. Good night.');
    },

    _getAudioElement() {
      return document.querySelector('audio') || (window.AnhadAudio && window.AnhadAudio.audio) || null;
    },

    _updateDisplay() {
      const statusBox = document.getElementById('sleepActiveStatus');
      const countdownText = document.getElementById('sleepCountdownText');
      const remaining = Math.max(0, this.endTime - Date.now());

      if (remaining > 0) {
        if (statusBox) statusBox.style.display = 'flex';
        if (countdownText) {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          countdownText.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        }
      } else {
        if (statusBox) statusBox.style.display = 'none';
      }
    },

    toggleDimmer(enable) {
      this.dimmerActive = typeof enable === 'boolean' ? enable : !this.dimmerActive;
      const dimmer = document.getElementById('anhadNightDimmer');
      if (dimmer) {
        dimmer.classList.toggle('active', this.dimmerActive);
      }
    },

    _showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'anhad-sleep-toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('visible'), 20);
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, 2800);
    }
  };

  window.AnhadSleepTimer = SleepTimer;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SleepTimer.init());
  } else {
    SleepTimer.init();
  }
})(window);
