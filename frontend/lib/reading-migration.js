/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD READING PROGRESS MIGRATION ENGINE (EXPORT / IMPORT)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Allows safe cross-device migration of years of Nitnem, My Pothi, Sehaj Paath,
 * and Shabad reading records with validation, conflict resolution, and backups.
 */

(function(window) {
  'use strict';

  if (window.AnhadMigration) return;

  const SCHEMA_VERSION = '1.0';

  function safeParse(key, defaultVal = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function exportReadingProgress(options = {}) {
    const nitnemStreak = safeParse('anhad_streak_data', {}) || safeParse('nitnemTracker_streakData', {});
    const sehajProgress = safeParse('sehajPaathProgress', {}) || safeParse('gurbani_sehajPaath_progress', {});

    const exportBundle = {
      app: 'Anhad',
      version: 1,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      metadata: {
        currentStreak: nitnemStreak?.currentStreak || 0,
        sehajPaathAng: sehajProgress?.currentAng || sehajProgress?.ang || 1,
        platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'web'
      },
      readingProgress: {
        myPothi: {
          order: safeParse('anhad_my_pothi', []),
          completed: safeParse('anhad_my_pothi_completed', []),
          customData: safeParse('anhad_my_pothi_data', {})
        },
        nitnem: {
          progress: safeParse('nitnemTracker_progress', {}),
          streakData: nitnemStreak,
          history: safeParse('nitnemTracker_history', []),
          selectedBanis: safeParse('nitnemTracker_selectedBanis', []),
          nitnemLog: safeParse('nitnemTracker_nitnemLog', {}),
          amritvelaLog: safeParse('nitnemTracker_amritvelaLog', {})
        },
        sehajPaath: {
          progress: sehajProgress,
          state: safeParse('sehajPaathState', {}),
          stats: safeParse('sehajPaathStats', {}),
          bookmarks: safeParse('sehajPaathBookmarks', []),
          history: safeParse('sehajPaathHistory', [])
        },
        shabads: {
          bookmarks: safeParse('gurbani_shabad_bookmarks', []) || safeParse('shabadBookmarks', []),
          favorites: safeParse('gurbani_favorite_shabads', [])
        },
        userStats: safeParse('anhad_user_stats', {}),
        naamAbhyas: safeParse('naam_abhyas_history', [])
      }
    };

    if (options.download === true && typeof document !== 'undefined' && document.createElement) {
      const jsonStr = JSON.stringify(exportBundle, null, 2);
      downloadJson(jsonStr, `anhad-reading-progress-${new Date().toISOString().split('T')[0]}.json`);
    }
    return exportBundle;
  }

  function downloadJson(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function validateImport(rawJson) {
    try {
      const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'File is not a valid JSON object' };
      }
      if (data.app !== 'Anhad') {
        return { valid: false, error: 'Not a recognized Anhad progress export file' };
      }
      if (!data.readingProgress) {
        return { valid: false, error: 'Missing readingProgress payload' };
      }

      const p = data.readingProgress;
      const summary = {
        pothiBanis: (p.myPothi && p.myPothi.order) ? p.myPothi.order.length : 0,
        sehajPaathAng: p.sehajPaath?.progress?.currentAng || p.sehajPaath?.progress?.ang || 0,
        shabadBookmarks: p.shabads?.bookmarks?.length || 0,
        streakDays: p.nitnem?.streakData?.currentStreak || data.metadata?.currentStreak || 0,
        exportedAt: data.exportedAt || 'Unknown'
      };

      return { valid: true, data, summary };
    } catch (e) {
      return { valid: false, error: 'JSON Parse error: ' + e.message };
    }
  }

  function createLocalBackup() {
    const backupKeys = [
      'anhad_my_pothi', 'anhad_my_pothi_completed', 'anhad_my_pothi_data',
      'nitnemTracker_progress', 'anhad_streak_data', 'nitnemTracker_streakData',
      'nitnemTracker_history', 'nitnemTracker_selectedBanis',
      'sehajPaathProgress', 'sehajPaathState', 'sehajPaathBookmarks',
      'gurbani_shabad_bookmarks', 'gurbani_favorite_shabads', 'anhad_user_stats'
    ];

    const backup = {};
    backupKeys.forEach(k => {
      backup[k] = localStorage.getItem(k);
    });
    localStorage.setItem('anhad_migration_backup', JSON.stringify({
      timestamp: new Date().toISOString(),
      keys: backup
    }));
  }

  function restoreBackup() {
    const raw = safeParse('anhad_migration_backup');
    if (!raw || !raw.keys) return false;
    Object.keys(raw.keys).forEach(k => {
      if (raw.keys[k] !== null) localStorage.setItem(k, raw.keys[k]);
      else localStorage.removeItem(k);
    });
    return true;
  }

  function importReadingProgress(exportBundle, options = 'merge') {
    const mode = typeof options === 'string' ? options : (options.mode || 'merge');
    const validation = validateImport(exportBundle);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    createLocalBackup();
    const p = validation.data.readingProgress;

    if (mode === 'replace') {
      // Direct replace
      if (p.myPothi) {
        if (p.myPothi.order) localStorage.setItem('anhad_my_pothi', JSON.stringify(p.myPothi.order));
        if (p.myPothi.completed) localStorage.setItem('anhad_my_pothi_completed', JSON.stringify(p.myPothi.completed));
        if (p.myPothi.customData) localStorage.setItem('anhad_my_pothi_data', JSON.stringify(p.myPothi.customData));
      }
      if (p.nitnem) {
        if (p.nitnem.progress) localStorage.setItem('nitnemTracker_progress', JSON.stringify(p.nitnem.progress));
        if (p.nitnem.streakData) {
          localStorage.setItem('anhad_streak_data', JSON.stringify(p.nitnem.streakData));
          localStorage.setItem('nitnemTracker_streakData', JSON.stringify(p.nitnem.streakData));
        }
        if (p.nitnem.history) localStorage.setItem('nitnemTracker_history', JSON.stringify(p.nitnem.history));
        if (p.nitnem.selectedBanis) localStorage.setItem('nitnemTracker_selectedBanis', JSON.stringify(p.nitnem.selectedBanis));
      }
      if (p.sehajPaath) {
        if (p.sehajPaath.progress) {
          localStorage.setItem('sehajPaathProgress', JSON.stringify(p.sehajPaath.progress));
          localStorage.setItem('gurbani_sehajPaath_progress', JSON.stringify(p.sehajPaath.progress));
        }
        if (p.sehajPaath.state) localStorage.setItem('sehajPaathState', JSON.stringify(p.sehajPaath.state));
        if (p.sehajPaath.stats) localStorage.setItem('sehajPaathStats', JSON.stringify(p.sehajPaath.stats));
        if (p.sehajPaath.bookmarks) localStorage.setItem('sehajPaathBookmarks', JSON.stringify(p.sehajPaath.bookmarks));
      }
      if (p.shabads) {
        if (p.shabads.bookmarks) localStorage.setItem('gurbani_shabad_bookmarks', JSON.stringify(p.shabads.bookmarks));
        if (p.shabads.favorites) localStorage.setItem('gurbani_favorite_shabads', JSON.stringify(p.shabads.favorites));
      }
      if (p.userStats) localStorage.setItem('anhad_user_stats', JSON.stringify(p.userStats));
    } else {
      // Smart Merge
      if (p.myPothi?.order) {
        const existingOrder = safeParse('anhad_my_pothi', []);
        const mergedOrder = Array.from(new Set([...existingOrder, ...p.myPothi.order]));
        localStorage.setItem('anhad_my_pothi', JSON.stringify(mergedOrder));
      }

      if (p.nitnem?.streakData) {
        const existingStreak = safeParse('anhad_streak_data', { currentStreak: 0, longestStreak: 0 });
        const mergedStreak = {
          currentStreak: Math.max(existingStreak.currentStreak || 0, p.nitnem.streakData.currentStreak || 0),
          longestStreak: Math.max(existingStreak.longestStreak || 0, p.nitnem.streakData.longestStreak || 0),
          lastCompletedDate: p.nitnem.streakData.lastCompletedDate || existingStreak.lastCompletedDate
        };
        localStorage.setItem('anhad_streak_data', JSON.stringify(mergedStreak));
        localStorage.setItem('nitnemTracker_streakData', JSON.stringify(mergedStreak));
      }

      if (p.sehajPaath?.progress) {
        const existingSehaj = safeParse('sehajPaathProgress', { currentAng: 1 });
        const existingAng = existingSehaj.currentAng || existingSehaj.ang || 1;
        const incomingAng = p.sehajPaath.progress.currentAng || p.sehajPaath.progress.ang || 1;
        const targetAng = Math.max(existingAng, incomingAng);
        const mergedSehaj = Object.assign({}, existingSehaj, p.sehajPaath.progress, { currentAng: targetAng });
        localStorage.setItem('sehajPaathProgress', JSON.stringify(mergedSehaj));
        localStorage.setItem('gurbani_sehajPaath_progress', JSON.stringify(mergedSehaj));
      }

      if (p.shabads?.bookmarks) {
        const existingBookmarks = safeParse('gurbani_shabad_bookmarks', []);
        const idMap = new Map();
        existingBookmarks.forEach(b => idMap.set(b.id || b.shabadId || JSON.stringify(b), b));
        p.shabads.bookmarks.forEach(b => idMap.set(b.id || b.shabadId || JSON.stringify(b), b));
        localStorage.setItem('gurbani_shabad_bookmarks', JSON.stringify(Array.from(idMap.values())));
      }
    }

    window.dispatchEvent(new CustomEvent('anhad_progress_migrated', { detail: { mode } }));
    return { success: true };
  }


  function downloadExportFile() {
    return exportReadingProgress({ download: true });
  }

  async function importFromFile(file, options = {}) {
    return new Promise((resolve) => {
      if (!file) return resolve({ success: false, error: 'No file selected' });
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const res = importReadingProgress(parsed, options);
          resolve(res);
        } catch (err) {
          resolve({ success: false, error: 'Invalid JSON file: ' + err.message });
        }
      };
      reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
      reader.readAsText(file);
    });
  }

  window.AnhadMigration = {
    exportReadingProgress,
    validateImport,
    importReadingProgress,
    restoreBackup,
    SCHEMA_VERSION,
    // Aliases for standard integration
    generateExportPayload: exportReadingProgress,
    validateSchema: validateImport,
    importFromJson: importReadingProgress,
    downloadExportFile: downloadExportFile,
    importFromFile: importFromFile
  };
  window.ReadingMigration = window.AnhadMigration;
})(typeof window !== 'undefined' ? window : globalThis);
