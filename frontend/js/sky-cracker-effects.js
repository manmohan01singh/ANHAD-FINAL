/* ═══════════════════════════════════════════════════════════════════════════════
   ANHAD — SKY CRACKER FIREWORK TOUCH EFFECTS
   Premium particle explosion effects on touch/click
   ═══════════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Golden color palette for particles
  const COLORS = [
    '#D4943A', // Primary gold
    '#E8A87C', // Light gold
    '#C4842A', // Deep gold
    '#F5D5A8', // Pale gold
    '#B8651A', // Bronze
    '#FFD700', // Bright gold
  ];

  // Configuration
  const CONFIG = {
    particleCount: 20,
    particleSize: 8,
    explosionRadius: 150,
    rippleEnabled: true,
    flashEnabled: true,
    hapticEnabled: true,
  };

  /**
   * Create firework particle explosion at coordinates
   */
  function createFirework(x, y) {
    const particles = [];
    
    for (let i = 0; i < CONFIG.particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'firework-particle';
      
      // Random angle and distance
      const angle = (Math.PI * 2 * i) / CONFIG.particleCount + (Math.random() - 0.5) * 0.5;
      const distance = CONFIG.explosionRadius * (0.5 + Math.random() * 0.5);
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      // Random color from palette
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      
      // Set particle styles
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.background = color;
      particle.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      
      document.body.appendChild(particle);
      particles.push(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
    
    return particles;
  }

  /**
   * Create ripple effect at coordinates
   */
  function createRipple(x, y) {
    if (!CONFIG.rippleEnabled) return;
    
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = (x - 150) + 'px';
    ripple.style.top = (y - 150) + 'px';
    
    document.body.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 800);
  }

  /**
   * Create flash effect at coordinates
   */
  function createFlash(x, y) {
    if (!CONFIG.flashEnabled) return;
    
    const flash = document.createElement('div');
    flash.className = 'touch-flash';
    flash.style.setProperty('--x', x + 'px');
    flash.style.setProperty('--y', y + 'px');
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.remove();
    }, 400);
  }

  /**
   * Trigger haptic feedback (iOS/Android)
   */
  function triggerHaptic() {
    if (!CONFIG.hapticEnabled) return;
    
    // iOS Haptic Feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    
    // iOS Taptic Engine (if available)
    if (window.TapticEngine) {
      window.TapticEngine.impact({ style: 'light' });
    }
  }

  /**
   * Handle touch/click event
   */
  function handleInteraction(event) {
    // Get coordinates
    let x, y;
    
    if (event.type === 'touchstart' || event.type === 'touchend') {
      const touch = event.touches[0] || event.changedTouches[0];
      x = touch.clientX;
      y = touch.clientY;
    } else {
      x = event.clientX;
      y = event.clientY;
    }
    
    // Only trigger on card elements
    const target = event.target.closest('.hero-card, .practice-card, .quick-card, .event-card');
    if (!target) return;
    
    // Create effects
    createFirework(x, y);
    createRipple(x, y);
    createFlash(x, y);
    triggerHaptic();
  }

  /**
   * Initialize sky cracker effects
   */
  function init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      CONFIG.particleCount = 5;
      CONFIG.rippleEnabled = false;
      CONFIG.flashEnabled = false;
    }
    
    // Add event listeners
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });
    
    console.log('✨ Sky Cracker effects initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external control
  window.SkyCracker = {
    trigger: function(x, y) {
      createFirework(x, y);
      createRipple(x, y);
      createFlash(x, y);
      triggerHaptic();
    },
    setConfig: function(options) {
      Object.assign(CONFIG, options);
    },
    disable: function() {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    }
  };

})();
