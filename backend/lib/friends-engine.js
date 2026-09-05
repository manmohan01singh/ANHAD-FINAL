/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FRIENDS ENGINE & SANGAT CONNECTIVITY
 * ═══════════════════════════════════════════════════════════════════════════════
 * Handles username search, friend requests (Send -> Accept/Reject), friend removal,
 * and strict privacy isolation. Does NOT grant Companion status automatically.
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { registeredUsers, getUser, getUserByUsername, sanitizeString } = require('./auth-middleware');

const FRIENDS_DATA_FILE = path.join(__dirname, '..', 'data', 'friends-data.json');

class FriendsEngine {
  constructor() {
    // friendshipId -> { id, userA, userB, createdAt }
    this.friendships = new Map();
    // requestId -> { id, fromUid, toUid, status: 'pending'|'accepted'|'rejected', createdAt }
    this.friendRequests = new Map();

    this.loadFromDisk();
    this.seedInitialUsers();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(FRIENDS_DATA_FILE)) {
        const raw = fs.readFileSync(FRIENDS_DATA_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (data) {
          if (Array.isArray(data.friendships)) {
            data.friendships.forEach(f => {
              if (f && f.id) this.friendships.set(f.id, f);
            });
          }
          if (Array.isArray(data.friendRequests)) {
            data.friendRequests.forEach(r => {
              if (r && r.id) this.friendRequests.set(r.id, r);
            });
          }
        }
      }
    } catch (e) {
      console.warn('[FriendsEngine] friends-data.json load note:', e.message);
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(FRIENDS_DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const payload = {
        friendships: Array.from(this.friendships.values()),
        friendRequests: Array.from(this.friendRequests.values()),
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(FRIENDS_DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
      console.warn('[FriendsEngine] friends-data.json save note:', e.message);
    }
  }

  seedInitialUsers() {
    // Strictly zero dummy users. Real Sangat accounts only.
  }

  /**
   * Search users by username (case-insensitive prefix/contains)
   * Strictly filters out private info (email, phone, private progress).
   */
  searchUsers(query, currentUid) {
    const q = sanitizeString(query, 30).toLowerCase();
    if (!q || q.length < 2) return [];

    const results = [];
    const curLower = currentUid ? String(currentUid).toLowerCase().trim() : null;

    for (const u of registeredUsers.values()) {
      if (curLower && (
        u.uid.toLowerCase() === curLower || 
        (u.username && u.username.toLowerCase() === curLower)
      )) {
        continue; // Skip self
      }
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
    const raw = sanitizeString(toIdentifier, 100).trim();
    const lower = raw.toLowerCase();

    // Find target user by UID or username (both exact case and lowercase)
    let target = getUser(raw) || getUser(lower) || getUserByUsername(lower) || getUserByUsername(raw);
    if (!target) {
      throw { status: 404, message: 'User not found with specified username or ID' };
    }

    if (target.uid === fromUid || target.uid.toLowerCase() === fromUid.toLowerCase()) {
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
    this.saveToDisk();

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
      this.saveToDisk();

      return { ok: true, action: 'accepted', friendship };
    } else if (action === 'reject') {
      req.status = 'rejected';
      this.saveToDisk();
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

    this.saveToDisk();
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
            fromUid: sender.uid,
            fromUsername: sender.username,
            fromDisplayName: sender.displayName,
            from: { uid: sender.uid, username: sender.username, displayName: sender.displayName },
            createdAt: r.createdAt
          });
        } else if (r.fromUid === userUid) {
          const target = getUser(r.toUid) || { uid: r.toUid, username: 'sangat', displayName: 'Gursikh Sangat' };
          outgoing.push({
            id: r.id,
            toUid: target.uid,
            toUsername: target.username,
            toDisplayName: target.displayName,
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
