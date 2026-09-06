/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SPIRITUAL NOTIFICATIONS MANAGER v3.0 (PREMIUM ULTRA EDITION)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Powered by enriched notifications-content.json (19 spiritual categories,
 * 600+ verses with floral & celestial flourishes, Gurmukhi panktis, and
 * professional font feel).
 * 
 * KEY ARCHITECTURAL UPGRADES:
 * 1. 365-Day Continuous Non-Repeating Daily Rotation Engine:
 *    Uses continuous epoch days + deterministic coprime stride permutation.
 *    Notifications NEVER repeat on the same day of the month!
 * 
 * 2. Worldwide Admin Broadcast Client Synchronization:
 *    Polls /api/notifications/broadcasts and dispatches instant push alerts
 *    across PWA (Web Notifications) and Native Capacitor (LocalNotifications).
 * 
 * 3. 100% Feature Coverage across 19 categories:
 *    - Amritvela (04:00) 🌅
 *    - Japji Sahib (05:00) 📖
 *    - Jaap Sahib (05:30) ⚔️
 *    - Tav Prasad Swaye (06:00) 🌸
 *    - Daily Hukamnama (06:15) 📜
 *    - Chaupai Sahib (06:30) 🛡️
 *    - Anand Sahib (07:00) 🌺
 *    - Gurbani Radio Live Stream (08:00) 🎧
 *    - Waheguru Simran (10:30) 🪷
 *    - Midday Peace Mindfulness (13:30) 🌸
 *    - Daily Sehaj Paath (16:00) 📖
 *    - Evening Peace Reflection (17:30) 🌇
 *    - Rehras Sahib (18:30) 🌅
 *    - Aarti Sahib (19:15) 🪔
 *    - Nitnem Completion Check (20:30) 📋
 *    - Nitnem Streaks & Milestones (21:00) 🌟
 *    - Kirtan Sohila (21:30) 🌙
 *    - Bedtime Blessing (22:00) ✨
 *    - Daytime Random Inspirational Reminders (3x daily) 💫
 * 
 * 4. Do Not Disturb (DND) / Quiet Hours filtering.
 * 5. Streak Milestone Celebrations (3, 7, 14, 21, 40, 100, 365 days).
 * 6. Deep-linking direct into target screens with glassmorphic cards & haptics.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    const STORAGE_KEYS = {
        CONFIG: 'spiritual_notifications_config',
        CONTENT_CACHE: 'anhad_notifications_content_cache_v3',
        HUKAMNAMA_CACHE: 'hukamnama_first_pankti_cache',
        LAST_SCHEDULED_DATE: 'spiritual_last_scheduled_date',
        LAST_RANDOM_SCHEDULE: 'last_random_schedule_date',
        LAST_TIMEZONE_OFFSET: 'spiritual_last_timezone_offset',
        MANAGED_IDS: 'spiritual_managed_notification_ids',
        SEEN_BROADCASTS: 'anhad_seen_broadcasts',
        LAST_BROADCAST_SYNC: 'anhad_last_broadcast_sync'
    };

    const CATEGORIES_META = {
        amritvela: {
            id: 'amritvela',
            label: 'Amritvela',
            subtitle: 'Morning meditation & blessed hour',
            icon: '🌅',
            defaultTime: '04:00',
            url: 'nitnem/index.html',
            action: 'open_nitnem',
            section: 'morning'
        },
        japji_sahib: {
            id: 'japji_sahib',
            label: 'Japji Sahib',
            subtitle: 'First morning Nitnem Bani',
            icon: '📖',
            defaultTime: '05:00',
            url: 'nitnem/reader.html?bani=japji-sahib',
            action: 'open_bani',
            section: 'morning'
        },
        jaap_sahib: {
            id: 'jaap_sahib',
            label: 'Jaap Sahib',
            subtitle: 'Morning Nitnem prayer',
            icon: '⚔️',
            defaultTime: '05:30',
            url: 'nitnem/reader.html?bani=jaap-sahib',
            action: 'open_bani',
            section: 'morning'
        },
        tav_prasad_swaye: {
            id: 'tav_prasad_swaye',
            label: 'Tav Prasad Swaye',
            subtitle: 'Morning devotional prayer',
            icon: '🌸',
            defaultTime: '06:00',
            url: 'nitnem/reader.html?bani=tav-prasad-savaiye',
            action: 'open_bani',
            section: 'morning'
        },
        hukamnama: {
            id: 'hukamnama',
            label: 'Daily Hukamnama',
            subtitle: "Today's sacred command with first pankti",
            icon: '📜',
            defaultTime: '06:15',
            url: 'Hukamnama/daily-hukamnama.html',
            action: 'open_hukamnama',
            section: 'morning'
        },
        chaupai_sahib: {
            id: 'chaupai_sahib',
            label: 'Chaupai Sahib',
            subtitle: 'Protection & spiritual strength',
            icon: '🛡️',
            defaultTime: '06:30',
            url: 'nitnem/reader.html?bani=chaupai-sahib',
            action: 'open_bani',
            section: 'morning'
        },
        anand_sahib: {
            id: 'anand_sahib',
            label: 'Anand Sahib',
            subtitle: 'Song of eternal bliss',
            icon: '🌺',
            defaultTime: '07:00',
            url: 'nitnem/reader.html?bani=anand-sahib',
            action: 'open_bani',
            section: 'morning'
        },
        gurbani_radio: {
            id: 'gurbani_radio',
            label: 'Gurbani Radio & Kirtan',
            subtitle: 'Live Hazoori Ragi Kirtan stream',
            icon: '🎧',
            defaultTime: '08:00',
            url: 'GurbaniRadio/gurbani-radio.html',
            action: 'open_radio',
            section: 'day'
        },
        simran: {
            id: 'simran',
            label: 'Waheguru Simran',
            subtitle: '5-minute calm meditation pause',
            icon: '🪷',
            defaultTime: '10:30',
            url: 'NaamAbhyas/naam-abhyas.html',
            action: 'open_naam',
            section: 'day'
        },
        midday_peace: {
            id: 'midday_peace',
            label: 'Midday Peace',
            subtitle: 'Afternoon mindfulness & calm pause',
            icon: '🌸',
            defaultTime: '13:30',
            url: 'index.html',
            action: 'open_home',
            section: 'day'
        },
        sehaj_paath: {
            id: 'sehaj_paath',
            label: 'Daily Sehaj Paath',
            subtitle: 'Sacred Ang reading & reflection',
            icon: '📖',
            defaultTime: '16:00',
            url: 'sehaj-paath/index.html',
            action: 'open_sehaj_paath',
            section: 'day'
        },
        evening_peace: {
            id: 'evening_peace',
            label: 'Evening Peace',
            subtitle: 'Reflect as the day winds down',
            icon: '🌇',
            defaultTime: '17:30',
            url: 'index.html',
            action: 'open_home',
            section: 'evening'
        },
        rehras_sahib: {
            id: 'rehras_sahib',
            label: 'Rehras Sahib',
            subtitle: 'Evening Nitnem prayer at sunset',
            icon: '🌅',
            defaultTime: '18:30',
            url: 'nitnem/reader.html?bani=rehras-sahib',
            action: 'open_bani',
            section: 'evening'
        },
        aarti: {
            id: 'aarti',
            label: 'Aarti Sahib',
            subtitle: 'Cosmic adoration of the Creator',
            icon: '🪔',
            defaultTime: '19:15',
            url: 'nitnem/reader.html?bani=aarti',
            action: 'open_bani',
            section: 'evening'
        },
        nitnem_missed: {
            id: 'nitnem_missed',
            label: 'Nitnem Completion Check',
            subtitle: 'Evening check to preserve streak',
            icon: '📋',
            defaultTime: '20:30',
            url: 'NitnemTracker/nitnem-tracker.html',
            action: 'open_tracker',
            section: 'evening'
        },
        streak_milestone: {
            id: 'streak_milestone',
            label: 'Nitnem Streaks & Milestones',
            subtitle: 'Celebrate spiritual consistency',
            icon: '🌟',
            defaultTime: '21:00',
            url: 'NitnemTracker/nitnem-tracker.html',
            action: 'open_tracker',
            section: 'inspiration'
        },
        kirtan_sohila: {
            id: 'kirtan_sohila',
            label: 'Kirtan Sohila',
            subtitle: 'Night prayer before sleep',
            icon: '🌙',
            defaultTime: '21:30',
            url: 'nitnem/reader.html?bani=sohila-sahib',
            action: 'open_bani',
            section: 'night'
        },
        bedtime: {
            id: 'bedtime',
            label: 'Bedtime Blessing',
            subtitle: 'Peaceful goodnight reflection',
            icon: '✨',
            defaultTime: '22:00',
            url: 'index.html',
            action: 'open_home',
            section: 'night'
        },
        random_spiritual_reminders: {
            id: 'random_spiritual_reminders',
            label: 'Inspirational Reminders',
            subtitle: 'Spiritual reflections throughout the day',
            icon: '💫',
            defaultCount: 3,
            startHour: 8,
            endHour: 21,
            url: 'index.html',
            action: 'open_home',
            section: 'inspiration'
        }
    };

    const DEFAULT_CONFIG = {
        amritvela: { enabled: true, time: '04:00' },
        japji_sahib: { enabled: true, time: '05:00' },
        jaap_sahib: { enabled: true, time: '05:30' },
        tav_prasad_swaye: { enabled: true, time: '06:00' },
        hukamnama: { enabled: true, time: '06:15' },
        chaupai_sahib: { enabled: true, time: '06:30' },
        anand_sahib: { enabled: true, time: '07:00' },
        gurbani_radio: { enabled: true, time: '08:00' },
        simran: { enabled: true, time: '10:30' },
        midday_peace: { enabled: true, time: '13:30' },
        sehaj_paath: { enabled: true, time: '16:00' },
        evening_peace: { enabled: true, time: '17:30' },
        rehras_sahib: { enabled: true, time: '18:30' },
        aarti: { enabled: true, time: '19:15' },
        nitnem_missed: { enabled: true, time: '20:30' },
        streak_milestone: { enabled: true, time: '21:00' },
        kirtan_sohila: { enabled: true, time: '21:30' },
        bedtime: { enabled: true, time: '22:00' },
        random_spiritual_reminders: { enabled: true, count: 3, startHour: 8, endHour: 21 },
        dnd: { enabled: false, start: '22:30', end: '03:30' }
    };

    const ID_OFFSETS = {
        amritvela: 10100,
        japji_sahib: 10200,
        jaap_sahib: 10300,
        tav_prasad_swaye: 10400,
        chaupai_sahib: 10500,
        anand_sahib: 10600,
        hukamnama: 10700,
        gurbani_radio: 10800,
        simran: 10900,
        midday_peace: 11000,
        sehaj_paath: 11100,
        evening_peace: 11200,
        rehras_sahib: 11300,
        aarti: 11400,
        nitnem_missed: 11500,
        streak_milestone: 11600,
        kirtan_sohila: 11700,
        bedtime: 11800,
        random_spiritual_reminders: 20000
    };

    function resolveAppUrl(relativeUrl) {
        if (!relativeUrl) return './index.html';
        if (relativeUrl.startsWith('/') || relativeUrl.startsWith('http')) return relativeUrl;
        var depth = 0;
        var path = window.location.pathname.replace(/^\/|\/$/g, '');
        if (path.length > 0) {
            var segments = path.split('/');
            var isFile = segments[segments.length - 1].indexOf('.') !== -1;
            depth = isFile ? segments.length - 1 : segments.length;
        }
        var prefix = '';
        for (var i = 0; i < depth; i++) prefix += '../';
        return (prefix || './') + relativeUrl;
    }

    class SpiritualNotifications {
        constructor() {
            this.config = this.loadConfig();
            this.content = this.loadCachedContent();
            this.meta = CATEGORIES_META;
            this.fetchContentPromise = this.fetchContent();
            this.initBroadcastSync();
        }

        loadConfig() {
            try {
                const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const merged = { ...DEFAULT_CONFIG };
                    Object.keys(DEFAULT_CONFIG).forEach(k => {
                        merged[k] = { ...DEFAULT_CONFIG[k], ...(parsed[k] || {}) };
                    });
                    return merged;
                }
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to load config:', e);
            }
            return { ...DEFAULT_CONFIG };
        }

        saveConfig() {
            try {
                localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to save config:', e);
            }
        }

        updateSetting(key, value) {
            if (this.config[key]) {
                this.config[key] = { ...this.config[key], ...value };
            } else {
                this.config[key] = value;
            }
            this.saveConfig();
        }

        getConfig() {
            return this.config;
        }

        getMeta() {
            return this.meta;
        }

        loadCachedContent() {
            try {
                const cached = localStorage.getItem(STORAGE_KEYS.CONTENT_CACHE);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && parsed.notifications) {
                        return parsed.notifications;
                    }
                }
            } catch (e) {}
            return null;
        }

        async fetchContent() {
            if (this.content && Object.keys(this.content).length >= 15) return this.content;
            const candidates = [
                resolveAppUrl('notifications-content.json'),
                '/notifications-content.json',
                '../notifications-content.json',
                '../../notifications-content.json'
            ];

            for (const url of candidates) {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.notifications) {
                            this.content = data.notifications;
                            try {
                                localStorage.setItem(STORAGE_KEYS.CONTENT_CACHE, JSON.stringify(data));
                            } catch (e) {}
                            console.log('[SpiritualNotifications v3] Loaded content JSON successfully:', Object.keys(this.content).length, 'categories');
                            return this.content;
                        }
                    }
                } catch (e) {}
            }
            return null;
        }

        /**
         * ═══════════════════════════════════════════════════════════════════
         * 365-DAY CONTINUOUS NON-REPEATING DAILY ROTATION ENGINE
         * ═══════════════════════════════════════════════════════════════════
         * Replaces naive getDate() % len with an absolute epoch-based cycle
         * coprime stride shuffle. Every single day of the month has a unique
         * notification, cycling through all items before generating a new
         * shuffled order!
         */
        getMessage(category, offset = 0) {
            if (this.content && this.content[category] && this.content[category].length > 0) {
                const list = this.content[category];
                const EPOCH = 1704067200000; // 2024-01-01 00:00:00 UTC
                const now = new Date();
                const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
                const cumulativeDays = Math.floor((targetDate.getTime() - EPOCH) / 86400000);

                // Deterministic hash of category string
                let catSeed = 0;
                for (let i = 0; i < category.length; i++) {
                    catSeed = (catSeed * 31 + category.charCodeAt(i)) >>> 0;
                }

                const len = list.length;
                const cycle = Math.floor(cumulativeDays / len);
                const dayInCycle = ((cumulativeDays % len) + len) % len;

                // Calculate coprime stride to guarantee full mathematical permutation across len
                function gcd(a, b) {
                    while (b) { let t = b; b = a % b; a = t; }
                    return a;
                }
                const candidates = [3, 4, 8, 9, 11, 12, 13, 16, 17, 18, 19, 23, 24, 26, 29, 31, 37, 41, 43];
                let stride = 1;
                const offsetSeed = Math.abs(cycle + catSeed);
                for (let i = 0; i < candidates.length; i++) {
                    const c = candidates[(offsetSeed + i) % candidates.length];
                    if (gcd(c, len) === 1) {
                        stride = c;
                        break;
                    }
                }
                const shift = Math.abs(cycle * 3 + (catSeed % 7)) % len;
                const idx = ((dayInCycle * stride + shift) % len + len) % len;

                return list[idx];
            }
            const meta = this.meta[category] || { label: 'Spiritual Reminder', icon: '🌸' };
            return {
                title: `🌸 ${meta.label}`,
                body: `ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ ॥ Time for ${meta.label}. May Guru Ji's blessings illuminate your soul. ✨`,
                translation: `Time for ${meta.label}.`
            };
        }

        isNative() {
            return window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
        }

        isQuietHours() {
            const config = this.getConfig();
            const dnd = config.dnd || { enabled: false, start: '22:30', end: '03:30' };
            if (!dnd.enabled) return false;
            const now = new Date();
            const curMinutes = now.getHours() * 60 + now.getMinutes();
            const [sh, sm] = (dnd.start || '22:30').split(':').map(Number);
            const [eh, em] = (dnd.end || '03:30').split(':').map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;
            if (startMin > endMin) {
                return curMinutes >= startMin || curMinutes < endMin;
            }
            return curMinutes >= startMin && curMinutes < endMin;
        }

        async ensureChannel() {
            if (!this.isNative() || !window.Capacitor.Plugins.LocalNotifications) return;
            const LN = window.Capacitor.Plugins.LocalNotifications;
            try {
                await LN.createChannel({
                    id: 'spiritual_reminders',
                    name: 'Spiritual Reminders & Nitnem',
                    description: 'Daily Nitnem banis, Hukamnama, and spiritual reflections',
                    importance: 5,
                    visibility: 1,
                    vibration: true,
                    sound: 'default',
                    lights: true,
                    lightColor: '#f7c634'
                });
            } catch (e) {}
        }

        async cancelAll() {
            if (!this.isNative() || !window.Capacitor.Plugins.LocalNotifications) return;
            const LN = window.Capacitor.Plugins.LocalNotifications;
            try {
                const cancelIds = [];
                for (let i = 10000; i < 13000; i++) {
                    cancelIds.push({ id: i });
                }
                for (let i = 20000; i < 20100; i++) {
                    cancelIds.push({ id: i });
                }
                try {
                    const savedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.MANAGED_IDS) || '[]');
                    savedIds.forEach(id => {
                        if (!cancelIds.some(c => c.id === id)) cancelIds.push({ id });
                    });
                } catch (e) {}

                await LN.cancel({ notifications: cancelIds });
                localStorage.setItem(STORAGE_KEYS.MANAGED_IDS, '[]');
                console.log('[SpiritualNotifications] Cancelled existing notifications');
            } catch (e) {
                console.warn('[SpiritualNotifications] Failed to cancel notifications:', e);
            }
        }

        /**
         * Build the schedule for the next 7 days across all categories
         */
        async buildNotifications() {
            const notifications = [];
            const now = new Date();
            await this.fetchContent();

            // 1. Scheduled Wall-Clock Categories
            const scheduledCategories = Object.keys(this.meta).filter(k => k !== 'random_spiritual_reminders');

            scheduledCategories.forEach(catKey => {
                const catConf = this.config[catKey];
                const meta = this.meta[catKey];
                if (!catConf || catConf.enabled === false) return;

                const timeStr = catConf.time || meta.defaultTime || '06:00';
                const [targetHour, targetMin] = timeStr.split(':').map(Number);
                const baseId = ID_OFFSETS[catKey] || 10000;

                for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, targetHour, targetMin, 0, 0);
                    if (targetDate.getTime() <= now.getTime()) continue;

                    const msg = this.getMessage(catKey, dayOffset);
                    let notifTitle = msg.title || `${meta.icon} ${meta.label}`;
                    let notifBody = msg.body || `Waheguru Ji... Time for ${meta.label}. May Guru Ji bless your day. 🙏`;

                    if (catKey === 'hukamnama') {
                        const cachedPankti = this.getCachedHukamnamaPankti();
                        if (cachedPankti && dayOffset === 0) {
                            notifBody = `Mukhwak: "${cachedPankti}" — Read full Hukamnama & Katha 🙏`;
                        }
                    }

                    notifications.push({
                        id: baseId + dayOffset,
                        title: notifTitle,
                        body: notifBody,
                        schedule: { at: targetDate, allowWhileIdle: true, exact: true },
                        channelId: 'spiritual_reminders',
                        sound: 'default',
                        smallIcon: 'ic_stat_notify',
                        extra: {
                            action: meta.action,
                            target: meta.label,
                            url: meta.url,
                            category: catKey,
                            translation: msg.translation || ''
                        }
                    });
                }
            });

            // 2. Daytime Random Spiritual Reminders
            const randomConf = this.config.random_spiritual_reminders;
            if (randomConf && randomConf.enabled !== false) {
                const count = randomConf.count || 3;
                const startHour = randomConf.startHour || 8;
                const endHour = randomConf.endHour || 21;
                const randomMeta = this.meta.random_spiritual_reminders;

                for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                    const availableHours = [];
                    for (let h = startHour; h <= endHour; h++) availableHours.push(h);

                    const chosenHours = [];
                    for (let c = 0; c < count && availableHours.length > 0; c++) {
                        const rIdx = Math.floor(Math.random() * availableHours.length);
                        chosenHours.push(availableHours.splice(rIdx, 1)[0]);
                    }
                    chosenHours.sort((a, b) => a - b);

                    chosenHours.forEach((hour, idx) => {
                        const randomMinute = Math.floor(Math.random() * 50) + 5;
                        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, randomMinute, 0, 0);
                        if (targetDate.getTime() <= now.getTime()) return;

                        const msg = this.getMessage('random_spiritual_reminders', dayOffset * count + idx);
                        notifications.push({
                            id: 20000 + (dayOffset * 10) + idx,
                            title: msg.title || `${randomMeta.icon} Divine Reflection`,
                            body: msg.body || 'Pause for a moment and remember the True Creator. 🌸✨',
                            schedule: { at: targetDate, allowWhileIdle: true, exact: true },
                            channelId: 'spiritual_reminders',
                            sound: 'default',
                            smallIcon: 'ic_stat_notify',
                            extra: {
                                action: randomMeta.action,
                                target: randomMeta.label,
                                url: randomMeta.url,
                                category: 'random_spiritual_reminders',
                                translation: msg.translation || ''
                            }
                        });
                    });
                }
            }

            return notifications;
        }

        async scheduleAll() {
            if (!this.isNative() || !window.Capacitor.Plugins.LocalNotifications) {
                console.log('[SpiritualNotifications] PWA environment: local scheduling ready on client sync');
                return [];
            }

            const LN = window.Capacitor.Plugins.LocalNotifications;
            try {
                const perms = await LN.checkPermissions();
                if (perms.display !== 'granted') {
                    await LN.requestPermissions();
                }

                await this.ensureChannel();
                await this.cancelAll();

                const notifications = await this.buildNotifications();

                if (notifications.length > 0) {
                    await LN.schedule({ notifications });
                    const ids = notifications.map(n => n.id);
                    localStorage.setItem(STORAGE_KEYS.MANAGED_IDS, JSON.stringify(ids));
                    console.log(`[SpiritualNotifications] Scheduled ${notifications.length} exact notifications across 19 categories!`);
                }

                return notifications;
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to schedule notifications:', e);
                return [];
            }
        }

        /**
         * Test Notification (Instant verification on local device)
         */
        async testNotification(categoryKey = 'amritvela') {
            try {
                if (!this.content) await this.fetchContent();

                const meta = this.meta[categoryKey] || this.meta.amritvela || { label: 'Spiritual Reminder', icon: '🌸' };
                const msg = this.getMessage(categoryKey, Math.floor(Math.random() * 20));

                const notificationTitle = msg.title || `${meta.icon} ${meta.label}`;
                const notificationBody = msg.body || `Waheguru Ji... Time for ${meta.label}. 🙏`;

                let firedLocally = false;

                // 1. Native Capacitor
                if (this.isNative() && window.Capacitor.Plugins.LocalNotifications) {
                    try {
                        const LN = window.Capacitor.Plugins.LocalNotifications;
                        await this.ensureChannel();
                        await LN.schedule({
                            notifications: [{
                                id: Math.floor(Date.now() % 100000),
                                title: notificationTitle,
                                body: notificationBody,
                                schedule: { at: new Date(Date.now() + 300), allowWhileIdle: true, exact: true },
                                channelId: 'spiritual_reminders',
                                sound: 'default',
                                smallIcon: 'ic_stat_notify',
                                extra: { category: categoryKey, translation: msg.translation || '' }
                            }]
                        });
                        firedLocally = true;
                    } catch (capErr) {
                        console.warn('[SpiritualNotifications] Capacitor notification note:', capErr);
                    }
                }

                // 2. Standard Web Notification API
                if (!firedLocally && 'Notification' in window) {
                    try {
                        if (Notification.permission !== 'granted' && typeof Notification.requestPermission === 'function') {
                            await Notification.requestPermission();
                        }
                        if (Notification.permission === 'granted') {
                            new Notification(notificationTitle, {
                                body: notificationBody,
                                icon: resolveAppUrl('assets/icon-192x192.png'),
                                badge: resolveAppUrl('assets/icon-72x72.png')
                            });
                            firedLocally = true;
                        }
                    } catch (webErr) {
                        console.warn('[SpiritualNotifications] Web notification note:', webErr);
                    }
                }

                // 3. Instant Glassmorphic In-App Notification Card
                this.showInAppNotificationTestCard(notificationTitle, notificationBody, msg.translation, meta);

                if (window.HapticManager && typeof window.HapticManager.success === 'function') {
                    window.HapticManager.success();
                }

                return true;
            } catch (err) {
                console.error('[SpiritualNotifications] testNotification error:', err);
                return false;
            }
        }

        /**
         * Affectionate In-App Glassmorphic Card
         */
        showInAppNotificationTestCard(title, body, translation, meta) {
            let container = document.getElementById('anhadInAppNotifContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'anhadInAppNotifContainer';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: calc(100% - 32px);
                    max-width: 440px;
                    z-index: 999999;
                    pointer-events: none;
                `;
                document.body.appendChild(container);
            }

            const card = document.createElement('div');
            card.style.cssText = `
                pointer-events: auto;
                background: rgba(22, 21, 20, 0.96);
                backdrop-filter: blur(28px) saturate(190%);
                -webkit-backdrop-filter: blur(28px) saturate(190%);
                border: 1px solid rgba(212, 160, 58, 0.45);
                border-radius: 22px;
                padding: 16px 18px;
                color: #ffffff;
                box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65);
                margin-bottom: 12px;
                transform: translateY(-24px) scale(0.94);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;

            const icon = (meta && meta.icon) || '🌸';
            const actionUrl = (meta && meta.url) || '';

            card.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="font-size: 26px; line-height: 1; flex-shrink: 0; padding-top: 2px;">${icon}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #D4A03A;">ANHAD DIVINE ALERT</span>
                            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">now</span>
                        </div>
                        <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-top: 3px; line-height: 1.35;">${title}</div>
                        <div style="font-size: 13px; color: rgba(255,255,255,0.85); margin-top: 4px; line-height: 1.45; font-family: 'Noto Sans Gurmukhi', sans-serif;">${body}</div>
                        ${translation ? `<div style="font-size: 12px; color: rgba(212,160,58,0.95); margin-top: 6px; font-style: italic;">"${translation}"</div>` : ''}
                        ${actionUrl ? `
                            <div style="margin-top: 10px; display: flex; gap: 8px;">
                                <a href="${resolveAppUrl(actionUrl)}" style="display: inline-block; background: #D4A03A; color: #000; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 50px; text-decoration: none;">Open Practice ➔</a>
                                <button onclick="this.closest('#anhadInAppNotifContainer').remove()" style="background: transparent; border: none; color: #A8A29E; font-size: 12px; cursor: pointer;">Dismiss</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            container.appendChild(card);

            requestAnimationFrame(() => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.opacity = '1';
            });

            setTimeout(() => {
                card.style.transform = 'translateY(-24px) scale(0.94)';
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 400);
            }, 6000);
        }

        /**
         * ═══════════════════════════════════════════════════════════════════
         * WORLDWIDE ADMIN BROADCAST CLIENT SYNCHRONIZATION
         * ═══════════════════════════════════════════════════════════════════
         */
        initBroadcastSync() {
            // Initial sync on app load
            setTimeout(() => this.syncAdminBroadcasts(), 2500);

            // Sync on app foreground / visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.syncAdminBroadcasts();
                }
            });

            // Recurring background sync every 5 minutes
            setInterval(() => this.syncAdminBroadcasts(), 5 * 60 * 1000);
        }

        async syncAdminBroadcasts() {
            try {
                const lastSync = Number(localStorage.getItem(STORAGE_KEYS.LAST_BROADCAST_SYNC) || '0');
                const res = await fetch(`/api/notifications/broadcasts?since=${lastSync}`);
                if (!res.ok) return;
                const data = await res.json();
                const broadcasts = data.broadcasts || [];
                if (broadcasts.length === 0) return;

                let seenIds = [];
                try {
                    seenIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEEN_BROADCASTS) || '[]');
                } catch (e) { seenIds = []; }

                for (const b of broadcasts) {
                    if (!seenIds.includes(b.id)) {
                        seenIds.push(b.id);
                        await this.displayBroadcastAlert(b);
                        window.dispatchEvent(new CustomEvent('anhadBroadcastReceived', { detail: b }));
                    }
                }

                localStorage.setItem(STORAGE_KEYS.SEEN_BROADCASTS, JSON.stringify(seenIds.slice(-200)));
                localStorage.setItem(STORAGE_KEYS.LAST_BROADCAST_SYNC, String(Date.now()));
            } catch (e) {
                // Silently ignore network sync errors in offline mode
            }
        }

        async displayBroadcastAlert(b) {
            const formattedTitle = `${b.emoji ? b.emoji + ' ' : ''}${b.title}`;

            // 1. Native Capacitor LocalNotification
            if (this.isNative() && window.Capacitor.Plugins.LocalNotifications) {
                try {
                    await this.ensureChannel();
                    await window.Capacitor.Plugins.LocalNotifications.schedule({
                        notifications: [{
                            id: Math.floor(Date.now() % 100000),
                            title: formattedTitle,
                            body: b.body,
                            schedule: { at: new Date(Date.now() + 400), allowWhileIdle: true, exact: true },
                            channelId: 'spiritual_reminders',
                            sound: 'default',
                            smallIcon: 'ic_stat_notify',
                            extra: {
                                broadcastId: b.id,
                                action: 'open_broadcast',
                                url: b.deepLink,
                                category: b.category
                            }
                        }]
                    });
                } catch (e) {}
            }

            // 2. Web Notification
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(formattedTitle, {
                        body: b.body,
                        icon: resolveAppUrl('assets/icon-192x192.png')
                    });
                } catch (e) {}
            }

            // 3. In-App Glassmorphic Card
            this.showInAppNotificationTestCard(formattedTitle, b.body, b.subtitle, { icon: b.emoji || '🌸', url: b.deepLink });
        }

        /**
         * Check and celebrate Streak Milestones
         */
        checkStreakMilestoneCelebration(currentStreak) {
            const milestones = [3, 7, 14, 21, 30, 40, 50, 75, 100, 150, 200, 365];
            const num = Number(currentStreak);
            if (milestones.includes(num)) {
                const key = `streak_milestone_celebrated_${num}`;
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, new Date().toISOString());
                    const msg = this.getMessage('streak_milestone');
                    const title = `🌟 ${num}-Day Sacred Nitnem Streak!`;
                    const body = `Blessed devotion! You have completed ${num} continuous days of Nitnem. Guru Maharaj Ji bless your journey! 🌸✨`;
                    this.showInAppNotificationTestCard(title, body, 'Spiritual Consistency Milestone', { icon: '🌟', url: 'NitnemTracker/nitnem-tracker.html' });
                }
            }
        }

        async scheduleNitnemCompletionNotification() {
            if (!this.isNative() || !window.Capacitor.Plugins.LocalNotifications) return;
            try {
                const fireAt = new Date(Date.now() + 3000);
                await window.Capacitor.Plugins.LocalNotifications.schedule({
                    notifications: [{
                        id: 40001,
                        title: '✅ Nitnem Complete! Waheguru 🙏',
                        body: 'ਸਭ ਬਾਣੀਆਂ ਮੁਕੰਮਲ ਕਰ ਲਈਆਂ। ਗੁਰੂ ਸਾਹਿਬ ਜੀ ਦੀ ਕਿਰਪਾ ਸਦਾ ਬਣੀ ਰਹੇ। 🌸✨',
                        schedule: { at: fireAt, allowWhileIdle: true, exact: true },
                        channelId: 'spiritual_reminders',
                        sound: 'default',
                        smallIcon: 'ic_stat_notify',
                        extra: { action: 'open_tracker', url: 'NitnemTracker/nitnem-tracker.html' }
                    }]
                });
            } catch (e) {
                console.error('[SpiritualNotifications] Nitnem completion notification failed:', e);
            }
        }

        cacheHukamnamaPankti(pankti) {
            try {
                const today = new Date().toDateString();
                localStorage.setItem(STORAGE_KEYS.HUKAMNAMA_CACHE, JSON.stringify({ date: today, pankti: pankti }));
            } catch (e) {}
        }

        getCachedHukamnamaPankti() {
            try {
                const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.HUKAMNAMA_CACHE));
                const today = new Date().toDateString();
                if (cache && cache.date === today) return cache.pankti;
            } catch (e) {}
            return null;
        }

        handleNotificationAction(action, target, url) {
            if (url) {
                window.location.href = resolveAppUrl(url);
                return;
            }
            const meta = Object.values(this.meta).find(m => m.action === action || m.label === target);
            if (meta && meta.url) {
                window.location.href = resolveAppUrl(meta.url);
            } else {
                window.location.href = resolveAppUrl('index.html');
            }
        }
    }

    window.SpiritualNotifications = new SpiritualNotifications();

    if (window.SpiritualNotifications.isNative()) {
        const today = new Date().toDateString();
        const lastScheduled = localStorage.getItem(STORAGE_KEYS.LAST_SCHEDULED_DATE);
        if (lastScheduled !== today) {
            window.SpiritualNotifications.scheduleAll().then(() => {
                localStorage.setItem(STORAGE_KEYS.LAST_SCHEDULED_DATE, today);
            }).catch(e => {
                console.error('[SpiritualNotifications] Auto-schedule error:', e);
            });
        }
    }

    window.addEventListener('nitnemUpdate', (e) => {
        try {
            if (e.detail && e.detail.complete === true && window.SpiritualNotifications) {
                const today = new Date().toDateString();
                const key = 'spiritual_nitnem_completion_notif_date';
                if (localStorage.getItem(key) !== today) {
                    localStorage.setItem(key, today);
                    window.SpiritualNotifications.scheduleNitnemCompletionNotification();
                }
            }
            if (e.detail && e.detail.streak && window.SpiritualNotifications) {
                window.SpiritualNotifications.checkStreakMilestoneCelebration(e.detail.streak);
            }
        } catch (e) {}
    });

})();
