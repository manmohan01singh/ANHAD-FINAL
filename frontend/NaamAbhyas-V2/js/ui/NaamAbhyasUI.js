/**
 * ═══════════════════════════════════════════════════════════════════
 * NAAM ABHYAS UI CONTROLLER - EXTREME EDITION
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Connects the engine to the MOST BEAUTIFUL UI ever created
 * Handles all user interactions and visual updates
 * 
 * Features:
 * - Sacred Day Timeline (scrollable, random times)
 * - Gurbani Quotes (rotating wisdom)
 * - Discipline Dashboard (circular progress)
 * - Extra Simran (quick actions)
 * - Complete Settings (theme, duration, hours, notifications, sound)
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

class NaamAbhyasUI {
  constructor(engine) {
    this.engine = engine;
    this.currentQuoteIndex = 0;
    this.randomTimes = this.generateRandomTimes();
    
    this.initializeElements();
    this.attachEventListeners();
    this.subscribeToEngine();
    this.initializeUI();
  }
  
  generateRandomTimes() {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      const minute = Math.floor(Math.random() * 60);
      times.push(minute);
    }
    return times;
  }
  
  initializeElements() {
    // Main elements
    this.enableToggle = document.getElementById('enableToggle');
    this.toggleStatus = document.getElementById('toggleStatus');
    this.headerStreak = document.getElementById('headerStreak');
    
    // Timeline
    this.timelineScroll = document.getElementById('timelineScroll');
    
    // Quote
    this.quoteGurmukhi = document.getElementById('quoteGurmukhi');
    this.quoteEnglish = document.getElementById('quoteEnglish');
    this.quoteSource = document.getElementById('quoteSource');
    this.quoteRefresh = document.getElementById('quoteRefresh');
    
    // Dashboard
    this.progressValue = document.getElementById('progressValue');
    this.progressRingFill = document.getElementById('progressRingFill');
    this.dashStreak = document.getElementById('dashStreak');
    this.dashToday = document.getElementById('dashToday');
    
    // Extra Simran
    this.startNowBtn = document.getElementById('startNowBtn');
    this.quickBtn = document.getElementById('quickBtn');
    this.deepBtn = document.getElementById('deepBtn');
    
    // Popups
    this.sessionPopup = document.getElementById('sessionPopup');
    this.startBtn = document.getElementById('startBtn');
    this.laterBtn = document.getElementById('laterBtn');
    
    // Session view
    this.sessionView = document.getElementById('sessionView');
    this.timerValue = document.getElementById('timerValue');
    this.timerProgress = document.getElementById('timerProgress');
    this.endBtn = document.getElementById('endBtn');
    
    // Completion popup
    this.completePopup = document.getElementById('completePopup');
    this.continueBtn = document.getElementById('continueBtn');
    
    // Settings
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsClose = document.getElementById('settingsClose');
    
    // Back button
    this.backBtn = document.getElementById('backBtn');
  }
  
  initializeUI() {
    console.log('[UI] Initializing EXTREME edition...');
    
    // Generate timeline
    this.renderTimeline();
    
    // Load random quote
    this.loadRandomQuote();
    
    // Initialize progress ring
    this.updateProgressRing(0);
    
    // Load settings
    this.loadSettings();
    
    // Initial render
    const state = this.engine.store.getState();
    this.renderState(state);
    
    console.log('[UI] EXTREME edition ready ✓');
  }
  
  renderTimeline() {
    if (!this.timelineScroll) return;
    
    this.timelineScroll.innerHTML = '';
    const currentHour = new Date().getHours();
    const state = this.engine.store.getState();
    
    for (let hour = 0; hour < 24; hour++) {
      const randomMinute = this.randomTimes[hour];
      const displayHour = hour % 12 || 12;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const timeStr = `${displayHour}:${randomMinute.toString().padStart(2, '0')} ${ampm}`;
      const baseHour = `${hour}:00`;
      
      const hourData = state.timeline.hours.get(hour);
      let status = 'upcoming';
      let icon = '○';
      
      if (hourData?.completed) {
        status = 'completed';
        icon = '✓';
      } else if (hour < currentHour) {
        status = 'pending';
        icon = '✗';
      } else if (hour === currentHour) {
        status = 'upcoming';
        icon = '○';
      }
      
      const item = document.createElement('div');
      item.className = `timeline-item ${status}`;
      item.innerHTML = `
        <div class="timeline-status">
          <span>${icon}</span>
        </div>
        <div class="timeline-time">
          <span class="display-time">${timeStr}</span>
          <span class="duration">for 2 min</span>
        </div>
        <span class="base-hour">${baseHour}</span>
      `;
      
      this.timelineScroll.appendChild(item);
    }
    
    // Smooth scroll animation
    this.timelineScroll.style.opacity = '0';
    setTimeout(() => {
      this.timelineScroll.style.transition = 'opacity 0.5s ease';
      this.timelineScroll.style.opacity = '1';
    }, 100);
  }
  
  loadRandomQuote() {
    if (typeof getRandomQuote !== 'function') {
      console.warn('[UI] Gurbani quotes not loaded');
      return;
    }
    
    const quote = getRandomQuote();
    
    // Fade out
    if (this.quoteGurmukhi) {
      this.quoteGurmukhi.style.opacity = '0';
      this.quoteEnglish.style.opacity = '0';
      this.quoteSource.style.opacity = '0';
      
      setTimeout(() => {
        this.quoteGurmukhi.textContent = `"${quote.gurmukhi}"`;
        this.quoteEnglish.textContent = quote.english;
        this.quoteSource.textContent = `— ${quote.source}`;
        
        // Fade in
        this.quoteGurmukhi.style.transition = 'opacity 0.5s ease';
        this.quoteEnglish.style.transition = 'opacity 0.5s ease';
        this.quoteSource.style.transition = 'opacity 0.5s ease';
        
        this.quoteGurmukhi.style.opacity = '1';
        this.quoteEnglish.style.opacity = '1';
        this.quoteSource.style.opacity = '1';
      }, 300);
    }
  }
  
  updateProgressRing(percentage) {
    if (!this.progressRingFill || !this.progressValue) return;
    
    // SVG circle circumference = 2πr = 2π*85 ≈ 534
    const circumference = 534;
    const offset = circumference - (percentage / 100) * circumference;
    
    this.progressRingFill.style.strokeDashoffset = offset;
    this.progressValue.textContent = `${Math.round(percentage)}%`;
  }
  
  loadSettings() {
    try {
      // Load theme
      const theme = localStorage.getItem('naam_theme') || 'auto';
      const themePills = document.querySelectorAll('.theme-pill');
      themePills.forEach(pill => {
        pill.classList.remove('active');
        if (pill.dataset.theme === theme) {
          pill.classList.add('active');
        }
      });
      
      // Load duration
      const duration = parseInt(localStorage.getItem('naam_duration') || '2');
      const durationPills = document.querySelectorAll('.duration-pill');
      durationPills.forEach(pill => {
        pill.classList.remove('active');
        if (parseInt(pill.dataset.duration) === duration) {
          pill.classList.add('active');
        }
      });
      
      // Load active hours
      const startHour = parseInt(localStorage.getItem('naam_start_hour') || '5');
      const endHour = parseInt(localStorage.getItem('naam_end_hour') || '22');
      
      const startSelect = document.getElementById('startHourSelect');
      const endSelect = document.getElementById('endHourSelect');
      if (startSelect) startSelect.value = startHour;
      if (endSelect) endSelect.value = endHour;
      
      console.log('[UI] Settings loaded');
    } catch (err) {
      console.error('[UI] Settings load error:', err);
    }
  }
  
  attachEventListeners() {
    // Toggle
    this.enableToggle.addEventListener('change', () => {
      this.engine.setEnabled(this.enableToggle.checked);
    });
    
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }
    
    // Settings close
    if (this.settingsClose) {
      this.settingsClose.addEventListener('click', () => {
        this.hideSettings();
      });
    }
    
    // Close settings on backdrop click
    const settingsBackdrop = this.settingsModal?.querySelector('.settings-backdrop');
    if (settingsBackdrop) {
      settingsBackdrop.addEventListener('click', () => {
        this.hideSettings();
      });
    }
    
    // Quote refresh
    if (this.quoteRefresh) {
      this.quoteRefresh.addEventListener('click', () => {
        this.loadRandomQuote();
      });
    }
    
    // Theme pills
    document.querySelectorAll('.theme-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const theme = pill.dataset.theme;
        document.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        localStorage.setItem('naam_theme', theme);
        console.log('[UI] Theme changed:', theme);
      });
    });
    
    // Duration pills
    document.querySelectorAll('.duration-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const duration = parseInt(pill.dataset.duration);
        document.querySelectorAll('.duration-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        localStorage.setItem('naam_duration', duration);
        console.log('[UI] Duration changed:', duration);
      });
    });
    
    // CRITICAL FIX: Popup button handlers
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.hideSessionPopup();
        this.engine.startSession();
      });
    }
    
    if (this.laterBtn) {
      this.laterBtn.addEventListener('click', () => {
        this.hideSessionPopup();
      });
    }
    
    if (this.endBtn) {
      this.endBtn.addEventListener('click', () => {
        this.engine.endSession();
      });
    }
    
    if (this.continueBtn) {
      this.continueBtn.addEventListener('click', () => {
        this.hideCompletePopup();
      });
    }
    
    // CRITICAL FIX: Extra Simran buttons
    if (this.startNowBtn) {
      this.startNowBtn.addEventListener('click', () => {
        this.engine.startSession();
      });
    }
    
    if (this.quickBtn) {
      this.quickBtn.addEventListener('click', () => {
        localStorage.setItem('naam_duration', '1');
        this.engine.startSession();
      });
    }
    
    if (this.deepBtn) {
      this.deepBtn.addEventListener('click', () => {
        localStorage.setItem('naam_duration', '11');
        this.engine.startSession();
      });
    }
    
    // Back button
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => {
        if (window.navigateTo) {
          window.navigateTo('../index.html');
        } else {
          window.location.href = '../index.html';
        }
      });
    }
    
    // Custom duration input
    const durationCustom = document.getElementById('durationCustom');
    if (durationCustom) {
      durationCustom.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 60) {
          localStorage.setItem('naam_duration', value);
          console.log('[UI] Custom duration set:', value);
        }
      });
    }
    
    // Active hours selects
    const startHourSelect = document.getElementById('startHourSelect');
    const endHourSelect = document.getElementById('endHourSelect');
    
    if (startHourSelect) {
      startHourSelect.addEventListener('change', (e) => {
        localStorage.setItem('naam_start_hour', e.target.value);
        console.log('[UI] Start hour:', e.target.value);
      });
    }
    
    if (endHourSelect) {
      endHourSelect.addEventListener('change', (e) => {
        localStorage.setItem('naam_end_hour', e.target.value);
        console.log('[UI] End hour:', e.target.value);
      });
    }
    
    // Notification toggles
    const notifToggles = ['notifHourStart', 'notifWarning', 'notifVibration', 'notifSound'];
    notifToggles.forEach(id => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.addEventListener('change', (e) => {
          localStorage.setItem(`naam_${id}`, e.target.checked);
          console.log(`[UI] ${id}:`, e.target.checked);
        });
      }
    });
    
    // Sound select
    const soundSelect = document.getElementById('soundSelect');
    if (soundSelect) {
      soundSelect.addEventListener('change', (e) => {
        localStorage.setItem('naam_sound', e.target.value);
        console.log('[UI] Sound:', e.target.value);
      });
    }
    
    // Sound play button
    const soundPlayBtn = document.getElementById('soundPlayBtn');
    if (soundPlayBtn) {
      soundPlayBtn.addEventListener('click', () => {
        console.log('[UI] Play sound preview');
        // TODO: Play sound preview
      });
    }
    
    // Auto-start toggle
    const autoStart = document.getElementById('autoStart');
    if (autoStart) {
      autoStart.addEventListener('change', (e) => {
        localStorage.setItem('naam_autoStart', e.target.checked);
        console.log('[UI] Auto-start:', e.target.checked);
      });
    }
    
    // Extra simran buttons
    if (this.startNowBtn) {
      this.startNowBtn.addEventListener('click', () => {
        const duration = parseInt(localStorage.getItem('naam_duration') || '2');
        this.startQuickSession(duration);
      });
    }
    
    if (this.quickBtn) {
      this.quickBtn.addEventListener('click', () => {
        this.startQuickSession(5);
      });
    }
    
    if (this.deepBtn) {
      this.deepBtn.addEventListener('click', () => {
        this.startQuickSession(13);
      });
    }
    
    // Popup buttons
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.hidePopup();
        this.startSession();
      });
    }
    
    if (this.laterBtn) {
      this.laterBtn.addEventListener('click', () => {
        this.hidePopup();
        if (this.engine.fsm) {
          this.engine.fsm.transition(SessionEvents.LATER_CLICKED);
        }
      });
    }
    
    // End session
    if (this.endBtn) {
      this.endBtn.addEventListener('click', () => {
        this.endSession();
      });
    }
    
    // Continue button
    if (this.continueBtn) {
      this.continueBtn.addEventListener('click', () => {
        this.hideCompletePopup();
        if (this.engine.fsm) {
          this.engine.fsm.transition(SessionEvents.POPUP_DISMISSED);
        }
      });
    }
    
    // Back button
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
  }
  
  subscribeToEngine() {
    // Listen to timer updates
    window.addEventListener('naamAbhyasTimerUpdate', (e) => {
      this.updateTimer(e.detail);
    });
    
    // Listen to session completion
    window.addEventListener('naamAbhyasSessionComplete', () => {
      this.showCompletePopup();
    });
    
    // Listen to FSM transitions
    window.addEventListener('naamAbhyasFSMTransition', (e) => {
      this.handleFSMTransition(e.detail);
    });
    
    // Subscribe to state changes
    this.engine.store.subscribe((state) => {
      this.renderState(state);
    });
  }
  
  handleFSMTransition(transition) {
    const { to } = transition;
    
    if (to === SessionStates.POPUP_OPEN) {
      this.showSessionPopup();
    } else if (to === SessionStates.SESSION_RUNNING) {
      this.showSessionView();
    } else if (to === SessionStates.SESSION_COMPLETED) {
      this.hideSessionView();
    } else if (to === SessionStates.IDLE) {
      this.hideAllPopups();
    }
  }
  
  async startSession() {
    await this.engine.startSession();
  }
  
  async startQuickSession(durationMinutes) {
    console.log(`[UI] Starting quick session: ${durationMinutes} minutes`);
    
    // Show session view immediately
    this.showSessionView();
    
    // Set initial timer display
    if (this.timerValue) {
      this.timerValue.textContent = `${durationMinutes}:00`;
    }
    
    // Start the session through the engine
    try {
      await this.engine.startSession(durationMinutes);
    } catch (err) {
      console.error('[UI] Quick session error:', err);
    }
  }
  
  showCustomDurationPrompt() {
    const duration = prompt('Enter duration in minutes (1-60):');
    if (duration) {
      const minutes = parseInt(duration);
      if (minutes >= 1 && minutes <= 60) {
        this.startQuickSession(minutes);
      } else {
        alert('Please enter a number between 1 and 60');
      }
    }
  }
  
  endSession() {
    this.engine.session.completeSession();
  }
  
  showSettings() {
    this.settingsModal.classList.add('visible');
  }
  
  hideSettings() {
    this.settingsModal.classList.remove('visible');
  }
  
  showSessionPopup() {
    this.sessionPopup.classList.add('visible');
  }
  
  hidePopup() {
    this.sessionPopup.classList.remove('visible');
  }
  
  showSessionView() {
    this.sessionView.classList.add('active');
  }
  
  hideSessionView() {
    this.sessionView.classList.remove('active');
  }
  
  showCompletePopup() {
    this.completePopup.classList.add('visible');
  }
  
  hideCompletePopup() {
    this.completePopup.classList.remove('visible');
  }
  
  hideAllPopups() {
    this.sessionPopup.classList.remove('visible');
    this.completePopup.classList.remove('visible');
    this.sessionView.classList.remove('active');
  }
  
  updateTimer(detail) {
    const { remaining, percentage } = detail;
    
    // Update display
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    this.timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update progress ring (circumference = 2πr = 2π*90 ≈ 565)
    const offset = 565 - (percentage / 100) * 565;
    this.timerProgress.style.strokeDashoffset = offset;
  }
  
  renderState(state) {
    // Toggle
    if (this.enableToggle && this.toggleStatus) {
      this.enableToggle.checked = state.isEnabled;
      this.toggleStatus.textContent = state.isEnabled ? 'Enabled' : 'Currently disabled';
    }
    
    // Header streak
    if (this.headerStreak) {
      this.headerStreak.textContent = state.stats?.currentStreak || 0;
    }
    
    // Dashboard stats
    if (this.dashStreak) {
      this.dashStreak.textContent = state.stats?.currentStreak || 0;
    }
    if (this.dashToday) {
      this.dashToday.textContent = state.stats?.todayCompleted || 0;
    }
    
    // Update progress ring
    const percentage = ((state.stats?.todayCompleted || 0) / 24) * 100;
    this.updateProgressRing(percentage);
    
    // Refresh timeline
    this.renderTimeline();
  }
  
  render() {
    const state = this.engine.store.getState();
    this.renderState(state);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[UI] Initializing...');
  
  // Initialize engine
  const engine = new NaamAbhyasEngine();
  await engine.initialize();
  
  // Initialize UI
  const ui = new NaamAbhyasUI(engine);
  
  // Make globally accessible
  window.naamAbhyasUI = ui;
  
  console.log('[UI] Ready ✓');
});
