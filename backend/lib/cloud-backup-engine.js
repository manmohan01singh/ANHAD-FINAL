/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD CLOUD BACKUP & FIREBASE STORAGE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Provides server-authoritative, persistent storage and cross-device restoration
 * of all user spiritual records:
 * - Nitnem Tracker progress, logs, mala count, streak saver states
 * - Authoritative Streaks & Streak Restore Challenge
 * - Sehaj Paath reading progress, bookmarks, and history
 * - Naam Abhyas schedule, history, and completion records
 * - My Pothi custom banis, order, and completion states
 * - Gurbani Khoj bookmarks, favorites, and notes
 * - App settings & theme
 * 
 * Supports:
 * 1. Google Cloud Firestore (via Firebase Admin SDK) when credentials configured.
 * 2. Secure atomic disk storage fallback (zero data loss across app resets).
 * 3. 8-character Transfer Sync Codes for effortless new-phone migration.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const firebaseAdmin = require('./firebase-admin');

const BACKUPS_DIR = path.join(__dirname, '..', 'data', 'cloud-backups');
const INDEX_FILE = path.join(BACKUPS_DIR, 'sync-codes-index.json');

// Ensure directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

function loadSyncCodesIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) {
      return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[CloudBackup] Could not read sync codes index:', e.message);
  }
  return {};
}

function saveSyncCodesIndex(index) {
  try {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
  } catch (e) {
    console.warn('[CloudBackup] Could not save sync codes index:', e.message);
  }
}

function generateRandomCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 without confusing 0/O, 1/I
  let code = 'ANHAD-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function extractSummary(bundle) {
  if (!bundle || typeof bundle !== 'object') return {};
  const nitnem = bundle.nitnem || {};
  const authStreak = bundle.authoritativeStreak || {};
  const sehaj = bundle.sehajPaath || {};
  const naam = bundle.naamAbhyas || {};
  const pothi = bundle.myPothi || {};
  const shabads = bundle.shabads || {};

  const currentStreak = Math.max(
    0,
    parseInt(authStreak.currentStreak || nitnem.streakData?.currentStreak || bundle.metadata?.currentStreak || 0, 10)
  );

  const longestStreak = Math.max(
    currentStreak,
    parseInt(authStreak.longestStreak || nitnem.streakData?.longestStreak || 0, 10)
  );

  const currentAng = Math.max(
    1,
    parseInt(sehaj.currentAng || sehaj.progress?.currentAng || sehaj.progress?.ang || bundle.metadata?.sehajPaathAng || 1, 10)
  );

  return {
    currentStreak,
    longestStreak,
    currentAng,
    pothiBanis: Array.isArray(pothi.customBanis) ? pothi.customBanis.length : (Array.isArray(pothi.order) ? pothi.order.length : 0),
    naamSessions: Array.isArray(naam.history?.sessions) ? naam.history.sessions.length : (Array.isArray(naam.history) ? naam.history.length : 0),
    bookmarksCount: Array.isArray(shabads.bookmarks) ? shabads.bookmarks.length : 0,
    backedUpAt: bundle.backedUpAt || new Date().toISOString()
  };
}

async function saveBackup(uid, rawBundle, requestedCode = null) {
  if (!uid || typeof uid !== 'string') {
    throw new Error('Valid UID is required for cloud backup');
  }

  const cleanUid = uid.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = new Date().toISOString();

  // Normalize bundle
  const bundle = {
    app: 'Anhad',
    version: 2,
    schemaVersion: '2.0',
    uid: cleanUid,
    backedUpAt: now,
    ...(typeof rawBundle === 'object' ? rawBundle : {})
  };

  const summary = extractSummary(bundle);
  bundle.summary = summary;

  // Manage Sync Code
  const index = loadSyncCodesIndex();
  let syncCode = null;

  // Check if UID already has an active code
  for (const [code, entry] of Object.entries(index)) {
    if (entry.uid === cleanUid) {
      syncCode = code;
      break;
    }
  }

  if (!syncCode) {
    if (requestedCode && typeof requestedCode === 'string' && requestedCode.startsWith('ANHAD-')) {
      syncCode = requestedCode.toUpperCase();
    } else {
      syncCode = generateRandomCode();
    }
  }

  index[syncCode] = {
    uid: cleanUid,
    updatedAt: now,
    summary
  };
  saveSyncCodesIndex(index);
  bundle.syncCode = syncCode;

  // 1. Save to Google Cloud Firestore if Firebase Admin is initialized
  let firestoreSaved = false;
  try {
    const firestore = firebaseAdmin.getFirestore();
    if (firestore) {
      // Strip any undefined values to avoid Firestore SDK serialization rejection
      const sanitizedBundle = JSON.parse(JSON.stringify(bundle));
      await firestore.collection('users').doc(cleanUid).collection('cloud_backup').doc('latest').set({
        ...sanitizedBundle,
        updatedAt: now
      });
      await firestore.collection('users').doc(cleanUid).set({
        lastBackupAt: now,
        syncCode: syncCode,
        backupSummary: summary
      }, { merge: true });

      // Persist global sync-code index in Firestore for seamless cross-instance restoration
      await firestore.collection('sync_codes').doc(syncCode).set({
        uid: cleanUid,
        updatedAt: now,
        summary
      });

      firestoreSaved = true;
      console.log(`[CloudBackup] Successfully saved to Firestore for user: ${cleanUid} (Sync code: ${syncCode})`);
    }
  } catch (err) {
    console.warn(`[CloudBackup] Firestore save notice (using disk fallback): ${err.message}`);
  }

  // 2. Persistent Atomic Disk Save
  const userFile = path.join(BACKUPS_DIR, `${cleanUid}.json`);
  const tempFile = path.join(BACKUPS_DIR, `${cleanUid}.tmp.${Date.now()}`);
  fs.writeFileSync(tempFile, JSON.stringify(bundle, null, 2), 'utf8');
  fs.renameSync(tempFile, userFile);

  return {
    ok: true,
    uid: cleanUid,
    backedUpAt: now,
    syncCode,
    summary,
    storage: firestoreSaved ? 'firestore_and_local' : 'local_persistent'
  };
}

async function getBackup(uid) {
  if (!uid || typeof uid !== 'string') return null;
  const cleanUid = uid.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Try Firestore first
  try {
    const firestore = firebaseAdmin.getFirestore();
    if (firestore) {
      const doc = await firestore.collection('users').doc(cleanUid).collection('cloud_backup').doc('latest').get();
      if (doc.exists) {
        return doc.data();
      }
    }
  } catch (err) {
    console.warn(`[CloudBackup] Firestore retrieve notice: ${err.message}`);
  }

  // 2. Try Local Persistent File
  const userFile = path.join(BACKUPS_DIR, `${cleanUid}.json`);
  if (fs.existsSync(userFile)) {
    try {
      const raw = fs.readFileSync(userFile, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[CloudBackup] Error reading local file ${userFile}:`, e.message);
    }
  }

  return null;
}

async function getBackupByCode(code) {
  if (!code || typeof code !== 'string') return null;
  const cleanCode = code.trim().toUpperCase();

  // 1. Check local index first
  const index = loadSyncCodesIndex();
  let entry = index[cleanCode];

  // 2. Fallback to Firestore global sync_codes collection
  if (!entry || !entry.uid) {
    try {
      const firestore = firebaseAdmin.getFirestore();
      if (firestore) {
        const doc = await firestore.collection('sync_codes').doc(cleanCode).get();
        if (doc.exists) {
          entry = doc.data();
        }
      }
    } catch (err) {
      console.warn(`[CloudBackup] Firestore sync code lookup notice: ${err.message}`);
    }
  }

  if (!entry || !entry.uid) {
    return null;
  }

  return await getBackup(entry.uid);
}

module.exports = {
  saveBackup,
  getBackup,
  getBackupByCode,
  extractSummary,
  loadSyncCodesIndex
};
