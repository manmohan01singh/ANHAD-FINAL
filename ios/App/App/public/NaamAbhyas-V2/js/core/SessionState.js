/**
 * ═══════════════════════════════════════════════════════════════════
 * NAAM ABHYAS - SESSION STATE MACHINE
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Finite State Machine for session lifecycle
 * Prevents impossible states and race conditions
 * 
 * States:
 *   IDLE → NOTIFICATION_PENDING → POPUP_OPEN → SESSION_RUNNING 
 *   → SESSION_COMPLETED → RESULT_SHOWN → IDLE
 * 
 * @module SessionState
 * ═══════════════════════════════════════════════════════════════════
 */

const SessionStates = {
  IDLE: 'IDLE',
  NOTIFICATION_PENDING: 'NOTIFICATION_PENDING',
  POPUP_OPEN: 'POPUP_OPEN',
  SESSION_RUNNING: 'SESSION_RUNNING',
  SESSION_COMPLETED: 'SESSION_COMPLETED',
  RESULT_SHOWN: 'RESULT_SHOWN'
};

const SessionEvents = {
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
  POPUP_OPENED: 'POPUP_OPENED',
  START_CLICKED: 'START_CLICKED',
  LATER_CLICKED: 'LATER_CLICKED',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  RESULT_ACKNOWLEDGED: 'RESULT_ACKNOWLEDGED',
  POPUP_DISMISSED: 'POPUP_DISMISSED'
};

class SessionStateMachine {
  constructor() {
    this.currentState = SessionStates.IDLE;
    this.listeners = new Set();
    
    // Define valid transitions
    this.transitions = {
      [SessionStates.IDLE]: {
        [SessionEvents.NOTIFICATION_RECEIVED]: SessionStates.NOTIFICATION_PENDING
      },
      [SessionStates.NOTIFICATION_PENDING]: {
        [SessionEvents.POPUP_OPENED]: SessionStates.POPUP_OPEN
      },
      [SessionStates.POPUP_OPEN]: {
        [SessionEvents.START_CLICKED]: SessionStates.SESSION_RUNNING,
        [SessionEvents.LATER_CLICKED]: SessionStates.IDLE,
        [SessionEvents.POPUP_DISMISSED]: SessionStates.IDLE
      },
      [SessionStates.SESSION_RUNNING]: {
        [SessionEvents.SESSION_TIMEOUT]: SessionStates.SESSION_COMPLETED
      },
      [SessionStates.SESSION_COMPLETED]: {
        [SessionEvents.RESULT_ACKNOWLEDGED]: SessionStates.RESULT_SHOWN
      },
      [SessionStates.RESULT_SHOWN]: {
        [SessionEvents.POPUP_DISMISSED]: SessionStates.IDLE
      }
    };
  }
  
  /**
   * Transition to new state
   */
  transition(event) {
    const validTransitions = this.transitions[this.currentState];
    
    if (!validTransitions || !validTransitions[event]) {
      console.warn(
        `[SessionFSM] Invalid transition: ${this.currentState} + ${event}`
      );
      return false;
    }
    
    const previousState = this.currentState;
    this.currentState = validTransitions[event];
    
    console.log(
      `[SessionFSM] ${previousState} → ${this.currentState} (via ${event})`
    );
    
    this.notifyListeners(previousState, this.currentState, event);
    return true;
  }
  
  /**
   * Get current state
   */
  getState() {
    return this.currentState;
  }
  
  /**
   * Check if in specific state
   */
  is(state) {
    return this.currentState === state;
  }
  
  /**
   * Check if transition is valid
   */
  canTransition(event) {
    const validTransitions = this.transitions[this.currentState];
    return validTransitions && validTransitions[event] !== undefined;
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners
   */
  notifyListeners(from, to, event) {
    this.listeners.forEach(listener => {
      try {
        listener({ from, to, event });
      } catch (error) {
        console.error('[SessionFSM] Listener error:', error);
      }
    });
  }
  
  /**
   * Reset to IDLE
   */
  reset() {
    this.currentState = SessionStates.IDLE;
    console.log('[SessionFSM] Reset to IDLE');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SessionStateMachine, SessionStates, SessionEvents };
}
