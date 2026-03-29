/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Spring Physics Engine
   iOS 26 style spring animations • 90fps
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

class Spring {
  constructor({
    mass = 1,
    stiffness = 400,
    damping = 28,
    initialValue = 0
  } = {}) {
    this.mass = mass;
    this.stiffness = stiffness;
    this.damping = damping;
    this.value = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    this._raf = null;
    this._callbacks = [];
    this._settled = true;
  }

  to(target, onUpdate) {
    this.target = target;
    this._settled = false;
    if (onUpdate) {
      this._callbacks = [onUpdate]; // Replace to avoid stale callbacks
    }
    this._tick();
    return this;
  }

  _tick() {
    if (this._raf) cancelAnimationFrame(this._raf);

    const step = () => {
      const dt = 1 / 60; // Fixed timestep
      const force = -this.stiffness * (this.value - this.target);
      const dampForce = -this.damping * this.velocity;
      const acc = (force + dampForce) / this.mass;

      this.velocity += acc * dt;
      this.value += this.velocity * dt;

      // Emit current value
      for (let i = 0; i < this._callbacks.length; i++) {
        this._callbacks[i](this.value);
      }

      // Check if settled
      if (Math.abs(this.value - this.target) > 0.001 || Math.abs(this.velocity) > 0.001) {
        this._raf = requestAnimationFrame(step);
      } else {
        // Snap to target
        this.value = this.target;
        this.velocity = 0;
        this._settled = true;
        for (let i = 0; i < this._callbacks.length; i++) {
          this._callbacks[i](this.value);
        }
        this._raf = null;
      }
    };

    this._raf = requestAnimationFrame(step);
  }

  isSettled() {
    return this._settled;
  }

  stop() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._callbacks = [];
  }

  reset(value) {
    this.stop();
    this.value = value ?? this.target;
    this.velocity = 0;
    this._settled = true;
  }
}

// Preset springs matching iOS 26 motion design
const Springs = {
  default:  () => new Spring({ mass: 0.5, stiffness: 400, damping: 28 }),
  bouncy:   () => new Spring({ mass: 0.3, stiffness: 600, damping: 20 }),
  gentle:   () => new Spring({ mass: 1.0, stiffness: 200, damping: 30 }),
  snappy:   () => new Spring({ mass: 0.2, stiffness: 800, damping: 35 }),
  elastic:  () => new Spring({ mass: 0.5, stiffness: 300, damping: 15 }),
};

// Export to global scope
window.Spring = Spring;
window.Springs = Springs;
