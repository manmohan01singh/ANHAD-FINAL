import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import the cloud backup engine directly
const cloudBackupEngine = require('../backend/lib/cloud-backup-engine');

describe('Cloud Backup & Cross-Device Migration Engine', () => {
  const TEST_UID = 'test_user_vitest_' + Date.now();
  let generatedCode = null;

  const mockBundle = {
    version: 2,
    timestamp: new Date().toISOString(),
    metadata: {
      clientVersion: '4.1.0',
      currentStreak: 42,
      sehajPaathAng: 300,
      sehajPaathPercent: 21
    },
    nitnem: {
      nitnem_today_data: { japji: true, jaap: true, tav_prasad: true },
      streakData: { currentStreak: 42, bestStreak: 50 },
      streakHistory: { '2026-10-18': { completedBanis: ['japji'] } }
    },
    authoritativeStreak: {
      currentStreak: 42,
      lastCompletedDate: '2026-10-18',
      monthlySaversRemaining: 5,
      pendingPunishment: null
    },
    sehajPaath: {
      currentAng: 300,
      totalAng: 1430,
      history: [{ date: '2026-10-18', ang: 300 }]
    },
    naamAbhyas: {
      schedule: { '04:00': true, '05:00': true },
      todayMinutes: 45,
      history: [{ date: '2026-10-18', minutes: 45 }]
    },
    myPothi: {
      customBanis: [
        { id: 'dukh_bhanjani', title: 'Dukh Bhanjani Sahib' },
        { id: 'sukhmani', title: 'Sukhmani Sahib' }
      ]
    },
    shabads: {
      bookmarks: [{ shabadId: 101, title: 'Tu Mera Pita Tu Hai Mera Mata' }],
      favorites: [101]
    },
    settings: {
      theme: 'dark',
      fontSize: 20
    }
  };

  afterAll(() => {
    // Clean up test file from backend/data/cloud-backups
    const testFile = path.join(__dirname, '..', 'backend', 'data', 'cloud-backups', `${TEST_UID}.json`);
    if (fs.existsSync(testFile)) {
      try { fs.unlinkSync(testFile); } catch (e) {}
    }
    // Clean up index entry if exists
    if (generatedCode) {
      const index = cloudBackupEngine.loadSyncCodesIndex();
      delete index[generatedCode];
      const indexFile = path.join(__dirname, '..', 'backend', 'data', 'cloud-backups', 'sync-codes-index.json');
      try { fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf8'); } catch (e) {}
    }
  });

  it('should successfully save full app bundle and generate an ANHAD-XXXX sync code', async () => {
    const res = await cloudBackupEngine.saveBackup(TEST_UID, mockBundle);

    expect(res).toBeDefined();
    expect(res.ok).toBe(true);
    expect(res.syncCode).toMatch(/^ANHAD-[2-9A-Z]{4}$/);
    generatedCode = res.syncCode;

    expect(res.summary).toBeDefined();
    expect(res.summary.currentStreak).toBe(42);
    expect(res.summary.currentAng).toBe(300);
    expect(res.summary.pothiBanis).toBe(2);
    expect(res.summary.naamSessions).toBe(1);
    expect(res.summary.bookmarksCount).toBe(1);
  });

  it('should retrieve saved backup bundle by user UID with all devotional domains intact', async () => {
    const backup = await cloudBackupEngine.getBackup(TEST_UID);

    expect(backup).toBeDefined();
    expect(backup.app).toBe('Anhad');
    expect(backup.syncCode).toBe(generatedCode);
    expect(backup.nitnem.streakData.currentStreak).toBe(42);
    expect(backup.authoritativeStreak.monthlySaversRemaining).toBe(5);
    expect(backup.sehajPaath.currentAng).toBe(300);
    expect(backup.naamAbhyas.todayMinutes).toBe(45);
    expect(backup.myPothi.customBanis.length).toBe(2);
    expect(backup.shabads.favorites).toContain(101);
  });

  it('should restore the exact same backup using 8-character Transfer Sync Code', async () => {
    expect(generatedCode).toBeDefined();

    // Test exact code
    const backup = await cloudBackupEngine.getBackupByCode(generatedCode);
    expect(backup).toBeDefined();
    expect(backup.syncCode).toBe(generatedCode);
    expect(backup.metadata.currentStreak).toBe(42);

    // Test case-insensitivity (e.g. user types lowercase 'anhad-xxxx')
    const lowerBackup = await cloudBackupEngine.getBackupByCode(generatedCode.toLowerCase());
    expect(lowerBackup).toBeDefined();
    expect(lowerBackup.syncCode).toBe(generatedCode);
    expect(lowerBackup.metadata.currentStreak).toBe(42);
  });

  it('should return null for non-existent sync code', async () => {
    const nonExistent = await cloudBackupEngine.getBackupByCode('ANHAD-ZZZZ');
    expect(nonExistent).toBeNull();
  });

  it('should accurately extract summary statistics from bundle', () => {
    const summary = cloudBackupEngine.extractSummary(mockBundle);
    expect(summary.currentStreak).toBe(42);
    expect(summary.currentAng).toBe(300);
    expect(summary.pothiBanis).toBe(2);
    expect(summary.bookmarksCount).toBe(1);
    expect(summary.naamSessions).toBe(1);
  });

  it('should reject invalid or missing UID gracefully', async () => {
    await expect(cloudBackupEngine.saveBackup('', mockBundle)).rejects.toThrow('Valid UID is required for cloud backup');
    await expect(cloudBackupEngine.saveBackup(null, mockBundle)).rejects.toThrow('Valid UID is required for cloud backup');
  });
});
