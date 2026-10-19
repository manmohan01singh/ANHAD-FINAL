/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FIREBASE & CLOUD SYNC ENGINE v2.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * Provides zero-data-loss cloud synchronization for:
 * - Nitnem Tracker progress, logs, mala count, streak saver punishments
 * - Authoritative Streaks & Streak Restore Challenges
 * - Sehaj Paath completed Ang, percentage, bookmarks, and history
 * - Naam Abhyas hourly schedule, history, and completions
 * - My Pothi custom Banis, order, and completion states
 * - Shabads bookmarks, favorites, and notes
 * - App settings & theme
 * 
 * Works seamlessly with Google Sign-In, Firebase Auth, or 8-digit Transfer Code.
 */

(function(window) {
  'use strict';

  if (window.AnhadCloudSync) return;

  const SYNC_META_KEY = 'anhad_cloud_sync_meta';
  let syncDebounceTimer = null;
  let isSyncing = false;

  function safeParse(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function getApiBase() {
    return (window.AnhadFriends && window.AnhadFriends.API_BASE) ||
      (typeof window !== 'undefined' && window.ANHAD_API_BASE) ||
      '';
  }

  async function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    let token = null;

    if (window.AnhadAuth && typeof window.AnhadAuth.getIdToken === 'function') {
      token = await window.AnhadAuth.getIdToken();
    } else if (window.AnhadFirebase && typeof window.AnhadFirebase.getIdToken === 'function') {
      token = await window.AnhadFirebase.getIdToken();
    }

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    } else {
      let profile = (window.AnhadAuth && typeof window.AnhadAuth.getProfile === 'function')
        ? window.AnhadAuth.getProfile()
        : safeParse('anhad_user_profile', null);
      if (!profile || !profile.uid) {
        let guestId = localStorage.getItem('anhad_guest_id');
        if (!guestId) {
          guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('anhad_guest_id', guestId);
        }
        profile = { uid: guestId, displayName: 'Guest Sevadar', isAnonymous: true, isGuest: true };
        localStorage.setItem('anhad_user_profile', JSON.stringify(profile));
      }
      headers['Authorization'] = 'Bearer ' + profile.uid;
    }
    return headers;
  }

  /**
   * Collect the full application state bundle from localStorage
   */
  function collectFullAppBundle() {
    const nitnemStreak = safeParse('anhad_streak_data', {}) || safeParse('nitnemTracker_streakData', {});
    const sehajProgress = safeParse('sehajPaathProgress', {}) || safeParse('gurbani_sehajPaath_progress', {});
    const authStreak = safeParse('anhad_authoritative_streak_state', {});

    return {
      app: 'Anhad',
      version: 2,
      schemaVersion: '2.0',
      backedUpAt: new Date().toISOString(),
      metadata: {
        currentStreak: authStreak.currentStreak || nitnemStreak?.currentStreak || 0,
        longestStreak: authStreak.longestStreak || nitnemStreak?.longestStreak || 0,
        sehajPaathAng: sehajProgress?.currentAng || sehajProgress?.ang || 1,
        platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'web'
      },
      nitnem: {
        progress: safeParse('nitnemTracker_progress', {}),
        streakData: nitnemStreak,
        history: safeParse('nitnemTracker_history', []),
        selectedBanis: safeParse('nitnemTracker_selectedBanis', []),
        nitnemLog: safeParse('nitnemTracker_nitnemLog', {}),
        amritvelaLog: safeParse('nitnemTracker_amritvelaLog', {}),
        malaLog: safeParse('nitnemTracker_malaLog', {}),
        malaCounter: safeParse('anhad_mala_counter_v1', {}),
        streakSaver: safeParse('nitnemTracker_streakSaver', null),
        punishmentUsage: safeParse('nitnemTracker_punishmentUsage', null),
        userData: safeParse('nitnemTracker_userData', {}),
        settings: safeParse('nitnemTracker_settings', {}),
        achievements: safeParse('nitnemTracker_achievements', []),
        dailyGoals: safeParse('anhad_daily_goals', {})
      },
      authoritativeStreak: {
        ...authStreak,
        restoreChallenge: safeParse('anhad_streak_restore_challenge', null)
      },
      sehajPaath: {
        progress: sehajProgress,
        state: safeParse('sehajPaathState', {}),
        stats: safeParse('sehajPaathStats', {}),
        bookmarks: safeParse('sehajPaathBookmarks', []),
        bookmarkFolders: safeParse('sehajPaathBookmarkFolders', []),
        history: safeParse('sehajPaathHistory', []),
        notes: safeParse('sehajPaathNotes', {}),
        achievements: safeParse('sehajPaathAchievements', [])
      },
      naamAbhyas: {
        config: safeParse('naam_abhyas_config', {}),
        schedule: safeParse('naam_abhyas_schedule', {}),
        history: safeParse('naam_abhyas_history', {}),
        completionRecords: safeParse('naam_abhyas_completion_records_v1', {})
      },
      myPothi: {
        order: safeParse('anhad_my_pothi', []),
        completed: safeParse('anhad_my_pothi_completed', []),
        customData: safeParse('anhad_my_pothi_data', {}),
        snapshots: safeParse('anhad_pothi_snapshots', []),
        additions: safeParse('anhad_pothi_bani_additions', [])
      },
      shabads: {
        bookmarks: safeParse('gurbani_shabad_bookmarks', []) || safeParse('shabadBookmarks', []),
        favorites: safeParse('gurbani_favorite_shabads', [])
      },
      reminders: {
        smartReminders: safeParse('sr_reminders_v4', null) || safeParse('sr_reminders_v3', null) || safeParse('smart_reminders_v1', null),
        spiritualConfig: safeParse('spiritual_notifications_config', null),
        gurupurab: safeParse('gurupurab_reminders', null)
      },
      userPreferences: {
        theme: localStorage.getItem('anhad_theme') || 'auto',
        timeOfDay: localStorage.getItem('anhad_forced_time_of_day') || null,
        userStats: safeParse('anhad_user_stats', {}),
        profile: safeParse('anhad_user_profile', {})
      }
    };
  }

  /**
   * Perform immediate cloud backup
   */
  async function backupNow(options = {}) {
    if (isSyncing) return { ok: false, error: 'Sync already in progress' };
    isSyncing = true;

    try {
      const bundle = collectFullAppBundle();
      const headers = await getAuthHeaders();
      const apiBase = getApiBase();
      const storedMeta = safeParse(SYNC_META_KEY, {});

      const res = await fetch(apiBase + '/api/user/cloud-backup', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bundle,
          syncCode: options.syncCode || storedMeta.syncCode || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        const syncMeta = {
          lastBackupAt: data.backedUpAt || new Date().toISOString(),
          syncCode: data.syncCode,
          summary: data.summary,
          status: 'synced'
        };
        localStorage.setItem(SYNC_META_KEY, JSON.stringify(syncMeta));
        window.dispatchEvent(new CustomEvent('anhad_cloud_backup_success', { detail: syncMeta }));
        console.log('[AnhadCloudSync] Cloud backup successful. Sync code:', data.syncCode);
        return {
          ok: true,
          syncCode: data.syncCode,
          data: syncMeta,
          summary: data.summary,
          backedUpAt: data.backedUpAt
        };
      } else {
        throw new Error(data.error || 'Server rejected cloud backup');
      }
    } catch (err) {
      console.warn('[AnhadCloudSync] Cloud backup notice:', err.message);
      return { ok: false, error: err.message };
    } finally {
      isSyncing = false;
    }
  }

  /**
   * Apply a restored backup bundle cleanly into localStorage
   */
  function applyRestoredBundle(bundle, mode = 'merge') {
    if (!bundle || typeof bundle !== 'object') return false;

    // 1. Nitnem
    if (bundle.nitnem) {
      const n = bundle.nitnem;
      if (n.progress) localStorage.setItem('nitnemTracker_progress', JSON.stringify(n.progress));
      if (n.streakData) {
        localStorage.setItem('anhad_streak_data', JSON.stringify(n.streakData));
        localStorage.setItem('nitnemTracker_streakData', JSON.stringify(n.streakData));
      }
      if (n.history) localStorage.setItem('nitnemTracker_history', JSON.stringify(n.history));
      if (n.selectedBanis) localStorage.setItem('nitnemTracker_selectedBanis', JSON.stringify(n.selectedBanis));
      if (n.nitnemLog) localStorage.setItem('nitnemTracker_nitnemLog', JSON.stringify(n.nitnemLog));
      if (n.amritvelaLog) localStorage.setItem('nitnemTracker_amritvelaLog', JSON.stringify(n.amritvelaLog));
      if (n.malaLog) localStorage.setItem('nitnemTracker_malaLog', JSON.stringify(n.malaLog));
      if (n.malaCounter) localStorage.setItem('anhad_mala_counter_v1', JSON.stringify(n.malaCounter));
      if (n.streakSaver) localStorage.setItem('nitnemTracker_streakSaver', JSON.stringify(n.streakSaver));
      if (n.punishmentUsage) localStorage.setItem('nitnemTracker_punishmentUsage', JSON.stringify(n.punishmentUsage));
      if (n.userData) localStorage.setItem('nitnemTracker_userData', JSON.stringify(n.userData));
      if (n.settings) localStorage.setItem('nitnemTracker_settings', JSON.stringify(n.settings));
      if (n.achievements) localStorage.setItem('nitnemTracker_achievements', JSON.stringify(n.achievements));
      if (n.dailyGoals) localStorage.setItem('anhad_daily_goals', JSON.stringify(n.dailyGoals));
    }

    // 2. Authoritative Streaks
    if (bundle.authoritativeStreak) {
      const a = bundle.authoritativeStreak;
      const streakEngine = window.AuthoritativeStreakEngine;
      if (streakEngine && typeof streakEngine.saveState === 'function') {
        streakEngine.saveState(a);
      } else {
        localStorage.setItem('anhad_authoritative_streak_state', JSON.stringify(a));
      }
      if (a.restoreChallenge) {
        localStorage.setItem('anhad_streak_restore_challenge', JSON.stringify(a.restoreChallenge));
      }
    }

    // 3. Sehaj Paath
    if (bundle.sehajPaath) {
      const s = bundle.sehajPaath;
      if (s.progress) {
        localStorage.setItem('sehajPaathProgress', JSON.stringify(s.progress));
        localStorage.setItem('gurbani_sehajPaath_progress', JSON.stringify(s.progress));
      }
      if (s.state) localStorage.setItem('sehajPaathState', JSON.stringify(s.state));
      if (s.stats) localStorage.setItem('sehajPaathStats', JSON.stringify(s.stats));
      if (s.bookmarks) localStorage.setItem('sehajPaathBookmarks', JSON.stringify(s.bookmarks));
      if (s.bookmarkFolders) localStorage.setItem('sehajPaathBookmarkFolders', JSON.stringify(s.bookmarkFolders));
      if (s.history) localStorage.setItem('sehajPaathHistory', JSON.stringify(s.history));
      if (s.notes) localStorage.setItem('sehajPaathNotes', JSON.stringify(s.notes));
      if (s.achievements) localStorage.setItem('sehajPaathAchievements', JSON.stringify(s.achievements));
    }

    // 4. Naam Abhyas
    if (bundle.naamAbhyas) {
      const nm = bundle.naamAbhyas;
      if (nm.config && Object.keys(nm.config).length > 0) {
        localStorage.setItem('naam_abhyas_config', JSON.stringify(nm.config));
      }
      if (nm.schedule && Object.keys(nm.schedule).length > 0) {
        localStorage.setItem('naam_abhyas_schedule', JSON.stringify(nm.schedule));
      }
      if (nm.history && (Array.isArray(nm.history) || Object.keys(nm.history).length > 0)) {
        localStorage.setItem('naam_abhyas_history', JSON.stringify(nm.history));
      }
      if (nm.completionRecords) {
        localStorage.setItem('naam_abhyas_completion_records_v1', JSON.stringify(nm.completionRecords));
      }
    }

    // 5. My Pothi
    if (bundle.myPothi) {
      const p = bundle.myPothi;
      if (p.order) localStorage.setItem('anhad_my_pothi', JSON.stringify(p.order));
      if (p.completed) localStorage.setItem('anhad_my_pothi_completed', JSON.stringify(p.completed));
      if (p.customData) localStorage.setItem('anhad_my_pothi_data', JSON.stringify(p.customData));
      if (p.snapshots) localStorage.setItem('anhad_pothi_snapshots', JSON.stringify(p.snapshots));
      if (p.additions) localStorage.setItem('anhad_pothi_bani_additions', JSON.stringify(p.additions));
    }

    // 6. Shabads & Bookmarks
    if (bundle.shabads) {
      const sh = bundle.shabads;
      if (sh.bookmarks) {
        localStorage.setItem('gurbani_shabad_bookmarks', JSON.stringify(sh.bookmarks));
        localStorage.setItem('shabadBookmarks', JSON.stringify(sh.bookmarks));
      }
      if (sh.favorites) {
        localStorage.setItem('gurbani_favorite_shabads', JSON.stringify(sh.favorites));
      }
    }

    // 7. Reminders & Alarms Configuration
    if (bundle.reminders) {
      const r = bundle.reminders;
      if (r.smartReminders) {
        localStorage.setItem('sr_reminders_v4', JSON.stringify(r.smartReminders));
      }
      if (r.spiritualConfig) {
        localStorage.setItem('spiritual_notifications_config', JSON.stringify(r.spiritualConfig));
      }
      if (r.gurupurab) {
        localStorage.setItem('gurupurab_reminders', JSON.stringify(r.gurupurab));
      }
    }

    // 8. Preferences
    if (bundle.userPreferences) {
      const pref = bundle.userPreferences;
      if (pref.theme) localStorage.setItem('anhad_theme', pref.theme);
      if (pref.timeOfDay) localStorage.setItem('anhad_forced_time_of_day', pref.timeOfDay);
      if (pref.userStats) localStorage.setItem('anhad_user_stats', JSON.stringify(pref.userStats));
    }

    // Dispatch global events to refresh all UI components immediately
    window.dispatchEvent(new CustomEvent('anhad_progress_migrated', { detail: { mode, bundle } }));
    window.dispatchEvent(new CustomEvent('nitnemUpdate', { detail: { restored: true } }));
    window.dispatchEvent(new CustomEvent('storage'));

    return true;
  }

  /**
   * Restore user's backup from cloud account
   */
  async function restoreFromCloud() {
    try {
      const headers = await getAuthHeaders();
      const apiBase = getApiBase();
      const res = await fetch(apiBase + '/api/user/cloud-restore', {
        method: 'GET',
        headers
      });

      const data = await res.json();
      if (res.ok && data.ok && data.backup) {
        applyRestoredBundle(data.backup);
        localStorage.setItem(SYNC_META_KEY, JSON.stringify({
          lastBackupAt: data.backup.backedUpAt || new Date().toISOString(),
          syncCode: data.backup.syncCode,
          summary: data.summary,
          status: 'restored'
        }));
        return { ok: true, summary: data.summary, backup: data.backup };
      } else {
        return { ok: false, error: data.error || 'No backup found' };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Restore using an 8-character Transfer Sync Code
   */
  async function restoreByCode(syncCode) {
    if (!syncCode || typeof syncCode !== 'string') {
      return { ok: false, error: 'Transfer code is required' };
    }
    const cleanCode = syncCode.trim().toUpperCase();

    try {
      const apiBase = getApiBase();
      const res = await fetch(apiBase + '/api/user/cloud-restore-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncCode: cleanCode })
      });

      const data = await res.json();
      if (res.ok && data.ok && data.backup) {
        applyRestoredBundle(data.backup);
        localStorage.setItem(SYNC_META_KEY, JSON.stringify({
          lastBackupAt: data.backup.backedUpAt || new Date().toISOString(),
          syncCode: cleanCode,
          summary: data.summary,
          status: 'restored'
        }));
        return { ok: true, summary: data.summary, backup: data.backup };
      } else {
        return { ok: false, error: data.error || 'Invalid or expired sync code' };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Debounced sync (invoked on Nitnem/Naam/Sehaj progress update)
   * Auto-syncs for BOTH signed-in and guest users so data is never lost!
   */
  function triggerDebouncedSync(delayMs = 4000) {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      syncDebounceTimer = null;
      const profile = (window.AnhadAuth && typeof window.AnhadAuth.getProfile === 'function')
        ? window.AnhadAuth.getProfile()
        : safeParse('anhad_user_profile', null);
      if (profile && profile.uid) {
        backupNow();
      }
    }, delayMs);
  }

  /**
   * Check cloud status
   */
  async function getStatus() {
    const meta = safeParse(SYNC_META_KEY, {});
    const bundle = collectFullAppBundle();
    return {
      lastBackupAt: meta.lastBackupAt || null,
      syncCode: meta.syncCode || null,
      localStreak: bundle.metadata.currentStreak,
      localSehajAng: bundle.metadata.sehajPaathAng,
      isConfigured: !!meta.lastBackupAt
    };
  }

  // Setup auto-listeners for devotional progress milestones
  window.addEventListener('nitnemUpdate', () => triggerDebouncedSync());
  window.addEventListener('naamAbhyasSessionComplete', () => triggerDebouncedSync());
  window.addEventListener('sehajPaathAngRead', () => triggerDebouncedSync());
  window.addEventListener('anhad_auth_changed', (e) => {
    const profile = e.detail?.profile;
    if (profile && !profile.isAnonymous && profile.uid) {
      // Check if user has remote cloud backup on login
      restoreFromCloud().then(res => {
        if (!res.ok) {
          // No remote backup yet — create first one!
          backupNow();
        }
      });
    }
  });

  window.AnhadCloudSync = {
    collectFullAppBundle,
    backupNow,
    restoreFromCloud,
    restoreByCode,
    triggerDebouncedSync,
    applyRestoredBundle,
    getStatus
  };

})(typeof window !== 'undefined' ? window : globalThis);
