/**
 * ═══════════════════════════════════════════════════════════════════
 * NAAM ABHYAS ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Main orchestrator - Single source of truth
 * Coordinates all subsystems through FSM
 * 
 * @module NaamAbhyasEngine
 * ═══════════════════════════════════════════════════════════════════
 */

class NaamAbhyasEngine {
  constructor() {
    // Singleton pattern
    if (window.naamAbhyasEngine) {
      console.warn('[Engine] Already exists - returning existing instance');
      return window.naamAbhyasEngine;
    }
    
    console.log('[Engine] Initializing...');
    
    // Create subsystems
    this.fsm = new SessionStateMachine();
    this.store = new StateStore();
    this.audio = new AudioController();
    this.session = new SessionController(this.store, this.audio, this.fsm);
    
    // Setup lifecycle handlers
    this.setupLifecycleHandlers();
    
    // Subscribe to FSM state changes
    this.fsm.subscribe((transition) => {
      console.log('[Engine] FSM:', transition);
      this.handleStateTransition(transition);
    });
    
    // Subscribe to store changes
    this.store.subscribe((state, prevState) => {
      this.handleStoreChange(state, prevState);
    });
    
    // Global reference
    window.naamAbhyasEngine = this;
    
    console.log('[Engine] Initialized ✓');
  }
  
  /**
   * Initialize system
   */
  async initialize() {
    console.log('[Engine] Starting initialization...');
    
    // Check for pending background restoration
    this.session.handleForeground();
    
    console.log('[Engine] Ready ✓');
  }
  
  /**
   * Enable/disable system
   */
  async setEnabled(enabled) {
    this.store.setState({ isEnabled: enabled });
    console.log('[Engine] System', enabled ? 'enabled' : 'disabled');
  }
  
  /**
   * Start session (main entry point)
   * @param {number|null} durationMinutes - Duration in minutes (null = default)
   * @param {number|null} hour - Hour to record (null = current hour)
   */
  async startSession(durationMinutes = null, hour = null) {
    console.log('[Engine] Start session request:', durationMinutes, 'min, hour:', hour);
    
    // For quick sessions (when duration is specified), bypass FSM checks
    const bypassFSM = durationMinutes !== null;
    
    return await this.session.startSession(hour, durationMinutes, bypassFSM);
  }
  
  /**
   * Handle FSM state transitions
   */
  handleStateTransition(transition) {
    const { from, to, event } = transition;
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('naamAbhyasFSMTransition', {
      detail: transition
    }));
  }
  
  /**
   * Handle store changes
   */
  handleStoreChange(state, prevState) {
    // Guard against undefined prevState
    if (!prevState) return;
    
    // Only log significant changes
    if (state.activeSession !== prevState.activeSession) {
      console.log('[Engine] Session state changed');
    }
    
    if (state.stats.todayCompleted !== prevState.stats.todayCompleted) {
      console.log('[Engine] Stats updated:', state.stats.todayCompleted);
    }
  }
  
  /**
   * Setup lifecycle handlers
   */
  setupLifecycleHandlers() {
    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackground();
      } else {
        this.handleForeground();
      }
    });
    
    // Capacitor app state
    if (window.Capacitor?.Plugins?.App) {
      window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          this.handleBackground();
        } else {
          this.handleForeground();
        }
      });
    }
    
    // Before unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  /**
   * Handle background
   */
  handleBackground() {
    console.log('[Engine] App went to background');
    this.session.handleBackground();
  }
  
  /**
   * Handle foreground
   */
  handleForeground() {
    console.log('[Engine] App returned to foreground');
    this.session.handleForeground();
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      fsm: this.fsm.getState(),
      store: this.store.getState()
    };
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    console.log('[Engine] Cleanup...');
    this.session.destroy();
    this.audio.destroy();
    this.store.saveState();
  }
  
  /**
   * Destroy instance
   */
  destroy() {
    this.cleanup();
    delete window.naamAbhyasEngine;
    console.log('[Engine] Destroyed');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NaamAbhyasEngine };
}
