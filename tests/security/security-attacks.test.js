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

describe('Security Audit & Negative Attack Tests', () => {

  beforeEach(() => {
    // Reset test users
    registerUser({ uid: 'user_alice', username: 'alice', displayName: 'Alice Singh', role: 'user' });
    registerUser({ uid: 'user_bob', username: 'bob', displayName: 'Bob Kaur', role: 'user' });
    registerUser({ uid: 'user_charlie', username: 'charlie', displayName: 'Charlie Singh', role: 'user' });

    // Clear state between tests for clean isolation
    friendsEngine.friendships.clear();
    friendsEngine.friendRequests.clear();
    companionEngine.companionSettings.clear();
    companionNotifications.lastTriggerTimestamps.clear();
    companionNotifications.dailyTriggerHashes.clear();
    companionNotifications.inAppNotifications.clear();
    companionNotifications.recentAmritVelaStarts.clear();
  });

  describe('1. Authentication & Authorization Negative Tests', () => {
    it('should reject unauthenticated / guest access to protected endpoints with 401', () => {
      const req = { headers: {} };
      let status = 0;
      let body = {};
      const res = {
        status: (s) => { status = s; return { json: (b) => { body = b; } }; }
      };
      const next = vi.fn();

      requireAuth(req, res, next);
      expect(status).toBe(401);
      expect(body.code).toBe('AUTH_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject normal authenticated users from Admin endpoints with 403 Forbidden', () => {
      const req = {
        headers: { 'authorization': 'Bearer user_alice' }
      };
      let status = 0;
      let body = {};
      const res = {
        status: (s) => { status = s; return { json: (b) => { body = b; } }; }
      };
      const next = vi.fn();

      requireAdmin(req, res, next);
      expect(status).toBe(403);
      expect(body.code).toBe('ADMIN_FORBIDDEN');
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow verified Admin with timing-safe X-Admin-Token', () => {
      const req = {
        headers: { 'x-admin-token': ADMIN_API_TOKEN }
      };
      const res = {};
      const next = vi.fn();

      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.role).toBe('admin');
    });

    it('should reject forged admin tokens with 401', () => {
      const req = {
        headers: { 'x-admin-token': 'wrong_forged_admin_token' }
      };
      let status = 0;
      const res = {
        status: (s) => { status = s; return { json: () => {} }; }
      };
      const next = vi.fn();

      requireAdmin(req, res, next);
      expect(status).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('2. User Isolation & Cross-User Privacy Attacks', () => {
    it('should prevent User A from responding to or accepting User B friend requests', () => {
      // Alice sends request to Bob
      const { request } = friendsEngine.sendRequest('user_alice', 'bob');
      expect(request.id).toBeDefined();

      // Charlie attempts to respond / accept Bob's request
      expect(() => {
        friendsEngine.respondRequest('user_charlie', request.id, 'accept');
      }).toThrow();

      try {
        friendsEngine.respondRequest('user_charlie', request.id, 'accept');
      } catch (err) {
        expect(err.status).toBe(403);
      }
    });

    it('should prevent a user from sending a friend request to themselves', () => {
      expect(() => {
        friendsEngine.sendRequest('user_alice', 'alice');
      }).toThrow();
    });

    it('should sanitize search query against XSS & script injection', () => {
      const dirtyQuery = '<script>alert("hack")</script>harpreet';
      const clean = sanitizeString(dirtyQuery, 30);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('"');
    });
  });

  describe('3. Friends vs Companions Separation & Notification Permissions', () => {
    it('should prevent designating a companion if users are not confirmed mutual friends first', () => {
      expect(() => {
        companionEngine.setCompanion('user_alice', 'user_charlie', true);
      }).toThrow();
    });

    it('should separate friendship from Companion status and notifications', () => {
      // Establish mutual friendship between Alice and Bob
      const { request } = friendsEngine.sendRequest('user_alice', 'bob');
      friendsEngine.respondRequest('user_bob', request.id, 'accept');

      expect(friendsEngine.isFriend('user_alice', 'user_bob')).toBe(true);

      // Friendship exists, but Bob is NOT automatically a companion of Alice
      const companionsBefore = companionEngine.getCompanions('user_alice');
      expect(companionsBefore.some(c => c.uid === 'user_bob')).toBe(false);

      // Alice explicitly makes Bob a companion
      companionEngine.setCompanion('user_alice', 'user_bob', true);
      const companionsAfter = companionEngine.getCompanions('user_alice');
      const bobCompanion = companionsAfter.find(c => c.uid === 'user_bob');
      expect(bobCompanion).toBeDefined();
      expect(bobCompanion.notify).toBe(false); // Notifications default to OFF

      // Alice explicitly enables notifications for Bob
      companionEngine.setNotification('user_alice', 'user_bob', true);
      const updatedCompanions = companionEngine.getCompanions('user_alice');
      expect(updatedCompanions.find(c => c.uid === 'user_bob').notify).toBe(true);
    });

    it('should NOT dispatch notifications if companion notification toggle is OFF', () => {
      // Setup friendship and companion with notify OFF
      const { request } = friendsEngine.sendRequest('user_alice', 'bob');
      friendsEngine.respondRequest('user_bob', request.id, 'accept');
      companionEngine.setCompanion('user_alice', 'user_bob', true);
      companionEngine.setNotification('user_alice', 'user_bob', false);

      // Trigger Amrit Vela as Bob
      const result = companionNotifications.markAmritVelaStarted('user_bob');
      expect(result.deliveredToCount).toBe(0);

      // Alice receives 0 notifications
      const aliceNotifs = companionNotifications.getNotifications('user_alice');
      expect(aliceNotifs.length).toBe(0);
    });

    it('should dispatch notifications ONLY to companions with notification ON', () => {
      // Setup friendship and companion with notify ON
      const { request } = friendsEngine.sendRequest('user_alice', 'bob');
      friendsEngine.respondRequest('user_bob', request.id, 'accept');
      companionEngine.setCompanion('user_alice', 'user_bob', true);
      companionEngine.setNotification('user_alice', 'user_bob', true);

      const result = companionNotifications.markAmritVelaStarted('user_bob');
      expect(result.deliveredToCount).toBe(1);

      const aliceNotifs = companionNotifications.getNotifications('user_alice');
      expect(aliceNotifs.length).toBe(1);
      expect(aliceNotifs[0].title).toBe('Amrit Vela has begun 🌅');
      expect(aliceNotifs[0].message).toContain('Bob Kaur');
      expect(aliceNotifs[0].deepLink).toBe('/nitnem/indexbani.html?source=companion_amritvela');
    });

    it('should enforce anti-spam 4-hour cooldown and daily limit on Amrit Vela triggers', () => {
      // Setup friendship & companion
      const { request } = friendsEngine.sendRequest('user_alice', 'bob');
      friendsEngine.respondRequest('user_bob', request.id, 'accept');
      companionEngine.setCompanion('user_alice', 'user_bob', true);
      companionEngine.setNotification('user_alice', 'user_bob', true);

      // Trigger once -> succeeds
      const first = companionNotifications.markAmritVelaStarted('user_bob');
      expect(first.ok).toBe(true);

      // Immediate second trigger must be rejected with 429
      expect(() => {
        companionNotifications.markAmritVelaStarted('user_bob');
      }).toThrow();

      try {
        companionNotifications.markAmritVelaStarted('user_bob');
      } catch (err) {
        expect(err.status).toBe(429);
      }
    });
  });

  describe('4. "Sangat is Gathering" Collective Experience', () => {
    it('should detect when 2 or more companions start Amrit Vela within 60 minutes', () => {
      // Alice is friends with Bob and Charlie
      const req1 = friendsEngine.sendRequest('user_alice', 'bob');
      friendsEngine.respondRequest('user_bob', req1.request.id, 'accept');
      companionEngine.setCompanion('user_alice', 'user_bob', true);

      const req2 = friendsEngine.sendRequest('user_alice', 'charlie');
      friendsEngine.respondRequest('user_charlie', req2.request.id, 'accept');
      companionEngine.setCompanion('user_alice', 'user_charlie', true);

      // Simulate both Bob and Charlie starting Amrit Vela in last 60 min
      companionNotifications.recentAmritVelaStarts.set('user_bob', { timestamp: Date.now() - 1000, displayName: 'Bob Kaur' });
      companionNotifications.recentAmritVelaStarts.set('user_charlie', { timestamp: Date.now() - 2000, displayName: 'Charlie Singh' });

      const gathering = companionNotifications.checkSangatGathering('user_alice');
      expect(gathering.isGathering).toBe(true);
      expect(gathering.activeCount).toBe(2);
      expect(gathering.message).toContain('Sangat is Gathering');
    });
  });

  describe('5. Reusable Spiritual Campaign Engine', () => {
    it('should dynamically calculate day number and provide day-specific message', () => {
      const active = campaignEngine.getActiveCampaign();
      expect(active).toBeDefined();
      expect(active.id).toBe('chaliya-2026');
      expect(active.currentDay).toBeGreaterThan(0);
      expect(active.todayMessage).toBeDefined();
      expect(active.todayMessage.quoteGurmukhi).toBeDefined();
    });

    it('should generate shareable WhatsApp links with deep links and preserved context', () => {
      const share = campaignEngine.generateShareableUrl('chaliya-2026', 'https://anhad.app');
      expect(share.shareUrl).toBe('https://anhad.app/share/campaign?id=chaliya-2026');
      expect(share.whatsappUrl).toContain('whatsapp.com');
      expect(share.deepLink).toBe('anhad://companion?campaign=chaliya-2026');
    });
  });

  describe('6. Admin Monitoring ("Who Is Live Now")', () => {
    it('should generate comprehensive dataset containing active users, activities and system health', () => {
      const liveData = adminEngine.getWhoIsLiveNow();
      expect(liveData.summary).toBeDefined();
      expect(liveData.summary.totalActiveUsers).toBeGreaterThan(0);
      expect(liveData.activeUsers).toBeInstanceOf(Array);
      expect(liveData.systemHealth.uptimeFormatted).toBeDefined();
    });
  });

  describe('7. Rate Limiter Abuse Prevention', () => {
    it('should block rapid requests exceeding limit with 429 Too Many Requests', () => {
      const limiter = createRateLimiter(2, 60000, 'test_attack');
      const req = { user: { uid: 'attacker_1' } };
      let lastStatus = 0;
      const res = {
        set: vi.fn(),
        status: (s) => { lastStatus = s; return { json: () => {} }; }
      };
      const next = vi.fn();

      limiter(req, res, next); // Hit 1
      limiter(req, res, next); // Hit 2
      limiter(req, res, next); // Hit 3 -> Exceeds 2!

      expect(lastStatus).toBe(429);
      expect(next).toHaveBeenCalledTimes(2);
    });
  });
});
