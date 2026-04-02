/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPACITOR BRIDGE - Native Storage Adapter
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides seamless fallback from Capacitor Preferences to localStorage.
 * Handles protocol detection for capacitor://, file://, and http(s):// schemes.
 * 
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════════
    // PROTOCOL DETECTION
    // ═══════════════════════════════════════════════════════════════════════════════

    const Protocol = {
        get isCapacitor() {
            return window.Capacitor !== undefined && window.Capacitor.isNativePlatform === true;
        },
        
        get isHttps() {
            return window.location.protocol === 'https:';
        },
        
        get isHttp() {
            return window.location.protocol === 'http:';
        },
        
        get isFile() {
            return window.location.protocol === 'file:';
        },
        
        get canUseNative() {
            return this.isCapacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // STORAGE ADAPTER
    // ═══════════════════════════════════════════════════════════════════════════════

    const CapacitorStorage = {
        _ready: false,
        _initPromise: null,
        _cache: new Map(),
        
        async init() {
            if (this._ready) return true;
            if (this._initPromise) return this._initPromise;
            
            this._initPromise = this._doInit();
            return this._initPromise;
        },
        
        async _doInit() {
            if (!Protocol.canUseNative) {
                console.log('[CapacitorBridge] Using localStorage fallback');
                this._ready = true;
                return true;
            }
            
            try {
                // Test native storage availability
                const { Preferences } = window.Capacitor.Plugins;
                await Preferences.set({ key: '_bridge_test', value: 'ok' });
                const { value } = await Preferences.get({ key: '_bridge_test' });
                if (value === 'ok') {
                    console.log('[CapacitorBridge] Native storage ready');
                    this._ready = true;
                    return true;
                }
            } catch (e) {
                console.warn('[CapacitorBridge] Native storage failed, using fallback:', e.message);
            }
            
            this._ready = true;
            return true;
        },
        
        async get(key, fallback = null) {
            await this.init();
            
            // Check cache first
            if (this._cache.has(key)) {
                return this._cache.get(key);
            }
            
            let value = null;
            
            if (Protocol.canUseNative) {
                try {
                    const { Preferences } = window.Capacitor.Plugins;
                    const result = await Preferences.get({ key });
                    value = result.value;
                } catch (e) {
                    console.warn('[CapacitorBridge] Native get failed:', e.message);
                }
            }
            
            // Fallback to localStorage
            if (value === null) {
                try {
                    value = localStorage.getItem(key);
                } catch (e) {
                    // localStorage might be unavailable
                }
            }
            
            // Parse JSON if needed
            if (value !== null) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Keep as string if not valid JSON
                }
            }
            
            const result = value !== null ? value : fallback;
            this._cache.set(key, result);
            return result;
        },
        
        async set(key, value) {
            await this.init();
            
            // Update cache
            this._cache.set(key, value);
            
            // Stringify for storage
            const stringValue = JSON.stringify(value);
            
            // Try native first
            if (Protocol.canUseNative) {
                try {
                    const { Preferences } = window.Capacitor.Plugins;
                    await Preferences.set({ key, value: stringValue });
                    return true;
                } catch (e) {
                    console.warn('[CapacitorBridge] Native set failed:', e.message);
                }
            }
            
            // Fallback to localStorage
            try {
                localStorage.setItem(key, stringValue);
                return true;
            } catch (e) {
                console.error('[CapacitorBridge] Storage failed:', e.message);
                return false;
            }
        },
        
        async remove(key) {
            await this.init();
            
            this._cache.delete(key);
            
            if (Protocol.canUseNative) {
                try {
                    const { Preferences } = window.Capacitor.Plugins;
                    await Preferences.remove({ key });
                    return true;
                } catch (e) {
                    console.warn('[CapacitorBridge] Native remove failed:', e.message);
                }
            }
            
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        async clear() {
            await this.init();
            
            this._cache.clear();
            
            if (Protocol.canUseNative) {
                try {
                    const { Preferences } = window.Capacitor.Plugins;
                    await Preferences.clear();
                } catch (e) {
                    console.warn('[CapacitorBridge] Native clear failed:', e.message);
                }
            }
            
            try {
                localStorage.clear();
            } catch (e) {
                // Ignore
            }
        },
        
        // Synchronous API for backwards compatibility (returns cached value)
        getSync(key, fallback = null) {
            if (this._cache.has(key)) {
                return this._cache.get(key);
            }
            // Try localStorage synchronously
            try {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    try {
                        return JSON.parse(value);
                    } catch (e) {
                        return value;
                    }
                }
            } catch (e) {
                // localStorage unavailable
            }
            return fallback;
        },
        
        // Queue async set for backwards compatibility
        setSync(key, value) {
            this._cache.set(key, value);
            // Async save
            this.set(key, value).catch(e => {
                console.warn('[CapacitorBridge] Async save failed:', e);
            });
            return true;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // BACK BUTTON HANDLER
    // ═══════════════════════════════════════════════════════════════════════════════

    const BackButton = {
        init() {
            if (!Protocol.isCapacitor) return;
            if (!window.Capacitor.Plugins || !window.Capacitor.Plugins.App) return;
            
            const { App } = window.Capacitor.Plugins;
            
            App.addListener('backButton', ({ canGoBack }) => {
                if (canGoBack) {
                    window.history.back();
                } else {
                    // At root - minimize or show exit confirmation
                    App.minimizeApp || App.exitApp || (() => {
                        console.log('[BackButton] At root, would minimize/exit');
                    })();
                }
            });
            
            console.log('[CapacitorBridge] Back button handler registered');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════

    function init() {
        // Initialize storage
        CapacitorStorage.init().then(() => {
            // Register back button handler
            BackButton.init();
        });
        
        console.log('[CapacitorBridge] Initialized, protocol:', window.location.protocol);
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EXPORTS
    // ═══════════════════════════════════════════════════════════════════════════════

    window.CapacitorBridge = {
        Protocol,
        Storage: CapacitorStorage,
        BackButton,
        
        // Convenience methods matching localStorage API
        getItem: (key, fallback) => CapacitorStorage.getSync(key, fallback),
        setItem: (key, value) => CapacitorStorage.setSync(key, value),
        removeItem: (key) => CapacitorStorage.remove(key),
        clear: () => CapacitorStorage.clear()
    };

})();
