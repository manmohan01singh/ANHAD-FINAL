import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('Sangat Cross-Account Multi-User Flow & Devotional Isolation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  let authMiddleware, friendsEngine, companionEngine;

  beforeEach(() => {
    authMiddleware = require('../../backend/lib/auth-middleware');
    friendsEngine = require('../../backend/lib/friends-engine');
    companionEngine = require('../../backend/lib/companion-engine');
  });

  describe('1. Registration, Search & Strict Self-Exclusion', () => {
    it('registers two separate accounts and ensures Account 1 cannot find or connect to itself', () => {
      const acc1 = authMiddleware.registerUser({
        uid: 'user_acc_1_' + Date.now(),
        username: 'gursikh_one',
        displayName: 'Gursikh One',
        streak: 5,
        isPublic: true
      });
      expect(acc1).toBeDefined();
      expect(acc1.username).toBe('gursikh_one');

      const acc2 = authMiddleware.registerUser({
        uid: 'user_acc_2_' + Date.now(),
        username: 'gursikh_two',
        displayName: 'Gursikh Two',
        streak: 12,
        isPublic: true
      });
      expect(acc2).toBeDefined();
      expect(acc2.username).toBe('gursikh_two');

      const searchForSangat = friendsEngine.searchUsers('gursikh', acc1.uid);
      
      const selfInResults = searchForSangat.find(u => u.uid === acc1.uid || u.username === 'gursikh_one');
      expect(selfInResults).toBeUndefined();

      const acc2InResults = searchForSangat.find(u => u.uid === acc2.uid);
      expect(acc2InResults).toBeDefined();
      expect(acc2InResults.displayName).toBe('Gursikh Two');
      expect(acc2InResults.isFriend).toBe(false);
      expect(acc2InResults.hasPending).toBe(false);

      const dummyInResults = searchForSangat.find(u => u.username === 'manmohan' || u.streak === 45);
      expect(dummyInResults).toBeUndefined();
    });

    it('rejects sending a friend request to oneself', () => {
      const uid = 'user_self_test_' + Date.now();
      authMiddleware.registerUser({
        uid,
        username: 'selftester',
        displayName: 'Self Tester',
        isPublic: true
      });

      expect(() => {
        friendsEngine.sendRequest(uid, 'selftester');
      }).toThrow(/cannot send a friend request to yourself/i);
    });
  });

  describe('2. Cross-Account Friend Request Delivery & Notification Flow', () => {
    it('sends request from Account 1 to Account 2 using mixed-case Firebase UID, delivers notification, and establishes mutual friendship with active companion alerts upon acceptance', () => {
      const companionNotifications = require('../../backend/lib/companion-notifications');

      const uid1 = 'd4E8fK19aB' + Date.now();
      const uid2 = 'AIzaSyX8wZ' + Date.now();

      authMiddleware.registerUser({ uid: uid1, username: 'sender_kaur', displayName: 'Sender Kaur', isPublic: true });
      authMiddleware.registerUser({ uid: uid2, username: 'receiver_singh', displayName: 'Receiver Singh', isPublic: true });

      // Test sending by mixed-case Firebase UID (the user's reported bug)
      const sendResult = friendsEngine.sendRequest(uid1, uid2);
      expect(sendResult.ok).toBe(true);
      expect(sendResult.request).toBeDefined();
      const reqId = sendResult.request.id;

      // Receiver gets the pending request in list
      const acc2List = friendsEngine.getFriendsList(uid2);
      expect(acc2List.incomingRequests.length).toBeGreaterThan(0);
      const incomingReq = acc2List.incomingRequests.find(r => r.id === reqId);
      expect(incomingReq).toBeDefined();
      expect(incomingReq.fromUid).toBe(uid1);
      expect(incomingReq.fromDisplayName).toBe('Sender Kaur');

      // Receiver accepts the request (as triggered by UI Confirm button)
      const acceptResult = friendsEngine.respondRequest(uid2, reqId, 'accept');
      expect(acceptResult.ok).toBe(true);
      expect(acceptResult.action).toBe('accepted');

      expect(friendsEngine.isFriend(uid1, uid2)).toBe(true);
      expect(friendsEngine.isFriend(uid2, uid1)).toBe(true);

      // UI Confirm button designates Amritvela companion & enables notification
      companionEngine.setCompanion(uid2, uid1, true);
      companionEngine.setNotification(uid2, uid1, true);

      // Now Account 1 marks Amrit Vela as started!
      const avBroadcast = companionNotifications.markAmritVelaStarted(uid1, { force: true });
      expect(avBroadcast.ok).toBe(true);
      expect(avBroadcast.deliveredToCount).toBe(1);

      // Account 2 MUST receive the Amrit Vela start alert
      const acc2UpdatedNotifs = companionNotifications.getNotifications(uid2);
      const amritvelaAlert = acc2UpdatedNotifs.find(n => n.type === 'amritvela_started');
      expect(amritvelaAlert).toBeDefined();
      expect(amritvelaAlert.senderUid).toBe(uid1);
      expect(amritvelaAlert.message).toContain('Sender Kaur');
      expect(amritvelaAlert.deepLink).toContain('/nitnem/');
    });
  });

  describe('3. Dynamic Theme Isolation: Subpages vs Home Screen', () => {
    it('ensures global-theme.js scopes morning/evening tints exclusively to data-anhad-home', () => {
      const themeJs = fs.readFileSync(path.join(rootDir, 'frontend', 'lib', 'global-theme.js'), 'utf-8');

      expect(themeJs).toMatch(/const isHome\s*=\s*html\.hasAttribute\(['"]data-anhad-home['"]\)/);
      expect(themeJs).toMatch(/activeTimeOfDay === ['"]morning['"]\)\s*autoBg\s*=\s*isHome\s*\?\s*['"]#FFF5EC['"]\s*:\s*['"]#FAF8F5['"]/);
      expect(themeJs).toMatch(/activeTimeOfDay === ['"]evening['"]\)\s*autoBg\s*=\s*isHome\s*\?\s*['"]#FFF8E7['"]\s*:\s*['"]#FAF8F5['"]/);
    });
  });

  describe('4. Companion Mode Scoping: Light Mode / Daytime Display & Dark Mode Preservation', () => {
    it('ensures companion banner displays in light mode / daytime and preserves dark carousel in dark mode / night', () => {
      const indexHtml = fs.readFileSync(path.join(rootDir, 'frontend', 'index.html'), 'utf-8');

      expect(indexHtml).toMatch(/if\s*\(isCompanion\)\s*\{[\s\S]*?if\s*\(showDark\)\s*\{[\s\S]*?heroBanner\.style\.setProperty\(['"]display['"],\s*['"]none['"],\s*['"]important['"]\)/);
      expect(indexHtml).toMatch(/darkCarousel\.style\.setProperty\(['"]display['"],\s*['"]flex['"],\s*['"]important['"]\)/);
    });

    it('ensures companion-mode.js checks showDark before activating companion banner', () => {
      const compJs = fs.readFileSync(path.join(rootDir, 'frontend', 'lib', 'companion-mode.js'), 'utf-8');

      expect(compJs).toContain('showDark');
      expect(compJs).toMatch(/if\s*\(enabled\s*&&\s*!showDark\)/);
    });
  });

  describe('5. Admin Store Persistence Notice', () => {
    it('shows reassuring message without data loss panic in Admin Mission Control', () => {
      const adminJs = fs.readFileSync(path.join(rootDir, 'frontend', 'Admin', 'admin.js'), 'utf-8');

      expect(adminJs).not.toContain('changes will be LOST when the server restarts');
      expect(adminJs).toContain('Storage: Local File (data/campaign-config.json) — durable on this server.');
    });
  });
});
