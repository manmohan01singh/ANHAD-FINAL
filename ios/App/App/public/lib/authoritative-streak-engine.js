/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD AUTHORITATIVE STREAK ENGINE
 * Single Deterministic Source of Truth for Amritvela & Nitnem Streaks,
 * Previous-Best Recovery Challenge (5-Day SGGS Journey), and Historical Backfill.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (root, factory) {
    'use strict';
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        const engine = factory();
        root.AuthoritativeStreakEngine = engine;
        // Also provide global alias
        if (typeof window !== 'undefined') {
            window.AuthoritativeStreakEngine = engine;
        }
    }
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────────
    // CONSTANTS & KEYS
    // ─────────────────────────────────────────────────────────────────────────────
    const KEYS = {
        STREAK_DATA: 'anhad_streak_data',
        AMRITVELA_LOG: 'nitnemTracker_amritvelaLog',
        NITNEM_LOG: 'nitnemTracker_nitnemLog',
        MY_POTHI_COMPLETED: 'anhad_my_pothi_completed',
        UNIFIED_STATS: 'anhad_unified_stats',
        USER_DATA: 'nitnemTracker_userData'
    };

    const RECOVERY_CONFIG_DEFAULTS = {
        minDelayDays: 7, // Configurable 5–10 days (default 7)
        requiredConsecutiveDays: 5
    };

    /**
     * Verified Authentic Sri Guru Granth Sahib Passages for the 5-Day Challenge
     */
    const GURBANI_PASSAGES = [
        {
            day: 1,
            ang: 2,
            source: 'Japji Sahib',
            author: 'Guru Nanak Dev Ji',
            gurmukhi: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥',
            translation: 'In the Amrit Vela, the ambrosial hours before dawn, chant the True Name, and contemplate His Glorious Greatness.'
        },
        {
            day: 2,
            ang: 305,
            source: 'Gauri Ki Var',
            author: 'Guru Ram Das Ji',
            gurmukhi: 'ਗੁਰ ਸਤਿਗੁਰ ਕਾ ਜੋ ਸਿਖੁ ਅਖਾਏ ਸੁ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵੈ ॥',
            translation: "One who calls himself a Sikh of the Guru, the True Guru, shall rise in the early morning hours and meditate on the Lord's Name."
        },
        {
            day: 3,
            ang: 449,
            source: 'Asa M:4',
            author: 'Guru Ram Das Ji',
            gurmukhi: 'ਹਰਿ ਜਪੇ ਹਰਿ ਮੰਦਰੁ ਸਾਜਿਆ ਸੰਤ ਭਗਤ ਗੁਣ ਗਾਵਹਿ ਰਾਮ ॥',
            translation: 'Meditating on the Lord, the temple of the Lord is constructed; the Saints and devotees sing His Glorious Praises.'
        },
        {
            day: 4,
            ang: 815,
            source: 'Bilawal M:5',
            author: 'Guru Arjan Dev Ji',
            gurmukhi: 'ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਆਮੀ ਪ੍ਰਭੁ ਅਪਨਾ ਸੀਤਲ ਤਨੁ ਮਨੁ ਛਾਤੀ ॥',
            translation: 'Meditating, meditating on my Lord and Master God, my body, mind and heart are cooled and soothed.'
        },
        {
            day: 5,
            ang: 1383,
            source: 'Salok Farid Ji',
            author: 'Bhagat Farid Ji',
            gurmukhi: 'ਫਰੀਦਾ ਰਾਤਿ ਕਥੂਰੀ ਵੰਡੀਐ ਸੁਤਿਆ ਮਿਲੈ ਨ ਭਾਉ ॥',
            translation: 'Fareed: musk is released at night. Those who are asleep do not receive their share.'
        }
    ];

    // Fallback in-memory storage if localStorage is missing
    let _memoryStore = {};

    function storageGet(key) {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) {
                return localStorage.getItem(key);
            }
        } catch (e) {}
        return _memoryStore[key] || null;
    }

    function storageSet(key, value) {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) {
                localStorage.setItem(key, value);
                return;
            }
        } catch (e) {}
        _memoryStore[key] = String(value);
    }

    function loadJson(key, defaultVal) {
        try {
            const raw = storageGet(key);
            return raw ? JSON.parse(raw) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function saveJson(key, data) {
        try {
            storageSet(key, JSON.stringify(data));
        } catch (e) {
            console.error(`[AuthoritativeStreakEngine] Failed to save key "${key}":`, e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CALENDAR & UTC TIME UTILITIES (Deterministic Timezone Independence)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Convert YYYY-MM-DD date string to UTC midnight integer day number.
     * Eliminates daylight saving & timezone offset jitter.
     */
    function toUtcDay(dateStr) {
        if (!dateStr) return NaN;
        const parts = String(dateStr).split('-');
        if (parts.length !== 3) return NaN;
        const y = +parts[0];
        const m = +parts[1];
        const d = +parts[2];
        if (isNaN(y) || isNaN(m) || isNaN(d)) return NaN;
        return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
    }

    /**
     * Convert UTC midnight integer day number back to YYYY-MM-DD string.
     */
    function fromUtcDay(utcDayNumber) {
        if (isNaN(utcDayNumber)) return '';
        const d = new Date(utcDayNumber * 86400000);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /**
     * Get local date string in YYYY-MM-DD format.
     */
    function getTodayString(refDate) {
        const d = refDate ? new Date(refDate) : new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /**
     * Get yesterday date string in YYYY-MM-DD format.
     */
    function getYesterdayString(todayStr) {
        const todayUtc = toUtcDay(todayStr || getTodayString());
        return fromUtcDay(todayUtc - 1);
    }

    /**
     * Determine Amritvela slot from HH:MM time string.
     */
    function getSlotFromTime(timeStr) {
        if (!timeStr) return 'late';
        const parts = String(timeStr).split(':');
        const h = parseInt(parts[0], 10);
        if (isNaN(h)) return 'late';
        if (h >= 0 && h < 4) return 'excellent';
        if (h === 4) return 'good';
        if (h === 5) return 'okay';
        return 'late';
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DEFAULT STATE & MIGRATION
    // ─────────────────────────────────────────────────────────────────────────────

    function createDefaultState() {
        return {
            currentStreak: 0,
            longestStreak: 0,
            previousBestStreak: 0,
            brokenStreak: null,
            lastSuccessfulSession: null,
            recoveryChallenge: {
                active: false,
                startDay: null,
                currentDay: 0,
                qualifyingDays: [],
                brokenStreakCountToRestore: 0,
                status: 'idle', // 'idle' | 'in_progress' | 'completed' | 'failed'
                lastCompletedDate: null
            },
            recoveryConfig: {
                minDelayDays: RECOVERY_CONFIG_DEFAULTS.minDelayDays,
                requiredConsecutiveDays: RECOVERY_CONFIG_DEFAULTS.requiredConsecutiveDays
            },
            // Legacy mirrors
            current: 0,
            longest: 0,
            lastCheckIn: null,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Ensure backward-compatible shape & migrate legacy structures.
     */
    function migrateState(saved) {
        if (!saved || typeof saved !== 'object') {
            return createDefaultState();
        }

        const state = createDefaultState();

        // 1. Current streak
        state.currentStreak = typeof saved.currentStreak === 'number'
            ? saved.currentStreak
            : (typeof saved.current === 'number' ? saved.current : 0);

        // 2. Longest streak
        state.longestStreak = typeof saved.longestStreak === 'number'
            ? saved.longestStreak
            : (typeof saved.longest === 'number' ? saved.longest : state.currentStreak);

        // 3. Previous best streak
        state.previousBestStreak = typeof saved.previousBestStreak === 'number'
            ? saved.previousBestStreak
            : Math.max(state.longestStreak, state.currentStreak);

        // 4. Broken streak
        if (saved.brokenStreak && typeof saved.brokenStreak === 'object') {
            state.brokenStreak = {
                count: Number(saved.brokenStreak.count) || 0,
                brokenDate: saved.brokenStreak.brokenDate || null,
                lastCompletedDate: saved.brokenStreak.lastCompletedDate || null
            };
        } else {
            state.brokenStreak = null;
        }

        // 5. Last successful session
        if (saved.lastSuccessfulSession && typeof saved.lastSuccessfulSession === 'object') {
            state.lastSuccessfulSession = {
                date: saved.lastSuccessfulSession.date || null,
                timestamp: saved.lastSuccessfulSession.timestamp || 0,
                type: saved.lastSuccessfulSession.type || 'amritvela',
                slot: saved.lastSuccessfulSession.slot || 'good'
            };
        } else {
            state.lastSuccessfulSession = null;
        }

        // 6. Recovery challenge
        if (saved.recoveryChallenge && typeof saved.recoveryChallenge === 'object') {
            state.recoveryChallenge = {
                active: Boolean(saved.recoveryChallenge.active),
                startDay: saved.recoveryChallenge.startDay || null,
                currentDay: Number(saved.recoveryChallenge.currentDay) || 0,
                qualifyingDays: Array.isArray(saved.recoveryChallenge.qualifyingDays) ? [...saved.recoveryChallenge.qualifyingDays] : [],
                brokenStreakCountToRestore: Number(saved.recoveryChallenge.brokenStreakCountToRestore) || 0,
                status: saved.recoveryChallenge.status || 'idle',
                lastCompletedDate: saved.recoveryChallenge.lastCompletedDate || null
            };
        }

        // 7. Recovery config
        if (saved.recoveryConfig && typeof saved.recoveryConfig === 'object') {
            const minDays = Number(saved.recoveryConfig.minDelayDays);
            state.recoveryConfig = {
                minDelayDays: (minDays >= 5 && minDays <= 10) ? minDays : RECOVERY_CONFIG_DEFAULTS.minDelayDays,
                requiredConsecutiveDays: 5
            };
        }

        // 8. Legacy mirrors
        state.current = state.currentStreak;
        state.longest = state.longestStreak;
        state.lastCheckIn = saved.lastCheckIn || null;
        state.lastUpdated = saved.lastUpdated || new Date().toISOString();

        return state;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // LOG AUDITING & STREAK CALCULATION ENGINE
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Collect all qualifying attended dates from amritvela and nitnem logs.
     * Attendance MUST be explicit:
     * - Amritvela: woke === true or explicit timestamp (passive boots/audio never logged here).
     * - Nitnem: completed === true or percentage === 100.
     */
    function getQualifyingDates() {
        const amritvelaLog = loadJson(KEYS.AMRITVELA_LOG, {});
        const nitnemLog = loadJson(KEYS.NITNEM_LOG, {});
        const pothiCompleted = loadJson(KEYS.MY_POTHI_COMPLETED, {});

        const dateSet = new Set();

        // Amritvela log
        Object.keys(amritvelaLog).forEach(d => {
            const entry = amritvelaLog[d];
            if (entry && (entry.woke === true || entry.timestamp || entry.slot)) {
                dateSet.add(d);
            }
        });

        // Nitnem log
        Object.keys(nitnemLog).forEach(d => {
            const entry = nitnemLog[d];
            if (entry && (entry.completed === true || entry.percentage === 100)) {
                dateSet.add(d);
            }
        });

        // My Pothi completed (dates that have completed banis recorded)
        Object.keys(pothiCompleted).forEach(d => {
            const completedList = pothiCompleted[d];
            if (Array.isArray(completedList) && completedList.length > 0) {
                // If Nitnem log marks completed or has substantial completion
                const entry = nitnemLog[d];
                if (entry && (entry.completed === true || entry.percentage === 100)) {
                    dateSet.add(d);
                }
            }
        });

        return Array.from(dateSet);
    }

    /**
     * Calculate streak deterministically from a set of date strings.
     * Returns:
     * {
     *   currentStreak: number,
     *   longestStreak: number,
     *   sortedUtcDays: number[],
     *   lastCompletedDate: string | null,
     *   isStreakActive: boolean,
     *   lastContiguousRun: { count: number, lastCompletedDate: string, brokenDate: string } | null
     * }
     */
    function calculateStreakDetails(dateStrings, asOfDateStr) {
        const todayStr = asOfDateStr || getTodayString();
        const todayUtc = toUtcDay(todayStr);
        const yesterdayUtc = todayUtc - 1;

        if (!Array.isArray(dateStrings) || dateStrings.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                sortedUtcDays: [],
                lastCompletedDate: null,
                isStreakActive: false,
                lastContiguousRun: null
            };
        }

        // Convert valid date strings to distinct UTC day numbers, sorted descending
        const dayNumbers = Array.from(new Set(
            dateStrings
                .map(toUtcDay)
                .filter(d => !isNaN(d) && d <= todayUtc)
        )).sort((a, b) => b - a);

        if (dayNumbers.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                sortedUtcDays: [],
                lastCompletedDate: null,
                isStreakActive: false,
                lastContiguousRun: null
            };
        }

        // 1. Calculate active current streak
        let currentStreak = 0;
        let isStreakActive = false;
        const latestDay = dayNumbers[0];

        if (latestDay === todayUtc || latestDay === yesterdayUtc) {
            isStreakActive = true;
            currentStreak = 1;
            let expectedPrev = latestDay - 1;

            for (let i = 1; i < dayNumbers.length; i++) {
                if (dayNumbers[i] === expectedPrev) {
                    currentStreak++;
                    expectedPrev--;
                } else if (dayNumbers[i] < expectedPrev) {
                    break;
                }
            }
        }

        // 2. Calculate all-time longest streak in the sequence
        let longestStreak = 0;
        let run = 1;
        for (let i = 0; i < dayNumbers.length; i++) {
            if (i + 1 < dayNumbers.length && dayNumbers[i] - dayNumbers[i + 1] === 1) {
                run++;
            } else {
                longestStreak = Math.max(longestStreak, run);
                run = 1;
            }
        }
        longestStreak = Math.max(longestStreak, run, currentStreak);

        // 3. Find the most recent contiguous run (for broken streak determination)
        let lastContiguousRun = null;
        if (dayNumbers.length > 0) {
            let runCount = 1;
            for (let i = 0; i < dayNumbers.length - 1; i++) {
                if (dayNumbers[i] - dayNumbers[i + 1] === 1) {
                    runCount++;
                } else {
                    break;
                }
            }
            const lastCompletedDate = fromUtcDay(latestDay);
            const brokenDate = fromUtcDay(latestDay + 1);
            lastContiguousRun = {
                count: runCount,
                lastCompletedDate,
                brokenDate
            };
        }

        return {
            currentStreak,
            longestStreak,
            sortedUtcDays: dayNumbers,
            lastCompletedDate: dayNumbers.length > 0 ? fromUtcDay(latestDay) : null,
            isStreakActive,
            lastContiguousRun
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // AUTHORITATIVE ENGINE CORE
    // ─────────────────────────────────────────────────────────────────────────────

    const AuthoritativeStreakEngine = {
        CONFIG: {
            KEYS,
            RECOVERY_CONFIG_DEFAULTS,
            GURBANI_PASSAGES
        },

        /**
         * Get full authoritative streak state from storage.
         */
        getState: function () {
            const saved = loadJson(KEYS.STREAK_DATA, null);
            return migrateState(saved);
        },

        /**
         * Save state to anhad_streak_data and broadcast updates.
         */
        saveState: function (state) {
            if (!state || typeof state !== 'object') return;

            // Ensure mirrors
            state.current = state.currentStreak;
            state.longest = state.longestStreak;
            state.lastUpdated = new Date().toISOString();

            saveJson(KEYS.STREAK_DATA, state);
            this.syncLegacyStores(state);

            // Broadcast events
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                try {
                    window.dispatchEvent(new CustomEvent('authoritativeStreakUpdated', { detail: state }));
                    window.dispatchEvent(new CustomEvent('streakUpdated', { detail: state }));
                } catch (e) {}
            }

            return state;
        },

        /**
         * Sync streak state to legacy storage keys for unified cross-module consistency.
         */
        syncLegacyStores: function (state) {
            try {
                // 1. Sync to UnifiedStats
                const unified = loadJson(KEYS.UNIFIED_STATS, null);
                if (unified && unified.streaks) {
                    unified.streaks.nitnem = state.currentStreak;
                    unified.lastActive = new Date().toISOString();
                    saveJson(KEYS.UNIFIED_STATS, unified);
                }

                // 2. Sync to legacy nitnemTracker_userData
                const userData = loadJson(KEYS.USER_DATA, null);
                if (userData && userData.streaks) {
                    userData.streaks.current = state.currentStreak;
                    userData.streaks.longest = state.longestStreak;
                    saveJson(KEYS.USER_DATA, userData);
                }
            } catch (e) {
                console.warn('[AuthoritativeStreakEngine] Sync legacy stores warning:', e);
            }
        },

        /**
         * Recalculate streak state from all qualifying attendance logs.
         */
        recalculateStreak: function (asOfDateStr) {
            const state = this.getState();
            const todayStr = asOfDateStr || getTodayString();
            const qualifyingDates = getQualifyingDates();
            const details = calculateStreakDetails(qualifyingDates, todayStr);

            const prevCurrent = state.currentStreak;
            state.currentStreak = details.currentStreak;
            state.longestStreak = Math.max(state.longestStreak, details.longestStreak, details.currentStreak);

            // Maintain previousBestStreak
            state.previousBestStreak = Math.max(
                state.previousBestStreak || 0,
                state.longestStreak,
                prevCurrent
            );

            // Streak broke detection
            if (details.currentStreak === 0 && details.lastContiguousRun) {
                const elapsedDays = toUtcDay(todayStr) - toUtcDay(details.lastContiguousRun.brokenDate);
                if (elapsedDays >= 1) {
                    state.brokenStreak = {
                        count: details.lastContiguousRun.count,
                        brokenDate: details.lastContiguousRun.brokenDate,
                        lastCompletedDate: details.lastContiguousRun.lastCompletedDate
                    };
                    state.previousBestStreak = Math.max(state.previousBestStreak, details.lastContiguousRun.count);
                }
            } else if (details.currentStreak > 0) {
                state.lastCheckIn = todayStr;
                // If streak reached or surpassed previous broken count, broken streak is resolved
                if (state.brokenStreak && state.currentStreak >= state.brokenStreak.count) {
                    state.brokenStreak = null;
                }
            }

            this.saveState(state);
            return state;
        },

        /**
         * Check if streak has broken as of a given date.
         */
        checkStreakBreak: function (currentDateStr) {
            const todayStr = currentDateStr || getTodayString();
            const state = this.recalculateStreak(todayStr);

            if (!state.brokenStreak) {
                return {
                    isBroken: false,
                    brokenStreak: null,
                    elapsedDays: 0
                };
            }

            const elapsedDays = Math.max(0, toUtcDay(todayStr) - toUtcDay(state.brokenStreak.brokenDate));
            return {
                isBroken: true,
                brokenStreak: state.brokenStreak,
                elapsedDays
            };
        },

        /**
         * Record verified Amritvela attendance.
         * Must be explicit user action. Never increments from passive playback or app boot.
         */
        recordAmritvelaAttendance: function (dateStr, timeStr, slot) {
            const todayStr = dateStr || getTodayString();
            const amritvelaLog = loadJson(KEYS.AMRITVELA_LOG, {});

            const now = new Date();
            const finalTime = timeStr || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const finalSlot = slot || getSlotFromTime(finalTime);

            amritvelaLog[todayStr] = {
                date: todayStr,
                time: finalTime,
                slot: finalSlot,
                timestamp: now.toISOString(),
                woke: true,
                origin: 'user'
            };
            saveJson(KEYS.AMRITVELA_LOG, amritvelaLog);

            const state = this.getState();
            state.lastSuccessfulSession = {
                date: todayStr,
                timestamp: Date.now(),
                type: 'amritvela',
                slot: finalSlot
            };

            // If active recovery challenge, record day completion
            if (state.recoveryChallenge && state.recoveryChallenge.active && state.recoveryChallenge.status === 'in_progress') {
                this.recordRecoveryDayCompletion(todayStr, finalTime);
            }

            this.saveState(state);
            return this.recalculateStreak(todayStr);
        },

        /**
         * Record verified Nitnem full completion.
         */
        recordNitnemCompletion: function (dateStr, completedBaniIds) {
            const todayStr = dateStr || getTodayString();
            const nitnemLog = loadJson(KEYS.NITNEM_LOG, {});

            const existing = nitnemLog[todayStr] || {};
            nitnemLog[todayStr] = {
                ...existing,
                completed: true,
                percentage: 100,
                completedBaniIds: Array.isArray(completedBaniIds) ? completedBaniIds : (existing.completedBaniIds || []),
                lastUpdated: new Date().toISOString()
            };
            saveJson(KEYS.NITNEM_LOG, nitnemLog);

            const state = this.getState();
            state.lastSuccessfulSession = {
                date: todayStr,
                timestamp: Date.now(),
                type: 'nitnem',
                slot: 'nitnem'
            };
            this.saveState(state);

            return this.recalculateStreak(todayStr);
        },

        // ─────────────────────────────────────────────────────────────────────────────
        // PREVIOUS-BEST STREAK RECOVERY CHALLENGE (R2)
        // ─────────────────────────────────────────────────────────────────────────────

        /**
         * Check if the user is eligible for the Previous-Best Streak Recovery Challenge.
         * Eligibility conditions:
         * 1. Broken streak exists (or currentStreak < previousBestStreak).
         * 2. Elapsed days since break >= minDelayDays (default 7, configurable 5-10).
         * 3. previousBestStreak > currentStreak.
         * 4. Challenge is not already active or completed for this break.
         */
        isRecoveryEligible: function (currentDateStr) {
            const todayStr = currentDateStr || getTodayString();
            const state = this.getState();

            // Must have previous best higher than current streak
            if (!state.previousBestStreak || state.previousBestStreak <= state.currentStreak) {
                return false;
            }

            // Must have a broken streak record
            if (!state.brokenStreak || !state.brokenStreak.brokenDate) {
                return false;
            }

            // Elapsed days check
            const minDelay = (state.recoveryConfig && state.recoveryConfig.minDelayDays)
                ? state.recoveryConfig.minDelayDays
                : RECOVERY_CONFIG_DEFAULTS.minDelayDays;

            const breakUtc = toUtcDay(state.brokenStreak.brokenDate);
            const todayUtc = toUtcDay(todayStr);
            const elapsed = todayUtc - breakUtc;

            if (elapsed < minDelay) {
                return false;
            }

            // If challenge already completed for this streak
            if (state.recoveryChallenge && state.recoveryChallenge.status === 'completed') {
                return false;
            }

            return true;
        },

        /**
         * Start the 5-day Previous-Best Streak Recovery Challenge.
         */
        startRecoveryChallenge: function () {
            if (!this.isRecoveryEligible()) {
                const state = this.getState();
                return {
                    success: false,
                    error: 'User is not eligible for recovery challenge at this time.',
                    challenge: state.recoveryChallenge
                };
            }

            const state = this.getState();
            const todayStr = getTodayString();

            state.recoveryChallenge = {
                active: true,
                startDay: todayStr,
                currentDay: 0,
                qualifyingDays: [],
                brokenStreakCountToRestore: state.brokenStreak ? state.brokenStreak.count : state.previousBestStreak,
                status: 'in_progress',
                lastCompletedDate: null
            };

            this.saveState(state);
            return {
                success: true,
                challenge: state.recoveryChallenge,
                passage: GURBANI_PASSAGES[0]
            };
        },

        /**
         * Record a qualifying day during the recovery challenge.
         */
        recordRecoveryDayCompletion: function (dateStr, timeStr) {
            const state = this.getState();
            const challenge = state.recoveryChallenge;

            if (!challenge || !challenge.active || challenge.status !== 'in_progress') {
                return {
                    success: false,
                    error: 'No active recovery challenge in progress.'
                };
            }

            const todayStr = dateStr || getTodayString();
            const todayUtc = toUtcDay(todayStr);

            // Prevent duplicate completions for the same day
            if (challenge.qualifyingDays.includes(todayStr)) {
                return {
                    success: true,
                    duplicate: true,
                    currentDay: challenge.currentDay,
                    challenge
                };
            }

            // Check consecutiveness
            if (challenge.lastCompletedDate) {
                const lastUtc = toUtcDay(challenge.lastCompletedDate);
                const diff = todayUtc - lastUtc;

                if (diff > 1) {
                    // Missed a required day! Challenge fails and resets.
                    challenge.status = 'failed';
                    challenge.active = false;
                    challenge.currentDay = 0;
                    challenge.qualifyingDays = [];
                    challenge.lastCompletedDate = null;
                    this.saveState(state);

                    return {
                        success: false,
                        failed: true,
                        message: 'Missing a day during the challenge resets your progress. Spiritual discipline is a lifelong path of grace and effort — you can restart the 5-day challenge whenever you are ready.',
                        retryAvailable: true,
                        challenge
                    };
                }
            }

            // Valid consecutive day
            challenge.currentDay += 1;
            challenge.qualifyingDays.push(todayStr);
            challenge.lastCompletedDate = todayStr;

            const dayIndex = challenge.currentDay;
            const passage = GURBANI_PASSAGES[dayIndex - 1] || null;

            // Day 5 Completion: Trigger atomic streak restoration and backfill
            if (challenge.currentDay >= 5) {
                challenge.status = 'completed';
                challenge.active = false;
                const restoration = this.restoreStreakAndBackfillGaps(state);
                return {
                    success: true,
                    completed: true,
                    dayNumber: 5,
                    passage,
                    challenge,
                    restoration
                };
            }

            this.saveState(state);
            return {
                success: true,
                completed: false,
                dayNumber: challenge.currentDay,
                passage,
                challenge
            };
        },

        /**
         * Reset or cancel recovery challenge.
         */
        resetRecoveryChallenge: function () {
            const state = this.getState();
            state.recoveryChallenge = {
                active: false,
                startDay: null,
                currentDay: 0,
                qualifyingDays: [],
                brokenStreakCountToRestore: 0,
                status: 'idle',
                lastCompletedDate: null
            };
            this.saveState(state);
            return state.recoveryChallenge;
        },

        // ─────────────────────────────────────────────────────────────────────────────
        // DETERMINISTIC RESTORATION & HISTORICAL GAP BACKFILLING (R3)
        // ─────────────────────────────────────────────────────────────────────────────

        /**
         * Calculate user's average historical wake-up time from genuine attendance entries.
         * Restored records and penalty patches are strictly excluded.
         * Default fallback: "04:30".
         */
        calculateAverageWakeUpTime: function () {
            const amritvelaLog = loadJson(KEYS.AMRITVELA_LOG, {});
            const genuineEntries = [];

            Object.keys(amritvelaLog).forEach(d => {
                const entry = amritvelaLog[d];
                // Exclude system restored, punishment patches, and records without wake/time
                if (
                    entry &&
                    entry.woke === true &&
                    entry.time &&
                    entry.origin !== 'restored' &&
                    !entry.systemGenerated &&
                    !entry.isSystemGenerated &&
                    !entry.isStreakSaverPatch
                ) {
                    const parts = String(entry.time).split(':');
                    const h = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    if (!isNaN(h) && !isNaN(m)) {
                        genuineEntries.push(h * 60 + m);
                    }
                }
            });

            if (genuineEntries.length === 0) {
                return '04:30'; // Defined fallback
            }

            const sum = genuineEntries.reduce((acc, curr) => acc + curr, 0);
            const avgMinutes = Math.round(sum / genuineEntries.length);
            const avgH = Math.floor(avgMinutes / 60) % 24;
            const avgM = avgMinutes % 60;

            return `${String(avgH).padStart(2, '0')}:${String(avgM).padStart(2, '0')}`;
        },

        /**
         * Restore previous-best streak atomically and backfill missing gap dates.
         * Restored records receive `origin: "restored"`, `systemGenerated: true`.
         * Genuine records are NEVER overwritten.
         */
        restoreStreakAndBackfillGaps: function (existingState) {
            const state = existingState || this.getState();
            const amritvelaLog = loadJson(KEYS.AMRITVELA_LOG, {});
            const challenge = state.recoveryChallenge;

            const targetStreak = (state.brokenStreak && state.brokenStreak.count)
                ? state.brokenStreak.count
                : (state.previousBestStreak || 0);

            const avgWakeTime = this.calculateAverageWakeUpTime();
            const avgSlot = getSlotFromTime(avgWakeTime);

            // Determine gap range: from brokenDate up to challenge start day - 1
            const gapStartUtc = state.brokenStreak && state.brokenStreak.brokenDate
                ? toUtcDay(state.brokenStreak.brokenDate)
                : (challenge.startDay ? toUtcDay(challenge.startDay) - 7 : toUtcDay(getTodayString()) - 7);

            const firstChallengeUtc = challenge.qualifyingDays.length > 0
                ? toUtcDay(challenge.qualifyingDays[0])
                : (challenge.startDay ? toUtcDay(challenge.startDay) : toUtcDay(getTodayString()));

            let backfilledCount = 0;
            const backfilledDates = [];

            if (!isNaN(gapStartUtc) && !isNaN(firstChallengeUtc) && gapStartUtc < firstChallengeUtc) {
                for (let dayUtc = gapStartUtc; dayUtc < firstChallengeUtc; dayUtc++) {
                    const dStr = fromUtcDay(dayUtc);
                    // NEVER overwrite genuine records
                    if (!amritvelaLog[dStr]) {
                        amritvelaLog[dStr] = {
                            date: dStr,
                            time: avgWakeTime,
                            slot: avgSlot,
                            timestamp: new Date(`${dStr}T${avgWakeTime}:00.000Z`).toISOString(),
                            woke: true,
                            origin: 'restored',
                            systemGenerated: true,
                            isSystemGenerated: true
                        };
                        backfilledCount++;
                        backfilledDates.push(dStr);
                    }
                }
            }

            // Save backfilled records
            saveJson(KEYS.AMRITVELA_LOG, amritvelaLog);

            // Atomically restore currentStreak (previous-best + 5 challenge days)
            state.currentStreak = targetStreak + 5;
            state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
            state.previousBestStreak = Math.max(state.previousBestStreak, state.longestStreak);
            state.brokenStreak = null; // Resolved!
            state.lastCheckIn = challenge.lastCompletedDate || getTodayString();

            this.saveState(state);

            return {
                success: true,
                restoredStreak: state.currentStreak,
                targetStreak,
                backfilledCount,
                backfilledDates,
                avgWakeTime
            };
        },

        /**
         * Helper for analytics/charts: returns only genuine attendance entries,
         * excluding restored records and streak saver penalty patches.
         */
        getGenuineAmritvelaEntries: function () {
            const log = loadJson(KEYS.AMRITVELA_LOG, {});
            const genuine = {};
            Object.keys(log).forEach(date => {
                const entry = log[date];
                if (
                    entry &&
                    entry.woke === true &&
                    entry.origin !== 'restored' &&
                    !entry.systemGenerated &&
                    !entry.isSystemGenerated &&
                    !entry.isStreakSaverPatch
                ) {
                    genuine[date] = entry;
                }
            });
            return genuine;
        },

        /**
         * Get passage for a challenge day (1 to 5).
         */
        getGurbaniPassage: function (dayNumber) {
            const idx = Math.max(1, Math.min(5, dayNumber || 1)) - 1;
            return GURBANI_PASSAGES[idx];
        },

        // Helper date converters exposed for consistency
        toUtcDay,
        fromUtcDay,
        getTodayString,
        getYesterdayString
    };

    return AuthoritativeStreakEngine;
}));
