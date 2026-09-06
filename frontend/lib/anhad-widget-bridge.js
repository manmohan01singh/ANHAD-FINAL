/**
 * ANHAD WIDGET BRIDGE — Syncs WebView data to Android Home Screen Widgets
 * Reads from existing storage keys and pushes to native SharedPreferences
 * via the WidgetDataBridge Capacitor plugin.
 * 
 * Supports 10 dedicated iOS-grade widgets:
 * 1. Nitnem Tracker (with Pending Banis & Amritvela Streak)
 * 2. Anhad Kirtan (Sri Harmandir Sahib Live)
 * 3. Naam Abhyas (Hourly Waheguru Simran)
 * 4. Gurpurab Calendar (Nanakshahi Sikh Calendar)
 * 5. Daily Hukamnama Sahib (Sacred Mukhwak & Ang)
 * 6. Gurbani Khoj (Search Gurbani)
 * 7. Sangat Notifications & Friend Requests
 * 8. Amritvela Kirtan (24/7 Celestial Dawn)
 * 9. Saadh Sangat Live (Live broadcast & listeners count)
 * 10. Shabad Vichar (Daily contemplation verse)
 */
(function() {
    'use strict';

    var debug = false;
    var retryCount = 0;
    var maxRetries = 15;

    var BANI_NAMES = {
        'japji': 'Japji Sahib',
        'jaap': 'Jaap Sahib',
        'tav_prasad': 'Tav-Prasad Savaiye',
        'tav-prasad': 'Tav-Prasad Savaiye',
        'chaupai': 'Chaupai Sahib',
        'anand': 'Anand Sahib',
        'rehras': 'Rehras Sahib',
        'sohila': 'Kirtan Sohila',
        'sukhmani': 'Sukhmani Sahib',
        'asa_di_var': 'Asa Di Var',
        'asa-di-var': 'Asa Di Var',
        'chandi_di_var': 'Chandi Di Var',
        'shabad_hazare': 'Shabad Hazare'
    };

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
    // 1. KIRTAN WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncKirtan() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var state = window.AnhadAudio ? window.AnhadAudio.getState() : {};
            var theme = localStorage.getItem('anhad_theme') || 'light';
            await plugin.syncWidgetData({
                widgetType: 'kirtan',
                data: {
                    trackName: state.streamName || state.trackTitle || 'Darbar Sahib Live',
                    stationName: state.streamSubtitle || 'Sri Harmandir Sahib Ji',
                    isPlaying: !!state.isPlaying,
                    duration: '',
                    isDark: theme === 'dark'
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Kirtan synced');
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Kirtan:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. NITNEM TRACKER WIDGET DATA (Pending Banis + Amritvela Streak)
    // ═══════════════════════════════════════════════════════════════════
    async function syncNitnem() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var today = new Date().toLocaleDateString('en-CA');
            var theme = localStorage.getItem('anhad_theme') || 'light';

            // Read streak data
            var streakData = {};
            try { streakData = JSON.parse(localStorage.getItem('anhad_streak_data') || '{"current": 0}'); } catch(e) {}
            var streak = streakData.current || 0;

            // Read Amritvela streak specifically
            var amritvelaStreak = 0;
            try {
                var amritLog = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog') || '{}');
                amritvelaStreak = amritLog.streak || amritLog.currentStreak || 0;
            } catch(e) {}
            if (!amritvelaStreak && streakData.amritvelaStreak) {
                amritvelaStreak = streakData.amritvelaStreak;
            }
            if (!amritvelaStreak) {
                amritvelaStreak = streak;
            }

            // Read today's completion: { amritvela: [uid,...], rehras: [...], sohila: [...] }
            var nitnemLog = {};
            try { nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}'); } catch(e) {}
            var todayLog = nitnemLog[today] || {};

            var completedCount = (todayLog.amritvela ? todayLog.amritvela.length : 0)
                               + (todayLog.rehras    ? todayLog.rehras.length    : 0)
                               + (todayLog.sohila    ? todayLog.sohila.length    : 0);

            // Read selected banis
            var selectedBanisRaw = {};
            try { selectedBanisRaw = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || '{}'); } catch(e) {}
            var amritBanis = selectedBanisRaw.amritvela || ['japji', 'jaap', 'tav_prasad', 'chaupai', 'anand'];
            var rehrasBanis = selectedBanisRaw.rehras || ['rehras'];
            var sohilaBanis = selectedBanisRaw.sohila || ['sohila'];

            var totalBanis = amritBanis.length + rehrasBanis.length + sohilaBanis.length || 7;
            var progress = totalBanis > 0 ? Math.round((completedCount / totalBanis) * 100) : 0;

            // Extract Pending Banis list
            var pendingBanisList = [];
            var checkPeriod = function(banis, done) {
                var doneArr = done || [];
                banis.forEach(function(bId) {
                    if (doneArr.indexOf(bId) === -1) {
                        var name = BANI_NAMES[bId] || (bId.charAt(0).toUpperCase() + bId.slice(1).replace(/[-_]/g, ' ') + ' Sahib');
                        if (pendingBanisList.indexOf(name) === -1) {
                            pendingBanisList.push(name);
                        }
                    }
                });
            };
            checkPeriod(amritBanis, todayLog.amritvela);
            checkPeriod(rehrasBanis, todayLog.rehras);
            checkPeriod(sohilaBanis, todayLog.sohila);

            var pendingBanisStr = pendingBanisList.join(', ');

            // Build completion indicator array
            var indicators = [];
            for (var i = 0; i < totalBanis; i++) {
                indicators.push(i < completedCount);
            }

            await plugin.syncWidgetData({
                widgetType: 'nitnem',
                data: {
                    streak: streak,
                    amritvelaStreak: amritvelaStreak,
                    progress: progress,
                    completedBanis: completedCount,
                    totalBanis: totalBanis,
                    pendingBanis: pendingBanisStr,
                    allDone: totalBanis > 0 && completedCount >= totalBanis,
                    completedBanisList: indicators,
                    isDark: theme === 'dark'
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Nitnem synced - streak:', streak, 'amritvelaStreak:', amritvelaStreak, 'pending:', pendingBanisStr);
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Nitnem:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. NAAM ABHYAS WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncNaamAbhyas() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var theme = localStorage.getItem('anhad_theme') || 'light';
            var config = {};
            try { config = JSON.parse(localStorage.getItem('naam_abhyas_config') || '{"enabled": false, "activeHours": {"start": 5, "end": 22}}'); } catch(e) {}
            var enabled = !!config.enabled;
            var sh = (config.activeHours && config.activeHours.start) || 5;
            var eh = (config.activeHours && config.activeHours.end) || 22;
            var totalHours = eh - sh + 1;

            var today = new Date().toLocaleDateString('en-CA');
            var history = {};
            try { history = JSON.parse(localStorage.getItem('naam_abhyas_history') || '{}'); } catch(e) {}
            var todaySchedule = (history.scheduleHistory && history.scheduleHistory[today]) || {};

            var completedHours = 0;
            for (var hour = sh; hour <= eh; hour++) {
                if (todaySchedule[hour] && todaySchedule[hour].status === 'completed') {
                    completedHours++;
                }
            }

            var now = new Date();
            var currentHour = now.getHours();
            var nextReminder = '';
            if (enabled) {
                for (var h = currentHour + 1; h <= eh; h++) {
                    if (!todaySchedule[h] || todaySchedule[h].status !== 'completed') {
                        nextReminder = (h > 12 ? (h - 12) + ':00 PM' : h + ':00 AM');
                        break;
                    }
                }
            }

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
            if (debug) console.log('[AnhadWidgetBridge] Naam Abhyas synced - completed:', completedHours);
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Naam Abhyas:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. GURPURAB CALENDAR DATA
    // ═══════════════════════════════════════════════════════════════════
    function computeNextGurpurab() {
        var events = [
            { month: 1, day: 5,  name: 'Parkash Sri Guru Gobind Singh Ji', dateStr: '5 Jan' },
            { month: 1, day: 13, name: 'Maghi — 40 Mukte Shaheedi', dateStr: '13 Jan' },
            { month: 2, day: 10, name: 'Parkash Sri Guru Har Rai Ji', dateStr: '10 Feb' },
            { month: 3, day: 14, name: 'Hola Mohalla Celebrations', dateStr: '14 Mar' },
            { month: 4, day: 14, name: 'Vaisakhi — Khalsa Sajna Divas', dateStr: '14 Apr' },
            { month: 4, day: 18, name: 'Parkash Sri Guru Angad Dev Ji', dateStr: '18 Apr' },
            { month: 5, day: 5,  name: 'Parkash Sri Guru Amar Das Ji', dateStr: '5 May' },
            { month: 6, day: 16, name: 'Shaheedi Sri Guru Arjan Dev Ji', dateStr: '16 Jun' },
            { month: 7, day: 5,  name: 'Parkash Sri Guru Hargobind Sahib Ji', dateStr: '5 Jul' },
            { month: 7, day: 23, name: 'Parkash Sri Guru Har Krishan Ji', dateStr: '23 Jul' },
            { month: 9, day: 1,  name: 'Pehla Parkash Sri Guru Granth Sahib Ji', dateStr: '1 Sep' },
            { month: 10, day: 9, name: 'Parkash Sri Guru Ram Das Ji', dateStr: '9 Oct' },
            { month: 10, day: 20, name: 'Bandi Chhor Divas (Diwali)', dateStr: '20 Oct' },
            { month: 11, day: 15, name: 'Parkash Sri Guru Nanak Dev Ji', dateStr: '15 Nov' },
            { month: 11, day: 24, name: 'Shaheedi Sri Guru Tegh Bahadur Ji', dateStr: '24 Nov' },
            { month: 12, day: 21, name: 'Shaheedi Vade Sahibzade (Chamkaur)', dateStr: '21 Dec' },
            { month: 12, day: 26, name: 'Shaheedi Chhote Sahibzade (Fatehgarh)', dateStr: '26 Dec' }
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
                evDate = new Date(now.getFullYear() + 1, ev.month - 1, ev.day);
                diff = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));
            }
            if (diff >= 0 && diff < bestDays) {
                bestDays = diff;
                bestEvent = { name: ev.name, daysUntil: diff, eventDate: ev.dateStr };
            }
        }

        if (!bestEvent) {
            bestEvent = { name: 'Parkash Sri Guru Nanak Dev Ji', daysUntil: 0, eventDate: 'Today' };
        }
        return bestEvent;
    }

    async function syncCalendar() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var theme = localStorage.getItem('anhad_theme') || 'light';
            var gurpurab = computeNextGurpurab();
            var nanakshahiDate = '';
            try { nanakshahiDate = localStorage.getItem('anhad_nanakshahi_date') || ''; } catch(e) {}

            await plugin.syncWidgetData({
                widgetType: 'calendar',
                data: {
                    nextEventName: gurpurab.name,
                    daysUntil: gurpurab.daysUntil,
                    eventDate: gurpurab.eventDate,
                    nanakshahiDate: nanakshahiDate,
                    isDark: theme === 'dark'
                }
            });
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Calendar:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. HUKAMNAMA WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncHukamnama() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var theme = localStorage.getItem('anhad_theme') || 'light';
            var hukamnama = '';
            try { hukamnama = localStorage.getItem('anhad_hukamnama_today') || localStorage.getItem('hukamnama_verse') || ''; } catch(e) {}
            var ang = '';
            try { ang = localStorage.getItem('anhad_hukamnama_ang') || localStorage.getItem('hukamnama_ang') || '੬੮੪'; } catch(e) {}

            if (!hukamnama) {
                hukamnama = 'ਸੋਰਠਿ ਮਹਲਾ ੫ ॥ ਗਏ ਕਲੇਸ ਰੋਗ ਸਭਿ ਨਾਸੇ ਪ੍ਰਭਿ ਅਪੁਨੈ ਕਿਰਪਾ ਧਾਰੀ ॥';
            }

            var today = new Date();
            var dateStr = today.toLocaleDateString('pa-IN', { weekday: 'long', day: 'numeric', month: 'long' });

            await plugin.syncWidgetData({
                widgetType: 'hukamnama',
                data: {
                    preview: hukamnama,
                    ang: ang,
                    date: dateStr,
                    isDark: theme === 'dark'
                }
            });
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Hukamnama:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. GURBANI KHOJ WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncGurbaniKhoj() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var recentSearch = '';
            var recentSearches = [];
            try {
                var history = JSON.parse(localStorage.getItem('gurbani_search_history') || '[]');
                if (history && history.length > 0) {
                    recentSearch = history[0].query || history[0] || '';
                    recentSearches = history.slice(0, 5);
                }
            } catch(e) {}

            await plugin.syncWidgetData({
                widgetType: 'khoj',
                data: {
                    recentSearch: recentSearch,
                    recentSearches: recentSearches,
                    isDark: (localStorage.getItem('anhad_theme') || 'light') === 'dark'
                }
            });
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Gurbani Khoj:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. SANGAT NOTIFICATIONS & FRIEND REQUESTS WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncReminders() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var pendingRequestsCount = 0;
            var unreadNotifsCount = 0;
            var latestAlert = '';

            // 1. Read pending friend requests
            try {
                var requests = JSON.parse(localStorage.getItem('friends_pending_requests') || '[]');
                pendingRequestsCount = Array.isArray(requests) ? requests.length : 0;
                if (pendingRequestsCount > 0 && requests[0]) {
                    latestAlert = (requests[0].senderName || 'Sangat member') + ' sent you a friend request';
                }
            } catch(e) {}

            // 2. Read companion alerts & notifications
            try {
                var notifs = JSON.parse(localStorage.getItem('anhad_notifications') || '[]');
                if (Array.isArray(notifs)) {
                    var unread = notifs.filter(function(n) { return !n.read; });
                    unreadNotifsCount = unread.length;
                    if (!latestAlert && unread.length > 0) {
                        latestAlert = unread[0].title || unread[0].message || '';
                    }
                }
            } catch(e) {}

            // 3. Read streak
            var streak = 0;
            try {
                var streakData = JSON.parse(localStorage.getItem('anhad_streak_data') || '{"current": 0}');
                streak = streakData.current || 0;
            } catch(e) {}

            await plugin.syncWidgetData({
                widgetType: 'reminders',
                data: {
                    pendingRequests: pendingRequestsCount,
                    unreadNotifs: unreadNotifsCount,
                    latestAlert: latestAlert,
                    statusText: pendingRequestsCount > 0 ? (pendingRequestsCount + ' Pending Requests') : 'Sangat Network Active',
                    streak: streak
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Sangat notifications synced');
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Reminders/Notifications:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. AMRITVELA KIRTAN WIDGET DATA (24/7 Celestial Dawn)
    // ═══════════════════════════════════════════════════════════════════
    async function syncAmritvela() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var state = window.AnhadAudio ? window.AnhadAudio.getState() : {};
            var isPlaying = !!state.isPlaying && (state.stream === 'amritvela');

            var streak = 0;
            try {
                var amritLog = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog') || '{}');
                streak = amritLog.streak || amritLog.currentStreak || 0;
            } catch(e) {}
            if (!streak) {
                try {
                    var sData = JSON.parse(localStorage.getItem('anhad_streak_data') || '{}');
                    streak = sData.amritvelaStreak || sData.current || 0;
                } catch(e) {}
            }

            await plugin.syncWidgetData({
                widgetType: 'amritvela',
                data: {
                    trackName: state.trackTitle || 'Amritvela Kirtan',
                    stationName: '24/7 Divine Kirtan • Sachkhand',
                    isPlaying: isPlaying,
                    streak: streak,
                    trackCounter: streak > 0 ? (streak + 'd Amritvela Streak') : 'Amritvela 24/7'
                }
            });
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Amritvela:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. SAADH SANGAT LIVE WIDGET DATA
    // ═══════════════════════════════════════════════════════════════════
    async function syncSaadhSangat() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var isPlaying = false;
            if (window.AnhadAudio) {
                var state = window.AnhadAudio.getState();
                isPlaying = !!state.isPlaying && (state.stream === 'sadhsangat' || (state.streamName && state.streamName.includes('Sangat')));
            }
            var listeners = 1240;
            try {
                var saved = localStorage.getItem('sadhsangat_listeners');
                if (saved) listeners = parseInt(saved, 10);
            } catch(e) {}

            await plugin.syncWidgetData({
                widgetType: 'sadhsangat',
                data: {
                    title: 'Saadh Sangat Live Broadcast',
                    subtitle: 'Live Gurbani Kirtan Samagam',
                    listeners: listeners,
                    isPlaying: isPlaying,
                    isLive: true
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Saadh Sangat synced');
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Saadh Sangat:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 10. SHABAD VICHAR WIDGET DATA (Daily Contemplation)
    // ═══════════════════════════════════════════════════════════════════
    async function syncShabadVichar() {
        var plugin = getPlugin();
        if (!plugin) return;
        try {
            var now = new Date();
            var todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            var savedShabad = null;
            try {
                savedShabad = JSON.parse(localStorage.getItem('shabad_vichar_daily_' + todayKey) || 'null');
            } catch(e) {}

            var gurmukhi = 'ਗੁਰ ਪਰਸਾਦੀ ਵਿਦਿਆ ਵੀਚਾਰੈ ਪਰਉਪਕਾਰੀ ਹੋਵੈ ॥';
            var translation = 'By Guru\'s Grace one contemplates spiritual wisdom, and becomes a benefactor to all.';
            var author = 'ਮਹਲਾ ੧';
            var ang = '12';

            if (savedShabad && savedShabad.verses && savedShabad.verses.length > 0) {
                var firstVerse = savedShabad.verses[0];
                if (firstVerse.verse && firstVerse.verse.gurmukhi) {
                    gurmukhi = firstVerse.verse.gurmukhi;
                }
                if (firstVerse.verse && firstVerse.verse.translation && firstVerse.verse.translation.en) {
                    translation = firstVerse.verse.translation.en;
                }
                if (savedShabad.shabadinfo) {
                    if (savedShabad.shabadinfo.writer) {
                        author = savedShabad.shabadinfo.writer.english || savedShabad.shabadinfo.writer.gurmukhi || author;
                    }
                    if (savedShabad.shabadinfo.pageNo) {
                        ang = String(savedShabad.shabadinfo.pageNo);
                    }
                }
            }

            await plugin.syncWidgetData({
                widgetType: 'shabad_vichar',
                data: {
                    gurmukhi: gurmukhi,
                    translation: translation,
                    author: author,
                    ang: ang
                }
            });
            if (debug) console.log('[AnhadWidgetBridge] Shabad Vichar synced');
        } catch(e) {
            if (debug) console.error('[AnhadWidgetBridge] Error syncing Shabad Vichar:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // SYNC ALL 10 WIDGETS
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
        await syncAmritvela();
        await syncNitnem();
        await syncNaamAbhyas();
        await syncCalendar();
        await syncHukamnama();
        await syncGurbaniKhoj();
        await syncReminders();
        await syncSaadhSangat();
        await syncShabadVichar();
        if (debug) console.log('[AnhadWidgetBridge] All 10 widgets synced successfully');
    }

    // ═══════════════════════════════════════════════════════════════════
    // AUTO-SYNC ON EVENTS
    // ═══════════════════════════════════════════════════════════════════
    function setupAutoSync() {
        if (!isNative()) return;

        // Audio state change
        window.addEventListener('anhadAudioStateChange', function() {
            syncKirtan();
            syncAmritvela();
            syncSaadhSangat();
        });

        // Bani completion
        window.addEventListener('baniCompleted', function() {
            syncNitnem();
        });
        window.addEventListener('alarmResponseRecorded', function() {
            syncNitnem();
            syncReminders();
        });

        // Visibility & App resume
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                syncAllWidgets();
            }
        });

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('appStateChange', function(state) {
                if (state.isActive) syncAllWidgets();
            });
        }

        // Retry until plugin ready
        var syncRetries = 0;
        var syncInterval = setInterval(function() {
            syncRetries++;
            var p = getPlugin();
            if (p) {
                clearInterval(syncInterval);
                syncAllWidgets();
            } else if (syncRetries > 15) {
                clearInterval(syncInterval);
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
        syncAmritvela: syncAmritvela,
        syncNitnem: syncNitnem,
        syncNaamAbhyas: syncNaamAbhyas,
        syncCalendar: syncCalendar,
        syncHukamnama: syncHukamnama,
        syncGurbaniKhoj: syncGurbaniKhoj,
        syncReminders: syncReminders,
        syncSaadhSangat: syncSaadhSangat,
        syncShabadVichar: syncShabadVichar
    };
})();
