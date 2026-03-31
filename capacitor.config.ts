import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.gurbaniradio.app',
    appName: 'ANHAD',
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
        // Disable mixed content in production
        allowMixedContent: false,
        // PRODUCTION: Disable WebView debugging
        webContentsDebuggingEnabled: false
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

        // Screen orientation lock
        ScreenOrientation: {
            default: 'portrait'
        },

        // Splash screen configuration
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#000000',
            showSpinner: false,
            androidSpinnerStyle: 'small',
            spinnerColor: '#f7c634'
        }
    }
};

export default config;
