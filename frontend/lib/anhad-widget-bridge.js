/**
 * ANHAD WIDGET BRIDGE — Syncs WebView data to Android Home Screen Widgets
 * Reads from existing storage keys and pushes to native SharedPreferences
 * via the WidgetDataBridge Capacitor plugin.
 */
(function() {
    'use strict';

    var debug = false;
    var retryCount = 0;
    var maxRetries = 15;

    function isNative() {
        return window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
    }

    function getPlugin() {
        try {
            return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.WidgetDataBridge;
        } catch(e) { 
            if (debug) console.error('[AnhadWidgetBridge] Error getting plugin:', e);
            return null; 
        }
    }

    function setDebug(enabled) {
        debug = enabled;
        console.log('[AnhadWidgetBridge] Debug mode:', enabled);
    }

    // ═══════════════════════════════════════════════════════════════════
    // KIRTAN WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncKirtan() {
        var plugin = getPlugin();
        if (!plugin) {
            if (debug) console.warn('[AnhadWidgetBridge] Plugin not available for Kirtan sync');
            return;
        }
        try {
            var state = window.AnhadAudio ? window.AnhadAudio.getState() : {};
            var theme = localStorage.getItem('anhad_theme') || 'light';
            await plugin.syncWidgetData({
                widgetType: 'kirtan',
                data: {
                    trackName: state.streamName || state.trackTitle || 'Not Playing',
                    stationName: state.streamSubtitle || (state.stream === 'darbar' ? 'Sri Harmandir Sahib Ji' : 'ANHAD'),
                    isPlaying: !!state.isPlaying,
                    duration: '',
                    isDark: theme === 'dark'
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Kirtan synced');
        } catch(e) {
            console.error('[AnhadWidgetBridge] Error syncing Kirtan:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // NITNEM TRACKER WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncNitnem() {
        var plugin = getPlugin();
        if (!plugin) {
            if (debug) console.warn('[AnhadWidgetBridge] Plugin not available for Nitnem sync');
            return;
        }
        try {
            var today = new Date().toLocaleDateString('en-CA');
            var theme = localStorage.getItem('anhad_theme') || 'light';

            // Read streak data
            var streakData = {};
            try { streakData = JSON.parse(localStorage.getItem('anhad_streak_data') || '{"current": 0}'); } catch(e) {}
            var streak = streakData.current || 0;

            // Read today's completion — period-keyed schema: { amritvela: [uid,...], rehras: [...], sohila: [...] }
            var nitnemLog = {};
            try { nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}'); } catch(e) {}
            var todayLog = nitnemLog[today] || {};
            // Count all completed UIDs across all periods
            var completedCount = (todayLog.amritvela ? todayLog.amritvela.length : 0)
                               + (todayLog.rehras    ? todayLog.rehras.length    : 0)
                               + (todayLog.sohila    ? todayLog.sohila.length    : 0);

            // Read selected banis — period-keyed object: { amritvela: [...], rehras: [...], sohila: [...] }
            var selectedBanisRaw = {};
            try { selectedBanisRaw = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || '{}'); } catch(e) {}
            var totalBanis = ((selectedBanisRaw.amritvela || []).length)
                           + ((selectedBanisRaw.rehras    || []).length)
                           + ((selectedBanisRaw.sohila    || []).length)
                           || 5; // fallback default
            var progress = totalBanis > 0 ? Math.round((completedCount / totalBanis) * 100) : 0;

            // Build completion indicator array (one boolean per bani slot)
            var indicators = [];
            for (var i = 0; i < totalBanis; i++) {
                indicators.push(i < completedCount);
            }

            await plugin.syncWidgetData({
                widgetType: 'nitnem',
                data: {
                    streak: streak,
                    progress: progress,
                    completedBanis: completedCount,
                    totalBanis: totalBanis,
                    completedBanisList: indicators,
                    isDark: theme === 'dark'
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Nitnem synced - streak:', streak, 'progress:', progress);
        } catch(e) {
            console.error('[AnhadWidgetBridge] Error syncing Nitnem:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // NAAM ABHYAS WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncNaamAbhyas() {
        var plugin = getPlugin();
        if (!plugin) {
            if (debug) console.warn('[AnhadWidgetBridge] Plugin not available for Naam Abhyas sync');
            return;
        }
        try {
            var theme = localStorage.getItem('anhad_theme') || 'light';
            var config = {};
            try { config = JSON.parse(localStorage.getItem('naam_abhyas_config') || '{"enabled": false, "activeHours": {"start": 5, "end": 22}}'); } catch(e) {}
            var enabled = !!config.enabled;
            var sh = (config.activeHours && config.activeHours.start) || 5;
            var eh = (config.activeHours && config.activeHours.end) || 22;
            var totalHours = eh - sh + 1;

            // Count completed hours today from consistent data structure
            var today = new Date().toLocaleDateString('en-CA');
            var history = {};
            try { history = JSON.parse(localStorage.getItem('naam_abhyas_history') || '{}'); } catch(e) {}
            var todaySchedule = history.scheduleHistory?.[today] || {};

            var completedHours = 0;
            for (var hour = sh; hour <= eh; hour++) {
                if (todaySchedule[hour]?.status === 'completed') {
                    completedHours++;
                }
            }

            // Next reminder
            var now = new Date();
            var currentHour = now.getHours();
            var nextReminder = '';
            if (enabled) {
                for (var hour = currentHour + 1; hour <= eh; hour++) {
                    if (!todaySchedule[hour] || todaySchedule[hour]?.status !== 'completed') {
                        nextReminder = hour + ':00';
                        break;
                    }
                }
            }

            // Get streak from history
            var streak = history.currentStreak || 0;

            await plugin.syncWidgetData({
                widgetType: 'naamabhyas',
                data: {
                    streak: streak,
                    completedHours: completedHours,
                    totalHours: totalHours,
                    remainingHours: Math.max(0, totalHours - completedHours),
                    enabled: enabled,
                    nextReminder: nextReminder,
                    isDark: theme === 'dark'
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Naam Abhyas synced - enabled:', enabled, 'completed:', completedHours);
        } catch(e) {
            console.error('[AnhadWidgetBridge] Error syncing Naam Abhyas:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GURPURAB CALENDAR DATA (Nanakshahi Calendar)
    // ═══════════════════════════════════════════════════════════════════
    function computeNextGurpurab() {
        // Major Gurpurabs & Sikh events (month/day in Gregorian approximations)
        var events = [
            { month: 1, day: 5,  name: 'Parkash Guru Gobind Singh Ji' },
            { month: 1, day: 13, name: 'Maghi — Sahibzade Shaheedi' },
            { month: 2, day: 10, name: 'Parkash Sri Guru Har Rai Ji' },
            { month: 3, day: 14, name: 'Hola Mohalla' },
            { month: 3, day: 22, name: 'Shaheedi Guru Arjan Dev Ji' },
            { month: 4, day: 14, name: 'Vaisakhi — Khalsa Sajna Divas' },
            { month: 5, day: 16, name: 'Parkash Sri Guru Amar Das Ji' },
            { month: 6, day: 16, name: 'Shaheedi Guru Arjan Dev Ji' },
            { month: 7, day: 6,  name: 'Parkash Sri Guru Hargobind Sahib Ji' },
            { month: 8, day: 21, name: 'Parkash Sri Guru Har Krishan Ji' },
            { month: 9, day: 1,  name: 'Sikh Reference Library Anniversary' },
            { month: 9, day: 16, name: 'Joti Jot Sri Guru Angad Dev Ji' },
            { month: 10, day: 9, name: 'Parkash Sri Guru Ram Das Ji' },
            { month: 10, day: 20, name: 'Bandi Chhor Divas' },
            { month: 11, day: 8,  name: 'Parkash Sri Guru Nanak Dev Ji' },
            { month: 11, day: 24, name: 'Shaheedi Guru Tegh Bahadur Ji' },
            { month: 12, day: 18, name: 'Shaheedi Sahibzade' },
            { month: 12, day: 22, name: 'Shaheedi Sahibzade Zorawar & Fateh Singh Ji' },
            { month: 12, day: 27, name: 'Joti Jot Sri Guru Gobind Singh Ji' }
        ];

        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var bestEvent = null;
        var bestDays = 999;

        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            var evDate = new Date(now.getFullYear(), ev.month - 1, ev.day);
            var diff = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));
            if (diff < 0) {
                // Try next year
                evDate = new Date(now.getFullYear() + 1, ev.month - 1, ev.day);
                diff = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));
            }
            if (diff >= 0 && diff < bestDays) {
                bestDays = diff;
                bestEvent = { name: ev.name, daysUntil: diff, date: evDate.toISOString() };
            }
        }

        if (!bestEvent) {
            bestEvent = { name: 'Parkash Guru Gobind Singh Ji', daysUntil: 0, date: '' };
        }

        // Persist for other consumers
        try { localStorage.setItem('anhad_next_gurpurab', JSON.stringify(bestEvent)); } catch(e) {}
        return bestEvent;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CALENDAR / HUKAMNAMA WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncCalendar() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var theme = localStorage.getItem('anhad_theme') || 'light';
            var hukamnama = '';
            try { hukamnama = localStorage.getItem('anhad_hukamnama_today') || ''; } catch(e) {}

            // Compute next Gurpurab from built-in calendar
            var gurpurab = computeNextGurpurab();

            await plugin.syncWidgetData({
                widgetType: 'calendar',
                data: {
                    nextEventName: gurpurab.name,
                    daysUntil: gurpurab.daysUntil,
                    hukamnamaPreview: hukamnama,
                    nanakshahiDate: '',
                    isDark: theme === 'dark'
                }
            });
        } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // HUKAMNAMA WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncHukamnama() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var theme = localStorage.getItem('anhad_theme') || 'light';
            var hukamnama = '';
            try { hukamnama = localStorage.getItem('anhad_hukamnama_today') || ''; } catch(e) {}
            var ang = '';
            try { ang = localStorage.getItem('anhad_hukamnama_ang') || ''; } catch(e) {}
            var today = new Date();
            var dateStr = today.toLocaleDateString('pa-IN', { weekday: 'long', day: 'numeric', month: 'long' });

            await plugin.syncWidgetData({
                widgetType: 'hukamnama',
                data: {
                    preview: hukamnama || 'Tap to read today\'s Hukamnama',
                    ang: ang,
                    date: dateStr,
                    isDark: theme === 'dark'
                }
            });
        } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // SMART REMINDER WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncReminders() {
        var plugin = getPlugin();
        if (!plugin) {
            if (debug) console.warn('[AnhadWidgetBridge] Plugin not available for Reminders sync');
            return;
        }
        try {
            var theme = localStorage.getItem('anhad_theme') || 'light';
            var sr = null;
            try { sr = JSON.parse(localStorage.getItem('sr_reminders_v7') || '{}'); } catch(e) {}
            if (!sr) { return; }

            var allAlarms = [];
            if (sr.core) { Object.keys(sr.core).forEach(function(k) { var r = sr.core[k]; if (r && r.enabled) allAlarms.push(r); }); }
            if (sr.custom) { sr.custom.forEach(function(r) { if (r && r.enabled) allAlarms.push(r); }); }

            var now = new Date();
            var ct = now.getHours() * 60 + now.getMinutes();
            var dow = now.getDay();

            // Use consistent data source - sr_reminders_v7 only
            var totalR = allAlarms.length;
            var completedR = 0;
            var nextTime = '';
            var nextLabel = '';

            allAlarms.forEach(function(a) {
                if (!a.days || a.days.indexOf(dow) !== -1) {
                    var tp = (a.time || '05:00').split(':');
                    var alarmMin = parseInt(tp[0], 10) * 60 + parseInt(tp[1], 10);
                    if (alarmMin <= ct) completedR++;
                    if (alarmMin > ct && !nextTime) {
                        nextTime = a.time; nextLabel = a.label || a.title || 'Reminder';
                    }
                }
            });

            // Get streak from consistent key
            var streakData = {};
            try { streakData = JSON.parse(localStorage.getItem('anhad_streak_data') || '{"current": 0}'); } catch(e) {}
            var streak = streakData.current || 0;

            await plugin.syncWidgetData({
                widgetType: 'reminders',
                data: {
                    totalReminders: totalR,
                    completedReminders: completedR,
                    nextReminderTime: nextTime,
                    nextReminderLabel: nextLabel,
                    streak: streak,
                    allDone: totalR > 0 && completedR >= totalR,
                    isDark: theme === 'dark'
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Reminders synced - total:', totalR, 'completed:', completedR);
        } catch(e) {
            console.error('[AnhadWidgetBridge] Error syncing Reminders:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // SYNC ALL WIDGETS
    // ═══════════════════════════════════════════════════════════════════
    async function syncAllWidgets() {
        if (!isNative()) {
            if (debug) console.log('[AnhadWidgetBridge] Not on native platform, skipping sync');
            return;
        }
        var plugin = getPlugin();
        if (!plugin) {
            if (debug) console.warn('[AnhadWidgetBridge] Plugin not available, skipping sync');
            return;
        }
        await syncKirtan();
        await syncNitnem();
        await syncNaamAbhyas();
        await syncCalendar();
        await syncHukamnama();
        await syncReminders();
        if (debug) console.log('[AnhadWidgetBridge] All widgets synced');
    }

    // ═══════════════════════════════════════════════════════════════════
    // AUTO-SYNC ON EVENTS
    // ═══════════════════════════════════════════════════════════════════
    function setupAutoSync() {
        if (!isNative()) return;

        // Sync on kirtan state change
        window.addEventListener('anhadAudioStateChange', function() {
            syncKirtan();
        });

        // Sync on bani completion
        window.addEventListener('baniCompleted', function() {
            syncNitnem();
        });
        window.addEventListener('alarmResponseRecorded', function() {
            syncNitnem();
        });

        // Sync on visibility change (app foreground)
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                syncAllWidgets();
            }
        });

        // Sync on app resume (Capacitor)
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('appStateChange', function(state) {
                if (state.isActive) syncAllWidgets();
            });
        }

        // Initial sync with retry — plugin may not be available immediately
        var syncRetries = 0;
        var syncInterval = setInterval(function() {
            syncRetries++;
            var p = getPlugin();
            if (p) {
                clearInterval(syncInterval);
                console.log('[WidgetBridge] Plugin available, syncing all widgets');
                syncAllWidgets();
            } else if (syncRetries > 15) {
                clearInterval(syncInterval);
                console.warn('[WidgetBridge] Plugin not available after 30s, stopping retries');
            }
        }, 2000);

        // Periodic sync every 5 minutes
        setInterval(syncAllWidgets, 5 * 60 * 1000);
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAutoSync);
    } else {
        setupAutoSync();
    }

    // Public API
    window.AnhadWidgets = {
        syncAll: syncAllWidgets,
        syncKirtan: syncKirtan,
        syncNitnem: syncNitnem,
        syncNaamAbhyas: syncNaamAbhyas,
        syncCalendar: syncCalendar,
        syncHukamnama: syncHukamnama,
        syncReminders: syncReminders
    };
})();
