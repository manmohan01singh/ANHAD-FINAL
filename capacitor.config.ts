import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.gurbaniradio.app',
    appName: 'ANHAD',
    webDir: 'frontend',

    // Server configuration for development
    server: {
        url: 'https://anhad-final.onrender.com',
        androidScheme: 'https',
        cleartext: false // Require HTTPS in production
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
