/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SPIRITUAL NOTIFICATIONS MANAGER v2.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Powered by notifications-content.json (2,600+ lines of spiritual content)
 * Supports all 15 categories scheduled by exact wall-clock times:
 * 
 * 🌅 MORNING PRAYERS & NITNEM:
 * - Amritvela (04:00)
 * - Japji Sahib (05:00)
 * - Jaap Sahib (05:30)
 * - Tav Prasad Swaye (06:00)
 * - Chaupai Sahib (06:30)
 * - Anand Sahib (07:00)
 * - Daily Hukamnama (06:15)
 * 
 * 🎧 DAYTIME INSPIRATION:
 * - Gurbani Radio / Kirtan (08:00)
 * - Waheguru Simran (10:30)
 * - Random Inspirational Reminders (3x daily between 8 AM - 9 PM)
 * 
 * 🌇 EVENING & NIGHT PRAYERS:
 * - Evening Peace (17:30)
 * - Rehras Sahib (18:30)
 * - Nitnem Completion Check (20:30)
 * - Kirtan Sohila (21:30)
 * - Bedtime Blessing (22:00)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    const STORAGE_KEYS = {
        CONFIG: 'spiritual_notifications_config',
        CONTENT_CACHE: 'anhad_notifications_content_cache',
        HUKAMNAMA_CACHE: 'hukamnama_first_pankti_cache',
        LAST_SCHEDULED_DATE: 'spiritual_last_scheduled_date',
        LAST_RANDOM_SCHEDULE: 'last_random_schedule_date',
        LAST_TIMEZONE_OFFSET: 'spiritual_last_timezone_offset',
        MANAGED_IDS: 'spiritual_managed_notification_ids'
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
        chaupai_sahib: { enabled: true, time: '06:30' },
        anand_sahib: { enabled: true, time: '07:00' },
        hukamnama: { enabled: true, time: '06:15' },
        gurbani_radio: { enabled: true, time: '08:00' },
        simran: { enabled: true, time: '10:30' },
        evening_peace: { enabled: true, time: '17:30' },
        rehras_sahib: { enabled: true, time: '18:30' },
        nitnem_missed: { enabled: true, time: '20:30' },
        kirtan_sohila: { enabled: true, time: '21:30' },
        bedtime: { enabled: true, time: '22:00' },
        random_spiritual_reminders: { enabled: true, count: 3, startHour: 8, endHour: 21 }
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
        evening_peace: 11000,
        rehras_sahib: 11100,
        nitnem_missed: 11200,
        kirtan_sohila: 11300,
        bedtime: 11400,
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
            if (this.content) return this.content;
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
                            console.log('[SpiritualNotifications] Loaded notifications content JSON successfully:', Object.keys(this.content).length, 'categories');
                            return this.content;
                        }
                    }
                } catch (e) {}
            }
            return null;
        }

        getMessage(category, offset = 0) {
            if (this.content && this.content[category] && this.content[category].length > 0) {
                const list = this.content[category];
                const idx = (offset + new Date().getDate()) % list.length;
                return list[idx];
            }
            const meta = this.meta[category] || { label: 'Spiritual Reminder', icon: '🙏' };
            return {
                title: `${meta.icon} ${meta.label}`,
                body: `Waheguru Ji... Time for ${meta.label}. May Guru Ji bless your day. 🙏`,
                translation: `Time for ${meta.label}.`
            };
        }

        isNative() {
            return window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
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
                for (let i = 10000; i < 12000; i++) {
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

        async buildNotifications() {
            await this.fetchContentPromise;
            const notifications = [];
            const now = new Date();

            const fixedCategories = [
                'amritvela',
                'japji_sahib',
                'jaap_sahib',
                'tav_prasad_swaye',
                'chaupai_sahib',
                'anand_sahib',
                'hukamnama',
                'gurbani_radio',
                'simran',
                'evening_peace',
                'rehras_sahib',
                'nitnem_missed',
                'kirtan_sohila',
                'bedtime'
            ];

            for (const catKey of fixedCategories) {
                const conf = this.config[catKey];
                const meta = this.meta[catKey];
                if (!conf || !conf.enabled || !meta) continue;

                const timeStr = conf.time || meta.defaultTime || '06:00';
                const [hh, mm] = timeStr.split(':').map(Number);
                const baseId = ID_OFFSETS[catKey] || 10000;

                for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                    const schedTime = new Date(now);
                    schedTime.setDate(schedTime.getDate() + dayOffset);
                    schedTime.setHours(hh, mm, 0, 0);

                    if (schedTime <= now) continue;

                    const notifId = baseId + dayOffset;
                    const msg = this.getMessage(catKey, dayOffset);

                    let bodyText = msg.body;
                    if (catKey === 'hukamnama') {
                        const cachedPankti = this.getCachedHukamnamaPankti();
                        if (cachedPankti && dayOffset === 0) {
                            bodyText = `"${cachedPankti}" — Tap to read full Hukamnama Sahib. 🙏`;
                        }
                    }

                    notifications.push({
                        id: notifId,
                        title: msg.title || `${meta.icon} ${meta.label}`,
                        body: bodyText,
                        schedule: { at: schedTime, allowWhileIdle: true, exact: true },
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
            }

            const randomConf = this.config.random_spiritual_reminders || this.config.random || { enabled: true, count: 3, startHour: 8, endHour: 21 };
            if (randomConf.enabled !== false) {
                const count = randomConf.count || 3;
                const startH = randomConf.startHour || 8;
                const endH = randomConf.endHour || 21;
                const randomMeta = this.meta.random_spiritual_reminders;
                const baseId = ID_OFFSETS.random_spiritual_reminders || 20000;

                for (let d = 0; d < 3; d++) {
                    for (let i = 0; i < count; i++) {
                        const schedDate = new Date(now);
                        schedDate.setDate(schedDate.getDate() + d);
                        
                        const hourSlot = startH + Math.floor((i * (endH - startH)) / count) + Math.floor(Math.random() * 2);
                        const finalHour = Math.min(Math.max(hourSlot, startH), endH);
                        const minute = Math.floor(Math.random() * 60);
                        schedDate.setHours(finalHour, minute, 0, 0);

                        if (schedDate <= now) continue;

                        const notifId = baseId + (d * 10) + i;
                        const msg = this.getMessage('random_spiritual_reminders', (d * count) + i);

                        notifications.push({
                            id: notifId,
                            title: msg.title || '💫 Spiritual Reflection',
                            body: msg.body,
                            schedule: { at: schedDate, allowWhileIdle: true, exact: true },
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
                    }
                }
            }

            return notifications;
        }

        async scheduleAll() {
            if (!this.isNative() || !window.Capacitor.Plugins.LocalNotifications) {
                console.log('[SpiritualNotifications] Not in native environment or LocalNotifications not available');
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
                    console.log(`[SpiritualNotifications] Successfully scheduled ${notifications.length} exact notifications across all categories!`);
                }

                return notifications;
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to schedule notifications:', e);
                return [];
            }
        }

        async testNotification(categoryKey = 'amritvela') {
            try {
                if (!this.content) {
                    await this.fetchContent();
                }

                const meta = this.meta[categoryKey] || this.meta.amritvela || { label: 'Spiritual Reminder', icon: '🔔' };
                
                // Pick a random message from the 2,600+ line notifications-content.json for this topic
                let msg;
                if (this.content && this.content[categoryKey] && this.content[categoryKey].length > 0) {
                    const list = this.content[categoryKey];
                    const randomIndex = Math.floor(Math.random() * list.length);
                    msg = list[randomIndex];
                } else {
                    msg = this.getMessage(categoryKey, Math.floor(Math.random() * 20));
                }

                const notificationTitle = msg.title || `${meta.icon} ${meta.label}`;
                const notificationBody = msg.body || `Waheguru Ji... Time for ${meta.label}. 🙏`;

                let firedLocally = false;

                // 1. Native Capacitor LocalNotification
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
                    try {
                        const LN = window.Capacitor.Plugins.LocalNotifications;
                        await this.ensureChannel();
                        const permStatus = await LN.checkPermissions();
                        if (permStatus.display !== 'granted') {
                            await LN.requestPermissions();
                        }
                        await LN.schedule({
                            notifications: [{
                                id: Math.floor(Date.now() % 100000),
                                title: notificationTitle,
                                body: notificationBody,
                                schedule: { at: new Date(Date.now() + 300), allowWhileIdle: true, exact: true },
                                channelId: 'spiritual_reminders',
                                sound: 'default',
                                smallIcon: 'ic_stat_notify',
                                extra: {
                                    category: categoryKey,
                                    translation: msg.translation || ''
                                }
                            }]
                        });
                        firedLocally = true;
                    } catch (capErr) {
                        console.warn('[SpiritualNotifications] Capacitor notification error:', capErr);
                    }
                }

                // 2. Standard Web Notification API
                if (!firedLocally && 'Notification' in window) {
                    try {
                        if (Notification.permission !== 'granted' && typeof Notification.requestPermission === 'function') {
                            await Notification.requestPermission();
                        }
                        if (Notification.permission === 'granted') {
                            try {
                                new Notification(notificationTitle, {
                                    body: notificationBody,
                                    icon: resolveAppUrl('assets/icon-192x192.png'),
                                    badge: resolveAppUrl('assets/icon-72x72.png')
                                });
                                firedLocally = true;
                            } catch (notifConstructErr) {
                                if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                                    const reg = await navigator.serviceWorker.ready;
                                    reg.showNotification(notificationTitle, {
                                        body: notificationBody,
                                        icon: resolveAppUrl('assets/icon-192x192.png')
                                    });
                                    firedLocally = true;
                                }
                            }
                        }
                    } catch (webErr) {
                        console.warn('[SpiritualNotifications] Web notification error:', webErr);
                    }
                }

                // 3. Instant Glassmorphic In-App Notification Card + Sound + Haptic Feedback
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

        showInAppNotificationTestCard(title, body, translation, meta) {
            let container = document.getElementById('anhadInAppNotifContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'anhadInAppNotifContainer';
                container.style.cssText = `
                    position: fixed;
                    top: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: calc(100% - 32px);
                    max-width: 420px;
                    z-index: 999999;
                    pointer-events: none;
                `;
                document.body.appendChild(container);
            }

            const card = document.createElement('div');
            card.style.cssText = `
                pointer-events: auto;
                background: rgba(28, 28, 30, 0.96);
                backdrop-filter: blur(25px) saturate(180%);
                -webkit-backdrop-filter: blur(25px) saturate(180%);
                border: 1px solid rgba(212, 148, 58, 0.4);
                border-radius: 20px;
                padding: 16px 18px;
                color: #ffffff;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
                margin-bottom: 12px;
                transform: translateY(-20px) scale(0.95);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;

            card.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="font-size: 24px; line-height: 1; flex-shrink: 0; padding-top: 2px;">${meta.icon || '🔔'}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #D4943A;">TEST NOTIFICATION</span>
                            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">now</span>
                        </div>
                        <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-top: 2px; line-height: 1.3;">${title}</div>
                        <div style="font-size: 13px; color: rgba(255,255,255,0.85); margin-top: 4px; line-height: 1.4;">${body}</div>
                        ${translation ? `<div style="font-size: 12px; color: rgba(212,148,58,0.9); margin-top: 6px; font-style: italic;">"${translation}"</div>` : ''}
                    </div>
                </div>
            `;

            container.appendChild(card);

            requestAnimationFrame(() => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.opacity = '1';
            });

            setTimeout(() => {
                card.style.transform = 'translateY(-20px) scale(0.95)';
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 400);
            }, 5000);
        }

        async scheduleNitnemCompletionNotification() {
            if (!this.isNative() || !window.Capacitor.Plugins.LocalNotifications) return;
            try {
                const fireAt = new Date(Date.now() + 3000);
                await window.Capacitor.Plugins.LocalNotifications.schedule({
                    notifications: [{
                        id: 40001,
                        title: '✅ Nitnem Complete! Waheguru 🙏',
                        body: 'Sab baaniya mukammal kar litin. Guru Sahib di kirpa sada bani rahe.',
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
        } catch (e) {}
    });

})();
