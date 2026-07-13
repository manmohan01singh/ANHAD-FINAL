import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.anhad.app',
    appName: 'Anhad',
    webDir: 'frontend',

    // Server configuration
    // NOTE: Do NOT set server.url in production — Capacitor serves from webDir (frontend/)
    // Only set server.url when developing against a live dev server
    server: {
        androidScheme: 'https',
        cleartext: false
    },

    // Android-specific configuration
    android: {
        // Allow mixed content for live streaming (SGPC)
        allowMixedContent: true,
        // Enable WebView debugging during development ONLY
        webContentsDebuggingEnabled: false,
        // Background audio config
        backgroundColor: '#020205'
    },

    // Plugin configurations
    plugins: {
        // Local Notifications plugin config
        LocalNotifications: {
            // Small icon for status bar (place in android/app/src/main/res/drawable)
            smallIcon: 'ic_stat_notify',
            // Accent color (Gurbani Radio gold)
            iconColor: '#f7c634',
            // Sound for notifications (place in android/app/src/main/res/raw)
            sound: 'notification.wav'
        },

        // Streak Saver Plugin (custom plugin for boot flag)
        StreakSaverPlugin: {
            // No config needed
        },

        // Splash screen configuration
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#020205',
            showSpinner: true,
            spinnerColor: '#f7c634',
            androidSpinnerStyle: 'small',
            spinnerColor: '#f7c634',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP'
        },

        // Widget Data Bridge Plugin
        WidgetDataBridge: {
            // Android widget update interval in minutes
            updateInterval: 15,
            // Enable debug logging
            debug: false
        },

        // Native HTTP Stack — DISABLED to prevent interference with WebView audio loading
        CapacitorHttp: {
            enabled: false
        }
    }
};

export default config;
