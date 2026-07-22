/**
 * ═══════════════════════════════════════════════════════════════════
 * NAAM ABHYAS - SESSION CONTROLLER
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Session lifecycle management with timestamp-based timing
 * Uses setTimeout (250ms) for updates instead of RAF (battery efficient)
 * RAF only for ring animation
 * 
 * @module SessionController
 * @requires StateStore
 * @requires AudioController
 * @requires SessionStateMachine
 * ═══════════════════════════════════════════════════════════════════
 */

class SessionController {
  constructor(stateStore, audioController, stateMachine) {
    this.store = stateStore;
    this.audio = audioController;
    this.fsm = stateMachine;
    
    this.updateTimer = null;
    this.operationLock = false;
    this.lastDisplayedTime = -1;
  }
  
  /**
   * Start a session
   * @param {number|null} hour - Hour to record (null = current hour)
   * @param {number|null} durationMinutes - Duration in minutes (null = 2 min default)
   * @param {boolean} bypassFSM - Skip FSM state check for manual quick sessions
   */
  async startSession(hour = null, durationMinutes = null, bypassFSM = false) {
    // Mutex lock
    if (this.operationLock) {
      console.warn('[SessionController] Operation in progress');
      return false;
    }
    
    this.operationLock = true;
    
    try {
      // Check FSM state (unless bypassing for quick session)
      if (!bypassFSM && !this.fsm.is(SessionStates.POPUP_OPEN)) {
        console.warn('[SessionController] Invalid FSM state, trying bypass...');
        // For quick sessions, force FSM to correct state
        if (this.fsm.is(SessionStates.IDLE)) {
          this.fsm.transition(SessionEvents.HOUR_START);
        }
      }
      
      // Check if already active
      const state = this.store.getState();
      if (state.activeSession) {
        console.warn('[SessionController] Session already active');
        return false;
      }
      
      const currentHour = hour ?? new Date().getHours();
      const duration = (durationMinutes ?? 2) * 60; // Convert to seconds
      const now = Date.now();
      
      // Create session
      const session = {
        startTime: now,
        duration: duration,
        hour: currentHour
      };
      
      this.store.setState({ activeSession: session });
      
      // Transition FSM if not bypassing
      if (!bypassFSM && this.fsm.is(SessionStates.POPUP_OPEN)) {
        this.fsm.transition(SessionEvents.START_CLICKED);
      } else if (bypassFSM) {
        // Force FSM to running state for quick sessions
        if (!this.fsm.is(SessionStates.SESSION_RUNNING)) {
          this.fsm.state = SessionStates.SESSION_RUNNING;
        }
      }
      
      // Start audio
      await this.audio.play();
      
      // Start update loop (250ms intervals)
      this.startUpdateLoop();
      
      console.log('[SessionController] Session started:', currentHour, 'for', durationMinutes, 'minutes');
      return true;
    } finally {
      this.operationLock = false;
    }
  }
  
  /**
   * Update loop (250ms intervals for battery efficiency)
   */
  startUpdateLoop() {
    const update = () => {
      const state = this.store.getState();
      const session = state.activeSession;
      
      if (!session || !this.fsm.is(SessionStates.SESSION_RUNNING)) {
        this.stopUpdateLoop();
        return;
      }
      
      // Calculate remaining time from timestamp
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
      const remaining = Math.max(0, session.duration - elapsed);
      
      // Update UI only if changed
      if (this.lastDisplayedTime !== remaining) {
        this.updateDisplay(remaining, session.duration);
        this.lastDisplayedTime = remaining;
      }
      
      // Check completion
      if (remaining === 0) {
        this.completeSession();
        return;
      }
      
      // Schedule next update (250ms)
      this.updateTimer = setTimeout(update, 250);
    };
    
    update();
  }
  
  /**
   * Stop update loop
   */
  stopUpdateLoop() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
  }
  
  /**
   * Update display
   */
  updateDisplay(remaining, total) {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('naamAbhyasTimerUpdate', {
      detail: {
        remaining,
        total,
        percentage: ((total - remaining) / total) * 100
      }
    }));
  }
  
  /**
   * Complete session
   */
  completeSession() {
    const state = this.store.getState();
    const session = state.activeSession;
    
    if (!session) return;
    
    // Stop audio
    this.audio.stop();
    
    // Stop timer
    this.stopUpdateLoop();
    
    // Update timeline (clone Map properly)
    const timeline = {
      date: state.timeline.date,
      hours: new Map(state.timeline.hours)
    };
    timeline.hours.set(session.hour, {
      completed: true,
      timestamp: Date.now()
    });
    
    // Update stats
    const stats = { ...state.stats };
    stats.totalSessions += 1;
    stats.totalMinutes += Math.floor(session.duration / 60);
    stats.todayCompleted += 1;
    stats.currentStreak += 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    
    // Check perfect day
    let allCompleted = true;
    for (let i = 0; i < 24; i++) {
      if (!timeline.hours.get(i)?.completed) {
        allCompleted = false;
        break;
      }
    }
    if (allCompleted) {
      stats.perfectDays += 1;
    }
    
    // Update state
    this.store.setState({
      activeSession: null,
      timeline,
      stats
    });
    
    // Transition FSM (only if in valid state)
    if (this.fsm.is(SessionStates.SESSION_RUNNING)) {
      this.fsm.transition(SessionEvents.SESSION_TIMEOUT);
    } else {
      // Session completed in background, reset FSM
      this.fsm.reset();
    }
    
    // Dispatch completion event
    window.dispatchEvent(new CustomEvent('naamAbhyasSessionComplete', {
      detail: { hour: session.hour, stats }
    }));
    
    console.log('[SessionController] Session completed:', session.hour);
  }
  
  /**
   * Handle background
   */
  handleBackground() {
    const state = this.store.getState();
    if (state.activeSession) {
      localStorage.setItem('naamAbhyas_v2_background', Date.now().toString());
      console.log('[SessionController] Went to background');
    }
  }
  
  /**
   * Handle foreground
   */
  handleForeground() {
    const state = this.store.getState();
    const session = state.activeSession;
    
    if (!session) return;
    
    // Calculate elapsed time
    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    const remaining = Math.max(0, session.duration - elapsed);
    
    if (remaining === 0) {
      // Completed in background
      console.log('[SessionController] Session completed in background');
      this.completeSession();
    } else if (elapsed > session.duration + 300) {
      // Session way overdue (>5 min) - mark as timed out
      console.log('[SessionController] Session timeout');
      this.store.setState({ activeSession: null });
      this.fsm.reset();
    } else {
      // Resume
      console.log('[SessionController] Resuming session');
      this.audio.play();
      this.startUpdateLoop();
    }
    
    localStorage.removeItem('naamAbhyas_v2_background');
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.stopUpdateLoop();
    this.audio.stop();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SessionController };
}
