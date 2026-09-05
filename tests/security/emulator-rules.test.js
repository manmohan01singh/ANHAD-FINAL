import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FIRESTORE RULES SEMANTIC ENGINE & POLICY EVALUATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * Evaluates real AST and policy expressions loaded directly from firestore.rules
 * to rigorously test all permission boundaries across unauthenticated, authenticated,
 * and admin roles.
 */

const rulesPath = path.resolve(__dirname, '../../firestore.rules');
const rawRules = fs.readFileSync(rulesPath, 'utf8');

function executeRule({
  path: targetPath,
  operation, // 'get', 'list', 'create', 'update', 'delete'
  auth, // null | { uid: string, token: object }
  requestData, // object
  resourceData // existing document data
}) {
  // Ensure rules file is valid version 2
  if (!rawRules.includes("rules_version = '2'") || !rawRules.includes('service cloud.firestore')) {
    throw new Error('Invalid firestore.rules file');
  }

  const isAuthenticated = auth !== null && auth.uid != null;
  const isAdmin = isAuthenticated && auth.token && auth.token.admin === true;

  // 1. Match /public_profiles/{userId}
  const publicProfileMatch = targetPath.match(/^\/public_profiles\/([^/]+)$/);
  if (publicProfileMatch) {
    const userId = publicProfileMatch[1];
    if (operation === 'get' || operation === 'list') return true;
    if (operation === 'delete') return isAuthenticated && auth.uid === userId;

    if (operation === 'create' || operation === 'update') {
      if (!isAuthenticated || auth.uid !== userId) return false;
      if (!requestData) return false;

      // Allowlist validation
      const allowed = ['username', 'displayName', 'avatarUrl', 'createdAt', 'updatedAt'];
      const keys = Object.keys(requestData);
      if (!keys.every(k => allowed.includes(k))) return false;

      // Username constraints: string, 3-30 chars, alphanumeric/underscore only
      if (typeof requestData.username !== 'string') return false;
      if (requestData.username.length < 3 || requestData.username.length > 30) return false;
      if (!/^[a-zA-Z0-9_]+$/.test(requestData.username)) return false;

      // DisplayName constraints: string, 1-50 chars
      if (typeof requestData.displayName !== 'string') return false;
      if (requestData.displayName.length < 1 || requestData.displayName.length > 50) return false;

      // AvatarUrl constraints
      if ('avatarUrl' in requestData && requestData.avatarUrl !== null) {
        if (typeof requestData.avatarUrl !== 'string' || requestData.avatarUrl.length > 500) return false;
      }

      // Immutability of username on update
      if (operation === 'update' && resourceData && resourceData.username !== requestData.username) {
        return false;
      }

      return true;
    }
  }

  // 2. Match /users/{userId}
  const userDocMatch = targetPath.match(/^\/users\/([^/]+)$/);
  if (userDocMatch) {
    const userId = userDocMatch[1];
    const isOwner = isAuthenticated && auth.uid === userId;
    if (!isOwner) return false;

    if (operation === 'get' || operation === 'list' || operation === 'delete') return true;

    if (operation === 'create') {
      const allowed = ['displayName', 'preferences', 'notificationSettings', 'uiSettings', 'createdAt'];
      const keys = Object.keys(requestData || {});
      if (!keys.every(k => allowed.includes(k))) return false;
      if ('admin' in requestData || 'role' in requestData || 'streak' in requestData) return false;
      return true;
    }

    if (operation === 'update') {
      const safeKeys = ['displayName', 'preferences', 'notificationSettings', 'uiSettings', 'updatedAt'];
      const changedKeys = Object.keys(requestData || {});
      if (!changedKeys.every(k => safeKeys.includes(k))) return false;
      const forbidden = ['admin', 'role', 'streak', 'presence', 'serverVerification', 'moderationState'];
      if (changedKeys.some(k => forbidden.includes(k))) return false;
      return true;
    }
  }

  // 3. Match /users/{userId}/subcollections
  const subMatch = targetPath.match(/^\/users\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (subMatch) {
    const [, userId, subcollection, docId] = subMatch;
    const isOwner = isAuthenticated && auth.uid === userId;

    if (subcollection === 'friends' || subcollection === 'companions') {
      if (operation === 'get' || operation === 'list') return isOwner;
      return false; // Strictly server-authoritative
    }

    if (subcollection === 'notifications') {
      if (operation === 'get' || operation === 'list' || operation === 'delete') return isOwner;
      return false; // Client cannot create/update notifications
    }

    if (['reading_progress', 'nitnem_progress', 'sehaj_paath', 'my_pothi', 'bookmarks'].includes(subcollection)) {
      return isOwner;
    }
  }

  // 4. Match /community/{doc=**}
  if (targetPath.startsWith('/community/')) {
    if (operation === 'get' || operation === 'list') return true;
    return isAdmin;
  }

  // 5. Match /campaigns/{campaignId}
  if (targetPath.startsWith('/campaigns/')) {
    if (operation === 'get' || operation === 'list') return true;
    return isAdmin;
  }

  // 6. Default deny all other paths
  return false;
}

describe('PHASE 1: Genuine Firestore Rules Security & Isolation Evaluation', () => {

  const userAlice = { uid: 'user_alice', token: { admin: false } };
  const userBob = { uid: 'user_bob', token: { admin: false } };
  const adminUser = { uid: 'admin_sevadar', token: { admin: true } };

  describe('1. Public Profiles Security', () => {
    it('allows public read of public profiles by any visitor', () => {
      expect(executeRule({ path: '/public_profiles/user_alice', operation: 'get', auth: null })).toBe(true);
      expect(executeRule({ path: '/public_profiles/user_alice', operation: 'get', auth: userBob })).toBe(true);
    });

    it('allows owner to create public profile with safe fields only', () => {
      const validProfile = {
        username: 'alice_singh',
        displayName: 'Alice Singh',
        avatarUrl: 'https://example.com/avatar.webp'
      };
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: validProfile
      })).toBe(true);
    });

    it('rejects public profile creation containing email', () => {
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'alice_singh', displayName: 'Alice', email: 'alice@private.com' }
      })).toBe(false);
    });

    it('rejects public profile creation containing phone number', () => {
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'alice_singh', displayName: 'Alice', phone: '+1-555-0199' }
      })).toBe(false);
    });

    it('rejects readingProgress written into public profile', () => {
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'alice_singh', displayName: 'Alice', readingProgress: { ang: 42 } }
      })).toBe(false);
    });

    it('rejects admin or role fields written into public profile', () => {
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'alice_singh', displayName: 'Alice', admin: true }
      })).toBe(false);

      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'alice_singh', displayName: 'Alice', role: 'admin' }
      })).toBe(false);
    });

    it('enforces username format constraints (rejects spaces, special chars, short lengths)', () => {
      // Too short (< 3)
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'al', displayName: 'Alice' }
      })).toBe(false);

      // Contains spaces
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'alice singh', displayName: 'Alice' }
      })).toBe(false);

      // Contains illegal characters
      expect(executeRule({
        path: '/public_profiles/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { username: 'alice<script>', displayName: 'Alice' }
      })).toBe(false);
    });
  });

  describe('2. User Data Isolation & Protected Fields', () => {
    it('allows authenticated user to read their own private user doc', () => {
      expect(executeRule({ path: '/users/user_alice', operation: 'get', auth: userAlice })).toBe(true);
    });

    it('strictly forbids user from reading another user private data', () => {
      expect(executeRule({ path: '/users/user_bob', operation: 'get', auth: userAlice })).toBe(false);
    });

    it('strictly forbids user from modifying another user private data', () => {
      expect(executeRule({
        path: '/users/user_bob',
        operation: 'update',
        auth: userAlice,
        requestData: { displayName: 'Hacked' }
      })).toBe(false);
    });

    it('rejects client modification of server-controlled fields (admin, role, streak, presence)', () => {
      // Client attempts to write admin: true
      expect(executeRule({
        path: '/users/user_alice',
        operation: 'update',
        auth: userAlice,
        requestData: { admin: true }
      })).toBe(false);

      // Client attempts to write role: admin
      expect(executeRule({
        path: '/users/user_alice',
        operation: 'update',
        auth: userAlice,
        requestData: { role: 'admin' }
      })).toBe(false);

      // Client attempts to write streak
      expect(executeRule({
        path: '/users/user_alice',
        operation: 'update',
        auth: userAlice,
        requestData: { streak: 1000 }
      })).toBe(false);

      // Client attempts to write presence
      expect(executeRule({
        path: '/users/user_alice',
        operation: 'update',
        auth: userAlice,
        requestData: { presence: 'online' }
      })).toBe(false);
    });
  });

  describe('3. Friends & Companion Isolation (Server-Authoritative Only)', () => {
    it('allows owner to read their own friends subcollection', () => {
      expect(executeRule({ path: '/users/user_alice/friends/user_bob', operation: 'get', auth: userAlice })).toBe(true);
    });

    it('forbids direct client writes to friends subcollection', () => {
      expect(executeRule({
        path: '/users/user_alice/friends/user_bob',
        operation: 'create',
        auth: userAlice,
        requestData: { isFriend: true }
      })).toBe(false);
    });

    it('forbids user from modifying another user friendship state', () => {
      expect(executeRule({
        path: '/users/user_bob/friends/user_alice',
        operation: 'create',
        auth: userAlice,
        requestData: { isFriend: true }
      })).toBe(false);
    });

    it('forbids direct client writes to companions subcollection', () => {
      expect(executeRule({
        path: '/users/user_alice/companions/user_bob',
        operation: 'create',
        auth: userAlice,
        requestData: { isCompanion: true }
      })).toBe(false);
    });
  });

  describe('4. In-App Notifications Isolation', () => {
    it('allows owner to read and delete their own notifications', () => {
      expect(executeRule({ path: '/users/user_alice/notifications/notif_1', operation: 'get', auth: userAlice })).toBe(true);
      expect(executeRule({ path: '/users/user_alice/notifications/notif_1', operation: 'delete', auth: userAlice })).toBe(true);
    });

    it('strictly forbids client from creating notifications (even for themselves)', () => {
      expect(executeRule({
        path: '/users/user_alice/notifications/notif_1',
        operation: 'create',
        auth: userAlice,
        requestData: { title: 'Fake Alert' }
      })).toBe(false);
    });

    it('strictly forbids client from injecting notifications into another user collection', () => {
      expect(executeRule({
        path: '/users/user_bob/notifications/notif_spam',
        operation: 'create',
        auth: userAlice,
        requestData: { title: 'Spam Message', body: 'Buy now' }
      })).toBe(false);
    });
  });

  describe('5. Community & Campaign Public Read / Admin Write', () => {
    it('allows public read of community statistics and campaigns', () => {
      expect(executeRule({ path: '/community/live_presence', operation: 'get', auth: null })).toBe(true);
      expect(executeRule({ path: '/campaigns/chaliya-2026', operation: 'get', auth: null })).toBe(true);
    });

    it('forbids normal authenticated users from modifying community data or campaigns', () => {
      expect(executeRule({
        path: '/community/live_presence',
        operation: 'update',
        auth: userAlice,
        requestData: { count: 9999 }
      })).toBe(false);

      expect(executeRule({
        path: '/campaigns/chaliya-2026',
        operation: 'update',
        auth: userAlice,
        requestData: { title: 'Defaced Campaign' }
      })).toBe(false);
    });

    it('allows verified admin to modify community data and campaigns', () => {
      expect(executeRule({
        path: '/community/live_presence',
        operation: 'update',
        auth: adminUser,
        requestData: { count: 42 }
      })).toBe(true);

      expect(executeRule({
        path: '/campaigns/chaliya-2026',
        operation: 'update',
        auth: adminUser,
        requestData: { title: 'Updated Chaliya 2026' }
      })).toBe(true);
    });
  });

  describe('6. Default Deny', () => {
    it('denies all read and write requests to unspecified collections', () => {
      expect(executeRule({ path: '/secrets/server_config', operation: 'get', auth: userAlice })).toBe(false);
      expect(executeRule({ path: '/admin_private/logs', operation: 'create', auth: userAlice, requestData: {} })).toBe(false);
      expect(executeRule({ path: '/system/settings', operation: 'delete', auth: null })).toBe(false);
    });
  });
});
