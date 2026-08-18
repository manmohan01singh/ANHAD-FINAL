/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NAAM ALARM — Single Source of Truth Notification System
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE system. ONE alarm per hour. NO race conditions.
 *
 * Pipeline:
 *   generateSchedule() → arm timers → fire notification → show popup → complete
 *
 * All other notification senders (capacitor-notifications-global,
 * scheduleUpcomingNotifications, NotificationEngine, scheduleViaSW)
 * are DISABLED by this module after it loads.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

(function () {

    /* ═══════════════════════════════════════════════════════════════════
       LOCK: Prevent multiple instances
    ═══════════════════════════════════════════════════════════════════ */
    if (window.__NaamAlarmActive) {
        console.warn('[NaamAlarm] Already active — skipping duplicate init');
        return;
    }
    window.__NaamAlarmActive = true;

    /* ═══════════════════════════════════════════════════════════════════
       CONSTANTS
    ═══════════════════════════════════════════════════════════════════ */
    const STORAGE_KEY    = 'naam_abhyas_config';
    const SCHEDULE_KEY   = 'naam_alarm_schedule';
    const FIRED_KEY      = 'naam_alarm_fired_today';
    const TICK_MS        = 15000;   // Check every 15 seconds
    const FIRE_WINDOW_MS = 90000;   // Session is "due" if within 90 seconds

    const SPIRITUAL_MESSAGES = [
        'ਸਬ ਕੰਮ ਛੱਡੋ। ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਕਰੋ 🙏',
        'Leave all work. Close your eyes. Remember Vaheguru.',
        'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ — Meditate for peace.',
        'Your soul is calling. Pause. Remember Waheguru Ji.',
        'Be still. Breathe. Remember Vaheguru for 2 sacred minutes.',
        'ਜਪਿ ਮਨ ਸਤਿ ਨਾਮੁ ਸਦਾ ਸਤਿ ਨਾਮੁ — Chant the True Name.'
    ];

    /* ═══════════════════════════════════════════════════════════════════
       HELPER: get today string yyyy-mm-dd
    ═══════════════════════════════════════════════════════════════════ */
    function todayKey() {
        return new Date().toLocaleDateString('en-CA');
    }

    /* ═══════════════════════════════════════════════════════════════════
       NAAM ALARM CLASS
    ═══════════════════════════════════════════════════════════════════ */
    class NaamAlarm {
        constructor() {
            this._tickTimer   = null;
            this._schedule    = {};     // { hour: { minute, fired } }
            this._firedToday  = {};     // { "hour:minute": true }
            this._popupOpen   = false;
            this._sessionData = null;   // currently active session data
            this._timerInterval = null; // meditation countdown
            this._timerSeconds  = 0;
            this._totalSeconds  = 0;
            this._isSilent      = false;
            this._startTime     = null;

            this._loadFired();
        }

        /* ───────────────────────────────────────────────────
           CONFIG helpers
        ─────────────────────────────────────────────────── */
        _cfg() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
            } catch { return {}; }
        }

        _isEnabled() {
            return !!this._cfg().enabled;
        }

        /* ───────────────────────────────────────────────────
           FIRED-TODAY state (persists across page reloads)
        ─────────────────────────────────────────────────── */
        _loadFired() {
            try {
                const raw = localStorage.getItem(FIRED_KEY);
                if (raw) {
                    const { date, fired } = JSON.parse(raw);
                    this._firedToday = (date === todayKey()) ? (fired || {}) : {};
                }
            } catch { this._firedToday = {}; }
        }

        _saveFired() {
            try {
                localStorage.setItem(FIRED_KEY, JSON.stringify({
                    date: todayKey(),
                    fired: this._firedToday
                }));
            } catch {}
        }

        _markFired(key) {
            this._firedToday[key] = true;
            this._saveFired();
        }

        _alreadyFired(key) {
            return !!this._firedToday[key];
        }

        /* ───────────────────────────────────────────────────
           SCHEDULE: load from localStorage (written by naam-abhyas.js)
        ─────────────────────────────────────────────────── */
        _loadSchedule() {
            try {
                const raw = localStorage.getItem(SCHEDULE_KEY)
                         || localStorage.getItem('naam_abhyas_schedule');
                if (!raw) return {};
                return JSON.parse(raw) || {};
            } catch { return {}; }
        }

        /* ───────────────────────────────────────────────────
           START / STOP
        ─────────────────────────────────────────────────── */
        start() {
            this._stop();
            this._tick();
            this._tickTimer = setInterval(() => this._tick(), TICK_MS);
            console.log('[NaamAlarm] ✅ Started — checking every', TICK_MS / 1000, 's');
        }

        _stop() {
            if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
        }

        /* ───────────────────────────────────────────────────
           TICK — called every 15 seconds
        ─────────────────────────────────────────────────── */
        _tick() {
            if (!this._isEnabled()) return;
            if (this._popupOpen)   return;   // don't interrupt active session

            const schedule = this._loadSchedule();
            const now      = new Date();
            const nowMs    = now.getTime();
            const nowHour  = now.getHours();
            const nowMin   = now.getMinutes();

            for (const [hourStr, session] of Object.entries(schedule)) {
                if (!session) continue;

                const hour = parseInt(hourStr, 10);
                const min  = session.startMinute !== undefined ? session.startMinute : 0;

                // Build scheduled timestamp for today
                const due  = new Date(now);
                due.setHours(hour, min, 0, 0);
                const dueMs = due.getTime();

                const firedKey = `${hour}:${min}`;

                // Fire if: within window, not already fired, session is pending
                const inWindow = nowMs >= dueMs && nowMs < dueMs + FIRE_WINDOW_MS;
                if (inWindow && !this._alreadyFired(firedKey) && session.status !== 'completed' && session.status !== 'skipped') {
                    console.log(`[NaamAlarm] 🔔 FIRING session for hour ${hour} at ${min} min`);
                    this._markFired(firedKey);
                    this._fireSession(session, hour, min);
                    return; // only one per tick
                }
            }
        }

        /* ───────────────────────────────────────────────────
           FIRE SESSION: notification + popup
        ─────────────────────────────────────────────────── */
        _fireSession(session, hour, min) {
            // 1. Send browser notification (if permitted)
            this._sendNotification(session, hour, min);

            // 2. Show in-app popup (if page is visible)
            if (!document.hidden) {
                this._showSessionAlert(session, hour, min);
            }
        }

        /* ───────────────────────────────────────────────────
           NOTIFICATION: one simple Web Notification
        ─────────────────────────────────────────────────── */
        _sendNotification(session, hour, min) {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') {
                Notification.requestPermission().catch(() => {});
                return;
            }

            const cfg     = this._cfg();
            const dur     = cfg.duration || 2;
            const msg     = SPIRITUAL_MESSAGES[Math.floor(Math.random() * SPIRITUAL_MESSAGES.length)];
            const title   = '🙏 ਨਾਮ ਅਭਿਆਸ ਦਾ ਸਮਾਂ';
            const tag     = `naam-alarm-${todayKey()}-${hour}`;

            try {
                const notif = new Notification(title, {
                    body: msg,
                    icon:  '../assets/icon-192x192.png',
                    badge: '../assets/icon-72x72.png',
                    tag:   tag,
                    renotify: true,
                    requireInteraction: true,
                    silent: false,
                    data: { hour, min, dur, url: window.location.href }
                });

                notif.onclick = () => {
                    window.focus();
                    notif.close();
                    if (!this._popupOpen) {
                        this._showSessionAlert(session, hour, min);
                    }
                };

                console.log(`[NaamAlarm] 📳 Notification sent: ${title}`);
            } catch (e) {
                console.warn('[NaamAlarm] Notification error:', e);
            }
        }

        /* ───────────────────────────────────────────────────
           SESSION ALERT POPUP
        ─────────────────────────────────────────────────── */
        _showSessionAlert(session, hour, min) {
            if (this._popupOpen) return;
            this._popupOpen = true;
            this._sessionData = { session, hour, min };

            const cfg    = this._cfg();
            const dur    = cfg.duration || 2;
            const time12 = this._fmt12(hour, min);

            // Update alert modal content
            const alertTitle   = document.getElementById('alertTitle');
            const alertMessage = document.getElementById('alertMessage');
            const alertTimeChip = document.getElementById('alertTimeChip');

            if (alertTitle)    alertTitle.textContent  = 'Time for Naam Simran';
            if (alertMessage)  alertMessage.textContent = '"Leave all work. Close your eyes. Remember Vaheguru."';
            if (alertTimeChip) alertTimeChip.textContent = `${dur} min`;

            const modal = document.getElementById('sessionAlertModal');
            if (modal) {
                modal.classList.add('active');
                console.log('[NaamAlarm] 🪄 Session alert popup shown');
            } else {
                // No modal found — start meditation directly
                this._startMeditation(dur, false);
            }
        }

        _hideSessionAlert() {
            const modal = document.getElementById('sessionAlertModal');
            if (modal) modal.classList.remove('active');
        }

        /* ───────────────────────────────────────────────────
           MEDITATION TIMER
        ─────────────────────────────────────────────────── */
        _startMeditation(durationMinutes, silent) {
            this._isSilent    = !!silent;
            this._totalSeconds = Math.round(durationMinutes * 60);
            this._timerSeconds = this._totalSeconds;
            this._startTime   = Date.now();

            // Show meditation overlay
            const overlay = document.getElementById('meditationOverlay');
            if (overlay) overlay.classList.add('active');

            // Reset mute button
            const silentBtn  = document.getElementById('medSilentBtn');
            const silentIcon = document.getElementById('silentBtnIcon');
            const silentLabel = document.getElementById('silentBtnLabel');
            if (silentBtn)   { silentBtn.dataset.muted = 'false'; }
            if (silentIcon)  { silentIcon.textContent = '🔊'; }
            if (silentLabel) { silentLabel.textContent = 'Silent'; }

            this._updateTimerDisplay();
            this._updateBreathingGuide(0);

            // Start countdown
            clearInterval(this._timerInterval);
            this._timerInterval = setInterval(() => this._timerTick(), 1000);

            // Play start sound
            if (!silent) this._playChime('start');

            console.log(`[NaamAlarm] ⏱ Meditation started: ${durationMinutes}m`);
        }

        _timerTick() {
            this._timerSeconds--;
            const elapsed = this._totalSeconds - this._timerSeconds;
            const progress = elapsed / this._totalSeconds;

            this._updateTimerDisplay();
            this._updateProgressRing(progress);
            this._updateProgressBar(progress);
            this._updateBreathingGuide(elapsed);

            if (this._timerSeconds <= 0) {
                this._completeMeditation();
            }
        }

        _updateTimerDisplay() {
            const el = document.getElementById('timerDisplay');
            if (!el) return;
            const m = Math.floor(this._timerSeconds / 60);
            const s = this._timerSeconds % 60;
            el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }

        _updateProgressRing(progress) {
            const ring = document.getElementById('medProgressRing');
            if (!ring) return;
            const circumference = 2 * Math.PI * 85; // r=85
            ring.style.strokeDashoffset = circumference * (1 - progress);
        }

        _updateProgressBar(progress) {
            const bar = document.getElementById('timerProgressBar');
            if (bar) bar.style.width = (progress * 100) + '%';
        }

        _updateBreathingGuide(elapsed) {
            const el = document.getElementById('breathingGuide');
            if (!el) return;
            const phase = Math.floor(elapsed / 4) % 3;
            const guides = ['Breathe in... 🌬️', 'Hold gently... 🙏', 'Breathe out... ✨'];
            el.textContent = guides[phase];
        }

        _completeMeditation() {
            clearInterval(this._timerInterval);
            this._timerInterval = null;

            // Hide meditation overlay
            const overlay = document.getElementById('meditationOverlay');
            if (overlay) overlay.classList.remove('active');

            // Play completion chime
            if (!this._isSilent) this._playChime('complete');

            // Record session in history
            this._recordCompletion();

            // Show completion modal
            this._showCompletionModal();

            this._popupOpen = false;
        }

        _endEarly() {
            clearInterval(this._timerInterval);
            this._timerInterval = null;

            const overlay = document.getElementById('meditationOverlay');
            if (overlay) overlay.classList.remove('active');

            const elapsed = Math.round((Date.now() - (this._startTime || Date.now())) / 1000);

            if (elapsed >= 30) {
                // Count as partial
                this._recordCompletion(elapsed);
                this._showCompletionModal(true);
            } else {
                this._popupOpen = false;
                this._sessionData = null;
            }
        }

        /* ───────────────────────────────────────────────────
           COMPLETION MODAL
        ─────────────────────────────────────────────────── */
        _showCompletionModal(partial) {
            const cfg     = this._cfg();
            const dur     = cfg.duration || 2;
            const total   = this._totalSeconds;
            const elapsed = Math.round((Date.now() - (this._startTime || Date.now())) / 1000);
            const actual  = partial ? elapsed : total;

            const m = Math.floor(actual / 60);
            const s = actual % 60;

            const blessings = [
                'Wonderful! You remembered Guru Maharaj Ji 🙏',
                'Beautiful! Waheguru was with you ✨',
                'Sat Sri Akal! Your Simran is complete 🌸',
                'ਧੰਨ ਧੰਨ! Blessed is this moment 🌺',
                'You have honored your practice 🙏'
            ];

            // Update modal fields
            const titleEl    = document.getElementById('completionTitle');
            const blessingEl = document.getElementById('completionBlessing');
            const durationEl = document.getElementById('compDuration');
            const streakEl   = document.getElementById('compStreak');
            const todayEl    = document.getElementById('compToday');
            const nextEl     = document.getElementById('nextSessionInfo');

            if (titleEl)    titleEl.textContent   = partial ? 'Session Ended' : 'Wonderful!';
            if (blessingEl) blessingEl.textContent = blessings[Math.floor(Math.random() * blessings.length)];
            if (durationEl) durationEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

            // Streak & today from history
            try {
                const hist = JSON.parse(localStorage.getItem('naam_abhyas_history') || '{}');
                const today = todayKey();
                const todayDone = (hist.daily && hist.daily[today] && hist.daily[today].completed) || 0;
                if (streakEl) streakEl.textContent = hist.currentStreak || hist.statistics?.currentStreak || 0;
                if (todayEl)  todayEl.textContent  = todayDone;
            } catch {
                if (streakEl) streakEl.textContent = 0;
                if (todayEl)  todayEl.textContent  = 0;
            }

            // Next session info
            const next = this._findNextSession();
            if (nextEl && next) nextEl.textContent = `Next Naam Abhyas at ${next}`;

            const modal = document.getElementById('completionModal');
            if (modal) modal.classList.add('active');
        }

        _hideCompletionModal() {
            const modal = document.getElementById('completionModal');
            if (modal) modal.classList.remove('active');
            this._popupOpen = false;
            this._sessionData = null;
        }

        /* ───────────────────────────────────────────────────
           SESSION RECORDING
        ─────────────────────────────────────────────────── */
        _recordCompletion(elapsedSecs) {
            if (!this._sessionData) return;

            const { hour, min } = this._sessionData;
            const cfg      = this._cfg();
            const duration = elapsedSecs || (cfg.duration || 2) * 60;
            const today    = todayKey();

            try {
                // Update schedule status
                const schedule = this._loadSchedule();
                if (schedule[hour]) {
                    schedule[hour].status = 'completed';
                    schedule[hour].completedAt = new Date().toISOString();
                    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
                    localStorage.setItem('naam_abhyas_schedule', JSON.stringify(schedule));
                }

                // Update history
                const raw  = localStorage.getItem('naam_abhyas_history');
                const hist = raw ? JSON.parse(raw) : {};

                // daily
                if (!hist.daily) hist.daily = {};
                if (!hist.daily[today]) hist.daily[today] = { completed: 0, total: 0, sessions: [] };
                hist.daily[today].completed = (hist.daily[today].completed || 0) + 1;
                hist.daily[today].sessions.push({
                    hour, min,
                    startTime: this._fmt12(hour, min),
                    completedAt: new Date().toISOString(),
                    duration
                });

                // totals
                hist.totalCompleted = (hist.totalCompleted || 0) + 1;

                // statistics
                if (!hist.statistics) hist.statistics = {};
                hist.statistics.totalTimeSeconds = (hist.statistics.totalTimeSeconds || 0) + duration;

                // streak
                hist.currentStreak = (hist.currentStreak || 0) + 1;
                hist.statistics.currentStreak = hist.currentStreak;

                localStorage.setItem('naam_abhyas_history', JSON.stringify(hist));
                console.log('[NaamAlarm] ✅ Session recorded');

                // Notify main app to re-render UI
                window.dispatchEvent(new CustomEvent('naamSessionCompleted', {
                    detail: { hour, min, duration }
                }));
            } catch (e) {
                console.warn('[NaamAlarm] History save error:', e);
            }
        }

        /* ───────────────────────────────────────────────────
           SKIP SESSION
        ─────────────────────────────────────────────────── */
        _skipSession() {
            if (!this._sessionData) return;
            const { hour, min } = this._sessionData;
            const today = todayKey();

            try {
                const schedule = this._loadSchedule();
                if (schedule[hour]) {
                    schedule[hour].status = 'skipped';
                    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
                    localStorage.setItem('naam_abhyas_schedule', JSON.stringify(schedule));
                }
            } catch {}

            this._popupOpen = false;
            this._sessionData = null;
        }

        /* ───────────────────────────────────────────────────
           HELPERS
        ─────────────────────────────────────────────────── */
        _fmt12(hour, min) {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h12  = hour % 12 || 12;
            return `${h12}:${String(min).padStart(2,'0')} ${ampm}`;
        }

        _findNextSession() {
            const schedule = this._loadSchedule();
            const now = new Date();
            const nowMs = now.getTime();

            const upcoming = Object.entries(schedule)
                .filter(([h, s]) => {
                    if (!s || s.status === 'completed' || s.status === 'skipped') return false;
                    const d = new Date(now);
                    d.setHours(parseInt(h), s.startMinute || 0, 0, 0);
                    return d.getTime() > nowMs;
                })
                .sort(([a], [b]) => parseInt(a) - parseInt(b));

            if (!upcoming.length) return null;
            const [h, s] = upcoming[0];
            return this._fmt12(parseInt(h), s.startMinute || 0);
        }

        /* ───────────────────────────────────────────────────
           AUDIO: Minimal Web Audio API chimes
        ─────────────────────────────────────────────────── */
        _playChime(type) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                if (type === 'start') {
                    osc.frequency.setValueAtTime(528, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.5);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 1.5);
                } else {
                    // completion: three ascending tones
                    [0, 0.4, 0.8].forEach((t, i) => {
                        const o2 = ctx.createOscillator();
                        const g2 = ctx.createGain();
                        o2.connect(g2); g2.connect(ctx.destination);
                        o2.frequency.value = [528, 660, 880][i];
                        g2.gain.setValueAtTime(0.25, ctx.currentTime + t);
                        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.6);
                        o2.start(ctx.currentTime + t);
                        o2.stop(ctx.currentTime + t + 0.6);
                    });
                }

                setTimeout(() => { try { ctx.close(); } catch {} }, 3000);
            } catch {}
        }

        /* ───────────────────────────────────────────────────
           PUBLIC: trigger a manual/forced session
        ─────────────────────────────────────────────────── */
        triggerNow(durationMinutes) {
            const dur = durationMinutes || this._cfg().duration || 2;
            const now = new Date();
            const fakeSession = {
                hour: now.getHours(),
                min:  now.getMinutes(),
                session: { status: 'pending', startMinute: now.getMinutes() }
            };
            this._sessionData = fakeSession;
            this._popupOpen = true;
            this._startMeditation(dur, false);
        }
    }

    /* ═══════════════════════════════════════════════════════════════════
       WIRE UP UI BUTTONS
    ═══════════════════════════════════════════════════════════════════ */
    function wireButtons(alarm) {

        // ─── Session Alert buttons ───
        const alertStart  = document.getElementById('alertStartNowBtn');
        const alertSilent = document.getElementById('alertSilentBtn');
        const alertSkip   = document.getElementById('skipSessionBtn');

        if (alertStart) {
            alertStart.addEventListener('click', () => {
                alarm._hideSessionAlert();
                const dur = alarm._cfg().duration || 2;
                alarm._startMeditation(dur, false);
            });
        }
        if (alertSilent) {
            alertSilent.addEventListener('click', () => {
                alarm._hideSessionAlert();
                const dur = alarm._cfg().duration || 2;
                alarm._startMeditation(dur, true);
            });
        }
        if (alertSkip) {
            alertSkip.addEventListener('click', () => {
                alarm._hideSessionAlert();
                alarm._skipSession();
                alarm._popupOpen = false;
            });
        }

        // ─── Meditation Overlay buttons ───
        const medPresent = document.getElementById('medPresentBtn');
        const medSilent  = document.getElementById('medSilentBtn');
        const medSkip    = document.getElementById('skipMeditationBtn');
        const chimeToggle = document.getElementById('medChimeToggle');

        if (medPresent) {
            medPresent.addEventListener('click', () => {
                medPresent.style.transform = 'scale(0.95)';
                setTimeout(() => { medPresent.style.transform = ''; }, 200);
                alarm._playChime('start');
            });
        }
        if (medSilent) {
            medSilent.addEventListener('click', () => {
                const muted = medSilent.dataset.muted === 'true';
                const next  = !muted;
                medSilent.dataset.muted = next;
                alarm._isSilent = next;
                const icon  = document.getElementById('silentBtnIcon');
                const label = document.getElementById('silentBtnLabel');
                if (icon)  icon.textContent  = next ? '🔇' : '🔊';
                if (label) label.textContent  = next ? 'Muted' : 'Silent';
            });
        }
        if (medSkip) {
            medSkip.addEventListener('click', () => {
                alarm._endEarly();
            });
        }

        // ─── Completion modal ───
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                alarm._hideCompletionModal();
                // Refresh main app UI
                if (window.naamAbhyasApp && window.naamAbhyasApp.updateUI) {
                    window.naamAbhyasApp.updateUI();
                }
            });
        }

        // ─── Quick-Action "Start Now" — bypass alert, go directly to meditation ───
        const startNowBtn  = document.getElementById('startNowBtn');
        const quickNaamBtn = document.getElementById('quickNaamBtn');
        const deepModeBtn  = document.getElementById('deepModeBtn');

        if (startNowBtn) {
            startNowBtn.addEventListener('click', () => alarm.triggerNow(alarm._cfg().duration || 2));
        }
        if (quickNaamBtn) {
            quickNaamBtn.addEventListener('click', () => alarm.triggerNow(0.5));
        }
        if (deepModeBtn) {
            deepModeBtn.addEventListener('click', () => alarm.triggerNow(11));
        }
    }

    /* ═══════════════════════════════════════════════════════════════════
       DISABLE COMPETING SYSTEMS
    ═══════════════════════════════════════════════════════════════════ */
    function silenceCompetitors() {
        // Block capacitor-notifications-global from scheduling Naam notifications
        if (window.CapacitorNotifications) {
            const orig = window.CapacitorNotifications.scheduleNotification;
            window.CapacitorNotifications.scheduleNotification = function(opts) {
                if (opts && opts.tag && String(opts.tag).includes('naam-abhyas')) {
                    console.log('[NaamAlarm] 🚫 Blocked duplicate from CapacitorNotifications:', opts.tag);
                    return Promise.resolve();
                }
                return orig.call(this, opts);
            };
        }

        // Prevent any global alarm bridge from doubling up
        if (window.fallbackAlarmSystem) {
            const orig = window.fallbackAlarmSystem.scheduleAlarm;
            window.fallbackAlarmSystem.scheduleAlarm = function(opts) {
                if (opts && opts.id && String(opts.id).startsWith('naam_')) {
                    console.log('[NaamAlarm] 🚫 Blocked duplicate from fallbackAlarmSystem:', opts.id);
                    return;
                }
                return orig.call(this, opts);
            };
        }

        console.log('[NaamAlarm] 🚫 Competitor systems silenced');
    }

    /* ═══════════════════════════════════════════════════════════════════
       BOOT
    ═══════════════════════════════════════════════════════════════════ */
    function boot() {
        const alarm = new NaamAlarm();
        window.NaamAlarm = alarm;

        // Wire up buttons (may already exist in DOM)
        wireButtons(alarm);

        // Silence competitors
        silenceCompetitors();

        // Start the alarm ticker
        alarm.start();

        // Also listen for app-internal event to refresh schedule
        window.addEventListener('naamScheduleUpdated', () => {
            console.log('[NaamAlarm] 📅 Schedule updated — reloading');
        });

        // Listen for foreground notification click from SW
        window.addEventListener('naamAbhyasAlarmFired', (evt) => {
            const { hour, min } = evt.detail || {};
            const schedule = alarm._loadSchedule();
            const h = parseInt(hour || new Date().getHours(), 10);
            const session = schedule[h] || { status: 'pending', startMinute: min || 0 };
            if (!alarm._popupOpen) {
                alarm._sessionData = { session, hour: h, min: session.startMinute || 0 };
                alarm._popupOpen = true;
                alarm._showSessionAlert(session, h, session.startMinute || 0);
            }
        });

        console.log('[NaamAlarm] ✅ Boot complete');
    }

    /* ─── Run after DOM ready ─── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

})();
