/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WIDGET BRIDGE - Web to Native Widget Sync
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module syncs data from the web app to native home screen widgets
 * on Android and iOS. Works with Capacitor's WidgetDataBridge plugin.
 */

const WidgetBridge = window.WidgetBridge || {
    PLUGIN_NAME: 'WidgetDataBridge',
    isCapacitor: typeof Capacitor !== 'undefined',
    isNative: false,
    debug: false,
    pluginAvailable: false,
    retryCount: 0,
    maxRetries: 15,

    /**
     * Initialize the widget bridge
     */
    init() {
        if (this.isCapacitor) {
            this.isNative = Capacitor.isNativePlatform();
            this.checkPluginAvailability();
            console.log('[WidgetBridge] Initialized. Native:', this.isNative, 'Plugin:', this.pluginAvailable);
        }
    },

    /**
     * Check if plugin is available
     */
    checkPluginAvailability() {
        try {
            this.pluginAvailable = Capacitor.Plugins && Capacitor.Plugins.WidgetDataBridge;
            if (!this.pluginAvailable && this.debug) {
                console.warn('[WidgetBridge] WidgetDataBridge plugin not available yet');
            }
        } catch (e) {
            if (this.debug) console.error('[WidgetBridge] Error checking plugin:', e);
        }
    },

    /**
     * Enable debug mode
     */
    setDebug(enabled) {
        this.debug = enabled;
        console.log('[WidgetBridge] Debug mode:', enabled);
    },

    /**
     * Sync Nitnem Tracker data to widget
     */
    async syncNitnemData() {
        try {
            const data = await this.getNitnemData();
            await this.syncToNative('nitnem', data);
            console.log('[WidgetBridge] Nitnem data synced');
        } catch (error) {
            console.error('[WidgetBridge] Error syncing Nitnem:', error);
        }
    },

    /**
     * Sync Naam Abhyas data to widget
     */
    async syncNaamAbhyasData() {
        try {
            const data = await this.getNaamAbhyasData();
            await this.syncToNative('naamabhyas', data);
            console.log('[WidgetBridge] Naam Abhyas data synced');
        } catch (error) {
            console.error('[WidgetBridge] Error syncing Naam Abhyas:', error);
        }
    },

    /**
     * Sync Calendar/Hukamnama data to widget
     */
    async syncCalendarData() {
        try {
            const data = await this.getCalendarData();
            await this.syncToNative('calendar', data);
            console.log('[WidgetBridge] Calendar data synced');
        } catch (error) {
            console.error('[WidgetBridge] Error syncing Calendar:', error);
        }
    },

    /**
     * Sync Live Kirtan data to widget
     */
    async syncKirtanData() {
        try {
            const data = await this.getKirtanData();
            await this.syncToNative('kirtan', data);
            console.log('[WidgetBridge] Kirtan data synced');
        } catch (error) {
            console.error('[WidgetBridge] Error syncing Kirtan:', error);
        }
    },

    /**
     * Sync Amritvela Kirtan data to widget
     */
    async syncAmritvelaData() {
        try {
            const data = await this.getAmritvelaData();
            await this.syncToNative('amritvela', data);
            console.log('[WidgetBridge] Amritvela data synced');
        } catch (error) {
            console.error('[WidgetBridge] Error syncing Amritvela:', error);
        }
    },

    /**
     * Sync all widgets at once
     */
    async syncAllWidgets() {
        if (window.AnhadWidgets && typeof window.AnhadWidgets.syncAll === 'function') {
            await window.AnhadWidgets.syncAll();
            return;
        }

        if (!this.isNative) {
            if (this.debug) console.log('[WidgetBridge] Not on native platform, skipping sync');
            return;
        }

        this.checkPluginAvailability();
        if (!this.pluginAvailable) {
            if (this.debug) console.warn('[WidgetBridge] Plugin not available, skipping sync');
            return;
        }

        try {
            await Promise.all([
                this.syncNitnemData(),
                this.syncNaamAbhyasData(),
                this.syncCalendarData(),
                this.syncKirtanData(),
                this.syncAmritvelaData()
            ]);
            console.log('[WidgetBridge] All widgets synced successfully');
        } catch (error) {
            console.error('[WidgetBridge] Error syncing all widgets:', error);
        }
    },

    /**
     * Get Nitnem Tracker data from localStorage
     */
    async getNitnemData() {
        const CONFIG = {
            STORAGE_KEYS: {
                STREAK_DATA: 'anhad_streak_data',
                NITNEM_LOG: 'nitnemTracker_nitnemLog',
                SELECTED_BANIS: 'nitnemTracker_selectedBanis',
                THEME: 'anhad_theme'
            }
        };

        const today = new Date().toLocaleDateString('en-CA');
        
        // Load data
        const streakData = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STREAK_DATA) || '{"current": 0}');
        const nitnemLog = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.NITNEM_LOG) || '{}');
        const selectedBanis = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_BANIS) || '[]');
        const theme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'dark';
        
        if (this.debug) {
            console.log('[WidgetBridge] Nitnem data - streak:', streakData.current, 'progress:', progress, 'theme:', theme);
        }

        // Calculate today's progress
        const todayProgress = nitnemLog[today] || {};
        const totalBanis = selectedBanis.length || 5;
        const completedBanis = Object.values(todayProgress).filter(v => v === true).length;
        const progress = totalBanis > 0 ? Math.round((completedBanis / totalBanis) * 100) : 0;

        // Build completed bani list for indicator display
        const completedBanisList = selectedBanis.map(bani => {
            return todayProgress[bani.id] === true;
        });

        return {
            streak: streakData.current || 0,
            progress: progress,
            completedBanis: completedBanis,
            totalBanis: totalBanis,
            completedBanisList: completedBanisList,
            isDark: theme === 'dark',
            lastUpdated: Date.now()
        };
    },

    /**
     * Get Naam Abhyas data from localStorage
     */
    async getNaamAbhyasData() {
        const STORAGE_KEY = 'naam_abhyas_history';
        const CONFIG_KEY = 'naam_abhyas_config';
        const THEME_KEY = 'anhad_theme';

        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{"enabled": false, "activeHours": {"start": 5, "end": 22}}');
        const theme = localStorage.getItem(THEME_KEY) || 'dark';
        
        if (this.debug) {
            console.log('[WidgetBridge] Naam Abhyas data - enabled:', config.enabled, 'completed:', completedHours, 'theme:', theme);
        }

        const today = new Date().toLocaleDateString('en-CA');
        const todaySchedule = history.scheduleHistory?.[today] || {};

        const startHour = config.activeHours?.start || 5;
        const endHour = config.activeHours?.end || 22;
        const totalHours = endHour - startHour + 1;

        let completedHours = 0;
        for (let hour = startHour; hour <= endHour; hour++) {
            if (todaySchedule[hour]?.status === 'completed') {
                completedHours++;
            }
        }

        const remainingHours = totalHours - completedHours;
        const percentage = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

        // Find next reminder time
        let nextReminder = '';
        if (config.enabled) {
            const now = new Date();
            const currentHour = now.getHours();
            for (let hour = currentHour + 1; hour <= endHour; hour++) {
                if (!todaySchedule[hour] || todaySchedule[hour]?.status !== 'completed') {
                    nextReminder = `${hour}:00`;
                    break;
                }
            }
        }

        return {
            streak: history.currentStreak || 0,
            completedHours: completedHours,
            totalHours: totalHours,
            remainingHours: remainingHours,
            percentage: percentage,
            enabled: config.enabled || false,
            nextReminder: nextReminder,
            isDark: theme === 'dark',
            lastUpdated: Date.now()
        };
    },

    /**
     * Get Calendar/Hukamnama data
     */
    async getCalendarData() {
        // Get stored calendar events
        const events = JSON.parse(localStorage.getItem('gurpurab_events') || '[]');
        const hukamnama = JSON.parse(localStorage.getItem('today_hukamnama') || '{}');
        const theme = localStorage.getItem('anhad_theme') || 'dark';
        
        if (this.debug) {
            console.log('[WidgetBridge] Calendar data - nextEvent:', nextEvent?.name, 'daysUntil:', daysUntil, 'theme:', theme);
        }

        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Find next upcoming event
        let nextEvent = null;
        let daysUntil = -1;

        for (const event of events) {
            const [y, m, d] = (event.date || event.gregorian_date).split('T')[0].split('-');
            const eventDate = new Date(y, m - 1, d); // Local midnight
            if (eventDate >= todayMidnight) {
                const diffTime = eventDate - todayMidnight;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (daysUntil === -1 || diffDays < daysUntil) {
                    daysUntil = diffDays;
                    nextEvent = event;
                }
            }
        }

        // Format Nanakshahi date (simplified)
        const months = ['Chet', 'Vaisakh', 'Jeth', 'Harh', 'Sawan', 'Bhadon', 'Assu', 'Katak', 'Maghar', 'Poh', 'Magh', 'Phagun'];
        const nanakshahiMonth = months[today.getMonth()];
        // Simplified - actual Nanakshahi conversion is more complex
        const nanakshahiDate = `${nanakshahiMonth} ${today.getDate()}`;

        return {
            nextEventName: nextEvent?.name || 'No upcoming events',
            daysUntil: daysUntil,
            hukamnamaPreview: hukamnama?.preview || hukamnama?.firstLine || '',
            nanakshahiDate: nanakshahiDate,
            isDark: theme === 'dark',
            lastUpdated: Date.now()
        };
    },

    /**
     * Get Live Kirtan data
     */
    async getKirtanData() {
        const playerState = JSON.parse(localStorage.getItem('kirtan_player_state') || '{}');
        const theme = localStorage.getItem('anhad_theme') || 'dark';
        
        if (this.debug) {
            console.log('[WidgetBridge] Kirtan data - isPlaying:', playerState.isPlaying, 'track:', playerState.trackName, 'theme:', theme);
        }

        return {
            trackName: playerState.trackName || 'Darbar Sahib Live',
            stationName: playerState.stationName || 'Sri Harmandir Sahib Ji',
            isPlaying: playerState.isPlaying || false,
            duration: playerState.duration || '',
            artwork: playerState.artwork || '../assets/darbar-sahib-day.webp',
            streamType: playerState.streamType || 'darbar',
            isDark: theme === 'dark',
            lastUpdated: Date.now()
        };
    },

    /**
     * Get Amritvela Kirtan data
     */
    async getAmritvelaData() {
        const playerState = JSON.parse(localStorage.getItem('kirtan_player_state') || '{}');
        const theme = localStorage.getItem('anhad_theme') || 'dark';
        
        // Override with Amritvela-specific data if available
        const amritvelaState = JSON.parse(localStorage.getItem('amritvela_player_state') || '{}');
        const trackName = amritvelaState.trackName || 'Amritvela Kirtan';
        const stationName = amritvelaState.stationName || '24/7 Divine Kirtan';
        const isPlaying = amritvelaState.isPlaying || false;
        const trackCounter = amritvelaState.trackCounter || 'Track 1 of 40';
        
        if (this.debug) {
            console.log('[WidgetBridge] Amritvela data - isPlaying:', isPlaying, 'track:', trackName, 'theme:', theme);
        }

        return {
            trackName: trackName,
            stationName: stationName,
            isPlaying: isPlaying,
            trackCounter: trackCounter,
            artwork: amritvelaState.artwork || '../assets/Darbar-sahib-AMRITVELA.webp',
            streamType: 'amritvela',
            isDark: theme === 'dark',
            lastUpdated: Date.now()
        };
    },

    /**
     * Send data to native plugin
     */
    async syncToNative(widgetType, data) {
        if (!this.isNative) {
            if (this.debug) console.log('[WidgetBridge] Not on native platform, skipping sync for', widgetType);
            return;
        }

        this.checkPluginAvailability();
        if (!this.pluginAvailable) {
            if (this.debug) console.error('[WidgetBridge] Plugin not available for', widgetType, '- ensure WidgetDataBridgePlugin is registered in MainActivity');
            return;
        }

        try {
            const { WidgetDataBridge } = Capacitor.Plugins;
            if (WidgetDataBridge) {
                await WidgetDataBridge.syncWidgetData({
                    widgetType: widgetType,
                    data: data
                });
                if (this.debug) console.log('[WidgetBridge] Successfully synced', widgetType);
            } else {
                console.error('[WidgetBridge] WidgetDataBridge not found in Capacitor.Plugins');
            }
        } catch (error) {
            console.error('[WidgetBridge] Error syncing', widgetType, ':', error.message);
            console.error('[WidgetBridge] Troubleshooting: Check that WidgetDataBridgePlugin is registered in MainActivity.java and capacitor.config.ts includes the plugin');
        }
    },

    /**
     * Request manual widget update
     */
    async requestUpdate(widgetType) {
        if (!this.isNative) {
            if (this.debug) console.log('[WidgetBridge] Not on native platform, skipping update request for', widgetType);
            return;
        }

        this.checkPluginAvailability();
        if (!this.pluginAvailable) {
            if (this.debug) console.error('[WidgetBridge] Plugin not available for update request:', widgetType);
            return;
        }

        try {
            const { WidgetDataBridge } = Capacitor.Plugins;
            if (WidgetDataBridge) {
                await WidgetDataBridge.requestWidgetUpdate({
                    widgetType: widgetType
                });
                if (this.debug) console.log('[WidgetBridge] Successfully requested update for', widgetType);
            }
        } catch (error) {
            console.error('[WidgetBridge] Error requesting update for', widgetType, ':', error.message);
        }
    },

    /**
     * Setup auto-sync listeners
     */
    setupAutoSync() {
        if (!this.isNative) {
            if (this.debug) console.log('[WidgetBridge] Not on native platform, skipping auto-sync setup');
            return;
        }

        // Sync on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncAllWidgets();
            }
        });

        // Sync every 5 minutes when app is active
        setInterval(() => {
            this.syncAllWidgets();
        }, 5 * 60 * 1000);

        // Retry plugin availability check
        const retryInterval = setInterval(() => {
            this.retryCount++;
            this.checkPluginAvailability();
            if (this.pluginAvailable) {
                clearInterval(retryInterval);
                console.log('[WidgetBridge] Plugin became available after', this.retryCount, 'retries');
                this.syncAllWidgets();
            } else if (this.retryCount >= this.maxRetries) {
                clearInterval(retryInterval);
                console.error('[WidgetBridge] Plugin not available after', this.maxRetries, 'retries (30 seconds). Check MainActivity.java plugin registration.');
            }
        }, 2000);

        console.log('[WidgetBridge] Auto-sync enabled with plugin retry logic');
    },
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.WidgetBridge = WidgetBridge;
    WidgetBridge.init();
    
    // Auto-sync when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            WidgetBridge.setupAutoSync();
            WidgetBridge.syncAllWidgets();
        });
    } else {
        WidgetBridge.setupAutoSync();
        WidgetBridge.syncAllWidgets();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetBridge;
}
