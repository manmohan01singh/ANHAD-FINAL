import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.gurbaniradio.app',
    appName: 'Gurbani Radio',
    webDir: 'frontend',

    // Server configuration for development
    server: {
        androidScheme: 'https',
        cleartext: true // Allow HTTP for local development
    },

    // Android-specific configuration
    android: {
        // Allow mixed content for development
        allowMixedContent: true,
        // Use legacy storage for older Android versions
        webContentsDebuggingEnabled: true
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
