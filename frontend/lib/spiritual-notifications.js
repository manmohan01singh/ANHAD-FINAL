/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SPIRITUAL NOTIFICATIONS MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Fixed-time daily notifications:
 * - Hukamnama: 6:15 AM (with first Gurbani pankti)
 * - Amritvela banis: 4:30 AM
 * - Rehras Sahib: 6:30 PM
 * - Sohela: 9:30 PM
 * 
 * Random inspirational notifications: 3x/day between 7 AM - 9 PM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // Storage keys
    const STORAGE_KEYS = {
        CONFIG: 'spiritual_notifications_config',
        HUKAMNAMA_CACHE: 'hukamnama_first_pankti_cache',
        LAST_RANDOM_SCHEDULE: 'last_random_schedule_date'
    };

    // Default configuration
    const DEFAULT_CONFIG = {
        hukamnama: { enabled: true, time: '06:15' },
        amritvela: { enabled: true, time: '04:30' },
        rehras: { enabled: true, time: '18:30' },
        sohela: { enabled: true, time: '21:30' },
        random: { enabled: true, count: 3, startHour: 7, endHour: 21 }
    };

    // Random inspirational messages (Zomato-style)
    const RANDOM_MESSAGES = [
        {
            message: "Kde kde man boht udaas hunda, Japji Sahib kriye?",
            action: 'open_bani',
            target: 'Japji Sahib'
        },
        {
            message: "Darbar Sahib jekar physically nhi ja skde, ta kyo na man nu othe lai jayiye",
            action: 'open_radio',
            target: 'Darbar Sahib Live'
        },
        {
            message: "Darbar Sahib live, hune suno 🙏",
            action: 'open_radio',
            target: 'Darbar Sahib Live'
        },
        {
            message: "Listen Darbar Sahib kirtan",
            action: 'open_radio',
            target: 'Darbar Sahib'
        },
        {
            message: "Listen Amritvela kirtan",
            action: 'open_radio',
            target: 'Amritvela Kirtan'
        },
        {
            message: "We should start the Sehaj Paath today",
            action: 'open_bani',
            target: 'Sehaj Paath'
        },
        {
            message: "Waheguru simran karo, man nu shanti milegi 🙏",
            action: 'open_naam',
            target: 'Naam Abhyas'
        },
        {
            message: "Guru Sahib di bani parho, jivan sudhar javega",
            action: 'open_bani',
            target: 'Gurbani'
        },
        {
            message: "Nitnem complete kito aaj?",
            action: 'open_tracker',
            target: 'Nitnem Tracker'
        },
        {
            message: "Rehras Sahib da vakt ho gaya",
            action: 'open_bani',
            target: 'Rehras Sahib'
        },
        {
            message: "Sohela paath karke soho",
            action: 'open_bani',
            target: 'Sohela Sahib'
        },
        {
            message: "Amritvela diya banian parho",
            action: 'open_bani',
            target: 'Amritvela Banis'
        },
        {
            message: "Gurbani vichar socho, man nu shanti milegi",
            action: 'open_khoj',
            target: 'Gurbani Khoj'
        },
        {
            message: "Kirtan suno, man nu taazgi milegi",
            action: 'open_radio',
            target: 'Gurbani Radio'
        },
        {
            message: "Guru Sahib da hukam mano, sukh milega",
            action: 'open_hukamnama',
            target: 'Hukamnama'
        },
        {
            message: "Naam japna hi jivan da maqsad hai",
            action: 'open_naam',
            target: 'Naam Abhyas'
        },
        {
            message: "Gurbani diya shabda vichar karo",
            action: 'open_khoj',
            target: 'Gurbani Khoj'
        },
        {
            message: "Shabad Gurbani suno, man nu anand milega",
            action: 'open_radio',
            target: 'Shabad Gurbani'
        },
        {
            message: "Nitnem tracker check karo",
            action: 'open_tracker',
            target: 'Nitnem Tracker'
        },
        {
            message: "Guru Sahib di kirpa paaye",
            action: 'open_hukamnama',
            target: 'Hukamnama'
        }
    ];

    // SpiritualNotifications class
    class SpiritualNotifications {
        constructor() {
            this.config = this.loadConfig();
        }

        /**
         * Load configuration from localStorage
         */
        loadConfig() {
            try {
                const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
                return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to load config:', e);
                return { ...DEFAULT_CONFIG };
            }
        }

        /**
         * Save configuration to localStorage
         */
        saveConfig() {
            try {
                localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to save config:', e);
            }
        }

        /**
         * Update a specific notification setting
         */
        updateSetting(key, value) {
            if (this.config[key]) {
                this.config[key] = { ...this.config[key], ...value };
                this.saveConfig();
            }
        }

        /**
         * Get configuration
         */
        getConfig() {
            return this.config;
        }

        /**
         * Check if running in native Capacitor environment
         */
        isNative() {
            return window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
        }

        /**
         * Schedule all spiritual notifications
         */
        async scheduleAll() {
            if (!this.isNative()) {
                console.log('[SpiritualNotifications] Not in native environment, skipping');
                return [];
            }

            if (!window.Capacitor.Plugins.LocalNotifications) {
                console.log('[SpiritualNotifications] LocalNotifications plugin not available');
                return [];
            }

            try {
                const LN = window.Capacitor.Plugins.LocalNotifications;
                
                // Request permissions
                const perms = await LN.checkPermissions();
                if (perms.display !== 'granted') {
                    await LN.requestPermissions();
                }

                // Create notification channel
                try {
                    await LN.createChannel({
                        id: 'spiritual_reminders',
                        name: 'Spiritual Reminders',
                        description: 'Daily spiritual practice reminders',
                        importance: 5,
                        visibility: 1,
                        vibration: true,
                        sound: 'default',
                        lights: true,
                        lightColor: '#f7c634'
                    });
                } catch (e) {
                    // Channel may already exist
                }

                const notifications = [];
                const now = new Date();

                // Schedule for next 7 days
                for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                    const scheduleDate = new Date(now);
                    scheduleDate.setDate(scheduleDate.getDate() + dayOffset);

                    // Hukamnama notification (6:15 AM)
                    if (this.config.hukamnama.enabled) {
                        const hukamnamaTime = new Date(scheduleDate);
                        const [hh, mm] = this.config.hukamnama.time.split(':');
                        hukamnamaTime.setHours(parseInt(hh), parseInt(mm), 0, 0);

                        if (hukamnamaTime > now) {
                            const firstPankti = this.getCachedHukamnamaPankti() || "ਸਬਦਿ ਗੁਰ ਪੀਰਾ ਗਹਿ ਗਹਿ ਸਮਾਲੀਐ";
                            notifications.push({
                                id: 10000 + dayOffset,
                                title: '🙏 Today\'s Hukamnama',
                                body: firstPankti,
                                schedule: { at: hukamnamaTime, allowWhileIdle: true, exact: true },
                                channelId: 'spiritual_reminders',
                                sound: 'default',
                                smallIcon: 'ic_stat_notify',
                                extra: { action: 'open_hukamnama' }
                            });
                        }
                    }

                    // Amritvela notification (4:30 AM)
                    if (this.config.amritvela.enabled) {
                        const amritvelaTime = new Date(scheduleDate);
                        const [hh, mm] = this.config.amritvela.time.split(':');
                        amritvelaTime.setHours(parseInt(hh), parseInt(mm), 0, 0);

                        if (amritvelaTime > now) {
                            notifications.push({
                                id: 10010 + dayOffset,
                                title: '🌅 Amritvela Time',
                                body: 'Time for Amritvela banis - Japji Sahib, Jaap Sahib, Tav Prasad Savaiye',
                                schedule: { at: amritvelaTime, allowWhileIdle: true, exact: true },
                                channelId: 'spiritual_reminders',
                                sound: 'default',
                                smallIcon: 'ic_stat_notify',
                                extra: { action: 'open_bani', target: 'Amritvela' }
                            });
                        }
                    }

                    // Rehras Sahib notification (6:30 PM)
                    if (this.config.rehras.enabled) {
                        const rehrasTime = new Date(scheduleDate);
                        const [hh, mm] = this.config.rehras.time.split(':');
                        rehrasTime.setHours(parseInt(hh), parseInt(mm), 0, 0);

                        if (rehrasTime > now) {
                            notifications.push({
                                id: 10020 + dayOffset,
                                title: '🙏 Rehras Sahib',
                                body: 'Time for Rehras Sahib paath',
                                schedule: { at: rehrasTime, allowWhileIdle: true, exact: true },
                                channelId: 'spiritual_reminders',
                                sound: 'default',
                                smallIcon: 'ic_stat_notify',
                                extra: { action: 'open_bani', target: 'Rehras' }
                            });
                        }
                    }

                    // Sohela notification (9:30 PM)
                    if (this.config.sohela.enabled) {
                        const sohelaTime = new Date(scheduleDate);
                        const [hh, mm] = this.config.sohela.time.split(':');
                        sohelaTime.setHours(parseInt(hh), parseInt(mm), 0, 0);

                        if (sohelaTime > now) {
                            notifications.push({
                                id: 10030 + dayOffset,
                                title: '🌙 Sohela Sahib',
                                body: 'Time for Sohela Sahib paath before sleep',
                                schedule: { at: sohelaTime, allowWhileIdle: true, exact: true },
                                channelId: 'spiritual_reminders',
                                sound: 'default',
                                smallIcon: 'ic_stat_notify',
                                extra: { action: 'open_bani', target: 'Sohela' }
                            });
                        }
                    }
                }

                // Random notifications (3x/day, 7 AM - 9 PM)
                if (this.config.random.enabled) {
                    const randomNotifs = this.scheduleRandomNotifications(now);
                    notifications.push(...randomNotifs);
                }

                // Schedule all notifications
                if (notifications.length > 0) {
                    await LN.schedule({ notifications });
                    console.log(`[SpiritualNotifications] Scheduled ${notifications.length} notifications`);
                }

                return notifications;
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to schedule notifications:', e);
                return [];
            }
        }

        /**
         * Schedule random inspirational notifications
         */
        scheduleRandomNotifications(now) {
            const notifications = [];
            const today = now.toDateString();
            const lastSchedule = localStorage.getItem(STORAGE_KEYS.LAST_RANDOM_SCHEDULE);

            // Only schedule once per day
            if (lastSchedule === today) {
                return [];
            }

            const count = this.config.random.count || 3;
            const startHour = this.config.random.startHour || 7;
            const endHour = this.config.random.endHour || 21;

            for (let i = 0; i < count; i++) {
                // Random time between startHour and endHour
                const randomHour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
                const randomMinute = Math.floor(Math.random() * 60);

                const scheduleTime = new Date(now);
                scheduleTime.setHours(randomHour, randomMinute, 0, 0);

                // Skip if time has passed
                if (scheduleTime <= now) {
                    scheduleTime.setDate(scheduleTime.getDate() + 1);
                }

                // Random message
                const randomMessage = RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];

                notifications.push({
                    id: 20000 + i,
                    title: '💫 Spiritual Reminder',
                    body: randomMessage.message,
                    schedule: { at: scheduleTime, allowWhileIdle: true, exact: true },
                    channelId: 'spiritual_reminders',
                    sound: 'default',
                    smallIcon: 'ic_stat_notify',
                    extra: { action: randomMessage.action, target: randomMessage.target }
                });
            }

            // Mark as scheduled for today
            localStorage.setItem(STORAGE_KEYS.LAST_RANDOM_SCHEDULE, today);

            return notifications;
        }

        /**
         * Cancel all spiritual notifications
         */
        async cancelAll() {
            if (!this.isNative() || !window.Capacitor.Plugins.LocalNotifications) {
                return;
            }

            try {
                const LN = window.Capacitor.Plugins.LocalNotifications;
                const cancelIds = [];

                // Cancel fixed-time notifications (10000-10099)
                for (let i = 0; i < 100; i++) {
                    cancelIds.push({ id: 10000 + i });
                }

                // Cancel random notifications (20000-20099)
                for (let i = 0; i < 100; i++) {
                    cancelIds.push({ id: 20000 + i });
                }

                await LN.cancel({ notifications: cancelIds });
                console.log('[SpiritualNotifications] Cancelled all notifications');
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to cancel notifications:', e);
            }
        }

        /**
         * Cache the first pankti of today's Hukamnama
         */
        cacheHukamnamaPankti(pankti) {
            try {
                const today = new Date().toDateString();
                const cache = {
                    date: today,
                    pankti: pankti
                };
                localStorage.setItem(STORAGE_KEYS.HUKAMNAMA_CACHE, JSON.stringify(cache));
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to cache Hukamnama pankti:', e);
            }
        }

        /**
         * Get cached Hukamnama pankti
         */
        getCachedHukamnamaPankti() {
            try {
                const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.HUKAMNAMA_CACHE));
                const today = new Date().toDateString();
                
                if (cache && cache.date === today) {
                    return cache.pankti;
                }
            } catch (e) {
                console.error('[SpiritualNotifications] Failed to get cached Hukamnama pankti:', e);
            }
            return null;
        }

        /**
         * Handle notification click action
         */
        handleNotificationAction(action, target) {
            const path = window.location.pathname;

            switch (action) {
                case 'open_hukamnama':
                    window.location.href = path.includes('/Hukamnama/') 
                        ? 'daily-hukamnama.html' 
                        : './Hukamnama/daily-hukamnama.html';
                    break;
                case 'open_bani':
                    window.location.href = path.includes('/GurbaniKhoj/') 
                        ? 'gurbani-khoj.html' 
                        : './GurbaniKhoj/gurbani-khoj.html';
                    break;
                case 'open_radio':
                    window.location.href = path.includes('/GurbaniRadio/') 
                        ? 'gurbani-radio.html' 
                        : './GurbaniRadio/gurbani-radio.html';
                    break;
                case 'open_naam':
                    window.location.href = path.includes('/NaamAbhyas/') 
                        ? 'naam-abhyas.html' 
                        : './NaamAbhyas/naam-abhyas.html';
                    break;
                case 'open_tracker':
                    window.location.href = path.includes('/NitnemTracker/') 
                        ? 'nitnem-tracker.html' 
                        : './NitnemTracker/nitnem-tracker.html';
                    break;
                case 'open_khoj':
                    window.location.href = path.includes('/GurbaniKhoj/') 
                        ? 'gurbani-khoj.html' 
                        : './GurbaniKhoj/gurbani-khoj.html';
                    break;
                default:
                    // Default to homepage
                    window.location.href = './index.html';
            }
        }
    }

    // Export to global scope
    window.SpiritualNotifications = new SpiritualNotifications();

    // Auto-schedule on load if in native environment
    if (window.SpiritualNotifications.isNative()) {
        window.SpiritualNotifications.scheduleAll();
    }

})();
