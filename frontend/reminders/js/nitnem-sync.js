/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NITNEM TRACKER SYNC v2.0 - Complete Cross-Module Integration
 * 
 * Features:
 * ✅ Bi-directional sync between Smart Reminders ↔ Nitnem Tracker
 * ✅ Alarm response tracking with streak calculation
 * ✅ Daily progress persistence
 * ✅ Weekly stats aggregation
 * ✅ Cross-tab BroadcastChannel sync
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate initialization
    if (window.NitnemSync) {
        console.log('📊 Nitnem Sync already initialized');
        return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        storage: {
            trackerData: 'nitnemTracker_alarmData',
            dailyLog: 'nitnemTracker_dailyLog',
            streakData: 'nitnemTracker_streakData',
            stats: 'nitnemTracker_stats'
        },
        channelName: 'gurbani-nitnem-sync',
        alarmTypes: {
            amritvela: {
                id: 'amritvela',
                name: 'Amritvela',
                gurmukhi: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ',
                icon: '🌅',
                color: '#FFD60A'
            },
            rehras: {
                id: 'rehras',
                name: 'Rehras Sahib',
                gurmukhi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ',
                icon: '🌆',
                color: '#FF9500'
            },
            sohila: {
                id: 'sohila',
                name: 'Sohila Sahib',
                gurmukhi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ',
                icon: '🌙',
                color: '#AF52DE'
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // STORAGE UTILITIES
    // ══════════════════════════════════════════════════════════════════════════
    const Storage = {
        get(key, defaults = null) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaults;
            } catch (e) {
                console.error('NitnemSync storage get error:', e);
                return defaults;
            }
        },

        set(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('NitnemSync storage set error:', e);
                return false;
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DATE UTILITIES
    // ══════════════════════════════════════════════════════════════════════════
    const DateUtils = {
        today() {
            return new Date().toISOString().split('T')[0];
        },

        yesterday() {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        },

        daysAgo(n) {
            const d = new Date();
            d.setDate(d.getDate() - n);
            return d.toISOString().split('T')[0];
        },

        getWeekDates() {
            const dates = [];
            for (let i = 6; i >= 0; i--) {
                dates.push(this.daysAgo(i));
            }
            return dates;
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // BROADCAST CHANNEL FOR CROSS-TAB SYNC
    // ══════════════════════════════════════════════════════════════════════════
    let broadcastChannel = null;

    function initBroadcastChannel() {
        try {
            broadcastChannel = new BroadcastChannel(CONFIG.channelName);

            broadcastChannel.onmessage = (event) => {
                const { type, data } = event.data;

                switch (type) {
                    case 'ALARM_RESPONSE':
                        NitnemSync.recordResponse(data.alarmId, data.status, data.timestamp, false);
                        break;

                    case 'SYNC_REQUEST':
                        // Another tab is requesting current data
                        broadcastChannel.postMessage({
                            type: 'SYNC_DATA',
                            data: NitnemSync.getFullStats()
                        });
                        break;

                    case 'SYNC_DATA':
                        // Another tab sent sync data - update UI if on Nitnem Tracker page
                        window.dispatchEvent(new CustomEvent('nitnemSyncUpdate', { detail: data }));
                        break;

                    case 'STREAK_UPDATE':
                        window.dispatchEvent(new CustomEvent('streakUpdate', { detail: data }));
                        break;
                }
            };

            console.log('📡 Nitnem Sync BroadcastChannel initialized');
        } catch (e) {
            console.warn('BroadcastChannel not supported:', e);
        }
    }

    function broadcast(type, data) {
        if (broadcastChannel) {
            try {
                broadcastChannel.postMessage({ type, data });
            } catch (e) {
                console.warn('Broadcast failed:', e);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAIN NITNEM SYNC CLASS
    // ══════════════════════════════════════════════════════════════════════════
    const NitnemSync = {
        // Initialize
        init() {
            this.loadData();
            initBroadcastChannel();
            this.setupEventListeners();
            this.checkMidnightReset();
            console.log('📊 Nitnem Sync ready');
        },

        // Load existing data
        loadData() {
            this.trackerData = Storage.get(CONFIG.storage.trackerData, {
                alarmStats: {},
                totalFollowed: 0,
                totalMissed: 0,
                totalSnoozed: 0
            });

            this.dailyLog = Storage.get(CONFIG.storage.dailyLog, {});

            this.streakData = Storage.get(CONFIG.storage.streakData, {
                currentStreak: 0,
                longestStreak: 0,
                lastCompletedDate: null
            });
        },

        // Save all data
        saveData() {
            Storage.set(CONFIG.storage.trackerData, this.trackerData);
            Storage.set(CONFIG.storage.dailyLog, this.dailyLog);
            Storage.set(CONFIG.storage.streakData, this.streakData);
        },

        // Setup event listeners
        setupEventListeners() {
            // Listen for alarm responses from Smart Reminders
            window.addEventListener('alarmSyncUpdate', (e) => {
                const { reminderId, status, timestamp, label } = e.detail;
                this.recordResponse(reminderId, status, timestamp, true);
            });

            // Listen for Naam Abhyas completions
            window.addEventListener('naamAbhyasComplete', (e) => {
                this.recordNaamAbhyas(e.detail);
            });

            // Request sync on page load
            broadcast('SYNC_REQUEST', {});
        },

        // Record an alarm response
        recordResponse(alarmId, status, timestamp = null, shouldBroadcast = true) {
            const today = DateUtils.today();
            const time = timestamp || new Date().toISOString();

            // Initialize daily log for today
            if (!this.dailyLog[today]) {
                this.dailyLog[today] = {
                    date: today,
                    responses: {},
                    totalCompleted: 0,
                    totalMissed: 0,
                    perfectDay: false
                };
            }

            // Initialize alarm stats
            if (!this.trackerData.alarmStats[alarmId]) {
                this.trackerData.alarmStats[alarmId] = {
                    followed: 0,
                    missed: 0,
                    snoozed: 0,
                    lastResponse: null
                };
            }

            // Record response
            this.dailyLog[today].responses[alarmId] = {
                status,
                timestamp: time
            };

            // Update stats
            switch (status) {
                case 'completed':
                case 'followed':
                    this.trackerData.alarmStats[alarmId].followed++;
                    this.trackerData.totalFollowed++;
                    this.dailyLog[today].totalCompleted++;
                    break;

                case 'missed':
                    this.trackerData.alarmStats[alarmId].missed++;
                    this.trackerData.totalMissed++;
                    this.dailyLog[today].totalMissed++;
                    break;

                case 'snoozed':
                    this.trackerData.alarmStats[alarmId].snoozed++;
                    this.trackerData.totalSnoozed++;
                    break;
            }

            this.trackerData.alarmStats[alarmId].lastResponse = time;

            // Check for perfect day (all 3 core alarms completed)
            this.checkPerfectDay(today);

            // Update streak
            if (status === 'completed' || status === 'followed') {
                this.updateStreak(today);
            }

            // Save
            this.saveData();

            // Broadcast to other tabs
            if (shouldBroadcast) {
                broadcast('ALARM_RESPONSE', { alarmId, status, timestamp: time });
            }

            // Dispatch local event for UI updates
            window.dispatchEvent(new CustomEvent('nitnemDataUpdate', {
                detail: this.getFullStats()
            }));

            console.log(`📊 Recorded ${status} for ${alarmId}`);
        },

        // Check if today is a perfect day
        checkPerfectDay(date) {
            const dayLog = this.dailyLog[date];
            if (!dayLog) return false;

            const coreAlarms = ['amritvela', 'rehras', 'sohila'];
            const allCompleted = coreAlarms.every(id => {
                const response = dayLog.responses[id];
                return response && (response.status === 'completed' || response.status === 'followed');
            });

            dayLog.perfectDay = allCompleted;
            return allCompleted;
        },

        // Update streak
        updateStreak(completedDate) {
            const yesterday = DateUtils.yesterday();
            const lastDate = this.streakData.lastCompletedDate;

            if (lastDate === completedDate) {
                // Already counted today
                return;
            }

            if (lastDate === yesterday || !lastDate) {
                // Consecutive day or first day
                this.streakData.currentStreak++;
            } else if (lastDate !== completedDate) {
                // Streak broken
                this.streakData.currentStreak = 1;
            }

            // Update longest streak
            if (this.streakData.currentStreak > this.streakData.longestStreak) {
                this.streakData.longestStreak = this.streakData.currentStreak;
            }

            this.streakData.lastCompletedDate = completedDate;

            // Broadcast streak update
            broadcast('STREAK_UPDATE', {
                current: this.streakData.currentStreak,
                longest: this.streakData.longestStreak
            });
        },

        // Record Naam Abhyas session
        recordNaamAbhyas(detail) {
            const today = DateUtils.today();

            if (!this.dailyLog[today]) {
                this.dailyLog[today] = {
                    date: today,
                    responses: {},
                    naamAbhyas: [],
                    totalCompleted: 0,
                    totalMissed: 0,
                    perfectDay: false
                };
            }

            if (!this.dailyLog[today].naamAbhyas) {
                this.dailyLog[today].naamAbhyas = [];
            }

            this.dailyLog[today].naamAbhyas.push({
                count: detail.count || 0,
                duration: detail.duration || 0,
                timestamp: new Date().toISOString(),
                source: 'naamAbhyas'
            });

            this.saveData();

            console.log('📊 Recorded Naam Abhyas session');
        },

        // Get today's progress
        getTodayProgress() {
            const today = DateUtils.today();
            const dayLog = this.dailyLog[today] || { responses: {}, totalCompleted: 0 };

            const coreAlarms = ['amritvela', 'rehras', 'sohila'];
            const progress = {
                completed: [],
                pending: [],
                missed: [],
                total: coreAlarms.length
            };

            coreAlarms.forEach(id => {
                const response = dayLog.responses[id];
                if (response) {
                    if (response.status === 'completed' || response.status === 'followed') {
                        progress.completed.push(id);
                    } else if (response.status === 'missed') {
                        progress.missed.push(id);
                    }
                } else {
                    progress.pending.push(id);
                }
            });

            return progress;
        },

        // Get weekly stats
        getWeeklyStats() {
            const weekDates = DateUtils.getWeekDates();
            const stats = {
                days: [],
                totalCompleted: 0,
                totalMissed: 0,
                perfectDays: 0,
                completionRate: 0
            };

            weekDates.forEach(date => {
                const dayLog = this.dailyLog[date];
                const dayStats = {
                    date,
                    completed: dayLog?.totalCompleted || 0,
                    missed: dayLog?.totalMissed || 0,
                    perfectDay: dayLog?.perfectDay || false,
                    naamAbhyas: dayLog?.naamAbhyas?.length || 0
                };

                stats.days.push(dayStats);
                stats.totalCompleted += dayStats.completed;
                stats.totalMissed += dayStats.missed;
                if (dayStats.perfectDay) stats.perfectDays++;
            });

            const total = stats.totalCompleted + stats.totalMissed;
            stats.completionRate = total > 0 ? Math.round((stats.totalCompleted / total) * 100) : 100;

            return stats;
        },

        // Get full stats
        getFullStats() {
            return {
                streak: this.streakData,
                today: this.getTodayProgress(),
                weekly: this.getWeeklyStats(),
                allTime: {
                    followed: this.trackerData.totalFollowed,
                    missed: this.trackerData.totalMissed,
                    snoozed: this.trackerData.totalSnoozed
                },
                alarmStats: this.trackerData.alarmStats
            };
        },

        // Get completion rate for specific alarm
        getAlarmStats(alarmId) {
            const stats = this.trackerData.alarmStats[alarmId];
            if (!stats) {
                return { followed: 0, missed: 0, rate: 100 };
            }

            const total = stats.followed + stats.missed;
            const rate = total > 0 ? Math.round((stats.followed / total) * 100) : 100;

            return {
                ...stats,
                rate
            };
        },

        // Check for midnight reset
        checkMidnightReset() {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);

            const msUntilMidnight = midnight - now;

            setTimeout(() => {
                console.log('🌙 Midnight reset');
                window.dispatchEvent(new CustomEvent('nitnemMidnightReset'));
                this.checkMidnightReset(); // Schedule next
            }, msUntilMidnight);
        },

        // Export data for backup
        exportData() {
            return {
                trackerData: this.trackerData,
                dailyLog: this.dailyLog,
                streakData: this.streakData,
                exportedAt: new Date().toISOString(),
                version: '2.0'
            };
        },

        // Import data from backup
        importData(data) {
            if (data.trackerData) this.trackerData = data.trackerData;
            if (data.dailyLog) this.dailyLog = data.dailyLog;
            if (data.streakData) this.streakData = data.streakData;
            this.saveData();
            console.log('📊 Data imported successfully');
        },

        // Reset all data
        reset() {
            this.trackerData = {
                alarmStats: {},
                totalFollowed: 0,
                totalMissed: 0,
                totalSnoozed: 0
            };
            this.dailyLog = {};
            this.streakData = {
                currentStreak: 0,
                longestStreak: 0,
                lastCompletedDate: null
            };
            this.saveData();
            console.log('📊 All Nitnem Sync data reset');
        }
    };

    // Initialize
    NitnemSync.init();

    // Expose globally
    window.NitnemSync = NitnemSync;

})();
