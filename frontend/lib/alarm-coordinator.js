/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD ALARM COORDINATOR — Leader Election for Multi-Tab Alarm Coordination
 * Only ONE tab fires alarms, others receive via BroadcastChannel
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    if (window.AnhadAlarmCoordinator) return;

    const CHANNEL_NAME = 'anhad_alarm_coordination';
    const HEARTBEAT_INTERVAL = 3000;
    const LEADER_TIMEOUT = 10000;

    class AlarmCoordinator {
        constructor() {
            this.bc = new BroadcastChannel(CHANNEL_NAME);
            this.tabId = this._generateTabId();
            this.isLeader = false;
            this.leaderId = null;
            this.lastHeartbeat = 0;
            this.listeners = new Map();
            this.intervals = [];
            
            this._init();
        }

        _generateTabId() {
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        _init() {
            // Setup BroadcastChannel listener
            this.bc.onmessage = (event) => {
                this._handleMessage(event.data);
            };

            // Start heartbeat
            this.intervals.push(setInterval(() => this._sendHeartbeat(), HEARTBEAT_INTERVAL));
            
            // Check leader health
            this.intervals.push(setInterval(() => this._checkLeaderHealth(), HEARTBEAT_INTERVAL));

            // Announce presence
            this.bc.postMessage({
                type: 'presence',
                tabId: this.tabId,
                timestamp: Date.now()
            });

            // Cleanup on pagehide
            window.addEventListener('pagehide', () => this._cleanup());
            window.addEventListener('beforeunload', () => this._cleanup());

            // Initial election delay
            setTimeout(() => this._attemptElection(), 500);

            console.log('[AlarmCoordinator] Initialized, tabId:', this.tabId);
        }

        _handleMessage(msg) {
            switch (msg.type) {
                case 'heartbeat':
                    if (msg.isLeader) {
                        this.leaderId = msg.tabId;
                        this.lastHeartbeat = Date.now();
                        if (this.isLeader && this.tabId !== msg.tabId) {
                            // Another tab claims leadership, step down
                            this._stepDown();
                        }
                    }
                    break;

                case 'election':
                    if (msg.tabId < this.tabId) {
                        // Older tab wants to be leader, let it
                        if (this.isLeader) {
                            this._stepDown();
                        }
                    }
                    break;

                case 'alarm_fired':
                    // Leader fired an alarm, notify local listeners
                    this._notifyAlarmFired(msg.alarmId, msg.reminder, msg.isPreReminder);
                    break;

                case 'alarm_acknowledged':
                    // Someone acknowledged an alarm
                    this._notifyAlarmAcknowledged(msg.alarmId, msg.action);
                    break;

                case 'presence':
                    // Another tab announced presence
                    break;
            }
        }

        _attemptElection() {
            if (this.isLeader) return;

            // Broadcast election intent with tabId (lower = older = leader)
            this.bc.postMessage({
                type: 'election',
                tabId: this.tabId,
                timestamp: Date.now()
            });

            // Wait for responses then claim leadership
            setTimeout(() => {
                if (!this.leaderId || this.leaderId === this.tabId) {
                    this._becomeLeader();
                }
            }, 500);
        }

        _becomeLeader() {
            this.isLeader = true;
            this.leaderId = this.tabId;
            console.log('[AlarmCoordinator] Became LEADER');
            
            this.bc.postMessage({
                type: 'heartbeat',
                tabId: this.tabId,
                isLeader: true,
                timestamp: Date.now()
            });
        }

        _stepDown() {
            this.isLeader = false;
            console.log('[AlarmCoordinator] Stepped down from leadership');
        }

        _sendHeartbeat() {
            if (this.isLeader) {
                this.bc.postMessage({
                    type: 'heartbeat',
                    tabId: this.tabId,
                    isLeader: true,
                    timestamp: Date.now()
                });
            }
        }

        _checkLeaderHealth() {
            if (!this.isLeader && this.leaderId) {
                const elapsed = Date.now() - this.lastHeartbeat;
                if (elapsed > LEADER_TIMEOUT) {
                    console.log('[AlarmCoordinator] Leader timeout, triggering election');
                    this.leaderId = null;
                    this._attemptElection();
                }
            }
        }

        _cleanup() {
            // Clear all intervals
            this.intervals.forEach(clearInterval);
            this.intervals = [];

            // Announce departure
            this.bc.postMessage({
                type: 'departure',
                tabId: this.tabId
            });

            // Close BroadcastChannel
            setTimeout(() => this.bc.close(), 100);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // CAPACITOR NATIVE NOTIFICATIONS — Layer 2 for closed-app alarms
        // ═══════════════════════════════════════════════════════════════════════

        /**
         * Schedule a native alarm using Capacitor LocalNotifications
         * Call this when creating/updating a reminder
         */
        async scheduleNativeAlarm(alarm) {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return; // Only on native platforms
            }

            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');

                await LocalNotifications.schedule({
                    notifications: [{
                        id: alarm.id,
                        title: alarm.title || 'ANHAD',
                        body: alarm.message || 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ',
                        schedule: { at: new Date(alarm.timestamp) },
                        sound: alarm.sound || 'gentle_bell',
                        smallIcon: 'ic_stat_notify',
                        iconColor: '#D4860A',
                        extra: {
                            alarmId: alarm.id,
                            reminderId: alarm.reminderId
                        }
                    }]
                });

                console.log('[AlarmCoordinator] Native alarm scheduled:', alarm.id);
            } catch (e) {
                console.error('[AlarmCoordinator] Failed to schedule native alarm:', e);
            }
        }

        /**
         * Cancel a native alarm
         * Call this when deleting/disabling a reminder
         */
        async cancelNativeAlarm(alarmId) {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return;
            }

            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');

                await LocalNotifications.cancel({
                    notifications: [{ id: alarmId }]
                });

                console.log('[AlarmCoordinator] Native alarm cancelled:', alarmId);
            } catch (e) {
                console.error('[AlarmCoordinator] Failed to cancel native alarm:', e);
            }
        }

        /**
         * Initialize all native alarms on app startup
         * Re-syncs all active reminders to native system
         */
        async initNativeAlarms() {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return;
            }

            console.log('[AlarmCoordinator] Initializing native alarms...');

            try {
                // 1. Cancel all existing native notifications
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const pending = await LocalNotifications.getPending();

                if (pending.notifications.length > 0) {
                    await LocalNotifications.cancel(pending);
                    console.log('[AlarmCoordinator] Cancelled', pending.notifications.length, 'existing native alarms');
                }

                // 2. Load all active reminders from IndexedDB
                if (window.GurbaniStorage) {
                    await window.GurbaniStorage.init();
                    const reminders = await window.GurbaniStorage.getAll('reminders');
                    const activeReminders = reminders.filter(r => r.enabled !== false);

                    // 3. Schedule each reminder
                    for (const reminder of activeReminders) {
                        // Calculate next occurrence
                        const nextTime = this.calculateNextAlarmTime(reminder);
                        if (nextTime) {
                            await this.scheduleNativeAlarm({
                                id: parseInt(reminder.id) || Math.floor(Math.random() * 100000),
                                title: reminder.title || 'ANHAD Reminder',
                                message: reminder.message || 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ',
                                timestamp: nextTime.getTime(),
                                reminderId: reminder.id
                            });
                        }
                    }

                    console.log('[AlarmCoordinator] Re-synced', activeReminders.length, 'native alarms');
                }
            } catch (e) {
                console.error('[AlarmCoordinator] Failed to init native alarms:', e);
            }
        }

        /**
         * Calculate next alarm time for a reminder
         */
        calculateNextAlarmTime(reminder) {
            if (!reminder.time) return null;

            const [hours, minutes] = reminder.time.split(':').map(Number);
            const now = new Date();
            const alarmTime = new Date();
            alarmTime.setHours(hours, minutes, 0, 0);

            // If time has passed today, schedule for tomorrow
            if (alarmTime <= now) {
                alarmTime.setDate(alarmTime.getDate() + 1);
            }

            return alarmTime;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // PUBLIC API
        // ═══════════════════════════════════════════════════════════════════════

        /**
         * Check if this tab is the leader
         */
        isLeader() {
            return this.isLeader;
        }

        /**
         * Notify all tabs that an alarm fired (call from leader only)
         */
        broadcastAlarmFired(alarmId, reminder, isPreReminder = false) {
            if (!this.isLeader) {
                console.warn('[AlarmCoordinator] Only leader should broadcast alarms');
                return;
            }

            this.bc.postMessage({
                type: 'alarm_fired',
                alarmId,
                reminder,
                isPreReminder,
                timestamp: Date.now()
            });
        }

        /**
         * Acknowledge alarm (snooze/dismiss)
         */
        acknowledgeAlarm(alarmId, action) {
            this.bc.postMessage({
                type: 'alarm_acknowledged',
                alarmId,
                action,
                tabId: this.tabId,
                timestamp: Date.now()
            });
        }

        /**
         * Listen for alarm events
         */
        onAlarmFired(callback) {
            if (!this.listeners.has('alarm_fired')) {
                this.listeners.set('alarm_fired', new Set());
            }
            this.listeners.get('alarm_fired').add(callback);
            
            return () => {
                this.listeners.get('alarm_fired').delete(callback);
            };
        }

        onAlarmAcknowledged(callback) {
            if (!this.listeners.has('alarm_acknowledged')) {
                this.listeners.set('alarm_acknowledged', new Set());
            }
            this.listeners.get('alarm_acknowledged').add(callback);
            
            return () => {
                this.listeners.get('alarm_acknowledged').delete(callback);
            };
        }

        _notifyAlarmFired(alarmId, reminder, isPreReminder) {
            const callbacks = this.listeners.get('alarm_fired');
            if (callbacks) {
                callbacks.forEach(cb => {
                    try {
                        cb(alarmId, reminder, isPreReminder);
                    } catch (e) {
                        console.error('[AlarmCoordinator] Listener error:', e);
                    }
                });
            }
        }

        _notifyAlarmAcknowledged(alarmId, action) {
            const callbacks = this.listeners.get('alarm_acknowledged');
            if (callbacks) {
                callbacks.forEach(cb => {
                    try {
                        cb(alarmId, action);
                    } catch (e) {
                        console.error('[AlarmCoordinator] Listener error:', e);
                    }
                });
            }
        }
    }

    // Create singleton
    window.AnhadAlarmCoordinator = new AlarmCoordinator();

    console.log('[AlarmCoordinator] Singleton initialized');
})();
