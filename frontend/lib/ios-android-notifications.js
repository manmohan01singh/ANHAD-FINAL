/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔔 iOS/ANDROID ADVANCED NOTIFICATION SYSTEM v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ iOS 16.4+ Web Push Support (when installed as PWA)
 * ✅ Android Native Push Notifications
 * ✅ Persistent Background Notifications (like the screenshot)
 * ✅ Daily Scheduled Notifications even when app is closed
 * ✅ iOS Add-to-Home-Screen detection and prompt
 * ✅ Notification Grouping for multiple reminders
 * ✅ Silent background sync
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate initialization
    if (window.IOS_ANDROID_NOTIFICATIONS_LOADED) return;
    window.IOS_ANDROID_NOTIFICATIONS_LOADED = true;

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        // Notification Settings
        APP_NAME: 'ANHAD',
        APP_ICON: '/assets/apple-touch-icon.png',
        APP_BADGE: '/assets/favicon-32x32.png',

        // Storage Keys
        NOTIFICATION_PERMISSION_KEY: 'anhad_notification_permission',
        IOS_INSTALL_PROMPT_KEY: 'anhad_ios_install_prompt',
        SCHEDULED_NOTIFICATIONS_KEY: 'anhad_scheduled_notifications',
        LAST_SYNC_KEY: 'anhad_last_sync',

        // Timing
        BACKGROUND_SYNC_INTERVAL: 15 * 60 * 1000, // 15 minutes
        NOTIFICATION_CHECK_INTERVAL: 60 * 1000, // 1 minute

        // Daily Notification Times (24h format)
        DAILY_NOTIFICATIONS: [
            { id: 'amritvela', time: '04:00', title: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ', body: 'Amritvela - Time for meditation and prayer', icon: '🌅' },
            { id: 'hukamnama', time: '05:30', title: '📜 Daily Hukamnama', body: "ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ - Today's divine message awaits", icon: '📜' },
            { id: 'rehras', time: '18:00', title: 'ਰਹਿਰਾਸ ਸਾਹਿਬ', body: 'Rehras Sahib - Evening prayers', icon: '🌆' },
            { id: 'sohila', time: '21:30', title: 'ਸੋਹਿਲਾ ਸਾਹਿਬ', body: 'Sohila Sahib - Bedtime prayer', icon: '🌙' }
        ]
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DEVICE DETECTION
    // ══════════════════════════════════════════════════════════════════════════
    const DeviceInfo = {
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
        isAndroid: /Android/.test(navigator.userAgent),
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        isPWA: window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true,
        isIOSPWA: function () {
            return this.isIOS && this.isPWA;
        },
        canReceivePush: function () {
            // iOS 16.4+ supports Push for installed PWAs
            if (this.isIOS && this.isPWA) {
                return 'Notification' in window && 'PushManager' in window;
            }
            return 'Notification' in window;
        },
        getIOSVersion: function () {
            const match = navigator.userAgent.match(/OS (\d+)_/);
            return match ? parseInt(match[1]) : 0;
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // iOS ADD TO HOME SCREEN PROMPT
    // ══════════════════════════════════════════════════════════════════════════
    const IOSInstallPrompt = {
        shouldShow: function () {
            if (DeviceInfo.isPWA) return false;

            if (sessionStorage.getItem('anhad_ios_install_shown')) return false;

            const lastPrompt = localStorage.getItem(CONFIG.IOS_INSTALL_PROMPT_KEY);
            if (lastPrompt) {
                const daysSincePrompt = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
                if (daysSincePrompt < 7) return false; // Don't show again for 7 days
            }
            return true;
        },

        show: function () {
            if (!this.shouldShow()) return;

            // Remove existing prompt
            document.querySelector('.ios-install-prompt')?.remove();

            const isIOS = DeviceInfo.isIOS;
            const step1Content = isIOS 
                ? `<p>Tap the <strong style="color:var(--ios-blue,#007AFF)">Share</strong> button</p>
                   <div class="ios-share-icon" style="color:var(--ios-blue,#007AFF)">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                           <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                           <polyline points="16 6 12 2 8 6"/>
                           <line x1="12" y1="2" x2="12" y2="15"/>
                       </svg>
                   </div>`
                : `<p>Tap the <strong>Browser Menu</strong> (3 dots)</p>
                   <div class="ios-share-icon">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                           <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                       </svg>
                   </div>`;

            const prompt = document.createElement('div');
            prompt.className = 'ios-install-prompt';
            prompt.innerHTML = `
                <div class="ios-prompt-backdrop"></div>
                <div class="ios-prompt-sheet">
                    <div class="ios-prompt-header">
                        <div class="ios-prompt-icon">
                            <img src="${CONFIG.APP_ICON}" alt="ANHAD">
                        </div>
                        <div class="ios-prompt-title">
                            <h3>Install ANHAD</h3>
                            <p>Get notifications even when app is closed</p>
                        </div>
                        <button class="ios-prompt-close" aria-label="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="ios-prompt-steps">
                        <div class="ios-step" style="animation-delay: 0.1s">
                            <div class="ios-step-num">1</div>
                            <div class="ios-step-content">
                                ${step1Content}
                            </div>
                        </div>
                        <div class="ios-step" style="animation-delay: 0.2s">
                            <div class="ios-step-num">2</div>
                            <div class="ios-step-content">
                                <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                                <div class="ios-add-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                        <rect x="3" y="3" width="18" height="18" rx="4"/>
                                        <path d="M12 8v8M8 12h8"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div class="ios-step" style="animation-delay: 0.3s">
                            <div class="ios-step-num">3</div>
                            <div class="ios-step-content">
                                <p>Tap <strong>"Add"</strong> to install</p>
                            </div>
                        </div>
                    </div>

                    <div class="ios-prompt-benefits">
                        <div class="ios-benefit">
                            <span class="ios-benefit-icon">🔔</span>
                            <span>Daily reminders for Nitnem & Rehras</span>
                        </div>
                        <div class="ios-benefit">
                            <span class="ios-benefit-icon">📴</span>
                            <span>Works offline</span>
                        </div>
                        <div class="ios-benefit">
                            <span class="ios-benefit-icon">⚡</span>
                            <span>Faster loading</span>
                        </div>
                    </div>

                    <button class="ios-prompt-dismiss">Maybe Later</button>
                </div>
            `;

            document.body.appendChild(prompt);

            // Animate in
            requestAnimationFrame(() => {
                prompt.classList.add('visible');
            });

            // Event handlers
            prompt.querySelector('.ios-prompt-close').onclick = () => this.dismiss(prompt);
            prompt.querySelector('.ios-prompt-dismiss').onclick = () => this.dismiss(prompt);
            prompt.querySelector('.ios-prompt-backdrop').onclick = () => this.dismiss(prompt);

            // Record prompt shown
            localStorage.setItem(CONFIG.IOS_INSTALL_PROMPT_KEY, Date.now().toString());
            sessionStorage.setItem('anhad_ios_install_shown', 'true');
        },

        dismiss: function (prompt) {
            prompt.classList.remove('visible');
            setTimeout(() => prompt.remove(), 400);
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // NOTIFICATION MANAGER
    // ══════════════════════════════════════════════════════════════════════════
    const NotificationManager = {
        permission: 'default',

        init: async function () {
            if (!('Notification' in window)) {
                console.log('Notifications not supported');
                return;
            }

            this.permission = Notification.permission;
            console.log('📱 Notification permission:', this.permission);

            // Start background check
            this.startBackgroundCheck();

            // Register for push if permitted
            if (this.permission === 'granted') {
                await this.setupPushSubscription();
            }
        },

        requestPermission: async function () {
            if (!('Notification' in window)) {
                return { success: false, reason: 'not_supported' };
            }

            // iOS Safari doesn't support requesting permission unless installed as PWA
            if (DeviceInfo.isIOS && !DeviceInfo.isPWA) {
                IOSInstallPrompt.show();
                return { success: false, reason: 'ios_not_installed' };
            }

            try {
                const permission = await Notification.requestPermission();
                this.permission = permission;

                if (permission === 'granted') {
                    console.log('✅ Notification permission granted');
                    await this.setupPushSubscription();
                    await this.scheduleDefaultNotifications();
                    return { success: true };
                } else {
                    console.log('❌ Notification permission denied');
                    return { success: false, reason: 'denied' };
                }
            } catch (error) {
                console.error('Permission request error:', error);
                return { success: false, reason: 'error', error };
            }
        },

        setupPushSubscription: async function () {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return null;
            }

            try {
                const registration = await navigator.serviceWorker.ready;

                // Check existing subscription
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // Create new subscription (would need VAPID keys for production)
                    console.log('📡 Push subscription would be created here with VAPID keys');
                }

                return subscription;
            } catch (error) {
                console.error('Push subscription error:', error);
                return null;
            }
        },

        scheduleDefaultNotifications: async function () {
            // Load user's reminders settings
            const remindersData = this.loadUserReminders();

            // Merge with default notifications
            const notifications = [...CONFIG.DAILY_NOTIFICATIONS];

            // Add user's custom reminders
            if (remindersData?.reminders) {
                remindersData.reminders.forEach(reminder => {
                    if (reminder.enabled) {
                        notifications.push({
                            id: reminder.id,
                            time: reminder.time,
                            title: reminder.title || reminder.label,
                            body: reminder.gurmukhi || reminder.body || 'Time for your spiritual practice',
                            icon: '🔔'
                        });
                    }
                });
            }

            // Schedule all
            for (const notif of notifications) {
                await this.scheduleNotification(notif);
            }

            // Store scheduled notifications
            localStorage.setItem(CONFIG.SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
        },

        loadUserReminders: function () {
            // Try multiple storage keys
            const keys = ['sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'];

            for (const key of keys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        return JSON.parse(data);
                    } catch (e) {
                        continue;
                    }
                }
            }
            return null;
        },

        scheduleNotification: async function (config) {
            if (this.permission !== 'granted') return;

            const { id, time, title, body, icon } = config;
            const [hours, minutes] = time.split(':').map(Number);

            // Calculate next occurrence
            const now = new Date();
            const scheduledTime = new Date(now);
            scheduledTime.setHours(hours, minutes, 0, 0);

            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            const delay = scheduledTime.getTime() - Date.now();

            // Store in background system
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SCHEDULE_NOTIFICATION',
                    payload: {
                        id: `anhad_${id}`,
                        title: `${icon} ${title}`,
                        body: body,
                        scheduledTime: scheduledTime.getTime(),
                        tag: `anhad-reminder-${id}`,
                        recurring: true,
                        requireInteraction: true,
                        icon: CONFIG.APP_ICON,
                        badge: CONFIG.APP_BADGE,
                        vibrate: [200, 100, 200],
                        actions: [
                            { action: 'open', title: 'Open App' },
                            { action: 'dismiss', title: 'Dismiss' }
                        ],
                        data: {
                            url: '/index.html',
                            notificationId: id
                        }
                    }
                });
            }

            console.log(`⏰ Scheduled: ${title} at ${time} (in ${Math.round(delay / 60000)} minutes)`);
        },

        showInstantNotification: async function (title, body, options = {}) {
            if (this.permission !== 'granted') {
                const result = await this.requestPermission();
                if (!result.success) return;
            }

            try {
                const registration = await navigator.serviceWorker.ready;

                await registration.showNotification(title, {
                    body: body,
                    icon: options.icon || CONFIG.APP_ICON,
                    badge: CONFIG.APP_BADGE,
                    tag: options.tag || `anhad-${Date.now()}`,
                    requireInteraction: options.requireInteraction || false,
                    vibrate: [200, 100, 200],
                    actions: options.actions || [],
                    data: options.data || { url: '/' }
                });

                return true;
            } catch (error) {
                console.error('Show notification error:', error);

                // Fallback to basic notification
                try {
                    new Notification(title, {
                        body: body,
                        icon: CONFIG.APP_ICON,
                        tag: options.tag || `anhad-${Date.now()}`
                    });
                    return true;
                } catch (e) {
                    return false;
                }
            }
        },

        startBackgroundCheck: function () {
            // Check every minute for due notifications
            setInterval(() => this.checkScheduledNotifications(), CONFIG.NOTIFICATION_CHECK_INTERVAL);

            // Initial check
            this.checkScheduledNotifications();
        },

        checkScheduledNotifications: function () {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const today = now.toDateString();

            // Load what we've already shown today
            const shownToday = JSON.parse(localStorage.getItem('anhad_shown_today') || '{}');

            // Check against scheduled
            const scheduled = JSON.parse(localStorage.getItem(CONFIG.SCHEDULED_NOTIFICATIONS_KEY) || '[]');

            for (const notif of scheduled) {
                const [h, m] = notif.time.split(':').map(Number);
                const notifMinutes = h * 60 + m;

                // Check if it's time (within 1 minute window) and not shown yet
                if (Math.abs(currentMinutes - notifMinutes) <= 1 && !shownToday[notif.id]) {
                    this.showInstantNotification(
                        `${notif.icon || '🔔'} ${notif.title}`,
                        notif.body,
                        { tag: `anhad-${notif.id}` }
                    );

                    shownToday[notif.id] = true;
                }
            }

            // Reset at midnight
            if (shownToday._date !== today) {
                localStorage.setItem('anhad_shown_today', JSON.stringify({ _date: today }));
            } else {
                localStorage.setItem('anhad_shown_today', JSON.stringify({ ...shownToday, _date: today }));
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // PERIODIC BACKGROUND SYNC (for when app is closed)
    // ══════════════════════════════════════════════════════════════════════════
    const BackgroundSync = {
        init: async function () {
            if (!('serviceWorker' in navigator)) return;

            try {
                const registration = await navigator.serviceWorker.ready;

                // Register periodic sync if supported (Chrome/Android)
                if ('periodicSync' in registration) {
                    const status = await navigator.permissions.query({
                        name: 'periodic-background-sync',
                    });

                    if (status.state === 'granted') {
                        await registration.periodicSync.register('anhad-daily-sync', {
                            minInterval: 15 * 60 * 1000 // 15 minutes
                        });
                        console.log('✅ Periodic background sync registered');
                    }
                }

                // Also register one-time sync
                if ('sync' in registration) {
                    await registration.sync.register('anhad-notification-sync');
                }
            } catch (error) {
                console.warn('Background sync registration failed:', error);
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // VISIBILITY API - Re-check when app becomes visible
    // ══════════════════════════════════════════════════════════════════════════
    const VisibilityHandler = {
        init: function () {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    // App came to foreground - refresh notifications
                    NotificationManager.checkScheduledNotifications();
                    NotificationManager.scheduleDefaultNotifications();
                }
            });

            // Also handle page show for iOS back/forward cache
            window.addEventListener('pageshow', (event) => {
                if (event.persisted) {
                    NotificationManager.scheduleDefaultNotifications();
                }
            });
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // LOAD EXTERNAL CLAYMORPHISM CSS
    // ══════════════════════════════════════════════════════════════════════════
    const injectStyles = function () {
        if (document.getElementById('ios-android-notification-styles')) return;

        // Load external CSS file
        const link = document.createElement('link');
        link.id = 'ios-android-notification-styles';
        link.rel = 'stylesheet';
        link.href = 'lib/ios-android-notifications-clay.css';
        document.head.appendChild(link);

        console.log('✅ Claymorphism styles loaded');
    };
                to { opacity: 1; transform: translateX(0) scale(1); }
            }

            .ios-step {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 0;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                opacity: 0;
                animation: slideInStep 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .ios-step:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }

            .ios-step:first-child {
                padding-top: 0;
            }

            /* Step numbers - clay bubbles */
            .ios-step-num {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: linear-gradient(145deg, #FFD93D, #FFC93D, #E6B800);
                color: #2a2a2a;
                font-size: 16px;
                font-weight: 900;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                /* Extreme clay effect */
                box-shadow:
                    /* Outer lift */
                    0 6px 16px rgba(255, 193, 7, 0.4),
                    0 3px 8px rgba(0,0,0,0.2),
                    /* Top highlight */
                    inset 0 2px 3px rgba(255,255,255,0.8),
                    /* Left highlight */
                    inset 2px 0 2px rgba(255,255,255,0.4),
                    /* Bottom shadow */
                    inset 0 -2px 2px rgba(0,0,0,0.15);
                text-shadow: 0 1px 0 rgba(255,255,255,0.5);
            }

            .ios-step-content {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .ios-step-content p {
                margin: 0;
                font-size: 15px;
                font-weight: 500;
                color: rgba(255,255,255,0.95);
                line-height: 1.4;
            }

            .ios-step-content strong {
                color: #FFD93D;
                font-weight: 700;
                text-shadow: 0 2px 4px rgba(255,193,7,0.3);
            }

            /* Icon containers - clay style */
            .ios-share-icon, .ios-add-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #4FC3F7;
                background: linear-gradient(145deg,
                    rgba(79,195,247,0.15) 0%,
                    rgba(79,195,247,0.08) 100%);
                border-radius: 12px;
                box-shadow:
                    0 4px 12px rgba(0,0,0,0.15),
                    inset 0 1px 1px rgba(255,255,255,0.3),
                    inset 0 -1px 1px rgba(0,0,0,0.1);
            }

            /* ============================================
               BENEFITS - Clay Pills
               ============================================ */
            .ios-prompt-benefits {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 24px;
                justify-content: center;
            }

            .ios-benefit {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                background: linear-gradient(145deg,
                    rgba(255,217,61,0.15) 0%,
                    rgba(255,193,7,0.08) 100%);
                border-radius: 24px;
                font-size: 13px;
                font-weight: 600;
                color: rgba(255,255,255,0.9);
                border: 1px solid rgba(255,217,61,0.2);
                box-shadow:
                    0 4px 12px rgba(0,0,0,0.15),
                    inset 0 1px 1px rgba(255,255,255,0.25),
                    inset 0 -1px 1px rgba(0,0,0,0.05);
            }

            .ios-benefit-icon {
                font-size: 16px;
                filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
            }

            /* ============================================
               DISMISS BUTTON - Clay Button
               ============================================ */
            .ios-prompt-dismiss {
                width: 100%;
                padding: 18px 24px;
                background: linear-gradient(145deg,
                    rgba(255,255,255,0.15) 0%,
                    rgba(255,255,255,0.08) 50%,
                    rgba(0,0,0,0.05) 100%);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 20px;
                color: rgba(255,255,255,0.95);
                font-size: 17px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow:
                    /* Outer soft lift */
                    0 8px 24px rgba(0,0,0,0.2),
                    0 4px 8px rgba(0,0,0,0.15),
                    /* Inner top highlight */
                    inset 0 2px 2px rgba(255,255,255,0.25),
                    /* Inner bottom shadow */
                    inset 0 -2px 2px rgba(0,0,0,0.1);
            }

            .ios-prompt-dismiss:hover {
                background: linear-gradient(145deg,
                    rgba(255,255,255,0.2) 0%,
                    rgba(255,255,255,0.12) 50%);
                transform: translateY(-2px);
                box-shadow:
                    0 12px 28px rgba(0,0,0,0.25),
                    0 6px 12px rgba(0,0,0,0.2),
                    inset 0 2px 2px rgba(255,255,255,0.3),
                    inset 0 -2px 2px rgba(0,0,0,0.1);
            }

            .ios-prompt-dismiss:active {
                transform: translateY(1px) scale(0.98);
                background: linear-gradient(145deg,
                    rgba(255,255,255,0.1) 0%,
                    rgba(255,255,255,0.05) 50%);
                box-shadow:
                    /* Pressed in shadow */
                    0 4px 12px rgba(0,0,0,0.15),
                    inset 0 3px 6px rgba(0,0,0,0.2),
                    inset 0 -1px 1px rgba(255,255,255,0.1);
            }

            /* ============================================
               NOTIFICATION BANNER - Clay Style
               ============================================ */
            .notification-permission-banner {
                position: fixed;
                bottom: 20px;
                left: 16px;
                right: 16px;
                padding: 20px;
                padding-bottom: max(20px, env(safe-area-inset-bottom));
                background: linear-gradient(145deg,
                    rgba(255,217,61,0.95) 0%,
                    rgba(255,193,7,0.95) 100%);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                z-index: 99999;
                border-radius: 24px;
                transform: translateY(calc(100% + 40px));
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow:
                    0 20px 50px rgba(255,193,7,0.4),
                    0 8px 20px rgba(0,0,0,0.2),
                    inset 0 2px 2px rgba(255,255,255,0.5),
                    inset 0 -2px 2px rgba(0,0,0,0.1);
                border: 1px solid rgba(255,255,255,0.3);
            }

            .notification-permission-banner.visible {
                transform: translateY(0);
            }

            .notification-banner-content {
                display: flex;
                align-items: center;
                gap: 14px;
                max-width: 600px;
                margin: 0 auto;
            }

            .notification-banner-icon {
                font-size: 32px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }

            .notification-banner-text {
                flex: 1;
            }

            .notification-banner-text h4 {
                margin: 0 0 4px;
                font-size: 17px;
                font-weight: 800;
                color: #2a2a2a;
            }

            .notification-banner-text p {
                margin: 0;
                font-size: 14px;
                color: rgba(0,0,0,0.7);
                font-weight: 500;
            }

            .notification-banner-btn {
                padding: 12px 22px;
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                border: none;
                border-radius: 20px;
                color: #FFD93D;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                box-shadow:
                    0 6px 16px rgba(0,0,0,0.3),
                    inset 0 1px 1px rgba(255,255,255,0.1);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .notification-banner-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.35);
            }

            .notification-banner-btn:active {
                transform: translateY(1px) scale(0.98);
            }

            .notification-banner-close {
                width: 32px;
                height: 32px;
                background: rgba(0,0,0,0.1);
                border: none;
                border-radius: 50%;
                color: rgba(0,0,0,0.6);
                font-size: 20px;
                font-weight: 300;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow:
                    inset 0 1px 2px rgba(0,0,0,0.1),
                    0 2px 4px rgba(255,255,255,0.5);
                transition: all 0.2s ease;
            }

            .notification-banner-close:hover {
                background: rgba(0,0,0,0.15);
            }
        `;
        document.head.appendChild(style);
    };

    // ══════════════════════════════════════════════════════════════════════════
    // NOTIFICATION PERMISSION BANNER
    // ══════════════════════════════════════════════════════════════════════════
    const PermissionBanner = {
        show: function () {
            if (NotificationManager.permission !== 'default') return;
            if (sessionStorage.getItem('anhad_permission_banner_dismissed')) return;

            const banner = document.createElement('div');
            banner.className = 'notification-permission-banner';
            banner.innerHTML = `
                <div class="notification-banner-content">
                    <span class="notification-banner-icon">🔔</span>
                    <div class="notification-banner-text">
                        <h4>Enable Notifications</h4>
                        <p>Get daily reminders for Nitnem, Rehras & Hukamnama</p>
                    </div>
                    <button class="notification-banner-btn">Enable</button>
                    <button class="notification-banner-close">×</button>
                </div>
            `;

            document.body.appendChild(banner);

            setTimeout(() => banner.classList.add('visible'), 100);

            banner.querySelector('.notification-banner-btn').onclick = async () => {
                const result = await NotificationManager.requestPermission();
                if (result.success || result.reason === 'ios_not_installed') {
                    banner.classList.remove('visible');
                    setTimeout(() => banner.remove(), 400);
                }
            };

            banner.querySelector('.notification-banner-close').onclick = () => {
                sessionStorage.setItem('anhad_permission_banner_dismissed', 'true');
                banner.classList.remove('visible');
                setTimeout(() => banner.remove(), 400);
            };
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════
    async function init() {
        console.log('📱 iOS/Android Notification System initializing...');
        console.log(`   Device: ${DeviceInfo.isIOS ? 'iOS' : DeviceInfo.isAndroid ? 'Android' : 'Other'}`);
        console.log(`   PWA: ${DeviceInfo.isPWA}`);
        console.log(`   Push Support: ${DeviceInfo.canReceivePush()}`);

        // Inject CSS
        injectStyles();

        // Initialize notification manager
        await NotificationManager.init();

        // Initialize background sync
        await BackgroundSync.init();

        // Initialize visibility handler
        VisibilityHandler.init();

        // Show install prompt 1 second after load, instead of waiting 30 seconds
        if (!DeviceInfo.isPWA) {
            setTimeout(() => IOSInstallPrompt.show(), 1000);
        }

        // Show notification permission banner after 10 seconds (skip if prompt is shown)
        setTimeout(() => {
            if (!document.querySelector('.ios-install-prompt.visible')) {
                PermissionBanner.show();
            }
        }, 10000);

        console.log('✅ iOS/Android Notification System ready');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export to window
    window.AnhadNotifications = {
        DeviceInfo,
        NotificationManager,
        IOSInstallPrompt,
        requestPermission: () => NotificationManager.requestPermission(),
        showNotification: (title, body, options) => NotificationManager.showInstantNotification(title, body, options),
        scheduleNotifications: () => NotificationManager.scheduleDefaultNotifications()
    };

})();
