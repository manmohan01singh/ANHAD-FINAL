/**
 * ═══════════════════════════════════════════════════════════════════
 * NAAM ABHYAS - STATE STORE
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Single source of truth for application state
 * Immutable updates with automatic persistence
 * 
 * @module StateStore
 * ═══════════════════════════════════════════════════════════════════
 */

class StateStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Set();
  }
  
  /**
   * Get current state (frozen for immutability)
   */
  getState() {
    return Object.freeze({ ...this.state });
  }
  
  /**
   * Update state (immutable)
   */
  setState(updates) {
    const previousState = this.state;
    this.state = { ...this.state, ...updates };
    
    // Save to storage
    this.saveState();
    
    // Notify listeners
    this.notifyListeners(previousState, this.state);
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // Immediately call with current state (prevState = current state for first call)
    listener(this.state, this.state);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners
   */
  notifyListeners(previousState, newState) {
    this.listeners.forEach(listener => {
      try {
        listener(newState, previousState);
      } catch (error) {
        console.error('[StateStore] Listener error:', error);
      }
    });
  }
  
  /**
   * Save state to localStorage (convert Map to Array)
   */
  saveState() {
    try {
      // Clone state and convert Map to Array for serialization
      const stateToSave = {
        ...this.state,
        timeline: {
          date: this.state.timeline.date,
          hours: Array.from(this.state.timeline.hours.entries())
        }
      };
      
      localStorage.setItem('naamAbhyas_v2_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('[StateStore] Save failed:', error);
    }
  }
  
  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('naamAbhyas_v2_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.validateState(parsed);
      }
    } catch (error) {
      console.error('[StateStore] Load failed:', error);
    }
    
    return this.getDefaultState();
  }
  
  /**
   * Validate loaded state
   */
  validateState(state) {
    const defaults = this.getDefaultState();
    
    // Merge with defaults to ensure all fields exist
    const validated = {
      ...defaults,
      ...state,
      timeline: this.validateTimeline(state.timeline),
      stats: { ...defaults.stats, ...state.stats }
    };
    
    // Check if day changed - reset timeline
    const today = new Date().toISOString().split('T')[0];
    if (validated.timeline.date !== today) {
      validated.timeline = this.createTodayTimeline();
      validated.stats.todayCompleted = 0;
    }
    
    return validated;
  }
  
  /**
   * Validate timeline (convert Array back to Map if needed)
   */
  validateTimeline(timeline) {
    if (!timeline || timeline.date !== new Date().toISOString().split('T')[0]) {
      return this.createTodayTimeline();
    }
    
    // Convert array to Map if it's an array of entries
    if (Array.isArray(timeline.hours)) {
      const hoursMap = new Map(timeline.hours);
      return {
        date: timeline.date,
        hours: hoursMap
      };
    }
    
    // Already a Map (shouldn't happen after serialization, but handle it)
    if (timeline.hours instanceof Map) {
      return timeline;
    }
    
    // Invalid format - recreate
    return this.createTodayTimeline();
  }
  
  /**
   * Create today's timeline (using Map instead of array)
   */
  createTodayTimeline() {
    const today = new Date().toISOString().split('T')[0];
    const hoursMap = new Map();
    
    for (let i = 0; i < 24; i++) {
      hoursMap.set(i, {
        completed: false,
        timestamp: null
      });
    }
    
    return {
      date: today,
      hours: hoursMap
    };
  }
  
  /**
   * Get default state
   */
  getDefaultState() {
    return {
      isEnabled: false,
      
      // Active session data
      activeSession: null,
      
      // Timeline (Map<hour, {completed, timestamp}>)
      timeline: this.createTodayTimeline(),
      
      // Statistics
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        totalMinutes: 0,
        todayCompleted: 0,
        perfectDays: 0
      }
    };
  }
  
  /**
   * Clear all state (reset)
   */
  clearState() {
    this.state = this.getDefaultState();
    this.saveState();
    this.notifyListeners({}, this.state);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StateStore };
}
