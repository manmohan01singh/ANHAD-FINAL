import { describe, it, expect, beforeEach } from 'vitest';

describe('Reading Migration Engine', () => {
  let ReadingMigration;

  beforeEach(() => {
    localStorage.clear();
    global.window = global;
    delete global.AnhadMigration;
    delete global.ReadingMigration;
    delete require.cache[require.resolve('../../frontend/lib/reading-migration.js')];
    require('../../frontend/lib/reading-migration.js');
    ReadingMigration = global.AnhadMigration || global.ReadingMigration;
  });

  it('should generate a valid Anhad export payload with schemaVersion 1.0', () => {
    localStorage.setItem('anhad_my_pothi_data', JSON.stringify({ customPothis: [{ id: 'p1', title: 'Chaupai Sahib' }] }));
    localStorage.setItem('anhad_streak_data', JSON.stringify({ currentStreak: 12 }));

    const payload = ReadingMigration.generateExportPayload();
    expect(payload.app).toBe('Anhad');
    expect(payload.schemaVersion).toBe('1.0');
    expect(payload.exportedAt).toBeDefined();
    expect(payload.readingProgress.myPothi.customData.customPothis).toHaveLength(1);
    expect(payload.readingProgress.nitnem.streakData.currentStreak).toBe(12);
  });

  it('should validate payloads and reject malformed schemas', () => {
    expect(ReadingMigration.validateSchema(null).valid).toBe(false);
    expect(ReadingMigration.validateSchema({}).valid).toBe(false);
    expect(ReadingMigration.validateSchema({ app: 'OtherApp', version: 1, schemaVersion: '1.0', readingProgress: {} }).valid).toBe(false);

    const validPayload = ReadingMigration.generateExportPayload();
    expect(ReadingMigration.validateSchema(validPayload).valid).toBe(true);
  });

  it('should create an automatic recovery snapshot before import', async () => {
    localStorage.setItem('anhad_my_pothi', JSON.stringify(['bani-1', 'bani-2']));
    const newPayload = {
      app: 'Anhad',
      version: 1,
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      readingProgress: {
        myPothi: { order: ['bani-99'] },
        nitnem: {},
        sehajPaath: {},
        shabads: {}
      }
    };

    const res = await ReadingMigration.importFromJson(newPayload, { mode: 'replace' });
    expect(res.success).toBe(true);

    const snapshot = localStorage.getItem('anhad_migration_backup');
    expect(snapshot).toBeDefined();
    const parsedSnapshot = JSON.parse(snapshot);
    expect(parsedSnapshot.keys['anhad_my_pothi']).toBe(JSON.stringify(['bani-1', 'bani-2']));
  });
});

describe('Community Presence Engine (Backend)', () => {
  let CommunityPresenceEngine;

  beforeEach(() => {
    const mod = require('../../backend/lib/community-presence.js');
    CommunityPresenceEngine = mod.CommunityPresenceEngine;
  });

  it('should accurately aggregate active heartbeats without inflating metrics', () => {
    const engine = new CommunityPresenceEngine();
    engine.recordHeartbeat('user1', { activity: 'listening', streak: 5 });
    engine.recordHeartbeat('user2', { activity: 'live_stream', streak: 3 });
    engine.recordHeartbeat('user3', { activity: 'nitnem', streak: 10 });
    engine.recalculate();

    const presence = engine.getLivePresence();
    expect(presence.totalActive).toBe(3);
    expect(presence.byActivity.listening).toBe(1);
    expect(presence.byActivity.live_stream).toBe(1);
    expect(presence.byActivity.nitnem).toBe(1);
  });

  it('should evict expired heartbeats after TTL threshold', () => {
    const engine = new CommunityPresenceEngine();
    engine.recordHeartbeat('user1', { activity: 'listening' });
    
    // Simulate past timestamp
    const session = engine.activeSessions.get('user1');
    session.lastSeen = Date.now() - 70000; // Older than 60s TTL

    engine.recalculate();
    const presence = engine.getLivePresence();
    expect(presence.byActivity.listening).toBe(0);
  });
});

describe('Companion Mode Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    global.window = global;
    delete global.CompanionMode;
    delete require.cache[require.resolve('../../frontend/lib/companion-mode.js')];
    require('../../frontend/lib/companion-mode.js');
  });

  it('should toggle companion mode and update localStorage', () => {
    expect(global.CompanionMode.isEnabled()).toBe(false);
    
    const newState = global.CompanionMode.toggle();
    expect(newState).toBe(true);
    expect(global.CompanionMode.isEnabled()).toBe(true);
    expect(localStorage.getItem('anhad_companion_mode')).toBe('true');

    const offState = global.CompanionMode.toggle();
    expect(offState).toBe(false);
    expect(global.CompanionMode.isEnabled()).toBe(false);
    expect(localStorage.getItem('anhad_companion_mode')).toBe('false');
  });
});
