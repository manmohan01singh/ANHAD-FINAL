/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  RITUAL ENGINE v2.0 - Sacred Micro-Commitment System (FIXED)
 *  
 *  FIXES APPLIED:
 *  1. Manual sessions (Start Now/Quick/Deep) are tracked as EXTRA, not scheduled
 *  2. Timer properly uses the duration passed to it
 *  3. Auto-return to main page when timer ends
 *  4. Beep at 10 seconds remaining
 *  5. Proper completion flow with auto-close
 *  
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class RitualEngine {
    constructor(naamAbhyasApp) {
        this.app = naamAbhyasApp;
        this.state = 'IDLE'; // IDLE, SUMMONING, ACTIVE, COMPLETING
        this.sessionStartTime = null;
        this.sessionEndTime = null;
        this.presenceConfirmed = false;
        this.silenceMode = false;
        this.countdownInterval = null;
        this.breathingInterval = null;
        this.autoCloseTimeout = null;

        // Current session being processed
        this.currentSession = null;
        this.isExtraSession = false; // True if Start Now/Quick/Deep (not scheduled)
        this.sessionDurationMinutes = 2; // Actually used duration

        // Track if 10-second beep was played
        this.tenSecondBeepPlayed = false;

        // Affirmations for completion
        this.affirmations = [
            { gurmukhi: "ਧੰਨ ਗੁਰੂ ਨਾਨਕ", english: "Well done. Return to your duty." },
            { gurmukhi: "ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ", english: "You showed up." },
            { gurmukhi: "ਸਤਿ ਨਾਮ", english: "Discipline compounds." },
            { gurmukhi: "ਸ਼ੁਕਰਾਨਾ", english: "Another step on the path." },
            { gurmukhi: "ਚੜ੍ਹਦੀ ਕਲਾ", english: "Your spirit rises." },
            { gurmukhi: "ਮਨ ਜੀਤੇ ਜਗੁ ਜੀਤੁ", english: "Conquer the mind, conquer the world." }
        ];

        // Session metrics
        this.sessionMetrics = {
            presenceConfirmedAt: null,
            userStayedFocused: true,
            windowBlurCount: 0,
            interactionCount: 0
        };

        this.init();
    }

    init() {
        this.createRitualOverlay();
        this.bindVisibilityTracking();
        // Note: We don't auto-start state monitor for scheduled sessions yet
        // this.startStateMonitor();
    }

    /**
     * Create the sacred ritual overlay HTML
     */
    createRitualOverlay() {
        if (document.getElementById('ritualOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'ritualOverlay';
        overlay.className = 'ritual-overlay';
        overlay.innerHTML = `
            <div class="ritual-backdrop"></div>
            <div class="ritual-container">
                <!-- Active Session State -->
                <div class="ritual-active-state" id="ritualActiveState">
                    <div class="ritual-header">
                        <div class="ritual-status-badge">
                            <span class="status-dot pulsing"></span>
                            <span class="status-text">ਨਾਮ ਅਭਿਆਸ ਚੱਲ ਰਿਹਾ ਹੈ</span>
                        </div>
                        <div class="ritual-time-range" id="ritualTimeRange">Session Active</div>
                    </div>
                    
                    <!-- Circular Progress Ring -->
                    <div class="ritual-timer-section">
                        <div class="circular-progress-container" id="circularProgress">
                            <svg class="progress-ring" viewBox="0 0 200 200">
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:#FF9500"/>
                                        <stop offset="50%" style="stop-color:#FFD700"/>
                                        <stop offset="100%" style="stop-color:#FF6B35"/>
                                    </linearGradient>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                        <feMerge>
                                            <feMergeNode in="coloredBlur"/>
                                            <feMergeNode in="SourceGraphic"/>
                                        </feMerge>
                                    </filter>
                                </defs>
                                <circle class="progress-ring-bg" cx="100" cy="100" r="85" />
                                <circle class="progress-ring-fill" id="progressRingFill" cx="100" cy="100" r="85" 
                                    stroke-dasharray="534" stroke-dashoffset="0" filter="url(#glow)"/>
                            </svg>
                            <div class="timer-center">
                                <div class="timer-value" id="ritualTimerValue">2:00</div>
                                <div class="timer-label">ਬਾਕੀ ਸਮਾਂ</div>
                            </div>
                        </div>
                        
                        <!-- Progress Dots -->
                        <div class="ritual-progress-dots" id="ritualProgressDots"></div>
                    </div>
                    
                    <!-- Sacred Symbol -->
                    <div class="ritual-symbol-section">
                        <div class="sacred-symbol breathing">ੴ</div>
                        <div class="waheguru-text">ਵਾਹਿਗੁਰੂ</div>
                        <div class="breathing-guide" id="breathingGuideText">Breathe in... Remember...</div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="ritual-actions">
                        <button class="ritual-btn presence-btn" id="presenceBtn">
                            <span class="btn-icon">🟢</span>
                            <span class="btn-text">I am present</span>
                            <span class="presence-check" id="presenceCheck">✓</span>
                        </button>
                        
                        <div class="secondary-actions">
                            <button class="ritual-btn silence-btn" id="silenceBtn">
                                <span class="btn-icon">🔕</span>
                                <span class="btn-text">Silence</span>
                            </button>
                            
                            <button class="ritual-btn skip-btn" id="skipBtn">
                                <span class="btn-icon">⏭️</span>
                                <span class="btn-text">Skip</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Completion State -->
                <div class="ritual-completion-state hidden" id="ritualCompletionState">
                    <div class="completion-celebration">
                        <div class="completion-checkmark">
                            <svg viewBox="0 0 52 52">
                                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                        </div>
                    </div>
                    
                    <h2 class="completion-title">ਨਾਮ ਅਭਿਆਸ ਸੰਪੂਰਨ</h2>
                    <p class="completion-subtitle">Naam Abhyas Complete</p>
                    
                    <div class="completion-credit">
                        <span class="credit-icon">⏱️</span>
                        <span class="credit-text">+<span id="creditMinutes">2</span> minutes credited</span>
                    </div>
                    
                    <div class="completion-affirmation">
                        <p class="affirmation-gurmukhi" id="affirmationGurmukhi">ਧੰਨ ਗੁਰੂ ਨਾਨਕ</p>
                        <p class="affirmation-english" id="affirmationEnglish">"Well done. Return to your duty."</p>
                    </div>
                    
                    <div class="completion-stats">
                        <div class="comp-stat">
                            <span class="stat-value" id="compStreakRitual">0</span>
                            <span class="stat-label">🔥 Streak</span>
                        </div>
                        <div class="comp-stat">
                            <span class="stat-value" id="compTodayRitual">0</span>
                            <span class="stat-label">📅 Today</span>
                        </div>
                        <div class="comp-stat">
                            <span class="stat-value" id="compTotalRitual">0</span>
                            <span class="stat-label">⏱️ Total</span>
                        </div>
                    </div>
                    
                    <button class="continue-day-btn" id="continueDayBtn">
                        <span>Continue my day</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Skip Confirmation Modal -->
            <div class="skip-confirm-modal hidden" id="skipConfirmModal">
                <div class="skip-confirm-content">
                    <div class="skip-icon">⚠️</div>
                    <h3>Skip this session?</h3>
                    <p>Skipping breaks your streak and resets progress.</p>
                    <p class="skip-wisdom">"ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ"</p>
                    <p class="skip-wisdom-trans">Recognize your true divine nature</p>
                    <div class="skip-buttons">
                        <button class="cancel-skip-btn" id="cancelSkipBtn">Stay & Continue</button>
                        <button class="confirm-skip-btn" id="confirmSkipBtn">Skip This Time</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.bindRitualEvents();
    }

    /**
     * Bind event listeners for ritual overlay
     */
    bindRitualEvents() {
        const presenceBtn = document.getElementById('presenceBtn');
        if (presenceBtn) {
            presenceBtn.addEventListener('click', () => this.confirmPresence());
        }

        const silenceBtn = document.getElementById('silenceBtn');
        if (silenceBtn) {
            silenceBtn.addEventListener('click', () => this.toggleSilence());
        }

        const skipBtn = document.getElementById('skipBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.showSkipConfirmation());
        }

        const cancelSkipBtn = document.getElementById('cancelSkipBtn');
        if (cancelSkipBtn) {
            cancelSkipBtn.addEventListener('click', () => this.hideSkipConfirmation());
        }

        const confirmSkipBtn = document.getElementById('confirmSkipBtn');
        if (confirmSkipBtn) {
            confirmSkipBtn.addEventListener('click', () => this.confirmSkip());
        }

        const continueDayBtn = document.getElementById('continueDayBtn');
        if (continueDayBtn) {
            continueDayBtn.addEventListener('click', () => this.continueDay());
        }
    }

    /**
     * Track window visibility
     */
    bindVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (this.state === 'ACTIVE') {
                if (document.hidden) {
                    this.sessionMetrics.windowBlurCount++;
                    this.sessionMetrics.userStayedFocused = false;
                }
            }
        });
    }

    /**
     * MAIN ENTRY POINT: Trigger a manual session (Start Now / Quick / Deep)
     * @param {number} durationMinutes - Duration in minutes (0.5, 2, 11, etc.)
     * @param {boolean} isExtra - True if this is an EXTRA session (not counting towards schedule)
     */
    triggerManualSession(durationMinutes = 2, isExtra = true) {
        console.log(`[RitualEngine] Starting ${isExtra ? 'EXTRA' : 'SCHEDULED'} session: ${durationMinutes} minutes`);

        this.sessionDurationMinutes = durationMinutes;
        this.isExtraSession = isExtra;
        this.tenSecondBeepPlayed = false;

        const now = new Date();
        const endMinute = now.getMinutes() + Math.ceil(durationMinutes);

        this.currentSession = {
            hour: now.getHours(),
            startMinute: now.getMinutes(),
            endMinute: endMinute,
            startTime: this.formatTime12h(now.getHours(), now.getMinutes()),
            endTime: this.formatTime12h(now.getHours(), endMinute),
            status: 'pending',
            isExtra: isExtra,
            durationMinutes: durationMinutes
        };

        this.enterActiveState();
    }

    /**
     * ENTRY POINT FOR SCHEDULED SESSIONS: Triggered by the countdown system
     * These sessions COUNT towards streak and schedule completion
     * @param {Object} scheduleSession - Session object from the schedule
     * @param {number} durationMinutes - Duration in minutes
     */
    triggerScheduledSession(scheduleSession, durationMinutes = 2) {
        console.log(`[RitualEngine] 🕐 Starting SCHEDULED session:`, scheduleSession);

        this.sessionDurationMinutes = durationMinutes;
        this.isExtraSession = false; // NOT extra - this is scheduled
        this.tenSecondBeepPlayed = false;

        // Use the session data from the schedule
        this.currentSession = {
            ...scheduleSession,
            status: 'pending',
            isExtra: false,
            durationMinutes: durationMinutes
        };

        // Play arrival sound
        this.playBeep('start');

        // Vibrate pattern for attention
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        this.enterActiveState();
    }

    /**
     * Format time to 12-hour format
     */
    formatTime12h(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMinute = (minute % 60).toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    }

    /**
     * Enter Active State - Start the timer
     */
    enterActiveState() {
        this.state = 'ACTIVE';
        this.sessionStartTime = new Date();
        this.presenceConfirmed = false;
        this.sessionMetrics = {
            presenceConfirmedAt: null,
            userStayedFocused: true,
            windowBlurCount: 0,
            interactionCount: 0
        };

        console.log('[RitualEngine] Entering ACTIVE state');

        // Show overlay
        const overlay = document.getElementById('ritualOverlay');
        const activeState = document.getElementById('ritualActiveState');
        const completionState = document.getElementById('ritualCompletionState');

        if (overlay) overlay.classList.add('active');
        if (activeState) activeState.classList.remove('hidden');
        if (completionState) completionState.classList.add('hidden');

        // Pause heavy background animations for performance
        const canvas = document.getElementById('cosmosCanvas');
        if (canvas) canvas.style.display = 'none';
        const starsField = document.getElementById('starsField');
        if (starsField) starsField.style.animationPlayState = 'paused';

        // Update time range display
        const timeRange = document.getElementById('ritualTimeRange');
        if (timeRange && this.currentSession) {
            const typeLabel = this.isExtraSession ? '(Extra Session)' : '';
            timeRange.textContent = `${this.currentSession.startTime} – ${this.currentSession.endTime} ${typeLabel}`;
        }

        // Reset presence button
        const presenceBtn = document.getElementById('presenceBtn');
        const presenceCheck = document.getElementById('presenceCheck');
        if (presenceBtn) presenceBtn.classList.remove('confirmed');
        if (presenceCheck) presenceCheck.style.display = 'none';

        // Start countdown timer with actual duration
        this.startCountdown(this.sessionDurationMinutes);

        // Start breathing guide
        this.startBreathingGuide();

        // Play session start sound
        this.playBeep('start');

        // Auto-play Vaheguru Jaap in background during session
        if (this.app?.audioManager) {
            this.app.audioManager.playAmbient(0.25).then(() => {
                console.log('[RitualEngine] Vaheguru Jaap started');
            }).catch(e => console.log('[RitualEngine] Vaheguru Jaap failed:', e));
        }

        // Vibrate if enabled
        if (this.app?.config?.notifications?.vibration && navigator.vibrate) {
            navigator.vibrate([150, 100, 150]);
        }

        // Request wake lock
        if (this.app?.requestWakeLock) {
            this.app.requestWakeLock();
        }
    }

    /**
     * Start the countdown timer (FIXED - uses passed duration)
     * @param {number} durationMinutes - Duration in minutes
     */
    startCountdown(durationMinutes) {
        const durationSeconds = durationMinutes * 60;
        const startTime = Date.now();
        const endTime = startTime + (durationSeconds * 1000);

        const timerEl = document.getElementById('ritualTimerValue');
        const progressRing = document.getElementById('progressRingFill');
        const circumference = 2 * Math.PI * 85;

        if (progressRing) {
            progressRing.style.strokeDasharray = circumference;
            progressRing.style.strokeDashoffset = 0;
        }

        // Generate progress dots
        this.generateProgressDots(8);

        console.log(`[RitualEngine] Starting countdown: ${durationMinutes} minutes (${durationSeconds} seconds)`);

        this.countdownInterval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, (endTime - now) / 1000);

            // TIMER COMPLETE - Auto-complete and return
            if (remaining <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;

                if (timerEl) timerEl.textContent = '0:00';

                // Auto-complete and close
                this.completeSession();
                return;
            }

            // Play beep at 10 seconds remaining
            if (remaining <= 10 && !this.tenSecondBeepPlayed) {
                this.tenSecondBeepPlayed = true;
                this.playBeep('warning');
            }

            // Update timer display
            const mins = Math.floor(remaining / 60);
            const secs = Math.floor(remaining % 60);
            if (timerEl) {
                timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }

            // Update progress ring
            const elapsed = durationSeconds - remaining;
            const progress = elapsed / durationSeconds;
            if (progressRing) {
                progressRing.style.strokeDashoffset = circumference * progress;
            }

            // Update progress dots
            this.updateProgressDots(elapsed, durationSeconds);

        }, 100);
    }

    /**
     * Generate progress dots
     */
    generateProgressDots(count) {
        const container = document.getElementById('ritualProgressDots');
        if (!container) return;

        let html = '';
        for (let i = 0; i < count; i++) {
            html += `<div class="ritual-dot" data-index="${i}"></div>`;
        }
        container.innerHTML = html;
    }

    /**
     * Update progress dots
     */
    updateProgressDots(elapsed, total) {
        const container = document.getElementById('ritualProgressDots');
        if (!container) return;

        const dots = container.querySelectorAll('.ritual-dot');
        const progress = elapsed / total;
        const activeDots = Math.floor(progress * dots.length);

        dots.forEach((dot, i) => {
            dot.classList.remove('filled', 'current');
            if (i < activeDots) {
                dot.classList.add('filled');
            } else if (i === activeDots) {
                dot.classList.add('current');
            }
        });
    }

    /**
     * Start breathing guide
     */
    startBreathingGuide() {
        const guideEl = document.getElementById('breathingGuideText');
        if (!guideEl) return;

        const phases = [
            "Breathe in... ਸਾਹ ਲਓ...",
            "Hold... ਰੋਕੋ...",
            "Breathe out... ਛੱਡੋ...",
            "Remember Vaheguru... ਵਾਹਿਗੁਰੂ..."
        ];

        let phaseIndex = 0;

        const updatePhase = () => {
            if (this.state !== 'ACTIVE') return;

            guideEl.style.opacity = '0';
            setTimeout(() => {
                guideEl.textContent = phases[phaseIndex];
                guideEl.style.opacity = '1';
            }, 300);

            phaseIndex = (phaseIndex + 1) % phases.length;
        };

        updatePhase();
        this.breathingInterval = setInterval(updatePhase, 4000);
    }

    /**
     * Confirm user presence
     */
    confirmPresence() {
        if (this.presenceConfirmed) return;

        this.presenceConfirmed = true;
        this.sessionMetrics.presenceConfirmedAt = new Date();

        const presenceBtn = document.getElementById('presenceBtn');
        const presenceCheck = document.getElementById('presenceCheck');

        if (presenceBtn) {
            presenceBtn.classList.add('confirmed');
            // Add glow animation
            presenceBtn.style.boxShadow = '0 0 30px rgba(52, 199, 89, 0.6)';
        }
        if (presenceCheck) {
            presenceCheck.style.display = 'inline';
        }

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        // Play confirmation beep
        this.playBeep('confirm');
    }

    /**
     * Toggle silence mode
     */
    toggleSilence() {
        this.silenceMode = !this.silenceMode;

        const silenceBtn = document.getElementById('silenceBtn');
        if (silenceBtn) {
            silenceBtn.classList.toggle('active', this.silenceMode);
            const icon = silenceBtn.querySelector('.btn-icon');
            if (icon) {
                icon.textContent = this.silenceMode ? '🔇' : '🔕';
            }
        }
    }

    /**
     * Show skip confirmation
     */
    showSkipConfirmation() {
        const modal = document.getElementById('skipConfirmModal');
        if (modal) modal.classList.remove('hidden');
    }

    /**
     * Hide skip confirmation
     */
    hideSkipConfirmation() {
        const modal = document.getElementById('skipConfirmModal');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Confirm skip
     */
    confirmSkip() {
        this.hideSkipConfirmation();
        this.cleanup();

        // Close overlay immediately
        const overlay = document.getElementById('ritualOverlay');
        if (overlay) overlay.classList.remove('active');

        // Only record skip for scheduled sessions, not extra
        if (!this.isExtraSession && this.app) {
            this.app.skipCurrentSession();
        }

        this.state = 'IDLE';

        // Update UI
        if (this.app?.updateUI) {
            this.app.updateUI();
        }
    }

    /**
     * COMPLETE SESSION - Auto-close and return to main page
     */
    completeSession() {
        console.log('[RitualEngine] Session complete - auto-closing');

        this.cleanup();

        // Play completion beep
        this.playBeep('complete');

        // Vibrate completion
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        // Record the session
        if (this.app && this.currentSession) {
            const sessionData = {
                hour: this.currentSession.hour,
                startTime: this.currentSession.startTime,
                duration: this.sessionDurationMinutes * 60, // seconds
                status: 'completed',
                endedEarly: false,
                presenceConfirmed: this.presenceConfirmed,
                isExtra: this.isExtraSession,
                metrics: { ...this.sessionMetrics }
            };

            // Only mark in schedule if not extra
            if (!this.isExtraSession && this.app.currentSchedule?.[this.currentSession.hour]) {
                this.app.currentSchedule[this.currentSession.hour].status = 'completed';
            }

            // Record session (handles both scheduled and extra)
            this.app.recordSession(sessionData);

            // Update streak only for scheduled sessions
            if (!this.isExtraSession) {
                this.app.updateStreak();
            }

            // ═══ SYNC TO NITNEM TRACKER ═══
            // Dispatch event so global-alarm-system.js can sync to Nitnem Tracker
            window.dispatchEvent(new CustomEvent('naamAbhyasComplete', {
                detail: {
                    count: 1,
                    duration: this.sessionDurationMinutes * 60,
                    hour: this.currentSession.hour,
                    isScheduled: !this.isExtraSession,
                    presenceConfirmed: this.presenceConfirmed
                }
            }));
            console.log('[RitualEngine] ✅ Dispatched naamAbhyasComplete for Nitnem sync');
        }

        // Show brief completion message then auto-close
        this.showCompletionBriefly();
    }

    /**
     * Show completion state briefly, then auto-close
     */
    showCompletionBriefly() {
        const activeState = document.getElementById('ritualActiveState');
        const completionState = document.getElementById('ritualCompletionState');

        if (activeState) activeState.classList.add('hidden');
        if (completionState) completionState.classList.remove('hidden');

        // Set affirmation
        const affirmation = this.affirmations[Math.floor(Math.random() * this.affirmations.length)];
        const gurmukhiEl = document.getElementById('affirmationGurmukhi');
        const englishEl = document.getElementById('affirmationEnglish');
        if (gurmukhiEl) gurmukhiEl.textContent = affirmation.gurmukhi;
        if (englishEl) englishEl.textContent = `"${affirmation.english}"`;

        // Update credit minutes
        const creditEl = document.getElementById('creditMinutes');
        if (creditEl) creditEl.textContent = this.sessionDurationMinutes;

        // Update stats
        this.updateCompletionStats();

        // Trigger completion celebration animation
        this.triggerCompletionCelebration();

        // Auto-close after 5 seconds (extended for celebration)
        this.autoCloseTimeout = setTimeout(() => {
            this.continueDay();
        }, 5000);
    }

    /**
     * Trigger golden particle celebration animation
     */
    triggerCompletionCelebration() {
        const overlay = document.getElementById('ritualOverlay');
        if (!overlay) return;

        // Create celebration container
        const celebration = document.createElement('div');
        celebration.className = 'completion-celebration';
        celebration.innerHTML = `
            <div class="celebration-waheguru">ਵਾਹਿਗੁਰੂ</div>
            <div class="celebration-particles"></div>
        `;
        overlay.appendChild(celebration);

        // Create golden particles
        const particlesContainer = celebration.querySelector('.celebration-particles');
        const colors = ['#FFD700', '#FFA500', '#FFDF00', '#F0E68C', '#FFF8DC'];

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';

            const angle = (Math.random() * 360) * (Math.PI / 180);
            const distance = 80 + Math.random() * 120;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            const size = 4 + Math.random() * 8;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                box-shadow: 0 0 ${size * 2}px ${color};
                left: 50%;
                top: 50%;
                animation: particleBurst 1.5s ease-out forwards;
                animation-delay: ${Math.random() * 0.3}s;
                --endX: ${endX}px;
                --endY: ${endY}px;
            `;

            particlesContainer.appendChild(particle);
        }

        // Add celebration styles if not already added
        if (!document.getElementById('celebration-styles')) {
            const styles = document.createElement('style');
            styles.id = 'celebration-styles';
            styles.textContent = `
                .completion-celebration {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    z-index: 10000;
                }
                .celebration-waheguru {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #FFD700;
                    text-shadow: 0 0 30px rgba(255, 215, 0, 0.8),
                                 0 0 60px rgba(255, 215, 0, 0.4);
                    animation: waheguruAppear 0.8s ease-out forwards;
                    opacity: 0;
                    transform: scale(0.5);
                }
                .celebration-particles {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .celebration-particle {
                    opacity: 0;
                }
                @keyframes waheguruAppear {
                    0% { opacity: 0; transform: scale(0.5) translateY(20px); }
                    50% { opacity: 1; transform: scale(1.1) translateY(-10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes particleBurst {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(calc(-50% + var(--endX)), calc(-50% + var(--endY))) scale(1);
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Cleanup celebration after animation
        setTimeout(() => {
            celebration.remove();
        }, 2000);
    }

    /**
     * Update completion stats
     */
    updateCompletionStats() {
        if (!this.app?.history) return;

        const stats = this.app.history.statistics;
        const today = this.app.getTodayString ? this.app.getTodayString() : new Date().toLocaleDateString('en-CA');
        const todaysSessions = this.app.history.sessions.filter(s =>
            s.date === today && s.status === 'completed'
        ).length;

        const totalMinutes = Math.floor(stats.totalTimeSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeStr = hours > 0 ? `${hours}h` : `${mins}m`;

        const streakEl = document.getElementById('compStreakRitual');
        const todayEl = document.getElementById('compTodayRitual');
        const totalEl = document.getElementById('compTotalRitual');

        if (streakEl) streakEl.textContent = stats.currentStreak || 0;
        if (todayEl) todayEl.textContent = todaysSessions;
        if (totalEl) totalEl.textContent = timeStr;
    }

    /**
     * Continue day - close overlay and return to main page
     */
    continueDay() {
        // Clear auto-close timeout
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        const overlay = document.getElementById('ritualOverlay');
        if (overlay) overlay.classList.remove('active');

        this.cleanup();
        this.state = 'IDLE';

        // Update main app UI
        if (this.app?.updateUI) {
            this.app.updateUI();
        }

        // Release wake lock
        if (this.app?.releaseWakeLock) {
            this.app.releaseWakeLock();
        }
    }

    /**
     * Cleanup timers and state
     */
    cleanup() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
            this.breathingInterval = null;
        }
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }
        // Stop Vaheguru Jaap ambient audio
        if (this.app?.audioManager) {
            this.app.audioManager.stopAmbient();
        }

        // Resume background animations
        const canvas = document.getElementById('cosmosCanvas');
        if (canvas) canvas.style.display = '';
        const starsField = document.getElementById('starsField');
        if (starsField) starsField.style.animationPlayState = '';
    }

    /**
     * Play a beep sound (Web Audio API fallback for missing files)
     */
    playBeep(type = 'start') {
        if (this.silenceMode) return;

        // Try to play actual sound file first
        if (this.app?.playSound) {
            try {
                this.app.playSound(type === 'complete' ? 'end-bell' : 'gentle-bell');
            } catch (e) {
                // Fallback to Web Audio API beep
                this.playWebAudioBeep(type);
            }
        } else {
            this.playWebAudioBeep(type);
        }
    }

    /**
     * Fallback beep using Web Audio API
     */
    playWebAudioBeep(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different beep types
            const frequencies = {
                'start': 600,
                'confirm': 800,
                'warning': 500,
                'complete': 700
            };

            oscillator.frequency.value = frequencies[type] || 600;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('[RitualEngine] Audio not available');
        }
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Check if ritual is active
     */
    isActive() {
        return this.state === 'ACTIVE' || this.state === 'COMPLETING';
    }
}

// Export for use
window.RitualEngine = RitualEngine;
