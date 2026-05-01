class CapacitorBridge {
    constructor() {
        this.isNative = this.checkIfNative();
        this.init();
    }

    checkIfNative() {
        return window.Capacitor !== undefined;
    }

    init() {
        if (!this.isNative) return;

        // Setup Android back button
        this.setupBackButton();

        // Setup status bar
        this.setupStatusBar();

        // Setup splash screen
        this.hideSplash();

        // Setup keyboard handling
        this.setupKeyboard();

        // Setup deep links
        this.setupDeepLinks();

        // Setup app state listeners
        this.setupAppState();
    }

    setupBackButton() {
        const { App } = window.Capacitor.Plugins;

        App.addListener('backButton', ({ canGoBack }) => {
            // Custom handling for specific pages
            const modal = document.querySelector('.modal.active, .shabad-modal, .settings-modal');
            if (modal) {
                modal.classList.remove('active');
                modal.remove?.();
                return;
            }

            if (canGoBack) {
                // Delegate to unified smart-back navigation
                if (window.anhadGoBack) {
                    window.anhadGoBack('../index.html');
                } else {
                    window.history.back();
                }
            } else {
                // Show exit confirmation
                this.showExitConfirmation();
            }
        });
    }

    showExitConfirmation() {
        if (confirm('Exit Gurbani Radio?')) {
            window.Capacitor.Plugins.App.exitApp();
        }
    }

    async setupStatusBar() {
        try {
            if (window.Capacitor.Plugins.StatusBar) {
                const { StatusBar } = window.Capacitor.Plugins;
                await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
                await StatusBar.setStyle({ style: 'DARK' });
            }
        } catch (e) {
            console.warn('[CapacitorBridge] StatusBar setup failed:', e.message);
        }
    }

    async hideSplash() {
        if (window.Capacitor.Plugins.SplashScreen) {
            const { SplashScreen } = window.Capacitor.Plugins;
            await SplashScreen.hide();
        }
    }

    setupKeyboard() {
        if (window.Capacitor.Plugins.Keyboard) {
            const { Keyboard } = window.Capacitor.Plugins;

            Keyboard.addListener('keyboardWillShow', (info) => {
                document.body.classList.add('keyboard-open');
                document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
            });

            Keyboard.addListener('keyboardWillHide', () => {
                document.body.classList.remove('keyboard-open');
                document.body.style.removeProperty('--keyboard-height');
            });
        }
    }

    setupDeepLinks() {
        const { App } = window.Capacitor.Plugins;

        App.addListener('appUrlOpen', (data) => {
            const url = new URL(data.url);
            const path = url.pathname;

            // Handle deep link paths
            if (path.includes('/nitnem')) {
                window.location.href = './nitnem/indexbani.html';
            } else if (path.includes('/tracker')) {
                window.location.href = './NitnemTracker/nitnem-tracker.html';
            }
        });
    }

    setupAppState() {
        const { App } = window.Capacitor.Plugins;

        // Handle app state changes (foreground/background)
        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                // App came to foreground
                console.log('[CapacitorBridge] App is now active');
                document.body.classList.remove('app-in-background');
                
                // Resume audio if it was playing
                if (window.gurbaniRadio?.audioEngine) {
                    window.gurbaniRadio.audioEngine.resume?.();
                }
            } else {
                // App went to background
                console.log('[CapacitorBridge] App is now in background');
                document.body.classList.add('app-in-background');
            }
        });

        // NOTE: appUrlOpen is handled in setupDeepLinks() — do not duplicate here
    }

    // Local notifications for Android
    async scheduleNotification(options) {
        if (this.isNative && window.Capacitor.Plugins.LocalNotifications) {
            const { LocalNotifications } = window.Capacitor.Plugins;

            await LocalNotifications.schedule({
                notifications: [{
                    id: options.id || Date.now(),
                    title: options.title,
                    body: options.body,
                    schedule: { at: options.at },
                    sound: 'default',
                    channelId: 'gurbani-reminders',
                    extra: options.data
                }]
            });
        }
    }

    // Haptic feedback - use unified wrapper
    vibrate(pattern = 'light') {
        if (window.CapacitorHaptics) {
            window.CapacitorHaptics.impact(pattern);
        } else if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

window.capacitorBridge = new CapacitorBridge();
