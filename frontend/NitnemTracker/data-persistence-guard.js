/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PERSISTENCE GUARD
 * Ensures ALL user data is ALWAYS stored and never lost
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Triple redundancy: localStorage + IndexedDB + backup
 * - Automatic recovery from corruption
 * - Periodic integrity checks
 * - Data validation before save
 * - Automatic backups
 */

(function() {
    'use strict';

    const STORAGE_KEYS = {
        USER_DATA: 'nitnemTracker_userData',
        SETTINGS: 'nitnemTracker_settings',
        AMRITVELA_LOG: 'nitnemTracker_amritvelaLog',
        NITNEM_LOG: 'nitnemTracker_nitnemLog',
        MALA_LOG: 'nitnemTracker_malaLog',
        ALARM_LOG: 'nitnemTracker_alarmLog',
        STREAK_DATA: 'nitnemTracker_streakData',
        ACHIEVEMENTS: 'nitnemTracker_achievements',
        SELECTED_BANIS: 'nitnemTracker_selectedBanis',
        THEME: 'nitnemTracker_theme'
    };

    const BACKUP_KEY = 'nitnemTracker_backup';
    const INTEGRITY_CHECK_INTERVAL = 60000; // 1 minute
    const BACKUP_INTERVAL = 300000; // 5 minutes

    let integrityCheckTimer = null;
    let backupTimer = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════

    function validateData(key, data) {
        if (data === null || data === undefined) {
            return false;
        }

        // Type-specific validation
        switch (key) {
            case STORAGE_KEYS.AMRITVELA_LOG:
            case STORAGE_KEYS.NITNEM_LOG:
            case STORAGE_KEYS.MALA_LOG:
            case STORAGE_KEYS.ALARM_LOG:
                return typeof data === 'object' && !Array.isArray(data);
            
            case STORAGE_KEYS.SELECTED_BANIS:
                return typeof data === 'object';
            
            case STORAGE_KEYS.STREAK_DATA:
                return typeof data === 'object' && 
                       typeof data.currentStreak === 'number';
            
            case STORAGE_KEYS.THEME:
                return typeof data === 'string' && 
                       (data === 'light' || data === 'dark');
            
            default:
                return true;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SAFE STORAGE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function safeLoad(key, defaultValue = null) {
        try {
            // Try localStorage first
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                try {
                    const parsed = JSON.parse(stored);
                    if (validateData(key, parsed)) {
                        return parsed;
                    } else {
                        console.warn(`[DataGuard] Invalid data for ${key}, attempting recovery...`);
                        return recoverData(key, defaultValue);
                    }
                } catch (parseError) {
                    // Handle non-JSON values (like theme string)
                    if (typeof stored === 'string' && key === STORAGE_KEYS.THEME) {
                        return stored;
                    }
                    console.error(`[DataGuard] Parse error for ${key}:`, parseError);
                    return recoverData(key, defaultValue);
                }
            }
            
            // Try recovery if not found
            return recoverData(key, defaultValue);
        } catch (error) {
            console.error(`[DataGuard] Load error for ${key}:`, error);
            return defaultValue;
        }
    }

    function safeSave(key, data) {
        try {
            // Validate before saving
            if (!validateData(key, data)) {
                console.error(`[DataGuard] Invalid data for ${key}, save aborted`);
                return false;
            }

            // Save to localStorage
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            
            // Also save to IndexedDB for redundancy
            persistToIndexedDB(key, data);
            
            // Update backup
            updateBackup(key, data);
            
            console.log(`[DataGuard] ✅ Saved ${key}`);
            return true;
        } catch (error) {
            console.error(`[DataGuard] Save error for ${key}:`, error);
            
            // Try emergency backup
            try {
                const emergencyKey = `${key}_emergency`;
                localStorage.setItem(emergencyKey, JSON.stringify(data));
                console.log(`[DataGuard] 🚨 Emergency backup created for ${key}`);
            } catch (emergencyError) {
                console.error(`[DataGuard] Emergency backup failed:`, emergencyError);
            }
            
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA RECOVERY
    // ═══════════════════════════════════════════════════════════════════════════

    async function recoverData(key, defaultValue) {
        console.log(`[DataGuard] 🔄 Attempting recovery for ${key}...`);
        
        // Try IndexedDB
        try {
            if (window.GurbaniStorage && window.GurbaniStorage.isReady) {
                const recovered = await window.GurbaniStorage.get('nitnemTracker', key);
                if (recovered && validateData(key, recovered)) {
                    console.log(`[DataGuard] ✅ Recovered ${key} from IndexedDB`);
                    localStorage.setItem(key, JSON.stringify(recovered));
                    return recovered;
                }
            }
        } catch (idbError) {
            console.warn(`[DataGuard] IndexedDB recovery failed:`, idbError);
        }
        
        // Try backup
        try {
            const backup = getBackup();
            if (backup && backup[key] && validateData(key, backup[key])) {
                console.log(`[DataGuard] ✅ Recovered ${key} from backup`);
                localStorage.setItem(key, JSON.stringify(backup[key]));
                return backup[key];
            }
        } catch (backupError) {
            console.warn(`[DataGuard] Backup recovery failed:`, backupError);
        }
        
        // Try emergency backup
        try {
            const emergencyKey = `${key}_emergency`;
            const emergency = localStorage.getItem(emergencyKey);
            if (emergency) {
                const parsed = JSON.parse(emergency);
                if (validateData(key, parsed)) {
                    console.log(`[DataGuard] ✅ Recovered ${key} from emergency backup`);
                    localStorage.setItem(key, emergency);
                    return parsed;
                }
            }
        } catch (emergencyError) {
            console.warn(`[DataGuard] Emergency recovery failed:`, emergencyError);
        }
        
        console.warn(`[DataGuard] ⚠️ Could not recover ${key}, using default value`);
        return defaultValue;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INDEXEDDB PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════

    async function persistToIndexedDB(key, data) {
        try {
            if (!window.GurbaniStorage) return;
            
            if (!window.GurbaniStorage.isReady) {
                await window.GurbaniStorage.init();
            }
            
            await window.GurbaniStorage.set('nitnemTracker', key, data);
        } catch (error) {
            console.warn(`[DataGuard] IndexedDB persist error (non-fatal):`, error);
        }
    }

    async function persistAllToIndexedDB() {
        try {
            if (!window.GurbaniStorage) return;
            
            const allData = {};
            Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
                const data = safeLoad(key);
                if (data !== null) {
                    allData[name] = data;
                }
            });
            
            await window.GurbaniStorage.set('nitnemTracker', 'all_data', allData);
            console.log('[DataGuard] ✅ All data persisted to IndexedDB');
        } catch (error) {
            console.warn('[DataGuard] Bulk persist error:', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BACKUP SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function getBackup() {
        try {
            const stored = localStorage.getItem(BACKUP_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }

    function updateBackup(key, data) {
        try {
            const backup = getBackup();
            backup[key] = data;
            backup.lastBackup = Date.now();
            localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
        } catch (e) {
            console.warn('[DataGuard] Backup update failed:', e);
        }
    }

    function createFullBackup() {
        try {
            const backup = {
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
                const data = safeLoad(key);
                if (data !== null) {
                    backup[key] = data;
                }
            });
            
            localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
            console.log('[DataGuard] ✅ Full backup created');
            
            return backup;
        } catch (e) {
            console.error('[DataGuard] Full backup failed:', e);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTEGRITY CHECKS
    // ═══════════════════════════════════════════════════════════════════════════

    function checkIntegrity() {
        let issuesFound = 0;
        let issuesFixed = 0;
        
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            try {
                const stored = localStorage.getItem(key);
                if (stored !== null) {
                    const parsed = JSON.parse(stored);
                    if (!validateData(key, parsed)) {
                        console.warn(`[DataGuard] Integrity issue found in ${key}`);
                        issuesFound++;
                        
                        // Attempt recovery
                        const recovered = recoverData(key, null);
                        if (recovered !== null) {
                            issuesFixed++;
                        }
                    }
                }
            } catch (e) {
                console.warn(`[DataGuard] Integrity check error for ${key}:`, e);
                issuesFound++;
            }
        });
        
        if (issuesFound > 0) {
            console.log(`[DataGuard] 🔍 Integrity check: ${issuesFound} issues found, ${issuesFixed} fixed`);
        }
        
        return { issuesFound, issuesFixed };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOMATIC MONITORING
    // ═══════════════════════════════════════════════════════════════════════════

    function startMonitoring() {
        // Periodic integrity checks
        integrityCheckTimer = setInterval(() => {
            checkIntegrity();
        }, INTEGRITY_CHECK_INTERVAL);
        
        // Periodic backups
        backupTimer = setInterval(() => {
            createFullBackup();
            persistAllToIndexedDB();
        }, BACKUP_INTERVAL);
        
        console.log('[DataGuard] 🛡️ Monitoring started');
    }

    function stopMonitoring() {
        if (integrityCheckTimer) {
            clearInterval(integrityCheckTimer);
            integrityCheckTimer = null;
        }
        
        if (backupTimer) {
            clearInterval(backupTimer);
            backupTimer = null;
        }
        
        console.log('[DataGuard] 🛡️ Monitoring stopped');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('[DataGuard] 🚀 Initializing Data Persistence Guard...');
        
        // Initial integrity check
        const result = checkIntegrity();
        
        // Create initial backup if needed
        const backup = getBackup();
        if (!backup.timestamp || Date.now() - backup.timestamp > BACKUP_INTERVAL) {
            createFullBackup();
        }
        
        // Persist to IndexedDB
        persistAllToIndexedDB();
        
        // Start monitoring
        startMonitoring();
        
        console.log('[DataGuard] ✅ Data Persistence Guard active');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        // Final backup before leaving
        createFullBackup();
        persistAllToIndexedDB();
        stopMonitoring();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPOSE API
    // ═══════════════════════════════════════════════════════════════════════════

    window.DataPersistenceGuard = {
        // Safe operations
        safeLoad,
        safeSave,
        
        // Recovery
        recoverData,
        
        // Backup
        createFullBackup,
        getBackup,
        
        // Integrity
        checkIntegrity,
        
        // Monitoring
        startMonitoring,
        stopMonitoring,
        
        // Manual operations
        persistAllToIndexedDB,
        
        // Storage keys
        STORAGE_KEYS
    };

    console.log('[DataGuard] ✅ Data Persistence Guard System loaded');
})();
