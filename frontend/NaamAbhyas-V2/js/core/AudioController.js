/**
 * ═══════════════════════════════════════════════════════════════════
 * NAAM ABHYAS - AUDIO CONTROLLER
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Simple HTML Audio controller (no AudioContext complexity)
 * Single audio instance with loop support
 * 
 * @module AudioController
 * ═══════════════════════════════════════════════════════════════════
 */

class AudioController {
  constructor() {
    this.audio = null;
    this.initialized = false;
    this.volume = 0.7;
  }
  
  /**
   * Initialize audio (lazy)
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.audio = new Audio();
      this.audio.src = '../assets/audio/waheguru-simran.mp3';
      this.audio.loop = true;
      this.audio.preload = 'metadata';
      this.audio.volume = this.volume;
      
      this.initialized = true;
      console.log('[AudioController] Initialized');
    } catch (error) {
      console.error('[AudioController] Init failed:', error);
    }
  }
  
  /**
   * Play audio
   */
  async play() {
    await this.initialize();
    
    // Check if already playing
    if (this.audio && !this.audio.paused) {
      console.warn('[AudioController] Already playing');
      return false;
    }
    
    try {
      // Load if needed
      if (this.audio.readyState < 3) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Audio load timeout'));
          }, 5000); // 5 second timeout
          
          const onCanPlay = () => {
            cleanup();
            resolve();
          };
          const onError = (e) => {
            cleanup();
            reject(e);
          };
          const cleanup = () => {
            clearTimeout(timeout);
            this.audio.removeEventListener('canplaythrough', onCanPlay);
            this.audio.removeEventListener('error', onError);
          };
          
          this.audio.addEventListener('canplaythrough', onCanPlay, { once: true });
          this.audio.addEventListener('error', onError, { once: true });
          this.audio.load();
        });
      }
      
      await this.audio.play();
      console.log('[AudioController] Playing');
      return true;
    } catch (error) {
      console.warn('[AudioController] Play failed (audio file missing or load error)');
      console.log('[AudioController] Continuing session without audio');
      return false; // Don't fail the session
    }
  }
  
  /**
   * Stop audio
   */
  stop() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.audio.currentTime = 0;
    console.log('[AudioController] Stopped');
  }
  
  /**
   * Pause audio
   */
  pause() {
    if (!this.audio) return;
    this.audio.pause();
    console.log('[AudioController] Paused');
  }
  
  /**
   * Resume audio
   */
  async resume() {
    if (!this.audio) return;
    
    try {
      await this.audio.play();
      console.log('[AudioController] Resumed');
    } catch (error) {
      console.error('[AudioController] Resume failed:', error);
    }
  }
  
  /**
   * Set volume
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }
  
  /**
   * Check if playing
   */
  isPlaying() {
    return this.audio && !this.audio.paused;
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.audio) {
      this.stop();
      this.audio.src = '';
      this.audio = null;
    }
    this.initialized = false;
    console.log('[AudioController] Destroyed');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioController };
}
