/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FRIENDS ENGINE & SANGAT CONNECTIVITY
 * ═══════════════════════════════════════════════════════════════════════════════
 * Handles username search, friend requests (Send -> Accept/Reject), friend removal,
 * and strict privacy isolation. Does NOT grant Companion status automatically.
 */

const { registeredUsers, getUser, getUserByUsername, sanitizeString } = require('./auth-middleware');

class FriendsEngine {
  constructor() {
    // friendshipId -> { id, userA, userB, createdAt }
    this.friendships = new Map();
    // requestId -> { id, fromUid, toUid, status: 'pending'|'accepted'|'rejected', createdAt }
    this.friendRequests = new Map();

    this.seedInitialUsers();
  }

  seedInitialUsers() {
    // Seed initial searchable Sangat for discovery & tests
    const seed = [
      { uid: 'user_manmohan', username: 'manmohan', displayName: 'Manmohan Singh', streak: 45, isPublic: true },
      { uid: 'user_harpreet', username: 'harpreet', displayName: 'Harpreet Kaur', streak: 30, isPublic: true },
      { uid: 'user_gurpreet', username: 'gurpreet', displayName: 'Gurpreet Singh', streak: 21, isPublic: true },
      { uid: 'user_amrit', username: 'amritvela_premi', displayName: 'Amrit Sevadar', streak: 60, isPublic: true }
    ];
    seed.forEach(u => registeredUsers.set(u.uid, u));
  }

  /**
   * Search users by username (case-insensitive prefix/contains)
   * Strictly filters out private info (email, phone, private progress).
   */
  searchUsers(query, currentUid) {
    const q = sanitizeString(query, 30).toLowerCase();
    if (!q || q.length < 2) return [];

    const results = [];
    for (const u of registeredUsers.values()) {
      if (u.uid === currentUid) continue; // Skip self
      if (!u.isPublic) continue;

      if (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)) {
        const isFriend = this.isFriend(currentUid, u.uid);
        const hasPending = this.hasPendingRequest(currentUid, u.uid);

        results.push({
          uid: u.uid,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl || null,
          streak: u.streak || 0,
          isFriend,
          hasPending
        });
      }
      if (results.length >= 20) break;
    }
    return results;
  }

  isFriend(userA, userB) {
    for (const f of this.friendships.values()) {
      if ((f.userA === userA && f.userB === userB) || (f.userA === userB && f.userB === userA)) {
        return true;
      }
    }
    return false;
  }

  hasPendingRequest(fromUid, toUid) {
    for (const r of this.friendRequests.values()) {
      if (r.status === 'pending') {
        if ((r.fromUid === fromUid && r.toUid === toUid) || (r.fromUid === toUid && r.toUid === fromUid)) {
          return true;
        }
      }
    }
    return false;
  }

  sendRequest(fromUid, toIdentifier) {
    if (!fromUid) throw { status: 401, message: 'Authentication required' };
    const sanitized = sanitizeString(toIdentifier, 50).toLowerCase();

    // Find target user by username or UID
    let target = getUser(sanitized) || getUserByUsername(sanitized);
    if (!target) {
      throw { status: 404, message: 'User not found with specified username or ID' };
    }

    if (target.uid === fromUid) {
      throw { status: 400, message: 'You cannot send a friend request to yourself' };
    }

    if (this.isFriend(fromUid, target.uid)) {
      throw { status: 400, message: 'You are already friends with this user' };
    }

    if (this.hasPendingRequest(fromUid, target.uid)) {
      throw { status: 400, message: 'A pending friend request already exists between you and this user' };
    }

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const request = {
      id: requestId,
      fromUid,
      toUid: target.uid,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.friendRequests.set(requestId, request);
    return { ok: true, request };
  }

  respondRequest(userUid, requestId, action) {
    const req = this.friendRequests.get(requestId);
    if (!req) {
      throw { status: 404, message: 'Friend request not found' };
    }

    // Strict Authorization: User must be the recipient
    if (req.toUid !== userUid) {
      throw { status: 403, message: 'Forbidden: You cannot respond to another user\'s friend request' };
    }

    if (req.status !== 'pending') {
      throw { status: 400, message: 'This friend request has already been processed' };
    }

    if (action === 'accept') {
      req.status = 'accepted';
      const friendshipId = 'fr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const friendship = {
        id: friendshipId,
        userA: req.fromUid,
        userB: req.toUid,
        createdAt: new Date().toISOString()
      };
      this.friendships.set(friendshipId, friendship);
      return { ok: true, action: 'accepted', friendship };
    } else if (action === 'reject') {
      req.status = 'rejected';
      return { ok: true, action: 'rejected' };
    } else {
      throw { status: 400, message: 'Invalid action. Must be "accept" or "reject"' };
    }
  }

  removeFriend(userUid, friendUid) {
    let removed = false;
    for (const [id, f] of this.friendships.entries()) {
      if ((f.userA === userUid && f.userB === friendUid) || (f.userA === friendUid && f.userB === userUid)) {
        this.friendships.delete(id);
        removed = true;
      }
    }

    if (!removed) {
      throw { status: 404, message: 'Friendship not found' };
    }

    return { ok: true, removed: true };
  }

  getFriendsList(userUid) {
    const friends = [];
    for (const f of this.friendships.values()) {
      let otherId = null;
      if (f.userA === userUid) otherId = f.userB;
      else if (f.userB === userUid) otherId = f.userA;

      if (otherId) {
        const u = getUser(otherId) || { uid: otherId, username: 'sangat_' + otherId.slice(-4), displayName: 'Gursikh' };
        friends.push({
          friendshipId: f.id,
          uid: u.uid,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl || null,
          streak: u.streak || 0,
          since: f.createdAt
        });
      }
    }

    const incoming = [];
    const outgoing = [];
    for (const r of this.friendRequests.values()) {
      if (r.status === 'pending') {
        if (r.toUid === userUid) {
          const sender = getUser(r.fromUid) || { uid: r.fromUid, username: 'sangat', displayName: 'Gursikh Sangat' };
          incoming.push({
            id: r.id,
            from: { uid: sender.uid, username: sender.username, displayName: sender.displayName },
            createdAt: r.createdAt
          });
        } else if (r.fromUid === userUid) {
          const target = getUser(r.toUid) || { uid: r.toUid, username: 'sangat', displayName: 'Gursikh Sangat' };
          outgoing.push({
            id: r.id,
            to: { uid: target.uid, username: target.username, displayName: target.displayName },
            createdAt: r.createdAt
          });
        }
      }
    }

    return {
      friends,
      incomingRequests: incoming,
      outgoingRequests: outgoing
    };
  }
}

const friendsSingleton = new FriendsEngine();
friendsSingleton.FriendsEngine = FriendsEngine;
module.exports = friendsSingleton;
